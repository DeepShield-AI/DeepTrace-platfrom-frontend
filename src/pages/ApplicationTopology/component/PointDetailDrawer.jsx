import { errorData, requestData } from '@/services/mock';
import { Area, Line } from '@ant-design/plots';
import { Card, Col, Drawer, Row, Tabs, message, DatePicker, Button, Space } from 'antd';
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
    getEsNodeEndpointList
} from '../../../services/server.js';
import moment from 'moment';

const { RangePicker } = DatePicker;

const PointDetailDrawer = ({selectedObj = {}}) => {

    // 时间范围状态
    const [timeRange, setTimeRange] = useState({
        startTime: moment().subtract(1, 'hour').valueOf(), // 默认最近1小时
        endTime: moment().valueOf()
    });
    
    const [activeTab, setActiveTab] = useState('metrics');
    const [chartData, setChartData] = useState({
        requestData, // type=count
        errorData: [], // type=statusCount
        latencyData: [], // type=latencyStats
    });
    const [chartLoading, setChartLoading] = useState(false);

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

    // 获取端点列表数据 - 根据 pointType 选择不同的 API
    const fetchEndpointData = async () => {
        setEndpointLoading(true);
        try {
            // 构建请求参数
            const params = {
                startTime: timeRange.startTime,
                endTime: timeRange.endTime
            };
            
            console.log('请求参数:', params);
            
            let response;
            
            // 根据 pointType 选择不同的 API
            if (selectedObj.pointType === 'node') {
                // 节点相关的端点数据
                response = await getEsNodeEndpointList(params);
                console.log('调用节点端点API');
            } else if (selectedObj.pointType === 'edge') {
                // 边相关的端点数据
                response = await getEsEdgeEndpointList(params);
                console.log('调用边端点API');
            } else {
                // 默认情况，使用节点API
                response = await getEsNodeEndpointList(params);
                console.log('使用默认节点端点API');
            }
            
            // 根据实际API响应结构调整
            if (response && response.success && response.data) {
                setEndpointData(response.data);
                message.success('端点数据加载成功');
            } else {
                // 如果响应结构不符合预期，使用兜底数据
                console.warn('API响应格式不符合预期，使用兜底数据');
                setEndpointData(defaultEndpointData);
                message.warning('使用默认端点数据');
            }
        } catch (error) {
            console.error('获取端点数据失败:', error);
            setEndpointData(defaultEndpointData);
            message.error('端点数据加载失败，使用默认数据');
        } finally {
            setEndpointLoading(false);
        }
    };

    // 监听activeTab变化，当切换到端点列表时获取数据
    useEffect(() => {
        if (activeTab === 'endpoints') {
            fetchEndpointData();
        }
    }, [activeTab]);

    // 监听selectedObj变化，当selectedObj变化时重新获取数据
    useEffect(() => {
        if (activeTab === 'endpoints' && selectedObj.pointType) {
            fetchEndpointData();
        }
    }, [selectedObj]);

    // 监听timeRange变化，重新获取数据
    useEffect(() => {
        if (activeTab === 'endpoints') {
            fetchEndpointData();
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
        
        // 如果当前在端点列表tab，则重新获取数据
        if (activeTab === 'endpoints') {
            fetchEndpointData();
        }
        
        message.success('时间范围已更新');
    };

    const formatNumber = (num) => {
        if (num >= 1000000) return (num / 1000000).toFixed(2) + 'm';
        if (num >= 1000) return (num / 1000).toFixed(2) + 'k';
        return num.toFixed(2);
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
    
    // 1. 先确保转换后的数据格式正确（复用你的 transformData 函数，无需修改）
    const transformedErrorData = transformData(errorData);

    // 2. 优化后的错误数图表配置（多线折线图）
    const errorChartConfig = {
        data: transformedErrorData, // 转换后的数据（含 type、timeKey、docCount）
        xField: 'timeKey', // X轴：时间戳
        yField: 'docCount', // Y轴：错误数
        seriesField: 'type', // 核心：按状态码（type）分组，生成多条线
        height: 200,
        // 3. 自定义每条线的颜色（按状态码分配，区分明显）
        color: ({ type }) => {
        const colorMap = {
            200: '#1890ff', // 200状态码：蓝色
            201: '#52c41a', // 201状态码：绿色
            404: '#faad14', // 若后续有404：橙色（提前预留）
            500: '#ff4d4f', // 若后续有500：红色（提前预留）
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
        size: 4, // 点大小：适中，避免遮挡
        fill: ({ type }) => {
            // 点填充色与线条色一致
            const colorMap = {
            200: '#1890ff',
            201: '#52c41a',
            404: '#faad14',
            500: '#ff4d4f',
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
                minute: '2-digit',
            });
            },
        },
        range: [0.05, 0.95], // 轴两端留空白，避免数据贴边
        },
        // 7. Y轴配置（从0开始，添加单位）
        yAxis: {
        label: {
            fontSize: 12,
            formatter: (value) => `${value} 次`, // 单位：次
        },
        min: 0, // Y轴从0开始，避免数据比例失真
        tickCount: 4, // 控制Y轴刻度数量
        },
        // 8. 图例配置（显示状态码，支持交互）
        legend: {
        position: 'top', // 图例位置：顶部（可选 right/left/bottom）
        title: {
            text: '响应状态码', // 图例标题，明确含义
            fontSize: 12,
            padding: [0, 0, 4, 0], // 标题与图例间距
        },
        label: {
            fontSize: 12,
            formatter: (type) => `状态码 ${type}`, // 图例文本：优化为"状态码 200"
        },
        interactive: true, // 支持点击图例隐藏/显示对应线条
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
        // 10. 网格线配置（辅助读数，降低透明度避免干扰）
        grid: {
        horizontal: {
            visible: true,
            style: {
            stroke: '#e8e8e8',
            opacity: 0.5,
            },
        },
        vertical: {
            visible: false, // 隐藏垂直网格线，保持图表简洁
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
                    当前对象: {getObjectDisplayName()} | 时间段: {formatTimeDisplay()}
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
                    <h3>指标曲线</h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
                        <Row gutter={16} style={{ marginBottom: 16, width: '100%' }}>
                        <Col span={8}>
                            <Card
                            title="请求数"
                            size="small"
                            // extra={<span style={{ color: '#1890ff' }}>总数: {totalRequests}</span>}
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
                            // extra={<span style={{ color: '#ff4d4f' }}>总数: {totalErrors}</span>}
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
                            // extra={<span style={{ color: '#faad14' }}>平均: {avgLatency}ms</span>}
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
                        <div
                        style={{
                            backgroundColor: '#f0f9ff',
                            padding: '15px',
                            borderRadius: '8px',
                            width: '200px',
                        }}
                        >
                        <div style={{ fontSize: '14px', color: '#666' }}>平均耗时</div>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', marginTop: '5px' }}>
                            {formatNumber(selectedObj.data?.avgDuration || 0)}μs
                        </div>
                        </div>

                        <div
                        style={{
                            backgroundColor: '#f6ffed',
                            padding: '15px',
                            borderRadius: '8px',
                            width: '200px',
                        }}
                        >
                        <div style={{ fontSize: '14px', color: '#666' }}>QPS</div>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', marginTop: '5px' }}>
                            {(selectedObj.data?.qps || 0).toFixed(2)}
                        </div>
                        </div>

                        <div
                        style={{
                            backgroundColor: (selectedObj.data?.errorRate || 0) > 0 ? '#fff1f0' : '#f6ffed',
                            padding: '15px',
                            borderRadius: '8px',
                            width: '200px',
                        }}
                        >
                        <div style={{ fontSize: '14px', color: '#666' }}>错误率</div>
                        <div
                            style={{
                            fontSize: '24px',
                            fontWeight: 'bold',
                            marginTop: '5px',
                            color: (selectedObj.data?.errorRate || 0) > 0 ? '#f5222d' : '#52c41a',
                            }}
                        >
                            {((selectedObj.data?.errorRate || 0) * 100).toFixed(1)}%
                        </div>
                        </div>

                        <div
                        style={{
                            backgroundColor: '#fff7e6',
                            padding: '15px',
                            borderRadius: '8px',
                            width: '200px',
                        }}
                        >
                        <div style={{ fontSize: '14px', color: '#666' }}>错误数</div>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', marginTop: '5px' }}>
                            {selectedObj.data?.errorCount || 0}
                        </div>
                        </div>
                    </div>

                    <h3 style={{ marginTop: '30px' }}>资源使用</h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
                        <div
                        style={{
                            backgroundColor: '#f0f9ff',
                            padding: '15px',
                            borderRadius: '8px',
                            width: '200px',
                        }}
                        >
                        <div style={{ fontSize: '14px', color: '#666' }}>CPU使用率</div>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', marginTop: '5px' }}>
                            45.2%
                        </div>
                        </div>

                        <div
                        style={{
                            backgroundColor: '#f6ffed',
                            padding: '15px',
                            borderRadius: '8px',
                            width: '200px',
                        }}
                        >
                        <div style={{ fontSize: '14px', color: '#666' }}>内存使用</div>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', marginTop: '5px' }}>
                            1.2GB
                        </div>
                        </div>

                        <div
                        style={{
                            backgroundColor: '#fff7e6',
                            padding: '15px',
                            borderRadius: '8px',
                            width: '200px',
                        }}
                        >
                        <div style={{ fontSize: '14px', color: '#666' }}>网络流量</div>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', marginTop: '5px' }}>
                            12.4MB/s
                        </div>
                        </div>
                    </div>
                    </div>
                </Tabs.TabPane>

                <Tabs.TabPane tab="端点列表" key="endpoints">
                    <div style={{ marginBottom: 16, padding: '0 20px' }}>
                        <h4>
                            {selectedObj.pointType === 'node' ? '节点' : '连接'}相关端点列表
                            {selectedObj.pointType === 'node' && selectedObj.data?.containerName && 
                                ` - ${selectedObj.data.containerName}`}
                            {selectedObj.pointType === 'edge' && 
                                ` - ${selectedObj.source} → ${selectedObj.target}`}
                        </h4>
                    </div>
                    <EndpointMonitoringTable 
                        data={endpointData} 
                        loading={endpointLoading}
                    />
                </Tabs.TabPane>

                <Tabs.TabPane tab="调用日志" key="logs">
                    <PointDrawer />
                </Tabs.TabPane>
                </Tabs>
            </div>
    )
};

export default PointDetailDrawer;