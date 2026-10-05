"""Original Island Drive models, created procedurally in Blender.

Run: blender --background --python blender/build_assets.py
All distances are metres. Blender is Z-up, vehicle nose faces -Y.
The glTF export converts this to Y-up with the nose facing +Z.
Assets and this script are released under the repository MIT license.
"""
from pathlib import Path
import bpy
import math
import json
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "models"
DOCS = ROOT / "docs"
OUT.mkdir(parents=True, exist_ok=True)
DOCS.mkdir(parents=True, exist_ok=True)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
for block in list(bpy.data.materials):
    bpy.data.materials.remove(block)


def material(name, color, metallic=0, roughness=.45, emission=0):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = (*color, 1)
    mat.use_nodes = True
    bsdf = next(node for node in mat.node_tree.nodes if node.type == 'BSDF_PRINCIPLED')
    bsdf.inputs['Base Color'].default_value = (*color, 1)
    bsdf.inputs['Metallic'].default_value = metallic
    bsdf.inputs['Roughness'].default_value = roughness
    if emission:
        bsdf.inputs['Emission Color'].default_value = (*color, 1)
        bsdf.inputs['Emission Strength'].default_value = emission
    return mat


MAT = {
    'rubber': material('TireRubber', (.018, .023, .031), 0, .92),
    'trim': material('GraphiteTrim', (.032, .043, .056), .25, .37),
    'glass': material('SmokedGlass', (.042, .105, .145), .4, .16),
    'alloy': material('BrushedAlloy', (.61, .7, .76), .85, .23),
    'rim': material('ForgedGraphite', (.10, .13, .16), .85, .26),
    'white': material('WarmIvory', (.91, .89, .79), .12, .3),
    'lamp': material('LEDHeadlight', (.78, .94, 1), .1, .15, 2.5),
    'tail': material('TailLight', (.95, .035, .035), .1, .18, 2.0),
    'amber': material('AmberIndicator', (1, .47, .055), .1, .2, 1.5),
    'red': material('BrakeCaliper', (.68, .06, .025), .35, .32),
    'bark': material('PalmBark', (.37, .25, .14), 0, .9),
    'leaf': material('PalmLeaf', (.10, .39, .20), 0, .82),
    'pine': material('PineNeedles', (.08, .25, .19), 0, .85),
    'pine_light': material('PineTips', (.15, .36, .24), 0, .85),
    'sign': material('TaiwanRoadGreen', (.025, .30, .21), .15, .45),
    'tower': material('TowerFacade', (.11, .30, .34), .65, .26),
    'towertrim': material('TowerSilver', (.30, .50, .53), .78, .28),
    'window': material('TowerWindow', (.25, .61, .66), .45, .23, .18),
}


def attach(obj, parent, mat=None):
    obj.parent = parent
    if mat:
        obj.data.materials.append(mat)
    return obj


def empty(name):
    obj = bpy.data.objects.new(name, None)
    bpy.context.collection.objects.link(obj)
    return obj


def mesh(name, vertices, faces, parent, mat):
    data = bpy.data.meshes.new(name)
    data.from_pydata(vertices, [], faces)
    data.update()
    obj = bpy.data.objects.new(name, data)
    bpy.context.collection.objects.link(obj)
    return attach(obj, parent, mat)


def bevel(obj, amount=.03, segments=2):
    mod = obj.modifiers.new('CraftedEdges', 'BEVEL')
    mod.width = amount
    mod.segments = segments
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.modifier_apply(modifier=mod.name)
    mod = obj.modifiers.new('WeightedSurfaceNormals', 'WEIGHTED_NORMAL')
    mod.keep_sharp = True
    bpy.ops.object.modifier_apply(modifier=mod.name)
    return obj


def cube(name, loc, size, parent, mat, edge=.02):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    attach(obj, parent, mat)
    if edge:
        bevel(obj, edge)
    return obj


def cylinder(name, loc, radius, depth, parent, mat, axis='Z', sides=24, edge=0):
    bpy.ops.mesh.primitive_cylinder_add(vertices=sides, radius=radius, depth=depth, location=loc)
    obj = bpy.context.object
    obj.name = name
    if axis == 'X':
        obj.rotation_euler[1] = math.pi / 2
    elif axis == 'Y':
        obj.rotation_euler[0] = math.pi / 2
    attach(obj, parent, mat)
    if edge:
        bevel(obj, edge, 2)
    for face in obj.data.polygons:
        face.use_smooth = True
    return obj


