import { Scatter } from '@ant-design/plots';
import React from 'react';
import { createRoot } from 'react-dom';
import {scatterData} from "../../mock/detectionDetail.js"
import { XFilled } from '@ant-design/icons';

const ScatterChart = () => {
  const config = {
    autoFit: false,
    height: 300,
    // data: {
    //   type: 'fetch',
    //   value: 'https://render.alipay.com/p/yuyan/180020010001215413/antd-charts/scatter-point-strip.json',
    // },
    data:scatterData,
    coordinate: { transform: [{ type: 'transpose' }] },
    // xField: 'Cylinders',
    xField: "time",
    yField: "week",
    // yField: 'Horsepower',
    sizeField: 20,
    shapeField: 'line',
    scale: {
      y: { domain: [0, 7]},
      x: { domain: [0, 24] },
    },
  };
  return <Scatter {...config} />;
};

export default ScatterChart