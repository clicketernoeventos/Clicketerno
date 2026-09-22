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
    # Python no conoce .webmanifest y lo serviría como "octet-stream": el
    # navegador entonces ignora el manifiesto sin decir nada y la app deja
    # de poder ponerse en la pantalla del teléfono. Cloudflare sí lo manda
    # bien, así que sin esto la diferencia esconde justo lo que hay que ver.
    extensions_map = {
        **http.server.SimpleHTTPRequestHandler.extensions_map,
        '.webmanifest': 'application/manifest+json',
        '.webp': 'image/webp',
    }

    def __init__(self, *a, **k):
        super().__init__(*a, directory=RAIZ, **k)

    def translate_path(self, path):
        """Direcciones limpias, como Cloudflare: /muro sirve muro.html.

        Sin esto, cualquier cosa que use la dirección limpia daba 404 SOLO
        en las pruebas. La vitrina de la página de inicio mete /muro y
        /rollo en un marco: acá se veía negra y en producción anda. Un
        servidor de pruebas que no se parece al de verdad esconde
        exactamente lo que hay que ver.
        """
        entero = super().translate_path(path)
        if not os.path.exists(entero) and not os.path.splitext(entero)[1]:
            if os.path.exists(entero + '.html'):
                return entero + '.html'
        return entero

    def end_headers(self):
        ruta = self.path.split('?')[0]
        for patron, cab in REGLAS:
            if casa(patron, ruta):
                for k, v in cab:
                    self.send_header(k, v)
        super().end_headers()

    def log_message(self, *a):
        pass


class Servidor(socketserver.ThreadingTCPServer):
    """Atiende de a varios, como Cloudflare.

    Con el TCPServer pelado atendía de a UNO: la prueba de sesenta
    invitados mandando la foto al mismo tiempo fallaba con "timeout" en
    cincuenta y tres de ellos, y no era la app — era este servidor
    haciendo cola para entregar un HTML de 250 KB. Un servidor de
    pruebas que no se parece al de verdad esconde justo lo que hay que
    ver, y acá lo que escondía era lo contrario: inventaba una falla
    que en producción no existe.
    """
    daemon_threads = True
    allow_reuse_address = True


if __name__ == '__main__':
    puerto = int(sys.argv[1]) if len(sys.argv) > 1 else 8099
    with Servidor(('127.0.0.1', puerto), Mano) as s:
        s.serve_forever()
