// src/components/FileTree/FileTreeView.tsx
import React from 'react';
import { TreeView } from '@mui/x-tree-view';
import FolderIcon from '@mui/icons-material/Folder';  
import { FileTreeItem } from './FileTreeItem';
import { useFileTree } from './useFileTree';
import { FileNode, ExclusionConfig } from '../../types';

interface FileTreeViewProps {
    structure: FileNode | null;
    exclusionConfig: ExclusionConfig;
    onSelectionChange: (selected: Set<string>) => void;
    onExclusionChange: (config: ExclusionConfig) => void;  // Add this prop
}

export const FileTreeView: React.FC<FileTreeViewProps> = ({
    structure,
    exclusionConfig,
    onSelectionChange,
    onExclusionChange,
}) => {
    const {
        selectedFiles,
        loadingFiles,
        handleCheckboxChange,
        setLoading,
    } = useFileTree({
        exclusionConfig,
        onSelectionChange
    });

    const handleExclude = (node: FileNode) => {
        const newConfig = { ...exclusionConfig };
        if (node.isDirectory) {
            newConfig.global.folders = [...newConfig.global.folders, node.name];
        } else {
            newConfig.global.files = [...newConfig.global.files, node.name];
        }
        onExclusionChange(newConfig);

        // Remove from selected files if it was selected
        if (selectedFiles.has(node.path)) {
            const newSelected = new Set(selectedFiles);
            newSelected.delete(node.path);
            onSelectionChange(newSelected);
        }
    };

    const handleInclude = (node: FileNode) => {
        const newConfig = { ...exclusionConfig };
        if (node.isDirectory) {
            newConfig.global.folders = newConfig.global.folders.filter(
                f => f !== node.name
            );
        } else {
            newConfig.global.files = newConfig.global.files.filter(
                f => f !== node.name
            );
        }
        // Also remove from hideContents if it's there
        newConfig.behaviors.hideContents = newConfig.behaviors.hideContents.filter(
            f => f !== node.name
        );
        onExclusionChange(newConfig);
    };

    if (!structure) return null;

    return (
        <TreeView
            // Remove emoji icons
            sx={{
                // Add some spacing and hover effects
                '& .MuiTreeItem-root': {
                    '&:hover': {
                        '& > .MuiTreeItem-content': {
                            backgroundColor: 'action.hover',
                        }
                    }
                },
                // Improve click target size
                '& .MuiTreeItem-content': {
                    padding: '4px 0',
                    borderRadius: 1,
                }
            }}
        >
            <FileTreeItem
                node={structure}
                selectedFiles={selectedFiles}
                loadingFiles={loadingFiles}
                exclusionConfig={exclusionConfig}
                onCheckboxChange={handleCheckboxChange}
                onExclude={handleExclude}
                onInclude={handleInclude}
            />
        </TreeView>
    );
};