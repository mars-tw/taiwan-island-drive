# 新內容第13輪：海岸實作課指定修正

工單2026-10-18，本機執行2026-10-19。分支 `r1-fun-polish`，版本 **2.25.0／build21**。本輪只修既有三課，不新增課程、帳號、外連、廣告、內購或第三方SDK。完整執行紀錄及最終數字在 `docs/content/r13/release-proof.json`；不把執行者自驗當成Muse複審。

## 三課做了什麼、怎麼玩、入口

三課共同入口：**首頁「海岸實作課」→選課車票→「一起出發」**。語音仍使用原有本機／原生語音功能與靜音設定，手機沒有鍵盤說明。

- **把蛋糕平穩送到**：踏板、煞車、左轉、右轉固定名稱及位置；放開踏板就逐漸回穩，取消主動扶正鍵。轉彎時蛋糕向彎外倒，車頂三層、小旗及儀表共用角度；主場景蛋糕放大約2.1倍。歪時放開等回穩，再踩踏板；第二站依路面左彎、右彎，第三站入格停穩後再起步。最多一個主要亮鍵，狀態字14px；舊扶正提示在再次歪斜或停車時收起。
- **路口停看等**：三位朋友只在場景各出現一次，順序卡改編號及短名稱，場景編號對應同一位；到岸有各自的鋪面站位，沒有重疊、裁切或殘留空人物框。先停車、看左右，能看到實際通過的藍色來車；來車通過前朋友留在線後。每位重新看兩側、確認後沿斑馬線過街，真正到岸才加人數，三位全到才亮出發，按下後保留駛離過程。
- **形狀車票，找對月台**：站牌、停車點及車門改用同一組座標，三個月台各有不同停車位置；列車輪底貼前軌。錯站時亮出真正可點的三塊站牌、直接比較車票與本站，開門禁用。選同形同色的月台，前進、停穩、開門，逐人經鋪面、短水平踏階、門檻進車廂；先收階再關門。人數HUD固定且避開站牌，窄橫式另調牌距，所有可操作目標仍≥60px。

## R12 Muse唯一清單：逐條驗收

以下均為本機 **VERIFIED**；圖均在 `docs/content/r13/`，390×844原尺寸。沒有把補充圖冒稱已放進15張精選。

| 項目 | 做法與驗收 | 原尺寸證據 |
|---|---|---|
| 1．車頂蛋糕清楚可辨 | .34→.72縮放，約2.1倍；主場景及放大儀表同支點、同傾角，小旗同向逐格回正。另有50%檢查圖。 | `phone-cake-release-1.png`、`phone-cake-recovering-2.png`、`phone-cake-steady-3.png`；左右傾見 `phone-cake-left-bend.png`、`phone-cake-right-bend.png`。 |
| 2．同功能按鈕零改名 | 起步、歪斜、回穩、停穩、再起步都保留踏板／煞車／左轉／右轉；最多一個主要亮鍵，放開時沒有主動扶正鍵。 | `phone-cake-start.png`、`phone-cake-release-1.png`、`phone-cake-recovering-2.png`、`phone-cake-steady-3.png`、`phone-cake-bay-stopped.png`、`phone-cake-bay-restarted.png`。 |
| 3．人物唯一對應、到岸才計數 | 三站各三位清空觀察後重新確認；場景編號唯一，到岸外框彼此重疊面積0、全部在場景內。獨立綠勾框移除，每位到岸者一個完成勾，左右鍵改文字狀態。 | 三站 `phone-crossing-stage-1-start.png`～`stage-3-start.png`；過街中 `phone-crossing-stage-1-child-moving-2.png`、`phone-crossing-stage-2-grandma-moving-2.png`、`phone-crossing-stage-3-bike-moving-2.png`；到岸 `phone-crossing-stage-1-ready-depart.png`～`stage-3-ready-depart.png`。 |
| 4．錯站入口可見可點 | 三牌亮黃、門灰且實際禁用，非僅文字叫玩家找入口。瀏覽器量測中心及角落皆能命中，無HUD遮擋。 | `phone-tickets-stage-1-wrong.png`、`phone-tickets-stage-2-wrong.png`、`phone-tickets-stage-3-wrong.png`。 |
| 5．保留三站不同判斷，結尾對應實作 | 坡上放開／先左後右／臨停再起步；三種朋友順序與實際車流觀察；同形異色／同色異形月台。結算圖帶仍對應動作、朋友順序與車票，沒有只換背景冒稱新玩法。 | 蛋糕 `phone-cake-slope-progress.png`、`phone-cake-left-bend.png`、`phone-cake-bay-stopped.png`；路口三站 `phone-crossing-stage-1-traffic.png`～`stage-3-traffic.png`；車票三站 `phone-tickets-stage-1-stopped.png`～`stage-3-stopped.png`；三課 `phone-cake-saved-result.png`、`phone-crossing-saved-result.png`、`phone-tickets-saved-result.png`。 |

