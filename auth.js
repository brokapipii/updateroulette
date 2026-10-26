let D,CF={...DEF},PL=[],view='in',okCfg=false,okPl=false,initMsg=null;
if(window.AUTH_VIEW==='in'&&location.hash==='#daftar')location.replace('daftar.html');
if(window.AUTH_VIEW==='in'&&location.hash==='#lupa')location.replace('lupa.html');
{const q=new URLSearchParams(location.search);if(q.get('reset'))initMsg={t:'Password diganti. Silakan masuk.',ok:true};else if(q.get('pending'))initMsg={t:'Pendaftaran terkirim. Akun akan aktif setelah disetujui admin.',ok:true};else if(q.get('closed'))initMsg={t:'Pendaftaran sedang ditutup.',ok:false}}
const R=k=>CF[k]||DEF[k]||'';
const setMsg=(t,ok)=>{const m=$('msg');m.textContent=t||'';m.className=t?(ok?'ok':'err'):''};
const fail=(id,t)=>{setMsg(t);const e=$(id);if(e){e.classList.add('bad');e.focus()}};
function clr(){document.querySelectorAll('.bad').forEach(e=>e.classList.remove('bad'));setMsg('')}
function paint(){if(okCfg&&window.AUTH_VIEW==='up'&&!CF.reg){location.replace('login.html?closed=1');return}applyTheme(CF);
  $('tIn').textContent=R('lgIn');$('tUp').textContent=R('lgUp');$('tUp').hidden=!CF.reg;$('tIn').parentElement.style.gridTemplateColumns=CF.reg?'1fr 1fr':'1fr';
  $('pk1').textContent=fmt(CF.start)+' chip awal gratis';$('lfn').textContent=R('lgName');$('lem').textContent=R('lgEmail');$('lph').textContent=R('lgPhone');
  $('tt').innerHTML=(esc(CF.lgTerms||'Saya memahami bahwa ini permainan hiburan dengan chip virtual, tanpa uang sungguhan.'))+' <a href="panduan.html" target="_blank" rel="noopener">Baca panduan</a>';
  $('wic').dataset.v=CF.invite?'up':'x';show()}
function show(){$('tIn').parentElement.hidden=view==='fg';document.querySelectorAll('[data-v]').forEach(e=>{e.hidden=!e.dataset.v.split(' ').includes(view)});
  $('tIn').setAttribute('aria-selected',view==='in');$('tUp').setAttribute('aria-selected',view==='up');
  const H1={in:['Selamat datang kembali','Masuk untuk melanjutkan permainan.'],up:['Buat akun baru','Daftar gratis dan langsung dapat '+fmt(CF.start)+' chip awal.'],fg:['Reset password','Masukkan email dan nomor telepon yang terdaftar, lalu buat password baru.']}[view];
  $('hd').textContent=H1[0];$('ld').textContent=(view==='in'&&CF.lgIntro)?CF.lgIntro:H1[1];
  $('lu').textContent=view==='in'?R('lgUser')+' atau email':R('lgUser');$('lp').textContent=view==='fg'?'Password baru':view==='up'?'Buat password':R('lgPass');
  $('fpw').autocomplete=view==='in'?'current-password':'new-password';
  $('go').textContent=view==='in'?R('lgBtnIn'):view==='up'?R('lgBtnUp'):'Atur password baru';
  $('sw').innerHTML=view==='in'?(CF.reg?'Belum punya akun? <a href="daftar.html">Daftar sekarang</a>':'')+(CF.lgHelp?'<br><small style="opacity:.7">'+esc(CF.lgHelp)+'</small>':''):'Sudah punya akun? <a href="login.html">Masuk</a>';
  clr();if(initMsg)setMsg(initMsg.t,initMsg.ok)}
function route(){view=window.AUTH_VIEW||'in';$('wic').dataset.v=CF.invite?'up':'x';show()}
$('tIn').onclick=()=>{location.href='login.html'};$('tUp').onclick=()=>{location.href='daftar.html'};
document.querySelectorAll('.eye').forEach(b=>b.onclick=()=>{const i=$(b.dataset.for);i.type=i.type==='password'?'text':'password'});
$('fpw').addEventListener('input',()=>{if(view==='in')return;const w=$('fpw').value;let s=0;if(w.length>=4)s++;if(w.length>=8)s++;if(/[A-Z]/.test(w)&&/[a-z]/.test(w))s++;if(/\d/.test(w)&&/[^A-Za-z0-9]/.test(w))s++;
  $('mb').style.width=(w?Math.max(s,1)*25:0)+'%';$('mb').style.background=['#ff6b6b','#ff6b6b','#f3c969','#9be37f','#4cd37b'][w?Math.max(s,1):0];$('mt').textContent=w?['','Lemah','Cukup','Baik','Kuat'][Math.max(s,1)]:''});
