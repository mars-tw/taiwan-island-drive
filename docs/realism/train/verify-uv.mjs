import {readFileSync,writeFileSync} from 'node:fs';
const map=JSON.parse(readFileSync('docs/realism/train/tile-map.json','utf8'));
const report=[];
for(const file of ['train.glb','train-cab.glb']){
const b=readFileSync('public/models/'+file),len=b.readUInt32LE(12),g=JSON.parse(b.subarray(20,20+len).toString()),bin=28+len;let count=0,violations=0;const tiles=new Set();
for(const mesh of g.meshes)for(const p of mesh.primitives){const tileId=g.materials[p.material]?.extras?.tile_id;if(!tileId)continue;tiles.add(tileId);const r=map.tiles.find(t=>t.tileId===tileId).uvRect;const a=g.accessors[p.attributes.TEXCOORD_0],v=g.bufferViews[a.bufferView],stride=v.byteStride||8,offset=bin+(v.byteOffset||0)+(a.byteOffset||0);for(let i=0;i<a.count;i++){const u=b.readFloatLE(offset+i*stride),w=1-b.readFloatLE(offset+i*stride+4);count++;if(u<r[0]-1e-6||u>r[2]+1e-6||w<r[1]-1e-6||w>r[3]+1e-6)violations++;}}
report.push({file,checkedTexturedUVVertices:count,outsideTile:violations,usedTileIds:[...tiles].sort((a,b)=>a-b),embeddedImages:g.images.length});if(violations)throw Error('UV leaks out of semantic tile');}
writeFileSync('docs/realism/train/glb-uv-verification.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
