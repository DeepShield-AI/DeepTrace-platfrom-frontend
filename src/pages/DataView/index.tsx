import React, { useState, useEffect } from 'react';
import { 
  Row, 
  Col, 
  Select, 
  Button, 
  Typography,
  Space,
  Tag,
  Card,
  Tooltip,
  Progress,
  Radio,
  Drawer,
  Table,
  Badge
} from 'antd';
import { Line, Area, Column } from '@ant-design/plots';
import { 
  ReloadOutlined, 
  DashboardOutlined,
  MonitorOutlined,
  DatabaseOutlined,
  LineChartOutlined,
  ApiOutlined,
  ThunderboltOutlined,
  FireOutlined,
  CloudServerOutlined,
  WifiOutlined,
  HddOutlined,
  RocketOutlined,
  ExclamationCircleOutlined,
  TableOutlined,
  CloseOutlined
} from '@ant-design/icons';
import { ProCard, PageContainer } from '@ant-design/pro-components';

const { Title, Text } = Typography;
const { Option } = Select;

const NetworkMetrics = () => {
  const [timeRange, setTimeRange] = useState('15分钟');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedTags, setSelectedTags] = useState(['all']);
  const [metricsData, setMetricsData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [currentChart, setCurrentChart] = useState(null);
  const [logData, setLogData] = useState([]);

  // 图表标签配置
  const chartTags = [
    { key: 'all', label: '全部', color: 'blue', icon: <DashboardOutlined /> },
    { key: 'cpu', label: 'CPU', color: 'red', icon: <MonitorOutlined /> },
    { key: 'memory', label: '内存', color: 'green', icon: <DatabaseOutlined /> },
    { key: 'network', label: '网络', color: 'orange', icon: <WifiOutlined /> },
    { key: 'disk', label: '磁盘', color: 'purple', icon: <HddOutlined /> },
    { key: 'system', label: '系统', color: 'cyan', icon: <CloudServerOutlined /> }
  ];

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
      unit: '%'
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
      unit: '%'
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
      unit: 'Gbps'
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
      unit: 'K'
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
      unit: ''
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
      unit: '°C'
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
      unit: ''
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
      reverseThreshold: true // 反向阈值：低于阈值才警告
    }
  ];

  // 生成模拟数据
  const generateMetricsData = () => {
    const baseTime = ['15:02', '15:03', '15:04', '15:05', '15:06', '15:07', '15:08', '15:09', '15:10', '15:11', '15:12', '15:13'];
    
    return baseTime.map((time, index) => ({
      time,
      usage: 40 + Math.sin(index * 0.5) * 20 + Math.random() * 10, // CPU使用率
      memory: 60 + Math.cos(index * 0.3) * 15 + Math.random() * 8, // 内存使用率
      network: 1.5 + Math.sin(index * 0.4) * 0.8 + Math.random() * 0.3, // 网络吞吐量
      iops: 8 + Math.sin(index * 0.6) * 4 + Math.random() * 2, // 磁盘IOPS
      load: 1.5 + Math.sin(index * 0.4) * 0.8 + Math.random() * 0.3, // 系统负载
      temperature: 60 + Math.sin(index * 0.3) * 8 + Math.random() * 3, // 温度
      connections: 800 + Math.sin(index * 0.5) * 300 + Math.random() * 100, // 连接数
      cache: 90 + Math.cos(index * 0.4) * 8 + Math.random() * 4 // 缓存命中率
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
      const value = Math.random() * 100;
      
      return {
        key: index,
        timestamp,
        value: chart.dataKey === 'network' ? `${(value / 4).toFixed(2)} Gbps` :
                chart.dataKey === 'iops' ? `${Math.round(value * 200)}` :
                chart.dataKey === 'connections' ? `${Math.round(value * 20)}` :
                chart.dataKey === 'temperature' ? `${Math.round(value + 20)}°C` :
                `${value.toFixed(1)}%`,
        status: statuses[randomStatus],
        level: levels[randomStatus],
        operation: operations[Math.floor(Math.random() * operations.length)],
        message: `${chart.title} ${operations[Math.floor(Math.random() * operations.length)]}操作`,
        source: `server-${Math.floor(Math.random() * 5) + 1}`
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
    
    return metricsData.some(data => {
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
            value: chart.dataKey === 'network' ? `${datum[chart.dataKey].toFixed(1)} Gbps` : 
                   chart.dataKey === 'iops' ? `${datum[chart.dataKey].toFixed(0)}K` :
                   chart.dataKey === 'connections' ? `${Math.round(datum[chart.dataKey])}` :
                   chart.dataKey === 'temperature' ? `${datum[chart.dataKey].toFixed(0)}°C` :
                   `${datum[chart.dataKey].toFixed(1)}%`,
          };
        },
      },
      // 添加阈值线
      annotations: chart.threshold ? [
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
      ] : [],
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

  // 处理标签选择
  const handleTagSelect = (tagKey) => {
    if (tagKey === 'all') {
      setSelectedTags(['all']);
    } else {
      const newTags = selectedTags.includes('all') ? [] : [...selectedTags];
      
      if (newTags.includes(tagKey)) {
        // 如果已经选中，则移除
        const filtered = newTags.filter(tag => tag !== tagKey);
        setSelectedTags(filtered.length === 0 ? ['all'] : filtered);
      } else {
        // 如果未选中，则添加
        newTags.push(tagKey);
        setSelectedTags(newTags);
      }
    }
  };

  // 获取趋势图标和颜色
  const getTrendConfig = (trend) => {
    switch (trend) {
      case 'up':
        return { color: '#ff4d4f', icon: '↗' };
      case 'down':
        return { color: '#52c41a', icon: '↘' };
      case 'stable':
        return { color: '#faad14', icon: '→' };
      default:
        return { color: '#d9d9d9', icon: '→' };
    }
  };

  // 获取状态徽章颜色
  const getStatusColor = (status) => {
    switch (status) {
      case '正常': return 'green';
      case '警告': return 'orange';
      case '错误': return 'red';
      default: return 'default';
    }
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
      render: (value) => <Text strong>{value}</Text>
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status) => (
        <Badge 
          color={getStatusColor(status)} 
          text={status} 
        />
      ),
      filters: [
        { text: '正常', value: '正常' },
        { text: '警告', value: '警告' },
        { text: '错误', value: '错误' },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: '操作类型',
      dataIndex: 'operation',
      key: 'operation',
      width: 80,
      filters: [
        { text: '读取', value: '读取' },
        { text: '写入', value: '写入' },
        { text: '处理', value: '处理' },
        { text: '响应', value: '响应' },
        { text: '连接', value: '连接' },
        { text: '断开', value: '断开' },
      ],
      onFilter: (value, record) => record.operation === value,
    },
    {
      title: '来源',
      dataIndex: 'source',
      key: 'source',
      width: 100,
      filters: [
        { text: 'server-1', value: 'server-1' },
        { text: 'server-2', value: 'server-2' },
        { text: 'server-3', value: 'server-3' },
        { text: 'server-4', value: 'server-4' },
        { text: 'server-5', value: 'server-5' },
      ],
      onFilter: (value, record) => record.source === value,
    },
    {
      title: '消息',
      dataIndex: 'message',
      key: 'message',
      ellipsis: true,
    }
  ];

  // 过滤显示的图表
  const filteredCharts = chartConfigs.filter(chart => 
    selectedTags.includes('all') || selectedTags.includes(chart.tag)
  );

  useEffect(() => {
    setLoading(true);
    
    const timer = setTimeout(() => {
      setMetricsData(generateMetricsData());
      setLoading(false);
    }, 500);

    let interval;
    if (autoRefresh) {
      interval = setInterval(() => {
        const newData = generateMetricsData().map(item => ({
          ...item,
          usage: Math.max(10, Math.min(95, item.usage + Math.random() * 4 - 2)),
          memory: Math.max(20, Math.min(95, item.memory + Math.random() * 3 - 1.5)),
          network: Math.max(0.5, Math.min(3.0, item.network + Math.random() * 0.2 - 0.1)),
        }));
        setMetricsData(newData);
      }, 3000);
    }
    
    return () => {
      clearTimeout(timer);
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

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
                {chartTags.map(tag => (
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
                      color: selectedTags.includes(tag.key) ? tag.color : '#666'
                    }}
                  >
                    <span style={{ marginRight: 4 }}>{tag.icon}</span>
                    {tag.label}
                  </Tag.CheckableTag>
                ))}
              </div>
            </Space>
            
            <Space>
                <Select 
                  value={timeRange}
                  onChange={setTimeRange}
                  style={{ width: 120 }}
                  size="small"
                >
                  <Option value="15分钟">最近15分钟</Option>
                  <Option value="30分钟">最近30分钟</Option>
                  <Option value="1小时">最近1小时</Option>
                </Select>
                
                <Button 
                  icon={<ReloadOutlined />}
                  type={autoRefresh ? 'primary' : 'default'}
                  size="small"
                  onClick={() => setAutoRefresh(!autoRefresh)}
                >
                  自动刷新
                </Button>
              </Space>
          </div>
        </ProCard>

        {/* 图表网格 */}
        <Row gutter={[16, 16]}>
          {filteredCharts.map(chart => {
            const trendConfig = getTrendConfig(chart.trend);
            const ChartComponent = chart.type === 'column' ? Column : 
                                 chart.type === 'area' ? Area : Line;
            const exceedsThreshold = checkThresholdExceeded(chart);
            
            return (
              <Col key={chart.id} xs={24} sm={12} md={12} lg={6}>
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
                    transition: 'all 0.3s ease'
                  }}
                  bodyStyle={{ 
                    padding: '16px',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                  loading={loading}
                  extra={
                    <Tooltip title="查看详细日志">
                      <Button 
                        type="text" 
                        icon={<TableOutlined />} 
                        size="small"
                        onClick={() => handleViewLogs(chart)}
                        style={{ color: '#666' }}
                      />
                    </Tooltip>
                  }
                >
                  {/* 阈值警告图标 */}
                  {exceedsThreshold && (
                    <div style={{
                      position: 'absolute',
                      top: '8px',
                      right: '40px',
                      color: chart.thresholdColor,
                      animation: 'pulse 2s infinite'
                    }}>
                      <ExclamationCircleOutlined />
                    </div>
                  )}

                  {/* 图表头部 */}
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'flex-start',
                    marginBottom: '12px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '6px',
                        background: exceedsThreshold 
                          ? `${chart.thresholdColor}10` 
                          : `${chart.color}10`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: exceedsThreshold ? chart.thresholdColor : chart.color
                      }}>
                        {chart.icon}
                      </div>
                      <div>
                        <Text strong style={{ 
                          fontSize: '14px', 
                          display: 'block',
                          color: exceedsThreshold ? chart.thresholdColor : 'inherit'
                        }}>
                          {chart.title}
                          {exceedsThreshold && (
                            <Tooltip title={`当前值已超过阈值 ${chart.threshold}${chart.unit}`}>
                              <ExclamationCircleOutlined 
                                style={{ 
                                  marginLeft: 4, 
                                  color: chart.thresholdColor,
                                  fontSize: 12 
                                }} 
                              />
                            </Tooltip>
                          )}
                        </Text>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Text strong style={{ 
                            fontSize: '18px', 
                            color: exceedsThreshold ? chart.thresholdColor : chart.color,
                            lineHeight: 1
                          }}>
                            {chart.value}
                          </Text>
                          <Text style={{ 
                            fontSize: '12px', 
                            color: trendConfig.color,
                            lineHeight: 1
                          }}>
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
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginTop: '8px',
                    paddingTop: '8px',
                    borderTop: '1px solid #f0f0f0'
                  }}>
                    <Text 
                      type="secondary" 
                      style={{ 
                        fontSize: '12px',
                        color: exceedsThreshold ? chart.thresholdColor : 'inherit'
                      }}
                    >
                      最后更新: 刚刚
                      {exceedsThreshold && ' • 超过阈值'}
                    </Text>
                    <div style={{
                      padding: '2px 6px',
                      background: exceedsThreshold ? `${chart.thresholdColor}10` : '#f0f0f0',
                      borderRadius: '4px',
                      fontSize: '10px',
                      color: exceedsThreshold ? chart.thresholdColor : '#666',
                      border: `1px solid ${exceedsThreshold ? chart.thresholdColor : 'transparent'}`
                    }}>
                      {chart.tag.toUpperCase()}
                    </div>
                  </div>
                </Card>
              </Col>
            );
          })}
        </Row>

        {/* 空状态提示 */}
        {filteredCharts.length === 0 && (
          <ProCard 
            style={{ 
              height: '200px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              marginTop: '16px'
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <DashboardOutlined style={{ fontSize: '48px', color: '#d9d9d9', marginBottom: '16px' }} />
              <Text type="secondary">没有找到匹配的指标图表，请调整筛选条件</Text>
            </div>
          </ProCard>
        )}

        {/* 统计信息 */}
        <ProCard 
          style={{ marginTop: '16px' }}
          bodyStyle={{ padding: '12px 16px' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <Text type="secondary">
                共显示 {filteredCharts.length} 个指标图表
                {!selectedTags.includes('all') && ` (${selectedTags.join(', ')})`}
              </Text>
              {filteredCharts.some(chart => checkThresholdExceeded(chart)) && (
                <Text type="danger" style={{ marginLeft: 16 }}>
                  <ExclamationCircleOutlined /> 
                  有 {filteredCharts.filter(chart => checkThresholdExceeded(chart)).length} 个指标超过阈值
                </Text>
              )}
            </div>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              数据更新时间: {new Date().toLocaleTimeString()}
            </Text>
          </div>
        </ProCard>

        {/* 日志表格抽屉 */}
        <Drawer
          title={
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {currentChart?.icon}
                <span>{currentChart?.title} - 详细日志</span>
              </div>
              <Button 
                type="text" 
                icon={<CloseOutlined />} 
                onClick={handleCloseDrawer}
                size="small"
              />
            </div>
          }
          placement="right"
          onClose={handleCloseDrawer}
          open={drawerVisible}
          width="80%"
          style={{ maxWidth: '1200px' }}
        >
          {currentChart && (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              {/* 统计信息 */}
              <ProCard 
                style={{ marginBottom: 16 }}
                bodyStyle={{ padding: '12px 16px' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <Text strong>日志统计:</Text>
                    <span style={{ marginLeft: 16 }}>
                      <Badge color="green" text="正常" />
                      <span style={{ margin: '0 8px' }}>{logData.filter(item => item.status === '正常').length}</span>
                    </span>
                    <span style={{ marginLeft: 16 }}>
                      <Badge color="orange" text="警告" />
                      <span style={{ margin: '0 8px' }}>{logData.filter(item => item.status === '警告').length}</span>
                    </span>
                    <span style={{ marginLeft: 16 }}>
                      <Badge color="red" text="错误" />
                      <span style={{ margin: '0 8px' }}>{logData.filter(item => item.status === '错误').length}</span>
                    </span>
                  </div>
                  <Text type="secondary">共 {logData.length} 条日志记录</Text>
                </div>
              </ProCard>

              {/* 日志表格 */}
              <div style={{ flex: 1 }}>
                <Table
                  columns={logColumns}
                  dataSource={logData}
                  pagination={{
                    pageSize: 20,
                    showSizeChanger: true,
                    showQuickJumper: true,
                    showTotal: (total, range) => 
                      `第 ${range[0]}-${range[1]} 条，共 ${total} 条记录`
                  }}
                  scroll={{ y: 'calc(100vh - 250px)' }}
                  size="small"
                />
              </div>
            </div>
          )}
        </Drawer>
      </div>

      <style jsx>{`
        .network-metrics {
          padding: 0;
        }
        
        .control-section {
          background: #fff;
          border-radius: 8px;
        }
        
        .chart-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 16px;
          margin-top: 16px;
        }
        
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
        
        @media (max-width: 768px) {
          .chart-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </PageContainer>
  );
};

export default NetworkMetrics;