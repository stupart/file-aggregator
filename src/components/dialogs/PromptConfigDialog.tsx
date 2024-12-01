// src/components/dialogs/PromptConfigDialog.tsx
import React from 'react';
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
    Divider
} from '@mui/material';
import { PromptConfig } from '../../types';

interface PromptConfigDialogProps {
    open: boolean;
    onClose: () => void;
    config: PromptConfig;
    onConfigChange: (config: PromptConfig) => void;
    identity: string;
    onIdentityChange: (identity: string) => void;
    task: string;
    onTaskChange: (task: string) => void;
}

export const PromptConfigDialog: React.FC<PromptConfigDialogProps> = ({
    open,
    onClose,
    config,
    onConfigChange,
    identity,
    onIdentityChange,
    task,
    onTaskChange
}) => {
    const handleToggle = (key: keyof PromptConfig) => {
        onConfigChange({
            ...config,
            [key]: !config[key]
        });
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>Prompt Configuration</DialogTitle>
            <DialogContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
                    {/* Identity Section */}
                    <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={config.includeIdentity}
                                        onChange={() => handleToggle('includeIdentity')}
                                    />
                                }
                                label="Include Identity"
                            />
                        </Box>
                        {config.includeIdentity && (
                            <TextField
                                fullWidth
                                multiline
                                rows={3}
                                value={identity}
                                onChange={(e) => onIdentityChange(e.target.value)}
                                placeholder="Enter AI assistant identity/persona..."
                                variant="outlined"
                                size="small"
                            />
                        )}
                    </Box>

                    <Divider />

                    {/* Project Section */}
                    <FormControlLabel
                        control={
                            <Switch
                                checked={config.includeProject}
                                onChange={() => handleToggle('includeProject')}
                            />
                        }
                        label="Include Project Context"
                    />

                    <Divider />

                    {/* Task Section */}
                    <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={config.includeTask}
                                        onChange={() => handleToggle('includeTask')}
                                    />
                                }
                                label="Include Task"
                            />
                        </Box>
                        {config.includeTask && (
                            <TextField
                                fullWidth
                                multiline
                                rows={3}
                                value={task}
                                onChange={(e) => onTaskChange(e.target.value)}
                                placeholder="Enter the task or question for the AI..."
                                variant="outlined"
                                size="small"
                            />
                        )}
                    </Box>

                    <Divider />

                    {/* File Tree and Code Options */}
                    <Box>
                        <Typography variant="subtitle2" sx={{ mb: 1 }}>
                            Code Options
                        </Typography>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={config.includeFileTree}
                                    onChange={() => handleToggle('includeFileTree')}
                                />
                            }
                            label="Include File Tree"
                        />
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={config.addFileHeaders}
                                    onChange={() => handleToggle('addFileHeaders')}
                                />
                            }
                            label="Add File Headers"
                        />
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={config.generatePseudocode}
                                    onChange={() => handleToggle('generatePseudocode')}
                                />
                            }
                            label="Generate Pseudocode Comments"
                        />
                    </Box>
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Close</Button>
            </DialogActions>
        </Dialog>
    );
};