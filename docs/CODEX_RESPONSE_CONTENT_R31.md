# 新內容第31輪交付

VERIFIED：工單2026-10-18，本機執行2026-10-21。版本 **2.43.0／原生來源build39**，分支 `r1-fun-polish`。本輪修好既有三課，沒有增加通用任務、廣告、內購、帳號、網路服務或SDK。MIT、免費、離線。沒有發布或上傳商店。

## 三課做了什麼、入口與操作

共同入口：**首頁 → 海岸實作課 → 選課 → 大圖示選站卡 → 一起出發**。完成後可「再送一次／再陪朋友／再搭一班」，看到上次與這次的條件比較。

**把蛋糕平穩送到**：一個 `cakeView` 投影統一站名、上方狀態、下方指令、唯一亮鍵、速度現況、傾角與車輛回饋。沒有扶正輸入，不會寫「扶正中」；車速只寫已停住／低速／中速／高速，不再另外命令減速。0°與回到直立100%完全相同。主場景路面標記隨實際距離移動，速度線長度與車身晃幅隨速度變小，放大車頂傾斜尺。先煞車、再反向扶正，第三站停妥休息灣，再出灣、回主路、到分享站停穩。回正百分比量的是傾角，沒有分數或競速完成度。

**路口停看等**：一個 `crossingView` 投影統一上下兩條提示、左右視野、來車、主車與出發。兩列分別顯示有車／淨空，以及我看過了／還沒看／要重看；勾只代表親看且該側淨空。有車時主場景與小視野同步顯示同方向來車。新車只使該側確認失效，朋友到岸不清空另一側。車過後親看一次即可繼續，沒有無限輪流重看。三人到岸才亮出發及路線；出發保留觀察列，避免版面變高讓車看似倒退。正常流程完成三站，皆只有一次新車重看。課名維持「停看等」，不宣稱未提供的歌曲。

**形狀車票，找對月台**：錯誤月台只紅框、目前朋友用藍框；形狀與顏色判定列固定，部分相符的勾採中性藍，完整答對才用綠色成功回饋。自然場景植栽、人物原服裝不改色。縮小手票移到身側，三位名牌完整，沒有柱子壓字或票遮臉。停對、停穩、開門後，清楚點名當前輪到的朋友；尚未輪到的人保留原畫、停用選取，避免「點一位朋友」卻無反應。選中後有粗藍描邊、「輪到」與≥60px具名邀請鍵。按住陪同到門檻放開，站穩後繼續進走道再坐下；按鈕持續顯示手按圖示、「按住陪同」及已走到百分比。真正坐下才增加入座人數。這是同站共乘，三人持本站同款車票；不同站與重玩會換形色，沒有宣稱三人持不同目的地的票。

## Muse五項驗收及原尺寸證據

所有下列 `phone-*.png` 均為 **390×844** 瀏覽器直接截圖，沒有拼貼或縮放。

| 唯一驗收項目 | 原尺寸路徑與實際驗證 |
| --- | --- |
| 1 主場景速度、傾斜因果 | `docs/content/r31/phone-cake-controlled-initial.png` → `phone-cake-controlled-brake-support.png` → `phone-cake-controlled-upright.png`。同起點／同輸入前綴的正常操作；高速歪斜、中速煞車扶正、停止直立，三張各只有一個亮鍵。`controlled-comparison.json`比較兩個獨立瀏覽器context、相同初始值與640ms輸入，煞車＋扶正的速度與傾角皆較低。另有`phone-cake-masked-right.png`／`masked-left.png`／`masked-upright.png`遮特寫證據；真人遮字排序列BLOCKED。 |
| 2 路口確認、實景、ready與出發 | `docs/content/r31/phone-crossing-stage-1-new-car-invalidated.png`／`car-still-wait.png` → `new-car-clear-unconfirmed.png` → `look-again-confirmed.png` → `ready.png` → `departing.png`；第2、3站也有相同後綴完整連拍，精確路徑在browser-all.json。另一側始終保留；看錯側／新車未過仍不能解鎖，重看一次該側即可完成。上下提示逐張完全相同，✓不與車同格，實景車可見。出發另斷言主車螢幕座標真正向前移動。 |
| 3 車票形錯／色錯語意 | `docs/content/r31/phone-tickets-stage-1-wrong-shape.png`、`phone-tickets-stage-1-wrong-color.png`；第2、3站同樣各有兩種錯誤原圖。固定輪廓／票色兩列，不亮正解；沒有綠色錯誤／選人／部分相符回饋。姓名與人物臉完整。 |
| 4 明確邀請、四步連續上車 | 同站同人`docs/content/r31/phone-tickets-stage-1-selected-friend-0.png` → `phone-tickets-stage-1-paused-still.png` → `phone-tickets-stage-1-aisle.png` → `phone-tickets-stage-1-seated-1.png`；前三張0/3，坐下才1/3。`paused-still.png`證明放開700ms後位置與進度逐值相同。第二／三位的具名邀請在`selected-friend-1.png`／`selected-friend-2.png`，三站皆有。 |
| 5 三課重玩上次／這次比較 | `docs/content/r31/phone-cake-replay-new-conditions.png`、`phone-crossing-replay-new-conditions.png`、`phone-tickets-replay-new-conditions.png`。左為暖底虛線／歷史回轉圖示／已完成結果，右為藍底實線／新條件圖示；彎向、來車方向／人物順序、票面形色皆由實際重玩seed推導。八視口的真實完成後比較卡在`layout/device-WxH-KIND-replay.png`；真人遮字理解仍BLOCKED。 |

