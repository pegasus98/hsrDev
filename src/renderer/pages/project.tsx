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
import { useTranslation } from 'react-i18next';

export default function project(props: any) {
  const { t } = useTranslation();

  const columns = [
    {
      title:t('trace')+' ID',
      dataIndex: 'trace',
      key:'trace',
      render:(id:number)=>id.toString()
    },
    {
      title: t('time'),
      dataIndex: 'index',
      key: 'index',
    },
    {
      title: t('device')+' ID',
      dataIndex: 'deviceId',
      key: 'deviceId',
    },
    {
      title: t('server')+' IP',
      dataIndex: 'serverPath',
      key: 'serverPath',
    },
    {
      title: t('experimentType'),
      dataIndex: 'expType',
      key: 'expType',
    },
    {
      title: t('rat'),
      dataIndex: 'rat',
      key: 'rat',
    },
    {
      title: t('dSynStatus'),
      dataIndex: 'status1',
      key: 'status1',
      render: (status: number) => {
        switch (status) {
          case 0:
            return <span>{t('finish')}</span>;
          case 1:
            return <span>{t('notFinished')}</span>;
          case -1:
            return <span>{t('synchronizing')}</span>;
          default:
            return <span>{t('error')}</span>;
        }
      },
    },
    {
      title: t('sSynStatus'),
      dataIndex: 'status2',
      key: 'status2',
      render: (status: number) => {
        switch (status) {
          case 0:
            return <span>{t('finish')}</span>;
          case 1:
            return <span>{t('notFinished')}</span>;
          case -1:
            return <span>{t('synchronizing')}</span>;
          default:
            return <span>{t('error')}</span>;
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
            t{'openProjectFolder'}
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
                {t('synchronize')}
              </Button>
            )}
          />
          </Col>
        </Row>
      </>
    );
}
