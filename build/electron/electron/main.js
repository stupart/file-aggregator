"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/* electron/main.ts */
var electron_1 = require("electron");
var path = __importStar(require("path"));
var fs = __importStar(require("fs"));
var electron_is_dev_1 = __importDefault(require("electron-is-dev"));
var projectAnalyzer_1 = require("./utils/projectAnalyzer");
var defaultUnifiedConfig_1 = require("../src/constants/defaultUnifiedConfig");
function createWindow() {
    var win = new electron_1.BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        }
    });
    if (electron_is_dev_1.default) {
        win.loadURL('http://localhost:3001');
        win.webContents.openDevTools();
    }
    else {
        win.loadFile(path.join(__dirname, '../build/index.html'));
    }
}
electron_1.app.whenReady().then(createWindow);
electron_1.app.on('window-all-closed', function () { if (process.platform !== 'darwin')
    electron_1.app.quit(); });
electron_1.app.on('activate', function () { if (electron_1.BrowserWindow.getAllWindows().length === 0)
    createWindow(); });
// ---------------------
// File System Handlers
// ---------------------
electron_1.ipcMain.handle('select-folder', function () { return __awaiter(void 0, void 0, void 0, function () {
    var result;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, electron_1.dialog.showOpenDialog({ properties: ['openDirectory'] })];
            case 1:
                result = _a.sent();
                return [2 /*return*/, result.canceled ? null : result.filePaths[0]];
        }
    });
}); });
electron_1.ipcMain.handle('scan-directory', function (_, folderPath) { return __awaiter(void 0, void 0, void 0, function () {
    var unifiedConfig, exclusionConfig, scanDir;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, loadUnifiedConfig()];
            case 1:
                unifiedConfig = _a.sent();
                exclusionConfig = unifiedConfig.exclusions;
                scanDir = function (filePath) { return __awaiter(void 0, void 0, void 0, function () {
                    var stats, name, node, childrenNames, filteredNames, children;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, fs.promises.stat(filePath)];
                            case 1:
                                stats = _a.sent();
                                name = filePath.split('/').pop() || '';
                                node = { path: filePath, name: name, isDirectory: stats.isDirectory(), selected: false };
                                if (!node.isDirectory)
                                    return [2 /*return*/, node];
                                if (exclusionConfig.behaviors.hideContents.includes(name) || exclusionConfig.behaviors.showEmpty.includes(name)) {
                                    return [2 /*return*/, __assign(__assign({}, node), { children: [] })];
                                }
                                if (!!exclusionConfig.global.folders.includes(name)) return [3 /*break*/, 4];
                                return [4 /*yield*/, fs.promises.readdir(filePath)];
                            case 2:
                                childrenNames = _a.sent();
                                filteredNames = childrenNames.filter(function (childName) {
                                    var isExcludedFile = exclusionConfig.global.files.includes(childName);
                                    var matchesPattern = exclusionConfig.global.files.some(function (pattern) {
                                        return pattern.includes('*') && new RegExp('^' + pattern.replace('*', '.*') + '$').test(childName);
                                    });
                                    return !isExcludedFile && !matchesPattern;
                                });
                                return [4 /*yield*/, Promise.all(filteredNames.map(function (child) { return scanDir("".concat(filePath, "/").concat(child)); }))];
                            case 3:
                                children = _a.sent();
                                return [2 /*return*/, __assign(__assign({}, node), { children: children })];
                            case 4: return [2 /*return*/, node];
                        }
                    });
                }); };
                return [2 /*return*/, scanDir(folderPath)];
        }
    });
}); });
electron_1.ipcMain.handle('analyze-project', function (_, folderPath) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        return [2 /*return*/, (0, projectAnalyzer_1.analyzeProject)(folderPath)];
    });
}); });
electron_1.ipcMain.handle('read-file-content', function (_, filePath) { return __awaiter(void 0, void 0, void 0, function () {
    var error_1, fileError;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, fs.promises.readFile(filePath, 'utf8')];
            case 1: return [2 /*return*/, _a.sent()];
            case 2:
                error_1 = _a.sent();
                fileError = {
                    message: error_1 instanceof Error ? error_1.message : 'Unknown error',
                    path: filePath,
                    code: error_1 instanceof Error && 'code' in error_1 ? error_1.code : undefined
                };
                console.error('Error reading file:', fileError);
                throw fileError;
            case 3: return [2 /*return*/];
        }
    });
}); });
electron_1.ipcMain.handle('export-files', function (_, content, defaultFileName) { return __awaiter(void 0, void 0, void 0, function () {
    var result;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, electron_1.dialog.showSaveDialog({
                    defaultPath: "".concat(defaultFileName, ".txt"),
                    filters: [{ name: 'Text Files', extensions: ['txt'] }]
                })];
            case 1:
                result = _a.sent();
                if (!(!result.canceled && result.filePath)) return [3 /*break*/, 3];
                return [4 /*yield*/, fs.promises.writeFile(result.filePath, content)];
            case 2:
                _a.sent();
                return [2 /*return*/, result.filePath];
            case 3: return [2 /*return*/, null];
        }
    });
}); });
electron_1.ipcMain.handle('write-file', function (_, filePath, content) { return __awaiter(void 0, void 0, void 0, function () {
    var error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, fs.promises.writeFile(filePath, content, 'utf8')];
            case 1:
                _a.sent();
                return [2 /*return*/, true];
            case 2:
                error_2 = _a.sent();
                console.error("Error writing file ".concat(filePath, ":"), error_2);
                throw error_2;
            case 3: return [2 /*return*/];
        }
    });
}); });
// ---------------------
// Preset Handlers
// ---------------------
electron_1.ipcMain.handle('save-preset', function (_, preset) { return __awaiter(void 0, void 0, void 0, function () {
    var presetsPath, presets, existing, _a, index;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                presetsPath = path.join(electron_1.app.getPath('userData'), 'presets.json');
                presets = [];
                _b.label = 1;
            case 1:
                _b.trys.push([1, 3, , 4]);
                return [4 /*yield*/, fs.promises.readFile(presetsPath, 'utf8')];
            case 2:
                existing = _b.sent();
                presets = JSON.parse(existing);
                return [3 /*break*/, 4];
            case 3:
                _a = _b.sent();
                presets = [];
                return [3 /*break*/, 4];
            case 4:
                index = presets.findIndex(function (p) { return p.id === preset.id; });
                if (index >= 0) {
                    presets[index] = preset;
                }
                else {
                    presets.push(preset);
                }
                return [4 /*yield*/, fs.promises.writeFile(presetsPath, JSON.stringify(presets, null, 2))];
            case 5:
                _b.sent();
                return [2 /*return*/];
        }
    });
}); });
electron_1.ipcMain.handle('load-presets', function () { return __awaiter(void 0, void 0, void 0, function () {
    var presetsPath, presets, _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                presetsPath = path.join(electron_1.app.getPath('userData'), 'presets.json');
                _b.label = 1;
            case 1:
                _b.trys.push([1, 3, , 4]);
                return [4 /*yield*/, fs.promises.readFile(presetsPath, 'utf8')];
            case 2:
                presets = _b.sent();
                return [2 /*return*/, JSON.parse(presets)];
            case 3:
                _a = _b.sent();
                return [2 /*return*/, []];
            case 4: return [2 /*return*/];
        }
    });
}); });
electron_1.ipcMain.handle('delete-preset', function (_, presetId) { return __awaiter(void 0, void 0, void 0, function () {
    var presetsPath, existing, presets, _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                presetsPath = path.join(electron_1.app.getPath('userData'), 'presets.json');
                _b.label = 1;
            case 1:
                _b.trys.push([1, 4, , 5]);
                return [4 /*yield*/, fs.promises.readFile(presetsPath, 'utf8')];
            case 2:
                existing = _b.sent();
                presets = JSON.parse(existing);
                presets = presets.filter(function (p) { return p.id !== presetId; });
                return [4 /*yield*/, fs.promises.writeFile(presetsPath, JSON.stringify(presets, null, 2))];
            case 3:
                _b.sent();
                return [2 /*return*/, true];
            case 4:
                _a = _b.sent();
                throw new Error('Failed to delete preset');
            case 5: return [2 /*return*/];
        }
    });
}); });
// ---------------------
// Prompt Handlers
// ---------------------
electron_1.ipcMain.handle('save-prompt', function (_, content, projectRoot) { return __awaiter(void 0, void 0, void 0, function () {
    var filePath, error_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                filePath = path.join(projectRoot, 'aireadme.txt');
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                return [4 /*yield*/, fs.promises.writeFile(filePath, content, 'utf8')];
            case 2:
                _a.sent();
                return [2 /*return*/, true];
            case 3:
                error_3 = _a.sent();
                console.error('Error saving prompt:', error_3);
                throw error_3;
            case 4: return [2 /*return*/];
        }
    });
}); });
electron_1.ipcMain.handle('add-file-headers', function (_, files) { return __awaiter(void 0, void 0, void 0, function () {
    var error_4;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, Promise.all(files.map(function (file) { return __awaiter(void 0, void 0, void 0, function () {
                        var header;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    header = "//".concat(file.path, "\n");
                                    if (!!file.content.startsWith(header)) return [3 /*break*/, 2];
                                    return [4 /*yield*/, fs.promises.writeFile(file.path, header + file.content, 'utf8')];
                                case 1:
                                    _a.sent();
                                    _a.label = 2;
                                case 2: return [2 /*return*/];
                            }
                        });
                    }); }))];
            case 1:
                _a.sent();
                return [2 /*return*/, true];
            case 2:
                error_4 = _a.sent();
                console.error('Error adding file headers:', error_4);
                throw error_4;
            case 3: return [2 /*return*/];
        }
    });
}); });
// ---------------------
// Unified Configuration Handlers
// ---------------------
var getUnifiedConfigPath = function () { return path.join(electron_1.app.getPath('userData'), 'aireadme-config.json'); };
function loadUnifiedConfig() {
    return __awaiter(this, void 0, void 0, function () {
        var configPath, content, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    configPath = getUnifiedConfigPath();
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 4, , 6]);
                    return [4 /*yield*/, fs.promises.access(configPath)];
                case 2:
                    _b.sent();
                    return [4 /*yield*/, fs.promises.readFile(configPath, 'utf8')];
                case 3:
                    content = _b.sent();
                    return [2 /*return*/, JSON.parse(content)];
                case 4:
                    _a = _b.sent();
                    return [4 /*yield*/, fs.promises.writeFile(configPath, JSON.stringify(defaultUnifiedConfig_1.DEFAULT_UNIFIED_CONFIG, null, 2))];
                case 5:
                    _b.sent();
                    return [2 /*return*/, defaultUnifiedConfig_1.DEFAULT_UNIFIED_CONFIG];
                case 6: return [2 /*return*/];
            }
        });
    });
}
electron_1.ipcMain.handle('load-unified-config', loadUnifiedConfig);
electron_1.ipcMain.handle('save-unified-config', function (_, config) { return __awaiter(void 0, void 0, void 0, function () {
    var configPath;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                configPath = getUnifiedConfigPath();
                return [4 /*yield*/, fs.promises.writeFile(configPath, JSON.stringify(config, null, 2))];
            case 1:
                _a.sent();
                return [2 /*return*/, true];
        }
    });
}); });
//# sourceMappingURL=main.js.map