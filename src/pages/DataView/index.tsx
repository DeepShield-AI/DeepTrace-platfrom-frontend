import React, { useState, useEffect } from 'react';
import { 
  Row, 
  Col, 
  Select, 
  Button, 
  Typography,
  Space,
  ConfigProvider,
  Table,
  Input,
  Alert,
  Modal,
  Form,
  Checkbox,
  Card,
  Radio
} from 'antd';
import { Line } from '@ant-design/plots';
import { 
  ReloadOutlined, 
  CloseOutlined, 
  PlusOutlined,
  DashboardOutlined,
  CloudServerOutlined,
  SearchOutlined,
  ExclamationCircleOutlined,
  DesktopOutlined,
  LineChartOutlined,
  MonitorOutlined,
  DatabaseOutlined,
  ApiOutlined
} from '@ant-design/icons';
import { ProCard, PageContainer } from '@ant-design/pro-components';

const { Title, Text } = Typography;
const { Option } = Select;

const NetworkMetrics = () => {
  const [timeRange, setTimeRange] = useState('15分钟');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [dataTable, setDataTable] = useState('硬件指标');
  const [currentFocus, setCurrentFocus] = useState('cpu'); // 默认显示CPU指标
  const [metricsData, setMetricsData] = useState([]);
  const [tableData, setTableData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedFields, setSelectedFields] = useState([]);
  const [selectedTable, setSelectedTable] = useState('硬件指标');
  const [queries, setQueries] = useState([]);
  const [form] = Form.useForm();

  // 生成CPU指标图表数据
  const generateCPUMetricsData = () => {
    const baseData = [
      { time: '15:02', value: 45, usage: 45, temperature: 65, load: 2.1 },
      { time: '15:03', value: 52, usage: 52, temperature: 66, load: 2.3 },
      { time: '15:04', value: 38, usage: 38, temperature: 63, load: 1.8 },
      { time: '15:05', value: 65, usage: 65, temperature: 68, load: 2.8 },
      { time: '15:06', value: 48, usage: 48, temperature: 64, load: 2.0 },
      { time: '15:07', value: 61, usage: 61, temperature: 67, load: 2.5 },
      { time: '15:08', value: 57, usage: 57, temperature: 66, load: 2.4 },
      { time: '15:09', value: 63, usage: 63, temperature: 68, load: 2.6 },
      { time: '15:10', value: 49, usage: 49, temperature: 65, load: 2.1 },
      { time: '15:11', value: 66, usage: 66, temperature: 69, load: 2.9 },
      { time: '15:12', value: 42, usage: 42, temperature: 63, load: 1.9 },
      { time: '15:13', value: 64, usage: 64, temperature: 68, load: 2.7 }
    ];
    return baseData.map(item => ({ ...item }));
  };

  // 生成表格数据（CPU指标专用）
  const generateCPUTableData = () => {
    return [
      { 
        id: 1, 
        name: '服务器CPU-01', 
        status: '正常', 
        usage: '45%', 
        temperature: '65°C', 
        load: '2.1',
        coreCount: 8,
        frequency: '3.2GHz',
        cache: '16MB'
      },
      { 
        id: 2, 
        name: '服务器CPU-02', 
        status: '正常', 
        usage: '68%', 
        temperature: '72°C', 
        load: '3.4',
        coreCount: 16,
        frequency: '2.8GHz',
        cache: '32MB'
      },
      { 
        id: 3, 
        name: '数据库服务器CPU', 
        status: '警告', 
        usage: '92%', 
        temperature: '78°C', 
        load: '4.2',
        coreCount: 12,
        frequency: '3.0GHz',
        cache: '24MB'
      },
      { 
        id: 4, 
        name: '应用服务器CPU-01', 
        status: '正常', 
        usage: '38%', 
        temperature: '58°C', 
        load: '1.8',
        coreCount: 6,
        frequency: '3.5GHz',
        cache: '12MB'
      },
      { 
        id: 5, 
        name: '应用服务器CPU-02', 
        status: '正常', 
        usage: '52%', 
        temperature: '65°C', 
        load: '2.3',
        coreCount: 8,
        frequency: '3.2GHz',
        cache: '16MB'
      },
      { 
        id: 6, 
        name: '缓存服务器CPU', 
        status: '警告', 
        usage: '88%', 
        temperature: '82°C', 
        load: '3.8',
        coreCount: 16,
        frequency: '2.9GHz',
        cache: '32MB'
      },
      { 
        id: 7, 
        name: '负载均衡器CPU', 
        status: '正常', 
        usage: '41%', 
        temperature: '56°C', 
        load: '1.9',
        coreCount: 4,
        frequency: '3.8GHz',
        cache: '8MB'
      },
      { 
        id: 8, 
        name: '备份服务器CPU', 
        status: '正常', 
        usage: '35%', 
        temperature: '51°C', 
        load: '1.2',
        coreCount: 4,
        frequency: '3.0GHz',
        cache: '8MB'
      },
      { 
        id: 9, 
        name: '文件服务器CPU', 
        status: '正常', 
        usage: '58%', 
        temperature: '62°C', 
        load: '2.4',
        coreCount: 8,
        frequency: '3.1GHz',
        cache: '16MB'
      },
      { 
        id: 10, 
        name: '监控服务器CPU', 
        status: '警告', 
        usage: '79%', 
        temperature: '68°C', 
        load: '3.1',
        coreCount: 12,
        frequency: '2.7GHz',
        cache: '24MB'
      }
    ];
  };

  // 生成其他硬件指标数据
  const generateTableData = (tableType) => {
    const baseDataMap = {
      '硬件指标': generateCPUTableData(), // 默认使用CPU数据
      '网络': [
        { id: 1, name: 'API网关', status: '正常', throughput: '1.2Gbps', latency: '15ms', connections: 1200 },
        { id: 2, name: '负载均衡', status: '正常', throughput: '980Mbps', latency: '8ms', connections: 850 },
        { id: 3, name: 'CDN节点', status: '正常', throughput: '2.4Gbps', latency: '32ms', connections: 2400 },
        { id: 4, name: '边缘节点1', status: '正常', throughput: '1.8Gbps', latency: '28ms', connections: 1800 },
        { id: 5, name: '边缘节点2', status: '警告', throughput: '1.5Gbps', latency: '45ms', connections: 1500 },
        { id: 6, name: '核心交换机', status: '正常', throughput: '3.2Gbps', latency: '5ms', connections: 3200 },
        { id: 7, name: '接入交换机1', status: '正常', throughput: '1.1Gbps', latency: '12ms', connections: 1100 },
        { id: 8, name: '接入交换机2', status: '警告', throughput: '0.9Gbps', latency: '25ms', connections: 900 },
        { id: 9, name: '防火墙', status: '正常', throughput: '2.8Gbps', latency: '18ms', connections: 2800 },
        { id: 10, name: 'VPN网关', status: '正常', throughput: '1.5Gbps', latency: '22ms', connections: 1500 }
      ],
      '事件': [
        { id: 1, name: '安全告警', status: '紧急', level: '高危', time: '2023-05-15 14:23', source: '防火墙' },
        { id: 2, name: '性能异常', status: '警告', level: '中危', time: '2023-05-15 14:15', source: '应用服务器' },
        { id: 3, name: '连接超时', status: '正常', level: '低危', time: '2023-05-15 13:58', source: '负载均衡' },
        { id: 4, name: '磁盘空间不足', status: '紧急', level: '高危', time: '2023-05-15 13:42', source: '存储设备' },
        { id: 5, name: '网络延迟', status: '警告', level: '中危', time: '2023-05-15 13:25', source: '网络设备' },
        { id: 6, name: '认证失败', status: '正常', level: '低危', time: '2023-05-15 13:10', source: '认证服务' },
        { id: 7, name: '内存泄漏', status: '紧急', level: '高危', time: '2023-05-15 12:55', source: '应用服务器' },
        { id: 8, name: '服务重启', status: '正常', level: '低危', time: '2023-05-15 12:40', source: '系统服务' },
        { id: 9, name: '配置变更', status: '警告', level: '中危', time: '2023-05-15 12:20', source: '管理系统' },
        { id: 10, name: '备份完成', status: '正常', level: '信息', time: '2023-05-15 12:05', source: '备份系统' }
      ]
    };
    return baseDataMap[tableType] || [];
  };

  // CPU指标专用表格列定义
  const cpuTableColumns = [
    { 
      title: 'CPU名称', 
      dataIndex: 'name', 
      key: 'name',
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm }) => (
        <div style={{ padding: 8 }}>
          <Input
            placeholder="搜索CPU名称"
            value={selectedKeys[0]}
            onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
            onPressEnter={() => confirm()}
            style={{ width: 188, marginBottom: 8, display: 'block' }}
          />
          <Button
            type="primary"
            onClick={() => confirm()}
            size="small"
            style={{ width: 90 }}
          >
            搜索
          </Button>
        </div>
      ),
      filterIcon: (filtered) => (
        <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />
      ),
      onFilter: (value, record) => record.name.toLowerCase().includes(value.toLowerCase())
    },
    { 
      title: '状态', 
      dataIndex: 'status', 
      key: 'status',
      filters: [
        { text: '正常', value: '正常' },
        { text: '警告', value: '警告' },
        { text: '紧急', value: '紧急' },
      ],
      onFilter: (value, record) => record.status === value,
      render: (status) => (
        <span style={{
          color: status === '正常' ? '#52c41a' : status === '警告' ? '#faad14' : '#f5222d',
          fontWeight: 'bold'
        }}>
          {status}
        </span>
      )
    },
    { 
      title: '使用率', 
      dataIndex: 'usage', 
      key: 'usage', 
      sorter: (a, b) => parseFloat(a.usage) - parseFloat(b.usage),
      render: (usage) => (
        <span style={{
          color: parseFloat(usage) > 80 ? '#f5222d' : parseFloat(usage) > 60 ? '#faad14' : '#52c41a',
          fontWeight: 'bold'
        }}>
          {usage}
        </span>
      )
    },
    { 
      title: '温度', 
      dataIndex: 'temperature', 
      key: 'temperature', 
      sorter: (a, b) => parseInt(a.temperature) - parseInt(b.temperature),
      render: (temperature) => (
        <span style={{
          color: parseInt(temperature) > 75 ? '#f5222d' : parseInt(temperature) > 65 ? '#faad14' : '#52c41a'
        }}>
          {temperature}
        </span>
      )
    },
    { 
      title: '负载', 
      dataIndex: 'load', 
      key: 'load', 
      sorter: (a, b) => parseFloat(a.load) - parseFloat(b.load),
      render: (load) => (
        <span style={{
          color: parseFloat(load) > 3.0 ? '#f5222d' : parseFloat(load) > 2.0 ? '#faad14' : '#52c41a'
        }}>
          {load}
        </span>
      )
    },
    { title: '核心数', dataIndex: 'coreCount', key: 'coreCount' },
    { title: '频率', dataIndex: 'frequency', key: 'frequency' },
    { title: '缓存', dataIndex: 'cache', key: 'cache' }
  ];

  // 表格列定义（增加筛选功能）
  const tableColumns = {
    '硬件指标': cpuTableColumns,
    '网络': [
      { 
        title: '节点名称', 
        dataIndex: 'name', 
        key: 'name',
        filterDropdown: ({ setSelectedKeys, selectedKeys, confirm }) => (
          <div style={{ padding: 8 }}>
            <Input
              placeholder="搜索节点名称"
              value={selectedKeys[0]}
              onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
              onPressEnter={() => confirm()}
              style={{ width: 188, marginBottom: 8, display: 'block' }}
            />
            <Button
              type="primary"
              onClick={() => confirm()}
              size="small"
              style={{ width: 90 }}
            >
              搜索
            </Button>
          </div>
        ),
        filterIcon: (filtered) => (
          <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />
        ),
        onFilter: (value, record) => record.name.toLowerCase().includes(value.toLowerCase())
      },
      { 
        title: '状态', 
        dataIndex: 'status', 
        key: 'status',
        filters: [
          { text: '正常', value: '正常' },
          { text: '警告', value: '警告' },
        ],
        onFilter: (value, record) => record.status === value
      },
      { title: '吞吐量', dataIndex: 'throughput', key: 'throughput', sorter: (a, b) => parseFloat(a.throughput) - parseFloat(b.throughput) },
      { title: '延迟', dataIndex: 'latency', key: 'latency', sorter: (a, b) => parseInt(a.latency) - parseInt(b.latency) },
      { title: '连接数', dataIndex: 'connections', key: 'connections', sorter: (a, b) => a.connections - b.connections }
    ],
    '事件': [
      { 
        title: '事件名称', 
        dataIndex: 'name', 
        key: 'name',
        filterDropdown: ({ setSelectedKeys, selectedKeys, confirm }) => (
          <div style={{ padding: 8 }}>
            <Input
              placeholder="搜索事件名称"
              value={selectedKeys[0]}
              onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
              onPressEnter={() => confirm()}
              style={{ width: 188, marginBottom: 8, display: 'block' }}
            />
            <Button
              type="primary"
              onClick={() => confirm()}
              size="small"
              style={{ width: 90 }}
            >
              搜索
            </Button>
          </div>
        ),
        filterIcon: (filtered) => (
          <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />
        ),
        onFilter: (value, record) => record.name.toLowerCase().includes(value.toLowerCase())
      },
      { 
        title: '状态', 
        dataIndex: 'status', 
        key: 'status',
        filters: [
          { text: '正常', value: '正常' },
          { text: '警告', value: '警告' },
          { text: '紧急', value: '紧急' },
        ],
        onFilter: (value, record) => record.status === value
      },
      { title: '级别', dataIndex: 'level', key: 'level', 
        filters: [
          { text: '高危', value: '高危' },
          { text: '中危', value: '中危' },
          { text: '低危', value: '低危' },
          { text: '信息', value: '信息' },
        ],
        onFilter: (value, record) => record.level === value
      },
      { title: '时间', dataIndex: 'time', key: 'time', sorter: (a, b) => new Date(a.time) - new Date(b.time) },
      { title: '来源', dataIndex: 'source', key: 'source' }
    ]
  };

  // 处理表格变化（分页、筛选、排序）
  const handleTableChange = (pagination, filters, sorter) => {
    setPagination(pagination);
    
    let filtered = [...tableData];
    
    // 应用筛选
    Object.keys(filters).forEach(key => {
      if (filters[key]) {
        filtered = filtered.filter(item => filters[key].includes(item[key]));
      }
    });
    
    // 应用排序
    if (sorter.field) {
      filtered = filtered.sort((a, b) => {
        if (sorter.order === 'ascend') {
          return a[sorter.field] > b[sorter.field] ? 1 : -1;
        } else {
          return a[sorter.field] < b[sorter.field] ? 1 : -1;
        }
      });
    }
    
    setFilteredData(filtered);
  };

  // 根据当前关注的指标类型获取图表配置
  const getChartConfig = (focusType) => {
    const configMap = {
      cpu: {
        title: 'CPU使用率监控',
        yField: 'usage',
        color: '#1890ff',
        yAxisTitle: '使用率 (%)',
        tooltipName: 'CPU使用率'
      },
      memory: {
        title: '内存使用率监控',
        yField: 'usage',
        color: '#52c41a',
        yAxisTitle: '使用率 (%)',
        tooltipName: '内存使用率'
      },
      virtual_memory: {
        title: '虚拟内存监控',
        yField: 'usage',
        color: '#faad14',
        yAxisTitle: '使用率 (%)',
        tooltipName: '虚拟内存使用率'
      },
      disk: {
        title: '磁盘使用率监控',
        yField: 'usage',
        color: '#f5222d',
        yAxisTitle: '使用率 (%)',
        tooltipName: '磁盘使用率'
      },
      network_interface: {
        title: '网络接口流量监控',
        yField: 'throughput',
        color: '#722ed1',
        yAxisTitle: '吞吐量 (Mbps)',
        tooltipName: '网络吞吐量'
      }
    };
    
    const config = configMap[focusType] || configMap.cpu;
    
    return {
      data: metricsData,
      xField: 'time',
      yField: config.yField,
      height: 300,
      autoFit: true,
      loading: loading,
      color: config.color,
      lineStyle: {
        stroke: config.color,
        lineWidth: 3,
      },
      point: {
        size: 4,
        style: {
          fill: config.color,
          stroke: '#fff',
          lineWidth: 2,
        },
      },
      xAxis: {
        title: {
          text: '时间',
          style: {
            fill: '#aaa',
          },
        },
        label: {
          style: {
            fill: '#aaa',
          },
        },
      },
      yAxis: {
        title: {
          text: config.yAxisTitle,
          style: {
            fill: '#aaa',
          },
        },
        label: {
          style: {
            fill: '#aaa',
          },
        },
        min: 0,
        max: focusType === 'network_interface' ? 1000 : 100,
      },
      tooltip: {
        showMarkers: true,
        formatter: (datum) => {
          return {
            name: config.tooltipName,
            value: focusType === 'network_interface' ? `${datum[config.yField]}Mbps` : `${datum[config.yField]}%`,
          };
        },
      },
      animation: false,
    };
  };

  useEffect(() => {
    setLoading(true);
    
    const timer = setTimeout(() => {
      setMetricsData(generateCPUMetricsData());
      const newTableData = generateTableData(dataTable);
      setTableData(newTableData);
      setFilteredData(newTableData);
      setPagination({
        ...pagination,
        total: newTableData.length
      });
      setLoading(false);
    }, 100);

    let interval;
    if (autoRefresh) {
      interval = setInterval(() => {
        const newData = generateCPUMetricsData().map(item => ({
          ...item,
          usage: Math.max(10, Math.min(95, item.usage + Math.floor(Math.random() * 6) - 3)),
          temperature: Math.max(40, Math.min(85, item.temperature + Math.floor(Math.random() * 4) - 2)),
          load: Math.max(0.5, Math.min(5.0, item.load + (Math.random() * 0.4 - 0.2))).toFixed(1)
        }));
        setMetricsData(newData);
      }, 2000);
    }
    
    return () => {
      clearTimeout(timer);
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, dataTable, currentFocus]);

  // 显示添加查询的模态框
  const showAddQueryModal = () => {
    setIsModalVisible(true);
    setSelectedTable('硬件指标');
    form.resetFields();
  };

  // 处理模态框确认
  const handleModalOk = () => {
    form.validateFields().then(values => {
      const { table, focusItem, fields } = values;
      const newQuery = {
        id: Date.now(),
        table,
        focusItem: focusItem || 'cpu',
        fields: fields || [],
        data: generateTableData(table),
        metrics: generateCPUMetricsData()
      };
      setQueries([...queries, newQuery]);
      setIsModalVisible(false);
    });
  };

  // 处理模态框取消
  const handleModalCancel = () => {
    setIsModalVisible(false);
  };

  // 根据表类型获取可选的字段
  const getAvailableFields = (tableType) => {
    const fieldsMap = {
      '硬件指标': ['name', 'status', 'usage', 'temperature', 'load', 'coreCount', 'frequency', 'cache'],
      '网络': ['name', 'status', 'throughput', 'latency', 'connections'],
      '事件': ['name', 'status', 'level', 'time', 'source']
    };
    return fieldsMap[tableType] || [];
  };

  // 获取硬件指标关注项
  const getHardwareFocusItems = () => {
    return [
      { 
        key: 'cpu', 
        name: 'CPU指标', 
        icon: <MonitorOutlined />,
        description: 'CPU使用率、负载、温度等核心指标',
        color: '#1890ff'
      },
      { 
        key: 'memory', 
        name: '内存指标', 
        icon: <DatabaseOutlined />,
        description: '内存使用率、交换分区等内存相关指标',
        color: '#52c41a'
      },
      { 
        key: 'virtual_memory', 
        name: '虚拟内存指标', 
        icon: <LineChartOutlined />,
        description: '虚拟内存使用情况、页面交换等指标',
        color: '#faad14'
      },
      { 
        key: 'disk', 
        name: '磁盘指标', 
        icon: <DatabaseOutlined />,
        description: '磁盘IO、使用率、读写速度等存储指标',
        color: '#f5222d'
      },
      { 
        key: 'network_interface', 
        name: '网络接口指标', 
        icon: <ApiOutlined />,
        description: '网络接口流量、错误率、连接数等指标',
        color: '#722ed1'
      }
    ];
  };

  // 删除查询
  const removeQuery = (id) => {
    setQueries(queries.filter(query => query.id !== id));
  };

  return (
    <PageContainer
        content={
            <div>
                <Alert 
                    message="指标查看模块提供对硬件指标的实时监控与可视化呈现，助力管理员快速掌握系统运行状态。" 
                    type="info" 
                    showIcon 
                    style={{ marginBottom: 16 }}
                />
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <DashboardOutlined style={{ marginRight: 8, fontSize: 18 }} />
                    <span>硬件指标监控</span>
                </div>
            </div>
        }
    >
      <div className="network-metrics-dark">
        {/* 头部区域 */}
        <div className="metrics-header">
          <div className="header-content">
            <div className="header-right">
              <Space>
                <Button 
                  type="primary" 
                  icon={<PlusOutlined />}
                  className="add-query-btn"
                  onClick={showAddQueryModal}
                >
                  添加查询
                </Button>
                
                <Select 
                  value={timeRange}
                  onChange={setTimeRange}
                  className="time-select"
                >
                  <Option value="15分钟">最近15分钟</Option>
                  <Option value="30分钟">最近30分钟</Option>
                  <Option value="1小时">最近1小时</Option>
                </Select>
                
                <Button 
                  icon={<ReloadOutlined />}
                  type={autoRefresh ? 'primary' : 'default'}
                  className="auto-refresh-btn"
                  onClick={() => setAutoRefresh(!autoRefresh)}
                >
                  自动(2s)
                </Button>
              </Space>
            </div>
          </div>
        </div>

        {/* 主内容区域 */}
        <ProCard 
            className="metrics-content"
            style={{backgroundColor: "#f5f5f5", marginTop: "20px", border: "1px solid #d9d9d9"}}
            direction="column"
        >
          {/* 指标类型选择 */}
          <ProCard className="focus-select-section" bordered={false}>
            <Row gutter={16} align="middle">
              <Col>
                <div className="config-item">
                  <Text strong style={{ marginRight: 12 }}>监控指标:</Text>
                  <Radio.Group 
                    value={currentFocus}
                    onChange={(e) => setCurrentFocus(e.target.value)}
                    buttonStyle="solid"
                  >
                    {getHardwareFocusItems().map(item => (
                      <Radio.Button key={item.key} value={item.key}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <span style={{ 
                            color: item.color, 
                            marginRight: 4,
                            display: 'flex',
                            alignItems: 'center'
                          }}>
                            {item.icon}
                          </span>
                          {item.name}
                        </div>
                      </Radio.Button>
                    ))}
                  </Radio.Group>
                </div>
              </Col>
            </Row>
          </ProCard>

          {/* 数据表格 */}
          <ProCard 
            className="data-table-section" 
            bordered={false} 
            collapsible={true}
            title={"CPU监控数据"}
            style={{ marginTop: 16 }}
          >
            <Table 
              columns={tableColumns[dataTable]} 
              dataSource={filteredData}
              size="middle"
              pagination={{
                ...pagination,
                showSizeChanger: true,
                pageSizeOptions: ['10', '20', '50'],
                showTotal: (total) => `共 ${total} 条`,
                position: ['bottomRight']
              }}
              bordered
              loading={loading}
              rowKey="id"
              onChange={handleTableChange}
              scroll={{ x: 1000 }}
            />
          </ProCard>

          {/* 图表区域 */}
          <ProCard 
            className="chart-section" 
            bordered={false}
            title={
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <LineChartOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                <span>CPU使用率趋势</span>
              </div>
            }
            style={{ marginTop: 16 }}
          >
            <div className="chart-container">
              <Line {...getChartConfig(currentFocus)} />
            </div>
          </ProCard>
        </ProCard>

        {/* 新增的查询区域 */}
        {queries.map((query) => (
          <ProCard 
            key={query.id}
            className="metrics-content"
            style={{backgroundColor: "#f5f5f5", marginTop: "20px", border: "1px solid #d9d9d9"}}
            direction="column"
          >
            <ProCard 
              extra={
                <Button 
                  icon={<CloseOutlined />} 
                  onClick={() => removeQuery(query.id)}
                  size="small"
                />
              }
              title={`自定义查询 - ${query.table} - ${getHardwareFocusItems().find(f => f.key === query.focusItem)?.name || 'CPU指标'}`}
              bordered={false}
              direction='column'
            >
              {/* 显示选择的关注项 */}
              {query.focusItem && (
                <ProCard 
                  className="focus-items-section" 
                  bordered={false}
                  title="监控指标"
                  style={{ marginBottom: 16 }}
                >
                  <div style={{ 
                    padding: '8px 12px',
                    backgroundColor: '#f0f8ff',
                    border: '1px solid #d6e4ff',
                    borderRadius: '6px',
                    display: 'inline-block'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span style={{ 
                        color: getHardwareFocusItems().find(f => f.key === query.focusItem)?.color || '#1890ff',
                        marginRight: 8,
                        display: 'flex',
                        alignItems: 'center'
                      }}>
                        {getHardwareFocusItems().find(f => f.key === query.focusItem)?.icon}
                      </span>
                      <span style={{ fontWeight: 'bold' }}>
                        {getHardwareFocusItems().find(f => f.key === query.focusItem)?.name}
                      </span>
                    </div>
                  </div>
                </ProCard>
              )}
              
              {/* 数据表格 */}
              <ProCard 
                className="data-table-section" 
                bordered={false} 
                collapsible={true}
                title={`${query.table}数据`}
              >
                <Table
                  columns={tableColumns[query.table].filter(col => 
                    query.fields && query.fields.length > 0 
                      ? query.fields.includes(col.key || col.dataIndex)
                      : true
                  )} 
                  dataSource={query.data}
                  size="middle"
                  pagination={{
                    pageSize: 10,
                    showSizeChanger: true,
                    showTotal: (total) => `共 ${total} 条`,
                    position: ['bottomRight']
                  }}
                  bordered
                  loading={loading}
                  rowKey="id"
                />
              </ProCard>

              {/* 图表区域 */}
              <ProCard 
                className="chart-section" 
                bordered={false}
                title={`${getHardwareFocusItems().find(f => f.key === query.focusItem)?.name || '指标'}趋势`}
              >
                <div className="chart-container">
                  <Line {...{
                    ...getChartConfig(query.focusItem || 'cpu'),
                    data: query.metrics,
                    color: getHardwareFocusItems().find(f => f.key === query.focusItem)?.color || '#13c2c2'
                  }} />
                </div>
              </ProCard>
            </ProCard>
          </ProCard>
        ))}

        {/* 添加查询的模态框 */}
        <Modal
          title={
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <PlusOutlined style={{ marginRight: 8, color: '#1890ff' }} />
              添加新查询
            </div>
          }
          visible={isModalVisible}
          onOk={handleModalOk}
          onCancel={handleModalCancel}
          width={700}
          bodyStyle={{ padding: '24px' }}
        >
          <Form
            form={form}
            layout="vertical"
            initialValues={{
              table: '硬件指标',
              focusItem: 'cpu',
              fields: []
            }}
          >
            <Form.Item
              name="table"
              label={
                <div style={{ display: 'flex', alignItems: 'center', fontWeight: 500 }}>
                  <DashboardOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                  选择数据集
                </div>
              }
              rules={[{ required: true, message: '请选择数据集' }]}
            >
              <Select 
                onChange={(value) => setSelectedTable(value)}
                style={{ width: '100%' }}
                optionLabelProp="label"
              >
                <Option value="硬件指标" label="硬件指标">
                  <div style={{ display: 'flex', alignItems: 'center', padding: '8px 0' }}>
                    <DesktopOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                    <div>
                      <div style={{ fontWeight: 500 }}>硬件指标</div>
                      <div style={{ fontSize: '12px', color: '#999' }}>服务器、存储等硬件设备监控指标</div>
                    </div>
                  </div>
                </Option>
                <Option value="网络" label="网络">
                  <div style={{ display: 'flex', alignItems: 'center', padding: '8px 0' }}>
                    <CloudServerOutlined style={{ marginRight: 8, color: '#52c41a' }} />
                    <div>
                      <div style={{ fontWeight: 500 }}>网络</div>
                      <div style={{ fontSize: '12px', color: '#999' }}>网络设备和流量监控指标</div>
                    </div>
                  </div>
                </Option>
                <Option value="事件" label="事件">
                  <div style={{ display: 'flex', alignItems: 'center', padding: '8px 0' }}>
                    <ExclamationCircleOutlined style={{ marginRight: 8, color: '#faad14' }} />
                    <div>
                      <div style={{ fontWeight: 500 }}>事件</div>
                      <div style={{ fontSize: '12px', color: '#999' }}>系统事件和告警信息</div>
                    </div>
                  </div>
                </Option>
              </Select>
            </Form.Item>
            
            {/* 硬件指标关注项选择（改为单选） */}
            {selectedTable === '硬件指标' && (
              <Form.Item
                name="focusItem"
                label={
                  <div style={{ display: 'flex', alignItems: 'center', fontWeight: 500 }}>
                    <LineChartOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                    选择监控指标（单选）
                  </div>
                }
                rules={[{ required: true, message: '请选择一个监控指标' }]}
              >
                <Radio.Group style={{ width: '100%' }}>
                  <Row gutter={[16, 16]}>
                    {getHardwareFocusItems().map(item => (
                      <Col span={12} key={item.key}>
                        <Card 
                          size="small" 
                          style={{ 
                            border: '1px solid #d9d9d9',
                            borderRadius: '8px',
                            cursor: 'pointer'
                          }}
                          bodyStyle={{ 
                            padding: '12px',
                            display: 'flex',
                            alignItems: 'center'
                          }}
                          onClick={() => form.setFieldsValue({ focusItem: item.key })}
                        >
                          <Radio value={item.key} style={{ width: '100%' }}>
                            <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                              <div 
                                style={{ 
                                  color: item.color, 
                                  fontSize: '16px', 
                                  marginRight: '8px',
                                  display: 'flex',
                                  alignItems: 'center'
                                }}
                              >
                                {item.icon}
                              </div>
                              <div>
                                <div style={{ fontWeight: 500, fontSize: '14px' }}>
                                  {item.name}
                                </div>
                                <div style={{ fontSize: '12px', color: '#999', marginTop: '2px' }}>
                                  {item.description}
                                </div>
                              </div>
                            </div>
                          </Radio>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                </Radio.Group>
              </Form.Item>
            )}
            
            {/* 其他数据集的字段选择 */}
            {selectedTable !== '硬件指标' && (
              <Form.Item
                name="fields"
                label={
                  <div style={{ display: 'flex', alignItems: 'center', fontWeight: 500 }}>
                    <LineChartOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                    选择关注的字段
                  </div>
                }
                rules={[{ required: true, message: '请至少选择一个字段' }]}
              >
                <Checkbox.Group style={{ width: '100%' }}>
                  <Row gutter={[16, 16]}>
                    {getAvailableFields(selectedTable).map(field => (
                      <Col span={8} key={field}>
                        <Checkbox value={field}>
                          {tableColumns[selectedTable].find(col => col.dataIndex === field)?.title || field}
                        </Checkbox>
                      </Col>
                    ))}
                  </Row>
                </Checkbox.Group>
              </Form.Item>
            )}
          </Form>
        </Modal>
      </div>
    </PageContainer>
  );
};

export default NetworkMetrics;