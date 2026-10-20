"""Read back local evidence and copy exactly fifteen original phone captures."""
import hashlib
import json
import re
import shutil
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'docs/content/r30'
def read(rel):
    return json.loads((ROOT / rel).read_text(encoding='utf-8-sig'))
def sha(p):
    return hashlib.sha256(p.read_bytes()).hexdigest()
def log(name):
    data = (ROOT / '.audit-tmp' / name).read_bytes()
    return data.decode('utf-16' if data.startswith(b'\xff\xfe') else 'utf-8-sig').replace('\r\n','\n').replace('\r','')
def git(*args):
    return subprocess.check_output(['git', *args], cwd=ROOT).decode('utf-8').strip()

assert Path.cwd().resolve() == ROOT
assert git('branch', '--show-current') == 'r1-fun-polish'
assert read('package.json')['version'] == '2.42.0'
baseline = read('docs/content/r30/baseline.json')
for name, digest in baseline['existingTests'].items():
    assert sha(ROOT / name) == digest, name
preexisting = [p for p in baseline['untracked'] if 'r30' not in p.lower()]
assert all((ROOT / p).exists() for p in preexisting)
cleanup = read('docs/content/r30/cleanup-result.json')
assert all(not (ROOT / r['path']).exists() for r in cleanup['files'])
assert read('docs/content/r30/secret-scan.json')['hits'] == 0
manifests = ['all', 'cake-nine', 'controlled', 'layout', 'offline', 'store', 'performance']
for scope in manifests:
    data = read(f'docs/content/r30/{"offline/" if scope == "offline" else ""}browser-{scope}.json')
    assert data['status'] == 'VERIFIED', scope
    assert not data['errors'] and not data['failed'] and not data['external']
    for row in data['shots']:
        assert sha(ROOT / row['path']) == row['sha256'], row['path']
        assert not any(c['bad'] for c in row['controls'])
        assert not row['layout']['overlaps'] and not row['layout']['iconOverlaps']

review = [
 ('cake', 'phone-cake-controlled-high-support.png', '同起點同輸入時間：只扶正'),
 ('cake', 'phone-cake-controlled-brake-support.png', '接續對照：煞車加扶正'),
 ('cake', 'phone-cake-stage-3-parked.png', '休息灣停妥、坐穩與出灣亮鍵一致'),
 ('cake', 'phone-cake-stage-3-main-road.png', '同趟離灣後，車完全回主路'),
 ('cake', 'phone-cake-replay-new-conditions.png', '重玩卡以坡道、雙彎和蛋糕方向預告'),
 ('crossing', 'phone-crossing-stage-1-look-first.png', '玩家觀察第一側來車'),
 ('crossing', 'phone-crossing-stage-1-first-clear.png', '同路口第一台車通過'),
 ('crossing', 'phone-crossing-stage-1-car-still-wait.png', '朋友過街中新車出現、右側確認失效'),
 ('crossing', 'phone-crossing-stage-1-new-car-clear-unconfirmed.png', '新車通過，仍須玩家重新看'),
 ('crossing', 'phone-crossing-stage-1-look-again-confirmed.png', '正確重看後解除失效'),
 ('tickets', 'phone-tickets-stage-1-wrong-shape.png', '朋友持票、放大並排、輪廓不同'),
 ('tickets', 'phone-tickets-stage-1-wrong-color.png', '同站票色不同，圖示分開指出'),
 ('tickets', 'phone-tickets-stage-1-paused.png', '同人門檻放開，藍色暫停'),
 ('tickets', 'phone-tickets-stage-1-paused-still.png', '700ms後維持同進度與位置'),
 ('tickets', 'phone-tickets-stage-1-seated-1.png', '續按後確實入座，人數才加一'),
]
folder = OUT / 'review-set'
folder.mkdir(exist_ok=True)
expected = {f'{i:02d}-{name.removeprefix("phone-")}' for i, (_, name, _) in enumerate(review, 1)}
assert {p.name for p in folder.glob('*.png')}.issubset(expected), 'unexpected review image'
rows = []
for i, (kind, name, purpose) in enumerate(review, 1):
    source = OUT / name
    data = source.read_bytes()
    assert (int.from_bytes(data[16:20], 'big'), int.from_bytes(data[20:24], 'big')) == (390, 844)
    target = folder / f'{i:02d}-{name.removeprefix("phone-")}'
    if target.exists():
        assert sha(target) == sha(source), 'existing review image changed: ' + target.name
    shutil.copyfile(source, target)
    assert sha(source) == sha(target)
    rows.append(dict(kind=kind, source=source.relative_to(ROOT).as_posix(), path=target.relative_to(ROOT).as_posix(), purpose=purpose, width=390, height=844, sha256=sha(target)))
