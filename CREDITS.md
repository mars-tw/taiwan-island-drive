# CREDITS

## 2.12.0 R8／送審前深度優化第一輪

- 八次實際生成、八個新設計，工具 `image_gen.imagegen`；實際模型 slug 未揭露，manifest 記錄 null。沒有把計畫中的 gpt-image 型號當成模型證據。
- 空中海岸背景、安全車窗內阿路、停靠鐵軌列車、海浪交通票框、海岸星章、燈塔路牌、新 Logo、App 圖示提案。含兩個沿用R5月台的細節裁圖，共11個 Web 輸出、2,246,041 bytes；1024圖示提案留文件區，不進包。原圖、opaque master、alpha mask、清邊、縮圖與 hash 見 `docs/art/PROMPTS_R8.json`、`docs/art/asset-manifest-r8.json`、`scripts/prepare-art-r8.py`。
- 阿路與列車使用本專案受管角色圖作身份參考，沒有新增第三方下載素材；AI生成權利與程式碼MIT授權分開記載，不宣稱平台未授予的排他權。原生圖示catalog沿用R7，本輪只更換Web圖示並交付提案。
- 既有Blender車輛、角色三視圖、乘客步態、字型、音樂、Apache-2.0／CC BY 4.0移植、LICENSE與NOTICE完整保留。沒有新增外部連結或第三方SDK。

## 2.11.0 R7／美術第四輪

- 六次實際生成，工具 `image_gen.imagegen`；工具未提供模型slug，記錄為null並註明，沒有假填gpt-image版本。角色沿用本專案阿路圖作身份參考；完整提示、共同前綴、來源路徑見 `docs/art/PROMPTS_R7.json`，三視圖見 `docs/art/character-sheets/`。
- 14個Web素材：清水斷崖式海岸背景、Logo、App圖示192／512、直行／轉彎／收星三姿勢、無線電頭像、交通面板、星章、彎路牌、跑車背面、飛機背面、終點旗。母版、opaque master、alpha mask、輸出hash與後製見 `docs/art/asset-manifest-r7.json`、`scripts/prepare-art-r7.py`。
- 13個本機原生圖示匯出與來源同步，未建簽署包、未上傳；73個其他原生資源保留，見 `resources/branding/native-icons-r7-report.json`。
- 新圖為本專案AI生成作品，未摻入第三方下載素材；不主張平台未授予的排他權。既有Blender網格、R5乘客、R6教練旗姿與車圖及下方舊授權、音樂與NOTICE仍保留。跑車以既有Blender模型為底，在Blender 5.2無頭CLI做圓角及法線重工；原GLB與新.blend都保存在 `docs/art/source/r7/`，語意材質／UV／車輪階層通過原有表面守門。其他車模未改。

## 2.10.0 R6 海岸圖卡與全屏綠旗慶祝

- 九次實際生成／編修，工具 `image_gen.imagegen`。工具沒有提供模型 slug，manifest 記 `null` 與工具名。完整共用風格前綴、提示、來源路徑與參考圖見 `docs/art/PROMPTS_R6.json`；角色／App 圖示使用本專案 R5 阿路作身份參考，台北夜景以本輪自製城市原圖編修。
- 39 個 Web runtime 檔案：海岸背景、五張台灣風景（汽車台北夜駕與飛機都會日景各自對應）、四車各五色、三交通工具、阿路兩種不同手臂／旗幟姿勢、空白票框、三枚獎章、星星彩帶、Logo、同一 App 圖示的 192／512 版本。原圖、opaque master、原 alpha mask 與來源 SHA-256 留在 `docs/art/source/r6/`，後製與檔案 hash 見 `asset-manifest-r6.json`。
- 既有 R5 六位全身乘客各兩姿勢、藍橘車廂與調度旗／站牌延用；本輪固定乘客身份並補沿通道路徑。700ms 位置補間搭配兩張真肢體姿勢，並非完整骨架走路循環。阿路採兩張不同手臂／旗幟姿勢，減少動態時不播放。
- 本機 iOS 與 Android 已啟用的 icon catalog 同步本輪綠旗石虎，共 13 個 PNG 匯出；保留舊創作 master、原始 launcher／splash 與 v2 歷史報告。當次 hash、13 檔尺寸／RGB／RGBA、73 個其他原生資源未變的證據在 `resources/branding/native-icons-r6-report.json`。`store/assets/app-store-icon-r6-1024.png` 是同圖本機提案，沒有上傳、簽署或原生實機驗證。
- 後製只做原生 alpha 清理、連通元件分離、裁切、抗鋸齒縮圖、透明 RGB 清零與 WebP q84 壓縮。OpenAI 生成圖片的權利依適用條款與法律判斷，不因程式碼 MIT 自動將圖像重授 MIT。所有既有第三方模型、字型、音樂、移植教材及完整 NOTICE 保留。

