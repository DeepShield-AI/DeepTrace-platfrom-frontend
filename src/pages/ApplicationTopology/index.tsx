import React, { useEffect, useState, useCallback } from 'react';
import {
    PageContainer,
    ProCard
} from '@ant-design/pro-components';
import {
    Button,
    Tooltip,
    Row,
    Col,
    Spin,
    Card,
    Tag,
    Empty,
    Divider,
    Checkbox,
    Space,
    Statistic,
    message,
    Alert,
    DatePicker
} from 'antd';
import { ThunderboltOutlined, InfoOutlined, ReloadOutlined, DashboardOutlined } from '@ant-design/icons';
import ReactFlow, {
  ReactFlowProvider,
} from 'react-flow-renderer';
import 'react-flow-renderer/dist/style.css';
import dagre from 'dagre';
import TopologyGraph from "./component/TopologyGraph.jsx"
import { 
    traceTableQuery, 
    traceChartQuery, 
    getFlamegraphDataByTraceId, 
    getFilters, 
    getTraceDetail,
    getEsTracesGraphEdges,
    getEsTracesGraphNodes
} from '../../services/server.js';
import moment from 'moment';

const { RangePicker } = DatePicker;

// 自定义节点组件
const CustomNode = ({ data, selected }) => {
    const formatNumber = (num) => {
        if (num >= 1000000) return (num / 1000000).toFixed(2) + 'm';
        if (num >= 1000) return (num / 1000).toFixed(2) + 'k';
        return num.toFixed(2);
    };

    return (
        <div style={{ 
            padding: '12px', 
            borderRadius: '8px', 
            border: `2px solid ${data.errorRate > 0 ? '#ff4d4f' : '#52c41a'}`,
            width: 180,
            backgroundColor: data.errorRate > 0 ? '#fff1f0' : '#f6ffed',
            boxShadow: selected ? '0 0 0 2px rgba(24, 144, 255, 0.5)' : '0 2px 8px rgba(0,0,0,0.1)',
            transition: 'all 0.2s',
            cursor: 'pointer'
        }}>
            <div style={{
                fontWeight: 'bold', 
                marginBottom: '8px', 
                fontSize: '14px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                {data.containerName.replace('/', '')}
                {data.errorRate > 0 && <Tag size="small" color="error">异常</Tag>}
            </div>
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                平均耗时: {formatNumber(data.avgDuration)}μs
            </div>
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                QPS: {data.qps.toFixed(2)}
            </div>
            <div style={{ 
                fontSize: '12px', 
                color: data.errorCount > 0 ? '#f5222d' : '#666',
                marginBottom: '6px'
            }}>
                错误数: {data.errorCount} ({(data.errorRate * 100).toFixed(1)}%)
            </div>
            <Tooltip title="查看节点详情">
                <Button 
                    icon={<InfoOutlined />} 
                    size="small" 
                    style={{ padding: '2px 6px', fontSize: '12px' }}
                    type={data.errorRate > 0 ? 'text' : 'default'}
                />
            </Tooltip>
        </div>
    );
};

// 节点类型映射
const nodeTypes = { customNode: CustomNode };

// 使用Dagre布局算法自动排列节点
const getLayoutedElements = (nodes, edges, direction = 'LR') => {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));
    dagreGraph.setGraph({ 
        rankdir: direction,
        nodesep: 60,
        ranksep: 120,
        marginx: 20,
        marginy: 20
    });

    // 注册所有节点到Dagre
    nodes.forEach(node => {
        dagreGraph.setNode(node.id, { 
            width: 180,
            height: 130,
        });
    });

    // 注册所有边到Dagre
    edges.forEach(edge => {
        dagreGraph.setEdge(edge.source, edge.target);
    });

    // 执行布局计算
    dagre.layout(dagreGraph);

    // 更新节点位置
    const layoutedNodes = nodes.map(node => {
        const dagreNode = dagreGraph.node(node.id);
        return {
            ...node,
            position: {
                x: dagreNode.x - 90,
                y: dagreNode.y - 65
            }
        };
    });

    // 更新边样式
    const layoutedEdges = edges.map(edge => ({
        ...edge,
        type: 'smoothstep',
        style: {
            stroke: edge.data?.errorRate > 0 ? '#f5222d' : '#1890ff',
            strokeWidth: Math.max(2, Math.min(6, 1 + (edge.data?.qps || 0) / 300)),
        },
        label: `QPS: ${edge.data?.qps?.toFixed(2) || '0.00'}`,
        labelBgStyle: { fill: 'rgba(255, 255, 255, 0.8)' },
        labelStyle: { fill: '#000', fontWeight: 700 },
    }));

    console.log(`布局完成：节点=${layoutedNodes.length}，边=${layoutedEdges.length}`);
    return { layoutedNodes, layoutedEdges };
};

