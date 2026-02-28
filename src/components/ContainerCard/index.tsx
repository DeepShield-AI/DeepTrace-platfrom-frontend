import { CloudServerOutlined, CodeOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { Badge, Card, Divider, Popover, Progress, Skeleton, Space, Tag, Tooltip, Typography } from 'antd';
import React from 'react';
import useResizeObserver from '../../hooks/useResizeObserver';

const { Text } = Typography as any;

// 字段读取函数：从 container 提取展示值
type DataAccessor = (item: any) => string | number;

// 字段展示配置：支持 label / accessor / render 三种扩展点
type FieldConfig = {
	key: string;
	label?: string;
	accessor?: DataAccessor;
	render?: (item: any) => React.ReactNode;
};

/**
 * 控制卡片字段映射与展示文案
 * - labels: 文案本地化
 * - accessors: 字段访问函数
 * - fields: 字段展示顺序与渲染策略
 */
export type CardConfig = {
	labels: {
		cpu: string;
		memory: string;
		machineId: string;
		arch: string;
		os: string;
		ip: string;
		creationTime: string;
		memorySize: string;
		ports: string;
	};
	accessors: {
		status: DataAccessor;
		machineId: DataAccessor;
		id: DataAccessor;
		name: DataAccessor;
		image: DataAccessor;
		cpuUsage: DataAccessor;
		memoryUsage: DataAccessor;
		arch: DataAccessor;
		os: DataAccessor;
		ip: DataAccessor;
		time: DataAccessor;
		createTime: DataAccessor;
		memorySize: DataAccessor;
		cpuNum: DataAccessor;
		ports: (item: any) => any[];
		business: DataAccessor;
	};
	// 可配置字段（控制顺序与渲染）
	fields?: FieldConfig[];
};

export const DEFAULT_CONTAINER_CARD_LABELS: CardConfig['labels'] = {
	cpu: 'CPU',
	memory: '内存',
	machineId: '机器ID',
	arch: '架构',
	os: 'OS',
	ip: 'IP',
	creationTime: '创建时间',
	memorySize: '内存',
	ports: '端口',
};

/**
 * 只读卡片配置工厂
 * 用于 DataViewDetail / BusinessStats 等非容器实体卡片
 */
export const createReadonlyCardConfig = (
	identity: { id: string; name: string; machineId?: string },
): CardConfig => ({
	labels: DEFAULT_CONTAINER_CARD_LABELS,
	accessors: {
		status: () => '',
		machineId: () => identity.machineId || 'readonly',
		id: () => identity.id,
		name: () => identity.name,
		image: () => '',
		cpuUsage: () => 0,
		memoryUsage: () => 0,
		arch: () => '',
		os: () => '',
		ip: () => '',
		time: () => '',
		createTime: () => '',
		memorySize: () => '',
		cpuNum: () => '',
		ports: () => [],
		business: () => '',
	},
});

/**
 * Render props：按需覆盖卡片分区渲染
 * 各 renderer 会收到当前容器对象和尺寸信息
 */
type Renderers<T> = {
	renderCover?: (item: T, size?: { width: number; height: number }) => React.ReactNode;
	renderHeader?: (item: T, businessInfo: any, size?: { width: number; height: number }) => React.ReactNode;
	renderContent?: (item: T, size?: { width: number; height: number }) => React.ReactNode;
	renderPopoverContent?: (item: T, size?: { width: number; height: number }) => React.ReactNode;
	containerKeyAccessor?: (item: T) => string;
};

type Props<T = any> = {
	container: T; // 当前卡片数据
	cardLoading?: Record<string, boolean>;
	hoveredCard?: string | null;
	setHoveredCard?: (s: string | null) => void;
	handleCardClick?: (id: string, machineId: string, item?: T) => void;
	getProgressColor?: (usage: number) => string;
	formatNumber?: (num: any) => string;
	checkContainerAnomalies?: (c: any) => any[];
	getStatusText?: (s: string) => string;
	getStatusColor?: (s: string) => string;
	businessData?: Record<string, any>;
	cardConfig?: CardConfig;
	// 分区渲染扩展点
	renderers?: Renderers<T>;
	// hover 是否显示 popover（默认 true）
	showPopover?: boolean;
	// 卡片高度（默认 520）
	height?: number | string;
	// 尺寸变化回调
	onResize?: (size: { width: number; height: number }) => void;
	// 是否显示状态 ribbon（默认 true）
	showRibbon?: boolean;
	// 是否启用交互态（hover/click）
	interactive?: boolean;
	// 外部覆盖 Card/body 样式
	cardStyle?: React.CSSProperties;
	bodyStyle?: React.CSSProperties;
	// 加载骨架行数（默认 6）
	loadingSkeletonRows?: number;
};

// 通用卡片实现：默认兼容现有容器卡逻辑
const ContainerCard = <T,>({
	container,
	cardLoading = {},
	hoveredCard = null,
	setHoveredCard = () => {},
	handleCardClick = () => {},
	getProgressColor = () => '#73d13d',
	formatNumber = (num) => (typeof num === 'number' ? num.toFixed(2) : '0.00'),
	checkContainerAnomalies = () => [],
	getStatusText = (status) => status,
	getStatusColor = () => '#d9d9d9',
	businessData = {},
	cardConfig = {
		labels: DEFAULT_CONTAINER_CARD_LABELS,
		accessors: {
			status: (c) => c?.status || c?.state || '',
			machineId: (c) => c?.machineId || '',
			id: (c) => c?.id || '',
			name: (c) => c?.name || '',
			image: (c) => c?.image || '',
			cpuUsage: (c) => c?.cpuUsage || 0,
			memoryUsage: (c) => c?.memoryUsage || 0,
			arch: (c) => c?.arch || '',
			os: (c) => c?.os || '',
			ip: (c) => c?.ip || '',
			time: (c) => c?.time || '',
			createTime: (c) => c?.createTime || '',
			memorySize: (c) => c?.memorySize || '',
			cpuNum: (c) => c?.cpuNum || '',
			ports: (c) => (Array.isArray(c?.ports) ? c.ports : []),
			business: (c) => c?.business || '',
		},
		// 默认字段顺序（可由外部覆盖）
		fields: [
			{ key: 'ip', label: 'IP' },
			{ key: 'arch', label: '架构' },
			{ key: 'memorySize', label: '内存' },
			{ key: 'cpuNum', label: 'CPU核数' },
			{ key: 'creationTime', label: '创建时间', accessor: (c) => c?.time || c?.createTime || '-' },
			{ key: 'os', label: 'OS' },
		],
	},
	renderers = {},
	showPopover = true,
	height = 520,
	onResize,
	showRibbon = true,
	interactive = true,
	cardStyle,
	bodyStyle,
	loadingSkeletonRows = 6,
}: Props<T>) => {
	// 监听卡片尺寸，提供给自定义 renderer 做响应式布局
	const [rootRef, size] = useResizeObserver<HTMLDivElement>();

	// 尺寸变化时透传给外部
	React.useEffect(() => {
		if (onResize && size) onResize(size);
	}, [onResize, size]);

	const { accessors, labels } = cardConfig;
	// 卡片唯一键：优先使用外部 accessor，默认 machineId-id
	const containerKey = renderers.containerKeyAccessor
		? renderers.containerKeyAccessor(container)
		: `${accessors.machineId(container)}-${accessors.id(container)}`;
	const isLoading = (cardLoading || {})[containerKey];
	const anomalies = checkContainerAnomalies(container) || [];
	const ports = accessors.ports(container);
	const businessId = accessors.business(container) as string;
	const businessInfo = businessId ? businessData[businessId] : null;
	const isHovered = hoveredCard === containerKey;

	// 字段取值优先级：render > field.accessor > accessors[key] > '-'
	const renderFieldValue = (f: FieldConfig) => {
		if (f.render) return f.render(container);
		const raw = f.accessor
			? f.accessor(container)
			: (accessors as any)[f.key]
			? (accessors as any)[f.key](container)
			: undefined;

		// 兼容创建时间字段别名
		if ((f.key === 'creationTime' || f.key === 'time') && (raw === undefined || raw === '')) {
			return (accessors.time(container) || accessors.createTime(container) || '-') as any;
		}

		return raw === undefined || raw === null || raw === '' ? '-' : raw;
	};

	// 默认 Popover 详情（字段由 cardConfig.fields 控制）
	const defaultPopover = (
		<div style={{ maxWidth: 420 }}>
			<div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
				<CloudServerOutlined style={{ fontSize: 28, color: '#69c0ff' }} />
				<div style={{ flex: 1 }}>
					<div style={{ fontWeight: 700 }}>{accessors.name(container)}</div>
					<div style={{ color: '#8c8c8c', fontSize: 12 }}>
						{accessors.image(container) || '未知镜像'}
					</div>
				</div>
				<Tag color={getStatusColor(accessors.status(container) as string)}>
					{getStatusText(accessors.status(container) as string)}
				</Tag>
			</div>

			{anomalies.length > 0 && (
				<div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
					{anomalies.map((item, idx) => (
						<Tag key={idx} color={item.level === 'error' ? '#f5222d' : '#faad14'}>
							<ExclamationCircleOutlined /> {item.message}
						</Tag>
					))}
				</div>
			)}

			<Divider style={{ margin: '12px 0' }} />

			<Space direction="vertical" style={{ width: '100%' }} size="small">
				<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
					<Text style={{ width: 72 }}>{labels.cpu}</Text>
					<Progress
						percent={Number(formatNumber(accessors.cpuUsage(container)))}
						size="small"
						strokeColor={getProgressColor(accessors.cpuUsage(container) as number)}
						style={{ flex: 1, margin: 0 }}
					/>
					<Text>{formatNumber(accessors.cpuUsage(container))}%</Text>
				</div>
				<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
					<Text style={{ width: 72 }}>{labels.memory}</Text>
					<Progress
						percent={Number(formatNumber(accessors.memoryUsage(container)))}
						size="small"
						strokeColor={getProgressColor(accessors.memoryUsage(container) as number)}
						style={{ flex: 1, margin: 0 }}
					/>
					<Text>{formatNumber(accessors.memoryUsage(container))}%</Text>
				</div>
			</Space>

			<Divider style={{ margin: '12px 0' }} />

			{/* 可配置字段：两列布局 */}
			<div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 }}>
				{(cardConfig.fields || []).map((f, idx) => (
					<Text key={idx} type="secondary">
						{f.label ?? (labels as any)[f.key] ?? f.key}: {renderFieldValue(f)}
					</Text>
				))}
			</div>

			<Divider style={{ margin: '12px 0' }} />

			<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
				<Text strong>{labels.ports}</Text>
				<div style={{ flex: 1, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
					{ports.length === 0 ? (
						<Text type="secondary">无</Text>
					) : (
						ports.map((p: any, idx: number) => (
							<Tag key={idx} color="blue">
								{p.port || p}
							</Tag>
						))
					)}
				</div>
			</div>
		</div>
	);

	// Popover 内容支持外部覆盖
	const popoverContent = renderers.renderPopoverContent
		? renderers.renderPopoverContent(container, size)
		: defaultPopover;

	// 默认 cover（可覆盖）
	const defaultCover = (
		<div
			style={{
				background: 'linear-gradient(135deg, #f0f8ff 0%, #e6f7ff 100%)',
				padding: '20px',
				textAlign: 'center',
				position: 'relative',
				flexShrink: 0,
				height: '100px',
			}}
		>
			<CloudServerOutlined style={{ fontSize: '48px', color: '#69c0ff' }} />
		</div>
	);

	// 默认 header（名称 + 业务标签）
	const defaultHeader = (
		<div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
			<CodeOutlined style={{ color: '#69c0ff' }} />
			<span style={{ fontWeight: 600, fontSize: 16, flex: 1 }}>{accessors.name(container)}</span>
			{businessInfo && (
				<Tag color={businessInfo.color || 'blue'}>
					{businessInfo.icon} {businessInfo.name}
				</Tag>
			)}
		</div>
	);

	// 默认内容区
	const defaultContent = (
		<>
			{anomalies.length > 0 && (
				<div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
					<Tooltip title={anomalies.map((a) => a.message).join(' | ')}>
						{/* 保留占位注释以便后续自定义 */}
					</Tooltip>
				</div>
			)}

			<Space direction="vertical" size="small" style={{ width: '100%' }}>
				<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
					<Text style={{ width: 60 }}>{labels.cpu}</Text>
					<Progress
						percent={Number(formatNumber(accessors.cpuUsage(container)))}
						size="small"
						strokeColor={getProgressColor(accessors.cpuUsage(container) as number)}
						style={{ flex: 1, margin: 0 }}
					/>
					<Text>{formatNumber(accessors.cpuUsage(container))}%</Text>
				</div>
				<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
					<Text style={{ width: 60 }}>{labels.memory}</Text>
					<Progress
						percent={Number(formatNumber(accessors.memoryUsage(container)))}
						size="small"
						strokeColor={getProgressColor(accessors.memoryUsage(container) as number)}
						style={{ flex: 1, margin: 0 }}
					/>
					<Text>{formatNumber(accessors.memoryUsage(container))}%</Text>
				</div>
			</Space>

			<Divider style={{ margin: '12px 0' }} />

			{/* 可配置字段：纵向布局 */}
			<div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
				{(cardConfig.fields || []).map((f, idx) => (
					<Text key={idx} type="secondary">
						{f.label ?? (labels as any)[f.key] ?? f.key}: {renderFieldValue(f)}
					</Text>
				))}
			</div>
		</>
	);

	const containerStyle: React.CSSProperties = {
		display: 'flex',
		flexDirection: 'column',
		minHeight: typeof height === 'number' ? `${height}px` : height,
		height: '100%',
	};

	const cardMinHeight = typeof height === 'number' ? `${height}px` : height;

	const cardNode = (
		<Card
			hoverable={interactive}
			onClick={
				interactive && !isLoading
					? () =>
							handleCardClick(
								accessors.id(container) as string,
								accessors.machineId(container) as string,
								container,
							)
					: undefined
			}
			onMouseEnter={() => setHoveredCard(containerKey)}
			onMouseLeave={() => setHoveredCard(null)}
			style={{
				height: '100%',
				minHeight: cardMinHeight,
				cursor: interactive ? 'pointer' : 'default',
				transition: 'all 0.3s ease',
				borderRadius: '8px',
				overflow: 'hidden',
				border:
					interactive && isHovered ? '1px solid #69c0ff' : '1px solid #e8e8e8',
				boxShadow:
					interactive && isHovered
						? '0 6px 18px rgba(0,0,0,0.12)'
						: '0 2px 8px rgba(0,0,0,0.09)',
				display: 'flex',
				flexDirection: 'column',
				...(cardStyle || {}),
			}}
			bodyStyle={{
				padding: '20px',
				flex: 1,
				overflowY: 'auto',
				display: 'flex',
				flexDirection: 'column',
				...(bodyStyle || {}),
			}}
			cover={renderers.renderCover ? renderers.renderCover(container, size) : defaultCover}
		>
			{isLoading ? (
				<div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
					<Skeleton active paragraph={{ rows: loadingSkeletonRows }} title={{ width: '45%' }} />
				</div>
			) : (
				<>
					{renderers.renderHeader
						? renderers.renderHeader(container, businessInfo, size)
						: defaultHeader}
					{renderers.renderContent ? renderers.renderContent(container, size) : defaultContent}
				</>
			)}
		</Card>
	);

	const cardElement = showRibbon ? (
		<Badge.Ribbon
			text={getStatusText(accessors.status(container) as string)}
			color={getStatusColor(accessors.status(container) as string)}
		>
			{cardNode}
		</Badge.Ribbon>
	) : (
		cardNode
	);

	return (
		<div ref={rootRef} style={containerStyle}>
			{showPopover ? (
				<Popover placement="right" trigger="hover" open={hoveredCard === containerKey} content={popoverContent} overlayStyle={{ maxWidth: 460 }}>
					{cardElement}
				</Popover>
			) : (
				cardElement
			)}
		</div>
	);
};

export default React.memo(ContainerCard) as typeof ContainerCard;
