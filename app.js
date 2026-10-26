const $=id=>document.getElementById(id);
const ORDER=[0,16,11,5,24,21,6,9,17,14,2,3,22,19,10,7,13,23,4,12,15,1,20,18,8];
const REDS=new Set([1,3,5,7,9,12,14,16,18,19,21,23]);
const col=n=>n===0?'#0d7a3f':REDS.has(n)?'#c0182b':'#161616';
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const fmt=n=>Number(n).toLocaleString('id-ID');
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const HID=uid();
const isAdm=()=>!!window.ADMIN_PAGE||(window.HASH_ADMIN!==false&&location.hash==='#admin');
function toast(t){const e=$('toast');e.textContent=t;e.classList.add('s');clearTimeout(toast.t);toast.t=setTimeout(()=>e.classList.remove('s'),2600)}
async function H(s){try{const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode('rr:'+s));return[...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('')}catch(e){return'p:'+btoa(unescape(encodeURIComponent(s)))}}

/* ---------- Penyimpanan: db bersama, atau lokal jika tidak tersedia ---------- */
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

const DEF={title:'Royal Roulette',sub:'Pasang chip, putar roda, dan lihat siapa yang beruntung.',acc:'#f5c542',bg1:'#3b0a1e',bg2:'#0b0612',felt:'#0a5c36',pn:24,pc:1,pd:2,reg:true,font:'klasik',rad:18,wsz:340,lay:'side',pat:'1',sec:30,rd:3,ms:6000,chips:[10,50,100,500],start:1000,foot:'Permainan hiburan dengan chip virtual.',appr:false,invite:'',maxp:0,minb:0,maxb:0,maint:false,maintMsg:'Permainan sedang ditutup sementara untuk pemeliharaan.',lgTitle:'Akun pemain',lgIntro:'',lgIn:'Masuk',lgUp:'Daftar',lgUser:'Username',lgPass:'Password',lgName:'Nama lengkap',lgPhone:'Nomor telepon',lgEmail:'Email',lgContactOn:true,lgContact:'Kontak atau HP (opsional)',lgBtnIn:'Masuk',lgBtnUp:'Buat akun',lgTerms:'',lgHelp:'Lupa password? Minta admin untuk membuatkan yang baru.',lgWelcome:'Akun dibuat. Selamat bermain!',lgSt:'box'};
let D,SYNC=false,CF={...DEF},APW='',PL=[],RD={id:0,n:0,h:[],ms:6000};
let me=null,act=null,chip=10,spinning=false,adm=false,tab=(window.ADMIN_TAB===undefined?5:window.ADMIN_TAB),rot=0,mode='in',lastPw=null,delId=null,rsArm=false,left=30,phase='',rvId=0,W3on=false,closed=false,retry=0,seen=-1,cfgOk=false,plOk=false,akey='',creating=false;
const P=id=>PL.find(p=>p.id===id);
const SEC=()=>Math.max(5,+CF.sec||30);
const Q={};
function W(path,data,full){const r=D.doc(path);Q[path]=(Q[path]||Promise.resolve()).then(()=>full?r.set(data):r.update(data)).catch(e=>{console.error(e);toast('Gagal menyimpan. Coba lagi.')});return Q[path]}
function wp(p,patch){Object.assign(p,patch);return W('players/'+p.id,patch)}
const wc=()=>W('app/cfg',{cfg:CF,pw:APW},true);

/* ---------- Tampilan ---------- */
const FONTS={klasik:["'Bodoni Moda',Georgia,serif","Figtree,system-ui,sans-serif"],neon:["Orbitron,system-ui,sans-serif","Poppins,system-ui,sans-serif"],elegan:["'Playfair Display',Georgia,serif","Poppins,system-ui,sans-serif"]};
function theme(){const r=document.documentElement.style,c=CF,f=FONTS[c.font]||FONTS.klasik;
  ['acc','bg1','bg2','felt'].forEach(k=>r.setProperty('--'+k,c[k]));r.setProperty('--fd',f[0]);r.setProperty('--fb',f[1]);r.setProperty('--rad',(+c.rad||0)+'px');r.setProperty('--wsz',Math.max(220,+c.wsz||340)+'px');
  document.body.className='pat'+c.pat+(isAdm()?' isadm admpage':'');const nb=$('notice');const nt=c.maint?(c.maintMsg||'Permainan sedang ditutup sementara.'):c.notice;nb.hidden=!nt;nb.textContent=nt||'';document.querySelector('main').className=c.lay;
  $('ttl').textContent=c.title;$('sub').textContent=c.sub;$('foot').textContent=c.foot+(SYNC?' Sinkron langsung antar pemain.':' Mode satu perangkat.');document.title=c.title;drawWheel()}
function drawWheel(){if(W3on)W3.setAccent(CF.acc);const x=$('wheel').getContext('2d'),C=180,seg=2*Math.PI/25;x.clearRect(0,0,360,360);
  ORDER.forEach((n,i)=>{const a=-Math.PI/2+i*seg;x.beginPath();x.moveTo(C,C);x.arc(C,C,172,a,a+seg);x.closePath();x.fillStyle=col(n);x.fill();x.strokeStyle=CF.acc;x.lineWidth=1;x.stroke();
    x.save();x.translate(C,C);x.rotate(a+seg/2);x.fillStyle='#fff';x.font='bold 15px Figtree,sans-serif';x.textAlign='center';x.fillText(n,138,5);x.restore()});
  x.beginPath();x.arc(C,C,108,0,7);x.fillStyle='#1c1220';x.fill();x.lineWidth=5;x.strokeStyle=CF.acc;x.stroke();
  const g=x.createRadialGradient(C-8,C-8,2,C,C,28);g.addColorStop(0,'#fff');g.addColorStop(.4,CF.acc);g.addColorStop(1,'#000');x.beginPath();x.arc(C,C,26,0,7);x.fillStyle=g;x.fill();
  x.beginPath();x.arc(C,C,172,0,7);x.lineWidth=4;x.strokeStyle='#ffffff55';x.stroke()}
const resHTML=n=>`<b style="background:${col(n)};box-shadow:0 0 30px ${col(n)}">${n}</b><div class="note">${n===0?'Hijau, nol':(REDS.has(n)?'Merah':'Hitam')+', '+(n%2?'ganjil':'genap')}</div>`;

function balView(){const p=P(act),b=$('bal');
  if(!p){b.className='out';b.innerHTML='<a class="btn" href="login.html">Masuk</a>'+(CF.reg?'<a class="btn gold" href="daftar.html">Daftar</a>':'');return}b.className='';
  const t=(p.bets||[]).reduce((s,x)=>s+x.a,0);
  b.innerHTML=`<span class="bn"><i class="av">${esc((p.name[0]||'?').toUpperCase())}</i>${esc(p.name)}</span><span class="bv">${fmt(p.chips)}<small> chip</small></span>${t?`<span class="bt">Sedang dipasang: ${fmt(t)}</span>`:''}`}
const LGK=['lgName','lgPhone','lgEmail','lgTitle','lgIn','lgUp','lgUser','lgPass','lgContact','lgBtnIn','lgBtnUp','lgHelp','lgIntro','lgTerms','lgContactOn','lgSt'];
const LGS=()=>CF.lgSt==='gold'?'goldb':CF.lgSt==='plain'?'plainb':'';
function acctHTML(up,pv){const R=k=>esc(CF[k]||DEF[k]||''),O=k=>esc(CF[k]||''),d='disabled',I=(id,type,ph,ac,ex)=>`<input type="${type}" ${pv?d:`id="${id}" autocomplete="${ac}" ${ex||''}`} placeholder="${ph}" aria-label="${ph}">`;
  return`<div class="acct ${LGS()}">${CF.lgIntro?`<p class="note" style="width:100%;opacity:.9;margin:0 0 8px">${O('lgIntro')}</p>`:''}<div class="tabs"><button class="${up?'':'on'}" ${pv?d:`onclick="mode='in';akey='';acctView()"`}>${R('lgIn')}</button>${CF.reg?`<button class="${up?'on':''}" ${pv?d:`onclick="mode='up';akey='';acctView()"`}>${R('lgUp')}</button>`:''}</div><div class="fld">${up?I('an','text',R('lgName'),'name','maxlength="40"'):''}${I('au','text',up?R('lgUser'):R('lgUser')+' atau email','username','maxlength="40" autocapitalize="none"')}${up?I('aph','tel',R('lgPhone'),'tel')+I('aem','email',R('lgEmail'),'email'):''}${I('ap','password',R('lgPass'),up?'new-password':'current-password',`onkeydown="if(event.key==='Enter')acctGo()"`)}</div>${up&&CF.lgTerms?`<p class="note" style="width:100%">${O('lgTerms')}</p>`:''}<button class="gold" style="width:100%" ${pv?d:'onclick="acctGo()"'}>${R(up?'lgBtnUp':'lgBtnIn')}</button>${!up?`<div class="lnk"><button class="link" ${pv?d:'onclick="forgotView()"'}>Lupa password?</button></div>`:''}${!up&&CF.lgHelp?`<p class="note">${O('lgHelp')}</p>`:''}</div>`}
