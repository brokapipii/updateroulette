/* Roda roulette 3D (Three.js r128). Jika WebGL tidak tersedia, tampilan 2D dipakai. */
(function(){
const REDS=[1,3,5,7,9,12,14,16,18,19,21,23],ORDER=[0,16,11,5,24,21,6,9,17,14,2,3,22,19,10,7,13,23,4,12,15,1,20,18,8],N=25,TAU=Math.PI*2,SEG=TAU/N;
let R,S,C,wheel,ball,host,anim=null;const gold=[];
const colOf=n=>n===0?0x0d7a3f:REDS.includes(n)?0xc0182b:0x161616;
const thetaFor=i=>Math.PI/2-(i+.5)*SEG;
const norm=a=>((a%TAU)+TAU)%TAU;
function numTex(n){const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d');x.fillStyle='#fff';x.font='bold 78px Arial,sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText(n,64,68);return new THREE.CanvasTexture(c)}
function draw(){R.render(S,C)}
function size(){const w=host.clientWidth||340,h=Math.round(w*.86);R.setSize(w,h,false);C.aspect=w/h;C.updateProjectionMatrix();draw()}
function ballAt(psi,r,y){ball.position.set(r*Math.cos(psi),y,-r*Math.sin(psi))}
function init(h){
  if(!window.THREE)return false;host=h;
  try{R=new THREE.WebGLRenderer({antialias:true,alpha:true})}catch(e){return false}
  R.setPixelRatio(Math.min(window.devicePixelRatio||1,2));host.appendChild(R.domElement);
  S=new THREE.Scene();C=new THREE.PerspectiveCamera(36,1/.86,.1,100);C.position.set(0,7.4,7.6);C.lookAt(0,-.2,-.3);
  S.add(new THREE.AmbientLight(0xffffff,.7));const dl=new THREE.DirectionalLight(0xffffff,.9);dl.position.set(3,9,5);S.add(dl);
  const pl=new THREE.PointLight(0xffd27a,.9,30);pl.position.set(0,4,0);S.add(pl);
  const goldMat=()=>{const m=new THREE.MeshStandardMaterial({color:0xf5c542,metalness:.85,roughness:.28});gold.push(m);return m};
  const bowl=new THREE.Mesh(new THREE.CylinderGeometry(5.1,4.5,.6,72),new THREE.MeshStandardMaterial({color:0x2b140a,roughness:.55,metalness:.1}));bowl.position.y=-.45;S.add(bowl);
  const track=new THREE.Mesh(new THREE.RingGeometry(3.7,4.5,72),new THREE.MeshStandardMaterial({color:0x14101a,roughness:.4,metalness:.5,side:THREE.DoubleSide}));track.rotation.x=-Math.PI/2;track.position.y=-.1;S.add(track);
  const rim=new THREE.Mesh(new THREE.TorusGeometry(4.55,.14,14,96),goldMat());rim.rotation.x=Math.PI/2;rim.position.y=-.02;S.add(rim);
  wheel=new THREE.Group();S.add(wheel);
  const base=new THREE.Mesh(new THREE.CylinderGeometry(3.7,3.7,.2,72),new THREE.MeshStandardMaterial({color:0x111111,roughness:.5}));base.position.y=-.12;wheel.add(base);
  ORDER.forEach((n,i)=>{
    const w=new THREE.Mesh(new THREE.CircleGeometry(3.68,5,i*SEG,SEG),new THREE.MeshStandardMaterial({color:colOf(n),roughness:.45,metalness:.15,side:THREE.DoubleSide}));w.rotation.x=-Math.PI/2;wheel.add(w);
    const phi=(i+.5)*SEG,g=new THREE.Group();g.position.set(3.0*Math.cos(phi),.03,-3.0*Math.sin(phi));g.rotation.y=Math.PI/2-phi;
    const t=new THREE.Mesh(new THREE.PlaneGeometry(.72,.72),new THREE.MeshBasicMaterial({map:numTex(n),transparent:true}));t.rotation.x=-Math.PI/2;g.add(t);wheel.add(g);
    const a=i*SEG,d=new THREE.Mesh(new THREE.BoxGeometry(3.7,.07,.05),goldMat());d.position.set(1.85*Math.cos(a),.04,-1.85*Math.sin(a));d.rotation.y=a;wheel.add(d)});
  const hub=new THREE.Mesh(new THREE.CylinderGeometry(1.15,1.3,.35,48),new THREE.MeshStandardMaterial({color:0x1b1220,roughness:.35,metalness:.6}));hub.position.y=.1;wheel.add(hub);
  const cone=new THREE.Mesh(new THREE.ConeGeometry(.55,1.2,32),goldMat());cone.position.y=.85;wheel.add(cone);
  const knob=new THREE.Mesh(new THREE.SphereGeometry(.2,24,24),goldMat());knob.position.y=1.5;wheel.add(knob);
  const pt=new THREE.Mesh(new THREE.ConeGeometry(.2,.55,16),goldMat());pt.rotation.x=Math.PI;pt.position.set(0,.55,-4.55);S.add(pt);
  ball=new THREE.Mesh(new THREE.SphereGeometry(.15,28,28),new THREE.MeshStandardMaterial({color:0xffffff,roughness:.15,metalness:.6}));S.add(ball);
  wheel.rotation.y=thetaFor(0);ballAt(Math.PI/2,3.0,.18);
  size();if(window.ResizeObserver)new ResizeObserver(size).observe(host);else addEventListener('resize',size);
  return true}
function setAccent(hex){if(!R)return;gold.forEach(m=>m.color.set(hex));draw()}
function place(n){if(!R)return;const i=ORDER.indexOf(n);if(i<0)return;anim=null;wheel.rotation.y=thetaFor(i);ballAt(Math.PI/2,3.0,.18);draw()}
function spin(n,ms){if(!R)return;const i=ORDER.indexOf(n);if(i<0)return;const th0=norm(wheel.rotation.y),tgt=norm(thetaFor(i)),th1=th0+norm(tgt-th0)+TAU*(5+Math.floor(Math.random()*2));
  anim={t0:performance.now(),ms:Math.max(1000,ms),th0,th1,bt:6+Math.random()*2};requestAnimationFrame(frame)}
function frame(now){if(!anim)return;const k=Math.min(1,(now-anim.t0)/anim.ms),e1=1-Math.pow(1-k,3),e2=1-Math.pow(1-k,4);
  wheel.rotation.y=anim.th0+(anim.th1-anim.th0)*e1;
  const b=k>.8?(k-.8)/.2:0,hop=Math.abs(Math.sin(b*Math.PI*4))*(1-b),psi=Math.PI/2+anim.bt*TAU*(1-e2),r=3.0+.95*Math.pow(1-k,1.5)+hop*.2;
  ballAt(psi,r,.18+hop*.35);draw();if(k<1)requestAnimationFrame(frame);else anim=null}
window.W3={init,spin,place,setAccent};
})();
