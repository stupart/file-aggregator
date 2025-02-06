"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useFileTree = void 0;
//src/components/FileTree/useFileTree.ts
var react_1 = require("react");
var useFileTree = function (_a) {
    var _b = _a.initialSelected, initialSelected = _b === void 0 ? new Set() : _b, exclusionConfig = _a.exclusionConfig, onSelectionChange = _a.onSelectionChange;
    var _c = (0, react_1.useState)(initialSelected), selectedFiles = _c[0], setSelectedFiles = _c[1];
    var _d = (0, react_1.useState)(new Set()), loadingFiles = _d[0], setLoadingFiles = _d[1];
    // Check if a node or any of its ancestors are excluded
    var isNodeExcluded = (0, react_1.useCallback)(function (node) {
        // Check node itself
        if (exclusionConfig.global.files.includes(node.name) ||
            exclusionConfig.global.folders.includes(node.name)) {
            return true;
        }
        // Check ancestors
        var pathParts = node.path.split('/');
        for (var i = 0; i < pathParts.length; i++) {
            var parentFolder = pathParts[i];
            if (exclusionConfig.global.folders.includes(parentFolder)) {
                return true;
            }
        }
        return false;
    }, [exclusionConfig]);
    // Clean up selections when exclusions change
    (0, react_1.useEffect)(function () {
        setSelectedFiles(function (prev) {
            var newSelected = new Set(prev);
            Array.from(newSelected).forEach(function (path) {
                var pathNode = { path: path, name: path.split('/').pop() || '' };
                if (isNodeExcluded(pathNode)) {
                    newSelected.delete(path);
                }
            });
            return newSelected;
        });
    }, [exclusionConfig, isNodeExcluded]);
    // Get all selectable descendants
    var getSelectableDescendants = (0, react_1.useCallback)(function (node) {
        if (isNodeExcluded(node)) {
            return [];
        }
        var paths = [];
        // Only add this node if it's not excluded
        if (!isNodeExcluded(node)) {
            paths.push(node.path);
        }
        if (node.children && !exclusionConfig.behaviors.hideContents.includes(node.name)) {
            node.children.forEach(function (child) {
                if (!isNodeExcluded(child)) {
                    paths = __spreadArray(__spreadArray([], paths, true), getSelectableDescendants(child), true);
                }
            });
        }
        return paths;
    }, [exclusionConfig, isNodeExcluded]);
    var handleCheckboxChange = (0, react_1.useCallback)(function (node, checked) {
        if (isNodeExcluded(node)) {
            return;
        }
        setSelectedFiles(function (prev) {
            var newSelected = new Set(prev);
            var affectedPaths = getSelectableDescendants(node);
            affectedPaths.forEach(function (path) {
                if (checked) {
                    newSelected.add(path);
                }
                else {
                    newSelected.delete(path);
                }
            });
            return newSelected;
        });
    }, [getSelectableDescendants, isNodeExcluded]);
    // Notify parent of changes
    (0, react_1.useEffect)(function () {
        if (onSelectionChange) {
            onSelectionChange(selectedFiles);
        }
    }, [selectedFiles, onSelectionChange]);
    var setLoadingFile = (0, react_1.useCallback)(function (path, isLoading) {
        setLoadingFiles(function (prev) {
            var next = new Set(prev);
            if (isLoading) {
                next.add(path);
            }
            else {
                next.delete(path);
            }
            return next;
        });
    }, []);
    return {
        selectedFiles: selectedFiles,
        loadingFiles: loadingFiles,
        handleCheckboxChange: handleCheckboxChange,
        isNodeExcluded: isNodeExcluded,
        setSelectedFiles: setSelectedFiles,
        setLoadingFile: setLoadingFile
    };
};
exports.useFileTree = useFileTree;
//# sourceMappingURL=useFileTree.js.map