
/* ---------- constants ---------- */
const TYPES=[
  {k:'income',label:'Income',tip:'Tracking the money that comes in, like paycheques, side income, interest and dividends.'},
  {k:'bills',label:'Bills',tip:'Fixed expenses that repeat monthly or quarterly, like rent, phone and subscriptions.'},
  {k:'expenses',label:'Expenses',tip:'Flexible spending that changes week to week, like groceries, dining out and shopping.'},
  {k:'savings',label:'Savings',tip:'Money set aside for goals you can reach soon, like an emergency fund or a trip.'},
  {k:'investments',label:'Investments',tip:'Money put toward long-term growth, like retirement and brokerage accounts.'},
  {k:'debt',label:'Debt',tip:'Payments that pay down a loan balance, so you can watch what you owe shrink.'}
];
function tipHtml(T,cls,aria){return `<span class="tipwrap ${cls||''}"><button type="button" class="tip" aria-label="${aria||('What is '+T.label+'?')}" aria-describedby="tip-${T.k}">i</button><span class="tipbox" role="tooltip" id="tip-${T.k}">${T.tip}</span></span>`}
const MONTHS=(()=>{const a=[];let y=2026,m=10;for(let i=0;i<15;i++){a.push(y+'-'+String(m).padStart(2,'0'));m++;if(m>12){m=1;y++}}return a})();
const MNAME=['January','February','March','April','May','June','July','August','September','October','November','December'];
const QUARTERS=[{q:'Q4 2026',end:'2026-12'},{q:'Q1 2027',end:'2027-03'},{q:'Q2 2027',end:'2027-06'},{q:'Q3 2027',end:'2027-09'},{q:'Q4 2027',end:'2027-12'}];
const PALETTES=[{k:'forest',n:'Forest',c:'#2F5D46'},{k:'ocean',n:'Ocean',c:'#245A7D'},{k:'berry',n:'Berry',c:'#7A2E56'},{k:'graphite',n:'Graphite',c:'#33383F'}];
function applyPalette(){const r=document.documentElement,p=(typeof S!=='undefined'&&S.palette)||'forest';if(p==='forest')r.removeAttribute('data-palette');else r.setAttribute('data-palette',p)}
const STORE='bt_proto_v1', SESSION='bt_proto_user';

/* ---------- helpers ---------- */
const pad=n=>String(n).padStart(2,'0');
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const r2=n=>Math.round(n*100)/100;
function money(n){n=r2(n||0);const neg=n<0;const a=Math.abs(n);const s=a.toLocaleString('en-US',{minimumFractionDigits:a%1?2:0,maximumFractionDigits:2});return (neg?'-':'')+'$'+s}
const mLabel=mk=>{const [y,m]=mk.split('-');return MNAME[+m-1]+' '+y};
const mShort=mk=>MNAME[+mk.split('-')[1]-1].slice(0,3);
const uid=()=>'c'+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const todayStr=()=>{const d=new Date();return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())};
function toast(msg){const t=document.getElementById('toast');t.textContent=msg;t.hidden=false;clearTimeout(toast.h);toast.h=setTimeout(()=>t.hidden=true,2200)}

/* ---------- data ---------- */
function seed(){
  const mk=(id,name,extra)=>Object.assign({id,name},extra||{});
  const cats={
    income:[mk('i1','9 to 5'),mk('i2','Side hustle'),mk('i3','Interest'),mk('i4','Dividends')],
    bills:[mk('b1','Rent'),mk('b2','Student loan'),mk('b3','Car payment'),mk('b4','Utilities'),mk('b5','Phone bill'),mk('b6','Subscriptions'),mk('b7','Internet'),mk('b8','Gym membership')],
    expenses:['Gas','Groceries','Dining out','Shopping','Personal care','Pet supplies','Hobbies','Transportation','Health','Donations','Socials','Gifts','Coffee'].map((n,i)=>mk('e'+(i+1),n)),
    savings:[mk('s1','Emergency fund',{goal:5000,open:1200}),mk('s2','Travel fund',{goal:2000,open:0}),mk('s3','Gift budget',{goal:800,open:0})],
    investments:[mk('n1','Retirement account',{room:12000,limit:7000}),mk('n3','Brokerage account',{limit:0}),mk('n4','Pension',{limit:0})],
    debt:[mk('d1','Loan',{start:5000})]
  };
  const base={i1:4200,b1:1200,b4:200,b5:60,b6:40,b8:30,e1:50,e2:400,e3:150,e4:100,e5:50,e13:40,s1:300,s2:100,n1:250,d1:150};
  const plan={};MONTHS.forEach(m=>plan[m]=Object.assign({},base));
  const t=(d,desc,amt,sub)=>({id:uid(),date:'2026-11-'+pad(d),desc,amt,sub});
  const tx=[
    t(1,'Paycheque',3500,'i1'),t(1,'Rent',1200,'b1'),t(1,'Phone',60,'b5'),t(2,'Coffee',5.5,'e13'),
    t(3,'Groceries',86.4,'e2'),t(3,'Gas',48,'e1'),t(4,'Streaming',16,'b6'),t(5,'Dinner out',64,'e3'),
    t(7,'Groceries',72.15,'e2'),t(7,'Coffee',6,'e13'),t(8,'Utilities',178.2,'b4'),t(9,'Gym',30,'b8'),
    t(10,'New jeans',89,'e4'),t(11,'Emergency fund',300,'s1'),t(12,'Groceries',95.8,'e2'),t(13,'Lunch with friends',38,'e3'),
    t(14,'Loan payment',150,'d1'),t(15,'Retirement contribution',250,'n1'),t(16,'Haircut',45,'e5'),t(17,'Groceries',61.3,'e2'),t(18,'Coffee',5.5,'e13')
  ];
  /* demo activity for Dec 2026 to Dec 2027 so every quarter looks different */
  MONTHS.filter(m=>m>='2026-12').forEach((mk,i)=>{const T=(d,desc,amt,sub)=>tx.push({id:uid(),date:mk+'-'+pad(d),desc,amt,sub});
    T(1,'Paycheque',3500,'i1');T(1,'Rent',1200,'b1');T(2,'Phone',60,'b5');T(9,'Utilities',170+(i*37)%40,'b4');
    T(8,'Groceries',330+(i*53)%60,'e2');T(12,'Dinner out',70+(i*29)%50,'e3');T(15,'Emergency fund',300,'s1');T(15,'Travel fund',100,'s2');
    T(16,'Gift budget',50,'s3');T(17,'Retirement contribution',250,'n1');T(18,'Loan payment',150,'d1')});
  const bal={'2026-11':{n1:2400,cash:1800},'2026-12':{n1:3100,n3:4200,n4:18500,cash:2200},'2027-03':{n1:4000,n3:4650,n4:19200,cash:2600},'2027-06':{n1:5200,n3:4900,n4:19900,cash:3100},'2027-09':{n1:5900,n3:5600,n4:20600,cash:3000},'2027-12':{n1:7100,n3:6300,n4:21400,cash:3700}};
  const rules=[{id:'r1',sub:'b3',amt:285,freq:'biweekly',start:'2026-10-02',end:'',label:'Car payment',since:''},{id:'r2',sub:'b2',amt:200,freq:'monthly',start:'2026-10-15',end:'',label:'Student loan',since:''}];
  return {v:2,cats,plan,tx,nw:{},bal,rules,skip:{}};
}
function load(){return window.__BT_INITIAL||null}
function save(){try{if(window.__BT_SAVE)window.__BT_SAVE(S)}catch(e){}}
let S=load()||seed();if(!S.bal)S.bal={};if(!S.rules)S.rules=[];if(!S.skip)S.skip={};
(function migrate(){
  if(S.v>=2)return;
  const ph={e14:'Other category 1',e15:'Other category 2',e16:'Other category 3',e17:'Other category 4',s4:'Goal 4',s5:'Goal 5',d2:'Loan 2',d3:'Loan 3',d4:'Loan 4',n2:'Retirement account 2'};
  const used=id=>S.tx.some(t=>t.sub===id)||Object.values(S.plan||{}).some(p=>p&&p[id]>0)||Object.values(S.bal||{}).some(b=>b&&b[id]!==undefined)||Object.values(S.nw||{}).some(q=>q&&q[id]>0);
  Object.keys(S.cats).forEach(k=>{S.cats[k]=S.cats[k].filter(c=>!(ph[c.id]&&c.name===ph[c.id]&&!used(c.id)&&!(c.goal||c.open||c.start||c.limit)));
    S.cats[k].forEach(c=>{if(c.id==='n1'&&c.name==='Retirement account 1')c.name='Retirement account';if(c.id==='d1'&&c.name==='Loan 1')c.name='Loan'})});
  S.v=2;save();
})();

