import { FolderOpenOutlined } from '@ant-design/icons';
import {
  Button,
  Col,
  Form,
  Input,
  Layout,
  Row,
  Space,
  Table,
  Upload,
} from 'antd';

export default function project(props: any) {
  const columns = [
    {
      title:'trace ID',
      dataIndex: 'trace',
      key:'trace',
      render:(id:number)=>id.toString()
    },
    {
      title: '时间',
      dataIndex: 'index',
      key: 'index',
    },
    {
      title: '设备id',
      dataIndex: 'deviceId',
      key: 'deviceId',
    },
    {
      title: '服务器ip',
      dataIndex: 'serverPath',
      key: 'serverPath',
    },
    {
      title: '实验类型',
      dataIndex: 'expType',
      key: 'expType',
    },
    {
      title: '网络类型',
      dataIndex: 'rat',
      key: 'rat',
    },
    {
      title: '设备数据同步状态',
      dataIndex: 'status1',
      key: 'status1',
      render: (status: number) => {
        switch (status) {
          case 0:
            return <span>同步完成</span>;
          case 1:
            return <span>未同步数据</span>;
          case -1:
            return <span>同步中</span>;
          default:
            return <span>异常状态</span>;
        }
      },
    },
    {
      title: '服务器同步状态',
      dataIndex: 'status2',
      key: 'status2',
      render: (status: number) => {
        switch (status) {
          case 0:
            return <span>同步完成</span>;
          case 1:
            return <span>未同步数据</span>;
          case -1:
            return <span>同步中</span>;
          default:
            return <span>异常状态</span>;
        }
      },
    },
  ];

  if (props.path === '')
    return (
      
      <Row
        justify="center"
        align="middle"
        style={{
          minHeight: '100vh',
        }}
      >
        <Col>
          <Button type="primary" size="large" icon={<FolderOpenOutlined /> }onClick={props.openProject}>
            打开项目文件夹
          </Button>
        </Col>
      </Row>
    );
  else
    return (
      <>
        <Row justify="center">
          <Col span={20}>
          <Table
            rowKey={(record) => {
              return [
                record.index,
                record.deviceId,
                record.status1,
                record.status2,
              ].join('-');
            }}
            columns={columns}
            dataSource={props.projectList}
            pagination={{ pageSize: 10 }}
            footer={() => (
              <Button type="primary" onClick={props.getProjectData}>
                同步
              </Button>
            )}
          />
          </Col>
        </Row>
      </>
    );
}
