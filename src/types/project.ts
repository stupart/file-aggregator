// src/types/project.ts
export interface ProjectStack {
    type: 'react' | 'node' | 'electron' | 'vue' | 'angular' | string;
    framework: string[];
    language: 'typescript' | 'javascript' | 'mixed';
    testing: string[];
    styling: string[];
    buildTools: string[];
    database?: string[];
}

export interface ProjectContext {
    name: string;
    description: string;
    stack: ProjectStack;
    dependencies: {
        prod: Record<string, string>;
        dev: Record<string, string>;
    };
    scripts: Record<string, string>;
}