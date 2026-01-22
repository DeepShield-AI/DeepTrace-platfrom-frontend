import React from 'react';
import { Card, Badge, Popover, Space, Tag, Tooltip, Progress, Typography } from 'antd';
import { CloudServerOutlined, CodeOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import useResizeObserver from '../../hooks/useResizeObserver';

const { Meta } = Card as any;
const { Text } = Typography as any;

type Props = {
  container: any;
  cardLoading: Record<string, boolean>;
  hoveredCard: string | null;
  setHoveredCard: (s: string | null) => void;
  handleCardClick: (containerId: string, machineId: string) => void;
  getProgressColor: (usage: number) => string;
  formatNumber: (num: any) => string;
  checkContainerAnomalies: (c: any) => any[];
  getStatusText: (s: string) => string;
  getStatusColor: (s: string) => string;
  businessData: Record<string, any>;
};

const SkeletonPlaceholder: React.FC = () => (
  <Card style={{ minHeight: '520px', height: '100%', borderRadius: '8px', overflow: 'hidden' }}>
    <div style={{ background: 'linear-gradient(135deg, #f0f8ff 0%, #e6f7ff 100%)', padding: '20px', textAlign: 'center', height: '100px' }} />
  </Card>
);

const ContainerCard: React.FC<Props> = ({
  container,
  cardLoading,
  hoveredCard,
  setHoveredCard,
  handleCardClick,
  getProgressColor,
  formatNumber,
  checkContainerAnomalies,
  getStatusText,
  getStatusColor,
  businessData
}) => {
  const [rootRef] = useResizeObserver<HTMLDivElement>();
  const containerKey = container.id;
  const isLoading = (cardLoading || {})[containerKey];

  if (isLoading) return <SkeletonPlaceholder />;

  return (
    <div ref={rootRef} style={{ display: 'flex', flexDirection: 'column', height: '520px' }}>
      <Card
        hoverable
        onClick={() => handleCardClick(container.id, container.id)}
        style={{
          height: '100%',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          borderRadius: '8px',
          overflow: 'hidden',
          border: '1px solid #e8e8e8',
          boxShadow: '0 2px 8px rgba(0,0,0,0.09)',
          display: 'flex',
          flexDirection: 'column'
        }}
        cover={
          <div style={{
            background: 'linear-gradient(135deg, #f0f8ff 0%, #e6f7ff 100%)',
            padding: '20px',
            textAlign: 'center',
            position: 'relative',
            flexShrink: 0,
            height: '100px'
          }}>
            <CloudServerOutlined style={{ fontSize: '48px', color: '#69c0ff' }} />
          </div>
        }
      >
        <Meta
          title={
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <Space>
                <CodeOutlined style={{ color: '#69c0ff' }} />
                <span style={{ fontWeight: 600, fontSize: 16 }}>{container.name}</span>
              </Space>
            </Space>
          }
          description={
            <div style={{ marginTop: '12px', flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
              <div style={{ color: '#8c8c8c', fontSize: 13, marginBottom: 8 }}><b>操作系统：</b>{container.os || '-'}</div>
              <div style={{ color: '#8c8c8c', fontSize: 13, marginBottom: 8 }}><b>内存：</b>{container.memorySize || '-'}</div>
              <div style={{ color: '#8c8c8c', fontSize: 13, marginBottom: 8 }}><b>CPU：</b>{container.cpuNum || '-'}</div>
              <div style={{ color: '#8c8c8c', fontSize: 13, marginBottom: 8 }}><b>架构：</b>{container.arch || '-'}</div>
              <div style={{ color: '#8c8c8c', fontSize: 13, marginBottom: 8 }}><b>IP：</b>{container.ip || '-'}</div>
              <div style={{ color: '#8c8c8c', fontSize: 13, marginBottom: 8 }}><b>创建时间：</b>{container.time || container.createTime || '-'}</div>
              <div style={{ color: '#8c8c8c', fontSize: 13, marginBottom: 8 }}><b>状态：</b>{container.state || '-'}</div>
            </div>
          }
        />
      </Card>
    </div>
  );
};

export default ContainerCard;
