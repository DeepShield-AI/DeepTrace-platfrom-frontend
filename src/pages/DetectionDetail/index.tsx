import React, { useEffect, useRef, useState } from 'react';
import {
    FooterToolbar,
    ModalForm,
    PageContainer,
    ProDescriptions,
    ProFormTextArea,
    ProTable,
    ProCard,
    ProForm,
    ProFormDependency,
    ProFormSelect,
    ProFormText,
    LightFilter,
    ProFormDatePicker,
    
  } from '@ant-design/pro-components';

import { Button, Drawer, List, Radio, Space, message, Modal, Descriptions  } from 'antd';

import { PlusOutlined, PlusSquareTwoTone, PlusCircleTwoTone, EllipsisOutlined, PlusSquareFilled  } from '@ant-design/icons';

import ScatterChart from "./ScatterChart.tsx"
// import './index.less'
import styles from './index.less'

const DetectionDetail = () => {

    const [drawerOpenStatus, setDrawerOpenStatus] = useState(false)
    const [tableListDataSource, setTableListDataSource] = useState([])
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [descriptionsList, setDescriptionList] = useState([
        {title: "事件编号", content: "#123"},
        {title: "事件名称", content: "渗透测试"},
        {title: "检出手段", content: "包检测"},
        {title: "描述信息", content: "==Threat=="},
        {title: "事件级别", content: "high"},
        {title: "发生时间", content: "2025-5-20 10:30"},
        {title: "持续时间", content: "15min"},
        {title: "其他信息", content: "无"},
    ]) //综合威胁事件信息
    const [threatDescriptionList, setThreatDescriptionList] = useState([
        {title: "地理信息", content: "局域网/局域网"},
        {title: "资产标签", content: "-"},
        {title: "经纬度", content: "0,0"},
        {title: "资产范围", content: "10.0.0.0/8"},
        {title: "时区", content: "--"},
        {title: "运营商", content: "--"},
        {title: "系统标签", content: "--"},
    ]) //威胁设备信息
    const [sufferDescriptionList, setSufferDescriptionList] = useState([
        {title: "地理信息", content: "局域网/局域网"},
        {title: "资产标签", content: "-"},
        {title: "经纬度", content: "0,0"},
        {title: "资产范围", content: "10.0.0.0/8"},
        {title: "时区", content: "--"},
        {title: "运营商", content: "--"},
        {title: "系统标签", content: "--"},
    ]) //威胁设备信息

    useEffect(() => {
        // todo 取数据替换数据
        const list = [
            {
                ruleName: 'rule1',
                count: 243,
                ruleDetail: "ET MALWARE Win32/ssLoad Tasking Request(POST)",
                level: "high",
                id: "2052099"
            },
            {
                ruleName: 'rule2',
                count: 244,
                ruleDetail: "ET MALWARE Win32/ssLoad Tasking Request(POST)",
                level: "middle",
                id: "2052099"
            },
            {
                ruleName: 'rule3',
                count: 245,
                ruleDetail: "ET MALWARE Win32/ssLoad Tasking Request(POST)",
                level: "low",
                id: "2052099"
            },
            {
                ruleName: 'rule4',
                count: 246,
                ruleDetail: "ET MALWARE Win32/ssLoad Tasking Request(POST)",
                level: "low",
                id: "2052099"
            },
            {
                ruleName: 'rule5',
                count: 247,
                ruleDetail: "ET MALWARE Win32/ssLoad Tasking Request(POST)",
                level: "high",
                id: "2052099"
            },
            {
                ruleName: 'rule6',
                count: 248,
                ruleDetail: "ET MALWARE Win32/ssLoad Tasking Request(POST)",
                level: "middle",
                id: "2052099"
            },
            {
                ruleName: 'rule7',
                count: 249,
                ruleDetail: "ET MALWARE Win32/ssLoad Tasking Request(POST)",
                level: "high",
                id: "2052099"
            },
            {
                ruleName: 'rule8',
                count: 250,
                ruleDetail: "ET MALWARE Win32/ssLoad Tasking Request(POST)",
                level: "middle",
                id: "2052099"
            },
            {
                ruleName: 'rule9',
                count: 251,
                ruleDetail: "ET MALWARE Win32/ssLoad Tasking Request(POST)",
                level: "high",
                id: "2052099"
            },
            // {
            //     ruleName: 'rule10',
            //     count: 252,
            //     ruleDetail: "ET MALWARE Win32/ssLoad Tasking Request(POST)",
            //     level: "middle",
            //     id: "2052099"
            // },
            // {
            //     ruleName: 'rule11',
            //     count: 253,
            //     ruleDetail: "ET MALWARE Win32/ssLoad Tasking Request(POST)",
            //     level: "low",
            //     id: "2052099"
            // },
            // {
            //     ruleName: 'rule12',
            //     count: 254,
            //     ruleDetail: "ET MALWARE Win32/ssLoad Tasking Request(POST)",
            //     level: "high",
            //     id: "2052099"
            // }
        ]
        setTableListDataSource(list)
    }, [])

    /**
     * 渲染事件信息列表方法
     */
    const renderDescriptionsFun = () => {
        
        return (
            
            <Descriptions title="">
                {
                    descriptionsList.map((item) => {
                        return (
                            <Descriptions.Item label={item.title}>
                                {item.content}
                            </Descriptions.Item>
                        )
                    })
                }
            </Descriptions>
        )
    }

    return (
        <PageContainer
            content="Detection Detail"
        >
            <ProCard
                // ghost
                title="事件信息"
                // style={{padding: 0}}
            >
                {renderDescriptionsFun()}
            </ProCard>
            <ProCard ghost style={{marginTop: 25, padding: 0}} title="" gutter={[16,16]}>
                <ProCard title="威胁设备" gutter={16} colSpan={12}>
                    <Descriptions>
                        {
                            threatDescriptionList.map((item) => {
                                return (
                                    <Descriptions.Item label={item.title}>
                                        {item.content}
                                    </Descriptions.Item>
                                )
                            })
                        }
                    </Descriptions>
                </ProCard>
                <ProCard title="受害设备" gutter={16} colSpan={12}>
                    <Descriptions>
                        {
                            sufferDescriptionList.map((item) => {
                                return (
                                    <Descriptions.Item label={item.title}>
                                        {item.content}
                                    </Descriptions.Item>
                                )
                            })
                        }
                    </Descriptions>
                </ProCard>
            </ProCard>
            <ProCard style={{marginTop: 25}} title="当前机器告警行为时序变化">
                <ScatterChart></ScatterChart>
            </ProCard>
        </PageContainer>
    )
}

export default DetectionDetail