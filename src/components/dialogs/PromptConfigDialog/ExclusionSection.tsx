// src/components/dialogs/PromptConfigDialog/ExclusionSection.tsx
import React from 'react';
import {
    Box,
    Typography,
    Chip,
    IconButton,
    TextField,
    Button,
    Tooltip,
    Menu,
    MenuItem,
} from '@mui/material';
import {
    ExpandMore as ExpandMoreIcon,
    ChevronRight as ChevronRightIcon,
    Add as AddIcon,
    Delete as DeleteIcon,
    Save as SaveIcon,
} from '@mui/icons-material';
import { TreeView, TreeItem } from '@mui/x-tree-view'; 
import { ExclusionConfig } from '../../../types';

interface ExclusionTreeItemProps {
    nodeId: string;
    label: string;
    onDelete?: () => void;
    children?: React.ReactNode;
}

const ExclusionTreeItem: React.FC<ExclusionTreeItemProps> = ({
    nodeId,
    label,
    onDelete,
    children
}) => (
    <TreeItem
        nodeId={nodeId}
        label={
            <Box sx={{ display: 'flex', alignItems: 'center', py: 0.5 }}>
                <Typography variant="body2">{label}</Typography>
                {onDelete && (
                    <IconButton size="small" onClick={onDelete} sx={{ ml: 1 }}>
                        <DeleteIcon fontSize="small" />
                    </IconButton>
                )}
            </Box>
        }
    >
        {children}
    </TreeItem>
);

interface ExclusionSectionProps {
    config: ExclusionConfig;
    onConfigChange: (config: ExclusionConfig) => void;
    presets: Array<{ id: string; name: string; config: ExclusionConfig }>;
    onSavePreset: (name: string, config: ExclusionConfig) => void;
}

export const ExclusionSection: React.FC<ExclusionSectionProps> = ({
    config,
    onConfigChange,
    presets,
    onSavePreset
}) => {
    const [newExclusion, setNewExclusion] = React.useState('');
    const [newPresetName, setNewPresetName] = React.useState('');
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

    const handleAddExclusion = (type: 'files' | 'folders', category: 'global' | 'session') => {
        if (!newExclusion) return;

        const newConfig = { ...config };
        newConfig[category][type] = [...newConfig[category][type], newExclusion];
        onConfigChange(newConfig);
        setNewExclusion('');
    };

    const handleRemoveExclusion = (
        type: 'files' | 'folders',
        category: 'global' | 'session',
        index: number
    ) => {
        const newConfig = { ...config };
        newConfig[category][type] = newConfig[category][type].filter((_, i) => i !== index);
        onConfigChange(newConfig);
    };

    const handlePresetSelect = (presetConfig: ExclusionConfig) => {
        onConfigChange(presetConfig);
        setAnchorEl(null);
    };

    return (
        <Box sx={{ mt: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle1">Exclusion Settings</Typography>
                <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
                    <Button
                        size="small"
                        startIcon={<SaveIcon />}
                        onClick={(e) => setAnchorEl(e.currentTarget)}
                    >
                        Presets
                    </Button>
                </Box>
            </Box>

            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={() => setAnchorEl(null)}
            >
                {presets.map((preset) => (
                    <MenuItem 
                        key={preset.id}
                        onClick={() => handlePresetSelect(preset.config)}
                    >
                        {preset.name}
                    </MenuItem>
                ))}
                <MenuItem>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <TextField
                            size="small"
                            placeholder="New preset name"
                            value={newPresetName}
                            onChange={(e) => setNewPresetName(e.target.value)}
                        />
                        <Button
                            size="small"
                            startIcon={<SaveIcon />}
                            onClick={() => {
                                if (newPresetName) {
                                    onSavePreset(newPresetName, config);
                                    setNewPresetName('');
                                    setAnchorEl(null);
                                }
                            }}
                        >
                            Save
                        </Button>
                    </Box>
                </MenuItem>
            </Menu>

            <TreeView
                defaultCollapseIcon={<ExpandMoreIcon />}
                defaultExpandIcon={<ChevronRightIcon />}
                sx={{ 
                    border: 1, 
                    borderColor: 'divider',
                    borderRadius: 1,
                    p: 2
                }}
            >
                <ExclusionTreeItem nodeId="global" label="Global Exclusions">
                    <ExclusionTreeItem nodeId="global-files" label="Files">
                        <Box sx={{ pl: 2, py: 1 }}>
                            {config.global.files.map((file, index) => (
                                <Chip
                                    key={file}
                                    label={file}
                                    size="small"
                                    onDelete={() => handleRemoveExclusion('files', 'global', index)}
                                    sx={{ m: 0.5 }}
                                />
                            ))}
                            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                                <TextField
                                    size="small"
                                    placeholder="Add file pattern (e.g., *.log)"
                                    value={newExclusion}
                                    onChange={(e) => setNewExclusion(e.target.value)}
                                />
                                <Button
                                    size="small"
                                    startIcon={<AddIcon />}
                                    onClick={() => handleAddExclusion('files', 'global')}
                                >
                                    Add
                                </Button>
                            </Box>
                        </Box>
                    </ExclusionTreeItem>
                    
                    <ExclusionTreeItem nodeId="global-folders" label="Folders">
                        <Box sx={{ pl: 2, py: 1 }}>
                            {config.global.folders.map((folder, index) => (
                                <Chip
                                    key={folder}
                                    label={`${folder}/`}
                                    size="small"
                                    onDelete={() => handleRemoveExclusion('folders', 'global', index)}
                                    sx={{ m: 0.5 }}
                                />
                            ))}
                            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                                <TextField
                                    size="small"
                                    placeholder="Add folder name"
                                    value={newExclusion}
                                    onChange={(e) => setNewExclusion(e.target.value)}
                                />
                                <Button
                                    size="small"
                                    startIcon={<AddIcon />}
                                    onClick={() => handleAddExclusion('folders', 'global')}
                                >
                                    Add
                                </Button>
                            </Box>
                        </Box>
                    </ExclusionTreeItem>
                </ExclusionTreeItem>

                <ExclusionTreeItem nodeId="behaviors" label="Folder Behaviors">
                    <Box sx={{ pl: 2, py: 1 }}>
                        {config.behaviors.hideContents.map((folder, index) => (
                            <Chip
                                key={folder}
                                label={`${folder} (contents hidden)`}
                                size="small"
                                onDelete={() => {
                                    const newConfig = { ...config };
                                    newConfig.behaviors.hideContents = 
                                        newConfig.behaviors.hideContents.filter((_, i) => i !== index);
                                    onConfigChange(newConfig);
                                }}
                                sx={{ m: 0.5 }}
                            />
                        ))}
                    </Box>
                </ExclusionTreeItem>
            </TreeView>
        </Box>
    );
};