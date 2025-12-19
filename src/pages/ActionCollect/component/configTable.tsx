import React, { useState, useRef, useEffect } from 'react';
import {
  DownOutlined, DownloadOutlined, CopyOutlined, DeleteOutlined,
  EditOutlined, PlusOutlined, ReloadOutlined, SearchOutlined
} from '@ant-design/icons';
import type { ProColumns, ActionType } from '@ant-design/pro-components';
import { ProTable, TableDropdown } from '@ant-design/pro-components';
import {
  Button,
  Tag,
  Tabs,
  Descriptions,
  Select,
  Drawer,
  Space,
  Form,
  Input,
  Row,
  Col,
  InputNumber,
  message,
  Popconfirm,
  Spin,
  Alert,
  Empty,
  Tooltip
} from 'antd';
import {
  getActionCollectList,
  getConfigTableList,
  addConfigTable,
  deleteConfigTable,
  updateConfigTable // 新增：假设存在更新接口
} from "../../../services/server.js";
import CollectorConfigForm from './CollectorConfigForm'; // 引入配置表单组件

const { Option } = Select;

// 定义状态类型
export type Status = {
  color: string;
  text: string;
};

// 表格列配置
const getColumns = (handleEdit, handleDelete, handleCopy) => {
  const columns: ProColumns[] = [
    {
      title: '采集器组',
      width: 200,
      dataIndex: 'groupName',
      render: (value) => <a style={{ color: '#1890ff' }}>{value}</a>,
      search: {
        inputProps: { placeholder: '请输入采集器组名称' },
      },
    },
    {
      title: '团队',
      dataIndex: 'teamName',
      search: {
        inputProps: { placeholder: '请输入团队名称' },
      },
    },
    {
      title: 'CPU限制',
      dataIndex: 'maxCpus',
      render: (value) => `${value}核`,
      sorter: (a, b) => a.maxCpus - b.maxCpus,
    },
    {
      title: '内存限制',
      dataIndex: 'maxMemory',
      render: (value) => `${value}MB`,
      sorter: (a, b) => a.maxMemory - b.maxMemory,
    },
    {
      title: '采集网口',
      width: 400,
      dataIndex: 'collectionPort',
      ellipsis: true,
      tooltip: true,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 120,
      render: (value) => {
        const statusMap = {
          0: { color: 'default', text: '未启用' },
          1: { color: 'success', text: '运行中' },
          2: { color: 'warning', text: '异常' },
        };
        const status = statusMap[value] || statusMap[0];
        return <Tag color={status.color}>{status.text}</Tag>;
      },
      filters: [
        { text: '未启用', value: 0 },
        { text: '运行中', value: 1 },
        { text: '异常', value: 2 },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: '操作',
      valueType: 'option',
      key: 'option',
      fixed: 'right',
      width: 200,
      render: (text, record) => [
        <Tooltip key="edit" title="编辑配置">
          <Button
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            size="small"
            type="primary"
          />
        </Tooltip>,
        <Tooltip key="copy" title="复制配置">
          <Button
            icon={<CopyOutlined />}
            onClick={() => handleCopy(record)}
            size="small"
          />
        </Tooltip>,
        <Popconfirm
          key="delete-confirm"
          title="确定要删除吗？删除后不可恢复！"
          onConfirm={() => handleDelete(record)}
          okText="确定"
          cancelText="取消"
          placement="left"
        >
          <Button
            icon={<DeleteOutlined />}
            size="small"
            danger
          />
        </Popconfirm>,
      ],
    },
  ];
  return columns;
};

export default () => {
  // 状态管理
  const [tableDataSource, setTableListDataSource] = useState([]);
  const [form] = Form.useForm();
  const [configForm] = Form.useForm(); // 配置表单的form实例
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false); // 编辑抽屉状态
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [currentRecord, setCurrentRecord] = useState(null); // 当前编辑/复制的记录
  const tableRef = useRef<ActionType>(); // 表格引用

  // 查询表格数据
  const queryTableList = async (params = {}) => {
    try {
      setLoading(true);
      const data = await getConfigTableList(params);
      setTableListDataSource(data.content || []);
      return {
        data: data.content || [],
        total: data.totalElements || 0,
        success: true
      };
    } catch (error) {
      console.error('查询数据出错:', error);
      message.error('数据加载失败，请重试');
      return {
        data: [],
        total: 0,
        success: false
      };
    } finally {
      setLoading(false);
    }
  };

  // 初始化加载数据
  useEffect(() => {
    queryTableList();
  }, []);

  // 新增配置
  const showDrawer = () => {
    setCurrentRecord(null);
    configForm.resetFields();
    setOpen(true);
  };

  // 编辑配置
  const handleEdit = (record) => {
    setCurrentRecord(record);
    configForm.setFieldsValue({
      ...record,
      // 适配表单字段名映射（如果有差异）
      agent_name: record.groupName,
      host_ip: record.collectionIp || '',
    });
    setEditOpen(true);
  };

  // 复制配置
  const handleCopy = (record) => {
    setCurrentRecord({ ...record, id: undefined }); // 清除ID作为新记录
    configForm.setFieldsValue({
      ...record,
      agent_name: `${record.groupName}_copy`,
      host_ip: record.collectionIp || '',
    });
    setOpen(true);
    message.info('已复制配置，请修改后提交');
  };

  // 删除配置
  const handleDelete = async (record) => {
    try {
      const res = await deleteConfigTable(record.id);
      if (res?.status === 200) {
        message.success('删除成功');
        // 刷新表格
        await queryTableList();
        tableRef.current?.reload();
      } else {
        message.error('删除失败：' + (res?.message || '未知错误'));
      }
    } catch (error) {
      console.error('删除出错:', error);
      message.error('删除失败，服务器异常');
    }
  };

  // 提交配置（新增/编辑）
  const submitForm = async () => {
    try {
      setSubmitLoading(true);
      const values = await configForm.validateFields();
      
      // 字段映射：根据实际接口需求调整
      const submitData = {
        groupName: values.agent_name || values.groupName,
        teamName: values.teamName,
        maxCpus: values.maxCpus,
        maxMemory: values.maxMemory,
        collectionPort: values.collectionPort || values.host_ip,
        ...values
      };

      let res;
      if (currentRecord?.id) {
        // 编辑操作
        res = await updateConfigTable(currentRecord.id, submitData);
      } else {
        // 新增操作
        res = await addConfigTable(submitData);
      }

      if (res?.status === 200) {
        message.success(currentRecord?.id ? '修改成功' : '新增成功');
        await queryTableList();
        tableRef.current?.reload();
        setOpen(false);
        setEditOpen(false);
      } else {
        message.error((currentRecord?.id ? '修改' : '新增') + '失败：' + (res?.message || '未知错误'));
      }
    } catch (error) {
      console.error("提交出错:", error);
      message.error('操作失败，表单验证错误或服务器异常');
    } finally {
      setSubmitLoading(false);
    }
  };

  // 关闭抽屉
  const onClose = () => {
    setOpen(false);
    setEditOpen(false);
    configForm.resetFields();
  };

  // IP验证规则（传递给子组件）
  const validateIP = (_, value) => {
    const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!value) return Promise.resolve(); // 非必填则返回成功
    if (!ipPattern.test(value)) {
      return Promise.reject(new Error('请输入正确的IP地址格式'));
    }
    const parts = value.split('.');
    for (const part of parts) {
      const num = parseInt(part, 10);
      if (num < 0 || num > 255) {
        return Promise.reject(new Error('IP地址每个段应在0-255之间'));
      }
    }
    return Promise.resolve();
  };

  return (
    <div style={{ padding: 24, background: '#f5f5f5', minHeight: '100vh' }}>
      {/* 表格容器 */}
      <div style={{ background: 'white', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', padding: 16 }}>
        {/* 工具栏 */}
        <Space style={{ marginBottom: 16 }}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={showDrawer}
          >
            新增配置
          </Button>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => queryTableList()}
          >
            刷新数据
          </Button>
          <Button
            icon={<DownloadOutlined />}
            onClick={() => tableRef.current?.exportData?.()}
          >
            导出数据
          </Button>
        </Space>

        {/* 表格 */}
        <ProTable
          scroll={{ x: 'max-content' }}
          columns={getColumns(handleEdit, handleDelete, handleCopy)}
          request={queryTableList}
          rowKey="id" // 确保rowKey正确
          pagination={{
            showQuickJumper: true,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条记录`,
            pageSizeOptions: ['10', '20', '50', '100']
          }}
          search={{
            labelWidth: 120,
            collapseRender: (collapsed) => (
              <Button
                icon={collapsed ? <SearchOutlined /> : <DownOutlined />}
                onClick={() => tableRef.current?.toggleCollapsed?.()}
              >
                {collapsed ? '高级搜索' : '收起搜索'}
              </Button>
            )
          }}
          dateFormatter="string"
          actionRef={tableRef}
          loading={loading}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="暂无配置数据"
              >
                <Button type="primary" onClick={showDrawer}>
                  新增第一条配置
                </Button>
              </Empty>
            )
          }}
          options={{
            density: true,
            fullScreen: true,
          }}
        />
      </div>

      {/* 新增/复制配置抽屉 */}
      <Drawer
        title={currentRecord ? '复制配置' : '创建配置'}
        width={800}
        onClose={onClose}
        open={open}
        styles={{
          body: {
            paddingBottom: 80,
            background: '#f8f9fa',
            overflowY: 'auto',
            maxHeight: 'calc(100vh - 160px)'
          },
        }}
        extra={
          <Space>
            <Button onClick={onClose}>取消</Button>
            <Button
              onClick={submitForm}
              type="primary"
              loading={submitLoading}
            >
              提交
            </Button>
          </Space>
        }
      >
        <CollectorConfigForm
          form={configForm}
          currentCollector={currentRecord}
          validateIP={validateIP}
          loading={submitLoading}
        />
      </Drawer>

      {/* 编辑配置抽屉 */}
      <Drawer
        title="编辑配置"
        width={800}
        onClose={onClose}
        open={editOpen}
        styles={{
          body: {
            paddingBottom: 80,
            background: '#f8f9fa',
            overflowY: 'auto',
            maxHeight: 'calc(100vh - 160px)'
          },
        }}
        extra={
          <Space>
            <Button onClick={onClose}>取消</Button>
            <Button
              onClick={submitForm}
              type="primary"
              loading={submitLoading}
            >
              保存修改
            </Button>
          </Space>
        }
      >
        <CollectorConfigForm
          form={configForm}
          currentCollector={currentRecord}
          validateIP={validateIP}
          loading={submitLoading}
        />
      </Drawer>
    </div>
  );
};