<file-aggregator>

<file-tree>
/
  .env
  electron/
    electron/main.ts
    electron/preload.ts
    electron/tsconfig.json
  package.json
  public/
    public/index.html
  src/
    src/App.tsx
    src/components/
      src/components/FileTree/
        src/components/FileTree/FileTreeItem.tsx
        src/components/FileTree/FilesTreeView.tsx
        src/components/FileTree/useFileTree.ts
    src/constants/
      src/constants/defaults.ts
    src/index.tsx
    src/types/
      src/types/config.ts
      src/types/electron.ts
      src/types/errors.ts
      src/types/exclusions.ts
      src/types/file.ts
      src/types/index.ts
      src/types/output.ts
      src/types/presets.ts
      src/types/project.ts
    src/utils/
      src/utils/config.ts
      src/utils/fileUtils.ts
      src/utils/projectAnalyzer.ts
      src/utils/readmeGenerator.ts
  tsconfig.json
  tsconfig.paths.json
</file-tree>

<main.ts>
//electron/main.ts
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


</main.ts>

<preload.ts>
//electron/preload.ts
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
</preload.ts>

<tsconfig.json>
//electron/tsconfig.json
{
  "compilerOptions": {
    "target": "es5",
    "module": "commonjs",
    "sourceMap": true,
    "strict": true,
    "outDir": "../build/electron",
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "typeRoots": [
      "../node_modules/@types"
    ]
  },
  "include": [
    ".",
    "../src/types/**/*"
  ]
}
</tsconfig.json>

