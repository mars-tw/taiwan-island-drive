# 島嶼交通學院：新內容第 11 輪

VERIFIED（本機實作與驗證），2026-10-19。版本 **2.23.0／原生來源 build19**，分支 **r1-fun-polish**，基線 **f56fc8b2d7c2b830be72cbd744b0cbb1dc1c5b14**。本輪修正 R10 三課；Muse 五項的本機畫面與操作驗收已完成。**真人家長 5 秒理解、實機與 Muse ≥8 複審為 BLOCKED**，不能用本機測試代替。

入口一律是 **首頁「海岸實作課」→ 點選課程 →「一起出發」**。三項仍是 MIT、免費、離線遊玩，沒有增加依賴、廣告、內購、帳號、外連或 SDK，沒有淘汰、倒數懲罰或競速計分。

| 課程 | 做了什麼、怎麼玩與完成回饋 |
|---|---|
| 把蛋糕平穩送到 | 實際加速度與路面側力累積失衡，蛋糕、三層與旗桿會偏移。持續踩住會歪，放開減速並反向輕轉會逐漸扶正；亂點不會把數值直接清零。危險時有慢行幫忙，扶正成功顯示事件。量條明標「平穩」。三站分別為起步坡、連彎、臨停再起步，道路與操作時機各異；新正後方車圖沿路前進，停穩時車在格內。結尾先說會放開放慢、停穩再起步，再列全程累計。 |
| 路口停看等 | 每位朋友開始都清除左右勾；看一側就只勾一側，缺右時主提示、腳下牌與唯一亮鍵都指向右。場景箭頭表示剛看哪一邊；等候者保留灰階臉部。每位都看左右、再確認朋友，等到岸才出發。勾號貼在到岸者身上，不遮等待牌。三站九位後，結尾換成同一組年齡、衣服、配件與藍白菜籃車，沒有車身殘影。 |
| 形狀車票，找對月台 | 比對形狀與顏色，選站、前進、停穩才開門。錯站門關、踏階收起；正確時打開直立門框、放出短而寬的水平踏階。逐人由隊伍走過門檻到座位，最後先收踏階、再合門、才顯示門關好了。月台圓形編號與乘客綠色小序號區分，隊伍完整留在鋪面內。三站九人上車後保存並可重開查看。 |

## Muse 五項逐項驗收與原尺寸圖

以下路徑均以 repo 根目錄為準，手機圖全為 **390×844 PNG**。完整尺寸、狀態、控制顏色與 SHA-256 在 `docs/content/r11/acceptance.json`、`screenshots.json`，沒有拼圖、縮放或後製加字。僅擷取期間暫停 RAF，沒有指定遊戲位置、傾斜、完成或存檔值。

| 項目 | 結果 | docs/content/r11/ 原圖 |
|---|---|---|
| 1．真的傾斜、看懂扶正 | VERIFIED：危險 → 放開並按右 → 回穩連續三格；正／微傾／危險與慢行可見。踏板待踩黃、踩住橘、請放開橘、已放開灰；灰色沒有「請放開」。四項新增單元測試含錯向比較、隨機短按不能直接清零、操作差異與保存。 | phone-cake-tilting-1.png、phone-cake-correcting-2.png、phone-cake-recovered-3.png、phone-cake-pedal-ready.png、phone-cake-pedal-held.png |
| 2．三站道路不同 | VERIFIED：起步坡、連彎、灣位各有獨立道路與時機牌。正後方車圖，臨停時車身矩形覆蓋率 **97.5%** 在虛線格內，高於八成。 | phone-cake-slope-timing.png、phone-cake-bends-timing.png、phone-cake-bay-stopped.png、phone-cake-bay-restarted.png |
| 3．門與踏階狀態機 | VERIFIED：錯站關閉無踏階；開門水平踏階；上車中；先收階再合門；關閉完成無踏階。三站均實跑，所選編號與車門中心最大水平差 **0.02px**，≤20px；水平踏階已與月台邊同高，垂直差≤2px。隊伍不出界，腳底在磚紅鋪面。 | phone-tickets-stage-3-wrong-closed.png、phone-tickets-stage-3-open.png、phone-tickets-stage-3-doorway-1.png～3.png、phone-tickets-stage-3-retracting.png、phone-tickets-stage-3-closing.png、phone-tickets-stage-3-closed.png；第1、2站各有同組原圖。 |
| 4．清零、逐側點亮 | VERIFIED：九位各有 reset、missing-right、moving、arrived 原圖。第一格無勾；只看左時出發灰色、車不動、唯一亮鍵為看右。三人到岸順序與重置逐人對應，等待牌不被勾遮住。 | phone-crossing-stage-2-reset-1.png～3.png、phone-crossing-stage-2-missing-right-2.png、phone-crossing-stage-2-child-moving.png、phone-crossing-stage-2-arrived-2.png；奶奶連續 phone-crossing-grandma-moving-1.png～3.png。 |
| 5．結算學會什麼 | VERIFIED（畫面／資料）：三課主句不同、全程累計、依實際操作改變的回饋與下次練習目標；資訊沒有按鈕邊框或按壓影，三標題不含「第3站」。本次蛋糕扶正 **4 次**、慢行幫忙 **1 次**，各事件有遊玩圖；灣位停穩／再起步各一次。路口左右各9次、確認9次、等9位；車票全程9位與自己改選3次對應逐站原圖。BLOCKED：家長是否5秒理解需真人測試。 | phone-cake-saved-result.png、phone-crossing-saved-result.png、phone-tickets-saved-result.png；phone-cake-recovery-1.png～4.png、phone-cake-tilting-1.png。 |

