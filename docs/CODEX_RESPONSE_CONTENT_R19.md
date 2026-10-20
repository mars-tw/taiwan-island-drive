# 島嶼交通學院：新內容第19輪

VERIFIED：本機修正、清理後回歸、秘密掃描與證據核對完成。工單2026-10-18，執行2026-10-19。分支僅限 `r1-fun-polish`；版本 **2.31.0／來源build27**，基準 `baece5c`。已讀R17／R18六份評審，依本線指定五項修正既有三課，沒有新增課程或改動其他已通過的遊戲流程。

共同入口：**首頁「海岸實作課」→課程車票→「一起出發」**。

| 課程 | 玩法與本輪修正 |
| --- | --- |
| 把蛋糕平穩送到 | 按踏板起步，看彎道選方向，放開等蛋糕坐穩，第三站臨停再起步。首輪、重玩、盤緣等待都用「回穩中」與灰色「等待回穩」；恢復後按鈕名稱同步復原。車頂與特寫共用位移、傾角和托盤參照，特寫固定倍率，盤緣不縮放、不裁旗尖。第二站與重玩不再用正解亮框或文字預告左右答案，選錯仍留在原地修正。彎道兩個黃色導引牌改為同向，文字路牌保持不透明並移到天空中央。 |
| 路口停看等 | 停穩、先左後右觀察，等來車與朋友通過，再按出發。每站標起點、過街箭頭與對岸；其他朋友全留起點，行走者踏上對岸、沿人行道走到空位，才打勾、增加到岸人數並說「到空位了」。等待仍可再次看左右，不重算觀察次數、不跳過行人；出發鍵只顯示動作短句。「來車」標籤緊鄰車頂，和觀察圈分開。 |
| 形狀車票，找對月台 | 比對形狀與顏色，選站、停穩、開門、點朋友並邀請上車，再親自收階、關門、前進。當站車票從進站、選錯、上車、關門、駛離到重載結果都固定左上；移除無說明的小圓標與虛線框。生成踏階原畫放大並移到列車上層，伸出、收回、門關有清楚差別；收階完成前不出現關門。 |

## 五項驗收與原尺寸截圖

以下路徑均相對 `docs/content/r19/`。`phone-*.png` 為390×844原尺寸直式圖；320×568版本另存 `viewport-320x568/`，沒有縮圖、拼圖或加驗證文字。狀態、座標、SHA與各檢查紀錄見 `acceptance.json`、`screenshots.json`。

| 指定問題 | 可核對的原圖 |
| --- | --- |
| ①踏階伸出→收回→關門 | `phone-tickets-stage-1-seated-3.png` → `phone-tickets-stage-1-retracting.png` → `phone-tickets-stage-1-close-ready.png` → `phone-tickets-stage-1-closed.png`。前兩個完成態門仍開，只有踏階輪廓不同；收回後才有關門。三站均保留同名序列；`departing-1`～`departing-3`證明接著實際駛離。 |
| ②首輪／重玩／盤緣一致等待 | `phone-cake-first-release-wait.png`、`phone-cake-replay-release-wait.png`；連拍 `phone-cake-tray-edge-sliding.png` → `phone-cake-tray-edge-recovering.png` → `phone-cake-tray-edge-recovered.png`。主車與特寫從盤緣回到中央，前兩格鎖定、最後一格才恢復方向。 |
| ③過街方向、到空位才計數 | 第二站 `phone-crossing-stage-2-grandma-moving-1.png` → `moving-2.png` → `phone-crossing-stage-2-grandma-arrived.png`：第一格尚在斑馬線、第二格到對岸但尚未落位，兩格都不增加人數；第三格才計1人。三站1人到岸另見stage-1-child-arrived、stage-2-grandma-arrived、stage-3-bike-arrived，起點均仍有另外2人。`phone-crossing-stage-3-ready-depart.png`及`departing-1`～`departing-3`證明出發。 |
| ④車票固定、三欄人數 | 三站 `phone-tickets-stage-N-wrong.png`、`boarding-1-1.png`、`seated-3.png`、`close-ready.png`、`closed.png`、`departing-2.png`，N=1～3；每格車票都可見。精選第12張同時顯示「月台2人／上車中1人／已入座0人」。`phone-tickets-saved-result.png`證明重載後仍為已完成且保留當站車票。 |
| ⑤路牌與來車標籤 | `phone-cake-first-bend.png`、`phone-cake-replay-old-direction.png`及上述盤緣三格；兩塊黃色導引牌同向，深藍字米白底路牌不透明、不疊燈塔。`phone-crossing-stage-1-child-look-left.png`、`child-look-right.png`、`phone-crossing-same-station-right-has-car.png`依序證明左有車、右空但另一側有車、車到右側。相同狀態另有320×568圖；路牌對比計算見 `contrast.json`，門檻4.5:1。 |

R18 Muse的補充問題一併處理：主車與特寫使用同源姿態，奶奶落位後才計數；第二站與重玩的正解強提示色收起。三站沿用既有判斷差異，沒有另加內容：蛋糕第二站左右連彎、第三站臨停；路口第二站從右側起步且奶奶先過、第三站腳踏車先過且速度不同；車票第二站橘三角、第三站綠正方形。對應決策圖在 `phone-cake-stage-2-wrong-turn.png`、`phone-cake-stage-3-bay-stopped.png`、第二／三站look-left與wrong圖。上車門前→門框→窗內的三格，各站都有boarding-1-1、boarding-1-2、seated-1。

