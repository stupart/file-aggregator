<file-aggregator-codebase>

<project>
Type: electron
Framework: material-ui
Language: javascript
Testing: 
Styling: emotion

</project>

<task>
We're building a desktop application that helps developers more effectively use AI for coding tasks. The app allows users to:

Core Functionality:
- Select and aggregate multiple files into a well-structured prompt for AI
- Manage file inclusion/exclusion with a visual file tree
- Save and load presets for different types of AI interactions
- Automatically detect project context and tech stack

Key Features:
- Visual file tree with checkboxes for selection
- Configurable prompt structure with optional sections:
  - Identity (AI persona)
  - Project context
  - Task description
  - File tree
- Smart file handling:
  - Automatic file path comments
  - Tech stack detection
  - Exclusion patterns for common files (node_modules, etc.)
- Preset system for saving and reusing configurations
- Export to clipboard or aireadme.txt

Tech Stack:
- Electron
- React
- TypeScript
- Material-UI
- File system operations for project analysis

The app aims to streamline the process of preparing code for AI review, refactoring, or analysis by providing a structured way to select, organize, and format code files into effective prompts.

Problems:
- presets are a mess
    - present selected is not shown in UI
    - unify making, saving, and editing of presets in settings
    - make sure everything is part of the preset  
</task>

<project>
Type: electron
Framework: material-ui
Language: javascript
Testing: 
Styling: emotion

</project>

<task>
We're building a desktop application that helps developers more effectively use AI for coding tasks. The app allows users to:

Core Functionality:
- Select and aggregate multiple files into a well-structured prompt for AI
- Manage file inclusion/exclusion with a visual file tree
- Save and load presets for different types of AI interactions
- Automatically detect project context and tech stack

Key Features:
- Visual file tree with checkboxes for selection
- Configurable prompt structure with optional sections:
  - Identity (AI persona)
  - Project context
  - Task description
  - File tree
- Smart file handling:
  - Automatic file path comments
  - Tech stack detection
  - Exclusion patterns for common files (node_modules, etc.)
- Preset system for saving and reusing configurations
- Export to clipboard or aireadme.txt

Tech Stack:
- Electron
- React
- TypeScript
- Material-UI
- File system operations for project analysis

The app aims to streamline the process of preparing code for AI review, refactoring, or analysis by providing a structured way to select, organize, and format code files into effective prompts.

Problems:
- presets are a mess
    - present selected is not shown in UI
    - unify making, saving, and editing of presets in settings
    - make sure everything is part of the preset  
</task>

<file-aggregator>
//

</file-aggregator>

<electron>
//electron

</electron>

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
    FileError,
    PromptConfig
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

