import {
  CheckCircleOutlined,
  CloseOutlined,
  DashboardOutlined,
  DownOutlined,
  ExclamationCircleOutlined,
  ProfileOutlined,
  QuestionCircleOutlined,
  ReloadOutlined,
  ThunderboltOutlined,
  UnorderedListOutlined,
  UpOutlined,
} from '@ant-design/icons';
import { Area, Line } from '@ant-design/plots';
import { PageContainer, ProCard, ProTable } from '@ant-design/pro-components';
import {
  Alert,
  Button,
  Card,
  Checkbox,
  Col,
  Descriptions,
  Divider,
  Drawer,
  message,
  Row,
  Space,
  Spin,
  Statistic,
  Tabs,
  Tag,
  Tooltip,
} from 'antd';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

// 导入接口 - 已切换为v2版本
import FlameGraphMain from '../../../components/flamegraph/index.jsx';
import GraphVisEGraphVisualizationxample from '../../../components/topology/index.jsx';
import {
  getFilterFields,            // v2: 查询表过滤字段配置 - FilterFieldsDTO
  getFlamegraphDataByTraceId, // v1: 火焰图数据（暂无v2版本）
  querySpanDetailsByTrace,    // v2: 根据TraceId查询Span明细 - SpanDTO
  queryTraceCountTimeSeries,  // v2: 查询Trace请求数时间序列 - TimeSeriesDTO
  queryTraceErrorTimeSeries,  // v2: 查询Trace错误数时间序列 - TimeSeriesDTO
  queryTraceLatencyTimeSeries,// v2: 查询Trace响应时延时间序列 - TimeSeriesDTO
  queryTraceList,             // v2: 查询Trace列表（分页） - TraceInfoDTO
  getEsNodesLog,              // v1: 节点日志（暂无v2版本）
  getEsEdgesLog               // v1: 边日志（暂无v2版本）
} from '../../../services/server.js';

import { convertToGraphStructure } from '../../../utils/convert2graph.js';
import { transformToTree } from '../../../utils/span2tree.js';

const { TabPane } = Tabs;

const requestData = [
  {
    timeKey: 1755926160000,
    docCount: 166,
  },
  {
    timeKey: 1755926220000,
    docCount: 142,
  },
  {
    timeKey: 1755926340000,
    docCount: 217,
  },
  {
    timeKey: 1755926460000,
    docCount: 98,
  },
  {
    timeKey: 1755926580000,
    docCount: 183,
  },
  {
    timeKey: 1755926700000,
    docCount: 205,
  },
];

const errorData = [
  {
    statusCode: '200',
    timeBuckets: [
      {
        timeKey: 1726058800000,
        docCount: 166,
      },
      {
        timeKey: 1726059400000,
        docCount: 142,
      },
      {
        timeKey: 1726060000000,
        docCount: 217,
      },
      {
        timeKey: 1726060600000,
        docCount: 98,
      },
      {
        timeKey: 1726061200000,
        docCount: 183,
      },
      {
        timeKey: 1726061800000,
        docCount: 205,
      },
    ],
  },
  {
    statusCode: '201',
    timeBuckets: [
      {
        timeKey: 1726058800000,
        docCount: 121,
      },
      {
        timeKey: 1726059400000,
        docCount: 124,
      },
      {
        timeKey: 1726060000000,
        docCount: 253,
      },
      {
        timeKey: 1726060600000,
        docCount: 123,
      },
      {
        timeKey: 1726061200000,
        docCount: 214,
      },
      {
        timeKey: 1726061800000,
        docCount: 100,
      },
    ],
  },
];

const latencyData = [
  {
    timeKey: 1755926160000,
    avgDuration: 6196366.753012048,
    p75Duration: 0,
    p90Duration: '8239017.699999997',
    p99Duration: 0,
  },
];

// 固定的筛选项数据
const FIXED_ENDPOINTS = [
  "UnknownEndpoint",
  "ComposeUrls",
  "endpoint3",
  "endpoint4",
  "WriteUserTimeline",
  "ComposeCreatorWithUserId",
  "GetFollowers",
  "ComposeUniqueId",
  "StorePost",
  "WriteHomeTimeline",
  "findAndModify",
  "insert",
  "ComposeMedia",
  "ComposeUserMentions",
  "find",
  "ComposeText",
  "ZADD"
];

const FIXED_PROTOCOLS = [
  "MongoDB",
  "Thrift",
  "Redis",
  "Memcached",
  "Kafka"
];

