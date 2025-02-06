import { contextBridge, ipcRenderer } from 'electron';
import { 
  FileNode, 
  SharePreset,
  UserConfig,
  PromptConfig
} from '../src/types';

contextBridge.exposeInMainWorld('electronAPI', {
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  scanDirectory: (path: string) => ipcRenderer.invoke('scan-directory', path),
  readFileContent: (path: string) => ipcRenderer.invoke('read-file-content', path),
  writeFile: (path: string, content: string) => ipcRenderer.invoke('write-file', path, content),
  savePrompt: (content: string, projectRoot: string) => ipcRenderer.invoke('save-prompt', content, projectRoot),
  addFileHeaders: (files: { path: string; content: string }[]) => ipcRenderer.invoke('add-file-headers', files),
  exportFiles: (content: string, defaultFileName: string) => ipcRenderer.invoke('export-files', content, defaultFileName),
  savePreset: (preset: SharePreset) => ipcRenderer.invoke('save-preset', preset),
  loadPresets: () => ipcRenderer.invoke('load-presets'),
  deletePreset: (presetId: string) => ipcRenderer.invoke('delete-preset', presetId),
  analyzeProject: (path: string) => ipcRenderer.invoke('analyze-project', path),
  // New unified configuration methods
  loadUnifiedConfig: () => ipcRenderer.invoke('load-unified-config'),
  saveUnifiedConfig: (config: any) => ipcRenderer.invoke('save-unified-config', config)
});