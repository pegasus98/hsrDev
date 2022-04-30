import { render } from 'react-dom';
import App from './App';
import "antd/dist/antd.css";
import zhCN from 'antd/lib/locale/zh_CN';
import { ConfigProvider } from 'antd';

render(  <ConfigProvider locale={zhCN}><App /></ConfigProvider>, document.getElementById('root'));
