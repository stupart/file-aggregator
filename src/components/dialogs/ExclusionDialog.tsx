// src/components/dialogs/ExclusionDialog.tsx
import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    Typography,
    TextField,
    Chip
} from '@mui/material';
import { ExclusionConfig } from '../../types';

interface ExclusionDialogProps {
    open: boolean;
    onClose: () => void;
    exclusionConfig: ExclusionConfig;
    onExclusionChange: (config: ExclusionConfig) => void;
}

export const ExclusionDialog: React.FC<ExclusionDialogProps> = ({
    open,
    onClose,
    exclusionConfig,
    onExclusionChange
}) => {
    const [newExclusion, setNewExclusion] = React.useState('');

    const handleRemoveGlobalExclusion = (type: 'files' | 'folders', index: number) => {
        const newConfig = { ...exclusionConfig };
        newConfig.global[type] = newConfig.global[type].filter((_, i) => i !== index);
        onExclusionChange(newConfig);
    };
    
    const handleRemoveSessionExclusion = (type: 'files' | 'folders', index: number) => {
        const newConfig = { ...exclusionConfig };
        newConfig.session[type] = newConfig.session[type].filter((_, i) => i !== index);
        onExclusionChange(newConfig);
    };
    
    const handleRemoveBehavior = (type: keyof ExclusionConfig['behaviors'], index: number) => {
        const newConfig = { ...exclusionConfig };
        newConfig.behaviors[type] = newConfig.behaviors[type].filter((_, i) => i !== index);
        onExclusionChange(newConfig);
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
        
        onExclusionChange(newConfig);
        setNewExclusion('');
    };

    return (
        <Dialog open={open} onClose={onClose}>
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
                <Button onClick={onClose}>Close</Button>
            </DialogActions>
        </Dialog>
    );
};