精確逐檔列表、SHA、控制狀態與外框在 `acceptance.json`、`screenshots.json`。上述「～」範圍的逐站實際檔名均在acceptance中列出，不是拼接圖。

## 本線指定五項修正與R11回歸

1. **停車位置**：三站 `phone-tickets-stage-1-stopped.png`、`phone-tickets-stage-2-stopped.png`、`phone-tickets-stage-3-stopped.png` 量測門中心到對應站牌柱≤15px；2、3號列車位置差≥100px。錯站也停在選錯的柱下。數值在 `browser-tickets.json` 的error／delta欄。
2. **輪軌及上車空間**：同站wrong／stopped／open／doorway／retracting／closing／closed原圖保留。原圖鐵軌與既有列車alpha輪底已登錄，輪底到前軌上緣≤3px；三站逐人腳底接到門檻，收階時門仍開、關門時踏階已消失。`art/manifest.json` 包含輪底像素量測，沒有只量透明外框當作輪底。
3. **人物到岸**：三站ready-depart及departing原圖均無兩位外框重疊、無出界；最後一位到岸後不留下空walker分身。九位各有進入、中段、近岸與到岸圖，計數未提前增加。
4. **蛋糕控制**：01～06精選固定四鍵，右轉位置不變；沒有「請放開」按鈕或佔用轉向鍵的「扶正」。操作採自動回穩，底句、狀態與實際操作一致。
5. **傾斜及量條**：左彎右傾、右彎左傾；14px單一短句；回穩三格量條逐格增加至少15百分點，旗尖逐格位移至少20px。車頂同向變化；後兩彎的道路方向標在路面，不與儀表搶同級方向。

R11已修項保留：缺右時看右唯一亮鍵、沒有左向大箭頭（精選07）；人物腳底沿斑馬線（08）；全到岸才亮出發並實際駛離（09→10）；錯站與關門無隊伍虛線、深門洞及短踏階、三人入座（11～15）；原車結尾、完成HUD隱藏、臨停格與停車時收起扶正橫幅（06及各課saved-result）。before／after與手機直橫、iPad原圖複本在 `docs/evidence/content-r13/`。

## 精選、商店與測試證據

**`docs/content/r13/review-set/` 恰好15張**，蛋糕6、路口4、車票5。01～03為連續回穩三格，09→10為出發連續兩格，13→14為上車到收階兩格；每課有三站進行狀態。精選排序與涵蓋理由見 `review-guide.md`，複製原圖的SHA見 `review-set-manifest.json`。完整保存重開與全部九位路線放在補充證據，沒有宣稱審查員已看過這些補充圖。

新增商店原尺寸遊玩截圖，保留所有既有圖：

- `docs/store/screenshots/content-r13/tickets-boarding-1290x2796.png`
- `docs/store/screenshots/content-r13/tickets-boarding-2064x2752.png`

各項最終通過數與來源見 `release-proof.json`；全量單元含既有216項及新增5項，舊測試檔與斷言保留。三課無頭操作、三站完成、保存重開、八視口控制可達性、暫停、離線完成、儲存拒絕、減少動態與商店原圖各有 `browser-*.json`／`*-test.txt`。既有 `npm run test:merge` 使用5286，`npm run test:store` 使用5113，證據各在merge／store子目錄。各瀏覽器結束即關，一次僅一個preview及無頭瀏覽器。

