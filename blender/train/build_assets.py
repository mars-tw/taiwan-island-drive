"""Original learning-simulator models, authored with Blender and image UV atlases.

Run: blender --background --factory-startup --python blender/train/build_assets.py
Blender: Z-up, nose -Y. Export: glTF Y-up, nose +Z. Distances are metres.
This generator reads the shared asset library in the canonical repository.
"""
from pathlib import Path
import bpy, bmesh, math, json, struct, re
from mathutils import Vector

BLENDER_DIR = Path(__file__).resolve().parent
ROOT = Path(__file__).resolve().parents[2]
KIND = 'train'
EDITION = 'train'
OUT = ROOT / 'public' / 'models'
DOCS = ROOT / 'docs' / 'realism' / EDITION
OUT.mkdir(parents=True, exist_ok=True)
DOCS.mkdir(parents=True, exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
texture_path = ROOT / 'public' / 'textures' / 'train-detail-atlas.png'
if not texture_path.exists():
    raise FileNotFoundError('Generate the documented atlas before building: ' + texture_path.name)
def clean_png_metadata(path):
    src=path.read_bytes();dst=bytearray(src[:8]);offset=8
    while offset<len(src):
        length=struct.unpack_from('>I',src,offset)[0];chunk=src[offset+4:offset+8]
        if chunk not in (b'tEXt',b'zTXt',b'iTXt',b'eXIf'):dst.extend(src[offset:offset+12+length])
        offset+=12+length
    path.write_bytes(dst)
clean_png_metadata(texture_path)
atlas = bpy.data.images.load(str(texture_path), check_existing=True)
atlas.name = 'train_detail_original_imagegen_16_tile_atlas'
atlas.pack()
atlas.filepath = '//../../public/textures/train-detail-atlas.png'
atlas.filepath_raw = atlas.filepath
for packed in atlas.packed_files:packed.filepath=atlas.filepath

TILES = [
    ('paint','Ivory teal body A'),('paint2','Ivory teal body B'),('roof','Roof sheet metal'),('lower','Lower panel fasteners'),
    ('door','Sliding door stripe'),('silver','Brushed aluminium'),('rubber','Rubber wear pads'),('axle','Machined axle steel'),
    ('panel','Blank navy cockpit powdercoat'),('seat','Woven navy upholstery'),('trim','Rubber window gaskets'),('floor','Antislip floor'),
    ('metal','Underbody mechanical steel'),('vent','Vent grille'),('copper','Pantograph copper contact wear'),('glass','Fine smudged safety glazing')]
RECT = {}; TILE_INFO = {}; UV_RECORDS = []
for i,(key,label) in enumerate(TILES):
    row,col=divmod(i,4); margin=.25*.03
    rect=(col*.25+margin,1-(row+1)*.25+margin,(col+1)*.25-margin,1-row*.25-margin)
    # Avoid the image's decorative door-handle crop; hardware is true geometry.
    if key=='door':rect=(.25*.34,rect[1],rect[2],rect[3])
    RECT[key]=rect;TILE_INFO[key]={'tileId':i+1,'row':row+1,'column':col+1,'label':label,'uvRect':list(rect),'faceCount':0,'loopCount':0,'objects':[]}
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
        m['tile_id'] = TILE_INFO[texture]['tileId']
        m['tileId'] = TILE_INFO[texture]['tileId']
    if alpha < 1:
        bsdf.inputs['Transmission Weight'].default_value = .1
        m.surface_render_method = 'DITHERED'
        m.use_transparency_overlap = False
    if emit:
        bsdf.inputs['Emission Color'].default_value = (*color, 1)
        bsdf.inputs['Emission Strength'].default_value = emit
    return m
for key in ('paint','paint2','lower','door'):MAT[key]=material('IMG '+TILE_INFO[key]['label'],texture=key,metallic=.18,roughness=.29)
MAT['roof']=material('IMG satin formed roof',texture='roof',metallic=.75,roughness=.32)
MAT['metal']=material('IMG dark underbody steel',texture='metal',metallic=.76,roughness=.48)
MAT['rubber']=material('IMG rubber suspension pads',texture='rubber',roughness=.92)
MAT['panel']=material('IMG blank navy cockpit',texture='panel',roughness=.53)
MAT['seat']=material('IMG woven navy seating',texture='seat',roughness=.91)
MAT['glass']=material('IMG thin transparent safety glazing',texture='glass',roughness=.095,alpha=.045)
MAT['trim']=material('IMG rubber gaskets',texture='trim',roughness=.8)
MAT['silver']=material('IMG brushed aluminium',texture='silver',metallic=.88,roughness=.26)
MAT['axle']=material('IMG machined running steel',texture='axle',metallic=.94,roughness=.2)
MAT['floor']=material('IMG antislip floor rubber',texture='floor',roughness=.87)
MAT['vent']=material('IMG metal ventilation slats',texture='vent',metallic=.72,roughness=.45)
MAT['copper']=material('IMG worn copper contact',texture='copper',metallic=.92,roughness=.3)
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
    mesh=obj.data
    uv=mesh.uv_layers.active or mesh.uv_layers.new(name='ImageAtlasUV')
    # Primitive cubes and authored lofts must share one UV layer name before
    # joining. Otherwise Blender fills the other layer with (0,0) on the nose.
    uv.name='ImageAtlasUV'
    coords=[v.co for v in mesh.vertices]
    low=[min(v[a] for v in coords) for a in range(3)]
    high=[max(v[a] for v in coords) for a in range(3)]
    bpy.context.view_layer.update()
    face_usage={}
    for face in mesh.polygons:
        normal=face.normal
        axis=max(range(3),key=lambda a:abs(normal[a]))
        face_key='paint2' if key=='paint' and normal.x>.55 else key
        rect=RECT[face_key]
        if face_key!=key:
            if MAT[face_key].name not in obj.data.materials:obj.data.materials.append(MAT[face_key])
            face.material_index=obj.data.materials.find(MAT[face_key].name)
        # Vertical body faces always use vertical Z as V, so stripes stay horizontal.
        axes=(1,2) if axis==0 else ((0,2) if axis==1 else (0,1))
        entry=face_usage.setdefault(face_key,{'faceCount':0,'loopCount':0,'uvMin':[1,1],'uvMax':[0,0]})
        entry['faceCount']+=1;entry['loopCount']+=len(face.loop_indices)
        for li in face.loop_indices:
            p=mesh.vertices[mesh.loops[li].vertex_index].co
            u=(p[axes[0]]-low[axes[0]])/max(high[axes[0]]-low[axes[0]],.001)
            v=(p[axes[1]]-low[axes[1]])/max(high[axes[1]]-low[axes[1]],.001)
            if face_key=='seat':
                face_coords=[mesh.vertices[mesh.loops[j].vertex_index].co for j in face.loop_indices]
                a,b=axes;amin=min(c[a] for c in face_coords);bmin=min(c[b] for c in face_coords)
                u=(p[a]-amin)/max(max(c[a] for c in face_coords)-amin,.00001)
                v=(p[b]-bmin)/max(max(c[b] for c in face_coords)-bmin,.00001)
            if face_key in ('paint','paint2','door') and axis!=2:
                # All side, nose, pillar and door faces share the same WORLD Z.
                world=obj.matrix_world@p;v=max(0,min(1,(world.z-.35)/3.2))
                # Small affine compensation for the generated door band's pixels.
                if face_key=='door':v=max(0,min(1,v*.9723+.0022))
            uv.data[li].uv=(rect[0]+u*(rect[2]-rect[0]),rect[1]+v*(rect[3]-rect[1]))
            for a,value in enumerate(uv.data[li].uv):entry['uvMin'][a]=min(entry['uvMin'][a],value);entry['uvMax'][a]=max(entry['uvMax'][a],value)
    for face_key,entry in face_usage.items():
        info=TILE_INFO[face_key];info['faceCount']+=entry['faceCount'];info['loopCount']+=entry['loopCount'];info['objects'].append({'name':obj.name,**entry})

def finish(obj, parent, key, edge=0):
    obj.parent=parent
    obj.data.materials.append(MAT[key])
    if edge:
        mod=obj.modifiers.new('Small physical edge radii','BEVEL')
        mod.width=edge
        mod.segments=2
        bpy.context.view_layer.objects.active=obj
        bpy.ops.object.modifier_apply(modifier=mod.name)
        normal=obj.modifiers.new('Area weighted bevel normals','WEIGHTED_NORMAL');normal.keep_sharp=True
        bpy.ops.object.modifier_apply(modifier=normal.name)
    if key=='seat':
        # Split only broad upholstery panels; the rounded seat outline remains
        # unchanged. Each small face receives one detailed knit-material tile.
        bm=bmesh.new();bm.from_mesh(obj.data)
        edges={edge for face in bm.faces if face.calc_area()>.008 for edge in face.edges}
        if edges:bmesh.ops.subdivide_edges(bm,edges=list(edges),cuts=3,use_grid_fill=True)
        bm.to_mesh(obj.data);bm.free();obj.data.update()
    uv_box(obj,MAT[key])
    for p in obj.data.polygons:p.use_smooth=True
    if key=='seat':
        normal=obj.modifiers.new('Recomputed upholstery panel normals','WEIGHTED_NORMAL');normal.keep_sharp=True
        bpy.context.view_layer.objects.active=obj;bpy.ops.object.modifier_apply(modifier=normal.name)
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

def tiled_floor(name,parent,width,length,z,cell=.24):
    nx=math.ceil(width/cell);ny=math.ceil(length/cell)
    verts=[(-width/2+i*width/nx,-length/2+j*length/ny,z) for j in range(ny+1) for i in range(nx+1)]
    faces=[]
    for j in range(ny):
        for i in range(nx):
            a=j*(nx+1)+i;faces.append((a,a+1,a+nx+2,a+nx+1))
    obj=mesh(name,verts,faces,parent,'floor');uv=obj.data.uv_layers.active;r=RECT['floor']
    for f in obj.data.polygons:
        for li,pair in zip(f.loop_indices,((r[0],r[1]),(r[2],r[1]),(r[2],r[3]),(r[0],r[3]))):uv.data[li].uv=pair
    return obj

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
    for n in range(12):
        yy=-8.6625+n*1.575
        cube('World aligned body panel %02d'%n,(0,yy,1.58),(2.92,1.575,.92),p,'paint',.03)
        cube('Lower access panel %02d'%n,(0,yy,1.16),(2.91,1.565,.21),p,'lower',.02)
    cube('Passenger floor',(0,0,1.25),(2.85,18.3,.1),p,'floor')
    for n in range(10):cube('Curved roof metal panel %02d'%n,(0,-8.55+n*1.9,3.68),(2.98,1.9,.54),p,'roof',.18)
    cube('Roof spine',(0,0,3.97),(1.12,14,.13),p,'roof',.07)
    for side in (-1,1):
        x=side*1.46
        cube('Window lower sill',(x,0,2.14),(.1,18.5,.18),p,'teal')
        for n in range(6):cube('Upper side rail panel',(x,-7.708+n*3.083,3.37),(.1,3.083,.18),p,'paint2',.02)
        for y in (-8.5,-6.7,-4.9,-3.1,-1.3,.5,2.3,4.1,5.9,7.7):
            cube('Window glass',(x,y,2.76),(.032,1.43,1.03),p,'glass',.04)
            for z in (2.205,3.315):cube('Window horizontal gasket',(side*1.481,y,z),(.034,1.51,.047),p,'trim',.012)
            for yy in (y-.749,y+.749):cube('Window vertical gasket',(side*1.481,yy,2.76),(.034,.043,1.07),p,'trim',.012)
            cube('Window mullion',(x,y+.78,2.77),(.12,.13,1.2),p,'paint')
        for y in (-5.7,0,5.7):
            for z in (1.17,3.39):cube('Door frame horizontal gasket',(side*1.487,y,z),(.03,1.34,.045),p,'trim',.01)
            for yy in (y-.666,y+.666):cube('Door frame vertical gasket',(side*1.487,yy,2.28),(.03,.046,2.23),p,'trim',.01)
            for offset in (-.33,.33):
                cube('Door leaf stripe aligned',(side*1.482,y+offset,2.28),(.03,.61,2.09),p,'door',.022)
                cube('Door safety glazing',(side*1.493,y+offset,2.75),(.014,.43,.74),p,'glass',.03)
                bar('Door grab rail',(side*1.488,y+offset,1.87),(side*1.488,y+offset,2.16),.012,p,'silver')
            cube('Door step',(side*1.41,y,1.02),(.18,1.36,.11),p,'metal')
            cube('Door central rubber seal',(side*1.498,y,2.28),(.012,.027,2.06),p,'trim',.004)
        for y in (-7.8,-4.1,-.4,3.3,7):
            cube('Interior seat',(side*.93,y,1.58),(.65,1.5,.2),p,'seat',.07)
            cube('Interior seat back',(side*1.23,y,1.96),(.17,1.5,.79),p,'seat',.06)
    # Original sculpted cab ends: clear front glazing above solid lower nose.
    for sign in (-1,1):
        y=sign*9.51
        verts=[];count=16
        for yy,rx,rz,zcenter in ((9.15,1.47,.64,1.75),(9.57,1.43,.66,1.76),(9.83,1.25,.55,1.76)):
            for n in range(count):
                a=2*math.pi*n/count;verts.append((rx*math.copysign(abs(math.cos(a))**.36,math.cos(a)),sign*yy,zcenter+rz*math.copysign(abs(math.sin(a))**.48,math.sin(a))))
        faces=[tuple(range(count-1,-1,-1)),tuple(range(count*2,count*3))]
        for ring in range(2):
            for n in range(count):faces.append((ring*count+n,ring*count+(n+1)%count,(ring+1)*count+(n+1)%count,(ring+1)*count+n))
        mesh('Formed rounded cab nose',verts,faces,p,'paint2')
        cube('Cab windshield',(0,y+sign*.28,2.81),(2.47,.034,1.05),p,'glass',.08)
        for x in (-1.35,1.35):
            cube('Cab pillar',(x,y,2.79),(.18,.45,1.32),p,'paint',.05)
        cube('Cab brow',(0,y,3.41),(2.83,.51,.22),p,'paint',.08)
        cube('Destination blank frame',(0,y+sign*.31,3.49),(1.35,.03,.14),p,'panel')
        for x in (-1.02,1.02):
            cube('LED surround',(x,y+sign*.36,1.83),(.53,.035,.24),p,'trim',.08)
            cube('LED headlight',(x,y+sign*.39,1.83),(.4,.025,.09),p,'light',.03)
        bar('Windshield wiper',(-.9,y+sign*.33,2.29),(-.42,y+sign*.34,2.92),.018,p,'trim')
        cylinder('Automatic coupler',(0,y+sign*.30,.75),.16,.38,p,'metal','Y')
    for y in (-6.2,6.2):
        cube('Bogie frame',(0,y,.61),(2.33,2.47,.33),p,'metal',.07)
        for ax in (-.83,.83):
            cylinder('Wheel axle',(0,y+ax,.45),.095,2.88,p,'axle','X')
            for side in (-1,1):
                cylinder('Rail steel wheel',(side*1.29,y+ax,.45),.43,.19,p,'axle','X',32)
                cylinder('Wheel flange',(side*1.2,y+ax,.45),.45,.04,p,'axle','X',32)
                cylinder('Axle bearing cap',(side*1.42,y+ax,.45),.17,.11,p,'silver','X')
                cube('Suspension spring housing',(side*1.12,y+ax,.84),(.3,.36,.23),p,'metal')
                cylinder('Rubber spring wear pad',(side*1.12,y+ax,.89),.115,.14,p,'rubber')
                for zz in (.68,.74,.80):cylinder('Stacked suspension coil',(side*1.12,y+ax,zz),.13,.035,p,'axle')
        cube('Underfloor air reservoir',(0,y+1.65,.67),(1.75,.6,.44),p,'metal',.15)
    for y in (-2.3,2.3):
        cube('Roof ventilation grille',(0,y,4.03),(1.35,1.8,.25),p,'vent',.09)
        for gy in range(8):
            cube('Roof louver',(0,y-.65+gy*.18,4.18),(1.05,.035,.018),p,'silver',.003)
    pan=empty('PantographRoot',(0,0,0),p)
    for x in (-.5,.5):
        bar('Pantograph lower arm',(x,3.6,4.2),(x,4.6,4.62),.037,pan)
        bar('Pantograph upper arm',(x,4.6,4.62),(x,3.8,5.02),.033,pan)
    cube('Pantograph copper contact strip',(0,3.8,5.05),(1.7,.14,.08),pan,'copper',.016)
    for x in (-.5,.5):cylinder('Pantograph ceramic insulator',(x,3.7,4.2),.09,.18,p,'lower')
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
    floor=tiled_floor('Cab antislip floor 24cm UV panels',p,width,3,.05);floor.location.y=.1
    cube('Blank instrument panel',(0,panel_y,panel_z),(width*.87,.26,.33),p,'panel',.045)
    cube('Panel lower console',(0,panel_y+.03,panel_z-.27),(width*.7,.32,.28),p,'panel',.04)
    cube('Panel top glare shield',(0,panel_y-.03,panel_z+.205),(width*.97,.51,.07),p,'trim',.035)
    # No painted or embossed gauge readings: runtime instruments remain authoritative.
    for side in (-1,1):
        x=side*width/2
        cube('Cab lower sidewall',(x,.03,.46),(.07,2.52,.89),p,'lower',.035)
        bar('Front window side pillar',(x,glass_y,.87),(x,glass_y+.23,2.09),.04,p,'silver')
        bar('Side window rear pillar',(x,.88,.89),(x,.88,2.06),.04,p,'silver')
        cube('Side safety glazing',(x,-.14,1.49),(.014,1.96,1.09),p,'glass',0)
        cube('Cab armrest',(side*(width/2-.15),.3,.59),(.19,.68,.16),p,'seat',.055)
    cube('Front safety glazing',(0,glass_y,1.52),(width-.09,.015,1.13),p,'glass',0)
    for x in (-width/2+.04,width/2-.04):cube('Cab windshield gasket',(x,glass_y+.006,1.52),(.035,.038,1.14),p,'trim',.008)
    for z in (.965,2.075):cube('Cab windshield gasket',(0,glass_y+.006,z),(width-.05,.038,.035),p,'trim',.008)
    for x in (-.47,.47):cube('Blank auxiliary panel surround',(x,panel_y+.136,.72),(.43,.018,.14),p,'trim',.013)
    bar('Front upper window frame',(-width/2,glass_y,2.09),(width/2,glass_y,2.09),.038,p,'silver')
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

def merge_static_by_material(root):
    animated={'TractionLever','BrakeLever'};groups={}
    for obj in list(descendants(root)):
        if obj.type!='MESH' or obj.name.startswith('Roof lining'):continue
        ancestor=obj.parent;dynamic=False
        while ancestor and ancestor!=root:
            if ancestor.name in animated:dynamic=True;break
            ancestor=ancestor.parent
        if dynamic:continue
        # Separate the few dual body-side meshes before grouping. UVs remain in
        # their true semantic tile; material extras identify the crop in GLB.
        if len(obj.data.materials)>1:
            bpy.ops.object.select_all(action='DESELECT');obj.select_set(True);bpy.context.view_layer.objects.active=obj
            bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT');bpy.ops.mesh.separate(type='MATERIAL');bpy.ops.object.mode_set(mode='OBJECT')
    for obj in list(descendants(root)):
        if obj.type!='MESH' or obj.name.startswith('Roof lining'):continue
        ancestor=obj.parent;dynamic=False
        while ancestor and ancestor!=root:
            if ancestor.name in animated:dynamic=True;break
            ancestor=ancestor.parent
        if not dynamic:groups.setdefault(obj.data.materials[obj.data.polygons[0].material_index].name,[]).append(obj)
    for name,objects in groups.items():
        bpy.ops.object.select_all(action='DESELECT')
        for obj in objects:obj.select_set(True)
        bpy.context.view_layer.objects.active=objects[0]
        if len(objects)>1:bpy.ops.object.join()
        merged=bpy.context.object;world=merged.matrix_world.copy();merged.parent=root;merged.matrix_world=world
        merged.name=root.name+'_Static_'+name.replace(' ','_')
        # Remove unused slots inherited from separation, avoiding false draws.
        bpy.ops.object.material_slot_remove_unused()

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

exterior=train()
interior=cab(KIND)
merge_static_by_material(exterior);merge_static_by_material(interior)
# Keep separate model origins while preserving an editable overview in the .blend.
export(exterior,KIND+'.glb')
export(interior,KIND+'-cab.glb')
render(exterior,DOCS/'after.png')
render(interior,DOCS/'cab-after.png',inside=True)
for o in bpy.data.objects:o.hide_render=False
interior.location.x=18 if KIND=='train' else 12
bpy.ops.object.select_all(action='DESELECT')
exterior.select_set(True)
bpy.context.view_layer.objects.active=exterior
for screen in bpy.data.screens:
    for area in screen.areas:
        if area.type=='FILE_BROWSER':area.type='VIEW_3D'
bpy.context.scene.render.filepath='//../../docs/realism/train/cab-after.png'
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
for png in [texture_path,DOCS/'after.png',DOCS/'cab-after.png']:
    clean_png_metadata(png)
manifest={'kind':KIND,'authoring':'Blender 5.2 original procedural geometry',
    'coordinates':{'up':'+Y','forward':'+Z','unit':'metre'},
    'texture':{'file':'textures/train-detail-atlas.png','source':'built-in image_gen',
    'mapping':'16 actual semantic tile crops, per face loop UV; world Z projected body and doors; Image Texture feeds Principled Base Color'},
    'assets':[]}
for filename in (KIND+'.glb',KIND+'-cab.glb'):
    raw=(OUT/filename).read_bytes();length,kind=struct.unpack_from('<II',raw,12)
    data=json.loads(raw[20:20+length])
    primitives=[p for m in data.get('meshes',[]) for p in m['primitives']]
    triangles=sum(data['accessors'][p['indices']]['count']//3 for p in primitives if 'indices' in p)
    manifest['assets'].append({'file':filename,'bytes':len(raw),'nodes':len(data.get('nodes',[])),
        'meshes':len(data.get('meshes',[])),'embeddedImages':len(data.get('images',[])),
        'draws':len(primitives),'triangles':triangles,
        'texturedMaterials':sum('baseColorTexture' in m.get('pbrMetallicRoughness',{}) for m in data.get('materials',[])),
        'uvAccessors':sum('TEXCOORD_0' in p['attributes'] for m in data.get('meshes',[]) for p in m['primitives'])})
(DOCS/'asset-manifest.json').write_text(json.dumps(manifest,indent=2),encoding='utf-8')
tile_map={'schema':1,'image':'public/textures/train-detail-atlas.png','grid':[4,4],'gutterPerTile':.03,'coordinates':'Blender UV bottom-left','worldStripeProjection':{'zMin':.35,'zMax':3.55,'doorAffineScale':.9723,'doorAffineOffset':.0022},'tiles':[]}
for key,label in TILES:
    item=dict(TILE_INFO[key]);item['objectUsage']=item['objects'];item['objects']=[o['name'] for o in item['objectUsage']]
    if not item['faceCount']:raise RuntimeError('Unused actual atlas tile: '+key)
    tile_map['tiles'].append(item)
(DOCS/'tile-map.json').write_text(json.dumps(tile_map,indent=2),encoding='utf-8')
assert manifest['assets'][0]['draws']<=45 and manifest['assets'][1]['draws']<=40
assert all(a['triangles']<=80000 for a in manifest['assets'])
import shutil
shutil.copyfile(DOCS/'after.png',ROOT/'public'/'previews'/'train.png')
print('ASSET_BUILD_VERIFIED '+json.dumps(manifest))
