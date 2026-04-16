import * as THREE from 'three';

import { App } from './app.js';


class SolarSystemProject extends App {
  constructor() {
    super();
  }

  async onSetupProject(pane) {
  }

  onStep(timeElapsed, totalTime) {
  }
}


let APP_ = new SolarSystemProject();

window.addEventListener('DOMContentLoaded', async () => {
  await APP_.initialize();
});
