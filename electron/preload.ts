// electron/preload.ts
import { contextBridge, ipcRenderer } from 'electron';
import { 
    FileNode, 
    ExclusionConfig, 
    SharePreset, 
    UserConfig,
    PromptConfig 
} from '../src/types';

contextBridge.exposeInMainWorld('electronAPI', {
    // Existing file operations
    selectFolder: () => ipcRenderer.invoke('select-folder'),
    scanDirectory: (path: string) => ipcRenderer.invoke('scan-directory', path),
    readFileContent: (path: string) => ipcRenderer.invoke('read-file-content', path),
    writeFile: (path: string, content: string) => ipcRenderer.invoke('write-file', path, content),
    
    // New prompt operations
    savePrompt: (content: string, projectRoot: string) => 
        ipcRenderer.invoke('save-prompt', content, projectRoot),
    addFileHeaders: (files: { path: string; content: string }[]) => 
        ipcRenderer.invoke('add-file-headers', files),
    
    // Enhanced configuration operations
    saveConfig: (config: ExclusionConfig) => ipcRenderer.invoke('save-config', config),
    loadConfig: () => ipcRenderer.invoke('load-config'),
    saveUserConfig: (config: UserConfig) => ipcRenderer.invoke('save-user-config', config),
    loadUserConfig: () => ipcRenderer.invoke('load-user-config'),
    savePromptConfig: (config: PromptConfig) => ipcRenderer.invoke('save-prompt-config', config),
    loadPromptConfig: () => ipcRenderer.invoke('load-prompt-config'),
    
    // Existing operations
    exportFiles: (content: string, defaultFileName: string) => 
        ipcRenderer.invoke('export-files', content, defaultFileName),
    savePreset: (preset: SharePreset) => ipcRenderer.invoke('save-preset', preset),
    loadPresets: () => ipcRenderer.invoke('load-presets'),
    deletePreset: (presetId: string) => ipcRenderer.invoke('delete-preset', presetId),
    analyzeProject: (path: string) => ipcRenderer.invoke('analyze-project', path),
});