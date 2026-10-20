# 島嶼交通學院：新內容第24輪

VERIFIED，工單2026-10-18，執行2026-10-20。僅在 `r1-fun-polish`，基準 `2457616c4fcc544257c0831d0d85ed18b13c1ba8`，版本2.36.0／來源build32。本輪完成Muse五項指定修改，延續既有三課；最終逐檔驗收見 `docs/content/r24/release-proof.json`。獨立Muse複審分數尚未取得，未宣稱已達8分。

共同入口：首頁「海岸實作課」→選一張課程車票→「一起出發」。

| 課程 | 做了什麼、怎麼玩 |
|---|---|
| 把蛋糕平穩送到 | 看路牌起步、轉彎、煞車；放開行車鍵後，依箭頭按住扶回中央。錯向一次加傾一格，提示換邊，不扣分或淘汰；同一失衡量驅動車頂、特寫、直立參照與進度。62／80／100傾角約30.4／16／0度，差距大於8度。只有真正直立才顯示100%。三站分別為上坡、連彎及休息灣再起步，最後把完整蛋糕送到朋友桌上。 |
| 路口停看等 | 停在線前，依不同來車方向看左右，再等三位朋友沿斑馬線走到對岸。三張新背景為漁港、榕樹村及近景燈塔；斑馬線縱向穿過橫向來車道。重新確認的同一台車完整通過並駛出畫面後，才改成「車過了，再看一次左邊」。3/3時提示出發，主鍵高亮、其他觀察動作變灰。保留符合內容的課名「停看等」，不宣稱有新歌曲。 |
| 形狀車票，找對月台 | 對形色與編號，直接點月台實體牌、停穩開門；點朋友後按住陪同，放開即停，續按到入座；收階、關門再離站。三牌固定位置，牌柱底座落在鋪面，地面虛線接踏階；三站列車同尺度且停靠時完整入鏡。新增榕樹／燈塔月台，海風站保留；進門後改說陪朋友入座。 |

## Muse五項驗收與原尺寸證據

手機圖均為無頭Chromium公開UI實玩取得的390×844原尺寸，前綴為 `docs/content/r24/`。沒有寫入遊戲狀態、偽造完成存檔或合成遊玩畫面；Playwright只推進正常計時器與RAF。`browser.json`記錄各圖狀態、提示、尺寸、SHA及可達性檢查。

| Muse項目 | 實作與逐項截圖 |
|---|---|
| 1．扶正方向與傾角分級 | `phone-cake-wrong-recovery.png`同時顯示加傾、橘色輪廓與「越扶越歪，換另一邊」；`phone-cake-stage-2-centre-62.png`→`phone-cake-stage-2-centre-80.png`→`phone-cake-stage-2-centre-100.png`為同距離的連拍，特寫與車頂同步，按對後錯誤提示消失，直立有亮輪廓。固定淡色直立原畫不隨蛋糕轉動。 |
| 2．實體月台牌與地面線 | `phone-tickets-stage-1-decision.png`、`phone-tickets-stage-2-decision.png`、`phone-tickets-stage-3-decision.png`均有三個可選實體牌；各站 `phone-tickets-stage-<1至3>-step-out.png`顯示底座在鋪面、地面線連到踏階。牌固定20／50／80%位置，選對亮的是同一牌面；不再浮在天空。 |
| 3．環形進度及中央原因 | `phone-tickets-stage-2-boarding-2.png`為按住中，`phone-tickets-stage-2-paused.png`為半程放開，進度與人物停住一秒後續按完成；`phone-tickets-stage-2-wrong.png`為錯站阻擋，環歸零並顯示「車門還沒對準，找一樣的牌子」。蛋糕62%圖保留暫停環與原因；錯向圖顯示保留的實際回正量與換邊原因。 |
| 4．同一來車通過、離場與提示更新 | `phone-crossing-stage-3-recheck.png`→`phone-crossing-stage-3-recheck-2.png`→`phone-crossing-stage-3-recheck-3.png`→`phone-crossing-stage-3-recheck-4.png`四格依序為接近、穿過斑馬線、駛離右端、離場後再看左邊。三站 `phone-crossing-stage-<1至3>-car.png`補左右來車；`phone-crossing-stage-3-ready-depart.png`呈現3/3、完整下一步短句與高亮出發鍵。標籤跟車，另設車道端點方向牌，瀏覽器檢查外框零重疊。 |
| 5．三站差異與專屬收尾 | 蛋糕：`phone-cake-stage-1-playing.png`、`phone-cake-stage-2-centre-80.png`、`phone-cake-stage-3-bay.png`；路口：三站 `phone-crossing-stage-<1至3>-car.png`；車票：三站 `phone-tickets-stage-<1至3>-boarding-2.png`。各課 `phone-cake-complete.png`、`phone-crossing-complete.png`、`phone-tickets-complete.png`分別為分享蛋糕、對岸朋友道謝、車窗內乘客揮手，含三站勾選及重玩／換課；各課 `saved.png`補存檔重載。 |

Claude／GPT額外指出的四項：來車標籤與方向牌已分開；車身維持單一車道，車道高度隨原畫實測；斑馬線確實跨過來車路徑；榕樹／燈塔站和路口改用獨立背景；月台三牌固定位置。每站逐人過街的start／middle／pavement共27格、乘客boarding-1／2／3連拍、錯站、暫停、收階、關門與離站三格皆在本輪資料夾。動態證據限既有姿勢、位移及操作驅動2D傾斜，不宣稱新增骨架或3D物理。

