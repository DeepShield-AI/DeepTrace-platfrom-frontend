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
  Row,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { getChart, getMetricTags } from '../../services/metrics/api';
import type {
  ChartConfigLike,
  GenericRecord,
  MetricPoint,
  MetricTagsMap,
  RouteStateLike,
} from '../../types/sharedTypes';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;

const PAGE_TITLE_ROW_STYLE = { display: 'flex', alignItems: 'center', marginBottom: 8 } as const;
const CONTROL_ROW_STYLE = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
} as const;
const FILTER_TAGS_WRAP_STYLE = { display: 'flex', gap: 8, flexWrap: 'wrap' } as const;
const CONTROL_CARD_BODY_STYLE = { padding: '16px 24px' } as const;

// ==================== 工具函数 ====================
// 格式化 x 轴标签（支持绝对毫秒、秒级、以及相对于基准 min 的偏移）
const formatXAxisValue = (v: any, baseMinMs?: number, usesTimestampValue?: boolean) => {
  if (v === null || v === undefined || v === '') return '';
  const rawNum = Number(v);
  if (!Number.isNaN(rawNum)) {
    let absMs = rawNum;
    if (usesTimestampValue) {
      if (rawNum > 0 && rawNum < 1e11 && typeof baseMinMs === 'number') {
        absMs = baseMinMs + rawNum;
      } else if (rawNum > 1e9 && rawNum < 1e12) {
        absMs = Math.floor(rawNum * 1000);
      } else if (rawNum >= 1e12) {
        absMs = rawNum;
      }
      return dayjs(absMs).format('HH:mm:ss');
    }
    return dayjs(rawNum).format('YYYY-MM-DD HH:mm:ss');
  }
  const parsed = Date.parse(String(v));
  if (!Number.isNaN(parsed)) {
    return usesTimestampValue
      ? dayjs(parsed).format('HH:mm:ss')
      : dayjs(parsed).format('YYYY-MM-DD HH:mm:ss');
  }
  return String(v);
};

