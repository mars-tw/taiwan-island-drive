# 島嶼交通學院｜Island Transport Academy

**目前本機整合版：2.47.1／原生來源 build 44。** 這是既有《島嶼交通學院》的更新準備，沒有上傳商店或部署；以下原生上傳紀錄是歷史快照。

你是島嶼交通學院的新學員，要陪海風站的朋友到山海教室。先上「列車數學課」，把同一班乘客裝滿、分車、算剩下；再拿調度單接火車乘客、沿公路送補給、開飛機找路標。四章共用學生證、星星與徽章，首頁只有一個主線繼續入口，原三交通工具與 12 關仍可自由練習。

本作整合汽車、島嶼鐵道／飛行內容，這輪再移植 Apache-2.0 開源專案「小小列車長」（`taiwan-train-math`）的拆合教材，沒有帶入另一套首頁或 iframe。主 repo 保留 MIT；移植程式、教材文字及其他素材各依原授權，見 [CREDITS](CREDITS.md)、[來源清單](docs/merge-assets.json)與[完整 Apache 授權／NOTICE](public/licenses/taiwan-train-math/NOTICE.txt)。免費、非營利提供遊玩，歡迎在各素材授權條件下改作自己的遊戲；MIT 本身也允許商業使用。

升級會保留原星星、護照與觀察章，整合到同一份學生證。家長通過關卡後，可選來源 App 匯出的 JSON：可接續拆合進度，其他玩法的歷史原文保留，沒有把未移植玩法說成可續玩。詳見[整合設計與限制](docs/MERGE_DESIGN.md)。不讀另一個 App 的沙盒、不改來源 App、不上傳兒童資料。沒有廣告或第三方分析 SDK。

