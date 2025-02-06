/* electron/main.ts */
import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import isDev from 'electron-is-dev';
import { analyzeProject } from './utils/projectAnalyzer';
import { 
  FileNode, 
  SharePreset,
  FileError
} from '../src/types';
// Import our unified config types and default value
import { AIREADMEConfig } from '../src/types/unifiedConfig';
import { DEFAULT_UNIFIED_CONFIG } from '../src/constants/defaultUnifiedConfig';

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  if (isDev) {
    win.loadURL('http://localhost:3001');
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(__dirname, '../build/index.html'));
  }
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });

// ---------------------
// File System Handlers
// ---------------------
ipcMain.handle('select-folder', async () => {
  const result = await dialog.showOpenDialog({ properties: ['openDirectory'] });
  return result.canceled ? null : result.filePaths[0];
});

ipcMain.handle('scan-directory', async (_, folderPath: string) => {
  const unifiedConfig: AIREADMEConfig = await loadUnifiedConfig();
  // Use unifiedConfig.exclusions in scanning
  const exclusionConfig = unifiedConfig.exclusions;

  const scanDir = async (filePath: string): Promise<FileNode> => {
    const stats = await fs.promises.stat(filePath);
    const name = filePath.split('/').pop() || '';
    const node: FileNode = { path: filePath, name, isDirectory: stats.isDirectory(), selected: false };
    if (!node.isDirectory) return node;
    if (exclusionConfig.behaviors.hideContents.includes(name) || exclusionConfig.behaviors.showEmpty.includes(name)) {
      return { ...node, children: [] };
    }
    if (!exclusionConfig.global.folders.includes(name)) {
      const childrenNames = await fs.promises.readdir(filePath);
      const filteredNames = childrenNames.filter(childName => {
        const isExcludedFile = exclusionConfig.global.files.includes(childName);
        const matchesPattern = exclusionConfig.global.files.some(pattern =>
          pattern.includes('*') && new RegExp('^' + pattern.replace('*', '.*') + '$').test(childName)
        );
        return !isExcludedFile && !matchesPattern;
      });
      const children = await Promise.all(filteredNames.map(child => scanDir(`${filePath}/${child}`)));
      return { ...node, children };
    }
    return node;
  };
  return scanDir(folderPath);
});

ipcMain.handle('analyze-project', async (_, folderPath: string) => {
  return analyzeProject(folderPath);
});

ipcMain.handle('read-file-content', async (_, filePath: string) => {
  try {
    return await fs.promises.readFile(filePath, 'utf8');
  } catch (error) {
    const fileError: FileError = {
      message: error instanceof Error ? error.message : 'Unknown error',
      path: filePath,
      code: error instanceof Error && 'code' in error ? (error as any).code : undefined
    };
    console.error('Error reading file:', fileError);
    throw fileError;
  }
});

ipcMain.handle('export-files', async (_, content: string, defaultFileName: string) => {
  const result = await dialog.showSaveDialog({
    defaultPath: `${defaultFileName}.txt`,
    filters: [{ name: 'Text Files', extensions: ['txt'] }]
  });
  if (!result.canceled && result.filePath) {
    await fs.promises.writeFile(result.filePath, content);
    return result.filePath;
  }
  return null;
});

ipcMain.handle('write-file', async (_, filePath: string, content: string) => {
  try {
    await fs.promises.writeFile(filePath, content, 'utf8');
    return true;
  } catch (error) {
    console.error(`Error writing file ${filePath}:`, error);
    throw error;
  }
});

// ---------------------
// Preset Handlers
// ---------------------
ipcMain.handle('save-preset', async (_, preset: SharePreset) => {
  const presetsPath = path.join(app.getPath('userData'), 'presets.json');
  let presets: SharePreset[] = [];
  try {
    const existing = await fs.promises.readFile(presetsPath, 'utf8');
    presets = JSON.parse(existing);
  } catch {
    presets = [];
  }
  const index = presets.findIndex(p => p.id === preset.id);
  if (index >= 0) {
    presets[index] = preset;
  } else {
    presets.push(preset);
  }
  await fs.promises.writeFile(presetsPath, JSON.stringify(presets, null, 2));
});

ipcMain.handle('load-presets', async () => {
  const presetsPath = path.join(app.getPath('userData'), 'presets.json');
  try {
    const presets = await fs.promises.readFile(presetsPath, 'utf8');
    return JSON.parse(presets);
  } catch {
    return [];
  }
});

ipcMain.handle('delete-preset', async (_, presetId: string) => {
  const presetsPath = path.join(app.getPath('userData'), 'presets.json');
  try {
    const existing = await fs.promises.readFile(presetsPath, 'utf8');
    let presets: SharePreset[] = JSON.parse(existing);
    presets = presets.filter(p => p.id !== presetId);
    await fs.promises.writeFile(presetsPath, JSON.stringify(presets, null, 2));
    return true;
  } catch {
    throw new Error('Failed to delete preset');
  }
});

// ---------------------
// Prompt Handlers
// ---------------------
ipcMain.handle('save-prompt', async (_, content: string, projectRoot: string) => {
  const filePath = path.join(projectRoot, 'aireadme.txt');
  try {
    await fs.promises.writeFile(filePath, content, 'utf8');
    return true;
  } catch (error) {
    console.error('Error saving prompt:', error);
    throw error;
  }
});

ipcMain.handle('add-file-headers', async (_, files: { path: string; content: string }[]) => {
  try {
    await Promise.all(files.map(async (file) => {
      const header = `//${file.path}\n`;
      if (!file.content.startsWith(header)) {
        await fs.promises.writeFile(file.path, header + file.content, 'utf8');
      }
    }));
    return true;
  } catch (error) {
    console.error('Error adding file headers:', error);
    throw error;
  }
});

// ---------------------
// Unified Configuration Handlers
// ---------------------
const getUnifiedConfigPath = () => path.join(app.getPath('userData'), 'aireadme-config.json');

async function loadUnifiedConfig(): Promise<AIREADMEConfig> {
  const configPath = getUnifiedConfigPath();
  try {
    await fs.promises.access(configPath);
    const content = await fs.promises.readFile(configPath, 'utf8');
    return JSON.parse(content);
  } catch {
    await fs.promises.writeFile(configPath, JSON.stringify(DEFAULT_UNIFIED_CONFIG, null, 2));
    return DEFAULT_UNIFIED_CONFIG;
  }
}

ipcMain.handle('load-unified-config', loadUnifiedConfig);

ipcMain.handle('save-unified-config', async (_, config: AIREADMEConfig) => {
  const configPath = getUnifiedConfigPath();
  await fs.promises.writeFile(configPath, JSON.stringify(config, null, 2));
  return true;
});