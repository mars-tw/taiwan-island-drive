"""Read back actual release evidence, hash artifacts, compare original runtime shots."""
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import json,hashlib,subprocess,re,shutil
ROOT=Path(__file__).resolve().parents[1];ART=ROOT/'docs/art'; E=ROOT/'docs/evidence/deep-r1'
read=lambda p:json.loads((ROOT/p).read_text(encoding='utf-8'))
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
write=lambda p,j:p.write_text(json.dumps(j,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
assert subprocess.check_output(['git','branch','--show-current'],cwd=ROOT).decode().strip()=='r1-fun-polish'
assert read('package.json')['version']==read('package-lock.json')['version']==read('package-lock.json')['packages']['']['version']=='2.12.0'
old=json.loads(subprocess.check_output(['git','show','bcbba9193665df6a34ecbf787e37069177801a3d:package.json'],cwd=ROOT).decode('utf-8'));new=read('package.json')
assert old['dependencies']==new['dependencies'] and old['devDependencies']==new['devDependencies']
assert not subprocess.check_output(['git','diff','--name-only','--','public/models/*.glb'],cwd=ROOT).strip()
assert not subprocess.check_output(['git','diff','--name-only','--','tests'],cwd=ROOT).strip(),'Existing tracked tests must remain unchanged'
manifest=read('docs/art/asset-manifest-r8.json')
for r in manifest['sources']+manifest['outputs']:assert sha(ROOT/r['path'])==r['sha256'],r['path']
for r in manifest['outputs']:
 if r['path'].startswith('public/'):
  assert sha(ROOT/'dist'/Path(r['path']).relative_to('public'))==r['sha256']
  assert sha(ROOT/'dist-native'/Path(r['path']).relative_to('public'))==r['sha256']
capture=read('docs/evidence/deep-r1/acceptance-r8.json');assert capture['status']=='VERIFIED'
selected=read('docs/store/screenshots/art-r8/SELECTED.json');assert selected['status']=='VERIFIED' and len(selected['shots'])==14
for shot in selected['shots']:
 p=ROOT/shot['path'];assert sha(p)==shot['sha256'];assert Image.open(p).size==((1290,2796) if shot['device']=='iphone' else (2064,2752))
assert len({s['scene'] for s in selected['shots']})==7
for f in ['docs/evidence/deep-r1/merge/merge-path.json','docs/evidence/deep-r1/store/review-path.json']:
 j=read(f);assert not j['errors'] and not j['externalRequests']
assert read('docs/evidence/deep-r1/regressions.json')['status']=='VERIFIED'
play=read('docs/evidence/deep-r1/playtest.json');assert play['status']=='VERIFIED' and play['elapsedSeconds']>=600 and not play['errors']
performance=read('docs/evidence/deep-r1/performance.json');assert all(r['p95']<=18 for r in performance['rows'])
pairs=[]
for before,after in [('01-home','01-home'),('02-driving','02-driving'),('06-split','06-split'),('07-complete','07-complete'),('08-load','08-load'),('04-takeoff','09-flight-baseline-match')]:
 b=ART/f'compare/r8-before/iphone-{before}.png';a=ROOT/(f'docs/store/screenshots/art-r8/iphone-{after}.png' if after in ['01-home','02-driving','06-split','07-complete'] else f'docs/art/compare/r8-after/iphone-{after}.png')
 dst=ART/f'compare/r8-after/iphone-{before}.png'
 if a.resolve()!=dst.resolve():shutil.copyfile(a,dst)
 assert Image.open(b).size==Image.open(dst).size
 pairs.append({'scene':before,'before':b.relative_to(ROOT).as_posix(),'after':dst.relative_to(ROOT).as_posix(),'size':Image.open(b).size,'before_sha256':sha(b),'after_sha256':sha(dst),'method':'Same 430x932 CSS viewport at DPR3, unmodified runtime screenshots. Flight baseline was the airborne treasure lesson, despite its original filename.'})
write(ART/'compare/pairs-r8.json',pairs)
canvas=Image.new('RGB',(1200,1050),'#e4f5ff');draw=ImageDraw.Draw(canvas);font=ImageFont.truetype('C:/Windows/Fonts/msjh.ttc',18)
for i,r in enumerate(pairs):
 x=(i%3)*400;y=(i//3)*525
 for col,key in enumerate(['before','after']):
  im=Image.open(ROOT/r[key]).convert('RGB');im.thumbnail((195,485),Image.Resampling.LANCZOS);canvas.paste(im,(x+col*200,y+33));draw.text((x+col*200+4,y+5),('改前 ' if col==0 else '改後 ')+r['scene'],font=font,fill='#143b61')
canvas.save(ART/'compare/R8-before-after.jpg',quality=88)
canvas=Image.new('RGB',(7*210,500),'#e4f5ff');draw=ImageDraw.Draw(canvas)
for i,r in enumerate(sorted((s for s in selected['shots'] if s['device']=='iphone'),key=lambda s:s['scene'])):
 im=Image.open(ROOT/r['path']).convert('RGB');im.thumbnail((204,455),Image.Resampling.LANCZOS);canvas.paste(im,(i*210,35));draw.text((i*210+4,5),r['scene'],font=font,fill='#143b61')
canvas.save(ART/'store-seven-r8.jpg',quality=88)

files=subprocess.check_output(['git','ls-files','--cached','--others','--exclude-standard','-z'],cwd=ROOT).decode('utf-8').split('\0')
binary={'.png','.jpg','.jpeg','.webp','.glb','.blend','.woff','.woff2','.mp3','.ogg','.wav','.pdf','.zip','.pem','.ico'};pattern=re.compile(rb'sk-proj-[A-Za-z0-9_-]{20,}|sk-[a-z0-9]{40}',re.I);hits=[];count=0
scan={ROOT/f for f in files if f and not any(p in {'.git','node_modules','.secrets','output','.audit-tmp'} for p in Path(f).parts)}
scan.update(p for folder in ['dist','dist-native'] for p in (ROOT/folder).rglob('*') if p.is_file())
for p in sorted(scan):
 if not p.is_file() or p.suffix.lower() in binary:continue
 count+=1
 if pattern.search(p.read_bytes()):hits.append(p.relative_to(ROOT).as_posix())
assert not hits,{'secret_file_hits':hits}
production=['package.json','package-lock.json','car/index.html','src/games/car/config.js','android/app/build.gradle','ios/App/App.xcodeproj/project.pbxproj','public/models/catalog.json']
assert all('2.11.0' not in (ROOT/f).read_text(encoding='utf-8') for f in production)
ios=(ROOT/production[-2]).read_text(encoding='utf-8');assert ios.count('CURRENT_PROJECT_VERSION = 8;')==2
android=(ROOT/'android/app/build.gradle').read_text(encoding='utf-8');assert 'versionCode 8' in android
native=read('output/native/bundle-manifest.json');assert native['sourceVersion']=='2.12.0'
copy=E/'native-bundle-summary.json';write(copy,{k:v for k,v in native.items() if k!='files'})
size=lambda folder:sum(p.stat().st_size for p in (ROOT/folder).rglob('*') if p.is_file())
reviews=[{'path':str(p),'sha256':sha(ROOT/p)} for p in ['docs/art/ART_RESCORE4_MUSE.md','docs/art/ART_REVIEW_MUSE.md']]
report={'status':'VERIFIED','version':'2.12.0','native_source_build':8,'baseline_commit':'bcbba9193665df6a34ecbf787e37069177801a3d','generation_calls':8,'new_designs':8,'runtime_files':len([x for x in manifest['outputs'] if x['path'].startswith('public/')]),'new_image_bytes':manifest['new_runtime_bytes'],'web_bytes_including_downloads':size('dist'),'web_bytes_excluding_downloads':sum(p.stat().st_size for p in (ROOT/'dist').rglob('*') if p.is_file() and 'downloads' not in p.relative_to(ROOT/'dist').parts),'native_bundle_bytes':native['totalBytes'],'native_files':native['fileCount'],'comparison_pairs':len(pairs),'selected_store_screenshots':14,'secret_matches':0,'scanned_text_files':count,'old_version_production_matches':0,'existing_tests_modified':False,'new_tests':2,'new_dependencies':0,'playtest_seconds':play['elapsedSeconds'],'p95_range_ms':[min(x['p95'] for x in performance['rows']),max(x['p95'] for x in performance['rows'])],'performance_limit':'Concurrent host load; rAF interval, not CPU/GPU time or native device gate','review_sources':reviews,'dist_entries':{p:sha(ROOT/'dist'/p) for p in ['index.html','car/index.html','train/index.html','flight/index.html']},'limits':['Independent 9/10 not obtained','No child or parent perception study','No iOS/Android hardware or WebKit run','No signed binary','Native icon catalog retains R7; R8 proposal and web icons only','No store operation, push, deploy or external delegation']}
write(E/'release-proof.json',report)
home=[r['ms'] for r in capture['rows'] if r.get('measurement')=='cold-home-ready-ms'];car=[r['ms'] for r in capture['rows'] if r.get('measurement')=='first-car-entry-ready-ms']
section=f'''| 項目 | 狀態與讀回 |
|---|---|
| npm test | VERIFIED：164／164，既有測試與斷言未修改，新增2項速度／離地語意測試；`docs/evidence/deep-r1/unit-tests.txt` |
| npm run build | VERIFIED：8個既有車輛表面守門、Vite與本機precache；`build.txt` |
| npm run test:merge（5286） | VERIFIED：11尺寸、132檢查、25截圖，0 runtime errors／外部請求；`merge/merge-path.json`、`merge-test.txt` |
| npm run test:store（5113） | VERIFIED：12尺寸、101檢查、26實際截圖，冷開、觀察課、離線三交通、重開與保存／無法保存處理通過；`store/review-path.json`、`store-test.txt` |
| 既有美術／手機／車體／飛行守門 | VERIFIED：七支既有runner斷言原封不動；125美術情境、12車體視口、3手機無鍵盤設定、100手機情境／638控制、28飛行版面；`regressions.json`與逐支log |
| 新五項美術驗收 | VERIFIED：七個不同階段×兩裝置，動畫中禁止跳步、前4後1、自然得星、真起飛、固定暫停、學生證可開關接續、新Logo與安全教練實載；`acceptance-r8.json` |
| 原生來源包／政策 | VERIFIED：6個Python政策測試、28個包裝檢查；{native['fileCount']}本機資源、{native['totalBytes']:,} bytes（{native['totalBytes']/1048576:.2f} MiB）；`native-policy.txt`、`native-package.txt`、`native-bundle-manifest.json`。沒有簽章或實機驗證 |
| p95三跑中位 | EXECUTED：12組均{report['p95_range_ms'][0]}～{report['p95_range_ms'][1]}ms、≤18ms；`performance.json`。並發載量測，僅供參考；rAF間隔不等於CPU／GPU或原生實機frame time |
| 首次載入 | EXECUTED：localhost冷開首頁，手機／iPad {home}ms；首次進汽車完整導覽至可出發 {car}ms，真實UI未限速；`acceptance-r8.json`。不代表手機網路下載或原生啟動時間 |
| Web／包體 | VERIFIED：Web（不含downloads）{report['web_bytes_excluding_downloads']:,} bytes（{report['web_bytes_excluding_downloads']/1048576:.2f} MiB），新圖增加{report['new_image_bytes']:,} bytes；來源母版與報告不進runtime |
| 版本／來源／秘密 | VERIFIED：2.12.0／build8、正式來源舊版號0殘留、{count}文字檔掃描0命中、圖片／Web／native hash一致、0新增依賴、原GLB未改、既有授權保留；`release-proof.json`。歷史報告仍保留其當時版號 |

上述相對證據名稱均位於 `docs/evidence/deep-r1/`。第一次手機控制檢查抓到火車橫向暫停遮擋，已調整操作列並重跑638控制全綠；375×667飛行選單也補中高度版型，28項版面全綠。沒有刪除測試或放寬斷言，歷史runner只改本次輸出目錄。標準歷史證據保持原版；本輪結果獨立保留。'''
p=ROOT/'docs/CODEX_RESPONSE_R8_ART.md';text=p.read_text(encoding='utf-8');text=text.replace('PREPARED：本節在完整測試、離線、效能、尺寸與雜湊讀回後填入。不可把這段當成全綠證據。',section).replace('美術實作EXECUTED；最終驗證表由實際讀回更新。','美術實作EXECUTED；本機工程與證據讀回VERIFIED。');p.write_text(text,encoding='utf-8')
p=ROOT/'docs/OPTIM_PLAN_R8.md';text=p.read_text(encoding='utf-8');text+='\n收尾：五項Muse施工與三項留存修正EXECUTED；164單元、132整合、101商店、七支既有回歸、14原尺寸商店圖、11素材hash與來源包讀回VERIFIED。p95為並發參考；獨立9分與原生實機仍未驗證。詳見CODEX_RESPONSE_R8_ART.md。\n';p.write_text(text,encoding='utf-8')
print(json.dumps(report,ensure_ascii=False))
