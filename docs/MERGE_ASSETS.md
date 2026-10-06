# Shared Blender asset library

The car, train and flight editions share `public/models/` in this repository. `public/models/catalog.json` lists all 12 GLB files, their SHA-256 hashes, original Blender source files, mesh counts and embedded image counts. The two original image atlases are `public/textures/train.png` and `public/textures/aircraft.png`.

Editable source files and regeneration commands, run from the repository root:

| Edition | Editable source | Regeneration command |
| --- | --- | --- |
| Car and scenery | `blender/island-drive.blend` | `blender --background --factory-startup --python blender/build_assets.py` |
| Train | `blender/train/models.blend` | `blender --background --factory-startup --python blender/train/build_assets.py` |
| Flight | `blender/flight/models.blend` | `blender --background --factory-startup --python blender/flight/build_assets.py` |

The train and flight generators use the canonical repository root and preserve their own edition identity. They export only their two GLB files into the shared model directory. Their renders, texture provenance and asset manifests live in `docs/editions/train/` and `docs/editions/flight/`, so generating one edition does not overwrite the other edition or the car source.

Each train and flight `.blend` retains one packed original raster atlas and resolves its external texture through `//../../public/textures/`. Actual Image Texture nodes connect the atlas to the mesh materials. The migration changes source-file paths only: the four existing GLB byte streams, UV coordinates and embedded images remain unchanged.

Both migrated Blender files were reopened with `--disable-autoexec`; the train file retains 234 meshes and the flight file 84 meshes. Their packed textures decode to 1254 × 1254 pixels. Private operating-system paths were removed while preserving Blender block lengths. Text and EXIF metadata were checked on the six edition PNG files. Original standalone projects were retained without modification.

All assets remain covered by the repository MIT license. Model coordinates are glTF +Y up, +Z forward and metres.