const DEFAULT_PROMPT_CONFIG: PromptConfig = {
    includeFileTree: true,
    includeIdentity: false,
    includeProject: true,
    includeTask: false,
    addFileHeaders: true,
    generatePseudocode: false
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


// Prompt handling
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

// Configuration handling
ipcMain.handle('save-prompt-config', async (_, config: PromptConfig) => {
    const configPath = path.join(app.getPath('userData'), 'prompt-config.json');
    try {
        await fs.promises.writeFile(configPath, JSON.stringify(config, null, 2), 'utf8');
        return true;
    } catch (error) {
        console.error('Error saving prompt config:', error);
        throw error;
    }
});

ipcMain.handle('load-prompt-config', async () => {
    const configPath = path.join(app.getPath('userData'), 'prompt-config.json');
    try {
        const config = await fs.promises.readFile(configPath, 'utf8');
        return JSON.parse(config);
    } catch (error) {
        console.error('Error loading prompt config:', error);
        return DEFAULT_PROMPT_CONFIG;
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
  "main": "build/electron/electron/main.js",
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

<public>
//public

</public>

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

<src>
//src

</src>

<App.tsx>
//src/App.tsx
// src/App.tsx
import React, { useEffect, useState } from 'react';
import { 
    Box,
    Button,
    Typography,
    Tooltip,
    IconButton,
    Snackbar,
    Paper,
    Chip,
    FormControl,
    Select,
    MenuItem
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import SettingsIcon from '@mui/icons-material/Settings';
import SaveIcon from '@mui/icons-material/Save';
import CommentIcon from '@mui/icons-material/Comment'; 

import { 
    ExclusionConfig, 
    FileNode, 
    OutputFormat, 
    PromptConfig,
    SharePreset  // Add this
} from './types';

import { DEFAULT_EXCLUSIONS, DEFAULT_USER_CONFIG } from './constants/defaults';
import { FileTreeView } from './components/FileTree/FilesTreeView';
import { PromptConfigDialog } from './components/dialogs/PromptConfigDialog';
import { PresetManagementDialog } from './components/dialogs/PresetManagementDialog';

// Custom hooks
import { useServices } from './hooks/useServices';
import { useProjectManager } from './hooks/useProjectManager';
import { usePromptGeneration } from './hooks/usePromptGeneration';
import { useUIState } from './hooks/useUIState';
import { usePresetManager } from './hooks/usePresetManager';
import { loadAndMergeConfigs } from './utils/config';

// Constants
const DEFAULT_OUTPUT_FORMAT: OutputFormat = {
    destination: 'AIREADME.txt',
    format: {
        includeProjectContext: true,
        includeFileTree: true,
        fileComments: true,
        separators: true,
        maxFileSize: undefined
    },
    header: {
        title: undefined,
        description: undefined,
        customSections: {}
    }
};


const App: React.FC = () => {
    // Configuration State
    const [exclusionConfig, setExclusionConfig] = React.useState(DEFAULT_EXCLUSIONS);
    const [userConfig, setUserConfig] = React.useState(DEFAULT_USER_CONFIG);
    const [promptConfig, setPromptConfig] = useState<PromptConfig>({
        includeFileTree: true,
        includeIdentity: false,
        includeProject: true,
        includeTask: false,
        task: '',           // Include task in config
        identity: '',       // Include identity in config
        addFileHeaders: true,
        generatePseudocode: false
    });

    // Project and File Management
    const {
        structure,
        projectRoot,
        projectContext,
        loadProject
    } = useProjectManager();

    // Services
    const { fileOps, configManager, promptBuilder } = useServices(projectRoot);

    // UI State
    const {
        configDialogOpen,
        setConfigDialogOpen,
        presetDialogOpen,
        setPresetDialogOpen,
        snackbarOpen,
        setSnackbarOpen,
        snackbarMessage,
        showSnackbar
    } = useUIState();

    const [promptDialogOpen, setPromptDialogOpen] = useState(false);
    // const [identity, setIdentity] = useState('');
    // const [task, setTask] = useState<string>('');
    const [exclusionPresets, setExclusionPresets] = useState<Array<{
        id: string;
        name: string;
        config: ExclusionConfig;
    }>>([]);


    // Preset Management
    const {
        activePreset,
        setActivePreset,  // Add this
        presets,
        setPresets,      // Add this
        handlePresetSelect,
        handleEditPreset,
        handleCreatePreset
    } = usePresetManager(setExclusionConfig);

    // File Selection and Generation
    const {
        selectedFiles,
        setSelectedFiles,
        loadingFiles,
        setLoadingFiles,
        generatedContent,
        setGeneratedContent,
        generatePromptContent
    } = usePromptGeneration(
        fileOps,
        promptBuilder,
        projectContext,
        structure,
        projectRoot,
        promptConfig
    );

    // Load initial configurations
    useEffect(() => {
        const loadConfigurations = async () => {
            try {
                // Load all configurations
                const [baseConfigs, promptCfg, presets] = await Promise.all([
                    loadAndMergeConfigs(),
                    configManager.loadPromptConfig(),
                    window.electronAPI.loadPresets()
                ]);
                
                setExclusionConfig(baseConfigs.exclusions);
                setUserConfig(baseConfigs.userConfig);
                setPromptConfig(promptCfg);
                
                // Transform presets
                setExclusionPresets(presets.map(preset => ({
                    id: preset.id,
                    name: preset.name,
                    config: preset.exclusions
                })));

            } catch (error) {
                console.error('Failed to load configurations:', error);
                showSnackbar('Failed to load settings');
            }
        };

        loadConfigurations();
    }, [configManager]);

    // Handlers
    const handleFolderSelect = async () => {
        const folderPath = await window.electronAPI.selectFolder();
        if (folderPath) {
            try {
                await loadProject(folderPath);
                showSnackbar('Project loaded successfully');
            } catch (error) {
                console.error('Failed to load project:', error);
                showSnackbar('Failed to load project completely');
            }
        }
    };

    const handleExport = async () => {
        if (!structure) return;
        
        try {
            const selectedNodes = getAllSelectedNodes(structure);
            const content = await generatePromptContent(selectedNodes);
            
            await fileOps.savePrompt(content, projectRoot);
            showSnackbar('Prompt saved successfully as aireadme.txt');
        } catch (error) {
            console.error('Export failed:', error);
            showSnackbar('Failed to export files');
        }
    };

    const handleCopyToClipboard = async () => {
        if (!structure) return;
        
        try {
            const selectedNodes = getAllSelectedNodes(structure);
            const content = await generatePromptContent(selectedNodes);
            
            await fileOps.copyToClipboard(content);
            showSnackbar('Content copied to clipboard!');
        } catch (error) {
            console.error('Copy failed:', error);
            showSnackbar('Failed to copy to clipboard');
        }
    };

    const getAllSelectedNodes = (node: FileNode): FileNode[] => {
        let selected: FileNode[] = [];
        
        const isExcluded = 
            exclusionConfig.global.files.includes(node.name) ||
            exclusionConfig.global.folders.includes(node.name);
    
        if (selectedFiles.has(node.path) && !isExcluded) {
            selected.push(node);
        }
    
        if (node.children && !exclusionConfig.behaviors.hideContents.includes(node.name)) {
            node.children.forEach(child => {
                selected = [...selected, ...getAllSelectedNodes(child)];
            });
        }
    
        return selected;
    };

    const handleAddFileHeaders = async () => {
        if (!structure || !projectRoot) return;
        
        try {
            const selectedNodes = getAllSelectedNodes(structure);
            const results = await fileOps.addFileHeaders(selectedNodes);
            
            // Show results
            const messages = [];
            if (results.modified.length > 0) {
                messages.push(`Added headers to ${results.modified.length} files`);
            }
            if (results.skipped.length > 0) {
                messages.push(`${results.skipped.length} files already had headers`);
            }
            if (results.errors.length > 0) {
                console.error('Errors adding headers:', results.errors);
                messages.push(`Failed to add headers to ${results.errors.length} files`);
            }

            showSnackbar(messages.join('. '));
        } catch (error) {
            console.error('Failed to add file headers:', error);
            showSnackbar('Failed to add file headers');
        }
    };

    const handlePresetSave = async (preset: SharePreset) => {
        try {
            await window.electronAPI.savePreset(preset);
            const updatedPresets = await window.electronAPI.loadPresets();
            setPresets(updatedPresets);
            showSnackbar('Preset saved successfully');
        } catch (error) {
            console.error('Failed to save preset:', error);
            showSnackbar('Failed to save preset');
        }
    };


    // Handler for saving new exclusion presets
    const handleSaveExclusionPreset = async (name: string, config: ExclusionConfig) => {
        try {
            const newPreset = {
                id: `preset-${Date.now()}`,
                name,
                config
            };

            await window.electronAPI.savePreset({
                id: newPreset.id,
                name: newPreset.name,
                description: `Exclusion preset: ${name}`,
                exclusions: config,
                outputFormat: DEFAULT_OUTPUT_FORMAT, // Use the default format
                includeContext: {
                    stack: true,
                    description: true,
                    dependencies: true,
                    scripts: true
                }
            });

            setExclusionPresets(prev => [...prev, newPreset]);
            showSnackbar('Preset saved successfully');
        } catch (error) {
            console.error('Failed to save preset:', error);
            showSnackbar('Failed to save preset');
        }
    };
        
    const handlePresetDelete = async (presetId: string) => {
        try {
            await window.electronAPI.deletePreset(presetId);
            const updatedPresets = await window.electronAPI.loadPresets();
            setPresets(updatedPresets);
            if (activePreset === presetId) {
                setActivePreset(null);
            }
            showSnackbar('Preset deleted successfully');
        } catch (error) {
            console.error('Failed to delete preset:', error);
            showSnackbar('Failed to delete preset');
        }
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
                        <Button
                            variant="outlined"
                            onClick={handleAddFileHeaders}
                            disabled={selectedFiles.size === 0}
                            startIcon={<CommentIcon />}
                        >
                            Add File Headers
                        </Button>
                        {projectContext && (
                            <Typography 
                                variant="body1" 
                                sx={{ alignSelf: 'center', color: 'text.secondary' }}
                            >
                                {projectContext.name}
                            </Typography>
                        )}
                    </Box>
                    {/* Replace this right-side box with our new implementation */}
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        {/* Add Preset Selector */}
                        <FormControl size="small" sx={{ minWidth: 200 }}>
                            <Select
                                value={activePreset || ''}
                                onChange={(e) => handlePresetSelect(e.target.value)}
                                displayEmpty
                                sx={{ bgcolor: 'background.paper' }}
                            >
                                <MenuItem value="">
                                    <em>No Preset Selected</em>
                                </MenuItem>
                                {presets.map((preset) => (
                                    <MenuItem key={preset.id} value={preset.id}>
                                        {preset.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        
                        {/* Existing Buttons */}
                        <Tooltip title="Manage Presets">
                            <IconButton 
                                onClick={() => setPresetDialogOpen(true)}
                                color={activePreset ? 'primary' : 'default'}
                            >
                                <BookmarkIcon />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Prompt & Exclusion Settings">
                            <IconButton onClick={() => setPromptDialogOpen(true)}>
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
                        onSelectionChange={setSelectedFiles}
                        onExclusionChange={setExclusionConfig}
                    />
                    
                    {/* Action Buttons */}
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
                                sx={{ alignSelf: 'center', color: 'text.secondary' }}
                            >
                                {selectedFiles.size} file(s) selected
                            </Typography>
                        )}
                    </Box>
                </>
            )}

            {/* Configuration Dialog */}
            <PromptConfigDialog
                open={promptDialogOpen}
                onClose={() => setPromptDialogOpen(false)}
                config={promptConfig}
                onConfigChange={setPromptConfig}  // Changed from separate handlers
                exclusionConfig={exclusionConfig}
                onExclusionChange={setExclusionConfig}
                exclusionPresets={exclusionPresets}
                onSaveExclusionPreset={handleSaveExclusionPreset}
            />
            <PresetManagementDialog
                open={presetDialogOpen}
                onClose={() => setPresetDialogOpen(false)}
                presets={presets}
                activePreset={activePreset}
                currentConfig={exclusionConfig}
                onPresetSelect={handlePresetSelect}
                onPresetSave={handlePresetSave}
                onPresetDelete={handlePresetDelete}
            />
            
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

<components>
//src/components

</components>

<FileTree>
//src/components/FileTree

</FileTree>

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
                            e.stopPropagation();  // Add this
                            onCheckboxChange(node, e.target.checked);
                        }}
                        onClick={(e) => {         // Add this
                            e.stopPropagation();
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

<TaskInput.tsx>
//src/components/TaskInput.tsx
// src/components/TaskInput.tsx
import React from 'react';
import { TextField, Box } from '@mui/material';

interface TaskInputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

export const TaskInput: React.FC<TaskInputProps> = ({
    value,
    onChange,
    placeholder = "Describe the task or changes needed..."
}) => {
    return (
        <Box sx={{ mb: 2 }}>
            <TextField
                fullWidth
                multiline
                rows={3}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                label="Task Description"
                variant="outlined"
            />
        </Box>
    );
};
</TaskInput.tsx>

<dialogs>
//src/components/dialogs

</dialogs>

<PresetDialog.tsx>
//src/components/dialogs/PresetDialog.tsx
// src/components/dialogs/PresetDialog.tsx
import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    Typography,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    IconButton,
    Checkbox
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import { SharePreset } from '../../types';

interface PresetDialogProps {
    open: boolean;
    onClose: () => void;
    presets: SharePreset[];
    activePreset: string | null;
    onPresetSelect: (presetId: string) => void;
    onEditPreset: (preset: SharePreset) => void;
    onCreatePreset: () => void;
}

export const PresetDialog: React.FC<PresetDialogProps> = ({
    open,
    onClose,
    presets,
    activePreset,
    onPresetSelect,
    onEditPreset,
    onCreatePreset
}) => {
    return (
        <Dialog open={open} onClose={onClose}>
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
                                        onClick={() => onEditPreset(preset)}
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
                                    onChange={() => onPresetSelect(preset.id)}
                                />
                            </ListItem>
                        ))}
                    </List>
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onCreatePreset}>Create New</Button>
                <Button onClick={onClose}>Close</Button>
            </DialogActions>
        </Dialog>
    );
};
</PresetDialog.tsx>

<PresetManagementDialog.tsx>
//src/components/dialogs/PresetManagementDialog.tsx
// src/components/dialogs/PresetManagementDialog.tsx
import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    IconButton,
    TextField,
    Box,
    Typography,
    Chip,
    Divider,
    Tooltip,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { SharePreset, ExclusionConfig } from '../../types';

interface PresetManagementDialogProps {
    open: boolean;
    onClose: () => void;
    presets: SharePreset[];
    activePreset: string | null;
    currentConfig: ExclusionConfig;
    onPresetSelect: (presetId: string) => void;
    onPresetSave: (preset: SharePreset) => Promise<void>;
    onPresetDelete: (presetId: string) => Promise<void>;
}

interface PresetFormData {
    name: string;
    description: string;
}

export const PresetManagementDialog: React.FC<PresetManagementDialogProps> = ({
    open,
    onClose,
    presets,
    activePreset,
    currentConfig,
    onPresetSelect,
    onPresetSave,
    onPresetDelete,
}) => {
    const [editingPreset, setEditingPreset] = useState<SharePreset | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [formData, setFormData] = useState<PresetFormData>({
        name: '',
        description: '',
    });

    const handleCreateNew = () => {
        setIsCreating(true);
        setFormData({ name: '', description: '' });
    };

    const handleEdit = (preset: SharePreset) => {
        setEditingPreset(preset);
        setFormData({
            name: preset.name,
            description: preset.description,
        });
    };

    const handleSave = async () => {
        if (!formData.name.trim()) return;

        const newPreset: SharePreset = {
            id: editingPreset?.id || `preset-${Date.now()}`,
            name: formData.name,
            description: formData.description,
            exclusions: editingPreset?.exclusions || currentConfig,
            outputFormat: editingPreset?.outputFormat || {
                destination: 'AIREADME.txt',
                format: {
                    includeProjectContext: true,
                    includeFileTree: true,
                    fileComments: true,
                    separators: true,
                }
            },
            includeContext: editingPreset?.includeContext || {
                stack: true,
                description: true,
                dependencies: true,
                scripts: true,
            }
        };

        await onPresetSave(newPreset);
        resetForm();
    };

    const handleDelete = async (presetId: string) => {
        if (window.confirm('Are you sure you want to delete this preset?')) {
            await onPresetDelete(presetId);
        }
    };

    const resetForm = () => {
        setEditingPreset(null);
        setIsCreating(false);
        setFormData({ name: '', description: '' });
    };

    const renderPresetForm = () => (
        <Box sx={{ mt: 2, mb: 2 }}>
            <Typography variant="h6">
                {isCreating ? 'Create New Preset' : 'Edit Preset'}
            </Typography>
            <TextField
                fullWidth
                label="Preset Name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                margin="normal"
                size="small"
            />
            <TextField
                fullWidth
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                margin="normal"
                size="small"
                multiline
                rows={2}
            />
            <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                <Button
                    variant="contained"
                    onClick={handleSave}
                    disabled={!formData.name.trim()}
                >
                    Save
                </Button>
                <Button onClick={resetForm}>
                    Cancel
                </Button>
            </Box>
        </Box>
    );

    return (
        <Dialog 
            open={open} 
            onClose={onClose}
            maxWidth="md"
            fullWidth
        >
            <DialogTitle>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    Manage Presets
                    <Button
                        startIcon={<AddIcon />}
                        onClick={handleCreateNew}
                        disabled={isCreating || !!editingPreset}
                    >
                        Create New
                    </Button>
                </Box>
            </DialogTitle>
            <DialogContent>
                {(isCreating || editingPreset) && renderPresetForm()}
                
                {!isCreating && !editingPreset && (
                    <List>
                        {presets.map((preset) => (
                            <React.Fragment key={preset.id}>
                                <ListItem>
                                    <ListItemText
                                        primary={
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                {preset.name}
                                                {activePreset === preset.id && (
                                                    <Chip 
                                                        label="Active" 
                                                        size="small" 
                                                        color="primary" 
                                                        variant="outlined"
                                                    />
                                                )}
                                            </Box>
                                        }
                                        secondary={preset.description}
                                    />
                                    <ListItemSecondaryAction>
                                        <Tooltip title="Edit">
                                            <IconButton 
                                                edge="end" 
                                                onClick={() => handleEdit(preset)}
                                                sx={{ mr: 1 }}
                                            >
                                                <EditIcon />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Delete">
                                            <IconButton 
                                                edge="end" 
                                                onClick={() => handleDelete(preset.id)}
                                            >
                                                <DeleteIcon />
                                            </IconButton>
                                        </Tooltip>
                                    </ListItemSecondaryAction>
                                </ListItem>
                                <Divider />
                            </React.Fragment>
                        ))}
                    </List>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Close</Button>
            </DialogActions>
        </Dialog>
    );
};
</PresetManagementDialog.tsx>

<index.ts>
//src/components/dialogs/index.ts
// src/components/dialogs/index.ts
export * from './PromptConfigDialog/ExclusionDialog';
export * from './PresetDialog';
</index.ts>

<sections>
//src/components/sections

</sections>

<TaskSection.tsx>
//src/components/sections/TaskSection.tsx
// src/components/sections/TaskSection.tsx
import React from 'react';
import {
    Box,
    TextField,
    FormControlLabel,
    Switch,
    Typography,
    Paper
} from '@mui/material';

interface TaskSectionProps {
    task: string;
    includeTask: boolean;
    onTaskChange: (task: string) => void;
    onIncludeTaskChange: (include: boolean) => void;
}

export const TaskSection: React.FC<TaskSectionProps> = ({
    task,
    includeTask,
    onTaskChange,
    onIncludeTaskChange
}) => {
    return (
        <Paper sx={{ p: 2, mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6">Task Description</Typography>
                <FormControlLabel
                    control={
                        <Switch
                            checked={includeTask}
                            onChange={(e) => onIncludeTaskChange(e.target.checked)}
                        />
                    }
                    label="Include Task"
                />
            </Box>
            <TextField
                fullWidth
                multiline
                rows={4}
                value={task}
                onChange={(e) => onTaskChange(e.target.value)}
                placeholder="Describe what needs to be done..."
                disabled={!includeTask}
                sx={{ mb: 1 }}
            />
            <Typography variant="body2" color="text.secondary">
                Describe the specific task, changes, or improvements needed for this code.
            </Typography>
        </Paper>
    );
};
</TaskSection.tsx>

<constants>
//src/constants

</constants>

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

<hooks>
//src/hooks

</hooks>

<usePresetManager.ts>
//src/hooks/usePresetManager.ts
// src/hooks/usePresetManager.ts
import { useState, useCallback } from 'react';
import { SharePreset, ExclusionConfig } from '../types';

export const usePresetManager = (onExclusionChange: (config: ExclusionConfig) => void) => {
    const [activePreset, setActivePreset] = useState<string | null>(null);
    const [presets, setPresets] = useState<SharePreset[]>([]);

    const handlePresetSelect = useCallback((presetId: string) => {
        setActivePreset(presetId);
        const selectedPreset = presets.find(p => p.id === presetId);
        if (selectedPreset) {
            onExclusionChange(selectedPreset.exclusions);
        }
    }, [presets, onExclusionChange]);

    const handleEditPreset = (preset: SharePreset) => {
        // TODO: Implement preset editing
        console.log('Editing preset:', preset);
    };

    const handleCreatePreset = () => {
        // TODO: Implement preset creation
        console.log('Creating new preset');
    };

    return {
        activePreset,
        setActivePreset,  // Add this
        presets,
        setPresets,      // Add this
        handlePresetSelect,
        handleEditPreset,
        handleCreatePreset
    };
};
</usePresetManager.ts>

<useProjectManager.ts>
//src/hooks/useProjectManager.ts
// src/hooks/useProjectManager.ts
import { useState, useCallback } from 'react';
import { FileNode, ProjectContext } from '../types';
import { addRecentProject } from '../utils/config';
import { useServices } from './useServices';

export const useProjectManager = () => {
    const [structure, setStructure] = useState<FileNode | null>(null);
    const [projectRoot, setProjectRoot] = useState<string>('');
    const [projectContext, setProjectContext] = useState<ProjectContext | null>(null);
    const { fileOps } = useServices(projectRoot);

    const loadProject = useCallback(async (folderPath: string) => {
        setProjectRoot(folderPath);
        
        // Update FileOperations with new project root
        fileOps.setProjectRoot(folderPath);
        
        // Scan directory
        const fileStructure = await window.electronAPI.scanDirectory(folderPath);
        setStructure(fileStructure);

        // Add to recent projects
        await addRecentProject(folderPath);

        // Analyze project context
        const context = await window.electronAPI.analyzeProject(folderPath);
        setProjectContext(context);

        return { fileStructure, context };
    }, [fileOps]); // Add fileOps to dependencies

    return {
        structure,
        projectRoot,
        projectContext,
        loadProject,
        setProjectRoot,
        setStructure,
        setProjectContext
    };
};
</useProjectManager.ts>

<usePromptGeneration.ts>
//src/hooks/usePromptGeneration.ts
// src/hooks/usePromptGeneration.ts
import { useState, useCallback } from 'react';
import { FileNode, PromptConfig, ProjectContext } from '../types';
import { PromptBuilder } from '../services/PromptBuilder';
import { FileOperations } from '../services/FileOperations';

interface UsePromptGenerationReturn {
    selectedFiles: Set<string>;
    setSelectedFiles: (files: Set<string>) => void;
    loadingFiles: Set<string>;
    setLoadingFiles: (files: Set<string>) => void;
    generatedContent: string;
    setGeneratedContent: (content: string) => void;
    generatePromptContent: (selectedNodes: FileNode[]) => Promise<string>;
}

export const usePromptGeneration = (
    fileOps: FileOperations,
    promptBuilder: PromptBuilder | null,
    projectContext: ProjectContext | null,
    structure: FileNode | null,
    projectRoot: string,
    promptConfig: PromptConfig
): UsePromptGenerationReturn => {
    const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
    const [loadingFiles, setLoadingFiles] = useState<Set<string>>(new Set());
    const [generatedContent, setGeneratedContent] = useState<string>('');

    const generatePromptContent = async (selectedNodes: FileNode[]): Promise<string> => {
        if (!promptBuilder || !structure || !projectContext) {
            throw new Error('Project not properly initialized');
        }

        // Add files to the builder
        const nodesWithContent = await Promise.all(
            selectedNodes.map(async (node) => {
                if (!node.isDirectory) {
                    const content = await fileOps.readFileContent(node.path);
                    return { ...node, content };
                }
                return node;
            })
        );
    
        // Clear previous sections
        promptBuilder.clearSections(); // Add this method to PromptBuilder
    
        // Add sections based on config
        if (promptConfig.includeIdentity && promptConfig.identity) {
            promptBuilder.addIdentity(promptConfig.identity);
        }
        
        if (promptConfig.includeProject) {
            promptBuilder.addProject(projectContext);
        }
        
        if (promptConfig.includeTask && promptConfig.task) {
            promptBuilder.addTask(promptConfig.task);
        }
    
        if (promptConfig.includeFileTree) {
            promptBuilder.addFileTree(structure);
        }
    
        promptBuilder.addFiles(nodesWithContent);
    
        // Generate the prompt with all options
        return promptBuilder.generatePrompt({
            projectName: projectRoot.split('/').pop() || 'project',
            projectContext: promptConfig.includeProject ? projectContext : undefined,
            identity: promptConfig.includeIdentity ? promptConfig.identity : undefined,
            task: promptConfig.includeTask ? promptConfig.task : undefined,
            includeFileTree: promptConfig.includeFileTree
        });
    };
    
    return {
        selectedFiles,
        setSelectedFiles,
        loadingFiles,
        setLoadingFiles,
        generatedContent,
        setGeneratedContent,
        generatePromptContent
    };
};
</usePromptGeneration.ts>

<useServices.ts>
//src/hooks/useServices.ts
// src/hooks/useServices.ts
import { useMemo } from 'react';
import { PromptBuilder } from '../services/PromptBuilder';
import { FileOperations } from '../services/FileOperations';
import { ConfigurationManager } from '../services/ConfigurationManager';

export const useServices = (projectRoot: string) => {
    // Create a single fileOps instance that persists
    const fileOps = useMemo(() => new FileOperations(window.electronAPI), []);
    const configManager = useMemo(() => new ConfigurationManager(window.electronAPI), []);
    const promptBuilder = useMemo(() => 
        projectRoot ? new PromptBuilder(projectRoot) : null, 
        [projectRoot]
    );

    return {
        fileOps,
        configManager,
        promptBuilder
    };
};

</useServices.ts>

<useUIState.ts>
//src/hooks/useUIState.ts
// src/hooks/useUIState.ts
import { useState } from 'react';

export const useUIState = () => {
    const [configDialogOpen, setConfigDialogOpen] = useState(false);
    const [presetDialogOpen, setPresetDialogOpen] = useState(false);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');

    const showSnackbar = (message: string) => {
        setSnackbarMessage(message);
        setSnackbarOpen(true);
    };

    return {
        configDialogOpen,
        setConfigDialogOpen,
        presetDialogOpen,
        setPresetDialogOpen,
        snackbarOpen,
        setSnackbarOpen,
        snackbarMessage,
        showSnackbar
    };
};
</useUIState.ts>

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

<services>
//src/services

</services>

<ConfigurationManager.ts>
//src/services/ConfigurationManager.ts
// src/services/ConfigurationManager.ts

import { UserConfig, PromptConfig } from '../types';

const DEFAULT_PROMPT_CONFIG: PromptConfig = {
  includeFileTree: true,
  includeIdentity: false,
  includeProject: true,
  includeTask: false,
  addFileHeaders: true,
  generatePseudocode: false
};

export class ConfigurationManager {
  constructor(private electronAPI: Window['electronAPI']) {}

  public async loadPromptConfig(): Promise<PromptConfig> {
    try {
      const userConfig = await this.electronAPI.loadUserConfig();
      return {
        ...DEFAULT_PROMPT_CONFIG,
        ...userConfig.promptConfig
      };
    } catch (error) {
      console.error('Failed to load prompt config:', error);
      return DEFAULT_PROMPT_CONFIG;
    }
  }

  public async savePromptConfig(config: PromptConfig): Promise<void> {
    const userConfig = await this.electronAPI.loadUserConfig();
    await this.electronAPI.saveUserConfig({
      ...userConfig,
      promptConfig: config
    });
  }
}
</ConfigurationManager.ts>

<FileOperations.ts>
//src/services/FileOperations.ts
// src/services/FileOperations.ts
import { FileNode } from '../types';

export class FileOperations {
  private projectRoot: string = '';

  constructor(private electronAPI: Window['electronAPI']) {}

  public setProjectRoot(root: string) {
    this.projectRoot = root;
  }

  public async savePrompt(content: string, projectRoot: string): Promise<void> {
    const filePath = `${projectRoot}/aireadme.txt`;
    await this.electronAPI.writeFile(filePath, content);
  }

  public async copyToClipboard(content: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(content);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      throw new Error('Failed to copy to clipboard');
    }
  }

  public async addFileHeaders(files: FileNode[]): Promise<{
    modified: string[];
    skipped: string[];
    errors: {path: string; error: string}[];
  }> {
    if (!this.projectRoot) {
      throw new Error('Project root not set');
    }

    const results = {
      modified: [] as string[],
      skipped: [] as string[],
      errors: [] as {path: string; error: string}[]
    };

    for (const file of files) {
      if (!file.isDirectory) {
        try {
          const content = await this.electronAPI.readFileContent(file.path);
          const relativePath = file.path.replace(this.projectRoot, '')
            .replace(/^[/\\]+/, ''); // Remove leading slashes/backslashes
          const header = `//${relativePath}\n`;
          
          const normalizedContent = content.trimStart();
          const headerVariations = [
            header,
            header.trim(),
            `//${relativePath.replace(/\\/g, '/')}`, // Handle Windows paths
            `//${relativePath.replace(/\//g, '\\')}` // Handle Unix paths
          ];
          
          if (headerVariations.some(h => normalizedContent.startsWith(h))) {
            results.skipped.push(file.path);
            continue;
          }

          await this.electronAPI.writeFile(file.path, header + content);
          results.modified.push(file.path);
        } catch (error) {
          results.errors.push({
            path: file.path,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
    }
    return results;
  }

  public async readFileContent(filePath: string): Promise<string> {
    return await this.electronAPI.readFileContent(filePath);
  }
}
</FileOperations.ts>

<PromptBuilder.ts>
//src/services/PromptBuilder.ts
// src/services/PromptBuilder.ts

import { FileNode, ProjectContext, PromptSection, PromptOptions } from '../types';

export class PromptBuilder {
  private sections: PromptSection[] = [];
  private projectRoot: string;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
  }

  public clearSections(): void {
    this.sections = [];
  }   

  public addIdentity(identity: string): void {
    this.sections.push({
      type: 'identity',
      content: `<identity>\n${identity}\n</identity>\n\n`,
      optional: true
    });
  }

  public addProject(context: ProjectContext): void {
    const content = `<project>\n${this.formatProjectContext(context)}\n</project>\n\n`;
    this.sections.push({
      type: 'project',
      content,
      optional: true
    });
  }

  public addTask(task: string): void {
    this.sections.push({
      type: 'task',
      content: `<task>\n${task}\n</task>\n\n`,
      optional: true
    });
  }

  public addFileTree(structure: FileNode): void {
    const treeContent = this.generateFileTree(structure);
    this.sections.push({
      type: 'fileTree',
      content: `<file-tree>\n${treeContent}</file-tree>\n\n`,
      optional: true
    });
  }

  public addFiles(files: FileNode[]): void {
    const filesContent = this.formatFiles(files);
    this.sections.push({
      type: 'files',
      content: filesContent
    });
  }

  public async generatePrompt(options: PromptOptions): Promise<string> {
    const { projectName, identity, task } = options;
    let output = `<${projectName}-codebase>\n\n`;

    // Add identity if present
    if (identity) {
        output += `<identity>\n${identity}\n</identity>\n\n`;
    }

    // Add project context if present
    if (options.projectContext) {
        output += `<project>\n${this.formatProjectContext(options.projectContext)}\n</project>\n\n`;
    }

    // Add task if present
    if (task) {
        output += `<task>\n${task}\n</task>\n\n`;
    }
    
    // Add sections in specific order
    const orderedTypes: PromptSection['type'][] = [
      'identity',
      'project',
      'task',
      'fileTree',
      'files'
    ];

    for (const type of orderedTypes) {
      const section = this.sections.find(s => s.type === type);
      if (section && (!section.optional || this.shouldIncludeSection(type, options))) {
        output += section.content;
      }
    }

    output += `</${projectName}-codebase>`;
    return output;
  }

  private shouldIncludeSection(type: PromptSection['type'], options: PromptOptions): boolean {
    switch (type) {
      case 'fileTree':
        return !!options.includeFileTree;
      case 'identity':
        return !!options.identity;
      case 'project':
        return !!options.projectContext;
      case 'task':
        return !!options.task;
      default:
        return true;
    }
  }

  private formatProjectContext(context: ProjectContext): string {
    return `Type: ${context.stack.type}
Framework: ${context.stack.framework.join(', ')}
Language: ${context.stack.language}
Testing: ${context.stack.testing.join(', ')}
Styling: ${context.stack.styling.join(', ')}
${context.description ? `\nDescription: ${context.description}` : ''}`;
  }

  private generateFileTree(node: FileNode, depth: number = 0): string {
    const indent = '  '.repeat(depth);
    let output = `${indent}${node.path}\n`;

    if (node.children) {
      for (const child of node.children) {
        output += this.generateFileTree(child, depth + 1);
      }
    }

    return output;
  }

  private formatFiles(files: FileNode[]): string {
    return files.map(file => {
        const relativePath = file.path.replace(this.projectRoot, '')
            .replace(/^[/\\]+/, ''); // Remove leading slashes/backslashes
        const header = `//${relativePath}`;
        return `<${file.name}>\n${header}\n${file.content || ''}\n</${file.name}>\n\n`;
    }).join('');
  }
}


</PromptBuilder.ts>

<types>
//src/types

</types>

<config.ts>
//src/types/config.ts
// src/types/config.ts
export interface PromptConfig {
    includeFileTree: boolean;
    includeIdentity: boolean;
    includeProject: boolean;
    includeTask: boolean;
    task?: string;  // Add this
    identity?: string;  // Add this
    addFileHeaders: boolean;
    generatePseudocode: boolean;
}

export interface UserConfig {
    lastUsedPreset?: string;
    defaultOutputPath?: string;
    theme?: 'light' | 'dark' | 'system';
    recentProjects?: string[];
    maxRecentProjects?: number;
    promptConfig?: PromptConfig;  // Add this for prompt configuration
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
    ProjectContext,
    PromptConfig 
} from './index';

declare global {
    interface Window {
        electronAPI: {
            // Existing operations
            selectFolder: () => Promise<string | null>;
            scanDirectory: (path: string) => Promise<FileNode>;
            readFileContent: (path: string) => Promise<string>;
            writeFile: (path: string, content: string) => Promise<void>;
            exportFiles: (content: string, defaultFileName: string) => Promise<string | null>;
            
            // New operations for prompt handling
            savePrompt: (content: string, projectRoot: string) => Promise<void>;
            addFileHeaders: (files: { path: string; content: string }[]) => Promise<void>;
            
            // Enhanced configuration management
            saveConfig: (config: ExclusionConfig) => Promise<void>;
            loadConfig: () => Promise<ExclusionConfig>;
            saveUserConfig: (config: UserConfig) => Promise<void>;
            loadUserConfig: () => Promise<UserConfig>;
            savePromptConfig: (config: PromptConfig) => Promise<void>;
            loadPromptConfig: () => Promise<PromptConfig>;
            
            // Existing preset and project operations
            savePreset: (preset: SharePreset) => Promise<void>;
            deletePreset: (presetId: string) => Promise<boolean>;
            analyzeProject: (path: string) => Promise<ProjectContext>;
            loadPresets: () => Promise<Array<{
                id: string;
                name: string;
                description: string;
                exclusions: ExclusionConfig;
                outputFormat: any; 
                includeContext: {
                    stack: boolean;
                    description: boolean;
                    dependencies: boolean;
                    scripts: boolean;
                };
            }>>;
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
    status?: 'included' | 'excluded' | 'hidden';
    content?: string;  // Add this for file contents
}
</file.ts>

<index.ts>
//src/types/index.ts
// src/types/index.ts
// Export all types
export type { FileNode } from './file';
export type { 
    GlobalExclusions,
    SessionExclusions,
    FolderBehaviors,
    ExclusionConfig 
} from './exclusions';
export type { 
    ProjectStack,
    ProjectContext 
} from './project';
export type { SharePreset } from './presets';
export type { OutputFormat } from './output';
export type { FileError } from './errors';
export type { 
    UserConfig,
    PromptConfig 
} from './config';
export type { 
    PromptSection,
    PromptOptions 
} from './prompt';
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

<prompt.ts>
//src/types/prompt.ts
// src/types/prompt.ts
import { FileNode } from './file';
import { ProjectContext } from './project';

export interface PromptSection {
    type: 'identity' | 'project' | 'task' | 'fileTree' | 'files';
    content: string;
    optional?: boolean;
}

export interface PromptOptions {
    projectName: string;
    projectContext?: ProjectContext;
    selectedFiles?: FileNode[];
    identity?: string;
    task?: string;
    includeFileTree?: boolean;
}
</prompt.ts>

<utils>
//src/utils

</utils>

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

</file-aggregator-codebase>