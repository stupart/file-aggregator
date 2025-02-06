"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_UNIFIED_CONFIG = exports.DEFAULT_OUTPUT_FORMAT = exports.DEFAULT_PROMPT_CONFIG = void 0;
var defaults_1 = require("./defaults");
exports.DEFAULT_PROMPT_CONFIG = {
    includeFileTree: true,
    includeIdentity: false,
    includeProject: true,
    includeTask: false,
    task: '',
    identity: '',
    addFileHeaders: true,
    generatePseudocode: false
};
exports.DEFAULT_OUTPUT_FORMAT = {
    destination: 'AIREADME.txt',
    format: {
        includeProjectContext: true,
        includeFileTree: true,
        fileComments: true,
        separators: true,
        maxFileSize: undefined
    },
    header: {
        title: undefined,
        description: undefined,
        customSections: {}
    }
};
exports.DEFAULT_UNIFIED_CONFIG = {
    exclusions: defaults_1.DEFAULT_EXCLUSIONS,
    prompt: exports.DEFAULT_PROMPT_CONFIG,
    outputFormat: exports.DEFAULT_OUTPUT_FORMAT,
    ui: {
        theme: defaults_1.DEFAULT_USER_CONFIG.theme,
        recentProjects: defaults_1.DEFAULT_USER_CONFIG.recentProjects || [],
        maxRecentProjects: defaults_1.DEFAULT_USER_CONFIG.maxRecentProjects || 10
    }
};
//# sourceMappingURL=defaultUnifiedConfig.js.map