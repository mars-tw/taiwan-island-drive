"""Original learning-simulator models, authored with Blender and image UV atlases.

Run: blender --background --factory-startup --python blender/train/build_assets.py
Blender: Z-up, nose -Y. Export: glTF Y-up, nose +Z. Distances are metres.
This generator reads the shared asset library in the canonical repository.
"""
from pathlib import Path
import bpy, math, json, struct, re
from mathutils import Vector

BLENDER_DIR = Path(__file__).resolve().parent
ROOT = Path(__file__).resolve().parents[2]
KIND = 'train'
EDITION = 'train'
OUT = ROOT / 'public' / 'models'
DOCS = ROOT / 'docs' / 'editions' / EDITION
OUT.mkdir(parents=True, exist_ok=True)
DOCS.mkdir(parents=True, exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
texture_path = ROOT / 'public' / 'textures' / (KIND + '.png')
if not texture_path.exists():
    raise FileNotFoundError('Generate the documented atlas before building: ' + texture_path.name)
atlas = bpy.data.images.load(str(texture_path), check_existing=True)
atlas.name = KIND + '_original_imagegen_atlas'
atlas.pack()
atlas.filepath = '//../../public/textures/' + KIND + '.png'
atlas.filepath_raw = atlas.filepath
for packed in atlas.packed_files:packed.filepath=atlas.filepath

RECT = {'paint':(.015,.515,.485,.985), 'metal':(.515,.515,.985,.985),
        'panel':(.015,.015,.485,.485), 'seat':(.515,.015,.985,.485),
        'rubber':(.82,.55,.975,.95)}
MAT = {}
def material(name, color=(1,1,1), texture=None, roughness=.45, metallic=0, alpha=1, emit=0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    m.diffuse_color = (*color, alpha)
    bsdf = m.node_tree.nodes.get('Principled BSDF')
    bsdf.inputs['Base Color'].default_value = (*color, alpha)
    bsdf.inputs['Metallic'].default_value = metallic
    bsdf.inputs['Roughness'].default_value = roughness
    bsdf.inputs['Alpha'].default_value = alpha
    if texture:
        node = m.node_tree.nodes.new('ShaderNodeTexImage')
        node.name = 'Original raster albedo atlas'
        node.image = atlas
        m.node_tree.links.new(node.outputs['Color'], bsdf.inputs['Base Color'])
        m['uv_region'] = texture
    if alpha < 1:
        bsdf.inputs['Transmission Weight'].default_value = .1
        m.surface_render_method = 'DITHERED'
        m.use_transparency_overlap = False
    if emit:
        bsdf.inputs['Emission Color'].default_value = (*color, 1)
        bsdf.inputs['Emission Strength'].default_value = emit
    return m
MAT['paint']=material('Image mapped ivory livery',texture='paint',metallic=.28,roughness=.32)
MAT['metal']=material('Image mapped mechanical steel',texture='metal',metallic=.75,roughness=.38)
MAT['rubber']=material('Image mapped tire rubber',texture='rubber',roughness=.92)
MAT['panel']=material('Image mapped blank cockpit powdercoat',texture='panel',roughness=.65)
MAT['seat']=material('Image mapped upholstery',texture='seat',roughness=.85)
MAT['glass']=material('Transparent blue safety glazing',(.21,.43,.51),roughness=.14,alpha=.18)
MAT['trim']=material('Charcoal gaskets',(.027,.038,.043),roughness=.7)
MAT['silver']=material('Machined aluminium',(.61,.67,.72),metallic=.9,roughness=.27)
MAT['light']=material('LED lamps',(.83,.94,1),roughness=.2,emit=2)
MAT['red']=material('Emergency control red',(.78,.044,.026),roughness=.35)
MAT['amber']=material('Control amber',(.96,.38,.035),roughness=.37)
MAT['teal']=material('Rail teal accent',(.014,.31,.31),metallic=.2,roughness=.36)

def empty(name, loc=(0,0,0), parent=None):
    obj=bpy.data.objects.new(name,None)
    bpy.context.collection.objects.link(obj)
    obj.location=loc
    obj.parent=parent
    return obj

def uv_box(obj, material):
    key=material.get('uv_region')
    if not key:return
    rect=RECT[key]
    mesh=obj.data
    uv=mesh.uv_layers.active or mesh.uv_layers.new(name='ImageAtlasUV')
    coords=[v.co for v in mesh.vertices]
    low=[min(v[a] for v in coords) for a in range(3)]
    high=[max(v[a] for v in coords) for a in range(3)]
    for face in mesh.polygons:
        normal=face.normal
        axis=max(range(3),key=lambda a:abs(normal[a]))
        # Vertical body faces always use vertical Z as V, so stripes stay horizontal.
        axes=(1,2) if axis==0 else ((0,2) if axis==1 else (0,1))
        for li in face.loop_indices:
            p=mesh.vertices[mesh.loops[li].vertex_index].co
            u=(p[axes[0]]-low[axes[0]])/max(high[axes[0]]-low[axes[0]],.001)
            v=(p[axes[1]]-low[axes[1]])/max(high[axes[1]]-low[axes[1]],.001)
            uv.data[li].uv=(rect[0]+u*(rect[2]-rect[0]),rect[1]+v*(rect[3]-rect[1]))

def finish(obj, parent, key, edge=0):
    obj.parent=parent
    obj.data.materials.append(MAT[key])
    if edge:
        mod=obj.modifiers.new('Small physical edge radii','BEVEL')
        mod.width=edge
        mod.segments=3
        bpy.context.view_layer.objects.active=obj
        bpy.ops.object.modifier_apply(modifier=mod.name)
    uv_box(obj,MAT[key])
    for p in obj.data.polygons:p.use_smooth=True
    return obj

def cube(name,loc,size,parent,key='paint',edge=.02):
    bpy.ops.mesh.primitive_cube_add(size=1,location=loc)
    o=bpy.context.object;o.name=name;o.dimensions=size
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    return finish(o,parent,key,edge)

def mesh(name,vertices,faces,parent,key='paint',edge=0):
    data=bpy.data.meshes.new(name);data.from_pydata(vertices,[],faces);data.update()
    obj=bpy.data.objects.new(name,data);bpy.context.collection.objects.link(obj)
    return finish(obj,parent,key,edge)

def cylinder(name,loc,radius,depth,parent,key='metal',axis='Z',vertices=24):
    rot={'Z':(0,0,0),'X':(0,math.pi/2,0),'Y':(math.pi/2,0,0)}[axis]
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices,radius=radius,depth=depth,location=loc,rotation=rot)
    o=bpy.context.object;o.name=name
    bpy.ops.object.transform_apply(location=False,rotation=True,scale=True)
    return finish(o,parent,key,.006)

def sphere(name,loc,size,parent,key='paint'):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=24,ring_count=12,location=loc)
    o=bpy.context.object;o.name=name;o.scale=size
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    return finish(o,parent,key)

