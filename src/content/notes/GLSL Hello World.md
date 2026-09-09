---
title: GLSL Hello World
date: 2026-09-08
draft: false
---

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