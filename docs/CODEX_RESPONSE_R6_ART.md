# R6 美術第三輪交付：島嶼交通學院

10/16 工作單，10/17 收尾。版本 **2.10.0／原生來源 build 6**，只在 **r1-fun-polish** 本機工作。基線 `9f6463e`。美術、接線與下列本機證據已執行；**獨立 8 分與真人盲測尚未驗證**，不以自審或程式測試冒充。

## 最大三項改變

1. 首頁、汽車選單與飛機選單接回同一套海岸繪本。汽車四種 3/4 剪影各有五色，選車、選色與主圖即時對應；補綠旗阿路，移除第二層品牌列。飛機用風景、機種、活動大圖卡，七種原有活動完整保留；更多玩法在同一區切換，不另增畫面。實際駕駛／飛行 HUD 也改白底藍框。
2. 數學課固定乘客身份，往返換車不再重排朋友。700ms 動作配兩張不同肢體姿勢，上車可見從月台進車，分車可見從車門走過右側通道再入後車；650ms 脫鉤後退與留站牌保留。不是完整骨架或多方向步行循環。
3. 結算真正全屏，移除作答流程列，改大標、列車駛出、阿路雙姿勢揮旗與星星彩帶；加法／減法左右兩枚獎章。Web、iOS／Android 本機圖示來源統一黃帽綠旗石虎與台灣路線。

## 唯一五項驗收，逐項附原尺寸證據

以下對應 `art/ART_RESCORE2_MUSE.md` 第 4 節，沒有拿其他新系統充數。圖像理解為執行者自審；需要真人的部分另列 BLOCKED。

| 最新複審要求 | 狀態與驗收結果 | 改後原尺寸截圖／讀回 |
|---|---|---|
| 1 補玩法圖、砍重複圖 | VERIFIED：六張推薦組為首頁、駕駛中、飛行中、裝滿、分車、慶祝。汽車有即時道路／車輛、方向與踏板、前方金星；飛機有即時飛機、尋寶圈與星星。遮字後仍有操作與目標圖形。 | [汽車1290×2796](store/screenshots/art-r6/iphone-store-02-car-driving.png)、[飛機1290×2796](store/screenshots/art-r6/iphone-store-03-flight-playing.png)、[汽車2064×2752](store/screenshots/art-r6/ipad-store-02-car-driving.png)、[飛機2064×2752](store/screenshots/art-r6/ipad-store-03-flight-playing.png) |
| 2 統一車輛插畫 | VERIFIED：首頁三工具同 3/4 視角、墨藍輪廓與左上光；選跑車就是低車頂雙門車。四車×五色20種真實UI選取全驗；64px 雙底縮圖可自審分辨車種。 | [首頁390×844](art/evidence/r6/phone-01-home.png)、[選車390×844](art/evidence/r6/phone-car-menu.png)、[64px原生縮圖](art/thumbnail-64-r6.png)、[20組選色讀回](art/visual-r6.json) |
| 3 數學把移動畫出來 | VERIFIED：六位既有全身朋友各兩步態，700ms 上車／沿通道換車；同一人移去再移回身份不變。車窗、門、車頂帶、連結器、後車退開掛牌與各站不同台詞均保留。 | [上車途中390×844](art/evidence/r6/phone-boarding-mid.png)、[沿通道途中390×844](art/evidence/r6/phone-split-mid.png)、[裝滿390×844](art/evidence/r6/phone-04-load.png)、[分車390×844](art/evidence/r6/phone-05-split.png)、[留站390×844](art/evidence/r6/phone-subtract.png) |
| 4 獨立慶祝結算 | VERIFIED：與作答頁並排可見全屏、無三站流程、大教練與彩帶、列車離站、左右獎章兩種算法。列車補間3秒，其餘旗幟／彩帶1.5～1.8秒，可立即離開；減少動態關閉演出。 | [慶祝1290×2796](store/screenshots/art-r6/iphone-store-06-celebration.png)、[慶祝2064×2752](store/screenshots/art-r6/ipad-store-06-celebration.png)、[與作答並排](art/compare/R6-before-after.jpg) |
| 5 鎖商標、統一導覽 | EXECUTED：綠旗阿路、同套交通導覽與「回學院」；汽車補教練；飛機標題實色底襯、下拉退出幼兒介面。原生現用圖示來源亦同步。**BLOCKED：沒有三位陌生受試者，不能聲稱3秒辨識驗收通過。** | [汽車390×844](art/evidence/r6/phone-car-menu.png)、[飛機390×844](art/evidence/r6/phone-flight-menu.png)、[64px圖示](art/thumbnail-64-r6.png)、[原生圖示來源讀回](../resources/branding/native-icons-r6-report.json) |

