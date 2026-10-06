# 完整 App 與商店資料包

原生 App 暫定名稱「島嶼交通學院」，1.0.0／build 1。Apple Bundle ID `tw.mars.islandtransport` 已註冊。

完整交付 ZIP：`release/island-transport-store-1.0.0.zip`。

| 位置 | 內容 |
| --- | --- |
| `android/island-transport-test.apk` | Android 可安裝測試版 |
| `android/island-transport-upload-signed.aab` | 已驗證上傳簽章的 Play 包，尚未提交 |
| `ios/IslandTransport-simulator.app.zip` | 真正建製的 Simulator App |
| `ios/IslandTransport-unsigned.xcarchive.zip` | 真正建製的 iOS 裝置封存，需 Apple 帳號簽章 |
| `source/island-drive-source.zip` | 全遊戲、Blender、Android／iOS 工程、資源、建置腳本與測試 |
| `store/` | 圖示、12 張尺寸合規的準備截圖、中英商店文字、政策、自評與 review notes |
| `docs/` | 原生建置、素材與上架流程證據 |

ZIP 排除簽章私鑰、密碼、SDK 本機路徑、build cache、試拍 audit 與遞迴下載包。原生 App 中也不塞 Blender 原檔或完整 source ZIP。

## 重建

```sh
npm ci
npm test
npm run native:build
node scripts/verify-native-package.mjs
npx cap sync
```

Android 用 JDK21 與 Android SDK36，執行 `android/gradlew -p android assembleDebug bundleRelease`。Windows 可執行 `scripts/prepare-android-tools.ps1` 安裝到獨立工具資料夾。Release signing 只讀 `ISLAND_UPLOAD_STORE_FILE`、`ISLAND_UPLOAD_STORE_PASSWORD`、`ISLAND_UPLOAD_KEY_ALIAS`、`ISLAND_UPLOAD_KEY_PASSWORD` 環境變數；不寫進工程或命令列。

iOS 用 macOS／Xcode26 以上，開啟 `ios/App/App.xcodeproj`，選擇擁有者的開發者 Team 才能做正式發佈。SPM dependencies 使用固定 Capacitor 8.5.2，其他插件版本鎖在 package-lock。

正式建立 App／上傳前，先讀 [商店送審說明](store-submission.md)及 `store/review/submission-readiness.json`。Apple／Google 帳號的身分、費用、合約及真實聯絡人仍由擁有者辦理，商店審核與上架尚未完成。

## Apple 簽章與手動上傳

2026-10-06 已在 Apple 官方會員頁核實會員啟用，Team ID 為 `93L76Q5PT8`。Bundle ID 與 App Store Connect App record 已註冊；Apple Distribution 憑證及此 App 的 App Store profile 已建立，`.p12` 已匯出至專案外的受保護資料夾。憑證／私鑰配對，以及 profile 的 App ID、Team、憑證與發行類型均已驗證。API 存取申請仍待使用者接受 Apple 的內部使用承諾，尚未建立 API key、建製簽章 IPA 或上傳平台。原本 `native.yml` 保留未簽章 CI；新增 `apple-release.yml` 只接受 main 分支的 `workflow_dispatch`。

目前正在建立只允許 main 分支、手動執行的 `apple-release` environment；本 repo 此前沒有該 environment 的保護設定，這次不涉及移除既有保護。把下列資料加入該 environment 的 encrypted secrets，不要把值寫進 repository、對話、workflow input 或 build log。

| Secret | 用途 |
| --- | --- |
| `APPLE_TEAM_ID` | 已核實的 Apple Team ID，非密鑰，但仍由 CI 設定注入 |
| `APPLE_DISTRIBUTION_P12_BASE64` | Apple Distribution 憑證及其對應私鑰的密碼保護 `.p12`，轉成 base64 |
| `APPLE_DISTRIBUTION_P12_PASSWORD` | 上述 `.p12` 的非空密碼 |
| `APPLE_APP_STORE_PROFILE_BASE64` | 同 Team、explicit `tw.mars.islandtransport`、包含上述憑證的 App Store Connect profile，轉成 base64 |
| `APP_STORE_CONNECT_API_KEY_BASE64` | 可選；App Store Connect team API key 的原始 PEM `.p8` 轉成 base64 |
| `APP_STORE_CONNECT_KEY_ID` | 可選；對應 API Key ID |
| `APP_STORE_CONNECT_ISSUER_ID` | 可選；對應 team API Issuer ID |

