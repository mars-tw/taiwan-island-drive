# 島嶼交通學院：新內容第 9 輪

VERIFIED，2026-10-19。版本 **2.21.0／原生來源 build17**，分支 **r1-fun-polish**，基線 **7a01bfb**。本輪只修最後指定的奶奶前進步態，以及車票排隊、站牌遮擋與落腳面。蛋糕原有 8.2 分內容保留。兩項指定修正、三課實玩、存檔、原尺寸證據與本機品質閘已完成；其餘三項審查建議依本輪範圍保留。Muse 複審尚未發生，不宣稱已取得 8 分。

三課正常入口：**首頁「海岸實作課」→ 選課 →「一起出發」**。完成後可從「再玩海岸實作課」進入，查看本趟紀錄或重玩。免費、MIT、離線遊玩；未新增依賴、帳號、廣告、內購、外連或 SDK。

| 課程 | 做了什麼、怎麼玩與完成回饋 |
|---|---|
| 把蛋糕平穩送到 | 原玩法、美術、特寫與踏板保留；按住／放開踏板、左右轉扶正，三站起步坡、左右連彎、臨停再起步後一起分享。重新實玩、驗證存檔，補上臨停→再起步連圖。 |
| 路口停看聽 | 保留停穩、看左右、逐位確認來源方向的操作，只修奶奶的可見步行。跨步、抬膝、落腳三張不同肢體原畫，依序從左路緣經中線走到右路緣；到岸前安全通過數維持 0／3，到岸後才 1／3。三站完成後朋友揮手，紀錄保存。 |
| 形狀車票，找對月台 | 同時配對形狀和顏色，停穩才可開門。月台牌移到上方天空操作帶；三人沿鋪面單列排隊，前一位經門口、車廂走道、座位後，下一位才動身；列車下移對齊軌道。錯站不開門，上客時前進鎖定，全員進車廂並坐好、關門停留後才結算。 |

## R8 審查五項對照與原尺寸證據

本線路「蛋糕不動、只修奶奶與車票」為本輪範圍。所有手機 PNG 均為 390×844 原始無頭執行畫面，不拼圖、不放大、不後製加字；acceptance.json 逐項附完整路徑、尺寸、狀態與 SHA-256。

1. **VERIFIED：車票疊人與遮擋。** docs/content/r9/phone-tickets-stage-3-door-open-waiting.png → docs/content/r9/phone-tickets-stage-3-doorway.png → docs/content/r9/phone-tickets-stage-3-entering.png → docs/content/r9/phone-tickets-stage-3-closed-before-result.png。候位、門口、走道與落座各可數三人，人物矩形互不重疊、與站牌不相交，「✓ 停對了」完整露出。第 1、2 站也有同組證據。另保留三站 wrong-closed 與改選原圖；每站三次實際連點前進皆不移車、不改人數。
2. **VERIFIED：奶奶走過斑馬線。** docs/content/r9/phone-crossing-grandma-step-1.png → docs/content/r9/phone-crossing-grandma-step-2.png → docs/content/r9/phone-crossing-grandma-step-3.png → docs/content/r9/phone-crossing-stage-2-passed-1.png。三張使用不同原畫，人物框 x 依序為 63.28、121.47、209.45px，相鄰前進 58.19 與 87.98px；前三格安全通過數皆為 0／3，到岸後才 1／3。截圖只暫停 RAF 取樣，未直接指定遊戲時鐘或成果。
3. **PREPARED／本輪未實作：踏板按鈕狀態。** 依使用者明示蛋糕不動。現況：docs/content/r9/phone-cake-proof-left-bend.png、docs/content/r9/phone-cake-bay-restarted.png；橘色踏板與「鬆踏板」指示的既有問題仍保留。
4. **PREPARED／本輪未實作：每位朋友重置左右勾選。** 使用者將路口修改限定為奶奶步態，保留原確認流程。docs/content/r9/phone-crossing-stage-2-early-departure.png 證明提早出發仍被擋、車不動與人數不變；docs/content/r9/phone-crossing-stage-2-decision-2.png 可見兩勾仍保留，需要再次確認來源方向，這項閱讀負擔仍在。
5. **PREPARED／本輪未實作：縮小蛋糕特寫。** 依使用者明示蛋糕不動。現況：docs/content/r9/phone-cake-proof-left-bend.png、docs/content/r9/phone-cake-proof-right-bend.png，仍為原獨立特寫儀表與道路視窗。

## 審查精選集

