import { PureComponent } from 'react';
import { Layout } from 'antd';
import { HashRouter, Routes, Route } from 'react-router-dom';
import Menu from './menu';
import styles from './index.module.css';
import Home,{expItemType} from './pages/home';
import Throughput from './pages/throughput';
const { Sider, Content } = Layout;

class App extends PureComponent {
  state = {
    collapsed: false,
    deviceList: [],
    serverList: [],
    expList: [],
  };
  //device list related
  listDevices() {
    let that = this;
    window.jsBridge.invoke('listDevicesMain', {}, (err: any, data: any) => {
      console.log(data);
      that.setState({ deviceList: data.deviceList });
    });
  }
  //server list related

  //experiment list related
  addExp(item:expItemType){
    console.log(item)
    this.setState({
      'expList': [...this.state.expList, item],
    });
  }
  render() {
    this.listDevices = this.listDevices.bind(this);
    this.addExp = this.addExp.bind(this);
    return (
      <HashRouter>
        <Layout>
          <Layout style={{ height: '100vh' }}>
            <Sider style={{ height: '100vh' }}>
              <Menu {...this.props} />
            </Sider>

            <Content className={styles.content}>
              <Routes>
                <Route
                  path="/"
                  element={
                    <Home
                      deviceList={this.state.deviceList}
                      serverList={this.state.serverList}
                      expList={this.state.expList}
                      listDevices={this.listDevices}
                      addExp={this.addExp}
                    />
                  }
                />
                <Route path="/analysis/throughput" element={<Throughput />} />
              </Routes>
            </Content>
          </Layout>
        </Layout>
      </HashRouter>
    );
  }
}

export default App;
