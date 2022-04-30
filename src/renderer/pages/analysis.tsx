import {
  Button,
  Modal,
  Row,
  Table,
  Tree,
  TreeProps,
} from 'antd';
import React, { useState } from 'react';

import { plotTypeList, plotExpRel } from '../../py/plot.config';

import { projectItemType } from 'defines';

export default function project(props: any) {
  const [selectedRowKeys, setSelectedRowKeys] = useState([] as React.Key[]);
  const [selectedRow, setSelectedRow] = useState([] as any[]);
  const [selectedPlotKeys, setSelectedPlotKeys] = useState([] as any[]);
  const [visible, setVisible] = useState(false);

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
  let deviceList = new Set<string>();
  let dateList = new Set<string>();
  let serverPathList = new Set<string>();
  props.projectList.forEach((item: any) => {
    deviceList.add(item.deviceId);
    dateList.add(item.date);
    serverPathList.add(item.serverPath);
  });

  const columns = [
    {
      title: '日期',
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
      title: '设备id',
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
      title: '服务器地址',
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
      title: '实验类型',
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
      title: '网络类型',
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
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: onSelectChange,
  };
  const onCheck: TreeProps['onCheck'] = (checked) => {
    setSelectedPlotKeys(checked as React.Key[]);
    console.log(checked);
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
    console.log(plotRequest);
    window.jsBridge.invoke('parsePlotRequestMain', plotRequest, () => {
      setVisible(false);
    });
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
  return (
    <>
      <Row>
        <Table
          rowKey={(record) => createRowKeys(record)}
          rowSelection={rowSelection}
          columns={columns}
          dataSource={props.projectList}
          pagination={{ pageSize: 10 }}
          footer={() => (
            <Button
              type="primary"
              onClick={() => {
                setVisible(true);
              }}
            >
              绘制统计图
            </Button>
          )}
        />
      </Row>
      <Modal
        title="Basic Modal"
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
      </Modal>
    </>
  );
}