def bar(name,start,end,radius,parent,key='metal'):
    a,b=Vector(start),Vector(end)
    o=cylinder(name,(a+b)/2,radius,(b-a).length,parent,key)
    o.rotation_euler=(b-a).to_track_quat('Z','Y').to_euler()
    return o

def train():
    p=empty('TrainRoot')
    cube('Underframe',(0,0,.94),(2.78,18.9,.42),p,'metal',.09)
    cube('Lower passenger body',(0,0,1.58),(3,18.9,.92),p,'paint',.14)
    cube('Passenger floor',(0,0,1.25),(2.85,18.3,.1),p,'panel')
    cube('Upper curved roof',(0,0,3.68),(3.02,19,.54),p,'paint',.25)
    cube('Roof spine',(0,0,3.97),(1.12,14,.13),p,'metal',.07)
    for side in (-1,1):
        x=side*1.46
        cube('Window lower sill',(x,0,2.14),(.1,18.5,.18),p,'teal')
        cube('Upper side rail',(x,0,3.37),(.1,18.5,.18),p,'paint')
        for y in (-8.5,-6.7,-4.9,-3.1,-1.3,.5,2.3,4.1,5.9,7.7):
            cube('Window glass',(x,y,2.76),(.032,1.43,1.03),p,'glass',.04)
            cube('Window mullion',(x,y+.78,2.77),(.12,.13,1.2),p,'paint')
        for y in (-5.7,0,5.7):
            cube('Sliding doorway',(side*1.515,y,2.28),(.045,1.3,2.19),p,'metal',.035)
            for offset in (-.33,.33):
                cube('Door leaf',(side*1.542,y+offset,2.28),(.03,.61,2.09),p,'paint',.022)
                cube('Door safety glazing',(side*1.563,y+offset,2.75),(.025,.43,.74),p,'glass',.03)
                bar('Door grab rail',(side*1.58,y+offset,1.87),(side*1.58,y+offset,2.16),.025,p,'silver')
            cube('Door step',(side*1.48,y,1.02),(.29,1.36,.11),p,'metal')
        for y in (-7.8,-4.1,-.4,3.3,7):
            cube('Interior seat',(side*.93,y,1.58),(.65,1.5,.2),p,'seat',.07)
            cube('Interior seat back',(side*1.23,y,1.96),(.17,1.5,.79),p,'seat',.06)
    # Original sculpted cab ends: clear front glazing above solid lower nose.
    for sign in (-1,1):
        y=sign*9.65
        cube('Cab lower nose',(0,y,1.69),(2.9,.69,1.23),p,'paint',.22)
        cube('Cab windshield',(0,y+sign*.28,2.81),(2.47,.034,1.05),p,'glass',.08)
        for x in (-1.35,1.35):
            cube('Cab pillar',(x,y,2.79),(.18,.45,1.32),p,'paint',.05)
        cube('Cab brow',(0,y,3.41),(2.83,.51,.22),p,'paint',.08)
        cube('Destination blank frame',(0,y+sign*.31,3.49),(1.35,.03,.14),p,'panel')
        for x in (-1.02,1.02):
            cube('LED surround',(x,y+sign*.36,1.83),(.53,.035,.24),p,'trim',.08)
            cube('LED headlight',(x,y+sign*.39,1.83),(.4,.025,.09),p,'light',.03)
        bar('Windshield wiper',(-.9,y+sign*.33,2.29),(-.42,y+sign*.34,2.92),.018,p,'trim')
        cylinder('Automatic coupler',(0,y+sign*.51,.75),.16,.46,p,'metal','Y')
    for y in (-6.2,6.2):
        cube('Bogie frame',(0,y,.61),(2.33,2.47,.33),p,'metal',.07)
        for ax in (-.83,.83):
            cylinder('Wheel axle',(0,y+ax,.45),.095,2.88,p,'silver','X')
            for side in (-1,1):
                cylinder('Rail steel wheel',(side*1.37,y+ax,.45),.45,.19,p,'metal','X',32)
                cylinder('Wheel flange',(side*1.26,y+ax,.45),.47,.04,p,'silver','X',32)
                cylinder('Axle bearing cap',(side*1.51,y+ax,.45),.17,.11,p,'silver','X')
                cube('Suspension spring housing',(side*1.12,y+ax,.84),(.3,.36,.23),p,'metal')
        cube('Underfloor air reservoir',(0,y+1.65,.67),(1.75,.6,.44),p,'metal',.15)
    for y in (-2.3,2.3):
        cube('Roof ventilation',(0,y,4.03),(1.35,1.8,.25),p,'metal',.09)
        for gy in range(8):
            cube('Roof louver',(0,y-.65+gy*.18,4.18),(1.05,.035,.018),p,'silver',.003)
    pan=empty('PantographRoot',(0,0,0),p)
    for x in (-.5,.5):
        bar('Pantograph lower arm',(x,3.6,4.2),(x,4.6,4.62),.037,pan)
        bar('Pantograph upper arm',(x,4.6,4.62),(x,3.8,5.02),.033,pan)
    cube('Pantograph contact strip',(0,3.8,5.05),(1.7,.14,.08),pan,'silver')
    empty('DriverAnchor',(0,-8,2.3),p)
    return p

