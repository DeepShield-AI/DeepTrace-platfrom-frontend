import React from 'react';
import {
  Input,
  InputNumber,
  Select,
  Form,
  Row,
  Col,
  Alert,
  Tag,
  Space,
  Tooltip
} from 'antd';
import {
  InfoCircleOutlined,
  SettingOutlined,
  RadarChartOutlined,
  LockOutlined,
  SafetyOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';

const { Option } = Select;

// 样式对象
const styles = {
  configSection: {
    marginBottom: 24,
    padding: 24,
    background: 'white',
    borderRadius: 8,
    border: '1px solid #f0f0f0',
    boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
    transition: 'all 0.3s',
  },
  configSectionTitle: {
    fontSize: 16,
    fontWeight: 600,
    marginBottom: 20,
    color: '#1d1d1d',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    paddingBottom: 16,
    borderBottom: '1px solid #f0f0f0',
  },
  formLabel: {
    fontWeight: 600,
    color: '#595959',
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
  formHelpText: {
    fontSize: 12,
    color: '#8c8c8c',
    marginTop: 4,
    lineHeight: 1.4,
  },
  configInput: {
    borderRadius: 6,
    border: '1px solid #d9d9d9',
    transition: 'all 0.2s',
  },
  configSelect: {
    width: '100%',
    '& .ant-select-selector': {
      borderRadius: 6,
      border: '1px solid #d9d9d9',
    },
  },
  configNumber: {
    width: '100%',
    '& .ant-input-number': {
      borderRadius: 6,
    },
  },
  disabledInput: {
    backgroundColor: '#f5f5f5',
    color: '#666',
    cursor: 'not-allowed',
  },
  probeSelectContainer: {
    maxHeight: 240,
    overflow: 'auto',
    border: '1px solid #d9d9d9',
    borderRadius: 6,
    padding: 4,
    background: '#fafafa',
  },
  formItem: {
    marginBottom: 20,
  },
  infoTag: {
    backgroundColor: '#e6f7ff',
    borderColor: '#91d5ff',
    color: '#1890ff',
    marginLeft: 8,
  },
  warningText: {
    color: '#fa8c16',
    fontSize: 12,
    marginTop: 4,
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

// 探针选项
const probeOptions = DEFAULT_ENABLED_PROBES.map(value => ({
  value,
  label: value
}));

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

const CollectorConfigForm = ({
  form,
  currentCollector,
  validateIP,
  validateSSHPort,
  formItemLayout = {},
  loading = false
}) => {
  // IP地址验证规则
  const internalValidateIP = validateIP || ((_, value) => {
    const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!value) {
      return Promise.reject(new Error('请输入IP地址'));
    }
    if (!ipPattern.test(value)) {
      return Promise.reject(new Error('请输入正确的IP地址格式，如：192.168.1.100'));
    }
    
    const parts = value.split('.');
    for (let part of parts) {
      const num = parseInt(part, 10);
      if (num < 0 || num > 255) {
        return Promise.reject(new Error('IP地址每个数字段应在0-255之间'));
      }
    }
    return Promise.resolve();
  });

  // SSH端口验证规则
  const internalValidateSSHPort = validateSSHPort || ((_, value) => {
    if (!value) {
      return Promise.reject(new Error('请输入SSH端口号'));
    }
    if (value < 1 || value > 65535) {
      return Promise.reject(new Error('SSH端口号应在1-65535之间'));
    }
    return Promise.resolve();
  });

  // 初始化表单值 - 只在组件挂载或currentCollector变化时执行
  React.useEffect(() => {
    if (form) {
      console.log('初始化表单值，currentCollector:', currentCollector);
      
      if (currentCollector?.config) {
        // 如果是编辑模式，从配置字符串解析
        const parsedValues = parseConfigToFormValues(currentCollector.config, currentCollector);
        if (parsedValues) {
          console.log('从配置解析的表单值:', parsedValues);
          form.setFieldsValue(parsedValues);
        } else {
          // 解析失败，使用默认值
          form.setFieldsValue({
            agent_name: currentCollector.agentName || '',
            host_ip: currentCollector.hostIp || '',
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
          });
        }
      } else if (currentCollector) {
        // 如果有currentCollector但没有config，使用基本信息
        form.setFieldsValue({
          agent_name: currentCollector.agentName || '',
          host_ip: currentCollector.hostIp || '',
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
        });
      } else {
        // 新增模式，设置默认值
        form.setFieldsValue({
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
        });
      }
    }
  }, [form, currentCollector]);

  return (
    <Form
      form={form}
      layout="vertical"
      requiredMark="optional"
      autoComplete="off"
      {...formItemLayout}
      onValuesChange={(changedValues, allValues) => {
        console.log('表单值变化:', changedValues);
        console.log('当前所有值:', allValues);
      }}
    >
      {/* Agent信息配置 */}
      <div style={styles.configSection}>
        <div style={styles.configSectionTitle}>
          <InfoCircleOutlined style={{ color: '#1890ff' }} />
          <span>Agent信息配置</span>
          <Tag style={styles.infoTag}>基本信息</Tag>
        </div>
        
        <Row gutter={24}>
          <Col span={12}>
            <Form.Item
              name="agent_name"
              label={
                <div style={styles.formLabel}>
                  采集器名称
                  <span style={styles.requiredMark}>*</span>
                </div>
              }
              style={styles.formItem}
              rules={[
                { required: true, message: '采集器名称不能为空' }
              ]}
            >
              <Input
                size="large"
                disabled={!!currentCollector?.id}
                placeholder="采集器名称"
                style={{
                  ...styles.configInput,
                  ...(currentCollector?.id ? styles.disabledInput : {})
                }}
              />
            </Form.Item>
            <div style={styles.formHelpText}>
              采集器唯一标识，创建后不可修改
            </div>
          </Col>
          
          <Col span={12}>
            <Form.Item
              name="host_ip"
              label={
                <div style={styles.formLabel}>
                  主机IP地址
                  <span style={styles.requiredMark}>*</span>
                </div>
              }
              style={styles.formItem}
              rules={[
                { required: true, message: '主机IP地址不能为空' },
                { validator: internalValidateIP }
              ]}
            >
              <Input
                size="large"
                disabled={!!currentCollector?.id}
                placeholder="主机IP地址"
                style={{
                  ...styles.configInput,
                  ...(currentCollector?.id ? styles.disabledInput : {})
                }}
              />
            </Form.Item>
            <div style={styles.formHelpText}>
              采集器所在主机的IP地址
            </div>
          </Col>
        </Row>
        
        <Row gutter={24}>
          <Col span={12}>
            <Form.Item
              name="host_password"
              label={
                <div style={styles.formLabel}>
                  <Space>
                    <LockOutlined />
                    <span>主机密码</span>
                  </Space>
                  <span style={styles.requiredMark}>*</span>
                </div>
              }
              style={styles.formItem}
              rules={[
                { required: !currentCollector?.id, message: '请输入主机密码' },
                { min: 6, message: '密码长度至少6位' }
              ]}
            >
              <Input.Password
                size="large"
                placeholder={currentCollector?.id ? "留空则不修改密码" : "请输入主机SSH登录密码"}
                disabled={loading}
                style={styles.configInput}
              />
            </Form.Item>
            <div style={styles.formHelpText}>
              {currentCollector?.id ? '留空则不修改原密码' : '用于登录主机的SSH密码'}
            </div>
          </Col>
          
          <Col span={12}>
            <Form.Item
              name="ssh_port"
              label={
                <div style={styles.formLabel}>
                  <Space>
                    <SafetyOutlined />
                    <span>SSH端口</span>
                  </Space>
                  <span style={styles.requiredMark}>*</span>
                </div>
              }
              style={styles.formItem}
              rules={[
                { required: true, message: '请输入SSH端口号' },
                { validator: internalValidateSSHPort }
              ]}
            >
              <InputNumber
                placeholder="SSH端口号"
                min={1}
                max={65535}
                size="large"
                disabled={loading}
                style={{ ...styles.configNumber, width: '100%' }}
              />
            </Form.Item>
            <div style={styles.formHelpText}>
              主机SSH服务端口，默认22
            </div>
          </Col>
        </Row>
      </div>

      {/* Metric配置 */}
      <div style={styles.configSection}>
        <div style={styles.configSectionTitle}>
          <SettingOutlined style={{ color: '#722ed1' }} />
          <span>Metric配置</span>
        </div>
        
        <Row gutter={24}>
          <Col span={12}>
            <Form.Item
              name="interval"
              label={
                <div style={styles.formLabel}>
                  采集间隔(秒)
                </div>
              }
              style={styles.formItem}
              rules={[
                { required: true, message: '请输入采集间隔' },
                { type: 'number', min: 1, max: 100, message: '采集间隔必须在1-100之间' }
              ]}
            >
              <Tooltip title="数据采集的时间间隔">
                <InputNumber
                  placeholder="采集间隔"
                  min={1}
                  max={100}
                  size="large"
                  disabled={loading}
                  style={{ ...styles.configNumber, width: '100%' }}
                />
              </Tooltip>
            </Form.Item>
            <div style={styles.formHelpText}>
              数据采集的时间间隔
            </div>
          </Col>
        </Row>
      </div>

      {/* Elastic发送器配置 */}
      <div style={styles.configSection}>
        <div style={styles.configSectionTitle}>
          <RadarChartOutlined style={{ color: '#1890ff' }} />
          <span>Elastic发送器配置</span>
        </div>
        
        <Row gutter={24}>
          <Col span={12}>
            <Form.Item
              name="request_timeout"
              label={
                <div style={styles.formLabel}>
                  请求超时(秒)
                </div>
              }
              style={styles.formItem}
              rules={[
                { required: true, message: '请输入请求超时时间' },
                { type: 'number', min: 1, max: 60, message: '请求超时必须在1-60之间' }
              ]}
            >
              <InputNumber
                placeholder="请求超时"
                min={1}
                max={60}
                size="large"
                disabled={loading}
                style={{ ...styles.configNumber, width: '100%' }}
              />
            </Form.Item>
            <div style={styles.formHelpText}>
              Elasticsearch请求超时时间
            </div>
          </Col>
          
          <Col span={12}>
            <Form.Item
              name="bulk_size"
              label={
                <div style={styles.formLabel}>
                  批量大小(KB)
                </div>
              }
              style={styles.formItem}
              rules={[
                { required: true, message: '请输入批量大小' },
                { type: 'number', min: 16, max: 1024, message: '批量大小必须在16-1024之间' }
              ]}
            >
              <InputNumber
                placeholder="批量大小"
                min={16}
                max={1024}
                size="large"
                disabled={loading}
                style={{ ...styles.configNumber, width: '100%' }}
              />
            </Form.Item>
            <div style={styles.formHelpText}>
              批量处理的数据包大小
            </div>
          </Col>
        </Row>
      </div>

      {/* 文件发送器配置 */}
      <div style={styles.configSection}>
        <div style={styles.configSectionTitle}>
          <SettingOutlined style={{ color: '#52c41a' }} />
          <span>文件发送器配置</span>
        </div>
        
        <Row gutter={24}>
          <Col span={12}>
            <Form.Item
              name="data_format"
              label={
                <div style={styles.formLabel}>
                  数据格式
                </div>
              }
              style={styles.formItem}
              rules={[
                { required: true, message: '请选择数据格式' }
              ]}
            >
              <Select 
                placeholder="请选择数据格式" 
                size="large"
                disabled={loading}
                style={styles.configSelect}
              >
                <Option value="%Y%m%d">%Y%m%d</Option>
                <Option value="%Y-%m-%d">%Y-%m-%d</Option>
                <Option value="%Y/%m/%d">%Y/%m/%d</Option>
                <Option value="%Y%m%d_%H">%Y%m%d_%H</Option>
              </Select>
            </Form.Item>
            <div style={styles.formHelpText}>
              时间戳的显示格式
            </div>
          </Col>
          
          <Col span={12}>
            <Form.Item
              name="max_size"
              label={
                <div style={styles.formLabel}>
                  最大文件大小(MB)
                </div>
              }
              style={styles.formItem}
              rules={[
                { required: true, message: '请输入最大文件大小' },
                { type: 'number', min: 256, max: 1024, message: '最大文件大小必须在256-1024之间' }
              ]}
            >
              <InputNumber
                placeholder="最大文件大小"
                min={256}
                max={1024}
                size="large"
                disabled={loading}
                style={{ ...styles.configNumber, width: '100%' }}
              />
            </Form.Item>
            <div style={styles.formHelpText}>
              单个日志文件的最大大小
            </div>
          </Col>
        </Row>
        
        <Row gutter={24}>
          <Col span={8}>
            <Form.Item
              name="max_age"
              label={
                <div style={styles.formLabel}>
                  最大保存天数
                </div>
              }
              style={styles.formItem}
              rules={[
                { required: true, message: '请输入最大保存天数' },
                { type: 'number', min: 1, max: 30, message: '最大保存天数必须在1-30之间' }
              ]}
            >
              <InputNumber
                placeholder="最大保存天数"
                min={1}
                max={30}
                size="large"
                disabled={loading}
                style={{ ...styles.configNumber, width: '100%' }}
              />
            </Form.Item>
            <div style={styles.formHelpText}>
              日志文件的最大保存天数
            </div>
          </Col>
          
          <Col span={8}>
            <Form.Item
              name="rotate_time"
              label={
                <div style={styles.formLabel}>
                  轮转时间(小时)
                </div>
              }
              style={styles.formItem}
              rules={[
                { required: true, message: '请输入轮转时间' },
                { type: 'number', min: 1, max: 24, message: '轮转时间必须在1-24之间' }
              ]}
            >
              <InputNumber
                placeholder="轮转时间"
                min={1}
                max={24}
                size="large"
                disabled={loading}
                style={{ ...styles.configNumber, width: '100%' }}
              />
            </Form.Item>
            <div style={styles.formHelpText}>
              日志文件的轮转时间间隔
            </div>
          </Col>
        </Row>
      </div>

      {/* Trace配置 */}
      <div style={styles.configSection}>
        <div style={styles.configSectionTitle}>
          <RadarChartOutlined style={{ color: '#fa8c16' }} />
          <span>Trace配置</span>
        </div>
        
        <Row gutter={24}>
          <Col span={12}>
            <Form.Item
              name="cleanup_interval"
              label={
                <div style={styles.formLabel}>
                  <Space>
                    <ClockCircleOutlined />
                    <span>清理间隔(分钟)</span>
                  </Space>
                </div>
              }
              style={styles.formItem}
              rules={[
                { required: true, message: '请输入清理间隔' },
                { type: 'number', min: 10, max: 60, message: '清理间隔必须在10-60之间' }
              ]}
            >
              <InputNumber
                placeholder="清理间隔"
                min={10}
                max={60}
                size="large"
                disabled={loading}
                style={{ ...styles.configNumber, width: '100%' }}
              />
            </Form.Item>
            <div style={styles.formHelpText}>
              定期清理过期文件的时间间隔
            </div>
          </Col>
          
          <Col span={12}>
            <Form.Item
              name="max_sockets"
              label={
                <div style={styles.formLabel}>
                  最大连接数
                </div>
              }
              style={styles.formItem}
              rules={[
                { required: true, message: '请输入最大连接数' },
                { type: 'number', min: 510, max: 2048, message: '最大连接数必须在510-2048之间' }
              ]}
            >
              <InputNumber
                placeholder="最大连接数"
                min={510}
                max={2048}
                size="large"
                disabled={loading}
                style={{ ...styles.configNumber, width: '100%' }}
              />
            </Form.Item>
            <div style={styles.formHelpText}>
              允许的最大网络连接数
            </div>
          </Col>
        </Row>
      </div>

      {/* eBPF配置 */}
      <div style={styles.configSection}>
        <div style={styles.configSectionTitle}>
          <RadarChartOutlined style={{ color: '#eb2f96' }} />
          <span>eBPF配置</span>
          <Tag color="orange">系统资源敏感</Tag>
        </div>
        
        <Row gutter={24}>
          <Col span={8}>
            <Form.Item
              name="log_level"
              label={
                <div style={styles.formLabel}>
                  日志级别
                </div>
              }
              style={styles.formItem}
              rules={[
                { required: true, message: '请选择日志级别' }
              ]}
            >
              <Select 
                placeholder="请选择日志级别" 
                size="large"
                disabled={loading}
                style={styles.configSelect}
              >
                <Option value={0}>off (关闭)</Option>
                <Option value={1}>debug (调试)</Option>
                <Option value={2}>info (信息)</Option>
                <Option value={3}>verbose (详细)</Option>
                <Option value={4}>stats (统计)</Option>
              </Select>
            </Form.Item>
            <div style={styles.formHelpText}>
              控制日志输出的详细程度
            </div>
          </Col>
          
          <Col span={8}>
            <Form.Item
              name="max_buffered_events"
              label={
                <div style={styles.formLabel}>
                  最大缓冲事件数
                </div>
              }
              style={styles.formItem}
              rules={[
                { required: true, message: '请输入最大缓冲事件数' },
                { type: 'number', min: 128, max: 512, message: '最大缓冲事件数必须在128-512之间' }
              ]}
            >
              <InputNumber
                placeholder="最大缓冲事件数"
                min={128}
                max={512}
                size="large"
                disabled={loading}
                style={{ ...styles.configNumber, width: '100%' }}
              />
            </Form.Item>
            <div style={styles.formHelpText}>
              内存中缓冲的最大事件数量
            </div>
          </Col>
        </Row>
        
        <Form.Item
          name="enabled_probes"
          label={
            <div style={styles.formLabel}>
              启用探针
            </div>
          }
          style={styles.formItem}
          rules={[
            { required: true, message: '请选择要启用的探针' }
          ]}
        >
          <div style={styles.probeSelectContainer}>
            <Select
              mode="multiple"
              placeholder="请选择要启用的探针"
              size="large"
              disabled={loading}
              optionLabelProp="label"
              maxTagCount="responsive"
              allowClear
              showSearch
              filterOption={(input, option) =>
                option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
              }
              style={styles.configSelect}
            >
              {probeOptions.map(probe => (
                <Option key={probe.value} value={probe.value} label={probe.label}>
                  {probe.label}
                </Option>
              ))}
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
        
        <div style={styles.warningText}>
          注意：选择过多探针可能会导致系统性能下降，请谨慎选择。
        </div>
      </div>

      <Alert
        message="配置说明"
        description={
          <div style={{ lineHeight: 1.6, fontSize: 13 }}>
            <div>1. 配置保存后，采集器将根据配置参数进行工作</div>
            <div>2. 请根据实际监控需求和系统资源情况合理配置各项参数</div>
            <div>3. 过多的探针和过短的采集间隔可能会影响系统性能</div>
            <div>4. 配置过程中请确保参数设置合理，以免影响采集效果</div>
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
  );
};

CollectorConfigForm.defaultProps = {
  formItemLayout: {},
  loading: false,
};

export default CollectorConfigForm;