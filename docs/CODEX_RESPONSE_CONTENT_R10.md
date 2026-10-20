# 島嶼交通學院：新內容第 10 輪

VERIFIED，2026-10-19。版本 **2.22.0／原生來源 build18**，分支 **r1-fun-polish**，基線 **ddaba07**。Muse 五項本機驗收、Claude 嚴重問題、三課實玩與品質閘均已完成。本輪只修三課既有內容與審查缺口，沒有增加第四項內容。Muse 複審尚未發生，不宣稱已取得 8 分。

正常入口均為 **首頁「海岸實作課」→ 選課 →「一起出發」**；完成後從相同入口查看保存結果或重玩。免費、MIT、離線遊玩，沒有新增依賴、帳號、廣告、內購、外連或第三方 SDK。

| 課程 | 修改、玩法與完成回饋 |
|---|---|
| 把蛋糕平穩送到 | 按住／放開踏板與左右扶正，完成三站起步坡、連彎、臨停再起步。主提示、儀表與唯一亮鍵共用當下動作；待踩黃、踩住橘色下沉、放開灰。停穩不再提示左轉。特寫縮為 144px，道路加高，車頂蛋糕縮小，車輪留在前景道路。三站後顯示既有一起分享插畫並保存。 |
| 路口停看等 | 原「路口停看聽」改名，符合實際停車、看左右、等人通過的內容。每位朋友到岸後清除兩側確認，下一位重新看左右；缺側出發會指出缺哪邊。新增站立等待圖、灰階與等待牌。奶奶等待、三步態與到岸固定比例，勾號留在她身上，上方第 1 格同步變綠。三站共 9 位安全通過後顯示既有朋友結尾插畫並保存。 |
| 形狀車票，找對月台 | 同時配對形狀和顏色，停穩才開門。三面牌以立柱與編號接到月台；深度鋪面上的虛線、序號與斜向單列讓動線可讀。新增車門內部與金屬踏板；逐人走到門框、車內走道、座位，前人落座後下一人才動。關門後按鈕同步改「門關好了」，三站 9 人上車後保存。 |

## Muse 五項驗收與原尺寸證據

以下手機 PNG 均為 **390×844** 無頭瀏覽器原圖。沒有拼圖、縮放或後製加字；只在擷取期間暫停 RAF，不改遊戲時鐘、人物位置或完成資料。acceptance.json 保存狀態、尺寸、SHA-256、提示、控制狀態與人物矩形。

| 項目 | 狀態與驗收結果 | 原圖（相對 repo 根目錄） |
|---|---|---|
| 1．踏板三態 | VERIFIED：未踩／踩住／放開外觀不同；鬆踏板為灰，停穩只亮踏板。 | docs/content/r10/phone-cake-pedal-ready.png、phone-cake-pedal-pressed.png、phone-cake-pedal-released.png、phone-cake-bay-stopped.png、phone-cake-bay-restarted.png |
| 2．每人重置觀察 | VERIFIED：1／3 後兩鈕無勾；只看左便出發，仍為 1／3、車輛不動，明示「還沒看右邊」。 | docs/content/r10/phone-crossing-stage-2-passed-1.png、phone-crossing-stage-2-missing-right-2.png；blocked-start-proof.json 另比對汽車區域原始像素。 |
| 3．單列上車路徑 | VERIFIED：編號 1、2、3 沿同一路徑前後候位，人物框互不重疊；連續三格依序為第 1、2、3 位在門檻，其餘人在隊伍／車內，人數相符。 | docs/content/r10/phone-tickets-stage-3-queue.png、phone-tickets-stage-3-doorway-1.png、phone-tickets-stage-3-doorway-2.png、phone-tickets-stage-3-doorway-3.png、phone-tickets-stage-3-aisle.png |
| 4．牌與月台對應 | VERIFIED：三面牌完整露出；立柱接到相同編號月台段。錯站與停對都有原圖，8 視口另驗證人物框與站牌零交集。 | docs/content/r10/phone-tickets-stage-3-wrong-closed.png、phone-tickets-stage-3-queue.png；browser-matrix.json。 |
| 5．等候／通過狀態 | VERIFIED：灰色站姿加等待牌；奶奶是唯一彩色行進者，到岸不壓住腳踏車。五格人物框均高 **124px，差 0%**，與其餘人物交集均為 0。 | docs/content/r10/phone-crossing-grandma-waiting.png、phone-crossing-grandma-step-1.png、phone-crossing-grandma-step-2.png、phone-crossing-grandma-step-3.png、phone-crossing-stage-2-passed-1.png；grandma-five-frames.json。 |

