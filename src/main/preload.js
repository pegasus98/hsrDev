const { channel } = require('diagnostics_channel');
const { contextBridge, ipcRenderer } = require('electron');

let cid = 0
const callbacks = {}
// contextBridge.exposeInMainWorld('electron', {
//   ipcRenderer: {
//     myPing() {
//       ipcRenderer.send('ipc-example', 'ping');
//     },
//     on(channel, func) {
//       const validChannels = ['ipc-example'];
//       if (validChannels.includes(channel)) {
//         // Deliberately strip event as it includes `sender`
//         ipcRenderer.on(channel, (event, ...args) => func(...args));
//       }
//     },
//     once(channel, func) {
//       const validChannels = ['ipc-example'];
//       if (validChannels.includes(channel)) {
//         // Deliberately strip event as it includes `sender`
//         ipcRenderer.once(channel, (event, ...args) => func(...args));
//       }
//     },
//   },
// });

contextBridge.exposeInMainWorld('electron', {
  invoke(bridgeName, data, callback) {
    // 如果不存在方法名或不为字符串，则提示调用失败
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
        if (typeof error !== 'undefined') {
          callbacks[cid](error);
          delete callbacks[cid];
        } else if (callbacks[cid]) {
          callbacks[cid](null, data);
          delete callbacks[cid];
        } else {
          throw new Error('Invalid callback id');
        }
      } else {
        throw new Error('message format error');
      }
    });
  },
});
