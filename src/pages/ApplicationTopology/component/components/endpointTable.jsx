import { DashboardOutlined } from '@ant-design/icons';
import { Card, Table, Tag, Typography } from 'antd';

const { Title } = Typography;

// 生成模拟数据
const generateMockData = () => {
  const endpoints = [
    '/api/users',
    '/api/orders',
    '/api/products',
    '/api/auth/login',
    '/api/payments',
    '/api/inventory',
    '/api/shipping',
    '/api/reports',
    '/api/notifications',
    '/api/settings',
  ];

  const signalSources = ['Mobile App', 'Web Client', 'Internal Service', 'Third-party API'];

  const appProtocols = ['HTTP/1.1', 'HTTP/2', 'gRPC', 'WebSocket'];

  const observationPoints = ['US-East-1', 'EU-Central-1', 'AP-Southeast-1', 'US-West-2'];

  const data = [];

  for (let i = 0; i < 25; i++) {
    const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
    const signalSource = signalSources[Math.floor(Math.random() * signalSources.length)];
    const appProtocol = appProtocols[Math.floor(Math.random() * appProtocols.length)];
    const observationPoint =
      observationPoints[Math.floor(Math.random() * observationPoints.length)];

    const requestRate = (Math.random() * 1000 + 50).toFixed(2);
    const avgLatency = (Math.random() * 300 + 10).toFixed(2);
    const p75Latency = (avgLatency * 1.3).toFixed(2);
    const p99Latency = (avgLatency * 1.8).toFixed(2);
    const serverErrorRate = (Math.random() * 5).toFixed(2);
    const clientErrorRate = (Math.random() * 3).toFixed(2);

    data.push({
      key: i,
      endpoint,
      signalSource,
      appProtocol,
      observationPoint,
      requestRate,
      avgLatency,
      p75Latency,
      p99Latency,
      serverErrorRate,
      clientErrorRate,
    });
  }

  return data;
};

const EndpointMonitoringTable = () => {
  const data = generateMockData();

  // 列定义
  const columns = [
    {
      title: '端点',
      dataIndex: 'endpoint',
      key: 'endpoint',
      sorter: (a, b) => a.endpoint.localeCompare(b.endpoint),
      render: (text) => <span style={{ fontFamily: 'monospace' }}>{text}</span>,
    },
    {
      title: '信号源',
      dataIndex: 'signalSource',
      key: 'signalSource',
      filters: [
        { text: 'Mobile App', value: 'Mobile App' },
        { text: 'Web Client', value: 'Web Client' },
        { text: 'Internal Service', value: 'Internal Service' },
        { text: 'Third-party API', value: 'Third-party API' },
      ],
      onFilter: (value, record) => record.signalSource === value,
    },
    {
      title: '应用协议',
      dataIndex: 'appProtocol',
      key: 'appProtocol',
      render: (protocol) => {
        let color = 'geekblue';
        if (protocol === 'HTTP/2') color = 'green';
        if (protocol === 'gRPC') color = 'purple';
        if (protocol === 'WebSocket') color = 'orange';
        return <Tag color={color}>{protocol}</Tag>;
      },
      filters: [
        { text: 'HTTP/1.1', value: 'HTTP/1.1' },
        { text: 'HTTP/2', value: 'HTTP/2' },
        { text: 'gRPC', value: 'gRPC' },
        { text: 'WebSocket', value: 'WebSocket' },
      ],
      onFilter: (value, record) => record.appProtocol === value,
    },
    {
      title: '观测点',
      dataIndex: 'observationPoint',
      key: 'observationPoint',
      filters: [
        { text: 'US-East-1', value: 'US-East-1' },
        { text: 'EU-Central-1', value: 'EU-Central-1' },
        { text: 'AP-Southeast-1', value: 'AP-Southeast-1' },
        { text: 'US-West-2', value: 'US-West-2' },
      ],
      onFilter: (value, record) => record.observationPoint === value,
    },
    {
      title: '请求速率 (req/s)',
      dataIndex: 'requestRate',
      key: 'requestRate',
      sorter: (a, b) => a.requestRate - b.requestRate,
      render: (value) => <span style={{ fontWeight: 'bold' }}>{value}</span>,
      defaultSortOrder: 'descend',
    },
    {
      title: '平均响应时延 (ms)',
      dataIndex: 'avgLatency',
      key: 'avgLatency',
      sorter: (a, b) => a.avgLatency - b.avgLatency,
      render: (value) => {
        const numValue = parseFloat(value);
        let color = '#52c41a'; // 绿色 - 良好
        if (numValue > 150) color = '#f5222d'; // 红色 - 差
        else if (numValue > 80) color = '#fa8c16'; // 橙色 - 一般

        return <span style={{ color, fontWeight: 'bold' }}>{value}</span>;
      },
    },
    {
      title: 'P75响应时延 (ms)',
      dataIndex: 'p75Latency',
      key: 'p75Latency',
      sorter: (a, b) => a.p75Latency - b.p75Latency,
    },
    {
      title: 'P99响应时延 (ms)',
      dataIndex: 'p99Latency',
      key: 'p99Latency',
      sorter: (a, b) => a.p99Latency - b.p99Latency,
    },
    {
      title: '服务端异常比例 (%)',
      dataIndex: 'serverErrorRate',
      key: 'serverErrorRate',
      sorter: (a, b) => a.serverErrorRate - b.serverErrorRate,
      render: (value) => {
        const numValue = parseFloat(value);
        let color = '#52c41a'; // 绿色 - 良好
        if (numValue > 3) color = '#f5222d'; // 红色 - 差
        else if (numValue > 1) color = '#fa8c16'; // 橙色 - 一般

        return <span style={{ color, fontWeight: 'bold' }}>{value}%</span>;
      },
    },
    {
      title: '客户端异常比例 (%)',
      dataIndex: 'clientErrorRate',
      key: 'clientErrorRate',
      sorter: (a, b) => a.clientErrorRate - b.clientErrorRate,
      render: (value) => {
        const numValue = parseFloat(value);
        let color = '#52c41a'; // 绿色 - 良好
        if (numValue > 2) color = '#f5222d'; // 红色 - 差
        else if (numValue > 0.5) color = '#fa8c16'; // 橙色 - 一般

        return <span style={{ color, fontWeight: 'bold' }}>{value}%</span>;
      },
    },
  ];

  return (
    <div style={{ padding: '24px', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      <Card>
        <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center' }}>
          <DashboardOutlined style={{ fontSize: '24px', color: '#1890ff', marginRight: '12px' }} />
          <Title level={2} style={{ margin: 0 }}>
            端点性能监控
          </Title>
        </div>

        <p style={{ color: '#666', marginBottom: '24px' }}>
          展示系统中各个端点的性能指标，包括请求速率、响应时延和错误率等关键指标。
        </p>

        <Table
          columns={columns}
          dataSource={data}
          pagination={{
            pageSize: 10,
            showSizeChanger: false,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
          }}
          scroll={{ x: 1500 }}
          bordered
        />
      </Card>
    </div>
  );
};

export default EndpointMonitoringTable;
