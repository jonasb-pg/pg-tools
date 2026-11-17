#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
PG Etikett: kleines Druckprogramm für den Brother QL-500 am Analyseplatz (17.11.2026, Jonas).

Warum: Für den QL-500 gibt es auf dem Mac keinen Treiber mehr, der Drucker erscheint in keinem Druckdialog.
Dieses Programm spricht den Drucker direkt über USB an (wie P-touch Editor) und nimmt die Aufträge vom Analyse Tool entgegen.

Ablauf: Das Analyse Tool öffnet ein kleines Fenster auf http://127.0.0.1:9123/druck?id=…&t=…&f=90&n=…
        Das Programm zeichnet das Etikett (QR-Code, ID, Bezeichnung), druckt es und das Fenster schliesst sich.

Es hört nur auf diesem Rechner (127.0.0.1), schreibt nichts ausser seinem Protokoll und kennt keine Zugangsdaten.

Aufrufe:
  pg_etikett.py            Dienst starten
  pg_etikett.py --probe    Selbsttest ohne Drucker: Bibliotheken, Etikett zeichnen, Druckdaten erzeugen
  pg_etikett.py --drucker  angeschlossene Brother-Geräte zeigen
  pg_etikett.py --test     ein Testetikett drucken
"""
import html, inspect, json, os, sys, threading, time, traceback, urllib.parse
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

VERSION = '2026-11-17.3'
PORT = 9123
MODELL = 'QL-500'
HERSTELLER = 0x04F9                                   # Brother
# Format aus dem Analyse Tool → Rolle. b × h = bedruckbare Fläche in Punkten (300 dpi), quer gelesen.
FORMATE = {
    '90': {'name': '29 × 90 mm', 'label': '29x90', 'b': 991, 'h': 306, 'drehen': True},    # schmale Rolle: Etikett läuft der Länge nach
    '62': {'name': '62 × 29 mm (DK-11209)', 'label': '62x29', 'b': 696, 'h': 271, 'drehen': False},
}
PROTOKOLL = os.path.expanduser('~/Library/Logs/pg-etikett.log')
SPERRE = threading.Lock()
GEDRUCKT = {}                                         # Auftragsnummer → Zeit: derselbe Auftrag druckt nie zweimal (Fenster neu geladen)


def log(text):
    zeile = time.strftime('%d.%m.%Y %H:%M:%S ') + str(text)
    try:
        os.makedirs(os.path.dirname(PROTOKOLL), exist_ok=True)
        with open(PROTOKOLL, 'a', encoding='utf-8') as f:
            f.write(zeile + '\n')
    except OSError:
        pass
    print(zeile, flush=True)


# ---------- Etikett zeichnen ----------
SCHRIFT_FETT = ['/System/Library/Fonts/Menlo.ttc:1', '/System/Library/Fonts/Supplemental/Courier New Bold.ttf',
                '/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf', '/usr/share/fonts/truetype/liberation/LiberationMono-Bold.ttf']
SCHRIFT_TEXT = ['/System/Library/Fonts/Helvetica.ttc:0', '/System/Library/Fonts/Supplemental/Arial.ttf',
                '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf']


def schrift(liste, groesse):
    from PIL import ImageFont
    for eintrag in liste:
        pfad, _, nr = eintrag.partition(':')
        if os.path.exists(pfad):
            try:
                return ImageFont.truetype(pfad, groesse, index=int(nr or 0))
            except Exception:
                continue
    try:
        return ImageFont.load_default(groesse)
    except TypeError:
        return ImageFont.load_default()


def breite(z, text, f):
    return z.textlength(text, font=f)


def passt(z, text, platz, liste, gross, klein):
    """Schrift verkleinern bis «klein», dann mit … kürzen."""
    g = gross
    while g > klein:
        f = schrift(liste, g)
        if breite(z, text, f) <= platz:
            return f, text
        g -= 2
    f = schrift(liste, klein)
    if breite(z, text, f) <= platz:
        return f, text
    s = text
    while len(s) > 1 and breite(z, s + '…', f) > platz:
        s = s[:-1]
    return f, s.strip() + '…'


def qr_matrix(text):
    """QR-Code als Liste von Zeilen (True = dunkel). Fehlt die Bibliothek, gibt es kein Bild: Die ID steht immer als Text auf dem Etikett."""
    try:
        import qrcode
        q = qrcode.QRCode(border=0, error_correction=qrcode.constants.ERROR_CORRECT_M)
        q.add_data(text)
        q.make(fit=True)
        return q.get_matrix()
    except Exception as e:                           # noqa: BLE001
        log('QR-Code nicht möglich: %r' % (e,))
        return None


def zeichne(kennung, titel, fmt):
    """Etikett quer gelesen, schwarz auf weiss, genau so gross wie die bedruckbare Fläche."""
    from PIL import Image, ImageDraw
    F = FORMATE[fmt]
    B, H = F['b'], F['h']
    bild = Image.new('L', (B, H), 255)
    z = ImageDraw.Draw(bild)
    rand = 14
    x0 = rand
    m = qr_matrix(kennung)
    if m:
        n = len(m)
        seite = H - 2 * rand
        p = max(1, seite // n)
        ab = rand + (seite - p * n) // 2
        for y, zeile in enumerate(m):
            for x, dunkel in enumerate(zeile):
                if dunkel:
                    z.rectangle([ab + x * p, ab + y * p, ab + (x + 1) * p - 1, ab + (y + 1) * p - 1], fill=0)
        x0 = rand + seite + 24
    platz = B - rand - x0
    k = H / 306.0                                     # Masse für 306 Punkte Höhe, für andere Höhen mitskaliert
    f_id, t_id = passt(z, kennung, platz, SCHRIFT_FETT, int(92 * k), int(38 * k))
    z.text((x0, int(134 * k)), t_id, font=f_id, fill=0, anchor='ls')
    f_t = schrift(SCHRIFT_TEXT, int(36 * k))
    worte = ' '.join(str(titel or '').split()).split(' ')
    z1, rest = '', ''
    for i, w in enumerate(worte):
        probe = (z1 + ' ' + w) if z1 else w
        if breite(z, probe, f_t) <= platz or not z1:
            z1 = probe
        else:
            rest = ' '.join(worte[i:])
            break
    if z1:
        z.text((x0, int(198 * k)), passt(z, z1, platz, SCHRIFT_TEXT, int(36 * k), int(36 * k))[1], font=f_t, fill=0, anchor='ls')
    if rest:
        z.text((x0, int(246 * k)), passt(z, rest, platz, SCHRIFT_TEXT, int(36 * k), int(36 * k))[1], font=f_t, fill=0, anchor='ls')
    return bild


# ---------- Drucken ----------
def druckdaten(bild, fmt):
    """Bild → Befehle für den Drucker (Bibliothek brother_ql). Übergeben wird nur, was die installierte Fassung kennt."""
    from brother_ql.raster import BrotherQLRaster
    from brother_ql.conversion import convert
    F = FORMATE[fmt]
    if F['drehen']:
        bild = bild.rotate(90, expand=True)           # 991 × 306 quer → 306 × 991 der Länge nach
    def wandle(q):
        q.exception_on_warning = True
        w = dict(qlr=q, images=[bild], label=F['label'], rotate='0', threshold=70.0, dither=False, compress=False,
                 red=False, dpi_600=False, hq=True, cut=True)
        p = inspect.signature(convert).parameters
        if not any(x.kind == x.VAR_KEYWORD for x in p.values()):
            w = {a: b for a, b in w.items() if a in p}
        aus = convert(**w)
        return aus if isinstance(aus, (bytes, bytearray)) else q.data
    try:
        daten = wandle(BrotherQLRaster(MODELL))
    except Exception as e:                            # noqa: BLE001
        # Befund Mac mini 17.11.2026: Für 62 × 29 mm meldet die Bibliothek «Invalid raster height: 271, expected between 295 and 11811 dots for the QL-500».
        # Die Mindestlänge des Modells (25 mm, gedacht für Endlosband) greift dort auch bei vorgestanzten Etiketten, obwohl das Etikett selbst 29 mm lang ist.
        # Nur in diesem Fall: Mindestlänge für diesen Lauf auf die Höhe des Etiketts senken und nochmals wandeln.
        if 'raster height' not in str(e).lower():
            raise
        q = BrotherQLRaster(MODELL)
        if not laenge_lockern(q, bild.size[1]):
            raise
        log('Mindestlänge des Modells für %s auf %d Punkte gesenkt' % (F['name'], bild.size[1]))
        daten = wandle(q)
    if not daten:
        raise RuntimeError('Die Bibliothek hat keine Druckdaten geliefert.')
    return bytes(daten)


def _ist_laengenbereich(v, hoehe):
    return (isinstance(v, (tuple, list)) and len(v) == 2 and all(isinstance(x, int) and not isinstance(x, bool) for x in v)
            and hoehe < v[0] < 2000 and v[1] > 5000)


def laenge_lockern(q, hoehe):
    """Sucht die Mindest-/Höchstlänge des Modells (ein Zahlenpaar wie 295, 11811) und senkt das Minimum auf «hoehe».
    Die Bibliothek gibt es in zwei Bauarten: Modell als Objekt mit Eigenschaften, oder Modellname mit Tabellen im Modul. Beide werden abgedeckt."""
    geaendert = False
    m = getattr(q, 'model', None)
    if m is not None and not isinstance(m, str):
        for name in dir(m):
            if name.startswith('__'):
                continue
            try:
                v = getattr(m, name)
            except Exception:                         # noqa: BLE001
                continue
            if _ist_laengenbereich(v, hoehe):
                neu = type(v)((hoehe, v[1]))
                try:
                    object.__setattr__(m, name, neu)
                    geaendert = True
                except Exception:                     # noqa: BLE001
                    try:
                        setattr(m, name, neu)
                        geaendert = True
                    except Exception:                 # noqa: BLE001
                        pass
    schluessel = [m, getattr(m, 'name', None), getattr(m, 'identifier', None), MODELL]
    for modname, mod in list(sys.modules.items()):
        if not modname.startswith('brother_ql') or mod is None:
            continue
        for tabelle in list(vars(mod).values()):
            if not isinstance(tabelle, dict):
                continue
            for k in schluessel:
                try:
                    v = tabelle.get(k)
                except TypeError:
                    continue
                if _ist_laengenbereich(v, hoehe):
                    tabelle[k] = type(v)((hoehe, v[1]))
                    geaendert = True
    return geaendert


def usb_backend():
    """libusb aus dem Paket «libusb-package» (kein Homebrew nötig); sonst das, was pyusb im System findet."""
    try:
        import libusb_package
        return libusb_package.get_libusb1_backend()
    except Exception:                                 # noqa: BLE001
        return None


def geraete():
    import usb.core
    def ist_drucker(d):
        try:
            return any(i.bInterfaceClass == 7 for c in d for i in c)
        except Exception:                             # noqa: BLE001
            return False
    alle = list(usb.core.find(find_all=True, idVendor=HERSTELLER, backend=usb_backend()) or [])
    return [d for d in alle if ist_drucker(d)]


def geraet_name(d):
    try:
        return '%s (%04x:%04x)' % (d.product or 'Brother', d.idVendor, d.idProduct)
    except Exception:                                 # noqa: BLE001
        return 'Brother (%04x:%04x)' % (d.idVendor, d.idProduct)


def sende(daten):
    import usb.core
    import usb.util
    liste = geraete()
    if not liste:
        raise RuntimeError('Kein Brother-Drucker über USB gefunden. Ist der QL-500 eingeschaltet und eingesteckt?')
    d = liste[0]
    try:
        try:
            if d.is_kernel_driver_active(0):
                d.detach_kernel_driver(0)
        except (NotImplementedError, usb.core.USBError):
            pass
        try:
            d.set_configuration()
        except usb.core.USBError:
            pass                                      # schon eingestellt
        schnitt = None
        for i in d.get_active_configuration():
            if i.bInterfaceClass == 7:
                schnitt = i
                break
        if schnitt is None:
            raise RuntimeError('Der Drucker meldet keine Druckschnittstelle.')
        aus = usb.util.find_descriptor(schnitt, custom_match=lambda e: usb.util.endpoint_direction(e.bEndpointAddress) == usb.util.ENDPOINT_OUT)
        if aus is None:
            raise RuntimeError('Der Drucker hat keinen Eingang für Druckdaten.')
        try:
            usb.util.claim_interface(d, schnitt.bInterfaceNumber)
        except usb.core.USBError as e:
            raise RuntimeError('Der Drucker ist belegt (%s). Bitte P-touch Editor schliessen und nochmals drucken.' % (e,))
        aus.write(daten, timeout=20000)
        return geraet_name(d)
    finally:
        try:
            usb.util.dispose_resources(d)
        except Exception:                             # noqa: BLE001
            pass


def drucke(kennung, titel, fmt):
    with SPERRE:
        bild = zeichne(kennung, titel, fmt)
        daten = druckdaten(bild, fmt)
        name = sende(daten)
    log('gedruckt %s · %s · %s · %d Bytes' % (kennung, FORMATE[fmt]['name'], name, len(daten)))
    return name


# ---------- kleine Webseite ----------
STIL = ('body{font:16px/1.4 -apple-system,Helvetica,Arial,sans-serif;margin:24px;color:#0a0a0a;background:#fff}h1{font-size:20px;margin:0 0 8px}'
        '.ok{color:#0a7a2f}.stop{color:#b00020}code{background:#eee;padding:2px 5px;border-radius:3px}a.k,button{display:inline-block;margin-top:10px;'
        'padding:8px 14px;border:2px solid #0a0a0a;border-radius:6px;background:#ffb5f5;color:#0a0a0a;text-decoration:none;font:inherit;cursor:pointer}')


def seite(titel, inhalt, zu=False):
    return ('<!doctype html><html lang="de"><head><meta charset="utf-8"><title>%s</title><style>%s</style></head><body>%s%s</body></html>'
            % (html.escape(titel), STIL, inhalt, '<script>setTimeout(function(){window.close()},1400)</script>' if zu else ''))


def stand():
    aus = {'version': VERSION, 'modell': MODELL, 'drucker': [], 'fehler': ''}
    try:
        aus['drucker'] = [geraet_name(d) for d in geraete()]
    except Exception as e:                            # noqa: BLE001
        aus['fehler'] = str(e)
    return aus


class Anfrage(BaseHTTPRequestHandler):
    server_version = 'PGEtikett/' + VERSION

    def log_message(self, *a):                        # das eigene Protokoll reicht
        pass

    def antwort(self, code, text, art='text/html; charset=utf-8'):
        b = text.encode('utf-8')
        self.send_response(code)
        self.send_header('Content-Type', art)
        self.send_header('Content-Length', str(len(b)))
        self.send_header('Cache-Control', 'no-store')
        self.end_headers()
        self.wfile.write(b)

    def do_GET(self):
        u = urllib.parse.urlsplit(self.path)
        q = urllib.parse.parse_qs(u.query)
        eins = lambda k: (q.get(k) or [''])[0]
        if u.path == '/status.json':
            return self.antwort(200, json.dumps(stand(), ensure_ascii=False), 'application/json; charset=utf-8')
        if u.path in ('/', '/status'):
            s = stand()
            dr = ('<p class="ok">Drucker gefunden: %s</p>' % html.escape(', '.join(s['drucker']))) if s['drucker'] else \
                 ('<p class="stop">Kein Brother-Drucker gefunden. %s</p>' % html.escape(s['fehler']))
            links = ''.join('<a class="k" href="/druck?id=TEST-0001&amp;t=Testetikett%%20Pretty%%20Good&amp;f=%s&amp;n=%d">Testetikett %s</a> '
                            % (k, int(time.time() * 1000) + i, html.escape(v['name'])) for i, (k, v) in enumerate(FORMATE.items()))
            return self.antwort(200, seite('PG Etikett', '<h1>PG Etikett läuft</h1><p>Version %s · Modell %s</p>%s<p>%s</p>' % (VERSION, MODELL, dr, links)))
        if u.path == '/druck':
            kennung = eins('id').strip()[:40]
            titel = eins('t').strip()[:160]
            fmt = eins('f') if eins('f') in FORMATE else '90'
            nr = eins('n')[:40]
            if not kennung:
                return self.antwort(400, seite('Etikett', '<h1 class="stop">Keine ID angegeben.</h1>'))
            jetzt = time.time()
            for k in [k for k, t in GEDRUCKT.items() if jetzt - t > 3600]:
                GEDRUCKT.pop(k, None)
            if nr and nr in GEDRUCKT:
                return self.antwort(200, seite('Etikett', '<h1>Etikett %s ist schon gedruckt.</h1><p>Für ein weiteres Etikett im Analyse Tool nochmals auf «Etikett drucken» klicken.</p>' % html.escape(kennung)))
            try:
                drucke(kennung, titel, fmt)
            except Exception as e:                    # noqa: BLE001
                log('FEHLER %s: %r\n%s' % (kennung, e, traceback.format_exc()))
                return self.antwort(500, seite('Etikett', '<h1 class="stop">Das Etikett %s liess sich nicht drucken.</h1><p>%s</p><p>Bitte die ID von Hand anschreiben oder nochmals versuchen.</p>'
                                               % (html.escape(kennung), html.escape(str(e)))))
            if nr:
                GEDRUCKT[nr] = jetzt
            return self.antwort(200, seite('Etikett', '<h1 class="ok">Etikett %s gedruckt.</h1><p>Bitte aufkleben. Dieses Fenster schliesst sich von selbst.</p>' % html.escape(kennung), zu=True))
        return self.antwort(404, seite('PG Etikett', '<h1>Nicht gefunden</h1>'))


def probe():
    """Selbsttest ohne Drucker. Jede Zeile sagt, was geht und was nicht."""
    gut = True
    def zeile(ok, text):
        nonlocal gut
        gut = gut and ok
        print(('OK      ' if ok else 'FEHLER  ') + text, flush=True)
    print('PG Etikett %s · Python %s' % (VERSION, sys.version.split()[0]))
    for modul, wozu in [('PIL', 'Etikett zeichnen'), ('qrcode', 'QR-Code'), ('brother_ql', 'Druckdaten für den QL-500'), ('usb', 'USB'), ('libusb_package', 'USB ohne Homebrew')]:
        try:
            __import__(modul)
            zeile(True, 'Bibliothek %s (%s)' % (modul, wozu))
        except Exception as e:                        # noqa: BLE001
            zeile(modul == 'libusb_package', 'Bibliothek %s (%s) fehlt: %r' % (modul, wozu, e))
    for fmt, F in FORMATE.items():
        try:
            bild = zeichne('PG-25337', 'Testgerät mit einem längeren Namen zum Umbrechen', fmt)
            pfad = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'probe-%s.png' % fmt)
            try:
                bild.save(pfad)
            except OSError:
                pfad = '(nicht gespeichert)'
            zeile(bild.size == (F['b'], F['h']), 'Etikett %s gezeichnet, %d × %d Punkte, %s' % (F['name'], bild.size[0], bild.size[1], pfad))
            daten = druckdaten(bild, fmt)
            zeile(len(daten) > 1000, 'Druckdaten %s erzeugt, %d Bytes' % (F['name'], len(daten)))
        except Exception as e:                        # noqa: BLE001
            zeile(False, 'Etikett %s: %r' % (F['name'], e))
            traceback.print_exc()
            try:                                      # für die Fehlersuche: wie die installierte Bibliothek das Modell beschreibt
                from brother_ql.raster import BrotherQLRaster
                m = getattr(BrotherQLRaster(MODELL), 'model', None)
                print('        Modell laut Bibliothek: %r' % (m,))
                print('        Eigenschaften: %r' % ({n: getattr(m, n) for n in dir(m) if not n.startswith('_') and not callable(getattr(m, n, None))},))
            except Exception as e2:                   # noqa: BLE001
                print('        (Modell nicht lesbar: %r)' % (e2,))
    try:
        g = geraete()
        zeile(bool(g), 'Drucker über USB: %s' % (', '.join(geraet_name(d) for d in g) or 'keiner gefunden (eingeschaltet und eingesteckt?)'))
    except Exception as e:                            # noqa: BLE001
        zeile(False, 'USB: %r' % (e,))
    print('ERGEBNIS: ' + ('alles in Ordnung' if gut else 'es gibt Fehler, bitte diese Ausgabe an Claude schicken'))
    return 0 if gut else 1


def main(arg):
    if '--probe' in arg:
        return probe()
    if '--drucker' in arg:
        for d in geraete():
            print(geraet_name(d))
        return 0
    if '--test' in arg:
        print('gedruckt auf ' + drucke('TEST-0001', 'Testetikett Pretty Good', '62' if '62' in arg else '90'))
        return 0
    try:
        dienst = ThreadingHTTPServer(('127.0.0.1', PORT), Anfrage)
    except OSError as e:
        log('Start nicht möglich (läuft der Dienst schon?): %r' % (e,))
        return 1
    log('PG Etikett %s hört auf http://127.0.0.1:%d' % (VERSION, PORT))
    try:
        dienst.serve_forever()
    except KeyboardInterrupt:
        pass
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
