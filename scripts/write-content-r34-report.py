"""Render the Traditional Chinese delivery report from verified local receipts."""
import json
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'docs/content/r34'
read = lambda p: json.loads((ROOT / p).read_text(encoding='utf-8'))
r = read('docs/content/r34/release-verification.json')
inspection = read('docs/content/r34/review-inspection.json')
cleanup = read('docs/content/r34/cleanup-result.json')
intermediate = read('docs/content/r34/intermediate-cleanup-result.json')
perf = read('docs/content/r34/performance/performance.json')
outliers = [f"{row['w']}×{row['h']}第{i+1}跑p95為{run['p95']:.1f}ms" for row in perf['rows'] for i, run in enumerate(row['runs']) if run['p95'] > 18]
perf_note = '；'.join(outliers) + '，不能宣稱每一跑都低於18ms。' if outliers else '本次九跑p95均不超過18ms。'
table = '\n'.join(f"| {i:02d} | [{Path(x['path']).name}]({x['path'].removeprefix('docs/')}) | {x['result']} |" for i, x in enumerate(inspection['rows'], 1))
text = f'''# 新內容第34輪交付

VERIFIED：工單日期2026-10-18，實作日期2026-10-21。限定 `r1-fun-polish`，版本 **2.46.0／原生來源build42**。本輪功能修改限於路口靠右行駛、完成頁單一背景，以及修正車道後連帶出現的等候者遮擋。蛋糕與車票沿用既有操作及畫面，以實玩回歸與補證據交付；未加新互動。儲存協定仍為 `contentVersion=33`，不因應用程式版本增加而重置孩子進度。

全程背景／無頭、本機執行；無派工、push、部署、商店操作或對外發訊息。MIT、免費、離線，沒有新增廣告、內購、帳號、外部連結或第三方SDK。

## 三課：怎麼玩與入口

共同入口：**首頁→海岸實作課→選課→選站→自己試試／一起出發**。

- **把蛋糕平穩送到**：踏板起步、看彎道轉向，蛋糕歪了用煞車及反向扶正救回，第三站停穩再離灣。本輪不改既有平衡與回饋；精選01→02→03是同次實玩錯扶、托盤邊、救回，04補第二站雙彎，05補第三站主路。
- **路口停看等**：先停車，看左右，等朋友過完，再出發。現在所有站次與換邊重玩都以「下方車道左→右、上方車道右→左」投影，停讓不換車道；觀察窗、停止線、車頭方向共用同一來車資料。主車右轉及箭頭也進入下方車道，依實際車道寬度和轉角校正大小，完整車身不得跨中線。新車取消該側確認、未就緒按出發主車不動，原因具名。等候者畫在來車前景，車不再蓋住臉。結尾保留既有完整合照，覆蓋整個場景內框、隱藏原路口背景，只剩一個完整背景。
- **形狀車票，找對月台**：看票的形狀及顏色選月台，停穩開門、邀朋友、陪走，放開等站穩後繼續，屈膝坐好才加人數。兩處站穩門檻維持 **0.65秒**。本輪不改節奏、站姿或分屏；補第二／三站形色錯誤與上車途中、坐姿證據。

## Muse五項清單與本次限縮

本線路末段明確要求只修兩個嚴重問題與小問題、不加互動、不改已通過畫面，因此以下逐項交代，**沒有宣稱Muse五項全部完成或複審已達8分**。

| 項目 | 狀態與驗收證據 |
|---|---|
| 1 扶正方向不用猜 | VERIFIED既有三態證據：精選01／02／03，分別50%／4%／100%，直接看主場景托盤與蛋糕。PREPARED：紅色邊緣提示及手推底座新鈕面未實作，留待另輪授權，未稱已修。 |
| 2 第二站及邊界 | VERIFIED精選04第二站雙彎，完整原圖 `content/r34/phone-cake-stage-2-bend--1.png`、`phone-cake-stage-2-bend-1.png`；重玩入口 `phone-cake-replay-opening.png`。托盤邊仍可反扶救回，沒有淘汰。PREPARED：護網、歸零新規則及重玩雙彎反向傾斜三連拍未新增，未宣稱已驗。 |
| 3 觀察與出發受阻 | VERIFIED精選06→07→08為同次第二站新車取消左勾、實按出發被具名擋下、車過後看左恢復勾；09補主車完整右轉進入下方車道。上方反向來車原圖 `content/r34/phone-crossing-mirror-stage-1-car-approach.png`。三站原版／鏡像各有接近、通過、離開、停讓、重看及完整右轉的原尺寸證據。 |
| 4 分屏及重複節奏 | VERIFIED精選11第二站錯形、12第三站錯色，13→14早按／站穩，15三席坐姿；另有 `phone-tickets-stage-2-wrong-color.png`、`phone-tickets-stage-3-wrong-shape.png`。PREPARED：下層等候人影仍半透明、每人仍兩處停等，未新增座位辨向操作，未稱這兩點已修。 |
| 5 均勻矩陣與背景 | VERIFIED `content/r34/review-set/` 正好15張、每課5張、390×844逐位元原圖副本；來源及SHA在 `review-set.json`。精選10證明單背景。15張按主操作、錯誤、回復、站次差異與完成取捨，未納入的細節保留完整原圖，未把15張冒稱涵蓋所有站次的所有幀。 |

## 15張精選逐張檢視

由Codex直接顯示原尺寸圖逐張目視；此為自審，並非Muse或Claude獨立覆核。特別核對車道與車頭、背景接縫、角色遮擋及文字一致性，發現的既有小問題也照實保留記錄。

| 圖 | 原尺寸截圖路徑 | 目視結果 |
|---|---|---|
{table}

## 自動測試與證據

VERIFIED：清理舊輪副本後，`npm test` **{r['unitTests']}/{r['unitTests']}**、`npm run build`、5286 `npm run test:merge` **{r['regressions']['merge']}項**、5113 `npm run test:store` **{r['regressions']['store-regression']}項**全部通過。{r['existingTestsUnchanged']}個既有測試檔逐位元未改；只新增本輪測試，沒有刪測試或放寬既有斷言。

新增單元測試遍查72個來車投影組合：三站、兩種來向配置、原車／新車、六個時刻，核對靠右行駛、車頭、道路上下界及停止線；另驗證各站／重玩時未就緒出發具名且主車投影不動。無頭實玩測試只操作公開控制與推進時鐘，不寫入遊戲狀態。實際玩完三課九站、完成存檔並重載精確比對，路口另完整換邊重玩；離線service worker重載後再次完成九站。

主車入道原尺寸三連拍：`content/r34/phone-crossing-stage-2-turning-right.png` → `phone-crossing-stage-2-departing.png` → `phone-crossing-stage-2-joined-right-lane.png`。八視口另各有 `device-WxH-stage-N-right-turn-lower-lane.png`，N=1、2、3，實際圖檔路徑與完整車身外框在layout清冊；轉入後使用既有同款藍車側視圖，沒有把車尾圖旋轉成側翻姿態。

三課內容驗證共 **{r['rawImages']}張原尺寸截圖**，各檔SHA、可達性、文字裁切與路口幾何在 `content/r34/browser-all.json`、`layout/browser-layout.json`、`offline/browser-offline.json`、`store/browser-store.json`。八視口320×568、568×320、390×844、844×390、768×1024、1024×768、1366×600、1280×640通過，包含每個視口實際完成路口三站、主車完整外框留在下方車道及單背景完成頁；控制至少60px、裁切0、手機鍵盤說明0、外部請求0、執行錯誤0。

所有本輪最終瀏覽器測試使用 `scripts/playwright-cpu-r34.mjs`（回歸另包一層提供畫面同步及失敗現場的 `playwright-regression-r34.mjs`）：強制headless、停用實體GPU並使用SwiftShader，保留GPU給H3產線；既有回歸腳本的斷言未改。並發工作站RAF參考，手機／iPad／桌機各三跑180幀，p95中位 **{'／'.join(str(round(v, 2)) for v in r['p95'])}ms**，狀態 **{r['performanceStatus']}**。{perf_note}詳細各跑在 `performance/performance.json`。這是軟體渲染下的瀏覽器參考值，不是乾淨機或實機效能。

主線回歸前兩次在CPU加速繪製後的可見性檢查逾時，`merge-second-failure.json`證明當時公路已跑到360.13m、phase已finished、下一章按鈕文字已建立，沒有WebGL斷線。測試驅動層在原本的加速 `g.frame` 呼叫後等待兩次原生RAF呈現畫面，才開始原有可見性檢查；未改遊戲、完成旗標、原有15秒斷言或任何既有測試。失敗記錄保留，不以個別診斷成功冒稱整體通過。

另一次離線截圖寫入遇到ENOSPC而中止；後續讀回C槽已有約30GB可用，恢復來源未判定。本輪只清理已被取代的自身產物，沒有刪其他產線或既有未追蹤檔。最終版本重新完整跑測試，未以中止結果作通過證據，事件記在 `disk-space-event.json`。

版本來源、原生來源build、截圖SHA與存檔證據由 `scripts/verify-content-r34.py` 讀回；現行版本來源不殘留2.45.0，歷史Markdown與驗證腳本保留原版本記錄。秘密掃描0命中，未讀取任何秘密目錄。

## 美術、商店與清理

新增美術 **0張／產圖呼叫0次**。沿用既有海岸繪本、來車、三站路口與完成合照；只改同一場景的車道投影與完整背景顯示方式。本輪涉及的受管原畫及SHA列在 `content/r34/art-manifest.json`。沒有新增骨架動畫、3D物理或角色；蛋糕及主車右轉仍為2D即時投影，人物仍為既有姿勢圖。

新增商店原圖 `store/screenshots/content-r34/crossing-right-hand-lanes-1290x2796.png` 與 `crossing-right-hand-lanes-2064x2752.png`，分別由430×932／DPR3與1032×1376／DPR2直接實玩擷取。完整畫面展示下方左來右行車道與路口課控制，不是縮放拼貼，也不是實體裝置測試。全部既有商店截圖保留。

EXECUTED：刪除 **{cleanup['deletedFiles']}個**已追蹤且乾淨的舊回歸截圖副本，釋出 **{cleanup['releasedBytes']:,} bytes（{cleanup['releasedBytes']/1048576:.2f} MiB）**。絕對根、分支、逐檔SHA與結果在 `cleanup-plan.json`／`cleanup-result.json`。保留 **{len(cleanup['retained'])}個**原畫或歷史驗證輸入，逐檔列明reason／readers；R33精選副本仍被其歷史檢查腳本讀取，因此依工單例外保留。沒有刪除Markdown評審、現行商店素材或腳本輸入，未重寫Git歷史，釋出量指工作目錄、不代表Git物件庫縮小。

另刪除本輪已取代的失敗診斷產物 **{intermediate['deletedFiles']}個／{intermediate['releasedBytes']:,} bytes**，見 `intermediate-cleanup-result.json`。接手前 **{r['preexistingUntrackedUnchanged']}個未追蹤檔**全部保留且SHA未變。

## 未完成、文案與Apple 4.3風險

Apple 4.3風險 **中**：三課以交通生活的平衡、停看等與形色辨識為主，未加通用任務、徽章、抽卡或商業化功能；學院選單與三站結構仍有共通感。此為本機產品自評，不代表Apple審核結論。

BLOCKED：實體iPhone／iPad觸控與原生語音需要測試裝置及原生環境；真人親子試玩需要家長與兒童；乾淨機效能需要沒有其他產線負載的機況；Muse複審8分需要獨立評審只看本輪精選集。均未假造完成。

PREPARED：本次限縮未做的扶正鈕重繪／危險邊警示、歸零新結果、車票不透明等候與減少停等，及既有停住後泛用提示／離灣後課程站名，已逐項留明，不冒稱全部審查問題消失。

本輪1處圖片替代文字調整：原句「阿路的車尾朝玩家，車頭朝路口」；原因是轉入主路後已換為既有側視圖，舊描述不符畫面；改成「阿路右轉後在下方車道向右前進」。停等時仍沿用原句，操作鈕與主要提示未改寫。
'''
(ROOT / 'docs/CODEX_RESPONSE_CONTENT_R34.md').write_text(text, encoding='utf-8')
print('VERIFIED report rendered from release receipts and actual visual inspection')
