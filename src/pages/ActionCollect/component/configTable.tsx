import React, { useState, useRef, useEffect } from 'react';
import {
  DownloadOutlined, CopyOutlined, DeleteOutlined,
  EditOutlined, PlusOutlined, ReloadOutlined, SearchOutlined,
  EyeOutlined, PlayCircleOutlined
} from '@ant-design/icons';
import type { ProColumns, ActionType } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import {
  Button,
  Tag,
  Drawer,
  Space,
  Form,
  Input,
  InputNumber,
  message,
  Popconfirm,
  Empty,
  Tooltip,
  Badge
} from 'antd';
import {
  updateAgentConfigTable,
  queryAgentList
} from "../../../services/server.js";
import CollectorConfigForm from './CollectorConfigForm';

// 内联样式定义（保持不变）
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
  disabledActionButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
    borderRadius: 6,
    border: '1px solid #d9d9d9',
    color: '#d9d9d9',
    cursor: 'not-allowed',
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
  emptyState: {
    padding: '48px 24px',
  },
  mockTip: {
    marginTop: 8,
    color: '#faad14',
    fontSize: 12,
    textAlign: 'center',
  },
  configTooltip: {
    maxWidth: 600,
    wordBreak: 'break-all',
  },
};

// 默认启用的探针列表
const DEFAULT_ENABLED_PROBES = [
  "sys_enter_read",
  "sys_exit_read",
  "sys_enter_readv",
  "sys_exit_readv",
  "sys_enter_recvfrom",
  "sys_exit_recvfrom",
  "sys_enter_recvmsg",
  "sys_exit_recvmsg",
  "sys_enter_recvmmsg",
  "sys_exit_recvmmsg",
  "sys_enter_write",
  "sys_exit_write",
  "sys_enter_writev",
  "sys_exit_writev",
  "sys_enter_sendto",
  "sys_exit_sendto",
  "sys_enter_sendmsg",
  "sys_exit_sendmsg",
  "sys_enter_sendmmsg",
  "sys_exit_sendmmsg",
  "sys_exit_socket",
  "sys_enter_close"
];

// 模拟数据（保持不变）
const MOCK_DATA = [
  {
    "id": 1,
    "hostIp": "202.112.237.37",
    "agentName": "agent1",
    "userId": "1",
    "config": JSON.stringify({
      "agent_info": {
        "agent_name": "agent1",
        "host_password": "netsys204",
        "host_ip": "202.112.237.37",
        "ssh_port": 22
      },
      "metric": {
        "interval": 10
      },
      "sender": {
        "elastic": {
          "trace": {
            "request_timeout": 10,
            "bulk_size": 64
          }
        },
        "file": {
          "metric": {
            "max_size": 512,
            "max_age": 6,
            "rotate_time": 1,
            "data_format": "%Y%m%d"
          }
        }
      },
      "trace": {
        "span": {
          "cleanup_interval": 30,
          "max_sockets": 1024
        }
      },
      "ebpf": {
        "trace": {
          "log_level": 1,
          "max_buffered_events": 128,
          "enabled_probes": DEFAULT_ENABLED_PROBES
        }
      }
    }),
    "createTime": "2025-12-17T08:35:14.000+00:00"
  },
  {
    "id": 2,
    "hostIp": "192.168.1.100",
    "agentName": "agent2",
    "userId": "2",
    "config": JSON.stringify({
      "agent_info": {
        "agent_name": "agent2",
        "host_password": "netsys204",
        "host_ip": "192.168.1.100",
        "ssh_port": 6114
      },
      "metric": {
        "interval": 15
      },
      "sender": {
        "elastic": {
          "trace": {
            "request_timeout": 20,
            "bulk_size": 128
          }
        },
        "file": {
          "metric": {
            "max_size": 1024,
            "max_age": 12,
            "rotate_time": 2,
            "data_format": "%Y%m%d_%H"
          }
        }
      },
      "trace": {
        "span": {
          "cleanup_interval": 60,
          "max_sockets": 2048
        }
      },
      "ebpf": {
        "trace": {
          "log_level": 2,
          "max_buffered_events": 256,
          "enabled_probes": DEFAULT_ENABLED_PROBES
        }
      }
    }),
    "createTime": "2025-12-18T10:20:30.000+00:00"
  }
];