const MetricsDetail = () => {
  // ==================== 页面状态 ====================
  const [timeRange, setTimeRange] = useState('15分钟');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>(['all']);
  const [metricsData, setMetricsData] = useState<MetricPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [metricTagKeys, setMetricTagKeys] = useState<string[]>([]);
  const [metricTagsObj, setMetricTagsObj] = useState<MetricTagsMap | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [currentChart, setCurrentChart] = useState<ChartConfigLike | null>(null);
  const [logData, setLogData] = useState<GenericRecord[]>([]);
  const [agentName, setAgentName] = useState<string | null>(null);
  const location = useLocation();

  // ==================== 标签与筛选展示 ====================
  // 图表标签配置（当前由后端命名空间驱动）
  const chartTags: Array<{ key: string; label: string; color: string; icon: React.ReactNode }> =
    [];

  // 将 API 返回的命名空间作为筛选标签来源
  const allowedNamespaces = metricTagKeys.filter((k) => k !== 'all');
  const displayTags = allowedNamespaces
    .filter((k) => metricTagKeys.length === 0 || metricTagKeys.includes(k))
    .map((k) => {
      const found = chartTags.find((t) => t.key === k);
      return (
        found || {
          key: k,
          label: k,
          color: '#d9d9d9',
          icon: <DashboardOutlined />,
        }
      );
    });

  // 从路由 state 读取 agent_name（优先），回退到 URL 查询参数
  useEffect(() => {
    try {
      const routeState = (location?.state || {}) as RouteStateLike;
      const stateAgent = routeState.agent_name || routeState.agent;
      if (stateAgent) {
        setAgentName(stateAgent);
        return;
      }
      const qs = new URLSearchParams(window.location.search);
      const queryAgentName = qs.get('agent_name') || qs.get('agent');
      if (queryAgentName) setAgentName(queryAgentName);
    } catch (e) {
      // 容错：解析路由参数失败时不影响页面渲染
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location]);

  // ==================== 图表元数据配置 ====================
  // 图表数据配置（含阈值、单位、展示图标）
  const chartConfigs = [
    // CPU 三个独立指标
    {
      id: 1,
      title: 'CPU - user_usage',
      value: '45.2%',
      trend: 'up',
      change: '+2.1%',
      tag: 'cpu',
      type: 'area',
      dataKey: 'user_usage',
      color: '#ff4d4f',
      icon: <MonitorOutlined />,
      threshold: 80,
      thresholdColor: '#ff7875',
      unit: '%',
    },
    {
      id: 2,
      title: 'CPU - system_usage',
      value: '30.1%',
      trend: 'stable',
      change: '+0.3%',
      tag: 'cpu',
      type: 'area',
      dataKey: 'system_usage',
      color: '#fa8c16',
      icon: <MonitorOutlined />,
      threshold: 85,
      thresholdColor: '#ff7875',
      unit: '%',
    },
    {
      id: 3,
      title: 'CPU - nice_usage',
      value: '5.6%',
      trend: 'down',
      change: '-0.2%',
      tag: 'cpu',
      type: 'area',
      dataKey: 'nice_usage',
      color: '#722ed1',
      icon: <MonitorOutlined />,
      threshold: 50,
      thresholdColor: '#ff7875',
      unit: '%',
    },

    // Network 四个独立指标
    {
      id: 5,
      title: 'Network - tx_bytes',
      value: '2.4 Gbps',
      trend: 'up',
      change: '+0.3G',
      tag: 'network',
      type: 'line',
      dataKey: 'tx_bytes',
      color: '#1890ff',
      icon: <WifiOutlined />,
      threshold: 2.8,
      thresholdColor: '#ff7875',
      unit: 'Gbps',
    },
    {
      id: 6,
      title: 'Network - tx_carrier',
      value: '0.02',
      trend: 'stable',
      change: '+0.00',
      tag: 'network',
      type: 'line',
      dataKey: 'tx_carrier',
      color: '#13c2c2',
      icon: <WifiOutlined />,
      threshold: 10,
      thresholdColor: '#ff7875',
      unit: '',
    },
    {
      id: 7,
      title: 'Network - rx_packets',
      value: '1200',
      trend: 'up',
      change: '+50',
      tag: 'network',
      type: 'column',
      dataKey: 'rx_packets',
      color: '#2f54eb',
      icon: <WifiOutlined />,
      threshold: 2000,
      thresholdColor: '#ff7875',
      unit: '',
    },
    {
      id: 8,
      title: 'Network - rx_errors',
      value: '2',
      trend: 'stable',
      change: '0',
      tag: 'network',
      type: 'column',
      dataKey: 'rx_errors',
      color: '#fa541c',
      icon: <WifiOutlined />,
      threshold: 10,
      thresholdColor: '#ff7875',
      unit: '',
    },
    {
      id: 9,
      title: 'Network - rx_dropped',
      value: '3',
      trend: 'stable',
      change: '0',
      tag: 'network',
      type: 'column',
      dataKey: 'rx_dropped',
      color: '#ff7a45',
      icon: <WifiOutlined />,
      threshold: 20,
      thresholdColor: '#ff7875',
      unit: '',
    },

    // Disk 四个独立指标
    {
      id: 10,
      title: 'Disk - read_merged',
      value: '150',
      trend: 'stable',
      change: '0',
      tag: 'disk',
      type: 'column',
      dataKey: 'read_merged',
      color: '#722ed1',
      icon: <HddOutlined />,
      threshold: 500,
      thresholdColor: '#ff7875',
      unit: '',
    },
    {
      id: 11,
      title: 'Disk - ios_in_progress',
      value: '8',
      trend: 'up',
      change: '+1',
      tag: 'disk',
      type: 'column',
      dataKey: 'ios_in_progress',
      color: '#9254de',
      icon: <HddOutlined />,
      threshold: 50,
      thresholdColor: '#ff7875',
      unit: '',
    },
    {
      id: 12,
      title: 'Disk - read_completed',
      value: '320',
      trend: 'up',
      change: '+10',
      tag: 'disk',
      type: 'column',
      dataKey: 'read_completed',
      color: '#722ed1',
      icon: <HddOutlined />,
      threshold: 1000,
      thresholdColor: '#ff7875',
      unit: '',
    },
  ];

  // ==================== 交互处理函数 ====================
  // 打开抽屉查看日志表格
  const handleViewLogs = (chart: ChartConfigLike) => {
    setCurrentChart(chart);
    // 暂不生成 mock 日志，保留空数据或由后端拉取真实日志
    setLogData([]);
    setDrawerVisible(true);
  };

  // 关闭抽屉
  const handleCloseDrawer = () => {
    setDrawerVisible(false);
    setCurrentChart(null);
    setLogData([]);
  };

  // 检查是否超过阈值（可传入自定义数据源）
  const checkThresholdExceeded = (chart: ChartConfigLike, dataSource?: MetricPoint[]) => {
    const source = dataSource || metricsData;
    if (!chart.threshold && chart.threshold !== 0) return false;
    if (!source || !source.length) return false;

    return source.some((data: MetricPoint) => {
      const value = data[chart.dataKey];
      if (chart.reverseThreshold) {
        return value < chart.threshold; // 反向阈值：低于阈值才警告
      }
      return value > chart.threshold; // 正向阈值：高于阈值警告
    });
  };

  // ==================== 图表配置构建 ====================
  // 获取图表配置（按图表类型、阈值状态、时间轴格式动态拼装）
  const getChartConfig = (chart: ChartConfigLike, overrideData?: MetricPoint[]) => {
    const dataSource = overrideData || metricsData;
    // normalize dataSource to array - AntV plots expect an array
    const finalData = Array.isArray(dataSource)
      ? dataSource
      : dataSource && Array.isArray((dataSource as GenericRecord).data)
      ? (dataSource as GenericRecord).data
      : [];
    const exceedsThreshold = checkThresholdExceeded(chart, finalData);
    // 预留：如需切换多序列，可从 metricTagsObj 解析 seriesField
    const seriesField = (() => {
      try {
        if (!metricTagsObj) return undefined;
        const namespaceTagMap = metricTagsObj[chart.tag];
        if (!namespaceTagMap) return undefined;
        const namespaceTagKeys = Object.keys(namespaceTagMap || {});
        if (namespaceTagKeys.length === 0) return undefined;
        // 对 cpu 命名空间使用 'cpu' 参数名兼容后端
        return chart.tag === 'cpu' ? 'cpu' : namespaceTagKeys[0];
      } catch (e) {
        return undefined;
      }
    })();
    // 当前保持单序列渲染，暂不启用 seriesField
    void seriesField;

    // 优先检测后端原始 timestamp/value 字段
    const usesTimestampValue =
      Array.isArray(finalData) &&
      finalData.length > 0 &&
      'timestamp' in finalData[0] &&
      'value' in finalData[0];

    const baseConfig: GenericRecord = {
      data: finalData,
      // 当后端返回原始 timestamp/value 时，使用数字毫秒字段 `timestamp` 作为 x 轴，
      // 能避免库内对日期字符串/Date 对象的二次转换导致的时区/格式问题。
      xField: usesTimestampValue ? 'timestamp' : 'time',
      yField: usesTimestampValue ? 'value' : chart.dataKey,
      // 不使用 seriesField，强制单序列渲染以保持所有图表样式一致
      height: 120,
      autoFit: true,
      // 平滑曲线（非 timestamp/raw 数据）以获得更柔和视觉
      smooth: usesTimestampValue ? false : true,
      loading: loading,
      xAxis: {
        type: 'time',
        tickCount: 3,
        mask: usesTimestampValue ? 'HH:mm:ss' : 'HH:mm',
        label: {
          autoHide: true,
          autoRotate: false,
          formatter: (v: any) => {
            const xAxisCfg = (baseConfig && (baseConfig.xAxis as GenericRecord)) || {};
            const baseMinMs = xAxisCfg._minMs;
            return formatXAxisValue(v, baseMinMs, usesTimestampValue);
          },
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
        showMarkers: true,
        shared: true,
        showCrosshairs: true,
        formatter: (datum: any) => {
          // 支持聚合点（含 min/max/count）和普通点
          if (!datum) return { name: chart.title, value: '-' };
          const hasRange = typeof datum.min === 'number' && typeof datum.max === 'number' && datum.count;
          if (hasRange) {
            const avg = Number(datum.value || 0);
            const min = Number(datum.min);
            const max = Number(datum.max);
            const cnt = Number(datum.count || 0);
            const unitFmt = (n: number) =>
              chart.unit === 'Gbps'
                ? `${n.toFixed(1)} Gbps`
                : chart.unit === '°C'
                ? `${n.toFixed(0)}°C`
                : `${n}`;
            return { name: chart.title, value: `${unitFmt(avg)} (min ${unitFmt(min)}, max ${unitFmt(max)}, n=${cnt})` };
          }
          const rawValue = usesTimestampValue ? datum.value : datum[chart.dataKey];
          const num = typeof rawValue === 'number' ? rawValue : Number(rawValue || 0);
          const formatted = usesTimestampValue
            ? chart.unit === 'Gbps'
              ? `${num.toFixed(1)} Gbps`
              : chart.unit === '°C'
              ? `${num.toFixed(0)}°C`
              : `${num}`
            : chart.dataKey === 'network'
            ? `${num.toFixed(1)} Gbps`
            : chart.dataKey === 'iops'
            ? `${num.toFixed(0)}K`
            : chart.dataKey === 'connections'
            ? `${Math.round(num)}`
            : chart.dataKey === 'temperature'
            ? `${num.toFixed(0)}°C`
            : `${num.toFixed(1)}%`;
          return { name: chart.title, value: formatted };
        },
      },
      // 点的默认大小（非侵入式），在 timestamp/raw 场景略大一些以便可见
      point: { size: usesTimestampValue ? 4 : 3 },
      // 添加阈值线（类型断言为 any 避免类型不兼容）
      annotations: (chart.threshold
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
                  fontWeight: 'bold' as 'bold',
                  textAlign: 'end' as 'end',
                },
              },
            },
          ]
        : []) as GenericRecord,
    };

    // 根据是否超过阈值调整颜色强度
    const chartColor = exceedsThreshold ? chart.thresholdColor : chart.color;

    // 如果使用后端 timestamp/value，需要计算 x 轴域并保证单点可见（添加左右 padding）
    if (Array.isArray(finalData) && finalData.length > 0 && 'timestamp' in finalData[0]) {
      try {
        const tsList = finalData.map((d: MetricPoint) => Number(d.timestamp || d.time || 0)).filter(Boolean);
        if (tsList.length > 0) {
          const minTs = Math.min(...tsList);
          const maxTs = Math.max(...tsList);
          // 使用数据的精确起止时间作为 x 轴范围，保持从开始时间到结束时间可见。
          // 对于单点情况，提供 1 秒的最小可视范围以避免折线图完全塌缩。
          const axisMinMs = minTs === maxTs ? minTs - 1000 : minTs;
          const axisMaxMs = minTs === maxTs ? maxTs + 1000 : maxTs;
          // 将 min/max 设置到 xAxis，针对 usesTimestampValue 使用数字毫秒，避免 Date 对象导致的刻度单位变化
          if (!baseConfig.xAxis) baseConfig.xAxis = {};
          if (usesTimestampValue) {
            baseConfig.xAxis.min = axisMinMs;
            baseConfig.xAxis.max = axisMaxMs;
            // 记录原始的 min ms 供 formatter 回补使用
            (baseConfig.xAxis as GenericRecord)._minMs = axisMinMs;
            // 计算最小相邻时间差，以决定是否需要子秒级刻度
            try {
              const sortedTs = tsList.slice().sort((a: number, b: number) => a - b);
              let minDiff = Number.MAX_SAFE_INTEGER;
              for (let i = 1; i < sortedTs.length; i++) {
                const deltaMs = sortedTs[i] - sortedTs[i - 1];
                if (deltaMs > 0 && deltaMs < minDiff) minDiff = deltaMs;
              }
              if (minDiff !== Number.MAX_SAFE_INTEGER && minDiff < 1000) {
                // 选择友好的 tick interval（毫秒）: 10,50,100,200,500
                const chooseNice = (ms: number) => {
                  if (ms <= 10) return 10;
                  if (ms <= 50) return 50;
                  if (ms <= 100) return 100;
                  if (ms <= 200) return 200;
                  if (ms <= 500) return 500;
                  return 1000;
                };
                const tickInterval = chooseNice(minDiff);
                (baseConfig.xAxis as GenericRecord).tickInterval = tickInterval; // milliseconds
                // 显示毫秒部分？
                // 不显示毫秒部分，统一使用秒级显示
                (baseConfig.xAxis as GenericRecord).mask = 'HH:mm:ss';
              }
            } catch (e) {
              // 容错：刻度计算失败时回退默认行为
            }
          } else {
            baseConfig.xAxis.min = new Date(axisMinMs);
            baseConfig.xAxis.max = new Date(axisMaxMs);
            (baseConfig.xAxis as GenericRecord)._minMs = axisMinMs;
          }
          // 已计算轴范围：axisMinMs / axisMaxMs
        }
      } catch (e) {
        // 容错：轴范围计算失败时保持图表默认配置
      }

      // 确保单点可见：设置点样式（填充与边框）
      baseConfig.point = baseConfig.point || {};
      baseConfig.point.style = baseConfig.point.style || {};
      baseConfig.point.size = baseConfig.point.size || 6;
      baseConfig.point.style.fill = chartColor;
      baseConfig.point.style.stroke = '#fff';
      try {
        const vals = finalData
          .map((d: MetricPoint) => Number(d.value ?? d[chart.dataKey]))
          .filter((value: number) => Number.isFinite(value));
        if (vals.length > 0) {
          const vMin = Math.min(...vals);
          const vMax = Math.max(...vals);
          const vRange = vMax - vMin;
          const yPad = vRange === 0 ? Math.max(1, Math.abs(vMin) * 0.05 || 1) : vRange * 0.2;
          const yMin = vMin - yPad;
          const yMax = vMax + yPad;
          baseConfig.yAxis = baseConfig.yAxis || {};
          baseConfig.yAxis.min = yMin;
          baseConfig.yAxis.max = yMax;
          baseConfig.yAxis.tickCount = 5;
        }
      } catch (e) {
        // 容错：y 轴范围计算失败时保持默认范围
      }

      // 视觉优化：适度强化线条与填充，使波动可视但不过分粗糙
      baseConfig.line = baseConfig.line || {};
      baseConfig.line.size = baseConfig.line.size || (exceedsThreshold ? 3 : 2);
      baseConfig.areaStyle = baseConfig.areaStyle || { fill: `l(90) 0:${chartColor}20 1:${chartColor}44` };
      baseConfig.point.size = baseConfig.point.size || (usesTimestampValue ? 4 : 3);
      baseConfig.point.style = { ...baseConfig.point.style, fill: chartColor, stroke: '#fff' };
    }

    // 所有图表纵坐标保留两位小数显示
    baseConfig.yAxis = baseConfig.yAxis || {};
    baseConfig.yAxis.label = baseConfig.yAxis.label || {};
    baseConfig.yAxis.label.formatter = (v: any) => {
      const n = Number(v);
      return Number.isFinite(n) ? n.toFixed(2) : String(v);
    };

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

  // ==================== 子组件：图表卡片 ====================
  // 单个图表卡片组件，包含维度下拉选择器与图表渲染
  const ChartCard: React.FC<{ chart: ChartConfigLike }> = ({ chart }) => {
    // 每张卡片选中的具体维度值（例如 cpu 的 core 值，network 的 interface，disk 的 device）
    const [selectedValue, setSelectedValue] = useState<string | number>('');
    const [chartPoints, setChartPoints] = useState<MetricPoint[]>([]);
    const [chartLoading, setChartLoading] = useState(true);
    // 当 metricTagsObj 返回且当前未选择具体维度时，默认选中第一个维度值
    useEffect(() => {
      if (!metricTagsObj) return;
      const namespaceKey = chart.tag;
      const namespaceTags = metricTagsObj[namespaceKey];
      if (!namespaceTags) return;
      const dimensionKeys = Object.keys(namespaceTags || {});
      if (dimensionKeys.length === 0) return;
      const dimensionValues = namespaceTags[dimensionKeys[0]];
      if (
        Array.isArray(dimensionValues) &&
        dimensionValues.length > 0 &&
        (selectedValue === '' || selectedValue === null)
      ) {
        setSelectedValue(dimensionValues[0]);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [metricTagsObj]);
    const trendConfig = getTrendConfig(chart.trend);
    // 统一使用折线图（Line）样式展示，和 CPU 风格保持一致
    const ChartComponent = Line;
    const exceedsThreshold = checkThresholdExceeded(chart, chartPoints);

    // 根据 timeRange 计算时间窗口
    const computeTimeRange = () => {
      const end = Date.now();
      let offset = 15 * 60 * 1000;
      if (timeRange === '30分钟') offset = 30 * 60 * 1000;
      if (timeRange === '1小时') offset = 60 * 60 * 1000;
      return { startTime: end - offset, endTime: end };
    };

    // 请求图表数据：构建参数 -> 拉取数据 -> 归一化点位 -> 排序/修正
    useEffect(() => {
      let mounted = true;
      const fetchChart = async () => {
        // 基础保护：没有命名空间或维度值时不请求
        const namespaceKey = chart.tag;
        if (!namespaceKey) return;
        if (selectedValue === '' || selectedValue === null) return;
        setChartLoading(true);
        try {
          // 当前保留固定时间窗口（调试态）
          const startTime = 1768286994766;
          const endTime = 1768287007766;
          const params: GenericRecord = {
            namespace: namespaceKey,
            startTime,
            endTime,
            // 将 name 参数映射为后端期望的固定指标名（按命名空间和当前 chart.dataKey）
            name: (() => {
              const nameMap: Record<string, Record<string, string>> = {
                cpu: {
                  user_usage: 'user_usage',
                  system_usage: 'system_usage',
                  nice_usage: 'nice_usage',
                  default: 'user_usage',
                },
                network: {
                  tx_bytes: 'tx_bytes',
                  tx_carrier: 'tx_carrier',
                  rx_packets: 'rx_packets',
                  rx_errors: 'rx_errors',
                  rx_dropped: 'rx_dropped',
                  default: 'tx_bytes',
                },
                disk: {
                  read_merged: 'read_merged',
                  ios_in_progress: 'ios_in_progress',
                  read_completed: 'read_completed',
                  default: 'read_merged',
                },
              };
              const nameMapping = nameMap[namespaceKey];
              if (!nameMapping) return chart.dataKey;
              return nameMapping[chart.dataKey] || nameMapping.default || chart.dataKey;
            })(),
          };

          // 从 metricTagsObj 中取出维度名并使用 selectedValue 作为参数值
          if (metricTagsObj && metricTagsObj[namespaceKey]) {
            const namespaceTagMap = metricTagsObj[namespaceKey];
            const namespaceTagKeys = Object.keys(namespaceTagMap || {});
            if (namespaceTagKeys.length > 0) {
              const dimKey = namespaceTagKeys[0];
              // 后端对 cpu 期望的参数名是 `cpu` 而非 `core`
              const paramName = namespaceKey === 'cpu' ? 'cpu' : dimKey;
              params[paramName] = selectedValue;
            }
          }

          // 附带当前选中的 agent 名称（如果有）
          if (agentName) {
            params.agent_name = agentName;
          }

          // 限制每次请求的数据点数量为 10
          params.dataSize = 10;

          const chartResponse = await getChart(params);
          if (!mounted) return;
          // 后端返回格式可能为 { total, data: [...] } 或直接为数组
          let rawPoints: GenericRecord[] = [];
          if (chartResponse) {
            if (Array.isArray(chartResponse)) rawPoints = chartResponse;
            else if (Array.isArray((chartResponse as GenericRecord).data)) {
              rawPoints = (chartResponse as GenericRecord).data;
            }
          }

          // 转换为图表需要的格式：{ time: Date, [dataKey]: value, ...tags }
          const mapped = (rawPoints || [])
            .map((d: GenericRecord) => {
              const ts = d.timestamp ?? d.time ?? d.t ?? null;
              let timestamp = ts !== null && ts !== undefined ? Number(ts) : undefined;
              // 后端可能返回秒级时间戳（10位），统一转换为毫秒（13位）以供绘图库使用
              if (typeof timestamp === 'number' && Number.isFinite(timestamp)) {
                // 小于 1e12 视为秒级或异常短的时间戳，转换为毫秒
                if (timestamp > 0 && timestamp < 1e12) {
                  timestamp = Math.floor(timestamp * 1000);
                }
              }
              const time = typeof timestamp === 'number' && Number.isFinite(timestamp) ? new Date(timestamp) : undefined;
              const value = d.value !== undefined ? Number(d.value) : Number(d[chart.dataKey] || 0);
              const tags = d.tags || {};
              return {
                // 保留后端原始 timestamp（毫秒或秒）并尽量转换为数字
                timestamp,
                // 兼容旧逻辑：同时保留 Date 对象（如果 timestamp 可用）
                time,
                // 统一使用 value 字段作为 y 值，便于直接映射后端返回
                value,
                // 兼容旧逻辑：仍然提供按 chart.dataKey 命名的字段
                [chart.dataKey]: value,
                // 透传 tags 以便按 tag 分系列（如 cpu core）
                ...tags,
              };
            })
            // 过滤掉无效时间戳或不可数值的点（保留只包含 timestamp/value 的原始点）
            .filter(
              (p: MetricPoint) =>
                (typeof p.timestamp === 'number' && Number.isFinite(p.timestamp)) ||
                (typeof p.value === 'number' && Number.isFinite(p.value)),
            );

          // 按时间升序排序，保证点在 x 轴正确位置
          const sorted = mapped.sort(
            (a: MetricPoint, b: MetricPoint) =>
              (a.timestamp || a.time?.getTime() || 0) - (b.timestamp || b.time?.getTime() || 0),
          );

          // 回退处理：如果后端返回的所有 timestamp 相同（会导致所有点重叠），
          // 则基于查询的 startTime/endTime 对点进行均匀分布时间戳分配，保证横轴有跨度。
          if (sorted.length > 1) {
            const tsList = sorted
              .map((p: MetricPoint) => Number(p.timestamp || (p.time && p.time.getTime())))
              .filter(Boolean);
            const allEqual = tsList.length > 0 && tsList.every((t: number) => t === tsList[0]);
            if (allEqual) {
              try {
                let s = Number(startTime) || tsList[0];
                let e = Number(endTime) || tsList[0] + (sorted.length - 1) * 60000;
                if (e <= s) e = s + (sorted.length - 1) * 60000;
                const n = sorted.length;
                const interval = n > 1 ? Math.floor((e - s) / (n - 1)) : 60000;
                const redistributed = sorted.map((p: MetricPoint, idx: number) => {
                  const newTs = s + idx * interval;
                  return { ...p, timestamp: newTs, time: new Date(newTs) };
                });
                // 对相同时间戳的条目进行了均匀分布处理
                setChartPoints(redistributed);
              } catch (e) {
                setChartPoints(sorted);
              }
            } else {
              setChartPoints(sorted);
            }
          } else {
            setChartPoints(sorted);
          }
        } catch (err) {
          if (mounted) setChartPoints([]);
        } finally {
          if (mounted) setChartLoading(false);
        }
      };

      fetchChart();
      return () => {
        mounted = false;
      };
      // 依赖：维度值、时间范围、自动刷新状态、tags
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedValue, timeRange, autoRefresh, metricTagsObj]);

    const cardTitleText =
      chart.tag === 'cpu'
        ? '请选择CPU核心数：'
        : chart.tag === 'network'
        ? '请选择网口：'
        : chart.tag === 'disk'
        ? '请选择磁盘：'
        : '';

    return (
      <Card
        title={cardTitleText ? <div style={{ fontSize: 14, fontWeight: 600 }}>{cardTitleText}</div> : undefined}
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
        extra={!(chartLoading || loading) ? (
          <Space>
            <Select
              value={selectedValue}
              onChange={(val) => setSelectedValue(val)}
              size="small"
              style={{ width: 160 }}
            >
              {
                // 渲染对应命名空间的维度值列表（例如 cpu.core、network.interface、disk.device）
                (() => {
                  const namespaceKey = chart.tag;
                  if (!metricTagsObj || !metricTagsObj[namespaceKey]) {
                    return [<Option key="-" value="">-</Option>];
                  }
                  const namespaceTagMap = metricTagsObj[namespaceKey];
                  const namespaceTagKeys = Object.keys(namespaceTagMap || {});
                  if (namespaceTagKeys.length === 0) {
                    return [<Option key="-" value="">-</Option>];
                  }
                  const dimensionValues = namespaceTagMap[namespaceTagKeys[0]] || [];
                  return (dimensionValues || []).map((value: string | number) => (
                    <Option key={String(value)} value={value}>
                      {String(value)}
                    </Option>
                  ));
                })()
              }
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
        ) : null}
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

        {/* 图表区域：加载中展示图表骨架/加载，加载完成但无数据则展示“无数据”占位，否则绘制折线图 */}
        <div style={{ flex: 1, minHeight: '120px' }}>
          {chartLoading || loading ? (
            <ChartComponent
              {...(getChartConfig({ ...chart, type: 'line' }, chartPoints) as any)}
              loading={chartLoading || loading}
            />
          ) : chartPoints.length === 0 ? (
            <div
              style={{
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#999',
                fontSize: 12,
              }}
            >
              无数据
            </div>
          ) : (
            <ChartComponent
              {...(getChartConfig({ ...chart, type: 'line' }, chartPoints) as any)}
              loading={false}
            />
          )}
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
            {String(selectedValue).toUpperCase()}
          </div>
        </div>
      </Card>
    );
  };

  // ==================== 过滤与展示衍生逻辑 ====================
  // 处理标签选择
  const handleTagSelect = (tagKey: string) => {
    if (tagKey === 'all') {
      setSelectedTags(['all']);
    } else {
      const newTags = selectedTags.includes('all') ? [] : [...selectedTags];

      if (newTags.includes(tagKey)) {
        // 如果已经选中，则移除
        const filtered = newTags.filter((tag) => tag !== tagKey);
        setSelectedTags(filtered.length === 0 ? ['all'] : filtered);
      } else {
        // 如果未选中，则添加
        newTags.push(tagKey);
        setSelectedTags(newTags);
      }
    }
  };

  // 获取趋势图标和颜色
  const getTrendConfig = (trend: string) => {
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
  const getStatusColor = (status: string) => {
    switch (status) {
      case '正常':
        return 'green';
      case '警告':
        return 'orange';
      case '错误':
        return 'red';
      default:
        return 'default';
    }
  };

  // 日志表格列配置
  const logColumns: any[] = [
    {
      title: '时间',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 100,
      sorter: (a: GenericRecord, b: GenericRecord) => a.timestamp.localeCompare(b.timestamp),
    },
    {
      title: '数值',
      dataIndex: 'value',
      key: 'value',
      width: 100,
      render: (value: string | number) => <Text strong>{value}</Text>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status: string) => <Badge color={getStatusColor(status)} text={status} />,
      filters: [
        { text: '正常', value: '正常' },
        { text: '警告', value: '警告' },
        { text: '错误', value: '错误' },
      ],
      onFilter: (value: any, record: GenericRecord) => record.status === value,
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
      onFilter: (value: any, record: GenericRecord) => record.operation === value,
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
      onFilter: (value: any, record: GenericRecord) => record.source === value,
    },
    {
      title: '消息',
      dataIndex: 'message',
      key: 'message',
      ellipsis: true,
    },
  ];

  // 过滤显示的图表
  // 判断某个 chart 是否有可供选择的维度选项（当前策略：一律保留显示）
  const chartHasOptions = (chart: ChartConfigLike) => {
    // 如果还未拉取到 metric tags，保持显示；
    // 即便 metricTagsObj 中存在命名空间但维度列表为空，也仍然显示图表，后端可返回全局数据。
    if (!metricTagsObj) return true;
    const namespaceKey = chart.tag;
    const namespaceTagMap = metricTagsObj[namespaceKey];
    if (!namespaceTagMap) return true;
    const namespaceTagKeys = Object.keys(namespaceTagMap || {});
    if (namespaceTagKeys.length === 0) return true;
    const dimensionValues = namespaceTagMap[namespaceTagKeys[0]] || [];
    // 即便 list 为空，也不要隐藏图表，允许 ChartCard 在没有具体维度时发起请求
    void dimensionValues;
    return true;
  };

  const filteredCharts = chartConfigs.filter(
    (chart) => (selectedTags.includes('all') || selectedTags.includes(chart.tag)) && chartHasOptions(chart),
  );

  useEffect(() => {
    // 仅当启用自动刷新时，才展示全局 loading/轮询逻辑；默认进入页面不触发第一个骨架屏
    if (!autoRefresh) return;

    setLoading(true);

    const timer = setTimeout(() => {
      // 数据由后端初始化填充（已移除本地 mock）
      setLoading(false);
    }, 500);

    // 自动刷新逻辑预留：当前由每个图表卡片独立请求数据
    let interval: ReturnType<typeof setInterval> | undefined;

    return () => {
      clearTimeout(timer);
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  // 从后端获取可用的 metric tags（ { cpu: {...}, network: {...} }）
  useEffect(() => {
    let mounted = true;
    const fetchTags = async () => {
      try {
        const tagsResponse = await getMetricTags();
        if (!mounted) return;
        const namespaceKeys =
          tagsResponse && typeof tagsResponse === 'object' && !Array.isArray(tagsResponse)
            ? Object.keys(tagsResponse)
            : [];
        setMetricTagKeys(namespaceKeys);
        setMetricTagsObj(tagsResponse || null);
      } catch (err) {
        // 失败时保留默认行为（不阻塞页面）
      }
    };

    fetchTags();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <PageContainer
      content={
        <div>
          <div style={PAGE_TITLE_ROW_STYLE}>
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
          bodyStyle={CONTROL_CARD_BODY_STYLE}
        >
          <div style={CONTROL_ROW_STYLE}>
            <Space size="middle">
              <Text strong>筛选指标:</Text>
              <div style={FILTER_TAGS_WRAP_STYLE}>
                {displayTags.map((tag) => {
                  const isSelected = selectedTags.includes(tag.key);
                  return (
                    <Tag.CheckableTag
                      key={tag.key}
                      checked={isSelected}
                      onChange={() => handleTagSelect(tag.key)}
                      style={{
                        padding: '6px 14px',
                        border: isSelected ? `1px solid ${tag.color}` : '1px solid #d9d9d9',
                        borderRadius: '16px',
                        cursor: 'pointer',
                        background: isSelected ? tag.color : '#fff',
                        color: isSelected ? '#fff' : '#666',
                        fontWeight: isSelected ? 600 : 500,
                        boxShadow: isSelected ? `0 6px 18px ${tag.color}33` : 'none',
                        transform: isSelected ? 'translateY(-2px)' : 'none',
                        transition: 'all 0.12s ease',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <span style={{ marginRight: 4 }}>{tag.icon}</span>
                      {tag.label}
                    </Tag.CheckableTag>
                  );
                })}
              </div>
            </Space>

            <Space>
              <Select value={timeRange} onChange={setTimeRange} style={{ width: 120 }} size="small">
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
          {filteredCharts.map((chart) => (
            <Col key={chart.id} xs={24} sm={12} md={12} lg={6}>
              <ChartCard chart={chart} />
            </Col>
          ))}
        </Row>

        {/* 空状态提示 */}
        {filteredCharts.length === 0 && (
          <ProCard
            style={{
              height: '200px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: '16px',
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <DashboardOutlined
                style={{ fontSize: '48px', color: '#d9d9d9', marginBottom: '16px' }}
              />
              <Text type="secondary">没有找到匹配的指标图表，请调整筛选条件</Text>
            </div>
          </ProCard>
        )}

        {/* 统计信息 */}
        <ProCard style={{ marginTop: '16px' }} bodyStyle={{ padding: '12px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <Text type="secondary">
                共显示 {filteredCharts.length} 个指标图表
                {!selectedTags.includes('all') && ` (${selectedTags.join(', ')})`}
              </Text>
              {filteredCharts.some((chart) => checkThresholdExceeded(chart)) && (
                <Text type="danger" style={{ marginLeft: 16 }}>
                  <ExclamationCircleOutlined />有{' '}
                  {filteredCharts.filter((chart) => checkThresholdExceeded(chart)).length}{' '}
                  个指标超过阈值
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
              <ProCard style={{ marginBottom: 16 }} bodyStyle={{ padding: '12px 16px' }}>
                <div
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <div>
                    <Text strong>日志统计:</Text>
                    <span style={{ marginLeft: 16 }}>
                      <Badge color="green" text="正常" />
                      <span style={{ margin: '0 8px' }}>
                        {logData.filter((item) => item.status === '正常').length}
                      </span>
                    </span>
                    <span style={{ marginLeft: 16 }}>
                      <Badge color="orange" text="警告" />
                      <span style={{ margin: '0 8px' }}>
                        {logData.filter((item) => item.status === '警告').length}
                      </span>
                    </span>
                    <span style={{ marginLeft: 16 }}>
                      <Badge color="red" text="错误" />
                      <span style={{ margin: '0 8px' }}>
                        {logData.filter((item) => item.status === '错误').length}
                      </span>
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
                      `第 ${range[0]}-${range[1]} 条，共 ${total} 条记录`,
                  }}
                  scroll={{ y: 'calc(100vh - 250px)' }}
                  size="small"
                />
              </div>
            </div>
          )}
        </Drawer>
      </div>

      <style>{`
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
          0% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
          100% {
            opacity: 1;
          }
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

export default MetricsDetail;
