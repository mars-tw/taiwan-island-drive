# 島嶼交通學院：新內容第28輪

VERIFIED：本機內容修正、指定回歸與證據核對完成。2026-10-21，分支 `r1-fun-polish`，基準 `906fd101`，版本 **2.40.0／來源build36**。未取得Muse複評，不宣稱已達8分。

三課共用入口：首頁「海岸實作課」→課程車票→三張選站卡→「一起出發」。完成全課需要實際完成三站；直接選第三站不會取得全課完成。

| 課程 | 本輪操作與回饋 |
|---|---|
| 把蛋糕平穩送到 | 踏板、轉向、煞車與左右扶正六鍵固定保留，可多指同時減速與扶正。實際車速先變，延遲受力再使蛋糕傾斜；高速彎道只扶的修正力為8，減速同扶為22。盤底固定車頂支點，最大28度、沒有盤面橫滑與穿車參考線。進灣、停進格、100%坐穩、再離灣都有實際狀態。 |
| 路口停看等 | 停穩後看左右，側向取景呈現同一道路的來車與朋友；看向來車來源才記確認。未知側不提前打勾，三站全程保留站名與左右進度。等來車離場、三位朋友都到岸後才可出發。右轉線與人物、名牌至少16px，圖層在人物後方。 |
| 形狀車票，找對月台 | 比對形狀與顏色、停穩開門、點朋友、按住陪同。門檻前需放開觀察，再按住走進走道入座；月台、跨門檻與走道速度不同。進度圓環與百分比同源，放開顯示「已停住」。停靠編號和票面保留，真正坐下才加人數。人物圖高度≤列車60%，點擊框仍≥60px。 |

## Muse唯一五項：逐項驗收

以下檔名均位於 `docs/content/r28/`，手機直式原尺寸 **390×844**。完整逐張狀態、亮鍵實際背景色、文字裁切、控制幾何與SHA在 `browser-all.json`；沒有指定遊戲狀態或注入完成存檔，Playwright clock只推進真正的RAF與計時器。

| Muse下一輪五項 | VERIFIED與原尺寸截圖 |
|---|---|
| 1．蛋糕與駕駛真正連動 | `phone-cake-speed-tilt-1.png`→`phone-cake-speed-tilt-2.png`→`phone-cake-speed-tilt-3.png`：先變速再累積傾斜。`phone-cake-only-recover.png`為高速只扶、回中央21%；`phone-cake-brake-and-recover.png`為減速同扶、回中央83%，車速5.9→2.3。受力變化與回穩力8／22另以同初始條件單元測試比較，避免把不同彎向的畫面當成受控實驗。 |
| 2．三段提示 | 三站各有 `phone-tickets-stage-1-mistake-1.png`／`mistake-2.png`／`mistake-3.png`（第2、3站同格式）。第一次只有文字線索，正解牌及底部控制保持中性；第二次淡化不符形狀的牌；第三次才亮正解。三課 `phone-cake-no-hint.png`、`phone-crossing-no-hint.png`、`phone-tickets-no-hint.png`都無預亮答案。過彎換題會重設提示階段。 |
| 3．真正左右觀察 | `phone-crossing-stage-1-look-left.png`及`phone-crossing-stage-2-look-right.png`為不同構圖的側向視野；`phone-crossing-stage-1-look-away.png`記錄看錯來源時來車尚未確認。每站 `phone-crossing-stage-1-traffic-1.png`→`traffic-2.png`→`traffic-3.png`→`traffic-clear.png`（第2、3站同格式）證明來車連續通過並離場；中途實際點出發後，車流、玩家距離與行人進度維持不動。 |
| 4．按住、停住、續按、坐下 | 同一小安第3站：`phone-tickets-stage-3-holding.png`→`phone-tickets-stage-3-paused.png`→`phone-tickets-stage-3-resumed.png`→`phone-tickets-stage-3-seated-1.png`。進度約45%→69%停住→86%續行→入座1/3；放開700ms進度完全相同，續按才前進。三站九位朋友都以實際操作完成，月台標示與票面全程保留。 |
| 5．九站選站與重玩變化 | `phone-cake-select-stations.png`、`phone-crossing-select-stations.png`、`phone-tickets-select-stations.png`各有三張可點圖卡，分別顯示坡／彎／灣、來車方向與朋友次序、形色規則。`phone-cake-replay-new-conditions.png`、`phone-crossing-replay-new-conditions.png`、`phone-tickets-replay-new-conditions.png`與首次開始對照，彎向、來車來源／隊伍、目標票色都已改變。 |

## 嚴重問題與半成品修正

右轉線改成下方支路與主路右半段，中間留出讓行區，圖層在人物後方。三站、每位朋友的start／middle／pavement共27張，逐張斷言虛線、箭頭與人物及名牌外框至少16px；腳底沿實際人行道鋪面走。指定小柏九張為：

| 站 | start | middle | pavement |
|---|---|---|---|
| 第1站 | `phone-crossing-stage-1-2-start.png` | `phone-crossing-stage-1-2-middle.png` | `phone-crossing-stage-1-2-pavement.png` |
| 第2站 | `phone-crossing-stage-2-3-start.png` | `phone-crossing-stage-2-3-middle.png` | `phone-crossing-stage-2-3-pavement.png` |
| 第3站 | `phone-crossing-stage-3-1-start.png` | `phone-crossing-stage-3-1-middle.png` | `phone-crossing-stage-3-1-pavement.png` |

