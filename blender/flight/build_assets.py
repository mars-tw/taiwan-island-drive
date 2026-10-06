"""Realistic original trainer; true 16-tile IMG UVs; Blender Z-up/-Y nose, GLTF Y-up/+Z nose."""
from pathlib import Path
import bpy, math, json, struct, re, shutil
from mathutils import Vector
BLENDER_DIR=Path(__file__).resolve().parent
ROOT=BLENDER_DIR.parents[1]
OUT=ROOT/'public/models';DOCS=ROOT/'docs/realism/flight';PREVIEW=ROOT/'public/previews/flight.png'
TEXTURE=ROOT/'public/textures/flight-detail-atlas.png'
for d in (OUT,DOCS,PREVIEW.parent):d.mkdir(parents=True,exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
atlas=bpy.data.images.load(str(TEXTURE));atlas.name='Flight 16 real IMG tiles';atlas.pack()
atlas.filepath='//../../public/textures/flight-detail-atlas.png';atlas.filepath_raw=atlas.filepath
for packed in atlas.packed_files:packed.filepath=atlas.filepath
LABELS=['Ivory navy orange fuselage left','Ivory navy orange fuselage right','Riveted wing skin','Engine cooling vent','Riveted aluminium','Polished wheel hub','Rubber tyre tread','Rubber tyre sidewall','Blank cockpit powdercoat','Stitched tobacco leather','Woven upholstery','Matte cockpit plastic','Control hinge skin','Mechanical gear steel','Antislip floor','Faint glass smudges']
RECT={}
for tile in range(1,17):
    row,col=divmod(tile-1,4);g=.03/4;RECT[tile]=(col/4+g,(3-row)/4+g,(col+1)/4-g,(4-row)/4-g)
MAT={}
for tile in range(1,17):
    m=bpy.data.materials.new(f'Tile {tile:02d} {LABELS[tile-1]}');m.use_nodes=True;m['tile_id']=tile;m['atlas_file']='textures/flight-detail-atlas.png'
    b=m.node_tree.nodes.get('Principled BSDF');n=m.node_tree.nodes.new('ShaderNodeTexImage');n.image=atlas;n.name=f'Real IMG tile {tile:02d}';n.extension='EXTEND';m.node_tree.links.new(n.outputs['Color'],b.inputs['Base Color'])
    b.inputs['Metallic'].default_value={1:.22,2:.22,3:.18,4:.25,5:.82,6:.94,13:.35,14:.9}.get(tile,0)
    b.inputs['Roughness'].default_value={1:.29,2:.29,3:.36,4:.6,5:.37,6:.17,7:.9,8:.94,9:.65,10:.76,11:.95,12:.7,13:.34,14:.25,15:.9,16:.085}[tile]
    if tile in (1,2,3):b.inputs['Coat Weight'].default_value=.32;b.inputs['Coat Roughness'].default_value=.22
    if tile==16:
        b.inputs['Alpha'].default_value=.075;b.inputs['Transmission Weight'].default_value=.6;b.inputs['IOR'].default_value=1.45
        m.surface_render_method='DITHERED';m.use_transparency_overlap=False;m.diffuse_color=(.8,.9,1,.075)
    MAT[tile]=m
ACCENT={}
for name,col,emit in [('orange',(.9,.26,.06),0),('red',(.75,.03,.02),1.5),('green',(.03,.42,.14),1.5),('studio',(.22,.24,.26),0)]:
    m=bpy.data.materials.new(name);m.use_nodes=True;b=m.node_tree.nodes.get('Principled BSDF');b.inputs['Base Color'].default_value=(*col,1)
    if name=='studio':b.inputs['Roughness'].default_value=.95
    if emit:b.inputs['Emission Color'].default_value=(*col,1);b.inputs['Emission Strength'].default_value=emit
    ACCENT[name]=m
def empty(name,loc=(0,0,0),parent=None):
    o=bpy.data.objects.new(name,None);bpy.context.collection.objects.link(o);o.location=loc;o.parent=parent;return o
def uv_rect(o,tile,per_face=False):
    d=o.data;uv=d.uv_layers.active or d.uv_layers.new(name='Flight16TileUV');uv.name='Flight16TileUV';r=RECT[tile];coords=[v.co for v in d.vertices]
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
    if isinstance(tile,int):uv_rect(o,tile)
    for f in o.data.polygons:f.use_smooth=smooth
    return o
def mesh(name,verts,faces,parent,tile,edge=0,smooth=True):
    d=bpy.data.meshes.new(name);d.from_pydata(verts,[],faces);d.update();o=bpy.data.objects.new(name,d);bpy.context.collection.objects.link(o);return finish(o,parent,tile,edge,smooth)
def cube(name,loc,size,parent,tile=3,edge=.015):
    bpy.ops.mesh.primitive_cube_add(size=1,location=loc);o=bpy.context.object;o.name=name;o.dimensions=size;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);return finish(o,parent,tile,edge,False)
