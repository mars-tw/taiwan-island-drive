"""Assemble the closeout from verified local receipts and direct image notes."""
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'docs/content/r37'
def read(name):return json.loads((OUT/name).read_text(encoding='utf8'))
inspection=read('review-inspection.json');review=read('review-set.json');perf=read('performance/performance.json')
old=read('cleanup-result.json');temp=read('intermediate-cleanup.json');manual=read('manual-intermediate-cleanup.json');scan=read('secret-scan.json')
count=old['deletedFiles']+temp['deletedFiles']+manual['deletedFiles'];space=old['releasedBytes']+temp['releasedBytes']+manual['releasedBytes']
unique=len({r['path'] for receipt in (old,temp,manual) for r in receipt['files']})
timings='；'.join(f"{r['w']}×{r['h']}：{r['p95']:.1f} ms" for r in perf['rows'])
table='\n'.join(f"| {r['number']:02d} | [{Path(r['path']).name}]({r['path'].removeprefix('docs/')}) | {r['result']} | {r['r35Difference']} |" for r in inspection['shots'])
text=f'''# 新內容第37輪交付

VERIFIED：僅在 `r1-fun-polish` 工作；工單2026-10-18，執行2026-10-21。版本 **2.47.2／原生來源build45**。本輪完成本線兩項必修：未觀察的主道路不露出來車、主車全程保持同一深藍原圖及身份。蛋糕與車票保留R35。不是五項Muse建議全部通過；未完成處在下表逐項列明。

全程本機、背景／無頭、靜音，沒有外部派工、push、部署、商店後台或對外訊息。MIT、免費、離線；沒有新增廣告、內購、外鏈、帳號或SDK。未切換或合併main。

## 三課入口與玩法

共同入口：**首頁→海岸實作課→選課→選站→自己試試／一起出發**。

- **把蛋糕平穩送到**：沿用R35踩踏板、看彎向轉彎、反向推扶及煞車救回，三站後分享蛋糕。沒有改玩法、素材、提示、控制或版面。精選01～05是錯扶、加劇、救回、反方向傾斜及真正送達。
- **路口停看等**：停穩後看左右、等朋友到岸、新車來重看再出發。主道路與小窗共用observed；未看側有視線遮罩且沒有可見來車，人物在遮罩前方。主車固定 `alu-deep-blue-r11`、`art/content-r11/car-rear.png`，附跟車「你」標記；出發連續前進、縮小及旋轉接入既有下方靠右車道。朋友腳下進度來自實際過街時間，計數只在到岸增加。精選06、07證明主場景同步，08～10為同次出發連拍。
- **形狀車票，找對月台**：沿用R35形色配對、逐人邀請、按住站穩、放開保留進度、走到座位、收踏階、關門出發。沒有改任何車票版面。精選11、12是兩種錯配，13、14是按住／放開，15補齊關門與3/3出發。

## Muse五項驗收與本線限制

| 項目 | 狀態、結果與原尺寸證據 |
|---|---|
| 1 傾斜與扶正因果線 | **BLOCKED**：本線明令蛋糕回R35且不得改動。01～04仍有托盤分離感、方向依賴亮鍵及六鍵負擔，沒有假稱3秒兒童辨識測試通過。[01](content/r37/review-set/01-cake-wrong-support.png)、[04](content/r37/review-set/04-cake-stage-2-tray-edge.png)。 |
| 2 主場景全景洩漏 | **VERIFIED**：未看兩側時主道路可見來車0；只看右時左主道路仍遮住，小窗一致。三站×左右換邊均由真實按鈕操作驗證；看移動中／暫停不會提前透露。[06](content/r37/review-set/06-crossing-stage-2-unobserved.png)、[07](content/r37/review-set/07-crossing-stage-2-only-source-main.png)。 |
| 3 等待進度、連續出發 | **VERIFIED（連續性）／BLOCKED（原文直行）**：補進度條並保留同車連續位置；原畫是T字路口，本線要求沿用R35，採連續右轉接下方車道，未捏造直行出口。精選08～10同次連拍；朋友近岸／中段／到岸三格見下方補充。不能宣稱逐字符合「直行穿過」的驗收。 |
| 4 車票／月台欄標 | **BLOCKED**：本線明令車票回R35且不得改動。錯形／錯色原有教學可玩，但兩欄身份標籤未加。[11](content/r37/review-set/11-tickets-stage-3-wrong-shape.png)、[12](content/r37/review-set/12-tickets-stage-3-wrong-color.png)。 |
| 5 車票版面與最後一步 | **VERIFIED（結尾證據）／BLOCKED（版面）**：補出關門、3/3入座及出發；原有燈塔殘塊、綠票圖示位置、雙圈與暫停不顯示44%數字仍在，依本線限制未改。[13](content/r37/review-set/13-tickets-stage-3-hold-half-0.png)、[14](content/r37/review-set/14-tickets-stage-3-hold-paused-0.png)、[15](content/r37/review-set/15-tickets-stage-3-closed-departing.png)。 |

Claude兩項必修另有新增單元與瀏覽器斷言：未觀察來源主車道不顯示來車；三站、六種seed及playing/departing/checkpoint/done的主車appearance id與原圖不變。出發途中旋轉後的外框也須落在既有車道內。沒有刪除或放寬既有測試。

另由實際操作驗證：路口玩到一半回學院，再進蛋糕或車票，不會帶入遮罩、過街進度或「你」標籤。守門結果在`content/r37/switching/browser-switching.json`。

## 測試與證據

| 檢查 | 結果 |
|---|---|
| 清理後 `npm test` | VERIFIED，342／342；338項既有測試保留，新增4項R37測試。 |
| 清理後 `npm run build` | VERIFIED，265個離線precache檔；版本2.47.2，來源build45。未建置或安裝原生App。 |
| `node scripts/check-content-r37.mjs`（另提供npm別名test:content:r37） | VERIFIED，正常入口三課各三站、重載後snapshot一致、contentVersion=33、visited=[0,1,2]及重玩；路口左右換邊實際走完。原始擷取271張，已精選並清掉中間圖。 |
| 離線 | VERIFIED，安裝SW後切offline重載，再完成三課三站及存檔重載；0外部請求、0runtime error。 |
| 版面 | VERIFIED，320×568、568×320、390×844、844×390、768×1024、1024×768、1366×600、1280×640；控制命中≥60px、可達、文字不裁切，手機無鍵盤說明。 |
| 清理後 `npm run test:merge`（5286） | VERIFIED，132 integration checks。 |
| 清理後 `npm run test:store`（5113） | VERIFIED，101 checks。 |
| 音訊 | VERIFIED，所有瀏覽器headless＋--mute-audio，CPU繪圖；speech/media測試攔截實際播放並讀取speaking、pending及媒體狀態。沒有喇叭播放、提示音、朗讀或通知音。未進行聽音品質判定。 |
| 效能 | VERIFIED（並發載參考），三跑中位：{timings}。每跑保留p95/max，沒有藏掉個別較慢樣本；乾淨機況結果BLOCKED。 |
| 秘密掃描 | VERIFIED，0命中；掃描檔數與範圍見secret-scan.json，沒有讀取.secrets或寫入金鑰。 |

合併與商店回歸沿用R35靜音CPU launcher及既有同步快轉繪圖合併wrapper，物理／world更新和原有斷言不變。瀏覽器用完即關；5286與5113依序執行，同時只開一個本線preview。

主要讀回檔：`content/r37/browser-all.json`、`layout/browser-layout.json`、`offline/browser-offline.json`、`serial-checks.json`、`merge-output.txt`、`store-regression-output.txt`、`unit-tests.txt`、`build.txt`及`verification.json`（均位於content/r37）。保留下來的每張證據都核對原尺寸與SHA-256。

## 精選15張逐張檢視與R35差異

**每張均已用view_image直接開原圖檢視。這是同一執行者的自檢，不是獨立Muse複審。** 全部390×844，逐位元複製原擷取，每課5張。manifest在`content/r37/review-set.json`，逐張紀錄在`review-inspection.json`，R35量測在`r35-comparison.json`。

R35比較使用Git基準db8bbe9的獨立本機建置；04使用保留的R35歷史原尺寸同操作證據。相同操作的導航／RAF起始相位仍有小幅擷取幀差，原始像素數與狀態差值完整記錄；沒有宣稱像素或所有幀數值完全一致。蛋糕／車票主要實作檔逐位元等於R35，且新增測試確認輸出函式是同一個函式物件；可見文字相同。

| 圖 | 原尺寸路徑 | 直接檢視結果 | 與R35逐張差異 |
|---|---|---|---|
{table}

## 精選外補充證據與限制

15張上限下，每課平均5張；本輪優先給路口兩項必修與同車出發三連拍，沒有把更多圖片塞入review-set。審查員只看精選，因此下列補充不冒稱已被審查員看到。

- 阿嬤前段／中段／到岸：[前段](content/r37/phone-crossing-grandma-front.png)→[中段](content/r37/phone-crossing-grandma-middle.png)→[到岸](content/r37/phone-crossing-grandma-arrived.png)。三張均無放大窗遮擋，前兩張0/3，到岸才1/3；進度條在名牌下方，狀態及雜湊另見walk-evidence.json。
- 三站與換邊：`content/r37/phone-crossing[-mirror]-stage-[1-3]-unobserved.png`、`only-source-main.png`及`finished.png`；同資料夾的`new-car-yields`、`clear-needs-recheck`、`recheck-restored`補新車後重看。
- 車票其餘兩人：`content/r37/phone-tickets-stage-3-hold-half-1.png`、`walking-1.png`、`seated-2.png`及`hold-half-2.png`、`walking-2.png`、`seated-3.png`；均由實際觸控流程擷取。
- 三課重載、完成及離線完成的原尺寸圖與snapshot在browser manifests中。存檔正常由程式讀回證明；不把單張截圖當作重載或離線本身的證據。

## 商店、美術與文案

新增商店截圖：[1290×2796](store/screenshots/content-r37/crossing-observation-1290x2796.png)、[2064×2752](store/screenshots/content-r37/crossing-observation-2064x2752.png)。皆為無頭實際遊戲原尺寸擷取，沒有縮放、拼貼或刪除既有商店圖。

新增生成美術 **0張**；沿用R35／R24／R29受管繪本原畫，不需要產圖呼叫。實際工具欄為null，既有素材SHA與零生成聲明在`content/r37/art-manifest.json`。視線斜紋、過街進度線及「你」是介面符號，沒有用色塊冒充角色、車輛或場景。動作仍是既有姿勢及2D原圖的連續投影，未新增或宣稱骨架、3D物理。

繁中文案依speak-human-tw mode 2直接套用：原本沒有玩家身份標示→新增「你」，原因是出發時要辨認同一台車；「看左邊／看右邊」沿用既有動詞。蛋糕、車票文案未動。

## 清理與保留

VERIFIED：舊重複回歸圖刪除 **{old['deletedFiles']}檔／{old['releasedBytes']:,} bytes**；本輪中間擷取、失敗測試圖及R35參考建置累計刪除 **{temp['deletedFiles']}次／{temp['releasedBytes']:,} bytes**；更換精選及移除被取代紀錄時刪除{manual['deletedFiles']}檔／{manual['releasedBytes']:,} bytes。合計 **{unique}個不同路徑、{count}次刪除，邏輯容量累計{space:,} bytes（{space/1024/1024:.2f} MiB）**。測試重跑會再生部分中間圖，以上是各次刪除事件累計，不代表磁碟淨變化；Git歷史物件未清理。

清理計畫與逐檔雜湊在`cleanup-plan.json`，結果在`cleanup-result.json`、`intermediate-cleanup.json`及`manual-intermediate-cleanup.json`（均位於content/r37）。刪前核對repo絕對路徑、分支、追蹤／未修改狀態及SHA；未刪既有untracked檔或他人修改。早期Vite重建自動清掉的另一份暫時參考建置沒有先量測，未計入以上檔數／空間。

舊媒體保留{old['retainedFiles']:,}檔，原因逐檔列於計畫：原始美術／來源契約、歷史驗證腳本會讀取並驗SHA的browser/review manifests，或明確測試輸入；沒有以「可能有用」無限保留。各輪Markdown與審查意見、全部既有商店截圖保留。本輪保留精選、對應原圖、必要補充及驗證讀取檔，其餘擷取已刪。沒有建立備份、ZIP或匯出包；沒有在.audit-tmp、tmp或系統暫存手動建立檔案，Chromium暫時設定檔由browser.close清除。

舊證據與本輪中間檔清理後，重新執行npm test、build、test:merge與test:store，結果如上。沒有以刪測試或放寬斷言換取通過。

## 風險與缺件

**Apple 4.3風險：中**。三課的交通互動不同，但共用外框、蛋糕／車票的既有版面與教學問題仍在。這是本機內容同質性自評，不是Apple審核結論。

BLOCKED：Muse獨立複評及是否達8分、實體iPhone／iPad觸控、真人親子3秒方向理解、乾淨機況效能、實際語音音質。需要另行安排裝置、家長／孩子與審查；沒有以本機截圖假造完成。Muse第1、4、5項改版受本線「蛋糕／車票不得改動」限制，若要處理需後續明確解除該範圍限制。第3項的字面直行驗收也未宣稱通過。
'''
(ROOT/'docs/CODEX_RESPONSE_CONTENT_R37.md').write_text(text,encoding='utf8')
print('EXECUTED Traditional Chinese R37 closeout with 15 direct inspection rows')
