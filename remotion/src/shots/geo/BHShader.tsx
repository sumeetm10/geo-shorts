import React, { useLayoutEffect, useRef } from 'react';
import { useCurrentFrame } from 'remotion';

// =============================================================================
// A ray-traced black hole as a WebGL fragment shader. Every pixel's light ray
// is stepped through the black hole's gravity (the classic Schwarzschild
// photon-bending trick, units where the horizon radius = 1), so the starfield
// and the accretion disk behind the hole are really lensed: the far side of
// the disk shows up as the arc over the top and under the bottom, and there is
// a true shadow with a photon ring. The disk spins (inner parts faster) and its
// approaching side is brighter (Doppler beaming).
//   tilt   camera angle above the disk plane, radians (0.1 = edge-on, 1.4 = top-down)
//   dist   camera distance in horizon radii
//   photo  0..1 recolours to a single orange and blurs - the look of the
//          Event Horizon Telescope image, recreated in code
// Rendered at `res` and scaled up; the laptop runs WebGL in software.
// =============================================================================
const VERT = `attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }`;
const FRAG = `
precision highp float;
uniform vec2 res; uniform float t; uniform float tilt; uniform float dist; uniform float photo; uniform float spin;
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float hash3(vec3 p){ return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
float noise(vec2 p){ vec2 i = floor(p), f = fract(p); vec2 u = f*f*(3.0-2.0*f);
  return mix(mix(hash(i), hash(i+vec2(1,0)), u.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), u.x), u.y); }
float fbm(vec2 p){ float v = 0.0, a = 0.5; for (int i = 0; i < 4; i++){ v += a*noise(p); p *= 2.07; a *= 0.5; } return v; }
vec3 stars(vec3 d){
  vec3 q = d * 90.0; vec3 c = floor(q); float h = hash3(c);
  float s = 0.0;
  if (h > 0.985) { vec3 o = vec3(hash3(c+1.3), hash3(c+2.1), hash3(c+3.7)); float k = length(q - c - o); s = smoothstep(0.35, 0.0, k) * (h - 0.985) * 66.0; }
  float band = exp(-12.0 * d.y * d.y) * 0.10 * fbm(vec2(atan(d.z, d.x) * 6.0, d.y * 9.0));
  return vec3(s) + vec3(0.55, 0.6, 0.9) * band;
}
void main(){
  vec2 uv = (gl_FragCoord.xy - 0.5*res) / (0.5*res.y);
  vec3 ro = vec3(0.0, sin(tilt) * dist, -cos(tilt) * dist);
  vec3 fw = normalize(-ro); vec3 rt = normalize(cross(vec3(0.0, 1.0, 0.0), fw)); vec3 up = cross(fw, rt);
  vec3 rd = normalize(fw * 1.7 + uv.x * rt + uv.y * up);
  vec3 p = ro; vec3 v = rd;
  vec3 hc = cross(p, v); float h2 = dot(hc, hc);
  vec3 col = vec3(0.0); float alpha = 0.0; bool hole = false;
  float outer = mix(10.0, 4.4, photo);
  for (int i = 0; i < 220; i++) {
    float r = length(p);
    if (r < 1.0) { hole = true; break; }
    if (r > dist * 1.6) break;
    float dt = clamp(0.06 * r, 0.02, 1.2);
    vec3 np = p + v * dt;
    v += -1.5 * h2 * p / pow(r, 5.0) * dt;
    if (p.y * np.y < 0.0) {
      vec3 c = mix(p, np, p.y / (p.y - np.y));
      float rc = length(c.xz);
      if (rc > 2.4 && rc < outer) {
        float ang = atan(c.z, c.x) + t * spin * 2.2 / pow(rc, 1.5);
        float n = fbm(vec2(rc * 1.6, ang * 4.0));
        float n2 = fbm(vec2(rc * 5.0 - t * 0.3, ang * 9.0));
        float heat = clamp(1.0 - (rc - 2.4) / 7.6, 0.0, 1.0);
        vec3 dc = mix(vec3(0.9, 0.28, 0.05), vec3(1.0, 0.86, 0.6), heat * heat);
        vec3 tang = normalize(vec3(-c.z, 0.0, c.x));
        float dop = pow(1.0 + 0.55 * dot(tang, -normalize(v)), 2.2 + 1.5 * photo);
        float a = smoothstep(outer, outer - 2.2 - 1.3 * (1.0 - photo), rc) * smoothstep(2.4, 3.1, rc) * (0.35 + 0.9 * n * (0.6 + 0.6 * n2));
        a = clamp(a, 0.0, 1.0) * (1.0 - alpha);
        col += dc * dop * a * (1.2 + 1.6 * heat);
        alpha += a;
        if (alpha > 0.97) break;
      }
    }
    p = np;
  }
  if (!hole) col += (1.0 - alpha) * stars(normalize(v));
  if (photo > 0.0) {
    float l = dot(col, vec3(0.3, 0.5, 0.2));
    col = mix(col, vec3(1.0, 0.55, 0.12) * pow(l, 0.8) * 1.5, photo);
  }
  gl_FragColor = vec4(col, 1.0);
}`;

export const BHShader: React.FC<{
  x: number; y: number; w: number; h: number; res?: number; tilt?: number; dist?: number; photo?: number; spin?: number; blur?: number; round?: boolean;
}> = ({ x, y, w, h, res = 300, tilt = 0.14, dist = 24, photo = 0, spin = 1, blur = 0, round = false }) => {
  const f = useCurrentFrame();
  const ref = useRef<HTMLCanvasElement>(null);
  const rw = Math.round(res * (w / h)); const rh = res;
  useLayoutEffect(() => {
    const c = ref.current; if (!c) return;
    const gl = c.getContext('webgl', { preserveDrawingBuffer: true }); if (!gl) return;
    const sh = (type: number, src: string) => { const s = gl.createShader(type)!; gl.shaderSource(s, src); gl.compileShader(s); return s; };
    const pr = gl.createProgram()!; gl.attachShader(pr, sh(gl.VERTEX_SHADER, VERT)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(pr); gl.useProgram(pr);
    const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    gl.viewport(0, 0, rw, rh);
    gl.uniform2f(gl.getUniformLocation(pr, 'res'), rw, rh);
    gl.uniform1f(gl.getUniformLocation(pr, 't'), f / 30);
    gl.uniform1f(gl.getUniformLocation(pr, 'tilt'), tilt);
    gl.uniform1f(gl.getUniformLocation(pr, 'dist'), dist);
    gl.uniform1f(gl.getUniformLocation(pr, 'photo'), photo);
    gl.uniform1f(gl.getUniformLocation(pr, 'spin'), spin);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }, [f, rw, rh, tilt, dist, photo, spin]);
  return <canvas ref={ref} width={rw} height={rh} style={{ position: 'absolute', left: x, top: y, width: w, height: h,
    filter: blur > 0.3 ? `blur(${blur}px)` : undefined,
    // soft round edge when the hole sits inside a scene instead of filling it
    WebkitMaskImage: round ? 'radial-gradient(circle, #000 52%, transparent 70%)' : undefined,
    maskImage: round ? 'radial-gradient(circle, #000 52%, transparent 70%)' : undefined }} />;
};
