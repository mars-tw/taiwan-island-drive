# 新內容第14輪：海岸三課修正

工單2026-10-18，本機執行2026-10-19。分支 `r1-fun-polish`，版本 **2.26.0／來源build22**。本輪只修既有三課；沒有新增課程、廣告、內購、帳號、外連、連線功能或依賴套件。最終數字與檔案SHA以 `docs/content/r14/release-proof.json`、`source-manifest.json` 為準。

## 三課做了什麼、怎麼玩、入口

共同入口：**首頁「海岸實作課」→選課車票→「一起出發」**。手機沿用圖示、短句及原有語音引導，沒有鍵盤說明。

- **把蛋糕平穩送到**：踏板、煞車、左轉、右轉固定名稱與位置。放開踏板等蛋糕回穩，再起步；第二站真的要左轉、右轉，第三站入格停穩再起步。所有實際狀態與結算統一「回穩」，量條明標「穩定度」，長度及橘／黃綠／綠只由傾角決定，虛線是坐穩門檻。右彎鏡像整個路景及黃色導引牌，左右車身各偏6度；蛋糕持續向彎外傾。按錯方向增加傾斜、不前進，放開仍可回穩。車頂與放大儀表共用蛋糕角度，直立小旗留出上緣空間，踩住踏板有橘色下沉狀態。
- **路口停看等**：正式名稱沿用實際的停、看、等，不宣稱新增歌曲。停在線前、逐側觀察、等可見來車通過，再確認當前朋友。畫面區分「正在等來車」「準備過街」「正在過街」；三位都到岸才亮出發。到岸小朋友移到外側鋪面，人物有相同編號及短名，不重疊、不出界。出發保留四格控制列，HUD改「出發中」，車輛實際駛離。
- **形狀車票，找對月台**：同時比形狀和顏色，點真正的月台牌，前進、停穩後開門。錯站清楚標「這站・不對」，其他站牌可點，灰色門鍵寫「門不能開」。上車時顯示同步門口放大窗，當前乘客與已入座者清楚分開；候車點拉近，逐人經鋪面、水平踏階及門檻。三人坐好才亮「收踏階」，收階有位移、門仍開，之後關門；再亮「前進」，明示去下一站或旅行，按下才駛離。

仍是原有2D原畫及姿勢幀的互動演出，沒有把位移、旋轉或放大窗稱為新骨架動畫或3D物理。

## R13 Muse唯一清單：逐項證據

以下為執行者本機 **VERIFIED**，不是Muse重評。手機圖均是 `docs/content/r14/` 下的390×844原尺寸PNG。完整逐檔SHA、狀態、外框及量測在 `acceptance.json`、`screenshots.json`、`browser-*.json`。

| Muse項目 | 驗收與原尺寸截圖 |
|---|---|
| 1．下一步亮鍵／等待中 | 起步 `phone-cake-start.png`、放開 `phone-cake-release-1.png`；過街 `phone-crossing-stage-2-grandma-moving-2.png`；全到岸／駛離 `phone-crossing-stage-3-ready-depart.png` → `phone-crossing-stage-3-departing.png`，控制列座標及尺寸完全相同；收階亮鍵 `phone-tickets-stage-2-retract-ready.png`、關門後前進 `phone-tickets-stage-2-closed.png`。三課連點非亮鍵的原圖是各課 `phone-<課程>-nonneeded-ignored.png`，位置、人數及門狀態不變。 |
| 2．蛋糕量條與真轉向 | `phone-cake-release-1.png` → `phone-cake-recovering-2.png` → `phone-cake-steady-3.png`，依序橘、黃綠、綠，量條逐格至少增加15百分點、小旗逐格至少移動20px。兩彎各有 `phone-cake-left-before.png` → `phone-cake-left-bend.png` → `phone-cake-left-recovered.png`，及right同名三格。錯向與放開恢復：`phone-cake-wrong-turn.png` → `phone-cake-wrong-turn-recovered.png`。單元測試窮舉正負傾角及踏板／輔助旗標，同角度長度、顏色完全相同；大幅歪斜不綠。 |
| 3．錯站可點／禁用 | 三站 `phone-tickets-stage-1-wrong.png`、`phone-tickets-stage-2-wrong.png`、`phone-tickets-stage-3-wrong.png`，目前站與可改選站、門不能開可直接分辨。對應的stage-1／2／3-stopped圖保留三個不同停車位置；門中心對柱≤15px，2、3號位置差≥100px，真實輪底到前軌≤3px。 |
| 4．上車放大與踏階 | 三站各有open、doorway-1／2／3、retract-ready、retracting、closing、closed圖。代表圖 `phone-tickets-stage-2-doorway-2.png` → `phone-tickets-stage-2-retracting.png` → `phone-tickets-stage-2-closing.png`。390px畫面放大窗人物可見高度≥40px；候位距門≤80px。車內人數只在跨入後增加，收階時門開，合門時階面已消失；原畫alpha與實際框的量測分開記錄。 |
| 5．終點、進度與成果 | 蛋糕 `phone-cake-stage-3-delivery.png` → `phone-cake-saved-result.png`；路口三站ready-depart→departing，終點 `phone-crossing-saved-result.png`；列車第三站 `phone-tickets-stage-3-closed.png` → `phone-tickets-stage-3-departing.png`，終點 `phone-tickets-saved-result.png`。保留三站進度點、對應本課動作的完成橫幅與圖帶，三課均實際完成後重開讀回。 |

## 本線指定問題與R11～R13回歸

