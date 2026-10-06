# 公開手機版

2026 年 10 月 5 日，GitHub Pages 建置與部署通過。

- 遊玩：https://mars-tw.github.io/island-flight-school/
- 開源：https://github.com/mars-tw/island-flight-school
- 完整包：https://mars-tw.github.io/island-flight-school/downloads/flight-school-source.zip
- 首次成功流程：https://github.com/mars-tw/island-flight-school/actions/runs/37315410236

公開首頁、機身與座艙 GLB、完整 ZIP 均 HTTP 200。Chrome 390×844 驗證 modelLoaded=true、幼兒模式、無橫向溢出、正確的 Worker scope；斷網重新載入後，機身與座艙仍正常載入，console error 為 0。三款遊戲的 PWA 使用各自的快取名稱，切換版本不會清除另一版的離線模型。

飛行包含升力、阻力、失速及接地，幼兒輔助施加實際控制力矩；三課和兩組飛行設定已通過確定性控制器測試。起飛課不能用草地起飛或只推油門而未抬頭取得完成成績。這是兒童教學模型，沒有宣稱可替代實機訓練或已在實體手機量測效能。

公開前已讀回 Blender 模型與貼圖、確認 UV／內嵌 PNG、清理私人路徑及圖片 metadata，並保留完整授權。main 更新後會自動重新測試與部署；可使用 git revert 回復程式版本。
