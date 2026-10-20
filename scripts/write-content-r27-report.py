import json
from pathlib import Path

root = Path('docs/content/r27')
p = json.loads((root / 'release-proof.json').read_text(encoding='utf-8'))
assert p['status'] == 'VERIFIED'
perf = p['performance']['rows']
report = f'''# 島嶼交通學院：新內容第27輪

VERIFIED：本機修復、自動驗證與證據整理。工單2026-10-18，執行2026-10-20～21。分支 `r1-fun-polish`，基準 `{p['baseline'][:8]}`，版本 **{p['version']}／來源build {p['sourceBuild']}**。只修既有三課。未取得獨立Muse複評，不宣稱已達8分。

三課入口：首頁「海岸實作課」→課程車票→「一起出發」。

| 課程 | 修正與操作 |
|---|---|
| 把蛋糕平穩送到 | 看坡道及彎道照顧蛋糕。參照框紅箭頭明標「蛋糕歪向」，綠箭頭標「往哪邊扶」；95%以上收起紅箭頭。休息灣煞停前路牌就改名，車位連續進入路旁灣內；休息結束使全部蛋糕受力讀值回零，坐穩100%才說可以出發。錯按變歪、放開等待、按對才回穩。 |
| 路口停看等 | 停在線後、看左右、等來車與朋友過完、第三站再確認、最後右轉進主路。小安跨課同名，黃帽牽車朋友叫小柏，奶奶名牌為阿嬤；腳踏車只當道具。小柏起點、途中、到岸都在車旁步行，候位避開車頭。灰色出發鍵有模型鎖定，提前點按只給停住回饋。 |
| 形狀車票，找對月台 | 點月台牌、停對、開門、選朋友、按住陪同。列車初始在中間待命，位置不對應正解；朋友在同一候車帶。錯牌灰底紅框，正確牌只在錯後提示。人物依序走路、登階、跨門、沿車窗走道、入座；門內遮住雙腳，姓名不擋臉。放開不前進，真正坐下才加人數。 |

## Muse唯一五項清單：逐項驗收與原尺寸證據

下列路徑以 `docs/content/r27/` 為根，手機直式 **390×844**，原尺寸未裁切、未拼貼。完整逐張狀態、實際亮鍵、文字、幾何及SHA見各scope的 `browser.json`。Playwright clock只推進真實RAF與計時器，沒有指定遊戲狀態或注入完成存檔。

| Muse清單 | VERIFIED證據 |
|---|---|
| 1．分開傾斜與扶正方向 | `phone-cake-stage-1-playing.png`與`phone-cake-wrong-recovery.png`呈現左右偏移；`phone-cake-stage-2-centre-62.png`放開、`phone-cake-stage-2-correct-recovery.png`按對、`phone-cake-stage-2-centre-95.png`與`phone-cake-stage-2-centre-100.png`。紅箭頭有可讀圖例，95%以上消失。`phone-cake-stage-3-braking.png`→`phone-cake-stage-3-resting.png`→`phone-cake-stage-3-bay.png`證明煞停、休息、可出發；最後狀態坐穩100%、無紅箭頭，車在灣內。`phone-cake-stage-3-restart.png`補實際再起步。 |
| 2．先觀察，再提示 | 三課`phone-cake-no-hint.png`、`phone-crossing-no-hint.png`、`phone-tickets-no-hint.png`；首次輸入前自動斷言沒有`data-needed=true`，實際底部按鈕中性。首兩站停留2秒或選錯才提示；第三站只在選錯或按「再聽一次」後提示。蛋糕`phone-cake-wrong-recovery.png`；路口`hints/phone-crossing-stage-<1至3>-after-wrong-hint.png`只亮正確觀察鍵；車票`phone-tickets-stage-<1至3>-wrong.png`錯牌灰底、正確月台才給提示。安全鎖定一直獨立生效。 |
| 3．來車離場與提前出發鎖定 | 每站`phone-crossing-stage-<1至3>-traffic-1-approach.png`→`traffic-2-passing.png`→`traffic-3-leaving.png`→`traffic-4-clear.png`。前三格都實際點出發，自動比對下一幀來車style、交通時間、玩家距離及行人進度完全相同，顯示「還有車，先停住」。淨空後仍需等朋友全到岸；`ready-depart.png`才允許出發，`departing-1.png`～`departing-3.png`保留右轉動線。 |
| 4．月台決策到坐下的一條鏈 | 三站各有`phone-tickets-stage-<1至3>-decision.png`／`wrong.png`／`right.png`；同一小安六格為`board-start.png`→`walking.png`→`boarding-2.png`→`inside.png`→`aisle.png`→`seated-1.png`（均同stage前綴）。門外雙腳在inside圖已不可見，aisle在窗內位移，姓名保持。`paused.png`放開一秒同進度，續按才走；逐人`seated-1.png`～`seated-3.png`實際0→1→2→3，三站全部驗證。 |
| 5．九站差異與重玩 | 蛋糕坡道起步、左右彎、入灣停穩；路口左來車2.8秒、右來車3.8秒、左複查3.2秒及不同朋友次序；車票比形色、同形異色、同色異形。首玩與重玩各三站決策原圖在根目錄與`replay/`。蛋糕實際彎道判斷另在`supplement/phone-cake-stage-<1至3>-turn-decision.png`及`supplement/replay/`，三站方向皆不同；路口三站人物順序、車票三站目標都不同。完成回顧用真實扶正／安全提醒／改選次數，直接完成與錯後修正不會寫成同一結果。 |

## 指定嚴重問題與GPT補驗

- 同一造型姓名：所有路口名牌自動排除「腳踏車／小朋友／奶奶」，小安跨課完全相同；小柏為黃帽牽車者，沒有把交通工具當人名。
- 三站小柏起步／中途／到岸：`phone-crossing-stage-1-2-start.png`／`middle.png`／`pavement.png`；第2站為`stage-2-3-*`，第3站為`stage-3-1-*`。雙腿在車座旁，空座可見；到岸才計數。
- 路口去向採工單允許的轉彎方案：每站`decision.png`顯示右轉進入現有主路的路徑，斑馬線在路徑上；出發車位沿此線移動。沒有把對岸人行道誤作車道，起點人物不貼車頭。右轉線位於等候人物後方，圖層順序另有自動斷言，避免壓到臉與名牌。
- 休息灣原畫本來就有長椅與灣口；改車位、灣位與路牌同步，不再只靠底部說明。上方站名縮短並驗證所有文字無裁切。
- 進門遮擋與比例：`boarding-2.png`和`inside.png`有清楚門內外差異，後者無外露雙腳；`aisle.png`顯示同人沿窗內移動。不是用兩張近似的門外站姿宣稱全程上車。

## 精選、商店與測試

`docs/content/r27/review-set/`共15張，01～05蛋糕、06～10路口、11～15車票，各5張，全部原尺寸手機直式。三課都有遊玩進行中圖；蛋糕錯向→按對→100%、小柏起步→中途→到岸、小安進門→走道→入座各為連續三格。來源與SHA在`review-set.json`。15張容量無法同時容納三站各九張車票與三站四格來車；完整驗收鏈保留上述路徑，不宣稱精選已包含全部。

新增商店圖：`docs/store/screenshots/content-r27/tickets-escort-1290x2796.png`及`tickets-escort-2064x2752.png`，原生像素輸出。既有商店圖全部保留。前後原圖與三視口在`docs/evidence/content-r27/`，雜湊在`before-after.json`。

VERIFIED：`npm test` **{p['unitTests']}項全綠**，原有{p['unchangedExistingTestFiles']}個測試／輔助檔逐檔SHA未變；`npm run build`成功；`npm run test:merge`（5286）{p['mergeChecks']}項、`npm run test:store`（5113）{p['storeChecks']}項全綠。九站首玩及重玩、完成保存重開、未完成重玩保留舊完成紀錄、離線完整三課皆通過。錯看方向新增分支另由hints補驗，補驗後重跑單元、build及指定merge／store。

八視口：320×568、568×320、390×844、844×390、768×1024、1024×768、1366×600、1280×640。60px觸控可達、文字裁切、人物擋牌、人數遮擋、圖示壓字均逐張檢查；手機無鍵盤說明。三視口×三課×三次RAF量測，p95中位 **{min(r['p95'] for r in perf)}～{max(r['p95'] for r in perf)}ms**，九組皆≤18ms，並發載僅供參考。腳本錯誤、失敗資源、外部請求與秘密掃描均0。原尺寸證據{p['screenshots']}張（含各驗證scope；另加精選副本），最終證明見`release-proof.json`與各`*-test.txt`。

新增美術：**兩次image_gen.imagegen、兩張runtime WebP**，同一小柏的兩種牽車姿勢。首版腿形過近，第二次修正；原圖、完整既有風格前綴、實際工具、model_slug=null、alpha及SHA在`art/`。Sharp只裁圖、縮放與編碼；路徑／車票形狀／箭頭為操作符號。沒有新增3D物理、角色骨架、廣告、付費、帳號、第三方SDK或線上功能。

## 清理與未完成

EXECUTED並回讀VERIFIED：刪除 **{p['cleanup']['files']}個**已追蹤、未修改、被取代的舊媒體，釋出 **{p['cleanup']['bytes']:,} bytes（{p['cleanup']['bytes']/1048576:.2f} MiB）**。清單與Git刪除完全一致，絕對根目錄、逐檔hash、保留原因見`cleanup-plan.json`／`cleanup-result.json`。保留{p['cleanup']['retained']}檔：歷史驗證腳本會讀取／雜湊的舊圖、明確或模板引用的圖、美術原圖與來源契約；不能為清空資料夾破壞這些驗證輸入。所有Markdown、現行商店圖、既有未追蹤評審均保留。刪後上述全部指定測試及本輪實玩重跑全綠，未刪既有測試或放寬斷言。

Apple 4.3風險：**中**。海岸三課仍共用首頁與課程框架；本輪改善各課的實際觀察、照顧與決策，不以新增課數或通用任務充數。此為本機設計風險判斷，沒有商店審核結果。

BLOCKED：實體iPhone／iPad觸控、原生語音需要裝置；親子試玩、遮文字辨識需要參與者；乾淨機況效能需要獨占硬體；Muse≥8與三評結果需要獨立複評。未製作簽章原生包，未push、部署、操作商店或派工。八種視口的無頭測試不冒充實體裝置測試。

文案mode 2：原無標籤箭頭改「蛋糕歪向／往哪邊扶」，原因是傾斜與修正相反；原99%可出發改真正坐穩100%，原因是完成判定矛盾；原「腳踏車／小朋友／奶奶」名牌改「小柏／小安／阿嬤」，原因是人名與跨課造型不一致；原無去向的出發補右轉路徑，原因是空間不清。課名、受控規格及既有存檔識別保留。
'''
Path('docs/CODEX_RESPONSE_CONTENT_R27.md').write_text(report, encoding='utf-8')
print('VERIFIED R27 Traditional Chinese report written from release-proof.json')
