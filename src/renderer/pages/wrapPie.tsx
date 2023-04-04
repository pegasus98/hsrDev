import { Pie } from "@ant-design/charts";

export default function WrapPie(props:any){
    let sum = 0;
    props.data.forEach((item:any)=>{sum+=item.value})
    const config = {
        appendPadding: 0,
        data:props.data,
        angleField: 'value',
        colorField: 'type',
        radius: 0.9,
        height:250,
        width:300,
        animation:false,
        legend: undefined,
        label: {
          type: 'inner',
          content: '',
        },
        tooltip:{
          formatter: (item:any) => {
             return { name: item.type,value:sum>0?((item.value*100)/sum).toFixed(1)+"%":"0%" };
           },
          },
        color: ['#A5A5A5', '#ED7D31', '#FFC000',"#4472C4","#5B9BD5"],
        interactions: [
          {
            type: 'element-active',
          },
        ],
      };
    return <Pie {...config}></Pie>
}