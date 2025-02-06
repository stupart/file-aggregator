//src/utils/fileUtils.ts
// src/utils/fileUtils.ts
export const IMAGE_EXTENSIONS = new Set([
    'jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 
    'svg', 'ico', 'tiff', 'tif'
]);

export const isImageFile = (filename: string): boolean => {
    const extension = filename.split('.').pop()?.toLowerCase() || '';
    return IMAGE_EXTENSIONS.has(extension);
};