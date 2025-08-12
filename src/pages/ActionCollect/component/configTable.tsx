import { DownOutlined, DownloadOutlined, CopyOutlined, DeleteOutlined  } from '@ant-design/icons';
import type { ProColumns } from '@ant-design/pro-components';
import { ProTable, TableDropdown } from '@ant-design/pro-components';
import { Button, Tag, Table, Tabs, Descriptions, Select, Drawer, Space, Form, Input, Row, Col, DatePicker, InputNumber } from 'antd';
import {
    getActionCollectList,
    getConfigTableList
} from "../../../services/server.js"
import { useState } from 'react';
import { useForm } from 'antd/es/form/Form.js';

const { Option } = Select;

export type Status = {
  color: string;
  text: string;
};

const columns: ProColumns[] = [
  {
    title: '采集器组',
    width: 200,
    dataIndex: 'groupName',
    render: (_) => <a>{_}</a>,
  },
  {
    title: '团队',
    dataIndex: 'teamName',
  },
  {
    title: 'CPU限制',
    dataIndex: 'maxCpus',
  },
  {
    title: '内存限制',
    dataIndex: 'maxMemory',
    sorter: (a, b) => a.maxMemory - b.maxMemory,
  },
  {
    title: '采集网口',
    width: 400,
    dataIndex: 'collectionPort',
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
        icon={<CopyOutlined />}
      />,
      <Button 
        icon={<DeleteOutlined />}
        key="delete"
      />,
    ],
  },
];

export default () => {
  const [tableDataSource, setTableListDataSource] = useState([])
  const [form] = useForm();
  const [open, setOpen] = useState(false);

  const showDrawer = () => {
    setOpen(true);
  };

  const onClose = () => {
    setOpen(false);
  };

  const submitForm = async () => {
    const values = await form.validateFields()
    console.log(values, "values");
  }

  return (
    <div>
        <ProTable
            scroll={{ x: 'max-content' }}
            columns={columns}
            request={async (params) => {
                // 传递搜索参数到后端，params中会包含groupName的搜索值
                console.log('搜索参数:', params);
                // 实际项目中可以将params传递给接口，实现模糊搜索
                const data = await getConfigTableList(params);
                setTableListDataSource(data.content);
                return {
                  data: data.content,
                  total: data.total || 0, // 确保分页正常工作
                  success: true
                };
            }}
            rowKey="lcuuid"
            pagination={{
                showQuickJumper: true,
            }}
            search={false}
            dateFormatter="string"
            options={{
                search: {
                    name: 'groupName', // 指定搜索字段
                    placeholder: '请输入采集器组名称', // 自定义占位符
                    // 自定义搜索逻辑（可选，如果后端已处理则不需要）
                    onSearch: (value) => {
                        // 这里可以添加前端搜索逻辑
                        console.log('搜索值:', value);
                    }
                },
            }}
            toolBarRender={() => [
                <Button key="addconfig" type="primary" onClick={showDrawer}>
                    新增配置
                </Button>,
            ]}
        />
        <Drawer
            title="创建配置"
            width={720}
            onClose={onClose}
            open={open}
            styles={{
              body: {
                paddingBottom: 80,
              },
            }}
            extra={
              <Space>
                <Button onClick={onClose}>取消</Button>
                <Button onClick={submitForm} type="primary">
                    提交
                </Button>
              </Space>
            }
        >
            <Form layout="vertical" hideRequiredMark form={form}>
                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item
                            name="groupName"
                            label="采集器组"
                            rules={[{ required: true, message: '请输入采集器组' }]}
                        >
                            <Input placeholder="请输入" />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            name="teamName"
                            label="团队"
                            rules={[{ required: true, message: '请输入团队' }]}
                        >
                            <Input placeholder="请输入" />
                        </Form.Item>
                    </Col>
                </Row>
                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item
                            name="maxCpus"
                            label="CPU限制"
                            rules={[{ required: true, message: '请输入CPU限制' }]}
                        >
                            <InputNumber placeholder="请输入" style={{width: "100%"}} />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            name="maxMemory"
                            label="内存限制"
                            rules={[{ required: true, message: '请输入内存限制' }]}
                        >
                            <InputNumber placeholder="请输入" style={{width: "100%"}} addonAfter="MB" />
                        </Form.Item>
                    </Col>
                </Row>
                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item
                            name="collectionPort"
                            label="采集网口"
                            rules={[{ required: true, message: '请输入采集网口' }]}
                        >
                            <Input placeholder="请输入" />
                        </Form.Item>
                    </Col>
                </Row>
            </Form>
        </Drawer>
    </div>
  );
};
