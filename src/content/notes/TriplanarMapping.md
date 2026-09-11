---
title: Triplanar Projection
date: 2026-09-11
draft: false
---

## Texture Mapping

In order to apply texture maps to a mesh, we must be able to specify a mapping function that provides texture sampling coordinates for each vertex position. This is ordinarily accomplished by performing some kind of projection on the vertex positions themselves to obtain two-dimensional texture coordinates. One such method is triplanar projection.

## Triplanar Projection

Triplanar project generates three sets of texture coordinates by projecting the vertex positions onto planes perpendicular to each of the three coordinate axes. Up to three different texture maps are then sampled, and the results are blended based on the direction in which the vertex normal points.

If the surface normal forms an obtuse angle with the plane's normal, then the texture image is flipped in one direction. This is mitigated by negating one of the texture coordinates generated for each plane whenever the surface normal forms a negative dot product with the plane normal, which is just picking off individual components of the surface normal because the plane normals are aligned to the coordinate axes.

We calculate our three sets of texture coordinates $(s_x,t_x), (s_y,t_y), (s_z,t_z)$ as follows, where $\mathbf{p}$ is the scaled vertex position.

$$
\begin{aligned}
s_x &= 
\begin{cases}
p_y, & \text{if } N_x \ge 0, \\
-p_y, & \text{if } N_x < 0;
\end{cases}
\\

\end{aligned}
$$
