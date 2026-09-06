import * as THREE from "three";

// GLB has no quad topology. Pair near-coplanar triangles only when their shared
// edge is longest in both triangles, a conservative estimate of a quad diagonal.
export function createQuadWireframe(geometry: THREE.BufferGeometry) {
  const position = geometry.getAttribute("position");
  const index = geometry.getIndex();
  const bounds = new THREE.Box3().setFromBufferAttribute(position as THREE.BufferAttribute);
  const scale = Math.max(bounds.getSize(new THREE.Vector3()).length(), 1e-10);
  const key = (v: THREE.Vector3) => [v.x, v.y, v.z]
    .map((value, axis) => Math.round((value - bounds.min.getComponent(axis)) / scale * 1e6)).join(",");
  const edges = new Map<string, { a: THREE.Vector3; b: THREE.Vector3; faces: number[]; length: number }>();
  const faces: { normal: THREE.Vector3; longest: number }[] = [];
  const count = index ? index.count : position.count;
  for (let i = 0; i < count; i += 3) {
    const vertices = [0, 1, 2].map((offset) => new THREE.Vector3()
      .fromBufferAttribute(position, index ? index.getX(i + offset) : i + offset));
    const normal = new THREE.Triangle(...vertices as [THREE.Vector3, THREE.Vector3, THREE.Vector3])
      .getNormal(new THREE.Vector3());
    if (normal.lengthSq() === 0) continue;
    const lengths = vertices.map((v, j) => v.distanceToSquared(vertices[(j + 1) % 3]));
    const face = faces.length;
    faces.push({ normal, longest: Math.max(...lengths) });
    vertices.forEach((a, j) => {
      const b = vertices[(j + 1) % 3];
      const hash = [key(a), key(b)].sort().join("/");
      const edge = edges.get(hash);
      if (edge) edge.faces.push(face);
      else edges.set(hash, { a, b, faces: [face], length: lengths[j] });
    });
  }
  const paired = new Set<number>();
  const vertices: number[] = [];
  for (const edge of edges.values()) {
    const [a, b] = edge.faces;
    if (edge.faces.length === 2 && !paired.has(a) && !paired.has(b)
      && faces[a].normal.dot(faces[b].normal) > Math.cos(THREE.MathUtils.degToRad(1))
      && edge.length >= faces[a].longest * (1 - 1e-6)
      && edge.length >= faces[b].longest * (1 - 1e-6)) {
      paired.add(a);
      paired.add(b);
      continue;
    }
    vertices.push(...edge.a.toArray(), ...edge.b.toArray());
  }
  return new THREE.BufferGeometry().setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
}
