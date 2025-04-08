@for %%a in (%0) do set "ROOT=%%~dpa"
@pushd "%ROOT%"
@PATH %ROOT%bin\;%PATH%
@if EXIST "%ROOT%bin\node_modules\corepack\dist\vcc.js" @(
  @echo Node v16 found, removing and upgrading to new version...
  rd /s /q "%ROOT%bin\node_modules"
)
@if NOT EXIST "%ROOT%bin\node_modules\npm\package.json" @(
  @echo Extracting bin/node_modules.tgz...
  @pushd "%ROOT%bin"
  tar xzf node_modules.tgz
  @popd
)
@call npm i --no-audit --no-fund
@REM call npm start --scripts-prepend-node-path
node build default --watch --nolint --no-serverlog --art
pause

