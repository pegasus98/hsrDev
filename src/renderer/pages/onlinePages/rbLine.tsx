import { Line, LineConfig } from '@ant-design/charts';
import { DetailLineDataItem, HandoverDataItem, DualDataItem, RbDataItem } from 'defines';
import { Card, Slider, Typography, Alert, Space, Popover } from 'antd';
import moment from 'moment';
import { useEffect, useMemo, useState } from 'react';
import { dataTool } from 'echarts';
import { QuestionCircleOutlined } from '@ant-design/icons';

import { DualAxes } from '@ant-design/plots';
import { Event } from '@antv/g2';
import { ListItem } from 'bizcharts/lib/plots/core/dependents';
const { Text } = Typography;

export default function RbLine(props: {
  rbData: RbDataItem[];
  rbRawData:RbDataItem
  notes: HandoverDataItem[];
  extraConfig: any;
  title?: string;
  changeFunc?: any;
  status: number;
}) {
  const tag = ["256QAM","64QAM","16QAM","QPSK"];

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
    height:430,
    tooltip: {
      customItems: (originalItems: any) => {
        // process originalItems,
        for (let i = 0; i < originalItems.length; i++) {
          originalItems[i].value =
            originalItems[i].name === 'type'
              ? tag[parseInt(originalItems[i].value)]
              : parseFloat(originalItems[i].value).toFixed(2)+"%";

          originalItems[i].name =
            originalItems[i].name === 'type' ? 'Modulation Type' : 'Util';
        }
        return originalItems;
      },
    },
    xField: 'timestamp',
    yField: ['type', 'value'],
    animation: false,
    xAxis: {
      type: 'time',
      tickCount: 5,
      mask: 'HH:mm:ss.S',
      tickMethod: 'time',
    },
    annotations: {
      value: annotations,
    },
    legend: {
      custom:true,
      items: [
        {
          name: 'Util',
          marker: {
            style: {
              fill: '#096dd9',
            },
          },
        },
        {
          name: 'Modulation Type',
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
      type: {
        min: 0,
        max: 3,
        title: {
          text: 'Modulation Type',
        },
        label: {
          formatter: (text: string, item: any, index: number) => {
            return tag[parseInt(text)];
          },
        },
      },
      value: {
        min: 0,
        max: Math.max(...props.rbData.map(item=>item.value)),
        title: {
          text: 'Util(%)',
        },
      },
    },
    geometryOptions: [
      {
        geometry: 'line',
        smooth: false,
        color: '#29cae4',
        connectNulls:true,
        // stepType: 'vh',
      },
      {
        geometry: 'line',
        color: '#586bce',
        connectNulls:true,
        // smooth: true,
      },
    ],
  };
  let presentData = [] as RbDataItem[];
  if (props.status > 0) {
    presentData = props.rbData.slice(-100);
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
    }, [props.rbData.length, props.status]);
  } else {
    presentData = props.rbData.slice(0, props.rbData.length);

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
    }, [props.rbData.length, props.status]);
  }
}
