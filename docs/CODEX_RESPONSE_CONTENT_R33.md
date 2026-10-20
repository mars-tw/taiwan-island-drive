# 新內容第33輪交付

VERIFIED：工單日期2026-10-18，執行日期2026-10-21。僅 `r1-fun-polish`，版本 **2.45.0／原生來源 build 41**。本輪修正既有三課，沒有新增互動類型；全程背景／無頭，僅本機提交。MIT、免費、離線，未加入廣告、內購、帳號、外部連結或第三方 SDK。

## 三課入口與修正

共同入口：**首頁 → 海岸實作課 → 選課 → 選站 → 自己試試／一起出發**。

**把蛋糕平穩送到**：主車留在自己車道；車頂托盤參照、蛋糕傾角與滑移共用即時讀值。錯扶會更歪，持續行駛會滑向托盤邊，減速反向扶可救回。收起特寫仍能直接看主場景分辨50%、托盤邊、100%。量表改為「穩定度」並分紅／黃／綠，主要指令只留一句。休息灣改用一張生成的連續全景，車與道路取景隨路程移動；出口沒有路緣阻擋，主路取景沒有 P 牌與車格，灣內限慢速，靜止只顯示已停住。

**路口停看等**：未就緒時出發可按，主車留在原位，具體說明誰在線上或哪側有車；兩種遊玩模式都適用。觀察窗放大，接近／通過／離開使用同一來車座標。停止線垂直來車，位於同車道車頭前；移除會蓋住阿嬤的紅記號及車旁浮動文字。新車只讓該側確認失效，車過後仍需玩家重看。

**形狀車票，找對月台**：站牌每幀從同一形色資料更新，修正重玩時牌面殘留舊色；比較框標明「你的車票 → 所選月台」。上車時持續顯示月台號與票面。門檻69%、走道86%各需要放開等站穩；太早續按會晃一下並停在原站穩點，放開滿0.65秒才可接續。停等使用雙腳落地站姿，行走朝車內，入座換成屈膝坐姿後才+1。車廂近景出現的朋友，外部車窗投影同步收起，沒有分身。

## Muse唯一五項清單與原尺寸證據

下列 `phone-*.png` 均位於 `docs/content/r33/`，390×844原尺寸直接截圖，沒有縮放或拼貼。

| 項目 | 驗收與截圖 |
| --- | --- |
| 1 離灣路程 | `phone-cake-bay-parked.png` → `phone-cake-bay-leaving.png` → `phone-cake-bay-main-road.png`。三格主車外框左上角像素座標：(142.4, 350.3) → (157.9, 334.6) → (172.8, 317.7)。同一幅全景由灣位連續移到主路，沒有道路重影；主路沒有P牌／車格。單元遍查灣內速度，靜止與慢速用字不矛盾。 |
| 2 主畫面蛋糕 | `phone-cake-rescued.png`／`phone-cake-wrong-support.png`／`phone-cake-late-brake-edge.png`。特寫已收起；回正、50%、托盤邊三態相對托盤中心的絕對位移依序 2.17／28.31／66.52px，呈遞增。量表100%綠、50%黃、4%紅，主蛋糕與特寫同角。 |
| 3 可試錯與交通空間 | `phone-crossing-N-WHO-on-zebra.png`，N=1、2、3，WHO=child／grandma／bike，均在行人途中實際按出發、顯示姓名與原因。`phone-crossing-stage-N-car-approach.png` → `car-passing.png` → `car-leaving.png`；`new-car-yields.png`、`clear-needs-recheck.png`、`ready.png`、`departing.png`完成因果鏈。另有 `phone-crossing-mirror-stage-N-new-car-yields.png`：三站×左右來車六種停止位置，停止標記與全部行人外框交疊面積0，且車輛外框完全在線後。 |
| 4 判斷點與單一人物 | `phone-tickets-stage-N-threshold-0.png` → `threshold-too-early-0.png` → `threshold-stable-0.png` → `aisle-0.png` → `aisle-too-early-0.png` → `aisle-stable-0.png` → `seated-1.png`。早按不前進，站穩後可接續；放開800ms，位置與進度保持相同。`seated-1.png`／`seated-2.png`／`seated-3.png`各證明一席真坐姿、腰部在座墊上。入座計數與同一份坐姿投影逐張一致。 |
| 5 後站差異與補格 | 第二站反向來車、阿嬤先過街及不同人物次序，三站不同路口；蛋糕雙彎與連續灣景不同，重玩道路鏡像。三站車票目標／月台排列不同，重玩換色。每站 `phone-tickets-stage-N-wrong-shape.png`、`wrong-color.png`均實按，沒有兩邊同色卻判異色。三課 `phone-KIND-stage-3-finished.png`或`phone-KIND-complete.png`及`phone-KIND-saved.png`證明完成與重載。 |

