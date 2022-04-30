import { useState } from 'react';
import {
  List,
  Row,
  Col,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Table,
  ConfigProvider,
} from 'antd';
import { serverInfoItem } from 'defines';


export default function config(props: any) {
  const [visible, setVisible] = useState(false);
  const [form] = Form.useForm();
  // console.log(props.serverList)
  const listAdd = () => {
    setVisible(false);
    props.addServer(form.getFieldsValue() as serverInfoItem);
  };

  const checkip = (_: any, ip: string) => {
    const r =
      /([0,1]?\d{1,2}|2([0-4][0-9]|5[0-5]))(\.([0,1]?\d{1,2}|2([0-4][0-9]|5[0-5]))){3}/;
    if (r.test(ip)) return Promise.resolve();
    else return Promise.reject(new Error('输入合法的ip地址'));
  };
  const customizeRenderEmpty = () => (
    //这里面就是我们自己定义的空状态
    <div style={{ textAlign: 'center' }}>
      <p>无可用服务器</p>
    </div>
  );
  return (
    <>
      <ConfigProvider renderEmpty={customizeRenderEmpty}>
        <Table
          bordered
          rowKey={(record) => {
            return [record.ip, record.status].join('-');
          }}
          columns={[
            { title: '服务器ip', dataIndex: 'ip', key: 'ip' },
            { title: '用户名', dataIndex: 'username', key: 'username' },
            {
              title: '状态',
              dataIndex: 'status',
              key: 'status',
            },
            {
              title: '操作',
              dataIndex: 'ip',
              key: 'action',
              render: (ip: string) => {
                return (
                  <a
                    onClick={() => {
                      props.deleteServer(ip);
                    }}
                  >
                    删除
                  </a>
                );
              },
            },
          ]}
          dataSource={props.serverList}
          title={() => '服务器列表'}
          footer={() => (
            <Row>
              <Col span={12}>
                <Button
                  className="btn btn-large btn-default pull-right"
                  onClick={() => {
                    setVisible(true);
                  }}
                >
                  <span className="icon icon-text icon-arrows-ccw"></span>
                  添加服务器
                </Button>
              </Col>
              <Col span={12}>
                <Button
                  className="btn btn-large btn-default pull-right"
                  onClick={() => {
                    props.testServer();
                  }}
                >
                  <span className="icon icon-text icon-arrows-ccw"></span>
                  启动服务端
                </Button>
              </Col>
            </Row>
          )}
        ></Table>
      </ConfigProvider>
      <Modal
        title="Basic Modal"
        visible={visible}
        onCancel={() => {
          setVisible(false);
        }}
        footer={
          <Button form="serverInput" key="submit" htmlType="submit">
            添加
          </Button>
        }
        destroyOnClose
      >
        <Form
          layout="vertical"
          name="form_in_modal"
          id="serverInput"
          initialValues={{ port: 22 }}
          form={form}
          preserve={false}
          onFinish={listAdd}
        >
          <Form.Item
            validateTrigger={['onSubmit']}
            label="ip地址"
            name="ip"
            rules={[{ validator: checkip, required: true }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="服务器登录用户名"
            name="username"
            rules={[{ required: true, message: '输入服务器登录用户名' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="服务器登录密码"
            name="password"
            rules={[{ required: true, message: '输入服务器登录用户名' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="端口号"
            name="port"
            rules={[{ required: true, message: '输入端口号' }]}
          >
            <InputNumber />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
