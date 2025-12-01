import React, { useState } from 'react';
import './NetworkMetrics.css';

const NetworkMetrics = () => {
  const [filterValue, setFilterValue] = useState('');

  // 模拟数据 - 实际使用时可以从API获取
  const metricsData = [
    {
      id: 1,
      title: '郑州-武汉100G',
      currentValue: '1.660 Gbps',
      max: '1.556',
      min: '0.050',
      values: [0.60, 0.73, 1.66, 1.50, 1.48, 1.581, 1.46, 1.45, 1.445],
      timestamp: '2025-11-21 16:08',
      color: '#3498db'
    },
    {
      id: 2,
      title: '成都-昆明10G',
      currentValue: '912.1 Mbps',
      max: '855.1',
      min: '2.345',
      values: [0.64, 0.77, 912.1, 456.1, 422.0, 228.0],
      timestamp: '2025-11-21 16:08',
      color: '#e74c3c'
    },
    {
      id: 3,
      title: '成都-贵阳10G',
      currentValue: '921.2 Mbps',
      max: '863.6',
      min: '1.065',
      values: [0.64, 0.77, 921.2, 460.6, 437.3],
      timestamp: '2025-11-21 16:08',
      color: '#2ecc71'
    },
    {
      id: 4,
      title: '武汉-合肥10G',
      currentValue: '37.92 Gbps',
      max: '16.57',
      min: '3.987',
      values: [0.64, 0.77, 37.92],
      timestamp: '2025-11-21 16:08',
      color: '#f39c12'
    },
    {
      id: 5,
      title: '沈阳-大连100G',
      currentValue: '2.103 Gbps',
      max: '0.018',
      min: '0.009',
      values: [0.64, 0.77, 2.103],
      timestamp: '2025-11-21 16:08',
      color: '#9b59b6'
    },
    {
      id: 6,
      title: '广州-深圳100G',
      currentValue: '2.740 Gbps',
      max: '0.423',
      min: '3.507',
      values: [2.005, 2.005, 2.74, 2.005, 2.005],
      timestamp: '2025-11-21 16:08',
      color: '#1abc9c'
    }
  ];

  const MetricCard = ({ data }) => {
    const maxValue = Math.max(...data.values);
    const minValue = Math.min(...data.values);
    
    return (
      <div className="metric-card">
        <div className="card-header">
          <h3>{data.title}</h3>
        </div>
        <div className="chart-container">
          <svg width="100%" height="80" className="metric-chart">
            {data.values.map((value, index) => (
              <circle
                key={index}
                cx={`${(index / (data.values.length - 1)) * 100}%`}
                cy={`${100 - (value / maxValue) * 80}%`}
                r="2"
                fill={data.color}
              />
            ))}
            <polyline
              points={data.values.map((value, index) => 
                `${(index / (data.values.length - 1)) * 100},${100 - (value / maxValue) * 80}`
              ).join(' ')}
              fill="none"
              stroke={data.color}
              strokeWidth="2"
            />
          </svg>
        </div>
        <div className="metric-info">
          <div className="current-value">{data.currentValue}</div>
          <div className="min-max">
            Max: {data.max} Min: {data.min}
          </div>
          <div className="timestamp">{data.timestamp}</div>
        </div>
      </div>
    );
  };

  return (
    <div className="network-metrics">
      <div className="metrics-header">
        <h1>3_FITI-G主干网 带宽(3_FITI-G主干网)</h1>
        <div className="filter-section">
          <input
            type="text"
            placeholder="过滤..."
            value={filterValue}
            onChange={(e) => setFilterValue(e.target.value)}
            className="filter-input"
          />
          <button className="filter-button">确定</button>
        </div>
      </div>
      
      <div className="metrics-grid">
        {metricsData.map(metric => (
          <MetricCard key={metric.id} data={metric} />
        ))}
      </div>
    </div>
  );
};

export default NetworkMetrics;