function acctView(){const m=P(me),A=$('acct'),k=m?'m'+m.id+m.name+(m.user||'')+CF.lgTitle+CF.lgSt:'o'+mode+CF.reg+LGK.map(x=>CF[x]).join('|');if(k===akey)return;akey=k;if(!CF.reg)mode='in';$('acctTitle').textContent=m?'Profil saya':(CF.lgTitle||DEF.lgTitle);
  if(m){A.innerHTML=`<div class="acct ${LGS()}"><div class="pfs"><i class="av big">${esc((m.name[0]||'?').toUpperCase())}</i><div style="min-width:0;flex:1"><b>${esc(m.name)}</b><small style="display:block;opacity:.7">@${esc(m.user||m.name)}</small></div></div><div class="row" style="width:100%;margin:8px 0 0"><button class="gold" style="flex:1" onclick="profileView()">Profil</button><button onclick="logout()">Keluar</button></div></div>`;return}
  A.innerHTML=`<div class="acct ${LGS()}">${CF.lgIntro?`<p class="note" style="width:100%;opacity:.9;margin:0 0 8px">${esc(CF.lgIntro)}</p>`:''}<p class="note" style="width:100%;opacity:.9;margin:0 0 10px">Masuk atau daftar untuk memasang taruhan dan menyimpan chip Anda.</p><div class="row" style="width:100%;margin:0"><a class="btn gold" href="login.html" style="flex:1">${esc(CF.lgIn||DEF.lgIn)}</a>${CF.reg?`<a class="btn" href="daftar.html" style="flex:1">${esc(CF.lgUp||DEF.lgUp)}</a>`:''}</div><div class="lnk"><a class="link" href="lupa.html">Lupa password?</a></div></div>`}
function renderPlayers(){balView();
  const vis=PL.filter(p=>me?p.id===me:!p.ph);$('plCard').hidden=!!me||!vis.length;
  $('players').innerHTML=vis.length?vis.map(p=>{const b=(p.bets||[]).reduce((s,x)=>s+x.a,0);
    return`<button class="pl ${p.id===act?'on':''}" onclick="pick('${p.id}')"><span class="nm"><i class="av">${esc((p.name[0]||'?').toUpperCase())}</i><span>${p.ph?'🔒 ':''}${esc(p.name)}<small>${b?'Taruhan: '+fmt(b):'Ketuk untuk memilih'}</small></span></span><span class="c">${fmt(p.chips)} chip</span></button>`}).join(''):'<p class="note">Masuk atau daftar akun untuk mulai bermain.</p>';
  $('chipsel').innerHTML=CF.chips.map(v=>`<button class="chipb ${v===chip?'on':''}" onclick="chip=${v};renderPlayers()">${v}</button>`).join('')}
function renderTable(){const mine=(P(act)||{}).bets||[],tot=k=>mine.filter(b=>b.k===k).reduce((s,b)=>s+b.a,0),bd=k=>tot(k)?`<i>${fmt(tot(k))}</i>`:'';
  let h=`<button class="cell z" onclick="bet('n0')">0${bd('n0')}</button>`;
  for(let r=0;r<8;r++)for(let c=1;c<=3;c++){const n=r*3+c;h+=`<button class="cell ${REDS.has(n)?'r':'k'}" onclick="bet('n${n}')">${n}${bd('n'+n)}</button>`}
  $('nums').innerHTML=h;
  const o=[['d1','1–8'],['d2','9–16'],['d3','17–24'],['low','1–12'],['even','Genap'],['red','Merah'],['black','Hitam'],['odd','Ganjil'],['high','13–24']];
  $('outs').innerHTML=o.map(([k,t])=>`<button class="cell" onclick="bet('${k}')">${t}${bd(k)}</button>`).join('')}
function renderHist(){const h=hv(),cl=n=>n===0?'Hijau, nol':(REDS.has(n)?'Merah':'Hitam')+', '+(n%2?'ganjil':'genap');
  $('hist').innerHTML=h.slice(0,30).map(n=>`<span style="background:${col(n)}">${n}</span>`).join('')||'<span class="note" style="width:auto">Belum ada putaran.</span>';
  const r=h.filter(x=>REDS.has(x)).length,z=h.filter(x=>x===0).length;$('hstat').textContent=h.length?`${h.length} putaran terakhir: merah ${r}, hitam ${h.length-r-z}, nol ${z}.`:'';
  $('hrows').innerHTML=h.slice(0,30).map((n,i)=>`<div class="hr"><i style="background:${col(n)}">${n}</i><span>${cl(n)}</span><small>Putaran ${Math.max(0,rvId-i)}</small></div>`).join('');
  $('log').innerHTML=((P(act)||{}).log||[]).map(l=>`<li class="${l.d>=0?'win':'lose'}">${esc(l.t)}</li>`).join('')||'<li class="note">Belum ada riwayat.</li>'}
function cdView(){$('cdt').textContent=!cfgOk?'Menghubungkan…':spinning?(phase==='wait'?'Menunggu hasil…':'Roda berputar…'):closed?'Taruhan ditutup. Menunggu roda…':CF.paused?'Putaran dijeda admin':'Taruhan ditutup dalam '+left+' dtk';$('cdb').style.width=(spinning||closed||!cfgOk?0:100*left/SEC())+'%'}
function render(){chatView();cdView();acctView();renderPlayers();renderTable();renderHist();const p=P(act);const sh=spinning||closed||!!CF.maint;$('rep').disabled=sh||!(p&&p.last&&p.last.length);$('clr').disabled=sh;document.querySelector('.felt').classList.toggle('shut',sh);$('dock').classList.toggle('shut',sh)}

/* ---------- Taruhan ---------- */
function pick(id){if(me&&id!==me)return toast('Keluar dulu untuk ganti akun');act=id;render()}
function wins(k,n){if(k[0]==='n')return +k.slice(1)===n;if(n===0)return false;
  return{red:REDS.has(n),black:!REDS.has(n),even:n%2===0,odd:n%2===1,low:n<=12,high:n>=13,d1:n<=8,d2:n>8&&n<=16,d3:n>16}[k]}
const mult=k=>k[0]==='n'?CF.pn:k[0]==='d'?CF.pd:CF.pc;
function bet(k){if(spinning||closed)return toast('Taruhan ditutup. Tunggu hitungan berikutnya.');settle();const p=P(act);if(!p)return toast('Pilih pemain dulu');if(p.blocked)return toast('Akun diblokir. Hubungi admin.');if(p.pending)return toast('Akun menunggu persetujuan admin.');if(CF.maint)return toast(CF.maintMsg||'Permainan sedang ditutup sementara.');if(CF.minb&&chip<CF.minb)return toast('Taruhan minimal '+fmt(CF.minb)+' chip.');if(CF.maxb&&(((p.bets||[]).find(b=>b.k===k)||{a:0}).a+chip)>CF.maxb)return toast('Batas taruhan per pilihan: '+fmt(CF.maxb)+' chip.');if(p.chips<chip)return toast('Chip '+p.name+' tidak cukup');
  const bs=(p.bets||[]).map(b=>({...b})),e=bs.find(b=>b.k===k);e?e.a+=chip:bs.push({k,a:chip});wp(p,{chips:p.chips-chip,bets:bs,tgt:RD.id+1});render()}
function clearBets(){if(spinning||closed)return toast('Taruhan sudah ditutup.');const p=P(act);if(!p||!(p.bets||[]).length)return;wp(p,{chips:p.chips+p.bets.reduce((s,b)=>s+b.a,0),bets:[],tgt:0});render()}
function repeatBets(){if(spinning||closed)return toast('Taruhan ditutup. Tunggu hitungan berikutnya.');settle();const p=P(act);if(!p)return toast('Pilih pemain dulu');if(p.blocked)return toast('Akun diblokir. Hubungi admin.');if(p.pending)return toast('Akun menunggu persetujuan admin.');if(CF.maint)return toast(CF.maintMsg||'Permainan sedang ditutup sementara.');const L=p.last||[];if(!L.length)return toast('Belum ada taruhan sebelumnya');
  const need=L.reduce((s,b)=>s+b.a,0);if(p.chips<need)return toast('Chip tidak cukup untuk mengulang ('+fmt(need)+' chip)');
  const bs=(p.bets||[]).map(b=>({...b}));L.forEach(m=>{const e=bs.find(b=>b.k===m.k);e?e.a+=m.a:bs.push({k:m.k,a:m.a})});wp(p,{chips:p.chips-need,bets:bs,tgt:RD.id+1});render()}
function settle(){if(spinning)return;const p=P(act);if(!p||!(p.bets||[]).length||!p.tgt||p.tgt>RD.id)return;
  const n=RD.h[RD.id-p.tgt],bs=p.bets;let d=0,g=0;
  if(n===undefined)g=bs.reduce((s,b)=>s+b.a,0);else bs.forEach(b=>{d-=b.a;if(wins(b.k,n)){const x=b.a*(mult(b.k)+1);g+=x;d+=x}});
  const lg=[{d,t:n===undefined?'Taruhan dikembalikan':'Angka '+n+': '+(d>=0?'+':'')+fmt(d)+' chip'}].concat(p.log||[]).slice(0,6);
  wp(p,{chips:p.chips+g,bets:[],tgt:0,last:bs,log:lg,tw:(p.tw||0)+(n===undefined?0:bs.reduce((s,b)=>s+b.a,0)),tn:(p.tn||0)+(n===undefined?0:d),seen:Date.now()})}

