"""Realistic original trainer; true 16-tile IMG UVs; Blender Z-up/-Y nose, GLTF Y-up/+Z nose."""
from pathlib import Path
import bpy, bmesh, math, json, struct, re, shutil, hashlib
from mathutils import Vector
BLENDER_DIR=Path(__file__).resolve().parent
ROOT=BLENDER_DIR.parents[1]
OUT=ROOT/'public/models';DOCS=ROOT/'docs/realism/flight';PREVIEW=ROOT/'public/previews/flight.png'
TEXTURE=ROOT/'public/textures/flight-detail-atlas.png'
SOURCE_ATLAS_HASH=hashlib.sha256(TEXTURE.read_bytes()).hexdigest()
for d in (OUT,DOCS,PREVIEW.parent):d.mkdir(parents=True,exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
atlas=bpy.data.images.load(str(TEXTURE));atlas.name='Flight 16 real IMG tiles';atlas.pack()
atlas.filepath='/'*1023;atlas.filepath='//../../public/textures/flight-detail-atlas.png';atlas.filepath_raw=atlas.filepath
for packed in atlas.packed_files:packed.filepath='/'*1023;packed.filepath=atlas.filepath
LABELS=['Ivory navy orange fuselage left','Ivory navy orange fuselage right','Riveted wing skin','Engine cooling vent','Riveted aluminium','Polished wheel hub','Rubber tyre tread','Rubber tyre sidewall','Blank cockpit powdercoat','Stitched tobacco leather','Woven upholstery','Matte cockpit plastic','Control hinge skin','Mechanical gear steel','Antislip floor','Faint glass smudges']
RECT={}
for tile in range(1,17):
    row,col=divmod(tile-1,4);g=.03/4;RECT[tile]=(col/4+g,(3-row)/4+g,(col+1)/4-g,(4-row)/4-g)
MAT={}
for tile in range(1,17):
    m=bpy.data.materials.new(f'Tile {tile:02d} {LABELS[tile-1]}');m.use_nodes=True;m['tile_id']=tile;m['atlas_file']='textures/flight-detail-atlas.png'
    b=next(node for node in m.node_tree.nodes if node.type=='BSDF_PRINCIPLED');n=m.node_tree.nodes.new('ShaderNodeTexImage');n.image=atlas;n.name=f'Real IMG tile {tile:02d}';n.extension='EXTEND';m.node_tree.links.new(n.outputs['Color'],b.inputs['Base Color'])
    b.inputs['Metallic'].default_value={1:.035,2:.035,3:.055,4:.16,5:.82,6:.94,13:.07,14:.86}.get(tile,0)
    b.inputs['Roughness'].default_value={1:.31,2:.31,3:.33,4:.58,5:.34,6:.20,7:.93,8:.96,9:.79,10:.66,11:.95,12:.80,13:.33,14:.29,15:.93,16:.075}[tile]
    if tile in (1,2,3):b.inputs['Coat Weight'].default_value=.28;b.inputs['Coat Roughness'].default_value=.18
    if tile==16:
        b.inputs['Alpha'].default_value=.09;b.inputs['Transmission Weight'].default_value=.18;b.inputs['IOR'].default_value=1.45
        m.surface_render_method='BLENDED';m.use_transparency_overlap=False;m.diffuse_color=(.8,.9,1,.09)
    MAT[tile]=m
ACCENT={}
for name,col,emit in [('orange',(.9,.26,.06),0),('red',(.75,.03,.02),1.5),('green',(.03,.42,.14),1.5),('studio',(.055,.065,.076),0),('charcoal',(.025,.033,.037),0),('ivory',(.74,.75,.70),0)]:
    m=bpy.data.materials.new(name);m.use_nodes=True;b=next(node for node in m.node_tree.nodes if node.type=='BSDF_PRINCIPLED');b.inputs['Base Color'].default_value=(*col,1)
    if name=='studio':b.inputs['Roughness'].default_value=.95
    if name=='charcoal':b.inputs['Roughness'].default_value=.68
    if name=='ivory':b.inputs['Roughness'].default_value=.34;b.inputs['Coat Weight'].default_value=.24
    if emit:b.inputs['Emission Color'].default_value=(*col,1);b.inputs['Emission Strength'].default_value=emit
    ACCENT[name]=m
def empty(name,loc=(0,0,0),parent=None):
    o=bpy.data.objects.new(name,None);bpy.context.collection.objects.link(o);o.location=loc;o.parent=parent;return o
def uv_rect(o,tile,per_face=False):
    d=o.data;uv=d.uv_layers.active or d.uv_layers.new(name='Flight16TileUV');uv.name='Flight16TileUV';r=RECT[tile];coords=[v.co for v in d.vertices]
    # Paint and hinge skin sample the uniform microtexture region. Actual
    # panel joins / fasteners are geometry, never giant baked atlas lines.
    roi={3:(.06,.08,.58,.38),5:(.10,.12,.42,.40),13:(.65,.15,.92,.65),14:(.08,.08,.90,.90)}.get(tile)
    if roi:r=(r[0]+roi[0]*(r[2]-r[0]),r[1]+roi[1]*(r[3]-r[1]),r[0]+roi[2]*(r[2]-r[0]),r[1]+roi[3]*(r[3]-r[1]))
    lo=[min(p[a] for p in coords) for a in range(3)];hi=[max(p[a] for p in coords) for a in range(3)]
    for f in d.polygons:
        axis=max(range(3),key=lambda a:abs(f.normal[a]));axes=(1,2) if axis==0 else ((0,2) if axis==1 else (0,1));low,high=lo,hi
        if per_face:
            pts=[d.vertices[d.loops[i].vertex_index].co for i in f.loop_indices];low=[min(p[a] for p in pts) for a in range(3)];high=[max(p[a] for p in pts) for a in range(3)]
        for li in f.loop_indices:
            p=d.vertices[d.loops[li].vertex_index].co;u=max(0,min(1,(p[axes[0]]-low[axes[0]])/max(.00001,high[axes[0]]-low[axes[0]])));v=max(0,min(1,(p[axes[1]]-low[axes[1]])/max(.00001,high[axes[1]]-low[axes[1]])))
            uv.data[li].uv=(r[0]+u*(r[2]-r[0]),r[1]+v*(r[3]-r[1]))
def finish(o,parent,tile,edge=0,smooth=True):
    o.parent=parent;o.data.materials.append(MAT[tile] if isinstance(tile,int) else ACCENT[tile]);o['semantic_part']=o.name
    if edge:
        m=o.modifiers.new('Physical edge radius','BEVEL');m.width=edge;m.segments=3;bpy.context.view_layer.objects.active=o;bpy.ops.object.modifier_apply(modifier=m.name)
        for f in o.data.polygons:f.use_smooth=True
        m=o.modifiers.new('Weighted manufactured surface normals','WEIGHTED_NORMAL');m.keep_sharp=True
        bpy.ops.object.modifier_apply(modifier=m.name)
    if isinstance(tile,int):uv_rect(o,tile)
    for f in o.data.polygons:f.use_smooth=smooth or bool(edge)
    return o
def mesh(name,verts,faces,parent,tile,edge=0,smooth=True):
    d=bpy.data.meshes.new(name);d.from_pydata(verts,[],faces);d.update()
    bm=bmesh.new();bm.from_mesh(d);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(d);bm.free();d.update()
    o=bpy.data.objects.new(name,d);bpy.context.collection.objects.link(o);return finish(o,parent,tile,edge,smooth)
def cube(name,loc,size,parent,tile=3,edge=.015):
    bpy.ops.mesh.primitive_cube_add(size=1,location=loc);o=bpy.context.object;o.name=name;o.dimensions=size;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);return finish(o,parent,tile,edge,False)
