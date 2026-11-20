/* 星雲海潮主題的動態背景（純視覺，不讀任何使用者資料）
   深色＝慢慢漂移的星雲（青藍核心、鏽橘塵雲、暗帶、星點）；淺色＝藍天白雲＋慢速海浪。
   一張全螢幕 WebGL canvas，低解析度＋限 24fps，切到背景分頁就停；
   reduced-motion 只畫一張靜態畫面；沒有 WebGL 就退回 CSS 漸層（style.css 的 .ambient-fallback）。 */
(function () {
  "use strict";
  const FPS = 24;
  const SCALE = 0.55;               // 相對 CSS 像素的渲染解析度：背景很柔，半解析度看不出差別、省電
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");

  const VERT = "attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}";
  const FRAG = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform vec2 uRes;
uniform float uTime;
uniform float uMode;   /* 0 星雲 / 1 海潮 */

float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3. - 2. * f);
  return mix(mix(hash(i), hash(i + vec2(1., 0.)), u.x),
             mix(hash(i + vec2(0., 1.)), hash(i + vec2(1., 1.)), u.x), u.y);
}
const mat2 ROT = mat2(1.6, 1.2, -1.2, 1.6);
float fbm(vec2 p){
  float v = 0., a = .5;
  for (int i = 0; i < 5; i++) { v += a * noise(p); p = ROT * p; a *= .5; }
  return v;
}

/* 一層星點：格子裡隨機放一顆，亮度各自閃爍 */
float starLayer(vec2 p, float scale, float density, float t){
  vec2 g = p * scale;
  vec2 id = floor(g);
  vec2 f = fract(g) - .5;
  float h = hash(id);
  if (h > density) return 0.;
  vec2 off = (vec2(hash(id + 3.1), hash(id + 7.7)) - .5) * .7;
  float d = length(f - off);
  float tw = .55 + .45 * sin(t * (.4 + hash(id + 1.9) * 1.2) + h * 60.);
  return smoothstep(.16, 0., d) * tw * (.35 + .65 * hash(id + 5.3));
}
/* 亮星＋十字星芒（影片裡的繞射光芒） */
float brightStars(vec2 p, float t){
  vec2 g = p * 3.2;
  vec2 id = floor(g);
  vec2 f = fract(g) - .5;
  if (hash(id + 11.) > .22) return 0.;
  vec2 off = (vec2(hash(id + 2.3), hash(id + 4.1)) - .5) * .6;
  vec2 q = f - off;
  float tw = .7 + .3 * sin(t * .6 + hash(id) * 30.);
  float core = exp(-dot(q, q) * 2200.);
  float spike = exp(-abs(q.x) * 260.) * exp(-abs(q.y) * 22.) + exp(-abs(q.y) * 260.) * exp(-abs(q.x) * 22.);
  return (core * 1.4 + spike * .55) * tw;
}

