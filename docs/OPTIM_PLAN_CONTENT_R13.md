# 新內容第13輪修正計畫

PREPARED。限定 `r1-fun-polish`，保留所有原有未追蹤審查檔。只修海岸實作課既有三項內容，不新增課程、外部服務或付費功能。

已讀共用核心規則、game-optimization-round、token-efficient-ai-dispatch、speak-human-tw（mode 2）、Playwright、R11／R12 的 Muse、GPT、Claude 六份審查及 R12 交付、ART_DIRECTION。repo 沒有 AGENTS.md、CLAUDE.md 或 AUDIT_full.md；本次對話提供的 AGENTS 指示適用。使用者明確禁止委派、可見視窗及發布，全部以本機無頭腳本驗證。

## 三課修正及唯一驗收表

| R12 Muse 下一輪五項 | 修正設計 | 驗收及原尺寸圖規劃 |
|---|---|---|
| 1．主場景蛋糕放大 | 車頂與儀表共用整體傾斜支點、三層、小旗，車頂放大至少1.8倍；儀表為輔助 | 390×844三格回穩圖，50%檢查可辨左右，旗尖方向同步 |
| 2．蛋糕按鈕語言 | 踏板／煞車／左轉／右轉名稱及位置固定；放開自動回穩，不再有主動扶正鍵；最多一個主要亮鍵 | 起步、歪斜、回穩、停穩、再起步；左右彎蛋糕向外側倒；狀態字≥14px；回穩三格量條每格增加≥15百分點 |
| 3．路口人物對應 | 順序卡只留編號與名稱，場景單一實體；到岸三個固定鋪面站位，不重疊、不出界；移除獨立勾框。觀察時聚焦可見來車與朋友，來車通過前不能過街 | 三站開始／過街中／全到岸圖；九位進入／中段／到岸原圖；外框重疊0、全在場景內；到岸數只在路徑完成後增加 |
| 4．錯站操作入口 | 真正可點的三塊月台牌突出；形色比較維持，開門禁用；站牌與列車門採同一組固定停車點 | 三個月台停妥門中心距站牌柱≤15px，2、3號車位置差≥100px（390寬）；錯站下一步入口可見 |
| 5．三站判斷及結算證據 | 保留坡／連續左右彎／臨停、三種朋友順序、同形異色／同色異形配對；觀察新增實際來車資訊；縮圖對應實作事件 | 九張三站進行圖、三課結尾及保存重開；不增加新內容模板 |

補修Claude／GPT：輪底對鐵軌上緣≤3px；月台、水平踏階、門檻與腳底連續；三站逐人上車及收階→關門；人數HUD不跳位、完成隱藏；沿用同車結尾。R11回歸涵蓋缺右無左箭頭、沿斑馬線、灰出發→亮出發→駛離、錯站／關門無虛線、臨停格與同車結尾。

## 預計檔案

- `src/shared/content-r1.js`：僅UI啟用的新回穩模式與可觀察車流等待，保留舊模式契約。
- `src/shared/content-r1-ui.js`、新增 `content-r13-scene.js`／`content-r13.css`：統一幾何、提示與圖層。
- `tests/shared/content-r13.test.js`、`scripts/check-content-r13.mjs`、準備／驗收腳本：單元、實玩、RWD、存檔、離線、截圖與SHA。
- `docs/content/r13/`、`docs/evidence/content-r13/`、`docs/store/screenshots/content-r13/`：原尺寸證據與15張精選（每課5張）。若需新場景插畫，以 `image_gen.imagegen`、既有完整風格前綴與真實manifest交付。
- package／lock、汽車config／模型catalog、iOS／Android版本：2.25.0，build21。
- `docs/CODEX_RESPONSE_CONTENT_R13.md`、`docs/art/ART_DIRECTION.md`：完成範圍及限制。

## 品質閘

保留既有測試與斷言，全量 `npm test`、`npm run build`；單一5286 preview依序做三課無頭實玩、八視口≥60px與存檔／離線／暫停，再關閉；5113 preview跑 `test:store` 後關閉；`test:merge`依指定5286。效能三跑p95≤18ms以並發參考列報，不冒稱乾淨機況。秘密掃描僅repo，零命中；不讀秘密資料夾。15張手機精選均複製原圖且附SHA，動態連續2～3格。新增商店圖兩個指定尺寸，不刪舊圖。本機繁中commit，明確路徑add。

BLOCKED：實體iPhone／iPad及原生觸控語音需裝置，真人親子／5秒理解需參與者，乾淨機況效能需獨占硬體，Muse≥8需外部複審。本輪不假造以上結果。

## 執行收尾

VERIFIED：本輪指定修正、137組三課／矩陣／韌性／商店原圖檢查、160張原尺寸圖、15張逐位元組相同精選、兩規格商店圖完成；221項單元、132項整合、101項商店回歸全綠。效能18組三跑中位p95最大16.8ms（並發參考），版本2.25.0／來源build21。新增2次image_gen.imagegen編修、一張採用runtime圖，第一版原圖保留為未採用證據。原生包未重建或簽章，實機／親子／乾淨機況／Muse複審維持BLOCKED。完整來源及逐項截圖在 CODEX_RESPONSE_CONTENT_R13.md、acceptance.json與release-proof.json；只做本機提交。
