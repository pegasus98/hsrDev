import { PureComponent,Component} from 'react';
import { Layout } from 'antd';
import { HashRouter, Routes, Route } from 'react-router-dom';

import Menu from './menu';
import styles from './index.module.css';
import Home from '../pages/home';
import Analysis from '../pages/analysis';
import {
  expItemType,
  serverInfoItem,
  projectItemType,
  DetailLineDataItem,
  NumberLineDataItem,
  HandoverDataItem,
  snrLineDataItem,
  KernalDataItem,
  RbDataItem,
} from 'defines';

import moment from 'moment';
import Statistics from 'renderer/pages/statistics';
import { WithTranslation,withTranslation } from 'react-i18next';
const { Sider, Content } = Layout;

declare global {
  interface Window {
    jsBridge: any;
  }
}

class App extends Component<WithTranslation,any> {
  state = {
    path: '',
    rightLevel: 0,
    projectList: [] as projectItemType[],
    deviceList: [],
    serverList: [
      {
        ip: '114.116.204.243',
        username: 'root',
        password: `kX/s567GGm8okhH/`,
        port: 22,
        status: -1,
      } as serverInfoItem,
    ],
    expList: [] as expItemType[],
    logList: [] as string[],
    throughputData: [] as DetailLineDataItem[],
    snrData: [] as DetailLineDataItem[],
    rawsnrData: [] as snrLineDataItem[],
    rawthpData: [] as DetailLineDataItem[],
    handoverData: [] as HandoverDataItem[],
    rsrpData: [] as DetailLineDataItem[],
    rawrsrpData: [] as DetailLineDataItem[],
    bitrateData: [] as DetailLineDataItem[],
    rawBitrateData: [] as DetailLineDataItem[],
    bufferData: [] as DetailLineDataItem[],
    rawBufferData: [] as DetailLineDataItem[],
    kernalData: [] as KernalDataItem[],
    serverRtt: [] as DetailLineDataItem[],
    serverThp: [] as DetailLineDataItem[],
    rawRbData:[] as RbDataItem[],
    rbData:[] as RbDataItem[],
    waiting:[] as Number[],
    playingTotal:0,
    waitingTotal:0,
    clientSum:0,
    onlineLock: true,
    onlineStatus: 1,
    diff:-1,
    simuType:"",
  };
  resolveSnr(value: snrLineDataItem[]) {
    if (value.length===0 || this.state.diff<0) return;

    let newRawData = this.state.rawsnrData.concat(value.map(item=>({...item,timestamp:item.timestamp+this.state.diff})));
    newRawData.sort((a, b) => a.timestamp - b.timestamp);
    let newData = [] as DetailLineDataItem[];
    let pointer = Math.ceil(newRawData[0].timestamp / 100)*100; //this will discard the first point
    for (let i = 1; i < newRawData.length; i++) {
      while (pointer <= newRawData[i].timestamp ) {
        let k =
          (newRawData[i - 1].value - newRawData[i].value) /
          (newRawData[i - 1].timestamp - newRawData[i].timestamp);
        newData.push({
          timestamp: pointer ,
          time: moment(pointer ).format('HH:mm:ss.S'),
          value:
            Math.round(
              (k * (pointer  - newRawData[i].timestamp) +
                newRawData[i].value) *
                10
            ) / 10,
        });
        pointer = pointer + 100;
      }
    }
    this.setState({
      snrData: newData,
      rawsnrData: newRawData,
    });
  }
  resolveRsrp(value: NumberLineDataItem[]) {
    if (value.length === 0||this.state.diff<0) return;

    let newRawData = this.state.rawrsrpData.concat(value.map(item=>({...item,timestamp:item.timestamp+this.state.diff})));
    newRawData.sort((a, b) => a.timestamp - b.timestamp);
    let newData = [] as DetailLineDataItem[];
    let pointer = Math.ceil(newRawData[0].timestamp /100)*100;
    for (let i = 1; i < newRawData.length; i++) {
      while (pointer <= newRawData[i].timestamp ) {
        let k =
          (newRawData[i - 1].value - newRawData[i].value) /
          (newRawData[i - 1].timestamp - newRawData[i].timestamp);
        newData.push({
          timestamp: pointer,
          time: moment(pointer * 100).format('HH:mm:ss.S'),
          value:
            Math.round(
              (k * (pointer  - newRawData[i].timestamp) +
                newRawData[i].value) *
                10
            ) / 10,
        });
        pointer = pointer + 100;
      }
    }
    this.setState({
      rsrpData: newData,
      rawrsrpData: newRawData,
    });
  }
  resolveHandover(value: HandoverDataItem[]) {
    this.setState({
      handoverData: [...this.state.handoverData, ...value.map(item=>({...item,start:item.start+this.state.diff,end:item.end+this.state.diff}))],
    });
  }
  resolveThroughput(value: NumberLineDataItem[]) {
    if (value.length === 0||this.state.diff<0) return;

    let newRawData = this.state.rawthpData.concat(value.map(item=>({...item,timestamp:item.timestamp+this.state.diff})));
    newRawData.sort((a, b) => a.timestamp - b.timestamp);
    let newData = [] as DetailLineDataItem[];
    let pointer = Math.ceil(newRawData[0].timestamp /100)*100;
    const end = Math.floor(newRawData[newRawData.length - 1].timestamp /100)*100;
    // if(this.state.throughputData.length>0&&pointer==Math.round(this.state.throughputData[this.state.throughputData.length-1].timestamp*10))
    let i = 0;

    while (pointer <= end) {
      let sum = 0;
      for (
        ;
        i < newRawData.length && pointer >= newRawData[i].timestamp ;
        ++i
      )
        sum += newRawData[i].value;
      newData.push({
        timestamp: pointer,
        time: moment(pointer * 100).format('HH:mm:ss.S'),
        value: (sum * 8) / 100000, //1000 1000 0.1 to bits
      });

      pointer = pointer + 100;
    }
    // if (oldData.length > 0) {
    //   if (
    //     appendData[0].timestamp - oldData[oldData.length - 1].timestamp <
    //     0.05
    //   ) {
    //     let tail = oldData.pop();
    //     if (tail?.value) appendData[0].value += tail?.value;
    //   } else {
    //     while (
    //       appendData[0].timestamp - oldData[oldData.length - 1].timestamp >
    //       0.15
    //     ) {
    //       let tailTimestamp = oldData[oldData.length - 1].timestamp;
    //       oldData.push({
    //         timestamp: tailTimestamp + 0.1,
    //         time: moment(tailTimestamp * 1000).format('HH:mm:ss.S'),
    //         value: 0,
    //       });
    //     }
    //   }
    // }

    this.setState({
      throughputData: newData,
      rawthpData: newRawData,
    });
  }
  resolvePcapThroughput(value:NumberLineDataItem[]){
    this.setState({
      throughputData: value,
      rawthpData: value,
    });
  }
  resolveBuffer(value: DetailLineDataItem[]) {
    let newRawData = value;
    if (newRawData.length === this.state.rawBufferData.length) return;
    let newData = [] as DetailLineDataItem[];
    let pointer = Math.ceil(newRawData[0].timestamp /100)*100;
    for (let i = 1; i < newRawData.length; i++) {
      while (pointer <= newRawData[i].timestamp ) {
        let k =
          (newRawData[i - 1].value - newRawData[i].value) /
          (newRawData[i - 1].timestamp - newRawData[i].timestamp);
        newData.push({
          timestamp: pointer ,
          time: moment(pointer * 100).format('HH:mm:ss.S'),
          value:
            Math.round(
              (k * (pointer  - newRawData[i].timestamp) +
                newRawData[i].value) *
                10
            ) / 10,
        });
        pointer = pointer + 100;
      }
    }
    this.setState({
      bufferData: newData,
      rawBufferData: newRawData,
    });
  }
  resolveBitrate(value: DetailLineDataItem[]) {
    let newRawData = value;
    if (newRawData.length === this.state.rawBitrateData.length) return;
    let newData = [] as DetailLineDataItem[];

    let pointer = Math.ceil(newRawData[0].timestamp / 100)*100;
    let tValue = newRawData[0].value;
    for (let i = 1; i < newRawData.length; i++) {
      tValue = newRawData[i].value;
      while (pointer <= newRawData[i].timestamp ) {
        newData.push({
          timestamp: pointer ,
          time: moment(pointer * 100).format('HH:mm:ss.S'),
          value: tValue,
        });
        pointer = pointer + 100;
      }
    }

    this.setState({
      bitrateData: newData,
      rawBitrateData: newRawData,
    });
  }

