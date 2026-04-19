varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;

uniform sampler2D map;
uniform float time;

// Taken from: https://www.shadertoy.com/view/ttc3zr
//------------------------------------------------------------------------------

uint murmurHash14(uvec4 src) {
    const uint M = 0x5bd1e995u;
    uint h = 1190494759u;
    src *= M; src ^= src>>24u; src *= M;
    h *= M; h ^= src.x; h *= M; h ^= src.y; h *= M; h ^= src.z; h *= M; h ^= src.w;
    h ^= h>>13u; h *= M; h ^= h>>15u;
    return h;
}

// 1 output, 4 inputs
float hash14(vec4 src) {
    uint h = murmurHash14(floatBitsToUint(src));
    return uintBitsToFloat(h & 0x007fffffu | 0x3f800000u) - 1.0;
}

float noise14(vec4 x) {
  vec4 i = floor(x);
  vec4 f = fract(x);
  // f = f*f*(3.0-2.0*f);

  float v1 = mix(mix(mix( hash14(i+vec4(0.0, 0.0, 0.0, 0.0)), 
                          hash14(i+vec4(1.0, 0.0, 0.0, 0.0)),f.x),
                     mix( hash14(i+vec4(0.0, 1.0, 0.0, 0.0)), 
                          hash14(i+vec4(1.0, 1.0, 0.0, 0.0)),f.x),f.y),
                 mix(mix( hash14(i+vec4(0.0, 0.0, 1.0, 0.0)), 
                          hash14(i+vec4(1.0, 0.0, 1.0, 0.0)),f.x),
                     mix( hash14(i+vec4(0.0, 1.0, 1.0, 0.0)), 
                          hash14(i+vec4(1.0, 1.0, 1.0, 0.0)),f.x),f.y),f.z);

  float v2 = mix(mix(mix( hash14(i+vec4(0.0, 0.0, 0.0, 1.0)), 
                          hash14(i+vec4(1.0, 0.0, 0.0, 1.0)),f.x),
                     mix( hash14(i+vec4(0.0, 1.0, 0.0, 1.0)), 
                          hash14(i+vec4(1.0, 1.0, 0.0, 1.0)),f.x),f.y),
                 mix(mix( hash14(i+vec4(0.0, 0.0, 1.0, 1.0)), 
                          hash14(i+vec4(1.0, 0.0, 1.0, 1.0)),f.x),
                     mix( hash14(i+vec4(0.0, 1.0, 1.0, 1.0)), 
                          hash14(i+vec4(1.0, 1.0, 1.0, 1.0)),f.x),f.y),f.z);

  return mix(v1, v2, f.w);
}

float FBM_1_4(vec4 p, int octaves, float persistence, float lacunarity) {
  float amplitude = 1.0;
  float frequency = 1.0;
  float total = 0.0;
  float normalization = 0.0;

  for (int i = 0; i < octaves; ++i) {
    float noiseValue = noise14(p * frequency);
    total += noiseValue * amplitude;
    normalization += amplitude;
    amplitude *= persistence;
    frequency *= lacunarity;
  }

  total /= normalization;

  return total;
}

float sat(float v) {
  return clamp(v, 0.0, 1.0);
}

float inverseLerp(float v, float minValue, float maxValue) {
  return (v - minValue) / (maxValue - minValue);
}

float remap(float v, float inMin, float inMax, float outMin, float outMax) {
  float t = inverseLerp(v, inMin, inMax);
  return mix(outMin, outMax, t);
}


void main() {
  vec3 viewDir = normalize(cameraPosition - vPosition);
  vec3 normal = normalize(vNormal);

  vec4 mapSample = texture2D(map, vUv);

  vec3 YELLOW = vec3(1.0, 1.0, 0.5);
  vec3 BLACK = vec3(0.0, 0.0, 0.0);
  vec3 RED = vec3(1.0, 0.0, 0.0);

vec3 p = vPosition * 3.0 + vec3(time * 0.3);

  float noiseSample = FBM_1_4(vec4(vPosition * 20.0, time * 0.6), 4, 0.5, 2.0);
  noiseSample = smoothstep(0.2, 1.0, noiseSample);
  vec3 noiseColour = mix(BLACK, RED, sat(remap(noiseSample, 0.45, 0.5, 0.0, 1.0)));
  noiseColour = mix(noiseColour, YELLOW, sat(remap(noiseSample, 0.5, 1.0, 0.0, 1.0)));

  mapSample.rgb = mapSample.rgb * noiseColour + mapSample.rgb * 0.75;

  // Fresnel
  float fresnel = pow(1.0 - dot(normal, viewDir), 2.0);

  mapSample.rgb = mapSample.rgb * mix(1.0, 50.0, fresnel) + fresnel * YELLOW * 2.0;

  gl_FragColor = mapSample;

}