def sphere(name,loc,size,parent,tile=3):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=32,ring_count=16,location=loc);o=bpy.context.object;o.name=name;o.scale=size;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);return finish(o,parent,tile)
def cylinder(name,loc,radius,depth,parent,tile=14,axis='Z',vertices=24):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices,radius=radius,depth=depth,location=loc,rotation={'Z':(0,0,0),'X':(0,math.pi/2,0),'Y':(math.pi/2,0,0)}[axis]);o=bpy.context.object;o.name=name;bpy.ops.object.transform_apply(location=False,rotation=True,scale=True);return finish(o,parent,tile,.003)
def bar(name,a,b,r,parent,tile=14):
    a,b=Vector(a),Vector(b);o=cylinder(name,(a+b)/2,r,(b-a).length,parent,tile,vertices=12);o.rotation_euler=(b-a).to_track_quat('Z','Y').to_euler();return o
def seam(name,points,parent,tile=12,r=.005):
    for i in range(len(points)-1):bar(f'{name} {i+1}',points[i],points[i+1],r,parent,tile)
def aerofoil(name,parent,span,chord,pos,t=.12,tile=3,sections=6,animated=False):
    n=25;profile=[]
    for side in (1,-1):
        for i in (range(n) if side==1 else range(n-2,0,-1)):
            x=(1-math.cos(math.pi*i/(n-1)))/2;yt=5*t*(.2969*math.sqrt(x)-.126*x-.3516*x*x+.2843*x**3-.1036*x**4);profile.append((x,side*yt))
    count=len(profile);verts=[]
    for k in range(sections+1):
        xx=-span/2+span*k/sections;tip=abs(xx)/(span/2);factor=1-.12*tip**3 if not animated else 1
        for a,b in profile:verts.append((xx,(a-.5)*chord*factor+.035*tip,chord*b*factor+(abs(xx)*.018 if span>5 else 0)))
    faces=[tuple(range(count-1,-1,-1)),tuple(range(sections*count,(sections+1)*count))]
    for j in range(sections):
        for k in range(count):faces.append((j*count+k,j*count+(k+1)%count,(j+1)*count+(k+1)%count,(j+1)*count+k))
    o=mesh(name,verts,faces,parent,tile);o.location=pos;return o
