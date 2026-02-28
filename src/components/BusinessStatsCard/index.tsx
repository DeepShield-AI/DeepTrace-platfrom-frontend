import React, { useMemo, useState } from 'react';
import { Tag, Space, Statistic, Progress, Divider, Typography } from 'antd';
import ContainerCard, { createReadonlyCardConfig } from '../ContainerCard';
const { Text: AntText } = Typography;

type Props = {
  businessId: string;
  stats: any;
  isSelected?: boolean;
  onClick?: (id: string) => void;
  formatNumber: (n: any) => string;
  getProgressColor: (usage: number) => string;
  getPriorityTag: (priority: string) => JSX.Element;
};

const BusinessStatsCard: React.FC<Props> = ({ businessId, stats, isSelected, onClick, formatNumber, getProgressColor, getPriorityTag }) => {
  if (!stats) return null;

  const containerCount = stats.containerCount || 0;
  const warningCount = stats.warningCount || 0;
  const errorCount = stats.errorCount || 0;

  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const cardIdentity = useMemo(
    () => ({ id: businessId, name: stats.name, machineId: 'business' }),
    [businessId, stats.name],
  );

  const cardLoading = useMemo(() => ({ [`business-${businessId}`]: false }), [businessId]);

  return (
    <ContainerCard
      container={{ ...stats, id: businessId, machineId: 'business' }}
      cardLoading={cardLoading}
      hoveredCard={hoveredCard}
      setHoveredCard={setHoveredCard}
      handleCardClick={() => onClick && onClick(businessId)}
      getProgressColor={getProgressColor}
      formatNumber={formatNumber}
      showPopover={false}
      showRibbon={false}
      interactive
      height="100%"
      cardStyle={{
        borderRadius: '8px',
        border: isSelected ? `2px solid ${stats.color}` : '1px solid #e8e8e8',
        backgroundColor: isSelected ? `${stats.color}10` : '#fff',
        transition: 'all 0.3s',
        cursor: 'pointer',
        height: '100%',
      }}
      bodyStyle={{ padding: '12px' }}
      cardConfig={createReadonlyCardConfig(cardIdentity)}
      renderers={{
        containerKeyAccessor: () => `business-${businessId}`,
        renderCover: () => null,
        renderHeader: () => null,
        renderContent: () => (
          <>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '6px',
                  backgroundColor: `${stats.color}20`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: '8px',
                }}
              >
                {React.isValidElement(stats.icon)
                  ? React.cloneElement(stats.icon, {
                      style: { color: stats.color, fontSize: '16px' },
                    })
                  : stats.icon}
              </div>
              <div style={{ flex: 1 }}>
                <AntText strong style={{ fontSize: '14px' }}>
                  {stats.name}
                </AntText>
                <div>
                  {getPriorityTag(stats.priority)}
                  {isSelected && (
                    <Tag color="blue" style={{ fontSize: '10px', padding: '0 4px', marginLeft: '4px' }}>
                      已选择
                    </Tag>
                  )}
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '8px' }}>
              <AntText type="secondary" style={{ fontSize: '12px' }}>
                {stats.description}
              </AntText>
            </div>

            <Divider style={{ margin: '8px 0' }} />

            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ flex: 1 }}>
                <Statistic
                  title="容器数量"
                  value={containerCount}
                  valueStyle={{ fontSize: '20px', fontWeight: 'bold' }}
                />
              </div>
              <div style={{ width: 120, textAlign: 'right' }}>
                <div style={{ fontSize: '12px', color: '#8c8c8c', marginBottom: '4px' }}>
                  运行中
                </div>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#52c41a' }}>
                  {stats.runningCount || 0}
                </div>
              </div>
            </div>

            {containerCount > 0 && (
              <>
                <div style={{ marginTop: '8px' }}>
                  <div
                    style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}
                  >
                    <AntText type="secondary" style={{ fontSize: '12px' }}>
                      平均CPU
                    </AntText>
                    <AntText
                      strong
                      style={{ fontSize: '12px', color: getProgressColor(stats.avgCpuUsage) }}
                    >
                      {formatNumber(stats.avgCpuUsage)}%
                    </AntText>
                  </div>
                  <Progress
                    percent={stats.avgCpuUsage}
                    size="small"
                    strokeColor={getProgressColor(stats.avgCpuUsage)}
                    showInfo={false}
                  />
                </div>

                <div style={{ marginTop: '8px' }}>
                  <div
                    style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}
                  >
                    <AntText type="secondary" style={{ fontSize: '12px' }}>
                      平均内存
                    </AntText>
                    <AntText
                      strong
                      style={{ fontSize: '12px', color: getProgressColor(stats.avgMemoryUsage) }}
                    >
                      {formatNumber(stats.avgMemoryUsage)}%
                    </AntText>
                  </div>
                  <Progress
                    percent={stats.avgMemoryUsage}
                    size="small"
                    strokeColor={getProgressColor(stats.avgMemoryUsage)}
                    showInfo={false}
                  />
                </div>
              </>
            )}

            {(warningCount > 0 || errorCount > 0) && (
              <div
                style={{
                  marginTop: '8px',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  backgroundColor: errorCount > 0 ? '#fff1f0' : '#fff7e6',
                  border: `1px solid ${errorCount > 0 ? '#ffccc7' : '#ffe58f'}`,
                }}
              >
                <Space>
                  {errorCount > 0 && (
                    <Tag color="error" style={{ fontSize: '10px', margin: 0 }}>
                      异常: {errorCount}
                    </Tag>
                  )}
                  {warningCount > 0 && (
                    <Tag color="warning" style={{ fontSize: '10px', margin: 0 }}>
                      警告: {warningCount}
                    </Tag>
                  )}
                </Space>
              </div>
            )}

            {containerCount === 0 && (
              <div
                style={{
                  marginTop: '8px',
                  padding: '8px',
                  textAlign: 'center',
                  backgroundColor: '#fafafa',
                  borderRadius: '4px',
                }}
              >
                <AntText type="secondary" style={{ fontSize: '12px' }}>
                  暂无容器
                </AntText>
              </div>
            )}
          </>
        ),
      }}
    />
  );
};

export default BusinessStatsCard;
