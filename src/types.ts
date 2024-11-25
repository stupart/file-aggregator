export interface FileNode {
    path: string;
    name: string;
    isDirectory: boolean;
    children?: FileNode[];
    selected: boolean;
}

export interface ExclusionConfig {
    paths: string[];           // Exact paths to exclude
    patterns: string[];        // Patterns to exclude (e.g., "*.log")
    autoExcludeContents: string[];  // Folders whose contents should be hidden (e.g., "node_modules")
}

declare global {
    interface Window {
        electronAPI: {
            selectFolder: () => Promise<string | null>;
            scanDirectory: (path: string) => Promise<FileNode>;
            exportFiles: (content: string, defaultFileName: string) => Promise<string | null>;
            readFileContent: (path: string) => Promise<string>;
            saveConfig: (config: ExclusionConfig) => Promise<void>;
            loadConfig: () => Promise<ExclusionConfig>;
        }
    }
}

//test