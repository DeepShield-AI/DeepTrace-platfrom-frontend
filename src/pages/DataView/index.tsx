import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BusinessStatsCard from '../../components/BusinessStatsCard';
import ContainerCard from '../../components/ContainerCard';
import { getAgentList } from '../../services/metrics/api';
// import type { Dayjs } from 'dayjs';
import {
  ApartmentOutlined,
  AppstoreOutlined,
  BarChartOutlined,
  CalendarOutlined,
  CloudServerOutlined,
  DashboardOutlined,
  DesktopOutlined,
  DownOutlined,
  LineChartOutlined,
  ReloadOutlined,
  SearchOutlined,
  SyncOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Button,
  Card,
  Col,
  DatePicker,
  Dropdown,
  Input,
  Menu,
  Row,
  Select,
  Skeleton,
  Space,
  Switch,
  Tag,
  Typography,
} from 'antd';

const { Title, Text } = Typography;
const { Meta } = Card;
const { RangePicker } = DatePicker;
const { Option } = Select;
const { Search } = Input;

// 业务数据mock
const businessData: Record<string, any> = {
  ecommerce: {
    id: 'ecommerce',
    name: '电商业务',
    description: '在线购物平台相关服务',
    owner: '电商事业部',
    priority: 'high',
    status: 'active',
    color: '#1890ff',
    icon: <DashboardOutlined />,
  },
  payment: {
    id: 'payment',
    name: '支付业务',
    description: '支付和交易处理服务',
    owner: '金融科技部',
    priority: 'critical',
    status: 'active',
    color: '#52c41a',
    icon: <BarChartOutlined />,
  },
  'user-center': {
    id: 'user-center',
    name: '用户中心',
    description: '用户管理和身份认证服务',
    owner: '平台技术部',
    priority: 'medium',
    status: 'active',
    color: '#fa8c16',
    icon: <TeamOutlined />,
  },
  'data-analytics': {
    id: 'data-analytics',
    name: '数据分析',
    description: '数据分析和报表服务',
    owner: '数据智能部',
    priority: 'medium',
    status: 'active',
    color: '#722ed1',
    icon: <LineChartOutlined />,
  },
  infrastructure: {
    id: 'infrastructure',
    name: '基础设施',
    description: '基础架构和平台服务',
    owner: '基础架构部',
    priority: 'critical',
    status: 'active',
    color: '#13c2c2',
    icon: <AppstoreOutlined />,
  },
};

