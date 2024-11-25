// src/types/output.ts
export interface OutputFormat {
    destination: 'clipboard' | 'AIREADME.txt' | 'custom';
    customPath?: string;
    format: {
        includeProjectContext: boolean;
        includeFileTree: boolean;
        fileComments: boolean;
        separators: boolean;
        maxFileSize?: number;
    };
    header?: {
        title?: string;
        description?: string;
        customSections?: Record<string, string>;
    };
}