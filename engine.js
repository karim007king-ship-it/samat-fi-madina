/* ===== engine.js — محرّك القصص التفاعلية (قابل لإعادة الاستعمال) =====
ترتيب التحميل: images.js ← i18n.js (يحمّل حزمة اللغة المختارة) ← story.js ← audio.js ← studio.js ← engine.js ← fx.js
(images2.js يُحمَّل كسولا من المحرك، وsw.js يُسجَّل من index.html).
يقرأ من story.js: GAME, C, SC2, STG, EN, ALLJ, ending() ومن i18n.js: TXT وTR() وRX.

خطوات القصة: ['من','نص','شرط','تعبير'] | {c:[اختيارات]} | {p:لغز} | {j:دليل} | {x:'أمر؛ أمر'}
  الشرط (العنصر الثالث، أو f: في الخطوات الأخرى): علم | !علم | y<5 | s>=7 (ثقة ياسمين/سامي).
المتغيرات العامة: G حالة اللعب {c فصل، i خطوة، y/s ثقة، f أعلام، j أدلة، err أخطاء الألغاز}
  IMG الصور المفعّلة | LIGHTS أضواء الخلفيات | DEF/MORE الصور المضمّنة (MORE كسولة) | HIST سجل الحوار
  Engine نقاط التوسعة (on/emit/gate/puzzles/ops) — الإضافات مثل fx.js تستعملها بدل تعديل المحرك.

فهرس الأقسام (الصوت في audio.js وأدوات الاستوديو في studio.js):
 1 الإعدادات | 2 واجهة التوسعة Engine | 3 الحالة والحفظ | 4 الواجهة الأساسية | 5 الصوت (audio.js)
 6 المشهد والكاميرا | 7 لغة وصف المشهد | 8 الحوار والتدفق | 9 الألغاز | 10 النهايات
 11 الصور | 12 تعابير الوجوه | 13 القوائم والإعدادات | 14 التشغيل
قاعدة: ما يجب أن يعمل عند التحميل يوضع في «التشغيل» فقط. */

/* ═══════════ 1) الإعدادات والثوابت ═══════════
   ثوابت عامة ومرجع GAME القادم من story.js */