前四項用於簽章建製；後三項只有 `validate`／`upload-testflight` 需要。API key 用於平台認證，不能替代 distribution certificate 的私鑰。選擇具備此 App 上傳權限的 API role，勿授予不必要的帳號管理權限。[Apple API key](https://developer.apple.com/documentation/appstoreconnectapi/creating-api-keys-for-app-store-connect-api)、[Apple provisioning profile](https://developer.apple.com/help/account/provisioning-profiles/create-an-app-store-provisioning-profile)

手動 workflow 有三個模式：

- `build-only`：預設。使用 runner 實際安裝並驗證的穩定 Xcode，產出簽章 IPA，做本機簽章、Team、bundle ID、版本／build、profile、entitlements、隱私 manifest 與內嵌遊戲資源檢查；不向 Apple 驗證或上傳。官方 runner manifest 查核及 SPM 套件建製可能使用網路。
- `validate`：產生相同 IPA，重新核對簽章與檔案 SHA-256，再用 Xcode 內建的 Apple `iTMSTransporter -m verify -assetFile` 向 Apple 驗證；不執行 upload。
- `upload-testflight`：必須明確選取。先完成上述驗證，再執行 `iTMSTransporter -m upload -assetFile`。選用一般 App Store Connect export，`testFlightInternalTestingOnly=false`，可供後續正式送審。

工具選擇先檢查有效的 `DEVELOPER_DIR`，再檢查 runner 的 `xcode-select -p`；若不合格，才逐一檢查 `/Applications/Xcode*.app`。每個候選都要實際執行 `xcodebuild -version` 與 iPhoneOS SDK 查詢，Xcode 與 SDK 主版本均須至少 26，版本／build 配對須在官方穩定 runner 清單內；路徑、版本輸出或 App metadata 含 Beta／RC／preview 的候選拒絕使用。官方清單暫時無法取得時，使用 2026-10-06 已查核的穩定配對；未知 build 不會自行標為通過。選定工具以 `GITHUB_ENV` 傳給同 job 的 signer／uploader，報告記錄實際版本、build、SDK，IPA compiler build 也會核對。[Apple SDK 門檻](https://developer.apple.com/news/?id=6lxhtioi)、[官方 macOS runner manifest](https://github.com/actions/runner-images/blob/main/images/macos/macos-26-Readme.md)

輸入 `marketing_version` 與正整數 `build_number`；預設 `1.0.0`／`1`，每次 Apple 已接受的上傳都要增加 build number。只修改 CI 暫存副本的 App target signing／版本，不改原工程或把 App profile 套到 SPM framework targets。這裡沒有啟用 automatic signing，也不讓 CI 自動建立憑證、profile 或 API key。

成功簽章後的 artifact 只含 `IslandTransport.ipa`、`verification.json`，以及實際平台操作成功才產出的 `platform-result.json`。IPA 依法定發行格式含 `embedded.mobileprovision`；**不額外發布 profile 檔、`.p12`、`.p8`、keychain、archive、ExportOptions 或原始私密 log**。腳本用 `umask 077`、停用 shell tracing、temporary keychain／profile 與 EXIT／INT／TERM trap 清除。強制終止 runner 時依 GitHub 臨時 runner 的生命週期銷毀；禁止自行公開 runner diagnostics 或原始私密 log。

`platform-result.json` 的 `upload_accepted_processing_unverified` 只代表 Apple 上傳命令回傳成功。要在 App Store Connect 核實 processing 完成、TestFlight build 可用及實機測試，再選取該 build 送 App Review；腳本不會自動送審、公開發佈、改 metadata 為成功，也不會建立測試者或寄邀請。[Apple 上傳／處理流程](https://developer.apple.com/help/app-store-connect/manage-builds/upload-builds/)、[Transporter 官方參數](https://help.apple.com/itc/transporteruserguide/en.lproj/static.html)、[Internal Only 的限制](https://developer.apple.com/help/app-store-connect/test-a-beta-version/add-internal-testers/)

### CSR 與憑證來源

建議在擁有者控制的 Mac 透過 Keychain Access 建立 CSR；只把 CSR 提交 Apple，下載 Apple Distribution `.cer` 後與同一把私鑰配對，再匯出密碼保護 `.p12`。[Apple 官方 CSR 流程](https://developer.apple.com/help/account/certificates/create-a-certificate-signing-request)

若先在 Windows 製作，可用可信 OpenSSL 在**專案外的受保護本機資料夾**產生加密 RSA 2048-bit 私鑰及 CSR。下列指令保留作為重建範例，實際身分由本人在 prompt 輸入：

```sh
openssl genpkey -algorithm RSA -aes-256-cbc -pkeyopt rsa_keygen_bits:2048 -out apple-distribution-private.pem
openssl req -new -sha256 -key apple-distribution-private.pem -out apple-distribution.csr
```

只上傳 `.csr`；私鑰保留本機。收到 Apple `.cer` 後，可在受控 Mac 匯入配對 key／certificate，再由 Keychain Access 匯出 `.p12`；或用 OpenSSL 將 DER `.cer` 轉 PEM，配同一把加密私鑰匯出 `.p12`，以互動式 prompt 設定輸出密碼，不把密碼放命令列。普通 `.cer` 只有公鑰，無法單獨簽章。不要用 GitHub artifact 傳遞私鑰／`.p12`；本 workflow 僅從已存在的 encrypted secrets 匯入，不提供 CI 產生私鑰或私鑰匯出功能。

Apple 的 Xcode Organizer 另支援 cloud-managed signing，與本 CI 採用的手動 `.p12`／profile 路線不同；要改用 cloud signing 應另外驗證流程，不能把現有 unsigned archive 宣稱為已完成簽章。[Apple cloud signing](https://developer.apple.com/help/account/certificates/cloud-managed-certificates)