<package.json>
//package.json
{
  "name": "file-aggregator",
  "version": "1.0.0",
  "main": "build/electron/main.js",
  "scripts": {
    "start": "concurrently \"npm run start:react\" \"npm run start:electron\"",
    "start:react": "BROWSER=none react-scripts start",
    "start:electron": "wait-on http://localhost:3001 && tsc -p electron && electron .",
    "build": "react-scripts build && tsc -p electron",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "description": "",
  "dependencies": {
    "@emotion/react": "^11.11.1",
    "@emotion/styled": "^11.11.0",
    "@mui/icons-material": "^5.14.19",
    "@mui/lab": "^5.0.0-alpha.155",
    "@mui/material": "^5.14.20",
    "@mui/x-tree-view": "^6.17.0",
    "electron-is-dev": "^2.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@types/node": "^20.10.3",
    "@types/react": "^18.2.42",
    "@types/react-dom": "^18.2.17",
    "concurrently": "^8.2.2",
    "electron": "^27.1.3",
    "electron-builder": "^24.9.1",
    "react-scripts": "5.0.1",
    "typescript": "^4.9.5",
    "wait-on": "^7.2.0"
  },
  "browserslist": {
    "production": [
      ">0.2%",
      "not dead",
      "not op_mini all"
    ],
    "development": [
      "last 1 chrome version",
      "last 1 firefox version",
      "last 1 safari version"
    ]
  }
}
</package.json>

<index.html>
//public/index.html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#000000" />
    <meta
      name="description"
      content="File Aggregator App"
    />
    <title>File Aggregator</title>
  </head>
  <body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root"></div>
  </body>
</html>
</index.html>

<App.tsx>
//src/App.tsx
import React, { useState, useEffect } from 'react';
import { 
    Button, 
    Checkbox, 
    Box,
    Typography,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    IconButton,
    TextField,
    Chip,
    CircularProgress,
    Tooltip,
    Snackbar,
    Paper,
} from '@mui/material';
import BlockIcon from '@mui/icons-material/Block';
import SettingsIcon from '@mui/icons-material/Settings';
import EditIcon from '@mui/icons-material/Edit';
import { TreeView, TreeItem } from '@mui/x-tree-view';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import SaveIcon from '@mui/icons-material/Save';

import { 
    FileNode, 
    ExclusionConfig, 
    UserConfig, 
    SharePreset,
    ProjectContext
} from './types';

import { DEFAULT_EXCLUSIONS, DEFAULT_USER_CONFIG } from './constants/defaults';
import { loadAndMergeConfigs, addRecentProject } from './utils/config';

import { FileTreeView } from './components/FileTree/FilesTreeView';
interface AppState {
    structure: FileNode | null;
    selectedFiles: Set<string>;
    projectRoot: string;
    exclusionConfig: ExclusionConfig;
    userConfig: UserConfig;
    activePreset: string | null;
    projectContext: ProjectContext | null;
}

const App: React.FC = () => {
    // Base state
    const [structure, setStructure] = useState<FileNode | null>(null);
    const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
    const [projectRoot, setProjectRoot] = useState<string>('');
    
    // Configurations
    const [exclusionConfig, setExclusionConfig] = useState<ExclusionConfig>(DEFAULT_EXCLUSIONS);
    const [userConfig, setUserConfig] = useState<UserConfig>(DEFAULT_USER_CONFIG);
    const [activePreset, setActivePreset] = useState<string | null>(null);
    const [presets, setPresets] = useState<SharePreset[]>([]);
    const [newExclusion, setNewExclusion] = useState('');

    // Project info
    const [projectContext, setProjectContext] = useState<ProjectContext | null>(null);
    
    // UI state
    const [configDialogOpen, setConfigDialogOpen] = useState(false);
    const [presetDialogOpen, setPresetDialogOpen] = useState(false);
    const [loadingFiles, setLoadingFiles] = useState<Set<string>>(new Set());
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [generatedContent, setGeneratedContent] = useState<string>('');


    // Load configurations on mount
    useEffect(() => {
        loadInitialConfig();
    }, []);

    const loadInitialConfig = async () => {
        try {
            const { exclusions, userConfig } = await loadAndMergeConfigs();
            setExclusionConfig(exclusions);
            setUserConfig(userConfig);
            
            // Set active preset if there was a last used one
            if (userConfig.lastUsedPreset) {
                setActivePreset(userConfig.lastUsedPreset);
            }
        } catch (error) {
            console.error('Failed to load configurations:', error);
            showSnackbar('Failed to load settings. Using defaults.');
        }
    };

    const handleFolderSelect = async () => {
        const folderPath = await window.electronAPI.selectFolder();
        if (folderPath) {
            setProjectRoot(folderPath);
            try {
                // Scan directory
                const fileStructure = await window.electronAPI.scanDirectory(folderPath);
                setStructure(fileStructure);

                // Add to recent projects
                await addRecentProject(folderPath);

                // Analyze project context
                const context = await window.electronAPI.analyzeProject(folderPath);
                setProjectContext(context);

                // Suggest preset based on project type
                const presets = await window.electronAPI.loadPresets();
                const matchingPreset = presets.find(p => p.id.startsWith(context.stack.type));
                if (matchingPreset) {
                    setActivePreset(matchingPreset.id);
                    setExclusionConfig(matchingPreset.exclusions);
                }

                showSnackbar('Project loaded successfully');
            } catch (error) {
                console.error('Failed to load project:', error);
                showSnackbar('Failed to load project completely');
            }
        }
    };

    const showSnackbar = (message: string) => {
        setSnackbarMessage(message);
        setSnackbarOpen(true);
    };
    
    const getRelativePath = (fullPath: string) => {
        return fullPath.replace(projectRoot, '').replace(/^\//, '');
    };
    

    const handleEditPreset = (preset: SharePreset) => {
        // TODO: Implement preset editing
        console.log('Editing preset:', preset);
    };
    
    const handlePresetSelect = (presetId: string) => {
        setActivePreset(presetId);
        const selectedPreset = presets.find(p => p.id === presetId);
        if (selectedPreset) {
            setExclusionConfig(selectedPreset.exclusions);
        }
    };
    
    const handleCreatePreset = () => {
        // TODO: Implement preset creation
        console.log('Creating new preset');
    };

    const handleRemoveGlobalExclusion = (type: 'files' | 'folders', index: number) => {
        const newConfig = { ...exclusionConfig };
        newConfig.global[type] = newConfig.global[type].filter((_, i) => i !== index);
        setExclusionConfig(newConfig);
    };
    
    const handleRemoveSessionExclusion = (type: 'files' | 'folders', index: number) => {
        const newConfig = { ...exclusionConfig };
        newConfig.session[type] = newConfig.session[type].filter((_, i) => i !== index);
        setExclusionConfig(newConfig);
    };
    
    const handleRemoveBehavior = (type: keyof ExclusionConfig['behaviors'], index: number) => {
        const newConfig = { ...exclusionConfig };
        newConfig.behaviors[type] = newConfig.behaviors[type].filter((_, i) => i !== index);
        setExclusionConfig(newConfig);
    };
    
    const handleAddExclusion = () => {
        if (!newExclusion) return;
    
        const newConfig = { ...exclusionConfig };
        if (newExclusion.includes('*')) {
            newConfig.global.files.push(newExclusion);
        } else if (newExclusion.endsWith('/')) {
            newConfig.global.folders.push(newExclusion.slice(0, -1));
        } else {
            newConfig.global.files.push(newExclusion);
        }
        
        setExclusionConfig(newConfig);
        setNewExclusion('');
    };

    const aggregateContent = async (nodes: FileNode[]): Promise<string> => {
        const projectName = projectRoot.split('/').pop() || 'project';
        let output = `<${projectName}>\n\n`;
        
        // Add project context if available
        if (projectContext) {
            output += `<project-info>\n`;
            output += `Type: ${projectContext.stack.type}\n`;
            output += `Framework: ${projectContext.stack.framework.join(', ')}\n`;
            output += `Language: ${projectContext.stack.language}\n`;
            output += `Testing: ${projectContext.stack.testing.join(', ')}\n`;
            output += `Styling: ${projectContext.stack.styling.join(', ')}\n`;
            if (projectContext.description) {
                output += `\nDescription: ${projectContext.description}\n`;
            }
            output += `</project-info>\n\n`;
        }
        
        // Add directory structure
        output += "<file-tree>\n";
        const addStructure = (node: FileNode, depth: number = 0) => {
            const isExcluded = 
                exclusionConfig.global.files.includes(node.name) ||
                exclusionConfig.global.folders.includes(node.name);
            
            if (!isExcluded) {
                const relativePath = getRelativePath(node.path);
                output += `${' '.repeat(depth)}${relativePath}${node.isDirectory ? '/' : ''}\n`;
                
                if (node.children && !exclusionConfig.behaviors.hideContents.includes(node.name)) {
                    node.children.forEach(child => addStructure(child, depth + 2));
                }
            }
        };
        
        if (structure) {
            addStructure(structure);
        }
        output += "</file-tree>\n\n";
        
        // Add file contents
        const selectedNodes = nodes.filter(node => {
            const isExcluded = 
                exclusionConfig.global.files.includes(node.name) ||
                exclusionConfig.global.folders.includes(node.name);
            return !isExcluded;
        });

        for (const node of selectedNodes) {
            if (!node.isDirectory) {
                const relativePath = getRelativePath(node.path);
                output += `<${node.name}>\n`;
                
                try {
                    const content = await window.electronAPI.readFileContent(node.path);
                    
                    // Check if the file already starts with its path comment
                    const expectedComment = `//${relativePath}`;
                    const hasPathComment = content.trimStart().startsWith(expectedComment);
                    
                    // Only add the path comment if it's not already there
                    if (!hasPathComment) {
                        output += `${expectedComment}\n`;
                    }
                    
                    output += content;
                } catch (error: unknown) {
                    if (error instanceof Error) {
                        output += `[Error reading file: ${error.message}]`;
                    } else if (typeof error === 'object' && error && 'message' in error) {
                        output += `[Error reading file: ${(error as { message: string }).message}]`;
                    } else {
                        output += '[Unknown error reading file]';
                    }
                }
                output += `\n</${node.name}>\n\n`;
            }
        }

        output += `</${projectName}>`;
        return output;
    };

    const renderPresetDialog = () => (
        <Dialog open={presetDialogOpen} onClose={() => setPresetDialogOpen(false)}>
            <DialogTitle>Manage Presets</DialogTitle>
            <DialogContent>
                <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle1">Available Presets</Typography>
                    <List>
                        {presets.map((preset) => (
                            <ListItem
                                key={preset.id}
                                secondaryAction={
                                    <IconButton 
                                        edge="end" 
                                        onClick={() => handleEditPreset(preset)}
                                    >
                                        <EditIcon />
                                    </IconButton>
                                }
                            >
                                <ListItemText
                                    primary={preset.name}
                                    secondary={preset.description}
                                />
                                <Checkbox
                                    checked={activePreset === preset.id}
                                    onChange={() => handlePresetSelect(preset.id)}
                                />
                            </ListItem>
                        ))}
                    </List>
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={() => handleCreatePreset()}>Create New</Button>
                <Button onClick={() => setPresetDialogOpen(false)}>Close</Button>
            </DialogActions>
        </Dialog>
    );

    const renderExclusionDialog = () => (
        <Dialog open={configDialogOpen} onClose={() => setConfigDialogOpen(false)}>
            <DialogTitle>Exclusion Settings</DialogTitle>
            <DialogContent>
                <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle1">Global Exclusions</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {exclusionConfig.global.files.map((file, index) => (
                            <Chip
                                key={file}
                                label={file}
                                onDelete={() => handleRemoveGlobalExclusion('files', index)}
                            />
                        ))}
                        {exclusionConfig.global.folders.map((folder, index) => (
                            <Chip
                                key={folder}
                                label={`${folder}/`}
                                onDelete={() => handleRemoveGlobalExclusion('folders', index)}
                            />
                        ))}
                    </Box>
                </Box>

                <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle1">Session Exclusions</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {exclusionConfig.session.files.map((file, index) => (
                            <Chip
                                key={file}
                                label={file}
                                onDelete={() => handleRemoveSessionExclusion('files', index)}
                            />
                        ))}
                        {exclusionConfig.session.folders.map((folder, index) => (
                            <Chip
                                key={folder}
                                label={`${folder}/`}
                                onDelete={() => handleRemoveSessionExclusion('folders', index)}
                            />
                        ))}
                    </Box>
                </Box>

                <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle1">Folder Behaviors</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {exclusionConfig.behaviors.hideContents.map((folder, index) => (
                            <Chip
                                key={folder}
                                label={`${folder} (contents hidden)`}
                                onDelete={() => handleRemoveBehavior('hideContents', index)}
                            />
                        ))}
                    </Box>
                </Box>

                <Box sx={{ display: 'flex', gap: 1 }}>
                    <TextField
                        size="small"
                        value={newExclusion}
                        onChange={(e) => setNewExclusion(e.target.value)}
                        placeholder="Add new exclusion..."
                    />
                    <Button
                        variant="contained"
                        onClick={handleAddExclusion}
                    >
                        Add
                    </Button>
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={() => setConfigDialogOpen(false)}>Close</Button>
            </DialogActions>
        </Dialog>
    );

    const handleExport = async () => {
        if (!structure) return;
        
        try {
            setLoadingFiles(new Set(selectedFiles));
            const selectedNodes = getAllSelectedNodes(structure);
            const content = await aggregateContent(selectedNodes);
            setGeneratedContent(content);
            
            const savedPath = await window.electronAPI.exportFiles(
                content, 
                projectRoot.split('/').pop() || 'export'
            );
            
            if (savedPath) {
                showSnackbar(`File saved successfully to ${savedPath}`);
            }
        } catch (error) {
            console.error('Export failed:', error);
            showSnackbar('Failed to export files. Please try again.');
        } finally {
            setLoadingFiles(new Set());
        }
    };
    
    const handleCopyToClipboard = async () => {
        if (!structure || !generatedContent) {
            const selectedNodes = getAllSelectedNodes(structure!);
            setLoadingFiles(new Set(selectedFiles));
            const content = await aggregateContent(selectedNodes);
            setGeneratedContent(content);
            setLoadingFiles(new Set());
        }
        
        try {
            await navigator.clipboard.writeText(generatedContent);
            showSnackbar('Content copied to clipboard!');
        } catch (error) {
            showSnackbar('Failed to copy to clipboard');
        }
    };
    
    const getAllSelectedNodes = (node: FileNode): FileNode[] => {
        let selected: FileNode[] = [];
        
        // Check if this node is excluded
        const isExcluded = 
            exclusionConfig.global.files.includes(node.name) ||
            exclusionConfig.global.folders.includes(node.name);
    
        // Only add the node if it's selected AND not excluded
        if (selectedFiles.has(node.path) && !isExcluded) {
            selected.push(node);
        }
    
        // Recursively check children
        if (node.children && !exclusionConfig.behaviors.hideContents.includes(node.name)) {
            node.children.forEach(child => {
                selected = [...selected, ...getAllSelectedNodes(child)];
            });
        }
    
        return selected;
    };


    return (
        <Box sx={{ p: 2 }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button 
                        variant="contained" 
                        onClick={handleFolderSelect}
                        startIcon={<FolderOpenIcon />}
                    >
                        Select Folder
                    </Button>
                    {projectContext && (
                        <Typography 
                            variant="body1" 
                            sx={{ 
                                alignSelf: 'center',
                                color: 'text.secondary'
                            }}
                        >
                            {projectContext.name}
                        </Typography>
                    )}
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="Manage Presets">
                        <IconButton 
                            onClick={() => setPresetDialogOpen(true)}
                            color={activePreset ? 'primary' : 'default'}
                        >
                            <BookmarkIcon />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Exclusion Settings">
                        <IconButton onClick={() => setConfigDialogOpen(true)}>
                            <SettingsIcon />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Box>


        {/* Project Context Display */}
        {projectContext && (
            <Paper sx={{ p: 2, mb: 2 }} variant="outlined">
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="subtitle1">Project Info</Typography>
                    <Chip 
                        size="small" 
                        label={projectContext.stack.type}
                        color="primary"
                        variant="outlined"
                    />
                </Box>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {projectContext.stack.framework.map(fw => (
                        <Chip 
                            key={fw} 
                            size="small" 
                            label={fw}
                            variant="outlined"
                        />
                    ))}
                </Box>
            </Paper>
        )}

        {/* File Tree */}
        {structure && (
            <>
                <FileTreeView
                    structure={structure}
                    exclusionConfig={exclusionConfig}
                    onSelectionChange={(newSelected) => {
                        setSelectedFiles(newSelected);
                    }}
                    onExclusionChange={(newConfig) => {
                        setExclusionConfig(newConfig);
                    }}
                />
                
                {/* Action Buttons - keep this section the same */}
                <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                    <Button 
                        variant="contained" 
                        onClick={handleExport}
                        disabled={selectedFiles.size === 0}
                        startIcon={<SaveIcon />}
                    >
                        Export Selected Files
                    </Button>
                    
                    <Tooltip title="Copy to Clipboard">
                        <span>
                            <Button
                                variant="outlined"
                                onClick={handleCopyToClipboard}
                                disabled={selectedFiles.size === 0}
                                startIcon={<ContentCopyIcon />}
                            >
                                Copy to Clipboard
                            </Button>
                        </span>
                    </Tooltip>

                    {selectedFiles.size > 0 && (
                        <Typography 
                            variant="body2" 
                            sx={{ 
                                alignSelf: 'center',
                                color: 'text.secondary'
                            }}
                        >
                            {selectedFiles.size} file(s) selected
                        </Typography>
                    )}
                </Box>
            </>
        )}

        {/* Dialogs */}
        {renderExclusionDialog()}
        {renderPresetDialog()}
        
        {/* Notifications */}
        <Snackbar
            open={snackbarOpen}
            autoHideDuration={3000}
            onClose={() => setSnackbarOpen(false)}
            message={snackbarMessage}
        />
    </Box>
    );
};

