import { QuestionCircleOutlined } from '@ant-design/icons';
import { Col, Divider, Popover, Row, Switch } from 'antd';
import {
  DetailLineDataItem,
  DualDataItem,
  HandoverDataItem,
  snrLineDataItem,
} from 'defines';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import styles from '../pages.module.css';
import L2Line from './l2Line';

export default function L2Pad(props: any) {
  const {t} = useTranslation()
  const [range, setRange] = useState([0, 1]);
  const [ifWindow, setIfWindow] = useState(false);
  const genL2Detail = () => {
    let lteCnt = 0;
    let nrCnt = 0;
    // let windowData = props.snr.rawData;
    let start = 0;
    let end = mergedData.length - 1;
    if (ifWindow) {
      if (props.status === 0) {
        start = Math.max(Math.floor(mergedData.length * range[0]), 0);
        end = Math.min(
          Math.ceil(mergedData.length * range[1]) - 1,
          mergedData.length - 1
        );
      } else {
        start = Math.max(0, mergedData.length - 100);
        end = mergedData.length - 1;
      }
    }
    const windowData = props.snr.rawData.filter(
      (item: snrLineDataItem) =>
        item.timestamp >= mergedData[start].timestamp &&
        item.timestamp <= mergedData[end].timestamp 
    );

    if (windowData.length > 0) {
      let pointer = Math.ceil(windowData[0].timestamp / 100) * 100;
      let end =
        Math.floor(windowData[windowData.length - 1].timestamp / 100) * 100;
      let index = 1;
      while (pointer <= end) {
        const presentTimestamp = pointer;
        while (
          index < windowData.length &&
          windowData[index].timestamp < presentTimestamp
        ) {
          index++;
        }
        if (
          windowData[index].timestamp - presentTimestamp > 100 &&
          presentTimestamp - windowData[index - 1].timestamp > 100
        ) {
        } else if (
          windowData[index].timestamp - presentTimestamp >=
          presentTimestamp - windowData[index - 1].timestamp
        ) {
          if (windowData[index - 1].rat === 'NR') nrCnt++;
          else lteCnt++;
        } else {
          if (windowData[index].rat === 'NR') nrCnt++;
          else lteCnt++;
        }
        pointer = pointer + 100;
      }
    }
    return (
      <>
        <Row>
          <Col span={18}>
            <Divider orientation="left" style={{ fontSize: 18 }}>
              {"L2"+ t("avail_suf")}
            </Divider>
          </Col>
          <Col span={6}>
            <Row justify="center" align="middle" style={{ height: '100%' }}>
              <Switch
                checkedChildren={t('window')}
                unCheckedChildren={t('global')}
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
            {"LTE " +t("connecttime_suf")}
          </Col>
          <Col span={12} style={{ padding: '10px 0' }}>
            {lteCnt / 10} s
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
            {"5G "+t("connecttime_suf")}
          </Col>
          <Col span={12} style={{ padding: '10px 0' }}>
            {nrCnt / 10} s
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
            {t('total')+t('connecttime_suf')} 
          </Col>
          <Col span={12} style={{ padding: '10px 0' }}>
            {(lteCnt + nrCnt) / 10} s
          </Col>
        </Row>
      </>
    );
  };
  const genHandoverDetail = () => {
    // if (props.notes.length === 0) return <></>;
    let start = 0;
    let end = mergedData.length - 1;
    if (ifWindow) {
      if (props.status === 0) {
        start = Math.floor(mergedData.length * range[0]);
        end = Math.ceil(mergedData.length * range[1]) - 1;
      } else {
        start = Math.max(0, mergedData.length - 100);
        end = mergedData.length - 1;
      }
    }
    const sorteddata = props.notes
      .filter(
        (item: HandoverDataItem) =>
          item.start >= mergedData[start].timestamp &&
          item.end <= mergedData[end].timestamp
      )
      .sort((a: any, b: any) => a.duration - b.duration);
    const successCnt = sorteddata.filter(
      (item: HandoverDataItem) => item.type === 1
    ).length;
    const failCnt = sorteddata.length - successCnt;
    let sum = 0;
    sorteddata.forEach((item: HandoverDataItem) => {
      sum += item.duration;
    });
    return (
      <>
        <Divider orientation="left" style={{ fontSize: 18 }}>Handover</Divider>
        <Row justify="center" align="middle" style={{ marginBottom: 10 }}>
          <Col span={12} className={styles.bigbox}>
            <Row className={styles.bigboxText} align="middle" justify="center">
              <span>{t('frequency')}</span>
            </Row>
            <Row className={styles.bigboxText} align="middle" justify="center">
              {sorteddata.length}
            </Row>
          </Col>
          <Col span={12} className={styles.smallbox} >
            <Row>
              <Col span={24}>{t('numOfSuccess')}: {successCnt}</Col>
            </Row>
            <Row>
              {t('numOfFail')}: {failCnt}
  
            </Row>
            <Row>
            {t('numOfRLF')}: {failCnt} 
            </Row>
          </Col>
        </Row>
        <Row justify="center" align="middle">
          <Col span={12} className={styles.bigbox}>
            <Row className={styles.bigboxText} align="middle" justify="center">
              <span>{t('totalDuration')}</span>
            </Row>
            <Row className={styles.bigboxText} align="middle" justify="center">
              {sum.toFixed(3)}{' '}s
            </Row>
          </Col>
          <Col span={12} className={styles.smallbox}>
            <Row>
              <Col span={24}>{t('maxDuration')}:{' '}
                {sorteddata.length > 0
                  ? sorteddata[sorteddata.length - 1].duration
                  : 0}{' '}
                s
              </Col>
            </Row>
            <Row>
              <Col span={24}>{t('midDuration')}: {' '}
                {sorteddata.length > 0
                  ? sorteddata[Math.floor(sorteddata.length / 2)].duration
                  : 0}{' '}
                s
              </Col>
            </Row>
            <Row>
              <Col span={24}>{t('minDuration')}:{' '}
                {sorteddata.length > 0 ? sorteddata[0].duration : 0} s
              </Col>
            </Row>
          </Col>
        </Row>
      </>
    );
  };

  const l2 = props.snr.data.length;
  const l1 = props.rsrp.data.length;
  let pointer2 = 0; //rtt
  let pointer1 = 0; //thp
  let mergedData = [] as DualDataItem[];
  while (pointer2 < l2 && pointer1 < l1) {
    if (
      props.snr.data[pointer2].timestamp <
      props.rsrp.data[pointer1].timestamp - 0.1
    ) {
      mergedData.push({
        timestamp: props.snr.data[pointer2].timestamp,
        time: props.snr.data[pointer2].time || '',
        second: props.snr.data[pointer2].value,
      });
      pointer2++;
    } else if (
      pointer1 < l1 &&
      props.rsrp.data[pointer1].timestamp <
        props.snr.data[pointer2].timestamp - 0.1
    ) {
      mergedData.push({
        timestamp: props.rsrp.data[pointer1].timestamp,
        time: props.rsrp.data[pointer1].time || '',
        first: props.rsrp.data[pointer1].value,
      });
      pointer1++;
    } else {
      mergedData.push({
        timestamp: props.rsrp.data[pointer1].timestamp,
        time: props.rsrp.data[pointer1].time || '',
        first: props.rsrp.data[pointer1].value,
        second: props.snr.data[pointer2].value,
      });
      pointer1++;
      pointer2++;
    }
  }
  while (pointer1 < l1) {
    mergedData.push({
      timestamp: props.rsrp.data[pointer1].timestamp,
      time: props.rsrp.data[pointer1].time || '',
      first: props.rsrp.data[pointer1].value,
    });
    pointer1++;
  }
  while (pointer2 < l2)   {
    mergedData.push({
      timestamp: props.snr.data[pointer2].timestamp,
      time: props.snr.data[pointer2].time || '',
      second: props.snr.data[pointer2].value,
    });
    pointer2++;
  }

  const genL2Graph = () => {
    return (
      <Col span={16}>
        <Divider orientation="left" style={{ marginTop: '40px' }}>
          <div>
            {' '}
            {t('rsrp')+t('and')+t('snr')+t("timeseries_suf")}{' '}
            <Popover
              content={
                <div>
                  <span style={{ backgroundColor: '#ccff99' }}>绿色区间</span>
                  为successful handover，
                  <span style={{ backgroundColor: '#ff9999' }}>红色区间</span>
                  为failed handover
                </div>
              }
            >
              <QuestionCircleOutlined style={{ marginLeft: '10px' }} />
            </Popover>
          </div>
        </Divider>
        <L2Line
          changeFunc={setRange}
          data={mergedData}
          notes={props.notes}
          extraConfig={{
            yAxis: {
              first: {
                min:
                  props.rsrp.data.length &&
                  Math.min(
                    ...props.rsrp.data.map(
                      (item: DetailLineDataItem) => item.value
                    )
                  ),
                max:
                  props.rsrp.data.length &&
                  Math.max(
                    ...props.rsrp.data.map(
                      (item: DetailLineDataItem) => item.value
                    )
                  ),
                title: {
                  text: 'RSRP(db)',
                },
              },
              second: {
                min:
                  props.snr.data.length &&
                  Math.min(
                    ...props.snr.data.map(
                      (item: DetailLineDataItem) => item.value
                    )
                  ),
                max:
                  props.snr.data.length &&
                  Math.max(
                    ...props.snr.data.map(
                      (item: DetailLineDataItem) => item.value
                    )
                  ),
                title: {
                  text: 'SNR(db)',
                },
              },
            },
          }}
          title={''}
          status={props.status}
        ></L2Line>
      </Col>
    );
  };

  return (
    <Row gutter={[10, 0]}>
      <Col span={8}>
        {genL2Detail()}
        {genHandoverDetail()}
      </Col>
      {genL2Graph()}
    </Row>
  );
}