vec3 nebula(vec2 uv, float t){
  vec2 drift = vec2(t * .0060, -t * .0035);       /* 鏡頭慢慢往右下漂，和參考影片同方向 */
  float zoom = 1. + .05 * sin(t * .015);
  vec2 p = uv * 1.7 / zoom + drift;

  vec2 q = vec2(fbm(p * 1.1), fbm(p * 1.1 + vec2(5.2, 1.3)));
  vec2 r = vec2(fbm(p * 1.3 + 2. * q + vec2(1.7, 9.2) + t * .006),
                fbm(p * 1.3 + 2. * q + vec2(8.3, 2.8) - t * .005));
  float gas   = fbm(p * 1.0 + 2.2 * r);
  float dust  = fbm(p * 1.7 + 1.4 * q + vec2(3.1, 7.7));
  float lanes = fbm(p * 2.1 - 1.1 * r + vec2(9.1, 4.4));

  vec2 core = vec2(-.16 + .04 * sin(t * .011), .10 + .03 * cos(t * .009));
  float d = length((uv - core) * vec2(1., 1.25));
  float glow = exp(-d * d * 5.);

  vec3 base  = vec3(.012, .018, .052);
  vec3 haze  = vec3(.10, .22, .50);
  vec3 cyan  = vec3(.42, .82, 1.0);
  vec3 rust  = vec3(.62, .27, .11);
  vec3 amber = vec3(.90, .58, .30);

  vec3 col = base;
  col = mix(col, haze, smoothstep(.30, .80, gas) * .9);
  col += cyan * glow * (.65 + .85 * gas);
  col += vec3(.85, .95, 1.) * exp(-d * d * 60.) * .35;   /* 核心最亮的一點 */
  float rw = smoothstep(.48, .82, dust) * smoothstep(.12, .50, d);
  col = mix(col, mix(rust, amber, smoothstep(.65, .9, dust)) * (.6 + .7 * gas), rw * .72);
  /* 青與鏽交界的一抹黃綠亮邊（影片核心左下那條） */
  col += vec3(.60, .62, .22) * smoothstep(.03, 0., abs(dust - .6)) * exp(-d * d * 18.) * .35;
  col *= mix(1., .22, smoothstep(.52, .78, lanes));

  vec2 sp = uv + drift * .8;
  float s = starLayer(sp, 90., .55, t) * .55 + starLayer(sp + 7.3, 45., .35, t) * .8 + starLayer(sp + 2.1, 22., .25, t);
  col += vec3(.85, .9, 1.) * s;
  col += vec3(.80, .90, 1.) * brightStars(sp * .9 + 4.4, t);

  float v = 1. - .55 * dot(uv * .9, uv * .9);      /* 暗角，讓卡片周圍不搶戲 */
  return col * clamp(v, .35, 1.) * .88;
}

/* 海浪高度：幾組不同方向的慢速正弦＋雜訊 */
float waveH(vec2 w, float t){
  return .50 * sin(w.x * .55 + w.y * 1.10 + t * .32)
       + .32 * sin(-w.x * .90 + w.y * 1.70 + t * .26)
       + .20 * sin(w.x * 2.10 + w.y * 2.60 - t * .41)
       + .35 * (noise(w * 1.3 + vec2(t * .03, -t * .06)) - .5);
}

vec3 ocean(vec2 uv, float t, float aspect){
  float y = uv.y + .5;                 /* 0 底 → 1 頂 */
  float x = uv.x;
  float hz = .36;                      /* 海平線高度 */
  vec2 sun = vec2(.22 * aspect, .86);
  vec3 skyHi = vec3(.33, .62, .90);
  vec3 skyLo = vec3(.80, .91, .97);

  if (y > hz) {
    float sy = (y - hz) / (1. - hz);
    vec3 col = mix(skyLo, skyHi, pow(sy, .75));
    float sd = length(vec2(x, y) - sun);
    col += vec3(1., .96, .86) * (exp(-sd * 5.) * .30 + exp(-sd * 22.) * .25);
    /* 白雲：投影在天幕上，越近海平線越扁越小，緩慢往右飄 */
    float z = 1. / (sy * .6 + .4);
    vec2 cp = vec2(x * z * 3.2 + t * .03, sy * z * 6.5 + 3.7 + t * .004);
    float c = fbm(cp) + .5 * fbm(cp * 2.1 + vec2(4.1, 2.2) - t * .004);
    float dens = smoothstep(.68, .92, c) * smoothstep(0., .12, sy);
    float shade = fbm(cp + vec2(0., .18));
    vec3 cloud = mix(vec3(.74, .82, .91), vec3(1.), clamp(1.5 - shade * 1.4 + sy * .3, 0., 1.));
    col = mix(col, cloud, dens * .95);
    col = mix(col, skyLo, smoothstep(.10, 0., sy) * .6);   /* 海平線薄霧 */
    return col;
  }

  float depth = hz - y;
  float z = 1. / (depth + .03);
  vec2 w = vec2(x * z * 2.4, z * 2.6);
  float far = smoothstep(.0, .16, depth);                     /* 遠處波浪細節淡出，避免閃爍 */
  float e = .05;
  float h0 = waveH(w, t);
  float hx = waveH(w + vec2(e, 0.), t);
  float hy = waveH(w + vec2(0., e), t);
  vec2 slope = vec2(hx - h0, hy - h0) / e;
  float sh = clamp(slope.y * .45 + slope.x * .12, -1., 1.) * far;

  vec3 trough = vec3(.03, .24, .44);
  vec3 crest  = vec3(.28, .60, .80);
  float fres = pow(1. - clamp(depth / hz, 0., 1.), 5.);
  vec3 col = mix(trough, crest, .5 + .5 * sh);
  col = mix(col, skyLo * .93, fres * .9);
  /* 太陽在海面上的碎光帶 */
  float band = exp(-pow((x - sun.x) * 2.6 / (.22 + depth * 2.2), 2.));
  col += vec3(1., .97, .88) * pow(max(0., sh), 4.) * band * .9;
  /* 浪頭白沫 */
  col = mix(col, vec3(.93, .97, 1.), smoothstep(.75, 1.05, h0) * far * .4);
  return col;
}

