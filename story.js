// ===== بيانات اللعبة (خاصة بهذه القصة) =====
// الملفات: images.js ثم lang_ar.js ثم story.js ثم engine.js. نصوص القصة كلها في lang_ar.js (تُستدعى هنا بـ TR('مفتاح')).
// ما يجب أن يعرّفه هذا الملف للمحرّك: GAME (اسم ومعرّف)، K (مفتاح الحفظ)، N (الشخصيات: الاسم واللون)،
// S (ألوان المشاهد)، F (نغمات الألغاز)، رسم الشخصيات الاحتياطي (fig…)، BG (رسوم الخلفيات)، C (الفصول)،
// SC2 وSTG (توزيع الشخصيات)، EN (نقاط الدخول)، ending() (النهايات)، MAPB (أسماء الخلفيات)، TONE (نبرة كل مشهد).
// ملاحظة: المحرّك يفترض ثلاث شخصيات مفاتيحها a وy وs.
var GAME={id:'smm',part:TR('game.part'),homePart:TR('game.homePart'),homeTitle:TR('game.homeTitle'),partOf:c=>TR('game.partWord')+' '+TR('game.partNums')[Math.min(2,c/15|0)]};
const K=GAME.id+'_p1';
const N={a:[TR("name.a"),'#5ec8ff'],y:[TR("name.y"),'#ff7eb6'],s:[TR("name.s"),'#ffc857'],n:['','#e9ecf5']};
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
{t:TR("c01.t"),bg:'roof',st:[
['n',TR("c01.s0")],
['a',TR("c01.s1")],
['n',TR("c01.s2")],
['a',TR("c01.s3"),'','surprise'],
['n',TR("c01.s4"),'','fear'],
{j:TR("c01.s5.j")},
['a',TR("c01.s6"),'','think']]},
{t:TR("c02.t"),bg:'studio',st:[
['n',TR("c02.s0")],
['y',TR("c02.s1")],
['a',TR("c02.s2")],
['y',TR("c02.s3"),'','fear'],
{j:TR("c02.s4.j")},
['y',TR("c02.s5"),'','think'],
{c:[[TR("c02.s6.o0"),{s:1},'sami'],[TR("c02.s6.o1"),{y:1},'alone']]}]},
{t:TR("c03.t"),bg:'souk',st:[
['n',TR("c03.s0")],
{x:'enter s'},
['s',TR("c03.s2"),'sami'],
['s',TR("c03.s3"),'alone','angry'],
['s',TR("c03.s4"),'','sad'],
['y',TR("c03.s5")],
{p:{k:'seq',t:TR("c03.s6.pt"),pads:['١','٢','٣','٤'],q:[0,2,1,3],h:TR("c03.s6.ph"),r:{s:1}}},
['n',TR("c03.s7"),'','fear'],
{j:TR("c03.s8.j")}]},
{t:TR("c04.t"),bg:'door',st:[
['n',TR("c04.s0")],
['y',TR("c04.s1"),'','surprise'],
{j:TR("c04.s2.j")},
{p:{k:'ord',t:TR("c04.s3.pt"),cl:TR("puz.ord4"),o:[TR("puz.o4a"),TR("puz.o4b"),TR("puz.o4c")],a:[1,2,0],h:TR("c04.s3.ph"),r:{y:1}}},
['y',TR("c04.s4"),'','joy']]},
{t:TR("c05.t"),bg:'stairs',st:[
['n',TR("c05.s0")],
['a',TR("c05.s1")],
['n',TR("c05.s2")],
{c:[[TR("c05.s3.o0"),{y:1,s:-1},'ask'],[TR("c05.s3.o1"),{s:1},'wait']]},
['s',TR("c05.s4"),'ask','sad'],
['s',TR("c05.s5"),'wait','sad'],
{j:TR("c05.s6.j")},
['y',TR("c05.s7"),'','surprise'],
['s',TR("c05.s8"),'','sad']]},
{t:TR("c06.t"),bg:'tunnel',st:[
['n',TR("c06.s0")],
['s',TR("c06.s1")],
{p:{k:'seq',t:TR("c06.s2.pt"),pads:['←','↑','→','↓'],q:[2,1,0,1],h:TR("c06.s2.ph"),r:{s:1,y:1}}},
['n',TR("c06.s3")],
['y',TR("c06.s4"),'','fear'],
{j:TR("c06.s5.j")},
['a',TR("c06.s6"),'','fear']]},
{t:TR("c07.t"),bg:'tunnel',st:[
['n',TR("c07.s0")],
['y',TR("c07.s1")],
['s',TR("c07.s2"),'','surprise'],
{j:TR("c07.s3.j")},
['a',TR("c07.s4"),'','think'],
{c:[[TR("c07.s5.o0"),{y:1},'careful'],[TR("c07.s5.o1"),{s:1,y:-1},'force']]}]},
{t:TR("c08.t"),bg:'door',st:[
['y',TR("c08.s0"),'careful'],
['s',TR("c08.s1"),'force','angry'],
['y',TR("c08.s2")],
['a',TR("c08.s3")],
{p:{k:'code',t:TR("c08.s4.pt"),cl:'التردد ثم عدد الثواني بين كل تكرار',a:'177',h:TR("c08.s4.ph"),r:{y:1}}},
['n',TR("c08.s5")]]},
{t:TR("c09.t"),bg:'lab',st:[
['n',TR("c09.s0")],
['a',TR("c09.s1"),'','think'],
['y',TR("c09.s2"),'','fear'],
{j:TR("c09.s3.j")},
['s',TR("c09.s4"),'','fear'],
['n',TR("c09.s5")]]},
{t:TR("c10.t"),bg:'lab',st:[
['a',TR("c10.s0")],
['n',TR("c10.s1"),'','fear'],
['s',TR("c10.s2"),'','sad'],
['n',TR("c10.s3")],
{j:TR("c10.s4.j")},
{c:[[TR("c10.s5.o0"),{s:1},'tape'],[TR("c10.s5.o1"),{y:1},'rush']]}]},
{t:TR("c11.t"),bg:'lab',st:[
['y',TR("c11.s0"),'tape'],
['y',TR("c11.s1"),'rush','fear'],
['a',TR("c11.s2")],
{p:{k:'seq',t:TR("c11.s3.pt"),pads:['١','٢','٣','٤'],q:[1,3,0,2,3],h:TR("c11.s3.ph"),r:{y:1}}},
['n',TR("c11.s4"),'','fear'],
['a',TR("c11.s5"),'','fear']]},
{t:TR("c12.t"),bg:'lab',st:[
['s',TR("c12.s0"),'','sad'],
['s',TR("c12.s1"),'','fear'],
['y',TR("c12.s2"),'','angry'],
['n',TR("c12.s3")],
{c:[[TR("c12.s4.o0"),{s:2},'trust'],[TR("c12.s4.o1"),{y:1,s:-1},'press']]},
['s',TR("c12.s5"),'trust','sad'],
['s',TR("c12.s6"),'press']]},
{t:TR("c13.t"),bg:'hall',st:[
['n',TR("c13.s0")],
['y',TR("c13.s1"),'','surprise'],
['n',TR("c13.s2")],
{j:TR("c13.s3.j")},
['a',TR("c13.s4"),'','surprise'],
['n',TR("c13.s5")]]},
{t:TR("c14.t"),bg:'hall',st:[
['y',TR("c14.s0")],
['s',TR("c14.s1")],
['a',TR("c14.s2")],
{p:{k:'code',t:TR("c14.s3.pt"),cl:'عدد الباحثين × عدد الأبواب',a:'12',h:TR("c14.s3.ph"),r:{s:1}}},
['n',TR("c14.s4")],
{j:TR("c14.s5.j")}]},
{t:TR("c15.t"),bg:'hall',st:[
['n',TR("c15.s0")],
['a',TR("c15.s1"),'','fear'],
['y',TR("c15.s2")],
['s',TR("c15.s3"),'','fear'],
['n',TR("c15.s4")],
['n',TR("c15.s5"),'','fear'],
['a',TR("c15.s6"),'','surprise'],
{j:TR("c15.s7.j")}]},
{t:TR("c16.t"),bg:'stairs',st:[
['n',TR("c16.s0")],
['a',TR("c16.s1"),'','surprise'],
['n',TR("c16.s2")],
['y',TR("c16.s3"),'','fear'],
{c:[[TR("c16.s4.o0"),{y:-1},'answered'],[TR("c16.s4.o1"),{y:1},'silent']]},
['n',TR("c16.s5"),'answered','fear'],
['s',TR("c16.s6"),'answered','angry'],
['n',TR("c16.s7"),'silent'],
{j:TR("c16.s8.j")}]},
{t:TR("c17.t"),bg:'tunnel',st:[
['n',TR("c17.s0")],
['y',TR("c17.s1")],
['s',TR("c17.s2"),'','sad'],
['a',TR("c17.s3")],
{j:TR("c17.s4.j")},
['y',TR("c17.s5"),'','think']]},
{t:TR("c18.t"),bg:'door',st:[
['n',TR("c18.s0")],
['s',TR("c18.s1")],
['y',TR("c18.s2")],
{p:{k:'ord',t:TR("c18.s3.pt"),cl:TR("puz.ord18"),o:[TR("puz.o18a"),TR("puz.o18b"),TR("puz.o18c")],a:[2,0,1],h:TR("c18.s3.ph"),r:{y:1}}},
['n',TR("c18.s4")]]},
{t:TR("c19.t"),bg:'lab',st:[
['n',TR("c19.s0")],
['a',TR("c19.s1"),'','fear'],
['y',TR("c19.s2"),'','fear'],
['n',TR("c19.s3")],
{c:[[TR("c19.s4.o0"),{s:-1},'cut'],[TR("c19.s4.o1"),{s:1},'keep']]},
['n',TR("c19.s5"),'cut','fear'],
{x:'lights dim; flash',f:'cut'},
['n',TR("c19.s7"),'keep']]},
{t:TR("c20.t"),bg:'lab',st:[
['n',TR("c20.s0")],
['s',TR("c20.s1"),'','sad'],
['n',TR("c20.s2")],
{j:TR("c20.s3.j")},
['s',TR("c20.s4"),'','sad'],
['y',TR("c20.s5"),'','think']]},
{t:TR("c21.t"),bg:'lab',st:[
['a',TR("c21.s0")],
['n',TR("c21.s1")],
['y',TR("c21.s1a"),'','think'],
['s',TR("c21.s1b")],
{p:{k:'seq',t:TR("c21.s2.pt"),pads:['١','٢','٣','٤'],q:[0,2,1,3,1,0],h:TR("c21.s2.ph"),r:{s:1}}},
['n',TR("c21.s3")],
['a',TR("c21.s4"),'','think']]},
{t:TR("c22.t"),bg:'hall',st:[
['n',TR("c22.s0")],
['n',TR("c22.s1")],
['y',TR("c22.s2"),'','angry'],
['n',TR("c22.s3")],
{c:[[TR("c22.s4.o0"),{y:1,s:-1},'argue'],[TR("c22.s4.o1"),{s:1},'listen']]}]},
{t:TR("c23.t"),bg:'hall',st:[
['n',TR("c23.s0")],
['n',TR("c23.s1")],
['a',TR("c23.s2"),'','fear'],
['n',TR("c23.s3")],
{j:TR("c23.s4.j")},
['s',TR("c23.s5"),'','sad']]},
{t:TR("c24.t"),bg:'hall',st:[
['n',TR("c24.s0"),'','fear'],
{x:'cam shake; wait 300'},
['y',TR("c24.s2"),'','fear'],
['n',TR("c24.s3"),'','fear'],
['s',TR("c24.s4"),'','fear'],
['n',TR("c24.s5")],
{j:TR("c24.s6.j")}]},
{t:TR("c25.t"),bg:'tunnel',st:[
['n',TR("c25.s0")],
['s',TR("c25.s1"),'','fear'],
{p:{k:'seq',t:TR("c25.s2.pt"),pads:['←','↑','→','↓'],q:[2,2,1,0,1],h:TR("c25.s2.ph"),r:{y:1,s:1}}},
['y',TR("c25.s3"),'','joy'],
['n',TR("c25.s4")]]},
{t:TR("c26.t"),bg:'door',st:[
['n',TR("c26.s0")],
['y',TR("c26.s0a"),'','think'],
['s',TR("c26.s1"),'','sad'],
{p:{k:'code',t:TR("c26.s2.pt"),cl:TR("puz.cl26"),a:'30',h:TR("c26.s2.ph"),r:{s:1}}},
['n',TR("c26.s3")],
['s',TR("c26.s4"),'','sad']]},
{t:TR("c27.t"),bg:'hall',st:[
['n',TR("c27.s0")],
['y',TR("c27.s1"),'','surprise'],
['n',TR("c27.s2")],
['s',TR("c27.s3"),'','sad'],
['n',TR("c27.s4"),'','fear'],
{j:TR("c27.s5.j")}]},
{t:TR("c28.t"),bg:'hall',st:[
['n',TR("c28.s0")],
['y',TR("c28.s1"),'','fear'],
{c:[[TR("c28.s2.o0"),{y:1,s:-1},'take'],[TR("c28.s2.o1"),{s:2,y:-1},'free']]},
['s',TR("c28.s3"),'free','sad'],
['s',TR("c28.s4"),'take','angry'],
['n',TR("c28.s5"),'','fear']]},
{t:TR("c29.t"),bg:'tunnel',st:[
{x:'lights off'},
['n',TR("c29.s1"),'','fear'],
['y',TR("c29.s2"),'','fear'],
['n',TR("c29.s3"),'','fear'],
['s',TR("c29.s4")],
{p:{k:'seq',t:TR("c29.s5.pt"),pads:['١','٢','٣','٤'],q:[3,1,2,0,2,1],h:TR("c29.s5.ph"),r:{y:1}}},
{x:'lights dim'},
['n',TR("c29.s7")],
{x:'lights on'},
['a',TR("c29.s9"),'','joy']]},
{t:TR("c30.t"),bg:'roof',st:[
['n',TR("c30.s0")],
['y',TR("c30.s1"),'','sad'],
['n',TR("c30.s2"),'','fear'],
['a',TR("c30.s3"),'','fear'],
['s',TR("c30.s4"),'','fear'],
['n',TR("c30.s5"),'','fear'],
{j:TR("c30.s6.j")}]},
{t:TR("c31.t"),bg:'roof',st:[
['n',TR("c31.s0")],
['a',TR("c31.s1"),'','sad'],
['y',TR("c31.s2")],
['s',TR("c31.s3"),'','fear'],
['n',TR("c31.s4")],
{c:[[TR("c31.s5.o0"),{s:1},'rest'],[TR("c31.s5.o1"),{y:1},'go']]}]},
{t:TR("c32.t"),bg:'souk',st:[
['n',TR("c32.s0")],
['y',TR("c32.s1"),'','fear'],
['n',TR("c32.s2")],
{j:TR("c32.s3.j")},
['a',TR("c32.s4"),'','think']]},
{t:TR("c33.t"),bg:'studio',st:[
['n',TR("c33.s0")],
['n',TR("c33.s1")],
['n',TR("c33.s2")],
{j:TR("c33.s3.j")},
['s',TR("c33.s4"),'listen','think'],
['y',TR("c33.s5"),'argue','angry']]},
{t:TR("c34.t"),bg:'souk',st:[
['n',TR("c34.s0")],
['y',TR("c34.s1")],
{p:{k:'code',t:TR("c34.s2.pt"),cl:'١ ثم ٤ ثم ؟ — ثلاث خانات',a:'147',h:TR("c34.s2.ph"),r:{y:1}}},
['n',TR("c34.s3")],
{j:TR("c34.s4.j")}]},
{t:TR("c35.t"),bg:'door',st:[
['n',TR("c35.s0")],
['s',TR("c35.s1"),'','sad'],
['a',TR("c35.s2")],
{p:{k:'seq',t:TR("c35.s3.pt"),pads:['١','٢','٣','٤'],q:[2,0,3,1,2],h:TR("c35.s3.ph"),r:{s:1}}},
['n',TR("c35.s4")],
{j:TR("c35.s5.j")}]},
{t:TR("c36.t"),bg:'souk',st:[
['n',TR("c36.s0"),'','fear'],
['y',TR("c36.s1"),'','fear'],
['n',TR("c36.s2"),'','fear'],
{c:[[TR("c36.s3.o0"),{s:-1},'run'],[TR("c36.s3.o1"),{s:1,y:1},'face']]},
['s',TR("c36.s4"),'run','fear'],
['y',TR("c36.s5"),'face','joy']]},
{t:TR("c37.t"),bg:'roof',st:[
['n',TR("c37.s0")],
['y',TR("c37.s1"),'','think'],
{p:{k:'code',t:TR("c37.s2.pt"),cl:'أصغر عدد أكبر من ٩٠ ويقبل القسمة على ٧',a:'91',h:TR("c37.s2.ph"),r:{y:1}}},
['n',TR("c37.s3")],
{j:TR("c37.s4.j")}]},
{t:TR("c38.t"),bg:'studio',st:[
['n',TR("c38.s0")],
['a',TR("c38.s1")],
['y',TR("c38.s2")],
{c:[[TR("c38.s3.o0"),{y:1,s:1},'oath'],[TR("c38.s3.o1"),{y:-1,s:-1},'solo']]},
['s',TR("c38.s4"),'oath','joy'],
['s',TR("c38.s5"),'solo','sad']]},
{t:TR("c39.t"),bg:'stairs',st:[
['n',TR("c39.s0")],
['s',TR("c39.s0a"),'','sad'],
['a',TR("c39.s1"),'','fear'],
['y',TR("c39.s2"),'','angry'],
['a',TR("c39.s2a"),'','calm'],
['n',TR("c39.s3")]]},
{t:TR("c40.t"),bg:'tunnel',st:[
['n',TR("c40.s0"),'','fear'],
['s',TR("c40.s1"),'','fear'],
['y',TR("c40.s1a"),'','think'],
{p:{k:'seq',t:TR("c40.s2.pt"),pads:['←','↑','→','↓'],q:[1,2,2,0,3],h:TR("c40.s2.ph"),r:{s:1,y:1}}},
['n',TR("c40.s3")],
['a',TR("c40.s4"),'','think']]},
{t:TR("c41.t"),bg:'lab',st:[
['n',TR("c41.s0")],
['y',TR("c41.s1"),'','surprise'],
['n',TR("c41.s2")],
['s',TR("c41.s3"),'','fear'],
{j:TR("c41.s4.j")}]},
{t:TR("c42.t"),bg:'hall',st:[
['n',TR("c42.s0")],
['n',TR("c42.s1")],
['n',TR("c42.s2")],
['s',TR("c42.s3"),'listen','sad'],
['y',TR("c42.s4"),'argue','think'],
['n',TR("c42.s5")],
{j:TR("c42.s6.j")}]},
{t:TR("c43.t"),bg:'hall',st:[
['n',TR("c43.s0")],
['y',TR("c43.s1")],
{c:[[TR("c43.s2.o0"),{},'release'],[TR("c43.s2.o1"),{},'seal'],[TR("c43.s2.o2"),{},'guard'],[TR("c43.s2.o3"),{},'destroy']]},
['n',TR("c43.s3"),'','fear']]},
{t:TR("c44.t"),bg:'hall',st:[
['n',TR("c44.s0")],
{p:{k:'seq',t:TR("c44.s1.pt"),pads:['١','٢','٣','٤'],q:[1,0,3,2,0,1],h:TR("c44.s1.ph"),r:{y:1,s:1}}},
['n',TR("c44.s2")],
['a',TR("c44.s3"),'','fear'],
['n',TR("c44.s4")]]},
{t:TR("c45.t"),bg:'roof',st:[
['n',TR("c45.s0")],
['y',TR("c45.s1"),'','sad'],
['s',TR("c45.s2"),'','sad'],
['a',TR("c45.s3"),'','sad'],
['n',TR("c45.s4")],
{j:TR("c45.s5.j")}]}
];
const SC2={roof:[.5,.88,.42],studio:[.64,.90,.56],souk:[.5,.90,.44],door:[.5,.90,.42],stairs:[.62,.91,.46],tunnel:[.55,.90,.44],lab:[.58,.92,.42],hall:[.5,.90,.40]};
// توزيع الشخصيات لكل فصل: رقم التوزيع (0 مجموعة، 1 متبادل، 2 قريب من الشاشة) ثم من يحضر (a آدم، y ياسمين، s سامي)
const STG=['2a','0ay','0ay','1','0','1','0','2','1','2','0','2','0','1','2','0','1','2','0','2','1','0','1','2','1','2','0','2','2','0','0','1','2','0','1','2','1','2','0','1','2','0','2','1','0'];
const EN={a:['140px','0px'],y:['0px','60px'],s:['-140px','0px']};
function ending(){const f=G.f;
if(G.y<4||G.s<4)return[TR("end5.t"),TR("end5.d"),'hall',5];
if(f.destroy)return[TR("end3.t"),TR("end3.d"),'roof',3];
if(f.guard)return[TR("end2.t"),TR("end2.d"),'hall',2];
if(f.release&&G.y>=7&&G.s>=7)return[TR("end1.t"),TR("end1.d"),'roof',1];
return[TR("end4.t"),TR("end4.d"),'roof',4]}
const MAPB=[['hall',TR("bg.hall")],['lab',TR("bg.lab")],['stairs',TR("bg.stairs")],['tunnel',TR("bg.tunnel")],['souk',TR("bg.souk")],['studio',TR("bg.studio")],['roof',TR("bg.roof")],['door',TR("bg.door")]],MAPC=[['a',TR("name.a")],['y',TR("name.y")],['s',TR("name.s")]];
const TONE={roof:.85,studio:.95,souk:.85,door:.85,stairs:.8,tunnel:.8,lab:.85,hall:.9};
