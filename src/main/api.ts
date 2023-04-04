import Adb, { DeviceClient } from '@devicefarmer/adbkit';
import Promise from 'bluebird';
import { ChildProcess, exec, spawn, spawnSync } from 'child_process';
import iconvLite from 'iconv-lite';
import fs, { mkdirSync } from 'fs';
import path, { resolve } from 'path';
import { BrowserWindow, dialog } from 'electron';
import http from 'http';

import { mainWindow } from './main';
import { resolveHtmlPath } from './util';
import { plotTypeList } from '../py/plot.config';
import {
  projectDataType,
  ObjectType,
  DetailLineDataItem,
  NumberLineDataItem,
  projectItemType,
  HandoverDataItem,
  snrLineDataItem,
  KernalDataItem,
  QAckDataItem,
  TagedDataItem,
  RbDataItem,
} from '../defines';
import xperf = require('../script/xperf-js');
const calcDiagStampDiff = require('../script/diag-stamp-js');
import moment from 'moment';

let projectPath = '';
const client = Adb.createClient();
const mkdirsSync = (dirname: string) => {
  if (!fs.existsSync(dirname)) {
    mkdirsSync(path.dirname(dirname));
    fs.mkdirSync(dirname);
  }
};

const getProperPath = (
  basePath: string,
  index: string,
  deviceId: string,
  rat: string,
  expType: string
) => {
  let [YMD, _] = index.split('T');
  return [basePath, YMD, deviceId, rat, expType, ''].join('\\');
};

const parseCsv = (path: string) => {
  const data = fs.readFileSync(path).toString();
  const rows = data.split(/[\n\r]/).filter(Boolean);
  let table = new Array();
  for (var i = 0; i < rows.length; i++) {
    table.push(rows[i].split(','));
  }
  return table;
};

const parseDat = (path: string) => {
  const data = fs.readFileSync(path).toString();

  const rows = data.split(/[\n\r]/).filter(Boolean);
  let table = new Array();
  for (var i = 0; i < rows.length; i++) {
    table.push(rows[i].split('\t'));
  }
  return table;
};

const listDevicesMain = async () => {
  let detailedDeviceList: any[] = [];
  try {
    await client.listDevices().then(function (devices: any) {
      return Promise.map(devices, function (device: any) {
        if (device.type !== 'offline')
          return client
            .getDevice(device.id)
            .getProperties()
            .then(function (property: any) {
              // we might keep all properties
              detailedDeviceList.push({
                id: device.id,
                manufacturer: property['ro.product.manufacturer'],
                name: property['ro.product.display'],
                model: property['ro.product.model'],
              });
            });
        else return;
      });
    });
  } catch (err: any) {
    console.log(err);
  }
  return { deviceList: detailedDeviceList };
};