def line(name, points, radius, parent, mat):
    curve = bpy.data.curves.new(name, 'CURVE')
    curve.dimensions = '3D'
    curve.resolution_u = 1
    curve.bevel_depth = radius
    curve.bevel_resolution = 1
    spline = curve.splines.new('POLY')
    spline.points.add(len(points) - 1)
    for v, point in zip(spline.points, points):
        v.co = (*point, 1)
    obj = bpy.data.objects.new(name, curve)
    bpy.context.collection.objects.link(obj)
    attach(obj, parent, mat)
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.convert(target='MESH')
    obj.select_set(False)
    return obj


def text(name, value, loc, size, parent, mat, rotation=(math.pi / 2, 0, 0)):
    curve = bpy.data.curves.new(name, 'FONT')
    curve.body = value
    curve.align_x = 'CENTER'
    curve.align_y = 'CENTER'
    curve.size = size
    curve.extrude = .001
    obj = bpy.data.objects.new(name, curve)
    bpy.context.collection.objects.link(obj)
    obj.location = loc
    obj.rotation_euler = rotation
    attach(obj, parent, mat)
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.convert(target='MESH')
    obj.select_set(False)
    return obj


def ringbody(name, rings, parent, mat):
    # Eight chamfered cross-section points per longitudinal station.
    verts = []
    for y, w, bottom, top in rings:
        verts.extend([
            (-w + .10, y, bottom), (w - .10, y, bottom),
            (w, y, bottom + .09), (w, y, top - .08),
            (w - .09, y, top), (-w + .09, y, top),
            (-w, y, top - .08), (-w, y, bottom + .09),
        ])
    faces = [tuple(range(7, -1, -1))]
    for row in range(len(rings) - 1):
        for i in range(8):
            faces.append((row*8+i, row*8+(i+1)%8, (row+1)*8+(i+1)%8, (row+1)*8+i))
    faces.append(tuple((len(rings)-1)*8+i for i in range(8)))
    return mesh(name, verts, faces, parent, mat)


def cabin(parent, paint, settings):
    front, rf, rr, rear, roof, lower, width, roofwidth = settings
    verts = [
        (-width, front, lower), (width, front, lower),
        (-roofwidth, rf, roof), (roofwidth, rf, roof),
        (-roofwidth, rr, roof), (roofwidth, rr, roof),
        (-width, rear, lower), (width, rear, lower),
    ]
    mesh('CabinFrame', verts, [(0,1,3,2),(2,3,5,4),(4,5,7,6),(0,2,4,6),(1,7,5,3),(0,6,7,1)], parent, paint)
    # Slightly inset panoramic windshield and rear glass.
    f0 = Vector((0, front, lower)); f1 = Vector((0, rf, roof))
    a = f0.lerp(f1, .12); b = f0.lerp(f1, .90)
    mesh('Windshield', [(-width*.88,a.y-.013,a.z),(width*.88,a.y-.013,a.z),(roofwidth*.91,b.y-.013,b.z),(-roofwidth*.91,b.y-.013,b.z)], [(0,1,2,3)], parent, MAT['glass'])
    r0 = Vector((0, rear, lower)); r1 = Vector((0, rr, roof))
    a = r0.lerp(r1, .12); b = r0.lerp(r1, .89)
    mesh('RearGlass', [(-width*.88,a.y+.013,a.z),(-roofwidth*.91,b.y+.013,b.z),(roofwidth*.91,b.y+.013,b.z),(width*.88,a.y+.013,a.z)], [(0,1,2,3)], parent, MAT['glass'])
    middle = rf*.25 + rr*.75
    for side in [-1, 1]:
        # A narrow B pillar separates the two real side window polygons.
        wl = width - .005
        wu = roofwidth + .030
        mesh('SideGlassFront', [(side*(wl+.014),front+.14,lower+.07),(side*(wu+.014),rf+.10,roof-.065),(side*(wu+.014),middle-.045,roof-.065),(side*(wl+.014),middle-.045,lower+.07)], [(0,1,2,3)], parent, MAT['glass'])
        mesh('SideGlassRear', [(side*(wl+.014),middle+.045,lower+.07),(side*(wu+.014),middle+.045,roof-.065),(side*(wu+.014),rr-.09,roof-.065),(side*(wl+.014),rear-.13,lower+.07)], [(0,1,2,3)], parent, MAT['glass'])
        # Subtle lower window seal and door shutline.
        line('WindowRubberSeal', [(side*(width+.01),front+.12,lower+.045),(side*(width+.01),rear-.10,lower+.045)], .011, parent, MAT['trim'])
        line('DoorShutline', [(side*(width+.023),front+.12,lower-.02),(side*(width+.065),front+.15,.57),(side*(width+.065),middle,.53),(side*(width+.065),middle,lower-.04)], .007, parent, MAT['trim'])
        cube('FlushDoorHandle', (side*(width+.070),middle-.15,lower-.16), (.025,.20,.042), parent, MAT['alloy'], .011)
        cube('MirrorStem', (side*(width+.12),front+.15,lower+.035), (.19,.05,.055), parent, MAT['trim'], .01)
        cube('MirrorHousing', (side*(width+.23),front+.11,lower+.075), (.18,.24,.12), parent, paint, .04)
        cube('MirrorGlass', (side*(width+.23),front+.24,lower+.075), (.135,.018,.075), parent, MAT['glass'], .018)
    # Two windshield wipers lie against the base of the screen.
    for x in [-.34, .34]:
        line('Wiper', [(x-.18,front+.075,lower+.075),(x+.15,front+.17,lower+.17)], .010, parent, MAT['trim'])


