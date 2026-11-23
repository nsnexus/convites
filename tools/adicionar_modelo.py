#!/usr/bin/env python3
"""
Adiciona um vídeo novo à vitrine.

O vídeo precisa terminar com uma moldura BRANCA vazia (é onde a foto entra).
O script: converte o vídeo para web (720x1280), gera a capa, rastreia a
moldura quadro a quadro e grava tudo em public/modelos/modelos.json.

Uso:
  python3 tools/adicionar_modelo.py VIDEO.mp4 --nome "Safari" --categoria aventura
Opções úteis se a moldura não for detectada direito:
  --limiar 225   (brilho mínimo do branco, 0-255; suba para papel creme: 235-240)
  --sat 18       (quanto o "branco" pode ter de cor; suba se houver pétalas/confete)
  --forma retangulo|circulo
Confira o resultado em tools/conferir_<id>.jpg
Requer: ffmpeg, python3, numpy, scipy, pillow
"""
import argparse, subprocess, json, os, hashlib
import numpy as np
from scipy import ndimage
from PIL import Image, ImageDraw

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PASTA = os.path.join(RAIZ, 'public', 'modelos')
W, H = 270, 480

def quadros(path):
    p = subprocess.Popen(['ffmpeg', '-v', 'error', '-i', path, '-vf', f'scale={W}:{H}', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], stdout=subprocess.PIPE)
    fs = []
    while True:
        b = p.stdout.read(W * H * 3)
        if len(b) < W * H * 3: break
        fs.append(np.frombuffer(b, np.uint8).reshape(H, W, 3).astype(int))
    return fs

def componente(f, limiar, sat, semente, fechar=True):
    w = (f.min(2) > limiar) & ((f.max(2) - f.min(2)) < sat)
    w = ndimage.binary_opening(w, iterations=1)
    if fechar: w = ndimage.binary_closing(w, iterations=3)
    w = ndimage.binary_fill_holes(w)
    lab, n = ndimage.label(w)
    sx, sy = int(semente[0]), int(semente[1])
    k = lab[sy, sx]
    if k == 0:
        jan = lab[max(0, sy - 6):sy + 7, max(0, sx - 6):sx + 7]; v = jan[jan > 0]
        if not len(v): return None
        k = np.bincount(v).argmax()
    ys, xs = np.where(lab == k)
    return (xs.min(), ys.min(), xs.max() + 1, ys.max() + 1)

def rastrear(fs, limiar, sat, fechar):
    b = componente(fs[-1], limiar, sat, (W / 2, H * .48), fechar)
    if b is None: raise SystemExit('Moldura branca não encontrada no último quadro. Tente --limiar menor.')
    asp = (b[2] - b[0]) / (b[3] - b[1]); area = (b[2] - b[0]) * (b[3] - b[1])
    tr = {len(fs) - 1: b}; ant = b
    for i in range(len(fs) - 2, -1, -1):
        c = ((ant[0] + ant[2]) / 2, (ant[1] + ant[3]) / 2)
        bb = componente(fs[i], limiar, sat, c, fechar)
        if bb is None: break
        a2 = (bb[2] - bb[0]) * (bb[3] - bb[1]); asp2 = (bb[2] - bb[0]) / max(1, bb[3] - bb[1]); pa = (ant[2] - ant[0]) * (ant[3] - ant[1])
        if abs(asp2 / asp - 1) > .15 or a2 > pa * 1.08 or a2 < pa * .6 or a2 < area * .04: break
        tr[i] = bb; ant = bb
    ini = min(tr)
    r = np.array([[tr[i][0] / W, tr[i][1] / H, (tr[i][2] - tr[i][0]) / W, (tr[i][3] - tr[i][1]) / H] for i in range(ini, len(fs))])
    if len(r) >= 5:  # suaviza tremidas
        m = np.array([np.median(r[max(0, i - 2):i + 3], 0) for i in range(len(r))])
        r = np.array([m[max(0, i - 1):i + 2].mean(0) for i in range(len(r))])
    return ini, np.round(r, 4).tolist()

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('video'); ap.add_argument('--nome', required=True); ap.add_argument('--categoria', required=True)
    ap.add_argument('--categoria-nome'); ap.add_argument('--limiar', type=int, default=225); ap.add_argument('--sat', type=int, default=18)
    ap.add_argument('--forma', default='retangulo', choices=['retangulo', 'circulo']); ap.add_argument('--sem-fechar', action='store_true')
    a = ap.parse_args()
    mid = hashlib.sha1(open(a.video, 'rb').read()).hexdigest()[:8]
    print('id do modelo:', mid)
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', a.video, '-vf', 'scale=720:1280', '-r', '24', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '26', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '96k', '-movflags', '+faststart', f'{PASTA}/{mid}.mp4'], check=True)
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', '1.2', '-i', a.video, '-frames:v', '1', '-vf', 'scale=480:854', '-q:v', '4', f'{PASTA}/{mid}.jpg'], check=True)
    fs = quadros(f'{PASTA}/{mid}.mp4')
    ini, rets = rastrear(fs, a.limiar, a.sat, not a.sem_fechar)
    print(f'foto aparece em {ini / 24:.2f}s; moldura final: {rets[-1]}')
    # imagem de conferência
    ims = []
    for j in [0, len(rets) // 2, len(rets) - 1]:
        im = Image.fromarray(fs[ini + j].astype(np.uint8)); d = ImageDraw.Draw(im); x, y, w, h = rets[j]
        d.rectangle([x * W, y * H, (x + w) * W, (y + h) * H], outline=(255, 0, 80), width=3); ims.append(im)
    out = Image.new('RGB', (W * 3, H)); [out.paste(im, (i * W, 0)) for i, im in enumerate(ims)]
    out.save(os.path.join(RAIZ, 'tools', f'conferir_{mid}.jpg'))
    cat_path = f'{PASTA}/modelos.json'; dados = json.load(open(cat_path))
    if a.categoria not in [c['id'] for c in dados['categorias']]:
        dados['categorias'].append({'id': a.categoria, 'nome': a.categoria_nome or a.categoria.capitalize()})
    dados['modelos'] = [m for m in dados['modelos'] if m['id'] != mid]
    dados['modelos'].append({'id': mid, 'nome': a.nome, 'categoria': a.categoria, 'video': f'/modelos/{mid}.mp4', 'poster': f'/modelos/{mid}.jpg',
                             'fps': 24, 'inicio': ini, 'forma': a.forma, 'mascara': None, 'chave': True, 'quadros': rets})
    json.dump(dados, open(cat_path, 'w'), ensure_ascii=False, separators=(',', ':'))
    print('ok. Confira', f'tools/conferir_{mid}.jpg', 'e faça o commit.')

if __name__ == '__main__': main()
