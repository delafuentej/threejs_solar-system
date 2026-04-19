import * as THREE from "three";
import { Object } from "./object";
import { MeshLineGeometry, MeshLineMaterial } from "meshline";
import { KTX2Loader } from "three/addons/loaders/KTX2Loader.js";
import RAPIER from "@dimforge/rapier3d-compat";


const DIST_MULTIPLIER = 50.0;

class PlanetObjectParams {
  name = "";
  texture = null;
  data = null;
  physics = null;
    textureLoader_ = null;
  //   radius = 0;
  //   distance = 0;
  //   orbitTime = 0;
  //   description = "";
}

class PlanetObject extends Object {
  #mesh_ = null;
  #orbitMesh_ = null;
  #group_ = new THREE.Group();
  #rigidBody_ = null;
  #collider_ = null;
  #data_ = null;
  #loader_ = null;
  #angle_ = 0.0;
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

    this.#data_ = params.data;
    this.#loader_ = params.textureLoader;

    if (params.data.name === "Sun") {
      const planeGeometry = new THREE.PlaneGeometry(1, 1);
      const planeMaterial = await this.#loadShader_("sun-corona", {
        map: {
          value: await this.#loadTexture(
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

    this.#mesh_.name = params.data.name;

   

   

    // to create a physics object
    const rigidBodyDesc = RAPIER.RigidBodyDesc.fixed();
    rigidBodyDesc.setTranslation(
      this.#mesh_.position.x,
      this.#mesh_.position.y,
      this.#mesh_.position.z,
    );

    const rigidBody = params.physics.createRigidBody(rigidBodyDesc);
    const colliderDesc = RAPIER.ColliderDesc.ball(params.data.radius);
    const collider = params.physics.createCollider(colliderDesc, rigidBody);

    this.#rigidBody_ = rigidBody;
    this.#collider_ = collider;

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
      // console.log("orbit points", points);
    }

    // const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const geometry = new MeshLineGeometry();
    geometry.setPoints(points);
    // const material = new THREE.LineBasicMaterial({
    // color: 0xfffff,
    // linewidth: 3,
    // });
    const orbitPathTexture = await this.#loadTexture(
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
    material.depthTest = true;
    material.depthWrite = false;
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
  async loadKTX2(path, srgb) {
  return new Promise((resolve, reject) => {
    const loader = new KTX2Loader();
    loader.load(path, (tex) => {
      if (srgb) {
        tex.colorSpace = THREE.SRGBColorSpace;
      }
      resolve(tex);
    });
  });
}
async #loadTexture(url, srgb) {
    return  this.#loader_.loadTexture(url, srgb);
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

  setHighlighted() {
    if (this.#orbitMesh_) {
      this.#orbitMesh_.material.color.setRGB(16, 1, 1);
      this.#orbitMesh_.material.opacity = 1;
      this.#orbitMesh_.material.lineWidth = this.#data_.radius * 0.5;
      this.#orbitMesh_.material.needsUpdate = true;
    }

    const title = document.getElementById("planet-info-title");
    title.innerText = this.#data_.name;
    const desc = document.getElementById("planet-info-description");
    desc.innerText = this.#data_.description;
    // console.log("hit planet:", this.#mesh_.name);
    // if (this.#mesh_.material.emissive) {
    // this.#mesh_.material.emissive.set(0xff0000);
    // }
  }

  onRayCast(hit) {
    if (hit.collider.handle === this.#collider_.handle) {
      if (this.#orbitMesh_) {
        this.setHighlighted();
      }
      return true;
    } else {
      if (this.#orbitMesh_) {
        this.#orbitMesh_.material.color.setRGB(1, 1, 1);
        this.#orbitMesh_.material.opacity = 0.1;
        this.#orbitMesh_.material.lineWidth = this.#data_.radius * 0.25;
        this.#orbitMesh_.material.needsUpdate = true;
        // if (this.#mesh_.material.emissive) {
        // this.#mesh_.material.emissive.set(0x000000);
        // }
      }
      return false;
    }
  }

  step(timeElapsed, totalTime) {
    //  console.log("STEP RUNNING", totalTime);

    timeElapsed = 0;

    if (this.#mesh_?.material?.uniforms?.time) {
      //  console.log("totalTime", totalTime);
      this.#mesh_.material.uniforms.time.value = totalTime;
    }

    if(this.#data_.orbitTime == 0) return;
    this.#angle_ += timeElapsed * 0.1 / this.#data_.orbitTime;

    const a = this.#data_.distance;
    const b = this.#data_.distance;

    this.#mesh_.position.set(
      a * Math.cos(this.#angle_) * DIST_MULTIPLIER,
      0,
      b * Math.sin(this.#angle_) * DIST_MULTIPLIER
    )

    const v = new RAPIER.Vector3(
      this.#mesh_.position.x, this.#mesh_.position.y, this.#mesh_.position.z
    );
    this.#collider_.setTranslation(v);
  }

  get mesh() {
    return this.#mesh_;
  }

  get group() {
    return this.#group_;
  }
}

export { PlanetObject, PlanetObjectParams };
