/** Independent, dependency-free inspection of the eight delivered vehicle GLBs. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TOLERANCE = 1e-4;
const FAMILIES = {
  car: ['coupe', 'rally', 'suv', 'van'],
  train: ['train', 'train-cab'],
  flight: ['aircraft', 'aircraft-cab'],
};
const COMPONENTS = {
  5120: { bytes: 1, read: 'readInt8', normalized: n => Math.max(n / 127, -1) },
  5121: { bytes: 1, read: 'readUInt8', normalized: n => n / 255 },
  5122: { bytes: 2, read: 'readInt16LE', normalized: n => Math.max(n / 32767, -1) },
  5123: { bytes: 2, read: 'readUInt16LE', normalized: n => n / 65535 },
  5125: { bytes: 4, read: 'readUInt32LE', normalized: n => n / 4294967295 },
  5126: { bytes: 4, read: 'readFloatLE', normalized: n => n },
};
const WIDTHS = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 };
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const sha256 = data => crypto.createHash('sha256').update(data).digest('hex');
const relative = filename => path.relative(ROOT, filename).split(path.sep).join('/');

export function parseGlb(data, name = 'GLB') {
  assert(data.length >= 20 && data.readUInt32LE(0) === 0x46546c67, `${name}: invalid GLB magic/header`);
  assert(data.readUInt32LE(4) === 2, `${name}: expected glTF 2.0`);
  assert(data.readUInt32LE(8) === data.length, `${name}: incomplete file / header length mismatch`);
  let offset = 12, json, binary;
  while (offset < data.length) {
    assert(offset + 8 <= data.length, `${name}: truncated chunk header`);
    const size = data.readUInt32LE(offset), type = data.readUInt32LE(offset + 4);
    assert(offset !== 12 || type === 0x4e4f534a, `${name}: first chunk must be JSON`);
    assert(size % 4 === 0 && offset + 8 + size <= data.length, `${name}: invalid chunk alignment/length`);
    const chunk = data.subarray(offset + 8, offset + 8 + size);
    if (type === 0x4e4f534a) {
      assert(!json, `${name}: duplicate JSON chunk`);
      json = JSON.parse(chunk.toString('utf8').replace(/\0+$/, '').trim());
    } else if (type === 0x004e4942) {
      assert(!binary, `${name}: duplicate BIN chunk`); binary = chunk;
    }
    offset += size + 8;
  }
  assert(json && binary, `${name}: missing JSON or BIN chunk`);
  assert(json.asset?.version === '2.0', `${name}: unsupported glTF asset version`);
  assert(json.buffers?.length === 1 && !json.buffers[0].uri && json.buffers[0].byteLength <= binary.length,
    `${name}: expected one embedded GLB buffer`);
  return { json, binary };
}

function viewRange(gltf, binary, index) {
  const view = gltf.bufferViews?.[index];
  assert(view && (view.buffer ?? 0) === 0, `Invalid / external bufferView ${index}`);
  const offset = view.byteOffset ?? 0;
  assert(Number.isInteger(offset) && offset >= 0 && Number.isInteger(view.byteLength) && view.byteLength >= 0 &&
    offset + view.byteLength <= Math.min(binary.length, gltf.buffers[0].byteLength), `bufferView ${index} exceeds the embedded buffer`);
  return { view, offset, end: offset + view.byteLength };
}

/** Decode interleaved, offset, normalized and sparse glTF accessor data. */
export function readAccessor(gltf, binary, index) {
  const accessor = gltf.accessors?.[index], component = COMPONENTS[accessor?.componentType];
  const width = WIDTHS[accessor?.type];
  assert(accessor && component && width, `Invalid accessor ${index}: type/componentType`);
  assert(Number.isInteger(accessor.count) && accessor.count >= 0 && accessor.count <= binary.length * 2,
    `Invalid accessor ${index}: count`);
  const values = Array.from({ length: accessor.count }, () => Array(width).fill(0));
  const readValue = offset => {
    const value = binary[component.read](offset);
    assert(Number.isFinite(value), `Accessor ${index}: non-finite component`);
    return accessor.normalized ? component.normalized(value) : value;
  };
  if (accessor.bufferView !== undefined) {
    const { view, offset, end } = viewRange(gltf, binary, accessor.bufferView);
    const start = offset + (accessor.byteOffset ?? 0), stride = view.byteStride ?? component.bytes * width;
    assert(stride >= component.bytes * width && stride % component.bytes === 0,
      `Accessor ${index}: invalid byteStride ${stride}`);
    assert(start >= offset && (accessor.count === 0 || start + (accessor.count - 1) * stride + component.bytes * width <= end),
      `Accessor ${index}: data exceeds bufferView`);
    for (let row = 0; row < accessor.count; row++)
      for (let column = 0; column < width; column++) values[row][column] = readValue(start + row * stride + column * component.bytes);
  }
  if (accessor.sparse) {
    const sparse = accessor.sparse, indexType = COMPONENTS[sparse.indices.componentType];
    assert([5121, 5123, 5125].includes(sparse.indices.componentType) && indexType && sparse.count <= accessor.count,
      `Accessor ${index}: invalid sparse indices/count`);
    const indices = viewRange(gltf, binary, sparse.indices.bufferView);
    const entries = viewRange(gltf, binary, sparse.values.bufferView);
    const indexStart = indices.offset + (sparse.indices.byteOffset ?? 0);
    const valueStart = entries.offset + (sparse.values.byteOffset ?? 0);
    assert(indexStart + sparse.count * indexType.bytes <= indices.end && valueStart + sparse.count * width * component.bytes <= entries.end,
      `Accessor ${index}: sparse data exceeds bufferView`);
    let previous = -1;
    for (let row = 0; row < sparse.count; row++) {
      const target = binary[indexType.read](indexStart + row * indexType.bytes);
      assert(target > previous && target < accessor.count, `Accessor ${index}: invalid sparse target ${target}`);
      previous = target;
      for (let column = 0; column < width; column++) values[target][column] = readValue(valueStart + (row * width + column) * component.bytes);
    }
  }
  return values;
}

