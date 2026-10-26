/* Berkas bersama untuk login.html dan panduan.html */
const $=id=>document.getElementById(id);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const fmt=n=>Number(n).toLocaleString('id-ID');
async function H(s){try{const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode('rr:'+s));return[...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('')}catch(e){return'p:'+btoa(unescape(encodeURIComponent(s)))}}
const normPh=s=>{let d=String(s||'').replace(/\D/g,'');if(d.startsWith('62'))d='0'+d.slice(2);return d};
const okEm=s=>/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s);
const uname=p=>(p.user||p.name).toLowerCase();
const DEF={title:'Royal Roulette',sub:'Pasang chip, putar roda, dan lihat siapa yang beruntung.',acc:'#f5c542',bg1:'#3b0a1e',bg2:'#0b0612',felt:'#0a5c36',pn:24,pc:1,pd:2,reg:true,font:'klasik',rad:18,wsz:340,lay:'side',pat:'1',sec:30,rd:3,ms:6000,chips:[10,50,100,500],start:1000,foot:'Permainan hiburan dengan chip virtual.',appr:false,invite:'',maxp:0,minb:0,maxb:0,maint:false,maintMsg:'Permainan sedang ditutup sementara untuk pemeliharaan.',lgTitle:'Akun pemain',lgIntro:'',lgIn:'Masuk',lgUp:'Daftar',lgUser:'Username',lgPass:'Password',lgName:'Nama lengkap',lgPhone:'Nomor telepon',lgEmail:'Email',lgContactOn:true,lgContact:'Kontak atau HP (opsional)',lgBtnIn:'Masuk',lgBtnUp:'Buat akun',lgTerms:'',lgHelp:'Lupa password? Minta admin untuk membuatkan yang baru.',lgWelcome:'Akun dibuat. Selamat bermain!',lgSt:'box'};
function fbDB(){
  if(!window.FB_URL||/GANTI/.test(window.FB_URL)){document.body.innerHTML='<p style="padding:24px">Isi <b>config.js</b> dengan URL Realtime Database Firebase Anda, lalu muat ulang halaman.</p>';throw new Error('config')}
  firebase.initializeApp({databaseURL:window.FB_URL});const db=firebase.database();
  const enc=d=>{const o={};Object.keys(d).forEach(k=>o[k]=JSON.stringify(d[k]===undefined?null:d[k]));return o};
  const dec=v=>{if(v==null)return undefined;const o={};Object.keys(v).forEach(k=>{try{o[k]=JSON.parse(v[k])}catch(e){}});return o};
  const sn=(p,d)=>({id:p.split('/').pop(),exists:d!==undefined,data:()=>d});
  const doc=p=>{const r=db.ref('docs/'+p);return{
    async get(){const s=await r.once('value');return sn(p,dec(s.val()))},
    set:d=>r.set(enc(d)),
    async update(d){const t=await r.transaction(c=>c==null?undefined:Object.assign({},c,enc(d)));if(!t.committed)throw new Error('dokumen tidak ada')},
    delete:()=>r.remove(),
    async acquire(o){const t=await db.ref('leases/'+p.replace('/','__')).transaction(c=>{const n=Date.now();return(!c||c.until<n||c.h===o.holder)?{h:o.holder,until:n+(o.ttlMs||4000)}:undefined});return{acquired:t.committed}},
    onSnapshot(cb,err){r.on('value',s=>cb(sn(p,dec(s.val()))),err);return()=>{}}}};
  const col=p=>({doc:id=>doc(p+'/'+id),onSnapshot(cb,err){db.ref('docs/'+p).on('value',s=>{const v=s.val()||{};cb({docs:Object.keys(v).map(id=>sn(p+'/'+id,dec(v[id]))).filter(d=>d.data())})},err);return()=>{}}});
  return{doc,collection:col}}
const FONTS={klasik:["'Bodoni Moda',Georgia,serif","Figtree,system-ui,sans-serif"],neon:["Orbitron,system-ui,sans-serif","Poppins,system-ui,sans-serif"],elegan:["'Playfair Display',Georgia,serif","Poppins,system-ui,sans-serif"]};
function applyTheme(c){const r=document.documentElement.style,f=FONTS[c.font]||FONTS.klasik;['acc','bg1','bg2','felt'].forEach(k=>r.setProperty('--'+k,c[k]));r.setProperty('--fd',f[0]);r.setProperty('--fb',f[1]);r.setProperty('--rad',(+c.rad||18)+'px');
  document.body.classList.remove('pat0','pat1','pat2');document.body.classList.add('pat'+c.pat);document.querySelectorAll('[data-t]').forEach(e=>{e.textContent=c[e.dataset.t]||''});document.title=(document.body.dataset.page||'')+' | '+c.title}
function getSession(){try{return sessionStorage.getItem('rrme')||localStorage.getItem('rrme')||null}catch(e){return null}}
