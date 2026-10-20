"""Read-only sibling comparison. Writes evidence only inside this repository."""
from pathlib import Path
import hashlib
import json
import difflib

ROOT = Path(__file__).resolve().parents[1]
GAMES = {
    'Crackveil Vanguard': 'rift-survivors', '暴風啟示錄': 'storm-apocalypse',
    '灰燼護航': 'doomsday-shooter', '無盡塔防': 'tower-defense',
    '裂潮卡牌': 'skill', '陽光農場': 'pixel-idle-farm-skill',
    '村莊攻防': 'village-siege', '七期：斷鏈行動': 'seven-district-reckoning',
    'Rift Forge 3D': 'rift-forge-3d', '小小列車長': 'taiwan-train-math',
    '夜行列車': '夜行列車_重製企劃_20261002',
    '島嶼飛行學校': 'island-flight-school', '島嶼鐵道學校': 'taiwan-train-school',
}
SKIP = {'.git', 'node_modules', '.godot', 'Library', 'Temp', 'Logs', 'obj', 'bin',
        'dist', 'dist-native', 'docs', 'output', 'release', 'build', 'DerivedData',
        'store', '.audit-tmp', '.secrets', '.gradle', 'Packages', 'ProjectSettings',
        'UserSettings', 'tests', '.claude', '.codex', '.next', 'coverage'}
EXT = {'.js', '.mjs', '.css', '.html', '.png', '.jpg', '.jpeg', '.webp', '.svg',
       '.glb', '.woff', '.woff2', '.ttf', '.otf', '.wav', '.ogg', '.mp3', '.m4a',
       '.gd', '.tscn', '.cs', '.ts', '.tsx', '.jsx', '.uxml', '.uss'}

def files(root):
    import os
    if not root.is_dir(): return
    for parent, dirs, names in os.walk(root, followlinks=False):
        dirs[:] = sorted(d for d in dirs if d not in SKIP and not d.startswith('.') and not Path(parent, d).is_symlink())
        for name in sorted(names):
            p = Path(parent, name)
            if p.suffix.lower() in EXT and not p.is_symlink(): yield p

def digest(p): return hashlib.sha256(p.read_bytes()).hexdigest()
own = {str(p.relative_to(ROOT)).replace('\\', '/'): digest(p) for p in files(ROOT)}
index, siblings, near = {}, [], []
for game, folder in GAMES.items():
    root = ROOT.parent / folder
    count = 0
    for p in files(root):
        count += 1
        relative = str(p.relative_to(root)).replace('\\', '/')
        index.setdefault(digest(p), []).append({'game': game, 'path': relative})
        local = ROOT / relative
        if relative.startswith('src/') and p.suffix in {'.js', '.css'} and local.is_file() and p.stat().st_size < 180000:
            a, b = local.read_text(encoding='utf-8', errors='replace'), p.read_text(encoding='utf-8', errors='replace')
            if a != b:
                score = difflib.SequenceMatcher(None, a, b, autojunk=True).ratio()
                if score >= .8: near.append({'file':relative,'game':game,'path':relative,'similarity':round(score,4)})
    siblings.append({'game':game,'folder':folder,'runtimeFiles':count,'exists':root.is_dir()})
duplicates = [{'file':path,'sha256':sha,'matches':index[sha]} for path, sha in own.items() if sha in index]
report = {'status':'EXECUTED','version':'2.6.0','method':'SHA-256 exact bytes plus same-relative-source text similarity >= 0.8; no sibling writes',
          'concurrentSnapshot':True,'scannedOwnFiles':len(own),'siblings':siblings,'duplicates':duplicates,'nearDuplicates':near}
