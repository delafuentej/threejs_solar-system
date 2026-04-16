import * as THREE from "three";

import { PlanetObject, PlanetObjectParams } from "./planet-object.js";

import { App } from "./app.js";

class SolarSystemProject extends App {
  #objects_ = [];
  constructor() {
    super();
  }

  async onSetupProject(pane) {
    this.Scene.background = await this.loadTexture(
      "/resources/textures/crab-nebula.png",
    );
    this.Scene.background.mapping = THREE.EquirectangularReflectionMapping;

    const planetDataArr = await fetch("./resources/planets.json").then((res) =>
      res.json(),
    );
    console.log(planetDataArr);

    for (let i = 0; i < planetDataArr.length; i++) {
      const currentPlanet = planetDataArr[i];

      const planetObjectParams = new PlanetObjectParams();
      planetObjectParams.name = currentPlanet.name;
      planetObjectParams.texture = await this.loadTexture(
        `./resources/textures/2k_${currentPlanet.texture}.jpg`,
        true,
      );
      planetObjectParams.data = currentPlanet;

      const planetObject = new PlanetObject();
      await planetObject.initialize(planetObjectParams);

      this.#objects_.push(planetObject);

      this.Scene.add(planetObject.group);
    }

    //lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.Scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffffff, 1, 0, 0);
    this.Scene.add(pointLight);
  }

  onStep(timeElapsed, totalTime) {
    for (let i = 0; i < this.#objects_.length; i++) {
      this.#objects_[i].step(timeElapsed, totalTime);
    }
  }
}

let APP_ = new SolarSystemProject();

window.addEventListener("DOMContentLoaded", async () => {
  await APP_.initialize();
});
