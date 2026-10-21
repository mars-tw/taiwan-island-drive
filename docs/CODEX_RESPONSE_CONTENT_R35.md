# 新內容第35輪交付

VERIFIED：工單2026-10-18，實作2026-10-21；限定 `r1-fun-polish`，版本 **2.47.0／原生來源build43**。本機程式、測試、原尺寸證據與15張精選已完成。Muse複審是否達8分為BLOCKED，沒有以自審代填分數。存檔協定保留 `contentVersion=33`，不重置既有完成進度。

全程背景／無頭，本機commit；沒有外部派工、push、部署、商店操作或對外訊息。程式維持MIT、免費離線；沒有新增廣告、內購、外鏈、帳號或第三方SDK。

## 入口與三課玩法

共同入口：**首頁→海岸實作課→選課→選站→自己試試／一起出發**；新互動在正常流程內，不需開測試入口。

- **把蛋糕平穩送到**：踩踏板、轉彎，歪斜側托盤出現紅邊；按亮黃的單手，依箭頭推向中央，可同時煞車。錯扶會更歪並保留同側紅警示，救回後100%、0度及提示一起回正。第一站固定海岸坡，第二站燈塔雙彎，第三站沿同一全景進灣、停住、離灣，回主路時站名同步。沒有掉落、淘汰、分數競速或計時懲罰。
- **路口停看等**：保留原本停車、看左右、等朋友、重看新來車再出發的全部規則；本輪只修呈現。每次看一側會放大至場景52%，1.4秒後回到路口，能接著看朋友移動。來車、停止線與放大窗共用來源與車道；主車停在支路右側，尺寸連續過渡到同款側車，下方車道向右行駛。灰鈕同時顯示「已出發」。既有靠右行駛及單背景測試保留。
- **形狀車票，找對月台**：形狀與顏色都相同才停靠開門，畫面說明這一班三位朋友用同一種票。邀朋友後按住陪走，每人只在門檻站穩一次；按住0.65秒填滿圓環，放開凍結，續按接著填，滿圈後走向座位。只有屈膝坐好才加人數。上車時以完整車廂為唯一主畫面，候車是不透明人物；門檻失衡、站穩、走路與坐姿各有不同圖像，每位朋友同時只出現一次。

## Muse五項唯一驗收清單

| 項目 | 狀態與原尺寸證據 |
|---|---|
| 1 扶正不用猜 | VERIFIED：精選01左傾、02托盤左緣、04右傾；紅邊、單手圖與正確鍵同步。01→02錯扶加劇，03煞車反扶救回。每張實玩都查CSS實際旋轉角與讀值一致。 |
| 2 提示／站名對齊 | VERIFIED：精選03停住、05主路；下表九張涵蓋每站停住／高速／盤邊。第一站全程固定坡道原畫，第二站才是燈塔雙彎；第三站高速擷取於進灣前主路，灣內仍限慢速，沒有為拍圖解除限速。 |
| 3 取消半透明分屏 | VERIFIED：精選11～15。只有完整車廂主場景與不透明候車列，外部列車及乘客投影在上車時隱藏。每張自動驗證可見朋友合計3人、沒有外部座位分身、候車CSS不透明度1。 |
| 4 可見進度／減少重複 | VERIFIED：精選11開始、12半圈、13放開凍結、14滿圈，15坐好。13與14是不同扶門框／站穩姿勢。三站每位朋友只出現一次站穩計時；半圈與暫停的boardTime／escortStable精確相等，滿圈0.65秒才續走，三人入座時等待次數恰為3。 |
| 5 放大觀察／等待移動 | VERIFIED：精選06左看含停止線、07右看含反向車；08→09是同一次等待，阿嬤全身及菜籃明顯往對岸移動。10顯示下方車道與「已出發」。放大車身的完整外框也驗證落在原畫的同一車道內，沒有跨黃線。 |

| 蛋糕狀態矩陣 | 停住 | 高速 | 托盤邊 |
|---|---|---|---|
| 第1站 | [停住](content/r35/phone-cake-stage-1-stopped.png) | [高速](content/r35/phone-cake-wrong-support.png) | [盤邊](content/r35/phone-cake-late-brake-edge.png) |
| 第2站 | [停住](content/r35/phone-cake-stage-2-stopped.png) | [高速](content/r35/phone-cake-stage-2-high-speed.png) | [盤邊](content/r35/phone-cake-stage-2-tray-edge.png) |
| 第3站 | [停住](content/r35/phone-cake-stage-3-stopped.png) | [高速](content/r35/phone-cake-stage-3-high-speed.png) | [盤邊](content/r35/phone-cake-stage-3-tray-edge.png) |

