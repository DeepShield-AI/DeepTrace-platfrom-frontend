import { Footer, Question, SelectLang, AvatarDropdown, AvatarName } from '@/components';
import { LinkOutlined } from '@ant-design/icons';
import type { Settings as LayoutSettings } from '@ant-design/pro-components';
import { SettingDrawer } from '@ant-design/pro-components';
import type { RunTimeLayoutConfig } from '@umijs/max';
import { history, Link } from '@umijs/max';
import defaultSettings from '../config/defaultSettings';
import { errorConfig } from './requestErrorConfig';
// import { currentUser as queryCurrentUser } from '@/services/ant-design-pro/api';
import React from 'react';
import { queryCurrentUser } from "./services/server.js"

const isDev = process.env.NODE_ENV === 'development';
const loginPath = '/user/login';
const trackPath = '/Application/track';

// 检查是否已认证（有auth_token）
const isAuthenticated = () => {
  return !!localStorage.getItem('auth_token');
};

/**
 * @see  https://umijs.org/zh-CN/plugins/plugin-initial-state
 * */
export async function getInitialState(): Promise<{
  settings?: Partial<LayoutSettings>;
  currentUser?: API.CurrentUser;
  loading?: boolean;
  fetchUserInfo?: () => Promise<API.CurrentUser | undefined>;
}> {
  const fetchUserInfo = async () => {
    try {
      const msg = await queryCurrentUser({
        skipErrorHandler: true,
      });
      console.log(msg, "用户信息");
      return msg.data;
    } catch (error) {
      // 如果获取用户信息失败，清除token并跳转到登录页
      console.log("获取用户信息失败");
      localStorage.removeItem('auth_token');
      localStorage.removeItem('username');
      history.push(loginPath);
    }
    return undefined;
  };

  // 如果不是登录页面，检查认证状态
  const { location } = history;
  if (location.pathname !== loginPath) {
    // 检查是否有auth_token
    if (!isAuthenticated()) {
      // 没有token，强制跳转到登录页
      console.log("未检测到auth_token，跳转到登录页");
      history.push(loginPath);
      return {
        fetchUserInfo,
        settings: defaultSettings as Partial<LayoutSettings>,
      };
    }

    // 有token，尝试获取用户信息
    try {
      const currentUser = await fetchUserInfo();
      return {
        fetchUserInfo,
        currentUser: currentUser || {
          name: localStorage.getItem('username') || '未知用户',
        },
        settings: defaultSettings as Partial<LayoutSettings>,
      };
    } catch (error) {
      // 获取用户信息失败，仍然返回基本结构，但currentUser为undefined
      return {
        fetchUserInfo,
        currentUser: {
          name: localStorage.getItem('username') || '未知用户',
        },
        settings: defaultSettings as Partial<LayoutSettings>,
      };
    }
  }

  // 登录页面直接返回
  return {
    fetchUserInfo,
    settings: defaultSettings as Partial<LayoutSettings>,
  };
}

// ProLayout 支持的api https://procomponents.ant.design/components/layout
export const layout: RunTimeLayoutConfig = ({ initialState, setInitialState }) => {
  return {
    actionsRender: () => [<Question key="doc" />, <SelectLang key="SelectLang" />],
    avatarProps: {
      src: initialState?.currentUser?.avatar,
      title: <AvatarName />,
      render: (_, avatarChildren) => {
        return <AvatarDropdown>{avatarChildren}</AvatarDropdown>;
      },
    },
    waterMarkProps: {
      content: initialState?.currentUser?.name,
    },
    footerRender: () => <Footer />,
    onPageChange: () => {
      const { location } = history;
      
      // 路由守卫：如果没有auth_token且不在登录页面，强制跳转到登录页
      if (!isAuthenticated() && location.pathname !== loginPath) {
        console.log("路由守卫：检测到未认证，跳转到登录页");
        history.push(loginPath);
        return;
      }
      
      // 如果有auth_token但是在登录页面，跳转到首页或其他指定页面
      if (isAuthenticated() && location.pathname === loginPath) {
        history.push('/');
        return;
      }
      
      // 原有的页面跳转逻辑（根据需要保留或修改）
      // if (!initialState?.currentUser && location.pathname !== loginPath) {
      //   history.push(trackPath);
      // }
    },
    access: false,
    bgLayoutImgList: [
      {
        src: 'https://mdn.alipayobjects.com/yuyan_qk0oxh/afts/img/D2LWSqNny4sAAAAAAAAAAAAAFl94AQBr',
        left: 85,
        bottom: 100,
        height: '303px',
      },
      {
        src: 'https://mdn.alipayobjects.com/yuyan_qk0oxh/afts/img/C2TWRpJpiC0AAAAAAAAAAAAAFl94AQBr',
        bottom: -68,
        right: -45,
        height: '303px',
      },
      {
        src: 'https://mdn.alipayobjects.com/yuyan_qk0oxh/afts/img/F6vSTbj8KpYAAAAAAAAAAAAAFl94AQBr',
        bottom: 0,
        left: 0,
        width: '331px',
      },
    ],
    links: isDev
      ? [
          <Link key="openapi" to="/umi/plugin/openapi" target="_blank">
            <LinkOutlined />
            <span>平台使用文档 </span>
          </Link>,
        ]
      : [],
    menuHeaderRender: undefined,
    access: false,
    // 自定义 403 页面
    // unAccessible: <div>unAccessible</div>,
    // 增加一个 loading 的状态
    childrenRender: (children) => {
      // if (initialState?.loading) return <PageLoading />;
      return (
        <>
          {children}
          {isDev && (
            <SettingDrawer
              disableUrlParams
              enableDarkTheme
              settings={initialState?.settings}
              onSettingChange={(settings) => {
                setInitialState((preInitialState) => ({
                  ...preInitialState,
                  settings,
                }));
              }}
            />
          )}
        </>
      );
    },
    ...initialState?.settings,
  };
};

/**
 * @name request 配置，可以配置错误处理
 * 它基于 axios 和 ahooks 的 useRequest 提供了一套统一的网络请求和错误处理方案。
 * @doc https://umijs.org/docs/max/request#配置
 */
export const request = {
  ...errorConfig,
};