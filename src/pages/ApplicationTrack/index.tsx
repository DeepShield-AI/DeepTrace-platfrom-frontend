import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    PageContainer,
    ProCard,
    ProTable
} from '@ant-design/pro-components';
import {
    Divider,
    Checkbox,
    Space,
    Tag,
    Badge,
    Statistic,
    Button,
    Card,
    Row,
    Col,
    Alert,
    message,
    Drawer,
    Descriptions,
    Tabs,
    Timeline,
    Spin,
    Tooltip
} from 'antd';
import {
    CheckCircleOutlined,
    ExclamationCircleOutlined,
    QuestionCircleOutlined,
    ThunderboltOutlined,
    DashboardOutlined,
    ReloadOutlined,
    CloseOutlined,
    InfoCircleOutlined,
    ProfileOutlined,
    UnorderedListOutlined,
    UpOutlined,
    DownOutlined
} from '@ant-design/icons';
import { Line, Area } from '@ant-design/plots';

// import { Line, Area } from '@ant-design/charts';

// 导入接口 - 已切换为v2版本
import { 
    queryTraceList,          // v2: 查询Trace列表（分页） - TraceInfoDTO
    queryTraceCountTimeSeries,  // v2: 查询Trace请求数时间序列 - TimeSeriesDTO
    queryTraceErrorTimeSeries,  // v2: 查询Trace错误数时间序列 - TimeSeriesDTO
    queryTraceLatencyTimeSeries, // v2: 查询Trace响应时延时间序列 - TimeSeriesDTO
    getFilterFields,         // v2: 查询表过滤字段配置 - FilterFieldsDTO
    querySpanDetailsByTrace, // v2: 根据TraceId查询Span明细 - SpanDTO
    getFlamegraphDataByTraceId, // v1: 火焰图数据（暂无v2版本）
} from '../../services/server.js';
import GraphVisEGraphVisualizationxample from '../../components/topology/index.jsx';
import FlameGraphMain from "../../components/flamegraph/index.jsx";

import {transformToTree} from "../../utils/span2tree.js"
import {convertToGraphStructure} from "../../utils/convert2graph.js"

const { TabPane } = Tabs;

// v2 筛选选项常量（从 FilterFieldsDTO 提取）
const ENDPOINTS_OPTIONS = [
    "UnknownEndpoint",
    "ComposeUrls",
    "/api/v1/users",
    "/api/v1/orders",
    "/api/v1/payments",
    "/api/v1/users/register",
    "/api/v1/inventory",
];

const PROTOCOLS_OPTIONS = [
    "HTTP/1.1",
    "HTTP/2",
    "Thrift",
    "gRPC",
];

const STATUS_CODE_OPTIONS = [
    "200",
    "201",
    "400",
    "401",
    "403",
    "404",
    "500",
    "502",
    "503",
];

