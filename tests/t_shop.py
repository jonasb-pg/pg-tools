from playwright.sync_api import sync_playwright
html=open('../src/Index.html',encoding='utf8').read()
stub="<script>window.google={script:{run:(function(){var o={withSuccessHandler:function(){return o},withFailureHandler:function(){return o},api:function(){}};return o;})()}};</script>"
html=html.replace('<head>','<head>'+stub,1)
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page(viewport={'width':1200,'height':700})
    pg.route('http://app.test/', lambda r: r.fulfill(body=html, content_type='text/html; charset=utf-8'))
    pg.goto('http://app.test/'); pg.wait_for_timeout(400)
    pg.evaluate("""document.getElementById('t-meldung').closest('section').hidden=false; alle('main > section',function(s){s.hidden=s.id!=='s-teile'}); document.getElementById('start').hidden=true;
    document.getElementById('t-meldung').innerHTML = box(t('teil.gefunden',1),'ok') + teilShops({suchbegriff:{text:'974815-01',art:'Teilenummer von Dyson',quelle:'https://shop.dyson.ch/x'},shops:[{shop:'Galaxus',link:'https://galaxus.ch/x',info:'Unter CHF 50 kostet der Versand CHF 4.90: Bestellungen sammeln.'},{shop:'ASWO',link:'https://aswoshop.aswo.com/app/?shop=513',info:'Nur mit Login, das Tool kann hier nicht suchen. Versand- und Verpackungskosten pro Bestellung: Bestellungen sammeln.',login:true}]});
    document.getElementById('t-meldung').scrollIntoView();""")
    pg.focus('.infoknopf >> nth=0'); pg.wait_for_timeout(200); print(pg.evaluate("getComputedStyle(document.querySelector('.infoknopf .tipp')).display"), pg.evaluate("JSON.stringify(document.querySelector('.infoknopf .tipp').getBoundingClientRect())"))
    pg.screenshot(path='shop.png')
    b.close()
