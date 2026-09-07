# Astro Starter Kit: Basics

## Header 3D viewer

The header model uses an orthographic camera. Configure it in a post's Markdown frontmatter:

```yaml
titleModel: /models/octree.glb
titleModelRotation: 45
titleModelZoom: 1.2
titleModelWireframe: true
titleModelWireframeStyle: quads
```

`titleModelRotation` rotates the centered model around its Y axis (left/right)
in degrees. It defaults to `0`; use positive or negative values to turn it.
`titleModelZoom` defaults to `1`; larger values zoom in and smaller values zoom
out (supported range: `0.25`–`4`). `titleModelWireframe` defaults to `false`;
set it to `true` to draw dark triangle edges over the shaded, textured model.
`titleModelWireframeStyle` accepts `triangles` (default) or `quads`.
The quad style hides the shared diagonal of near-coplanar triangle pairs while
preserving grid edges. GLB files contain triangles, so this is an approximation:
unmatched triangles and curved faces may still show triangle edges.
These settings affect only the header viewer. Dragging and arrow keys rotate;
Home resets the camera to the configured initial view. Interactive zoom is
disabled; `titleModelZoom` still sets the initial framing.

## Inline 3D viewer

Set the same options as HTML attributes on each viewer in the Markdown body:

```html
<wireframe-model-viewer
  src="/models/plane-noise-simple.glb"
  rotation="20 45 0"
  camera-position="2 1 3"
  zoom="1.2"
  zoom-enabled="false"
  wireframe="true"
  wireframe-style="quads"
  projection="orthographic"
  aria-label="Interactive terrain model"
></wireframe-model-viewer>
```

`rotation` accepts X/Y/Z angles in degrees, applied in XYZ Euler order around
the model's center: `rotation="20 45 0"`. A single number such as `rotation="45"`
still means Y-axis rotation. The default is `0 0 0`.

`camera-position` sets X/Y/Z relative to the centered model, in units of its
bounding-sphere radius. For example, `0 0 3` views from the front, `3 0 0` from
the side, and `0 3 0` from above. The camera always looks at the model's center.
Omit it for the original diagonal view. Triples accept spaces or commas;
invalid values (including a camera at `0 0 0`) fall back to the default.

`zoom` is a multiplier from `0.25` to `4` (default `1`). With perspective, zoom
moves the initial camera position closer or farther; with orthographic, zoom
changes the framing while camera position controls the viewing angle.
`zoom-enabled="false"` disables scroll, pinch, and keyboard zoom while retaining
the initial `zoom` setting. It defaults to `true`; rotation and Home reset work
either way.
Use `wireframe="true"` for an overlay
on the shaded model, `wireframe="false"` for the shaded model alone, or
`wireframe="only"` for just the edges. Omitting `wireframe` preserves the original
wireframe-only appearance. `wireframe-style` accepts `triangles` (default) or
`quads`, with the same approximation described above. `projection` accepts
`perspective` (default) or `orthographic`. Drag/scroll and keyboard controls work
in both projections; Home restores the initial camera view.

```sh
npm create astro@latest -- --template basics
```

> 🧑‍🚀 **Seasoned astronaut?** Delete this file. Have fun!

## 🚀 Project Structure

Inside of your Astro project, you'll see the following folders and files:

```text
/
├── public/
│   └── favicon.svg
├── src
│   ├── assets
│   │   └── astro.svg
│   ├── components
│   │   └── Welcome.astro
│   ├── layouts
│   │   └── Layout.astro
│   └── pages
│       └── index.astro
└── package.json
```

To learn more about the folder structure of an Astro project, refer to [our guide on project structure](https://docs.astro.build/en/basics/project-structure/).

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Get help using the Astro CLI                     |

## 👀 Want to learn more?

Feel free to check [our documentation](https://docs.astro.build) or jump into our [Discord server](https://astro.build/chat).
