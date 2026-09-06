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
These settings affect only the header viewer. Dragging and zooming still work,
and the Home key resets the camera to the configured initial view.

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
