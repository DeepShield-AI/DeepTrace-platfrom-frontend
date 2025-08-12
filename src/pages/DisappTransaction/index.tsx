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

const codeString = `
const data = {
    {
        traceId: '1a2b3c4d',
        server: 'productcatalogservice',
        client: 'recommendationservice-7fdcbbf66c-prdcs',
        protocol: 'HTTP2',
        latency: '367μs',
        clienterror: '0%',
        servererror: '0%',
        time: '20250101'
    },
    {
        traceId: '1a2b3c4d',
        server: 'otel-agent-scdrw',
        client: 'checkoutservice-7f69d98578-rk5fc',
        protocol: 'HTTP2',
        latency: '467μs',
        clienterror: '0%',
        servererror: '0%',
        time: '20250101'
    },
    {
        traceId: '1a2b3c4d',
        server: 'otel-agent',
        client: 'paymentservice-6df5f8595f-8pjtm',
        protocol: 'HTTP2',
        latency: '367μs',
        clienterror: '0%',
        servererror: '0%',
        time: '20250101'
    },
    {
        traceId: '1a2b3c4d',
        server: 'shippingservice-686df85ddc-csvx9',
        client: 'frontend-7b49dcdd95-mrvqx',
        protocol: 'gRPC',
        latency: '367μs',
        clienterror: '0%',
        servererror: '0%',
        time: '20250101'
    },
    {
        traceId: '1a2b3c4d',
        server: 'productcatalogservice-69948c768c-qnls5',
        client: 'recommendationservice-7fdcbbf66c-prdcs',
        protocol: 'gRPC',
        latency: '367μs',
        clienterror: '0%',
        servererror: '0%',
        time: '20250101'
    },
    {
        traceId: '1a2b3c4d',
        server: '169.254.25.10',
        client: 'frontend-7b49dcdd95-mrvqx',
        protocol: 'DNS',
        latency: '367μs',
        clienterror: '0%',
        servererror: '0%',
        time: '20250101'
    },
    {
        traceId: '1a2b3c4d',
        server: '169.254.25.10',
        client: 'frontend-7b49dcdd95-mrvqx',
        protocol: 'DNS',
        latency: '367μs',
        clienterror: '0%',
        servererror: '0%',
        time: '20250101'
    },
    {
        traceId: '1a2b3c4d',
        server: 'productcatalogservice',
        client: 'recommendationservice-7fdcbbf66c-prdcs',
        protocol: 'HTTP2',
        latency: '367μs',
        clienterror: '0%',
        servererror: '0%',
        time: '20250101'
    },
    {
        traceId: '1a2b3c4d',
        server: '0.0.0.0',
        client: 'frontend-7b49dcdd95-mrvqx',
        protocol: 'gRPC',
        latency: '367μs',
        clienterror: '0%',
        servererror: '0%',
        time: '20250101'
    },
    {
        traceId: '1a2b3c4d',
        server: 'otel-agent-4n555',
        client: 'productcatalogservice-69948c768c-qnls5',
        protocol: 'gRPC',
        latency: '367μs',
        clienterror: '0%',
        servererror: '0%',
        time: '20250101'
    },
    {
        traceId: '1a2b3c4d',
        server: '169.254.25.10',
        client: 'checkoutservice-7f69d98578-rk5fc',
        protocol: 'DNS',
        latency: '367μs',
        clienterror: '0%',
        servererror: '0%',
        time: '20250101'
    },
    {
        traceId: '1a2b3c4d',
        server: 'paymentservice-6df5f8595f-8pjtm',
        client: 'checkoutservice-7f69d98578-rk5fc',
        protocol: 'gRPC',
        latency: '367μs',
        clienterror: '0%',
        servererror: '0%',
        time: '20250101'
    },

}
 `;

const options = [];
for (let i = 10; i < 36; i++) {
  options.push({
    value: i.toString(36) + i,
    label: i.toString(36) + i,
  });
}

