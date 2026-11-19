/* ===== audio.js — الصوت والأجواء (مولّد بالكود، بلا ملفات صوتية) =====
   يُحمَّل قبل engine.js. يعتمد على متغيرات عامة يعرّفها المحرك عند الاستدعاء فقط (G, mute, $, toast, ov).
   الواجهة: aud() تهيئة السياق | tone/ps/nb/thump/boom/steps/chime/glitch مؤثرات | ambSet(مشهد) أجواء
   duck(v) خفض الأجواء | trustMood() مزاج الثقة | setBeat(on) نبض القلب | endSnd(n) صوت كل نهاية */
function aud(){
  if(au)return;
  try{
    au=new(window.AudioContext||window.webkitAudioContext)();
    AMGN=au.createGain();
    AMGN.gain.value=VOL.a;
    AMGN.connect(au.destination);
    FXGN=au.createGain();
    FXGN.gain.value=VOL.f;
    FXGN.connect(au.destination);
    CV=au.createConvolver();
    CV.buffer=impulse(2.4);
    REVIN=au.createGain();
    REVIN.gain.value=3.5;
    REVIN.connect(CV);
    CV.connect(FXGN);
    const o=au.createOscillator(),g=au.createGain(),f=au.createBiquadFilter();
    o.type='sawtooth';
    o.frequency.value=48;
    f.type='lowpass';
    f.frequency.value=140;
    g.gain.value=.05;
    o.connect(f);
    f.connect(g);
    g.connect(AMGN);
    o.start();
    dr=g;
    const o2=au.createOscillator(),g2=au.createGain();
    o2.type='sawtooth';
    o2.frequency.value=50.6;
    g2.gain.value=0;
    o2.connect(g2);
    g2.connect(f);
    o2.start();
    dr2=g2;
    ambInit()
  }catch(e){}
}

function tone(f,d=.35){
  if(!au||mute)return;
  const o=au.createOscillator(),g=au.createGain();
  o.frequency.value=f;
  g.gain.setValueAtTime(.2,au.currentTime);
  g.gain.exponentialRampToValueAtTime(.001,au.currentTime+d);
  o.connect(g);
  g.connect(FXGN||au.destination);
  o.start();
  o.stop(au.currentTime+d)
}

var AMGN=null,FXGN=null,VOL=(()=>{
  try{
    return JSON.parse(localStorage.getItem('vol'))||{
      a:1,f:.7
    }
  }catch(e){
    return{
      a:1,f:.7
    }
  }
})();

function volSave(){try{localStorage.setItem('vol',JSON.stringify(VOL))}catch(e){}}

function volUI(){
  ov(`<div class='pz'><h3>${TR('ui.volume')}</h3><p>${TR('ui.volAmb')}</p><input type='range' id='va' min='0' max='150' value='${Math.round(VOL.a*100)}' style='width:100%'><p>${TR('ui.volFx')}</p><input type='range' id='vf' min='0' max='150' value='${Math.round(VOL.f*100)}' style='width:100%'><button class='btn' id='vt' >${TR('ui.volTest')}</button><button class='btn' onclick='ov()'>${TR('ui.close')}</button></div>`);
$('#va').oninput=e=>{VOL.a=e.target.value/100;if(AMGN)AMGN.gain.value=VOL.a;volSave()};
$('#vf').oninput=e=>{VOL.f=e.target.value/100;if(FXGN)FXGN.gain.value=VOL.f;volSave()};
$('#vt').onclick=()=>{aud();ambInit();thump(.6);chime(1)}}


var AM=null,AMB_B='roof',AMV=1,AMT=1,AMB_K='',lastSt=0,AMB={
  roof:[500,.7,.035,55,.02],studio:[260,.5,.02,110,.018],souk:[1100,.5,.018,65,.012],door:[400,.6,.03,70,.02],stairs:[320,.6,.03,62,.02],tunnel:[180,.5,.05,45,.035],lab:[2400,.4,.018,120,.03],hall:[240,.4,.03,52,.03]
};

