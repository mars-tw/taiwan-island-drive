# R7／美術第四輪交付：島嶼交通學院

2026-10-18，對應10/17第四輪工作單。版本 **2.11.0／原生來源build 7**，分支 **r1-fun-polish**，基線 `d29ab17`。本機施工與工程讀回 **VERIFIED**；獨立8分、兒童辨識盲測與原生實機仍未驗證。最新獨立評分仍是第三輪7.8，不替審查員加分。

## 最大三項改變

1. 實機車輛收斂到選課的藍黃繪本：藍色跑車做原模型圓角、加權法線、玩具材質與墨藍輪廓；飛機改黃機身、黃翼及墨藍機艙。清水斷崖式遠景、太平洋藍欄白柱進入實際3D畫面，直式鏡頭補完整車體視野。
2. 阿路接在真實車輛副駕世界座標，繫安全帶，跟車移動並受車體遮擋；依前方彎道與實際收星切直行、轉彎、舉星姿勢。飛行改耳機無線電頭像、逐顆目標台詞；當前金星側上方放大，後續縮小且無文字標籤。
3. 導覽固定前四格圖示與回學院位置，首頁、駕駛、飛行、數學與觀察課共用；駕駛改三組主操作、五格速度、小地圖實線與終點旗。結算列車完整入框，0.7秒後停止位移，教練、列車、兩獎章保持完整。

## 唯一五項驗收與原尺寸證據

清單只採 `art/ART_RESCORE3_MUSE.md` 第4節；R2未結案的車輛、乘客動作與導覽一併對照。下列圖片均為未合成的無頭Chromium實載，iPhone **1290×2796**、iPad **2064×2752**。可觀察結果由執行者自審與程式讀回驗證，人群理解不冒稱通過。

| 五項要求 | 狀態與結果 | 改後原尺寸截圖 |
|---|---|---|
| 1 實機車輛對齊選單 | **EXECUTED；工程VERIFIED。** 藍色低車頂跑車、黃高翼飛機、Toon材質及墨藍輪廓。既有跑車在Blender 5.2無頭重工四組車身，保留16格UV語意材質／輪階層；實載三角形數與新GLB吻合。四車五色20組選取仍通過。**兒童遮字同車辨識BLOCKED：未有受試者。** | iPhone：[首頁](store/screenshots/art-r7/iphone-store-01-home.png)／[實際駕駛](store/screenshots/art-r7/iphone-store-02-car-reward.png)／[實際飛行](store/screenshots/art-r7/iphone-store-03-flight-target.png)。iPad：[首頁](store/screenshots/art-r7/ipad-store-01-home.png)／[駕駛](store/screenshots/art-r7/ipad-store-02-car-reward.png)／[飛行](store/screenshots/art-r7/ipad-store-03-flight-target.png)。 |
| 2 教練參與玩法 | **VERIFIED：** 副駕是車輛子物件，實際碰星後舉星1.6秒，截圖取動作420ms；390寬投影約62px。飛行以耳機、星星與目前目標台詞指引。三視圖及動作設定先行，其他出場保留同衣帽／綠旗身份。 | [iPhone副駕收星](store/screenshots/art-r7/iphone-store-02-car-reward.png)、[iPad副駕收星](store/screenshots/art-r7/ipad-store-02-car-reward.png)、[iPhone無線電](store/screenshots/art-r7/iphone-store-03-flight-target.png)、[iPad無線電](store/screenshots/art-r7/ipad-store-03-flight-target.png)。 |
| 3 星星層級 | **VERIFIED：** 同時只有一顆當前金星，約44px星形／62px環；後續大幅縮小，全部星標籤不可見。信標位於實際目標側上方、面向鏡頭，不擋飛機與跑道中線；目標命中位置／半徑未改。縮圖自審可定位；**3秒人群辨識未驗。** | [iPhone當前星](store/screenshots/art-r7/iphone-store-03-flight-target.png)、[iPad當前星](store/screenshots/art-r7/ipad-store-03-flight-target.png)。 |
| 4 減法與地標化 | **VERIFIED：** 主操作為左右轉向、油門／煞車、自動油門三組。方向盤／視角移至既有暫停；速度五格、深藍S形路線、橘位置點與綠旗終點。崖壁、太平洋與護欄直接在遊戲中可見，未只寫地名。12尺寸靜止／行駛投影邊界通過。 | [iPhone海岸駕駛](store/screenshots/art-r7/iphone-store-02-car-driving.png)、[iPad海岸駕駛](store/screenshots/art-r7/ipad-store-02-car-driving.png)。推薦圖中的[收星瞬間](store/screenshots/art-r7/iphone-store-02-car-reward.png)也保留完整操作、地圖與地景。 |
| 5 固定導覽＋完整結算 | **VERIFIED：** 前四格回學院／汽車／火車／飛機位置一致；數學保留第五格暫停。首頁、數學、觀察課座標逐格相同；六圖快切可見同位置返回。慶祝採完整入框構圖，3.6秒後車頭仍全在畫面，教練右側揮旗、兩算法獎章獨立。 | [iPhone完整結算](store/screenshots/art-r7/iphone-store-06-celebration-settled.png)、[iPad完整結算](store/screenshots/art-r7/ipad-store-06-celebration-settled.png)；[六畫面前後縮覽](art/compare/R7-before-after.jpg)。 |

