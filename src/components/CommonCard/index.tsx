import React from 'react';
import { Badge, Card, Popover, Skeleton } from 'antd';
import './ui.less';

// CommonCard 只负责“卡片壳层能力”：hover、loading、ribbon、popover。
// 业务内容由 children 注入，避免和具体页面耦合。
type Props = {
  children?: React.ReactNode;
  cover?: React.ReactNode;
  cardClassName?: string;
  bodyClassName?: string;
  cardStyle?: React.CSSProperties;
  bodyStyle?: React.CSSProperties;
  hoverable?: boolean;
  onClick?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  hoverShadow?: boolean;
  loading?: boolean;
  loadingSkeletonRows?: number;
  showRibbon?: boolean;
  ribbonText?: React.ReactNode;
  ribbonColor?: string;
  showPopover?: boolean;
  popoverOpen?: boolean;
  popoverContent?: React.ReactNode;
  popoverPlacement?: 'top' | 'left' | 'right' | 'bottom';
  popoverOverlayClassName?: string;
};

const CommonCard: React.FC<Props> = ({
  children,
  cover,
  cardClassName,
  bodyClassName,
  cardStyle,
  bodyStyle,
  hoverable = true,
  onClick,
  onMouseEnter,
  onMouseLeave,
  hoverShadow = false,
  loading = false,
  loadingSkeletonRows = 6,
  showRibbon = false,
  ribbonText,
  ribbonColor,
  showPopover = false,
  popoverOpen,
  popoverContent,
  popoverPlacement = 'right',
  popoverOverlayClassName,
}) => {
  // 合并基础类、可选阴影类和外部传入类，统一由样式层控制视觉差异。
  const mergedCardClassName = ['common-card', hoverShadow ? 'common-card-hover-shadow' : '', cardClassName]
    .filter(Boolean)
    .join(' ');

  // 第一层：基础 Card（含 loading 骨架切换）。
  const cardNode = (
    <Card
      className={mergedCardClassName}
      hoverable={hoverable}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={cardStyle}
      bodyStyle={bodyStyle}
      classNames={bodyClassName ? { body: bodyClassName } : undefined}
      cover={cover}
    >
      {loading ? (
        <div className="common-card-loading">
          <Skeleton active paragraph={{ rows: loadingSkeletonRows }} title={{ width: '45%' }} />
        </div>
      ) : (
        children
      )}
    </Card>
  );

  // 第二层：可选状态丝带。
  const ribbonWrappedNode = showRibbon ? (
    <Badge.Ribbon text={ribbonText} color={ribbonColor}>
      {cardNode}
    </Badge.Ribbon>
  ) : (
    cardNode
  );

  // 不需要悬浮详情时直接返回，减少额外 DOM 包裹。
  if (!showPopover) return ribbonWrappedNode;

  // 第三层：可选 Popover。
  return (
    <Popover
      placement={popoverPlacement}
      trigger="hover"
      open={popoverOpen}
      content={popoverContent}
      overlayClassName={popoverOverlayClassName}
    >
      {ribbonWrappedNode}
    </Popover>
  );
};

export default CommonCard;
