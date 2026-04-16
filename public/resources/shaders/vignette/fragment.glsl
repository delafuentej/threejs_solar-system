precision highp float;


in vec2 vUv;


uniform sampler2D tDiffuse;
uniform float time;
uniform float intensity;
uniform float dropoff;
uniform sampler2D lensDirt;


float inverseLerp(float v, float minValue, float maxValue) {
  return (v - minValue) / (maxValue - minValue);
}


float remap(float v, float inMin, float inMax, float outMin, float outMax) {
  float t = inverseLerp(v, inMin, inMax);
  return mix(outMin, outMax, t);
}


vec2 fisheyeDistortion(vec2 uv, float strength) {
  vec2 centeredUV = uv * 2.0 - 1.0;
  
  float r = length(centeredUV);
  
  float theta = atan(centeredUV.y, centeredUV.x);
  float distortedR = pow(r, strength);
  
  vec2 distortedUV = vec2(cos(theta), sin(theta)) * distortedR;
  
  distortedUV = (distortedUV + 1.0) * 0.5;
  
  return distortedUV;
}


float vignette(vec2 uvs) {
  float v1 = smoothstep(0.5, 0.3, abs(uvs.x - 0.5));
  float v2 = smoothstep(0.5, 0.3, abs(uvs.y - 0.5));
  float v = v1 * v2;
  v = pow(v, dropoff);
  v = remap(v, 0.0, 1.0, intensity, 1.0);
  return v;
}


float COLOUR_DODGE_(float base, float blend) {
  return (blend == 1.0) ? blend : min(base / (1.0 - blend), 1.0);
}


vec3 COLOUR_DODGE(vec3 base, vec3 blend) {
  return vec3(
      COLOUR_DODGE_(base.r, blend.r),
      COLOUR_DODGE_(base.g, blend.g),
      COLOUR_DODGE_(base.b, blend.b));
}


float COLOUR_OVERLAY(float base, float blend) {
	return base<0.5?(2.0*base*blend):(1.0-2.0*(1.0-base)*(1.0-blend));
}


vec3 COLOUR_OVERLAY(vec3 base, vec3 blend) {
	return vec3(COLOUR_OVERLAY(base.r,blend.r),COLOUR_OVERLAY(base.g,blend.g),COLOUR_OVERLAY(base.b,blend.b));
}


float COLOUR_SCREEN(float base, float blend) {
	return 1.0-((1.0-base)*(1.0-blend));
}


vec3 COLOUR_SCREEN(vec3 base, vec3 blend) {
	return vec3(COLOUR_SCREEN(base.r,blend.r),COLOUR_SCREEN(base.g,blend.g),COLOUR_SCREEN(base.b,blend.b));
}


vec3 COLOUR_SCREEN(vec3 base, vec3 blend, float opacity) {
	return (COLOUR_SCREEN(base, blend) * opacity + base * (1.0 - opacity));
}


void main() {
  vec2 uv = vUv;
  vec4 texel = texture(tDiffuse, uv);
  
  float darkening = vignette(uv);


  vec3 finalColour = texel.xyz * darkening;


  // Perform colour dodge using lens dirt texture
  vec4 lensDirtSample = texture(lensDirt, uv);
  
  // Apply colour dodge
  // finalColour.xyz = COLOUR_DODGE(finalColour.xyz, lensDirtSample.xyz);
  // finalColour.xyz = mix(finalColour.xyz, COLOUR_SCREEN(finalColour.xyz, lensDirtSample.xyz), 0.02);
  // finalColour.xyz = COLOUR_SCREEN(finalColour.xyz, lensDirtSample.xyz, 0.1);


  pc_fragColor = vec4(finalColour, texel.w);
}