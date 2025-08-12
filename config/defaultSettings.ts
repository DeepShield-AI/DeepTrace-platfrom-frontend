import { ProLayoutProps } from '@ant-design/pro-components';
import logoImg from "../src/assets/images/logo.png"
/**
 * @name
 */
const Settings: ProLayoutProps & {
  pwa?: boolean;
  logo?: string;
} = {
  // 黑白主题设置
  // navTheme: 'realDark',
  navTheme: 'light',
  // 拂晓蓝
  colorPrimary: '#1890ff',
  // 菜单上面or侧面
  layout: 'side',
  siderMenuType: "group",
  splitMenus: false,
  // layout: 'top',
  contentWidth: 'Fluid',
  fixedHeader: false,
  fixSiderbar: true,
  colorWeak: false,
  title: 'DeepShield',
  pwa: true,
  // contentWidth: "Fixed", //是否固定菜单
  // logo: 'https://gw.alipayobjects.com/zos/rmsportal/KDpgvguMpGfqaHPjicRK.svg',
  // logo: "https://sso.qcl.edu.cn/static/img/logo.772ab10c.png",
  // logo: ,
  iconfontUrl: '',
  token: {
    // 参见ts声明，demo 见文档，通过token 修改样式
    //https://procomponents.ant.design/components/layout#%E9%80%9A%E8%BF%87-token-%E4%BF%AE%E6%94%B9%E6%A0%B7%E5%BC%8F
  },
  // splitMenus: false
};

export default Settings;