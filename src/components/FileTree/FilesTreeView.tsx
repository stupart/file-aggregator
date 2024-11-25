// src/components/FileTree/FilesTreeView.tsx
import React from 'react';
import { TreeView } from '@mui/x-tree-view';
import { FileTreeItem } from './FileTreeItem';
import { useFileTree } from './useFileTree';
import { FileNode, ExclusionConfig } from '../../types';

interface FileTreeViewProps {
    structure: FileNode | null;
    exclusionConfig: ExclusionConfig;
    onSelectionChange: (selected: Set<string>) => void;
    onExclusionChange: (config: ExclusionConfig) => void;
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
        isNodeExcluded,
        setLoadingFile
    } = useFileTree({
        exclusionConfig,
        onSelectionChange
    });

    const handleExclude = (node: FileNode) => {
        const newConfig = { ...exclusionConfig };
        
        // Add to appropriate exclusion list
        if (node.isDirectory) {
            newConfig.global.folders = Array.from(new Set([
                ...newConfig.global.folders,
                node.name
            ]));
        } else {
            newConfig.global.files = Array.from(new Set([
                ...newConfig.global.files,
                node.name
            ]));
        }

        // Remove any selected files that are now excluded
        const removeExcludedSelections = (currentNode: FileNode) => {
            const newSelectedFiles = new Set(Array.from(selectedFiles));
            if (newSelectedFiles.has(currentNode.path)) {
                newSelectedFiles.delete(currentNode.path);
            }
            currentNode.children?.forEach(child => removeExcludedSelections(child));
            return newSelectedFiles;
        };

        const updatedSelectedFiles = removeExcludedSelections(node);
        
        onExclusionChange(newConfig);
        onSelectionChange(updatedSelectedFiles);
    };

    const handleInclude = (node: FileNode) => {
        const newConfig = { ...exclusionConfig };
        
        // Remove from all exclusion lists
        if (node.isDirectory) {
            newConfig.global.folders = newConfig.global.folders.filter(
                f => f !== node.name
            );
        } else {
            newConfig.global.files = newConfig.global.files.filter(
                f => f !== node.name
            );
        }
        
        // Also remove from hideContents if present
        newConfig.behaviors.hideContents = newConfig.behaviors.hideContents.filter(
            f => f !== node.name
        );

        onExclusionChange(newConfig);
    };

    // Helper to check if a node should be visible
    const isNodeVisible = (node: FileNode): boolean => {
        const pathParts = node.path.split('/');
        // Check if any parent folder is in hideContents
        for (let i = 0; i < pathParts.length - 1; i++) {
            if (exclusionConfig.behaviors.hideContents.includes(pathParts[i])) {
                return false;
            }
        }
        return true;
    };

    if (!structure) return null;

    return (
        <TreeView
            sx={{
                '& .MuiTreeItem-root': {
                    '&:hover': {
                        '& > .MuiTreeItem-content': {
                            backgroundColor: 'action.hover',
                        }
                    }
                },
                '& .MuiTreeItem-content': {
                    padding: '4px 0',
                    borderRadius: 1,
                }
            }}
        >
            {isNodeVisible(structure) && (
                <FileTreeItem
                    node={structure}
                    selectedFiles={selectedFiles}
                    loadingFiles={loadingFiles}
                    exclusionConfig={exclusionConfig}
                    onCheckboxChange={handleCheckboxChange}
                    onExclude={handleExclude}
                    onInclude={handleInclude}
                    isNodeExcluded={isNodeExcluded}
                />
            )}
        </TreeView>
    );
};