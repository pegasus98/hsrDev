import {
  Table,
  Space,
  Button,
  Row,
  Col,
  InputNumber,
  Modal,
  Select,
  Form,
  Layout,
  ConfigProvider,
} from 'antd';
import { Content, Footer, Header } from 'antd/lib/layout/layout';
import { expItemType } from 'defines';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import DeviceBox from './deviceBox';
import ServerBox from './serverBox';
const { Option } = Select;

export default function home(props: any) {
  const { t } = useTranslation();
  const columns = [
    {
      title: t('trace') + ' ID',
      dataIndex: 'deviceId',
      key: 'deviceId',
      render: (text: string) => <a>{text}</a>,
    },
    {
      title: t('server') + ' IP',
      dataIndex: 'serverPath',
      key: 'serverPath',
    },
    {
      title: t('experimentType'),
      dataIndex: 'expType',
      key: 'expType',
    },
    {
      title: t('status'),
      dataIndex: 'status',
      key: 'status',
      // render: (status: number) => {
      //   switch (status) {
      //     case -1:
      //       return <span>failed </span>;
      //     case 0:
      //       return <span>等待开始</span>;
      //     case 1:
      //       return <span>运行中</span>;
      //     case 2:
      //       return <span>完成</span>;
      //     default:
      //       return <span>异常状态</span>
      //   }
      // },
    },
    {
      title: 'Duration',
      dataIndex: 'timeDur',
      key: 'timeDur',
      render: (timeDur: number | undefined) => {
        if (timeDur) return timeDur.toString();
        else return '';
      },
    },
    // {
    //   title: 'Operation',
    //   key: 'action',
    //   render: () => (
    //     <Space size="middle">
    //       <a>Delete</a>
    //     </Space>
    //   ),
    // },
  ];
  const [form] = Form.useForm();
  const [disabled, setDisabled] = useState(false);
  const [disabledAdd, setDisabledAdd] = useState(false);
  const handleOk = () => {
    setVisiable(false);
    let val = form.getFieldsValue() as expItemType;
    val.status = 'idle';
    props.addExp(val);
  };

  const createDeviceOptions = (list: any[]) => {
    const deviceListOptions = list.map((item) => {
      const { id } = item;
      return (
        <Option key={id} value={id}>
          {id}
        </Option>
      );
    });
    return deviceListOptions;
  };
  const createServerOptions = (list: any[]) => {
    return list.map((item) => {
      const { ip, username } = item;
      const serverPath = [username, ip].join('@');
      return (
        <Option key={serverPath} value={serverPath}>
          {serverPath}
        </Option>
      );
    });
  };
  const [visiable, setVisiable] = useState(false);

  let flag = false;
  for (let index = 0; index < props.expList.length; index++) {
    if (props.expList[index].status === 'running') {
      flag = true;
    }
  }
  if (flag != disabled) setDisabled(flag);

  const formLayout = {
    labelCol: { span: 8 },
    wrapperCol: { span: 16 },
  };

  const customizeRenderEmpty = () => (
    //这里面就是我们自己定义的空状态
    <div style={{ textAlign: 'center' }}>
      <p>{t('plsAddExp')}</p>
    </div>
  );
  return (
    <Layout>
      <Header
        style={{
          background: '#fff',
          textAlign: 'center',
          padding: 0,
        }}
      >
        <Row>
          <Col span={6}>
            <Button
              type="primary"
              onClick={() => {
                setVisiable(true);
              }}
              disabled={disabled || disabledAdd}
            >
              {t("add")}
            </Button>
          </Col>
          {/* <Col span={6}>
            <span>重复次数</span>
            <InputNumber min={0} max={10} defaultValue={0}></InputNumber>
          </Col> */}
          <Col span={6}>
            <Button
              type="primary"
              onClick={() => {
                props.startExp();
                setDisabledAdd(true);
              }}
              disabled={disabled || disabledAdd}
            >
              {t("start")}
            </Button>
          </Col>
          <Col span={6}>
            <Button
              type="primary"
              onClick={() => {
                props.clearExp();
                setDisabledAdd(false);
              }}
              disabled={disabled}
            >
              {t('clear')}
            </Button>
          </Col>
        </Row>{' '}
      </Header>
      <Content
        style={{
          margin: '24px 16px 0',
        }}
      >
        <Modal
          title="添加实验"
          visible={visiable}
          onCancel={() => {
            setVisiable(false);
          }}
          footer={
            <Button form="expInput" key="submit" htmlType="submit">
              {t('add')}
            </Button>
          }
          destroyOnClose
        >
          <Form
            id="expInput"
            form={form}
            onFinish={handleOk}
            preserve={false}
            {...formLayout}
          >
            <Form.Item
              label={t("device")}
              name="deviceId"
              rules={[{ required: true }]}
            >
              <Select style={{ width: 120 }}>
                {createDeviceOptions(props.deviceList)}
              </Select>
            </Form.Item>

            <Form.Item
              label={t("server")}
              name="serverPath"
              rules={[{ required: true }]}
            >
              <Select style={{ width: 120 }}>
                {createServerOptions(props.serverList)}
              </Select>
            </Form.Item>
            <Form.Item
              label={t("experimentType")}
              name="expType"
              rules={[{ required: true }]}
            >
              <Select style={{ width: 120 }}>
                <Option key="QUIC" value="QUIC">
                  QUIC
                </Option>
                <Option key="TCP" value="TCP">
                  TCP
                </Option>
                <Option key="lat" value="lat">
                  Latency
                </Option>
                <Option key="udp" value="udp">
                  UDP
                </Option>
                <Option key="video" value="video">
                  Video
                </Option>
              </Select>
            </Form.Item>
            <Form.Item
              label={t("duration")+"(s)"}
              name="timeDur"
              rules={[{ required: true }]}
            >
              <InputNumber max="120" min="10"></InputNumber>
            </Form.Item>
          </Form>
        </Modal>

        <Row>
          <Col span={24}>
          <ConfigProvider renderEmpty={customizeRenderEmpty}>
            <Table
              rowKey={(record) => {
                return [record.deviceId, record.status].join('-');
              }}
              columns={columns}
              dataSource={props.expList}
            />
            </ConfigProvider>
          </Col>
        </Row>
      </Content>
      <Footer
        style={{
          textAlign: 'center',
        }}
      >
        {' '}
        <Row>
          <Col span={12}>
            <DeviceBox {...props}></DeviceBox>
          </Col>
          <Col span={12}>
            <ServerBox {...props}></ServerBox>
          </Col>
        </Row>
      </Footer>
    </Layout>
  );
}
