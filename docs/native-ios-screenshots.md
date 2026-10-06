# 原生 iOS simulator 截圖

`native-ios-screenshots.yml` 是 main-only、macOS 15 的手動 workflow，不引用 secrets、不簽 App Store 發行包，也不上傳商店。執行前須由 Root 與獨立覆核確認；本實作尚未啟動 simulator CI，不宣稱已擷取或實機測試。

流程沿用已驗證的 stable Xcode selector，打包既有本地資源，在暫存 iOS project 加入獨立 XCTest UI target，再真正 boot／install／launch simulator App。測試從現有 accessibility labels 進入大廳、汽車、火車、飛機，使用 `XCUIScreen.main.screenshot()` 取得原生 WKWebView 所在螢幕，不注入 JavaScript、不合成 UI，也不改 production source／project。暫存 project 使用本地 simulator ad-hoc signing，不需要開發者帳號或私鑰。

每種裝置保存四張原圖、相同尺寸的無 alpha RGB PNG 與 `.xcresult` 截圖 attachment。優先 iPhone 16 Pro／17 Pro 的 1206×2622；若該型號沒有安裝，可選官方接受的大尺寸 Pro Max。iPad 固定要求 13 吋 M4／M5 的 2064×2752。驗證器拒絕錯誤尺寸、alpha、缺圖或失敗的 capture test，不會縮放圖片來讓檢查通過。[Apple 截圖規格](https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications)

家長關卡另外測試「取消」後設定未開啟、再次請求仍需要驗證；只有最後斷言後寫出的 `parent-gate-result.json` 三個布林旗標全部為 true，才可在 manifest 記為通過。缺證據或失敗時仍保留成功擷取的畫面，但不把家長測試標為通過。這不取代錯誤答案、外部連結、離線網路、感測與真實裝置驗收。

CI 的獨立 venv 固定使用 Pillow 12.3.0，真正解碼 PNG 像素、驗證 IDAT／chunk、拒絕截斷或全色空白畫面，不重寫 captured files；這些 raster 檢查不能證明 3D 模型可見或畫面品質，因此 `visualApprovalPending` 仍是 true。[Pillow 官方套件](https://pypi.org/project/pillow/12.3.0/)、[Image verify／load](https://pillow.readthedocs.io/en/stable/reference/Image.html)

輸出在 `output/native-ios-screenshots/`，包含實際 source commit、native 1.0.0／build 1、Xcode／SDK、runtime／device、原圖與提交圖 SHA-256、二進位 SHA-256、UI test 結果。`hardwareTest` 與 `storeUploaded` 永遠是 false；`visualApprovalPending` 保留 true，需看圖核對模型、排版及未截掉的操作按鈕，才交商店使用。發生 UI accessibility 或 simulator 不可用時，保留錯誤及 `.xcresult`，不冒稱 native proof 成功。

暫存 target 由官方 CocoaPods `xcodeproj` 1.27.0 Ruby gem 建立，只用於 CI 工程操作，不加入 App dependencies。[維護者文件](https://github.com/CocoaPods/Xcodeproj)、[固定版本](https://rubygems.org/gems/xcodeproj/versions/1.27.0)、[Apple screenshot API](https://developer.apple.com/documentation/xcuiautomation/xcuiscreenshot/pngrepresentation)
