import { Col, Divider, Row, Switch } from 'antd';
import { DetailLineDataItem, DualDataItem, HandoverDataItem, KernalDataItem } from 'defines';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import styles from '../pages.module.css';
import TcpLine from './tcpLine';
export default function TcpPad(props: {
  kernal: { data: KernalDataItem[] };
  serverThp: { data: DetailLineDataItem[] };
  serverRtt: { data: DetailLineDataItem[] };
  clientSum: number;
  status: number;
  notes:HandoverDataItem[];
}) {
  const [range, setRange] = useState([0, 1]);
  const {t} = useTranslation()
  const [ifWindow, setIfWindow] = useState(false);
  let middleCwnd = 0;
  let middleBltbw = 0;


  let minRtt = 0;
  let Rtt95 = 0;
  let middleRtt = 0;
  const l2 = props.serverRtt.data.length;
  const l1 = props.kernal.data.length;
  console.log(l1,l2);
  let pointer2 = 0; //rtt
  let pointer1 = 0; //thp
  let mergedData = [] as DualDataItem[];
  while (pointer2 < l2 && pointer1 < l1) {
    if (
      props.serverRtt.data[pointer2].timestamp <
      props.kernal.data[pointer1].stamp - 0.001
    ) {
      mergedData.push({
        timestamp: props.serverRtt.data[pointer2].timestamp,
        time: props.serverRtt.data[pointer2].time || '',
        second: props.serverRtt.data[pointer2].value * 1000,
      });
      pointer2++;
    } else if (
      pointer1 < l1 &&
      props.kernal.data[pointer1].stamp <
        props.serverRtt.data[pointer2].timestamp - 0.01
    ) {
      mergedData.push({
        timestamp: props.kernal.data[pointer1].stamp,
        time: props.kernal.data[pointer1].time || '',
        first: props.kernal.data[pointer1].cwnd,
      });
      pointer1++;
    } else {
      mergedData.push({
        timestamp: props.kernal.data[pointer1].stamp,
        time: props.kernal.data[pointer1].time || '',
        first: props.kernal.data[pointer1].cwnd,
        second: props.serverRtt.data[pointer2].value * 1000,
      });
      pointer1++;
      pointer2++;
    }
  }
  while (pointer1 < l1) {
    mergedData.push({
      timestamp: props.kernal.data[pointer1].stamp,
      time: props.kernal.data[pointer1].time || '',
      first: props.kernal.data[pointer1].cwnd,
    });
    pointer1++;
  }
  while (pointer2 < l2) {
    mergedData.push({
      timestamp: props.serverRtt.data[pointer2].timestamp,
      time: props.serverRtt.data[pointer2].time || '',
      second: props.serverRtt.data[pointer2].value * 1000,
    });
    pointer2++;
  }
  let start = 0;
  let end = mergedData.length-1;
  if (ifWindow) {
    if (props.status === 0) {
      start = Math.floor(mergedData.length * range[0]);
      end = Math.ceil(mergedData.length * range[1])-1;
     
    } else {
      start = Math.max(0,mergedData.length-100);
      end = mergedData.length-1
    }
  }
  const data = props.kernal.data.filter(item=>(item.stamp>=mergedData[start].timestamp&&item.stamp<=mergedData[end].timestamp));

  if (data.length > 0) {
    data.sort((a, b) => a.cwnd - b.cwnd);
    const half = Math.floor(data.length / 2);
    middleCwnd = data[half].cwnd;
    data.sort((a, b) => a.bltBw - b.bltBw);
    middleBltbw = data[half].bltBw;
  }

  const rtt = props.serverRtt.data.filter((item) => item.value&&item.timestamp>=mergedData[start].timestamp&&item.timestamp<=mergedData[end].timestamp);
  if (rtt.length > 0) {
    rtt.sort((a, b) => a.value - b.value);
    minRtt = rtt[0].value;
    Rtt95 = rtt[Math.floor(0.95 * rtt.length)].value;
    middleRtt = rtt[Math.floor(rtt.length / 2)].value;
  }
  console.log(rtt);
  return (
    <Row gutter={[10, 0]}>
      <Col span={8}>
        <Row>
          <Col span={18}>
            <Divider orientation="left" className={styles.tableText}>
            {t('latency')}
            </Divider>
          </Col>
          <Col span={6}>
            <Row justify="center" align="middle" style={{ height: '100%' }}>
              <Switch
                checkedChildren={t('window')}
                unCheckedChildren={t("global")}
                onChange={(checked: boolean) => setIfWindow(checked)}
              />
            </Row>
          </Col>
        </Row>
        <Row
          style={{
            border: '1px solid #DAE3F3',
            fontSize: '20px',
            margin: '1px',
          }}
          justify="center"
          align="middle"
        >
          <Col
            span={12}
            style={{ backgroundColor: '#DAE3F3', padding: '10px 0' }}
          >
           {t('minRtt')}
          </Col>
          <Col span={12} style={{ padding: '10px 0' }}>
            {(minRtt * 1000).toFixed(1)} ms
          </Col>
        </Row>
        <Row
          style={{
            border: '1px solid #DAE3F3',
            fontSize: '20px',
            margin: '1px',
          }}
          justify="center"
          align="middle"
        >
          <Col
            span={12}
            style={{ backgroundColor: '#DAE3F3', padding: '10px 0' }}
          >
           {t("rtt95")}
          </Col>
          <Col span={12} style={{ padding: '10px 0' }}>
            {(Rtt95 * 1000).toFixed(1)} ms
          </Col>
        </Row>
        <Row
          style={{
            border: '1px solid #DAE3F3',
            fontSize: '20px',
            margin: '1px',
          }}
          justify="center"
          align="middle"
        >
          <Col
            span={12}
            style={{ backgroundColor: '#DAE3F3', padding: '10px 0' }}
          >
            {t('midRtt')}
          </Col>
          <Col span={12} style={{ padding: '10px 0' }}>
            {(middleRtt * 1000).toFixed(1)} ms
          </Col>
        </Row>

        {/* <Divider orientation="left"> 丢包</Divider>
        <Row
          style={{
            border: '1px solid #DAE3F3',
            fontSize: '20px',
            margin: '1px',
          }}
          justify="center"
          align="middle"
        >
          <Col
            span={12}
            style={{ backgroundColor: '#DAE3F3', padding: '10px 0' }}
          >
            丢包率
          </Col>
          <Col span={12} style={{ padding: '10px 0' }}>
            {serverSum>0? (props.clientSum/serverSum*100).toFixed(1):0} %
          </Col>
        </Row> */}

        <Divider orientation="left"> CWND</Divider>
        <Row
          justify="center"
          align="middle"
          style={{ marginBottom: 10 }}
          gutter={30}
        >
          <Col span={10} className={styles.bigbox} style={{ margin: 5 }}>
            <Row className={styles.bigboxText} align="middle" justify="center">
              <span>{t('midBltbw')}</span>
            </Row>
            <Row className={styles.bigboxText} align="middle" justify="center">
              {middleBltbw.toFixed(2)} Mbps
            </Row>
          </Col>
          <Col span={10} className={styles.bigbox} style={{ margin: 5 }}>
            <Row className={styles.bigboxText} align="middle" justify="center">
              <span>{t('midCWND')}</span>
            </Row>
            <Row className={styles.bigboxText} align="middle" justify="center">
              {middleCwnd.toFixed(2)} MiB
            </Row>
          </Col>
        </Row>
      </Col>
      <Col span={16}>
        <Divider orientation="left">{t("rtt")+t('and')+t('cwnd')+t("timeseries_suf")}</Divider>
        <TcpLine
          changeFunc={setRange}
          data={mergedData}
          notes={props.notes}
          extraConfig={{
            yAxis: {
              first: {
                min: 0,
                max: props.kernal.data.length &&Math.max(...props.kernal.data.map(item=>item.cwnd)),
                title: {
                  text: 'CWND(MiB)',
                },
              },
              second: {
                min: 0,
                max: props.serverRtt.data.length &&Math.max(...props.serverRtt.data.map(item=>item.value*1000)),
                title: {
                  text: 'RTT(ms)',
                },
              },
            },
          }}
          title={''}
          status={props.status}
        ></TcpLine>
      </Col>
    </Row>
  );
}
