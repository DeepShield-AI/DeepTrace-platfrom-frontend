import { CloudServerOutlined, CodeOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { Badge, Card, Divider, Popover, Progress, Space, Tag, Tooltip, Typography } from 'antd';
import React from 'react';
import useResizeObserver from '../../hooks/useResizeObserver';

const { Text } = Typography as any;

// 将组件改为泛型组件，接收 render props 以实现可定制化渲染
type DataAccessor = (item: any) => string | number;

// 新增字段配置类型
type FieldConfig = {
	key: string;
	label?: string;
	accessor?: DataAccessor;
	render?: (item: any) => React.ReactNode;
};

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

type Renderers<T> = {
	renderCover?: (item: T) => React.ReactNode;
	renderHeader?: (item: T, businessInfo: any) => React.ReactNode;
	renderContent?: (item: T) => React.ReactNode;
	renderPopoverContent?: (item: T) => React.ReactNode;
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
};

// 骨架屏保持不变
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
			{ key: 'ip', label: '田博源' },
			{ key: 'arch', label: '架构' },
			{ key: 'memorySize', label: '内存' },
			{ key: 'cpuNum', label: 'CPU核数' },
			{ key: 'creationTime', label: '创建时间', accessor: (c) => c?.time || c?.createTime || '-' },
			{ key: 'os', label: 'OS' },
		],
	},
	renderers = {},
}: Props<T>) => {
	const [rootRef] = useResizeObserver<HTMLDivElement>();

	const { accessors, labels } = cardConfig;
	// 支持自定义 containerKeyAccessor，否则用 machineId-id 组合（兼容旧逻辑）
	const containerKey = renderers.containerKeyAccessor
		? renderers.containerKeyAccessor(container)
		: `${accessors.machineId(container)}-${accessors.id(container)}`;
	const isLoading = (cardLoading || {})[containerKey];
	const anomalies = (checkContainerAnomalies && checkContainerAnomalies(container)) || [];
	const ports = accessors.ports(container);
	const businessId = accessors.business(container) as string;
	const businessInfo = businessId ? businessData[businessId] : null;
	const isHovered = hoveredCard === containerKey;

	if (isLoading) return <SkeletonPlaceholder />;

	// 渲染单个字段的值（优先 render -> accessor -> accessors[key] -> '-'）
	const renderFieldValue = (f: FieldConfig) => {
		if (f.render) return f.render(container);
		const raw = f.accessor ? f.accessor(container) : (accessors as any)[f.key] ? (accessors as any)[f.key](container) : undefined;
		// 特殊兼容 creationTime 使用 time/createTime
		if ((f.key === 'creationTime' || f.key === 'time') && (raw === undefined || raw === '')) {
			return (accessors.time(container) || accessors.createTime(container) || '-') as any;
		}
		return raw === undefined || raw === null || raw === '' ? '-' : raw;
	};

	// 默认 popover 内容（保留原有展示，但字段由 cardConfig.fields 控制）
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
		? renderers.renderPopoverContent(container)
		: defaultPopover;

	// 默认 cover/header/content（保留原有布局）
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

	return (
		<div ref={rootRef} style={{ display: 'flex', flexDirection: 'column', height: '520px' }}>
			<Popover
				placement="right"
				trigger="hover"
				open={hoveredCard === containerKey}
				content={popoverContent}
				overlayStyle={{ maxWidth: 460 }}
			>
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
						cover={renderers.renderCover ? renderers.renderCover(container) : defaultCover}
					>
						{renderers.renderHeader ? renderers.renderHeader(container, businessInfo) : defaultHeader}
						{renderers.renderContent ? renderers.renderContent(container) : defaultContent}
					</Card>
				</Badge.Ribbon>
			</Popover>
		</div>
	);
};

export default ContainerCard;