const runExec = (
  expType: string,
  rat: string,
  deviceId: string,
  expTime: string,
  serverIp: string,
  status: number
) => {
  let windowsIndex = expTime.split('T')[1].replaceAll(':', '');
  let dlogList: string[] = [];

  const dlogProc = spawn('adb', [
    '-s',
    deviceId,
    'shell',
    'su',
    '-c',
    `"cp -r /data/local/mnt/home/android/logs/${expTime} /sdcard/tmp/ && ls /sdcard/tmp/${expTime} | grep '.dlog' | tail -n 2"`,
  ]);
  dlogProc.stdout.on('data', (data) => {
    let dataString = iconvLite.decode(data, 'cp936');
    dlogList.push(...dataString.split(/[\n\r\s]/).filter(Boolean));
  });
  dlogProc.stderr.on('data', (data) => {
    let dataString = iconvLite.decode(data, 'cp936');
  });
  dlogProc.on('close', (code: number) => {
    if (code > 0) console.log('dlog ls error, exit with code:', code);
    if (!code && dlogList.length === 2) {
      let selected = dlogList[0];
      let selectedTlog = dlogList[0].replace('dlog', 'tlog');

      let properPath = getProperPath(
        projectPath,
        expTime,
        deviceId,
        rat,
        expType
      );
      let fullPath = [properPath, windowsIndex].join('');
      const dlogTargetPath = `${fullPath}\\${selected.substring(
        0,
        selected.lastIndexOf('.')
      )}.qmdl`;
      const tlogTargetPath = `${fullPath}\\${selected.substring(
        0,
        selected.lastIndexOf('.')
      )}.tlog`;
      const cmd1 = `adb -s ${deviceId} pull /sdcard/tmp/${expTime}/${selected} ${dlogTargetPath}`;
      const cmd2 = `adb -s ${deviceId} pull /sdcard/tmp/${expTime}/${selectedTlog} ${tlogTargetPath}`;
      mkdirsSync(fullPath);
      //deal with dlog
      const dlogbat = exec(`${cmd1} && ${cmd2}`, (error, stdout, sederr) => {
        if (error) {
          console.error(`dlogbat 执行出错: ${error}`);
          return;
        }
        const diff = calcDiagStampDiff(dlogTargetPath, tlogTargetPath);
        mainWindow?.webContents.send('diff', {
          diff: Math.round(diff / 1000000),
        });
        const data = JSON.stringify({
          projectPath: projectPath,
          plotType: 'online',
          data: `${fullPath}\\${selected.substring(
            0,
            selected.lastIndexOf('.')
          )}.qmdl`,
          rat: rat,
        });
        const req = http.request(
          {
            hostname: 'localhost',
            path: '/',
            port: 65500,
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'Content-Length': data.length,
            },
          },
          (res) => {
            res.on('data', (d) => {
              resolveData(d, status, deviceId);
            });
          }
        );
        req.write(data);
        req.on('error', (err) => {
          console.log(err);
        });
        req.end();
      });

      if (expType === 'TCP') {
        const kdatbat = spawn('adb', [
          '-s',
          deviceId,
          'pull',
          `/sdcard/tmp/${expTime}/kdat`,
          `${fullPath}\\kdat`,
        ]);
        kdatbat.on('exit', (code: number) => {
          if (code === 0) {
            let buffer = fs.readFileSync(`${fullPath}\\kdat`);

            const deserializer = new xperf.Deserializer(
              xperf.TCP_DATA,
              (data: KernalDataItem[]) => {
                let group: { [index: number]: KernalDataItem } = {};
                let i = 0;
                while (i < data.length && data[i].bltBw === 0) {
                  i++;
                }
      
                for (; i < data.length; ++i) {
                  const index = Math.floor(data[i].stamp / 100) * 100;
                  if (group[index]) {
                    if (
                      Math.abs(index - data[i].stamp) <
                      Math.abs(index - group[index].stamp)
                    )
                      group[index] = data[i];
                  } else group[index] = data[i];
                }
      
                let res:KernalDataItem[] = Object.values(group).map((item) => ({
                  stamp: Math.floor(item.stamp / 100) * 100,
                  bltBw: item.bltBw,
                  cwnd: item.cwnd,
                  minRtt: item.minRtt,
                  time: moment(Math.floor(item.stamp / 100) * 100).format(
                    'HH:mm:ss.S'
                  ),
                }));
                let insertData = new Array<KernalDataItem>();
                for (let i = 1; i < res.length - 1; i++) {
                  if (res[i].stamp- res[i - 1].stamp > 150) {
                    let pointer = res[i].stamp - 100;
                    const kbltBw =
                      (res[i - 1].bltBw - res[i].bltBw) /
                      (res[i - 1].stamp - res[i].stamp);
                      const kcwnd =
                      (res[i - 1].cwnd - res[i].cwnd) /
                      (res[i - 1].stamp - res[i].stamp);
                      const kmrtt =
                      (res[i - 1].minRtt - res[i].minRtt) /
                      (res[i - 1].stamp - res[i].stamp);
                    while (pointer > res[i - 1].stamp) {
                      
                    insertData.push({
                      stamp: pointer,
                      time: moment(pointer).format('HH:mm:ss.S'),
                      bltBw:
                        Math.round(
                          (kbltBw * (pointer - res[i].stamp) + res[i].bltBw) * 100
                        ) / 100,
                      cwnd:Math.round(
                        (kcwnd * (pointer - res[i].stamp) + res[i].cwnd) * 100
                      ) / 100,
                      minRtt:Math.round(
                        (kmrtt * (pointer - res[i].stamp) + res[i].minRtt) * 100
                      ) / 100
                    });
                      pointer = pointer - 100;
                    }
                  }
                }
                res = res.concat(insertData);
                res.sort((a,b)=>(a.stamp-b.stamp))
                mainWindow?.webContents.send('onlineCore', {
                  deviceId: deviceId,
                  coreData: res,
                });
              }
            );

            deserializer.feed(buffer);
          }
        });
        let thps = new Array();
        let rtts = new Array();
        const commend = `adb -s ${deviceId} shell su -c /data/data/ru.meefik.linuxdeploy/files/bin/linuxdeploy shell "tshark -r /home/android/logs/${expTime}/x.pcap -T fields -e frame.time_epoch -e ip.len -e tcp.analysis.ack_rtt |awk '{s[int(($1-1661603700)*10)] += $2;r[int(($1-1661603700)*10)]+=$3;if($3)c[int(($1-1661603700)*10)]+=1}END{ for(i in s){  print i, s[i],r[i],c[i] } }'"`;
        // console.log(commend)
        const pcapbat = exec(commend, (error, stdout, stderr) => {
          if (error) {
            console.error(`pcapbat 执行出错: ${error}`);
            return;
          }
          if (stderr) console.log('stderr:', stderr);
          // console.log(commend);
          const rows = stdout.split(/[\n\r]/).filter(Boolean);
          for (var i = 0; i < rows.length; i++) {
            const data = rows[i].split(/[\t\s]/);

            if (data.length < 3) continue;
            const timestampSecond = parseInt(data[0]);
            if (timestampSecond < 0) continue;
            let rtt = parseFloat(data[2]);
            thps.push({
              timestamp: (timestampSecond + 16616037000) * 100,
              time: moment((timestampSecond + 16616037000) * 100).format(
                'HH:mm:ss.S'
              ),
              value: parseInt(data[1]),
            });

            if (data.length === 4) {
              if (rtt < 0.01) continue;
              const rttCnt = parseInt(data[3]);
              rtts.push({
                timestamp: (timestampSecond + 16616037000) * 100,
                time: moment((timestampSecond + 16616037000) * 100).format(
                  'HH:mm:ss.S'
                ),
                value: rtt / rttCnt,
              });
            }
          }
          thps.sort((a, b) => a.timestamp - b.timestamp);
          rtts.sort((a, b) => a.timestamp - b.timestamp);
          let insertData = new Array();
          for (let i = 1; i < rtts.length - 1; i++) {
            if (rtts[i].timestamp - rtts[i - 1].timestamp > 150) {
              let pointer = rtts[i].timestamp - 100;
              while (pointer > rtts[i - 1].timestamp) {
                const k =
                  (rtts[i - 1].value - rtts[i].value) /
                  (rtts[i - 1].timestamp - rtts[i].timestamp);
                insertData.push({
                  timestamp: pointer,
                  time: moment(pointer).format('HH:mm:ss.S'),
                  value:
                    Math.round(
                      (k * (pointer - rtts[i].timestamp) + rtts[i].value) * 10
                    ) / 10,
                });
                pointer = pointer - 100;
              }
            }
          }
          rtts = rtts.concat(insertData);
          rtts.sort((a, b) => a.timestamp - b.timestamp);
          // const localpcap = exec(
          //   `adb -s ${deviceId}  shell su -c /data/data/ru.meefik.linuxdeploy/files/bin/linuxdeploy shell "tshark -r /home/android/logs/${expTime}/x.pcap -T fields -e ip.len  |awk '{sum += $1}END{   print sum}'"`,
          //   (error, stdout, stderr) => {
          //     const sum = parseFloat(stdout);
          mainWindow?.webContents.send('onlinePcap', {
            thp: thps,
            rtt: rtts,
            // sum: sum,
          });
          //   }
          // );
        });
      }
      if (expType === 'QUIC') {
        const qdatbat = spawn('adb', [
          '-s',
          deviceId,
          'pull',
          `/sdcard/tmp/${expTime}/qdat`,
          `${fullPath}\\qdat`,
        ]);
        qdatbat.on('exit', (code: number) => {
          if (code === 0) {
            let buffer = fs.readFileSync(`${fullPath}\\qdat`);

            const deserializer = new xperf.Deserializer(
              xperf.QUIC_DATA,
              (data: KernalDataItem[]) => {
                let group: { [index: number]: KernalDataItem } = {};
                let i = 0;
                while (i < data.length && data[i].bltBw === 0) {
                  i++;
                }
      
                for (; i < data.length; ++i) {
                  const index = Math.floor(data[i].stamp / 100) * 100;
                  if (group[index]) {
                    if (
                      Math.abs(index - data[i].stamp) <
                      Math.abs(index - group[index].stamp)
                    )
                      group[index] = data[i];
                  } else group[index] = data[i];
                }
      
                let res:KernalDataItem[] = Object.values(group).map((item) => ({
                  stamp: Math.floor(item.stamp / 100) * 100,
                  bltBw: item.bltBw,
                  cwnd: item.cwnd,
                  minRtt: item.minRtt,
                  time: moment(Math.floor(item.stamp / 100) * 100).format(
                    'HH:mm:ss.S'
                  ),
                }));
                res.sort((a,b)=>(a.stamp-b.stamp))
                mainWindow?.webContents.send('onlineCore', {
                  deviceId: deviceId,
                  coreData: res,
                });
              }
            );

            deserializer.feed(buffer);
          }
        });
        const qackbat = spawn('adb', [
          '-s',
          deviceId,
          'pull',
          `/sdcard/tmp/${expTime}/qack`,
          `${fullPath}\\qack`,
        ]);
        qackbat.on('exit', (code: number) => {
          if (code === 0) {
            let buffer = fs.readFileSync(`${fullPath}\\qack`);
            const deserializer = new xperf.Deserializer(
              xperf.QUIC_ACK,
              (data: QAckDataItem[]) => {
                let group: { [index: number]: QAckDataItem } = {};
                let i = 0;
      
                for (; i < data.length; ++i) {
                  const index = Math.floor(data[i].stamp / 100) * 100;
                  if (group[index]) {
                    if (
                      Math.abs(index - data[i].stamp) <
                      Math.abs(index - group[index].stamp)
                    )
                      group[index] = data[i];
                  } else group[index] = data[i];
                }
      
                let res:DetailLineDataItem[] = Object.values(group).map((item) => ({
                    timestamp:Math.floor(item.stamp / 100) * 100,
                    value:item.rtt/1000
                }))
                mainWindow?.webContents.send('onlinePcap', {
                  deviceId: deviceId,
                  rtt: res,
                });
              }
            );

            deserializer.feed(buffer);
          }
        });
      }
    }
  });

  const thpCommend = `adb -s ${deviceId} shell su -c /data/data/ru.meefik.linuxdeploy/files/bin/linuxdeploy shell "tshark -r /home/android/logs/${expTime}/l3.pcap -T fields -e frame.time_epoch -e ip.len |awk '{s[int(($1-1661603700)*10)] += $2;}END{ for(i in s){  print i, s[i]} }'"`;

  const pcapbat = exec(thpCommend, (error, stdout, stderr) => {
    if (error) {
      console.error(`pcapbat 执行出错: ${error}`);
      return;
    }
    let thps = new Array();
    if (stderr) console.log('stderr:', stderr);
    const rows = stdout.split(/[\n\r]/).filter(Boolean);
    for (var i = 0; i < rows.length; i++) {
      const data = rows[i].split(/[\t\s]/);
      const timestampSecond = parseInt(data[0]);
      if (timestampSecond < 0) continue;
      thps.push({
        timestamp: (timestampSecond + 16616037000) * 100,
        time: moment((timestampSecond + 16616037000) * 100).format(
          'HH:mm:ss.S'
        ),
        value: parseInt(data[1])*8/100000,
      });
    }
    thps.sort((a, b) => a.timestamp - b.timestamp);
    let insertData = new Array();
    for (let i = 1; i < thps.length - 1; i++) {
      if (thps[i].timestamp - thps[i - 1].timestamp > 150) {
        let pointer = thps[i].timestamp - 100;
        while (pointer > thps[i - 1].timestamp) {

          insertData.push({
            timestamp: pointer,
            time: moment(pointer).format('HH:mm:ss.S'),
            value:0
          });
          pointer = pointer - 100;
        }
      }
    }
    thps = thps.concat(insertData);
    thps.sort((a, b) => a.timestamp - b.timestamp);
    mainWindow?.webContents.send('onlineData', {
      thpValue: thps,
    });
  });
};

