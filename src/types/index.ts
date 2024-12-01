// src/types/index.ts
// Export all types
export type { FileNode } from './file';
export type { 
    GlobalExclusions,
    SessionExclusions,
    FolderBehaviors,
    ExclusionConfig 
} from './exclusions';
export type { 
    ProjectStack,
    ProjectContext 
} from './project';
export type { SharePreset } from './presets';
export type { OutputFormat } from './output';
export type { FileError } from './errors';
export type { 
    UserConfig,
    PromptConfig 
} from './config';
export type { 
    PromptSection,
    PromptOptions 
} from './prompt';