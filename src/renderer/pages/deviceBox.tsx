
import { List, Button, Table, ConfigProvider,} from 'antd';


export default function deviceItem(props: any) {
  const customizeRenderEmpty = () => (
    //这里面就是我们自己定义的空状态
    <div style={{ textAlign: 'center' }}>
      <p>没有已连接的设备</p>
    </div>
  );
  return (
    <>
      {/* <List
        rowKey="id"
        header={<div>当前设备列表</div>}
        footer={
          <div>
            <Button
              className="btn btn-large btn-default pull-right"
              onClick={props.listDevices}
            >
              <span className="icon icon-text icon-arrows-ccw"></span>
              刷新
            </Button>
          </div>
        }
        bordered
        dataSource={deviceListElements}
        renderItem={(item) => item}
      /> */}
      <ConfigProvider renderEmpty={customizeRenderEmpty}>
      <Table
       bordered
          rowKey={(record) => {
            return record.id;
          }}
          columns={[
            { title: '设备Id', dataIndex: 'id', key: 'id' },
            { title: '厂家', dataIndex: 'manufacturer', key: 'manufacturer' },
            {
              title: '型号',
              dataIndex: 'model',
              key: 'model',
            },
            
          ]}
          dataSource={props.deviceList}
          title={()=>('设备列表')}
          footer={() => (
            <Button
              className="btn btn-large btn-default pull-right"
              onClick={props.listDevices}
            >
              <span className="icon icon-text icon-arrows-ccw"></span>
              刷新
            </Button>
          )}
        ></Table>
     </ConfigProvider>
    </>
  );
}
