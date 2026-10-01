const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('flowkitDesktop', {
  platform: process.platform,
  version: '1.0.0',
  openFlowWindow: () => ipcRenderer.send('open-flow-window'),
  openExternalBrowser: (url) => ipcRenderer.send('open-external-url', url),
  openOutputFolder: () => ipcRenderer.send('open-output-folder'),
  checkStatus: () => ipcRenderer.invoke('get-system-status'),
  restartBackend: () => ipcRenderer.invoke('restart-backend'),
});
