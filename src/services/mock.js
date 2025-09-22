const overviewGetAllMockData = [
  {
    date: '2024-12-31T16:00:00.000+00:00',
    totalTraffic: 1.07,
    totalPackets: 1000000,
    avgBandwidth: 100.5,
    peakBandwidth: 200.75,
    avgUpstreamBandwidth: 50.25,
    dataPacketRetransmissionRate: 0.5,
    clientRetransmissionRate: 0.3,
    serverRetransmissionRate: 0.2,
    alertCount: 5,
    avgClientLatency: 150.45,
    avgServerLatency: 101.0,
  },
  {
    date: '2025-01-01T16:00:00.000+00:00',
    totalTraffic: 2.07,
    totalPackets: 2000000,
    avgBandwidth: 200.5,
    peakBandwidth: 200.75,
    avgUpstreamBandwidth: 20.25,
    dataPacketRetransmissionRate: 0.4,
    clientRetransmissionRate: 0.3,
    serverRetransmissionRate: 0.2,
    alertCount: 2,
    avgClientLatency: 50.45,
    avgServerLatency: 201.0,
  },
];

const accessGetAllMockData = [
  {
    id: 1,
    ds: '2025-01-08T16:00:00.000+00:00',
    ip: '192.168.1.1',
    visitCount: 5,
    isThreat: 0,
    createdAt: '2025-01-09T07:12:14.000+00:00',
    updatedAt: '2025-01-09T07:12:14.000+00:00',
  },
  {
    id: 2,
    ds: '2025-01-08T16:00:00.000+00:00',
    ip: '192.168.1.2',
    visitCount: 3,
    isThreat: 1,
    createdAt: '2025-01-09T07:12:14.000+00:00',
    updatedAt: '2025-01-09T07:12:14.000+00:00',
  },
  {
    id: 3,
    ds: '2025-01-08T16:00:00.000+00:00',
    ip: '192.168.1.3',
    visitCount: 1,
    isThreat: 0,
    createdAt: '2025-01-09T07:12:14.000+00:00',
    updatedAt: '2025-01-09T07:12:14.000+00:00',
  },
  {
    id: 4,
    ds: '2025-01-08T16:00:00.000+00:00',
    ip: '192.168.1.4',
    visitCount: 7,
    isThreat: 0,
    createdAt: '2025-01-09T07:12:14.000+00:00',
    updatedAt: '2025-01-09T07:12:14.000+00:00',
  },
  {
    id: 5,
    ds: '2025-01-08T16:00:00.000+00:00',
    ip: '192.168.1.5',
    visitCount: 2,
    isThreat: 1,
    createdAt: '2025-01-09T07:12:14.000+00:00',
    updatedAt: '2025-01-09T07:12:14.000+00:00',
  },
];

const requestData = [
  {
    timeKey: 1755926160000,
    docCount: 166,
  },
  {
    timeKey: 1755926220000,
    docCount: 142,
  },
  {
    timeKey: 1755926340000,
    docCount: 217,
  },
  {
    timeKey: 1755926460000,
    docCount: 98,
  },
  {
    timeKey: 1755926580000,
    docCount: 183,
  },
  {
    timeKey: 1755926700000,
    docCount: 205,
  },
];

const errorData = [
  {
    statusCode: '200',
    timeBuckets: [
      {
        timeKey: 1726058800000,
        docCount: 166,
      },
      {
        timeKey: 1726059400000,
        docCount: 142,
      },
      {
        timeKey: 1726060000000,
        docCount: 217,
      },
      {
        timeKey: 1726060600000,
        docCount: 98,
      },
      {
        timeKey: 1726061200000,
        docCount: 183,
      },
      {
        timeKey: 1726061800000,
        docCount: 205,
      },
    ],
  },
  {
    statusCode: '201',
    timeBuckets: [
      {
        timeKey: 1726058800000,
        docCount: 121,
      },
      {
        timeKey: 1726059400000,
        docCount: 124,
      },
      {
        timeKey: 1726060000000,
        docCount: 253,
      },
      {
        timeKey: 1726060600000,
        docCount: 123,
      },
      {
        timeKey: 1726061200000,
        docCount: 214,
      },
      {
        timeKey: 1726061800000,
        docCount: 100,
      },
    ],
  },
];

const latencyData = [
  {
    timeKey: 1755926160000,
    avgDuration: 6196366.753012048,
    p75Duration: 0,
    p90Duration: '8239017.699999997',
    p99Duration: 0,
  },
];

export { accessGetAllMockData, errorData, latencyData, overviewGetAllMockData, requestData };