整張實作與真人缺口另見 [acceptance-r6.json](art/acceptance-r6.json)。沒有取得新的 Meta Muse 分數，仍不能宣稱已達8分。

## 新素材、後製與包體

**9 次實際生成／編修，39 個 Web runtime 素材檔，另13個原生圖示尺寸匯出。** 實際工具 **`image_gen.imagegen`**；工具未揭露模型 slug，manifest 如實記 `null`，沒有以規劃檔的模型名稱冒充。

| 類別 | 新檔數／用途 |
|---|---|
| 海岸背景、風景圖卡 | 6個WebP；學院／飛機舞台與場地選擇。汽車台北夜駕、飛機都會日景各自對應。 |
| 四車各五色 | 20個RGBA PNG；汽車選項與選車主圖。 |
| 汽車／火車／飛機 | 3個RGBA PNG；首頁、導覽與慶祝。 |
| 阿路降旗／舉旗 | 2個RGBA PNG；同一衣帽與臉部身份，手臂及旗幟姿勢不同。 |
| 票框、三枚獎章、彩帶 | 5個RGBA PNG；慶祝、活動圖示與兩算法獎章。 |
| Logo、Web圖示 | 3檔；Logo與同一App圖示192／512。 |

[PROMPTS_R6.json](art/PROMPTS_R6.json) 保存逐次原提示與工具輸出路徑，同一風格前綴；[PROMPTS.json](art/PROMPTS.json) 接回索引。只用專案自己的阿路與本輪城市圖作參考。來源原畫、opaque master、原alpha mask保存在 `art/source/r6/`；[asset-manifest-r6.json](art/asset-manifest-r6.json) 含參考圖與輸出hash、尺寸、alpha、角色亮度／飽和雙閘。

後製限alpha清理、連通元件分離、裁切、LANCZOS縮圖、透明RGB清零及WebP q84。沒有方塊、純色或emoji充當新美術。R5乘客12張姿勢、藍橘車廂與站牌是沿用，不重算新素材。

新圖片 **4,265,513 bytes，約4.07 MiB**。受管public檔差約4.07 MiB；既有忽略的原始碼封存檔不計入本輪增加，沒有刪除。13個現用原生圖示匯出共約2.80 MiB，比舊尺寸檔增加約0.88 MiB；本機native Web資源包約49.22 MiB，**不是IPA／APK壓縮包大小**。新原畫與截圖不進native資源包。精確值與hash在 [release-proof-r6.json](art/release-proof-r6.json)。

[CREDITS.md](../CREDITS.md) 已新增來源與權利註記；舊模型、字型、音樂、Apache-2.0／CC BY 4.0與NOTICE均保留。原生圖示13檔與另外73個原生資源保存證據在native-icons-r6-report；只改本機來源catalog，沒有簽署或上傳。

## 前後對照與商店圖

- [ART_REVIEW_R6.md](art/ART_REVIEW_R6.md)：施工前無頭實載，納入三份Muse歷史／最新意見，延續R4／R5方向。
- `art/compare/r6-before/`、`r6-after/`：四種尺寸、22組同場景同尺寸實際對照；[pairs-r6.json](art/compare/pairs-r6.json) 含hash。
- 另3組完整數學階段使用R5原始2.9.0歷史截圖，明確標示歷史來源，沒有冒充本次新拍的改前圖。
- [R6-before-after.jpg](art/compare/R6-before-after.jpg) 是閱讀用縮覽；原圖沒有加字、合成或塗改UI。
- `store/screenshots/art-r6/` 每裝置推薦6張，共12張，尺寸1290×2796／2064×2752；[SELECTED.json](store/screenshots/art-r6/SELECTED.json) 定義順序、尺寸與hash。數學算剩下保留為額外測試證據，不連排四張數學充數。

推薦商店圖全部為**未合成的無頭Chromium Web實載**，經真實UI操作與經過時間取得，沒有改完成旗標或存檔值；不是iOS／iPadOS原生實機證據。其他既有回歸測試含明載的加速物理模擬，不將其截圖冒充實機或正常遊玩時長。