function pngInfo(data, label) {
  assert(data.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])), `${label}: invalid PNG signature`);
  const chunks = []; let offset = 8, dimensions;
  while (offset < data.length) {
    assert(offset + 12 <= data.length, `${label}: truncated PNG chunk`);
    const length = data.readUInt32BE(offset), type = data.toString('ascii', offset + 4, offset + 8);
    assert(offset + length + 12 <= data.length, `${label}: invalid PNG chunk length`);
    if (type === 'IHDR') dimensions = [data.readUInt32BE(offset + 8), data.readUInt32BE(offset + 12)];
    chunks.push(type); offset += length + 12;
    if (type === 'IEND') break;
  }
  assert(dimensions?.[0] > 0 && dimensions[1] > 0 && chunks.at(-1) === 'IEND', `${label}: missing PNG IHDR/IEND`);
  return { dimensions, pngChunks: chunks.filter((value, index, all) => all.indexOf(value) === index) };
}

function privatePathCheck(data, label) {
  const text = data.toString('latin1');
  const matches = [/[A-Za-z]:[\\/]+Users[\\/]+/i, /\/Users\/[^/\0\s]+\//, /\/home\/[^/\0\s]+\//]
    .filter(pattern => pattern.test(text));
  assert(matches.length === 0, `${label}: private home-directory path embedded in distributable data`);
  return { homePathMatchCount: matches.length, bytesScanned: data.length };
}

function materialTile(material) {
  const extras = material.extras ?? {};
  if (extras.tile_id !== undefined) return Number(extras.tile_id);
  if (extras.tileId !== undefined) return Number(extras.tileId);
  if (extras.atlas_tile !== undefined) return Number(extras.atlas_tile) + 1;
  if (extras.tile_index !== undefined) return Number(extras.tile_index) + 1;
  return null;
}

function effectiveUv(uv, texture) {
  const transform = texture.extensions?.KHR_texture_transform;
  assert((transform?.texCoord ?? texture.texCoord ?? 0) === 0, 'Atlas material must use TEXCOORD_0');
  if (!transform) return uv;
  const scale = transform.scale ?? [1, 1], offset = transform.offset ?? [0, 0], angle = transform.rotation ?? 0;
  const u = uv[0] * scale[0], v = uv[1] * scale[1];
  return [offset[0] + Math.cos(angle) * u - Math.sin(angle) * v,
    offset[1] + Math.sin(angle) * u + Math.cos(angle) * v];
}

function verifyDynamicNodes(gltf, id) {
  let required=[];
  if (FAMILIES.car.includes(id)) required=['WheelFL','WheelFR','WheelRL','WheelRR'];
  else if (id==='train') required=['DriverAnchor'];
  else if (id==='train-cab') required=['TractionLever','BrakeLever'];
  else if (id==='aircraft') required=['PropellerRoot','AileronLeft','AileronRight','FlapLeft','FlapRight','Elevator','Rudder'];
  else if (id==='aircraft-cab') required=['YokeLeft','YokeRight'];
  const nodes=gltf.nodes ?? [];
  function descendantMeshes(index, seen=new Set()) {
    assert(!seen.has(index), `${id}: cyclic node hierarchy`); seen.add(index);
    const node=nodes[index]; assert(node,`${id}: invalid child node ${index}`);
    return (node.mesh!==undefined ? 1 : 0)+(node.children ?? []).reduce((n,child)=>n+descendantMeshes(child,new Set(seen)),0);
  }
  return required.map(name=>{
    const matches=nodes.map((node,index)=>({node,index})).filter(({node})=>
      FAMILIES.car.includes(id) ? new RegExp(`^${name}(?:\\.\\d+)?$`).test(node.name ?? '') : node.name===name);
    assert(matches.length===1,`${id}: missing / duplicated runtime node ${name}`);
    const {node,index}=matches[0], meshes=descendantMeshes(index);
    const surface=/Aileron|Flap|Elevator|Rudder/.test(name), anchor=name==='DriverAnchor';
    if (surface) assert(node.mesh!==undefined,`${id}: ${name} has no actual control-surface mesh`);
    else if (!anchor) assert(node.mesh===undefined && node.children?.length>0 && meshes>0,`${id}: ${name} has no animated pivot children`);
    return {name:node.name,nodeIndex:index,nodeType:anchor?'staticDriverAnchor':surface?'controlSurfaceMesh':'animationPivotGroup',
      directChildren:node.children?.length ?? 0,descendantMeshCount:meshes,translation:node.translation ?? [0,0,0],
      rotationQuaternion:node.rotation ?? [0,0,0,1],scale:node.scale ?? [1,1,1]};
  });
}

function verifyVehicle(family, id, tiles, sourceTexture) {
  const filename = path.join(ROOT, 'public', 'models', `${id}.glb`), data = fs.readFileSync(filename);
  privatePathCheck(data, `${id}.glb`);
  const { json: gltf, binary } = parseGlb(data, `${id}.glb`);
  const images = (gltf.images ?? []).map((image, index) => {
    assert(['image/png', 'image/jpeg'].includes(image.mimeType) && image.bufferView !== undefined && !image.uri,
      `${id}: image ${index} is not an embedded PNG/JPEG`);
    const { offset, end } = viewRange(gltf, binary, image.bufferView), bytes = binary.subarray(offset, end);
    const info = image.mimeType === 'image/png' ? pngInfo(bytes, `${id} image ${index}`) : {};
    const scan = privatePathCheck(bytes, `${id} image ${index}`);
    return { index, name: image.name ?? null, mimeType: image.mimeType, bytes: bytes.length, sha256: sha256(bytes),
      matchesFamilySourceBytes: bytes.equals(sourceTexture.data), ...info, privatePathScan: scan };
  });
  assert(images.length > 0, `${id}: no embedded texture image`);
  const counters = new Map(tiles.map(tile => [tile.tileId, {
    tileId: tile.tileId, label: tile.label, uvRect: tile.uvRect, uvVertexCount: 0, indexReferenceCount: 0,
    primitiveCount: 0, triangleCount: 0, uvMin: [Infinity, Infinity], uvMax: [-Infinity, -Infinity], materialNames: new Set(), objects: new Set(), imageIndices: new Set(),
  }]));
  let triangles = 0, drawCalls = 0, texturedPrimitives = 0, untexturedPrimitives = 0, uvVertices = 0;
  const owners = new Map();
  (gltf.nodes ?? []).forEach((node, index) => {
    if (node.mesh !== undefined) {
      if (!owners.has(node.mesh)) owners.set(node.mesh, []);
      owners.get(node.mesh).push(node.name ?? `node_${index}`);
    }
  });
  (gltf.meshes ?? []).forEach((mesh, meshIndex) => {
    for (const [primitiveIndex, primitive] of mesh.primitives.entries()) {
      const material = gltf.materials?.[primitive.material];
      assert(material, `${id}: mesh ${meshIndex} primitive ${primitiveIndex} has no material`);
      const tileId = materialTile(material), texture = material.pbrMetallicRoughness?.baseColorTexture;
      const count = primitive.indices !== undefined ? gltf.accessors[primitive.indices].count : gltf.accessors[primitive.attributes.POSITION]?.count;
      assert(Number.isInteger(count) && count > 0, `${id}: empty / invalid primitive`);
      const mode = primitive.mode ?? 4, triangleCount = mode === 4 ? count / 3 : (mode === 5 || mode === 6 ? Math.max(0, count - 2) : 0);
      assert(Number.isInteger(triangleCount), `${id}: invalid triangle index count`);
      triangles += triangleCount; drawCalls++;
      if (tileId === null) {
        assert(!texture, `${id}: textured material ${material.name} is missing semantic tile metadata`);
        untexturedPrimitives++; continue;
      }
      assert(Number.isInteger(tileId) && counters.has(tileId), `${id}: unknown material tile ${tileId}`);
      assert(texture && gltf.textures?.[texture.index], `${id}: tile ${tileId} has no BaseColorTexture`);
      const imageIndex = gltf.textures[texture.index].source;
      assert(images[imageIndex], `${id}: tile ${tileId} does not reference an embedded source image`);
      assert(primitive.attributes.TEXCOORD_0 !== undefined, `${id}: tile ${tileId} has no TEXCOORD_0`);
      const accessor = gltf.accessors[primitive.attributes.TEXCOORD_0];
      assert(accessor.type === 'VEC2', `${id}: UV accessor must be VEC2`);
      const coordinates = readAccessor(gltf, binary, primitive.attributes.TEXCOORD_0);
      const counter = counters.get(tileId), [umin, vmin, umax, vmax] = counter.uvRect;
      for (const [index, raw] of coordinates.entries()) {
        const transformed = effectiveUv(raw, texture), uv = [transformed[0], 1 - transformed[1]];
        assert(uv[0] >= umin - TOLERANCE && uv[0] <= umax + TOLERANCE && uv[1] >= vmin - TOLERANCE && uv[1] <= vmax + TOLERANCE,
          `${id}: ${material.name} tile ${tileId} UV ${index} leaks outside inset rectangle (${uv.join(', ')})`);
        for (let axis = 0; axis < 2; axis++) {
          counter.uvMin[axis] = Math.min(counter.uvMin[axis], uv[axis]);
          counter.uvMax[axis] = Math.max(counter.uvMax[axis], uv[axis]);
        }
      }
      counter.uvVertexCount += coordinates.length; counter.indexReferenceCount += count;
      counter.primitiveCount++; counter.triangleCount += triangleCount; counter.materialNames.add(material.name);
      counter.imageIndices.add(imageIndex); (owners.get(meshIndex) ?? [mesh.name ?? `mesh_${meshIndex}`]).forEach(name => counter.objects.add(name));
      texturedPrimitives++; uvVertices += coordinates.length;
    }
  });
  const usedTiles = [...counters.values()].filter(tile => tile.uvVertexCount > 0);
  if (family === 'car') assert(usedTiles.length === 16, `${id}: car must use all 16 atlas tiles, got ${usedTiles.length}`);
  const glasses = (gltf.materials ?? []).filter(material => /glass|glaz|window|windshield|windscreen|canopy/i.test(material.name ?? '')).map(material => ({
    name: material.name, alphaMode: material.alphaMode ?? 'OPAQUE', alpha: material.pbrMetallicRoughness?.baseColorFactor?.[3] ?? 1,
    transmission: material.extensions?.KHR_materials_transmission?.transmissionFactor ?? 0,
  }));
  const transparentGlassCount = glasses.filter(glass => glass.alphaMode === 'BLEND' && glass.alpha > 0 && glass.alpha < 1).length;
  const groups = (gltf.nodes ?? []).filter(node => node.mesh === undefined && node.children?.length).map(node => node.name ?? '(unnamed)');
  return { family, id, file: relative(filename), bytes: data.length, sha256: sha256(data), triangles, drawCalls,
    meshCount: gltf.meshes?.length ?? 0, materialCount: gltf.materials?.length ?? 0, imageCount: images.length,
    nodeCount: gltf.nodes?.length ?? 0, texturedPrimitiveCount: texturedPrimitives, untexturedPrimitiveCount: untexturedPrimitives,
    uvVertexCount: uvVertices, usedTileIds: usedTiles.map(tile => tile.tileId), transparentGlassCount, glassMaterials: glasses,
    animationGroups: groups, dynamicNodeVerification: verifyDynamicNodes(gltf,id), images, tiles: [...counters.values()].map(tile => ({ ...tile,
      uvMin: tile.uvVertexCount ? tile.uvMin : null, uvMax: tile.uvVertexCount ? tile.uvMax : null,
      materialNames: [...tile.materialNames], objects: [...tile.objects], imageIndices: [...tile.imageIndices],
    })) };
}

export function verifyAllVehicles() {
  const families = [], vehicles = [];
  for (const [family, ids] of Object.entries(FAMILIES)) {
    const mapFile = path.join(ROOT, 'docs', 'realism', family, 'tile-map.json');
    const tileMap = JSON.parse(fs.readFileSync(mapFile, 'utf8')), tiles = tileMap.tiles;
    assert(Array.isArray(tiles) && tiles.length === 16 && new Set(tiles.map(tile => tile.tileId)).size === 16,
      `${family}: expected a complete 16-tile map`);
    for (let id = 1; id <= 16; id++) {
      const tile = tiles.find(candidate => candidate.tileId === id);
      assert(tile && Array.isArray(tile.uvRect) && tile.uvRect.length === 4 && tile.uvRect.every(Number.isFinite), `${family}: invalid tile ${id}`);
      const [umin, vmin, umax, vmax] = tile.uvRect;
      assert(0 <= umin && umin < umax && umax <= 1 && 0 <= vmin && vmin < vmax && vmax <= 1, `${family}: invalid UV rectangle ${id}`);
      assert(tile.faceCount > 0 && tile.loopCount > 0, `${family}: tile ${id} has no authoring face/loop evidence`);
    }
    const texturePath = tileMap.atlas ?? tileMap.image ?? tileMap.texture;
    assert(typeof texturePath === 'string' && !path.isAbsolute(texturePath), `${family}: expected relative atlas texture path`);
    const filename = path.resolve(ROOT, texturePath);
    assert(filename.startsWith(ROOT + path.sep), `${family}: atlas path escapes the project`);
    const data = fs.readFileSync(filename), info = pngInfo(data, `${family} source atlas`);
    const sourceTexture = { data, file: relative(filename), bytes: data.length, sha256: sha256(data), ...info,
      privatePathScan: privatePathCheck(data, `${family} source atlas`) };
    const familyVehicles = ids.map(id => verifyVehicle(family, id, tiles, sourceTexture));
    const union = new Set(familyVehicles.flatMap(vehicle => vehicle.usedTileIds));
    assert(union.size === 16, `${family}: family GLBs use ${union.size}/16 atlas tiles`);
    assert(familyVehicles.some(vehicle => vehicle.transparentGlassCount > 0), `${family}: no transparent BLEND glass exported`);
    const aggregates = tiles.map(tile => ({ tileId: tile.tileId, label: tile.label, authoringFaceCount: tile.faceCount,
      authoringLoopCount: tile.loopCount, actualUvVertexCount: familyVehicles.reduce((n, vehicle) => n + vehicle.tiles.find(t => t.tileId === tile.tileId).uvVertexCount, 0),
      primitiveCount: familyVehicles.reduce((n, vehicle) => n + vehicle.tiles.find(t => t.tileId === tile.tileId).primitiveCount, 0),
      triangleCount: familyVehicles.reduce((n, vehicle) => n + vehicle.tiles.find(t => t.tileId === tile.tileId).triangleCount, 0) }));
    families.push({ family, tileMap: relative(mapFile), sourceTexture: { ...sourceTexture, data: undefined },
      modelCount: familyVehicles.length, usedTileCount: union.size, usedTileIds: [...union].sort((a, b) => a - b), tiles: aggregates });
    vehicles.push(...familyVehicles);
  }
  assert(vehicles.length === 8, 'Expected all eight final vehicle models');
  return { schema: 1, status: 'VERIFIED', method: 'Deterministic local GLB binary/accessor inspection; no rendering or model inference',
    reviewContext: {car:'asset author self-verification',train:'separate context from asset author',flight:'separate context from asset author',modelComparison:false},
    uvConvention: 'glTF V is converted to Blender V with 1 - V', uvTolerance: TOLERANCE,
    modelCount: vehicles.length, familyCount: families.length, totalTriangles: vehicles.reduce((n, v) => n + v.triangles, 0),
    totalUvVertexCount: vehicles.reduce((n, v) => n + v.uvVertexCount, 0), families, vehicles };
}

function main() {
  const args = process.argv.slice(2); let output = path.join(ROOT, 'docs', 'realism', 'verification.json'), write = true;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--output') { assert(args[i + 1], '--output requires a filename'); output = path.resolve(args[++i]); }
    else if (args[i] === '--no-write') write = false;
    else throw new Error(`Unknown argument: ${args[i]}`);
  }
  const report = verifyAllVehicles();
  // No partial-success file is published: the whole inspection must finish first.
  if (write) {
    fs.mkdirSync(path.dirname(output), { recursive: true });
    const temporary = output + '.tmp'; fs.writeFileSync(temporary, JSON.stringify(report, null, 2) + '\n');
    fs.renameSync(temporary, output);
  }
  console.log(JSON.stringify({ status: report.status, modelCount: report.modelCount, totalUvVertexCount: report.totalUvVertexCount,
    report: write ? relative(output) : null, families: report.families.map(f => ({ family: f.family, tiles: f.usedTileCount })),
    models: report.vehicles.map(v => ({ id: v.id, triangles: v.triangles, draws: v.drawCalls, uvVertices: v.uvVertexCount, tiles: v.usedTileIds.length, embeddedImages: v.imageCount })) }));
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try { main(); } catch (error) { console.error(JSON.stringify({ status: 'FAILED', error: error.message })); process.exitCode = 1; }
}
