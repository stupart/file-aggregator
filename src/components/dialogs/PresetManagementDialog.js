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
exports.PresetManagementDialog = void 0;
var react_1 = __importStar(require("react"));
var material_1 = require("@mui/material");
var Edit_1 = __importDefault(require("@mui/icons-material/Edit"));
var Delete_1 = __importDefault(require("@mui/icons-material/Delete"));
var Add_1 = __importDefault(require("@mui/icons-material/Add"));
var PresetManagementDialog = function (_a) {
    var open = _a.open, onClose = _a.onClose, presets = _a.presets, activePreset = _a.activePreset, currentConfig = _a.currentConfig, onPresetSelect = _a.onPresetSelect, onPresetSave = _a.onPresetSave, onPresetDelete = _a.onPresetDelete;
    var _b = (0, react_1.useState)(null), editingPreset = _b[0], setEditingPreset = _b[1];
    var _c = (0, react_1.useState)(false), isCreating = _c[0], setIsCreating = _c[1];
    var _d = (0, react_1.useState)({
        name: '',
        description: '',
    }), formData = _d[0], setFormData = _d[1];
    var handleCreateNew = function () {
        setIsCreating(true);
        setFormData({ name: '', description: '' });
    };
    var handleEdit = function (preset) {
        setEditingPreset(preset);
        setFormData({
            name: preset.name,
            description: preset.description,
        });
    };
    var handleSave = function () { return __awaiter(void 0, void 0, void 0, function () {
        var newPreset;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!formData.name.trim())
                        return [2 /*return*/];
                    newPreset = {
                        id: (editingPreset === null || editingPreset === void 0 ? void 0 : editingPreset.id) || "preset-".concat(Date.now()),
                        name: formData.name,
                        description: formData.description,
                        exclusions: (editingPreset === null || editingPreset === void 0 ? void 0 : editingPreset.exclusions) || currentConfig,
                        outputFormat: (editingPreset === null || editingPreset === void 0 ? void 0 : editingPreset.outputFormat) || {
                            destination: 'AIREADME.txt',
                            format: {
                                includeProjectContext: true,
                                includeFileTree: true,
                                fileComments: true,
                                separators: true,
                            }
                        },
                        includeContext: (editingPreset === null || editingPreset === void 0 ? void 0 : editingPreset.includeContext) || {
                            stack: true,
                            description: true,
                            dependencies: true,
                            scripts: true,
                        }
                    };
                    return [4 /*yield*/, onPresetSave(newPreset)];
                case 1:
                    _a.sent();
                    resetForm();
                    return [2 /*return*/];
            }
        });
    }); };
    var handleDelete = function (presetId) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!window.confirm('Are you sure you want to delete this preset?')) return [3 /*break*/, 2];
                    return [4 /*yield*/, onPresetDelete(presetId)];
                case 1:
                    _a.sent();
                    _a.label = 2;
                case 2: return [2 /*return*/];
            }
        });
    }); };
    var resetForm = function () {
        setEditingPreset(null);
        setIsCreating(false);
        setFormData({ name: '', description: '' });
    };
    var renderPresetForm = function () { return (react_1.default.createElement(material_1.Box, { sx: { mt: 2, mb: 2 } },
        react_1.default.createElement(material_1.Typography, { variant: "h6" }, isCreating ? 'Create New Preset' : 'Edit Preset'),
        react_1.default.createElement(material_1.TextField, { fullWidth: true, label: "Preset Name", value: formData.name, onChange: function (e) { return setFormData(function (prev) { return (__assign(__assign({}, prev), { name: e.target.value })); }); }, margin: "normal", size: "small" }),
        react_1.default.createElement(material_1.TextField, { fullWidth: true, label: "Description", value: formData.description, onChange: function (e) { return setFormData(function (prev) { return (__assign(__assign({}, prev), { description: e.target.value })); }); }, margin: "normal", size: "small", multiline: true, rows: 2 }),
        react_1.default.createElement(material_1.Box, { sx: { mt: 2, display: 'flex', gap: 1 } },
            react_1.default.createElement(material_1.Button, { variant: "contained", onClick: handleSave, disabled: !formData.name.trim() }, "Save"),
            react_1.default.createElement(material_1.Button, { onClick: resetForm }, "Cancel")))); };
    return (react_1.default.createElement(material_1.Dialog, { open: open, onClose: onClose, maxWidth: "md", fullWidth: true },
        react_1.default.createElement(material_1.DialogTitle, null,
            react_1.default.createElement(material_1.Box, { sx: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } },
                "Manage Presets",
                react_1.default.createElement(material_1.Button, { startIcon: react_1.default.createElement(Add_1.default, null), onClick: handleCreateNew, disabled: isCreating || !!editingPreset }, "Create New"))),
        react_1.default.createElement(material_1.DialogContent, null,
            (isCreating || editingPreset) && renderPresetForm(),
            !isCreating && !editingPreset && (react_1.default.createElement(material_1.List, null, presets.map(function (preset) { return (react_1.default.createElement(react_1.default.Fragment, { key: preset.id },
                react_1.default.createElement(material_1.ListItem, null,
                    react_1.default.createElement(material_1.ListItemText, { primary: react_1.default.createElement(material_1.Box, { sx: { display: 'flex', alignItems: 'center', gap: 1 } },
                            preset.name,
                            activePreset === preset.id && (react_1.default.createElement(material_1.Chip, { label: "Active", size: "small", color: "primary", variant: "outlined" }))), secondary: preset.description }),
                    react_1.default.createElement(material_1.ListItemSecondaryAction, null,
                        react_1.default.createElement(material_1.Tooltip, { title: "Edit" },
                            react_1.default.createElement(material_1.IconButton, { edge: "end", onClick: function () { return handleEdit(preset); }, sx: { mr: 1 } },
                                react_1.default.createElement(Edit_1.default, null))),
                        react_1.default.createElement(material_1.Tooltip, { title: "Delete" },
                            react_1.default.createElement(material_1.IconButton, { edge: "end", onClick: function () { return handleDelete(preset.id); } },
                                react_1.default.createElement(Delete_1.default, null))))),
                react_1.default.createElement(material_1.Divider, null))); })))),
        react_1.default.createElement(material_1.DialogActions, null,
            react_1.default.createElement(material_1.Button, { onClick: onClose }, "Save Preset"))));
};
exports.PresetManagementDialog = PresetManagementDialog;
//# sourceMappingURL=PresetManagementDialog.js.map