assert len(list(folder.glob('*.png'))) == 15
(OUT / 'review-set.json').write_text(json.dumps({'status': 'VERIFIED', 'images': rows}, ensure_ascii=False, indent=2), encoding='utf-8')

evidence = ROOT / 'docs/evidence/content-r30'
evidence.mkdir(exist_ok=True)
pairs = [
 ('docs/content/r29/phone-cake-bay-main-road.png', 'phone-before-r29-main-road.png'),
 ('docs/content/r30/phone-cake-stage-3-main-road.png', 'phone-after-r30-main-road.png'),
 ('docs/content/r30/layout/device-844x390-tickets-matched.png', 'phone-landscape.png'),
 ('docs/content/r30/layout/device-768x1024-tickets-matched.png', 'ipad-portrait.png'),
]
copies = []
for source, target in pairs:
    shutil.copyfile(ROOT / source, evidence / target)
    copies.append(dict(source=source, path=(evidence / target).relative_to(ROOT).as_posix(), sha256=sha(evidence / target)))
(evidence / 'before-after.json').write_text(json.dumps({'status': 'VERIFIED', 'images': copies}, indent=2), encoding='utf-8')

logs = {}
for scope in ['tests', 'build', 'merge', 'store']:
    text = log(f'r30-{scope}.log')
    (OUT / f'{scope}-output.txt').write_text(text, encoding='utf-8', newline='\n')
    logs[scope] = text
assert re.search(r'pass 317', logs['tests']) and re.search(r'fail 0', logs['tests'])
assert 'built in' in logs['build']
assert re.search(r'PASS \d+ integration checks; \d+ screenshots; 0 runtime errors', logs['merge'])
assert re.search(r'PASS \d+ checks; \d+ unmodified screenshots; zero runtime errors', logs['store'])
for name, result_path, screen_path in [
    ('merge', 'docs/content/r30/merge/merge-path.json', 'docs/store/screenshots/content-r30/merge/manifest.json'),
    ('store', 'docs/content/r30/store-regression/review-path.json', 'docs/store/screenshots/content-r30/regression/manifest.json')
]:
    result, screens = read(result_path), read(screen_path)
    assert not result['errors'] and not result['externalRequests'], name
    assert all(not r.get('problems') for r in result['rows'])
    assert screens['sourceVersion'] == '2.42.0'
    for s in screens['shots']:
        assert sha(ROOT / s['path']) == s['sha256'], s['path']
