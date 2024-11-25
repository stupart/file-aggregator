// electron/preload.ts
import { contextBridge, ipcRenderer } from 'electron';
import { 
    FileNode, 
    ExclusionConfig, 
    SharePreset, 
    UserConfig 
} from '../src/types';

contextBridge.exposeInMainWorld('electronAPI', {
    // File operations
    selectFolder: () => ipcRenderer.invoke('select-folder'),
    scanDirectory: (path: string) => ipcRenderer.invoke('scan-directory', path),
    readFileContent: (path: string) => ipcRenderer.invoke('read-file-content', path),
    writeFile: (path: string, content: string) => ipcRenderer.invoke('write-file', path, content),
    analyzeProject: (path: string) => ipcRenderer.invoke('analyze-project', path),

    // Export operations
    exportFiles: (content: string, defaultFileName: string) => 
        ipcRenderer.invoke('export-files', content, defaultFileName),
    
    // Configuration management
    saveConfig: (config: ExclusionConfig) => ipcRenderer.invoke('save-config', config),
    loadConfig: () => ipcRenderer.invoke('load-config'),
    
    // User preferences
    saveUserConfig: (config: UserConfig) => ipcRenderer.invoke('save-user-config', config),
    loadUserConfig: () => ipcRenderer.invoke('load-user-config'),
    
    // Preset management
    savePreset: (preset: SharePreset) => ipcRenderer.invoke('save-preset', preset),
    loadPresets: () => ipcRenderer.invoke('load-presets'),
    deletePreset: (presetId: string) => ipcRenderer.invoke('delete-preset', presetId),
});