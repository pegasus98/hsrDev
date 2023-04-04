import { Card, Col, Descriptions, Divider, Row, Switch } from 'antd';
import VideoLine from './videoLine';
import styles from '../pages.module.css';
import { DetailLineDataItem, DualDataItem } from 'defines';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
export default function videoPad(props: any) {
  const { t } = useTranslation();
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
  const data = props.bitrate.data.filter(
    (item: DetailLineDataItem) =>
      item.timestamp >= mergedData[start].timestamp &&
      item.timestamp <= mergedData[end - 1].timestamp
  );
  const bitrateTag = [0, 1.5, 4.5, 7.5, 12, 24, 60, 110, 160];
  let avg = 0;
  let stdDev = 0;
  let smooth = 0;
  const sumFunc = (a: number, b: number) => a + b;
  let breakCnt = 0;
  let breaks = [];
  let validCnt = 0;
  let pointer = -1;
  for (let i = 0; i < data.length; i++) {
    if (data[i].value === 0) {
      if (pointer < 0) pointer = i;
    } else {
      validCnt += 1;
      if (pointer > 0) {
        breakCnt += i - pointer;
        breaks.push(i - pointer);
        pointer = -1;
      }
    }
  }
  if (data.length > 0) {
    avg =
      data
        .map((item: DetailLineDataItem) => bitrateTag[item.value])
        .reduce(sumFunc) / data.length;
    stdDev = Math.sqrt(
      data
        .map(
          (item: DetailLineDataItem) =>
            (bitrateTag[item.value] - avg) * (bitrateTag[item.value] - avg)
        )
        .reduce(sumFunc) / data.length
    );
    let cnt = 0;
    for (let i = 1; i < data.length; ++i) {
      if (data[i].value < 0 || data[i - 1].value < 0) continue;
      cnt++;
      smooth += Math.abs(
        bitrateTag[data[i].value] - bitrateTag[data[i - 1].value]
      );
    }
    smooth = smooth / cnt;
  }
  const sortedWaiting = breaks.sort();
  return (
    <Row gutter={[10, 0]}>
      <Col span={8}>
        <Row>
          <Col span={18}>
            <Divider orientation="left"> {t('videoQuality')}</Divider>
          </Col>
          <Col span={6}>
            <Switch
              checkedChildren={t('window')}
              unCheckedChildren={t('global')}
              onChange={(checked: boolean) => setIfWindow(checked)}
            />
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
            <span>{t('avgBitrate')}</span>
          </Col>
          <Col span={12} style={{ padding: '10px 0' }}>
            {avg.toFixed(2)} Mbps
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
            <span>{t('stdBitrate')}</span>
          </Col>
          <Col span={12} style={{ padding: '10px 0' }}>
            {stdDev.toFixed(2)} Mbps
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
            <span>{t('smoBitrate')}</span>
          </Col>
          <Col span={12} style={{ padding: '10px 0' }}>
            {smooth.toFixed(2)} Mbps
          </Col>
        </Row>
        <Divider orientation="left"> {t('rebuffer')}</Divider>
        <Row justify="center" align="middle" style={{ marginBottom: 10 }}>
          <Col span={12} className={styles.bigbox}>
            <Row className={styles.bigboxText} align="middle" justify="center">
              <span>{t('rebufferRatio')}</span>
            </Row>
            <Row className={styles.bigboxText} align="middle" justify="center">
              {breakCnt + validCnt > 0
                ? ((breakCnt / (breakCnt + validCnt)) * 100).toFixed(2)
                : 0}
              %
            </Row>
          </Col>
          <Col span={12} className={styles.smallbox}>
            <Row>
              <Col span={24}>
                {t('playbackTime')}: {validCnt / 10} s
              </Col>
            </Row>
            <Row>
              <Col span={24}>
                {t('rebufferTime')}: {breakCnt / 10} s
              </Col>
            </Row>
            <Row>
              <Col span={24}>
                {t('totalTime')}: {(breakCnt + validCnt) / 10} s
              </Col>
            </Row>
          </Col>
        </Row>
        <Row justify="center" align="middle">
          <Col span={12} className={styles.bigbox}>
            <Row className={styles.bigboxText} align="middle" justify="center">
              <span>{t('numOFRebuffer')}</span>
            </Row>
            <Row className={styles.bigboxText} align="middle" justify="center">
              {sortedWaiting.length}
            </Row>
          </Col>
          <Col span={12} className={styles.smallbox}>
            <Row>
              <Col span={24}>
              {t('maxRebuffer')}:{' '}
                {sortedWaiting.length > 0
                  ? sortedWaiting[sortedWaiting.length - 1] / 1000
                  : 0}{' '}
                s
              </Col>
            </Row>
            <Row>
              <Col span={24}>
              {t('midRebuffer')}:{' '}
                {sortedWaiting.length > 0
                  ? sortedWaiting[Math.round(sortedWaiting.length / 2)] / 1000
                  : 0}{' '}
                s
              </Col>
            </Row>
            <Row>
              <Col span={24}>{t('totalRebuffer')}: {breakCnt / 10} s</Col>
            </Row>
          </Col>
        </Row>
      </Col>
      <Col span={16}>
        <Divider orientation="left">{t('bitrate')+t('and')+t('rebuffer')+t('timeseries_suf')}</Divider>
        <VideoLine
          data={mergedData}
          notes={props.notes}
          extraConfig={{}}
          title={''}
          changeFunc={setRange}
          status={props.status}
        ></VideoLine>
      </Col>
    </Row>
  );
}
