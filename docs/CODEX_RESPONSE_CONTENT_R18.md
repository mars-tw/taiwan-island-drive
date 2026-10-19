# 島嶼交通學院：新內容第18輪

VERIFIED：本機修正、清理後回歸與證據驗證完成。工單2026-10-18，執行2026-10-19。僅修改 `r1-fun-polish`，版本 **2.30.0／來源build26**。本輪讀完R16、R17共六份審查，只修既有三課。

三課共同入口：**首頁「海岸實作課」→課程車票→「一起出發」**。

| 課程 | 本輪修正與玩法 |
| --- | --- |
| 把蛋糕平穩送到 | 踏板起步，看到彎再選方向，放開回穩，臨停後再起步。首輪與重玩都直接顯示判定中的彎道原畫及同向路牌；直路不顯示「方向相反」。錯向持續按住時，提醒保持橘色，不會自行消失；小卡短句避免單字斷行。持續轉到盤緣時，所有方向鈕立刻退出實心黃，改為灰色等待；放開、蛋糕回中央後才恢復操作。車頂與特寫共用姿態。 |
| 路口停看等 | 在線後停穩，先看左再看右，等車與朋友，最後自己出發。看左有車、看右沒車及看右有車各有相應字幕；另一側仍有車時另述原因。來車整台留在車道內，標籤自動避開觀察圈。玩家改用阿路車尾原畫，向上駛離。路口完成站數與右上點同源；本站到岸人數另列，朋友踏上對岸即說「到了」，沿人行道走至空位後才讓下一位起步。 |
| 形狀車票，找對月台 | 看形狀與顏色、選月台、停穩開門、點朋友並邀請。錯選小籤改成兩行，完整留在牌內；標題、人數與牌框分開。月台、上車中、已入座分列，三者合計固定三人。候車圖像略小於門口人物，開門前後前景保持一致。三人入座後仍須玩家收踏階、關門、前進，實際駛離後才結算。結尾改成已完成的語氣。 |

## R17 Muse五項驗收與原尺寸證據

以下均為 `docs/content/r18/` 下390×844手機直式原圖，沒有縮放、拼圖或驗證文字覆蓋。完整狀態、座標、來源與SHA見 `acceptance.json`、`screenshots.json`。

| 項目 | 原尺寸截圖路徑（相對上述資料夾） |
| --- | --- |
| 1．看哪邊就說哪邊 | 同一站 `phone-crossing-stage-1-child-look-left.png`（左有車）→ `phone-crossing-stage-1-child-look-right.png`（右沒車、另一側仍有車）→ `phone-crossing-same-station-right-has-car.png`（車駛到右側）。觀察圈、字幕與停用出發一致。 |
| 2．到岸與出發 | `phone-crossing-stage-2-grandma-moving-2.png` → `phone-crossing-stage-2-grandma-moving-3.png` → `phone-crossing-stage-2-grandma-arrived.png`；到岸當格即改字、計入本站人數。`phone-crossing-stage-1-ready-depart.png`、stage-2、stage-3依序顯示1/3、2/3、3/3，與亮點一致。第三站 `phone-crossing-stage-3-departing-1.png` → departing-2 → departing-3顯示車頭朝上起步；三站都保留同序列。 |
| 3．盤緣放開 | `phone-cake-tray-edge-sliding.png` → `phone-cake-tray-edge-recovering.png` → `phone-cake-tray-edge-recovered.png`。從第一張起方向鈕已非按住態；同一蛋糕從盤緣回中央，第三張才恢復下一步。 |
| 4．重玩換彎 | `phone-cake-first-bend.png`與 `phone-cake-replay-bend.png`保留兩個原尺寸檔供並排；重玩錯用舊方向見 `phone-cake-replay-old-direction.png`，當下有彎道與同向路牌，路程不增加。直路回歸 `phone-cake-first-start.png`不出現錯向。 |
| 5．錯選與手動出發 | `phone-tickets-stage-1-wrong.png` → `phone-tickets-stage-1-seated-3.png`（三人入座、門開）→ `phone-tickets-stage-1-close-ready.png`（踏階收起）→ `phone-tickets-stage-1-closed.png` → `phone-tickets-stage-1-departing-2.png`。駛離連拍另有departing-1、departing-3；結尾重載為 `phone-tickets-saved-result.png`，文案不再要求已完成的動作。 |

本線指定回歸：三站車尾與計數見上表第2項；錯向僅於可見彎道見第4項；左側來車完整、標籤不壓圈見第1項。錯選小籤三視口、三站回歸在 `layout-proof/device-320x568-tickets-stage-N-wrong.png`、`device-390x844-tickets-stage-N-wrong.png`、`device-568x320-tickets-stage-N-wrong.png`（N=1、2、3）。

上車額外三格：各站 `phone-tickets-stage-N-boarding-1-1.png` → `boarding-1-2.png` → `seated-1.png`，顯示同一小安到門前、受門框遮擋及窗內入座；三個身份不重複。錯序與重玩回歸另有 `phone-crossing-wrong-side.png`、`phone-tickets-replay-layout.png`、`phone-tickets-replay-old-position.png`。臨停與再起步見 `phone-cake-stage-3-bay-stopped.png`、`phone-cake-stage-3-bay-restarted.png`。

## 審查精選與商店圖

`docs/content/r18/review-set/`固定15張原尺寸手機直式圖，每課5張，依課程順序：01～05首輪／重玩彎道及盤緣連續三格；06～10觀察結論連續三格、奶奶到岸、第三站3/3駛離；11～15錯選、三人入座門開、收階、關門、駛離。每張是原圖逐位元複製。索引及SHA在 `review-guide.md`、`review-set-manifest.json`。

