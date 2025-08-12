import React, { useRef, useState } from 'react';
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
// import Chart3 from './components/chart3.tsx';
// import BaseMontor from './components/BaseMontor'
// import TriggerMonitor from './components/triggerMonitor';
// import './index.less'
import {SECURITY_CARD_DATA} from '../../mock.ts'



const NetworkModule = () => {
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

    return (
        // <PageContainer
        //     content="系统网络概览"
        // >
            
            <ProCard direction="column" ghost gutter={[0, 16]}>
                {/* part1 */}
                <ProCard gutter={16} style={{height: 400}} title={"流量地区分布统计"}>
                    {/* <Chart3></Chart3> */}
                    <Chart1></Chart1>
                </ProCard>
                {/* part2 */}
                <ProCard gutter={16} ghost>
                    <Chart2></Chart2>
                </ProCard>
            </ProCard>
        // </PageContainer>
    )
}

export default NetworkModule