const runSimulate = (expInfo: projectItemType) => {
  if (!('timeDur' in expInfo) || expInfo.timeDur == undefined)
    expInfo.timeDur = 10;
  let cnt = 0;
  let properPath = getProperPath(
    projectPath,
    expInfo.date,
    expInfo.deviceId,
    expInfo.rat,
    expInfo.expType
  );
  let fullPath = [properPath, expInfo.time].join('');
  var interval = setInterval(() => {
    cnt++;
    if (expInfo.timeDur == undefined) expInfo.timeDur = 10;
    let status = expInfo.timeDur - cnt;
    if (status <= 0) clearInterval(interval);

    const dlogTargetPath = `${fullPath}\\l2.${(cnt + '').padStart(
      4,
      '0'
    )}.qmdl`;
    const tlogTargetPath = `${fullPath}\\l2.${(cnt + '').padStart(
      4,
      '0'
    )}.tlog`;
    try {
      console.log(dlogTargetPath);
      const diff = calcDiagStampDiff(dlogTargetPath, tlogTargetPath);
      mainWindow?.webContents.send('diff', {
        diff: Math.round(diff / 1000000),
      });
    } catch (error) {
      console.log(error);
    }

    const data = JSON.stringify({
      projectPath: projectPath,
      plotType: 'online',
      data: `${fullPath}\\l2.${(cnt + '').padStart(4, '0')}.qmdl`,
      rat: expInfo.rat,
    });
    const req = http.request(
      {
        hostname: 'localhost',
        path: '/',
        port: 65500,
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': data.length,
        },
      },
      (res) => {
        res.on('data', (d) => {
          resolveData(d, status, expInfo.deviceId);
        });
      }
    );
    req.write(data);
    req.on('error', (err) => {
      console.log(err);
    });
    req.end();
  }, 1000);
  const pcapbat = exec(`tshark -r ${fullPath}\\l3.pcap -T fields -e frame.time_epoch -e ip.len `,{maxBuffer:1024*1024*10}, (error, stdout, stderr) => {
      
    let thpsMap: { [index: number]: DetailLineDataItem } = {};

      const rows = stdout.split(/[\n\r]/).filter(Boolean);
      rows.forEach((row: string) => {
        const items = row.split(/[\s\t]/).filter(Boolean);
        if(items.length<2) return;
        const index = Math.floor(parseFloat(items[0]) * 10) * 100;
        const len = parseInt(items[1]);
        if (thpsMap[index]) {
          thpsMap[index] = {
            ...thpsMap[index],
            value: thpsMap[index].value + len,
          };
        } else {
          thpsMap[index] = { timestamp: index, value: len };
        }
      });
      let thps: DetailLineDataItem[] = Object.values(thpsMap).map(item=>({...item,value:(item.value*8/100000)}));
      thps.sort((a, b) => a.timestamp - b.timestamp);
      

      let insertData = new Array();
      for (let i = 1; i < thps.length - 1; i++) {
        if (thps[i].timestamp - thps[i - 1].timestamp > 150) {
          let pointer = thps[i].timestamp - 100;
          while (pointer > thps[i - 1].timestamp) {
  
            insertData.push({
              timestamp: pointer,
              time: moment(pointer).format('HH:mm:ss.S'),
              value:0
            });
            pointer = pointer - 100;
          }
        }
      }
      thps = thps.concat(insertData);
      thps.sort((a, b) => a.timestamp - b.timestamp);
      mainWindow?.webContents.send('onlineData', {
        thpValue: thps,
      });
    });
  console.log(expInfo.expType);
  if (expInfo.expType === 'TCP') {
    try {
      const kdatTargetPath = `${fullPath}\\kdat`;
      let buffer = fs.readFileSync(kdatTargetPath);
      const deserializer = new xperf.Deserializer(
        xperf.TCP_DATA,
        (data: KernalDataItem[]) => {
          let group: { [index: number]: KernalDataItem } = {};
          let i = 0;
          while (i < data.length && data[i].bltBw === 0) {
            i++;
          }

          for (; i < data.length; ++i) {
            const index = Math.floor(data[i].stamp / 100) * 100;
            if (group[index]) {
              if (
                Math.abs(index - data[i].stamp) <
                Math.abs(index - group[index].stamp)
              )
                group[index] = data[i];
            } else group[index] = data[i];
          }

          let res:KernalDataItem[] = Object.values(group).map((item) => ({
            stamp: Math.floor(item.stamp / 100) * 100,
            bltBw: item.bltBw,
            cwnd: item.cwnd,
            minRtt: item.minRtt,
            time: moment(Math.floor(item.stamp / 100) * 100).format(
              'HH:mm:ss.S'
            ),
          }));
          
          mainWindow?.webContents.send('onlineCore', {
            deviceId: expInfo.deviceId,
            coreData: res,
          });
        }
      );

      deserializer.feed(buffer);
    } catch (error) {
      console.log(error);
    }
    const tsharkBat =exec(`tshark -r ${fullPath}\\x.pcap -T fields -e frame.time_epoch -e ip.len -e tcp.analysis.ack_rtt`,{maxBuffer:1024*1024*10}, (error, stdout, sederr) => {

    let thpsMap: { [index: number]: DetailLineDataItem } = {};
    let rttsMap: { [index: number]: DetailLineDataItem } = {};
    let rttsCnt: { [index: number]: number } = {};

      const rows = stdout.split(/[\n\r]/).filter(Boolean);
      console.log(rows.length)
      rows.forEach((row: string) => {
        const items = row.split(/[\s\t]/).filter(Boolean);
        if(items.length<2) return;
        const index = Math.floor(parseFloat(items[0]) * 10) * 100;
        const len = parseInt(items[1]);
        if (thpsMap[index]) {
          thpsMap[index] = {
            ...thpsMap[index],
            value: thpsMap[index].value + len,
          };
        } else {
          thpsMap[index] = { timestamp: index, value: len };
        }
        if (items.length === 3) {
          if (rttsMap[index]) {
            rttsCnt[index] += 1;
            rttsMap[index] = {
              ...rttsMap[index],
              value: rttsMap[index].value + parseFloat(items[2]),
            };
          } else {
            rttsCnt[index] = 1;
            rttsMap[index] = {
              timestamp: index,
              value: parseFloat(items[2]),
            };
          }
        }
      });
      let thps: DetailLineDataItem[] = Object.values(thpsMap);
      let rtts: DetailLineDataItem[] = Object.values(rttsMap).map((item) => ({
        timestamp: item.timestamp,
        value: item.value / rttsCnt[item.timestamp],
      }));
      thps.sort((a, b) => a.timestamp - b.timestamp);
      rtts.sort((a, b) => a.timestamp - b.timestamp);
      let insertData = new Array();
      for (let i = 1; i < rtts.length - 1; i++) {
        if (rtts[i].timestamp - rtts[i - 1].timestamp > 150) {
          let pointer = rtts[i].timestamp - 100;
          while (pointer > rtts[i - 1].timestamp) {
            const k =
              (rtts[i - 1].value - rtts[i].value) /
              (rtts[i - 1].timestamp - rtts[i].timestamp);
            insertData.push({
              timestamp: pointer,
              time: moment(pointer).format('HH:mm:ss.S'),
              value: k * (pointer - rtts[i].timestamp) + rtts[i].value,
            });
            pointer = pointer - 100;
          }
        }
      }
      rtts = rtts.concat(insertData);
      rtts.sort((a, b) => a.timestamp - b.timestamp);
      console.log(rtts.length,thps.length)
      mainWindow?.webContents.send('onlinePcap', {
        thp: thps,
        rtt: rtts,
      });
    });


  }

  if (expInfo.expType === 'video') {
    const videoTargetPath = `${fullPath}\\log.video`;
    resolveVideo(videoTargetPath, expInfo.deviceId,true);
  }
};