const $=s=>document.querySelector(s);
function htmlText(v){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
var LIBK=GAME.id+'_lib';

/* ═══════════ 2) واجهة التوسعة (Engine) ═══════════
   نقاط ربط تسمح بإضافة ميزات من ملفات أخرى دون تعديل المحرك: أحداث، بوابات، ألغاز، أوامر مشهد */
const Engine={
  hooks:{},gates:{},puzzles:{},ops:{},
  // أحداث: Engine.on('line'|'chapter'|'trust'|'puzzle:won'|'ending', fn) — تُستدعى fn بوسائط الحدث ولا تعطّل اللعبة إن فشلت
  on(ev,fn){(this.hooks[ev]=this.hooks[ev]||[]).push(fn);return this},
  emit(ev,...a){(this.hooks[ev]||[]).forEach(f=>{try{f(...a)}catch(x){console.error('hook',ev,x)}})},
  // حقول نص: كل fn تعيد HTML يُضاف إلى الموضع (مثلا 'card:extra' في بطاقة الفصل)
  fill(ev,...a){return(this.hooks[ev]||[]).map(f=>{try{return f(...a)||''}catch(x){return''}}).join('')},
  // بوابات: مشهد يُعرض قبل المتابعة. Engine.onGate('puzzle:won'|'ending', (ctx,go)=>{...; go()}) واستدعِ go عند الانتهاء
  onGate(n,fn){(this.gates[n]=this.gates[n]||[]).push(fn);return this},
  gate(n,ctx,next){const q=(this.gates[n]||[]).slice(),go=()=>q.length?q.shift()(ctx,go):next();go()}
};
// Engine.puzzles[نوع]=(p,c)=>{...}  أنواع جديدة للألغاز | Engine.ops[أمر]=async(a,b,نص)=>{...}  أوامر جديدة لخطوة {x:'أمر ...'}

/* ═══════════ 3) الحالة والحفظ ═══════════
   حالة اللعب G، الحفظ التلقائي، الثقة، خانات الحفظ، سجل النهايات */

let G,au,dr,T=0,TT='',rd=0,nx=0,mute=0,CHR={},OV={},BG0=null,curBg=null,C0=null,IMG={};

const sv=()=>{try{localStorage.setItem(K,JSON.stringify(G))}catch(e){}};

const ld=()=>{try{const g=JSON.parse(localStorage.getItem(K));return validSaveState(g)?g:null}catch(e){return null}};

const trust=(k,d)=>{
  const o=G[k];
  G[k]=Math.max(0,Math.min(10,o+d));
  Engine.emit('trust',k,d,G[k]);
  if(o>=4&&G[k]<4)toast(TR('warn.trust').replace('{n}',k==='y'?TR('name.y'):TR('name.s')))
};

const nw=()=>({c:0,i:0,y:5,s:5,j:[],f:{},card:-1,err:0});

var TS=(()=>{try{return +localStorage.getItem('ts')||24}catch(e){return 24}})();

function lsg(k,d){try{const v=localStorage.getItem(K+k);return v!==null&&validSaveEntry(K+k,v)?JSON.parse(v):d}catch(e){return d}}

function lss(k,v){try{localStorage.setItem(K+k,JSON.stringify(v))}catch(e){}}

function snapSave(){
  const q=lsg('_snap',{});
  q[G.c]=JSON.parse(JSON.stringify(Object.assign({},G,{
    i:0,card:-1
  })));
  lss('_snap',q)
}

function endRec(n){const e=lsg('_end',[]);if(!e.includes(n)){e.push(n);lss('_end',e)}}
// شرط الخطوة: 'علم' | '!علم' | 'y<4' | 's>=7' (ثقة ياسمين/سامي). يُكتب في العنصر الثالث للسطر أو في f: للخطوات الأخرى
function cond(c){
  const m=/^(y|s)(<|>=)(\d+)$/.exec(c);
  if(m){const v=G[m[1]];return m[2]==='<'?v<+m[3]:v>=+m[3]}
  return c[0]==='!'?!G.f[c.slice(1)]:!!G.f[c]
}

/* ═══════════ 4) عناصر الواجهة الأساسية ═══════════
   النوافذ المنبثقة، الإشعارات، دفتر الأدلة */

function ov(h){const e=$('#ov');if(!h){e.hidden=true;e.innerHTML='';return}e.innerHTML=h;e.hidden=false}

function toast(t){
  const e=$('#toast');
  e.textContent=t;
  e.style.opacity=1;
  setTimeout(()=>e.style.opacity=0,1600)
}

// دفتر الأدلة كطبقة مستقلة: يفتح من ☰ أو من داخل اللغز دون إغلاقه (الأحدث أولا)
// سجل الحوار (آخر 40 سطرا في الجلسة): يُملأ من حدث line ويُعرض 15 منها
const HIST=[];
Engine.on('line',s=>{
  if(!Array.isArray(s)||!s[1])return;
  const e=$('#nm'),L=HIST[HIST.length-1];
  if(L&&L.t===s[1])return;
  HIST.push({n:e?e.textContent:'',c:e?e.style.color:'',t:s[1]});
  if(HIST.length>40)HIST.shift()
});
// طبقة قائمة فوق اللعبة دون إغلاق ما تحتها (دفتر الأدلة، سجل الحوار)
function layer(id,title,rows,empty,bottom){
  let d=$('#'+id);
  if(d){d.remove();return}
  d=document.createElement('div');
  d.id=id;
  d.setAttribute('role','dialog');
  d.setAttribute('aria-modal','true');
  d.innerHTML=`<div class="pz"><h3>${title}</h3><ul class="jl">${rows.length?rows.join(''):`<li>${empty}</li>`}</ul><button class="btn">${TR('jn.close')}</button></div>`;
  d.onclick=x=>{if(x.target===d||x.target.tagName==='BUTTON')d.remove()};
  document.body.appendChild(d);
  const p=d.querySelector('.pz');
  if(bottom)p.scrollTop=p.scrollHeight;
  d.querySelector('button').focus()
}
// دفتر الأدلة (الأحدث أولا)
function jnl(){
  const a=(G&&G.j)||[];
  layer('jn',`${TR('jn.h')} (${D(a.length)})`,a.slice().reverse().map(x=>`<li>${x}</li>`),TR('jn.none'))
}
function hist(){
  layer('hs',TR('hs.h'),HIST.slice(-15).map(h=>`<li><b style="color:${h.c}">${h.n}</b> ${h.t}</li>`),TR('hs.none'),1)
}

/* ═══════════ 5) الصوت والأجواء ═══════════
   انتقل إلى الملف audio.js (يُحمَّل قبل المحرك). */
/* ═══════════ 6) المشهد والكاميرا والشخصيات ═══════════
   توزيع الشخصيات على أرض كل مشهد، انعكاس الأضواء، الكاميرا، المشي */

const LIGHTS={};

let LX={a:.83,y:.5,s:.17},LY={a:200,y:200,s:200},XT={in:{},out:{}};

function stage(ch){
  const[cx0,fy0,fh0]=SC2[ch.bg]||SC2.roof,gc=G?G.c:0,t=STG[gc]||String(gc%3),lay=ch.lay!=null?ch.lay:+t[0],cs=(ch.cast&&ch.cast.join?ch.cast.join(''):t.slice(1))||'ays';
const ord=(lay===1?'yas':'ays').split('').filter(k=>(cs.includes(k)||XT.in[k])&&!XT.out[k]),n=ord.length,sp=(lay===2?.28:lay===1?.30:.25)*(ch.bg==='studio'?.88:1);
let xs=ord.map((k,i)=>cx0+(i-(n-1)/2)*sp);
  const sh=Math.max(0,.2-Math.min(...xs))-Math.max(0,Math.max(...xs)-.82);
  xs=xs.map(x=>x+sh);
['a','y','s'].forEach(k=>{
    const w=$('#w_'+k);
    if(!w)return;
    const i=ord.indexOf(k);
    if(i<0){
      w.style.display='none';
      return
    }
// صفّان على الأرض: قريب (أكبر وأدنى) وبعيد (أصغر وأعلى) وقدما كل شخصية تبقيان على أرض المشهد
    const far=lay!==2&&((lay===0&&n===3&&i===1)||(lay===1&&i%2===1));
    let fy=far?fy0:fy0+.018,fh=far?fh0*.92:fh0*1.04;
    if(lay===2){
      fy=.93;
      fh=Math.min(.6,fh0*1.4)
    }
    w.classList.toggle('far',far);
    w.style.display='';
    w.style.setProperty('--x',xs[i]*100+'%');
    w.style.setProperty('--b',(1-fy)*100+'%');
    w.style.setProperty('--h',fh*100+'%');
    LX[k]=xs[i];
    LY[k]=(fy-fh*.5)*300
  });
  rim(ch)
}

// انعكاس ضوء أقرب مصدر ضوء على حافة الشخصية (دافئ أو أزرق)
function rim(ch){
  const A=LIGHTS[ch.bg]||[];
  ['a','y','s'].forEach(k=>{
    const w=$('#w_'+k);
    if(!w)return;
    let best=null,bs=0;
    const cx=LX[k]*400,cy=LY[k];
A.forEach(l=>{
      const d=Math.hypot(l.x-cx,l.y-cy),st=Math.max(0,1-d/170)*(.6+Math.min(1,l.r/45)*.6);
      if(st>bs){
        bs=st;
        best=l
      }
    });
if(!best||bs<.12){w.classList.remove('rim');return}
const warm=best.c===1,a=Math.min(.85,.35+bs*.6),col=warm?'255,170,70':'60,220,255';
w.style.setProperty('--rx',(best.x>cx?1:-1)*(2+bs*4)+'px');
    w.style.setProperty('--rc','rgba('+col+','+a+')');
    w.style.setProperty('--rd','rgba('+col+','+(a*.4)+')');
    w.style.setProperty('--rt',(2+Math.random()*1.6).toFixed(2)+'s');
    w.classList.add('rim')
  })
}

function wide(){cam(1,0,0);$('#sc').classList.remove('lb')}

function cam(z,x,y,fx){
  const c=$('#cam'),sc=$('#sc'),mx=(z-1)*sc.clientWidth/2*.9,my=(z-1)*sc.clientHeight/2*.9;
  x=Math.max(-mx,Math.min(mx,x));
  y=Math.max(-my,Math.min(my,y));
  c.style.setProperty('--cz',z);
  c.style.setProperty('--cx',x+'px');
  c.style.setProperty('--cy',y+'px');
  if(fx){
    c.classList.remove(fx);
    void c.offsetWidth;
    c.classList.add(fx);
    c.onanimationend=()=>c.classList.remove(fx)
  }
}

const place=x=>{
  const k=x.id.slice(2);
  x.style.setProperty('--ex',EN[k][0]);
  x.style.setProperty('--ey',EN[k][1])
};

function hideAll(){document.querySelectorAll('#ch svg').forEach(x=>{place(x);x.classList.add('ent')})}

function walk(add,cb){
  document.querySelectorAll('#ch svg').forEach((x,i)=>{
    place(x);
    setTimeout(()=>{
      x.classList.add('wk');
      x.classList.toggle('ent',add);
      setTimeout(()=>x.classList.remove('wk'),900)
    },i*350)
  });
  setTimeout(cb,1700)
}


function direct(s){const t=s[1],w=s[0],e=w!=='n'&&$('#c_'+w);let z=1,x=0,y=0,fx='';
if(e){x=Math.max(-70,Math.min(70,$('#sc').clientWidth*(.5-LX[w])*.5));z=1.14;y=-6}
if(RX.open.test(t)){z=1.28;x*=.4}
if(RX.down.test(t)){y=-22;z=1.1}
if(/!/.test(t))fx='pu';
if(RX.fear.test(t)){fx='sk';z=Math.max(z,1.2)}
$('#sc').classList.toggle('lb',w==='n');cam(z,x,y,fx)}

function scene(b){
  ambSet(b);
  const s=S[b];
  if(curBg!==b){
    curBg=b;
    $('#bgs').innerHTML=IMG['b_'+b]?imgBg(b):BG[b];
    Engine.emit('scene',b)
  }
  $('#sc').style.background=`linear-gradient(${s[0]},${s[1]})`;
  const o=OV[b]||IMG['b_'+b],tn=IMG['b_'+b]?TONE[b]:.85,scn=$('#sc');
  scn.style.setProperty('--tn',tn);
  $('#glow').style.opacity=o?0:s[2];
  $('#moon').style.opacity=o?0:s[3]
}

function hud(){
  $('#ct').textContent=`${D(G.c+1)}/${D(C.length)}`;
  $('#ct').title=GAME.partOf(G.c);
  $('#ty').style.width=G.y*10+'%';
  $('#ts').style.width=G.s*10+'%';
  const ch=C[G.c],n=ch?ch.st.length:1,pc=Math.round(Math.min(G.i,n)/n*100);
  $('#pg i').style.width=pc+'%';
  $('#pg').setAttribute('aria-valuenow',pc);
  document.body.classList.toggle('low',G.y<4||G.s<4);
  setBeat(G.y<4||G.s<4);
  trustMood()
}

/* ═══════════ 7) لغة وصف المشهد ═══════════
   خطوة {x:"أمر؛ أمر"}: enter/exit، cam، lights، flash، wait، ويمكن إضافة أوامر عبر Engine.ops */

// enter k / exit k: دخول أو خروج شخصية بالمشي (k = a أو y أو s)، go k x: امشِ إلى موضع x (0 إلى 1)
// cam in|down|shake|punch: حركة كاميرا، lights off|dim|on: إضاءة المشهد، flash: ومضة، wait ms: انتظار
const sl=ms=>new Promise(r=>setTimeout(r,ms));

async function runX(str){nx=0;rd=0;$('#dl').classList.remove('rd');
for(const c of str.split(';').map(x=>x.trim()).filter(Boolean)){
    const[op,a,b]=c.split(/\s+/),w=$('#w_'+a),v=w&&w.querySelector('svg');
if(Engine.ops[op]){await Engine.ops[op](a,b,c);continue}
if(op==='enter'&&v){
      XT.in[a]=1;
      delete XT.out[a];
      place(v);
      v.classList.add('ent');
      stage(C[G.c]);
      await sl(60);
      v.classList.add('wk');
      steps();
      v.classList.remove('ent');
      await sl(900);
      v.classList.remove('wk')
    }
else if(op==='exit'&&v){
      place(v);
      v.classList.add('wk','ent');
      steps();
      await sl(900);
      v.classList.remove('wk');
      XT.out[a]=1;
      stage(C[G.c])
    }
else if(op==='go'&&v){
      v.classList.add('wk');
      steps();
      w.style.setProperty('--x',+b*100+'%');
      LX[a]=+b;
      await sl(900);
      v.classList.remove('wk')
    }
else if(op==='cam')camS(a)||cam(a==='in'?1.3:a==='down'?1.1:1,0,a==='down'?-20:0,a==='shake'?'sk':a==='punch'?'pu':'');
else if(op==='lights'){
      const sc=$('#sc');
      sc.classList.toggle('dark',a==='off');
      sc.classList.toggle('dim',a==='dim');
      lightSnd(a)
    }
else if(op==='flash')(boom(),$('#cam')).animate([{filter:'brightness(3)'},{filter:'none'}],{duration:380});
else if(op==='wait')await sl(+a||500)}
adv()}

/* ═══════════ 8) الحوار وتدفق القصة ═══════════
   الكتابة الحرفية، التقدّم، تنفيذ خطوات الفصل */

function typ(t){
  $('#sr').textContent=t;
  clearInterval(T);
  rd=0;
  $('#dl').classList.remove('rd');
  let i=0;
  const e=$('#tx');
  e.textContent='';
  TT=t;
  $('#ch').classList.add('tk');
  T=setInterval(()=>{
    e.textContent=t.slice(0,++i);
    if(i>=t.length){
      clearInterval(T);
      T=0;
      $('#ch').classList.remove('tk');
      rd=1;
      $('#dl').classList.add('rd')
    }
  },TS)
}

function adv(){G.i++;sv();step()}

function step(){
const ch=C[G.c];if(!ch)return endScr();
if(G.i===0&&G.card!==G.c){
    G.card=G.c;
    snapSave();
    Engine.emit('chapter',G.c);
    cam(1,0,0);
    scene(ch.bg);
    stage(ch);
    hud();
    ov(`<div class="card">${Engine.fill('card:extra',G.c)}<p>${TR('menu.chapter').replace('{n}',D(G.c+1))}</p><h2>${ch.t}</h2></div>`);
    XT={
      in:{},out:{}
    };
    $('#sc').classList.remove('dark','dim');
    AMV=1;
    ambSet(AMB_B);
    hideAll();
    setTimeout(()=>{
      ov();
      walk(false,step)
    },1900);
    return
  }
const s=ch.st[G.i];if(!s){wide();walk(true,()=>{G.c++;G.i=0;sv();step()});return}
scene(ch.bg);stage(ch);hud();$('#cx').innerHTML='';
if(!Array.isArray(s)&&s.f&&!cond(s.f)){G.i++;return step()}
if(s.x!=null)return runX(s.x);
if(Array.isArray(s)){if(s[2]&&!cond(s[2])){G.i++;return step()}
const [nm,col]=N[s[0]];$('#nm').textContent=nm;$('#nm').style.color=col;
['a','y','s'].forEach(k=>{
      const e=$('#c_'+k);
      e.classList.toggle('on',k===s[0]);
      e.classList.toggle('al',k===s[0]&&/[!?؟]/.test(s[1]))
    });
const t=s[1],rx=/!/.test(t)?'jp':/\u061f/.test(t)?'tl':RX.fear.test(t)?'sh':'';
    document.querySelectorAll('#ch svg').forEach(x=>x.classList.remove('jp','tl','sh'));
    void $('#ch').offsetWidth;
    if(rx)(s[0]==='n'?document.querySelectorAll('#ch svg'):[$('#c_'+s[0])]).forEach(x=>x.classList.add(rx));
    const sc=$('#sc');
    sc.classList.remove('qk');
    void sc.offsetWidth;
    if(RX.knock.test(t)){
      sc.classList.add('qk');
      thump()
    }
$('#tx').style.color=s[0]==='n'?'#b9c0d8':'var(--ink)';direct(s);express(s);Engine.emit('line',s);typ(s[1]);nx=adv;return}
if(s.c){wide();$('#nm').textContent='';$('#tx').textContent=TR('ui.decision');nx=0;rd=0;
s.c.forEach(o=>{
      const b=document.createElement('button');
      b.textContent=o[0];
      b.onclick=()=>{
        for(const k in o[1]){
          trust(k,o[1][k]);
          const e=$('#c_'+k);
          if(e){
            e.classList.remove('jp','sh');
            void e.getBoundingClientRect();
            e.classList.add(o[1][k]>0?'jp':'sh');
            setEx(e,o[1][k]>0?'joy':'sad')
          }
        }
        if(o[2])G.f[o[2]]=1;
        hud();
        $('#cx').innerHTML='';
        setTimeout(adv,750)
      };
      $('#cx').appendChild(b)
    });
    return
  }
if(s.p){nx=0;wide();return puz(s.p)}
if(s.j){if(!G.j.includes(s.j)){G.j.push(s.j);toast(TR('ui.newClue'))}G.i++;sv();return step()}}

/* ═══════════ 9) الألغاز ═══════════
   سجل الألغاز Engine.puzzles (seq، ord، code) + الفوز والتلميحات المدرّجة */
function win(p,f){
  chime(f<2);
  if(f>0)G.err=(G.err||0)+1;   // أي خطأ أو تخطّي يُسقط النهاية السرية
  const e=$('#ps');
  if(e)e.textContent=f>1?TR('ui.success'):TR('ui.successTrust');
  for(const k in p.r)trust(k,f>1?0:p.r[k]);
  Engine.emit('puzzle:won',p,f);
  setTimeout(()=>{
    ov();
    Engine.gate('puzzle:won',{p,f,chapter:G.c+1},adv)
  },900)
}
// مؤقتات اللغز قد تنتهي بعد إغلاقه (تخطي مثلا) لذلك say آمنة
const say=t=>{const e=$('#ps');if(e)e.textContent=t};
Engine.puzzles.seq=(p,c)=>{
  ov(`<div class="pz"><h3>${p.t}</h3><div class="pads">${p.pads.map((x,i)=>`<button class="pad" data-i="${i}">${x}</button>`).join('')}</div><p id="ps"></p></div>`);
  const B=[...document.querySelectorAll('.pad')];
  const fl=i=>{if(!B[i])return;B[i].classList.add('lit');tone(F[i]);setTimeout(()=>B[i].classList.remove('lit'),350)};
  const play=()=>{
    c.busy=1;c.pos=0;
    say(TR('puz.listenCarefully'));
    p.q.forEach((q,k)=>setTimeout(()=>{
      fl(q);
      if(k===p.q.length-1)setTimeout(()=>{c.busy=0;say(TR('puz.yourTurn'))},500)
    },700+k*700))
  };
  B.forEach(b=>b.onclick=()=>{
    if(c.busy)return;
    const i=+b.dataset.i;
    fl(i);
    if(i===p.q[c.pos]){
      if(++c.pos===p.q.length){c.busy=1;win(p,c.f)}
    }else{
      c.f++;c.busy=1;
      say(hint(c.f,p,TR('puz.wrongListen')));
      setTimeout(play,1600)
    }
  });
  play()
};
// لغز الترتيب: اضغط العناصر بالترتيب الصحيح (p.o العناصر، p.a فهارس الترتيب الصحيح)
Engine.puzzles.ord=(p,c)=>{
  ov(`<div class="pz"><h3>${p.t}</h3><p>${p.cl}</p><div class="ordw">${p.o.map((x,i)=>`<button class="pad" data-i="${i}">${x}</button>`).join('')}</div><p id="ps"></p></div>`);
  const B=[...document.querySelectorAll('.pad')];
  B.forEach(b=>b.onclick=()=>{
    const i=+b.dataset.i;
    tone(300,.1);
    if(i===p.a[c.pos]){
      b.disabled=true;b.classList.add('lit');
      b.textContent=D(c.pos+1)+'. '+p.o[i];
      if(++c.pos===p.a.length)win(p,c.f)
    }else{
      c.f++;c.pos=0;
      B.forEach((x,k)=>{x.disabled=false;x.classList.remove('lit');x.textContent=p.o[k]});
      say(hint(c.f,p,TR('puz.wrongOrder')))
    }
  })
};
// لغز الاختيار بالدليل: كل خيار له زر استماع (نبضات بفاصل x.iv) وزر اختيار؛ الجواب p.a
Engine.puzzles.pick=(p,c)=>{
  ov(`<div class="pz"><h3>${p.t}</h3><p>${p.cl}</p><div class="ordw">${p.o.map((x,i)=>`<div class="pk"><button class="pad pl" data-i="${i}" aria-label="${TR('ui.listen')}">🔊</button><button class="pad ch" data-i="${i}">${x.t}</button></div>`).join('')}</div><p id="ps"></p></div>`);
  document.querySelectorAll('.pl').forEach(b=>b.onclick=()=>{
    const x=p.o[+b.dataset.i];
    [0,1,2].forEach(k=>setTimeout(()=>ps(70,40,.3,.22,'sine',.5),k*x.iv*400))
  });
  document.querySelectorAll('.ch').forEach(b=>b.onclick=()=>{
    const i=+b.dataset.i;
    if(i===p.a)return win(p,c.f);
    c.f++;
    b.disabled=true;
    say(hint(c.f,p,TR('puz.wrongEcho')))
  })
};
// لغز الرمز الرقمي (الافتراضي لأي نوع غير معروف)
Engine.puzzles.code=(p,c)=>{
  ov(`<div class="pz"><h3>${p.t}</h3><p>${p.cl}</p><div id="dg"></div><div class="kp">${[1,2,3,4,5,6,7,8,9,'⌫',0,'✔'].map(k=>`<button class="pad" data-k="${k}">${typeof k==='number'?D(k):k}</button>`).join('')}</div><p id="ps"></p></div>`);
  const sh=()=>{const e=$('#dg');if(e)e.textContent=c.inp.padEnd(p.a.length,'·')};
  sh();
  document.querySelectorAll('.pad').forEach(b=>b.onclick=()=>{
    const k=b.dataset.k;
    tone(300,.1);
    if(k==='⌫')c.inp=c.inp.slice(0,-1);
    else if(k==='✔'){
      if(c.inp===p.a)return win(p,c.f);
      c.f++;c.inp='';
      say(hint(c.f,p,TR('puz.wrongCode')))
    }else if(c.inp.length<p.a.length)c.inp+=k;
    sh()
  })
};
function puz(p){(Engine.puzzles[p.k]||Engine.puzzles.code)(p,{f:0,busy:1,pos:0,inp:''})}

// تلميحات مدرّجة: خطأ أول = رسالة عامة، ثان = راجعوا الدفتر، ثالث فأكثر = التلميح الكامل
function hint(f,p,base){
  if(f>=4&&!$('#sk')){
    const z=$('#ov .pz');
    if(z){
      const b=document.createElement('button');
      b.id='sk';
      b.className='btn';
      b.textContent=TR('skip.p');
      b.onclick=()=>win(p,9);
      z.appendChild(b)
    }
  }
  return f<2?base:f===2?TR('hint.j'):TR('ui.hintPrefix')+p.h}

/* ═══════════ 10) النهايات ═══════════
   شاشة النهاية، شرح السبب، «جرّب قراراً آخر»، المشاركة، البدء والإعادة */

function endScr(){
  const e=ending();
  endSnd(e[3]);
  endRec(e[3]);
  scene(e[2]);
  const show=()=>{ov(`<div class="card"><p>${e[3]===6?TR('end.secretLabel'):TR('end.normalLabel').replace('{n}',D(e[3]))}</p><h2>${e[0]}</h2><p>${e[1]}</p>${why(e[3])}${retryBtn()}<button class="btn" onclick="shareEnd()">${TR('share.b')}</button><button class="btn" onclick="rst()">${TR('hud.restart')}</button><button class="btn" onclick="endsUI()">${TR('ui.endGallery')}</button></div>`);Engine.emit('ending:shown',e[3])}
  Engine.emit('ending',e);
  Engine.gate('ending',{n:e[3],e},show)
}

function start(g){aud();G=g;ov();step()}

function rst(){try{localStorage.removeItem(K)}catch(e){}start(nw())}

// شرح سبب النهاية (يطابق شروط ending() في story.js)
function why(n){
  const y=G.y,s=G.s,f=G.f||{},lo=[];
  if(y<4)lo.push(TR('name.y')+' ('+y+'/10)');
  if(s<4)lo.push(TR('name.s')+' ('+s+'/10)');
  let m;
if(n===5)m=TR('why.low').replace('{n}',lo.join(' و '));
  else if(n===3)m=TR('why.destroy');
  else if(n===2)m=TR('why.guard');
  else if(n===6)m=TR('why.secret');
  else if(n===1)m=TR('why.release')+' '+TR('why.secrethint');
  else m=f.release?TR('why.rel_low'):TR('why.none');
return `<p class="why"><b>${TR('why.h')}</b><br>${m}<br><small>${TR('why.tip')} (${TR('name.y')} ${D(y)}/10 · ${TR('name.s')} ${D(s)}/10)</small></p>`
}

// «جرّب قراراً آخر»: العودة لبداية فصل القرار الأخير (أول فصل فيه خيار destroy) من اللقطة المحفوظة
const decIdx=()=>C.findIndex(c=>JSON.stringify(c.st).includes('"destroy"'));

function retryBtn(){
  const q=lsg('_snap',{});
  return q[decIdx()]?`<button class="btn" onclick="retryEnd()">${TR('retry.b')}</button>`:''
}

function retryEnd(){const q=lsg('_snap',{}),s=q[decIdx()];if(s)start(JSON.parse(JSON.stringify(s)))}

// مشاركة النتيجة: قائمة المشاركة إن وُجدت، وإلا نسخ للحافظة
function shareEnd(){
  const e=ending(),t=(e[3]===6?TR('share.secret'):TR('share.t').replace('{n}',e[3])).replace('{g}',TR('game.homeTitle')).replace('{e}',e[0])+(location.protocol.indexOf('http')===0?' '+location.href.split('#')[0]:'');
  if(navigator.share)navigator.share({text:t}).catch(()=>{});
  else if(navigator.clipboard)navigator.clipboard.writeText(t).then(()=>toast(TR('copied')),()=>toast(t));
  else toast(t)}

/* ═══════════ 11) الصور ═══════════
   تحميل الصور (أساسي + كسول) واكتشاف الأضواء. أدوات الاستيراد والمعالجة في studio.js */

const SLAB="<defs><linearGradient id='trg' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#2c3b4b'/><stop offset='1' stop-color='#0d141c'/></linearGradient></defs><path fill='url(#trg)' d='M0 300V236Q200 226 400 236V300Z'/><path d='M0 236Q200 226 400 236' stroke='#5b7186' stroke-width='1.2' fill='none' opacity='.7'/><path stroke='#0a1118' stroke-width='1' opacity='.6' d='M0 262H400M70 236L40 300M170 232L150 300M270 232L290 300M370 236L410 300'/>";

const SLOTS=[...Object.keys(N).map(k=>['c_'+k,N[k][0]]),...MAPB.map(([k,n])=>['b_'+k,TR('studio.background')+': '+n])];

const DUSTG='<g fill=\'#cfe9ff\'>'+[[60,270,0],[130,250,2],[200,280,4],[270,240,1],[330,265,3],[370,230,5]].map(d=>`<circle class='du' cx='${d[0]}' cy='${d[1]}' r='1.6' style='animation-delay:-${d[2]}s'/>`).join('')+'</g>';

// --- وحدة مستقلة قابلة لإعادة الاستعمال: اكتشاف الأضواء في أي صورة وتحريكها ---
// دفئ (فوانيس، مصابيح، نوافذ) وأزرق (أنابيب، حلقات): يعيد مصفوفة {x,y,r,c} بإحداثيات 400x300
function findLights(src){
  return new Promise(ok=>{
    const im=new Image();
    im.onload=()=>{
      const W=160,H=Math.max(1,Math.round(W*im.height/im.width)),c=document.createElement('canvas');
      c.width=W;
      c.height=H;
      const x=c.getContext('2d',{
        willReadFrequently:true
      });
      x.drawImage(im,0,0,W,H);
      const d=x.getImageData(0,0,W,H).data,t=new Uint8Array(W*H);
for(let i=0;i<W*H;i++){
        const r=d[i*4],g=d[i*4+1],b=d[i*4+2],mx=Math.max(r,g,b),mn=Math.min(r,g,b);
        if(mx<180)continue;
        const dl=mx-mn,s=dl/mx;
        let h=mx===r?((g-b)/dl)%6:mx===g?(b-r)/dl+2:(r-g)/dl+4;
        h*=60;
        if(h<0)h+=360;
if(s>.35&&h>=12&&h<=58)t[i]=1;else if(mx>225&&s>.2&&h>=165&&h<=205)t[i]=2}
const seen=new Uint8Array(W*H),L=[];
for(let i=0;i<W*H;i++){if(!t[i]||seen[i])continue;const k=t[i],st=[i];seen[i]=1;let n=0,sx=0,sy=0;
while(st.length){
          const j=st.pop();
          n++;
          sx+=j%W;
          sy+=(j/W)|0;
          for(const q of[j-1,j+1,j-W,j+W])if(q>=0&&q<W*H&&!seen[q]&&t[q]===k&&Math.abs(q%W-j%W)<2){
            seen[q]=1;
            st.push(q)
          }
        }
if(n>=3&&n<=500)L.push({k,n,x:sx/n/W,y:sy/n/H})}
L.sort((a,b)=>b.n-a.n);
      const pick=[...L.filter(l=>l.k===1).slice(0,8),...L.filter(l=>l.k===2).slice(0,4)],sc=Math.max(400/im.width,300/im.height),ox=(400-im.width*sc)/2,oy=(300-im.height*sc)/2;
ok(pick.map(l=>({
        x:ox+l.x*im.width*sc,y:oy+l.y*im.height*sc,r:Math.min(70,Math.max(16,Math.sqrt(l.n)*5)),c:l.k
      })))
    };
    im.src=src
  })
}

function glow(b,cold){
  const A=LIGHTS[b]||[];
  if(!A.length)return `<rect class='lf${cold?' cd2':''}' width='400' height='300' fill='url(#l${b})'/>`;
return A.map((l,i)=>`<circle class='lg${l.c===2?' cd':''}' cx='${l.x.toFixed(1)}' cy='${l.y.toFixed(1)}' r='${l.r.toFixed(1)}' fill='url(#${l.c===2?'k':'w'}${b})' style='animation-duration:${(1.7+(i*.37)%1.6).toFixed(2)}s;animation-delay:-${(i*.53).toFixed(2)}s'/>`).join('')
}

const imgChar=k=>{
  const u=IMG['c_'+k],im=(c,cls)=>`<image class='${cls}' clip-path='url(#${c}${k})' href='${u}' width='60' height='92' preserveAspectRatio='xMidYMax meet'/>`;
return `<svg id='c_${k}' class='img' viewBox='0 0 60 92' style='--c:${N[k][1]}'><defs><clipPath id='cu${k}'><rect width='60' height='48.4'/></clipPath><clipPath id='cl${k}'><rect y='47.6' width='30.2' height='45'/></clipPath><clipPath id='cr${k}'><rect x='29.8' y='47.6' width='30.2' height='45'/></clipPath></defs><ellipse cx='30' cy='90.8' rx='17' ry='2.4' fill='#000' opacity='.55' style='filter:blur(1.2px)'/><image class='fl' href='${u}' width='60' height='92' preserveAspectRatio='xMidYMax meet'/>${im('cu','up')}${im('cl','lL')}${im('cr','lR')}</svg>`
};

const imgBg=b=>{
  const cold=S[b][2],cl=cold?'#35e6ff':'#ffb454';
  return svgWrap(`<defs><radialGradient id='v${b}'><stop offset='.55' stop-color='#000' stop-opacity='0'/><stop offset='1' stop-color='#000' stop-opacity='.65'/></radialGradient><radialGradient id='l${b}' cx='.5' cy='.35'><stop offset='0' stop-color='${cl}' stop-opacity='.55'/><stop offset='1' stop-color='${cl}' stop-opacity='0'/></radialGradient><radialGradient id='w${b}'><stop offset='0' stop-color='#ffb454' stop-opacity='.85'/><stop offset='1' stop-color='#ffb454' stop-opacity='0'/></radialGradient><radialGradient id='k${b}'><stop offset='0' stop-color='#35e6ff' stop-opacity='.7'/><stop offset='1' stop-color='#35e6ff' stop-opacity='0'/></radialGradient></defs><image class='kb' href='${IMG['b_'+b]}' width='400' height='300' preserveAspectRatio='xMidYMid slice'/>${b==='roof'?SLAB:''}${glow(b,cold)}${DUSTG}<rect width='400' height='300' fill='url(#v${b})'/>`)
};

const DB=()=>new Promise((ok,no)=>{
  const r=indexedDB.open(GAME.id+'_img',1);
  r.onupgradeneeded=()=>r.result.createObjectStore('i');
  r.onsuccess=()=>ok(r.result);
  r.onerror=()=>no()
});

const dbGet=async k=>{
  try{
    const d=await DB();
    return await new Promise(r=>{
      const q=d.transaction('i').objectStore('i').get(k);
      q.onsuccess=()=>r(q.result);
      q.onerror=()=>r()
    })
  }catch(e){}
};

const dbSet=async(k,v)=>{
  try{
    const d=await DB();
    const s=d.transaction('i','readwrite').objectStore('i');
    v?s.put(v,k):s.delete(k)
  }catch(e){}
};

async function loadImgs(){
  for(const [k] of SLOTS){
    const v=(await dbGet(k))||DEF[k];
    if(v)IMG[k]=v;
    else delete IMG[k]
  }
  for(const [k] of SLOTS)if(k[0]==='b')LIGHTS[k.slice(2)]=IMG[k]?await lightsCached(IMG[k]):[];
  curBg=null;
  await loadExp();
  buildChars()
}

function buildChars(){
  $('#ch').innerHTML=['a','y','s'].map(k=>`<div class='cw' id='w_${k}'>${IMG['c_'+k]?imgChar(k):CHR[k]||fig(k)}</div>`).join('');
  stage(C[G?G.c:0]||C[0]);
  try{
    ['a','y','s'].forEach(k=>{
      delete HD[k];
      headFind(k)
    })
  }catch(e){}
}

// تحميل images2.js بعد ظهور الشاشة الأولى ثم تفعيل الصور الجديدة دون إعادة بناء المشهد
async function loadMore(){if(window.__more)return;window.__more=1;
await new Promise(r=>{
    const s=document.createElement('script');
    s.src='images2.js';
    s.onload=r;
    s.onerror=r;
    document.head.appendChild(s)
  });
if(typeof MORE==='undefined')return;Object.assign(DEF,MORE);
for(const k in MORE){
    const v=(await dbGet(k))||MORE[k];
    IMG[k]=v;
    if(k[0]==='b')LIGHTS[k.slice(2)]=await lightsCached(v)
  }
await loadExp();const cb=curBg;if(cb&&MORE['b_'+cb]){curBg=null;scene(cb)}}

// حساب الأضواء ثقيل: نحفظ نتيجته لكل صورة (المفتاح من طول الصورة وآخرها)
async function lightsCached(src){
  const k='lt_'+src.length+'_'+src.slice(-20);
  try{
    const c=localStorage.getItem(k);
    if(c)return JSON.parse(c)
  }catch(x){}
  const r=await findLights(src);
  try{
    localStorage.setItem(k,JSON.stringify(r))
  }catch(x){}
  return r
}
/* ═══════════ 12) تعابير الوجوه ═══════════
   تبديل تعابير الشخصيات حسب مشاعر السطر */

const EXN=['joy','sad','angry','fear','surprise'],EXA={
  joy:TR('emo.joy'),sad:TR('emo.sad'),angry:TR('emo.angry'),fear:TR('emo.fear'),surprise:TR('emo.surprise')
},HD={};

const ER=[['fear',RX.fear],['angry',RX.angry],['sad',RX.sad],['joy',RX.joy]];

function emo(t){
  for(const[k,r]of ER)if(r.test(t))return k;
  if(/!/.test(t)&&t.length<50)return'surprise';
  if(RX.question.test(t)&&t.length<60)return'think';
  return''
}

function headFind(k){
  return new Promise(ok=>{
    const u=IMG['c_'+k];
    if(!u)return ok();
    const im=new Image();
    im.onload=()=>{
      const W=120,H=Math.max(1,Math.round(im.height*W/im.width)),c=document.createElement('canvas');
      c.width=W;
      c.height=H;
      const x=c.getContext('2d',{
        willReadFrequently:true
      });
      x.drawImage(im,0,0,W,H);
      const a=x.getImageData(0,0,W,H).data,row=y=>{
        let n=0;
        for(let i=0;i<W;i++)if(a[(y*W+i)*4+3]>60)n++;
        return n
      };
      let t=-1,b=0;
      for(let y=0;y<H;y++)if(row(y)>1){
        if(t<0)t=y;
        b=y
      }
      if(t<0)return ok();
      const fh=b-t,xs=[];
      for(let y=t;y<=t+Math.max(2,fh*.12);y++)for(let i=0;i<W;i++)if(a[(y*W+i)*4+3]>60)xs.push(i);
      xs.sort((p,q)=>p-q);
      const sc=Math.min(60/im.width,92/im.height),k2=sc*im.width/W,ox=(60-im.width*sc)/2,oy=92-im.height*sc;
      HD[k]={
        x:ox+xs[xs.length>>1]*k2,y:oy+t*k2,h:fh*k2*.17
      };
      ok()
    };
    im.onerror=()=>ok();
    im.src=u
  })
}

function exMark(k,e){
  const h=HD[k]||{
    x:30,y:8,h:14


  },x=h.x,t=h.y,H=h.h,w=H*.8,f=n=>n.toFixed(1),T=(dx,dy,sc)=>`translate(${f(x+dx)} ${f(t+dy)}) scale(${f(sc)})`,st=`<path class='tw' d='M0-1.8L.5-.5 1.8 0 .5 .5 0 1.8-.5 .5-1.8 0-.5-.5Z' fill='#ffe27a'/>`,gl=c=>`<path d='M${f(x-w*.3)} ${f(t+H*.08)}v${f(H*.28)}M${f(x)} ${f(t+H*.04)}v${f(H*.32)}M${f(x+w*.3)} ${f(t+H*.08)}v${f(H*.28)}' stroke='${c}' stroke-width='.45' opacity='.7' fill='none'/>`,ck=`<ellipse cx='${f(x-w*.32)}' cy='${f(t+H*.64)}' rx='${f(H*.15)}' ry='${f(H*.07)}' fill='#ff6b8a' opacity='.5'/><ellipse cx='${f(x+w*.32)}' cy='${f(t+H*.64)}' rx='${f(H*.15)}' ry='${f(H*.07)}' fill='#ff6b8a' opacity='.5'/>`;
if(e==='joy')return ck+`<g transform='${T(w*.8,H*.05,H/12)}'>${st}</g><g transform='${T(-w*.85,H*.3,H/16)}'>${st}</g>`;
if(e==='sad')return gl('#222a55')+`<path d='M${f(x-w*.3)} ${f(t+H*.66)}q-.4 ${f(H*.2)} 0 ${f(H*.38)}M${f(x+w*.3)} ${f(t+H*.66)}q.4 ${f(H*.2)} 0 ${f(H*.38)}' stroke='#8fd8ff' stroke-width='.55' fill='none' stroke-linecap='round'/>`;
if(e==='angry')return `<g transform='${T(w*.75,H*.12,H/10)}'><path d='M0-2.2Q1-1 2.2 0M0-2.2Q-1-1-2.2 0M0 2.2Q1 1 2.2 0M0 2.2Q-1 1-2.2 0' stroke='#ff3030' stroke-width='1.1' fill='none' stroke-linecap='round'/></g>`;
if(e==='fear')return gl('#3a2f6b')+`<g transform='${T(w*.7,H*.3,H/9)}'><path d='M0-2Q1.6 .2 1.6 1.2A1.6 1.6 0 0 1-1.6 1.2Q-1.6 .2 0-2Z' fill='#cfefff' stroke='#6bb7e6' stroke-width='.3'/></g>`;
if(e==='surprise')return `<path d='M${f(x)} ${f(t-H*.1)}v${f(-H*.25)}M${f(x-w*.5)} ${f(t-H*.05)}l${f(-H*.15)} ${f(-H*.2)}M${f(x+w*.5)} ${f(t-H*.05)}l${f(H*.15)} ${f(-H*.2)}' stroke='#fff' stroke-width='.6' stroke-linecap='round' fill='none'/><g transform='${T(w*.85,H*.1,H/9)}'><rect x='-.6' y='-2.8' width='1.2' height='3.6' rx='.5' fill='#ff4d6d'/><circle cy='2' r='.7' fill='#ff4d6d'/></g>`;
if(e==='think')return `<g transform='${T(w*.95,-H*.05,H/10)}'><ellipse rx='2.8' ry='2.4' fill='#0b0f1dcc' stroke='#e9ecf5' stroke-width='.3'/><text text-anchor='middle' y='1.4' font-size='4' font-weight='bold' fill='#e9ecf5'>?</text></g>`;
  return''
}

function swapFace(v,k,e){
  const u=(e&&IMG['x_'+k+'_'+e])||IMG['c_'+k];
  if(!u||!v.classList.contains('img'))return;
  v.querySelectorAll('image').forEach(i=>i.setAttribute('href',u))
}

function setEx(v,e){
  if(!v)return;
  const k=v.id.slice(2);
  [...EXN,'think'].forEach(n=>v.classList.remove('e-'+n));
  v.querySelectorAll('.xg').forEach(g=>g.remove());
  swapFace(v,k,e);
  if(!e)return;
  void v.getBoundingClientRect();
  v.classList.add('e-'+e);
  if(!v.classList.contains('img'))return;
  const g=document.createElementNS('http://www.w3.org/2000/svg','g');
  g.setAttribute('class','xg');
  g.innerHTML=exMark(k,e);
  v.appendChild(g)
}

function express(s){
  const x=s[3],e=x?(x==='calm'?'':x):emo(s[1]),all=[...document.querySelectorAll('#ch svg')],tg=s[0]==='n'?(x||e==='fear'||e==='surprise'?all:[]):[$('#c_'+s[0])].filter(Boolean);
  all.forEach(v=>{
    if(!tg.includes(v))setEx(v,'')
  });
  tg.forEach(v=>setEx(v,e));
  if(e&&tg.length){
    sting(e);
    if(s[0]==='a'&&e==='fear'&&RX.voice.test(s[1]))glitch()
  }
}

async function loadExp(){
  for(const c of'ays')for(const e of EXN){
    const k='x_'+c+'_'+e,v=(await dbGet(k))||DEF[k];
    if(v)IMG[k]=v;
    else delete IMG[k]
  }
}

function expUI(){
  ov(`<div class='pz'><h3>${TR('ui.expressions')}</h3><p>${TR('ui.expressionsHelp')}</p>${Object.keys(N).map(c=>[c,N[c][0]]).map(([c,n])=>`<div style='padding:6px 0;border-bottom:1px solid #ffffff14'><b>${n}</b><div style='display:flex;flex-wrap:wrap;gap:6px;margin-top:6px'>${EXN.map(e=>{const k='x_'+c+'_'+e;return `<button class='btn' data-x='${k}' style='padding:6px 10px;font-size:13px'>${EXA[e]}${IMG[k]?' ✓':''}</button>`}).join('')}</div></div>`).join('')}<p id='ps'></p><button class='btn' id='xc'>${TR('ui.clearExpressions')}</button><button class='btn' onclick='ov()'>${TR('menu.close')}</button></div>`);
$('#xc').onclick=async()=>{
    for(const c of'ays')for(const e of EXN){
      const k='x_'+c+'_'+e;
      await dbSet(k,null);
      delete IMG[k]
    }
    expUI()
  };
document.querySelectorAll('#ov [data-x]').forEach(b=>b.onclick=()=>{
    const k=b.dataset.x,f=document.createElement('input');
    f.type='file';
    f.accept='image/*';
    f.onchange=async()=>{
      if(!f.files[0])return;
      $('#ps').textContent=TR('ui.processing');
      const d=await prep(f.files[0],true);
      await dbSet(k,d);
      IMG[k]=d;
      expUI()
    };
    f.click()
  })
}

/* ═══════════ 13) القوائم والإعدادات ═══════════
   الشاشة الرئيسية، القائمة، خانات الحفظ، الفصول، معرض النهايات، التصدير والاستيراد */

function home(){
  const s=ld();
  ov(`<div class="card"><p>${GAME.homePart}</p><h1>${GAME.homeTitle}</h1><p>${TR('menu.tapToContinue')}</p><button class="btn" onclick="start(nw())">${TR('ui.start')}</button>${s?`<button class="btn" onclick="start(ld())">${TR('ui.continue')}</button>`:''}<button class="btn" onclick="imp()">${TR('ui.importStudio')}</button><button class="btn" onclick="expStory()">${TR('ui.copyStory')}</button><button class="btn" onclick="imgUI()">${TR('ui.realImages')}</button><button class="btn" onclick="expUI()">${TR('ui.expressions')}</button><button class="btn" onclick="menuUI()">${TR('hud.menu')}</button></div>`)
}

function menuUI(){
  ov(`<div class='card'><h2>${TR('menu.title')}</h2><button class='btn' onclick='slotUI()'>${TR('menu.slots')}</button><button class='btn' onclick='chUI()'>${TR('menu.chapters')}</button><button class='btn' onclick='hist()'>${TR('menu.history')}</button><button class='btn' onclick='endsUI()'>${TR('menu.endGallery')}</button><button class='btn' onclick='expSave()'>${TR('menu.exportSave')}</button><button class='btn' onclick='impSave()'>${TR('menu.importSave')}</button><button class='btn' onclick='setUI()'>${TR('menu.settings')}</button><button class='btn' onclick='ov()'>${TR('menu.close')}</button></div>`)
}

function slotUI(){
  const sl=lsg('_slots',{});
  ov(`<div class='pz'><h3>${TR('menu.slots')}</h3>${[1,2,3].map(n=>{const x=sl[n];return `<div style='padding:8px 0;border-bottom:1px solid #ffffff14'><b>${TR('menu.slot')} ${D(n)}</b><br><small>${x?TR('menu.chapter').replace('{n}',D(x.g.c+1))+' · '+htmlText(x.t):TR('menu.empty')}</small><div style='display:flex;gap:6px;justify-content:center;margin-top:6px'><button class='btn' data-sv='${n}' ${G?'':'disabled'}>${TR('menu.save')}</button><button class='btn' data-ld='${n}' ${x?'':'disabled'}>${TR('menu.load')}</button></div></div>`}).join('')}<button class='btn' onclick='menuUI()'>${TR('menu.back')}</button></div>`);
document.querySelectorAll('#ov [data-sv]').forEach(b=>b.onclick=()=>{
    const q=lsg('_slots',{}),d=new Date();
    q[b.dataset.sv]={
      g:JSON.parse(JSON.stringify(G)),t:d.toLocaleDateString(LOC)+' '+d.toLocaleTimeString(LOC,{
        hour:'2-digit',minute:'2-digit'
      })
    };
    lss('_slots',q);
    slotUI()
  });
document.querySelectorAll('#ov [data-ld]').forEach(b=>b.onclick=()=>{
    const x=lsg('_slots',{})[b.dataset.ld];
    if(x)start(JSON.parse(JSON.stringify(x.g)))
  })
}

function chUI(){
  const q=lsg('_snap',{}),ks=Object.keys(q).map(Number).sort((a,b)=>a-b);
  ov(`<div class='pz'><h3>${TR('menu.chapters')}</h3><div style='max-height:55vh;overflow:auto;display:flex;flex-direction:column;gap:6px'>${ks.length?ks.map(c=>`<button class='btn' data-c='${c}' >${D(c+1)}. ${C[c].t}</button>`).join(''):`<p>${TR('ui.noChapters')}</p>`}</div><button class='btn' onclick='menuUI()'>${TR('menu.back')}</button></div>`);
  document.querySelectorAll('#ov [data-c]').forEach(b=>b.onclick=()=>start(JSON.parse(JSON.stringify(q[b.dataset.c]))))
}
function endsUI(){
  const got=lsg('_end',[]),sg=G,df={};
  const base={f:{},y:9,s:9,j:[],err:1};
  [{...base,y:2,s:2},{...base,f:{destroy:1}},{...base,f:{guard:1}},{...base,f:{release:1}},{...base},{...base,f:{release:1},j:ALLJ.slice(),err:0}].forEach(g=>{
    G=g;
    try{const e=ending();df[e[3]]=e}catch(x){}
  });
  G=sg;
  const row=n=>{
    const e=df[n];
    return got.includes(n)&&e?`<div><b>${n===6?'★':D(n)+'.'} ${e[0]}</b><br><small>${e[1]}</small></div>`:`<div><b>${n===6?'★ '+TR('end.secretLabel'):D(n)+'. ؟؟؟'}</b><br><small>${n===6?TR('ui.secretHint'):TR('ui.undiscoveredEnding')}</small></div>`
  };
  ov(`<div class='pz'><h3>${TR('ui.endGallery')} (${D(got.length)}/${D(6)})</h3><div style='max-height:55vh;overflow:auto;text-align:right;display:flex;flex-direction:column;gap:10px'>${[1,2,3,4,5,6].map(row).join('')}</div><button class='btn' onclick='menuUI()'>${TR('menu.back')}</button></div>`)
}

function setUI(){
  ov(`<div class='pz'><h3>${TR('menu.settings')}</h3><p>${TR('ui.language')}</p><div style='display:flex;gap:6px;justify-content:center;flex-wrap:wrap'>${LANGS.map(([c,n])=>`<button class='btn' data-lang='${c}' style='${LANG===c?'outline:2px solid #35e6ff':''}'>${n}</button>`).join('')}</div><p>${TR('menu.textSpeed')}</p><div style='display:flex;gap:6px;justify-content:center;flex-wrap:wrap'>${[[TR('menu.slow'),45],[TR('menu.normal'),24],[TR('menu.fast'),10],[TR('menu.instant'),1]].map(([n,v])=>`<button class='btn' data-ts='${v}' style='${TS===v?'outline:2px solid #35e6ff':''}'>${n}</button>`).join('')}</div><button class='btn' id='vb'>${TR('menu.volume')}</button><button class='btn' id='rmb'>${TR('menu.reduceMotion')}: ${RMon()?TR('menu.enabled'):TR('menu.disabled')}</button><button class='btn' onclick='menuUI()'>${TR('menu.back')}</button></div>`);
  document.querySelectorAll('#ov [data-lang]').forEach(b=>b.onclick=()=>setLang(b.dataset.lang));
  document.querySelectorAll('#ov [data-ts]').forEach(b=>b.onclick=()=>{
    TS=+b.dataset.ts;
    try{
      localStorage.setItem('ts',TS)
    }catch(e){}
    setUI()
  });
  $('#vb').onclick=volUI;
  $('#rmb').onclick=()=>{setRM(!RMon());setUI()}
}

// تصدير/استيراد الحفظ كملف JSON (كل مفاتيح اللعبة + السرعة والصوت)
const okKey=k=>k.indexOf(K)===0||k==='ts'||k==='vol'||k==='rm';

function expSave(){
  try{
    const d={};
    for(let i=0;i<localStorage.length;i++){
      const k=localStorage.key(i);
      if(okKey(k))d[k]=localStorage.getItem(k)
    }
const b=new Blob([JSON.stringify({
      v:1,k:K,d
    })],{
      type:'application/json'
    }),a=document.createElement('a');
    a.href=URL.createObjectURL(b);
    a.download=K+'-save.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(()=>URL.revokeObjectURL(a.href),4000);
    toast(TR('save.exported'))
  }catch(x){
    toast(TR('save.exportFailed'))
  }
}

function validSaveState(g){
  if(!g||typeof g!=='object'||Array.isArray(g))return false;
  if(!Number.isInteger(g.c)||g.c<0||g.c>C.length)return false;
  if(!Number.isInteger(g.i)||g.i<0||g.i>20000)return false;
  if(g.c===C.length&&(g.i!==0||g.card!==C.length-1))return false;
  if(!Number.isFinite(g.y)||g.y<0||g.y>10||!Number.isFinite(g.s)||g.s<0||g.s>10)return false;
  if(!Array.isArray(g.j)||g.j.length>300||!g.j.every(x=>typeof x==='string'&&x.length<=2000&&ALLJ.includes(x)))return false;
  if(!g.f||typeof g.f!=='object'||Array.isArray(g.f)||Object.keys(g.f).length>500)return false;
  if(!Object.entries(g.f).every(([k,x])=>/^[a-zA-Z][a-zA-Z0-9_]{0,40}$/.test(k)&&(x===true||x===false||x===1||x===0)))return false;
  if(g.card!=null&&(!Number.isInteger(g.card)||g.card< -1||g.card>=C.length))return false;
  if(g.err!=null&&(!Number.isFinite(g.err)||g.err<0||g.err>10000))return false;
  return true
}
function validSaveEntry(k,v){
  if(typeof v!=='string'||v.length>600000)return false;
  if(k===K){
    try{return validSaveState(JSON.parse(v))}catch(e){return false}
  }
  if(k===K+'_snap'){
    try{
      const q=JSON.parse(v);
      return !!q&&typeof q==='object'&&!Array.isArray(q)&&Object.keys(q).length<=C.length&&Object.entries(q).every(([n,g])=>/^(0|[1-9]\d*)$/.test(n)&&+n<C.length&&validSaveState(g))
    }catch(e){return false}
  }
  if(k===K+'_slots'){
    try{
      const q=JSON.parse(v);
      return !!q&&typeof q==='object'&&!Array.isArray(q)&&Object.keys(q).every(n=>['1','2','3'].includes(n)&&q[n]&&validSaveState(q[n].g)&&typeof q[n].t==='string'&&q[n].t.length<=100)
    }catch(e){return false}
  }
  if(k===K+'_end'){
    try{const q=JSON.parse(v);return Array.isArray(q)&&q.length<=6&&q.every(n=>Number.isInteger(n)&&n>=1&&n<=6)}catch(e){return false}
  }
  if(k==='ts')return ['1','10','24','45'].includes(v);
  if(k==='vol'){
    try{const q=JSON.parse(v);return !!q&&Number.isFinite(q.a)&&q.a>=0&&q.a<=1.5&&Number.isFinite(q.f)&&q.f>=0&&q.f<=1.5}catch(e){return false}
  }
  if(k==='rm')return ['0','1','true','false'].includes(v);
  return false
}

function impSave(){
  const f=document.createElement('input');
  f.type='file';
  f.accept='application/json,.json';
  f.onchange=async()=>{
    try{
      if(!f.files||!f.files[0]||f.files[0].size>1200000)return toast(TR('save.badSize'));
      const j=JSON.parse(await f.files[0].text());
      if(!j||j.v!==1||j.k!==K||!j.d||typeof j.d!=='object'||Array.isArray(j.d))return toast(TR('save.wrongGame'));
      const keys=Object.keys(j.d);
      if(!keys.length||keys.length>20||!keys.every(k=>okKey(k)&&validSaveEntry(k,j.d[k])))return toast(TR('save.invalidData'));
      keys.forEach(k=>localStorage.setItem(k,j.d[k]));
      toast(TR('save.imported'));
      setTimeout(()=>location.reload(),900)
    }catch(x){
      toast(TR('save.invalidFile'))
    }
  };
  f.click()
}

/* ═══════════ 14) التشغيل ═══════════
   كل ما ينفَّذ عند التحميل: ربط الأزرار ولوحة المفاتيح وبدء اللعبة (يأتي آخرا بعد تعريف كل شيء) */

(()=>{
  const c=document.createElement('div');
  c.id='cam';
  const sc=$('#sc');
  while(sc.firstChild)c.appendChild(sc.firstChild);
  sc.appendChild(c)
})();

buildChars();

$('#dl').onclick=e=>{
  if(e.target.closest('#cx'))return;
  if(T){
    clearInterval(T);
    T=0;
    $('#ch').classList.remove('tk');
    $('#tx').textContent=TT;
    rd=1;
    $('#dl').classList.add('rd')
  }else if(rd&&nx){
    rd=0;
    $('#dl').classList.remove('rd');
    const f=nx;
    nx=0;
    f()
  }
};

$('#bj').onclick=()=>jnl();

$('#bs').onclick=()=>{mute=!mute;if(dr)dr.gain.value=mute?0:.05;ambMute();$('#bs').textContent=mute?'🔇':'🔊'};

$('#br').onclick=()=>ov(`<div class="card"><h2>${TR('ui.restartConfirm')}</h2><p>${TR('ui.deleteProgress')}</p><button class="btn" onclick="rst()">${TR('ui.yesRestart')}</button><button class="btn" onclick="ov()">${TR('ui.cancel')}</button></div>`);

scene('roof');

$('#ct').textContent=GAME.part;

try{
  const t=localStorage.getItem(LIBK);
  if(t)applyLib(t)
}catch(e){}

loadImgs().then(()=>setTimeout(loadMore,400));

home();

// زر سرعة النص (⏩): بطيئة ← عادية ← سريعة ← فورية
(()=>{
  // ⏩ نقرة = تخطّي الجملة (نقرتان سريعتان = أكمل الكتابة وانتقل) | ضغط مطوّل = تبديل سرعة النص
  const SP=[[TR('menu.slow'),45],[TR('menu.normal'),24],[TR('menu.fast'),10],[TR('menu.instant'),1]],b=$('#bk');
  let tm=0,long=0;
  b.oncontextmenu=e=>e.preventDefault();
  b.onpointerdown=()=>{
    long=0;
    tm=setTimeout(()=>{
      long=1;
      const i=SP.findIndex(x=>x[1]===TS),n=SP[(i+1)%SP.length];
      TS=n[1];
      try{localStorage.setItem('ts',TS)}catch(x){}
      toast(TR('ui.textSpeedChanged').replace('{speed}',n[0]))
    },450)
  };
  b.onpointerup=b.onpointerleave=b.onpointercancel=()=>clearTimeout(tm);
  b.onclick=()=>{if(long){long=0;return}$('#dl').click()}
})();

// إعادة تركيز تلقائي داخل النوافذ (لقارئات الشاشة ولوحة المفاتيح)
(()=>{const o=ov;ov=function(h){o(h);if(!h)return;const z=$('#ov .pz');
if(z&&$('#ps')&&!z.querySelector('.jb')){
      const b=document.createElement('button');
      b.className='btn jb';
      b.textContent=TR('jn.btn');
      b.onclick=()=>jnl();
      z.appendChild(b)
    }
const f=$('#ov button');if(f)f.focus({preventScroll:true})}})();

// لوحة المفاتيح: مسافة/Enter = متابعة، 1-9 = اختيار، M = القائمة، Esc = إغلاق نافذة قابلة للإغلاق
document.addEventListener('keydown',e=>{
  const t=e.target;
  if(t.closest&&t.closest('input,textarea'))return;
  const open=!$('#ov').hidden;
if(e.key==='Escape'&&$('#jn')){$('#jn').remove();return}
if(e.key==='Escape'){if(open&&$('#ov').querySelector('[onclick="ov()"]'))ov();return}
if(open||$('#jn'))return;if(e.key==='m'||e.key==='M'){menuUI();return}
if(e.key==='j'||e.key==='J'){jnl();return}
const cb=[...document.querySelectorAll('#cx button')];
  if(/^[1-9]$/.test(e.key)&&cb[+e.key-1]){
    cb[+e.key-1].click();
    return
  }
if((e.key===' '||e.key==='Enter')&&t.tagName!=='BUTTON'){e.preventDefault();$('#dl').click()}});

// إشعار تحديث اللعبة من sw.js (فقط إن كانت الخدمة تعمل أصلا، أي ليس في الزيارة الأولى)
if('serviceWorker' in navigator&&navigator.serviceWorker.controller)navigator.serviceWorker.addEventListener('message',x=>{
  if(x.data==='upd')toast(TR('upd'))
});
// تقليل الحركة: يُحفظ ويُطبَّق كصنف على الصفحة (يوقف الاهتزاز والضباب والمشاهد الحركية)
const RMon=()=>{try{return localStorage.getItem('rm')==='1'}catch(x){return 0}};
function setRM(v){
  try{localStorage.setItem('rm',v?'1':'0')}catch(x){}
  document.documentElement.classList.toggle('rm',!!v)
}
document.documentElement.classList.toggle('rm',!!RMon());
// مفاتيح إضافية: H سجل الحوار | Esc يغلق السجل | لا تتقدّم القصة وهو مفتوح
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'&&$('#hs')){$('#hs').remove();e.stopImmediatePropagation();return}
  if($('#hs')||$('#jn')){if(e.key===' '||e.key==='Enter')e.stopImmediatePropagation();return}
  if((e.key==='h'||e.key==='H')&&$('#ov').hidden&&!$('#cine'))hist()
},true);

// زر القائمة ☰ بجانب أزرار الأعلى
(()=>{
  const b=$('#bs');
  if(!b)return;
  const v=document.createElement('button');
  v.id='bv';
  v.setAttribute('aria-label',TR('hud.menu'));
  v.textContent='☰';
  v.className=b.className;
  b.before(v);
  v.onclick=menuUI
})();
