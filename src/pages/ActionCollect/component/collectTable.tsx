import React, { useState, useEffect, useCallback } from 'react';
import { 
  DownloadOutlined, 
  DeleteOutlined, 
  EditOutlined, 
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
  RadarChartOutlined
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
}));

export default () => {
  const { styles } = useStyles();
  const [registerForm] = Form.useForm();
  const [configForm] = Form.useForm();
  const [tableDataSource, setTableListDataSource] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [registerDrawerOpen, setRegisterDrawerOpen] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [configPushDrawerOpen, setConfigPushDrawerOpen] = useState(false);
  const [configPushLoading, setConfigPushLoading] = useState(false);
  const [currentCollector, setCurrentCollector] = useState(null);
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

  // 启用采集器
  const handleEnable = async (record) => {
    try {
      // TODO: 调用启用接口
      console.log('启用采集器:', record.lcuuid);
      
      setTableListDataSource(prev => prev.map(item => 
        item.lcuuid === record.lcuuid 
          ? { ...item, status: 1, state: 'running' }
          : item
      ));
      
      message.success('采集器已启用');
    } catch (error) {
      message.error('启用失败');
    }
  };

  // 禁用采集器
  const handleDisable = async (record) => {
    Modal.confirm({
      title: '确认禁用',
      content: '确定要禁用此采集器吗？禁用后将停止数据采集。',
      okText: '确认禁用',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          // TODO: 调用禁用接口
          console.log('禁用采集器:', record.lcuuid);
          
          setTableListDataSource(prev => prev.map(item => 
            item.lcuuid === record.lcuuid 
              ? { ...item, status: 0, state: 'stopped' }
              : item
          ));
          
          message.success('采集器已禁用');
        } catch (error) {
          message.error('禁用失败');
        }
      },
    });
  };

  // 删除采集器
  const handleDelete = (record) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除此采集器吗？删除后将无法恢复。',
      okText: '确认删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          // TODO: 调用删除接口
          console.log('删除采集器:', record.lcuuid);
          
          setTableListDataSource(prev => 
            prev.filter(item => item.lcuuid !== record.lcuuid)
          );
          
          message.success('采集器已删除');
        } catch (error) {
          message.error('删除失败');
        }
      },
    });
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

  // 注册采集器
  const handleRegisterCollector = async (values) => {
    setRegisterLoading(true);
    try {
      console.log('注册采集器参数:', values);
      
      // TODO: 调用注册接口
      // const response = await registerCollector(values);
      
      // 模拟接口调用延迟
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 生成模拟的新采集器数据
      const newCollector = {
        lcuuid: Date.now(), // 使用时间戳作为ID
        name: values.name,
        group: "User-Registered",
        azName: "T0-Sandbox",
        vtapGroupName: "User-Registered",
        archType: 1, // 默认虚拟机类型
        tapMode: 0, // 默认被动采集
        cpuNum: 4, // 默认CPU核心数
        memorySize: 8, // 默认内存大小
        launchServer: values.ip, // 采集器IP
        podClusterName: "T0-Sandbox",
        ctrlIp: values.ip, // 控制节点IP
        state: 'stopped',
        status: 0, // 新注册的采集器默认停止状态
        curControllerIp: "10.1.183.140", // 默认控制器节点
        curAnalyzerIp: "10.1.183.142", // 默认分析器节点
        createTime: new Date().toLocaleString('zh-CN'),
        updateTime: new Date().toLocaleString('zh-CN'),
        cpuUsage: 0,
        memoryUsage: 0,
        traffic: 0,
        // 存储额外的表单字段
        password: values.password,
        port: values.port,
      };
      
      // 添加到表格数据
      setTableListDataSource(prev => [newCollector, ...prev]);
      
      // 更新统计
      setStats(prev => ({
        ...prev,
        total: prev.total + 1,
        stopped: prev.stopped + 1,
      }));
      
      message.success('采集器注册成功');
      closeRegisterDrawer();
      
      // 提示用户需要启动
      Modal.info({
        title: '注册成功',
        content: '采集器已成功注册，您需要手动启动它才能开始采集数据。',
        okText: '知道了',
      });
      
    } catch (error) {
      console.error('注册采集器失败:', error);
      message.error('注册采集器失败: ' + error.message);
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
      width: 240,
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

          {/* 编辑 */}
          <Tooltip title="编辑">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => message.info('编辑功能开发中')}
              className={styles.actionButton}
              style={{ borderColor: '#1890ff', color: '#1890ff' }}
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
          scroll={{ x: 1350 }}
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
                placeholder="请输入采集器名称，如：prod-web-01"
                className={styles.inputLarge}
                maxLength={50}
                showCount
              />
            </Form.Item>
            <div className={styles.formHelpText}>
              建议格式：环境-用途-序号，例如：prod-web-01
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
                placeholder="请输入采集器IP地址，如：192.168.1.100"
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
                  <span>采集器端口</span>
                  <span className={styles.requiredMark}>*</span>
                </div>
              }
              rules={[
                { validator: validatePort }
              ]}
            >
              <InputNumber
                size="large"
                placeholder="请输入端口号，如：8080"
                className={styles.inputLarge}
                style={{ width: '100%' }}
                min={1}
                max={65535}
              />
            </Form.Item>
            <div className={styles.formHelpText}>
              采集器服务监听的端口，范围1-65535
            </div>
          </div>

          <Alert
            message="注册说明"
            description={
              <div style={{ lineHeight: 1.6, fontSize: 13 }}>
                <div>1. 采集器注册后默认为停止状态，需要手动启动</div>
                <div>2. 请确保采集器IP地址和端口在网络上可达</div>
                <div>3. 请妥善保管采集器密码，建议定期更换</div>
                <div>4. 配置完成后，可以在列表中启用采集器</div>
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

      {/* 配置推送抽屉 - 优化后宽度改为800px */}
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
        width={800} // 抽屉宽度从600px调整为800px
        open={configPushDrawerOpen}
        onClose={closeConfigPushDrawer}
        styles={{
          body: {
            padding: '24px 24px 40px', // 增加底部内边距
            background: '#f8f9fa',
            overflowY: 'auto', // 确保内容可滚动
            maxHeight: 'calc(100vh - 160px)', // 限制最大高度
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
        <Form
          form={configForm}
          layout="vertical"
          requiredMark="optional"
          autocomplete="off"
        >
          {/* 采集器标识配置 */}
          <div className={styles.configSection}>
            <div className={styles.configSectionTitle}>
              <InfoCircleOutlined style={{ color: '#1890ff' }} />
              <span>采集器标识</span>
            </div>
            
            <Row gutter={24}>
              <Col span={12}>
                <Form.Item
                  name="agent_name"
                  label={
                    <div className={styles.formLabel}>
                      采集器名称
                      <span className={styles.requiredMark}>*</span>
                    </div>
                  }
                  className={styles.formItem}
                  rules={[
                    { required: true, message: '采集器名称不能为空' }
                  ]}
                >
                  <Input
                    size="large"
                    disabled
                    className={`${styles.configInput} ${styles.disabledInput}`}
                    placeholder="采集器名称"
                  />
                </Form.Item>
                <div className={styles.formHelpText}>
                  采集器唯一标识，不可修改
                </div>
              </Col>
              
              <Col span={12}>
                <Form.Item
                  name="host_ip"
                  label={
                    <div className={styles.formLabel}>
                      主机IP地址
                      <span className={styles.requiredMark}>*</span>
                    </div>
                  }
                  className={styles.formItem}
                  rules={[
                    { required: true, message: '主机IP地址不能为空' },
                    { validator: validateIP }
                  ]}
                >
                  <Input
                    size="large"
                    disabled
                    className={`${styles.configInput} ${styles.disabledInput}`}
                    placeholder="主机IP地址"
                  />
                </Form.Item>
                <div className={styles.formHelpText}>
                  采集器所在主机的IP地址，不可修改
                </div>
              </Col>
            </Row>
            
            <Row gutter={24}>
              <Col span={12}>
                <Form.Item
                  name="host_password"
                  label={
                    <div className={styles.formLabel}>
                      主机密码
                      <span className={styles.requiredMark}>*</span>
                    </div>
                  }
                  className={styles.formItem}
                  rules={[
                    { required: true, message: '请输入主机密码' },
                    { min: 6, message: '密码长度至少6位' }
                  ]}
                >
                  <Input.Password
                    size="large"
                    className={styles.configInput}
                    placeholder="请输入主机SSH登录密码"
                  />
                </Form.Item>
                <div className={styles.formHelpText}>
                  用于登录主机的SSH密码，建议使用强密码
                </div>
              </Col>
              
              <Col span={12}>
                <Form.Item
                  name="ssh_port"
                  label={
                    <div className={styles.formLabel}>
                      SSH端口
                      <span className={styles.requiredMark}>*</span>
                    </div>
                  }
                  className={styles.formItem}
                  rules={[
                    { validator: validateSSHPort }
                  ]}
                >
                  <InputNumber
                    style={{ width: '100%' }}
                    placeholder="SSH端口号"
                    min={1}
                    max={65535}
                    size="large"
                    className={styles.configNumber}
                  />
                </Form.Item>
                <div className={styles.formHelpText}>
                  主机SSH服务端口，默认22
                </div>
              </Col>
            </Row>
          </div>

          {/* 基本配置 */}
          <div className={styles.configSection}>
            <div className={styles.configSectionTitle}>
              <SettingOutlined style={{ color: '#722ed1' }} />
              <span>基本配置</span>
            </div>
            
            <Row gutter={24}> {/* 增加列间距 */}
              <Col span={12}>
                <Form.Item
                  name="log_level"
                  label={
                    <div className={styles.formLabel}>
                      日志级别
                    </div>
                  }
                  className={styles.formItem}
                  initialValue={1}
                  rules={[
                    { required: true, message: '请选择日志级别' }
                  ]}
                >
                  <Select 
                    placeholder="请选择日志级别" 
                    size="large"
                    className={styles.configSelect}
                  >
                    <Option value={0}>off (关闭)</Option>
                    <Option value={1}>debug (调试)</Option>
                    <Option value={3}>verbose (详细)</Option>
                    <Option value={4}>stats (统计)</Option>
                  </Select>
                </Form.Item>
                <div className={styles.formHelpText}>
                  控制日志输出的详细程度，生产环境建议使用stats级别
                </div>
              </Col>
              
              <Col span={12}>
                <Form.Item
                  name="data_format"
                  label={
                    <div className={styles.formLabel}>
                      数据格式
                    </div>
                  }
                  className={styles.formItem}
                  initialValue="yyyy-MM-dd"
                  rules={[
                    { required: true, message: '请选择数据格式' }
                  ]}
                >
                  <Select 
                    placeholder="请选择数据格式" 
                    size="large"
                    className={styles.configSelect}
                  >
                    <Option value="yyyy-MM-dd">yyyy-MM-dd</Option>
                    <Option value="yyyy/MM/dd">yyyy/MM/dd</Option>
                    <Option value="yyyyMMdd">yyyyMMdd</Option>
                    <Option value="yy-MM-dd">yy-MM-dd</Option>
                    <Option value="yy/MM/dd">yy/MM/dd</Option>
                    <Option value="yyMMdd">yyMMdd</Option>
                  </Select>
                </Form.Item>
                <div className={styles.formHelpText}>
                  时间戳的显示格式，建议使用标准的yyyy-MM-dd格式
                </div>
              </Col>
            </Row>
            
            <Row gutter={24}>
              <Col span={8}> {/* 调整列宽为8，更紧凑 */}
                <Form.Item
                  name="interval"
                  label={
                    <div className={styles.formLabel}>
                      采集间隔(秒)
                    </div>
                  }
                  className={styles.formItem}
                  initialValue={10}
                  rules={[
                    { required: true, message: '请输入采集间隔' },
                    { type: 'number', min: 1, max: 100, message: '采集间隔必须在1-100之间' }
                  ]}
                >
                  <InputNumber
                    style={{ width: '100%' }}
                    placeholder="采集间隔"
                    min={1}
                    max={100}
                    size="large"
                    className={styles.configNumber}
                  />
                </Form.Item>
                <div className={styles.formHelpText}>
                  数据采集的时间间隔，越小越实时但资源消耗越高
                </div>
              </Col>
              
              <Col span={8}>
                <Form.Item
                  name="request_timeout"
                  label={
                    <div className={styles.formLabel}>
                      请求超时(秒)
                    </div>
                  }
                  className={styles.formItem}
                  initialValue={10}
                  rules={[
                    { required: true, message: '请输入请求超时时间' },
                    { type: 'number', min: 1, max: 20, message: '请求超时必须在1-20之间' }
                  ]}
                >
                  <InputNumber
                    style={{ width: '100%' }}
                    placeholder="请求超时"
                    min={1}
                    max={20}
                    size="large"
                    className={styles.configNumber}
                  />
                </Form.Item>
                <div className={styles.formHelpText}>
                  网络请求的超时时间，避免长时间阻塞
                </div>
              </Col>
              
              <Col span={8}>
                <Form.Item
                  name="bulk_size"
                  label={
                    <div className={styles.formLabel}>
                      批量大小(KB)
                    </div>
                  }
                  className={styles.formItem}
                  initialValue={512}
                  rules={[
                    { required: true, message: '请输入批量大小' },
                    { type: 'number', min: 16, max: 1024, message: '批量大小必须在16-1024之间' }
                  ]}
                >
                  <InputNumber
                    style={{ width: '100%' }}
                    placeholder="批量大小"
                    min={16}
                    max={1024}
                    size="large"
                    className={styles.configNumber}
                  />
                </Form.Item>
                <div className={styles.formHelpText}>
                  批量处理的数据包大小，影响传输效率
                </div>
              </Col>
            </Row>
            
            <Row gutter={24}>
              <Col span={12}>
                <Form.Item
                  name="max_size"
                  label={
                    <div className={styles.formLabel}>
                      最大文件大小(MB)
                    </div>
                  }
                  className={styles.formItem}
                  initialValue={512}
                  rules={[
                    { required: true, message: '请输入最大文件大小' },
                    { type: 'number', min: 256, max: 1024, message: '最大文件大小必须在256-1024之间' }
                  ]}
                >
                  <InputNumber
                    style={{ width: '100%' }}
                    placeholder="最大文件大小"
                    min={256}
                    max={1024}
                    size="large"
                    className={styles.configNumber}
                  />
                </Form.Item>
                <div className={styles.formHelpText}>
                  单个日志文件的最大大小，超过后会自动轮转
                </div>
              </Col>
            </Row>
          </div>

          {/* 高级配置 */}
          <div className={styles.configSection}>
            <div className={styles.configSectionTitle}>
              <RadarChartOutlined style={{ color: '#1890ff' }} />
              <span>高级配置</span>
            </div>
            
            <Row gutter={24}>
              <Col span={8}>
                <Form.Item
                  name="max_age"
                  label={
                    <div className={styles.formLabel}>
                      最大保存天数
                    </div>
                  }
                  className={styles.formItem}
                  initialValue={7}
                  rules={[
                    { required: true, message: '请输入最大保存天数' },
                    { type: 'number', min: 1, max: 7, message: '最大保存天数必须在1-7之间' }
                  ]}
                >
                  <InputNumber
                    style={{ width: '100%' }}
                    placeholder="最大保存天数"
                    min={1}
                    max={7}
                    size="large"
                    className={styles.configNumber}
                  />
                </Form.Item>
                <div className={styles.formHelpText}>
                  日志文件的最大保存天数，超过后会自动清理
                </div>
              </Col>
              
              <Col span={8}>
                <Form.Item
                  name="rotate_time"
                  label={
                    <div className={styles.formLabel}>
                      轮转时间(小时)
                    </div>
                  }
                  className={styles.formItem}
                  initialValue={1}
                >
                  <InputNumber
                    style={{ width: '100%' }}
                    placeholder="轮转时间"
                    min={1}
                    max={1}
                    size="large"
                    className={styles.configNumber}
                    disabled
                  />
                </Form.Item>
                <div className={styles.formHelpText}>
                  日志文件的轮转时间间隔，当前固定为1小时
                </div>
              </Col>
              
              <Col span={8}>
                <Form.Item
                  name="cleanup_interval"
                  label={
                    <div className={styles.formLabel}>
                      清理间隔(分钟)
                    </div>
                  }
                  className={styles.formItem}
                  initialValue={30}
                  rules={[
                    { required: true, message: '请输入清理间隔' },
                    { type: 'number', min: 10, max: 60, message: '清理间隔必须在10-60之间' }
                  ]}
                >
                  <InputNumber
                    style={{ width: '100%' }}
                    placeholder="清理间隔"
                    min={10}
                    max={60}
                    size="large"
                    className={styles.configNumber}
                  />
                </Form.Item>
                <div className={styles.formHelpText}>
                  定期清理过期文件的时间间隔
                </div>
              </Col>
            </Row>
            
            <Row gutter={24}>
              <Col span={12}>
                <Form.Item
                  name="max_sockets"
                  label={
                    <div className={styles.formLabel}>
                      最大连接数
                    </div>
                  }
                  className={styles.formItem}
                  initialValue={1024}
                  rules={[
                    { required: true, message: '请输入最大连接数' },
                    { type: 'number', min: 510, max: 2048, message: '最大连接数必须在510-2048之间' }
                  ]}
                >
                  <InputNumber
                    style={{ width: '100%' }}
                    placeholder="最大连接数"
                    min={510}
                    max={2048}
                    size="large"
                    className={styles.configNumber}
                  />
                </Form.Item>
                <div className={styles.formHelpText}>
                  允许的最大网络连接数，影响并发处理能力
                </div>
              </Col>
              
              <Col span={12}>
                <Form.Item
                  name="max_buffered_events"
                  label={
                    <div className={styles.formLabel}>
                      最大缓冲事件数
                    </div>
                  }
                  className={styles.formItem}
                  initialValue={256}
                  rules={[
                    { required: true, message: '请输入最大缓冲事件数' },
                    { type: 'number', min: 128, max: 512, message: '最大缓冲事件数必须在128-512之间' }
                  ]}
                >
                  <InputNumber
                    style={{ width: '100%' }}
                    placeholder="最大缓冲事件数"
                    min={128}
                    max={512}
                    size="large"
                    className={styles.configNumber}
                  />
                </Form.Item>
                <div className={styles.formHelpText}>
                  内存中缓冲的最大事件数量，防止内存溢出
                </div>
              </Col>
            </Row>
          </div>

          {/* 探针配置 */}
          <div className={styles.configSection}>
            <div className={styles.configSectionTitle}>
              <RadarChartOutlined style={{ color: '#fa8c16' }} />
              <span>探针配置</span>
            </div>
            
            <Form.Item
              name="enabled_probes"
              label={
                <div className={styles.formLabel}>
                  启用探针
                </div>
              }
              className={styles.formItem}
              initialValue={[
                "sys_enter_read",
                "sys_exit_read",
                "sys_enter_write",
                "sys_exit_write",
                "sys_enter_close"
              ]}
              rules={[
                { required: true, message: '请选择要启用的探针' }
              ]}
            >
              <div className={styles.probeSelectContainer}>
                <Select
                  mode="multiple"
                  placeholder="请选择要启用的探针"
                  size="large"
                  style={{ width: '100%' }}
                  optionLabelProp="label"
                  className={styles.configSelect}
                  maxTagCount="responsive"
                >
                  <Option value="sys_enter_read" label="sys_enter_read">sys_enter_read</Option>
                  <Option value="sys_exit_read" label="sys_exit_read">sys_exit_read</Option>
                  <Option value="sys_enter_readv" label="sys_enter_readv">sys_enter_readv</Option>
                  <Option value="sys_exit_readv" label="sys_exit_readv">sys_exit_readv</Option>
                  <Option value="sys_enter_recvfrom" label="sys_enter_recvfrom">sys_enter_recvfrom</Option>
                  <Option value="sys_exit_recvfrom" label="sys_exit_recvfrom">sys_exit_recvfrom</Option>
                  <Option value="sys_enter_recvmsg" label="sys_enter_recvmsg">sys_enter_recvmsg</Option>
                  <Option value="sys_exit_recvmsg" label="sys_exit_recvmsg">sys_exit_recvmsg</Option>
                  <Option value="sys_enter_recvmmsg" label="sys_enter_recvmmsg">sys_enter_recvmmsg</Option>
                  <Option value="sys_exit_recvmmsg" label="sys_exit_recvmmsg">sys_exit_recvmmsg</Option>
                  <Option value="sys_enter_write" label="sys_enter_write">sys_enter_write</Option>
                  <Option value="sys_exit_write" label="sys_exit_write">sys_exit_write</Option>
                  <Option value="sys_enter_writev" label="sys_enter_writev">sys_enter_writev</Option>
                  <Option value="sys_exit_writev" label="sys_exit_writev">sys_exit_writev</Option>
                  <Option value="sys_enter_sendto" label="sys_enter_sendto">sys_enter_sendto</Option>
                  <Option value="sys_exit_sendto" label="sys_exit_sendto">sys_exit_sendto</Option>
                  <Option value="sys_enter_sendmsg" label="sys_enter_sendmsg">sys_enter_sendmsg</Option>
                  <Option value="sys_exit_sendmsg" label="sys_exit_sendmsg">sys_exit_sendmsg</Option>
                  <Option value="sys_enter_sendmmsg" label="sys_enter_sendmmsg">sys_enter_sendmmsg</Option>
                  <Option value="sys_exit_sendmmsg" label="sys_exit_sendmmsg">sys_exit_sendmmsg</Option>
                  <Option value="sys_exit_socket" label="sys_exit_socket">sys_exit_socket</Option>
                  <Option value="sys_enter_close" label="sys_enter_close">sys_enter_close</Option>
                </Select>
              </div>
            </Form.Item>
            
            <Alert
              message="探针说明"
              description="探针用于监控系统调用事件，建议根据实际监控需求选择相应的探针，过多的探针会增加系统资源消耗。"
              type="info"
              showIcon
              style={{ 
                marginTop: 8,
                borderRadius: 6,
                background: 'rgba(24, 144, 255, 0.05)',
                border: '1px solid rgba(24, 144, 255, 0.2)',
              }}
            />
          </div>

          {/* 推送选项 */}
          <div className={styles.configSection}>
            <div className={styles.configSectionTitle}>
              <SendOutlined style={{ color: '#52c41a' }} />
              <span>推送选项</span>
            </div>
            
            <Row gutter={24}>
              <Col span={12}>
                <Form.Item
                  name="restartMode"
                  label={
                    <div className={styles.formLabel}>
                      重启模式
                    </div>
                  }
                  className={styles.formItem}
                  initialValue="restart"
                >
                  <Radio.Group size="large">
                    <Radio value="restart" style={{ marginRight: 16 }}>立即重启</Radio>
                    <Radio value="delay" style={{ marginRight: 16 }}>延迟重启</Radio>
                    <Radio value="none">不重启</Radio>
                  </Radio.Group>
                </Form.Item>
                <div className={styles.formHelpText}>
                  配置生效的方式，立即重启会立即应用配置但会中断当前任务
                </div>
              </Col>
            </Row>
            
            <Form.Item
              name="description"
              label={
                <div className={styles.formLabel}>
                  推送描述
                </div>
              }
              className={styles.formItem}
              help="可选，描述本次配置推送的内容和目的"
            >
              <TextArea
                rows={4}
                placeholder="请输入配置推送的描述信息，例如：优化采集间隔，增加探针监控"
                maxLength={200}
                showCount
                size="large"
                className={styles.configInput}
              />
            </Form.Item>
          </div>

          <Alert
            message="推送说明"
            description={
              <div style={{ lineHeight: 1.6, fontSize: 13 }}>
                <div>1. 配置推送后，采集器将根据选择的模式重启以应用新配置</div>
                <div>2. 立即重启会中断当前的采集任务，建议在非高峰时段操作</div>
                <div>3. 延迟重启会在下次采集器启动时应用新配置</div>
                <div>4. 推送过程中请勿关闭页面，以免推送失败</div>
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
    </>
  );
};