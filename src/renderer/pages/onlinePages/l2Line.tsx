import { Datum, Line, LineConfig } from '@ant-design/charts';
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

export default function L2Line(props: {
  data: DualDataItem[];
  notes: HandoverDataItem[];
  extraConfig: any;
  title?: string;
  changeFunc?: any;
  chartRef?: any;
  status: number;
}) {
  let annotations: {
    type: string;
    style: { fill: string; fillOpacity?: number };
    start: (number|string)[];
    end: (number|string)[];
  }[] = [];
  props.notes.forEach((item) => {
    annotations.push({
      type: 'region',
      style: {
        fill: item.type === 1 ? '#ccff99' : '#ff9999',
        fillOpacity: 0.8,
      },
      start: [item.start, 'min'],
      end: [item.end, 'max'],
    });
  });
  let config = {
    tooltip: {
      customItems: (originalItems: any) => {
        // process originalItems,
        for(let i = 0;i<originalItems.length;i++){
          originalItems[i].name=(originalItems[i].name==="first"?"RSRP":"SNR")
        }
        return originalItems;
      },
    },
    annotations:
      {
        first:annotations
      },
    
    xField: 'timestamp',
    yField: ['first', 'second'],
    animation: false,
    xAxis: {
      type: 'time',
      tickCount: 5,
      mask: 'HH:mm:ss.S',
      tickMethod: 'time',
    },
    legend: {
      custom:true,
      items: [
        {
          name: 'SNR',
          marker: {
            style: {
              fill: '#096dd9',
            },
          },
        },
        {
          name: 'RSRP',
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
    geometryOptions: [
      {
        geometry: 'line',
        smooth: false,
        color: '#29cae4',
        connectNulls:true,
      },
      {
        geometry: 'line',
        color: '#586bce',
        connectNulls:true,
        smooth: false,
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
          chartRef={props.chartRef}
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
