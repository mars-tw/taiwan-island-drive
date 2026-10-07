import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import sharp from 'sharp';

const project = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const logo = 'resources/branding/game-logo-v2-master.png';
const wordmark = 'resources/branding/game-wordmark-v2.png';
const inputs = {
  [logo]: await readFile(resolve(project, logo)),
  [wordmark]: await readFile(resolve(project, wordmark))
};
const originals = {
  [logo]: '6ae5e2390d99983bcb7db32a5a4755e42f289f22ce0cb10614e2d509a31d7286',
  [wordmark]: '7f24770f8317f2c69ba3f686092804c19e50082ae517a77210d8e1ba556e6362'
};
const hash = data => createHash('sha256').update(data).digest('hex');
for (const [file, data] of Object.entries(inputs)) {
  assert.equal(hash(data), originals[file], `Original v2 source changed: ${file}`);
}

// All writable paths are explicit v2 siblings. Raw originals and legacy assets are read-only.
const recipe = [
  { path: logo, generatedSource: 'exec-63f49355-78d1-4f18-9b7d-dfd3d84e3f06.png', method: 'unchanged_generated_original' },
  { path: wordmark, generatedSource: 'exec-d7fa7524-ea6f-4354-bb65-3653b8f83433.png', method: 'unchanged_generated_original' },
  { path: 'store/assets/app-store-icon-v2-1024.png', source: logo, size: 1024, method: 'technical_resize_lanczos3_rgb' },
  { path: 'store/assets/google-play-icon-v2-512.png', source: logo, size: 512, method: 'technical_resize_lanczos3_rgb' },
  { path: 'public/branding/icon-v2-192.png', source: logo, size: 192, method: 'technical_resize_lanczos3_rgb' },
  { path: 'public/branding/icon-v2-512.png', source: logo, size: 512, method: 'technical_resize_lanczos3_rgb' },
  { path: 'public/branding/wordmark-v2.png', source: wordmark, method: 'unchanged_copy_alpha_preserved' }
];
const assets = [];
for (const record of recipe) {
  let data = inputs[record.path] ?? inputs[record.source];
  if (record.source) {
    if (record.size) {
      data = await sharp(data)
        .resize(record.size, record.size, { kernel: sharp.kernel.lanczos3 })
        .removeAlpha().toColourspace('srgb')
        .png({ compressionLevel: 9, adaptiveFiltering: true }).toBuffer();
    }
    await mkdir(dirname(resolve(project, record.path)), { recursive: true });
    await writeFile(resolve(project, record.path), data);
  }
  const metadata = await sharp(data).metadata();
  if (record.size) {
    assert.equal(metadata.width, record.size);
    assert.equal(metadata.height, record.size);
    assert.equal(metadata.channels, 3);
    assert.equal(metadata.hasAlpha, false);
  } else if (record.path.includes('wordmark')) {
    assert.equal(metadata.hasAlpha, true);
  }
  assets.push({
    path: record.path, width: metadata.width, height: metadata.height,
    mode: metadata.hasAlpha ? 'RGBA' : 'RGB', channels: metadata.channels,
    alpha: metadata.hasAlpha, bytes: data.length, sha256: hash(data), method: record.method,
    ...(record.source ? { source: record.source } : { generatedSource: record.generatedSource })
  });
}
const manifest = {
  schemaVersion: 1, brandVersion: 2, generationDate: '2026-10-07',
  generator: 'OpenAI built-in image_gen', builtInImagegen: true,
  originalsCopiedUnchanged: true, creativeEditsPerformed: false,
  technicalResizeLibrary: 'project sharp', preparationScript: 'scripts/prepare-branding-v2.mjs',
  promptProvenance: 'docs/branding/imagegen-prompts-v2.md',
  rootStyleAndWordmarkTextApproved: true, assets,
  webIntegration: {
    status: 'versioned_icon_and_header_references_updated',
    manifest: 'public/manifest.webmanifest', header: 'index.html',
    gameIconReferences: ['car/index.html', 'train/index.html', 'flight/index.html']
  },
  nativeIntegrationPending: false,
  nativeIntegration: {
    status: 'source_icons_integrated_binary_rebuild_pending', assetCatalogRegenerated: true,
    report: 'resources/branding/native-icons-v2-report.json',
    signedIpaRegenerated: false, nativeScreenshotsRegenerated: false,
    newStoreIconsUploaded: false, existingNativeAndStoreIconsPreserved: true
  }
};
await writeFile(resolve(project, 'resources/branding/manifest-v2.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(JSON.stringify({ pngAssets: assets.length, rgbIcons: 4, transparentWordmarks: 2, nativeSourceIntegrated: true, signedBinaryRebuildPending: true }));
