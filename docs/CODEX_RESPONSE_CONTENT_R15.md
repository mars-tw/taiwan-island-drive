# 新內容第15輪：海岸三課由玩家操作

**VERIFIED：本機實作與驗證完成。** 工單2026-10-18，執行2026-10-19；限`r1-fun-polish`，版本**2.27.0／來源build23**。唯一驗收清單為`content/CONTENT_REVIEW_R14_MUSE.md`下一輪五項；另讀R11～R14共12份審查，保留方向、角色、動線與結尾的既有修正。本報告是執行者實證，不是Muse複審分數。

## 三課做了什麼、怎麼玩、入口

共同入口：**首頁「海岸實作課」→選課車票→「一起出發」**。沿用圖示、本機語音介面與短句；手機不顯示鍵盤說明。

- **把蛋糕平穩送到**：直路按住踏板，彎道按住正確方向即可慢慢前進，方便幼兒用單指操作。方向相反就停住、傾斜增加；持續按住轉向會讓蛋糕滑向盤緣、車輛緩停，必須放開回穩才能再走。第二站左右連彎各有必要操作，第三站仍要入灣停穩、再起步。四鍵名稱與位置固定，方向鍵是彎道唯一黃色操作焦點；踏板按住是海藍下沉，兩者實測ΔE約119.2。車頂與放大圖共用角度及滑移，車身轉角只套車圖，沒有再把蛋糕多轉一次。
- **路口停看等**：停在線前，每位朋友都由玩家先按看左、再按看右。沒有看完不過街，有來車就繼續等；到岸才加一，下一位重新觀察。三站九位全部實玩。移除重複人物牌，小朋友／腳踏車／奶奶與編號只保留在場景人物上，字幕、語音與等待鍵由同一狀態決定；正在過街不再寫準備過街。
- **形狀車票，找對月台**：比形狀與顏色、選站牌、前進停穩、開門，再逐位按「請小安／小晴／小宇上車」。不按就候車，一次只走一位，跨門檻後才加車內人數。三位坐好後，玩家依序收踏階、關門、前進。三站正確牌在1／3／2欄，重玩輪換位置；保留同形異色、同色異形的干擾項。放大窗移到天空留白，主列車與候車者不被蓋住；車門表面沿用列車原畫的窗框、陰影與把手。

沒有新增課程、倒數懲罰、淘汰、積分競速、廣告、內購、外連、帳號、線上功能或依賴。仍是受管原畫、既有姿勢幀與操作讀值驅動的2D演出，沒有宣稱新骨架或真實3D蛋糕物理。

## Muse五項驗收與原尺寸證據

下列原圖全部在`docs/content/r15/`，手機直式為390×844。完整狀態、控制外觀、幾何與SHA見`acceptance.json`、`screenshots.json`與`browser-all.json`。

| 唯一清單項目 | VERIFIED與原尺寸截圖 |
| --- | --- |
| 1．真正由玩家轉向 | 左彎`phone-cake-stage-2-left-ready.png`→`phone-cake-stage-2-left-driving.png`→`phone-cake-stage-2-left-recovered.png`；右彎同名right三格。實測車身位移約24.4／27.9px；錯向`phone-cake-stage-2-wrong-turn.png`的路程不增加。持續按住的滑移、緩停、放開恢復為`phone-cake-tray-edge-sliding.png`→`phone-cake-tray-edge-stopped.png`→`phone-cake-tray-edge-recovered.png`。藍色踏板與唯一亮方向鍵：`phone-cake-bend-pedal-held.png`。 |
| 2．每位重新看左右 | 代表三連格`phone-crossing-stage-1-child-look-left.png`→`phone-crossing-stage-1-child-look-right.png`→`phone-crossing-stage-1-child-moving-2.png`。其餘八位同樣保留look-left／look-right／moving-1～3／arrived原圖；三站各有traffic、ready-cross、ready-depart。九位到岸才各加一；三站等車／準備／正在過街／可以出發四種狀態均有圖，按鈕與字幕使用相同狀態來源。 |
| 3．逐人由玩家邀請上車 | `phone-tickets-stage-1-invite-1.png`→`phone-tickets-stage-1-boarding-1-2.png`→`phone-tickets-stage-1-invite-2.png`，不操作時時間與人數不變，邀請一位只動一位。三站九位都有邀請、踏階途中、入座原圖；收階、待關門、關門、已關門分別為每站retracting、close-ready、closing、closed圖。開門狀態另見`phone-tickets-opening-state.png`。 |
| 4．換欄與連續駛離 | 三站`phone-tickets-stage-1-stopped.png`、stage-2、stage-3，重玩`phone-tickets-replay-layout.png`。三種載具每站均有`phone-<cake／crossing／tickets>-stage-<1～3>-departing-1～3.png`三格；位移約106～187px，車身尺寸差小於0.001%，不是突然縮成模型車。 |
| 5．減少重複提示、精簡結算 | 三課`phone-cake-saved-result.png`、`phone-crossing-saved-result.png`、`phone-tickets-saved-result.png`。只留三站勾選、一句成果與再玩／換課，移除九格小圖帶、統計格與重複人物牌。三課均完成後重新載入讀回，保留同款載具與角色。 |

## 舊輪問題與精選取捨

