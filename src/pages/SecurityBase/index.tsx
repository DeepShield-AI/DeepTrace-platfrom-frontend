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
import Chart3 from './components/chart3.tsx';
import Chart4 from './components/chart4.tsx';
import Chart5 from './components/chart5.tsx';
import Chart6 from './components/chart6.tsx';



// import Chart3 from './components/chart3.tsx';
// import BaseMontor from './components/BaseMontor'
// import TriggerMonitor from './components/triggerMonitor';
// import './index.less'
import {SECURITY_CARD_DATA} from '../../mock.ts'



const BaseModule = () => {
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
        //     content="系统安全事件监测"
        // >
            <ProCard direction="column" ghost gutter={[0, 16]}>
                {/* part1 */}
                {/* part2 */}
                <ProCard gutter={16} ghost>
                    <ProCard colSpan={12} style={{ height: 300, padding: 0 }} title={"带宽曲线图"} >
                        <Chart1 />
                    </ProCard>
                    <ProCard colSpan={12} style={{ height: 300, padding: 0 }} title={"流量曲线图"}>
                        <Chart2></Chart2>
                    </ProCard>
                </ProCard>
                <ProCard gutter={16} ghost>
                    <ProCard colSpan={12} style={{ height: 300, padding: 0 }} title={"并发量曲线图"} >
                        <Chart3></Chart3>
                    </ProCard>
                    <ProCard colSpan={12} style={{ height: 300, padding: 0 }} title={"数据包曲线图"}>
                        <Chart4></Chart4>
                    </ProCard>
                </ProCard>
                <ProCard gutter={16} ghost>
                    <ProCard colSpan={12} style={{ height: 300, padding: 0 }} title={"IP数据量统计"} >
                        <Chart6></Chart6>
                    </ProCard>
                    <ProCard colSpan={12} style={{ height: 300, padding: 0 }} title={"威胁IP统计"}>
                        <Chart6></Chart6>
                    </ProCard>
                </ProCard>
            </ProCard>
        // </PageContainer>
    )
}

export default BaseModule