def sphere(name,loc,size,parent,tile=3):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=32,ring_count=16,location=loc);o=bpy.context.object;o.name=name;o.scale=size;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);return finish(o,parent,tile)
def cylinder(name,loc,radius,depth,parent,tile=14,axis='Z',vertices=24):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices,radius=radius,depth=depth,location=loc,rotation={'Z':(0,0,0),'X':(0,math.pi/2,0),'Y':(math.pi/2,0,0)}[axis]);o=bpy.context.object;o.name=name;bpy.ops.object.transform_apply(location=False,rotation=True,scale=True);return finish(o,parent,tile,.003)
def bar(name,a,b,r,parent,tile=14):
    a,b=Vector(a),Vector(b);o=cylinder(name,(a+b)/2,r,(b-a).length,parent,tile,vertices=12);o.rotation_euler=(b-a).to_track_quat('Z','Y').to_euler();return o
def seam(name,points,parent,tile=12,r=.005):
    curve=bpy.data.curves.new(name,'CURVE');curve.dimensions='3D';curve.resolution_u=1;curve.bevel_depth=r;curve.bevel_resolution=1;curve.use_fill_caps=True
    poly=curve.splines.new('POLY');poly.points.add(len(points)-1)
    for p,co in zip(poly.points,points):p.co=(*co,1)
    o=bpy.data.objects.new(name,curve);bpy.context.collection.objects.link(o)
    bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o;bpy.ops.object.convert(target='MESH')
    return finish(o,parent,tile)
def aerofoil(name,parent,span,chord,pos,t=.12,tile=3,sections=6,animated=False):
    n=32;profile=[]
    for side in (1,-1):
        for i in (range(n) if side==1 else range(n-2,0,-1)):
            x=(1-math.cos(math.pi*i/(n-1)))/2;yt=5*t*(.2969*math.sqrt(x)-.126*x-.3516*x*x+.2843*x**3-.1036*x**4)
            camber=.02*(2*.4*x-x*x)/(.4*.4) if x<.4 else .02*((1-2*.4)+2*.4*x-x*x)/(.6*.6)
            profile.append((x,camber+side*yt))
    count=len(profile);verts=[]
    for k in range(sections+1):
        xx=-span/2+span*k/sections;tip=abs(xx)/(span/2);factor=1-.13*tip**3 if not animated else 1
        # Animated coordinates start at the real leading hinge, keeping the
        # existing runtime node origin and local X animation contract.
        for a,b in profile:verts.append((xx,(a if animated else a-.5)*chord*factor,chord*b*factor))
    faces=[tuple(range(count-1,-1,-1)),tuple(range(sections*count,(sections+1)*count))]
    for j in range(sections):
        for k in range(count):faces.append((j*count+k,j*count+(k+1)%count,(j+1)*count+(k+1)%count,(j+1)*count+k))
    o=mesh(name,verts,faces,parent,tile);o.location=pos;return o

