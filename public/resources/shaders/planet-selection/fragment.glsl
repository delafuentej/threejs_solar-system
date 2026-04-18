uniform sampler2D map;
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;


void main(){

    vec3 viewDir = normalize(cameraPosition - vPosition);
    vec3 normal = normalize(vNormal);

    // fresnel
    float fresnel = pow(1.0 - dot(normal, viewDir), 1.0);
    vec4 mapSample = texture2D(map, vUv);

    vec4 finalColor = mapSample;

    finalColor.xyz = mapSample.xyz * mapSample.xyz * mix(vec3(0.5, 0.0, 1.0), vec3(0.0,0.0, 1.0), fresnel);
    finalColor.a = fresnel;
    gl_FragColor = finalColor;
}