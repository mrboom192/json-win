import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

function disposeModel(model: THREE.Object3D) {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const textures = new Set<THREE.Texture>();
  model.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
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

class TitleModelViewer extends HTMLElement {
  private cleanup?: () => void;

  connectedCallback() {
    if (this.cleanup) return;
    const shadow = this.shadowRoot ?? this.attachShadow({ mode: "open" });
    shadow.innerHTML = `
      <style>
        :host { display: block; position: relative; width: 15rem; height: 15rem; }
        canvas { display: block; width: 100%; height: 100%; cursor: grab; border-radius: 2px; }
        canvas:active { cursor: grabbing; }
        canvas:focus-visible { outline: 2px solid var(--color-accent, #397553); outline-offset: 3px; }
        .status { position: absolute; inset: 0; display: grid; place-content: center;
          padding: 1rem; text-align: center; font-size: .8125rem; color: var(--color-muted, #666); pointer-events: none; }
        .status[hidden] { display: none; }
        .instructions { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }
      </style>
      <canvas tabindex="0" role="group" aria-roledescription="3D viewer" aria-describedby="instructions"></canvas>
      <span id="instructions" class="instructions">Drag to rotate. Scroll or pinch to zoom. Use arrow keys to rotate, plus and minus to zoom, and Home to reset.</span>
      <div class="status" role="status">Loading 3D model…</div>
    `;
    const canvas = shadow.querySelector("canvas")!;
    canvas.setAttribute(
      "aria-label",
      this.getAttribute("aria-label") ?? "Interactive 3D model",
    );
    const status = shadow.querySelector<HTMLElement>(".status")!;
    const src = this.getAttribute("src");
    const rotation = Number(this.getAttribute("rotation") ?? 0);
    const initialRotation = THREE.MathUtils.degToRad(
      Number.isFinite(rotation) ? rotation : 0,
    );
    const zoom = Number(this.getAttribute("zoom") ?? 1);
    const initialZoom =
      Number.isFinite(zoom) && zoom > 0
        ? THREE.MathUtils.clamp(zoom, 0.25, 4)
        : 1;
    const showWireframe = this.getAttribute("wireframe") === "true";
    if (!src) {
      status.textContent = "3D model source is missing.";
      return;
    }

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
      });
    } catch {
      status.textContent = "3D preview is unavailable in this browser.";
      return;
    }
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.75;

    const scene = new THREE.Scene();
    // Match the previous framing at zoom 1, without perspective foreshortening.
    const halfHeight = 0.5;
    const camera = new THREE.OrthographicCamera(
      -halfHeight,
      halfHeight,
      halfHeight,
      -halfHeight,
      0.01,
      100,
    );
    camera.position.set(1, 1, 1).normalize().multiplyScalar(8);
    camera.zoom = initialZoom;
    camera.updateProjectionMatrix();
    const controls = new OrbitControls(camera, canvas);
    controls.enablePan = false;
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.zoomSpeed = 0.65;
    controls.minZoom = 0.125;
    controls.maxZoom = 8;

    // A soft studio environment supplies broad reflections without a visible backdrop.
    const pmrem = new THREE.PMREMGenerator(renderer);
    const room = new RoomEnvironment();
    const environment = pmrem.fromScene(room, 0.04);
    scene.environment = environment.texture;
    scene.environmentIntensity = 0.65;
    room.dispose();
    pmrem.dispose();
    scene.add(new THREE.HemisphereLight(0xffffff, 0x52634e, 1.1));
    const key = new THREE.DirectionalLight(0xffffff, 3);
    key.position.set(3, 5, 4);
    scene.add(key);

    let disposed = false;
    let visible = true;
    let frame = 0;
    let pivot: THREE.Group | undefined;
    let pointer: { x: number; y: number } | undefined;
    let interacting = false;
    let lastTime = 0;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const targetRotation = new THREE.Quaternion();
    const localRotation = new THREE.Quaternion();
    const cameraInverse = new THREE.Quaternion();
    const tilt = new THREE.Euler(0, 0, 0, "YXZ");
    const render = (time: number) => {
      frame = 0;
      if (disposed || !visible || document.hidden) return;
      const moving = controls.update();
      targetRotation.identity();
      if (pointer && !interacting && !reducedMotion.matches) {
        const rect = this.getBoundingClientRect();
        const x = pointer.x - (rect.left + rect.width / 2);
        const y = pointer.y - (rect.top + rect.height / 2);
        const distance = Math.hypot(
          Math.max(Math.abs(x) - rect.width / 2, 0),
          Math.max(Math.abs(y) - rect.height / 2, 0),
        );
        // Full influence inside the viewer, fading to zero 280px beyond it.
        const proximity = 1 - THREE.MathUtils.smoothstep(distance, 0, 280);
        tilt.set(
          THREE.MathUtils.clamp(y / (rect.height / 2), -1, 1) * 0.3 * proximity,
          THREE.MathUtils.clamp(x / (rect.width / 2), -1, 1) * 0.45 * proximity,
          0,
        );
        localRotation.setFromEuler(tilt);
        // Follow in screen space even after manually orbiting the camera.
        cameraInverse.copy(camera.quaternion).invert();
        targetRotation
          .copy(camera.quaternion)
          .multiply(localRotation)
          .multiply(cameraInverse);
      }
      let following = false;
      if (pivot) {
        const delta = Math.min((time - lastTime) / 1000, 0.05);
        pivot.quaternion.slerp(targetRotation, 1 - Math.exp(-10 * delta));
        following = pivot.quaternion.angleTo(targetRotation) > 0.0001;
        if (!following) pivot.quaternion.copy(targetRotation);
      }
      lastTime = time;
      renderer.render(scene, camera);
      if (moving || following) requestRender();
    };
    const requestRender = () => {
      if (!frame && !disposed && visible && !document.hidden)
        frame = requestAnimationFrame(render);
    };
    controls.addEventListener("change", requestRender);
    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      pointer = { x: event.clientX, y: event.clientY };
      requestRender();
    };
    const clearPointer = () => {
      pointer = undefined;
      requestRender();
    };
    const onPointerOut = (event: PointerEvent) => {
      if (!event.relatedTarget) clearPointer();
    };
    const onInteractionStart = () => {
      interacting = true;
      requestRender();
    };
    const onInteractionEnd = () => {
      interacting = false;
      requestRender();
    };
    controls.addEventListener("start", onInteractionStart);
    controls.addEventListener("end", onInteractionEnd);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerout", onPointerOut);
    window.addEventListener("blur", clearPointer);
    window.addEventListener("scroll", requestRender, {
      passive: true,
      capture: true,
    });
    reducedMotion.addEventListener("change", clearPointer);

    new GLTFLoader().load(
      src,
      ({ scene: model }) => {
        if (disposed) {
          disposeModel(model);
          return;
        }
        // Keep the GLB's colors and textures, adding only a modest surface sheen.
        const meshes: THREE.Mesh[] = [];
        model.traverse((object) => {
          if (!(object instanceof THREE.Mesh)) return;
          meshes.push(object);
          const polish = (material: THREE.Material) => {
            if (showWireframe) {
              material.polygonOffset = true;
              material.polygonOffsetFactor = 1;
              material.polygonOffsetUnits = 1;
            }
            if (material instanceof THREE.MeshStandardMaterial) {
              material.roughness = 0.32;
              material.metalness = 0.08;
              material.envMapIntensity = 0.8;
            }
          };
          (Array.isArray(object.material)
            ? object.material
            : [object.material]
          ).forEach(polish);
        });
        // Add a second mesh pass, retaining the original shaded materials beneath it.
        // Clone mesh types so skinning, morph targets, and instancing are preserved.
        if (showWireframe) {
          for (const mesh of meshes) {
            const overlay = mesh.clone(false);
            overlay.position.set(0, 0, 0);
            overlay.quaternion.identity();
            overlay.scale.set(1, 1, 1);
            overlay.matrix.identity();
            overlay.material = new THREE.MeshBasicMaterial({
              color: 0x17221c,
              wireframe: true,
              depthWrite: false,
            });
            overlay.renderOrder = 1;
            mesh.add(overlay);
          }
        }
        const bounds = new THREE.Box3().setFromObject(model);
        if (bounds.isEmpty()) {
          disposeModel(model);
          status.textContent = "The 3D model is empty.";
          return;
        }
        const center = bounds.getCenter(new THREE.Vector3());
        const radius = Math.max(
          bounds.getBoundingSphere(new THREE.Sphere()).radius,
          0.001,
        );
        // Normalize arbitrary export units and pivots so the hero always fits its square.
        pivot = new THREE.Group();
        model.position.sub(center);
        // Keep the authored orientation separate from the animated pointer tilt.
        const orientation = new THREE.Group();
        orientation.rotation.y = initialRotation;
        orientation.add(model);
        pivot.add(orientation);
        pivot.scale.setScalar(1 / radius);
        scene.add(pivot);
        camera.position.set(1, 0.65, 1.4).normalize().multiplyScalar(8);
        camera.zoom = initialZoom;
        camera.updateProjectionMatrix();
        controls.target.set(0, 0, 0);
        controls.update();
        controls.saveState();
        status.hidden = true;
        requestRender();
      },
      undefined,
      () => {
        if (!disposed) status.textContent = "Unable to load the 3D model.";
      },
    );

    const onKey = (event: KeyboardEvent) => {
      if (
        ![
          "ArrowLeft",
          "ArrowRight",
          "ArrowUp",
          "ArrowDown",
          "+",
          "=",
          "-",
          "Home",
        ].includes(event.key)
      )
        return;
      event.preventDefault();
      if (event.key === "Home") {
        controls.reset();
        return;
      }
      const offset = camera.position.clone().sub(controls.target);
      const spherical = new THREE.Spherical().setFromVector3(offset);
      if (event.key === "ArrowLeft") spherical.theta -= 0.12;
      if (event.key === "ArrowRight") spherical.theta += 0.12;
      if (event.key === "ArrowUp") spherical.phi -= 0.12;
      if (event.key === "ArrowDown") spherical.phi += 0.12;
      if (event.key === "+" || event.key === "=") camera.zoom /= 0.9;
      if (event.key === "-") camera.zoom /= 1.1;
      camera.zoom = THREE.MathUtils.clamp(
        camera.zoom,
        controls.minZoom,
        controls.maxZoom,
      );
      camera.updateProjectionMatrix();
      spherical.makeSafe();
      camera.position
        .copy(controls.target)
        .add(offset.setFromSpherical(spherical));
      controls.update();
      requestRender();
    };
    canvas.addEventListener("keydown", onKey);
    const resizeObserver = new ResizeObserver(() => {
      const { width, height } = this.getBoundingClientRect();
      if (!width || !height) return;
      renderer.setSize(width, height, false);
      const aspect = width / height;
      camera.left = -halfHeight * aspect;
      camera.right = halfHeight * aspect;
      camera.top = halfHeight;
      camera.bottom = -halfHeight;
      camera.updateProjectionMatrix();
      requestRender();
    });
    resizeObserver.observe(this);
    const intersectionObserver = new IntersectionObserver(([entry]) => {
      visible = entry?.isIntersecting ?? false;
      requestRender();
    });
    intersectionObserver.observe(this);
    document.addEventListener("visibilitychange", requestRender);

    this.cleanup = () => {
      disposed = true;
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      document.removeEventListener("visibilitychange", requestRender);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerout", onPointerOut);
      window.removeEventListener("blur", clearPointer);
      window.removeEventListener("scroll", requestRender, true);
      reducedMotion.removeEventListener("change", clearPointer);
      canvas.removeEventListener("keydown", onKey);
      controls.dispose();
      disposeModel(scene);
      environment.dispose();
      renderer.dispose();
    };
  }

  disconnectedCallback() {
    this.cleanup?.();
    this.cleanup = undefined;
  }
}

if (!customElements.get("title-model-viewer")) {
  customElements.define("title-model-viewer", TitleModelViewer);
}