## 2.9.0 R5 阿路綠旗與登車票

- 本輪十次生成／編修實際工具為 `image_gen.imagegen`；工具沒有提供模型 slug，記 `model_slug: null`，不以規劃中的模型名稱冒充。提示見 `docs/art/PROMPTS_R5.json`，共用前綴與R4一致，固定左上45度光源與墨藍輪廓。
- 27個視覺設計、28個runtime檔：海風月台／海島天空、三種交通工具、兩姿勢阿路、六位乘客各兩步態、前藍後橘車廂、票券、獎章／調度旗／站牌、Logo、同一App圖示兩尺寸。原畫、opaque master、原生alpha mask及SHA-256在 `docs/art/source/r5/`、`asset-manifest-r5.json`。
- 只以本專案R4阿路作角色參考；其他輸入皆文字。OpenAI生成圖像之權利依適用條款與法律，沒有重新授為程式碼MIT。確定性後製只做native alpha清理、裁切、透明RGB清零、縮圖與WebP壓縮，沒有程序方塊代替新美術。
- 首頁是選課插畫；進入3D課程仍使用原Blender模型。海島天空是裝飾遠景，軌道／車輛／訊號仍由原即時3D與物理產生。沒有新第三方SDK或遊戲外連。Web圖示已接入，原生catalog提案未套用。
- 舊圖、車模、字型、音樂、移植教材的授權與完整NOTICE全部保留如下。R4描述是歷史交付，不作本輪動畫狀態的證明。

## 2.8.0 R4 陽光海岸交通繪本

- 本輪 8 次內建 `image_gen.imagegen` 生成／編修：海岸學院背景、石虎阿路教練、六格交通／徽章／書包圖示集、交通路牌框原畫、繁中標題 Logo、App 圖示提案、六位乘客圖集與該圖集的飽和度修訂。工具沒有回傳模型 slug，因此記錄實際工具名，**不推定為 gpt-image-2**。共 17 個獨立視覺設計，輸出 18 個 runtime 圖檔（App 圖示另有 192／512 兩尺寸）。
- 檔案：`public/art/r4/`；來源原畫、原生 alpha／RGB 與 mask 保留於 `docs/art/source/`。完整提示、來源／交付 SHA-256、尺寸與後製見 `docs/art/PROMPTS.json`、`docs/art/asset-manifest.json`、`scripts/prepare-art-r4.py`。
- 全部使用同一風格前綴；乘客修訂以本輪生成圖為參考，沒有供應第三方藝術參考圖；未複製其他遊戲的 bitmap。圖像由本專案透過 OpenAI 內建工具產生；生成圖像的權利依適用服務條款與法律判斷，**不因程式碼 MIT LICENSE 自動推定圖像為 MIT**。既有第三方素材及下列完整授權記錄保留。
- 後製為使用者要求的 alpha 清理、RGBA／遮罩保存、圖示裁切與縮圖、透明區 RGB 清零、WebP 壓縮。UI 紋理由完整路牌原畫上緣裁切，避免放大整框遮住即時文字。靜態教練沒有人物動畫與三視圖；App 圖示本輪接入 Web，原生 catalogs 尚未替換。
- 開源研究只借鏡 GCompris 的活動入口與 SuperTuxKart 的親切形態原則；來源連結與實際應用記於 `docs/art/ART_DIRECTION.md`，未複製其美術素材。既有 Blender 交通模型、音樂、字型及移植授權完全保留。

## 2.7.0 列車數學課

- 來源：小小列車長／Taiwan Train Math，Copyright 2026 mars-tw，repo `taiwan-train-math`，來源 commit `7e25c749f073de321dabc25f982ee41ecac62dca`。
- `src/games/math/dispatch.js`：移植 `src/dispatch.js`，程式 Apache-2.0；原教育文字 CC BY 4.0。保留原教材與守恆模型，檔頭新增署名，學院外殼改標題、任務交接、返回與暫停；新 glue code 依主 repo MIT。
- `tests/shared/dispatch-ported.test.js`：移植來源 `tests/dispatch.test.mjs` 的完整第一個測試，保留三年齡 × 12 班、守恆／錯答／重複發獎與序列化斷言；改 import 路徑並移除該檔未移植模組的 imports，其餘存檔橋接由新整合測試覆蓋。Apache-2.0。
- 原 Apache 完整授權與原 NOTICE 原文位於 `public/licenses/taiwan-train-math/`，會隨 Web／native payload 打包。原教材文字 CC BY 4.0 條款：<https://creativecommons.org/licenses/by/4.0/>。此為文件中的授權地址，遊戲 UI 沒有外連。
- 本輪沒有複製來源照片、品牌圖、生成原畫或音檔，沒有假報 `gpt-image-2` slug。車廂／座位用 DOM/CSS 呈現，沿用主 repo 系統字型、既有交通圖與 WebAudio 三和弦。
- 精確檔案、雜湊與變更說明見 `docs/merge-assets.json`。來源 NOTICE 提到的圖鑑／照片授權檔不屬本輪使用範圍，沒有把整個來源素材庫重新授為 MIT。

