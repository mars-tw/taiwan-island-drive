# 手機方向盤

在手機開啟 [HTTPS 遊戲](https://mars-tw.github.io/taiwan-island-drive/)，進入「駕駛設定」點「手機方向盤」的「啟用」。開車時也可以點右上方的方向盤按鈕。

iPhone Safari 可能會詢問是否允許動作與方向存取，選擇允許即可。遊戲不會自動跳出權限提示，也不會儲存或傳送感測資料。Android 依瀏覽器設定，可能直接開始讀取感測器。

雙手握住手機，保持舒服的角度，第一筆有效資料會設為直行。左右傾斜手機就能轉向，右手仍按油門、煞車；也可繼續用觸控按鈕轉向。握持角度偏了，點「回正」把目前角度重新設為直行。改成橫放或直放後，會重新回正。

傾斜在 3 度內不轉向，約 25 度會到最大轉向。觸控左右鍵或鍵盤 A／D、←／→ 優先於手機方向盤。暫停或離開遊戲畫面會清掉轉向，繼續遊玩後會等新的感測資料。感測資料中斷時也會停止傾斜轉向。

若 5 秒內沒有收到有效資料，遊戲會提示原因並切回觸控操作。一般區網的 `http://192.168.x.x` 不符合感測器的安全來源要求，請使用 HTTPS 正式網址。瀏覽器不支援、權限未允許，或裝置沒有感測器時，仍能使用觸控與鍵盤。

## 實作與驗證

`src/tilt.js` 以 `gamma * cos(screenAngle) + beta * sin(screenAngle)` 將裝置軸轉到螢幕左右軸，回正後套用死區、上限及依時間計算的指數濾波。正轉向值代表畫面向右；跟車攝影機朝世界 +Z，因此駕駛物理的右轉對應世界 -X。

`tests/tilt.test.js` 檢查角度映射、回正、死區、邊界、不同頻率濾波、按鍵優先、權限拒絕、感測逾時、暫停與重新校準。`tests/physics.test.js` 用 Three.js 的真正攝影機投影檢查左／右輸入與畫面方向一致。

桌面瀏覽器的模擬事件只能驗證程式邏輯。iPhone 的系統權限視窗、實際握持感受與不同手機的感測器表現，仍需實體裝置驗證。

參考官方文件：[MDN：requestPermission](https://developer.mozilla.org/en-US/docs/Web/API/DeviceOrientationEvent/requestPermission_static)、[MDN：DeviceOrientationEvent](https://developer.mozilla.org/en-US/docs/Web/API/DeviceOrientationEvent)、[MDN：方向與動作資料](https://developer.mozilla.org/en-US/docs/Web/API/Device_orientation_events/Orientation_and_motion_data_explained)。
# 公開版瀏覽器驗證

啟用後等待正常權限回覆，再以模擬 `DeviceOrientationEvent` 校準。右傾 25 度時，平滑後轉向值約為 0.987；鍵盤左轉優先為 −1，放開後恢復傾斜轉向，回正歸零，暫停後感測不再影響轉向。這是瀏覽器模擬驗證，沒有宣稱已在實體手機驗收。

