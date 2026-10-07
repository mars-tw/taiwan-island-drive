# LOGO v2 生成紀錄

2026-10-07，使用 Codex 內建 `image_gen`，未使用付費 API CLI。以下為實際送出的完整提示詞。

## App 圖示

生成原圖完整保留為 `resources/branding/game-logo-v2-master.png`。輸出尺寸以素材 manifest 的實際檢查為準；商店及 PWA 尺寸另以 Sharp 做技術縮放。

```text
Use case: logo-brand. Asset type: final mobile game app icon, square 1024 x 1024, opaque RGB-style background. Design an original polished premium emblem for Island Transport Academy (島嶼交通學院), an open-source Taiwan-themed car, train and airplane game for children aged 3–5 and parents. One cohesive compact composition readable at 64px: a friendly coral-orange small car, a silver and turquoise commuter train with a clean rounded front, and an ivory high-wing propeller training airplane, arranged together around a simplified emerald Taiwan-shaped island. A single elegant cream road and rail curve integrates the vehicles and island. Refined 3D enamel / model-making look with soft beveled surfaces, clean silhouettes, small realistic windows and tasteful restrained highlights; premium, welcoming and playful. Use existing brand palette deep petrol teal #173d47, mint #a6ddd0, warm cream #f3efdf, muted golden yellow #efc76c, coral. Deep teal background fills the entire square, subtle soft depth, generous edge clearance for Apple masking. The island and three vehicle silhouettes must remain the clear focal point, no busy scenery. No typography, letters, numbers, badges, frame, border, watermark, store logos, copyrighted vehicle brands, or rounded-corner outer mask. Finished production app artwork, not a presentation sheet, no device mockup.
```

## 透明字標

以第一張 App 圖示作為 identity reference，`transparent_background: true`。生成原圖完整保留為 `resources/branding/game-wordmark-v2.png`，保留 alpha。

```text
Use case: logo-brand. Create the final horizontal transparent logo lockup for the Taiwan children's transport game, using the referenced image as the locked identity of its emblem. Preserve the Taiwan island, coral car, silver-turquoise train and ivory high-wing propeller plane, with the same premium friendly 3D miniature aesthetic and colors. On a genuinely transparent canvas, place a compact clean isolated emblem on the left (remove the square teal backdrop, keep the emblem silhouettes and internal road/rail). On the right, large impeccably readable Traditional Chinese lettering exactly: 「島嶼交通學院」 (six characters, 島 嶼 交 通 學 院), in a refined rounded bold dark petrol-teal typeface. Under it a smaller well-spaced line exactly: "ISLAND TRANSPORT ACADEMY". A wide 2.5:1 horizontal balanced composition with generous transparent breathing room; clear app brand identity, crisp shapes, clean typography, polished output suitable for game splash screen and website header. Do not add slogans, mockup devices, presentation boards, watermark, unrelated graphics, or any other text.
```
