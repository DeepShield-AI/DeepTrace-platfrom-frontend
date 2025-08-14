import { DownOutlined, DownloadOutlined, CopyOutlined, DeleteOutlined  } from '@ant-design/icons';
import type { ProColumns } from '@ant-design/pro-components';
import { ProTable, TableDropdown } from '@ant-design/pro-components';
import { Button, Tag, Table, Tabs, Descriptions  } from 'antd';
import {getActionCollectList, } from "../../../services/server.js"
import { useState } from 'react';

export type Status = {
  color: string;
  text: string;
};

const items = [
  {
    key: 'name',
    label: '采集器名称',
    children: '',
  },
  {
    key: '2',
    label: 'Telephone',
    children: '1810000000',
  },
  {
    key: '3',
    label: 'Live',
    children: 'Hangzhou, Zhejiang',
  },
  {
    key: '4',
    label: 'Remark',
    children: 'empty',
  },
  {
    key: '5',
    label: 'Address',
    children: 'No. 18, Wantang Road, Xihu District, Hangzhou, Zhejiang, China',
  },
];

const statusMap = {
  0: {
    color: 'blue',
    text: '进行中',
  },
  1: {
    color: 'green',
    text: '已完成',
  },
  2: {
    color: 'volcano',
    text: '警告',
  },
  3: {
    color: 'red',
    text: '失败',
  },
  4: {
    color: '',
    text: '未完成',
  },
};

const tableListDataSource = [
  {
    lcuuid: 1,
    name: "sandbox-10.0.221.224-V3",
    group: "Sandbox",
    azName: "T0-Sandbox",
    vtapGroupName: "T0-Sandbox",
    archType: 1, // 1：容器-v
    tapMode: 0, // 0:本地
    cpuNum: 12,
    launchServer: "10.0.221.224",
    podClusterName: "T0-Sandbox",
    ctrlIp: "10.0.221.224",
    state: "running", // 1:运行
    curControllerIp: "10.1.183.140",
    curAnalyzerIp: "10.1.183.142"
  },
  {
    lcuuid: 2,
    name: "sandbox-10.0.221.224-V4",
    group: "Sandbox",
    azName: "T0-Sandbox",
    vtapGroupName: "T0-Sandbox",
    archType: 1, // 1：容器-v
    tapMode: 0, // 0:本地
    cpuNum: 12,
    launchServer: "10.0.221.224",
    podClusterName: "T0-Sandbox",
    ctrlIp: "10.0.221.224",
    state: "running", // 1:运行
    curControllerIp: "10.1.183.140",
    curAnalyzerIp: "10.1.183.142"
  }
];

const columns: ProColumns[] = [
  {
    title: '名称',
    width: 200,
    dataIndex: 'name',
    render: (_) => <a>{_}</a>,
  },
  {
    title: '团队',
    // width: 100,
    dataIndex: 'group',
    // render: (_, record) => (
    //   <Tag color={record.status.color}>{record.status.text}</Tag>
    // ),
  },
  {
    title: '类型',
    // width: 120,
    dataIndex: 'archType',
    align: 'right',
    render: (_, record) => {
      return (
        _ == 0 ? "容器-V" : "--"
      )
    },
    sorter: (a, b) => a.containers - b.containers,
  },
  {
    title: '采集模式',
    // width: 120,
    dataIndex: 'tapMode',
    align: 'right',
    render: (_, record) => {
      return (
        _ == 0 ? "本地" : "--"
      )
    },
    sorter: (a, b) => a.containers - b.containers,
  },
  {
    title: '可用区',
    // width: 120,
    dataIndex: 'azName',
    align: 'right',
    sorter: (a, b) => a.containers - b.containers,
  },
  {
    title: '组',
    // width: 120,
    dataIndex: 'vtapGroupName',
  },
  {
    title: '总CPU（核）',
    // width: 120,
    dataIndex: 'cpuNum',
    align: 'right',
    sorter: (a, b) => a.containers - b.containers,
  },
  {
    title: '运行环境IP',
    // width: 120,
    dataIndex: 'launchServer',
    align: 'right',
    sorter: (a, b) => a.containers - b.containers,
  },
  {
    title: '所属容器集群',
    // width: 120,
    dataIndex: 'podClusterName',
    align: 'right',
    sorter: (a, b) => a.containers - b.containers,
  },
  {
    title: '控制IP',
    // width: 120,
    dataIndex: 'ctrlIp',
    align: 'right',
    sorter: (a, b) => a.containers - b.containers,
  },
  {
    title: '状态',
    // width: 120,
    dataIndex: 'state',
    align: 'right',
    sorter: (a, b) => a.containers - b.containers,
  },
  {
    title: '控制器',
    // width: 120,
    dataIndex: 'curControllerIp',
    align: 'right',
    sorter: (a, b) => a.containers - b.containers,
  },
  {
    title: '数据节点',
    // width: 120,
    dataIndex: 'curAnalyzerIp',
    align: 'right',
    sorter: (a, b) => a.containers - b.containers,
  },
  {
    title: '操作',
    valueType: 'option',
    key: 'option',
    fixed: 'right',
    width: 120,
    render: (text, record, _, action) => [
      <Button
        key="copy"
        onClick={() => {
          action?.startEditable?.(record.id);
        }}
        disabled
        icon={<CopyOutlined></CopyOutlined>}
      >
        
      </Button>,
      <Button 
        disabled 
        href={record.url} 
        key="delete"
        icon={<DeleteOutlined />}
      >
        
      </Button>,
      <TableDropdown
        key="actionGroup"
        onSelect={() => action?.reload()}
        menus={[
          { key: 'edit', name: '编辑' },
        ]}
      />,
    ],
  },
];



