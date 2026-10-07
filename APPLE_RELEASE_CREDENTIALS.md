# Apple 發佈憑證索引

最後核實：2026-10-07。這份文件只記識別資料、用途與狀態，可以隨開源專案提供；私鑰與密碼另存擁有者的中央憑證庫。

| 項目 | 記錄 |
| --- | --- |
| App | 島嶼交通學院／Island Transport Academy |
| Apple Team ID | `93L76Q5PT8` |
| Bundle ID | `tw.mars.islandtransport` |
| App Store Connect App ID | `6819605203` |
| 發佈憑證 | Apple Distribution，ID `Z84267GALZ`，2027-10-06 到期 |
| 此 App 的 profile | `IslandTransport AppStore 2026`，ID `72BF4FK9YQ`，App Store 發行類型 |
| 共用 API key | `MARS Games Publisher`，Key ID `VF9WTT4UYT`，App Manager 角色，同團隊所有 App 可用 |
| 舊 API key | `IslandTransportCI`，Key ID `N5VT3WW79X`，Developer 角色，原私鑰未取得、未撤銷 |
| API Issuer ID | `fb4c067e-4edd-4625-a4f6-2f0147064981` |

## 現在可用的部分

Distribution 憑證、配對私鑰與此 App 的 profile 已核對。密碼保護的 `.p12` 及 profile 保留在專案外的受保護位置；CI 簽章資料已存於本儲存庫的 GitHub Actions `apple-release` environment。

| Secret 名稱 | 狀態 |
| --- | --- |
| `APPLE_TEAM_ID` | 已設定 |
| `APPLE_DISTRIBUTION_P12_BASE64` | 已設定 |
| `APPLE_DISTRIBUTION_P12_PASSWORD` | 已設定 |
| `APPLE_APP_STORE_PROFILE_BASE64` | 已設定 |
| `APP_STORE_CONNECT_API_KEY_BASE64` | 已加密設定，來自中央共用金鑰 |
| `APP_STORE_CONNECT_KEY_ID` | 已設定為共用 key 識別資料 |
| `APP_STORE_CONNECT_ISSUER_ID` | 已設定為同團隊 issuer |

Apple 舊 key 的 `.p8` 未取得，因此保留為歷史紀錄。擁有者另已明確授權建立 `MARS Games Publisher`、授予 App Manager 角色，並保存中央供所有遊戲使用。共用私鑰已取得、核對為 P-256，並將本專案所需的三項上傳 Secrets 加密設定完成；舊 key 未撤銷。平台驗證及上傳結果另見上架紀錄。

中央保存參照：簽章資料為 `<owner-private-vault>/island-transport/apple`，共用 API 私鑰為 `<owner-private-vault>/game-store-publisher/apple`。本文件不含可用來簽章或登入的秘密。不要將 `.p8`、`.p12`、私鑰、密碼或中央憑證庫原文放進這個公開儲存庫或下載包。

## 其他遊戲能否沿用

同一 Apple 團隊的 **Team API key** 可以依其角色處理該團隊的其他 App；Apple 不支援把 Team key 限制成只可存取某一個 App。Developer 角色的可執行動作仍受權限限制。[Apple API 說明](https://developer.apple.com/help/app-store-connect/get-started/app-store-connect-api/)

同團隊有效的 Apple Distribution 憑證可以供其他 App 簽章，但每款遊戲仍需自己的 Bundle ID、App Store Connect App record 及相符的 provisioning profile。此專案的 profile 與驗證腳本綁定 `tw.mars.islandtransport`，不能直接拿來發佈另一款遊戲。[Apple 憑證說明](https://developer.apple.com/help/account/certificates/certificates-overview/)、[App Store profile](https://developer.apple.com/help/account/provisioning-profiles/create-an-app-store-provisioning-profile/)

Apple API key 不適用於 Google Play。其他遊戲需自行設定該儲存庫的發佈權限與加密 Secrets，不能因本文件存在就視為已設定完成。

## 建製與上傳

操作流程見 [native-package.md](docs/native-package.md)，建製與測試證據見 [native-build-verification.md](docs/native-build-verification.md)。Apple 1.0.0／build 1 已透過官方 API 完成傳送與處理，狀態為 `VALID`，並已綁定版本、提交 App Store 審查，目前為 `WAITING_FOR_REVIEW`；尚未核准。[API 上傳與送審證據](store/review/apple-api-submission-verification.json)保留原 CLI 超時及同一上傳作業的接續紀錄。

共用 Google API 也已實測能讀取 `tw.mars.islandtransport`，目前授權包含資訊、測試發佈及商店資料，沒有管理員、財務或正式發佈權限。此 App 的封閉 Alpha 已送審，16 人白名單仍須實際加入並滿足連續測試要求。[兩平台 API 核對](store/review/shared-api-verification.json)記錄實際能力；私鑰與 service-account 檔案保留中央。新 LOGO 的原生套用見 [LOGO 文件](docs/branding/README.md)。

共用工作後續已使用同一 Google 服務帳戶，完成另外 12 款遊戲的內部測試 validate／commit，沒有擴權。先前一次 403 保留為歷史紀錄；不能再據此判定共用服務帳戶缺少驗證或提交能力。島嶼已送審的封閉測試未因此新增 edit、重傳或更換名單；共用 20 人預設留待後續測試版本使用，正式發布權限仍另行確認。
