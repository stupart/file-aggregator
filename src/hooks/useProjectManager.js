"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useProjectManager = void 0;
//src/hooks/useProjectManager.ts
var react_1 = require("react");
var config_1 = require("../utils/config");
var useServices_1 = require("./useServices");
var useProjectManager = function () {
    var _a = (0, react_1.useState)(null), structure = _a[0], setStructure = _a[1];
    var _b = (0, react_1.useState)(''), projectRoot = _b[0], setProjectRoot = _b[1];
    var _c = (0, react_1.useState)(null), projectContext = _c[0], setProjectContext = _c[1];
    var fileOps = (0, useServices_1.useServices)(projectRoot).fileOps;
    var loadProject = (0, react_1.useCallback)(function (folderPath) { return __awaiter(void 0, void 0, void 0, function () {
        var fileStructure, context;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setProjectRoot(folderPath);
                    // Update FileOperations with new project root
                    fileOps.setProjectRoot(folderPath);
                    return [4 /*yield*/, window.electronAPI.scanDirectory(folderPath)];
                case 1:
                    fileStructure = _a.sent();
                    setStructure(fileStructure);
                    // Add to recent projects
                    return [4 /*yield*/, (0, config_1.addRecentProject)(folderPath)];
                case 2:
                    // Add to recent projects
                    _a.sent();
                    return [4 /*yield*/, window.electronAPI.analyzeProject(folderPath)];
                case 3:
                    context = _a.sent();
                    setProjectContext(context);
                    return [2 /*return*/, { fileStructure: fileStructure, context: context }];
            }
        });
    }); }, [fileOps]); // Add fileOps to dependencies
    return {
        structure: structure,
        projectRoot: projectRoot,
        projectContext: projectContext,
        loadProject: loadProject,
        setProjectRoot: setProjectRoot,
        setStructure: setStructure,
        setProjectContext: setProjectContext
    };
};
exports.useProjectManager = useProjectManager;
//# sourceMappingURL=useProjectManager.js.map