// 防抖函数
const debounce = (func, wait) => {
  let timeout;
  const debounced = (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
  debounced.cancel = () => clearTimeout(timeout);
  return debounced;
};

// 节流函数
const throttle = (func, limit) => {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// 主监控组件
const PointDrawer = ({ 
  selectId,
  startTime,
  endTime,
  pointType,
  sourceId,
  targetId,
  selectedObj
}) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [chartLoading, setChartLoading] = useState(false);
  
  // 移除了状态码筛选，只保留端点和协议筛选
  const [endpointFilters, setEndpointFilters] = useState(FIXED_ENDPOINTS);
  const [protocolFilters, setProtocolFilters] = useState(FIXED_PROTOCOLS);
  const [tableListDataSource, setTableListDataSource] = useState([]);

  // 使用ref来存储当前筛选状态，避免闭包问题
  const filtersRef = useRef({
    endpointFilters: FIXED_ENDPOINTS,
    protocolFilters: FIXED_PROTOCOLS,
    pagination: {
      pageNum: 1,
      pageSize: 10,
      total: 0,
    }
  });

  // 更新ref中的筛选状态
  useEffect(() => {
    filtersRef.current.endpointFilters = endpointFilters;
  }, [endpointFilters]);

  useEffect(() => {
    filtersRef.current.protocolFilters = protocolFilters;
  }, [protocolFilters]);

  useEffect(() => {
    filtersRef.current.pagination = pagination;
  }, [pagination]);

  // 图表数据状态
  const [chartData, setChartData] = useState({
    requestData, // type=count
    errorData: [], // type=statusCount
    latencyData: [], // type=latencyStats
  });

  // 分页相关状态
  const [pagination, setPagination] = useState({
    pageNum: 1,
    pageSize: 10,
    total: 0,
  });

  const [allEndpoints, setAllEndpoints] = useState(FIXED_ENDPOINTS);
  const [allProtocols, setAllProtocols] = useState(FIXED_PROTOCOLS);

  // 抽屉状态
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [currentTrace, setCurrentTrace] = useState(null);
  const [traceDetailLoading, setTraceDetailLoading] = useState(false);
  const [spanData, setSpanData] = useState([]);
  const [drawerWidth, setDrawerWidth] = useState(1600);
  const [originalSpanTableHeight, setOriginalSpanTableHeight] = useState(300);

  const [graphData, setGraphData] = useState({});
  const [relationData, setRelationData] = useState({});
  const [flameTreeData, setFlameTreeData] = useState([]);

  const [showSpanTable, setShowSpanTable] = useState(false);
  const [spanTableHeight, setSpanTableHeight] = useState(300);

  // 耗时阈值配置
  const DURATION_THRESHOLD = {
    NORMAL: 5 * 1000 * 1000,
    UNKNOWN: 10 * 1000 * 1000,
  };

  // 获取表格数据函数 - 修复闭包问题
  const fetchTraceData = useCallback(async (currentFilters = null) => {
    setLoading(true);
    try {
      // 使用传入的筛选条件，如果没有传入则使用ref中的最新值
      const currentEndpointFilters = currentFilters?.endpointFilters || filtersRef.current.endpointFilters;
      const currentProtocolFilters = currentFilters?.protocolFilters || filtersRef.current.protocolFilters;
      const currentPagination = currentFilters?.pagination || filtersRef.current.pagination;

      console.log('接口调用参数 - 端点筛选:', currentEndpointFilters);
      console.log('接口调用参数 - 协议筛选:', currentProtocolFilters);
      console.log('接口调用参数 - 分页:', currentPagination);

      const baseParams = {
        pageNum: currentPagination.pageNum,
        pageSize: currentPagination.pageSize,
        startTime: startTime,
        endTime: endTime,
        endpoints: currentEndpointFilters,
        protocols: currentProtocolFilters,
      };

      let response;
      
      if (pointType === 'node') {
        const params = {
          ...baseParams,
          nodeId: selectId
        };
        response = await getEsNodesLog(params);
      } else if (pointType === 'edge') {
        const params = {
          ...baseParams,
          srcNodeId: sourceId,
          dstNodeId: targetId
        };
        response = await getEsEdgesLog(params);
      } else {
        response = await queryTraceList(baseParams);  // v2: 查询Trace列表
      }

      let dataList = [];
      let totalCount = 0;

      if (response && typeof response === 'object') {
        // v2返回格式: { totalCount, data: TraceInfoDTO[] }
        if (response.data && Array.isArray(response.data)) {
          dataList = response.data;
          totalCount = response.totalCount || 0;
        } else if (response.content && typeof response.totalElements !== 'undefined') {
          dataList = response.content;
          totalCount = response.totalElements;
        } else if (response.data && response.data.records) {
          dataList = response.data.records;
          totalCount = response.data.total || 0;
        } else if (Array.isArray(response)) {
          dataList = response;
          totalCount = response.length;
        } else {
          dataList = response.records || response.list || response.data || [];
          totalCount = response.total || response.totalElements || dataList.length;
        }
      }

      setTableListDataSource(dataList);
      setPagination(prev => ({
        ...prev,
        total: totalCount,
      }));

      console.log(`获取${pointType}类型日志数据成功，数据量:`, dataList.length, '总数:', totalCount);

    } catch (error) {
      message.error(`${pointType === 'node' ? '节点' : '边'}日志数据获取失败，请刷新重试`);
      console.error(`${pointType}日志数据获取失败:`, error);
    } finally {
      setLoading(false);
    }
  }, [startTime, endTime, pointType, selectId, sourceId, targetId]);

  // 修复的端点筛选处理函数
  const handleEndpointFilterChange = (checkedValues) => {
    console.log('端点筛选变化:', checkedValues);
    
    // 确保至少选择一项
    if (checkedValues.length === 0) {
      message.warning('至少需要选择一个端点');
      setEndpointFilters(FIXED_ENDPOINTS);
      return;
    }
    
    // 立即设置loading状态
    setLoading(true);
    setPagination(prev => ({ ...prev, pageNum: 1 }));
    
    // 同步更新状态和ref
    setEndpointFilters(checkedValues);
    filtersRef.current.endpointFilters = checkedValues;
    filtersRef.current.pagination = { ...filtersRef.current.pagination, pageNum: 1 };
    
    // 使用setTimeout确保状态更新后再调用API
    setTimeout(() => {
      fetchTraceData({
        endpointFilters: checkedValues,
        protocolFilters: filtersRef.current.protocolFilters,
        pagination: { ...filtersRef.current.pagination, pageNum: 1 }
      });
    }, 0);
  };

  // 修复的协议筛选处理函数
  const handleProtocolFilterChange = (checkedValues) => {
    console.log('协议筛选变化:', checkedValues);
    
    // 确保至少选择一项
    if (checkedValues.length === 0) {
      message.warning('至少需要选择一个协议');
      setProtocolFilters(FIXED_PROTOCOLS);
      return;
    }
    
    // 立即设置loading状态
    setLoading(true);
    setPagination(prev => ({ ...prev, pageNum: 1 }));
    
    // 同步更新状态和ref
    setProtocolFilters(checkedValues);
    filtersRef.current.protocolFilters = checkedValues;
    filtersRef.current.pagination = { ...filtersRef.current.pagination, pageNum: 1 };
    
    // 使用setTimeout确保状态更新后再调用API
    setTimeout(() => {
      fetchTraceData({
        endpointFilters: filtersRef.current.endpointFilters,
        protocolFilters: checkedValues,
        pagination: { ...filtersRef.current.pagination, pageNum: 1 }
      });
    }, 0);
  };

  // 修复的全选/取消全选处理函数
  const handleToggleAllEndpoints = useCallback(() => {
    const newFilters = endpointFilters.length === FIXED_ENDPOINTS.length ? [] : [...FIXED_ENDPOINTS];
    
    // 确保至少选择一项
    if (newFilters.length === 0) {
      message.warning('至少需要选择一个端点');
      return;
    }
    
    console.log('端点全选/取消全选:', newFilters);
    
    setLoading(true);
    setPagination(prev => ({ ...prev, pageNum: 1 }));
    
    // 同步更新状态和ref
    setEndpointFilters(newFilters);
    filtersRef.current.endpointFilters = newFilters;
    filtersRef.current.pagination = { ...filtersRef.current.pagination, pageNum: 1 };
    
    // 使用setTimeout确保状态更新后再调用API
    setTimeout(() => {
      fetchTraceData({
        endpointFilters: newFilters,
        protocolFilters: filtersRef.current.protocolFilters,
        pagination: { ...filtersRef.current.pagination, pageNum: 1 }
      });
    }, 0);
  }, [endpointFilters, fetchTraceData]);

  const handleToggleAllProtocols = useCallback(() => {
    const newFilters = protocolFilters.length === FIXED_PROTOCOLS.length ? [] : [...FIXED_PROTOCOLS];
    
    // 确保至少选择一项
    if (newFilters.length === 0) {
      message.warning('至少需要选择一个协议');
      return;
    }
    
    console.log('协议全选/取消全选:', newFilters);
    
    setLoading(true);
    setPagination(prev => ({ ...prev, pageNum: 1 }));
    
    // 同步更新状态和ref
    setProtocolFilters(newFilters);
    filtersRef.current.protocolFilters = newFilters;
    filtersRef.current.pagination = { ...filtersRef.current.pagination, pageNum: 1 };
    
    // 使用setTimeout确保状态更新后再调用API
    setTimeout(() => {
      fetchTraceData({
        endpointFilters: filtersRef.current.endpointFilters,
        protocolFilters: newFilters,
        pagination: { ...filtersRef.current.pagination, pageNum: 1 }
      });
    }, 0);
  }, [protocolFilters, fetchTraceData]);

  // 初始化数据
  useEffect(() => {
    if (selectId) {
      // 重置所有筛选条件为全选状态
      setEndpointFilters(FIXED_ENDPOINTS);
      setProtocolFilters(FIXED_PROTOCOLS);
      
      // 重置分页到第一页
      setPagination(prev => ({
        ...prev,
        pageNum: 1
      }));
      
      // 更新ref
      filtersRef.current.endpointFilters = FIXED_ENDPOINTS;
      filtersRef.current.protocolFilters = FIXED_PROTOCOLS;
      filtersRef.current.pagination = { ...filtersRef.current.pagination, pageNum: 1 };
      
      // 重新获取数据
      fetchFilterOptions();
      fetchChartData();
      fetchTraceData({
        endpointFilters: FIXED_ENDPOINTS,
        protocolFilters: FIXED_PROTOCOLS,
        pagination: { ...filtersRef.current.pagination, pageNum: 1 }
      });
    }
  }, [pointType, selectId, sourceId, targetId]);

  const getFlamegraphDataByTraceIdFun = async (traceId) => {
    console.log(traceId, "ttttt1");

    const res = await getFlamegraphDataByTraceId(traceId);
    console.log(res, 'rrrrr');

    const spansList = res?.data?.records;
    const relationData = res?.data?.data;

    const spans = spansList?.map((spans_ori) => {
      return {
        ...spans_ori.metric,
        ...spans_ori.content,
        ...spans_ori.context,
        ...spans_ori.tag.ebpf_tag,
        ...spans_ori.tag.docker_tag,
      };
    });
    const spansTree = transformToTree(spans);
    console.log(spans, spansTree, '火焰图原始数据--');

    setFlameTreeData(spansTree);

    setGraphData(convertToGraphStructure(spans));
    setRelationData(relationData);
  };

  const fetchFilterOptions = async () => {
    try {
      setAllEndpoints(FIXED_ENDPOINTS);
      setAllProtocols(FIXED_PROTOCOLS);
      
      setEndpointFilters(FIXED_ENDPOINTS);
      setProtocolFilters(FIXED_PROTOCOLS);

    } catch (error) {
      message.error('初始化筛选选项失败');
      console.error('Filter options init error:', error);
    }
  };

  function transformData(originalData) {
    const transformedData = [];

    for (const statusObj of originalData) {
      const statusCode = statusObj.statusCode;

      for (const timeBucket of statusObj.timeBuckets) {
        const newObj = {
          type: statusCode,
          timeKey: timeBucket.timeKey,
          docCount: timeBucket.docCount,
        };
        transformedData.push(newObj);
      }
    }

    return transformedData;
  }

  // v2: 获取图表数据函数 - 使用Trace时序接口 (TimeSeriesDTO)
  const fetchChartData = async () => {
    setChartLoading(true);
    try {
      const [requestResponse, errorResponse, latencyResponse] = await Promise.all([
        queryTraceCountTimeSeries(),     // v2: 请求数时序
        queryTraceErrorTimeSeries(),     // v2: 错误数时序
        queryTraceLatencyTimeSeries(),   // v2: 响应时延时序
      ]);
      console.log(requestResponse, errorResponse, latencyResponse, 'v2 chart data');

    } catch (error) {
      message.error('图表数据获取失败');
      console.error('Chart data fetch error:', error);
    } finally {
      setChartLoading(false);
    }
  };

  // v2: 获取Trace详情数据 - querySpanDetailsByTrace (SpanDTO)
  const fetchTraceDetail = async (traceId) => {
    setTraceDetailLoading(true);
    try {
      const response = await querySpanDetailsByTrace({ traceId });
      console.log(response, 'response');

      const traceDetail = response?.content[0] || {};

      setCurrentTrace(traceDetail);

      if (traceDetail.spans && Array.isArray(traceDetail.spans)) {
        const spans = traceDetail.spans.map((span) => {
          return {
            ...span.metric,
            ...span.content,
            ...span.context,
            ...span.tag.ebpf_tag,
            ...span.tag.docker_tag,
          };
        });
        console.log(spans, 'spans');

        setSpanData(spans);
      } else {
        setSpanData([]);
        message.warning('未找到Span数据');
      }
    } catch (error) {
      message.error('获取Trace详情失败');
      console.error('Trace detail fetch error:', error);
    } finally {
      setTraceDetailLoading(false);
    }
  };

  // 根据耗时计算状态
  const getStatusByDuration = (duration) => {
    if (duration <= DURATION_THRESHOLD.NORMAL) return 'normal';
    if (duration <= DURATION_THRESHOLD.UNKNOWN) return 'unknown';
    return 'error';
  };

  const getStatusByCode = (code) => {
    const code_num = Number(code);
    if ([102, 100, 101].includes(code_num)) {
      return 'handling';
    }
    if ([200, 201, 202, 205].includes(code_num)) {
      return 'success';
    }
    return 'error';
  };

  // 状态标签渲染
  const renderStatusTag = (item) => {
    const status = getStatusByCode(Number(item));
    const statusConfig = {
      success: { color: 'green', text: '正常', icon: <CheckCircleOutlined /> },
      handling: { color: 'orange', text: '处理中', icon: <QuestionCircleOutlined /> },
      error: { color: 'red', text: '异常', icon: <ExclamationCircleOutlined /> },
    };
    const config = statusConfig[status];
    return (
      <Tag color={config.color} icon={config.icon}>
        {config.text}（{item}）
      </Tag>
    );
  };

  // 详情页跳转处理
  const handleViewDetail = async (record) => {
    setTraceDetailLoading(true);
    setDrawerVisible(true);

    try {
      await Promise.all([
        getFlamegraphDataByTraceIdFun(record.context.trace_id),
        fetchTraceDetail(record.context.trace_id),
      ]);
    } catch (error) {
      console.error('获取详情数据失败:', error);
    } finally {
      setTraceDetailLoading(false);
    }
  };

  // 关闭抽屉
  const handleCloseDrawer = () => {
    setDrawerVisible(false);
    setCurrentTrace(null);
    setSpanData([]);
    setShowSpanTable(false);
    setSpanTableHeight(300);
  };

  // 图表配置
  const requestChartConfig = {
    data: requestData,
    xField: 'timeKey',
    yField: 'docCount',
    height: 200,
    xAxis: {
      type: 'time',
      label: {
        formatter: (v) => {
          return new Date(v).toLocaleTimeString('zh-CN', {
            hour: '2-digit',
            minute: '2-digit',
          });
        },
      },
    },
    yAxis: {
      label: {
        style: { fontSize: 12 },
        formatter: (value) => `${value} 次`,
      },
    },
    point: {
      shapeField: 'square',
      sizeField: 4,
    },
    interaction: {
      tooltip: {
        marker: false,
        formatter: (datum) => {
          const formatTime = new Date(datum.timeKey).toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
          });
          return [
            { name: '时间', value: formatTime },
            { name: '请求数', value: `${datum.docCount} 次` },
          ];
        },
      },
    },
    style: {
      lineWidth: 2,
    },
  };

  const transformedErrorData = transformData(errorData);

  const errorChartConfig = {
    data: transformedErrorData,
    xField: 'timeKey',
    yField: 'docCount',
    seriesField: 'type',
    height: 200,
    color: ({ type }) => {
      const colorMap = {
        200: '#1890ff',
        201: '#52c41a',
        404: '#faad14',
        500: '#ff4d4f',
      };
      return colorMap[type] || '#8c8c8c';
    },
    line: {
      style: {
        lineWidth: 2,
      },
    },
    point: {
      shape: 'circle',
      size: 4,
      fill: ({ type }) => {
        const colorMap = {
          200: '#1890ff',
          201: '#52c41a',
          404: '#faad14',
          500: '#ff4d4f',
        };
        return colorMap[type] || '#8c8c8c';
      },
      stroke: '#fff',
      strokeWidth: 1,
    },
    xAxis: {
      type: 'time',
      tickCount: 5,
      label: {
        fontSize: 12,
        formatter: (timestamp) => {
          return new Date(timestamp).toLocaleTimeString('zh-CN', {
            hour: '2-digit',
            minute: '2-digit',
          });
        },
      },
      range: [0.05, 0.95],
    },
    yAxis: {
      label: {
        fontSize: 12,
        formatter: (value) => `${value} 次`,
      },
      min: 0,
      tickCount: 4,
    },
    legend: {
      position: 'top',
      title: {
        text: '响应状态码',
        fontSize: 12,
        padding: [0, 0, 4, 0],
      },
      label: {
        fontSize: 12,
        formatter: (type) => `状态码 ${type}`,
      },
      interactive: true,
    },
    interaction: {
      tooltip: {
        marker: true,
        formatter: (datum) => {
          const fullTime = new Date(datum.timeKey).toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          });
          return [
            { name: '时间', value: fullTime },
            { name: '响应状态码', value: datum.type },
            { name: '错误数', value: `${datum.docCount} 次` },
          ];
        },
      },
    },
    grid: {
      horizontal: {
        visible: true,
        style: {
          stroke: '#e8e8e8',
          opacity: 0.5,
        },
      },
      vertical: {
        visible: false,
      },
    },
  };

  const latencyChartConfig = {
    data: chartData.latencyData,
    xField: 'time',
    yField: 'latency',
    seriesField: 'type',
    height: 200,
    color: ['#1979C9', '#D62A0D', '#FAA219'],
    xAxis: {
      label: {
        autoRotate: false,
      },
    },
    tooltip: {
      formatter: (datum) => {
        return { name: datum.type, value: `${datum.latency.toFixed(2)}ms` };
      },
    },
  };

  // 计算图表统计数据
  const totalRequests = chartData.requestData.reduce((sum, item) => sum + item.count, 0);
  const totalErrors = chartData.errorData.reduce((sum, item) => sum + item.count, 0);
  const avgLatency =
    chartData.latencyData.length > 0
      ? (
          chartData.latencyData.reduce((sum, item) => sum + item.latency, 0) /
          chartData.latencyData.length
        ).toFixed(2)
      : 0;

  function addNodeLevels(nodes = []) {
    console.log(nodes, 'nodes2');

    const spanToNode = {};
    nodes.forEach((node) => {
      spanToNode[node.span_id] = { ...node };
    });

    let root = null;
    for (const node of nodes) {
      if (node.parent_id === null) {
        root = spanToNode[node.span_id];
        break;
      }
    }

    if (!root) {
      root = { span_id: null, level: 0, child_ids: [] }
    }

    root.level = 0;

    const queue = [root];
    while (queue.length > 0) {
      const currentNode = queue.shift();

      currentNode.child_ids.forEach((childSpanId) => {
        const childNode = spanToNode[childSpanId];
        if (childNode) {
          childNode.level = currentNode.level + 1;
          queue.push(childNode);
        }
      });
    }

    return nodes.map((node) => spanToNode[node.span_id]);
  }

  // 获取当前对象信息显示文本
  const getCurrentObjectInfo = () => {
    if (pointType === 'node') {
      return `节点ID: ${selectId}`;
    } else if (pointType === 'edge') {
      return `边: ${sourceId} → ${targetId}`;
    }
    return '未知对象';
  };

  return (
    <PageContainer
      content={
        <div>
          <Alert
            message={`${pointType === 'node' ? '节点' : '边'}调用日志监控 - ${getCurrentObjectInfo()} - 时间范围: ${startTime ? new Date(startTime).toLocaleString() : '未知'} 至 ${endTime ? new Date(endTime).toLocaleString() : '未知'}`}
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <DashboardOutlined style={{ marginRight: 8, fontSize: 18 }} />
            <span>{pointType === 'node' ? '节点' : '边'}调用日志监控</span>
          </div>
        </div>
      }
    >
      {/* 使用Spin组件包裹整个内容区域 */}
      <Spin spinning={loading} tip="数据加载中..." size="large" style={{ minHeight: 400 }}>
        <ProCard split="vertical" gutter={16}>
          {/* 左侧筛选面板 */}
          <ProCard title="监控筛选" colSpan="20%" headerBordered extra={<ThunderboltOutlined />}>
            {/* 端点筛选 */}
            <div style={{ marginBottom: 16 }}>
              <Divider orientation="left" plain>
                端点
              </Divider>
              <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>已选择 {endpointFilters.length} 个</span>
                <Button 
                  type="link" 
                  size="small" 
                  onClick={handleToggleAllEndpoints}
                >
                  {endpointFilters.length === FIXED_ENDPOINTS.length ? '取消全选' : '全选'}
                </Button>
              </div>
              <Checkbox.Group
                value={endpointFilters}
                onChange={handleEndpointFilterChange}
                style={{ width: '100%' }}
              >
                <Row gutter={[8, 8]}>
                  {allEndpoints.map((endpoint) => (
                    <Col span={24} key={endpoint}>
                      <Checkbox value={endpoint} style={{ fontSize: '12px', width: '100%' }}>
                        {endpoint}
                      </Checkbox>
                    </Col>
                  ))}
                </Row>
              </Checkbox.Group>
            </div>

            {/* 协议筛选 */}
            <div style={{ marginBottom: 16 }}>
              <Divider orientation="left" plain>
                应用协议
              </Divider>
              <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>已选择 {protocolFilters.length} 个</span>
                <Button 
                  type="link" 
                  size="small" 
                  onClick={handleToggleAllProtocols}
                >
                  {protocolFilters.length === FIXED_PROTOCOLS.length ? '取消全选' : '全选'}
                </Button>
              </div>
              <Checkbox.Group
                value={protocolFilters}
                onChange={handleProtocolFilterChange}
                style={{ width: '100%' }}
              >
                <Row gutter={[8, 8]}>
                  {allProtocols.map((protocol) => (
                    <Col span={24} key={protocol}>
                      <Checkbox value={protocol} style={{ fontSize: '12px', width: '100%' }}>
                        {protocol}
                      </Checkbox>
                    </Col>
                  ))}
                </Row>
              </Checkbox.Group>
            </div>

            {/* 筛选统计与重置 */}
            <Divider />
            <div>
              <Statistic title="总监控项" value={pagination.total} />
              <Button
                type="primary"
                block
                onClick={() => {
                  // 重置为全选状态
                  setEndpointFilters(FIXED_ENDPOINTS);
                  setProtocolFilters(FIXED_PROTOCOLS);
                  setPagination(prev => ({
                    ...prev,
                    pageNum: 1,
                  }));
                  
                  // 更新ref
                  filtersRef.current.endpointFilters = FIXED_ENDPOINTS;
                  filtersRef.current.protocolFilters = FIXED_PROTOCOLS;
                  filtersRef.current.pagination = { ...filtersRef.current.pagination, pageNum: 1 };
                  
                  setLoading(true);
                  fetchTraceData({
                    endpointFilters: FIXED_ENDPOINTS,
                    protocolFilters: FIXED_PROTOCOLS,
                    pagination: { ...filtersRef.current.pagination, pageNum: 1 }
                  });
                }}
                style={{ marginBottom: 8 }}
              >
                重置为全选
              </Button>
              <Button
                block
                onClick={() => {
                  setLoading(true);
                  setChartLoading(true);
                  fetchTraceData();
                  fetchChartData();
                }}
                loading={loading || chartLoading}
                icon={<ReloadOutlined />}
              >
                刷新数据
              </Button>
            </div>
          </ProCard>

          {/* 右侧表格区域 */}
          <ProCard title={`${pointType === 'node' ? '节点' : '边'}调用日志数据`} headerBordered>
            {/* 空数据提示 */}
            {tableListDataSource.length === 0 && !loading && (
              <Alert
                message={`暂无符合条件的${pointType === 'node' ? '节点' : '边'}调用日志数据`}
                type="warning"
                showIcon
                style={{ marginBottom: 16 }}
              />
            )}

            {/* 表格 */}
            <ProTable
              columns={[
                {
                  title: '追踪ID',
                  key: 'traceId',
                  width: 180,
                  render: (_, record) => {
                    const traceId = record?.context?.trace_id || '未知';
                    return <span title={traceId}>{traceId}</span>;
                  },
                },
                {
                  title: '链路状态',
                  key: 'status',
                  width: 140,
                  render: (_, record) => renderStatusTag(record?.status_code),
                },
                {
                  title: '客户端IP',
                  dataIndex: 'client_ip',
                  key: 'client_ip',
                  render: (_, record) => record?.tag?.ebpf_tag?.dst_ip,
                  width: 120,
                },
                {
                  title: '客户端端口',
                  dataIndex: 'client_port',
                  key: 'client_port',
                  render: (_, record) => (record?.tag?.ebpf_tag?.dst_port),
                  width: 100,
                },
                {
                  title: '组件名称',
                  dataIndex: 'component_name',
                  key: 'component_name',
                  render: (_, record) => (record?.component),
                  width: 140,
                },
                {
                  title: '请求端点',
                  dataIndex: 'endpoint',
                  key: 'endpoint',
                  render: (_, record) => (record?.tag?.ebpf_tag?.endpoint),
                  width: 120,
                },
                {
                  title: '传输协议',
                  dataIndex: 'protocol',
                  key: 'protocol',
                  render: (_, record) => (record?.tag?.ebpf_tag?.protocol),
                  width: 100,
                },
                {
                  title: '服务端IP',
                  dataIndex: 'server_ip',
                  key: 'server_ip',
                  render: (_, record) => (record?.tag?.ebpf_tag?.src_ip),
                  width: 120,
                },
                {
                  title: '服务端端口',
                  dataIndex: 'server_port',
                  key: 'server_port',
                  render: (_, record) => (record?.tag?.ebpf_tag?.src_port),
                  width: 100,
                },
                {
                  title: '端到端耗时',
                  dataIndex: 'e2e_duration',
                  key: 'e2e_duration',
                  width: 130,
                  render: (_, record) => {
                    const duration = record?.metric?.duration || 0;
                    const ms = duration / 1000;
                    let color = '#52c41a';
                    if (ms > 10) color = '#ff4d4f';
                    else if (ms > 5) color = '#faad14';
                    return <span style={{ color }}>{ms.toFixed(2)} ms</span>;
                  },
                },
                {
                  title: '结束时间',
                  dataIndex: 'end_time',
                  key: 'end_time',
                  width: 160,
                  render: (_, record) => {
                    const time = record?.metric?.end_time;
                    if (!time) return '未知';
                    return new Date(time).toLocaleString('zh-CN', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    });
                  },
                },
                {
                  title: '操作',
                  key: 'action',
                  width: 80,
                  render: (_, record) => (
                    <Button type="link" size="small" onClick={() => handleViewDetail(record)}>
                      详情
                    </Button>
                  ),
                },
              ]}
              dataSource={tableListDataSource}
              pagination={{
                current: pagination.pageNum,
                pageSize: pagination.pageSize,
                total: pagination.total,
                showSizeChanger: false,
                showQuickJumper: true,
                showTotal: (total) => `共 ${total} 条数据`,
                onChange: (page, pageSize) => {
                  setLoading(true);
                  setPagination(prev => ({
                    ...prev,
                    pageNum: page,
                  }));
                  
                  // 更新ref
                  filtersRef.current.pagination = { ...filtersRef.current.pagination, pageNum: page };
                  
                  // 使用setTimeout确保状态更新后再调用API
                  setTimeout(() => {
                    fetchTraceData({
                      endpointFilters: filtersRef.current.endpointFilters,
                      protocolFilters: filtersRef.current.protocolFilters,
                      pagination: { ...filtersRef.current.pagination, pageNum: page }
                    });
                  }, 0);
                },
              }}
              search={false}
              rowKey={(record) =>
                record.trace_id || `${record.client_ip}-${record.client_port}-${record.endpoint}`
              }
              toolBarRender={false}
              style={{ minHeight: 400 }}
            />
          </ProCard>
        </ProCard>
      </Spin>

      {/* Trace详情抽屉 */}
      <Drawer
        title={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <ProfileOutlined style={{ marginRight: 8, fontSize: 18 }} />
            <span style={{ fontSize: 18, fontWeight: 'bold' }}>Trace链路详情</span>
          </div>
        }
        width={drawerWidth}
        closable={true}
        onClose={handleCloseDrawer}
        open={drawerVisible}
        extra={
          <Space>
            <Button
              icon={<UnorderedListOutlined />}
              onClick={() => setShowSpanTable(!showSpanTable)}
              type={showSpanTable ? 'primary' : 'default'}
              title={showSpanTable ? '隐藏Span表格' : '显示Span表格'}
            />
            <Button
              icon={<CloseOutlined />}
              onClick={handleCloseDrawer}
              style={{ border: 'none', fontSize: 16 }}
            />
          </Space>
        }
        bodyStyle={{ padding: 24, display: 'flex', flexDirection: 'column', height: '100%' }}
      >
        <Spin spinning={traceDetailLoading} tip="加载Trace详情中..." size="large">
          {currentTrace ? (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
                <Tabs
                  defaultActiveKey="1"
                  type="card"
                  style={{ height: '100%' }}
                  tabBarStyle={{ marginBottom: 0 }}
                >
                  {/* Tab 1: 链路基本信息 */}
                  <TabPane tab="链路基本信息" key="1">
                    <div style={{ height: '100%', overflowY: 'auto' }}>
                      <Card
                        title="链路基本信息"
                        bordered={false}
                        style={{ marginBottom: 24 }}
                        headStyle={{ fontSize: 16, fontWeight: 'bold' }}
                      >
                        <Row gutter={24}>
                          <Col span={12}>
                            <Descriptions column={1} size="middle">
                              <Descriptions.Item label="追踪ID">
                                <Tag color="blue" style={{ fontSize: 14 }}>
                                  {currentTrace.trace_id}
                                </Tag>
                              </Descriptions.Item>
                              <Descriptions.Item label="端点">
                                <div style={{ fontWeight: 'bold', fontSize: 15 }}>
                                  {currentTrace.endpoint}
                                </div>
                              </Descriptions.Item>
                              <Descriptions.Item label="协议">
                                <Tag color="purple" style={{ fontSize: 14 }}>
                                  {currentTrace.protocol}
                                </Tag>
                              </Descriptions.Item>
                            </Descriptions>
                          </Col>
                          <Col span={12}>
                            <Descriptions column={1} size="middle">
                              <Descriptions.Item label="客户端">
                                <div style={{ fontWeight: 'bold' }}>
                                  {currentTrace.client_ip}:{currentTrace.client_port}
                                </div>
                              </Descriptions.Item>
                              <Descriptions.Item label="服务端">
                                <div style={{ fontWeight: 'bold' }}>
                                  {currentTrace.server_ip}:{currentTrace.server_port}
                                </div>
                              </Descriptions.Item>
                              <Descriptions.Item label="端到端耗时">
                                <span style={{ fontWeight: 'bold', fontSize: 16, color: '#1890ff' }}>
                                  {(currentTrace.e2e_duration / 1000).toFixed(2)} ms
                                </span>
                              </Descriptions.Item>
                              <Descriptions.Item label="Span数量">
                                <span style={{ fontWeight: 'bold', fontSize: 16 }}>
                                  {currentTrace.span_num}
                                </span>
                              </Descriptions.Item>
                            </Descriptions>
                          </Col>
                        </Row>
                      </Card>

                      <Card
                        title="原始数据"
                        bordered={false}
                        headStyle={{ fontSize: 16, fontWeight: 'bold' }}
                      >
                        <pre
                          style={{
                            background: '#f6f8fa',
                            padding: 16,
                            borderRadius: 4,
                            maxHeight: 300,
                            overflowY: 'auto',
                            fontSize: 13,
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-all',
                          }}
                        >
                          {JSON.stringify(currentTrace, null, 2)}
                        </pre>
                      </Card>
                    </div>
                  </TabPane>

                  <TabPane tab="拓扑图" key="2">
                    <div style={{ height: '100%', overflowY: 'auto' }}>
                      <Card
                        bordered={false}
                        style={{
                          height: '100%',
                          minHeight: '600px',
                        }}
                        bodyStyle={{
                          height: 'calc(100% - 6px)',
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          background: '#f9f9f9',
                        }}
                      >
                        <div style={{ textAlign: 'center', width: '100%' }}>
                          <GraphVisEGraphVisualizationxample
                            nodes={addNodeLevels(graphData.nodes)}
                            edges={graphData.edges}
                            relationData={relationData}
                          ></GraphVisEGraphVisualizationxample>
                        </div>
                      </Card>
                    </div>
                  </TabPane>

                  <TabPane tab="火焰图" key="3">
                    <div style={{ height: '100%', overflowY: 'auto' }}>
                      <Card
                        bordered={false}
                        style={{ height: '100%' }}
                        bodyStyle={{
                          height: 'calc(100% - 56px)',
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          background: '#f9f9f9',
                        }}
                      >
                        <div style={{ width: '100%' }}>
                          <FlameGraphMain data={flameTreeData}></FlameGraphMain>
                        </div>
                      </Card>
                    </div>
                  </TabPane>
                </Tabs>
              </div>

              {showSpanTable && (
                <Card
                  title="调用详情"
                  bordered={false}
                  style={{ marginTop: 16, flexShrink: 0, height: spanTableHeight }}
                  headStyle={{ fontSize: 16, fontWeight: 'bold' }}
                  extra={
                    <Space>
                      <Button
                        icon={<UpOutlined />}
                        size="small"
                        onClick={() => {
                          if (spanTableHeight === originalSpanTableHeight) {
                            setOriginalSpanTableHeight(spanTableHeight);
                          }
                          setSpanTableHeight(800);
                        }}
                        title="增加高度"
                      />
                      <Button
                        icon={<DownOutlined />}
                        size="small"
                        onClick={() => setSpanTableHeight(originalSpanTableHeight)}
                        title="恢复高度"
                      />
                      <Button
                        icon={<CloseOutlined />}
                        size="small"
                        onClick={() => setShowSpanTable(false)}
                        title="关闭表格"
                      />
                    </Space>
                  }
                >
                  <ProTable
                    columns={[
                      {
                        title: 'Span ID',
                        dataIndex: 'span_id',
                        key: 'span_id',
                        width: 180,
                        render: (id) => {
                          return (
                            <Tooltip title={id}>
                              <Tag
                                color="blue"
                                style={{
                                  maxWidth: 150,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                }}
                              >
                                {id}
                              </Tag>
                            </Tooltip>
                          );
                        },
                      },
                      {
                        title: '组件',
                        dataIndex: 'component',
                        key: 'component',
                        width: 150,
                        render: (component) => <Tag color="purple">{component}</Tag>,
                      },
                      {
                        title: '端点',
                        dataIndex: 'endpoint',
                        key: 'endpoint',
                        width: 120,
                      },
                      {
                        title: '协议',
                        dataIndex: 'protocol',
                        key: 'protocol',
                        width: 100,
                        render: (protocol) => <Tag color="cyan">{protocol}</Tag>,
                      },
                      {
                        title: '方向',
                        dataIndex: 'direction',
                        key: 'direction',
                        width: 100,
                        render: (direction) => (
                          <Tag color={direction === 'Ingress' ? 'green' : 'orange'}>{direction}</Tag>
                        ),
                      },
                      {
                        title: '耗时',
                        dataIndex: 'duration',
                        key: 'duration',
                        width: 100,
                        render: (duration) => (
                          <span style={{ fontWeight: 'bold' }}>
                            {(duration / 1000000).toFixed(2)}ms
                          </span>
                        ),
                      },
                      {
                        title: '开始时间',
                        dataIndex: 'start_time',
                        key: 'start_time',
                        width: 180,
                        render: (time) => new Date(time).toLocaleString(),
                      },
                      {
                        title: '结束时间',
                        dataIndex: 'end_time',
                        key: 'end_time',
                        width: 180,
                        render: (time) => new Date(time).toLocaleString(),
                      },
                      {
                        title: '源地址',
                        key: 'source',
                        width: 180,
                        render: (_, record) => (
                          <div>
                            <div>{record.src_ip}</div>
                            <Tag color="geekblue">端口: {record.src_port}</Tag>
                          </div>
                        ),
                      },
                      {
                        title: '目标地址',
                        key: 'destination',
                        width: 180,
                        render: (_, record) => (
                          <div>
                            <div>{record.dst_ip}</div>
                            <Tag color="geekblue">端口: {record.dst_port}</Tag>
                          </div>
                        ),
                      },
                      {
                        title: '容器',
                        key: 'container',
                        width: 200,
                        render: (_, record) => (
                          <div>
                            <div>{record.container_name}</div>
                            <Tag color="volcano" title="容器ID">
                              {record.container_id?.slice(0, 12)}...
                            </Tag>
                          </div>
                        ),
                      },
                      {
                        title: '请求/响应',
                        key: 'sizes',
                        width: 120,
                        render: (_, record) => (
                          <div>
                            <Tag color="blue">请求: {record.req_size}字节</Tag>
                            <Tag color="green">响应: {record.resp_size}字节</Tag>
                          </div>
                        ),
                      },
                      {
                        title: '序列号',
                        key: 'sequences',
                        width: 120,
                        render: (_, record) => (
                          <div>
                            <Tag color="gold">请求: {record.req_seq}</Tag>
                            <Tag color="lime">响应: {record.resp_seq}</Tag>
                          </div>
                        ),
                      },
                    ]}
                    dataSource={spanData}
                    pagination={false}
                    rowKey="id"
                    search={false}
                    toolBarRender={false}
                    scroll={{ y: spanTableHeight - 100 }}
                  />
                </Card>
              )}
            </div>
          ) : (
            <Alert message="未找到Trace详情信息" type="warning" showIcon style={{ marginTop: 24 }} />
          )}
        </Spin>
      </Drawer>
    </PageContainer>
  );
};

export default PointDrawer;