// src/hooks/useProjectManager.ts
import { useState, useCallback } from 'react';
import { FileNode, ProjectContext } from '../types';
import { addRecentProject } from '../utils/config';

export const useProjectManager = () => {
    const [structure, setStructure] = useState<FileNode | null>(null);
    const [projectRoot, setProjectRoot] = useState<string>('');
    const [projectContext, setProjectContext] = useState<ProjectContext | null>(null);

    const loadProject = useCallback(async (folderPath: string) => {
        setProjectRoot(folderPath);
        
        // Scan directory
        const fileStructure = await window.electronAPI.scanDirectory(folderPath);
        setStructure(fileStructure);

        // Add to recent projects
        await addRecentProject(folderPath);

        // Analyze project context
        const context = await window.electronAPI.analyzeProject(folderPath);
        setProjectContext(context);

        return { fileStructure, context };
    }, []);

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