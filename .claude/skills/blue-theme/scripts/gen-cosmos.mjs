// 產生星雲 SVG 場景字串（固定亂數種子，每次輸出相同）
let seed = 20261120;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
const W = 1600, H = 1000;
const f = n => +n.toFixed(1);

// 星點：四組各自極慢閃爍；靜止時（減少動態）保留 opacity 屬性當作停靠狀態
const groups = [[], [], [], []];
for (let i = 0; i < 440; i++) {
  const x = f(rnd() * W), y = f(rnd() * H);
  const r = f(0.6 + Math.pow(rnd(), 3) * 1.6);
  const o = (0.35 + rnd() * 0.6).toFixed(2);
  const warm = rnd() < 0.12;
  groups[i % 4].push(`<circle cx="${x}" cy="${y}" r="${r}" fill="${warm ? '#ffe2c4' : '#eef4ff'}" opacity="${o}"/>`);
}
// 亮星＋十字星芒，避開正中央文字區
const bright = [];
const spots = [[180, 120], [1440, 90], [1510, 640], [90, 860], [700, 70], [1260, 930], [420, 520], [1180, 300]];
for (const [x, y] of spots) {
  const s = 10 + rnd() * 10;
  bright.push(`<g transform="translate(${x} ${y})"><circle r="${f(s * 0.9)}" fill="url(#halo)"/><rect x="${f(-s * 2.2)}" y="-0.5" width="${f(s * 4.4)}" height="1" fill="url(#spikeH)"/><rect x="-0.5" y="${f(-s * 2.2)}" width="1" height="${f(s * 4.4)}" fill="url(#spikeV)"/><circle r="1.6" fill="#ffffff"/></g>`);
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice">
<defs>
<radialGradient id="core"><stop offset="0" stop-color="#d8f6ff" stop-opacity="0.9"/><stop offset="0.18" stop-color="#7fdcff" stop-opacity="0.75"/><stop offset="0.5" stop-color="#3a8ee0" stop-opacity="0.35"/><stop offset="1" stop-color="#1c3f86" stop-opacity="0"/></radialGradient>
<radialGradient id="haze"><stop offset="0" stop-color="#2a56a8" stop-opacity="0.55"/><stop offset="0.6" stop-color="#1a3270" stop-opacity="0.25"/><stop offset="1" stop-color="#0b1430" stop-opacity="0"/></radialGradient>
<radialGradient id="rust"><stop offset="0" stop-color="#c4682e" stop-opacity="0.55"/><stop offset="0.45" stop-color="#8a3d1a" stop-opacity="0.32"/><stop offset="1" stop-color="#4a1d0c" stop-opacity="0"/></radialGradient>
<radialGradient id="amber"><stop offset="0" stop-color="#e8a660" stop-opacity="0.45"/><stop offset="1" stop-color="#a24a22" stop-opacity="0"/></radialGradient>
<radialGradient id="lane"><stop offset="0" stop-color="#020309" stop-opacity="0.85"/><stop offset="0.6" stop-color="#03050d" stop-opacity="0.45"/><stop offset="1" stop-color="#03050d" stop-opacity="0"/></radialGradient>
<radialGradient id="vig" cx="0.5" cy="0.5" r="0.75"><stop offset="0.55" stop-color="#03050d" stop-opacity="0"/><stop offset="1" stop-color="#03050d" stop-opacity="0.7"/></radialGradient>
<radialGradient id="halo"><stop offset="0" stop-color="#cfe9ff" stop-opacity="0.8"/><stop offset="1" stop-color="#cfe9ff" stop-opacity="0"/></radialGradient>
<linearGradient id="spikeH"><stop offset="0" stop-color="#cfe9ff" stop-opacity="0"/><stop offset="0.5" stop-color="#ffffff" stop-opacity="0.9"/><stop offset="1" stop-color="#cfe9ff" stop-opacity="0"/></linearGradient>
<linearGradient id="spikeV" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#cfe9ff" stop-opacity="0"/><stop offset="0.5" stop-color="#ffffff" stop-opacity="0.9"/><stop offset="1" stop-color="#cfe9ff" stop-opacity="0"/></linearGradient>
</defs>
<style>
.d1{animation:drift1 140s ease-in-out infinite alternate}
.d2{animation:drift2 180s ease-in-out infinite alternate}
.d3{animation:drift3 220s ease-in-out infinite alternate}
.s0{animation:tw 11s ease-in-out infinite}
.s1{animation:tw 15s ease-in-out -4s infinite}
.s2{animation:tw 19s ease-in-out -9s infinite}
.s3{animation:tw 23s ease-in-out -13s infinite}
.bs{animation:tw2 27s ease-in-out infinite}
@keyframes drift1{from{transform:translate(0px,0px)}to{transform:translate(70px,40px)}}
@keyframes drift2{from{transform:translate(0px,0px)}to{transform:translate(-55px,30px)}}
@keyframes drift3{from{transform:translate(0px,0px) scale(1)}to{transform:translate(40px,-25px) scale(1.04)}}
@keyframes tw{0%,100%{opacity:1}50%{opacity:0.35}}
@keyframes tw2{0%,100%{opacity:1}50%{opacity:0.55}}
</style>
<rect width="${W}" height="${H}" fill="#04060f"/>
<g class="d3">
<ellipse cx="520" cy="420" rx="640" ry="420" fill="url(#haze)"/>
<ellipse cx="1180" cy="560" rx="560" ry="380" fill="url(#haze)" opacity="0.7"/>
</g>
<g class="d1">
<ellipse cx="230" cy="700" rx="330" ry="220" fill="url(#rust)" transform="rotate(-18 230 700)"/>
<ellipse cx="120" cy="420" rx="190" ry="300" fill="url(#rust)" opacity="0.8"/>
<ellipse cx="520" cy="900" rx="380" ry="140" fill="url(#rust)" opacity="0.75"/>
<ellipse cx="300" cy="760" rx="160" ry="90" fill="url(#amber)" transform="rotate(-25 300 760)"/>
<ellipse cx="1480" cy="860" rx="260" ry="150" fill="url(#rust)" opacity="0.6"/>
</g>
<g class="d2">
<ellipse cx="360" cy="330" rx="300" ry="230" fill="url(#core)"/>
<ellipse cx="410" cy="350" rx="120" ry="90" fill="url(#core)"/><ellipse cx="820" cy="170" rx="260" ry="150" fill="url(#core)" opacity="0.35"/><ellipse cx="640" cy="260" rx="140" ry="60" fill="url(#rust)" opacity="0.5" transform="rotate(20 640 260)"/>
<ellipse cx="1120" cy="240" rx="170" ry="420" fill="url(#lane)" transform="rotate(14 1120 240)"/>
<ellipse cx="1260" cy="120" rx="240" ry="160" fill="url(#lane)" opacity="0.8"/>
<ellipse cx="760" cy="980" rx="320" ry="110" fill="url(#lane)" opacity="0.6"/>
</g>
<g class="s0">${groups[0].join('')}</g>
<g class="s1">${groups[1].join('')}</g>
<g class="s2">${groups[2].join('')}</g>
<g class="s3">${groups[3].join('')}</g>
<g class="bs">${bright.join('')}</g>
<rect width="${W}" height="${H}" fill="url(#vig)"/>
</svg>`;
process.stdout.write(svg);
