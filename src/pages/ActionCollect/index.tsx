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

import { Button, Drawer, List, Radio, Space, message, Modal, Tabs } from 'antd';

import { PlusOutlined, PlusSquareTwoTone, PlusCircleTwoTone, EllipsisOutlined, PlusSquareFilled  } from '@ant-design/icons';

import CollectTable from "./component/collectTable.tsx"
import ConfigTable from "./component/configTable.tsx"
// import './index.less'
import styles from './index.less'

const ActionCollect = () => {

    const [drawerOpenStatus, setDrawerOpenStatus] = useState(false)
    const [tableListDataSource, setTableListDataSource] = useState([])
    const [isModalOpen, setIsModalOpen] = useState(false)

    const tabs = [
        {
            label: '列表',
            key: '1',
            children: 
                <ProCard
                    ghost
                    title= "采集器列表"
                >
                    <div>
                        <CollectTable></CollectTable>
                    </div>
                </ProCard>
        },
        {
            label: '组',
            key: '2',
            disabled: true,
            children:
                <ProCard
                    ghost
                >
                    <div>
                        <CollectTable></CollectTable>
                    </div>
                </ProCard>
        },
        {
            label: '配置',
            key: '3',
            children: 
                <ProCard
                    ghost
                    title="采集器组配置"
                >
                    <div>
                        <ConfigTable></ConfigTable>
                    </div>
                </ProCard>
        },
        {
            label: '统计',
            key: '4',
            disabled: true,
            children: 
                <ProCard
                    ghost
                >
                    <div>
                        <CollectTable></CollectTable>
                    </div>
                </ProCard>
        },

    ]

    const handleDetectionDelete = () => {
        setIsModalOpen(true)
    }
    const handleDeleteOk = () => {
        // 接口删除列表
        setIsModalOpen(false)
    }
    // const tableListDataSource = [];

    const creators = ['付小小', '曲丽丽', '林东东', '陈帅帅', '兼某某'];

    // for (let i = 0; i < 5; i += 1) {
    // tableListDataSource.push({
    //     key: i,
    //     name: 'AppName',
    //     containers: Math.floor(Math.random() * 20),
    //     creator: creators[Math.floor(Math.random() * creators.length)],
    // });
    // }

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
        ]
        setTableListDataSource(list)
    }, [])

    const onDrawerClose = () => {
        setDrawerOpenStatus(false)
    }

    const waitTime = (time: number = 100) => {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve(true);
          }, time);
        });
      };

    return (
        <PageContainer
            // content="采集器"
        >
            
            <Tabs
                defaultActiveKey="1"
                size={"middle"}
                style={{ marginBottom: 32 }}
                items={tabs}
            />
            <Drawer
                title="设置提醒"
                placement={"right"}
                closable={false}
                onClose={onDrawerClose}
                open={drawerOpenStatus}
            >
                <ProForm
                    onFinish={async (values) => {
                        await waitTime(2000);
                        console.log(values);
                        message.success('提交成功');
                    }}
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
                        label="提醒规则名称"
                        tooltip="最长为 24 位"
                        placeholder="请输入提醒名称"
                    />
                    <ProFormSelect
                        options={[
                            {
                            value: 'day',
                            label: '每天',
                            },
                            {
                            value: 'week',
                            label: '每周',
                            },
                            {
                            value: 'month',
                            label: '每月',
                            },
                        ]}
                        width="md"
                        name="frequence"
                        label="提醒频率"
                    />
                    <ProFormSelect
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
                        label="请选择对应规则"
                    />
                </ProForm>
            </Drawer>
            
            <Modal title="删除确认" open={isModalOpen} onOk={handleDeleteOk} onCancel={() => {setIsModalOpen(false)}}>
                
            </Modal>
        </PageContainer>
    )
}

export default ActionCollect