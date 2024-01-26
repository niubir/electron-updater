const { app, ipcMain, BrowserWindow } = require('electron')
const { autoUpdater } = require('electron-updater')
const path = require('path')

const EN = 'EN'
const CN = 'CN'
const FA = 'FA'

// status latest
const STATUS_LATEST = 'LATEST'
// status outdated
const STATUS_OUTDATED = 'OUTDATED'
// status downloading compare
const STATUS_DOWNLOADING_COMPARE = 'DOWNLOADING_COMPARE'
// status downloading
const STATUS_DOWNLOADING = 'DOWNLOADING'
// status downloaded
const STATUS_DOWNLOADED = 'DOWNLOADED'
// status installing
const STATUS_INSTALLING = 'INSTALLING'
// status installed
const STATUS_INSTALLED = 'INSTALLED'
// status error
const STATUS_ERROR = 'ERROR'

let v = {
  local: null,
  server: null,
  isLatest: true,
  isForce: false,
  status: STATUS_LATEST,
  status_info: null,
}
let windowCfg = {
  width: 400,
  height: 200,
  minWidth: 400,
  minHeight: 200,
  maxWidth: 400,
  maxHeight: 200,
  icon: null,
}
let window = null
let parentWindowGetter = null
const windowPreload = path.join(__dirname, './page/preload.js')
let windowLoadFile = path.join(__dirname, './page/index.html')
let updaterValid = false

// util-----------------------------------------------------------------------------------------------
let languageGetter = () => {
  let l = app.getLocale()
  if (l.startsWith('zh-')) {
    return CN
  } else if (l.startsWith('fa-')) {
    return FA
  } else {
    return EN
  }
}
// ---------------------------------------------------------------------------------------------------


// updater--------------------------------------------------------------------------------------------
const updaterDebugLogger = (event, data) => {
  if (process.env.NODE_ENV === 'development' || process.env.ELECTRON_ENV === 'development') {
    return
  }
  if (data) {
    console.info(`[UPDATER][${event}]`, data)
  } else {
    console.info(`[UPDATER][${event}]`)
  }
}
const versionCheck = () => {
  if (!updaterValid) {
    return
  }
  autoUpdater.checkForUpdates()
}
const versionDown = () => {
  if (!updaterValid) {
    return
  }
  setVersionStatus(STATUS_DOWNLOADING_COMPARE)
  autoUpdater.downloadUpdate()
}
const versionInstall = () => {
  if (!updaterValid) {
    return
  }
  setVersionStatus(STATUS_INSTALLING)
  autoUpdater.quitAndInstall()
  setVersionStatus(STATUS_INSTALLED)
}
const setVersion = (server, isLatest, isForce, afterDo) => {
  v.server = server
  v.isLatest = isLatest
  v.isForce = isForce
  if (isLatest) {
    v.status = STATUS_LATEST
  } else {
    v.status = STATUS_OUTDATED
  }
  if (afterDo && typeof afterDo == 'function') {
    afterDo()
  }
  syncVersion()
}
const setVersionStatus = (status, afterDo) => {
  v.status = status
  if (afterDo && typeof afterDo == 'function') {
    afterDo()
  }
  syncVersion()
}
const setVersionError = (err, afterDo) => {
  v.status = STATUS_ERROR
  v.status_info = err
  if (afterDo && typeof afterDo == 'function') {
    afterDo()
  }
  syncVersion()
}
const initUpdater = (config = {
  feedURL: null,
  autoDownload: false,
  autoInstallOnAppQuit: false,
  devUpdateConfigPath: null,
}) => {
  if (!config.feedURL) {
    updaterValid = false
    return
  }
  updaterValid = true

  let logger = () => {}
  if (config.devUpdateConfigPath) {
    Object.defineProperty(app, 'isPackaged', {
      get() {
        return true
      }
    })
    autoUpdater.updateConfigPath = config.devUpdateConfigPath
    logger = updaterDebugLogger
  }
  autoUpdater.setFeedURL(config.feedURL)
  autoUpdater.requestHeaders = {
    Platform: process.platform,
    Arch: process.arch,
    Version: v.local,
  }
  autoUpdater.autoDownload = config.autoDownload ? true : false
  autoUpdater.autoInstallOnAppQuit = config.autoInstallOnAppQuit ? true : false

  autoUpdater.on('checking-for-update', (data) => {
    logger('CHECKING_FOR_UPDATE', data)
  })
  autoUpdater.on('error', (err) => {
    logger('ERROR', err)
    setVersionError(err)
  })
  autoUpdater.on('update-available', (data) => {
    logger('UPDATE_AVAILABLE', data)
    setVersion(data.version, data.isLatest, data.isForce, windowShowByStatusInFunc(STATUS_OUTDATED))
  })
  autoUpdater.on('update-not-available', (data) => {
    logger('UPDATE_NOT_AVAILABLE', data)
    setVersion(data.version, data.isLatest, data.isForce, windowShowByStatusInFunc(STATUS_OUTDATED))
  })
  autoUpdater.on('download-progress', function(data) {
    logger('DOWNLOAD_PROGRESS', data)
    if (v.status != STATUS_DOWNLOADING) {
      setVersionStatus(STATUS_DOWNLOADING)
    }
    syncDownload(data)
  })
  autoUpdater.on('update-downloaded', function(data) {
    logger('UPDATE_DOWNLOADED', data)
    setVersionStatus(STATUS_DOWNLOADED, windowShowByStatusInFunc(STATUS_DOWNLOADED))
  })
}
// ---------------------------------------------------------------------------------------------------


