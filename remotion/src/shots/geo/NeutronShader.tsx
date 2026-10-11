import React, { useLayoutEffect, useRef } from 'react';
import { useCurrentFrame } from 'remotion';

// =============================================================================
// A neutron star as a WebGL fragment shader: a blue-white ball whose crust
// (3D noise sampled on the rotated sphere) spins about a tilted axis, two hot
// spots at the magnetic poles, a halo, and - when `beam` > 0 - the pulsar's
// two lighthouse beams sweeping round with the magnetic axis.
//   radius  ball radius as a fraction of the canvas half-height
//   spin    turns per second (keep it watchable: 0.2 - 3)
//   beam    0..1 beam strength
// Output has alpha so it can sit on any background. Same pattern as
// ShaderSun / BHShader; software WebGL on this laptop, keep `res` modest.
// =============================================================================
const VERT = `attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }`;
const FRAG = `
precision highp float;
uniform vec2 res; uniform float t; uniform float radius; uniform float spin; uniform float beam;
float h3(vec3 p){ return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
float n3(vec3 p){ vec3 i = floor(p), f = fract(p); vec3 u = f*f*(3.0-2.0*f);
  return mix(mix(mix(h3(i), h3(i+vec3(1,0,0)), u.x), mix(h3(i+vec3(0,1,0)), h3(i+vec3(1,1,0)), u.x), u.y),
             mix(mix(h3(i+vec3(0,0,1)), h3(i+vec3(1,0,1)), u.x), mix(h3(i+vec3(0,1,1)), h3(i+vec3(1,1,1)), u.x), u.y), u.z); }
float fbm3(vec3 p){ float v = 0.0, a = 0.5; for (int i = 0; i < 4; i++){ v += a*n3(p); p *= 2.1; a *= 0.5; } return v; }
vec3 rotY(vec3 v, float a){ float c = cos(a), s = sin(a); return vec3(c*v.x + s*v.z, v.y, -s*v.x + c*v.z); }
vec3 rotX(vec3 v, float a){ float c = cos(a), s = sin(a); return vec3(v.x, c*v.y - s*v.z, s*v.y + c*v.z); }
void main(){
  vec2 uv = (gl_FragCoord.xy - 0.5*res) / (0.5*res.y);
  float R = radius; float r = length(uv);
  float ang = t * spin * 6.2831853;
  // magnetic axis: 35 degrees off the spin axis, carried round by the spin; spin axis tilted toward us
  vec3 mag = rotX(rotY(normalize(vec3(sin(0.6), cos(0.6), 0.0)), ang), -0.35);
  vec3 col = vec3(0.0); float a = 0.0;
  if (r < R) {
    vec3 n = vec3(uv / R, sqrt(1.0 - (r*r)/(R*R)));
    vec3 q = rotY(rotX(n, 0.35), -ang);                 // into the star's own frame
    float cells = fbm3(q * 11.0);
    float fine = fbm3(q * 30.0 + 4.0);
    vec3 base = mix(vec3(0.35, 0.55, 1.0), vec3(0.92, 0.97, 1.0), smoothstep(0.35, 0.75, cells));
    base *= 0.75 + 0.35 * fine;
    float spot = pow(max(dot(n, mag), 0.0), 18.0) + pow(max(dot(n, -mag), 0.0), 18.0);
    base += vec3(0.7, 0.85, 1.0) * spot * 1.6;
    float limb = pow(1.0 - n.z, 2.0);
    col = base * (0.85 + 0.5 * n.z) + vec3(0.4, 0.6, 1.0) * limb * 1.1;
    a = 1.0;
  } else {
    float g = exp(-4.5 * (r - R) / R) * smoothstep(1.0, 0.7, r);
    col = vec3(0.35, 0.55, 1.0) * g * 0.9; a = g * 0.9;
  }
  if (beam > 0.0) {
    vec2 d = normalize(mag.xy + vec2(1e-4));
    float face = 0.35 + 0.65 * abs(mag.z);
    for (int k = 0; k < 2; k++) {
      vec2 dd = k == 0 ? d : -d;
      float along = dot(uv, dd);
      float perp = length(uv - along * dd);
      float w = 0.02 + 0.16 * max(along - R, 0.0);
      float b = exp(-perp*perp / (w*w)) * smoothstep(R * 0.8, R * 1.3, along) * exp(-0.35 * max(along - R, 0.0)) * smoothstep(0.98, 0.6, r);
      bool behind = (k == 0 ? mag.z : -mag.z) < 0.0 && r < R;
      if (!behind) { col += vec3(0.75, 0.88, 1.0) * b * beam * 1.4 * face; a = max(a, clamp(b * beam * 1.4, 0.0, 1.0)); }
    }
  }
  gl_FragColor = vec4(col, clamp(a, 0.0, 1.0));
}`;

export const NeutronShader: React.FC<{
  x: number; y: number; size: number; res?: number; radius?: number; spin?: number; beam?: number;
}> = ({ x, y, size, res = 360, radius = 0.42, spin = 0.5, beam = 0 }) => {
  const f = useCurrentFrame();
  const ref = useRef<HTMLCanvasElement>(null);
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
    gl.uniform2f(gl.getUniformLocation(pr, 'res'), res, res);
    gl.uniform1f(gl.getUniformLocation(pr, 't'), f / 30);
    gl.uniform1f(gl.getUniformLocation(pr, 'radius'), radius);
    gl.uniform1f(gl.getUniformLocation(pr, 'spin'), spin);
    gl.uniform1f(gl.getUniformLocation(pr, 'beam'), beam);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }, [f, res, radius, spin, beam]);
  return <canvas ref={ref} width={res} height={res} style={{ position: 'absolute', left: x - size / 2, top: y - size / 2, width: size, height: size }} />;
};
