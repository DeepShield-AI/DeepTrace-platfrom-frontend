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

const TriggerMonitor = () => {
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

export default TriggerMonitor