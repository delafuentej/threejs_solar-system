import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { Object } from "./object";
import * as MATH from "./math.js";

const MAX_DISTANCE = 50;

class CameraChangeObject extends Object {
  #controls_ = null;
  #camera_ = null;
  #threejs_ = null;
  #target_ = null;
  #timer_ = 0;
  constructor(camera, three) {
    super();

    this.#camera_ = camera;
    this.#threejs_ = three;
    this.#controls_ = this.#createControls_();
  }
  #createControls_() {
    const controls = new OrbitControls(
      this.#camera_,
      this.#threejs_.domElement,
    );
    controls.enableDamping = true;
    controls.minDistance = 1;
    controls.maxDistance = MAX_DISTANCE;
    if (this.#target_) {
      controls.target.copy(this.#target_.mesh.position);
    }
    controls.update();

    return controls;
  }

  isBusy() {
    return this.#controls_ === null;
  }

  lerpTo(target) {
    if(this.#target_ === target) return;
    this.#target_ = target;
    this.#timer_ = 0;
    if (this.#controls_) {
      this.#controls_.dispose();
      this.#controls_ = null;
    }
  }

  step(timeElapsed, totalTime) {
    if (!this.#controls_) {
      this.#timer_ += timeElapsed;
      const t = MATH.smoothstep(0, 2, this.#timer_);

      const cameraPos = this.#camera_.position;
      const targetPos = this.#target_.mesh.position;

      const dummyCam = new THREE.Camera();
      dummyCam.position.copy(cameraPos);
      dummyCam.lookAt(targetPos);

      const distance = cameraPos.distanceTo(targetPos);
      if (distance > MAX_DISTANCE) {
        const distanceToTarget = targetPos.clone().sub(cameraPos).normalize();
        const maxPosition = targetPos
          .clone()
          .add(distanceToTarget.multiplyScalar(-MAX_DISTANCE));

        this.#camera_.position.lerp(maxPosition, t);
      }
      this.#camera_.quaternion.slerp(dummyCam.quaternion, t);

      if (t === 1) {
        this.#controls_ = this.#createControls_();
      }
    } else {
      if (this.#target_) {
        this.#controls_.target.copy(this.#target_.mesh.position);
      }
      this.#controls_.update(timeElapsed);
    }
  }
}

export { CameraChangeObject };
