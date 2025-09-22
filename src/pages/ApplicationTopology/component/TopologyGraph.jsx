import { errorData, requestData } from '@/services/mock';
import { Area, Line } from '@ant-design/plots';
import { Card, Col, Drawer, Row, Select, Tabs } from 'antd'; // 引入抽屉组件
import dagre from 'dagre';
import { useEffect, useRef, useState } from 'react';
import ReactFlow, {
  Background,
  Controls,
  Handle,
  MiniMap,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from 'react-flow-renderer';
import 'react-flow-renderer/dist/style.css';
import EndpointMonitoringTable from './components/endpointTable.jsx';
import PointDrawer from './PointDrawer';

const formatNumber = (num) => {
  if (num >= 1000000) return (num / 1000000).toFixed(2) + 'm';
  if (num >= 1000) return (num / 1000).toFixed(2) + 'k';
  return num.toFixed(2);
};

// 自定义节点组件
const CustomNode = ({ data }) => {
  return (
    <div
      style={{
        padding: '10px',
        borderRadius: '6px',
        border: `2px solid ${data.errorRate > 0 ? '#ff4d4f' : '#52c41a'}`,
        width: 180,
        minHeight: 100,
        backgroundColor: data.errorRate > 0 ? '#fff1f0' : '#f6ffed',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        position: 'relative',
        transition: 'all 0.2s ease',
        cursor: 'pointer',
        '&:hover': {
          boxShadow: '0 6px 16px rgba(0,0,0,0.2)',
          transform: 'translateY(-4px)',
          borderWidth: '3px',
        },
      }}
    >
      {/* 顶部连接点（输入） */}
      <Handle
        type="target"
        position="top"
        style={{
          background: '#555',
          width: '10px',
          height: '10px',
          top: '-5px',
        }}
      />

      {/* 节点内容 */}
      <div style={{ fontWeight: 'bold', marginBottom: '6px', fontSize: '14px' }}>
        {data.containerName.replace('/', '')}
      </div>
      <div style={{ fontSize: '12px', color: '#666', marginBottom: '3px' }}>
        平均耗时: {formatNumber(data.avgDuration)}μs
      </div>
      <div style={{ fontSize: '12px', color: '#666', marginBottom: '3px' }}>
        QPS: {data.qps.toFixed(2)}
      </div>
      <div style={{ fontSize: '12px', color: data.errorCount > 0 ? '#f5222d' : '#666' }}>
        错误数: {data.errorCount} ({(data.errorRate * 100).toFixed(1)}%)
      </div>

      {/* 底部连接点（输出） */}
      <Handle
        type="source"
        position="bottom"
        style={{
          background: '#555',
          width: '10px',
          height: '10px',
          bottom: '-5px',
        }}
      />
    </div>
  );
};

// 节点类型映射
const nodeTypes = {
  customNode: CustomNode,
};

// 使用Dagre布局算法自动排列节点
const getLayoutedElements = (nodes, edges, direction = 'LR') => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  // 使用更宽松的布局参数
  dagreGraph.setGraph({
    rankdir: direction,
    nodesep: 80, // 增加节点间距
    ranksep: 120, // 增加层级间距
  });

  nodes.forEach((node) => {
    // 使用节点数据中存储的尺寸信息
    const width = node.data?.width || 180;
    const height = node.data?.height || 120;

    dagreGraph.setNode(node.id, { width, height });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  return nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - (node.data?.width || 180) / 2,
        y: nodeWithPosition.y - (node.data?.height || 120) / 2,
      },
    };
  });
};

