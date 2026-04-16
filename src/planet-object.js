import * as THREE from "three";
import { Object } from "./object";

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
    }

    this.#mesh_ = sphere;

    console.log(this.#mesh_);
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
}

export { PlanetObject, PlanetObjectParams };
