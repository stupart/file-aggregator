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