# 島嶼交通學院：新內容第20輪

VERIFIED：限定四項修正、清理後全套驗證、原圖雜湊與秘密掃描完成。工單日期2026-10-18，執行日期2026-10-19。只在 `r1-fun-polish`，基準 `cd0dbad`；版本 **2.32.0／來源build28**。沒有新增課程；依本線限定四項修正，R19 Claude第5項踏階與人數欄併入車票課處理。

共同入口：**首頁「海岸實作課」→三張課程車票→「一起出發」**。

| 課程 | 怎麼玩、本輪改了什麼 |
| --- | --- |
| 把蛋糕平穩送到 | 踏板起步、看牌轉彎、放開回穩、第三站臨停再起步。第三站換成完整海岸臨停灣，路面接休息區，邊界、海岸、榕樹、店家與長椅都在同一構圖。橘條固定只量「傾斜程度」，越短越穩；藍圈另量「回中央」，與蛋糕實際偏移同源。錯向按住改橘紅，原有操作與等待規則保留。 |
| 路口停看等 | 停穩，先看左、再看右，等車與朋友通過，到空位後才換下一位，最後按出發。刪掉無說明的斜虛線與空心圈，仍保留實際來車及車旁標籤、左右查看。第二站奶奶從斑馬線中央走到對岸，再沿人行道到空位；未落位不增加人數。 |
| 形狀車票，找對月台 | 對形狀與顏色選月台、停穩開門，逐位點朋友並邀請，最後收階、關門、前進。候車腳底移到紅磚地面；先沿月台到門前，再沿門口下到踏階，不再斜穿車殼。踏階加大並加亮黃邊，收回完全消失後才可關門。月台／上車中／已入座固定三欄，含0且合計3人。 |

## 本線四項修正與踏階回歸驗收

以下均相對 `docs/content/r20/`；`phone-*.png` 為390×844原尺寸無頭瀏覽器截圖，沒有拼貼、縮放或加驗證字。座標、狀態、SHA與像素差見 `acceptance.json`、`screenshots.json`。

| 驗收 | 手機原圖與檢查 |
| --- | --- |
| ①第三站場景 | `phone-cake-stage-3-bay-stopped.png`。與R19同一臨停狀態，完整呈現道路、白線、藍白邊界、休息灣、店家、樹蔭、海岸與燈塔；執行者目視檢查構圖已有超過70%可辨景物或地表紋理，不把此判斷冒稱獨立評審結論。`art/cake-bay-64.png` 是64px美術檢視；臨停灣輪廓可辨。 |
| ②量表只表達單一意義 | `phone-cake-replay-old-direction.png`：錯向按鍵為橘紅；`phone-cake-tray-edge-sliding.png` → `phone-cake-tray-edge-recovering.png` → `phone-cake-tray-edge-recovered.png`：橘條縮短、藍圈增加，車頂與特寫同源位移／傾角。回中央完成才恢復操作；實際偏移小於3時藍圈至少90%。 |
| ③移除虛線與圈、補中央位置 | `phone-crossing-stage-2-grandma-moving-1.png` → `moving-2.png` → `phone-crossing-stage-2-grandma-arrived.png`：斑馬線中央0人→對岸未落位0人→空位1人。起點另見 `phone-crossing-stage-2-start.png`，四個位置可分辨。全程無斜線或空心圈。`phone-crossing-stage-1-child-look-left.png` 保留來車與車旁標籤回歸；`phone-crossing-stage-3-departing-1.png`～`departing-3.png` 是實際出發。 |
| ④候車地面與上車門口 | 三站 `phone-tickets-stage-N-wrong.png`、`boarding-1-1.png`、`boarding-1-2.png`、`seated-1.png`，N=1～3。候車腳底在場景高度約54.45%的紅磚區；各站第一位上車人物框與門框重疊率皆96.64%，超過50%。人數入座後才增加，總數始終3人。 |
| ⑤踏階差異與固定三欄 | `phone-tickets-stage-1-seated-3.png` → `phone-tickets-stage-1-close-ready.png` → `phone-tickets-stage-1-closed.png`：門開且踏階伸出→門開但踏階完全收回→門關。踏階區域原尺寸逐像素差須≥1500，實測2133px，詳 `acceptance.json`。選錯、上車、全員入座、收階、關門與完成皆固定三欄，沒人時顯示0。 |

R19 Muse另外建議回穩新增可操作輸入、重做路口進度；因本線明定只修四項，本輪未實作，現有回穩等待與路口雙進度保留。Muse的過街四位置、踏階及缺少的第二／三站、駛離、完成證據已補齊；不宣稱所有評審建議都已處理。

## 精選、商店圖與回歸