/* ---------- recurring items ---------- */
const RANGE_FROM=MONTHS[0]+'-01', RANGE_TO=MONTHS[MONTHS.length-1]+'-31';
const FREQ=[['weekly','Every week'],['biweekly','Every 2 weeks'],['semimonthly','Twice a month (1st and 15th)'],['monthly','Once a month'],['quarterly','Every 3 months'],['yearly','Once a year']];
const FREQ_TXT={weekly:'every week',biweekly:'every 2 weeks',semimonthly:'twice a month (1st and 15th)',monthly:'once a month',quarterly:'every 3 months',yearly:'once a year'};
const REP='<svg class="rep" width="13" height="13" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 7V6a2 2 0 012-2h7l-2-2M13 9v1a2 2 0 01-2 2H4l2 2" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const dim=(y,m)=>new Date(y,m,0).getDate();
const ymd=(y,m,d)=>y+'-'+pad(m)+'-'+pad(d);
function addDays(s,n){const [y,m,d]=s.split('-').map(Number);const t=new Date(Date.UTC(y,m-1,d+n));return t.getUTCFullYear()+'-'+pad(t.getUTCMonth()+1)+'-'+pad(t.getUTCDate())}
const fmtDate=s=>new Date(s+'T00:00:00Z').toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric',year:'numeric',timeZone:'UTC'});
const shortDate=s=>new Date(s+'T00:00:00Z').toLocaleDateString('en-US',{month:'short',day:'numeric',timeZone:'UTC'});
function occurrences(r,from,to,ignoreSince){
  const out=[];let lo=from>r.start?from:r.start;
  if(!ignoreSince&&r.since&&r.since>lo)lo=r.since;
  const hi=(r.end&&r.end<to)?r.end:to;if(lo>hi)return out;
  const add=d=>{if(d>=lo&&d<=hi)out.push(d)};
  if(r.freq==='weekly'||r.freq==='biweekly'){
    const step=r.freq==='weekly'?7:14;let d=r.start;while(d<lo)d=addDays(d,step);for(;d<=hi;d=addDays(d,step))out.push(d);
  }else{
    let [y,m,sd]=r.start.split('-').map(Number);const step=r.freq==='quarterly'?3:(r.freq==='yearly'?12:1);
    while(ymd(y,m,1)<=hi){
      if(r.freq==='semimonthly'){add(ymd(y,m,1));add(ymd(y,m,15))}else add(ymd(y,m,Math.min(sd,dim(y,m))));
      m+=step;while(m>12){m-=12;y++}
    }
  }
  return out;
}
const ruleOk=r=>!!subOf(r.sub);
const skipKey=(r,d)=>r.id+'|'+d;
function postDue(){
  const t=todayStr(),to=t<RANGE_TO?t:RANGE_TO;let n=0;
  S.rules.filter(ruleOk).forEach(r=>{
    occurrences(r,RANGE_FROM,to).forEach(d=>{
      if(S.skip[skipKey(r,d)])return;
      if(S.tx.some(x=>x.ruleId===r.id&&x.date===d))return;
      if(S.tx.some(x=>!x.ruleId&&x.date===d&&x.sub===r.sub&&x.amt===r.amt))return;
      S.tx.push({id:uid(),date:d,desc:r.label||subOf(r.sub).name,amt:r.amt,sub:r.sub,ruleId:r.id});n++;
    });
  });
  if(n)save();return n;
}
function scheduledIn(mk){
  const t=todayStr(),out=[];
  S.rules.filter(ruleOk).forEach(r=>{
    occurrences(r,mk+'-01',mk+'-31').forEach(d=>{
      if(d<=t||S.skip[skipKey(r,d)])return;
      if(S.tx.some(x=>x.ruleId===r.id&&x.date===d))return;
      out.push({rid:r.id,date:d,amt:r.amt,sub:r.sub,desc:r.label||subOf(r.sub).name});
    });
  });
  return out.sort((a,b)=>a.date.localeCompare(b.date));
}
function schedPlan(mk){
  const o={};
  S.rules.filter(ruleOk).forEach(r=>{occurrences(r,mk+'-01',mk+'-31',true).forEach(d=>{if(!S.skip[skipKey(r,d)])o[r.sub]=r2((o[r.sub]||0)+r.amt)})});
  return o;
}
const liveIn=(s,mk)=>!s.archived||mk<=s.until;
const activeSubs=(k,keep)=>S.cats[k].filter(s=>!s.archived||s.id===keep);
const effPlan=(c,id)=>{const s=subOf(id);if(s&&!liveIn(s,c.mk))return 0;return c.plan[id]>0?c.plan[id]:(c.sp[id]||0)};
function newRuleDraft(){return {type:'bills',sub:'',amt:'',freq:'monthly',start:todayStr()>=RANGE_FROM?todayStr():RANGE_FROM,end:'',label:''}}
let rd=newRuleDraft(), editRuleId=null, ruleOpen=false;
function rulePreviewHtml(){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(rd.start))return '';
  const tmp={id:'tmp',freq:rd.freq,start:rd.start,end:rd.end||'',since:''},occ=occurrences(tmp,RANGE_FROM,RANGE_TO);
  if(!occ.length)return `No payments fall between ${esc(mLabel(MONTHS[0]))} and ${esc(mLabel(MONTHS[MONTHS.length-1]))}.`;
  let s=`Payments on ${occ.slice(0,3).map(shortDate).join(', ')}${occ.length>3?', and so on':''}.`;
  if(rd.freq==='weekly'||rd.freq==='biweekly'){
    const base=rd.freq==='weekly'?4:2,cnt={};occ.forEach(d=>cnt[d.slice(0,7)]=(cnt[d.slice(0,7)]||0)+1);
    const extra=Object.keys(cnt).filter(m=>cnt[m]>base).sort().map(m=>`${cnt[m]} in ${mLabel(m)}`);
    if(extra.length)s+=` Heads up: ${extra.join(', ')}. Your plan adjusts for those months automatically.`;
  }
  return esc(s);
}
function updateRulePreview(){const el=document.getElementById('rule-prev');if(el)el.innerHTML=rulePreviewHtml();const a=document.getElementById('r-amt-prev');if(a)a.textContent=isSum(rd.amt)?amtPreview(rd.amt):''}

