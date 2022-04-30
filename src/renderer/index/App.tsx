import { PureComponent } from 'react';
import { Layout } from 'antd';
import { HashRouter, Routes, Route } from 'react-router-dom';

import Menu from './menu';
import styles from './index.module.css';
import Home from '../pages/home';
import LineA from '../pages/linea';
import Project from '../pages/project';
import Analysis from '../pages/analysis';
import { expItemType,throughputDataItem,serverInfoItem,projectItemType } from 'defines';
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
    throughputData: [] as throughputDataItem[],
  };

  constructor(props: any) {
    super(props);
    let that = this;
    window.jsBridge.on(
      'expStatus',
      (data: {
        deviceId: string;
        code: number;
        dataIndex: string;
        timeDur:number;
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
                    index: data.dataIndex,
                    date: data.dataIndex.split('T')[0],
                    time: data.dataIndex.split('T')[1].replaceAll(':', ''),
                    deviceId: newlist[index].deviceId,
                    serverPath: newlist[index].serverPath,
                    serverIp:newlist[index].serverPath.split('@')[1],
                    expType: newlist[index].expType,
                    timeDur:data.timeDur,
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
      'throughput',
      (data: { deviceId: string; expAppend: string; value: number }) => {
        let newlist = this.state.throughputData;
        const index = newlist.findIndex(
          (item: throughputDataItem) => data.deviceId === item.name
        );
        if (
          index >= 0 &&
          !newlist[index].expAppendList.includes(data.expAppend)
        ) {
          newlist[index].data.push(
            Math.floor((data.value * 1000) / 1024 / 1024) / 1000
          );
          newlist[index].expAppendList.push(data.expAppend);
        } else {
          console.log('get throughput error');
        }
        this.setState({ throughputData: [...newlist] });
        console.log(this.state.throughputData);
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
      throughputData: [
        ...this.state.throughputData,
        { name: item.deviceId, type: 'line', data: [], expAppendList: [] },
      ],
    });
  }
  startExp() {
    let that = this;
    this.setState({ throughputData: [] });
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
  clearExp() {
    this.setState({ expList: [], throughputData: [] });
  }
  //project related
  openProject() {
    window.jsBridge.once(
      'getProjectData',
      (data: { path: string; projectList: projectItemType[] }) => {
        this.setState({
          path: data.path,
          projectList: data.projectList,
          rightLevel: 1,
        });
      }
    );
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
      { path: this.state.path, projectList: this.state.projectList },
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
    return (
      <HashRouter>
        <Layout>
          <Layout style={{ height: '100vh' }}>
            <Sider style={{ height: '100vh' }}>
              <Menu {...this.props} rightLevel={this.state.rightLevel} />
            </Sider>

            <Content className={styles.content}>
              <Routes>
                <Route
                  path="/"
                  element={
                    <Project
                      path={this.state.path}
                      projectList={this.state.projectList}
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
                  path="/realtime/linea"
                  element={<LineA throughputData={this.state.throughputData} />}
                />
                <Route
                  path="/analysis"
                  element={
                    <Analysis
                      projectList={this.state.projectList}
                      path={this.state.path}
                      remoteServerRequest={this.remoteServerRequest}
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

export default App;
