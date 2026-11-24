# 島嶼交通學院英文用語表（R50 起，全站共用）

這份是英文版的固定用字。L2（數學遊戲室、火車謎題）、L3（三種駕駛課與場景）翻譯時照這份寫，不要各自想新說法。
讀者是 3～8 歲的孩子：句子短、用日常單字，一句只講一件事。給家長看的說明（家長設定、家長確認）可以稍長，但仍用簡單英文。

## 一、固定標籤（字典必須一字不差）

下表左欄如果出現在任何英文字典（`src/shared/i18n/en-*.js`）的 key，右欄就是它唯一的英文；守門測試 `tests/shared/i18n-r50.test.js` 會逐條比對，大小寫也算。

<!-- glossary:labels:start -->
| 中文 | English | 說明 |
| --- | --- | --- |
| 島嶼交通學院 | Island Transport Academy | 遊戲名稱 |
| 交通學院 | Transport Academy | 簡稱；句中可說 the Academy |
| 回學院 | Home | 導覽列第一顆 |
| 回到交通學院 | Back to the Academy | 導覽列第一顆的語音標籤 |
| 汽車 | Car | 導覽列、護照分頁 |
| 火車 | Train | 導覽列、護照分頁 |
| 飛機 | Plane | 導覽列、護照分頁 |
| 開汽車 | Drive a Car | 首頁卡片 |
| 開火車 | Drive a Train | 首頁卡片 |
| 開飛機 | Fly a Plane | 首頁卡片 |
| 學生證 | Student Card | |
| 我的學院學生證 | My Academy Student Card | |
| 我的星星護照 | My Star Passport | |
| 阿路教練 | Coach Alu | 石虎教練，名字固定 Alu |
| 數學遊戲室 | Math Playroom | |
| 列車數學課 | Train Math | |
| 海岸實作課 | Coast Practice | |
| 家長設定 | Parent Settings | |
| 家長確認 | Parent Check | 家長驗證視窗 |
| 幼兒模式 | Little Kid Mode | |
| 安全觀察章 | Safety stamp | |
| 數學調度章 | Train Math stamp | |
| 山海同行章 | Hill & Sea stamp | |
| 暫停 | Pause | |
| 再練一次 | Try again | |
| 休息一下 | Take a break | |
| 下一站 | Next stop | |
| 公路 | Road | |
| 月台 | Platform | |
| 跑道 | Runway | |
| 等一等 | Wait | |
| 開門接客 | Open doors | 按鈕 |
| 關好車門 | Close doors | 按鈕 |
| 取消 | Cancel | |
| 關閉 | Close | |
<!-- glossary:labels:end -->

## 二、常用詞（句中用法，照這個方向寫）

| 中文 | English | 說明 |
| --- | --- | --- |
| 汽車課／火車課／飛機課 | Car Class / Train Class / Plane Class | 三種駕駛課的總稱 |
| 課、一課 | lesson | 「第一課」= Lesson 1 |
| 章（主線章節） | chapter | 「第 2 章」= Chapter 2 |
| 關 | level | 「第 3 關」= Level 3；「12 關」= 12 levels |
| 站（安全課、火車課的一站） | stop | 「第 2 站／共 3 站」= Stop 2 of 3 |
| 章（集章、蓋章） | stamp | 集章 = stamps；集章冊 = stamp book；蓋好一個章 = You got a stamp! |
| 星星 | star / stars | 單複數要分：1 star、2 stars（用字典的 `{ one, other }`） |
| 評等星 | stars | 「36 顆評等星」= 36 stars |
| 調度 | train job | 列車數學的派車任務 |
| 調度單 | job card | |
| 山海同行（主線） | Hill & Sea Trip | 主線任務；「山海任務」= Hill & Sea Mission |
| 山海教室 | Hill & Sea School | |
| 乘客、朋友（上車的人） | friends | 全站統一說 friends |
| 車廂 | train car | 不要只寫 car，免得和汽車混淆 |
| 需要家長確認（句子） | A grown-up needs to approve … | 家長確認視窗的原因句一律用 approve |
| 家長（對孩子說） | grown-up | 「請家長幫忙」= Ask a grown-up |
| 家長（設定、條款） | parent | Parent Settings、parent area |
| 小小列車長 | Taiwan Train Math | 舊遊戲的官方英文名（見 `public/licenses/taiwan-train-math/NOTICE.txt`） |
| 煞車 | brake | 「按住煞車」= Hold the brake |
| 號誌、紅綠燈 | light / signal | 對孩子說 light；火車號誌可說 signal |
| 出發 | go | 「確認出發」= Check and go |
| 繼續 | continue / keep going | 按鈕用 Continue；鼓勵句用 Keep going |
| 這台裝置 | this device | 存檔說明 |

## 三、地名與站名

- **真實地名、車站**：用台灣官方英文拼法（交通部觀光署、台鐵站名），不翻意思。
  台灣 Taiwan、台北 Taipei、高雄 Kaohsiung、花蓮 Hualien、台東 Taitung、宜蘭 Yilan、阿里山 Alishan、太魯閣 Taroko、
  汐止 Xizhi、奮起湖 Fenqihu、大慶 Daqing、花東海岸 Hualien–Taitung Coast。車站寫成「Xizhi Station」。
- **遊戲自創的站名**：翻意思，讓孩子聽得懂。已定：海風站 Sea Breeze Station（句中可簡稱 Sea Breeze）、轉運站 Transfer Station。
  其他照同一個方式：花園站 Garden Station、榕樹站 Banyan Station、森林站 Forest Station、鐘樓站 Clock Tower Station、燈塔小站 Lighthouse Stop。
- 新增地名時，把它補進本表，再寫進自己那條線的字典。

## 四、寫法小規則

- 按鈕：動詞開頭、2～3 個字，第一個字大寫（Start this stop、Try again）。
- 句子：句首大寫、句尾有標點；一句不超過約 12 個英文字。
- 數字直接放：Stop 2 of 3、0/4 chapters。斜線用半形 `/`。
- 全形標點（，。！：；「」）在英文裡都改半形，引號用 "Wait"。
- 中文原句裡的 ` · ` 分隔號英文照用 ` · `。
