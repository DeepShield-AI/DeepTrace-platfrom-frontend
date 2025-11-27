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
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// 导入你的接口
import FlameGraphMain from '../../../components/flamegraph/index.jsx';
import GraphVisEGraphVisualizationxample from '../../../components/topology/index.jsx';
import {
  getFilters,
  getFlamegraphDataByTraceId,
  getTraceDetail,
  traceChartQuery,
  traceTableQuery,
  getEsNodesLog,
  getEsEdgesLog
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

const FIXED_STATUS_CODES = [
  "400",
  "503",
  "500",
  "502",
  "404",
  "401",
  "403",
  "200",
  "201"
];

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
  const [statusFilters, setStatusFilters] = useState([]);
  const [endpointFilters, setEndpointFilters] = useState([]);
  const [protocolFilters, setProtocolFilters] = useState([]);
  const [tableListDataSource, setTableListDataSource] = useState([]);

  // 图表数据状态
  const [chartData, setChartData] = useState({
    requestData, // type=count
    errorData: [], // type=statusCount
    latencyData: [], // type=latencyStats
  });

  // 分页相关状态
  const [pagination, setPagination] = useState({
    pageNum: 1, // 当前页码
    pageSize: 10, // 每页显示条数
    total: 0, // 数据总数
  });

  const [allEndpoints, setAllEndpoints] = useState(FIXED_ENDPOINTS);
  const [allProtocols, setAllProtocols] = useState(FIXED_PROTOCOLS);
  const [allStatusOptions, setAllStatusOptions] = useState(FIXED_STATUS_CODES);

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
  const [spanTableHeight, setSpanTableHeight] = useState(300); // 表格高度状态

  // 耗时阈值配置（单位：纳秒）
  const DURATION_THRESHOLD = {
    NORMAL: 5 * 1000 * 1000, // 5ms（正常）
    UNKNOWN: 10 * 1000 * 1000, // 10ms（未知，超过5ms不足10ms）
  };

  const getFlamegraphDataByTraceIdFun = async (traceId) => {
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

  // 获取表格数据函数 - 根据pointType选择不同的接口
  const fetchTraceData = async () => {
    setLoading(true);
    try {
      const baseParams = {
        pageNum: pagination.pageNum,     // 当前页码
        pageSize: pagination.pageSize,   // 每页大小
        startTime: startTime,
        endTime: endTime,
        endpoints: endpointFilters,      // 添加端点筛选
        protocols: protocolFilters,      // 添加协议筛选
        status_codes: statusFilters      // 添加状态码筛选
      };

      let response;
      
      // 根据pointType选择不同的接口
      if (pointType === 'node') {
        // 节点日志接口 - 统一使用 pageNum 和 pageSize
        const params = {
          ...baseParams,
          nodeId: selectId
        };
        response = await getEsNodesLog(params);

      } else if (pointType === 'edge') {
        // 边日志接口 - 统一使用 pageNum 和 pageSize
        const params = {
          ...baseParams,
          srcNodeId: sourceId,
          dstNodeId: targetId
        };
        response = await getEsEdgesLog(params);
      } else {
        // 默认使用traceTableQuery
        response = await traceTableQuery(baseParams);
      }

      // 统一处理响应数据 - 适配不同接口的返回结构
      let dataList = [];
      let totalCount = 0;

      // 根据接口返回结构提取数据
      if (response && typeof response === 'object') {
        // 情况1: 直接包含 content 和 totalElements
        if (response.content && typeof response.totalElements !== 'undefined') {
          dataList = response.content;
          totalCount = response.totalElements;
        }
        // 情况2: 包含 data 字段，data中有列表和总数
        else if (response.data && response.data.records) {
          dataList = response.data.records;
          totalCount = response.data.total || 0;
        }
        // 情况3: 直接是数组
        else if (Array.isArray(response)) {
          dataList = response;
          totalCount = response.length;
        }
        // 情况4: 其他结构，尝试提取
        else {
          dataList = response.records || response.list || response.data || [];
          totalCount = response.total || response.totalElements || dataList.length;
        }
      }

      setTableListDataSource(dataList);

      // 更新分页信息
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
  };

  const fetchFilterOptions = async () => {
    try {
      // 使用固定的筛选项，不再从接口获取
      setAllEndpoints(FIXED_ENDPOINTS);
      setAllProtocols(FIXED_PROTOCOLS);
      setAllStatusOptions(FIXED_STATUS_CODES);
      
      // 初始选中所有选项
      setEndpointFilters(FIXED_ENDPOINTS);
      setProtocolFilters(FIXED_PROTOCOLS);
      setStatusFilters(FIXED_STATUS_CODES);

    } catch (error) {
      message.error('初始化筛选选项失败');
      console.error('Filter options init error:', error);
    }
  };

  function transformData(originalData) {
    // 创建一个空数组来存储转换后的结果
    const transformedData = [];

    // 遍历原始数据中的每个状态码对象
    for (const statusObj of originalData) {
      const statusCode = statusObj.statusCode;

      // 遍历该状态码下的每个时间桶数据
      for (const timeBucket of statusObj.timeBuckets) {
        // 创建一个新对象，将状态码作为 type，并包含时间戳和文档计数
        const newObj = {
          type: statusCode,
          timeKey: timeBucket.timeKey,
          docCount: timeBucket.docCount,
        };

        // 将新对象添加到结果数组中
        transformedData.push(newObj);
      }
    }

    return transformedData;
  }

  // 获取图表数据函数
  const fetchChartData = async () => {
    setChartLoading(true);
    try {
      // 使用Promise.all并行请求三个图表数据
      const [requestResponse, errorResponse, latencyResponse] = await Promise.all([
        traceChartQuery('count'), // 请求数
        traceChartQuery('statusCount'), // 错误数
        traceChartQuery('latencyStats'), // 响应时延
      ]);
      console.log(requestResponse.data, errorResponse.data, latencyResponse.data, '0000');

      // TODO 测试
      // setChartData({
      //     requestData: requestResponse?.data || [],
      //     errorData: errorResponse?.data || [],
      //     latencyData: latencyResponse?.data || []
      // });
    } catch (error) {
      message.error('图表数据获取失败');
      console.error('Chart data fetch error:', error);
    } finally {
      setChartLoading(false);
    }
  };

  // 获取Trace详情数据
  const fetchTraceDetail = async (traceId) => {
    setTraceDetailLoading(true);
    try {
      // 调用接口获取Trace详情
      const response = await getTraceDetail(traceId);
      console.log(response, 'response');

      const traceDetail = response?.content[0] || {};

      // 设置Trace详情
      setCurrentTrace(traceDetail);

      // 设置Span数据
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

  // 监听pointType和相关参数变化，重新获取数据
  useEffect(() => {
    if (selectId) {
      fetchFilterOptions();
      fetchChartData();
      fetchTraceData();
    }
  }, [pointType, selectId, sourceId, targetId, startTime, endTime]);

  useEffect(() => {
    if (selectId) {
      fetchTraceData();
    }
  }, [statusFilters, endpointFilters, protocolFilters, pagination.pageNum, pagination.pageSize]);

  // 筛选逻辑处理
  const handleStatusFilterChange = (checkedValues) => {
    setPagination(prev => ({ ...prev, pageNum: 1 }));
    setStatusFilters(checkedValues);
  };

  const handleEndpointFilterChange = (checkedValues) => {
    setPagination(prev => ({ ...prev, pageNum: 1 }));
    setEndpointFilters(checkedValues);
  };

  const handleProtocolFilterChange = (checkedValues) => {
    setPagination(prev => ({ ...prev, pageNum: 1 }));
    setProtocolFilters(checkedValues);
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
    const status = getStatusByCode(item.status_code);
    const statusConfig = {
      success: { color: 'green', text: '正常', icon: <CheckCircleOutlined /> },
      handling: { color: 'orange', text: '处理中', icon: <QuestionCircleOutlined /> },
      error: { color: 'red', text: '异常', icon: <ExclamationCircleOutlined /> },
    };
    const config = statusConfig[status];
    return (
      <Tag color={config.color} icon={config.icon}>
        {config.text}（{(item.e2e_duration / 1000).toFixed(2)}ms）
      </Tag>
    );
  };

  // 详情页跳转处理
  const handleViewDetail = async (record) => {
    setTraceDetailLoading(true);
    setDrawerVisible(true);

    try {
      // 并行获取火焰图数据和Trace详情
      await Promise.all([
        getFlamegraphDataByTraceIdFun(record.trace_id),
        fetchTraceDetail(record.trace_id),
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
    setSpanTableHeight(300); // 重置表格高度
    setSpanTableHeight(originalSpanTableHeight); // 重置表格高度
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
      <ProCard split="vertical" gutter={16}>
        {/* 左侧筛选面板 */}
        <ProCard title="监控筛选" colSpan="20%" headerBordered extra={<ThunderboltOutlined />}>
          {/* 状态筛选 */}
          <div style={{ marginBottom: 16 }}>
            <Divider orientation="left" plain>
              响应状态
            </Divider>
            <Checkbox.Group
              value={statusFilters}
              onChange={handleStatusFilterChange}
              style={{ width: '100%' }}
            >
              <Space direction="vertical" style={{ width: '100%' }}>
                {allStatusOptions.map((option) => (
                  <Checkbox key={option} value={option} style={{ width: '100%' }}>
                    {option}
                  </Checkbox>
                ))}
              </Space>
            </Checkbox.Group>
          </div>

          {/* 端点筛选 */}
          <div style={{ marginBottom: 16 }}>
            <Divider orientation="left" plain>
              端点
            </Divider>
            <Checkbox.Group
              value={endpointFilters}
              onChange={handleEndpointFilterChange}
              style={{ width: '100%' }}
            >
              <Space direction="vertical" style={{ width: '100%' }}>
                {allEndpoints.map((endpoint) => (
                  <Checkbox key={endpoint} value={endpoint} style={{ width: '100%' }}>
                    {endpoint}
                  </Checkbox>
                ))}
              </Space>
            </Checkbox.Group>
          </div>

          {/* 协议筛选 */}
          <div style={{ marginBottom: 16 }}>
            <Divider orientation="left" plain>
              应用协议
            </Divider>
            <Checkbox.Group
              value={protocolFilters}
              onChange={handleProtocolFilterChange}
              style={{ width: '100%' }}
            >
              <Space direction="vertical" style={{ width: '100%' }}>
                {allProtocols.map((protocol) => (
                  <Checkbox key={protocol} value={protocol} style={{ width: '100%' }}>
                    {protocol}
                  </Checkbox>
                ))}
              </Space>
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
                setStatusFilters(allStatusOptions);
                setEndpointFilters(allEndpoints);
                setProtocolFilters(allProtocols);
                setPagination(prev => ({
                  ...prev,
                  pageNum: 1,
                }));
              }}
              style={{ marginBottom: 8 }}
            >
              重置所有筛选
            </Button>
            <Button
              block
              onClick={() => {
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
            loading={loading}
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
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 条数据`,
              pageSizeOptions: ['10', '20', '50', '100'],
              onChange: (page, pageSize) => {
                setPagination(prev => ({
                  ...prev,
                  pageNum: page,
                  pageSize: pageSize,
                }));
              },
              onShowSizeChange: (current, size) => {
                setPagination(prev => ({
                  ...prev,
                  pageNum: current,
                  pageSize: size,
                }));
              }
            }}
            search={false}
            rowKey={(record) =>
              record.trace_id || `${record.client_ip}-${record.client_port}-${record.endpoint}`
            }
            toolBarRender={false}
          />
        </ProCard>
      </ProCard>

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
        {traceDetailLoading ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <Spin size="large" />
            <p style={{ marginTop: 16 }}>加载Trace详情中...</p>
          </div>
        ) : currentTrace ? (
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
      </Drawer>
    </PageContainer>
  );
};

export default PointDrawer;