const runVideo = (
  deviceId: string,
  serverPath: string,
  expType: string,
  rat: string,
  timeDur: number
) => {
  //todo:  getprop gsm.network.type
  let nowDate = new Date();
  let dateString = nowDate.toISOString().split('.')[0];
  let serverIp = serverPath.split('@')[1];
  let newExpType = expType;
  let cnt = 0;
  let properPath = getProperPath(
    projectPath,
    dateString,
    deviceId,
    rat,
    expType
  );
  let windowsIndex = dateString.split('T')[1].replaceAll(':', '');
  let fullPath = [properPath, windowsIndex].join('');
  mkdirsSync(fullPath);
  const bat = spawn('adb', [
    '-s',
    deviceId,
    'shell',
    'su',
    '-c',
    '/data/data/ru.meefik.linuxdeploy/files/bin/linuxdeploy',
    'shell',
    'bash',
    '/home/android/android.sh',
    'listen',
    serverIp,
    dateString,
    timeDur.toString(),
  ]);
  bat.stderr.on('data', (data) => {
    console.error(`stderror:${iconvLite.decode(data, 'cp936')}`);
  });
  // bat.stdout.on('data', (data) => {
  //   console.log(`stdout:${iconvLite.decode(data, 'cp936')}`);
  // });
  var interval = setInterval(() => {
    const targetPath = `${fullPath}\\log.video`;
    runExec(expType, rat, deviceId, dateString, serverIp, 100);
    if (fs.existsSync(targetPath)) {
      resolveVideo(targetPath, deviceId);
      cnt++;
    }
  }, 1000);

  bat.on('exit', (code: number) => {
    if (code > 0)
      console.log('exp error, code:', code, expType, serverIp, dateString);
  });

  const videoProcess = spawn('python', [
    './src/hsrexp-scripts/video_test.py',
    deviceId,
    fullPath,
  ]);
  videoProcess.stderr.on('data', (data) => {
    console.error(`stderror:${iconvLite.decode(data, 'cp936')}`);
  });
  videoProcess.stdout.on('data', (data) => {
    console.log(`stdout:${iconvLite.decode(data, 'cp936')}`);
  });
  videoProcess.on('exit', (code: number) => {
    console.log(code);

    setTimeout(() => {
      const killproc = spawnSync('adb', [
        '-s',
        deviceId,
        'shell',
        'su',
        '-c',
        '/data/data/ru.meefik.linuxdeploy/files/bin/linuxdeploy',
        'shell',
        'pkill',
        '-f',
        'android.sh',
      ]);
      if (bat && !bat.killed) {
        bat.kill();
      }
    }, 1000);
    mainWindow?.webContents.send('expStatus', {
      deviceId: deviceId,
      code: code,
      dataIndex: dateString,
      timeDur: cnt,
      rat: rat,
    });
    clearInterval(interval);
  });
};
//isOffLine: is off line=>true
const resolveVideo = (path: any, deviceId: string,isOffLine?:Boolean) => {
  const data = JSON.stringify({
    projectPath: projectPath,
    plotType: 'onlinevideo',
    data: path,
  });

  const req = http.request(
    {
      hostname: 'localhost',
      path: '/',
      port: 65500,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': data.length,
      },
    },
    (res) => {
      res.on('data', (d) => {
        let pathToDat = JSON.parse(d.toString());
        let bitrateResult = [] as DetailLineDataItem[];
        let bufferResult = [] as DetailLineDataItem[];
        if ('bitrate' in pathToDat) {
          const table = parseDat(pathToDat.bitrate);
          if (table.length > 1) {
            for (let i = 0; i < table.length; ++i) {
              bitrateResult.push({
                timestamp: Math.floor(parseFloat(table[i][0]) * 1000),
                value: parseFloat(table[i][1]) + 1,
              });
            }
          }
        }
        if ('buffer' in pathToDat) {
          const table = parseDat(pathToDat.buffer);
          if (table.length > 1) {
            for (let i = 0; i < table.length; ++i) {
              bufferResult.push({
                timestamp: Math.floor(parseFloat(table[i][0]) * 1000),
                value: parseFloat(table[i][1]),
              });
            }
          }
        }
        let playingTotal = 0;
        let waitingTotal = 0;
        if ('stat' in pathToDat) {
          // const data=fs.readFileSync(pathToDat.stat).toString()
          // console.log(data)
          const data = JSON.parse(fs.readFileSync(pathToDat.stat).toString());
          playingTotal = data.playing;
          waitingTotal = data.waiting;
        }
        const sendData = {
          deviceId: deviceId,
          buffer: bufferResult,
          bitrate: bitrateResult,
          status: !(isOffLine)&&pathToDat.finished,
          waiting: pathToDat.waiting,
          time: [playingTotal, waitingTotal],
        };
        mainWindow?.webContents.send('onlineVideo', sendData);
      });
    }
  );
  req.write(data);
  req.on('error', (err) => {
    console.log(err);
  });
  req.end();
};

