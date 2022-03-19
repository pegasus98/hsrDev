import {
  Table,
  Space,
  Button,
  Row,
  Col,
  InputNumber,
  Modal,
  Select,
} from 'antd';
import { useEffect, useRef, useState } from 'react';
import Config from './config';
export interface expItemType {
  name: string;
  age: string;
  address: string;
}
const { Option } = Select;

export default function home(props: any) {
  const columns = [
    {
      title: 'Device Name',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <a>{text}</a>,
    },
    {
      title: 'Age',
      dataIndex: 'age',
      key: 'age',
    },
    {
      title: 'Address',
      dataIndex: 'address',
      key: 'address',
    },
    {
      title: 'Action',
      key: 'action',
      render: () => (
        <Space size="middle">
          <a>Delete</a>
        </Space>
      ),
    },
  ];
  const [selectOption, setOption] = useState('');

  const showModal = () => {
    setState({ isModalVisible: true });
  };

  const handleOk = () => {
    setState({ isModalVisible: false });
    if (selectOption != '') {
      const newData: expItemType = {
        name: selectOption,
        age: '',
        address: ``,
      };
      props.addExp(newData)
    }
  };

  const handleCancel = () => {
    setState({ isModalVisible: false });
  };

  const [expList, setExpList] = useState({ count: 0, data: [] as expItemType[] });


  const handleChange = (value: string) => {
    setOption(value);
  };

  const createOptions = (list: any[]) => {
    return list.map((item) => {
      const { id } = item;
      return <Option value={id}>{id}</Option>;
    });
  };
  const [state, setState] = useState({ isModalVisible: false });

  return (
    <>
      <Row>
        <Col span={6}>
          <Button type="primary" onClick={showModal}>
            添加实验
          </Button>
        </Col>
        <Col span={12}>
          <span>重复次数</span>
          <InputNumber min={0} max={10} defaultValue={0}></InputNumber>
        </Col>
        <Col span={6}>
          <Button type="primary">开始实验</Button>
        </Col>
      </Row>
      <Modal
        title="Basic Modal"
        visible={state.isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
      >
        <Select onChange={handleChange} style={{ width: 120 }}>
          {createOptions(props.deviceList)}
        </Select>
      </Modal>

      <Row>
        <Col span={24}>
          <Table rowKey="id" columns={columns} dataSource={props.expList} />
        </Col>
      </Row>

      <Config {...props}></Config>
    </>
  );
}
