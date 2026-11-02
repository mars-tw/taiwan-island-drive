import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import sharp from 'sharp';

const root = new URL('../../', import.meta.url);
const file = name => new URL(name, root);
const res = 'android/app/src/main/res';
const master = 'ios/App/App/Assets.xcassets/TransportIconV2.appiconset/TransportIconV2-1024.png';
const densities = [['ldpi', .75], ['mdpi', 1], ['hdpi', 1.5], ['xhdpi', 2], ['xxhdpi', 3], ['xxxhdpi', 4]];

async function rgba(path, size) {
  return sharp(readFileSync(file(path))).ensureAlpha().resize(size, size).raw().toBuffer();
}
function meanDiff(a, b) {
  let sum = 0, n = 0;
  for (let i = 0; i < a.length; i += 4) { if (a[i + 3] < 250 || b[i + 3] < 250) continue; sum += Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]); n += 3; }
  return sum / n;
}

test('R47 manifest still uses the shipped ic_transport_v2 icon (no launcher selector change)', () => {
  const manifest = readFileSync(file('android/app/src/main/AndroidManifest.xml'), 'utf8');
  assert.match(manifest, /android:icon="@mipmap\/ic_transport_v2"/);
  assert.match(manifest, /android:roundIcon="@mipmap\/ic_transport_v2"/);
});

test('R47 adaptive ic_launcher XML uses full 108dp layers without the template inset', () => {
  for (const name of ['ic_launcher', 'ic_launcher_round']) {
    const xml = readFileSync(file(`${res}/mipmap-anydpi-v26/${name}.xml`), 'utf8');
    assert.match(xml, /<background android:drawable="@mipmap\/ic_launcher_background" \/>/);
    assert.match(xml, /<foreground android:drawable="@mipmap\/ic_launcher_foreground" \/>/);
    assert.doesNotMatch(xml, /inset/);
  }
});

test('R47 every density ic_launcher set is the leopard-cat master, with the foreground inside the 66dp safe zone', async () => {
  for (const [density, scale] of densities) {
    const legacy = Math.round(48 * scale), canvas = Math.round(108 * scale), art = Math.round(66 * scale);
    const inset = Math.floor((canvas - art) / 2);
    const folder = `${res}/mipmap-${density}`;
    for (const name of ['ic_launcher', 'ic_launcher_round']) {
      const m = await sharp(readFileSync(file(`${folder}/${name}.png`))).metadata();
      assert.deepEqual([m.width, m.height], [legacy, legacy], `${density} ${name}`);
    }
    const ref = await rgba(master, legacy);
    assert.ok(meanDiff(await rgba(`${folder}/ic_launcher.png`, legacy), ref) < 12, `${density} legacy matches master`);
    assert.ok(meanDiff(await rgba(`${folder}/ic_launcher_round.png`, legacy), ref) < 12, `${density} round matches master`);
    const round = await sharp(readFileSync(file(`${folder}/ic_launcher_round.png`))).ensureAlpha().raw().toBuffer();
    assert.equal(round[3], 0, `${density} round corner is transparent`);

    const fg = await sharp(readFileSync(file(`${folder}/ic_launcher_foreground.png`))).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    assert.deepEqual([fg.info.width, fg.info.height], [canvas, canvas]);
    let outside = 0, inside = 0;
    for (let y = 0; y < canvas; y++) for (let x = 0; x < canvas; x++) {
      const alpha = fg.data[(y * canvas + x) * 4 + 3];
      const inArt = x >= inset && x < inset + art && y >= inset && y < inset + art;
      if (!inArt && alpha > 0) outside++;
      if (inArt && alpha === 255) inside++;
    }
    assert.equal(outside, 0, `${density} foreground has no pixels outside the central 66dp`);
    assert.ok(inside >= art * art * .98, `${density} artwork fills the safe zone`);

    const bg = await sharp(readFileSync(file(`${folder}/ic_launcher_background.png`))).raw().toBuffer({ resolveWithObject: true });
    assert.deepEqual([bg.info.width, bg.info.height, bg.info.channels], [canvas, canvas, 3]);
    assert.deepEqual([...bg.data.subarray(0, 3)], [0x73, 0xc9, 0xf3], `${density} background is the ic_transport_v2 sky blue`);
  }
});
