// src/hooks/useServices.ts
import { useMemo } from 'react';
import { PromptBuilder } from '../services/PromptBuilder';
import { FileOperations } from '../services/FileOperations';
import { ConfigurationManager } from '../services/ConfigurationManager';

export const useServices = (projectRoot: string) => {
    // Create a single fileOps instance that persists
    const fileOps = useMemo(() => new FileOperations(window.electronAPI), []);
    const configManager = useMemo(() => new ConfigurationManager(window.electronAPI), []);
    const promptBuilder = useMemo(() => 
        projectRoot ? new PromptBuilder(projectRoot) : null, 
        [projectRoot]
    );

    return {
        fileOps,
        configManager,
        promptBuilder
    };
};
