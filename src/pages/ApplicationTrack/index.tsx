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
    message
} from 'antd';
import {
    CheckCircleOutlined,
    ExclamationCircleOutlined,
    QuestionCircleOutlined,
    ThunderboltOutlined,
    DashboardOutlined,
    ReloadOutlined
} from '@ant-design/icons';
import { Column, Line, Area } from '@ant-design/plots';

// 导入你的接口
import { traceTableQuery, traceChartQuery } from '../../services/server.js';

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

    // 耗时阈值配置（单位：纳秒）
    const DURATION_THRESHOLD = {
        NORMAL: 5 * 1000 * 1000,   // 5ms（正常）
        UNKNOWN: 10 * 1000 * 1000  // 10ms（未知，超过5ms不足10ms）
    };

    // 获取表格数据函数
    const fetchTraceData = async () => {
        setLoading(true);
        try {
            const params = {
                protocols: protocolFilters,
                endpoints: endpointFilters,
                statusCodes: statusFilters,
                pageNum: pagination.pageNum,
                pageSize: pagination.pageSize
            };
            
            const response = await traceTableQuery(params);
            const data = response?.data || {};
            setTableListDataSource(data.content || []);
            
            setPagination({
                ...pagination,
                total: data.totalElements || 0,
            });
            // 首次加载时获取所有选项（修复重置问题）
            // if (allEndpoints.length === 0 || allProtocols.length === 0) {
            //     const uniqueEndpoints = [...new Set(data.allEndpoints || [])];
            //     const uniqueProtocols = [...new Set(data.allProtocols || [])];
                
            //     setAllEndpoints(uniqueEndpoints);
            //     setAllProtocols(uniqueProtocols);
                
            //     // 初始选中所有选项
            //     setEndpointFilters(uniqueEndpoints);
            //     setProtocolFilters(uniqueProtocols);
            //     setStatusFilters(allStatusOptions.map(opt => opt.value));
            // }

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

    // 当筛选条件或分页变化时重新获取数据
    // useEffect(() => {
    //     fetchTraceData();
    //     fetchChartData();
    // }, [statusFilters, endpointFilters, protocolFilters, pagination.pageNum, pagination.pageSize]);

    useEffect(() => {
        fetchFilterOptions();
    }, []);

    useEffect(() => {
        // if (allEndpoints.length > 0) { // 确保选项已加载
            fetchTraceData();
            // fetchChartData();
        // }
    }, [statusFilters, endpointFilters, protocolFilters, pagination.pageNum, pagination.pageSize]);

    // 筛选逻辑处理
    const handleStatusFilterChange = (checkedValues) => {
        console.log(checkedValues, "cc");
        
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
        if([200, 201, 202].includes(code_num)) {
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
        // 详情页跳转逻辑
    };

    // 处理表格分页变化
    const handleTableChange = (pageConfig) => {
        setPagination({
            ...pagination,
            pageNum: pageConfig.current,
            pageSize: pageConfig.pageSize,
        });
    };

    // 统计数据计算（仅当前页）
    const currentPageData = tableListDataSource || [];
    
    const normalCount = currentPageData.filter(item => 
        getStatusByDuration(item.e2e_duration) === 'normal'
    ).length;
    
    const unknownCount = currentPageData.filter(item => 
        getStatusByDuration(item.e2e_duration) === 'unknown'
    ).length;
    
    const errorCount = currentPageData.filter(item => 
        getStatusByDuration(item.e2e_duration) === 'error'
    ).length;

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
                                        {/* <Badge 
                                            status={
                                                option.value === 'normal' ? 'success' : 
                                                option.value === 'unknown' ? 'warning' : 'error'
                                            } 
                                            text={option.label} 
                                        /> */}
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
                    
                    {/* 顶部统计卡片（当前页数据统计） */}
                    {/* <Row gutter={16} style={{ marginBottom: 16 }}>
                        <Col span={8}>
                            <Card size="small">
                                <Statistic
                                    title="正常链路"
                                    value={normalCount}
                                    valueStyle={{ color: '#3f8600' }}
                                    prefix={<CheckCircleOutlined />}
                                />
                            </Card>
                        </Col>
                        <Col span={8}>
                            <Card size="small">
                                <Statistic
                                    title="待观察链路"
                                    value={unknownCount}
                                    valueStyle={{ color: '#faad14' }}
                                    prefix={<QuestionCircleOutlined />}
                                />
                            </Card>
                        </Col>
                        <Col span={8}>
                            <Card size="small">
                                <Statistic
                                    title="异常链路"
                                    value={errorCount}
                                    valueStyle={{ color: '#cf1322' }}
                                    prefix={<ExclamationCircleOutlined />}
                                />
                            </Card>
                        </Col>
                    </Row> */}

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
        </PageContainer>
    );
};

export default MonitorNative;