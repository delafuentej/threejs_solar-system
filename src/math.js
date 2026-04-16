import * as THREE from "three";

import MersenneTwister from "mersennetwister";

const MT_ = new MersenneTwister(1);

function saturate(v) {
  return Math.min(1, Math.max(0, v));
}

function inverseLerp(a, b, v) {
  return saturate((v - a) / (b - a));
}

function remap(a, b, c, d, v) {
  return c + (d - c) * inverseLerp(a, b, v);
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function smoothstep(a, b, t) {
  const x = saturate((t - a) / (b - a));
  return x * x * (3 - 2 * x);
}

function clamp(v, min, max) {
  return Math.min(max, Math.max(min, v));
}

function random() {
  return MT_.random();
}

function seed(s) {
  MT_.seed(s);
}


export {
  random, lerp, smoothstep, remap, clamp, saturate, inverseLerp, seed
};