  resolveRb(value:RbDataItem[]){
    if (value.length === 0||this.state.diff<0) return;

    let newRawData = this.state.rawRbData.concat(value.map(item=>({...item,timestamp:item.timestamp+this.state.diff})));
    newRawData.sort((a, b) => a.timestamp - b.timestamp);
    let newData = [] as RbDataItem[];
    let pointer = Math.ceil(newRawData[0].timestamp /100)*100;
    const end = Math.floor(newRawData[newRawData.length - 1].timestamp /100)*100;
    let i = 0;
    while (pointer <= end) {
      let sum = 0;
      let start = i;
      for (
        ;
        i < newRawData.length && pointer >= newRawData[i].timestamp ;
        ++i
      )
        sum += newRawData[i].value;
      for(let j =start;j<i;j++){
        newRawData[j].util=sum*10
      }

      newData.push({
        timestamp: pointer,
        value: sum*10, //1000 1000 0.1 to bits
        util:sum*10,
        type:newRawData[i].type
      });

      pointer = pointer + 100;
    }
    this.setState({
      rbData: newData,
      rawRbData: newRawData,
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
                    trace: Math.max(...this.state.projectList.map(item=>item.trace))+1,
                    index: data.dataIndex,
                    date: data.dataIndex.split('T')[0],
                    time: data.dataIndex.split('T')[1].replaceAll(':', ''),
                    deviceId: newlist[index].deviceId,
                    serverPath: newlist[index].serverPath,
                    serverIp: newlist[index].serverPath.split('@')[1],
                    expType: newlist[index].expType,
                    timeDur: data.timeDur,
                    rat: data.rat,
                    status1: 1, //0 完成 1 Not Finished  -1 Synchronizing
                    status2:
                      newlist[index].expType === 'TCP' ||
                      newlist[index].expType === 'QUIC'
                        ? 1
                        : 0, //0 完成 1 Not Finished  -1 Synchronizing
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
        newlist[index].status = data.code == 0 ? 1 : 0;
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
        this.setState({
          path: data.path,
          serverList: data.serverList,
          projectList: data.projectList,
          rightLevel: 1,
          throughputData: [],
          rbData:[],
          rawRbData:[],
          snrData: [],
          rsrpData: [],
          handoverData: [],
          rawrsrpData: [],
          rawsnrData: [],
          rawthpData: [],
          rawBitrateData: [],
          bitrateData: [],
          bufferData: [],
          rawBufferData: [],
          kernalData: [],
        });
      }
    );
    window.jsBridge.on('analysisLog', (data: { dataString: string }) => {
      this.setState({ logList: [...this.state.logList, data.dataString] });
    });
    window.jsBridge.on(
      'onlineData',
      (data: {
        deviceId: string;
        snrValue: snrLineDataItem[];
        rsrpValue: NumberLineDataItem[];
        thpValue: NumberLineDataItem[];
        handoverValue: HandoverDataItem[];
        rbValue:RbDataItem[];
        status: number;
      }) => {
        if(data.rsrpValue)
        this.resolveRsrp(data.rsrpValue);
        if(data.snrValue)
        this.resolveSnr(data.snrValue);
        if(data.thpValue)
        this.resolvePcapThroughput(data.thpValue);
        //this.resolveThroughput(data.thpValue);
        if(data.handoverValue)
        this.resolveHandover(data.handoverValue);
        if(data.rbValue)
        this.resolveRb(data.rbValue)
        if (data.status!=undefined &&this.state.onlineStatus > 0) {
          this.setState({ onlineStatus: data.status });
        }
      }
    );
    window.jsBridge.on(
      'onlineVideo',
      (data: {
        deviceId: string;
        buffer: NumberLineDataItem[];
        bitrate: NumberLineDataItem[];
        waiting:Number[];
        time:[Number,Number];
        status: Boolean; //true：finished
      }) => {
        this.resolveBuffer(data.buffer);
        this.resolveBitrate(data.bitrate);
        console.log(data.status)
        if (data.status) {
          this.setState({ onlineStatus: Number(!data.status )});
        }
        if(data.waiting && data.time){
        this.setState({
          waiting:data.waiting,
          playingTotal:data.time[0],
          waitingTotal:data.time[1]
        })
      }
      }
    );
    window.jsBridge.on(
      'onlineCore',
      (data: { deviceId: string; coreData: KernalDataItem[] }) => {
        this.setState({ kernalData: data.coreData });
        console.log(data);
      }
    );
    window.jsBridge.on(
      'onlinePcap',
      (data: { deviceId: string; thp: DetailLineDataItem[];rtt:DetailLineDataItem[] }) => {
        if(data.thp){
          this.setState({ serverThp:data.thp});

        }
        if(data.rtt){
        this.setState({serverRtt:data.rtt});
          
        }
        console.log(data.rtt);
      }
    );
    window.jsBridge.on(
      'diff',
      (data: { diff:number}) => {
        if(data.diff<0||data.diff>72*3600*1000) return ;
        this.setState({ diff:data.diff});
      }
    );
    this.listDevices();
  }
  //device list related
  listDevices() {
    let that = this;
    window.jsBridge.invoke('listDevicesMain', {}, (err: any, data: any) => {
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
          item.status = 2;
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
    this.clearInfo();
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
    this.clearInfo()
    this.setState({simuType:expInfo.expType,onlineStatus:1})
    window.jsBridge.invoke('runSimulate', expInfo, (err: any, data: any) => {
      if (err) {
        console.log(err);
        return;
      }
      //console.log(this.state.simuType)
    });
  }
  clearExp() {
    this.setState({
      expList: [],
    });
    this.clearInfo()
  }
  clearInfo() {
    this.setState({
      snrData: [],
      rsrpData: [],
      handoverData: [],
      throughputData:[],
      rawrsrpData: [],
      rawsnrData: [],
      rawthpData: [],
      rawRbData:[],
      rbData:[],
      rawBitrateData: [],
      bitrateData: [],
      bufferData: [],
      rawBufferData: [],
      kernalData: [],
      serverThp:[],
      serverRtt:[],
      waiting:[],
      playingTotal:0,
      waitingTotal:0,
      clientSum:0,
      onlineStatus:1,
      diff:-1,
      simuType:""
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
    const {t} = this.props
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
                        extraConfig: { yAxis: { max: this.state.throughputData.length &&Math.max(...this.state.throughputData.map(item=>item.value)), min: 0 } },
                        title:t('throughput')+'（Mbps)',
                        type: 'throughput',
                      }}
                      status={this.state.onlineStatus}
                      rsrp={{
                        data: this.state.rsrpData,
                        rawData: this.state.rawrsrpData,
                        extraConfig: { yAxis: { max: this.state.rsrpData.length&&Math.max(...this.state.rsrpData.map(item=>item.value)), min:this.state.rsrpData.length&&Math.min(...this.state.rsrpData.map(item=>item.value)) } },
                        title: t('rsrp')+'(dB)',
                        type: 'rsrp',
                      }}
                      exptype={
                        this.state.simuType||
                        (this.state.expList.length > 0
                          ? this.state.expList[0].expType
                          : '')
                      }
                      snr={{
                        data: this.state.snrData,
                        rawData: this.state.rawsnrData,
                        extraConfig: { yAxis: { max: this.state.snrData.length&&Math.max(...this.state.snrData.map(item=>item.value)), min:this.state.snrData.length&&Math.min(...this.state.snrData.map(item=>item.value)) } },
                        title: t('snr')+'(dB)',
                        type: 'snr',
                      }}
                      notes={this.state.handoverData}
                      buffer={{
                        data: this.state.bufferData,
                        rawData: this.state.rawBufferData,
                        extraConfig: { yAxis: { max: this.state.bufferData.length&&Math.max(...this.state.bufferData.map(item=>item.value)), min:this.state.bufferData.length&&Math.min(...this.state.bufferData.map(item=>item.value)) } },
                        title: t('buffer')+'(s)',
                        type: 'buffer',
                      }}
                      kernal={{
                        data: this.state.kernalData,
                      }}
                      bitrate={{
                        data: this.state.bitrateData,
                        extraconfig: { yAxis: { max: this.state.bitrateData.length&&Math.max(...this.state.bitrateData.map(item=>item.value)), min:this.state.bitrateData.length&&Math.min(...this.state.bitrateData.map(item=>item.value)) }  },
                        title: t('bitrate'),
                        type: 'bitrate',
                      }}
                      rb={{
                        data:this.state.rbData,
                        rawData:this.state.rawRbData,
                        extraConfig:{ yAxis: { max: this.state.rbData.length&&Math.max(...this.state.rbData.map(item=>item.value)), min:this.state.rbData.length&&Math.min(...this.state.rbData.map(item=>item.value)) } },
                        title:t('rbUtil'),
                        type:'rb'
                      }}
                      serverThp={{data:this.state.serverThp}}
                      serverRtt={{data:this.state.serverRtt}}
                      clientSum={this.state.clientSum}
                      waiting={this.state.waiting}
                      playingTotal={this.state.playingTotal}
                      waitingTotal={this.state.waitingTotal}
                    />
                  }
                />
              </Routes>
            </Content>
          </Layout>
        </Layout>
      </HashRouter>

    );
  }
}

export const  TransApp = withTranslation()(App);
