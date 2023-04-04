import {
  Card,
  Col,
  Descriptions,
  Divider,
  Layout,
  Popover,
  Row,
  Switch,
} from 'antd';
import VideoLine from './onlinePages/videoLine';
import styles from './pages.module.css';
import { DetailLineDataItem, DualDataItem } from 'defines';
import { useState } from 'react';
import { QuestionCircleOutlined } from '@ant-design/icons';
import WrapPie from './wrapPie';
import { useTranslation } from 'react-i18next';
const analysisData = (
  border: number[],
  labels: string[],
  data: DetailLineDataItem[]
) => {
  let sum = 0;
  let types = [0, 0, 0, 0, 0];
  let pointer = 4;
  if (data.length === 0) {
    return [
      { type: labels[0], value: types[0] },
      { type: labels[1], value: types[1] },
      { type: labels[2], value: types[2] },
      { type: labels[3], value: types[3] },
      { type: labels[4], value: types[4] },
    ];
  }
  //const sorteddata=data.sort((a,b)=>(b.value-a.value)) //大到小  thp最大值未知
  const sorteddata = data.concat([]);
  sorteddata.sort((a, b) => b.value - a.value);

  for (let i = 0; i < sorteddata.length; i++) {
    sum += sorteddata[i].value;
    while (border[pointer] > sorteddata[i].value) pointer--;
    types[pointer]++;
  }

  return [
    { type: labels[0], value: types[0] },
    { type: labels[1], value: types[1] },
    { type: labels[2], value: types[2] },
    { type: labels[3], value: types[3] },
    { type: labels[4], value: types[4] },
  ];
};