out = ROOT / 'docs/store'; out.mkdir(parents=True, exist_ok=True)
(out / 'shared-assets.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
lines = ['# 共用素材與程式稽核', '', '2026-10-15。狀態：EXECUTED。這是其他線路仍在修改時的唯讀快照，不是最終二進位比對。', '',
         '範圍：runtime 原始碼、圖片、模型、音訊、字型與原生圖示／載入圖。排除套件、建置產物、文件、測試與秘密目錄；沒有讀取憑證。完整數據見 `shared-assets.json`，可用 `python scripts/audit-store-assets.py` 重現。', '',
         '## 視覺與操作處理', '',
         '- 新增 `src/shared/safety-*`：本作專屬觀察簿，三種運輸系統的條件操作與逐站存檔；不是數學問答或換皮列車。',
         '- `index.html`、`src/home.css`：首頁直接呈現第一課，路線簿色彩與方角按鈕；移除英文裝飾。',
         '- 汽車／火車／飛機入口：統一交通學院課程名稱，去除退役拆分產品的標題與英文暫停字。',
         '- 原生圖示使用 TransportIconV2／ic_transport_v2，Splash 已開圖檢查確認是本作三交通工具標記，並非 Capacitor 預設圖示。舊 AppIcon／ic_launcher 是未選用的歷史資產；未宣稱刪除或重製。',
         '- 第三方標準元件：Three.js、Capacitor 及 App／Preferences／Motion／本機 TTS 橋接、Vite、Barlow Condensed 與系統中文字型。這些不是獨家設計，不把共用第三方框架說成不共用程式。',
         '- 未新增 bitmap、模型或音樂，不冒稱用了 gpt-image-2；新課的進度條／號誌文字是互動 UI。既有 preview 圖有明確沿用關係。',
         '- 已退役的飛行／鐵道拆分作與本作有真實素材及程式來源重疊。保留合併後內容，不藉改檔名、加註解或重編碼掩飾；本 repo 無法撤回另一 App，仍列風險。',
         '- 大廳音樂沿用 R1 本機生成曲。原報告的權利歸屬缺件仍存在，不能憑沒有 hash 重複就聲稱已取得商用法律結論。', '',
         '## 各作品掃描範圍', '', '| 作品 | 目錄 | runtime 檔數 |', '|---|---|---|']
for s in siblings: lines.append(f"| {s['game']} | `{s['folder']}` | {s['runtimeFiles']} |")
lines += ['', '## 完全相同檔案（逐項）', '', '| 本作檔案 | SHA-256 | 與哪款／檔案重複 | 處理方式 |', '|---|---|---|---|']
for d in duplicates:
    for m in d['matches']:
        treatment = '標準 Capacitor/Cordova 空相容檔，非遊戲內容；保留' if 'cordova' in d['file'] else ('標準原生資源／第三方圖示殘檔，保留並揭露' if any(x in d['file'] for x in ['ic_launcher','AppIcon','gradle']) else ('退役拆分作來源，合併保留；不再拆成新 App' if '學校' in m['game'] else '來源重疊保留揭露；須由帳號總稽核確認是否共用必要，未假稱已替換'))
        lines.append(f"| `{d['file']}` | `{d['sha256']}` | {m['game']}：`{m['path']}` | {treatment} |")
if not duplicates: lines.append('| 無 | — | 指定快照範圍內無 exact match | 不代表無相似設計 |')
lines += ['', '## 相似但不同的原始碼', '', '| 本作檔案 | 作品 | 文字相似度 | 處理方式 |', '|---|---|---|---|']
for n in near: lines.append(f"| `{n['file']}` | {n['game']} | {n['similarity']:.1%} | 合併來源／共用功能需揭露；本作新觀察課與首頁已獨立，未稱整體程式皆獨創 |")
lines += ['', '## 限制', '', 'SHA-256 只能證實位元組相同，無命中不能證明美術、玩法或生成模板不同。相似度僅補充同相對路徑的 JS／CSS，不能代替法律或 Apple 判定。夜行列車若目錄只有重製企劃而無 runtime，不能當作完成該作執行檔比較。其他線路完成後須以最終簽章包重驗。']
(out / 'SHARED_ASSETS_AUDIT.md').write_text('\n'.join(lines)+'\n',encoding='utf-8')
print(json.dumps({'own':len(own),'exactFiles':len(duplicates),'matches':sum(len(d['matches']) for d in duplicates),'similarSources':len(near),'siblings':len(siblings)},ensure_ascii=False))
