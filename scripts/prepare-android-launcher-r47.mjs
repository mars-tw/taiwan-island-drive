// R47: replace the unused template-era Android ic_launcher set with the same leopard-cat
// mascot artwork that iOS (TransportIconV2) and the manifest icon (ic_transport_v2) use.
// Technical resize only: the 1024 master is not redrawn. The manifest is not touched.
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import sharp from 'sharp';

const root = path.resolve(fileURLToPath(new URL('../', import.meta.url)));
const masterFile = 'ios/App/App/Assets.xcassets/TransportIconV2.appiconset/TransportIconV2-1024.png';
const res = 'android/app/src/main/res';
const reportFile = 'resources/branding/android-launcher-r47-report.json';
const background = { r: 0x73, g: 0xc9, b: 0xf3, alpha: 1 }; // same as @color/ic_transport_v2_background
export const densities = [['ldpi', .75], ['mdpi', 1], ['hdpi', 1.5], ['xhdpi', 2], ['xxhdpi', 3], ['xxxhdpi', 4]];
const abs = name => path.join(root, name);
const hash = bytes => createHash('sha256').update(bytes).digest('hex');

const master = await fs.readFile(abs(masterFile));
const masterHash = hash(master);
const meta = await sharp(master).metadata();
assert.equal(meta.width, 1024); assert.equal(meta.height, 1024);
const manifestBefore = await fs.readFile(abs('android/app/src/main/AndroidManifest.xml'), 'utf8');

const outputs = [];
async function save(name, pipeline, extra) {
  await pipeline.toColourspace('srgb').png({ palette: false, compressionLevel: 9 }).toFile(abs(name));
  const m = await sharp(abs(name)).metadata();
  outputs.push({ file: name, width: m.width, height: m.height, channels: m.channels, sha256: hash(await fs.readFile(abs(name))), ...extra });
}
const art = size => sharp(master).resize(size, size, { kernel: 'lanczos3' }).ensureAlpha().png().toBuffer();
const circleMask = size => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="#fff"/></svg>`);

for (const [density, scale] of densities) {
  const folder = `${res}/mipmap-${density}`;
  const legacy = Math.round(48 * scale), canvas = Math.round(108 * scale), artwork = Math.round(66 * scale);
  const inset = Math.floor((canvas - artwork) / 2);
  // Legacy square launcher: full artwork, opaque.
  await save(`${folder}/ic_launcher.png`, sharp(await art(legacy)), { density, role: 'legacy-square' });
  // Legacy round launcher: same artwork clipped to a circle, transparent corners.
  await save(`${folder}/ic_launcher_round.png`, sharp(await art(legacy)).composite([{ input: circleMask(legacy), blend: 'dest-in' }]),
    { density, role: 'legacy-round' });
  // Adaptive foreground: whole artwork inside the central 66dp safe zone of the 108dp canvas.
  await save(`${folder}/ic_launcher_foreground.png`, sharp({ create: { width: canvas, height: canvas, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: await art(artwork), left: inset, top: inset }]),
  { density, role: 'adaptive-foreground', canvasDp: 108, artworkDp: 66, insetPixels: inset });
  // Adaptive background: full 108dp canvas, the same sky blue as ic_transport_v2.
  await save(`${folder}/ic_launcher_background.png`, sharp({ create: { width: canvas, height: canvas, channels: 3, background } }).removeAlpha(),
    { density, role: 'adaptive-background', canvasDp: 108 });
}
// Layers are now full 108dp canvases, so the template's 16.7% inset is removed.
const adaptive = '<?xml version="1.0" encoding="utf-8"?>\n<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">\n'
  + '    <background android:drawable="@mipmap/ic_launcher_background" />\n'
  + '    <foreground android:drawable="@mipmap/ic_launcher_foreground" />\n</adaptive-icon>\n';
for (const name of ['ic_launcher', 'ic_launcher_round']) await fs.writeFile(abs(`${res}/mipmap-anydpi-v26/${name}.xml`), adaptive);

assert.equal(hash(await fs.readFile(abs(masterFile))), masterHash, 'master changed');
assert.equal(await fs.readFile(abs('android/app/src/main/AndroidManifest.xml'), 'utf8'), manifestBefore, 'manifest changed');
await fs.writeFile(abs(reportFile), JSON.stringify({
  schemaVersion: 1, round: 'R47', source: { file: masterFile, sha256: masterHash, width: 1024, height: 1024 },
  tools: { sharp: sharp.versions.sharp, vips: sharp.versions.vips }, background: '#73c9f3',
  manifestIcon: '@mipmap/ic_transport_v2 (unchanged)', outputs,
  nativeBinaryBuilt: false, storeUploaded: false,
}, null, 2) + '\n');
console.log(`R47 Android launcher: ${outputs.length} PNGs + 2 adaptive XML written from ${masterFile}.`);