def aerofoil(name,parent,span,chord,position,key='paint',thickness=.12):
    verts=[]
    count=18
    for x in (-span/2,span/2):
        for i in range(count):
            theta=2*math.pi*i/count
            # Elliptical chord section, rounded leading edge and tapered trailing edge.
            s=(1-math.cos(theta))/2
            yy=position[1]+(s-.5)*chord
            zz=position[2]+math.sin(theta)*thickness*(1-.5*s)
            verts.append((position[0]+x,yy,zz))
    faces=[tuple(range(count-1,-1,-1)),tuple(range(count,count*2))]
    faces += [(i,(i+1)%count,(i+1)%count+count,i+count) for i in range(count)]
    obj=mesh(name,verts,faces,parent,key)
    for vertex in obj.data.vertices:vertex.co-=Vector(position)
    obj.location=position
    return obj

def fuselage(parent):
    stations=[(-3.65,.23,.21,1.3),(-3.25,.49,.48,1.33),(-2.6,.61,.54,1.34),
              (-1.45,.7,.52,1.25),(.6,.67,.53,1.27),(1.35,.55,.48,1.29),
              (2.5,.32,.28,1.5),(3.4,.16,.18,1.66),(3.85,.08,.11,1.7)]
    n=24;v=[]
    for y,rx,rz,z in stations:
        for i in range(n):
            a=2*math.pi*i/n
            v.append((rx*math.cos(a),y,z+rz*math.sin(a)))
    f=[tuple(range(n-1,-1,-1)),tuple(range((len(stations)-1)*n,len(stations)*n))]
    for j in range(len(stations)-1):
        for i in range(n):f.append((j*n+i,j*n+(i+1)%n,(j+1)*n+(i+1)%n,(j+1)*n+i))
    return mesh('Formed fuselage aluminium',v,f,parent,'paint')

