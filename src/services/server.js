import axios from 'axios'
import {
    accessGetAllMockData,
    overviewGetAllMockData
} from './mock.js'

// mock接口数据
let isMock = true

// const ipAddress = "202.112.237.37"
const ipAddress = "http://114.215.254.187:8081"
const flameIpAdress = "http://114.215.254.187:8088"


const getAllOverView = async () => {

    try {
        // const res = await axios.get("http://10.0.9.9:8888/api/overview/getAll")
        if(isMock) {
            return overviewGetAllMockData
        }
        const res = await axios.get("http://10.4.10.24:8888/api/overview/getAll")
        console.log(res, "sssss");
        const {data = {}} = res
        return isMock ? overviewGetAllMockData : data
    } catch (error) {
        console.error("==ERROR==", error);
    }
}

const getIPData = async () => {     
                                                                                                                                                                                                                 
    try {
        if(isMock) {
            return accessGetAllMockData
        }
        const res = await axios.get("http://10.4.10.24:8888/api/access/getAll")
        console.log(res, "sssss");
        const {data = {}} = res
        return isMock ? accessGetAllMockData : data
    } catch (error) {
        console.error("==ERROR==", error);
    }
}

const getActionCollectList = async () => {
    try {
        const res = await axios.get(`${ipAddress}/api/esAgentBasic/search`)
        return res?.data
    } catch (error) {
        console.error("==ERROR==", error)
    }
}

const getConfigTableList = async (data) => {
    try { 
        const res = await axios.get(`${ipAddress}/api/user/config/queryByPage`, {
            params: {
                pageNum: data?.current,
                pageSize: data?.pageSize
            }
        })
        return res?.data
    } catch (error) {
        console.error("==ERROR==", error)
    }
}

const addConfigTable = async (data) => {
    try { 
        const res = await axios.post(`${ipAddress}/api/user/config/add`, data)
        return res
    } catch (error) {
        console.error("==ERROR==", error)
    }
}

const deleteConfigTable = async (data) => {    
    try { 
        const res = await axios.delete(`${ipAddress}/api/user/config/delete/${data}`)
        return res
    } catch (error) {
        console.error("==ERROR==", error)
    }
}

const logTableQuery = async (data) => {
    try { 
        const {
            current = 1,
            pageSize = 10,
            keyword
        } = data
        const res = await axios.get(`${ipAddress}/api/esAgentLog/search`, {
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
    }
}

const basicTableQuery = async (data) => {    
    try { 
        const res = await axios.get(`${ipAddress}/api/esAgentConfig/search`)
        console.log(res, "res");
        return res
    } catch (error) {
        console.error("==ERROR==", error)
    }
}

const monitorChartQuery = async (data) => {    
    try { 
        const res = await axios.get(`${ipAddress}/api/esAgentStat/search`, {
            params: {
                ...data
            }
        })
        console.log(res, "res");
        return res
    } catch (error) {
        console.error("==ERROR==", error)
    }
}

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

const traceTableQuery = async (data) => {
    console.log(data, "datadata");
    
    try { 
        const res = await axios.get(`${ipAddress}/api/esTraces/queryByPage`, {
            params: data,
            paramsSerializer: params => repeatedParamSerializer(params)
        })
        console.log(res, "ressssss");
        return res
    } catch (error) {
        console.error("==ERROR==", error)
    }
}

const traceChartQuery = async (data) => {    
    try { 
        const res = await axios.get(`${ipAddress}/api/esTraces/statistic`, {
            params: {
                ...data
            }
        })
        console.log(res, "ressssss");
        return res
    } catch (error) {
        console.error("==ERROR==", error)
    }
}

const getFlamegraphDataByTraceId = async (traceId) => {    
    try { 
        const res = await axios.get(`${flameIpAdress}/flamegraphList`, {
            params: {
                traceId: traceId
            }
        })
        const {data = {}} = res
        return data
    } catch (error) {
        console.error("==ERROR==", error)
    }
}

export {
    getAllOverView,
    getIPData,
    getActionCollectList,
    getConfigTableList,
    addConfigTable,
    deleteConfigTable,
    logTableQuery,
    basicTableQuery,
    monitorChartQuery,
    traceTableQuery,
    traceChartQuery,
    getFlamegraphDataByTraceId
}