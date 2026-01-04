import axios from 'axios'
import {
    accessGetAllMockData,
    overviewGetAllMockData
} from './mock.js'
import qs from 'qs';

// mock接口数据
let isMock = true

// const ipAddress = "202.112.237.37"
const ipAddress = "http://114.215.254.187:8081"
const topologyIpAddress = "http://localhost:8081"
// const topologyIpAddress = "http://114.215.254.187:8081"

const flameIpAdress = "http://114.215.254.187:8080"
// const flameIpAdress = "http://localhost:8080"

// 登录页面路径
const LOGIN_PAGE_PATH = '/login';

// 检查当前是否在登录页面
const isLoginPage = () => {
    return window.location.pathname === LOGIN_PAGE_PATH;
};

// 重定向到登录页面
const redirectToLogin = () => {
    // 如果当前已经在登录页面，则不重复跳转
    if (!isLoginPage()) {
        // 清除本地存储的token
        localStorage.removeItem('auth_token');
        // 跳转到登录页面
        window.location.href = LOGIN_PAGE_PATH;
    }
};

// 检查响应是否为401未授权错误
const isUnauthorizedError = (response) => {
    return response && 
           response.data && 
           response.data.code === 401 && 
           response.data.message === '暂未登录或token已经过期';
};

// 创建带有请求拦截器和响应拦截器的 axios 实例
const createAxiosInstance = (baseURL) => {
    const instance = axios.create({
        baseURL,
    });
    
    // 添加请求拦截器，动态获取token
    instance.interceptors.request.use(
        (config) => {
            // 从localStorage动态获取最新的token
            const token = localStorage.getItem('auth_token');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        },
        (error) => {
            return Promise.reject(error);
        }
    );
    
    // 添加响应拦截器，处理401错误
    instance.interceptors.response.use(
        (response) => {
            // 检查响应数据是否为401错误
            if (isUnauthorizedError(response)) {
                redirectToLogin();
                return Promise.reject(new Error('未授权访问，请重新登录'));
            }
            return response;
        },
        (error) => {
            // 处理网络错误或服务器错误
            if (error.response) {
                // 检查是否为401错误
                if (error.response.status === 401 || isUnauthorizedError(error.response)) {
                    redirectToLogin();
                    return Promise.reject(new Error('未授权访问，请重新登录'));
                }
            }
            return Promise.reject(error);
        }
    );
    
    // 设置参数序列化
    instance.defaults.paramsSerializer = params => {
        return qs.stringify(params, { arrayFormat: 'repeat' });
    };
    
    return instance;
};

// 创建各个服务器的实例
const mainApi = createAxiosInstance(ipAddress);
const topologyApi = createAxiosInstance(topologyIpAddress);
const flameApi = createAxiosInstance(flameIpAdress);