**[開啟交通學院](https://mars-tw.github.io/taiwan-island-drive/)** · [完整原始碼與模型下載](https://mars-tw.github.io/taiwan-island-drive/downloads/island-drive-source.zip)

| 模式 | 操作與學習 | 專案內入口 |
| --- | --- | --- |
| 列車數學課 | 主線第一章：裝滿、可逆分車、算前車帶走的人數；每個動作保存在學生證 | 大廳主線／數學練習 |
| 汽車 | 四款車、四張台灣主題地圖、觸控／手機方向盤、自由駕駛與計時挑戰 | `/car/` |
| 火車 | 慣性、延遲煞車、車門與方向互鎖、號誌、停站接客；三課程與停車輔助 | `/train/` |
| 飛機 | 四個 36×36 km 風景地圖；尋寶、郵件投遞、景點巡航、起飛、導航、降落及自由飛行；單次點擊助飛與物理返航 | `/flight/` |

火車與飛機預設 3～5 歲幼兒模式，有大按鈕、簡短中文語音及操作輔助。家長可改成完整手動模式。大廳的幼兒模式、聲音與畫質設定會同步到三種遊戲；汽車的車種、顏色等個別選擇仍會保存。

2.2 版重整飛機的手機／平板介面：WebGL 使用獨立飛行視窗，任務列與控制列占自己的空間；幼兒只需點擊向左、主動作與向右，助飛會持續管理油門、轉彎與姿態。看儀表時重新量測可用視窗，家長仍可切換完整手動操作。新增尋寶、實際重力郵件投遞及景點巡航，詳細變更見 [介面](docs/flight-upgrade-ui.md)、[控制與玩法](docs/flight-upgrade-controls.md)、[世界與鏡頭](docs/flight-upgrade-world.md)。

2.4 版讓幼兒更好上手，也更有獎勵感。大廳換成明亮的天空配色，三張大卡片在手機直式、橫式都不用捲動。汽車路上有 12 顆金色星星可以收集，火車每接到一站乘客就會慶祝，飛機找到星星、送到郵件也會。三種模式收集到的星星都會顯示在大廳的星星架上。大廳另有一段可關閉的背景音樂，來源記在 [CREDITS](CREDITS.md)。改動與驗收紀錄見 [R1 報告](docs/R1_FUN_AND_POLISH_REPORT.md)。這一版只更新網頁原始碼，商店上的原生包仍是 2.3.0。

## iOS／Android 商店版準備包

已建立 Capacitor 原生工程，全部遊戲與模型本機打包。新 [LOGO 與透明字標](docs/branding/README.md)已納入 Android 測試 APK（39,339,054 bytes）、上傳簽章 AAB（37,141,256 bytes）及實際上傳的 iOS 簽章 IPA（37,440,871 bytes）；簽章與隨附資源驗證通過，104 項程式測試通過。[公開 Android 測試版 rc.2](https://github.com/mars-tw/taiwan-island-drive/releases/tag/native-v1.0.0-rc.2)已發布，三個檔案 digest 已核對。完整交付與重建見 [native-package](docs/native-package.md)，最新包、舊 `e580ef1`／`7cd0d75` 證據與驗證限制見 [native-build-verification](docs/native-build-verification.md)。

Apple 已透過官方 direct API 完成上傳與處理，Build 1.0.0／build 1 為 `VALID`，`usesNonExemptEncryption=false`；選用 Build 並提交 ReviewSubmission 後，實際 GET 版本與審查工作皆為 `WAITING_FOR_REVIEW`，尚未核准。完整上傳及送審紀錄見 [Apple API journal](store/review/apple-api-submission-verification.json)，雙平台共用 API 已透過實際 GET 驗證，見 [共用 API 驗證](store/review/shared-api-verification.json)。來源 `e580ef1` 的 [新版原生截圖](store/screenshots/native-ios-logo-v2/provenance.json) 已完成四個實際 XCTest case、0 失敗，兩裝置的家長 gate 各三項取消斷言皆成立；八張圖已經 Root 視覺覆核並附加至 Apple 1.0.0 版本。舊 `7cd0d75`／`11ebddb` 證據與原雜湊保留；iOS 編譯後圖示像素及實體硬體 QA 仍未驗證。

Google 的 11 項 App 設定已完成，客服 email 與「廣告 ID＝否」已儲存，AAB code 1／version 1.0.0／min API 24／target API 36 已上傳並經處理接受：0 個錯誤，1 項缺少 deobfuscation 的資訊提示，建置使用 `minify=false`。Alpha 封閉測試已選台灣一國，原始 17 筆名單排除 1 筆後，16 人白名單已儲存；15 項變更目前為 `in_review`。尚未核准或可測試，實際加入測試為 0 人，12 人連續 14 天仍待完成。Android 硬體遊玩 QA 也未完成，最新審查與可用狀態見 [Google Console 進度](store/review/google-console-progress.json)；本次未另開 Google edit 或重傳原生包。簽章與上傳金鑰的非秘密索引在 [APPLE_RELEASE_CREDENTIALS.md](APPLE_RELEASE_CREDENTIALS.md)，私鑰與密碼保留於專案外。

## 手機遊玩

用 Safari 或 Chrome 開啟大廳，選汽車、火車或飛機。汽車的「設定 → 手機方向盤 → 啟用」會要求瀏覽器正常的動作感測權限，握好手機後按「回正」，即可左右傾斜轉向；油門和煞車仍用觸控。

Android 可從瀏覽器選單安裝，iPhone 可在 Safari 分享選單選「加入主畫面」。第一次完整連網載入後，共用 Worker 會快取四個入口與所有遊戲素材，可離線切換三種交通工具。離線能力需要 HTTPS 或 localhost；區網 HTTP 可玩，但不能啟用安全來源限定的安裝／感測功能。

語音由手機提供；沒有可用中文音色時，畫面保留相同提示。這是兒童操作學習的簡化物理模型，沒有宣稱取代實車／實機訓練。台灣地景、道路、機場與交通工具均為原創設定，沒有使用測繪資料或品牌認證參數。

## 開發與建置

需要 Node.js 22.12 以上版本，製作環境為 Node.js 24.15.0。

```sh
npm ci
npm run dev
npm test
npm run build
```

整合驗證另跑 `npm run test:merge`、`npm run test:store` 與 `node scripts/check-mobile.mjs`。這些無頭瀏覽器檢查需要本機 Playwright／Chromium；設定 `PLAYWRIGHT_MODULE` 指向已有套件的 `index.mjs`，`BASE_URL` 指向已建置的本機 HTTP 服務，`EVIDENCE_FOLDER=docs/evidence/merge`。來源比對器另需 `TRAIN_MATH_SOURCE` 指向唯讀的小小列車長 checkout。證據與確切限制見 [本輪報告](docs/CODEX_RESPONSE_MERGE.md)。

開發網址為 `http://localhost:5178/`。正式版 `dist/` 同時含大廳、汽車、火車與飛機，三模式共用一份 Three.js chunk、字型、設定及模型路徑。沒有三份 node_modules 或三套獨立部署。

下載包附建置好的 dist，有 Node.js 時可雙擊「開始遊戲.cmd」，或執行：

```sh
node scripts/serve.mjs
```

不要用 file:// 開 HTML，模型與模組需要 HTTP。網站採相對路徑，可放在 GitHub Pages 等網站子目錄；四頁的 `island-app-root` 與共用 paths 模組會解析同一個素材根目錄。

## Blender 模型與 IMG 貼圖

共用 `public/models/` 包含 12 個 GLB。2.1 版提供汽車、火車、飛機三張真正 ImageGen 4×4 PNG atlas，共 48 格材質，逐面 UV 對應車身、門板、輪胎、輪圈、金屬、玻璃、座椅與駕駛艙。三張新圖位於 `public/textures/*-detail-atlas.png`，舊兩張 atlas 留作歷史來源。圖片與 UV 真正連到材質，並內嵌於八個運輸工具／座艙 GLB。

已改善空心汽車座艙、透明玻璃、列車門縫與窗框、飛機翼型與鼻罩、圓形輪胎及金屬零件；地板與座椅調整成合理紋理密度。換車色仍保留 IMG 細節，控制桿、車輪、螺旋槳及舵面動畫保持正常。原有幼兒教學、方向盤與物理設定保留。

```sh
node scripts/verify-vehicle-surfaces.mjs
node scripts/update-asset-catalog.mjs
```

驗收工具直接讀取 GLB、Image Texture 與 UV accessor，核對各格對位、玻璃透明度、必要動畫節點及圖片雜湊。每次建置都先驗收模型，錯格、缺圖或缺控制節點會阻止發布。完整證據與生成提示詞見 [真實感更新](docs/realism/README.md)。

```sh
blender --background --python blender/build_assets.py
blender --background --factory-startup --python blender/train/build_assets.py
blender --background --factory-startup --python blender/flight/build_assets.py
npm run build
```

原始檔在 `blender/island-drive.blend`、`blender/train/models.blend` 與 `blender/flight/models.blend`。更多再生與相對路徑驗證見 [MERGE_ASSETS](docs/MERGE_ASSETS.md)，素材目錄見 [catalog.json](public/models/catalog.json)。內建 ImageGen 的提示詞與 IMG 出處完整保存在 [火車](docs/editions/train/TEXTURES.md)及[飛機](docs/editions/flight/TEXTURES.md)製作文件。

## 完整開源包與部署

```powershell
powershell -ExecutionPolicy Bypass -File scripts/package-source.ps1
```

產出 `release/island-drive-source.zip`，包含三種遊戲程式、四頁入口、三份 Blender 來源、12 個 GLB、三張現用 atlas 與兩張歷史 atlas、全部授權與正式版。排除依賴、憑證、工作暫存及遞迴 ZIP。

推送 main 後，同一份 GitHub Actions 流程會跑全部測試、建置四頁、製作完整下載包並部署到同一個 GitHub Pages 網址。完整源碼授權為 MIT；Three.js 保留 MIT，Barlow 字型保留 OFL，授權原文在 [THIRD_PARTY_NOTICES](public/THIRD_PARTY_NOTICES.txt)。

```text
index.html             共用大廳
car/ train/ flight/    同源模式入口
src/games/            三種遊戲模組
src/shared/           共用導航、設定、路徑及 PWA 啟用
public/models/        共用 GLB 素材庫
public/textures/      原始 IMG atlas
blender/              三套可再生模型來源
tests/                原有玩法與合併整合測試
docs/editions/        各模式保留的製作與驗收紀錄
```

舊火車、飛機儲存庫與本機原資料夾保留作歷史來源，後續開發以此合併專案為準。驗收限制與合併紀錄見 [MERGE](docs/MERGE.md)。

# 2.5 手機短關卡與星星護照

在大廳或遊戲上方點「星星護照」，就能玩汽車、火車、飛機各 4 關，共 12 關。完成一關會保存最佳 1～3 星並解鎖下一關；同模式四關完成可集到交通工具章。原有自由玩法仍可直接進入。

汽車短路線長 360～1100 公尺；可點「自動油門」，用一隻手轉向，煞車會優先停止加速。火車由一站接客逐步練習兩站、紅燈等候與森林三站；飛機包含短程尋寶、送信、河灣觀景與城市尋寶。進度只保存在這台裝置，清除網站資料或移除 App 可能遺失。

兒童主按鈕至少 60px，直向、橫向均可玩。遊戲介面無廣告或外連，原始碼與授權仍保留於專案。家長設定仍需家長確認。

本輪計畫：[OPTIM_PLAN_R2.md](docs/OPTIM_PLAN_R2.md)。驗證與限制：[CODEX_RESPONSE_R2_MOBILE.md](docs/CODEX_RESPONSE_R2_MOBILE.md)。
# 海岸實作課（2.33.0）

首頁按「海岸實作課」選一課，先聽阿路說明，再按「一起出發」。每站完成即保存在同一份學生紀錄；沒有倒數、扣分或淘汰。

- 把蛋糕平穩送到：按住踏板、看路牌轉彎；蛋糕歪了，放開行車鍵，再按住向中央扶正。扶錯或放開會停住，不扣分。三站練起步坡、連續彎與臨停，最後一起分享蛋糕。
- 路口停看等：按住煞車停穩，依來車判斷觀察順序。第一站左→右，第二站右→左，第三站左→右→左；過街中仍可看左右。三位朋友都到對岸才可出發，編號全程相同。
- 形狀車票，找對月台：直接點場景站牌，形狀和顏色都要相同，月台位置逐站改變。停穩開門後，點朋友邀請，再按住陪著上車、放開暫停；三人坐好後先收黃黑邊踏階、再關門出發。

可以隨時休息或回學院，再次進入從已完成的站接續。關閉聲音仍有圖示與短提示；所有資源隨離線快取提供。第二輪驗證與未完成實測見 `docs/CODEX_RESPONSE_CONTENT_R2.md`。
