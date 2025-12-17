import { Footer } from '@/components';
import { getFakeCaptcha } from '@/services/ant-design-pro/login';
import {
  AlipayCircleOutlined,
  LockOutlined,
  MobileOutlined,
  UserOutlined,
  WeiboCircleOutlined,
  TaobaoCircleOutlined,
  MailOutlined,
} from '@ant-design/icons';
import {
  LoginForm,
  ProForm,
  ProFormText,
  ProFormCheckbox,
} from '@ant-design/pro-components';
import { FormattedMessage, history, SelectLang, useIntl, useModel, Helmet } from '@umijs/max';
import { Alert, message, Tabs, Modal, Button, Row, Col, Spin } from 'antd';
import Settings from '../../../../config/defaultSettings';
import React, { useState } from 'react';
import { flushSync } from 'react-dom';
import { createStyles } from 'antd-style';
import { register, login } from '../../../services/server.js';

// 导入加密函数
import { sha256Encrypt } from '@/utils/encryption';

const useStyles = createStyles(({ token }) => {
  return {
    action: {
      marginLeft: '8px',
      color: 'rgba(255, 255, 255, 0.6)',
      fontSize: '24px',
      verticalAlign: 'middle',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      '&:hover': {
        color: '#ffffff',
        transform: 'translateY(-2px)',
      },
    },
    lang: {
      width: 42,
      height: 42,
      lineHeight: '42px',
      position: 'fixed',
      right: 16,
      borderRadius: token.borderRadius,
      ':hover': {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
      },
    },
    container: {
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      overflow: 'auto',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
      backgroundSize: '400% 400%',
      animation: 'gradientShift 15s ease infinite',
      position: 'relative',
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.3)',
        zIndex: 0,
      },
    },
    // 全局加载遮罩层样式
    loadingOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      borderRadius: '8px',
      backdropFilter: 'blur(10px)',
    },
    // 登录卡片容器
    loginContent: {
      position: 'relative',
      zIndex: 1,
      flex: 1,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '32px 24px',
    },
    // 玻璃态登录卡片
    glassCard: {
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(20px)',
      border: '1px solid rgba(255, 255, 255, 0.3)',
      borderRadius: '24px',
      boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.2)',
      padding: '48px 40px',
      maxWidth: '440px',
      width: '100%',
      animation: 'fadeInUp 0.8s ease-out',
      position: 'relative',
      overflow: 'hidden',
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '4px',
        background: 'linear-gradient(90deg, #667eea, #764ba2, #f093fb)',
      },
    },
    // 登录按钮样式
    loginBtn: {
      width: '100%',
      height: '48px',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      border: 'none',
      borderRadius: '12px',
      fontSize: '16px',
      fontWeight: '600',
      transition: 'all 0.3s ease',
      boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)',
      '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: '0 8px 25px rgba(102, 126, 234, 0.4)',
        background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
      },
      '&:active': {
        transform: 'translateY(0)',
      },
    },
    // 注册按钮样式
    registerBtn: {
      height: '48px',
      marginLeft: '12px',
      background: 'rgba(255, 255, 255, 0.9)',
      border: '2px solid rgba(102, 126, 234, 0.3)',
      color: '#667eea',
      borderRadius: '12px',
      fontWeight: '600',
      transition: 'all 0.3s ease',
      backdropFilter: 'blur(10px)',
      '&:hover': {
        background: 'rgba(102, 126, 234, 0.1)',
        borderColor: '#667eea',
        color: '#5a6fd8',
        transform: 'translateY(-1px)',
        boxShadow: '0 4px 12px rgba(102, 126, 234, 0.2)',
      },
      '&:disabled': {
        background: 'rgba(255, 255, 255, 0.5)',
        borderColor: 'rgba(0, 0, 0, 0.1)',
        color: 'rgba(0, 0, 0, 0.3)',
        cursor: 'not-allowed',
        transform: 'none',
        boxShadow: 'none',
      },
    },
    // 按钮行容器
    buttonRow: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      position: 'relative',
      marginTop: '8px',
    },
    // 禁用状态的表单容器
    formDisabled: {
      pointerEvents: 'none',
      opacity: 0.7,
      transition: 'all 0.3s ease',
      filter: 'blur(1px)',
    },
    // 标题样式
    title: {
      textAlign: 'center',
      marginBottom: '8px',
      background: 'linear-gradient(135deg, #667eea, #764ba2)',
      backgroundClip: 'text',
      WebkitBackgroundClip: 'text',
      color: 'transparent',
      fontSize: '32px',
      fontWeight: '700',
    },
    // 副标题样式
    subtitle: {
      textAlign: 'center',
      color: 'rgba(0, 0, 0, 0.6)',
      marginBottom: '32px',
      fontSize: '14px',
    },
    // 输入框样式
    inputField: {
      borderRadius: '12px',
      border: '2px solid rgba(0, 0, 0, 0.1)',
      transition: 'all 0.3s ease',
      padding: '16px',
      fontSize: '15px',
      background: 'rgba(255, 255, 255, 0.8)',
      '&:focus': {
        borderColor: '#667eea',
        boxShadow: '0 0 0 3px rgba(102, 126, 234, 0.1)',
        background: 'rgba(255, 255, 255, 0.95)',
        transform: 'translateY(-1px)',
      },
      '&:hover': {
        borderColor: 'rgba(102, 126, 234, 0.5)',
      },
      '&:disabled': {
        background: 'rgba(255, 255, 255, 0.5)',
        borderColor: 'rgba(0, 0, 0, 0.05)',
        cursor: 'not-allowed',
      },
    },
    // 标签页样式
    tabs: {
      '& .ant-tabs-tab': {
        padding: '12px 24px',
        fontSize: '15px',
        fontWeight: '500',
        transition: 'all 0.3s ease',
        '&:hover': {
          color: '#667eea',
        },
      },
      '& .ant-tabs-tab-active': {
        color: '#667eea',
        fontWeight: '600',
      },
      '& .ant-tabs-ink-bar': {
        background: 'linear-gradient(90deg, #667eea, #764ba2)',
        height: '3px',
        borderRadius: '2px',
      },
    },
    // 注册弹窗高级样式
    registerModal: {
      '&.ant-modal': {
        zIndex: 1001,
      },
      '& .ant-modal-content': {
        borderRadius: '24px',
        boxShadow: '0 32px 64px rgba(0, 0, 0, 0.2)',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #ffffff 100%)',
        border: '1px solid rgba(255, 255, 255, 0.3)',
        position: 'relative',
      },
      '& .ant-modal-header': {
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderBottom: 'none',
        padding: '32px',
        margin: 0,
        position: 'relative',
        zIndex: 10,
      },
      '& .ant-modal-title': {
        color: 'white',
        fontSize: '28px',
        fontWeight: '700',
        textAlign: 'center',
        textShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
      },
      '& .ant-modal-close': {
        position: 'absolute',
        top: '20px',
        right: '20px',
        width: '44px',
        height: '44px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        borderRadius: '12px',
        zIndex: 1003,
        border: '2px solid rgba(255, 255, 255, 0.3)',
        background: 'rgba(255, 255, 255, 0.15)',
        backdropFilter: 'blur(10px)',
        transition: 'all 0.3s ease',
        '&:hover': {
          color: 'white',
          background: 'rgba(255, 255, 255, 0.25)',
          borderColor: 'rgba(255, 255, 255, 0.5)',
          transform: 'scale(1.1) rotate(90deg)',
        },
        '& .ant-modal-close-x': {
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '20px',
          fontWeight: 'bold',
          lineHeight: 1,
        }
      },
      '& .ant-form-item-label > label': {
        fontWeight: '600',
        color: token.colorTextHeading,
        fontSize: '14px',
        marginBottom: '8px',
      },
      '& .ant-input, & .ant-input-password': {
        borderRadius: '12px',
        border: '2px solid rgba(0, 0, 0, 0.1)',
        transition: 'all 0.3s ease',
        padding: '16px',
        fontSize: '15px',
        background: 'rgba(255, 255, 255, 0.8)',
        '&:focus': {
          borderColor: '#667eea',
          boxShadow: '0 0 0 3px rgba(102, 126, 234, 0.1)',
          transform: 'translateY(-1px)',
        },
        '&:hover': {
          borderColor: 'rgba(102, 126, 234, 0.5)',
        },
        '&:disabled': {
          background: 'rgba(255, 255, 255, 0.5)',
          borderColor: 'rgba(0, 0, 0, 0.05)',
          cursor: 'not-allowed',
        },
      },
      '& .ant-btn-primary': {
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        border: 'none',
        borderRadius: '12px',
        height: '48px',
        fontSize: '16px',
        fontWeight: '600',
        transition: 'all 0.3s ease',
        boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 8px 25px rgba(102, 126, 234, 0.4)',
          background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
        },
        '&:active': {
          transform: 'translateY(0)',
        },
        '&:disabled': {
          background: 'rgba(0, 0, 0, 0.1)',
          borderColor: 'rgba(0, 0, 0, 0.1)',
          color: 'rgba(0, 0, 0, 0.3)',
          cursor: 'not-allowed',
          transform: 'none',
          boxShadow: 'none',
        },
      },
    },
    // 动画定义
    '@global': {
      '@keyframes gradientShift': {
        '0%': { backgroundPosition: '0% 50%' },
        '50%': { backgroundPosition: '100% 50%' },
        '100%': { backgroundPosition: '0% 50%' },
      },
      '@keyframes fadeInUp': {
        '0%': { 
          opacity: 0,
          transform: 'translateY(30px) scale(0.95)',
        },
        '100%': { 
          opacity: 1,
          transform: 'translateY(0) scale(1)',
        },
      },
    },
  };
});