def aircraft():
    p=empty('AircraftRoot');fuselage(p)
    aerofoil('High wing airfoil',p,10,1.6,(0,-.35,2.38),thickness=.12)
    # Ailerons are separate named geometry, ready for physical animation.
    for sign in (-1,1):
        aerofoil('AileronLeft' if sign<0 else 'AileronRight',p,2.25,.35,(sign*3.65,.32,2.365),thickness=.025)
        aerofoil('FlapLeft' if sign<0 else 'FlapRight',p,1.75,.4,(sign*1.8,.3,2.367),thickness=.025)
        bar('Wing lift strut',(sign*.58,-.3,1),(sign*3.12,-.24,2.3),.037,p,'silver')
        cube('Wingtip position light',(sign*4.98,-.8,2.4),(.12,.17,.05),p,'red' if sign<0 else 'teal')
    aerofoil('Horizontal stabilizer',p,3.2,1.0,(0,3.18,1.74),thickness=.065)
    aerofoil('Elevator',p,3.1,.26,(0,3.64,1.74),thickness=.025)
    mesh('Vertical tail fin',[(-.055,2.62,1.7),(.055,2.62,1.7),(-.055,3.12,3.09),(.055,3.12,3.09),(-.055,3.89,2.83),(.055,3.89,2.83),(-.055,3.88,1.7),(.055,3.88,1.7)],[(0,2,4,6),(1,7,5,3),(0,1,3,2),(2,3,5,4),(4,5,7,6),(6,7,1,0)],p,'paint',.02)
    cube('Rudder',(0,3.85,2.28),(.12,.15,1.05),p,'paint',.05)
    # Clear canopy; no solid opaque geometry across the forward field of view.
    mesh('Cabin front glazing',[(-.64,-1.46,1.6),(.64,-1.46,1.6),(.52,-.8,2.31),(-.52,-.8,2.31)],[(0,1,2,3)],p,'glass')
    for side in (-1,1):
        mesh('Cabin side glazing',[(side*.66,-1.43,1.6),(side*.65,.65,1.65),(side*.53,.52,2.3),(side*.53,-.79,2.3)],[(0,1,2,3)],p,'glass')
        bar('Forward windshield pillar',(side*.65,-1.46,1.58),(side*.54,-.8,2.33),.035,p,'paint')
        bar('Rear cabin door pillar',(side*.65,.7,1.59),(side*.54,.57,2.33),.04,p,'paint')
        cube('Door lower skin',(side*.678,-.25,1.46),(.028,1.35,.24),p,'paint',.02)
        bar('Door grip',(side*.704,.22,1.55),(side*.704,.4,1.55),.018,p,'silver')
    cube('Cabin roof',(0,-.12,2.31),(1.09,1.41,.06),p,'paint',.035)
    for x in (-.32,.32):
        cube('Leather pilot seat',(x,.27,1.53),(.49,.62,.13),p,'seat',.055)
        cube('Leather pilot back',(x,.56,1.82),(.49,.11,.62),p,'seat',.05)
    cube('Engine cooling intake',(0,-3.53,1.07),(.65,.033,.16),p,'panel',.05)
    for x in (-1.1,1.1):
        bar('Main landing gear',(x*.43,.5,1.09),(x,.45,.29),.055,p,'silver')
        cylinder('Main tire',(x,.45,.28),.28,.17,p,'rubber','X',32)
        cylinder('Main wheel hub',(x+(.1 if x>0 else -.1),.45,.28),.14,.025,p,'silver','X')
    bar('Nose gear',(0,-2.5,1.02),(0,-2.5,.26),.041,p,'silver')
    cylinder('Nose tire',(0,-2.5,.25),.25,.14,p,'rubber','X',32)
    cylinder('Nose hub',(.084,-2.5,.25),.12,.025,p,'silver','X')
    prop=empty('PropellerRoot',(0,-3.86,1.34),p)
    # Set parent coordinates in Blender, local Y axis becomes glTF Z.
    sphere('Propeller spinner',(0,0,0),(.2,.24,.2),prop,'paint')
    for sign in (-1,1):
        blade=cube('Propeller blade',(0,0,sign*.68),(.17,.06,1.05),prop,'metal',.06)
        blade.rotation_euler[1]=sign*.11
        cube('Propeller tip',(0,0,sign*1.12),(.16,.065,.15),prop,'amber',.025)
    empty('PilotAnchor',(0,-1,1.5),p)
    return p

