import { errorData, requestData } from '@/services/mock';
import { Area, Line } from '@ant-design/plots';
import { Card, Col, Drawer, Row, Select, Tabs, Tooltip, Button } from 'antd';
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

// 布局算法配置
const LAYOUT_CONFIG = {
  dagre: {
    name: '层次布局',
    description: '有向分层布局，层次清晰，适合展示调用流向',
    direction: 'LR',
    icon: '📊',
    recommendedFor: '小到中等规模（≤30节点）'
  },
  circular: {
    name: '圆形布局', 
    description: '节点均匀分布在圆周上，结构对称美观',
    icon: '⭕',
    recommendedFor: '中等规模（10-50节点）'
  },
  grid: {
    name: '网格布局',
    description: '整齐的网格排列，便于查看大规模节点',
    icon: '🔲',
    recommendedFor: '大规模（30-100节点）'
  },
  force: {
    name: '力导向布局',
    description: '模拟物理力场，自动避免重叠，适合复杂关系',
    icon: '⚛️',
    recommendedFor: '超大规模或复杂关系（>50节点）'
  }
};

// 改进的Dagre布局算法 - 层次布局
const getDagreLayout = (nodes, edges, direction = 'LR') => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  // 根据节点数量动态调整布局参数
  const nodeCount = nodes.length;
  const baseNodeSep = 100;
  const baseRankSep = 120;
  
  const dynamicNodeSep = baseNodeSep + Math.min(nodeCount * 3, 150);
  const dynamicRankSep = baseRankSep + Math.min(nodeCount * 4, 200);

  dagreGraph.setGraph({
    rankdir: direction,
    nodesep: dynamicNodeSep,
    ranksep: dynamicRankSep,
    marginx: 60,
    marginy: 60,
    align: 'UL',
    acyclicer: 'greedy',
    ranker: 'network-simplex'
  });

  nodes.forEach((node) => {
    const width = node.data?.width || 200;
    const height = node.data?.height || 140;
    dagreGraph.setNode(node.id, { width, height });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  try {
    dagre.layout(dagreGraph);

    return nodes.map((node) => {
      const nodeWithPosition = dagreGraph.node(node.id);
      const width = node.data?.width || 200;
      const height = node.data?.height || 140;
      
      return {
        ...node,
        position: {
          x: nodeWithPosition.x - width / 2,
          y: nodeWithPosition.y - height / 2,
        },
      };
    });
  } catch (error) {
    console.error('Dagre布局失败，使用圆形布局:', error);
    return getCircularLayout(nodes, edges);
  }
};

// 圆形布局
const getCircularLayout = (nodes, edges) => {
  const centerX = 800;
  const centerY = 400;
  const radius = Math.min(600, Math.max(300, nodes.length * 40));
  
  return nodes.map((node, index) => {
    const angle = (index * 2 * Math.PI) / nodes.length;
    const width = node.data?.width || 200;
    const height = node.data?.height || 140;
    
    return {
      ...node,
      position: {
        x: centerX + radius * Math.cos(angle) - width / 2,
        y: centerY + radius * Math.sin(angle) - height / 2
      }
    };
  });
};

// 网格布局
const getGridLayout = (nodes, edges) => {
  const cols = Math.ceil(Math.sqrt(nodes.length));
  const nodeWidth = 200;
  const nodeHeight = 140;
  const horizontalSpacing = 280;
  const verticalSpacing = 220;
  
  return nodes.map((node, index) => {
    const row = Math.floor(index / cols);
    const col = index % cols;
    return {
      ...node,
      position: {
        x: col * horizontalSpacing + 50,
        y: row * verticalSpacing + 50
      }
    };
  });
};

// 力导向布局模拟
const getForceDirectedLayout = (nodes, edges, iterations = 100) => {
  const centerX = 800;
  const centerY = 400;
  const k = 300;
  const repulsion = 10000;
  
  let positionedNodes = nodes.map(node => ({
    ...node,
    position: {
      x: centerX + (Math.random() - 0.5) * 600,
      y: centerY + (Math.random() - 0.5) * 400
    }
  }));

  for (let iter = 0; iter < iterations; iter++) {
    positionedNodes = positionedNodes.map((node, i) => {
      let fx = 0, fy = 0;
      
      positionedNodes.forEach((otherNode, j) => {
        if (i !== j) {
          const dx = node.position.x - otherNode.position.x;
          const dy = node.position.y - otherNode.position.y;
          const distance = Math.sqrt(dx * dx + dy * dy) || 0.1;
          
          if (distance < 200) {
            const force = repulsion / (distance * distance);
            fx += (dx / distance) * force;
            fy += (dy / distance) * force;
          }
        }
      });

      edges.forEach(edge => {
        if (edge.source === node.id || edge.target === node.id) {
          const targetId = edge.source === node.id ? edge.target : edge.source;
          const targetNode = positionedNodes.find(n => n.id === targetId);
          if (targetNode) {
            const dx = targetNode.position.x - node.position.x;
            const dy = targetNode.position.y - node.position.y;
            const distance = Math.sqrt(dx * dx + dy * dy) || 0.1;
            
            const force = k * Math.log(distance / 200);
            fx += (dx / distance) * force;
            fy += (dy / distance) * force;
          }
        }
      });

      const dxCenter = centerX - node.position.x;
      const dyCenter = centerY - node.position.y;
      const centerForce = 0.01;
      fx += dxCenter * centerForce;
      fy += dyCenter * centerForce;

      const maxForce = 10;
      fx = Math.max(-maxForce, Math.min(maxForce, fx));
      fy = Math.max(-maxForce, Math.min(maxForce, fy));

      return {
        ...node,
        position: {
          x: node.position.x + fx * 0.1,
          y: node.position.y + fy * 0.1
        }
      };
    });
  }

  return positionedNodes;
};

// 拓扑图组件
const TopologyGraph = ({ nodeData, edgeData, startTime, endTime, layoutType = 'dagre' }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentLayout, setCurrentLayout] = useState(layoutType);
  const { fitView } = useReactFlow();

  // 抽屉状态
  const [edgeDrawerVisible, setEdgeDrawerVisible] = useState(false);
  const [nodeDrawerVisible, setNodeDrawerVisible] = useState(false);
  const [selectedEdge, setSelectedEdge] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);

  // 边的悬停状态
  const [hoveredEdge, setHoveredEdge] = useState(null);
  const [edgeTooltipPosition, setEdgeTooltipPosition] = useState({ x: 0, y: 0 });

  // 应用布局算法
  const applyLayout = (nodes, edges, layoutType) => {
    console.log(`应用布局: ${LAYOUT_CONFIG[layoutType].name}, 节点数: ${nodes.length}`);

    switch (layoutType) {
      case 'circular':
        return getCircularLayout(nodes, edges);
      case 'grid':
        return getGridLayout(nodes, edges);
      case 'force':
        return getForceDirectedLayout(nodes, edges);
      case 'dagre':
      default:
        return getDagreLayout(nodes, edges, nodes.length > 20 ? 'TB' : 'LR');
    }
  };

  // 初始化节点和边数据
  useEffect(() => {
    setLoading(true);
    setError(null);

    try {
      // 创建节点
      const initialNodes = nodeData.map((node) => ({
        id: node.nodeId,
        type: 'customNode',
        data: {
          ...node,
          width: 200,
          height: 140,
        },
        position: { x: 0, y: 0 },
      }));

      // 创建边
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

      // 应用布局算法
      if (initialNodes.length > 0) {
        const layoutedNodes = applyLayout(initialNodes, initialEdges, currentLayout);
        setNodes(layoutedNodes);
        setEdges(initialEdges);
        
        setTimeout(() => {
          if (fitView) {
            fitView({ 
              padding: 0.3, 
              duration: 800,
            });
          }
        }, 300);
      } else {
        setError('没有有效的节点数据');
      }
    } catch (e) {
      setError(`数据处理错误: ${e.message}`);
      console.error('拓扑图初始化错误:', e);
    } finally {
      setLoading(false);
    }
  }, [nodeData, edgeData, currentLayout]);

  // 重新布局函数
  const handleRelayout = (newLayoutType = null) => {
    setLoading(true);
    const actualLayoutType = newLayoutType || currentLayout;
    
    const layoutedNodes = applyLayout(nodes, edges, actualLayoutType);
    setNodes(layoutedNodes);
    if (newLayoutType) {
      setCurrentLayout(newLayoutType);
    }

    setTimeout(() => {
      if (fitView) {
        fitView({ padding: 0.3, duration: 800 });
      }
      setLoading(false);
    }, 500);
  };

  // 处理边点击事件
  const handleEdgeClick = (event, edge) => {
    const edgeWithType = {
      ...edge,
      pointType: 'edge'
    };
    setSelectedEdge(edgeWithType);
    setEdgeDrawerVisible(true);
  };

  // 处理节点点击事件
  const handleNodeClick = (event, node) => {
    const nodeWithType = {
      ...node,
      pointType: 'node'
    };
    setSelectedNode(nodeWithType);
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

  const handleEdgeMouseLeave = () => {
    setHoveredEdge(null);
  };

  const handleEdgeMouseMove = (event) => {
    setEdgeTooltipPosition({
      x: event.clientX,
      y: event.clientY,
    });
  };

  // 更新边的样式
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
      cursor: 'pointer',
    };

    if (hoveredEdge && hoveredEdge.id === edge.id) {
      return {
        ...baseStyle,
        strokeWidth: baseStyle.strokeWidth + 3,
        stroke: edge.data?.errorRate > 0 ? '#ff0000' : '#40a9ff',
        opacity: 1,
        filter: 'drop-shadow(0 0 4px rgba(0, 0, 0, 0.3))',
      };
    }

    return baseStyle;
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
      {/* 全局样式 */}
      <style>
        {`
          .react-flow__edge:hover path {
            stroke-width: ${hoveredEdge ? '5px' : 'initial'} !important;
            opacity: ${hoveredEdge ? '1' : 'initial'} !important;
            filter: drop-shadow(0 0 4px rgba(0, 0, 0, 0.3)) !important;
          }
          
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
            <h3>拓扑图加载失败</h3>
            <p>{error}</p>
          </div>
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
        minZoom={0.05}
        maxZoom={3}
        nodeExtent={[
          [-2000, -2000],
          [2000, 2000]
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

      {/* 布局控制面板 */}
      <div
        style={{
          position: 'absolute',
          top: 10,
          right: 10,
          zIndex: 5,
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          padding: '12px',
          borderRadius: '6px',
          border: '1px solid #d9d9d9',
          minWidth: '200px',
        }}
      >
        {/* 当前布局信息 */}
        <div style={{ marginBottom: '8px', paddingBottom: '8px', borderBottom: '1px solid #f0f0f0' }}>
          <div style={{ fontWeight: 'bold', fontSize: '14px' }}>
            {LAYOUT_CONFIG[currentLayout].icon} 当前布局: {LAYOUT_CONFIG[currentLayout].name}
          </div>
          <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>
            {LAYOUT_CONFIG[currentLayout].recommendedFor}
          </div>
        </div>

        {/* 布局切换按钮 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {Object.entries(LAYOUT_CONFIG).map(([key, config]) => (
            <Tooltip 
              key={key}
              title={
                <div>
                  <div style={{ fontWeight: 'bold' }}>{config.name}</div>
                  <div>{config.description}</div>
                  <div style={{ color: '#52c41a', marginTop: '4px' }}>
                    推荐: {config.recommendedFor}
                  </div>
                </div>
              }
              placement="left"
              color="blue"
            >
              <Button
                size="small"
                type={currentLayout === key ? 'primary' : 'default'}
                onClick={() => handleRelayout(key)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                  textAlign: 'left',
                  height: 'auto',
                  padding: '6px 8px',
                }}
              >
                <span style={{ marginRight: '6px', fontSize: '14px' }}>{config.icon}</span>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '12px', fontWeight: currentLayout === key ? 'bold' : 'normal' }}>
                    {config.name}
                  </span>
                  <span style={{ fontSize: '10px', color: '#666' }}>
                    {config.recommendedFor}
                  </span>
                </div>
              </Button>
            </Tooltip>
          ))}
        </div>

        {/* 重新布局按钮 */}
        <Button
          type="dashed"
          size="small"
          onClick={() => handleRelayout()}
          style={{ marginTop: '8px' }}
        >
          🔄 重新应用当前布局
        </Button>
      </div>

      {/* 统计信息 */}
      <div
        style={{
          position: 'absolute',
          bottom: 10,
          left: 10,
          zIndex: 5,
          backgroundColor: 'rgba(255,255,255,0.9)',
          padding: '8px 12px',
          borderRadius: '4px',
          fontSize: '12px',
          border: '1px solid #d9d9d9',
          display: 'flex',
          gap: '12px',
        }}
      >
        <span>节点: <strong>{nodes.length}</strong></span>
        <span>边: <strong>{edges.length}</strong></span>
        <span>布局: <strong>{LAYOUT_CONFIG[currentLayout].name}</strong></span>
      </div>

      {/* 边详情抽屉 */}
      <Drawer
        title="连接详情"
        width={1500}
        placement="right"
        closable={true}
        onClose={() => setEdgeDrawerVisible(false)}
        visible={edgeDrawerVisible}
      >
        {selectedEdge && (
          <PointDetailDrawer selectedObj={selectedEdge} />
        )}
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
          <PointDetailDrawer selectedObj={selectedNode} />
        )}
      </Drawer>
    </div>
  );
};

export default TopologyGraph;