已讀九份R11～R13審查。蛋糕實際提示／狀態／結算來源全文搜尋舊「扶正」為0；放開自動回穩與固定四鍵保留，完成紀錄改為具名的回穩次數。量條不再由danger、assisting或踏板狀態覆色。左右彎道路、黃色牌及車身方向相反，沒有只換字；兩彎均有彎外傾斜及轉向前後證據。臨停格包含車身、停車時不掛回穩橫幅，停穩與再起步另見 `phone-cake-bay-stopped.png`、`phone-cake-bay-restarted.png`。

路口保留缺右時唯一亮看右、沒有指左大箭頭、每位重新觀察、九位腳底沿斑馬線、到岸才計數。三站各三位都有進入／中段／近岸／到岸圖；人物外框重疊面積0，全部在場景內。三站都有可見來車與駛離圖。修掉空白保存列造成的出發位移，沒有放寬控制列外框相等斷言。

車票保留同形異色、同色異形、三站對柱停靠及輪軌距離，錯站／關門沒有隊伍虛線，計數位置固定。逐人進入後才計車內人數，收階後才合門；完成頁不留遊玩HUD，結尾仍是同一台方頭列車與三位乘客。手機直橫、iPad及矮筆電可操作目標均≥60px。

## 截圖精選與商店原圖

`docs/content/r14/review-set/` **恰好15張，每課5張**，按01～15排序，全部是原圖逐位元複製。03→05回穩三格、08→09路口出發、12→13上車到收階、14→15關門到駛離。涵蓋理由與取捨在 `review-guide.md`。

限15張，兩彎各自完整三連圖、臨停再起步、蛋糕及車票保存重開結算放在補充圖。這些已補原尺寸證據，但不冒稱審查員只看精選就已看過全部補充圖。before／after與手機直橫、iPad複本在 `docs/evidence/content-r14/`。

新增並保留所有既有商店圖：

- `docs/store/screenshots/content-r14/tickets-boarding-1290x2796.png`
- `docs/store/screenshots/content-r14/tickets-boarding-2064x2752.png`

## 測試與版本

最終通過數見 `release-proof.json`；本輪無頭驗證143組、178張原尺寸截圖，另有merge的25張及store的26張回歸圖。原始輸出為 `unit-tests.txt`、`build.txt`、`merge-test.txt`、`store-test.txt`，效能原始取樣、瀏覽器狀態及截圖另存JSON。

- `npm test`：226／226，原221項保留且通過，新增5項；舊測試檔與斷言逐檔對baseline核對。
- `npm run build`：正式Web建置與233個本機離線快取檔。
- 本輪無頭操作：三課三站完成及保存重開；三課離線通關；九位過街、三站逐人上車、暫停、減少動態、拒絕儲存、八視口可達性、非亮鍵與錯向恢復。沒有寫入完成旗標或遊戲狀態來湊結果，零pageerror、HTTP錯誤及外部請求。
- `npm run test:merge`：5286，132項整合檢查、25張回歸圖、零執行錯誤及外部請求。`npm run test:store`：5113，101項檢查、26張未後製回歸圖，冷啟動、觀察、首個目標、續玩、保存及安裝後離線均通過。兩埠依序使用，一次只開一個preview及無頭瀏覽器。
- 效能：桌機、手機直式、手機橫式共9組，三課各三跑的中位p95最大16.8ms，全部≤18ms；列車特別在門口放大窗及上車者活動時取樣。並發機況參考，詳見 `performance.json`，不當成乾淨機況或原生裝置效能。
- 版本來源全部同步2.26.0／build22；依賴未變。repo文字秘密掃描零命中，掃描不讀秘密目錄、不輸出金鑰。

開發中驗證抓到測試腳本把四捨五入的15.00誤判為尚未進彎、舊截圖排程器中斷後續動畫、到岸框超出約1px、出發空白存檔列及過街準備狀態用語問題。最後另把轉彎前的按住踏板改成藍色下沉狀態，讓方向鍵成為唯一橘黃焦點；完成一站時進度點立即填滿。已修正並重跑相應驗證；沒有刪舊測試或放寬斷言。截圖只在取圖期間保持RAF時間戳，保留原生callback及取消機制，不改遊戲完成、位置或保存狀態。

## 美術、文案與缺件

新增生成美術 **0張**，新增依賴0個。背景、列車、人物、門及踏階全部沿用既有受管原畫；鏡像與同步放大屬呈現修正。`docs/content/r14/art/manifest.json` 記錄來源、原尺寸、SHA、可見人物alpha及工具；50×94px框另計object-fit後，可見人物約71.9px，不把透明框當人體身高。本輪無生成呼叫，tool為null，不虛構模型slug。

speak-human-tw mode 2事後摘要：原「先扶正蛋糕／扶正了」讓人尋找不存在的主動操作，改「放開，等蛋糕回穩／坐穩了・回穩N次」；原「看清楚了，請朋友過街」與正在走路不合，改當前角色「正在過街，等到對岸」；原「門關好了」無下一步，改「門關好了，按前進去下一站／旅行」。原「少用慢行幫忙」改為鼓勵繼續練習，不把使用輔助當成不足。

**Apple 4.3風險：中**，屬本機內容相似度自評。三課分別是平穩運送、觀察禮讓、形色接客；選課、三站及結算外殼仍共用，沒有Apple審核接受結論。

**BLOCKED**：實體iPhone／iPad、原生語音與真觸控需裝置；真人親子及家長理解測試需參與者；乾淨機況效能需獨占硬體；Muse≥8需審查員重新看15張精選。沒有假造上述結果。來源build22不代表本輪已重建、簽章或驗證原生離線包。

本輪只作本機commit，不push、不部署、不操作商店、不對外發訊息、不透過其他服務委派。既有未追蹤審查檔保留且不納入提交。收尾關閉本輪瀏覽器與preview。
