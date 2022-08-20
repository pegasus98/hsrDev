import { PureComponent } from 'react';
import { Layout } from 'antd';
import { HashRouter, Routes, Route } from 'react-router-dom';

import Menu from './menu';
import styles from './index.module.css';
import Home from '../pages/home';
import Project from '../pages/project';
import Analysis from '../pages/analysis';
import {
  expItemType,
  serverInfoItem,
  projectItemType,
  DetailLineDataItem,
  NumberLineDataItem,
  HandoverDataItem,
  snrLineDataItem,
} from 'defines';

import moment from 'moment';
import Statistics from 'renderer/pages/statistics';
import { windowsStore } from 'process';
const { Sider, Content } = Layout;

declare global {
  interface Window {
    jsBridge: any;
  }
}
class App extends PureComponent {
  state = {
    path: '',
    rightLevel: 0,
    projectList: [],
    deviceList: [],
    serverList: [
      {
        ip: '114.116.204.243',
        username: 'root',
        password: `kX/s567GGm8okhH/`,
        port: 22,
        status: 'not checked',
      } as serverInfoItem,
    ],
    expList: [],
    logList: [] as string[],
    throughputData: [] as DetailLineDataItem[],
    snrData: [] as DetailLineDataItem[],
    rawsnrData: [] as snrLineDataItem[],
    handoverData: [] as HandoverDataItem[],
    rsrpData: [] as DetailLineDataItem[],
    rawrsrpData: [] as DetailLineDataItem[],
    onlineLock: true,
    onlineStatus:0,
  };
  resolveSnr(value: snrLineDataItem[]){
    let newRawData = value;
    let appendData = [] as DetailLineDataItem[];
    if (this.state.rawsnrData.length > 0)
      newRawData.unshift(
        this.state.rawsnrData[
          this.state.rawsnrData.length - 1
        ] as snrLineDataItem
      );
    if (newRawData[0] === undefined) newRawData.shift();
    let pointer = Math.ceil(newRawData[0].timestamp * 10);
    for (let i = 1; i < newRawData.length; i++) {
      while (pointer <= newRawData[i].timestamp * 10) {
        let k =
          (newRawData[i - 1].value - newRawData[i].value) /
          (newRawData[i - 1].timestamp - newRawData[i].timestamp);
        appendData.push({
          timestamp: pointer / 10,
          time: moment(pointer * 100).format('HH:mm:ss.S'),
          value:
            Math.round(
              (k * (pointer / 10 - newRawData[i].timestamp) +
                newRawData[i].value) *
                10
            ) / 10,
        });
        pointer = pointer + 1;
      }
    }
    this.setState({
      snrData: [...this.state.snrData, ...appendData],
      rawsnrData: this.state.rawsnrData.concat(value),
    });
  }
  resolveRsrp(value: NumberLineDataItem[]){
    let newRawData = value;
    let appendData = [] as DetailLineDataItem[];
    if (this.state.rawrsrpData.length > 0)
      newRawData.unshift(
        this.state.rawrsrpData[
          this.state.rawrsrpData.length - 1
        ] as NumberLineDataItem
      );
    //todo
    if (newRawData[0] === undefined) newRawData.shift();
    let pointer = Math.ceil(newRawData[0].timestamp * 10);
    for (let i = 1; i < newRawData.length; i++) {
      while (pointer <= newRawData[i].timestamp * 10) {
        let k =
          (newRawData[i - 1].value - newRawData[i].value) /
          (newRawData[i - 1].timestamp - newRawData[i].timestamp);
        appendData.push({
          timestamp: pointer / 10,
          time: moment(pointer * 100).format('HH:mm:ss.S'),
          value:
            Math.round(
              (k * (pointer / 10 - newRawData[i].timestamp) +
                newRawData[i].value) *
                10
            ) / 10,
        });
        pointer = pointer + 1;
      }
    }
    this.setState({
      rsrpData: [...this.state.rsrpData, ...appendData],
      rawrsrpData: this.state.rawrsrpData.concat(value),
    });
  }
  resolveHandover(value:HandoverDataItem[]){
    this.setState({
      handoverData: [...this.state.handoverData, ...value],
    });
  }
  resolveThroughput(value: NumberLineDataItem[]){
    let newRawData = value;
    let appendData = [] as DetailLineDataItem[];
    let oldData = this.state.throughputData;
    let pointer = Math.ceil(newRawData[0].timestamp * 10);
    const end = Math.ceil(newRawData[newRawData.length - 1].timestamp * 10);
    // if(this.state.throughputData.length>0&&pointer==Math.round(this.state.throughputData[this.state.throughputData.length-1].timestamp*10))
    let i = 0;

    while (pointer <= end) {
      let sum = 0;
      for (
        ;
        i < newRawData.length && pointer >= newRawData[i].timestamp * 10;
        ++i
      )
        sum += newRawData[i].value;
      appendData.push({
        timestamp: pointer / 10,
        time: moment(pointer * 100).format('HH:mm:ss.S'),
        value: (sum * 8) / 100000, //1000 1000 0.1 to bits
      });

      pointer = pointer + 1;
    }
    if (oldData.length > 0) {
      if (
        appendData[0].timestamp - oldData[oldData.length - 1].timestamp <
        0.05
      ) {
        let tail = oldData.pop();
        if (tail?.value) appendData[0].value += tail?.value;
      } else {
        while (
          appendData[0].timestamp - oldData[oldData.length - 1].timestamp >
          0.15
        ) {
          let tailTimestamp = oldData[oldData.length - 1].timestamp;
          oldData.push({
            timestamp: tailTimestamp + 0.1,
            time: moment(tailTimestamp * 1000).format('HH:mm:ss.S'),
            value: 0,
          });
        }
      }
    }

    this.setState({
      throughputData: [...oldData, ...appendData],
    });
  }


