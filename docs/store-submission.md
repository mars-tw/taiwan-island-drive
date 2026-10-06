# 島嶼交通學院商店送審包

查核日期：2026-10-06。本包已準備商店文字、隱私／年齡自評、公開政策頁與驗收條件，尚未在 App Store Connect 或 Play Console 填報，也沒有宣稱上架或通過審查。原生版本暫定 `1.0.0`／build `1`，App ID 暫定 `tw.mars.islandtransport`，需帳號擁有者確認及平台查重。

第一版先依免費、無廣告、無內購、無訂閱、無分析 SDK、無帳號準備。使用者已確認兩個開發者帳號都還沒建立；商業模式最後確認、法定身分與審查聯絡人的姓名、電話保留待填；擁有者已授權公開客服信箱 a820628a@gmail.com，不從電腦名稱、GitHub 帳號或其他文件猜測。

## 已準備的內容

| 檔案 | 用途 |
| --- | --- |
| `store/metadata/zh-TW.json`、`en-US.json` | Apple 名稱、副標、簡介、關鍵字、描述與 Play 短／完整描述 |
| `store/metadata/app.json` | 版本、暫定識別碼、價格預設、未填的身分及客服欄位 |
| `store/metadata/limits.json`、`validate.mjs` | 文字長度與結構驗證 |
| `store/review/data-inventory.json` | 對照實際原始碼、感測、語音、本機資料與 SDK |
| `store/review/apple-privacy.json` | Apple 隱私標籤候選與 final archive 條件 |
| `store/review/play-data-safety.json` | Google Data safety 候選及本機資料刪除方式 |
| `store/review/age-and-families.json` | 3～5 歲／Kids／Families／IARC 自評 |
| `store/review/review-notes.json` | 審查員操作步驟，不需要測試帳密 |
| `store/review/acceptance.json` | 原生離線、語音、家長關卡、感測與檔案驗收 |
| `store/review/submission-readiness.json` | 真正尚未解決的送件阻擋 |
| `public/privacy.html`、`support.html` | 本機可閱讀的中英政策與支援頁 |

