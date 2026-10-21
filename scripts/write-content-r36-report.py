"""Write the Traditional Chinese delivery from verified readback receipts."""
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'docs/content/r36'
def read(name):return json.loads((OUT/name).read_text(encoding='utf-8'))
v=read('release-verification.json');assert v['status']=='VERIFIED'
inspection=read('review-inspection.json');comparison=read('r35-comparison.json');perf=read('performance/performance.json')
table='\n'.join(f"| {i:02d} | [{Path(r['path']).name}]({r['path'][5:]}) | {r['inspection']} |" for i,r in enumerate(inspection['rows'],1))
performance='\n'.join(f"| {r['w']}×{r['h']} | "+'／'.join(f"{x['p95']:.1f}" for x in r['runs'])+f" | {r['p95']:.1f} ms |" for r in perf['rows'])
max_pixels=max(r['outsideMaskPixelDifferences'] for r in comparison['rows']);max_delta=max(r['outsideMaskMaxChannelDelta'] for r in comparison['rows'])
elements=sum(r['comparedElements'] for r in comparison['rows'])
text=f'''# 新內容第36輪交付

VERIFIED：工單2026-10-18，執行2026-10-21；僅在 `r1-fun-polish` 工作，版本 **2.47.1／原生來源 build44**。本輪唯一功能修正是「尚未觀察的方向不得先公布路況」。沒有改動其餘R35玩法、美術、站名、提示或版面。存檔協定維持 `contentVersion=33`，已完成進度不重置。

本線最後的「只修以下一項」優先於共用五項改版清單。已讀R35 Muse、Claude審查與最近交付；Muse其餘托盤警示、路口構圖、路線進度、上車呈現等建議依本線限制保留，不把這次窄修宣稱為五項重新設計全部完成。車票既有形色配對只補入精選證據。

## 三課入口與操作

共同入口：**首頁→海岸實作課→選課→選站→自己試試／一起出發**。

- **把蛋糕平穩送到**：沿用R35踩踏板、轉彎、反向推扶與煞車救回。三站可完成並儲存，沒有掉落、淘汰、競速或計時懲罰。精選01～05呈現錯扶加劇、救回與不同站景。
- **路口停看等**：停穩、看左右、等三位朋友到岸、新來車後重看，再出發。未看側只顯示「還沒看」，遮住道路與車圖；看過才顯示原有淨空、車輛接近或線前等待。有車側仍沒有安全勾。左右對稱，三站與換邊重玩都適用。精選06～10。
- **形狀車票，找對月台**：沿用R35形狀與顏色雙線索配對、邀請、按住站穩、放開凍結、走入座位、收踏階及關門出發。精選11、12補入既有錯形／錯色決策；13、14連續呈現按住與暫停；15三人入座。

## 唯一修正與自動驗收

`content-r31-scene.js`的單一不可變投影新增 `observed`：只依實際查看紀錄，未看時不提供車圖、路況結論或安全勾。`content-r32-scene.js`保留這個界線，不再覆寫成淨空。UI直接讀投影，未看縮圖不繪道路背景與標線。`content-r31.js`在朋友到岸時保留同站查看紀錄；新車的重看、停等、到岸與出發條件皆沿用R35。

在原有單一來源／文字一致性測試檔補強1項測試，涵蓋4層投影×3站×2種原向／換邊×2個先看方向，共48組，另逐組檢查移動中、暫停時不能偷看。未觀察側的文字不得含淨空、有車、來車、接近、通過、離開、停在線前、讓行或安全勾。沒有刪除原測試或放寬原斷言。

瀏覽器每張擷取也驗證未看側：只有還沒看、車圖數0、無道路背景、無標線、無安全勾。正常按鈕可真正完成三課九站、精確重載完成存檔並重玩；只推進時鐘，沒有寫入遊戲狀態。路口另完整換邊三站；離線service worker重載後再完成九站。

## 15張手機原尺寸精選：逐張檢查

VERIFIED：`docs/content/r36/review-set/` **正好15張390×844原圖副本，每課5張**。Codex已逐張直接顯示原尺寸檢視，原圖、來源、SHA與筆記在 `review-set.json`、`review-inspection.json`。沒有縮放、拼貼、標註或圖片後製。這是執行線自審，不是Muse評分。

| 圖 | 原尺寸路徑 | 逐張檢查結果 |
|---|---|---|
{table}

01→02→03是同次錯扶與救回；06→07是同站尚未看與只看右邊；08→09是同次等待阿嬤移動；13→14是同位朋友按住與放開。其餘時序、存檔與離線結論依程式收據，不把靜態圖當作獨立實機證明。

## 與R35相比的變更界線

除版本更新、測試靜音與交付工具外，產品只改5個路口觀察狀態／投影／遮蔽來源。其餘 **{v['unchangedExistingSources']}個既有來源雜湊未變**，角色、背景、車票、蛋糕與手勢原畫皆未改。

另從Git直接讀取R35基準 `db8bbe9` 的5個原始檔，建立臨時參考版本；沒有切換分支或改寫工作樹，兩版的必要版本標籤統一為R36。固定時鐘、相同公開操作、15組三課狀態對照，共{elements}個可見元素，排除本次未看縮圖後，文字、圖源、位置與35項computed style完全相同，遊戲狀態差異0。這項呈現比對另用擷取時停動畫，不作為核心實玩證據；精選集來自正常動畫的完整實玩。

RGB原圖仍有合成圓角／文字邊緣色差，遮蔽區外最多{max_pixels}個像素、最大單通道差{max_delta}/255。{comparison['exactImages']}組RGB像素完全相同，其餘差異完整記在 `r35-comparison.json`，沒有宣稱15組逐像素完全相同。原始像素實驗與參考建置完成後依工單清掉中間物；保留SHA、量測與完全相同的呈現指紋。綜合來源界線、15張人工檢視及15組呈現驗證，確認沒有其餘設計或版面改動。

## 清理後完整測試

VERIFIED：`npm test` **338/338**、`npm run build`、5286 `npm run test:merge` **132項**、5113 `npm run test:store` **101項**全綠。舊媒體與本輪中間物刪除後重跑這四項，沒有以刪測試換取通過。既有merge／store腳本的斷言逐字保留，只加靜音旗標。

內容測試共 **564張原尺寸擷取**，檢查控制≥60px、中心可點、文字不裁切及手機沒有鍵盤說明；執行錯誤與外部請求0。包含320×568、568×320、390×844、844×390、768×1024、1024×768、1366×600、1280×640八視口。清理後只留精選來源、必要狀態矩陣、各視口遊玩圖、離線完成及商店圖；原擷取數與清理前驗證收據保留在各scope的browser JSON。

全程headless、`--mute-audio --disable-gpu --use-angle=swiftshader`，沒有可見視窗或實體GPU渲染；一次只用一個preview與一個測試瀏覽器。最終測試啟動前攔截語音與媒體播放，僅記錄呼叫與音訊狀態，未實際朗讀或從喇叭播放。音效品質與原生語音未宣稱通過。3D舊測試沿用R35快速步進時合併重複WebGL提交的驅動器，保留每次物理更新、最後真實繪製及原斷言；本輪沒有改該合併邏輯。

共享機況的RAF參考，每視口3跑×180幀，p95取三跑中位：

| 視口 | 各跑p95（ms） | 中位 |
|---|---|---|
{performance}

三跑中位皆≤18ms；個別跑次33ms以上已列出，不宣稱每跑都達標。乾淨機與實體裝置效能仍BLOCKED。

## 美術、商店與清理收據

新增美術 **0張／生成呼叫0次**，沿用R35受管原畫；`art-manifest.json`如實記錄。遮住未知縮圖是介面狀態，沒有以色塊替代人物、場景或其他美術。

新增路口商店截圖：[1290×2796](store/screenshots/content-r36/crossing-look-before-reveal-1290x2796.png)、[2064×2752](store/screenshots/content-r36/crossing-look-before-reveal-2064x2752.png)，均為實際操作後直接擷取、已目視檢查。左側未看保持遮蔽、右側看過顯示結論，兩種原始尺寸皆驗證。保留所有既有商店圖；這些是無頭瀏覽器擷取，不是實體iPhone／iPad證據。

EXECUTED：刪除已被取代的舊輪截圖 **{v['oldMediaDeleted']}個／{v['oldMediaReleasedBytes']:,} bytes（{v['oldMediaReleasedBytes']/1048576:.2f} MiB）**。只刪乾淨已追蹤檔，清單、SHA、根目錄與分支檢查在 `cleanup-plan.json`、`cleanup-result.json`。保留 **{v['retainedHistoricalInputs']}個原畫或歷史驗證輸入**，每檔都有reason／readers；例如R35 review-set及原圖仍由歷史驗證器讀回雜湊，不能刪掉。

EXECUTED：清除本輪中間截圖、臨時參考建置與重複資料 **{v['intermediatesDeleted']}個／{v['intermediateReleasedBytes']:,} bytes（{v['intermediateReleasedBytes']/1048576:.2f} MiB）**；收據在 `intermediate-cleanup-plan.json`、`intermediate-cleanup-result.json`。沒有建立備份資料夾、匯出包或自有系統暫存檔；未掃除其他線路的共用TEMP，瀏覽器用後均關閉。主建置為回歸測試輸入保留。這些數字是工作目錄釋出量，不是Git物件庫縮減。

接手前 **{v['preservedPreexistingUntracked']}個未追蹤檔全部SHA未變**，各輪Markdown審查與交付報告皆保留。秘密掃描0命中，沒有讀取秘密目錄或寫入金鑰。現行版本欄位不殘留2.47.0；歷史報告與參考版本說明保留舊版本紀錄。

## 文案與未完成項目

依共用核心與「說人話」mode 2直接套用；本次只修1種文案狀態，左右共用，不改已觀察的原句。

| 原句 | 原因 | 改成什麼 |
|---|---|---|
| 未看時「左邊・路面淨空」或「右邊・車正在接近」，同格又顯示還沒看 | 先公布答案，與觀察狀態矛盾 | 未看只顯示方向＋還沒看，遮住小圖；實際看過才恢復原有路況結論 |

Apple 4.3風險 **中（產品自評）**：本次是同一作品的小修正，保留交通生活的三種不同操作，沒有擴增Bundle ID；課程外框與R35既有呈現疑慮仍存在。2026-10-21查閱 [Apple官方4.3準則](https://developer.apple.com/app-store/review/guidelines/#spam)，其關注重複App及與既有大量App無法區分的內容。本風險屬執行線依產品作出的推論，不是Apple審核結論。

BLOCKED：實體iPhone／iPad觸控與原生語音需裝置及原生環境；真人親子試玩需家長與兒童；乾淨機效能需獨占機況；Muse≥8分需獨立評審僅看本輪15張精選。沒有假造上述完成或評分。R35其他美術／版面建議依本線範圍保留，未冒稱已修。

VERIFIED：本機驗證與交付資料完成；只做本機commit，沒有push、部署、商店後台操作、訊息、外部派工、廣告、內購、帳號、線上功能或新增第三方SDK。作品維持MIT、免費及離線可玩。
'''
(ROOT/'docs/CODEX_RESPONSE_CONTENT_R36.md').write_text(text,encoding='utf-8')
print('VERIFIED Traditional Chinese report with fifteen individual inspection rows')
