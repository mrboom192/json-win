---
title: Implementation notes
date: 2026-09-13
description:
draft: false
---

We need to be able to run a Voronoi diagram algorithm and a poisson disc sampling algorithm on our SDF surface. Cartesian coordinates may be useful.

Wwe also need a way to blend between different textures on the surface.

For poisson disc sampling, we'll need to divide the terrain up so that we only examine relevant points we sample.
For grass, we shouldn't have to generate it until the camera is upclose.