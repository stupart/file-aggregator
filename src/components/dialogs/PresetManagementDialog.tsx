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