def main_wing(parent):
    stations=[-5.16,-5.13,-5.07,-4.96,-4.75,-4.70,-3.68,-2.66,-2.64,-1.78,-.92,-.86,0,.86,.92,1.78,2.64,2.66,3.68,4.70,4.75,4.96,5.07,5.13,5.16]
    n=32;profile=[]
    for side in (1,-1):
        for i in (range(n) if side==1 else range(n-2,0,-1)):profile.append(((1-math.cos(math.pi*i/(n-1)))/2,side))
    count=len(profile);verts=[]
    for xx in stations:
        ax=abs(xx);tip=ax/5.16;chord=1.65-.30*tip**1.7
        if ax>4.96:chord*=max(.035,math.sqrt(max(0,1-((ax-4.96)/.205)**2)))
        leading=-1.06+.085*tip**2;trailing=leading+chord
        # Flaps and ailerons are separate real surfaces after the hinge gap.
        hinge=.329 if ax<2.65 else .345
        cut=min(1,(hinge-leading)/chord) if .90<=ax<=4.71 else 1
        for a,side in profile:
            x=a*cut;thick=5*.135*(.2969*math.sqrt(x)-.126*x-.3516*x*x+.2843*x**3-.1036*x**4)
            camber=.02*(2*.4*x-x*x)/(.4*.4) if x<.4 else .02*((1-2*.4)+2*.4*x-x*x)/(.6*.6)
            verts.append((xx,leading+x*chord,2.17+(camber+side*thick)*chord))
    faces=[tuple(range(count-1,-1,-1)),tuple(range((len(stations)-1)*count,len(stations)*count))]
    for j in range(len(stations)-1):
        for k in range(count):faces.append((j*count+k,j*count+(k+1)%count,(j+1)*count+(k+1)%count,(j+1)*count+k))
    return mesh('Tapered high wing with rounded tips and hinge cutouts',verts,faces,parent,3)

def vertical_foil(name,parent,stations,tile=3,pos=(0,0,0)):
    n=24;profile=[]
    for side in (1,-1):
        for i in (range(n) if side==1 else range(n-2,0,-1)):profile.append(((1-math.cos(math.pi*i/(n-1)))/2,side))
    count=len(profile);verts=[]
    for z,front,rear,thickness in stations:
        for a,side in profile:
            naca=5*(.2969*math.sqrt(a)-.126*a-.3516*a*a+.2843*a**3-.1036*a**4)
            verts.append((side*naca*thickness,front+a*(rear-front),z))
    faces=[tuple(range(count-1,-1,-1)),tuple(range((len(stations)-1)*count,len(stations)*count))]
    for j in range(len(stations)-1):
        for k in range(count):faces.append((j*count+k,j*count+(k+1)%count,(j+1)*count+(k+1)%count,(j+1)*count+k))
    o=mesh(name,verts,faces,parent,tile);o.location=pos;return o

def annular_intake(parent,x):
    verts=[];n=32
    for y,rx,rz in [(-3.675,.137,.099),(-3.665,.125,.087),(-3.627,.108,.074)]:
        for k in range(n):a=math.tau*k/n;verts.append((x+rx*math.cos(a),y,1.305+rz*math.sin(a)))
    faces=[]
    for j in range(2):
        for k in range(n):faces.append((j*n+k,j*n+(k+1)%n,(j+1)*n+(k+1)%n,(j+1)*n+k))
    mesh('Formed cowling air intake lip',verts,faces,parent,3)
    verts=[(x,-3.625,1.305)]+[(x+.107*math.cos(math.tau*k/n),-3.625,1.305+.073*math.sin(math.tau*k/n)) for k in range(n)]
    mesh('Recessed black engine inlet',verts,[(0,k+1,(k+1)%n+1) for k in range(n)],parent,4,smooth=False)

def fuselage(parent):
    base=[(-3.62,.385,.32,1.305),(-3.47,.405,.342,1.305),(-3.15,.465,.39,1.315),(-2.75,.51,.43,1.33),(-2.12,.575,.49,1.345),(-1.56,.64,.56,1.36),(-1.16,.686,.637,1.375),(-.58,.707,.68,1.40),(.05,.695,.67,1.415),(.70,.64,.61,1.44),(1.26,.53,.48,1.47),(1.89,.405,.335,1.52),(2.56,.285,.232,1.60),(3.18,.178,.16,1.66),(3.77,.07,.097,1.715),(4.00,.024,.043,1.73)]
    stations=[]
    # Catmull-Rom interpolation makes the cowling, cabin shoulder and tail
    # continuously curved rather than a sequence of long conical facets.
    for j in range(len(base)-1):
        p0=Vector(base[max(0,j-1)]);p1=Vector(base[j]);p2=Vector(base[j+1]);p3=Vector(base[min(len(base)-1,j+2)])
        for k in range(3):
            t=k/3;stations.append(tuple(.5*((2*p1)+(-p0+p2)*t+(2*p0-5*p1+4*p2-p3)*t*t+(-p0+3*p1-3*p2+p3)*t*t*t)))
    stations.append(base[-1]);n=64;verts=[]
    for yy,rx,rz,zz in stations:
        for k in range(n):a=2*math.pi*k/n;verts.append((rx*math.cos(a),yy,zz+rz*math.sin(a)))
    faces=[tuple(range(n-1,-1,-1)),tuple(range((len(stations)-1)*n,len(stations)*n))]
    for j in range(len(stations)-1):
        for k in range(n):
            ids=(j*n+k,j*n+(k+1)%n,(j+1)*n+(k+1)%n,(j+1)*n+k);center=sum((Vector(verts[v]) for v in ids),Vector())/4
            if -1.45<center.y<1.04 and center.z>1.485:continue
            faces.append(ids)
    o=mesh('Smooth formed fuselage with open cabin',verts,faces,parent,1);o.data.materials.append(MAT[2]);uv=o.data.uv_layers.active
    for f in o.data.polygons:
        tile=1 if f.center.x<0 else 2;f.material_index=0 if tile==1 else 1;r=RECT[tile]
        for li in f.loop_indices:
            v=o.data.vertices[o.data.loops[li].vertex_index].co
            # Preserve the coherent livery height while sampling a rivet-free
            # paint strip. Cowling joins and bolts are actual small geometry.
            u=.16+.075*(((v.y+3.62)% .42)/.42);vv=(v.z-.75)/1.42
            uv.data[li].uv=(r[0]+u*(r[2]-r[0]),r[1]+max(0,min(1,vv))*(r[3]-r[1]))
