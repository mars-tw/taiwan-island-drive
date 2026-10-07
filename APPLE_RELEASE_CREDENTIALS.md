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
| 既有 API key | `IslandTransportCI`，Key ID `N5VT3WW79X`，Developer 角色 |
| API Issuer ID | `fb4c067e-4edd-4625-a4f6-2f0147064981` |

## 現在可用的部分

Distribution 憑證、配對私鑰與此 App 的 profile 已核對。密碼保護的 `.p12` 及 profile 保留在專案外的受保護位置；CI 簽章資料已存於本儲存庫的 GitHub Actions `apple-release` environment。

| Secret 名稱 | 狀態 |
| --- | --- |
| `APPLE_TEAM_ID` | 已設定 |
| `APPLE_DISTRIBUTION_P12_BASE64` | 已設定 |
| `APPLE_DISTRIBUTION_P12_PASSWORD` | 已設定 |
| `APPLE_APP_STORE_PROFILE_BASE64` | 已設定 |
| `APP_STORE_CONNECT_API_KEY_BASE64` | 尚未設定：缺少 `.p8` |
| `APP_STORE_CONNECT_KEY_ID` | 尚未設定 |
| `APP_STORE_CONNECT_ISSUER_ID` | 尚未設定 |

Apple 已把既有 API key 標示為下載過，但實際 `.p8` 未取得，因此此 key 尚不能供 CI 上傳使用。擁有者已授權以 Chrome 建立替代 Developer key、下載並加密保存；目前仍待擁有者完成 Chrome 的 Apple 登入驗證。取得新 key 後，應更新這份索引及中央紀錄；保留必要的替代與撤銷紀錄。

中央保存參照：`<owner-private-vault>/island-transport/apple`。本文件不含可用來簽章或登入的秘密。不要將 `.p8`、`.p12`、私鑰、密碼或中央憑證庫原文放進這個公開儲存庫或下載包。

## 其他遊戲能否沿用

同一 Apple 團隊的 **Team API key** 可以依其角色處理該團隊的其他 App；Apple 不支援把 Team key 限制成只可存取某一個 App。Developer 角色的可執行動作仍受權限限制。[Apple API 說明](https://developer.apple.com/help/app-store-connect/get-started/app-store-connect-api/)

同團隊有效的 Apple Distribution 憑證可以供其他 App 簽章，但每款遊戲仍需自己的 Bundle ID、App Store Connect App record 及相符的 provisioning profile。此專案的 profile 與驗證腳本綁定 `tw.mars.islandtransport`，不能直接拿來發佈另一款遊戲。[Apple 憑證說明](https://developer.apple.com/help/account/certificates/certificates-overview/)、[App Store profile](https://developer.apple.com/help/account/provisioning-profiles/create-an-app-store-provisioning-profile/)

Apple API key 不適用於 Google Play。其他遊戲需自行設定該儲存庫的發佈權限與加密 Secrets，不能因本文件存在就視為已設定完成。

## 建製與上傳

操作流程見 [native-package.md](docs/native-package.md)，已完成的建製與測試證據見 [native-build-verification.md](docs/native-build-verification.md)。簽章 IPA 已產生，但 Apple 平台驗證、App 上傳、送審與核准仍未完成。新 LOGO 的原生套用與建製狀態另見 [LOGO 文件](docs/branding/README.md)。
