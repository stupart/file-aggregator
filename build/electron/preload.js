"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var electron_1 = require("electron");
electron_1.contextBridge.exposeInMainWorld('electronAPI', {
    selectFolder: function () { return electron_1.ipcRenderer.invoke('select-folder'); },
    scanDirectory: function (path) { return electron_1.ipcRenderer.invoke('scan-directory', path); },
    exportFiles: function (content, defaultFileName) {
        return electron_1.ipcRenderer.invoke('export-files', content, defaultFileName);
    },
    readFileContent: function (path) { return electron_1.ipcRenderer.invoke('read-file-content', path); }
});
//# sourceMappingURL=preload.js.map