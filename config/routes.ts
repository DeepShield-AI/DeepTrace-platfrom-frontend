import { layout } from "@/app";
import component from "@/locales/bn-BD/component";
import route from "mock/route";

/**
 * @name umi 的路由配置
 * @description 只支持 path,component,routes,redirect,wrappers,name,icon 的配置
 * @param path  path 只支持两种占位符配置，第一种是动态参数 :id 的形式，第二种是 * 通配符，通配符只能出现路由字符串的最后。
 * @param component 配置 location 和 path 匹配后用于渲染的 React 组件路径。可以是绝对路径，也可以是相对路径，如果是相对路径，会从 src/pages 开始找起。
 * @param routes 配置子路由，通常在需要为多个路径增加 layout 组件时使用。
 * @param redirect 配置路由跳转
 * @param wrappers 配置路由组件的包装组件，通过包装组件可以为当前的路由组件组合进更多的功能。 比如，可以用于路由级别的权限校验
 * @param name 配置路由的标题，默认读取国际化文件 menu.ts 中 menu.xxxx 的值，如配置 name 为 login，则读取 menu.ts 中 menu.login 的取值作为标题
 * @param icon 配置路由的图标，取值参考 https://ant.design/components/icon-cn， 注意去除风格后缀和大小写，如想要配置图标为 <StepBackwardOutlined /> 则取值应为 stepBackward 或 StepBackward，如想要配置图标为 <UserOutlined /> 则取值应为 user 或者 User
 * @doc https://umijs.org/docs/guides/routes
 */
export default [
  {
    path: '/user',
    layout: false,
    routes: [
      {
        name: 'login',
        path: '/user/login',
        component: './User/Login',
      },
    ],
  },
  // {
  //   path: '/welcome',
  //   name: 'welcome',
  //   icon: 'smile',
  //   component: './Welcome',
  //   layout: {
  //     hideMenu: false,
  //     hideNav: false
  //   }
    
  // },
  // {
  //   path: '/security/main',
  //   name: 'Overview',
  //   component: './Main',
  //   icon: "AreaChart"
  // },
  // {
  //   path: '/Detection',
  //   name: 'Detections',
  //   component: './Detection',
  //   icon: "SecurityScan",
  // },
  {
    path: '/Network',
    name: '网络观测',
    icon: "CloudSync",
    routes: [
      {
        path: "/Network/track",
        name: "资源分析",
        component: "./Protocol"
      },
      {
        path: "/Network/topology",
        name: "路径分析",
        component: "./Protocol"
      },
      {
        path: "/Network/log",
        name: "拓扑分析",
        component: "./Protocol"
      },
    ]
  },
  {
    path: '/Application',
    name: '应用观测',
    icon: "AppstoreOutlined",
    routes: [
      {
        path: "/Application/track",
        name: "调用链追踪",
        component: "./Protocol"
      },
      {
        path: "/Application/topology",
        name: "调用链拓扑",
        component: "./Protocol"
      },
      {
        path: "/Application/log",
        name: "日志检索",
        component: "./Protocol"
      },
    ]
  },
  {
    path: '/Action',
    name: '系统管理',
    icon: "SettingOutlined",
    routes: [
      {
        path: '/Action/config',
        name: '采集器',
        component: './ActionCollect'
      },
      {
        path: '/Action/alert',
        name: '数据节点',
        component: './Alert',
        // icon: "InfoCircle"
      },
      {
        path: '/Action/hunts',
        name: '资产配置',
        component: './Hunts',
        // icon: "Monitor"
      },
      {
        path: '/Action/cases',
        name: '系统配置',
        component: './Cases',
        // icon: "Project"
      },
    ]
  },
  {
    path: '/Alert',
    name: '告警管理',
    icon: "WarningOutlined",
    routes: [
      {
        path: '/Alert/list',
        name: '事件列表',
        component: './Alert'
      },
      {
        path: '/Alert/analysis',
        name: '事件分析',
        component: './Alert',
        // icon: "InfoCircle"
      },
      {
        path: '/Alert/setting',
        name: '告警策略',
        component: './Hunts',
        // icon: "Monitor"
      },
    ]
  },

  // {
  //   path: '/security/alert',
  //   name: 'Alert',
  //   component: './Alert',
  //   icon: "InfoCircle"
  // },
  // {
  //   path: '/security/hunts',
  //   name: 'Hunts',
  //   component: './Hunts',
  //   icon: "Monitor"
  // },
  // {
  //   path: '/security/cases',
  //   name: 'Cases',
  //   component: './Cases',
  //   icon: "Project"
  // },
  // {
  //   path: '/Protocol',
  //   name: '网络',
  //   icon: "CloudSync",
  //   routes: [
  //     {
  //       path: "/Protocol/view",
  //       name: "流量可视化",
  //       component: "./Protocol"
  //     },
  //     {
  //       path: "/Protocol/analyze",
  //       name: "统计分析",
  //       component: "./Protocol"
  //     },
  //     {
  //       path: "/Protocol/search",
  //       name: "日志检索",
  //       component: "./Protocol"
  //     },
  //   ]
  // },
  // {
  //   name: '分布式应用监测',
  //   icon: 'table',
  //   path: "/distributeApp",
  //   routes: [
  //     {
  //       path: '/distributeApp/safty',
  //       name: '关键性能指标观测',
  //       component: './DisappSafty',
  //       layout: {
  //         hideMenu: false,
  //         hideNav: true
  //       }
  //     },
  //     {
  //       path: '/distributeApp/service',
  //       name: '服务健康度展示',
  //       component: './DisappService', 
  //       layout: {
  //         hideMenu: false,
  //         hideNav: true
  //       }
  //     },
  //     {
  //       path: '/distributeApp/transaction',
  //       name: '用户事务展示',
  //       component: './DisappTransaction',
  //       layout: {
  //         hideMenu: false,
  //         hideNav: true
  //       }
  //     }
  //   ]
  // },
  {
    path: '/',
    redirect: '/Application',
  },
  {
    path: '*',
    layout: false,
    component: './404',
  },
  // 不展示路由
  {
    path: '/Detectiondetail',
    component: './DetectionDetail',
    // name: "详情"
  }
];