def fuselage(parent):
    stations=[(-3.62,.16,.18,1.28),(-3.48,.37,.32,1.28),(-3.1,.48,.4,1.28),(-2.65,.52,.44,1.3),(-2.1,.58,.5,1.33),(-1.52,.64,.55,1.35),(-1.12,.68,.64,1.37),(-.6,.7,.66,1.39),(.05,.69,.66,1.41),(.68,.63,.59,1.43),(1.28,.53,.46,1.47),(1.85,.41,.33,1.52),(2.55,.29,.23,1.6),(3.16,.18,.16,1.66),(3.75,.08,.11,1.7),(3.95,.03,.05,1.72)]
    n=48;verts=[]
    for yy,rx,rz,zz in stations:
        for k in range(n):a=2*math.pi*k/n;verts.append((rx*math.cos(a),yy,zz+rz*math.sin(a)))
    faces=[tuple(range(n-1,-1,-1)),tuple(range((len(stations)-1)*n,len(stations)*n))]
    for j in range(len(stations)-1):
        for k in range(n):
            ids=(j*n+k,j*n+(k+1)%n,(j+1)*n+(k+1)%n,(j+1)*n+k);center=sum((Vector(verts[v]) for v in ids),Vector())/4
            if -1.45<center.y<.7 and center.z>1.48:continue
            faces.append(ids)
    o=mesh('Smooth formed fuselage with open cabin',verts,faces,parent,1);o.data.materials.append(MAT[2]);uv=o.data.uv_layers.active
    for f in o.data.polygons:
        tile=1 if f.center.x<0 else 2;f.material_index=0 if tile==1 else 1;r=RECT[tile]
        for li in f.loop_indices:
            v=o.data.vertices[o.data.loops[li].vertex_index].co;u=(v.y+3.62)/7.57;vv=(v.z-.75)/1.42;uv.data[li].uv=(r[0]+max(0,min(1,u))*(r[2]-r[0]),r[1]+max(0,min(1,vv))*(r[3]-r[1]))
def tyre(name,loc,radius,width,parent):
    bpy.ops.mesh.primitive_torus_add(major_segments=40,minor_segments=14,location=loc,major_radius=radius*.75,minor_radius=radius*.25,rotation=(0,math.pi/2,0));o=bpy.context.object;o.name=name;o.scale.z=width/(radius*.5);bpy.ops.object.transform_apply(location=False,rotation=True,scale=True);finish(o,parent,7);o.data.materials.append(MAT[8]);uv=o.data.uv_layers.active
    lo=[min(v.co[a] for v in o.data.vertices) for a in range(3)];hi=[max(v.co[a] for v in o.data.vertices) for a in range(3)]
    for f in o.data.polygons:
        tile=8 if abs(f.normal.x)>.55 else 7;f.material_index=1 if tile==8 else 0;r=RECT[tile]
        for li in f.loop_indices:
            v=o.data.vertices[o.data.loops[li].vertex_index].co;u=(v.y-lo[1])/max(.0001,hi[1]-lo[1]);vv=(v.z-lo[2])/max(.0001,hi[2]-lo[2]);uv.data[li].uv=(r[0]+u*(r[2]-r[0]),r[1]+vv*(r[3]-r[1]))
