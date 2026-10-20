# 新內容第16輪：三課操作與畫面一致

VERIFIED：本機修正與驗證完成。工單2026-10-18，執行2026-10-19；限 `r1-fun-polish`，版本 **2.28.0／來源build24**。已讀R14、R15的Muse／GPT／Claude六份審查；唯一清單是 `content/CONTENT_REVIEW_R15_MUSE.md` 的下一輪五項，同時修正本線路指定的六項嚴重問題。這是執行者驗證，Muse尚未重新評分。

## 三課做了什麼、怎麼玩、入口

共同入口：**首頁「海岸實作課」→課程車票→「一起出發」**。維持圖像、既有本機語音介面與短句，不新增課程。

- **把蛋糕平穩送到**：直路按踏板，彎道按住對應方向，放開回穩，再繼續轉向。正確短按為綠色「轉彎中・很穩」；錯向停下，只有錯向或持續過久接近盤緣才警告。放開後狀態卡、字幕與亮鍵共用一份下一步，不再說可起步卻要求轉向。移除回穩次數。原有滑移、緩停、兩彎、臨停再起步保留，路景隨實際路程捲動；盤緣放大窗保留完整旗尖。結尾是同三位乘客與完整三層蛋糕到桌邊的專屬原畫。
- **路口停看等**：停在線後，玩家先看左、再看右，每位朋友都重新觀察；有車就等，到岸才加一，三位到岸後自行出發。先看右會得到可修正短句。由駕駛位置發出的範圍、左右觀察框與接近的來車，讓場景本身可讀；完成態統一「左邊看過／右邊看過」。三站改變路面位置、人物起點與來車方向。固定四鍵及字幕空間，等待、過街不擠動場景；人物與腳下名牌放大。結尾保留同三位朋友在對岸揮手道謝，移除與完成標題重疊的遊玩計數。
- **形狀車票，找對月台**：看形狀和顏色、自己選站、前進停穩後才能開門。未選不先標答案；選錯指出哪一個線索不同，門保持關閉，可自己改選。開門後先點月台上的人物，再按邀請，一次只動一人；跨門檻才計入車內。三位坐好後，自己收踏階、關門、前進。放大窗採正式圓角框與當前動作，保持當前乘客焦點到入座，不提早切到尚未邀請的下一位；三張月台牌完整留在窗外，逐框檢查不重疊。站名與人數分列，窄畫面人數移到底部，人物名牌在腳下。結尾同款列車在海岸軌道上，同三位乘客以新姿勢揮手。

本輪沒有新廣告、付費、內購、外連、第三方SDK、帳號、線上功能、淘汰或計時懲罰。仍是操作讀值驅動的2D原畫投影與既有姿勢幀；新增揮手為靜態姿勢，不宣稱新骨架、揮手循環或真實3D蛋糕物理。

## Muse五項驗收與原尺寸截圖

以下路徑皆以repo為根；手機原圖為390×844。完整SHA、UI狀態、控制外觀與幾何見 `docs/content/r16/acceptance.json`、`screenshots.json`。

| 項目 | VERIFIED與原尺寸路徑 |
| --- | --- |
| 1．蛋糕狀態一致與正確回饋 | 同站連續 `docs/content/r16/phone-cake-stage-2-wrong-turn.png` → `phone-cake-stage-2-left-driving.png` → `phone-cake-stage-2-left-recovered.png`；正確按住0.5秒另見 `phone-cake-positive-half-second.png`。盤緣三格為 `phone-cake-tray-edge-sliding.png` → `phone-cake-tray-edge-stopped.png` → `phone-cake-tray-edge-recovered.png`。路景投影位移約50.7px，錯向路程不增加。 |
| 2．場景真的看左右 | `docs/content/r16/phone-crossing-stage-1-child-look-left.png` → `phone-crossing-stage-1-child-look-right.png`；觀察範圍換側、來車接近，駕駛仍在線後。三種朋友過街各見同站 `child-moving-2.png`、`bike-moving-2.png`、`grandma-moving-2.png`，完整名稱皆有 `phone-crossing-stage-1-` 前綴。三站路面與起點見 `phone-crossing-stage-1-start.png`、stage-2、stage-3。九位皆有重新觀察、過街三格、到岸原圖。 |
| 3．選月台、具體錯誤與自己點人 | 同站 `docs/content/r16/phone-tickets-unselected.png` → `phone-tickets-stage-1-wrong.png` → `phone-tickets-stage-1-chosen.png`；最後一張已由玩家改選、停穩開門並點人，才出現邀請確認。跨門檻與入座見 `phone-tickets-stage-1-boarding-1-1.png`、`boarding-1-2.png`、`seated-1.png`，後三者同樣有 `phone-tickets-stage-1-` 前綴。另有每站retracting／close-ready／closing／closed與departing三格、`phone-tickets-replay-layout.png`。 |
| 4．專屬結尾與準確成果 | `docs/content/r16/phone-cake-saved-result.png`、`phone-crossing-saved-result.png`、`phone-tickets-saved-result.png`。三課都實際完成、離開並重載讀回；三站勾選與再玩／換課保留。成果不把同三人跨站重複出場誤寫為九位。 |
| 5．多個可理解的選項與安全修正 | 蛋糕錯向→正向→回穩三格；路口 `docs/content/r16/phone-crossing-wrong-side.png` → child-look-left → child-look-right；車票未選→錯選→改選及 `phone-tickets-wrong-friend.png`。左右鍵、左右觀察、三月台與候車人物都可選，錯誤只停下並給下一步，不淘汰。 |

