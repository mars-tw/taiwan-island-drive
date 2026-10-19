# 島嶼交通學院：新內容第12輪

VERIFIED（本機實作與驗證完成），2026-10-19。版本 **2.24.0／原生來源 build20**，分支 **r1-fun-polish**，基線 **a81c33f7f3ce36c6bda78044daf20c7ece7d03c1**。只修既有三課，沒有新增課程。Muse 新一輪評分尚未取得，不能宣稱已達8分。

三課入口都是 **首頁「海岸實作課」→ 選課 →「一起出發」**。保留 MIT、免費、離線遊玩；未新增依賴、廣告、內購、帳號、外連、線上功能或 SDK，沒有暴力、淘汰、倒數懲罰或競速計分。

| 課程 | 做了什麼、怎麼玩 |
|---|---|
| 把蛋糕平穩送到 | 三層蛋糕、小旗與參考線以同一底座支點傾斜。放開踏板、依儀表彎箭頭扶正；需要起步或再起步時，踏板亮黃「按住前進」。道路方向留在路面，扶正區寫「先扶正蛋糕」，按鍵改用藍色「扶正」。停車時收起扶正提示，路旁圓盤標為休息區；結尾直接保留相同藍車與蛋糕，朋友來分享。 |
| 路口停看等 | 每位都重新看左右、確認朋友、等到對岸。移除「剛看過」大箭頭，已看改小綠勾；缺右時句子、亮鍵都要求看右。人物先在人行道接到斑馬線，沿水平通行帶穿越，再走上對岸鋪面。全員到岸才亮出發，按下後保留駛離過程再換站。 |
| 形狀車票，找對月台 | 先比形狀和顏色，再前進、停穩、開門。深門洞、亮黃框及有粗邊斜紋的水平踏階，讓上車空間看得清楚；過門檻人物縮至車頂下。錯站及全員坐好後收起隊伍虛線，計數固定位置，結算不顯示遊玩計數。結尾保留同一款列車原圖、比例與乘客。 |

## Muse 五項驗收與原尺寸圖

以下手機原圖均為 **390×844 PNG**，路徑相對於 repo。沒有拼圖、縮放或後製文字；擷取時僅暫停 RAF，不指定遊戲位置、傾斜、完成或保存旗標。完整狀態及 SHA 在 `docs/content/r12/screenshots.json`、`acceptance.json`。

| 項目 | 本機結果 | 原圖（docs/content/r12/）／精選編號 |
|---|---|---|
| 1．放大蛋糕傾斜 | VERIFIED：旗尖X為57.70→82.24→121.57px，逐格差24.54、39.34px；總差63.88px，大於蛋糕寬103.68px的一半。三層、旗與傾斜線同一支點，另留固定水平基準。 | phone-cake-tilting-1.png、phone-cake-correcting-2.png、phone-cake-recovered-3.png；01～03。 |
| 2．拆開道路與扶正方向 | VERIFIED：第二站不再有上方左右彎指令；車道箭頭只在路面。蛋糕區有彎箭頭及「扶正」，底部不再同時喊相反方向。待按踏板亮黃，格內停穩後也可直接按住。 | phone-cake-bends-timing.png、phone-cake-bay-stopped.png；04～05。 |
| 3．路口移除過時大箭頭 | VERIFIED：缺右畫面沒有指左箭頭，小綠勾不遮等待牌，句子與亮鍵指右。九位各有進入、中段、到岸原圖；自行車到岸已移至可見鋪面。 | phone-crossing-stage-1-missing-right-1.png；phone-crossing-stage-2-grandma-moving-1.png～3.png；各站 reset／arrived 原圖；07～08。 |
| 4．門與踏階縮圖可辨 | VERIFIED：深門洞、亮框、完整階面與人物有清楚分離。開／關圖縮至25%仍可辨；錯站、關門後虛線為空。人數HUD位置差0px、結算隱藏。三站皆完成逐人上車→入座→收階→合門。 | phone-tickets-stage-1-wrong-closed.png、phone-tickets-stage-2-open.png、phone-tickets-stage-2-doorway-2.png、phone-tickets-stage-2-retracting.png、phone-tickets-stage-2-closing.png、phone-tickets-stage-3-closed.png；11～14。縮圖另存 thumbnail-check/，不混入原圖精選。 |
| 5．完成瞬間與三站差異 | VERIFIED：精選15張內，三課各含三站進行畫面與成功觸發。蛋糕坡道／連彎／灣位，路口海風／榕樹／燈塔，車票藍圓／橘三角／綠方逐一對應。保留出發亮鍵→駛離兩格及相同載具結尾。 | phone-crossing-stage-3-ready-depart.png、phone-crossing-stage-3-departing.png、phone-cake-saved-result.png、phone-tickets-saved-result.png；06、09～10、15，其餘站次見01～05、07～08、11～14。 |

Claude 指定嚴重問題均在精選內：可按踏板03／05、連彎方向04、缺右提示07、錯站及全上車無虛線11／14、相同車輛結尾06／15。GPT 的過街動線由08呈現；門檻、人物尺度、輪軌及踏階由12～14呈現。這是執行者的本機檢查，未冒稱三位審查員已重驗。

## 精選與商店原圖

**`docs/content/r12/review-set/`：恰好15張。** 蛋糕6、路口4、車票5，各課都有遊玩中畫面、三站差異與成功觸發；蛋糕連續三格、路口駛離兩格、第二站上車兩格。每張與來源位元組相同，對應及 SHA 見 `review-set-manifest.json`；逐張說明在 `review-guide.md`。完整原圖有三課保存重開、路口九位逐人路線、三站上車六狀態，不把精選之外的資料當作審查員已看見。

