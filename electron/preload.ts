import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
    selectFolder: () => ipcRenderer.invoke('select-folder'),
    scanDirectory: (path: string) => ipcRenderer.invoke('scan-directory', path),
    exportFiles: (content: string, defaultFileName: string) => 
        ipcRenderer.invoke('export-files', content, defaultFileName),
    readFileContent: (path: string) => ipcRenderer.invoke('read-file-content', path)
});