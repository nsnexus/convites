// Compositor: desenha o vídeo do modelo num <canvas> (WebGL) e encaixa a foto
// do cliente na moldura branca, quadro a quadro, usando o rastreamento salvo em
// /modelos/modelos.json. Pixels que não são brancos dentro da moldura (confete,
// pétalas, faíscas) continuam por cima da foto.

const VS = `
attribute vec2 p;
varying vec2 uv;
void main(){ uv = vec2(p.x*0.5+0.5, 0.5-p.y*0.5); gl_Position = vec4(p,0.,1.); }`;

const FS = `
precision mediump float;
varying vec2 uv;
uniform sampler2D vid, foto, masc;
uniform vec4 ret;        // x,y,w,h normalizados
uniform vec4 fotoUV;     // escala.x, escala.y, desloc.x, desloc.y
uniform float alfa, forma, usaChave, temFoto, modoSelo;
void main(){
  vec4 c = texture2D(vid, uv);
  vec2 l = (uv - ret.xy) / ret.zw;
  if (temFoto < .5 || alfa <= 0. || l.x < 0. || l.y < 0. || l.x > 1. || l.y > 1.) { gl_FragColor = c; return; }
  float m = 1.;
  if (forma > .5 && forma < 1.5) { float d = length((l - .5) * 2.); m = clamp((1. - d) * 60., 0., 1.); }
  else if (forma > 1.5) { m = texture2D(masc, l).r; }
  float k = 1.;
  if (usaChave > .5) {
    float mn = min(c.r, min(c.g, c.b)); float mx = max(c.r, max(c.g, c.b));
    k = clamp((mn - .43) / .2, 0., 1.) * clamp((.29 - (mx - mn)) / .14, 0., 1.);
  }
  vec4 f = texture2D(foto, l * fotoUV.xy + fotoUV.zw);
  if (modoSelo > .5) {
    // iniciais gravadas na cera: escurece onde há letra e clareia a borda de cima (baixo-relevo)
    vec2 uvf = l * fotoUV.xy + fotoUV.zw;
    float a = f.a * m * alfa;
    float luz = texture2D(foto, uvf + vec2(.006, .006)).a * m * alfa;
    // cera clara: letra cavada (escurece). Cera escura: letra em relevo (clareia, com sombra embaixo).
    float lum = dot(c.rgb, vec3(.299, .587, .114));
    float escura = 1. - smoothstep(.28, .55, lum);
    float sombra = texture2D(foto, uvf - vec2(.006, .006)).a * m * alfa;
    vec3 cavada = c.rgb * (1. - .38 * a) + vec3(1.) * max(0., luz - a) * .22;
    vec3 relevo = c.rgb * (1. - .45 * max(0., sombra - a)) + a * (c.rgb * .85 + vec3(.16, .12, .09)) + vec3(1.) * max(0., luz - a) * .12;
    vec3 cor = mix(cavada, relevo, escura);
    gl_FragColor = vec4(cor, c.a);
    return;
  }
  gl_FragColor = mix(c, f, m * k * alfa);
}`;

