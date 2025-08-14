import { DownOutlined, DownloadOutlined, CopyOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ProColumns } from '@ant-design/pro-components';
import { ProTable, TableDropdown } from '@ant-design/pro-components';
import { 
  Button, 
  Tag, 
  Table, 
  Tabs, 
  Descriptions, 
  Select, 
  Drawer, 
  Space, 
  Form, 
  Input, 
  Row, 
  Col, 
  DatePicker, 
  InputNumber,
  message,
  Popconfirm
} from 'antd';
import {
    getActionCollectList,
    getConfigTableList,
    addConfigTable,
    deleteConfigTable
} from "../../../services/server.js"
import { useState, useRef } from 'react';
import { useForm } from 'antd/es/form/Form.js';

const { Option } = Select;

export type Status = {
  color: string;
  text: string;
};

export default () => {
  const [tableDataSource, setTableListDataSource] = useState([]);
  const [form] = useForm();
  const [open, setOpen] = useState(false);
  const tableRef = useRef(); // 添加表格引用

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
        <Popconfirm
          key="delete-confirm"
          title="确定要删除吗？"
          onConfirm={() => deleteItem(record)}
          okText="确定"
          cancelText="取消"
        >
          <Button 
            icon={<DeleteOutlined />}
            key="delete"
          />
        </Popconfirm>,
      ],
    },
  ];

  const showDrawer = () => {
    setOpen(true);
  };

  const onClose = () => {
    setOpen(false);
  };

  // 优化删除函数，添加错误处理和表格刷新
  const deleteItem = async (record) => {
    try {
      const res = await deleteConfigTable(record.id);
      console.log(res, "删除结果");
      
      if(res?.status === 200) {
        message.success('删除成功');
        // 刷新表格数据 - 方法1: 直接调用查询函数
        await queryTableList({});
        tableRef.current?.reload(); // 强制刷新表格
        // 或者方法2: 使用ProTable的reload方法(如果使用tableRef)
        // tableRef.current?.reload();
      } else {
        message.error('删除失败');
      }
    } catch (error) {
      console.error('删除出错:', error);
      message.error('删除出错');
    }
  }

  // 提取查询函数，方便复用
  const queryTableList = async (params) => {
    try {
      const data = await getConfigTableList(params);
      setTableListDataSource(data.content);
      return {
        data: data.content,
        total: data.totalElements || 0,
        success: true
      };
    } catch (error) {
      console.error('查询数据出错:', error);
      return {
        data: [],
        total: 0,
        success: false
      };
    }
  }

  const submitForm = async () => {
    try {
      const values = await form.validateFields();
      const res = await addConfigTable(values);
      console.log(res, "提交结果");
      
      if(res?.status === 200) {
        await queryTableList({});
        message.success("提交成功");
        tableRef.current?.reload(); // 强制刷新表格
        setOpen(false);
      }
    } catch (error) {
      console.error("提交出错:", error);
      message.error("提交出错");
    }
  }

  return (
    <div>
        <ProTable
            scroll={{ x: 'max-content' }}
            columns={columns}
            request={queryTableList} // 直接使用提取的函数
            rowKey="lcuuid"
            pagination={{
                showQuickJumper: true,
                showSizeChanger: true
            }}
            search={false}
            dateFormatter="string"
            actionRef={tableRef} // 添加actionRef以便手动控制表格
            options={{
                search: {
                    name: 'groupName',
                    placeholder: '请输入采集器组名称',
                    onSearch: async (value) => {
                        const res = await getConfigTableList({});
                        console.log('搜索值:', value, res);
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