const ActionIcons = () => {
  const { styles } = useStyles();

  return (
    <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '16px' }}>
      <AlipayCircleOutlined key="AlipayCircleOutlined" className={styles.action} />
      <TaobaoCircleOutlined key="TaobaoCircleOutlined" className={styles.action} />
      <WeiboCircleOutlined key="WeiboCircleOutlined" className={styles.action} />
    </div>
  );
};

const Lang = () => {
  const { styles } = useStyles();

  return (
    <div className={styles.lang} data-lang>
      {SelectLang && <SelectLang />}
    </div>
  );
};

const LoginMessage: React.FC<{
  content: string;
}> = ({ content }) => {
  return (
    <Alert
      style={{
        marginBottom: 24,
        borderRadius: '12px',
        border: '1px solid #ffccc7',
      }}
      message={content}
      type="error"
      showIcon
    />
  );
};

// 优化后的注册弹窗组件
const RegisterModal: React.FC<{
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
  loginLoading?: boolean;
}> = ({ visible, onCancel, onSuccess, loginLoading = false }) => {
  const intl = useIntl();
  const { styles } = useStyles();
  const [form] = ProForm.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values: any) => {
    if (loginLoading) return;

    try {
      setLoading(true);
      console.log('原始注册数据:', values);
      
      const encryptedPassword = await sha256Encrypt(values.password);
      const encryptedData = {
        ...values,
        password: encryptedPassword,
      };
      
      console.log('加密后的注册数据:', { 
        ...encryptedData, 
        password: '***已加密***' 
      });
      
      if (!register) {
        console.error('register函数未定义');
        message.error('注册功能暂不可用');
        return;
      }
      
      const msg = await register(encryptedData);
      console.log('注册响应:', msg);
      
      message.success('注册成功');
      onSuccess();
      form.resetFields();
    } catch (error) {
      console.error('注册错误:', error);
      message.error('注册失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="用户注册"
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={520}
      className={styles.registerModal}
      styles={{
        body: { 
          padding: '32px 40px',
          maxHeight: '70vh',
          overflowY: 'auto',
        }
      }}
      centered
      destroyOnClose
      zIndex={1001}
      maskClosable={!loginLoading}
      keyboard={!loginLoading}
      closable={!loginLoading}
    >
      {loginLoading && (
        <div className={styles.loadingOverlay}>
          <Spin size="large" tip="登录处理中，请稍候..." />
        </div>
      )}
      
      <ProForm
        form={form}
        onFinish={handleSubmit}
        submitter={{
          searchConfig: {
            submitText: '立即注册',
            resetText: '重置',
          },
          render: (props, doms) => [
            <Button
              key="submit"
              type="primary"
              loading={loading || loginLoading}
              disabled={loginLoading}
              onClick={() => props.form?.submit?.()}
              style={{
                width: '100%',
                height: '48px',
                fontSize: '16px',
                fontWeight: '600',
                borderRadius: '12px',
              }}
            >
              立即注册
            </Button>,
            <Button
              key="reset"
              style={{
                width: '100%',
                height: '44px',
                marginTop: '12px',
                border: '2px solid rgba(0, 0, 0, 0.1)',
                borderRadius: '12px',
              }}
              disabled={loginLoading}
              onClick={() => props.form?.resetFields?.()}
            >
              重置
            </Button>,
          ],
        }}
      >
        <ProFormText
          name="username"
          label="用户名"
          placeholder="请输入用户名（2-16个字符）"
          fieldProps={{
            size: 'large',
            className: styles.inputField,
            disabled: loginLoading,
          }}
          rules={[
            {
              required: true,
              message: '用户名不能为空!',
            },
            {
              min: 2,
              max: 16,
              message: '用户名长度2-16个字符!',
            },
          ]}
        />
        
        <ProFormText.Password
          name="password"
          label="密码"
          placeholder="请输入密码（6-20个字符）"
          fieldProps={{
            size: 'large',
            className: styles.inputField,
            autoComplete: 'new-password',
            disabled: loginLoading,
          }}
          rules={[
            {
              required: true,
              message: '密码不能为空!',
            },
            {
              min: 6,
              max: 20,
              message: '密码长度6-20个字符!',
            },
          ]}
        />
        
        <ProFormText
          name="phone"
          label="手机号"
          placeholder="请输入手机号"
          fieldProps={{
            size: 'large',
            className: styles.inputField,
            disabled: loginLoading,
          }}
          rules={[
            {
              required: true,
              message: '手机号不能为空!',
            },
            {
              pattern: /^1[3-9]\d{9}$/,
              message: '请输入正确的手机号码!',
            },
          ]}
        />
        
        <ProFormText
          name="email"
          label="邮箱"
          placeholder="请输入邮箱地址"
          fieldProps={{
            size: 'large',
            className: styles.inputField,
            disabled: loginLoading,
          }}
          rules={[
            {
              required: true,
              message: '邮箱不能为空!',
            },
            {
              type: 'email',
              message: '请输入有效的邮箱地址!',
            },
          ]}
        />
        
        <ProFormText
          name="note"
          label="备注信息"
          placeholder="请输入备注信息（可选）"
          fieldProps={{
            size: 'large',
            className: styles.inputField,
            disabled: loginLoading,
          }}
        />
      </ProForm>
    </Modal>
  );
};

const Login: React.FC = () => {
  const [userLoginState, setUserLoginState] = useState<API.LoginResult>({});
  const [type, setType] = useState<string>('account');
  const { initialState, setInitialState } = useModel('@@initialState');
  const { styles } = useStyles();
  const intl = useIntl();
  const [registerModalVisible, setRegisterModalVisible] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);

  const fetchUserInfo = async () => {
    const userInfo = await initialState?.fetchUserInfo?.();
    if (userInfo) {
      flushSync(() => {
        setInitialState((s) => ({
          ...s,
          currentUser: userInfo,
        }));
      });
    }
  };

  const storeAuthData = (username: string, token: string) => {
    try {
      localStorage.setItem('auth_token', token);
      localStorage.setItem('username', username);
      localStorage.setItem('login_time', new Date().toISOString());
      
      console.log('用户认证信息已存储到本地缓存');
      console.log('用户名:', username);
      console.log('Token已存储（长度）:', token.length);
    } catch (error) {
      console.error('存储认证信息到本地缓存失败:', error);
      message.error('存储登录信息失败');
    }
  };

  const handleSubmit = async (values: API.LoginParams) => {
    try {
      setLoginLoading(true);
      console.log('原始登录数据:', values);
      
      const encryptedPassword = await sha256Encrypt(values.password || '');
      const encryptedData = {
        password: encryptedPassword,
        username: values.username,
      };
      
      console.log('加密后的登录数据:', { 
        ...encryptedData, 
        password: '***已加密***' 
      });
      
      const msg = await login(encryptedData);
      console.log('登录响应:', msg);
      
      if (msg.message === 'success') {
        const defaultLoginSuccessMessage = intl.formatMessage({
          id: 'pages.login.success',
          defaultMessage: '登录成功！',
        });
        message.success(defaultLoginSuccessMessage);
        
        if (msg.data && msg.data.token) {
          storeAuthData(values.username, msg.data.token);
        } else {
          console.warn('登录响应中未找到token数据');
          message.warning('登录成功，但token信息不完整');
        }
        
        await fetchUserInfo();
        const urlParams = new URL(window.location.href).searchParams;
        history.push(urlParams.get('redirect') || '/');
        return;
      }
      
      console.log(msg);
      setUserLoginState(msg);
    } catch (error) {
      const defaultLoginFailureMessage = intl.formatMessage({
        id: 'pages.login.failure',
        defaultMessage: '登录失败，请重试！',
      });
      console.log('登录错误:', error);
      message.error(defaultLoginFailureMessage);
    } finally {
      setLoginLoading(false);
    }
  };

  const { status, type: loginType } = userLoginState;

  return (
    <div className={styles.container}>
      <Helmet>
        <title>
          {intl.formatMessage({
            id: 'menu.login',
            defaultMessage: '登录页',
          })}
          - {Settings.title}
        </title>
      </Helmet>
      <Lang />
      
      {loginLoading && (
        <div className={styles.loadingOverlay}>
          <Spin size="large" tip="登录中，请稍候..." />
        </div>
      )}
      
      <div className={styles.loginContent}>
        <div className={styles.glassCard}>
          <LoginForm
            contentStyle={{
              minWidth: 280,
              maxWidth: '100%',
            }}
            logo={<img alt="logo" src="/logo.svg" style={{ height: '48px', marginBottom: '8px' }} />}
            title={<div className={styles.title}>网络设施防范</div>}
            // subTitle={<div className={styles.subtitle}>安全登录，守护您的数字资产</div>}
            initialValues={{
              autoLogin: true,
            }}
            actions={[
              <FormattedMessage
                key="loginWith"
                id="pages.login.loginWith"
                defaultMessage="其他登录方式"
              />,
              <ActionIcons key="icons" />,
            ]}
            onFinish={async (values) => {
              await handleSubmit(values as API.LoginParams);
            }}
            submitter={{
              render: (props, dom) => (
                <div className={styles.buttonRow}>
                  <Button
                    type="primary"
                    htmlType="submit"
                    className={styles.loginBtn}
                    onClick={() => props.form?.submit()}
                    disabled={props.disabled || loginLoading}
                    loading={loginLoading}
                    style={{ flex: 2 }}
                  >
                    {loginLoading ? '登录中...' : intl.formatMessage({ id: 'pages.login.login', defaultMessage: '登录' })}
                  </Button>
                  <Button
                    className={styles.registerBtn}
                    onClick={() => !loginLoading && setRegisterModalVisible(true)}
                    disabled={loginLoading}
                    style={{ flex: 1 }}
                  >
                    {intl.formatMessage({ id: 'pages.register.register', defaultMessage: '注册账号' })}
                  </Button>
                </div>
              ),
            }}
          >
            <Tabs
              activeKey={type}
              onChange={(key) => !loginLoading && setType(key)}
              centered
              className={styles.tabs}
              items={[
                {
                  key: 'account',
                  label: intl.formatMessage({
                    id: 'pages.login.accountLogin.tab',
                    defaultMessage: '账户密码登录',
                  }),
                },
              ]}
            />

            {status === 'error' && loginType === 'account' && (
              <LoginMessage
                content={intl.formatMessage({
                  id: 'pages.login.accountLogin.errorMessage',
                  defaultMessage: '账户或密码错误',
                })}
              />
            )}
            
            {type === 'account' && (
              <>
                <ProFormText
                  name="username"
                  fieldProps={{
                    size: 'large',
                    prefix: <UserOutlined style={{ color: 'rgba(0, 0, 0, 0.4)' }} />,
                    className: styles.inputField,
                    disabled: loginLoading,
                  }}
                  placeholder={intl.formatMessage({
                    id: 'pages.login.username.placeholder',
                    defaultMessage: '请输入用户名',
                  })}
                  rules={[
                    {
                      required: true,
                      message: (
                        <FormattedMessage
                          id="pages.login.username.required"
                          defaultMessage="请输入用户名!"
                        />
                      ),
                    },
                  ]}
                />
                <ProFormText.Password
                  name="password"
                  fieldProps={{
                    size: 'large',
                    prefix: <LockOutlined style={{ color: 'rgba(0, 0, 0, 0.4)' }} />,
                    autoComplete: 'current-password',
                    className: styles.inputField,
                    disabled: loginLoading,
                  }}
                  placeholder={intl.formatMessage({
                    id: 'pages.login.password.placeholder',
                    defaultMessage: '请输入密码',
                  })}
                  rules={[
                    {
                      required: true,
                      message: (
                        <FormattedMessage
                          id="pages.login.password.required"
                          defaultMessage="请输入密码！"
                        />
                      ),
                    },
                  ]}
                />
              </>
            )}

            <div
              style={{
                marginBottom: 24,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <ProFormCheckbox 
                noStyle 
                name="autoLogin"
                fieldProps={{
                  disabled: loginLoading,
                }}
              >
                <FormattedMessage id="pages.login.rememberMe" defaultMessage="自动登录" />
              </ProFormCheckbox>
              <a
                style={{
                  color: '#667eea',
                  fontWeight: '500',
                  textDecoration: 'none',
                  transition: 'all 0.3s ease',
                }}
                onClick={(e) => {
                  if (loginLoading) {
                    e.preventDefault();
                  }
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.textDecoration = 'underline';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.textDecoration = 'none';
                }}
              >
                <FormattedMessage id="pages.login.forgotPassword" defaultMessage="忘记密码" />
              </a>
            </div>
          </LoginForm>
        </div>
      </div>
      <Footer />

      <RegisterModal
        visible={registerModalVisible}
        onCancel={() => !loginLoading && setRegisterModalVisible(false)}
        onSuccess={() => {
          setRegisterModalVisible(false);
          message.success('注册成功，请登录');
        }}
        loginLoading={loginLoading}
      />
    </div>
  );
};

export default Login;