Claude 五個嚴重問題全部對照：亮鍵／文字由相同動作產生；奶奶全程同高且分道；到岸勾與奶奶框相交、與其他人物不相交；三站門檻人物都與門框相交；三站關門圖按鈕均為「門關好了」。最後一項原圖為 phone-tickets-stage-1-closed.png、phone-tickets-stage-2-closed.png、phone-tickets-stage-3-closed.png。GPT 指出的停穩仍提示左轉與「再看一次」卻保留勾，也已一併修正。

## 補足上一輪未見證據

- 三課三站結算：phone-cake-stage-1-result.png～phone-cake-stage-3-result.png、phone-crossing-stage-1-result.png～phone-crossing-stage-3-result.png；車票三站的 queue／doorway-1～3／aisle／closed 各一組。所有檔案位於 docs/content/r10/。
- 分享、朋友結尾與重開保存：phone-cake-complete.png、phone-crossing-complete.png、phone-tickets-complete.png，以及各課 phone-<課程>-saved-result.png。蛋糕／路口結尾沿用靜態插畫，沒有宣稱新增連續揮手動畫。
- 其餘朋友出場：phone-crossing-stage-1-child-moving.png、phone-crossing-stage-1-bike-moving.png、phone-crossing-stage-3-grandma-moving.png 等；三站每位朋友都有實際過街原圖與確認／通過數。
- 車票第 1、2 站：phone-tickets-stage-1-doorway-1.png、phone-tickets-stage-2-doorway-1.png 等；每站上客期間實際連點前進三次，車與人數不變。
- 離線與存檔韌性：phone-crossing-offline-result.png、phone-crossing-offline-saved.png、phone-crossing-storage-denied.png；原圖與執行紀錄互相對照，不以截圖單獨冒稱證明網路狀態。

## 審查精選集