| 品質閘 | 最終結果 |
|---|---|
| `npm test` | VERIFIED：221／221，零失敗、零跳過；原216項保留。 |
| `npm run build` | VERIFIED：正式建置，233個本機離線快取檔。 |
| 三課／RWD／保存／離線／商店原圖 | VERIFIED：137組檢查、160張原尺寸截圖；零pageerror、HTTP錯誤與外部請求。八種視口的可操作目標≥60px，暫停可凍結並續玩；三課完成後重開讀回。 |
| `npm run test:merge`，5286 | VERIFIED：132項、25張回歸圖；零錯誤與外部請求。 |
| `npm run test:store`，5113 | VERIFIED：101項、26張原始回歸圖；冷啟動、觀察、首個目標、續玩、保存及安裝後離線通過。 |
| 效能三跑 | VERIFIED（並發參考）：18組中位p95全部≤18ms，最大16.8ms。 |
| 版本與秘密 | VERIFIED：2.25.0／來源build21，repo文字秘密掃描零命中；完整範圍及數量見 `secret-scan.json`。 |

停車門口對柱最大誤差約0.016px；2、3號列車位置差約100.23px；真實alpha輪底與前軌相距小於1px，低於3px門檻。R11停車格回歸覆蓋率97.5%，保留原≥80%斷言。這些是DOM、原畫像素與原圖讀回量測，沒有當作審查員已獨立驗證。

效能由原量測腳本逐視口、逐模式三跑，18組中位p95及每次讀值見 `performance.json`。**並發機況參考量測，不是乾淨機況或原生實機證明。** repo秘密掃描結果在 `secret-scan.json`，不讀秘密資料夾、不輸出金鑰。版本號在package、lock、car config、模型catalog、iOS／Android一致。

開發中檢查曾抓到UTF-8管線文字、最後一位的空walker框、HUD遮住站牌角落及窄橫式牌被裁；已修正後重跑對應驗證。暫停測試等待已排程的畫面繪製完成才取凍結基準，沒有放寬位置、尺寸、完成或存檔斷言。測試／截圖只從正常入口操作，未寫入完成旗標或遊戲內狀態來湊完成。

## 美術、文案與未完成

新增美術 **1個採用設計／1張runtime WebP／2次 `image_gen.imagegen` 編修**。第一版保留兩條分離軌道未採用，第二版低月台與前軌接近後採用。原圖、完整既有風格前綴、工具名、未揭露模型slug（null）、色盤、輪底像素與SHA見 `docs/content/r13/art/`。其餘車、蛋糕、人物、語音與圖示沿用；Sharp只編碼與產生檢查縮圖，沒有色塊或emoji冒充美術。

speak-human-tw mode 2：原「請放開」放在按鈕／像叫玩家點按／按鈕固定「踏板」，指令移底句；原「看蛋糕扶正」及主動扶正鍵並存／規則模糊／改「放開踏板，蛋糕會慢慢回穩」；狀態原長串小字／手機難讀／14px單句「踏板按住中」「已放開，等回穩」「已放開，可起步」。

**Apple 4.3風險：中**，屬本機內容相似度自評。三課動作分別是照顧平衡、觀察禮讓、形色接客；選課、三站及結算外殼仍共用，未取得Apple接受結論。

**BLOCKED**：實體iPhone／iPad、原生語音與真觸控需裝置；真人親子及家長5秒理解需參與者；乾淨機況效能需獨占硬體；Muse≥8需審查員重新看15張精選。以上未假造通過。未簽章、未送審、未push、未部署、未對外發訊息或委派。

本輪兩個preview均已停止，全部驗證瀏覽器已關閉。原生設定的build21是來源版本；本輪沒有重建或簽章原生離線包，Web建置與離線快取通過不代表原生裝置已驗證。既有未追蹤審查檔保留，不納入本輪提交。
