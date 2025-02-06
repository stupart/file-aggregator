"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PresetDialog = void 0;
//src/components/dialogs/PresetDialog.tsx
var react_1 = __importDefault(require("react"));
var material_1 = require("@mui/material");
var Edit_1 = __importDefault(require("@mui/icons-material/Edit"));
var PresetDialog = function (_a) {
    var open = _a.open, onClose = _a.onClose, presets = _a.presets, activePreset = _a.activePreset, onPresetSelect = _a.onPresetSelect, onEditPreset = _a.onEditPreset, onCreatePreset = _a.onCreatePreset;
    return (react_1.default.createElement(material_1.Dialog, { open: open, onClose: onClose },
        react_1.default.createElement(material_1.DialogTitle, null, "Manage Presets"),
        react_1.default.createElement(material_1.DialogContent, null,
            react_1.default.createElement(material_1.Box, { sx: { mb: 2 } },
                react_1.default.createElement(material_1.Typography, { variant: "subtitle1" }, "Available Presets"),
                react_1.default.createElement(material_1.List, null, presets.map(function (preset) { return (react_1.default.createElement(material_1.ListItem, { key: preset.id, secondaryAction: react_1.default.createElement(material_1.IconButton, { edge: "end", onClick: function () { return onEditPreset(preset); } },
                        react_1.default.createElement(Edit_1.default, null)) },
                    react_1.default.createElement(material_1.ListItemText, { primary: preset.name, secondary: preset.description }),
                    react_1.default.createElement(material_1.Checkbox, { checked: activePreset === preset.id, onChange: function () { return onPresetSelect(preset.id); } }))); })))),
        react_1.default.createElement(material_1.DialogActions, null,
            react_1.default.createElement(material_1.Button, { onClick: onCreatePreset }, "Create New"),
            react_1.default.createElement(material_1.Button, { onClick: onClose }, "Close"))));
};
exports.PresetDialog = PresetDialog;
//# sourceMappingURL=PresetDialog.js.map