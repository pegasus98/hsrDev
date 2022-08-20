import {
  Card,
  Col,
  Divider,
  Layout,
  PageHeader,
  Row,
  Space,
  Tabs,
  Descriptions,
  Switch,
} from 'antd';
import { Content } from 'antd/lib/layout/layout';
import { HandoverDataItem } from 'defines';
import { useState } from 'react';
import { ids } from 'webpack';
import NotedLine from './notedLine';
import DisplayCard from './onlinePages/displayCard';

import styles from './pages.module.css';
import VideoCard from './videoCard';
const { TabPane } = Tabs;
interface paneItem {
  title: string;
  content: any;
  key: string;
}
export default function Statistics(props: any) {
  const [range, setRange] = useState([0, 1]);
  const [ifWindow, setIfWindow] = useState(false);
  const genHandoverDetail = () => {
    // if (props.notes.length === 0) return <></>;
    const sorteddata = props.notes
      .concat([])
      .sort((a: any, b: any) => b.duration - a.duration);
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
        <Divider orientation="left">基站切换</Divider>
        <Row justify="center" align="middle" style={{ marginBottom: 10 }}>
          <Col span={10} className={styles.bigbox}>
            <Row className={styles.bigboxText} align="middle" justify="center">
              <span>频数:</span>
            </Row>
            <Row className={styles.bigboxText} align="middle" justify="center">
              {sorteddata.length}
            </Row>
          </Col>
          <Col span={14} className={styles.smallbox}>
            <Row>
              <Col span={12}>成功次数:</Col>
              <Col span={12}> {successCnt}</Col>
            </Row>
            <Row>
              <Col span={12}>失败次数:</Col>
              <Col span={12}>{failCnt}</Col>
            </Row>
            <Row>
              <Col span={12}>RLF次数:</Col>
              <Col span={12}>0</Col>
            </Row>
          </Col>
        </Row>
        <Row justify="center" align="middle">
          <Col span={10} className={styles.bigbox}>
            <Row className={styles.bigboxText} align="middle" justify="center">
              <span>合计耗时:</span>
            </Row>
            <Row className={styles.bigboxText} align="middle" justify="center">
              {sum.toFixed(3)}s
            </Row>
          </Col>
          <Col span={14} className={styles.smallbox}>
            <Row>
              <Col span={12}>最大耗时:</Col>
              <Col span={12}>
                {sorteddata.length > 0
                  ? sorteddata[sorteddata.length - 1].duration
                  : 0}
                s
              </Col>
            </Row>
            <Row>
              <Col span={12}>中位耗时:</Col>
              <Col span={12}>
                {sorteddata.length > 0
                  ? sorteddata[Math.floor(sorteddata.length / 2)].duration
                  : 0}
                s
              </Col>
            </Row>
            <Row>
              <Col span={12}>最小耗时:</Col>
              <Col span={12}>
                {sorteddata.length > 0 ? sorteddata[0].duration : 0}s
              </Col>
            </Row>
          </Col>
        </Row>
      </>
    );
  };

  const genL4Detail = () => {
    let breakCnt = 0;
    let breaks = [];
    let timeCnt = 0;
    let validCnt = 0;
    let sum = 0;
    let i = 0;
    let breaksSum = 0;
    let windowData = props.snr.data;
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
      <>
        <Descriptions bordered>
          <Descriptions.Item
            label="平均带宽"
            span={3}
            className={styles.tableText}
          >
            {totalsum === 0
              ? 0
              : (totalsum / props.throughput.data.length).toFixed(1)}
            Mbps
          </Descriptions.Item>
        </Descriptions>
        <Row>
          <Col span={18}>
            <Divider orientation="left" className={styles.tableText}>
              L4可用性
            </Divider>
          </Col>
          <Col span={6}>
            <Row justify="center" align="middle" style={{ height: '100%' }}>
              <Switch
                checkedChildren="窗口"
                unCheckedChildren="全局"
                onChange={(checked: boolean) => setIfWindow(checked)}
              />
            </Row>
          </Col>
        </Row>
        <Row justify="center" align="middle" style={{ marginBottom: 10 }}>
          <Col span={10} className={styles.bigbox}>
            <Row className={styles.bigboxText} align="middle" justify="center">
              <span>在线率:</span>
            </Row>
            <Row className={styles.bigboxText} align="middle" justify="center">
              {validCnt === 0
                ? 0
                : ((100 * validCnt) / (timeCnt + validCnt)).toFixed(1)}
              %
            </Row>
          </Col>
          <Col span={14} className={styles.smallbox}>
            <Row>
              <Col span={12}>传输时长:</Col>
              <Col span={12}>{validCnt / 10}s</Col>
            </Row>
            <Row>
              <Col span={12}>中断时长:</Col>
              <Col span={12}> {timeCnt / 10}s</Col>
            </Row>
            <Row>
              <Col span={12}>总时长:</Col>
              <Col span={12}> {(validCnt + timeCnt) / 10}s</Col>
            </Row>
          </Col>
        </Row>
        <Row justify="center" align="middle" style={{ marginBottom: 10 }}>
          <Col span={10} className={styles.bigbox}>
            <Row className={styles.bigboxText} align="middle" justify="center">
              <span>中断数:</span>
            </Row>
            <Row className={styles.bigboxText} align="middle" justify="center">
              {breaks.length}
            </Row>
          </Col>
          <Col span={14} className={styles.smallbox}>
            <Row>
              <Col span={12}>最长中断:</Col>
              <Col span={12}>
                {breaks.length > 0 ? breaks[breaks.length - 1] / 10 : 0}s
              </Col>
            </Row>
            <Row>
              <Col span={12}>中位中断:</Col>
              <Col span={12}>
                {breaks.length > 0
                  ? breaks[Math.floor(breaks.length / 2)] / 10
                  : 0}
                s
              </Col>
            </Row>
            <Row>
              <Col span={12}>总中断时长:</Col>
              <Col span={12}> {breaksSum / 10}s</Col>
            </Row>
          </Col>
        </Row>
      </>
    );
  };

  const genL2Detail = () => {
    let data = props.snr.rawData;
    let lteCnt = 0;
    let emptyCnt = 0;
    let nrCnt = 0;
    if (data.length > 0) {
      let pointer = Math.ceil(data[0].timestamp * 10);
      let end = Math.floor(data[data.length - 1].timestamp * 10);
      let index = 1;
      while (pointer <= end) {
        const presentTimestamp = pointer / 10;
        while (
          index < data.length &&
          data[index].timestamp < presentTimestamp
        ) {
          index++;
        }
        if (
          data[index].timestamp - presentTimestamp > 0.1 &&
          presentTimestamp - data[index - 1].timestamp >
          0.1
        )
          emptyCnt++;
        else if (
          data[index].timestamp - presentTimestamp >=
          presentTimestamp - data[index - 1].timestamp
        ) {
          if (data[index - 1].rat === 'NR') nrCnt++;
          else lteCnt++;
        } else {
          if (data[index].rat === 'NR') nrCnt++;
          else lteCnt++;
        }
        pointer++;
      }
    }
    return (
      <>
        <Row>
          <Col span={18}>
            <Divider orientation="left" style={{ fontSize: 16 }}>
              L2可用性
            </Divider>
          </Col>
        </Row>
        <Descriptions bordered>
          <Descriptions.Item label="LTE连接时长" span={3}>
            {lteCnt/10}s
          </Descriptions.Item>
          <Descriptions.Item label="5G连接时长" span={3}>
            {nrCnt/10}s
          </Descriptions.Item>
          <Descriptions.Item label="合计连接时长" span={3}>
            {(lteCnt+nrCnt)/10}s
          </Descriptions.Item>
        </Descriptions>
      </>
    );
  };

  const genWindowThroughput = () => {
    const start = Math.max(
      0,
      Math.floor(props.throughput.data.length * range[0])
    );
    const end = Math.ceil(props.throughput.data.length * range[1]);
    let sum = 0;
    for (let i = start; i < end; ++i) {
      sum += props.throughput.data[i].value;
    }
    return (
      <Descriptions bordered>
        <Descriptions.Item
          label="窗口带宽"
          span={3}
          className={styles.tableText}
        >
          {sum === 0 ? 0 : (sum / (end - start)).toFixed(1)}Mbps
        </Descriptions.Item>
      </Descriptions>
    );
  };

  const genVideoStatus = ()=>{
    return (
      <>
        <Divider orientation="left">  缓冲情况</Divider>
        <Row justify="center" align="middle" style={{ marginBottom: 10 }}>
          <Col span={10} className={styles.bigbox}>
            <Row className={styles.bigboxText} align="middle" justify="center">
              <span>播放率</span>
            </Row>
            <Row className={styles.bigboxText} align="middle" justify="center">
              {0}%
            </Row>
          </Col>
          <Col span={14} className={styles.smallbox}>
            <Row>
              <Col span={12}>播放时长:</Col>
              <Col span={12}> {0} s</Col>
            </Row>
            <Row>
              <Col span={12}>缓冲时长:</Col>
              <Col span={12}>{0} s</Col>
            </Row>
            <Row>
              <Col span={12}>总时长:</Col>
              <Col span={12}>{0} s</Col>
            </Row>
          </Col>
        </Row>
        <Row justify="center" align="middle">
          <Col span={10} className={styles.bigbox}>
            <Row className={styles.bigboxText} align="middle" justify="center">
              <span>缓冲数:</span>
            </Row>
            <Row className={styles.bigboxText} align="middle" justify="center">
              {0}
            </Row>
          </Col>
          <Col span={14} className={styles.smallbox}>
            <Row>
              <Col span={12}>最长缓冲:</Col>
              <Col span={12}>
                {0}
                s
              </Col>
            </Row>
            <Row>
              <Col span={12}>中位缓冲:</Col>
              <Col span={12}>
                {0}
                s
              </Col>
            </Row>
            <Row>
              <Col span={12}>总缓冲时长:</Col>
              <Col span={12}>
                {0}s
              </Col>
            </Row>
          </Col>
        </Row>
      </>
    );
  }
  return (
    <Layout>
      <Content>
        <Tabs type="card">
          <TabPane tab="overview" key="overview">
            <Card style={{ marginTop: -24 }} bordered={false}>
              <Row gutter={[10, 0]}>
                <Col span={8}>
                  {genWindowThroughput()}
                  {genL4Detail()}
                  {genL2Detail()}
                  {genHandoverDetail()}
                </Col>
                <Col span={16}>
                  <Divider orientation="left">带宽时序图</Divider>
                  <NotedLine
                    data={props.throughput.data}
                    notes={props.notes}
                    extraConfig={{
                      ...props.throughput.extraConfig,
                      height: 200,
                    }}
                    status={props.status}
                    changeFunc={setRange}
                    title={props.throughput.title}
                  ></NotedLine>
                  <Divider orientation="left" style={{ marginTop: '40px' }}>
                    RSRP时序图
                  </Divider>
                  <NotedLine
                    data={props.rsrp.data}
                    notes={props.notes}
                    extraConfig={{ ...props.rsrp.extraConfig, height: 200 }}
                    title={props.rsrp.title}
                    status={props.status}
                  ></NotedLine>
                  <Divider orientation="left" style={{ marginTop: '40px' }}>
                    SNR时序图
                  </Divider>
                  <NotedLine
                    data={props.snr.data}
                    notes={props.notes}
                    extraConfig={{ ...props.snr.extraConfig, height: 200 }}
                    status={props.status}
                    title={props.snr.title}
                  ></NotedLine>
                </Col>
              </Row>
            </Card>
            <Card style={{ marginTop: -24 }} bordered={false}>
              <Row gutter={[10, 0]}>
                <Col span={8}>
                  {genVideoStatus()}
                </Col>
                <Col span={16}>
                  <Divider orientation="left">带宽时序图</Divider>
                  <NotedLine
                    data={props.snr.data}
                    notes={props.notes}
                    extraConfig={{ ...props.snr.extraConfig, height: 200 }}
                    status={props.status}
                    title={props.snr.title}
                  ></NotedLine>
                </Col>
              </Row>
            </Card>
          </TabPane>
          <TabPane tab="throughput" key="throughput">
            <DisplayCard
              {...props.throughput}
              notes={props.notes}
              status={props.status}
            />
          </TabPane>
          <TabPane tab="rsrp" key="rsrp">
            <DisplayCard
              {...props.rsrp}
              notes={props.notes}
              status={props.status}
            />
          </TabPane>
          <TabPane tab="snr" key="snr">
            <DisplayCard
              {...props.snr}
              notes={props.notes}
              status={props.status}
            />
          </TabPane>
          <TabPane tab="视频播放" key="video">
            <VideoCard
              {...props.snr}
              notes={props.notes}
              status={props.status}
            />
          </TabPane>
        </Tabs>
      </Content>
    </Layout>
  );
}