export default App;
</App.tsx>

<FileTreeItem.tsx>
//src/components/FileTree/FileTreeItem.tsx
// src/components/FileTree/FileTreeItem.tsx
import React, { useMemo } from 'react';
import { TreeItem } from '@mui/x-tree-view';
import { 
    Checkbox, 
    IconButton, 
    Typography, 
    Box, 
    Chip,
    Tooltip
} from '@mui/material';
import BlockIcon from '@mui/icons-material/Block';
import FolderIcon from '@mui/icons-material/Folder';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import ImageIcon from '@mui/icons-material/Image';
import { FileNode, ExclusionConfig } from '../../types';
import { isImageFile } from '../../utils/fileUtils';

interface FileTreeItemProps {
    node: FileNode;
    selectedFiles: Set<string>;
    loadingFiles: Set<string>;
    exclusionConfig: ExclusionConfig;
    level?: number;
    onCheckboxChange: (node: FileNode, checked: boolean) => void;
    onExclude: (node: FileNode) => void;
    onInclude: (node: FileNode) => void;
    isNodeExcluded: (node: FileNode) => boolean;  // Add this prop
}

export const FileTreeItem: React.FC<FileTreeItemProps> = React.memo(({
    node,
    selectedFiles,
    loadingFiles,
    exclusionConfig,
    level = 0,
    onCheckboxChange,
    onExclude,
    onInclude,
    isNodeExcluded
}) => {
    // Compute node status
    const status = useMemo(() => {
        if (isNodeExcluded(node)) {
            return 'excluded';
        }
        if (exclusionConfig.behaviors.hideContents.includes(node.name)) {
            return 'hidden';
        }
        return 'included';
    }, [node, exclusionConfig, isNodeExcluded]);

    // Compute checkbox state considering parent exclusions
    const { isChecked, isIndeterminate, isDisabled } = useMemo(() => {
        const checked = selectedFiles.has(node.path);
        const hasCheckedChildren = node.children?.some(child => 
            selectedFiles.has(child.path) || 
            child.children?.some(grandChild => selectedFiles.has(grandChild.path))
        );
        
        return {
            isChecked: checked,
            isIndeterminate: !checked && hasCheckedChildren,
            isDisabled: status === 'excluded' || isImageFile(node.name)
        };
    }, [node, selectedFiles, status]);

    const isLoading = loadingFiles.has(node.path);

    const renderIcon = () => {
        if (node.isDirectory) {
            return <FolderIcon fontSize="small" sx={{ color: 'action.active' }} />;
        }
        if (isImageFile(node.name)) {
            return <ImageIcon fontSize="small" sx={{ color: 'info.main' }} />;
        }
        return <InsertDriveFileIcon fontSize="small" sx={{ color: 'action.active' }} />;
    };

    const renderLabel = () => (
        <Box 
            sx={{ 
                display: 'flex',
                alignItems: 'center',
                ml: level * 2,
                mr: 2,
                width: 'calc(100% - 100px)',
            }}
        >
            {/* Left side */}
            <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1,
                overflow: 'hidden',
                flex: 1,
            }}>
                {status !== 'excluded' && (
                    <Checkbox
                        checked={isChecked}
                        indeterminate={isIndeterminate}
                        onChange={(e) => {
                            e.stopPropagation();
                            onCheckboxChange(node, e.target.checked);
                        }}
                        disabled={isDisabled}
                        size="small"
                        sx={{ 
                            padding: '4px',
                            visibility: isDisabled ? 'hidden' : 'visible'
                        }}
                    />
                )}
                {renderIcon()}
                <Typography 
                    variant="body2"
                    noWrap
                    sx={{ 
                        color: status === 'excluded' ? 'text.disabled' : 'text.primary',
                        textDecoration: status === 'excluded' ? 'line-through' : 'none',
                        fontStyle: status === 'hidden' ? 'italic' : 'normal',
                    }}
                >
                    {node.name}
                </Typography>
            </Box>

            {/* Right side */}
            <Box sx={{ 
                width: '100px',
                display: 'flex',
                justifyContent: 'flex-end',
                position: 'absolute',
                right: 8,
            }}>
                {status !== 'included' && !isImageFile(node.name) && (
                    <Tooltip title="Click to include">
                        <Chip
                            size="small"
                            label={status}
                            color={status === 'excluded' ? 'error' : 'default'}
                            variant="outlined"
                            onClick={(e) => {
                                e.stopPropagation();
                                onInclude(node);
                            }}
                            sx={{ height: 20 }}
                        />
                    </Tooltip>
                )}

                {status === 'included' && !isImageFile(node.name) && (
                    <Tooltip title="Exclude from tree">
                        <IconButton
                            size="small"
                            onClick={(e) => {
                                e.stopPropagation();
                                onExclude(node);
                            }}
                            sx={{ padding: '2px' }}
                        >
                            <BlockIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                )}

                {isImageFile(node.name) && (
                    <Chip
                        size="small"
                        label="Image"
                        color="default"
                        variant="outlined"
                        sx={{ 
                            height: 20,
                            backgroundColor: 'background.paper',
                            borderColor: 'info.main',
                            color: 'info.main'
                        }}
                    />
                )}
            </Box>
        </Box>
    );

    return (
        <TreeItem
            nodeId={node.path}
            label={renderLabel()}
            sx={{
                '& .MuiTreeItem-content': {
                    padding: '2px 0',
                    cursor: node.isDirectory ? 'pointer' : 'default',
                    opacity: status === 'excluded' ? 0.6 : 1
                }
            }}
        >
            {node.children?.map((child) => (
                <FileTreeItem
                    key={child.path}
                    node={child}
                    selectedFiles={selectedFiles}
                    loadingFiles={loadingFiles}
                    exclusionConfig={exclusionConfig}
                    level={(level || 0) + 1}
                    onCheckboxChange={onCheckboxChange}
                    onExclude={onExclude}
                    onInclude={onInclude}
                    isNodeExcluded={isNodeExcluded}
                />
            ))}
        </TreeItem>
    );
});
</FileTreeItem.tsx>