R2的「做了但截圖看不到」另以[上車中](art/evidence/r7/phone-boarding-mid.png)、[iPhone分車中](store/screenshots/art-r7/iphone-store-05-split-action.png)、[iPad分車中](store/screenshots/art-r7/ipad-store-05-split-action.png)收證：全身乘客700ms沿通道移動、身份來回保留；本輪保留既有兩步態，未改教學判定。

## 素材、來源與包體

**6次實際圖片生成，14個Web格式素材檔（13個接線、1個彎路牌備選），另13個原生圖示尺寸匯出；1個既有跑車重工。**

圖片工具實際為 **`image_gen.imagegen`**，未揭露模型slug，紀錄為 `null` 並註明，沒有假填模型版本。清單包括海岸背景、三個副駕姿勢、無線電、面板、星章、轉彎牌、兩交通工具背面圖、終點旗、Logo、App圖示192／512。共同前綴、參考圖與工具原路徑在 [PROMPTS_R7.json](art/PROMPTS_R7.json)；[PROMPTS.json](art/PROMPTS.json)保留各輪索引。

跑車工具是 **Blender 5.2.0 LTS CLI／`--background`**，以既有Blender模型做0.085m、3段圓角及加權法線，沒有另造模型底。MCP查詢曾回報未連線，本輪3D改動由本機無頭CLI實際執行，不能冒稱MCP改模。原GLB、新`.blend`、來源／輸出hash保存在 `art/source/r7/`，讀回見 [coupe-rounding-r7.json](art/coupe-rounding-r7.json)。新跑車26,687三角形，原有車模表面守門全綠。

角色設定：[三視圖](art/character-sheets/alu-turnaround-r7.png)、[身份與演出契約](art/character-sheets/ALU_R7.md)、[64px雙底縮圖](art/thumbnail-64-r7.png)。四張新教練圖亮度／飽和雙閘均通過。原畫、opaque master、alpha mask、裁切／縮圖、透明RGB清零、WebP q83與hash均在 [asset-manifest-r7.json](art/asset-manifest-r7.json)。僅做可重現後製，沒有手畫方塊充當美術。

新圖片 **2,480,864 bytes**；跑車淨增 **112,356 bytes**；合計靜態圖像／模型約 **2.47MiB**。13個原生圖示來源比舊檔淨增 **211,502 bytes（約0.20MiB）**。原畫、`.blend`與截圖留在docs，未當作遊戲素材打包。這是來源檔差額，**未量測新的IPA／APK壓縮包**。精確讀回見 [release-proof-r7.json](art/release-proof-r7.json)。

[CREDITS.md](../CREDITS.md)保留全部舊授權並新增本輪來源。原生圖示來源尺寸／RGB／RGBA與73個其他資源未變的讀回見 [native-icons-r7-report.json](../resources/branding/native-icons-r7-report.json)。沒有新增依賴、第三方SDK或外部連結到遊戲流程。

## 前後對照與商店順序

- `art/compare/r7-before/`、`r7-after/`：六主畫面×三尺寸，共18組原尺寸對照；[pairs-r7.json](art/compare/pairs-r7.json)含hash。改前為施工前既有預覽，當時原始碼2.10.0／d29ab17；舊編譯包戳未另記錄，不假稱其完整測試全綠。
- 商店推薦每裝置六張：首頁、駕駛收星、飛行找星、裝滿、分車途中、完整結算。[SELECTED.json](store/screenshots/art-r7/SELECTED.json)逐檔記尺寸、順序與hash；共12張。其餘圖是輔助驗證，不混入推薦順序。
- 原圖沒有加字合成、塗改UI或改完成旗標。推薦圖皆真實UI與正常經過時間；這是Web實載，**不是原生iOS／iPadOS實機截圖**。

## 測試與驗證

