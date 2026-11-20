// ===== بيانات اللعبة (خاصة بهذه القصة) =====
// الملفات: images.js ثم lang_ar.js ثم story.js ثم engine.js. نصوص القصة كلها في lang_ar.js (تُستدعى هنا بـ "مفتاح").
// ما يجب أن يعرّفه هذا الملف للمحرّك: GAME (اسم ومعرّف)، K (مفتاح الحفظ)، N (الشخصيات: الاسم واللون)،
// S (ألوان المشاهد)، F (نغمات الألغاز)، رسم الشخصيات الاحتياطي (fig…)، BG (رسوم الخلفيات)، C (الفصول)،
// SC2 وSTG (توزيع الشخصيات)، EN (نقاط الدخول)، ending() (النهايات)، MAPB (أسماء الخلفيات)، TONE (نبرة كل مشهد).
// ملاحظة: المحرّك يفترض ثلاث شخصيات مفاتيحها a وy وs.
var GAME={id:'smm',part:"game.part",homePart:"game.homePart",homeTitle:"game.homeTitle",partOf:c=>TR("game.partWord")+" "+TR("game.partNums")[Math.min(2,c/15|0)]};
const K=GAME.id+'_p1';
const N={a:["name.a",'#5ec8ff'],y:["name.y",'#ff7eb6'],s:["name.s",'#ffc857'],n:['','#e9ecf5']};
const S={roof:['#0b1030','#3a1d5c',0,1],studio:['#101827','#1f3a4d',0,0],souk:['#1a1020','#5a2a2a',0,1],door:['#0d0f14','#2b2f3a',0,0],stairs:['#050608','#1a1f2e',1,0],tunnel:['#02030a','#0b2a3a',1,0],
lab:['#05101a','#0c2a3a',1,0],hall:['#04060e','#10203a',1,0]};
const F=[261,330,392,494];
// ===== رسم الشخصيات والخلفيات (SVG) =====
const SK='#f1c9a5',HR={a:'#1b2236',y:'#2a1626',s:'#8e8f98'},JK={a:'#2a5f8a',y:'#c44a86',s:'#b8862b'};
const fig=k=>{const c=N[k][1],h=HR[k];
const back=k==='y'?`<path d="M13 28Q10 4 30 5Q50 4 47 28L50 66Q40 62 39 44H21Q20 62 10 66Z" fill="${h}"/>`:'';
const fr={a:`<path d="M16 27Q13 8 30 8Q47 8 44 27Q41 17 30 16Q19 17 16 27Z" fill="${h}"/>`,y:`<path d="M16 27Q18 10 30 10Q42 10 44 27Q38 17 30 17Q22 17 16 27Z" fill="${h}"/>`,s:`<path d="M17 25Q15 8 30 8Q45 8 43 25Q38 15 30 15Q22 15 17 25Z" fill="${h}"/><path d="M17 33Q30 54 43 33Q43 46 30 50Q17 46 17 33Z" fill="${h}"/>`}[k];
const ac={a:`<path d="M15 27Q30 -2 45 27" fill="none" stroke="${c}" stroke-width="2.5"/><circle cx="15" cy="29" r="3.5" fill="${c}"/><circle cx="45" cy="29" r="3.5" fill="${c}"/>`,y:`<path d="M20 46Q30 53 40 46L38 54Q30 58 22 54Z" fill="${c}"/>`,s:''}[k];
return `<svg id="c_${k}" viewBox="0 0 60 92" style="--c:${c}">${back}<path d="M6 92Q8 48 30 46Q52 48 54 92Z" fill="${JK[k]}"/><rect x="26" y="38" width="8" height="10" fill="${SK}"/><ellipse cx="30" cy="27" rx="13" ry="15" fill="${SK}"/>${fr}<g class="ey"><ellipse cx="24" cy="29" rx="2.8" ry="3.6" fill="#10131f"/><ellipse cx="36" cy="29" rx="2.8" ry="3.6" fill="#10131f"/><ellipse cx="24" cy="29" rx="1.8" ry="2.6" fill="${c}"/><ellipse cx="36" cy="29" rx="1.8" ry="2.6" fill="${c}"/><circle cx="23" cy="27.6" r="1" fill="#fff"/><circle cx="35" cy="27.6" r="1" fill="#fff"/></g><path class="bl" d="M20 23Q24 21 27 23M33 23Q36 21 40 23" stroke="#333" stroke-width="1.5" fill="none"/><path class="mc" d="M26 39Q30 41 34 39" stroke="#7a3b3b" fill="none" stroke-width="1.4"/><ellipse class="mo" cx="30" cy="39.5" rx="3" ry="2.2" fill="#6b2a2a"/>${ac}</svg>`};
const svgWrap=x=>`<svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice">${x}</svg>`;
const BG={
roof:svgWrap('<g fill="#fff" opacity=".7"><circle cx="50" cy="40" r="1"/><circle cx="120" cy="80" r="1.2"/><circle cx="200" cy="30" r="1"/><circle cx="260" cy="70" r="1"/><circle cx="340" cy="35" r="1.2"/><circle cx="380" cy="90" r="1"/></g><path fill="#0a0c1c" d="M0 300V215H50V190Q80 150 110 190V215H170V170H180V120L185 105L190 120V170H200V215H250V195Q282 150 314 195V215H360V230H400V300Z"/><path fill="#05060d" d="M0 300V250H70V235H140V255H230V240H320V260H400V300Z"/><g fill="#ffb454" opacity=".8"><rect x="60" y="222" width="6" height="9"/><rect x="262" y="214" width="6" height="9"/><rect x="300" y="214" width="6" height="9"/></g>'),
studio:svgWrap('<rect y="190" width="400" height="110" fill="#0a121c"/><rect x="90" y="90" width="150" height="95" rx="6" fill="#06101a" stroke="#35e6ff" stroke-width="2"/><polyline fill="none" stroke="#35e6ff" stroke-width="2" points="100,140 120,140 128,110 138,170 148,125 158,150 170,140 230,140"/><rect x="150" y="185" width="30" height="10" fill="#10202e"/><rect x="290" y="40" width="90" height="8" fill="#16283a"/><rect x="290" y="75" width="90" height="8" fill="#16283a"/><circle cx="50" cy="80" r="22" fill="#ffb45433"/><circle cx="50" cy="80" r="6" fill="#ffb454"/>'),
souk:svgWrap('<path fill="#12080e" d="M0 0H400V110Q350 60 300 110Q250 60 200 110Q150 60 100 110Q50 60 0 110Z"/><g fill="#12080e"><rect x="0" y="108" width="14" height="192"/><rect x="93" y="108" width="14" height="192"/><rect x="193" y="108" width="14" height="192"/><rect x="293" y="108" width="14" height="192"/><rect x="386" y="108" width="14" height="192"/></g><path stroke="#ffb454" d="M50 60V96M150 60V96M250 60V96M350 60V96"/><g fill="#ffb454"><circle cx="50" cy="102" r="7"/><circle cx="150" cy="102" r="7"/><circle cx="250" cy="102" r="7"/><circle cx="350" cy="102" r="7"/></g><rect y="250" width="400" height="50" fill="#0b0508"/>'),
door:svgWrap('<rect width="400" height="300" fill="#151820"/><g stroke="#0b0d12" stroke-width="2"><path d="M0 60H400M0 120H400M0 180H400M0 240H400M80 0V60M240 60V120M60 120V180M300 180V240"/></g><path d="M130 300V150Q200 60 270 150V300Z" fill="#05060a" stroke="#8a7a55" stroke-width="3"/><g fill="#8a7a55"><circle cx="175" cy="140" r="3"/><circle cx="200" cy="120" r="3"/><circle cx="225" cy="140" r="3"/></g>'),
stairs:svgWrap('<rect width="400" height="300" fill="#0b0e18"/><path fill="#161b2b" d="M80 300H320L290 250H110Z"/><path fill="#10152a" d="M110 250H290L270 215H130Z"/><path fill="#0c1020" d="M130 215H270L255 190H145Z"/><path fill="#080b16" d="M145 190H255L245 172H155Z"/><rect x="170" y="120" width="60" height="52" fill="#02030a"/>'),
tunnel:svgWrap('<g fill="none" stroke="#35e6ff" stroke-opacity=".5" stroke-width="2"><path d="M20 300V110Q200 -30 380 110V300"/><path d="M80 300V140Q200 40 320 140V300"/><path d="M130 300V165Q200 100 270 165V300"/><path d="M165 300V185Q200 150 235 185V300"/></g><path fill="#02030a" d="M180 300V195Q200 175 220 195V300Z"/>'),
lab:svgWrap('<rect y="200" width="400" height="100" fill="#0a1220"/><g fill="#0b1626" stroke="#35e6ff" stroke-opacity=".4"><rect x="20" y="60" width="70" height="140"/><rect x="310" y="60" width="70" height="140"/></g><g fill="#35e6ff"><circle cx="35" cy="80" r="3"/><circle cx="35" cy="110" r="3" opacity=".5"/><circle cx="325" cy="80" r="3" opacity=".5"/><circle cx="325" cy="110" r="3"/></g><g fill="#35e6ff33" stroke="#35e6ff"><rect x="150" y="70" width="14" height="120" rx="7"/><rect x="190" y="70" width="14" height="120" rx="7"/><rect x="230" y="70" width="14" height="120" rx="7"/></g>'),
hall:svgWrap('<ellipse cx="200" cy="270" rx="190" ry="40" fill="#060912"/><circle cx="200" cy="140" r="85" fill="none" stroke="#35e6ff" stroke-width="10" opacity=".8"/><circle cx="200" cy="140" r="62" fill="none" stroke="#35e6ff" stroke-opacity=".4" stroke-width="2"/><circle cx="200" cy="140" r="8" fill="#35e6ff"/><path stroke="#35e6ff" stroke-opacity=".3" d="M200 225V270M60 270L130 215M340 270L270 215"/>')};
// ===== القصة: ٤٥ فصلا. الخطوة: حوار [من،نص،شرط] أو اختيار {c} أو لغز {p} أو دليل {j} =====
const C=[
{t:"c01.t",bg:'roof',st:[
{x:'title part1.t'},
['n',"c01.s0"],
['n',"c01.s0b"],
['a',"c01.s1"],
['n',"c01.s2"],
{x:'hush 1600'},
['a',"c01.s3",'','surprise'],
['n',"c01.s4",'','fear'],
{x:'cine knock; hush 800'},

{j:"c01.s5.j"},
['a',"c01.s6",'','think'],
['n',"c01.s7",'','fear']]},
{t:"c02.t",bg:'studio',st:[
['n',"c02.s0"],
['y',"c02.s1"],
['a',"c02.s2"],
['a',"c02.s2b",'','think'],
['y',"c02.s3",'','fear'],
{j:"c02.s4.j"},
['y',"c02.s5",'','think'],
{x:'hush 900'},
{c:[["c02.s6.o0",{s:1},'sami'],["c02.s6.o1",{y:1},'alone']]}]},
{t:"c03.t",bg:'souk',st:[
['n',"c03.s0"],
{x:'enter s'},
['s',"c03.s2",'sami'],
['s',"c03.s3",'alone','angry'],
['s',"c03.s4",'','sad'],
['y',"c03.s5"],
{p:{k:'seq',t:"c03.s6.pt",pads:['١','٢','٣','٤'],q:[0,2,1,3],h:"c03.s6.ph",r:{s:1}}},
['n',"c03.s7",'','fear'],
{x:'hush 1200'},
{j:"c03.s8.j"}]},
{t:"c04.t",bg:'door',st:[
['n',"c04.s0"],
['y',"c04.s1",'','surprise'],
{j:"c04.s2.j"},
{p:{k:'ord',t:"c04.s3.pt",cl:"puz.ord4",o:["puz.o4a","puz.o4b","puz.o4c"],a:[1,2,0],h:"c04.s3.ph",r:{y:1}}},
['y',"c04.s4",'','joy'],
['n',"c04.s5",'','fear']]},
{t:"c05.t",bg:'stairs',st:[
['n',"c05.s0"],
['a',"c05.s1"],
['n',"c05.s2"],
{c:[["c05.s3.o0",{y:1,s:-1},'ask'],["c05.s3.o1",{s:1},'wait']]},
['s',"c05.s4",'ask','sad'],
['s',"c05.s5",'wait','sad'],
{j:"c05.s6.j"},
['y',"c05.s7",'','surprise'],
['s',"c05.s8",'','sad'],
{x:'cine mute'},
['n',"c05.s9",'','fear']]},
{t:"c06.t",bg:'tunnel',st:[
['n',"c06.s0"],
['s',"c06.s1"],
{p:{k:'seq',t:"c06.s2.pt",pads:['←','↑','→','↓'],q:[2,1,0,1],h:"c06.s2.ph",r:{s:1,y:1}}},
['n',"c06.s3"],
['y',"c06.s4",'','fear'],
{j:"c06.s5.j"},
{x:'hush 1200'},
['a',"c06.s6",'','fear']]},
{t:"c07.t",bg:'tunnel',st:[
['n',"c07.s0"],
{x:'cine shadow'},

['y',"c07.s1"],
['s',"c07.s2",'','surprise'],
{j:"c07.s3.j"},
['a',"c07.s4",'','think'],
{c:[["c07.s5.o0",{y:1},'careful'],["c07.s5.o1",{s:1,y:-1},'force']]}]},
{t:"c08.t",bg:'door',st:[
['y',"c08.s0",'careful'],
['s',"c08.s1",'force','angry'],
['y',"c08.s2"],
['a',"c08.s3"],
{p:{k:'code',t:"c08.s4.pt",cl:'التردد ثم عدد الثواني بين كل تكرار',a:'177',h:"c08.s4.ph",r:{y:1}}},
['n',"c08.s5"]]},
{t:"c09.t",bg:'lab',st:[
['n',"c09.s0"],
['a',"c09.s1",'','think'],
['y',"c09.s2",'','fear'],
{j:"c09.s3.j"},
['s',"c09.s4",'','fear'],
['s',"c09.sL",'s<5','sad'],
['n',"c09.sL2",'s<5'],
['s',"c09.sH",'s>=7'],
['n',"c09.s5"]]},
{t:"c10.t",bg:'lab',st:[
['a',"c10.s0"],
['n',"c10.s1",'','fear'],
['s',"c10.s2",'','sad'],
['n',"c10.s3"],
{j:"c10.s4.j"},
{x:'hush 900'},
{c:[["c10.s5.o0",{s:1},'tape'],["c10.s5.o1",{y:1},'rush']]}]},
{t:"c11.t",bg:'lab',st:[
['y',"c11.s0",'tape'],
['y',"c11.s1",'rush','fear'],
['a',"c11.s2"],
{p:{k:'seq',t:"c11.s3.pt",pads:['١','٢','٣','٤'],q:[1,3,0,2,3],h:"c11.s3.ph",r:{y:1}}},
['n',"c11.s4",'','fear'],
['a',"c11.s5",'','fear']]},
{t:"c12.t",bg:'lab',st:[
['s',"c12.sL",'s<5','sad'],
['s',"c12.s0",'','sad'],
['s',"c12.s1",'','fear'],
['y',"c12.s2",'','angry'],
['n',"c12.s3"],
{c:[["c12.s4.o0",{s:2},'trust'],["c12.s4.o1",{y:1,s:-1},'press']]},
['s',"c12.s5",'trust','sad'],
['s',"c12.s6",'press']]},
{t:"c13.t",bg:'hall',st:[
['n',"c13.s0"],
['s',"c13.sL",'s<5','fear'],
['s',"c13.sH",'s>=7'],
['y',"c13.s1",'','surprise'],
['n',"c13.s2"],
{j:"c13.s3.j"},
['a',"c13.s4",'','surprise'],
['n',"c13.s5"],
{x:'cine eye; hush 800'}]},
{t:"c14.t",bg:'hall',st:[
['y',"c14.s0"],
['s',"c14.sL",'s<5','sad'],
['s',"c14.sH",'s>=7'],
['s',"c14.s1"],
['a',"c14.s2"],
{p:{k:'code',t:"c14.s3.pt",cl:'عدد الباحثين × عدد الأبواب',a:'12',h:"c14.s3.ph",r:{s:1}}},
['n',"c14.s4"],
{j:"c14.s5.j"}]},
{t:"c15.t",bg:'hall',st:[
['n',"c15.s0"],
['a',"c15.s1",'','fear'],
['y',"c15.s2"],
['s',"c15.sL",'s<5','angry'],
['s',"c15.sH",'s>=7'],
['s',"c15.s3",'','fear'],
['n',"c15.s4"],
{x:'cine wave; hush 600'},
['n',"c15.s5",'','fear'],
['a',"c15.s6",'','surprise'],
{j:"c15.s7.j"},
{x:'cine wave; hush 800'},
['n',"c15.s8",'','fear']]},
{t:"c16.t",bg:'stairs',st:[
{x:'title part2.t'},
['n',"c16.s0"],
['a',"c16.s1",'','surprise'],
['n',"c16.s2"],
{x:'hush 1200'},
['y',"c16.s3",'','fear'],
{c:[["c16.s4.o0",{y:-1},'answered'],["c16.s4.o1",{y:1},'silent']]},
['n',"c16.s5",'answered','fear'],
['s',"c16.s6",'answered','angry'],
['n',"c16.s7",'silent'],
{j:"c16.s8.j"}]},
{t:"c17.t",bg:'tunnel',st:[
['n',"c17.s0"],
['y',"c17.s1"],
['s',"c17.s2",'','sad'],
['a',"c17.s3"],
{j:"c17.s4.j"},
['s',"c17.sH",'s>=7','sad'],
['n',"c17.sL",'s<5'],
['y',"c17.s5",'','think']]},
{t:"c18.t",bg:'door',st:[
['n',"c18.s0"],
['s',"c18.s1"],
['y',"c18.s2"],
{p:{k:'ord',t:"c18.s3.pt",cl:"puz.ord18",o:["puz.o18a","puz.o18b","puz.o18c"],a:[2,0,1],h:"c18.s3.ph",r:{y:1}}},
['n',"c18.s4"]]},
{t:"c19.t",bg:'lab',st:[
{x:'cine scan'},
['n',"c19.s0"],
['a',"c19.s1",'','fear'],
['y',"c19.s2",'','fear'],
['n',"c19.s3"],
{c:[["c19.s4.o0",{s:-1},'cut'],["c19.s4.o1",{s:1},'keep']]},
['n',"c19.s5",'cut','fear'],
{x:'lights dim; flash',f:'cut'},
['n',"c19.s7",'keep']]},
{t:"c20.t",bg:'lab',st:[
{x:'cine wave; hush 600'},
['n',"c20.s0"],
['s',"c20.s1",'','sad'],
['n',"c20.s2"],
{j:"c20.s3.j"},
['s',"c20.s4",'','sad'],
['y',"c20.yH",'y>=7'],
['y',"c20.yL",'y<5','think'],
['y',"c20.s5",'','think']]},
{t:"c21.t",bg:'lab',st:[
['a',"c21.s0"],
['n',"c21.s1"],
['y',"c21.s1a",'','think'],
['s',"c21.s1b"],
{p:{k:'seq',t:"c21.s2.pt",pads:['١','٢','٣','٤'],q:[0,2,1,3,1,0],h:"c21.s2.ph",r:{s:1}}},
['n',"c21.s3"],
['a',"c21.s4",'','think']]},
{t:"c22.t",bg:'hall',st:[
['n',"c22.s0"],
['n',"c22.s1"],
['y',"c22.s2",'','angry'],
['n',"c22.s3"],
{c:[["c22.s4.o0",{y:1,s:-1},'argue'],["c22.s4.o1",{s:1},'listen']]}]},
{t:"c23.t",bg:'hall',st:[
['n',"c23.s0"],
['n',"c23.s1"],
['a',"c23.s2",'','fear'],
['n',"c23.s3"],
{x:'hush 1200'},
{j:"c23.s4.j"},
['s',"c23.s5",'','sad']]},
{t:"c24.t",bg:'hall',st:[
['n',"c24.s0",'','fear'],
{x:'cine mute'},
{x:'cam shake; wait 300'},
['y',"c24.s2",'','fear'],
['n',"c24.yH",'y>=7'],
['y',"c24.yL",'y<5','angry'],
['n',"c24.s3",'','fear'],
{x:'hush 1000'},
['s',"c24.s4",'','fear'],
['n',"c24.s5"],
{j:"c24.s6.j"}]},
{t:"c25.t",bg:'tunnel',st:[
['n',"c25.s0"],
['s',"c25.s1",'','fear'],
{p:{k:'seq',t:"c25.s2.pt",pads:['←','↑','→','↓'],q:[2,2,1,0,1],h:"c25.s2.ph",r:{y:1,s:1}}},
['y',"c25.s3",'','joy'],
['n',"c25.s4"]]},
{t:"c26.t",bg:'door',st:[
['n',"c26.s0"],
['y',"c26.s0a",'','think'],
['s',"c26.s1",'','sad'],
{p:{k:'code',t:"c26.s2.pt",cl:"puz.cl26",a:'30',h:"c26.s2.ph",r:{s:1}}},
['n',"c26.s3"],
['s',"c26.s4",'','sad'],
['s',"c26.sH",'s>=7','sad'],
['n',"c26.sL",'s<5']]},
{t:"c27.t",bg:'hall',st:[
['n',"c27.s0"],
{x:'cine orb'},

['y',"c27.s1",'','surprise'],
{x:'hush 1200'},
['n',"c27.s2"],
['s',"c27.s3",'','sad'],
['n',"c27.s4",'','fear'],
{j:"c27.s5.j"}]},
{t:"c28.t",bg:'hall',st:[
['n',"c28.s0"],
['y',"c28.s1",'','fear'],
{c:[["c28.s2.o0",{y:1,s:-1},'take'],["c28.s2.o1",{s:2,y:-1},'free']]},
['s',"c28.s3",'free','sad'],
['s',"c28.s4",'take','angry'],
['n',"c28.s5",'','fear']]},
{t:"c29.t",bg:'tunnel',st:[
{x:'lights off'},
['n',"c29.s1",'','fear'],
['y',"c29.s2",'','fear'],
['n',"c29.s3",'','fear'],
['s',"c29.s4"],
{p:{k:'seq',t:"c29.s5.pt",pads:['١','٢','٣','٤'],q:[3,1,2,0,2,1],h:"c29.s5.ph",r:{y:1}}},
{x:'lights dim'},
['n',"c29.s7"],
{x:'lights on'},
['a',"c29.s9",'','joy']]},
{t:"c30.t",bg:'roof',st:[
['n',"c30.s0"],
['y',"c30.s1",'','sad'],
{x:'cine wave; hush 800'},
['n',"c30.s2",'','fear'],
['a',"c30.s3",'','fear'],
['s',"c30.s4",'','fear'],
['n',"c30.s5",'','fear'],
{j:"c30.s6.j"}]},
{t:"c31.t",bg:'roof',st:[
{x:'title part3.t'},
['n',"c31.s0"],
{x:'hush 1200'},
['a',"c31.s1",'','sad'],
['y',"c31.s2"],
['s',"c31.s3",'','fear'],
['n',"c31.s4"],
{c:[["c31.s5.o0",{s:1},'rest'],["c31.s5.o1",{y:1},'go']]}]},
{t:"c32.t",bg:'souk',st:[
['n',"c32.s0"],
{x:'hush 1000'},
['y',"c32.s1",'','fear'],
['n',"c32.s2"],
{j:"c32.s3.j"},
['a',"c32.s4",'','think']]},
{t:"c33.t",bg:'studio',st:[
['n',"c33.s0"],
['n',"c33.s1"],
['n',"c33.s2"],
{j:"c33.s3.j"},
['s',"c33.s4",'listen','think'],
['y',"c33.s5",'argue','angry']]},
{t:"c34.t",bg:'souk',st:[
['n',"c34.s0"],
['y',"c34.s1"],
{p:{k:'code',t:"c34.s2.pt",cl:'١ ثم ٤ ثم ؟ — ثلاث خانات',a:'147',h:"c34.s2.ph",r:{y:1}}},
['n',"c34.s3"],
{j:"c34.s4.j"}]},
{t:"c35.t",bg:'door',st:[
['n',"c35.s0"],
['s',"c35.s1",'','sad'],
['a',"c35.s2"],
{p:{k:'pick',t:"c35.s3.pt",cl:"puz.cl35",o:[{t:"puz.o35a",iv:5},{t:"puz.o35b",iv:9},{t:"puz.o35c",iv:7}],a:2,h:"c35.s3.ph",r:{s:1}}},
['n',"c35.s4"],
{j:"c35.s5.j"}]},
{t:"c36.t",bg:'souk',st:[
['n',"c36.s0",'','fear'],
{x:'cine shadow'},

['y',"c36.s1",'','fear'],
{x:'hush 1000'},
['n',"c36.s2",'','fear'],
{c:[["c36.s3.o0",{s:-1},'run'],["c36.s3.o1",{s:1,y:1},'face']]},
['s',"c36.s4",'run','fear'],
['y',"c36.s5",'face','joy']]},
{t:"c37.t",bg:'roof',st:[
['n',"c37.s0"],
['y',"c37.s1",'','think'],
{p:{k:'code',t:"c37.s2.pt",cl:'أصغر عدد أكبر من ٩٠ ويقبل القسمة على ٧',a:'91',h:"c37.s2.ph",r:{y:1}}},
['n',"c37.s3"],
{j:"c37.s4.j"}]},
{t:"c38.t",bg:'studio',st:[
['n',"c38.s0"],
['a',"c38.s1"],
['y',"c38.s2"],
{c:[["c38.s3.o0",{y:1,s:1},'oath'],["c38.s3.o1",{y:-1,s:-1},'solo']]},
['s',"c38.s4",'oath','joy'],
['s',"c38.s5",'solo','sad']]},
{t:"c39.t",bg:'stairs',st:[
['n',"c39.s0"],
['s',"c39.s0a",'','sad'],
['a',"c39.s1",'','fear'],
['y',"c39.s2",'','angry'],
['a',"c39.s2a",'','calm'],
['s',"c39.sH",'s>=7'],
['n',"c39.sL",'s<5'],
{x:'hush 1000'},
['n',"c39.s3"]]},
{t:"c40.t",bg:'tunnel',st:[
['n',"c40.s0",'','fear'],
['s',"c40.s1",'','fear'],
['y',"c40.s1a",'','think'],
{p:{k:'seq',t:"c40.s2.pt",pads:['←','↑','→','↓'],q:[1,2,2,0,3],h:"c40.s2.ph",r:{s:1,y:1}}},
['n',"c40.s3"],
['a',"c40.s4",'','think']]},
{t:"c41.t",bg:'lab',st:[
['n',"c41.s0"],
['y',"c41.s1",'','surprise'],

{x:'hush 1000'},
['n',"c41.s2"],
['s',"c41.s3",'','fear'],
{j:"c41.s4.j"}]},
{t:"c42.t",bg:'hall',st:[
['n',"c42.s0"],
['n',"c42.s1"],
['n',"c42.s2"],
['s',"c42.s3",'listen','sad'],
['y',"c42.s4",'argue','think'],
['n',"c42.s5"],
['y',"c42.yH",'y>=7'],
['y',"c42.yL",'y<5','angry'],
{x:'hush 1000'},
{j:"c42.s6.j"}]},
{t:"c43.t",bg:'hall',st:[
['n',"c43.s0"],
{x:'cine orb'},

['y',"c43.s1"],
['n',"c43.sH",'s>=7'],
['y',"c43.yL",'y<5','fear'],
{x:'hush 1200'},
{c:[["c43.s2.o0",{},'release'],["c43.s2.o1",{},'seal'],["c43.s2.o2",{},'guard'],["c43.s2.o3",{},'destroy']]},
['n',"c43.s3",'','fear']]},
{t:"c44.t",bg:'hall',st:[
['n',"c44.s0"],
{p:{k:'seq',t:"c44.s1.pt",pads:['١','٢','٣','٤'],q:[1,0,3,2,0,1],h:"c44.s1.ph",r:{y:1,s:1}}},
['n',"c44.s2"],
['a',"c44.s3",'','fear'],
['n',"c44.s4"]]},
{t:"c45.t",bg:'roof',st:[
['n',"c45.s0"],
['y',"c45.s1",'','sad'],
['s',"c45.s2",'','sad'],
['a',"c45.s3",'','sad'],
{x:'hush 2000'},
['n',"c45.s4"],
{j:"c45.s5.j"}]}
];
const SC2={roof:[.5,.88,.42],studio:[.64,.90,.56],souk:[.5,.90,.44],door:[.5,.90,.42],stairs:[.62,.91,.46],tunnel:[.55,.90,.44],lab:[.58,.92,.42],hall:[.5,.90,.40]};
// توزيع الشخصيات لكل فصل: رقم التوزيع (0 مجموعة، 1 متبادل، 2 قريب من الشاشة) ثم من يحضر (a آدم، y ياسمين، s سامي)
const STG=['2a','0ay','0ay','1','0','1','0','2','1','2','0','2','0','1','2','0','1','2','0','2','1','0','1','2','1','2','0','2','2','0','0','1','2','0','1','2','1','2','0','1','2','0','2','1','0'];
const EN={a:['140px','0px'],y:['0px','60px'],s:['-140px','0px']};
// كل الأدلة القابلة للجمع دون شروط (تُستعمل للنهاية السرية)
const ALLJ=[...new Set(C.flatMap(c=>c.st.filter(x=>x.j&&!x.f).map(x=>x.j)))];
function ending(){const f=G.f;
if(G.y<4||G.s<4)return["end5.t","end5.d",'hall',5];
if(f.destroy)return["end3.t","end3.d",'roof',3];
if(f.guard)return["end2.t","end2.d",'hall',2];
if(f.release&&G.y>=7&&G.s>=7){
if(!G.err&&ALLJ.every(j=>G.j.includes(j)))return["end6.t","end6.d",'roof',6];
return["end1.t","end1.d",'roof',1]}
return["end4.t","end4.d",'roof',4]}
const MAPB=[['hall',"bg.hall"],['lab',"bg.lab"],['stairs',"bg.stairs"],['tunnel',"bg.tunnel"],['souk',"bg.souk"],['studio',"bg.studio"],['roof',"bg.roof"],['door',"bg.door"]],MAPC=[['a',"name.a"],['y',"name.y"],['s',"name.s"]];
const TONE={roof:.85,studio:.95,souk:.85,door:.85,stairs:.8,tunnel:.8,lab:.85,hall:.9};
