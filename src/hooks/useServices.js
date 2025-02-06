"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useServices = void 0;
//src/hooks/useServices.ts
var react_1 = require("react");
var PromptBuilder_1 = require("../services/PromptBuilder");
var FileOperations_1 = require("../services/FileOperations");
var ConfigurationManager_1 = require("../services/ConfigurationManager");
var useServices = function (projectRoot) {
    // Create a single fileOps instance that persists
    var fileOps = (0, react_1.useMemo)(function () { return new FileOperations_1.FileOperations(window.electronAPI); }, []);
    var configManager = (0, react_1.useMemo)(function () { return new ConfigurationManager_1.ConfigurationManager(window.electronAPI); }, []);
    var promptBuilder = (0, react_1.useMemo)(function () {
        return projectRoot ? new PromptBuilder_1.PromptBuilder(projectRoot) : null;
    }, [projectRoot]);
    return {
        fileOps: fileOps,
        configManager: configManager,
        promptBuilder: promptBuilder
    };
};
exports.useServices = useServices;
//# sourceMappingURL=useServices.js.map