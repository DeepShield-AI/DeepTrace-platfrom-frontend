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

const Alert = () => {

    const [drawerOpenStatus, setDrawerOpenStatus] = useState(false)
    const [caseDrawerOpenStatus, setCaseDrawerOpenStatus] = useState(false)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [tableListDataSource, setTableListDataSource] = useState([])
    const columns = [
        {
          title: '规则名称',
          dataIndex: 'ruleName',
          render: (_) => <a href={`/security/detection?ruleName=${_}`}>{_}</a>,
        },
        {
          title: '提示数量',
          dataIndex: 'count',
        //   align: 'right',
        //   sorter: (a, b) => a.containers - b.containers,
        },
        {
          title: '规则简述',
          dataIndex: 'ruleDetail',
          render: (_) => {
            return (
                <Popconfirm
                    title="Rule"
                    description="This event is generated when there are a large number of failed login attempts or login requests from abnormal IP addresses"
                    // onConfirm={confirm}
                    // onCancel={cancel}
                    okText="OK"
                    // cancelText="No"
                    showCancel={false}
                    // okButtonProps={null}
                    icon={null}
                >
                    <a>{_}</a>
                </Popconfirm>
            )
          }
        //   valueType: 'select',
        //   valueEnum: {
        //     all: { text: '全部' },
        //     付小小: { text: '付小小' },
        //     曲丽丽: { text: '曲丽丽' },
        //     林东东: { text: '林东东' },
        //     陈帅帅: { text: '陈帅帅' },
        //     兼某某: { text: '兼某某' },
        //   },
        },
        {
            title: "提示等级",
            dataIndex: "level" ,
            render: (level) => {
                let color
                if(level == 'high') {
                    // color = "#DB4E41"
                    color = "error"
                } else if(level == 'middle') {
                    color = "warning"
                } else {
                    color = "success"
                }
                return <Tag color={color}>{level}</Tag>
            }
        },
        {
            title: "id",
            dataIndex: "id"
        },
        {
          title: '操作',
          key: 'option',
          width: 120,
          valueType: 'option',
          render: () => [
            <a onClick={handleAddCaseClick}>添加到cases</a>,
            <a key="warn" onClick={onDelete}>删除</a>,
            <a key="more">
              <EllipsisOutlined />
            </a>,
          ],
        },
    ];
    const handleAddCaseClick = () => {
        setCaseDrawerOpenStatus(true)
    }

    const onDelete = () => {
        setIsModalOpen(true)
    }

    const handleDeleteOk = () => {
        // 数据请求
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


    const handlePlusButtonClick = () => {
        setDrawerOpenStatus(true)
    }

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
            content="Alert模块具备智能推送功能，一旦系统监测到安全事件，便会即刻将相关信息精准推送给您。"
        >
            <ProCard
                ghost
                className={styles.card1}
                style={{
                    display: 'flex'
                }}
            >
                <div className={styles.icons1}>
                    <PlusSquareFilled 
                        className={styles.plusbutton}
                        onClick={handlePlusButtonClick}
                    />
                    <ContainerFilled 
                        className={styles.containerbutton}
                        onClick={() => {window.open("/security/detection")}}
                    />
                </div>
            </ProCard>
            <ProCard style={{marginTop: 25}}>
            <ProTable
                columns={columns}
                request={(params, sorter, filter) => {
                    // 表单搜索项会从 params 传入，传递给后端接口。
                    console.log(params, sorter, filter);
                    return Promise.resolve({
                    data: tableListDataSource,
                    success: true,
                    });
                }}
                toolbar={{
                    search: {
                    onSearch: (value: string) => {
                        alert(value);
                    },
                    },
                    filter: (
                    <LightFilter>
                        <ProFormDatePicker name="startdate" label="响应日期" />
                    </LightFilter>
                    ),
                    actions: [
                    <Button
                        key="primary"
                        type="primary"
                        onClick={() => {
                            setDrawerOpenStatus(true)
                        }}
                    >
                        添加                                                                                                                                                                                         
                    </Button>,
                    ],
                }}
                rowKey="key"
                search={false}
                pagination={true}
                />
            </ProCard>
            <Drawer
                title="设置提醒"
                placement={"right"}
                closable={false}
                onClose={onDrawerClose}
                open={drawerOpenStatus}
                // key={placement}
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
            
            <Drawer
                title="添加到Cases"
                placement={"top"}
                closable={false}
                onClose={() => {setCaseDrawerOpenStatus(false)} }
                open={caseDrawerOpenStatus}
                // key={placement}
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
            <Modal title="删除确认" open={isModalOpen} onOk={handleDeleteOk} onCancel={() => {setIsModalOpen(false)}}>
                
            </Modal>
        </PageContainer>
    )
}

export default Alert