def tyre(name,loc,radius,width,parent):
    bpy.ops.mesh.primitive_torus_add(major_segments=48,minor_segments=16,location=loc,major_radius=radius*.75,minor_radius=radius*.25,rotation=(0,math.pi/2,0));o=bpy.context.object;o.name=name;o.scale.z=width/(radius*.5);bpy.ops.object.transform_apply(location=False,rotation=True,scale=True);finish(o,parent,7);o.data.materials.append(MAT[8]);uv=o.data.uv_layers.active
    lo=[min(v.co[a] for v in o.data.vertices) for a in range(3)];hi=[max(v.co[a] for v in o.data.vertices) for a in range(3)]
    for f in o.data.polygons:
        tile=8 if abs(f.normal.x)>.55 else 7;f.material_index=1 if tile==8 else 0;r=RECT[tile]
        for li in f.loop_indices:
            v=o.data.vertices[o.data.loops[li].vertex_index].co;u=(v.y-lo[1])/max(.0001,hi[1]-lo[1]);vv=(v.z-lo[2])/max(.0001,hi[2]-lo[2]);uv.data[li].uv=(r[0]+u*(r[2]-r[0]),r[1]+vv*(r[3]-r[1]))
def aircraft():
    p=empty('AircraftRoot');fuselage(p);main_wing(p)
    for sign in (-1,1):
        aerofoil('AileronLeft' if sign<0 else 'AileronRight',p,2.04,.275,(sign*3.68,.36,2.17),t=.085,tile=13,sections=7,animated=True)
        aerofoil('FlapLeft' if sign<0 else 'FlapRight',p,1.72,.30,(sign*1.78,.34,2.165),t=.095,tile=13,sections=6,animated=True)
        # A real flattened lift strut, with bolted ends and a small jury strut.
        a=Vector((sign*.60,-.29,1.02));b=Vector((sign*3.02,-.25,2.16))
        strut=cube('Faired wing lift strut',(a+b)/2,(.045,.092,(b-a).length),p,3,.020)
        strut.rotation_euler=(b-a).to_track_quat('Z','Y').to_euler()
        cylinder('Wing strut eye bolt',(sign*3.02,-.25,2.16),.024,.105,p,14,axis='Y',vertices=12)
        bar('Jury strut',(sign*1.42,-.29,1.41),(sign*1.55,-.27,2.06),.011,p,5)
        sphere('Wingtip lamp',(sign*5.105,-.79,2.20),(.048,.10,.035),p,'red' if sign<0 else 'green')
        for x in (1.06,2.50,2.84,4.47):
            cylinder('Physical control hinge knuckle',(sign*x,.348,2.17),.010,.075,p,14,axis='X',vertices=12)
        # Root fillet closes the wing/cabin join without a rectangular block.
        v=[]
        for yy in (-.78,-.20,.56):
            for i in range(7):
                a=i/6;v.append((sign*(.49+.39*a),yy,2.098+.115*math.sin(a*math.pi/2)))
        mesh('Curved wing root fillet',v,[(j*7+i,j*7+i+1,(j+1)*7+i+1,(j+1)*7+i) for j in range(2) for i in range(6)],p,3)
        for x in (1.1,1.45,1.8,2.15,2.5,2.9,3.3,3.7,4.1,4.5):
            cylinder('Flush wing fastener',(sign*x,-.42,2.298),.0028,.0015,p,5,vertices=8)
    aerofoil('Horizontal stabilizer profile',p,3.25,.78,(0,3.16,1.74),t=.105);aerofoil('Elevator',p,3.05,.25,(0,3.59,1.73),t=.075,tile=13,sections=3,animated=True)
    vertical_foil('Swept airfoil vertical stabilizer',p,[(1.67,2.34,3.82,.18),(1.93,2.67,3.82,.18),(2.53,2.92,3.82,.14),(2.89,3.09,3.79,.105),(2.94,3.16,3.77,.04)])
    vertical_foil('Rudder',p,[(-.45,-.01,.27,.12),(-.17,-.02,.265,.12),(.30,-.025,.22,.10),(.68,-.07,.125,.07),(.72,-.08,.10,.024)],13,(0,3.86,2.2))
    # Gently bowed, 4 mm laminated front windshield with stable clear alpha.
    v=[]
    for j in range(5):
        t=j/4;w=.62-.12*t
        for i in range(9):
            a=-1+2*i/8;v.append((a*w,-1.43+.67*t-.028*(1-a*a),1.48+.61*t))
    wind=mesh('Curved laminated windshield',v,[(j*9+i,j*9+i+1,(j+1)*9+i+1,(j+1)*9+i) for j in range(4) for i in range(8)],p,16)
    mod=wind.modifiers.new('Actual 4mm glass','SOLIDIFY');mod.thickness=.004;bpy.context.view_layer.objects.active=wind;bpy.ops.object.modifier_apply(modifier=mod.name)
    for sign in (-1,1):
        mesh('Door side glazing',[(sign*.66,-1.38,1.49),(sign*.64,.55,1.49),(sign*.51,.53,2.09),(sign*.51,-.77,2.09)],[(0,1,2,3)],p,16,smooth=False)
        mesh('Rear quarter glazing',[(sign*.638,.61,1.49),(sign*.59,1.035,1.51),(sign*.50,.95,1.92),(sign*.51,.60,2.08)],[(0,1,2,3)],p,16,smooth=False)
        seam('Windshield seal',[(sign*.62,-1.43,1.48),(sign*.5,-.76,2.09),(sign*.51,.56,2.09),(sign*.64,.61,1.49)],p,12,.012)
        bar('Front structural pillar',(sign*.62,-1.43,1.48),(sign*.5,-.76,2.1),.033,p,3);bar('Door rear structural pillar',(sign*.64,.58,1.47),(sign*.51,.57,2.09),.031,p,3)
        bar('Quarter window rear frame',(sign*.59,1.035,1.51),(sign*.50,.95,1.92),.024,p,3)
        seam('Physical 2.5mm door gap',[(sign*.657,-1.1,1.43),(sign*.693,-1.1,1.08),(sign*.65,.58,1.06),(sign*.653,.6,1.47)],p,'charcoal',.00125)
        bar('Brushed door pull',(sign*.689,.24,1.48),(sign*.689,.39,1.48),.010,p,6)
        for y in (-.88,.38):cylinder('Flush door hinge',(sign*.674,y,1.22),.02,.015,p,13,axis='X',vertices=12)
    cube('Smooth cabin roof',(0,-.1,2.1),(1.04,1.44,.065),p,3,.04)
    mesh('Tapered aft cabin roof',[(-.51,.58,2.08),(.51,.58,2.08),(.50,.95,1.92),(-.50,.95,1.92)],[(0,1,2,3)],p,3,smooth=False)
    for x in (-.32,.32):
        cube('Interior leather cushion',(x,.18,1.17),(.48,.6,.13),p,10,.065);cube('Interior leather back',(x,.5,1.48),(.48,.13,.64),p,10,.058);cloth('Interior woven insert',(x,.429,1.49),.34,.45,p)
    cube('Visible blank exterior cockpit dashboard',(0,-1.20,1.355),(1.14,.24,.205),p,9,.032)
    cube('Exterior cockpit glare shield',(0,-1.21,1.466),(1.21,.30,.035),p,'charcoal',.013)
    cube('Exterior footwell floor',(0,-.12,.975),(1.05,1.95,.025),p,15,.01)
    for x in (-.249,.249):annular_intake(p,x)
    for yy,rx,rz,cz in [(-2.79,.51,.43,1.33),(-2.16,.573,.49,1.345)]:
        pts=[(rx*math.cos(math.pi*i/20),yy,cz+rz*math.sin(math.pi*i/20)+.002) for i in range(21)]
        seam('Fine cowling access joint',pts,p,'charcoal',.001)
    cylinder('Exhaust outlet',(.18,-2.97,.90),.035,.14,p,14,axis='Z',vertices=20)
    bar('Pitot tube',(2.05,-.43,2.04),(2.05,-.99,2.04),.007,p,14)
    bar('VHF antenna',(0,.25,2.30),(0,.42,2.67),.007,p,3)
    for sign in (-1,1):
        x=sign*1.05;stations=[(sign*.38,.42,1.06),(sign*.58,.42,.76),(sign*.84,.42,.49),(sign*1.05,.42,.31)];verts=[]
        for xx,yy,zz in stations:
            verts.extend([(xx-.010,yy-.055,zz),(xx+.010,yy-.055,zz),(xx+.010,yy+.055,zz),(xx-.010,yy+.055,zz)])
        faces=[(3,2,1,0),(12,13,14,15)]+[(j*4+k,j*4+(k+1)%4,(j+1)*4+(k+1)%4,(j+1)*4+k) for j in range(3) for k in range(4)]
        mesh('Formed flat spring main landing gear',verts,faces,p,14,.004)
        sphere('Gear attachment fairing',(sign*.42,.42,1.00),(.12,.17,.075),p,3)
        cylinder('Main gear bearing',(x,.42,.29),.087,.23,p,14,axis='X');tyre('Rounded main tyre',(x,.42,.28),.28,.18,p);cylinder('Polished main hub',(x+sign*.096,.42,.28),.14,.026,p,6,axis='X',vertices=40);cylinder('Axle nut',(x+sign*.114,.42,.28),.026,.02,p,14,axis='X',vertices=6)
        for k in range(6):
            a=math.tau*k/6;cylinder('Actual hub bolt',(x+sign*.115,.42+.098*math.cos(a),.28+.098*math.sin(a)),.009,.007,p,14,axis='X',vertices=8)
    bar('Nose oleo strut',(0,-2.42,1.0),(0,-2.42,.27),.033,p,14);cylinder('Shock collar',(0,-2.42,.74),.056,.16,p,5)
    for sign in (-1,1):bar('Nose wheel fork',(sign*.092,-2.42,.5),(sign*.092,-2.42,.26),.018,p,14)
    bar('Oleo torque link upper',(.050,-2.42,.67),(.050,-2.50,.56),.009,p,14);bar('Oleo torque link lower',(.050,-2.50,.56),(.050,-2.42,.47),.009,p,14)
    tyre('Rounded nose tyre',(0,-2.42,.25),.25,.15,p);cylinder('Polished nose hub',(.081,-2.42,.25),.123,.021,p,6,axis='X',vertices=40)
    prop=empty('PropellerRoot',(0,-3.86,1.34),p)
    rings=[(-.30,.003),(-.24,.07),(-.16,.128),(-.06,.171),(.06,.192),(.18,.194),(.22,.188)];n=40;verts=[]
    for yy,r in rings:
        for i in range(n):a=math.tau*i/n;verts.append((r*math.cos(a),yy,r*math.sin(a)))
    faces=[tuple(range(n-1,-1,-1)),tuple(range((len(rings)-1)*n,len(rings)*n))]+[(j*n+k,j*n+(k+1)%n,(j+1)*n+(k+1)%n,(j+1)*n+k) for j in range(len(rings)-1) for k in range(n)]
    mesh('Formed ivory spinner',verts,faces,prop,'ivory')
    for sign in (-1,1):
        sections=[(.15,.06,37),(.28,.145,31),(.52,.165,25),(.83,.13,19),(1.03,.091,15),(1.13,.040,12),(1.15,.008,12)];n=14;verts=[]
        for radial,chord,angle in sections:
            twist=math.radians(angle)
            for k in range(n):
                a=math.tau*k/n;xx=math.cos(a)*chord/2;yy=math.sin(a)*.014;verts.append((sign*(xx*math.cos(twist)-yy*math.sin(twist)),xx*math.sin(twist)+yy*math.cos(twist),sign*radial))
        faces=[tuple(range(n-1,-1,-1)),tuple(range((len(sections)-1)*n,len(sections)*n))]+[(j*n+k,j*n+(k+1)%n,(j+1)*n+(k+1)%n,(j+1)*n+k) for j in range(len(sections)-1) for k in range(n)]
        blade=mesh('Twisted tapered aluminium propeller blade',verts,faces,prop,5);blade.data.materials.append(ACCENT['orange'])
        for face in blade.data.polygons:
            if abs(face.center.z)>1.045:face.material_index=1
    empty('PilotAnchor',(0,-1,1.5),p);return p
