# Original image textures and Blender geometry

The raster atlas was generated with the built-in `image_gen` tool, then visually inspected and copied into `public/textures/train.png`. No external brand, train photograph, stock model or API fallback was used. The original commuter vehicle, seats, bogies, pantograph, windows and cab were built as actual 3D meshes using `blender/build_assets.py` with Blender 5.2.

The atlas contains four equal quadrants. The top left contains white and teal aluminium livery, top right mechanical metal, bottom left blank cockpit powdercoat, and bottom right woven seat textile. Blender Image Texture nodes reference the atlas and connect directly to the Principled BSDF Base Color. Every textured mesh has UV coordinates projected onto its designated atlas crop. The GLB exports embed the PNG image; this is a surface texture applied to geometry rather than a billboard.

`docs/asset-manifest.json` records embedded image, textured material and UV accessor counts. `docs/assets.png` and `docs/cab-assets.png` are actual Blender renders. Dynamic instrument readings are rendered by the simulator interface. The raster texture intentionally contains no gauge markings or static readings.

Final generation prompt:

> Use case: photorealistic-natural. Asset type: square 2 by 2 PBR albedo texture atlas for original Taiwanese commuter train, to UV map onto Blender 3D geometry. Exactly four equal square quadrants, split precisely at horizontal and vertical midpoint with no gutters, borders or labels. TOP LEFT: flat warm white painted aluminium, broad horizontal teal stripe across center, very subtle panel seams and tiny rivets. TOP RIGHT: dark mechanical steel, charcoal rubber and subtle brushed metal grain uniform repeating surface. BOTTOM LEFT: solid dark blue charcoal cockpit dashboard powder coated fine grain, completely blank without any instruments, gauges, buttons, numbers or symbols. BOTTOM RIGHT: close view dark blue woven seat textile with subtle lighter fibers. All quadrants viewed perfectly flat and orthographic, even illumination with no shadows, perspective, highlights, lighting gradients, objects or scene. No text, logo, watermark, no vehicle illustration. High resolution texture material swatches filling their quadrants precisely.

To reproduce the meshes and exports, keep the atlas in place and run:

```sh
blender --background --factory-startup --python blender/build_assets.py
```

The editable `blender/models.blend` retains packed texture pixels and relative paths. Vehicle nose is Blender -Y and glTF +Z; glTF up is +Y. All dimensions use metres. Exported model origins are independent of the overview placement in the editable scene.

These original assets are released under the repository's MIT license.