<FilesTreeView.tsx>
//src/components/FileTree/FilesTreeView.tsx
// src/components/FileTree/FilesTreeView.tsx
import React from 'react';
import { TreeView } from '@mui/x-tree-view';
import { FileTreeItem } from './FileTreeItem';
import { useFileTree } from './useFileTree';
import { FileNode, ExclusionConfig } from '../../types';

interface FileTreeViewProps {
    structure: FileNode | null;
    exclusionConfig: ExclusionConfig;
    onSelectionChange: (selected: Set<string>) => void;
    onExclusionChange: (config: ExclusionConfig) => void;
}

export const FileTreeView: React.FC<FileTreeViewProps> = ({
    structure,
    exclusionConfig,
    onSelectionChange,
    onExclusionChange,
}) => {
    const {
        selectedFiles,
        loadingFiles,
        handleCheckboxChange,
        isNodeExcluded,
        setLoadingFile
    } = useFileTree({
        exclusionConfig,
        onSelectionChange
    });

    const handleExclude = (node: FileNode) => {
        const newConfig = { ...exclusionConfig };
        
        // Add to appropriate exclusion list
        if (node.isDirectory) {
            newConfig.global.folders = Array.from(new Set([
                ...newConfig.global.folders,
                node.name
            ]));
        } else {
            newConfig.global.files = Array.from(new Set([
                ...newConfig.global.files,
                node.name
            ]));
        }

        // Remove any selected files that are now excluded
        const removeExcludedSelections = (currentNode: FileNode) => {
            const newSelectedFiles = new Set(Array.from(selectedFiles));
            if (newSelectedFiles.has(currentNode.path)) {
                newSelectedFiles.delete(currentNode.path);
            }
            currentNode.children?.forEach(child => removeExcludedSelections(child));
            return newSelectedFiles;
        };

        const updatedSelectedFiles = removeExcludedSelections(node);
        
        onExclusionChange(newConfig);
        onSelectionChange(updatedSelectedFiles);
    };

    const handleInclude = (node: FileNode) => {
        const newConfig = { ...exclusionConfig };
        
        // Remove from all exclusion lists
        if (node.isDirectory) {
            newConfig.global.folders = newConfig.global.folders.filter(
                f => f !== node.name
            );
        } else {
            newConfig.global.files = newConfig.global.files.filter(
                f => f !== node.name
            );
        }
        
        // Also remove from hideContents if present
        newConfig.behaviors.hideContents = newConfig.behaviors.hideContents.filter(
            f => f !== node.name
        );

        onExclusionChange(newConfig);
    };

    // Helper to check if a node should be visible
    const isNodeVisible = (node: FileNode): boolean => {
        const pathParts = node.path.split('/');
        // Check if any parent folder is in hideContents
        for (let i = 0; i < pathParts.length - 1; i++) {
            if (exclusionConfig.behaviors.hideContents.includes(pathParts[i])) {
                return false;
            }
        }
        return true;
    };

    if (!structure) return null;

    return (
        <TreeView
            sx={{
                '& .MuiTreeItem-root': {
                    '&:hover': {
                        '& > .MuiTreeItem-content': {
                            backgroundColor: 'action.hover',
                        }
                    }
                },
                '& .MuiTreeItem-content': {
                    padding: '4px 0',
                    borderRadius: 1,
                }
            }}
        >
            {isNodeVisible(structure) && (
                <FileTreeItem
                    node={structure}
                    selectedFiles={selectedFiles}
                    loadingFiles={loadingFiles}
                    exclusionConfig={exclusionConfig}
                    onCheckboxChange={handleCheckboxChange}
                    onExclude={handleExclude}
                    onInclude={handleInclude}
                    isNodeExcluded={isNodeExcluded}
                />
            )}
        </TreeView>
    );
};
</FilesTreeView.tsx>

