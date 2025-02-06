"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useUIState = void 0;
//src/hooks/useUIState.ts
var react_1 = require("react");
var useUIState = function () {
    var _a = (0, react_1.useState)(false), configDialogOpen = _a[0], setConfigDialogOpen = _a[1];
    var _b = (0, react_1.useState)(false), presetDialogOpen = _b[0], setPresetDialogOpen = _b[1];
    var _c = (0, react_1.useState)(false), snackbarOpen = _c[0], setSnackbarOpen = _c[1];
    var _d = (0, react_1.useState)(''), snackbarMessage = _d[0], setSnackbarMessage = _d[1];
    var showSnackbar = function (message) {
        setSnackbarMessage(message);
        setSnackbarOpen(true);
    };
    return {
        configDialogOpen: configDialogOpen,
        setConfigDialogOpen: setConfigDialogOpen,
        presetDialogOpen: presetDialogOpen,
        setPresetDialogOpen: setPresetDialogOpen,
        snackbarOpen: snackbarOpen,
        setSnackbarOpen: setSnackbarOpen,
        snackbarMessage: snackbarMessage,
        showSnackbar: showSnackbar
    };
};
exports.useUIState = useUIState;
//# sourceMappingURL=useUIState.js.map