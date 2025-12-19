import React from 'react';
import {
  Input,
  InputNumber,
  Select,
  Radio,
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
  SendOutlined,
  LockOutlined,
  SafetyOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';

const { TextArea } = Input;
const { Option } = Select;

// 创建样式（使用style对象替代createStyles）
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
    '& .ant-input': {
      borderRadius: 6,
      border: '1px solid #d9d9d9',
      transition: 'all 0.2s',
      '&:focus': {
        borderColor: '#722ed1',
        boxShadow: '0 0 0 2px rgba(114, 46, 209, 0.1)',
      },
    },
  },
  configSelect: {
    '& .ant-select-selector': {
      borderRadius: 6,
      border: '1px solid #d9d9d9',
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
      borderRadius: 6,
      '&:hover': {
        borderColor: '#722ed1',
      },
      '&.ant-input-number-focused': {
        borderColor: '#722ed1',
        boxShadow: '0 0 0 2px rgba(114, 46, 209, 0.1)',
      },
    },
  },
  disabledInput: {
    '& .ant-input': {
      backgroundColor: '#f5f5f5',
      color: '#666',
      cursor: 'not-allowed',
    },
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

  // 探针选项
  const probeOptions = [
    { value: 'sys_enter_read', label: 'sys_enter_read' },
    { value: 'sys_exit_read', label: 'sys_exit_read' },
    { value: 'sys_enter_readv', label: 'sys_enter_readv' },
    { value: 'sys_exit_readv', label: 'sys_exit_readv' },
    { value: 'sys_enter_recvfrom', label: 'sys_enter_recvfrom' },
    { value: 'sys_exit_recvfrom', label: 'sys_exit_recvfrom' },
    { value: 'sys_enter_recvmsg', label: 'sys_enter_recvmsg' },
    { value: 'sys_exit_recvmsg', label: 'sys_exit_recvmsg' },
    { value: 'sys_enter_recvmmsg', label: 'sys_enter_recvmmsg' },
    { value: 'sys_exit_recvmmsg', label: 'sys_exit_recvmmsg' },
    { value: 'sys_enter_write', label: 'sys_enter_write' },
    { value: 'sys_exit_write', label: 'sys_exit_write' },
    { value: 'sys_enter_writev', label: 'sys_enter_writev' },
    { value: 'sys_exit_writev', label: 'sys_exit_writev' },
    { value: 'sys_enter_sendto', label: 'sys_enter_sendto' },
    { value: 'sys_exit_sendto', label: 'sys_exit_sendto' },
    { value: 'sys_enter_sendmsg', label: 'sys_enter_sendmsg' },
    { value: 'sys_exit_sendmsg', label: 'sys_exit_sendmsg' },
    { value: 'sys_enter_sendmmsg', label: 'sys_enter_sendmmsg' },
    { value: 'sys_exit_sendmmsg', label: 'sys_exit_sendmmsg' },
    { value: 'sys_exit_socket', label: 'sys_exit_socket' },
    { value: 'sys_enter_close', label: 'sys_enter_close' },
  ];

  // 默认值
  const defaultValues = {
    agent_name: currentCollector?.name || '',
    host_ip: currentCollector?.launchServer || currentCollector?.curControllerIp || '',
    host_password: '',
    ssh_port: 22,
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
  };

  // 初始化表单值
  React.useEffect(() => {
    if (form && currentCollector) {
      form.setFieldsValue({
        ...defaultValues,
        agent_name: currentCollector.name,
        host_ip: currentCollector.launchServer || currentCollector.curControllerIp,
      });
    }
  }, [form, currentCollector]);

  return (
    <Form
      form={form}
      layout="vertical"
      requiredMark="optional"
      autoComplete="off"
      initialValues={defaultValues}
      {...formItemLayout}
    >
      {/* 采集器标识配置 */}
      <div style={styles.configSection}>
        <div style={styles.configSectionTitle}>
          <InfoCircleOutlined style={{ color: '#1890ff' }} />
          <span>采集器标识</span>
          <Tag style={styles.infoTag}>只读</Tag>
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
                // disabled
                placeholder="采集器名称"
                style={styles.disabledInput}
              />
            </Form.Item>
            <div style={styles.formHelpText}>
              采集器唯一标识
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
                // disabled
                placeholder="主机IP地址"
                style={styles.disabledInput}
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
                { required: true, message: '请输入主机密码' },
                { min: 6, message: '密码长度至少6位' }
              ]}
            >
              <Input.Password
                size="large"
                placeholder="请输入主机SSH登录密码"
                style={styles.configInput}
              />
            </Form.Item>
            <div style={styles.formHelpText}>
              用于登录主机的SSH密码，建议使用强密码
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
                { validator: internalValidateSSHPort }
              ]}
            >
              <InputNumber
                style={{ width: '100%' }}
                placeholder="SSH端口号"
                min={1}
                max={65535}
                size="large"
                style={styles.configNumber}
              />
            </Form.Item>
            <div style={styles.formHelpText}>
              主机SSH服务端口，默认22
            </div>
          </Col>
        </Row>
      </div>

      {/* 基本配置 */}
      <div style={styles.configSection}>
        <div style={styles.configSectionTitle}>
          <SettingOutlined style={{ color: '#722ed1' }} />
          <span>基本配置</span>
        </div>
        
        <Row gutter={24}>
          <Col span={12}>
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
                style={styles.configSelect}
              >
                <Option value={0}>off (关闭)</Option>
                <Option value={1}>debug (调试)</Option>
                <Option value={3}>verbose (详细)</Option>
                <Option value={4}>stats (统计)</Option>
              </Select>
            </Form.Item>
            <div style={styles.formHelpText}>
              控制日志输出的详细程度，生产环境建议使用stats级别
            </div>
          </Col>
          
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
                style={styles.configSelect}
              >
                <Option value="yyyy-MM-dd">yyyy-MM-dd</Option>
                <Option value="yyyy/MM/dd">yyyy/MM/dd</Option>
                <Option value="yyyyMMdd">yyyyMMdd</Option>
                <Option value="yy-MM-dd">yy-MM-dd</Option>
                <Option value="yy/MM/dd">yy/MM/dd</Option>
                <Option value="yyMMdd">yyMMdd</Option>
              </Select>
            </Form.Item>
            <div style={styles.formHelpText}>
              时间戳的显示格式，建议使用标准的yyyy-MM-dd格式
            </div>
          </Col>
        </Row>
        
        <Row gutter={24}>
          <Col span={8}>
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
              <Tooltip title="数据采集的时间间隔，越小越实时但资源消耗越高">
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="采集间隔"
                  min={1}
                  max={100}
                  size="large"
                  style={styles.configNumber}
                />
              </Tooltip>
            </Form.Item>
            <div style={styles.formHelpText}>
              数据采集的时间间隔，越小越实时但资源消耗越高
            </div>
          </Col>
          
          <Col span={8}>
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
                { type: 'number', min: 1, max: 20, message: '请求超时必须在1-20之间' }
              ]}
            >
              <Tooltip title="网络请求的超时时间，避免长时间阻塞">
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="请求超时"
                  min={1}
                  max={20}
                  size="large"
                  style={styles.configNumber}
                />
              </Tooltip>
            </Form.Item>
            <div style={styles.formHelpText}>
              网络请求的超时时间，避免长时间阻塞
            </div>
          </Col>
          
          <Col span={8}>
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
              <Tooltip title="批量处理的数据包大小，影响传输效率">
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="批量大小"
                  min={16}
                  max={1024}
                  size="large"
                  style={styles.configNumber}
                />
              </Tooltip>
            </Form.Item>
            <div style={styles.formHelpText}>
              批量处理的数据包大小，影响传输效率
            </div>
          </Col>
        </Row>
        
        <Row gutter={24}>
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
              <Tooltip title="单个日志文件的最大大小，超过后会自动轮转">
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="最大文件大小"
                  min={256}
                  max={1024}
                  size="large"
                  style={styles.configNumber}
                />
              </Tooltip>
            </Form.Item>
            <div style={styles.formHelpText}>
              单个日志文件的最大大小，超过后会自动轮转
            </div>
          </Col>
        </Row>
      </div>

      {/* 高级配置 */}
      <div style={styles.configSection}>
        <div style={styles.configSectionTitle}>
          <RadarChartOutlined style={{ color: '#1890ff' }} />
          <span>高级配置</span>
          <Tag color="blue">推荐配置</Tag>
        </div>
        
        <Row gutter={24}>
          <Col span={8}>
            <Form.Item
              name="max_age"
              label={
                <div style={styles.formLabel}>
                  <Space>
                    <ClockCircleOutlined />
                    <span>最大保存天数</span>
                  </Space>
                </div>
              }
              style={styles.formItem}
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
                style={styles.configNumber}
              />
            </Form.Item>
            <div style={styles.formHelpText}>
              日志文件的最大保存天数，超过后会自动清理
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
            >
              <InputNumber
                style={{ width: '100%' }}
                placeholder="轮转时间"
                min={1}
                max={1}
                size="large"
                style={styles.configNumber}
                disabled
              />
            </Form.Item>
            <div style={styles.formHelpText}>
              日志文件的轮转时间间隔，当前固定为1小时
            </div>
          </Col>
          
          <Col span={8}>
            <Form.Item
              name="cleanup_interval"
              label={
                <div style={styles.formLabel}>
                  清理间隔(分钟)
                </div>
              }
              style={styles.formItem}
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
                style={styles.configNumber}
              />
            </Form.Item>
            <div style={styles.formHelpText}>
              定期清理过期文件的时间间隔
            </div>
          </Col>
        </Row>
        
        <Row gutter={24}>
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
                style={{ width: '100%' }}
                placeholder="最大连接数"
                min={510}
                max={2048}
                size="large"
                style={styles.configNumber}
              />
            </Form.Item>
            <div style={styles.formHelpText}>
              允许的最大网络连接数，影响并发处理能力
            </div>
          </Col>
          
          <Col span={12}>
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
                style={{ width: '100%' }}
                placeholder="最大缓冲事件数"
                min={128}
                max={512}
                size="large"
                style={styles.configNumber}
              />
            </Form.Item>
            <div style={styles.formHelpText}>
              内存中缓冲的最大事件数量，防止内存溢出
            </div>
          </Col>
        </Row>
      </div>

      {/* 探针配置 */}
      <div style={styles.configSection}>
        <div style={styles.configSectionTitle}>
          <RadarChartOutlined style={{ color: '#fa8c16' }} />
          <span>探针配置</span>
          <Tag color="orange">系统资源敏感</Tag>
        </div>
        
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
              style={{ width: '100%' }}
              optionLabelProp="label"
              style={styles.configSelect}
              maxTagCount="responsive"
              allowClear
              showSearch
              filterOption={(input, option) =>
                option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
              }
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

      {/* 推送选项 */}
      <div style={styles.configSection}>
        <div style={styles.configSectionTitle}>
          <SendOutlined style={{ color: '#52c41a' }} />
          <span>推送选项</span>
        </div>
        
        <Row gutter={24}>
          <Col span={12}>
            <Form.Item
              name="restartMode"
              label={
                <div style={styles.formLabel}>
                  重启模式
                </div>
              }
              style={styles.formItem}
            >
              <Radio.Group size="large">
                <Radio value="restart" style={{ marginRight: 16 }}>
                  <Tooltip title="立即重启采集器，配置立即生效但会中断当前任务">
                    立即重启
                  </Tooltip>
                </Radio>
                <Radio value="delay" style={{ marginRight: 16 }}>
                  <Tooltip title="延迟重启，在下一次采集器启动时应用配置">
                    延迟重启
                  </Tooltip>
                </Radio>
                <Radio value="none">
                  <Tooltip title="不重启采集器，配置在采集器下次运行时生效">
                    不重启
                  </Tooltip>
                </Radio>
              </Radio.Group>
            </Form.Item>
            <div style={styles.formHelpText}>
              配置生效的方式，立即重启会立即应用配置但会中断当前任务
            </div>
          </Col>
        </Row>
        
        <Form.Item
          name="description"
          label={
            <div style={styles.formLabel}>
              推送描述
            </div>
          }
          style={styles.formItem}
          help="可选，描述本次配置推送的内容和目的"
        >
          <TextArea
            rows={4}
            placeholder="请输入配置推送的描述信息，例如：优化采集间隔，增加探针监控"
            maxLength={200}
            showCount
            size="large"
            style={styles.configInput}
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
  );
};

CollectorConfigForm.defaultProps = {
  formItemLayout: {},
  loading: false,
};

export default CollectorConfigForm;