const NetworkMetrics = () => {
  const navigate = useNavigate();
  const [machines, setMachines] = useState<any[]>([]);
  const [allContainers, setAllContainers] = useState<any[]>([]);
  const [filteredContainers, setFilteredContainers] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [dateRange, setDateRange] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [businessFilter, setBusinessFilter] = useState<string[]>([]); // 多选业务筛选
  const [searchText, setSearchText] = useState<string>('');
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(false);
  const [refreshInterval, setRefreshInterval] = useState<number>(30);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);
  const [nextRefreshTime, setNextRefreshTime] = useState<Date | null>(null);
  const [cardLoading, setCardLoading] = useState<Record<string, boolean>>({}); // 单个卡片加载状态
  const [showBusinessPanel, setShowBusinessPanel] = useState<boolean>(true); // 是否显示业务概览面板
  const [selectedBusinessDetail, setSelectedBusinessDetail] = useState<any | null>(null); // 选中的业务详情

  // 格式化数字为小数点后两位
  const formatNumber = (num: number | any): string => {
    if (typeof num !== 'number') return '0.00';
    return num.toFixed(2);
  };

  // 获取业务统计信息
  const getBusinessStats = () => {
    const stats: Record<string, any> = {};

    // 初始化所有业务
    Object.keys(businessData).forEach((businessId) => {
      stats[businessId] = {
        ...businessData[businessId],
        containerCount: 0,
        runningCount: 0,
        warningCount: 0,
        errorCount: 0,
        totalCpuUsage: 0,
        totalMemoryUsage: 0,
      };
    });

    // 统计容器数据
    allContainers.forEach((container: any) => {
      const businessId = container.business || 'infrastructure';
      if (stats[businessId]) {
        stats[businessId].containerCount += 1;

        if (container.status === 'running') {
          stats[businessId].runningCount += 1;
        }

        // 检查异常
        const anomalies = checkContainerAnomalies(container);
        if (anomalies.length > 0) {
          const hasError = anomalies.some((a) => a.level === 'error');
          if (hasError) {
            stats[businessId].errorCount += 1;
          } else {
            stats[businessId].warningCount += 1;
          }
        }

        stats[businessId].totalCpuUsage += container.cpuUsage;
        stats[businessId].totalMemoryUsage += container.memoryUsage;
      }
    });

    // 计算平均值
    Object.keys(stats).forEach((businessId) => {
      if (stats[businessId].containerCount > 0) {
        stats[businessId].avgCpuUsage =
          stats[businessId].totalCpuUsage / stats[businessId].containerCount;
        stats[businessId].avgMemoryUsage =
          stats[businessId].totalMemoryUsage / stats[businessId].containerCount;
      } else {
        stats[businessId].avgCpuUsage = 0;
        stats[businessId].avgMemoryUsage = 0;
      }
    });

    return stats;
  };

  // 容器数据
  const fetchMachines = async () => {
    setLoading(true);
    try {
      // 获取API数据
      const apiRes = await getAgentList();
      const containers = (apiRes?.content || []).map((item: any) => ({
        ...item,
        id: item.lcuuid,
        name: item.name,
        os: item.os,
        memorySize: item.memorySize,
        cpuNum: item.cpuNum,
        arch: item.arch,
        ip: item.curAnalyzerIp || item.ip || item.controllerIp || '-',
        time: item.createTime,
        state: item.state,
      }));
      console.log('Fetched containers:', containers);
      // 初始化卡片加载状态
      const loadingStates: Record<string, boolean> = {};
      containers.forEach((container: any) => {
        loadingStates[container.id] = true;
      });
      setCardLoading(loadingStates);
      setAllContainers(containers);
      setFilteredContainers(containers);
      setLoading(false);
      setLastRefreshTime(new Date());
      // 卡片逐个加载完成效果
      containers.forEach((container: any, index: number) => {
        setTimeout(() => {
          setCardLoading((prev) => ({
            ...prev,
            [container.id]: false,
          }));
        }, index * 200);
      });
      // 计算下一次刷新时间
      if (autoRefresh) {
        const nextTime = new Date();
        nextTime.setSeconds(nextTime.getSeconds() + refreshInterval);
        setNextRefreshTime(nextTime);
      }
    } catch (error) {
      console.error('Failed to fetch machines:', error);
      setLoading(false);
      setCardLoading({});
    }
  };

  // 手动刷新数据
  const handleManualRefresh = () => {
    fetchMachines();
  };

  useEffect(() => {
    // 初始加载数据
    fetchMachines();
  }, []);

  // 自动刷新效果
  useEffect(() => {
    let refreshTimer = null;

    if (autoRefresh) {
      refreshTimer = setInterval(() => {
        fetchMachines();
      }, refreshInterval * 1000);
    }

    return () => {
      if (refreshTimer) {
        clearInterval(refreshTimer);
      }
    };
  }, [autoRefresh, refreshInterval]);

  // 检查容器是否有异常
  const checkContainerAnomalies = (container: any) => {
    const anomalies = [];

    if (container.cpuUsage > 80) {
      anomalies.push({
        type: 'cpu',
        level: container.cpuUsage > 90 ? 'error' : 'warning',
        message: `CPU使用率过高: ${formatNumber(container.cpuUsage)}%`,
      });
    }

    if (container.memoryUsage > 85) {
      anomalies.push({
        type: 'memory',
        level: container.memoryUsage > 95 ? 'error' : 'warning',
        message: `内存使用率过高: ${formatNumber(container.memoryUsage)}%`,
      });
    }

    if (container.status !== 'running') {
      anomalies.push({
        type: 'status',
        level: 'warning',
        message: `容器状态: ${getStatusText(container.status)}`,
      });
    }

    return anomalies;
  };

  // 获取进度条颜色
  const getProgressColor = (usage: number, type?: string) => {
    if (usage > 90) return '#ff7875';
    if (usage > 80) return '#ffc53d';
    if (usage > 60) return '#69c0ff';
    return '#73d13d';
  };

  // 获取业务颜色
  const getBusinessColor = (businessId: string) => {
    return businessData[businessId]?.color || '#d9d9d9';
  };

  // 获取业务名称
  const getBusinessName = (businessId: string) => {
    return businessData[businessId]?.name || businessId;
  };

  // 获取业务优先级标签
  const getPriorityTag = (priority: string) => {
    const priorityConfig: Record<string, { color: string; text: string }> = {
      critical: { color: '#f5222d', text: '关键' },
      high: { color: '#fa8c16', text: '高' },
      medium: { color: '#52c41a', text: '中' },
      low: { color: '#1890ff', text: '低' },
    };

    const config = priorityConfig[priority] || { color: '#d9d9d9', text: '未知' };
    return (
      <Tag color={config.color} style={{ fontSize: '10px', padding: '0 4px' }}>
        {config.text}
      </Tag>
    );
  };

  // 容器过滤函数
  const applyFilters = () => {
    let filtered = [...allContainers];

    if (searchText) {
      const text = searchText.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          (item.name && item.name.toLowerCase().includes(text)) ||
          (item.os && item.os.toLowerCase().includes(text)) ||
          (item.ip && item.ip.toLowerCase().includes(text)),
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(
        (item) => (item.state || '').toLowerCase() === statusFilter.toLowerCase(),
      );
    }

    if (dateRange && dateRange.length === 2) {
      filtered = filtered.filter((item) => {
        const containerDate = new Date(item.createTime || item.time);
        const startDate = dateRange[0]?.startOf('day');
        const endDate = dateRange[1]?.endOf('day');
        if (!startDate || !endDate) return true;
        return containerDate >= startDate && containerDate <= endDate;
      });
    }

    setFilteredContainers(filtered);
  };

  useEffect(() => {
    applyFilters();
  }, [dateRange, statusFilter, businessFilter, searchText, allContainers]);

  const handleCardClick = (containerId: string, machineId: string, item?: any) => {
    const containerKey = `${machineId}-${containerId}`;

    // 设置当前卡片为加载状态
    setCardLoading((prev) => ({
      ...prev,
      [containerKey]: true,
    }));

    // 模拟导航延迟
    setTimeout(() => {
      navigate(`/Data/metricDetail?containerId=${containerId}&machineId=${machineId}`, {
        state: { agent_name: item?.name || item?.agent_name || undefined },
      });
    }, 500);
  };

  const handleResetFilters = () => {
    setSearchText('');
    setStatusFilter('all');
    setBusinessFilter([]);
    setDateRange([]);
  };

  const getStatusColor = (status: string) => {
    const statusColors: Record<string, string> = {
      running: '#73d13d',
      stopped: '#ff7875',
      paused: '#ffc53d',
      restarting: '#69c0ff',
      online: '#73d13d',
      offline: '#ff7875',
    };
    return statusColors[status] || '#d9d9d9';
  };

  const getStatusText = (status: string) => {
    const statusTexts: Record<string, string> = {
      running: '运行中',
      stopped: '已停止',
      paused: '已暂停',
      restarting: '重启中',
      online: '在线',
      offline: '离线',
    };
    return statusTexts[status] || status;
  };

  // 获取业务详情
  const getBusinessDetail = (businessId: string) => {
    const stats = getBusinessStats();
    return stats[businessId];
  };

  // 处理业务卡片点击
  const handleBusinessCardClick = (businessId: string) => {
    if (selectedBusinessDetail && selectedBusinessDetail.id === businessId) {
      setSelectedBusinessDetail(null);
      setBusinessFilter([]);
    } else {
      const detail = getBusinessDetail(businessId);
      setSelectedBusinessDetail(detail);
      setBusinessFilter([businessId]);
    }
  };

  // 统计异常容器数量
  const anomalyContainers = allContainers.filter((container) => {
    const anomalies = checkContainerAnomalies(container);
    return anomalies.length > 0;
  }).length;

  // 获取业务统计
  const businessStats = getBusinessStats();

  // 格式化时间显示
  const formatTime = (date?: Date | null) => {
    if (!date) return '';
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  // 计算距离下次刷新的时间
  const getTimeUntilNextRefresh = () => {
    if (!nextRefreshTime) return 0;
    const now = new Date().getTime();
    const next = nextRefreshTime.getTime();
    return Math.max(0, Math.ceil((next - now) / 1000));
  };

  // 骨架屏卡片组件
  const SkeletonCard = () => (
    <Card
      style={{
        minHeight: '520px',
        height: '100%',
        borderRadius: '8px',
        overflow: 'hidden',
      }}
      cover={
        <div
          style={{
            background: 'linear-gradient(135deg, #f0f8ff 0%, #e6f7ff 100%)',
            padding: '20px',
            textAlign: 'center',
            height: '100px',
          }}
        >
          <Skeleton.Avatar active size={48} style={{ display: 'block', margin: '0 auto' }} />
        </div>
      }
    >
      <Skeleton loading active paragraph={{ rows: 6 }} />
    </Card>
  );

  return (
    <div style={{ padding: '24px', background: '#fafafa', minHeight: '100vh' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '8px',
          }}
        >
          <div>
            <Title level={2} style={{ color: '#262626', marginBottom: 0 }}>
              <DesktopOutlined style={{ marginRight: 12, color: '#1890ff' }} />
              容器监控平台
            </Title>
            <Text type="secondary" style={{ fontSize: '14px' }}>
              实时监控容器状态和资源使用情况
            </Text>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Switch
                checkedChildren="业务视图"
                unCheckedChildren="列表视图"
                checked={showBusinessPanel}
                onChange={setShowBusinessPanel}
              />
              <SyncOutlined style={{ color: autoRefresh ? '#52c41a' : '#d9d9d9' }} />
              <Text>自动刷新</Text>
              <Switch checked={autoRefresh} onChange={setAutoRefresh} size="small" />
              {autoRefresh && (
                <Select
                  value={refreshInterval}
                  onChange={setRefreshInterval}
                  size="small"
                  style={{ width: 100 }}
                >
                  <Option value={10}>10秒</Option>
                  <Option value={30}>30秒</Option>
                  <Option value={60}>1分钟</Option>
                  <Option value={300}>5分钟</Option>
                </Select>
              )}
            </div>

            <Button
              type="primary"
              icon={<ReloadOutlined />}
              onClick={handleManualRefresh}
              loading={loading}
            >
              手动刷新
            </Button>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
            padding: '8px 12px',
            background: '#f0f8ff',
            borderRadius: '4px',
            fontSize: '12px',
            color: '#1890ff',
          }}
        >
          <div>{lastRefreshTime && <Text>最后更新: {formatTime(lastRefreshTime)}</Text>}</div>
          <div>
            {autoRefresh && nextRefreshTime && (
              <Text>
                下次更新: {formatTime(nextRefreshTime)} ({getTimeUntilNextRefresh()}秒后)
              </Text>
            )}
          </div>
        </div>

        {anomalyContainers > 0 && (
          <Alert
            message={`检测到 ${anomalyContainers} 个容器存在异常情况`}
            description="请及时检查相关容器的运行状态"
            type="warning"
            showIcon
            style={{ marginBottom: '16px', borderRadius: '8px' }}
            action={
              <Button size="small" type="text" onClick={() => setStatusFilter('all')}>
                查看所有容器
              </Button>
            }
          />
        )}

        {/* 业务概览面板 */}
        {showBusinessPanel && (
          <Card
            style={{
              marginBottom: '24px',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.09)',
            }}
            title={
              <Space>
                <ApartmentOutlined style={{ color: '#1890ff' }} />
                <Text strong>业务概览</Text>
                <Tag color="blue">{Object.keys(businessStats).length} 个业务</Tag>
              </Space>
            }
            extra={
              <Button type="text" size="small" onClick={() => setShowBusinessPanel(false)}>
                隐藏
              </Button>
            }
          >
            <Row gutter={[16, 16]}>
              {Object.keys(businessStats).map((businessId) => (
                <Col xs={24} sm={12} md={8} lg={4.8} key={businessId}>
                  <BusinessStatsCard
                    businessId={businessId}
                    stats={businessStats[businessId]}
                    isSelected={selectedBusinessDetail?.id === businessId}
                    onClick={handleBusinessCardClick}
                    formatNumber={formatNumber}
                    getProgressColor={getProgressColor}
                    getPriorityTag={getPriorityTag}
                  />
                </Col>
              ))}
            </Row>

            {selectedBusinessDetail && (
              <div
                style={{
                  marginTop: '16px',
                  padding: '12px',
                  background: '#f6ffed',
                  borderRadius: '6px',
                }}
              >
                <div
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <Space>
                    {(selectedBusinessDetail as any).icon}
                    <Text strong>{(selectedBusinessDetail as any).name} - 业务详情</Text>
                    {getPriorityTag((selectedBusinessDetail as any).priority)}
                    <Tag color={(selectedBusinessDetail as any).color}>
                      已选择 ({filteredContainers.length} 个容器)
                    </Tag>
                  </Space>
                  <Button
                    type="text"
                    size="small"
                    onClick={() => {
                      setSelectedBusinessDetail(null);
                      setBusinessFilter([]);
                    }}
                  >
                    清除筛选
                  </Button>
                </div>
                <div style={{ marginTop: '8px' }}>
                  <Text type="secondary">{selectedBusinessDetail.description}</Text>
                  <div style={{ marginTop: '8px' }}>
                    <Text>负责人: {selectedBusinessDetail.owner}</Text>
                    <div style={{ marginTop: '4px' }}>
                      <Space>
                        <Tag color="green">容器: {selectedBusinessDetail.containerCount}</Tag>
                        <Tag color="blue">运行中: {selectedBusinessDetail.runningCount}</Tag>
                        {selectedBusinessDetail.warningCount > 0 && (
                          <Tag color="warning">警告: {selectedBusinessDetail.warningCount}</Tag>
                        )}
                        {selectedBusinessDetail.errorCount > 0 && (
                          <Tag color="error">异常: {selectedBusinessDetail.errorCount}</Tag>
                        )}
                      </Space>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </Card>
        )}

        <Card
          style={{
            marginBottom: '24px',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.09)',
          }}
        >
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} sm={12} md={6}>
              <div>
                <Text strong style={{ fontSize: '14px' }}>
                  容器搜索:
                </Text>
                <Search
                  placeholder="搜索容器名称、镜像、机器或业务"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  style={{ marginTop: '8px' }}
                  allowClear
                  enterButton={<SearchOutlined />}
                  size="large"
                />
              </div>
            </Col>

            <Col xs={24} sm={12} md={6}>
              <div>
                <Text strong style={{ fontSize: '14px' }}>
                  时间范围:
                </Text>
                <RangePicker
                  style={{ marginTop: '8px', width: '100%' }}
                  placeholder={['开始日期', '结束日期']}
                  value={dateRange as any}
                  onChange={(dates: any) => setDateRange(dates ? [dates[0], dates[1]] : [])}
                  suffixIcon={<CalendarOutlined />}
                  size="large"
                />
              </div>
            </Col>

            <Col xs={24} sm={12} md={4}>
              <div>
                <Text strong style={{ fontSize: '14px' }}>
                  状态筛选:
                </Text>
                <Select
                  style={{ marginTop: '8px', width: '100%' }}
                  value={statusFilter}
                  onChange={setStatusFilter}
                  placeholder="选择状态"
                  size="large"
                >
                  <Option value="all">全部状态</Option>
                  <Option value="running">运行中</Option>
                  <Option value="stopped">已停止</Option>
                  <Option value="paused">已暂停</Option>
                  <Option value="restarting">重启中</Option>
                </Select>
              </div>
            </Col>

            <Col xs={24} sm={12} md={6}>
              <div>
                <Text strong style={{ fontSize: '14px' }}>
                  业务筛选:
                </Text>
                <Select
                  mode="multiple"
                  style={{ marginTop: '8px', width: '100%' }}
                  value={businessFilter}
                  onChange={setBusinessFilter}
                  placeholder="选择业务"
                  size="large"
                  allowClear
                  maxTagCount="responsive"
                >
                  {Object.keys(businessData).map((businessId) => (
                    <Option key={businessId} value={businessId}>
                      <Space>
                        {businessData[businessId].icon}
                        {businessData[businessId].name}
                      </Space>
                    </Option>
                  ))}
                </Select>
              </div>
            </Col>

            <Col xs={24} sm={12} md={2}>
              <Button
                type="default"
                icon={<ReloadOutlined />}
                onClick={handleResetFilters}
                style={{
                  marginTop: '30px',
                  width: '100%',
                  height: '40px',
                }}
                size="large"
              >
                重置
              </Button>
            </Col>
          </Row>

          <div
            style={{
              marginTop: '16px',
              padding: '12px 0',
              borderTop: '1px solid #f0f0f0',
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '8px',
            }}
          >
            <Text type="secondary" style={{ fontSize: '14px' }}>
              筛选结果:
            </Text>
            <Tag color="blue" style={{ fontSize: '13px', padding: '4px 8px' }}>
              共 {filteredContainers.length} 个容器
            </Tag>
            {searchText && (
              <Tag color="orange" style={{ fontSize: '13px', padding: '4px 8px' }}>
                搜索: {searchText}
              </Tag>
            )}
            {statusFilter !== 'all' && (
              <Tag
                color={getStatusColor(statusFilter)}
                style={{ fontSize: '13px', padding: '4px 8px' }}
              >
                状态: {getStatusText(statusFilter)}
              </Tag>
            )}
            {businessFilter.length > 0 && (
              <Dropdown
                overlay={
                  <Menu>
                    {businessFilter.map((businessId) => (
                      <Menu.Item key={businessId}>
                        <Space>
                          {businessData[businessId]?.icon}
                          {businessData[businessId]?.name}
                        </Space>
                      </Menu.Item>
                    ))}
                  </Menu>
                }
              >
                <Tag
                  color="purple"
                  style={{ fontSize: '13px', padding: '4px 8px', cursor: 'pointer' }}
                >
                  业务: {businessFilter.length} 个 <DownOutlined />
                </Tag>
              </Dropdown>
            )}
            {dateRange.length === 2 && (
              <Tag color="cyan" style={{ fontSize: '13px', padding: '4px 8px' }}>
                时间: {dateRange[0].format('YYYY-MM-DD')} 至 {dateRange[1].format('YYYY-MM-DD')}
              </Tag>
            )}
          </div>
        </Card>

        {!showBusinessPanel && (
          <div style={{ marginBottom: '16px', textAlign: 'right' }}>
            <Button
              type="dashed"
              icon={<ApartmentOutlined />}
              onClick={() => setShowBusinessPanel(true)}
            >
              显示业务概览
            </Button>
          </div>
        )}

        <style>
          {`
            .container-card-scrollbar::-webkit-scrollbar {
              width: 4px;
            }
            .container-card-scrollbar::-webkit-scrollbar-track {
              background: #f1f1f1;
              border-radius: 2px;
            }
            .container-card-scrollbar::-webkit-scrollbar-thumb {
              background: #c1c1c1;
              border-radius: 2px;
            }
            .container-card-scrollbar::-webkit-scrollbar-thumb:hover {
              background: #a8a8a8;
            }
          `}
        </style>

        {/* 容器列表 */}
        <Row gutter={[16, 16]}>
          {loading
            ? // 初始加载时显示骨架屏
              Array.from({ length: 8 }).map((_, index) => (
                <Col xs={24} sm={12} md={8} lg={6} key={index}>
                  <SkeletonCard />
                </Col>
              ))
            : filteredContainers.map((container) => {
                const anomalies = checkContainerAnomalies(container);
                const hasAnomalies = anomalies.length > 0;
                const containerKey = `${container.machineId}-${container.id}`;
                return (
                  <Col
                    xs={24}
                    sm={12}
                    md={8}
                    lg={6}
                    key={containerKey}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}
                  >
                    {/* 使用组件ContainerCard */}
                    <ContainerCard
                      container={container}
                      cardLoading={cardLoading}
                      hoveredCard={hoveredCard}
                      setHoveredCard={setHoveredCard}
                      handleCardClick={handleCardClick}
                      getProgressColor={getProgressColor}
                      formatNumber={formatNumber}
                      checkContainerAnomalies={checkContainerAnomalies}
                      getStatusText={getStatusText}
                      getStatusColor={getStatusColor}
                      businessData={businessData}
                    />
                  </Col>
                );
              })}
        </Row>

        {!loading && filteredContainers.length === 0 && (
          <Card
            style={{
              textAlign: 'center',
              marginTop: '20px',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.09)',
            }}
          >
            <CloudServerOutlined
              style={{ fontSize: '64px', color: '#d9d9d9', marginBottom: '16px' }}
            />
            <Title level={4} type="secondary" style={{ marginBottom: '8px' }}>
              暂无容器数据
            </Title>
            <Text type="secondary">当前没有符合条件的容器</Text>
            <br />
            <Button type="primary" onClick={handleResetFilters} style={{ marginTop: '16px' }}>
              清除筛选条件
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
};

export default NetworkMetrics;
