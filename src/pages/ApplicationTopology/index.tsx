import React, { useEffect, useState } from 'react';
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
    message
} from 'antd';
import { ThunderboltOutlined, InfoOutlined, ReloadOutlined } from '@ant-design/icons';
import ReactFlow, {
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  Controls,
  MiniMap,
  Background,
  useReactFlow
} from 'react-flow-renderer';
import 'react-flow-renderer/dist/style.css';
import dagre from 'dagre';
import TopologyGraph from "./component/TopologyGraph.jsx"
import { traceTableQuery, traceChartQuery, getFlamegraphDataByTraceId, getFilters, getTraceDetail } from '../../services/server.js';
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
// 页面入口组件
const ApplicationTopology = () => {
    
    const [statusFilters, setStatusFilters] = useState([]);
    const [endpointFilters, setEndpointFilters] = useState([]);
    const [protocolFilters, setProtocolFilters] = useState([]);
    const [allEndpoints, setAllEndpoints] = useState([]);
    const [allProtocols, setAllProtocols] = useState([]);
    const [allStatusOptions, setAllStatusOptions] = useState([]);
    // 点指标数据
    const nodeData = [
        { "nodeId": "1691817", "containerName": "/service_1", "avgDuration": 1525972.3423831072, "errorCount": 123, "totalCount": 1326.0, "errorRate": 0.1, "qps": 0.3684 },
        { "nodeId": "1691818", "containerName": "/service_2", "avgDuration": 1398902.0, "errorCount": 0, "totalCount": 496.0, "errorRate": 0.0, "qps": 0.1377 },
        { "nodeId": "1691819", "containerName": "/service_3", "avgDuration": 1398902.0, "errorCount": 0, "totalCount": 496.0, "errorRate": 0.0, "qps": 0.1377 },
        { "nodeId": "1691827", "containerName": "/service_4", "avgDuration": 1398902.0, "errorCount": 0, "totalCount": 496.0, "errorRate": 0.0, "qps": 0.1377 },
        { "nodeId": "1691828", "containerName": "/service_5", "avgDuration": 1398902.0, "errorCount": 0, "totalCount": 496.0, "errorRate": 0.0, "qps": 0.1377 },
        { "nodeId": "1691829", "containerName": "/service_6", "avgDuration": 1398902.0, "errorCount": 0, "totalCount": 496.0, "errorRate": 0.0, "qps": 0.1377 },
        // { "nodeId": "1691830", "containerName": "/service_7", "avgDuration": 1398902.0, "errorCount": 0, "totalCount": 496.0, "errorRate": 0.0, "qps": 0.1377 },
        // { "nodeId": "1691831", "containerName": "/service_8", "avgDuration": 1398902.0, "errorCount": 0, "totalCount": 496.0, "errorRate": 0.0, "qps": 0.1377 },
        // { "nodeId": "1691832", "containerName": "/service_9", "avgDuration": 1398902.0, "errorCount": 0, "totalCount": 496.0, "errorRate": 0.0, "qps": 0.1377 },
        // { "nodeId": "1691833", "containerName": "/service_10", "avgDuration": 1398902.0, "errorCount": 0, "totalCount": 496.0, "errorRate": 0.0, "qps": 0.1377 },
        // { "nodeId": "1691834", "containerName": "/service_11", "avgDuration": 1398902.0, "errorCount": 0, "totalCount": 496.0, "errorRate": 0.0, "qps": 0.1377 },
        // { "nodeId": "1691835", "containerName": "/service_12", "avgDuration": 1398902.0, "errorCount": 0, "totalCount": 496.0, "errorRate": 0.0, "qps": 0.1377 },
    ];

    // 边数据
    const edgeData = {
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

    // 统计边总数
    const totalEdges = Object.values(edgeData).reduce((sum, edges) => sum + edges.length, 0);

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

    const handleStatusFilterChange = (checkedValues) => {
        // setPagination({...pagination, pageNum: 1});
        setStatusFilters(checkedValues);
    };
    
    const handleEndpointFilterChange = (checkedValues) => {
        // setPagination({...pagination, pageNum: 1});
        setEndpointFilters(checkedValues);
    };
    
    const handleProtocolFilterChange = (checkedValues) => {
        // setPagination({...pagination, pageNum: 1});
        setProtocolFilters(checkedValues);
    };

    useEffect(() => {
            fetchFilterOptions();
    }, []);

    return (
        <PageContainer content="调用链拓扑">
            <ProCard split="vertical" gutter={16}>
                {/* 左侧筛选面板 */}
                <ProCard 
                    title="拓扑筛选" 
                    colSpan="20%"
                    headerBordered
                    extra={<ThunderboltOutlined />}
                    style={{ height: '100%' }}
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
                    
                    <Divider />
                    <div>
                        <Statistic 
                            title="总监控项" 
                            // value={pagination.total} //TODO
                        />
                        <Button 
                            type="primary" 
                            block 
                            onClick={() => {
                                setStatusFilters(allStatusOptions);
                                setEndpointFilters(allEndpoints);
                                setProtocolFilters(allProtocols);
                                // setPagination({
                                //     pageNum: 1,
                                //     pageSize: pagination.pageSize,
                                //     total: pagination.total
                                // });
                            }}
                            style={{ marginBottom: 8 }}
                        >
                            重置所有筛选
                        </Button>
                        {/* <Button 
                            block 
                            onClick={() => {
                                fetchTraceData();
                                fetchChartData();
                            }}
                            loading={loading || chartLoading}
                            icon={<ReloadOutlined />}
                        >
                            刷新数据
                        </Button> */}
                    </div>
                    <div style={{ padding: '16px' }}>
                        <h4 style={{ marginBottom: '12px' }}>服务节点状态</h4>
                        <div style={{ marginBottom: '20px' }}>
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
                                        <span style={{ fontWeight: '500' }}>{node.containerName.replace('/', '')}</span>
                                        <Tag color={node.errorRate > 0 ? 'error' : 'success'} size="small">
                                            {node.errorRate > 0 ? '异常' : '正常'}
                                        </Tag>
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
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
                        <TopologyGraph nodeData={nodeData} edgeData={edgeData} />
                    </ReactFlowProvider>
                    
                    {/* 底部统计面板 */}
                    <div style={{ padding: '16px', borderTop: '1px solid #f0f0f0', marginTop: '10px' }}>
                        <Row gutter={24}>
                            <Col span={12}>
                                <h4 style={{ marginBottom: '12px', fontSize: '14px' }}>调用关系统计</h4>
                                <div style={{ marginTop: '12px' }}>
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
                                <div style={{ marginTop: '12px' }}>
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
                                                <span style={{ fontWeight: '500' }}>{node.containerName.replace('/', '')}</span>
                                                <span style={{ color: node.errorRate > 0 ? '#f5222d' : '#52c41a', fontWeight: '500' }}>
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
        </PageContainer>
    );
};

export default ApplicationTopology;