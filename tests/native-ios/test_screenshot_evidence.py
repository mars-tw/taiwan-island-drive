"""Raster/evidence policy tests only; fixtures are not native screenshots."""
import importlib.util,json,pathlib,struct,tempfile,unittest,zlib
from PIL import Image
ROOT=pathlib.Path(__file__).resolve().parents[2]
spec=importlib.util.spec_from_file_location('native_screenshot_verifier',ROOT/'scripts/verify-native-ios-screenshots.py')
verifier=importlib.util.module_from_spec(spec); spec.loader.exec_module(verifier)

class ScreenshotEvidenceTests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory(); self.directory=pathlib.Path(self.temp.name); self.path=self.directory/'fixture.png'
    def tearDown(self): self.temp.cleanup()
    def raster(self,color=None):
        image=Image.new('RGB',(8,8),color or (255,255,255))
        if color is None: image.putpixel((4,4),(10,40,80))
        image.save(self.path)
    def test_real_rgb_decode(self):
        self.raster(); self.assertEqual(verifier.png_info(self.path),(8,8,8,2))
    def test_blank_white_and_black(self):
        for color in [(255,255,255),(0,0,0),(12,30,50)]:
            with self.subTest(color=color):
                self.raster(color)
                with self.assertRaises(ValueError): verifier.png_info(self.path)
    def test_corrupt_idat_with_valid_crc(self):
        self.raster(); data=bytearray(self.path.read_bytes()); pos=data.index(b'IDAT'); length=struct.unpack('>I',data[pos-4:pos])[0]
        data[pos+4:pos+4+length]=b'\xff'*length
        data[pos+4+length:pos+8+length]=struct.pack('>I',zlib.crc32(data[pos:pos+4+length])&0xffffffff)
        self.path.write_bytes(data)
        with self.assertRaises(ValueError): verifier.png_info(self.path)
    def test_truncated_png(self):
        self.raster(); self.path.write_bytes(self.path.read_bytes()[:-8])
        with self.assertRaises(ValueError): verifier.png_info(self.path)
    def test_passed_gate_requires_file(self):
        with self.assertRaises(ValueError): verifier.parent_gate_evidence(self.directory,'passed')
        self.assertEqual(verifier.parent_gate_evidence(self.directory,'failed')['status'],'failed')
    def test_gate_final_booleans(self):
        folder=self.directory/'parent-gate-evidence'; folder.mkdir(); path=folder/'parent-gate-result.json'
        valid={'cancelDenied':True,'settingsStayedClosed':True,'secondRequestStillRequiresGate':True,'hardwareTest':False}
        for key in ['cancelDenied','settingsStayedClosed','secondRequestStillRequiresGate']:
            for wrong in [False,1,None]:
                with self.subTest(key=key,wrong=wrong):
                    path.write_text(json.dumps({**valid,key:wrong}))
                    with self.assertRaises(ValueError): verifier.parent_gate_evidence(self.directory,'passed')
        path.write_text(json.dumps(valid)); result=verifier.parent_gate_evidence(self.directory,'passed')
        self.assertTrue(result['evidenceVerified']); self.assertEqual(len(result['sha256']),64)

if __name__=='__main__': unittest.main()
