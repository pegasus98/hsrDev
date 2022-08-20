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
  // const onChange=(value: [number, number])=>{
  //   console.log(value,new Date().getTime())
  //   setRange([...value,range[2]])
  // }
  // const [range,setRange]=useState([0,0,0]as [number,number,number])
  const [range, setRange] = useState([0, 1]);

  // const createSlide = () => {
  //   if (props.data.length > 0) {
  //     if(range[2]<props.data.length)
  //       setRange([Math.max(0,props.data.length-101),props.data.length-1,props.data.length])
  //     return (
  //       <Slider
  //         range
  //         step={1}
  //         max={props.data.length-1}
  //         defaultValue={[range[0],range[1]] }
  //         value={[range[0],range[1]] }
  //         min={0}
  //         tipFormatter={(value:number)=>props.data[value].time}
  //         onChange={onChange}
  //       />
  //     );
  //   } else return null;
  // };

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
    // data: props.data.slice(range[0],range[1]),
    xField: 'time',
    yField: 'value',
    animation: false,
    annotations: annotations,
    xAxis: {
      tickCount: 5,
    },
  };
  let presentData=[]  as DetailLineDataItem[];
  console.log(props.status)
  if (props.status > 0) {
    presentData=props.data.slice(-100)
    return (
      useMemo(()=>{return<Line
        {...config}
        data={presentData}
        {...props.extraConfig}
        slider={false}
        onReady={(plot) => {
          plot.on('slider:valuechanged', (evt: Event) => {
            if (props.changeFunc) props.changeFunc(evt.event.value);
          });
        }}
      />},[props.data.length,props.status])
    );
  } else {
    presentData=props.data.slice(0,props.data.length)

    return (
      useMemo(()=>{return <Line
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
      />},[props.data.length,props.status])
    );
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
