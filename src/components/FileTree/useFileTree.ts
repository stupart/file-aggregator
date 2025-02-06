//src/components/FileTree/useFileTree.ts
import { useState, useCallback, useEffect } from 'react';
import { FileNode, ExclusionConfig } from '../../types';

interface UseFileTreeProps {
    initialSelected?: Set<string>;
    exclusionConfig: ExclusionConfig;
    onSelectionChange?: (selected: Set<string>) => void;
}

interface UseFileTreeReturn {
    selectedFiles: Set<string>;
    loadingFiles: Set<string>;
    handleCheckboxChange: (node: FileNode, checked: boolean) => void;
    isNodeExcluded: (node: FileNode) => boolean;
    setSelectedFiles: (selected: Set<string>) => void;
    setLoadingFile: (path: string, isLoading: boolean) => void;
}

export const useFileTree = ({
    initialSelected = new Set(),
    exclusionConfig,
    onSelectionChange
}: UseFileTreeProps): UseFileTreeReturn => {
    const [selectedFiles, setSelectedFiles] = useState<Set<string>>(initialSelected);
    const [loadingFiles, setLoadingFiles] = useState<Set<string>>(new Set());

    // Check if a node or any of its ancestors are excluded
    const isNodeExcluded = useCallback((node: FileNode): boolean => {
        // Check node itself
        if (exclusionConfig.global.files.includes(node.name) ||
            exclusionConfig.global.folders.includes(node.name)) {
            return true;
        }

        // Check ancestors
        const pathParts = node.path.split('/');
        for (let i = 0; i < pathParts.length; i++) {
            const parentFolder = pathParts[i];
            if (exclusionConfig.global.folders.includes(parentFolder)) {
                return true;
            }
        }

        return false;
    }, [exclusionConfig]);

    // Clean up selections when exclusions change
    useEffect(() => {
        setSelectedFiles(prev => {
            const newSelected = new Set(prev);
            Array.from(newSelected).forEach(path => {
                const pathNode = { path, name: path.split('/').pop() || '' } as FileNode;
                if (isNodeExcluded(pathNode)) {
                    newSelected.delete(path);
                }
            });
            return newSelected;
        });
    }, [exclusionConfig, isNodeExcluded]);

    // Get all selectable descendants
    const getSelectableDescendants = useCallback((node: FileNode): string[] => {
        if (isNodeExcluded(node)) {
            return [];
        }

        let paths: string[] = [];
        
        // Only add this node if it's not excluded
        if (!isNodeExcluded(node)) {
            paths.push(node.path);
        }
        
        if (node.children && !exclusionConfig.behaviors.hideContents.includes(node.name)) {
            node.children.forEach(child => {
                if (!isNodeExcluded(child)) {
                    paths = [...paths, ...getSelectableDescendants(child)];
                }
            });
        }
        
        return paths;
    }, [exclusionConfig, isNodeExcluded]);

    const handleCheckboxChange = useCallback((node: FileNode, checked: boolean) => {
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

            return newSelected;
        });
    }, [getSelectableDescendants, isNodeExcluded]);

    // Notify parent of changes
    useEffect(() => {
        if (onSelectionChange) {
            onSelectionChange(selectedFiles);
        }
    }, [selectedFiles, onSelectionChange]);

    const setLoadingFile = useCallback((path: string, isLoading: boolean) => {
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
        isNodeExcluded,
        setSelectedFiles,
        setLoadingFile
    };
};