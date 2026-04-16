import * as THREE from "three";
import { Object } from "./object";
import { MeshLineGeometry, MeshLineMaterial } from "meshline";

class PlanetObjectParams {
  name = "";
  texture = null;
  data = null;
  //   radius = 0;
  //   distance = 0;
  //   orbitTime = 0;
  //   description = "";
}

class PlanetObject extends Object {
  #mesh_ = null;
  #orbitMesh_ = null;
  #group_ = new THREE.Group();
  constructor() {
    super();
  }

  async initialize(params) {
    const sphereGeometry = new THREE.SphereGeometry(1, 32, 32);
    const sphereMaterial = await this.#createMaterial_(params);
    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    sphere.position.set(params.data.distance * 50, 0, 0);
    sphere.scale.set(
      params.data.radius,
      params.data.radius,
      params.data.radius,
    );

    if (params.data.name === "Sun") {
      const planeGeometry = new THREE.PlaneGeometry(1, 1);
      const planeMaterial = await this.#loadShader_("sun-corona", {
        map: {
          value: await this.loadTexture(
            "./resources/textures/lens-mod.png",
            true,
          ),
        },
      });
      planeMaterial.transparent = true;
      planeMaterial.blending = THREE.AdditiveBlending;
      planeMaterial.depthWrite = false;
      planeMaterial.depthTest = true;
      const plane = new THREE.Mesh(planeGeometry, planeMaterial);
      plane.scale.setScalar(4);
      plane.onBeforeRender = (renderer, scene, camera) => {
        plane.lookAt(camera.position);
      };
      sphere.add(plane);
    } else {
      this.#orbitMesh_ = await this.#buildOrbitMesh_(params);
      this.#group_.add(this.#orbitMesh_);
    }

    this.#mesh_ = sphere;

    this.#group_.add(sphere);

    //  console.log(this.#mesh_);
  }

  async #buildOrbitMesh_(params) {
    const points = [];
    const SEGMENTS = 128;
    for (let i = 0; i <= SEGMENTS; i++) {
      const angle = (i / SEGMENTS) * Math.PI * 2;
      const x = Math.cos(angle) * params.data.distance * 50.0;
      const z = Math.sin(angle) * params.data.distance * 50.0;
      points.push(new THREE.Vector3(x, 0, z));
      console.log("orbit points", points);
    }

    // const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const geometry = new MeshLineGeometry();
    geometry.setPoints(points);
    // const material = new THREE.LineBasicMaterial({
    // color: 0xfffff,
    // linewidth: 3,
    // });
    const orbitPathTexture = await this.loadTexture(
      "./resources/textures/orbit-path.png",
      true,
    );
    orbitPathTexture.anisotropy = 12;
    const material = new MeshLineMaterial({
      map: orbitPathTexture,
      useMap: true,
      color: new THREE.Color(0xffffff),
      lineWidth: 0.2,
      sizeAttenuation: 1,
      transparent: true,
      blending: THREE.AdditiveBlending,
      opacity: 0.2,
    });
    const line = new THREE.Mesh(geometry, material);
    return line;
  }

  async #createMaterial_(params) {
    if (params.data.name !== "Sun") {
      const mat = new THREE.MeshStandardMaterial({
        map: params.texture,
      });
      return mat;
    } else {
      const mat = await this.#loadShader_("sun", {
        map: { value: params.texture },
        time: { value: 0 },
      });

      return mat;
    }
  }

  async loadTexture(path, srgb) {
    return new Promise((resolve, reject) => {
      const loader = new THREE.TextureLoader();
      loader.load(path, (tex) => {
        if (srgb) tex.colorSpace = THREE.SRGBColorSpace;

        resolve(tex);
      });
    });
  }

  async #loadShader_(name, uniforms) {
    const vertexShader = await fetch(
      `./resources/shaders/${name}/vertex.glsl`,
    ).then((res) => res.text());
    const fragmentShader = await fetch(
      `./resources/shaders/${name}/fragment.glsl`,
    ).then((res) => res.text());
    //
    //   const sunVertexShaderText = await sunVertexShader.text();
    //   const sunFragmentShaderText = await sunFragmentShader.text();
    const mat = new THREE.ShaderMaterial({
      uniforms: uniforms,
      fragmentShader: fragmentShader,
      vertexShader: vertexShader,
    });
    return mat;
  }

  step(timeElapsed, totalTime) {
    //  console.log("STEP RUNNING", totalTime);

    if (this.#mesh_?.material?.uniforms?.time) {
      //  console.log("totalTime", totalTime);
      this.#mesh_.material.uniforms.time.value = totalTime;
    }
  }

  get mesh() {
    return this.#mesh_;
  }

  get group() {
    return this.#group_;
  }
}

export { PlanetObject, PlanetObjectParams };