const requestData = 
    [
        {
            "timeKey": 1755926160000,
            "docCount": 166,
        },
        {
            "timeKey": 1755926220000,
            "docCount": 142,
        },
        {
            "timeKey": 1755926340000,
            "docCount": 217,
        },
        {
            "timeKey": 1755926460000,
            "docCount": 98,
        },
        {
            "timeKey": 1755926580000,
            "docCount": 183,
        },
        {
            "timeKey": 1755926700000,
            "docCount": 205,
        }
    ]

    const errorData = [
        {
            "statusCode": "200",
            "timeBuckets": [
                {
                    "timeKey": 1726058800000,
                    "docCount": 166,
                },
                {
                    "timeKey": 1726059400000,
                    "docCount": 142,
                },
                {
                    "timeKey": 1726060000000,
                    "docCount": 217,
                },
                {
                    "timeKey": 1726060600000,
                    "docCount": 98,
                },
                {
                    "timeKey": 1726061200000,
                    "docCount": 183,
                },
                {
                    "timeKey": 1726061800000,
                    "docCount": 205,
                }
            ]
        },
        {
            "statusCode": "201",
            "timeBuckets": [
                {
                    "timeKey": 1726058800000,
                    "docCount": 121,
                },
                {
                    "timeKey": 1726059400000,
                    "docCount": 124,
                },
                {
                    "timeKey": 1726060000000,
                    "docCount": 253,
                },
                {
                    "timeKey": 1726060600000,
                    "docCount": 123,
                },
                {
                    "timeKey": 1726061200000,
                    "docCount": 214,
                },
                {
                    "timeKey": 1726061800000,
                    "docCount": 100,
                }
            ]
        }
    ]

    const latencyData = [
        {
            "timeKey": 1755926160000,
            "avgDuration": 6159262.820359281,
            "p75Duration": 0,
            "p90Duration": "8234009.080000002",
            "p99Duration": 0
        },
        {
            "timeKey": 1755926220000,
            "avgDuration": 10,
            "p75Duration": 0,
            "p90Duration": "10.0",
            "p99Duration": 0
        },
        {
            "timeKey": 1755926340000,
            "avgDuration": 6159262.820359281,
            "p75Duration": 0,
            "p90Duration": "8234009.080000002",
            "p99Duration": 0
        },
        {
            "timeKey": 1755926460000,
            "avgDuration": 6159262.820359281,
            "p75Duration": 0,
            "p90Duration": "8234009.080000002",
            "p99Duration": 0
        },
        {
            "timeKey": 1755926580000,
            "avgDuration": 6159262.820359281,
            "p75Duration": 0,
            "p90Duration": "8234009.080000002",
            "p99Duration": 0
        },
        {
            "timeKey": 1755926700000,
            "avgDuration": 6159262.820359281,
            "p75Duration": 0,
            "p90Duration": "8234009.080000002",
            "p99Duration": 0
        },

    ]

    // 默认表格数据
    // v2: 默认表格数据 - TraceInfoDTO 格式
    const DEFAULT_TABLE_DATA = [
        {
            traceId: "a1b2c3d4e5f60001",
            rootResponseStatus: "200",
            rootAppService: "api-gateway",
            rootEndpoint: "/api/v1/users",
            rootL7Protocol: "HTTP/1.1",
            rootRequestDomain: "api.example.com",
            rootRequestResource: "GET /api/v1/users",
            rootBizType: "user",
            durationUs: 2500000,
            spanCount: 5,
            errorSpanCount: 0,
            startTime: "2025-06-17T10:30:00.000Z",
            endTime: "2025-06-17T10:30:02.500Z",
        },
        {
            traceId: "a1b2c3d4e5f60002",
            rootResponseStatus: "200",
            rootAppService: "order-service",
            rootEndpoint: "/api/v1/orders",
            rootL7Protocol: "HTTP/1.1",
            rootRequestDomain: "api.example.com",
            rootRequestResource: "POST /api/v1/orders",
            rootBizType: "order",
            durationUs: 8500000,
            spanCount: 8,
            errorSpanCount: 0,
            startTime: "2025-06-17T10:30:05.000Z",
            endTime: "2025-06-17T10:30:13.500Z",
        },
        {
            traceId: "a1b2c3d4e5f60003",
            rootResponseStatus: "500",
            rootAppService: "payment-service",
            rootEndpoint: "/api/v1/payments",
            rootL7Protocol: "HTTP/1.1",
            rootRequestDomain: "api.example.com",
            rootRequestResource: "POST /api/v1/payments",
            rootBizType: "payment",
            durationUs: 15000000,
            spanCount: 3,
            errorSpanCount: 1,
            startTime: "2025-06-17T10:30:10.000Z",
            endTime: "2025-06-17T10:30:25.000Z",
        },
        {
            traceId: "a1b2c3d4e5f60004",
            rootResponseStatus: "201",
            rootAppService: "user-service",
            rootEndpoint: "/api/v1/users/register",
            rootL7Protocol: "HTTP/2",
            rootRequestDomain: "api.example.com",
            rootRequestResource: "POST /api/v1/users/register",
            rootBizType: "user",
            durationUs: 3200000,
            spanCount: 4,
            errorSpanCount: 0,
            startTime: "2025-06-17T10:30:15.000Z",
            endTime: "2025-06-17T10:30:18.200Z",
        },
        {
            traceId: "a1b2c3d4e5f60005",
            rootResponseStatus: "200",
            rootAppService: "inventory-service",
            rootEndpoint: "/api/v1/inventory",
            rootL7Protocol: "HTTP/1.1",
            rootRequestDomain: "api.example.com",
            rootRequestResource: "GET /api/v1/inventory",
            rootBizType: "inventory",
            durationUs: 1200000,
            spanCount: 6,
            errorSpanCount: 0,
            startTime: "2025-06-17T10:30:20.000Z",
            endTime: "2025-06-17T10:30:21.200Z",
        },
    ];
    // 主监控组件
