import React, { useState, useEffect, useCallback } from 'react';
import { 
  DownloadOutlined, 
  DeleteOutlined, 
  PlayCircleOutlined, 
  PauseCircleOutlined,
  ReloadOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  InfoCircleOutlined,
  PlusOutlined,
  DownOutlined,
  SendOutlined,
  SaveOutlined,
  SettingOutlined,
  RadarChartOutlined,
  UserOutlined,
  ExclamationCircleOutlined,
  LockOutlined
} from '@ant-design/icons';
import type { ProColumns, ActionType } from '@ant-design/pro-components';
import { 
  ProTable, 
  ProCard,
  ProDescriptions
} from '@ant-design/pro-components';
import { 
  Button, 
  Tag, 
  Tooltip,
  Modal,
  message,
  Space,
  Statistic,
  Progress,
  Alert,
  Empty,
  Input,
  Switch,
  Drawer,
  Form,
  InputNumber,
  Select,
  Radio,
  Row,
  Col,
  Divider
} from 'antd';
import { getActionCollectList } from "../../../services/server.js"
import { useNavigate } from 'react-router-dom';
import { expandDataMap } from '../../../constant';
import { createStyles } from 'antd-style';
import { mockDataSource, statusConfig } from "../mock.js"
import CollectorConfigForm from './CollectorConfigForm';
import {
    agentRegister,
    agentEnable,
    agentDisable,
    agentDelete
} from "../../../services/server.js"

const { TextArea } = Input;
const { Option } = Select;

// 定义样式
const useStyles = createStyles(({ token }) => ({
  tableCard: {
    background: 'white',
    borderRadius: token.borderRadiusLG,
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    border: `1px solid ${token.colorBorderSecondary}`,
    overflow: 'hidden',
  },
  statusTag: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    fontWeight: 500,
    borderRadius: 12,
    padding: '2px 8px',
  },
  actionButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
    borderRadius: 8,
    border: '1px solid',
    transition: 'all 0.3s',
    '&:hover': {
      transform: 'translateY(-2px)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    },
  },
  textIconButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '4px 12px',
    borderRadius: 6,
    border: '1px solid',
    transition: 'all 0.3s',
    fontWeight: 500,
    fontSize: 13,
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    },
  },
  tableRow: {
    '&:hover': {
      background: 'rgba(24, 144, 255, 0.02) !important',
    },
  },
  expandContent: {
    background: 'linear-gradient(135deg, #f6f8fc 0%, #f0f2f5 100%)',
    borderRadius: token.borderRadiusLG,
    margin: '0 0 8px 8px',
    border: `1px solid ${token.colorBorderSecondary}`,
  },
  searchBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    padding: 16,
    background: 'white',
    borderRadius: token.borderRadiusLG,
    boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
  },
  emptyState: {
    padding: '48px 24px', 
    textAlign: 'center',
  },
  drawerFooter: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: '100%',
    borderTop: `1px solid ${token.colorBorderSecondary}`,
    padding: '16px 24px',
    background: '#fff',
    textAlign: 'right',
  },
  registerButton: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    border: 'none',
    color: 'white',
    fontWeight: 600,
    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
    transition: 'all 0.3s',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 6px 20px rgba(102, 126, 234, 0.4)',
      background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4090 100%)',
    },
  },
  formItem: {
    marginBottom: 20,
  },
  formLabel: {
    fontWeight: 600,
    color: token.colorTextHeading,
    marginBottom: 8,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 14,
  },
  requiredMark: {
    color: '#ff4d4f',
    marginLeft: 4,
  },
  inputLarge: {
    '& .ant-input, & .ant-input-number-input, & .ant-select-selector': {
      height: '44px !important',
      fontSize: '15px !important',
      padding: '8px 12px !important',
    },
    '& .ant-input:focus, & .ant-input-number-focused, & .ant-select-focused .ant-select-selector': {
      boxShadow: '0 0 0 2px rgba(24, 144, 255, 0.2)',
    },
  },
  configSection: {
    marginBottom: 24,
    padding: 24,
    background: 'white',
    borderRadius: token.borderRadiusLG,
    border: `1px solid ${token.colorBorderSecondary}`,
    boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
    transition: 'all 0.3s',
    '&:hover': {
      boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
    },
  },
  configSectionTitle: {
    fontSize: 16,
    fontWeight: 600,
    marginBottom: 20,
    color: token.colorTextHeading,
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    paddingBottom: 16,
    borderBottom: `1px solid ${token.colorBorderTertiary}`,
  },
  tableHeader: {
    background: 'linear-gradient(135deg, #f6f8fc 0%, #f0f2f5 100%)',
    borderBottom: `2px solid ${token.colorBorderSecondary}`,
  },
  tableCell: {
    fontSize: '13px !important',
    fontWeight: 400,
  },
  tableRowHover: {
    '&:hover': {
      '& td': {
        background: 'rgba(24, 144, 255, 0.04) !important',
      },
    },
  },
  actionCell: {
    '& .ant-space': {
      display: 'flex',
      gap: 6,
    },
  },
  compactProgress: {
    '& .ant-progress-inner': {
      width: '100% !important',
    },
  },
  // 新增配置表单样式
  configInput: {
    '& .ant-input': {
      borderRadius: token.borderRadiusMD,
      border: `1px solid ${token.colorBorderSecondary}`,
      transition: 'all 0.2s',
      '&:focus': {
        borderColor: '#722ed1',
        boxShadow: '0 0 0 2px rgba(114, 46, 209, 0.1)',
      },
    },
  },
  configSelect: {
    '& .ant-select-selector': {
      borderRadius: token.borderRadiusMD,
      border: `1px solid ${token.colorBorderSecondary}`,
      '&:hover': {
        borderColor: '#722ed1',
      },
      '&.ant-select-focused': {
        borderColor: '#722ed1',
        boxShadow: '0 0 0 2px rgba(114, 46, 209, 0.1)',
      },
    },
  },
  configNumber: {
    '& .ant-input-number': {
      borderRadius: token.borderRadiusMD,
      '&:hover': {
        borderColor: '#722ed1',
      },
      '&.ant-input-number-focused': {
        borderColor: '#722ed1',
        boxShadow: '0 0 0 2px rgba(114, 46, 209, 0.1)',
      },
    },
  },
  formHelpText: {
    fontSize: 12,
    color: token.colorTextSecondary,
    marginTop: 4,
    lineHeight: 1.4,
  },
  probeSelectContainer: {
    maxHeight: 240,
    overflow: 'auto',
    border: `1px solid ${token.colorBorderSecondary}`,
    borderRadius: token.borderRadiusMD,
    padding: 4,
    background: '#fafafa',
    '&::-webkit-scrollbar': {
      width: 6,
    },
    '&::-webkit-scrollbar-thumb': {
      backgroundColor: token.colorBorderSecondary,
      borderRadius: 3,
    },
  },
  disabledInput: {
    '& .ant-input': {
      backgroundColor: '#f5f5f5',
      color: '#666',
      cursor: 'not-allowed',
    },
  },
  // 新增提示信息样式
  delayTip: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 8,
    padding: '12px 16px',
    background: 'linear-gradient(135deg, #fff7e6 0%, #fff1e6 100%)',
    border: '1px solid #ffd591',
    borderRadius: token.borderRadiusLG,
    marginBottom: 16,
  },
  delayTipIcon: {
    color: '#fa8c16',
    fontSize: 16,
    marginTop: 2,
  },
  delayTipContent: {
    flex: 1,
  },
  delayTipTitle: {
    fontWeight: 600,
    color: '#d46b08',
    marginBottom: 4,
    fontSize: 14,
  },
  delayTipText: {
    color: '#d46b08',
    fontSize: 13,
    lineHeight: 1.5,
  },
  // 新增操作确认框样式
  authFormItem: {
    marginBottom: 16,
  },
  authFormLabel: {
    fontWeight: 600,
    color: token.colorTextHeading,
    marginBottom: 8,
    fontSize: 14,
  },
  authInput: {
    '& .ant-input': {
      borderRadius: token.borderRadiusMD,
      border: `1px solid ${token.colorBorderSecondary}`,
      transition: 'all 0.2s',
      '&:focus': {
        borderColor: '#1890ff',
        boxShadow: '0 0 0 2px rgba(24, 144, 255, 0.2)',
      },
    },
  },
  readOnlyField: {
    '& .ant-input': {
      backgroundColor: '#f5f5f5',
      color: '#666',
      cursor: 'not-allowed',
    },
  },
}));

