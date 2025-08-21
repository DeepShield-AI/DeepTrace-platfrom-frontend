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

import { 
    Button, 
    Drawer, 
    List, 
    Radio, 
    Space, 
    message, 
    Modal, 
    Popconfirm, 
    Tag,
    TimePicker,
    DatePicker,
    Spin
} from 'antd';

import { PlusOutlined, PlusSquareTwoTone, PlusCircleTwoTone, EllipsisOutlined, PlusSquareFilled, ContainerFilled  } from '@ant-design/icons';
import styles from './index.less'

import { CPUChart } from "./charts/cpuChart.tsx"
import { MemoryChart } from "./charts/memoryChart.tsx"
import moment from 'moment';

import {monitorChartQuery} from "../../services/server.js"

const { RangePicker } = DatePicker;

const MonitorNative = () => {
    const [drawerOpenStatus, setDrawerOpenStatus] = useState(false)
    const [caseDrawerOpenStatus, setCaseDrawerOpenStatus] = useState(false)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [tableListDataSource, setTableListDataSource] = useState([])
    const [loading, setLoading] = useState(false)
    const [timeRange, setTimeRange] = useState([])
    const [CPUList, setCPUList] = useState([])
    const [memoryList, setMemoryList] = useState([])
    const [defaultRange, setDefaultRange] = useState([]) // 存储默认时间范围

    const cardStyles = {
        height: 400
    }

    useEffect(() => {
        // 设置默认时间范围（前一天00:00:00到01:00:00）
        const now = new Date();
        const yesterday = new Date(now);
        yesterday.setDate(now.getDate() - 1);
        
        // 设置开始时间为前一天00:00:00
        const startTime = new Date(yesterday);
        startTime.setHours(0, 0, 0, 0);
        
        // 设置结束时间为前一天01:00:00
        const endTime = new Date(yesterday);
        endTime.setHours(1, 0, 0, 0);
        
        // 格式化日期为字符串
        const formatDate = (date) => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            const seconds = String(date.getSeconds()).padStart(2, '0');
            
            return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
        };
        
        const startStr = formatDate(startTime);
        const endStr = formatDate(endTime);
        
        setDefaultRange([startStr, endStr]);
        setTimeRange([startStr, endStr]);
        
        // 获取默认时间范围的监控数据
        getMonitorData(
            formatToBasicISO(startStr),
            formatToBasicISO(endStr)
        );
    }, [])

    const formatToBasicISO = (dateTimeStr) => {
        if (!dateTimeStr) return ''
        
        // 直接将空格替换为T
        return dateTimeStr.replace(' ', 'T')
    }

    const getMonitorData = async (startTime, endTime) => {
        setLoading(true);
        try {
            console.log(startTime, endTime, "time");
            
            const params = {
                startTime: startTime || new Date().toISOString(),
                endTime: endTime || new Date().toISOString()
            };
            const res = await monitorChartQuery(params);
            console.log(res, "monitor");
            
            // 处理CPU数据并进行抽样
            const rawCPUData = res?.data?.cpu || [];
            const sampledCPUData = sampleData(rawCPUData, 50);
            setCPUList(sampledCPUData);
            // 处理memory数据并进行抽样
            const rawMemoryData = res?.data?.memory || [];
            const sampledMemoryData = sampleData(rawMemoryData, 50);
            setMemoryList(sampledMemoryData);
            
        } catch (error) {
            message.error('获取监控数据失败');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    // 数据抽样函数：从数据数组中平均抽取指定数量的点
    const sampleData = (data, targetCount) => {
        // 如果数据量小于等于目标数量，直接返回原数据
        if (data.length <= targetCount) {
            return [...data];
        }
        
        // 计算抽样间隔（向上取整确保不会超过数组长度）
        const interval = Math.ceil(data.length / targetCount);
        const result = [];
        
        // 按间隔抽取数据点
        for (let i = 0; i < targetCount; i++) {
            // 计算当前索引，确保不超过数组最大索引
            const index = Math.min(i * interval, data.length - 1);
            result.push(data[index]);
        }
        
        // 确保最后一个点是原始数据的最后一个点
        if (result.length > 0 && result[result.length - 1] !== data[data.length - 1]) {
            result[result.length - 1] = data[data.length - 1];
        }
        
        return result;
    };

    const handleTimeRangeChange = (dates, dateStrings) => {
        if (dates && dates.length === 2) {
            setTimeRange(dateStrings)
            // 将日期字符串转换为 20250821T11:00:00 格式
            const startTime = formatToBasicISO(dateStrings[0])
            const endTime = formatToBasicISO(dateStrings[1])
            getMonitorData(startTime, endTime)
        }
    }

    return (
        <PageContainer
            title="采集器监控"
            content={
                <RangePicker 
                    showTime
                    format="YYYY-MM-DD HH:mm:ss"
                    onChange={handleTimeRangeChange}
                    defaultValue={defaultRange.length === 2 ? [
                        moment(defaultRange[0], 'YYYY-MM-DD HH:mm:ss'),
                        moment(defaultRange[1], 'YYYY-MM-DD HH:mm:ss')
                    ] : null}
                />
            }
        >
            <Spin spinning={loading} tip="加载中..." size="large">
                <ProCard
                    ghost
                    className={styles.card1}
                    style={{
                        // display: 'flex'
                    }}
                    gutter={8}
                >
                    <ProCard 
                        style={{...cardStyles}}
                        title={"CPU曲线"}
                    >
                        <CPUChart
                            chartData={CPUList}
                        ></CPUChart>
                    </ProCard>
                    <ProCard 
                        style={{...cardStyles}}
                        title={"内存曲线"}
                    >
                        <MemoryChart
                            chartData={memoryList}
                        ></MemoryChart>
                    </ProCard>
                </ProCard>
                <ProCard
                    ghost
                    className={styles.card1}
                    style={{
                        // display: 'flex'
                        marginTop: 20
                    }}
                    gutter={8}
                >
                    <ProCard 
                        style={{...cardStyles}}
                        title={"日志文件数量"}
                    >
                        <CPUChart></CPUChart>
                    </ProCard>
                    <ProCard 
                        style={{...cardStyles}}
                        title={"日志文件大小"}
                    >
                        <MemoryChart></MemoryChart>
                    </ProCard>
                </ProCard>
            </Spin>
        </PageContainer>
    )
}

export default MonitorNative