  constructor(props: any) {
    super(props);
    let that = this;
    window.jsBridge.on(
      'expStatus',
      (data: {
        deviceId: string;
        code: number;
        dataIndex: string;
        timeDur: number;
        rat: string;
      }) => {
        let list: expItemType[] = that.state.expList;
        let newlist = list;
        const index = newlist.findIndex(
          (item: expItemType) => data.deviceId === item.deviceId
        );
        if (index >= 0) {
          newlist[index].status = data.code == 0 ? 'success' : 'error';
          if (data.code == 0)
            this.setState(
              {
                projectList: [
                  ...this.state.projectList,
                  {
                    trace: this.state.projectList.length,
                    index: data.dataIndex,
                    date: data.dataIndex.split('T')[0],
                    time: data.dataIndex.split('T')[1].replaceAll(':', ''),
                    deviceId: newlist[index].deviceId,
                    serverPath: newlist[index].serverPath,
                    serverIp: newlist[index].serverPath.split('@')[1],
                    expType: newlist[index].expType,
                    timeDur: data.timeDur,
                    rat: data.rat,
                    status1: 1, //0 完成 1 未同步 -1 同步中
                    status2:
                      newlist[index].expType === 'TCP' ||
                      newlist[index].expType === 'QUIC'
                        ? 1
                        : 0, //0 完成 1 未同步 -1 同步中
                  },
                ],
              },
              () => {
                this.saveProjectData();
              }
            );
        }
        this.setState({ expList: [...newlist] }, () => {
          console.log(this.state.expList);
        });
      }
    );
    window.jsBridge.on(
      'getDeviceDataStatus',
      (data: { deviceId: string; code: number; dataIndex: string }) => {
        let list: projectItemType[] = that.state.projectList;
        let newlist = list;
        const index = newlist.findIndex(
          (item: projectItemType) =>
            data.deviceId === item.deviceId && data.dataIndex === item.index
        );
        if (index >= 0) {
          newlist[index].status1 = data.code == 0 ? 0 : 1;
        }
        this.setState({ projectList: [...newlist] }, () => {
          this.saveProjectData();
        });
      }
    );
    window.jsBridge.on(
      'getServerDataStatus',
      (data: { deviceId: string; code: number; dataIndex: string }) => {
        let list: projectItemType[] = that.state.projectList;
        let newlist = list;
        const index = newlist.findIndex(
          (item: projectItemType) =>
            data.deviceId === item.deviceId && data.dataIndex === item.index
        );
        if (index >= 0) {
          newlist[index].status2 = data.code == 0 ? 0 : 1;
        }
        this.setState({ projectList: [...newlist] }, () => {
          this.saveProjectData();
        });
      }
    );
    window.jsBridge.on('serverStatus', (data: { ip: string; code: number }) => {
      let list: serverInfoItem[] = that.state.serverList;
      let newlist = list;
      const index = newlist.findIndex(
        (item: serverInfoItem) => data.ip === item.ip
      );
      if (index >= 0) {
        newlist[index].status = data.code == 0 ? 'ready' : 'error';
      }
      this.setState({ serverList: [...newlist] }, () => {
        console.log(this.state.serverList);
      });
    });
    window.jsBridge.on(
      'getProjectData',
      (data: {
        path: string;
        projectList: projectItemType[];
        serverList: serverInfoItem[];
      }) => {
        console.log('server:', data.serverList);
        this.setState({
          path: data.path,
          serverList: data.serverList,
          projectList: data.projectList,
          rightLevel: 1,
          throughputData: [],
          snrData: [],
          rsrpData: [],
          handoverData: [],
          rawrsrpData: [],
          rawsnrData: [],
        });
      }
    );
    window.jsBridge.on(
      'throughput',
      (data: { deviceId: string; value: NumberLineDataItem[] }) => {
        let newRawData = data.value;
        let appendData = [] as DetailLineDataItem[];
        let oldData = this.state.throughputData;
        let pointer = Math.ceil(newRawData[0].timestamp * 10);
        const end = Math.ceil(newRawData[newRawData.length - 1].timestamp * 10);
        // if(this.state.throughputData.length>0&&pointer==Math.round(this.state.throughputData[this.state.throughputData.length-1].timestamp*10))
        let i = 0;

        while (pointer <= end) {
          let sum = 0;
          for (
            ;
            i < newRawData.length && pointer >= newRawData[i].timestamp * 10;
            ++i
          )
            sum += newRawData[i].value;
          appendData.push({
            timestamp: pointer / 10,
            time: moment(pointer * 100).format('HH:mm:ss.S'),
            value: (sum * 8) / 100000, //1000 1000 0.1 to bits
          });

          pointer = pointer + 1;
        }
        if (oldData.length > 0) {
          if (
            appendData[0].timestamp - oldData[oldData.length - 1].timestamp <
            0.05
          ) {
            let tail = oldData.pop();
            if (tail?.value) appendData[0].value += tail?.value;
          } else {
            while (
              appendData[0].timestamp - oldData[oldData.length - 1].timestamp >
              0.15
            ) {
              let tailTimestamp = oldData[oldData.length - 1].timestamp;
              oldData.push({
                timestamp: tailTimestamp + 0.1,
                time: moment(tailTimestamp * 1000).format('HH:mm:ss.S'),
                value: 0,
              });
            }
          }
        }

        this.setState({
          throughputData: [...oldData, ...appendData],
        });
      }
    );
    window.jsBridge.on(
      'snr',
      (data: { deviceId: string; value: NumberLineDataItem[] }) => {
        let newRawData = data.value;
        let appendData = [] as DetailLineDataItem[];
        if (this.state.rawsnrData.length > 0)
          newRawData.unshift(
            this.state.rawsnrData[
              this.state.rawsnrData.length - 1
            ] as NumberLineDataItem
          );
        if (newRawData[0] === undefined) newRawData.shift();
        let pointer = Math.ceil(newRawData[0].timestamp * 10);
        for (let i = 1; i < newRawData.length; i++) {
          while (pointer <= newRawData[i].timestamp * 10) {
            let k =
              (newRawData[i - 1].value - newRawData[i].value) /
              (newRawData[i - 1].timestamp - newRawData[i].timestamp);
            appendData.push({
              timestamp: pointer / 10,
              time: moment(pointer * 100).format('HH:mm:ss.S'),
              value:
                Math.round(
                  (k * (pointer / 10 - newRawData[i].timestamp) +
                    newRawData[i].value) *
                    10
                ) / 10,
            });
            pointer = pointer + 1;
          }
        }
        this.setState({
          snrData: [...this.state.snrData, ...appendData],
          rawsnrData: this.state.rawsnrData.concat(data.value),
        });
      }
    );
    window.jsBridge.on(
      'duration',
      (data: { deviceId: string; value: HandoverDataItem[] }) => {
        this.setState({
          handoverData: [...this.state.handoverData, ...data.value],
        });
      }
    );
    window.jsBridge.on(
      'rsrp',
      (data: { deviceId: string; value: NumberLineDataItem[] }) => {
        let newRawData = data.value;
        let appendData = [] as DetailLineDataItem[];
        if (this.state.rawrsrpData.length > 0)
          newRawData.unshift(
            this.state.rawrsrpData[
              this.state.rawrsrpData.length - 1
            ] as NumberLineDataItem
          );
        //todo
        if (newRawData[0] === undefined) newRawData.shift();
        let pointer = Math.ceil(newRawData[0].timestamp * 10);
        for (let i = 1; i < newRawData.length; i++) {
          while (pointer <= newRawData[i].timestamp * 10) {
            let k =
              (newRawData[i - 1].value - newRawData[i].value) /
              (newRawData[i - 1].timestamp - newRawData[i].timestamp);
            appendData.push({
              timestamp: pointer / 10,
              time: moment(pointer * 100).format('HH:mm:ss.S'),
              value:
                Math.round(
                  (k * (pointer / 10 - newRawData[i].timestamp) +
                    newRawData[i].value) *
                    10
                ) / 10,
            });
            pointer = pointer + 1;
          }
        }
        this.setState({
          rsrpData: [...this.state.rsrpData, ...appendData],
          rawrsrpData: this.state.rawrsrpData.concat(data.value),
        });
      }
    );
    window.jsBridge.on('analysisLog', (data: { dataString: string }) => {
      this.setState({ logList: [...this.state.logList, data.dataString] });
    });
    window.jsBridge.on(
      'onlineData',
      (data: { deviceId: string;snrValue:snrLineDataItem[];rsrpValue:NumberLineDataItem[];thpValue:NumberLineDataItem[]; handoverValue: HandoverDataItem[],status:number }) => {
        this.resolveRsrp(data.rsrpValue)
        this.resolveSnr(data.snrValue)
        this.resolveThroughput(data.thpValue)
        this.resolveHandover(data.handoverValue)
        if(this.state.onlineStatus>0){
        this.setState({onlineStatus:data.status})
        }
        console.log(this.state.onlineStatus)
      }
    );
    window.jsBridge.on("videoData",(data:{deviceId:string;videoValue:string})=>{

    })
    this.listDevices();
  }
  //device list related
  listDevices() {
    let that = this;
    window.jsBridge.invoke('listDevicesMain', {}, (err: any, data: any) => {
      console.log('devices:', data);
      that.setState({ deviceList: data.deviceList });
    });
  }
  //server list related
  addServer(item: serverInfoItem) {
    this.setState({
      serverList: [...this.state.serverList, item],
    });
  }
  deleteServer(key: string) {
    const data = this.state.serverList;
    let newdata = data;
    const index = data.findIndex((item: serverInfoItem) => key === item.ip);
    newdata.splice(index, 1);
    this.setState({ serverList: [...newdata] });
  }
  testServer() {
    let that = this;
    window.jsBridge.invoke(
      'testServerMain',
      this.state.serverList,
      (err: any, data: any) => {
        if (err) {
          console.log(err);
          return;
        }
        let list: serverInfoItem[] = [];

        that.state.serverList.forEach(function (item: serverInfoItem) {
          item.status = 'checking';
          list.push(item);
        });
        that.setState({ serverList: [...list] });
      }
    );
  }
  //experiment list related
  addExp(item: expItemType) {
    this.setState({
      expList: [...this.state.expList, item],
    });
  }
  startExp() {
    let that = this;
    this.setState({
      throughputData: [],
      snrData: [],
      rsrpData: [],
      handoverData: [],
      rawrsrpData: [],
      rawsnrData: [],
      onlineStatus:1
    });
    window.jsBridge.invoke(
      'startExpMain',
      that.state.expList,
      (err: any, data: any) => {
        if (err) {
          console.log(err);
          return;
        }
        let list: expItemType[] = [];

        that.state.expList.forEach(function (item: expItemType) {
          item.status = 'running';
          list.push(item);
        });
        that.setState({ expList: [...list] });
      }
    );
  }
  startSimu(expInfo: projectItemType) {
    let that = this;
    this.setState({
      throughputData: [],
      snrData: [],
      rsrpData: [],
      handoverData: [],
      rawrsrpData: [],
      rawsnrData: [],
    });
    window.jsBridge.invoke('runSimulate', expInfo, (err: any, data: any) => {
      if (err) {
        console.log(err);
        return;
      }
    });
  }
  clearExp() {
    this.setState({
      expList: [],
      snrData: [],
      rsrpData: [],
      handoverData: [],
      rawrsrpData: [],
      rawsnrData: [],
    });
  }
  //project related
  openProject() {
    window.jsBridge.invoke('openProjectMain', {}, (err: any) => {
      if (err) {
        console.log(err);
      }
    });
  }
  getProjectData() {
    let list: projectItemType[] = [];
    this.state.projectList.forEach(
      (projectItem: projectItemType, index: number) => {
        if (projectItem.status1 == 1) {
          window.jsBridge.invoke(
            'getDeviceDataMain',
            { path: this.state.path, projectItem: projectItem },
            (err: any, data: any) => {
              if (err) {
                console.log(err);
                return;
              }
            }
          );
          projectItem.status1 = -1;
        }
        if (projectItem.status2 == 1) {
          window.jsBridge.invoke(
            'getServerDataMain',
            { path: this.state.path, projectItem: projectItem },
            (err: any, data: any) => {
              if (err) {
                console.log(err);
                return;
              }
            }
          );
          projectItem.status2 = -1;
        }
        //todo: 可能导致已经拉完但是没有显示已经完成
        list.push(projectItem);
      }
    );

    this.setState({ projectList: [...list] });
  }
  saveProjectData() {
    window.jsBridge.invoke(
      'saveProjectDataMain',
      {
        path: this.state.path,
        serverList: this.state.serverList,
        projectList: this.state.projectList,
      },
      (err: any, data: any) => {
        if (err) {
          console.log(err);
          return;
        }
      }
    );
  }
  remoteServerRequest(formData: any) {
    window.jsBridge.invoke(
      'remoteServerRequest',
      formData,
      (err: any, data: any) => {
        if (err) {
          console.log(err);
          return;
        }
        console.log(data);
      }
    );
  }
  render() {
    this.listDevices = this.listDevices.bind(this);
    this.addExp = this.addExp.bind(this);
    this.addServer = this.addServer.bind(this);
    this.deleteServer = this.deleteServer.bind(this);
    this.startExp = this.startExp.bind(this);
    this.clearExp = this.clearExp.bind(this);
    this.testServer = this.testServer.bind(this);
    this.getProjectData = this.getProjectData.bind(this);
    this.openProject = this.openProject.bind(this);
    this.saveProjectData = this.saveProjectData.bind(this);
    this.remoteServerRequest = this.remoteServerRequest.bind(this);
    this.startSimu = this.startSimu.bind(this);
    return (
      <HashRouter>
        <Layout>
          <Layout style={{ height: '100vh' }}>
            <Sider style={{ height: '100vh' }}>
              <Menu {...this.props} rightLevel={this.state.rightLevel} />
            </Sider>

            <Content className={styles.content} style={{ textAlign: 'center' }}>
              <Routes>
                <Route
                  path="/"
                  element={
                    <Analysis
                      projectList={this.state.projectList}
                      path={this.state.path}
                      logList={this.state.logList}
                      remoteServerRequest={this.remoteServerRequest}
                      startSimu={this.startSimu}
                      getProjectData={this.getProjectData}
                      openProject={this.openProject}
                    />
                  }
                ></Route>
                <Route
                  path="/home"
                  element={
                    <Home
                      deviceList={this.state.deviceList}
                      serverList={this.state.serverList}
                      expList={this.state.expList}
                      listDevices={this.listDevices}
                      addExp={this.addExp}
                      addServer={this.addServer}
                      deleteServer={this.deleteServer}
                      startExp={this.startExp}
                      clearExp={this.clearExp}
                      testServer={this.testServer}
                    />
                  }
                />
                <Route
                  path="/statistics"
                  element={
                    <Statistics
                      throughput={{
                        data: this.state.throughputData,
                        rawData: this.state.throughputData,
                        extraConfig: { yAxis: { max: 800, min: 0 } },
                        title: '吞吐量（Mbps)',
                        type: 'throughput',
                      }}
                      status={this.state.onlineStatus}

                      rsrp={{
                        data: this.state.rsrpData,
                        rawData: this.state.rawrsrpData,
                        extraConfig: { yAxis: { max: -40, min: -140 } },
                        title:'RSRP(dB)',
                        type: 'rsrp',
                      }}
                      snr={{
                        data: this.state.snrData,
                        rawData: this.state.rawsnrData,
                        extraConfig: { yAxis: { max: 35, min: -30 } },
                        title:'SNR(dB)',
                        type: 'snr',
                      }}
                      notes={this.state.handoverData}

                    />
                  }
                />
                {/* <Route
                  path="/realtime/throughput"
                  element={
                    <DisplayCard
                      data={this.state.throughputData}
                      rawData={this.state.throughputData}
                      notes={this.state.handoverData}
                      extraConfig={{ yAxis: { max: 800, min: 0 } }}
                      title={'吞吐量（MBps)'}
                      type={'throughput'}
                    />
                  }
                />
                <Route
                  path="/realtime/snr"
                  element={
                    <NotedLine
                      data={this.state.snrData}
                      notes={this.state.handoverData}
                      extraConfig={{ yAxis: { max: 35, min: -30 } }}
                      title={'SNR(dB)'}
                    />
                  }
                />
                <Route
                  path="/realtime/rsrp"
                  element={
                    <NotedLine
                      data={this.state.rsrpData}
                      notes={this.state.handoverData}
                      extraConfig={{ yAxis: { max: -40, min: -140 } }}
                      title={'RSRP(dB)'}
                    />
                  }
                /> */}
              </Routes>
            </Content>
          </Layout>
        </Layout>
      </HashRouter>
    );
  }
}

export default App;
