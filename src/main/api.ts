import Adb, { DeviceClient } from '@devicefarmer/adbkit';
import Promise from 'bluebird';
import { spawn } from 'child_process';
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
} from '../defines';
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
      let properPath = getProperPath(
        projectPath,
        expTime,
        deviceId,
        rat,
        expType
      );
      let fullPath = [properPath, windowsIndex].join('');

      mkdirsSync(fullPath);
      const bat = spawn('adb', [
        '-s',
        deviceId,
        'pull',
        `/sdcard/tmp/${expTime}/${selected}`,
        `${fullPath}\\${selected.substring(0, selected.lastIndexOf('.'))}.qmdl`,
      ]);
      bat.stderr.on('data', (data) => {
        console.error(`stderror:${iconvLite.decode(data, 'cp936')}`);
      });
      bat.on('exit', (code: number) => {
        if (code > 0) {
          console.log('adb pull error,code:', code);
        }
        const data = JSON.stringify({
          projectPath: projectPath,
          plotType: 'online',
          data: `${fullPath}\\${selected.substring(
            0,
            selected.lastIndexOf('.')
          )}.qmdl`,
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
              // let pathToCsv = JSON.parse(d.toString());
              // if ('snr' in pathToCsv) {
              //   const table = parseCsv(pathToCsv.snr);
              //   let result = [] as DetailLineDataItem[];
              //   if (table.length > 1) {
              //     for (let i = 1; i < table.length; ++i) {
              //       result.push({
              //         timestamp: parseFloat(table[i][1]),
              //         value: parseFloat(table[i][2]),
              //       });
              //     }
              //   }
              //   mainWindow?.webContents.send('snr', {
              //     deviceId: deviceId,
              //     value: result,
              //   });
              // }
              // if ('rsrp' in pathToCsv) {
              //   const table = parseCsv(pathToCsv.rsrp);
              //   let result = [] as DetailLineDataItem[];
              //   if (table.length > 1) {
              //     for (let i = 1; i < table.length; ++i) {
              //       result.push({
              //         timestamp: parseFloat(table[i][3]),
              //         value: parseFloat(table[i][2]),
              //       });
              //     }
              //   }
              //   mainWindow?.webContents.send('rsrp', {
              //     deviceId: deviceId,
              //     value: result,
              //   });
              // }
              // if ('duration' in pathToCsv) {
              //   const table = parseCsv(pathToCsv.duration);
              //   let result = [] as HandoverDataItem[];
              //   if (table.length > 0) {
              //     for (let i = 0; i < table.length; ++i) {
              //       const timestamp = parseFloat(table[i][1]);
              //       const duration = parseFloat(table[i][2]);

              //       result.push({
              //         start: moment(Math.floor(timestamp * 10) * 100).format(
              //           'YYYY-MM-DD HH:mm:ss.S'
              //         ),
              //         end: moment(
              //           Math.ceil((timestamp + duration) * 10) * 100
              //         ).format('YYYY-MM-DD HH:mm:ss.S'),
              //         timestamp: timestamp,
              //         duration: duration,
              //         type: parseInt(table[i][0]),
              //       });
              //     }
              //   }
              //   mainWindow?.webContents.send('duration', {
              //     deviceId: deviceId,
              //     value: result,
              //   });
              // }
              // if ('thp' in pathToCsv) {
              //   const table = parseCsv(pathToCsv.thp);
              //   let result = [] as DetailLineDataItem[];
              //   if (table.length > 1) {
              //     for (let i = 1; i < table.length; ++i) {
              //       result.push({
              //         timestamp: parseFloat(table[i][1]),
              //         value: parseFloat(table[i][2]),
              //       });
              //     }
              //   }
              //   mainWindow?.webContents.send('throughput', {
              //     deviceId: deviceId,
              //     value: result,
              //   });
              // }
            });
          }
        );
        req.write(data);
        req.on('error', (err) => {
          console.log(err);
        });
        req.end();
      });
    }
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
    if (cnt >= expInfo.timeDur) clearInterval(interval);

    const data = JSON.stringify({
      projectPath: projectPath,
      plotType: 'online',
      data: `${fullPath}\\l2.${(cnt + '').padStart(4, '0')}.qmdl`,
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
          // let pathToCsv = JSON.parse(d.toString());
          // console.log(pathToCsv);
          // let snrResult = [] as snrLineDataItem[];
          // let rsrpResult = [] as DetailLineDataItem[];
          // let thpResult = [] as DetailLineDataItem[];
          // let handoverResult = [] as HandoverDataItem[];
          // if ('snr' in pathToCsv) {
          //   const table = parseCsv(pathToCsv.snr);
          //   if (table.length > 1) {
          //     for (let i = 1; i < table.length; ++i) {
          //       snrResult.push({
          //         timestamp: parseFloat(table[i][1]),
          //         value: parseFloat(table[i][2]),
          //         rat:table[i][3]
          //       });
          //     }
          //   }
          //   // mainWindow?.webContents.send('snr', {
          //   //   deviceId: expInfo.deviceId,
          //   //   value: result,
          //   //   status:cnt
          //   // });
          // }
          // if ('rsrp' in pathToCsv) {
          //   const table = parseCsv(pathToCsv.rsrp);
          //   if (table.length > 1) {
          //     for (let i = 1; i < table.length; ++i) {
          //       rsrpResult.push({
          //         timestamp: parseFloat(table[i][3]),
          //         value: parseFloat(table[i][2]),
          //       });
          //     }
          //   }
          //   // mainWindow?.webContents.send('rsrp', {
          //   //   deviceId: expInfo.deviceId,
          //   //   value: result,
          //   //   status:cnt
          //   // });
          // }
          // if ('duration' in pathToCsv) {
          //   const table = parseCsv(pathToCsv.duration);
          //   if (table.length > 0) {
          //     for (let i = 0; i < table.length; ++i) {
          //       const timestamp = parseFloat(table[i][1]);
          //       const duration = parseFloat(table[i][2]);

          //       handoverResult.push({
          //         start: moment(Math.floor(timestamp * 10) * 100).format(
          //           'HH:mm:ss.S'
          //         ),
          //         end: moment(
          //           Math.ceil((timestamp + duration) * 10) * 100
          //         ).format('HH:mm:ss.S'),
          //         type: parseInt(table[i][0]),
          //         timestamp: timestamp,
          //         duration: duration,
          //       });
          //     }
          //   }
          //   // mainWindow?.webContents.send('duration', {
          //   //   deviceId:expInfo.deviceId,
          //   //   value: result,

          //   // });
          // }
          // if ('thp' in pathToCsv) {
          //   const table = parseCsv(pathToCsv.thp);
          //   if (table.length > 1) {
          //     for (let i = 1; i < table.length; ++i) {
          //       thpResult.push({
          //         timestamp: parseFloat(table[i][1]),
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
          // const sendData = {
          //   deviceId: expInfo.deviceId,
          //   snrValue: snrResult,
          //   rsrpValue: rsrpResult,
          //   thpValue: thpResult,
          //   handoverValue: handoverResult,
          //   status: status,
          // }
          // mainWindow?.webContents.send('onlineData', sendData);
        });
      }
    );
    req.write(data);
    req.on('error', (err) => {
      console.log(err);
    });
    req.end();
  }, 1000);
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
  mkdirsSync(fullPath)
  const videoProcess = spawn('python', [
    './src/hsrexp-scripts/video_test.py',
    deviceId,
    fullPath,
  ]);
  videoProcess.stderr.on('data', (data) => {
    console.error(`stderror:${iconvLite.decode(data, 'cp936')}`);
  });
  // videoProcess.stdout.on('data', (data) => {
  //   console.log(`stdout:${iconvLite.decode(data, 'cp936')}`);
  // });
  videoProcess.on('exit', (code: number) => {
    console.log(code)
    if (bat) {
      bat.kill('SIGINT');
      clearInterval(interval);
    }
  });
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
    "listen",
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

    mainWindow?.webContents.send('expStatus', {
      deviceId: deviceId,
      code: code,
      dataIndex: dateString,
      timeDur: timeDur,
      rat: rat,
    });
  });
};

