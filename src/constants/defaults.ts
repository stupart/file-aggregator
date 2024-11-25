// src/constants/defaults.ts
import { ExclusionConfig, UserConfig } from '../types';

export const DEFAULT_EXCLUSIONS: ExclusionConfig = {
    global: {
        files: ['package-lock.json', '*.log', '.DS_Store'],
        folders: ['node_modules', 'build', 'dist']
    },
    session: {
        files: [],
        folders: []
    },
    behaviors: {
        hideContents: ['node_modules'],
        showEmpty: [],
        summarize: []
    }
};

export const DEFAULT_USER_CONFIG: UserConfig = {
    theme: 'system',
    maxRecentProjects: 10,
    recentProjects: []
};