15張上限無法同時容納五項全部補充格。三站1→2→3的完整連拍、上車三格、三視口錯選、存檔重載及其餘回歸留在上述原尺寸路徑；不宣稱審查員已看精選外的圖，也不自行給Muse分數。

新增商店圖：`docs/store/screenshots/content-r18/tickets-player-boarding-1290x2796.png`、`tickets-player-boarding-2064x2752.png`。均為無頭瀏覽器按指定DPR直接擷取，展示邀請後正在上車的主場景；不是實機畫面。既有商店截圖全數保留。

## 測試與證據清理

VERIFIED：清理後已重跑指定完整測試，均全綠。9組無頭執行紀錄合計282項檢查、885張原尺寸新內容圖；最終彙總見 `release-proof.json`，後續重拍覆蓋的來源與雜湊見 `recaptures.json`。

- `npm test`：248項，原242項測試檔逐檔與基準commit比對不變，新增6項。沒有刪除既有測試或放寬斷言。
- `npm run build`：離線預載238個本機檔案。六個版本來源同步2.30.0／build26，沒有新增依賴。
- 本輪無頭UI：282項檢查通過。三課三站實際通關、錯誤可修正、存檔重載、重玩換題、盤緣回穩、到岸與出發、逐人邀請／收階／關門／駛離。每張狀態圖都檢查文字範圍與祖先裁切、標籤兩兩重疊、路口站數與亮點、月台＋上車中＋入座合計三人。沒有改寫位置、完成旗標或製作假存檔。
- 八視口：320×568、568×320、390×844、844×390、768×1024、1024×768、1366×600、1280×640；可操作按鈕至少60px、在視口內可命中，手機沒有鍵盤說明。最窄直橫式另實際通關三課所有站、重玩及結算，原圖與狀態在 `viewport-320x568/`、`viewport-568x320/`。
- 斷網後三課全部通關並重載；拒存仍可繼續、休息不前進、減少動態可過街，證據各存 `offline/`及本輪negative manifest。
- `npm run test:merge`在5286通過132項、`npm run test:store`在5113通過101項，循序執行，一次只保留一個preview與一個無頭瀏覽器。原始結果分別在 `merge/merge-path.json`、`store/review-path.json`。
- 效能九組三跑中位p95為16.7～16.8ms，均≤18ms，見 `performance.json`；本機同時有其他線路，只列並發參考，不冒稱乾淨機況或實機量測。秘密掃描零命中，見 `secret-scan.json`，不讀取 `.secrets`。

EXECUTED：清理51個被取代的舊證據檔，工作目錄釋出23,348,165 bytes（22.27 MiB），包含R17舊review-set、未作驗證輸入的整合截圖及比較圖。保留所有Markdown、各輪評審意見、商店圖、41個既有未追蹤文件。另保留2,935個有依賴或來源用途的舊媒體：2,857個歷史瀏覽器manifest驗證輸入、27個腳本指名輸入、51個生成來源／美術契約。逐檔理由、大小及刪除SHA列於 `cleanup-plan.json`、`cleanup-result.json`。清理僅限受版控且未修改的舊媒體，已先核對repo絕對路徑與完整雜湊；沒有刪除既有未追蹤檔，沒有修改他人未提交檔。

## 美術、文案與限制

新增生成美術 **0張／0次呼叫**。重用既有 `image_gen.imagegen` 生成的車尾與彎道原畫，執行檔SHA未變；來源及舊生成契約在 `art/manifest.json`。本輪只調整既有素材、方向與版面，沒有程序繪製場景，也沒有宣稱新增骨架、真實奶油物理或新步態。

繁中文案依mode 2直接校正，主要改動：

| 原句 | 原因 | 改成 |
| --- | --- | --- |
| 安全通過0/3 | 混淆本站人數與站數 | 路口完成X/3；本站到岸Y/3人 |
| 來車通過中，先等一等 | 與正在看的空車道不一致 | 左／右邊有車；右邊沒車，另一邊有車 |
| 奶奶正在過街，等到對岸 | 腳已到岸仍顯示過街 | 奶奶到了，走到空位 |
| 方向相反了，放開再看路 | 小卡末字換行，持續錯向時提醒會消失 | 方向相反，放開看路 |
| 放開按鈕，等蛋糕回中央 | 小卡末字換行 | 放開，等蛋糕回中央 |
| 你選的・不對 | 單行超出牌寬 | 你選的／不對，分兩行 |
| 車內1人 | 上車中被算成已入座 | 月台／上車中／已入座分開 |
| 讓三位坐好再出發 | 結算時仍要求已做過的事 | 三站對好票、坐好、關門，出發了 |

Apple 4.3風險自評：**中**。三課仍有不同操作與交通照顧情境；共同選課、三站進度與結果外殼仍有系列模板感。這是本機內容自評，不代表Apple審查結論。沒有加入廣告、付費、外連、第三方SDK、帳號、線上功能、暴力、淘汰或計時懲罰。

BLOCKED：實體iPhone／iPad觸控與原生語音需要裝置；遮字幕辨向及親子試玩需要參與者；乾淨機況效能需要獨占硬體；Muse複審≥8需要獨立審查。本輪不派工、不開可見視窗、不簽署或上傳原生套件，不push、不部署，不操作商店後台，不傳訊息給任何人。僅建立本機commit，供後續複審。