def cloth(name,center,width,height,parent,axis='XZ'):
    # Fine upholstery weave repeats on 55 mm patches, never across an entire seat.
    nx=math.ceil(width/.055);ny=math.ceil(height/.055);verts=[];faces=[]
    for iy in range(ny+1):
        for ix in range(nx+1):
            a=-width/2+width*ix/nx;b=-height/2+height*iy/ny
            verts.append((center[0]+a,center[1]+b,center[2]) if axis=='XY' else (center[0]+a,center[1],center[2]+b))
    for iy in range(ny):
        for ix in range(nx):a=iy*(nx+1)+ix;faces.append((a,a+1,a+nx+2,a+nx+1))
    o=mesh(name,verts,faces,parent,11,smooth=False);uv_rect(o,11,per_face=True);return o

def inner_surface(name,center,width,height,parent,tile=12,plane='YZ',cell=.14):
    nx=math.ceil(width/cell);ny=math.ceil(height/cell);verts=[]
    for j in range(ny+1):
        for i in range(nx+1):
            a=-width/2+width*i/nx;b=-height/2+height*j/ny
            verts.append((center[0],center[1]+a,center[2]+b) if plane=='YZ' else (center[0]+a,center[1],center[2]+b))
    faces=[]
    for j in range(ny):
        for i in range(nx):a=j*(nx+1)+i;faces.append((a,a+1,a+nx+2,a+nx+1))
    o=mesh(name,verts,faces,parent,tile,smooth=False);uv_rect(o,tile,per_face=True);return o

