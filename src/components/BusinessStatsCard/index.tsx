import React from 'react';
import { Tag, Space, Statistic, Progress, Divider, Typography } from 'antd';
import CommonCard from '../CommonCard';
import './ui.less';
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
  const cssVars = (vars: Record<string, string>): React.CSSProperties => vars as React.CSSProperties;

  const cardVars = cssVars({
    '--business-color': stats.color,
    '--business-selected-bg': `${stats.color}10`,
    '--business-icon-bg': `${stats.color}20`,
  });

  const cpuColorVars = cssVars({ '--metric-color': getProgressColor(stats.avgCpuUsage) });
  const memoryColorVars = cssVars({ '--metric-color': getProgressColor(stats.avgMemoryUsage) });

  const alertVars = cssVars({
    '--alert-bg': errorCount > 0 ? '#fff1f0' : '#fff7e6',
    '--alert-border': errorCount > 0 ? '#ffccc7' : '#ffe58f',
  });

  return (
    <CommonCard
      hoverable
      onClick={() => onClick && onClick(businessId)}
      showPopover={false}
      showRibbon={false}
      cardClassName={`business-stats-card ${isSelected ? 'is-selected' : ''}`}
      bodyClassName="business-stats-card-body"
      cardStyle={cardVars}
    >
      <div className="business-stats-header">
        <div className="business-stats-icon-wrap">
          {React.isValidElement(stats.icon)
            ? React.cloneElement(stats.icon, {
                className: 'business-stats-icon',
                style: { color: stats.color },
              })
            : stats.icon}
        </div>
        <div className="business-stats-main">
          <AntText strong className="business-stats-name">
            {stats.name}
          </AntText>
          <div>
            {getPriorityTag(stats.priority)}
            {isSelected && (
              <Tag color="blue" className="business-stats-selected-tag">
                已选择
              </Tag>
            )}
          </div>
        </div>
      </div>

      <div className="business-stats-description">
        <AntText type="secondary" className="business-stats-description-text">
          {stats.description}
        </AntText>
      </div>

      <Divider className="business-stats-divider" />

      <div className="business-stats-overview">
        <div className="business-stats-overview-left">
          <Statistic
            title="容器数量"
            value={containerCount}
            valueStyle={{ fontSize: '20px', fontWeight: 'bold' }}
          />
        </div>
        <div className="business-stats-overview-right">
          <div className="business-stats-running-label">
            运行中
          </div>
          <div className="business-stats-running-value">
            {stats.runningCount || 0}
          </div>
        </div>
      </div>

      {containerCount > 0 && (
        <>
          <div className="business-stats-metric-block">
            <div className="business-stats-metric-row">
              <AntText type="secondary" className="business-stats-metric-label">
                平均CPU
              </AntText>
              <AntText strong className="business-stats-metric-value" style={cpuColorVars}>
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

          <div className="business-stats-metric-block">
            <div className="business-stats-metric-row">
              <AntText type="secondary" className="business-stats-metric-label">
                平均内存
              </AntText>
              <AntText strong className="business-stats-metric-value" style={memoryColorVars}>
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
        <div className="business-stats-alert" style={alertVars}>
          <Space>
            {errorCount > 0 && (
              <Tag color="error" className="business-stats-alert-tag">
                异常: {errorCount}
              </Tag>
            )}
            {warningCount > 0 && (
              <Tag color="warning" className="business-stats-alert-tag">
                警告: {warningCount}
              </Tag>
            )}
          </Space>
        </div>
      )}

      {containerCount === 0 && (
        <div className="business-stats-empty">
          <AntText type="secondary" className="business-stats-empty-text">
            暂无容器
          </AntText>
        </div>
      )}
    </CommonCard>
  );
};

export default BusinessStatsCard;
