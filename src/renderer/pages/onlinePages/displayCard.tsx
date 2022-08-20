import { QuestionCircleOutlined } from '@ant-design/icons';
import { Card, Row, Col, Layout, Popover, Space, Divider } from 'antd';
import { DetailLineDataItem } from 'defines';
import { Box } from '@ant-design/plots';
import NotedLine from '../notedLine';
import WrapPie from '../wrapPie';
import { Chart, Axis, Tooltip, Schema } from 'bizcharts';
import DataSet from '@antv/data-set';
import styles from "../pages.module.css"
const { DataView } = DataSet;
const analysisData = (type: string, data: DetailLineDataItem[]) => {
  let sum = 0;
  let types = [0, 0, 0, 0, 0];
  let board = [0, 0, 0, 0, 0];
  let pointer = 4;
  if (data.length === 0) {
    return {
      average: 0,
      pieData: [
        { type: '极差', value: types[0] },
        { type: '较差', value: types[1] },
        { type: '中等', value: types[2] },
        { type: '优秀', value: types[3] },
        { type: '良好', value: types[4] },
      ],
      v0: 0,
      v25: 0,
      v50: 0,
      v75: 0,
      v100: 0,
    };
  }
  //const sorteddata=data.sort((a,b)=>(b.value-a.value)) //大到小  thp最大值未知
  const sorteddata = data.concat([]);
  sorteddata.sort((a, b) => b.value - a.value);
  if (type === 'rsrp') board = [-100000, -105, -95, -85, -75];
  if (type === 'snr') board = [-10000, -5, 5, 15, 25];
  if (type === 'throughput') board = [-10000, 1, 5, 20, 50];
  for (let i = 1; i < sorteddata.length; i++) {
    sum += sorteddata[i].value;
    while (board[pointer] > sorteddata[i].value) pointer--;
    types[pointer]++;
  }

  return {
    average: sum / data.length,
    pieData: [
      { type: '极差', value: types[0] },
      { type: '较差', value: types[1] },
      { type: '中等', value: types[2] },
      { type: '优秀', value: types[3] },
      { type: '良好', value: types[4] },
    ],
    v100: sorteddata[0].value.toFixed(1),
    v75: sorteddata[Math.floor(sorteddata.length / 4)].value.toFixed(1),
    v50: sorteddata[Math.floor(sorteddata.length / 2)].value.toFixed(1),
    v25: sorteddata[Math.floor((sorteddata.length * 3) / 4)].value.toFixed(1),
    v0: sorteddata[sorteddata.length - 1].value.toFixed(1),
  };
};

