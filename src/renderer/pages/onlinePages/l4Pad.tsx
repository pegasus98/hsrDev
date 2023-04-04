import { Col, Divider, Row, Switch } from 'antd';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import NotedLine from '../notedLine';
import styles from '../pages.module.css';

export default function L4Pad(props: any) {
  const {t} = useTranslation()
  const [range, setRange] = useState([0, 1]);
  const [ifWindow, setIfWindow] = useState(false);
  const genL4Detail = () => {
    let breakCnt = 0;
    let breaks = [];
    let timeCnt = 0;
    let validCnt = 0;
    let sum = 0;
    let i = 0;
    let breaksSum = 0;
    let windowData = props.throughput.data;
    let totalsum = 0;
    props.throughput.data.forEach((item: any) => {
      totalsum += item.value;
    });
    if (ifWindow) {
      if (props.status === 0) {
        const start = Math.floor(props.throughput.data.length * range[0]);
        const end = Math.ceil(props.throughput.data.length * range[1]);
        windowData = props.throughput.data.slice(start, end);
      } else {
        windowData = props.throughput.data.slice(-100);
      }
    }
    while (i < windowData.length && windowData[i].value === 0) i++;
    let pointer = -1;
    for (; i < windowData.length; i++) {
      if (windowData[i].value === 0) {
        if (pointer < 0) pointer = i;
      } else {
        sum += windowData[i].value;
        validCnt += 1;
        if (pointer > 0) {
          breakCnt += 1;
          breaks.push(i - pointer);
          timeCnt += i - pointer;
          pointer = -1;
        }
      }
    }
    breaks.sort();
    breaks.forEach((value: number) => {
      breaksSum += value;
    });

    return (
      <Col span={8}>
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
            {t('avgThpWindow')}
          </Col>
          <Col span={12} style={{ padding: '10px 0' }}>
            {sum === 0 ? 0 : (sum / windowData.length).toFixed(1)} Mbps
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
            {t('avgThp')}
          </Col>
          <Col span={12} style={{ padding: '10px 0' }}>
            {totalsum === 0
              ? 0
              : (totalsum / props.throughput.data.length).toFixed(1)}{' '}
            Mbps
          </Col>
        </Row>

        <Row>
          <Col span={18}>
            <Divider orientation="left" className={styles.tableText}>
              {"L4"+t('avail_suf')}
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
        <Row justify="center" align="middle" style={{ marginBottom: 10 }}>
          <Col span={12} className={styles.bigbox}>
            <Row className={styles.bigboxText} align="middle" justify="center">
              <span>{t('avail_suf')} </span>
            </Row>
            <Row className={styles.bigboxText} align="middle" justify="center">
              {validCnt === 0
                ? 0
                : ((100 * validCnt) / (timeCnt + validCnt)).toFixed(1)}
              %
            </Row>
          </Col>
          <Col span={12} className={styles.smallbox}>
            <Row>
              <Col span={24}>{t('transmission')}: {' '}{validCnt / 10} s</Col>
            </Row>
            <Row>
              <Col span={24}>{t('disruption')}:{' '} {timeCnt / 10} s</Col>
            </Row>
            <Row>
              <Col span={24}>{t('totalTime')}:{' '} {(validCnt + timeCnt) / 10} s</Col>
            </Row>
          </Col>
        </Row>
        <Row justify="center" align="middle" style={{ marginBottom: 10 }}>
          <Col span={12} className={styles.bigbox}>
            <Row className={styles.bigboxText} align="middle" justify="center">
              <span>{t('numOfDisruption')}</span>
            </Row>
            <Row className={styles.bigboxText} align="middle" justify="center">
              {breaks.length}
            </Row>
          </Col>
          <Col span={12} className={styles.smallbox}>
            <Row>
              <Col span={24}>{t('maxDisruption')}:{' '}
                {breaks.length > 0 ? breaks[breaks.length - 1] / 10 : 0} s
              </Col>
            </Row>
            <Row>
              <Col span={24}>{t('midDisruption')}:{' '}
                {breaks.length > 0
                  ? breaks[Math.floor(breaks.length / 2)] / 10
                  : 0}{' '}
                s
              </Col>
            </Row>
            <Row>
              <Col span={24}>{t('totalDisruption')}:{' '}{breaksSum / 10} s</Col>
            </Row>
          </Col>
        </Row>
      </Col>
    );
  };
  const genL4Graph = () => {
    return (
      <Col span={16}>
        <Divider orientation="left">{t('throughput')+t("timeseries_suf")}</Divider>
        <NotedLine
          data={props.throughput.data}
          notes={props.notes}
          extraConfig={{
            ...props.throughput.extraConfig,
            height: 300,
          }}
          status={props.status}
          changeFunc={setRange}
          title={props.throughput.title}
        ></NotedLine>
      </Col>
    );
  };

  return (
    <Row gutter={[10, 0]}>
      {genL4Detail()}
      {genL4Graph()}
    </Row>
  );
}
