// Detecta a moldura branca no fim do vídeo e acompanha ela para trás,
// quadro a quadro, para saber onde e a partir de quando a foto aparece.
// Mesma lógica de tools/adicionar_modelo.py, rodando no navegador.

const W = 270, H = 480, N = W * H, FPS = 24;

function mascara(px, limiar, sat) {
  const m = new Uint8Array(N);
  for (let i = 0, j = 0; i < N; i++, j += 4) {
    const r = px[j], g = px[j + 1], b = px[j + 2];
    const mn = r < g ? (r < b ? r : b) : (g < b ? g : b), mx = r > g ? (r > b ? r : b) : (g > b ? g : b);
    m[i] = mn > limiar && mx - mn < sat ? 1 : 0;
  }
  return m;
}
// erosão/dilatação com vizinhança em cruz (igual ao scipy)
function erodir(m) {
  const o = new Uint8Array(N);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x;
    o[i] = m[i] && x > 0 && m[i - 1] && x < W - 1 && m[i + 1] && y > 0 && m[i - W] && y < H - 1 && m[i + W] ? 1 : 0;
  }
  return o;
}
function dilatar(m) {
  const o = new Uint8Array(N);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x;
    o[i] = m[i] || (x > 0 && m[i - 1]) || (x < W - 1 && m[i + 1]) || (y > 0 && m[i - W]) || (y < H - 1 && m[i + W]) ? 1 : 0;
  }
  return o;
}
const repetir = (f, m, n) => { for (let k = 0; k < n; k++) m = f(m); return m; };
const pilha = new Int32Array(N);
function preencherBuracos(m) {
  // tudo que é 0 e não está ligado à borda vira 1
  const fora = new Uint8Array(N); let t = 0;
  const pus = i => { if (!m[i] && !fora[i]) { fora[i] = 1; pilha[t++] = i; } };
  for (let x = 0; x < W; x++) { pus(x); pus((H - 1) * W + x); }
  for (let y = 0; y < H; y++) { pus(y * W); pus(y * W + W - 1); }
  while (t) { const i = pilha[--t], x = i % W; if (x > 0) pus(i - 1); if (x < W - 1) pus(i + 1); if (i >= W) pus(i - W); if (i < N - W) pus(i + W); }
  for (let i = 0; i < N; i++) if (!fora[i]) m[i] = 1;
  return m;
}
function componente(m, sx, sy) {
  sx = Math.round(sx); sy = Math.round(sy);
  let ini = -1;
  if (m[sy * W + sx]) ini = sy * W + sx;
  else { // procura um pixel branco perto da semente
    let melhor = 1e9;
    for (let dy = -6; dy <= 6; dy++) for (let dx = -6; dx <= 6; dx++) {
      const x = sx + dx, y = sy + dy; if (x < 0 || y < 0 || x >= W || y >= H) continue;
      if (m[y * W + x] && dx * dx + dy * dy < melhor) { melhor = dx * dx + dy * dy; ini = y * W + x; }
    }
  }
  if (ini < 0) return null;
  const vis = new Uint8Array(N); let t = 0, x0 = W, y0 = H, x1 = 0, y1 = 0;
  vis[ini] = 1; pilha[t++] = ini;
  while (t) {
    const i = pilha[--t], x = i % W, y = (i / W) | 0;
    if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
    for (const j of [x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1, i - W, i + W]) if (j >= 0 && j < N && m[j] && !vis[j]) { vis[j] = 1; pilha[t++] = j; }
  }
  return [x0, y0, x1 + 1, y1 + 1];
}
function detectar(px, o, semente) {
  let m = mascara(px, o.limiar, o.sat);
  m = dilatar(erodir(m));                        // abertura: tira pontinhos soltos
  if (o.fechar) m = repetir(erodir, repetir(dilatar, m, 3), 3); // fechamento: junta falhas
  return componente(preencherBuracos(m), semente[0], semente[1]);
}