def wheel(parent, x, y, radius, name, rally=False):
    root = empty(name)
    root.location = (x,y,radius+.005)
    root.parent = parent
    # Model in local wheel coordinates so Wheel nodes can animate about local X.
    tire = cylinder('Tire', (0,0,0), radius, .29, root, MAT['rubber'], 'X', 32, .055)
    outer = (1 if x > 0 else -1)*.159
    cylinder('BrakeDisc', (outer*.75,0,0), radius*.65, .025, root, MAT['alloy'], 'X', 24)
    cylinder('RimInner', (outer,0,0), radius*.72, .035, root, MAT['rim'], 'X', 24, .012)
    bpy.ops.mesh.primitive_torus_add(major_segments=24, minor_segments=6, major_radius=radius*.66, minor_radius=.025, location=(outer*1.12,0,0), rotation=(0,math.pi/2,0))
    attach(bpy.context.object, root, MAT['alloy']).name = 'RimLip'
    for i in range(6 if rally else 5):
        angle = math.tau*i/(6 if rally else 5)
        obj = cube('WheelSpoke', (outer*1.15,math.sin(angle)*radius*.32,math.cos(angle)*radius*.32), (.028,.040,radius*.58), root, MAT['alloy'], .008)
        obj.rotation_euler[0] = -angle
    cylinder('Hub', (outer*1.24,0,0), .075, .033, root, MAT['rim'], 'X', 16, .008)
    for i in range(5):
        a=math.tau*i/5
        cylinder('LugNut', (outer*1.37, math.sin(a)*.05, math.cos(a)*.05), .010, .010, root, MAT['alloy'], 'X', 6)
    # Tread marks are physical geometry; restrained enough for mobile use.
    for i in range(16 if rally else 12):
        a=math.tau*i/(16 if rally else 12)
        o=cube('TireTread', (0,math.sin(a)*(radius-.005),math.cos(a)*(radius-.005)), (.19,.032,.020), root, MAT['trim'], .004)
        o.rotation_euler[0] = -a


def arch(parent, x, y, radius):
    verts=[]
    for i in range(17):
        a=math.pi*i/16
        for r in [radius, radius+.055]:
            verts.append((x,y+math.cos(a)*r,.42+math.sin(a)*r))
    mesh('WheelArchTrim',verts,[(i*2,i*2+1,i*2+3,i*2+2) for i in range(16)],parent,MAT['trim'])