def cab():
    p=empty('AircraftCabRoot');w=1.5;py=-.7;pz=.9;gy=-1.4;verts=[];faces=[]
    for yy in range(8):
        for xx in range(5):verts.append((-w/2+xx*w/4,-1.4+yy*.4,.025))
    for yy in range(7):
        for xx in range(4):a=yy*5+xx;faces.append((a,a+1,a+6,a+5))
    floor=mesh('Actual anti-slip floor cells',verts,faces,p,15,smooth=False);uv_rect(floor,15,per_face=True)
    cube('Blank instrument panel',(0,py,pz),(1.28,.24,.3),p,9,.06);cube('Blank lower console',(0,py+.035,pz-.255),(.93,.32,.22),p,9,.045);cube('Smooth matte glare shield',(0,py-.05,pz+.18),(1.39,.48,.075),p,'charcoal',.04)
    for x in (-.57,-.31,0,.31,.57):cylinder('Flush panel screw',(x,py+.125,pz+.11),.009,.007,p,14,axis='Y',vertices=8)
    for sign in (-1,1):
        x=sign*w/2;cube('Moulded matte cabin wall',(x,.02,.44),(.07,2.45,.84),p,'charcoal',.03);bar('Swept front pillar',(x,gy,.87),(sign*.69,gy+.22,2.07),.031,p,3);bar('Rear window pillar',(x,.87,.86),(x,.85,2.04),.03,p,3)
        cube('Transparent side glazing',(x,-.17,1.47),(.008,1.96,1.08),p,16,0);cube('Leather armrest',(sign*.6,.29,.6),(.18,.65,.15),p,10,.055);seam('Armrest stitch',[(sign*.55,.03,.674),(sign*.55,.56,.674)],p,10,.0011);seam('Interior door trim',[(sign*.715,-1.18,.82),(sign*.715,.79,.82)],p,12,.009)
    cube('Clear front windshield',(0,gy,1.5),(1.4,.008,1.14),p,16,0);bar('Upper windshield frame',(-.73,gy,2.075),(.73,gy,2.075),.033,p,3);cube('Roof lining',(0,.0,2.13),(1.5,2.83,.043),p,12,.015)
    for x in (-.32,.32):
        cube('Padded leather cushion',(x,.64,.44),(.51,.6,.155),p,10,.068);cube('Padded leather back',(x,.93,.81),(.51,.15,.74),p,10,.065);cloth('Cushion woven insert',(x,.61,.522),.345,.415,p,'XY');cloth('Back woven insert',(x,.848,.8),.345,.5,p);cube('Steel seat pedestal',(x,.64,.22),(.23,.26,.3),p,14,.025)
        cube('Padded headrest',(x,.958,1.255),(.25,.105,.155),p,10,.040)
        for dx in (-.14,.14):cube('Seat adjustment rail',(x+dx,.60,.385),(.021,.62,.022),p,14,.004)
        for dx in (-.205,.205):
            seam('Cushion sewn piping',[(x+dx,.39,.511),(x+dx,.86,.511)],p,10,.0011);seam('Back double stitch',[(x+dx,.848,.54),(x+dx,.848,1.08)],p,10,.0011)
        a=Vector((x-.15,.836,.55));b=Vector((x+.15,.836,1.08));belt=cube('Flat woven shoulder webbing',(a+b)/2,(.034,.004,(b-a).length),p,12,.001)
        belt.rotation_euler=(b-a).to_track_quat('Z','Y').to_euler();cube('Harness buckle',(x,.83,.72),(.065,.025,.052),p,6,.01)
    for x in (-.34,.34):
        yoke=empty('YokeLeft' if x<0 else 'YokeRight',(x,py+.25,pz-.015),p);bar('Polished yoke column',(0,0,0),(0,.27,0),.022,yoke,6);bar('Matte yoke lower grip',(-.13,.27,0),(.13,.27,0),.022,yoke,12)
        for sign in (-1,1):bar('Yoke palm grip',(sign*.13,.27,0),(sign*.13,.27,.11),.024,yoke,12)
        for dx in (-.105,.105):cube('Rudder rubber pedal',(x+dx,py+.19,.13),(.12,.16,.045),p,15,.017)
    for x,tile,name in ((-.08,12,'Throttle'),(.07,10,'Mixture')):
        bar(name+' shaft',(x,py+.14,pz),(x,py+.33,pz),.009,p,14);sphere(name+' grip',(x,py+.34,pz),(.025,.021,.025),p,tile)
    return p
