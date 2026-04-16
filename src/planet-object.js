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
    const sphereMaterial = new THREE.MeshBasicMaterial({
      map: params.texture,
    });
    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    sphere.position.set(params.data.distance * 10, 0, 0);
    sphere.scale.set(
      params.data.radius,
      params.data.radius,
      params.data.radius,
    );
    this.#mesh_ = sphere;
  }

  step(timeElapsed, totalTime) {}

  get mesh() {
    return this.#mesh_;
  }
}

export { PlanetObject, PlanetObjectParams };