| 項目 | 結果／證據 |
|---|---|
| npm test | **VERIFIED：162／162**；[unit-test-r7.txt](art/unit-test-r7.txt)。既有tests未改。 |
| npm run build | **VERIFIED：** 8模型表面守門、Vite與177個本機precache檔；[build-r7.txt](art/build-r7.txt)、[vehicle-test-r7.txt](art/vehicle-test-r7.txt)。 |
| npm run test:merge，5286 | **VERIFIED：132項、25圖、11尺寸**，數學→火車→汽車→飛機→學生證恢復；0錯誤／外部請求。[merge-test-r7.txt](art/merge-test-r7.txt)、[merge-path.json](art/merge-evidence-r7/merge-path.json)。交通行程採原物理加速tick測試，不冒充正常遊玩時長。 |
| npm run test:store，5113 | **VERIFIED：101項、26圖、12尺寸**；真實操作、離線快取、家長閘、保存恢復、儲存失敗提示，0錯誤／外部請求。[store-test-r7.txt](art/store-test-r7.txt)、[review-path.json](art/store-evidence-r7/review-path.json)。 |
| 美術／RWD | **VERIFIED：125項、122圖、12尺寸**，含20組車色、700ms乘客、減少動態；[visual-r7.json](art/visual-r7.json)。最後僅調整汽車鏡頭，另以[12尺寸投影檢查](art/car-framing-r7.json)驗證靜止與行駛完整入框，並更新對應原圖hash。 |
| 控制與手機說明 | **VERIFIED：100情境／638控制、3視口主要控制可達、3手機設定無鍵盤說明**；[mobile-test-r7.txt](art/mobile-test-r7.txt)、[reachability-test-r7.txt](art/reachability-test-r7.txt)、[keyboard-r7.json](art/keyboard-r7.json)。控制DOM凍結後只改模型／相機，最終整合、商店與投影檢查另行補驗。 |
| 本輪專項驗收腳本 | **VERIFIED：** 三尺寸導覽座標、自然碰星後角色演出、實際載入新模型三角形數、星層級、停止後完整列車；[acceptance-r7.json](art/acceptance-r7.json)。它是程式驗證，非獨立模型評分。 |
| 原生來源政策 | **VERIFIED：6／6**；[native-policy-test-r7.txt](art/native-policy-test-r7.txt)。原生來源版本／圖示已同步，未建簽署包或跑裝置。 |
| p95 | **EXECUTED：三跑中位16.7～16.8ms**；最後跑車模型與鏡頭完成後重測三視口，其他模式保留本輪既有樣本。[performance-r7.json](art/performance-r7.json)。Intel ANGLE、60Hz無頭rAF、每跑2秒，並發載僅供參考，不代表閒置機況／原生出貨效能。 |
| 來源與秘密掃描 | 讀回見[source-audit-r7.json](art/source-audit-r7.json)：指定分支、版本同步、0新SDK、既有tests無變動、來源／當次Web編譯包秘密格式零命中。 |

測試腳本的既有改動僅提供報告輸出目錄變數，避免覆寫歷史證據；沒有刪除測試或放寬尺寸、命中、溢位、保存與離線斷言。

繁中文案依mode 2直接套用：

| 原句／呈現 | 原因 | 改後 |
|---|---|---|
| 觀察課「回大廳」 | 同一返回目的地需固定 | 共用「回學院」圖示列。 |
| 「中間閃電鍵加速」 | 主操作已減法，說明須符合現況 | 說明左右轉向、油門／煞車、自動油門；方向盤與視角在暫停。 |
| 「沿著海岸找星星」固定貼紙 | 角色需要當下目的 | 直行牌／彎路牌／舉星，依真實路線及收星事件切換。 |
| 星星1／2／3重疊標籤 | 遮擋視野與目前目標 | 空中不放標籤；無線電逐顆提示，當前金星放大。 |
| 三位時速 | 幼兒不需成人儀表 | 「慢慢開」與五格速度。 |

## Apple 4.3與未完成

**風險：中。** 黃帽綠旗阿路、台灣海岸、藍黃交通工具、交通票框與列車拆合教學已形成更一致的產品識別。這是本輪視覺判斷，不能代表Apple接受。

**BLOCKED／未驗證：** 新的獨立8分複評、3位未玩過者／兒童同車辨識與3秒目標盲測、親子理解、原生裝置／WebKit、閒置機況與原生p95、簽署IPA／APK。既有音樂權利與提交關係缺件本輪未補證。3D與2D仍是兩種媒材，是否已足以讓兒童判為同一車，留待盲測。

全部本機、背景／無頭執行。只在指定repo／分支工作，沒有push、部署、操作商店、向他人傳訊或透過其他對話派工；三份原未追蹤Muse檔保留原狀。預覽服務與瀏覽器已關閉；本機commit由最後訊息回報。