<useFileTree.ts>
//src/components/FileTree/useFileTree.ts
// src/components/FileTree/useFileTree.ts
import { useState, useCallback, useEffect } from 'react';
import { FileNode, ExclusionConfig } from '../../types';

interface UseFileTreeProps {
    initialSelected?: Set<string>;
    exclusionConfig: ExclusionConfig;
    onSelectionChange?: (selected: Set<string>) => void;
}

interface UseFileTreeReturn {
    selectedFiles: Set<string>;
    loadingFiles: Set<string>;
    handleCheckboxChange: (node: FileNode, checked: boolean) => void;
    isNodeExcluded: (node: FileNode) => boolean;
    setSelectedFiles: (selected: Set<string>) => void;
    setLoadingFile: (path: string, isLoading: boolean) => void;
}

export const useFileTree = ({
    initialSelected = new Set(),
    exclusionConfig,
    onSelectionChange
}: UseFileTreeProps): UseFileTreeReturn => {
    const [selectedFiles, setSelectedFiles] = useState<Set<string>>(initialSelected);
    const [loadingFiles, setLoadingFiles] = useState<Set<string>>(new Set());

    // Check if a node or any of its ancestors are excluded
    const isNodeExcluded = useCallback((node: FileNode): boolean => {
        // Check node itself
        if (exclusionConfig.global.files.includes(node.name) ||
            exclusionConfig.global.folders.includes(node.name)) {
            return true;
        }

        // Check ancestors
        const pathParts = node.path.split('/');
        for (let i = 0; i < pathParts.length; i++) {
            const parentFolder = pathParts[i];
            if (exclusionConfig.global.folders.includes(parentFolder)) {
                return true;
            }
        }

        return false;
    }, [exclusionConfig]);

    // Clean up selections when exclusions change
    useEffect(() => {
        setSelectedFiles(prev => {
            const newSelected = new Set(prev);
            Array.from(newSelected).forEach(path => {
                const pathNode = { path, name: path.split('/').pop() || '' } as FileNode;
                if (isNodeExcluded(pathNode)) {
                    newSelected.delete(path);
                }
            });
            return newSelected;
        });
    }, [exclusionConfig, isNodeExcluded]);

    // Get all selectable descendants
    const getSelectableDescendants = useCallback((node: FileNode): string[] => {
        if (isNodeExcluded(node)) {
            return [];
        }

        let paths: string[] = [];
        
        // Only add this node if it's not excluded
        if (!isNodeExcluded(node)) {
            paths.push(node.path);
        }
        
        if (node.children && !exclusionConfig.behaviors.hideContents.includes(node.name)) {
            node.children.forEach(child => {
                if (!isNodeExcluded(child)) {
                    paths = [...paths, ...getSelectableDescendants(child)];
                }
            });
        }
        
        return paths;
    }, [exclusionConfig, isNodeExcluded]);

    const handleCheckboxChange = useCallback((node: FileNode, checked: boolean) => {
        if (isNodeExcluded(node)) {
            return;
        }

        setSelectedFiles(prev => {
            const newSelected = new Set(prev);
            const affectedPaths = getSelectableDescendants(node);

            affectedPaths.forEach(path => {
                if (checked) {
                    newSelected.add(path);
                } else {
                    newSelected.delete(path);
                }
            });

            return newSelected;
        });
    }, [getSelectableDescendants, isNodeExcluded]);

    // Notify parent of changes
    useEffect(() => {
        if (onSelectionChange) {
            onSelectionChange(selectedFiles);
        }
    }, [selectedFiles, onSelectionChange]);

    const setLoadingFile = useCallback((path: string, isLoading: boolean) => {
        setLoadingFiles(prev => {
            const next = new Set(prev);
            if (isLoading) {
                next.add(path);
            } else {
                next.delete(path);
            }
            return next;
        });
    }, []);

    return {
        selectedFiles,
        loadingFiles,
        handleCheckboxChange,
        isNodeExcluded,
        setSelectedFiles,
        setLoadingFile
    };
};
</useFileTree.ts>

