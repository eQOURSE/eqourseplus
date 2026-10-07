"use client";

import { useEffect, useRef, useState } from "react";

const VERTEX = `
attribute vec2 a_pos;
void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
`;

// Domain-warped simplex fbm folded into silk ridges. Palette is switched by
// u_light so the same motion reads as obsidian silk (dark) or pearl (light).
const FRAGMENT = `
precision highp float;
uniform vec2 u_res;
uniform float u_time;
uniform vec2 u_mouse;
uniform float u_light;

vec3 permute(vec3 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }
float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
  m = m * m; m = m * m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}
float fbm(vec2 p) {
  float v = 0.0; float a = 0.5;
  for (int i = 0; i < 3; i++) { v += a * snoise(p); p = p * 1.9 + 11.7; a *= 0.45; }
  return v;
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_res;
  vec2 p = (gl_FragCoord.xy - 0.5 * u_res) / u_res.y;
  float t = u_time * 0.045;

  vec2 dm = p - u_mouse;
  float pull = exp(-dot(dm, dm) * 5.0);

  vec2 q = vec2(fbm(p * 0.42 + vec2(0.0, t)), fbm(p * 0.42 + vec2(5.2, 1.3) - t));
  vec2 r = vec2(
    fbm(p * 0.5 + 1.4 * q + vec2(1.7, 9.2) + t * 1.4 + pull * 0.35),
    fbm(p * 0.5 + 1.4 * q + vec2(8.3, 2.8) - t * 1.1)
  );
  float f = fbm(p * 0.55 + 1.6 * r);

  float fold = sin(f * 4.2 + p.x * 1.6 - p.y * 0.9 + t * 2.0);
  float ridge = pow(1.0 - abs(fold), 5.0);
  float soft = 0.5 + 0.5 * fold;
  float body = smoothstep(-0.6, 0.9, f + 0.35 * q.x);
  float sheenMix = smoothstep(-0.3, 0.7, q.y + r.x * 0.5);

  vec3 col;
  if (u_light < 0.5) {
    vec3 base = vec3(0.008, 0.032, 0.028);
    vec3 emerald = vec3(0.03, 0.45, 0.39);
    vec3 mint = vec3(0.48, 0.91, 0.79);
    vec3 gold = vec3(0.92, 0.82, 0.62);
    col = mix(base, emerald * 0.6, body * soft * 0.9);
    col += mix(mint, gold, sheenMix) * ridge * (0.12 + 0.3 * body);
    col += mint * pull * 0.06;
    col *= 0.55 + 0.45 * (1.0 - smoothstep(0.15, 1.15, length(p * vec2(0.8, 1.1))));
  } else {
    vec3 base = vec3(0.962, 0.955, 0.93);
    vec3 mintSoft = vec3(0.70, 0.92, 0.85);
    vec3 emerald = vec3(0.12, 0.58, 0.52);
    vec3 gold = vec3(0.95, 0.86, 0.70);
    col = mix(base, mix(mintSoft, gold, sheenMix * 0.55), body * 0.7);
    col = mix(col, emerald, ridge * 0.16 * body);
    col += vec3(1.0) * ridge * 0.22;
    col += mintSoft * pull * 0.05;
  }

  // keep the top-centre calm so the headline stays crisp
  float calm = 1.0 - smoothstep(0.0, 0.75, length((uv - vec2(0.5, 0.62)) * vec2(1.0, 1.6)));
  vec3 calmTone = u_light < 0.5 ? vec3(0.008, 0.03, 0.026) : vec3(0.965, 0.958, 0.935);
  col = mix(col, calmTone, calm * 0.62);

  gl_FragColor = vec4(col, 1.0);
}
`;

function compile(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

export function SilkShader({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Start only once the page has loaded and the main thread is idle, so the
    // shader never competes with the headline for first paint (LCP).
    let teardown: (() => void) | undefined;
    let idle = 0;
    let disposed = false;
    const begin = () => {
      const run = () => {
        if (!disposed) teardown = setup();
      };
      if (typeof window.requestIdleCallback === "function") idle = window.requestIdleCallback(run, { timeout: 1500 });
      else idle = window.setTimeout(run, 300);
    };
    if (document.readyState === "complete") begin();
    else window.addEventListener("load", begin, { once: true });
    return () => {
      disposed = true;
      window.removeEventListener("load", begin);
      if (typeof window.cancelIdleCallback === "function") window.cancelIdleCallback(idle);
      window.clearTimeout(idle);
      teardown?.();
    };
  }, []);

  function setup(): (() => void) | undefined {
    const canvas = canvasRef.current;
    if (!canvas || typeof window.matchMedia !== "function") return;
    const gl = canvas.getContext("webgl", { antialias: false, alpha: false, powerPreference: "low-power" });
    if (!gl || gl.isContextLost()) return;

    const vs = compile(gl, gl.VERTEX_SHADER, VERTEX);
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT);
    const program = gl.createProgram();
    if (!vs || !fs || !program) return;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(program, "a_pos");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(program, "u_res");
    const uTime = gl.getUniformLocation(program, "u_time");
    const uMouse = gl.getUniformLocation(program, "u_mouse");
    const uLight = gl.getUniformLocation(program, "u_light");

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const scale = 0.5;
    let width = 0;
    let height = 0;
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = Math.max(1, Math.round(rect.width * scale));
      height = Math.max(1, Math.round(rect.height * scale));
      canvas.width = width;
      canvas.height = height;
      gl.viewport(0, 0, width, height);
    };
    resize();

    const mouse = { x: 0.35, y: 0.1, tx: 0.35, ty: 0.1 };
    const onPointer = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.tx = (event.clientX - rect.left - rect.width / 2) / rect.height;
      mouse.ty = -(event.clientY - rect.top - rect.height / 2) / rect.height;
    };

    const isLight = () => (document.documentElement.dataset.theme === "dark" ? 0 : 1);
    let light = isLight();
    const themeObserver = new MutationObserver(() => {
      light = isLight();
      if (reduced) draw(performance.now());
    });
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

    const start = performance.now() - 40_000;
    function draw(now: number) {
      mouse.x += (mouse.tx - mouse.x) * 0.04;
      mouse.y += (mouse.ty - mouse.y) * 0.04;
      gl!.uniform2f(uRes, width, height);
      gl!.uniform1f(uTime, (now - start) / 1000);
      gl!.uniform2f(uMouse, mouse.x, mouse.y);
      gl!.uniform1f(uLight, light);
      gl!.drawArrays(gl!.TRIANGLES, 0, 3);
    }

    let frame = 0;
    let visible = true;
    const loop = (now: number) => {
      draw(now);
      frame = requestAnimationFrame(loop);
    };
    const play = () => {
      if (!frame && visible && !document.hidden && !reduced) frame = requestAnimationFrame(loop);
    };
    const pause = () => {
      cancelAnimationFrame(frame);
      frame = 0;
    };

    const io = new IntersectionObserver(([entry]) => {
      visible = Boolean(entry?.isIntersecting);
      if (visible) play();
      else pause();
    });
    io.observe(canvas);
    const onVisibility = () => (document.hidden ? pause() : play());
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onPointer, { passive: true });

    draw(performance.now());
    setReady(true);
    play();

    return () => {
      pause();
      io.disconnect();
      themeObserver.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointer);
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteBuffer(buffer);
    };
  }

  return <canvas ref={canvasRef} className={className} data-ready={ready ? "true" : undefined} aria-hidden="true" />;
}