## 精選集逐張檢查

`docs/content/r33/review-set/` **正好15張，每課5張**，皆為原圖逐位元副本，來源與SHA在 `review-set.json`。本次由Codex逐張目視核對，並非新的Muse／Claude獨立評分。精選集中保留主操作、錯誤、回復、站次差異與入座；六方向、九站、車流三格與全部停等連拍則在上述完整證據，不把15張樣本冒稱涵蓋每一幀。

| 圖 | 原尺寸路徑（相對docs） | 逐張結果 |
| --- | --- | --- |
| 01 | `content/r33/review-set/01-cake-wrong-support.png` | 黃50%、14°左傾，主車與托盤完整，特寫已收起，只有一句主要指令。 |
| 02 | `content/r33/review-set/02-cake-late-brake-edge.png` | 紅4%、27°，蛋糕左移更大、托盤邊可見，沒有角色被操作鈕遮住。 |
| 03 | `content/r33/review-set/03-cake-rescued.png` | 綠100%、0°且已停住；蛋糕回到中央，主車中心不在中線，數值與畫面一致。 |
| 04 | `content/r33/review-set/04-cake-bay-leaving.png` | 車格退到右後、P牌移出取景；慢速與出口畫面相符，沒有道路重影。 |
| 05 | `content/r33/review-set/05-cake-bay-main-road.png` | 主路沒有P牌與車格，車在右側車道，與04位置不同，車身與蛋糕都完整。 |
| 06 | `content/r33/review-set/06-crossing-stage-1-car-approach.png` | 來車接近，三位朋友都在線後；左右觀察窗車位不同，沒有停止標記蓋頭。 |
| 07 | `content/r33/review-set/07-crossing-1-child-on-zebra.png` | 小安在線上，原因句具名；來車與白線同上方車道，白線在車頭前，不碰任何行人。 |
| 08 | `content/r33/review-set/08-crossing-2-grandma-on-zebra.png` | 阿嬤在第二站先過街、左側車停在線後；白線沒有蓋頭，路口背景與第一站不同。 |
| 09 | `content/r33/review-set/09-crossing-2-bike-on-zebra.png` | 小柏牽車在線上、2/3人到岸；具名原因與淨空勾一致，人物沒有被交通標記遮住。 |
| 10 | `content/r33/review-set/10-crossing-stage-3-finished.png` | 第三站完成，三位朋友出場且旅程已保存；完成圖沒有遮臉，沒有把靜態結尾當步態證據。 |
| 11 | `content/r33/review-set/11-tickets-stage-1-wrong-shape.png` | 藍圓票對藍方月台，形狀不同、顏色相同；紅框月台與比較板同源，沒有誤稱都一樣。 |
| 12 | `content/r33/review-set/12-tickets-stage-1-threshold-too-early-0.png` | 門檻早按，站姿短暫傾斜、0/3未加；3號月台與藍圓票仍可見，小安只在車內一處。 |
| 13 | `content/r33/review-set/13-tickets-stage-1-threshold-stable-0.png` | 放開站穩，雙腳落地、0/3且可續走；仍在同一站穩點，外部車窗沒有分身。 |
| 14 | `content/r33/review-set/14-tickets-stage-1-aisle-too-early-0.png` | 小安已到走道，太早續走仍停住；位置比門檻靠左，仍0/3，車內外沒有重複人物。 |
| 15 | `content/r33/review-set/15-tickets-stage-1-seated-3.png` | 三人各在座位上屈膝坐好、已入座3/3；腰部與座墊同高，票面與月台一致，沒有跨步入座。 |

## 自動測試與讀回

