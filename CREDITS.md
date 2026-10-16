# CREDITS

## 2.7.0 列車數學課

- 來源：小小列車長／Taiwan Train Math，Copyright 2026 mars-tw，repo `taiwan-train-math`，來源 commit `7e25c749f073de321dabc25f982ee41ecac62dca`。
- `src/games/math/dispatch.js`：移植 `src/dispatch.js`，程式 Apache-2.0；原教育文字 CC BY 4.0。保留原教材與守恆模型，檔頭新增署名，學院外殼改標題、任務交接、返回與暫停；新 glue code 依主 repo MIT。
- `tests/shared/dispatch-ported.test.js`：移植來源 `tests/dispatch.test.mjs` 的完整第一個測試，保留三年齡 × 12 班、守恆／錯答／重複發獎與序列化斷言；改 import 路徑並移除該檔未移植模組的 imports，其餘存檔橋接由新整合測試覆蓋。Apache-2.0。
- 原 Apache 完整授權與原 NOTICE 原文位於 `public/licenses/taiwan-train-math/`，會隨 Web／native payload 打包。原教材文字 CC BY 4.0 條款：<https://creativecommons.org/licenses/by/4.0/>。此為文件中的授權地址，遊戲 UI 沒有外連。
- 本輪沒有複製來源照片、品牌圖、生成原畫或音檔，沒有假報 `gpt-image-2` slug。車廂／座位用 DOM/CSS 呈現，沿用主 repo 系統字型、既有交通圖與 WebAudio 三和弦。
- 精確檔案、雜湊與變更說明見 `docs/merge-assets.json`。來源 NOTICE 提到的圖鑑／照片授權檔不屬本輪使用範圍，沒有把整個來源素材庫重新授為 MIT。

本檔記錄 R1 起新增的素材來源。既有模型、貼圖與字型的授權見 `public/THIRD_PARTY_NOTICES.txt`、`docs/realism/README.md`，以及各模式在 `docs/editions/` 的製作文件。

## 音樂

| 檔案 | 來源 | 授權／備註 |
|---|---|---|
| `public/audio/lobby-theme.m4a` | 2026-10-15 由本機 AI 派工器 `music` 能力（worker `ace_step_turbo`，ComfyUI 上的 ACE-Step 1.5 turbo）生成。task id `25b5be10-465d-410c-a6d8-d7e5446c1ac1`，原始輸出 `DISPATCH_MUSIC_TURBO_25b5be10-465_00001.flac`（30 秒、48 kHz，SHA-256 `7e1d4536…d640f`）。提示詞：`cheerful bouncy instrumental for preschool kids game menu, ukulele, glockenspiel, light hand claps, soft marimba, major key, playful, 112 bpm, no vocals, seamless loop`。用 ffmpeg 裁掉尾端 3.5 秒靜音，保留 26.4 秒；開頭加 0.08 秒、結尾加 1.2 秒淡入淡出；以 loudnorm 調整到 −20 LUFS；轉成 AAC 96 kbps（SHA-256 `8a0c6d4a…6eba`）。 | 本機模型 README 標示為 MIT。生成音樂的著作權歸屬，各法域的規定還不一致。商店版若要採用，請家長／法務先確認。只在大廳播放，家長可以關閉（♪ 按鈕或家長設定的聲音開關）。 |

## 程式化效果（無外部素材）

- 星星、彩紙、貼紙彈出與三和弦音效：`src/shared/celebrate.js`，全部由程式產生（CSS 與 WebAudio 振盪器）。
- 汽車路上的金色星星：`src/games/car/game.js` 用 Three.js `ExtrudeGeometry` 產生。
- 飛機目標的星形與標籤：`src/games/flight/world.js` 用程式繪製。
