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
} from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import EditIcon from '@mui/icons-material/Edit';
import { TreeView, TreeItem } from '@mui/x-tree-view';
import { FileNode, ExclusionConfig } from './types';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

const DEFAULT_EXCLUSION_CONFIG: ExclusionConfig = {
    paths: ['package-lock.json'],
    patterns: ['*.log', '.DS_Store'],
    autoExcludeContents: ['node_modules', 'build', 'dist']
};

const App: React.FC = () => {
    const [structure, setStructure] = useState<FileNode | null>(null);
    const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
    const [projectRoot, setProjectRoot] = useState<string>('');
    const [exclusionConfig, setExclusionConfig] = useState<ExclusionConfig>(DEFAULT_EXCLUSION_CONFIG);
    const [configDialogOpen, setConfigDialogOpen] = useState(false);
    const [newExclusion, setNewExclusion] = useState('');
    const [loadingFiles, setLoadingFiles] = useState<Set<string>>(new Set());
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [generatedContent, setGeneratedContent] = useState<string>('');


    useEffect(() => {
        loadConfig();
    }, []);

    const loadConfig = async () => {
        try {
            const config = await window.electronAPI.loadConfig();
            setExclusionConfig(config);
        } catch (error) {
            setExclusionConfig(DEFAULT_EXCLUSION_CONFIG);
        }
    };

    const saveConfig = async (config: ExclusionConfig) => {
        await window.electronAPI.saveConfig(config);
        setExclusionConfig(config);
    };

    // Get relative path from project root
    const getRelativePath = (fullPath: string) => {
        return fullPath.replace(projectRoot, '').replace(/^\//, '');
    };

    // Recursive function to get all descendant paths
    const getAllDescendantPaths = (node: FileNode): string[] => {
        let paths: string[] = [node.path];
        if (node.children) {
            node.children.forEach(child => {
                paths = [...paths, ...getAllDescendantPaths(child)];
            });
        }
        return paths;
    };

    const handleCheckboxChange = (node: FileNode, checked: boolean) => {
        const newSelected = new Set(selectedFiles);
        const affectedPaths = getAllDescendantPaths(node);

        affectedPaths.forEach(path => {
            // Don't auto-select excluded files when selecting a parent
            const shouldExclude = exclusionConfig.paths.includes(node.name) ||
                                exclusionConfig.patterns.some(pattern => 
                                    new RegExp('^' + pattern.replace('*', '.*') + '$').test(node.name));
            
            if (checked) {
                if (node.path === path || !shouldExclude) {
                    newSelected.add(path);
                }
            } else {
                newSelected.delete(path);
            }
        });

        setSelectedFiles(newSelected);
    };

    const handleFolderSelect = async () => {
        const folderPath = await window.electronAPI.selectFolder();
        if (folderPath) {
            setProjectRoot(folderPath);
            const fileStructure = await window.electronAPI.scanDirectory(folderPath);
            setStructure(fileStructure);
        }
    };

    const getAllSelectedNodes = (node: FileNode): FileNode[] => {
        let selected: FileNode[] = [];
        if (selectedFiles.has(node.path)) {
            selected.push(node);
        }
        if (node.children) {
            node.children.forEach(child => {
                selected = [...selected, ...getAllSelectedNodes(child)];
            });
        }
        return selected;
    };

    const handleExport = async () => {
        if (!structure) return;
        
        try {
            setLoadingFiles(new Set(selectedFiles)); // Start loading state
            const selectedNodes = getAllSelectedNodes(structure);
            const content = await aggregateContent(selectedNodes);
            setGeneratedContent(content); // Store the generated content
            
            const savedPath = await window.electronAPI.exportFiles(content, projectRoot.split('/').pop() || 'export');
            
            if (savedPath) {
                showSnackbar(`File saved successfully to ${savedPath}`);
            }
        } catch (error) {
            console.error('Export failed:', error);
            showSnackbar('Failed to export files. Please try again.');
        } finally {
            setLoadingFiles(new Set()); // Clear loading state
        }
    };

    const handleCopyToClipboard = async () => {
        if (!generatedContent) {
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

    const showSnackbar = (message: string) => {
        setSnackbarMessage(message);
        setSnackbarOpen(true);
    };


    const aggregateContent = async (nodes: FileNode[]): Promise<string> => {
        const projectName = projectRoot.split('/').pop() || 'project';
        let output = `<${projectName}>\n\n`;
        
        // Add directory structure
        output += "<file-tree>\n";
        const addStructure = (node: FileNode, depth: number = 0) => {
            const relativePath = getRelativePath(node.path);
            output += `${' '.repeat(depth)}${relativePath}${node.isDirectory ? '/' : ''}\n`;
            if (node.children) {
                node.children.forEach(child => addStructure(child, depth + 2));
            }
        };
        
        if (structure) {
            addStructure(structure);
        }
        output += "</file-tree>\n\n";
        
        // Add file contents
        for (const node of nodes) {
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

    const renderExclusionDialog = () => (
        <Dialog open={configDialogOpen} onClose={() => setConfigDialogOpen(false)}>
            <DialogTitle>Exclusion Settings</DialogTitle>
            <DialogContent>
                <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle1">Excluded Files/Paths</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {exclusionConfig.paths.map((path, index) => (
                            <Chip
                                key={path}
                                label={path}
                                onDelete={() => {
                                    const newConfig = {...exclusionConfig};
                                    newConfig.paths = newConfig.paths.filter((_, i) => i !== index);
                                    saveConfig(newConfig);
                                }}
                            />
                        ))}
                    </Box>
                </Box>

                <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle1">Excluded Patterns</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {exclusionConfig.patterns.map((pattern, index) => (
                            <Chip
                                key={pattern}
                                label={pattern}
                                onDelete={() => {
                                    const newConfig = {...exclusionConfig};
                                    newConfig.patterns = newConfig.patterns.filter((_, i) => i !== index);
                                    saveConfig(newConfig);
                                }}
                            />
                        ))}
                    </Box>
                </Box>

                <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle1">Auto-Exclude Contents</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {exclusionConfig.autoExcludeContents.map((folder, index) => (
                            <Chip
                                key={folder}
                                label={folder}
                                onDelete={() => {
                                    const newConfig = {...exclusionConfig};
                                    newConfig.autoExcludeContents = newConfig.autoExcludeContents.filter((_, i) => i !== index);
                                    saveConfig(newConfig);
                                }}
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
                        onClick={() => {
                            if (newExclusion) {
                                const newConfig = {...exclusionConfig};
                                if (newExclusion.includes('*')) {
                                    newConfig.patterns.push(newExclusion);
                                } else if (newExclusion.endsWith('/')) {
                                    newConfig.autoExcludeContents.push(newExclusion.slice(0, -1));
                                } else {
                                    newConfig.paths.push(newExclusion);
                                }
                                saveConfig(newConfig);
                                setNewExclusion('');
                            }
                        }}
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


    const renderTree = (node: FileNode) => {
        const isChecked = selectedFiles.has(node.path);
        const hasCheckedChildren = node.children?.some(child => 
            selectedFiles.has(child.path) || 
            (child.children && child.children.some(grandChild => selectedFiles.has(grandChild.path)))
        );
        const isLoading = loadingFiles.has(node.path);

        const isExcluded = exclusionConfig.paths.includes(node.name) ||
                          exclusionConfig.patterns.some(pattern => 
                              new RegExp('^' + pattern.replace('*', '.*') + '$').test(node.name));

        return (
            <TreeItem
                key={node.path}
                nodeId={node.path}
                label={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box sx={{ position: 'relative' }}>
                            <Checkbox
                                checked={isChecked}
                                indeterminate={!isChecked && hasCheckedChildren}
                                onChange={(e) => handleCheckboxChange(node, e.target.checked)}
                                onClick={(e) => e.stopPropagation()}
                                sx={{ 
                                    '& .MuiCheckbox-root': {
                                        transition: 'none'
                                    },
                                    visibility: isLoading ? 'hidden' : 'visible'
                                }}
                            />
                            {isLoading && (
                                <CircularProgress
                                    size={20}
                                    sx={{
                                        position: 'absolute',
                                        top: '50%',
                                        left: '50%',
                                        marginTop: '-10px',
                                        marginLeft: '-10px'
                                    }}
                                />
                            )}
                        </Box>
                        <Typography 
                            sx={{ 
                                color: isExcluded ? 'text.disabled' : 'text.primary',
                                textDecoration: isExcluded ? 'line-through' : 'none'
                            }}
                        >
                            {node.name}
                            {exclusionConfig.autoExcludeContents.includes(node.name) && 
                                " (contents hidden)"}
                        </Typography>
                    </Box>
                }
            >
                {node.children?.map((child) => renderTree(child))}
            </TreeItem>
        );
    };

    return (
        <Box sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Button variant="contained" onClick={handleFolderSelect}>
                    Select Folder
                </Button>
                <IconButton onClick={() => setConfigDialogOpen(true)}>
                    <SettingsIcon />
                </IconButton>
            </Box>
            
            {structure && (
                <>
                    <TreeView
                        sx={{ mt: 2 }}
                        defaultCollapseIcon={<>📂</>}
                        defaultExpandIcon={<>📁</>}
                    >
                        {renderTree(structure)}
                    </TreeView>
                    
                    <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                        <Button 
                            variant="contained" 
                            onClick={handleExport}
                            disabled={selectedFiles.size === 0}
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
                    </Box>
                </>
            )}

            {renderExclusionDialog()}
            
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