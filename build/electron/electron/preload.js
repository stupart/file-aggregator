"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var electron_1 = require("electron");
electron_1.contextBridge.exposeInMainWorld('electronAPI', {
    selectFolder: function () { return electron_1.ipcRenderer.invoke('select-folder'); },
    scanDirectory: function (path) { return electron_1.ipcRenderer.invoke('scan-directory', path); },
    readFileContent: function (path) { return electron_1.ipcRenderer.invoke('read-file-content', path); },
    writeFile: function (path, content) { return electron_1.ipcRenderer.invoke('write-file', path, content); },
    savePrompt: function (content, projectRoot) { return electron_1.ipcRenderer.invoke('save-prompt', content, projectRoot); },
    addFileHeaders: function (files) { return electron_1.ipcRenderer.invoke('add-file-headers', files); },
    exportFiles: function (content, defaultFileName) { return electron_1.ipcRenderer.invoke('export-files', content, defaultFileName); },
    savePreset: function (preset) { return electron_1.ipcRenderer.invoke('save-preset', preset); },
    loadPresets: function () { return electron_1.ipcRenderer.invoke('load-presets'); },
    deletePreset: function (presetId) { return electron_1.ipcRenderer.invoke('delete-preset', presetId); },
    analyzeProject: function (path) { return electron_1.ipcRenderer.invoke('analyze-project', path); },
    // New unified configuration methods
    loadUnifiedConfig: function () { return electron_1.ipcRenderer.invoke('load-unified-config'); },
    saveUnifiedConfig: function (config) { return electron_1.ipcRenderer.invoke('save-unified-config', config); }
});
//# sourceMappingURL=preload.js.map