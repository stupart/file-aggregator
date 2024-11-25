// src/components/FileTree/useFileTree.ts
import { useState, useCallback, useEffect } from 'react';
import { FileNode, ExclusionConfig } from '../../types';

interface UseFileTreeProps {
    initialSelected?: Set<string>;
    exclusionConfig: ExclusionConfig;
    onSelectionChange?: (selected: Set<string>) => void;
}

export const useFileTree = ({
    initialSelected = new Set(),
    exclusionConfig,
    onSelectionChange
}: UseFileTreeProps) => {
    const [selectedFiles, setSelectedFiles] = useState<Set<string>>(initialSelected);
    const [loadingFiles, setLoadingFiles] = useState<Set<string>>(new Set());

    // Check if a node or any of its ancestors are excluded
    const isNodeExcluded = useCallback((node: FileNode): boolean => {
        // First check if the node itself is excluded
        if (exclusionConfig.global.files.includes(node.name) ||
            exclusionConfig.global.folders.includes(node.name)) {
            return true;
        }

        // Check if any parent folder in the path is excluded
        const pathParts = node.path.split('/');
        for (let i = 0; i < pathParts.length; i++) {
            if (exclusionConfig.global.folders.includes(pathParts[i])) {
                return true;
            }
        }

        return false;
    }, [exclusionConfig]);

    // Get all selectable descendant paths
    const getSelectableDescendants = useCallback((node: FileNode): string[] => {
        // If this node is excluded, none of its descendants are selectable
        if (isNodeExcluded(node)) {
            return [];
        }
        
        let paths: string[] = [node.path];
        
        if (node.children && !exclusionConfig.behaviors.hideContents.includes(node.name)) {
            node.children.forEach(child => {
                // Only add descendants if they're not excluded
                if (!isNodeExcluded(child)) {
                    paths = [...paths, ...getSelectableDescendants(child)];
                }
            });
        }
        
        return paths;
    }, [exclusionConfig, isNodeExcluded]);

    const handleCheckboxChange = useCallback((node: FileNode, checked: boolean) => {
        // If the node is excluded, don't allow selection
        if (isNodeExcluded(node)) {
            return;
        }

        setSelectedFiles(prev => {
            const newSelected = new Set(prev);
            const affectedPaths = getSelectableDescendants(node);

            affectedPaths.forEach(path => {
                if (checked) {
                    newSelected.add(path);
                } else {
                    newSelected.delete(path);
                }
            });

            // Clean up any selected paths that are now under excluded nodes
            Array.from(newSelected).forEach(path => {
                const pathNode = { path, name: path.split('/').pop() || '' } as FileNode;
                if (isNodeExcluded(pathNode)) {
                    newSelected.delete(path);
                }
            });

            return newSelected;
        });
    }, [getSelectableDescendants, isNodeExcluded]);

    // Notify parent component of selection changes
    useEffect(() => {
        onSelectionChange?.(selectedFiles);
    }, [selectedFiles, onSelectionChange]);

    const setLoading = useCallback((path: string, isLoading: boolean) => {
        setLoadingFiles(prev => {
            const next = new Set(prev);
            if (isLoading) {
                next.add(path);
            } else {
                next.delete(path);
            }
            return next;
        });
    }, []);

    return {
        selectedFiles,
        loadingFiles,
        handleCheckboxChange,
        setLoading,
        setSelectedFiles,
        isNodeExcluded  // Export this to use in UI
    };
};