# App Review Notes — 2.7.0 update draft

PREPARED, 2026-10-16. Existing app: Island Transport Academy, Bundle ID tw.mars.islandtransport (App ID 6819605203 per supplied local rejection record). This draft has not been sent to Apple. Native source build number: 3; confirm availability before signing.

## English

This is an update to our existing children's transport academy, not a new app. We incorporated the passenger quantity lesson from our open-source Taiwan Train Math project into one continuous academy mission. We do not propose resubmitting Taiwan Train Math separately.

Reviewer path: launch → tap the central mission button → begin train math → add 5 passengers → confirm → move 1 passenger to the rear carriage → confirm → choose 4 → hand off the dispatch sheet to the train lesson. Prepare the train, start, request stop assistance, open the doors once stationary, wait for boarding, and close the doors. Next-chapter buttons proceed to a 360-metre coastal drive and a two-star flight lesson, ending with the shared student badge. Wrong answers do not deduct progress. There is no login, payment, countdown or hidden reviewer mode.

The actual front-carriage quantity appears in the train lesson. Math unlocks mainline train, train unlocks road, and road unlocks flight. All chapters share one canonical student save, star wallet and achievements; the earlier 12 outings and safety-observation course remain as practice. Existing progress is migrated without deleting original compatibility snapshots.

Parent settings requires a parental gate. Only there can a parent select a local Taiwan Train Math JSON backup. The quantity lesson can resume; unrelated historical lessons remain verbatim, not playable migrated content. Cross-app sandbox data is not read automatically. No advertising or analytics SDK was added. There are no purchases, rating requests, external links or online accounts in the game. Native content is bundled for offline play.

The app uses Capacitor and Three.js. Integration code remains MIT; the quantity model is Apache-2.0 with full LICENSE and NOTICE bundled. Original educational text is attributed under CC BY 4.0. No source photographs or artwork were imported. Existing transport content sharing is disclosed in the local shared-assets audit.

Evidence limitations: screenshots and regressions are local headless Chromium and web/native web-payload builds, not hardware captures or child beta evidence. A signed binary, device recordings, genuine parent/child feedback, final privacy/SDK audit, existing lobby-music rights confirmation and the account holder's proof of content-provider/direct-submitter relationship remain required. We do not claim approval or invent testers, feedback or ownership evidence.

## 中文對照

本次更新既有兒童交通學院，把小小列車長的乘客數量課移入一條主線，不新建或獨立重送小小列車長。

審查路徑：啟動→主線大按鈕→列車數學教學→上車 5 人→確認→後車分 1 人→確認→答 4→交接調度單進火車課。準備、前進、停車輔助，停穩後開門等上車再關門。下一章是 360 公尺公路與兩星飛行，最後收學生證徽章。錯答不扣進度，沒有登入、付費、倒數或隱藏審查模式。

前車人數帶入火車課，數學、接客、公路與飛行逐章解鎖；共用學生證、星星與成就。原 12 關與安全課仍可練習，舊資料不刪除。家長關卡後選本機 JSON，只有拆合可續玩；其餘歷史留原文，不自動讀另一 App 沙盒。

未新增廣告或分析 SDK；沒有內購、評分、外連或會員。原生內容本機打包。沿用 Capacitor／Three.js，主程式 MIT，移植模型 Apache-2.0，完整 LICENSE／NOTICE 隨包，教育文字 CC BY 4.0；未匯入來源照片或圖像。

證據為無頭 Chromium 和 web payload，不是手機硬體、兒童 beta 或新簽章包。正式送審前仍需真機錄影、親子實測與回饋、最終 SDK／隱私稽核、既有音樂權利及帳號持有人內容／提交關係證明。不保證過審或虛構測試者。
