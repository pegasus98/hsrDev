
import { List, Button, Table, ConfigProvider,} from 'antd';
import { useTranslation } from 'react-i18next';


export default function deviceItem(props: any) {
  const {t} = useTranslation()
  const customizeRenderEmpty = () => (
    //这里面就是我们自己定义的空状态
    <div style={{ textAlign: 'center' }}>
      <p>{t('noDevice')}</p>
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
            { title: t('device')+' ID', dataIndex: 'id', key: 'id' },
            { title: t('manufacturer'), dataIndex: 
            'manufacturer', key: 'manufacturer' },
            {
              title: t('model'),
              dataIndex: 'model',
              key: 'model',
            },
            
          ]}
          dataSource={props.deviceList}
          title={()=>t('deviceList')}
          footer={() => (
            <Button
              className="btn btn-large btn-default pull-right"
              onClick={props.listDevices}
            >
              <span className="icon icon-text icon-arrows-ccw"></span>
              {t('refresh')}
            </Button>
          )}
        ></Table>
     </ConfigProvider>
    </>
  );
}
