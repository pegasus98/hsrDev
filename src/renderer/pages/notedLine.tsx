import { Line, LineConfig } from '@ant-design/charts';
import { DetailLineDataItem, HandoverDataItem } from 'defines';
import { Card, Slider, Typography, Alert, Space, Popover } from 'antd';
import moment from 'moment';
import { useEffect, useMemo, useState } from 'react';
import { dataTool } from 'echarts';
import { QuestionCircleOutlined } from '@ant-design/icons';
import { Event } from '@antv/g2';
const { Text } = Typography;

export default function NotedLine(props: {
  data: DetailLineDataItem[];
  notes: HandoverDataItem[];
  extraConfig: any;
  title?: string;
  changeFunc?: any;
  status: number;
}) {
  let annotations: {
    type: string;
    style: { fill: string; fillOpacity?: number };
    start: (string | number)[];
    end: (string | number)[];
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
    // data: props.data.slice(range[0],range[1]),
    xField: 'timestamp',
    yField: 'value',
    animation: false,
    annotations: annotations,
    xAxis: {
      type: 'time',
      tickCount: 5,
      mask: 'HH:mm:ss.S',
      tickMethod: 'time',
    },
    legend: {
      items: [
        {
          name: 'Successful Handover',
          value: '',
          marker: {
            symbol: 'square',
            style: {
              fill: '#ccff99',
            },
          },
        },
        {
          name: 'Failed Handover',
          marker: {
            symbol: 'square',
            style: {
              fill: '#ff9999',
            },
          },
        },
      ],
    },
  };
  let presentData = [] as DetailLineDataItem[];
  if (props.status > 0) {
    presentData = props.data.slice(-100);
    return useMemo(() => {
      return (
        <Line
          {...config}
          data={presentData}
          {...props.extraConfig}
          slider={false}
          onReady={(plot) => {
            plot.on('slider:valuechanged', (evt: Event) => {
              if (props.changeFunc) props.changeFunc(evt.event.value);
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
            start: 0,
            end: 1,
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

  // return (
  //   useMemo(()=>{
  //     return <Line
  //     {...config}
  //     {...props.extraConfig}
  //     onReady={(plot) => {
  //       plot.on('slider:valuechanged', (evt: Event) => {
  //         if(props.changeFunc)
  //         props.changeFunc(evt.event.value)
  //       });
  //     }}
  //   />
  //   },[props.data])

  // );
}
