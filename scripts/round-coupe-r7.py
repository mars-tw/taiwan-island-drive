"""Headless Blender rework of the existing authored coupe, never a generated base."""
from pathlib import Path
import bpy,bmesh,json,hashlib
ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT/'docs/art/source/r7/coupe-original.glb';OUT=ROOT/'output/r7/coupe-rounded.glb'
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=str(SOURCE))
rows=[]
for obj in bpy.context.scene.objects:
    if obj.type!='MESH' or not any(m and m.name.startswith('BodyPaint') for m in obj.data.materials):continue
    before=len(obj.data.polygons)
    bm=bmesh.new();bm.from_mesh(obj.data);bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=.00001);bm.to_mesh(obj.data);bm.free()
    bevel=obj.modifiers.new('R7 rounded toy body','BEVEL');bevel.width=.085;bevel.segments=3;bevel.limit_method='ANGLE';bevel.angle_limit=.55;bevel.use_clamp_overlap=True;bevel.harden_normals=True
    for face in obj.data.polygons:face.use_smooth=True
    normal=obj.modifiers.new('R7 clean body normals','WEIGHTED_NORMAL');normal.keep_sharp=True;normal.weight=50
    rows.append({'name':obj.name,'original_polygons':before,'bevel_width':.085,'segments':3})
assert len(rows)>=3,rows
OUT.parent.mkdir(parents=True,exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'output/r7/coupe-rounded.blend'))
bpy.ops.export_scene.gltf(filepath=str(OUT),export_format='GLB',export_apply=True,export_yup=True,export_animations=True,export_extras=True)
report={'status':'EXECUTED','tool':'Blender 5.2 CLI --background','basis':'Existing Blender-authored coupe.glb; welded body seams, rounded body edges and weighted normals only. Wheels, lamps, windows, UVs, materials and named hierarchy retained.','source_sha256':hashlib.sha256(SOURCE.read_bytes()).hexdigest(),'output_sha256':hashlib.sha256(OUT.read_bytes()).hexdigest(),'bytes':OUT.stat().st_size,'body_meshes':rows,'rendered':False}
(ROOT/'output/r7/coupe-rounded.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
print('R7_ROUNDED_COUPÉ',json.dumps(report))
