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
import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import ContainerCard, { createReadonlyCardConfig } from '../../components/ContainerCard';
import { getChart, getMetricTags } from '../../services/metrics/api';
import './ui.less';
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

// ===== 工具方法 =====
// 格式化 x 轴文本：兼容毫秒时间戳、秒级时间戳和偏移量
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
  // ===== 页面状态 =====
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

  // ===== 标签与筛选 =====
  // 预留标签配置（当前主要由后端命名空间驱动）
  const chartTags: Array<{ key: string; label: string; color: string; icon: React.ReactNode }> =
    [];

  // 由后端 namespace 生成可选标签
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

  // 优先从路由 state 读取 agent_name，失败再回退 URL 参数
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
      // 参数解析失败时静默降级，不阻塞页面渲染
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location]);

  // ===== 图表元数据 =====
  // 指标基础配置：阈值、单位、颜色、图标
  const chartConfigs = [
    // CPU 指标
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

    // Network 指标
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

    // Disk 指标
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

  // ===== 交互处理 =====
  // 打开日志抽屉
  const handleViewLogs = (chart: ChartConfigLike) => {
    setCurrentChart(chart);
    // 日志数据来源由后端决定，这里仅初始化抽屉状态
    setLogData([]);
    setDrawerVisible(true);
  };

  // 关闭日志抽屉
  const handleCloseDrawer = () => {
    setDrawerVisible(false);
    setCurrentChart(null);
    setLogData([]);
  };

  // 阈值判断（支持传入覆盖数据）
  const checkThresholdExceeded = (chart: ChartConfigLike, dataSource?: MetricPoint[]) => {
    const source = dataSource || metricsData;
    if (!chart.threshold && chart.threshold !== 0) return false;
    if (!source || !source.length) return false;

    return source.some((data: MetricPoint) => {
      const value = data[chart.dataKey];
      if (chart.reverseThreshold) {
        return value < chart.threshold; // 反向阈值
      }
      return value > chart.threshold; // 正向阈值
    });
  };

  // ===== 图表配置构建 =====
  // 按图表类型和数据特征动态拼装 AntV 配置
  const getChartConfig = (chart: ChartConfigLike, overrideData?: MetricPoint[]) => {
    const dataSource = overrideData || metricsData;
    // 统一数据结构为数组（AntV 要求）
    const finalData = Array.isArray(dataSource)
      ? dataSource
      : dataSource && Array.isArray((dataSource as GenericRecord).data)
      ? (dataSource as GenericRecord).data
      : [];
    const exceedsThreshold = checkThresholdExceeded(chart, finalData);
    // 预留：多序列字段推导（当前仍使用单序列）
    const seriesField = (() => {
      try {
        if (!metricTagsObj) return undefined;
        const namespaceTagMap = metricTagsObj[chart.tag];
        if (!namespaceTagMap) return undefined;
        const namespaceTagKeys = Object.keys(namespaceTagMap || {});
        if (namespaceTagKeys.length === 0) return undefined;
        // CPU namespace 使用 `cpu` 作为兼容参数名
        return chart.tag === 'cpu' ? 'cpu' : namespaceTagKeys[0];
      } catch (e) {
        return undefined;
      }
    })();
    // 当前固定单序列渲染
    void seriesField;

    // 后端原始点位（timestamp/value）模式检测
    const usesTimestampValue =
      Array.isArray(finalData) &&
      finalData.length > 0 &&
      'timestamp' in finalData[0] &&
      'value' in finalData[0];

    const baseConfig: GenericRecord = {
      data: finalData,
      // timestamp/value 模式下直接使用毫秒时间戳，避免二次时区转换
      xField: usesTimestampValue ? 'timestamp' : 'time',
      yField: usesTimestampValue ? 'value' : chart.dataKey,
      // 保持单序列样式一致
      height: 120,
      autoFit: true,
      // 非 timestamp 模式启用平滑线
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
          // 同时兼容聚合点（min/max/count）与普通点
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
      // timestamp 场景适当放大点位，提升可读性
      point: { size: usesTimestampValue ? 4 : 3 },
      // 阈值线（与图表类型定义存在轻微类型差异，保留断言）
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

    // 阈值状态驱动主色
    const chartColor = exceedsThreshold ? chart.thresholdColor : chart.color;

    // timestamp 模式下补齐 x 轴范围，避免单点塌缩
    if (Array.isArray(finalData) && finalData.length > 0 && 'timestamp' in finalData[0]) {
      try {
        const tsList = finalData.map((d: MetricPoint) => Number(d.timestamp || d.time || 0)).filter(Boolean);
        if (tsList.length > 0) {
          const minTs = Math.min(...tsList);
          const maxTs = Math.max(...tsList);
          // 单点时补 1 秒窗口，避免图形退化为不可见竖线
          const axisMinMs = minTs === maxTs ? minTs - 1000 : minTs;
          const axisMaxMs = minTs === maxTs ? maxTs + 1000 : maxTs;
          // timestamp 模式使用毫秒 min/max，Date 模式使用 Date 对象
          if (!baseConfig.xAxis) baseConfig.xAxis = {};
          if (usesTimestampValue) {
            baseConfig.xAxis.min = axisMinMs;
            baseConfig.xAxis.max = axisMaxMs;
            // 记录 minMs，供 xAxis formatter 回补偏移
            (baseConfig.xAxis as GenericRecord)._minMs = axisMinMs;
            // 基于最小间隔决定 tickInterval
            try {
              const sortedTs = tsList.slice().sort((a: number, b: number) => a - b);
              let minDiff = Number.MAX_SAFE_INTEGER;
              for (let i = 1; i < sortedTs.length; i++) {
                const deltaMs = sortedTs[i] - sortedTs[i - 1];
                if (deltaMs > 0 && deltaMs < minDiff) minDiff = deltaMs;
              }
              if (minDiff !== Number.MAX_SAFE_INTEGER && minDiff < 1000) {
                // 选择更稳定的毫秒级 tickInterval
                const chooseNice = (ms: number) => {
                  if (ms <= 10) return 10;
                  if (ms <= 50) return 50;
                  if (ms <= 100) return 100;
                  if (ms <= 200) return 200;
                  if (ms <= 500) return 500;
                  return 1000;
                };
                const tickInterval = chooseNice(minDiff);
                (baseConfig.xAxis as GenericRecord).tickInterval = tickInterval;
                // 统一秒级展示，避免高频刻度闪烁
                (baseConfig.xAxis as GenericRecord).mask = 'HH:mm:ss';
              }
            } catch (e) {
              // 刻度计算失败时回退默认行为
            }
          } else {
            baseConfig.xAxis.min = new Date(axisMinMs);
            baseConfig.xAxis.max = new Date(axisMaxMs);
            (baseConfig.xAxis as GenericRecord)._minMs = axisMinMs;
          }
        }
      } catch (e) {
        // 轴范围计算失败时保持默认配置
      }

      // 点位样式兜底，保证单点可见
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
        // y 轴计算失败时保持默认范围
      }

      // 阈值态下增强线条视觉权重
      baseConfig.line = baseConfig.line || {};
      baseConfig.line.size = baseConfig.line.size || (exceedsThreshold ? 3 : 2);
      baseConfig.areaStyle = baseConfig.areaStyle || { fill: `l(90) 0:${chartColor}20 1:${chartColor}44` };
      baseConfig.point.size = baseConfig.point.size || (usesTimestampValue ? 4 : 3);
      baseConfig.point.style = { ...baseConfig.point.style, fill: chartColor, stroke: '#fff' };
    }

    // 统一 y 轴两位小数
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

  // ===== 子组件：图表卡片 =====
  // 职责：维度选择 + 数据请求 + 图表渲染
  const ChartCard: React.FC<{ chart: ChartConfigLike }> = ({ chart }) => {
    // 当前卡片维度值（cpu core / network iface / disk device）
    const [selectedValue, setSelectedValue] = useState<string | number>('');
    const [chartPoints, setChartPoints] = useState<MetricPoint[]>([]);
    const [chartLoading, setChartLoading] = useState(true);
    // metric tags 可用且未选择维度时，默认选首项
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
    // 当前统一为折线图风格
    const ChartComponent = Line;
    const exceedsThreshold = checkThresholdExceeded(chart, chartPoints);

    // 计算查询时间窗口
    const computeTimeRange = () => {
      const end = Date.now();
      let offset = 15 * 60 * 1000;
      if (timeRange === '30分钟') offset = 30 * 60 * 1000;
      if (timeRange === '1小时') offset = 60 * 60 * 1000;
      return { startTime: end - offset, endTime: end };
    };

    // 请求流程：组装参数 -> 拉取 -> 归一化 -> 排序/修正
    useEffect(() => {
      let mounted = true;
      const fetchChart = async () => {
        // 参数保护：命名空间或维度值缺失时不请求
        const namespaceKey = chart.tag;
        if (!namespaceKey) return;
        if (selectedValue === '' || selectedValue === null) return;
        setChartLoading(true);
        try {
          // TODO: 当前保留固定时间窗口（调试态）
          const startTime = 1768286994766;
          const endTime = 1768287007766;
          const params: GenericRecord = {
            namespace: namespaceKey,
            startTime,
            endTime,
            // 指标名映射：按 namespace + dataKey 转换为后端入参
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

          // 写入维度参数
          if (metricTagsObj && metricTagsObj[namespaceKey]) {
            const namespaceTagMap = metricTagsObj[namespaceKey];
            const namespaceTagKeys = Object.keys(namespaceTagMap || {});
            if (namespaceTagKeys.length > 0) {
              const dimKey = namespaceTagKeys[0];
              // CPU 场景使用 `cpu` 作为参数名
              const paramName = namespaceKey === 'cpu' ? 'cpu' : dimKey;
              params[paramName] = selectedValue;
            }
          }

          // 透传 agent_name（如果存在）
          if (agentName) {
            params.agent_name = agentName;
          }

          // 限制点位数量，避免单次请求过大
          params.dataSize = 10;

          const chartResponse = await getChart(params);
          if (!mounted) return;
          // 兼容后端返回：数组 / { data: [] }
          let rawPoints: GenericRecord[] = [];
          if (chartResponse) {
            if (Array.isArray(chartResponse)) rawPoints = chartResponse;
            else if (Array.isArray((chartResponse as GenericRecord).data)) {
              rawPoints = (chartResponse as GenericRecord).data;
            }
          }

          // 归一化点位结构：{ timestamp, time, value, [dataKey], ...tags }
          const mapped = (rawPoints || [])
            .map((d: GenericRecord) => {
              const ts = d.timestamp ?? d.time ?? d.t ?? null;
              let timestamp = ts !== null && ts !== undefined ? Number(ts) : undefined;
              // 秒级时间戳统一转毫秒
              if (typeof timestamp === 'number' && Number.isFinite(timestamp)) {
                if (timestamp > 0 && timestamp < 1e12) {
                  timestamp = Math.floor(timestamp * 1000);
                }
              }
              const time = typeof timestamp === 'number' && Number.isFinite(timestamp) ? new Date(timestamp) : undefined;
              const value = d.value !== undefined ? Number(d.value) : Number(d[chart.dataKey] || 0);
              const tags = d.tags || {};
              return {
                timestamp,
                time,
                value,
                [chart.dataKey]: value,
                ...tags,
              };
            })
            // 过滤非法点
            .filter(
              (p: MetricPoint) =>
                (typeof p.timestamp === 'number' && Number.isFinite(p.timestamp)) ||
                (typeof p.value === 'number' && Number.isFinite(p.value)),
            );

          // 按时间升序，确保 x 轴顺序正确
          const sorted = mapped.sort(
            (a: MetricPoint, b: MetricPoint) =>
              (a.timestamp || a.time?.getTime() || 0) - (b.timestamp || b.time?.getTime() || 0),
          );

          // 所有 timestamp 相同则回退均匀分布，避免点位重叠
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
      // 依赖：维度值、时间范围、自动刷新、tags
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

    const chartCardId = String(chart.key || chart.tag || chart.title);

    // 与 BusinessStatsCard 复用同一只读卡片配置
    const readonlyCardConfig = useMemo(
      () =>
        createReadonlyCardConfig({
          id: chartCardId,
          name: chart.title,
          machineId: 'metrics',
        }),
      [chartCardId, chart.title],
    );

    const renderDimensionOptions = () => {
      const namespaceTagMap = metricTagsObj?.[chart.tag];
      if (!namespaceTagMap) return [<Option key="-" value="">-</Option>];

      const namespaceTagKeys = Object.keys(namespaceTagMap || {});
      if (namespaceTagKeys.length === 0) return [<Option key="-" value="">-</Option>];

      const dimensionValues = namespaceTagMap[namespaceTagKeys[0]] || [];
      return (dimensionValues || []).map((value: string | number) => (
        <Option key={String(value)} value={value}>
          {String(value)}
        </Option>
      ));
    };

    const cssVars = (vars: Record<string, string>): React.CSSProperties =>
      vars as React.CSSProperties;

    // 卡片视觉状态统一走 CSS 变量，方便 less 侧复用。
    const metricCardShellVars = cssVars({
      '--metric-card-border': exceedsThreshold ? chart.thresholdColor : '#d9d9d9',
      '--metric-card-shadow': '0 2px 4px rgba(0,0,0,0.02)',
    });

    // ContainerCard 内部有默认边框，这里显式覆盖，确保阈值态红边框一定生效。
    const metricCardShellStyle: React.CSSProperties = {
      ...metricCardShellVars,
      border: `1px solid ${exceedsThreshold ? chart.thresholdColor : '#d9d9d9'}`,
    };

    const metricThresholdVars = cssVars({ '--metric-threshold-color': chart.thresholdColor });
    const metricIconVars = cssVars({
      '--metric-icon-bg': exceedsThreshold ? `${chart.thresholdColor}10` : `${chart.color}10`,
      '--metric-icon-color': exceedsThreshold ? chart.thresholdColor : chart.color,
    });
    const metricNameVars = cssVars({
      '--metric-name-color': exceedsThreshold ? chart.thresholdColor : 'inherit',
    });
    const metricValueVars = cssVars({
      '--metric-value-color': exceedsThreshold ? chart.thresholdColor : chart.color,
    });
    const metricTrendVars = cssVars({ '--metric-trend-color': trendConfig.color });
    const metricFooterVars = cssVars({
      '--metric-footer-color': exceedsThreshold ? chart.thresholdColor : 'inherit',
    });
    const metricDimensionVars = cssVars({
      '--metric-dim-bg': exceedsThreshold ? `${chart.thresholdColor}10` : '#f0f0f0',
      '--metric-dim-color': exceedsThreshold ? chart.thresholdColor : '#666',
      '--metric-dim-border': exceedsThreshold ? chart.thresholdColor : 'transparent',
    });

    return (
      <ContainerCard
        container={{ ...chart, id: chartCardId, machineId: 'metrics' }}
        getProgressColor={() => '#52c41a'}
        formatNumber={(num) => String(num ?? 0)}
        showPopover={false}
        showRibbon={false}
        // 指标卡不需要点击跳转，但保持业务概览卡同款 hoverable 视觉反馈。
        interactive={false}
        hoverable
        hoverShadow={false}
        height="100%"
        cardClassName="metric-card-shell"
        bodyClassName="metric-card-body"
        cardStyle={metricCardShellStyle}
        cardConfig={readonlyCardConfig}
        renderers={{
          containerKeyAccessor: () => `chart-${chartCardId}`,
          renderCover: () => null,
          renderHeader: () => {
            const headerExtra =
              !(chartLoading || loading) ? (
                <Space>
                  <Select
                    value={selectedValue}
                    onChange={(val) => setSelectedValue(val)}
                    size="small"
                    className="metric-card-dimension-select"
                  >
                    {renderDimensionOptions()}
                  </Select>
                  <Tooltip title="查看详细日志">
                    <Button
                      type="text"
                      icon={<TableOutlined />}
                      size="small"
                      onClick={() => handleViewLogs(chart)}
                      className="metric-card-log-btn"
                    />
                  </Tooltip>
                </Space>
              ) : null;

            if (!cardTitleText && !headerExtra) return null;

            return (
              <div className="metric-card-header">
                <div className="metric-card-title">{cardTitleText}</div>
                {headerExtra}
              </div>
            );
          },
          renderContent: () => (
            <>
              {exceedsThreshold && (
                <div className="metric-card-threshold-icon" style={metricThresholdVars}>
                  <ExclamationCircleOutlined />
                </div>
              )}

              <div className="metric-card-summary">
                <div className="metric-card-summary-main">
                  <div
                    className="metric-card-icon-wrap"
                    style={metricIconVars}
                  >
                    {chart.icon}
                  </div>
                  <div>
                    <Text strong className="metric-card-name" style={metricNameVars}>
                      {chart.title}
                      {exceedsThreshold && (
                        <Tooltip title={`当前值已超过阈值 ${chart.threshold}${chart.unit}`}>
                          <ExclamationCircleOutlined
                            className="metric-card-threshold-inline-icon"
                            style={metricThresholdVars}
                          />
                        </Tooltip>
                      )}
                    </Text>
                    <div className="metric-card-value-row">
                      <Text strong className="metric-card-value" style={metricValueVars}>
                        {chart.value}
                      </Text>
                      <Text className="metric-card-trend" style={metricTrendVars}>
                        {trendConfig.icon} {chart.change}
                      </Text>
                    </div>
                  </div>
                </div>
              </div>

              <div className="metric-card-chart-wrap">
                {chartLoading || loading ? (
                  <ChartComponent
                    {...(getChartConfig({ ...chart, type: 'line' }, chartPoints) as any)}
                    loading={chartLoading || loading}
                  />
                ) : chartPoints.length === 0 ? (
                  <div className="metric-card-empty">
                    无数据
                  </div>
                ) : (
                  <ChartComponent
                    {...(getChartConfig({ ...chart, type: 'line' }, chartPoints) as any)}
                    loading={false}
                  />
                )}
              </div>

              <div className="metric-card-footer">
                <Text type="secondary" className="metric-card-footer-time" style={metricFooterVars}>
                  最后更新: 刚刚{exceedsThreshold && ' • 超过阈值'}
                </Text>
                <div className="metric-card-dimension-tag" style={metricDimensionVars}>
                  {String(selectedValue).toUpperCase()}
                </div>
              </div>
            </>
          ),
        }}
      />
    );
  };

  // ==================== 过滤与展示衍生逻辑 ====================
  // 处理标签选择
  const handleTagSelect = (tagKey: string) => {
    const allKeys = displayTags.map((tag) => tag.key);

    // 默认全选态：点击某项时改为取消该项
    if (selectedTags.includes('all')) {
      setSelectedTags(allKeys.filter((key) => key !== tagKey));
      return;
    }

    if (selectedTags.includes(tagKey)) {
      // 已选中则取消
      const nextSelected = selectedTags.filter((tag) => tag !== tagKey);
      setSelectedTags(nextSelected);
    } else {
      // 未选中则添加
      const nextSelected = [...selectedTags, tagKey];
      // 全部手动选中后折叠为 all 语义
      setSelectedTags(nextSelected.length === allKeys.length ? ['all'] : nextSelected);
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

  // ===== 图表过滤 =====
  // 当前策略：即使没有维度选项，也保留图表展示
  const chartHasOptions = (chart: ChartConfigLike) => {
    // 未返回 tags 时保持展示，避免首屏空白
    if (!metricTagsObj) return true;
    const namespaceKey = chart.tag;
    const namespaceTagMap = metricTagsObj[namespaceKey];
    if (!namespaceTagMap) return true;
    const namespaceTagKeys = Object.keys(namespaceTagMap || {});
    if (namespaceTagKeys.length === 0) return true;
    const dimensionValues = namespaceTagMap[namespaceTagKeys[0]] || [];
    // list 为空也不隐藏，允许 ChartCard 走兜底请求
    void dimensionValues;
    return true;
  };

  const filteredCharts = chartConfigs.filter(
    (chart) => (selectedTags.includes('all') || selectedTags.includes(chart.tag)) && chartHasOptions(chart),
  );

  useEffect(() => {
    // 仅在自动刷新开启时展示全局 loading
    if (!autoRefresh) return;

    setLoading(true);

    const timer = setTimeout(() => {
      // 数据初始化由后端请求完成
      setLoading(false);
    }, 500);

    // 预留：全局轮询入口（当前由 ChartCard 独立请求）
    let interval: ReturnType<typeof setInterval> | undefined;

    return () => {
      clearTimeout(timer);
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  // 拉取可用 metric tags（例如 { cpu: {...}, network: {...} }）
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
        // 拉取失败时不阻塞页面
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
          <div className="data-view-detail-title-row">
            <DashboardOutlined className="data-view-detail-title-icon" />
            <span className="data-view-detail-title-text">系统指标监控面板</span>
          </div>
          <Text type="secondary">实时监控系统各项关键性能指标，支持多维度数据可视化展示</Text>
        </div>
      }
    >
      <div className="network-metrics">
        {/* 控制栏 */}
        <ProCard className="control-section data-view-detail-control-card">
          <div className="data-view-detail-control-row">
            <Space size="middle">
              <Text strong>筛选指标:</Text>
              <div className="data-view-detail-filter-tags">
                {displayTags.map((tag) => {
                  const isSelected = selectedTags.includes('all') || selectedTags.includes(tag.key);
                  return (
                    <Tag.CheckableTag
                      key={tag.key}
                      checked={isSelected}
                      onChange={() => handleTagSelect(tag.key)}
                      className={`data-view-detail-checkable-tag ${isSelected ? 'selected' : ''}`}
                      style={{ '--tag-color': tag.color } as React.CSSProperties}
                    >
                      <span className="data-view-detail-tag-icon">{tag.icon}</span>
                      {tag.label}
                    </Tag.CheckableTag>
                  );
                })}
              </div>
            </Space>

            <Space>
              <Select
                value={timeRange}
                onChange={setTimeRange}
                className="data-view-detail-time-range"
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

        {/* 图表区 */}
        <Row gutter={[16, 16]}>
          {filteredCharts.map((chart) => (
            <Col key={chart.id} xs={24} sm={12} md={12} lg={6}>
              <ChartCard chart={chart} />
            </Col>
          ))}
        </Row>

        {/* 空状态 */}
        {filteredCharts.length === 0 && (
          <ProCard className="data-view-detail-empty-card">
            <div className="data-view-detail-empty-center">
              <DashboardOutlined className="data-view-detail-empty-icon" />
              <Text type="secondary">没有找到匹配的指标图表，请调整筛选条件</Text>
            </div>
          </ProCard>
        )}

        {/* 页脚统计 */}
        <ProCard className="data-view-detail-summary-card">
          <div className="data-view-detail-summary-row">
            <div>
              <Text type="secondary">
                共显示 {filteredCharts.length} 个指标图表
                {!selectedTags.includes('all') && ` (${selectedTags.join(', ')})`}
              </Text>
              {filteredCharts.some((chart) => checkThresholdExceeded(chart)) && (
                <Text type="danger" className="data-view-detail-summary-alert">
                  <ExclamationCircleOutlined />有{' '}
                  {filteredCharts.filter((chart) => checkThresholdExceeded(chart)).length}{' '}
                  个指标超过阈值
                </Text>
              )}
            </div>
            <Text type="secondary" className="data-view-detail-summary-time">
              数据更新时间: {new Date().toLocaleTimeString()}
            </Text>
          </div>
        </ProCard>

        {/* 日志抽屉 */}
        <Drawer
          title={
            <div className="data-view-detail-drawer-title">
              <div className="data-view-detail-drawer-title-left">
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
          className="data-view-detail-drawer"
        >
          {currentChart && (
            <div className="data-view-detail-drawer-content">
              {/* 日志统计 */}
              <ProCard className="data-view-detail-log-summary-card">
                <div className="data-view-detail-log-summary-row">
                  <div>
                    <Text strong>日志统计:</Text>
                    <span className="data-view-detail-log-summary-item">
                      <Badge color="green" text="正常" />
                      <span className="data-view-detail-log-summary-count">
                        {logData.filter((item) => item.status === '正常').length}
                      </span>
                    </span>
                    <span className="data-view-detail-log-summary-item">
                      <Badge color="orange" text="警告" />
                      <span className="data-view-detail-log-summary-count">
                        {logData.filter((item) => item.status === '警告').length}
                      </span>
                    </span>
                    <span className="data-view-detail-log-summary-item">
                      <Badge color="red" text="错误" />
                      <span className="data-view-detail-log-summary-count">
                        {logData.filter((item) => item.status === '错误').length}
                      </span>
                    </span>
                  </div>
                  <Text type="secondary">共 {logData.length} 条日志记录</Text>
                </div>
              </ProCard>

              {/* 日志列表 */}
              <div className="data-view-detail-log-table-wrap">
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

    </PageContainer>
  );
};

export default MetricsDetail;
