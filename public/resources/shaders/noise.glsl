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