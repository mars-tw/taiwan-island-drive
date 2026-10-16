# 共用素材與程式稽核

2026-10-15。狀態：EXECUTED。這是其他線路仍在修改時的唯讀快照，不是最終二進位比對。

範圍：runtime 原始碼、圖片、模型、音訊、字型與原生圖示／載入圖。排除套件、建置產物、文件、測試與秘密目錄；沒有讀取憑證。完整數據見 `shared-assets.json`，可用 `python scripts/audit-store-assets.py` 重現。

## 視覺與操作處理

- 新增 `src/shared/safety-*`：本作專屬觀察簿，三種運輸系統的條件操作與逐站存檔；不是數學問答或換皮列車。
- `index.html`、`src/home.css`：首頁直接呈現第一課，路線簿色彩與方角按鈕；移除英文裝飾。
- 汽車／火車／飛機入口：統一交通學院課程名稱，去除退役拆分產品的標題與英文暫停字。
- 原生圖示使用 TransportIconV2／ic_transport_v2，Splash 已開圖檢查確認是本作三交通工具標記，並非 Capacitor 預設圖示。舊 AppIcon／ic_launcher 是未選用的歷史資產；未宣稱刪除或重製。
- 第三方標準元件：Three.js、Capacitor 及 App／Preferences／Motion／本機 TTS 橋接、Vite、Barlow Condensed 與系統中文字型。這些不是獨家設計，不把共用第三方框架說成不共用程式。
- 未新增 bitmap、模型或音樂，不冒稱用了 gpt-image-2；新課的進度條／號誌文字是互動 UI。既有 preview 圖有明確沿用關係。
- 已退役的飛行／鐵道拆分作與本作有真實素材及程式來源重疊。保留合併後內容，不藉改檔名、加註解或重編碼掩飾；本 repo 無法撤回另一 App，仍列風險。
- 大廳音樂沿用 R1 本機生成曲。原報告的權利歸屬缺件仍存在，不能憑沒有 hash 重複就聲稱已取得商用法律結論。

## 各作品掃描範圍

| 作品 | 目錄 | runtime 檔數 |
|---|---|---|
| Crackveil Vanguard | `rift-survivors` | 5194 |
| 暴風啟示錄 | `storm-apocalypse` | 2653 |
| 灰燼護航 | `doomsday-shooter` | 1076 |
| 無盡塔防 | `tower-defense` | 449 |
| 裂潮卡牌 | `skill` | 155 |
| 陽光農場 | `pixel-idle-farm-skill` | 392 |
| 村莊攻防 | `village-siege` | 329 |
| 七期：斷鏈行動 | `seven-district-reckoning` | 640 |
| Rift Forge 3D | `rift-forge-3d` | 69 |
| 小小列車長 | `taiwan-train-math` | 555 |
| 夜行列車 | `夜行列車_重製企劃_20261002` | 10 |
| 島嶼飛行學校 | `island-flight-school` | 22 |
| 島嶼鐵道學校 | `taiwan-train-school` | 18 |

## 完全相同檔案（逐項）

