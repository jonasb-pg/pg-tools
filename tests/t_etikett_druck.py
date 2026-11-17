import os; os.chdir(os.path.dirname(os.path.abspath(__file__)))
"""Druckprogramm tools/etikett-druck/pg_etikett.py (17.11.2026, Jonas). Ohne Drucker und ohne die echten Bibliotheken:
qrcode, brother_ql und usb sind hier Attrappen, die prüfen, was das Programm ihnen übergibt. Erfundene Daten."""
import sys, types, json, threading, urllib.request, urllib.parse, urllib.error, importlib.util
fehler = 0
def ok(b, m):
    global fehler
    print('ok' if b else 'FEHLER', m); fehler += 0 if b else 1
QR = json.load(open('daten/qr-muster.json'))
# --- Attrappen ---
qrcode = types.ModuleType('qrcode'); qrcode.constants = types.SimpleNamespace(ERROR_CORRECT_M=0)
class _QR:
    def __init__(self, **k): self.d = ''
    def add_data(self, d): self.d = d
    def make(self, fit=True): pass
    def get_matrix(self): return [[c == '1' for c in z] for z in QR[self.d]]
qrcode.QRCode = _QR; sys.modules['qrcode'] = qrcode
AUFRUFE = []
bq = types.ModuleType('brother_ql'); br = types.ModuleType('brother_ql.raster'); bc = types.ModuleType('brother_ql.conversion')
class _Raster:
    def __init__(self, modell): self.modell = modell; self.data = b''
br.BrotherQLRaster = _Raster
def convert(qlr, images, label, rotate='auto', threshold=70.0, dither=False, compress=False, red=False, dpi_600=False, hq=True, cut=True):
    AUFRUFE.append({'modell': qlr.modell, 'label': label, 'groesse': images[0].size, 'rotate': rotate, 'compress': compress})
    qlr.data = b'\x00' * 200 + b'\x1b@' + bytes(2000)
    return qlr.data
bc.convert = convert
sys.modules.update({'brother_ql': bq, 'brother_ql.raster': br, 'brother_ql.conversion': bc})
GESENDET = []; DRUCKER = {'da': True, 'belegt': False}
usb = types.ModuleType('usb'); core = types.ModuleType('usb.core'); util = types.ModuleType('usb.util')
class USBError(Exception): pass
core.USBError = USBError
class _Ep:
    bEndpointAddress = 0x02
    def write(self, daten, timeout=0): GESENDET.append(len(daten))
class _If:
    bInterfaceClass = 7; bInterfaceNumber = 0
    def __iter__(self): return iter([_Ep()])
class _Cfg:
    def __iter__(self): return iter([_If()])
class _Dev:
    idVendor = 0x04f9; idProduct = 0x2015; product = 'QL-500'
    def __iter__(self): return iter([_Cfg()])
    def is_kernel_driver_active(self, n): raise NotImplementedError
    def set_configuration(self): pass
    def get_active_configuration(self): return _Cfg()
core.find = lambda find_all=False, idVendor=None, backend=None: ([_Dev()] if DRUCKER['da'] else [])
util.ENDPOINT_OUT = 0
util.endpoint_direction = lambda a: a & 0x80
util.find_descriptor = lambda i, custom_match=None: next((e for e in i if custom_match(e)), None)
def claim(d, n):
    if DRUCKER['belegt']: raise USBError('Access denied')
util.claim_interface = claim; util.dispose_resources = lambda d: None
usb.core = core; usb.util = util
sys.modules.update({'usb': usb, 'usb.core': core, 'usb.util': util})
# --- Programm laden ---
spec = importlib.util.spec_from_file_location('pg_etikett', '../tools/etikett-druck/pg_etikett.py'); P = importlib.util.module_from_spec(spec); spec.loader.exec_module(P)
import tempfile; P.PROTOKOLL = os.path.join(tempfile.mkdtemp(), 'pg.log')
aus = sys.argv[1] if len(sys.argv) > 1 else None
# 1) Zeichnen
b90 = P.zeichne('AN-0068', 'Lampe', '90'); b62 = P.zeichne('AN-0068', 'Lampe', '62')
ok(b90.size == (991, 306) and b62.size == (696, 271), 'Etikett hat genau die bedruckbare Fläche: 991 × 306 (29 × 90 mm) und 696 × 271 (62 × 29 mm)')
lang = P.zeichne('PG-25337', 'Philips Wasserkocher HD9350/90 Edelstahl 1.7 Liter mit sehr langem Namen der gekürzt werden muss', '90')
if aus: b90.save(aus + '/dienst_90.png'); b62.save(aus + '/dienst_62.png'); lang.save(aus + '/dienst_lang.png')
try:
    import cv2, numpy
    for n, b in [('90', b90), ('62', b62), ('lang', lang)]:
        txt = cv2.QRCodeDetector().detectAndDecode(numpy.array(b))[0]
        ok(txt == ('PG-25337' if n == 'lang' else 'AN-0068'), 'QR-Code lesbar (%s): %r' % (n, txt))
    a = numpy.array(lang); ok(int((a[:, -10:] < 128).sum()) == 0 and int((a[:8, :] < 128).sum()) == 0, 'langer Name bleibt innerhalb der Ränder')
