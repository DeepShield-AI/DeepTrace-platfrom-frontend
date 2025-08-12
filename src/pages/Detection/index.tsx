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

import { Button, Drawer, List, Radio, Space, message, Modal } from 'antd';

import { PlusOutlined, PlusSquareTwoTone, PlusCircleTwoTone, EllipsisOutlined, PlusSquareFilled  } from '@ant-design/icons';

// import './index.less'
import styles from './index.less'

const Detection = () => {

    const [drawerOpenStatus, setDrawerOpenStatus] = useState(false)
    const [tableListDataSource, setTableListDataSource] = useState([])
    const [isModalOpen, setIsModalOpen] = useState(false)
    const columns = [
        {
          title: '规则名称',
          dataIndex: 'ruleName',
          render: (_) => <a onClick={() => {
            window.open(`/Detectiondetail?name=${_}`)
          }}>{_}</a>, // TODO 结合这一条的id进行跳转
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
                    color = "#DB4E41"
                } else if(level == 'middle') {
                    color = "#F8E96E"
                } else {
                    color = "#00FF00"
                }
                return <span style={{color: color}}>{level}</span>
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
            // <a key="link">链路</a>,
            <a key="warn" onClick={handleDetectionDelete}>删除</a>,
            <a key="more">
              <EllipsisOutlined />
            </a>,
          ],
        },
    ];

    const groupTableColumn1 = [
        {
            title: "No",
            dataIndex: "key",
            valueType: "indexBorder"
        },
        {
          title: 'Count',
          dataIndex: 'count',
        //   valueType: 'indexBorder',
        },
        {
          title: 'Type',
          dataIndex: 'type',
          search: false,
        },
      ];

    const groupTableColumn2 = [
        {
            title: "Ruleset",
            dataIndex: "ruleset",
            // valueType: "indexBorder"
        },
        {
          title: 'Count',
          dataIndex: 'count',
        //   valueType: 'indexBorder',
        },
        {
          title: 'Enabled',
          dataIndex: 'enabled',
        //   render: (_) => {

        //   }
        //   search: false,
        },
      ];

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
            content="您可在【detection】模块自行灵活设定规则，系统将依据您所设规则，精准匹配与之对应的事件，并在【Alert】模块及时向您发出提示。"
        >
            <ProCard
                ghost
            >
                <Button onClick={() => {
                    window.open('/Detectiondetail')
                }}>
                    测试
                </Button>
                <div>
                    <PlusSquareFilled 
                        className={styles.plusbutton}
                        onClick={handlePlusButtonClick}
                    />
                </div>
                <div>

                </div>
            </ProCard>
            <ProCard style={{marginTop: 25}} title="Group Metrics">
                <ProCard>
                    <ProTable
                        columns={groupTableColumn1}
                        request={async (params) => {
                        console.log(params);
                        return {
                            data: [
                                {
                                    key: 1,
                                    count: 56211,
                                    type: "suricata",
                                },
                                {
                                    key: 2,
                                    count: 3256,
                                    type: "yara",
                                },
                                {
                                    key: 3,
                                    count: 1235,
                                    type: "sigma",
                                },
                            ],
                            success: true,
                        };
                        }}
                        search={false}
                    />
                </ProCard>
                <ProCard>
                    <ProTable
                        columns={groupTableColumn2}
                        request={async (params) => {
                            return {
                                data: [
                                    {
                                        ruleset: "ETOPEN",
                                        count: 56211,
                                        enabled: true,
                                    },
                                    {
                                        ruleset: "core",
                                        count: 3256,
                                        enabled: false,
                                    },
                                    {
                                        ruleset: "ETOPEN-2",
                                        count: 1235,
                                        enabled: false,
                                    },
                                    {
                                        ruleset: "ETOPEN-2",
                                        count: 123,
                                        enabled: false,
                                    },
                                    {
                                        ruleset: "ETOPEN-2",
                                        count: 87,
                                        enabled: false,
                                    },
                                ],
                                success: true,
                            };
                        }}
                        search={false}
                    />
                </ProCard>
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
            
            <Modal title="删除确认" open={isModalOpen} onOk={handleDeleteOk} onCancel={() => {setIsModalOpen(false)}}>
                
            </Modal>
        </PageContainer>
    )
}

export default Detection