VERIFIED：**docs/content/r9/review-set/** 共 15 張，每課各 5 張。全部由手機原圖直接複製，來源與 SHA-256 在 review-set-manifest.json。

- 01～05：蛋糕同趟左彎、右彎、回穩；臨停／再起步連圖。
- 06～10：路口提早出發提醒；奶奶三格前進；到岸後計數。
- 11～15：車票錯站關門；候位、門口、車廂走道、全員落座關門。

十五張上限優先呈現正在遊玩的因果。各課結算與重開保存原圖另在 r9/，未假稱審查員會在精選中看見它們；完整三站與分支紀錄在 browser-play.json、acceptance.json、screenshots.json。

## 驗證

| 項目 | 結果與證據 |
|---|---|
| npm test | VERIFIED：204／204、零失敗、零跳過。基線全部 201 項測試內容保留，新增三課各一項；unit-tests.txt。 |
| npm run build | VERIFIED：車輛表面檢查與正式建置通過，222 個本機快取檔，沒有新增依賴；build.txt。 |
| R9 無頭實玩 | VERIFIED：七組流程共 160 組檢查、126 張原始擷取。三課九站完成並重開保存；路口 9 次確認／9 位安全通過，車票 3 次錯站／改選與 9 人上車。零執行錯誤、HTTP 失敗與外部請求；browser-*.json。 |
| 觸控與 RWD | VERIFIED：8 視口，選課、說明、遊玩、休息 80 組，完成頁控制 24 組，實際候位／走道 24 組；可見可操作目標 ≥60px、未被遮住，手機沒有鍵盤說明。完成頁合成資料只驗控制，不產出審查圖；三課結算圖均來自實際完成。 |
| 離線與韌性 | VERIFIED：斷網重開後完成路口三站與 9 次確認，另驗證拒絕儲存、暫停、減少動態；resilience-test.txt、browser-resilience.json。 |
| npm run test:merge，5286 | VERIFIED：132 組、11 尺寸、25 張原圖；數學→火車→汽車→飛機→學生證保存重開全過，零錯誤與外部請求；merge-test.txt、merge/merge-path.json。 |
| npm run test:store，5113 | VERIFIED：101 組、12 尺寸、26 張原圖；冷開、觀察、第一目標、續玩、保存、拒絕儲存與安裝後離線全過，零錯誤與外部請求；store-review-test.txt、store/review-path.json。 |
| 原生離線素材包 | VERIFIED：npm run native:build 與 verify-native-package.mjs 通過 28 項；217 個本機檔案、remoteServer=false，新奶奶 PNG 已包含且雜湊與 runtime 原檔相同。native-build.txt、native-package-test.txt、native-bundle-manifest.json。這不是簽章、提交就緒或實機測試證明。 |
| 並發效能參考 | VERIFIED：6 模式 × 3 視口 × 3 次共 54 次、每次 2 秒 rAF 取樣，18 組三跑 p95 中位數最高 16.8ms，54 次個別 p95 最高亦為 16.8ms，低於 18ms。performance.json／performance-test.txt；以既有 measure-content-r8.mjs 指向 R9 輸出。這是並發機況幀間隔，不能當作乾淨機況、原生實機或 CPU／GPU render time。 |
| 發布檔案與秘密掃描 | VERIFIED：2.21.0／build17 同步，原圖尺寸與 SHA-256 讀回吻合，15 張精選與來源逐位元組相同，兩個商店原圖尺寸正確；repo 文字秘密掃描零命中，未存取秘密目錄。release-verification.txt、secret-scan.json、screenshots.json、review-set-manifest.json。 |

瀏覽器每組結束即關閉；5286、5113 預覽埠依序使用並已關閉。既有未追蹤 Muse 審查文件保留，不納入本輪提交。所有既有測試逐檔對照基線，不刪原測試、不放寬斷言；蛋糕原邏輯、三層受力、特寫與原 R1～R8 樣式皆保留。版本來源同步 2.21.0／build17，舊版號只保留於歷史報告與歷史驗證程式。before-after.json 與 docs/evidence/content-r9/ 保存前後及三視口原圖。

商店新增原尺寸圖：**docs/store/screenshots/content-r9/tickets-queue-1290x2796.png**、**docs/store/screenshots/content-r9/tickets-queue-2064x2752.png**。使用對應 CSS 視口與 DPR 直接擷取，既有商店截圖保留。合併與商店回歸額外圖分別在 content-r9/merge、content-r9/store。

新增美術 **1 張 runtime PNG**（奶奶落腳姿勢），**1 次 image_gen.imagegen 呼叫**。提示沿用 R7 完整英文前綴，參考既有奶奶身份，保留透明底；原圖、提示、處理規格、64px 預覽與雜湊在 docs/content/r9/art/。工具未回傳模型 slug，manifest 明列 null，未推測模型。亮度 0.507、飽和度 0.622、近黑 20.54%、低飽和 18.98%，通過既有門檻。另兩張步態、三位乘客、場景、列車均沿用受管原畫。

speak-human-tw mode 2：新增 1 句輔助說明。原句：無（新增車廂移動階段）；原因：讓螢幕閱讀器區分正在進車廂與已落座；新增：「朋友走進車廂找座位」。既有玩家操作提示保持原樣。

Apple 4.3 風險：**中**，為本機內容判斷。三課操作因果不同，本輪讓奶奶前進與單列上車更容易看懂；共用選課／三站／結算外框的既有風險仍在。沒有 Apple 審查結果，也沒有 Muse 複審 ≥8 的證據。

BLOCKED：實體 iPhone／iPad、原生語音及真觸控測試需相應裝置；真人親子試玩需家長與兒童；乾淨機況效能需可獨占硬體；Muse ≥8 複審需審查員重看 15 張精選。本輪更新原生版本來源並建置離線網頁素材包，未建原生簽章包、未推送、部署或操作商店，也未透過其他服務派工或發訊息。
