class InputManager {
  #keys_ = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    space: false,
  };

  #pointer_ = {
    x: 0,
    y: 0,
    right: false,
    left: false,
  };

  #previousPointer_ = {
    x: 0,
    y: 0,
    right: false,
    left: false,
  };

  #previousKeys_ = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    space: false,
  };

  #mapping_ = {
    87: "forward",
    83: "backward",
    65: "left",
    68: "right",
    38: "forward",
    40: "backward",
    37: "left",
    39: "right",
    32: "space",
  };

  constructor() {}

  initialize() {
    window.addEventListener("keydown", (e) => {
      this.#onKeyDown_(e);
    });
    window.addEventListener("keyup", (e) => {
      this.#onKeyUp_(e);
    });
    window.addEventListener("pointermove", (e) => {
      this.#pointer_.x = (e.clientX / window.innerWidth) * 2 - 1;
      this.#pointer_.y = -(e.clientY / window.innerHeight) * 2 + 1;
    });
    window.addEventListener("pointerdown", (e) => {
      this.#onPointerDown_(e);
    });
    window.addEventListener("pointerup", (e) => {
      this.#onPointerUp_(e);
    });
  }

  step(timeElapsed) {
    // Copy current state into previous state
    this.#previousKeys_ = { ...this.#keys_ };
    this.#previousPointer_ = { ...this.#pointer_ };
  }

  get Pointer() {
    return this.#pointer_;
  }
  get PrevPointer() {
    return this.#previousPointer_;
  }

  get Actions() {
    return this.#keys_;
  }

  get PrevActions() {
    return this.#previousKeys_;
  }
  #onPointer_(e, b) {
    if (e.button === 0) {
      this.#pointer_.left = b;
    }
    if (e.button === 2) {
      this.#pointer_.right = b;
    }
  }

  #onPointerDown_(e) {
    this.#onPointer_(e, true);
  }
  #onPointerUp_(e) {
    this.#onPointer_(e, false);
  }

  #onKey(e, b) {
    const key = this.#mapping_[e.keyCode];
    if (key) {
      this.#keys_[key] = b;
    }
  }

  #onKeyUp_(e) {
    this.#onKey(e, false);
  }

  #onKeyDown_(e) {
    this.#onKey(e, true);
  }
}

export { InputManager };