VERIFIED：`npm test` **331/331**；`npm run build`；5286 `npm run test:merge` **132項**；5113 `npm run test:store` **101項**，全部通過。53個既有測試檔逐位元未改，保留R31單一狀態與文字不矛盾測試。新測試驗證每課可玩／可完成／存檔，兩處停等不得長按跳過、早按退回原點、真站姿／坐姿與計數一致、主路取景與車位、停止線與角色零交疊、形色同源。

最終內容驗證all／layout／offline／store／performance皆實跑，來源雜湊、469張原尺寸截圖與存檔由 `release-verification.json`回讀核對。三課九站正常觸控完成；離線重載後也完成九站。換邊重玩另外跑三個路口。八視口：320×568、568×320、390×844、844×390、768×1024、1024×768、1366×600、1280×640；控制至少60px，文字裁切0、手機鍵盤說明0、外部請求0、執行錯誤0。

並發載工作站RAF參考：390×844、768×1024、1366×600，各三跑180幀，p95中位 **16.8／16.8／16.8ms**，狀態 `VERIFIED`。各跑與最大值在 `performance/performance.json`；此量測不是乾淨機或原生裝置效能。秘密掃描0命中。Playwright使用當機既有npm快取模組，沒有安裝第三方SDK到遊戲。

## 美術、商店與清理

新增 **7張執行美術／3次 `image_gen.imagegen`**：三位坐姿、三位站穩姿勢、一張連續道路全景。完整既有風格前綴、原尺寸PNG、alpha裁切與SHA在 `content/r33/art/`與`art-manifest.json`，七張均通過忽略透明像素的亮度／飽和度閘門，數值在`art/color-audit.json`。工具未揭露確切模型slug，填null，未虛報模型。Sharp僅分格、裁邊、等比縮圖與轉格式；托盤參照、量表、停止線與票形是操作資訊。蛋糕是即時2D受力投影，人物沿用雙步態並新增站／坐姿，未聲稱骨架動畫或3D物理。

新增商店原圖：`docs/store/screenshots/content-r33/cabin-seated-1290x2796.png`、`cabin-seated-2064x2752.png`。分別由430×932／DPR3與1032×1376／DPR2直接實玩擷取；不是原生iPhone／iPad測試。全部既有商店圖保留。

EXECUTED：刪除 **33個**乾淨已追蹤的舊證據，釋出 **14,461,202 bytes（13.79 MiB）**；包含R32全部15張精選與舊主線／商店回歸的可重建副本。清冊、分支、絕對根目錄與SHA在 `cleanup-plan.json`／`cleanup-result.json`。保留9492個原畫與歷史驗證輸入，逐檔列reason／readers；Markdown審查、商店素材與任何腳本會讀的檔案都保留。未重寫Git歷史，不宣稱Git物件庫同步縮小。所有指定測試都在舊輪清理後執行。

另清除本輪已取代的中間檔218個，釋出79,988,919 bytes，見`intermediate-cleanup.json`；未碰接手前的102個未追蹤檔，全部SHA保持相同。

## 文案修改紀錄

| 原句 | 原因 | 改成什麼 |
| --- | --- | --- |
| 蛋糕滑動了／回到直立50% | 重複狀態且百分比方向不清 | 一句主要提示＋穩定度50%，紅黃綠量表 |
| 等車過 | 沒分清車正在讓行或通過 | 停讓時「等朋友過街」，行進時「等車通過」 |
| 形狀、顏色都一樣 | 在選錯時像在宣稱已對上 | 「找相同形狀＋顏色」；比較板標你的車票／所選月台 |
| 按住陪同・已走到69% | 操作重點變成等進度 | 「放開，等站穩」／「站穩了，再按住走」；進度退居圖環 |

## Apple 4.3風險與未完成

風險 **中**：三課都有交通生活的具體觀察與操作因果，未增加通用任務／徽章／抽卡；學院外框與三站結構仍有共通感。這是本次產品判斷，不代表Apple接受或法規認證。

BLOCKED：實體iPhone／iPad觸控及原生語音需要裝置與原生測試環境；真人親子試玩需要家長與兒童；乾淨機效能需要無其他產線負載的機況；Muse複審8分需要獨立評審只看本輪review-set。均未假造完成，未取得R33新分數。未push、部署、上傳商店或對外發訊息。