def aircraft():
    p=empty('AircraftRoot');fuselage(p);aerofoil('High wing NACA profile',p,10,1.48,(0,-.35,2.16))
    for sign in (-1,1):
        aerofoil('AileronLeft' if sign<0 else 'AileronRight',p,2.1,.29,(sign*3.68,.36,2.17),t=.07,tile=13,sections=3,animated=True)
        aerofoil('FlapLeft' if sign<0 else 'FlapRight',p,1.78,.34,(sign*1.78,.34,2.165),t=.075,tile=13,sections=3,animated=True)
        bar('Streamlined lift strut',(sign*.6,-.29,1.02),(sign*3.02,-.25,2.2),.035,p,5);cylinder('Wing strut joint',(sign*3.02,-.25,2.2),.065,.12,p,14,axis='X')
        sphere('Wingtip lamp',(sign*4.96,-.78,2.23),(.045,.072,.035),p,'red' if sign<0 else 'green')
        bar('Control hinge barrel',(sign*2.6,.28,2.17),(sign*4.67,.28,2.17),.014,p,13)
    aerofoil('Horizontal stabilizer profile',p,3.25,.78,(0,3.16,1.74),t=.105);aerofoil('Elevator',p,3.05,.25,(0,3.59,1.73),t=.075,tile=13,sections=3,animated=True)
    mesh('Swept vertical stabilizer',[(-.07,2.63,1.7),(.07,2.63,1.7),(-.035,3.11,2.83),(.035,3.11,2.83),(-.04,3.86,2.62),(.04,3.86,2.62),(-.06,3.88,1.7),(.06,3.88,1.7)],[(0,2,4,6),(1,7,5,3),(0,1,3,2),(2,3,5,4),(4,5,7,6),(6,7,1,0)],p,3,.025)
    cube('Rudder',(0,3.86,2.2),(.1,.17,.88),p,13,.035)
    mesh('Sloped windshield',[(-.62,-1.43,1.48),(.62,-1.43,1.48),(.5,-.76,2.09),(-.5,-.76,2.09)],[(0,1,2,3)],p,16,smooth=False)
    for sign in (-1,1):
        mesh('Clear side window',[(sign*.66,-1.38,1.49),(sign*.64,.61,1.49),(sign*.51,.56,2.09),(sign*.51,-.77,2.09)],[(0,1,2,3)],p,16,smooth=False)
        seam('Windshield seal',[(sign*.62,-1.43,1.48),(sign*.5,-.76,2.09),(sign*.51,.56,2.09),(sign*.64,.61,1.49)],p,12,.012)
        bar('Front pillar',(sign*.62,-1.43,1.48),(sign*.5,-.76,2.1),.026,p,3);bar('Rear door pillar',(sign*.64,.62,1.47),(sign*.51,.57,2.09),.027,p,3)
        seam('Inset door seam',[(sign*.657,-1.1,1.43),(sign*.693,-1.1,1.08),(sign*.65,.58,1.06),(sign*.653,.6,1.47)],p,12,.004)
        bar('Brushed door pull',(sign*.689,.24,1.48),(sign*.689,.39,1.48),.014,p,6)
        for y in (-.88,.38):cylinder('Flush door hinge',(sign*.674,y,1.22),.02,.015,p,13,axis='X',vertices=12)
    cube('Smooth cabin roof',(0,-.1,2.1),(1.04,1.44,.065),p,3,.04)
    for x in (-.32,.32):
        cube('Interior leather cushion',(x,.18,1.17),(.48,.6,.13),p,10,.065);cube('Interior leather back',(x,.5,1.48),(.48,.13,.64),p,10,.058);cloth('Interior woven insert',(x,.429,1.49),.34,.45,p)
    cube('Cooling intake',(0,-3.46,1.09),(.53,.04,.16),p,4,.055)
    for yy in (-2.78,-2.47):seam('Cowling service seam',[(-.44,yy,1.35),(0,yy,1.71),(.44,yy,1.35)],p,5,.003)
    for sign in (-1,1):
        x=sign*1.05;bar('Spring steel gear',(sign*.39,.42,1.09),(x,.42,.29),.036,p,14);cylinder('Main gear bearing',(x,.42,.29),.087,.23,p,14,axis='X');tyre('Rounded main tyre',(x,.42,.28),.28,.18,p);cylinder('Polished main hub',(x+sign*.096,.42,.28),.14,.026,p,6,axis='X',vertices=40);cylinder('Axle nut',(x+sign*.114,.42,.28),.026,.02,p,14,axis='X',vertices=6)
    bar('Nose oleo strut',(0,-2.42,1.0),(0,-2.42,.27),.033,p,14);cylinder('Shock collar',(0,-2.42,.74),.056,.16,p,5)
    for sign in (-1,1):bar('Nose wheel fork',(sign*.092,-2.42,.5),(sign*.092,-2.42,.26),.018,p,14)
    tyre('Rounded nose tyre',(0,-2.42,.25),.25,.15,p);cylinder('Polished nose hub',(.081,-2.42,.25),.123,.021,p,6,axis='X',vertices=40)
    prop=empty('PropellerRoot',(0,-3.86,1.34),p);sphere('Elliptical spinner',(0,-.035,0),(.19,.24,.19),prop,1)
    for sign in (-1,1):
        polygon=[(-.035,sign*.18),(.08,sign*.21),(.11,sign*.6),(.035,sign*1.13),(-.075,sign*1.11),(-.07,sign*.58)]
        verts=[(x,y,z) for y in (-.012,.012) for x,z in polygon];faces=[tuple(range(5,-1,-1)),tuple(range(6,12))]+[(i,(i+1)%6,(i+1)%6+6,i+6) for i in range(6)]
        mesh('Swept propeller blade',verts,faces,prop,5,.006);cube('Safety propeller tip',(-.016,0,sign*1.08),(.09,.035,.11),prop,'orange',.016)
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
def cab():
    p=empty('AircraftCabRoot');w=1.5;py=-.7;pz=.9;gy=-1.4;verts=[];faces=[]
    for yy in range(8):
        for xx in range(5):verts.append((-w/2+xx*w/4,-1.4+yy*.4,.025))
    for yy in range(7):
        for xx in range(4):a=yy*5+xx;faces.append((a,a+1,a+6,a+5))
    floor=mesh('Actual anti-slip floor cells',verts,faces,p,15,smooth=False);uv_rect(floor,15,per_face=True)
    cube('Blank instrument panel',(0,py,pz),(1.28,.24,.3),p,9,.06);cube('Blank lower console',(0,py+.035,pz-.255),(.93,.32,.22),p,9,.045);cube('Matte glare shield',(0,py-.05,pz+.18),(1.39,.48,.075),p,12,.04)
    for x in (-.57,-.31,0,.31,.57):cylinder('Flush panel screw',(x,py+.125,pz+.11),.009,.007,p,14,axis='Y',vertices=8)
    for sign in (-1,1):
        x=sign*w/2;cube('Moulded cabin wall',(x,.02,.44),(.07,2.45,.84),p,12,.03);bar('Swept front pillar',(x,gy,.87),(sign*.69,gy+.22,2.07),.031,p,3);bar('Rear window pillar',(x,.87,.86),(x,.85,2.04),.03,p,3)
        cube('Transparent side glazing',(x,-.17,1.47),(.008,1.96,1.08),p,16,0);cube('Leather armrest',(sign*.6,.29,.6),(.18,.65,.15),p,10,.055);seam('Armrest stitch',[(sign*.55,.03,.674),(sign*.55,.56,.674)],p,10,.0011);seam('Interior door trim',[(sign*.715,-1.18,.82),(sign*.715,.79,.82)],p,12,.009)
    cube('Clear front windshield',(0,gy,1.5),(1.4,.008,1.14),p,16,0);bar('Upper windshield frame',(-.73,gy,2.075),(.73,gy,2.075),.033,p,3);cube('Roof lining',(0,.0,2.13),(1.5,2.83,.043),p,12,.015)
    for x in (-.32,.32):
        cube('Padded leather cushion',(x,.64,.44),(.51,.6,.155),p,10,.068);cube('Padded leather back',(x,.93,.81),(.51,.15,.74),p,10,.065);cloth('Cushion woven insert',(x,.61,.522),.345,.415,p,'XY');cloth('Back woven insert',(x,.848,.8),.345,.5,p);cube('Steel seat pedestal',(x,.64,.22),(.23,.26,.3),p,14,.025)
        for dx in (-.205,.205):
            seam('Cushion sewn piping',[(x+dx,.39,.511),(x+dx,.86,.511)],p,10,.0011);seam('Back double stitch',[(x+dx,.848,.54),(x+dx,.848,1.08)],p,10,.0011)
        bar('Shoulder harness',(x-.15,.836,.55),(x+.15,.836,1.08),.016,p,12);cube('Harness buckle',(x,.83,.72),(.065,.025,.052),p,6,.01)
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
        bpy.context.view_layer.objects.active=objects[0];bpy.ops.object.join();o=bpy.context.object;o.name=f'{parent} '+mats[0];o['source_parts']=json.dumps(source)
