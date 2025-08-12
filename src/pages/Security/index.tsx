import React, { useEffect, useRef, useState } from 'react';
import {
    FooterToolbar,
    ModalForm,
    PageContainer,
    ProDescriptions,
    ProFormText,
    ProFormTextArea,
    ProTable,
    ProCard
  } from '@ant-design/pro-components';
import { Line } from '@ant-design/charts';
import Chart1 from './components/chart1.tsx';
import Chart2 from './components/chart2.tsx';
import Chart3 from './components/chart3.tsx';
// import BaseMontor from './components/BaseMontor'
// import TriggerMonitor from './components/triggerMonitor';
// import './index.less'
import {SECURITY_CARD_DATA} from '../../mock.ts'
import { 
    getAllOverView,
    getIPData
} from '../../services/server.js'

import {
    accessGetAllMockData,
    overviewGetAllMockData
} from '../../services/mock.js'

import { OVERVIEW_CARD_MAP } from "../../constant"


const Monitor = () => {
    
    const [overViewCardData, setOverViewCardData] = useState([])
    const [ipVolData, setIpVolData] = useState([])
    const [ipThreatData, setIpThreatData] = useState([])

    useEffect( () => {
        //总览卡片数据请求
        // const overviewData = await getAllOverView()
        // //TODO 设置日期选择
        // setOverViewCardData(cardDataHandler(overviewData[0]))
        // //IP数据量统计接口请求
        // const ipData = await getIPData()
        // setIpVolData(ipDataVolHandler(ipData))
        // console.log(ipData, "ipDataipData");
        // setIpThreatData(ipThreatHandler(ipData))
        setOverViewCardData(cardDataHandler(overviewGetAllMockData[0]))
        setIpThreatData(ipThreatHandler(accessGetAllMockData))
        setIpVolData(ipDataVolHandler(accessGetAllMockData))
    }, [])



    const renderConfigCard = (config) => {
        return (
            <ProCard colSpan={4} style={{ 
                height: 100, 
                marginTop: 10, 
                // alignItems:'center', 
                // justifyContent: 'center' 
            }} >
                <div>{config.title}</div>
                <div style={{fontSize: 20, fontWeight: 500}}>{config.value}</div>
            </ProCard>
        )
    }

    const cardDataHandler = (overviewData) => {
        const data: any = []
        if(!overviewData) {
            return []
        }
        Object.keys(overviewData).map(item => {
            if(OVERVIEW_CARD_MAP[item]) {
                data.push({
                    title: OVERVIEW_CARD_MAP[item],
                    value: overviewData[item]
                })
            }
        })
        return data
    }

    const ipDataVolHandler = (ipVolData) => {
        const data: any = []
        if(!ipVolData) {
            return []
        }
        ipVolData.map(item => {
            data.push({
                title: item.ip,
                value: item.visitCount
            })
        })
        console.log(data, "llll");
        return data
    }

    const ipThreatHandler = (ipVolData) => {
        const data: any = []
        if(!ipVolData) {
            return []
        }
        ipVolData.map(item => {
            if(item.isThreat == 1) {
                data.push({
                    type: item.ip,
                    value: item.visitCount
                })
            }
        })
        return data
    }
    
    return (
        <PageContainer
            content="系统安全事件监测"
        >
            <ProCard direction="column" ghost gutter={[0, 16]}>
                {/* part1 */}
                <ProCard gutter={16} ghost wrap>
                    {
                        overViewCardData?.map(item => {
                            return renderConfigCard(item)
                        })
                    }
                </ProCard>
                <ProCard gutter={16} style={{height: 400}} title={"流量地区分布统计"}>
                    <Chart3></Chart3>
                </ProCard>
                {/* part2 */}
                <ProCard gutter={16} ghost>
                    <ProCard colSpan={10} style={{ height: 300, padding: 0 }} title={"IP数据量统计"} >
                        <Chart1 ipVolData={ipVolData}/>
                    </ProCard>
                    <ProCard colSpan={14} style={{ height: 300, padding: 0 }} title={"威胁IP统计"}>
                        <Chart2 ipThreatData={ipThreatData}></Chart2>
                    </ProCard>
                </ProCard>
            </ProCard>
        </PageContainer>
    )
}


export default Monitor