"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isImageFile = exports.IMAGE_EXTENSIONS = void 0;
//src/utils/fileUtils.ts
// src/utils/fileUtils.ts
exports.IMAGE_EXTENSIONS = new Set([
    'jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp',
    'svg', 'ico', 'tiff', 'tif'
]);
var isImageFile = function (filename) {
    var _a;
    var extension = ((_a = filename.split('.').pop()) === null || _a === void 0 ? void 0 : _a.toLowerCase()) || '';
    return exports.IMAGE_EXTENSIONS.has(extension);
};
exports.isImageFile = isImageFile;
//# sourceMappingURL=fileUtils.js.map