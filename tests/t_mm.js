const vm=require('vm'),fs=require('fs');const P=new Proxy(function(){},{get:(t,k)=>k===Symbol.toPrimitive?()=>'':P,apply:()=>P,construct:()=>P});
const c={console,Session:P,PropertiesService:P,Utilities:P,SpreadsheetApp:P,DriveApp:P,ScriptApp:P,HtmlService:P,LockService:P,UrlFetchApp:P,CacheService:P,ContentService:P};
vm.createContext(c);vm.runInContext(fs.readFileSync(__dirname+'/../src/Code.gs','utf8'),c);
c.ANTWORT = '```json\n{"treffer":[{"nr":3,"urteil":"ähnlich","hinweis":"x"},{"nr":2,"urteil":"passt","hinweis":"Bosch Akkusauger"},{"nr":7,"urteil":"passt"}]}\n```';
vm.runInContext(`
einst_=function(){return {}}; produkt_=function(){return {'PG-ID':'PG-1',Bezeichnung:'Bosch Unlimited 7',Kategorie:'Haushalt',Link:''}}; log_=function(){};
mmAuftraege_=function(){return {liste:[{zeile:4,gesucht:'Canon RF',mehr:'',limit:1000,profil:''},{zeile:8,gesucht:'Akkustaubsauger Bosch',mehr:'',limit:'100',profil:'Muss: Bosch'},{zeile:9,gesucht:'Staubsauger',mehr:'egal',limit:50,profil:''}]}};
var SEEN; claude_=function(b){SEEN=b.messages[0].content;return {content:[{type:'text',text:ANTWORT}]}};
var R=matchmaker('PG-1',{marke:'Bosch',modell:'BCS71'},[]); var R2=matchmaker('PG-1',{},[mmSchluessel_({gesucht:'Akkustaubsauger Bosch',mehr:''})]);
`,c);
console.log(JSON.stringify(c.R));console.log(c.SEEN);console.log('R2 anzahl',c.R2.anzahl, JSON.stringify(c.R2.passt));
