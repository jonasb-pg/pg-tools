  /* ======================================================================
     COCKPIT (Umbau 30.10.2026, Entscheid Jonas): ein Stück wandert durch die Stufen
     Bereit → Online → Verkauft → Bezahlt → Versendet; Nebenausgänge Nicht verkauft, Retouren, Storniert.
     Ein Chip = eine Stufe, eine Liste; ein Klick auf eine Zeile öffnet rechts das Panel mit den Handlungen dieser Stufe,
     die fällige zuoberst unter «Jetzt». Die Handlungen rufen dieselben Serverfunktionen wie bisher.
     Der einzige Ablauf mit Schritten bleibt das Listing (ablaufStarten('schicht1')).
     ====================================================================== */
  Object.assign(T, {
    'nav.cockpit': ['Cockpit', 'Cockpit'], 'nav.listing': ['Listing starten', 'Start listing'], 'nav.zahlen': ['Zahlen', 'Figures'], 'nav.einst': ['Einstellungen', 'Settings'],
    'c.such.platz': ['PG-ID, Titel, Käufer oder Verkaufsnummer', 'PG-ID, title, buyer or sale number'],
    'c.bericht': ['Verkaufsbericht einlesen', 'Import sales report'], 'c.bank': ['Bank-Export einlesen', 'Import bank export'], 'c.listing': ['Listing starten', 'Start listing'],
    'c.stand': ['Mails {0} · Verkaufsbericht {1} · Bank-Export {2}', 'Mails {0} · sales report {1} · bank export {2}'], 'c.nie': ['noch nie', 'never'],
    'c.s.bereit': ['Bereit', 'Ready'], 'c.s.online': ['Online', 'Online'], 'c.s.verkauft': ['Verkauft', 'Sold'], 'c.s.bezahlt': ['Bezahlt', 'Paid'], 'c.s.versendet': ['Versendet', 'Shipped'],
    'c.s.nichtverkauft': ['Nicht verkauft', 'Not sold'], 'c.s.retouren': ['Retouren', 'Returns'], 'c.s.storniert': ['Storniert', 'Cancelled'],
    'c.sub.bereit': ['Stufe 1 · Aus der Analyse (Entscheid Ricardo) oder «Neu listen». Einzige Handlung: listen. Stück liegt im Regal «Ricardo Offline».', 'Stage 1 · From the analysis (decision Ricardo) or «relist». The only action: list it. The item is on the shelf «Ricardo Offline».'],
    'c.sub.online': ['Stufe 2 · Läuft auf Ricardo. Hier passiert nur etwas bei Fragen, Preisvorschlägen und Ablauf der Laufzeit. Regal «Ricardo Online».', 'Stage 2 · Running on Ricardo. Only questions, price offers and the end of the duration need action. Shelf «Ricardo Online».'],
    'c.sub.verkauft': ['Stufe 3 · Verkauft, Zahlung offen. Zwei Dinge parallel: packen (sobald die Adresse da ist) und auf die Zahlung warten. Nach dem Packen ins Regal «Ricardo Unpaid».', 'Stage 3 · Sold, payment open. Two things in parallel: pack (once the address is there) and wait for the payment. After packing onto the shelf «Ricardo Unpaid».'],
    'c.sub.bezahlt': ['Stufe 4 · Geld ist da. Zahlung bei Ricardo melden, Paket (falls noch nicht gepackt: packen) in den Postwagen, «versendet» melden.', 'Stage 4 · Money received. Report the payment on Ricardo, parcel (pack it first if needed) into the postal cart, report «shipped».'],
    'c.sub.versendet': ['Stufe 5 · Unterwegs oder angekommen (letzte 60 Tage). Nichts zu tun, ausser die Käufer*in meldet sich: dann Retoure eröffnen.', 'Stage 5 · On its way or delivered (last 60 days). Nothing to do unless the buyer gets in touch: then open a return.'],
    'c.sub.nichtverkauft': ['Laufzeit abgelaufen ohne Verkauf. Stück aus dem Regal «Ricardo Online» holen und entscheiden: neu listen, anderer Kanal oder Entsorgung.', 'Duration ended without a sale. Take the item from the shelf «Ricardo Online» and decide: relist, other channel or disposal.'],
    'c.sub.retouren': ['Rückabwicklung in Schritten: Rückzahlung, Storno bei Ricardo (Provision zurück, 60 Tage), Entscheid Stück. Retourpaket ins Regal «Retouren».', 'Return handling in steps: refund, cancellation on Ricardo (commission back, 60 days), decision on the item. Return parcel onto the shelf «Retouren».'],
    'c.sub.storniert': ['Verkauf storniert (nicht bezahlt oder zurückgetreten). Paket aus dem Regal «Ricardo Unpaid» holen, auspacken und neu entscheiden.', 'Sale cancelled (not paid or withdrawn). Take the parcel from the shelf «Ricardo Unpaid», unpack it and decide again.'],
    'c.leer': ['Nichts in dieser Stufe.', 'Nothing in this stage.'], 'c.treffer': ['Suche: {0} Treffer', 'Search: {0} results'], 'c.such.leer': ['Nichts gefunden.', 'Nothing found.'], 'c.such.zu': ['Suche schliessen', 'Close search'],
    'c.th.stueck': ['Stück', 'Item'], 'c.th.titel': ['Titel', 'Title'], 'c.th.preis': ['Preis', 'Price'], 'c.th.kaeufer': ['Käufer', 'Buyer'], 'c.th.datum': ['Datum', 'Date'], 'c.th.offen': ['Offen', 'Open'],
    'c.th.zustand': ['Zustand', 'Condition'], 'c.th.woher': ['Woher', 'Source'], 'c.th.gebot': ['Gebot', 'Bid'], 'c.th.seit': ['Seit', 'Since'], 'c.th.ort': ['Regal', 'Shelf'], 'c.th.ende': ['Ende', 'End'], 'c.th.retoure': ['Retoure', 'Return'], 'c.th.schritt': ['Schritt', 'Step'], 'c.th.status': ['Status', 'Status'],
    'c.jetzt': ['Jetzt', 'Now'], 'c.tage': ['{0} Tage', '{0} days'], 'c.tag': ['1 Tag', '1 day'], 'c.heute': ['heute', 'today'],
    'c.o.adresse': ['Adresse fehlt', 'address missing'], 'c.o.packen': ['packen', 'pack'], 'c.o.gepackt': ['gepackt', 'packed'], 'c.o.zahlung': ['Zahlung offen', 'payment open'], 'c.o.erinnern': ['erinnern', 'remind'], 'c.o.storno': ['Storno prüfen', 'check cancellation'],
    'c.o.meldet': ['Käufer meldet bezahlt', 'buyer says paid'], 'c.o.melden': ['bei Ricardo melden', 'report on Ricardo'], 'c.o.versenden': ['versenden', 'ship'], 'c.o.frage': ['Frage', 'question'], 'c.o.nachricht': ['Nachricht', 'message'], 'c.o.vorschlag': ['Preisvorschlag', 'price offer'],
    'c.o.abgelaufen': ['abgelaufen', 'expired'], 'c.o.entscheid': ['Entscheid', 'decision'], 'c.o.bestaetigen': ['auf Ricardo prüfen', 'check on Ricardo'], 'c.o.bewertung': ['Bewertung', 'rating'], 'c.o.angefangen': ['angefangen', 'started'], 'c.o.neulisten': ['neu listen', 'relist'], 'c.o.analyse': ['aus der Analyse', 'from the analysis'],
    'c.o.rueckzahlung': ['Rückzahlung', 'refund'], 'c.o.ricardo': ['bei Ricardo stornieren', 'cancel on Ricardo'], 'c.o.stueck': ['Entscheid Stück', 'decide on item'], 'c.o.holen': ['Paket holen, Entscheid', 'fetch parcel, decide'],
    /* Panel */
    'c.p.listen': ['Listing mit diesem Stück starten', 'Start listing with this item'], 'c.p.weiter': ['Listing weiter bearbeiten', 'Continue the listing'], 'c.p.abbrechen': ['Listing abbrechen (Stück wird frei)', 'Discard listing (item becomes available)'],
    'c.p.analyse': ['Analyse {0} · {1} · Fotos {2}', 'Analysis {0} · {1} · photos {2}'], 'c.p.neupreis': ['Neupreis CHF {0}', 'New price CHF {0}'],
    'c.p.angebot': ['Angebot', 'Listing'], 'c.p.verkauf': ['Verkauf', 'Sale'], 'c.p.fotos': ['Foto-Ordner', 'Photo folder'], 'c.p.links': ['Links', 'Links'],
    'c.p.laeuft': ['Läuft seit {0} · Laufzeit {1} Tage', 'Running since {0} · duration {1} days'], 'c.p.abgelaufen': ['Laufzeit vorbei. Kommt die Ricardo-Mail «nicht verkauft», wechselt das Stück von selbst. Sonst auf Ricardo prüfen und von Hand setzen.', 'Duration over. With the Ricardo mail «not sold» the item moves by itself. Otherwise check on Ricardo and set it by hand.'],
    'c.p.unverkauft': ['Als nicht verkauft setzen', 'Set as not sold'], 'c.p.bearbeiten': ['Angebot im Listing bearbeiten', 'Edit the listing'],
    'c.p.adresse': ['Lieferadresse', 'Delivery address'], 'c.p.adresse.da': ['Aus dem Verkaufsbericht. Überschreiben, wenn die Käufer*in etwas anderes will.', 'From the sales report. Overwrite it if the buyer wants something else.'],
    'c.p.adresse.hand': ['Adresse einfügen oder ändern', 'Paste or change the address'], 'c.p.adresse.k': ['Adresse speichern', 'Save address'],
    'c.p.packen': ['Packen', 'Pack'], 'c.p.packen.p': ['Stück holen: {0}. Karton, Pretty-Good-Klebeband, Matchmaker-Karte und Care-Flyer. Paket ins Regal «{1}».', 'Take the item: {0}. Box, Pretty Good tape, matchmaker card and care flyer. Parcel onto the shelf «{1}».'],
    'c.p.gepackt': ['Gepackt → Regal «{0}»', 'Packed → shelf «{0}»'], 'c.p.gepackt.am': ['Gepackt', 'Packed'],
    'c.p.zahlung': ['Zahlung', 'Payment'], 'c.p.zahlung.offen': ['Offen seit {0} · kommt normal über den Bank-Export', 'Open for {0} · normally comes via the bank export'], 'c.p.zahlung.da': ['Bezahlt {0}', 'Paid {0}'],
    'c.p.bezahlt.hand': ['Als bezahlt markieren (Beleg vorhanden)', 'Mark as paid (proof at hand)'], 'c.p.erinnern': ['Zahlungserinnerung', 'Payment reminder'], 'c.p.erinnert': ['Erinnerung gesendet', 'Reminder sent'],
    'c.p.storno': ['Verkauf stornieren', 'Cancel the sale'], 'c.p.storno.ab': ['ab {0} Tagen ohne Zahlung', 'from {0} days without payment'], 'c.p.storno.r': ['Zuerst auf Ricardo stornieren (Grund «nicht bezahlt»), dann hier.', 'First cancel on Ricardo (reason «not paid»), then here.'],
    'c.p.melden': ['Zahlung bei Ricardo melden', 'Report payment on Ricardo'], 'c.p.melden.r': ['Beim Verkauf auf «Zahlung erhalten» klicken, dann hier «Gemeldet».', 'Click «Zahlung erhalten» on the sale, then «Reported» here.'], 'c.p.gemeldet': ['Gemeldet', 'Reported'], 'c.p.gemeldet.am': ['Bei Ricardo gemeldet {0}', 'Reported on Ricardo {0}'],
    'c.p.versenden': ['Versenden', 'Ship'], 'c.p.versenden.r': ['Paket aus «{0}» in den Postwagen. Beim Verkauf «Versand bestätigen», Sendungsnummer einfügen.', 'Parcel from «{0}» into the postal cart. «Versand bestätigen» on the sale, paste the tracking number.'],
    'c.p.versendet': ['Versendet', 'Shipped'], 'c.p.sendung': ['Sendungsnummer', 'Tracking number'], 'c.p.sendung.keine': ['keine aus dem Tool', 'none from the tool'],
    'c.p.retoure': ['Retoure eröffnen', 'Open a return'], 'c.p.retoure.text': ['Grund, IBAN und Strasse der Käufer*in. Die Rückzahlung geht per Mail an die Buchhaltung.', 'Reason, IBAN and street of the buyer. The refund is mailed to accounting.'],
    'c.p.rt.schritte': ['Schritte', 'Steps'], 'c.p.rt.s1': ['Eröffnet {0}', 'Opened {0}'], 'c.p.rt.s2': ['Rückzahlung', 'Refund'], 'c.p.rt.s3': ['Bei Ricardo storniert', 'Cancelled on Ricardo'], 'c.p.rt.s4': ['Entscheid Stück', 'Decision on item'],
    'c.p.entscheid': ['Entscheid', 'Decision'], 'c.p.entscheid.p': ['Stück holen: {0}', 'Take the item: {0}'], 'c.p.entscheid.ok': ['Entscheid: {0}', 'Decision: {0}'],
    'c.p.kopieren': ['Altes Angebot auf Ricardo kopieren', 'Copy the old listing on Ricardo'], 'c.p.bestaetigen': ['Auf Ricardo prüfen: ohne Verkauf beendet (Ende {0})? Dann hier bestätigen.', 'Check on Ricardo: ended without a sale (end {0})? Then confirm here.'],
    'c.p.bestaetigt': ['Nicht verkauft', 'Not sold'], 'c.p.storniert': ['Storniert {0} · Paket aus «{1}» holen und auspacken.', 'Cancelled {0} · take the parcel from «{1}» and unpack it.'],
    'c.p.doppelt': ['Zweiter Verkauf auf dieses Stück: {0}. Einen davon stornieren.', 'Second sale of this item: {0}. Cancel one of them.'],
    'c.p.admin': ['Admin', 'Admin'], 'c.p.admin.such': ['Alle Einträge zu diesem Stück (löschen, zuordnen)', 'All entries for this item (delete, assign)'],
    'c.p.aufgabe.erledigt': ['Erledigt', 'Done'], 'c.p.kopieren.oeffnen': ['Text kopieren, Ricardo öffnen', 'Copy text, open Ricardo'],
    'c.p.bank.titel': ['Bank-Export einlesen', 'Import bank export'], 'c.p.bank.text': ['Kontobewegungen als Excel (xlsx) oder CSV aus dem E-Banking exportieren. Zuordnung: zuerst Artikel- oder Verkaufsnummer im Buchungstext, sonst Name und Betrag. Unsichere Fälle prüfen und anhaken.', 'Export account movements as Excel (xlsx) or CSV from e-banking. Matching: first item or sale number in the text, otherwise name and amount. Check uncertain cases and tick them.'],
    'c.p.bank.letzte': ['Letzter Abgleich: {0} · {1} Verkäufe ohne Zahlung', 'Last match: {0} · {1} sales without payment'],
    'c.p.bericht.titel': ['Verkaufsbericht einlesen', 'Import sales report'], 'c.p.bericht.text': ['Auf Ricardo unter «Verkauft» auf «Verkaufsbericht erhalten» klicken (letzte 7 Tage), die Datei hier einlesen. Bringt Adressen und neue Verkäufe. Bekannte werden übersprungen.', 'On Ricardo under «Verkauft» click «Verkaufsbericht erhalten» (last 7 days) and import the file here. Brings addresses and new sales. Known ones are skipped.'],
    'c.p.bericht.letzter': ['Letzter Bericht: {0}', 'Last report: {0}'], 'c.p.post': ['Adressliste für die Post (ohne Etiketten aus dem Tool)', 'Address list for Swiss Post (without labels from the tool)'],
    'c.mail.aus': ['Die Ricardo-Mails werden nicht gelesen (Einstellungen › Betrieb).', 'The Ricardo mails are not read (Settings › Operations).'],
    'c.mail.still': ['Seit {0} keine Ricardo-Mail mehr: Benachrichtigungen, care@ und Gmail-Filter prüfen.', 'No Ricardo mail since {0}: check notifications, care@ and the Gmail filter.'],
    'c.hilfe': ['Hinweise', 'Notes'], 'c.zu': ['Schliessen', 'Close'], 'c.gespeichert': ['Gespeichert.', 'Saved.'], 'c.voll': ['{0} Angebote aktiv, Limite fast erreicht', '{0} listings active, limit almost reached'],
    'c.o.angebote': ['{0} Angebote', '{0} listings'], 'c.neu': ['+ Stück ohne Analyse', '+ Item without analysis'], 'c.test': ['TESTUMGEBUNG – Kopie des Live-Sheets, nichts geht nach aussen', 'TEST ENVIRONMENT – copy of the live sheet, nothing goes outside']
  });

  var CP = null, CPS = 'verkauft', CPP = null, CPQ = null, CPLADEN = false;
  var CP_STUFEN = ['bereit', 'online', 'verkauft', 'bezahlt', 'versendet', 'nichtverkauft', 'retouren', 'storniert'];
  function cpNach() { if (CP) ladeCockpit(true); }
  function ladeCockpit(stillLaden) {
    var da = function (c) { CP = c; CPLADEN = false; if (c.aufgaben) { AU = c.aufgaben; marke($('z-aufgaben'), c.aufgaben.anzahl); } zaehler(c.aktiv, c.schwelle); if (ANSICHT === 'cockpit') zeichneCockpit(); };
    if (stillLaden && CP) { still('cockpit', [], function (c) { if (c && !gleich(c, CP)) da(c); }); return; }
    if (CPLADEN) return;
    CPLADEN = true;
    ruf('cockpit', [], da, function () { CPLADEN = false; return false; });
  }
  function cpRegal(k) { return (CP && CP.regale && CP.regale[k]) || ({ offline: 'Ricardo Offline', online: 'Ricardo Online', unpaid: 'Ricardo Unpaid' })[k]; }
  function tage(n) { return n === 0 ? t('c.heute') : n === 1 ? t('c.tag') : t('c.tage', n); }
  function tagKl(h) { return h >= 24 ? ' rot' : h >= 4 ? ' orange' : ''; }
  function etk(text, kl) { return text ? '<span class="etikett' + (kl ? ' ' + kl : '') + '">' + text + '</span>' : ''; }
  function artikelVon(link) { var m = /\/a\/(\d+)/.exec(String(link || '')); return m ? m[1] : ''; }
  /* Aufgaben aus den Ricardo-Mails zu einem Stück oder Verkauf */
  function cpAufgaben(pgId, artikel, nr) {
    var au = (CP && CP.aufgaben) || { fragen: [], angebote: [], zahlung: [], bewertungen: [] }, passt = function (o) { return (pgId && o.pgId === pgId) || (artikel && o.artikel === artikel) || (nr && o.nr === nr); };
    return { fragen: (au.fragen || []).filter(passt), angebote: (au.angebote || []).filter(passt), zahlung: nr ? (au.zahlung || []).filter(function (o) { return o.nr === nr; }) : [], bewertungen: (au.bewertungen || []).filter(passt) };
  }
  function cpMelden(nr) { return (CP.melden || []).filter(function (o) { return o.nr === nr; })[0]; }
  function cpOffenTage(nr) { var o = (CP.offenZahlung || []).filter(function (x) { return x.nr === nr; })[0]; return o ? o.tage : 0; }
  function cpStorno(nr) { return (CP.storno || []).filter(function (o) { return o.nr === nr; })[0]; }
  function vStufe(o) { return o.bezahlt ? 'bezahlt' : 'verkauft'; }

  /* ---------- Zeilen pro Stufe: { key, art, o, z: [6 Zellen], kl } ---------- */
  function cpZeilen(stufe) {
    var l = [];
    if (stufe === 'bereit') {
      (CP.bereit || []).forEach(function (x) { l.push({ key: 'b' + x.id, art: 'bereit', o: x, z: [x.id, x.name, '', '', x.ort || cpRegal('offline'), etk(t(x.wieder ? 'c.o.neulisten' : 'c.o.angefangen'), x.wieder ? 'hell' : '')] }); });
      var schon = {}; l.forEach(function (r) { schon[r.o.id] = 1; });
      (CP.analyse || []).forEach(function (a) { if (schon[a.id]) return; l.push({ key: 'a' + a.id, art: 'bereit', o: a, ana: true, z: [a.id, a.titel || a.name, zu(a.zustand), a.preis ? 'CHF ' + Number(a.preis).toFixed(2) : '', a.erfasst || '', etk(t(a.mm ? 'g.l.mm' : 'c.o.analyse'))] }); });
    } else if (stufe === 'online') {
      (CP.online || []).forEach(function (x) {
        var au = cpAufgaben(x.id, artikelVon(x.link), ''), off = '';
        if (x.abgelaufen) off += etk(t('c.o.abgelaufen'), 'hell');
        au.angebote.forEach(function (o) { off += etk(t('c.o.vorschlag') + ' CHF ' + esc(o.betrag), 'orange'); });
        au.fragen.forEach(function (o) { off += etk(esc(o.art), 'orange'); });
        var gb = x.gebot ? (x.gebot.keins ? t('u.keingebot') : 'CHF ' + Number(x.gebot.chf).toFixed(2) + (x.gebot.anzahl ? ' · ' + x.gebot.anzahl : '')) : '';
        l.push({ key: 'o' + x.id, art: 'online', o: x, z: [x.id, x.name, gb, x.seit, x.regal || x.ort || '', off] });
      });
    } else if (stufe === 'verkauft' || stufe === 'bezahlt') {
      (CP.verkauft || []).forEach(function (o) {
        if (vStufe(o) !== stufe) return;
        var off = '', au = cpAufgaben(o.pgId, o.artikel, o.nr), st = cpStorno(o.nr);
        if (stufe === 'verkauft') {
          if (o.ohneAdresse) off += etk(t('c.o.adresse'), 'orange');
          else if (o.status === 'Zu packen') off += etk(t('c.o.packen'), 'hell');
          if (o.meldet) off += etk(t('c.o.meldet'), 'hell');
          if (st) off += etk(t('c.o.storno') + ' · ' + tage(st.tage), 'rot'); else if (au.zahlung.length) off += etk(t('c.o.erinnern') + ' · ' + tage(au.zahlung[0].tage), 'orange');
        } else {
          if (!o.ricardoGemeldet) off += etk(t('c.o.melden'), 'orange');
          if (o.status === 'Zu packen') off += etk(t('c.o.packen'), 'hell'); else off += etk(t('c.o.versenden'), 'hell');
        }
        au.fragen.forEach(function (q) { off += etk(esc(q.art), 'orange'); });
        l.push({ key: 'v' + o.nr, art: stufe, o: o, z: [o.pgId || t('v.nichtzu'), o.titel, 'CHF ' + o.total, o.name || o.kaeufer, stufe === 'bezahlt' ? o.bezahlt : o.am, off] });
      });
    } else if (stufe === 'versendet') {
      (CP.versendet || []).forEach(function (o) {
        var au = cpAufgaben(o.pgId, o.artikel, o.nr), off = '';
        au.fragen.forEach(function (q) { off += etk(esc(q.art), 'orange'); }); au.bewertungen.forEach(function () { off += etk(t('c.o.bewertung')); });
        l.push({ key: 's' + o.nr, art: 'versendet', o: o, z: [o.pgId || t('v.nichtzu'), o.titel, 'CHF ' + o.total, o.name || o.kaeufer, o.versendetAm, off] });
      });
    } else if (stufe === 'nichtverkauft') {
      (CP.ohneMail || []).forEach(function (x) { l.push({ key: 'e' + x.id, art: 'ohnemail', o: x, z: [x.id, x.name, t('f.s2.ende', x.ende), '', x.ort || cpRegal('online'), etk(t('c.o.bestaetigen'), 'orange')] }); });
      (CP.nichtverkauft || []).forEach(function (x) { l.push({ key: 'u' + x.id, art: 'nichtverkauft', o: x, z: [x.id, x.name, '', '', x.ort || cpRegal('online'), etk(t('c.o.entscheid'), 'hell')] }); });
    } else if (stufe === 'retouren') {
      (CP.retouren || []).forEach(function (o) {
        var schritt = !o.rueckzahlungAm ? t('c.o.rueckzahlung') : !o.ricardo ? t('c.o.ricardo') : !o.entscheid ? t('c.o.stueck') : '';
        l.push({ key: 'r' + o.nr, art: 'retouren', o: o, z: [o.nr, (o.pgId ? o.pgId + ' ' : '') + o.titel, 'CHF ' + o.betrag, o.name || o.kaeufer, o.eroeffnet, etk(schritt, 'orange')] });
      });
    } else if (stufe === 'storniert') {
      (CP.storniert || []).forEach(function (x) { l.push({ key: 'u' + x.id, art: 'storniert', o: x, z: [x.id, x.name, '', '', x.ort || cpRegal('unpaid'), etk(t('c.o.holen'), 'orange')] }); });
    }
    return l;
  }
  var CP_KOPF = {
    bereit: ['c.th.stueck', 'c.th.titel', 'c.th.zustand', 'c.th.preis', 'c.th.ort', 'c.th.woher'], online: ['c.th.stueck', 'c.th.titel', 'c.th.gebot', 'c.th.seit', 'c.th.ort', 'c.th.offen'],
    verkauft: ['c.th.stueck', 'c.th.titel', 'c.th.preis', 'c.th.kaeufer', 'c.th.datum', 'c.th.offen'], bezahlt: ['c.th.stueck', 'c.th.titel', 'c.th.preis', 'c.th.kaeufer', 'c.s.bezahlt', 'c.th.offen'],
    versendet: ['c.th.stueck', 'c.th.titel', 'c.th.preis', 'c.th.kaeufer', 'c.s.versendet', 'c.th.offen'], nichtverkauft: ['c.th.stueck', 'c.th.titel', 'c.th.ende', '', 'c.th.ort', 'c.th.offen'],
    retouren: ['c.th.retoure', 'c.th.stueck', 'c.th.preis', 'c.th.kaeufer', 'c.th.datum', 'c.th.schritt'], storniert: ['c.th.stueck', 'c.th.titel', '', '', 'c.th.ort', 'c.th.offen']
  };
  function cpZahl(stufe) { return cpZeilen(stufe).length; }

  function zeichneCockpit() {
    if (!CP) return;
    var k = CP.aufgaben && CP.aufgaben.kontrolle, h = '';
    $('cp-stand').textContent = t('c.stand', k && k.letzte ? k.letzte : '–', CP.letzterImport || t('c.nie'), CP.letzteBank || t('c.nie'));
    if (k && !k.aktiv) h += '<div class="meldung warn">' + t('c.mail.aus') + '</div>';
    else if (k && k.warnung) h += '<div class="meldung warn">' + t('c.mail.still', esc(k.letzte)) + '</div>';
    if (CP.aktiv >= CP.schwelle) h += '<div class="meldung warn">' + t('c.voll', CP.aktiv) + '</div>';
    (CP.doppelt || []).forEach(function (d) { h += '<div class="meldung stop">' + t('c.p.doppelt', esc(d.pgId) + ': ' + d.verkaeufe.map(function (v) { return t('v.nr', esc(v.nr)) + ' (' + esc(v.name) + ', CHF ' + esc(v.total) + ')'; }).join(' · ')) + '</div>'; });
    if (CP.test) h = '<div class="meldung stop">' + t('c.test') + '</div>' + h;
    $('cp-warn').innerHTML = h;
    $('cp-chips').innerHTML = CP_STUFEN.map(function (s) { return '<button class="chip' + (s === CPS && !CPQ ? ' an' : '') + '" onclick="cpStufe(\'' + s + '\')">' + esc(t('c.s.' + s)) + ' <span class="zahl">' + cpZahl(s) + '</span></button>'; }).join('');
    $('cp-sub').textContent = CPQ ? '' : t('c.sub.' + CPS);
    var l = CPQ ? CPQ.zeilen : cpZeilen(CPS), kopf = CPQ ? ['c.th.stueck', 'c.th.titel', '', '', '', ''] : CP_KOPF[CPS];
    if (CPQ) $('cp-sub').innerHTML = esc(t('c.treffer', l.length)) + ' <button class="klein-knopf" onclick="cpSucheZu()">' + esc(t('c.such.zu')) + '</button>';
    $('cp-liste').innerHTML = l.length ? '<div class="tabelle"><table><tr>' + kopf.map(function (x) { return '<th>' + (x ? esc(t(x)) : '') + '</th>'; }).join('') + '<th></th></tr>'
      + l.map(function (r) { return '<tr class="cp-zeile' + (CPP && CPP.key === r.key ? ' an' : '') + '" data-key="' + esc(r.key) + '"' + akt('cpAuf', r.key) + '>' + r.z.map(function (c, i) { return '<td' + (i === 0 ? ' class="mono"' : '') + '>' + (i === 5 || (CPQ && i === 2) ? c : esc(c)) + '</td>'; }).join('') + '<td class="pfeil">→</td></tr>'; }).join('') + '</table></div>'
      : '<p class="still">' + t(CPQ ? 'c.such.leer' : 'c.leer') + '</p>';
    if (CPP) { var r = cpFinde(CPP.key); if (r) zeichnePanel(r); else if (CPP.art !== 'bank' && CPP.art !== 'bericht') cpZu(); }
  }
  function cpStufe(s) { CPS = s; CPQ = null; CPP = null; zeichneCockpit(); }
  function cpFinde(key) {
    var alle = CPQ ? CPQ.zeilen : [];
    CP_STUFEN.forEach(function (s) { alle = alle.concat(cpZeilen(s)); });
    return alle.filter(function (r) { return r.key === key; })[0];
  }
  function cpAuf(key) { var r = cpFinde(key); if (!r) return; CPP = { key: key, art: r.art }; zeichnePanel(r); Array.prototype.forEach.call(document.querySelectorAll('.cp-zeile'), function (z) { z.classList.toggle('an', z.getAttribute('data-key') === key); }); }
  function cpZu() { CPP = null; $('cp-veil').hidden = true; Array.prototype.forEach.call(document.querySelectorAll('.cp-zeile'), function (z) { z.classList.remove('an'); }); }
  Object.assign(AKTIONEN, { cpAuf: cpAuf });

  /* ---------- Suche über alles (Admin-Suche: jeder Status) ---------- */
  function cpSuchen() {
    var q = $('cp-q').value.trim();
    if (!q) { cpSucheZu(); return; }
    ruf('adminSuche', [q], function (a) {
      var z = [];
      (a.listings || []).forEach(function (x) {
        var r = cpFinde((x.status === 'Gelistet' ? 'o' : OFFEN_ST.indexOf(x.status) !== -1 ? 'b' : 'u') + x.id);
        z.push(r || { key: 'q' + x.id, art: 'fremd', o: x, z: [x.id, x.name, etk(st(x.status)), '', x.am, ''] });
      });
      (a.verkaeufe || []).forEach(function (o) {
        var r = cpFinde('v' + o.nr) || cpFinde('s' + o.nr);
        z.push(r || { key: 'qv' + o.nr, art: 'fremd', o: o, z: [o.pgId || t('v.nichtzu'), o.titel, etk(st(o.status)), o.kaeufer, o.am, 'CHF ' + o.total] });
      });
      CPQ = { q: q, zeilen: z }; CPP = null; zeichneCockpit();
    });
  }
  var OFFEN_ST = ['In Arbeit', 'Bereit'];
  function cpSucheZu() { CPQ = null; $('cp-q').value = ''; zeichneCockpit(); }

  /* ---------- Panel ---------- */
  function pOeffne(titel, sub, body) {
    $('cp-veil').hidden = false;
    $('cp-panel').innerHTML = '<div class="cp-kopf"><div><strong>' + titel + '</strong><span class="still">' + sub + '</span></div><button class="x" onclick="cpZu()" aria-label="' + esc(t('c.zu')) + '">×</button></div><div class="cp-body">' + body + '</div>';
    $('cp-panel').scrollTop = 0;
  }
  function jetzt(titel, inner) { return '<div class="cp-jetzt"><div class="f-label">' + t('c.jetzt') + ' · ' + titel + '</div>' + inner + '</div>'; }
  function block(titel, inner, zu) { return '<details class="cp-block"' + (zu ? '' : ' open') + '><summary>' + titel + '</summary><div>' + inner + '</div></details>'; }
  function hilfe(text) { return '<details class="cp-hilfe"><summary>' + t('c.hilfe') + '</summary><p class="still">' + text + '</p></details>'; }
  function lnk(url, text) { return istRicardo(url) ? '<button' + akt('link', url) + '>' + esc(text) + ' ↗</button>' : ''; }
  function kn(text, aktion, haupt, a, b) { return '<button class="' + (haupt ? 'haupt-knopf' : '') + '"' + akt(aktion, a, b) + '>' + esc(text) + '</button>'; }
  function adminBlock(id) { return block(t('c.p.admin'), '<button' + akt('cpAdmin', id) + '>' + esc(t('c.p.admin.such')) + '</button>', true); }
  function aufgabenHtml(au) {
    var h = '';
    au.angebote.forEach(function (o) {
      var annehmen = String(o.empfehlung).indexOf('Annehmen') === 0;
      h += jetzt(t('g.vorschlag'), '<p>' + t('a.vorschlag', esc(o.betrag), esc(o.preis)) + (o.frist ? ' · ' + t('a.frist', esc(o.frist), o.restStunden) : '') + '</p><p>' + etk(esc(o.empfehlung), annehmen ? 'hell' : '') + '</p>'
        + hilfe(t('f.t3.ricardo')) + '<div class="knoepfe">' + lnk(o.link, t('g.vorschlag.k')) + kn(t('c.p.aufgabe.erledigt'), 'cpErledigt', true, o.id) + '</div>');
    });
    au.fragen.forEach(function (o, i) {
      var frage = o.art === 'Frage' && o.entwurf, id = 'cpf-' + i;
      h += jetzt(esc(o.art) + (o.von ? ' · ' + t('a.von', esc(o.von)) : ''), (o.text ? '<div class="frage">' + esc(o.text) + '</div>' : (o.art === 'Nachricht' ? '<p class="still">' + t('a.nachricht') + '</p>' : ''))
        + (frage ? '<label for="' + id + '">' + t('a.entwurf') + '</label>' + textfeld(id, o.entwurf, 5) : (o.art === 'Frage' ? '<p class="still">' + t('a.keinentwurf') + '</p>' : ''))
        + '<div class="knoepfe">' + (frage ? '<button class="haupt-knopf"' + akt('kopierOeffne', id, o.link) + '>' + t('c.p.kopieren.oeffnen') + '</button>' : lnk(o.link, t('a.oeffnen'))) + kn(t('c.p.aufgabe.erledigt'), 'cpErledigt', !frage, o.id) + '</div>');
    });
    au.bewertungen.forEach(function (o, i) {
      var id = 'cpb-' + i;
      h += block(t('g.bewertung') + (o.von ? ' · ' + esc(o.von) : ''), textfeld(id, o.entwurf, 3) + hilfe(t('g.bewertung.r')) + '<div class="knoepfe"><button class="haupt-knopf"' + akt('kopierOeffne', id, o.link) + '>' + t('c.p.kopieren.oeffnen') + '</button>' + kn(t('c.p.aufgabe.erledigt'), 'cpErledigt', false, o.id) + '</div>');
    });
    return h;
  }
  function zeichnePanel(r) {
    var o = r.o, art = r.art;
    if (art === 'bereit') {
      var ana = r.ana;
      pOeffne(esc(o.id), esc(ana ? (o.titel || o.name) : o.name) + ' · ' + t('c.s.bereit') + ' · ' + esc(o.ort || cpRegal('offline')),
        (ana ? '<p class="still">' + t('c.p.analyse', esc(o.erfasst || ''), esc(zu(o.zustand)), esc(o.fotos || 0)) + (o.preis ? ' · ' + t('c.p.neupreis', Number(o.preis).toFixed(2)) : '') + '</p>' : '')
        + jetzt(t('such.listen'), '<p class="still">' + t('such.hilfe') + '</p><div class="knoepfe">' + kn(t(ana ? 'c.p.listen' : 'c.p.weiter'), ana ? 'cpStart' : 'cpWeiter', true, o.id) + '</div>')
        + (ana ? '' : block(t('f.e.Anderer Kanal') + ' / ' + t('f.e.Entsorgung'), '<p class="still">' + t('f.s2.nicht.physisch') + '</p><div class="knoepfe">' + kn(t('c.p.abbrechen'), 'cpAbbrechen', false, o.id) + '</div>', true))
        + block(t('c.p.links'), '<div class="knoepfe">' + (/^https:\/\//.test(o.ordner || '') ? '<a href="' + esc(o.ordner) + '">' + t('c.p.fotos') + '</a>' : '') + '</div>', true) + adminBlock(o.id));
      return;
    }
    if (art === 'online') {
      var au = cpAufgaben(o.id, artikelVon(o.link), ''), gb = o.gebot ? (o.gebot.keins ? t('u.keingebot') : t('u.gebot', Number(o.gebot.chf).toFixed(2)) + (o.gebot.anzahl ? t('u.gebotzahl', o.gebot.anzahl) : '')) : '';
      pOeffne(esc(o.id), esc(o.name) + ' · ' + t('c.s.online') + ' · ' + esc(o.regal || o.ort || ''),
        '<p class="still">' + t('c.p.laeuft', esc(o.seit), esc(o.laufzeit)) + (gb ? ' · ' + gb : '') + (o.buendel ? ' · + ' + esc(o.buendel) : '') + '</p>'
        + aufgabenHtml(au)
        + (o.abgelaufen ? jetzt(t('c.o.abgelaufen'), '<p class="still">' + t('c.p.abgelaufen') + '</p><div class="knoepfe">' + lnk(o.link, t('g.angebot.oeffnen')) + kn(t('c.p.unverkauft'), 'cpUnverkauft', true, o.id, '1') + '</div>') : '')
        + block(t('c.p.angebot'), '<div class="knoepfe">' + lnk(o.link, t('g.angebot.oeffnen')) + kn(t('c.p.bearbeiten'), 'cpWeiter', false, o.id) + (o.abgelaufen ? '' : kn(t('c.p.unverkauft'), 'cpUnverkauft', false, o.id, '0')) + '</div>' + hilfe(t('u.hinweis', CP.laufzeit, CP.letzterImport || t('u.keiner'))), !!au.fragen.length || !!au.angebote.length)
        + adminBlock(o.id));
      return;
    }
    if (art === 'verkauft' || art === 'bezahlt') { zeichneVerkaufPanel(o, art); return; }
    if (art === 'versendet') {
      var au2 = cpAufgaben(o.pgId, o.artikel, o.nr);
      pOeffne(esc(o.pgId || o.nr), esc(o.titel) + ' · ' + t('c.s.versendet') + ' ' + esc(o.versendetAm) + ' · ' + t('v.nr', esc(o.nr)),
        '<p class="still">' + esc(o.name || o.kaeufer) + (o.ort ? ', ' + esc(o.ort) : '') + ' · CHF ' + esc(o.total) + ' · ' + t('c.p.sendung') + ' ' + (o.sendung ? '<span class="mono">' + esc(o.sendung) + '</span>' : t('c.p.sendung.keine')) + '</p>'
        + aufgabenHtml(au2)
        + block(t('c.p.retoure'), '<p class="still">' + t('c.p.retoure.text') + '</p>' + retoureFormular(o), au2.fragen.length > 0)
        + block(t('c.p.links'), '<div class="knoepfe">' + lnk(o.link, t('c.p.verkauf')) + '</div>', true) + adminBlock(o.pgId || o.nr));
      return;
    }
    if (art === 'ohnemail') {
      pOeffne(esc(o.id), esc(o.name) + ' · ' + t('c.s.nichtverkauft') + ' · ' + esc(o.ort || cpRegal('online')),
        jetzt(t('c.o.bestaetigen'), '<p>' + t('c.p.bestaetigen', esc(o.ende)) + '</p><div class="knoepfe">' + lnk(o.link, t('g.angebot.oeffnen')) + kn(t('c.p.bestaetigt'), 'cpUnverkauft', true, o.id, '1') + '</div>') + adminBlock(o.id));
      return;
    }
    if (art === 'nichtverkauft' || art === 'storniert') {
      pOeffne(esc(o.id), esc(o.name) + ' · ' + t(art === 'storniert' ? 'c.s.storniert' : 'c.s.nichtverkauft') + ' · ' + esc(o.ort || ''),
        (art === 'storniert' ? '<p class="still">' + t('c.p.storniert', '', esc(cpRegal('unpaid'))) + '</p>' : '')
        + jetzt(t('c.p.entscheid'), '<p class="still">' + t('c.p.entscheid.p', esc(o.ort || cpRegal(art === 'storniert' ? 'unpaid' : 'online'))) + '</p>'
          + (o.link && art !== 'storniert' ? hilfe(t('g.l.reakt.r')) : '')
          + '<div class="f-wahl">' + (CP.entscheide || []).map(function (e) { return '<button' + akt('cpEntscheid', o.id, e) + '>' + esc(t('f.e.' + e)) + '</button>'; }).join('') + '</div>'
          + '<p class="still">' + t('f.s2.nicht.physisch') + '</p>')
        + block(t('c.p.links'), '<div class="knoepfe">' + lnk(o.link, t('g.angebot.oeffnen')) + (o.kopieren ? lnk(o.kopieren, t('c.p.kopieren')) : '') + '</div>', true) + adminBlock(o.id));
      return;
    }
    if (art === 'retouren') { zeichneRetourePanel(o); return; }
    if (art === 'fremd') {
      var v = o.nr !== undefined;
      pOeffne(esc(v ? (o.pgId || o.nr) : o.id), esc(v ? o.titel : o.name) + ' · ' + esc(st(o.status)) + (v ? ' · ' + t('v.nr', esc(o.nr)) : ''),
        (v ? '<p class="still">' + esc(o.kaeufer) + ' · CHF ' + esc(o.total) + ' · ' + esc(o.am) + '</p>' : '<p class="still">' + esc(o.am) + '</p>') + block(t('c.p.admin'), '<button' + akt('cpAdmin', v ? (o.pgId || o.nr) : o.id) + '>' + esc(t('c.p.admin.such')) + '</button>'));
    }
  }
  function zeichneVerkaufPanel(o, art) {
    var au = cpAufgaben(o.pgId, o.artikel, o.nr), st = cpStorno(o.nr), gepackt = o.status !== 'Zu packen', h = '';
    var kopf = '<p class="still">' + esc(o.name || o.kaeufer) + (o.ort ? ', ' + esc(o.ort) : '') + (o.kaeufer && o.kaeufer !== o.name ? ' · ' + esc(o.kaeufer) : '') + ' · CHF ' + esc(o.total) + ' · ' + esc(o.klasse || '') + ' · ' + esc(o.am) + '</p>';
    /* Adresse: aus dem Bericht oder von Hand, immer überschreibbar (Jonas 30.10.2026) */
    var adresse = (o.ohneAdresse ? '<div class="meldung warn">' + t('g.p.adr.fehlt') + '</div>' : '<p><strong>' + esc(o.name) + '</strong><br>' + esc(o.ort || '') + '</p><p class="still">' + t('c.p.adresse.da') + '</p>')
      + hilfe(t('g.p.adr.hand.r')) + '<div class="knoepfe">' + lnk(o.link, t('g.verkauf.oeffnen')) + '</div>'
      + '<label class="klein" for="adr-' + esc(o.nr) + '">' + t('c.p.adresse.hand') + '</label><textarea id="adr-' + esc(o.nr) + '" rows="4" autocomplete="off" placeholder="Vorname Nachname&#10;Strasse 1&#10;3000 Bern"></textarea>'
      + '<div class="knoepfe"><button class="haupt-knopf"' + akt('adresseHand', o.nr) + '>' + t('c.p.adresse.k') + '</button></div>';
    var packen = '<p class="still">' + t('c.p.packen.p', '<strong>' + esc(o.lagerort || '') + '</strong>', esc(cpRegal('unpaid'))) + rtOrtHtml(o) + '</p>'
      + (o.bild ? '<img class="f-bild" src="' + esc(o.bild) + '" alt="">' : '')
      + (o.sendung ? '<p>✓ ' + t(ETIKETTEN[o.nr] ? 'g.p.etikette.da' : 'g.p.sendung.da', '<span class="mono">' + esc(o.sendung) + '</span>') + '</p>' : '')
      + '<div class="knoepfe">' + (CP.postBereit && !o.ohneAdresse ? etikettKnoepfe(o) : (!CP.postBereit ? '<span class="klein">' + t('g.p.post.fehlt') + '</span>' : '')) + '</div>' + sendungFeld(o)
      + '<div class="knoepfe" style="margin-top:10px">' + kn(t('c.p.gepackt', cpRegal('unpaid')), 'cpVerkauf', true, o.nr, 'gepackt') + '</div>';
    var zahlung = (o.bezahlt ? '<p>✓ ' + t('c.p.zahlung.da', esc(o.bezahlt)) + '</p>' : '<p class="still">' + t('c.p.zahlung.offen', tage(cpOffenTage(o.nr))) + '</p>' + (o.meldet ? '<p>' + etk(t('a.meldet', esc(o.meldet)), 'hell') + '</p>' : ''))
      + (au.zahlung.length ? '<label for="cpz">' + t('c.p.erinnern') + ' · ' + t('a.tage', au.zahlung[0].tage) + '</label>' + textfeld('cpz', au.zahlung[0].entwurf, 6) + '<div class="knoepfe"><button class="haupt-knopf"' + akt('kopierOeffne', 'cpz', au.zahlung[0].link) + '>' + t('c.p.kopieren.oeffnen') + '</button>' + kn(t('c.p.erinnert'), 'cpErinnert', false, o.nr) + '</div>' : '')
      + (o.bezahlt ? '' : '<div class="knoepfe" style="margin-top:10px">' + kn(t('c.p.bezahlt.hand'), 'cpVerkauf', false, o.nr, 'bezahlt') + '</div>')
      + (o.bezahlt ? '' : st ? '<p style="margin-top:12px"><strong>' + t('c.p.storno') + '</strong> ' + etk(t('a.tage', st.tage), 'rot') + '</p><p class="still">' + t('c.p.storno.r') + '</p><div class="knoepfe">' + lnk(st.storno, t('g.storno.k')) + kn(t('g.storno.ok'), 'cpStorno', true, o.nr) + '</div>'
        : '<details class="cp-hilfe"><summary>' + t('c.p.storno') + ' <span class="klein">' + t('c.p.storno.ab', CP.stornoTage) + '</span></summary><p class="still">' + t('c.p.storno.r') + '</p><div class="knoepfe">' + lnk(o.link, t('g.verkauf.oeffnen')) + kn(t('g.storno.ok'), 'cpStorno', false, o.nr) + '</div></details>');
    var melden = o.ricardoGemeldet ? '<p>✓ ' + t('c.p.gemeldet.am', esc(o.ricardoGemeldet)) + '</p>' : '<p class="still">' + t('c.p.melden.r') + '</p><div class="knoepfe">' + lnk(o.link, t('g.verkauf.oeffnen')) + kn(t('c.p.gemeldet'), 'cpVerkauf', true, o.nr, 'ricardoBezahlt') + '</div>';
    var versenden = '<p class="still">' + t('c.p.versenden.r', esc(cpRegal('unpaid'))) + '</p><p>' + t('c.p.sendung') + ': ' + (o.sendung ? '<strong class="mono">' + esc(o.sendung) + '</strong>' : t('c.p.sendung.keine')) + '</p>'
      + '<div class="knoepfe"><button class="haupt-knopf"' + akt('sendung', o.sendung || '', o.link) + '>' + t(o.sendung ? 'g.v.bestaetigen.k' : 'g.verkauf.oeffnen') + '</button>' + kn(t('c.p.versendet'), 'cpVerkauf', false, o.nr, 'versendet') + '</div>';
    if (art === 'verkauft') {
      if (o.ohneAdresse) h += jetzt(t('c.p.adresse'), adresse); else if (!gepackt) h += jetzt(t('c.p.packen'), packen);
      else if (st) h += jetzt(t('c.p.storno'), zahlung); else if (au.zahlung.length) h += jetzt(t('c.p.erinnern'), zahlung);
      h += aufgabenHtml(au);
      if (!o.ohneAdresse) h += block(t('c.p.adresse'), adresse, true);
      if (gepackt || o.ohneAdresse) h += block(t('c.p.packen'), gepackt ? '<p>✓ ' + t('c.p.gepackt.am') + '</p>' + (o.sendung ? '<p class="mono">' + esc(o.sendung) + '</p>' : '') + sendungFeld(o) : packen, true);
      if (!(st || au.zahlung.length)) h += block(t('c.p.zahlung'), zahlung, true);
    } else {
      if (!o.ricardoGemeldet) h += jetzt(t('c.p.melden'), melden);
      else if (!gepackt) h += jetzt(t('c.p.packen'), o.ohneAdresse ? adresse : packen);
      else h += jetzt(t('c.p.versenden'), versenden);
      h += aufgabenHtml(au);
      if (o.ricardoGemeldet) h += block(t('c.p.melden'), melden, true);
      if (!gepackt && !o.ricardoGemeldet) h += block(t('c.p.packen'), o.ohneAdresse ? adresse : packen, true);
      if (gepackt && !o.ricardoGemeldet) h += block(t('c.p.versenden'), versenden, true);
      if (!o.ohneAdresse || gepackt) h += block(t('c.p.adresse'), adresse, true);
      h += block(t('c.p.zahlung'), zahlung, true);
    }
    h += block(t('c.p.links'), '<div class="knoepfe">' + lnk(o.link, t('c.p.verkauf')) + (o.artikel ? lnk(CP.links.artikel + o.artikel, t('c.p.angebot')) : '') + '</div>', true) + adminBlock(o.pgId || o.nr);
    pOeffne(esc(o.pgId || t('v.nichtzu')), esc(o.titel) + ' · ' + t('c.s.' + art) + ' · ' + t('v.nr', esc(o.nr)) + ' · ' + esc(o.lagerort || ''), kopf + h);
  }
  function retoureFormular(o) {
    return '<div class="reihe" style="margin-top:8px">' + gruende('cprg') + '<input type="text" id="cpri" placeholder="' + esc(t('rt.iban')) + '" autocomplete="off" style="flex:1;min-width:180px;height:40px;font-size:15px"></div>'
      + '<input type="text" id="cpra" value="" placeholder="' + esc(t('rt.adresse')) + '" style="height:40px;font-size:15px;margin:6px 0 0"><input type="text" id="cprn" placeholder="' + esc(t('rt.notiz')) + '" style="height:40px;font-size:15px;margin:6px 0">'
      + '<div class="knoepfe">' + kn(t('rt.eroeffnen'), 'cpRetoureNeu', true, o.nr) + '</div>';
  }
  function zeichneRetourePanel(o) {
    var s = '<div class="cp-schritte">';
    s += '<div class="ok">✓ ' + t('c.p.rt.s1', esc(o.eroeffnet)) + ' · ' + esc(gr(o.grund)) + (o.notiz ? ' · ' + esc(o.notiz) : '') + '</div>';
    s += o.rueckzahlungAm ? '<div class="ok">✓ ' + t('rt.s2.ok', esc(o.rueckzahlung), esc(o.rueckzahlungAm)) + '</div>' : '';
    s += o.ricardo ? '<div class="ok">✓ ' + t('rt.s3.ok', esc(o.ricardo)) + '</div>' : '';
    s += o.entscheid ? '<div class="ok">✓ ' + t('rt.s4.ok', esc(t('f.e.' + o.entscheid))) + '</div>' : '';
    s += '</div>';
    var j = '';
    if (!o.rueckzahlungAm) j = jetzt(t('c.p.rt.s2'), '<p class="still">' + esc(o.name || o.kaeufer) + (o.iban ? ' · <span class="mono">' + esc(o.iban) + '</span>' : '') + '</p><div class="reihe">CHF <input type="text" id="cprb" value="' + esc(o.betrag) + '" inputmode="decimal" style="width:110px;height:40px;font-size:15px"> ' + kn(t('rt.s2'), 'cpRtSchritt', true, o.nr, 'rueckzahlung') + '</div>');
    else if (!o.ricardo) j = jetzt(t('c.p.rt.s3'), '<p class="still">' + t('rt.s3.mail') + '</p><p>' + (o.ricardoTage == null ? '' : o.ricardoTage >= 0 ? etk(t('rt.s3.frist', esc(o.ricardoFrist), o.ricardoTage), o.ricardoTage < 10 ? 'rot' : 'hell') : etk(t('rt.s3.vorbei', esc(o.ricardoFrist)), 'rot')) + '</p><div class="knoepfe">' + lnk(o.stornoLink, t('rt.s3.link')) + '</div>');
    else if (!o.entscheid) j = jetzt(t('c.p.rt.s4'), '<div class="f-wahl">' + (CP.entscheide || []).map(function (e) { return '<button' + akt('cpRtEntscheid', o.nr, e) + '>' + esc(t('f.e.' + e)) + '</button>'; }).join('') + '</div>');
    pOeffne(esc(o.nr), (o.pgId ? esc(o.pgId) + ' · ' : '') + esc(o.titel) + ' · ' + t('rt.verkauf', esc(o.verkauf)) + ' · CHF ' + esc(o.betrag),
      block(t('c.p.rt.schritte'), s) + j + hilfe(t('f.t7.physisch') + ' ' + t('f.t7.ricardo')) + adminBlock(o.pgId || o.verkauf));
  }

  /* ---------- Zubringer: Bank-Export und Verkaufsbericht als Panel ---------- */
  function cpBank() {
    CPP = { key: 'bank', art: 'bank' };
    pOeffne(esc(t('c.p.bank.titel')), t('c.p.bank.letzte', esc(CP.letzteBank || t('c.nie')), (CP.offenZahlung || []).length),
      '<p class="still">' + t('c.p.bank.text') + '</p><div class="reihe"><input type="file" id="f-bank" accept=".xlsx,.xls,.csv,text/csv"> <button class="haupt-knopf" onclick="bankLesen()">' + t('v.einlesen') + '</button></div><div id="f-bank-erg">' + bankHtml() + '</div>');
  }
  function cpBericht() {
    CPP = { key: 'bericht', art: 'bericht' };
    pOeffne(esc(t('c.p.bericht.titel')), t('c.p.bericht.letzter', esc(CP.letzterImport || t('u.keiner'))),
      '<p class="still">' + t('c.p.bericht.text') + '</p><div class="knoepfe">' + lnk(CP.links.verkauft, t('v.import.link')) + '</div>'
      + '<div class="reihe" style="margin-top:10px"><input type="file" id="f-bericht" accept=".csv,text/csv"> <button class="haupt-knopf" onclick="importieren(\'f-bericht\', function () { cpNach(); })">' + t('v.einlesen') + '</button></div><div id="f-bericht-meldung"></div>'
      + block(t('c.p.post'), '<div class="reihe"><button onclick="post(\'cp-post\')">' + t('v.post') + '</button> <span id="cp-post"></span></div>', true));
  }

  /* ---------- Handlungen: dieselben Serverfunktionen wie bisher, danach das Cockpit still neu laden ---------- */
  function cpRuf(name, args, danach) { ruf(name, args, function (x) { melde(t('c.gespeichert'), 'ok'); if (danach) danach(x); cpNach(); }, function (m) { return bestaetigen(m, function () { cpRuf(name, args.concat([true]), danach); }); }); }
  function cpListing(id, neu) { cpZu(); ablaufStarten('schicht1'); if (neu) start(id); else weiter(id); }
  Object.assign(AKTIONEN, {
    cpStart: function (id) { cpListing(id, true); },
    cpWeiter: function (id) { cpListing(id, false); },
    cpAbbrechen: function (id) { frage(t('s4.abbr.frage', id), function () { cpRuf('setzeStatus', [id, 'Abgebrochen']); cpZu(); }); },
    cpUnverkauft: function (id, abgelaufen) { var uz = CP.unzugeordnet || []; frage(unzugText(uz) + (abgelaufen === '1' ? '' : t('u.laeuft') + ' ') + t('u.frage', id), function () { ruf('setzeStatus', [id, 'Unverkauft', uz.length > 0], function () { melde(t('c.gespeichert'), 'ok'); cpZu(); cpNach(); }); }); },
    cpEntscheid: function (id, e) { ruf('entscheidUnverkauft', [id, e], function () { if (e === 'Neu listen') { cpListing(id, false); return; } melde(t('c.gespeichert'), 'ok'); cpZu(); cpNach(); }); },
    cpVerkauf: function (nr, aktion) {
      var o = (CP.verkauft || []).filter(function (x) { return x.nr === nr; })[0] || {}, los = function () { ruf('setzeVerkauf', [nr, aktion], function (v) { VK = v; melde(t('c.gespeichert'), 'ok'); if (aktion === 'versendet' || aktion === 'bezahlt') cpZu(); cpNach(); }); };
      if (aktion === 'gepackt' || aktion === 'ricardoBezahlt') los(); else frage(t(aktion === 'versendet' ? 'v.f.versendet' : 'v.f.bezahlt', o.pgId || o.titel || nr, o.total || ''), los);
    },
    cpErledigt: function (id) { ruf('aufgabeErledigt', [id], function (a) { aufgabenStill(a); CP.aufgaben = a; zeichneCockpit(); }); },
    cpErinnert: function (nr) { ruf('erinnerungErledigt', [nr], function (a) { aufgabenStill(a); CP.aufgaben = a; zeichneCockpit(); }); },
    cpStorno: function (nr) { frage(t('f.t6.frage', nr), function () { ruf('verkaufStornieren', [nr], function () { melde(t('c.gespeichert'), 'ok'); cpZu(); cpNach(); }); }); },
    cpRetoureNeu: function (nr) {
      var grund = $('cprg').value, iban = $('cpri').value, adr = $('cpra').value, notiz = $('cprn').value;
      if (!iban.trim()) { melde(t('rt.iban.fehlt'), 'stop'); $('cpri').focus(); return; }
      if (!adr.trim()) { melde(t('rt.adresse.fehlt'), 'stop'); $('cpra').focus(); return; }
      var o = (CP.versendet || []).filter(function (x) { return x.nr === nr; })[0] || {};
      frage(t('rt.f.eroeffnen', o.pgId || o.titel || nr, gr(grund)), function () {
        ruf('retoureEroeffnen', [nr, grund, notiz, iban, adr], function (r) { RT = r; if (r.mail) melde(r.mail.ok ? t('rt.mail.ok', r.mail.an) : t('rt.mail.fehler', r.mail.an || '–'), r.mail.ok ? 'ok' : 'stop'); cpZu(); CPS = 'retouren'; cpNach(); });
      });
    },
    cpRtSchritt: function (nr, schritt) {
      var wert = schritt === 'rueckzahlung' ? $('cprb').value : '', o = (CP.retouren || []).filter(function (x) { return x.nr === nr; })[0] || {};
      var los = function (ok) { ruf('retoureSchritt', ok ? [nr, schritt, wert, true] : [nr, schritt, wert], function (r) { RT = r; melde(t('c.gespeichert'), 'ok'); cpNach(); }, function (m) { return bestaetigen(m, function () { los(true); }); }); };
      if (schritt === 'rueckzahlung') frage(t('rt.f.zahlung', wert, o.name || o.kaeufer), function () { los(false); }); else los(false);
    },
    cpRtEntscheid: function (nr, e) { var los = function (ok) { ruf('retoureSchritt', ok ? [nr, 'entscheid', e, true] : [nr, 'entscheid', e], function (r) { RT = r; melde(t('c.gespeichert'), 'ok'); cpNach(); }, function (m) { return bestaetigen(m, function () { los(true); }); }); }; los(false); },
    cpAdmin: function (id) { cpZu(); zeige('admin'); admTab('storno'); $('ad-q').value = id; adminSuchen(); },
    cpBank: function () { cpBank(); }, cpBericht: function () { cpBericht(); }
  });
  $('cp-q').addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); cpSuchen(); } });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && CPP) cpZu(); });
  function zeigeZahlen() { zeige('admin'); admTab('kennzahlen'); }