**docs/content/r10/review-set/** 固定 15 張，每課 5 張，原尺寸直接複製並讀回 SHA-256；排序與來源在 review-set-manifest.json。

- 01～05：踩住／放開，臨停／再起步，保存後的分享結尾。
- 06～10：奶奶起步／中途／到岸，下一位只看一側遭阻擋，保存後的路口結尾。
- 11～15：車票錯站關門；第 1、2、3 位依序在門檻；全員入座關門且文字同步。

精選含 13 張遊玩畫面與 2 張重開保存結尾。五格尺度量測、車票第 1、2 站、車內走道、車票保存及離線等額外原圖在上述目錄；不假稱審查員會看到精選以外的圖。

## 驗證紀錄

| 項目 | 結果 |
|---|---|
| npm test | VERIFIED：207／207，零失敗、零跳過。原有 204 項及所有斷言逐檔對照基線不變，新增三課各一項。unit-tests.txt。 |
| npm run build | VERIFIED：車輛表面檢查、正式建置與 228 個本機快取檔通過。build.txt。 |
| 三課無頭實玩／RWD／離線／商店原圖 | VERIFIED：117 組檢查、83 張手機／裝置／商店原尺寸圖。三課三站均實際操作完成並重開保存；9 次過街確認、9 位安全通過、9 人上車。零執行錯誤、HTTP 失敗及外部請求。browser-cake／crossing／tickets／matrix／resilience／store.json。 |
| 觸控與版面 | VERIFIED：320×568、390×844、568×320、844×390、768×1024、1024×768、1366×600、1280×640。96 組檢查，可操作目標 ≥60px、可點擊且不出界；人物與站牌零交集；手機無鍵盤說明。 |
| npm run test:merge，5286 | VERIFIED：132 項、11 尺寸、25 張原圖，數學→火車→汽車→飛機→學生證保存重開全過，零執行錯誤與外部請求。merge-test.txt、merge/merge-path.json。 |
| npm run test:store，5113 | VERIFIED：101 項、12 尺寸、26 張原圖，冷開、觀察、第一目標、續玩、保存、拒絕儲存與安裝後離線全過，零執行錯誤與外部請求。store-review-test.txt、store/review-path.json。 |
| 原生離線素材包 | VERIFIED：npm run native:build 與 verify-native-package.mjs 通過 28 項，223 個本機檔案、remoteServer=false；6 張新素材 hash 與 runtime 相同。native-build.txt、native-package-test.txt、native-bundle-manifest.json。不等於簽章或實機證明。 |
| 並發機況效能 | VERIFIED：6 模式 × 3 視口 × 3 次共 54 次，每次 2 秒 rAF；18 組三跑 p95 中位數最高 16.8ms，個別取樣 p95 最高同為 16.8ms，≤18ms。performance.json／performance-test.txt。這是並發機況參考，並非乾淨機況、原生效能或 CPU／GPU render time。 |
| 發布驗證／秘密掃描 | VERIFIED：版本 2.22.0／build18 同步，83 張原圖及 15 張精選尺寸／SHA-256 讀回一致，舊測試及斷言不變，原生包包含全部新美術，repo 文字秘密掃描零命中。release-verification.txt、secret-scan.json、source-manifest.json。 |

新增美術採用 **5 個設計／6 個 runtime 圖檔，4 次 image_gen.imagegen 呼叫**，含一版被取代的月台。三個等待姿態、車門、踏板與完整月台位於 public/art/content-r10/；原圖、完整提示、被取代原因、alpha、64px 預覽、hash 與色彩量測位於 docs/content/r10/art/。沒有使用方塊或 emoji 代替人物、車門或場景。模型 slug 未揭露，manifest 明列 null。亮度 0.359～0.539、飽和度 0.491～0.816、近黑比例最高 31.36%；奶奶灰髮與白花的低飽和像素為 20.15%，保留既有人物辨識，不把此單檔宣稱低於 20%。

商店新增原圖：**docs/store/screenshots/content-r10/tickets-doorway-1290x2796.png** 與 **tickets-doorway-2064x2752.png**。以對應 CSS 視口與 DPR 直接擷取；既有商店截圖保留。

每組無頭瀏覽器完成即關閉；5286、5113 預覽依序使用，收尾均已關閉。before-after.json 與 docs/evidence/content-r10/ 保留前後對照；source-manifest.json 綁定本輪程式、版本、測試與美術 hash。只做本機繁中 commit，不合併或切換 main。

speak-human-tw mode 2 事後摘要：①「路口停看聽」→「路口停看等」，課名對應現有操作；②固定「踏板」→「按住起步／踩住中／請放開／已放開」，同步當下狀態；③「停、看左、看右，等朋友過完」→ 指明尚未看的方向，讓孩子知道下一步；④關門後「上車中」→「門關好了」，配合已完成的動作。⑤「先看左／右 9 站」→「先看左／右 9 次」，不把逐人觀察次數說成車站數。新等待牌及月台編號保持短句與圖示，沿用本機語音。

Apple 4.3 風險：**中**，為本機內容判斷。三課的平衡操作、路口禮讓與形色配對有各自因果；共用選課／三站／結算框架仍存在。沒有 Apple 審查結論或新的 Muse 分數。

BLOCKED：實體 iPhone／iPad、原生語音與真觸控測試需相應裝置；真人親子試玩需家長與兒童；乾淨機況效能需獨占硬體；Muse ≥8 需審查員重看 15 張精選。沒有推送、部署、商店操作、對外發訊息或透過其他服務派工。現有未追蹤審查檔保留，沒有修改或提交。