/* ---------- Putaran sinkron ---------- */
const rdMs=()=>Math.min(30,Math.max(0,+CF.rd||0))*1000;
const hv=()=>RD.h.slice(Math.max(0,RD.id-rvId));
function place(n){if(n===undefined)return;if(W3on){W3.place(n);return}const i=ORDER.indexOf(n),seg=360/25,w=$('wheel');rot=(360-(i+.5)*seg)%360;w.style.transition='none';w.style.transform=`rotate(${rot}deg)`}
function showLast(){if(!RD.h.length)return;place(RD.h[0]);$('res').innerHTML=resHTML(RD.h[0])}
function reveal(r){phase='';rvId=r.id;spinning=false;closed=false;left=SEC();const p=P(act),bs=(p&&p.bets)||[];let net=0;if(bs.length&&p.tgt&&p.tgt<=r.id)bs.forEach(b=>{net+=wins(b.k,r.n)?b.a*mult(b.k):-b.a});$('res').innerHTML=resHTML(r.n)+(bs.length?`<div class="net ${net>=0?'win':'lose'}">${net>=0?'Menang ':'Kalah '}${net>=0?'+':''}${fmt(net)} chip</div>`:'');if(bs.length){if(net>0){confetti();winSound()}else if(net<0)loseSound()}settle();render()}
function startSpin(r){spinning=true;phase='spin';const i=ORDER.indexOf(r.n),seg=360/25,des=(360-(i+.5)*seg)%360;rot=Math.ceil(rot/360)*360+5*360+des;
  if(W3on)W3.spin(r.n,r.ms);else{const w=$('wheel');w.style.transition=`transform ${r.ms}ms cubic-bezier(.12,.6,.1,1)`;w.style.transform=`rotate(${rot}deg)`}spinSound(r.ms);$('res').innerHTML='<span class="note">Roda berputar…</span>';render();
  setTimeout(()=>{phase='wait';$('res').innerHTML='<span class="note">Roda berhenti. Menunggu hasil…</span>';cdView();setTimeout(()=>reveal(r),rdMs())},r.ms+150)}
async function advance(){if(!D||spinning)return;try{const r=D.doc('game/round'),a=await r.acquire({holder:HID,ttlMs:4000});if(!a.acquired)return;
  const s=await r.get(),d=s.exists?s.data():{id:0,h:[]};if(d.id!==RD.id)return;
  const n=crypto.getRandomValues(new Uint32Array(1))[0]%25;await r.set({id:d.id+1,n,ms:+CF.ms||6000,at:Date.now(),h:[n].concat(d.h||[]).slice(0,30)})}catch(e){console.error(e)}}
setInterval(()=>{if(!cfgOk||seen<0)return;if(!spinning&&!CF.paused){if(closed){if(--retry<=0){advance();retry=3}}else{if(left>SEC())left=SEC();left--;if(left<=0){left=0;closed=true;retry=3;advance();render()}}}cdView();autoTick();if(adm&&tab===5&&!/INPUT|SELECT/.test((document.activeElement||{}).tagName))admView()},1000);

/* ---------- Akun pemain ---------- */
const normPh=s=>{let d=String(s||'').replace(/\D/g,'');if(d.startsWith('62'))d='0'+d.slice(2);return d};
const okEm=s=>/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s);
const V=id=>($(id)||{value:''}).value.trim();
const uname=p=>(p.user||p.name).toLowerCase();
async function acctGo(){const u=V('au'),w=($('ap')||{value:''}).value;
  if(mode==='up'){const nm=V('an'),us=u.toLowerCase(),ph=normPh(V('aph')),em=V('aem').toLowerCase();
    if(nm.length<2)return toast('Isi nama lengkap');if(!/^[a-z0-9_.]{3,16}$/.test(us))return toast('Username 3-16 karakter: huruf, angka, titik, atau garis bawah');
    if(ph.length<9||ph.length>15)return toast('Nomor telepon tidak valid');if(!okEm(em))return toast('Email tidak valid');if(w.length<4)return toast('Password minimal 4 karakter');
    if(PL.some(p=>uname(p)===us))return toast('Username sudah dipakai');if(PL.some(p=>p.email===em))return toast('Email sudah terdaftar');
    const id=uid(),t=Date.now();await W('players/'+id,{name:nm,user:us,phone:ph,email:em,chips:CF.start,ph:await H('pl:'+w),bets:[],tgt:0,log:[],last:[],created:t,seen:t,blocked:false,tw:0,tn:0,contact:'',note:''},true);setMe(id);toast(CF.lgWelcome||'Akun dibuat. Selamat bermain!')}
  else{const k=u.toLowerCase(),p=PL.find(p=>uname(p)===k||p.email===k);if(!p||!p.ph||await H('pl:'+w)!==p.ph)return toast('Username atau password salah');if(p.blocked)return toast('Akun diblokir. Hubungi admin.');wp(p,{seen:Date.now()});setMe(p.id)}}
function openPm(h){$('pmb').innerHTML=h;$('pm').hidden=false}
function closePm(){$('pm').hidden=true}
function forgotView(){openPm(`<div class="mh"><b>Reset password</b><button onclick="closePm()" aria-label="Tutup">✕</button></div><p class="note">Masukkan email dan nomor telepon yang terdaftar di akun Anda, lalu buat password baru.</p><label class="lbl">Email</label><input type="email" id="fe" autocomplete="email"><label class="lbl">Nomor telepon</label><input type="tel" id="fp" autocomplete="tel"><label class="lbl">Password baru</label><input type="password" id="fw" autocomplete="new-password"><label class="lbl">Ulangi password baru</label><input type="password" id="fw2" autocomplete="new-password"><button class="gold" style="width:100%;margin-top:12px" onclick="doReset()">Atur password baru</button>`)}
async function doReset(){const em=V('fe').toLowerCase(),ph=normPh(V('fp')),w=$('fw').value,w2=$('fw2').value,p=PL.find(p=>p.email&&p.email===em&&normPh(p.phone)===ph);
  if(!p)return toast('Email atau nomor telepon tidak cocok');if(p.blocked)return toast('Akun diblokir. Hubungi admin.');if(w.length<4)return toast('Password minimal 4 karakter');if(w!==w2)return toast('Ulangan password tidak sama');
  await wp(p,{ph:await H('pl:'+w)});closePm();toast('Password diganti. Silakan masuk.')}
function profileView(){const p=P(me);if(!p)return;const n=p.tn||0;
  openPm(`<div class="mh"><b>Profil saya</b><button onclick="closePm()" aria-label="Tutup">✕</button></div><div class="pf"><i class="av big">${esc((p.name[0]||'?').toUpperCase())}</i><div><b>${esc(p.name)}</b><small>@${esc(p.user||p.name)}</small></div></div><div class="dg" style="margin-bottom:10px">${kpi('Saldo chip',fmt(p.chips))}${kpi('Total taruhan',fmt(p.tw||0))}${kpi('Hasil bersih',sg(n))}</div>
  <label class="lbl">Nama lengkap</label><input id="pn" value="${esc(p.name)}" maxlength="40"><label class="lbl">Username</label><input value="${esc(p.user||p.name)}" disabled><label class="lbl">Nomor telepon</label><input type="tel" id="pph" value="${esc(p.phone||'')}"><label class="lbl">Email</label><input type="email" id="pem" value="${esc(p.email||'')}"><button class="gold" style="width:100%;margin-top:8px" onclick="saveProfile()">Simpan profil</button>
  <h3>Ganti password</h3><input type="password" id="po" placeholder="Password lama" autocomplete="current-password"><input type="password" id="pnw" placeholder="Password baru (minimal 4 karakter)" autocomplete="new-password"><button style="width:100%" onclick="changePw()">Ganti password</button>`)}
async function saveProfile(){const p=P(me);if(!p)return;const nm=V('pn'),ph=normPh(V('pph')),em=V('pem').toLowerCase();
  if(nm.length<2)return toast('Isi nama lengkap');if(ph.length<9||ph.length>15)return toast('Nomor telepon tidak valid');if(!okEm(em))return toast('Email tidak valid');if(PL.some(q=>q.id!==p.id&&q.email===em))return toast('Email sudah dipakai akun lain');
  await wp(p,{name:nm,phone:ph,email:em});toast('Profil disimpan');profileView()}
async function changePw(){const p=P(me);if(!p)return;const o=$('po').value,n=$('pnw').value;if(await H('pl:'+o)!==p.ph)return toast('Password lama salah');if(n.length<4)return toast('Password baru minimal 4 karakter');await wp(p,{ph:await H('pl:'+n)});$('po').value='';$('pnw').value='';toast('Password diganti')}
function setMe(id){me=id;act=id;akey='';try{sessionStorage.setItem('rrme',id)}catch(e){}render()}
function logout(){me=null;act=null;akey='';try{sessionStorage.removeItem('rrme');localStorage.removeItem('rrme')}catch(e){}render()}