def vehicle(kind, color):
    root=empty(kind)
    paint=material('BodyPaint' if kind == 'coupe' else 'BodyPaint_'+kind,color,.58,.25)
    # Each exported material has the exact BodyPaint name, regardless of source suffix.
    length=4.6 if kind=='van' else (4.25 if kind=='suv' else 4.05)
    half=length/2
    wide=.96 if kind=='van' else (.99 if kind=='suv' else .94)
    top=1.03 if kind=='van' else (1.13 if kind=='suv' else .97)
    lower=.37 if kind in ['coupe','rally'] else .43
    body=ringbody('SculptedBody', [(-half,.78 if kind=='coupe' else wide-.09,lower+.06,top-.12),(-half+.18,wide,lower,top),(-.7,wide,lower,top+.05),(.8,wide,lower,top),(half-.16,wide,lower,top-.02),(half,wide-.09,lower+.04,top-.09)],root,paint)
    radius=.41 if kind in ['coupe','rally'] else .45
    axle=1.3 if kind!='van' else 1.47
    for y in [-axle,axle]:
        bpy.ops.mesh.primitive_cylinder_add(vertices=32, radius=radius+.055, depth=3, location=(0,y,radius), rotation=(0,math.pi/2,0))
        cutter=bpy.context.object
        mod=body.modifiers.new('WheelWellCut', 'BOOLEAN'); mod.operation='DIFFERENCE'; mod.object=cutter
        bpy.context.view_layer.objects.active=body
        bpy.ops.object.modifier_apply(modifier=mod.name)
        bpy.data.objects.remove(cutter,do_unlink=True)
    bevel(body,.025,2)
    cube('Underbody',(0,0,.40),(1.60,length-.3,.16),root,MAT['trim'],.035)
    if kind=='coupe':
        config=(-.78,-.20,.53,1.07,1.53,1.00,.84,.69)
    elif kind=='rally':
        config=(-.83,-.36,.52,.96,1.63,1.03,.84,.73)
    elif kind=='suv':
        config=(-.94,-.53,.96,1.48,1.91,1.14,.88,.80)
    else:
        config=(-1.57,-1.17,1.39,1.76,2.06,1.10,.88,.82)
    cabin(root,paint,config)
    for side in [-1,1]:
        for y,label in [(-axle,'F'),(axle,'R')]:
            wheel(root, side*(wide-.012),y,radius,'Wheel'+label+('L' if side<0 else 'R'), kind=='rally')
            arch(root, side*(wide+.026),y,radius+.055)
        cube('SideSkirt',(side*(wide+.023),0,.43),(.07,1.45,.12),root,MAT['trim'],.025)
    # Head and tail assemblies are separate geometry with metallic bezels.
    front=-half-.01; rear=half+.01
    cube('FrontBumper',(0,front,.57),(wide*1.90,.13,.22),root,MAT['trim'],.045)
    cube('RearBumper',(0,rear,.56),(wide*1.92,.14,.21),root,MAT['trim'],.045)
    cube('FrontGrille',(0,front-.025,.77),(1.02,.043,.26),root,MAT['trim'],.02)
    for z in [.70,.77,.84]:
        cube('GrilleSlat',(0,front-.05,z),(.90,.014,.015),root,MAT['alloy'],.005)
    for side in [-1,1]:
        cube('HeadlightBezel',(side*.65,front-.018,.89),(.41,.052,.16),root,MAT['trim'],.025)
        cube('HeadlightLED',(side*.65,front-.048,.90),(.34,.020,.065),root,MAT['lamp'],.019)
        cube('FrontIndicator',(side*.83,front-.045,.84),(.045,.024,.06),root,MAT['amber'],.01)
        cube('TaillightBezel',(side*.66,rear+.035,.89),(.38,.04,.13),root,MAT['trim'],.02)
        cube('TailLightBar',(side*.66,rear+.061,.90),(.32,.017,.044),root,MAT['tail'],.011)
        cylinder('ExhaustTip',(side*.65,half+.11,.39),.06,.16,root,MAT['alloy'],'Y',16)
    for y in [front-.065,rear+.087]:
        cube('LicensePlate',(0,y,.59),(.39,.018,.13),root,MAT['white'],.009)
    text('FrontPlate','TW 86',(0,front-.080,.59),.064,root,MAT['trim'])
    text('RearPlate','ISLAND',(0,rear+.103,.59),.047,root,MAT['trim'],(math.pi/2,0,math.pi))
    cube('NoseBadge',(0,front-.051,.93),(.05,.012,.05),root,MAT['alloy'],.014)
    if kind=='coupe':
        # Restrained ducktail spoiler and twin bonnet creases.
        cube('DucktailSpoiler',(0,half-.23,1.04),(1.68,.22,.095),root,paint,.025)
        for x in [-.40,.40]:
            line('HoodCrease',[(x,-half+.26,top+.005),(x*.78,-.82,top+.053)],.010,root,MAT['alloy'])
        cube('RoofPanel',(0,.16,1.54),(1.13,.57,.025),root,MAT['glass'],.04)
    elif kind=='rally':
        cube('HoodRaceStripe',(0,-1.32,1.008),(.40,1.02,.012),root,MAT['white'],.006)
        cube('RoofRaceStripe',(0,.05,1.645),(.40,.70,.014),root,MAT['white'],.006)
        cube('RoofScoop',(0,-.13,1.70),(.48,.38,.12),root,paint,.028)
        cube('ScoopIntake',(0,-.328,1.71),(.34,.021,.055),root,MAT['trim'],.012)
        for side in [-1,1]:
            cube('SpoilerPylon',(side*.55,1.62,1.15),(.10,.10,.28),root,MAT['trim'],.013)
            cube('NumberPlaque',(side*(wide+.027),.20,.81),(.013,.57,.26),root,MAT['white'],.013)
        cube('RallySpoiler',(0,1.62,1.33),(1.84,.29,.10),root,paint,.02)
        for x in [-.48,-.16,.16,.48]:
            cylinder('RallyLampCase',(x,front-.15,.65),.113,.13,root,MAT['trim'],'Y',20,.01)
            cylinder('RallyLamp',(x,front-.223,.65),.085,.018,root,MAT['lamp'],'Y',20)
    elif kind=='suv':
        for side in [-1,1]:
            cube('RoofRail',(side*.61,.24,1.99),(.06,1.68,.10),root,MAT['trim'],.023)
            cube('TrailStep',(side*(wide+.1),0,.37),(.23,1.35,.08),root,MAT['alloy'],.02)
        for y in [-.36,.72]:
            cube('RoofCrossbar',(0,y,2.045),(1.39,.08,.045),root,MAT['alloy'],.01)
        for x in [-.36,-.12,.12,.36]:
            cube('GrilleUpright',(x,front-.065,.78),(.045,.025,.23),root,MAT['alloy'],.006)
        cube('SkidPlate',(0,front-.074,.44),(.98,.055,.15),root,MAT['alloy'],.02)
    else:
        # Ivory pop-top and a spare tyre give the camper a distinct silhouette.
        cube('CamperRoof',(0,.15,2.13),(1.71,2.83,.19),root,MAT['white'],.11)
        for side in [-1,1]:
            cube('CamperStripe',(side*(wide+.028),.10,.91),(.016,3.36,.074),root,MAT['white'],.01)
            cube('CamperLowerStripe',(side*(wide+.030),.35,.73),(.017,2.85,.04),root,MAT['white'],.01)
        cube('RoofVent',(0,.23,2.25),(.43,.57,.07),root,MAT['trim'],.04)
        cube('SideSlidingDoor',(wide+.035,.51,1.03),(.014,1.21,.48),root,paint,.012)
        line('SlidingDoorTrack',[(wide+.057,-.1,.95),(wide+.057,1.16,.95)],.014,root,MAT['alloy'])
        cylinder('RearSpareTyre',(0,half+.13,1.09),.36,.18,root,MAT['rubber'],'Y',24,.045)
        cylinder('RearSpareCover',(0,half+.232,1.09),.285,.03,root,MAT['white'],'Y',24,.025)
    root['asset_author']='Island Drive contributors'
    root['license']='MIT'
    root['forward']='glTF +Z'
    return root,paint


