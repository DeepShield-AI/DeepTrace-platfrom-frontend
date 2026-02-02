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
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;

const MetricsDetail = () => {
  const [timeRange, setTimeRange] = useState('15分钟');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedTags, setSelectedTags] = useState<string[]>(['all']);
  const [metricsData, setMetricsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [metricTagKeys, setMetricTagKeys] = useState<string[]>([]);
  const [metricTagsObj, setMetricTagsObj] = useState<Record<string, any> | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [currentChart, setCurrentChart] = useState<any | null>(null);
  const [logData, setLogData] = useState<any[]>([]);
  const [agentName, setAgentName] = useState<string | null>(null);
  const location = useLocation();

  // 图表标签配置
  const chartTags: any[] = [];

  // 展示api获取的所有键作为类命名空间作为筛选
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
        const stateAgent = (location && (location as any).state && (location as any).state.agent_name) || (location && (location as any).state && (location as any).state.agent);
        if (stateAgent) {
          setAgentName(stateAgent);
          return;
        }
        const qs = new URLSearchParams(window.location.search);
        const a = qs.get('agent_name') || qs.get('agent');
        if (a) setAgentName(a);
      } catch (e) {
        // ignore
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location]);

  // 图表数据配置 - 增加threshold字段
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

    // 内存
    {
      id: 4,
      title: '内存使用率',
      value: '68.7%',
      trend: 'down',
      change: '-1.3%',
      tag: 'memory',
      type: 'area',
      dataKey: 'memory',
      color: '#52c41a',
      icon: <DatabaseOutlined />,
      threshold: 85,
      thresholdColor: '#ff7875',
      unit: '%',
    },

    // Network: 每个指标独立
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

    // Disk: 每个指标独立
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

    // 其他系统指标
    {
      id: 13,
      title: '系统负载',
      value: '2.1',
      trend: 'up',
      change: '+0.2',
      tag: 'system',
      type: 'line',
      dataKey: 'load',
      color: '#fa8c16',
      icon: <CloudServerOutlined />,
      threshold: 3.0,
      thresholdColor: '#ff7875',
      unit: '',
    },
    {
      id: 14,
      title: '温度监控',
      value: '65°C',
      trend: 'stable',
      change: '0°',
      tag: 'system',
      type: 'area',
      dataKey: 'temperature',
      color: '#fa541c',
      icon: <FireOutlined />,
      threshold: 75,
      thresholdColor: '#ff7875',
      unit: '°C',
    },
    {
      id: 15,
      title: '缓存命中率',
      value: '92.3%',
      trend: 'down',
      change: '-1.2%',
      tag: 'memory',
      type: 'line',
      dataKey: 'cache',
      color: '#eb2f96',
      icon: <RocketOutlined />,
      threshold: 90,
      thresholdColor: '#52c41a',
      unit: '%',
      reverseThreshold: true,
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
  const generateLogData = (chart: any) => {
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
        operation: operations[Math.floor(Math.random() * operations.length)],
        message: `${chart.title} ${operations[Math.floor(Math.random() * operations.length)]}操作`,
        source: `server-${Math.floor(Math.random() * 5) + 1}`,
      };
    });
  };

  // 打开抽屉查看日志表格
  const handleViewLogs = (chart: any) => {
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

  // 检查是否超过阈值（可传入自定义数据源）
  const checkThresholdExceeded = (chart: any, dataSource?: any) => {
    const source = dataSource || metricsData;
    if (!chart.threshold) return false;
    if (!source || !source.length) return false;

    return source.some((data: any) => {
      const value = data[chart.dataKey];
      if (chart.reverseThreshold) {
        return value < chart.threshold; // 反向阈值：低于阈值才警告
      }
      return value > chart.threshold; // 正向阈值：高于阈值警告
    });
  };

  // 获取图表配置
  const getChartConfig = (chart: any, overrideData?: any) => {
    const dataSource = overrideData || metricsData;
    // normalize dataSource to array - AntV plots expect an array
    const finalData = Array.isArray(dataSource)
      ? dataSource
      : dataSource && Array.isArray((dataSource as any).data)
      ? (dataSource as any).data
      : [];
    const exceedsThreshold = checkThresholdExceeded(chart, finalData);
    // 如果 metricTagsObj 中存在当前命名空间的维度，则把该维度作为 seriesField（多序列展示）
    const seriesField = (() => {
      try {
        if (!metricTagsObj) return undefined;
        const inner = metricTagsObj[chart.tag];
        if (!inner) return undefined;
        const innerKeys = Object.keys(inner || {});
        if (innerKeys.length === 0) return undefined;
        // 对 cpu 命名空间使用 'cpu' 参数名兼容后端
        return chart.tag === 'cpu' ? 'cpu' : innerKeys[0];
      } catch (e) {
        return undefined;
      }
    })();

    // 如果 metricTagsObj 中存在当前命名空间的维度，则把该维度作为 seriesField（多序列展示）
    const resolvedSeriesField = (() => {
      try {
        if (!metricTagsObj) return undefined;
        const inner = metricTagsObj[chart.tag];
        if (!inner) return undefined;
        const innerKeys = Object.keys(inner || {});
        if (innerKeys.length === 0) return undefined;
        return chart.tag === 'cpu' ? 'cpu' : innerKeys[0];
      } catch (e) {
        return undefined;
      }
    })();

    // 优先检测后端原始 timestamp/value 字段
    const usesTimestampValue = Array.isArray(finalData) && finalData.length > 0 && 'timestamp' in finalData[0] && 'value' in finalData[0];

    const baseConfig: any = {
      data: finalData,
      // 当后端返回原始 timestamp/value 时，使用数字毫秒字段 `timestamp` 作为 x 轴，
      // 能避免库内对日期字符串/Date 对象的二次转换导致的时区/格式问题。
      xField: usesTimestampValue ? 'timestamp' : 'time',
      yField: usesTimestampValue ? 'value' : chart.dataKey,
      ...(resolvedSeriesField && !usesTimestampValue ? { seriesField: resolvedSeriesField } : {}),
      height: 120,
      autoFit: true,
      // 当使用后端原始 timestamp/value 时通常是稀疏点：禁用平滑并放大点
      smooth: usesTimestampValue ? false : true,
      loading: loading,
      xAxis: {
        type: 'time',
        // 减少刻度数量并自动隐藏重叠标签，避免挤在一起
        tickCount: 3,
        mask: 'HH:mm:ss',
        label: {
          autoHide: true,
          autoRotate: false,
          formatter: (v: any) => {
            // Debug: 打印传入 formatter 的值与类型，帮助定位为何显示 08:00:00
            // eslint-disable-next-line no-console
            console.debug('xAxis.label.formatter called with:', v, typeof v);
            if (!v && v !== 0) return '';
            const xAxisCfg = (baseConfig && (baseConfig.xAxis as any)) || {};
            const baseMinMs = xAxisCfg._minMs;
            // 尝试将传入值解析为数字毫秒
            const rawNum = Number(v);
            if (!Number.isNaN(rawNum)) {
              let absMs = rawNum;
              if (usesTimestampValue) {
                // 如果是相对于 min 的偏移值（通常小于 1e11），并且记录了 baseMinMs，则回补为绝对毫秒
                if (rawNum > 0 && rawNum < 1e11 && typeof baseMinMs === 'number') {
                  absMs = baseMinMs + rawNum;
                } else if (rawNum > 1e9 && rawNum < 1e12) {
                  // 10 位或 11 位数字视为秒级时间戳，转换为毫秒
                  absMs = Math.floor(rawNum * 1000);
                } else if (rawNum >= 1e12) {
                  // 已经是毫秒级
                  absMs = rawNum;
                }
                return dayjs(absMs).format('HH:mm:ss');
              }
              return dayjs(rawNum).format('YYYY-MM-DD HH:mm:ss');
            }
            const parsed = Date.parse(String(v));
            if (!Number.isNaN(parsed)) return usesTimestampValue ? dayjs(parsed).format('HH:mm:ss') : dayjs(parsed).format('YYYY-MM-DD HH:mm:ss');
            return String(v);
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
        showMarkers: false,
        formatter: (datum: any) => {
          // 支持两种数据结构：{value, timestamp} 或 { [chart.dataKey]: ... }
          const v = datum ? (usesTimestampValue ? datum.value : datum[chart.dataKey]) : undefined;
          const num = typeof v === 'number' ? v : Number(v || 0);
          const formatted = usesTimestampValue
            ? (chart.unit === 'Gbps' ? `${num.toFixed(1)} Gbps` : chart.unit === '°C' ? `${num.toFixed(0)}°C` : `${num}`)
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
      // 在使用 timestamp/value 时放大点，便于单点可见
      point: usesTimestampValue ? { size: 6 } : { size: 2 },
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
        : []) as any,
    };

    // 根据是否超过阈值调整颜色强度
    const chartColor = exceedsThreshold ? chart.thresholdColor : chart.color;

    // 如果使用后端 timestamp/value，需要计算 x 轴域并保证单点可见（添加左右 padding）
    if (Array.isArray(finalData) && finalData.length > 0 && 'timestamp' in finalData[0]) {
      try {
        const tsList = finalData.map((d: any) => Number(d.timestamp || d.time || 0)).filter(Boolean);
        if (tsList.length > 0) {
          const minTs = Math.min(...tsList);
          const maxTs = Math.max(...tsList);
          // 当只有单个时间点时，扩展 60 秒的左右边距；否则扩展 5% 的范围
          const pad = minTs === maxTs ? 60000 : Math.max(60000, Math.round((maxTs - minTs) * 0.05));
          const axisMinMs = minTs - pad;
          const axisMaxMs = maxTs + pad;
          // 将 min/max 设置到 xAxis，针对 usesTimestampValue 使用数字毫秒，避免 Date 对象导致的刻度单位变化
          if (!baseConfig.xAxis) baseConfig.xAxis = {};
          if (usesTimestampValue) {
            baseConfig.xAxis.min = axisMinMs;
            baseConfig.xAxis.max = axisMaxMs;
            // 记录原始的 min ms 供 formatter 回补使用
            (baseConfig.xAxis as any)._minMs = axisMinMs;
          } else {
            baseConfig.xAxis.min = new Date(axisMinMs);
            baseConfig.xAxis.max = new Date(axisMaxMs);
            (baseConfig.xAxis as any)._minMs = axisMinMs;
          }
          // Debug 输出：打印时间戳列表与设置的轴范围，便于排查标签问题
          // eslint-disable-next-line no-console
          console.log('Chart timestamps sample:', tsList.slice(0, 10));
          // eslint-disable-next-line no-console
          console.log('xAxis min/max (ms):', axisMinMs, axisMaxMs);
        }
      } catch (e) {
        // ignore
      }

      // 确保单点可见：设置点样式（填充与边框）
      baseConfig.point = baseConfig.point || {};
      baseConfig.point.style = baseConfig.point.style || {};
      baseConfig.point.size = baseConfig.point.size || 6;
      baseConfig.point.style.fill = chartColor;
      baseConfig.point.style.stroke = '#fff';
      try {
        const vals = finalData.map((d: any) => Number(d.value ?? d[chart.dataKey])).filter((v: any) => Number.isFinite(v));
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
        // ignore
      }

      // 强化线条与填充，使微小波动更明显
      baseConfig.line = baseConfig.line || {};
      baseConfig.line.size = Math.max(2, baseConfig.line.size || 3);
      baseConfig.areaStyle = baseConfig.areaStyle || { fill: `l(270) 0:${chartColor}22 1:${chartColor}44` };
      baseConfig.point.size = Math.max(4, baseConfig.point.size || 6);
      baseConfig.point.style = { ...baseConfig.point.style, fill: chartColor, stroke: '#fff' };
    }

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
    // 每张卡片选中的具体维度值（例如 cpu 的 core 值，network 的 interface，disk 的 device）
    const [selectedValue, setSelectedValue] = useState<string | number>('');
    const [chartPoints, setChartPoints] = useState<any[]>([]);
    const [chartLoading, setChartLoading] = useState(false);
    // 当 metricTagsObj 返回且当前未选择具体维度时，默认选中第一个维度值
    useEffect(() => {
      if (!metricTagsObj) return;
      const ns = chart.tag;
      const obj = metricTagsObj[ns];
      if (!obj) return;
      const keys = Object.keys(obj || {});
      if (keys.length === 0) return;
      const list = obj[keys[0]];
      if (Array.isArray(list) && list.length > 0 && (selectedValue === '' || selectedValue === null)) {
        setSelectedValue(list[0]);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [metricTagsObj]);
    const trendConfig = getTrendConfig(chart.trend);
    const ChartComponent = chart.type === 'column' ? Column : chart.type === 'area' ? Area : Line;
    const exceedsThreshold = checkThresholdExceeded(chart, chartPoints);

    // 根据 timeRange 计算 time window
    const computeTimeRange = () => {
      const end = Date.now();
      let offset = 15 * 60 * 1000;
      if (timeRange === '30分钟') offset = 30 * 60 * 1000;
      if (timeRange === '1小时') offset = 60 * 60 * 1000;
      return { startTime: end - offset, endTime: end };
    };

    // 构建查询参数并请求后端 chart 数据（使用 selectedValue 作为额外维度）
    useEffect(() => {
      let mounted = true;
      const fetchChart = async () => {
        // 需要命名空间与具体维度值
        const ns = chart.tag;
        if (!ns) return;
        if (selectedValue === '' || selectedValue === null) return;
        setChartLoading(true);
        try {
          // const { startTime, endTime } = computeTimeRange();
          // 临时写死时间参数为固定值（用于调试）
          const startTime = 1768286994766;
          const endTime = 1768287007766;
          const params: Record<string, any> = {
            namespace: ns,
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
              const map = nameMap[ns];
              if (!map) return chart.dataKey;
              return map[chart.dataKey] || map.default || chart.dataKey;
            })(),
          };

          // 从 metricTagsObj 中取出维度名并使用 selectedValue 作为参数值
          if (metricTagsObj && metricTagsObj[ns]) {
            const inner = metricTagsObj[ns];
            const innerKeys = Object.keys(inner || {});
            if (innerKeys.length > 0) {
              const dimKey = innerKeys[0];
              // 后端对 cpu 期望的参数名是 `cpu` 而非 `core`
              const paramName = ns === 'cpu' ? 'cpu' : dimKey;
              params[paramName] = selectedValue;
            }
          }

          // 附带当前选中的 agent 名称（如果有）
          if (agentName) {
            params.agent_name = agentName;
          }

          // Debug: 打印即将发送的查询参数
          // eslint-disable-next-line no-console
          console.debug('getChart params:', params);

          const res = await getChart(params);
          if (!mounted) return;
          // 后端返回格式可能为 { total, data: [...] } 或直接为数组
          let rawPoints: any[] = [];
          if (res) {
            if (Array.isArray(res)) rawPoints = res;
            else if (Array.isArray((res as any).data)) rawPoints = (res as any).data;
          }

            // Debug: 打印后端原始点的时间戳样本，帮助定位后端返回是否为期望的不同时间戳
            // eslint-disable-next-line no-console
            console.log('rawPoints timestamps:', (rawPoints || []).slice(0, 20).map((r: any) => r && (r.timestamp ?? r.time ?? r.t)));
            // Debug: 打印后端原始点对象样本，检查字段和值是否被服务端重复或有异常
            // eslint-disable-next-line no-console
            console.debug('rawPoints sample:', (rawPoints || []).slice(0, 20));

          // 转换为图表需要的格式：{ time: Date, [dataKey]: value, ...tags }
          const mapped = (rawPoints || [])
            .map((d: any) => {
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
            .filter((p: any) => (typeof p.timestamp === 'number' && Number.isFinite(p.timestamp)) || (typeof p.value === 'number' && Number.isFinite(p.value)));

          // Debug: 打印 mapped 的时间戳样本
          // eslint-disable-next-line no-console
          console.debug('mapped timestamps:', mapped.map((m: any) => m.timestamp));

          // 按时间升序排序，保证点在 x 轴正确位置
          const sorted = mapped.sort((a: any, b: any) => (a.timestamp || a.time.getTime()) - (b.timestamp || b.time.getTime()));

          // Debug: 打印排序后的时间戳样本
          // eslint-disable-next-line no-console
          console.debug('sorted timestamps:', sorted.map((m: any) => m.timestamp).slice(0, 20));

          // 回退处理：如果后端返回的所有 timestamp 相同（会导致所有点重叠），
          // 则基于查询的 startTime/endTime 对点进行均匀分布时间戳分配，保证横轴有跨度。
          if (sorted.length > 1) {
            const tsList = sorted.map((p: any) => Number(p.timestamp || (p.time && p.time.getTime()))).filter(Boolean);
            const allEqual = tsList.length > 0 && tsList.every((t: number) => t === tsList[0]);
            if (allEqual) {
              try {
                let s = Number(startTime) || tsList[0];
                let e = Number(endTime) || tsList[0] + (sorted.length - 1) * 60000;
                if (e <= s) e = s + (sorted.length - 1) * 60000;
                const n = sorted.length;
                const interval = n > 1 ? Math.floor((e - s) / (n - 1)) : 60000;
                const redistributed = sorted.map((p: any, idx: number) => {
                  const newTs = s + idx * interval;
                  return { ...p, timestamp: newTs, time: new Date(newTs) };
                });
                // eslint-disable-next-line no-console
                console.warn('All timestamps identical; redistributed timestamps between', new Date(s), new Date(e));
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
          // eslint-disable-next-line no-console
          console.error('getChart error:', err);
          if (mounted) setChartPoints([]);
        } finally {
          if (mounted) setChartLoading(false);
        }
      };

      fetchChart();
      return () => {
        mounted = false;
      };
      // 依赖：选中标签、时间范围、是否自动刷新、metricTagsObj
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedValue, timeRange, autoRefresh, metricTagsObj]);

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
              value={selectedValue}
              onChange={(val) => setSelectedValue(val)}
              size="small"
              style={{ width: 160 }}
            >
              {
                // 渲染对应命名空间的维度值列表（例如 cpu.core、network.interface、disk.device）
                (() => {
                  const ns = chart.tag;
                  if (!metricTagsObj || !metricTagsObj[ns]) {
                    return [<Option key="-" value="">-</Option>];
                  }
                  const inner = metricTagsObj[ns];
                  const innerKeys = Object.keys(inner || {});
                  if (innerKeys.length === 0) return [<Option key="-" value="">-</Option>];
                  const list = inner[innerKeys[0]] || [];
                  return (list || []).map((v: any) => (
                    <Option key={String(v)} value={v}>
                      {String(v)}
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
          <ChartComponent
            {...getChartConfig(chart, chartPoints)}
            loading={chartLoading || loading}
          />
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
  const logColumns = [
    {
      title: '时间',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 100,
      sorter: (a: any, b: any) => a.timestamp.localeCompare(b.timestamp),
    },
    {
      title: '数值',
      dataIndex: 'value',
      key: 'value',
      width: 100,
      render: (value: any) => <Text strong>{value}</Text>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status: any) => <Badge color={getStatusColor(status)} text={status} />,
      filters: [
        { text: '正常', value: '正常' },
        { text: '警告', value: '警告' },
        { text: '错误', value: '错误' },
      ],
      onFilter: (value: any, record: any) => record.status === value,
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
      onFilter: (value: any, record: any) => record.operation === value,
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
      onFilter: (value: any, record: any) => record.source === value,
    },
    {
      title: '消息',
      dataIndex: 'message',
      key: 'message',
      ellipsis: true,
    },
  ];

  // 过滤显示的图表
  // 判断某个 chart 是否有可供选择的维度选项
  const chartHasOptions = (chart: any) => {
    if (!metricTagsObj) return true; // 未拉取到 metric tags 时，保留原有行为
    const ns = chart.tag;
    const inner = metricTagsObj[ns];
    if (!inner) return false;
    const innerKeys = Object.keys(inner || {});
    if (innerKeys.length === 0) return false;
    const list = inner[innerKeys[0]] || [];
    return Array.isArray(list) ? list.length > 0 : false;
  };

  const filteredCharts = chartConfigs.filter(
    (chart) => (selectedTags.includes('all') || selectedTags.includes(chart.tag)) && chartHasOptions(chart),
  );

  useEffect(() => {
    setLoading(true);

    const timer = setTimeout(() => {
      setMetricsData(generateMetricsData());
      setLoading(false);
    }, 500);

    let interval: any;
    if (autoRefresh) {
      interval = setInterval(() => {
        const newData = generateMetricsData().map((item) => ({
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

  // 从后端获取可用的 metric tags（ { cpu: {...}, network: {...} }）
  useEffect(() => {
    let mounted = true;
    const fetchTags = async () => {
      try {
        console.log('fetchTags: calling getMetricTags()');
        const res = await getMetricTags();
        console.log('Fetched metric tags:', res);
        if (!mounted) return;
        const keys = res && typeof res === 'object' && !Array.isArray(res) ? Object.keys(res) : [];
        setMetricTagKeys(keys);
        setMetricTagsObj(res || null);
      } catch (err) {
        // 失败时保留默认行为（不阻塞页面）
        // eslint-disable-next-line no-console
        console.error('getMetricTags error:', err);
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
                {displayTags.map((tag) => (
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
                    <span style={{ marginRight: 4 }}>{tag.icon}</span>
                    {tag.label}
                  </Tag.CheckableTag>
                ))}
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
