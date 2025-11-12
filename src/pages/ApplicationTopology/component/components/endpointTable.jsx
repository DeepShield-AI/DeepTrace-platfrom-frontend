import { DashboardOutlined } from '@ant-design/icons';
import { Card, Table, Tag, Typography } from 'antd';

const { Title } = Typography;

const EndpointMonitoringTable = ({ data = [] }) => {
  // 如果没有传入数据，使用空数组
  const tableData = data.map((item, index) => ({
    key: index,
    ...item
  }));

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
      title: '协议',
      dataIndex: 'protocol',
      key: 'protocol',
      render: (protocol) => {
        let color = 'geekblue';
        if (protocol === 'HTTP') color = 'green';
        if (protocol === 'gRPC') color = 'purple';
        if (protocol === 'Thrift') color = 'orange';
        if (protocol === 'WebSocket') color = 'cyan';
        return <Tag color={color}>{protocol}</Tag>;
      },
      filters: [
        { text: 'HTTP', value: 'HTTP' },
        { text: 'gRPC', value: 'gRPC' },
        { text: 'Thrift', value: 'Thrift' },
        { text: 'WebSocket', value: 'WebSocket' },
      ],
      onFilter: (value, record) => record.protocol === value,
    },
    {
      title: '总请求数',
      dataIndex: 'totalCount',
      key: 'totalCount',
      sorter: (a, b) => a.totalCount - b.totalCount,
      render: (value) => <span style={{ fontWeight: 'bold' }}>{value.toLocaleString()}</span>,
      defaultSortOrder: 'descend',
    },
    {
      title: 'QPS',
      dataIndex: 'qps',
      key: 'qps',
      sorter: (a, b) => a.qps - b.qps,
      render: (value) => <span style={{ fontWeight: 'bold' }}>{value.toFixed(2)}</span>,
    },
    {
      title: '平均响应时延 (ms)',
      dataIndex: 'avgDuration',
      key: 'avgDuration',
      sorter: (a, b) => a.avgDuration - b.avgDuration,
      render: (value) => {
        const numValue = parseFloat(value);
        let color = '#52c41a'; // 绿色 - 良好
        if (numValue > 200000) color = '#f5222d'; // 红色 - 差
        else if (numValue > 100000) color = '#fa8c16'; // 橙色 - 一般

        return <span style={{ color, fontWeight: 'bold' }}>{value.toFixed(2)}</span>;
      },
    },
    {
      title: 'P75响应时延 (ms)',
      dataIndex: 'p75Duration',
      key: 'p75Duration',
      sorter: (a, b) => parseFloat(a.p75Duration) - parseFloat(b.p75Duration),
      render: (value) => parseFloat(value).toFixed(2),
    },
    {
      title: 'P99响应时延 (ms)',
      dataIndex: 'p99Duration',
      key: 'p99Duration',
      sorter: (a, b) => parseFloat(a.p99Duration) - parseFloat(b.p99Duration),
      render: (value) => parseFloat(value).toFixed(2),
    },
    {
      title: '错误数',
      dataIndex: 'errorCount',
      key: 'errorCount',
      sorter: (a, b) => a.errorCount - b.errorCount,
      render: (value) => <span style={{ fontWeight: 'bold' }}>{value.toLocaleString()}</span>,
    },
    {
      title: '错误率 (%)',
      dataIndex: 'errorRate',
      key: 'errorRate',
      sorter: (a, b) => a.errorRate - b.errorRate,
      render: (value) => {
        const numValue = parseFloat(value) * 100; // 转换为百分比
        let color = '#52c41a'; // 绿色 - 良好
        if (numValue > 5) color = '#f5222d'; // 红色 - 差
        else if (numValue > 1) color = '#fa8c16'; // 橙色 - 一般

        return <span style={{ color, fontWeight: 'bold' }}>{numValue.toFixed(2)}%</span>;
      },
    },
    {
      title: '最早请求时间',
      dataIndex: 'minTime',
      key: 'minTime',
      render: (value) => {
        // 如果是时间戳，转换为可读格式
        const timestamp = parseInt(value);
        if (!isNaN(timestamp)) {
          return new Date(timestamp).toLocaleString();
        }
        return value;
      },
    },
    {
      title: '最晚请求时间',
      dataIndex: 'maxTime',
      key: 'maxTime',
      render: (value) => {
        // 如果是时间戳，转换为可读格式
        const timestamp = parseInt(value);
        if (!isNaN(timestamp)) {
          return new Date(timestamp).toLocaleString();
        }
        return value;
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
          展示系统中各个端点的性能指标，包括请求量、响应时延和错误率等关键指标。
          当前显示 {data.length} 个端点。
        </p>

        <Table
          columns={columns}
          dataSource={tableData}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
            pageSizeOptions: ['10', '20', '50', '100'],
          }}
          scroll={{ x: 1800 }}
          bordered
        />
      </Card>
    </div>
  );
};

export default EndpointMonitoringTable;