// window---------------------------------------------------------------------------------------------
const createWindow = () => {
  let parent = null
  let modal = false
  if (parentWindowGetter) {
    const tmp = parentWindowGetter()
    if (tmp) {
      parent = tmp
      modal = true
    }
  }
  window = new BrowserWindow({
    parent: parent,
    modal: modal,
    width: windowCfg.width,
    height: windowCfg.height,
    icon: windowCfg.icon,
    transparent: true,
    backgroundColor: '#00000000',
    frame: false,
    webPreferences: {
      preload: windowPreload,
    }
  })
  window.loadFile(windowLoadFile)
  // window.loadURL('http://127.0.0.1:10001')
  // window.webContents.openDevTools()
}
const windowDestroyed = () => {
  return !window || window.isDestroyed()
}
const windowShow = (afterDo) => {
  if (windowDestroyed()) {
    createWindow()
  } else {
    window.show()
  }
  if (afterDo) {
    afterDo(window)
  }
}
const windowClose = () => {
  if (!windowDestroyed()) {
    window.close()
  }
}
const windowShowByStatusInFunc = (...status) => {
  return () => {
    if (status.includes(v.status)) {
      windowShow()
    }
  }
}
// ---------------------------------------------------------------------------------------------------


// ipc------------------------------------------------------------------------------------------------
const ipcHandler = (chan, handler) => {
  ipcMain.handle(chan, (e, ...args) => {
    return handler(e, ...args)
  })
}
const ipcSend = (chan, data) => {
  BrowserWindow.getAllWindows().forEach((win) => {
    if (!win.isDestroyed()) {
      win.webContents.send(chan, data)
    }
  })
}
const initIPC = () => {
  ipcHandler('Ver', () => {
    return v
  })
  ipcHandler('VerLang', () => {
    if (languageGetter && typeof languageGetter == 'function') {
      return languageGetter()
    }
    return EN
  })
  ipcHandler('VerCheck', () => {
    return versionCheck()
  })
  ipcHandler('VerDown', () => {
    return versionDown()
  })
  ipcHandler('VerInst', () => {
    return versionInstall()
  })
  ipcHandler('VerClose', () => {
    return windowClose()
  })
}
const syncVersion = () => {
  ipcSend('VerListen', v)
}
const syncDownload = (data) => {
  ipcSend('VerListenDown', data)
}
// ---------------------------------------------------------------------------------------------------


/**
 * set local version
 * @param {string} version
 * Configure local version.
 */
const setLocalVersion = (version) => {
  if (version && typeof version == 'string') {
    v.local = version
  }
}

/**
 * set language getter
 * @param {function} getter
 * Configure language acquisition function like ()=>{return EN}.If not configured, the system language is used.Only EN\CN\FA is provided, default EN.
 */
const setLanguageGetter = (getter) => {
  if (getter && typeof getter == 'function') {
    languageGetter = getter
  }
}

/**
 * set parent windows getter
 * @param {function} getter
 * Configure parent model window function like ()=>{return new BrowserWindow{}}.
 */
const setParentWindowsGetter = (getter) => {
  if (getter && typeof getter == 'function') {
    parentWindowGetter = getter
  }
}

/**
 * set window config
 * @param {string} windowLoadFile - window load file path.
 * @param {number} width - width.
 * @param {number} height - height.
 * @param {string} icon - icon path.
 */
const setWindowConfig = (config = {
  windowLoadFile: null,
  width: 400,
  height: 250,
  icon: null,
}) => {
  if (config.windowLoadFile) {
    windowLoadFile = config.windowLoadFile
  }
  if (config.width > 0 && config.height > 0) {
    windowCfg.width = config.width
    windowCfg.height = config.height
    windowCfg.minWidth = config.width
    windowCfg.minHeight = config.height
    windowCfg.maxWidth = config.width
    windowCfg.maxHeight = config.height
  }
  if (config.icon) {
    windowCfg.icon = config.icon
  }
}

/**
 * init auto updater
 * @property {string} version - see setLocalVersion.
 * @property {function} languageGetter - see setLanguageGetter.
 * @property {function} parentWindowGetter - see setParentWindowsGetter.
 * @property {Object} windowConfig - see setWindowConfig.
 * @property {Object} updaterConfig
 * feedURL - server feed url
 * autoDownload - auto download, default false.
 * autoInstallOnAppQuit - auto install on app quit, default false.
 * devUpdateConfigPath - update config path for development.
 */
const initAutoUpdater = (option = {
  version: null,
  languageGetter: null,
  parentWindowGetter: null,
  windowConfig: null,
  updaterConfig: null,
}) => {
  return new Promise((resolve, reject) => {
    resolve()
    setLocalVersion(option.version)
    setLanguageGetter(option.languageGetter)
    setParentWindowsGetter(option.parentWindowGetter)
    setWindowConfig(option.windowConfig)

    initIPC()
    initUpdater(option.updaterConfig)
  })
}

module.exports = {
  // consts
  EN,
  CN,
  FA,
  STATUS_LATEST,
  STATUS_OUTDATED,
  STATUS_DOWNLOADING_COMPARE,
  STATUS_DOWNLOADING,
  STATUS_DOWNLOADED,
  STATUS_INSTALLING,
  STATUS_INSTALLED,
  STATUS_ERROR,

  setLocalVersion,
  setLanguageGetter,
  setParentWindowsGetter,
  setWindowConfig,
  initAutoUpdater,
  versionCheck,
  versionDown,
  versionInstall,
}