void main(){
  vec2 uv = (gl_FragCoord.xy - .5 * uRes) / uRes.y;
  float aspect = uRes.x / uRes.y;
  vec3 col = uMode < .5 ? nebula(uv, uTime) : ocean(uv, uTime, aspect);
  /* 輕微顆粒，避免漸層色帶 */
  col += (hash(gl_FragCoord.xy + fract(uTime)) - .5) / 255. * 2.;
  gl_FragColor = vec4(col, 1.);
}`;

  let canvas = null, gl = null, prog = null, loc = {};
  let mode = null;        // null 關閉 / "nebula" / "ocean"
  let raf = 0, last = 0, t0 = performance.now(), failed = false;

  function setup() {
    if (canvas || failed) return !!canvas;
    canvas = document.createElement("canvas");
    canvas.className = "ambient-bg";
    canvas.setAttribute("aria-hidden", "true");
    gl = canvas.getContext("webgl", { antialias: false, alpha: false, depth: false, powerPreference: "low-power", preserveDrawingBuffer: false });
    const sh = (type, src) => {
      const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error("shader");
      return s;
    };
    try {
      if (!gl) throw new Error("no webgl");
      prog = gl.createProgram();
      gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
      gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error("link");
      gl.useProgram(prog);
      const buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      const a = gl.getAttribLocation(prog, "a");
      gl.enableVertexAttribArray(a);
      gl.vertexAttribPointer(a, 2, gl.FLOAT, false, 0, 0);
      loc = { res: gl.getUniformLocation(prog, "uRes"), time: gl.getUniformLocation(prog, "uTime"), mode: gl.getUniformLocation(prog, "uMode") };
    } catch {
      failed = true; canvas = null; gl = null;
      document.documentElement.classList.add("ambient-fallback");
      return false;
    }
    canvas.addEventListener("webglcontextlost", e => {
      e.preventDefault(); cancelAnimationFrame(raf); raf = 0;
      failed = true; canvas.remove(); canvas = null; gl = null;
      document.documentElement.classList.add("ambient-fallback");
    });
    document.body.prepend(canvas);
    return true;
  }

  function resize() {
    if (!canvas) return;
    const k = SCALE * Math.min(devicePixelRatio || 1, 1.5);
    const w = Math.max(1, Math.round(innerWidth * k));
    const h = Math.max(1, Math.round(innerHeight * k));
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    gl.viewport(0, 0, w, h);
  }

  function draw(now) {
    if (!gl || !mode) return;
    resize();
    gl.uniform2f(loc.res, canvas.width, canvas.height);
    gl.uniform1f(loc.time, (now - t0) / 1000 + 40);   // +40 秒：一開就是已經在流動的畫面
    gl.uniform1f(loc.mode, mode === "ocean" ? 1 : 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (now - last < 1000 / FPS - 2) return;
    last = now;
    draw(now);
  }

  function restart() {
    cancelAnimationFrame(raf); raf = 0;
    if (!mode || !canvas) return;
    if (reduced.matches || document.hidden) { draw(performance.now()); return; }
    raf = requestAnimationFrame(loop);
  }

  function set(next) {
    mode = next || null;
    if (!mode) { cancelAnimationFrame(raf); raf = 0; if (canvas) canvas.hidden = true; return; }
    if (!setup()) return;
    canvas.hidden = false;
    restart();
  }

  document.addEventListener("visibilitychange", restart);
  addEventListener("resize", () => { if (mode && !raf) draw(performance.now()); });
  reduced.addEventListener?.("change", restart);

  window.StardustAmbient = { set };
})();
