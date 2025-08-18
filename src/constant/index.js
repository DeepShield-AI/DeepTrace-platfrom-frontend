const OVERVIEW_CARD_MAP = {
    alertCount: "告警数量",
    avgBandwidth: "平均带宽",
    avgClientLatency: "平均服务端延迟",
    avgUpstreamBandwidth: "平均上行带宽",
    clientRetransmissionRate: "重传率",
    dataPacketRetransmissionRate: "数据包重传率",
    peakBandwidth: "峰值带宽",
    serverRetransmissionRate: "服务端重传率",
    totalPackets: "总数据包",
    totalTraffic: "总流量"
} 

const expandDataMap = {
    arch: "体系架构",
    archType: "类型",
    completeRevision: "完整版本",
    controllerIp: "控制IP",
    cpuNum: "CPU数",
    createTime: "创建时间",
    ctrlIp: "控制IP",
    ctrlMac: "控制Mac地址",
    curAnalyzerIp: "当前分析IP",
    curControllerIp: "当前控制IP",
    currentK8sImage: "当前K8s镜像",
    kernelVersion: "内核版本",
    launchServer: "软件版本",
    licenseType: "许可类型",
    memorySize: "内存大小",
    name: "采集器名称",
    os: "操作系统",
    regionName: "区域",
    revision: "版本",
    state: "状态",
    updateTime: "更新时间",
    vtapGroupName: "采集器组",
    analyzerIp: "分析IP"
}
export {
    OVERVIEW_CARD_MAP,
    expandDataMap
}