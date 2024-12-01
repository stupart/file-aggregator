// src/types/config.ts
export interface PromptConfig {
    includeFileTree: boolean;
    includeIdentity: boolean;
    includeProject: boolean;
    includeTask: boolean;
    addFileHeaders: boolean;
    generatePseudocode: boolean;
}

export interface UserConfig {
    lastUsedPreset?: string;
    defaultOutputPath?: string;
    theme?: 'light' | 'dark' | 'system';
    recentProjects?: string[];
    maxRecentProjects?: number;
    promptConfig?: PromptConfig;  // Add this for prompt configuration
}