const resolveData = (path: any, status: number, deviceId: string) => {
  let pathToCsv = JSON.parse(path.toString());
  let snrResult = [] as snrLineDataItem[];
  let rsrpResult = [] as DetailLineDataItem[];
  //let thpResult = [] as DetailLineDataItem[];
  let handoverResult = [] as HandoverDataItem[];
  let rbResult:RbDataItem[]=[];
  if ('snr' in pathToCsv) {
    const table = parseCsv(pathToCsv.snr);
    if (table.length > 1) {
      for (let i = 1; i < table.length; ++i) {
        snrResult.push({
          timestamp: Math.floor(parseFloat(table[i][1]) * 1000),
          value: parseFloat(table[i][2]),
          rat: table[i][3],
        });
      }
    }
  }
  if ('rsrp' in pathToCsv) {
    const table = parseCsv(pathToCsv.rsrp);
    if (table.length > 1) {
      for (let i = 1; i < table.length; ++i) {
        rsrpResult.push({
          timestamp: Math.floor(parseFloat(table[i][3]) * 1000),
          value: parseFloat(table[i][2]),
        });
      }
    }
  }
  if ('duration' in pathToCsv) {
    const table = parseCsv(pathToCsv.duration);
    if (table.length > 0) {
      for (let i = 0; i < table.length; ++i) {
        const timestampSecond = parseFloat(table[i][1]);
        const duration = parseFloat(table[i][2]);

        handoverResult.push({
          start: Math.floor(timestampSecond * 10) * 100,
          end: Math.ceil((timestampSecond + duration) * 10) * 100,
          type: parseInt(table[i][0]),
          duration: duration,
        });
      }
    }
  }
  // if ('thp' in pathToCsv) {
  //   const table = parseCsv(pathToCsv.thp);
  //   if (table.length > 1) {
  //     for (let i = 1; i < table.length; ++i) {
  //       thpResult.push({
  //         timestamp: Math.floor(parseFloat(table[i][1]) * 1000),
  //         value: parseFloat(table[i][2]),
  //       });
  //     }
  //   }
  //   // mainWindow?.webContents.send('throughput', {
  //   //   deviceId: expInfo.deviceId,
  //   //   value: result,
  //   //   status:cnt

  //   // });
  // }
  if('rb' in pathToCsv){
    const table = parseCsv(pathToCsv.rb);
    const typeList = ["256QAM","64QAM","16QAM","QPSK"]
    if(table.length>0){
      for(let i = 1;i<table.length;++i){
        const timestampSecond = parseFloat(table[i][0])
        const util = parseFloat(table[i][1])*100
        let type = typeList.findIndex(item=> item===table[i][2].replace('_',""))

        rbResult.push({timestamp:timestampSecond*1000,value:util,type:type,util:0})
      }
    }
  }

  const sendData = {
    deviceId: deviceId,
    snrValue: snrResult,
    rsrpValue: rsrpResult,
    // thpValue: thpResult,
    handoverValue: handoverResult,
    rbValue:rbResult,
    status: status,
  };
  mainWindow?.webContents.send('onlineData', sendData);
};

