export interface UserConfig {
    lastUsedPreset?: string;
    defaultOutputPath?: string;
    theme?: 'light' | 'dark' | 'system';
    recentProjects?: string[];
    maxRecentProjects?: number;
}