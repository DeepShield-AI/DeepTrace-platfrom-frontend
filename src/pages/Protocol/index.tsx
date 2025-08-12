import React, { useEffect, useRef, useState } from 'react';
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
import {
    Select,
    Button,
    Table,
    TreeSelect
} from 'antd'
import * as echarts from 'echarts';
import axios from 'axios';
const $ = require('jquery')
import {data, treeData} from "./data.js"
import OrgChartTree from './component/d3Tree.tsx';


import { Line } from '@ant-design/charts';

import Chart1 from './component/chart1.tsx';
// import FlameGraph from './component/flamegraph.js';
import Flamegraph from './component/flamegraph.js'
import stacks from "./stack.json"

import { CodeBlock } from 'react-code-blocks';
import OverView from './components/overview.tsx'

const TabPane = ProCard.TabPane

const Monitor = () => {

    return (
        <PageContainer
            content="协议"
        >
            <ProCard title="数据包" direction="column" gutter={[0, 16]}>
            </ProCard>
            <ProCard 
                title="协议详情" 
                direction="column" 
                gutter={[0, 16]} 
                style={{marginTop: 20}}
                tabs={{
                    type: 'card'
                }}
            >
                <ProCard.TabPane key="overview" tab="总览">
                    <OverView></OverView>
                </ProCard.TabPane>
                <ProCard.TabPane key="connection" tab="连接">
                    连接
                </ProCard.TabPane>
                <ProCard.TabPane key="http" tab="HTTP">
                    连接
                </ProCard.TabPane>
                <ProCard.TabPane key="https" tab="HTTPS">
                    连接
                </ProCard.TabPane>
                <ProCard.TabPane key="dns" tab="DNS">
                    连接
                </ProCard.TabPane>
            </ProCard>
        </PageContainer>
    )
}

export default Monitor