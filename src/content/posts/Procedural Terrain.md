---
title: Procedural terrain generation
date: 2026-09-05
description: A starting point for a new post.
draft: false
---

## Intro

I'm currently working on a hobby game that needs to simulate an entire planet. Games like [No Man's Sky](https://www.nomanssky.com/) and [Kerbal Space Program](https://store.steampowered.com/app/220200/Kerbal_Space_Program/) generate an entire planet, so I looked up to these games when developing my procedural terrain system. At minimum, I would want the planet to be pretty big (maybe even Earth sized), be fully destructible, and be able to run on most hardware. These minimum requirements alone drove me into weeks long journey on terrain generation.
## Faking terrain

In real life, terrain is shaped by natural processes such as tectonic activity and erosion. To simulate these within the constraints of a real-time game is beyond my expertise. However, we can get close enough using some noise function A noise function returns a scalar value for any $n$-dimensional position:
$$
f: \mathbb{R}^n \to \mathbb{R}
$$
The idea is relatively simple: we start with a $XZ$ plane mesh with a high enough vertex count to represent the desired level of detail. For each vertex, we sample a noise function $f$ and displace that vertex in the $y$-direction by the sampled amount.

This gives us pretty believable looking terrain. If we wanted a bigger map, we could have the surface stretch out farther and also increase the number of vertices so that the resolution remains high. But we can only do this so much before we hit the first set of bottlenecks: **memory** and **generation time**. At some point, the surface will contain so many vertices that it consumes a significant amount of memory and, depending on the hardware, takes far too long to generate. Scaling our terrain this way makes it impractical for games, so we need another solution.

## Level of detail

The farther away something is, the less detail we can make out. This observation leads to an important optimization: we only need high-resolution terrain near the camera, while terrain farther away can be represented using fewer vertices. The most natural thing to do then is to have our terrain system generate more vertices the closer we are, and less vertices the farther we are. However, our current setup does not really generate anything; it only moves vertices around. If we were to implement LOD into our system, a more robust solution is desired. 