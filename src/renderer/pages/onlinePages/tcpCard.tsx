import { Card, Col, Divider, Layout, Row } from 'antd';
import {
  DetailLineDataItem,
  DualDataItem,
  HandoverDataItem,
  KernalDataItem,
  TagedDataItem,
} from 'defines';
import { Item } from 'electron';

import styles from '../pages.module.css';
import TcpLine from './tcpLine';
import TcpSingleLine from './tcpSingleLine';
const createDualData = (
  data1: DetailLineDataItem[],
  data2: DetailLineDataItem[]
) => {
  const l2 = data2.length;
  const l1 = data1.length;
  let pointer2 = 0; //rtt
  let pointer1 = 0; //thp
  let mergedData = [] as DualDataItem[];
  while (pointer2 < l2 && pointer1 < l1) {
    if (data2[pointer2].timestamp < data1[pointer1].timestamp - 0.001) {
      mergedData.push({
        timestamp: data2[pointer2].timestamp,
        time: data2[pointer2].time || '',
        second: data2[pointer2].value,
      });
      pointer2++;
    } else if (
      pointer1 < l1 &&
      data1[pointer1].timestamp < data2[pointer2].timestamp - 0.01
    ) {
      mergedData.push({
        timestamp: data1[pointer1].timestamp,
        time: data1[pointer1].time || '',
        first: data1[pointer1].value,
      });
      pointer1++;
    } else {
      mergedData.push({
        timestamp: data1[pointer1].timestamp,
        time: data1[pointer1].time || '',
        first: data1[pointer1].value,
        second: data2[pointer2].value,
      });
      pointer1++;
      pointer2++;
    }
  }
  while (pointer1 < l1) {
    mergedData.push({
      timestamp: data1[pointer1].timestamp,
      time: data1[pointer1].time || '',
      first: data1[pointer1].value,
    });
    pointer1++;
  }
  while (pointer2 < l2) {
    mergedData.push({
      timestamp: data2[pointer2].timestamp,
      time: data2[pointer2].time || '',
      second: data2[pointer2].value,
    });
    pointer2++;
  }
  return mergedData;
};
const createTwoLineData = (
  data1: DetailLineDataItem[],
  data2: DetailLineDataItem[],
  type1: string,
  type2: string
) => {
  const mergeData: TagedDataItem[] = [
    ...data1.map((item) => ({
      timestamp: item.timestamp,
      type: type1,
      value: item.value,
    })),
    ...data2.map((item) => ({
      timestamp: item.timestamp,
      type: type2,
      value: item.value,
    })),
  ];
  return mergeData
};