| 本作檔案 | SHA-256 | 與哪款／檔案重複 | 處理方式 |
|---|---|---|---|
| `android/app/src/main/assets/public/cordova.js` | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` | 小小列車長：`android/app/src/main/assets/public/cordova.js` | 標準 Capacitor/Cordova 空相容檔，非遊戲內容；保留 |
| `android/app/src/main/assets/public/cordova.js` | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` | 小小列車長：`android/app/src/main/assets/public/cordova_plugins.js` | 標準 Capacitor/Cordova 空相容檔，非遊戲內容；保留 |
| `android/app/src/main/assets/public/cordova.js` | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` | 小小列車長：`ios/App/App/public/cordova.js` | 標準 Capacitor/Cordova 空相容檔，非遊戲內容；保留 |
| `android/app/src/main/assets/public/cordova.js` | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` | 小小列車長：`ios/App/App/public/cordova_plugins.js` | 標準 Capacitor/Cordova 空相容檔，非遊戲內容；保留 |
| `android/app/src/main/assets/public/cordova_plugins.js` | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` | 小小列車長：`android/app/src/main/assets/public/cordova.js` | 標準 Capacitor/Cordova 空相容檔，非遊戲內容；保留 |
| `android/app/src/main/assets/public/cordova_plugins.js` | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` | 小小列車長：`android/app/src/main/assets/public/cordova_plugins.js` | 標準 Capacitor/Cordova 空相容檔，非遊戲內容；保留 |
| `android/app/src/main/assets/public/cordova_plugins.js` | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` | 小小列車長：`ios/App/App/public/cordova.js` | 標準 Capacitor/Cordova 空相容檔，非遊戲內容；保留 |
| `android/app/src/main/assets/public/cordova_plugins.js` | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` | 小小列車長：`ios/App/App/public/cordova_plugins.js` | 標準 Capacitor/Cordova 空相容檔，非遊戲內容；保留 |
| `ios/App/App/public/cordova.js` | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` | 小小列車長：`android/app/src/main/assets/public/cordova.js` | 標準 Capacitor/Cordova 空相容檔，非遊戲內容；保留 |
| `ios/App/App/public/cordova.js` | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` | 小小列車長：`android/app/src/main/assets/public/cordova_plugins.js` | 標準 Capacitor/Cordova 空相容檔，非遊戲內容；保留 |
| `ios/App/App/public/cordova.js` | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` | 小小列車長：`ios/App/App/public/cordova.js` | 標準 Capacitor/Cordova 空相容檔，非遊戲內容；保留 |
| `ios/App/App/public/cordova.js` | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` | 小小列車長：`ios/App/App/public/cordova_plugins.js` | 標準 Capacitor/Cordova 空相容檔，非遊戲內容；保留 |
| `ios/App/App/public/cordova_plugins.js` | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` | 小小列車長：`android/app/src/main/assets/public/cordova.js` | 標準 Capacitor/Cordova 空相容檔，非遊戲內容；保留 |
| `ios/App/App/public/cordova_plugins.js` | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` | 小小列車長：`android/app/src/main/assets/public/cordova_plugins.js` | 標準 Capacitor/Cordova 空相容檔，非遊戲內容；保留 |
| `ios/App/App/public/cordova_plugins.js` | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` | 小小列車長：`ios/App/App/public/cordova.js` | 標準 Capacitor/Cordova 空相容檔，非遊戲內容；保留 |
| `ios/App/App/public/cordova_plugins.js` | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` | 小小列車長：`ios/App/App/public/cordova_plugins.js` | 標準 Capacitor/Cordova 空相容檔，非遊戲內容；保留 |
| `public/textures/aircraft.png` | `426b94f8263b65c0b0ea80d66f98c948d1fa14bf2701567aea963876a0edeffd` | 島嶼飛行學校：`public/textures/aircraft.png` | 退役拆分作來源，合併保留；不再拆成新 App |
| `public/textures/train.png` | `dd40c889e7a3d195977fc9e701d0e1edb3c6a88915767bee662c95e051320921` | 島嶼鐵道學校：`public/textures/train.png` | 退役拆分作來源，合併保留；不再拆成新 App |
| `src/games/flight/audio.js` | `afd50b79359e1483d153f8e86ab2a946a33710f107d4fbfc70f6bd7b50384fbf` | 島嶼飛行學校：`src/audio.js` | 退役拆分作來源，合併保留；不再拆成新 App |
| `src/games/flight/instruments.js` | `45aab04200eddfd385cd5612827d33f36273e8d1dee85c6715a9d4cc106dcd16` | 島嶼飛行學校：`src/instruments.js` | 退役拆分作來源，合併保留；不再拆成新 App |
| `src/games/flight/physics.js` | `03d5b2e92347222e0736a22c30d7ba26624228515d863daac61c817f6b7868a8` | 島嶼飛行學校：`src/physics.js` | 退役拆分作來源，合併保留；不再拆成新 App |
| `src/games/train/audio.js` | `8b01e658db151d4082b53afc89c133ffeb197829d9cdc69f11ff1c1ec33c0dee` | 島嶼鐵道學校：`src/audio.js` | 退役拆分作來源，合併保留；不再拆成新 App |
| `src/games/train/game.js` | `783956e37c0fcbe00f0897aae56fb5bd5169c8c4345200cc7699e5a1afc36990` | 島嶼鐵道學校：`src/game.js` | 退役拆分作來源，合併保留；不再拆成新 App |
| `src/games/train/physics.js` | `143fd1193b7719468a59d1e426bf900f5284ac062cbf22c05579a037a4185e66` | 島嶼鐵道學校：`src/physics.js` | 退役拆分作來源，合併保留；不再拆成新 App |

## 相似但不同的原始碼

| 本作檔案 | 作品 | 文字相似度 | 處理方式 |
|---|---|---|---|

## 限制

SHA-256 只能證實位元組相同，無命中不能證明美術、玩法或生成模板不同。相似度僅補充同相對路徑的 JS／CSS，不能代替法律或 Apple 判定。夜行列車若目錄只有重製企劃而無 runtime，不能當作完成該作執行檔比較。其他線路完成後須以最終簽章包重驗。
# 2.7.0 整合補充

2026-10-16：下方既有跨作品雜湊表與 shared-assets.json 保留為前輪快照，不冒稱全表已重掃。本次新增的來源範圍只有小小列車長 dispatch 程式／關鍵測試與原 LICENSE／NOTICE，逐檔來源、目的、授權與 SHA-256 見 `../merge-assets.json`。未匯入照片、圖鑑圖片、原音檔或未知權利素材。保留同源交通內容，不用改名或重編碼掩飾重複。