休息灣為新生成完整原畫，灰色灣位、白色停車格與主路分開，P牌雙柱落在鋪面。`phone-cake-bay-entering.png`→`phone-cake-bay-parked.png`→`phone-cake-bay-leaving.png`。停妥車身完全離開主車道，可出發時蛋糕確實100%，不是文字先說完成。盤底檢查為 `phone-cake-tilt-47.png`及`phone-cake-tilt-20.png`，沒有穿車斜線，蛋糕底緣仍接車頂。

出發鎖定統一灰底灰圖示；站名與左右狀態不再於過街時消失。蛋糕歪掉時說「蛋糕歪了，減速一起扶」，控制不切換。車票邀請說明改普通短句，可點的朋友有向下指示與60px框；並修正觸控放開時誤觸下一動作的問題。

完成回顧取真實操作。一般驗證與直接完成對照在根目錄及 `clean/phone-cake-complete.png`、`clean/phone-crossing-complete.png`、`clean/phone-tickets-complete.png`：路口安全提醒3／0次，車票改選3／0次；蛋糕兩趟實際都扶正4次，因此忠實顯示相同次數。每趟完成後都重開讀回完整保存資料。

## 精選、商店圖及驗證

`docs/content/r28/review-set/`固定15張，01～05蛋糕、06～10路口、11～15車票，各五張，都是原尺寸PNG副本。08～10為第三站小柏連續過街，12～15為同一小安按住／放開／續按／入座。精選以核心互動優先；九站完整題目、三段提示及直接完成對照的其餘證據保留於本輪根目錄，沒有把資料夾外的圖宣稱為精選已包含。來源與SHA見 `review-set.json`。

新增商店圖：`docs/store/screenshots/content-r28/cake-bay-1290x2796.png`與`cake-bay-2064x2752.png`。使用430×932／DPR3及1032×1376／DPR2直接輸出；保留所有既有商店圖。前後原圖與三視口副本在 `docs/evidence/content-r28/`，雜湊在 `before-after.json`。

VERIFIED：`npm test` **299項全綠**，49個原有測試／輔助檔SHA未變；`npm run build`成功；`npm run test:merge`（5286）**132項全綠**。R28三課九站、直接完成九站、離線九站及保存重開皆通過；八種視口共72張涵蓋選站、實玩、扶正／觀察／上客，60px控制可達、圖示不壓字、文字不裁切，手機無鍵盤說明。只使用一個preview，瀏覽器每趟結束立即關閉。

VERIFIED：`npm run test:store`（5113）**101項全綠**，含安裝後離線檢查與儲存失敗時仍可玩。merge與store分別留下25／26張原始回歸圖；本輪主要驗證原圖共310張，15張精選另外保留原尺寸副本。最終來源SHA與驗收結果見 `docs/content/r28/release-proof.json`。

三視口各三次180個真實RAF取樣，p95中位為手機16.7ms、iPad視口16.8ms、桌機16.8ms，皆≤18ms；本機並發載量測僅供參考，不能當作實體裝置或乾淨機況效能。秘密掃描0命中。另修復Service Worker對快取音樂HEAD請求的離線回應，實際斷網重載後三課全部完成，沒有腳本錯誤、失敗資源或外部請求。

新增美術：**2次 `image_gen.imagegen`、1張runtime WebP**。首稿停車格太小，第二稿擴大；原圖、定稿、完整既有風格前綴、實際工具、model_slug=null與SHA在 `art/`。Sharp僅編碼與檢視縮圖。人物沿用受管姿勢，蛋糕為即時車速／受力驅動的2D表現，沒有新增人物骨架或宣稱真實奶油物理。維持MIT、免費及離線，未增加廣告、內購、帳號、外部連結、第三方SDK或線上功能。

## 清理及未完成

EXECUTED並回讀VERIFIED：刪除 **182個**已追蹤、未修改且被取代的舊媒體，工作樹釋出 **122,862,760 bytes（117.17 MiB）**。逐檔hash、絕對根目錄與實際刪除見 `cleanup-plan.json`／`cleanup-result.json`，Git刪除清單須與計畫一致。保留7,680個舊媒體：歷史驗證manifest會讀取及雜湊的圖片、明確腳本輸入、原畫及美術契約；逐檔理由與讀取者已列入清單。舊Markdown、商店圖與全部既有未追蹤檔保留；未刪舊測試或放寬斷言。指定測試與本輪實玩均在刪除後執行。

Apple 4.3風險：**中**。三課保留共用學院框架，但操作分別是照顧蛋糕、觀察與讓行、形色配對與陪同上車；本輪沒有用新增題數或通用任務充數。此為本機設計評估，並非商店審核結果。

BLOCKED：實體iPhone／iPad觸控與原生語音需裝置；真人親子與遮文字辨識測試需參與家庭；乾淨機效能需獨占硬體；Muse≥8需獨立複評。未製作原生簽章包。只做本機commit，未push、部署、操作商店或透過外部服務派工。

文案mode2：原「放開再向中央扶」改「減速一起扶」，讓文字符合可同時操作；原「先點一位朋友」按鈕狀說明改普通「點一位朋友」，箭頭放在可點朋友上；原「回穩」無按住數值改為同步百分比及「已停住」，讓動作和進度一致。課名、存檔識別與受控規格保留。
