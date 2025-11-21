import { errorData, requestData } from '@/services/mock';
import { Area, Line } from '@ant-design/plots';
import { Card, Col, Drawer, Row, Tabs, message, DatePicker, Button, Space, Statistic } from 'antd';
import dagre from 'dagre';
import { useEffect, useRef, useState } from 'react';
import ReactFlow, {
  Background,
  Controls,
  Handle,
  MiniMap,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from 'react-flow-renderer';
import 'react-flow-renderer/dist/style.css';
import EndpointMonitoringTable from './components/endpointTable.jsx';
import PointDrawer from './PointDrawer';
import { 
    getEsEdgeEndpointList,
    getEsNodeEndpointList,
    getEsKpiQps,
    getEsKpiErrorRate,
    getEsKpiLatencyStats,
    getEsKpiResourceUsage // 假设有资源使用情况接口
} from '../../../services/server.js';
import moment from 'moment';

const { RangePicker } = DatePicker;
const { Countdown } = Statistic;

const PointDetailDrawer = ({selectedObj = {}}) => {

    // 时间范围状态
    const [timeRange, setTimeRange] = useState({
        startTime: moment('2025-10-31 00:00:00').valueOf(), // 2025年10月31日0点
        endTime: moment('2025-10-31 23:59:59').valueOf()   // 2025年10月31日24点
    });
    
    const [activeTab, setActiveTab] = useState('metrics');
    const [chartData, setChartData] = useState({
        requestData: [], // QPS数据
        errorData: [], // 错误率数据
        latencyData: [], // 时延数据
    });
    const [chartLoading, setChartLoading] = useState(false);

    // 性能指标状态
    const [performanceMetrics, setPerformanceMetrics] = useState({
        avgDuration: 0,
        qps: 0,
        errorRate: 0,
        errorCount: 0,
        p75Duration: 0,
        p99Duration: 0,
        totalRequests: 0
    });

    // 资源使用状态
    const [resourceMetrics, setResourceMetrics] = useState({
        cpuUsage: 0,
        memoryUsage: 0,
        networkTraffic: 0,
        diskUsage: 0,
        threadCount: 0,
        gcCount: 0
    });

    const [metricsLoading, setMetricsLoading] = useState(false);

    // 抽屉状态
    const [edgeDrawerVisible, setEdgeDrawerVisible] = useState(false);
    const [nodeDrawerVisible, setNodeDrawerVisible] = useState(false);
    const [selectedEdge, setSelectedEdge] = useState(null);
    const [selectedNode, setSelectedNode] = useState(null);

    // 默认的端点数据（兜底数据）
    const defaultEndpointData = [
        {
            "endpoint": "ComposeCreatorWithUserId",
            "protocol": "Thrift",
            "totalCount": 328.0,
            "minTime": "1755926183984",
            "maxTime": "1755926187091",
            "qps": 105.56807209526875,
            "avgDuration": 194011.57012195123,
            "p75Duration": "246864.5",
            "p99Duration": "347781.6000000001",
            "errorCount": 0.0,
            "errorRate": 0.0
        },
        {
            "endpoint": "ComposeMedia",
            "protocol": "Thrift",
            "totalCount": 328.0,
            "minTime": "1755926183984",
            "maxTime": "1755926187091",
            "qps": 105.56807209526875,
            "avgDuration": 198016.17073170733,
            "p75Duration": "245628.25",
            "p99Duration": "387430.46",
            "errorCount": 0.0,
            "errorRate": 0.0
        }
    ];

    // 端点Data
    const [endpointData, setEndpointData] = useState(defaultEndpointData);
    const [endpointLoading, setEndpointLoading] = useState(false);

    // 兜底图表数据
    const getFallbackChartData = () => {
        const startTime = timeRange.startTime;
        const endTime = timeRange.endTime;
        const interval = 5 * 60 * 1000; // 5分钟间隔
        
        // 生成时间序列数据
        const timeSeries = [];
        for (let time = startTime; time <= endTime; time += interval) {
            timeSeries.push(time);
        }
        
        // 请求数兜底数据
        const fallbackRequestData = timeSeries.map(time => ({
            timeKey: time,
            docCount: Math.floor(Math.random() * 100) + 50 // 50-150之间的随机数
        }));
        
        // 错误率兜底数据
        const fallbackErrorData = [
            {
                statusCode: "200",
                timeBuckets: timeSeries.map(time => ({
                    timeKey: time,
                    docCount: Math.floor(Math.random() * 20) + 10 // 10-30之间的随机数
                }))
            },
            {
                statusCode: "500",
                timeBuckets: timeSeries.map(time => ({
                    timeKey: time,
                    docCount: Math.floor(Math.random() * 5) + 1 // 1-6之间的随机数
                }))
            }
        ];
        
        // 时延兜底数据
        const fallbackLatencyData = timeSeries.flatMap(time => [
            {
                time: time,
                latency: Math.random() * 100 + 50, // 50-150ms
                type: '平均时延'
            },
            {
                time: time,
                latency: Math.random() * 150 + 100, // 100-250ms
                type: 'P75'
            },
            {
                time: time,
                latency: Math.random() * 200 + 150, // 150-350ms
                type: 'P99'
            }
        ]);
        
        return {
            requestData: fallbackRequestData,
            errorData: fallbackErrorData,
            latencyData: fallbackLatencyData
        };
    };

    // 获取当前节点ID
    const getCurrentNodeId = () => {
        if (selectedObj.pointType === 'node') {
            return selectedObj.id || selectedObj.data?.id;
        } else if (selectedObj.pointType === 'edge') {
            // 对于边，返回源节点ID
            return selectedObj.source || selectedObj.data?.source;
        }
        return null;
    };

    // 获取目标节点ID（仅对边有效）
    const getTargetNodeId = () => {
        if (selectedObj.pointType === 'edge') {
            return selectedObj.target || selectedObj.data?.target;
        }
        return null;
    };

    // 构建请求参数 - 根据pointType使用不同的参数名
    const buildRequestParams = () => {
        const nodeId = getCurrentNodeId();
        if (!nodeId) return null;

        const params = {
            startTime: timeRange.startTime,
            endTime: timeRange.endTime
        };

        // 根据 pointType 添加不同的ID参数
        if (selectedObj.pointType === 'node') {
            params.nodeId = nodeId;
        } else if (selectedObj.pointType === 'edge') {
            params.srcNodeId = nodeId; // 边的情况使用srcId
            // 如果需要，也可以添加目标节点ID
            if (selectedObj.target) {
                params.dstNodeId = selectedObj.target;
            }
        }

        return params;
    };

    // 计算性能指标
    const calculatePerformanceMetrics = (chartData) => {
        if (!chartData.requestData || chartData.requestData.length === 0) {
            return {
                avgDuration: selectedObj.data?.avgDuration || 0,
                qps: selectedObj.data?.qps || 0,
                errorRate: selectedObj.data?.errorRate || 0,
                errorCount: selectedObj.data?.errorCount || 0,
                p75Duration: selectedObj.data?.p75Duration || 0,
                p99Duration: selectedObj.data?.p99Duration || 0,
                totalRequests: selectedObj.data?.totalCount || 0
            };
        }

        // 从图表数据计算实时指标
        const requestData = chartData.requestData;
        const errorData = chartData.errorData;
        const latencyData = chartData.latencyData;

        // 计算QPS（基于最近时间点的请求数）
        const recentRequests = requestData.slice(-10); // 取最近10个数据点
        const totalRecentRequests = recentRequests.reduce((sum, item) => sum + (item.docCount || 0), 0);
        const qps = recentRequests.length > 0 ? totalRecentRequests / recentRequests.length : 0;

        // 计算错误率
        let totalErrors = 0;
        let totalRequests = 0;
        
        if (errorData && errorData.length > 0) {
            // 汇总所有错误状态码的请求数
            errorData.forEach(statusGroup => {
                if (statusGroup.statusCode >= '400') {
                    const recentErrors = statusGroup.timeBuckets?.slice(-10) || [];
                    totalErrors += recentErrors.reduce((sum, item) => sum + (item.docCount || 0), 0);
                }
                
                // 计算总请求数（所有状态码）
                const recentStatusRequests = statusGroup.timeBuckets?.slice(-10) || [];
                totalRequests += recentStatusRequests.reduce((sum, item) => sum + (item.docCount || 0), 0);
            });
        }

        const errorRate = totalRequests > 0 ? totalErrors / totalRequests : 0;

        // 计算平均时延
        let avgDuration = 0;
        if (latencyData && latencyData.length > 0) {
            const avgLatencies = latencyData.filter(item => item.type === '平均时延');
            if (avgLatencies.length > 0) {
                const recentAvgLatencies = avgLatencies.slice(-5); // 取最近5个平均时延
                avgDuration = recentAvgLatencies.reduce((sum, item) => sum + (item.latency || 0), 0) / recentAvgLatencies.length;
            }
        }

        // 计算P75和P99时延
        let p75Duration = 0;
        let p99Duration = 0;
        if (latencyData && latencyData.length > 0) {
            const p75Latencies = latencyData.filter(item => item.type === 'P75');
            const p99Latencies = latencyData.filter(item => item.type === 'P99');
            
            if (p75Latencies.length > 0) {
                const recentP75 = p75Latencies.slice(-5);
                p75Duration = recentP75.reduce((sum, item) => sum + (item.latency || 0), 0) / recentP75.length;
            }
            
            if (p99Latencies.length > 0) {
                const recentP99 = p99Latencies.slice(-5);
                p99Duration = recentP99.reduce((sum, item) => sum + (item.latency || 0), 0) / recentP99.length;
            }
        }

        return {
            avgDuration: avgDuration || selectedObj.data?.avgDuration || 0,
            qps: qps || selectedObj.data?.qps || 0,
            errorRate: errorRate || selectedObj.data?.errorRate || 0,
            errorCount: totalErrors || selectedObj.data?.errorCount || 0,
            p75Duration: p75Duration || selectedObj.data?.p75Duration || 0,
            p99Duration: p99Duration || selectedObj.data?.p99Duration || 0,
            totalRequests: totalRequests || selectedObj.data?.totalCount || 0
        };
    };

    // 获取资源使用数据
    const fetchResourceMetrics = async () => {
        setMetricsLoading(true);
        try {
            const params = buildRequestParams();
            if (!params) {
                console.warn('未找到节点ID，使用默认资源数据');
                // 使用默认资源数据
                setResourceMetrics({
                    cpuUsage: Math.random() * 30 + 20, // 20-50%
                    memoryUsage: Math.random() * 2 + 1, // 1-3GB
                    networkTraffic: Math.random() * 10 + 5, // 5-15MB/s
                    diskUsage: Math.random() * 50 + 30, // 30-80%
                    threadCount: Math.floor(Math.random() * 50) + 20, // 20-70
                    gcCount: Math.floor(Math.random() * 100) + 50 // 50-150
                });
                return;
            }

            // 假设有获取资源使用情况的接口
            // const response = await getEsKpiResourceUsage(params);
            
            // 模拟接口返回数据
            const mockResourceData = {
                cpuUsage: Math.random() * 40 + 10, // 10-50%
                memoryUsageMB: Math.random() * 3 + 0.5, // 0.5-3.5GB
                networkTrafficMB: Math.random() * 15 + 3, // 3-18MB/s
                diskUsage: Math.random() * 60 + 20, // 20-80%
                threadCount: Math.floor(Math.random() * 60) + 15, // 15-75
                gcCount: Math.floor(Math.random() * 120) + 30 // 30-150
            };

            setResourceMetrics({
                cpuUsage: mockResourceData.cpuUsage,
                memoryUsage: mockResourceData.memoryUsageMB,
                networkTraffic: mockResourceData.networkTrafficMB,
                diskUsage: mockResourceData.diskUsage,
                threadCount: mockResourceData.threadCount,
                gcCount: mockResourceData.gcCount
            });

        } catch (error) {
            console.error('获取资源数据失败:', error);
            // 使用默认数据
            setResourceMetrics({
                cpuUsage: Math.random() * 30 + 20,
                memoryUsage: Math.random() * 2 + 1,
                networkTraffic: Math.random() * 10 + 5,
                diskUsage: Math.random() * 50 + 30,
                threadCount: Math.floor(Math.random() * 50) + 20,
                gcCount: Math.floor(Math.random() * 100) + 50
            });
        } finally {
            setMetricsLoading(false);
        }
    };

    // 获取图表数据
    const fetchChartData = async () => {
        setChartLoading(true);
        try {
            const params = buildRequestParams();
            if (!params) {
                console.warn('未找到节点ID，无法获取图表数据');
                // 使用兜底数据
                const fallbackData = getFallbackChartData();
                setChartData(fallbackData);
                // 计算性能指标
                setPerformanceMetrics(calculatePerformanceMetrics(fallbackData));
                message.warning('未找到节点信息，使用示例数据');
                return;
            }

            console.log('获取图表数据，参数:', params);
            
            // 并行请求三个接口
            const [qpsResponse, errorRateResponse, latencyResponse] = await Promise.all([
                getEsKpiQps(params),
                getEsKpiErrorRate(params),
                getEsKpiLatencyStats(params)
            ]);
            
            // 处理QPS数据
            let requestData = [];
            if (qpsResponse && qpsResponse.success && qpsResponse.data && qpsResponse.data.length > 0) {
                requestData = qpsResponse.data;
                console.log('QPS数据获取成功，数据量:', requestData.length);
            } else {
                console.warn('QPS接口返回空数据，使用兜底数据');
                requestData = getFallbackChartData().requestData;
            }
            
            // 处理错误率数据
            let errorData = [];
            if (errorRateResponse && errorRateResponse.success && errorRateResponse.data && errorRateResponse.data.length > 0) {
                errorData = errorRateResponse.data;
                console.log('错误率数据获取成功，数据量:', errorData.length);
            } else {
                console.warn('错误率接口返回空数据，使用兜底数据');
                errorData = getFallbackChartData().errorData;
            }
            
            // 处理时延数据
            let latencyData = [];
            if (latencyResponse && latencyResponse.success && latencyResponse.data && latencyResponse.data.length > 0) {
                // 转换时延数据格式，假设接口返回的数据需要转换
                latencyData = transformLatencyData(latencyResponse.data);
                console.log('时延数据获取成功，数据量:', latencyData.length);
            } else {
                console.warn('时延接口返回空数据，使用兜底数据');
                latencyData = getFallbackChartData().latencyData;
            }
            
            const newChartData = {
                requestData,
                errorData,
                latencyData
            };
            
            setChartData(newChartData);
            // 计算性能指标
            setPerformanceMetrics(calculatePerformanceMetrics(newChartData));
            
            message.success('图表数据加载成功');
        } catch (error) {
            console.error('获取图表数据失败:', error);
            // 使用兜底数据
            const fallbackData = getFallbackChartData();
            setChartData(fallbackData);
            setPerformanceMetrics(calculatePerformanceMetrics(fallbackData));
            message.warning('图表数据加载失败，使用示例数据');
        } finally {
            setChartLoading(false);
        }
    };

    // 转换时延数据格式
    const transformLatencyData = (originalData) => {
        if (!originalData || !Array.isArray(originalData)) return [];
        
        // 假设原始数据格式为：[{ time: timestamp, avg: number, p75: number, p99: number }]
        // 转换为：[{ time: timestamp, latency: number, type: 'avg' }, ...]
        const transformed = [];
        
        originalData.forEach(item => {
            if (item.avg !== undefined) {
                transformed.push({
                    time: item.time,
                    latency: item.avg,
                    type: '平均时延'
                });
            }
            if (item.p75 !== undefined) {
                transformed.push({
                    time: item.time,
                    latency: item.p75,
                    type: 'P75'
                });
            }
            if (item.p99 !== undefined) {
                transformed.push({
                    time: item.time,
                    latency: item.p99,
                    type: 'P99'
                });
            }
        });
        
        return transformed;
    };

    // 获取端点列表数据 - 根据 pointType 选择不同的 API
    const fetchEndpointData = async () => {
        setEndpointLoading(true);
        try {
            const params = buildRequestParams();
            if (!params) {
                console.warn('未找到节点ID，无法获取端点数据');
                setEndpointData(defaultEndpointData);
                message.warning('未找到节点信息，使用默认数据');
                return;
            }

            console.log('请求端点数据，参数:', params);
            
            let response;
            
            // 根据 pointType 选择不同的 API
            if (selectedObj.pointType === 'node') {
                // 节点相关的端点数据
                response = await getEsNodeEndpointList(params);
                console.log('调用节点端点API', response);
            } else if (selectedObj.pointType === 'edge') {
                // 边相关的端点数据
                response = await getEsEdgeEndpointList(params);
                console.log('调用边端点API，参数:', params);
            } else {
                // 默认情况，使用节点API
                response = await getEsNodeEndpointList(params);
                console.log('使用默认节点端点API');
            }
            
            // 根据实际API响应结构调整
            if (response && response.length > 0) {
                setEndpointData(response);
                message.success('端点数据加载成功');
            } else {
                // 如果响应结构不符合预期，使用兜底数据
                console.warn('API响应为空或格式不符合预期，使用兜底数据');
                setEndpointData(defaultEndpointData);
                message.warning('接口返回空数据，使用默认数据');
            }
        } catch (error) {
            console.error('获取端点数据失败:', error);
            setEndpointData(defaultEndpointData);
            message.error('端点数据加载失败，使用默认数据');
        } finally {
            setEndpointLoading(false);
        }
    };

    // 监听activeTab变化，当切换到对应tab时获取数据
    useEffect(() => {
        if (activeTab === 'endpoints') {
            fetchEndpointData();
        } else if (activeTab === 'metrics') {
            fetchChartData();
            fetchResourceMetrics();
        }
    }, [activeTab]);

    // 监听selectedObj变化，当selectedObj变化时重新获取数据
    useEffect(() => {
        if (activeTab === 'endpoints' && selectedObj.pointType) {
            fetchEndpointData();
        } else if (activeTab === 'metrics') {
            fetchChartData();
            fetchResourceMetrics();
        }
    }, [selectedObj]);

    // 监听timeRange变化，重新获取数据
    useEffect(() => {
        if (activeTab === 'endpoints') {
            fetchEndpointData();
        } else if (activeTab === 'metrics') {
            fetchChartData();
            fetchResourceMetrics();
        }
    }, [timeRange]);

    // 处理时间范围选择
    const handleTimeChange = (dates) => {
        if (dates && dates.length === 2) {
            setTimeRange({
                startTime: dates[0].valueOf(),
                endTime: dates[1].valueOf()
            });
        }
    };

    // 应用时间范围并重新获取数据
    const applyTimeRange = () => {
        if (!timeRange.startTime || !timeRange.endTime) {
            message.warning('请选择完整的时间范围');
            return;
        }
        
        if (timeRange.endTime <= timeRange.startTime) {
            message.error('结束时间必须大于开始时间');
            return;
        }
        
        // 根据当前激活的tab重新获取数据
        if (activeTab === 'endpoints') {
            fetchEndpointData();
        } else if (activeTab === 'metrics') {
            fetchChartData();
            fetchResourceMetrics();
        }
        
        message.success('时间范围已更新');
    };

    const formatNumber = (num) => {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toFixed(1);
    };

    // 格式化时延显示
    const formatLatency = (latency) => {
        if (latency >= 1000) return (latency / 1000).toFixed(1) + 's';
        return latency.toFixed(0) + 'ms';
    };

    // 格式化时间显示
    const formatTimeDisplay = () => {
        if (timeRange.startTime && timeRange.endTime) {
            return `${moment(timeRange.startTime).format('YYYY-MM-DD HH:mm')} 至 ${moment(timeRange.endTime).format('YYYY-MM-DD HH:mm')}`;
        }
        return '请选择时间范围';
    };

    // 获取当前对象的显示名称
    const getObjectDisplayName = () => {
        if (selectedObj.pointType === 'node') {
            return selectedObj.data?.containerName || '节点';
        } else if (selectedObj.pointType === 'edge') {
            return `连接 ${selectedObj.source} → ${selectedObj.target}`;
        }
        return '对象';
    };

    // 获取当前节点ID的显示文本
    const getCurrentNodeIdText = () => {
        const nodeId = getCurrentNodeId();
        return nodeId ? ` (节点ID: ${nodeId})` : '';
    };

    // 获取参数类型显示文本
    const getParamTypeText = () => {
        if (selectedObj.pointType === 'node') {
            return 'nodeId';
        } else if (selectedObj.pointType === 'edge') {
            return 'srcId';
        }
        return 'ID';
    };

    function transformData(originalData) {
        if (!originalData || !Array.isArray(originalData)) return [];
        
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

    // 图表配置
    const requestChartConfig = {
        data: chartData.requestData,
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
                minute: '2-digit',
            });
            },
        },
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
    
    // 转换错误率数据
    const transformedErrorData = transformData(chartData.errorData);

    // 错误数图表配置
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
            formatter: (value) => `${value}ms`,
        },
        },
        tooltip: {
        formatter: (datum) => {
            const formatTime = new Date(datum.time).toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            });
            return [
            { name: '时间', value: formatTime },
            { name: '时延类型', value: datum.type },
            { name: '时延', value: `${datum.latency.toFixed(2)}ms` },
            ];
        },
        },
    };

    return (
            <div>
                {/* 在Tabs上方添加时间段选择器 */}
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    marginBottom: 16,
                    padding: '0 20px',
                    alignItems: 'center',
                    gap: '12px'
                }}
                >
                <div style={{ fontSize: '14px', color: '#666' }}>
                    当前对象: {getObjectDisplayName()}{getCurrentNodeIdText()} | 参数类型: {getParamTypeText()} | 时间段: {formatTimeDisplay()}
                </div>
                
                <Space>
                    <RangePicker
                        showTime={{ 
                            format: 'HH:mm',
                            defaultValue: [moment('00:00', 'HH:mm'), moment('23:59', 'HH:mm')]
                        }}
                        format="YYYY-MM-DD HH:mm"
                        onChange={handleTimeChange}
                        value={[
                            timeRange.startTime ? moment(timeRange.startTime) : null,
                            timeRange.endTime ? moment(timeRange.endTime) : null
                        ]}
                        style={{ width: 360 }}
                        placeholder={['开始时间', '结束时间']}
                    />
                    <Button 
                        type="primary" 
                        onClick={applyTimeRange}
                        disabled={!timeRange.startTime || !timeRange.endTime}
                    >
                        应用
                    </Button>
                </Space>
                </div>

                <Tabs
                activeKey={activeTab}
                onChange={setActiveTab}
                tabPosition="top"
                style={{ marginTop: -16 }}
                >
                <Tabs.TabPane tab="应用指标" key="metrics">
                    <div style={{ padding: '20px' }}>
                    <h3>指标曲线{getCurrentNodeIdText()} ({getParamTypeText()})</h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
                        <Row gutter={16} style={{ marginBottom: 16, width: '100%' }}>
                        <Col span={8}>
                            <Card
                                title="请求数"
                                size="small"
                                extra={<span style={{ color: '#1890ff' }}>总数: {formatNumber(performanceMetrics.totalRequests)}</span>}
                                >
                            <Line
                                {...requestChartConfig}
                                loading={chartLoading}
                                style={{ height: 200 }}
                            />
                            </Card>
                        </Col>
                        <Col span={8}>
                            <Card
                            title="错误数"
                            size="small"
                            extra={<span style={{ color: '#ff4d4f' }}>总数: {formatNumber(performanceMetrics.errorCount)}</span>}
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
                            extra={<span style={{ color: '#faad14' }}>平均: {formatLatency(performanceMetrics.avgDuration)}</span>}
                            >
                            <Area
                                {...latencyChartConfig}
                                loading={chartLoading}
                                style={{ height: 200 }}
                            />
                            </Card>
                        </Col>
                        </Row>
                    </div>
                    <h3 style={{ marginTop: '30px' }}>性能指标</h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
                        <Card size="small" style={{ width: 200 }} loading={metricsLoading}>
                            <Statistic
                                title="平均耗时"
                                value={performanceMetrics.avgDuration}
                                formatter={value => formatLatency(value)}
                                valueStyle={{ color: '#1890ff' }}
                                prefix="≈"
                            />
                            <div style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
                                P75: {formatLatency(performanceMetrics.p75Duration)} | P99: {formatLatency(performanceMetrics.p99Duration)}
                            </div>
                        </Card>

                        <Card size="small" style={{ width: 200 }} loading={metricsLoading}>
                            <Statistic
                                title="QPS"
                                value={performanceMetrics.qps}
                                precision={2}
                                valueStyle={{ color: '#52c41a' }}
                                suffix="次/秒"
                            />
                            <div style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
                                总请求: {formatNumber(performanceMetrics.totalRequests)}
                            </div>
                        </Card>

                        <Card size="small" style={{ width: 200 }} loading={metricsLoading}>
                            <Statistic
                                title="错误率"
                                value={performanceMetrics.errorRate * 100}
                                precision={2}
                                suffix="%"
                                valueStyle={{ 
                                    color: performanceMetrics.errorRate > 0.01 ? '#f5222d' : '#52c41a'
                                }}
                            />
                            <div style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
                                错误数: {formatNumber(performanceMetrics.errorCount)}
                            </div>
                        </Card>

                        <Card size="small" style={{ width: 200 }} loading={metricsLoading}>
                            <Statistic
                                title="成功率"
                                value={(1 - performanceMetrics.errorRate) * 100}
                                precision={2}
                                suffix="%"
                                valueStyle={{ color: '#52c41a' }}
                            />
                            <div style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
                                健康状态: {performanceMetrics.errorRate < 0.01 ? '良好' : '警告'}
                            </div>
                        </Card>
                    </div>
                    </div>
                </Tabs.TabPane>

                <Tabs.TabPane tab="端点列表" key="endpoints">
                    <div style={{ marginBottom: 16, padding: '0 20px' }}>
                        <h4>
                            {selectedObj.pointType === 'node' ? '节点' : '连接'}相关端点列表 ({getParamTypeText()})
                            {selectedObj.pointType === 'node' && selectedObj.data?.containerName && 
                                ` - ${selectedObj.data.containerName}`}
                            {selectedObj.pointType === 'edge' && 
                                ` - ${selectedObj.source} → ${selectedObj.target}`}
                            {getCurrentNodeIdText()}
                        </h4>
                    </div>
                    <EndpointMonitoringTable 
                        data={endpointData} 
                        loading={endpointLoading}
                    />
                </Tabs.TabPane>

                <Tabs.TabPane tab="调用日志" key="logs">
                    <PointDrawer 
                        selectId={getCurrentNodeId()}
                        startTime={timeRange.startTime}
                        endTime={timeRange.endTime}
                        pointType={selectedObj.pointType}
                        sourceId={getCurrentNodeId()}
                        targetId={getTargetNodeId()}
                        selectedObj={selectedObj}
                    />
                </Tabs.TabPane>
                </Tabs>
            </div>
    )
};

export default PointDetailDrawer;