import Adb, { DeviceClient } from "@devicefarmer/adbkit";
import Promise  from 'bluebird'
interface ApiType {
    [key: string]: any;
}

const client = Adb.createClient();

const testadb = async () => {
  const devices = await client.listDevices();
  const device = client.getDevice(devices[0].id);
  device
    .shell(
      'su -c /data/data/ru.meefik.linuxdeploy/files/bin/linuxdeploy shell ls'
    )
    .then(Adb.util.readAll)
    .then(function (output: { toString: () => string }) {
      console.log('[%s] %s', devices[0].id, output.toString().trim());
    });
};
const doThing=(data:string)=>{
    console.log('dothing:'+data)
}

const listDevicesMain= async ()=>{ 
    let detailedDeviceList:any[]=[]
    try{
    await client.listDevices().then(function(devices: any) {
        return Promise.map(devices, function(device:any) {
            return client.getDevice(device.id).getProperties()
                .then(function(property:any) {
                  // we might keep all properties
                    detailedDeviceList.push({
                        id: device.id,
                        manufacturer: property['ro.product.manufacturer'],
                        name: property['ro.product.display'],
                        model: property['ro.product.model']
                    })
                })
        })

    });
    }
    catch(err:any){
        console.log(err)
    }
    return {deviceList:detailedDeviceList}
}



const apiList : ApiType={
    'doThing':doThing,
    'listDevicesMain':listDevicesMain
}


export default apiList