let user=window.__BT_USER||null;
let wipeArmed=false, editId=null, sheetOpen=false;
const mq=window.matchMedia('(max-width: 760px)'), isMobile=()=>mq.matches;
mq.addEventListener('change',()=>{if(!mq.matches)sheetOpen=false;render()});
function parseAmount(raw){
  let s=String(raw==null?'':raw).replace(/^\s*=/,'').replace(/[$,\s]/g,'').replace(/[x\u00d7]/gi,'*').replace(/\u00f7/g,'/');
  if(!s||!/^[0-9+\-*/().]+$/.test(s))return NaN;
  let i=0;const peek=()=>s[i];
  function num(){
    if(peek()==='('){i++;const v=expr();if(peek()!==')')throw 0;i++;return v}
    if(peek()==='-'){i++;return -num()}
    const m=/^\d*\.?\d+|^\d+\.?/.exec(s.slice(i));if(!m)throw 0;i+=m[0].length;return parseFloat(m[0]);
  }
  function term(){let v=num();while(peek()==='*'||peek()==='/'){const o=s[i++],r=num();if(o==='/'){if(r===0)throw 0;v/=r}else v*=r}return v}
  function expr(){let v=term();while(peek()==='+'||peek()==='-'){const o=s[i++],r=term();v=o==='+'?v+r:v-r}return v}
  try{const v=expr();return i===s.length&&isFinite(v)?r2(v):NaN}catch(e){return NaN}
}
const isSum=s=>/[+*/x\u00d7\u00f7(]|.-/.test(String(s||'').trim().replace(/^=/,''));
function amtPreview(s){
  if(!String(s||'').trim())return '';
  if(!isSum(s))return '';
  const v=parseAmount(s);return isNaN(v)?'Not a valid sum yet':'= '+money(v);
}
function fitTip(w){
  const bx=w&&w.querySelector('.tipbox');if(!bx)return;
  bx.style.transform='';
  const r=bx.getBoundingClientRect(),W=document.documentElement.clientWidth;
  if(!r.width)return;
  let dx=0;if(r.right>W-8)dx=W-8-r.right;if(r.left+dx<8)dx=8-r.left;
  if(dx)bx.style.transform='translateX('+Math.round(dx)+'px)';
}
document.addEventListener('mouseover',e=>{const w=e.target.closest&&e.target.closest('.tipwrap');if(w)requestAnimationFrame(()=>fitTip(w))});
document.addEventListener('focusin',e=>{const w=e.target.closest&&e.target.closest('.tipwrap');if(w)requestAnimationFrame(()=>fitTip(w))});
function cancelEdit(){sheetOpen=false;if(editId){editId=null;draft.amt='';draft.desc='';draft.date=''}}
let tab=(S.setupDone||S.hideSetup)?'month':'cats', cur=(MONTHS.includes(todayStr().slice(0,7))?todayStr().slice(0,7):MONTHS[0]), selDay=null, draft={date:'',desc:'',amt:'',type:'expenses',sub:''}, step='email', emailVal='';

const typeOf=id=>{for(const T of TYPES) if(S.cats[T.k].some(c=>c.id===id)) return T.k;return null};
const subOf=id=>{for(const T of TYPES){const c=S.cats[T.k].find(c=>c.id===id);if(c)return c}return null};
const monthTx=mk=>S.tx.filter(t=>t.date.slice(0,7)===mk);

function calc(mk){
  const tx=monthTx(mk),act={};
  tx.forEach(t=>act[t.sub]=r2((act[t.sub]||0)+t.amt));
  const plan=S.plan[mk]||{},sp=schedPlan(mk),g={};
  TYPES.forEach(T=>{g[T.k]={planned:0,actual:0};S.cats[T.k].forEach(c=>{g[T.k].planned+=liveIn(c,mk)?(plan[c.id]>0?plan[c.id]:(sp[c.id]||0)):0;g[T.k].actual+=act[c.id]||0})});
  return {mk,tx,act,plan,sp,g};
}
const left=(g,f)=>r2(g.income[f]-g.bills[f]-g.expenses[f]-g.savings[f]-g.investments[f]-g.debt[f]);
function cum(id,uptoMk){return r2(S.tx.filter(t=>t.sub===id&&t.date.slice(0,7)<=uptoMk).reduce((a,t)=>a+t.amt,0))}

/* ---------- auth screen ---------- */
function renderGate(){
  const body=step==='email'?`
    <h1>Budget Template</h1>
    <p class="muted">Sign in with the email you used to buy the template.</p>
    <form id="gateform" style="margin-top:18px">
      <label for="em">Email</label>
      <input id="em" type="email" required placeholder="you@example.com" value="${esc(emailVal)}">
      <button class="btn" style="width:100%;margin-top:12px" type="submit">Email me a sign-in link</button>
    </form>
    <p class="hint">Prototype: sign-in is simulated. In the real app only emails with a confirmed Gumroad purchase can get a link.</p>`:`
    <h1>Check your inbox</h1>
    <p class="muted">In the real app, a sign-in link would be sent to <b>${esc(emailVal)}</b>. For this demo, continue straight in.</p>
    <button class="btn" style="width:100%;margin-top:16px" data-a="enter">Continue to my budget</button>
    <p style="margin-top:12px"><button class="linkbtn muted" data-a="back-email">Use a different email</button></p>`;
  document.getElementById('app').innerHTML=`<div class="gate"><div class="card">${body}</div></div>`;
}

/* ---------- shell ---------- */
function shell(inner){
  const t=[['cats','Set-Up'],['month','Monthly Spending'],['overview','Overview'],['networth','Net Worth']].filter(x=>!(x[0]==='cats'&&S.hideSetup));
  return `<div class="proto">Beta test. Your budget is saved to your account.</div>
  <header class="top"><div class="top-in">
    <div class="brand">Budget Template</div>
    <nav class="tabs" aria-label="Sections">${t.map(([k,l])=>`<button class="tab" data-a="tab" data-v="${k}" ${tab===k?'aria-current="page"':''}>${l}</button>`).join('')}</nav>
    <div class="swatches" role="group" aria-label="Colour scheme">${PALETTES.map(p=>`<button class="sw-btn" style="background:${p.c}" data-a="palette" data-v="${p.k}" aria-label="${p.n} colour scheme" title="${p.n}" aria-pressed="${(S.palette||'forest')===p.k}"></button>`).join('')}</div>
    <div class="who"><span class="email">${esc(user)}</span> ${S.hideSetup?`<button class="linkbtn" data-a="tab" data-v="cats" ${tab==='cats'?'aria-current="page"':''}>Set-Up</button>`:''}<button class="linkbtn" data-a="signout">Sign out</button></div>
  </div></header>
  <main>${inner}
    <div class="foot"><button class="btn ghost" data-a="reset">Restore sample data</button><button class="btn ghost" data-a="clear">${wipeArmed?'Click again to clear all numbers':'Start fresh (clear sample numbers)'}</button><span class="small muted">Covers Oct 2026 to Dec 2027.</span></div>
  </main>
  ${tab==='month'&&isMobile()?(sheetOpen?sheetHtml():`<button class="fab" data-a="opensheet" aria-label="Add a transaction"><svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/></svg></button>`):''}`;
}

/* ---------- month tab ---------- */
function monthBar(){
  const i=MONTHS.indexOf(cur);
  return `<div class="bar"><h1>${esc(mLabel(cur))}</h1>
    <button class="iconbtn" data-a="prev" aria-label="Previous month" ${i===0?'disabled':''}>&#8249;</button>
    <button class="iconbtn" data-a="next" aria-label="Next month" ${i===MONTHS.length-1?'disabled':''}>&#8250;</button>
    <label for="msel" class="sr" style="position:absolute;left:-9999px">Jump to month</label>
    <select id="msel" class="inline" data-c="month">${MONTHS.map(m=>`<option value="${m}" ${m===cur?'selected':''}>${esc(mLabel(m))}</option>`).join('')}</select>
    ${i>0?`<button class="btn ghost" data-a="copyplan">Copy ${esc(mShort(MONTHS[i-1]))} plan to ${esc(mShort(cur))}</button>`:''}
  </div>`;
}
function ensureDraft(){
  if(!draft.date||draft.date.slice(0,7)!==cur){draft.date=cur+'-'+(selDay?selDay.slice(8):(cur===todayStr().slice(0,7)?todayStr().slice(8):'01'))}
  const subs=activeSubs(draft.type,editId?draft.sub:null);
  if(!subs.some(s=>s.id===draft.sub)) draft.sub=subs[0]?subs[0].id:'';
}
function formInner(){
  ensureDraft();
  const subs=activeSubs(draft.type,editId?draft.sub:null);
  const [dy,dm]=draft.date.split('-').map(Number),lastDay=new Date(dy,dm,0).getDate();
  const dateField=`<div><div class="lblrow"><label for="f-date">Date</label></div><input id="f-date" type="date" required min="${cur}-01" max="${cur}-${pad(lastDay)}" value="${esc(draft.date)}" data-c="d-date"></div>`;
  return `<form id="txform" class="fgrid" autocomplete="off">
    ${dateField}
    <div><div class="lblrow"><label for="f-amt">Amount</label>${tipHtml({k:'amount',label:'Amount',tip:'Enter sums or formulas (100+50) when adding expenses'},'r','How to enter an amount')}</div><div class="amtwrap"><input id="f-amt" type="text" inputmode="text" enterkeyhint="done" autocomplete="off" required placeholder="0.00" value="${esc(draft.amt)}" data-c="d-amt" aria-describedby="amt-preview"><button type="button" class="plusbtn" data-a="plus" aria-label="Add another amount" title="Add another amount">+</button></div><div id="amt-preview" class="small muted amtprev" aria-live="polite">${esc(amtPreview(draft.amt))}</div></div>
    <div class="full"><label for="f-desc">Description</label><input id="f-desc" type="text" placeholder="e.g. Groceries" value="${esc(draft.desc)}" data-c="d-desc"></div>
    <div><label for="f-type">Category</label><select id="f-type" data-c="d-type">${TYPES.map(T=>`<option value="${T.k}" ${T.k===draft.type?'selected':''}>${T.label}</option>`).join('')}</select></div>
    <div><label for="f-sub">Subcategory</label><select id="f-sub" data-c="d-sub">${subs.length?'':'<option value="">Add lines on Set-Up first</option>'}${subs.map(s=>`<option value="${s.id}" ${s.id===draft.sub?'selected':''}>${esc(s.name)}</option>`).join('')}</select></div>
    <div class="full" ${editId?'style="display:flex;gap:8px"':''}><button class="btn" type="submit" style="${editId?'flex:1':'width:100%'}">${editId?'Save changes':'Add transaction'}</button>${editId?'<button class="btn ghost" type="button" data-a="canceledit">Cancel</button>':''}</div>
  </form>
`;
}
const txHint=()=>(editId?'Change the date above, or tap a day on the calendar.':(isMobile()?'Pick a date here, or close this and tap a day on the calendar.':'Pick a date here, or tap a day on the calendar.'))+' Only Expenses count toward your no-spend days.';
const txTip=()=>tipHtml({k:'txform',label:'adding a transaction',tip:txHint()},'','How to add a transaction');
function formCard(){return `<div class="card ${editId?'editing':''}"><h2>${editId?'Edit transaction':'Add a transaction'}${txTip()}</h2>${formInner()}</div>`}
function dayListHtml(){
  const l=S.tx.filter(t=>t.date===draft.date);if(!l.length)return '';
  return `<div class="sheet-day"><h3>Already logged on ${esc(mShort(cur))} ${+draft.date.slice(8)}</h3><ul class="tx" style="margin-top:6px">${l.map(rowHtml).join('')}</ul></div>`;
}
function sheetHtml(){
  return `<div class="sheet-back" data-a="closesheet"></div>
  <div class="sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-title"><div class="grab" aria-hidden="true"></div>
  <div class="sheet-head"><div style="display:flex;align-items:center;min-width:0"><h2 id="sheet-title">${editId?'Edit transaction':'Add a transaction'}</h2>${txTip()}</div><button class="btn ghost" type="button" data-a="closesheet">Done</button></div>
  ${formInner()}${dayListHtml()}</div>`;
}
function rowHtml(t){const s=subOf(t.sub),inc=typeOf(t.sub)==='income';return `<li class="${t.id===editId?'editing':''}">
    <span class="d">${mShort(cur)} ${+t.date.slice(8)}</span>
    <span>${t.ruleId?`<span class="repwrap" title="From a recurring schedule">${REP}</span>`:''}${esc(t.desc||s?.name||'')}<div class="s">${esc(s?s.name:'?')}${t.expr?` (${esc(t.expr.replace(/\s+/g,'').replace(/([+\-*/])/g,' $1 '))})`:''}</div></span>
    <span class="a ${inc?'inc':''}">${inc?'+':''}${money(t.amt)}</span>
    <button class="xbtn editbtn" data-a="edittx" data-v="${t.id}" aria-label="Edit ${esc(t.desc||s?.name||'transaction')}" title="Edit"><svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true"><path d="M2 14l.8-3.2L11.6 2a1.4 1.4 0 012 2l-8.8 8.8L2 14z" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg></button>
    <button class="xbtn" data-a="deltx" data-v="${t.id}" aria-label="Delete transaction">&times;</button></li>`}
function schedRowHtml(s){const sub=subOf(s.sub),inc=typeOf(s.sub)==='income';return `<li class="sched">
    <span class="d">${mShort(cur)} ${+s.date.slice(8)}</span>
    <span><span class="repwrap">${REP}</span>${esc(s.desc)}<div class="s">${esc(sub?sub.name:'?')}, scheduled</div></span>
    <span class="a ${inc?'inc':''}">${inc?'+':''}${money(s.amt)}</span>
    <button class="linkbtn small skipbtn" data-a="skip" data-r="${s.rid}" data-v="${s.date}" aria-label="Skip ${esc(s.desc)} on ${esc(shortDate(s.date))}">Skip</button></li>`}
function txCard(c){
  const sch=scheduledIn(cur);
  let list=[...c.tx.map(t=>({d:t.date,html:rowHtml(t)})),...sch.map(s=>({d:s.date,html:schedRowHtml(s)}))].sort((a,b)=>b.d.localeCompare(a.d));
  if(selDay) list=list.filter(x=>x.d===selDay);
  const head=(selDay?`${esc(mLabel(cur).split(' ')[0])} ${+selDay.slice(8)} <button class="linkbtn small" data-a="clearday">Show all</button>`:`${c.tx.length} this month${sch.length?`, ${sch.length} scheduled`:''}`)+` <button class="linkbtn small" data-a="gorec" style="margin-left:6px">Recurring</button>`;
  return `<div class="card"><div class="txhead"><h2>Transactions</h2><span class="small muted">${head}</span></div>
  ${list.length?`<ul class="tx">${list.map(x=>x.html).join('')}</ul>`
  :`<p class="empty">${selDay?'Nothing logged on this day.':(isMobile()?'No transactions yet. Tap + to add your first one.':'No transactions yet. Add your first one above.')}</p>`}</div>`;
}
function noSpendDays(c){
  const [y,m]=cur.split('-').map(Number),n=new Date(y,m,0).getDate(),spend={};
  c.tx.forEach(t=>{if(typeOf(t.sub)==='expenses')spend[t.date]=1});
  const lastTx=c.tx.reduce((a,t)=>t.date>a?t.date:a,'0000'),asOf=todayStr()>lastTx?todayStr():lastTx;
  let tracked=0,none=0;
  for(let d=1;d<=n;d++){const ds=cur+'-'+pad(d);if(ds<=asOf){tracked++;if(!spend[ds])none++}}
  return {none,tracked};
}
function tiles(c){
  const lp=left(c.g,'planned'),la=left(c.g,'actual'),inc=c.g.income.actual;
  const sr=inc>0?(c.g.savings.actual+c.g.investments.actual)/inc:null,ns=noSpendDays(c);
  const tip=(k,label,text)=>tipHtml({k,label,tip:text},'',`About ${label}`);
  return `<div class="tiles compact">
   <div class="tile"><div class="l">What's Left${tip('t-left',"What's Left",`Planned income minus everything planned. So far: ${money(la)} left.`)}</div><div class="v ${lp<0?'bad':''}">${money(lp)}</div></div>
   <div class="tile"><div class="l">Savings rate${tip('t-rate','Savings rate','Savings and investments as a share of the income you have received this month.')}</div><div class="v">${sr==null?'–':Math.round(sr*100)+'%'}</div></div>
   <div class="tile"><div class="l">No-spend days${tip('t-nospend','No-spend days',ns.tracked?`Days so far this month with no discretionary spending (${ns.none} of ${ns.tracked}). Only Expenses count against a day. Bills, debt payments, savings and investments don't.`:'Days with no discretionary spending. Counts start once the month begins.')}</div><div class="v">${ns.tracked?ns.none:'–'}</div></div></div>`;
}
function calendar(c){
  const [y,m]=cur.split('-').map(Number);
  const first=new Date(y,m-1,1).getDay(),n=new Date(y,m,0).getDate();
  const daily={};c.tx.forEach(t=>{if(typeOf(t.sub)==='expenses')daily[t.date]=r2((daily[t.date]||0)+t.amt)});
  const fixedDay={};c.tx.forEach(t=>{const k=typeOf(t.sub);if(k==='debt'||k==='bills')fixedDay[t.date]=r2((fixedDay[t.date]||0)+t.amt)});
  const lastTx=c.tx.reduce((a,t)=>t.date>a?t.date:a,'0000');
  const asOf=todayStr()>lastTx?todayStr():lastTx;
  const mx=Math.max(1,...Object.values(daily));
  const schedDay={};scheduledIn(cur).forEach(s=>{const o=schedDay[s.date]=schedDay[s.date]||{spend:0,items:[]};if(typeOf(s.sub)==='expenses')o.spend=r2(o.spend+s.amt);o.items.push(s.desc+' '+money(s.amt))});
  let cells=['S','M','T','W','T','F','S'].map(d=>`<div class="dow">${d}</div>`).join('');
  for(let i=0;i<first;i++)cells+='<div class="day blank"></div>';
  for(let d=1;d<=n;d++){
    const ds=cur+'-'+pad(d),v=daily[ds]||0,tracked=ds<=asOf;
    let cls='day',style='',lab='';
    const sd=schedDay[ds],dd=fixedDay[ds];
    if(!tracked){cls+=' future';if(sd&&sd.spend>0){cls+=' sch';lab=money(sd.spend)}}
    else if(v===0){cls+=' none';lab='no spend'}
    else{const p=Math.round(18+57*(v/mx));style=`background:color-mix(in srgb,var(--amber) ${p}%,var(--surface));border-color:transparent`;lab=money(v)}
    if(ds===draft.date)cls+=' active';
    cells+=`<button class="${cls}" style="${style}" data-a="day" data-v="${ds}" aria-pressed="${selDay===ds}" aria-label="${mLabel(cur).split(' ')[0]} ${d}, ${lab||'no data yet'}${dd?', bills and debt payments '+money(dd):''}${sd?', scheduled: '+esc(sd.items.join(', ')):''}"><span class="n">${d}</span>${sd?`<span class="repwrap tr" title="Scheduled: ${esc(sd.items.join(', '))}">${REP}</span>`:''}${dd?`<span class="bot"><span class="m">${lab}</span><span class="dm" title="Bills and debt payments ${money(dd)}"><svg width="9" height="9" viewBox="0 0 10 10" aria-hidden="true"><circle cx="5" cy="5" r="3.2" fill="none" stroke="currentColor" stroke-width="1.6"/></svg><b>${money(dd)}</b></span></span>`:`<span class="m">${lab}</span>`}</button>`;
  }
  return `<div class="card" id="cal"><h2>Daily spending</h2><div class="cal">${cells}</div></div>`;
}
function charts(c){
  const rows=['bills','expenses','savings','investments','debt'];
  const mx=Math.max(1,...rows.flatMap(k=>[c.g[k].planned,c.g[k].actual]));
  const hb=rows.map(k=>{const g=c.g[k],over=(k==='bills'||k==='expenses'||k==='debt')&&g.actual>g.planned&&g.planned>0;
    return `<div class="row"><span>${TYPES.find(t=>t.k===k).label}</span><div><div class="tr"><div class="f p" style="width:${g.planned/mx*100}%"></div></div><div class="tr"><div class="f ${over?'over':'a'}" style="width:${g.actual/mx*100}%"></div></div></div><span class="num small">${money(g.actual)}<br><span class="muted">of ${money(g.planned)}</span></span></div>`}).join('');
  const planOf=s=>effPlan(c,s.id);
  const ex=S.cats.expenses.map(s=>({n:s.name,a:c.act[s.id]||0,p:planOf(s)})).filter(x=>x.a>0||x.p>0)
    .sort((x,y)=>(y.p>0?y.a/y.p:-1)-(x.p>0?x.a/x.p:-1)||y.a-x.a);
  const exRows=ex.map(x=>{
    if(x.p>0){const pct=x.a/x.p,cls=pct>1?'over':pct>=.85?'warn':'ok';
      return `<div class="row" style="grid-template-columns:110px 1fr 74px"><span>${esc(x.n)}</span><div class="tr"><div class="f ${cls}" style="width:${Math.min(100,pct*100)}%"></div></div><span class="num small">${money(x.a)}<br><span class="muted">of ${money(x.p)}</span></span></div>`}
    return `<div class="row" style="grid-template-columns:110px 1fr 74px"><span>${esc(x.n)}</span><div class="tr"></div><span class="num small">${money(x.a)}<br><span class="muted">no plan</span></span></div>`}).join('');
  const exTip=tipHtml({k:'wmw-ex',label:'Expenses',tip:"Each bar fills toward what you planned for that line. It turns amber as you near the plan and red once you're over it."},'','About the expense bars');
  const cat=exRows||'<p class="empty">Expenses show up here once you plan or log them.</p>';
  return `<div class="cols"><div class="card"><h2>Planned vs actual</h2><div class="hint" style="margin-top:2px"><i class="sw" style="background:var(--sage)"></i>Planned <i class="sw" style="background:var(--forest);margin-left:10px"></i>Actual</div><div class="hb">${hb}</div></div>
  <div class="card"><h2>Expense breakdown${exTip}</h2><div class="hb">${cat}</div></div></div>`;
}
function groupTable(k,c){
  const T=TYPES.find(t=>t.k===k),subs=S.cats[k].filter(s=>liveIn(s,c.mk)||(c.act[s.id]||0)>0);
  const rows=subs.map(s=>{const pm=c.plan[s.id]||0,ps=c.sp[s.id]||0,p=pm>0?pm:ps,a=c.act[s.id]||0,over=(k==='bills'||k==='expenses')&&p>0&&a>p;
    if(!liveIn(s,c.mk))return `<tr><td>${esc(s.name)} <span class="small muted">(archived)</span></td><td class="n muted">&ndash;</td><td class="n ${over?'over':''}">${money(a)}</td></tr>`;
    return `<tr><td>${esc(s.name)}${(pm<=0&&ps>0)?`<span class="repwrap" style="margin-left:5px" title="Planned from your recurring schedule">${REP}</span>`:''}</td><td class="n"><input type="number" step="1" min="0" aria-label="Planned for ${esc(s.name)}" value="${pm||''}" placeholder="${ps>0?ps:0}" data-c="plan" data-v="${s.id}"></td><td class="n ${over?'over':''}">${money(a)}</td></tr>`}).join('');
  return `<div class="card"><table class="bt"><thead><tr><th>${T.label}${tipHtml(T)}</th><th>Planned</th><th>Actual</th></tr></thead><tbody>${rows||'<tr><td colspan="3" class="muted small">No lines yet. Add them on the Set-Up tab.</td></tr>'}</tbody>
   <tfoot><tr><td>Total</td><td class="n">${money(c.g[k].planned)}</td><td class="n">${money(c.g[k].actual)}</td></tr></tfoot></table></div>`;
}
function allTime(id){return r2(S.tx.filter(t=>t.sub===id).reduce((a,t)=>a+t.amt,0))}
function inMonth(id,mk){return r2(S.tx.filter(t=>t.sub===id&&t.date.slice(0,7)===mk).reduce((a,t)=>a+t.amt,0))}
function latestEntry(id){
  const ms=Object.keys(S.bal||{}).filter(m=>S.bal[m]&&S.bal[m][id]!==undefined&&S.bal[m][id]!==null).sort();
  return ms.length?{m:ms[ms.length-1],v:S.bal[ms[ms.length-1]][id]}:null;
}
function currentBal(id){
  const e=latestEntry(id),t=typeOf(id),s=subOf(id);
  if(id==='cash')return e?e.v:0;
  if(e){const after=r2(allTime(id)-cum(id,e.m));return t==='debt'?Math.max(0,r2(e.v-after)):r2(e.v+after)}
  if(t==='savings')return r2((s.open||0)+allTime(id));
  if(t==='investments')return allTime(id);
  if(t==='debt')return Math.max(0,r2((s.start||0)-allTime(id)));
  return 0;
}
function progBar(total,add,max,kind){
  const t=Math.max(0,Math.min(total,max)),a=Math.max(0,Math.min(add,t)),w=v=>max>0?Math.min(100,v/max*100):0;
  return `<div class="prog ${kind==='debt'?'debt':''}"><i class="base" style="width:${w(t-a)}%"></i><i style="width:${w(a)}%"></i></div>`;
}
const realMonth=()=>{const cm=todayStr().slice(0,7);return cm<MONTHS[0]?MONTHS[0]:(cm>MONTHS[MONTHS.length-1]?MONTHS[MONTHS.length-1]:cm)};
function loanAt(s,mk){
  const before=r2((s.paid||0)+S.tx.filter(t=>t.sub===s.id&&t.date.slice(0,7)<mk).reduce((a,t)=>a+t.amt,0)),m=inMonth(s.id,mk),total=r2(before+m);
  return {before,m,total,rem:Math.max(0,r2((s.start||0)-total))};
}
function goalsCard(){
  const sv=S.cats.savings.filter(s=>(s.goal||0)>0&&!s.archived),ln=S.cats.debt.filter(s=>(s.start||0)>0&&!s.archived);
  const sRows=sv.map(s=>{const saved=currentBal(s.id),pct=Math.min(100,saved/s.goal*100),m=inMonth(s.id,cur);
    return `<div class="goalrow"><div class="t"><b>${esc(s.name)}</b><span>${money(saved)} of ${money(s.goal)}</span></div>${progBar(saved,m,s.goal)}<div class="small muted">${money(Math.max(0,s.goal-saved))} to go${m>0?`. ${money(m)} added in ${esc(mShort(cur))}.`:''}</div></div>`}).join('');
  const lRows=ln.map(s=>{const L=loanAt(s,cur),rem=L.rem,paid=L.total,m=L.m;
    return `<div class="goalrow"><div class="t"><b>${esc(s.name)}</b><span>${money(Math.max(0,rem))} remaining</span></div>${progBar(paid,m,s.start,'debt')}<div class="small muted">${money(paid)} paid so far of ${money(s.start)}${m>0?`. ${money(m)} in ${esc(mShort(cur))}.`:''}</div></div>`}).join('');
  return `<div class="cols"><div class="card sav"><h2>Savings goals</h2>${sRows?`<div class="legend" style="margin:4px 0 0"><span><i class="sw base"></i>Starting balance</span><span><i class="sw" style="background:var(--forest)"></i>Added in ${esc(mShort(cur))}</span></div>`:''}${sRows||'<p class="empty">Set a goal amount on the Set-Up tab.</p>'}</div><div class="card dbt"><h2>Debt payoff</h2>${lRows?`<div class="legend" style="margin:4px 0 0"><span><i class="sw base"></i>Paid so far</span><span><i class="sw debtc"></i>Paid in ${esc(mShort(cur))}</span></div>`:''}${lRows||'<p class="empty">Add a starting balance on the Set-Up tab.</p>'}</div></div>`;
}
function renderMonth(){
  const c=calc(cur);ensureDraft();
  if(isMobile())return monthBar()+`<div class="stack">${tiles(c)}${calendar(c)}${txCard(c)}${charts(c)}
   <div class="groups"><div class="stack">${['income','expenses'].map(k=>groupTable(k,c)).join('')}</div><div class="stack">${['bills','savings','investments','debt'].map(k=>groupTable(k,c)).join('')}</div></div>${goalsCard()}</div>`;
  return monthBar()+`<div class="layout"><div class="stack">${formCard()}${txCard(c)}</div>
   <div class="stack">${tiles(c)}${calendar(c)}${charts(c)}
   <div class="groups"><div class="stack">${['income','expenses'].map(k=>groupTable(k,c)).join('')}</div><div class="stack">${['bills','savings','investments','debt'].map(k=>groupTable(k,c)).join('')}</div></div>${goalsCard()}</div></div>`;
}

/* ---------- overview ---------- */
function renderOverview(){
  const all=MONTHS.map(m=>({m,c:calc(m)}));
  const tot={};TYPES.forEach(T=>tot[T.k]=r2(all.reduce((a,x)=>a+x.c.g[T.k].actual,0)));
  const totLeft=r2(tot.income-tot.bills-tot.expenses-tot.savings-tot.investments-tot.debt);
  const rows=all.map(({m,c})=>{const l=left(c.g,'actual');
    return `<tr><td><button class="linkbtn" style="color:var(--forest)" data-a="gomonth" data-v="${m}">${esc(mLabel(m))}</button></td>${TYPES.map(T=>`<td>${money(c.g[T.k].actual)}</td>`).join('')}<td>${money(l)}</td></tr>`}).join('');
  const TR=[['income','Income','var(--teal)'],['bills','Bills','var(--c-bills)'],['expenses','Expenses','var(--c-exp)'],['savings','Savings','var(--forest)'],['investments','Investments','var(--c-inv)'],['debt','Debt Payments','var(--amber)']];
  const sel=(S.ovSel&&S.ovSel.length?S.ovSel:['income','bills','expenses']).filter(k=>TR.some(t=>t[0]===k));
  const act=TR.filter(t=>sel.includes(t[0]));
  const mxv=Math.max(1,...all.flatMap(x=>act.map(t=>x.c.g[t[0]].actual)));
  const chips=TR.map(([k,l,col])=>`<button type="button" class="chip" aria-pressed="${sel.includes(k)}" data-a="ovtoggle" data-v="${k}"><i class="sw" style="background:${col}"></i>${l}</button>`).join('');
  const mini=all.map(({m,c})=>`<div class="c"><div class="bars">${act.map(([k,l,col])=>`<i style="height:${c.g[k].actual/mxv*100}%;background:${col}" title="${esc(mLabel(m))} ${l} ${money(c.g[k].actual)}" aria-label="${esc(mLabel(m))} ${l} ${money(c.g[k].actual)}"></i>`).join('')}</div><span class="lb">${mShort(m)}</span></div>`).join('');
  const trendW=Math.max(0,all.length*(act.length*10+10));
  const yearUsed=(id,y)=>r2(S.tx.filter(t=>t.sub===id&&t.date.startsWith(String(y))).reduce((a,t)=>a+t.amt,0));
  const room=s=>(s.room||0)>0?s.room:(s.limit||0);
  const roomRow=(title,left,used,total,note)=>`<div class="goalrow"><div class="t"><b>${esc(title)}</b><span class="${left<0?'over':''}" ${left<0?'style="color:var(--bad);font-weight:600"':''}>${left<0?money(-left)+' over':money(left)+' room left'}</span></div><div class="prog"><i style="width:${total>0?Math.min(100,used/total*100):0}%${left<0?';background:var(--bad)':''}"></i></div><div class="small muted">${note}</div></div>`;
  const lim=S.cats.investments.filter(s=>!s.archived&&(room(s)>0||(s.limit||0)>0)).map(s=>{
    const r0=room(s),u26=yearUsed(s.id,2026),left26=r2(r0-u26),add=s.limit||0,avail27=r2(left26+add),u27=yearUsed(s.id,2027),left27=r2(avail27-u27);
    return roomRow(s.name+' 2026 (Oct to Dec)',left26,u26,r0,`${money(u26)} used of ${money(r0)} total room`)
      +roomRow(s.name+' 2027',left27,u27,avail27,`${money(u27)} used of ${money(avail27)}: ${money(Math.max(0,left26))} carried over${add?` + ${money(add)} new`:''}`);
  }).join('');
  return `<div class="bar"><h1>Oct 2026 to Dec 2027</h1></div>
  <div class="tiles ovt"><div class="tile"><div class="l">Total Income</div><div class="v">${money(tot.income)}</div><div class="h">Logged across all 15 months.</div></div>
  <div class="tile"><div class="l">Total Bills</div><div class="v">${money(tot.bills)}</div><div class="h">Logged across all 15 months.</div></div>
  <div class="tile"><div class="l">Total Expenses</div><div class="v">${money(tot.expenses)}</div><div class="h">Logged across all 15 months.</div></div>
  <div class="tile"><div class="l">Total Saved</div><div class="v">${money(tot.savings)}</div><div class="h">Added to savings across all 15 months.</div></div>
  <div class="tile"><div class="l">Total Invested</div><div class="v">${money(tot.investments)}</div><div class="h">Contributed across all 15 months.</div></div>
  <div class="tile"><div class="l">Total Debt Paid</div><div class="v">${money(tot.debt)}</div><div class="h">Paid toward loans across all 15 months.</div></div></div>
  <div class="card" style="margin-top:16px"><h2>Month by month</h2><div class="scroll"><table class="gtab"><thead><tr><th>Month</th>${TYPES.map(T=>`<th>${T.label}</th>`).join('')}<th>Left over</th></tr></thead><tbody>${rows}</tbody>
  <tfoot><tr><td>Total</td>${TYPES.map(T=>`<td>${money(tot[T.k])}</td>`).join('')}<td>${money(totLeft)}</td></tr></tfoot></table></div>
</div>
  <div class="card trend" style="margin-top:16px"><h2>Trends${tipHtml({k:'trends',label:'Trends',tip:'Tap a category to add or remove it from the chart. Pick one or several to see how they moved month by month.'},'','About Trends')}</h2><div class="chips">${chips}</div><div class="chscroll"><div class="mini" style="min-width:${trendW}px" aria-label="Selected categories by month">${mini}</div></div></div>
  <div class="cols" style="margin-top:16px"><div class="card sav"><h2>Savings goals</h2>${savingsMini()}</div>
  <div class="card dbt"><h2>Debt payoff</h2>${debtMini()}</div></div>
  <div class="card" style="margin-top:16px"><h2>Account contribution room</h2>${lim||'<p class="empty">Add your contribution room on the Set-Up tab, under Investments.</p>'}</div>`;
}
function savingsMini(){
  const g=S.cats.savings.filter(s=>(s.goal||0)>0&&!s.archived).map(s=>{const sv=currentBal(s.id);return `<div class="goalrow"><div class="t"><b>${esc(s.name)}</b><span>${money(sv)} of ${money(s.goal)}</span></div>${progBar(sv,inMonth(s.id,realMonth()),s.goal)}</div>`}).join('');
  return g?`<div class="legend" style="margin:4px 0"><span><i class="sw base"></i>Starting balance</span><span><i class="sw" style="background:var(--forest)"></i>Added in ${esc(mShort(realMonth()))}</span></div>${g}`:'<p class="empty">Set a goal amount on the Set-Up tab.</p>';
}
function debtMini(){
  const l=S.cats.debt.filter(s=>(s.start||0)>0&&!s.archived).map(s=>{const L=loanAt(s,realMonth());return `<div class="goalrow"><div class="t"><b>${esc(s.name)}</b><span>${money(L.rem)} remaining</span></div>${progBar(L.total,L.m,s.start,'debt')}</div>`}).join('');
  return l?`<div class="legend" style="margin:4px 0"><span><i class="sw base"></i>Paid so far</span><span><i class="sw debtc"></i>Paid in ${esc(mShort(realMonth()))}</span></div>${l}`:'<p class="empty">Add a starting balance on the Set-Up tab.</p>';
}

/* ---------- net worth ---------- */
/* Net Worth uses only what has been entered: logged transactions, Set-Up starting balances, and balances typed for that quarter.
   Nothing is carried forward or estimated, and quarters that have not started yet stay at 0. */
function nwHorizon(){
  const lt=S.tx.reduce((a,t)=>t.date.slice(0,7)>a?t.date.slice(0,7):a,'0000'),cm=realMonth();
  return lt>cm?lt:cm;
}
const nwStarted=qi=>{const prev=qi>0?QUARTERS[qi-1].end:'0000';return MONTHS.find(m=>m>prev)<=nwHorizon()};
function nwCalc(qi,id){
  const q=QUARTERS[qi],prev=qi>0?QUARTERS[qi-1].end:'0000';
  for(const m of MONTHS.filter(m=>m>prev&&m<=q.end).reverse()){const v=S.bal&&S.bal[m]&&S.bal[m][id];if(v!==undefined&&v!==null)return {v,entered:true}}
  if(!nwStarted(qi))return {v:0,entered:false};
  const hz=nwHorizon(),T=q.end<hz?q.end:hz,t=typeOf(id),s=subOf(id);
  if(t==='savings')return {v:r2((s.open||0)+cum(id,T)),entered:false};
  if(t==='investments')return {v:cum(id,T),entered:false};
  if(t==='debt')return {v:Math.max(0,r2((s.start||0)-(s.paid||0)-cum(id,T))),entered:false};
  return {v:0,entered:false};
}
function renderNW(){
  const live=s=>!s.archived||QUARTERS.some((x,i)=>nwCalc(i,s.id).v!==0);
  const assets=[...S.cats.savings,...S.cats.investments,{id:'cash',name:'Other cash'}].filter(live),liab=S.cats.debt.filter(live);
  const cell=(qi,id,nm)=>{const r=nwCalc(qi,id);return `<td><input type="number" min="0" step="1" aria-label="${esc(nm)} at the end of ${QUARTERS[qi].q}" value="${r.entered?r.v:''}" placeholder="${r.v}" data-c="nwbal" data-q="${qi}" data-v="${id}"></td>`};
  const sum=(qi,list)=>r2(list.reduce((a,x)=>a+nwCalc(qi,x.id).v,0));
  const A=QUARTERS.map((x,i)=>sum(i,assets)),L=QUARTERS.map((x,i)=>sum(i,liab)),nw=A.map((a,i)=>r2(a-L[i]));
  const act=QUARTERS.map((x,i)=>nwStarted(i)),la=Math.max(0,act.lastIndexOf(true)),on=arr=>arr.filter((v,i)=>act[i]);
  const mn=Math.min(0,...on(nw)),mxv=Math.max(1,...on(A),...on(L),...on(nw)),W=660,H=240,P=40,R=120,T=24,last=QUARTERS.length-1;
  const X=i=>P+i*(W-P-R)/last,Y=v=>H-P-(v-mn)/(mxv-mn||1)*(H-P-T);
  const endLabels=[{y:Y(A[la]),t:'Assets '+money(A[la]),m:1},{y:Y(nw[la]),t:'Net worth '+money(nw[la]),b:1},{y:Y(L[la]),t:'Owed '+money(L[la]),m:1}].sort((a,b)=>a.y-b.y);
  for(let i=1;i<endLabels.length;i++)if(endLabels[i].y-endLabels[i-1].y<16)endLabels[i].y=endLabels[i-1].y+16;
  const line=(arr,color,w,dash,o)=>`<polyline fill="none" stroke="${color}" stroke-width="${w}" ${o?`stroke-opacity="${o}"`:''} ${dash?`stroke-dasharray="${dash}"`:''} stroke-linejoin="round" points="${arr.map((v,i)=>act[i]?X(i)+','+Y(v):'').filter(Boolean).join(' ')}"/>`;
  const svg=`<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="Assets, liabilities and net worth by quarter"><line x1="${P}" y1="${Y(0)}" x2="${W-R}" y2="${Y(0)}" stroke="var(--line)"/>
    ${line(A,'var(--teal)',2,0,.4)}${line(L,'var(--amber)',2,'6 5',.45)}${line(nw,'var(--forest)',4.5)}
    ${A.map((v,i)=>!act[i]?'':`<rect x="${X(i)-3}" y="${Y(v)-3}" width="6" height="6" fill="var(--teal)" fill-opacity=".45"/>`).join('')}
    ${L.map((v,i)=>!act[i]?'':`<path d="M${X(i)} ${Y(v)-4} L${X(i)+4} ${Y(v)} L${X(i)} ${Y(v)+4} L${X(i)-4} ${Y(v)} Z" fill="var(--amber)" fill-opacity=".5"/>`).join('')}
    ${nw.map((v,i)=>{if(!act[i])return '';const clash=Math.abs(Y(L[i])-(Y(v)-12))<18||Math.abs(Y(A[i])-(Y(v)-12))<18,ty=clash?Y(v)+24:Y(v)-12;return `<circle cx="${X(i)}" cy="${Y(v)}" r="5.5" fill="var(--forest)"/>${i<la?`<text x="${X(i)}" y="${ty}" text-anchor="middle" font-size="12" font-weight="600" fill="var(--ink)" stroke="var(--surface)" stroke-width="4" paint-order="stroke">${money(v)}</text>`:''}`}).join('')}
    ${endLabels.map(e=>`<text x="${X(la)+12}" y="${e.y+4}" font-size="${e.m?11:12}" ${e.b?'font-weight="700"':''} fill="${e.m?'var(--muted)':'var(--ink)'}">${e.t}</text>`).join('')}
    ${QUARTERS.map((x,i)=>`<text x="${X(i)}" y="${H-12}" text-anchor="middle" font-size="12" fill="var(--muted)">${x.q}</text>`).join('')}</svg>
    <div class="legend"><span><i class="sw" style="background:var(--teal);opacity:.5"></i>Assets</span><span><i class="sw" style="background:var(--amber);opacity:.55"></i>Liabilities</span><span><i class="sw" style="background:var(--forest)"></i>Net worth (assets minus liabilities)</span></div>`;
  const head=`<tr><th></th>${QUARTERS.map(x=>`<th>${x.q}</th>`).join('')}</tr>`;
  return `<div class="bar"><h1>Net Worth</h1></div>
  <div class="card"><h2>Net worth by quarter</h2>${svg}</div>
  <div class="card nw scroll" style="margin-top:16px"><table class="gtab"><thead>${head}</thead><tbody>
   <tr><td colspan="6"><b>Assets</b></td></tr>
   ${assets.map(a=>`<tr><td>${esc(a.name)}</td>${QUARTERS.map((x,i)=>cell(i,a.id,a.name)).join('')}</tr>`).join('')}
   <tr><td><b>Total assets</b></td>${QUARTERS.map((x,i)=>`<td><b>${money(sum(i,assets))}</b></td>`).join('')}</tr>
   <tr><td colspan="6"><b>Liabilities</b></td></tr>
   ${liab.map(a=>`<tr><td>${esc(a.name)}</td>${QUARTERS.map((x,i)=>cell(i,a.id,a.name)).join('')}</tr>`).join('')}
   <tr><td><b>Total liabilities</b></td>${QUARTERS.map((x,i)=>`<td><b>${money(sum(i,liab))}</b></td>`).join('')}</tr></tbody>
   <tfoot><tr><td>Net worth</td>${nw.map(v=>`<td>${money(v)}</td>`).join('')}</tr></tfoot></table></div>`;
}

/* ---------- categories ---------- */
function recurringCard(){
  const subs=activeSubs(rd.type);if(!subs.some(s=>s.id===rd.sub))rd.sub=subs[0]?subs[0].id:'';
  const catLabel=id=>{const k=typeOf(id);const T=TYPES.find(t=>t.k===k);return T?T.label:''};
  const rows=S.rules.filter(ruleOk).map(r=>{
    const sb=subOf(r.sub),next=occurrences(r,addDays(todayStr(),1),RANGE_TO)[0];
    return `<div class="rule ${editRuleId===r.id?'editing':''}"><div style="min-width:0"><b>${esc(r.label||sb.name)}</b> <span class="small muted">${esc(catLabel(r.sub))}, ${esc(sb.name)}</span>
      <div class="small muted">${money(r.amt)} ${FREQ_TXT[r.freq]}. ${next?'Next: '+esc(fmtDate(next)):'No more payments in the range'}${r.end?'. Ends '+esc(fmtDate(r.end)):''}</div></div>
      <div class="ract"><button class="xbtn editbtn" data-a="editrule" data-v="${r.id}" aria-label="Edit ${esc(r.label||sb.name)}" title="Edit"><svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true"><path d="M2 14l.8-3.2L11.6 2a1.4 1.4 0 012 2l-8.8 8.8L2 14z" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg></button><button class="xbtn" data-a="delrule" data-v="${r.id}" aria-label="Remove ${esc(r.label||sb.name)}">&times;</button></div></div>`}).join('');
  const T={k:'recurring',label:'Recurring',tip:"Transactions that repeat on a schedule. Set each one up once and choose how often it repeats: bills, paycheques, savings and investment contributions, or anything else. They post to the Monthly Spending tab on their due date. If the first payment is in the past, those payments are filled in right away. To change one payment only, edit it after it posts, or skip it before. Editing a recurring item changes it from today on, and payments already posted stay as they are."};
  return `<div class="card" id="rec" style="margin-top:16px"><h2>Recurring${tipHtml(T,'wide')}</h2>
  ${rows?`<div class="rules">${rows}</div>`:'<p class="empty">No recurring items yet. Add your first one with the button below.</p>'}
  <button type="button" class="disclose" data-a="togglerule" aria-expanded="${ruleOpen||!!editRuleId}" aria-controls="ruleform"><span>${editRuleId?'Edit recurring item':'Add a recurring item'}</span><svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 6l4.5 4.5L12.5 6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
  ${(ruleOpen||editRuleId)?`<form id="ruleform" class="fgrid rform" data-form="rule" autocomplete="off">
    <div><label for="r-type">Category</label><select id="r-type" data-c="r-type">${TYPES.map(x=>`<option value="${x.k}" ${x.k===rd.type?'selected':''}>${x.label}</option>`).join('')}</select></div>
    <div><label for="r-sub">Line</label><select id="r-sub" data-c="r-sub">${subs.length?'':'<option value="">Add lines first</option>'}${subs.map(s=>`<option value="${s.id}" ${s.id===rd.sub?'selected':''}>${esc(s.name)}</option>`).join('')}</select></div>
    <div><label for="r-amt">Amount each time</label><input id="r-amt" type="text" inputmode="text" enterkeyhint="done" placeholder="0.00" value="${esc(rd.amt)}" data-c="r-amt" autocomplete="off"><div id="r-amt-prev" class="small muted amtprev">${esc(isSum(rd.amt)?amtPreview(rd.amt):'')}</div></div>
    <div><label for="r-freq">Repeats</label><select id="r-freq" data-c="r-freq">${FREQ.map(([k,l])=>`<option value="${k}" ${k===rd.freq?'selected':''}>${l}</option>`).join('')}</select></div>
    <div><label for="r-start">First payment</label><input id="r-start" type="date" value="${esc(rd.start)}" data-c="r-start"></div>
    <div><label for="r-end">Ends (optional)</label><input id="r-end" type="date" value="${esc(rd.end)}" data-c="r-end"></div>
    <div class="full"><label for="r-label">Label (optional)</label><input id="r-label" type="text" placeholder="e.g. Car payment" value="${esc(rd.label)}" data-c="r-label" autocomplete="off"></div>
    <div class="full small muted" id="rule-prev" aria-live="polite">${rulePreviewHtml()}</div>
    <div class="full" style="display:flex;gap:8px"><button class="btn" type="submit" style="flex:1">${editRuleId?'Save changes':'Add recurring item'}</button>${editRuleId?'<button class="btn ghost" type="button" data-a="cancelrule">Cancel</button>':'<button class="btn ghost" type="button" data-a="togglerule">Close</button>'}</div>
  </form>
`:''}</div>`;
}
function archivedCard(){
  const a=[];TYPES.forEach(T=>S.cats[T.k].forEach(s=>{if(s.archived)a.push({s,T})}));if(!a.length)return '';
  return `<div class="card" style="margin-top:16px"><h2>Archived lines${tipHtml({k:'archived',label:'Archived lines',tip:"Lines you've stopped using. Every past month keeps its data. Restore one to use it again."})}</h2>
  ${a.map(({s,T})=>`<div class="rule"><div><b>${esc(s.name)}</b> <span class="small muted">${T.label}. Shown through ${esc(mLabel(s.until))}</span></div><button class="btn ghost" data-a="restorecat" data-v="${s.id}">Restore</button></div>`).join('')}</div>`;
}
function renderCats(){
  const extras={savings:[['open','Starting balance'],['goal','Goal']],investments:[['room','Total room now'],['limit','New room yearly']],debt:[['start','Starting balance'],['paid','Paid so far']]};
  const hints={savings:'Starting balance is what you had saved before Oct 2026. A goal is optional.',investments:'Total room now is everything you can contribute as of Oct 2026, including unused room carried over from past years. New room yearly is what gets added each January. Leave both blank for accounts without a limit.',debt:'Starting balance is the full loan amount. Paid so far is how much you had already paid off before Oct 2026. Payments you log under Debt are added on top each month.'};
  const noun={income:'income source',bills:'bill',expenses:'expense',savings:'savings goal',investments:'investment account',debt:'loan'};
  const xb=s=>`<button class="xbtn" data-a="delcat" data-v="${s.id}" aria-label="Remove ${esc(s.name)}">&times;</button>`;
  const nameIn=s=>`<input type="text" aria-label="Name" value="${esc(s.name)}" data-c="rename" data-v="${s.id}">`;
  const card=T=>{
    const ex=extras[T.k]||[],list=S.cats[T.k].filter(s=>!s.archived);
    let body;
    if(!list.length)body='<p class="empty">No lines yet. Add your first one above.</p>';
    else if(ex.length)body=`<div class="crow c${ex.length} head"><span>Name</span>${ex.map(e=>`<span>${e[1]}</span>`).join('')}<span></span></div>`+list.map(s=>`<div class="crow c${ex.length}">${nameIn(s)}${ex.map(e=>`<input type="number" min="0" aria-label="${esc(s.name)} ${e[1].toLowerCase()}" placeholder="0" value="${s[e[0]]||''}" data-c="extra" data-k="${e[0]}" data-v="${s.id}">`).join('')}${xb(s)}</div>`).join('');
    else body=`<div class="chips">${list.map(s=>`<div class="chip">${nameIn(s)}${xb(s)}</div>`).join('')}</div>`;
    return `<div class="card"><h2>${T.label}${tipHtml(Object.assign({},T,{tip:T.tip+(hints[T.k]?' '+hints[T.k]:'')}))}</h2>
      <form class="addrow" data-form="addcat" data-t="${T.k}"><input type="text" id="add-${T.k}" placeholder="New ${noun[T.k]}" aria-label="New ${noun[T.k]} name" autocomplete="off"><button class="btn" type="submit">Add</button></form>
      ${body}</div>`;
  };
  const col=ks=>`<div class="stack">${ks.map(k=>card(TYPES.find(t=>t.k===k))).join('')}</div>`;
  return `<div class="bar"><h1>Set-Up${tipHtml({k:'setup',label:'Set-Up',tip:'Set up your budget sheet here. Include all income sources, bills, expense categories, etc. New categories can be added at any point.'},'','About Set-Up')}</h1><button class="btn ghost" data-a="togglesetup" style="margin-left:auto">${S.hideSetup?'Show as a tab':'Hide this tab'}</button></div>
  <div class="catgrid3">${col(['income','expenses'])}${col(['bills','debt'])}${col(['savings','investments'])}</div>
  ${recurringCard()}${archivedCard()}`;
}

/* ---------- render ---------- */
function render(){
  if(!user){renderGate();return}
  postDue();
  const inner=tab==='month'?renderMonth():tab==='overview'?renderOverview():tab==='networth'?renderNW():renderCats();
  const y=window.scrollY;
  document.getElementById('app').innerHTML=shell(inner);
  document.body.style.overflow=(tab==='month'&&isMobile()&&sheetOpen)?'hidden':'';
  window.scrollTo(0,y);
}

/* ---------- events ---------- */
document.addEventListener('click',e=>{
  const tb=e.target.closest('.tip');
  document.querySelectorAll('.tipwrap.open').forEach(w=>{if(!tb||w!==tb.parentElement)w.classList.remove('open')});
  if(tb){tb.parentElement.classList.toggle('open');requestAnimationFrame(()=>fitTip(tb.parentElement));return}
  const b=e.target.closest('[data-a]');if(!b)return;
  const a=b.dataset.a,v=b.dataset.v;
  if(a==='palette'){S.palette=v;save();applyPalette();render();toast(PALETTES.find(p=>p.k===v).n+' colour scheme')}
  else if(a==='enter'){user=emailVal||'demo@example.com';try{localStorage.setItem(SESSION,user)}catch(x){}render()}
  else if(a==='back-email'){step='email';render()}
  else if(a==='signout'){if(window.__BT_SIGNOUT)window.__BT_SIGNOUT()}
  else if(a==='tab'){cancelEdit();if(tab==='cats'&&v!=='cats'){S.setupDone=true;save()}tab=v;render();window.scrollTo(0,0)}
  else if(a==='edittx'){const t=S.tx.find(x=>x.id===v);if(t){editId=v;draft={date:t.date,desc:t.desc||'',amt:t.expr||String(t.amt),type:typeOf(t.sub)||'expenses',sub:t.sub};sheetOpen=isMobile();render();const f=document.getElementById('f-amt');if(f){f.scrollIntoView({block:'center',behavior:'smooth'});f.focus()}}}
  else if(a==='plus'){const f=document.getElementById('f-amt');if(f){let v=f.value.trim();if(v&&!/[+\-*/(]$/.test(v))v+='+';f.value=v;draft.amt=v;const pv=document.getElementById('amt-preview');if(pv)pv.textContent=amtPreview(v);f.focus()}}
  else if(a==='opensheet'){sheetOpen=true;render();setTimeout(()=>{const f=document.getElementById('f-amt');if(f)f.focus()},60)}
  else if(a==='closesheet'){cancelEdit();render();const fb=document.querySelector('.fab');if(fb)fb.focus()}
  else if(a==='canceledit'){cancelEdit();render()}
  else if(a==='prev'||a==='next'){cancelEdit();const i=MONTHS.indexOf(cur)+(a==='next'?1:-1);if(MONTHS[i]){cur=MONTHS[i];selDay=null;render()}}
  else if(a==='skip'){S.skip[b.dataset.r+'|'+v]=true;save();render();toast('Skipped. It won\'t post.')}
  else if(a==='gorec'){cancelEdit();tab='cats';render();setTimeout(()=>{const e=document.getElementById('rec');if(e)e.scrollIntoView({behavior:'smooth',block:'start'})},40)}
  else if(a==='editrule'){const r=S.rules.find(x=>x.id===v);if(r){editRuleId=v;ruleOpen=true;rd={type:typeOf(r.sub)||'bills',sub:r.sub,amt:String(r.amt),freq:r.freq,start:r.start,end:r.end||'',label:r.label||''};render();const e=document.getElementById('ruleform');if(e)e.scrollIntoView({behavior:'smooth',block:'center'})}}
  else if(a==='cancelrule'){editRuleId=null;ruleOpen=false;rd=newRuleDraft();render()}
  else if(a==='togglerule'){if(editRuleId){editRuleId=null;ruleOpen=false;rd=newRuleDraft()}else ruleOpen=!ruleOpen;render();if(ruleOpen){const f=document.getElementById('r-amt');if(f){f.scrollIntoView({behavior:'smooth',block:'center'});f.focus()}}}
  else if(a==='delrule'){S.rules=S.rules.filter(r=>r.id!==v);Object.keys(S.skip).forEach(k=>{if(k.startsWith(v+'|'))delete S.skip[k]});if(editRuleId===v){editRuleId=null;rd=newRuleDraft()}save();render();toast('Removed. Payments already posted stay.')}
  else if(a==='gomonth'){cancelEdit();S.setupDone=true;save();cur=v;tab='month';selDay=null;render();window.scrollTo(0,0)}
  else if(a==='day'){if(editId){draft.date=v;render();return}
    if(isMobile()){selDay=v;draft.date=v;sheetOpen=true;render();setTimeout(()=>{const f=document.getElementById('f-amt');if(f)f.focus()},60);return}selDay=selDay===v?null:v;draft.date=v;render()}
  else if(a==='clearday'){selDay=null;render()}
  else if(a==='deltx'){const dt=S.tx.find(t=>t.id===v);if(dt&&dt.ruleId)S.skip[dt.ruleId+'|'+dt.date]=true;S.tx=S.tx.filter(t=>t.id!==v);save();render();toast('Transaction deleted')}
  else if(a==='copyplan'){const p=MONTHS[MONTHS.indexOf(cur)-1];S.plan[cur]=Object.assign({},S.plan[p]||{});save();render();toast('Copied plan from '+mLabel(p))}
  else if(a==='estimate'){QUARTERS.forEach(x=>{S.nw[x.q]=S.nw[x.q]||{};S.cats.savings.forEach(s=>S.nw[x.q][s.id]=r2((s.open||0)+cum(s.id,x.end)));S.cats.investments.forEach(s=>S.nw[x.q][s.id]=cum(s.id,x.end));S.cats.debt.forEach(s=>S.nw[x.q][s.id]=Math.max(0,r2((s.start||0)-cum(s.id,x.end))))});save();render();toast('Filled in from your transactions')}
  else if(a==='addcat'){const inp=document.getElementById('add-'+v),n=(inp.value||'').trim();if(!n){inp.focus();return}S.cats[v].push({id:uid(),name:n});save();render();toast('Added '+n)}
  else if(a==='delcat'){
    const s=subOf(v),k=typeOf(v);
    if(S.rules.some(r=>r.sub===v)){toast(`"${s.name}" is used by a recurring item. Remove that first.`);return}
    const hist=S.tx.some(t=>t.sub===v)||Object.values(S.plan).some(pl=>pl&&pl[v]>0)||Object.values(S.bal).some(x=>x&&x[v]!==undefined)||Object.values(S.nw).some(q=>q&&q[v]>0);
    if(hist){const cm=todayStr().slice(0,7);s.archived=true;s.until=cm<MONTHS[0]?MONTHS[0]:(cm>MONTHS[MONTHS.length-1]?MONTHS[MONTHS.length-1]:cm);save();render();toast(`"${s.name}" archived. Past months keep their data.`);return}
    S.cats[k]=S.cats[k].filter(c=>c.id!==v);save();render();toast('Removed')}
  else if(a==='restorecat'){const s=subOf(v);if(s){delete s.archived;delete s.until;save();render();toast(`"${s.name}" is back`)}}
  else if(a==='ovtoggle'){const k=v;let s=(S.ovSel&&S.ovSel.length?S.ovSel:['income','bills','expenses']).slice();s=s.includes(k)?s.filter(x=>x!==k):s.concat(k);if(s.length){S.ovSel=s;save();render()}}
  else if(a==='togglesetup'){S.hideSetup=!S.hideSetup;if(S.hideSetup)tab='month';save();render();window.scrollTo(0,0);
    toast(S.hideSetup?'Set-Up tab hidden. Find it next to Sign out.':'Set-Up is back in the tabs')}
  else if(a==='reset'){const pal=S.palette,hs=S.hideSetup;S=seed();S.palette=pal;S.hideSetup=hs;cur=MONTHS.includes(todayStr().slice(0,7))?todayStr().slice(0,7):MONTHS[0];selDay=null;save();render();toast('Sample data restored')}
  else if(a==='clear'){
    if(!wipeArmed){wipeArmed=true;render();clearTimeout(window.__w);window.__w=setTimeout(()=>{wipeArmed=false;render()},6000);return}
    wipeArmed=false;S.tx=[];S.bal={};S.nw={};S.plan={};S.rules=[];S.skip={};editRuleId=null;ruleOpen=false;rd=newRuleDraft();MONTHS.forEach(m=>S.plan[m]={});
    Object.keys(S.cats).forEach(k=>S.cats[k].forEach(c=>{['goal','open','start','limit','room'].forEach(f=>{if(c[f]!==undefined)c[f]=0})}));
    save();render();toast('Cleared. Your line names are kept.')}
});
document.addEventListener('change',e=>{
  const t=e.target,c=t.dataset.c;if(!c)return;
  if(c==='month'){cancelEdit();cur=t.value;selDay=null;render()}
  else if(c==='d-type'){draft.type=t.value;draft.sub='';render()}
  else if(c==='d-sub')draft.sub=t.value;
  else if(c==='d-date'){if(t.value){draft.date=t.value;if(!editId)selDay=t.value;render()}}
  else if(c==='r-type'){rd.type=t.value;rd.sub='';render()}
  else if(c==='r-sub')rd.sub=t.value;
  else if(c==='r-freq'){rd.freq=t.value;updateRulePreview()}
  else if(c==='r-start'){rd.start=t.value;updateRulePreview()}
  else if(c==='r-end'){rd.end=t.value;updateRulePreview()}
  else if(c==='r-amt'){rd.amt=t.value;updateRulePreview()}
  else if(c==='r-label')rd.label=t.value;
  else if(c==='d-amt')draft.amt=t.value;
  else if(c==='d-desc')draft.desc=t.value;
  else if(c==='plan'){S.plan[cur]=S.plan[cur]||{};S.plan[cur][t.dataset.v]=Math.max(0,parseFloat(t.value)||0);save();render()}
  else if(c==='nwbal'){
    const qi=+t.dataset.q,id=t.dataset.v,q=QUARTERS[qi],prev=qi>0?QUARTERS[qi-1].end:'0000';
    if(t.value.trim()===''){MONTHS.filter(m=>m>prev&&m<=q.end).forEach(m=>{if(S.bal[m])delete S.bal[m][id]})}
    else{S.bal[q.end]=S.bal[q.end]||{};S.bal[q.end][id]=Math.max(0,parseFloat(t.value)||0)}
    save();render()}
  else if(c==='bal'){S.bal=S.bal||{};S.bal[cur]=S.bal[cur]||{};if(t.value.trim()==='')delete S.bal[cur][t.dataset.v];else S.bal[cur][t.dataset.v]=Math.max(0,parseFloat(t.value)||0);save();render()}
  else if(c==='nw'){const q=t.dataset.q;S.nw[q]=S.nw[q]||{};S.nw[q][t.dataset.v]=parseFloat(t.value)||0;save();render()}
  else if(c==='rename'){const s=subOf(t.dataset.v);if(s&&t.value.trim()){s.name=t.value.trim();save();render()}}
  else if(c==='extra'){const s=subOf(t.dataset.v);if(s){s[t.dataset.k]=Math.max(0,parseFloat(t.value)||0);save();render()}}
});
document.addEventListener('input',e=>{const t=e.target,c=t.dataset.c;if(c==='d-amt'){draft.amt=t.value;const pv=document.getElementById('amt-preview');if(pv)pv.textContent=amtPreview(t.value)}else if(c==='d-desc')draft.desc=t.value;else if(c==='r-amt'){rd.amt=t.value;updateRulePreview()}else if(c==='r-label')rd.label=t.value});
document.addEventListener('submit',e=>{
  e.preventDefault();
  if(e.target.id==='gateform'){emailVal=document.getElementById('em').value.trim();step='sent';render();return}
  if(e.target.dataset&&e.target.dataset.form==='rule'){
    const amt=parseAmount(rd.amt);
    if(!(amt>0)){toast('Enter an amount greater than 0');return}
    if(!rd.sub){toast('Pick a line first');return}
    if(!/^\d{4}-\d{2}-\d{2}$/.test(rd.start)){toast('Pick the first payment date');return}
    if(rd.end&&rd.end<rd.start){toast('The end date is before the first payment');return}
    const label=rd.label.trim();let msg;
    if(editRuleId){const r=S.rules.find(x=>x.id===editRuleId);if(r)Object.assign(r,{sub:rd.sub,amt,freq:rd.freq,start:rd.start,end:rd.end||'',label,since:todayStr()});editRuleId=null;const n=postDue();msg='Saved. Changes apply from today on.'+(n?` ${n} posted.`:'')}
    else{S.rules.push({id:uid(),sub:rd.sub,amt,freq:rd.freq,start:rd.start,end:rd.end||'',label,since:''});const n=postDue();msg=n?`Added. ${n} payment${n>1?'s':''} posted so far.`:'Added. It will post on its due date.'}
    rd=newRuleDraft();ruleOpen=false;save();render();toast(msg);return;
  }
  if(e.target.dataset&&e.target.dataset.form==='addcat'){
    const k=e.target.dataset.t,inp=e.target.querySelector('input'),n=inp.value.trim();
    if(!n){inp.focus();return}
    S.cats[k].push({id:uid(),name:n});save();render();toast('Added '+n);
    const f=document.getElementById('add-'+k);if(f)f.focus();return;
  }
  if(e.target.id==='txform'){
    const amt=parseAmount(draft.amt),ex=isSum(draft.amt)?draft.amt.trim():'';
    if(!(amt>0)){toast(isSum(draft.amt)?'That sum needs to add up to more than 0':'Enter an amount like 50 or 50+100');return}
    if(!draft.sub){toast('Pick a subcategory');return}
    if(editId){const t=S.tx.find(x=>x.id===editId);if(t){t.date=draft.date;t.desc=draft.desc.trim();t.amt=r2(amt);if(ex)t.expr=ex;else delete t.expr;t.sub=draft.sub;if(selDay)selDay=t.date}
      editId=null;sheetOpen=false;draft.amt='';draft.desc='';save();render();toast('Changes saved');return}
    S.tx.push(Object.assign({id:uid(),date:draft.date,desc:draft.desc.trim(),amt:r2(amt),sub:draft.sub},ex?{expr:ex}:{}));
    const sub=subOf(draft.sub);draft.amt='';draft.desc='';save();render();toast('Added to '+sub.name);
    const f=document.getElementById('f-amt');if(f)f.focus();
  }
});
document.addEventListener('wheel',()=>{const a=document.activeElement;if(a&&a.type==='number')a.blur()},{passive:true});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&sheetOpen){cancelEdit();render();return}if(e.key==='Escape'){document.querySelectorAll('.tipwrap.open').forEach(w=>w.classList.remove('open'));if(document.activeElement&&document.activeElement.classList.contains('tip'))document.activeElement.blur()}});
applyPalette();
render();
