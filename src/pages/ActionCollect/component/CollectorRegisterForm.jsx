// components/CollectorRegisterForm.jsx
import React, { useState } from 'react';
import { 
  SettingOutlined,
  CloudUploadOutlined,
  LineChartOutlined,
  EyeOutlined,
  InfoCircleOutlined,
  DatabaseOutlined,
  SecurityScanOutlined,
  ClusterOutlined,
  ApartmentOutlined
} from '@ant-design/icons';
import { 
  ProForm,
  ProFormText,
  ProFormSelect,
  ProFormDigit,
  ProFormSwitch,
  ProFormTextArea
} from '@ant-design/pro-components';
import { 
  Row, 
  Col, 
  Tooltip,
  Button,
  Alert,
  message,
  Space,
  Tag,
  Divider
} from 'antd';
import { createStyles } from 'antd-style';

// 定义样式
const useStyles = createStyles(({ token }) => ({
  formSection: {
    marginBottom: 24,
    padding: 20,
    background: 'white',
    borderRadius: token.borderRadiusLG,
    border: `1px solid ${token.colorBorderSecondary}`,
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
    transition: 'all 0.3s',
    '&:hover': {
      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
    },
  },
  formSectionTitle: {
    fontSize: 16,
    fontWeight: 600,
    marginBottom: 20,
    color: token.colorTextHeading,
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    paddingBottom: 12,
    borderBottom: `1px solid ${token.colorBorderSecondary}`,
  },
  formItem: {
    marginBottom: 20,
  },
  formLabel: {
    fontWeight: 500,
    color: token.colorTextHeading,
    marginBottom: 6,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  testConnectionButton: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    border: 'none',
    color: 'white',
    fontWeight: 500,
    padding: '4px 12px',
    height: 'auto',
    '&:hover': {
      background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4090 100%)',
      color: 'white',
    },
  },
  stepIndicator: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 24,
    height: 24,
    borderRadius: '50%',
    background: token.colorPrimary,
    color: 'white',
    fontSize: 12,
    fontWeight: 600,
  },
  fieldHint: {
    fontSize: 12,
    color: token.colorTextSecondary,
    marginTop: 4,
    lineHeight: 1.4,
  },
  requiredMark: {
    color: token.colorError,
    marginLeft: 2,
  },
  tagContainer: {
    marginTop: 8,
  },
  featureTag: {
    borderRadius: 12,
    padding: '2px 8px',
    fontSize: 12,
  },
}));

// 采集器类型选项
const archTypeOptions = [
  { label: '物理机', value: 0, description: '部署在物理服务器上的采集器' },
  { label: '虚拟机', value: 1, description: '部署在虚拟机上的采集器' },
  { label: '容器', value: 2, description: '以容器方式运行的采集器' },
  { label: '云服务器', value: 3, description: '部署在云平台上的采集器' },
];

// 采集模式选项
const tapModeOptions = [
  { label: '被动采集', value: 0, description: '监听网络流量进行采集' },
  { label: '主动采集', value: 1, description: '主动发送探测包进行采集' },
  { label: '混合采集', value: 2, description: '结合被动和主动采集模式' },
];

// 可用区选项
const azOptions = [
  { label: 'T0-Sandbox', value: 'T0-Sandbox' },
  { label: 'T1-Production', value: 'T1-Production' },
  { label: 'T2-Testing', value: 'T2-Testing' },
  { label: 'T3-Development', value: 'T3-Development' },
];

// 采集器组选项
const vtapGroupOptions = [
  { label: 'T0-Sandbox', value: 'T0-Sandbox' },
  { label: 'Web-Servers', value: 'Web-Servers' },
  { label: 'Database', value: 'Database' },
  { label: 'Middleware', value: 'Middleware' },
  { label: 'Network-Device', value: 'Network-Device' },
  { label: 'Security', value: 'Security' },
];