export class Compositor {
  constructor(canvas, video, modelo) {
    this.c = canvas; this.v = video; this.m = modelo;
    this.ajuste = { zoom: 1, x: .5, y: .5 };
    const gl = this.gl = canvas.getContext('webgl', { premultipliedAlpha: false, preserveDrawingBuffer: true });
    if (!gl) throw new Error('webgl');
    const sh = (t, s) => { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); return o; };
    const pr = this.pr = gl.createProgram();
    gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS));
    gl.linkProgram(pr); gl.useProgram(pr);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
    const a = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(a); gl.vertexAttribPointer(a, 2, gl.FLOAT, false, 0, 0);
    this.u = {}; ['vid','foto','masc','ret','fotoUV','alfa','forma','usaChave','temFoto','modoSelo'].forEach(n => this.u[n] = gl.getUniformLocation(pr, n));
    this.tx = [0,1,2].map(i => { const t = gl.createTexture(); gl.activeTexture(gl.TEXTURE0+i); gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([255,255,255,255])); return t; });
    gl.uniform1i(this.u.vid, 0); gl.uniform1i(this.u.foto, 1); gl.uniform1i(this.u.masc, 2);
    this.temFoto = false; this.foto = null;
    if (modelo.mascara) this._img(modelo.mascara).then(im => this._tex(2, im));
    this.c.width = 720; this.c.height = 1280;
    // depois de pular para outro ponto (vídeo pausado) o quadro novo só fica pronto no 'seeked'
    ['seeked', 'loadeddata'].forEach(ev => video.addEventListener(ev, () => { if (!this.parado) this.desenhar(); }));
    this._loop = this._loop.bind(this); requestAnimationFrame(this._loop);
    // Quando o navegador permite, desenha exatamente no quadro que o vídeo está mostrando
    // (sem isso a foto pode usar a posição de um quadro e o vídeo mostrar o próximo: parece tremer).
    if ('requestVideoFrameCallback' in HTMLVideoElement.prototype) {
      const aoQuadro = (_agora, meta) => { if (this.parado) return; this.tempoQuadro = meta.mediaTime; this.desenhar(true); this.v.requestVideoFrameCallback(aoQuadro); };
      this.v.requestVideoFrameCallback(aoQuadro);
      this.v.addEventListener('emptied', () => { this.tempoQuadro = undefined; });
    }
  }
  _img(src) { return new Promise((ok, er) => { const i = new Image(); i.crossOrigin = 'anonymous'; i.onload = () => ok(i); i.onerror = er; i.src = src; }); }
  _tex(i, src) { const gl = this.gl; gl.activeTexture(gl.TEXTURE0+i); gl.bindTexture(gl.TEXTURE_2D, this.tx[i]); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src); }
  async definirFoto(src) {
    const im = typeof src === 'string' ? await this._img(src) : src;
    // normaliza para canvas (corrige orientação e limita tamanho)
    const max = 1400, s = Math.min(1, max / Math.max(im.width, im.height));
    const cv = document.createElement('canvas'); cv.width = Math.round(im.width*s); cv.height = Math.round(im.height*s);
    cv.getContext('2d').drawImage(im, 0, 0, cv.width, cv.height);
    this.foto = cv; this._tex(1, cv); this.temFoto = true; this.desenhar();
  }
  definirMascara(src) { if (!src) return; this._img(src).then(im => { this._tex(2, im); this.desenhar(); }).catch(() => {}); }
  trocarModelo(m) {
    this.m = m;
    if (m.mascara) this._img(m.mascara).then(im => this._tex(2, im));
    this.v.src = m.video; this.v.load();
  }
  // Iniciais do casal para o selo (tipo 'selo'): textura transparente com as letras
  async definirIniciais(texto) {
    try { await document.fonts.load("600 200px 'Cormorant Garamond'"); } catch {}
    const cv = document.createElement('canvas'); cv.width = cv.height = 512;
    const g = cv.getContext('2d'); g.fillStyle = '#000'; g.textAlign = 'center'; g.textBaseline = 'middle';
    const t = (texto || '').trim() || '♥';
    let tam = 230; g.font = `italic 600 ${tam}px 'Cormorant Garamond', Georgia, serif`;
    while (g.measureText(t).width > 330 && tam > 60) { tam -= 10; g.font = `italic 600 ${tam}px 'Cormorant Garamond', Georgia, serif`; }
    g.fillText(t, 256, 270);
    // anel fino gravado em volta
    g.lineWidth = 7; g.beginPath(); g.arc(256, 256, 214, 0, Math.PI * 2); g.stroke();
    this.foto = cv; this._tex(1, cv); this.temFoto = true; this.desenhar();
  }
  definirAjuste(a) { Object.assign(this.ajuste, a); this.desenhar(); }
  _quadro() {
    const m = this.m;
    // com o tempo exato do quadro exibido usa arredondamento; sem ele, o relógio do vídeo
    const t = this.tempoQuadro !== undefined && Math.abs(this.tempoQuadro - this.v.currentTime) < .25 ? this.tempoQuadro : this.v.currentTime;
    const f = (this.tempoQuadro !== undefined ? Math.round(t * m.fps) : Math.floor(t * m.fps + 1e-3)) - m.inicio;
    if (f < 0 || !m.quadros.length) return null;
    if (m.tipo === 'selo' && f >= m.quadros.length) return null;
    return { r: m.quadros[Math.min(f, m.quadros.length - 1)], f };
  }
  desenhar() {
    const gl = this.gl, v = this.v;
    if (v.paused && this.tempoQuadro !== undefined && Math.abs(this.tempoQuadro - v.currentTime) > .02) this.tempoQuadro = undefined;
    if (v.readyState >= 2) { this._tex(0, v); }
    gl.viewport(0, 0, this.c.width, this.c.height);
    const q = this._quadro();
    let alfa = 0, ret = [0,0,0,0];
    const selo = this.m.tipo === 'selo';
    if (q) {
      const [x,y,w,h] = q.r, ix = w*.015, iy = h*.015;
      ret = [x+ix, y+iy, w-2*ix, h-2*iy];
      // foto entra com fade; iniciais do selo já começam visíveis e somem no fim do rastreio
      alfa = selo ? Math.min(1, (this.m.quadros.length - q.f) / 6) : Math.min(1, (q.f+1)/10);
    }
    gl.uniform1f(this.u.modoSelo, selo ? 1 : 0);
    gl.uniform4fv(this.u.ret, ret); gl.uniform1f(this.u.alfa, alfa);
    gl.uniform1f(this.u.forma, selo ? 1 : ({ retangulo: 0, circulo: 1, mascara: 2 }[this.m.forma] || 0));
    gl.uniform1f(this.u.usaChave, this.m.chave ? 1 : 0);
    gl.uniform1f(this.u.temFoto, this.temFoto ? 1 : 0);
    if (selo && q) gl.uniform4fv(this.u.fotoUV, [1, 1, 0, 0]);
    else if (this.foto && q) {
      // "cover": preenche a moldura mantendo a proporção da foto
      const ra = (ret[2]*720) / (ret[3]*1280), fa = this.foto.width / this.foto.height, z = this.ajuste.zoom;
      let sx = 1, sy = 1; if (fa > ra) sx = ra / fa; else sy = fa / ra;
      sx /= z; sy /= z;
      const ox = (1 - sx) * this.ajuste.x, oy = (1 - sy) * this.ajuste.y;
      gl.uniform4fv(this.u.fotoUV, [sx, sy, ox, oy]);
    }
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }
  _loop() {
    if (this.parado) return;
    // com requestVideoFrameCallback, o loop só cuida de vídeo pausado (ajustes, troca de foto)
    const porQuadro = this.tempoQuadro !== undefined && !this.v.paused;
    if (!porQuadro && (!this.v.paused || this._sujo !== this.v.currentTime)) { this._sujo = this.v.currentTime; this.desenhar(); }
    requestAnimationFrame(this._loop);
  }
  parar() { this.parado = true; }
}

// Vitrine vem do banco (/api/modelos). Se a API falhar, usa a lista fixa do site.
export async function carregarModelos() {
  try { const r = await fetch('/api/modelos'); if (r.ok) { const j = await r.json(); if (j.modelos?.length) return j; } } catch {}
  return (await fetch('/modelos/modelos.json')).json();
}

// Foto de exemplo usada na vitrine enquanto o cliente não envia a dele
export function fotoExemplo() {
  const c = document.createElement('canvas'); c.width = 600; c.height = 800; const g = c.getContext('2d');
  const gr = g.createLinearGradient(0, 0, 0, 800); gr.addColorStop(0, '#F6D7E4'); gr.addColorStop(1, '#C9B8F2');
  g.fillStyle = gr; g.fillRect(0, 0, 600, 800);
  g.fillStyle = 'rgba(255,255,255,.75)'; g.beginPath(); g.arc(300, 330, 95, 0, 7); g.fill();
  g.beginPath(); g.ellipse(300, 640, 190, 160, 0, Math.PI, 0); g.fill();
  g.fillStyle = '#3B1D46'; g.font = '600 44px "Bricolage Grotesque", sans-serif'; g.textAlign = 'center';
  g.fillText('Sua foto aqui', 300, 150);
  return c;
}