<defaults.ts>
//src/constants/defaults.ts
// src/constants/defaults.ts
import { ExclusionConfig, UserConfig } from '../types';

export const DEFAULT_EXCLUSIONS: ExclusionConfig = {
    global: {
        files: [
            'package-lock.json', 
            '*.log', 
            '.DS_Store',
            // Add image patterns
            '*.jpg', '*.jpeg', '*.png', '*.gif', 
            '*.bmp', '*.webp', '*.svg', '*.ico',
            '*.tiff', '*.tif'
        ],
        folders: ['node_modules', 'build', 'dist']
    },
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

export const DEFAULT_USER_CONFIG: UserConfig = {
    theme: 'system',
    maxRecentProjects: 10,
    recentProjects: []
};
</defaults.ts>

<index.tsx>
//src/index.tsx
import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';

ReactDOM.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
    document.getElementById('root')
);
</index.tsx>

<config.ts>
//src/types/config.ts
export interface UserConfig {
    lastUsedPreset?: string;
    defaultOutputPath?: string;
    theme?: 'light' | 'dark' | 'system';
    recentProjects?: string[];
    maxRecentProjects?: number;
}
</config.ts>

<electron.ts>
//src/types/electron.ts
// src/types/electron.ts
import { 
    FileNode, 
    ExclusionConfig, 
    SharePreset, 
    UserConfig,
    ProjectContext 
} from './index';