/* ---------- Admin ---------- */
const PRE=[{n:'Kasino klasik',acc:'#f5c542',bg1:'#3b0a1e',bg2:'#0b0612',felt:'#0a5c36',font:'klasik'},{n:'Neon malam',acc:'#00e5ff',bg1:'#2b0a4a',bg2:'#05030f',felt:'#0b2a5c',font:'neon'},{n:'Zamrud',acc:'#e8d9a0',bg1:'#06382c',bg2:'#020d0a',felt:'#0d6b4a',font:'elegan'},{n:'Sakura',acc:'#ff8fb1',bg1:'#4a1230',bg2:'#12060e',felt:'#7a1f4a',font:'elegan'},{n:'Samudra',acc:'#ffd166',bg1:'#0b3a66',bg2:'#030b17',felt:'#0f4c75',font:'neon'}];
function sel(k,l,o){return`<label class="lbl">${l}</label><div class="row"><select onchange="cf('${k}',this.value,'text')" style="flex:1;padding:9px;border-radius:9px;background:#0006;color:var(--ink);border:1px solid var(--line)">${o.map(([v,t])=>`<option value="${v}" ${CF[k]==v?'selected':''}>${t}</option>`).join('')}</select></div>`}
function preset(i){const{n,...t}=PRE[i];Object.assign(CF,t);wc();theme();admView()}
function gen(){const a='ABCDEFGHJKMNPQRSTUVWXYZ23456789';let s='';crypto.getRandomValues(new Uint32Array(6)).forEach(x=>s+=a[x%a.length]);return s}
function openAdm(){$('ov').classList.add('s');admView()}
function closeAdm(){$('ov').classList.remove('s');adm=false;lastPw=null;delId=null;rsArm=false;render();if(window.ADMIN_PAGE)location.href='index.html';else if(location.hash==='#admin')location.hash='pemain'}
function admView(){const P2=$('pan');P2.className='pan'+(isAdm()&&!adm?' lg':'');if(!adm)lastPw=null;
  if(!adm){P2.innerHTML=`<div class="row"><h2 style="margin:0;flex:1;color:var(--acc)">Masuk admin</h2><button onclick="closeAdm()">Tutup</button></div><label class="lbl" for="lp">Password</label><div class="row"><input type="password" id="lp" autocomplete="current-password" onkeydown="if(event.key==='Enter')login()"><button class="gold" onclick="login()">Masuk</button></div><p class="note">Password awal: <b>admin123</b>. Segera ganti di tab Keamanan.</p>`;return}
  const cu=PL.reduce((s,p)=>s+unread(p.id,'a','a'+p.id),0),pn=PL.filter(p=>p.pending).length,T=['Pemain','Tampilan','Aturan','Keamanan','Chat'+(cu?' ('+cu+')':''),'Dashboard','Pengguna','Login & Daftar','Pendaftaran'+(pn?' ('+pn+')':''),'Aktivitas'],c=CF,f=(k,l,t='text')=>`<label class="lbl">${l}</label><div class="row"><input type="${t}" value="${esc(c[k])}" onchange="cf('${k}',this.value,'${t}')"></div>`;
  const HD=`<div class="row"><h2 style="margin:0;flex:1;color:var(--acc)">Panel admin</h2><button onclick="admOut()">Keluar</button><button class="gold" onclick="closeAdm()">Selesai</button></div>`,TB=`<div class="tabs">${[5,0,6,8,4,1,7,2,9,3].map(i=>`<button class="${i===tab?'on':''}" onclick="tab=${i};admView()">${T[i]}</button>`).join('')}</div>`;let h=HD+TB;const hl=h.length;
  if(tab===0){if(lastPw)h+=`<div class="note" style="opacity:1;border:1px solid var(--acc);border-radius:10px;padding:10px">Password baru untuk <b>${esc(lastPw.n)}</b>: <b style="font-size:1.2rem;color:var(--acc);user-select:all">${esc(lastPw.w)}</b><br>Catat dan berikan ke pemain.</div>`;
    h+=`<label class="lbl">Jumlah untuk tombol tambah/kurang</label><div class="row"><input type="number" id="amt" value="100" min="1"></div><label class="lbl">Password baru untuk tombol Reset (kosongkan untuk acak)</label><div class="row"><input type="text" id="npw" maxlength="20"></div>`;
    h+=PL.map(p=>`<div class="row"><input type="text" value="${esc(p.name)}" onchange="pe('${p.id}','name',this.value)" aria-label="Nama pemain"><input type="number" value="${p.chips}" min="0" onchange="pe('${p.id}','chips',this.value)" aria-label="Chip"><button onclick="ac('${p.id}',1)">＋</button><button onclick="ac('${p.id}',-1)">−</button><button onclick="rp('${p.id}')">Reset password</button><button onclick="dp('${p.id}')" style="background:#7a1020;border-color:#ff6b6b">${delId===p.id?'Yakin hapus?':'Hapus'}</button></div>${lastPw&&lastPw.id===p.id?`<div class="note" style="opacity:1;color:var(--acc)">Password baru ${esc(p.name)}: <b style="font-size:1.1rem;user-select:all">${esc(lastPw.w)}</b></div>`:''}`).join('')||'<p class="note">Belum ada pemain.</p>';
    h+=`<div class="row"><button class="gold" onclick="np()">Tambah pemain</button><button onclick="allc()">Beri jumlah di atas ke semua</button></div>`}
  if(tab===1)h+=`<label class="lbl">Tema siap pakai</label><div class="row">${PRE.map((t,i)=>`<button onclick="preset(${i})" style="background:linear-gradient(135deg,${t.bg1},${t.felt});border-color:${t.acc}">${t.n}</button>`).join('')}</div>`+sel('font','Gaya huruf',[['klasik','Klasik'],['neon','Neon'],['elegan','Elegan']])+sel('lay','Tata letak',[['side','Berdampingan'],['flip','Roda di kanan'],['stack','Satu kolom']])+sel('pat','Pola latar',[['0','Polos'],['1','Berlian'],['2','Titik']])+f('rad','Kebulatan sudut kartu (px)','number')+f('wsz','Ukuran roda (px)','number')+f('title','Judul')+f('sub','Subjudul')+f('foot','Teks bawah')+
    `<label class="lbl">Warna</label><div class="row">${['acc:Aksen','bg1:Latar atas','bg2:Latar bawah','felt:Meja'].map(s=>{const[k,l]=s.split(':');return`<label>${l} <input type="color" value="${c[k]}" onchange="cf('${k}',this.value,'text')"></label>`}).join('')}</div>`;
  if(tab===2)h+=f('chips','Nilai chip (pisahkan dengan koma)')+f('sec','Jeda putaran otomatis (detik, minimal 5)','number')+f('start','Chip awal pemain baru','number')+`<label class="lbl"><input type="checkbox" ${c.reg?'checked':''} onchange="cf('reg',this.checked,'bool')"> Izinkan pemain mendaftar sendiri</label>`+f('pn','Bayaran angka tunggal (x)','number')+f('pc','Bayaran warna, ganjil/genap, 1–12/13–24 (x)','number')+f('pd','Bayaran sepertiga: 1–8, 9–16, 17–24 (x)','number')+f('ms','Lama putaran (milidetik)','number')+f('rd','Jeda hasil muncul setelah roda berhenti (detik)','number')+f('minb','Taruhan minimal per ketukan (0 = bebas)','number')+f('maxb','Batas total per pilihan taruhan (0 = bebas)','number')+`<label class="lbl"><input type="checkbox" ${c.maint?'checked':''} onchange="cf('maint',this.checked,'bool')"> Mode pemeliharaan (tutup permainan sementara)</label>`+f('maintMsg','Pesan pemeliharaan')+
    `<div class="row" style="margin-top:12px"><button onclick="W('game/round',{h:[]});toast('Riwayat dihapus')">Hapus riwayat</button><button onclick="rsAll()">${rsArm?'Yakin reset semua?':'Reset semua'}</button></div>`;
  if(tab===3)h+=`<label class="lbl">Password lama</label><div class="row"><input type="password" id="p0"></div><label class="lbl">Password baru (minimal 4 karakter)</label><div class="row"><input type="password" id="p1"></div><label class="lbl">Ulangi password baru</label><div class="row"><input type="password" id="p2"></div><div class="row"><button class="gold" onclick="chpw()">Simpan password</button></div><p class="note">Password admin dan akun pemain tersimpan di database bersama. Cocok untuk acara santai, bukan untuk uang sungguhan.</p>`;
  if(tab===4)h+=chatTab();if(tab===5)h+=dashTab();if(tab===6)h+=userTab();if(tab===7)h+=loginTab();if(tab===8)h+=regTab();if(tab===9)h+=logTab();P2.innerHTML=isAdm()?shell(h.slice(hl),T):h;if(tab===4&&achat){const t=thread(achat);if(t.length)seenSet('a'+achat,t[t.length-1].at);const m=$('amsgs');if(m)m.scrollTop=m.scrollHeight}}
async function login(){if(await H($('lp').value)===APW){adm=true;try{sessionStorage.setItem('rradm',APW)}catch(e){}admView()}else toast('Password salah')}
async function chpw(){const[a,b,c]=['p0','p1','p2'].map(i=>$(i).value);if(await H(a)!==APW)return toast('Password lama salah');if(b.length<4)return toast('Password baru terlalu pendek');if(b!==c)return toast('Ulangan password tidak sama');APW=await H(b);try{sessionStorage.setItem('rradm',APW)}catch(e){}wc();toast('Password diubah');admView()}
function cf(k,v,t){if(k==='chips'){const a=String(v).split(',').map(x=>parseInt(x)).filter(x=>x>0);if(a.length){CF.chips=a;chip=a[0]}}else CF[k]=t==='number'?Math.max(0,+v||0):v;wc();theme();render()}
function pe(id,k,v){const p=P(id);if(p)wp(p,{[k]:k==='chips'?Math.max(0,Math.floor(+v||0)):v})}
function ac(id,s){const a=Math.floor(+$('amt').value)||0,p=P(id);if(p){wp(p,{chips:Math.max(0,p.chips+s*a)});alog((s>0?'Menambah ':'Mengurangi ')+fmt(a)+' chip untuk '+p.name);admView()}}
function allc(){const a=Math.floor(+$('amt').value)||0;PL.forEach(p=>wp(p,{chips:p.chips+a}));alog('Memberi '+fmt(a)+' chip ke semua pemain ('+PL.length+')');admView();toast('Chip ditambahkan ke semua pemain')}
function np(){const id=uid();W('players/'+id,{name:'Pemain '+(PL.length+1),chips:CF.start,ph:'',bets:[],tgt:0,log:[],last:[],created:Date.now(),seen:0,blocked:false,tw:0,tn:0,contact:'',note:''},true).then(admView)}
function dp(id){if(delId!==id){delId=id;admView();return}delId=null;alog('Menghapus akun '+((P(id)||{}).name||id));D.doc('players/'+id).delete().then(()=>{PL=PL.filter(p=>p.id!==id);if(act===id)act=null;if(me===id)logout();admView();render()})}
function rp(id){const p=P(id),i=$('npw'),c=i?i.value.trim():'',v=c||gen();if(!p)return;if(v.length<4)return toast('Password minimal 4 karakter');(async()=>{await wp(p,{ph:await H('pl:'+v)});lastPw={id,n:p.name,w:v};alog('Reset password '+p.name);admView();toast('Password '+p.name+' diganti: '+v)})()}
function rsAll(){if(!rsArm){rsArm=true;admView();return}PL.forEach(p=>D.doc('players/'+p.id).delete());D.doc('app/cfg').delete();D.doc('game/round').delete();setTimeout(()=>location.reload(),900)}

