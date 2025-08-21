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

import { Button, Drawer, List, Radio, Space, message, Modal, Popconfirm, Tag  } from 'antd';

import { PlusOutlined, PlusSquareTwoTone, PlusCircleTwoTone, EllipsisOutlined, PlusSquareFilled, ContainerFilled  } from '@ant-design/icons';
// import './index.less'
import styles from './index.less'

import { CPUChart } from "./charts/cpuChart.tsx"
import { MemoryChart } from "./charts/memoryChart.tsx"
const MonitorNative = () => {

    const [drawerOpenStatus, setDrawerOpenStatus] = useState(false)
    const [caseDrawerOpenStatus, setCaseDrawerOpenStatus] = useState(false)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [tableListDataSource, setTableListDataSource] = useState([])

    const cardStyles = {
        height: 400
    }
    return (
        <PageContainer
            content="采集器监控"
        >
            <ProCard
                ghost
                className={styles.card1}
                style={{
                    // display: 'flex'
                }}
                gutter={8}
                
            >
                <ProCard 
                    style={{...cardStyles}}
                    title={"CPU曲线"}
                >
                    <CPUChart></CPUChart>
                </ProCard>
                <ProCard 
                    style={{...cardStyles}}
                    title={"内存曲线"}
                >
                    <MemoryChart></MemoryChart>
                </ProCard>
            </ProCard>
            <ProCard
                ghost
                className={styles.card1}
                style={{
                    // display: 'flex'
                    marginTop: 20
                }}
                gutter={8}
            >
                <ProCard 
                    style={{...cardStyles}}
                    title={"日志文件数量"}
                >
                    
                    <CPUChart></CPUChart>
                </ProCard>
                <ProCard 
                    style={{...cardStyles}}
                    title={"日志文件大小"}
                >
                    <MemoryChart></MemoryChart>
                </ProCard>
            </ProCard>
        </PageContainer>
    )
}

export default MonitorNative