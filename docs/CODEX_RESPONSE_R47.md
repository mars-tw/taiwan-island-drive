# R47 施工回報（2026-11-02，Claude 本機施工）

清單見 [OPTIM_PLAN_R47](OPTIM_PLAN_R47.md)。只在本機 commit，沒有推送、部署，也沒有呼叫商店 API。

## 做了什麼

1. **Android 圖示統一成石虎**：`scripts/prepare-android-launcher-r47.mjs` 從 iOS `TransportIconV2-1024.png`（未改動）用 sharp 縮放，重寫六個密度的 `ic_launcher`、`ic_launcher_round`、`ic_launcher_foreground`、`ic_launcher_background`，以及兩個 `mipmap-anydpi-v26` XML（拿掉樣板的 16.7% inset，改成完整 108dp 圖層）。自適應前景整張主圖落在中央 66dp，背景是 `#73c9f3`，和現行 `ic_transport_v2` 一樣。產出紀錄：`resources/branding/android-launcher-r47-report.json`。
   - 補充：`AndroidManifest.xml` 本來就指向 `@mipmap/ic_transport_v2`（石虎），所以手機桌面實際顯示的圖示原本就是石虎；這次換掉的是沒被選用、但仍打包進 APK／AAB 的舊扁平圖。Manifest 沒有改。
   - `drawable/ic_launcher_background.xml`、`drawable-v24/ic_launcher_foreground.xml` 是 Android Studio 樣板向量圖，沒有任何資源引用，這輪保留沒動。
2. **數學課答錯時教練會說話**：新增 `src/shared/dispatch-guide-r47.js`（純函式，不改課程狀態），`academy-ui.js` 依它判斷。第 1 站人數不夠、第 2 站分錯、第 3 站答錯時，教練泡泡改說課程原本的句子（例如「後車廂現在 2 人，請分成 1 人。總數仍是 5 人。」），泡泡變橘框並輕晃一次。矮的橫式手機原本藏起教練，失敗時改顯示一行泡泡。
3. **第 1 站一次只亮一顆按鈕**：沒坐滿前「上車 1 人」亮黃色，「人數好了」改白底；坐滿後沿用原本橘色的「坐好了，去分車」。第 2、3 站不提示答案。動畫放在 `prefers-reduced-motion: no-preference` 內。

課程數字、題目、答案判定（`src/games/math/dispatch.js`）都沒有改；隱私、網路、資料儲存行為也沒有改。

## 驗證

- `npm test`：401 項全過（基線 393 項＋新增 8 項：`tests/shared/dispatch-guide-r47.test.js` 5 項、`tests/native/android-launcher-r47.test.js` 3 項）。圖示測試在舊圖上實跑會失敗 2 項，換圖後通過。
- `npm run build` 成功（含 `verify-vehicle-surfaces`、precache 271 檔）。
- headless Chromium（swiftshader 軟體渲染，未用 GPU）走完一輪數學課，直式 390×844 與橫式 844×390 都沒有 runtime error、對話框沒有溢出；首頁、汽車、火車、飛機重開也沒有 runtime error。
- 秘密掃描 `sk-proj-…`／`sk-…` 排除 `.git`、`node_modules` 後 0 筆。

## 證據圖（`docs/evidence/r47/`）

| 畫面 | before | after |
| --- | --- | --- |
| Android 圖示（方形、圓形、自適應圓形遮罩、自適應圓角遮罩＋64px 縮圖） | `before/android-launcher-icons.png` | `after/android-launcher-icons.png` |
| 第 1 站 2／5 人 | `before/phone-math-load-2of5.png` | `after/phone-math-load-2of5.png` |
| 第 2 站分錯後按「分好了」 | `before/phone-math-split-wrong-check.png` | `after/phone-math-split-wrong-check.png` |
| 第 3 站答錯 | — | `after/phone-math-subtract-wrong.png` |
| 橫式：第 1 站太早按、第 2 站分錯 | — | `after/landscape-math-load-early-check.png`、`after/landscape-math-split-wrong-check.png` |

## 沒做到／受阻

- **Android APK／AAB 沒有重建**：本機沒有 Android SDK，無法跑 Gradle、aapt2 或在模擬器、實機看桌面圖示。圖示只做到 PNG 與 XML 層級的自動測試和圖片模擬遮罩。
- iOS 沒有變更，也沒有重建。
- `npm run test:merge`、`test:store` 這類要另外設定環境變數的無頭檢查沒有跑。
- 原生版本號（2.32.0／28）沒有 bump。

## 其他

clone 後有 40 多個檔案在 index 裡是 CRLF、`.gitattributes` 要求 LF，所以一 checkout 就顯示「已修改」，內容其實只差行尾。本輪只 commit 自己改的檔案，那些行尾差異留著沒動。
