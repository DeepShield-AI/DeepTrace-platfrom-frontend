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
      color: 'rgba(0, 0, 0, 0.2)',
      fontSize: '24px',
      verticalAlign: 'middle',
      cursor: 'pointer',
      transition: 'color 0.3s',
      '&:hover': {
        color: token.colorPrimaryActive,
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
        backgroundColor: token.colorBgTextHover,
      },
    },
    container: {
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      overflow: 'auto',
      backgroundImage:
        "url('https://mdn.alipayobjects.com/yuyan_qk0oxh/afts/img/V-_oS6r-i7wAAAAAAAAAAAAAFl94AQBr')",
      backgroundSize: '100% 100%',
      position: 'relative',
    },
    // 全局遮罩层样式
    loadingOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(255, 255, 255, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      borderRadius: '8px',
    },
    // 登录按钮样式
    loginBtn: {
      width: '100%',
      height: '40px',
    },
    // 注册按钮样式 - 浅色、较短
    registerBtn: {
      height: '40px',
      marginLeft: '12px',
      backgroundColor: token.colorBgContainer,
      borderColor: token.colorBorder,
      color: token.colorText,
      '&:hover': {
        backgroundColor: token.colorBgTextHover,
        borderColor: token.colorBorderHover,
        color: token.colorTextHover,
      },
      '&:disabled': {
        backgroundColor: token.colorBgContainerDisabled,
        borderColor: token.colorBorder,
        color: token.colorTextDisabled,
        cursor: 'not-allowed',
      },
    },
    // 按钮行容器
    buttonRow: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      position: 'relative',
    },
    // 禁用状态的表单容器
    formDisabled: {
      pointerEvents: 'none',
      opacity: 0.6,
      transition: 'all 0.3s ease',
    },
    // 注册弹窗高级样式
    registerModal: {
      '&.ant-modal': {
        zIndex: 1001,
      },
      '& .ant-modal-content': {
        borderRadius: '16px',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.2)',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #ffffff 100%)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        position: 'relative',
      },
      '& .ant-modal-header': {
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderBottom: 'none',
        padding: '24px 32px',
        margin: 0,
        position: 'relative',
        zIndex: 10,
      },
      '& .ant-modal-title': {
        color: 'white',
        fontSize: '24px',
        fontWeight: '600',
        textAlign: 'center',
        textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
      },
      '& .ant-modal-close': {
        position: 'absolute',
        top: '16px',
        right: '16px',
        width: '44px',
        height: '44px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        borderRadius: '6px',
        zIndex: 1003,
        border: '2px solid rgba(255, 255, 255, 0.3)',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
        transition: 'all 0.3s ease',
        '&:hover': {
          color: 'white',
          backgroundColor: 'rgba(255, 255, 255, 0.2)',
          borderColor: 'rgba(255, 255, 255, 0.5)',
          transform: 'scale(1.1)',
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
        fontWeight: '500',
        color: token.colorTextHeading,
        fontSize: '14px',
      },
      '& .ant-input, & .ant-input-password': {
        borderRadius: '8px',
        border: `1px solid ${token.colorBorder}`,
        transition: 'all 0.3s ease',
        padding: '12px 16px',
        fontSize: '14px',
        '&:focus': {
          borderColor: token.colorPrimary,
          boxShadow: `0 0 0 3px ${token.colorPrimary}33`,
          transform: 'translateY(-1px)',
        },
        '&:hover': {
          borderColor: token.colorPrimaryHover,
        },
        '&:disabled': {
          backgroundColor: token.colorBgContainerDisabled,
          borderColor: token.colorBorder,
          cursor: 'not-allowed',
        },
      },
      '& .ant-btn-primary': {
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        border: 'none',
        borderRadius: '8px',
        height: '44px',
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
          background: token.colorBgContainerDisabled,
          borderColor: token.colorBorder,
          color: token.colorTextDisabled,
          cursor: 'not-allowed',
          transform: 'none',
          boxShadow: 'none',
        },
      },
    },
  };
});

const ActionIcons = () => {
  const { styles } = useStyles();

  return (
    <>
      <AlipayCircleOutlined key="AlipayCircleOutlined" className={styles.action} />
      <TaobaoCircleOutlined key="TaobaoCircleOutlined" className={styles.action} />
      <WeiboCircleOutlined key="WeiboCircleOutlined" className={styles.action} />
    </>
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
      }}
      message={content}
      type="error"
      showIcon
    />
  );
};