新增商店遊玩原圖，保留全部既有商店圖：

- `docs/store/screenshots/content-r12/tickets-boarding-1290x2796.png`
- `docs/store/screenshots/content-r12/tickets-boarding-2064x2752.png`

## 測試與品質閘

| 執行 | 結果／證據 |
|---|---|
| npm test | VERIFIED：216／216，零失敗、零跳過；原有211項與斷言保留。新增5項覆蓋踏板／方向、旗尖、腳底路線、實際駛離暫停及保存、隊伍線／三站上車保存。unit-tests.txt。 |
| npm run build | VERIFIED：正式建置，232個本機離線快取檔。build.txt。 |
| 三課無頭實玩、矩陣及韌性 | VERIFIED：130組檢查、170張原尺寸圖。三課皆從正常入口完成三站並重開讀回；零pageerror、HTTP錯誤及外部請求。browser-cake／crossing／tickets／matrix／resilience／boarding-matrix／store.json。 |
| RWD與觸控 | VERIFIED：320×568、390×844、568×320、844×390、768×1024、1024×768、1366×600、1280×640。選課、說明、遊玩、休息、完成頁可操作目標≥60px，無遮擋或出界、手機無鍵盤提示；另補小手機、橫式與iPad上車畫面。 |
| 離線、存檔拒絕與暫停 | VERIFIED：安裝快取後斷網，完成九位禮讓、重開讀回；儲存被拒仍能玩與完成，休息凍結狀態、繼續後正常。phone-crossing-offline-result／offline-saved／storage-denied.png。 |
| npm run test:merge，5286埠 | VERIFIED：132項，數學→火車→汽車→飛機→保存重開，零錯誤與外部請求。merge-test.txt、merge/merge-path.json。 |
| npm run test:store，5113埠 | VERIFIED：101項、26張回歸圖，冷開／觀察／第一目標／續玩／保存及離線流程通過；零錯誤與外部請求。store-review-test.txt、store/review-path.json。 |
| 原生離線包 | VERIFIED：本機來源build20、227檔，28項原生包檢查通過，新圖已打包，沒有遠端server。native-package-test.txt、native-bundle-manifest.json；未簽章、未送審。 |
| 效能 | VERIFIED（並發參考）：桌機／直式／橫式，各六模式、三跑中位p95共18組，全部16.7～16.8ms，≤18ms。performance.json、performance-test.txt。不能代替乾淨機況或原生裝置。 |
| 版本、秘密與工作區 | VERIFIED：2.24.0／build20讀回一致、秘密掃描零命中（涵蓋API金鑰、私人金鑰、GitHub及雲端常見格式）；原有測試檔與斷言不變，23份既有未追蹤審查文件保留且不提交。release-proof.json、secret-scan.json、source-manifest.json；提交範圍僅限本機。 |

保存的行為值來自實際操作：蛋糕扶正4次、慢行幫忙1次、灣位停穩與再起步各1次；車票全程9位坐好、改選3次。路口主要測試刻意每位在缺右時嘗試出發，故有9次提醒；離線路徑沒有這些嘗試。整齊數字是測試操作結果，沒有寫死成獎勵或預設完成值。實際保存讀回在 saved-cake／crossing／tickets.json。

執行修正：一支重測曾在前支程序未結束時誤啟動，已立即中止，該次不列驗收；最終相關畫面與紀錄重新逐支產生。開發中的作廢紀錄保留於未提交的.audit-tmp，沒有當成通過證據。

## 美術與文案

新增 **1次 image_gen.imagegen／1個設計／1張執行WebP**：修整海岸低月台，讓門檻接到月台、車輪接近後軌；其餘車、人物、蛋糕全沿用受管原畫。提示保留R11完整風格前綴，原圖、64px檢查圖及SHA在 `docs/content/r12/art/`。工具未揭露模型slug，manifest照實記null，未冒稱特定模型。Sharp只編碼；水平基準、箭頭與安全斜紋是教學符號，未用色塊冒充場景美術。

新圖量測：亮度0.537、飽和0.665、近黑5.64%、低飽和11.52%，在既有門檻內。蛋糕是實際讀值驅動的2D旋轉，人物沿用既有姿勢；沒有宣稱新增3D物理、骨架或影片動畫。

speak-human-tw mode 2摘要（原句／原因／改法）：灰色「已放開」／像禁用鍵／需要操作時亮黃「按住前進」，狀態放儀表小字；「先練左彎」搭配「輕輕右轉」／指令互撞／道路只留路面箭頭，儀表與藍鍵寫「扶正」；「平穩・先慢行」／把名稱誤讀成狀態／歪時寫「蛋糕歪了」、回穩時寫「正在回穩」；未說明的路旁圓盤／像第二個停車目標／標為「路旁休息區」。

## 未完成與風險

**Apple 4.3風險：中**，為本機內容相似度自評。三種操作仍各有生活情境與因果，三站、選課與結算外殼仍共用。沒有Apple接受結論，也沒有新的Muse分數。

**BLOCKED**：實體iPhone／iPad、原生語音與真觸控需要裝置；親子試玩、家長5秒理解需要參與者；乾淨機況效能需要獨占硬體；Muse≥8需要審查員重新檢視本輪15張精選。未推送、部署、上傳商店或對外發訊息，未委派其他服務。

本輪啟動的5286及5113 preview已停止；各驗證瀏覽器已關閉。前後對照及手機直橫／iPad原尺寸複本在 `docs/evidence/content-r12/`，對應見 before-after.json、viewport-evidence.json。
