import {
  ApiOutlined,
  CloseOutlined,
  CloudServerOutlined,
  DashboardOutlined,
  DatabaseOutlined,
  ExclamationCircleOutlined,
  FireOutlined,
  HddOutlined,
  MonitorOutlined,
  ReloadOutlined,
  RocketOutlined,
  TableOutlined,
  WifiOutlined,
} from '@ant-design/icons';
import { Area, Column, Line } from '@ant-design/plots';
import { PageContainer, ProCard } from '@ant-design/pro-components';
import {
  Badge,
  Button,
  Card,
  Col,
  Drawer,
  Radio,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import { getMetricTags } from '../../services/metrics/api';

const { Text } = Typography;
const { Option } = Select; // 新增：确保 Select.Option 可用

const MetricsDetail = () => {
  const [timeRange, setTimeRange] = useState('15分钟');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedTags, setSelectedTags] = useState(['all']);
  const [metricsData, setMetricsData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [currentChart, setCurrentChart] = useState(null);
  const [logData, setLogData] = useState([]);
  const [metricTags, setMetricTags] = useState({}); // 存储API返回的数据
  const [isDropdownOpen, setIsDropdownOpen] = useState(false); // 追踪下拉框是否展开

  // 图表标签配置 - 从API数据动态生成
  const chartTags =
    metricTags && Object.keys(metricTags).length > 0
      ? Object.keys(metricTags).map((key) => ({
          key: key,
          label: key.charAt(0).toUpperCase() + key.slice(1), // 首字母大写
          color: 'blue', // 默认颜色
          icon: <DashboardOutlined />, // 默认图标
        }))
      : [];

  // 图表数据配置 - 增加threshold字段
  const chartConfigs = [
    {
      id: 1,
      title: 'CPU使用率',
      value: '45.2%',
      trend: 'up',
      change: '+2.1%',
      tag: 'cpu',
      type: 'area',
      dataKey: 'usage',
      color: '#ff4d4f',
      icon: <MonitorOutlined />,
      threshold: 80, // 阈值：80%
      thresholdColor: '#ff7875',
      unit: '%',
    },
    {
      id: 2,
      title: '内存使用率',
      value: '68.7%',
      trend: 'down',
      change: '-1.3%',
      tag: 'memory',
      type: 'area',
      dataKey: 'memory',
      color: '#52c41a',
      icon: <DatabaseOutlined />,
      threshold: 85, // 阈值：85%
      thresholdColor: '#ff7875',
      unit: '%',
    },
    {
      id: 3,
      title: '网络吞吐量',
      value: '2.4 Gbps',
      trend: 'up',
      change: '+0.3G',
      tag: 'network',
      type: 'line',
      dataKey: 'network',
      color: '#1890ff',
      icon: <WifiOutlined />,
      threshold: 2.8, // 阈值：2.8 Gbps
      thresholdColor: '#ff7875',
      unit: 'Gbps',
    },
    {
      id: 4,
      title: '磁盘IOPS',
      value: '12.5K',
      trend: 'stable',
      change: '0.0',
      tag: 'disk',
      type: 'column',
      dataKey: 'iops',
      color: '#722ed1',
      icon: <HddOutlined />,
      threshold: 15, // 阈值：15K
      thresholdColor: '#ff7875',
      unit: 'K',
    },
    {
      id: 5,
      title: '系统负载',
      value: '2.1',
      trend: 'up',
      change: '+0.2',
      tag: 'system',
      type: 'line',
      dataKey: 'load',
      color: '#fa8c16',
      icon: <CloudServerOutlined />,
      threshold: 3.0, // 阈值：3.0
      thresholdColor: '#ff7875',
      unit: '',
    },
    {
      id: 6,
      title: '温度监控',
      value: '65°C',
      trend: 'stable',
      change: '0°',
      tag: 'system',
      type: 'area',
      dataKey: 'temperature',
      color: '#fa541c',
      icon: <FireOutlined />,
      threshold: 75, // 阈值：75°C
      thresholdColor: '#ff7875',
      unit: '°C',
    },
    {
      id: 7,
      title: '连接数',
      value: '1.2K',
      trend: 'up',
      change: '+150',
      tag: 'network',
      type: 'column',
      dataKey: 'connections',
      color: '#13c2c2',
      icon: <ApiOutlined />,
      threshold: 1500, // 阈值：1500
      thresholdColor: '#ff7875',
      unit: '',
    },
    {
      id: 8,
      title: '缓存命中率',
      value: '92.3%',
      trend: 'down',
      change: '-1.2%',
      tag: 'memory',
      type: 'line',
      dataKey: 'cache',
      color: '#eb2f96',
      icon: <RocketOutlined />,
      threshold: 90, // 阈值：90%
      thresholdColor: '#52c41a', // 低于阈值才警告（绿色表示正常）
      unit: '%',
      reverseThreshold: true, // 反向阈值：低于阈值才警告
    },
  ];

  // 生成模拟数据
  const generateMetricsData = () => {
    const baseTime = [
      '15:02',
      '15:03',
      '15:04',
      '15:05',
      '15:06',
      '15:07',
      '15:08',
      '15:09',
      '15:10',
      '15:11',
      '15:12',
      '15:13',
    ];

    return baseTime.map((time, index) => ({
      time,
      usage: 40 + Math.sin(index * 0.5) * 20 + Math.random() * 10, // CPU使用率
      memory: 60 + Math.cos(index * 0.3) * 15 + Math.random() * 8, // 内存使用率
      network: 1.5 + Math.sin(index * 0.4) * 0.8 + Math.random() * 0.3, // 网络吞吐量
      iops: 8 + Math.sin(index * 0.6) * 4 + Math.random() * 2, // 磁盘IOPS
      load: 1.5 + Math.sin(index * 0.4) * 0.8 + Math.random() * 0.3, // 系统负载
      temperature: 60 + Math.sin(index * 0.3) * 8 + Math.random() * 3, // 温度
      connections: 800 + Math.sin(index * 0.5) * 300 + Math.random() * 100, // 连接数
      cache: 90 + Math.cos(index * 0.4) * 8 + Math.random() * 4, // 缓存命中率
    }));
  };

  // 生成模拟日志数据
  const generateLogData = (chart) => {
    const statuses = ['正常', '警告', '错误'];
    const levels = ['info', 'warning', 'error'];
    const operations = ['读取', '写入', '处理', '响应', '连接', '断开'];

    return Array.from({ length: 50 }, (_, index) => {
      const timestamp = new Date(Date.now() - (50 - index) * 60000).toLocaleTimeString();
      const randomStatus = Math.floor(Math.random() * 3);
      const randomOperation = Math.floor(Math.random() * operations.length);
      const value = Math.random() * 100;

      return {
        key: index,
        timestamp,
        value:
          chart.dataKey === 'network'
            ? `${(value / 4).toFixed(2)} Gbps`
            : chart.dataKey === 'iops'
            ? `${Math.round(value * 200)}`
            : chart.dataKey === 'connections'
            ? `${Math.round(value * 20)}`
            : chart.dataKey === 'temperature'
            ? `${Math.round(value + 20)}°C`
            : `${value.toFixed(1)}%`,
        status: statuses[randomStatus],
        level: levels[randomStatus],
        operation: operations[randomOperation],
        message: `${chart.title} ${operations[randomOperation]}操作`,
        source: `server-${Math.floor(Math.random() * 5) + 1}`,
      };
    });
  };

  // 打开抽屉查看日志表格
  const handleViewLogs = (chart) => {
    setCurrentChart(chart);
    setLogData(generateLogData(chart));
    setDrawerVisible(true);
  };

  // 关闭抽屉
  const handleCloseDrawer = () => {
    setDrawerVisible(false);
    setCurrentChart(null);
    setLogData([]);
  };

  // 检查是否超过阈值
  const checkThresholdExceeded = (chart) => {
    if (!chart.threshold) return false;

    return metricsData.some((data) => {
      const value = data[chart.dataKey];
      if (chart.reverseThreshold) {
        return value < chart.threshold; // 反向阈值：低于阈值才警告
      }
      return value > chart.threshold; // 正向阈值：高于阈值警告
    });
  };

  // 获取图表配置
  const getChartConfig = (chart) => {
    const exceedsThreshold = checkThresholdExceeded(chart);
    const baseConfig = {
      data: metricsData,
      xField: 'time',
      yField: chart.dataKey,
      height: 120,
      autoFit: true,
      smooth: true,
      loading: loading,
      xAxis: {
        label: {
          style: {
            fill: '#666',
            fontSize: 10,
          },
        },
      },
      yAxis: {
        label: {
          style: {
            fill: '#666',
            fontSize: 10,
          },
        },
      },
      tooltip: {
        showMarkers: false,
        formatter: (datum) => {
          return {
            name: chart.title,
            value:
              chart.dataKey === 'network'
                ? `${datum[chart.dataKey].toFixed(1)} Gbps`
                : chart.dataKey === 'iops'
                ? `${datum[chart.dataKey].toFixed(0)}K`
                : chart.dataKey === 'connections'
                ? `${Math.round(datum[chart.dataKey])}`
                : chart.dataKey === 'temperature'
                ? `${datum[chart.dataKey].toFixed(0)}°C`
                : `${datum[chart.dataKey].toFixed(1)}%`,
          };
        },
      },
      // 添加阈值线
      annotations: chart.threshold
        ? [
            {
              type: 'line',
              start: ['min', chart.threshold],
              end: ['max', chart.threshold],
              style: {
                stroke: chart.thresholdColor,
                lineWidth: 2,
                lineDash: [4, 4],
              },
              text: {
                content: `阈值: ${chart.threshold}${chart.unit}`,
                position: 'end',
                style: {
                  fill: chart.thresholdColor,
                  fontSize: 10,
                  fontWeight: 'bold',
                  textAlign: 'end',
                },
              },
            },
          ]
        : [],
    };

    // 根据是否超过阈值调整颜色强度
    const chartColor = exceedsThreshold ? chart.thresholdColor : chart.color;

    switch (chart.type) {
      case 'area':
        return {
          ...baseConfig,
          areaStyle: {
            fill: `l(270) 0:${chartColor}22 1:${chartColor}44`,
          },
          line: {
            size: exceedsThreshold ? 3 : 2,
            color: chartColor,
          },
        };
      case 'line':
        return {
          ...baseConfig,
          line: {
            size: exceedsThreshold ? 3 : 2,
            color: chartColor,
          },
        };
      case 'column':
        return {
          ...baseConfig,
          columnStyle: {
            fill: chartColor,
          },
        };
      default:
        return baseConfig;
    }
  };

  // 单个图表卡片组件，包含下拉选择器
  const ChartCard: React.FC<{ chart: any }> = ({ chart }) => {
    // 使用useRef保存selectedTag，避免组件重新渲染时重置
    // 统一使用chartTags数组的第一个元素作为默认值展示
    const defaultTag = chartTags && chartTags.length > 0 ? chartTags[0].key : 'all'; // 安全默认值
    const selectedTagRef = useRef<string>(defaultTag);

    const trendConfig = getTrendConfig(chart.trend);
    const ChartComponent = chart.type === 'column' ? Column : chart.type === 'area' ? Area : Line;
    const exceedsThreshold = checkThresholdExceeded(chart);

    return (
      <Card
        size="small"
        style={{
          height: '100%',
          borderRadius: '8px',
          border: exceedsThreshold ? `2px solid ${chart.thresholdColor}` : '1px solid #f0f0f0',
          boxShadow: exceedsThreshold
            ? `0 4px 12px ${chart.thresholdColor}40`
            : '0 2px 4px rgba(0,0,0,0.02)',
          position: 'relative',
          overflow: 'hidden',
          transition: 'all 0.3s ease',
        }}
        bodyStyle={{
          padding: '16px',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}
        loading={loading}
        extra={
          <Space>
            <Select
              value={selectedTagRef.current}
              onChange={(val) => {
                // 使用ref保存选择值，避免组件重新渲染时丢失
                selectedTagRef.current = val;
                // 当下拉框选择改变时，暂时禁用自动刷新
                setAutoRefresh(false);
                // 重新启用自动刷新，延时避免立即刷新
                setTimeout(() => {
                  setAutoRefresh(true);
                }, 300);
              }}
              size="small"
              style={{ width: 120 }}
              onDropdownVisibleChange={(open) => {
                setIsDropdownOpen(open);
                // 当下拉框打开时，暂停自动刷新
                if (open) {
                  setAutoRefresh(false);
                } else {
                  // 当下拉框关闭后，恢复自动刷新
                  setTimeout(() => {
                    setAutoRefresh(true);
                  }, 300);
                }
              }}
            >
              {chartTags.map((tag) => (
                <Option key={tag.key} value={tag.key}>
                  {tag.label}
                </Option>
              ))}
            </Select>
            <Tooltip title="查看详细日志">
              <Button
                type="text"
                icon={<TableOutlined />}
                size="small"
                onClick={() => handleViewLogs(chart)}
                style={{ color: '#666' }}
              />
            </Tooltip>
          </Space>
        }
      >
        {/* 阈值警告图标 */}
        {exceedsThreshold && (
          <div
            style={{
              position: 'absolute',
              top: '8px',
              right: '40px',
              color: chart.thresholdColor,
              animation: 'pulse 2s infinite',
            }}
          >
            <ExclamationCircleOutlined />
          </div>
        )}

        {/* 图表头部 */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '6px',
                background: exceedsThreshold ? `${chart.thresholdColor}10` : `${chart.color}10`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: exceedsThreshold ? chart.thresholdColor : chart.color,
              }}
            >
              {chart.icon}
            </div>
            <div>
              <Text
                strong
                style={{
                  fontSize: '14px',
                  display: 'block',
                  color: exceedsThreshold ? chart.thresholdColor : 'inherit',
                }}
              >
                {chart.title}
                {exceedsThreshold && (
                  <Tooltip title={`当前值已超过阈值 ${chart.threshold}${chart.unit}`}>
                    <ExclamationCircleOutlined
                      style={{ marginLeft: 4, color: chart.thresholdColor, fontSize: 12 }}
                    />
                  </Tooltip>
                )}
              </Text>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Text
                  strong
                  style={{
                    fontSize: '18px',
                    color: exceedsThreshold ? chart.thresholdColor : chart.color,
                    lineHeight: 1,
                  }}
                >
                  {chart.value}
                </Text>
                <Text style={{ fontSize: '12px', color: trendConfig.color, lineHeight: 1 }}>
                  {trendConfig.icon} {chart.change}
                </Text>
              </div>
            </div>
          </div>
        </div>

        {/* 图表区域 */}
        <div style={{ flex: 1, minHeight: '120px' }}>
          <ChartComponent {...getChartConfig(chart)} />
        </div>

        {/* 底部状态 */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '8px',
            paddingTop: '8px',
            borderTop: '1px solid #f0f0f0',
          }}
        >
          <Text
            type="secondary"
            style={{ fontSize: '12px', color: exceedsThreshold ? chart.thresholdColor : 'inherit' }}
          >
            最后更新: 刚刚{exceedsThreshold && ' • 超过阈值'}
          </Text>
          <div
            style={{
              padding: '2px 6px',
              background: exceedsThreshold ? `${chart.thresholdColor}10` : '#f0f0f0',
              borderRadius: '4px',
              fontSize: '10px',
              color: exceedsThreshold ? chart.thresholdColor : '#666',
              border: `1px solid ${exceedsThreshold ? chart.thresholdColor : 'transparent'}`,
            }}
          >
            {selectedTagRef.current.toUpperCase()}
          </div>
        </div>
      </Card>
    );
  };

  // 处理标签选择
  const handleTagSelect = (tagKey) => {
    if (tagKey === 'all') {
      setSelectedTags(['all']);
      return;
    }

    const newTags = selectedTags.includes('all')
      ? [tagKey]
      : selectedTags.includes(tagKey)
      ? selectedTags.filter((tag) => tag !== tagKey).filter(Boolean)
      : [...selectedTags, tagKey];

    setSelectedTags(newTags.length === 0 ? ['all'] : newTags);
  };

  // 获取趋势图标和颜色
  const getTrendConfig = (trend) => {
    const trendMap = {
      up: { color: '#ff4d4f', icon: '↗' },
      down: { color: '#52c41a', icon: '↘' },
      stable: { color: '#faad14', icon: '→' },
    };
    return trendMap[trend] || { color: '#d9d9d9', icon: '→' };
  };

  // 获取状态徽章颜色
  const getStatusColor = (status) => {
    const statusMap = {
      正常: 'green',
      警告: 'orange',
      错误: 'red',
    };
    return statusMap[status] || 'default';
  };

  // 日志表格列配置
  const logColumns = [
    {
      title: '时间',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 100,
      sorter: (a, b) => a.timestamp.localeCompare(b.timestamp),
    },
    {
      title: '数值',
      dataIndex: 'value',
      key: 'value',
      width: 100,
      render: (value) => <Text strong>{value}</Text>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status) => <Badge color={getStatusColor(status)} text={status} />,
      filters: ['正常', '警告', '错误'].map((status) => ({ text: status, value: status })),
      onFilter: (value, record) => record.status === value,
    },
    {
      title: '操作类型',
      dataIndex: 'operation',
      key: 'operation',
      width: 80,
      filters: ['读取', '写入', '处理', '响应', '连接', '断开'].map((op) => ({
        text: op,
        value: op,
      })),
      onFilter: (value, record) => record.operation === value,
    },
    {
      title: '来源',
      dataIndex: 'source',
      key: 'source',
      width: 100,
      filters: Array.from({ length: 5 }, (_, i) => ({
        text: `server-${i + 1}`,
        value: `server-${i + 1}`,
      })),
      onFilter: (value, record) => record.source === value,
    },
    {
      title: '消息',
      dataIndex: 'message',
      key: 'message',
      ellipsis: true,
    },
  ];

  // 过滤显示的图表
  const filteredCharts = chartConfigs.filter(
    (chart) => selectedTags.includes('all') || selectedTags.includes(chart.tag),
  );

  useEffect(() => {
    setLoading(true);

    const timer = setTimeout(() => {
      setMetricsData(generateMetricsData());
      setLoading(false);
    }, 500);

    // 获取指标标签数据
    const fetchMetricTags = async () => {
      try {
        const tags = await getMetricTags();
        setMetricTags(tags); // 设置API返回的数据
      } catch (error) {
        console.error('获取指标标签失败:', error);
      }
    };
    fetchMetricTags();

    // 只有当自动刷新开启且下拉框未展开时才设置定时器
    const interval =
      autoRefresh && !isDropdownOpen
        ? setInterval(() => {
            const newData = generateMetricsData().map((item) => ({
              ...item,
              usage: Math.max(10, Math.min(95, item.usage + Math.random() * 4 - 2)),
              memory: Math.max(20, Math.min(95, item.memory + Math.random() * 3 - 1.5)),
              network: Math.max(0.5, Math.min(3.0, item.network + Math.random() * 0.2 - 0.1)),
            }));
            setMetricsData(newData);
          }, 3000)
        : null;

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [autoRefresh, isDropdownOpen]); // 添加isDropdownOpen到依赖数组

  return (
    <PageContainer
      content={
        <div>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
            <DashboardOutlined style={{ marginRight: 8, fontSize: 18 }} />
            <span style={{ fontSize: 16, fontWeight: 500 }}>系统指标监控面板</span>
          </div>
          <Text type="secondary">实时监控系统各项关键性能指标，支持多维度数据可视化展示</Text>
        </div>
      }
    >
      <div className="network-metrics">
        {/* 头部控制区域 */}
        <ProCard
          className="control-section"
          style={{ marginBottom: 16 }}
          bodyStyle={{ padding: '16px 24px' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Space size="middle">
              <Text strong>筛选指标:</Text>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {chartTags.map((tag) => (
                  <Tag.CheckableTag
                    key={tag.key}
                    checked={selectedTags.includes(tag.key)}
                    onChange={() => handleTagSelect(tag.key)}
                    style={{
                      padding: '4px 12px',
                      border: `1px solid ${selectedTags.includes(tag.key) ? tag.color : '#d9d9d9'}`,
                      borderRadius: '16px',
                      cursor: 'pointer',
                      background: selectedTags.includes(tag.key) ? `${tag.color}10` : '#fff',
                      color: selectedTags.includes(tag.key) ? tag.color : '#666',
                    }}
                  >
                    {tag.icon && <span style={{ marginRight: 4 }}>{tag.icon}</span>}
                    {tag.label}
                  </Tag.CheckableTag>
                ))}
              </div>
            </Space>

            <Space>
              <Radio.Group
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                size="small"
              >
                <Radio.Button value="5分钟">5分钟</Radio.Button>
                <Radio.Button value="15分钟">15分钟</Radio.Button>
                <Radio.Button value="30分钟">30分钟</Radio.Button>
                <Radio.Button value="1小时">1小时</Radio.Button>
              </Radio.Group>

              <Button
                type={autoRefresh ? 'primary' : 'default'}
                icon={<ReloadOutlined spin={loading} />}
                onClick={() => setAutoRefresh(!autoRefresh)}
              >
                {autoRefresh ? '自动刷新开启' : '自动刷新关闭'}
              </Button>
            </Space>
          </div>
        </ProCard>

        {/* 图表网格 */}
        <Row gutter={[16, 16]}>
          {filteredCharts.map((chart) => (
            <Col xs={24} sm={12} md={8} lg={6} key={chart.id}>
              <ChartCard chart={chart} />
            </Col>
          ))}
        </Row>

        {/* 抽屉 - 日志详情 */}
        <Drawer
          title={
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>{currentChart?.title} - 详细日志</span>
              <Button icon={<CloseOutlined />} type="text" onClick={handleCloseDrawer} />
            </div>
          }
          placement="right"
          onClose={handleCloseDrawer}
          open={drawerVisible}
          width={800}
        >
          <Table
            columns={logColumns}
            dataSource={logData}
            pagination={{ pageSize: 10 }}
            scroll={{ y: 600 }}
            rowClassName={(record) => {
              if (record.level === 'error') return 'error-row';
              if (record.level === 'warning') return 'warning-row';
              return '';
            }}
          />
        </Drawer>
      </div>
    </PageContainer>
  );
};

export default MetricsDetail;
