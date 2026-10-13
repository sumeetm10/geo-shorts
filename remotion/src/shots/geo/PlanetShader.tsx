import React, { useLayoutEffect, useRef } from 'react';
import { useCurrentFrame } from 'remotion';

// =============================================================================
// A rocky world as a WebGL fragment shader, for "Atlas on other worlds": a lit
// sphere whose surface is 3D noise sampled on the rotated sphere, with craters
// (cellular noise: dark floors, bright rims), polar caps, a haze layer and an
// atmosphere rim - each switched on per world by `look`:
//   mars     orange-red desert, dark regions, white polar caps, thin pink rim
//   moon     grey, dark maria, lots of craters, no atmosphere
//   mercury  brown-grey, heavily cratered, no atmosphere
//   titan    smooth orange haze, thick glowing atmosphere
// Same pattern as ShaderSun / NeutronShader; transparent outside the planet.
// =============================================================================
const VERT = `attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }`;
const FRAG = `
precision highp float;
uniform vec2 res; uniform float t; uniform float spin; uniform float radius;
uniform vec3 cA; uniform vec3 cB; uniform vec3 cC; uniform vec3 rim;
uniform float craters; uniform float caps; uniform float haze; uniform float atmo;
float h3(vec3 p){ return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
float n3(vec3 p){ vec3 i = floor(p), f = fract(p); vec3 u = f*f*(3.0-2.0*f);
  return mix(mix(mix(h3(i), h3(i+vec3(1,0,0)), u.x), mix(h3(i+vec3(0,1,0)), h3(i+vec3(1,1,0)), u.x), u.y),
             mix(mix(h3(i+vec3(0,0,1)), h3(i+vec3(1,0,1)), u.x), mix(h3(i+vec3(0,1,1)), h3(i+vec3(1,1,1)), u.x), u.y), u.z); }
float fbm3(vec3 p){ float v = 0.0, a = 0.5; for (int i = 0; i < 5; i++){ v += a*n3(p); p *= 2.07; a *= 0.5; } return v; }
vec3 rotY(vec3 v, float a){ float c = cos(a), s = sin(a); return vec3(c*v.x + s*v.z, v.y, -s*v.x + c*v.z); }
vec3 rotX(vec3 v, float a){ float c = cos(a), s = sin(a); return vec3(v.x, c*v.y - s*v.z, s*v.y + c*v.z); }
// craters: distance to the nearest random point in a 3D cell grid
float crater(vec3 p, out float rimv){
  vec3 i = floor(p); float best = 9.0; float rr = 0.3;
  for (int x = -1; x <= 1; x++) for (int y = -1; y <= 1; y++) for (int z = -1; z <= 1; z++) {
    vec3 c = i + vec3(float(x), float(y), float(z));
    vec3 o = vec3(h3(c), h3(c + 4.1), h3(c + 9.7));
    float d = length(p - c - o);
    if (d < best) { best = d; rr = 0.18 + 0.3 * h3(c + 2.3); }
  }
  rimv = smoothstep(rr * 0.75, rr, best) * (1.0 - smoothstep(rr, rr * 1.25, best));
  return 1.0 - smoothstep(rr * 0.6, rr * 0.95, best);          // 1 inside the bowl
}
void main(){
  vec2 uv = (gl_FragCoord.xy - 0.5*res) / (0.5*res.y);
  float R = radius; float r = length(uv);
  vec3 L = normalize(vec3(-0.55, 0.45, 0.7));
  vec4 outc = vec4(0.0);
  if (r < R) {
    vec3 n = vec3(uv / R, sqrt(1.0 - (r*r)/(R*R)));
    vec3 q = rotY(rotX(n, 0.25), -t * spin);
    float f = fbm3(q * 2.6);
    float g = fbm3(q * 9.0 + 3.0);
    vec3 col = mix(cA, cB, smoothstep(0.35, 0.72, f));
    col = mix(col, cC, smoothstep(0.55, 0.75, fbm3(q * 1.3 + 7.0)) * 0.8);   // dark regions / maria
    col *= 0.85 + 0.3 * g;
    if (craters > 0.0) {
      float rim1, rim2;
      float b1 = crater(q * 5.0, rim1); float b2 = crater(q * 13.0 + 1.7, rim2);
      col *= 1.0 - craters * (0.28 * b1 + 0.18 * b2);
      col += craters * (0.22 * rim1 + 0.12 * rim2) * vec3(1.0);
    }
    if (caps > 0.0) {
      float cap = smoothstep(0.80, 0.9, abs(q.y) + 0.06 * (fbm3(q * 6.0) - 0.5));
      col = mix(col, vec3(0.95, 0.95, 0.97), cap * caps);
    }
    if (haze > 0.0) {
      float band = 0.5 + 0.5 * sin(q.y * 9.0 + 2.0 * fbm3(q * 2.0));
      col = mix(col, mix(cA, cB, band * 0.6), haze);
    }
    float dif = max(dot(n, L), 0.0);
    float light = 0.06 + 0.94 * smoothstep(-0.05, 0.6, dif);
    col *= light;
    col += rim * atmo * pow(1.0 - n.z, 3.0) * 1.2 * (0.3 + 0.7 * dif);
    outc = vec4(col, 1.0);
  } else if (atmo > 0.0) {
    float gl = exp(-(r - R) / (0.035 * R + 0.06 * R * haze)) * atmo;
    vec2 dn = uv / r; float lit = 0.35 + 0.65 * max(dot(vec3(dn, 0.0), L), 0.0);
    outc = vec4(rim * gl * lit, clamp(gl * lit, 0.0, 1.0));
  }
  gl_FragColor = outc;
}`;

