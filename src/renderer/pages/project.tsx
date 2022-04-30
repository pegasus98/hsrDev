import { Button, Form, Input, Row, Space, Table, Upload } from 'antd';
import { useState } from 'react';
  
export default function project(props: any) {
  let deviceList = new Set<string>();
  props.projectList.forEach((item: any) => {
    deviceList.add(item.deviceId);
  });

  const columns = [
    {
        title:'时间',
        dataIndex:'index',
        key:'index',  
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
      title:'网络类型',
      dataIndex:'rat',
      key:'rat'
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
      <>
        <Button type="primary" onClick={props.openProject}>打开项目文件夹</Button>
      </>
    );
  else
    return (
      <>
      <Row><Button type="primary" onClick={props.getProjectData}>
            同步
          </Button></Row>
      <Row>
        <Table
          rowKey={(record) => {
            return [record.index, record.deviceId, record.status1,record.status2].join('-');
          }}
          columns={columns}
          dataSource={props.projectList}
          pagination={{ pageSize: 10}}
        />
        </Row>
        <Row>
          
        </Row>
      </>
    );
}
