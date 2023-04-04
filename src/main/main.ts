/* eslint global-require: off, no-console: off, promise/always-return: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build:main`, this file is compiled to
 * `./src/main.js` using webpack. This gives us some performance wins.
 */
import path from 'path';
import { app, BrowserWindow, shell, ipcMain, dialog } from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import {
  ChildProcess,
  ChildProcessWithoutNullStreams,
  spawn,
} from 'child_process';
import MenuBuilder from './menu';
import { resolveHtmlPath } from './util';
import apiList from './api';
import iconvLite from 'iconv-lite';
import { MessageType } from 'defines';

import i18n from '../config/i18next.config';
import appConfig from '../config/app.config';
export default class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

class MyFrame {
  window: BrowserWindow | null;
  constructor() {
    this.window = null;
  }
  setWindow(newWindow: BrowserWindow | null) {
    this.window = newWindow;
  }
}

let mainWindow: BrowserWindow | null = null;
let logFrame = new MyFrame();

// add bridge
ipcMain.on('postMessage', async (event, message: MessageType) => {
  const nativeEvent = apiList[message.bridgeName];
  try {
    const result = await nativeEvent(message.data);
    event.reply('receiveMessage', {
      bridgeName: message.bridgeName,
      cid: message.cid,
      data: result,
    });
  } catch (err: any) {
    event.reply('receiveMessage', {
      bridgeName: message.bridgeName,
      error: { code: 500, message: err.message },
    });
  }
});

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

const isDevelopment =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDevelopment) {
  require('electron-debug')();
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload
    )
    .catch(console.log);
};

const createWindow = async () => {
  if (isDevelopment) {
    await installExtensions();
  }

  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../../assets');

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  mainWindow = new BrowserWindow({
    show: false,
    width: 1024,
    height: 728,
    icon: getAssetPath('icon.png'),
    title: '',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      defaultFontFamily:{
        standard:"SimSun"
      },
      defaultFontSize:20
    },
  });

  mainWindow.loadURL(resolveHtmlPath('index.html'));

  mainWindow.on('ready-to-show', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu(i18n);

  // Open urls in the user's browser
  mainWindow.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url);
    return { action: 'deny' };
  });


  i18n.on("load",(load)=>{
    i18n.changeLanguage('zh');
    i18n.off('loaded')
  })
  i18n.on('languageChanged',(lng)=>{
    menuBuilder.buildMenu(i18n)
    mainWindow?.webContents.send('language-changed', {
      language: lng,
      namespace: appConfig.namespace,
      resource: i18n.getResourceBundle(lng, appConfig.namespace)
    });

  })
  // Remove this if your app does not use auto updates
  // eslint-disable-next-line
  //new AppUpdater();
};

/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
let pyProc: ChildProcessWithoutNullStreams | null = null;

const createPyProc = () => {
  console.log(__dirname);
  let script = path.join(__dirname, '..\\py', 'plot_server.py');
  pyProc = spawn('python', [script]);

  if (pyProc != null) {
    console.log('child process success');

    pyProc.stdout.on('data', (data) => {
      let dataString = iconvLite.decode(data, 'cp936');
      dataString.split('\r\n').forEach((line: string) => {
        let r = /^#@[\s\S]+$/;
        console.log("line:",line)
        if (r.test(line)) {
          mainWindow?.webContents.send('analysisLog', {
            dataString: line.substring(2),
          });
        }
      });
    });
  }
};

const exitPyProc = () => {
  if (pyProc) pyProc.kill();
  pyProc = null;
};

app
  .whenReady()
  .then(() => {
    createWindow();
    //createPyProc();
    //runExec();
    //testadb();

    app.on('activate', () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (mainWindow === null) createWindow();
    });
  })
  .catch(console.log);
export { mainWindow, logFrame };