async function spinNow(){if(spinning)return toast('Roda sedang berputar');closed=true;alog('Memutar roda secara manual');await advance();toast('Putaran dimulai')}
function kpi(l,v,s){return`<div class="stat"><small>${l}</small><b>${v}</b>${s?`<small>${s}</small>`:''}</div>`}
const ago=t=>{if(!t)return'-';const m=Math.round((Date.now()-t)/60000);return m<1?'Baru saja':m<60?m+' mnt lalu':m<1440?Math.round(m/60)+' jam lalu':Math.round(m/1440)+' hari lalu'};
const dd=t=>t?new Date(t).toLocaleDateString('id-ID',{day:'2-digit',month:'short',year:'numeric'}):'-';
const dt=t=>t?new Date(t).toLocaleString('id-ID',{dateStyle:'medium',timeStyle:'short'}):'-';
const sg=n=>(n>=0?'+':'')+fmt(n);
function dashTab(){const h=hv(),now=Date.now(),sum=f=>PL.reduce((s,p)=>s+f(p),0),tc=sum(p=>p.chips),tw=sum(p=>p.tw||0),tn=sum(p=>p.tn||0),pend=sum(p=>(p.bets||[]).reduce((a,b)=>a+b.a,0)),ap=PL.filter(p=>(p.bets||[]).length).length,
  on=PL.filter(p=>p.seen&&now-p.seen<9e5).length,nw=PL.filter(p=>p.created&&now-p.created<864e5).length,bl=PL.filter(p=>p.blocked).length,cnt=Array(25).fill(0);h.forEach(x=>cnt[x]++);
  const mx=Math.max(1,...cnt),bars=cnt.map((c,i)=>`<rect x="${i*22+4}" y="${96-c/mx*84}" width="16" height="${c/mx*84}" rx="3" fill="${i&&!REDS.has(i)?'#7b86a8':col(i)}"/><text x="${i*22+12}" y="110" font-size="9" text-anchor="middle" fill="#9aa3c4">${i}</text>`).join(''),
  top=PL.slice().sort((a,b)=>b.chips-a.chips).slice(0,6),tm=Math.max(1,...top.map(p=>p.chips)),
  tb=top.map(p=>`<div class="hb"><span>${esc(p.name)}</span><i style="width:${Math.max(2,p.chips/tm*100)}%"></i><b>${fmt(p.chips)}</b></div>`).join('')||'<p class="note">Belum ada pemain.</p>',rc=h.filter(x=>REDS.has(x)).length,zc=h.filter(x=>x===0).length;
  return`<div class="stats">${kpi('Total pengguna',PL.length,bl+' diblokir')}${kpi('Aktif 15 menit',on)}${kpi('Baru 24 jam',nw,PL.filter(p=>p.pending).length+' menunggu')}${kpi('Chip beredar',fmt(tc))}${kpi('Total taruhan',fmt(tw))}${kpi('Hasil kasino',sg(-tn),'selisih chip pemain')}${kpi('Taruhan terpasang',fmt(pend),ap+' pemain')}${kpi('Putaran ke '+RD.id,CF.paused?'Dijeda':spinning?'Berputar':closed?'Ditutup':left+' dtk','status taruhan')}</div>
  <div class="row" style="margin-top:14px"><button class="gold" onclick="spinNow()">Putar sekarang</button><button onclick="togglePause()">${CF.paused?'Lanjutkan putaran otomatis':'Jeda putaran otomatis'}</button></div>
  <div class="grid2"><div class="panelbox"><h3>Distribusi angka (${h.length} putaran terakhir)</h3><svg viewBox="0 0 556 118" style="width:100%;height:auto" role="img" aria-label="Grafik distribusi angka">${bars}</svg><div class="note">Merah ${rc}, Hitam ${h.length-rc-zc}, Nol ${zc}</div></div><div class="panelbox"><h3>Chip terbanyak</h3>${tb}</div></div>
  ${expoPanel()}${regChart()}<div class="panelbox" style="margin-top:14px"><h3>Pengumuman untuk semua pemain</h3><div class="row"><input type="text" id="ntc" maxlength="140" value="${esc(CF.notice||'')}" placeholder="Contoh: Bonus chip dibagikan jam 8 malam"><button class="gold" onclick="cf('notice',$('ntc').value.trim(),'text');toast('Pengumuman diperbarui')">Tampilkan</button><button onclick="cf('notice','','text');admView()">Hapus</button></div></div>
  <div class="panelbox" style="margin-top:14px"><h3>Hasil terakhir</h3><div class="hist">${h.slice(0,30).map(x=>`<span style="background:${col(x)}">${x}</span>`).join('')||'<span class="note" style="width:auto">Belum ada putaran.</span>'}</div></div>`}
let uq='',uf='all',us='new',upg=0,udet=null;
const badge=p=>p.pending?'<span class="bd warn">Menunggu</span>':p.blocked?'<span class="bd bad">Diblokir</span>':p.ph?'<span class="bd ok">Aktif</span>':'<span class="bd warn">Tanpa password</span>';
function userDetail(p){const n=p.tn||0,lg=(p.log||[]).map(l=>`<li class="${l.d>=0?'win':'lose'}">${esc(l.t)}</li>`).join('')||'<li class="note">Belum ada riwayat.</li>',bs=(p.bets||[]).map(b=>b.k+': '+fmt(b.a)).join(', ')||'tidak ada',fl=(k,l,v)=>`<div><label class="lbl">${l}</label><div class="row"><input type="text" value="${esc(v||'')}" onchange="pe('${p.id}','${k}',this.value)"></div></div>`;
  return`<div class="detail"><div class="row" style="margin:0 0 12px"><i class="av">${esc((p.name[0]||'?').toUpperCase())}</i><h3 style="margin:0;flex:1">${esc(p.name)}</h3>${badge(p)}<button onclick="udet=null;admView()">Tutup</button></div>
  <div class="dg">${kpi('Saldo chip',fmt(p.chips))}${kpi('Total taruhan',fmt(p.tw||0))}${kpi('Hasil bersih',sg(n))}${kpi('Terdaftar',dd(p.created),dt(p.created))}${kpi('Terakhir aktif',ago(p.seen),dt(p.seen))}${kpi('Taruhan aktif',fmt((p.bets||[]).reduce((s,b)=>s+b.a,0)),esc(bs))}</div>
  <div class="dg" style="margin-top:12px">${fl('name','Nama',p.name)}${fl('phone','Telepon',p.phone)}${fl('email','Email',p.email)}${fl('contact','Kontak lain',p.contact)}${fl('note','Catatan admin',p.note)}</div>
  <label class="lbl">Atur chip</label><div class="row"><input type="number" id="uamt" value="100" min="1"><button onclick="uac('${p.id}',1)">Tambah</button><button onclick="uac('${p.id}',-1)">Kurangi</button></div>
  <div class="row"><button onclick="blk('${p.id}')">${p.blocked?'Buka blokir':'Blokir akun'}</button><button onclick="rp('${p.id}')">Reset password</button><button onclick="dp('${p.id}')" style="background:#7a1020;border-color:#ff6b6b">${delId===p.id?'Yakin hapus?':'Hapus akun'}</button></div>
  ${lastPw&&lastPw.id===p.id?`<div class="note" style="opacity:1;color:#9db6ff">Password baru: <b style="font-size:1.1rem;user-select:all">${esc(lastPw.w)}</b></div>`:''}<h3>Riwayat terakhir</h3><ul class="log">${lg}</ul></div>`}
