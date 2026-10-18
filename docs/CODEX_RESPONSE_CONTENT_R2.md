# 海岸實作課：新內容第二輪交付

工作單 2026-10-18，驗證跨日於2026-10-19續作。版本 **2.14.0／原生來源 build10**，限定分支 `r1-fun-polish`，本輪基線 `881dd1f6df8cd24b9e2989471b16f6852c97670c`。本機可做的內容與證據已 VERIFIED；真人及原生裝置驗收仍 BLOCKED，沒有宣稱 Muse 已給8分。

三課入口都是 **首頁橘色「海岸實作課」→ 選課 → 一起出發**。入口與選課原尺寸圖：`docs/content/r2/phone-home.png`、`phone-entry-picker.png`。沒有新增廣告、內購、外連、帳號、SDK、依賴或線上功能；既有未追蹤 Muse 文件保留，沒有派工、推送、部署、商店操作或對外訊息。

## 三項內容

| 課程 | 改動、怎麼玩 | 完成與保存 |
|---|---|---|
| 把蛋糕平穩送到 | 蛋糕與車放在同一座標容器，托盤貼合車頂，下方有沿用插畫的練習場地面。按住踏板／方向／煞車，奶油層與小旗由實際加速度、轉向側力驅動；急操作出現黃底彎箭頭與短句，平穩時為綠色水平線。起步坡有阻力，第二站有左右連續彎，第三站進臨停區會溫和減速。 | 三種練習圖示逐步留下紀錄；沒有扣分、損壞、淘汰或倒數。完成圖是切好蛋糕、互相分享。checkpoint重開接續下一站、完成紀錄重開保留。 |
| 路口停看聽 | 改名符合實際內容，不宣稱錄音歌曲。停穩，看左右，等三位朋友走完，出發鈕才亮起；提早按會提示並留在原處。行人2.1秒、腳踏車1.45秒、奶奶2.4秒，自行車反向，奶奶走緩弧，各保留兩張不同肢體姿勢。三站使用藍天海岸、榕樹村落、黃昏燈塔三張獨立場景。 | 三站順序不同，觀察與等待都完成才可出發。完成圖是三位朋友在人行道揮手；三站斷網重玩及保存已實驗。語音沿用裝置能力，無音色／靜音仍有圖示和短提示。 |
| 形狀車票，找對月台 | 直接點場景內三根月台柱上的形狀站牌；車票、三站牌、列車位置同時可見。選錯也能開到該月台，停靠位置確實不同；停穩才能重選。顏色、形狀都相同且到站停穩才可開門。 | 1.2秒上客期間不能直接跳下一站；朋友沿月台走到門口，再出現在車窗內，完成圖清楚顯示落座。三站車票依序為藍圓、橘三角、綠方，最後完成圖保留綠方站牌與車票。 |

這些課程是2D互動插畫；奶油／旗幟是物理讀值的形變，人物使用既有雙姿勢，不宣稱完整骨架動畫。三張完成圖是靜態敘事插畫，與實際過街、上客的連續過程圖分開列示。

## Muse 五項驗收對照

以下相對檔名都位於 **`docs/content/r2/`**，PNG是390×844原尺寸手機直式瀏覽器截圖，沒有合成或事後縮放。各圖SHA-256、尺寸與方法在 `browser.json`。

`docs/content/r2/acceptance.json`另逐項列出完整截圖路徑、原尺寸、SHA-256及尚未完成的真人／裝置條件，供複審直接開圖。

