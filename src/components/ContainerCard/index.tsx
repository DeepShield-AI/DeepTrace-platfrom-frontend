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
  const [rootRef, size] = useResizeObserver<HTMLDivElement>();
  const anomalies = checkContainerAnomalies(container);
  const hasAnomalies = anomalies.length > 0;
  const containerKey = `${container.machineId}-${container.id}`;
  const isLoading = (cardLoading || {})[containerKey];
  const businessInfo = businessData[container.business];

  const reserved = 100 + 120;
  const maxInnerHeight = Math.max(120, (size.height || 520) - reserved);

  if (isLoading) return <SkeletonPlaceholder />;

  const hoverContent = (
    <div style={{ width: 280, padding: '12px' }}>
      <div style={{ marginBottom: '8px' }}>
        <Text strong style={{ fontSize: '14px' }}>{container.name}</Text>
        {hasAnomalies && (
          <Tag 
            color="#ffc53d" 
            style={{ marginLeft: '8px', fontSize: '10px' }}
            icon={<ExclamationCircleOutlined />}
          >
            {anomalies.length}个异常
          </Tag>
        )}
      </div>

      {businessInfo && (
        <div style={{ marginBottom: '6px' }}>
          <Space>
            {businessInfo.icon}
            <Text type="secondary" style={{ fontSize: '12px' }}>
              业务: <Tag color={businessInfo.color} style={{ fontSize: '10px', marginLeft: '4px' }}>
                {businessInfo.name}
              </Tag>
            </Text>
          </Space>
        </div>
      )}

      <div style={{ marginBottom: '6px' }}>
        <Text type="secondary" style={{ fontSize: '12px' }}>镜像: {container.image}</Text>
      </div>

      <div style={{ marginBottom: '6px' }}>
        <Text type="secondary" style={{ fontSize: '12px' }}>状态: 
          <Tag 
            color={getStatusColor(container.status)} 
            style={{ marginLeft: '4px', fontSize: '10px' }}
          >
            {getStatusText(container.status)}
          </Tag>
        </Text>
      </div>

      <div style={{ marginBottom: '6px' }}>
        <Text type="secondary" style={{ fontSize: '12px' }}>CPU: 
          <Progress 
            percent={container.cpuUsage} 
            size="small" 
            strokeColor={getProgressColor(container.cpuUsage)}
            style={{ display: 'inline-block', width: '60px', marginLeft: '4px' }}
            showInfo={false}
          />
          <Text style={{ 
            fontSize: '11px', 
            marginLeft: '4px',
            color: getProgressColor(container.cpuUsage)
          }}>
            {formatNumber(container.cpuUsage)}%
          </Text>
        </Text>
      </div>

      <div style={{ marginBottom: '6px' }}>
        <Text type="secondary" style={{ fontSize: '12px' }}>内存: 
          <Progress 
            percent={container.memoryUsage} 
            size="small" 
            strokeColor={getProgressColor(container.memoryUsage)}
            style={{ display: 'inline-block', width: '60px', marginLeft: '4px' }}
            showInfo={false}
          />
          <Text style={{ 
            fontSize: '11px', 
            marginLeft: '4px',
            color: getProgressColor(container.memoryUsage)
          }}>
            {formatNumber(container.memoryUsage)}%
          </Text>
        </Text>
      </div>

      <div style={{ marginBottom: '6px' }}>
        <Text type="secondary" style={{ fontSize: '12px' }}>机器: {container.machineName}</Text>
      </div>

      {hasAnomalies && (
        <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px dashed #f0f0f0' }}>
          <Text strong style={{ fontSize: '12px', color: '#ffc53d' }}>异常提醒:</Text>
          {anomalies.slice(0, 2).map((anomaly, index) => (
            <div key={index} style={{ fontSize: '11px', color: anomaly.level === 'error' ? '#ff7875' : '#ffc53d' }}>
              • {anomaly.message}
            </div>
          ))}
          {anomalies.length > 2 && (
            <div style={{ fontSize: '11px', color: '#ffc53d' }}>
              • 还有{anomalies.length - 2}个异常...
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div ref={rootRef} style={{ display: 'flex', flexDirection: 'column', height: '520px' }}>
      <Popover
        content={hoverContent}
        title="容器信息概览"
        trigger="hover"
        open={hoveredCard === containerKey}
        onOpenChange={(visible) => setHoveredCard(visible ? containerKey : null)}
      >
        <Badge.Ribbon text={getStatusText(container.status)} color={getStatusColor(container.status)}>
          <Card
            hoverable
            onClick={() => handleCardClick(container.id, container.machineId)}
            onMouseEnter={() => setHoveredCard(containerKey)}
            onMouseLeave={() => setHoveredCard(null)}
            style={{
              height: '100%',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              borderRadius: '8px',
              overflow: 'hidden',
              border: hasAnomalies ? '1px solid #ffc53d' : '1px solid #e8e8e8',
              boxShadow: hasAnomalies ? '0 2px 8px rgba(255, 197, 61, 0.2)' : '0 2px 8px rgba(0,0,0,0.09)',
              display: 'flex',
              flexDirection: 'column'
            }}
            cover={
              <div style={{
                background: hasAnomalies ? 'linear-gradient(135deg, #fff7e6 0%, #fff2e8 100%)' : 'linear-gradient(135deg, #f0f8ff 0%, #e6f7ff 100%)',
                padding: '20px',
                textAlign: 'center',
                position: 'relative',
                flexShrink: 0,
                height: '100px'
              }}>
                {hasAnomalies && (
                  <div style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(255,255,255,0.9)', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ExclamationCircleOutlined style={{ color: '#ffc53d', fontSize: '16px' }} />
                  </div>
                )}
                {businessInfo && (
                  <div style={{ position: 'absolute', top: '8px', left: '8px', background: 'rgba(255,255,255,0.9)', borderRadius: '4px', padding: '2px 6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {React.cloneElement(businessInfo.icon, { style: { color: businessInfo.color, fontSize: '12px', marginRight: '4px' } })}
                    <span style={{ fontSize: 10, color: businessInfo.color }}>{businessInfo.name}</span>
                  </div>
                )}
                <CloudServerOutlined style={{ fontSize: '48px', color: hasAnomalies ? '#ffc53d' : '#69c0ff' }} />
              </div>
            }
          >
            <Meta
              title={
                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                  <Space>
                    <CodeOutlined style={{ color: hasAnomalies ? '#ffc53d' : '#69c0ff' }} />
                    <span style={{ fontWeight: 600, fontSize: 16 }}>{container.name}</span>
                  </Space>
                  {hasAnomalies && (
                    <div>
                      <Tag color="#ffc53d" icon={<ExclamationCircleOutlined />} style={{ fontSize: '12px' }}>{anomalies.length}个异常</Tag>
                    </div>
                  )}
                </Space>
              }
              description={
                <div style={{ marginTop: '12px', flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
                  <div className="container-card-scrollbar" style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', paddingRight: '4px', paddingBottom: '12px', minHeight: 0, maxHeight: `${maxInnerHeight}px` }}>
                    {businessInfo && (
                      <div style={{ marginBottom: 8 }}>
                        <strong>业务:</strong>
                        <br />
                        <Space>
                          {businessInfo.icon}
                          <Tag color={businessInfo.color} style={{ fontSize: 11, padding: '2px 6px', marginTop: 2 }}>{businessInfo.name}</Tag>
                        </Space>
                      </div>
                    )}

                    <div style={{ marginBottom: 8 }}>
                      <strong>镜像:</strong>
                      <br />
                      <div style={{ color: '#8c8c8c', fontSize: 12, wordBreak: 'break-word' }}>{container.image}</div>
                    </div>

                    <div style={{ marginBottom: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <strong>CPU使用率:</strong>
                        <Tooltip title={container.cpuUsage > 80 ? 'CPU使用率过高' : '正常'}>
                          <Space size={4}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: getProgressColor(container.cpuUsage) }}>{formatNumber(container.cpuUsage)}%</div>
                            {container.cpuUsage > 80 && <ExclamationCircleOutlined style={{ color: getProgressColor(container.cpuUsage), fontSize: 12 }} />}
                          </Space>
                        </Tooltip>
                      </div>
                      <Progress percent={container.cpuUsage} size="small" strokeColor={getProgressColor(container.cpuUsage)} style={{ marginTop: 4 }} showInfo={false} />
                    </div>

                    <div style={{ marginBottom: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <strong>内存使用率:</strong>
                        <Space size={4}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: getProgressColor(container.memoryUsage) }}>{formatNumber(container.memoryUsage)}%</div>
                        </Space>
                      </div>
                      <Progress percent={container.memoryUsage} size="small" strokeColor={getProgressColor(container.memoryUsage)} style={{ marginTop: 4 }} showInfo={false} />
                    </div>

                    <div style={{ marginBottom: 8 }}>
                      <strong>端口映射:</strong>
                      <br />
                      <Space size={[0, 4]} wrap style={{ marginTop: 4 }}>
                        {container.ports.map((port: string, index: number) => (
                          <Tag key={index} color="blue" style={{ fontSize: 11, padding: '2px 6px', marginBottom: 4 }}>{port}</Tag>
                        ))}
                      </Space>
                    </div>

                    <div style={{ marginBottom: 8 }}>
                      <strong>所属机器:</strong>
                      <br />
                      <div style={{ color: '#8c8c8c', fontSize: 12 }}>{container.hostname} ({container.machineIp})</div>
                    </div>

                    <div style={{ paddingBottom: 8 }}>
                      <strong>创建时间:</strong>
                      <br />
                      <div style={{ color: '#8c8c8c', fontSize: 12, whiteSpace: 'normal', wordBreak: 'break-all', overflowWrap: 'break-word' }}>{container.createTime}</div>
                    </div>
                  </div>
                </div>
              }
            />
          </Card>
        </Badge.Ribbon>
      </Popover>
    </div>
  );
};

export default ContainerCard;
