import {
  Button,
  Col,
  Drawer,
  InputNumber,
  Modal,
  Row,
  Space,
  Table,
  Tree,
  TreeProps,
} from 'antd';
import React, { useRef, useState } from 'react';

import { plotTypeList, plotExpRel } from '../../py/plot.config';

import { projectItemType } from 'defines';
import { FolderOpenOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import 'config/i18next.config.render';
export default function project(props: any) {
  const {t}=useTranslation()
  const [selectedRowKeys, setSelectedRowKeys] = useState([] as React.Key[]);
  const [selectedRow, setSelectedRow] = useState([] as any[]);
  const [selectedPlotKeys, setSelectedPlotKeys] = useState([] as any[]);
  const [visible, setVisible] = useState(false);
  const [logHeight, setLogHeight] = useState(0);
  const [col, setCol] = useState(1);
  const [row, setRow] = useState(1);

  const onSelectChange = (
    selectedRowKeys: any[],
    selectedRows: projectItemType[]
  ) => {
    console.log('selectedRowKeys changed: ', selectedRowKeys);
    setSelectedRowKeys(selectedRowKeys);
    setSelectedRow(selectedRows);
  };

  const createRowKeys = (record: projectItemType) => {
    return [
      record.index,
      record.deviceId,
      record.serverPath,
      record.rat,
      record.expType,
    ].join('-');
  };

  const checkSelected = (record: projectItemType) => {
    return selectedRowKeys.indexOf(createRowKeys(record)) != -1;
  };
  const validProjectList = props.projectList.filter(
    (item: projectItemType) => item.status1 == 0 && item.status2 == 0
  );
  let deviceList = new Set<string>();
  let dateList = new Set<string>();
  let serverPathList = new Set<string>();
  // validProjectList.forEach((item: any) => {
  //   deviceList.add(item.deviceId);
  //   dateList.add(item.date);
  //   serverPathList.add(item.serverPath);
  // });
  props.projectList.forEach((item: any) => {
    deviceList.add(item.deviceId);
    dateList.add(item.date);
    serverPathList.add(item.serverPath);
  });

  const columns = [
    {
      title: t('trace')+' ID',
      dataIndex: 'trace',
      key: 'trace',
      render: (id: number) => id.toString(),
    },
    {
      title: t('date'),
      dataIndex: 'date',
      key: 'date',
      filterMultiple: true,
      filters: [
        ...Array.from(dateList).map((val) => {
          return { text: val, value: val };
        }),
      ],
      onFilter: (value: any, record: projectItemType) =>
        checkSelected(record) || record.date.indexOf(value) === 0,
      sorter: (a: any, b: any) => (a.date > b.date ? 1 : -1),
    },
    {
      title: t('time'),
      dataIndex: 'time',
      key: 'time',
      render: (str: string) => {
        return str.slice(0,2)+':'+str.slice(2,4)+':'+str.slice(4,6);
      },
    },
    {
      title: t('device')+' ID',
      dataIndex: 'deviceId',
      key: 'deviceId',
      filterMultiple: true,
      filters: [
        ...Array.from(deviceList).map((val) => {
          return { text: val, value: val };
        }),
      ],
      onFilter: (value: any, record: projectItemType) =>
        checkSelected(record) || record.deviceId.indexOf(value) === 0,
      sorter: (a: any, b: any) => (a.deviceId > b.deviceId ? 1 : -1),
    },
    {
      title: t('server')+' IP',
      dataIndex: 'serverPath',
      key: 'serverPath',
      filters: [
        ...Array.from(serverPathList).map((val) => {
          return { text: val, value: val };
        }),
      ],
      onFilter: (value: any, record: projectItemType) =>
        checkSelected(record) || record.serverPath.indexOf(value) === 0,
      sorter: (a: any, b: any) => (a.serverPath > b.serverPath ? 1 : -1),
    },
    {
      title: t('experimentType'),
      dataIndex: 'expType',
      key: 'expType',
      filters: [
        { text: 'TCP', value: 'TCP' },
        { text: 'QUIC', value: 'TCP' },
        { text: 'QUIC', value: 'QUIC' },
        { text: 'lat', value: 'lat' },
      ],
      onFilter: (value: any, record: projectItemType) =>
        checkSelected(record) || record.expType.indexOf(value) === 0,
    },
    {
      title: t('rat'),
      dataIndex: 'rat',
      key: 'rat',
      filters: [
        { text: 'LTE', value: 'LTE' },
        { text: 'NR-SA', value: 'SA' },
        { text: 'NR-NSA', value: 'NSA' },
      ],
      onFilter: (value: any, record: projectItemType) =>
        checkSelected(record) || record.rat.indexOf(value) === 0,
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

  const rowSelection = {
    selectedRowKeys,
    onChange: onSelectChange,
  };
  const onCheck: TreeProps['onCheck'] = (checked) => {
    setSelectedPlotKeys(checked as React.Key[]);
  };

  const handleOk = () => {
    const plotRequest = selectedPlotKeys
      .filter((plotType: React.Key) => plotType in plotExpRel)
      .map((plotType: React.Key) => {
        return {
          plotType: plotType,
          projectPath: props.path,
          plotKeys: selectedRow.filter((rowData: projectItemType) =>
            plotExpRel[plotType].includes(rowData.expType)
          ),
        };
      })
      .filter((item) => item.plotKeys.length > 0);
    setLogHeight(400);
    window.jsBridge.invoke(
      'parsePlotRequestTotal',
      { row: row, col: col, data: plotRequest },
      () => {
        setVisible(false);
      }
    );
  };
  let plotTypeListShowed = plotTypeList;
  for (let i = 0; i < plotTypeList[1].children.length; ++i) {
    let list = selectedRow.filter((rowData: projectItemType) =>
      plotExpRel[plotTypeList[1].children[i].key].includes(rowData.expType)
    );
    if (list.length <= 1) {
      plotTypeListShowed[1].children[i].disabled = true;
    } else plotTypeListShowed[1].children[i].disabled = false;
  }
  for (let i = 0; i < plotTypeList[0].children.length; ++i) {
    let list = selectedRow.filter((rowData: projectItemType) =>
      plotExpRel[plotTypeList[0].children[i].key].includes(rowData.expType)
    );
    if (list.length <= 0) {
      plotTypeListShowed[0].children[i].disabled = true;
    } else plotTypeListShowed[0].children[i].disabled = false;
  }
  const container = useRef<HTMLDivElement | null>(null);

  const createLog = () => {
    if (container.current) {
      if (container.current.parentNode) {
        const pNode = container.current.parentNode as HTMLDivElement;

        pNode.scrollTop = pNode.scrollHeight - pNode.clientHeight;
      }
    }
    return props.logList.map((item: string) => {
      return <p>{item}</p>;
    });
  };
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
          <Button
            type="primary"
            size="large"
            icon={<FolderOpenOutlined />}
            onClick={props.openProject}
          >
            {t('openPorjectFolder')}
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
              rowKey={(record) => createRowKeys(record)}
              rowSelection={rowSelection}
              columns={columns}
              dataSource={props.projectList}
              pagination={{ pageSize: 10 }}
              footer={() => (
                <Space>
                  <Button type="primary"  disabled={selectedRowKeys.length == 0} onClick={props.getProjectData}>
                    {t("synchronize")}
                  </Button>
                  <Button
                    type="primary"
                    disabled={selectedRowKeys.length == 0||selectedRow.filter((item)=>(item.status1!=0)||(item.status2!=0)).length>0}
                    onClick={() => {
                      setVisible(true);
                    }}
                  >
                    {t("draw")}
                  </Button>
                  <Button
                    type="primary"
                    onClick={() => {
                      props.startSimu(selectedRow[0]);
                    }}
                    disabled={selectedRowKeys.length != 1}
                  >
                    {t("replay")}
                  </Button>
                </Space>
              )}
            />
          </Col>
          <Drawer
            title="日志"
            placement="bottom"
            onClose={() => {
              setLogHeight(0);
            }}
            visible={logHeight > 0}
            height={logHeight}
            maskClosable={false}
            getContainer={false}
            style={{ position: 'absolute' }}
          >
            <div ref={container}>{createLog()}</div>
          </Drawer>
        </Row>
        <Modal
          title="分析类型选择"
          visible={visible}
          onCancel={() => {
            setVisible(false);
          }}
          onOk={handleOk}
          destroyOnClose
        >
          <Tree
            checkable
            onCheck={onCheck}
            selectable={false}
            treeData={plotTypeListShowed}
          />
          行数
          <InputNumber
            min={1}
            max={3}
            defaultValue={1}
            onChange={(value: number) => {
              setRow(value);
            }}
          ></InputNumber>
          列数
          <InputNumber
            min={1}
            max={3}
            defaultValue={1}
            onChange={(value: number) => {
              setCol(value);
            }}
          ></InputNumber>
        </Modal>
      </>
    );
}