商店英文文字明確說明遊戲介面與提示是繁體中文，不把 en-US 商店翻譯冒充完整英文介面。依官方欄位限制，Apple 名稱／副標各 30 字元、描述 4,000 字元，關鍵字是 **100 bytes**；Play 名稱 30、短描述 80、完整描述 4,000 字元。[Apple 欄位](https://developer.apple.com/help/app-store-connect/reference/app-information/platform-version-information)、[Play 欄位](https://support.google.com/googleplay/android-developer/answer/9859152?hl=en)

## 隱私自評及實際證據

現有程式把共用設定、汽車選擇／紀錄及飛機成績保存在裝置上；方向感測只用於本機轉向。已檢視 `src/shared/native.js`：原生語音只選 `localService=true`，排除 network-required 音色；沒有合適音色便保留字幕，不回退到原生模式下的 browser speech，也不啟動語音下載。Android TTS plugin 的原始碼將 `localService` 對應到 `!Voice.isNetworkConnectionRequired()`。

「Data Not Collected／沒有收集或分享資料」是送審候選答案，仍要以最終 AAB／IPA 和 SDK、權限、網路觀察核對。網站初次載入、使用者自行開啟外部網站，以及 OS 語音／備份服務不能籠統當成「所有系統永遠不連網」。本機使用與對外資料收集的範圍由官方定義判斷。[Apple 隱私](https://developer.apple.com/app-store/app-privacy-details/)、[Google Data safety](https://support.google.com/googleplay/android-developer/answer/10787469?hl=en-GB)

`@capacitor/preferences` 會在 iOS 使用 UserDefaults。原生整合需把真實用途及 `CA92.1` 放入合適的 privacy manifest，並檢視所有 SDK 的 archive 隱私報告；不把未使用的 API 理由塞入範本。[Capacitor Preferences](https://capacitorjs.com/docs/apis/preferences)、[Apple required-reason API](https://developer.apple.com/documentation/bundleresources/describing-use-of-required-reason-api)

## 年齡、家長關卡與內容

本產品為 3～5 歲幼兒設計，建議 Apple Made for Kids 的「5 and under」及 Play「Ages 5 and under」。Apple 的內容年齡評級由問卷計算，候選 4+ 不代表已獲分級；IARC 也尚未發出結果。家長陪玩不等於額外把產品申報成成人目標。[Apple Kids](https://developer.apple.com/kids/)、[Apple 年齡問卷](https://developer.apple.com/help/app-store-connect/manage-app-information/set-an-app-age-rating)、[Play 目標族群](https://support.google.com/googleplay/android-developer/answer/9867159?hl=en)

家長設定、可選動作權限與外部資源需要成人保護。原生實作更嚴格：支援、原始碼及下載地址只顯示給家長，不直接開啟外站；瀏覽器版才在家長確認後外連。公開 support 頁也遵守這個原生／網頁差別。家長關卡不是孩子身分驗證，也不是取得個人資料的法律同意。[App Review Kids 規則](https://developer.apple.com/app-store/review/guidelines/#kids-category)、[Play Families](https://support.google.com/googleplay/android-developer/answer/9893335?hl=en)

審查說明應展示三種互動遊戲、本機 3D 素材、觸控、語音／感測及離線流程，讓審查員評估完整遊戲功能，不能只填一句「把網站包成 App」。框架與包裝方式不保證核准。[App Review 4.2](https://developer.apple.com/app-store/review/guidelines/#minimum-functionality)

## 可執行驗收

```sh
node store/metadata/validate.mjs
node store/metadata/validate.mjs --require-submission-ready
```

第一條驗證字數、UTF-8 keywords、JSON 與本機 HTML；通過會輸出 `store/review/metadata-validation.json`。第二條是實際送件 gate，目前應回傳 exit 2，因為帳號、聯絡資訊、簽章、平台問卷及實機資料未完成。不能為了讓檢查變綠而虛改「已完成」。具體離線／語音／家長關卡／感測／原生截圖步驟見 `acceptance.json`。

## 當前真正阻擋

1. 兩個開發者帳號尚未建立。擁有者要選個人或組織、提供真實身分、同意平台條款並處理註冊費；這些動作尚未代辦或付款。Apple 參考費用為每年 USD99，Play 為一次 USD25，實際區域價格與資格依平台。免費 App 用一般 Developer Program License Agreement；Paid Apps Agreement／銀行稅務是日後付費或內購時才需另處理。[Apple 加入](https://developer.apple.com/programs/enroll/)、[Play 加入](https://support.google.com/googleplay/android-developer/answer/6112435?hl=en)、[Apple 合約](https://developer.apple.com/support/terms)
2. Google Play 必填的公開支援 email 已由擁有者提供為 a820628a@gmail.com，並更新商店、App Review email 與公開政策頁。法定名稱、審查聯絡人的姓名及電話仍待提供，沒有自行補造。原生頁面只顯示信箱，不開啟 mailto。[Play 聯絡資料](https://support.google.com/googleplay/android-developer/answer/9859152?hl=en)
3. 當前宿主是 Windows，還需要 Mac 或 macOS CI、iOS archive、簽章與真實 iPhone／iPad 測試。Apple 從 2026 年 4 月要求使用 iOS／iPadOS 26 SDK 以上上傳；專案產生完成不等於 IPA 已建製。[Apple SDK 門檻](https://developer.apple.com/news/?id=6lxhtioi)
4. Android 新 App 自 2026-08-31 起要 target API36 以上。AAB 仍需簽章、Play App Signing 與平台上傳。[Play target API](https://support.google.com/googleplay/android-developer/answer/11926878?hl=en-sg)
5. 若新開的是個人 Play 帳號，正式上架資格要至少 12 位測試者持續加入封閉測試至少 14 天，再申請 production access。沒有招募、測試證據或經過天數可以冒稱已達標。[官方測試要求](https://support.google.com/googleplay/android-developer/answer/14151465?hl=en)
6. 最終原生截圖、政策 URL 上線、內容分級、Families／隱私、上架地區與帳號擁有者確認仍要完成。既有 WebGL 截圖可當準備資料，但不標成已由原生 App 擷取的證據。[Apple 截圖規格](https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications/)、[Play 預覽素材](https://support.google.com/googleplay/android-developer/answer/9866151?hl=en-en)

這些阻擋不影響繼續完成 Android 包、iOS 原始專案、CI、素材與上述可檢查的送審資料。本包沒有替擁有者建立帳號、付費、填報或承諾法定身分。


