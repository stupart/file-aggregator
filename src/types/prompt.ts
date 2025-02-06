//src/types/prompt.ts

import { FileNode } from './file';
import { ProjectContext } from './project';

export interface PromptSection {
    type: 'identity' | 'project' | 'task' | 'fileTree' | 'files';
    content: string;
    optional?: boolean;
}

export interface PromptOptions {
    projectName: string;
    projectContext?: ProjectContext;
    selectedFiles?: FileNode[];
    identity?: string;
    task?: string;
    includeFileTree?: boolean;
}