const columns = [
    {
      title: 'TraceId',
      dataIndex: 'traceId',
    },
    {
      title: 'Server',
      dataIndex: 'server',
    },
    {
      title: 'Client',
      dataIndex: 'client',
    },
    {
      title: 'Protocol',
      dataIndex: 'protocol',
    },
    {
        title: 'Latency',
        dataIndex: 'latency'
    },
    {
        title: 'Client error',
        dataIndex: 'clienterror'
    },
    {
        title: 'Server error',
        dataIndex: 'servererror'
    },
    {
      title: 'Time',
      dataIndex: 'time',
    },
  ];
  const dataSource = [
    {
        traceId: '1a2b3c4d',
        server: 'productcatalogservice',
        client: 'recommendationservice-7fdcbbf66c-prdcs',
        protocol: 'HTTP2',
        latency: '367μs',
        clienterror: '0%',
        servererror: '0%',
        time: '20250101'
    },
    {
        traceId: '1a2b3c4d',
        server: 'otel-agent-scdrw',
        client: 'checkoutservice-7f69d98578-rk5fc',
        protocol: 'HTTP2',
        latency: '467μs',
        clienterror: '0%',
        servererror: '0%',
        time: '20250101'
    },
    {
        traceId: '1a2b3c4d',
        server: 'otel-agent',
        client: 'paymentservice-6df5f8595f-8pjtm',
        protocol: 'HTTP2',
        latency: '367μs',
        clienterror: '0%',
        servererror: '0%',
        time: '20250101'
    },
    {
        traceId: '1a2b3c4d',
        server: 'shippingservice-686df85ddc-csvx9',
        client: 'frontend-7b49dcdd95-mrvqx',
        protocol: 'gRPC',
        latency: '367μs',
        clienterror: '0%',
        servererror: '0%',
        time: '20250101'
    },
    {
        traceId: '1a2b3c4d',
        server: 'productcatalogservice-69948c768c-qnls5',
        client: 'recommendationservice-7fdcbbf66c-prdcs',
        protocol: 'gRPC',
        latency: '367μs',
        clienterror: '0%',
        servererror: '0%',
        time: '20250101'
    },
    {
        traceId: '1a2b3c4d',
        server: '169.254.25.10',
        client: 'frontend-7b49dcdd95-mrvqx',
        protocol: 'DNS',
        latency: '367μs',
        clienterror: '0%',
        servererror: '0%',
        time: '20250101'
    },
    {
        traceId: '1a2b3c4d',
        server: '169.254.25.10',
        client: 'frontend-7b49dcdd95-mrvqx',
        protocol: 'DNS',
        latency: '367μs',
        clienterror: '0%',
        servererror: '0%',
        time: '20250101'
    },
    {
        traceId: '1a2b3c4d',
        server: 'productcatalogservice',
        client: 'recommendationservice-7fdcbbf66c-prdcs',
        protocol: 'HTTP2',
        latency: '367μs',
        clienterror: '0%',
        servererror: '0%',
        time: '20250101'
    },
    {
        traceId: '1a2b3c4d',
        server: '0.0.0.0',
        client: 'frontend-7b49dcdd95-mrvqx',
        protocol: 'gRPC',
        latency: '367μs',
        clienterror: '0%',
        servererror: '0%',
        time: '20250101'
    },
    {
        traceId: '1a2b3c4d',
        server: 'otel-agent-4n555',
        client: 'productcatalogservice-69948c768c-qnls5',
        protocol: 'gRPC',
        latency: '367μs',
        clienterror: '0%',
        servererror: '0%',
        time: '20250101'
    },
    {
        traceId: '1a2b3c4d',
        server: '169.254.25.10',
        client: 'checkoutservice-7f69d98578-rk5fc',
        protocol: 'DNS',
        latency: '367μs',
        clienterror: '0%',
        servererror: '0%',
        time: '20250101'
    },
    {
        traceId: '1a2b3c4d',
        server: 'paymentservice-6df5f8595f-8pjtm',
        client: 'checkoutservice-7f69d98578-rk5fc',
        protocol: 'gRPC',
        latency: '367μs',
        clienterror: '0%',
        servererror: '0%',
        time: '20250101'
    },
  ]

const Monitor = () => {

    const [cardList, setCardList] = useState([
        {title: "指标值1", value: "1,200", status: 1},
        {title: "指标值2", value: "1,200", status: 2},
        {title: "指标值3", value: "1,200", status: 3},
        {title: "指标值4", value: "1,200", status: 4},
    ])

    const [selectedRowKeys, setSelectedRowKeys] = useState([]);

    const [value, setValue] = useState();
    const onChange = (newValue) => {
        setValue(newValue);
    };
    const onPopupScroll = (e) => {
        console.log('onPopupScroll', e);
    };


    const onSelectChange = (newSelectedRowKeys) => {
        console.log('selectedRowKeys changed: ', newSelectedRowKeys);
        setSelectedRowKeys(newSelectedRowKeys);
    };
    const rowSelection = {
        selectedRowKeys,
        onChange: onSelectChange,
    };

    return (
        <PageContainer
            content="集群节点健康度"
        >
            <ProCard direction="column" ghost gutter={[0, 16]}>
                <ProCard gutter={16} title="集群Trace记录">
                    <Table 
                        rowSelection={rowSelection} 
                        columns={columns} 
                        dataSource={dataSource} 
                        pagination={{
                            position: ["topLeft"],
                        }}
                        size="small"
                    />
                </ProCard>
                <ProCard ghost style={{height: 500}}>
                    <ProCard style={{marginLeft: 20}} title="Trace flame graph">
                        <svg width={900} height={420}>
                            <Flamegraph data={stacks} width={1280} enableClick />
                        </svg>
                    </ProCard>
                </ProCard>
                {/* <ProCard gutter={16} title="Trace flame graph">
                    <ProCard  style={{height: 420}}>
                        <svg width={1280} height={420}>
                            <Flamegraph data={stacks} width={1280} enableClick />
                        </svg>                    
                    </ProCard>
                </ProCard> */}
                <ProCard gutter={16} title="JSON">
                    {/* <Live scope={scope} code={codeString} /> */}
                    <CodeBlock
                        language="javascript" // 指定代码语言
                        text={codeString}
                        showLineNumbers // 是否显示行号（这是一个布尔属性，不需要赋值）
                        />
                </ProCard>
            </ProCard>
        </PageContainer>
    )
}

export default Monitor