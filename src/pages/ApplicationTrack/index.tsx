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
    Timeline
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
    ProfileOutlined
} from '@ant-design/icons';
import { Column, Line, Area } from '@ant-design/plots';

// 导入你的接口
import { traceTableQuery, traceChartQuery, getFlamegraphDataByTraceId } from '../../services/server.js';
import GraphVisEGraphVisualizationxample from '../../components/topology/index.jsx';

import {transformToTree} from "../../utils/span2tree.js"
import {convertToGraphStructure} from "../../utils/convert2graph.js"
const { TabPane } = Tabs;

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
        requestData: [],   // type=count
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
    const [drawerWidth, setDrawerWidth] = useState(1200);

    
    const [graphData, setGraphData] = useState({})
    const [relationData, setRelationData] = useState({})
    const [flameTreeData, setFlameTreeData] = useState([])


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
        
        fetchTraceDetail(traceId);
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
            
            const data = response?.data || {};
            const uniqueEndpoints = [...new Set(data.allEndpoints || [])];
            const uniqueProtocols = [...new Set(data.allProtocols || [])];            
            const uniqueCode = [...new Set(data.allStatusOptions || [])];

            
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

    // 获取图表数据函数
    const fetchChartData = async () => {
        setChartLoading(true);
        try {
            // 准备筛选参数
            const params = {
                protocols: protocolFilters,
                endpoints: endpointFilters,
                statusCodes: statusFilters
            };
            
            // 使用Promise.all并行请求三个图表数据
            const [requestResponse, errorResponse, latencyResponse] = await Promise.all([
                traceChartQuery({ ...params, type: 'count' }),           // 请求数
                traceChartQuery({ ...params, type: 'statusCount' }),      // 错误数
                traceChartQuery({ ...params, type: 'latencyStats' })      // 响应时延
            ]);
            console.log(requestResponse, errorResponse, latencyResponse, "0000");
            
            setChartData({
                requestData: requestResponse?.data || [],
                errorData: errorResponse?.data || [],
                latencyData: latencyResponse?.data || []
            });

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
            // 这里模拟获取详情数据，实际应调用API
            // const response = await getTraceDetail(traceId);
            // setCurrentTrace(response.data);
            
            // 模拟数据
            const mockDetail = tableListDataSource.find(item => item.trace_id === traceId);
            setCurrentTrace(mockDetail);
            
            // 模拟span数据
            const mockSpans = [
                {
                    id: 'span1',
                    name: 'API Gateway',
                    startTime: new Date(Date.now() - 5000).toISOString(),
                    duration: 1200000,
                    tags: { component: 'nginx', http_method: 'GET' }
                },
                {
                    id: 'span2',
                    name: 'User Service',
                    startTime: new Date(Date.now() - 4000).toISOString(),
                    duration: 800000,
                    tags: { component: 'spring-boot', db_query: 'SELECT * FROM users' }
                },
                {
                    id: 'span3',
                    name: 'Database',
                    startTime: new Date(Date.now() - 3500).toISOString(),
                    duration: 500000,
                    tags: { component: 'mysql', query: 'SELECT * FROM users' }
                }
            ];
            setSpanData(mockSpans);
            
        } catch (error) {
            message.error('获取Trace详情失败');
            console.error('Trace detail fetch error:', error);
        } finally {
            setTraceDetailLoading(false);
        }
    };

    useEffect(() => {
        fetchFilterOptions();
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
    const handleViewDetail = (record) => {
        getFlamegraphDataByTraceIdFun(record.trace_id)
        setDrawerVisible(true);
    };

    // 关闭抽屉
    const handleCloseDrawer = () => {
        setDrawerVisible(false);
        setCurrentTrace(null);
        setSpanData([]);
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
        data: chartData.requestData,
        xField: 'time',
        yField: 'count',
        seriesField: 'endpoint',
        isStack: true,
        height: 200,
        legend: {
            position: 'top',
        },
        xAxis: {
            label: {
                autoRotate: false,
            },
        },
        tooltip: {
            formatter: (datum) => {
                return { name: datum.endpoint, value: datum.count };
            },
        },
    };

    const errorChartConfig = {
        data: chartData.errorData,
        xField: 'time',
        yField: 'count',
        height: 200,
        color: '#ff4d4f',
        xAxis: {
            label: {
                autoRotate: false,
            },
        },
        tooltip: {
            formatter: (datum) => {
                return { name: '错误数', value: datum.count };
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
                                <Column 
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
                    <Button 
                        icon={<CloseOutlined />} 
                        onClick={handleCloseDrawer}
                        style={{ border: 'none', fontSize: 16 }}
                    />
                }
                bodyStyle={{ padding: 24 }}
            >
                {traceDetailLoading ? (
                    <div style={{ textAlign: 'center', padding: '80px 0' }}>
                        <Spin size="large" />
                        <p style={{ marginTop: 16 }}>加载Trace详情中...</p>
                    </div>
                ) : currentTrace ? (
                    <Tabs defaultActiveKey="1" type="card" style={{ height: '100%' }}>
                        {/* Tab 1: 链路基本信息 */}
                        <TabPane tab="链路基本信息" key="1">
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
                                                {renderStatusTag(currentTrace)}
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
                        </TabPane>

                        {/* Tab 2: 拓扑图 */}
                        <TabPane tab="拓扑图" key="2">
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
                                <div style={{ textAlign: 'center', width: "100%" }}>
                                    <GraphVisEGraphVisualizationxample
                                        nodes={addNodeLevels(graphData.nodes)}
                                        edges={graphData.edges}
                                        relationData={relationData}
                                    ></GraphVisEGraphVisualizationxample> 
                                </div>
                            </Card>
                        </TabPane>

                        {/* Tab 3: 火焰图 */}
                        <TabPane tab="火焰图" key="3">
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
                                <div style={{ textAlign: 'center' }}>
                                    <img 
                                        src="/path/to/flamegraph-placeholder.png" 
                                        alt="火焰图" 
                                        style={{ maxWidth: '100%', maxHeight: 500 }}
                                    />
                                    <p style={{ marginTop: 16, color: '#666' }}>
                                        火焰图展示方法调用耗时分布和调用栈深度
                                    </p>
                                </div>
                            </Card>
                        </TabPane>
                    </Tabs>
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