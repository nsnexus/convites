#!/usr/bin/env python3
"""Põe ?v=<hash do conteúdo> em todo CSS/JS referenciado (HTML e imports entre módulos).
Assim o navegador baixa a versão nova assim que um arquivo muda, mesmo com cache longo.
Rodar antes de cada commit: python3 scripts/versionar.py"""
import hashlib, re, pathlib
PUB = pathlib.Path(__file__).resolve().parent.parent / 'public'
IMP = re.compile(r"""((?:from|import)\s*\(?\s*['"])(\./[\w.-]+\.js)(?:\?v=[\w-]+)?(['"])""")
REF = re.compile(r"""((?:src|href)=")(/assets/[\w./-]+\.(?:js|css))(?:\?v=[\w-]+)?(")""")
memo = {}
def versao(arq):
    arq = arq.resolve()
    if arq in memo: return memo[arq]
    memo[arq] = 'x'  # evita laço
    txt = arq.read_text(encoding='utf-8')
    if arq.suffix == '.js':
        txt = IMP.sub(lambda m: m[1] + m[2] + '?v=' + versao(arq.parent / m[2]) + m[3], txt)
        arq.write_text(txt, encoding='utf-8')
    memo[arq] = hashlib.sha1(txt.encode()).hexdigest()[:8]
    return memo[arq]
for js in (PUB / 'assets/js').glob('*.js'): versao(js)
for html in PUB.rglob('*.html'):
    t = html.read_text(encoding='utf-8')
    n = REF.sub(lambda m: m[1] + m[2] + '?v=' + versao(PUB / m[2].lstrip('/')) + m[3], t)
    if n != t: html.write_text(n, encoding='utf-8')
print('versões atualizadas')
