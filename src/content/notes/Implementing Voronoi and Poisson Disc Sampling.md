---
title: Implementation notes
date: 2026-09-13
draft: false
---

We need to be able to run a Voronoi diagram algorithm and a poisson disc sampling algorithm on our SDF surface. Cartesian coordinates may be useful.

Wwe also need a way to blend between different textures on the surface.

For poisson disc sampling, we'll need to divide the terrain up so that we only examine relevant points we sample.
For grass, we shouldn't have to generate it until the camera is upclose.

## Triplanar Projection on a sphere

If we use the above method to shade a sphere, we get the expected result: the Y-coordinate texture is projected onto the upward- and downward-facing surfaces, while the XZ-coordinate texture is projected onto the sides. If our sphere were a planet however, this would be wrong. In this case, we ideally want to somehow have our triplanar projection shader follow the local orientation of the planet's surface.

We want some function $F$ that takes in our $(u, v)$ coordinates and some value representing orientation $r$ and maps it to a new $(u', v')$ such that the resulting mapping minimizes the stretching introduced by our new projection method.
$$
F: (u, v, r) \rightarrow (u', v')
$$