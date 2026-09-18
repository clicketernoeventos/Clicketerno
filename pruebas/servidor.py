#!/usr/bin/env python3
"""Sirve el sitio con las cabeceras de _headers puestas.

Existe porque python -m http.server no las manda, y entonces la CSP —que es
lo que impide que un script ajeno se lleve la clave del evento— no la
probaba nadie: se escribía, se subía, y si estaba mal nos enterábamos
cuando al organizador no le cargaba el QR en la fiesta. Ahora las pruebas
corren contra las mismas cabeceras que sirve Cloudflare.

    python3 pruebas/servidor.py 8099
"""
import http.server, socketserver, os, re, sys

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ARCHIVO = os.path.join(RAIZ, '_headers')


def reglas():
    """Lee _headers con el mismo formato que usa Cloudflare: un patrón sin
    sangría y debajo sus cabeceras con sangría."""
    fuera, patron, cab = [], None, []
    if not os.path.exists(ARCHIVO):
        return fuera
    with open(ARCHIVO, encoding='utf-8') as f:
        for linea in f:
            s = linea.rstrip('\n')
            if not s.strip() or s.strip().startswith('#'):
                continue
            if s[:1] not in (' ', '\t'):
                if patron:
                    fuera.append((patron, cab))
                patron, cab = s.strip(), []
            else:
                k, _, v = s.strip().partition(':')
                cab.append((k.strip(), v.strip()))
    if patron:
        fuera.append((patron, cab))
    return fuera


REGLAS = reglas()


def casa(patron, ruta):
    return re.match('^' + re.escape(patron).replace(r'\*', '.*') + '$', ruta) is not None


class Mano(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **k):
        super().__init__(*a, directory=RAIZ, **k)

    def end_headers(self):
        ruta = self.path.split('?')[0]
        for patron, cab in REGLAS:
            if casa(patron, ruta):
                for k, v in cab:
                    self.send_header(k, v)
        super().end_headers()

    def log_message(self, *a):
        pass


if __name__ == '__main__':
    puerto = int(sys.argv[1]) if len(sys.argv) > 1 else 8099
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(('127.0.0.1', puerto), Mano) as s:
        s.serve_forever()
