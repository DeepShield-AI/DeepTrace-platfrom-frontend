import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BusinessStatsCard from '../../components/BusinessStatsCard';
import ContainerCard from '../../components/ContainerCard';
import { getAgentList } from '../../services/metrics/api';
import './ui.less';
import type {
  BusinessLike,
  BusinessStatsLike,
  ContainerLike,
  DateRangeLike,
  GenericRecord,
} from '../../types/sharedTypes';
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
const { RangePicker } = DatePicker;
const { Option } = Select;
const { Search } = Input;

// 业务元数据（用于业务视图聚合与展示）
const businessData: Record<string, BusinessLike> = {
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

  // ===== 页面状态 =====
  const [allContainers, setAllContainers] = useState<ContainerLike[]>([]);
  const [filteredContainers, setFilteredContainers] = useState<ContainerLike[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [dateRange, setDateRange] = useState<DateRangeLike>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [businessFilter, setBusinessFilter] = useState<string[]>([]); // 业务多选筛选
  const [searchText, setSearchText] = useState<string>('');
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(false);
  const [refreshInterval, setRefreshInterval] = useState<number>(30);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);
  const [nextRefreshTime, setNextRefreshTime] = useState<Date | null>(null);
  const [cardLoading, setCardLoading] = useState<Record<string, boolean>>({}); // 卡片级 loading
  const [showBusinessPanel, setShowBusinessPanel] = useState<boolean>(true); // 业务视图开关
  const [selectedBusinessDetail, setSelectedBusinessDetail] =
    useState<BusinessStatsLike | null>(null); // 当前选中的业务

  // 统一数值格式化，避免 NaN/undefined 泄漏到 UI
  const formatNumber = (num: number | unknown): string => {
    if (typeof num !== 'number') return '0.00';
    return num.toFixed(2);
  };

  // 按业务维度聚合容器统计（数量、异常、平均 CPU/内存）
  const getBusinessStats = () => {
    const stats: Record<string, BusinessStatsLike> = {};

    // 先构建基础桶位，确保无容器业务也可展示
    Object.keys(businessData).forEach((businessId) => {
      stats[businessId] = {
        ...businessData[businessId],
        containerCount: 0,
        runningCount: 0,
        warningCount: 0,
        errorCount: 0,
        totalCpuUsage: 0,
        totalMemoryUsage: 0,
        avgCpuUsage: 0,
        avgMemoryUsage: 0,
      };
    });

    // 累积容器指标
    allContainers.forEach((container: ContainerLike) => {
      const businessId = container.business || 'infrastructure';
      if (stats[businessId]) {
        stats[businessId].containerCount += 1;

        if (container.status === 'running') {
          stats[businessId].runningCount += 1;
        }

        // 异常容器记入 warning/error
        const anomalies = checkContainerAnomalies(container);
        if (anomalies.length > 0) {
          const hasError = anomalies.some((anomaly: GenericRecord) => anomaly.level === 'error');
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

    // 计算均值
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

  // 拉取容器列表并同步卡片 loading 状态
  const fetchMachines = async () => {
    setLoading(true);
    try {
      // 拉取并归一化后端字段
      const apiRes = await getAgentList();
      const containers = (apiRes?.content || []).map((item: GenericRecord) => ({
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
      // 初始化卡片 loading（key 与 ContainerCard 保持一致）
      const loadingStates: Record<string, boolean> = {};
      containers.forEach((container: ContainerLike) => {
        const key = `${container.machineId}-${container.id}`;
        loadingStates[key] = true;
      });
      setCardLoading(loadingStates);
      setAllContainers(containers);
      setFilteredContainers(containers);
      setLoading(false);
      setLastRefreshTime(new Date());
      // 逐卡片收敛 loading，形成分批渲染观感
      containers.forEach((container: ContainerLike, index: number) => {
        const key = `${container.machineId}-${container.id}`;
        setTimeout(() => {
          setCardLoading((prev) => ({
            ...prev,
            [key]: false,
          }));
        }, index * 200);
      });
      // 记录下次自动刷新时间
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

  // 手动刷新入口
  const handleManualRefresh = () => {
    fetchMachines();
  };

  // 首屏加载
  useEffect(() => {
    fetchMachines();
  }, []);

  // 自动刷新轮询
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

  // ===== 告警与状态映射 =====
  // 统一异常判定：CPU、内存、运行状态
  const checkContainerAnomalies = (container: ContainerLike) => {
    const anomalies: GenericRecord[] = [];

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

  // 资源使用率颜色分级
  const getProgressColor = (usage: number, type?: string) => {
    if (usage > 90) return '#ff7875';
    if (usage > 80) return '#ffc53d';
    if (usage > 60) return '#69c0ff';
    return '#73d13d';
  };

  // 业务色值映射
  const getBusinessColor = (businessId: string) => {
    return businessData[businessId]?.color || '#d9d9d9';
  };

  // 业务名称映射
  const getBusinessName = (businessId: string) => {
    return businessData[businessId]?.name || businessId;
  };

  // 优先级标签渲染
  const getPriorityTag = (priority: string) => {
    const priorityConfig: Record<string, { color: string; text: string }> = {
      critical: { color: '#f5222d', text: '关键' },
      high: { color: '#fa8c16', text: '高' },
      medium: { color: '#52c41a', text: '中' },
      low: { color: '#1890ff', text: '低' },
    };

    const config = priorityConfig[priority] || { color: '#d9d9d9', text: '未知' };
    return (
      <Tag color={config.color} className="data-view-priority-tag">
        {config.text}
      </Tag>
    );
  };

  // ===== 筛选 =====
  // 根据搜索词/状态/日期计算过滤结果
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

  // ===== 交互 =====
  const handleCardClick = (containerId: string, machineId: string, item?: ContainerLike) => {
    const containerKey = `${machineId}-${containerId}`;

    // 点击后先置为 loading，再执行导航
    setCardLoading((prev) => ({
      ...prev,
      [containerKey]: true,
    }));

    // 轻微延迟用于展示加载反馈
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

  // 仅在容器集合变化时重算聚合，避免重复计算
  const businessStats = useMemo(() => getBusinessStats(), [allContainers]);

  // 业务卡片选中/反选
  const handleBusinessCardClick = (businessId: string) => {
    if (selectedBusinessDetail && selectedBusinessDetail.id === businessId) {
      setSelectedBusinessDetail(null);
      setBusinessFilter([]);
    } else {
      const detail = businessStats[businessId];
      setSelectedBusinessDetail(detail);
      setBusinessFilter([businessId]);
    }
  };

  // ===== 派生数据 =====
  // 顶部告警数量
  const anomalyContainers = allContainers.filter((container) => {
    const anomalies = checkContainerAnomalies(container);
    return anomalies.length > 0;
  }).length;

  // 时间文本格式化
  const formatTime = (date?: Date | null) => {
    if (!date) return '';
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  // 距离下次刷新剩余秒数
  const getTimeUntilNextRefresh = () => {
    if (!nextRefreshTime) return 0;
    const now = new Date().getTime();
    const next = nextRefreshTime.getTime();
    return Math.max(0, Math.ceil((next - now) / 1000));
  };

  const SkeletonCard = () => (
    <Card
      className="data-view-skeleton-card"
      cover={
        <div className="data-view-skeleton-cover">
          <Skeleton.Avatar active size={48} className="data-view-skeleton-avatar" />
        </div>
      }
    >
      <Skeleton loading active paragraph={{ rows: 6 }} />
    </Card>
  );

  return (
    <div className="data-view-page">
      <div className="data-view-content">
        <div className="data-view-header-row">
          <div>
            <Title level={2} className="data-view-title">
              <DesktopOutlined className="data-view-title-icon" />
              容器监控平台
            </Title>
            <Text type="secondary" className="data-view-subtitle">
              实时监控容器状态和资源使用情况
            </Text>
          </div>

          <div className="data-view-header-actions">
            <div className="data-view-header-switch">
              <Switch
                checkedChildren="业务视图"
                unCheckedChildren="列表视图"
                checked={showBusinessPanel}
                onChange={setShowBusinessPanel}
              />
              <SyncOutlined className={`data-view-sync-icon ${autoRefresh ? 'active' : 'inactive'}`} />
              <Text>自动刷新</Text>
              <Switch checked={autoRefresh} onChange={setAutoRefresh} size="small" />
              {autoRefresh && (
                <Select
                  value={refreshInterval}
                  onChange={setRefreshInterval}
                  size="small"
                  className="data-view-refresh-interval"
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

        <div className="data-view-refresh-info">
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
            className="data-view-anomaly-alert"
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
            className="data-view-panel-card"
            title={
              <Space>
                <ApartmentOutlined className="data-view-panel-icon" />
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
              <div className="data-view-business-detail">
                <div className="data-view-business-detail-header">
                  <Space>
                    {selectedBusinessDetail.icon}
                    <Text strong>{selectedBusinessDetail.name} - 业务详情</Text>
                    {getPriorityTag(selectedBusinessDetail.priority)}
                    <Tag color={selectedBusinessDetail.color}>
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
                <div className="data-view-mt-8">
                  <Text type="secondary">{selectedBusinessDetail.description}</Text>
                  <div className="data-view-mt-8">
                    <Text>负责人: {selectedBusinessDetail.owner}</Text>
                    <div className="data-view-mt-4">
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

        <Card className="data-view-panel-card">
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} sm={12} md={6}>
              <div>
                <Text strong className="data-view-form-label">
                  容器搜索:
                </Text>
                <Search
                  placeholder="搜索容器名称、镜像、机器或业务"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="data-view-form-control"
                  allowClear
                  enterButton={<SearchOutlined />}
                  size="large"
                />
              </div>
            </Col>

            <Col xs={24} sm={12} md={6}>
              <div>
                <Text strong className="data-view-form-label">
                  时间范围:
                </Text>
                <RangePicker
                  className="data-view-form-control"
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
                <Text strong className="data-view-form-label">
                  状态筛选:
                </Text>
                <Select
                  className="data-view-form-control"
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
                <Text strong className="data-view-form-label">
                  业务筛选:
                </Text>
                <Select
                  mode="multiple"
                  className="data-view-form-control"
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
                className="data-view-reset-btn"
                size="large"
              >
                重置
              </Button>
            </Col>
          </Row>

          <div className="data-view-filter-result">
            <Text type="secondary" className="data-view-filter-result-text">
              筛选结果:
            </Text>
            <Tag color="blue" className="data-view-filter-result-tag">
              共 {filteredContainers.length} 个容器
            </Tag>
            {searchText && (
              <Tag color="orange" className="data-view-filter-result-tag">
                搜索: {searchText}
              </Tag>
            )}
            {statusFilter !== 'all' && (
              <Tag color={getStatusColor(statusFilter)} className="data-view-filter-result-tag">
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
                <Tag color="purple" className="data-view-filter-result-tag data-view-filter-dropdown-tag">
                  业务: {businessFilter.length} 个 <DownOutlined />
                </Tag>
              </Dropdown>
            )}
            {dateRange.length === 2 && (
              <Tag color="cyan" className="data-view-filter-result-tag">
                时间: {dateRange[0].format('YYYY-MM-DD')} 至 {dateRange[1].format('YYYY-MM-DD')}
              </Tag>
            )}
          </div>
        </Card>

        {!showBusinessPanel && (
          <div className="data-view-business-toggle-wrap">
            <Button
              type="dashed"
              icon={<ApartmentOutlined />}
              onClick={() => setShowBusinessPanel(true)}
            >
              显示业务概览
            </Button>
          </div>
        )}

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
                const containerKey = `${container.machineId}-${container.id}`;
                return (
                  <Col
                    xs={24}
                    sm={12}
                    md={8}
                    lg={6}
                    key={containerKey}
                    className="data-view-list-col"
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
                      loadingSkeletonRows={8}
                    />
                  </Col>
                );
              })}
        </Row>

        {!loading && filteredContainers.length === 0 && (
          <Card className="data-view-empty-card">
            <CloudServerOutlined className="data-view-empty-icon" />
            <Title level={4} type="secondary" className="data-view-empty-title">
              暂无容器数据
            </Title>
            <Text type="secondary">当前没有符合条件的容器</Text>
            <br />
            <Button type="primary" onClick={handleResetFilters} className="data-view-empty-btn">
              清除筛选条件
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
};

export default NetworkMetrics;
