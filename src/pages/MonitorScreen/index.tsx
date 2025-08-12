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
import './index.less'


const Monitor = () => {
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
        // </PageContainer>
        <iframe src="http://localhost:5000/traffic" frameborder="0" style={{
            height: '100vh'
        }}></iframe>
    )
}

export default Monitor