審查精選為 `docs/content/r24/review-set/`，15張、三課各5張，01～15排序，均逐位元組複製原手機圖；來源與SHA在 `review-set-manifest.json`。01～05為錯向、三級傾角及蛋糕結尾；06～10為同車四格與安全出發；11～15為三站上車中、半程暫停及車票結尾。15張無法容納全部原尺寸狀態，以上其他圖保留作完整驗證，沒有宣稱審查員已看過精選以外的圖。

新增商店圖：`docs/store/screenshots/content-r24/tickets-escort-1290x2796.png`與`tickets-escort-2064x2752.png`，均以原生DPR擷取實際上車中狀態，沒有放大補尺寸；既有商店截圖全部保留。前後對照位於 `docs/evidence/content-r24/`，before為基準Git內原圖、after為本輪原圖，沒有拼貼。

## 測試與清理

VERIFIED：278項單元、build、62項課程／視口／斷網檢查、132項整合、101項商店回歸通過；308張原尺寸情境圖及15張精選逐檔核對，44份既有測試檔不變，秘密掃描0命中。D3D11九組各三次p95中位為16.7～16.8ms，均≤18ms，僅供並發環境參考。最後來車連續位置及蛋糕直立門檻修正後，再次通過單元、build、三課九站及斷網完整通關／存檔重載；其他課程幾何、商店素材與原主遊戲未變更。

最終結果見 `release-proof.json` 及各 `*-test.txt`。驗證命令：`npm test`、`npm run build`、`npm run test:content:r24`、`npm run test:merge`（preview5286）、`npm run test:store`（preview5113）。`node scripts/final-content-r24-validation.mjs`依序跑單元、build、三課各三站實玩、八視口、斷網實玩、商店原尺寸、效能與兩套既有回歸；單一preview、單一無頭瀏覽器，用完即關。指定Playwright路徑不存在，使用既有npm快取模組，未安裝新SDK或依賴。兩套既有主遊戲回歸在清理後通過；最後局部高亮樣式修正後，重跑單元、build、三課全流程、八視口、斷網、商店素材及效能。這次局部修正僅作用於海岸課程對話框，未改動原主遊戲。

新增7項單元驗證角差／100%門檻、錯向單次加傾與正向恢復、同一來車延續位置並在完整離場後才能確認、車道與斑馬線幾何、固定列車尺度及邊界、放開一秒保持進度且入座只計一次、三課九站完成與存檔。既有44份測試以Git blob逐檔比對不變，未刪測試或放寬斷言。瀏覽器額外驗證60px命中、文字無裁切、無鍵盤說明、實體牌柱接地、標籤零重疊、停靠列車完整入鏡、完成重載及斷網；下一步鍵除狀態正確，也檢查實際計算後的背景為黃色。

清理EXECUTED：刪除65個已被取代的追蹤圖片，89,933,397 bytes（85.77 MiB）。清單、刪前SHA及結果見 `cleanup-plan.json`、`cleanup-result.json`。先核對repo絕對範圍、追蹤且未修改，整份allowlist通過才刪除；沒有刪除既有未追蹤檔、Markdown、評審意見或現行商店圖。保留6,011檔：5,912檔為歷史驗證器經JSON讀取／雜湊的輸入、43檔為腳本具名／模板輸入、56檔為受管生成來源及美術契約；逐檔列理由與讀取來源。本輪完整指定回歸在刪除後執行。

新增美術：6次 `image_gen.imagegen`、5張採用runtime WebP。燈塔路口第一稿的靜態車以另一次編修移除；沒有使用本機模型或GPU產圖。提示完整前綴、原畫、64px檢視、轉碼、實際工具與SHA見 `docs/content/r24/art/`，模型slug未揭露，記null。新場景原圖均已目視檢查；沒有用方塊、純色塊或emoji冒充插畫。效能沿用R23及既有merge／store的D3D11瀏覽器渲染參數，三視口×三課×三次真實RAF，並發主機結果僅供參考，不替代乾淨機或裝置效能。另保留強制軟體渲染的 `performance-software.json`：桌機33.3～33.4ms未達18ms，手機直橫16.7～16.8ms；這份額外實驗標BLOCKED，不混入D3D11結果。

繁中文案mode2直接套用：原句「這邊扶不回來，換一邊」沒有對應錯向加傾，改為「越扶越歪，換另一邊」；「左邊還要再確認」補入可觀察因果，離場後改為「車過了，再看一次左邊」；「大家都到對岸，路口空了」改成可執行的「大家都到了，可以出發」；乘客進門後仍說陪上車，改為「進門了，繼續按住陪朋友入座」。課名與人名保留。

## 風險與缺件

Apple 4.3風險：中，為本專案自評。三課聚焦交通照顧、獨立地標與具體操作，但共用課程框架仍在。依本次讀取的 [Apple官方4.3規範](https://developer.apple.com/app-store/review/guidelines/#spam)，避免重複App與缺少差異的變體仍需評估；此等級為推論，非Apple核准結果。美術研究來源與應用見 `art/STUDY.md`。

BLOCKED：實體iPhone／iPad觸控及原生語音需要裝置；聲音效果無法由截圖驗證。真人親子與不看站名的盲辨需要參與者；乾淨機效能需要獨占硬體；Muse≥8及三評目標需要獨立複評。本輪不重建原生簽章包。只做本機commit，未push、部署、操作商店、發訊息或透過其他服務派工。
