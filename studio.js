/* ===== studio.js — أدوات الصور والاستيراد من الاستوديو (اختياري) =====
   يُحمَّل قبل engine.js. رفع الصور محدود النوع والحجم والأبعاد، وتُحرر روابط الملفات المؤقتة.
   استيراد مكتبات SVG/CSS/HTML يبقى معطلا إلى حين توفير تنظيف بنيوي آمن. */
function cut(x,w,h){
  const d=x.getImageData(0,0,w,h),a=d.data;
  if(a[3]<200)return;
  const r=a[0],g=a[1],b=a[2],seen=new Uint8Array(w*h),st=[];
  const near=i=>Math.abs(a[i*4]-r)+Math.abs(a[i*4+1]-g)+Math.abs(a[i*4+2]-b)<90;
  for(let i=0;i<w;i++)st.push(i,(h-1)*w+i);
  for(let j=0;j<h;j++)st.push(j*w,j*w+w-1);
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
  x.putImageData(d,0,0)
}
function prep(file,isC){
  return new Promise((resolve,reject)=>{
    const allowed=['image/png','image/jpeg','image/webp','image/gif'];
    if(!file||!allowed.includes(file.type)||file.size>8*1024*1024){
      reject(new Error('Unsupported or oversized image'));
      return
    }
    const url=URL.createObjectURL(file),im=new Image();
    let settled=false;
    const cleanup=()=>{
      if(settled)return false;
      settled=true;
      clearTimeout(timer);
      URL.revokeObjectURL(url);
      return true
    };
    const fail=error=>{
      if(cleanup())reject(error)
    };
    const timer=setTimeout(()=>fail(new Error('Image decode timeout')),15000);
    im.onload=()=>{
      if(settled)return;
      try{
        if(!Number.isFinite(im.width)||!Number.isFinite(im.height)||im.width<1||im.height<1||
          im.width>10000||im.height>10000||im.width*im.height>16000000){
          throw new Error('Image dimensions exceed safe limits')
        }
        const m=isC?[520,760]:[1100,825],scale=Math.min(1,m[0]/im.width,m[1]/im.height),c=document.createElement('canvas');
        c.width=Math.max(1,Math.round(im.width*scale));
        c.height=Math.max(1,Math.round(im.height*scale));
        const x=c.getContext('2d',{willReadFrequently:true});
        if(!x)throw new Error('Canvas unavailable');
        x.drawImage(im,0,0,c.width,c.height);
        if(isC)cut(x,c.width,c.height);
        const result=c.toDataURL('image/webp',.82);
        if(cleanup())resolve(result)
      }catch(error){
        fail(error)
      }
    };
    im.onerror=()=>fail(new Error('Image decode failed'));
    im.src=url
  })
}
function imgUI(){
  ov(`<div class='pz'><h3>${TR('ui.realImages')}</h3><p>${TR('studio.imageHelp')}</p>${SLOTS.map(([k,n])=>`<div style='display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid #ffffff14'><span style='flex:1;text-align:start'>${n}</span>${IMG[k]?`<img src='${IMG[k]}' style='height:38px;border-radius:4px'>`:''}<button class='btn' style='min-width:70px;padding:6px' data-k='${k}' data-a='pick'>${TR('studio.choose')}</button>${IMG[k]?`<button class='btn' style='min-width:46px;padding:6px' data-k='${k}' data-a='del'>✕</button>`:''}</div>`).join('')}<p id='ps'></p><button class='btn' onclick='home()'>${TR('menu.back')}</button></div>`);
  document.querySelectorAll('#ov [data-a]').forEach(b=>b.onclick=()=>{
    const k=b.dataset.k;
    if(b.dataset.a==='del'){
      dbSet(k,null).then(loadImgs).then(imgUI);
      return
    }
    const f=document.createElement('input');
    f.type='file';
    f.accept='image/png,image/jpeg,image/webp,image/gif';
    f.onchange=async()=>{
      if(!f.files||!f.files[0])return;
      $('#ps').textContent=TR('ui.processing');
      try{
        const d=await prep(f.files[0],k[0]==='c');
        await dbSet(k,d);
        IMG[k]=d;
        if(k[0]==='b')LIGHTS[k.slice(2)]=await findLights(d);
        curBg=null;
        buildChars();
        imgUI()
      }catch(error){
        $('#ps').textContent=TR('save.invalidFile')
      }
    };
    f.click()
  })
}
// الاستيراد معطّل مؤقتا: لا تدخل مكتبات SVG/CSS/HTML غير الموثوقة إلى DOM.
function applyLib(t){
  return TR('studio.importDisabled')
}
function imp(){
  ov(`<div class="pz"><h3>${TR('studio.importTitle')}</h3><p>${TR('studio.importDisabledHelp')}</p><button class="btn" onclick="home()">${TR('menu.back')}</button></div>`)
}
function expStory(){
  ov(`<div class="pz"><h3>${TR('ui.copyStory')}</h3><p>${TR('studio.storyHelp')}</p><textarea id="jt" readonly style="width:100%;height:110px;box-sizing:border-box;background:#06080f;color:#e9ecf5;border:1px solid #ffffff33;border-radius:8px;padding:8px;direction:ltr;user-select:text;-webkit-user-select:text"></textarea><p id="ps"></p><button class="btn" onclick="const t=$('#jt');t.select();let ok=0;try{ok=document.execCommand('copy')}catch(e){}$('#ps').textContent=ok?TR('studio.copied'):TR('studio.copyManual')">${TR('studio.copy')}</button> <button class="btn" onclick="home()">${TR('menu.back')}</button></div>`);
  $('#jt').value=JSON.stringify(C)
}
