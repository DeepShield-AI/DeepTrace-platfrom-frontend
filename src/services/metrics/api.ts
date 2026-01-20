// 低层 REST API 封装（直接对应每个 HTTP endpoint）
import { client } from './client';

// 是否使用本地 mock 数据（通过环境变量控制）
const USE_MOCK = process.env.REACT_APP_USE_MOCK === 'false';

/**
 * 动态加载 mock 数据文件的辅助函数
 * !! mock 文件是 CommonJS 格式的 .js 文件，为了兼容导入，这里使用 require
 * return：mock 模块导出的对象（包含各种测试数据）
 */
async function loadMock() {
  // 使用 require 而不是 import，避免 ESM/CJS 混用问题
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const mock = require('./mock');
  return mock;
}

/**
 * 获取 agent 列表
 * 接口：GET /api/metric/agentList
 * params：可传查询参数（例如分页、过滤等）
 * return：Promise<any>（当前直接返回后端原始 data；开发时可用 mock 数据）
 */
export async function getAgentList(params?: Record<string, any>): Promise<any> {
  if (USE_MOCK) {
    const mock = await loadMock();
    // mock 里可能没有完全一致的字段，这里做最小的兼容处理，返回一个 { content: [...] } 结构
    return { content: mock.accessGetAllMockData || [] };
  }

  const res = await client.get('/api/metric/agentList', { params });
  return res.data;
}

/**
 * 获取指标标签配置
 * params：GET /api/metric/tags
 * return：标签数组或配置对象
 */
export async function getMetricTags(): Promise<any> {
  if (USE_MOCK) {
    const mock = await loadMock();
    return mock.tags || [];
  }
  const res = await client.get('/api/metric/tags');
  return res.data;
}

/**
 * 获取 CPU 时序数据
 * 接口：GET /api/metric/cpu
 * params：{ startTime, endTime, agentName, cpu }
 * return：时序数组（或 mock 中的 requestData）
 */
export async function getCpu(params: Record<string, any>): Promise<any> {
  if (USE_MOCK) {
    const mock = await loadMock();
    return mock.requestData || [];
  }
  const res = await client.get('/api/metric/cpu', { params });
  return res.data;
}

/**
 * 获取 Memory 时序数据
 * params：GET /api/metric/memory
 */
export async function getMemory(params: Record<string, any>): Promise<any> {
  if (USE_MOCK) {
    const mock = await loadMock();
    return mock.requestData || [];
  }
  const res = await client.get('/api/metric/memory', { params });
  return res.data;
}

/**
 * 获取 Network 时序数据
 * 接口：GET /api/metric/network
 * params：{ startTime, endTime, agentName, interfacec }
 */
export async function getNetwork(params: Record<string, any>): Promise<any> {
  if (USE_MOCK) {
    const mock = await loadMock();
    return mock.requestData || [];
  }
  const res = await client.get('/api/metric/network', { params });
  return res.data;
}

/**
 * 获取 Disk 时序数据
 * 接口：GET /api/metric/disk
 * params：{ startTime, endTime, agentName, device }
 */
export async function getDisk(params: Record<string, any>): Promise<any> {
  if (USE_MOCK) {
    const mock = await loadMock();
    return mock.requestData || [];
  }
  const res = await client.get('/api/metric/disk', { params });
  return res.data;
}

/**
 * chart图表查询
 * 接口：GET /api/metric/chart?namespace=...&name=...
 * params：namespace/name 等由前端组装
 */
export async function getChart(params: Record<string, any>): Promise<any> {
  if (USE_MOCK) {
    const mock = await loadMock();
    return mock.requestData || [];
  }
  const res = await client.get('/api/metric/chart', { params });
  return res.data;
}

export default {
  getAgentList,
  getMetricTags,
  getCpu,
  getMemory,
  getNetwork,
  getDisk,
  getChart,
};