def palm():
    root=empty('palm')
    verts=[]
    for j in range(7):
        z=j*.56; cx=.06*j*j/6; r=.19-j*.013
        for i in range(8):
            a=math.tau*i/8
            verts.append((cx+math.cos(a)*r,math.sin(a)*r,z))
    mesh('PalmTrunk',verts,[(j*8+i,j*8+(i+1)%8,(j+1)*8+(i+1)%8,(j+1)*8+i) for j in range(6) for i in range(8)],root,MAT['bark'])
    for i in range(9):
        a=math.tau*i/9
        pts=[]
        for j in range(5):
            d=j*.47; spread=.29*math.sin(math.pi*j/4)
            z=3.39+.40*math.sin(math.pi*j/4)-.30*(j/4)**2
            for side in [-1,1]:
                pts.append((.36+math.cos(a)*d-math.sin(a)*spread*side,math.sin(a)*d+math.cos(a)*spread*side,z))
        mesh('PalmFrond',pts,[(j*2,j*2+1,j*2+3,j*2+2) for j in range(4)],root,MAT['leaf'])
    for a in [0,2,4]:
        bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1,radius=.14,location=(.36+math.cos(a)*.13,math.sin(a)*.13,3.23))
        attach(bpy.context.object,root,MAT['bark']).name='Coconut'
    return root


