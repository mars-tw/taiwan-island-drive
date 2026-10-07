# 島嶼交通學院｜Island Transport Academy

汽車、火車與飛機已合併成同一個開源手機遊戲專案。從大廳選交通工具，共用一套 npm／Vite 建置、一個 GitHub 儲存庫、一份 PWA 與離線素材庫。手機只需加入主畫面一次。

**[開啟交通學院](https://mars-tw.github.io/taiwan-island-drive/)** · [完整原始碼與模型下載](https://mars-tw.github.io/taiwan-island-drive/downloads/island-drive-source.zip)

| 模式 | 操作與學習 | 專案內入口 |
| --- | --- | --- |
| 汽車 | 四款車、四張台灣主題地圖、觸控／手機方向盤、自由駕駛與計時挑戰 | `/car/` |
| 火車 | 慣性、延遲煞車、車門與方向互鎖、號誌、停站接客；三課程與停車輔助 | `/train/` |
| 飛機 | 四個 36×36 km 風景地圖；尋寶、郵件投遞、景點巡航、起飛、導航、降落及自由飛行；單次點擊助飛與物理返航 | `/flight/` |

火車與飛機預設 3～5 歲幼兒模式，有大按鈕、簡短中文語音及操作輔助。家長可改成完整手動模式。大廳的幼兒模式、聲音與畫質設定會同步到三種遊戲；汽車的車種、顏色等個別選擇仍會保存。

2.2 版重整飛機的手機／平板介面：WebGL 使用獨立飛行視窗，任務列與控制列占自己的空間；幼兒只需點擊向左、主動作與向右，助飛會持續管理油門、轉彎與姿態。看儀表時重新量測可用視窗，家長仍可切換完整手動操作。新增尋寶、實際重力郵件投遞及景點巡航，詳細變更見 [介面](docs/flight-upgrade-ui.md)、[控制與玩法](docs/flight-upgrade-controls.md)、[世界與鏡頭](docs/flight-upgrade-world.md)。

## iOS／Android 商店版準備包

已建立 Capacitor 原生工程，全部遊戲與模型本機打包。Android 測試 APK、上傳簽章 AAB、iOS Simulator App 與發佈簽章 IPA 皆已有建製證據，104 項程式測試通過。2026-10-07 新 [LOGO 與透明字標](docs/branding/README.md)已準備；舊原生包仍須重新建製才會包含新圖示。完整交付與重建見 [native-package](docs/native-package.md)，建置證據見 [native-build-verification](docs/native-build-verification.md)。

Apple 會員已啟用，App record 與簽章 IPA 已建立；Google Play 身分審核已通過，擁有者已完成裝置驗證，聯絡電話驗證仍待完成。目前未在 App Store／Google Play 送審或上架。簽章與上傳金鑰的非秘密索引在 [APPLE_RELEASE_CREDENTIALS.md](APPLE_RELEASE_CREDENTIALS.md)，私鑰與密碼保留於專案外。

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