function uac(id,s){const a=Math.floor(+$('uamt').value)||0,p=P(id);if(p){wp(p,{chips:Math.max(0,p.chips+s*a)});alog((s>0?'Menambah ':'Mengurangi ')+fmt(a)+' chip untuk '+p.name);admView()}}
function userTab(){const a=PL.filter(p=>(!uq||(p.name+' '+(p.user||'')+' '+(p.phone||'')+' '+(p.email||'')+' '+(p.contact||'')).toLowerCase().includes(uq.toLowerCase()))&&(uf==='all'||(uf==='blocked'?p.blocked:uf==='pending'?p.pending:uf==='active'?!p.blocked&&!p.pending:!p.ph))).sort((x,y)=>us==='name'?x.name.localeCompare(y.name):us==='chips'?y.chips-x.chips:(y.created||0)-(x.created||0)),
  PS=12,pages=Math.max(1,Math.ceil(a.length/PS));if(upg>=pages)upg=pages-1;if(upg<0)upg=0;const pg=a.slice(upg*PS,upg*PS+PS),op=(v,t,c)=>`<option value="${v}" ${c===v?'selected':''}>${t}</option>`,sty='padding:9px;border-radius:9px;background:#0b0e1a;color:var(--ink);border:1px solid var(--line)',
  rows=pg.map(p=>{const n=p.tn||0;return`<tr class="rw ${udet===p.id?'sel':''}" onclick="udet=udet==='${p.id}'?null:'${p.id}';admView()"><td><b>${esc(p.name)}</b></td><td>${esc(p.phone||p.contact||'-')}<br><small style="opacity:.65">${esc(p.email||'')}</small></td><td class="n">${fmt(p.chips)}</td><td class="n">${fmt(p.tw||0)}</td><td class="n ${n>=0?'pos':'neg'}">${sg(n)}</td><td>${badge(p)}</td><td>${dd(p.created)}</td><td>${ago(p.seen)}</td></tr>`}).join('')||'<tr><td colspan="8" style="padding:20px;opacity:.7">Tidak ada pengguna.</td></tr>',d=P(udet);
  return`<div class="row"><input type="text" placeholder="Cari nama atau kontak" value="${esc(uq)}" onchange="uq=this.value;upg=0;admView()"><select style="${sty}" onchange="uf=this.value;upg=0;admView()">${op('all','Semua status',uf)+op('active','Aktif',uf)+op('blocked','Diblokir',uf)+op('pending','Menunggu',uf)+op('nopw','Tanpa password',uf)}</select><select style="${sty}" onchange="us=this.value;admView()">${op('new','Terbaru',us)+op('name','Nama',us)+op('chips','Chip terbanyak',us)}</select><button class="gold" onclick="exportCSV()">Unduh CSV</button><button onclick="exportJSON()">Cadangkan JSON</button></div>
  <div class="note">${a.length} dari ${PL.length} pengguna. Klik baris untuk melihat detail.</div><div class="tw"><table class="tbl"><thead><tr><th>Pengguna</th><th>Telepon / Email</th><th>Chip</th><th>Taruhan</th><th>Hasil bersih</th><th>Status</th><th>Terdaftar</th><th>Terakhir aktif</th></tr></thead><tbody>${rows}</tbody></table></div>
  <div class="pg"><span class="note" style="margin:0 auto 0 0">Halaman ${upg+1} dari ${pages}</span><button ${upg<=0?'disabled':''} onclick="upg--;admView()">Sebelumnya</button><button ${upg>=pages-1?'disabled':''} onclick="upg++;admView()">Berikutnya</button></div>`+(d?userDetail(d):'')+
  `<label class="lbl">Pulihkan dari file cadangan (JSON)</label><div class="row"><input type="file" accept=".json" onchange="importJSON(this.files[0])"></div>`}