function ambInit(){
  if(AM||!au)return;
  const n=au.createBuffer(1,au.sampleRate*2,au.sampleRate),d=n.getChannelData(0);
  for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
  const ns=au.createBufferSource();
  ns.buffer=n;
  ns.loop=true;
  const f=au.createBiquadFilter();
  f.type='bandpass';
  const ng=au.createGain();
  ng.gain.value=0;
  const o=au.createOscillator(),og=au.createGain();
  og.gain.value=0;
  const lf=au.createOscillator(),lg=au.createGain();
  lf.frequency.value=.13;
  lg.gain.value=0;
  ns.connect(f);
  f.connect(ng);
  ng.connect(AMGN);
  o.connect(og);
  og.connect(AMGN);
  lf.connect(lg);
  lg.connect(ng.gain);
  ns.start();
  o.start();
  lf.start();
  AM={
    f,ng,o,og,lg
  };
  AMB_K='';
  ambSet(AMB_B);
  onesLoop()
}

function ambSet(b){
  AMB_B=b||AMB_B;
  if(!AM||!au)return;
  const k=AMB_B+'|'+AMV+'|'+AMT+'|'+mute;
  if(k===AMB_K)return;
  AMB_K=k;
  const a=AMB[AMB_B]||AMB.roof,t=au.currentTime,v=mute?0:a[2]*AMV*AMT,w=mute?0:a[4]*AMV*AMT;
  AM.f.frequency.setTargetAtTime(a[0],t,1.2);
  AM.f.Q.setTargetAtTime(a[1],t,1.2);
  AM.ng.gain.setTargetAtTime(v,t,1.2);
  AM.lg.gain.setTargetAtTime(v*.5,t,1.2);
  AM.o.frequency.setTargetAtTime(a[3],t,1.2);
  AM.og.gain.setTargetAtTime(w,t,1.2)
}

function ambMute(){ambSet(AMB_B)}

function nb(d,fq,g,ty,rev){
  if(!au||mute)return;
  const b=au.createBuffer(1,au.sampleRate*d,au.sampleRate),x=b.getChannelData(0);
  for(let i=0;i<x.length;i++)x[i]=Math.random()*2-1;
  const n=au.createBufferSource();
  n.buffer=b;
  const f=au.createBiquadFilter();
  f.type=ty||'lowpass';
  f.frequency.value=fq;
  const gn=au.createGain();
  gn.gain.setValueAtTime(g,au.currentTime);
  gn.gain.exponentialRampToValueAtTime(.001,au.currentTime+d);
  n.connect(f);
  f.connect(gn);
  gn.connect(FXGN);
  if(rev)send(gn,rev);
  n.start()
}

function ps(fr,to,d,g,ty,rev){
  if(!au||mute)return;
  const o=au.createOscillator(),gn=au.createGain(),t=au.currentTime;
  o.type=ty||'sine';
  o.frequency.setValueAtTime(fr,t);
  o.frequency.exponentialRampToValueAtTime(to,t+d);
  gn.gain.setValueAtTime(g,t);
  gn.gain.exponentialRampToValueAtTime(.001,t+d);
  o.connect(gn);
  gn.connect(FXGN);
  if(rev)send(gn,rev);
  o.start();
  o.stop(t+d)
}

// دقّة تحت الأرض: ضربة منخفضة + جسم أعمق + طقطقة، وكلها تتردد في صدى طويل
function thump(k){k=k||1;ps(70,28,.6,.35*k,'sine',.5);ps(46,30,1.1,.22*k,'sine',.7);nb(.35,160,.18*k,'lowpass',.5)}

function boom(){ps(90,22,1.1,.4);nb(.9,300,.2);ps(1400,300,.3,.05,'sawtooth')}

function steps(){for(let i=0;i<4;i++)setTimeout(()=>{ps(120,60,.12,.08);nb(.06,500,.05)},i*210)}

function chime(ok){[523,659,784,1047].slice(0,ok?4:2).forEach((f,i)=>setTimeout(()=>ps(f,f,.5,.07),i*110))}