## 精選、商店圖與回歸

`docs/content/r19/review-set/`固定15張、每課5張，依課程順序。01～05含重玩錯向回歸、盤緣三連圖與臨停；06～10含三站1人到岸與奶奶到岸三格；11～15含錯選回歸、實際上車三欄人數及踏階／關門前後。都是原圖逐位元複製，索引與SHA在 `review-set-manifest.json`、`review-guide.md`。精選15張無法包含全部補充驗收格，沒有宣稱審查員已看精選外的圖。

新增商店圖：`docs/store/screenshots/content-r19/tickets-player-boarding-1290x2796.png`及`docs/store/screenshots/content-r19/tickets-player-boarding-2064x2752.png`，由指定DPR直接擷取，展示玩家邀請後真正在上車。它們是無頭瀏覽器畫面；既有商店圖全部保留。前後對照保留 `before-cake.png`／`after-cake.png`、crossing、tickets三組，原尺寸及基準git物件SHA見 `before-after.json`。

## 驗證、清理與美術

最終數據見 `release-proof.json`：單元254項、課程瀏覽器244項檢查、整合132項、商店101項，全部通過；703張原尺寸課程證據逐檔核對SHA。原有39個測試檔及248項既有測試的斷言未改，新增6項。建置預載239個離線本機檔案。三課各三站用公開UI操作到完成、保存、重載，並斷網再次通關；沒有改寫遊戲位置、完成旗標或製造存檔。另驗證休息不前進、拒絕儲存仍可繼續、減少動態可過街。

八視口為320×568、568×320、390×844、844×390、768×1024、1024×768、1366×600、1280×640；操作目標至少60px、在視口內且可命中，手機沒有鍵盤說明。最窄直式另實際通關三課並補齊盤緣、錯向、三種來車觀察圖；三站錯選在320×568、390×844、568×320均檢查裁字與標籤重疊。

收尾循序執行 `npm test`、`npm run build`、5286埠的 `npm run test:merge`、5113埠的 `npm run test:store`。本機只保留一個preview與一個無頭瀏覽器，所有頁面與服務用完關閉。原始紀錄為unit-test.txt、build-test.txt、merge-test.txt、test-store.txt及merge／store資料夾。效能九組、各三次RAF量測，p95中位數16.7～16.8ms，均≤18ms；並發載只供參考，不冒稱乾淨機況或實機效能。秘密掃描零命中，只讀repo文字、不讀 `.secrets`，結果見 `secret-scan.json`。路牌文字對比10.77:1，高於4.5:1門檻。

EXECUTED：最終淨刪155個受版控且未修改的舊媒體，工作目錄釋出99,602,140 bytes（94.99 MiB）。先驗證repo絕對範圍、完整清單與SHA，再逐檔刪除；包含舊review-set、整合截圖、連拍與比較圖。兩階段收據為 `cleanup-plan.json`／`cleanup-result.json`與`cleanup-additional-plan.json`／`cleanup-additional-result.json`。依賴複核另找到106張歷史驗證輸入，已從基準git物件原樣回復並核對SHA，見 `cleanup-dependency-audit.json`；上述數字已扣除回復檔案。另保留3,934張舊媒體：美術來源、歷史驗證manifest輸入與腳本指名檔，逐檔原因與讀取manifest列在收據retained。各輪Markdown、評審、現行商店圖均保留；44份原有未追蹤評審文件逐檔雜湊保護，未刪除、未修改、未加入commit。清理後重跑指定測試，不刪測試、不放寬原斷言。

新增生成美術 **1次呼叫／1張執行WebP**，實際工具 `image_gen.imagegen`。既有海岸彎道修正遠端相反箭頭，沿用R17 PROMPTS的完整風格前綴；原圖、提示、轉檔與SHA在 `art/PROMPTS.json`、`art/manifest.json`。踏階重用原有生成PNG，調整尺寸、圖層與收回位移；沒有以方塊代替素材，沒有新增依賴、SDK或本機AI呼叫。

文案依mode 2直接修正：「慢慢停下」在回穩態改「回穩中」，避免煞車已鎖仍要求按；「奶奶到了，走到空位」改為落位後才說「奶奶到空位了」，避免文字先於動作；「已到岸／正在過街」從出發鈕移除，改「等朋友到岸／出發」；重玩「再按左轉」改「看彎道路牌，選一邊轉」，讓玩家依場景判斷。

Apple 4.3風險自評：**中**。三課保留平穩運送、路口觀察與車票照顧的不同操作，共同選課、三站進度與結果外殼仍有系列模板感；不是Apple審查結論。沒有廣告、付費、外連、第三方SDK、帳號、線上功能、暴力、淘汰或計時懲罰。

BLOCKED：實體iPhone／iPad觸控及原生語音需要裝置；親子試玩需要參與者；乾淨機況效能需要獨占硬體；Muse複審≥8需要獨立評審。沒有自行給出複審分數。本輪只更新原生來源版本，未製作簽署套件；只作本機commit，未push、部署、操作商店後台、對外傳訊或派工。
