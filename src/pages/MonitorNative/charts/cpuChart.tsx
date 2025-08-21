import { Line } from '@ant-design/plots';
import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom';

export const CPUChart = (props) => {
  const {chartData} = props
  const [data, setData] = useState([]);
  useEffect(() => {
    
  }, []);

  const config = {
    data: chartData,
    xField: 'date',
    yField: 'value',
    colorField: 'type',
    axis: {
      x: {
        // 格式化x轴标签为时间格式
        labelFormatter: (value) => {
          const date = new Date(value);
          // 格式化为hh:mm:ss
          return date.toLocaleTimeString('zh-CN', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          });
        }
      },
      y: {
        labelFormatter: (v) => `${v}`.replace(/\d{1,3}(?=(\d{3})+$)/g, (s) => `${s},`),
      },
    },
    tooltip: {
      // 配置鼠标悬停时显示的格式
      items: [
        {
          channel: 'x',
          // 格式化工具提示中的日期显示
          valueFormatter: (value) => {
            const date = new Date(value);
            // 格式化为yyyy-mm-dd hh:mm:ss
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            const seconds = String(date.getSeconds()).padStart(2, '0');
            
            return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
          }
        }
      ]
    },
    scale: { color: { range: ['#30BF78', '#F4664A', '#FAAD14'] } },
    style: {
      lineWidth: 2,
      lineDash: (data) => {
        if (data[0].type === 'register') return [4, 4];
      },
      opacity: (data) => {
        if (data[0].type !== 'register') return 0.5;
      },
    },
  };

  return <Line {...config} />;
};