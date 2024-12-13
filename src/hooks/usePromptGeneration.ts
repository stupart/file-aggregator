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

    const generatePromptContent = async (selectedNodes: FileNode[]): Promise<string> => {
        if (!promptBuilder || !structure || !projectContext) {
            throw new Error('Project not properly initialized');
        }

        // Add files to the builder
        const nodesWithContent = await Promise.all(
            selectedNodes.map(async (node) => {
                if (!node.isDirectory) {
                    const content = await fileOps.readFileContent(node.path);
                    return { ...node, content };
                }
                return node;
            })
        );
    
        // Clear previous sections
        promptBuilder.clearSections(); // Add this method to PromptBuilder
    
        // Add sections based on config
        if (promptConfig.includeIdentity && promptConfig.identity) {
            promptBuilder.addIdentity(promptConfig.identity);
        }
        
        if (promptConfig.includeProject) {
            promptBuilder.addProject(projectContext);
        }
        
        if (promptConfig.includeTask && promptConfig.task) {
            promptBuilder.addTask(promptConfig.task);
        }
    
        if (promptConfig.includeFileTree) {
            promptBuilder.addFileTree(structure);
        }
    
        promptBuilder.addFiles(nodesWithContent);
    
        // Generate the prompt with all options
        return promptBuilder.generatePrompt({
            projectName: projectRoot.split('/').pop() || 'project',
            projectContext: promptConfig.includeProject ? projectContext : undefined,
            identity: promptConfig.includeIdentity ? promptConfig.identity : undefined,
            task: promptConfig.includeTask ? promptConfig.task : undefined,
            includeFileTree: promptConfig.includeFileTree
        });
    };
    
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