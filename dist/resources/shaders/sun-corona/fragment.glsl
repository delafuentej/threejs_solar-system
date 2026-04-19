varying vec2 vUv;

uniform sampler2D map;

uint murmurHash12(uvec2 src) {
    const uint M = 0x5bd1e995u;
    uint h = 1190494759u;
    src *= M; src ^= src>>24u; src *= M;
    h *= M; h ^= src.x; h *= M; h ^= src.y;
    h ^= h>>13u; h *= M; h ^= h>>15u;
    return h;
}

// 1 output, 2 inputs
float hash12(vec2 src) {
    uint h = murmurHash12(floatBitsToUint(src));
    return uintBitsToFloat(h & 0x007fffffu | 0x3f800000u) - 1.0;
}

float noise12(vec2 p) {
  vec2 i = floor(p);

  vec2 f = fract(p);
  vec2 u = smoothstep(vec2(0.0), vec2(1.0), f);

	float val = mix( mix( hash12( i + vec2(0.0, 0.0) ), 
                        hash12( i + vec2(1.0, 0.0) ), u.x),
                   mix( hash12( i + vec2(0.0, 1.0) ), 
                        hash12( i + vec2(1.0, 1.0) ), u.x), u.y);
  return val * 2.0 - 1.0;
}




void main () {
    // vec2 uv = vUv;
    // vec2 coords = uv - 0.5;
    // float r = length(coords);
    // float t = atan(coords.y, coords.x);
    // float noiseSample = noise12(vec2(r, t * 30.0)) * 0.5 + 0.5;
    // float falloff = smoothstep(0.35, 0.25, r);

    // vec4 mapSample = texture2D(map, vUv);
    // float corona = smoothstep(0.2, 1.0, mapSample.x);
    // float dist = length(vUv - 0.5) - 0.25;
    // float falloff = exp(-45.0 * dist);
    // vec3 colour = vec3(falloff * corona);

    vec3 YELLOW = vec3(1.0, 0.5, 0.2);

    float corona = 0.0;
    for(float i = 0.0; i < 4.0; i++){
        float angle = i * 3.14159 / 2.0;
        mat2 rot = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
        vec2 uv = (vUv - 0.5) * rot + 0.5;
        vec4 mapSample = texture2D(map, uv);
        corona += smoothstep(0.2, 1.0, mapSample.x);
    }
    float dist = length(vUv - 0.5) - 0.25;
    float falloff = exp(-35.0 * dist);
    vec3 colour = vec3(falloff * corona * YELLOW);

    gl_FragColor = vec4(colour, 1.0);
}