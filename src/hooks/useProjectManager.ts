//src/hooks/useProjectManager.ts
import { useState, useCallback } from 'react';
import { FileNode, ProjectContext } from '../types';
import { addRecentProject } from '../utils/config';
import { useServices } from './useServices';

export const useProjectManager = () => {
    const [structure, setStructure] = useState<FileNode | null>(null);
    const [projectRoot, setProjectRoot] = useState<string>('');
    const [projectContext, setProjectContext] = useState<ProjectContext | null>(null);
    const { fileOps } = useServices(projectRoot);

    const loadProject = useCallback(async (folderPath: string) => {
        setProjectRoot(folderPath);
        
        // Update FileOperations with new project root
        fileOps.setProjectRoot(folderPath);
        
        // Scan directory
        const fileStructure = await window.electronAPI.scanDirectory(folderPath);
        setStructure(fileStructure);

        // Add to recent projects
        await addRecentProject(folderPath);

        // Analyze project context
        const context = await window.electronAPI.analyzeProject(folderPath);
        setProjectContext(context);

        return { fileStructure, context };
    }, [fileOps]); // Add fileOps to dependencies

    return {
        structure,
        projectRoot,
        projectContext,
        loadProject,
        setProjectRoot,
        setStructure,
        setProjectContext
    };
};