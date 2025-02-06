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
exports.PromptBuilder = void 0;
var PromptBuilder = /** @class */ (function () {
    function PromptBuilder(projectRoot) {
        this.sections = [];
        this.projectRoot = projectRoot;
    }
    PromptBuilder.prototype.clearSections = function () {
        this.sections = [];
    };
    PromptBuilder.prototype.addIdentity = function (identity) {
        this.sections.push({
            type: 'identity',
            content: "<identity>\n".concat(identity, "\n</identity>\n\n"),
            optional: true
        });
    };
    PromptBuilder.prototype.addProject = function (context) {
        var content = "<project>\n".concat(this.formatProjectContext(context), "\n</project>\n\n");
        this.sections.push({
            type: 'project',
            content: content,
            optional: true
        });
    };
    PromptBuilder.prototype.addTask = function (task) {
        this.sections.push({
            type: 'task',
            content: "<task>\n".concat(task, "\n</task>\n\n"),
            optional: true
        });
    };
    PromptBuilder.prototype.addFileTree = function (structure) {
        var treeContent = this.generateFileTree(structure);
        this.sections.push({
            type: 'fileTree',
            content: "<file-tree>\n".concat(treeContent, "</file-tree>\n\n"),
            optional: true
        });
    };
    PromptBuilder.prototype.addFiles = function (files) {
        var filesContent = this.formatFiles(files);
        this.sections.push({
            type: 'files',
            content: filesContent
        });
    };
    PromptBuilder.prototype.generatePrompt = function (options) {
        return __awaiter(this, void 0, void 0, function () {
            var output, orderedTypes, _loop_1, this_1, _i, orderedTypes_1, type;
            return __generator(this, function (_a) {
                output = '';
                orderedTypes = [
                    'identity',
                    'project',
                    'task',
                    'fileTree',
                    'files'
                ];
                _loop_1 = function (type) {
                    var section = this_1.sections.find(function (s) { return s.type === type; });
                    if (section && (!section.optional || this_1.shouldIncludeSection(type, options))) {
                        output += section.content;
                    }
                };
                this_1 = this;
                for (_i = 0, orderedTypes_1 = orderedTypes; _i < orderedTypes_1.length; _i++) {
                    type = orderedTypes_1[_i];
                    _loop_1(type);
                }
                return [2 /*return*/, output];
            });
        });
    };
    PromptBuilder.prototype.shouldIncludeSection = function (type, options) {
        switch (type) {
            case 'fileTree':
                return !!options.includeFileTree;
            case 'identity':
                return !!options.identity;
            case 'project':
                return !!options.projectContext;
            case 'task':
                return !!options.task;
            default:
                return true;
        }
    };
    PromptBuilder.prototype.formatProjectContext = function (context) {
        return "Type: ".concat(context.stack.type, "\nFramework: ").concat(context.stack.framework.join(', '), "\nLanguage: ").concat(context.stack.language, "\nTesting: ").concat(context.stack.testing.join(', '), "\nStyling: ").concat(context.stack.styling.join(', '), "\n").concat(context.description ? "\nDescription: ".concat(context.description) : '');
    };
    PromptBuilder.prototype.generateFileTree = function (node, depth) {
        if (depth === void 0) { depth = 0; }
        var indent = '  '.repeat(depth);
        var output = "".concat(indent).concat(node.path, "\n");
        if (node.children) {
            for (var _i = 0, _a = node.children; _i < _a.length; _i++) {
                var child = _a[_i];
                output += this.generateFileTree(child, depth + 1);
            }
        }
        return output;
    };
    PromptBuilder.prototype.formatFiles = function (files) {
        var _this = this;
        return files.map(function (file) {
            var relativePath = file.path.replace(_this.projectRoot, '')
                .replace(/^[/\\]+/, '');
            var header = "//".concat(relativePath);
            return "<".concat(file.name, ">\n").concat(header, "\n").concat(file.content || '', "\n</").concat(file.name, ">\n\n");
        }).join('');
    };
    return PromptBuilder;
}());
exports.PromptBuilder = PromptBuilder;
//# sourceMappingURL=PromptBuilder.js.map