const LOOKS: Record<string, { cA: number[]; cB: number[]; cC: number[]; rim: number[]; craters: number; caps: number; haze: number; atmo: number }> = {
  mars: { cA: [0.62, 0.27, 0.14], cB: [0.86, 0.5, 0.3], cC: [0.36, 0.17, 0.11], rim: [1.0, 0.6, 0.45], craters: 0.15, caps: 1, haze: 0, atmo: 0.5 },
  moon: { cA: [0.6, 0.6, 0.6], cB: [0.78, 0.77, 0.75], cC: [0.3, 0.3, 0.32], rim: [0, 0, 0], craters: 1, caps: 0, haze: 0, atmo: 0 },
  mercury: { cA: [0.5, 0.45, 0.4], cB: [0.66, 0.6, 0.54], cC: [0.36, 0.33, 0.3], rim: [0, 0, 0], craters: 1.1, caps: 0, haze: 0, atmo: 0 },
  titan: { cA: [0.85, 0.58, 0.22], cB: [0.95, 0.75, 0.38], cC: [0.6, 0.38, 0.15], rim: [1.0, 0.7, 0.3], craters: 0, caps: 0, haze: 0.85, atmo: 1 },
};

export const PlanetShader: React.FC<{ x: number; y: number; size: number; look: string; res?: number; radius?: number; spin?: number; ground?: boolean }> = ({
  x, y, size, look, res = 380, radius = 0.42, spin = 0.06, ground = false }) => {
  const f = useCurrentFrame();
  const ref = useRef<HTMLCanvasElement>(null);
  const L = LOOKS[look] ?? LOOKS.moon;
  useLayoutEffect(() => {
    const c = ref.current; if (!c) return;
    const gl = c.getContext('webgl', { preserveDrawingBuffer: true, premultipliedAlpha: false, alpha: true }); if (!gl) return;
    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
    const sh = (type: number, src: string) => { const s = gl.createShader(type)!; gl.shaderSource(s, src); gl.compileShader(s); return s; };
    const pr = gl.createProgram()!; gl.attachShader(pr, sh(gl.VERTEX_SHADER, VERT)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(pr); gl.useProgram(pr);
    const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    gl.viewport(0, 0, res, res);
    const u = (n: string) => gl.getUniformLocation(pr, n);
    gl.uniform2f(u('res'), res, res);
    gl.uniform1f(u('t'), f / 30); gl.uniform1f(u('spin'), spin); gl.uniform1f(u('radius'), radius);
    gl.uniform3f(u('cA'), L.cA[0], L.cA[1], L.cA[2]); gl.uniform3f(u('cB'), L.cB[0], L.cB[1], L.cB[2]);
    gl.uniform3f(u('cC'), L.cC[0], L.cC[1], L.cC[2]); gl.uniform3f(u('rim'), L.rim[0], L.rim[1], L.rim[2]);
    gl.uniform1f(u('craters'), L.craters); gl.uniform1f(u('caps'), ground ? 0 : L.caps);   // seen up close the top edge is a pole - no ice cap underfoot gl.uniform1f(u('haze'), L.haze); gl.uniform1f(u('atmo'), L.atmo);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }, [f, res, radius, spin, look, ground]);
  return <canvas ref={ref} width={res} height={res} style={{ position: 'absolute', left: x - size / 2, top: y - size / 2, width: size, height: size }} />;
};
