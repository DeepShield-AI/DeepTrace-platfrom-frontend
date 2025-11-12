import { Column } from '@ant-design/plots';
import React from 'react';
import ReactDOM from 'react-dom';

const data = [
  { type: 'IP1', value: 0.36 },
  { type: 'IP2', value: 0.25 },
  { type: 'IP3', value: 0.24 },
  { type: 'IP4', value: 0.19 },
  { type: 'IP5', value: 0.12 },
  { type: 'IP6', value: 0.15 },
  { type: 'IP7', value: 0.16 },
  { type: 'IP8', value: 0.1 },
];

const Chart2 = (props) => {
  const chartRef = React.useRef(null);
  const {ipThreatData} = props
  const config = {
    data: data,
    xField: 'type',
    yField: 'value',
    colorField: 'type',
    axis: {
      x: {
        size: 40,
        // labelFormatter: (datum, index) => medal(datum, index),
      },
    },
    onReady: (plot) => (chartRef.current = plot),
  };
  return <Column {...config} />;
};

export default Chart2