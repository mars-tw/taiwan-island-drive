# 火車材質與幾何真實感更新

新素材為 `public/textures/train-detail-atlas.png`，由 Codex built-in `image_gen` 真正產生，經看圖驗證後複製到專案。原始像素沒有用 Python 或 Canvas 替代；製作時只移除 PNG 非像素 metadata。完整生成提示詞在 `imagegen-prompt.txt`，來源與摘要在 `provenance.json`。

圖片包含 4×4 個材質區域。Blender 的 Image Texture 真正接到 Principled Base Color。每個部件的各面 loop UV 指向其語意材質格，不把整張 atlas 貼到每個物件。`tile-map.json` 記錄 16 格各自的 `tileId`、row、column、label、Blender `uvRect`、faceCount、loopCount、objects，以及每個物件的實際 UV 範圍。材質 extras 的 `tile_id`／`tileId` 也匯入 GLB。

車身左右側、門片與車頭共用世界 Z 的條帶映射；長側面切成真實小面板，避免螺絲被拉成長條。門片針對原生成圖的條帶位置有小幅 UV affine 校正，不改動圖片像素。玻璃使用第 16 格，保留 Image Texture 和低 alpha 的真透明材質；駕駛艙正前方視野與動態儀表仍可看見。

模型更新包括弧形車頭、門縫與橡膠框、側窗墊條、分段金屬車頂、轉向架懸吊細節及銅接觸條。駕駛艙窗柱使用第 6 格鋁材，避免把車身塗裝條帶套在內裝窗框。地板切成約 24 公分 UV 格，讓防滑菱形呈現約 3～5 公分；座椅大面局部細分並逐面重複布料格，讓織紋保持毫米尺度。靜態部件按材質合併，兩個控制桿的名稱與父子座標保留。

GLB 仍採公尺、Y 向上、Z 車頭朝前。車體約 3×20 公尺、輪緣地面為 0，DriverAnchor 保留 `(0,2.3,8)`。獨立駕駛艙攝影機契約為 `(0,1.35,-1)` 看向 +Z。動態儀表由程式實際繪製，atlas 中沒有刻印儀表數值。

`after.png`、`cab-after.png` 是 Blender 真渲染；`browser-cab.png`、`browser-exterior.png` 是實際遊戲 WebGL 畫面。Three.js 加入 RoomEnvironment 的 PMREM 反射環境，保留原高畫質 DPR 上限 1.6 和低畫質上限 1。

驗證指令：

```sh
blender --background --factory-startup --python blender/train/build_assets.py
node docs/realism/train/verify-uv.mjs
blender --background blender/train/models.blend --python docs/realism/train/reopen-verify.py
```

UV 驗證讀取 GLB 的真實 FLOAT accessor；glTF V 轉回 Blender V 後檢查每個頂點都在對應 crop 內。`glb-uv-verification.json` 記錄結果；`blend-reopen.json` 記錄重新開啟 `.blend` 後的 packed 圖片、相對路徑及控制桿。所有 16 格都在車體 GLB 實際使用，兩個 GLB 各內嵌一張 atlas。

此更新只修改火車資產與反射材質環境，沒有修改物理、分數、課程、共用設定或導覽。程式、原創幾何與本次生成材質沿用專案 MIT 授權，不含第三方火車照片、商標或人物肖像。