except ImportError: print('Hinweis: ohne OpenCV kein Lesetest')
ohne = dict(QR); QR.clear(); nur = P.zeichne('PG-1', 'X', '90'); QR.update(ohne)
ok(nur.size == (991, 306), 'ohne QR-Bibliothek/-Muster druckt das Etikett nur mit Text')
# 2) Druckdaten und USB
n = P.drucke('PG-500', 'Testgerät', '90')
ok(AUFRUFE[-1] == {'modell': 'QL-500', 'label': '29x90', 'groesse': (306, 991), 'rotate': '0', 'compress': False}, '29 × 90: Bild der Länge nach (306 × 991), Modell QL-500, ohne Kompression')
P.drucke('PG-500', 'Testgerät', '62')
ok(AUFRUFE[-1]['label'] == '62x29' and AUFRUFE[-1]['groesse'] == (696, 271), '62 × 29: Bild 696 × 271, nicht gedreht')
ok(GESENDET == [2202, 2202] and 'QL-500' in n, 'Druckdaten gehen an den USB-Ausgang des Druckers')
DRUCKER['da'] = False
try: P.drucke('PG-1', '', '90'); ok(False, 'ohne Drucker muss es scheitern')
except RuntimeError as e: ok('Kein Brother-Drucker' in str(e), 'ohne Drucker: klare Meldung')
DRUCKER['da'] = True; DRUCKER['belegt'] = True
try: P.drucke('PG-1', '', '90'); ok(False, 'belegter Drucker muss scheitern')
except RuntimeError as e: ok('P-touch Editor schliessen' in str(e), 'Drucker belegt: Hinweis auf P-touch Editor')
DRUCKER['belegt'] = False
# 3) Webseite
P.PORT = 9177; d = P.ThreadingHTTPServer(('127.0.0.1', P.PORT), P.Anfrage); threading.Thread(target=d.serve_forever, daemon=True).start()
def hol(pfad):
    try:
        r = urllib.request.urlopen('http://127.0.0.1:%d%s' % (P.PORT, pfad), timeout=10); return r.status, r.read().decode('utf8')
    except urllib.error.HTTPError as e: return e.code, e.read().decode('utf8')
c, t = hol('/status.json'); s = json.loads(t)
ok(c == 200 and s['modell'] == 'QL-500' and len(s['drucker']) == 1, 'Status meldet Modell und gefundenen Drucker')
c, t = hol('/'); ok(c == 200 and 'PG Etikett läuft' in t and 'Testetikett' in t, 'Startseite mit Knopf für das Testetikett')
vor = len(GESENDET); q = urllib.parse.urlencode({'id': 'PG-25337', 't': 'Wasserkocher <b>&', 'f': '90', 'n': '111'})
c, t = hol('/druck?' + q); ok(c == 200 and 'Etikett PG-25337 gedruckt' in t and 'window.close' in t and len(GESENDET) == vor + 1, 'Druckauftrag druckt und das Fenster schliesst sich')
c, t = hol('/druck?' + q); ok(c == 200 and 'schon gedruckt' in t and len(GESENDET) == vor + 1, 'derselbe Auftrag (Fenster neu geladen) druckt nicht zweimal')
c, t = hol('/druck?' + urllib.parse.urlencode({'id': 'PG-25337', 't': 'x', 'f': 'quatsch', 'n': '112'})); ok(c == 200 and AUFRUFE[-1]['label'] == '29x90' and len(GESENDET) == vor + 2, 'neuer Auftrag druckt wieder; unbekanntes Format zählt als 90 mm')
c, t = hol('/druck?id='); ok(c == 400, 'ohne ID kein Druck')
DRUCKER['da'] = False; c, t = hol('/druck?id=%3Cscript%3E&n=113'); DRUCKER['da'] = True
ok(c == 500 and 'liess sich nicht drucken' in t and '<script>&' not in t.replace('<script>setTimeout', '') and '&lt;script&gt;' in t, 'Fehler: Meldung im Fenster, Eingaben werden entschärft')
c, t = hol('/druck?id=PG-9&n=113'); ok(c == 200 and 'gedruckt' in t, 'nach einem Fehler lässt sich derselbe Auftrag wiederholen')
c, t = hol('/geheim'); ok(c == 404, 'unbekannte Adresse: 404')
ok(d.server_address[0] == '127.0.0.1', 'der Dienst hört nur auf dem eigenen Rechner')
d.shutdown()
print('FEHLER:', fehler); sys.exit(1 if fehler else 0)
