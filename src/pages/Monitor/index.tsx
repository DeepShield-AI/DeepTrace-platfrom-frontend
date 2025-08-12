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
import BaseMontor from './components/BaseMontor'
import TriggerMonitor from './components/triggerMonitor';
// import './index.less'

const Monitor = () => {
    const renderTabBase = () => {
        return (
            <ProCard direction="column" ghost gutter={[0, 16]}>
                <ProCard style={{ height: 200 }} />
                <ProCard gutter={16} ghost>
                    <ProCard colSpan={16} style={{ height: 200 }} />
                    <ProCard colSpan={8} style={{ height: 200 }} />
                </ProCard>
                <ProCard gutter={16} ghost>
                    <ProCard colSpan={8} style={{ height: 200 }} />
                    <ProCard colSpan={16} style={{ height: 200 }} />
                </ProCard>
            </ProCard>
        )
    }
    const renderTabTrigger = () => {
        return (
            <ProCard direction="column" ghost gutter={[0, 16]}>
                <ProCard style={{ height: 200 }} />
                <ProCard gutter={16} ghost>
                    <ProCard colSpan={16} style={{ height: 200 }} />
                    <ProCard colSpan={8} style={{ height: 200 }} />
                </ProCard>
                <ProCard gutter={16} ghost>
                    <ProCard colSpan={8} style={{ height: 200 }} />
                    <ProCard colSpan={16} style={{ height: 200 }} />
                </ProCard>
            </ProCard>
        )
    }

    return (
        <PageContainer
            content="看门狗会自动监测安全事件"
            tabList={[
                {
                  tab: '基本监测',
                  key: 'base',
                  children: <BaseMontor/>
                },
                {
                  tab: '触发监测',
                  key: 'trigger',
                  children: <TriggerMonitor/>
                },
              ]}
        >
        </PageContainer>
    )
}

export default Monitor