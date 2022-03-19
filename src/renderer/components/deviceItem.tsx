import { MobileOutlined } from "@ant-design/icons";
import { Col, Row } from "antd";
export default function DeviceItem(props: any){
    return (
          <Row>
            <Col span={12}>
              <MobileOutlined style={{ fontSize: '32px' }} />
              <dt><strong>Name</strong></dt><dd>{props.listItem.id}</dd>
            </Col>
            <Col span={12}>
              <dl className="inline-flex-description-list">
                  <dt><strong>Manufacturer</strong></dt><dd>{props.listItem.manufacturer}</dd>
                  
                  <dt><strong>Model</strong></dt><dd>{props.listItem.model}</dd>
              </dl>
            </Col>
          </Row>
      );
}