本線路其餘驗收：`docs/content/r16/layout-proof/` 有320×568、390×844、568×320三視口第1～3站站名圖，名稱為 `device-320x568-tickets-stage-1-labels.png` 等（390寬使用 `phone-tickets-stage-1-labels.png`）；站次、人數、月台文字與人物名牌逐框檢查不重疊、不截字。八視口另有 `device-<寬>x<高>-<課程>.png`。蛋糕兩彎、第三站臨停／再起步、三種載具各站駛離三格均保留；駛離位移至少100px、尺寸變化不超過一成。

`docs/content/r16/review-set/` **恰15張，每課5張**，01～05蛋糕、06～10路口、11～15車票，皆為原尺寸逐位元複製。核心操作與連續因果優先，另各保留一張重載結尾。15張無法放入九位完整過街、全部邀請、收階關門與八視口；這些補充原圖已留存，但不宣稱審查員只看精選就已確認所有補充項目。索引見 `review-guide.md`、`review-set-manifest.json`。

## 測試與美術

- `npm test`：**237／237**；原232項保留，新增5項。以基準c429d761逐檔比對既有測試，不刪除或放寬斷言。
- `npm run build`：通過；離線預載237個本機檔案。發布來源版本2.28.0／build24一致，舊輪報告及驗證腳本保留歷史版號。
- 最終無頭UI驗證 **155項、398張原尺寸圖**；三課三站通關、保存重載、錯向、長按盤緣緩停、兩彎、臨停再起步、九位各自觀察、九位先選再邀請、門檻計人、手動收階關門、重玩換欄、暫停、減少動態與拒存仍可玩均通過。斷網後三課全部完成並重載讀回。只用公開UI與Playwright clock推進RAF／計時器；沒有指定遊戲位置、完成旗標或製作假存檔。
- 八視口320×568、568×320、390×844、844×390、768×1024、1024×768、1366×600、1280×640：遊玩及邀請上車控制至少60px、視口內且可命中，手機沒有鍵盤說明。另做三視口三站標籤檢查。
- `npm run test:merge`：**132項**；`npm run test:store`：**101項**。所有本輪與指定回歸的執行錯誤、失敗HTTP及外部請求均為0；一次只用一個preview與無頭瀏覽器。
- 效能 **EXECUTED**：桌機、手機直式、手機橫式各三課，各三跑中位，最大p95 **16.8ms**，九組均≤18ms。是真實RAF取樣，列車邀請後才量測；並發機況僅供參考，不當作乾淨機況或原生裝置結果。
- 秘密掃描 **VERIFIED：0命中**；只讀repo文字，排除秘密目錄、symlink、node_modules與建置暫存，不輸出命中值。細節在 `secret-scan.json`、`source-manifest.json`、`release-proof.json`；各測試原始日誌皆在 `docs/content/r16/`。

新增商店截圖，既有商店截圖全部保留：

- `docs/store/screenshots/content-r16/tickets-player-boarding-1290x2796.png`
- `docs/store/screenshots/content-r16/tickets-player-boarding-2064x2752.png`

新增美術 **4張runtime WebP、2次 `image_gen.imagegen`**：三位乘客的揮手姿勢＋蛋糕送達原畫。沿用相同英文風格前綴，工具未揭露模型slug，記為null；沒有用本機GPU生成。原圖、提示、凍結的蛋糕設計參考、來源SHA、alpha、64px及色彩量測見 `docs/content/r16/art/`。Sharp只作分格裁切、編碼與檢查縮圖。沒有新增依賴。手機直式／橫式／iPad的R15前後比較原圖在 `docs/evidence/content-r16/`。

說人話mode 2事後摘要：

| 原句 | 原因 | 改成什麼 |
| --- | --- | --- |
| 穩定度・蛋糕歪了 | 正確短按也像被處罰 | 轉彎中・很穩；接近盤緣才警告 |
| 已放開，可起步 | 與同畫面的轉向指令不同 | 坐穩了，再按左轉繼續（依彎向變更） |
| 回穩24次 | 內部累計對幼兒沒有幫助 | 蛋糕坐穩了 |
| 9位朋友都等到了 | 同三人重複出場且主詞不清 | 三站都看左右，等大家安全過街 |
| 形狀和顏色都對上，9位坐好了 | 人數與畫面不同 | 三站都對好車票，讓三位坐好再出發 |
| 同一扇車門・小安 | 像驗收註解 | 點朋友，邀請上車／小安正在上車 |
| 形狀或顏色不同 | 無法辨認錯在哪裡 | 形狀對了，顏色再看看（或對應形狀提示） |

## 未完成與風險

**Apple 4.3風險：中**，屬本機內容自評。操作因果與專屬回顧已分開，三課仍共用選課、三站與導覽外殼；沒有Apple接受或Muse≥8的證據。

**BLOCKED**：實體iPhone／iPad真觸控與原生語音需要裝置；親子試玩需要參與者；乾淨機況效能需要獨占硬體；Muse≥8需要審查員重新看15張精選。來源build24不代表已重建、簽章或驗證本輪原生包。

只做本機繁中commit，不push、不部署、不操作商店、不對外發訊息、不透過其他服務派工。原有未追蹤審查全部保留，不納入提交；未修改他人未提交檔案。驗證用瀏覽器與preview於收尾關閉。