def export(root,name):
    bpy.ops.object.select_all(action='DESELECT')
    for o in descendants(root):o.select_set(True)
    bpy.context.view_layer.objects.active=root
    bpy.ops.export_scene.gltf(filepath=str(OUT/name),export_format='GLB',use_selection=True,export_yup=True,export_texcoords=True,export_normals=True,export_materials='EXPORT',export_cameras=False,export_lights=False,export_extras=True)
def render(root,path,inside=False):
    s=bpy.context.scene;visible=set(descendants(root))
    for o in bpy.data.objects:
        if o.type=='MESH':o.hide_render=o not in visible
    if inside:
        for o in descendants(root):
            if o.type=='MESH' and (o.name=='Roof lining' or any(m.get('tile_id')==16 for m in o.data.materials)):o.hide_render=True
    s.render.engine='BLENDER_EEVEE';s.render.resolution_x=1400;s.render.resolution_y=1050;s.render.resolution_percentage=100;s.render.image_settings.file_format='PNG';s.render.use_stamp=False;s.render.filepath=str(path)
    s.world=bpy.data.worlds.new('Soft photographic studio') if not s.world else s.world;s.world.use_nodes=True;s.world.node_tree.nodes['Background'].inputs[0].default_value=(.2,.24,.29,1);s.world.node_tree.nodes['Background'].inputs[1].default_value=.65
    target=Vector((0,0,1.35));loc=(10,-13,6.8)
    if inside:loc=(2.7,.25,2.45);target=Vector((0,-.12,.87))
    bpy.ops.object.camera_add(location=loc);camera=bpy.context.object;camera.rotation_euler=(target-camera.location).to_track_quat('-Z','Y').to_euler();camera.data.lens=52 if not inside else 35;s.camera=camera;lamps=[]
    for pos,power,size in (((-4,-6,10),2500,7),((5,-1,7),2100,8),((2,7,8),1900,6)):
        if inside:pos=tuple(v*.18 for v in pos);power*=.04;size*=.2
        bpy.ops.object.light_add(type='AREA',location=pos);l=bpy.context.object;l.data.energy=power;l.data.shape='DISK';l.data.size=size;l.rotation_euler=(target-l.location).to_track_quat('-Z','Y').to_euler();lamps.append(l)
    floor=None
    if not inside:floor=cube('Studio floor',(0,0,-.08),(100,100,.08),None,'studio',0);floor.hide_render=False
    bpy.ops.render.render(write_still=True)
    for o in lamps+[camera]+([floor] if floor else []):bpy.data.objects.remove(o,do_unlink=True)