Claude 嚴重項目均在精選內：灰色踏板只寫已放開（02／03／05）；停車格內與正後方車（05）；缺右提示與亮鍵同步、勾不擋等待牌（07／08）；錯站與關閉時無踏階、門閉合（11／14）；固定路口角色與三課完成標題（06／10／15）。錯站不再亮前進，而是提示點別的站牌；遊玩中沒有「已記住這一站」或常駐成功存檔字。

GPT 的操作因果補在蛋糕連續三格、路口逐側確認後才走、車門與踏階互斥。後兩站車票不會預先亮出正確站牌，孩子自行比對；錯站解釋形或色不同，可繼續。蛋糕是2D讀值形變，人物沿用不同姿勢圖，沒有宣稱新增骨架動畫。原圖及事件紀錄是本機證據，不宣稱審查員已驗證測試或物理手感。

## 審查精選集（15張）

**docs/content/r11/review-set/**，01～15排序。為同時保留三格扶正、三站道路與三個結尾，分配為蛋糕6、路口4、車票5；每課都有進行中畫面。

- 01～06：蛋糕傾斜 → 正確操作 → 回穩；連彎、格內臨停、保存結尾。前三格的路面是起步坡。
- 07～10：新一位清零 → 只看左遭阻擋 → 確認後走進斑馬線 → 固定三人保存結尾。
- 11～15：錯站關門 → 開門踏階 → 第二位過門檻 → 全員坐好關門收階 → 保存結尾。

每張都與來源位元組相同，讀回尺寸／SHA 見 `review-set-manifest.json`。其餘原圖包括三位奶奶姿勢、三站上車、逐站結算、所有重置、離線與失敗儲存；不假稱審查員會看精選之外的圖。

## 測試與品質閘

| 執行 | 結果／證據 |
|---|---|
| npm test | VERIFIED：**211／211**，原有207項及所有斷言與基線逐檔相同，新增4項；零跳過、零失敗。unit-tests.txt。 |
| npm run build | VERIFIED：正式建置與231個離線快取檔。build.txt。 |
| 三課無頭實玩、矩陣、韌性與商店原圖 | VERIFIED：**122 組檢查、140 張原尺寸圖**。三課均從正常入口完成三站並重開保存；零 pageerror、HTTP錯誤與外部請求。browser-cake／crossing／tickets／matrix／resilience／store.json。 |
| RWD／觸控 | VERIFIED：320×568、390×844、568×320、844×390、768×1024、1024×768、1366×600、1280×640；選課、說明、遊玩、休息、完成頁可操作目標≥60px、無遮擋且不出界，手機無鍵盤說明。共80組基本矩陣與21組完成頁檢查。 |
| 離線／存檔拒絕 | VERIFIED：安裝快取後切離線，實際完成九位禮讓並重開讀回；儲存被拒仍能完成、休息與繼續。phone-crossing-offline-result／offline-saved／storage-denied.png。 |
| npm run test:merge（5286） | VERIFIED：**132項**，數學→火車→汽車→飛機→保存重開，零錯誤與外部請求。merge-test.txt、merge/merge-path.json。 |
| npm run test:store（5113） | VERIFIED：**101項**，冷開、觀察、續玩、保存、拒絕儲存、安裝離線，零錯誤與外部請求。store-review-test.txt、store/review-path.json。 |
| 原生離線來源包 | VERIFIED：native:build與verify-native-package通過28項，226個本機檔，remoteServer=false，三張新素材hash與runtime相同。native-build.txt、native-package-test.txt、native-bundle-manifest.json。這不是簽章或實機測試。 |
| 並發載量測 | VERIFIED（參考）：6模式×3視口×3跑，18組三跑p95中位數最高 **16.8ms**，≤18ms。每跑2秒rAF間隔，單一無頭瀏覽器；車票在門檻與月台最後對齊後補測並回填三視口三跑，原始資料另存performance-tickets-final.json。performance.json；不是乾淨機況、CPU/GPU render time或原生效能。 |
| 版本／秘密／來源 | VERIFIED：2.23.0／build19同步，原尺寸與精選hash一致，秘密掃描零命中，既有測試與依賴未變。release-verification.txt、secret-scan.json、source-manifest.json。沒有讀取秘密目錄。 |

測試順序每次只有一個無頭瀏覽器、完成即關；5286與5113預覽依序使用，收尾皆停止。前後對照在 docs/evidence/content-r11/ 及 before-after.json。只做本機繁中commit，沒有切換／合併main、推送、部署、商店操作、對外發訊息或其他服務派工。既有未追蹤審查檔完整保留。

新增商店原圖：**docs/store/screenshots/content-r11/tickets-boarding-1290x2796.png**、**tickets-boarding-2064x2752.png**，直接以430×932@3及1032×1376@2擷取，沒有刪除既有商店圖。

## 美術與繁中文案

新增 **3個設計／3張runtime素材／3次 image_gen.imagegen**：正後方汽車、開門內部、路口固定三人結尾。水平踏階沿用R10生成圖。原圖、完整提示、參考、透明度、64px預覽與SHA見 r11/art/manifest.json、PROMPTS.json；工具未揭露模型slug。Sharp只裁透明外緣、等比縮圖及PNG/WebP編碼。runtime於public/art/content-r11/，不依賴生成工具本機目錄。

車與門的可見像素亮度0.386／0.406、飽和0.848／0.925、近黑22.79%／12.79%、低飽和0.99%／0.03%。完整結尾場景含白雲與人行道，整圖低飽和36.39%，僅作診斷，沒有冒稱人物遮罩低於20%。沒有做真人64px辨識盲測。

speak-human-tw mode 2事後摘要（原句／原因／改成什麼）：

| 原句 | 原因 | 改成什麼 |
|---|---|---|
| 灰色「請放開」 | 狀態與文字矛盾 | 灰色固定「已放開」，踩住要求放開才橘色「請放開」 |
| 已看左仍寫「看左」 | 提示沒有跟進度走 | 「→ 再看右邊」，已看的鍵為「✓ 看過了」 |
| 停穩再換月台 | 停穩後仍要求停穩，前進亮鍵誤導 | 「形狀或顏色不同，點別的站牌」 |
| 第3站 | 不能代表整課完成 | 三站完成＋三課各自的完成主句 |
| 已記住這一站 | 遊玩中常駐像除錯訊息 | 遊玩不顯示成功存檔字，完成才顯示「旅程已保存」 |
| 先看左9次／先看右9次 | 看不出學會什麼 | 學會的動作先說；全程累計、具體回饋與下次練習分開呈現 |

## 未完成與風險

**Apple 4.3風險：中**，僅為本機內容相似度自評。平衡照顧蛋糕、逐人禮讓、形色配對接客各有因果；三站與選課外殼共用仍存在。沒有Apple接受結論或新的Muse分數。

**BLOCKED**：實體iPhone／iPad、原生語音與真觸控需裝置；真人親子與家長5秒理解需家長／兒童參與；乾淨機況效能需獨占硬體；Muse≥8需審查員看本輪15張精選。這些不假造為VERIFIED，其餘指定本機工作已完成。
