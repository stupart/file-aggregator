// src/App.tsx
import React, { useState } from 'react';
import { 
    Box,
    Button,
    Typography,
    Tooltip,
    IconButton,
    Snackbar,
    Paper,
    Chip
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import SettingsIcon from '@mui/icons-material/Settings';
import SaveIcon from '@mui/icons-material/Save';

import { FileNode, PromptConfig } from './types';
import { DEFAULT_EXCLUSIONS, DEFAULT_USER_CONFIG } from './constants/defaults';
import { FileTreeView } from './components/FileTree/FilesTreeView';
import { ExclusionDialog, PresetDialog } from './components/dialogs';

// Custom hooks
import { useServices } from './hooks/useServices';
import { useProjectManager } from './hooks/useProjectManager';
import { usePromptGeneration } from './hooks/usePromptGeneration';
import { useUIState } from './hooks/useUIState';
import { usePresetManager } from './hooks/usePresetManager';
import { PromptConfigDialog } from './components/dialogs/PromptConfigDialog';

const App: React.FC = () => {
    // Configuration State
    const [exclusionConfig, setExclusionConfig] = React.useState(DEFAULT_EXCLUSIONS);
    const [userConfig, setUserConfig] = React.useState(DEFAULT_USER_CONFIG);
    const [promptConfig, setPromptConfig] = React.useState<PromptConfig>({
        includeFileTree: true,
        includeIdentity: false,
        includeProject: true,
        includeTask: false,
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
    const [identity, setIdentity] = useState('');
    const [task, setTask] = useState('');


    // Preset Management
    const {
        activePreset,
        presets,
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
    React.useEffect(() => {
        configManager.loadPromptConfig().then(config => {
            // Handle prompt config loading
        }).catch(error => {
            console.error('Failed to load prompt config:', error);
            showSnackbar('Failed to load settings');
        });
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

    return (
        <Box sx={{ p: 2 }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="Prompt Settings">
                        <IconButton onClick={() => setPromptDialogOpen(true)}>
                            <SettingsIcon />
                        </IconButton>
                    </Tooltip>
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
                            sx={{ alignSelf: 'center', color: 'text.secondary' }}
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

            {/* Dialogs */}
            <ExclusionDialog
                open={configDialogOpen}
                onClose={() => setConfigDialogOpen(false)}
                exclusionConfig={exclusionConfig}
                onExclusionChange={setExclusionConfig}
            />
            
            <PresetDialog
                open={presetDialogOpen}
                onClose={() => setPresetDialogOpen(false)}
                presets={presets}
                activePreset={activePreset}
                onPresetSelect={handlePresetSelect}
                onEditPreset={handleEditPreset}
                onCreatePreset={handleCreatePreset}
            />

            <PromptConfigDialog
                open={promptDialogOpen}
                onClose={() => setPromptDialogOpen(false)}
                config={promptConfig}
                onConfigChange={setPromptConfig}
                identity={identity}
                onIdentityChange={setIdentity}
                task={task}
                onTaskChange={setTask}
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