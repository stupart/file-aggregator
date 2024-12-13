
// src/components/dialogs/PromptConfigDialog/index.tsx
import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    FormControlLabel,
    Switch,
    TextField,
    Typography,
    Divider,
    IconButton,
    Tooltip,
    Alert,
    Collapse,
    Card,
    CardContent,
} from '@mui/material';
import {
    Code as CodeIcon,
    Preview as PreviewIcon,
    Psychology as PsychologyIcon,
    Assignment as AssignmentIcon,
    AccountTree as TreeIcon,
    Comment as CommentIcon,
    Help as HelpIcon,
} from '@mui/icons-material';
import { TreeView, TreeItem } from '@mui/x-tree-view';
import { ExclusionConfig, PromptConfig } from '@/types';
import { ExclusionSection } from './ExclusionSection';

interface PromptConfigDialogProps {
    open: boolean;
    onClose: () => void;
    config: PromptConfig;
    onConfigChange: (config: PromptConfig) => void;
    exclusionConfig: ExclusionConfig;
    onExclusionChange: (config: ExclusionConfig) => void;
    exclusionPresets: Array<{ id: string; name: string; config: ExclusionConfig }>;
    onSaveExclusionPreset: (name: string, config: ExclusionConfig) => void;
}


export const PromptConfigDialog: React.FC<PromptConfigDialogProps> = ({
    open,
    onClose,
    config,
    onConfigChange,
    exclusionConfig,
    onExclusionChange,
    exclusionPresets,
    onSaveExclusionPreset,
}) => {


    // Update handlers to modify the config directly
    const handleToggle = (key: keyof PromptConfig) => {
        onConfigChange({
            ...config,
            [key]: !config[key]
        });
    };

    const handleIdentityChange = (value: string) => {
        onConfigChange({
            ...config,
            identity: value
        });
    };

    const handleTaskChange = (value: string) => {
        onConfigChange({
            ...config,
            task: value
        });
    };

    const [showPreview, setShowPreview] = useState(false);

    const generatePreview = (): string => {
        let preview = '';
        
        if (config.includeIdentity && config.identity) {
            preview += `<identity>\n${config.identity}\n</identity>\n\n`;
        }
        
        if (config.includeProject) {
            preview += `<project>\n[Project context will be included]\n</project>\n\n`;
        }
        
        if (config.includeTask && config.task) {
            preview += `<task>\n${config.task}\n</task>\n\n`;
        }
        
        if (config.includeFileTree) {
            preview += `<file-tree>\n[File tree will be included]\n</file-tree>\n\n`;
        }
        
        return preview;
    };
    

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CodeIcon />
                    Prompt Configuration
                    <Tooltip title="Toggle preview">
                        <IconButton 
                            size="small" 
                            onClick={() => setShowPreview(!showPreview)}
                            sx={{ ml: 'auto' }}
                        >
                            <PreviewIcon />
                        </IconButton>
                    </Tooltip> 
                </Box>
            </DialogTitle>
            <DialogContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
                    {/* Identity Section */}
                    <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <PsychologyIcon sx={{ mr: 1 }} />
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={config.includeIdentity}
                                        onChange={() => handleToggle('includeIdentity')}
                                    />
                                }
                                label="Include Identity"
                            />
                            <Tooltip title="Define the AI assistant's persona and characteristics">
                                <IconButton size="small">
                                    <HelpIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        </Box>
                        {config.includeIdentity && (
                            <TextField
                                fullWidth
                                multiline
                                rows={3}
                                value={config.identity || ''}
                                onChange={(e) => handleIdentityChange(e.target.value)}
                                placeholder="E.g., You are an experienced software architect with expertise in..."
                                variant="outlined"
                                size="small"
                            />
                        )}
                    </Box>

                    <Divider />

                    {/* Project Section */}
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <TreeIcon sx={{ mr: 1 }} />
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={config.includeProject}
                                    onChange={() => handleToggle('includeProject')}
                                />
                            }
                            label="Include Project Context"
                        />
                        <Tooltip title="Includes tech stack, dependencies, and project structure">
                            <IconButton size="small">
                                <HelpIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    </Box>

                    <Divider />

                    {/* Task Section */}
                    <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <AssignmentIcon sx={{ mr: 1 }} />
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={config.includeTask}
                                        onChange={() => handleToggle('includeTask')}
                                    />
                                }
                                label="Include Task"
                            />
                            <Tooltip title="Define the specific task or question for the AI">
                                <IconButton size="small">
                                    <HelpIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        </Box>
                        {config.includeTask && (
                            <TextField
                                fullWidth
                                multiline
                                rows={3}
                                value={config.task || ''}
                                onChange={(e) => handleTaskChange(e.target.value)}
                                placeholder="E.g., Review this code for potential security vulnerabilities..."
                                variant="outlined"
                                size="small"
                            />
                        )}
                    </Box>

                    <Divider />

                    {/* Code Options */}
                    <Box>
                        <Typography variant="subtitle2" sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                            <CodeIcon sx={{ mr: 1 }} />
                            Code Options
                        </Typography>
                        <Box sx={{ pl: 4 }}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={config.includeFileTree}
                                        onChange={() => handleToggle('includeFileTree')}
                                    />
                                }
                                label={
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        Include File Tree
                                        <Tooltip title="Show the project's file structure">
                                            <IconButton size="small">
                                                <HelpIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    </Box>
                                }
                            />
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={config.addFileHeaders}
                                        onChange={() => handleToggle('addFileHeaders')}
                                    />
                                }
                                label={
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        Add File Headers
                                        <Tooltip title="Add file paths as comments at the top of each file">
                                            <IconButton size="small">
                                                <HelpIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    </Box>
                                }
                            />
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={config.generatePseudocode}
                                        onChange={() => handleToggle('generatePseudocode')}
                                    />
                                }
                                label={
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        Generate Pseudocode Comments
                                        <Tooltip title="Add AI-generated pseudocode comments to explain the code">
                                            <IconButton size="small">
                                                <HelpIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    </Box>
                                }
                            />
                        </Box>
                    </Box>

                    {/* Preview Section */}
                    <Collapse in={showPreview}>
                        <Card variant="outlined" sx={{ mt: 2 }}>
                            <CardContent>
                                <Typography variant="subtitle2" gutterBottom>
                                    Preview
                                </Typography>
                                <Box 
                                    component="pre"
                                    sx={{ 
                                        bgcolor: 'grey.100',
                                        p: 2,
                                        borderRadius: 1,
                                        overflow: 'auto',
                                        fontSize: '0.875rem'
                                    }}
                                >
                                    {generatePreview()}
                                </Box>
                            </CardContent>
                        </Card>
                    </Collapse>
                    
                    <Divider />

                    {/* Exclusion Section */}
                    <ExclusionSection
                        config={exclusionConfig}
                        onConfigChange={onExclusionChange}
                        presets={exclusionPresets}
                        onSavePreset={onSaveExclusionPreset}
                    />
                </Box>
                
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Close</Button>
            </DialogActions>
        </Dialog>
    );
};
