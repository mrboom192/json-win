import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { addWireframeOverlay, disposeModel, parseViewerVector } from "./model-viewer-utils";

class WireframeModelViewer extends HTMLElement {
  private animationFrame = 0;
  private resizeObserver?: ResizeObserver;
  private intersectionObserver?: IntersectionObserver;
  private renderer?: THREE.WebGLRenderer;
  private scene?: THREE.Scene;
  private controls?: OrbitControls;
  private isVisible = true;
  private cleanupKeys?: () => void;

  connectedCallback() {
    if (this.renderer) return;

    const shadow = this.shadowRoot ?? this.attachShadow({ mode: "open" });
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
      <canvas tabindex="0" role="group" aria-roledescription="3D viewer"></canvas>
      <div class="status" role="status">Loading 3D model…</div>
    `;

    const canvas = shadow.querySelector("canvas");
    const status = shadow.querySelector<HTMLElement>(".status");
    const src = this.getAttribute("src");
    if (!canvas || !status || !src) {
      if (status) status.textContent = "3D model source is missing.";
      return;
    }
    const zoomEnabled = this.getAttribute("zoom-enabled") !== "false";
    canvas.setAttribute("aria-label", `${this.getAttribute("aria-label") ?? "Interactive 3D model"}. Drag or use arrow keys to rotate. ${zoomEnabled ? "Scroll, pinch, or use plus and minus to zoom. " : ""}Home resets.`);
    const rotationValue = this.getAttribute("rotation");
    const yaw = Number(rotationValue ?? 0);
    // A single number remains shorthand for Y rotation on existing embeds.
    const rotation = parseViewerVector(rotationValue,
      new THREE.Vector3(0, Number.isFinite(yaw) ? yaw : 0, 0));
    const defaultCameraPosition = new THREE.Vector3(1, 1, 1).normalize()
      .multiplyScalar(1.15 / Math.sin(THREE.MathUtils.degToRad(40 / 1.5)));
    const initialCameraPosition = parseViewerVector(
      this.getAttribute("camera-position"), defaultCameraPosition,
    );
    // The camera must be away from its target to define a viewing direction.
    if (!Number.isFinite(initialCameraPosition.length()) || initialCameraPosition.length() < 0.001) {
      initialCameraPosition.copy(defaultCameraPosition);
    }
    const zoom = Number(this.getAttribute("zoom") ?? 1);
    const initialZoom = Number.isFinite(zoom) && zoom > 0
      ? THREE.MathUtils.clamp(zoom, 0.25, 4) : 1;
    // Preserve existing wireframe-only embeds; explicit true adds a shaded surface.
    const wireframe = this.getAttribute("wireframe") ?? "only";
    const orthographic = this.getAttribute("projection") === "orthographic";

    const scene = new THREE.Scene();
    const camera = orthographic
      ? new THREE.OrthographicCamera(-1, 1, 1, -1, 0.01, 1000)
      : new THREE.PerspectiveCamera(40, 1, 0.01, 1000);
    let halfHeight = 1;
    let aspect = 1;
    const updateProjection = () => {
      if (camera instanceof THREE.OrthographicCamera) {
        camera.left = -halfHeight * aspect;
        camera.right = halfHeight * aspect;
        camera.top = halfHeight;
        camera.bottom = -halfHeight;
      } else camera.aspect = aspect;
      camera.updateProjectionMatrix();
    };
    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
    });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const controls = new OrbitControls(camera, canvas);
    controls.enableZoom = zoomEnabled;
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minZoom = 0.125;
    controls.maxZoom = 8;
    scene.add(new THREE.HemisphereLight(0xffffff, 0x52634e, 2));
    const light = new THREE.DirectionalLight(0xffffff, 3);
    light.position.set(3, 5, 4);
    scene.add(light);

    this.scene = scene;
    this.renderer = renderer;
    this.controls = controls;

    new GLTFLoader().load(
      src,
      ({ scene: model }) => {
        if (this.scene !== scene) {
          disposeModel(model);
          return;
        }
        const meshes: THREE.Mesh[] = [];
        model.traverse((object) => {
          if (object instanceof THREE.Mesh) {
            meshes.push(object);
            const materials = Array.isArray(object.material) ? object.material : [object.material];
            for (const material of materials) {
              if (wireframe === "only") material.visible = false;
              if (wireframe === "true") {
                material.polygonOffset = true;
                material.polygonOffsetFactor = 1;
                material.polygonOffsetUnits = 1;
              }
            }
          }
        });
        if (wireframe === "true" || wireframe === "only") {
          for (const mesh of meshes) {
            addWireframeOverlay(mesh, this.getAttribute("wireframe-style"), wireframe === "only");
          }
        }

        const bounds = new THREE.Box3().setFromObject(model);
        if (bounds.isEmpty()) {
          disposeModel(model);
          status.textContent = "The 3D model is empty.";
          return;
        }
        const center = bounds.getCenter(new THREE.Vector3());
        const sphere = bounds.getBoundingSphere(new THREE.Sphere());
        model.position.sub(center);
        const orientation = new THREE.Group();
        orientation.rotation.set(
          THREE.MathUtils.degToRad(rotation.x),
          THREE.MathUtils.degToRad(rotation.y),
          THREE.MathUtils.degToRad(rotation.z),
          "XYZ",
        );
        orientation.add(model);
        scene.add(orientation);

        const radius = Math.max(sphere.radius, 0.01);
        const distance =
          radius / Math.sin(THREE.MathUtils.degToRad(40 / 1.5));
        camera.position
          .copy(initialCameraPosition)
          .multiplyScalar(radius / (orthographic ? 1 : initialZoom));
        halfHeight = distance * 1.15 * Math.tan(THREE.MathUtils.degToRad(20));
        if (orthographic) camera.zoom = initialZoom;
        camera.near = Math.min(Math.max(radius / 100, 0.001), camera.position.length() / 10);
        camera.far = Math.max(radius * 100, camera.position.length() * 2 + radius * 12);
        updateProjection();
        controls.target.set(0, 0, 0);
        controls.minDistance = Math.min(radius * 0.35, camera.position.length());
        controls.maxDistance = Math.max(radius * 12, camera.position.length() * 2);
        controls.update();
        controls.saveState();
        status.hidden = true;
      },
      undefined,
      () => {
        if (this.scene === scene) status.textContent = "Unable to load the 3D model.";
      },
    );

    this.resizeObserver = new ResizeObserver(() => {
      const { width, height } = this.getBoundingClientRect();
      if (width === 0 || height === 0) return;
      renderer.setSize(width, height, false);
      aspect = width / height;
      updateProjection();
    });
    this.resizeObserver.observe(this);

    this.intersectionObserver = new IntersectionObserver(([entry]) => {
      this.isVisible = entry?.isIntersecting ?? true;
    });
    this.intersectionObserver.observe(this);

    const onKey = (event: KeyboardEvent) => {
      if (!zoomEnabled && ["+", "=", "-"].includes(event.key)) return;
      if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "+", "=", "-", "Home"].includes(event.key)) return;
      event.preventDefault();
      if (event.key === "Home") { controls.reset(); return; }
      const offset = camera.position.clone().sub(controls.target);
      const spherical = new THREE.Spherical().setFromVector3(offset);
      if (event.key === "ArrowLeft") spherical.theta -= 0.12;
      if (event.key === "ArrowRight") spherical.theta += 0.12;
      if (event.key === "ArrowUp") spherical.phi -= 0.12;
      if (event.key === "ArrowDown") spherical.phi += 0.12;
      const factor = event.key === "+" || event.key === "=" ? 0.9 : event.key === "-" ? 1.1 : 1;
      if (orthographic) {
        camera.zoom = THREE.MathUtils.clamp(camera.zoom / factor, controls.minZoom, controls.maxZoom);
        updateProjection();
      } else {
        spherical.radius = THREE.MathUtils.clamp(spherical.radius * factor, controls.minDistance, controls.maxDistance);
      }
      spherical.makeSafe();
      camera.position.copy(controls.target).add(offset.setFromSpherical(spherical));
      controls.update();
    };
    canvas.addEventListener("keydown", onKey);
    this.cleanupKeys = () => canvas.removeEventListener("keydown", onKey);

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
    this.cleanupKeys?.();
    this.renderer?.dispose();
    if (this.scene) disposeModel(this.scene);
    this.scene = undefined;
    this.renderer = undefined;
  }
}

if (!customElements.get("wireframe-model-viewer")) {
  customElements.define("wireframe-model-viewer", WireframeModelViewer);
}
