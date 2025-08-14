import axios from 'axios'
import {
    accessGetAllMockData,
    overviewGetAllMockData
} from './mock.js'

// mock接口数据
let isMock = true

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
        const res = await axios.get("http://114.215.254.187:8082/api/esAgentBasic/search")
        return res?.data
    } catch (error) {
        console.error("==ERROR==", error)
    }
}

const getConfigTableList = async (data) => {
    try { 
        const res = await axios.get("http://114.215.254.187:8082/api/user/config/queryByPage", {
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
        const res = await axios.post("http://114.215.254.187:8082/api/user/config/add", data)
        console.log(res, "res");
        return res
    } catch (error) {
        console.error("==ERROR==", error)
    }
}

const deleteConfigTable = async (data) => {    
    try { 
        const res = await axios.delete(`http://114.215.254.187:8082/api/user/config/delete/${data}`)
        console.log(res, "res");
        return res
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
    deleteConfigTable
}