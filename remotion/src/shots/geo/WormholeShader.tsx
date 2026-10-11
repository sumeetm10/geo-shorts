import React, { useLayoutEffect, useRef } from 'react';
import { useCurrentFrame } from 'remotion';

// =============================================================================
// A wormhole as a WebGL fragment shader - the way Kip Thorne's maths says one
// would look: not a hole but a sphere, a "crystal ball" showing another part of
// the universe. Inside the sphere: a different sky (a warm galaxy and nebula),
// fish-eyed toward the rim. Outside: our own stars, lensed around it (pulled
// into an Einstein ring at the edge).
//   R       sphere radius as a fraction of the canvas half-height
//   travel  0..1 flies into it: the sphere swells past the screen, the tunnel
//           streaks past, and you come out under the other sky
//   pinch   0..1 the throat collapses: the sphere shrinks to a point and swirls
//   hue     shifts the other side's colours (two different "elsewheres")
// Same pattern as ShaderSun / BHShader; software WebGL, keep `res` modest.
// =============================================================================
const VERT = `attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }`;
const FRAG = `
precision highp float;
uniform vec2 res; uniform float t; uniform float R0; uniform float travel; uniform float pinch; uniform float hue;
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p){ vec2 i = floor(p), f = fract(p); vec2 u = f*f*(3.0-2.0*f);
  return mix(mix(hash(i), hash(i+vec2(1,0)), u.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), u.x), u.y); }
float fbm(vec2 p){ float v = 0.0, a = 0.5; for (int i = 0; i < 5; i++){ v += a*noise(p); p *= 2.03; a *= 0.5; } return v; }
float stars(vec2 p, float dens){
  vec2 c = floor(p); float h = hash(c);
  if (h < 1.0 - dens) return 0.0;
  vec2 o = vec2(hash(c + 1.7), hash(c + 3.1));
  return smoothstep(0.32, 0.0, length(p - c - o)) * (0.5 + 0.5 * hash(c + 5.3));
}
vec3 ourSky(vec2 d){
  vec3 c = vec3(0.01, 0.015, 0.04);
  c += vec3(0.25, 0.35, 0.7) * pow(fbm(d * 1.4 + 3.0), 3.0) * 0.6;
  c += vec3(0.9, 0.95, 1.0) * (stars(d * 34.0, 0.06) + 0.6 * stars(d * 70.0 + 9.0, 0.05));
  return c;
}
vec3 otherSky(vec2 d){
  float a = atan(d.y, d.x); float r = length(d);
  // a spiral galaxy off-centre plus glowing nebula
  vec2 g = d - vec2(0.18, -0.08); float gr = length(g); float ga = atan(g.y, g.x);
  float arms = pow(0.5 + 0.5 * cos(2.0 * ga - 9.0 * log(gr + 0.05) + t * 0.15), 3.0) * exp(-gr * 5.0);
  vec3 warm = mix(vec3(1.0, 0.45, 0.2), vec3(0.95, 0.3, 0.75), hue);
  vec3 cool = mix(vec3(0.3, 0.8, 1.0), vec3(1.0, 0.85, 0.3), hue);
  vec3 c = vec3(0.02, 0.01, 0.03);
  c += warm * pow(fbm(d * 2.2 + vec2(t * 0.02, 0.0)), 2.5) * 1.3;
  c += cool * pow(fbm(d * 3.1 - 7.0), 4.0) * 1.5;
  c += vec3(1.0, 0.9, 0.75) * (arms * 1.6 + exp(-gr * 26.0) * 1.4);
  c += vec3(1.0) * (stars(d * 40.0 + 2.0, 0.07) + 0.6 * stars(d * 90.0, 0.05));
  return c;
}
void main(){
  vec2 uv = (gl_FragCoord.xy - 0.5*res) / (0.5*res.y);
  float r = length(uv);
  // swirl while pinching
  float sw = pinch * 3.0 * exp(-r * 2.0);
  float cs = cos(sw), sn = sin(sw); uv = vec2(cs*uv.x - sn*uv.y, sn*uv.x + cs*uv.y);
  float R = R0 * (1.0 - pinch) * (1.0 + 7.0 * travel * travel);
  vec3 col;
  if (r < R) {
    vec2 q = uv / max(R, 1e-4);
    float z = sqrt(max(1.0 - dot(q, q), 0.0));
    vec2 d = q / (z + 0.25) * 0.55 * (1.0 - 0.6 * travel);
    col = otherSky(d);
    col *= 0.55 + 0.45 * z + 0.4 * (1.0 - z) * 0.0;
    float rim = pow(1.0 - z, 6.0);
    col += vec3(0.8, 0.9, 1.0) * rim * 0.9;
  } else {
    float th = R * R / max(r, 1e-4);                     // Einstein-ring style lens
    vec2 d = uv * (1.0 - th / max(r, 1e-4));
    col = ourSky(d + vec2(t * 0.004, 0.0));
    float ring = exp(-pow((r - R) / (0.025 + 0.04 * R), 2.0));
    col += vec3(0.75, 0.85, 1.0) * ring * 0.9;
    col *= 1.0 - 0.6 * exp(-pow((r - R) / (0.12 * R + 0.01), 2.0)) * 0.0;
  }
  // tunnel streaks while flying through
  float tun = smoothstep(0.15, 0.5, travel) * (1.0 - smoothstep(0.75, 1.0, travel));
  if (tun > 0.0) {
    float a = atan(uv.y, uv.x);
    float s = pow(fbm(vec2(a * 9.0, 1.0 / (r + 0.05) - t * 3.5)), 3.0);
    col += mix(vec3(0.6, 0.8, 1.0), vec3(1.0, 0.6, 0.9), hue) * s * 2.2 * tun * smoothstep(0.0, 0.6, r);
  }
  if (pinch > 0.0) col += vec3(0.8, 0.9, 1.0) * exp(-r * 14.0) * pinch * 2.0;
  gl_FragColor = vec4(col, 1.0);
}`;

export const WormholeShader: React.FC<{
  x: number; y: number; w: number; h: number; res?: number; R?: number; travel?: number; pinch?: number; hue?: number; round?: boolean;
}> = ({ x, y, w, h, res = 420, R = 0.38, travel = 0, pinch = 0, hue = 0, round = false }) => {
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
    gl.uniform1f(gl.getUniformLocation(pr, 'R0'), R);
    gl.uniform1f(gl.getUniformLocation(pr, 'travel'), travel);
    gl.uniform1f(gl.getUniformLocation(pr, 'pinch'), pinch);
    gl.uniform1f(gl.getUniformLocation(pr, 'hue'), hue);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }, [f, rw, rh, R, travel, pinch, hue]);
  return <canvas ref={ref} width={rw} height={rh} style={{ position: 'absolute', left: x, top: y, width: w, height: h,
    // soft round edge for a mouth that sits inside a scene
    WebkitMaskImage: round ? 'radial-gradient(circle closest-side, #000 62%, transparent 80%)' : undefined,
    maskImage: round ? 'radial-gradient(circle closest-side, #000 62%, transparent 80%)' : undefined }} />;
};
