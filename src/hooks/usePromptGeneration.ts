// src/hooks/usePromptGeneration.ts
import { useState, useCallback } from 'react';
import { FileNode, PromptConfig, ProjectContext } from '../types';
import { PromptBuilder } from '../services/PromptBuilder';
import { FileOperations } from '../services/FileOperations';

interface UsePromptGenerationReturn {
    selectedFiles: Set<string>;
    setSelectedFiles: (files: Set<string>) => void;
    loadingFiles: Set<string>;
    setLoadingFiles: (files: Set<string>) => void;
    generatedContent: string;
    setGeneratedContent: (content: string) => void;
    generatePromptContent: (selectedNodes: FileNode[]) => Promise<string>;
}

export const usePromptGeneration = (
    fileOps: FileOperations,
    promptBuilder: PromptBuilder | null,
    projectContext: ProjectContext | null,
    structure: FileNode | null,
    projectRoot: string,
    promptConfig: PromptConfig
): UsePromptGenerationReturn => {
    const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
    const [loadingFiles, setLoadingFiles] = useState<Set<string>>(new Set());
    const [generatedContent, setGeneratedContent] = useState<string>('');

    const generatePromptContent = useCallback(async (selectedNodes: FileNode[]): Promise<string> => {
        if (!promptBuilder || !structure || !projectContext) {
            throw new Error('Project not properly initialized');
        }

        // Load file contents
        const nodesWithContent = await Promise.all(
            selectedNodes.map(async (node) => {
                if (!node.isDirectory) {
                    const content = await fileOps.readFileContent(node.path);
                    return { ...node, content };
                }
                return node;
            })
        );

        // Build prompt
        if (promptConfig.includeFileTree) {
            promptBuilder.addFileTree(structure);
        }

        promptBuilder.addFiles(nodesWithContent);

        const projectName = projectRoot.split('/').pop() || 'project';
        return await promptBuilder.generatePrompt({
            projectName,
            projectContext: promptConfig.includeProject ? projectContext : undefined,
            selectedFiles: nodesWithContent,
            includeFileTree: promptConfig.includeFileTree
        });
    }, [promptBuilder, structure, projectContext, projectRoot, promptConfig, fileOps]);

    return {
        selectedFiles,
        setSelectedFiles,
        loadingFiles,
        setLoadingFiles,
        generatedContent,
        setGeneratedContent,
        generatePromptContent
    };
};