function dl(name,text,type){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type}));a.download=name;document.body.appendChild(a);a.click();a.remove()}
function exportCSV(){const q=v=>'"'+String(v==null?'':v).replace(/"/g,'""')+'"',h=['nama','username','telepon','email','kontak','chip','total_taruhan','hasil_bersih','status','tanggal_daftar','terakhir_aktif','catatan'],iso=t=>t?new Date(t).toISOString():'';
  const r=PL.map(p=>[p.name,p.user,p.phone,p.email,p.contact,p.chips,p.tw||0,p.tn||0,p.blocked?'diblokir':p.ph?'aktif':'tanpa_password',iso(p.created),iso(p.seen),p.note].map(q).join(','));dl('pengguna.csv','\ufeff'+[h.join(',')].concat(r).join('\n'),'text/csv')}
function exportJSON(){dl('cadangan-pengguna.json',JSON.stringify(PL,null,1),'application/json')}
function importJSON(f){if(!f)return;f.text().then(t=>{const a=JSON.parse(t);if(!Array.isArray(a))throw 0;a.forEach(p=>{if(p&&p.id&&p.name){const o={};Object.keys(p).forEach(k=>{if(k!=='id')o[k]=p[k]});W('players/'+p.id,o,true)}});toast('Data pengguna dipulihkan: '+a.length)}).catch(()=>toast('File tidak valid'))}
function loginTab(){const g=(k,l)=>`<label class="lbl">${l}</label><div class="row"><input type="text" value="${esc(CF[k]||'')}" onchange="cf('${k}',this.value,'text');admView()"></div>`,sty='flex:1;padding:9px;border-radius:9px;background:#0006;color:var(--ink);border:1px solid var(--line)';
  return`<div class="stats"><div><h3>Pratinjau: Masuk</h3>${acctHTML(false,true)}</div><div><h3>Pratinjau: Daftar</h3>${acctHTML(true,true)}</div></div>`+
  g('lgTitle','Judul kotak')+g('lgIntro','Teks pengantar (opsional)')+g('lgIn','Nama tab Masuk')+g('lgUp','Nama tab Daftar')+g('lgUser','Teks kolom nama pengguna')+g('lgPass','Teks kolom password')+
  g('lgName','Teks kolom nama lengkap')+g('lgPhone','Teks kolom nomor telepon')+g('lgEmail','Teks kolom email')+g('lgBtnIn','Teks tombol masuk')+g('lgBtnUp','Teks tombol daftar')+g('lgTerms','Syarat atau aturan di form daftar (opsional)')+g('lgHelp','Teks bantuan di form masuk (opsional)')+g('lgWelcome','Pesan setelah akun dibuat')+
  `<label class="lbl">Gaya kotak</label><div class="row"><select style="${sty}" onchange="cf('lgSt',this.value,'text');admView()">${[['box','Kotak biasa'],['gold','Bingkai emas'],['plain','Tanpa kotak']].map(([v,t])=>`<option value="${v}" ${CF.lgSt===v?'selected':''}>${t}</option>`).join('')}</select></div><div class="row" style="margin-top:12px"><button onclick="loginReset()">Kembalikan ke bawaan</button></div>`}
function loginReset(){LGK.concat(['lgWelcome']).forEach(k=>CF[k]=DEF[k]);wc();theme();render();admView()}
const ADM_PAGES={5:'admin.html',0:'admin-pemain.html',6:'admin-pengguna.html',8:'admin-pendaftaran.html',4:'admin-chat.html',1:'admin-tampilan.html',7:'admin-halaman-masuk.html',2:'admin-aturan.html',9:'admin-aktivitas.html',3:'admin-keamanan.html'};
const admSess=()=>{try{return sessionStorage.getItem('rradm')}catch(e){return null}};
function go(i){if(window.ADMIN_PAGE&&ADM_PAGES[i])location.href=ADM_PAGES[i];else{tab=i;admView()}}
function admOut(){adm=false;try{sessionStorage.removeItem('rradm')}catch(e){}admView()}
const NAV={5:['📊','Dashboard'],0:['👥','Pemain'],6:['🗂','Pengguna'],4:['💬','Chat'],1:['🎨','Tampilan'],7:['🔑','Login & Daftar'],2:['⚙','Aturan'],3:['🔒','Keamanan'],8:['📝','Pendaftaran'],9:['🧾','Aktivitas']};
const GRP=[['Ikhtisar',[5]],['Pengguna',[0,6,8,4]],['Konfigurasi',[1,7,2]],['Sistem',[9,3]]];
function shell(body,T){const cnt={4:PL.reduce((s,p)=>s+unread(p.id,'a','a'+p.id),0),8:PL.filter(p=>p.pending).length},
  nav=GRP.map(([g,ids])=>`<div class="ap-grp">${g}</div>`+ids.map(i=>{const t=`<span>${NAV[i][0]}</span>${NAV[i][1]}${cnt[i]?`<em class="nb">${cnt[i]}</em>`:''}`;return window.ADMIN_PAGE?`<a class="${i===tab?'on':''}" href="${ADM_PAGES[i]}">${t}</a>`:`<button class="${i===tab?'on':''}" onclick="tab=${i};admView()">${t}</button>`}).join('')).join(''),pn=cnt[8];
  return`<div class="ap"><aside class="ap-side"><div class="ap-brand"><b>${esc(CF.title)}</b><small>Panel admin</small></div><nav>${nav}</nav><div class="ap-foot">${window.ADMIN_PAGE?'<a href="index.html" target="_blank" rel="noopener">Buka situs pemain</a>':'<button onclick="closeAdm()">Kembali ke situs</button>'}<button onclick="admOut()">Keluar</button></div></aside><div class="ap-main"><header class="ap-top"><h1>${NAV[tab][1]}</h1><span class="pill ${SYNC?'g':''}">● ${SYNC?'Online':'Lokal'}</span><span class="pill">${PL.length} pengguna</span><span class="pill">Putaran ${RD.id}</span>${pn?`<button class="pill warnb" onclick="go(8)">📝 ${pn} menunggu</button>`:''}${CF.maint?'<span class="pill warnb">Mode pemeliharaan</span>':''}</header><div class="ap-body">${body}</div></div></div>`}
let LG=[],lgq='',lgArm=false;
function alog(m){if(!D)return;W('logs/'+uid(),{t:Date.now(),m},true)}
function regChart(){const days=[...Array(7)].map((_,i)=>{const d=new Date();d.setHours(0,0,0,0);d.setDate(d.getDate()-6+i);return d.getTime()}),c=days.map(t=>PL.filter(p=>p.created>=t&&p.created<t+864e5).length),m=Math.max(1,...c);
  return`<div class="panelbox" style="margin-top:14px"><h3>Pendaftar 7 hari terakhir</h3><svg viewBox="0 0 320 110" style="width:100%;height:auto" role="img" aria-label="Grafik pendaftar per hari">${c.map((v,i)=>`<rect x="${i*44+10}" y="${84-v/m*66}" width="28" height="${v/m*66}" rx="5" fill="#5b8def"/><text x="${i*44+24}" y="${80-v/m*66}" font-size="10" text-anchor="middle" fill="#cfd8ff">${v||''}</text><text x="${i*44+24}" y="102" font-size="9" text-anchor="middle" fill="#9aa3c4">${new Date(days[i]).toLocaleDateString('id-ID',{weekday:'short'})}</text>`).join('')}</svg></div>`}
function regTab(){const pend=PL.filter(p=>p.pending).sort((a,b)=>(b.created||0)-(a.created||0)),
  chk=(k,l)=>`<label class="lbl"><input type="checkbox" ${CF[k]?'checked':''} onchange="cf('${k}',this.checked,'bool');admView()"> ${l}</label>`,
  f=(k,l,t='text')=>`<label class="lbl">${l}</label><div class="row"><input type="${t}" value="${esc(CF[k]===undefined?'':CF[k])}" onchange="cf('${k}',this.value,'${t}')"></div>`,
  rows=pend.map(p=>`<tr><td><b>${esc(p.name)}</b><br><small style="opacity:.65">@${esc(p.user||p.name)}</small></td><td>${esc(p.phone||'-')}<br><small style="opacity:.65">${esc(p.email||'')}</small></td><td>${ago(p.created)}</td><td><button class="gold" onclick="approve('${p.id}')">Setujui</button> <button onclick="reject('${p.id}')" style="background:#7a1020;border-color:#ff6b6b">${delId===p.id?'Yakin tolak?':'Tolak'}</button></td></tr>`).join('')||'<tr><td colspan="4" style="padding:20px;opacity:.7">Tidak ada pendaftar yang menunggu.</td></tr>';
  return`<div class="grid2"><div class="panelbox"><h3>Pengaturan pendaftaran</h3>${chk('reg','Pendaftaran terbuka untuk umum')}${chk('appr','Akun baru perlu persetujuan admin')}${f('invite','Kode undangan (kosongkan jika tidak dipakai)')}${f('start','Chip bonus untuk pendaftar baru','number')}${f('maxp','Batas jumlah pemain (0 = tanpa batas)','number')}</div>${regChart().replace('margin-top:14px','margin-top:0')}</div><div class="row" style="margin-top:16px"><h3 style="margin:0;flex:1">Menunggu persetujuan (${pend.length})</h3>${pend.length?'<button class="gold" onclick="approveAll()">Setujui semua</button>':''}</div><div class="tw"><table class="tbl"><thead><tr><th>Pendaftar</th><th>Kontak</th><th>Mendaftar</th><th>Aksi</th></tr></thead><tbody>${rows}</tbody></table></div>`}
function approve(id){const p=P(id);if(!p)return;wp(p,{pending:false});alog('Menyetujui pendaftaran '+p.name);admView()}
function approveAll(){PL.filter(p=>p.pending).forEach(p=>wp(p,{pending:false}));alog('Menyetujui semua pendaftar yang menunggu');admView()}
function reject(id){const p=P(id);if(!p)return;if(delId!==id){delId=id;admView();return}delId=null;alog('Menolak pendaftaran '+p.name);D.doc('players/'+id).delete().then(()=>{PL=PL.filter(q=>q.id!==id);admView()})}
function blk(id){const p=P(id);if(!p)return;const nb=!p.blocked;wp(p,{blocked:nb});alog((nb?'Memblokir ':'Membuka blokir ')+p.name);admView()}
function togglePause(){cf('paused',!CF.paused,'bool');alog(CF.paused?'Putaran otomatis dijeda':'Putaran otomatis dilanjutkan');admView()}
function logTab(){const a=LG.filter(l=>!lgq||l.m.toLowerCase().includes(lgq.toLowerCase())).slice(0,100);
  return`<div class="row"><input type="text" placeholder="Cari aktivitas" value="${esc(lgq)}" onchange="lgq=this.value;admView()"><button onclick="clearLogs()">${lgArm?'Yakin hapus semua?':'Hapus semua log'}</button></div><div class="note">${a.length} dari ${LG.length} catatan. Maksimal 200 catatan terakhir disimpan.</div><div class="tw"><table class="tbl"><thead><tr><th>Waktu</th><th>Aktivitas</th></tr></thead><tbody>${a.map(l=>`<tr><td>${dt(l.t)}</td><td style="white-space:normal">${esc(l.m)}</td></tr>`).join('')||'<tr><td colspan="2" style="padding:20px;opacity:.7">Belum ada aktivitas.</td></tr>'}</tbody></table></div>`}
function clearLogs(){if(!lgArm){lgArm=true;admView();return}lgArm=false;LG.forEach(l=>D.doc('logs/'+l.id).delete());LG=[];admView()}
const SFX={on:(()=>{try{return localStorage.getItem('rrsfx')!=='0'}catch(e){return true}})(),ctx:null};
let autoRep=false,lastAuto=-1;try{autoRep=localStorage.getItem('rrauto')==='1'}catch(e){}
function audio(){if(!SFX.ctx){try{SFX.ctx=new (window.AudioContext||window.webkitAudioContext)()}catch(e){return null}}if(SFX.ctx.state==='suspended')SFX.ctx.resume();return SFX.ctx}
function beep(f,d,v,t0,type){const c=audio();if(!c||!SFX.on)return;const t=c.currentTime+(t0||0),o=c.createOscillator(),g=c.createGain();o.type=type||'square';o.frequency.value=f;g.gain.setValueAtTime(v||.05,t);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g);g.connect(c.destination);o.start(t);o.stop(t+d+.02)}
function spinSound(ms){if(!SFX.on)return;for(let i=1;i<=34;i++)beep(700+(i%2)*140,.03,.04,ms*(1-Math.pow(1-i/34,1/3))/1000,'square')}
function winSound(){[523,659,784,1047].forEach((f,i)=>beep(f,.18,.07,i*.1,'triangle'))}
function loseSound(){beep(196,.3,.06,0,'sawtooth')}
function confetti(){const c=$('fx');if(!c||(window.matchMedia&&matchMedia('(prefers-reduced-motion:reduce)').matches))return;const x=c.getContext('2d');c.width=innerWidth;c.height=innerHeight;
  const P=[...Array(140)].map(()=>({x:innerWidth/2,y:innerHeight*.45,vx:(Math.random()-.5)*14,vy:-Math.random()*13-4,s:4+Math.random()*6,c:['#f5c542','#ff5d73','#5b8def','#6ee7a0','#fff'][Math.random()*5|0],r:Math.random()*6}));let f=0;
  (function t(){x.clearRect(0,0,c.width,c.height);P.forEach(p=>{p.vy+=.35;p.x+=p.vx;p.y+=p.vy;p.r+=.2;x.fillStyle=p.c;x.save();x.translate(p.x,p.y);x.rotate(p.r);x.fillRect(-p.s/2,-p.s/2,p.s,p.s*.6);x.restore()});if(++f<110)requestAnimationFrame(t);else x.clearRect(0,0,c.width,c.height)})()}
function autoTick(){if(!autoRep||spinning||closed||CF.maint||CF.paused||lastAuto===RD.id)return;const p=P(act);if(!p||p.blocked||p.pending||!p.last||!p.last.length||(p.bets||[]).length)return;
  lastAuto=RD.id;const n=p.last.reduce((s,b)=>s+b.a,0);if(p.chips<n){autoRep=false;$('auto').setAttribute('aria-pressed','false');toast('Auto ulang dihentikan: chip tidak cukup');return}repeatBets()}
function expoPanel(){const B={};let tot=0;PL.forEach(p=>(p.bets||[]).forEach(b=>{B[b.k]=(B[b.k]||0)+b.a;tot+=b.a}));
  const net=[...Array(25).keys()].map(n=>{let g=0;Object.keys(B).forEach(k=>{if(wins(k,n))g+=B[k]*(mult(k)+1)});return tot-g}),mx=Math.max(1,...net.map(Math.abs)),
  bars=net.map((v,i)=>`<rect x="${i*22+4}" y="${v>=0?50-v/mx*44:50}" width="16" height="${Math.max(1,Math.abs(v)/mx*44)}" rx="2" fill="${v>=0?'#4cd37b':'#ff6b6b'}"/><text x="${i*22+12}" y="112" font-size="9" text-anchor="middle" fill="#9aa3c4">${i}</text>`).join(''),
  lab=k=>k[0]==='n'?'Angka '+k.slice(1):({red:'Merah',black:'Hitam',even:'Genap',odd:'Ganjil',low:'1-12',high:'13-24',d1:'1-8',d2:'9-16',d3:'17-24'})[k]||k,mb=Math.max(1,...Object.values(B)),
  top=Object.entries(B).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([k,v])=>`<div class="hb"><span>${lab(k)}</span><i style="width:${Math.max(2,v/mb*100)}%"></i><b>${fmt(v)}</b></div>`).join('')||'<p class="note">Belum ada taruhan terpasang.</p>';
  return`<div class="panelbox" style="margin-top:14px"><h3>Eksposur putaran berikutnya</h3><div class="note">Total terpasang ${fmt(tot)} chip. Hijau: kasino untung jika angka itu keluar, merah: rugi. Terburuk ${sg(Math.min(0,...net))}, terbaik ${sg(Math.max(0,...net))}.</div><svg viewBox="0 0 556 118" style="width:100%;height:auto" role="img" aria-label="Eksposur per angka"><line x1="0" x2="556" y1="50" y2="50" stroke="#2a3150"/>${bars}</svg>${top}</div>`}
