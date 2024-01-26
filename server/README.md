# electron updater server

## Env
|Name|default|
|-|-|
|ELECTRON_UPDATER_SERVER_PORT|10000|
|ELECTRON_UPDATER_SERVER_BASE_PATH|update|
|ELECTRON_UPDATER_RESOURCE_PATH|./static/latest.yml|

## run
```bash
go mod init
go mod tidy
go run main.go
```