function glitch(){
  for(let i=0;i<8;i++)setTimeout(()=>ps(200+Math.random()*1800,100+Math.random()*1500,.08,.05,'square'),i*70)
}

function camS(a){if(a==='shake')thump(1);else if(a==='punch')thump(.6);return 0}

function lightSnd(a){
  if(a==='off'){
    nb(1.2,2500,.12);
    ps(120,40,1.2,.2);
    AMV=.2
  }else if(a==='dim')AMV=.6;
  else{
    ps(60,120,.4,.08);
    nb(.2,3000,.06,'highpass');
    AMV=1
  }
  ambSet(AMB_B)
}

function sting(e){
  const n=Date.now();
  if(n-lastSt<1200)return;
  lastSt=n;
  if(e==='fear'){
    ps(196,185,1.4,.09,'triangle');
    ps(207,196,1.4,.07,'triangle');
    nb(1.2,200,.05)
  }else if(e==='surprise'){
    ps(880,1320,.18,.07,'square');
    nb(.12,3000,.05,'highpass')
  }else if(e==='sad'){
    ps(262,247,1.6,.06);
    ps(196,185,1.8,.05)
  }else if(e==='angry'){
    nb(.3,900,.12);
    ps(110,80,.5,.1,'sawtooth')
  }else if(e==='joy')chime(1);
  else if(e==='think')ps(330,330,.7,.05)
}

function endSnd(n){
  n===6?[392,494,587,784,988].forEach((f,i)=>setTimeout(()=>ps(f,f,1.2,.06),i*260)):n===1?chime(1):n===3?ps(65,40,3,.15):n===5?(thump(.8),ps(110,90,2.5,.08,'sawtooth')):n===2?ps(220,330,2,.07):chime(0)
}
// نبض قلب (لَبْ-دَبْ) يرافق المشهد حين تنزل ثقة أي رفيق تحت ٤ (يتوقف مع الكتم أو عند إخفاء الصفحة)
function setBeat(on){
  if(on&&!window.__beat)window.__beat=setInterval(()=>{
    if(mute||!au||document.hidden)return;
    ps(62,38,.2,.1);
    setTimeout(()=>ps(56,34,.18,.075),210)
  },1500);
  else if(!on&&window.__beat){clearInterval(window.__beat);window.__beat=0}
}