其他完成證據：蛋糕與路口三站各有`phone-cake-stage-N-finished.png`／`phone-crossing-stage-N-finished.png`；車票三站各有`phone-tickets-stage-N-seated-3.png`。N=1、2、3。三課另各有`phone-KIND-complete.png`／`phone-KIND-saved.png`。第三站蛋糕`bay-braking.png` → `parked.png` → `leaving.png` → `main-road.png`完整進出灣。三課完成存檔完整重載讀回相同。斷網重載並完成九站的原圖及完整資料在`docs/content/r31/offline/`。

## 精選、商店、美術

`docs/content/r31/review-set/`固定 **15張原尺寸手機直式圖，三課各5張**：01～05蛋糕、06～10路口、11～15車票。包含三格速度／傾斜、實景新車→車過→ready→出發、同站四格選人→門檻暫停→走道→入座。來源與SHA在`review-set.json`，逐位元相同。15張平分後，車票色錯與車票重玩卡放在上表完整驗收路徑，**未宣稱精選已呈現這兩張**；精選優先保留同人連續上車四格。

新增商店原尺寸：`docs/store/screenshots/content-r31/ticket-invitation-1290x2796.png`、`ticket-invitation-2064x2752.png`。以430×932／DPR3、1032×1376／DPR2直接截圖，點選可邀請朋友後明確出現邀請鍵。所有舊商店圖保留。before／after及手機直式、橫式、iPad原尺寸副本在`docs/evidence/content-r31/`，跨輪對比只說明畫面改善，不冒稱受控物理比較。

新增生成美術 **0張、產圖呼叫0次**；沿用受管蛋糕分層、車輛、海岸背景與人物多姿勢原畫，SHA在`art-manifest.json`。新增道路回饋、傾斜尺與門檻／走道記號屬CSS／SVG介面，沒有以方塊冒充角色或場景，沒有宣稱新增骨架、真3D物理或原生角色動畫。

## 測試、清理與限制

VERIFIED：`npm test` **321／321**、`npm run build`、5286 `npm run test:merge` **132項**、5113 `npm run test:store` **101項**。六組瀏覽器驗證（all／controlled／layout／offline／store／performance）全部通過；364張來源原圖的SHA、文字／按鈕、三課各5張精選、版本、刪檔及p95均由`release-verification.json`回讀驗證。每組browser manifest皆綁定目前UI、模型、CSS及操作腳本的SHA，避免混用修改前後的證據。輸出為本輪`tests-output.txt`、`build-output.txt`、`browser-all.json`、`browser-controlled.json`、`browser-layout.json`、`offline/browser-offline.json`、`merge-output.txt`、`store-output.txt`。所有指定測試均在33個舊媒體刪除後實跑；瀏覽器與兩個preview收尾已關閉。新增單元測試遍歷864組蛋糕階段／車速／傾角／扶正輸入；實際瀏覽器逐狀態列出全部可見文字並檢查矛盾、唯一亮鍵、車輛可見性及存檔。原有51個測試與輔助檔SHA保持相同，沒有刪測試或放寬舊斷言。

八視口：320×568、568×320、390×844、844×390、768×1024、1024×768、1366×600、1280×640。測試涵蓋三課入口、選站、操作、比對、觀察、按住／放開與重玩。互動控制≥60px、可見可點，文字／圖示無裁切或重疊，手機沒有鍵盤指令。外部請求與腳本錯誤0。工單提供的storm-apocalypse Playwright路徑不存在，使用本機已存在的npm-cache Playwright，未安裝新依賴。

蛋糕遊玩中的並發載參考效能：三視口各三跑180幀實際RAF，p95中位 **16.8／16.8／16.8ms**，≤18ms。這是工作站參考值，沒有宣稱實體手機或乾淨機效能通過。秘密掃描0命中；現行版本檔2.42.0零命中，歷史報告／舊驗證器保留原版本契約。

EXECUTED並回讀：刪除 **33個**乾淨、已追蹤且無驗證依賴的舊媒體，工作樹舊媒體大小合計 **14,223,797 bytes（13.57 MiB）**，包含R30全部15張review-set；沒有改寫Git歷史。絕對根目錄／分支／SHA綁定與刪後回讀在`cleanup-plan.json`／`cleanup-result.json`。保留8,784個舊媒體：86個原畫／美術契約、8,645個歷史驗證manifest讀取並雜湊的檔、53個驗證腳本明確輸入；清冊逐檔列原因及讀取者。沒有宣稱把所有舊證據清空。各輪Markdown、評審、全部舊商店圖及接手時96個未追蹤檔保留；只明確加入本輪路徑與核定刪檔。

Apple4.3風險：**中**。平順運送易倒物、觀察失效後重新看路、形色找月台與陪同上車，保有交通生活的辨識度；共用學院／三站選單外框仍可能有陣容相似感。這是設計評估，沒有冒稱Apple審核結果。

BLOCKED：實體iPhone／iPad觸控與原生語音需要裝置；真人親子試玩／遮字排序理解需要參與家庭；乾淨機效能需要獨占硬體；Muse≥8需要獨立複審。沒有製作原生簽章包。全程本機背景／無頭，沒有push、部署、商店操作、訊息或外部派工。

文案mode2紀錄：原「慢慢開／放輕點／先減速」是速度欄的第二組操作指令，改「車速：已停住／低速／中速／高速」；原「蛋糕回正」容易誤認路程，改「回到直立」；原上下「新車來了／車過了」分頭判斷，改共用同一句；原「已停住69%」像暫停鈕，改「按住陪同・已走到69%」；原「點一位朋友」會誤導自由順序，改當前姓名；原只用箭頭比較，改上次／這次與獨立底色圖示。課名、角色名、控制識別與儲存欄位保留。
