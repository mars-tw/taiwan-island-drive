# R3 上架可能性優化交付

2026-10-15；版本 **2.6.0**；分支 **r1-fun-polish**。僅本機修改與 commit，沒有 push、部署、商店操作、對外傳訊或派工。原生版本欄位預備為 2.6.0／build 2，尚未簽章或上傳；送審時仍須確認最終 build number。

## Apple 4.3 風險：中

既有交通學院維持合併式更新，沒有再拆飛機／鐵道 App；首頁立即可玩的三站觀察課，有持續煞車、號誌等待、停車／車門互鎖、跑道觀察與逐站保存，與小小列車長的數字作答不同。產品區隔見 `store/DIFFERENTIATION.md`，逐一比較其餘 13 款。

不能評低：帳號有同時退件背景、飛行／鐵道有同源內容、缺本輪原生實機與真實親子 beta 回饋。新課使用既有工具圖片與互動儀表，沒有新角色或敘事演出，不能說是整款遊戲美術重製。4.2.6 的內容提供者／權利與直接提交關係，需帳號持有人提供真實證明；程式差異或 AI 工具紀錄無法替代。

## 三項最大改進

1. **停、看、再出發三站觀察課。** 首屏入口直接可玩。路口必須按住煞車降到零，再等 4 秒清空；月台停穩才准開門，等朋友上車、關門後才准出發；跑道主動等候後再確認。錯誤操作只有提示，不會偷通關。每站完成存一次，背景／失焦暫停並釋放輸入，重開從尚未完成站的起點接續。另有安全觀察章，原 12 關、36 星與 3 個工具章保留。
2. **真正修好網頁離線進入 3D 模式。** 音樂原已加入 precache，但 Service Worker 副檔名白名單不接受音訊，會使整批安裝失敗；新增音訊支援。另修正 `Vary: Origin` 導致匿名模組／樣式無法命中既有快取：只對同源靜態檔案忽略 Vary。新增 3 項測試，並實際斷網重載新課與汽車／火車／飛機。
3. **兒童入口與上架證據。** 關閉原生 logging、保留 WebView debugging=false、移除 Android INTERNET；家長關卡後才有本機隱私／支援頁，支援頁只顯示地址，不開外站。清除英文裝飾／暫停／結果殘字，調整 iPhone SE 橫直版面。備妥區隔、共用素材、政策、商店文案、英文審查備註與真實截圖草稿。

## 驗證與證據

均為本線路的本機確定性測試與無頭 Chromium，不是獨立模型覆核、親子 beta 測試或原生實機驗收。Playwright 使用既有 `1.63.0-alpha-2026-08-31`，全程 `headless:true`，本機 preview `http://127.0.0.1:5113/`。

| 項目 | 結果 | 證據 |
|---|---|---|
| `npm test` | VERIFIED：147／147；保留原 134 項，新增安全課 10 項、離線 3 項 | `evidence/r3-store/unit-tests.txt` |
| Python 原生截圖政策測試 | VERIFIED：6／6；非 iOS 執行測試 | `evidence/r3-store/python-tests.txt` |
| `npm run build` | VERIFIED：表面素材檢查、Vite build、76 個 precache 檔案 | `evidence/r3-store/build.txt` |
| `npm run native:build` ＋ native package checker | VERIFIED：web payload 建置及 26 項來源／打包條件；非 IPA／AAB | `evidence/r3-store/native-build.txt`、`native-check.txt` |
| 新審查員路徑 | VERIFIED：12 尺寸、101 項檢查；0 runtime errors、0 外部請求 | `evidence/r3-store/review-path.json`、`review-path.txt` |
| 既有手機完整矩陣 | VERIFIED：100 情境、578 次控制檢查、0 runtime errors／外部請求 | `evidence/r3-store/mobile-check.json`、`mobile-check.txt` |
| 既有 reachability | VERIFIED：3 視口 × 7 情境；所有主要控制可達 | `evidence/r3-store/reachability.txt` |
| 既有 flight layout | VERIFIED：7 尺寸 × 2 模式 × 2 儀表狀態，共 28 項 | `evidence/r3-store/flight-layout.json`、`flight-layout.txt` |
| 素材 SHA-256 | EXECUTED：13 個 sibling 目錄、319 個本作 runtime 檔；12 個相同檔案／24 個對照，其中 8 個為退役拆分作同源內容，4 個為標準空 Cordova 相容檔 | `store/shared-assets.json`、`store/SHARED_ASSETS_AUDIT.md` |
| 截圖／文案／版本核對 | VERIFIED：指定 16 張商店草稿 PNG 尺寸與 SHA-256；名稱／副標／關鍵字限制、來源版本 | `evidence/r3-store/evidence-check.json`、`store/screenshots/manifest.json` |
| 秘密掃描 | VERIFIED：指定 key 格式零命中；未讀取全機 `.secrets` | `evidence/r3-store/secret-scan.txt` |
| frame p95 三跑 | 並發載量測，僅供參考：9 組三跑中位數 16.7～66.6ms，包含超過 18ms 的情境；出貨效能閘 BLOCKED，須閒置重測 | `evidence/r3-store/frame-times.txt` |

