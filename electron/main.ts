// electron/main.ts
import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import isDev from 'electron-is-dev';
import { analyzeProject } from '../src/utils/projectAnalyzer';
import { 
    FileNode, 
    ExclusionConfig, 
    SharePreset, 
    GlobalExclusions, 
    UserConfig,
    FileError
} from '../src/types';

// Default configurations
const DEFAULT_EXCLUSIONS: GlobalExclusions = {
    files: ['package-lock.json', '*.log', '.DS_Store'],
    folders: ['node_modules', 'build', 'dist']
};

const DEFAULT_CONFIG: ExclusionConfig = {
    global: DEFAULT_EXCLUSIONS,
    session: {
        files: [],
        folders: []
    },
    behaviors: {
        hideContents: ['node_modules'],
        showEmpty: [],
        summarize: []
    }
};



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

    // Load the app
    if (isDev) {
        win.loadURL('http://localhost:3001');
        win.webContents.openDevTools();
    } else {
        win.loadFile(path.join(__dirname, '../build/index.html'));
    }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

// IPC Handlers
// File System Handlers
ipcMain.handle('select-folder', async () => {
    const result = await dialog.showOpenDialog({
        properties: ['openDirectory']
    });
    return result.canceled ? null : result.filePaths[0];
});

ipcMain.handle('scan-directory', async (_, folderPath: string) => {
    const config = await loadConfig();

    const scanDir = async (path: string): Promise<FileNode> => {
        const stats = await fs.promises.stat(path);
        const name = path.split('/').pop() || '';
        
        // Base file/folder node
        const node: FileNode = {
            path,
            name,
            isDirectory: stats.isDirectory(),
            selected: false
        };

        if (!node.isDirectory) {
            return node;
        }

        // Handle directory behaviors
        if (config.behaviors.hideContents.includes(name)) {
            return { ...node, children: [] };
        }

        if (config.behaviors.showEmpty.includes(name)) {
            return { ...node, children: [] };
        }

        // Scan children if not excluded
        if (!config.global.folders.includes(name)) {
            const children = await Promise.all(
                (await fs.promises.readdir(path))
                    .filter(childName => {
                        // Filter out excluded files and patterns
                        const isExcludedFile = config.global.files.includes(childName);
                        const matchesPattern = config.global.files.some(pattern => 
                            pattern.includes('*') && 
                            new RegExp('^' + pattern.replace('*', '.*') + '$').test(childName)
                        );
                        return !isExcludedFile && !matchesPattern;
                    })
                    .map(child => scanDir(`${path}/${child}`))
            );
            return { ...node, children };
        }

        return node;
    };

    return scanDir(folderPath);
});

ipcMain.handle('analyze-project', async (_, path: string) => {
    return analyzeProject(path);
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
        console.error(`Error reading file:`, fileError);
        throw fileError;
    }
});

// Export Handlers
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

// Configuration Handlers
const getConfigPath = () => path.join(app.getPath('userData'), 'config.json');
const getPresetsPath = () => path.join(app.getPath('userData'), 'presets.json');

async function loadConfig(): Promise<ExclusionConfig> {
    try {
        const configPath = getConfigPath();
        const config = await fs.promises.readFile(configPath, 'utf8');
        return JSON.parse(config);
    } catch {
        return DEFAULT_CONFIG;
    }
}

ipcMain.handle('save-config', async (_, config: ExclusionConfig) => {
    const configPath = getConfigPath();
    await fs.promises.writeFile(configPath, JSON.stringify(config, null, 2));
});

ipcMain.handle('load-config', loadConfig);

// Preset Handlers
ipcMain.handle('save-preset', async (_, preset: SharePreset) => {
    const presetsPath = getPresetsPath();
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
    try {
        const presetsPath = getPresetsPath();
        const presets = await fs.promises.readFile(presetsPath, 'utf8');
        return JSON.parse(presets);
    } catch {
        return [];
    }
});

// User Config Handlers
const getUserConfigPath = () => path.join(app.getPath('userData'), 'user-config.json');

const DEFAULT_USER_CONFIG: UserConfig = {
    theme: 'system',
    maxRecentProjects: 10,
    recentProjects: []
};

async function loadUserConfig(): Promise<UserConfig> {
    try {
        const configPath = getUserConfigPath();
        const config = await fs.promises.readFile(configPath, 'utf8');
        return JSON.parse(config);
    } catch {
        return DEFAULT_USER_CONFIG;
    }
}

ipcMain.handle('save-user-config', async (_, config: UserConfig) => {
    const configPath = getUserConfigPath();
    await fs.promises.writeFile(configPath, JSON.stringify(config, null, 2));
});

ipcMain.handle('load-user-config', loadUserConfig);

// Add delete preset handler
ipcMain.handle('delete-preset', async (_, presetId: string) => {
    const presetsPath = getPresetsPath();
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

