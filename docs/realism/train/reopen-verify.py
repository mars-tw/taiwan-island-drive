from pathlib import Path
import bpy,json,math
root=Path(bpy.data.filepath).resolve().parents[2]
images=[i for i in bpy.data.images if i.type=='IMAGE']
result={'blend':'blender/train/models.blend','meshObjects':len([o for o in bpy.data.objects if o.type=='MESH']),'images':[],'animatedControls':[]}
for i in images:
    resolved=Path(bpy.path.abspath(i.filepath))
    result['images'].append({'name':i.name,'size':list(i.size),'packed':bool(i.packed_file),'relativePath':i.filepath,'resolvedExists':resolved.exists()})
    assert i.filepath.startswith('//') and resolved.exists() and i.packed_file
for name in ('TractionLever','BrakeLever'):
    o=bpy.data.objects[name];result['animatedControls'].append({'name':name,'children':len(o.children),'localPosition':list(o.location)})
    assert len(o.children)==2
uvloops=0
for o in bpy.data.objects:
    if o.type=='MESH':
        assert o.data.uv_layers.active
        uvloops+=len(o.data.uv_layers.active.data)
result['uvLoops']=uvloops
(root/'docs/realism/train/blend-reopen.json').write_text(json.dumps(result,indent=2),encoding='utf8')
print('REOPEN_VERIFIED '+json.dumps(result))
