// src/components/FileTree/FileTreeItem.tsx
import React, { useMemo } from 'react';
import { TreeItem } from '@mui/x-tree-view';
import { 
    Checkbox, 
    IconButton, 
    Typography, 
    Box, 
    Chip,
    Tooltip
} from '@mui/material';
import BlockIcon from '@mui/icons-material/Block';
import FolderIcon from '@mui/icons-material/Folder';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import ImageIcon from '@mui/icons-material/Image';
import { FileNode, ExclusionConfig } from '../../types';
import { isImageFile } from '../../utils/fileUtils';

interface FileTreeItemProps {
    node: FileNode;
    selectedFiles: Set<string>;
    loadingFiles: Set<string>;
    exclusionConfig: ExclusionConfig;
    level?: number;
    onCheckboxChange: (node: FileNode, checked: boolean) => void;
    onExclude: (node: FileNode) => void;
    onInclude: (node: FileNode) => void;
    isNodeExcluded: (node: FileNode) => boolean;  // Add this prop
}

export const FileTreeItem: React.FC<FileTreeItemProps> = React.memo(({
    node,
    selectedFiles,
    loadingFiles,
    exclusionConfig,
    level = 0,
    onCheckboxChange,
    onExclude,
    onInclude,
    isNodeExcluded
}) => {
    // Compute node status
    const status = useMemo(() => {
        if (isNodeExcluded(node)) {
            return 'excluded';
        }
        if (exclusionConfig.behaviors.hideContents.includes(node.name)) {
            return 'hidden';
        }
        return 'included';
    }, [node, exclusionConfig, isNodeExcluded]);

    // Compute checkbox state considering parent exclusions
    const { isChecked, isIndeterminate, isDisabled } = useMemo(() => {
        const checked = selectedFiles.has(node.path);
        const hasCheckedChildren = node.children?.some(child => 
            selectedFiles.has(child.path) || 
            child.children?.some(grandChild => selectedFiles.has(grandChild.path))
        );
        
        return {
            isChecked: checked,
            isIndeterminate: !checked && hasCheckedChildren,
            isDisabled: status === 'excluded' || isImageFile(node.name)
        };
    }, [node, selectedFiles, status]);

    const isLoading = loadingFiles.has(node.path);

    const renderIcon = () => {
        if (node.isDirectory) {
            return <FolderIcon fontSize="small" sx={{ color: 'action.active' }} />;
        }
        if (isImageFile(node.name)) {
            return <ImageIcon fontSize="small" sx={{ color: 'info.main' }} />;
        }
        return <InsertDriveFileIcon fontSize="small" sx={{ color: 'action.active' }} />;
    };

    const renderLabel = () => (
        <Box 
            sx={{ 
                display: 'flex',
                alignItems: 'center',
                ml: level * 2,
                mr: 2,
                width: 'calc(100% - 100px)',
            }}
        >
            {/* Left side */}
            <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1,
                overflow: 'hidden',
                flex: 1,
            }}>
                {status !== 'excluded' && (
                    <Checkbox
                        checked={isChecked}
                        indeterminate={isIndeterminate}
                        onChange={(e) => {
                            e.stopPropagation();
                            onCheckboxChange(node, e.target.checked);
                        }}
                        disabled={isDisabled}
                        size="small"
                        sx={{ 
                            padding: '4px',
                            visibility: isDisabled ? 'hidden' : 'visible'
                        }}
                    />
                )}
                {renderIcon()}
                <Typography 
                    variant="body2"
                    noWrap
                    sx={{ 
                        color: status === 'excluded' ? 'text.disabled' : 'text.primary',
                        textDecoration: status === 'excluded' ? 'line-through' : 'none',
                        fontStyle: status === 'hidden' ? 'italic' : 'normal',
                    }}
                >
                    {node.name}
                </Typography>
            </Box>

            {/* Right side */}
            <Box sx={{ 
                width: '100px',
                display: 'flex',
                justifyContent: 'flex-end',
                position: 'absolute',
                right: 8,
            }}>
                {status !== 'included' && !isImageFile(node.name) && (
                    <Tooltip title="Click to include">
                        <Chip
                            size="small"
                            label={status}
                            color={status === 'excluded' ? 'error' : 'default'}
                            variant="outlined"
                            onClick={(e) => {
                                e.stopPropagation();
                                onInclude(node);
                            }}
                            sx={{ height: 20 }}
                        />
                    </Tooltip>
                )}

                {status === 'included' && !isImageFile(node.name) && (
                    <Tooltip title="Exclude from tree">
                        <IconButton
                            size="small"
                            onClick={(e) => {
                                e.stopPropagation();
                                onExclude(node);
                            }}
                            sx={{ padding: '2px' }}
                        >
                            <BlockIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                )}

                {isImageFile(node.name) && (
                    <Chip
                        size="small"
                        label="Image"
                        color="default"
                        variant="outlined"
                        sx={{ 
                            height: 20,
                            backgroundColor: 'background.paper',
                            borderColor: 'info.main',
                            color: 'info.main'
                        }}
                    />
                )}
            </Box>
        </Box>
    );

    return (
        <TreeItem
            nodeId={node.path}
            label={renderLabel()}
            sx={{
                '& .MuiTreeItem-content': {
                    padding: '2px 0',
                    cursor: node.isDirectory ? 'pointer' : 'default',
                    opacity: status === 'excluded' ? 0.6 : 1
                }
            }}
        >
            {node.children?.map((child) => (
                <FileTreeItem
                    key={child.path}
                    node={child}
                    selectedFiles={selectedFiles}
                    loadingFiles={loadingFiles}
                    exclusionConfig={exclusionConfig}
                    level={(level || 0) + 1}
                    onCheckboxChange={onCheckboxChange}
                    onExclude={onExclude}
                    onInclude={onInclude}
                    isNodeExcluded={isNodeExcluded}
                />
            ))}
        </TreeItem>
    );
});