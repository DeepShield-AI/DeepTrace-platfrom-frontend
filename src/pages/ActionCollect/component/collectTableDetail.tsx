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

import { Button, Drawer, List, Radio, Space, message, Modal, Tabs, Descriptions } from 'antd';

import { PlusOutlined, PlusSquareTwoTone, PlusCircleTwoTone, EllipsisOutlined, PlusSquareFilled, SelectOutlined  } from '@ant-design/icons';

import { useLocation, Link } from 'react-router-dom';

import { expandDataMap, basicDataMap } from '../../../constant'

import {
    logTableQuery,
    basicTableQuery
} from "../../../services/server.js"

import {formatDate} from "../.././../utils"
import { history } from '@umijs/max';
// import './index.less'

const ActionCollect = () => {

    const [drawerOpenStatus, setDrawerOpenStatus] = useState(false)
    const [tableListDataSource, setTableListDataSource] = useState([])
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [itemDetail, setItemDetail] = useState({})
    const [logTableData, setLogTableData] = useState([])
    const [basicTableData, setBasicTableData] = useState([])

    const location = useLocation();
    
    const logColumns = [
        {
            title: '时间',
            width: 180,
            dataIndex: 'timestamp',
            render: (_) => {
                console.log(_);
                return formatDate(new Date(_))
            },
            hideInSearch: true
        },
        {
            title: '日志级别',
            dataIndex: 'level',
            width: 300,
            sorter: (a, b) => a.containers - b.containers,
            hideInSearch: true

        },
        {
            title: '日志内容',
            dataIndex: 'content',
        },
    ];
    
    useEffect( () => {
        const { item } = location.state || {};
        setItemDetail(item)
        // getLogTableData()
        getBasicTableData()
    }, [])

    const getBasicTableData = async () => {
        try {
            const res = await basicTableQuery()
            console.log(res, "basic");
            const { data = [{}]} = res
            setBasicTableData(data[0])
        } catch (error) {
            console.error('查询数据出错:', error);
        }
    }

    const getLogTableData = async (params, data, filter) => {
        console.log(params, filter, "ccc");
        
        try {
            const {current, pageSize, content} = params
            const res = await logTableQuery({
                current,
                pageSize,
                keyword: content
            })
            const { data = [] } = res
            console.log(res, "logRRR");
            
            const dataRes = data?.content?.map(item => {
                return item
            })
            setLogTableData(dataRes)
            return {
                data: dataRes,
                total: data.totalElements, //todo 待修改
                success: true
            }
        } catch (error) {
            console.error('查询数据出错:', error);
            return {
                data: [],
                total: 0,
                success: false
            };
        }
    }
    const expandedRowRender = (item) => {
        return (
            <Descriptions> 
            {
                Object.keys(item).map(key => {
                    if(expandDataMap[key]) {
                        return (
                            <Descriptions.Item key={item.name} label={expandDataMap[key]}>{item[key] || "-"}</Descriptions.Item>
                        )
                    }
                })
            }
            </Descriptions>
        )
    };

    const configTableRender = (item) => {
        return (
            <Descriptions> 
                {
                    Object.keys(item).map(key => {
                        if(basicDataMap[key]) {
                            return (
                                <Descriptions.Item key={item.name} label={basicDataMap[key]}>{item[key] || "-"}</Descriptions.Item>
                            )
                        }
                    })
                }
            </Descriptions>
        )
    };

    const logRender = () => {
        return (
             <ProTable
                columns={logColumns}
                // dataSource={logTableData}
                rowKey="key"
                pagination={{
                    showQuickJumper: true,
                }}
                request={
                    getLogTableData
                }
                search={{
                    // optionRender: true,
                    // collapsed: false,
                }}
                dateFormatter="string"
                headerTitle="表格标题"
                // toolBarRender={() => [
                //     <Button key="show">查看日志</Button>,
                //     <Button key="out">
                //     导出数据
                //     <DownOutlined />
                //     </Button>,
                //     <Button type="primary" key="primary">
                //     创建应用
                //     </Button>,
                // ]}
                />
        )
    }
    const tabs = [
        {
            label: '基本信息',
            key: '1',
            children: 
                <ProCard
                    ghost
                    title= "基本信息"
                >
                    <div>
                        {expandedRowRender(itemDetail)}
                    </div>
                </ProCard>
        },
        {
            label: '配置信息',
            key: '2',
            // onclick: async () => {
            //     await basicTableQuery()
            // },
            children: 
                <ProCard
                    ghost
                    title= "配置信息"
                >
                    <div>
                        {configTableRender(basicTableData)}
                    </div>
                </ProCard>
        },
        {
            label: <Link 
                to="/Monitor/custom"
                style={{color: "#000"}}    
            ><SelectOutlined />监控信息</Link>,
            key: '3'
            // disabled: true,
            // onClick: () => {
            //     history.push("/Monitor/Monitor/custom")
            // },
            // children: 
            //     <ProCard
            //         ghost
            //         title= "监控信息"
            //     >
            //         <div>
            //             {expandedRowRender(itemDetail)}
            //         </div>
            //     </ProCard>
        },
        {
            label: '运行日志',
            key: '4',
            children: 
                <ProCard
                    ghost
                    title= "运行日志"
                >
                    <div>
                        {logRender()}
                    </div>
                </ProCard>
        },

    ]

    
    // const expandedRowRender = (item) => {
    //     return (
    //         <Descriptions title="基本信息"> 
    //         {
    //             Object.keys(item).map(key => {
    //             return (
    //                 <Descriptions.Item label={expandDataMap[key]}>{item[key]}</Descriptions.Item>
    //             )
    //             })
    //         }
    //         </Descriptions>
    //     )
    // };

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
            
        </PageContainer>
    )
}

export default ActionCollect