主車右轉三連拍：[先轉向](content/r35/phone-crossing-stage-2-turning-right.png)→[轉入](content/r35/phone-crossing-stage-2-departing.png)→[進下方車道](content/r35/phone-crossing-stage-2-joined-right-lane.png)。三站原向／換邊皆有同樣連拍，8視口各實際完成三站，保留24張完整主車入道證據。完成頁單背景：[第三站結尾](content/r35/phone-crossing-stage-3-finished.png)。這是2D投影與視角切換，未宣稱新增3D轉彎骨架。

走路到坐下另有 [走向座位](content/r35/phone-tickets-stage-3-walking-0.png)→[第一人坐好](content/r35/phone-tickets-stage-3-seated-1.png)→[三人坐好](content/r35/phone-tickets-stage-3-seated-3.png)。第二／三站錯形與錯色的比較原圖也保留在本輪，未靠改分數或自動放行完成配對。

## 15張審查精選逐張檢查

VERIFIED：`content/r35/review-set/` **正好15張390×844原圖副本，每課5張**。沒有縮放、拼貼、標註或後製；來源及SHA在 `review-set.json`。Codex逐張直接顯示原尺寸檢查，最後車道修正後重新檢視有變的10張；車票5張雜湊未變，與已檢視原圖完全相同。這是執行線自審，不是Muse或Claude獨立評審。

| 圖 | 原尺寸路徑 | 目視檢查結果 |
|---|---|---|
| 01 | [01-cake-wrong-support.png](content/r35/review-set/01-cake-wrong-support.png) | 左傾14度與蛋糕傾斜同向，托盤左側紅邊清楚；推向右為黃色正解，錯按推向左為橘紅。第一站保持海岸坡背景。 |
| 02 | [02-cake-late-brake-edge.png](content/r35/review-set/02-cake-late-brake-edge.png) | 同次錯扶延續到左傾27度、穩定度4%；蛋糕越過托盤左緣，盤緣與錯向按鈕同時警示，仍可救回。 |
| 03 | [03-cake-rescued.png](content/r35/review-set/03-cake-rescued.png) | 同次反扶與煞車後回中央，100%、0度、已停住一致；提示是停車起步，左右手都回中性。 |
| 04 | [04-cake-stage-2-tray-edge.png](content/r35/review-set/04-cake-stage-2-tray-edge.png) | 第二站右傾16度、右邊紅警示，推向左亮黃、推向右錯扶橘紅；燈塔雙彎與第一站坡道明顯不同。 |
| 05 | [05-cake-bay-main-road.png](content/r35/review-set/05-cake-bay-main-road.png) | 第三站站牌為主路，提示回到主路，車速慢速、角度0度、100%一致；沒有休息灣停車格或P牌殘影。 |
| 06 | [06-crossing-stage-2-grandma-waiting-a.png](content/r35/review-set/06-crossing-stage-2-grandma-waiting-a.png) | 左側觀察窗超過半個場景，來車車頭朝右，完整車身在黃中線下；白色停止線在車頭前。此圖只作觀察證據，阿嬤動作看08與09。 |
| 07 | [07-crossing-stage-2-car-passing.png](content/r35/review-set/07-crossing-stage-2-car-passing.png) | 右側放大視野，來車車頭朝左，完整車身在黃中線上；有車側沒有安全勾，背景保留原路口。 |
| 08 | [08-crossing-2-grandma-on-zebra.png](content/r35/review-set/08-crossing-2-grandma-on-zebra.png) | 同次第二站等待，放大窗已收回，阿嬤在斑馬線中段、全身與菜籃可見；仍0/3且主車停在線後。 |
| 09 | [09-crossing-stage-2-grandma-waiting-b.png](content/r35/review-set/09-crossing-stage-2-grandma-waiting-b.png) | 接08同次等待，阿嬤與菜籃明顯向對岸移動、腿姿不同，未提前計入到岸；主車保持停等。 |
| 10 | [10-crossing-stage-2-joined-right-lane.png](content/r35/review-set/10-crossing-stage-2-joined-right-lane.png) | 主車已向右進入下方車道，側車比例與原來車一致；上方站牌、提示及灰色出發鈕同步說已出發，沒有反向或跨中線。 |
| 11 | [11-tickets-stage-3-hold-start-0.png](content/r35/review-set/11-tickets-stage-3-hold-start-0.png) | 第三站小安在門檻、站穩圓環0%，兩位朋友是不透明候車人物，每人只出現一次；0/3尚未計入。 |
| 12 | [12-tickets-stage-3-hold-half-0.png](content/r35/review-set/12-tickets-stage-3-hold-half-0.png) | 接11持續按住到44%，場景圓環與按鈕環同時填滿近一半；人仍在同一門檻，沒有偷加人數。 |
| 13 | [13-tickets-stage-3-hold-paused-0.png](content/r35/review-set/13-tickets-stage-3-hold-paused-0.png) | 接12放開，圓環藍色暫停符號、保留同一段進度；小安改為張手扶門框的失衡姿勢，與14正常站姿明顯不同。 |
| 14 | [14-tickets-stage-3-hold-full-0.png](content/r35/review-set/14-tickets-stage-3-hold-full-0.png) | 接13再按住到完整綠環與勾，小安雙腳站穩、雙手扶背包；計數仍0/3，滿圈後才繼續走。 |
| 15 | [15-tickets-stage-3-seated-3.png](content/r35/review-set/15-tickets-stage-3-seated-3.png) | 同次第三站三人有屈膝坐姿、臀部接座墊、雙腳朝下，姓名勾與3/3一致；月台沒有分身，只留收踏階。 |

