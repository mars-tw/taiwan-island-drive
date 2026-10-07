import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import sharp from 'sharp';

const root = path.resolve(fileURLToPath(new URL('../', import.meta.url)));
const masterFile = 'resources/branding/game-logo-v2-master.png';
const reportFile = 'resources/branding/native-icons-v2-report.json';
const iosFolder = 'ios/App/App/Assets.xcassets/TransportIconV2.appiconset';
const androidFolder = 'android/app/src/main/res';
const background = '#173d47';
const densities = [
  ['ldpi', .75, 36], ['mdpi', 1, 48], ['hdpi', 1.5, 72],
  ['xhdpi', 2, 96], ['xxhdpi', 3, 144], ['xxxhdpi', 4, 192],
];
const generated = new Set([
  `${iosFolder}/Contents.json`, `${iosFolder}/TransportIconV2-1024.png`,
  `${androidFolder}/mipmap-anydpi-v26/ic_transport_v2.xml`,
  `${androidFolder}/values/ic_transport_v2_background.xml`,
  ...densities.flatMap(([name]) => [
    `${androidFolder}/mipmap-${name}/ic_transport_v2.png`,
    `${androidFolder}/mipmap-${name}/ic_transport_v2_foreground.png`,
  ]),
]);
const absolute = name => path.join(root, name);
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const readHash = async name => hash(await fs.readFile(absolute(name)));
async function write(name, contents) {
  assert(generated.has(name) || name === reportFile, `Unexpected output: ${name}`);
  await fs.mkdir(path.dirname(absolute(name)), { recursive: true });
  await fs.writeFile(absolute(name), contents);
}
async function originals(folder, result = new Map()) {
  for (const entry of await fs.readdir(absolute(folder), { withFileTypes: true })) {
    const name = `${folder}/${entry.name}`;
    if (entry.isDirectory()) await originals(name, result);
    else if (entry.isFile() && !generated.has(name)) result.set(name, await readHash(name));
  }
  return result;
}

// This generator writes new v2 names only; all original icons, splashes and XML stay intact.
const protectedBefore = await originals('ios/App/App/Assets.xcassets');
await originals(androidFolder, protectedBefore);
const source = await fs.readFile(absolute(masterFile));
const sourceHash = hash(source);
const input = await sharp(source).metadata();
const outputs = [];
async function imageRecord(name, size, alpha, extra = {}) {
  const metadata = await sharp(absolute(name)).metadata();
  assert.equal(metadata.width, size); assert.equal(metadata.height, size);
  assert.equal(metadata.space, 'srgb'); assert.equal(metadata.depth, 'uchar');
  assert.equal(metadata.hasAlpha, alpha); assert.equal(metadata.channels, alpha ? 4 : 3);
  if (alpha) {
    const stats = await sharp(absolute(name)).stats();
    assert.equal(stats.channels[3].min, 0); assert.equal(stats.channels[3].max, 255);
  }
  outputs.push({ file: name, width: size, height: size, depth: 8,
    colorMode: alpha ? 'RGBA' : 'RGB', alpha, sha256: await readHash(name), ...extra });
}
async function opaqueIcon(name, size) {
  await fs.mkdir(path.dirname(absolute(name)), { recursive: true });
  await sharp(source).resize(size, size, { fit: 'contain', background })
    .flatten({ background }).removeAlpha().toColourspace('srgb')
    .png({ palette: false, compressionLevel: 9 }).toFile(absolute(name));
  await imageRecord(name, size, false);
}