/* ---------- Chat pemain dan admin ---------- */
let CH=[],chatOpen=false,cinit=false,achat=null,SEEN={};try{SEEN=JSON.parse(localStorage.getItem('rrseen')||'{}')}catch(e){}
function seenSet(k,at){SEEN[k]=at;try{localStorage.setItem('rrseen',JSON.stringify(SEEN))}catch(e){}}
const thread=pid=>CH.filter(m=>m.pid===pid).sort((a,b)=>a.at-b.at);
const unread=(pid,side,k)=>thread(pid).filter(m=>m.from!==side&&m.at>(SEEN[k]||0)).length;
const msgsHTML=(pid,side)=>thread(pid).map(m=>`<div class="m ${m.from===side?'me':''}"><small>${m.from==='a'?'Admin':esc(m.name||'Pemain')}</small>${esc(m.text)}</div>`).join('')||'<p class="note">Belum ada pesan.</p>';
function sendChat(pid,from,name,input){const t=input.value.trim();if(!t)return;input.value='';const th=thread(pid);if(th.length>60)th.slice(0,th.length-50).forEach(m=>D.doc('chat/'+m.id).delete());W('chat/'+uid(),{pid,from,name,text:t.slice(0,300),at:Date.now()},true)}
function clearChat(pid){thread(pid).forEach(m=>D.doc('chat/'+m.id).delete());toast('Chat dihapus')}
function chatView(){const p=P(act),b=$('chatBadge'),u=p?unread(p.id,'p','p'+p.id):0;b.hidden=!u||chatOpen;b.textContent=u;if(!chatOpen)return;
  $('chatTitle').textContent=p?'Chat admin: '+p.name:'Chat dengan admin';const M=$('chatMsgs');
  if(!p){M.innerHTML='<p class="note">Masuk atau pilih pemain dulu untuk chat dengan admin.</p>';return}
  M.innerHTML=msgsHTML(p.id,'p');M.scrollTop=M.scrollHeight;const t=thread(p.id);if(t.length)seenSet('p'+p.id,t[t.length-1].at)}
function chatTab(){if(!achat||!P(achat))achat=(PL[0]||{}).id||null;const p=P(achat);if(!p)return'<p class="note">Belum ada pemain.</p>';
  const bs=PL.map(q=>{const u=unread(q.id,'a','a'+q.id);return`<button class="${q.id===achat?'on':''}" onclick="achat='${q.id}';admView()">${esc(q.name)}${u?' ('+u+')':''}</button>`}).join('');
  return`<div class="tabs" style="margin-top:0">${bs}</div><div class="msgs" id="amsgs">${msgsHTML(p.id,'a')}</div><div class="row"><input type="text" id="ain" maxlength="300" placeholder="Balas ${esc(p.name)}…" onkeydown="if(event.key==='Enter')sendChat('${p.id}','a','Admin',this)"><button class="gold" onclick="sendChat('${p.id}','a','Admin',$('ain'))">Kirim</button><button onclick="clearChat('${p.id}')">Hapus chat</button></div>`}
/* ---------- Mulai ---------- */
$('rep').onclick=repeatBets;$('clr').onclick=clearBets;$('admBtn').onclick=openAdm;
$('auto').setAttribute('aria-pressed',autoRep);$('snd').textContent=SFX.on?'🔊':'🔇';$('snd').setAttribute('aria-pressed',SFX.on);
$('auto').onclick=()=>{autoRep=!autoRep;try{localStorage.setItem('rrauto',autoRep?'1':'0')}catch(e){}$('auto').setAttribute('aria-pressed',autoRep);toast(autoRep?'Auto ulang taruhan aktif':'Auto ulang taruhan mati')};
$('snd').onclick=()=>{SFX.on=!SFX.on;try{localStorage.setItem('rrsfx',SFX.on?'1':'0')}catch(e){}$('snd').textContent=SFX.on?'🔊':'🔇';$('snd').setAttribute('aria-pressed',SFX.on);if(SFX.on){audio();beep(880,.08,.05)}};
$('histBtn').onclick=()=>{$('hm').hidden=false;renderHist()};$('hmx').onclick=()=>{$('hm').hidden=true};
$('ht1').onclick=()=>{$('hp1').hidden=false;$('hp2').hidden=true;$('ht1').classList.add('on');$('ht2').classList.remove('on')};
$('ht2').onclick=()=>{$('hp1').hidden=true;$('hp2').hidden=false;$('ht2').classList.add('on');$('ht1').classList.remove('on')};
['hm','pm'].forEach(i=>$(i).addEventListener('click',e=>{if(e.target===$(i))$(i).hidden=true}));
$('chatFab').onclick=()=>{chatOpen=!chatOpen;$('chatBox').hidden=!chatOpen;chatView();if(chatOpen)$('chatIn').focus()};
$('chatX').onclick=()=>{chatOpen=false;$('chatBox').hidden=true;chatView()};
$('chatSend').onclick=()=>{const p=P(act);if(!p)return toast('Masuk dulu untuk chat');sendChat(p.id,'p',p.name,$('chatIn'))};
$('chatIn').onkeydown=e=>{if(e.key==='Enter')$('chatSend').click()};
const hb=()=>{const a=isAdm();$('admBtn').hidden=!a;$('chatFab').hidden=a;document.body.classList.toggle('isadm',a);document.body.classList.toggle('admpage',a);if(a){chatOpen=false;$('chatBox').hidden=true;if(!$('ov').classList.contains('s'))openAdm()}else $('ov').classList.remove('s')};hb();addEventListener('hashchange',hb);
document.addEventListener('keydown',e=>{if(e.key==='Escape'){$('hm').hidden=true;$('pm').hidden=true;if($('ov').classList.contains('s'))closeAdm()}});
(async()=>{
  theme();render();
  W3on=!!(window.W3&&W3.init($('w3d')));if(W3on){$('w3d').hidden=false;document.querySelector('.wheelbox').classList.add('is3d');W3.setAccent(CF.acc)}
  D=fbDB();SYNC=true;
  
  try{me=sessionStorage.getItem('rrme')||localStorage.getItem('rrme')||null}catch(e){}act=me;
  D.doc('app/cfg').onSnapshot(s=>{
    if(s.exists){const d=s.data();CF={...DEF,...d.cfg};APW=d.pw||'';cfgOk=true;if(isAdm()){if(!adm&&APW&&admSess()===APW)adm=true;if(!/INPUT|SELECT/.test((document.activeElement||{}).tagName))admView()}if(!chip||!CF.chips.includes(chip))chip=CF.chips[0]||10;theme();render()}
    else if(!creating){creating=true;(async()=>{APW=await H('admin123');CF={...DEF};cfgOk=true;await wc();theme();render()})()}},e=>toast('Koneksi database terputus'));
  D.collection('players').onSnapshot(s=>{PL=s.docs.map(d=>({...d.data(),id:d.id}));plOk=true;if(me&&!P(me)){me=null;act=null;akey=''}if(!act&&!me){const o=PL.find(p=>!p.ph);act=o?o.id:null}settle();render();if(adm&&(tab===0||tab===5||tab===6||tab===8)&&!/INPUT|SELECT/.test((document.activeElement||{}).tagName))admView()},e=>toast('Koneksi database terputus'));
  if(isAdm())D.collection('logs').onSnapshot(s=>{LG=s.docs.map(d=>({...d.data(),id:d.id})).sort((a,b)=>b.t-a.t);if(LG.length>200)LG.slice(200).forEach(l=>D.doc('logs/'+l.id).delete());if(adm&&tab===9&&!/INPUT|SELECT/.test((document.activeElement||{}).tagName))admView()},e=>{});
  D.collection('chat').onSnapshot(s=>{const old=new Set(CH.map(m=>m.id));CH=s.docs.map(d=>({...d.data(),id:d.id}));
    if(cinit){const isA=isAdm();CH.filter(m=>!old.has(m.id)).forEach(m=>{if(isA&&m.from==='p'&&!(adm&&tab===4&&achat===m.pid))toast('Pesan baru dari '+(m.name||'pemain'));else if(!isA&&m.from==='a'&&m.pid===act&&!chatOpen)toast('Pesan baru dari admin')})}
    cinit=true;chatView();if(adm&&tab===4){const M=$('amsgs');if(M&&achat){M.innerHTML=msgsHTML(achat,'a');M.scrollTop=M.scrollHeight;const t=thread(achat);if(t.length)seenSet('a'+achat,t[t.length-1].at)}}},e=>toast('Koneksi database terputus'));
  D.doc('game/round').onSnapshot(s=>{const d=s.exists?s.data():{id:0,n:0,h:[]},nr={id:d.id||0,n:d.n||0,h:d.h||[],ms:d.ms||6000,at:d.at||0};
    if(seen===-1){RD=nr;seen=nr.id;left=SEC();const el=Date.now()-nr.at,tot=nr.ms+150+rdMs();
      if(nr.at&&el>=0&&el<tot){rvId=nr.id-1;spinning=true;phase=el<nr.ms+150?'spin':'wait';place(nr.h[1]);$('res').innerHTML='<span class="note">'+(phase==='spin'?'Roda berputar…':'Roda berhenti. Menunggu hasil…')+'</span>';setTimeout(()=>reveal(nr),tot-el)}else{rvId=nr.id;showLast()}settle();render();return}
    if(nr.id>seen){RD=nr;seen=nr.id;startSpin(nr)}else if(nr.id<seen){RD=nr;seen=nr.id;rvId=nr.id;showLast();render()}else{RD=nr;renderHist()}},e=>toast('Koneksi database terputus'));
})();
