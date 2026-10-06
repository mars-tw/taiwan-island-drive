# Original image textures and Blender geometry

The raster atlas was generated with the built-in `image_gen` tool, then visually inspected and copied into `public/textures/aircraft.png`. No external aircraft brand, stock model, photograph or API fallback was used. The original high wing training aircraft, shaped airfoils, cabin, yokes, seats, pedals, landing gear and propeller were constructed as 3D meshes in Blender 5.2 using `blender/build_assets.py`.

The four equal quadrants contain ivory painted aluminium with navy and orange stripes, mechanical metal and tire rubber, blank cockpit powdercoat, and brown leather upholstery. Blender Image Texture nodes connect the image directly to Principled BSDF Base Color. Box projected UVs crop each mesh to its intended material. Each GLB embeds the raster PNG and uses it on geometry; no flat image substitutes for the aircraft.

`docs/asset-manifest.json` records embedded image, textured material and UV accessor counts. `docs/assets.png` and `docs/cab-assets.png` are actual Blender renders. Dynamic instruments are drawn by the simulator interface. The texture deliberately contains no static gauges, markings or readings that could contradict the simulation.

Final generation prompt:

> Use case: photorealistic-natural. Asset type: square 2 by 2 PBR albedo texture atlas for original high wing single-engine training airplane, to UV map onto Blender 3D geometry. Exactly four equal square quadrants, split precisely at horizontal and vertical midpoint with no gutters, borders or labels. TOP LEFT: flat warm ivory painted aluminium, horizontal navy stripe with thinner burnt orange stripe across center, subtle panel seams and small steel rivets. TOP RIGHT: dark mechanical steel, charcoal tire rubber, uniform subtle metal grain. BOTTOM LEFT: solid dark charcoal blue cockpit dashboard powdercoat fine grain, completely blank without any instruments, gauges, buttons, numbers or symbols. BOTTOM RIGHT: dark tobacco brown leather seat upholstery, restrained fine pores and seam detail. All quadrants viewed perfectly flat and orthographic, even illumination, no shadows, perspective, reflections, gradients, objects or scene. No text, logos, watermark, no airplane illustration. High resolution realistic material swatches fill their quadrants precisely.

Reproduce the geometry and exports with the atlas in place:

```sh
blender --background --factory-startup --python blender/build_assets.py
```

The editable `blender/models.blend` retains packed image pixels and relative texture paths. Blender nose is -Y; glTF nose is +Z and up is +Y. Metres are used throughout. `PropellerRoot` spins around glTF local Z. The named ailerons, flaps, elevator, rudder and yokes are separate geometry.

These original assets are released under the repository's MIT license.
