import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import isDev from 'electron-is-dev';

interface FileError {
    message: string;
    path: string;
    code?: string;
}

interface ExclusionConfig {
    paths: string[];
    patterns: string[];
    autoExcludeContents: string[];
}

const DEFAULT_EXCLUSION_CONFIG: ExclusionConfig = {
    paths: ['package-lock.json'],
    patterns: ['*.log', '.DS_Store'],
    autoExcludeContents: ['node_modules', 'build', 'dist']
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
ipcMain.handle('select-folder', async () => {
    const result = await dialog.showOpenDialog({
        properties: ['openDirectory']
    });
    return result.canceled ? null : result.filePaths[0];
});

// Update the scan-directory handler
ipcMain.handle('scan-directory', async (_, folderPath) => {
    const scanDir = async (path: string): Promise<any> => {
        const stats = await fs.promises.stat(path);
        const name = path.split('/').pop() || '';
        
        if (!stats.isDirectory()) {
            return {
                path,
                name,
                isDirectory: false,
                selected: false
            };
        }

        // If it's a node_modules folder, return it without contents
        if (name === 'node_modules') {
            return {
                path,
                name,
                isDirectory: true,
                children: [],
                selected: false
            };
        }

        const children = await Promise.all(
            (await fs.promises.readdir(path))
                .map(child => scanDir(`${path}/${child}`))
        );

        return {
            path,
            name,
            isDirectory: true,
            children,
            selected: false
        };
    };

    return scanDir(folderPath);
});

ipcMain.handle('export-files', async (_, content, defaultFileName) => {
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

ipcMain.handle('read-file-content', async (_, filePath) => {
    try {
        return await fs.promises.readFile(filePath, 'utf8');
    } catch (error) {
        const fileError: FileError = {
            message: error instanceof Error ? error.message : 'Unknown error',
            path: filePath,
            code: error instanceof Error && 'code' in error ? (error as any).code : undefined
        };
        console.error(`Error reading file:`, fileError);
        throw fileError; // This will be caught by the client
    }
});

ipcMain.handle('save-config', async (_, config: ExclusionConfig) => {
    const configPath = path.join(app.getPath('userData'), 'exclusion-config.json');
    await fs.promises.writeFile(configPath, JSON.stringify(config, null, 2));
});

ipcMain.handle('load-config', async () => {
    const configPath = path.join(app.getPath('userData'), 'exclusion-config.json');
    try {
        const config = await fs.promises.readFile(configPath, 'utf8');
        return JSON.parse(config);
    } catch {
        return DEFAULT_EXCLUSION_CONFIG;
    }
});