declare global {
    interface Window {
        electronAPI: {
            // File operations
            selectFolder: () => Promise<string | null>;
            scanDirectory: (path: string) => Promise<FileNode>;
            readFileContent: (path: string) => Promise<string>;
            writeFile: (path: string, content: string) => Promise<void>;
            
            // Export operations
            exportFiles: (content: string, defaultFileName: string) => Promise<string | null>;
            
            // Configuration management
            saveConfig: (config: ExclusionConfig) => Promise<void>;
            loadConfig: () => Promise<ExclusionConfig>;
            
            // User preferences
            saveUserConfig: (config: UserConfig) => Promise<void>;
            loadUserConfig: () => Promise<UserConfig>;
            
            // Preset management
            savePreset: (preset: SharePreset) => Promise<void>;
            loadPresets: () => Promise<SharePreset[]>;
            deletePreset: (presetId: string) => Promise<boolean>;

            // Project analysis
            analyzeProject: (path: string) => Promise<ProjectContext>;
        }
    }
}
</electron.ts>

<errors.ts>
//src/types/errors.ts
// src/types/errors.ts
export interface FileError {
    message: string;
    path: string;
    code?: string;
}
</errors.ts>

<exclusions.ts>
//src/types/exclusions.ts
// src/types/exclusions.ts
export interface GlobalExclusions {
    files: string[];      // e.g., "package-lock.json", "*.log"
    folders: string[];    // e.g., "node_modules", "dist"
}

export interface SessionExclusions {
    files: string[];
    folders: string[];
}

export interface FolderBehaviors {
    hideContents: string[];  // Show folder but hide contents
    showEmpty: string[];     // Show folder as empty
    summarize: string[];     // Could show size/file count instead of contents
}

export interface ExclusionConfig {
    global: GlobalExclusions;
    session: SessionExclusions;
    behaviors: FolderBehaviors;
}
</exclusions.ts>

<file.ts>
//src/types/file.ts
// src/types/file.ts
export interface FileNode {
    path: string;
    name: string;
    isDirectory: boolean;
    children?: FileNode[];
    selected: boolean;
    status?: 'included' | 'excluded' | 'hidden';  // Add this
}
</file.ts>

<index.ts>
//src/types/index.ts
// src/types/index.ts
export * from './file';
export * from './exclusions';
export * from './project';
export * from './presets';
export * from './output';
export * from './electron';
export * from './errors';
export * from './config';
</index.ts>

<output.ts>
//src/types/output.ts
// src/types/output.ts
export interface OutputFormat {
    destination: 'clipboard' | 'AIREADME.txt' | 'custom';
    customPath?: string;
    format: {
        includeProjectContext: boolean;
        includeFileTree: boolean;
        fileComments: boolean;
        separators: boolean;
        maxFileSize?: number;
    };
    header?: {
        title?: string;
        description?: string;
        customSections?: Record<string, string>;
    };
}
</output.ts>

<presets.ts>
//src/types/presets.ts
// src/types/presets.ts
import { ExclusionConfig } from './exclusions';
import { OutputFormat } from './output';

export interface SharePreset {
    id: string;
    name: string;
    description: string;
    isDefault?: boolean;
    exclusions: ExclusionConfig;
    outputFormat: OutputFormat;
    includeContext: {
        stack: boolean;
        description: boolean;
        dependencies: boolean;
        scripts: boolean;
    };
}
</presets.ts>

<project.ts>
//src/types/project.ts
// src/types/project.ts
export interface ProjectStack {
    type: 'react' | 'node' | 'electron' | 'vue' | 'angular' | string;
    framework: string[];
    language: 'typescript' | 'javascript' | 'mixed';
    testing: string[];
    styling: string[];
    buildTools: string[];
    database?: string[];
}

export interface ProjectContext {
    name: string;
    description: string;
    stack: ProjectStack;
    dependencies: {
        prod: Record<string, string>;
        dev: Record<string, string>;
    };
    scripts: Record<string, string>;
}
</project.ts>

<config.ts>
//src/utils/config.ts
// src/utils/config.ts
import { ExclusionConfig, UserConfig, SharePreset } from '../types';

export async function loadAndMergeConfigs() {
    const [exclusions, userConfig] = await Promise.all([
        window.electronAPI.loadConfig(),
        window.electronAPI.loadUserConfig()
    ]);
    return { exclusions, userConfig };
}

export async function saveUserPreferences(config: Partial<UserConfig>) {
    const current = await window.electronAPI.loadUserConfig();
    await window.electronAPI.saveUserConfig({
        ...current,
        ...config
    });
}

export async function addRecentProject(path: string) {
    const current = await window.electronAPI.loadUserConfig();
    await window.electronAPI.saveUserConfig({
        ...current,
        recentProjects: [
            path,
            ...(current.recentProjects || []).filter(p => p !== path)
        ].slice(0, current.maxRecentProjects || 10)
    });
}
</config.ts>

<fileUtils.ts>
//src/utils/fileUtils.ts
// src/utils/fileUtils.ts
export const IMAGE_EXTENSIONS = new Set([
    'jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 
    'svg', 'ico', 'tiff', 'tif'
]);

export const isImageFile = (filename: string): boolean => {
    const extension = filename.split('.').pop()?.toLowerCase() || '';
    return IMAGE_EXTENSIONS.has(extension);
};
</fileUtils.ts>

<projectAnalyzer.ts>
//src/utils/projectAnalyzer.ts
// src/utils/projectAnalyzer.ts
import * as fs from 'fs/promises';
import * as path from 'path';
import { ProjectContext, ProjectStack } from '../types';

interface PackageJson {
    name: string;
    description?: string;
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
    scripts?: Record<string, string>;
}

async function readPackageJson(rootPath: string): Promise<PackageJson> {
    try {
        const content = await fs.readFile(path.join(rootPath, 'package.json'), 'utf-8');
        return JSON.parse(content);
    } catch (error) {
        console.error('Error reading package.json:', error);
        return { name: path.basename(rootPath) };
    }
}