// 自定义参数序列化函数
const repeatedParamSerializer = (params) => {
  const parts = [];
  
  Object.entries(params).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      // 处理数组值 - 创建多个键值对
      value.forEach(item => {
        parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(item)}`);
      });
    } else if (value !== null && typeof value !== 'undefined') {
      // 处理单个值
      parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
    }
  });
  
  return parts.join('&');
};

// 手动更新所有axios实例的token（可选，用于特殊情况）
const updateAllApiTokens = () => {
    const token = localStorage.getItem('auth_token');
    if (token) {
        // 为所有已创建的实例更新默认header
        [mainApi, topologyApi, flameApi].forEach(apiInstance => {
            apiInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        });
    }
};

// 封装请求函数，统一处理401错误
const makeRequest = async (requestFn, ...args) => {
    try {
        const response = await requestFn(...args);
        
        // 再次检查响应数据（拦截器可能已经处理，但这里做双重保障）
        if (isUnauthorizedError(response)) {
            redirectToLogin();
            throw new Error('未授权访问，请重新登录'); 
        }
        
        return response;
    } catch (error) {
        // 如果错误已经被拦截器处理过，直接抛出
        if (error.message === '未授权访问，请重新登录') {
            throw error;
        }
        
        // 检查错误响应是否为401
        if (error.response && (error.response.status === 401 || isUnauthorizedError(error.response))) {
            redirectToLogin();
            throw new Error('未授权访问，请重新登录');
        }
        
        throw error;
    }
};

const getAllOverView = async () => {
    return makeRequest(async () => {
        try {
            if(isMock) {
                return overviewGetAllMockData
            }
            const res = await axios.get("http://10.4.10.24:8888/api/overview/getAll", {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
                }
            })
            console.log(res, "sssss");
            const {data = {}} = res
            return data
        } catch (error) {
            console.error("==ERROR==", error);
            throw error;
        }
    });
}

const getIPData = async () => {     
    return makeRequest(async () => {
        try {
            if(isMock) {
                return accessGetAllMockData
            }
            const res = await axios.get("http://10.4.10.24:8888/api/access/getAll", {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
                }
            })
            console.log(res, "sssss");
            const {data = {}} = res
            return data
        } catch (error) {
            console.error("==ERROR==", error);
            throw error;
        }
    });
}

const getActionCollectList = async () => {
    return makeRequest(async () => {
        try {
            const res = await topologyApi.get(`/api/esAgentBasic/search`)
            return res?.data
        } catch (error) {
            console.error("==ERROR==", error)
            throw error;
        }
    });
}

const getConfigTableList = async (data) => {
    return makeRequest(async () => {
        try { 
            const res = await mainApi.get(`/api/user/config/queryByPage`, {
                params: {
                    pageNum: data?.current,
                    pageSize: data?.pageSize
                }
            })
            return res?.data
        } catch (error) {
            console.error("==ERROR==", error)
            throw error;
        }
    });
}

const addConfigTable = async (data) => {
    return makeRequest(async () => {
        try { 
            const res = await mainApi.post(`/api/user/config/add`, data)
            return res
        } catch (error) {
            console.error("==ERROR==", error)
            throw error;
        }
    });
}

const deleteConfigTable = async (data) => {    
    return makeRequest(async () => {
        try { 
            const res = await mainApi.delete(`/api/user/config/delete/${data}`)
            return res
        } catch (error) {
            console.error("==ERROR==", error)
            throw error;
        }
    });
}

const updateConfigTable = async (data) => {    
    return makeRequest(async () => {
        try { 
            const res = await mainApi.delete(`/api/user/config/delete/${data}`)
            return res
        } catch (error) {
            console.error("==ERROR==", error)
            throw error;
        }
    });
}

const logTableQuery = async (data) => {
    return makeRequest(async () => {
        try { 
            const {
                current = 1,
                pageSize = 10,
                keyword
            } = data
            const res = await mainApi.get(`/api/esAgentLog/search`, {
                params: {
                    pageNum: current - 1,
                    pageSize: pageSize,
                    keyword
                }
            })
            
            console.log(res, "res");
            return res
        } catch (error) {
            console.error("==ERROR==", error)
            throw error;
        }
    });
}

const basicTableQuery = async (data) => {    
    return makeRequest(async () => {
        try { 
            const res = await mainApi.get(`/api/esAgentConfig/search`)
            console.log(res, "res");
            return res
        } catch (error) {
            console.error("==ERROR==", error)
            throw error;
        }
    });
}

const monitorChartQuery = async (data) => {    
    return makeRequest(async () => {
        try { 
            const res = await mainApi.get(`/api/esAgentStat/search`, {
                params: {
                    ...data
                }
            })
            console.log(res, "res");
            return res
        } catch (error) {
            console.error("==ERROR==", error)
            throw error;
        }
    });
}

const traceTableQuery = async (data) => {
    console.log(data, "datadata");
    
    return makeRequest(async () => {
        try { 
            const res = await mainApi.get(`/api/esTraces/queryByPage`, {
                params: data,
                paramsSerializer: params => repeatedParamSerializer(params)
            })
            console.log(res, "ressssss");
            return res
        } catch (error) {
            console.error("==ERROR==", error)
            throw error;
        }
    });
}

const traceChartQuery = async (type) => {    
    return makeRequest(async () => {
        try { 
            const res = await mainApi.get(`/api/esTraces/statistic`, {
                params: {
                    type
                }
            })
            console.log(res, "ressssss");
            return res
        } catch (error) {
            console.error("==ERROR==", error)
            throw error;
        }
    });
}

const getFlamegraphDataByTraceId = async (traceId) => {    
    return makeRequest(async () => {
        try {         
            const res = await flameApi.get(`/flamegraphList`, {
                params: {
                    traceId
                }
            })
            const {data = {}} = res
            return data
        } catch (error) {
            console.error("==ERROR==", error)
            throw error;
        }
    });
}

const getFilters = async (data) => {    
    return makeRequest(async () => {
        try { 
            const res = await mainApi.get(`/api/esTraces/filters`, {
                params: data
            })
            const {data: responseData = {}} = res
            return responseData
        } catch (error) {
            console.error("==ERROR==", error)
            throw error;
        }
    });
}

const getTraceDetail = async (traceId) => {    
    return makeRequest(async () => {
        try { 
            const res = await mainApi.get(`/api/esTraces/traceDetail`, {
                params: {
                    traceId: traceId
                }
            })
            const {data = {}} = res
            return data
        } catch (error) {
            console.error("==ERROR==", error)
            throw error;
        }
    });
}

const getTraceCharts = async (type) => {    
    return makeRequest(async () => {
        try { 
            const res = await mainApi.get(`/api/esTraces/statistic`, {
                params: {
                    type: type
                }
            })
            const {data = {}} = res
            return data
        } catch (error) {
            console.error("==ERROR==", error)
            throw error;
        }
    });
}

// 查点指标
const getEsTracesGraphNodes = async (params) => { 
    return makeRequest(async () => {
        try { 
            const res = await topologyApi.get(`/api/esTracesGraph/nodes`, {
                params
            })
            const {data = {}} = res
            console.log(data, "==data==");
            
            return data
        } catch (error) {
            console.error("==ERROR==", error)
            throw error;
        }
    });
}

// 查边指标
const getEsTracesGraphEdges = async (params) => { 
    return makeRequest(async () => {
        try { 
            const res = await topologyApi.get(`/api/esTracesGraph/edges`, {
                params
            })
            const {data = {}} = res
            return data
        } catch (error) {
            console.error("==ERROR==", error)
            throw error;
        }
    });
}

// 查点指标的端点列表
const getEsNodeEndpointList = async (params) => { 
    return makeRequest(async () => {
        try { 
            const res = await topologyApi.get(`/api/esNodes/queryEndpoint`, {
                params,
            })
            const {data = {}} = res
            return data
        } catch (error) {
            console.error("==ERROR==", error)
            throw error;
        }
    });
}

// 查边指标的端点列表
const getEsEdgeEndpointList = async (params) => { 
    return makeRequest(async () => {
        try { 
            const res = await topologyApi.get(`/api/esEdges/queryEndpoint`, {
                params,
            })
            const {data = {}} = res
            return data
        } catch (error) {
            console.error("==ERROR==", error)
            throw error;
        }
    });
}

// 查应用指标 - 请求速率
const getEsKpiQps = async (params) => { 
    return makeRequest(async () => {
        try { 
            const res = await topologyApi.get(`/api/esNodes/kpi/qps`, {
                params,
            })
            const {data = {}} = res
            return data
        } catch (error) {
            console.error("==ERROR==", error)
            throw error;
        }
    });
}

// 查应用指标 - 错误比例
const getEsKpiErrorRate = async (params) => { 
    return makeRequest(async () => {
        try { 
            const res = await topologyApi.get(`/api/esNodes/kpi/errorRate`, {
                params,
            })
            const {data = {}} = res
            return data
        } catch (error) {
            console.error("==ERROR==", error)
            throw error;
        }
    });
}

// 查应用指标 - 响应时延
const getEsKpiLatencyStats = async (params) => { 
    return makeRequest(async () => {
        try { 
            const res = await topologyApi.get(`/api/esNodes/kpi/latencyStats`, {
                params,
            })
            const {data = {}} = res
            return data
        } catch (error) {
            console.error("==ERROR==", error)
            throw error;
        }
    });
}

// 查点的调用日志
const getEsNodesLog = async (params) => { 
    return makeRequest(async () => {
        try { 
            const res = await topologyApi.get(`/api/esNodes/log/queryByPage`, {
                params
            })
            const {data = {}} = res
            return data
        } catch (error) {
            console.error("==ERROR==", error)
            throw error;
        }
    });
}

// 查边的调用日志
const getEsEdgesLog = async (params) => { 
    return makeRequest(async () => {
        try { 
            const res = await topologyApi.get(`/api/esEdges/log/queryByPage`, {
                params
            })
            const {data = {}} = res
            return data
        } catch (error) {
            console.error("==ERROR==", error)
            throw error;
        }
    });
}

//调用日志，状态码分组统计
const getEsNodesLogStatus = async () => { 
    return makeRequest(async () => {
        try { 
            const res = await mainApi.get(`/api/esNodes/statistic/status`)
            const {data = {}} = res
            return data
        } catch (error) {
            console.error("==ERROR==", error)
            throw error;
        }
    });
}

//应用指标 - 请求速率
const getEsNodesQps = async () => { 
    return makeRequest(async () => {
        try { 
            const res = await mainApi.get(`/api/esNodes/kpi/qps`)
            const {data = {}} = res
            return data
        } catch (error) {
            console.error("==ERROR==", error)
            throw error;
        }
    });
}

//应用指标 - 异常比例
const getEsErrorRate = async () => { 
    return makeRequest(async () => {
        try { 
            const res = await mainApi.get(`/api/esNodes/kpi/errorRate`)
            const {data = {}} = res
            return data
        } catch (error) {
            console.error("==ERROR==", error)
            throw error;
        }
    });
}

//应用指标 - 响应时延
const getEsDuration = async () => { 
    return makeRequest(async () => {
        try { 
            const res = await mainApi.get(`/api/esNodes/kpi/duration`)
            const {data = {}} = res
            return data
        } catch (error) {
            console.error("==ERROR==", error)
            throw error;
        }
    });
}

const register = async (params) => { 
    return makeRequest(async () => {
        try { 
            const res = await topologyApi.post(`/api/user/register`, params)
            return res
        } catch (error) {
            console.error("==ERROR==", error)
            throw error;
        }
    });
}

const login = async (params) => { 
    return makeRequest(async () => {
        try { 
            const res = await topologyApi.post(`/api/user/login`, params)
            const {data = {}} = res
            return data
        } catch (error) {
            console.error("==ERROR==", error)
            throw error;
        }
    });
}

// 测试登录态接口
const queryCurrentUser = async (params) => { 
    return makeRequest(async () => {
        try { 
            const res = await topologyApi.get(`/api/esNodes/kpi/errorRate`, {
                params: {
                    startTime: 1761840000000,
                    endTime: 1761926399000,
                    nodeId: 2374000
                }
            })
            return res
        } catch (error) {
            console.error("==ERROR==", error)
            throw error;
        }
    });
}

// 用户采集器注册
const agentRegister = async (params) => { 
    return makeRequest(async () => {
        try { 
            const res = await topologyApi.post(`/api/agent/register`, params)
            return res
        } catch (error) {
            console.error("==ERROR==", error)
            throw error;
        }
    });
}

// 采集器启用
const agentEnable = async (params) => { 
    return makeRequest(async () => {
        try { 
            const res = await topologyApi.post(`/api/agent/enable`, params)
            return res
        } catch (error) {
            console.error("==ERROR==", error)
            throw error;
        }
    });
}

// 采集器禁用
const agentDisable = async (params) => { 
    return makeRequest(async () => {
        try { 
            const res = await topologyApi.post(`/api/agent/disable`, params)
            return res
        } catch (error) {
            console.error("==ERROR==", error)
            throw error;
        }
    });
}

// 采集器删除
const agentDelete = async (params) => { 
    return makeRequest(async () => {
        try { 
            const res = await topologyApi.post(`/api/agent/delete`, params)
            return res
        } catch (error) {
            console.error("==ERROR==", error)
            throw error;
        }
    });
}

// 采集器配置新增/修改
const updateAgentConfigTable = async (params) => { 
    return makeRequest(async () => {
        try { 
            const res = await topologyApi.post(`/api/agent/edit_agent_config`, params)
            return res
        } catch (error) {
            console.error("==ERROR==", error)
            throw error;
        }
    });
}

// 配置分页查询
const queryAgentList = async (params) => { 
    return makeRequest(async () => {
        try { 
            const res = await topologyApi.get(`/api/agent/user/config/queryByPage`, {
                params
            })
            const {data = {}} = res
            return data
        } catch (error) {
            console.error("==ERROR==", error)
            throw error;
        }
    });
}

export {
    getAllOverView,
    getIPData,
    getActionCollectList,
    getConfigTableList,
    addConfigTable,
    deleteConfigTable,
    updateConfigTable,
    logTableQuery,
    basicTableQuery,
    monitorChartQuery,
    traceTableQuery,
    traceChartQuery,
    getFlamegraphDataByTraceId,
    getFilters,
    getTraceDetail,
    getTraceCharts,
    getEsTracesGraphNodes,
    getEsTracesGraphEdges,
    getEsNodeEndpointList,
    getEsEdgeEndpointList,
    getEsKpiQps,
    getEsKpiErrorRate,
    getEsKpiLatencyStats,
    getEsNodesLog,
    getEsEdgesLog,
    register,
    login,
    queryCurrentUser,
    agentRegister,
    agentEnable,
    agentDisable,
    agentDelete,
    updateAllApiTokens, // 导出token更新函数，供外部调用
    updateAgentConfigTable,
    queryAgentList
}