"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.usePresetManager = void 0;
//src/hooks/usePresetManager.ts
var react_1 = require("react");
var usePresetManager = function (onExclusionChange) {
    var _a = (0, react_1.useState)(null), activePreset = _a[0], setActivePreset = _a[1];
    var _b = (0, react_1.useState)([]), presets = _b[0], setPresets = _b[1];
    var handlePresetSelect = (0, react_1.useCallback)(function (presetId) {
        setActivePreset(presetId);
        var selectedPreset = presets.find(function (p) { return p.id === presetId; });
        if (selectedPreset) {
            onExclusionChange(selectedPreset.exclusions);
        }
    }, [presets, onExclusionChange]);
    var handleEditPreset = function (preset) {
        // TODO: Implement preset editing
        console.log('Editing preset:', preset);
    };
    var handleCreatePreset = function () {
        // TODO: Implement preset creation
        console.log('Creating new preset');
    };
    return {
        activePreset: activePreset,
        setActivePreset: setActivePreset,
        presets: presets,
        setPresets: setPresets,
        handlePresetSelect: handlePresetSelect,
        handleEditPreset: handleEditPreset,
        handleCreatePreset: handleCreatePreset
    };
};
exports.usePresetManager = usePresetManager;
//# sourceMappingURL=usePresetManager.js.map