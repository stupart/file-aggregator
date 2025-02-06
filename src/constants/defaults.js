"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_USER_CONFIG = exports.DEFAULT_EXCLUSIONS = void 0;
exports.DEFAULT_EXCLUSIONS = {
    global: {
        files: [
            'package-lock.json',
            '*.log',
            '.DS_Store',
            // Add image patterns
            '*.jpg', '*.jpeg', '*.png', '*.gif',
            '*.bmp', '*.webp', '*.svg', '*.ico',
            '*.tiff', '*.tif'
        ],
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
exports.DEFAULT_USER_CONFIG = {
    theme: 'system',
    maxRecentProjects: 10,
    recentProjects: []
};
//# sourceMappingURL=defaults.js.map