function detectProjectType(packageJson: PackageJson): ProjectStack['type'] {
    const allDeps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies
    };

    if (allDeps['electron']) return 'electron';
    if (allDeps['react']) return 'react';
    if (allDeps['vue']) return 'vue';
    if (allDeps['@angular/core']) return 'angular';
    if (allDeps['express'] || allDeps['koa'] || allDeps['fastify']) return 'node';
    
    return 'unknown';
}

function detectFrameworks(packageJson: PackageJson): string[] {
    const frameworks: string[] = [];
    const allDeps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies
    };

    // UI Frameworks
    if (allDeps['@mui/material']) frameworks.push('material-ui');
    if (allDeps['tailwindcss']) frameworks.push('tailwind');
    if (allDeps['@chakra-ui/react']) frameworks.push('chakra-ui');

    // State Management
    if (allDeps['redux'] || allDeps['@reduxjs/toolkit']) frameworks.push('redux');
    if (allDeps['mobx']) frameworks.push('mobx');
    if (allDeps['recoil']) frameworks.push('recoil');

    return frameworks;
}

async function detectLanguage(rootPath: string): Promise<ProjectStack['language']> {
    try {
        const files = await fs.readdir(rootPath);
        const hasTS = files.some(f => f.endsWith('.ts') || f.endsWith('.tsx'));
        const hasJS = files.some(f => f.endsWith('.js') || f.endsWith('.jsx'));
        
        if (hasTS && hasJS) return 'mixed';
        if (hasTS) return 'typescript';
        return 'javascript';
    } catch {
        return 'javascript';
    }
}

function detectTestingLibraries(packageJson: PackageJson): string[] {
    const testingTools: string[] = [];
    const allDeps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies
    };

    if (allDeps['jest']) testingTools.push('jest');
    if (allDeps['@testing-library/react']) testingTools.push('react-testing-library');
    if (allDeps['cypress']) testingTools.push('cypress');
    if (allDeps['vitest']) testingTools.push('vitest');

    return testingTools;
}

function detectStylingApproach(packageJson: PackageJson, rootPath: string): string[] {
    const stylingTools: string[] = [];
    const allDeps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies
    };

    if (allDeps['styled-components']) stylingTools.push('styled-components');
    if (allDeps['@emotion/react']) stylingTools.push('emotion');
    if (allDeps['sass']) stylingTools.push('sass');
    if (allDeps['tailwindcss']) stylingTools.push('tailwind');

    return stylingTools;
}

function detectBuildTools(packageJson: PackageJson): string[] {
    const buildTools: string[] = [];
    const allDeps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies
    };

    if (allDeps['webpack']) buildTools.push('webpack');
    if (allDeps['vite']) buildTools.push('vite');
    if (allDeps['parcel']) buildTools.push('parcel');
    if (allDeps['esbuild']) buildTools.push('esbuild');

    return buildTools;
}

export async function analyzeProject(rootPath: string): Promise<ProjectContext> {
    const packageJson = await readPackageJson(rootPath);
    
    const stack: ProjectStack = {
        type: detectProjectType(packageJson),
        framework: detectFrameworks(packageJson),
        language: await detectLanguage(rootPath),
        testing: detectTestingLibraries(packageJson),
        styling: detectStylingApproach(packageJson, rootPath),
        buildTools: detectBuildTools(packageJson)
    };

    return {
        name: packageJson.name,
        description: packageJson.description || '',
        stack,
        dependencies: {
            prod: packageJson.dependencies || {},
            dev: packageJson.devDependencies || {}
        },
        scripts: packageJson.scripts || {}
    };
}
</projectAnalyzer.ts>

<readmeGenerator.ts>
//src/utils/readmeGenerator.ts
import { ProjectContext, FileNode, OutputFormat } from '../types';

interface AIReadmeOptions {
    context: ProjectContext;
    format: OutputFormat;
    selectedFiles: FileNode[];
    customHeader?: string;
}

async function generateAIReadme(options: AIReadmeOptions): Promise<string> {
    const { context, format, selectedFiles } = options;
    let content = '';

    // Project Header
    if (format.format.includeProjectContext) {
        content += `<${context.name}>\n\n`;
        
        if (format.header?.title) {
            content += `# ${format.header.title}\n`;
        }

        if (format.header?.description || context.description) {
            content += `\n${format.header?.description || context.description}\n`;
        }

        // Stack Information
        content += '\n## Tech Stack\n';
        content += `- Type: ${context.stack.type}\n`;
        content += `- Framework: ${context.stack.framework.join(', ')}\n`;
        content += `- Language: ${context.stack.language}\n`;
        content += `- Testing: ${context.stack.testing.join(', ')}\n`;
        content += `- Styling: ${context.stack.styling.join(', ')}\n`;
        
        // Custom Sections
        if (format.header?.customSections) {
            Object.entries(format.header.customSections).forEach(([title, text]) => {
                content += `\n## ${title}\n${text}\n`;
            });
        }
        
        content += '\n';
    }

    // Rest of the content...
    return content;
}
</readmeGenerator.ts>

<tsconfig.json>
//tsconfig.json
{
    "compilerOptions": {
      "target": "es5",
      "lib": [
        "dom",
        "dom.iterable",
        "esnext"
      ],
      "allowJs": true,
      "skipLibCheck": true,
      "esModuleInterop": true,
      "allowSyntheticDefaultImports": true,
      "strict": true,
      "forceConsistentCasingInFileNames": true,
      "noFallthroughCasesInSwitch": true,
      "module": "esnext",
      "moduleResolution": "node",
      "resolveJsonModule": true,
      "isolatedModules": true,
      "noEmit": true,
      "jsx": "react-jsx",
      "baseUrl": ".",
      "paths": {
        "@/*": ["src/*"]
      }
    },
    "include": [
      "src"
    ]
  }
</tsconfig.json>

<tsconfig.paths.json>
//tsconfig.paths.json
{
    "compilerOptions": {
      "baseUrl": ".",
      "paths": {
        "@/*": ["src/*"]
      }
    }
  }
</tsconfig.paths.json>

</file-aggregator>