perf = read('docs/content/r30/performance.json')
intermediates = read('docs/content/r30/intermediate-cleanup.json')
assert intermediates['status'] == 'VERIFIED'
assert perf['status'] in ('VERIFIED', 'BLOCKED')
live = ['package.json', 'package-lock.json', 'src/games/car/config.js', 'public/sw.js', 'android/app/build.gradle', 'ios/App/App.xcodeproj/project.pbxproj']
assert not any('2.41.0' in (ROOT / p).read_text(encoding='utf-8') for p in live)
proof = dict(status='VERIFIED', version='2.42.0', build=38, branch=git('branch', '--show-current'), baseline=baseline['head'], existingTestsUnchanged=len(baseline['existingTests']), preexistingUntrackedPreserved=len(preexisting), tests=317, reviewImages=15, cleanup=dict(deletedFiles=cleanup['deletedFiles'], releasedBytes=cleanup['releasedBytes'], retained=len(cleanup['retained'])), performance=perf, sourceSha256={p:sha(ROOT / p) for p in live+['src/shared/content-r1-ui.js','src/shared/content-r30.js','src/shared/content-r30-scene.js','src/shared/content-r30.css']}, limits=['Physical devices and native voice require devices', 'Families and masked-text identification require human participants', 'Concurrent load performance is reference only', 'Muse >=8 requires independent review'])
(OUT / 'release-proof.json').write_text(json.dumps(proof, indent=2), encoding='utf-8')
merge_count = re.search(r'PASS (\d+) integration checks', logs['merge']).group(1)
store_count = re.search(r'PASS (\d+) checks', logs['store']).group(1)
perf_text = '、'.join(f"{r['width']}×{r['height']}：{r['p95']:.1f}ms" for r in perf['rows'])
report = f'''# 新內容第30輪交付

工單日期2026-10-18，本機執行2026-10-21。VERIFIED：版本 **2.42.0／build 38**，只在 `r1-fun-polish` 工作。三課維持原入口：首頁 → 海岸實作課 → 選課 → 大圖示選站卡。沒有增加課程。

## 三課修正與怎麼玩

**把蛋糕平穩送到**：方向盤開車、另一組雙手扶蛋糕。蛋糕歪了先減速，再往相反方向扶。回正百分比只表示顯示傾角相對直立的比例：`100 − round(abs(角度) / 28 × 100)`，0°唯一對應坐穩100%，不表示路程、分數或累積完成度。沒有扶正輸入時寫「蛋糕歪了」，正確扶正時才寫「扶正中」。同一階段函式決定站名、提示與唯一亮鍵。休息灣依序開進格子、煞停休息、坐穩出灣、離格、完全回主路，再到分享站煞停，休息灣不再寫到家。主畫面車頂蛋糕放大，傾斜尺同步顯示歪向；特寫可遮掉。

**路口停看等**：停在線前，自選何時看左右。三站皆在第一位朋友過街途中，由另一側出現新車，該側舊勾立即變成紅框重看符號。新車會在線前讓正在過街的朋友，之後通過；看錯側或車未通過都不能解除失效。車過後玩家必須親自重看，再看清兩側，三人到岸後才能出發。左右小視野在過街時持續保留，放在操作區上方，完全避開人物；窄視口收起重複站名與計數，保留實景、主要提示及雙側視野。出場路線箭頭只在真的出發時出現，不壓住待過街的朋友。灰色出發鈕旁只先指出下一個缺件。沒有催促或計時懲罰。

**形狀車票，找對月台**：朋友胸前持有大票，點朋友可切換放大的朋友票；選月台後與月台票並排，輪廓與票色各用一組圖示比對。形狀錯、顏色錯分開指出，不亮正解。停對、停穩、開門後，點朋友有描邊與「輪到」姓名，底部固定出現邀他上車。按住陪同，到門檻放開站穩，再按住進走道；下半身由車內遮擋，真正坐下才增加人數。

選站卡只留站名與短句。蛋糕用坡道、雙彎、煞車及傾斜蛋糕；路口用來車方向與三位真實角色順序；車票用大形色票。重玩以圖示「上次→這次」比較，不再塞多行小字。

## Muse唯一五項驗收與原尺寸路徑

| 審查項目 | 狀態與證據 |
| --- | --- |
| 1 狀態語言一致 | VERIFIED。`docs/content/r30/nine/`、其 `replay-1/`、`replay-2/` 各完成三站，共九次站點驗證。每站 `phone-cake-stage-N-idle.png`、`slowing.png`／`steadying.png`、`destination-braking.png`、`finished.png`；第三站另有 `bay-braking.png`、`resting.png`、`parked.png`、`leaving.png`、`main-road.png`。非休息灣站不虛構離灣狀態。每張遊玩圖自動核對0°=100%與唯一亮鍵=當前動作。 |
| 2 遮特寫仍可判讀 | VERIFIED。`docs/content/r30/phone-cake-masked-left.png`、`phone-cake-masked-right.png`、`phone-cake-masked-upright.png`，皆390×844原尺寸，由瀏覽器截圖直接遮住特寫，沒有改造遊戲圖層。人類辨識率仍待真人驗證。 |
| 3 三站確認失效 | VERIFIED。每站 `docs/content/r30/phone-crossing-stage-N-look-first.png` → `first-clear.png` → `new-car-invalidated.png`／`car-still-wait.png` → `new-car-clear-unconfirmed.png` → `look-again-confirmed.png`；另有 `wrong-side-stays-locked.png` 與 `ready.png`。N=1、2、3，每站刷新計數皆1。 |
| 4 主畫面票面比對 | VERIFIED。每站 `docs/content/r30/phone-tickets-stage-N-decision.png`、`wrong-shape.png`、`wrong-color.png`、`matched.png`、`selected-friend.png`。原圖同時保留胸前票與並排大票，錯誤畫面的輪廓／票色標記分開；沒有直接顯示答案。N=1、2、3。 |
| 5 大圖示選站與重玩 | VERIFIED。`docs/content/r30/phone-cake-select-stations.png`／`phone-cake-replay-new-conditions.png`，crossing、tickets同名替換。八視口首次卡在 `layout/device-WxH-KIND-ready.png`，真實完成後重玩卡在 `layout/device-WxH-KIND-replay.png`。遮字理解的真人測試列BLOCKED。 |

`phone-cake-stage-3-parked.png` → `leaving.png` → `main-road.png` 證明正常進出灣。`phone-cake-controlled-initial.png`、`controlled-high-support.png`、`controlled-brake-support.png` 及 `controlled-comparison.json` 記錄兩個獨立瀏覽器context、完全相同初始資料與640ms輸入；煞車加扶正的車速與傾角皆較低。

車票同人連續 `phone-tickets-stage-1-holding.png` → `paused.png` → `paused-still.png` → `aisle.png` → `seated-1.png`。放開700ms，進度與人物螢幕座標逐值相同；每站三位朋友皆完成。各課 `phone-KIND-complete.png` 與 `phone-KIND-saved.png` 核對完成與完整保存資料相同。斷網同流程在 `docs/content/r30/offline/`。

## 審查精選、美術與商店

`docs/content/r30/review-set/` **只有15張手機直式PNG**，每張390×844：01～05蛋糕、06～10路口、11～15車票，每課5張且含遊玩。連續對照包含煞車扶正、停妥到回主路、新車造成確認失效，以及門檻700ms暫停至真正入座。由原圖逐位元複製，SHA與用途在 `review-set.json`。15張優先證明核心互動；完整五項逐狀態驗收另按上表索引，未聲稱精選能容納全部狀態。

新增商店原圖：`docs/store/screenshots/content-r30/ticket-comparison-1290x2796.png`、`ticket-comparison-2064x2752.png`，由430×932／DPR3、1032×1376／DPR2瀏覽器直接輸出。所有既有商店圖保留。R29矛盾畫面與R30回主路、手機橫式、iPad原尺寸副本在 `docs/evidence/content-r30/`，來源SHA在 `before-after.json`。

新增美術 **0張、生成呼叫0次**。沿用 `docs/art/ART_DIRECTION.md`、受管蛋糕分層、人物姿勢、汽車與列車原畫；來源SHA在 `art-manifest.json`。方向、形色及傾斜尺為原生SVG教學介面符號。沒有宣稱新骨架、真3D奶油物理或新的角色動畫。

## 測試、清理與保留

VERIFIED：`npm test` **317/317**、`npm run build`、5286 `npm run test:merge` **{merge_count}項**、5113 `npm run test:store` **{store_count}項**。輸出存本輪 `tests-output.txt`／`build-output.txt`／`merge-output.txt`／`store-output.txt`。既有{len(baseline['existingTests'])}個測試及輔助檔SHA未變，未刪測試、未放寬斷言。全部指定測試於舊媒體清理後執行。

VERIFIED：三課九站正常UI完成與存檔讀回；蛋糕另三輪九次站點驗證；安裝快取後斷網重載再完成三課。八視口320×568、568×320、390×844、844×390、768×1024、1024×768、1366×600、1280×640，包含選站、操作、觀察、比對、按住／放開及真實完成後重玩。所有可互動控制≥60px，文字／圖示無重疊或裁切，手機無鍵盤提示；遊戲外部請求與腳本錯誤皆0。完整資料在 `browser-all.json`、`browser-cake-nine.json`、`browser-layout.json`、`offline/browser-offline.json`。

效能狀態 **{perf['status']}**：三視口各三次180幀真實RAF，p95三跑中位 {perf_text}。門檻18ms，並發載工作站量測只供參考；實體裝置與乾淨機表現未驗證。秘密掃描0命中、現行版本檔舊版號0命中；歷史報告／舊輪驗證器保留原版本契約。工單的storm-apocalypse Playwright路徑不存在，使用既有npm-cache Playwright；未安裝新套件。

EXECUTED並回讀VERIFIED：移除 **{cleanup['deletedFiles']}個**已追蹤、未修改且被取代的舊媒體，工作樹檔案大小合計 **{cleanup['releasedBytes']:,} bytes（{cleanup['releasedBytes']/1048576:.2f} MiB）**，含R29全部15張舊review-set。清單、絕對範圍、SHA與逐檔結果在 `cleanup-plan.json`／`cleanup-result.json`；Git歷史未改寫。

保留舊媒體{len(cleanup['retained'])}個：86個原畫／美術契約、8,214個仍被歷史驗證manifest讀取並核對SHA的來源、52個腳本明確輸入。每檔保留原因及manifest讀取來源均列在清冊，沒有宣稱舊證據已全數刪除。各輪Markdown、審查意見、商店圖與{len(preexisting)}個原有未追蹤檔全部保留。只明確加入本輪檔案與核定刪除清單，本機提交，沒有push、部署、商店操作、訊息或外部服務派工。

另移除本輪自行產生、已由最終驗證原圖取代的中間產物{intermediates['deletedFiles']}個，合計{intermediates['releasedBytes']:,} bytes（{intermediates['releasedBytes']/1048576:.2f} MiB），清冊在 `intermediate-cleanup.json`；不含任何接手前既有未追蹤檔。最終九次站點原圖獨立保存在 `nine/`，避免重跑時覆蓋同名圖造成SHA失配。

## 未完成與風險

Apple 4.3風險：**中**。三課保有交通生活特有的平順運送、重新觀察讓行、形色辨識與陪同，沒有增加通用任務、徽章或換數值課程；共用學院與三站外框仍有相似感。這是本機設計評估，不是Apple審核結果。

BLOCKED：實體iPhone／iPad觸控、原生語音需實機；真人親子與遮字辨識需參與家庭；乾淨機效能需獨占硬體；Muse≥8需獨立複審。沒有製作原生簽章包。維持MIT、免費、離線，沒有廣告、內購、外部連結、第三方SDK、帳號或線上功能。全程背景／無頭，瀏覽器與preview依序使用、收尾關閉。

文案mode2：原「到家了，煞車再扶穩」把離灣與送達混在一起，改成階段對應的「坐穩了，按住踏板出灣」「已回主路，按住踏板向前」「到分享站了，按住煞車」；原接近0°仍「快扶正99%」改由同一顯示角度產生狀態與百分比；原路口以問號串缺件改成單一必要行動；車票錯誤改直接說形狀或顏色不同。課名、角色名與保存識別保留。
'''
(ROOT / 'docs/CODEX_RESPONSE_CONTENT_R30.md').write_text(report, encoding='utf-8')
print(json.dumps({k:proof[k] for k in ('status','version','build','tests','reviewImages','cleanup')}, indent=2))
