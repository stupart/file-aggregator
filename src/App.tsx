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