def cab(kind):
    p=empty('TrainCabRoot' if kind=='train' else 'AircraftCabRoot')
    width=2.6 if kind=='train' else 1.5
    panel_y=-.6 if kind=='train' else -.7
    panel_z=.8 if kind=='train' else .9
    glass_y=-1.3 if kind=='train' else -1.4
    cube('Cab floor',(0,.1,.025),(width,3,.05),p,'metal')
    cube('Blank instrument panel',(0,panel_y,panel_z),(width*.87,.26,.33),p,'panel',.045)
    cube('Panel lower console',(0,panel_y+.03,panel_z-.27),(width*.7,.32,.28),p,'panel',.04)
    cube('Panel top glare shield',(0,panel_y-.03,panel_z+.205),(width*.97,.51,.07),p,'trim',.035)
    # No painted or embossed gauge readings: runtime instruments remain authoritative.
    for side in (-1,1):
        x=side*width/2
        cube('Cab lower sidewall',(x,.03,.46),(.07,2.52,.89),p,'paint',.035)
        bar('Front window side pillar',(x,glass_y,.87),(x,glass_y+.23,2.09),.04,p,'paint')
        bar('Side window rear pillar',(x,.88,.89),(x,.88,2.06),.04,p,'paint')
        cube('Side safety glazing',(x,-.14,1.49),(.014,1.96,1.09),p,'glass',0)
        cube('Cab armrest',(side*(width/2-.15),.3,.59),(.19,.68,.16),p,'seat',.055)
    cube('Front safety glazing',(0,glass_y,1.52),(width-.09,.015,1.13),p,'glass',0)
    bar('Front upper window frame',(-width/2,glass_y,2.09),(width/2,glass_y,2.09),.038,p,'paint')
    cube('Roof lining',(0,.0,2.13),(width,2.88,.045),p,'panel')
    for x in ((0,) if kind=='train' else (-.32,.32)):
        cube('Seat cushion',(x,.64,.43),(.51,.59,.15),p,'seat',.07)
        cube('Seat back',(x,.91,.81),(.51,.14,.73),p,'seat',.065)
        cube('Seat pedestal',(x,.64,.22),(.22,.25,.31),p,'metal')
    if kind=='train':
        for x,key,name in ((-.85,'trim','TractionLever'),(.83,'red','BrakeLever')):
            cube(name+' base',(x,panel_y+.18,panel_z+.045),(.19,.22,.065),p,'metal')
            lever=empty(name,(x,panel_y+.18,panel_z+.08),p)
            bar(name+' shaft',(0,0,0),(0,.05,.17),.018,lever,'silver')
            sphere(name+' grip',(0,.05,.17),(.043,.051,.037),lever,key)
        cylinder('Emergency stop',(1.06,panel_y+.21,panel_z+.19),.048,.045,p,'red')
        cylinder('Door control',(-1.04,panel_y+.21,panel_z+.17),.029,.032,p,'amber')
        for x in (-.16,.16):
            cube('Driver foot pedal',(x,panel_y+.29,.12),(.18,.21,.065),p,'metal',.025)
    else:
        for x in (-.34,.34):
            yoke=empty('YokeLeft' if x<0 else 'YokeRight',(x,panel_y+.25,panel_z-.015),p)
            bar('Yoke stem',(0,0,0),(0,.28,0),.024,yoke,'silver')
            bar('Yoke bottom handle',(-.13,.28,.0),(.13,.28,.0),.023,yoke,'trim')
            bar('Yoke left grip',(-.13,.28,0),(-.13,.28,.115),.026,yoke,'trim')
            bar('Yoke right grip',(.13,.28,0),(.13,.28,.115),.026,yoke,'trim')
            for dx in (-.105,.105):
                cube('Rudder pedal',(x+dx,panel_y+.2,.14),(.12,.16,.045),p,'metal',.02)
        for x,key,name in ((-.08,'trim','Throttle'),(.07,'red','Mixture')):
            bar(name+' stem',(x,panel_y+.14,panel_z),(x,panel_y+.33,panel_z),.012,p,'silver')
            sphere(name+' grip',(x,panel_y+.34,panel_z),(.024,.019,.024),p,key)
    return p