function finish(id,rem){try{(rem?localStorage:sessionStorage).setItem('rrme',id);(rem?sessionStorage:localStorage).removeItem('rrme')}catch(e){}location.href='index.html'}
async function doLogin(){const u=$('fu').value.trim().toLowerCase(),w=$('fpw').value;if(!u)return fail('fu','Isi username atau email.');if(!w)return fail('fpw','Isi password.');
  const p=PL.find(p=>uname(p)===u||p.email===u);if(!p||!p.ph||await H('pl:'+w)!==p.ph)return fail('fpw','Username atau password salah.');if(p.blocked)return fail('fu','Akun diblokir. Hubungi admin.');if(p.pending)return fail('fu','Akun Anda menunggu persetujuan admin.');
  await D.doc('players/'+p.id).update({seen:Date.now()});finish(p.id,$('rm').checked)}
async function doReg(){const nm=$('fn').value.trim(),us=$('fu').value.trim().toLowerCase(),em=$('fem').value.trim().toLowerCase(),ph=normPh($('fph').value),w=$('fpw').value;
  if(!CF.reg)return setMsg('Pendaftaran sedang ditutup.');if(+CF.maxp&&PL.length>=+CF.maxp)return setMsg('Kuota pemain sudah penuh.');if(CF.invite&&$('fic').value.trim()!==CF.invite)return fail('fic','Kode undangan salah.');if(nm.length<2)return fail('fn','Isi nama lengkap.');if(!/^[a-z0-9_.]{3,16}$/.test(us))return fail('fu','Username 3-16 karakter: huruf, angka, titik, atau garis bawah.');
  if(!okEm(em))return fail('fem','Email tidak valid.');if(ph.length<9||ph.length>15)return fail('fph','Nomor telepon tidak valid.');
  if(w.length<4)return fail('fpw','Password minimal 4 karakter.');if(w!==$('fpw2').value)return fail('fpw2','Ulangan password tidak sama.');if(!$('tm').checked)return setMsg('Centang persetujuan untuk melanjutkan.');
  if(PL.some(p=>uname(p)===us))return fail('fu','Username sudah dipakai.');if(PL.some(p=>p.email===em))return fail('fem','Email sudah terdaftar.');
  const id=uid(),t=Date.now();await D.doc('players/'+id).set({name:nm,user:us,phone:ph,email:em,chips:CF.start,ph:await H('pl:'+w),bets:[],tgt:0,log:[],last:[],created:t,seen:t,blocked:false,pending:!!CF.appr,tw:0,tn:0,contact:'',note:''});D.doc('logs/'+uid()).set({t,m:'Pendaftaran baru: '+nm+' (@'+us+')'+(CF.appr?' - menunggu persetujuan':'')});if(CF.appr){location.href='login.html?pending=1';return}
  setMsg(CF.lgWelcome||'Akun dibuat. Selamat bermain!',true);setTimeout(()=>finish(id,true),700)}
async function doReset(){const em=$('fem').value.trim().toLowerCase(),ph=normPh($('fph').value),w=$('fpw').value,p=PL.find(p=>p.email&&p.email===em&&normPh(p.phone)===ph);
  if(!em||!ph)return fail(em?'fph':'fem','Isi email dan nomor telepon.');if(!p)return fail('fem','Email atau nomor telepon tidak cocok.');if(p.blocked)return fail('fem','Akun diblokir. Hubungi admin.');
  if(w.length<4)return fail('fpw','Password minimal 4 karakter.');if(w!==$('fpw2').value)return fail('fpw2','Ulangan password tidak sama.');
  await D.doc('players/'+p.id).update({ph:await H('pl:'+w)});location.href='login.html?reset=1'}
$('f').addEventListener('submit',async e=>{e.preventDefault();initMsg=null;clr();if(!(okCfg&&okPl))return setMsg('Menghubungkan ke server, coba sesaat lagi.');
  const b=$('go');b.disabled=true;try{await({in:doLogin,up:doReg,fg:doReset})[view]()}catch(err){console.error(err);setMsg('Terjadi kesalahan. Coba lagi.')}b.disabled=false});
D=fbDB();route();
D.doc('app/cfg').onSnapshot(s=>{if(s.exists)CF={...DEF,...s.data().cfg};okCfg=true;paint();route()});
D.collection('players').onSnapshot(s=>{PL=s.docs.map(d=>({...d.data(),id:d.id}));okPl=true;const me=getSession();if(me&&PL.some(p=>p.id===me&&!p.blocked))location.replace('index.html')});
