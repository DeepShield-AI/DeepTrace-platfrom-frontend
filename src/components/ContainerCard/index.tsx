import { CloudServerOutlined, CodeOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { Badge, Card, Divider, Popover, Progress, Space, Tag, Tooltip, Typography, Skeleton } from 'antd';
import React from 'react';
import useResizeObserver from '../../hooks/useResizeObserver';

const { Text } = Typography as any;

// DataAccessor: 简单的字段访问器，返回字符串或数值
type DataAccessor = (item: any) => string | number;

// FieldConfig: 用于描述可配置字段的显示、访问器或自定义渲染
type FieldConfig = {
	key: string;
	label?: string;
	accessor?: DataAccessor;
	render?: (item: any) => React.ReactNode;
};

/**
 * CardConfig: 用于控制 ContainerCard 内部字段的标签与访问器
 * - labels: 文案本地化
 * - accessors: 从 container 对象中提取字段值的函数集合
 * - fields: 控制卡片中显示的可配置字段（顺序 & 自定义渲染）
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
	// 可配置显示字段（顺序 & 可自定义 accessor/render）
	fields?: FieldConfig[];
};

/**
 * Renderers: render props，允许父组件按需覆盖卡片的不同区域渲染逻辑
 * - 各函数会被传入当前 container 对象
 * - 新增 `size` 参数（{width,height}），便于在渲染时根据尺寸调整布局
 */
type Renderers<T> = {
	renderCover?: (item: T, size?: { width: number; height: number }) => React.ReactNode;
	renderHeader?: (item: T, businessInfo: any, size?: { width: number; height: number }) => React.ReactNode;
	renderContent?: (item: T, size?: { width: number; height: number }) => React.ReactNode;
	renderPopoverContent?: (item: T, size?: { width: number; height: number }) => React.ReactNode;
	containerKeyAccessor?: (item: T) => string;
};

type Props<T = any> = {
	container: T; // 数据对象（泛化）
	cardLoading: Record<string, boolean>;
	hoveredCard: string | null;
	setHoveredCard: (s: string | null) => void;
	handleCardClick: (id: string, machineId: string, item?: T) => void;
	getProgressColor: (usage: number) => string;
	formatNumber: (num: any) => string;
	checkContainerAnomalies: (c: any) => any[];
	getStatusText: (s: string) => string;
	getStatusColor: (s: string) => string;
	businessData: Record<string, any>;
	cardConfig?: CardConfig;
	// 新增 render props，全部可选
	renderers?: Renderers<T>;
	// 是否在 hover 时显示 popover（默认 true）
	showPopover?: boolean;
	// 卡片高度，默认 520（支持数字或字符串）
	height?: number | string;
	// 可选的尺寸变化回调
	onResize?: (size: { width: number; height: number }) => void;
};

// 骨架占位组件
const SkeletonPlaceholder: React.FC = () => (
	<Card style={{ minHeight: '520px', height: '100%', borderRadius: '8px', overflow: 'hidden' }}>
		<div
			style={{
				background: 'linear-gradient(135deg, #f0f8ff 0%, #e6f7ff 100%)',
				padding: '20px',
				textAlign: 'center',
				height: '100px',
			}}
		/>
	</Card>
);

// 通用组件实现（保持对原有逻辑的默认支持）
const ContainerCard = <T,>({
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
	businessData,
	cardConfig = {
		labels: {
			cpu: 'CPU',
			memory: '内存',
			machineId: '机器ID',
			arch: '架构',
			os: 'OS',
			ip: 'IP',
			creationTime: '创建时间',
			memorySize: '内存',
			ports: '端口',
		},
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
		// 默认可配置字段（可被外部覆盖）
		fields: [
			{ key: 'ip', label: '田' },
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
}: Props<T>) => {
	// useResizeObserver 返回 [ref, size]
	// size 初始为 {width:0,height:0}，会在挂载后被填充
	const [rootRef, size] = useResizeObserver<HTMLDivElement>();

	// 当 size 变化时，调用外部回调（如果提供），便于父组件做响应式布局
	React.useEffect(() => {
		if (onResize && size) onResize(size);
	}, [onResize, size]);

	const { accessors, labels } = cardConfig;
	// 支持自定义 containerKeyAccessor，否则用 machineId-id 组合（兼容旧逻辑）
	// containerKey 用于标识卡片（hover、loading 等场景），优先使用 renderers 提供的 accessor
	const containerKey = renderers.containerKeyAccessor
		? renderers.containerKeyAccessor(container)
		: `${accessors.machineId(container)}-${accessors.id(container)}`;
	const isLoading = (cardLoading || {})[containerKey];
	const anomalies = (checkContainerAnomalies && checkContainerAnomalies(container)) || [];
	const ports = accessors.ports(container);
	const businessId = accessors.business(container) as string;
	const businessInfo = businessId ? businessData[businessId] : null;
	const isHovered = hoveredCard === containerKey;

	// 渲染可配置字段的值，优先级：render -> field.accessor -> cardConfig.accessors[key] -> '-'
	const renderFieldValue = (f: FieldConfig) => {
		if (f.render) return f.render(container);
		const raw = f.accessor
			? f.accessor(container)
			: (accessors as any)[f.key]
			? (accessors as any)[f.key](container)
			: undefined;

		// 对 creationTime/time 做兼容处理
		if ((f.key === 'creationTime' || f.key === 'time') && (raw === undefined || raw === '')) {
			return (accessors.time(container) || accessors.createTime(container) || '-') as any;
		}

		return raw === undefined || raw === null || raw === '' ? '-' : raw;
	};

	// 默认 popover 内容（保留原有展示，但字段由 cardConfig.fields 控制）
	// 默认的 Popover 内容（hover 时展示的详细信息）
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

			{/* 使用可配置字段渲染（两列网格） */}
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

	// 使用外部提供的 renderPopoverContent（若存在）否则使用默认
	const popoverContent = renderers.renderPopoverContent
		? renderers.renderPopoverContent(container, size)
		: defaultPopover;

	// 默认 cover/header/content（保留原有布局）
	// 默认卡片封面（左上插图）
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

	// 默认 header，显示名称与业务信息
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

	// 默认卡片内容（用于 card 主区域）
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

			{/* 卡片内也使用可配置字段渲染（竖列） */}
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

	const cardElement = (
		<Badge.Ribbon text={getStatusText(accessors.status(container) as string)} color={getStatusColor(accessors.status(container) as string)}>
			<Card
				hoverable
				onClick={() => handleCardClick(accessors.id(container) as string, accessors.machineId(container) as string, container)}
				onMouseEnter={() => setHoveredCard(containerKey)}
				onMouseLeave={() => setHoveredCard(null)}
				style={{
					height: '100%',
					cursor: 'pointer',
					transition: 'all 0.3s ease',
					borderRadius: '8px',
					overflow: 'hidden',
					border: isHovered ? '1px solid #69c0ff' : '1px solid #e8e8e8',
					boxShadow: isHovered ? '0 6px 18px rgba(0,0,0,0.12)' : '0 2px 8px rgba(0,0,0,0.09)',
					display: 'flex',
					flexDirection: 'column',
				}}
				bodyStyle={{
					padding: '20px',
					flex: 1,
					overflowY: 'auto',
					display: 'flex',
					flexDirection: 'column',
				}}
				cover={renderers.renderCover ? renderers.renderCover(container, size) : defaultCover}
			>
				{renderers.renderHeader ? renderers.renderHeader(container, businessInfo, size) : defaultHeader}
				{renderers.renderContent ? renderers.renderContent(container, size) : defaultContent}
			</Card>
		</Badge.Ribbon>
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
