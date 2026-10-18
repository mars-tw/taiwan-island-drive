# 島嶼交通學院：新內容第 8 輪

VERIFIED，2026-10-19。版本 **2.20.0／原生來源 build16**，分支 **r1-fun-polish**，基線 ca8bf9e。已完成 R7 Muse 審查五項的本機修正、無頭實玩與原尺寸證據；沒有新增第四課或其他玩法。Muse 複審尚未發生，不宣稱已取得 8 分。

三課入口：**首頁「海岸實作課」→ 選課 →「一起出發」**。全完成後入口改為「再玩海岸實作課」，各課保存完成標記，可看本趟紀錄或再玩。

| 課程 | 本輪修正、玩法與完成回饋 |
|---|---|
| 把蛋糕平穩送到 | 踩踏板、放開、轉向與慢停仍使用實際駕駛讀值。彎曲箭頭、亮起的轉向鍵與短句使用同一扶正方向；「坐穩了」、滿綠條及勾同步。特寫與道路分開，左、右彎路肩不再被蓋住。保留三站起步坡、左右連彎、臨停再起步與分享結局，扶正紀錄改為「練會扶正」。 |
| 路口停看聽 | 停穩、看左右，每位朋友起步前再確認來源方向；錯邊、閒置、提早出發都不能放行。三位等待者沿人行道錯開，確認前不出現在過街圖層；奶奶從較後方路緣走入斑馬線。收起重複提示條，避免遮頭；放大既有跨步／抬膝原畫，安全通過人數即時更新。 |
| 形狀車票，找對月台 | 形狀與顏色都對才能停穩開門。人物走在月台牌前，排隊間距拉開，依序經候位、門口、座位；上客時前進鎖定、大車票保留。最後一人入座後滑門關閉、停留，再結算。錯站保持關門，改選從原車位續行。 |

首頁明寫「主線學生證」與「獨立海岸」，不將兩套進度混成同一完成度。完成三課後不再顯示「接下第一份調度單」。三張結算圖帶放大、標第 1～3 站，可對回道路、朋友次序與形色；完成回饋維持全員慶祝，沒有淘汰、競速或倒數懲罰。

## 五項驗收與原尺寸證據