export class Rastreador {
  constructor(video) {
    this.v = video; this.c = document.createElement('canvas'); this.c.width = W; this.c.height = H;
    this.g = this.c.getContext('2d', { willReadFrequently: true });
  }
  get total() { return Math.floor(this.v.duration * FPS); }
  async quadro(i) {
    const v = this.v;
    await new Promise(ok => { v.addEventListener('seeked', ok, { once: true }); v.currentTime = Math.min(v.duration - .001, i / FPS + .001); });
    this.g.drawImage(v, 0, 0, W, H);
    return this.g.getImageData(0, 0, W, H).data;
  }
  // Retorna { inicio, quadros, final } ou lança erro se não achar a moldura
  async rodar({ limiar = 225, sat = 18, fechar = true, progresso = () => {} } = {}) {
    const o = { limiar, sat, fechar }, tot = this.total;
    const b = detectar(await this.quadro(tot - 1), o, [W / 2, H * .48]);
    if (!b) throw new Error('Não achei a moldura branca no final do vídeo.');
    const bw = b[2] - b[0], bh = b[3] - b[1];
    if (bw * bh < N * .03 || b[0] === 0 && b[2] === W) throw new Error('A área branca encontrada não parece uma moldura.');
    const asp = bw / bh, area = bw * bh, tr = new Map([[tot - 1, b]]);
    let ant = b;
    for (let i = tot - 2; i >= 0; i--) {
      progresso(1 - i / tot);
      const bb = detectar(await this.quadro(i), o, [(ant[0] + ant[2]) / 2, (ant[1] + ant[3]) / 2]);
      if (!bb) break;
      const a2 = (bb[2] - bb[0]) * (bb[3] - bb[1]), asp2 = (bb[2] - bb[0]) / Math.max(1, bb[3] - bb[1]), pa = (ant[2] - ant[0]) * (ant[3] - ant[1]);
      if (Math.abs(asp2 / asp - 1) > .15 || a2 > pa * 1.08 || a2 < pa * .6 || a2 < area * .04) break;
      tr.set(i, bb); ant = bb;
    }
    progresso(1);
    const inicio = Math.min(...tr.keys());
    let r = [];
    for (let i = inicio; i < tot; i++) { const q = tr.get(i); r.push([q[0] / W, q[1] / H, (q[2] - q[0]) / W, (q[3] - q[1]) / H]); }
    r = suavizar(r);
    return { inicio, quadros: r, total: tot };
  }
}

// Tira o tremor da detecção sem atrasar o movimento real da câmera:
// 1) salto isolado (> 8 px da mediana de 7 quadros) vira a mediana; 2) trecho final parado vira um só retângulo;
// 3) o resto passa por Savitzky-Golay (janela 9, grau 2), que mantém a aceleração do zoom.
// Selo do casamento: acha o selo claro no primeiro quadro e segue para frente até ele quebrar/sumir.
Rastreador.prototype.rodarSelo = async function ({ limiar = 190, sat = 45, fechar = true, semente = [.5, .5], progresso = () => {} } = {}) {
  const o = { limiar, sat, fechar }, tot = this.total;
  const b = detectar(await this.quadro(0), o, [semente[0] * W, semente[1] * H]);
  if (!b) throw new Error('Não achei o selo no começo do vídeo.');
  const bw = b[2] - b[0], bh = b[3] - b[1];
  if (bw * bh < N * .003 || bw * bh > N * .45) throw new Error('A área encontrada não parece um selo.');
  const asp = bw / bh, tr = [b]; let ant = b;
  for (let i = 1; i < tot; i++) {
    progresso(i / tot);
    const bb = detectar(await this.quadro(i), o, [(ant[0] + ant[2]) / 2, (ant[1] + ant[3]) / 2]);
    if (!bb) break;
    const a2 = (bb[2] - bb[0]) * (bb[3] - bb[1]), asp2 = (bb[2] - bb[0]) / Math.max(1, bb[3] - bb[1]), pa = (ant[2] - ant[0]) * (ant[3] - ant[1]);
    if (Math.abs(asp2 / asp - 1) > .2 || a2 > pa * 1.6 || a2 < pa * .6) break;
    tr.push(bb); ant = bb;
  }
  progresso(1);
  if (tr.length < 6) throw new Error('O selo some rápido demais. Marque o selo na mão.');
  const r = tr.map(q => [q[0] / W, q[1] / H, (q[2] - q[0]) / W, (q[3] - q[1]) / H]);
  return { inicio: 0, quadros: suavizar(r), total: tot };
};

function suavizar(r) {
  const n = r.length, PX = [1080, 1920, 1080, 1920];
  if (n < 6) return r.map(q => q.map(v => +v.toFixed(5)));
  const mediana = (arr) => { const s = [...arr].sort((a, b) => a - b); return s.length % 2 ? s[s.length >> 1] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2; };
  const lim = (i) => Math.min(n - 1, Math.max(0, i));
  let a = r.map((q, i) => {
    const med = [0, 1, 2, 3].map(k => mediana([-3, -2, -1, 0, 1, 2, 3].map(d => r[lim(i + d)][k])));
    return q.some((v, k) => Math.abs(v - med[k]) * PX[k] > 8) ? med : q.slice();
  });
  const fim = [0, 1, 2, 3].map(k => mediana(a.slice(-6).map(q => q[k])));
  let h = n;
  while (h > 0 && a[h - 1].every((v, k) => Math.abs(v - fim[k]) * PX[k] < 3)) h--;
  if (h < n) { const parado = [0, 1, 2, 3].map(k => mediana(a.slice(h).map(q => q[k]))); for (let i = h; i < n; i++) a[i] = parado.slice(); }
  const C = [-21, 14, 39, 54, 59, 54, 39, 14, -21], S = 231;
  const g = a.map((q, i) => i >= h ? q : [0, 1, 2, 3].map(k => C.reduce((s, c, j) => s + c * a[lim(i + j - 4)][k], 0) / S));
  for (let k = 1; k < 5 && h < n; k++) { const i = h - k; if (i >= 0) { const t = k / 5; g[i] = g[i].map((v, j) => v * t + a[h][j] * (1 - t)); } }
  return g.map(q => q.map(v => +v.toFixed(5)));
}
