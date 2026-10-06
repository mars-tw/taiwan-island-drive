# 飛機世界與鏡頭更新

飛行世界改為四個 36×36 公里原創台灣景觀場景，世界 x／z 邊界都是 −18,000～18,000 公尺。花東海岸、縱谷、澎湖離島及都會河岸各有不同海岸、山脈與聚落分布。這是台灣景觀啟發的原創縮尺練習場，沒有使用真實導航地圖或宣稱對應實際航空地標座標。

地表使用 21,025 個頂點的平滑高程網格，取代原本的山體 cone。高度依山脊、谷地、低地與海岸過渡計算，包含近岸淺色水域、深海色、動態小幅海面波紋、田區、道路、河流、橋梁、城鎮與林冠。採低飽和材質、日光與距離霧，保留既有 GLB 表面及反射環境。

每張圖都有主機場和兩個可辨識的次機場。主跑道仍為 x=0、z=0～1,800 公尺，次機場位於（−7,600，8,000）和（8,500，−7,500），跑道各為 1,000／1,100 公尺；航站樓、塔台、跑道標線與燈光皆為 3D 物件。

三個觀光目的地直接讀取 `flight-plans.js` 的 `getFlightTargets('tour', map)`，各有對應的真 3D 場景：燈塔、港口與碼頭、玄武岩柱島、河灣公園、農莊或觀景塔。兩個郵件目標也有實際郵箱與送達區。`activityLandmarks` 回傳它們的名稱、種類與位置，不以空中標記取代場景內容。

空中導航、星星、投遞區、觀光與返航標記使用 `mission.targets`、`target`、`passed`、`visited`；已通過的點會隱藏，當前點以顏色區別。落下的包裹依 `mission.activeParcel.position` 的實際位置繪製，不修改包裹或飛機的物理狀態。

田區、建物、機場設備、樹木、碼頭及景點按材質使用 `InstancedMesh`；林冠有兩層 LOD。素材為小型程式網格、頂點色與 Canvas 標線／窗格，不下載大型衛星圖或新的數百 MB 素材。手機低畫質使用 DPR 上限 1，關閉陰影；高畫質保留 DPR 上限 1.6，貼近地面時使用跑道陰影。四場景手機直向尺寸的瀏覽器量測，完整高畫質飛行 draw calls 約 120～130，平板尺寸與橫向視野分別量到 138／148，包含既有飛機、透明材質與任務標記；實際值由 `renderer.info` 回傳，沒有以場景物件數冒充 GPU draw 數。

`resize()` 完全依 `canvas.parentElement.clientWidth/clientHeight`，由 `ResizeObserver` 監看舞台；手機旋轉或 UI 改變舞台大小都會更新相機比例。零尺寸或隱藏舞台會保留上一個有效尺寸，不使用整個視窗大小當成舞台尺寸。

追蹤鏡頭使用航向決定後方位置，航向 0 的前方是 +Z，因此鏡頭位於飛機後方 −Z。模型 bounds 在 GLB 加入飛機群組之前計算，避免把世界位置當成 local bounds 再加一次。鏡頭距離同時依水平／垂直 FOV 和模型尺寸計算，保持全機可見，鏡頭高度也避開地表。座艙位置與螺旋槳、襟翼、方向舵、升降舵和副翼動畫保留。

手機選單依 `.brand` 的實際位置，將飛機放進標題下方、課程卡片上方的展示區。390×844 的實測選單全機 bounds 約落在 x79～311、y145～277；飛行時舞台為 390×553，全機在舞台內且在正確深度，操作與提示位於舞台外。

驗收 API：

```js
window.__flightSchool.game.world.extent
window.__flightSchool.game.world.landmarks
window.__flightSchool.game.world.terrainHeight(x, z)
window.__flightSchool.game.world.getFraming()
window.__flightSchool.game.world.getDebugState()
```

`getFraming()` 回傳 viewport、canvasRect、相對舞台的 pixel bbox、絕對畫面 bbox、visible、contained、inDepth。為包含動畫舵面與旋轉槳，採 GLB 模型 bounds 加 0.22 公尺安全範圍，屬保守邊界。`getDebugState()` 另提供場景邊界、landmarks、activityLandmarks、地形頂點數、實例數、geometryTriangles、drawCalls、renderedTriangles、任務標記數和包裹是否可見。

768×1024 平板實際舞台為 768×708，844×390 橫向手機舞台為 660×271；兩者的 visible、contained、inDepth 都為 true。

本次驗證包含四場景的 36 公里邊界、每張圖三個景點加兩個郵箱、真實模型載入、手機追蹤鏡頭完整 containment、選單展示區與橫直旋轉。Node 語法檢查通過，Chromium 主控台沒有 JavaScript 錯誤。截圖：`flight-world-phone-menu.png`、`flight-world-phone-active.png`、`flight-world-tablet-active.png`、`flight-world-landscape-active.png`。

本更新沒有修改飛行物理、分數、課程、助飛或 UI 來源。`terrainHeight` 提供給助飛控制讀取前方地形，透過既有實際操控爬升；地景採原創設定。
