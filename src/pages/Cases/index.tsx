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
    ProList
  } from '@ant-design/pro-components';

import { Button, Drawer, List, Radio, Space, message, Tag } from 'antd';

import { PlusOutlined, PlusSquareTwoTone, PlusCircleTwoTone, EllipsisOutlined, PlusSquareFilled, ContainerFilled  } from '@ant-design/icons';

// import './index.less'
import styles from './index.less'

const Alert = () => {

    const [drawerOpenStatus, setDrawerOpenStatus] = useState(false)

    const [tableListDataSource, setTableListDataSource] = useState([])
    const columns = [
        {
          title: 'Timestamp',
          dataIndex: 'timestamp',
          // render: (_) => <a>{_}</a>,
          
        },
        {
          title: 'Title',
          dataIndex: 'title',
          render: (_) => {
            return (_)
          }
        //   align: 'right',
        //   sorter: (a, b) => a.containers - b.containers,
        },
        {
          title: 'Status',
          dataIndex: 'status',
        },
        {
            title: "Severity",
            dataIndex: "severity" ,
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
            <a key="link">链路</a>,
            <a key="warn">删除</a>,
            <a key="more">
              <EllipsisOutlined />
            </a>,
          ],
        },
    ];


    useEffect(() => {
        // todo 取数据替换数据
        const list = [
            {
                timestamp: '1743539520',
                title: "OSSEC: 典型事件1",
                status: "active",
                severity: "high",
                id: "2052099"
            },
            {
                timestamp: '1743539520',
                title: "Test: 典型事件2",
                status: "active",
                severity: "middle",
                id: "2052099"
            },
            {
                timestamp: '1743539520',
                title: "TesT: 典型事件3",
                status: "active",
                severity: "high",
                id: "2052099"
            },
            {
                timestamp: '1743539520',
                title: "OSSEC: 典型事件4",
                status: "active",
                severity: "low",
                id: "2052099"
            },
            {
                timestamp: '1743539520',
                title: "OSSEC: 典型事件5",
                status: "active",
                severity: "middle",
                id: "2052099"
            },
            {
                timestamp: '1743539520',
                title: "OSSEC: 典型事件6",
                status: "active",
                severity: "high",
                id: "2052099"
            },
            {
                timestamp: '1743539520',
                title: "OSSEC: 典型事件7",
                status: "active",
                severity: "high",
                id: "2052099"
            },
        ]
        setTableListDataSource(list)
    }, [])


    const handlePlusButtonClick = () => {
        // setDrawerOpenStatus(true)
        window.open("/security/alert")
    }

    const onDrawerClose = () => {
        setDrawerOpenStatus(false)
    }

    const renderCaseTable = () => {
      return (
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
      )
    }

    // const renderCaseTable = (case) => {
    //     // 1、请求对应case的表格信息
    //     // 2、进行表格展示
    //     return
    // }

    const waitTime = (time: number = 100) => {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve(true);
          }, time);
        });
      };

    return (
        <PageContainer
            content="“Cases” 可以将相关的事件集中关联在一起，形成一个特定的调查案例。例如，当检测到一系列疑似网络攻击的事件时，可以创建一个新的案例，将这些事件添加到该案例中，方便后续的统一管理和处理。"
        >
            <div className={styles.icons1}>
                <PlusSquareFilled 
                    className={styles.plusbutton}
                    onClick={handlePlusButtonClick}
                />
                {/* <ContainerFilled 
                    className={styles.containerbutton}
                    onClick={() => {window.open("/security/alert")}}
                /> */}
            </div>
            <ProCard
                ghost
                className={styles.card1}
                style={{
                    display: 'flex'
                }}
                tabs={{
                    items: [{
                        key: '1',
                        label: 'Case1',
                        children: renderCaseTable(),
                      },
                      {
                        key: '2',
                        label: 'Case2',
                        children: renderCaseTable(),
                      },
                      {
                        key: '3',
                        label: 'Case3',
                        children: renderCaseTable(),
                      },]
                }}
            >
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
        </PageContainer>
    )
}

export default Alert