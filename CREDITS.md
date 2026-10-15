# CREDITS

本檔記錄 R1 起新增的素材來源。既有模型、貼圖與字型的授權見 `public/THIRD_PARTY_NOTICES.txt`、`docs/realism/README.md`，以及各模式在 `docs/editions/` 的製作文件。

## 音樂

| 檔案 | 來源 | 授權／備註 |
|---|---|---|
| `public/audio/lobby-theme.m4a` | 2026-10-15 由本機 AI 派工器 `music` 能力（worker `ace_step_turbo`，ComfyUI 上的 ACE-Step 1.5 turbo）生成。task id `25b5be10-465d-410c-a6d8-d7e5446c1ac1`，原始輸出 `DISPATCH_MUSIC_TURBO_25b5be10-465_00001.flac`（30 秒、48 kHz，SHA-256 `7e1d4536…d640f`）。提示詞：`cheerful bouncy instrumental for preschool kids game menu, ukulele, glockenspiel, light hand claps, soft marimba, major key, playful, 112 bpm, no vocals, seamless loop`。用 ffmpeg 裁掉尾端 3.5 秒靜音，保留 26.4 秒；開頭加 0.08 秒、結尾加 1.2 秒淡入淡出；以 loudnorm 調整到 −20 LUFS；轉成 AAC 96 kbps（SHA-256 `8a0c6d4a…6eba`）。 | 本機模型 README 標示為 MIT。生成音樂的著作權歸屬，各法域的規定還不一致。商店版若要採用，請家長／法務先確認。只在大廳播放，家長可以關閉（♪ 按鈕或家長設定的聲音開關）。 |

## 程式化效果（無外部素材）

- 星星、彩紙、貼紙彈出與三和弦音效：`src/shared/celebrate.js`，全部由程式產生（CSS 與 WebAudio 振盪器）。
- 汽車路上的金色星星：`src/games/car/game.js` 用 Three.js `ExtrudeGeometry` 產生。
- 飛機目標的星形與標籤：`src/games/flight/world.js` 用程式繪製。
