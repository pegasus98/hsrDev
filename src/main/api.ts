import Adb, { DeviceClient } from '@devicefarmer/adbkit';
import Promise from 'bluebird';
import { spawn } from 'child_process';
import iconvLite from 'iconv-lite';
import fs from 'fs';
import path from 'path';
import { BrowserWindow, dialog } from 'electron';
import http from 'http';

import { mainWindow } from './main';
import { resolveHtmlPath } from './util';
import { plotTypeList } from '../py/plot.config';
import { projectDataType, ObjectType } from '../defines';
import { ConsoleSqlOutlined } from '@ant-design/icons';

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
  return [basePath, YMD, deviceId, rat, expType, ''].join('/');
};

const listDevicesMain = async () => {
  let detailedDeviceList: any[] = [];
  try {
    await client.listDevices().then(function (devices: any) {
      return Promise.map(devices, function (device: any) {
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
      });
    });
  } catch (err: any) {
    console.log(err);
  }
  return { deviceList: detailedDeviceList };
};

const runExec = (deviceId: string, expTime: string) => {
  let fileLists: string[] = [];
  const lsProc = spawn('adb', [
    '-s',
    deviceId,
    'shell',
    'su',
    '-c',
    'ls',
    '/data/local/mnt/home/android/logs/' + expTime + '/pcap',
  ]);
  lsProc.stdout.on('data', (data) => {
    let dataString = iconvLite.decode(data, 'cp936');
    fileLists.push(...dataString.split(/[\n\r\s]/).filter(Boolean));
  });
  lsProc.stderr.on('data', (data) => {
    console.error('ls error', iconvLite.decode(data, 'cp936'));
  });
  lsProc.on('close', (code: number) => {
    if (code > 0) console.log('ls error, exit with code:', code);
    if (!code && fileLists.length > 1) {
      let selected = fileLists.sort().reverse()[1];
      const bat = spawn('adb', [
        '-s',
        deviceId,
        'shell',
        'su',
        '-c',
        '/data/data/ru.meefik.linuxdeploy/files/bin/linuxdeploy',
        'shell',
        'tshark',
        '-r',
        '/home/android/logs/' + expTime + '/pcap/' + selected,
        '-T',
        'fields',
        '-e',
        'ip.len',
        '|',
        `awk '{sum+=$1} END {printf("=%f\\n",sum)}'`,
      ]);
      bat.stdout.on('data', (data) => {
        let dataString = iconvLite.decode(data, 'cp936');
        console.log(selected, dataString);
        let r = /^=[0-9\n\r\s\.]+$/;
        if (r.test(dataString)) {
          mainWindow?.webContents.send('throughput', {
            deviceId: deviceId,
            expAppend: selected,
            value: parseFloat(dataString.split('=')[1]),
          });
        }
      });

      bat.stderr.on('data', (data) => {
        console.error(`stderror:${iconvLite.decode(data, 'cp936')}`);
      });

      bat.on('exit', (code: number) => {
        if (code > 0) {
          console.log('thp cal error,code:', code);
        }
      });
    }
  });
};

const startSingleExp = (
  deviceId: string,
  serverPath: string,
  expType: string,
  rat: string,
  timeDur:number
) => {
  //todo:  getprop gsm.network.type
  let nowDate = new Date();
  let dateString = nowDate.toISOString().split('.')[0];
  let serverIp = serverPath.split('@')[1];
  let newExpType = expType;
  if (newExpType === 'TCP') {
    newExpType = 'bbr';
  } else if (newExpType === 'QUIC') {
    newExpType = 'quic';
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
    timeDur.toString()
  ]);
  console.log(timeDur.toString())
  bat.stderr.on('data', (data) => {
    console.error(`stderror:${iconvLite.decode(data, 'cp936')}`);
  });
  bat.stdout.on('data', (data) => {
    console.log(`stdout:${iconvLite.decode(data, 'cp936')}`);
  });
  var interval = setInterval(runExec, 1000, deviceId, dateString);

  bat.on('exit', (code: number) => {
    if (code > 0)
      console.log('exp error, code:', code, expType, serverIp, dateString);
    clearInterval(interval);
    mainWindow?.webContents.send('expStatus', {
      deviceId: deviceId,
      code: code,
      dataIndex: dateString,
      timeDur:timeDur,
      rat: rat,
    });
  });
};
const getNetworkType = (
  deviceId: string,
  serverPath: string,
  expType: string,
  timeDur:number
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
    startSingleExp(deviceId, serverPath, expType, rat,timeDur);
  });
};

const startExpMain = (expList: any[]) => {
  expList.map((expItem) => {
    getNetworkType(expItem.deviceId, expItem.serverPath, expItem.expType,expItem.timeDur);
  });
};

const testSingleServer = (ip: string, username: string) => {
  const lsProc = spawn('ssh', [
    [username, ip].join('@'),
    `bash server.sh >/dev/null 2>&1 &`,
  ]);
  lsProc.stdout.on('data', (data) => {
    let dataString = iconvLite.decode(data, 'cp936');
    console.log('stdout', dataString);
  });
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
          console.log('wc res', dataString);
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

      mkdirsSync(properPath + '/' + windowsIndex);

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
  getServer.stdout.on('data', (data) => {
    console.log(`stdout:${iconvLite.decode(data, 'cp936')}`);
  });

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
      console.log(result); //输出结果
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
              JSON.stringify({ path: path, projectList: [] })
            );
          }
          let jsonData = JSON.parse(
            fs.readFileSync(fullPath, 'utf-8').toString()
          ) as projectDataType;
          mainWindow?.webContents.send('getProjectData', {
            path: path,
            projectList: jsonData.projectList,
          });
        } else throw new Error('path not found');
      }
    });
};
const saveProjectDataMain = (jsonData: any) => {
  let path = jsonData.path;
  console.log(jsonData);
  for (let i = 0; i < jsonData.projectList.length; ++i) {
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
  console.log(data);
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
        let pathToImg = d.toString();
        console.log(pathToImg);
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
  console.log(plotRequest);
  plotRequest.map((req: any) => {
    remoteServerRequest(req);
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
};

export default apiList;
