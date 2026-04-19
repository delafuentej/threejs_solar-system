import * as THREE from "three";
import RAPIER from "@dimforge/rapier3d-compat";
import { PlanetObject, PlanetObjectParams } from "./planet-object.js";
import {Lensflare, LensflareElement} from "three/addons/objects/Lensflare.js"
import {CameraChangeObject} from "./camera-change-object"
import { InputManager } from "./input-manager.js";

import { App } from "./app.js";

class SolarSystemProject extends App {
  #objects_ = [];
  #inputManager_ = new InputManager();
  #physicsTimeAcc_ = null;
  #rapierWorld_ = 0.0;
  #selectionMesh_ = null;
  #cameraChange_ = null;
  //  #targetPlanet_ = null;

  constructor() {
    super();
  }

  async onSetupProject(pane) {
    this.#inputManager_.initialize();

    // console.log(this.#inputManager_);
    this.#cameraChange_ = new CameraChangeObject(this.Camera, this.Renderer);
    this.#objects_.push(this.#cameraChange_);

    await this.#setupPhysics_();
    await this.#setupScene_();
    await this.#loadPlanets_();
    await this.#loadSelection_();
    await this.#loadPlanets_();
  }

  async #setupScene_() {
    this.Scene.background = await this.loadTexture(
      "/resources/textures/crab-nebula.png",
    );
    this.Scene.background.mapping = THREE.EquirectangularReflectionMapping;

    //lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.Scene.add(ambientLight);
    const pointLight = new THREE.PointLight(0xffffff, 1, 0, 0);
    this.Scene.add(pointLight);
  }

  async #loadSelection_() {
    this.#selectionMesh_ = await this.loadGLTF(
      "./resources/models/planet-selection.glb",
    );
    // console.log(this.#selectionMesh_);
    this.#selectionMesh_.scale.setScalar(4);
    this.#selectionMesh_.children[0].material = await this.loadShader_(
      "planet-selection",
      {
        map: {
          value: await this.loadTexture(
            "./resources/textures/planet-selection.png",
            true,
          ),
        },
      },
    );
    this.#selectionMesh_.children[0].material.transparent = true;
    this.#selectionMesh_.children[0].material.depthWrite = false;
    this.#selectionMesh_.children[0].material.depthTest = true;
    this.#selectionMesh_.children[0].material.blending = THREE.AdditiveBlending;
    this.#selectionMesh_.visible = false;
    //this.Scene.add(this.#selectionMesh_);
  }

  async #loadPlanets_() {
    const planetDataArr = await fetch("./resources/planets.json").then((res) =>
      res.json(),
    );

    const planets = {};
    //console.log(planetDataArr);
    for (let i = 0; i < planetDataArr.length; i++) {
      const currentPlanet = planetDataArr[i];
      const planetObjectParams = new PlanetObjectParams();
      planetObjectParams.name = currentPlanet.name;
      planetObjectParams.texture = await this.loadTexture(
        `./resources/textures/2k_${currentPlanet.texture}.jpg`,
        true,
      );
      planetObjectParams.data = currentPlanet;
      //physics world
      planetObjectParams.physics = this.#rapierWorld_;

      planetObjectParams.textureLoader = this;
      const planetObject = new PlanetObject();
      await planetObject.initialize(planetObjectParams);
      this.#objects_.push(planetObject);
      this.Scene.add(planetObject.group);

      planets[currentPlanet["name"]] = planetObject;
      console.log("xxxxxx", (planets[currentPlanet.name] = planetObject));
      console.log("planets", planets);
    }
    this.#selectedObject_(planets["Sun"]);
    //  console.log.log(this.#targetPlanet_(planets["Sun"]));

    //lens flare

  }

  async #setupPhysics_() {
    await RAPIER.init();

    const gravity = new RAPIER.Vector3(0.0, 0.0, 0.0);
    this.#rapierWorld_ = new RAPIER.World(gravity);
  }

  #stepPhysics_(timeElapsed) {
    this.#physicsTimeAcc_ += timeElapsed;
    const TIMESTEP = this.#rapierWorld_.timestep;
    const MAX_STEPS = 5;
    const eventQueue = new RAPIER.EventQueue();
    let steps = 0;
    while (this.#physicsTimeAcc_ >= TIMESTEP) {
      this.#physicsTimeAcc_ -= TIMESTEP;
      this.#rapierWorld_.step(eventQueue);
      steps++;
      if (steps >= MAX_STEPS) {
        this.#physicsTimeAcc_ = 0;
        break;
      }
    }
    eventQueue.drainCollisionEvents((handle1, handle2, started) => {});
    eventQueue.free();
  }

  #castRay_() {
    if (this.#cameraChange_.isBusy()) return;
    const pointer = this.#inputManager_.Pointer;
    const prevPointer = this.#inputManager_.PrevPointer;
    if (!pointer.left && prevPointer.left) {
      const direction = new THREE.Vector3(pointer.x, pointer.y, 0.5);
      direction.unproject(this.Camera);
      direction.sub(this.Camera.position).normalize();
      const ray = new RAPIER.Ray(
        {
          x: this.Camera.position.x,
          y: this.Camera.position.y,
          z: this.Camera.position.z,
        },
        { x: direction.x, y: direction.y, z: direction.z },
      );
      const hit = this.#rapierWorld_.castRay(ray, 1000.0, true);
      if (hit) {
        console.log("hit", hit);
        for (let i = 0; i < this.#objects_.length; i++) {
          if (this.#objects_[i].onRayCast(hit)) {
            this.#selectedObject_(this.#objects_[i]);
          }
        }
      } else {
        console.log("no hit");
      }
    }
  }

  #selectedObject_(obj) {
    if (this.#selectionMesh_) {
      this.#selectionMesh_.removeFromParent();
      this.#selectionMesh_.scale.setScalar(1.31);
      this.#selectionMesh_.visible = true;
      obj.mesh.add(this.#selectionMesh_);
      obj.setHighlighted();
      this.#cameraChange_.lerpTo(obj);
    }
  }

  onStep(timeElapsed, totalTime) {
    this.#stepPhysics_(timeElapsed);
    this.#castRay_();
    for (let i = 0; i < this.#objects_.length; i++) {
      this.#objects_[i].step(timeElapsed, totalTime);
    }

    // console.log(this.#inputManager_.Pointer);
    // console.log(this.#inputManager_.PrevPointer);

    this.#inputManager_.step(timeElapsed);
  }
}

let APP_ = new SolarSystemProject();

window.addEventListener("DOMContentLoaded", async () => {
  await APP_.initialize();
});