await opaqueIcon(`${iosFolder}/TransportIconV2-1024.png`, 1024);
await write(`${iosFolder}/Contents.json`, JSON.stringify({
  images: [{ idiom: 'universal', size: '1024x1024', filename: 'TransportIconV2-1024.png', platform: 'ios' }],
  info: { author: 'xcode', version: 1 },
}, null, 2) + '\n');
for (const [density, scale, legacySize] of densities) {
  await opaqueIcon(`${androidFolder}/mipmap-${density}/ic_transport_v2.png`, legacySize);
  const canvasSize = Math.round(108 * scale), safeSize = Math.round(72 * scale);
  const artworkSize = Math.round(66 * scale);
  const artwork = await sharp(source).resize(artworkSize, artworkSize, {
    fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 },
  }).ensureAlpha().toColourspace('srgb').png({ palette: false }).toBuffer();
  const name = `${androidFolder}/mipmap-${density}/ic_transport_v2_foreground.png`;
  const inset = Math.floor((canvasSize - artworkSize) / 2);
  await sharp({ create: { width: canvasSize, height: canvasSize, channels: 4,
    background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: artwork, left: inset, top: inset }]).toColourspace('srgb')
    .png({ palette: false, compressionLevel: 9 }).toFile(absolute(name));
  await imageRecord(name, canvasSize, true, {
    density, canvasDp: 108, safeCellDp: 72, artworkDp: 66,
    safeCellPixels: safeSize, artworkPixels: artworkSize, insetPixels: inset,
  });
}
await write(`${androidFolder}/mipmap-anydpi-v26/ic_transport_v2.xml`,
  '<?xml version="1.0" encoding="utf-8"?>\n' +
  '<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">\n' +
  '    <background android:drawable="@color/ic_transport_v2_background" />\n' +
  '    <foreground android:drawable="@mipmap/ic_transport_v2_foreground" />\n' +
  '</adaptive-icon>\n');
await write(`${androidFolder}/values/ic_transport_v2_background.xml`,
  '<?xml version="1.0" encoding="utf-8"?>\n<resources>\n' +
  `    <color name="ic_transport_v2_background">${background}</color>\n</resources>\n`);

// Change only the two explicit icon selectors, without rewriting unrelated settings.
const projectFile = 'ios/App/App.xcodeproj/project.pbxproj';
const project = await fs.readFile(absolute(projectFile), 'utf8');
const iconSetting = /ASSETCATALOG_COMPILER_APPICON_NAME = (?:AppIcon|TransportIconV2);/g;
assert.equal([...project.matchAll(iconSetting)].length, 2, 'Expected two App icon settings');
const nextProject = project.replace(iconSetting, 'ASSETCATALOG_COMPILER_APPICON_NAME = TransportIconV2;');
if (project !== nextProject) await fs.writeFile(absolute(projectFile), nextProject);
const manifestFile = 'android/app/src/main/AndroidManifest.xml';
const manifest = await fs.readFile(absolute(manifestFile), 'utf8');
const iconAttribute = /(android:(?:icon|roundIcon))="@mipmap\/(?:ic_launcher(?:_round)?|ic_transport_v2)"/g;
assert.equal([...manifest.matchAll(iconAttribute)].length, 2, 'Expected icon and roundIcon selectors');
const nextManifest = manifest.replace(iconAttribute, '$1="@mipmap/ic_transport_v2"');
if (manifest !== nextManifest) await fs.writeFile(absolute(manifestFile), nextManifest);

const protectedOriginals = [];
for (const [file, before] of protectedBefore) {
  const after = await readHash(file);
  assert.equal(after, before, `Original native resource changed: ${file}`);
  protectedOriginals.push({ file, sha256Before: before, sha256After: after, unchanged: true });
}
assert.equal(await readHash(masterFile), sourceHash, 'Original creative master changed');
assert.equal((nextProject.match(/ASSETCATALOG_COMPILER_APPICON_NAME = TransportIconV2;/g) || []).length, 2);
assert(nextManifest.includes('android:icon="@mipmap/ic_transport_v2"'));
assert(nextManifest.includes('android:roundIcon="@mipmap/ic_transport_v2"'));
await write(reportFile, JSON.stringify({
  schemaVersion: 1, source: { file: masterFile, sha256: sourceHash,
    width: input.width, height: input.height, colorMode: input.space, alpha: input.hasAlpha },
  tools: { sharp: sharp.versions.sharp, vips: sharp.versions.vips },
  background, outputs, protectedOriginals,
  references: { iOSIconSet: 'TransportIconV2', iOSConfigurationCount: 2,
    androidIcon: '@mipmap/ic_transport_v2', androidRoundIcon: '@mipmap/ic_transport_v2' },
  originalCreativeMasterUnchanged: true, originalNativeResourcesUnchanged: true,
  nativeBinaryBuilt: false, signedIpaBuilt: false, storeUploaded: false,
}, null, 2) + '\n');
console.log(`Prepared ${outputs.length} new native icon PNGs; ${protectedOriginals.length} original native resources unchanged.`);
console.log('Verified dimensions, RGB/RGBA modes, alpha padding and new iOS/Android source references. No native binary was built.');
