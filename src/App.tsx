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

    const handleCheckboxChange = (node: FileNode, checked: boolean) => {
        const newSelected = new Set(selectedFiles);
        const affectedPaths = getAllDescendantPaths(node);
    
        affectedPaths.forEach(path => {
            // Get the node for this path
            const pathNode = findNodeByPath(structure!, path);
            if (!pathNode) return;
    
            // Check if this node is excluded
            const isExcluded = 
                exclusionConfig.global.files.includes(pathNode.name) ||
                exclusionConfig.global.folders.includes(pathNode.name);
    
            // Only allow selection of non-excluded files
            if (checked && !isExcluded) {
                newSelected.add(path);
            } else {
                newSelected.delete(path);
            }
        });
    
        setSelectedFiles(newSelected);
    };
    
    // Helper function to find a node by path
    const findNodeByPath = (root: FileNode, searchPath: string): FileNode | null => {
        if (root.path === searchPath) return root;
        if (!root.children) return null;
        
        for (const child of root.children) {
            const found = findNodeByPath(child, searchPath);
            if (found) return found;
        }
        
        return null;
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
    
    const getAllDescendantPaths = (node: FileNode): string[] => {
        let paths: string[] = [node.path];
        if (node.children) {
            node.children.forEach(child => {
                paths = [...paths, ...getAllDescendantPaths(child)];
            });
        }
        return paths;
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
        
        // Add directory structure (only showing included files)
        output += "<file-tree>\n";
        const addStructure = (node: FileNode, depth: number = 0) => {
            // Skip excluded files/folders in the tree view
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
        
        // Add file contents (only for selected and included files)
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
                output += `//${relativePath}\n`;
                try {
                    const content = await window.electronAPI.readFileContent(node.path);
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

    const handleExcludeFile = (node: FileNode) => {
        const newConfig = { ...exclusionConfig };
        if (node.isDirectory) {
            newConfig.global.folders.push(node.name);
        } else {
            newConfig.global.files.push(node.name);
        }
        setExclusionConfig(newConfig);
        
        // Remove from selected files if it was selected
        if (selectedFiles.has(node.path)) {
            const newSelected = new Set(selectedFiles);
            newSelected.delete(node.path);
            setSelectedFiles(newSelected);
        }
    };
    
    const handleIncludeFile = (node: FileNode) => {
        const newConfig = { ...exclusionConfig };
        if (node.isDirectory) {
            newConfig.global.folders = newConfig.global.folders.filter(f => f !== node.name);
        } else {
            newConfig.global.files = newConfig.global.files.filter(f => f !== node.name);
        }
        newConfig.behaviors.hideContents = newConfig.behaviors.hideContents.filter(f => f !== node.name);
        setExclusionConfig(newConfig);
    };

    const renderTree = (node: FileNode) => {
        const isChecked = selectedFiles.has(node.path);
        const hasCheckedChildren = node.children?.some(child => 
            selectedFiles.has(child.path) || 
            (child.children && child.children.some(grandChild => selectedFiles.has(grandChild.path)))
        );
        const isLoading = loadingFiles.has(node.path);
    
        // Determine file status
        const getFileStatus = (node: FileNode) => {
            if (exclusionConfig.global.files.includes(node.name) ||
                exclusionConfig.global.folders.includes(node.name)) {
                return 'excluded';
            }
            if (exclusionConfig.behaviors.hideContents.includes(node.name)) {
                return 'hidden';
            }
            return 'included';
        };
    
        const status = getFileStatus(node);
    
        return (
            <TreeItem
                key={node.path}
                nodeId={node.path}
                label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {status === 'included' && (
                            <Box sx={{ position: 'relative' }}>
                                <Checkbox
                                    checked={isChecked}
                                    indeterminate={!isChecked && hasCheckedChildren}
                                    onChange={(e) => handleCheckboxChange(node, e.target.checked)}
                                    onClick={(e) => e.stopPropagation()}
                                    sx={{ 
                                        visibility: isLoading ? 'hidden' : 'visible'
                                    }}
                                />
                                {isLoading && <CircularProgress size={20} />}
                            </Box>
                        )}
                        <Typography 
                            sx={{ 
                                color: status === 'excluded' ? 'text.disabled' : 'text.primary',
                                textDecoration: status === 'excluded' ? 'line-through' : 'none',
                                fontStyle: status === 'hidden' ? 'italic' : 'normal'
                            }}
                        >
                            {node.name}
                        </Typography>
                        {status !== 'included' && (
                            <Chip
                                size="small"
                                label={status}
                                color={status === 'excluded' ? 'error' : 'default'}
                                variant="outlined"
                                onDelete={() => handleIncludeFile(node)}
                                sx={{ ml: 1 }}
                            />
                        )}
                        {status === 'included' && (
                            <IconButton
                                size="small"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleExcludeFile(node);
                                }}
                                sx={{ opacity: 0, '&:hover': { opacity: 1 } }}
                            >
                                <BlockIcon fontSize="small" />
                            </IconButton>
                        )}
                    </Box>
                }
            >
                {node.children?.map((child) => renderTree(child))}
            </TreeItem>
        );
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
                <TreeView
                    sx={{ mt: 2 }}
                    defaultCollapseIcon={<>📂</>}
                    defaultExpandIcon={<>📁</>}
                >
                    {renderTree(structure)}
                </TreeView>
                
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