// src/components/FileTree/FileTreeItem.tsx
import React, { useMemo } from 'react';
import { TreeItem } from '@mui/x-tree-view';
import { 
    Checkbox, 
    IconButton, 
    Typography, 
    Box, 
    Chip,
    Tooltip,
    CircularProgress 
} from '@mui/material';
import BlockIcon from '@mui/icons-material/Block';
import FolderIcon from '@mui/icons-material/Folder';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import ImageIcon from '@mui/icons-material/Image';  // Fixed import
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
}

export const FileTreeItem: React.FC<FileTreeItemProps> = React.memo(({
    node,
    selectedFiles,
    loadingFiles,
    exclusionConfig,
    level = 0,
    onCheckboxChange,
    onExclude,
    onInclude
}) => {
    // Add isImage check
    const isImage = useMemo(() => isImageFile(node.name), [node.name]);

    // Modify status computation to always treat images as excluded
    const status = useMemo(() => {
        if (isImage || 
            exclusionConfig.global.files.includes(node.name) ||
            exclusionConfig.global.folders.includes(node.name)) {
            return 'excluded';
        }
        if (exclusionConfig.behaviors.hideContents.includes(node.name)) {
            return 'hidden';
        }
        return 'included';
    }, [node.name, exclusionConfig, isImage]);

    // Compute checkbox state
    const { isChecked, isIndeterminate } = useMemo(() => {
        const checked = selectedFiles.has(node.path);
        const hasCheckedChildren = node.children?.some(child => 
            selectedFiles.has(child.path) || 
            child.children?.some(grandChild => selectedFiles.has(grandChild.path))
        );
        return {
            isChecked: checked,
            isIndeterminate: !checked && hasCheckedChildren
        };
    }, [node, selectedFiles]);

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

    // Render node label
    const renderLabel = () => (
        <Box 
            sx={{ 
                display: 'flex',
                alignItems: 'center',
                ml: level * 2,
                mr: 2, // Add right margin
                width: 'calc(100% - 100px)', // Reserve space for right-side elements
            }}
        >
            {/* Left side */}
            <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1,
                overflow: 'hidden', // Hide overflow
                flex: 1,
            }}>
                {status === 'included' && (
                    <Checkbox
                        checked={isChecked}
                        indeterminate={isIndeterminate}
                        onChange={(e) => {
                            e.stopPropagation();
                            onCheckboxChange(node, e.target.checked);
                        }}
                        size="small"
                        sx={{ 
                            padding: '4px',
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
    
            {/* Right side - fixed width */}
            <Box sx={{ 
                width: '100px', // Fixed width for actions
                display: 'flex',
                justifyContent: 'flex-end',
                position: 'absolute',
                right: 8,
            }}>
                {status !== 'included' && !isImage && (
                    <Chip
                        size="small"
                        label={status}
                        color={status === 'excluded' ? 'error' : 'default'}
                        variant="outlined"
                        onClick={(e) => e.stopPropagation()}
                        onDelete={(e) => {
                            e.stopPropagation();
                            onInclude(node);
                        }}
                        sx={{ height: 20 }}
                    />
                )}
    
                {status === 'included' && !isImage && (
                    <IconButton
                        size="small"
                        onClick={(e) => {
                            e.stopPropagation();
                            onExclude(node);
                        }}
                        sx={{ 
                            padding: '2px',
                        }}
                    >
                        <BlockIcon fontSize="small" />
                    </IconButton>
                )}
    
                {isImage && (
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
                    cursor: node.isDirectory ? 'pointer' : 'default'
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
                />
            ))}
        </TreeItem>
    );
});