const { channel } = require('diagnostics_channel');
const { contextBridge, ipcRenderer } = require('electron');

let cid = 0;
const callbacks = {};

let channelCallback = [];
contextBridge.exposeInMainWorld('electron', {
  invoke(bridgeName, data, callback) {
    // 如果不存在方法名或不为字符串，则提示调用failed 
    if (typeof bridgeName !== 'string') {
      throw new Error('Invoke failed!');
    }
    // 与 Native 的通信信息
    const message = { bridgeName };
    if (typeof data !== 'undefined' || data !== null) {
      message.data = data;
    }
    if (typeof callback !== 'function') {
      callback = () => null;
    }
    cid = cid + 1;
    // 存储回调函数
    callbacks[cid] = callback;
    message.cid = cid;
    ipcRenderer.send('postMessage', message);
    ipcRenderer.once('receiveMessage', (_, message) => {
      const { data, cid, error } = message;
      // 如果存在方法名，则调用对应函数
      if (typeof cid === 'number' && cid >= 1) {
        console.log('callback' + message.bridgeName, cid);
        if (typeof error !== 'undefined') {
          callbacks[cid](error);
          delete callbacks[cid];
        } else if (callbacks[cid]) {
          callbacks[cid](null, data);
          delete callbacks[cid];
        } else {
          throw new Error('Invalid callback id in ipc ' + message.bridgeName);
        }
      } else {
        throw new Error('message format error in ipc ' + message.bridgeName);
      }
    });
  },
  on(channel, func) {
    const validChannels = [
      'ipc-example',
      'expStatus',
      'throughput',
      'serverStatus',
      'getDeviceDataStatus',
      'getServerDataStatus',
      'sendImgSrc',
      'analysisLog',
      'snr',
      'rsrp',
      'duration',
      'onlineData',
      'onlineVideo',
      'getProjectData',
      'onlineCore',
      'onlinePcap',
      'diff',
      'language-changed'
    ];
    if (validChannels.includes(channel)) {
      //console.log('render on channel',channel)
      if (!channelCallback.includes(channel)) {
        channelCallback.push(channel);
        ipcRenderer.on(channel, (event, ...args) => func(...args));
      } else {
        console.log('channel callback second init ');
      }
    } else {
      console.log('error webcontent channel');
    }
  },
  once(channel, func) {
    ipcRenderer.once(channel, (event, ...args) => func(...args));
  },
  sendSync(channel){
    return ipcRenderer.sendSync(channel)
  }
});