放開自動回穩、固定四鍵、唯一亮鍵、穩定度只由傾角決定、彎外傾斜與右彎整景鏡像均保留。沒有重新放回「扶正」鍵或相反方向指令。臨停及再起步另見`phone-cake-stage-3-bay-stopped.png`、`phone-cake-stage-3-bay-restarted.png`。實測九組到岸人物無重疊、無出界、同一身份沒有分身；18張斑馬線途中圖的腳底位於通行帶。沒有殘留隊伍虛線；列車遊玩、駛離與結算皆維持2.42比例，詳見`scene-regressions.json`。

`content/r15/review-set/`**恰15張，每課5張**，以01～15按課程與站次排序；每張皆是原圖逐位元複製。01～03為錯向、轉向、放開回穩，06～08為逐側觀察到過街，11～13為玩家逐位邀請上車；三課也各保留重開成果。所有檔案、理由與SHA在`review-set-manifest.json`、`review-guide.md`。

15張無法容納九位逐人完整動作、兩彎全部三連格、臨停再起步與所有收階關門，所以完整證據另外保存，不宣稱只看精選的審查員已看過補充圖。手機直橫、iPad的before／after複本在`docs/evidence/content-r15/`，沒有縮放或後製。

## 測試與交付

- `npm test`：**232／232**，原226項保留且通過，新增6項；驗證器逐檔比對基準77a9f915的舊測試，沒有刪除或放寬斷言。
- `npm run build`：正式Web建置通過，離線預載233個本機檔案。版本來源同步2.27.0／build23；目前發布來源沒有2.26.0殘留，歷史報告與歷輪驗證腳本保留原版本紀錄。
- 本輪無頭實玩**143項檢查、371張原尺寸驗證圖**：三課三站、兩彎、錯向、滑移緩停、臨停再起步、九位觀察過街、九位逐次邀請、門檻計人、收階關門、重玩換欄、保存重開、暫停、減少動態、拒存仍可玩。斷網後三課全部完成並重開讀回。沒有指定遊戲位置、完成旗標或偽造存檔；只由UI操作與Playwright clock推進RAF／計時器。
- 320×568、568×320、390×844、844×390、768×1024、1024×768、1366×600、1280×640八視口，遊玩與邀請上車控制通過≥60px、在視口內及無遮擋檢查。沒有手機鍵盤說明。
- `npm run test:merge`：**132項、25張回歸圖**；`npm run test:store`：**101項、26張回歸圖**，冷啟動、觀察、首個目標、續玩、保存與安裝後離線通過。所有本輪與既有回歸均無執行錯誤、外部請求；一次只使用一個preview與無頭瀏覽器。
- 效能**EXECUTED**：桌機、手機直式、手機橫式，各三課各三跑，三跑中位p95最大**16.8ms**，九組均≤18ms。路口等待真正開始過街、列車由玩家邀請第一位後才取樣；這是並發機況參考，不是乾淨機況或原生裝置效能。
- 原始日誌為`content/r15/unit-tests.txt`、`build.txt`、`merge-test.txt`、`store-test.txt`；秘密掃描、來源雜湊與最終數字見`secret-scan.json`、`source-manifest.json`、`release-proof.json`。掃描只讀repo文字，不讀秘密目錄、不輸出任何金鑰。

新增商店截圖，保留所有既有檔案：

- `docs/store/screenshots/content-r15/tickets-player-boarding-1290x2796.png`
- `docs/store/screenshots/content-r15/tickets-player-boarding-2064x2752.png`

新增生成美術**0張**、新執行素材0個、依賴0個。全部沿用受管生成原畫；本輪沒有產圖呼叫，manifest的tool為null，沒有虛構工具或模型。風格前綴與來源SHA在`content/r15/art/manifest.json`。

speak-human-tw mode 2事後摘要：原「小孩／單車」與卡片名字不同，統一「小朋友／腳踏車」；原「準備過街」在走路途中仍顯示，改由同一狀態即時顯示「正在過街」；原「正在上車」的自動流程，改為玩家可按的「請小安／小晴／小宇上車」；原「鋪面→踏階→門檻」驗收術語改為「同一扇車門」及當前姓名。原本九格圖帶與小字統計移除，成果只留一句。

開發驗證實際抓到人數標籤擋站牌、窄橫式車票蓋住第一站牌、暫停前DOM落後一格、開門狀態鍵沿用舊文字及過彎只有數像素位移，均已修正並驗證。PowerShell日誌編碼由驗證器辨識UTF16／UTF8，沒有改測試內容來湊通過。

## 未完成與風險

**Apple 4.3風險：中**，屬本機內容自評。三課有不同的交通操作因果，選課、三站與結算外殼仍共用；沒有Apple接受或新的Muse≥8結論。

**BLOCKED**：實體iPhone／iPad真觸控及原生語音需裝置；親子與家長理解試玩需參與者；乾淨機況效能需獨占硬體；Muse分數需審查員重新看15張精選。來源build23不代表已重建、簽章或驗證本輪原生包。

只做本機繁中commit，不push、不部署、不操作商店、不對外發訊息、不透過其他服務派工；原有未追蹤審查檔保留，不納入提交。驗證用瀏覽器與preview於收尾關閉。
