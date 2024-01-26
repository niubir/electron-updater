const { app, BrowserWindow } = require('electron')
const path = require('path')
// const { initAutoUpdater, versionCheck } = require('@niubir/electron-updater')
const { initAutoUpdater, versionCheck } = require('../')
const { version, build: { publish } } = require('./package.json')

let mainWindow = null
const mainWindowShow = () => {
  if (!mainWindow || mainWindow.isDestroyed()) {
    mainWindow = new BrowserWindow({
      width: 800,
      height: 600,
    })
    mainWindow.loadFile(path.join(__dirname, './index.html'))
  } else {
    mainWindow.show()
  }
}
const mainWindowGetter = () => {
  mainWindowShow()
  return mainWindow
}

// Dev app-update.yml
let devUpdateConfigPath = null
if (!app.isPackaged) {
  devUpdateConfigPath = path.join(__dirname, './app-update.yml')
}

app.whenReady().then(() => {
  mainWindowShow()
  initAutoUpdater({
    version: version,
    languageGetter: ()=>{return 'EN'},
    parentWindowGetter: mainWindowGetter,
    updaterConfig: {
      feedURL: publish[0].url,
      devUpdateConfigPath: devUpdateConfigPath
    },
    windowConfig: {
      mainColor: 'red',
      mainPrimaryColor: '#f56c6c',
      mainWhiteColor: '#fcd3d3',
      mainWhite1Color: '#fef0f0',
    },
  })

  versionCheck()

  app.on('activate', () => {
    mainWindowShow()
  })
  app.on('window-all-closed', () => {
    if (process.platform === 'darwin') {
      app.dock.hide()
    }
  })
})