def pine():
    root=empty('pine')
    cylinder('PineTrunk',(0,0,1.4),.14,2.8,root,MAT['bark'],'Z',8)
    for j in range(4):
        bpy.ops.mesh.primitive_cone_add(vertices=9,radius1=1.07-j*.19,radius2=0,depth=1.5-j*.1,location=(0,0,1.32+j*.6))
        attach(bpy.context.object,root,MAT['pine_light' if j%2 else 'pine']).name='PineBranchTier'
    return root


def tower():
    root=empty('city_tower')
    cube('TowerPodium',(0,0,2.4),(13,13,4.8),root,MAT['towertrim'],.5)
    for j in range(8):
        z=6+j*6.4; w=8.6-j*.23
        cube('TowerGlassTier',(0,0,z+2.3),(w,w,5.1),root,MAT['tower'],.25)
        cube('TowerEave',(0,0,z-.18),(w+1.0,w+1.0,.44),root,MAT['towertrim'],.20)
        for side in [-1,1]:
            for row in [0,1,2]:
                zz=z+.7+row*1.45
                cube('TowerWindowBand',(side*(w/2+.01),0,zz),(.018,w-.55,.56),root,MAT['window'],0)
                cube('TowerWindowBand',(0,side*(w/2+.01),zz),(w-.55,.018,.56),root,MAT['window'],0)
    cube('TowerCrown',(0,0,59),(4.5,4.5,5.2),root,MAT['towertrim'],.2)
    cylinder('TowerSpire',(0,0,65.7),.23,8.5,root,MAT['alloy'],'Z',8)
    return root


def roadsign():
    root=empty('road_sign')
    cylinder('SignPole',(0,0,1.43),.055,2.86,root,MAT['alloy'],'Z',8)
    cube('RoadSignFrame',(0,0,2.66),(1.78,.12,.81),root,MAT['white'],.06)
    cube('RoadSignFace',(0,-.069,2.66),(1.69,.018,.72),root,MAT['sign'],.05)
    text('RoadSignLabel','ISLAND',(0,-.084,2.77),.24,root,MAT['white'])
    text('RoadSignRoute','01  /  COAST',(0,-.086,2.52),.13,root,MAT['white'])
    return root


def descendants(root):
    return [root]+list(root.children_recursive)


def mobile_merge(root):
    """Batch meshes by material while retaining four animated wheel pivots."""
    parents=[root]+[o for o in root.children if o.type=='EMPTY']
    for parent in parents:
        groups={}
        for obj in list(parent.children):
            if obj.type=='MESH' and len(obj.data.materials)==1:
                groups.setdefault(obj.data.materials[0].name,[]).append(obj)
        for matname,objects in groups.items():
            bpy.ops.object.select_all(action='DESELECT')
            for obj in objects:
                obj.select_set(True)
            bpy.context.view_layer.objects.active=objects[0]
            if len(objects)>1:
                bpy.ops.object.join()
            obj=bpy.context.object
            prefix={'LEDHeadlight':'HeadlightLED','TailLight':'TailLightBar','SmokedGlass':'Glass','TireRubber':'Tire','BrushedAlloy':'Alloy','GraphiteTrim':'Trim'}.get(matname,matname)
            obj.name=prefix+'Parts'
            obj.data.name=obj.name+'Mesh'


def export(root, name, paint=None):
    bpy.ops.object.select_all(action='DESELECT')
    objs=descendants(root)
    for obj in objs:
        obj.select_set(True)
    bpy.context.view_layer.objects.active=root
    # glTF preserves material names; use one exact recolour contract per exported file.
    old_name=paint.name if paint else None
    displaced=bpy.data.materials.get('BodyPaint') if paint else None
    if paint and displaced and displaced != paint:
        displaced.name='BodyPaint_source'
    if paint:
        paint.name='BodyPaint'
    path=OUT/(name+'.glb')
    bpy.ops.export_scene.gltf(filepath=str(path), export_format='GLB', use_selection=True, export_yup=True, export_apply=True, export_materials='EXPORT', export_extras=True, export_cameras=False, export_lights=False)
    if paint:
        paint.name=old_name
        if displaced and displaced != paint:
            displaced.name='BodyPaint'
    # Statistics reflect the evaluated mesh, including applied bevels and wheel detail.
    triangles=0; vertices=0
    mins=Vector((1e9,1e9,1e9)); maxs=Vector((-1e9,-1e9,-1e9))
    for obj in objs:
        if obj.type!='MESH':
            continue
        obj.data.calc_loop_triangles()
        triangles+=len(obj.data.loop_triangles); vertices+=len(obj.data.vertices)
        for corner in obj.bound_box:
            p=obj.matrix_world@Vector(corner)
            for axis in range(3):
                mins[axis]=min(mins[axis],p[axis]); maxs[axis]=max(maxs[axis],p[axis])
    return {'id':name,'file':name+'.glb','bytes':path.stat().st_size,'triangles':triangles,'vertices':vertices,'bounds_gltf':{'min':[round(mins.x,3),round(mins.z,3),round(-maxs.y,3)],'max':[round(maxs.x,3),round(maxs.z,3),round(-mins.y,3)]}}