const startSingleExp = (
  deviceId: string,
  serverPath: string,
  expType: string,
  rat: string,
  timeDur: number
) => {
  //todo:  getprop gsm.network.type
  let nowDate = new Date();
  let dateString = nowDate.toISOString().split('.')[0];
  let serverIp = serverPath.split('@')[1];
  let newExpType = expType;
  let cnt = 0;
  if (newExpType === 'TCP') {
    newExpType = 'bbr';
  } else if (newExpType === 'QUIC') {
    newExpType = 'quic';
  } else if (newExpType === 'video') {
  }
  const bat = spawn('adb', [
    '-s',
    deviceId,
    'shell',
    'su',
    '-c',
    '/data/data/ru.meefik.linuxdeploy/files/bin/linuxdeploy',
    'shell',
    'bash',
    '/home/android/android.sh',
    newExpType,
    serverIp,
    dateString,
    timeDur.toString(),
  ]);
  bat.stderr.on('data', (data) => {
    console.error(`stderror:${iconvLite.decode(data, 'cp936')}`);
  });
  bat.stdout.on('data', (data) => {
  });
  var interval = setInterval(() => {
    cnt++;
    runExec(expType, rat, deviceId, dateString, serverIp, timeDur - cnt + 1);
    if (timeDur - cnt + 1 <= 0) clearInterval(interval);
  }, 1000);

  bat.on('exit', (code: number) => {
    // clearInterval(interval);
    console.log('exp exited ');
    if (code > 0)
      console.log('exp error, code:', code, expType, serverIp, dateString);

    mainWindow?.webContents.send('expStatus', {
      deviceId: deviceId,
      code: code,
      dataIndex: dateString,
      timeDur: timeDur,
      rat: rat,
    });
  });
};
const getNetworkType = (
  deviceId: string,
  serverPath: string,
  expType: string,
  timeDur: number
) => {
  //todo:  getprop gsm.network.type
  let rat = '';
  const bat = spawn('adb', [
    '-s',
    deviceId,
    'shell',
    'su -c getprop gsm.network.type;',
  ]);
  bat.stdout.on('data', (data) => {
    let dataString = iconvLite.decode(data, 'cp936');
    let rLTE = /LTE/;
    let rSA = /NR_SA/;
    let rNSA = /NR_NSA/;
    if (rLTE.test(dataString)) {
      rat = 'LTE';
    }
    if (rSA.test(dataString)) {
      rat = 'SA';
    }
    if (rNSA.test(dataString)) {
      rat = 'NSA';
    }
  });

  bat.on('close', (code: number) => {
    if (code > 0) console.error('get network type error');
    if (expType === 'video') {
      runVideo(deviceId, serverPath, expType, rat, timeDur);
    } else startSingleExp(deviceId, serverPath, expType, rat, timeDur);
  });
};

const startExpMain = (expList: any[]) => {
  expList.map((expItem) => {
    getNetworkType(
      expItem.deviceId,
      expItem.serverPath,
      expItem.expType,
      expItem.timeDur
    );
  });
};