export default () => {
  const { styles } = useStyles();
  const [registerForm] = Form.useForm();
  const [configForm] = Form.useForm();
  const [authForm] = Form.useForm();
  const [tableDataSource, setTableListDataSource] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [registerDrawerOpen, setRegisterDrawerOpen] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [configPushDrawerOpen, setConfigPushDrawerOpen] = useState(false);
  const [configPushLoading, setConfigPushLoading] = useState(false);
  const [currentCollector, setCurrentCollector] = useState(null);
  const [authModalVisible, setAuthModalVisible] = useState(false);
  const [authModalLoading, setAuthModalLoading] = useState(false);
  const [currentAction, setCurrentAction] = useState(null); // 'enable', 'disable', 'delete'
  const navigate = useNavigate();
  const actionRef = React.useRef<ActionType>();

  // 统计数据
  const [stats, setStats] = useState({
    total: 0,
    running: 0,
    stopped: 0,
    warning: 0,
  }); 

  // 加载数据
  const loadData = useCallback(async (useMock = false) => {
    setLoading(true);
    try {
      let data = [];
      
      if (!useMock) {
        const response = await getActionCollectList();
        data = response?.content || [];
      }
      
      // 如果接口没有数据，使用Mock数据
      if (!data || data.length === 0) {
        data = mockDataSource;
        console.log('使用Mock数据');
      }
      
      setTableListDataSource(data);
      
      // 计算统计
      const running = data.filter(item => item.status === 1).length;
      const stopped = data.filter(item => item.status === 0).length;
      const warning = data.filter(item => item.status === 2).length;
      
      setStats({
        total: data.length,
        running,
        stopped,
        warning,
      });
      
    } catch (error) {
      console.error('加载数据失败:', error);
      // 出错时使用Mock数据
      setTableListDataSource(mockDataSource);
      setStats({
        total: mockDataSource.length,
        running: mockDataSource.filter(item => item.status === 1).length,
        stopped: mockDataSource.filter(item => item.status === 0).length,
        warning: mockDataSource.filter(item => item.status === 2).length,
      });
      message.error('加载数据失败，已使用模拟数据');
    } finally {
      setLoading(false);
    }
  }, []);

  // 初始加载
  useEffect(() => {
    loadData();
  }, [loadData]);

  // 打开认证模态框
  const showAuthModal = (record, action) => {
    setCurrentCollector(record);
    setCurrentAction(action);
    authForm.resetFields();
    
    // 设置默认值
    authForm.setFieldsValue({
      hostIp: record.launchServer || record.curControllerIp,
      sshPort: 22, // 默认SSH端口
      agentName: record.name,
      userName: 'ubuntu', // 默认用户名
      hostPassword: '' // 密码为空，需要用户填写
    });
    
    setAuthModalVisible(true);
  };

  // 关闭认证模态框
  const closeAuthModal = () => {
    setAuthModalVisible(false);
    setCurrentCollector(null);
    setCurrentAction(null);
    setAuthModalLoading(false);
  };

  // 处理认证表单提交
  const handleAuthSubmit = async () => {
    try {
      const values = await authForm.validateFields();
      await executeActionWithAuth(values);
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  // 根据操作类型执行相应的动作
  const executeActionWithAuth = async (authParams) => {
    if (!currentCollector || !currentAction) return;
    
    setAuthModalLoading(true);
    try {
      console.log(`执行${currentAction}操作，参数:`, authParams);
      
      let response;
      switch (currentAction) {
        case 'enable':
          response = await agentEnable(authParams);
          break;
        case 'disable':
          response = await agentDisable(authParams);
          break;
        case 'delete':
          response = await agentDelete(authParams);
          break;
        default:
          throw new Error('未知的操作类型');
      }
      
      console.log(`${currentAction}操作响应:`, response);
      
      // 根据操作类型更新界面
      if (currentAction === 'delete') {
        // 删除操作：从列表中移除
        setTableListDataSource(prev => 
          prev.filter(item => item.lcuuid !== currentCollector.lcuuid)
        );
        message.success('采集器已删除');
      } else {
        // 启用/禁用操作：更新状态
        const newStatus = currentAction === 'enable' ? 1 : 0;
        const newState = currentAction === 'enable' ? 'running' : 'stopped';
        
        setTableListDataSource(prev => prev.map(item => 
          item.lcuuid === currentCollector.lcuuid 
            ? { 
                ...item, 
                status: newStatus, 
                state: newState,
                updateTime: new Date().toLocaleString('zh-CN')
              }
            : item
        ));
        
        message.success(`采集器已${currentAction === 'enable' ? '启用' : '禁用'}`);
      }
      
      closeAuthModal();
      
    } catch (error) {
      console.error(`${currentAction}操作失败:`, error);
      message.error(`${currentAction === 'enable' ? '启用' : currentAction === 'disable' ? '禁用' : '删除'}失败: ` + (error.message || '未知错误'));
    } finally {
      setAuthModalLoading(false);
    }
  };

  // 启用采集器 - 修改为打开认证模态框
  const handleEnable = (record) => {
    showAuthModal(record, 'enable');
  };

  // 禁用采集器 - 修改为打开认证模态框
  const handleDisable = (record) => {
    showAuthModal(record, 'disable');
  };

  // 删除采集器 - 修改为打开认证模态框
  const handleDelete = (record) => {
    showAuthModal(record, 'delete');
  };

  // 打开配置推送抽屉
  const showConfigPushDrawer = (record) => {
    setCurrentCollector(record);
    configForm.resetFields();
    // 设置默认值
    configForm.setFieldsValue({
      agent_name: record.name, // 自动填入采集器名称
      host_ip: record.launchServer || record.curControllerIp, // 自动填入采集器IP
      host_password: '', // 初始为空，用户填写
      ssh_port: 22, // 默认SSH端口22
      log_level: 1,
      data_format: 'yyyy-MM-dd',
      interval: 10,
      request_timeout: 10,
      bulk_size: 512,
      max_size: 512,
      max_age: 7,
      rotate_time: 1,
      cleanup_interval: 30,
      max_sockets: 1024,
      max_buffered_events: 256,
      enabled_probes: [
        "sys_enter_read",
        "sys_exit_read",
        "sys_enter_write",
        "sys_exit_write",
        "sys_enter_close"
      ],
      restartMode: 'restart',
      description: ''
    });
    setConfigPushDrawerOpen(true);
  };

  // 关闭配置推送抽屉
  const closeConfigPushDrawer = () => {
    setConfigPushDrawerOpen(false);
    setCurrentCollector(null);
  };

  // 配置推送
  const handleConfigPush = async (values) => {
    if (!currentCollector) return;
    
    setConfigPushLoading(true);
    try {
      console.log('配置推送参数:', values);
      console.log('目标采集器:', currentCollector.name);
      
      // TODO: 调用配置推送接口
      // 模拟推送配置
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 更新采集器状态
      setTableListDataSource(prev => prev.map(item => 
        item.lcuuid === currentCollector.lcuuid 
          ? { 
              ...item, 
              updateTime: new Date().toLocaleString('zh-CN')
            }
          : item
      ));
      
      message.success(`配置已成功推送到采集器 ${currentCollector.name}`);
      closeConfigPushDrawer();
      
    } catch (error) {
      console.error('配置推送失败:', error);
      message.error('配置推送失败: ' + error.message);
    } finally {
      setConfigPushLoading(false);
    }
  };

  // 提交配置推送表单
  const handleSubmitConfig = async () => {
    try {
      const values = await configForm.validateFields();
      await handleConfigPush(values);
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  // 打开注册采集器抽屉
  const showRegisterDrawer = () => {
    registerForm.resetFields();
    setRegisterDrawerOpen(true);
  };

  // 关闭注册采集器抽屉
  const closeRegisterDrawer = () => {
    setRegisterDrawerOpen(false);
  };

  // 注册采集器 - 修改为调用真实接口
  const handleRegisterCollector = async (values) => {
    setRegisterLoading(true);
    try {
      console.log('注册采集器参数:', values);
      
      // 构建请求参数
      const registerParams = {
        hostIp: values.ip, // 采集器IP地址
        userName: values.username, // 采集器用户名
        hostPassword: values.password, // 采集器密码
        sshPort: values.port, // SSH端口
        agentName: values.name // 采集器名称
      };
      
      console.log('调用agentRegister接口，参数:', registerParams);
      
      // 调用注册接口
      const response = await agentRegister(registerParams);
      console.log('注册接口响应:', response);
      
      // 注册成功后，刷新数据
      await loadData();
      
      message.success('采集器注册成功');
      closeRegisterDrawer();
      
      // 提示用户需要等待和刷新
      Modal.info({
        title: '注册成功',
        content: (
          <div>
            <p>采集器已成功注册！</p>
            <p style={{ marginTop: 8, color: '#fa8c16' }}>
              <ExclamationCircleOutlined /> 注意：新注册的采集器可能需要5-10分钟才能显示在列表中，请稍后刷新页面查看。
            </p>
          </div>
        ),
        okText: '知道了',
        onOk: () => {
          // 5秒后自动刷新数据
          setTimeout(() => {
            loadData();
            message.info('已自动刷新数据');
          }, 5000);
        },
      });
      
    } catch (error) {
      console.error('注册采集器失败:', error);
      message.error('注册采集器失败: ' + (error.message || '未知错误'));
    } finally {
      setRegisterLoading(false);
    }
  };

  // 表单提交处理
  const handleSubmitRegister = async () => {
    try {
      const values = await registerForm.validateFields();
      await handleRegisterCollector(values);
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  // IP地址验证规则
  const validateIP = (_, value) => {
    const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!value) {
      return Promise.reject(new Error('请输入采集器IP地址'));
    }
    if (!ipPattern.test(value)) {
      return Promise.reject(new Error('请输入正确的IP地址格式，如：192.168.1.100'));
    }
    
    // 验证每个数字段是否在0-255之间
    const parts = value.split('.');
    for (let part of parts) {
      const num = parseInt(part, 10);
      if (num < 0 || num > 255) {
        return Promise.reject(new Error('IP地址每个数字段应在0-255之间'));
      }
    }
    
    return Promise.resolve();
  };

  // 端口验证规则
  const validatePort = (_, value) => {
    if (!value) {
      return Promise.reject(new Error('请输入端口号'));
    }
    if (value < 1 || value > 65535) {
      return Promise.reject(new Error('端口号应在1-65535之间'));
    }
    return Promise.resolve();
  };

  // SSH端口验证规则
  const validateSSHPort = (_, value) => {
    if (!value) {
      return Promise.reject(new Error('请输入SSH端口号'));
    }
    if (value < 1 || value > 65535) {
      return Promise.reject(new Error('SSH端口号应在1-65535之间'));
    }
    return Promise.resolve();
  };

  // 用户名验证规则
  const validateUsername = (_, value) => {
    if (!value) {
      return Promise.reject(new Error('请输入采集器用户名'));
    }
    if (value.length < 3) {
      return Promise.reject(new Error('用户名长度至少3位'));
    }
    if (value.length > 20) {
      return Promise.reject(new Error('用户名长度不能超过20位'));
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
      return Promise.reject(new Error('用户名只能包含字母、数字、下划线和连字符'));
    }
    return Promise.resolve();
  };

  // 密码验证规则
  const validatePassword = (_, value) => {
    if (!value) {
      return Promise.reject(new Error('请输入密码'));
    }
    if (value.length < 6) {
      return Promise.reject(new Error('密码长度至少6位'));
    }
    if (value.length > 20) {
      return Promise.reject(new Error('密码长度不能超过20位'));
    }
    return Promise.resolve();
  };

  // 获取操作标题
  const getActionTitle = () => {
    switch (currentAction) {
      case 'enable':
        return '启用采集器';
      case 'disable':
        return '禁用采集器';
      case 'delete':
        return '删除采集器';
      default:
        return '操作确认';
    }
  };

  // 获取操作描述
  const getActionDescription = () => {
    switch (currentAction) {
      case 'enable':
        return '确定要启用此采集器吗？启用后采集器将开始数据采集。';
      case 'disable':
        return '确定要禁用此采集器吗？禁用后将停止数据采集。';
      case 'delete':
        return '确定要删除此采集器吗？删除后将无法恢复。';
      default:
        return '请确认操作';
    }
  };

  // 获取确认按钮文本
  const getConfirmButtonText = () => {
    switch (currentAction) {
      case 'enable':
        return '确认启用';
      case 'disable':
        return '确认禁用';
      case 'delete':
        return '确认删除';
      default:
        return '确认';
    }
  };

  // 获取确认按钮类型
  const getConfirmButtonType = () => {
    switch (currentAction) {
      case 'delete':
        return 'danger';
      default:
        return 'primary';
    }
  };

  // 列定义
  const columns: ProColumns[] = [
    {
      title: '采集器名称',
      width: 200,
      dataIndex: 'name',
      fixed: 'left',
      className: styles.tableCell,
      render: (text, record) => (
        <Space direction="vertical" size={2}>
          <a
            onClick={() => {
              navigate('/ActionDetail', { state: { item: record } });
            }}
            style={{ 
              fontWeight: 500, 
              color: '#1890ff',
              fontSize: '13px',
            }}
          >
            {text}
          </a>
          <div style={{ fontSize: 12, color: '#999' }}>
            {record.group}
          </div>
        </Space>
      ),
    },
    {
      title: '状态',
      width: 100,
      dataIndex: 'status',
      className: styles.tableCell,
      render: (_, record) => {
        const config = statusConfig[record.status] || statusConfig[0];
        return (
          <Tag
            color={config.color}
            icon={config.icon}
            className={styles.statusTag}
            style={{ fontSize: '12px' }}
          >
            {config.text}
          </Tag>
        );
      },
      filters: [
        { text: '运行中', value: 1 },
        { text: '已停止', value: 0 },
        { text: '警告', value: 2 },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: '类型',
      width: 100,
      dataIndex: 'archType',
      className: styles.tableCell,
      render: (text) => {
        const types = {
          0: { text: '物理机', color: '#2f54eb' },
          1: { text: '虚拟机', color: '#722ed1' },
          2: { text: '容器', color: '#fa8c16' },
        };
        const type = types[text] || { text: '未知', color: '#d9d9d9' };
        return <Tag color={type.color} style={{ fontSize: '12px' }}>{type.text}</Tag>;
      },
    },
    {
      title: '运行环境',
      width: 140,
      dataIndex: 'launchServer',
      className: styles.tableCell,
      render: (text) => (
        <Tooltip title={text}>
          <span style={{ 
            color: '#595959',
            fontSize: '13px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: 'block',
            maxWidth: '120px'
          }}>
            {text}
          </span>
        </Tooltip>
      ),
    },
    {
      title: '资源使用',
      width: 180,
      className: styles.tableCell,
      render: (_, record) => (
        <Space direction="vertical" size={2} style={{ width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 40, fontSize: 11, color: '#999' }}>CPU:</span>
            <Progress
              percent={record.cpuUsage}
              size="small"
              strokeColor={record.cpuUsage > 80 ? '#ff4d4f' : '#52c41a'}
              showInfo={false}
              style={{ flex: 1 }}
              strokeWidth={6}
            />
            <span style={{ width: 36, fontSize: 12, textAlign: 'right' }}>{record.cpuUsage}%</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 40, fontSize: 11, color: '#999' }}>内存:</span>
            <Progress
              percent={record.memoryUsage}
              size="small"
              strokeColor={record.memoryUsage > 80 ? '#ff4d4f' : '#1890ff'}
              showInfo={false}
              style={{ flex: 1 }}
              strokeWidth={6}
            />
            <span style={{ width: 36, fontSize: 12, textAlign: 'right' }}>{record.memoryUsage}%</span>
          </div>
        </Space>
      ),
    },
    {
      title: '流量(MB/s)',
      width: 100,
      dataIndex: 'traffic',
      align: 'right',
      className: styles.tableCell,
      render: (text) => (
        <span style={{ 
          fontWeight: 500, 
          color: '#1890ff',
          fontSize: '13px',
        }}>
          {text.toLocaleString()}
        </span>
      ),
      sorter: (a, b) => a.traffic - b.traffic,
    },
    {
      title: '控制节点',
      width: 140,
      dataIndex: 'curControllerIp',
      className: styles.tableCell,
      render: (text) => (
        <Tag color="blue" style={{ fontSize: 12, maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {text}
        </Tag>
      ),
    },
    {
      title: '更新时间',
      width: 140,
      dataIndex: 'updateTime',
      className: styles.tableCell,
      sorter: (a, b) => new Date(a.updateTime) - new Date(b.updateTime),
    },
    {
      title: '操作',
      key: 'action',
      width: 200, // 宽度调整，因为删除了编辑按钮
      fixed: 'right',
      className: `${styles.tableCell} ${styles.actionCell}`,
      render: (_, record) => (
        <Space>
          {/* 查看详情 */}
          <Tooltip title="查看详情">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => navigate('/ActionDetail', { state: { item: record } })}
              className={styles.actionButton}
              style={{ borderColor: '#d9d9d9', color: '#595959' }}
            />
          </Tooltip>

          {/* 启用/禁用 */}
          {record.status === 0 ? (
            <Tooltip title="启用">
              <Button
                type="text"
                size="small"
                icon={<PlayCircleOutlined />}
                onClick={() => handleEnable(record)}
                className={styles.actionButton}
                style={{ borderColor: '#52c41a', color: '#52c41a' }}
              />
            </Tooltip>
          ) : (
            <Tooltip title="禁用">
              <Button
                type="text"
                size="small"
                icon={<PauseCircleOutlined />}
                onClick={() => handleDisable(record)}
                className={styles.actionButton}
                style={{ borderColor: '#faad14', color: '#faad14' }}
              />
            </Tooltip>
          )}

          {/* 删除 */}
          <Tooltip title="删除">
            <Button
              type="text"
              size="small"
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record)}
              className={styles.actionButton}
              style={{ borderColor: '#ff4d4f', color: '#ff4d4f' }}
            />
          </Tooltip>

          {/* 配置推送 - 文字图标按钮 */}
          <Button
            type="text"
            size="small"
            icon={<SendOutlined />}
            onClick={() => showConfigPushDrawer(record)}
            className={styles.textIconButton}
            style={{ 
              borderColor: '#722ed1', 
              color: '#722ed1',
              background: 'rgba(114, 46, 209, 0.1)',
            }}
          >
            推送配置
          </Button>
        </Space>
      ),
    },
  ];

  // 展开行内容
  const expandedRowRender = (record) => {
    return (
      <ProCard className={styles.expandContent}>
        <ProDescriptions
          column={3}
          title={<span style={{ color: '#1890ff' }}>详细信息</span>}
        >
          {Object.keys(expandDataMap).map((key) => (
            <ProDescriptions.Item
              key={key}
              label={<span style={{ color: '#595959' }}>{expandDataMap[key]}</span>}
              span={1}
            >
              {record[key] || '-'}
            </ProDescriptions.Item>
          ))}
        </ProDescriptions>
        
        {/* 性能指标 */}
        <ProCard
          title="性能指标"
          style={{ marginTop: 16 }}
          headerBordered
        >
          <Space wrap>
            <Statistic
              title="CPU使用率"
              value={record.cpuUsage || 0}
              suffix="%"
              valueStyle={{ 
                color: record.cpuUsage > 80 ? '#ff4d4f' : 
                      record.cpuUsage > 60 ? '#faad14' : '#52c41a' 
              }}
            />
            <Statistic
              title="内存使用率"
              value={record.memoryUsage || 0}
              suffix="%"
              valueStyle={{ 
                color: record.memoryUsage > 80 ? '#ff4d4f' : 
                      record.memoryUsage > 60 ? '#faad14' : '#1890ff' 
              }}
            />
            <Statistic
              title="网络流量"
              value={record.traffic || 0}
              suffix="MB/s"
              valueStyle={{ color: '#722ed1' }}
            />
            <Statistic
              title="CPU核心数"
              value={record.cpuNum || 0}
              valueStyle={{ color: '#13c2c2' }}
            />
          </Space>
        </ProCard>
      </ProCard>
    );
  };

  // 搜索和筛选
  const SearchBar = () => (
    <div className={styles.searchBar}>
      <Space>
        <Input.Search
          placeholder="搜索采集器名称、IP地址..."
          style={{ width: 320 }}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          onSearch={(value) => {
            // 实现搜索逻辑
            console.log('搜索:', value);
          }}
        />
        <Button 
          icon={<ReloadOutlined />} 
          onClick={() => loadData()}
        >
          刷新
        </Button>
      </Space>
      <Button
        type="primary"
        icon={<PlusOutlined />}
        onClick={showRegisterDrawer}
        className={styles.registerButton}
      >
        注册采集器
      </Button>
    </div>
  );

  return (
    <>
      <SearchBar />

      <ProCard className={styles.tableCard}>
        <ProTable
          columns={columns}
          dataSource={tableDataSource}
          rowKey="lcuuid"
          loading={loading}
          actionRef={actionRef}
          scroll={{ x: 1250 }} // 调整滚动宽度，因为删除了编辑按钮
          expandable={{
            expandedRowRender,
            expandIcon: ({ expanded, onExpand, record }) =>
              expanded ? (
                <DownOutlined 
                  onClick={(e) => onExpand(record, e)} 
                  style={{ color: '#1890ff' }}
                />
              ) : (
                <DownOutlined onClick={(e) => onExpand(record, e)} />
              ),
            rowExpandable: (record) => true,
          }}
          rowClassName={styles.tableRowHover}
          components={{
            header: {
              cell: ({ children, ...props }) => (
                <th
                  {...props}
                  style={{
                    ...props.style,
                    background: 'linear-gradient(135deg, #f6f8fc 0%, #f0f2f5 100%)',
                    borderBottom: '2px solid #e8e8e8',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#595959',
                    padding: '12px 8px',
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
                    ...props.style,
                    padding: '12px 8px',
                    fontSize: '13px',
                    color: '#595959',
                    borderBottom: '1px solid #f0f0f0',
                  }}
                >
                  {children}
                </td>
              ),
            },
          }}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
            pageSizeOptions: ['10', '20', '50', '100'],
            defaultPageSize: 20,
          }}
          dateFormatter="string"
          search={false}
          options={{
            density: true,
            fullScreen: true,
            reload: () => loadData(),
            setting: true,
          }}
          toolBarRender={() => [
            <Button
              key="refresh"
              icon={<ReloadOutlined />}
              onClick={() => loadData()}
              style={{ border: '1px solid #d9d9d9' }}
            >
              刷新
            </Button>,
            <Button
              key="add"
              type="primary"
              icon={<PlusOutlined />}
              onClick={showRegisterDrawer}
              className={styles.registerButton}
            >
              注册采集器
            </Button>,
          ]}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="暂无采集器数据"
                className={styles.emptyState}
              >
                <Button 
                  type="primary" 
                  onClick={() => loadData(true)}
                  icon={<ReloadOutlined />}
                  style={{ marginRight: 8 }}
                >
                  加载模拟数据
                </Button>
                <Button 
                  type="primary" 
                  onClick={showRegisterDrawer}
                  icon={<PlusOutlined />}
                  className={styles.registerButton}
                >
                  注册采集器
                </Button>
              </Empty>
            ),
          }}
        />
      </ProCard>

      {/* 操作认证模态框 */}
      <Modal
        title={getActionTitle()}
        open={authModalVisible}
        onCancel={closeAuthModal}
        footer={[
          <Button key="cancel" onClick={closeAuthModal}>
            取消
          </Button>,
          <Button
            key="submit"
            type={getConfirmButtonType()}
            loading={authModalLoading}
            onClick={handleAuthSubmit}
            icon={<LockOutlined />}
          >
            {getConfirmButtonText()}
          </Button>,
        ]}
        width={520}
      >
        <div style={{ marginBottom: 16 }}>
          <Alert
            message={getActionDescription()}
            type="info"
            showIcon
          />
        </div>
        
        <Form
          form={authForm}
          layout="vertical"
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="hostIp"
                label="采集器IP"
                className={styles.authFormItem}
              >
                <Input
                  placeholder="采集器IP地址"
                  className={`${styles.authInput} ${styles.readOnlyField}`}
                  readOnly
                  prefix={<UserOutlined />}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="sshPort"
                label="SSH端口"
                className={styles.authFormItem}
              >
                <Input
                  placeholder="SSH端口"
                  className={`${styles.authInput} ${styles.readOnlyField}`}
                  readOnly
                />
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item
            name="agentName"
            label="采集器名称"
            className={styles.authFormItem}
          >
            <Input
              placeholder="采集器名称"
              className={`${styles.authInput} ${styles.readOnlyField}`}
              readOnly
            />
          </Form.Item>
          
          <Form.Item
            name="userName"
            label="用户名"
            className={styles.authFormItem}
            rules={[
              { required: true, message: '请输入用户名' },
              { validator: validateUsername }
            ]}
          >
            <Input
              placeholder="请输入用户名，如：ubuntu"
              className={styles.authInput}
              prefix={<UserOutlined />}
            />
          </Form.Item>
          
          <Form.Item
            name="hostPassword"
            label="密码"
            className={styles.authFormItem}
            rules={[
              { required: true, message: '请输入密码' },
              { validator: validatePassword }
            ]}
          >
            <Input.Password
              placeholder="请输入密码"
              className={styles.authInput}
              prefix={<LockOutlined />}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* 注册采集器抽屉 */}
      <Drawer
        title={
          <div>
            <span style={{ fontSize: 20, fontWeight: 700, color: '#1d1d1d', letterSpacing: '-0.2px' }}>
              注册采集器
            </span>
            <div style={{ fontSize: 14, color: '#666', marginTop: 8, lineHeight: 1.6 }}>
              请填写采集器基本信息，所有字段均为必填项
            </div>
          </div>
        }
        width={520}
        open={registerDrawerOpen}
        onClose={closeRegisterDrawer}
        styles={{
          body: {
            padding: '24px 24px',
            background: '#f8f9fa',
          },
          header: {
            padding: '24px 24px 16px',
            borderBottom: '1px solid #f0f0f0',
            background: 'white',
          },
          footer: {
            padding: '16px 24px',
            borderTop: '1px solid #f0f0f0',
            background: 'white',
          },
        }}
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 12 }}>
            <Button 
              onClick={closeRegisterDrawer}
              size="large"
              style={{ padding: '0 24px', height: 40 }}
            >
              取消
            </Button>
            <Button 
              type="primary" 
              onClick={handleSubmitRegister} 
              loading={registerLoading}
              icon={<SaveOutlined />}
              size="large"
              style={{ 
                padding: '0 32px', 
                height: 40,
                background: 'linear-gradient(135deg, #52c41a 0%, #389e0d 100%)',
                border: 'none',
                fontWeight: 600,
                boxShadow: '0 4px 12px rgba(82, 196, 26, 0.3)',
              }}
            >
              注册采集器
            </Button>
          </div>
        }
      >
        {/* 新增：延迟显示提示信息 */}
        <div className={styles.delayTip}>
          <ExclamationCircleOutlined className={styles.delayTipIcon} />
          <div className={styles.delayTipContent}>
            <div className={styles.delayTipTitle}>重要提示</div>
            <div className={styles.delayTipText}>
              采集器注册后不会立即显示在列表中，需要等待5-10分钟的数据同步时间。注册成功后请稍等片刻再刷新页面查看。
            </div>
          </div>
        </div>

        <Form
          form={registerForm}
          layout="vertical"
          requiredMark="optional"
        >
          <div className={styles.formItem}>
            <Form.Item
              name="name"
              label={
                <div className={styles.formLabel}>
                  <span>采集器名称</span>
                  <span className={styles.requiredMark}>*</span>
                </div>
              }
              rules={[
                { required: true, message: '请输入采集器名称' },
                { max: 50, message: '名称不能超过50个字符' }
              ]}
            >
              <Input
                size="large"
                placeholder="请输入采集器名称，如：agent1"
                className={styles.inputLarge}
                maxLength={50}
                showCount
              />
            </Form.Item>
            <div className={styles.formHelpText}>
              建议格式：环境-用途-序号，例如：prod-web-01
            </div>
          </div>

          {/* 采集器用户名输入项 */}
          <div className={styles.formItem}>
            <Form.Item
              name="username"
              label={
                <div className={styles.formLabel}>
                  <span>采集器用户名</span>
                  <span className={styles.requiredMark}>*</span>
                </div>
              }
              rules={[
                { required: true, message: '请输入采集器用户名' },
                { validator: validateUsername }
              ]}
              initialValue="ubuntu" // 默认用户名改为ubuntu
            >
              <Input
                size="large"
                placeholder="请输入采集器用户名，如：ubuntu"
                className={styles.inputLarge}
                maxLength={20}
                prefix={<UserOutlined style={{ color: '#999' }} />}
                showCount
              />
            </Form.Item>
            <div className={styles.formHelpText}>
              用于登录采集器的用户名，支持字母、数字、下划线和连字符，长度3-20位
            </div>
          </div>

          <div className={styles.formItem}>
            <Form.Item
              name="ip"
              label={
                <div className={styles.formLabel}>
                  <span>采集器IP地址</span>
                  <span className={styles.requiredMark}>*</span>
                </div>
              }
              rules={[
                { validator: validateIP }
              ]}
            >
              <Input
                size="large"
                placeholder="请输入采集器IP地址，如：118.229.43.254"
                className={styles.inputLarge}
              />
            </Form.Item>
            <div className={styles.formHelpText}>
              采集器所在服务器的IP地址
            </div>
          </div>

          <div className={styles.formItem}>
            <Form.Item
              name="password"
              label={
                <div className={styles.formLabel}>
                  <span>采集器密码</span>
                  <span className={styles.requiredMark}>*</span>
                </div>
              }
              rules={[
                { required: true, message: '请输入采集器密码' },
                { min: 6, message: '密码长度至少6位' },
                { max: 20, message: '密码长度不能超过20位' }
              ]}
            >
              <Input.Password
                size="large"
                placeholder="请输入采集器密码"
                className={styles.inputLarge}
                maxLength={20}
              />
            </Form.Item>
            <div className={styles.formHelpText}>
              用于访问采集器的密码，长度6-20位
            </div>
          </div>

          <div className={styles.formItem}>
            <Form.Item
              name="port"
              label={
                <div className={styles.formLabel}>
                  <span>SSH端口</span>
                  <span className={styles.requiredMark}>*</span>
                </div>
              }
              rules={[
                { validator: validateSSHPort }
              ]}
              initialValue={22} // 默认SSH端口
            >
              <InputNumber
                size="large"
                placeholder="请输入SSH端口号，如：22"
                className={styles.inputLarge}
                style={{ width: '100%' }}
                min={1}
                max={65535}
              />
            </Form.Item>
            <div className={styles.formHelpText}>
              SSH连接端口，范围1-65535，默认22
            </div>
          </div>

          <Alert
            message="注册说明"
            description={
              <div style={{ lineHeight: 1.6, fontSize: 13 }}>
                <div>1. 采集器注册完成后需等待5-10分钟，时间内不会在列表中展示，请稍后刷新</div>
                <div>2. 请确保采集器IP地址和SSH端口在网络上可达</div>
                <div>3. 请妥善保管采集器用户名和密码，建议定期更换</div>
                <div>4. 注册成功后系统会自动刷新数据</div>
              </div>
            }
            type="info"
            showIcon
            style={{ 
              marginTop: 24,
              borderRadius: 8,
              border: 'none',
              background: 'linear-gradient(135deg, #f6f8fc 0%, #f0f2f5 100%)',
            }}
          />
        </Form>
      </Drawer>

      {/* 配置推送抽屉 */}
      <Drawer
        title={
          <div>
            <span style={{ fontSize: 20, fontWeight: 700, color: '#1d1d1d', letterSpacing: '-0.2px' }}>
              推送配置
            </span>
            {currentCollector && (
              <div style={{ fontSize: 14, color: '#666', marginTop: 8, lineHeight: 1.6 }}>
                目标采集器: <span style={{ color: '#1890ff', fontWeight: 500 }}>{currentCollector.name}</span>
              </div>
            )}
          </div>
        }
        width={800}
        open={configPushDrawerOpen}
        onClose={closeConfigPushDrawer}
        styles={{
          body: {
            padding: '24px 24px 40px',
            background: '#f8f9fa',
            overflowY: 'auto',
            maxHeight: 'calc(100vh - 160px)',
          },
          header: {
            padding: '24px 24px 16px',
            borderBottom: '1px solid #f0f0f0',
            background: 'white',
          },
          footer: {
            padding: '16px 24px',
            borderTop: '1px solid #f0f0f0',
            background: 'white',
          },
        }}
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 12 }}>
            <Button 
              onClick={closeConfigPushDrawer}
              size="large"
              style={{ padding: '0 24px', height: 40 }}
            >
              取消
            </Button>
            <Button 
              type="primary" 
              onClick={handleSubmitConfig} 
              loading={configPushLoading}
              icon={<SendOutlined />}
              size="large"
              style={{ 
                padding: '0 32px', 
                height: 40,
                background: 'linear-gradient(135deg, #722ed1 0%, #5a208f 100%)',
                border: 'none',
                fontWeight: 600,
                boxShadow: '0 4px 12px rgba(114, 46, 209, 0.3)',
              }}
            >
              推送配置
            </Button>
          </div>
        }
      >
        {/* 使用封装的组件 */}
        <CollectorConfigForm
          form={configForm}
          currentCollector={currentCollector}
          validateIP={validateIP}
          validateSSHPort={validateSSHPort}
          loading={configPushLoading}
        />
      </Drawer>
    </>
  );
};