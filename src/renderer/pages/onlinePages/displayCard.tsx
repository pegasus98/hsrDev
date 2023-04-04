import { QuestionCircleOutlined } from '@ant-design/icons';
import { Card, Row, Col, Layout, Popover, Space, Divider, Switch } from 'antd';
import { DetailLineDataItem } from 'defines';
import { Box } from '@ant-design/plots';
import NotedLine from '../notedLine';
import WrapPie from '../wrapPie';
import { Chart, Axis, Tooltip, Schema } from 'bizcharts';
import DataSet from '@antv/data-set';
import styles from '../pages.module.css';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { t } from 'i18next';
const { DataView } = DataSet;
const analysisData = (type: string, data: DetailLineDataItem[]) => {
  const {t} = useTranslation()
  let sum = 0;
  let types = [0, 0, 0, 0, 0];
  let board = [0, 0, 0, 0, 0];
  let pointer = 4;
  if (data.length === 0) {
    return {
      average: 0,
      pieData: [
        { type: t('poor'), value: types[0] },
        { type: t('fair'), value: types[1] },
        { type: t('average'), value: types[2] },
        { type: t('good'), value: types[3] },
        { type: t('excellent'), value: types[4] },
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
  if (type === 'rb') board = [-100, 20, 40, 60, 80];
  for (let i = 0; i < sorteddata.length; i++) {
    sum += sorteddata[i].value;
    while (board[pointer] > sorteddata[i].value) pointer--;
    types[pointer]++;
  }

  return {
    average: sum / data.length,
    pieData: [
      { type: t('poor'), value: types[0] },
      { type: t('fair'), value: types[1] },
      { type: t('average'), value: types[2] },
      { type: t('good'), value: types[3] },
      { type: t('excellent'), value: types[4] },
    ],
    v100: sorteddata[0].value.toFixed(1),
    v75: sorteddata[Math.floor(sorteddata.length / 4)].value.toFixed(1),
    v50: sorteddata[Math.floor(sorteddata.length / 2)].value.toFixed(1),
    v25: sorteddata[Math.floor((sorteddata.length * 3) / 4)].value.toFixed(1),
    v0: sorteddata[sorteddata.length - 1].value.toFixed(1),
  };
};

const renderHelperText = (type: string) => {
  const SNRText = (
    <div>
      5类状态定义为:
      <br />
      Excellent: SNR大于25dB
      <br />
      Good: SNR小于25dB大于15dB
      <br />
      {t('average')}: SNR小于15dB大于5dB
      <br />
      {t('fair')}: SNR小于5dB大于-5dB
      <br />
      {t('poor')}: SNR小于-5dB
    </div>
  );
  const RSRPText = (
    <div>
      5类状态定义为：
      <br />
      Excellent: RSRP大于-75dB
      <br />
      Good: RSRP小于-75dB大于-85dB
      <br />
      {t('average')}: RSRP小于-85dB大于-95dB
      <br />
      {t('fair')}: RSRP小于-95dB大于-105dB
      <br />
      {t('poor')}: RSRP小于-105dB
    </div>
  );
  const ThroughputText = (
    <div>
      5类状态定义为：
      <br />
      Excellent: Throughput大于50Mbps
      <br />
      Good: Throughput小于50Mbps大于20Mbps
      <br />
      {t('average')}: Throughput小于20Mbps大于5Mbps
      <br />
      {t('fair')}: Throughput小于5Mbps大于1Mbps
      <br />
      {t('poor')}: Throughput小于1Mpbs
    </div>
  );
  const rbText = (
    <div>
      5类状态定义为：
      <br />
      Excellent: rbUtil大于80%
      <br />
      Good: rbUtil小于80%大于60%
      <br />
      {t('average')}: rbUtil小于60%大于40%
      <br />
      {t('fair')}: rbUtil小于40%大于20%
      <br />
      {t('poor')}: rbUtil小于20%
    </div>
  );
  switch (type) {
    case 'rsrp':
      return RSRPText;
    case 'snr':
      return SNRText;
    case 'throughput':
      return ThroughputText;
    case 'rb':
      return rbText
    default:
      return '';
  }
};

export default function DisplayCard(props: any) {
  const [range, setRange] = useState([0, 1]);
  const [ifWindow, setIfWindow] = useState(false);

  let start = 0;
  let end = props.data.length;
  if (ifWindow) {
    if (props.status === 0) {
      start = Math.floor(props.data.length * range[0]);
      end = Math.ceil(props.data.length * range[1]);
    } else {
      start = props.data.length - 100;
      end = props.data.length;
    }
  }
  const data = props.data.slice(start, end);
  const { average, pieData, v0, v25, v50, v75, v100 } = analysisData(
    props.type,
    data
  );
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
                        为successful handover，
                        <span style={{ backgroundColor: '#ff9999' }}>
                          红色区间
                        </span>
                        为failed handover
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
                changeFunc={setRange}
                extraConfig={props.extraConfig}
                title={props.title}
                status={props.status}
              ></NotedLine>
            </Card>
          </Col>
        </Row>
        <Row justify="center" align="top">
          <Col span={14} style={{ height: '100%' }}>
            <Row>
              <Col span={20}>
                <Divider orientation="left">{t('quantile')}</Divider>
              </Col>
            </Row>
            <Row gutter={10}>
              <Col span={24 / 6}>
                <Card
                  bodyStyle={{ color: '#8B0012' }}
                  style={{ borderColor: '#8B0012' }}
                >
                  <p>{t('min')}</p>
                  <p>{v0}</p>
                </Card>
              </Col>
              <Col span={24 / 6}>
                <Card
                  bodyStyle={{ color: '#8B0012' }}
                  style={{ borderColor: '#8B0012' }}
                >
                  <p>25%</p>
                  <p>{v25}</p>
                </Card>
              </Col>
              <Col span={24 / 6}>
                <Card
                  bodyStyle={{ color: '#8B0012' }}
                  style={{ borderColor: '#8B0012' }}
                >
                  <p>{t('mid')}</p>
                  <p>{v50}</p>
                </Card>
              </Col>
              <Col span={24 / 6}>
                <Card
                  bodyStyle={{ color: '#8B0012' }}
                  style={{ borderColor: '#8B0012' }}
                >
                  <p>75%</p>
                  <p>{v75}</p>
                </Card>
              </Col>
              <Col span={24 / 6}>
                <Card
                  bodyStyle={{ color: '#8B0012' }}
                  style={{ borderColor: '#8B0012' }}
                >
                  <p>{t('max')}</p>
                  <p>{v100}</p>
                </Card>
              </Col>
              <Col span={4}>
                <Switch
                  checkedChildren={t("window")}
                  unCheckedChildren={t("global")}
                  onChange={(checked: boolean) => setIfWindow(checked)}
                />
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
                  <p> {t('excellent')}</p>
                  <p>
                    {data.length != 0
                      ? ((pieData[4].value * 100) / data.length).toFixed(1)
                      : 0}
                    % <br />({pieData[4].value / 10} s){' '}
                  </p>
                </Card>{' '}
                <Card
                  size="small"
                  bodyStyle={{ color: '#4472C4' }}
                  style={{ borderColor: '#4472C4', margin: 10 }}
                >
                  <p>{t('good')}</p>
                  <p>
                    {data.length != 0
                      ? ((pieData[3].value * 100) / data.length).toFixed(1)
                      : 0}
                    % <br /> ({pieData[3].value / 10} s){' '}
                  </p>
                </Card>
              </Col>
              <Col span={12}>
                <Card
                  bordered={false}
                  title={
                    <div>
                      <span>{props.title+t('distribution_suf')}</span>
                      <Popover content={renderHelperText(props.type)}>
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
                <Card
                  size="small"
                  bodyStyle={{ color: '#FFC000' }}
                  style={{ borderColor: '#FFC000', margin: 10 }}
                >
                  <p>{t('average')}</p>
                  <p>
                    {data.length != 0
                      ? ((pieData[2].value * 100) / data.length).toFixed(1)
                      : 0}
                    % <br />({pieData[2].value / 10} s){' '}
                  </p>
                </Card>{' '}
                <Card
                  size="small"
                  bodyStyle={{ color: '#ED7D31' }}
                  style={{ borderColor: '#ED7D31', margin: 10 }}
                >
                  <p>{t('fair')}</p>
                  <p>
                    {data.length != 0
                      ? ((pieData[1].value * 100) / data.length).toFixed(1)
                      : 0}
                    % <br /> ({pieData[1].value / 10} s){' '}
                  </p>
                </Card>{' '}
                <Card
                  size="small"
                  bodyStyle={{ color: '#A5A5A5' }}
                  style={{ borderColor: '#A5A5A5', margin: 10 }}
                >
                  <p>{t('poor')}</p>
                  <p>
                    {data.length != 0
                      ? ((pieData[0].value * 100) / data.length).toFixed(1)
                      : 0}
                    %<br /> ({pieData[0].value / 10} s){' '}
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
