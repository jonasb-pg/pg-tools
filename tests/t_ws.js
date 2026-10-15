// Werkstatt: kontoSpeichern / kontenAbgleich_ / mittelSpeichern mit einem Sheet im Speicher
const vm=require('vm'),fs=require('fs');const P=new Proxy(function(){},{get:(t,k)=>k===Symbol.toPrimitive?()=>'':P,apply:()=>P,construct:()=>P});
const c={console,Session:P,PropertiesService:P,Utilities:P,SpreadsheetApp:P,DriveApp:P,ScriptApp:P,HtmlService:P,LockService:P,UrlFetchApp:P,CacheService:P,ContentService:P};
vm.createContext(c);vm.runInContext(fs.readFileSync(__dirname+'/../src/Code.gs','utf8'),c);
vm.runInContext(`
var DB={Testkonten:[], Testmittel:[{Testmittel:'Steckdose',Vorhanden:''},{Testmittel:'Testkonto Google',Vorhanden:'Nein'},{Testmittel:'Testkonto Apple-ID',Vorhanden:'Nein'}]};
lies_=function(n){return {kopf:[],z:DB[n].map(function(r,i){return Object.assign({_r:i+2},r);})}};
schreib_=function(n,o){o.forEach(function(x){DB[n].push(Object.assign({},x));});};
setz_=function(n,f,w){Object.keys(w).forEach(function(r){DB[n][Number(r)-2][f]=w[r];});};
gesperrt_=function(f){return f();}; blatt_=function(){}; log_=function(){}; zeit_=function(){return '15.10.2026 13:00:00'};
var A=kontoSpeichern({dienst:'Google',login:'pg.test@gmail.com',passwort:'=geheim',geraet:'Foto-Handy',aktiv:true},'jb');
var M1=JSON.stringify(DB.Testmittel);
var B=kontoSpeichern({r:2,login_alt:'pg.test@gmail.com',dienst:'Google',login:'pg.test@gmail.com',passwort:'neu',aktiv:false},'JB');
var M2=JSON.stringify(DB.Testmittel);
var F; try{kontoSpeichern({r:2,login_alt:'falsch',dienst:'Google',login:'x'},'JB')}catch(e){F=e.message}
mittelSpeichern({name:'  steckdose ',vorhanden:'Ja'},'JB'); mittelSpeichern({name:'Lötkolben',vorhanden:'Ja'},'JB');
`,c);
console.log('Konto:',JSON.stringify(c.DB.Testkonten));
console.log('Mittel nach neu (Google Ja, Amazon neu Nein):',c.M1);
console.log('Mittel nach inaktiv (Google Nein):',c.M2);
console.log('Schutz:',c.F);
console.log('Mittel Ende:',JSON.stringify(c.DB.Testmittel));