1. **讓平穩看得見 — 本機 VERIFIED；遮字真人辨識 BLOCKED。** 起步 `phone-cake-starting-1.png`、轉彎 `phone-cake-turning-1.png`、煞停連續三格 `phone-cake-braking-1.png`、`phone-cake-braking-2.png`、`phone-cake-braking-3.png`。最終起步／轉彎實讀角度約 **−27.28°／16.53°**；另一次完整通關的煞車為30.16°。三站背景與路線牌：`phone-cake-stage-1.png`、`phone-cake-stage-2.png`、`phone-cake-stage-3.png`。旗幟方向、奶油偏斜與黃底彎箭頭提供視覺線索；尚未找真人遮字判讀，不能宣稱該測試通過。
2. **歌名與三種過街者 — 本機 VERIFIED；實機語音聽感 BLOCKED。** 改為「路口停看聽」。三站首位分別為行人、奶奶、腳踏車：`phone-crossing-stage-1-child-1.png`、`phone-crossing-stage-2-grandma-1.png`、`phone-crossing-stage-3-bike-1.png`；每組另有`-2.png`、`-3.png`，實際等姿勢切換後截圖，雙姿勢斷言保留。每站每位角色都有三格，例如`phone-crossing-stage-2-bike-1.png`至`-3.png`。提早出發 `phone-crossing-blocked.png`；三人全通過、出發亮起 `phone-crossing-stage-1-clear.png`至`stage-3-clear.png`。本輪沒有歌曲或真人跟唱宣稱。
3. **真的月台 — VERIFIED。** 每站都有錯／對對照：`phone-tickets-stage-1-wrong.png`、`phone-tickets-stage-1-right.png`；`stage-2-wrong.png`、`stage-2-right.png`；`stage-3-wrong.png`、`stage-3-right.png`。所有完整檔名均以`phone-tickets-`開頭。三個柱式站牌本身可操作，不需要下方的形狀選項列。每站上客三格為`phone-tickets-stage-N-boarding-1.png`至`-3.png`；落在車窗內的結果另見`phone-tickets-stage-1-seated.png`、`phone-tickets-stage-2-seated.png`。
4. **完成畫面差異化 — 本機 VERIFIED；五人盲測 BLOCKED。** 三張完成原圖：`phone-cake-complete.png`、`phone-crossing-complete.png`、`phone-tickets-complete.png`。分別呈現分享蛋糕、人行道揮手、列車落座，不用共通獎盃、橫幅或右下角教練貼紙。蛋糕三張背景、路口三張獨立背景、車票海風／榕樹／花園三個停靠區都有可見差異。未招募5位未玩過的人，不能宣稱4人辨認通過。
5. **兒童實測與駕駛減法 — 駕駛本機 VERIFIED；兒童與原生截圖 BLOCKED。** `phone-train-driving.png`、`se-train-driving.png`、`landscape-train-driving.png`、`small-landscape-train-driving.png`、`ipad-train-driving.png`、`ipad-landscape-train-driving.png`、`short-laptop-train-driving.png`。七尺寸場景內均只有 **1組行車路牌**（48～75px高），速度格、車站、號誌合併，教練與下方短提示合併，重複浮動提示移除；六主操作仍≥60px且可見可點。保留既有3D地形與列車，未宣稱已重建全部世界美術。5位3～8歲兒童測試、4/5獨立完成門檻及原生iPhone／iPad截圖均未執行。

## 測試與證據

| 項目 | 狀態與結果 |
|---|---|
| `npm test` | VERIFIED：**172／172**。保留168項既有測試與斷言，新增4項R2模型測試。`docs/content/r2/unit-tests.txt` |
| `npm run build` | VERIFIED：既有車輛表面守門、Vite與 **205個本機快取資源**。`build.txt` |
| `npm run test:merge`，5286 | VERIFIED：11尺寸、**132檢查／25張原圖**；零執行錯誤、零外部請求。`merge-test.txt`、`merge/merge-path.json`。沿用既有主線實際UI與加速步進原物理模型，沒有改完成旗標。 |
| 新內容實際操作 | VERIFIED：**71項檢查／112張原圖**（含6張指定商店圖）。三課各完整玩三站，錯／對月台、移動時開門被擋、上客閘、checkpoint重開、三課完成保存、暫停、減少動態及儲存拒絕均有實驗。`browser.json`、`content-test.txt`、`cake-scene.json`、`crossing-scenes.json`、`driving.json`。 |
| 最後場景RWD | VERIFIED：8尺寸、56項≥60px／視口內／角落命中檢查。`browser-smoke.json`、`smoke-test.txt`，最後重拍後已合併原圖hash。 |
| `npm run test:store`，5113 | VERIFIED：12尺寸、**101檢查／26張原圖**，冷開、第一目標、重開保存、拒絕儲存與三交通離線流程通過；零執行錯誤、零外部請求。`store-test.txt`、`store/review-path.json`。 |
| 效能 | VERIFIED／參考：六模式×三視口共18組，每組三跑中位p95；最終蛋糕／路口場景另測6組。兩組最大均 **16.8ms≤18ms**。`performance.json`、`performance-scenes-final.json`。主機有其他並發負載，非原生裝置或閒置機況的出貨認證。 |
| 版本、秘密、來源 | VERIFIED：2.14.0／來源build10，依賴未變，既有測試與GLB未修改；秘密樣式掃描零命中，支援UTF-8／UTF-16紀錄。`release-proof.json`、`release-test.txt`。 |

