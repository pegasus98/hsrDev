import { Line, LineConfig } from '@ant-design/charts';
import { DetailLineDataItem, HandoverDataItem, DualDataItem } from 'defines';
import { Card, Slider, Typography, Alert, Space, Popover } from 'antd';
import moment from 'moment';
import { useEffect, useMemo, useState } from 'react';
import { dataTool } from 'echarts';
import { QuestionCircleOutlined } from '@ant-design/icons';

import { DualAxes } from '@ant-design/plots';
import { Event } from '@antv/g2';
import { ListItem } from 'bizcharts/lib/plots/core/dependents';
const { Text } = Typography;

export default function VideoLine(props: {
  data: DualDataItem[];
  notes: HandoverDataItem[];
  extraConfig: any;
  title?: string;
  changeFunc?: any;
  status: number;
}) {
  const tag = ['0', '1.5', '4.5', '7.5', '12', '24', '60', '110', '160'];

  let annotations: {
    type: string;
    style: { fill: string; fillOpacity?: number };
    start: string[];
    end: string[];
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
    tooltip: {
      customItems: (originalItems: any) => {
        // process originalItems,
        for (let i = 0; i < originalItems.length; i++) {
          originalItems[i].value =
            originalItems[i].name === 'first'
              ? tag[parseInt(originalItems[i].value)]
              : originalItems[i].value;

          originalItems[i].name =
            originalItems[i].name === 'first' ? 'bitrate' : 'buffer';
        }
        return originalItems;
      },
    },
    xField: 'time',
    yField: ['first', 'second'],
    animation: false,
    xAxis: {
      tickCount: 5,
    },
    annotations: {
      first: annotations,
    },
    legend: { 
      custom:true,
      items: [
        {
          name: 'Buffer',
          marker: {
            style: {
              fill: '#096dd9',
            },
          },
        },
        {
          name: 'Bitrate',
          marker: {
            style: {
              fill: '#69c0ff',
            },
          },
        },
        {
          name: 'Successful Handover',
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
    yAxis: {
      first: {
        min: 0,
        max: 8,
        title: {
          text: 'bitrate(Mbps)',
        },
        label: {
          formatter: (text: string, item: any, index: number) => {
            return tag[parseInt(text)];
          },
        },
      },
      second: {
        min: 0,
        max: 5,
        title: {
          text: 'buffer(s)',
        },
      },
    },
    geometryOptions: [
      {
        geometry: 'line',
        smooth: false,
        color: '#29cae4',
        connectNulls:true,
        stepType: 'vh',
      },
      {
        geometry: 'line',
        color: '#586bce',
        connectNulls:true,
        smooth: true,
      },
    ],
  };
  let presentData = [] as DualDataItem[];
  if (props.status > 0) {
    presentData = props.data.slice(-100);
    return useMemo(() => {
      return (
        <DualAxes
          {...config}
          data={[presentData, presentData]}
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
        <DualAxes
          {...config}
          data={[presentData, presentData]}
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
}