export default function TcpCard(props: {
  kernal: { data: KernalDataItem[] };
  serverThp: { data: DetailLineDataItem[] };
  serverRtt: { data: DetailLineDataItem[] };
  clientSum: number;
  status: number;
  notes:HandoverDataItem[];
}) {
  const cwndData: DetailLineDataItem[] = props.kernal.data.map((item) => ({
    timestamp: item.stamp,
    time: item.time,
    value: item.cwnd,
  }));
  const bltbwData: DetailLineDataItem[] = props.kernal.data.map((item) => ({
    timestamp: item.stamp,
    time: item.time,

    value: item.bltBw,
  }));
  const rttData: DetailLineDataItem[] = props.serverRtt.data.map((item) => ({
    timestamp: item.timestamp,
    time: item.time,

    value: item.value * 1000,
  }));
  const thpData: DetailLineDataItem[] = props.serverThp.data.map((item) => ({
    timestamp: item.timestamp,
    time: item.time,

    value: (item.value * 8) / 100000,
  }));
  const minrttData: DetailLineDataItem[] = props.kernal.data.map((item) => ({
    timestamp: item.stamp,
    time: item.time,
    value: item.minRtt,
  }));
  const calData: DetailLineDataItem[] = props.kernal.data.map((item) => ({
    timestamp: item.stamp,
    time: item.time,

    value: (item.bltBw * item.minRtt * 2) / 1000 / 8,
  }));
  const plotData1 = createTwoLineData(rttData, minrttData,"avgRtt","minRtt");
  const plotData2 = createTwoLineData(thpData, bltbwData,"Throughput","BltBw");
  const plotData3 = createTwoLineData(cwndData, calData,"CWND","minRTT*BltBw*2");
  //   const l2 = props.serverRtt.data.length;
  //   const l1 = props.kernal.data.length;
  //   let pointer2 = 0; //rtt
  //   let pointer1 = 0; //thp
  //   let mergedData = [] as DualDataItem[];
  //   while (pointer2 < l2 && pointer1 < l1) {
  //     if (
  //       props.serverRtt.data[pointer2].timestamp <
  //       props.kernal.data[pointer1].stamp - 0.001
  //     ) {
  //       mergedData.push({
  //         timestamp: props.serverRtt.data[pointer2].timestamp,
  //         time: props.serverRtt.data[pointer2].time || '',
  //         second: props.serverRtt.data[pointer2].value * 1000,
  //       });
  //       pointer2++;
  //     } else if (
  //       pointer1 < l1 &&
  //       props.kernal.data[pointer1].stamp <
  //         props.serverRtt.data[pointer2].timestamp - 0.01
  //     ) {
  //       mergedData.push({
  //         timestamp: props.kernal.data[pointer1].stamp,
  //         time: props.kernal.data[pointer1].time || '',
  //         first: props.kernal.data[pointer1].cwnd,
  //       });
  //       pointer1++;
  //     } else {
  //       mergedData.push({
  //         timestamp: props.kernal.data[pointer1].stamp,
  //         time: props.kernal.data[pointer1].time || '',
  //         first: props.kernal.data[pointer1].cwnd,
  //         second: props.serverRtt.data[pointer2].value * 1000,
  //       });
  //       pointer1++;
  //       pointer2++;
  //     }
  //   }
  //   while (pointer1 < l1) {
  //     mergedData.push({
  //       timestamp: props.kernal.data[pointer1].stamp,
  //       time: props.kernal.data[pointer1].time || '',
  //       first: props.kernal.data[pointer1].cwnd,
  //     });
  //     pointer1++;
  //   }
  //   while (pointer2 < l2) {
  //     mergedData.push({
  //       timestamp: props.serverRtt.data[pointer2].timestamp,
  //       time: props.serverRtt.data[pointer2].time || '',
  //       second: props.serverRtt.data[pointer2].value * 1000,
  //     });
  //     pointer2++;
  //   }

  return (
    <Layout>
      <Card style={{ marginTop: -24 }} bordered={false}>
        <Row
          justify="center"
          align="middle"
          style={{ marginBottom: 10 }}
          gutter={30}
        >
          <Col span={24}>
            <Divider orientation="left">{"RTT & minRTT Timeseries"}</Divider>
            <TcpSingleLine
              data={plotData1}
              notes={props.notes}
              extraConfig={{
                legend: {
                  items: [
                    {
                      name: 'avgRtt',
                      marker: {
                        style: {
                          fill: '#096dd9',
                        },
                      },
                    },
                    {
                      name: 'minRtt',
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
              }}
              title={''}
              status={props.status}
            ></TcpSingleLine>
          </Col>
        </Row>
        <Row
          justify="center"
          align="middle"
          style={{ marginBottom: 10 }}
          gutter={30}
        >
          <Col span={24}>
            <Divider orientation="left">{"Throughput & BltBW Timeseries"}</Divider>
            <TcpSingleLine
              data={plotData2}
              notes={props.notes}
              extraConfig={{
                legend: {
                  items: [
                    {
                      name: 'Throughput',
                      marker: {
                        style: {
                          fill: '#096dd9',
                        },
                      },
                    },
                    {
                      name: 'BltBw',
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

                
              }}
              title={''}
              status={props.status}
            ></TcpSingleLine>
          </Col>
        </Row>
        <Row
          justify="center"
          align="middle"
          style={{ marginBottom: 10 }}
          gutter={30}
        >
          <Col span={24}>
            <Divider orientation="left">{"CWND & minRTT*BltBW*2 Timeseries"}</Divider>
            <TcpSingleLine
              data={plotData3}
              notes={props.notes}
              extraConfig={{
                legend: {
                  items: [
                    {
                      name: 'CWND',
                      marker: {
                        style: {
                          fill: '#096dd9',
                        },
                      },
                    },
                    {
                      name: 'minRTT*BltBw*2',
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
              }}
              title={''}
              status={props.status}
            ></TcpSingleLine>
          </Col>
        </Row>
      </Card>
    </Layout>
  );
}