const MonitorNative = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [chartLoading, setChartLoading] = useState(false);
    const [statusFilters, setStatusFilters] = useState([]);
    const [endpointFilters, setEndpointFilters] = useState([]);
    const [protocolFilters, setProtocolFilters] = useState([]);
    const [tableListDataSource, setTableListDataSource] = useState([]);
    
    // 图表数据状态
    const [chartData, setChartData] = useState({
        requestData,   // type=count
        errorData: [],     // type=statusCount
        latencyData: []    // type=latencyStats
    });
    
    // 分页相关状态
    const [pagination, setPagination] = useState({
        pageNum: 1,       // 当前页码
        pageSize: 10,     // 每页显示条数
        total: 0,         // 数据总数
    });
    
    const [allEndpoints, setAllEndpoints] = useState([]);
    const [allProtocols, setAllProtocols] = useState([]);
    const [allStatusOptions, setAllStatusOptions] = useState([]);

    // 抽屉状态
    const [drawerVisible, setDrawerVisible] = useState(false);
    const [currentTrace, setCurrentTrace] = useState(null);
    const [traceDetailLoading, setTraceDetailLoading] = useState(false);
    const [spanData, setSpanData] = useState([]);
    const [drawerWidth, setDrawerWidth] = useState(1600);
    const [originalSpanTableHeight, setOriginalSpanTableHeight] = useState(300);


    
    const [graphData, setGraphData] = useState({})
    const [relationData, setRelationData] = useState({})
    const [flameTreeData, setFlameTreeData] = useState([])
    
    const [showSpanTable, setShowSpanTable] = useState(false);
    const [spanTableHeight, setSpanTableHeight] = useState(300); // 表格高度状态


    // 耗时阈值配置（单位：纳秒）
    const DURATION_THRESHOLD = {
        NORMAL: 5 * 1000 * 1000,   // 5ms（正常）
        UNKNOWN: 10 * 1000 * 1000  // 10ms（未知，超过5ms不足10ms）
    };

    const getFlamegraphDataByTraceIdFun = async (traceId) => {
        try {
            const res = await getFlamegraphDataByTraceId(traceId)
            console.log(res, "rrrrr");
            
            const spansList = res?.data?.records
            const relationData = res?.data?.data
            
            if (Array.isArray(spansList)) {
                const spans = spansList?.map((spans_ori) => {
                    return {
                    ...spans_ori.metric,
                    ...spans_ori.content,
                    ...spans_ori.context,
                    ...spans_ori.tag.ebpf_tag,
                    ...spans_ori.tag.docker_tag
                    }
                })
                const spansTree = transformToTree(spans)
                console.log(spans, spansTree, "火焰图原始数据--");
                
                setFlameTreeData(spansTree)
                
                setGraphData(convertToGraphStructure(spans))
                setRelationData(relationData)
            } else {
                setFlameTreeData([])
                setGraphData({})
                setRelationData({})
            }
        } catch (error) {
            console.error('获取火焰图数据失败:', error)
            setFlameTreeData([])
            setGraphData({})
            setRelationData({})
        }
    }

    // 获取表格数据函数 - v2: queryTraceList (TraceInfoDTO)
    const fetchTraceData = async () => {
        setLoading(true);
        try {
            const params = {
                protocols: protocolFilters,
                endpoints: endpointFilters,
                statusCodes: statusFilters,
                pageNo: pagination.pageNum,
                pageSize: pagination.pageSize
            };
            
            const response = await queryTraceList(params);
            // v2返回格式: { totalCount, pageSize, pageIndex, totalPages, data: TraceInfoDTO[] }
            const dataList = response?.data || [];
            setTableListDataSource(dataList.length > 0 ? dataList : DEFAULT_TABLE_DATA);
            
            setPagination({
                ...pagination,
                total: response?.totalCount || DEFAULT_TABLE_DATA.length,
            });

        } catch (error) {
            message.warning('Trace监控数据获取失败，使用默认数据');
            console.error('Trace data fetch error:', error);
            setTableListDataSource(DEFAULT_TABLE_DATA);
            setPagination({
                ...pagination,
                total: DEFAULT_TABLE_DATA.length,
            });
        } finally {
            setLoading(false);
        }
    };

     const fetchFilterOptions = async () => {
        try {
            // v2: 获取过滤字段配置 - getFilterFields (FilterFieldsDTO)
            const filterFields = await getFilterFields();
            console.log(filterFields, "filterFields v2");
            
            // v2返回格式: { database, tableName, filterFields: FilterFieldConfig[] }
            // 从filterFields中提取endpoint、protocol、status等字段的可选值
            const endpointField = filterFields?.filterFields?.find(f => f.field === 'endpoint' || f.field === 'rootEndpoint');
            const protocolField = filterFields?.filterFields?.find(f => f.field === 'l7_protocol' || f.field === 'rootL7Protocol');
            const statusField = filterFields?.filterFields?.find(f => f.field === 'response_status' || f.field === 'rootResponseStatus');
            
            // v2暂不直接返回枚举值，使用默认选项
            const uniqueEndpoints = ENDPOINTS_OPTIONS;
            const uniqueProtocols = PROTOCOLS_OPTIONS;            
            const uniqueCode = STATUS_CODE_OPTIONS;

            setAllEndpoints(uniqueEndpoints);
            setAllProtocols(uniqueProtocols);
            setAllStatusOptions(uniqueCode);
            setEndpointFilters(uniqueEndpoints);
            setProtocolFilters(uniqueProtocols);
            setStatusFilters(uniqueCode);

        } catch (error) {
            message.warning('获取筛选选项失败，使用默认筛选选项');
            console.error('Filter options fetch error:', error);
            setAllEndpoints(ENDPOINTS_OPTIONS);
            setAllProtocols(PROTOCOLS_OPTIONS);
            setAllStatusOptions(STATUS_CODE_OPTIONS);
            setEndpointFilters(ENDPOINTS_OPTIONS);
            setProtocolFilters(PROTOCOLS_OPTIONS);
            setStatusFilters(STATUS_CODE_OPTIONS);
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
                docCount: timeBucket.docCount
            };
            
            // 将新对象添加到结果数组中
            transformedData.push(newObj);
            }
        }
        
        return transformedData;
    }
    // 获取图表数据函数 - v2: 使用Trace时序接口 (TimeSeriesDTO)
    const fetchChartData = async () => {
        setChartLoading(true);
        try {            
            // v2: 并行请求三个时序接口
            const [requestResponse, errorResponse, latencyResponse] = await Promise.all([
                queryTraceCountTimeSeries(),       // v2: 请求数时序 - 返回 TimeSeriesDTO[]
                queryTraceErrorTimeSeries(),       // v2: 错误数时序 - 返回 TimeSeriesDTO[]
                queryTraceLatencyTimeSeries()      // v2: 响应时延时序 - 返回 TimeSeriesDTO[]
            ]);
            console.log(requestResponse, errorResponse, latencyResponse, "v2 chart data");
            
            // v2 TimeSeriesDTO 格式: { minute, totalRequests, errorRequests, avgLatencySeconds, p50LatencySeconds, p75LatencySeconds, p99LatencySeconds }
            setChartData({
                requestData: requestResponse?.length > 0 ? requestResponse : requestData,
                errorData: errorResponse?.length > 0 ? errorResponse : errorData,
                latencyData: latencyResponse?.length > 0 ? latencyResponse : latencyData,
            });

        } catch (error) {
            message.warning('图表数据获取失败，使用默认数据');
            console.error('Chart data fetch error:', error);
            setChartData({
                requestData: requestData,
                errorData: errorData,
                latencyData: latencyData,
            });
        } finally {
            setChartLoading(false);
        }
    };

    // 获取Trace详情数据 - v2: querySpanDetailsByTrace (SpanDTO)
    const fetchTraceDetail = async (traceId) => {
        setTraceDetailLoading(true);
        try {
            // v2: 根据TraceId查询Span明细
            const response = await querySpanDetailsByTrace({ traceId });
            console.log(response, "v2 trace detail response");
            
            // v2返回 SpanDTO[] 数组
            const spanList = Array.isArray(response) ? response : (response?.data || []);
            
            // 使用第一个Span构建Trace详情
            const firstSpan = spanList[0] || {};
            setCurrentTrace({
                trace_id: traceId,
                ...firstSpan,
            });
            
            // 设置Span数据
            setSpanData(spanList.length > 0 ? spanList : []);
            
        } catch (error) {
            message.error('获取Trace详情失败');
            console.error('Trace detail fetch error:', error);
        } finally {
            setTraceDetailLoading(false);
        }
    };

    useEffect(() => {
        fetchFilterOptions();
        fetchChartData();
    }, []);

    useEffect(() => {
        fetchTraceData();
    }, [statusFilters, endpointFilters, protocolFilters, pagination.pageNum, pagination.pageSize]);

    // 筛选逻辑处理
    const handleStatusFilterChange = (checkedValues) => {
        setPagination({...pagination, pageNum: 1});
        setStatusFilters(checkedValues);
    };
    
    const handleEndpointFilterChange = (checkedValues) => {
        setPagination({...pagination, pageNum: 1});
        setEndpointFilters(checkedValues);
    };
    
    const handleProtocolFilterChange = (checkedValues) => {
        setPagination({...pagination, pageNum: 1});
        setProtocolFilters(checkedValues);
    };

    // 根据耗时计算状态
    const getStatusByDuration = (duration) => {
        if (duration <= DURATION_THRESHOLD.NORMAL) return 'normal';
        if (duration <= DURATION_THRESHOLD.UNKNOWN) return 'unknown';
        return 'error';
    };
    
    // v2: 根据响应状态码判断状态 - rootResponseStatus
    const getStatusByCode = (code) => {
        const code_num = Number(code)
        if([102,100,101].includes(code_num)) {
            return "handling"
        }
        if([200, 201, 202, 205].includes(code_num)) {
            return "success"
        }
        return "error"
    }

    // v2: 状态标签渲染 - 使用 rootResponseStatus
    const renderStatusTag = (item) => {
        const status = getStatusByCode(item.rootResponseStatus);
        const statusConfig = {
            success: { color: 'green', text: '正常', icon: <CheckCircleOutlined /> },
            handling: { color: 'orange', text: '处理中', icon: <QuestionCircleOutlined /> },
            error: { color: 'red', text: '异常', icon: <ExclamationCircleOutlined /> },
        };
        const config = statusConfig[status];
        return (
            <Tag color={config.color} icon={config.icon}>
                {config.text}（{((item.durationUs || 0) / 1000).toFixed(2)}ms）
            </Tag>
        );
    };

    // 详情页跳转处理 - v2: 使用 traceId
    const handleViewDetail = async (record) => {
        setTraceDetailLoading(true);
        setDrawerVisible(true);
        
        try {
            await Promise.all([
                getFlamegraphDataByTraceIdFun(record.traceId),
                fetchTraceDetail(record.traceId)
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

    // 处理表格分页变化
    const handleTableChange = (pageConfig) => {
        setPagination({
            ...pagination,
            pageNum: pageConfig.current,
            pageSize: pageConfig.pageSize,
        });
    };

    
    // 图表配置 - v2: TimeSeriesDTO 格式 (minute, totalRequests, errorRequests, avgLatencySeconds, p50LatencySeconds, p75LatencySeconds, p99LatencySeconds)
    const requestChartConfig = {
        data: chartData.requestData,
        xField: 'minute',
        yField: 'totalRequests',
        height: 200,
        xAxis: {
            type: 'time',
            label: {
                formatter: (v) => {
                    return new Date(v).toLocaleTimeString('zh-CN', {
                        hour: '2-digit',
                        minute: '2-digit'
                    });
                }
            }
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
                const formatTime = new Date(datum.minute).toLocaleString('zh-CN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                });
                return [
                { name: '时间', value: formatTime },
                { name: '请求数', value: `${datum.totalRequests} 次` },
                ];
            },
            },
        },
        style: {
            lineWidth: 2,
        },
    };    
    // v2: 错误数图表配置 - TimeSeriesDTO 使用 errorRequests 字段
    const errorChartConfig = {
        data: chartData.errorData,
        xField: 'minute',
        yField: 'errorRequests',
        height: 200,
        color: '#ff4d4f',
        line: {
            style: {
            lineWidth: 2,
            },
        },
        point: {
            shape: 'circle',
            size: 4,
            fill: '#ff4d4f',
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
                minute: '2-digit'
                });
            }
            },
            range: [0.05, 0.95]
        },
        yAxis: {
            label: {
            fontSize: 12,
            formatter: (value) => `${value} 次`
            },
            min: 0,
            tickCount: 4
        },
        interaction: {
            tooltip: {
            marker: true,
            formatter: (datum) => {
                const fullTime = new Date(datum.minute).toLocaleString('zh-CN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
                });
                return [
                { name: '时间', value: fullTime },
                { name: '错误数', value: `${datum.errorRequests} 次` }
                ];
            }
            }
        },
        // 网格线配置
        grid: {
            horizontal: {
            visible: true,
            style: {
                stroke: '#e8e8e8',
                opacity: 0.5
            }
            },
            vertical: {
            visible: false // 隐藏垂直网格线，保持图表简洁
            }
        }
    };

    // v2: 时延数据转换 - TimeSeriesDTO 使用 avgLatencySeconds, p50LatencySeconds, p75LatencySeconds, p99LatencySeconds
    function transformDurationData(originalData) {
    const fieldMap = {
        'avgLatencySeconds': 'avg',
        'p50LatencySeconds': 'p50',
        'p75LatencySeconds': 'p75',
        'p99LatencySeconds': 'p99'
    };
    
    return originalData.reduce((result, item) => {
        Object.entries(fieldMap).forEach(([originalField, newType]) => {
        const rawValue = item[originalField];
        const value = typeof rawValue === 'string' ? 
                    parseFloat(rawValue) : 
                    Number(rawValue);
        
        result.push({
            minute: item.minute,  // v2使用minute字段
            value: isNaN(value) ? 0 : value,
            type: newType
        });
        });
        
        return result;
    }, []);
    }
    const latencyChartConfig = {
        data: transformDurationData(chartData.latencyData),
        xField: 'minute',          // v2: X轴使用minute字段
        yField: 'value',
        seriesField: 'type',
        height: 200,
        color: ({ type }) => {
            const colorMap = {
            'avg': '#1890ff',
            'p50': '#52c41a',
            'p75': '#faad14',
            'p99': '#ff4d4f'
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
                'avg': '#1890ff',
                'p50': '#52c41a',
                'p75': '#faad14',
                'p99': '#ff4d4f'
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
                minute: '2-digit'
                });
            }
            },
            range: [0.05, 0.95] // 轴两端留空白，避免数据贴边
        },
        // 7. Y轴配置（从0开始，添加单位）
        yAxis: {
            label: {
            fontSize: 12,
            formatter: (value) => `${value} ` // 单位：次
            },
            min: 0, // Y轴从0开始，避免数据比例失真
            tickCount: 4 // 控制Y轴刻度数量
        },
        // 8. 图例配置（显示状态码，支持交互）
        legend: {
            position: 'top', // 图例位置：顶部（可选 right/left/bottom）
            title: {
            text: '时延', // 图例标题，明确含义
            fontSize: 12,
            padding: [0, 0, 4, 0] // 标题与图例间距
            },
            label: {
            fontSize: 12,
            formatter: (type) => `状态码 ${type}` // 图例文本：优化为“状态码 200”
            },
            interactive: true // 支持点击图例隐藏/显示对应线条
        },
        // 9. Tooltip 配置（显示完整信息）
        // interaction: {
        //     tooltip: {
        //     marker: true, // 显示 tooltip 对应的点标记
        //     formatter: (datum) => {
        //         // 格式化时间：显示完整年月日时分秒
        //         const fullTime = new Date(datum.timeKey).toLocaleString('zh-CN', {
        //         year: 'numeric',
        //         month: '2-digit',
        //         day: '2-digit',
        //         hour: '2-digit',
        //         minute: '2-digit',
        //         second: '2-digit'
        //         });
        //         return [
        //         { name: '时间', value: fullTime },
        //         { name: '响应状态码', value: datum.type },
        //         { name: '错误数', value: `${datum.docCount} 次` }
        //         ];
        //     }
        //     }
        // },
        // 10. 网格线配置（辅助读数，降低透明度避免干扰）
        grid: {
            horizontal: {
            visible: true,
            style: {
                stroke: '#e8e8e8',
                opacity: 0.5
            }
            },
            vertical: {
            visible: false // 隐藏垂直网格线，保持图表简洁
            }
        }
    };

    // 计算图表统计数据 - v2: TimeSeriesDTO 格式
    const totalRequests = chartData.requestData.reduce((sum, item) => sum + (item.totalRequests || 0), 0);
    const totalErrors = chartData.errorData.reduce((sum, item) => sum + (item.errorRequests || 0), 0);
    const avgLatency = chartData.latencyData.length > 0 
        ? (chartData.latencyData.reduce((sum, item) => sum + (item.avgLatencySeconds || 0), 0) / chartData.latencyData.length).toFixed(2)
        : 0;


    function addNodeLevels(nodes = []) {
        // 1. 构建span_id到节点的映射（便于快速查找父/子节点）
        console.log(nodes, "nodes2");
        
        const spanToNode = {};
        nodes.forEach(node => {
            spanToNode[node.span_id] = { ...node }; // 复制节点，避免修改原对象
        });

        // 2. 找到根节点（parent_id为null的节点）
        let root = null;
        for (const node of nodes) {
            if (node.parent_id === null) {
                root = spanToNode[node.span_id];
                break;
            }
        }

        if (!root) {
            root = { span_id: null, level: 0, child_ids: [] }
            // throw new Error("未找到根节点（parent_id为null的节点）");
        }

        // 3. 根节点层级为0
        root.level = 0;

        // 4. 广度优先遍历（BFS）计算所有节点的层级
        const queue = [root];
        while (queue.length > 0) {
            const currentNode = queue.shift(); // 取出当前层的节点

            // 遍历当前节点的子节点（child_ids中的span_id）
            currentNode.child_ids.forEach(childSpanId => {
                const childNode = spanToNode[childSpanId];
                if (childNode) {
                    // 子节点层级 = 父节点层级 + 1
                    childNode.level = currentNode.level + 1;
                    queue.push(childNode); // 加入队列，用于遍历其下一级子节点
                }
            });
        }

        // 5. 返回添加了level字段的节点数组（保持原数组顺序）
        return nodes.map(node => spanToNode[node.span_id]);
    }
    return (
        <PageContainer
            content={
                <div>
                    <Alert 
                        message="Trace监控系统实时追踪服务调用链路，可通过左侧筛选面板按状态、端点或协议筛选数据" 
                        type="info" 
                        showIcon 
                        style={{ marginBottom: 16 }}
                    />
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <DashboardOutlined style={{ marginRight: 8, fontSize: 18 }} />
                        <span>Trace链路监控</span>
                    </div>
                </div>
            }
        >
            <ProCard split="vertical" gutter={16}>
                {/* 左侧筛选面板 */}
                <ProCard 
                
                    title="监控筛选" 
                    colSpan="20%"
                    headerBordered
                    extra={<ThunderboltOutlined />}
                >
                    {/* 状态筛选 */}
                    <div style={{ marginBottom: 16 }}>
                        <Divider orientation="left" plain>响应状态</Divider>
                        <Checkbox.Group 
                            value={statusFilters} 
                            onChange={handleStatusFilterChange}
                            style={{ width: '100%' }}
                        >
                            <Space direction="vertical" style={{ width: '100%' }}>
                                {allStatusOptions.map(option => (
                                    <Checkbox 
                                        key={option.value} 
                                        value={option}
                                        style={{ width: '100%' }}
                                    >
                                        {option}
                                    </Checkbox>
                                ))}
                            </Space>
                        </Checkbox.Group>
                    </div>
                    
                    {/* 动态端点筛选 */}
                    <div style={{ marginBottom: 16 }}>
                        <Divider orientation="left" plain>端点</Divider>
                        <Checkbox.Group 
                            value={endpointFilters} 
                            onChange={handleEndpointFilterChange}
                            style={{ width: '100%' }}
                        >
                            <Space direction="vertical" style={{ width: '100%' }}>
                                {allEndpoints.map(endpoint => (
                                    <Checkbox key={endpoint} value={endpoint} style={{ width: '100%' }}>
                                        {endpoint}
                                    </Checkbox>
                                ))}
                            </Space>
                        </Checkbox.Group>
                    </div>
                    
                    {/* 动态协议筛选 */}
                    <div style={{ marginBottom: 16 }}>
                        <Divider orientation="left" plain>应用协议</Divider>
                        <Checkbox.Group 
                            value={protocolFilters} 
                            onChange={handleProtocolFilterChange}
                            style={{ width: '100%' }}
                        >
                            <Space direction="vertical" style={{ width: '100%' }}>
                                {allProtocols.map(protocol => (
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
                        <Statistic 
                            title="总监控项" 
                            value={pagination.total} 
                        />
                        <Button 
                            type="primary" 
                            block 
                            onClick={() => {
                                setStatusFilters(allStatusOptions);
                                setEndpointFilters(allEndpoints);
                                setProtocolFilters(allProtocols);
                                setPagination({
                                    pageNum: 1,
                                    pageSize: pagination.pageSize,
                                    total: pagination.total
                                });
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
                <ProCard title="Trace监控数据" headerBordered>
                    {/* 图表区域 - 三个图表并列显示 */}
                    <Row gutter={16} style={{ marginBottom: 16 }}>
                        <Col span={8}>
                            <Card 
                                title="请求数" 
                                size="small"
                                extra={<span style={{ color: '#1890ff' }}>总数: {totalRequests}</span>}
                            >
                                {/* <div style={{ width: '100%', height: '100%' }}> */}

                                    <Line 
                                        {...requestChartConfig} 
                                        loading={chartLoading}
                                        style={{ height: 200 }}
                                    />
                                {/* </div> */}
                            </Card>
                        </Col>
                        <Col span={8}>
                            <Card 
                                title="错误数" 
                                size="small"
                                extra={<span style={{ color: '#ff4d4f' }}>总数: {totalErrors}</span>}
                            >
                                <Line 
                                    {...errorChartConfig} 
                                    loading={chartLoading}
                                    style={{ height: 200 }}
                                />
                            </Card>
                        </Col>
                        <Col span={8}>
                            <Card 
                                title="响应时延" 
                                size="small"
                                extra={<span style={{ color: '#faad14' }}>平均: {avgLatency}ms</span>}
                            >
                                <Area 
                                    {...latencyChartConfig} 
                                    loading={chartLoading}
                                    style={{ height: 200 }}
                                />
                            </Card>
                        </Col>
                    </Row>
                    
                    {/* 空数据提示 */}
                    {tableListDataSource.length === 0 && !loading && (
                        <Alert 
                            message="暂无符合条件的Trace数据" 
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
                                    const traceId = record?.traceId || '未知';
                                    return <span title={traceId}>{traceId}</span>;
                                },
                            },
                            {
                                title: '链路状态',
                                key: 'status',
                                width: 140,
                                render: (_, record) => renderStatusTag(record),
                            },
                            {
                                title: '应用服务',
                                dataIndex: 'rootAppService',
                                key: 'rootAppService',
                                width: 140,
                            },
                            {
                                title: '请求端点',
                                dataIndex: 'rootEndpoint',
                                key: 'rootEndpoint',
                                width: 180,
                            },
                            {
                                title: '传输协议',
                                dataIndex: 'rootL7Protocol',
                                key: 'rootL7Protocol',
                                width: 100,
                            },
                            {
                                title: '响应状态码',
                                dataIndex: 'rootResponseStatus',
                                key: 'rootResponseStatus',
                                width: 100,
                            },
                            {
                                title: '请求域名',
                                dataIndex: 'rootRequestDomain',
                                key: 'rootRequestDomain',
                                width: 160,
                            },
                            {
                                title: '请求资源',
                                dataIndex: 'rootRequestResource',
                                key: 'rootRequestResource',
                                width: 140,
                            },
                            {
                                title: '业务类型',
                                dataIndex: 'rootBizType',
                                key: 'rootBizType',
                                width: 100,
                            },
                            {
                                title: '耗时',
                                dataIndex: 'durationUs',
                                key: 'durationUs',
                                width: 130,
                                render: (durationUs) => {
                                    const ms = (durationUs / 1000).toFixed(2);
                                    let color = '#52c41a';
                                    if (ms > 10) color = '#ff4d4f';
                                    else if (ms > 5) color = '#faad14';
                                    return <span style={{ color }}>{ms} ms</span>;
                                },
                            },
                            {
                                title: 'Span数量',
                                dataIndex: 'spanCount',
                                key: 'spanCount',
                                width: 100,
                            },
                            {
                                title: '错误Span数',
                                dataIndex: 'errorSpanCount',
                                key: 'errorSpanCount',
                                width: 100,
                            },
                            {
                                title: '开始时间',
                                dataIndex: 'startTime',
                                key: 'startTime',
                                width: 160,
                                render: (time) => {
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
                                title: '结束时间',
                                dataIndex: 'endTime',
                                key: 'endTime',
                                width: 160,
                                render: (time) => {
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
                                    <Button 
                                        type="link" 
                                        size="small" 
                                        onClick={() => handleViewDetail(record)}
                                    >
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
                        }}
                        onChange={handleTableChange}
                        search={false}
                        rowKey={(record) => 
                            record.traceId || `${record.rootAppService}-${record.rootEndpoint}`
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
                            title={showSpanTable ? "隐藏Span表格" : "显示Span表格"}
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
                                        {/* 基本信息卡片 */}
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
                                                            <Tag color="blue" style={{ fontSize: 14 }}>{currentTrace.trace_id}</Tag>
                                                        </Descriptions.Item>
                                                        <Descriptions.Item label="状态">
                                                            {/* {renderStatusTag(currentTrace)} */}
                                                        </Descriptions.Item>
                                                        <Descriptions.Item label="端点">
                                                            <div style={{ fontWeight: 'bold', fontSize: 15 }}>{currentTrace.endpoint}</div>
                                                        </Descriptions.Item>
                                                        <Descriptions.Item label="协议">
                                                            <Tag color="purple" style={{ fontSize: 14 }}>{currentTrace.l7Protocol}</Tag>
                                                        </Descriptions.Item>
                                                        <Descriptions.Item label="业务类型">
                                                            <Tag color="purple" style={{ fontSize: 14 }}>{currentTrace.rootBizType}</Tag>
                                                        </Descriptions.Item>
                                                    </Descriptions>
                                                </Col>
                                                <Col span={12}>
                                                    <Descriptions column={1} size="middle">
                                                        <Descriptions.Item label="客户端IP">
                                                            <div style={{ fontWeight: 'bold' }}>
                                                                {currentTrace.ip40}
                                                            </div>
                                                        </Descriptions.Item>
                                                        <Descriptions.Item label="客户端端口">
                                                            <div style={{ fontWeight: 'bold' }}>
                                                                {currentTrace.clientPort}
                                                            </div>
                                                        </Descriptions.Item>
                                                        <Descriptions.Item label="服务端IP">
                                                            <div style={{ fontWeight: 'bold' }}>
                                                                {currentTrace.ip41}
                                                            </div>
                                                        </Descriptions.Item>
                                                        <Descriptions.Item label="服务端端口">
                                                            <div style={{ fontWeight: 'bold' }}>
                                                                {currentTrace.serverPort}
                                                            </div>
                                                        </Descriptions.Item>
                                                        <Descriptions.Item label="耗时">
                                                            <span style={{ fontWeight: 'bold', fontSize: 16, color: '#1890ff' }}>
                                                                {((currentTrace.responseDuration || 0) / 1000).toFixed(2)} ms
                                                            </span>
                                                        </Descriptions.Item>
                                                        <Descriptions.Item label="Span数量">
                                                            <span style={{ fontWeight: 'bold', fontSize: 16 }}>
                                                                {spanData.length}
                                                            </span>
                                                        </Descriptions.Item>
                                                    </Descriptions>
                                                </Col>
                                            </Row>
                                        </Card>
                                        
                                        {/* 原始数据卡片 */}
                                        <Card 
                                            title="原始数据" 
                                            bordered={false}
                                            headStyle={{ fontSize: 16, fontWeight: 'bold' }}
                                        >
                                            <pre style={{ 
                                                background: '#f6f8fa', 
                                                padding: 16, 
                                                borderRadius: 4,
                                                maxHeight: 300,
                                                overflowY: 'auto',
                                                fontSize: 13,
                                                whiteSpace: 'pre-wrap',
                                                wordBreak: 'break-all'
                                            }}>
                                                {JSON.stringify(currentTrace, null, 2)}
                                            </pre>
                                        </Card>
                                    </div>
                                </TabPane>

                                {/* Tab 2: 拓扑图 */}
                                <TabPane tab="拓扑图" key="2">
                                    <div style={{ height: '100%', overflowY: 'auto' }}>
                                        <Card 
                                            bordered={false}
                                            style={{ 
                                                height: '100%', 
                                                minHeight: "600px" 
                                            }}
                                            bodyStyle={{ 
                                                height: 'calc(100% - 6px)', 
                                                display: 'flex', 
                                                justifyContent: 'center', 
                                                alignItems: 'center',
                                                background: '#f9f9f9'
                                            }}
                                        >
                                            <div style={{ textAlign: 'center', width: "100%" }}>
                                                <GraphVisEGraphVisualizationxample
                                                    nodes={addNodeLevels(graphData.nodes)}
                                                    edges={graphData.edges}
                                                    relationData={relationData}
                                                ></GraphVisEGraphVisualizationxample> 
                                            </div>
                                        </Card>
                                    </div>
                                </TabPane>

                                {/* Tab 3: 火焰图 */}
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
                                                background: '#f9f9f9'
                                            }}
                                        >
                                            <div style={{ width: "100%"  }}>
                                                <FlameGraphMain
                                                    data={flameTreeData}
                                                ></FlameGraphMain>
                                            </div>
                                        </Card>
                                    </div>
                                </TabPane>
                            </Tabs>
                        </div>
                        
                        {/* 可展开的Span表格 */}
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
                                                // 保存当前高度作为原始高度
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
                                        title: '应用服务',
                                        dataIndex: 'appService',
                                        key: 'appService',
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
                                        dataIndex: 'l7Protocol',
                                        key: 'l7Protocol',
                                        width: 100,
                                        render: (protocol) => <Tag color="cyan">{protocol}</Tag>,
                                        },
                                        {
                                        title: '请求域名',
                                        dataIndex: 'requestDomain',
                                        key: 'requestDomain',
                                        width: 160,
                                        },
                                        {
                                        title: '请求资源',
                                        dataIndex: 'requestResource',
                                        key: 'requestResource',
                                        width: 140,
                                        },
                                        {
                                        title: '耗时',
                                        dataIndex: 'responseDuration',
                                        key: 'responseDuration',
                                        width: 100,
                                        render: (duration) => (
                                            <span style={{ fontWeight: 'bold' }}>
                                            {(duration / 1000).toFixed(2)}ms
                                            </span>
                                        ),
                                        },
                                        {
                                        title: '响应状态码',
                                        dataIndex: 'responseCode',
                                        key: 'responseCode',
                                        width: 100,
                                        render: (code) => (
                                            <Tag color={code === 200 ? 'green' : 'red'}>
                                            {code}
                                            </Tag>
                                        ),
                                        },
                                        {
                                        title: '开始时间',
                                        dataIndex: 'startTime',
                                        key: 'startTime',
                                        width: 180,
                                        render: (time) => new Date(time).toLocaleString(),
                                        },
                                        {
                                        title: '结束时间',
                                        dataIndex: 'endTime',
                                        key: 'endTime',
                                        width: 180,
                                        render: (time) => new Date(time).toLocaleString(),
                                        },
                                        {
                                        title: '源地址',
                                        key: 'source',
                                        width: 180,
                                        render: (_, record) => (
                                            <div>
                                            <div>{record.ip40}</div>
                                            <Tag color="geekblue">端口: {record.clientPort}</Tag>
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
                                            <Tag color="volcano" title="容器ID">{record.container_id.slice(0, 12)}...</Tag>
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
                                    scroll={{ y: spanTableHeight - 100 }} // 根据高度调整滚动区域
                                />
                            </Card>
                        )}
                    </div>
                ) : (
                    <Alert 
                        message="未找到Trace详情信息" 
                        type="warning" 
                        showIcon 
                        style={{ marginTop: 24 }}
                    />
                )}
            </Drawer>
        </PageContainer>
    );
};

export default MonitorNative;