## 測試與品質讀回

| 檢查 | 狀態／證據 |
|---|---|
| npm test | VERIFIED：162／162，既有tests未改；`art/unit-test-r6.txt` |
| npm run build | VERIFIED：8個既有車模表面檢查、Vite、163個precache檔；`art/build-r6.txt` |
| npm run test:merge，5286 | VERIFIED：11尺寸、132檢查、25圖，數學→火車→汽車→飛機→持久學生證；0執行錯誤／外部請求；`art/merge-test-r6.txt` |
| mobile／reachability | VERIFIED：100情境、638控制檢查；3視口×7情境主要控制可達，0執行錯誤／外部請求；`art/mobile-test-r6.txt`、`reachability-test-r6.txt` |
| 本輪美術實載 | VERIFIED：12尺寸＋減少動態、125檢查、122圖；包含四車五色、乘客0上車的700ms採樣、乘客4通道四路點與來回身份、全屏慶祝、更多玩法收合／展開；`art/visual-r6.json` |
| 手機鍵盤說明 | VERIFIED：3種手機尺寸，實際解家長閘、開設定後確認鍵盤說明不可見；`art/keyboard-r6.json` |
| npm run test:store，5113 | VERIFIED：12尺寸、101檢查、26圖，含真實UI流程、離線快取、家長閘與保存／恢復；0執行錯誤／外部請求。`art/store-test-r6.txt`、`art/store-evidence-r6/review-path.json` |
| 本機native資源包 | VERIFIED：158檔、28個設定／打包檢查；原生截圖政策Python6／6。非簽署安裝包；`art/native-build-r6.txt`、`native-verify-r6.txt`、`native-policy-test-r6.txt` |
| 資產與對照 | VERIFIED：39新runtime檔、13原生圖示、25組對照（22當次＋3歷史）、12指定尺寸商店圖，來源／輸出hash均讀回；`art/release-proof-r6.json` |
| 對比與來源 | VERIFIED：白底正文11.49:1、橘鈕5.04:1；原橘鈕文字色實算僅3.82:1，本輪已修正。版本同步、0新依賴／SDK、指定秘密格式0命中；`art/contrast-r6.json`、`source-audit-r6.json` |
| p95三跑 | EXECUTED：12組（三視口×四模式）三跑中位16.7～16.8ms，參考值均≤18ms；Intel ANGLE、60Hz無頭rAF，每跑約2秒；`art/performance-r6.json`、`frame-times-r6.txt` |

控制測試因下拉／頁碼改圖卡而更新選擇器，保留全部七種原活動，並檢查更多／回復兩個狀態；尺寸、七個命中點與溢位斷言內容逐字未改，證據在source-audit。沒有刪除測試或降低斷言來通過。

效能是**並發載量測，僅供參考**，不是CPU／GPU frame time或原生出貨閘。量測後只修文字對比與手機設定中的鍵盤段落顯示，沒有改動物理、frame loop或版面尺寸。閒置機況與原生實機效能仍BLOCKED。

繁中文案依mode 2直接套用：回大廳→回學院（統一目的地）；每張小臉是一位乘客→一起請朋友上車，再分成兩車（符合全身人物與動作）；家長設定與儀表說明→家長設定（縮短入口）；更多飛行練習→更多玩法／尋寶・郵差（明示同區切換）。數字與教學判定未改。

## Apple 4.3與未完成

**風險：中。** 黃帽綠旗石虎、台灣路線、可操作交通與拆合教學，已比原深色通用儀表更能形成獨立識別；但這是執行線的美術／產品推論，不能代表Apple接受，也不能單靠美術排除同帳號產品相似風險。既有3D模型與近景風格保留，本輪未假稱全3D重製。

**BLOCKED／未完成：** 第5項三位陌生人64px／3秒盲測、新獨立8分重評、親子理解測試、原生裝置／WebKit、閒置效能與新簽署包。兩姿勢不是完整多方向骨架／三視圖。家長完整說明保留原有可捲動方式；原有音樂權利與提交關係缺件仍由負責人補證。

全程本機無頭工作；沒有push、部署、操作商店、外部派工、對外傳訊、讀取全機secrets或新增第三方SDK／外連。兩份原未追蹤Muse複審維持原檔、不納入本次commit。只在指定分支建立本機commit。