// 控制器节点选项
const controllerOptions = [
  { label: '10.1.183.140 (主控节点)', value: '10.1.183.140' },
  { label: '10.1.183.141 (备控节点)', value: '10.1.183.141' },
  { label: '10.1.183.142 (高可用)', value: '10.1.183.142' },
  { label: '10.1.183.143 (负载均衡)', value: '10.1.183.143' },
];

// 分析器节点选项
const analyzerOptions = [
  { label: '10.1.183.140 (主分析器)', value: '10.1.183.140' },
  { label: '10.1.183.141 (副分析器)', value: '10.1.183.141' },
  { label: '10.1.183.142 (实时分析)', value: '10.1.183.142' },
  { label: '10.1.183.143 (离线分析)', value: '10.1.183.143' },
];

// 网络接口选项
const networkInterfaceOptions = [
  { label: 'eth0', value: 'eth0' },
  { label: 'eth1', value: 'eth1' },
  { label: 'bond0', value: 'bond0' },
  { label: 'ens192', value: 'ens192' },
  { label: 'eno1', value: 'eno1' },
  { label: '自定义', value: 'custom' },
];

const CollectorRegisterForm = ({ 
  form, 
  currentStep, 
  registerLoading,
  onTestConnection 
}) => {
  const { styles } = useStyles();
  const [customInterface, setCustomInterface] = useState(false);

  // 快速测试连接
  const handleTestConnection = async () => {
    try {
      const values = await form.validateFields(['launchServer', 'ctrlIp']);
      
      if (!values.launchServer || !values.ctrlIp) {
        message.warning('请先填写服务器地址和控制节点IP');
        return;
      }
      
      if (onTestConnection) {
        await onTestConnection(values);
      }
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  // 处理网络接口选择
  const handleInterfaceChange = (value) => {
    if (value === 'custom') {
      setCustomInterface(true);
      form.setFieldValue('networkInterface', '');
    } else {
      setCustomInterface(false);
      form.setFieldValue('networkInterface', value);
    }
  };

  return (
    <ProForm
      form={form}
      submitter={false}
      layout="vertical"
      requiredMark={false}
      style={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto', paddingRight: 8 }}
    >
      {/* 第一步：基本信息 */}
      {currentStep === 0 && (
        <>
          <div className={styles.formSection}>
            <div className={styles.formSectionTitle}>
              <div className={styles.stepIndicator}>1</div>
              <SettingOutlined />
              <span>基本信息配置</span>
              <div style={{ flex: 1 }} />
              <Tag color="blue" className={styles.featureTag}>必填</Tag>
            </div>
            <Row gutter={24}>
              <Col span={12} className={styles.formItem}>
                <ProFormText
                  name="name"
                  label={
                    <div className={styles.formLabel}>
                      <span>采集器名称</span>
                      <span className={styles.requiredMark}>*</span>
                    </div>
                  }
                  placeholder="请输入采集器名称，如：prod-web-01"
                  rules={[{ required: true, message: '请输入采集器名称' }]}
                  fieldProps={{
                    size: 'large',
                    maxLength: 50,
                    showCount: true,
                  }}
                />
                <div className={styles.fieldHint}>
                  建议格式：环境-用途-序号，例如：prod-web-01
                </div>
              </Col>
              <Col span={12} className={styles.formItem}>
                <ProFormText
                  name="group"
                  label={<div className={styles.formLabel}>分组名称</div>}
                  placeholder="请输入分组名称，如：Production"
                  fieldProps={{
                    size: 'large',
                    maxLength: 30,
                    showCount: true,
                  }}
                />
                <div className={styles.fieldHint}>
                  可选，用于对采集器进行分组管理
                </div>
              </Col>
            </Row>
            
            <Divider />
            
            <Row gutter={24}>
              <Col span={12} className={styles.formItem}>
                <ProFormSelect
                  name="archType"
                  label={
                    <div className={styles.formLabel}>
                      <ClusterOutlined />
                      <span>采集器类型</span>
                      <span className={styles.requiredMark}>*</span>
                    </div>
                  }
                  placeholder="请选择采集器类型"
                  options={archTypeOptions.map(option => ({
                    ...option,
                    label: (
                      <div>
                        <div style={{ fontWeight: 500 }}>{option.label}</div>
                        <div style={{ fontSize: 12, color: '#999' }}>{option.description}</div>
                      </div>
                    ),
                  }))}
                  rules={[{ required: true, message: '请选择采集器类型' }]}
                  fieldProps={{
                    size: 'large',
                    optionLabelProp: 'label',
                  }}
                />
              </Col>
              <Col span={12} className={styles.formItem}>
                <ProFormSelect
                  name="tapMode"
                  label={
                    <div className={styles.formLabel}>
                      <DatabaseOutlined />
                      <span>采集模式</span>
                      <span className={styles.requiredMark}>*</span>
                    </div>
                  }
                  placeholder="请选择采集模式"
                  options={tapModeOptions.map(option => ({
                    ...option,
                    label: (
                      <div>
                        <div style={{ fontWeight: 500 }}>{option.label}</div>
                        <div style={{ fontSize: 12, color: '#999' }}>{option.description}</div>
                      </div>
                    ),
                  }))}
                  rules={[{ required: true, message: '请选择采集模式' }]}
                  fieldProps={{
                    size: 'large',
                  }}
                />
              </Col>
            </Row>
            
            <Row gutter={24}>
              <Col span={12} className={styles.formItem}>
                <ProFormSelect
                  name="azName"
                  label={
                    <div className={styles.formLabel}>
                      <ApartmentOutlined />
                      <span>可用区</span>
                      <span className={styles.requiredMark}>*</span>
                    </div>
                  }
                  placeholder="请选择可用区"
                  options={azOptions}
                  rules={[{ required: true, message: '请选择可用区' }]}
                  fieldProps={{
                    size: 'large',
                  }}
                />
              </Col>
              <Col span={12} className={styles.formItem}>
                <ProFormSelect
                  name="vtapGroupName"
                  label={
                    <div className={styles.formLabel}>
                      <ApartmentOutlined />
                      <span>采集器组</span>
                      <span className={styles.requiredMark}>*</span>
                    </div>
                  }
                  placeholder="请选择采集器组"
                  options={vtapGroupOptions}
                  rules={[{ required: true, message: '请选择采集器组' }]}
                  fieldProps={{
                    size: 'large',
                  }}
                />
              </Col>
            </Row>
          </div>

          <div className={styles.formSection}>
            <div className={styles.formSectionTitle}>
              <div className={styles.stepIndicator}>2</div>
              <CloudUploadOutlined />
              <span>连接配置</span>
              <div style={{ flex: 1 }} />
              <Tag color="blue" className={styles.featureTag}>必填</Tag>
            </div>
            <Row gutter={24}>
              <Col span={12} className={styles.formItem}>
                <ProFormText
                  name="launchServer"
                  label={
                    <div className={styles.formLabel}>
                      <span>服务器地址</span>
                      <span className={styles.requiredMark}>*</span>
                    </div>
                  }
                  placeholder="请输入服务器IP地址，如：10.0.221.224"
                  rules={[
                    { required: true, message: '请输入服务器地址' },
                    { pattern: /^(\d{1,3}\.){3}\d{1,3}$/, message: '请输入正确的IP地址' }
                  ]}
                  fieldProps={{
                    size: 'large',
                    suffix: (
                      <Button 
                        className={styles.testConnectionButton}
                        onClick={handleTestConnection}
                        loading={registerLoading}
                        size="small"
                      >
                        测试连接
                      </Button>
                    ),
                  }}
                />
                <div className={styles.fieldHint}>
                  采集器将要部署的服务器的IP地址
                </div>
              </Col>
              <Col span={12} className={styles.formItem}>
                <ProFormText
                  name="ctrlIp"
                  label={
                    <div className={styles.formLabel}>
                      <span>控制节点IP</span>
                      <span className={styles.requiredMark}>*</span>
                    </div>
                  }
                  placeholder="请输入控制节点IP"
                  rules={[
                    { required: true, message: '请输入控制节点IP' },
                    { pattern: /^(\d{1,3}\.){3}\d{1,3}$/, message: '请输入正确的IP地址' }
                  ]}
                  fieldProps={{
                    size: 'large',
                  }}
                />
                <div className={styles.fieldHint}>
                  控制节点IP地址，用于采集器与控制中心通信
                </div>
              </Col>
            </Row>
            
            <Divider />
            
            <Row gutter={24}>
              <Col span={12} className={styles.formItem}>
                <ProFormSelect
                  name="curControllerIp"
                  label={
                    <div className={styles.formLabel}>
                      <SettingOutlined />
                      <span>控制器节点</span>
                      <span className={styles.requiredMark}>*</span>
                    </div>
                  }
                  placeholder="请选择控制器节点"
                  options={controllerOptions}
                  rules={[{ required: true, message: '请选择控制器节点' }]}
                  fieldProps={{
                    size: 'large',
                  }}
                />
                <div className={styles.fieldHint}>
                  负责接收采集器数据的控制器节点
                </div>
              </Col>
              <Col span={12} className={styles.formItem}>
                <ProFormSelect
                  name="curAnalyzerIp"
                  label={
                    <div className={styles.formLabel}>
                      <LineChartOutlined />
                      <span>分析器节点</span>
                      <span className={styles.requiredMark}>*</span>
                    </div>
                  }
                  placeholder="请选择分析器节点"
                  options={analyzerOptions}
                  rules={[{ required: true, message: '请选择分析器节点' }]}
                  fieldProps={{
                    size: 'large',
                  }}
                />
                <div className={styles.fieldHint}>
                  负责分析采集数据的分析器节点
                </div>
              </Col>
            </Row>
          </div>
        </>
      )}

      {/* 第二步：采集配置 */}
      {currentStep === 1 && (
        <>
          <div className={styles.formSection}>
            <div className={styles.formSectionTitle}>
              <div className={styles.stepIndicator}>1</div>
              <LineChartOutlined />
              <span>资源规格配置</span>
              <div style={{ flex: 1 }} />
              <Tag color="blue" className={styles.featureTag}>必填</Tag>
            </div>
            <Row gutter={24}>
              <Col span={8} className={styles.formItem}>
                <ProFormDigit
                  name="cpuNum"
                  label={
                    <div className={styles.formLabel}>
                      <span>CPU核心数</span>
                      <span className={styles.requiredMark}>*</span>
                    </div>
                  }
                  placeholder="请输入CPU核心数"
                  min={1}
                  max={64}
                  fieldProps={{
                    size: 'large',
                    addonAfter: '核',
                  }}
                  rules={[{ required: true, message: '请输入CPU核心数' }]}
                />
                <div className={styles.tagContainer}>
                  <Space wrap>
                    <Tag 
                      className={styles.featureTag} 
                      color="blue"
                      style={{ cursor: 'pointer' }}
                      onClick={() => form.setFieldValue('cpuNum', 2)}
                    >
                      2核
                    </Tag>
                    <Tag 
                      className={styles.featureTag} 
                      color="blue"
                      style={{ cursor: 'pointer' }}
                      onClick={() => form.setFieldValue('cpuNum', 4)}
                    >
                      4核
                    </Tag>
                    <Tag 
                      className={styles.featureTag} 
                      color="blue"
                      style={{ cursor: 'pointer' }}
                      onClick={() => form.setFieldValue('cpuNum', 8)}
                    >
                      8核
                    </Tag>
                  </Space>
                </div>
              </Col>
              <Col span={8} className={styles.formItem}>
                <ProFormDigit
                  name="memorySize"
                  label={
                    <div className={styles.formLabel}>
                      <span>内存大小</span>
                      <span className={styles.requiredMark}>*</span>
                    </div>
                  }
                  placeholder="请输入内存大小"
                  min={1}
                  max={256}
                  fieldProps={{
                    size: 'large',
                    addonAfter: 'GB',
                  }}
                  rules={[{ required: true, message: '请输入内存大小' }]}
                />
                <div className={styles.tagContainer}>
                  <Space wrap>
                    <Tag 
                      className={styles.featureTag} 
                      color="green"
                      style={{ cursor: 'pointer' }}
                      onClick={() => form.setFieldValue('memorySize', 4)}
                    >
                      4GB
                    </Tag>
                    <Tag 
                      className={styles.featureTag} 
                      color="green"
                      style={{ cursor: 'pointer' }}
                      onClick={() => form.setFieldValue('memorySize', 8)}
                    >
                      8GB
                    </Tag>
                    <Tag 
                      className={styles.featureTag} 
                      color="green"
                      style={{ cursor: 'pointer' }}
                      onClick={() => form.setFieldValue('memorySize', 16)}
                    >
                      16GB
                    </Tag>
                  </Space>
                </div>
              </Col>
              <Col span={8} className={styles.formItem}>
                <ProFormDigit
                  name="storageSize"
                  label={
                    <div className={styles.formLabel}>
                      <span>存储空间</span>
                      <span className={styles.requiredMark}>*</span>
                    </div>
                  }
                  placeholder="请输入存储空间大小"
                  min={10}
                  max={2048}
                  fieldProps={{
                    size: 'large',
                    addonAfter: 'GB',
                  }}
                  rules={[{ required: true, message: '请输入存储空间大小' }]}
                />
                <div className={styles.tagContainer}>
                  <Space wrap>
                    <Tag 
                      className={styles.featureTag} 
                      color="orange"
                      style={{ cursor: 'pointer' }}
                      onClick={() => form.setFieldValue('storageSize', 50)}
                    >
                      50GB
                    </Tag>
                    <Tag 
                      className={styles.featureTag} 
                      color="orange"
                      style={{ cursor: 'pointer' }}
                      onClick={() => form.setFieldValue('storageSize', 100)}
                    >
                      100GB
                    </Tag>
                    <Tag 
                      className={styles.featureTag} 
                      color="orange"
                      style={{ cursor: 'pointer' }}
                      onClick={() => form.setFieldValue('storageSize', 200)}
                    >
                      200GB
                    </Tag>
                  </Space>
                </div>
              </Col>
            </Row>
          </div>

          <div className={styles.formSection}>
            <div className={styles.formSectionTitle}>
              <div className={styles.stepIndicator}>2</div>
              <EyeOutlined />
              <span>采集范围配置</span>
              <div style={{ flex: 1 }} />
              <Tag color="green" className={styles.featureTag}>可选</Tag>
            </div>
            <Row gutter={24}>
              <Col span={12} className={styles.formItem}>
                <ProFormSelect
                  name="networkInterface"
                  label={<div className={styles.formLabel}>网络接口</div>}
                  placeholder="请选择网络接口"
                  options={networkInterfaceOptions}
                  fieldProps={{
                    size: 'large',
                    onChange: handleInterfaceChange,
                  }}
                  initialValue="eth0"
                />
              </Col>
              <Col span={12} className={styles.formItem}>
                {customInterface ? (
                  <ProFormText
                    name="networkInterface"
                    label={<div className={styles.formLabel}>自定义网络接口</div>}
                    placeholder="请输入自定义网络接口名称"
                    fieldProps={{
                      size: 'large',
                    }}
                  />
                ) : (
                  <ProFormDigit
                    name="samplingRate"
                    label={<div className={styles.formLabel}>采样率</div>}
                    placeholder="请输入采样率"
                    min={1}
                    max={100}
                    fieldProps={{
                      size: 'large',
                      addonAfter: '%',
                    }}
                    initialValue={100}
                  />
                )}
              </Col>
            </Row>
            
            <Divider />
            
            <Row gutter={24}>
              <Col span={12} className={styles.formItem}>
                <ProFormTextArea
                  name="monitorPorts"
                  label={
                    <div className={styles.formLabel}>
                      <span>监控端口</span>
                      <Tooltip title="多个端口用逗号分隔，如：80,443,8080,9090">
                        <InfoCircleOutlined style={{ marginLeft: 4, color: '#999' }} />
                      </Tooltip>
                    </div>
                  }
                  placeholder="请输入监控端口，多个端口用逗号分隔，如：80,443,8080"
                  fieldProps={{
                    rows: 3,
                    size: 'large',
                  }}
                />
                <div className={styles.fieldHint}>
                  监控的端口列表，留空表示监控所有端口
                </div>
              </Col>
              <Col span={12} className={styles.formItem}>
                <ProFormTextArea
                  name="excludeIps"
                  label={
                    <div className={styles.formLabel}>
                      <span>排除IP地址</span>
                      <Tooltip title="多个IP用逗号分隔，如：192.168.1.100,10.0.0.1">
                        <InfoCircleOutlined style={{ marginLeft: 4, color: '#999' }} />
                      </Tooltip>
                    </div>
                  }
                  placeholder="请输入排除的IP地址，多个IP用逗号分隔"
                  fieldProps={{
                    rows: 3,
                    size: 'large',
                  }}
                />
                <div className={styles.fieldHint}>
                  不进行监控的IP地址列表，留空表示不排除任何IP
                </div>
              </Col>
            </Row>
          </div>
        </>
      )}

      {/* 第三步：高级配置 */}
      {currentStep === 2 && (
        <>
          <div className={styles.formSection}>
            <div className={styles.formSectionTitle}>
              <div className={styles.stepIndicator}>1</div>
              <SettingOutlined />
              <span>高级参数配置</span>
              <div style={{ flex: 1 }} />
              <Tag color="green" className={styles.featureTag}>可选</Tag>
            </div>
            <Row gutter={24}>
              <Col span={8} className={styles.formItem}>
                <ProFormDigit
                  name="logLevel"
                  label={
                    <div className={styles.formLabel}>
                      <span>日志级别</span>
                      <Tooltip title="1=DEBUG, 2=INFO, 3=WARN, 4=ERROR, 5=FATAL">
                        <InfoCircleOutlined style={{ marginLeft: 4, color: '#999' }} />
                      </Tooltip>
                    </div>
                  }
                  placeholder="请输入日志级别"
                  min={1}
                  max={5}
                  fieldProps={{
                    size: 'large',
                  }}
                  initialValue={3}
                />
                <div className={styles.tagContainer}>
                  <Space wrap>
                    <Tag 
                      className={styles.featureTag} 
                      color="volcano"
                      style={{ cursor: 'pointer' }}
                      onClick={() => form.setFieldValue('logLevel', 1)}
                    >
                      DEBUG
                    </Tag>
                    <Tag 
                      className={styles.featureTag} 
                      color="blue"
                      style={{ cursor: 'pointer' }}
                      onClick={() => form.setFieldValue('logLevel', 3)}
                    >
                      WARN
                    </Tag>
                    <Tag 
                      className={styles.featureTag} 
                      color="red"
                      style={{ cursor: 'pointer' }}
                      onClick={() => form.setFieldValue('logLevel', 5)}
                    >
                      FATAL
                    </Tag>
                  </Space>
                </div>
              </Col>
              <Col span={8} className={styles.formItem}>
                <ProFormDigit
                  name="dataRetention"
                  label={<div className={styles.formLabel}>数据保留天数</div>}
                  placeholder="请输入数据保留天数"
                  min={1}
                  max={365}
                  fieldProps={{
                    size: 'large',
                    addonAfter: '天',
                  }}
                  initialValue={30}
                />
                <div className={styles.fieldHint}>
                  采集数据在本地保留的天数
                </div>
              </Col>
              <Col span={8} className={styles.formItem}>
                <ProFormDigit
                  name="flushInterval"
                  label={<div className={styles.formLabel}>数据刷新间隔</div>}
                  placeholder="请输入数据刷新间隔"
                  min={1}
                  max={60}
                  fieldProps={{
                    size: 'large',
                    addonAfter: '秒',
                  }}
                  initialValue={5}
                />
                <div className={styles.fieldHint}>
                  数据刷新到存储的时间间隔
                </div>
              </Col>
            </Row>
            
            <Divider />
            
            <Row gutter={24}>
              <Col span={12} className={styles.formItem}>
                <ProFormSwitch
                  name="enableEncryption"
                  label={
                    <div className={styles.formLabel}>
                      <SecurityScanOutlined />
                      <span style={{ marginLeft: 8 }}>启用数据加密</span>
                    </div>
                  }
                  initialValue={true}
                  fieldProps={{
                    size: 'large',
                  }}
                />
                <div className={styles.fieldHint}>
                  启用后，采集的数据在传输和存储时会进行加密
                </div>
              </Col>
              <Col span={12} className={styles.formItem}>
                <ProFormSwitch
                  name="enableCompression"
                  label={
                    <div className={styles.formLabel}>
                      <DatabaseOutlined />
                      <span style={{ marginLeft: 8 }}>启用数据压缩</span>
                    </div>
                  }
                  initialValue={true}
                  fieldProps={{
                    size: 'large',
                  }}
                />
                <div className={styles.fieldHint}>
                  启用后，采集的数据在传输时会进行压缩
                </div>
              </Col>
            </Row>
          </div>

          <div className={styles.formSection}>
            <div className={styles.formSectionTitle}>
              <div className={styles.stepIndicator}>2</div>
              <InfoCircleOutlined />
              <span>备注信息</span>
              <div style={{ flex: 1 }} />
              <Tag color="green" className={styles.featureTag}>可选</Tag>
            </div>
            <ProFormTextArea
              name="description"
              label={<div className={styles.formLabel}>采集器描述</div>}
              placeholder="请输入采集器的描述信息，可选填"
              fieldProps={{
                rows: 4,
                showCount: true,
                maxLength: 500,
                size: 'large',
              }}
            />
            <div className={styles.fieldHint}>
              描述采集器的用途、部署位置等信息，方便后续管理
            </div>
          </div>

          <Alert
            message="注册说明"
            description={
              <Space direction="vertical" size={8}>
                <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                  <div style={{ 
                    width: 20, 
                    height: 20, 
                    borderRadius: '50%', 
                    background: '#1890ff', 
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 12,
                    marginRight: 8,
                    flexShrink: 0
                  }}>1</div>
                  <div>采集器注册后默认为停止状态，需要手动启动</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                  <div style={{ 
                    width: 20, 
                    height: 20, 
                    borderRadius: '50%', 
                    background: '#1890ff', 
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 12,
                    marginRight: 8,
                    flexShrink: 0
                  }}>2</div>
                  <div>请确保服务器网络连接正常，控制节点可达</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                  <div style={{ 
                    width: 20, 
                    height: 20, 
                    borderRadius: '50%', 
                    background: '#1890ff', 
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 12,
                    marginRight: 8,
                    flexShrink: 0
                  }}>3</div>
                  <div>建议在非高峰时段进行采集器配置和启动</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                  <div style={{ 
                    width: 20, 
                    height: 20, 
                    borderRadius: '50%', 
                    background: '#1890ff', 
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 12,
                    marginRight: 8,
                    flexShrink: 0
                  }}>4</div>
                  <div>配置完成后，可以在列表中启用采集器</div>
                </div>
              </Space>
            }
            type="info"
            showIcon
            style={{ 
              marginTop: 16,
              borderRadius: 8,
              border: '1px solid #91d5ff',
              background: '#e6f7ff',
            }}
          />
        </>
      )}
    </ProForm>
  );
};

export default CollectorRegisterForm;