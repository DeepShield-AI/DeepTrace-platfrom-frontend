import React, { useState, useRef, useEffect } from 'react';
import {
  DownOutlined, DownloadOutlined, CopyOutlined, DeleteOutlined,
  EditOutlined, PlusOutlined, ReloadOutlined, SearchOutlined,
  EyeOutlined, PlayCircleOutlined, PauseCircleOutlined, SendOutlined
} from '@ant-design/icons';
import type { ProColumns, ActionType } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import {
  Button,
  Tag,
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
  Tooltip,
  Card,
  Statistic,
  Progress,
  Divider,
  Badge
} from 'antd';
import {
  getConfigTableList,
  addConfigTable,
  deleteConfigTable,
  updateConfigTable
} from "../../../services/server.js";
import CollectorConfigForm from './CollectorConfigForm';

const { Option } = Select;

// 内联样式定义
const styles = {
  container: {
    padding: '24px',
    background: 'linear-gradient(135deg, #f8f9fa 0%, #f0f2f5 100%)',
    minHeight: '100vh',
  },
  tableCard: {
    background: 'white',
    borderRadius: 8,
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    border: '1px solid #d9d9d9',
    overflow: 'hidden',
  },
  toolbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    padding: '16px 24px',
    background: 'white',
    borderRadius: 8,
    border: '1px solid #d9d9d9',
  },
  statsCard: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    borderRadius: 8,
    marginBottom: 16,
    border: 'none',
    color: 'white',
  },
  statItem: {
    textAlign: 'center',
    padding: '16px',
    borderRight: '1px solid rgba(255,255,255,0.2)',
  },
  primaryButton: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    border: 'none',
    color: 'white',
    fontWeight: 600,
    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
  },
  secondaryButton: {
    borderColor: '#d9d9d9',
    color: '#595959',
    fontWeight: 500,
  },
  actionButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
    borderRadius: 6,
    border: '1px solid',
  },
  tableHeader: {
    background: 'linear-gradient(135deg, #f6f8fc 0%, #f0f2f5 100%)',
    borderBottom: '2px solid #e8e8e8',
  },
  tableRow: {
    transition: 'all 0.2s',
  },
  tableCell: {
    fontSize: '13px',
    borderBottom: '1px solid #f0f0f0',
  },
  searchBar: {
    background: 'linear-gradient(135deg, #f6f8fc 0%, #f0f2f5 100%)',
    borderBottom: '1px solid #d9d9d9',
    padding: '16px 24px',
  },
  drawerHeader: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    borderBottom: 'none',
  },
  drawerBody: {
    padding: '24px',
    background: '#f8f9fa',
  },
  drawerFooter: {
    background: 'white',
    borderTop: '1px solid #d9d9d9',
    padding: '16px 24px',
  },
  resourceUsage: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  statusTag: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    fontWeight: 500,
    borderRadius: 12,
    padding: '2px 8px',
  },
  emptyState: {
    padding: '48px 24px',
  },
};

// 定义状态类型
export type Status = {
  color: string;
  text: string;
};

