// src/types/electron.ts
import { 
    FileNode, 
    ExclusionConfig, 
    SharePreset, 
    UserConfig,
    ProjectContext 
} from './index';

declare global {
    interface Window {
        electronAPI: {
            // File operations
            selectFolder: () => Promise<string | null>;
            scanDirectory: (path: string) => Promise<FileNode>;
            readFileContent: (path: string) => Promise<string>;
            writeFile: (path: string, content: string) => Promise<void>;
            
            // Export operations
            exportFiles: (content: string, defaultFileName: string) => Promise<string | null>;
            
            // Configuration management
            saveConfig: (config: ExclusionConfig) => Promise<void>;
            loadConfig: () => Promise<ExclusionConfig>;
            
            // User preferences
            saveUserConfig: (config: UserConfig) => Promise<void>;
            loadUserConfig: () => Promise<UserConfig>;
            
            // Preset management
            savePreset: (preset: SharePreset) => Promise<void>;
            loadPresets: () => Promise<SharePreset[]>;
            deletePreset: (presetId: string) => Promise<boolean>;

            // Project analysis
            analyzeProject: (path: string) => Promise<ProjectContext>;
        }
    }
}