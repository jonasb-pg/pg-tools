import os; os.chdir(os.path.dirname(os.path.abspath(__file__)))  # Pfade relativ zu tests/
from playwright.sync_api import sync_playwright
html=open('../apps/analyse/Index.html',encoding='utf8').read()
stub="<script>window.CALLS=[];window.google={script:{run:(function(){var ok;var o={withSuccessHandler:function(f){ok=f;return o},withFailureHandler:function(){return o},api:function(l,n,a){CALLS.push([n,a]);if(n==='feedback'){var f=ok;setTimeout(function(){f(true)},20);}}};return o;})()}};</script>"
html=html.replace('<head>','<head>'+stub,1)
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page(viewport={'width':1200,'height':700})
    pg.route('http://app.test/', lambda r: r.fulfill(body=html, content_type='text/html; charset=utf-8'))
    pg.goto('http://app.test/'); pg.wait_for_timeout(400)
    pg.evaluate("document.getElementById('start').hidden=true; K='JB'; texte(); AN={d:{produkt:{id:'PG-14742'},ablauf:['ident','funktion'],handbuch:null},i:1,s:{}};")
    pg.click('.fb-auf'); pg.fill('#fb-text','Handbuch fehlt beim Razer'); pg.screenshot(path='fb.png')
    pg.click('button[data-a=fbSenden]'); pg.wait_for_timeout(200)
    print(pg.evaluate('JSON.stringify(CALLS)'), pg.evaluate("document.getElementById('fb').hidden"), pg.inner_text('#toast'))
    b.close()