以下手機 PNG 全在 **docs/content/r8/**，均 **390×844**。acceptance.json 逐項附完整路徑、原圖 SHA-256 與當時狀態；screenshots.json 收錄全部擷取，沒有重畫像素、拼圖或事後加字。

1. **方向與回穩**：phone-cake-proof-left-bend.png → phone-cake-proof-right-bend.png → phone-cake-proof-settled.png，來自同一次第 2 站實玩；兩彎中途有實際慢停再起步，沒有直接指定力道。前兩圖各呈相反傾斜與對應彎箭頭／亮鍵，最後一圖文字、滿綠條、勾一致。phone-cake-starting.png、phone-cake-turning.png、phone-cake-settled.png 為另一組起步、轉向與回穩；recovery-1／2／3、assisted-slowing 另保留原圖與讀值。這是 2D 分層及彈簧回饋，不宣稱奶油流體或新 3D 物理。
2. **道路視野**：同組 proof-left-bend／proof-right-bend 原圖可見從車前到彎口與路肩；特寫占獨立區域，瀏覽器檢查兩視窗矩形不相交。phone-cake-bay-stopped.png → phone-cake-bay-restarted.png 補第 3 站臨停、再起步過程；stage-1／2／3-playing 與各站 result 保留完整站序。
3. **等待者與順序**：phone-crossing-stage-2-decision-1.png → stage-2-confirmed-1.png → phone-crossing-grandma-mid-pose-0.png → mid-pose-1.png。判斷點三人都在人行道外緣、頭身可分辨；確認後只有先行者踏入斑馬線。各站另有 decision-1／2／3、wrong-side、early-departure、passed-1／2／3 與 clear，補九次判斷、錯邊、閒置、出發提醒與安全通過數。圖像使用既有兩張不同肢體原畫，沒有以單圖晃動冒充步態。
4. **上車四連圖**：phone-tickets-stage-3-door-open-waiting.png → stage-3-doorway.png → stage-3-seat-1.png → stage-3-closed-before-result.png。可核對月台／車內 3＋0、3＋0（第一人門口）、2＋1、0＋3；人物不再被站牌切斷，關門圖仍在上客階段，之後才結算。第 1、2 站也各有相同四圖、wrong-closed、seat-2／3 與 result；每站三次實際連點前進均不移動列車、不改人數。
5. **首頁與三站回顧**：phone-home-proof-completed.png、phone-picker-proof-completed.png，以及 phone-cake-stage-3-result.png、phone-crossing-stage-3-result.png、phone-tickets-stage-3-result.png。首頁分開標主線與獨立海岸；進選課可見三課完成。兩張首頁／選課補圖使用 browser-play.json 內本次九站實玩保存的紀錄重新開啟，只重建正常存檔外層，沒有指定完成數或更改成果。各課 saved-result 是原實玩完成後重開的畫面。三站道路、先行者、形色對照可由同課 stage-1／2／3 遊玩原圖逐項核對。

## 審查精選：只看 review-set

**docs/content/r8/review-set/** 共 15 張原 PNG 位元組直接複製，索引與來源雜湊在 review-set-manifest.json。

- 01～05：同趟左彎、右彎、回穩三格；臨停；蛋糕結算。
- 06～09：第 2 站三人候位；奶奶跨步／抬膝兩格；路口結算。
- 10～14：第 3 站候位、門口、第一人落座、全員落座且關門四格；車票結算。
- 15：完成三課後首頁。

蛋糕 5、路口 4、車票 5、共用首頁 1。15 張無法同時放入九站每個分支的所有連圖；額外原圖仍附在上述五項與 acceptance.json。未把精選沒有出現的速度數值、其他站連點或真人辨識稱為審查員已看見的效果。

## 驗證

| 項目 | 結果與證據 |
|---|---|
| npm test | VERIFIED：201／201、零失敗，原有 198 項測試內容完整保留，新增三課各一項。unit-tests.txt；release-verification.txt 比對基線測試全文，僅忽略作業系統換行差異。 |
| npm run build | VERIFIED：車輛表面驗證與正式建置通過，221 個本機快取檔，無新增依賴。build.txt。 |
| R8 無頭實玩 | VERIFIED：七組流程共 124 組檢查、108 張原始擷取，三課九站完成、各課重開保存、九次來源方向確認、錯邊／提早出發、三站錯站／改選與上客連點、離線、拒絕儲存、暫停及減少動態通過。browser-play／matrix／done-matrix／cake-proof／resilience／store／home-proof.json；零執行錯誤、HTTP 失敗與外部請求。 |
| 控制與 RWD | VERIFIED：8 視口，選課／說明／遊玩／休息共 80 組、完成頁 24 組。可見兒童觸控目標 ≥60px，在視口內可點；手機沒有鍵盤說明。完成頁合成資料僅測控制，不產生審查圖；首頁補圖使用實玩保存紀錄。 |
| npm run test:merge，5286 | VERIFIED：132 組、11 尺寸；既有數學→火車→汽車→飛機→學生證保存重開全過，25 張原圖。merge-test.txt、merge/merge-path.json。 |
| npm run test:store，5113 | VERIFIED：101 組、12 尺寸、26 張原圖；冷開、第一目標、續玩、保存、拒絕儲存及安裝後離線通過。store-review-test.txt、store/review-path.json。 |
| 並發機況效能參考 | VERIFIED：6 模式 × 3 視口 × 3 次，共 54 次 2 秒 rAF 取樣。每次 p95 均 ≤16.8ms，18 組中位數最高也為16.8ms，低於18ms。performance.json／performance-test.txt。這是本機幀間隔參考，不代表原生實機或 CPU／GPU render time；沒有搶占其他線路以製造乾淨機況。 |
| 發布檔案與秘密掃描 | VERIFIED：套件、lock、汽車版本標示、模型目錄與原生來源同步 2.20.0／build16；全部原尺寸與 SHA-256 讀回吻合，15 張精選與來源逐位元組相同。repo 文字秘密掃描零命中，沒有讀取秘密目錄。release-verification.txt、secret-scan.json、screenshots.json、review-set-manifest.json。 |

瀏覽器各流程結束即關閉；兩個預覽埠依序使用並已關閉，沒有留下 dev server。before-after.json 對照 R7 的回穩、候位、上客與首頁原圖。既有未追蹤 Muse 審查文件全部保留，不納入本輪提交。

新增商店原尺寸截圖：**docs/store/screenshots/content-r8/cake-closeup-1290x2796.png** 與 **cake-closeup-2064x2752.png**；以相應 CSS 視口與 DPR 無頭擷取，不放大舊圖。既有商店截圖全部保留。合併／商店回歸的額外圖分別保存在 content-r8/merge、content-r8/store。

新增美術 **0**，產圖呼叫 **0**，完整沿用受管原畫與色票；art-manifest.json 明列來源。新增箭頭、回穩條與站序是操作資訊，沒有以幾何圖塊代替角色或背景。沒有新增套件、外部連線、帳號、廣告、付費或第三方 SDK。所有測試只用背景／無頭，本機提交，不推送或部署。

繁中文案依 speak-human-tw mode 2 直接修正：

| 原句 | 原因 | 改成 |
|---|---|---|
| 坐穩了＋以傾斜量畫空條 | 文義與視覺互相矛盾 | 坐穩了 ✓＋回穩滿綠條 |
| 放開，扶正 | 不知道按哪一邊 | 鬆踏板，輕輕左／右轉扶正 |
| 扶正 N 次 | 易當成失誤次數 | 練會扶正 N 次 |
| 學生證 0／4 章 · 海岸 3／3 課 | 沒有交代兩套進度關係 | 主線學生證 0／4 章 · 獨立海岸 3／3 課 |
| 海岸實作課／接下第一份調度單 | 全完成後仍像尚未開始 | 再玩海岸實作課／開始主線：列車數學課 |

Apple 4.3 風險：**中**，為本機內容判斷。駕駛受力、來源方向確認與雙線索停靠各有不同操作因果；仍共用課程合集外框，本輪細修與截圖不能證明 Apple 已接受，也不能預先宣稱 Muse 已給 8 分。

BLOCKED：實體 iPhone／iPad、原生語音及觸控實測需對應裝置；真人親子試玩／不代讀辨識需兒童與家長；乾淨機況效能需獨占硬體；Muse ≥8 複審需審查員實際重看精選。這些不列成本機已完成，也未假造原生 build 或已上架結果。
