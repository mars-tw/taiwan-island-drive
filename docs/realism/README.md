# IMG 逐格貼圖與運輸工具真實感

更新日期：2026 年 10 月 6 日，版本 2.1.0。

使用內建 ImageGen 實際生成三張 1254×1254、4×4 材質 atlas。圖片平分為 16 格，車身與機身、接縫、玻璃、機械金屬、輪胎、布料等材質各有指定格。Blender 逐 polygon／loop 寫入對應 UV 範圍，加入 3～4% 格內留白以減少相鄰格取樣。材質貼圖不是背景照或模型外的告示板。

| 系列 | 來源圖片 | 逐格對照 | 最終提示詞 |
| --- | --- | --- | --- |
| 汽車 | `public/textures/car-detail-atlas.png` | [car/tile-map.json](car/tile-map.json) | [car/atlas-prompt.txt](car/atlas-prompt.txt) |
| 火車 | `public/textures/train-detail-atlas.png` | [train/tile-map.json](train/tile-map.json) | [train/imagegen-prompt.txt](train/imagegen-prompt.txt) |
| 飛機 | `public/textures/flight-detail-atlas.png` | [flight/tile-map.json](flight/tile-map.json) | [flight/generation-prompt.txt](flight/generation-prompt.txt) |

GLB 中的圖片與源 PNG 逐 bytes 相符，透明玻璃使用 BLEND 材質。不同格具有對應的粗糙度與金屬參數，內部沒有印固定速度或讀數；教學儀表仍由運行中的遊戲更新。

## 實際更新

- 汽車四車都使用 16 格：空心座艙、座椅、方向盤、薄透明玻璃、車身曲面、胎紋、燈具與輪圈。BodyPaint 四個漆面材質保留 IMG，選色後仍可看到圖片細節。
- 火車使用一致車身高度投影對齊車身與門板條帶，補門縫、窗框、車頭、台車與集電弓；將地板與布料分成細格 UV，防止菱形或織紋被拉成巨大的圖案。兩個控制桿可動畫。
- 飛機採更平滑鼻罩與翼型、三點圓胎、輪轂、門縫、皮革與細織物。螺旋槳、副翼、襟翼、升降舵與方向舵的原父階／pivot 保留。室內框柱使用金屬與塑料，沒有把機身色帶誤貼在座艙柱上。
- 火車與飛機加入 PMREM 環境反射，金屬與玻璃的光線反應更清楚；省電模式仍使用 DPR 1。

## 確定性驗收

`node scripts/verify-vehicle-surfaces.mjs` 直接解析 GLB 的 JSON／BIN chunk、材質、PNG 與 TEXCOORD accessor。共檢查八個運輸工具／座艙模型、270,107 個 UV 頂點，全部位於指定格內；每系列使用 16／16 格，每個 GLB 只嵌入一張圖片，雜湊與源圖相符，28 個必要控制節點存在。cab 可使用材質子集，外觀與 cab 合計涵蓋全部格。

完整 [verification.json](verification.json) 包含每格實際三角形、UV 數量、材質、透明玻璃與模型大小；不是只依圖面標籤宣稱貼圖完成。GLB 的 V 值轉換成 Blender 的 `1−V` 後比對，容差為 0.0001。

三份 Blender 原始檔都已實際重開，packed 圖片及相對路徑有效，私人資料夾路徑已清理。60 項原有玩法與整合測試通過；圖片與模型更新沒有更換飛行、列車或汽車的物理參數。

## 視覺與手機尺寸驗收

Blender 成品圖與座艙圖已逐一開啟檢查：汽車 [car/after.png](car/after.png)、火車 [train/after.png](train/after.png)／[座艙](train/cab-after.png)、飛機 [flight/after.png](flight/after.png)／[座艙](flight/cab.png)。桌面與 390×844 手機尺寸瀏覽器另檢查模型載入、換色保留 IMG、操作桿與動態讀數、透明風擋及正常課程操作。這些是瀏覽器模擬驗收，沒有宣稱已在實體手機量測 FPS。
