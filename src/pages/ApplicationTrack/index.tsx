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

// 导入你的接口
import { 
    traceTableQuery, 
    traceChartQuery, 
    getFlamegraphDataByTraceId, 
    getFilters, 
    getTraceDetail,
    getTraceCharts

} from '../../services/server.js';
import GraphVisEGraphVisualizationxample from '../../components/topology/index.jsx';
import FlameGraphMain from "../../components/flamegraph/index.jsx";

import {transformToTree} from "../../utils/span2tree.js"
import {convertToGraphStructure} from "../../utils/convert2graph.js"

const { TabPane } = Tabs;

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
        const res = await getFlamegraphDataByTraceId(traceId)
        console.log(res, "rrrrr");
        
        const spansList = res?.data?.records
        const relationData = res?.data?.data
        
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
    }

    // 获取表格数据函数
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
            
            const response = await traceTableQuery(params);
            const data = response?.data || {};
            setTableListDataSource(data.content || []);
            
            setPagination({
                ...pagination,
                total: data.totalElements || 0,
            });

        } catch (error) {
            message.error('Trace监控数据获取失败，请刷新重试');
            console.error('Trace data fetch error:', error);
        } finally {
            setLoading(false);
        }
    };

     const fetchFilterOptions = async () => {
        try {
            // 初始化请求获取选项
            const response = await traceTableQuery({
                pageNum: 1,
                pageSize: 10
            });

            const filters = await getFilters()
            console.log(filters, "filters");
            
            
            const data = response?.data || {};
            const uniqueEndpoints = [...new Set(filters.allEndpoints || [])];
            const uniqueProtocols = [...new Set(filters.allProtocols || [])];            
            const uniqueCode = [...new Set(filters.allStatusOptions || [])];

            
            setAllEndpoints(uniqueEndpoints);
            setAllProtocols(uniqueProtocols);
            setAllStatusOptions(uniqueCode)
            // 初始选中所有选项
            setEndpointFilters(uniqueEndpoints);
            setProtocolFilters(uniqueProtocols);
            setStatusFilters(uniqueCode);

        } catch (error) {
            message.error('获取筛选选项失败');
            console.error('Filter options fetch error:', error);
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
    // 获取图表数据函数
    const fetchChartData = async () => {
        setChartLoading(true);
        try {            
            // 使用Promise.all并行请求三个图表数据
            const [requestResponse, errorResponse, latencyResponse] = await Promise.all([
                traceChartQuery('count'),           // 请求数
                traceChartQuery('statusCount'),      // 错误数
                traceChartQuery('latencyStats')      // 响应时延
            ]);
            console.log(requestResponse.data, errorResponse.data, latencyResponse.data, "0000");
            
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
            console.log(response, "response");
            
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
                        ...span.tag.docker_tag
                    }
                });
                console.log(spans, "spans");
                
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
    
    const getStatusByCode = (code) => {
        const code_num = Number(code)
        if([102,100,101].includes(code_num)) {
            return "handling"
        }
        if([200, 201, 202, 205].includes(code_num)) {
            return "success"
        }
    }

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
                fetchTraceDetail(record.trace_id)
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

    
    // 图表配置
    const requestChartConfig = {
        data: requestData,
        xField: 'timeKey',
        yField: 'docCount',
        height: 200,
        // 新增：配置x轴为时间类型，并格式化显示
        xAxis: {
            type: 'time', // 指定为时间类型
            label: {
                formatter: (v) => {
                    // 将时间戳转换为可读格式
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
            formatter: (value) => `${value} 次`, // y轴标签添加单位（如 "166 次"）
            },
        },
        point: {
            shapeField: 'square',
            sizeField: 4,
        },
        interaction: {
            tooltip: {
            marker: false,
            // 优化tooltip：显示格式化时间和请求数
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
    // 1. 先确保转换后的数据格式正确（复用你的 transformData 函数，无需修改）
    const transformedErrorData = transformData(errorData);

    // 2. 优化后的错误数图表配置（多线折线图）
    const errorChartConfig = {
        data: transformedErrorData, // 转换后的数据（含 type、timeKey、docCount）
        xField: 'timeKey',          // X轴：时间戳
        yField: 'docCount',         // Y轴：错误数
        seriesField: 'type',        // 核心：按状态码（type）分组，生成多条线
        height: 200,
        // 3. 自定义每条线的颜色（按状态码分配，区分明显）
        color: ({ type }) => {
            const colorMap = {
            '200': '#1890ff', // 200状态码：蓝色
            '201': '#52c41a', // 201状态码：绿色
            '404': '#faad14', // 若后续有404：橙色（提前预留）
            '500': '#ff4d4f'  // 若后续有500：红色（提前预留）
            };
            return colorMap[type] || '#8c8c8c'; // 默认：灰色
        },
        // 4. 折线样式优化（线条宽度、点样式）
        line: {
            style: {
            lineWidth: 2, // 线条宽度，确保清晰
            },
        },
        // 5. 数据点样式（统一形状，按分组区分颜色）
        point: {
            shape: 'circle', // 点形状：圆形（比方形更友好）
            size: 4,         // 点大小：适中，避免遮挡
            fill: ({ type }) => { // 点填充色与线条色一致
            const colorMap = {
                '200': '#1890ff',
                '201': '#52c41a',
                '404': '#faad14',
                '500': '#ff4d4f'
            };
            return colorMap[type] || '#8c8c8c';
            },
            stroke: '#fff', // 点边框：白色，增强立体感
            strokeWidth: 1,
        },
        // 6. X轴配置（时间格式化，与请求数图表保持一致）
        xAxis: {
            type: 'time',
            tickCount: 5, // 控制刻度数量，避免标签重叠
            label: {
            fontSize: 12,
            formatter: (timestamp) => {
                // 时间格式：仅显示时分（适合当天内数据，若跨天可加年月日）
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
            formatter: (value) => `${value} 次` // 单位：次
            },
            min: 0, // Y轴从0开始，避免数据比例失真
            tickCount: 4 // 控制Y轴刻度数量
        },
        // 8. 图例配置（显示状态码，支持交互）
        legend: {
            position: 'top', // 图例位置：顶部（可选 right/left/bottom）
            title: {
            text: '响应状态码', // 图例标题，明确含义
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
        interaction: {
            tooltip: {
            marker: true, // 显示 tooltip 对应的点标记
            formatter: (datum) => {
                // 格式化时间：显示完整年月日时分秒
                const fullTime = new Date(datum.timeKey).toLocaleString('zh-CN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
                });
                return [
                { name: '时间', value: fullTime },
                { name: '响应状态码', value: datum.type },
                { name: '错误数', value: `${datum.docCount} 次` }
                ];
            }
            }
        },
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

    function transformDurationData(originalData) {
    // 创建映射关系：原始字段名 -> 新类型名
    const fieldMap = {
        'avgDuration': 'avg',
        'p75Duration': 'p75',
        'p90Duration': 'p90',
        'p99Duration': 'p99'
    };
    
    // 使用 reduce 遍历原始数据并构建新数组
    return originalData.reduce((result, item) => {
        // 遍历每个字段映射
        Object.entries(fieldMap).forEach(([originalField, newType]) => {
        // 获取原始值并转换为数字
        const rawValue = item[originalField];
        const value = typeof rawValue === 'string' ? 
                    parseFloat(rawValue) : 
                    Number(rawValue);
        
        // 创建新对象并添加到结果数组
        result.push({
            timeKey: item.timeKey,
            value: isNaN(value) ? 0 : value, // 处理无效数值
            type: newType
        });
        });
        
        return result;
    }, []);
    }
    const latencyChartConfig = {
        data: transformDurationData(latencyData),
        xField: 'timeKey',          // X轴：时间戳
        yField: 'value',         // Y轴：错误数
        seriesField: 'type',        // 核心：按状态码（type）分组，生成多条线
        height: 200,
        // 3. 自定义每条线的颜色（按状态码分配，区分明显）
        color: ({ type }) => {
            const colorMap = {
            'avg': '#1890ff', // 200状态码：蓝色
            'p75': '#52c41a', // 201状态码：绿色
            'p90': '#faad14', // 若后续有404：橙色（提前预留）
            'p99': '#ff4d4f'  // 若后续有500：红色（提前预留）
            };
            return colorMap[type] || '#8c8c8c'; // 默认：灰色
        },
        // 4. 折线样式优化（线条宽度、点样式）
        line: {
            style: {
            lineWidth: 2, // 线条宽度，确保清晰
            },
        },
        // 5. 数据点样式（统一形状，按分组区分颜色）
        point: {
            shape: 'circle', // 点形状：圆形（比方形更友好）
            size: 4,         // 点大小：适中，避免遮挡
            fill: ({ type }) => { // 点填充色与线条色一致
            const colorMap = {
                'avg': '#1890ff',
                'p75': '#52c41a',
                'p90': '#faad14',
                'p99': '#ff4d4f'
            };
            return colorMap[type] || '#8c8c8c';
            },
            stroke: '#fff', // 点边框：白色，增强立体感
            strokeWidth: 1,
        },
        // 6. X轴配置（时间格式化，与请求数图表保持一致）
        xAxis: {
            type: 'time',
            tickCount: 5, // 控制刻度数量，避免标签重叠
            label: {
            fontSize: 12,
            formatter: (timestamp) => {
                // 时间格式：仅显示时分（适合当天内数据，若跨天可加年月日）
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

    // 计算图表统计数据
    const totalRequests = chartData.requestData.reduce((sum, item) => sum + item.count, 0);
    const totalErrors = chartData.errorData.reduce((sum, item) => sum + item.count, 0);
    const avgLatency = chartData.latencyData.length > 0 
        ? (chartData.latencyData.reduce((sum, item) => sum + item.latency, 0) / chartData.latencyData.length).toFixed(2)
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
            throw new Error("未找到根节点（parent_id为null的节点）");
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
                                    const traceId = record?.trace_id || '未知';
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
                                title: '客户端IP',
                                dataIndex: 'client_ip',
                                key: 'client_ip',
                                width: 120,
                            },
                            {
                                title: '客户端端口',
                                dataIndex: 'client_port',
                                key: 'client_port',
                                width: 100,
                            },
                            {
                                title: '组件名称',
                                dataIndex: 'component_name',
                                key: 'component_name',
                                width: 140,
                            },
                            {
                                title: '请求端点',
                                dataIndex: 'endpoint',
                                key: 'endpoint',
                                width: 120,
                            },
                            {
                                title: '传输协议',
                                dataIndex: 'protocol',
                                key: 'protocol',
                                width: 100,
                            },
                            {
                                title: '服务端IP',
                                dataIndex: 'server_ip',
                                key: 'server_ip',
                                width: 120,
                            },
                            {
                                title: '服务端端口',
                                dataIndex: 'server_port',
                                key: 'server_port',
                                width: 100,
                            },
                            {
                                title: '端到端耗时',
                                dataIndex: 'e2e_duration',
                                key: 'e2e_duration',
                                width: 130,
                                render: (duration) => {
                                    const ms = duration / 1000;
                                    let color = '#52c41a';
                                    if (ms > 10) color = '#ff4d4f';
                                    else if (ms > 5) color = '#faad14';
                                    return <span style={{ color }}>{ms.toFixed(2)} ms</span>;
                                },
                            },
                            {
                                title: 'Span数量',
                                dataIndex: 'span_num',
                                key: 'span_num',
                                width: 100,
                            },
                            {
                                title: '结束时间',
                                dataIndex: 'end_time',
                                key: 'end_time',
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
                                                            <Tag color="purple" style={{ fontSize: 14 }}>{currentTrace.protocol}</Tag>
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
                                        title: 'Span ID',
                                        dataIndex: 'span_id',
                                        key: 'span_id',
                                        width: 180,
                                        render: (id) => 
                                            {
                                                    return (<Tooltip title={id}>
                                                        <Tag color="blue" style={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                        {id}
                                                        </Tag>
                                                    </Tooltip>)
                                            }
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
                                            <Tag color={direction === 'Ingress' ? 'green' : 'orange'}>
                                            {direction}
                                            </Tag>
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