// src/types/file.ts
export interface FileNode {
    path: string;
    name: string;
    isDirectory: boolean;
    children?: FileNode[];
    selected: boolean;
    status?: 'included' | 'excluded' | 'hidden';
    content?: string;  // Add this for file contents
}