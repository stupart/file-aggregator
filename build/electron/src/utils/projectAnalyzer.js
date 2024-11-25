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
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeProject = void 0;
// src/utils/projectAnalyzer.ts
var fs = __importStar(require("fs/promises"));
var path = __importStar(require("path"));
function readPackageJson(rootPath) {
    return __awaiter(this, void 0, void 0, function () {
        var content, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, fs.readFile(path.join(rootPath, 'package.json'), 'utf-8')];
                case 1:
                    content = _a.sent();
                    return [2 /*return*/, JSON.parse(content)];
                case 2:
                    error_1 = _a.sent();
                    console.error('Error reading package.json:', error_1);
                    return [2 /*return*/, { name: path.basename(rootPath) }];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function detectProjectType(packageJson) {
    var allDeps = __assign(__assign({}, packageJson.dependencies), packageJson.devDependencies);
    if (allDeps['electron'])
        return 'electron';
    if (allDeps['react'])
        return 'react';
    if (allDeps['vue'])
        return 'vue';
    if (allDeps['@angular/core'])
        return 'angular';
    if (allDeps['express'] || allDeps['koa'] || allDeps['fastify'])
        return 'node';
    return 'unknown';
}
function detectFrameworks(packageJson) {
    var frameworks = [];
    var allDeps = __assign(__assign({}, packageJson.dependencies), packageJson.devDependencies);
    // UI Frameworks
    if (allDeps['@mui/material'])
        frameworks.push('material-ui');
    if (allDeps['tailwindcss'])
        frameworks.push('tailwind');
    if (allDeps['@chakra-ui/react'])
        frameworks.push('chakra-ui');
    // State Management
    if (allDeps['redux'] || allDeps['@reduxjs/toolkit'])
        frameworks.push('redux');
    if (allDeps['mobx'])
        frameworks.push('mobx');
    if (allDeps['recoil'])
        frameworks.push('recoil');
    return frameworks;
}
function detectLanguage(rootPath) {
    return __awaiter(this, void 0, void 0, function () {
        var files, hasTS, hasJS, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, fs.readdir(rootPath)];
                case 1:
                    files = _b.sent();
                    hasTS = files.some(function (f) { return f.endsWith('.ts') || f.endsWith('.tsx'); });
                    hasJS = files.some(function (f) { return f.endsWith('.js') || f.endsWith('.jsx'); });
                    if (hasTS && hasJS)
                        return [2 /*return*/, 'mixed'];
                    if (hasTS)
                        return [2 /*return*/, 'typescript'];
                    return [2 /*return*/, 'javascript'];
                case 2:
                    _a = _b.sent();
                    return [2 /*return*/, 'javascript'];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function detectTestingLibraries(packageJson) {
    var testingTools = [];
    var allDeps = __assign(__assign({}, packageJson.dependencies), packageJson.devDependencies);
    if (allDeps['jest'])
        testingTools.push('jest');
    if (allDeps['@testing-library/react'])
        testingTools.push('react-testing-library');
    if (allDeps['cypress'])
        testingTools.push('cypress');
    if (allDeps['vitest'])
        testingTools.push('vitest');
    return testingTools;
}
function detectStylingApproach(packageJson, rootPath) {
    var stylingTools = [];
    var allDeps = __assign(__assign({}, packageJson.dependencies), packageJson.devDependencies);
    if (allDeps['styled-components'])
        stylingTools.push('styled-components');
    if (allDeps['@emotion/react'])
        stylingTools.push('emotion');
    if (allDeps['sass'])
        stylingTools.push('sass');
    if (allDeps['tailwindcss'])
        stylingTools.push('tailwind');
    return stylingTools;
}
function detectBuildTools(packageJson) {
    var buildTools = [];
    var allDeps = __assign(__assign({}, packageJson.dependencies), packageJson.devDependencies);
    if (allDeps['webpack'])
        buildTools.push('webpack');
    if (allDeps['vite'])
        buildTools.push('vite');
    if (allDeps['parcel'])
        buildTools.push('parcel');
    if (allDeps['esbuild'])
        buildTools.push('esbuild');
    return buildTools;
}
function analyzeProject(rootPath) {
    return __awaiter(this, void 0, void 0, function () {
        var packageJson, stack;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, readPackageJson(rootPath)];
                case 1:
                    packageJson = _b.sent();
                    _a = {
                        type: detectProjectType(packageJson),
                        framework: detectFrameworks(packageJson)
                    };
                    return [4 /*yield*/, detectLanguage(rootPath)];
                case 2:
                    stack = (_a.language = _b.sent(),
                        _a.testing = detectTestingLibraries(packageJson),
                        _a.styling = detectStylingApproach(packageJson, rootPath),
                        _a.buildTools = detectBuildTools(packageJson),
                        _a);
                    return [2 /*return*/, {
                            name: packageJson.name,
                            description: packageJson.description || '',
                            stack: stack,
                            dependencies: {
                                prod: packageJson.dependencies || {},
                                dev: packageJson.devDependencies || {}
                            },
                            scripts: packageJson.scripts || {}
                        }];
            }
        });
    });
}
exports.analyzeProject = analyzeProject;
//# sourceMappingURL=projectAnalyzer.js.map