cars=[]; manifest=[]
for kind,color in [('coupe',(.065,.48,.62)),('rally',(.86,.25,.055)),('suv',(.17,.37,.29)),('van',(.89,.64,.22))]:
    root,paint=vehicle(kind,color)
    bpy.context.view_layer.update()
    mobile_merge(root)
    manifest.append(export(root,kind,paint))
    cars.append(root)
props=[palm(),pine(),tower(),roadsign()]
for root in props:
    bpy.context.view_layer.update()
    mobile_merge(root)
    manifest.append(export(root,root.name))
(OUT/'manifest.json').write_text(json.dumps({'generator':f'Blender {bpy.app.version_string} / blender/build_assets.py','blender_build':bpy.app.build_hash.decode('utf-8'),'coordinates':'Y-up; vehicles face +Z; metres; ground Y=0','license':'MIT','assets':manifest},indent=2),encoding='utf-8')

# Keep a reusable, fully editable showroom in the .blend source.
for root,loc in zip(cars,[(-3.1,-3.4,0),(3.1,-3.4,0),(-3.1,3.8,0),(3.1,3.8,0)]):
    root.location=loc
for root in props:
    for obj in descendants(root):
        obj.hide_render=True
        obj.hide_viewport=True
stage=empty('Showroom')
floor=material('ShowroomFloor',(.018,.030,.048),.17,.40)
cube('StudioStage',(0,0,-.16),(200,200,.3),stage,floor,.04)
for root,label in zip(cars,['COAST GT','RALLY 86','TRAIL 4X4','CAMPER']):
    x,y,z=root.location
    text('ShowroomLabel',label,(x,y-2.65,.014),.30,stage,MAT['white'],(0,0,0))
scene=bpy.context.scene
scene.render.engine='BLENDER_EEVEE'
scene.render.resolution_x=1800; scene.render.resolution_y=1400; scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG'
scene.render.filepath='//../docs/vehicles.png'
scene.render.film_transparent=False
scene.world.color=(.14,.18,.24)
scene.world.use_nodes=True
scene.world.node_tree.nodes.get('Background').inputs['Color'].default_value=(.13,.18,.25,1)
scene.world.node_tree.nodes.get('Background').inputs['Strength'].default_value=.45
for name,loc,energy,size in [('Key',(3,-6,13),1900,9),('Fill',(-7,-1,8),1500,7),('Rim',(3,9,11),2300,8)]:
    data=bpy.data.lights.new(name,'AREA'); data.energy=energy; data.shape='DISK'; data.size=size
    obj=bpy.data.objects.new(name,data); bpy.context.collection.objects.link(obj); obj.location=loc
    obj.rotation_euler=(Vector((0,0,0))-obj.location).to_track_quat('-Z','Y').to_euler()
camdata=bpy.data.cameras.new('ShowroomCamera'); cam=bpy.data.objects.new('ShowroomCamera',camdata)
bpy.context.collection.objects.link(cam); cam.location=(12,-18,17)
cam.rotation_euler=(Vector((0,.15,.40))-cam.location).to_track_quat('-Z','Y').to_euler()
camdata.type='ORTHO'; camdata.ortho_scale=16.8; scene.camera=cam
scene.view_settings.view_transform='AgX'
bpy.context.preferences.filepaths.save_version=0
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'blender'/'island-drive.blend'))
bpy.ops.render.render(write_still=True)
print('ASSET_BUILD_COMPLETE '+json.dumps(manifest))