def descendants(root):
    return [root]+list(root.children_recursive)

def export(root,name):
    bpy.ops.object.select_all(action='DESELECT')
    for o in descendants(root):o.select_set(True)
    bpy.context.view_layer.objects.active=root
    bpy.ops.export_scene.gltf(filepath=str(OUT/name),export_format='GLB',use_selection=True,
         export_yup=True,export_texcoords=True,export_normals=True,export_materials='EXPORT',
         export_cameras=False,export_lights=False,export_extras=True)

def render(root,path,inside=False):
    scene=bpy.context.scene
    for o in bpy.data.objects:
        if o.type=='MESH':o.hide_render=o not in descendants(root)
    scene.render.engine='BLENDER_EEVEE'
    scene.render.resolution_x=1400;scene.render.resolution_y=1050;scene.render.resolution_percentage=100
    scene.render.image_settings.file_format='PNG'
    scene.render.use_stamp=False
    scene.render.filepath=str(path)
    scene.world=bpy.data.worlds.new('Neutral studio') if not scene.world else scene.world
    scene.world.use_nodes=True
    scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.15,.19,.23,1)
    scene.world.node_tree.nodes['Background'].inputs[1].default_value=.55
    target=Vector((0,0,2.0 if KIND=='train' else 1.3))
    loc=(20,-24,13) if KIND=='train' else (13,-14,8)
    if inside:
        loc=(3.2,3.4,2.7) if KIND=='train' else (2.35,2.8,2.4)
        target=Vector((0,-.3,.9))
        # Documentation cutaway: show the complete physical controls and upholstery.
        for obj in descendants(root):
            if obj.name.startswith('Roof lining'):obj.hide_render=True
    bpy.ops.object.camera_add(location=loc)
    camera=bpy.context.object;camera.name='Asset documentation camera'
    camera.rotation_euler=(target-camera.location).to_track_quat('-Z','Y').to_euler()
    camera.data.lens=38 if inside else 48
    scene.camera=camera
    lamps=[]
    for pos,power,size in (((6,-8,12),2200,7),((-8,-2,8),1400,8),((3,9,10),1800,6)):
        if inside:pos=tuple(v*.12 for v in pos);power*=.025;size*=.16
        bpy.ops.object.light_add(type='AREA',location=pos)
        l=bpy.context.object;l.data.energy=power;l.data.shape='DISK';l.data.size=size
        l.rotation_euler=(target-l.location).to_track_quat('-Z','Y').to_euler();lamps.append(l)
    if not inside:
        floor=cube('Documentation floor',(0,0,-.06),(100,100,.08),None,'trim',0)
        floor.hide_render=False
    bpy.ops.render.render(write_still=True)
    for o in lamps+[camera]+([] if inside else [floor]):bpy.data.objects.remove(o,do_unlink=True)

