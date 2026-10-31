  /* ======================================================================
     COCKPIT (Umbau 30.10.2026, Entscheid Jonas): ein Stück wandert durch die Stufen
     Bereit → Online → Verkauft → Bezahlt → Versendet; Nebenausgänge Nicht verkauft, Retouren, Storniert.
     Ein Chip = eine Stufe, eine Liste; ein Klick auf eine Zeile öffnet rechts das Panel mit den Handlungen dieser Stufe,
     die fällige zuoberst unter «Jetzt». Die Handlungen rufen dieselben Serverfunktionen wie bisher.
     Der einzige Ablauf mit Schritten bleibt das Listing (ablaufStarten('schicht1')).
     ====================================================================== */
  Object.assign(T, {
    'nav.cockpit': ['Cockpit', 'Cockpit'], 'nav.todos': ['To-dos', 'To-dos'], 'nav.listing': ['Listing starten', 'Start listing'], 'nav.zahlen': ['Reporting', 'Reporting'], 'nav.einst': ['Einstellungen', 'Settings'],
    'c.such.platz': ['PG-ID, Titel, Käufer, Verkaufs-Nr.', 'PG-ID, title, buyer, sale no.'],
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
    'c.th.stueck': ['Stück', 'Item'], 'c.th.titel': ['Titel', 'Title'], 'c.th.preis': ['Preis', 'Price'], 'c.th.total': ['Total', 'Total'], 'c.th.stufe': ['Stufe', 'Stage'], 'c.th.kaeufer': ['Käufer', 'Buyer'], 'c.th.datum': ['Datum', 'Date'], 'c.th.offen': ['Offen', 'Open'],
    'c.th.zustand': ['Zustand', 'Condition'], 'c.th.woher': ['Woher', 'Source'], 'c.th.gebot': ['Gebot', 'Bid'], 'c.th.seit': ['Seit', 'Since'], 'c.th.ort': ['Regal', 'Shelf'], 'c.th.ende': ['Ende', 'End'], 'c.th.retoure': ['Retoure', 'Return'], 'c.th.schritt': ['Schritt', 'Step'], 'c.th.status': ['Status', 'Status'],
    'c.jetzt': ['Jetzt', 'Now'], 'c.tage': ['{0} Tage', '{0} days'], 'c.tag': ['1 Tag', '1 day'], 'c.heute': ['heute', 'today'],
    'c.o.adresse': ['Adresse fehlt', 'address missing'], 'c.o.packen': ['packen', 'pack'], 'c.o.gepackt': ['gepackt', 'packed'], 'c.o.zahlung': ['Zahlung offen', 'payment open'], 'c.o.erinnern': ['erinnern', 'remind'], 'c.o.storno': ['Storno prüfen', 'check cancellation'],
    'c.o.meldet': ['meldet bezahlt', 'says paid'], 'c.o.melden': ['bei Ricardo melden', 'report on Ricardo'], 'c.o.versenden': ['versenden', 'ship'], 'c.o.frage': ['Frage', 'question'], 'c.o.nachricht': ['Nachricht', 'message'], 'c.o.vorschlag': ['Preisvorschlag', 'price offer'],
    'c.o.abgelaufen': ['Laufzeit vorbei – auf Ricardo prüfen', 'duration over – check on Ricardo'], 'c.o.entscheid': ['Entscheid', 'decision'], 'c.o.bestaetigen': ['auf Ricardo prüfen', 'check on Ricardo'], 'c.o.bewertung': ['Bewertung', 'rating'], 'c.o.angefangen': ['angefangen', 'started'], 'c.o.neulisten': ['neu listen', 'relist'], 'c.o.analyse': ['aus der Analyse', 'from the analysis'],
    'c.o.rueckzahlung': ['Rückzahlung', 'refund'], 'c.o.ricardo': ['bei Ricardo stornieren', 'cancel on Ricardo'], 'c.o.stueck': ['Entscheid Stück', 'decide on item'], 'c.o.holen': ['Paket holen, Entscheid', 'fetch parcel, decide'],
    /* Panel */
    'c.p.listen': ['Listing mit diesem Stück starten', 'Start listing with this item'], 'c.p.weiter': ['Listing weiter bearbeiten', 'Continue the listing'], 'c.p.abbrechen': ['Listing abbrechen (Stück wird frei)', 'Discard listing (item becomes available)'],
    'c.p.analyse': ['Analyse {0} · {1} · Fotos {2}', 'Analysis {0} · {1} · photos {2}'], 'c.p.neupreis': ['Neupreis CHF {0}', 'New price CHF {0}'],
    'c.p.angebot': ['Angebot', 'Listing'], 'c.p.verkauf': ['Verkauf', 'Sale'], 'c.p.fotos': ['Foto-Ordner', 'Photo folder'], 'c.p.links': ['Links', 'Links'],
    'c.p.laeuft': ['Läuft seit {0} · Laufzeit {1} Tage', 'Running since {0} · duration {1} days'], 'c.p.abgelaufen': ['Laufzeit vorbei. Kommt die Ricardo-Mail «nicht verkauft», wechselt das Stück von selbst. Sonst auf Ricardo prüfen und von Hand setzen.', 'Duration over. With the Ricardo mail «not sold» the item moves by itself. Otherwise check on Ricardo and set it by hand.'],
    'c.p.unverkauft': ['Nicht verkauft', 'Not sold'], 'c.p.bearbeiten': ['Angebot im Listing bearbeiten', 'Edit the listing'],
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
    'c.p.retoure': ['Retoure eröffnen', 'Open a return'], 'c.p.rt.betrag': ['Betrag der Rückzahlung (Vorschlag: Total, bei Bedarf ändern)', 'Refund amount (suggestion: total, change if needed)'], 'c.p.rt.betrag.fehlt': ['Bitte den Betrag der Rückzahlung eintragen.', 'Please enter the refund amount.'], 'c.p.rt.adresse': ['Adresse der Käufer*in (aus dem Verkauf, bei Bedarf überschreiben)', 'Buyer address (from the sale, overwrite if needed)'], 'c.p.retoure.text': ['Grund, IBAN und Strasse der Käufer*in. Die Rückzahlung geht per Mail an die Buchhaltung.', 'Reason, IBAN and street of the buyer. The refund is mailed to accounting.'],
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
    'c.tun': ['Zu tun', 'To do'], 'c.mails': ['Mails prüfen', 'Check mails'], 'c.zuletzt': ['zuletzt {0}', 'last {0}'], 'c.s.aufgabe': ['Ohne Stück', 'No item'], 'c.tun.leer': ['Nichts zu tun.', 'Nothing to do.'], 'c.tun.alle': ['Alle', 'All'], 'c.th.tun': ['Zu tun', 'To do'],
    'c.sub.todos': ['Alles, was heute dran ist, über alle Stufen. Ein Klick auf eine Zeile öffnet die Handlung. Filter: eine Art von Aufgabe.', 'Everything due today across all stages. Click a row to open the action. Filter: one kind of task.'],
    'c.ende': ['Ende {0}', 'End {0}'], 'c.ende.so': ['Alle Auktionen enden am {0}: Laufzeit auf Ricardo so wählen, dass das Ende dort steht ({1} Tage).', 'All auctions end on {0}: choose the duration on Ricardo so that it ends then ({1} days).'],
    'c.p.reakt': ['Auf Ricardo neu einstellen', 'List again on Ricardo'],
    'c.p.reakt.r': ['1. Altes Angebot auf Ricardo öffnen und «Erneut einstellen» (oder «Angebot kopieren») wählen. 2. Laufzeit so setzen, dass die Auktion am {0} endet. 3. Veröffentlichen. 4. Link des neuen Angebots hier einfügen und «Gelistet» klicken. Text und Preis bleiben wie beim alten Angebot; für Änderungen: «Listing ganz durchgehen».', '1. Open the old listing on Ricardo and choose «List again» (or «copy listing»). 2. Set the duration so that the auction ends on {0}. 3. Publish. 4. Paste the link of the new listing here and click «Listed». Text and price stay as before; for changes: «Go through the listing».'],
    'c.p.reakt.link': ['Link des neuen Angebots', 'Link of the new listing'], 'c.p.reakt.ok': ['Gelistet', 'Listed'], 'c.p.reakt.alt': ['Altes Angebot öffnen', 'Open the old listing'], 'c.p.reakt.kopie': ['Angebot kopieren (vorausgefüllt)', 'Copy listing (prefilled)'],
    'c.p.reakt.ganz': ['Listing ganz durchgehen (Text, Preis)', 'Go through the listing (text, price)'],
    'c.p.datei': ['Datei', 'File'], 'c.p.bank.s1': ['1 · Datei aus dem E-Banking wählen und lesen', '1 · Pick and read the e-banking file'], 'c.p.bank.s2': ['2 · Zuordnungen prüfen', '2 · Check the matches'], 'c.p.bank.s3': ['3 · Zahlungen erfassen', '3 · Record the payments'],
    'c.p.bericht.s1': ['1 · Verkaufsbericht auf Ricardo holen', '1 · Get the sales report on Ricardo'], 'c.p.bericht.s2': ['2 · Datei hier einlesen', '2 · Import the file here'],
    'c.t.fragen': ['Fragen', 'Questions'], 'c.t.nachrichten': ['Nachrichten', 'Messages'], 'c.t.angebote': ['Preisvorschläge', 'Price offers'], 'c.t.bewertungen': ['Bewertungen', 'Ratings'], 'c.t.melden': ['Zahlung bei Ricardo melden', 'Report payment'],
    'c.t.pruefen': ['Zahlung prüfen', 'Check payment'], 'c.t.erinnern': ['Erinnern', 'Remind'], 'c.t.storno': ['Storno prüfen', 'Check cancellation'], 'c.t.adresse': ['Adresse fehlt', 'Address missing'],
    'c.t.packen': ['Packen', 'Pack'], 'c.t.versenden': ['Versenden', 'Ship'], 'c.t.retoure': ['Retoure-Schritt', 'Return step'], 'c.t.laufzeit': ['Laufzeit prüfen', 'Check duration'], 'c.t.entscheid': ['Nicht verkauft', 'Not sold'],
    'c.p.total': ['Preis {0} + Porto {1} = Total {2}', 'Price {0} + postage {1} = total {2}'], 'c.p.pruefen': ['Zahlung prüfen', 'Check payment'],
    'c.p.pruefen.text': ['Die Käufer*in meldet auf Ricardo «bezahlt» ({0}). Bezahlt wird es erst, wenn das Geld da ist: Bank-Export einlesen oder mit Beleg von Hand markieren.', 'The buyer reports «paid» on Ricardo ({0}). It counts as paid only once the money is in: import the bank export or mark it by hand with proof.'],
    'c.ric.zuerst': ['Zuerst auf Ricardo öffnen und dort erledigen, dann hier bestätigen.', 'First open it on Ricardo and do it there, then confirm here.'],
    'c.rt.leer': ['Keine offene Retoure. Eine Retoure eröffnest du beim versendeten Verkauf: Stufe Versendet oder Suche → Block «Retoure eröffnen».', 'No open return. You open a return on the shipped sale: stage Shipped or search → block «Open a return».'],
    'c.bank.so': ['So geht es: 1. Datei aus dem E-Banking wählen und lesen. 2. Die vorgeschlagenen Zuordnungen prüfen, Haken setzen oder entfernen. 3. «Zahlungen erfassen». Die Verkäufe wechseln dann nach «Bezahlt».', 'How it works: 1. Pick and read the e-banking file. 2. Check the proposed matches, tick or untick. 3. «Record payments». The sales then move to «Paid».'],
    'c.bank.sicher': ['Zugeordnet – bitte bestätigen', 'Matched – please confirm'], 'c.bank.sicher.text': ['Verkaufs- oder Artikelnummer und Betrag stimmen. Vorangehakt.', 'Sale or item number and amount match. Pre-ticked.'],
    'c.bank.unsicher': ['Unsicher – selber entscheiden', 'Uncertain – decide yourself'], 'c.bank.unsicher.text': ['Nur Name oder nur Nummer passt. Haken setzen, wenn es stimmt.', 'Only the name or only the number matches. Tick if it is right.'],
    'c.bank.ohne': ['Gutschriften ohne Ricardo-Verkauf', 'Credits without a Ricardo sale'], 'c.bank.ohne.text': ['Zum Beispiel andere Zahlungen. Hier ist nichts zu tun. Gehört eine doch zu einem Verkauf: den Verkauf öffnen und «Als bezahlt markieren».', 'For example other payments. Nothing to do here. If one does belong to a sale: open the sale and «Mark as paid».'],
    'c.bank.erfassen': ['{0} angehakte Zahlungen erfassen', 'Record {0} ticked payments'], 'c.bank.fertig': ['{0} Zahlungen erfasst → Stufe Bezahlt', '{0} payments recorded → stage Paid'],
    'c.bank.gelesen': ['{0} Gutschriften gelesen · {1} schon erfasst · {2} Verkäufe ohne Zahlung', '{0} credits read · {1} already recorded · {2} sales without payment'],
    'c.hilfe': ['Hinweise', 'Notes'], 'c.zu': ['Schliessen', 'Close'], 'c.gespeichert': ['Gespeichert.', 'Saved.'], 'c.voll': ['{0} Angebote aktiv, Limite fast erreicht', '{0} listings active, limit almost reached'],
    'c.o.angebote': ['{0} Angebote', '{0} listings'], 'c.neu': ['+ Stück ohne Analyse', '+ Item without analysis'], 'c.test': ['TESTUMGEBUNG – Kopie des Live-Sheets, nichts geht nach aussen', 'TEST ENVIRONMENT – copy of the live sheet, nothing goes outside']
  });

  var CP = null, CPS = 'verkauft', CPP = null, CPQ = null, CPT = null, CPLADEN = false, ANA_ZEIT = 0, RIC = {}, CPM = 'cockpit';   // CPM: 'cockpit' oder 'todos' (eigener Reiter, Feedback 31.10.)
  var CP_STUFEN = ['bereit', 'online', 'verkauft', 'bezahlt', 'versendet', 'nichtverkauft', 'retouren', 'storniert'];
  function cpNach() { if (CP) ladeCockpit(true); }
  /* Tempo (Feedback 31.10.): Cockpit und Analyse-Liste laufen parallel; die Analyse (externes Sheet, langsam) kommt nach, höchstens alle 3 Minuten neu */
  function ladeCockpit(stillLaden) {
    var da = function (c) { c.analyse = CP ? CP.analyse : ANA; CP = c; CPLADEN = false; if (c.aufgaben) { AU = c.aufgaben; marke($('z-aufgaben'), c.aufgaben.anzahl); } zaehler(c.aktiv, c.schwelle); if (ANSICHT === 'cockpit') zeichneCockpit(); };
    ladeAnalyseCockpit();
    if (stillLaden && CP) { still('cockpit', [], function (c) { if (c) { c.analyse = CP.analyse; if (!gleich(c, CP)) da(c); } }); return; }
    if (CPLADEN) return;
    CPLADEN = true;
    ruf('cockpit', [], da, function () { CPLADEN = false; return false; });
  }
  function ladeAnalyseCockpit(jetzt) {
    if (!jetzt && Date.now() - ANA_ZEIT < 180000) return;
    ANA_ZEIT = Date.now();
    still('analyseListe', [], function (l) { ANA = l || []; zeichneAnalyse(); if (CP) { CP.analyse = ANA; if (ANSICHT === 'cockpit') zeichneCockpit(); } });
  }
  /* Auktionsende im Browser (gleiche Regel wie auktionsende_ im Server): nächstes «Donnerstag 19:00», mindestens 24 h entfernt. null = Einstellung leer. */
  function naechstesEnde() {
    var m = /^([a-zäö]+)\s+(\d{1,2})[:.](\d{2})$/i.exec(String((S && S.auktionsende) || '').trim()), tage = ['sonntag', 'montag', 'dienstag', 'mittwoch', 'donnerstag', 'freitag', 'samstag'];
    if (!m) return null;
    var wt = tage.indexOf(m[1].toLowerCase()), hh = Number(m[2]), mi = Number(m[3]), jetzt = new Date();
    if (wt === -1) return null;
    for (var d = (wt - jetzt.getDay() + 7) % 7; d <= 14; d += 7) {
      var k = new Date(jetzt.getFullYear(), jetzt.getMonth(), jetzt.getDate() + d, hh, mi, 0, 0);
      if (k.getTime() - jetzt.getTime() >= 86400000) return { ende: k, tage: Math.max(1, Math.ceil((k.getTime() - jetzt.getTime()) / 86400000)), text: ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'][wt] + ' ' + ('0' + k.getDate()).slice(-2) + '.' + ('0' + (k.getMonth() + 1)).slice(-2) + '.' + k.getFullYear() + ' ' + ('0' + hh).slice(-2) + ':' + ('0' + mi).slice(-2) };
    }
    return null;
  }
  function endeText() { var e = naechstesEnde(); return e ? e.text : t('f.laufzeit.w'); }
  function cpRegal(k) { return (CP && CP.regale && CP.regale[k]) || ({ offline: 'Ricardo Offline', online: 'Ricardo Online', unpaid: 'Ricardo Unpaid' })[k]; }
  function tage(n) { return n === 0 ? t('c.heute') : n === 1 ? t('c.tag') : t('c.tage', n); }
  function tagKl(h) { return h >= 24 ? ' rot' : h >= 4 ? ' orange' : ''; }
  function etk(text, kl) { return text ? '<span class="etikett' + (kl ? ' ' + kl : '') + '">' + text + '</span>' : ''; }
  function artikelVon(link) { var m = /\/a\/(\d+)/.exec(String(link || '')); return m ? m[1] : ''; }
  /* Aufgaben aus den Ricardo-Mails zu einem Stück oder Verkauf */
  /* mitBewertung: nur bei versendeten Verkäufen (Feedback 31.10.: eine Bewertung kommt erst nach dem Versand, vorher gehört sie nicht ins Zu-tun) */
  function cpAufgaben(pgId, artikel, nr, mitBewertung) {
    var au = (CP && CP.aufgaben) || { fragen: [], angebote: [], zahlung: [], bewertungen: [] }, passt = function (o) { return (pgId && o.pgId === pgId) || (artikel && o.artikel === artikel) || (nr && o.nr === nr); };
    return { fragen: (au.fragen || []).filter(passt), angebote: (au.angebote || []).filter(passt), zahlung: nr ? (au.zahlung || []).filter(function (o) { return o.nr === nr; }) : [], bewertungen: mitBewertung ? (au.bewertungen || []).filter(passt) : [] };
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
        if (x.abgelaufen) return;                                           // Laufzeit vorbei: steht unter «Nicht verkauft» zum Prüfen (Feedback 31.10.)
        var au = cpAufgaben(x.id, artikelVon(x.link), ''), off = '';
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
          if (o.meldet) off += etk(t('c.o.meldet'), 'orange');
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
        var au = cpAufgaben(o.pgId, o.artikel, o.nr, true), off = '';
        if (o.bezahlt && !o.ricardoGemeldet) off += etk(t('c.o.melden'), 'orange');   // Abgleich 31.10.: versendet, aber Zahlung auf Ricardo nicht gemeldet
        au.fragen.forEach(function (q) { off += etk(esc(q.art), 'orange'); }); au.bewertungen.forEach(function () { off += etk(t('c.o.bewertung'), 'orange'); });
        l.push({ key: 's' + o.nr, art: 'versendet', o: o, z: [o.pgId || t('v.nichtzu'), o.titel, 'CHF ' + o.total, o.name || o.kaeufer, o.versendetAm, off] });
      });
    } else if (stufe === 'nichtverkauft') {
      (CP.ohneMail || []).forEach(function (x) { l.push({ key: 'e' + x.id, art: 'ohnemail', o: x, z: [x.id, x.name, t('f.s2.ende', x.ende), '', x.ort || cpRegal('online'), etk(t('c.o.abgelaufen'), 'orange')] }); });
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
    verkauft: ['c.th.stueck', 'c.th.titel', 'c.th.total', 'c.th.kaeufer', 'c.th.datum', 'c.th.offen'], bezahlt: ['c.th.stueck', 'c.th.titel', 'c.th.total', 'c.th.kaeufer', 'c.s.bezahlt', 'c.th.offen'],
    versendet: ['c.th.stueck', 'c.th.titel', 'c.th.total', 'c.th.kaeufer', 'c.s.versendet', 'c.th.offen'], nichtverkauft: ['c.th.stueck', 'c.th.titel', 'c.th.ende', '', 'c.th.ort', 'c.th.offen'],
    retouren: ['c.th.retoure', 'c.th.stueck', 'c.th.preis', 'c.th.kaeufer', 'c.th.datum', 'c.th.schritt'], storniert: ['c.th.stueck', 'c.th.titel', '', '', 'c.th.ort', 'c.th.offen']
  };
  function cpZahl(stufe) { return cpZeilen(stufe).length; }
  /* Zu tun (Feedback 31.10., Nr. 17): was heute dran ist, über alle Stufen hinweg. Ein Schlüssel pro Handlung. */
  var CP_TUN = ['fragen', 'nachrichten', 'angebote', 'bewertungen', 'adresse', 'packen', 'pruefen', 'erinnern', 'storno', 'melden', 'versenden', 'laufzeit', 'entscheid', 'retoure'];
  function tunVon(r) {
    var o = r.o, k = [], au;
    if (r.art === 'aufgabe') return [r.typ === 'angebote' ? 'angebote' : r.typ === 'bewertungen' ? 'bewertungen' : o.art === 'Frage' ? 'fragen' : 'nachrichten'];
    var fragen = function (au) {   // Feedback 31.10.: Fragen und Nachrichten getrennt
      if (au.fragen.some(function (q) { return q.art === 'Frage'; })) k.push('fragen');
      if (au.fragen.some(function (q) { return q.art !== 'Frage'; })) k.push('nachrichten');
      if (au.angebote.length) k.push('angebote'); if (au.bewertungen.length) k.push('bewertungen');
    };
    if (r.art === 'online') fragen(cpAufgaben(o.id, artikelVon(o.link), ''));
    if (r.art === 'verkauft' || r.art === 'bezahlt' || r.art === 'versendet') {
      au = cpAufgaben(o.pgId, o.artikel, o.nr, r.art === 'versendet'); fragen(au);
      if (r.art === 'verkauft') { if (o.ohneAdresse) k.push('adresse'); else if (o.status === 'Zu packen') k.push('packen'); if (o.meldet && !o.bezahlt) k.push('pruefen'); if (cpStorno(o.nr)) k.push('storno'); else if (au.zahlung.length) k.push('erinnern'); }
      if (r.art === 'versendet' && o.bezahlt && !o.ricardoGemeldet) k.push('melden');
      if (r.art === 'bezahlt') { if (!o.ricardoGemeldet) k.push('melden'); if (o.status === 'Zu packen') k.push(o.ohneAdresse ? 'adresse' : 'packen'); else if (o.ricardoGemeldet) k.push('versenden'); }
    }
    if (r.art === 'ohnemail') k.push('laufzeit');
    if (r.art === 'nichtverkauft' || r.art === 'storniert') k.push('entscheid');
    if (r.art === 'retouren' && (!o.rueckzahlungAm || !o.ricardo || !o.entscheid)) k.push('retoure');
    return k;
  }
  function cpAlle() { var alle = []; CP_STUFEN.forEach(function (s) { alle = alle.concat(cpZeilen(s)); }); return alle.concat(cpWaisen(alle)); }
  /* Aufgaben aus den Mails, die zu keinem Stück und keinem Verkauf im Cockpit passen (z.B. Nachricht zu einem beendeten Angebot):
     früher in «Zu erledigen» sichtbar, darum hier als eigene Zeile, damit nichts vergessen geht (Prüfung 31.10.). */
  function cpWaisen(alle) {
    var au = (CP && CP.aufgaben) || {}, l = [];
    var passt = function (o) { return alle.some(function (r) { var x = r.o || {}; return (o.pgId && (x.id === o.pgId || x.pgId === o.pgId)) || (o.artikel && (x.artikel === o.artikel || artikelVon(x.link) === o.artikel)) || (o.nr && x.nr === o.nr); }); };
    ['angebote', 'fragen', 'bewertungen'].forEach(function (k) {
      (au[k] || []).forEach(function (o) { if (!passt(o)) l.push({ key: 'w' + o.id, art: 'aufgabe', o: o, typ: k, z: [o.pgId || '–', o.titel || o.artikel || '', '', '', o.eingang || '', etk(esc(o.art || t('g.vorschlag')), 'orange')] }); });
    });
    return l;
  }
  /* Älteste bzw. dringendste Aufgabe einer Zeile: Preisvorschlag mit Frist zuerst, dann nach Alter (Stunden) */
  function cpDringend(r) {
    var o = r.o, au = r.art === 'aufgabe' ? { angebote: r.typ === 'angebote' ? [o] : [], fragen: r.typ === 'fragen' ? [o] : [], bewertungen: r.typ === 'bewertungen' ? [o] : [], zahlung: [] }
      : r.art === 'online' ? cpAufgaben(o.id, artikelVon(o.link), '') : (r.art === 'verkauft' || r.art === 'bezahlt' || r.art === 'versendet') ? cpAufgaben(o.pgId, o.artikel, o.nr, r.art === 'versendet') : null;
    if (!au) return { frist: null, alter: 0 };
    var frist = null, alter = 0;
    au.angebote.forEach(function (a) { if (a.restStunden !== '' && (frist === null || a.restStunden < frist)) frist = a.restStunden; alter = Math.max(alter, a.alter || 0); });
    au.fragen.concat(au.bewertungen).forEach(function (a) { alter = Math.max(alter, a.alter || 0); });
    return { frist: frist, alter: alter };
  }
  /* To-dos (Feedback 31.10.): gleiche Tabelle wie das Cockpit; Spalten Stück, Titel, Stufe, Zu tun (mit Alter bzw. Frist); dringendste zuerst */
  function tunZeilen(alle, tun) {
    var l = alle.filter(function (r) { var k = tunVon(r); return k.length && (!tun || k.indexOf(tun) !== -1); }).map(function (r, i) {
      var d = cpDringend(r), wann = d.frist !== null ? etk(t('a.frist', '', d.frist).replace(/^\S+\s+/, ''), d.frist < 12 ? 'rot' : 'orange') : d.alter ? etk(t('a.vor', d.alter), tagKl(d.alter).trim()) : '';
      return { key: r.key, art: r.art, o: r.o, ana: r.ana, typ: r.typ, d: d, i: i, z: [r.z[0], r.z[1], t('c.s.' + stufeVon(r.art)), tunVon(r).map(function (k) { return etk(t('c.t.' + k), 'orange'); }).join('') + wann] };
    });
    return l.sort(function (a, b) {
      if ((a.d.frist !== null) !== (b.d.frist !== null)) return a.d.frist !== null ? -1 : 1;
      if (a.d.frist !== null) return a.d.frist - b.d.frist;
      return (b.d.alter - a.d.alter) || (a.i - b.i);
    });
  }
  function stufeVon(art) { return art === 'ohnemail' ? 'nichtverkauft' : art; }
  function cpMails() { ruf('mailsJetzt', [], function (a) { AU = a; if (CP) { CP.aufgaben = a; zeichneCockpit(); } }); }
  function cpTun(k) { CPT = CPT === k ? null : k; CPQ = null; CPP = null; zeichneCockpit(); }
  /* To-dos als eigener Reiter (Feedback 31.10.): dieselbe Seite, andere Sicht */
  function zeigeTodos() { CPM = 'todos'; CPQ = null; CPP = null; if ($('cp-q')) $('cp-q').value = ''; zeige('cockpit'); }
  function zeigeCockpit() { CPM = 'cockpit'; CPT = null; CPQ = null; CPP = null; if ($('cp-q')) $('cp-q').value = ''; zeige('cockpit'); }

  function zeichneCockpit() {
    if (!CP) return;
    var k = CP.aufgaben && CP.aufgaben.kontrolle, h = '';
    var kurz = function (x) { return x ? t('c.zuletzt', String(x).replace(/\.(\d{4})\b/, '.')) : t('c.nie'); };
    $('cp-d-mails').textContent = kurz(k && k.letzte); $('cp-d-bericht').textContent = kurz(CP.letzterImport); $('cp-d-bank').textContent = kurz(CP.letzteBank);
    if (k && !k.aktiv) h += '<div class="meldung warn">' + t('c.mail.aus') + '</div>';
    else if (k && k.warnung) h += '<div class="meldung warn">' + t('c.mail.still', esc(k.letzte)) + '</div>';
    if (k && k.unecht) h += '<div class="meldung warn">' + t('a.unecht', k.unecht) + '</div>';
    if (CP.aufgaben && CP.aufgaben.verpasst) h += '<div class="meldung warn">' + t('a.verpasst', CP.aufgaben.verpasst) + '</div>';
    if (CP.aktiv >= CP.schwelle) h += '<div class="meldung warn">' + t('c.voll', CP.aktiv) + '</div>';
    (CP.doppelt || []).forEach(function (d) { h += '<div class="meldung stop">' + t('c.p.doppelt', esc(d.pgId) + ': ' + d.verkaeufe.map(function (v) { return t('v.nr', esc(v.nr)) + ' (' + esc(v.name) + ', CHF ' + esc(v.total) + ')'; }).join(' · ')) + '</div>'; });
    if (CP.test) h = '<div class="meldung stop">' + t('c.test') + '</div>' + h;
    $('cp-warn').innerHTML = h;
    var alle = cpAlle(), tunZahl = {};
    alle.forEach(function (r) { tunVon(r).forEach(function (k) { tunZahl[k] = (tunZahl[k] || 0) + 1; }); });
    var todos = CPM === 'todos', alleTun = tunZeilen(alle, null);
    marke($('z-todos'), alleTun.length);
    $('nav-todos').className = todos && ANSICHT === 'cockpit' ? 'an' : ''; $('nav-cockpit').className = !todos && ANSICHT === 'cockpit' ? 'an' : '';
    $('top-sub').textContent = t(todos ? 'nav.todos' : 'nav.cockpit');
    var tunChips = '<button class="chip' + (!CPT ? ' an' : '') + '" onclick="cpTun(null)">' + esc(t('c.tun.alle')) + ' <span class="zahl">' + alleTun.length + '</span></button>'
      + CP_TUN.filter(function (k) { return tunZahl[k] || k === 'angebote'; }).map(function (k) { return '<button class="chip' + (k === CPT ? ' an' : '') + '" onclick="cpTun(\'' + k + '\')">' + esc(t('c.t.' + k)) + ' <span class="zahl">' + (tunZahl[k] || 0) + '</span></button>'; }).join('');   // Preisvorschläge immer sichtbar (Jonas 31.10.)
    $('cp-tun').hidden = !todos; $('cp-chips').hidden = todos;
    $('cp-tun').innerHTML = alleTun.length ? tunChips : '<span class="still">' + esc(t('c.tun.leer')) + '</span>';
    $('cp-chips').innerHTML = CP_STUFEN.map(function (s) { return '<button class="chip' + (s === CPS && !CPQ ? ' an' : '') + '" onclick="cpStufe(\'' + s + '\')">' + esc(t('c.s.' + s)) + ' <span class="zahl">' + cpZahl(s) + '</span></button>'; }).join('');
    $('cp-sub').textContent = '';   // Feedback Jonas 31.10.2026: keine Beschreibungstexte unter den Chips («verwirren nur»)
    var l = CPQ ? CPQ.zeilen : todos ? (CPT ? tunZeilen(alle, CPT) : alleTun) : cpZeilen(CPS), kopf = CPQ ? ['c.th.stueck', 'c.th.titel', '', '', '', ''] : todos ? ['c.th.stueck', 'c.th.titel', 'c.th.stufe', 'c.th.tun'] : CP_KOPF[CPS];
    if (CPQ) $('cp-sub').innerHTML = esc(t('c.treffer', l.length)) + ' <button class="klein-knopf" onclick="cpSucheZu()">' + esc(t('c.such.zu')) + '</button>';
    $('cp-liste').innerHTML = l.length ? '<div class="tabelle"><table><tr>' + kopf.map(function (x) { return '<th>' + (x ? esc(t(x)) : '') + '</th>'; }).join('') + '<th></th></tr>'
      + l.map(function (r) { return '<tr class="cp-zeile' + (CPP && CPP.key === r.key ? ' an' : '') + '" data-key="' + esc(r.key) + '"' + akt('cpAuf', r.key) + '>' + r.z.map(function (c, i) { return '<td' + (i === 0 ? ' class="mono"' : '') + '>' + (i === 5 || (CPQ && i === 2) || (todos && i === 3) ? c : esc(c)) + '</td>'; }).join('') + '<td class="pfeil">→</td></tr>'; }).join('') + '</table></div>'
      : '<p class="still">' + t(CPQ ? 'c.such.leer' : todos ? 'c.tun.leer' : CPS === 'retouren' ? 'c.rt.leer' : 'c.leer') + '</p>';
    if (CPP) { var r = cpFinde(CPP.key); if (r) zeichnePanel(r); else if (CPP.art !== 'bank' && CPP.art !== 'bericht') cpZu(); }
  }
  function cpStufe(s) { CPS = s; CPQ = null; CPP = null; if (s === 'bereit') ladeAnalyseCockpit(); zeichneCockpit(); }
  function cpFinde(key) { return (CPQ ? CPQ.zeilen : []).concat(cpAlle()).filter(function (r) { return r.key === key; })[0]; }
  function cpAuf(key) { var r = cpFinde(key); if (!r) return; CPP = { key: key, art: r.art }; zeichnePanel(r); Array.prototype.forEach.call(document.querySelectorAll('.cp-zeile'), function (z) { z.classList.toggle('an', z.getAttribute('data-key') === key); }); }
  function cpZu() { CPP = null; $('cp-veil').hidden = true; Array.prototype.forEach.call(document.querySelectorAll('.cp-zeile'), function (z) { z.classList.remove('an'); }); }
  Object.assign(AKTIONEN, { cpAuf: cpAuf });

  /* ---------- Suche über alles (Admin-Suche: jeder Status) ---------- */
  function cpSuchen() {
    var q = $('cp-q').value.trim();
    if (!q) { cpSucheZu(); return; }
    ruf('cockpitSuche', [q], function (a) {
      var z = [];
      (a.listings || []).forEach(function (x) {
        var r = cpFinde((x.status === 'Gelistet' ? 'o' : OFFEN_ST.indexOf(x.status) !== -1 ? 'b' : 'u') + x.id);
        z.push(r || { key: 'q' + x.id, art: 'fremd', o: x, z: [x.id, x.name, etk(st(x.status)), '', x.am, ''] });
      });
      (a.verkaeufe || []).forEach(function (o) {
        var r = cpFinde('v' + o.nr) || cpFinde('s' + o.nr);
        if (!r && o.status === 'Bezahlt und versendet') r = { key: 's' + o.nr, art: 'versendet', o: o, z: [o.pgId || t('v.nichtzu'), o.titel, etk(st(o.status)), o.name || o.kaeufer, o.am, 'CHF ' + o.total] };
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
  /* Geführter Doppelschritt (Feedback 31.10., Nr. 14): der Knopf zu Ricardo merkt sich, dass er geklickt wurde; erst dann geht die Bestätigung im Tool */
  function lnkR(url, text, key) { return istRicardo(url) ? '<button class="haupt-knopf"' + akt('linkR', url, key) + '>' + esc(text) + ' ↗</button>' : ''; }
  function knR(text, aktion, key, a, b) { return '<button class="' + (RIC[key] ? 'haupt-knopf' : '') + '"' + (RIC[key] ? '' : ' disabled title="' + esc(t('c.ric.zuerst')) + '"') + akt(aktion, a, b) + '>' + esc(text) + '</button>' + (RIC[key] ? '' : '<span class="klein">' + esc(t('c.ric.zuerst')) + '</span>'); }
  function kn(text, aktion, haupt, a, b) { return '<button class="' + (haupt ? 'haupt-knopf' : '') + '"' + akt(aktion, a, b) + '>' + esc(text) + '</button>'; }
  function adminBlock(id) { return block(t('c.p.admin'), '<button' + akt('cpAdmin', id) + '>' + esc(t('c.p.admin.such')) + '</button>', true); }
  function aufgabenHtml(au) {
    var h = '';
    au.angebote.forEach(function (o) {
      var annehmen = String(o.empfehlung).indexOf('Annehmen') === 0;
      h += jetzt(t('g.vorschlag'), '<p>' + t('a.vorschlag', esc(o.betrag), esc(o.preis)) + (o.frist ? ' · ' + t('a.frist', esc(o.frist), o.restStunden) : '') + '</p><p>' + etk(esc(o.empfehlung), annehmen ? 'hell' : '') + '</p>'
        + hilfe(t('f.t3.ricardo')) + '<div class="knoepfe">' + lnkR(o.link, t('g.vorschlag.k'), 'a' + o.id) + knR(t('c.p.aufgabe.erledigt'), 'cpErledigt', 'a' + o.id, o.id) + '</div>');
    });
    au.fragen.forEach(function (o, i) {
      var frage = o.art === 'Frage' && o.entwurf, id = 'cpf-' + i;
      h += jetzt(esc(o.art) + (o.von ? ' · ' + t('a.von', esc(o.von)) : ''), (o.text ? '<div class="frage">' + esc(o.text) + '</div>' : (o.art === 'Nachricht' ? '<p class="still">' + t('a.nachricht') + '</p>' : ''))
        + (frage ? '<label for="' + id + '">' + t('a.entwurf') + '</label>' + textfeld(id, o.entwurf, 5) : (o.art === 'Frage' ? '<p class="still">' + t('a.keinentwurf') + '</p>' : ''))
        + '<div class="knoepfe">' + (frage ? '<button class="haupt-knopf"' + akt('kopierOeffneR', id + '|a' + o.id, o.link) + '>' + t('c.p.kopieren.oeffnen') + '</button>' : lnkR(o.link, t('a.oeffnen'), 'a' + o.id)) + knR(t('c.p.aufgabe.erledigt'), 'cpErledigt', 'a' + o.id, o.id) + '</div>');
    });
    au.bewertungen.forEach(function (o, i) {
      var id = 'cpb-' + i;
      h += jetzt(t('g.bewertung') + (o.von ? ' · ' + esc(o.von) : ''), textfeld(id, o.entwurf, 3) + hilfe(t('g.bewertung.r')) + '<div class="knoepfe"><button class="haupt-knopf"' + akt('kopierOeffneR', id + '|a' + o.id, o.link) + '>' + t('c.p.kopieren.oeffnen') + '</button>' + knR(t('c.p.aufgabe.erledigt'), 'cpErledigt', 'a' + o.id, o.id) + '</div>');
    });
    return h;
  }
  function zeichnePanel(r) {
    var o = r.o, art = r.art;
    if (art === 'bereit') {
      var ana = r.ana;
      var ae = CP.auktionsende, endeText = ae ? esc(ae.text) : t('f.laufzeit.w');
      var reakt = !ana && o.wieder ? jetzt(t('c.p.reakt'), '<p>' + t('c.p.reakt.r', '<strong>' + endeText + '</strong>') + '</p>'
          + '<div class="knoepfe">' + lnkR(o.link, t('c.p.reakt.alt'), 'w' + o.id) + (o.kopieren ? lnkR(o.kopieren, t('c.p.reakt.kopie'), 'w' + o.id) : '') + '</div>'
          + '<label class="klein" for="wl-' + esc(o.id) + '">' + t('c.p.reakt.link') + '</label><input type="text" id="wl-' + esc(o.id) + '" placeholder="https://www.ricardo.ch/de/a/..." autocomplete="off">'
          + '<div class="knoepfe">' + knR(t('c.p.reakt.ok'), 'cpGelistet', 'w' + o.id, o.id) + kn(t('c.p.reakt.ganz'), 'cpWeiter', false, o.id) + '</div>') : '';
      pOeffne(esc(o.id), esc(ana ? (o.titel || o.name) : o.name) + ' · ' + t('c.s.bereit') + ' · ' + esc(o.ort || cpRegal('offline')),
        (ana ? '<p class="still">' + t('c.p.analyse', esc(o.erfasst || ''), esc(zu(o.zustand)), esc(o.fotos || 0)) + (o.preis ? ' · ' + t('c.p.neupreis', Number(o.preis).toFixed(2)) : '') + '</p>' : '')
        + (reakt || jetzt(t('such.listen'), '<p class="still">' + t('such.hilfe') + '</p><p class="still">' + t('c.ende.so', '<strong>' + endeText + '</strong>', ae ? ae.tage : CP.laufzeit) + '</p><div class="knoepfe">' + kn(t(ana ? 'c.p.listen' : 'c.p.weiter'), ana ? 'cpStart' : 'cpWeiter', true, o.id) + '</div>'))
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
      var au2 = cpAufgaben(o.pgId, o.artikel, o.nr, true);
      pOeffne(esc(o.pgId || o.nr), esc(o.titel) + ' · ' + t('c.s.versendet') + ' ' + esc(o.versendetAm) + ' · ' + t('v.nr', esc(o.nr)),
        '<p class="still">' + esc(o.name || o.kaeufer) + (o.ort ? ', ' + esc(o.ort) : '') + ' · CHF ' + esc(o.total) + ' · ' + t('c.p.sendung') + ' ' + (o.sendung ? '<span class="mono">' + esc(o.sendung) + '</span>' : t('c.p.sendung.keine')) + '</p>'
        + (o.bezahlt && !o.ricardoGemeldet ? jetzt(t('c.p.melden'), '<p class="still">' + t('c.p.melden.r') + '</p><div class="knoepfe">' + lnkR(o.link, t('g.verkauf.oeffnen'), 'm' + o.nr) + knR(t('c.p.gemeldet'), 'cpVerkauf', 'm' + o.nr, o.nr, 'ricardoBezahlt') + '</div>') : '')
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
    if (art === 'aufgabe') {
      var au3 = { angebote: r.typ === 'angebote' ? [o] : [], fragen: r.typ === 'fragen' ? [o] : [], bewertungen: r.typ === 'bewertungen' ? [o] : [], zahlung: [] };
      pOeffne(esc(o.pgId || o.artikel || '–'), esc(o.titel || '') + ' · ' + t('c.s.aufgabe') + (o.eingang ? ' · ' + esc(o.eingang) : ''), aufgabenHtml(au3) + (o.pgId ? adminBlock(o.pgId) : ''));
      return;
    }
    if (art === 'fremd') {
      var v = o.nr !== undefined;
      pOeffne(esc(v ? (o.pgId || o.nr) : o.id), esc(v ? o.titel : o.name) + ' · ' + esc(st(o.status)) + (v ? ' · ' + t('v.nr', esc(o.nr)) : ''),
        (v ? '<p class="still">' + esc(o.kaeufer) + ' · CHF ' + esc(o.total) + ' · ' + esc(o.am) + '</p>' : '<p class="still">' + esc(o.am) + '</p>') + block(t('c.p.admin'), '<button' + akt('cpAdmin', v ? (o.pgId || o.nr) : o.id) + '>' + esc(t('c.p.admin.such')) + '</button>'));
    }
  }
  function zeichneVerkaufPanel(o, art) {
    var au = cpAufgaben(o.pgId, o.artikel, o.nr), st = cpStorno(o.nr), gepackt = o.status !== 'Zu packen', h = '';
    var porto = (Number(o.total) - Number(o.preis || o.total)).toFixed(2);
    var kopf = '<p class="still">' + esc(o.name || o.kaeufer) + (o.ort ? ', ' + esc(o.ort) : '') + (o.kaeufer && o.kaeufer !== o.name ? ' · ' + esc(o.kaeufer) : '') + ' · ' + esc(o.klasse || '') + ' · ' + esc(o.am) + '<br>' + t('c.p.total', esc(o.preis || o.total), esc(porto), '<strong>' + esc(o.total) + '</strong>') + '</p>';
    /* Adresse: aus dem Bericht oder von Hand, immer überschreibbar (Jonas 30.10.2026) */
    var adresse = (o.ohneAdresse ? '<div class="meldung warn">' + t('g.p.adr.fehlt') + '</div>' : '<p><strong>' + esc(o.name) + '</strong><br>' + esc(o.ort || '') + '</p><p class="still">' + t('c.p.adresse.da') + '</p>')
      + hilfe(t('g.p.adr.hand.r')) + '<div class="knoepfe">' + lnk(o.link, t('g.verkauf.oeffnen')) + '</div>'
      + '<label class="klein" for="adr-' + esc(o.nr) + '">' + t('c.p.adresse.hand') + '</label><textarea id="adr-' + esc(o.nr) + '" rows="4" autocomplete="off" placeholder="Vorname Nachname&#10;Strasse 1&#10;3000 Bern"></textarea>'
      + '<div class="knoepfe"><button class="haupt-knopf"' + akt('adresseHand', o.nr) + '>' + t('c.p.adresse.k') + '</button></div>';
    var packen = '<p class="still">' + t('c.p.packen.p', '<strong>' + esc(o.lagerort || '') + '</strong>', esc(cpRegal('unpaid'))) + rtOrtHtml(o) + '</p>'
      + (o.bild ? '<img class="f-bild" src="' + esc(o.bild) + '" alt="">' : '')
      + (o.sendung ? '<p class="ok">✓ ' + t(ETIKETTEN[o.nr] ? 'g.p.etikette.da' : 'g.p.sendung.da', '<span class="mono">' + esc(o.sendung) + '</span>') + '</p>' : '')
      + '<div class="knoepfe">' + (CP.postBereit && !o.ohneAdresse ? etikettKnoepfe(o) : (!CP.postBereit ? '<span class="klein">' + t('g.p.post.fehlt') + '</span>' : '')) + '</div>' + sendungFeld(o)
      + '<div class="knoepfe" style="margin-top:10px">' + kn(t('c.p.gepackt', cpRegal('unpaid')), 'cpVerkauf', true, o.nr, 'gepackt') + '</div>';
    var pruefen = '<p>' + etk(t('a.meldet', esc(o.meldet)), 'orange') + '</p><p class="still">' + t('c.p.pruefen.text', esc(o.meldet)) + '</p><div class="knoepfe">' + kn(t('c.bank'), 'cpBank', true) + kn(t('c.p.bezahlt.hand'), 'cpVerkauf', false, o.nr, 'bezahlt') + '</div>';
    var zahlung = (o.bezahlt ? '<p class="ok">✓ ' + t('c.p.zahlung.da', esc(o.bezahlt)) + '</p>' : '<p class="still">' + t('c.p.zahlung.offen', tage(cpOffenTage(o.nr))) + '</p>' + (o.meldet ? '<p>' + etk(t('a.meldet', esc(o.meldet)), 'orange') + '</p>' : ''))
      + (au.zahlung.length ? '<label for="cpz">' + t('c.p.erinnern') + ' · ' + t('a.tage', au.zahlung[0].tage) + '</label>' + textfeld('cpz', au.zahlung[0].entwurf, 6) + '<div class="knoepfe"><button class="haupt-knopf"' + akt('kopierOeffne', 'cpz', au.zahlung[0].link) + '>' + t('c.p.kopieren.oeffnen') + '</button>' + kn(t('c.p.erinnert'), 'cpErinnert', false, o.nr) + '</div>' : '')
      + (o.bezahlt ? '' : '<div class="knoepfe" style="margin-top:10px">' + kn(t('c.p.bezahlt.hand'), 'cpVerkauf', false, o.nr, 'bezahlt') + '</div>')
      + (o.bezahlt ? '' : st ? '<p style="margin-top:12px"><strong>' + t('c.p.storno') + '</strong> ' + etk(t('a.tage', st.tage), 'rot') + '</p><p class="still">' + t('c.p.storno.r') + '</p><div class="knoepfe">' + lnkR(st.storno, t('g.storno.k'), 's' + o.nr) + knR(t('g.storno.ok'), 'cpStorno', 's' + o.nr, o.nr) + '</div>'
        : '<details class="cp-hilfe"><summary>' + t('c.p.storno') + ' <span class="klein">' + t('c.p.storno.ab', CP.stornoTage) + '</span></summary><p class="still">' + t('c.p.storno.r') + '</p><div class="knoepfe">' + lnkR(o.link, t('g.verkauf.oeffnen'), 's' + o.nr) + knR(t('g.storno.ok'), 'cpStorno', 's' + o.nr, o.nr) + '</div></details>');
    var melden = o.ricardoGemeldet ? '<p class="ok">✓ ' + t('c.p.gemeldet.am', esc(o.ricardoGemeldet)) + '</p>' : '<p class="still">' + t('c.p.melden.r') + '</p><div class="knoepfe">' + lnkR(o.link, t('g.verkauf.oeffnen'), 'm' + o.nr) + knR(t('c.p.gemeldet'), 'cpVerkauf', 'm' + o.nr, o.nr, 'ricardoBezahlt') + '</div>';
    var versenden = '<p class="still">' + t('c.p.versenden.r', esc(cpRegal('unpaid'))) + '</p><p>' + t('c.p.sendung') + ': ' + (o.sendung ? '<strong class="mono">' + esc(o.sendung) + '</strong>' : t('c.p.sendung.keine')) + '</p>'
      + '<div class="knoepfe"><button class="haupt-knopf"' + akt('sendungR', o.sendung || '', o.link + '|v' + o.nr) + '>' + t(o.sendung ? 'g.v.bestaetigen.k' : 'g.verkauf.oeffnen') + '</button>' + knR(t('c.p.versendet'), 'cpVerkauf', 'v' + o.nr, o.nr, 'versendet') + '</div>';
    if (art === 'verkauft') {
      var zahlungJetzt = false;
      if (o.ohneAdresse) h += jetzt(t('c.p.adresse'), adresse); else if (!gepackt) h += jetzt(t('c.p.packen'), packen);
      else if (o.meldet) h += jetzt(t('c.p.pruefen'), pruefen);
      else if (st) { h += jetzt(t('c.p.storno'), zahlung); zahlungJetzt = true; } else if (au.zahlung.length) { h += jetzt(t('c.p.erinnern'), zahlung); zahlungJetzt = true; }
      h += aufgabenHtml(au);
      if (!o.ohneAdresse) h += block(t('c.p.adresse'), adresse, true);
      if (gepackt || o.ohneAdresse) h += block(t('c.p.packen'), gepackt ? '<p class="ok">✓ ' + t('c.p.gepackt.am') + '</p>' + (o.sendung ? '<p class="mono">' + esc(o.sendung) + '</p>' : '') + sendungFeld(o) : packen, true);
      if (!zahlungJetzt) h += block(t('c.p.zahlung'), (o.meldet && !gepackt ? pruefen : '') + zahlung, true);
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
      + '<label class="klein" for="cprb0">' + esc(t('c.p.rt.betrag')) + '</label><div class="reihe">CHF <input type="text" id="cprb0" value="' + esc(o.total || '') + '" inputmode="decimal" style="width:120px;height:40px;font-size:15px"></div>'
      + '<label class="klein" for="cpra">' + esc(t('c.p.rt.adresse')) + '</label><input type="text" id="cpra" value="' + esc(o.adresse || '') + '" placeholder="' + esc(t('rt.adresse')) + '" style="height:40px;font-size:15px;margin:2px 0 0"><input type="text" id="cprn" placeholder="' + esc(t('rt.notiz')) + '" style="height:40px;font-size:15px;margin:6px 0">'
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
      block(t('c.p.bank.s1'), '<div class="reihe" style="margin-top:6px"><input type="file" id="f-bank" accept=".xlsx,.xls,.csv,text/csv"> <button class="haupt-knopf" onclick="bankLesen()">' + t('v.einlesen') + '</button></div>' + hilfe(t('c.p.bank.text')))
      + '<div id="f-bank-erg">' + cpBankHtml() + '</div>');
  }
  /* Ergebnis in drei klar beschrifteten Kästen (Feedback 31.10., Nr. 8) */
  function cpBankHtml() {
    if (!BANK) return '';
    var r = BANK, h = '<p class="still">' + t('c.bank.gelesen', r.gutschriften, r.schonErfasst, r.offen) + '</p>';
    var zeile = function (o, i, an) {
      return '<label class="haken cp-bankzeile" style="margin:6px 0"><input type="checkbox" class="bank-wahl" data-i="' + i + '" ' + (an ? 'checked' : '') + '> <span><strong>' + esc(o.titel) + '</strong> <span class="still">' + (o.pgId ? esc(o.pgId) + ' · ' : '') + t('v.nr', esc(o.nr)) + ' · ' + esc(o.name || o.kaeufer) + ' · CHF ' + esc(o.total) + '</span><br><span class="klein">'
        + esc(tagCh(o.bank.datum, true)) + ' · CHF ' + esc(o.bank.betrag) + ' · ' + esc(o.grund) + '<br>' + esc(o.bank.text) + '</span></span></label>';
    };
    BANK.alle = r.sicher.concat(r.unsicher);
    h += block(t('c.bank.sicher') + ' · ' + r.sicher.length, '<p class="still">' + t('c.bank.sicher.text') + '</p>' + (r.sicher.length ? r.sicher.map(function (o, i) { return zeile(o, i, true); }).join('') : '<p class="still">–</p>'));
    h += block(t('c.bank.unsicher') + ' · ' + r.unsicher.length, '<p class="still">' + t('c.bank.unsicher.text') + '</p>' + (r.unsicher.length ? r.unsicher.map(function (o, i) { return zeile(o, r.sicher.length + i, false); }).join('') : '<p class="still">–</p>'), !r.unsicher.length);
    h += block(t('c.bank.ohne') + ' · ' + (r.ohneTreffer || []).length, '<p class="still">' + t('c.bank.ohne.text') + '</p>' + ((r.ohneTreffer || []).length ? '<ul>' + r.ohneTreffer.map(function (o) { return '<li>' + esc(tagCh(o.datum, true)) + ' · CHF ' + esc(o.betrag) + ' · ' + esc(o.text) + (o.auftrag ? ' · ' + esc(o.auftrag) : '') + '</li>'; }).join('') + '</ul>' : '<p class="still">–</p>'), true);
    if (!BANK.alle.length) return block(t('c.p.bank.s2'), h + '<p class="still">' + t('f.t1.keine') + '</p>');
    return block(t('c.p.bank.s2'), h) + jetzt(t('c.p.bank.s3'), '<button class="haupt-knopf" onclick="cpBankErfassen()">' + t('c.bank.erfassen', '<span id="cp-bank-n">' + r.sicher.length + '</span>') + '</button>');
  }
  function cpBankZaehlen() { var n = Array.prototype.filter.call(document.querySelectorAll('.bank-wahl'), function (x) { return x.checked; }).length; if ($('cp-bank-n')) $('cp-bank-n').textContent = n; }
  document.addEventListener('change', function (e) { if (e.target && e.target.classList && e.target.classList.contains('bank-wahl')) cpBankZaehlen(); });
  function cpBankErfassen() {
    var wahl = Array.prototype.filter.call(document.querySelectorAll('.bank-wahl'), function (x) { return x.checked; }).map(function (x) { var o = BANK.alle[Number(x.getAttribute('data-i'))]; return { nr: o.nr, bank: o.bank }; });
    if (!wahl.length) { melde(t('f.t1.keine'), 'stop'); return; }
    ruf('bankBestaetigen', [wahl], function (f) { BANK = null; melde(t('c.bank.fertig', wahl.length), 'ok'); cpZu(); CPS = 'bezahlt'; CPT = null; CPQ = null; zeichneCockpit(); cpNach(); });
  }
  function cpBericht() {
    CPP = { key: 'bericht', art: 'bericht' };
    pOeffne(esc(t('c.p.bericht.titel')), t('c.p.bericht.letzter', esc(CP.letzterImport || t('u.keiner'))),
      block(t('c.p.bericht.s1'), '<p class="still">' + t('c.p.bericht.text') + '</p><div class="knoepfe">' + lnk(CP.links.verkauft, t('v.import.link')) + '</div>')
      + block(t('c.p.bericht.s2'), '<div class="reihe" style="margin-top:6px"><input type="file" id="f-bericht" accept=".csv,text/csv"> <button class="haupt-knopf" onclick="importieren(\'f-bericht\', function () { cpNach(); })">' + t('v.einlesen') + '</button></div><div id="f-bericht-meldung"></div>')
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
    cpEntscheid: function (id, e) { ruf('entscheidUnverkauft', [id, e], function () { melde(t('c.gespeichert'), 'ok'); if (e === 'Neu listen') { CPM = 'cockpit'; CPS = 'bereit'; CPT = null; CPQ = null; CPP = { key: 'b' + id, art: 'bereit' }; $('cp-veil').hidden = true; CPLADEN = false; ladeCockpit(); return; } melde(t('g.l.wohin.' + e), 'ok'); cpZu(); cpNach(); }); },
    cpGelistet: function (id) { var f = $('wl-' + id), link = f ? f.value.trim() : ''; if (!link) { melde(t('s4.link'), 'stop'); if (f) f.focus(); return; } var los = function (ok) { ruf('markiereGelistet', ok ? [id, link, '', true] : [id, link, ''], function () { melde(t('s4.fertig', id), 'ok'); cpZu(); CPS = 'online'; cpNach(); }, function (m) { return bestaetigen(m, function () { los(true); }); }); }; los(false); },
    cpVerkauf: function (nr, aktion) {
      var o = (CP.verkauft || []).filter(function (x) { return x.nr === nr; })[0] || {}, los = function () { ruf('setzeVerkauf', [nr, aktion], function (v) { VK = v; melde(t('c.gespeichert'), 'ok'); if (aktion === 'versendet' || aktion === 'bezahlt') cpZu(); cpNach(); }); };
      if (aktion === 'gepackt' || aktion === 'ricardoBezahlt') los(); else frage(t(aktion === 'versendet' ? 'v.f.versendet' : 'v.f.bezahlt', o.pgId || o.titel || nr, o.total || ''), los);
    },
    cpErledigt: function (id) { ruf('aufgabeErledigt', [id], function (a) { aufgabenStill(a); CP.aufgaben = a; zeichneCockpit(); }); },
    cpErinnert: function (nr) { ruf('erinnerungErledigt', [nr], function (a) { aufgabenStill(a); CP.aufgaben = a; zeichneCockpit(); }); },
    cpStorno: function (nr) { frage(t('f.t6.frage', nr), function () { ruf('verkaufStornieren', [nr], function () { melde(t('c.gespeichert'), 'ok'); cpZu(); cpNach(); }); }); },
    cpRetoureNeu: function (nr) {
      var grund = $('cprg').value, iban = $('cpri').value, adr = $('cpra').value, notiz = $('cprn').value, betrag = $('cprb0').value;
      if (!(Number(String(betrag).replace(',', '.').replace(/[^\d.]/g, '')) > 0)) { melde(t('c.p.rt.betrag.fehlt'), 'stop'); $('cprb0').focus(); return; }
      if (!iban.trim()) { melde(t('rt.iban.fehlt'), 'stop'); $('cpri').focus(); return; }
      if (!adr.trim()) { melde(t('rt.adresse.fehlt'), 'stop'); $('cpra').focus(); return; }
      var o = (CP.versendet || []).filter(function (x) { return x.nr === nr; })[0] || {};
      var los = function (ok) {
        ruf('retoureEroeffnen', ok ? [nr, grund, notiz, iban, adr, betrag, true] : [nr, grund, notiz, iban, adr, betrag], function (r) { RT = r; if (r.mail) melde(r.mail.ok ? t('rt.mail.ok', r.mail.an) : t('rt.mail.fehler', r.mail.an || '–'), r.mail.ok ? 'ok' : 'stop'); cpZu(); CPM = 'cockpit'; CPS = 'retouren'; cpNach(); },
          function (m) { return bestaetigen(m, function () { los(true); }); });
      };
      frage(t('rt.f.eroeffnen', o.pgId || o.titel || nr, gr(grund)) + ' CHF ' + betrag, function () { los(false); });
    },
    cpRtSchritt: function (nr, schritt) {
      var wert = schritt === 'rueckzahlung' ? $('cprb').value : '', o = (CP.retouren || []).filter(function (x) { return x.nr === nr; })[0] || {};
      var los = function (ok) { ruf('retoureSchritt', ok ? [nr, schritt, wert, true] : [nr, schritt, wert], function (r) { RT = r; melde(t('c.gespeichert'), 'ok'); cpNach(); }, function (m) { return bestaetigen(m, function () { los(true); }); }); };
      if (schritt === 'rueckzahlung') frage(t('rt.f.zahlung', wert, o.name || o.kaeufer), function () { los(false); }); else los(false);
    },
    cpRtEntscheid: function (nr, e) { var los = function (ok) { ruf('retoureSchritt', ok ? [nr, 'entscheid', e, true] : [nr, 'entscheid', e], function (r) { RT = r; melde(t('c.gespeichert'), 'ok'); cpNach(); }, function (m) { return bestaetigen(m, function () { los(true); }); }); }; los(false); },
    cpAdmin: function (id) { cpZu(); zeige('admin'); admTab('storno'); $('ad-q').value = id; adminSuchen(); },
    cpBank: function () { cpBank(); }, cpBericht: function () { cpBericht(); },
    linkR: function (url, key) { oeffneLink(url); RIC[key] = 1; if (CPP) { var r = cpFinde(CPP.key); if (r) zeichnePanel(r); } },
    kopierOeffneR: function (a, url) { var p = a.split('|'); kopiereUndOeffne(p[0], url); RIC[p[1]] = 1; if (CPP) { var r = cpFinde(CPP.key); if (r) zeichnePanel(r); } },
    sendungR: function (sendung, b) { var p = b.split('|'); if (sendung) kopiereText(sendung); oeffneLink(p[0]); RIC[p[1]] = 1; if (CPP) { var r = cpFinde(CPP.key); if (r) zeichnePanel(r); } }
  });
  $('cp-q').addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); cpSuchen(); } });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && CPP) cpZu(); });
  function zeigeZahlen() { ADM_GRUPPE = 'reporting'; zeige('admin'); admTab('kennzahlen'); }
  function zeigeEinst() { ADM_GRUPPE = 'einst'; zeige('admin'); admTab('einstellungen'); }
