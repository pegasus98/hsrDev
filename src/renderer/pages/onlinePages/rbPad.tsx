import { QuestionCircleOutlined } from '@ant-design/icons';
import { Col, Divider, Popover, Row, Switch } from 'antd';
import {
  DetailLineDataItem,
  DualDataItem,
  HandoverDataItem,
  RbDataItem,
  snrLineDataItem,
} from 'defines';
import { t } from 'i18next';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import NotedLine from '../notedLine';
import styles from '../pages.module.css';
import L2Line from './l2Line';
import RbLine from './rbLine';

export default function RbPad(props: any) {
  const {t} = useTranslation()
  const [range, setRange] = useState([0, 1]);
  const [ifWindow, setIfWindow] = useState(false);
  let windowData = props.rb.data;
  if (ifWindow) {
    if (props.status === 0) {
      const start = Math.floor(props.rb.data.length * range[0]);
      const end = Math.ceil(props.rb.data.length * range[1]);
      windowData = props.rb.data.slice(start, end);
    } else {
      windowData = props.rb.data.slice(-100);
    }
  } 


  let avg = 0;

  let maxValue = 0;
  let middleValue = 0;
  let utilMap = [
    { cnt: 0, sum: 0,util:0},
    { cnt: 0, sum: 0,util:0 },
    { cnt: 0, sum: 0,util:0 },
    {  cnt: 0, sum: 0,util:0 },
  ];
  const typeList = ["256QAM","64QAM","16QAM","QPSK"]

  if (windowData.length > 0) {
    const windowRawData = props.rb.rawData.filter(
      (item: RbDataItem) =>
        item.timestamp >= windowData[0].timestamp &&
        item.timestamp <= windowData[windowData.length - 1].timestamp
    );
    for (let i = 0; i < windowData.length; i++) {
      avg += windowData[i].value;
    }
    for (let i = 0; i < windowRawData.length; i++) {
      if(windowRawData[i].type<0) continue; 
      utilMap[windowRawData[i].type].cnt++;
      utilMap[windowRawData[i].type].sum+=windowRawData[i].value;
      utilMap[windowRawData[i].type].util+=windowRawData[i].util;
    }
    avg = avg / windowData.length;
    let sortedData:number[] = windowData
      .map((item: DetailLineDataItem) => item.value)
    sortedData.sort((a,b)=>(a-b))
    maxValue = sortedData[sortedData.length - 1];
    middleValue = sortedData[Math.ceil(sortedData.length / 2)];

  }
  const utilMapSum = utilMap[0].sum+utilMap[1].sum+utilMap[2].sum+utilMap[3].sum;

  const genRbDetail = () => {
    return (
      <>
        <Row>
          <Col span={18}>
            <Divider orientation="left">{t('rbUtil')}</Divider>
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
            {t('avg')}
          </Col>
          <Col span={12} style={{ padding: '10px 0' }}>
            {avg.toFixed(2)} %
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
            {t('mid')}
          </Col>
          <Col span={12} style={{ padding: '10px 0' }}>
            {middleValue.toFixed(2)} %
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
            {t('max')}
          </Col>
          <Col span={12} style={{ padding: '10px 0' }}>
            {maxValue.toFixed(2)} %
          </Col>
        </Row>
      </>
    );
  };
  const genModulationDetail = () => {
    return (
      <>
        <Divider orientation="left">{t('modulationType')}</Divider>
        <Row
          style={{
            border: '1px solid #DAE3F3',
            fontSize: '18px',
            margin: '1px',
          }}
          justify="center"
          align="middle"
        >
          <Col span={8} style={{ paddingRight: '1px' }}>
            <div style={{ backgroundColor: '#DAE3F3', padding: '10px 0px' }}>
            {t('modulationType')}
            </div>
          </Col>
          <Col span={8} style={{ paddingRight: '1px' }}>
            <div style={{ backgroundColor: '#DAE3F3', padding: '10px 0px' }}>
              {t('ratio')}
            </div>
          </Col>
          <Col span={8}>
            <div style={{ backgroundColor: '#DAE3F3', padding: '10px 0px' }}>
              {t('rbUtil')}
            </div>
          </Col>
        </Row>
        {utilMap.map((item,index)=>{
          return <Row key={index}
          style={{
            border: '1px solid #DAE3F3',
            fontSize: '18px',
            margin: '1px',
          }}
          justify="center"
          align="middle"
        >
          <Col span={8} style={{ paddingRight: '1px' }}>
            <div style={{ backgroundColor: '#DAE3F3', padding: '10px 0px' }}>
              {typeList[index]}
            </div>
          </Col>
          <Col span={8} style={{ padding: '10px 0' }}>
            {(utilMapSum && item.sum/utilMapSum*100).toFixed(2)} %
          </Col>
          <Col span={8} style={{ padding: '10px 0' }}>
            {item.cnt>0?(item.util/item.cnt).toFixed(2)+" %":"N/A"} 
          </Col>
        </Row>
        })}
    
      </>
    );
  };

  const genRbGraph = () => {
    return (
      <Col span={16}>
        <Divider orientation="left" style={{ marginTop: '40px' }}>
          <div>
           {t('rb') +t('and')+t('modulationType')+t('timeseries_suf')}
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
        {/* <NotedLine
          changeFunc={setRange}
          data={props.rb.data}
          notes={props.notes}
          extraConfig={{
            ...props.rb.extraConfig,
          }}
          title={''}
          status={props.status}
        ></NotedLine> */}
        <RbLine rbData={props.rb.data} rbRawData={props.rb.rawData} notes={props.notes} extraConfig={{}}status={props.status} changeFunc={setRange}/>
      </Col>
    );
  };

  return (
    <Row gutter={[10, 0]}>
      <Col span={8}>
        {genRbDetail()}
        {genModulationDetail()}
      </Col>
      {genRbGraph()}
    </Row>
  );
}
