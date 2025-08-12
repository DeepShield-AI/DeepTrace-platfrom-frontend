import React from 'react';
import ReactDOM from 'react-dom';
import { Line } from '@ant-design/plots';
import {data} from '../data/chart1'

const Chart1 = () => {
  const config = {
    // data: {
    //   type: 'fetch',
    //   value: 'https://gw.alipayobjects.com/os/bmw-prod/55424a73-7cb8-4f79-b60d-3ab627ac5698.json',
    // },
    data,
    xField: (d) => new Date(d.year),
    yField: 'value',
    sizeField: 'value',
    shapeField: 'trail',
    legend: { size: false },
    colorField: 'category',
  };
  return <Line {...config} />;
};

export default Chart1