export default () => {
  const [tableDataSource, setTableListDataSource] = useState([])
  const [expandRowList, setExpandRowList] = useState([])

  const expandDataMap = {
    arch: "体系架构",
    archType: "类型",
    completeRevision: "完整版本",
    controllerIp: "控制IP",
    cpuNum: "CPU数",
    createTime: "创建时间",
    ctrlIp: "控制IP",
    ctrlMac: "控制Mac地址",
    curAnalyzerIp: "当前分析IP",
    curControllerIp: "当前控制IP",
    currentK8sImage: "当前K8s镜像",
    kernelVersion: "内核版本",
    launchServer: "软件版本",
    licenseType: "许可类型",
    memorySize: "内存大小",
    name: "采集器名称",
    os: "操作系统",
    regionName: "区域",
    revision: "版本",
    state: "状态",
    updateTime: "更新时间",
    vtapGroupName: "采集器组"
  }
  const expandedRowRender = (item) => {
    
    return (
        <Descriptions title="基本信息"> 
          {
            Object.keys(item).map(key => {
              return (
                <Descriptions.Item label={expandDataMap[key]}>{item[key]}</Descriptions.Item>
              )
            })
          }
        </Descriptions>
    )
  };

  return (
    <ProTable
      scroll={{ x: 'max-content' }}
      rowSelection={{
        // 自定义选择项参考: https://ant.design/components/table-cn/#components-table-demo-row-selection-custom
        // 注释该行则默认不显示下拉选项
        selections: [Table.SELECTION_ALL, Table.SELECTION_INVERT],
        // defaultSelectedRowKeys: [1],
      }}
      columns={columns}
      request={async (params, sorter, filter) => {
        // 表单搜索项会从 params 传入，传递给后端接口。
        console.log(params, sorter, filter);
        const data = await getActionCollectList()
        console.log(data, "data---");
        setTableListDataSource(data)
        return data
        return Promise.resolve({
          data: tableListDataSource,
          success: true,
        });
      }}
      dataSource={tableDataSource}
      rowKey="lcuuid"
      pagination={{
        showQuickJumper: true,
      }}
      expandable={{ expandedRowRender }}
      search={false}
      dateFormatter="string"
      options={false}
      toolBarRender={() => [
        <Button key="regist" type="primary" disabled>
          注册
        </Button>,
        <Button key="start" type="primary" disabled>
          启用
        </Button>,
        <Button key="stop" type="primary" disabled>
          禁用
        </Button>,
        <Button key="delete" type="primary" disabled>
          删除
        </Button>,
        <Button key="join" type="primary" disabled>
          加入采集器组
        </Button>,
        <Button key="out" type="primary">
          导出CSV <DownloadOutlined />
        </Button>,
      ]}
    />
  );
};