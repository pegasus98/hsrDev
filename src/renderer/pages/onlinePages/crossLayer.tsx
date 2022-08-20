import { QuestionCircleOutlined } from '@ant-design/icons';
import { Card, Row, Col, Layout, Popover } from 'antd';
import { DetailLineDataItem } from 'defines';
import NotedLine from '../notedLine';
import WrapPie from '../wrapPie';
const analysisData = (type: string, data: DetailLineDataItem[]) => {
  let sum = 0;
  let types = [0, 0, 0, 0, 0];
  let board = [0, 0, 0, 0, 0];
  let pointer = 4;
  //const sorteddata=data.sort((a,b)=>(b.value-a.value)) //大到小  thp最大值未知
  const sorteddata = data.concat([]);
  sorteddata.sort((a, b) => b.value - a.value);
  if (type == 'rsrp') board = [-100000, -105, -95, -85, -75];
  if (type == 'snr') board = [-10000, -5, 5, 15, 25];
  for (let i = 1; i < sorteddata.length; i++) {
    sum += sorteddata[i].value;
    while (board[pointer] > sorteddata[i].value) pointer--;
    types[pointer]++;
  }
  return {
    average: sum / data.length,
    pieData: [
      { type: 'poor', value: types[0] },
      { type: 'fair', value: types[1] },
      { type: 'average', value: types[2] },
      { type: 'good', value: types[3] },
      { type: 'excellent', value: types[4] },
    ],
  };
};

export default function CrossLayer(props: any) {
  const { average, pieData } = analysisData(props.type, props.rawData);



  return (
    <Layout>
      <Card>
        <Row gutter={[10,0]}>
          <Col span={8}>
            <Row gutter={[10,10]}>
              <Col span={24}>
              <Card >
                平均值：<br/>
                {average.toFixed(1)}
              </Card>
              </Col>
              <Col span={24}>

              <Card title={<div><text>{props.type}状态分布</text><Popover content={<div>5类状态定义为：<br/>poor:...</div>}><QuestionCircleOutlined style={{marginLeft:'10px'}}/></Popover></div>}>
                <WrapPie data={pieData}></WrapPie>
              </Card>
              </Col>

            </Row>
          </Col>

          <Col span={16}>
            <NotedLine
              data={props.data}
              notes={props.notes}
              extraConfig={props.extraConfig}
              title={props.title}
            ></NotedLine>
          </Col>
        </Row>
      </Card>
    </Layout>
  );
}
