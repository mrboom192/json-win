---
title: GLSL Hello World
date: 2026-09-08
draft: false
---

## What is GLSL?

GLSL stands for openGL Shading Language, which is the specific standard of shader programs. Godot uses a shading language similar to GLSL ES 3.0. 

## *Hello World*

The GLSL code below creates a bright welcoming color

```glsl
#ifdef GL_ES
precision mediump float;
#endif

uniform float u_time;

void main() {
	gl_FragColor = vec4(1.0, 0.0, 1.0, 1.0);
}
```

Shader Language has a single `main` function that returns a color at the end. This is similar to C.

The final pixel color is assigned to the reserved global variable `gl_FragColor`.

## Comments

The shading language supports the same comment syntax used in C# and C++, using `//` for single-line comments and `/* */` for multi-comments.

## Casting

Just like GLSL ES 3.0, implicit casting between scalars and vectors of the same size but different type is not allowed. Conversion must be done explicitly via constructors.

## Members

Individual scalar members of vector types are accessed via the "x", "y", "z", and "w" members.



