/* ===== studio.js — أدوات الصور والاستيراد من الاستوديو (اختياري) =====
   يُحمَّل قبل engine.js. معالجة الصور (إزالة الخلفية الخضراء)، واجهة استبدال الصور، استيراد/تصدير القصة،
   وتطبيق مكتبة الصور المحفوظة عند التشغيل. حذف هذا الملف يعطّل هذه الأدوات فقط (وتبقى اللعبة تعمل بصورها الافتراضية). */
function cut(x,w,h){
  const d=x.getImageData(0,0,w,h),a=d.data;
  if(a[3]<200)return;
  const r=a[0],g=a[1],b=a[2],seen=new Uint8Array(w*h),st=[];
const near=i=>Math.abs(a[i*4]-r)+Math.abs(a[i*4+1]-g)+Math.abs(a[i*4+2]-b)<90;
for(let i=0;i<w;i++)st.push(i,(h-1)*w+i);for(let j=0;j<h;j++)st.push(j*w,j*w+w-1);
while(st.length){
    const i=st.pop();
    if(seen[i]||!near(i))continue;
    seen[i]=1;
    a[i*4+3]=0;
    const cx=i%w;
    if(cx>0)st.push(i-1);
    if(cx<w-1)st.push(i+1);
    if(i>=w)st.push(i-w);
    if(i<w*h-w)st.push(i+w)
  }
x.putImageData(d,0,0)}
function prep(file,isC){
  return new Promise(ok=>{
    const im=new Image();
    im.onload=()=>{
      const m=isC?[520,760]:[1100,825],s=Math.min(1,m[0]/im.width,m[1]/im.height),c=document.createElement('canvas');
      c.width=Math.round(im.width*s);
      c.height=Math.round(im.height*s);
      const x=c.getContext('2d',{
        willReadFrequently:true
      });
      x.drawImage(im,0,0,c.width,c.height);
      if(isC)cut(x,c.width,c.height);
      ok(c.toDataURL('image/webp',.82))
    };
    im.src=URL.createObjectURL(file)
  })
}
function imgUI(){
  ov(`<div class='pz'><h3>صور حقيقية</h3><p>صورة الشخصية كاملة الجسم، بخلفية شفافة أو لون ثابت (تُزال تلقائيا). صورة الخلفية أفقية. تُحفظ على هذا الجهاز.</p>${SLOTS.map(([k,n])=>`<div style='display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid #ffffff14'><span style='flex:1;text-align:right'>${n}</span>${IMG[k]?`<img src='${IMG[k]}' style='height:38px;border-radius:4px'>`:''}<button class='btn' style='min-width:70px;padding:6px' data-k='${k}' data-a='pick'>اختيار</button>${IMG[k]?`<button class='btn' style='min-width:46px;padding:6px' data-k='${k}' data-a='del'>✕</button>`:''}</div>`).join('')}<p id='ps'></p><button class='btn' onclick='home()'>رجوع</button></div>`);
document.querySelectorAll('#ov [data-a]').forEach(b=>b.onclick=()=>{
    const k=b.dataset.k;
    if(b.dataset.a==='del'){
      dbSet(k,null).then(loadImgs).then(imgUI);
      return
    }
const f=document.createElement('input');
    f.type='file';
    f.accept='image/*';
    f.onchange=async()=>{
      if(!f.files[0])return;
      $('#ps').textContent='جارِ المعالجة...';
      const d=await prep(f.files[0],k[0]==='c');
      await dbSet(k,d);
      IMG[k]=d;
      if(k[0]==='b')LIGHTS[k.slice(2)]=await findLights(d);
      curBg=null;
      buildChars();
      imgUI()
    };
    f.click()
  })
}
function applyLib(t){let j;try{j=JSON.parse(t)}catch(e){return 'نص غير صالح'}if(Array.isArray(j))j={story:j};
BG0=BG0||{
    ...BG
  };
  Object.assign(BG,BG0);
  CHR={};
  OV={};
  C0=C0||JSON.stringify(C);
  const ns=Array.isArray(j.story)&&j.story.length;
  C.length=0;
  C.push(...(ns?j.story:JSON.parse(C0)));
  let n=ns?1:0;
(j.chars||[]).forEach(c=>{
    const m=MAPC.find(x=>(c.name||'').includes(x[1]));
    if(m&&c.svg){
      CHR[m[0]]=c.svg.replace('<svg viewBox="0 0 60 92">',`<svg id="c_${m[0]}" viewBox="0 0 60 92" style="--c:${N[m[0]][1]}">`);
      n++
    }
  });
(j.bgs||[]).forEach(b=>{
    const m=MAPB.find(x=>(b.name||'').includes(x[1]));
    if(m&&b.svg){
      BG[m[0]]=b.svg;
      OV[m[0]]=1;
      n++
    }
  });
let st=$('#imp');
  if(!st){
    st=document.createElement('style');
    st.id='imp';
    document.head.appendChild(st)
  }
  st.textContent=j.css||'';
curBg=null;buildChars();return 'تم تطبيق '+n+' عنصر'}
function imp(){
  ov(`<div class="pz"><h3>استيراد من الاستوديو</h3><p>انسخ ملف JSON من تبويب «تصدير» في الاستوديو والصقه هنا. سمِّ الشخصيات: آدم، ياسمين، سامي. وسمِّ الخلفيات: سطح، استوديو، سوق، باب، سلالم، متاهة، مخبر، قاعة.</p><textarea id="jt" style="width:100%;height:110px;box-sizing:border-box;background:#06080f;color:#e9ecf5;border:1px solid #ffffff33;border-radius:8px;padding:8px;direction:ltr;user-select:text;-webkit-user-select:text"></textarea><p id="ps"></p><button class="btn" onclick="const t=$('#jt').value;const r=applyLib(t);if(r[0]==='ت')try{localStorage.setItem(LIBK,t)}catch(e){}$('#ps').textContent=r">تطبيق</button> <button class="btn" onclick="try{localStorage.removeItem(LIBK)}catch(e){}$('#ps').textContent=applyLib('{}')">استعادة الافتراضي</button> <button class="btn" onclick="home()">رجوع</button></div>`)
}
function expStory(){
  ov(`<div class="pz"><h3>القصة للمحرر</h3><p>انسخ النص والصقه في تبويب «قصة» داخل الاستوديو.</p><textarea id="jt" readonly style="width:100%;height:110px;box-sizing:border-box;background:#06080f;color:#e9ecf5;border:1px solid #ffffff33;border-radius:8px;padding:8px;direction:ltr;user-select:text;-webkit-user-select:text"></textarea><p id="ps"></p><button class="btn" onclick="const t=$('#jt');t.select();let ok=0;try{ok=document.execCommand('copy')}catch(e){}$('#ps').textContent=ok?'تم النسخ':'حدّد النص وانسخه يدويا'">نسخ</button> <button class="btn" onclick="home()">رجوع</button></div>`);
  $('#jt').value=JSON.stringify(C)
}
