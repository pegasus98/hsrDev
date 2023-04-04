import { Card, Col, Divider, Layout, Row, Tabs, Switch } from 'antd';
import { Content } from 'antd/lib/layout/layout';
import DisplayCard from './onlinePages/displayCard';

import VideoCard from './videoCard';
import VideoPad from './onlinePages/videopad';
import TcpPad from './onlinePages/tcpPad';
import TcpCard from './onlinePages/tcpCard';
import L4Pad from './onlinePages/l4Pad';
import L2Pad from './onlinePages/l2Pad';
import RbPad from './onlinePages/rbPad';
import { useTranslation } from 'react-i18next';
const { TabPane } = Tabs;
interface paneItem {
  title: string;
  content: any;
  key: string;
}
export default function Statistics(props: any) {
  const {t} = useTranslation()
  console.log(props.rsrp.data)
  return (
    <Layout>
      <Content>
        <Tabs type="card">
          <TabPane tab={t("overview")} key="overview">
          {props.exptype === 'video' && (
              <Card style={{ marginTop: -24 }} bordered={false}>
                <VideoPad
                  buffer={props.buffer}
                  bitrate={props.bitrate}
                  status={props.status}
                  waiting={props.waiting}
                  playingTotal={props.playingTotal}
                  waitingTotal={props.waitingTotal}
                  notes={props.notes}
                ></VideoPad>
              </Card>
            )}
            <Card style={{ marginTop: -24 }} bordered={false}>
              <L4Pad
                throughput={props.throughput}
                status={props.status}
                notes={props.notes}
              ></L4Pad>
            </Card>
            <Card style={{ marginTop: -24 }} bordered={false}>
              <L2Pad
                rsrp={props.rsrp}
                snr={props.snr}
                status={props.status}
                notes={props.notes}
              ></L2Pad>
            </Card>
            <Card style={{ marginTop: -24 }} bordered={false}>
              <RbPad
                rb={props.rb}
                status={props.status}
                notes={props.notes}
              ></RbPad>
            </Card>
            
            {(props.exptype === 'TCP' ||props.exptype ==='QUIC') && (
              <Card style={{ marginTop: -24 }} bordered={false}>
                <TcpPad
                  kernal={props.kernal}
                  serverThp={props.serverThp}
                  serverRtt={props.serverRtt}
                  clientSum={props.clientSum}
                  notes={props.notes}
                  status={props.status}
                ></TcpPad>
              </Card>
            )}
          </TabPane>
          <TabPane tab={t("throughput")} key="throughput">
            <DisplayCard
              {...props.throughput}
              notes={props.notes}
              status={props.status}
            />
          </TabPane>
          <TabPane tab={t("rsrp")} key="rsrp">
            <DisplayCard
              {...props.rsrp}
              notes={props.notes}
              status={props.status}
            />
          </TabPane>
          <TabPane tab={t("snr")} key="snr">
            <DisplayCard
              {...props.snr}
              notes={props.notes}
              status={props.status}
            />
          </TabPane>
          <TabPane tab={t("rb")+ t("util")} key="rb">
            <DisplayCard
              {...props.rb}
              notes={props.notes}
              status={props.status}
            />
          </TabPane>
          {props.exptype === 'video' && (
            <TabPane tab={t("videoStatistics")} key="video">
              <VideoCard
                buffer={props.buffer}
                bitrate={props.bitrate}
                status={props.status}
                notes={[]}
              />
            </TabPane>
          )}
          {props.exptype === 'TCP' && (
            <TabPane tab={t("tcpStatistics")} key="tcp">
              <TcpCard
                kernal={props.kernal}
                serverThp={props.serverThp}
                serverRtt={props.serverRtt}
                clientSum={props.clientSum}
                status={props.status}
                notes={props.notes}
              />
            </TabPane>
          )}
        </Tabs>
      </Content>
    </Layout>
  );
}
