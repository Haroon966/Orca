#!/usr/bin/env node
/**
 * Generate electron-builder icon assets from the app SVG.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');
const sourceSvg = path.join(rootDir, 'public/icons/icon-512x512.svg');
const buildDir = path.join(rootDir, 'build');
const iconsDir = path.join(buildDir, 'icons');

async function writePng(outputPath, size) {
  await sharp(sourceSvg)
    .resize(size, size)
    .png()
    .toFile(outputPath);
}

async function main() {
  await fs.mkdir(iconsDir, { recursive: true });

  await writePng(path.join(buildDir, 'icon.png'), 512);
  await writePng(path.join(iconsDir, '512x512.png'), 512);
  await writePng(path.join(iconsDir, '256x256.png'), 256);
  await writePng(path.join(iconsDir, '128x128.png'), 128);
  await writePng(path.join(iconsDir, '64x64.png'), 64);
  await writePng(path.join(iconsDir, '32x32.png'), 32);

  console.log('[icons] Generated desktop icons in build/');
}

main().catch((error) => {
  console.error('[icons] Failed to generate desktop icons:', error);
  process.exit(1);
});