// 表格列配置
const getColumns = (handleEdit, handleDelete, handleCopy) => {
  const columns = [
    {
      title: '采集器组',
      width: 200,
      dataIndex: 'groupName',
      fixed: 'left',
      render: (value, record) => (
        <Space direction="vertical" size={2}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Badge 
              dot 
              status={record.status === 1 ? "success" : record.status === 2 ? "error" : "default"}
            />
            <a 
              style={{ 
                color: '#667eea', 
                fontWeight: 600,
                cursor: 'pointer'
              }}
              onClick={() => console.log('查看详情:', record)}
            >
              {value}
            </a>
          </div>
          {record.teamName && (
            <div style={{ fontSize: '12px', color: '#999', marginLeft: '20px' }}>
              {record.teamName}
            </div>
          )}
        </Space>
      ),
      search: {
        inputProps: { placeholder: '搜索采集器组...' },
      },
    },
    {
      title: '团队',
      dataIndex: 'teamName',
      search: {
        inputProps: { placeholder: '搜索团队...' },
      },
    },
    {
      title: 'CPU限制',
      dataIndex: 'maxCpus',
      render: (value) => (
        <Tag color="blue" style={{ background: 'rgba(102, 126, 234, 0.1)', borderColor: '#667eea', color: '#667eea' }}>
          {value}核
        </Tag>
      ),
      sorter: (a, b) => a.maxCpus - b.maxCpus,
    },
    {
      title: '内存限制',
      dataIndex: 'maxMemory',
      render: (value) => (
        <Tag color="green" style={{ background: 'rgba(82, 196, 26, 0.1)', borderColor: '#52c41a', color: '#52c41a' }}>
          {value}MB
        </Tag>
      ),
      sorter: (a, b) => a.maxMemory - b.maxMemory,
    },
    {
      title: '采集网口',
      width: 150,
      dataIndex: 'collectionPort',
      ellipsis: true,
      render: (text) => (
        <Tooltip title={text}>
          <span style={{ color: '#667eea', fontWeight: 500 }}>{text}</span>
        </Tooltip>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (value) => {
        const statusMap = {
          0: { color: 'default', text: '未启用', icon: <PauseCircleOutlined /> },
          1: { color: 'success', text: '运行中', icon: <PlayCircleOutlined /> },
          2: { color: 'error', text: '异常', icon: <SendOutlined /> },
        };
        const status = statusMap[value] || statusMap[0];
        return (
          <Tag
            color={status.color}
            icon={status.icon}
            style={styles.statusTag}
          >
            {status.text}
          </Tag>
        );
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
      width: 180,
      render: (text, record) => (
        <Space size="small">
          <Tooltip title="编辑配置">
            <Button
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
              style={styles.actionButton}
              size="small"
            />
          </Tooltip>
          <Tooltip title="复制配置">
            <Button
              icon={<CopyOutlined />}
              onClick={() => handleCopy(record)}
              style={styles.actionButton}
              size="small"
            />
          </Tooltip>
          <Popconfirm
            title="确定要删除此配置吗？"
            description="删除后配置将不可恢复！"
            onConfirm={() => handleDelete(record)}
            okText="确认删除"
            cancelText="取消"
            okType="danger"
          >
            <Tooltip title="删除配置">
              <Button
                icon={<DeleteOutlined />}
                style={styles.actionButton}
                size="small"
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];
  return columns;
};

export default () => {
  // 状态管理
  const [tableDataSource, setTableListDataSource] = useState([]);
  const [configForm] = Form.useForm();
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [currentRecord, setCurrentRecord] = useState(null);
  const tableRef = useRef();

  // 统计数据
  const [stats, setStats] = useState({
    total: 0,
    running: 0,
    stopped: 0,
    warning: 0,
  });

  // 查询表格数据
  const queryTableList = async (params = {}) => {
    try {
      setLoading(true);
      const data = await getConfigTableList(params);
      const content = data.content || [];
      
      setTableListDataSource(content);
      
      // 计算统计
      const running = content.filter(item => item.status === 1).length;
      const stopped = content.filter(item => item.status === 0).length;
      const warning = content.filter(item => item.status === 2).length;
      
      setStats({
        total: content.length,
        running,
        stopped,
        warning,
      });
      
      return {
        data: content,
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
      agent_name: record.groupName,
      host_ip: record.collectionIp || '',
    });
    setEditOpen(true);
  };

  // 复制配置
  const handleCopy = (record) => {
    setCurrentRecord({ ...record, id: undefined });
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

  // 提交配置
  const submitForm = async () => {
    try {
      setSubmitLoading(true);
      const values = await configForm.validateFields();
      
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
        res = await updateConfigTable(currentRecord.id, submitData);
      } else {
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

  // IP验证规则
  const validateIP = (_, value) => {
    const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!value) return Promise.resolve();
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

  // 统计头部
  const StatsHeader = () => (
    <Card style={styles.statsCard}>
      <Row gutter={0}>
        <Col span={6} style={styles.statItem}>
          <Statistic
            title="总配置数"
            value={stats.total}
            valueStyle={{ color: 'white', fontSize: '24px' }}
          />
        </Col>
        <Col span={6} style={styles.statItem}>
          <Statistic
            title="运行中"
            value={stats.running}
            valueStyle={{ color: '#52c41a', fontSize: '24px' }}
          />
        </Col>
        <Col span={6} style={styles.statItem}>
          <Statistic
            title="已停止"
            value={stats.stopped}
            valueStyle={{ color: '#faad14', fontSize: '24px' }}
          />
        </Col>
        <Col span={6} style={styles.statItem}>
          <Statistic
            title="异常"
            value={stats.warning}
            valueStyle={{ color: '#ff4d4f', fontSize: '24px' }}
          />
        </Col>
      </Row>
    </Card>
  );

  return (
    <div style={styles.container}>
      {/* 统计头部 */}
      <StatsHeader />
      
      {/* 表格容器 */}
      <div style={styles.tableCard}>
        {/* 工具栏 */}
        <div style={styles.toolbar}>
          <Space>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={showDrawer}
              style={styles.primaryButton}
            >
              新增配置
            </Button>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => queryTableList()}
              style={styles.secondaryButton}
            >
              刷新数据
            </Button>
            <Button
              icon={<DownloadOutlined />}
              onClick={() => tableRef.current?.exportData?.()}
              style={styles.secondaryButton}
            >
              导出数据
            </Button>
          </Space>
          
          <Space>
            <Input.Search
              placeholder="搜索配置名称、团队..."
              style={{ width: 280 }}
              onSearch={(value) => console.log('搜索:', value)}
              enterButton={<SearchOutlined />}
            />
          </Space>
        </div>

        {/* 表格 */}
        <ProTable
          scroll={{ x: 'max-content' }}
          columns={getColumns(handleEdit, handleDelete, handleCopy)}
          request={queryTableList}
          rowKey="id"
          rowClassName={() => styles.tableRow}
          pagination={{
            showQuickJumper: true,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条记录`,
            pageSizeOptions: ['10', '20', '50', '100']
          }}
          search={false}
          dateFormatter="string"
          actionRef={tableRef}
          loading={loading}
          components={{
            header: {
              cell: ({ children, ...props }) => (
                <th
                  {...props}
                  style={{
                    ...styles.tableHeader,
                    padding: '12px 8px',
                    fontWeight: 600,
                    color: '#595959',
                  }}
                >
                  {children}
                </th>
              ),
            },
            body: {
              cell: ({ children, ...props }) => (
                <td
                  {...props}
                  style={{
                    ...styles.tableCell,
                    padding: '12px 8px',
                  }}
                >
                  {children}
                </td>
              ),
            },
          }}
          options={{
            density: true,
            fullScreen: true,
            reload: () => queryTableList(),
            setting: true,
          }}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="暂无配置数据"
                style={styles.emptyState}
              >
                <Button 
                  type="primary" 
                  onClick={showDrawer}
                  style={styles.primaryButton}
                >
                  新增第一条配置
                </Button>
              </Empty>
            )
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
          header: styles.drawerHeader,
          body: styles.drawerBody,
          footer: styles.drawerFooter
        }}
        footer={
          <div style={{ textAlign: 'right' }}>
            <Space>
              <Button onClick={onClose}>取消</Button>
              <Button
                onClick={submitForm}
                type="primary"
                loading={submitLoading}
                style={styles.primaryButton}
              >
                {currentRecord ? '复制配置' : '创建配置'}
              </Button>
            </Space>
          </div>
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
          header: styles.drawerHeader,
          body: styles.drawerBody,
          footer: styles.drawerFooter
        }}
        footer={
          <div style={{ textAlign: 'right' }}>
            <Space>
              <Button onClick={onClose}>取消</Button>
              <Button
                onClick={submitForm}
                type="primary"
                loading={submitLoading}
                style={styles.primaryButton}
              >
                保存修改
              </Button>
            </Space>
          </div>
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