export const IMAGE_FILE_EXTENSIONS = new Set([
  'png',
  'jpg',
  'jpeg',
  'gif',
  'svg',
  'webp',
  'ico',
  'bmp',
]);

export function isImageFile(filename: string): boolean {
  const extension = filename.split('.').pop()?.toLowerCase();
  return Boolean(extension && IMAGE_FILE_EXTENSIONS.has(extension));
}
