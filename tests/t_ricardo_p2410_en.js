/* Ricardo Tool, Prüfung 24.10.2026, Befund 20: jede Meldung hat eine englische Fassung (EN_REGELN), auch die neuen. Rückfragen mit Kürzel.
   Lauf: node tests/t_ricardo_p2410_en.js */
const h = require('./t_ricardo_p2410_hilfe.js');
const { sandbox, ok } = h;
const S = sandbox();
const en = m => S.c('en_(' + JSON.stringify(m) + ')');
/* Meldungen so, wie der Code sie baut (Werte erfunden) */
const MELDUNGEN = [
  'Diese Funktion läuft nur im Apps-Script-Editor oder als Auslöser.',
  'Tab «Listings»: Spalte 3 heisst «X», erwartet wird «EAN». Die Kopfzeile wurde von Hand geändert, bitte zurückstellen.',
  'Im ANALYSE TOOL hat der Tab «Ricardo» nicht die erwarteten Spalten (PG-ID, Titel, Artikelbeschrieb).',
  'Tab «Matchmaker» fehlt', 'Spalten «PG-ID» und «Status» fehlen', 'PG-400 steht nicht mehr im Tab «Matchmaker»',
  'Status im Matchmaker ist jetzt «Geholt», das Stück wurde geholt', 'Status im Matchmaker ist jetzt «Nicht geklappt»',
  'PG-401 wurde im Matchmaker geholt (Auftrag «Mixer gesucht»). Das Stück ist vergeben und kommt nicht auf Ricardo.',
  'PG-100 ist «Unverkauft» und noch keinen Entscheid hat. Zuerst entscheiden: «Neu listen», «Anderer Kanal» oder «Entsorgung» (Ablauf «Listing», Liste «nicht verkauft»).',
  'PG-101 gehört zum Bündel PG-500, das «Unverkauft» ist und noch keinen Entscheid hat. Zuerst entscheiden: «Neu listen», «Anderer Kanal» oder «Entsorgung» (Ablauf «Listing», Liste «nicht verkauft»).',
  'PG-100 ist bereits «Gelistet». Ein neues Listing geht erst, wenn das Stück wieder frei ist.',
  'PG-400 ist bereits in einem Listing (Bündel PG-100).', 'PG-400 ist bereits in einem Listing.',
  'Bündel nicht ergänzt: Der Status im Matchmaker (ANALYSE TOOL) liess sich nicht auf «Ricardo» setzen. Bitte nochmals versuchen. (Sheet kaputt)',
  'Laufzeit: bitte eine ganze Zahl von 1 bis 30 Tagen eintragen.',
  'Listing PG-100 ist «Verkauft» und kann nicht als gelistet gespeichert werden.',
  'Listing PG-100 ist «Gelistet» und kann nicht als gelistet gespeichert werden. Es ist schon mit einem anderen Ricardo-Link gelistet.',
  'Das ist kein gültiger Ricardo-Angebotslink. Bitte die Adresse des veröffentlichten Angebots einfügen (ricardo.ch/…/a/…).',
  'Bitte bestätigen: 2 Verkäufe sind keinem Listing zugeordnet. «Unverkauft» nur, wenn keiner davon zu PG-100 gehört.',
  '«Unverkauft» ist gesperrt: Verkauf 7001 ist keinem Listing zugeordnet und könnte zu PG-100 gehören. Zuerst klären (Verkaufsbericht einlesen, im Admin-Teil zuordnen oder stornieren).',
  'Das Tool ist gerade beschäftigt (eine andere Speicherung läuft noch). Bitte gleich nochmals versuchen.',
  'Zahlung ist schon erfasst (24.10.2026).', 'Versenden geht erst, wenn der Verkauf gepackt und bezahlt ist (Status: «Zu packen»).', 'Die Zahlung ist noch nicht erfasst.',
  'Die Datei konnte nicht erzeugt werden (Fehler 403). Die Daten stehen im Tab «Post-Adressen».',
  'Schlüssel fehlt (Script-Eigenschaft ANTHROPIC_API_KEY)', 'Bitte zuerst etwas hineinschreiben.', 'Die Zeile wurde im Sheet verschoben. Bitte die Seite neu laden.',
  'Listing PG-100 ist «Gelistet» und lässt sich nicht löschen. Löschen geht nur bei «In Arbeit», «Bereit» und freien Status (Abgebrochen, Unverkauft, Storniert, Retour abgeschlossen).',
  'Verkauf 9007 ist schon storniert.', 'Dieser Verkauf ist bezahlt. Storno nur über eine Retoure.', 'Verkauf ist «Bezahlt und versendet» und kann hier nicht storniert werden.',
  'Bitte die PG-ID des Stücks eingeben.', 'Verkauf 9013 ist schon PG-100 zugeordnet.', 'Verkauf 9013 ist «Storniert» und lässt sich nicht mehr zuordnen.',
  'Zuordnung nicht möglich: Das Stück ist vergeben (Entscheid «Entsorgung»).', 'Zuordnung nicht möglich: Das Stück ist schon «Verkauft» (Verkauf 8000).',
  'Zuordnung nicht möglich: PG-101 steht in einem anderen Listing (Status «Gelistet»).', 'Zuordnung nicht möglich: PG-101 ist Teil des Bündels PG-500 (Status «Gelistet»).',
  'Bitte bestätigen: Verkauf 9012 (Artikel-Nr 9999999999) passt zu keinem Ricardo-Link von PG-100. Trotzdem zuordnen?',
  'Die Einstellung «Provision %» muss eine Zahl von 0 bis 50 sein.', 'Unbekannter Entscheid.',
  'Bitte bestätigen: RT-0001 kam als «Defekt» zurück. Neu listen nur, wenn das Stück repariert und geprüft ist. «geprüft», Titel und Beschrieb werden geleert und müssen neu gemacht werden.',
  'Unbekannter Ablauf.', 'Keine Bankdaten erhalten.', 'Keine Zahlung ausgewählt.', 'Das Stück ist «In Arbeit», nicht unverkauft.', 'Verkauf ist «Storniert».',
  'Bitte bestätigen: Für PG-101 gibt es schon eine Etikette (Sendung 99.00.1). Eine neue Etikette hat eine neue Sendungsnummer, die alte nicht mehr verwenden. Neue Etikette erstellen?',
  'Für Verkauf 9001 wird gerade eine Etikette erstellt. Bitte kurz warten und die Liste neu laden.', 'Verkauf 9001 nicht mehr gefunden',
  'Adresse fehlt. Sie kommt mit dem Verkaufsbericht: zuerst den Bericht einlesen.', 'Post-Zugang fehlt: Script-Eigenschaften POST_CLIENT_ID und POST_CLIENT_SECRET eintragen.',
  'Post-Anmeldung abgelehnt (401): unauthorized', 'Post hat keine Etikette geliefert (400): [{"code":"x"}]',
  'Produkt PG-50 steht im Return Tool im Tab «Archiv Entsorgt» (nicht mehr an Lager). Nicht listen.',
  'Produkt PG-101 steht im Return Tool aktiv und zugleich im Tab «Archiv Entsorgt». Bitte zuerst im Return Tool klären.',
  'Listing nicht gestartet: Der Status im Matchmaker (ANALYSE TOOL) liess sich nicht auf «Ricardo» setzen. Bitte nochmals versuchen. (Sheet kaputt)',
  'Stück PG-200 wurde weder in der Analyse noch in den Such-Tabs des Return Tools gefunden.', 'Nur für Admins. Deine Adresse (a@b.ch) steht nicht in der Einstellung «Admins».'
];
const RUECKFRAGEN = [
  'Bitte bestätigen: Das Archiv des Return Tools konnte nicht geprüft werden (Tab «Archiv X» nicht lesbar: Sheet kaputt). Nur listen, wenn PG-101 sicher an Lager ist. [archiv]',
  'Bitte bestätigen: PG-101 steht im Return Tool aktiv im Tab «Online» und zugleich im Tab «Archiv Entsorgt». Nur listen, wenn das Stück sicher an Lager ist. [archiv]',
  'Bitte bestätigen: PG-400 liegt im Matchmaker für Auftrag «Föhn gesucht». Dort nicht verkauft und jetzt auf Ricardo? [mm]',
  'Bitte bestätigen: PG-301 ist analysiert, steht im Return Tool aber im Tab «Caritas» (Lagerort «CAR-2»). Nur listen, wenn das Stück für Ricardo bestimmt ist. Danach im Return Tool den Kanal auf «Online» umstellen. [kanal]',
  'Bitte bestätigen: PG-304 wurde im Return Tool nicht gefunden (in keinem Kanal-Tab und nicht im Archiv). Nur listen, wenn das Stück sicher an Lager ist. [rt]',
  'Bitte bestätigen: PG-120 liegt in der Analyse (Lagerort «Analyse» im Tab «Online») und ist noch nicht analysiert. Nur listen, wenn es nicht mehr analysiert wird. [analyse]'
];
const deutsch = /\b(Bitte|nicht|wurde|Stück|Verkauf |Listing ist|bestätigen|Entscheid|bereits|Zuordnung|Rückfrage|liegt|Status im)\b/;
MELDUNGEN.forEach(m => { const e = en(m); ok(e !== m && !deutsch.test(e.replace(/«[^»]*»|"[^"]*"|\([^)]*kaputt\)|unauthorized/g, '')), '20: ' + m.slice(0, 60) + ' → ' + e.slice(0, 70)); });
RUECKFRAGEN.forEach(m => {
  const e = S.c('enMitKuerzel_(' + JSON.stringify(m) + ')');
  ok(/^Please confirm: /.test(e) && /\s\[[a-z]+\]$/.test(e) && e.match(/\[[a-z]+\]$/)[0] === m.match(/\[[a-z]+\]$/)[0] && !deutsch.test(e.replace(/«[^»]*»|"[^"]*"|\([^)]*\)/g, '').replace(/\[[a-z]+\]$/, '')), '20: Rückfrage übersetzt, Kürzel bleibt: ' + e.slice(0, 70) + ' … ' + e.slice(-10));
});
/* über api(): englisch mit Kürzel, deutsch unverändert, rohe «Lock timeout» nie */
S.listing({ 'PG-ID': 'PG-100', 'Status': 'Unverkauft' });
let t = ''; try { S.c("api('en', 'starteListing', ['PG-100'])"); } catch (e) { t = e.message; }
ok(/^PG-100 is "Unsold" and has no decision yet/.test(t), '20: api() übersetzt (Status englisch)');
S.c("LockService.getScriptLock = function () { return { waitLock: function () { throw new Error('Lock timeout: another process was holding the lock for too long.'); }, releaseLock: function () {} }; }");
t = ''; try { S.c("api('de', 'aufgabeErledigt', ['x'])"); } catch (e) { t = e.message; }
ok(/^Das Tool ist gerade beschäftigt/.test(t), '20/10: «Lock timeout» kommt nie roh in der Oberfläche an');

h.ende();
