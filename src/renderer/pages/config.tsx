import DeviceItem from '../components/deviceItem';
import { List, Row, Col, Button } from 'antd';

export default function config(props: any) {
  let deviceListElements = [];
  console.log(props.deviceList);
  if (props.deviceList.length < 1) {
    deviceListElements = [<div className="media-body">没有已连接的设备</div>];
  } else {
    deviceListElements = [
      ...props.deviceList.map((item: any) => {
        return <DeviceItem key={item.id} listItem={item} />;
      }),
    ];
  } // end else

  return (
    <>
      <Row>
        <Col span={12}>
          <List
            rowKey="id"
            header={<div>当前设备列表</div>}
            footer={
              <div>
                <Button
                  className="btn btn-large btn-default pull-right"
                  onClick={props.listDevices}
                >
                  <span className="icon icon-text icon-arrows-ccw"></span>
                  刷新
                </Button>
              </div>
            }
            bordered
            dataSource={deviceListElements}
            renderItem={(item) => <List.Item>{item}</List.Item>}
          />
        </Col>
        <Col span={12}>
          <List
            header={<div>当前服务器列表</div>}
            footer={
              <Row>
                <Col span={12}>
                  <Button
                    className="btn btn-large btn-default pull-right"
                    onClick={props.listDevices}
                  >
                    <span className="icon icon-text icon-arrows-ccw"></span>
                    添加服务器
                  </Button>
                </Col>
                <Col span={12}>
                  <Button
                    className="btn btn-large btn-default pull-right"
                    onClick={props.listDevices}
                  >
                    <span className="icon icon-text icon-arrows-ccw"></span>
                    测试连接
                  </Button>
                </Col>
              </Row>
            }
            bordered
            dataSource={[<span>无可用服务器</span>]}
            renderItem={(item) => <List.Item>{item}</List.Item>}
          />
        </Col>
      </Row>
    </>
  );
}
