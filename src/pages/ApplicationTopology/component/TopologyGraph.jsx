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
import PointDetailDrawer from './PointDetailDrawer';

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
        width={1500}
        placement="right"
        closable={true}
        onClose={() => setEdgeDrawerVisible(false)}
        visible={edgeDrawerVisible}
      >
        {selectedEdge && <div>
            <PointDetailDrawer
              selectedObj={selectedEdge}
            ></PointDetailDrawer>
          </div>}
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
            <PointDetailDrawer
              selectedObj={selectedNode}
            ></PointDetailDrawer>
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default TopologyGraph;
