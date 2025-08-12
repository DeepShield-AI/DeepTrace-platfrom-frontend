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

import { Button, Drawer, List, Radio, Space, message } from 'antd';

import { PlusOutlined, PlusSquareTwoTone, PlusCircleTwoTone, EllipsisOutlined, PlusSquareFilled, ContainerFilled  } from '@ant-design/icons';

const waitTime = (time: number = 100) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(true);
      }, time);
    });
  };

const CasesDrawer = ({
    onClose,
    open,
    submitFun = async (values) => {
        await waitTime(2000);
        console.log(values);
        message.success('提交成功');
    }
}) => {
    return (
        
        <Drawer
            title="添加到Cases"
            placement={"top"}
            closable={false}
            onClose={onClose}
            open={open}
            // key={placement}
        >
            <ProForm
                onFinish={submitFun}
                initialValues={{
                    ruleName: '',
                    frequence: '',
                    rule: 'Rule1'
                    // useMode: 'chapter',
                }}
                >
                <ProFormText
                    width="md"
                    name="ruleName"
                    label="case备注名称"
                    tooltip="最长为 24 位"
                    placeholder="请输入提醒名称"
                />
                <ProFormSelect
                    options={[
                        {
                        value: 'case1',
                        label: 'Case1',
                        },
                        {
                        value: 'case2',
                        label: 'Case2',
                        },
                        {
                        value: 'case3',
                        label: 'Case3',
                        },
                    ]}
                    width="md"
                    name="frequence"
                    label="请选择事件对应cases"
                />
                {/* <ProFormSelect
                    options={[
                        {
                        value: 'Rule1',
                        label: 'Rule1',
                        },
                        {
                        value: 'Rule2',
                        label: 'Rule2',
                        },
                        {
                        value: 'Rule3',
                        label: 'Rule3',
                        },
                    ]}
                    width="md"
                    name="rule"
                    label="请选择对应"
                /> */}
            </ProForm>
        </Drawer>
    )
}
export default CasesDrawer