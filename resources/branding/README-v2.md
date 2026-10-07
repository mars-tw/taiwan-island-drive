# 品牌圖檔 v2

兩張原稿於 2026 年 10 月 7 日由內建 image_gen 產生，圖案與字標已經 Root 視覺確認。1254×1254 圖示及 1983×793 透明字標保留原始 bytes；其餘尺寸只使用專案 sharp 做技術縮放，沒有重新設計或改圖。來源、尺寸與 SHA-256 見 manifest-v2.json。

執行 `node scripts/prepare-branding-v2.mjs` 可重建 v2 圖示、公開字標與 manifest。腳本從專案內原稿讀取，核對原始 SHA，只寫入明列的 v2 siblings，不改舊圖示或原稿。生成提示詞見 `docs/branding/imagegen-prompts-v2.md`。

網頁使用新的 versioned 圖示與首頁品牌圖案，原有圖示及 SVG 保留。iOS 新 TransportIconV2 asset set 及 Android 新 legacy／adaptive 圖示已接入原生工程；原有 native 圖示與 splash 保留。來源引用、尺寸與 SHA-256 見 native-icons-v2-report.json。

來源 `e580ef1` 已實際重建 v2 Android APK（39,339,054 bytes）、AAB（37,141,256 bytes）與 iOS 簽章 IPA（37,440,876 bytes）。Android 簽章、bundletool、69 個隨附檔案雜湊及 12 張編譯後 PNG 像素通過；完整證據見 `store/review/android-logo-v2-verification.json`。iOS run 37559519552 的簽章、profile、entitlements 與隨附資源通過，包內首頁圖示 PNG 與 Git source 相符，Info.plist 指向 TransportIconV2 並含 Assets.car；iOS 編譯後圖示像素仍未驗證。

新版原生媒體 run 37561855895 已成功，來源 `e580ef1`，四個實際 XCTest case 通過、0 失敗；Phone、Pad 的家長 gate 各三項取消斷言皆成立。原 PNG、manifest 與兩份結果 SHA 已核對，Root 已視覺覆核八張圖片，12 個公開來源檔案保存在 `store/screenshots/native-ios-logo-v2/`，見 [provenance](../../store/screenshots/native-ios-logo-v2/provenance.json)。新版八張已上傳並附加至 Apple 1.0.0 版本，Dynamic Island medium 四張、iPad 13 吋四張，縮圖均已確認，見 [上傳紀錄](../../store/review/apple-logo-v2-media-upload.json)。

先前 `7cd0d75` 的簽章 IPA／截圖與 `11ebddb` 家長 gate 證據仍保留原來源及雜湊，未改寫為新版。最新安裝包與公開 rc.2 測試版見 `docs/native-build-verification.md`；Apple 仍準備提交，已取得擁有者授權的共用 App Store Connect API key，安裝包仍待上傳。平台驗證、送審與後續狀態以 [App metadata](../../store/metadata/app.json)及[readiness](../../store/review/submission-readiness.json)為準，實體硬體驗收仍未完成。

Google v2 圖示、橫幅與三張 browser-emulated 截圖已儲存，11 項 App 設定、客服 email 與「廣告 ID＝否」已完成。AAB code 1／1.0.0／min API 24／target API 36 已上傳並處理接受，0 個錯誤，1 項缺少 deobfuscation 的資訊提示（`minify=false`）。Alpha 已選台灣一國，16 人白名單已建立並選用，15 項變更已正式送審，發布總覽顯示「變更項目正在審查中」。尚未核准，首個 release 不可測試；名單不代表實際加入，連續 14 天仍待累計，Android 硬體 QA 也未完成。最新狀態以 [Google Console 進度](../../store/review/google-console-progress.json)為準。