// 优化后的注册弹窗组件 - 增加登录状态禁用
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
    if (loginLoading) return; // 如果登录中，阻止注册操作[1](@ref)

    try {
      setLoading(true);
      console.log('原始注册数据:', values);
      
      // 对密码进行SHA-256加密
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
          background: 'white',
        }
      }}
      centered
      destroyOnClose
      zIndex={1001}
      maskClosable={!loginLoading} // 登录中时防止点击蒙层关闭[1](@ref)
      keyboard={!loginLoading} // 登录中时禁用ESC键关闭
      closable={!loginLoading} // 登录中时禁用关闭按钮
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
          submitButtonProps: {
            style: {
              width: '100%',
              height: '44px',
              fontSize: '16px',
              marginTop: '8px',
            },
            loading: loading || loginLoading, // 合并登录和注册的加载状态[1](@ref)
            disabled: loginLoading, // 登录中时禁用注册按钮
          },
          resetButtonProps: {
            style: {
              width: '100%',
              height: '40px',
              marginTop: '12px',
              border: `1px solid #d9d9d9`,
            },
            disabled: loginLoading, // 登录中时禁用重置按钮
          }
        }}
      >
        <ProFormText
          name="username"
          label="用户名"
          placeholder="请输入用户名"
          fieldProps={{
            size: 'large',
            disabled: loginLoading, // 登录中时禁用输入[1](@ref)
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
          placeholder="请输入密码"
          fieldProps={{
            size: 'large',
            autoComplete: 'new-password',
            disabled: loginLoading, // 登录中时禁用输入
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
            disabled: loginLoading, // 登录中时禁用输入
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
            disabled: loginLoading, // 登录中时禁用输入
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
            disabled: loginLoading, // 登录中时禁用输入
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

  // 存储token和用户信息到本地缓存的函数
  const storeAuthData = (username: string, token: string) => {
    try {
      // 使用localStorage持久化存储
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
      setLoginLoading(true); // 开始加载，禁用所有操作[1](@ref)
      console.log('原始登录数据:', values);
      
      // 对密码进行SHA-256加密
      const encryptedPassword = await sha256Encrypt(values.password || '');
      
      // 创建加密后的登录数据
      const encryptedData = {
        password: encryptedPassword,
        username: values.username,
      };
      
      console.log('加密后的登录数据:', { 
        ...encryptedData, 
        password: '***已加密***' 
      });
      
      // 发送登录请求
      const msg = await login(encryptedData);
      console.log('登录响应:', msg);
      
      if (msg.message === 'success') {
        const defaultLoginSuccessMessage = intl.formatMessage({
          id: 'pages.login.success',
          defaultMessage: '登录成功！',
        });
        message.success(defaultLoginSuccessMessage);
        
        // 存储用户名和token到本地缓存
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
      // 登录失败处理
      setUserLoginState(msg);
    } catch (error) {
      const defaultLoginFailureMessage = intl.formatMessage({
        id: 'pages.login.failure',
        defaultMessage: '登录失败，请重试！',
      });
      console.log('登录错误:', error);
      message.error(defaultLoginFailureMessage);
    } finally {
      setLoginLoading(false); // 结束加载，恢复操作[1](@ref)
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
      
      {/* 全局加载遮罩 */}
      {loginLoading && (
        <div className={styles.loadingOverlay}>
          <Spin size="large" tip="登录中，请稍候..." />
        </div>
      )}
      
      <div
        style={{
          flex: '1',
          padding: '32px 0',
          position: 'relative',
        }}
        className={loginLoading ? styles.formDisabled : ''} // 登录中时禁用表单操作[1](@ref)
      >
        <LoginForm
          contentStyle={{
            minWidth: 280,
            maxWidth: '75vw',
          }}
          logo={<img alt="logo" src="/logo.svg" />}
          title="网络设施防范"
          subTitle={intl.formatMessage({ id: 'pages.layouts.userLayout.title' })}
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
                  disabled={loginLoading} // 登录中时禁用注册按钮[1](@ref)
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
            onChange={(key) => !loginLoading && setType(key)} // 登录中时禁用标签切换[1](@ref)
            centered
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
                  prefix: <UserOutlined />,
                  disabled: loginLoading, // 登录中时禁用输入[1](@ref)
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
                  prefix: <LockOutlined />,
                  autoComplete: 'current-password',
                  disabled: loginLoading, // 登录中时禁用输入[1](@ref)
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
            }}
          >
            <ProFormCheckbox 
              noStyle 
              name="autoLogin"
              fieldProps={{
                disabled: loginLoading, // 登录中时禁用复选框[1](@ref)
              }}
            >
              <FormattedMessage id="pages.login.rememberMe" defaultMessage="自动登录" />
            </ProFormCheckbox>
            <a
              style={{
                float: 'right',
              }}
              onClick={(e) => {
                if (loginLoading) {
                  e.preventDefault(); // 登录中时阻止忘记密码操作[1](@ref)
                }
              }}
            >
              <FormattedMessage id="pages.login.forgotPassword" defaultMessage="忘记密码" />
            </a>
          </div>
        </LoginForm>
      </div>
      <Footer />

      <RegisterModal
        visible={registerModalVisible}
        onCancel={() => !loginLoading && setRegisterModalVisible(false)}
        onSuccess={() => {
          setRegisterModalVisible(false);
          message.success('注册成功，请登录');
        }}
        loginLoading={loginLoading} // 传递登录状态到注册弹窗[1](@ref)
      />
    </div>
  );
};

export default Login;