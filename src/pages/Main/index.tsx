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
import Chart1 from './components/chart1.tsx';
import Chart2 from './components/chart2.tsx';
import Chart3 from './components/chart3.tsx';

import HttpTable from './protocols/http.tsx';
// import AlertTable from './alert/index.tsx'
import { AlertTable } from './alert/index.tsx';
// import BaseMontor from './components/BaseMontor'
// import TriggerMonitor from './components/triggerMonitor';
// import './index.less'
// import {SECURITY_CARD_DATA} from '../../mock.ts'
// import { 
//     getAllOverView,
//     getIPData
// } from '../../services/server.js'

import {
    accessGetAllMockData,
    overviewGetAllMockData
} from '../../services/mock.js'

import { OVERVIEW_CARD_MAP } from "../../constant"

import { Button, Drawer, List, Radio, Space, message, Tag, DatePicker } from 'antd';

import BaseModule from "../SecurityBase/index.tsx"
import LoadModule from "../SecurityLoad/index.tsx"
import NetworkModule from "../SecurityNetWork/index.tsx"

const {RangePicker} = DatePicker

const Monitor = () => {
    
    
    const groupTableColumn1 = [
        {
            title: "No",
            dataIndex: "key",
            valueType: "indexBorder"
        },
        {
          title: 'Count',
          dataIndex: 'count',
        //   valueType: 'indexBorder',
        },
        {
          title: 'Type',
          dataIndex: 'type',
          search: false,
        },
      ];

    const groupTableColumn2 = [
        {
            title: "Ruleset",
            dataIndex: "ruleset",
            // valueType: "indexBorder"
        },
        {
          title: 'Count',
          dataIndex: 'count',
        //   valueType: 'indexBorder',
        },
        {
          title: 'Enabled',
          dataIndex: 'enabled',
        //   render: (_) => {

        //   }
        //   search: false,
        },
      ];

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
                <ProCard ghost>
                    <RangePicker width={400}/>
                </ProCard>
                <ProCard title="Network protocol" collapsible>
                    <HttpTable></HttpTable>
                </ProCard>
                <ProCard title="Alert" collapsible>
                    <AlertTable></AlertTable>
                </ProCard>
                <ProCard title="Detection" collapsible>
                    <ProCard>
                        <ProTable
                            columns={groupTableColumn1}
                            request={async (params) => {
                            console.log(params);
                            return {
                                data: [
                                    {
                                        key: 1,
                                        count: 56211,
                                        type: "suricata",
                                    },
                                    {
                                        key: 2,
                                        count: 3256,
                                        type: "yara",
                                    },
                                    {
                                        key: 3,
                                        count: 1235,
                                        type: "sigma",
                                    },
                                ],
                                success: true,
                            };
                            }}
                            search={false}
                        />
                    </ProCard>
                    <ProCard>
                        <ProTable
                            columns={groupTableColumn2}
                            request={async (params) => {
                                return {
                                    data: [
                                        {
                                            ruleset: "ETOPEN",
                                            count: 56211,
                                            enabled: true,
                                        },
                                        {
                                            ruleset: "core",
                                            count: 3256,
                                            enabled: false,
                                        },
                                        {
                                            ruleset: "ETOPEN-2",
                                            count: 1235,
                                            enabled: false,
                                        },
                                        {
                                            ruleset: "ETOPEN-2",
                                            count: 123,
                                            enabled: false,
                                        },
                                        {
                                            ruleset: "ETOPEN-2",
                                            count: 87,
                                            enabled: false,
                                        },
                                    ],
                                    success: true,
                                };
                            }}
                            search={false}
                        />
                    </ProCard>
                </ProCard>
                <ProCard gutter={16} ghost wrap >
                    {
                        overViewCardData?.map(item => {
                            return renderConfigCard(item)
                        })
                    }
                </ProCard>
                <ProCard gutter={16} ghost>
                    <ProCard colSpan={10} style={{ height: 300, padding: 0 }} title={"IP数据量统计"} >
                        <Chart1 ipVolData={ipVolData}/>
                    </ProCard>
                    <ProCard colSpan={14} style={{ height: 300, padding: 0 }} title={"威胁IP统计"}>
                        <Chart2 ipThreatData={ipThreatData}></Chart2>
                    </ProCard>
                </ProCard>
                <ProCard gutter={16} style={{height: 400}} title={"流量地区分布统计"}>
                    <Chart3></Chart3>
                </ProCard>
            </ProCard>
            {/* 试验观测 */}
            {/* <ProCard collapsible title="试验观测" ghost bordered headerBordered>
            </ProCard> */}
            {/* part1 */}
            {/* <ProCard collapsible title="基本数据监
            测图表" ghost bordered headerBordered >
                <BaseModule></BaseModule>
            </ProCard>
            <ProCard collapsible title="试验系统负载图表" ghost bordered headerBordered>
                <LoadModule></LoadModule>
            </ProCard>
            <ProCard collapsible title="试验系统负载图表" ghost bordered headerBordered >
                <NetworkModule></NetworkModule>
            </ProCard> */}
        </PageContainer>
    )
}


export default Monitor