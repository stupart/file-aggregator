//src/types/exclusions.ts
// src/types/exclusions.ts
export interface GlobalExclusions {
    files: string[];      // e.g., "package-lock.json", "*.log"
    folders: string[];    // e.g., "node_modules", "dist"
}

export interface SessionExclusions {
    files: string[];
    folders: string[];
}

export interface FolderBehaviors {
    hideContents: string[];  // Show folder but hide contents
    showEmpty: string[];     // Show folder as empty
    summarize: string[];     // Could show size/file count instead of contents
}

export interface ExclusionConfig {
    global: GlobalExclusions;
    session: SessionExclusions;
    behaviors: FolderBehaviors;
}