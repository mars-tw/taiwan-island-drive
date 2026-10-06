"""Validate actual XCTest screenshots. No resizing, compositing, browser emulation or upload."""
import datetime,hashlib,json,os,pathlib,struct,subprocess,sys,zlib
from PIL import Image,ImageFile,__version__ as pillow_version
ImageFile.LOAD_TRUNCATED_IMAGES=False

def png_info(path,allow_alpha=False):
    data=path.read_bytes()
    if len(data)<33 or data[:8]!=b'\x89PNG\r\n\x1a\n': raise ValueError('Not a PNG: '+path.name)
    width,height,depth,color=struct.unpack('>IIBB',data[16:26])
    offset=8; complete=False
    while offset<len(data):
        if offset+12>len(data): raise ValueError('Truncated PNG chunk: '+path.name)
        length=struct.unpack('>I',data[offset:offset+4])[0]; kind=data[offset+4:offset+8]
        end=offset+length+12
        if end>len(data): raise ValueError('Truncated PNG data: '+path.name)
        payload=data[offset+8:offset+8+length]; crc=struct.unpack('>I',data[offset+8+length:end])[0]
        if zlib.crc32(kind+payload)&0xffffffff!=crc: raise ValueError('PNG checksum failure: '+path.name)
        if kind==b'tRNS': raise ValueError('PNG transparency is not accepted: '+path.name)
        offset=end
        if kind==b'IEND': complete=True; break
    if not complete or offset!=len(data): raise ValueError('Incomplete PNG or trailing data: '+path.name)
    if depth!=8 or color not in ({2,6} if allow_alpha else {2}): raise ValueError('Unexpected PNG depth/color/alpha: '+path.name)
    try:
        with Image.open(path) as image: image.verify()
        with Image.open(path) as image:
            image.load() # Real IDAT / zlib / filter decoding; header checks are insufficient.
            if image.format!='PNG' or image.size!=(width,height): raise ValueError('PNG dimensions mismatch')
            rgb=image.convert('RGB') # Read-only analysis; captured files are never rewritten.
            if all(low==high for low,high in rgb.getextrema()): raise ValueError('Uniform blank PNG frame')
    except (OSError,SyntaxError,ValueError) as error: raise ValueError('PNG pixel decode/blank check failed: '+path.name) from error
    return width,height,depth,color

def check_parent_gate_result(path):
    try: evidence=json.loads(path.read_text(encoding='utf8'))
    except (OSError,ValueError) as error: raise ValueError('Missing or malformed parent-gate result') from error
    required=['cancelDenied','settingsStayedClosed','secondRequestStillRequiresGate']
    if not isinstance(evidence,dict) or any(evidence.get(key) is not True for key in required) or evidence.get('hardwareTest') is not False:
        raise ValueError('Parent-gate final assertions not all proved true')
    return evidence

def parent_gate_evidence(directory,status):
    if status not in {'passed','failed'}: raise ValueError('Unknown parent-gate status')
    path=directory/'parent-gate-evidence/parent-gate-result.json'
    if status=='failed': return {'status':'failed','evidenceVerified':False}
    check_parent_gate_result(path)
    return {'status':'passed','evidenceVerified':True,'file':'parent-gate-evidence/parent-gate-result.json','sha256':hashlib.sha256(path.read_bytes()).hexdigest()}

def main():
    out=pathlib.Path(sys.argv[1]).resolve(); root=pathlib.Path(__file__).resolve().parent.parent
    commit=subprocess.check_output(['git','rev-parse','HEAD'],cwd=root,text=True).strip()
    devices=json.loads((out/'device-plan.json').read_text()); screenshots=[]; gate_results={}
    for device in devices:
        family=device['family']; directory=out/family; run=json.loads((directory/'run.json').read_text())
        if run['captureTest']!='passed': raise ValueError('Native XCTest navigation did not pass')
        records=json.loads((directory/'screens/capture-records.json').read_text())
        if [r['name'] for r in records]!=['01-lobby','02-car','03-train','04-flight']: raise ValueError('Incomplete native screenshots')
        sizes={(1206,2622),(1320,2868),(1290,2796)} if family=='iphone' else {(2064,2752)}
        for record in records:
            image=directory/'screens'/record['publication']; original=directory/'screens'/record['original']
            width,height,depth,color=png_info(image)
            original_info=png_info(original,allow_alpha=True)
            if (width,height) not in sizes or (width,height)!=original_info[:2]: raise ValueError('Unexpected size or resized original: '+image.name)
            if depth!=8 or color!=2: raise ValueError('Publication PNG must be 8-bit RGB without alpha: '+image.name)
            screenshots.append({**record,'family':family,'file':str(image.relative_to(out)),'originalFile':str(original.relative_to(out)),
                                'sha256':hashlib.sha256(image.read_bytes()).hexdigest(),'originalSha256':hashlib.sha256(original.read_bytes()).hexdigest(),
                                'alpha':False,'rasterDecoded':True,'uniformBlankRejected':True,'device':device,'binaryExecutableSha256':run['binaryExecutableSha256']})
        gate_results[family]=parent_gate_evidence(directory,run['parentGateTest'])
    if len(screenshots)!=8: raise ValueError('Expected four actual screenshots for both device families')
    report={'schemaVersion':1,'status':'native_simulator_capture_verified','generatedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),
            'sourceCommit':commit,'nativeVersion':'1.0.0','buildNumber':'1','bundleId':'tw.mars.islandtransport',
            'xcode':os.environ['APPLE_XCODE_VERSION'],'xcodeBuild':os.environ['APPLE_XCODE_BUILD'],'sdk':os.environ['APPLE_IPHONEOS_SDK'],
            'captureAPI':'XCUIScreen.main.screenshot','automation':'XCTest UI tests, actual boot/install/launch',
            'screenshots':screenshots,'parentGateTests':gate_results,'hardwareTest':False,'storeUploaded':False,
            'imageDecoder':'Pillow','imageDecoderVersion':pillow_version,'visualApprovalPending':True,
            'note':'Pixel decoding and blank rejection do not prove 3D model visibility or visual quality. Original simulator screens retained; requires visual review before submission.'}
    (out/'manifest.json').write_text(json.dumps(report,indent=2,ensure_ascii=False)+'\n',encoding='utf8')
    print('Verified 8 genuine XCTest PNG outputs; visual review and hardware checks remain pending.')

if __name__=='__main__':
    if len(sys.argv)==3 and sys.argv[1]=='--check-parent-gate':
        check_parent_gate_result(pathlib.Path(sys.argv[2])); print('Parent-gate final assertion evidence: PASS')
    else: main()