/* ── أصوات عارضة حسب المكان + صدى + مزاج الثقة (كلها مولّدة بالكود) ── */
var CV=null,REVIN=null,dr2=null;
// صدى: send(عقدة, كمية) يمرّر نسخة من الصوت عبر مُرنّن طويل
function impulse(sec){
  const n=au.sampleRate*sec|0,b=au.createBuffer(2,n,au.sampleRate);
  for(let c=0;c<2;c++){const d=b.getChannelData(c);for(let i=0;i<n;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/n,2.6)}
  return b
}
function send(node,a){
  if(!REVIN)return;
  const s=au.createGain();
  s.gain.value=a;
  node.connect(s);
  s.connect(REVIN)
}
function wind(){ // هبّة ريح
  if(!au)return;
  const t=au.currentTime,d=3.5+Math.random()*2,b=au.createBuffer(1,au.sampleRate*d|0,au.sampleRate),x=b.getChannelData(0);
  for(let i=0;i<x.length;i++)x[i]=Math.random()*2-1;
  const s=au.createBufferSource(),f=au.createBiquadFilter(),g=au.createGain();
  s.buffer=b;f.type='bandpass';f.Q.value=.8;
  f.frequency.setValueAtTime(250,t);f.frequency.linearRampToValueAtTime(900,t+d*.5);f.frequency.linearRampToValueAtTime(300,t+d);
  g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.045,t+d*.4);g.gain.linearRampToValueAtTime(0,t+d);
  s.connect(f);f.connect(g);g.connect(AMGN);s.start(t)
}
function creak(){ // صرير باب/خشب
  if(!au)return;
  const t=au.currentTime,d=1.1+Math.random()*.8,o=au.createOscillator(),f=au.createBiquadFilter(),g=au.createGain(),l=au.createOscillator(),lg=au.createGain();
  o.type='sawtooth';
  o.frequency.setValueAtTime(150,t);o.frequency.linearRampToValueAtTime(260,t+d*.5);o.frequency.linearRampToValueAtTime(170,t+d);
  f.type='bandpass';f.frequency.value=720;f.Q.value=7;
  l.frequency.value=17;lg.gain.value=.012;l.connect(lg);lg.connect(g.gain);
  g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.02,t+.2);g.gain.linearRampToValueAtTime(0,t+d);
  o.connect(f);f.connect(g);g.connect(AMGN);send(g,.6);
  o.start(t);l.start(t);o.stop(t+d);l.stop(t+d)
}
function drip(){ // قطرة ماء بصدى
  const f=1100+Math.random()*700;
  ps(f,f*.4,.1,.045,'sine',1);
  setTimeout(()=>ps(f*.97,f*.4,.1,.02,'sine',1),260)
}
function farHum(){ // حضور بعيد خافت يتموّج ثم يغيب (ليس تقليدا لأي نداء)
  if(!au)return;
  const t=au.currentTime,d=7,o=au.createOscillator(),v=au.createOscillator(),vg=au.createGain(),g=au.createGain();
  o.type='sine';o.frequency.value=196;v.frequency.value=4.5;vg.gain.value=2.5;v.connect(vg);vg.connect(o.frequency);
  g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.022,t+d*.45);g.gain.linearRampToValueAtTime(0,t+d);
  o.connect(g);g.connect(AMGN);send(g,1);
  o.start(t);v.start(t);o.stop(t+d);v.stop(t+d)
}
function crackle(){for(let i=0,n=5+Math.random()*5|0;i<n;i++)setTimeout(()=>nb(.03,4500,.035,'highpass'),i*(40+Math.random()*90))}
function relay(){ps(1800,900,.03,.03,'square')}
function deepPulse(){ps(46,40,2.2,.12,'sine',.5)}
const ONES={roof:[wind,wind,farHum],door:[creak,wind],stairs:[drip,drip,wind],tunnel:[drip,drip,drip,creak],souk:[wind,creak],lab:[crackle,relay,crackle],studio:[relay,crackle],hall:[deepPulse,crackle]};
var onesT=0;
// جدولة عشوائية: تتسارع حين تنخفض الثقة، وتتوقف مع الكتم أو إخفاء الصفحة أو خفوت المشهد
function onesLoop(){
  clearTimeout(onesT);
  onesT=setTimeout(()=>{
    if(au&&!mute&&!document.hidden&&AMV>.3){const a=ONES[AMB_B]||ONES.roof;a[Math.random()*a.length|0]()}
    onesLoop()
  },(2500+Math.random()*5000)*(AMT>1?.6:1))
}
// مزاج الثقة: عند نزولها تحت ٤ يعلو الطنين وتظهر نغمة ثانية نشاز
function trustMood(){
  const low=!!G&&Math.min(G.y,G.s)<4,k=low?1.5:1;
  if(dr2&&au)dr2.gain.setTargetAtTime(low&&!mute?1:0,au.currentTime,1.5);
  if(k!==AMT){AMT=k;ambSet(AMB_B)}
}
// خفض الأجواء مؤقتا (لحظات الصمت): يعيد القيمة السابقة
function duck(v){const p=AMV;AMV=v;ambSet(AMB_B);return p}

// موثوقية الصوت على أندرويد/iOS: يُنشأ السياق ويُستأنف عند أول لمسة وبعد كل عودة للصفحة
['pointerdown','touchend','keydown'].forEach(ev=>addEventListener(ev,()=>{
  aud();
  if(au&&au.state!=='running')au.resume().catch(()=>{})
},{passive:true}));
document.addEventListener('visibilitychange',()=>{
  if(!document.hidden&&au&&au.state!=='running')au.resume().catch(()=>{})
});