export default function DisplayCard(props: any) {
  const { average, pieData, v0, v25, v50, v75, v100 } = analysisData(
    props.type,
    props.rawData
  );
  let pieSum = 0;
  props.data.forEach((item: any) => {
    pieSum += item.value;
  });

  const data2 = [
    {
      x: 'Oceania',
      low: 1,
      q1: 9,
      median: 16,
      q3: 22,
      high: 24,
    },
  ];
  const config = {
    width: 400,
    height: 500,
    data: data2,
    yField: ['low', 'q1', 'median', 'q3', 'high'],
    xField: 'x',
    boxStyle: {
      stroke: '#545454',
      fill: '#1890FF',
      fillOpacity: 0.3,
    },
    animation: false,
  };
  return (
    <Layout>
      <Card style={{ marginTop: -24 }} bordered={false}>
        <Row gutter={[10, 0]}>
          <Col span={24}>
            <Card
              style={{ height: '100%' }}
              title={
                <div>
                  {props.title ? props.title : ''}
                  <Popover
                    content={
                      <div>
                        <span style={{ backgroundColor: '#ccff99' }}>
                          绿色区间
                        </span>
                        为成功handover，
                        <span style={{ backgroundColor: '#ff9999' }}>
                          红色区间
                        </span>
                        为失败handover
                      </div>
                    }
                  >
                    <QuestionCircleOutlined style={{ marginLeft: '10px' }} />
                  </Popover>
                </div>
              }
            >
              <NotedLine
                data={props.data}
                notes={props.notes}
                extraConfig={props.extraConfig}
                title={props.title}
                status={props.status}

              ></NotedLine>
            </Card>
          </Col>
        </Row>
        <Row justify="center" align="top">
          <Col span={14} style={{height:'100%'}}>
            <Divider orientation="left">分位值</Divider>
            <Row gutter={10}>
              <Col span={24 / 6} >
                <Card
                  bodyStyle={{ color: '#8B0012' }}
                  style={{ borderColor: '#8B0012' }}
                >
                  <p>最小值</p>
                  <p>{v0}</p>
                </Card>
              </Col>
              <Col span={24 / 6}>
                <Card
                  bodyStyle={{ color: '#8B0012' }}
                  style={{ borderColor: '#8B0012' }}

                >
                  <p                   className={styles.boxText}>25%分位值</p>
                  <p>{v25}</p>
                </Card>
              </Col>
              <Col span={24 / 6}>
                <Card
                  bodyStyle={{ color: '#8B0012' }}
                  style={{ borderColor: '#8B0012' }}
                >
                  <p>中位数</p>
                  <p>{v50}</p>
                </Card>
              </Col>
              <Col span={24 / 6}>
                <Card
                  bodyStyle={{ color: '#8B0012' }}
                  style={{ borderColor: '#8B0012' }}
                >
                  <p>75%分位值</p>
                  <p>{v75}</p>
                </Card>
              </Col>
              <Col span={24 / 6}>
                <Card
                  bodyStyle={{ color: '#8B0012' }}
                  style={{ borderColor: '#8B0012' }}
                >
                  <p>最大值</p>
                  <p>{v100}</p>
                </Card>
              </Col>
            </Row>
          </Col>
          <Col span={10}>
            <Row>
              <Col span={6} style={{ padding: 20 }}>
                {' '}
                <Card
                  size="small"
                  bodyStyle={{ color: '#5B9BD5' }}
                  style={{ borderColor: '#5B9BD5', margin: 10 }}
                >
                  <p> 优秀</p>
                  <p>
                    {pieSum != 0
                      ? ((pieData[4].value * 100) / pieSum).toFixed(1)
                      : 0}
                    % ({pieData[4].value}s){' '}
                  </p>
                </Card>{' '}
                <Card
                  size="small"
                  bodyStyle={{ color: "#4472C4" }}
                  style={{ borderColor: "#4472C4", margin: 10 }}
                >
                  <p>良好</p>
                  <p>
                    {pieSum != 0
                      ? ((pieData[3].value * 100) / pieSum).toFixed(1)
                      : 0}
                    % ({pieData[3].value}s){' '}
                  </p>
                </Card>
              </Col>
              <Col span={12}>
                <Card
                  title={
                    <div>
                      <text>{props.type}状态分布</text>
                      <Popover
                        content={
                          <div>
                            5类状态定义为：
                            <br />
                            poor:...
                          </div>
                        }
                      >
                        <QuestionCircleOutlined
                          style={{ marginLeft: '10px' }}
                        />
                      </Popover>
                    </div>
                  }
                >
                  <WrapPie data={pieData}></WrapPie>
                </Card>
              </Col>
              <Col span={6}>
                {' '}
                <Card
                  size="small"
                  bodyStyle={{ color: '#FFC000' }}
                  style={{ borderColor: '#FFC000', margin: 10 }}
                >
                  <p>中等</p>
                  <p>
                    {pieSum != 0
                      ? ((pieData[2].value * 100) / pieSum).toFixed(1)
                      : 0}
                    % ({pieData[2].value}s){' '}
                  </p>
                </Card>{' '}
                <Card
                  size="small"
                  bodyStyle={{ color: '#ED7D31' }}
                  style={{ borderColor: '#ED7D31', margin: 10 }}
                >
                  <p>较差</p>
                  <p>
                    {pieSum != 0
                      ? ((pieData[1].value * 100) / pieSum).toFixed(1)
                      : 0}
                    % ({pieData[1].value}s){' '}
                  </p>
                </Card>{' '}
                <Card
                  size="small"
                  bodyStyle={{ color: '#A5A5A5' }}
                  style={{ borderColor: '#A5A5A5', margin: 10 }}
                >
                  <p>极差</p>
                  <p>
                    {pieSum != 0
                      ? ((pieData[0].value * 100) / pieSum).toFixed(1)
                      : 0}
                    % ({pieData[0].value}s){' '}
                  </p>
                </Card>
              </Col>
            </Row>
          </Col>
        </Row>
        {/* <Box {...config} />  */}
      </Card>
    </Layout>
  );
}