exterior=train() if KIND=='train' else aircraft()
interior=cab(KIND)
# Keep separate model origins while preserving an editable overview in the .blend.
export(exterior,KIND+'.glb')
export(interior,KIND+'-cab.glb')
render(exterior,DOCS/'assets.png')
render(interior,DOCS/'cab-assets.png',inside=True)
for o in bpy.data.objects:o.hide_render=False
interior.location.x=18 if KIND=='train' else 12
bpy.ops.object.select_all(action='DESELECT')
exterior.select_set(True)
bpy.context.view_layer.objects.active=exterior
for screen in bpy.data.screens:
    for area in screen.areas:
        if area.type=='FILE_BROWSER':area.type='VIEW_3D'
bpy.context.scene.render.filepath='//../../docs/editions/'+EDITION+'/cab-assets.png'
bpy.ops.wm.save_as_mainfile(filepath=str(BLENDER_DIR/'models.blend'),compress=False,check_existing=False)
# Factory startup may retain an operating-system file-picker directory.
# Replace only null-terminated private directory fields, preserving block lengths.
blend_path=BLENDER_DIR/'models.blend'
raw=bytearray(blend_path.read_bytes())
for match in re.finditer(rb'[A-Za-z]:[\\/](?:Users|Documents and Settings)[\\/][^\x00]+',raw):
    raw[match.start():match.end()]=b'//'+b'\x00'*(match.end()-match.start()-2)
blend_path.write_bytes(raw)
backup=blend_path.with_suffix('.blend1')
if backup.exists():backup.unlink()
# Remove textual PNG metadata without altering the raster pixel data.
for png in [texture_path,DOCS/'assets.png',DOCS/'cab-assets.png']:
    src=png.read_bytes();dst=bytearray(src[:8]);offset=8
    while offset<len(src):
        length=struct.unpack_from('>I',src,offset)[0];kind=src[offset+4:offset+8]
        if kind not in (b'tEXt',b'zTXt',b'iTXt',b'eXIf'):dst.extend(src[offset:offset+12+length])
        offset+=12+length
    png.write_bytes(dst)
manifest={'kind':KIND,'authoring':'Blender 5.2 original procedural geometry',
    'coordinates':{'up':'+Y','forward':'+Z','unit':'metre'},
    'texture':{'file':'textures/'+KIND+'.png','source':'built-in image_gen',
    'mapping':'Each mesh owns box projected UVs cropped to its atlas quadrant; Image Texture is connected to Principled Base Color'},
    'assets':[]}
for filename in (KIND+'.glb',KIND+'-cab.glb'):
    raw=(OUT/filename).read_bytes();length,kind=struct.unpack_from('<II',raw,12)
    data=json.loads(raw[20:20+length])
    manifest['assets'].append({'file':filename,'bytes':len(raw),'nodes':len(data.get('nodes',[])),
        'meshes':len(data.get('meshes',[])),'embeddedImages':len(data.get('images',[])),
        'texturedMaterials':sum('baseColorTexture' in m.get('pbrMetallicRoughness',{}) for m in data.get('materials',[])),
        'uvAccessors':sum('TEXCOORD_0' in p['attributes'] for m in data.get('meshes',[]) for p in m['primitives'])})
(DOCS/'asset-manifest.json').write_text(json.dumps(manifest,indent=2),encoding='utf-8')
print('ASSET_BUILD_VERIFIED '+json.dumps(manifest))
