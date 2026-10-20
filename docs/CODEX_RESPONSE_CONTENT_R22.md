# 島嶼交通學院：新內容第22輪

VERIFIED：實作、清理後全套回歸與原圖核對完成；實體裝置、真人驗收與獨立評分另列BLOCKED。工單日期2026-10-18，執行2026-10-20；只在 `r1-fun-polish`，基準 `22b0ecaae4d4f88e125b22bc2baa48562f57ad9c`，版本 **2.34.0／來源build30**。

共同入口：**首頁「海岸實作課」→課程車票→「一起出發」**。

| 課程 | 做了什麼、怎麼玩 |
|---|---|
| 把蛋糕平穩送到 | 主畫面與特寫共用傾斜角度，蛋糕、草莓、小旗一起回正，陰影隨姿態改變。放開行車鍵後，按住向中央扶正；放開／扶錯只停住，不扣分。各站補站號與地名，轉錯提示只講轉彎，休息灣停穩後再起步。 |
| 路口停看等 | 四個動作固定為停下、看左邊、看右邊、出發；左右完成狀態另列。第三站需要再看左側時取消左側舊勾，出現靠近路口的車況。人物踏上對岸就加一次人數，人物勾、計數與到岸提示同步；仍可看左右，未清空不能直接出發。 |
| 形狀車票，找對月台 | 站名改海風／榕樹／燈塔站，車票仍需看顏色與形狀。人物只標名字，第二、三站隊形不同。車門對齊所選月台牌；陪同時只留已入座X/3主進度，正在上車標在人物旁。踏階加寬與接觸影、引導線，先收階才能關門，再出發。 |

## Muse唯一五項驗收

以下手機圖皆位於 `docs/content/r22/`，為390×844無頭瀏覽器原尺寸。`acceptance.json` 記錄實際狀態，`browser.json` 記錄公開UI操作、截圖尺寸與SHA。

| 要求 | 原尺寸截圖與結果 |
|---|---|
| ①主畫面蛋糕同步傾斜與回正 | `phone-cake-stage-2-centre-62.png` → `phone-cake-stage-2-centre-80.png` → `phone-cake-stage-2-centre-100.png`。同站同距離，主場景與特寫姿態同步改變；100%實際傾斜為0。精選02～04。 |
| ②統一已看／未看語言 | `phone-crossing-stage-2-right-first.png`／`phone-crossing-stage-3-recheck.png`。依工單較明確要求，按鈕永遠只寫動作，勾與未確認狀態另外顯示；需再看左邊時，左側沒有完成勾。精選06～07。 |
| ③腳到對岸才計數 | 三站每人都有 `phone-crossing-stage-<1至3>-<1至3>-start.png`／`middle.png`／`pavement.png` 三格，共27張。斑馬線中不增加，腳到對岸的同一格增加一次並在原人物旁出勾。精選08～10為第三站3號奶奶1/3→1/3→2/3，提示同步「奶奶到對岸了」。到岸後走向空位不再重複加人數。 |
| ④車票單一主進度 | `phone-tickets-stage-2-boarding-1.png`／`boarding-2.png`、`phone-tickets-stage-3-boarding-2.png`。上方只有「已入座X/3人」，誰正上車直接標在人物旁；其餘同伴仍在月台。精選11～13。 |
| ⑤踏階伸出／收回清楚 | `phone-tickets-stage-3-step-out.png`／`phone-tickets-stage-3-step-in.png`。同站同門，伸出階面寬約107.4px、高54px；收回後階面、引導線與標籤一起消失，才出現關門。精選14～15。真人盲看未代驗。 |

## GPT／Claude回歸與未見證據補件

- 按鈕動作／狀態矛盾、到岸計數延後已按上述②③修正；第二站右先看、第三站回看保持不同判斷。
- 人物姓名移除數字；第2站1號月台、第3站2號月台實際門中心與牌中心誤差均小於1px，三站量測見 `acceptance.json`。原圖為各站 `phone-tickets-stage-<站次>-step-out.png`，並非只對齊上方文字。
- 車票各站 `phone-tickets-stage-<站次>-decision.png` 的站名只有地名，不寫答案；候車者改成不同隊形，配對後收起另外兩牌。
- 蛋糕各站都有站號；`phone-cake-stage-2-wrong.png` 只提示「這裡是左彎喔，再選一次」。`phone-cake-stage-3-bay.png` 寫「休息好了，可以出發了」，`phone-cake-stage-3-restart.png` 為實際起步，精選05；右上改「暫停」，避免與休息區撞字。
- 放開／錯扶：公開UI驗證傾斜及路程不變，`phone-cake-wrong-recovery.png` 補錯扶畫面；可再扶回中央的三格見精選02～04。
- 路口未清空出發：各站 `phone-crossing-stage-<站次>-wrong-depart.png` 補原因提示；其後完整觀察、三人到岸與出發，`ready-depart.png`／`departing-1.png`～`departing-3.png`。沒有錯選淘汰。
- 車票各站 `wrong.png`→`boarding-1.png`／`boarding-2.png`→`paused.png` 補重選及按住／放開狀態；測試確認放開後boardTime不變，接續按住可完成。`step-in.png`→`closed.png`→`departing-1.png`～`departing-3.png` 補關門與出發。三課都有 `phone-<課程>-complete.png`／`saved.png` 證明結算與重載。
- `before-<課程>.png`／`after-<課程>.png` 為基準Git原圖與本輪對照，未拼貼或假稱同步像素比較。聲音無法用截圖證明；沿用本機語音短句，不宣稱已驗證原生車聲方位或裝置發音。

