// 產生淺色海潮 SVG 場景：藍天、白雲、慢速海浪（固定亂數種子）
let seed = 7741;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
const W = 1600, H = 1000, HZ = 610;
const f = n => +n.toFixed(1);

// 一條可無縫循環的波浪：寬 2W，週期能整除 W
function wave(y, amp, period, fill, opacity, cls) {
  const pts = [];
  for (let x = 0; x <= 2 * W; x += period / 8) {
    const yy = y + Math.sin((x / period) * Math.PI * 2) * amp + Math.sin((x / (period / 2.0)) * Math.PI * 2 + 1.3) * amp * 0.25;
    pts.push(`${f(x)},${f(yy)}`);
  }
  return `<g class="${cls}"><path d="M0,${H} L${pts.join(' L')} L${2 * W},${H} Z" fill="${fill}" opacity="${opacity}"/></g>`;
}

// 雲：多顆柔邊橢圓疊成一朵，底部一層淡藍灰陰影
function cloud(cx, cy, s) {
  const parts = [];
  parts.push(`<ellipse cx="${cx}" cy="${f(cy + 18 * s)}" rx="${f(150 * s)}" ry="${f(32 * s)}" fill="url(#cshade)"/>`);
  const n = 5 + Math.floor(rnd() * 3);
  for (let i = 0; i < n; i++) {
    const dx = (i - (n - 1) / 2) * 52 * s + (rnd() - 0.5) * 20 * s;
    const r = (46 + rnd() * 40) * s * (1 - Math.abs(i - (n - 1) / 2) / n);
    parts.push(`<ellipse cx="${f(cx + dx)}" cy="${f(cy - r * 0.35)}" rx="${f(r * 1.25)}" ry="${f(r)}" fill="url(#cwhite)"/>`);
  }
  return parts.join('');
}

// 海面碎光：太陽下方一條光帶，慢慢明滅
const glints = [];
for (let i = 0; i < 46; i++) {
  const t = rnd();
  const y = HZ + 8 + Math.pow(t, 1.4) * (H - HZ - 10);
  const spread = 30 + (y - HZ) * 0.55;
  const x = 1270 + (rnd() - 0.5) * spread * 2;
  const w = 4 + (y - HZ) * 0.05 + rnd() * 8;
  glints.push(`<ellipse class="g${i % 3}" cx="${f(x)}" cy="${f(y)}" rx="${f(w)}" ry="${f(0.8 + (y - HZ) * 0.004)}" fill="#ffffff" opacity="${(0.25 + rnd() * 0.4).toFixed(2)}"/>`);
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice">
<defs>
<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3f8ad6"/><stop offset="0.5" stop-color="#78b3e7"/><stop offset="0.82" stop-color="#b6d9f2"/><stop offset="1" stop-color="#ddeef9"/></linearGradient>
<linearGradient id="sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9ccbe8"/><stop offset="0.12" stop-color="#5e9fcf"/><stop offset="0.5" stop-color="#2a74ad"/><stop offset="1" stop-color="#0f4a82"/></linearGradient>
<radialGradient id="sun"><stop offset="0" stop-color="#ffffff" stop-opacity="1"/><stop offset="0.08" stop-color="#fffbe8" stop-opacity="0.95"/><stop offset="0.3" stop-color="#fff3cf" stop-opacity="0.35"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></radialGradient>
<radialGradient id="cwhite"><stop offset="0" stop-color="#ffffff" stop-opacity="1"/><stop offset="0.6" stop-color="#ffffff" stop-opacity="0.85"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></radialGradient>
<radialGradient id="cshade"><stop offset="0" stop-color="#b9cde0" stop-opacity="0.75"/><stop offset="1" stop-color="#b9cde0" stop-opacity="0"/></radialGradient>
<linearGradient id="haze" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#eaf5fc" stop-opacity="0"/><stop offset="0.5" stop-color="#eaf5fc" stop-opacity="0.8"/><stop offset="1" stop-color="#eaf5fc" stop-opacity="0"/></linearGradient>
</defs>
<style>
.c1{animation:cloud1 260s ease-in-out infinite alternate}
.c2{animation:cloud2 340s ease-in-out infinite alternate}
.w1{animation:roll 150s linear infinite}
.w2{animation:roll 110s linear infinite reverse}
.w3{animation:roll 80s linear infinite}
.w4{animation:roll 60s linear infinite reverse}
.b1{animation:bob 11s ease-in-out infinite alternate}
.b2{animation:bob 14s ease-in-out -5s infinite alternate}
.g0{animation:glint 7s ease-in-out infinite}
.g1{animation:glint 9s ease-in-out -3s infinite}
.g2{animation:glint 12s ease-in-out -6s infinite}
@keyframes cloud1{from{transform:translate(0px,0px)}to{transform:translate(160px,0px)}}
@keyframes cloud2{from{transform:translate(0px,0px)}to{transform:translate(-120px,6px)}}
@keyframes roll{from{transform:translate(0px,0px)}to{transform:translate(-${W}px,0px)}}
@keyframes bob{from{transform:translate(0px,0px)}to{transform:translate(0px,6px)}}
@keyframes glint{0%,100%{opacity:0.15}50%{opacity:0.9}}
</style>
<rect width="${W}" height="${HZ + 2}" fill="url(#sky)"/>
<circle cx="1270" cy="150" r="300" fill="url(#sun)"/>
<g class="c2" opacity="0.8">${cloud(260, 330, 0.7)}${cloud(980, 400, 0.55)}${cloud(1500, 360, 0.6)}${cloud(620, 520, 0.45)}${cloud(1220, 540, 0.4)}</g>
<g class="c1">${cloud(180, 150, 1.25)}${cloud(900, 110, 0.9)}${cloud(1560, 230, 1.05)}${cloud(520, 240, 0.8)}</g>
<rect y="${HZ - 30}" width="${W}" height="60" fill="url(#haze)"/>
<rect y="${HZ}" width="${W}" height="${H - HZ}" fill="url(#sea)"/>
<g class="b1">${wave(HZ + 30, 3, 200, '#4e93c6', 0.45, 'w1')}${wave(HZ + 75, 6, 320, '#3a83bb', 0.5, 'w2')}</g>
<g class="b2">${wave(HZ + 150, 11, 400, '#2c72aa', 0.55, 'w3')}${wave(HZ + 260, 18, 533.3333, '#1d5f97', 0.6, 'w4')}</g>
${glints.join('')}
</svg>`;
process.stdout.write(svg);