// 表格列配置
const getColumns = (handleEdit, editingId) => {
  const columns = [
    {
      title: '采集器名称',
      width: 180,
      dataIndex: 'agentName',
      fixed: 'left',
      render: (value, record) => (
        <Space direction="vertical" size={2}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Badge dot status="success" />
            <a 
              style={{ color: '#667eea', fontWeight: 600, cursor: 'pointer' }}
              onClick={() => handleEdit(record)}
            >
              {value}
            </a>
          </div>
          <div style={{ fontSize: '12px', color: '#999', marginLeft: '20px' }}>
            ID: {record.id}
          </div>
        </Space>
      ),
      search: {
        inputProps: { placeholder: '搜索采集器名称...' },
      },
    },
    {
      title: '主机IP',
      dataIndex: 'hostIp',
      width: 150,
      render: (value) => (
        <Tag color="blue" style={{ background: 'rgba(102, 126, 234, 0.1)', borderColor: '#667eea', color: '#667eea' }}>
          {value}
        </Tag>
      ),
      sorter: (a, b) => a.hostIp.localeCompare(b.hostIp),
    },
    {
      title: '所属用户ID',
      dataIndex: 'userId',
      width: 120,
      render: (value) => (
        <span style={{ fontWeight: 500, color: '#595959' }}>
          {value}
        </span>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      width: 200,
      render: (value) => (
        <span style={{ fontSize: '12px', color: '#666' }}>
          {new Date(value).toLocaleString('zh-CN')}
        </span>
      ),
      sorter: (a, b) => new Date(a.createTime).getTime() - new Date(b.createTime).getTime(),
    },
    {
      title: '配置详情',
      width: 80,
      render: (_, record) => (
        <Tooltip
          title={
            <div style={styles.configTooltip}>
              <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all', fontSize: 11 }}>
                {JSON.stringify(JSON.parse(record.config || '{}'), null, 2)}
              </pre>
            </div>
          }
          placement="topLeft"
          overlayStyle={{ maxWidth: 700, maxHeight: 400, overflow: 'auto' }}
        >
          <Button
            icon={<EyeOutlined />}
            size="small"
            type="text"
            style={{ color: '#667eea' }}
          >
            查看
          </Button>
        </Tooltip>
      ),
    },
    {
      title: '操作',
      valueType: 'option',
      key: 'option',
      fixed: 'right',
      width: 180,
      render: (text, record) => {
        const isEditing = editingId === record.id;
        return (
          <Space size="small">
            <Tooltip title="编辑配置">
              <Button
                icon={<EditOutlined />}
                onClick={() => handleEdit(record)}
                style={isEditing ? styles.disabledActionButton : styles.actionButton}
                size="small"
                disabled={isEditing}
              />
            </Tooltip>
            <Tooltip title="复制功能已禁用">
              <Button
                icon={<CopyOutlined />}
                style={styles.disabledActionButton}
                size="small"
                disabled={true}
              />
            </Tooltip>
            <Popconfirm
              title="删除功能已禁用"
              description="当前无法删除配置"
              okText="确定"
              cancelText={null}
              showCancel={false}
            >
              <Tooltip title="删除功能已禁用">
                <Button
                  icon={<DeleteOutlined />}
                  style={styles.disabledActionButton}
                  size="small"
                  disabled={true}
                />
              </Tooltip>
            </Popconfirm>
          </Space>
        );
      },
    },
  ];
  return columns;
};

// 解析配置字符串为表单值
const parseConfigToFormValues = (configString, currentCollector) => {
  if (!configString) {
    return null;
  }
  
  try {
    const config = JSON.parse(configString);
    const agentInfo = config.agent_info || {};
    const metric = config.metric || {};
    const sender = config.sender || {};
    const elastic = sender.elastic?.trace || {};
    const file = sender.file?.metric || {};
    const trace = config.trace || {};
    const span = trace.span || {};
    const ebpf = config.ebpf?.trace || {};
    
    return {
      agent_name: agentInfo.agent_name || currentCollector?.agentName || '',
      host_ip: agentInfo.host_ip || currentCollector?.hostIp || '',
      host_password: '', // 密码不进行回显
      ssh_port: agentInfo.ssh_port || 22,
      interval: metric.interval || 10,
      request_timeout: elastic.request_timeout || 10,
      bulk_size: elastic.bulk_size || 64,
      max_size: file.max_size || 512,
      max_age: file.max_age || 6,
      rotate_time: file.rotate_time || 1,
      data_format: file.data_format || "%Y%m%d",
      cleanup_interval: span.cleanup_interval || 30,
      max_sockets: span.max_sockets || 1024,
      log_level: ebpf.log_level || 1,
      max_buffered_events: ebpf.max_buffered_events || 128,
      enabled_probes: ebpf.enabled_probes || DEFAULT_ENABLED_PROBES
    };
  } catch (error) {
    console.error('解析配置失败:', error);
    return null;
  }
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
  const [hasApiError, setHasApiError] = useState(false);
  const [showMockData, setShowMockData] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const tableRef = useRef<ActionType>();
  const [formInitialValues, setFormInitialValues] = useState(null);

  // 查询表格数据
  const queryTableList = async (params = {}) => {
    try {
      setLoading(true);
      setHasApiError(false);
      setShowMockData(false);
      
      const pageNumber = (params.current || 1) - 1;
      const pageSize = params.pageSize || 10;
      
      const response = await queryAgentList({ pageNumber, pageSize });
      
      if (response.code !== 200) {
        throw new Error(response.message || '接口请求失败');
      }
      
      const data = response.data || {};
      const content = data.content || [];
      
      const formattedData = content.map(item => ({
        id: item.id,
        hostIp: item.hostIp,
        agentName: item.agentName,
        userId: item.userId,
        config: item.config,
        createTime: item.createTime
      }));
      
      setTableListDataSource(formattedData);
      
      return {
        data: formattedData,
        total: data.totalElements || 0,
        success: true
      };
    } catch (error) {
      console.error('查询数据出错:', error);
      message.error('数据加载失败：' + error.message);
      setHasApiError(true);
      setTableListDataSource([]);
      return {
        data: [],
        total: 0,
        success: false
      };
    } finally {
      setLoading(false);
    }
  };

  // 加载模拟数据
  const loadMockData = () => {
    setShowMockData(true);
    setTableListDataSource(MOCK_DATA);
    message.success('已加载模拟数据，仅供测试使用');
  };

  // 初始化加载数据
  useEffect(() => {
    queryTableList();
  }, []);

  // 新增配置
  const showDrawer = () => {
    setCurrentRecord(null);
    setEditingId(null);
    
    // 设置新增时的默认值
    const defaultValues = {
      ssh_port: 22,
      interval: 10,
      request_timeout: 10,
      bulk_size: 64,
      max_size: 512,
      max_age: 6,
      rotate_time: 1,
      data_format: "%Y%m%d",
      cleanup_interval: 30,
      max_sockets: 1024,
      log_level: 1,
      max_buffered_events: 128,
      enabled_probes: DEFAULT_ENABLED_PROBES
    };
    
    setFormInitialValues(defaultValues);
    setOpen(true);
  };

  // 编辑配置
  const handleEdit = (record) => {
    setCurrentRecord(record);
    setEditingId(record.id);
    
    // 解析配置并设置初始值
    let parsedValues = null;
    if (record.config) {
      parsedValues = parseConfigToFormValues(record.config, record);
    }
    
    if (!parsedValues) {
      // 解析失败，使用基本信息
      parsedValues = {
        agent_name: record.agentName || '',
        host_ip: record.hostIp || '',
        host_password: '',
        ssh_port: 22,
        interval: 10,
        request_timeout: 10,
        bulk_size: 64,
        max_size: 512,
        max_age: 6,
        rotate_time: 1,
        data_format: "%Y%m%d",
        cleanup_interval: 30,
        max_sockets: 1024,
        log_level: 1,
        max_buffered_events: 128,
        enabled_probes: DEFAULT_ENABLED_PROBES
      };
    }
    
    console.log('编辑模式初始值:', parsedValues);
    setFormInitialValues(parsedValues);
    setEditOpen(true);
  };

  // 构建 Agent 配置数据
  const buildAgentConfigData = (values, userName, isEdit) => {
    console.log('构建配置数据，表单值:', values);
    console.log('从localStorage获取的userName:', userName);
    console.log('是否为编辑模式:', isEdit);
    
    const configData = {
      agent_info: {
        agent_name: values.agent_name || '',
        host_ip: values.host_ip || '',
        ssh_port: values.ssh_port || 22,
        user_name: userName || 'unknown'
      },
      metric: {
        interval: values.interval || 10,
      },
      sender: {
        elastic: {
          trace: {
            request_timeout: values.request_timeout || 10,
            bulk_size: values.bulk_size || 64,
          }
        },
        file: {
          metric: {
            max_size: values.max_size || 512,
            max_age: values.max_age || 6,
            rotate_time: values.rotate_time || 1,
            data_format: values.data_format || "%Y%m%d",
          }
        }
      },
      trace: {
        span: {
          cleanup_interval: values.cleanup_interval || 30,
          max_sockets: values.max_sockets || 1024,
        }
      },
      ebpf: {
        trace: {
          log_level: values.log_level || 1,
          max_buffered_events: values.max_buffered_events || 128,
          enabled_probes: values.enabled_probes || DEFAULT_ENABLED_PROBES,
        }
      }
    };
    
    // 只有在新增或者编辑时有密码输入时才包含密码
    if (values.host_password && values.host_password.trim() !== '') {
      configData.agent_info.host_password = values.host_password;
    } else if (!isEdit) {
      // 新增时必须要有密码
      configData.agent_info.host_password = '';
    }
    // 编辑时如果没有输入密码，则不包含host_password字段，后端应保留原密码
    
    console.log('构建的配置数据:', JSON.stringify(configData, null, 2));
    return configData;
  };

  // 提交配置
  const submitForm = async () => {
    try {
      setSubmitLoading(true);
      
      // 验证表单
      const values = await configForm.validateFields();
      console.log('表单验证通过，值:', values);
      
      // 从localStorage获取userName
      const userName = localStorage.getItem('username');
      console.log('从localStorage获取userName:', userName);
      
      // 构建配置数据，将userName作为参数传入
      const agentConfigData = buildAgentConfigData(values, userName, !!currentRecord?.id);
      
      console.log('最终提交数据:', JSON.stringify(agentConfigData, null, 2));
      
      let res;
      if (currentRecord?.id) {
        // 编辑配置
        console.log('编辑配置，ID:', currentRecord.id);
        res = await updateAgentConfigTable(currentRecord.id, agentConfigData);
      } else {
        // 新增配置
        console.log('新增配置');
        res = await updateAgentConfigTable(agentConfigData);
      }
      
      console.log('API响应:', res);
      
      if (res?.code === 200) {
        const operationType = currentRecord?.id ? '修改' : '新增';
        message.success(`${operationType}成功`);
        
        // 刷新表格
        if (tableRef.current) {
          tableRef.current.reload();
        } else {
          await queryTableList();
        }
        
        setOpen(false);
        setEditOpen(false);
        setEditingId(null);
        setFormInitialValues(null);
      } else {
        const operationType = currentRecord?.id ? '修改' : '新增';
        message.error(`${operationType}失败：${res?.message || '未知错误'}`);
      }
    } catch (error) {
      console.error("提交配置出错:", error);
      message.error('操作失败：' + error.message);
    } finally {
      setSubmitLoading(false);
    }
  };

  // 关闭抽屉
  const onClose = () => {
    setOpen(false);
    setEditOpen(false);
    setEditingId(null);
    setFormInitialValues(null);
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

  return (
    <div style={styles.container}>
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
              新增采集器
            </Button>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => {
                if (tableRef.current) {
                  tableRef.current.reload();
                } else {
                  queryTableList();
                }
              }}
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
            {hasApiError && (
              <Button
                icon={<PlayCircleOutlined />}
                onClick={loadMockData}
                style={{ ...styles.secondaryButton, color: '#faad14' }}
              >
                加载模拟数据
              </Button>
            )}
          </Space>
          
          <Space>
            <Input.Search
              placeholder="搜索采集器名称、主机IP..."
              style={{ width: 280 }}
              onSearch={(value) => {
                tableRef.current?.reload({
                  searchText: value
                });
              }}
              enterButton={<SearchOutlined />}
            />
          </Space>
        </div>

        {/* 表格 */}
        <ProTable
          scroll={{ x: 'max-content' }}
          columns={getColumns(handleEdit, editingId)}
          request={queryTableList}
          dataSource={showMockData ? MOCK_DATA : tableDataSource}
          rowKey="id"
          rowClassName={() => styles.tableRow}
          pagination={{
            showQuickJumper: true,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条记录`,
            pageSizeOptions: ['10', '20', '50', '100'],
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
            reload: () => {
              if (tableRef.current) {
                tableRef.current.reload();
              } else {
                queryTableList();
              }
            },
            setting: true,
          }}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={hasApiError ? "接口请求失败，无法获取数据" : "暂无采集器配置数据"}
                style={styles.emptyState}
              >
                <Space direction="vertical">
                  <Button 
                    type="primary" 
                    onClick={showDrawer}
                    style={styles.primaryButton}
                  >
                    新增第一个采集器
                  </Button>
                  <Button
                    type="default"
                    icon={<ReloadOutlined />}
                    onClick={() => {
                      if (tableRef.current) {
                        tableRef.current.reload();
                      } else {
                        queryTableList();
                      }
                    }}
                    style={{ marginTop: 8 }}
                  >
                    重新加载数据
                  </Button>
                  {hasApiError && (
                    <>
                      <Button
                        type="default"
                        icon={<PlayCircleOutlined />}
                        onClick={loadMockData}
                        style={{ marginTop: 8, color: '#faad14' }}
                      >
                        加载模拟数据
                      </Button>
                      <div style={styles.mockTip}>
                        提示：模拟数据仅用于功能演示
                      </div>
                    </>
                  )}
                </Space>
              </Empty>
            )
          }}
        />
      </div>

      {/* 新增配置抽屉 */}
      <Drawer
        title="创建采集器配置"
        width={900}
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
                创建配置
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
          initialValues={formInitialValues}
        />
      </Drawer>

      {/* 编辑配置抽屉 */}
      <Drawer
        title="编辑采集器配置"
        width={900}
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
          initialValues={formInitialValues}
        />
      </Drawer>
    </div>
  );
};