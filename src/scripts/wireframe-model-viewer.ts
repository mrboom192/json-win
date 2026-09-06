import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

class WireframeModelViewer extends HTMLElement {
  private animationFrame = 0;
  private resizeObserver?: ResizeObserver;
  private intersectionObserver?: IntersectionObserver;
  private renderer?: THREE.WebGLRenderer;
  private scene?: THREE.Scene;
  private controls?: OrbitControls;
  private isVisible = true;

  connectedCallback() {
    if (this.renderer) return;

    const shadow = this.attachShadow({ mode: "open" });
    shadow.innerHTML = `
      <style>
        :host {
          position: relative;
          display: block;
          width: 100%;
          aspect-ratio: 16 / 10;
          margin: 30px auto;
          overflow: hidden;
          background: transparent;
          cursor: grab;
          touch-action: none;
        }
        :host(:active) { cursor: grabbing; }
        canvas { display: block; width: 100%; height: 100%; }
        .status {
          position: absolute;
          inset: 0;
          display: grid;
          place-items: center;
          color: #666;
          font: 0.8125rem/1.5 "JetBrains Mono", monospace;
          pointer-events: none;
        }
        .status[hidden] { display: none; }
      </style>
      <canvas></canvas>
      <div class="status" role="status">Loading 3D model…</div>
    `;

    const canvas = shadow.querySelector("canvas");
    const status = shadow.querySelector<HTMLElement>(".status");
    const src = this.getAttribute("src");
    if (!canvas || !status || !src) {
      if (status) status.textContent = "3D model source is missing.";
      return;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, 1, 0.01, 1000);
    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
    });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;

    this.scene = scene;
    this.renderer = renderer;
    this.controls = controls;

    new GLTFLoader().load(
      src,
      ({ scene: model }) => {
        const wireframeMaterial = new THREE.MeshBasicMaterial({
          color: 0x000000,
          wireframe: true,
          side: THREE.DoubleSide,
        });

        model.traverse((object) => {
          if (object instanceof THREE.Mesh) {
            object.material = wireframeMaterial;
          }
        });

        const bounds = new THREE.Box3().setFromObject(model);
        const center = bounds.getCenter(new THREE.Vector3());
        const sphere = bounds.getBoundingSphere(new THREE.Sphere());
        model.position.sub(center);
        scene.add(model);

        const radius = Math.max(sphere.radius, 0.01);
        const distance =
          radius / Math.sin(THREE.MathUtils.degToRad(camera.fov / 1.5));
        camera.position
          .set(1, 1, 1)
          .normalize()
          .multiplyScalar(distance * 1.15);
        camera.near = Math.max(radius / 100, 0.001);
        camera.far = radius * 100;
        camera.updateProjectionMatrix();
        controls.target.set(0, 0, 0);
        controls.minDistance = radius * 0.35;
        controls.maxDistance = radius * 12;
        controls.update();
        status.hidden = true;
      },
      undefined,
      () => {
        status.textContent = "Unable to load the 3D model.";
      },
    );

    this.resizeObserver = new ResizeObserver(() => {
      const { width, height } = this.getBoundingClientRect();
      if (width === 0 || height === 0) return;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    });
    this.resizeObserver.observe(this);

    this.intersectionObserver = new IntersectionObserver(([entry]) => {
      this.isVisible = entry?.isIntersecting ?? true;
    });
    this.intersectionObserver.observe(this);

    const render = () => {
      this.animationFrame = requestAnimationFrame(render);
      if (!this.isVisible) return;
      controls.update();
      renderer.render(scene, camera);
    };
    render();
  }

  disconnectedCallback() {
    cancelAnimationFrame(this.animationFrame);
    this.resizeObserver?.disconnect();
    this.intersectionObserver?.disconnect();
    this.controls?.dispose();
    this.renderer?.dispose();
    this.scene?.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      object.geometry.dispose();
      const materials = Array.isArray(object.material)
        ? object.material
        : [object.material];
      materials.forEach((material) => material.dispose());
    });
  }
}

if (!customElements.get("wireframe-model-viewer")) {
  customElements.define("wireframe-model-viewer", WireframeModelViewer);
}
