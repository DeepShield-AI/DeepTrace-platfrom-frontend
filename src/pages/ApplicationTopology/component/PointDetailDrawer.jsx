
import { errorData, requestData } from '@/services/mock';
import { Area, Line } from '@ant-design/plots';
import { Card, Col, Drawer, Row, Select, Tabs } from 'antd'; // 引入抽屉组件
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

const PointDetailDrawer = ({selectedObj = {}}) => {

    const [timeRange, setTimeRange] = useState('lastHour');
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

    const formatNumber = (num) => {
        if (num >= 1000000) return (num / 1000000).toFixed(2) + 'm';
        if (num >= 1000) return (num / 1000).toFixed(2) + 'k';
        return num.toFixed(2);
    };

    const handleTimeRangeChange = (value) => {
        setTimeRange(value);
        // 这里可以添加根据时间段重新获取数据的逻辑
        console.log(`时间段已更改为: ${value}`);
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
            formatter: (type) => `状态码 ${type}`, // 图例文本：优化为“状态码 200”
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
                }}
                >
                <Select value={timeRange} onChange={handleTimeRangeChange} style={{ width: 200 }}>
                    <Select.Option value="lastHour">最近1小时</Select.Option>
                    <Select.Option value="lastDay">最近1天</Select.Option>
                    <Select.Option value="lastWeek">最近1周</Select.Option>
                    <Select.Option value="lastMonth">最近1月</Select.Option>
                    <Select.Option value="custom">自定义时间段</Select.Option>
                </Select>
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
                            {formatNumber(selectedObj.data.avgDuration)}μs
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
                            {selectedObj.data.qps.toFixed(2)}
                        </div>
                        </div>

                        <div
                        style={{
                            backgroundColor: selectedObj.data.errorRate > 0 ? '#fff1f0' : '#f6ffed',
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
                            color: selectedObj.data.errorRate > 0 ? '#f5222d' : '#52c41a',
                            }}
                        >
                            {(selectedObj.data.errorRate * 100).toFixed(1)}%
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
                            {selectedObj.data.errorCount}
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
                    <EndpointMonitoringTable></EndpointMonitoringTable>
                </Tabs.TabPane>

                <Tabs.TabPane tab="调用日志" key="logs">
                    <PointDrawer />
                </Tabs.TabPane>
                </Tabs>
            </div>
    )
};

export default PointDetailDrawer;