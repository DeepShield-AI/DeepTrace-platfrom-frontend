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

// Mock 数据
const mockDataSource = [
  {
    lcuuid: 1,
    name: "sandbox-10.0.221.224-V3",
    group: "Sandbox",
    azName: "T0-Sandbox",
    vtapGroupName: "T0-Sandbox",
    archType: 1,
    tapMode: 0,
    cpuNum: 12,
    memorySize: 32,
    launchServer: "10.0.221.224",
    podClusterName: "T0-Sandbox",
    ctrlIp: "10.0.221.224",
    state: "running",
    status: 1, // 1: 运行中, 0: 已停止
    curControllerIp: "10.1.183.140",
    curAnalyzerIp: "10.1.183.142",
    createTime: "2024-01-15 10:30:00",
    updateTime: "2024-01-20 14:20:00",
    cpuUsage: 45,
    memoryUsage: 60,
    traffic: 1250,
  },
  {
    lcuuid: 2,
    name: "sandbox-10.0.221.224-V4",
    group: "Sandbox",
    azName: "T0-Sandbox",
    vtapGroupName: "T0-Sandbox",
    archType: 1,
    tapMode: 0,
    cpuNum: 8,
    memorySize: 16,
    launchServer: "10.0.221.225",
    podClusterName: "T0-Sandbox",
    ctrlIp: "10.0.221.225",
    state: "stopped",
    status: 0,
    curControllerIp: "10.1.183.140",
    curAnalyzerIp: "10.1.183.142",
    createTime: "2024-01-16 11:20:00",
    updateTime: "2024-01-20 09:15:00",
    cpuUsage: 0,
    memoryUsage: 0,
    traffic: 0,
  },
  {
    lcuuid: 3,
    name: "prod-web-server-01",
    group: "Production",
    azName: "T1-Production",
    vtapGroupName: "Web-Servers",
    archType: 0,
    tapMode: 1,
    cpuNum: 16,
    memorySize: 64,
    launchServer: "10.0.100.10",
    podClusterName: "T1-Production",
    ctrlIp: "10.0.100.10",
    state: "running",
    status: 1,
    curControllerIp: "10.1.183.141",
    curAnalyzerIp: "10.1.183.143",
    createTime: "2024-01-10 09:00:00",
    updateTime: "2024-01-20 16:45:00",
    cpuUsage: 78,
    memoryUsage: 85,
    traffic: 3560,
  },
  {
    lcuuid: 4,
    name: "prod-db-01",
    group: "Production",
    azName: "T1-Production",
    vtapGroupName: "Database",
    archType: 2,
    tapMode: 0,
    cpuNum: 32,
    memorySize: 128,
    launchServer: "10.0.100.20",
    podClusterName: "T1-Production",
    ctrlIp: "10.0.100.20",
    state: "warning",
    status: 2, // 警告状态
    curControllerIp: "10.1.183.141",
    curAnalyzerIp: "10.1.183.143",
    createTime: "2024-01-12 14:00:00",
    updateTime: "2024-01-20 10:30:00",
    cpuUsage: 92,
    memoryUsage: 95,
    traffic: 120,
  },
];

// 状态映射
const statusConfig = {
  1: { 
    text: '运行中', 
    color: '#52c41a',
    icon: <CheckCircleOutlined /> 
  },
  0: { 
    text: '已停止', 
    color: '#d9d9d9',
    icon: <CloseCircleOutlined /> 
  },
  2: { 
    text: '警告', 
    color: '#faad14',
    icon: <InfoCircleOutlined /> 
  },
  3: { 
    text: '异常', 
    color: '#ff4d4f',
    icon: <CloseCircleOutlined /> 
  },
};

export {
    mockDataSource,
    statusConfig
}