ANIMATED={'AileronLeft','AileronRight','FlapLeft','FlapRight','Elevator','Rudder'}
def descendants(root):return [root]+list(root.children_recursive)
def collect_tiles(roots):
    tiles={i:{'tileId':i,'row':(i-1)//4+1,'column':(i-1)%4+1,'label':LABELS[i-1],'uvRect':list(RECT[i]),'faceCount':0,'loopCount':0,'objects':[]} for i in range(1,17)}
    for root in roots:
        for o in descendants(root):
            if o.type!='MESH':continue
            covered=set()
            for f in o.data.polygons:
                tile=o.data.materials[f.material_index].get('tile_id')
                if not tile:continue
                tiles[tile]['faceCount']+=1;tiles[tile]['loopCount']+=len(f.loop_indices);covered.add(tile);r=RECT[tile];uv=o.data.uv_layers.active
                for li in f.loop_indices:
                    u,v=uv.data[li].uv
                    if not(r[0]-.00001<=u<=r[2]+.00001 and r[1]-.00001<=v<=r[3]+.00001):raise ValueError(f'UV outside tile {tile}: {o.name}')
            for tile in covered:tiles[tile]['objects'].append(o.name)
    if any(t['faceCount']==0 for t in tiles.values()):raise ValueError('All sixteen IMG tiles must own real faces')
    return list(tiles.values())
def merge_static(root):
    groups={}
    for o in descendants(root):
        if o.type!='MESH' or o.name in ANIMATED or o.name=='Roof lining':continue
        groups.setdefault((o.parent.name,tuple(m.name for m in o.data.materials)),[]).append(o)
    for (parent,mats),objects in groups.items():
        if len(objects)<2:continue
        source=[o.name for o in objects];bpy.ops.object.select_all(action='DESELECT')
        for o in objects:o.select_set(True)
        bpy.context.view_layer.objects.active=objects[0];bpy.ops.object.join();o=bpy.context.object
        # The runtime matches PropellerRoot by regexp. Descendant mesh names
        # must not match it too or the blades receive a second rotation.
        o.name=f'{"PropellerAssembly" if parent=="PropellerRoot" else parent} '+mats[0];o['source_parts']=json.dumps(source)
def export(root,name):
    bpy.ops.object.select_all(action='DESELECT')
    for o in descendants(root):o.select_set(True)
    bpy.context.view_layer.objects.active=root
    bpy.ops.export_scene.gltf(filepath=str(OUT/name),export_format='GLB',use_selection=True,export_yup=True,export_texcoords=True,export_normals=True,export_materials='EXPORT',export_cameras=False,export_lights=False,export_extras=True)
def render(root,path,inside=False,detail=None):
    s=bpy.context.scene;visible=set(descendants(root))
    for o in bpy.data.objects:
        if o.type=='MESH':o.hide_render=o not in visible
    if inside:
        for o in descendants(root):
            if o.type=='MESH' and (o.name=='Roof lining' or any(m.get('tile_id')==16 for m in o.data.materials)):o.hide_render=True
    s.render.engine='BLENDER_EEVEE';s.render.resolution_x=1400 if not detail else 1000;s.render.resolution_y=1050 if not detail else 750;s.render.resolution_percentage=100;s.render.image_settings.file_format='PNG';s.render.use_stamp=False;s.render.filepath=str(path)
    s.view_settings.view_transform='AgX'
    try:s.view_settings.look='AgX - Medium High Contrast'
    except TypeError:pass
    s.world=bpy.data.worlds.new('Soft photographic studio') if not s.world else s.world;s.world.use_nodes=True
    background=next(node for node in s.world.node_tree.nodes if node.type=='BACKGROUND')
    background.inputs[0].default_value=(.12,.17,.23,1);background.inputs[1].default_value=.35
    target=Vector((0,0,1.35));loc=(10,-13,6.8)
    if inside:loc=(2.7,.25,2.45);target=Vector((0,-.12,.87))
    if detail=='cowling':loc=(3.2,-7.0,2.5);target=Vector((0,-2.65,1.27))
    if detail=='gear':loc=(3.3,-3.1,1.65);target=Vector((.35,-.35,.65))
    bpy.ops.object.camera_add(location=loc);camera=bpy.context.object;camera.rotation_euler=(target-camera.location).to_track_quat('-Z','Y').to_euler();camera.data.lens=35 if inside or detail=='gear' else 52;s.camera=camera;lamps=[]
    for pos,power,size in (((-4,-6,10),1900,7),((5,-1,7),1000,8),((2,7,8),2200,6)):
        if inside:pos=tuple(v*.18 for v in pos);power*=.04;size*=.2
        bpy.ops.object.light_add(type='AREA',location=pos);l=bpy.context.object;l.data.energy=power;l.data.shape='DISK';l.data.size=size;l.rotation_euler=(target-l.location).to_track_quat('-Z','Y').to_euler();lamps.append(l)
    floor=None
    if not inside:floor=cube('Studio floor',(0,0,-.055),(200,200,.1),None,'studio',0);floor.hide_render=False
    bpy.ops.render.render(write_still=True)
    for o in lamps+[camera]+([floor] if floor else []):bpy.data.objects.remove(o,do_unlink=True)
exterior=aircraft();interior=cab();source_tiles=collect_tiles((exterior,interior))
for root in (exterior,interior):merge_static(root)
tiles=collect_tiles((exterior,interior))
for i,t in enumerate(tiles):t['sourceObjects']=source_tiles[i]['objects']
export(exterior,'aircraft.glb');export(interior,'aircraft-cab.glb')
render(exterior,DOCS/'after.png');render(interior,DOCS/'cab.png',inside=True);shutil.copyfile(DOCS/'after.png',PREVIEW)
render(exterior,DOCS/'cowling-v3.png',detail='cowling');render(exterior,DOCS/'landing-gear-v3.png',detail='gear')
for o in bpy.data.objects:o.hide_render=False
interior.location.x=12
bpy.ops.object.select_all(action='DESELECT');exterior.select_set(True);bpy.context.view_layer.objects.active=exterior
for screen in bpy.data.screens:
    for area in screen.areas:
        for space in area.spaces:
            if space.type=='FILE_BROWSER' and space.params:space.params.directory=b'/'*1023;space.params.directory=b'//'
        if area.type=='FILE_BROWSER':area.type='VIEW_3D'
bpy.context.scene.render.filepath='//../../docs/realism/flight/cab.png'
bpy.context.preferences.filepaths.save_version=0
bpy.ops.wm.save_as_mainfile(filepath=str(BLENDER_DIR/'models.blend'),compress=False,check_existing=False)
bp=BLENDER_DIR/'models.blend';raw=bytearray(bp.read_bytes())
for match in re.finditer(rb'[A-Za-z]:[\\/](?:Users|Documents and Settings)[\\/][^\x00]+',raw):raw[match.start():match.end()]=b'//'+b'\x00'*(match.end()-match.start()-2)
bp.write_bytes(raw)
backup=bp.with_suffix('.blend1')
if backup.exists():backup.unlink()
for png in (DOCS/'after.png',DOCS/'cab.png',DOCS/'cowling-v3.png',DOCS/'landing-gear-v3.png',PREVIEW):
    src=png.read_bytes();dst=bytearray(src[:8]);offset=8
    while offset<len(src):
        length=struct.unpack_from('>I',src,offset)[0];kind=src[offset+4:offset+8]
        if kind not in (b'tEXt',b'zTXt',b'iTXt',b'eXIf'):dst.extend(src[offset:offset+12+length])
        offset+=12+length
    png.write_bytes(dst)
assets=[]
for name in ('aircraft.glb','aircraft-cab.glb'):
    raw=(OUT/name).read_bytes();length,_=struct.unpack_from('<II',raw,12);d=json.loads(raw[20:20+length]);ps=[p for m in d.get('meshes',[]) for p in m['primitives']];tri=sum(d['accessors'][p['indices']]['count']//3 for p in ps)
    assets.append({'file':'models/'+name,'bytes':len(raw),'drawCalls':len(ps),'triangles':tri,'embeddedImages':len(d.get('images',[])),'materials':len(d.get('materials',[])),'texturedMaterials':sum('baseColorTexture'in m.get('pbrMetallicRoughness',{}) for m in d.get('materials',[]))})
    if tri>(60000 if name=='aircraft.glb' else 25000) or len(ps)>(35 if name=='aircraft.glb' else 20):raise ValueError('Mobile geometry budget exceeded')
report={'authoring':'Actual Blender 5.2 CLI geometry and GLB export','texture':'public/textures/flight-detail-atlas.png','source':'built-in image_gen','gutterPercentPerTile':3,'coordinates':{'up':'+Y','forward':'+Z','unit':'metre'},'tiles':tiles,'assets':assets}
(DOCS/'tile-map.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
assert hashlib.sha256(TEXTURE.read_bytes()).hexdigest()==SOURCE_ATLAS_HASH,'Original IMG atlas must remain unchanged'
(DOCS/'geometry-v3.json').write_text(json.dumps({'version':'curved-airframe-v3','atlasSha256':SOURCE_ATLAS_HASH,'atlasPixelsAndBytesUnchanged':True,'assets':assets,'geometryChanges':['Catmull-Rom fuselage stations and consistent outward smooth normals','Rounded tapered wing tips with real flap/aileron hinge cutouts','NACA section vertical fin and tapered rudder','Recessed formed cowling air inlets and 2.5mm door/service gaps','Flat spring main gear, oleo torque links and separate machined hub fasteners','Twisted tapered propeller with formed unstriped spinner','Curved 4mm laminated windshield and rear quarter glazing','Fine-grain interior surface UV cells and flat shoulder webbing'],'preservedRuntimeNodes':['PropellerRoot','AileronLeft','AileronRight','FlapLeft','FlapRight','Elevator','Rudder','YokeLeft','YokeRight'],'glassAlpha':.09,'before':'docs/realism/flight/before-v3.png','after':'docs/realism/flight/after.png'},indent=2),encoding='utf-8')
print('FLIGHT_REALISM_VERIFIED '+json.dumps(assets))
