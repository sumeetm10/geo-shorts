import React, { useLayoutEffect, useRef } from 'react';
import { useCurrentFrame } from 'remotion';

// =============================================================================
// A living Sun surface as a WebGL fragment shader: domain-warped noise for the
// churning plasma (granulation), limb darkening, a corona glow and slow
// flare loops. Rendered at `res` px and scaled up by CSS - the laptop has no
// GPU, so Chrome runs WebGL in software; keep `res` modest (idea from the
// shader entries in yihui-dev/awesome-opus5-5-videos; code is our own).
// =============================================================================
const VERT = `attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }`;
const FRAG = `
precision highp float;
uniform vec2 res; uniform float t; uniform float zoom;
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p){ vec2 i = floor(p), f = fract(p); vec2 u = f*f*(3.0-2.0*f);
  return mix(mix(hash(i), hash(i+vec2(1,0)), u.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), u.x), u.y); }
float fbm(vec2 p){ float v = 0.0, a = 0.5; for (int i = 0; i < 5; i++){ v += a*noise(p); p *= 2.03; a *= 0.5; } return v; }
void main(){
  vec2 uv = (gl_FragCoord.xy - 0.5*res) / (0.5*min(res.x, res.y)) / zoom;
  float r = length(uv);
  vec3 col = vec3(0.0);
  if (r < 1.0) {
    // sphere-ish mapping so the cells shrink toward the limb
    float z = sqrt(1.0 - r*r);
    vec2 q = uv / (0.35 + z) * 7.0;
    vec2 w = vec2(fbm(q + vec2(t*0.05, 0.0)), fbm(q + vec2(5.2, 1.3) - t*0.04));
    float n = fbm(q*1.7 + 3.0*w + t*0.08);
    float cells = smoothstep(0.3, 0.8, n);
    float spots = smoothstep(0.78, 0.86, fbm(q*0.35 + 11.0 + t*0.01));
    vec3 hot = vec3(1.0, 0.95, 0.75), mid = vec3(1.0, 0.62, 0.15), cool = vec3(0.75, 0.22, 0.03);
    col = mix(cool, mix(mid, hot, cells), cells);
    col *= 0.5 + 0.5 * pow(z, 0.45);              // limb darkening
    col = mix(col, vec3(0.25, 0.06, 0.0), spots * 0.8);   // a few dark spots
  }
  // corona + flare loops just outside the limb
  float out1 = r >= 1.0 ? 1.0 : 0.0;
  float glow = exp(-9.0 * max(r - 1.0, 0.0)) * out1;
  vec2 dir = uv / max(r, 1e-4);                 // seamless around the limb
  float flare = pow(fbm(dir*2.5 + vec2(t*0.12, -t*0.09)), 3.0) * exp(-16.0 * max(r - 1.0, 0.0)) * out1;
  vec3 halo = vec3(1.0, 0.55, 0.15) * (0.6*glow + 2.4*flare);
  float a = r < 1.0 ? 1.0 : clamp(0.6*glow + 2.4*flare, 0.0, 1.0);
  gl_FragColor = vec4(col + halo, a);
}`;

export const ShaderSun: React.FC<{ x: number; y: number; size: number; res?: number; zoom?: number; speed?: number }> = ({
  x, y, size, res = 420, zoom = 0.62, speed = 1 }) => {
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
    gl.uniform1f(gl.getUniformLocation(pr, 't'), (f / 30) * speed);
    gl.uniform1f(gl.getUniformLocation(pr, 'zoom'), zoom);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }, [f, res, zoom, speed]);
  return <canvas ref={ref} width={res} height={res} style={{ position: 'absolute', left: x - size / 2, top: y - size / 2, width: size, height: size }} />;
};