exterior=aircraft();interior=cab();source_tiles=collect_tiles((exterior,interior))
for root in (exterior,interior):merge_static(root)
tiles=collect_tiles((exterior,interior))
for i,t in enumerate(tiles):t['sourceObjects']=source_tiles[i]['objects']
export(exterior,'aircraft.glb');export(interior,'aircraft-cab.glb')
render(exterior,DOCS/'after.png');render(interior,DOCS/'cab.png',inside=True);shutil.copyfile(DOCS/'after.png',PREVIEW)
for o in bpy.data.objects:o.hide_render=False
interior.location.x=12
bpy.ops.object.select_all(action='DESELECT');exterior.select_set(True);bpy.context.view_layer.objects.active=exterior
for screen in bpy.data.screens:
    for area in screen.areas:
        if area.type=='FILE_BROWSER':area.type='VIEW_3D'
bpy.context.scene.render.filepath='//../../docs/realism/flight/cab.png'
bpy.ops.wm.save_as_mainfile(filepath=str(BLENDER_DIR/'models.blend'),compress=False,check_existing=False)
bp=BLENDER_DIR/'models.blend';raw=bytearray(bp.read_bytes())
for match in re.finditer(rb'[A-Za-z]:[\\/](?:Users|Documents and Settings)[\\/][^\x00]+',raw):raw[match.start():match.end()]=b'//'+b'\x00'*(match.end()-match.start()-2)
bp.write_bytes(raw)
backup=bp.with_suffix('.blend1')
if backup.exists():backup.unlink()
for png in (TEXTURE,DOCS/'after.png',DOCS/'cab.png',PREVIEW):
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
    if tri>(60000 if name=='aircraft.glb' else 30000) or len(ps)>50:raise ValueError('Mobile geometry budget exceeded')
report={'authoring':'Actual Blender 5.2 CLI geometry and GLB export','texture':'public/textures/flight-detail-atlas.png','source':'built-in image_gen','gutterPercentPerTile':3,'coordinates':{'up':'+Y','forward':'+Z','unit':'metre'},'tiles':tiles,'assets':assets}
(DOCS/'tile-map.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print('FLIGHT_REALISM_VERIFIED '+json.dumps(assets))
