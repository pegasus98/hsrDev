//导入折线图
import 'echarts/lib/chart/line';
// 引入提示框和标题组件
import 'echarts/lib/component/tooltip';
import 'echarts/lib/component/title';
import 'echarts/lib/component/legend';
import 'echarts/lib/component/markPoint';
import * as echarts from 'echarts';
import { useEffect, useRef } from 'react';

import { throughputDataItem } from 'defines';

function generateArray (start:number, end:number) {
  return Array.from(new Array(end + 1).keys()).slice(start)
}


export default function Lina(props: any) {
  let options = {
    title: {
      //标题
      text: 'throughput',
      x: 'center',
      textStyle: {
        //字体颜色
        color: '#ccc',
      },
    },
    tooltip: {
      //提示框组件
      trigger: 'axis',
    },
    xAxis: {
      //X轴坐标值
      data: [...new Array(5).keys()],
      name: '时间(s)',
    },
    yAxis: {
      type: 'value', //数值轴，适用于连续数据
      scale: true,
      max: 300,
      min: 0,
      name: '速率(MBps)',
    },
    series: [],
  };
  const chartRef = useRef<HTMLDivElement>(null);
  let chartInstance: any = null;
  const renderChart = () => {
    if (chartRef.current) {
      const renderedInstance = echarts.getInstanceByDom(chartRef.current);
      if (renderedInstance) {
        chartInstance = renderedInstance;
      } else {
        chartInstance = echarts.init(chartRef.current);
      }
      let newSeries = JSON.parse(JSON.stringify(props.throughputData));
      let maxlengh = -1;
      newSeries.forEach((item:throughputDataItem) => {
          if(maxlengh<item.data.length)
            maxlengh=item.data.length
      });
      if(maxlengh<6)
        options.series = newSeries;
      else {
        options.xAxis.data=generateArray(maxlengh-5+1,maxlengh)
        for(let i = 0;i<newSeries.length;++i){
          newSeries[i].data=newSeries[i].data.slice(maxlengh-5)
        }
        options.series=newSeries
        console.log(options)
      }
      chartInstance.setOption(options);
    }
  };

  useEffect(() => {
    renderChart();
  });

  useEffect(() => {
    return () => {
      chartInstance && chartInstance.dispose();
    };
  }, []);

  return (
    <>
      <div>
        <div style={{ width: '500px', height: '500px' }} ref={chartRef} />
      </div>
    </>
  );
}
