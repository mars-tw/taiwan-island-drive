# 飛機真實感與逐格 IMG 貼圖

`public/textures/flight-detail-atlas.png` 是本次用 **built-in image_gen** 新產出的 4×4、1254×1254 IMG 材質圖。原始 `aircraft.png` 保留。最終提示詞在 `generation-prompt.txt`；沒有使用 API CLI、手繪替代或外部品牌／商用素材。

16 格依序對應左右機身塗裝、翼面、冷卻進氣、鋁材、輪轂、胎紋、胎側、空白儀表板、皮革、織物、塑膠、舵面鉸鏈、起落架鋼材、防滑地板及玻璃微痕。`tile-map.json` 的每格列出真實 Blender face／loop 數、實際材質 UV 範圍、合併後物件與原始零件。每格邊界內縮 3%，Image Texture 真正連至 Principled Base Color；兩個 GLB 都內嵌完整 IMG。

機體改為細分平滑鼻罩與開孔座艙、NACA 厚度公式的機翼／尾翼剖面、圓胎與金屬輪轂、彈簧鋼及鼻輪支柱、門縫與窗框。座艙使用空白儀表板、實體螺絲、皮椅、55 mm 細織物貼片、防滑地板、小於 3 mm 的座椅縫邊及操縱桿。沒有靜態儀表數字；既有動態儀表與物理課程維持。

GLB 使用不同的金屬度、粗糙度、漆面 clearcoat 及玻璃 transmission／IOR／BLEND。透明玻璃 alpha 為 0.09，遊戲座艙再限制至 0.06，以保持前方視野。Three.js 加入本地 RoomEnvironment／PMREM 環境反射，不依賴外部 HDR 或網路；手機低／高畫質 DPR 上限仍是 1／1.6。

靜態零件依父節點與材質合併；PropellerRoot、六個舵面及座艙操縱桿保持獨立父節點與軸向。機體約 8 m 長、10 m 翼展、輪胎底部高度 0；GLTF Y-up／+Z 前向及既有座艙相機、面板、風擋位置均保留。

實際 CLI 匯出結果：機體 **49,870 triangles／28 draw calls**，座艙 **13,636 triangles／15 draw calls**，兩檔各內嵌一張 IMG。素材由 Blender 5.2 正式匯出，非只替換預覽圖。

`after.png` 是完整實體模型的 Blender render，並用作 `public/previews/flight.png`。`cab.png` 是實體座艙的文件剖視圖，僅為看清座椅及控制元件在 render 隱藏屋頂與玻璃；匯出的 GLB 保留屋頂與真正透明玻璃。兩張成品與原始 IMG 都已實際看圖驗證。

已從 GLB 二進位讀取 **43,839 個 UV vertices**，對照材料的 `extras.tile_id` 全數位於指定格內。Blender UV 以左下為原點，glTF 匯出以 `v = 1 - BlenderV` 保存；二進位驗收須換回 Blender V 再對照 `uvRect`。

已重開 `blender/flight/models.blend`，確認 40 個 mesh、1254² 圖片 packed、相對圖片路徑可解析。輸出移除私人絕對路徑及 PNG 文字 metadata，沒有改圖片像素。程式、IMG 與原創模型沿用專案 MIT 授權。

重新建立：

```sh
blender --background --factory-startup --python blender/flight/build_assets.py
```
