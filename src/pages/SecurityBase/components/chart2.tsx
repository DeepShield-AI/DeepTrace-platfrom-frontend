import React from 'react';
import ReactDOM from 'react-dom';
import { Line } from '@ant-design/plots';

const Chart2 = () => {
  const config = {
    data: {
      type: 'fetch',
      value: 'https://assets.antv.antgroup.com/g2/temperatures1.json',
    },
    xField: (d) => new Date(d.date),
    yField: 'value',
    colorField: 'condition',
    shapeField: 'hvh',
    style: {
      gradient: 'x',
      lineWidth: 2,
    },
    scale: {
      y: { nice: true },
      color: {
        domain: ['CLR', 'FEW', 'SCT', 'BKN', 'OVC', 'VV '],
        range: ['deepskyblue', 'lightskyblue', 'lightblue', '#aaaaaa', '#666666', '#666666'],
      },
    },
  };
  return <Line {...config} />;
};

export default Chart2