精選固定 **15張、每課5張** 在 `docs/content/r22/review-set/`。15張都是遊玩中畫面；蛋糕三格、奶奶三格、陪乘兩格及踏階兩格呈現動態過程。尺寸、來源與逐檔SHA見 `review-set-manifest.json`。其餘補件在本輪完整證據，未冒稱已放入15張精選或審查員已看過。

新增商店截圖：`docs/store/screenshots/content-r22/tickets-escort-1290x2796.png`、`tickets-escort-2064x2752.png`，使用實際DPR擷取正在陪乘上車的遊戲。既有商店截圖全部保留。

## 測試與交付證據

VERIFIED：267項單元、build、R22共62項公開UI／裝置／斷網檢查、4項負向、整合132項、商店101項全部通過；290張原尺寸情境證據與15張精選逐檔核對。結果見 `release-proof.json`。既有42份測試檔與基準Git blob完全一致，未刪改或放寬斷言；秘密掃描0命中。歷史各輪情境腳本及所需舊證據保留，當前規格由R22情境實跑驗證。

命令：`npm test`、`npm run build`、`npm run test:merge`（5286）、`npm run test:store`（5113）。`scripts/final-content-r22-validation.mjs` 依序啟停preview，全程單一伺服器／單一無頭瀏覽器，完成即關。另含R22全流程、offline、layout、store、negative與performance情境；重跑入口 `npm run test:content:r22`。Playwright沿用本機已安裝模組：`C:\Users\digimkt\AppData\Local\npm-cache\_npx\e41f203b7505f1fb\node_modules\playwright\index.mjs`。工單給定的另一repo路徑未安裝模組，沒有修改該repo或安裝新依賴。

效能採既有D3D11無頭參數，桌機／手機直橫×三課，每組三次2秒真實RAF，取p95中位。九組p95中位為16.7～16.8ms，均在18ms內，見 `performance.json`。並發載只供參考，通過結論限這組無頭渲染參數，不能代替乾淨機、其他渲染路徑或原生裝置。

新增美術 **0次生成／0張runtime圖**。本輪只修既有操作、視覺姿態與資訊；沿用受管蛋糕、人物、列車、背景與R21踏階，來源SHA和零生成紀錄在 `art-manifest.json`。未用方塊或emoji冒充角色場景，未聲稱新增骨架、3D物理或新影片。沒有新增SDK、外部連結、帳號、廣告、內購或線上功能。

清理已EXECUTED：刪除 **65檔／90,006,605 bytes（85.84 MiB）**，包含整套R21舊review-set與被取代的整合／商店演練副本。刪前核對絕對repo範圍、Git追蹤、未修改與SHA；清理後重跑指定測試。另保留 **5398檔**：5308檔為歷史驗證器依manifest讀取／雜湊的輸入、34檔為具名或模板腳本引用、56檔為生成來源與美術契約，`cleanup-result.json` 逐檔列原因及讀取來源。全部歷史Markdown、評審意見、現行商店截圖、既有未追蹤檔皆保留。

繁中文案mode 2直接套用，修改重點如下；保留課名與人物姓名。

| 原句 | 原因 | 改成什麼 |
|---|---|---|
| 方向相反，放開行車鍵再扶正 | 同句塞兩個動作 | 這裡是左／右彎喔，再選一次 |
| 休息好了，路口空了 | 休息灣畫面沒有路口 | 休息好了，可以出發了 |
| 左邊看過／右邊看過作按鈕 | 混用動作與狀態 | 看左邊／看右邊；狀態另外顯示 |
| 人物已到岸仍說正在過街 | 計數與畫面不一致 | 人名＋到對岸了，同步人數及勾 |
| 第3站・綠正方形車票 | 站名直接給答案 | 第3站・燈塔站 |
| 月台／上車中／已入座三組數字 | 主進度不明確 | 只留已入座X/3，人物旁標上車中 |

## 風險與缺件

Apple 4.3風險：**中（本專案自評）**。扶蛋糕、停看等與車票陪乘持續聚焦交通照顧，沒有另加通用任務／養成；三課仍共用外框及三站結構，不能以本輪修正保證通過審查。依2026-10-20讀取的[Apple官方4.3規範](https://developer.apple.com/app-store/review/guidelines/#spam)，多個相同App及缺少可辨差異的變體仍有風險；此為內容風險推論，並非Apple決定。

BLOCKED：實體iPhone／iPad觸控與原生語音需裝置；真人親子、踏階盲看與遮字辨認需參與者；乾淨機效能需獨占硬體；Muse≥8需獨立複評。本輪未重建原生簽章包，交付Web與原生來源版本。僅本機commit，未push、部署、操作商店、發訊息或透過外部服務派工。
