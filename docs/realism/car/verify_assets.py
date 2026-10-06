"""Verify actual GLB atlas images, semantic UV bounds and mobile budgets."""
from pathlib import Path
import hashlib
import json
import struct

ROOT=Path(__file__).resolve().parents[3]
HERE=Path(__file__).resolve().parent
atlas=ROOT/'public/textures/car-detail-atlas.png'
tile_map=json.loads((HERE/'tile-map.json').read_text(encoding='utf-8'))
rects={t['tileId']:t['uvRect'] for t in tile_map['tiles']}


def png_chunks(raw):
    offset=8; result=[]
    while offset<len(raw):
        count=struct.unpack_from('>I',raw,offset)[0]
        result.append((raw[offset+4:offset+8],raw[offset+8:offset+8+count]))
        offset+=count+12
    return result


raw_atlas=(HERE/'atlas-raw.png').read_bytes()
clean_atlas=atlas.read_bytes()
assert b''.join(d for k,d in png_chunks(raw_atlas) if k==b'IDAT')==b''.join(d for k,d in png_chunks(clean_atlas) if k==b'IDAT'), 'Image pixel data was changed'
width,height=struct.unpack('>II',clean_atlas[16:24])
assert width==height and width>=1024
results=[]
for name in ['coupe','rally','suv','van']:
    data=(ROOT/'public/models'/f'{name}.glb').read_bytes()
    assert data[:4]==b'glTF'
    offset=12; chunks={}
    while offset<len(data):
        count,kind=struct.unpack_from('<II',data,offset)
        chunks[kind]=data[offset+8:offset+8+count]; offset+=8+count
    gltf=json.loads(chunks[0x4E4F534A]); binary=chunks[0x004E4942]
    tiles=set(); uv_counts={}; triangles=0; draws=0
    for mesh in gltf['meshes']:
        for primitive in mesh['primitives']:
            draws+=1
            triangles+=gltf['accessors'][primitive['indices']]['count']//3
            material=gltf['materials'][primitive['material']]
            tile=material.get('extras',{}).get('tile_id')
            if tile is None:
                continue
            assert 'baseColorTexture' in material['pbrMetallicRoughness'], material['name']
            tiles.add(tile)
            accessor=gltf['accessors'][primitive['attributes']['TEXCOORD_0']]
            view=gltf['bufferViews'][accessor['bufferView']]
            assert accessor['componentType']==5126 and accessor['type']=='VEC2'
            start=view.get('byteOffset',0)+accessor.get('byteOffset',0)
            stride=view.get('byteStride',8)
            umin,vmin,umax,vmax=rects[tile]
            for n in range(accessor['count']):
                u,v=struct.unpack_from('<ff',binary,start+n*stride)
                v=1-v # glTF texture coordinates have the opposite V convention.
                assert umin-1e-5<=u<=umax+1e-5 and vmin-1e-5<=v<=vmax+1e-5, (name,tile,n,u,v)
            uv_counts[str(tile)]=uv_counts.get(str(tile),0)+accessor['count']
    assert tiles==set(range(1,17)), (name,tiles)
    assert triangles<=35000 and draws<=40
    glass=next(m for m in gltf['materials'] if m['name']=='SmokedGlass')
    assert glass['alphaMode']=='BLEND' and glass['pbrMetallicRoughness']['baseColorFactor'][3]<.2
    wheels=[n['name'] for n in gltf['nodes'] if n['name'].startswith('Wheel')]
    assert len(wheels)==4
    images=[]
    for image in gltf.get('images',[]):
        assert image['mimeType']=='image/png' and 'bufferView' in image and 'uri' not in image
        view=gltf['bufferViews'][image['bufferView']]
        raw=binary[view.get('byteOffset',0):view.get('byteOffset',0)+view['byteLength']]
        images.append({'bytes':len(raw),'sha256':hashlib.sha256(raw).hexdigest(),'matchesSourcePng':raw==clean_atlas})
    assert len(images)==1
    results.append({'vehicle':name,'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest(),'triangles':triangles,'drawCalls':draws,'tileIds':sorted(tiles),'uvVertexCounts':uv_counts,'embeddedImages':images,'glassAlpha':glass['pbrMetallicRoughness']['baseColorFactor'][3],'wheelGroups':wheels})
report={'status':'VERIFIED','texture':{'path':'public/textures/car-detail-atlas.png','size':[width,height],'sha256':hashlib.sha256(clean_atlas).hexdigest(),'rawImagePixelDataPreserved':True},'vehicles':results}
(HERE/'uv-verification.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print(json.dumps(report,indent=2))
