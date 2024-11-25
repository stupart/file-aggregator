// src/types/file.ts
export interface FileNode {
    path: string;
    name: string;
    isDirectory: boolean;
    children?: FileNode[];
    selected: boolean;
    status?: 'included' | 'excluded' | 'hidden';  // Add this
}