新路徑尺寸：320×568、568×320、390×844、844×390、440×956、1366×600、1280×640、768×1024、1024×768、1376×1032、430×932（DPR 3）、1032×1376（DPR 2）。每種尺寸皆以正常 UI 與真實時間完成三站、返回、重載、核對存檔。兩個商店尺寸另外測家長錯答／取消／正答、煞車取消、失焦暫停、離線重開新課與三種 3D 交通工具。

自動操作的完整新課路徑實測為 16.484～23.086 秒；這是按鈕定位後的自動流程時間，並非兒童理解時間或人工 beta 完成時間。指定商店圖共 16 張，連同矩陣首頁圖共 26 張，皆核對 PNG 尺寸與 SHA-256。

新課沒有直接寫成功旗標、存檔或瞬移。原有 R1 reachability 為了打開結果選單，保留既有距離快轉；它只證明控制可達，不拿來當新課的真實完成證據。R2 既有物理迴歸也保留，沒有刪測試或放寬斷言。舊 runner 僅新增 `EVIDENCE_FOLDER` 選項，讓本輪結果落在 R3，R2 歷史證據保留。

## 商店與素材交付

- `store/LISTING.zh-TW.md`：繁中名稱、副標題、前三行招牌玩法、完整說明、關鍵字、Google 短說明、更新說明，PREPARED。
- `store/APP_REVIEW_NOTES.en.md`：英文三分鐘路徑與缺件界線，PREPARED。
- `store/SCREENSHOTS.md`：每張真實畫面及一句說明。1290×2796／2064×2752 各 8 張，VERIFIED 為本機瀏覽器畫面，**不是原生截圖**。
- `evidence/r3-store/before/`、`after/`：前三視口修改前首頁、其他尺寸修改後首頁與既有 3D 關卡結果。所有尺寸的首頁含在兩個截圖目錄，PNG hash 見 `evidence/r3-store/evidence-manifest.json` 與 `store/screenshots/manifest.json`。
- `store/PRIVACY_AND_POLICY.md`、`DATA_SAFETY.draft.json`：本機資料、網路用途、Kids Category、PrivacyInfo 與唯讀 native-kit 核對；Console 實填與簽章成品 BLOCKED。
- `store/COPY_REVIEW.md`：mode 2 原句／原因／改寫紀錄，未變造規格、數字、權利或 beta 回饋。

## 八大面向與未完成

| 面向 | 結果／缺件 |
|---|---|
| 美術 | EXECUTED：本作觀察簿 UI、既有圖片與模型沿用；無新增 bitmap，不宣稱用了 gpt-image-2。新情境原畫與乘客動畫 BLOCKED／未製作。 |
| 按鈕 | VERIFIED：新課主操作至少 60px、窄橫向返回／暫停至少 44px，邊界與命中點檢查。既有主要控制矩陣保留。 |
| 選單 | VERIFIED：新課單站頁、可返回／暫停，首屏入口；家長設定仍可捲動，關閉與返回保留。 |
| 人物 | BLOCKED／未製作：新人物表情、角色化模型缺件。沒有把靜態圖片當成人物演出。 |
| 地圖模型 | EXECUTED：使用既有台灣景觀與模型，沒有新增程序化方塊模型。新地景 GLB 缺件。 |
| 技能／操作 | VERIFIED：時序判定、門鎖條件、錯誤提示、觸控取消、暫停、逐站存檔與章。 |
| 角色樣子 | BLOCKED／未製作：無新增角色，不聲稱亮度／飽和雙閘或正側背三視圖通過。 |
| 動作流暢度 | 保留既有 3D 物理動畫；新課用文字號誌與進度儀表，不把圖片晃動稱為骨架動畫。 |

其餘 BLOCKED：閒置機器效能出貨閘；本輪 iPhone／iPad／Android 實機與 WebKit 驗收；新簽章包與最終 SDK／權限網路稽核；TestFlight 親子回饋；R1 大廳音樂權利確認；帳號持有人對 4.2.6 的真實關係與素材權利證明。沒有把上述項目稱為完成，也沒有向 Apple／Google 上傳任何東西。

共用素材的剩餘範圍也沒有假稱清零：舊飛機／鐵道的 8 個同源程式／材質檔採合併保留，未藉改檔名或重新編碼消除 hash 命中。這不符合「所有非第三方重複檔都換掉」的字面目標，列為未完成；本輪交付的是新增可見玩法與合併產品證據，其他拆分 App 的退役／帳號處置須由總稽核處理。

重跑方式：設定 `PLAYWRIGHT_MODULE` 指向本機既有 Playwright `index.mjs`，啟動無頭用途的 Vite preview，設定 `BASE_URL`；跑舊 runner 時加 `EVIDENCE_FOLDER=docs/evidence/r3-store`。執行 `npm test`、`npm run test:store`、既有三個版面 runner、`npm run native:build`、`node scripts/verify-native-package.mjs`、`node scripts/verify-store-evidence.mjs`。所有狀態只對本輪留下的證據負責，不代表 Apple 通過保證。