const testSingleServer = (ip: string, username: string) => {
  const lsProc = spawn('ssh', [
    [username, ip].join('@'),
    `bash server.sh >/dev/null 2>&1 &`,
  ]);
  // lsProc.stdout.on('data', (data) => {
  //   let dataString = iconvLite.decode(data, 'cp936');
  //   console.log('stdout', dataString);
  // });
  lsProc.stderr.on('data', (data) => {
    let dataString = iconvLite.decode(data, 'cp936');
    console.log('stderr', dataString);
  });
  lsProc.on('close', (code) => {
    if (!code) {
      setTimeout(() => {
        const bat = spawn('ssh', [
          [username, ip].join('@'),
          `ps aux|grep server.sh|wc -l`,
        ]);
        bat.stdout.on('data', (data) => {
          let dataString = iconvLite.decode(data, 'cp936');
          let res = parseInt(dataString) == 7 ? 0 : 1;
          mainWindow?.webContents.send('serverStatus', {
            ip: ip,
            code: res,
          });
        });

        bat.stderr.on('data', (data) => {
          console.error(`stderror:${iconvLite.decode(data, 'cp936')}`);
        });

        bat.on('exit', (code) => {
          console.log(`Child exited with code ${code}`);
        });
      }, 1000);
    }
  });
};

const testServerMain = (serverList: any[]) => {
  serverList.map((server) => {
    testSingleServer(server.ip, server.username);
  });
};

const getDeviceDataMain = (data: { path: string; projectItem: any }) => {
  let { path, projectItem } = data;
  if (path[path.length - 1] === '/') path = path.substring(0, path.length - 1);
  let windowsIndex = projectItem.time.replaceAll(':', '');
  const getPcap = spawn('adb', [
    '-s',
    projectItem.deviceId,
    'shell',
    `su -c /data/data/ru.meefik.linuxdeploy/files/bin/linuxdeploy shell bash /home/android/out.sh ${projectItem.index} ${windowsIndex};`,
    `su -c rm -rf /sdcard/tmp/${windowsIndex};`,
    `su -c cp -R /data/local/mnt/home/android/logs/${projectItem.index} /sdcard/tmp/${windowsIndex}`,
  ]);
  // getPcap.stdout.on('data', (data) => {
  //   console.log(`stdout:${iconvLite.decode(data, 'cp936')}`);
  // });

  getPcap.stderr.on('data', (data) => {
    console.error(`stderror:${iconvLite.decode(data, 'cp936')}`);
  });

  getPcap.on('close', (code) => {
    if (!code) {
      let properPath = getProperPath(
        path,
        projectItem.index,
        projectItem.deviceId,
        projectItem.rat,
        projectItem.expType
      );

      mkdirsSync(properPath + windowsIndex);

      const bat = spawn('adb', [
        '-s',
        projectItem.deviceId,
        'pull',
        `/sdcard/tmp/${windowsIndex}`,
        properPath,
      ]);
      bat.stderr.on('data', (data) => {
        console.error(`stderror:${iconvLite.decode(data, 'cp936')}`);
      });
      // bat.stdout.on('data', (data) => {
      //   console.log(`stdout:${iconvLite.decode(data, 'cp936')}`);
      // });

      bat.on('exit', (code: number) => {
        if (code > 0) console.log('adb pull error');
        mainWindow?.webContents.send('getDeviceDataStatus', {
          deviceId: projectItem.deviceId,
          code: code,
          dataIndex: projectItem.index,
        });
      });
    } else {
      console.error('get pcap exit with code', code);
    }
  });
};
const getServerDataMain = (data: { path: string; projectItem: any }) => {
  let { path, projectItem } = data;

  if (path[path.length - 1] === '/') path = path.substring(0, path.length - 1);
  let dataPath = '';
  if (projectItem.expType === 'TCP') dataPath = ':~/bbr-logs/';
  else if (projectItem.expType === 'QUIC') dataPath = ':~/logs/';
  else {
    mainWindow?.webContents.send('getServerDataStatus', {
      deviceId: projectItem.deviceId,
      code: 0,
      dataIndex: projectItem.index,
    });
    return;
  }
  let windowsIndex = projectItem.time.replaceAll(':', '');
  let properPath = getProperPath(
    path,
    projectItem.index,
    projectItem.deviceId,
    projectItem.rat,
    projectItem.expType
  );
  mkdirsSync(properPath + windowsIndex);
  let remoteFullPath =
    projectItem.serverPath + dataPath + projectItem.index + '/*';
  const getServer = spawn('scp', [
    '-r',
    remoteFullPath,
    properPath + windowsIndex,
  ]);
  getServer.stderr.on('data', (data) => {
    console.error(`stderror:${iconvLite.decode(data, 'cp936')}`);
  });
  // getServer.stdout.on('data', (data) => {
  //   console.log(`stdout:${iconvLite.decode(data, 'cp936')}`);
  // });

  getServer.on('exit', (code) => {
    mainWindow?.webContents.send('getServerDataStatus', {
      deviceId: projectItem.deviceId,
      code: code,
      dataIndex: projectItem.index,
    });
  });
};

const openProjectMain = () => {
  dialog
    .showOpenDialog({
      properties: ['openDirectory'],
      buttonLabel: '打开项目',
    })
    .then((result) => {
      if (!result.canceled) {
        let path = result.filePaths[0];
        if (fs.existsSync(path)) {
          let fullPath = path + '\\config.json';
          try {
            fs.accessSync(fullPath, fs.constants.F_OK);
          } catch (err: any) {
            console.log(err);
            fs.writeFileSync(
              fullPath,
              JSON.stringify({ path: path, serverList: [], projectList: [] })
            );
          }
          let jsonData = JSON.parse(
            fs.readFileSync(fullPath, 'utf-8').toString()
          ) as projectDataType;
          mainWindow?.webContents.send('getProjectData', {
            path: path,
            serverList: jsonData.serverList,
            projectList: jsonData.projectList,
          });
          projectPath = path;
        } else throw new Error('path not found');
      }
    });
};
const saveProjectDataMain = (jsonData: any) => {
  let path = jsonData.path;
  // console.log(jsonData);
  for (let i = 0; i < jsonData.projectList.length; ++i) {
    if (!('trace' in jsonData.projectList[i]))
      jsonData.projectList[i].trace = i;
    jsonData.projectList[i].status1 = Math.abs(jsonData.projectList[i].status1);
    jsonData.projectList[i].status2 = Math.abs(jsonData.projectList[i].status2);
  }
  for(let i= 0;i<jsonData.serverList.length;++i){
    jsonData.serverList[i].status=-1
  }
  let fullPath = path + '\\config.json';
  try {
    fs.accessSync(fullPath, fs.constants.F_OK);
  } catch (err: any) {
    console.log(err);
  }
  fs.writeFileSync(fullPath, JSON.stringify(jsonData));
  return { status: 'ok' };
};
const singleImgReq = (dstWindow: BrowserWindow, data: string) => {
  const req = http.request(
    {
      hostname: 'localhost',
      path: '/',
      port: 65500,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': data.length,
      },
    },
    (res) => {
      res.on('data', (d) => {
        // 把接收到的内容转为字符串在控制台输出
        let pathToImgList = JSON.parse(d.toString());
        console.log('plot result', pathToImgList);
        if (!pathToImgList) {
          return;
        }
        pathToImgList.map((pathToImg: string) => {
          fs.readFile(pathToImg, (err, data) => {
            if (!dstWindow.isDestroyed()) {
              if (err) {
                console.log(err);
                dstWindow?.webContents.send('sendImgSrc', {
                  imgData: '',
                  code: 404,
                });
                return;
              }
              dstWindow.webContents.send('sendImgSrc', {
                imgData: data,
                code: 200,
              });
            }
          });
        });
      });
    }
  );
  req.write(data);
  req.on('error', (err) => {
    console.log(err);
  });
  req.end();
};

