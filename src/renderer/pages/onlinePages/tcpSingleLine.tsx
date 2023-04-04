import { Line, LineConfig } from '@ant-design/charts';
import { DetailLineDataItem,TagedDataItem, HandoverDataItem, DualDataItem } from 'defines';
import { Card, Slider, Typography, Alert, Space, Popover } from 'antd';
import moment from 'moment';
import { useEffect, useMemo, useState } from 'react';
import { dataTool } from 'echarts';
import { QuestionCircleOutlined } from '@ant-design/icons';

import { Event } from '@antv/g2';

export default function TcpSingleLine(props: {
  data: TagedDataItem[];
  notes: HandoverDataItem[];
  extraConfig: any;
  title?: string;
  changeFunc?: any;
  status: number;
}) {

  let annotations: {    
    type: string;
    style: { fill: string; fillOpacity?: number };
    start: (string|number)[];
    end: (string|number)[];
  }[] = [];
  props.notes.forEach((item) => {
    annotations.push({
      type: 'region',
      style: {
        fill: item.type === 1 ? '#ccff99' : '#ff9999',
        fillOpacity: 0.5,
      },
      start: [item.start, 'min'],
      end: [item.end, 'max'],
    });
  });

  let config = {
    xField: 'timestamp',
    yField: 'value',
    seriesField:'type',
    animation: false,
    xAxis:{
        type: "time",
        mask: "HH:mm:ss.S",
        tickMethod: 'time'
    },
    color: ['#096dd9', '#69c0ff'],
    annotations:annotations
  };
  let presentData = [] as TagedDataItem[];
  if (props.status > 0) {
    const max = Math.max(...props.data.map(item=>item.timestamp))
    presentData = props.data.filter(item=>item.timestamp>max-10000);
    return useMemo(() => {
      return (
        <Line
          {...config}
          data={presentData}
          {...props.extraConfig}
          slider={false}
          onReady={(plot) => {
            plot.on('slider:mouseup', (evt: Event) => {
            //   if (props.changeFunc) {props.changeFunc(evt.event.value)};
            });
          }}
        />
      );
    }, [props.data.length, props.status]);
  } else {
    presentData = props.data.slice(0, props.data.length);

    return useMemo(() => {
      return (
        <Line
          {...config}
          data={presentData}
          
          slider={{
          }}
          {...props.extraConfig}
          onReady={(plot) => {
            plot.on('slider:valuechanged', (evt: Event) => {
              if (props.changeFunc) props.changeFunc(evt.event.value);
            });
          }}
        />
      );
    }, [props.data.length, props.status]);
  }
}