15張用來證明核心互動；完整矩陣、測試數、離線與效能仍依測試收據，不把靜態截圖當成這些事項的獨立證明。

## 自動測試與完整實玩

VERIFIED：刪除舊輪副本後，`npm test` **337/337**、`npm run build`、5286 `npm run test:merge` **132項**、5113 `npm run test:store` **101項**全綠；新單元測試4項。原有60個測試／驗證來源與HEAD一致（Windows換行正規化後比對），沒有刪測試或放寬舊斷言。單一狀態、文字一致性、靠右行駛及單一完成背景仍受測。

無頭Chromium用真觸控操作公開按鈕，只推進時鐘、不寫入遊戲狀態。實際完成三課九站、精確比對完成存檔重載，路口另完整換邊重玩；service worker離線重載後再次完成九站。八視口320×568、568×320、390×844、844×390、768×1024、1024×768、1366×600、1280×640通過。內容驗證 **555張原尺寸擷取**，每張查控制≥60px、中心可點、文字不裁切、手機沒有鍵盤說明；執行錯誤與外部請求0。證據在 `browser-all.json`、`layout/browser-layout.json`、`offline/browser-offline.json`、`store/browser-store.json`。

全部瀏覽器強制headless、`--disable-gpu --use-angle=swiftshader`，不占用H3實體GPU；同時只開一個preview與一個測試瀏覽器。3D主線原測試會在一個同步JavaScript任務中快速執行數千次原始g.frame；R35驅動器保留每個物理步進與World.render更新，只合併該任務內重複WebGL提交，最後確實繪製末幀並等兩次原生RAF再進原斷言。沒有改座標、完成旗標、存檔、限制時間或斷言；每次提交數與真實末幀收據在 `merge/render-coalescing.json`。R35內容實玩及效能使用完整正常繪製，未套用這項快速推進合併。最初未完成的CPU回歸嘗試保留在 `merge-initial-cancelled.txt`，不列為通過。

並發機況RAF參考（每視口3跑×180幀，取p95中位）：

| 視口 | 三跑p95 | 中位 |
|---|---|---|
| 390×844 | 16.8／16.7／16.7 | 16.7 ms |
| 768×1024 | 33.4／16.7／16.7 | 16.7 ms |
| 1366×600 | 33.4／16.7／16.8 | 16.8 ms |

三跑中位狀態 **VERIFIED**。個別跑次如高於18ms已完整列出，沒有宣稱所有幀或所有跑次≤18ms。這是共享機況／軟體渲染參考，乾淨機與實機效能仍BLOCKED。

## 美術、商店與清理

