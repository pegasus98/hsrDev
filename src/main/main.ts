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
import { app, BrowserWindow, shell, ipcMain } from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import MenuBuilder from './menu';
import { resolveHtmlPath } from './util';
import { spawn } from 'child_process';
import { Adb } from '@devicefarmer/adbkit';
import apiList from './api';
import iconvLite from 'iconv-lite';

export default class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

let mainWindow: BrowserWindow | null = null;
interface MessageType {
  bridgeName: string;
  data: any;
  cid: number;
}

// add bridge
ipcMain.on('postMessage', async (event, message: MessageType) => {
  const nativeEvent = apiList[message.bridgeName];
  console.log(message)
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
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
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
  menuBuilder.buildMenu();

  // Open urls in the user's browser
  mainWindow.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url);
    return { action: 'deny' };
  });

  // Remove this if your app does not use auto updates
  // eslint-disable-next-line
  new AppUpdater();
};
/*
 * child process test
 */
const runExec = async () => {
  console.log('*********test ************');
  //const bat = spawn('cmd.exe', ['/c', 'scripts\\test.bat']);
  const bat = spawn('adb.exe', ['devices']);

  bat.stdout.on('data', (data) => {
    console.log(`stdout:${iconvLite.decode(data, 'cp936')}`);
  });

  bat.stderr.on('data', (data) => {
    console.error(`stderror:${iconvLite.decode(data, 'cp936')}`);
  });

  bat.on('exit', (code) => {
    console.log(`Child exited with code ${code}`);
  });
};

/**
 * Add adb test
 */

const client = Adb.createClient();

const testadb = async () => {
  const devices = await client.listDevices();
  console.log(devices)
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

app
  .whenReady()
  .then(() => {
    createWindow();
    //runExec();
    testadb();
    app.on('activate', () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (mainWindow === null) createWindow();
    });
  })
  .catch(console.log);
