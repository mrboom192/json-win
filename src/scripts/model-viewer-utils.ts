import * as THREE from "three";
import { createQuadWireframe } from "./quad-wireframe";

export function parseViewerVector(
  value: string | null,
  fallback: THREE.Vector3,
) {
  const parts = value
    ?.trim()
    .split(/[\s,]+/)
    .map(Number);
  return parts?.length === 3 && parts.every(Number.isFinite)
    ? new THREE.Vector3(parts[0], parts[1], parts[2])
    : fallback.clone();
}

export function disposeModel(model: THREE.Object3D) {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const textures = new Set<THREE.Texture>();
  model.traverse((object) => {
    if (
      !(object instanceof THREE.Mesh) &&
      !(object instanceof THREE.LineSegments)
    )
      return;
    geometries.add(object.geometry);
    for (const material of Array.isArray(object.material)
      ? object.material
      : [object.material]) {
      materials.add(material);
      for (const value of Object.values(material)) {
        if (value instanceof THREE.Texture) textures.add(value);
      }
    }
  });
  geometries.forEach((geometry) => geometry.dispose());
  materials.forEach((material) => material.dispose());
  textures.forEach((texture) => texture.dispose());
}

export function addWireframeOverlay(
  mesh: THREE.Mesh,
  style: string | null,
  wireframeOnly = false,
) {
  if (style === "quads") {
    // Bake the displayed pose so the lines also align with skinned/morphed meshes.
    const geometry = mesh.geometry.clone();
    const position = geometry.getAttribute("position");
    const vertex = new THREE.Vector3();
    for (let i = 0; i < position.count; i++) {
      mesh.getVertexPosition(i, vertex);
      position.setXYZ(i, vertex.x, vertex.y, vertex.z);
    }
    const edges = createQuadWireframe(geometry);
    geometry.dispose();
    const material = new THREE.LineBasicMaterial({
      color: 0x17221c,
      depthWrite: false,
    });
    const count = mesh instanceof THREE.InstancedMesh ? mesh.count : 1;
    for (let i = 0; i < count; i++) {
      const overlay = new THREE.LineSegments(edges, material);
      if (mesh instanceof THREE.InstancedMesh) {
        mesh.getMatrixAt(i, overlay.matrix);
        overlay.matrixAutoUpdate = false;
      }
      overlay.renderOrder = 1;
      mesh.add(overlay);
    }
    if (count === 0) {
      edges.dispose();
      material.dispose();
    }
    return;
  }
  const overlay = mesh.clone(false);
  overlay.position.set(0, 0, 0);
  overlay.quaternion.identity();
  overlay.scale.set(1, 1, 1);
  overlay.matrix.identity();
  overlay.material = new THREE.MeshBasicMaterial({
    color: 0x17221c,
    wireframe: true,
    side: wireframeOnly ? THREE.DoubleSide : THREE.FrontSide,
    depthWrite: false,
  });
  overlay.renderOrder = 1;
  mesh.add(overlay);
}
