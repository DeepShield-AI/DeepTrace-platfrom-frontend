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
  Checkbox
} from 'antd';
import { Line } from '@ant-design/plots';
import { 
  ReloadOutlined, 
  CloseOutlined, 
  PlusOutlined,
  DashboardOutlined,
  CloudServerOutlined,
  SearchOutlined,
  
} from '@ant-design/icons';
import { ProCard, PageContainer } from '@ant-design/pro-components';

const { Title, Text } = Typography;
const { Option } = Select;

const NetworkMetrics = () => {
  const [timeRange, setTimeRange] = useState('15分钟');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [dataTable, setDataTable] = useState('应用');
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
  const [selectedTable, setSelectedTable] = useState('应用');
  const [queries, setQueries] = useState([]);
  const [form] = Form.useForm();

  // 生成图表数据
  const generateMockData = () => {
    const baseData = [
      { time: '15:02', value: 85 },
      { time: '15:03', value: 92 },
      { time: '15:04', value: 78 },
      { time: '15:05', value: 95 },
      { time: '15:06', value: 88 },
      { time: '15:07', value: 91 },
      { time: '15:08', value: 87 },
      { time: '15:09', value: 93 },
      { time: '15:10', value: 89 },
      { time: '15:11', value: 96 },
      { time: '15:12', value: 82 },
      { time: '15:13', value: 94 }
    ];
    return baseData.map(item => ({ ...item }));
  };

  // 生成表格数据（增加数据量）
  const generateTableData = (tableType) => {
    const baseDataMap = {
      '应用': [
        { id: 1, name: '订单服务', status: '正常', qps: 1200, errorRate: '0.2%', responseTime: '45ms' },
        { id: 2, name: '支付服务', status: '正常', qps: 850, errorRate: '0.1%', responseTime: '32ms' },
        { id: 3, name: '用户服务', status: '警告', qps: 650, errorRate: '1.2%', responseTime: '78ms' },
        { id: 4, name: '商品服务', status: '正常', qps: 420, errorRate: '0.3%', responseTime: '52ms' },
        { id: 5, name: '库存服务', status: '正常', qps: 380, errorRate: '0.4%', responseTime: '48ms' },
        { id: 6, name: '物流服务', status: '警告', qps: 290, errorRate: '1.8%', responseTime: '85ms' },
        { id: 7, name: '评价服务', status: '正常', qps: 180, errorRate: '0.2%', responseTime: '38ms' },
        { id: 8, name: '促销服务', status: '正常', qps: 320, errorRate: '0.5%', responseTime: '55ms' },
        { id: 9, name: '搜索服务', status: '正常', qps: 750, errorRate: '0.3%', responseTime: '62ms' },
        { id: 10, name: '推荐服务', status: '警告', qps: 480, errorRate: '1.5%', responseTime: '72ms' },
        { id: 11, name: '通知服务', status: '正常', qps: 210, errorRate: '0.2%', responseTime: '42ms' },
        { id: 12, name: '认证服务', status: '正常', qps: 390, errorRate: '0.4%', responseTime: '58ms' }
      ],
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
        { id: 10, name: 'VPN网关', status: '正常', throughput: '1.5Gbps', latency: '22ms', connections: 1500 },
        { id: 11, name: 'DNS服务器', status: '正常', throughput: '0.8Gbps', latency: '10ms', connections: 800 },
        { id: 12, name: '缓存服务器', status: '警告', throughput: '1.2Gbps', latency: '35ms', connections: 1200 }
      ],
      '安全': [
        { id: 1, name: '防火墙', status: '正常', blocked: 42, alerts: 3, lastScan: '2023-05-15' },
        { id: 2, name: 'WAF', status: '正常', blocked: 128, alerts: 8, lastScan: '2023-05-15' },
        { id: 3, name: 'IDS', status: '警告', blocked: 356, alerts: 24, lastScan: '2023-05-15' },
        { id: 4, name: 'IPS', status: '正常', blocked: 210, alerts: 12, lastScan: '2023-05-15' },
        { id: 5, name: 'DDoS防护', status: '正常', blocked: 85, alerts: 5, lastScan: '2023-05-15' },
        { id: 6, name: '漏洞扫描', status: '警告', blocked: 0, alerts: 18, lastScan: '2023-05-15' },
        { id: 7, name: '日志审计', status: '正常', blocked: 0, alerts: 7, lastScan: '2023-05-15' },
        { id: 8, name: '访问控制', status: '正常', blocked: 95, alerts: 9, lastScan: '2023-05-15' },
        { id: 9, name: '数据加密', status: '警告', blocked: 0, alerts: 15, lastScan: '2023-05-15' },
        { id: 10, name: '密钥管理', status: '正常', blocked: 0, alerts: 4, lastScan: '2023-05-15' },
        { id: 11, name: '身份认证', status: '正常', blocked: 38, alerts: 6, lastScan: '2023-05-15' },
        { id: 12, name: '安全监控', status: '警告', blocked: 0, alerts: 21, lastScan: '2023-05-15' }
      ]
    };
    return baseDataMap[tableType] || [];
  };

  // 表格列定义（增加筛选功能）
  const tableColumns = {
    '应用': [
      { 
        title: '服务名称', 
        dataIndex: 'name', 
        key: 'name',
        filterDropdown: ({ setSelectedKeys, selectedKeys, confirm }) => (
          <div style={{ padding: 8 }}>
            <Input
              placeholder="搜索服务名称"
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
      { title: 'QPS', dataIndex: 'qps', key: 'qps', sorter: (a, b) => a.qps - b.qps },
      { title: '错误率', dataIndex: 'errorRate', key: 'errorRate', sorter: (a, b) => parseFloat(a.errorRate) - parseFloat(b.errorRate) },
      { title: '响应时间', dataIndex: 'responseTime', key: 'responseTime', sorter: (a, b) => parseInt(a.responseTime) - parseInt(b.responseTime) }
    ],
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
    '安全': [
      { 
        title: '防护名称', 
        dataIndex: 'name', 
        key: 'name',
        filterDropdown: ({ setSelectedKeys, selectedKeys, confirm }) => (
          <div style={{ padding: 8 }}>
            <Input
              placeholder="搜索防护名称"
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
      { title: '拦截次数', dataIndex: 'blocked', key: 'blocked', sorter: (a, b) => a.blocked - b.blocked },
      { title: '告警数', dataIndex: 'alerts', key: 'alerts', sorter: (a, b) => a.alerts - b.alerts },
      { title: '最后扫描', dataIndex: 'lastScan', key: 'lastScan', sorter: (a, b) => new Date(a.lastScan) - new Date(b.lastScan) }
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

  useEffect(() => {
    setLoading(true);
    
    const timer = setTimeout(() => {
      setMetricsData(generateMockData());
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
        const newData = generateMockData().map(item => ({
          time: item.time,
          value: Math.max(70, Math.min(100, item.value + Math.floor(Math.random() * 6) - 3))
        }));
        setMetricsData(newData);
      }, 2000);
    }
    
    return () => {
      clearTimeout(timer);
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, dataTable]);

  const chartConfig = {
    data: metricsData,
    xField: 'time',
    yField: 'value',
    height: 300,
    autoFit: true,
    loading: loading,
    color: '#722ed1',
    lineStyle: {
      stroke: '#722ed1',
      lineWidth: 3,
    },
    point: {
      size: 4,
      style: {
        fill: '#722ed1',
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
        text: '数量 (k个)',
        style: {
          fill: '#aaa',
        },
      },
      label: {
        formatter: (value) => `${value}k`,
        style: {
          fill: '#aaa',
        },
      },
      min: 0,
      max: 100,
    },
    tooltip: {
      showMarkers: true,
      formatter: (datum) => {
        return {
          name: `Avg(请求)`,
          value: `${datum.value}k个`,
        };
      },
    },
    animation: false,
    onReady: (plot) => {
      console.log('图表加载完成', plot);
    },
    onError: (error) => {
      console.error('图表错误:', error);
    }
  };

  // 显示添加查询的模态框
  const showAddQueryModal = () => {
    setIsModalVisible(true);
    setSelectedTable('应用');
    setSelectedFields([]);
    form.resetFields();
  };

  // 处理模态框确认
  const handleModalOk = () => {
    form.validateFields().then(values => {
      const { table, fields } = values;
      const newQuery = {
        id: Date.now(),
        table,
        fields,
        data: generateTableData(table),
        metrics: generateMockData()
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
      '应用': ['name', 'status', 'qps', 'errorRate', 'responseTime'],
      '网络': ['name', 'status', 'throughput', 'latency', 'connections'],
      '安全': ['name', 'status', 'blocked', 'alerts', 'lastScan']
    };
    return fieldsMap[tableType] || [];
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
                    message="指标查看模块提供对网络安全关键指标的实时监控与可视化呈现，助力管理员快速掌握系统安全态势。" 
                    type="info" 
                    showIcon 
                    style={{ marginBottom: 16 }}
                />
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <DashboardOutlined style={{ marginRight: 8, fontSize: 18 }} />
                    <span>指标查看</span>
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
                
                <Button 
                  icon={<CloseOutlined />} 
                  className="close-btn"
                >
                  关闭
                </Button>
              </Space>
            </div>
          </div>
        </div>

        {/* 主内容区域 */}
        <ProCard 
            className="metrics-content"
            style={{backgroundColor: "#DCDCDC", marginTop: "20px"}}
            direction="column"
        >
          {/* 数据表配置 */}
          <ProCard className="config-section" bordered={false}>
            <Row gutter={16} align="middle">
              <Col>
                <div className="config-item">
                  <Text className="config-label">数据表</Text>
                  <Select 
                    value={dataTable}
                    onChange={(value) => {
                      setDataTable(value);
                      const newData = generateTableData(value);
                      setTableData(newData);
                      setFilteredData(newData);
                      setPagination({
                        ...pagination,
                        total: newData.length
                      });
                    }}
                    className="config-select"
                  >
                    <Option value="应用">应用</Option>
                    <Option value="网络">网络</Option>
                    <Option value="安全">安全</Option>
                  </Select>
                </div>
              </Col>
            </Row>
          </ProCard>

          {/* 数据表格 */}
          <ProCard 
            className="data-table-section" 
            bordered={false} 
            collapsible={true}
            title={`${dataTable}数据`}
          >
            <Table 
              columns={tableColumns[dataTable]} 
              dataSource={filteredData}
              size="small"
              pagination={{
                ...pagination,
                showSizeChanger: false,
                pageSizeOptions: ['10'],
                showTotal: (total) => `共 ${total} 条`,
                position: ['bottomRight']
              }}
              bordered
              loading={loading}
              rowKey="id"
              onChange={handleTableChange}
            />
          </ProCard>

          {/* 图表区域 */}
          <ProCard 
            className="chart-section" 
            bordered={false}
            title="请求数据"
          >
            <div className="chart-container">
              <Line {...chartConfig} />
            </div>
          </ProCard>
        </ProCard>

        {/* 新增的查询区域 */}
        {queries.map((query) => (
          <ProCard 
            key={query.id}
            className="metrics-content"
            style={{backgroundColor: "#DCDCDC", marginTop: "20px"}}
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
              title={`自定义查询 - ${query.table}`}
              bordered={false}
              direction='column'
            >
              {/* 数据表格 */}
              <ProCard 
                className="data-table-section" 
                bordered={false} 
                collapsible={true}
                title={`${query.table}数据`}
              >
                <Table
                  columns={tableColumns[query.table].filter(col => query.fields.includes(col.key || col.dataIndex))} 
                  dataSource={query.data}
                  size="small"
                  pagination={{
                    pageSize: 10,
                    showSizeChanger: false,
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
                title="请求数据"
              >
                <div className="chart-container">
                  <Line {...{
                    ...chartConfig,
                    data: query.metrics,
                    color: '#13c2c2'
                  }} />
                </div>
              </ProCard>
            </ProCard>
          </ProCard>
        ))}

        {/* 添加查询的模态框 */}
        <Modal
          title="添加新查询"
          visible={isModalVisible}
          onOk={handleModalOk}
          onCancel={handleModalCancel}
          width={600}
        >
          <Form
            form={form}
            layout="vertical"
            initialValues={{
              table: '应用',
              fields: []
            }}
          >
            <Form.Item
              name="table"
              label="选择数据表"
              rules={[{ required: true, message: '请选择数据表' }]}
            >
              <Select onChange={(value) => setSelectedTable(value)}>
                <Option value="应用">应用</Option>
                <Option value="网络">网络</Option>
                <Option value="安全">安全</Option>
              </Select>
            </Form.Item>
            
            <Form.Item
              name="fields"
              label="选择关注的字段"
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
          </Form>
        </Modal>
      </div>
    </PageContainer>
  );
};

export default NetworkMetrics;