import type { ReactNode } from 'react';

export type GenericRecord = Record<string, any>;

export type DateRangeLike = any[];

export type ContainerLike = GenericRecord;

export type BusinessLike = {
  id: string;
  name: string;
  description: string;
  owner: string;
  priority: string;
  status: string;
  color: string;
  icon: ReactNode;
};

export type BusinessStatsLike = BusinessLike & {
  containerCount: number;
  runningCount: number;
  warningCount: number;
  errorCount: number;
  totalCpuUsage: number;
  totalMemoryUsage: number;
  avgCpuUsage: number;
  avgMemoryUsage: number;
};

export type RouteStateLike = {
  agent_name?: string;
  agent?: string;
};

export type MetricPoint = GenericRecord & {
  timestamp?: number;
  time?: Date;
  value?: number;
};

export type MetricTagsMap = Record<string, Record<string, Array<string | number>>>;

export type ChartConfigLike = GenericRecord;
