import React from 'react';
import { Line, Bar } from '@ant-design/charts';
import { IP_DATA1 } from '@/mock';

const Chart1: React.FC = (props) => {

  const {ipVolData} = props

  const data = [
    { year: '1991', value: 3 },
    { year: '1992', value: 4 },
    { year: '1993', value: 3.5 },
    { year: '1994', value: 5 },
    { year: '1995', value: 4.9 },
    { year: '1996', value: 6 },
    { year: '1997', value: 7 },
    { year: '1998', value: 9 },
    { year: '1999', value: 13 },
  ];

  const config = {
    data: ipVolData,
    xField: 'title',
    yField: 'value',
    sort: {
      // reverse: true,
    },
    label: {
      text: 'frequency',
      formatter: '.1%',
      style: {
        textAnchor: (d) => (+d.value),
        fill: (d) => (+d.value),
        // dx: (d) => d,
        rotate: 0
      },
    },
    axis: {
      y: {
        // labelFormatter: '.0%',
        rotate: 0
      },
      x: {
        rotate: 0,
        autoRotate: false
      }
    },
  };
  return <Bar {...config} />;
};
export default Chart1;