// 拓扑图组件
const TopologyGraph = ({ nodeData, edgeData }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { fitView } = useReactFlow();
  const nodeRefs = useRef({});

  // 抽屉状态
  const [edgeDrawerVisible, setEdgeDrawerVisible] = useState(false);
  const [nodeDrawerVisible, setNodeDrawerVisible] = useState(false);
  const [selectedEdge, setSelectedEdge] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);

  // 边的悬停状态
  const [hoveredEdge, setHoveredEdge] = useState(null);
  const [edgeTooltipPosition, setEdgeTooltipPosition] = useState({ x: 0, y: 0 });
  // 活跃Tab状态
  const [activeTab, setActiveTab] = useState('metrics');

  // 时间段选择状态
  const [timeRange, setTimeRange] = useState('lastHour');
  // 图表数据状态
  const [chartData, setChartData] = useState({
    requestData, // type=count
    errorData: [], // type=statusCount
    latencyData: [], // type=latencyStats
  });
  const [chartLoading, setChartLoading] = useState(false);

  // 处理时间段变化
  const handleTimeRangeChange = (value) => {
    setTimeRange(value);
    // 这里可以添加根据时间段重新获取数据的逻辑
    console.log(`时间段已更改为: ${value}`);
  };

  // 初始化节点和边数据
  useEffect(() => {
    setLoading(true);
    setError(null);

    try {
      // 1. 创建节点 - 初始尺寸使用默认值
      const initialNodes = nodeData.map((node) => ({
        id: node.nodeId,
        type: 'customNode',
        data: {
          ...node,
          width: 180, // 默认宽度
          height: 120, // 默认高度
        },
        position: { x: 0, y: 0 },
      }));

      // 2. 创建边
      const initialEdges = [];

      Object.keys(edgeData).forEach((srcNodeId) => {
        const outEdges = edgeData[srcNodeId];

        outEdges.forEach((edge) => {
          const targetNodeExists = nodeData.some((node) => node.nodeId === edge.dstNodeId);

          if (targetNodeExists) {
            initialEdges.push({
              id: `${srcNodeId}-${edge.dstNodeId}`,
              source: srcNodeId,
              target: edge.dstNodeId,
              label: `QPS: ${edge.qps.toFixed(2)}`,
              data: { ...edge },
              style: {
                strokeWidth: Math.max(2, Math.min(5, 1 + edge.qps / 500)),
                stroke: edge.errorRate > 0 ? '#f5222d' : '#1890ff',
                // 添加箭头
                markerEnd: {
                  type: 'arrowclosed',
                  color: edge.errorRate > 0 ? '#f5222d' : '#1890ff',
                  width: 20,
                  height: 20,
                },
              },
              labelStyle: {
                background: 'rgba(255, 255, 255, 0.8)',
                padding: '2px 6px',
                borderRadius: '3px',
                fontSize: '12px',
              },
              animated: edge.qps > 100,
            });
          }
        });
      });

      // 3. 应用布局算法
      if (initialNodes.length > 0 && initialEdges.length > 0) {
        const layoutedNodes = getLayoutedElements(initialNodes, initialEdges);
        setNodes(layoutedNodes);
        setEdges(initialEdges);
      } else {
        setError('没有有效的节点或边数据');
      }
    } catch (e) {
      setError(`数据处理错误: ${e.message}`);
      console.error('拓扑图初始化错误:', e);
    } finally {
      setLoading(false);
    }
  }, [nodeData, edgeData]);

  // 在节点渲染后更新尺寸
  useEffect(() => {
    if (nodes.length > 0 && Object.keys(nodeRefs.current).length > 0) {
      const updatedNodes = nodes.map((node) => {
        const nodeRef = nodeRefs.current[node.id];
        if (nodeRef) {
          const rect = nodeRef.getBoundingClientRect();
          return {
            ...node,
            data: {
              ...node.data,
              width: rect.width,
              height: rect.height,
            },
          };
        }
        return node;
      });

      // 重新应用布局
      const layoutedNodes = getLayoutedElements(updatedNodes, edges);
      setNodes(layoutedNodes);

      // 适配视图
      setTimeout(() => {
        if (fitView) {
          fitView({ padding: 0.2, duration: 500 });
        }
      }, 100);
    }
  }, [nodes, edges]);

  // 重新布局函数
  const handleRelayout = () => {
    setLoading(true);
    const layoutedNodes = getLayoutedElements(nodes, edges);
    setNodes(layoutedNodes);

    setTimeout(() => {
      if (fitView) {
        fitView({ padding: 0.2, duration: 500 });
      }
      setLoading(false);
    }, 300);
  };

  // 处理边点击事件
  const handleEdgeClick = (event, edge) => {
    setSelectedEdge(edge);
    setEdgeDrawerVisible(true);
  };

  // 处理节点点击事件
  const handleNodeClick = (event, node) => {
    setSelectedNode(node);
    setNodeDrawerVisible(true);
  };

  // 处理边悬停事件
  const handleEdgeMouseEnter = (event, edge) => {
    setHoveredEdge(edge);
    setEdgeTooltipPosition({
      x: event.clientX,
      y: event.clientY,
    });
  };

  // 处理边离开事件
  const handleEdgeMouseLeave = (event, edge) => {
    setHoveredEdge(null);
  };

  // 处理边移动事件
  const handleEdgeMouseMove = (event, edge) => {
    setEdgeTooltipPosition({
      x: event.clientX,
      y: event.clientY,
    });
  };

  // 更新边的样式（添加悬停效果）
  const getEdgeStyle = (edge) => {
    const baseStyle = {
      strokeWidth: Math.max(2, Math.min(5, 1 + edge.data?.qps / 500)),
      stroke: edge.data?.errorRate > 0 ? '#f5222d' : '#1890ff',
      markerEnd: {
        type: 'arrowclosed',
        color: edge.data?.errorRate > 0 ? '#f5222d' : '#1890ff',
        width: 20,
        height: 20,
      },
      transition: 'all 0.3s ease',
      cursor: 'pointer', // 添加手形指针
    };

    // 添加悬停效果
    if (hoveredEdge && hoveredEdge.id === edge.id) {
      return {
        ...baseStyle,
        strokeWidth: baseStyle.strokeWidth + 3, // 增加线宽
        stroke: edge.data?.errorRate > 0 ? '#ff0000' : '#40a9ff', // 更亮的颜色
        opacity: 1,
        filter: 'drop-shadow(0 0 4px rgba(0, 0, 0, 0.3))', // 添加阴影效果
      };
    }

    return baseStyle;
  };

  function transformData(originalData) {
    // 创建一个空数组来存储转换后的结果
    const transformedData = [];

    // 遍历原始数据中的每个状态码对象
    for (const statusObj of originalData) {
      const statusCode = statusObj.statusCode;

      // 遍历该状态码下的每个时间桶数据
      for (const timeBucket of statusObj.timeBuckets) {
        // 创建一个新对象，将状态码作为 type，并包含时间戳和文档计数
        const newObj = {
          type: statusCode,
          timeKey: timeBucket.timeKey,
          docCount: timeBucket.docCount,
        };

        // 将新对象添加到结果数组中
        transformedData.push(newObj);
      }
    }

    return transformedData;
  }

  // 图表配置
  const requestChartConfig = {
    data: requestData,
    xField: 'timeKey',
    yField: 'docCount',
    height: 200,
    // 新增：配置x轴为时间类型，并格式化显示
    xAxis: {
      type: 'time', // 指定为时间类型
      label: {
        formatter: (v) => {
          // 将时间戳转换为可读格式
          return new Date(v).toLocaleTimeString('zh-CN', {
            hour: '2-digit',
            minute: '2-digit',
          });
        },
      },
    },
    yAxis: {
      label: {
        style: { fontSize: 12 },
        formatter: (value) => `${value} 次`, // y轴标签添加单位（如 "166 次"）
      },
    },
    point: {
      shapeField: 'square',
      sizeField: 4,
    },
    interaction: {
      tooltip: {
        marker: false,
        // 优化tooltip：显示格式化时间和请求数
        formatter: (datum) => {
          const formatTime = new Date(datum.timeKey).toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
          });
          return [
            { name: '时间', value: formatTime },
            { name: '请求数', value: `${datum.docCount} 次` },
          ];
        },
      },
    },
    style: {
      lineWidth: 2,
    },
  };
  // 1. 先确保转换后的数据格式正确（复用你的 transformData 函数，无需修改）
  const transformedErrorData = transformData(errorData);

  // 2. 优化后的错误数图表配置（多线折线图）
  const errorChartConfig = {
    data: transformedErrorData, // 转换后的数据（含 type、timeKey、docCount）
    xField: 'timeKey', // X轴：时间戳
    yField: 'docCount', // Y轴：错误数
    seriesField: 'type', // 核心：按状态码（type）分组，生成多条线
    height: 200,
    // 3. 自定义每条线的颜色（按状态码分配，区分明显）
    color: ({ type }) => {
      const colorMap = {
        200: '#1890ff', // 200状态码：蓝色
        201: '#52c41a', // 201状态码：绿色
        404: '#faad14', // 若后续有404：橙色（提前预留）
        500: '#ff4d4f', // 若后续有500：红色（提前预留）
      };
      return colorMap[type] || '#8c8c8c'; // 默认：灰色
    },
    // 4. 折线样式优化（线条宽度、点样式）
    line: {
      style: {
        lineWidth: 2, // 线条宽度，确保清晰
      },
    },
    // 5. 数据点样式（统一形状，按分组区分颜色）
    point: {
      shape: 'circle', // 点形状：圆形（比方形更友好）
      size: 4, // 点大小：适中，避免遮挡
      fill: ({ type }) => {
        // 点填充色与线条色一致
        const colorMap = {
          200: '#1890ff',
          201: '#52c41a',
          404: '#faad14',
          500: '#ff4d4f',
        };
        return colorMap[type] || '#8c8c8c';
      },
      stroke: '#fff', // 点边框：白色，增强立体感
      strokeWidth: 1,
    },
    // 6. X轴配置（时间格式化，与请求数图表保持一致）
    xAxis: {
      type: 'time',
      tickCount: 5, // 控制刻度数量，避免标签重叠
      label: {
        fontSize: 12,
        formatter: (timestamp) => {
          // 时间格式：仅显示时分（适合当天内数据，若跨天可加年月日）
          return new Date(timestamp).toLocaleTimeString('zh-CN', {
            hour: '2-digit',
            minute: '2-digit',
          });
        },
      },
      range: [0.05, 0.95], // 轴两端留空白，避免数据贴边
    },
    // 7. Y轴配置（从0开始，添加单位）
    yAxis: {
      label: {
        fontSize: 12,
        formatter: (value) => `${value} 次`, // 单位：次
      },
      min: 0, // Y轴从0开始，避免数据比例失真
      tickCount: 4, // 控制Y轴刻度数量
    },
    // 8. 图例配置（显示状态码，支持交互）
    legend: {
      position: 'top', // 图例位置：顶部（可选 right/left/bottom）
      title: {
        text: '响应状态码', // 图例标题，明确含义
        fontSize: 12,
        padding: [0, 0, 4, 0], // 标题与图例间距
      },
      label: {
        fontSize: 12,
        formatter: (type) => `状态码 ${type}`, // 图例文本：优化为“状态码 200”
      },
      interactive: true, // 支持点击图例隐藏/显示对应线条
    },
    // 9. Tooltip 配置（显示完整信息）
    interaction: {
      tooltip: {
        marker: true, // 显示 tooltip 对应的点标记
        formatter: (datum) => {
          // 格式化时间：显示完整年月日时分秒
          const fullTime = new Date(datum.timeKey).toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          });
          return [
            { name: '时间', value: fullTime },
            { name: '响应状态码', value: datum.type },
            { name: '错误数', value: `${datum.docCount} 次` },
          ];
        },
      },
    },
    // 10. 网格线配置（辅助读数，降低透明度避免干扰）
    grid: {
      horizontal: {
        visible: true,
        style: {
          stroke: '#e8e8e8',
          opacity: 0.5,
        },
      },
      vertical: {
        visible: false, // 隐藏垂直网格线，保持图表简洁
      },
    },
  };

  const latencyChartConfig = {
    data: chartData.latencyData,
    xField: 'time',
    yField: 'latency',
    seriesField: 'type',
    height: 200,
    color: ['#1979C9', '#D62A0D', '#FAA219'],
    xAxis: {
      label: {
        autoRotate: false,
      },
    },
    tooltip: {
      formatter: (datum) => {
        return { name: datum.type, value: `${datum.latency.toFixed(2)}ms` };
      },
    },
  };

  return (
    <div
      style={{
        width: '100%',
        height: '700px',
        position: 'relative',
        backgroundColor: '#fafafa',
        border: '1px solid #f0f0f0',
        borderRadius: 4,
      }}
    >
      {/* 全局样式 - 添加悬停效果 */}
      <style>
        {`
          .react-flow__edge:hover path {
            stroke-width: ${hoveredEdge ? '5px' : 'initial'} !important;
            opacity: ${hoveredEdge ? '1' : 'initial'} !important;
            filter: drop-shadow(0 0 4px rgba(0, 0, 0, 0.3)) !important;
          }
          
          .react-flow__edge:hover .react-flow__edge-label {
            background: rgba(255, 255, 255, 0.95) !important;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2) !important;
            font-weight: bold !important;
            transform: scale(1.05) !important;
            transition: all 0.3s ease !important;
          }
          
          .react-flow__edge:hover .react-flow__edge-path {
            stroke-width: 5px !important;
          }
          
          /* 添加手形指针 */
          .react-flow__edge {
            cursor: pointer;
          }
        `}
      </style>

      {/* 边信息提示框 */}
      {hoveredEdge && (
        <div
          style={{
            position: 'fixed',
            left: edgeTooltipPosition.x + 15,
            top: edgeTooltipPosition.y - 60,
            zIndex: 100,
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            padding: '10px',
            borderRadius: '4px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            border: '1px solid #e8e8e8',
            minWidth: '200px',
            pointerEvents: 'none',
            transform: 'translateY(-50%)',
            transition: 'opacity 0.3s ease',
          }}
        >
          <div style={{ fontWeight: 'bold', marginBottom: '5px', fontSize: '14px' }}>连接信息</div>
          <div style={{ fontSize: '12px', marginBottom: '3px' }}>
            <strong>源节点:</strong> {hoveredEdge.source}
          </div>
          <div style={{ fontSize: '12px', marginBottom: '3px' }}>
            <strong>目标节点:</strong> {hoveredEdge.target}
          </div>
          <div style={{ fontSize: '12px', marginBottom: '3px' }}>
            <strong>QPS:</strong> {hoveredEdge.data?.qps?.toFixed(2)}
          </div>
          <div style={{ fontSize: '12px', marginBottom: '3px' }}>
            <strong>平均耗时:</strong> {hoveredEdge.data?.avgDuration?.toFixed(2)}μs
          </div>
          <div style={{ fontSize: '12px', marginBottom: '3px' }}>
            <strong>错误率:</strong> {(hoveredEdge.data?.errorRate * 100).toFixed(2)}%
          </div>
          <div style={{ fontSize: '12px', marginBottom: '3px' }}>
            <strong>错误次数:</strong> {hoveredEdge.data?.errorCount}
          </div>
        </div>
      )}

      {loading && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.7)',
            zIndex: 10,
          }}
        >
          <div className="ant-spin ant-spin-lg ant-spin-spinning">
            <span className="ant-spin-dot ant-spin-dot-spin">
              <i className="ant-spin-dot-item"></i>
              <i className="ant-spin-dot-item"></i>
              <i className="ant-spin-dot-item"></i>
              <i className="ant-spin-dot-item"></i>
            </span>
            <div className="ant-spin-text">正在生成拓扑图...</div>
          </div>
        </div>
      )}

      {error && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            zIndex: 10,
            flexDirection: 'column',
            padding: 20,
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <svg width="64" height="41" viewBox="0 0 64 41" xmlns="http://www.w3.org/2000/svg">
              <g transform="translate(0 1)" fill="none" fillRule="evenodd">
                <ellipse fill="#f5f5f5" cx="32" cy="33" rx="32" ry="7"></ellipse>
                <g fillRule="nonzero" stroke="#d9d9d9">
                  <path d="M55 12.76L44.854 1.258C44.367.474 43.656 0 42.907 0H21.093c-.749 0-1.46.474-1.947 1.257L9 12.761V22h46v-9.24z"></path>
                  <path
                    d="M41.613 15.931c0-1.605.994-2.93 2.227-2.931H55v18.137C55 33.26 53.68 35 52.05 35h-40.1C10.32 35 9 33.259 9 31.137V13h11.16c1.233 0 2.227 1.323 2.227 2.928v.022c0 1.605 1.005 2.901 2.237 2.901h14.752c1.232 0 2.237-1.308 2.237-2.913v-.007z"
                    fill="#fafafa"
                  ></path>
                </g>
              </g>
            </svg>
            <div style={{ marginTop: 8 }}>
              <h3>拓扑图加载失败</h3>
              <p>{error}</p>
              <p>请检查节点和边数据格式</p>
            </div>
          </div>
          <button
            type="button"
            className="ant-btn ant-btn-primary"
            style={{ marginTop: 20 }}
            onClick={() => window.location.reload()}
          >
            <span>重新加载</span>
          </button>
        </div>
      )}

      <ReactFlow
        nodes={nodes}
        edges={edges.map((edge) => ({
          ...edge,
          style: getEdgeStyle(edge),
        }))}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        onEdgeClick={handleEdgeClick}
        onNodeClick={handleNodeClick}
        onEdgeMouseEnter={handleEdgeMouseEnter}
        onEdgeMouseLeave={handleEdgeMouseLeave}
        onEdgeMouseMove={handleEdgeMouseMove}
        fitView
        minZoom={0.1}
        maxZoom={2}
        nodeExtent={[
          [-1000, -1000],
          [1000, 1000],
        ]}
      >
        <Controls />
        <MiniMap
          nodeColor={(node) => {
            return node.data.errorRate > 0 ? '#fff1f0' : '#f6ffed';
          }}
          style={{ backgroundColor: 'rgba(255,255,255,0.8)' }}
        />
        <Background color="#f0f0f0" gap={16} />
      </ReactFlow>

      <button
        type="button"
        className="ant-btn ant-btn-primary"
        style={{
          position: 'absolute',
          top: 10,
          right: 10,
          zIndex: 5,
        }}
        onClick={handleRelayout}
      >
        <span>重新布局</span>
      </button>

      {/* 边详情抽屉 */}
      <Drawer
        title="连接详情"
        width={500}
        placement="right"
        closable={true}
        onClose={() => setEdgeDrawerVisible(false)}
        visible={edgeDrawerVisible}
      >
        {selectedEdge && <div></div>}
      </Drawer>

      {/* 节点详情抽屉 */}
      <Drawer
        title="节点详情"
        width={1500}
        placement="right"
        closable={true}
        onClose={() => setNodeDrawerVisible(false)}
        visible={nodeDrawerVisible}
      >
        {selectedNode && (
          <div>
            {/* 在Tabs上方添加时间段选择器 */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                marginBottom: 16,
                padding: '0 20px',
              }}
            >
              <Select value={timeRange} onChange={handleTimeRangeChange} style={{ width: 200 }}>
                <Select.Option value="lastHour">最近1小时</Select.Option>
                <Select.Option value="lastDay">最近1天</Select.Option>
                <Select.Option value="lastWeek">最近1周</Select.Option>
                <Select.Option value="lastMonth">最近1月</Select.Option>
                <Select.Option value="custom">自定义时间段</Select.Option>
              </Select>
            </div>

            <Tabs
              activeKey={activeTab}
              onChange={setActiveTab}
              tabPosition="top"
              style={{ marginTop: -16 }}
            >
              <Tabs.TabPane tab="应用指标" key="metrics">
                <div style={{ padding: '20px' }}>
                  <h3>指标曲线</h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
                    <Row gutter={16} style={{ marginBottom: 16, width: '100%' }}>
                      <Col span={8}>
                        <Card
                          title="请求数"
                          size="small"
                          // extra={<span style={{ color: '#1890ff' }}>总数: {totalRequests}</span>}
                        >
                          {/* <div style={{ width: '100%', height: '100%' }}> */}
                          <Line
                            {...requestChartConfig}
                            loading={chartLoading}
                            style={{ height: 200 }}
                          />
                          {/* </div> */}
                        </Card>
                      </Col>
                      <Col span={8}>
                        <Card
                          title="错误数"
                          size="small"
                          // extra={<span style={{ color: '#ff4d4f' }}>总数: {totalErrors}</span>}
                        >
                          <Line
                            {...errorChartConfig}
                            loading={chartLoading}
                            style={{ height: 200 }}
                          />
                        </Card>
                      </Col>
                      <Col span={8}>
                        <Card
                          title="响应时延"
                          size="small"
                          // extra={<span style={{ color: '#faad14' }}>平均: {avgLatency}ms</span>}
                        >
                          <Area
                            {...latencyChartConfig}
                            loading={chartLoading}
                            style={{ height: 200 }}
                          />
                        </Card>
                      </Col>
                    </Row>
                  </div>
                  <h3 style={{ marginTop: '30px' }}>性能指标</h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
                    <div
                      style={{
                        backgroundColor: '#f0f9ff',
                        padding: '15px',
                        borderRadius: '8px',
                        width: '200px',
                      }}
                    >
                      <div style={{ fontSize: '14px', color: '#666' }}>平均耗时</div>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', marginTop: '5px' }}>
                        {formatNumber(selectedNode.data.avgDuration)}μs
                      </div>
                    </div>

                    <div
                      style={{
                        backgroundColor: '#f6ffed',
                        padding: '15px',
                        borderRadius: '8px',
                        width: '200px',
                      }}
                    >
                      <div style={{ fontSize: '14px', color: '#666' }}>QPS</div>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', marginTop: '5px' }}>
                        {selectedNode.data.qps.toFixed(2)}
                      </div>
                    </div>

                    <div
                      style={{
                        backgroundColor: selectedNode.data.errorRate > 0 ? '#fff1f0' : '#f6ffed',
                        padding: '15px',
                        borderRadius: '8px',
                        width: '200px',
                      }}
                    >
                      <div style={{ fontSize: '14px', color: '#666' }}>错误率</div>
                      <div
                        style={{
                          fontSize: '24px',
                          fontWeight: 'bold',
                          marginTop: '5px',
                          color: selectedNode.data.errorRate > 0 ? '#f5222d' : '#52c41a',
                        }}
                      >
                        {(selectedNode.data.errorRate * 100).toFixed(1)}%
                      </div>
                    </div>

                    <div
                      style={{
                        backgroundColor: '#fff7e6',
                        padding: '15px',
                        borderRadius: '8px',
                        width: '200px',
                      }}
                    >
                      <div style={{ fontSize: '14px', color: '#666' }}>错误数</div>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', marginTop: '5px' }}>
                        {selectedNode.data.errorCount}
                      </div>
                    </div>
                  </div>

                  <h3 style={{ marginTop: '30px' }}>资源使用</h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
                    <div
                      style={{
                        backgroundColor: '#f0f9ff',
                        padding: '15px',
                        borderRadius: '8px',
                        width: '200px',
                      }}
                    >
                      <div style={{ fontSize: '14px', color: '#666' }}>CPU使用率</div>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', marginTop: '5px' }}>
                        45.2%
                      </div>
                    </div>

                    <div
                      style={{
                        backgroundColor: '#f6ffed',
                        padding: '15px',
                        borderRadius: '8px',
                        width: '200px',
                      }}
                    >
                      <div style={{ fontSize: '14px', color: '#666' }}>内存使用</div>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', marginTop: '5px' }}>
                        1.2GB
                      </div>
                    </div>

                    <div
                      style={{
                        backgroundColor: '#fff7e6',
                        padding: '15px',
                        borderRadius: '8px',
                        width: '200px',
                      }}
                    >
                      <div style={{ fontSize: '14px', color: '#666' }}>网络流量</div>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', marginTop: '5px' }}>
                        12.4MB/s
                      </div>
                    </div>
                  </div>
                </div>
              </Tabs.TabPane>

              <Tabs.TabPane tab="端点列表" key="endpoints">
                <EndpointMonitoringTable></EndpointMonitoringTable>
              </Tabs.TabPane>

              <Tabs.TabPane tab="调用日志" key="logs">
                <PointDrawer />
              </Tabs.TabPane>
            </Tabs>
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default TopologyGraph;