**審查只看 `docs/content/r20/review-set/`，固定15張，每課5張，依課程順序。** 01錯向回歸，02～04盤緣回穩三格，05臨停新場景；06來車回歸，07～09奶奶中央／對岸／空位，10第三站出發；11錯站及候車回歸，12真正在門口上車，13～15踏階與關門。各圖都是手機原圖逐位元複製，索引與SHA在 `review-set-manifest.json`、`review-guide.md`。精選限制無法同時容納三站全部操作、離線與重載，沒有把其他資料夾的證據算成審查員已看見。

補充回歸：三課均有 `phone-<課程>-complete.png`、`phone-<課程>-saved-result.png`；第二／三站判斷保留於蛋糕 `stage-2-wrong-turn`／`stage-3-bay-stopped`、路口各站 `look-left`／`ready-depart`、車票各站 `wrong`／`boarding-1-1`。實際駛離三格各站皆保留。斷網三課完整實玩與重載在 `offline/`；前後原圖在 `before-*.png`／`after-*.png`，基準git物件SHA在 `before-after.json`。

新增商店圖：`docs/store/screenshots/content-r20/tickets-player-boarding-1290x2796.png`、`tickets-player-boarding-2064x2752.png`。以指定DPR直接擷取實際上車；既有商店圖全部保留。手機直橫、iPad及矮桌機回歸圖在 `all-device-*.png` 與 `layout-proof/`，控制目標至少60px、在視口內可命中，手機沒有鍵盤說明。

## 測試、清理與美術

最終結果見 `release-proof.json`：單元257項、課程瀏覽器159項、整合132項、商店101項全部通過；502張課程原圖核對SHA，精選15張逐位元一致，秘密掃描零命中。既有254項與40份測試檔未改；以Git正規化內容核對，保留原本Windows換行，詳 `test-source-integrity.json`。新增3項分別檢查量表、過街與候車／門口座標。瀏覽器使用公開UI逐站實玩，Playwright clock只推進實際RAF／計時器，沒有改遊戲狀態或製造存檔。R20腳本承接既有瀏覽器斷言，對新規格增加三欄、腳底、門框重疊、固定量表及無斜線斷言；歷史腳本未刪改。截圖檔名加入執行範圍與同名序號，避免準備畫面被後續測試覆寫。另測休息不前進、拒絕儲存仍可玩、減少動態、三課離線完成。

固定命令：`npm test`、`npm run build`、`npm run test:merge`（5286）、`npm run test:store`（5113）及 `node scripts/run-content-r20-validation.mjs`。單一preview依序換埠、單一無頭瀏覽器使用後關閉。九組每課／視口各三次真實RAF的p95中位為16.7～16.8ms，全部≤18ms，詳 `performance.json`；為並發載參考，不冒稱乾淨機或實機數據。

清理已 EXECUTED：刪除 **65檔／89,809,018 bytes（85.65 MiB）**，包含R19舊review-set與已取代的整合／商店演練證據副本。既有 `docs/store/screenshots/` 沒有刪除。另保留4643個舊媒體：4564個被歷史驗證器讀取／雜湊的輸入、27個被腳本明確或模板引用的檔案、52個生成來源與美術契約；逐檔原因與讀取者列在 `cleanup-result.json`。保留所有Markdown與既有未追蹤檔。刪除前核對絕對repo範圍、git追蹤狀態、未修改與SHA，刪後重跑全套測試；本輪完成驗證亦逐檔查保留輸入存在及雜湊。

新增美術 **1次生成／1個設計／1張runtime WebP**，實際工具 `image_gen.imagegen`，模型slug未揭露，記null；原圖、完整既有風格前綴、提示與SHA在 `art/`。Sharp只轉WebP及產生64px檢視，不程序繪製場景。角色、車輛、蛋糕、踏階都沿用受管原畫；沒有新增SDK、依賴、廣告、內購、帳號、外連或線上功能。2D圖層與既有姿勢切換不冒稱新骨架或3D物理。

繁中文案mode 2直接套用：原「穩定度，虛線是坐穩位置」因語義混用，改「傾斜程度，越短越穩」；新增獨立「回中央」標示。人物與交通指令原文保留，沒有擴寫幼兒說明。

## 風險與缺件

Apple 4.3風險：**中**。三課仍是本作的交通照顧玩法，沒有加入通用養成模板；但共用課程外框、三站與結尾流程仍有相似性。這是專案自評，沒有聲稱Apple已審核通過。

BLOCKED：實體iPhone／iPad觸控與原生語音需可用裝置；真人親子試玩需參與者；乾淨機效能需獨占硬體；Muse≥8需另行獨立複評，不能用本次執行者驗證代替。原生簽章包本輪未重建；更新的是Web產物與原生來源版本。只做本機commit，沒有push、部署、商店操作、傳訊或外部派工。