離線證據：`phone-crossing-offline-stage-1-clear.png`、`phone-crossing-offline-stage-2-clear.png`、`phone-crossing-offline-stage-3-clear.png`，由瀏覽器實際斷網、重新載入後操作。保存畫面為`phone-save-all-three.png`；拒絕儲存為`phone-storage-denied.png`；休息為`phone-paused.png`。單張截圖不能獨立證明網路狀態、測試數或效能，這些數字以自動操作紀錄與JSON量測為證，不把截圖冒充完整技術驗證。

## 美術與商店圖

**6次 `image_gen.imagegen`、6個設計、6張遊戲WebP，共3,314,106 bytes（約3.16MiB）**。四張為月台與三課完成圖，兩張為路口場景變體。完整R1風格前綴、提示、參考檔、原畫、實際工具名與SHA-256在 `docs/content/r2/art/PROMPTS.json`、`manifest.json`。模型slug未揭露，記為null。原畫只轉WebP，不以程式冒充生成美術；形狀站牌、方向箭頭是教學符號。遊戲檔在 `public/art/content-r2/`，沿用素材另外列在ART_DIRECTION與CREDITS，MIT與既有第三方授權保留。

新增指定商店原圖，既有圖未刪：

- **1290×2796**：`docs/store/screenshots/content-r2/iphone-cake.png`、`iphone-crossing.png`、`iphone-tickets.png`。
- **2064×2752**：`docs/store/screenshots/content-r2/ipad-cake.png`、`ipad-crossing.png`、`ipad-tickets.png`。
- 整合與商店回歸額外證據放同資料夾的`merge/`、`store/`，沒有覆蓋第一輪或既有上架圖。全部是Web瀏覽器證據，**不是原生裝置截圖**。

## 文案調整（mode 2）

| 原句 | 原因 | 改成什麼 |
|---|---|---|
| 路口等等歌 | 實際沒有錄音歌曲，名稱會造成錯誤期待 | 路口停看聽 |
| 踏板起步、轉彎、煞車。小旗會告訴你。 | 幼兒指令要短且對應力道 | 輕踩、輕轉、慢慢停。看小旗。 |
| 看形狀和顏色，停穩再開門。 | 新入口是場景站牌，需直接說可點的物件 | 點月台站牌，停穩再開門。 |
| 大家都到了，一起慶祝！ | 三課共用結語無法辨認完成事件 | 蛋糕送到了！一起分享。／謝謝你等我們！朋友揮揮手。／大家坐好了！一起去旅行。 |
| 這一站完成了！ | 結果需對應當課學到的事 | 這段路練好了，去下一站。／朋友都過街了，去下個路口。／朋友坐好了，去下一站。 |

## Apple 4.3與未完成

**Apple 4.3風險：中。** 三課已有交通專屬的力道照顧、安全觀察與停靠開門決策，完成畫面可辨識，入口也更清楚；既有3D主線與2D新課仍是混合媒材。這是本機設計評估，沒有新的Muse複審分數，也不是Apple接受或8分以上的證明。

BLOCKED缺件：遮字判斷蛋糕力道的真人測試、5位未玩者的完成圖盲測、5位3～8歲兒童與家長同意的無成人代讀試玩、可用原生iPhone／iPad和執行環境、實機語音聽感、原生／閒置實機效能及Muse R2複審。這些項目未執行，沒有假造受測者、分數或原生畫面。沒有缺少本機遊戲用素材；剩餘人群與硬體驗收需要相應受測者及實機。