本檔記錄 R1 起新增的素材來源。既有模型、貼圖與字型的授權見 `public/THIRD_PARTY_NOTICES.txt`、`docs/realism/README.md`，以及各模式在 `docs/editions/` 的製作文件。

## 音樂

| 檔案 | 來源 | 授權／備註 |
|---|---|---|
| `public/audio/lobby-theme.m4a` | 2026-10-15 由本機 AI 派工器 `music` 能力（worker `ace_step_turbo`，ComfyUI 上的 ACE-Step 1.5 turbo）生成。task id `25b5be10-465d-410c-a6d8-d7e5446c1ac1`，原始輸出 `DISPATCH_MUSIC_TURBO_25b5be10-465_00001.flac`（30 秒、48 kHz，SHA-256 `7e1d4536…d640f`）。提示詞：`cheerful bouncy instrumental for preschool kids game menu, ukulele, glockenspiel, light hand claps, soft marimba, major key, playful, 112 bpm, no vocals, seamless loop`。用 ffmpeg 裁掉尾端 3.5 秒靜音，保留 26.4 秒；開頭加 0.08 秒、結尾加 1.2 秒淡入淡出；以 loudnorm 調整到 −20 LUFS；轉成 AAC 96 kbps（SHA-256 `8a0c6d4a…6eba`）。 | 本機模型 README 標示為 MIT。生成音樂的著作權歸屬，各法域的規定還不一致。商店版若要採用，請家長／法務先確認。只在大廳播放，家長可以關閉（♪ 按鈕或家長設定的聲音開關）。 |

## 程式化效果（無外部素材）

- 星星、彩紙、貼紙彈出與三和弦音效：`src/shared/celebrate.js`，全部由程式產生（CSS 與 WebAudio 振盪器）。
- 汽車路上的金色星星：`src/games/car/game.js` 用 Three.js `ExtrudeGeometry` 產生。
- 飛機目標的星形與標籤：`src/games/flight/world.js` 用程式繪製。
# 新內容第一輪（2026-10-18）

海岸實作課新增生日蛋糕、小綠旗、行人／腳踏車／菜籃奶奶雙姿勢及海岸路口背景。實際工具 `image_gen.imagegen`，三次生成（含一張文件區三視圖），六個設計、九個遊戲用檔；模型 slug 未揭露。沿用 PROMPTS_R8 的完整風格前綴。原畫、提示、格子裁切及 SHA-256：`docs/content/r1/art/`；遊戲檔 `public/art/content-r1/`。由專案為本作生成，隨本 MIT 專案提供；不含外部下載圖庫。角色移動使用兩張不同腿部／踩踏姿勢，不宣稱骨架動畫。

# 新內容第二輪（2026-10-18）

六次 `image_gen.imagegen` 生成六個設計：三層實體月台場景、分享蛋糕、過街朋友揮手、乘客坐好的列車，以及榕樹巷口、黃昏燈塔兩張獨立路口場景。原畫與完整提示在 `docs/content/r2/art/`，遊戲用 WebP 在 `public/art/content-r2/`；只做格式轉換，沒有以程式拼成假遊玩截圖。模型 slug 未揭露。維持R1完整風格前綴及藍衣兒童、黃帽騎士、綠衣奶奶的配色，隨本MIT專案提供；無外部下載圖庫、歌曲或SDK。完成圖是靜態敘事插畫；過街與上客另用既有兩張肢體姿勢，不宣稱骨架動畫。

# 新內容第三輪（2026-10-19）

新增五張 `image_gen.imagegen` 美術：海風起步坡、燈塔連續彎、榕樹臨停灣、單一橫向月台、藍黃側面列車。沿用同一完整風格前綴；模型 slug 未揭露。原畫與實際提示／雜湊：`docs/content/r3/art/`，遊戲用 WebP：`public/art/content-r3/`。只做 PNG 至 WebP 轉格式並保留透明度；由本專案生成，隨 MIT 專案提供。人物、蛋糕、小旗、教練及結局沿用前輪受管美術。沒有新增外部下載素材、字型、SDK 或依賴。
