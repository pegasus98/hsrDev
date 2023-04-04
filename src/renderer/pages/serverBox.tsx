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
import { useTranslation } from 'react-i18next';

export default function config(props: any) {
  const { t } = useTranslation();
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
      <p>{t('noServer')}</p>
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
            { title: t('server') + ' IP', dataIndex: 'ip', key: 'ip' },
            { title: t('username'), dataIndex: 'username', key: 'username' },
            {
              title: t('status'),
              dataIndex: 'status',
              key: 'status',
              render: (status: number) => {
                let word = '';
                switch (status) {
                  case 0:
                    word = t('error');
                    break;
                  case 1:
                    word = t('ready');
                    break;
                  case 2:
                    word = t('checking');
                    break;
                  case 2:
                    word = t('notChecked');
                    break;
                  default:
                    break;
                }
                return <span>{word}</span>;
              },
            },
            {
              title: t('operation'),
              dataIndex: 'ip',
              key: 'action',
              render: (ip: string) => {
                return (
                  <a
                    onClick={() => {
                      props.deleteServer(ip);
                    }}
                  >
                    {t('delete')}
                  </a>
                );
              },
            },
          ]}
          dataSource={props.serverList}
          title={() => t('serverList')}
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
                  {t('addServer')}
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
                  {t('startServer')}
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
            {t('add')}
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
