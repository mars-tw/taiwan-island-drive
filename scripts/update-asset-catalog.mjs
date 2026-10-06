import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const catalogFile = resolve(root, 'public/models/catalog.json');
const catalog = JSON.parse(await readFile(catalogFile, 'utf8'));
const activeAtlases = { car: 'car-detail-atlas.png', train: 'train-detail-atlas.png', flight: 'flight-detail-atlas.png' };
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
for (const group of catalog.groups) {
  const atlas = activeAtlases[group.id];
  group.textures = [{ file: atlas, publicPath: `textures/${atlas}`, repositoryPath: `public/textures/${atlas}`, source: 'built-in image_gen', grid: [4,4], tileMap: `docs/realism/${group.id}/tile-map.json`, sha256: sha(await readFile(resolve(root, `public/textures/${atlas}`))) }];
  for (const entry of group.models) {
    const data = await readFile(resolve(root, entry.repositoryPath));
    const document = JSON.parse(data.subarray(20, 20 + data.readUInt32LE(12)).toString('utf8').trim());
    entry.bytes = data.byteLength; entry.sha256 = sha(data);
    entry.meshes = document.meshes?.length || 0; entry.nodes = document.nodes?.length || 0;
    entry.embeddedImages = document.images?.length || 0;
    entry.drawCalls = (document.meshes || []).reduce((sum, mesh) => sum + mesh.primitives.length, 0);
    entry.triangles = (document.meshes || []).reduce((sum, mesh) => sum + mesh.primitives.reduce((n,p) => n + (document.accessors[p.indices ?? p.attributes.POSITION].count / 3), 0), 0);
    entry.texturedMaterials = (document.materials || []).filter(m => m.pbrMetallicRoughness?.baseColorTexture).length;
  }
}
catalog.schemaVersion = 2; catalog.visualVersion = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8')).version;
catalog.textures = catalog.groups.flatMap(group => group.textures.map(texture => ({
  id: group.id, ...texture, file: texture.repositoryPath, mapping: 'UV 4x4 per-face atlas'
})));
catalog.textureCount = catalog.textures.length; catalog.historicalTextures = ['textures/train.png', 'textures/aircraft.png'];
await writeFile(catalogFile, JSON.stringify(catalog, null, 2) + '\n');
console.log(`Catalog refreshed: ${catalog.modelCount} models, three 16-tile IMG atlases.`);