export default function VideoCard(props: any) {
  const {t} = useTranslation()
  const [range, setRange] = useState([0, 1]);
  const [ifWindow, setIfWindow] = useState(false);
  let mergedData = [] as DualDataItem[];
  let pointer2 = 0; //buffer
  let pointer1 = 0; //bitrate
  const l2 = props.buffer.data.length;
  const l1 = props.bitrate.data.length;
  while (pointer2 < l2 && pointer1 < l1) {
    if (
      props.buffer.data[pointer2].timestamp <
      props.bitrate.data[pointer1].timestamp - 0.001
    ) {
      mergedData.push({
        timestamp: props.buffer.data[pointer2].timestamp,
        time: props.buffer.data[pointer2].time,
        second: props.buffer.data[pointer2].value,
      });
      pointer2++;
    } else if (
      pointer1 < l1 &&
      props.bitrate.data[pointer1].timestamp <
        props.buffer.data[pointer2].timestamp - 0.01
    ) {
      mergedData.push({
        timestamp: props.bitrate.data[pointer1].timestamp,
        time: props.bitrate.data[pointer1].time,
        first:
          props.bitrate.data[pointer1].value >= 0
            ? props.bitrate.data[pointer1].value
            : undefined,
      });
      pointer1++;
    } else {
      mergedData.push({
        timestamp: props.bitrate.data[pointer1].timestamp,
        time: props.bitrate.data[pointer1].time,
        first:
          props.bitrate.data[pointer1].value >= 0
            ? props.bitrate.data[pointer1].value
            : undefined,
        second: props.buffer.data[pointer2].value,
      });
      pointer1++;
      pointer2++;
    }
  }
  while (pointer1 < l1) {
    mergedData.push({
      timestamp: props.bitrate.data[pointer1].timestamp,
      time: props.bitrate.data[pointer1].time,
      first:
        props.bitrate.data[pointer1].value >= 0
          ? props.bitrate.data[pointer1].value
          : undefined,
    });
    pointer1++;
  }
  while (pointer2 < l2) {
    mergedData.push({
      timestamp: props.buffer.data[pointer2].timestamp,
      time: props.buffer.data[pointer2].time,
      second: props.buffer.data[pointer2].value,
    });
    pointer2++;
  }
  let start = 0;
  let end = mergedData.length;
  if (ifWindow) {
    if (props.status === 0) {
      start = Math.floor(mergedData.length * range[0]);
      end = Math.ceil(mergedData.length * range[1]);
    } else {
      start = Math.max(0, mergedData.length - 100);
      end = mergedData.length;
    }
  }
  const bitrateData = props.bitrate.data.filter(
    (item: DetailLineDataItem) =>
      item.timestamp >= mergedData[start].timestamp &&
      item.timestamp <= mergedData[end - 1].timestamp
  );
  const bufferData = props.buffer.data.filter(
    (item: DetailLineDataItem) =>
      item.timestamp >= mergedData[start].timestamp &&
      item.timestamp <= mergedData[end - 1].timestamp
  );
  // [0,1) ....[5,+inf)
  const bitratePieData = analysisData(
    [-1000, 3, 4, 5, 6],
    ['≤480p', '720p', '1080p', '1440p', '≥4K'],
    bitrateData
  );
  const bufferPieData = analysisData(
    [0, 0.01, 1, 2, 3],
    ['Empty', 'Poor', 'Average', 'Good', 'Full'],
    bufferData
  );
  return (
    <Layout>
      <Card style={{ marginTop: -24 }} bordered={false}>
        <Row gutter={[10, 0]}>
          <Col span={24}>
            <Card
              style={{ height: '100%' }}
              title={
                <div>
                  {t("videoStatistics")}
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
              <VideoLine
                data={mergedData}
                notes={props.notes}
                extraConfig={{}}
                title={''}
                changeFunc={setRange}
                status={props.status}
              ></VideoLine>
            </Card>
          </Col>
        </Row>
        <Row>
          <Col span={10}>
            <Row>
              <Col span={6} style={{ padding: 20 }}>
                {' '}
                <Card
                  size="small"
                  bodyStyle={{ color: '#5B9BD5' }}
                  style={{ borderColor: '#5B9BD5', margin: 10 }}
                >
                  <p> {bitratePieData[4].type}</p>
                  <p>
                    {props.bitrate.data.length != 0
                      ? (
                          (bitratePieData[4].value * 100) /
                          props.bitrate.data.length
                        ).toFixed(1)
                      : 0}
                    %
                    <br />({bitratePieData[4].value / 10} s){' '}
                  </p>
                </Card>{' '}
                <Card
                  size="small"
                  bodyStyle={{ color: '#4472C4' }}
                  style={{ borderColor: '#4472C4', margin: 10 }}
                >
                  <p>{bitratePieData[3].type}</p>
                  <p>
                    {props.bitrate.data.length != 0
                      ? (
                          (bitratePieData[3].value * 100) /
                          props.bitrate.data.length
                        ).toFixed(1)
                      : 0}
                    %
                    <br /> ({bitratePieData[3].value / 10} s){' '}
                  </p>
                </Card>
              </Col>
              <Col span={12}>
                <Card
                  title={
                    <div>
                      <text>Bitrate Distribution</text>
                      <Popover
                        content={
                          <div>
                            5类状态定义为：
                            <br />
                            ≤480p: 码率小于等于4Mbps
                            <br />
                            720p: 码率等于7.5Mbps
                            <br /> 
                            1080p: 码率等于12Mpbs
                            <br />
                            1440p: 码率等于24Mpbs
                            <br />
                            ≥4K: 码率大于60Mbps
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
                  <WrapPie data={bitratePieData}></WrapPie>
                </Card>
              </Col>
              <Col span={6}>
                <Card
                  size="small"
                  bodyStyle={{ color: '#FFC000' }}
                  style={{ borderColor: '#FFC000', margin: 10 }}
                >
                  <p>{bitratePieData[2].type}</p>
                  <p>
                    {props.bitrate.data.length != 0
                      ? (
                          (bitratePieData[2].value * 100) /
                          props.bitrate.data.length
                        ).toFixed(1)
                      : 0}
                    %{' '}
                  </p>
                  <p>({bitratePieData[2].value / 10} s) </p>
                </Card>{' '}
                <Card
                  size="small"
                  bodyStyle={{ color: '#ED7D31' }}
                  style={{ borderColor: '#ED7D31', margin: 10 }}
                >
                  <p>{bitratePieData[1].type}</p>
                  <p>
                    {props.bitrate.data.length != 0
                      ? (
                          (bitratePieData[1].value * 100) /
                          props.bitrate.data.length
                        ).toFixed(1)
                      : 0}
                    %
                    <br /> ({bitratePieData[1].value / 10} s){' '}
                  </p>
                </Card>{' '}
                <Card
                  size="small"
                  bodyStyle={{ color: '#A5A5A5' }}
                  style={{ borderColor: '#A5A5A5', margin: 10 }}
                >
                  <p>{bitratePieData[0].type}</p>
                  <p>
                    {props.bitrate.data.length != 0
                      ? (
                          (bitratePieData[0].value * 100) /
                          props.bitrate.data.length
                        ).toFixed(1)
                      : 0}
                    %
                    <br />({bitratePieData[0].value / 10} s){' '}
                  </p>
                </Card>
              </Col>
            </Row>
          </Col>
          <Col span={4}>
            <Switch
              checkedChildren="Window"
              unCheckedChildren="Global"
              onChange={(checked: boolean) => setIfWindow(checked)}
            />
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
                  <p> {bufferPieData[4].type}</p>
                  <p>
                    {props.buffer.data.length != 0
                      ? (
                          (bufferPieData[4].value * 100) /
                          props.buffer.data.length
                        ).toFixed(1)
                      : 0}
                    % <br />({bufferPieData[4].value / 10}s){' '}
                  </p>
                </Card>{' '}
                <Card
                  size="small"
                  bodyStyle={{ color: '#4472C4' }}
                  style={{ borderColor: '#4472C4', margin: 10 }}
                >
                  <p> {bufferPieData[3].type}</p>
                  <p>
                    {props.buffer.data.length != 0
                      ? (
                          (bufferPieData[3].value * 100) /
                          props.buffer.data.length
                        ).toFixed(1)
                      : 0}
                    %<br /> ({bufferPieData[3].value / 10}s){' '}
                  </p>
                </Card>
              </Col>
              <Col span={12}>
                <Card
                  title={
                    <div>
                      <text>Buffer Distribution</text>
                      <Popover
                        content={
                          <div>
                           5类状态定义为：
                            <br />
                            空: 缓冲区等于0
                            <br />
                            不足: 缓冲区大于0s小于1s
                            <br /> 
                            Average: 缓冲区大于1s小于2s
                            <br />
                            充足: 缓冲区大于2s小于3s
                            <br />
                            满: 缓冲区大于3s
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
                  <WrapPie data={bufferPieData}></WrapPie>
                </Card>
              </Col>
              <Col span={6}>
                <Card
                  size="small"
                  bodyStyle={{ color: '#FFC000' }}
                  style={{ borderColor: '#FFC000', margin: 10 }}
                >
                  <p> {bufferPieData[2].type}</p>
                  <p>
                    {props.buffer.data.length != 0
                      ? (
                          (bufferPieData[2].value * 100) /
                          props.buffer.data.length
                        ).toFixed(1)
                      : 0}
                    %<br />({bufferPieData[2].value / 10}s){' '}
                  </p>
                </Card>{' '}
                <Card
                  size="small"
                  bodyStyle={{ color: '#ED7D31' }}
                  style={{ borderColor: '#ED7D31', margin: 10 }}
                >
                  <p> {bufferPieData[1].type}</p>
                  <p>
                    {props.buffer.data.length != 0
                      ? (
                          (bufferPieData[1].value * 100) /
                          props.buffer.data.length
                        ).toFixed(1)
                      : 0}
                    %<br /> ({bufferPieData[1].value / 10}s){' '}
                  </p>
                </Card>{' '}
                <Card
                  size="small"
                  bodyStyle={{ color: '#A5A5A5' }}
                  style={{ borderColor: '#A5A5A5', margin: 10 }}
                >
                  <p> {bufferPieData[0].type}</p>
                  <p>
                    {props.buffer.data.length != 0
                      ? (
                          (bufferPieData[0].value * 100) /
                          props.buffer.data.length
                        ).toFixed(1)
                      : 0}
                    %<br /> ({bufferPieData[0].value / 10}s){' '}
                  </p>
                </Card>
              </Col>
            </Row>
          </Col>
        </Row>
      </Card>
    </Layout>
  );
}