const resolveVideo = (path: any, deviceId: string) => {
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
        console.log(d)
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
  console.log(pathToCsv)
  let snrResult = [] as snrLineDataItem[];
  let rsrpResult = [] as DetailLineDataItem[];
  let thpResult = [] as DetailLineDataItem[];
  let handoverResult = [] as HandoverDataItem[];
  if ('snr' in pathToCsv) {
    const table = parseCsv(pathToCsv.snr);
    if (table.length > 1) {
      for (let i = 1; i < table.length; ++i) {
        snrResult.push({
          timestamp: parseFloat(table[i][1]),
          value: parseFloat(table[i][2]),
          rat: table[i][3],
        });
      }
    }
    // mainWindow?.webContents.send('snr', {
    //   deviceId: expInfo.deviceId,
    //   value: result,
    //   status:cnt
    // });
  }
  if ('rsrp' in pathToCsv) {
    const table = parseCsv(pathToCsv.rsrp);
    if (table.length > 1) {
      for (let i = 1; i < table.length; ++i) {
        rsrpResult.push({
          timestamp: parseFloat(table[i][3]),
          value: parseFloat(table[i][2]),
        });
      }
    }
    // mainWindow?.webContents.send('rsrp', {
    //   deviceId: expInfo.deviceId,
    //   value: result,
    //   status:cnt
    // });
  }
  if ('duration' in pathToCsv) {
    const table = parseCsv(pathToCsv.duration);
    if (table.length > 0) {
      for (let i = 0; i < table.length; ++i) {
        const timestamp = parseFloat(table[i][1]);
        const duration = parseFloat(table[i][2]);

        handoverResult.push({
          start: moment(Math.floor(timestamp * 10) * 100).format('HH:mm:ss.S'),
          end: moment(Math.ceil((timestamp + duration) * 10) * 100).format(
            'HH:mm:ss.S'
          ),
          type: parseInt(table[i][0]),
          timestamp: timestamp,
          duration: duration,
        });
      }
    }
    // mainWindow?.webContents.send('duration', {
    //   deviceId:expInfo.deviceId,
    //   value: result,

    // });
  }
  if ('thp' in pathToCsv) {
    const table = parseCsv(pathToCsv.thp);
    if (table.length > 1) {
      for (let i = 1; i < table.length; ++i) {
        thpResult.push({
          timestamp: parseFloat(table[i][1]),
          value: parseFloat(table[i][2]),
        });
      }
    }
    // mainWindow?.webContents.send('throughput', {
    //   deviceId: expInfo.deviceId,
    //   value: result,
    //   status:cnt

    // });
  }
  const sendData = {
    deviceId: deviceId,
    snrValue: snrResult,
    rsrpValue: rsrpResult,
    thpValue: thpResult,
    handoverValue: handoverResult,
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
    console.log(`stdout:${iconvLite.decode(data, 'cp936')}`);
  });
  var interval = setInterval(() => {
    cnt++;
    runExec(expType, rat, deviceId, dateString, serverIp, timeDur - cnt);
    if (timeDur - cnt <= 0) clearInterval(interval);
  }, 1000);

  bat.on('exit', (code: number) => {
    // clearInterval(interval);
    console.log("exp exited ")
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
    `su -c mv /data/local/mnt/home/android/logs/${projectItem.index}/out /sdcard/tmp/${windowsIndex}`,
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

      mkdirsSync(properPath  + windowsIndex);

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
