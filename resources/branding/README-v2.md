# 品牌圖檔 v2

兩張原稿於 2026 年 10 月 7 日由內建 image_gen 產生，圖案與字標已經 Root 視覺確認。1254×1254 圖示及 1983×793 透明字標保留原始 bytes；其餘尺寸只使用專案 sharp 做技術縮放，沒有重新設計或改圖。來源、尺寸與 SHA-256 見 manifest-v2.json。

執行 `node scripts/prepare-branding-v2.mjs` 可重建 v2 圖示、公開字標與 manifest。腳本從專案內原稿讀取，核對原始 SHA，只寫入明列的 v2 siblings，不改舊圖示或原稿。生成提示詞見 `docs/branding/imagegen-prompts-v2.md`。

網頁使用新的 versioned 圖示與首頁品牌圖案，原有圖示及 SVG 保留。iOS 新 TransportIconV2 asset set 及 Android 新 legacy／adaptive 圖示已接入原生工程；原有 native 圖示與 splash 保留。來源引用、尺寸與 SHA-256 見 native-icons-v2-report.json。已簽章 IPA 與已上傳原生截圖仍屬先前版本，未包含 v2；新商店圖示未上傳，原生安裝包須重新建製。