const remoteServerRequest = (formData: {
  plotType: string;
  projectPath: string;
  plotKeys: any[];
}) => {
  let newwin: BrowserWindow | null = null;
  newwin = new BrowserWindow({
    width: 1050,
    height: 570,
    parent: mainWindow as BrowserWindow, //win是主窗口
    autoHideMenuBar: true,
    title: formData.plotType,
    resizable: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });
  newwin.loadURL(resolveHtmlPath('imgwindow.html')); //new.html是新开窗口的渲染进程
  newwin.on('closed', () => {
    newwin = null;
  });
  newwin.webContents.on('dom-ready', () => {
    if (!newwin) {
      throw new Error('"newwin" is not defined');
    }
    newwin.show();
    let isSingle = false;
    for (let i = 0; i < plotTypeList[0].children.length; i++) {
      if (plotTypeList[0].children[i].key === formData.plotType) {
        isSingle = true;
        break;
      }
    }
    if (isSingle) {
      newwin.webContents.send('init', {
        imgListLen: formData.plotKeys.length,
      });
      formData.plotKeys.forEach((item: any) => {
        let sData = JSON.stringify({
          projectPath: formData.projectPath,
          plotType: formData.plotType,
          data: [item].map((item) => {
            let t = item;
            if (t.timeDur == undefined) t.timeDur = 10;
            return t;
          }),
        });
        if (newwin) singleImgReq(newwin, sData);
      });
    } else {
      newwin.webContents.send('init', {
        imgListLen: 1,
      });
      let sData = JSON.stringify({
        projectPath: formData.projectPath,
        plotType: formData.plotType,
        data: formData.plotKeys.map((item) => {
          let t = item;
          if (t.timeDur == undefined) t.timeDur = 10;
          return t;
        }),
      });
      singleImgReq(newwin, sData);
    }
  });
};

const parsePlotRequestMain = (plotRequest: any[]) => {
  plotRequest.map((req: any) => {
    remoteServerRequest(req);
  });
};

const parsePlotRequestTotal = (plotRequest: {
  row: number;
  col: number;
  data: any[];
}) => {
  let newwin: BrowserWindow | null = null;
  newwin = new BrowserWindow({
    parent: mainWindow as BrowserWindow, //win是主窗口
    autoHideMenuBar: true,
    title: '分析结果',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });
  newwin.loadURL(resolveHtmlPath('imgwindow.html'));
  newwin.on('closed', () => {
    newwin = null;
  });
  newwin.webContents.on('dom-ready', () => {
    if (!newwin) {
      throw new Error('"newwin" is not defined');
    }
    newwin.show();
    newwin?.webContents.send('init', {
      row: plotRequest.row,
      col: plotRequest.col,
    });
    let isSingle = false;
    plotRequest.data.map((formData: any) => {
      for (let i = 0; i < plotTypeList[0].children.length; i++) {
        if (plotTypeList[0].children[i].key === formData.plotType) {
          isSingle = true;
          break;
        }
      }
      if (isSingle) {
        formData.plotKeys.forEach((item: any) => {
          let sData = JSON.stringify({
            projectPath: formData.projectPath,
            plotType: formData.plotType,
            data: [item].map((item) => {
              let t = item;
              if (t.timeDur == undefined) t.timeDur = 10;
              return t;
            }),
          });
          if (newwin) singleImgReq(newwin, sData);
        });
      } else {
        let sData = JSON.stringify({
          projectPath: formData.projectPath,
          plotType: formData.plotType,
          data: formData.plotKeys.map((item: any) => {
            let t = item;
            if (t.timeDur == undefined) t.timeDur = 10;
            return t;
          }),
        });
        if (newwin) singleImgReq(newwin, sData);
      }
    });
  });
};
const testImgWindow = () => {
  let newwin: BrowserWindow | null = null;
  newwin = new BrowserWindow({
    width: 600,
    height: 400,
    parent: mainWindow as BrowserWindow, //win是主窗口
    autoHideMenuBar: true,
  });
  newwin.loadURL(resolveHtmlPath('imgwindow.html')); //new.html是新开窗口的渲染进程
  newwin.on('closed', () => {
    newwin = null;
  });
};

// linux deploy file /data/local/mnt/

const apiList: ObjectType = {
  listDevicesMain: listDevicesMain,
  startExpMain: startExpMain,
  testServerMain: testServerMain,
  getDeviceDataMain: getDeviceDataMain,
  getServerDataMain: getServerDataMain,
  openProjectMain: openProjectMain,
  saveProjectDataMain: saveProjectDataMain,
  remoteServerRequest: remoteServerRequest,
  testImgWindow: testImgWindow,
  parsePlotRequestMain: parsePlotRequestMain,
  parsePlotRequestTotal: parsePlotRequestTotal,
  runSimulate: runSimulate,
};

export default apiList;
