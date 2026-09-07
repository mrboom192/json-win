---
title: Procedural Terrain
date: 2026-09-05
description: A starting point for a new post.
draft: false
titleModel: /models/octree.glb
titleModelZoom: 0.5
titleModelWireframe: true
titleModelRotation: -99.5
titleModelWireframeStyle: quads
---

## Intro

I'm currently working on a hobby game that needs to simulate an entire planet. Games like [No Man's Sky](https://www.nomanssky.com/) and [Kerbal Space Program](https://store.steampowered.com/app/220200/Kerbal_Space_Program/) generate an entire planet, so I looked up to these games when developing my procedural terrain system. At minimum, I would want the planet to be pretty big (maybe even Earth sized), be fully destructible, and be able to run on most hardware. These minimum requirements alone drove me into weeks long journey on terrain generation.

## Faking terrain

In real life, terrain is shaped by natural processes such as tectonic activity and erosion. To simulate these within the constraints of a real-time game is beyond my expertise. However, we can get close enough using some noise function A noise function returns a scalar value for any $n$-dimensional position:

$$
f: \mathbb{R}^n \to \mathbb{R}
$$

The idea is relatively simple: we start with a $XZ$ planar mesh with a high enough vertex count to represent the desired level of detail. For each vertex, we sample a noise function $f$ and displace that vertex in the $y$-direction by the sampled amount. Godot lets us sample a noise function in C# with `GetNoise2D`. We define a `FastNoiseLite noise` variable and sample it at position `Vector3 v`.

```cs
float displacement = noise.GetNoise2D(v.x, v.z);
```

We then use `displacement` to modify the vertex's y-coordinate. Repeating this for every vertex produces fairly believable-looking terrain.

<wireframe-model-viewer src="/models/plane-noise-simple.glb" aria-label="Interactive wireframe model of a plane displaced with noise">
  <a href="/models/plane-noise-simple.glb">Download the 3D model</a>
</wireframe-model-viewer>

If we wanted a bigger map, we could have the surface stretch out farther and also increase the number of vertices so that the resolution remains high. But we can only do this so much before we hit the first set of bottlenecks: **memory** and **generation time**. At some point, the surface will contain so many vertices that it consumes a significant amount of memory and, depending on the hardware, takes far too long to generate. Scaling our terrain this way makes it impractical for games, so we need another solution.

## Level of detail

The farther away something is, the less detail we can make out. This observation leads to an important optimization: we only need high-resolution terrain near the camera, while terrain farther away can be represented using fewer vertices. The most natural thing to do then is to have our terrain system generate more vertices the closer we are, and less vertices the farther we are. However, our current setup does not really generate anything; it only moves vertices around. If we were to implement LOD into our system, a more robust solution is desired.

Let's imagine we had a system that could automatically generate planar meshes for any region we define, with a resolution of our choosing. Then the problem becomes much simpler: we just need a way to divide the terrain into chunks and decrease the resolution of those chunks as their distance from the viewer increases. A [quadtree](https://en.wikipedia.org/wiki/Quadtree) naturally handles this type of setup, especially for terrain generated using a heightmap. A similar data structure is the [octree](https://en.wikipedia.org/wiki/Octree), which can be thought of as an extension of the quadtree into 3D space. Each of these are tree data structures with 4 and 8 children respectively.

Going back to our requirements, we want to represent the world as a spherical planet. This already complicates a purely planar approach, although techniques such as mapping a cube onto a sphere to form a quadsphere could still be used. More importantly, heightmap-based terrain cannot represent features such as caves or overhangs because each $XZ$ coordinate gets assigned only 1 $y$-value. These constraints suggest that we need a volumetric representation of the terrain rather than a surface-based one. For this reason, I went with voxels to represent the world and an octree to spatially organize them.

## Implicit surfaces

An implicit surface is defined as a surface in Euclidean space defined by an equation
$$
F(x, y, z) = 0.
$$
In other words, an implicit surface is the set of zeros of a function of three variables. To represent our planet, we'll use the implicit surface of a sphere defined by the [signed distance function](https://en.wikipedia.org/wiki/Signed_distance_function) 
$$
f(p) = ||p|| - r
$$
where $r$ is the radius of the sphere and $p=(x,y,z)$ is a sample point in 3D space. You can think of it as a scalar field where points at surface have a value of $0$, points inside the sphere have negative values, and points outside the sphere have positive values.

In order for this to be useful, we need a way to extract a polygonal mesh from the implicit surface. The most popular method is to use [marching cubes](https://en.wikipedia.org/wiki/Marching_cubes).