新增美術 **4張runtime PNG／4次image_gen.imagegen**：單手推扶1張、三位朋友扶門框各1張。三張來源採用，另一次只修女孩髮色陰影以通過原有色彩閘門；首稿姿勢圖集因手指超出分格而保留為製作紀錄、未投入遊戲。完整既有風格前綴、來源、工具與SHA在 `art/`、`art-manifest.json`；模型slug未揭露，記null。其餘角色步態、站穩、屈膝坐姿、車廂及道路沿用受管原畫。四張新圖亮度／飽和度與64px檢查通過；初版女孩低飽和率26.77%的失敗與修正後7.99%數值皆保留，沒有改公式或排除黑髮像素。技法整理與時序限制見 [STUDY](content/r35/art/STUDY.md)：外部study及數值補驗於收尾完成，未假稱都在產圖前落檔。沒有用方塊、emoji或純色塊替代人物／場景，也沒有宣稱新骨架動畫或奶油物理。

新增商店原圖：[1290×2796](store/screenshots/content-r35/tickets-visible-standing-1290x2796.png)、[2064×2752](store/screenshots/content-r35/tickets-visible-standing-2064x2752.png)。分別由430×932／DPR3、1032×1376／DPR2實際遊玩直接擷取，展示門檻半圈；未刪任何既有商店圖，也不是實體裝置證據。before／after及手機／iPad／桌機原圖副本在 `evidence/content-r35/`。

EXECUTED：刪除 **20個已被取代的舊輪媒體檔**，釋出 **9,057,858 bytes（8.64 MiB）**。另清掉本輪已被最終擷取取代的中間產物 **246個／72,301,110 bytes**。兩份計畫／結果均驗證絕對根、分支、SHA與所有權；舊輪只刪乾淨已追蹤檔，沒有動接手前未追蹤檔。清理量是工作目錄，不是Git物件庫縮小。

保留 **10549個原畫或驗證輸入**，逐檔reason／readers在 `cleanup-plan.json`、`cleanup-result.json`。例如R34 review-set及原圖仍由 `scripts/verify-content-r34.py` 讀回雜湊，其他舊輪browser清冊也被歷史release驗證讀取，依工單例外保留，未改舊斷言來刪檔。各輪Markdown報告、評審、現行商店與所有測試輸入保留。接手前 **108個未追蹤檔**全部SHA未變。

秘密掃描 **0命中**，沒有讀取秘密目錄或寫入金鑰。現行版本來源不殘留2.46.0；歷史報告及舊輪驗證腳本保留原版本紀錄。最終讀回摘要在 `release-verification.json`。

## 文案與未完成項目

依共用核心mode 2直接套用短句，保留數字、角色及規則：

| 原句 | 原因 | 改成什麼 |
|---|---|---|
| 向左扶／向右扶 | 扶哪一側容易誤解 | 推向左／推向右，搭配單手側推與直箭頭 |
| 踏板和轉向可以一起按 | 停住時與當下不符 | 已停住，輕踩踏板起步。歪斜則指向亮起的手 |
| 第3站・休息灣（已離灣後） | 名稱與主路提示不符 | 第3站・主路 |
| 滑到托盤邊了，試著救回來 | 沒說當下應做的動作 | 移動時說快到托盤邊，煞車一起扶；停住時說推回托盤中央 |
| 你的車票→所選月台 | 沒說明三位朋友共用同種票 | 這班三位，用同一種車票 |
| 放開，等站穩／站穩了，再按住走 | 舊版要放開計時、兩段重複停等 | 按住，等圓圈滿／放開暫停，進度留著／站穩了，繼續走 |
| 路面淨空，慢慢出發 | 灰鈕無法看出已經出發 | 已出發，沿下方車道前進。 |

Apple 4.3風險 **中（產品自評）**：三課以送蛋糕平衡、路口停看等及形色車票配對形成交通生活操作，但學院／三站外框仍有共通感。2026-10-21查閱 [Apple官方4.3準則](https://developer.apple.com/app-store/review/guidelines/#spam)：Apple要求避免同一App分出重複Bundle ID，且與大量已有App保持可辨識差異。本輪沿用既有作品與Bundle ID，沒有新增上架；此推論不是Apple審核結論，也沒有拿其他repo或商店市場做未執行的比較。

BLOCKED：實體iPhone／iPad觸控與原生語音需要裝置及原生環境；真人親子試玩需要家長與兒童；乾淨機效能需要獨占機況；Muse≥8分需要獨立評審只看本輪精選集。以上未假造完成。本機五項修正及必要證據已完成，沒有以歷史圖片冒充本輪實玩。

PREPARED保留項目：路口完成回顧的「安全停住X次」仍沿用既有系統計數，依本線保持路口流程的要求未重設這個回顧，未把它宣稱為本輪新改善的成就回饋。上層CLAUDE要求的技法筆記沒有在產圖前先落檔，已補研究與驗證，不能回補該時序。
