# [electron-updater](https://github.com/niubir/electron-updater)
* This is an update component about electron

## [Server Install](https://github.com/niubir/electron-updater/blob/main/server/README.md)

## Quick Setup Guide

* Install.
```bash
npm i @niubir/electron-updater
```

* Configure.
  * package.json
  ```json
  {
    ...
    "build": {
      "publish": [
        {
          "provider": "generic",
          "url": "http://app.abc123.com/update"
        }
      ]
    }
    ...
  }
  ```
  * use
  ```javascript
  const path = require('path')
  const { initAutoUpdater, versionCheck } = require('@niubir/electron-updater')
  const { version, build: { publish } } = require('./package.json')

  // Dev app-update.yml
  let devUpdateConfigPath = null
  if (!app.isPackaged) {
    devUpdateConfigPath = path.join(__dirname, './app-update.yml')
  }

  initAutoUpdater({
    version: version,
    updaterConfig: {
      feedURL: publish[0].url,
      devUpdateConfigPath: devUpdateConfigPath
    }
  })
  
  versionCheck()
  ```