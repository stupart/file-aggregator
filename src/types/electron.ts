//src/types/electron.ts

import { 
    FileNode, 
    ExclusionConfig, 
    SharePreset, 
    UserConfig,
    ProjectContext,
    PromptConfig 
  } from './index';
  import { AIREADMEConfig } from './unifiedConfig';
  
  declare global {
    interface Window {
      electronAPI: {
        selectFolder: () => Promise<string | null>;
        scanDirectory: (path: string) => Promise<FileNode>;
        readFileContent: (path: string) => Promise<string>;
        writeFile: (path: string, content: string) => Promise<void>;
        exportFiles: (content: string, defaultFileName: string) => Promise<string | null>;
        savePrompt: (content: string, projectRoot: string) => Promise<void>;
        addFileHeaders: (files: { path: string; content: string }[]) => Promise<void>;
        saveConfig: (config: ExclusionConfig) => Promise<void>;
        loadConfig: () => Promise<ExclusionConfig>;
        saveUserConfig: (config: UserConfig) => Promise<void>;
        loadUserConfig: () => Promise<UserConfig>;
        savePromptConfig: (config: PromptConfig) => Promise<void>;
        loadPromptConfig: () => Promise<PromptConfig>;
        savePreset: (preset: SharePreset) => Promise<void>;
        deletePreset: (presetId: string) => Promise<boolean>;
        analyzeProject: (path: string) => Promise<ProjectContext>;
        loadPresets: () => Promise<Array<{
          id: string;
          name: string;
          description: string;
          exclusions: ExclusionConfig;
          outputFormat: any;
          includeContext: {
            stack: boolean;
            description: boolean;
            dependencies: boolean;
            scripts: boolean;
          };
        }>>;
        // New unified config methods
        loadUnifiedConfig: () => Promise<AIREADMEConfig>;
        saveUnifiedConfig: (config: AIREADMEConfig) => Promise<boolean>;
      }
    }
  }
