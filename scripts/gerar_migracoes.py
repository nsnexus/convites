#!/usr/bin/env python3
"""Converte migrations/*.sql em functions/_lib/migracoes.js (usado pelo botão de instalar do admin)."""
import os, json, re
raiz = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
pasta = os.path.join(raiz, 'migrations')
out = ["// GERADO a partir de migrations/*.sql — rode `python3 scripts/gerar_migracoes.py` depois de criar uma migração nova.", "export const MIGRACOES = ["]
for f in sorted(x for x in os.listdir(pasta) if x.endswith('.sql')):
    sql = "\n".join(l for l in open(os.path.join(pasta, f)).read().splitlines() if not l.strip().startswith('--'))
    stmts = [re.sub(r'\s+--[^\n]*', '', s).strip().rstrip(';') for s in sql.split(';\n') if s.strip()]
    out.append(f"  {{ nome: {json.dumps(f)}, sql: {json.dumps(stmts, ensure_ascii=False)} }},")
out.append("];")
open(os.path.join(raiz, 'functions', '_lib', 'migracoes.js'), 'w').write("\n".join(out) + "\n")
print('ok')