// 默认数据（用于兜底）
const DEFAULT_NODE_DATA = [
    { "nodeId": "1691817", "containerName": "/service_1", "avgDuration": 1525972.3423831072, "errorCount": 123, "totalCount": 1326.0, "errorRate": 0.1, "qps": 0.3684 },
    { "nodeId": "1691818", "containerName": "/service_2", "avgDuration": 1398902.0, "errorCount": 0, "totalCount": 496.0, "errorRate": 0.0, "qps": 0.1377 },
    { "nodeId": "1691819", "containerName": "/service_3", "avgDuration": 1398902.0, "errorCount": 0, "totalCount": 496.0, "errorRate": 0.0, "qps": 0.1377 },
    { "nodeId": "1691827", "containerName": "/service_4", "avgDuration": 1398902.0, "errorCount": 0, "totalCount": 496.0, "errorRate": 0.0, "qps": 0.1377 },
    { "nodeId": "1691828", "containerName": "/service_5", "avgDuration": 1398902.0, "errorCount": 0, "totalCount": 496.0, "errorRate": 0.0, "qps": 0.1377 },
    { "nodeId": "1691829", "containerName": "/service_6", "avgDuration": 1398902.0, "errorCount": 0, "totalCount": 496.0, "errorRate": 0.0, "qps": 0.1377 },
];

const DEFAULT_EDGE_DATA = {
    "1691817": [
        { "srcNodeId": "1691817", "dstNodeId": "1691818", "avgDuration": 11111111, "totalCount": 111, "errorRate": 0.0, "qps": 1111 },
        { "srcNodeId": "1691817", "dstNodeId": "1691819", "avgDuration": 222222, "totalCount": 2222, "errorRate": 0.0, "qps": 0.222 }
    ],
    "1691827": [
        { "srcNodeId": "1691827", "dstNodeId": "1691818", "avgDuration": 11111111, "totalCount": 111, "errorRate": 0.0, "qps": 31333 },
        { "srcNodeId": "1691827", "dstNodeId": "1691819", "avgDuration": 222222, "totalCount": 2222, "errorRate": 0.0, "qps": 0.222 }
    ],
    "1691819": [
        { "srcNodeId": "1691819", "dstNodeId": "1691828", "avgDuration": 11111111, "totalCount": 111, "errorRate": 0.0, "qps": 31333 },
    ],
    "1691828": [
        { "srcNodeId": "1691828", "dstNodeId": "1691829", "avgDuration": 11111111, "totalCount": 111, "errorRate": 0.0, "qps": 31333 },
    ],
    "1691829": [
        { "srcNodeId": "1691829", "dstNodeId": "1691817", "avgDuration": 11111111, "totalCount": 111, "errorRate": 0.0, "qps": 31333 },
    ],
};

// 固定筛选选项
const ENDPOINTS_OPTIONS = [
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

const PROTOCOLS_OPTIONS = [
    "MongoDB",
    "Thrift",
    "Redis",
    "Memcached",
    "Kafka"
];

const STATUS_CODE_OPTIONS = [
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

// 页面入口组件
const ApplicationTopology = () => {
    // 定义默认日期范围：2025年10月30日 - 2025年10月31日
    const DEFAULT_START_DATE = moment('2025-10-30 00:00:00');
    const DEFAULT_END_DATE = moment('2025-10-31 23:59:59');
    
    // 时间筛选状态
    const [timeRange, setTimeRange] = useState([]);
    const [startTime, setStartTime] = useState(null);
    const [endTime, setEndTime] = useState(null);
    
    // 筛选状态
    const [statusCodeFilters, setStatusCodeFilters] = useState([...STATUS_CODE_OPTIONS]);
    const [endpointFilters, setEndpointFilters] = useState([...ENDPOINTS_OPTIONS]);
    const [protocolFilters, setProtocolFilters] = useState([...PROTOCOLS_OPTIONS]);
    
    // 数据状态
    const [nodeData, setNodeData] = useState(DEFAULT_NODE_DATA);
    const [edgeData, setEdgeData] = useState(DEFAULT_EDGE_DATA);
    
    // 加载状态
    const [loading, setLoading] = useState(false);
    const [lastFetchTime, setLastFetchTime] = useState(null);

    // 统计边总数
    const totalEdges = Object.values(edgeData).reduce((sum, edges) => sum + edges.length, 0);

    // 获取拓扑数据
    const fetchTopologyData = useCallback(async (start, end, statusCodes, endpoints, protocols) => {
        setLoading(true);
        
        try {
            console.log('获取拓扑数据参数（毫秒级）:', { 
                start, 
                end, 
                statusCodes,
                endpoints,
                protocols,
                startFormatted: moment(start).format('YYYY-MM-DD HH:mm:ss'),
                endFormatted: moment(end).format('YYYY-MM-DD HH:mm:ss')
            });
            
            // 并行请求节点和边数据
            const [nodesResponse, edgesResponse] = await Promise.all([
                getEsTracesGraphNodes({
                    // 传递毫秒级时间戳和筛选参数
                    startTime: start,
                    endTime: end,
                    statusCodes: statusCodes,
                    endpoints: endpoints,
                    protocols: protocols
                }).catch(error => {
                    console.error('获取节点数据失败:', error);
                    message.warning('节点数据获取失败，使用默认数据');
                    return { success: false, data: DEFAULT_NODE_DATA };
                }),
                getEsTracesGraphEdges({
                    // 传递毫秒级时间戳和筛选参数
                    startTime: start,
                    endTime: end,
                    statusCodes: statusCodes,
                    endpoints: endpoints,
                    protocols: protocols
                }).catch(error => {
                    console.error('获取边数据失败:', error);
                    message.warning('边数据获取失败，使用默认数据');
                    return { success: false, data: DEFAULT_EDGE_DATA };
                })
            ]);

            // 更新节点数据（接口成功则用接口数据，失败则用默认数据）
            if (nodesResponse) {
                setNodeData(nodesResponse || DEFAULT_NODE_DATA);
            } else {
                setNodeData(DEFAULT_NODE_DATA);
            }

            // 更新边数据（接口成功则用接口数据，失败则用默认数据）
            if (edgesResponse) {
                setEdgeData(edgesResponse || DEFAULT_EDGE_DATA);
            } else {
                setEdgeData(DEFAULT_EDGE_DATA);
            }

            setLastFetchTime(new Date());
            message.success('拓扑数据更新成功');
            
        } catch (error) {
            console.error('获取拓扑数据异常:', error);
            message.error('获取拓扑数据异常，使用默认数据');
            // 异常情况下使用默认数据兜底
            setNodeData(DEFAULT_NODE_DATA);
            setEdgeData(DEFAULT_EDGE_DATA);
        } finally {
            setLoading(false);
        }
    }, []);

    // 处理时间范围变化
    const handleTimeRangeChange = (dates, dateStrings) => {
        setTimeRange(dates);
        
        if (dates && dates.length === 2) {
            // 修改为毫秒级时间戳（直接使用valueOf()获取毫秒级时间戳）
            const startTimestamp = dates[0].valueOf();
            const endTimestamp = dates[1].valueOf();
            setStartTime(startTimestamp);
            setEndTime(endTimestamp);
        } else {
            setStartTime(null);
            setEndTime(null);
        }
    };

    // 快捷选择时间范围（调整为基于默认日期的相对时间）
    const rangePresets = [
        {
            label: '最近1小时',
            value: [moment(DEFAULT_END_DATE).subtract(1, 'hour'), DEFAULT_END_DATE]
        },
        {
            label: '最近3小时',
            value: [moment(DEFAULT_END_DATE).subtract(3, 'hours'), DEFAULT_END_DATE]
        },
        {
            label: '最近6小时',
            value: [moment(DEFAULT_END_DATE).subtract(6, 'hours'), DEFAULT_END_DATE]
        },
        {
            label: '最近12小时',
            value: [moment(DEFAULT_END_DATE).subtract(12, 'hours'), DEFAULT_END_DATE]
        },
        {
            label: '最近24小时',
            value: [moment(DEFAULT_END_DATE).subtract(24, 'hours'), DEFAULT_END_DATE]
        },
        {
            label: '最近3天',
            value: [moment(DEFAULT_END_DATE).subtract(3, 'days'), DEFAULT_END_DATE]
        }
    ];

    // 刷新数据函数
    const handleRefreshData = () => {
        if (!startTime || !endTime) {
            message.warning('请先选择时间范围');
            return;
        }
        
        fetchTopologyData(startTime, endTime, statusCodeFilters, endpointFilters, protocolFilters);
    };

    // 自动刷新数据（当筛选条件变化时）
    useEffect(() => {
        if (startTime && endTime) {
            // 防抖处理，避免频繁请求
            const timer = setTimeout(() => {
                fetchTopologyData(startTime, endTime, statusCodeFilters, endpointFilters, protocolFilters);
            }, 500);
            
            return () => clearTimeout(timer);
        }
    }, [startTime, endTime, statusCodeFilters, endpointFilters, protocolFilters, fetchTopologyData]);

    const handleStatusCodeFilterChange = (checkedValues) => {
        setStatusCodeFilters(checkedValues);
    };
    
    const handleEndpointFilterChange = (checkedValues) => {
        setEndpointFilters(checkedValues);
    };
    
    const handleProtocolFilterChange = (checkedValues) => {
        setProtocolFilters(checkedValues);
    };

    // 重置所有筛选
    const handleResetAll = () => {
        setStatusCodeFilters([...STATUS_CODE_OPTIONS]);
        setEndpointFilters([...ENDPOINTS_OPTIONS]);
        setProtocolFilters([...PROTOCOLS_OPTIONS]);
        
        // 重置时间范围到默认日期
        setTimeRange([DEFAULT_START_DATE, DEFAULT_END_DATE]);
        setStartTime(DEFAULT_START_DATE.valueOf());
        setEndTime(DEFAULT_END_DATE.valueOf());
    };

    useEffect(() => {
        // 设置默认时间范围为2025年10月30日-10月31日
        setTimeRange([DEFAULT_START_DATE, DEFAULT_END_DATE]);
        setStartTime(DEFAULT_START_DATE.valueOf());
        setEndTime(DEFAULT_END_DATE.valueOf());
    }, []);

    return (
        <PageContainer 
            content={
                <div>
                    <Alert
                    message="调用链拓扑提供节点的拓扑展示，可通过点击拓扑图部分的点和边查看详情。"
                    type="info"
                    showIcon
                    style={{ marginBottom: 16 }}
                    />
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <DashboardOutlined style={{ marginRight: 8, fontSize: 18 }} />
                            <span>调用链拓扑</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            {lastFetchTime && (
                                <span style={{ fontSize: '12px', color: '#666' }}>
                                    最后更新: {moment(lastFetchTime).format('HH:mm:ss')}
                                </span>
                            )}
                            <Button 
                                icon={<ReloadOutlined />} 
                                onClick={handleRefreshData}
                                loading={loading}
                                size="small"
                            >
                                刷新
                            </Button>
                        </div>
                    </div>
                </div>
            }
        >
            <Spin spinning={loading} size="large">
                <ProCard split="vertical" gutter={16}>
                    {/* 左侧筛选面板 */}
                    <ProCard 
                        title="拓扑筛选" 
                        colSpan="20%"
                        headerBordered
                        extra={<ThunderboltOutlined />}
                        style={{ height: '100%' }}
                    >
                        {/* 时间范围筛选 */}
                        <div style={{ marginBottom: 16 }}>
                            <Divider orientation="left" plain>时间范围</Divider>
                            <RangePicker
                                presets={rangePresets}
                                showTime
                                format="YYYY-MM-DD HH:mm:ss"
                                value={timeRange}
                                onChange={handleTimeRangeChange}
                                style={{ width: '100%', marginBottom: 12 }}
                                placeholder={['开始时间', '结束时间']}
                            />
                            <Button 
                                type="primary" 
                                block 
                                onClick={handleRefreshData}
                                icon={<ReloadOutlined />}
                                style={{ marginBottom: 8 }}
                                loading={loading}
                            >
                                应用筛选
                            </Button>
                            {startTime && endTime && (
                                <div style={{ 
                                    fontSize: '12px', 
                                    color: '#666', 
                                    padding: '8px', 
                                    backgroundColor: '#f5f5f5',
                                    borderRadius: '4px',
                                    marginTop: '8px'
                                }}>
                                    <div>开始: {moment(startTime).format('YYYY-MM-DD HH:mm:ss')}</div>
                                    <div>结束: {moment(endTime).format('YYYY-MM-DD HH:mm:ss')}</div>
                                    <div>时间戳(毫秒): {startTime} - {endTime}</div>
                                </div>
                            )}
                        </div>

                        {/* Endpoints筛选 */}
                        <div style={{ marginBottom: 16 }}>
                            <Divider orientation="left" plain>Endpoints</Divider>
                            <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span>已选择 {endpointFilters.length} 个</span>
                                <Button 
                                    type="link" 
                                    size="small" 
                                    onClick={() => setEndpointFilters(endpointFilters.length === ENDPOINTS_OPTIONS.length ? [] : [...ENDPOINTS_OPTIONS])}
                                >
                                    {endpointFilters.length === ENDPOINTS_OPTIONS.length ? '取消全选' : '全选'}
                                </Button>
                            </div>
                            <Checkbox.Group 
                                value={endpointFilters} 
                                onChange={handleEndpointFilterChange}
                                style={{ width: '100%' }}
                            >
                                <Space direction="vertical" style={{ width: '100%', maxHeight: '200px', overflowY: 'auto' }}>
                                    {ENDPOINTS_OPTIONS.map(endpoint => (
                                        <Checkbox key={endpoint} value={endpoint} style={{ width: '100%', fontSize: '12px' }}>
                                            {endpoint}
                                        </Checkbox>
                                    ))}
                                </Space>
                            </Checkbox.Group>
                        </div>
                        
                        {/* Protocols筛选 */}
                        <div style={{ marginBottom: 16 }}>
                            <Divider orientation="left" plain>Protocols</Divider>
                            <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span>已选择 {protocolFilters.length} 个</span>
                                <Button 
                                    type="link" 
                                    size="small" 
                                    onClick={() => setProtocolFilters(protocolFilters.length === PROTOCOLS_OPTIONS.length ? [] : [...PROTOCOLS_OPTIONS])}
                                >
                                    {protocolFilters.length === PROTOCOLS_OPTIONS.length ? '取消全选' : '全选'}
                                </Button>
                            </div>
                            <Checkbox.Group 
                                value={protocolFilters} 
                                onChange={handleProtocolFilterChange}
                                style={{ width: '100%' }}
                            >
                                <Space direction="vertical" style={{ width: '100%' }}>
                                    {PROTOCOLS_OPTIONS.map(protocol => (
                                        <Checkbox key={protocol} value={protocol} style={{ width: '100%', fontSize: '12px' }}>
                                            {protocol}
                                        </Checkbox>
                                    ))}
                                </Space>
                            </Checkbox.Group>
                        </div>
                        
                        {/* Status Code筛选 */}
                        <div style={{ marginBottom: 16 }}>
                            <Divider orientation="left" plain>Status Code</Divider>
                            <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span>已选择 {statusCodeFilters.length} 个</span>
                                <Button 
                                    type="link" 
                                    size="small" 
                                    onClick={() => setStatusCodeFilters(statusCodeFilters.length === STATUS_CODE_OPTIONS.length ? [] : [...STATUS_CODE_OPTIONS])}
                                >
                                    {statusCodeFilters.length === STATUS_CODE_OPTIONS.length ? '取消全选' : '全选'}
                                </Button>
                            </div>
                            <Checkbox.Group 
                                value={statusCodeFilters} 
                                onChange={handleStatusCodeFilterChange}
                                style={{ width: '100%' }}
                            >
                                <Space direction="vertical" style={{ width: '100%' }}>
                                    {STATUS_CODE_OPTIONS.map(statusCode => (
                                        <Checkbox key={statusCode} value={statusCode} style={{ width: '100%', fontSize: '12px' }}>
                                            {statusCode}
                                        </Checkbox>
                                    ))}
                                </Space>
                            </Checkbox.Group>
                        </div>
                        
                        <Divider />
                        <div>
                            <Statistic 
                                title="总节点数" 
                                value={nodeData.length}
                            />
                            <Statistic 
                                title="总边数" 
                                value={totalEdges}
                                style={{ marginTop: 8 }}
                            />
                            <Button 
                                type="primary" 
                                block 
                                onClick={handleResetAll}
                                style={{ marginBottom: 8, marginTop: 16 }}
                            >
                                重置所有筛选
                            </Button>
                        </div>
                        <div style={{ padding: '16px' }}>
                            <h4 style={{ marginBottom: '12px' }}>服务节点状态</h4>
                            <div style={{ marginBottom: '20px', maxHeight: '200px', overflowY: 'auto' }}>
                                {nodeData.map(node => (
                                    <Card 
                                        key={node.nodeId} 
                                        size="small"
                                        style={{ 
                                            marginBottom: '8px',
                                            borderColor: node.errorRate > 0 ? '#ffa39e' : '#b7eb8f',
                                            backgroundColor: node.errorRate > 0 ? '#fff1f0' : '#f6ffed'
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontWeight: '500', fontSize: '12px' }}>
                                                {node.containerName.replace('/', '')}
                                            </span>
                                            <Tag color={node.errorRate > 0 ? 'error' : 'success'} size="small">
                                                {node.errorRate > 0 ? '异常' : '正常'}
                                            </Tag>
                                        </div>
                                        <div style={{ fontSize: '10px', color: '#666', marginTop: '4px' }}>
                                            错误率: {(node.errorRate * 100).toFixed(1)}% | QPS: {node.qps.toFixed(2)}
                                        </div>
                                    </Card>
                                ))}
                            </div>
                            
                            <h4 style={{ marginBottom: '12px' }}>数据概览</h4>
                            <div style={{ fontSize: '12px', color: '#666', marginBottom: '20px' }}>
                                <p>• 节点总数: <strong>{nodeData.length}</strong> 个</p>
                                <p>• 边总数: <strong>{totalEdges}</strong> 条</p>
                                <p>• 异常节点: <strong>{nodeData.filter(n => n.errorRate > 0).length}</strong> 个</p>
                            </div>
                            
                            <h4 style={{ marginBottom: '12px' }}>图例说明</h4>
                            <div style={{ fontSize: '12px', color: '#666' }}>
                                <p>• 节点颜色: <span style={{ color: '#52c41a' }}>健康</span> / <span style={{ color: '#ff4d4f' }}>异常</span></p>
                                <p>• 边颜色: <span style={{ color: '#1890ff' }}>健康调用</span> / <span style={{ color: '#f5222d' }}>异常调用</span></p>
                                <p>• 边粗细: 与 QPS 正相关（越粗 QPS 越高）</p>
                                <p>• 边标签: 显示当前调用的 QPS 值</p>
                            </div>
                        </div>
                    </ProCard>
                    
                    {/* 右侧拓扑区域 */}
                    <ProCard title="拓扑图" headerBordered>
                        <ReactFlowProvider>
                            {/* 将毫秒级时间戳传递给TopologyGraph组件 */}
                            <TopologyGraph 
                                nodeData={nodeData} 
                                edgeData={edgeData} 
                                startTime={startTime}
                                endTime={endTime}
                            />
                        </ReactFlowProvider>
                        
                        {/* 底部统计面板 */}
                        <div style={{ padding: '16px', borderTop: '1px solid #f0f0f0', marginTop: '10px' }}>
                            <Row gutter={24}>
                                <Col span={12}>
                                    <h4 style={{ marginBottom: '12px', fontSize: '14px' }}>调用关系统计</h4>
                                    <div style={{ marginTop: '12px', maxHeight: '300px', overflowY: 'auto' }}>
                                        {Object.entries(edgeData).map(([srcId, edgesList]) => {
                                            const srcNode = nodeData.find(n => n.nodeId === srcId);
                                            return (
                                                <div key={srcId} style={{ marginBottom: '16px' }}>
                                                    <div style={{ fontWeight: '500', color: '#333' }}>
                                                        {srcNode?.containerName.replace('/', '')}
                                                    </div>
                                                    <div style={{ marginLeft: '16px', marginTop: '8px' }}>
                                                        {edgesList.map(edge => {
                                                            const dstNode = nodeData.find(n => n.nodeId === edge.dstNodeId);
                                                            return (
                                                                <div key={`${srcId}-${edge.dstNodeId}`} style={{ marginBottom: '6px', fontSize: '13px' }}>
                                                                    <span style={{ color: '#1890ff' }}>→</span> 
                                                                    <span style={{ marginLeft: '8px' }}>{dstNode?.containerName.replace('/', '')}</span>
                                                                    <span style={{ marginLeft: '12px', color: '#666', fontSize: '12px' }}>
                                                                        QPS: {edge.qps.toFixed(2)} | 耗时: {(edge.avgDuration / 1000).toFixed(2)}ms
                                                                    </span>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </Col>
                                <Col span={12}>
                                    <h4 style={{ marginBottom: '12px', fontSize: '14px' }}>节点健康状态</h4>
                                    <div style={{ marginTop: '12px', maxHeight: '300px', overflowY: 'auto' }}>
                                        {nodeData.map(node => (
                                            <div 
                                                key={node.nodeId} 
                                                style={{ 
                                                    padding: '10px', 
                                                    marginBottom: '8px',
                                                    background: node.errorRate > 0 ? '#fff1f0' : '#f6ffed',
                                                    border: `1px solid ${node.errorRate > 0 ? '#ffa39e' : '#b7eb8f'}`,
                                                    borderRadius: '4px'
                                                }}
                                            >
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <span style={{ fontWeight: '500', fontSize: '13px' }}>{node.containerName.replace('/', '')}</span>
                                                    <span style={{ color: node.errorRate > 0 ? '#f5222d' : '#52c41a', fontWeight: '500', fontSize: '12px' }}>
                                                        {node.errorRate > 0 ? '异常' : '正常'}
                                                    </span>
                                                </div>
                                                <div style={{ fontSize: '12px', color: '#666', marginTop: '6px' }}>
                                                    平均耗时: {(node.avgDuration / 1000).toFixed(2)}ms | 
                                                    错误率: {(node.errorRate * 100).toFixed(1)}% | 
                                                    QPS: {node.qps.toFixed(2)}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </Col>
                            </Row>
                        </div>
                    </ProCard>
                </ProCard>
            </Spin>
        </PageContainer>
    );
};

export default ApplicationTopology;