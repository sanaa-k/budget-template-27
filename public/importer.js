/* Reads a downloaded copy of the Google Sheets budget template (.xlsx) and pulls out
   category names, savings goals, loan balances and planned amounts. Runs in the browser only. */
(function(root){
  const SECTIONS=['income','bills','expenses','savings','investments','debt'];
  const MONTHS=['january','february','march','april','may','june','july','august','september','october','november','december'];
  const norm=v=>String(v==null?'':v).replace(/\s+/g,' ').trim();
  const low=v=>norm(v).toLowerCase();
  const PLACEHOLDER=/^(goal|loan|other category|income source|bill|expense|category|line)\s*\d+$/i;
  const num=v=>{if(typeof v==='number'&&isFinite(v))return v;const n=parseFloat(String(v).replace(/[$,\s]/g,''));return isFinite(n)&&/\d/.test(String(v))?n:null};

  function monthOf(name){const l=low(name);return MONTHS.findIndex(m=>l===m||l.startsWith(m+' ')||l.startsWith(m.slice(0,3)+' ')||l===m.slice(0,3))}

  function pickSheet(wb,XLSX,wantMonth){
    const cands=wb.SheetNames.map(n=>({n,m:monthOf(n)})).filter(x=>x.m>=0&&!/\b20\d\d\b/.test(x.n)||x.m>=0&&wb.SheetNames.length<3);
    const monthly=wb.SheetNames.filter(n=>monthOf(n)>=0);
    const ok=n=>{const g=grid(XLSX,wb.Sheets[n]);return findSections(g).length>=3};
    const preferred=monthly.filter(n=>monthOf(n)===wantMonth&&!/\b20\d\d\b/.test(n)).concat(monthly.filter(n=>monthOf(n)===wantMonth));
    for(const n of preferred)if(ok(n))return n;
    for(const n of monthly.slice().reverse())if(ok(n))return n;
    for(const n of wb.SheetNames)if(ok(n))return n;
    return null;
  }
  function grid(XLSX,ws){return XLSX.utils.sheet_to_json(ws,{header:1,raw:true,defval:''})}
  const cell=(g,r,c)=>(g[r]&&g[r][c]!==undefined)?g[r][c]:'';

  function findSections(g){
    const out=[];
    for(let r=0;r<g.length;r++)for(let c=0;c<(g[r]||[]).length;c++){
      const t=low(g[r][c]);
      if(SECTIONS.includes(t)&&low(cell(g,r,c+1))==='planned'&&low(cell(g,r,c+2))==='actual')out.push({k:t,r,c});
    }
    return out;
  }

  function parse(XLSX,wb,wantMonth){
    const sheet=pickSheet(wb,XLSX,wantMonth);
    if(!sheet)return {error:"I couldn't find the category tables in this file. Download your sheet as an Excel file (.xlsx) and choose a monthly tab that has the Income, Bills and Expenses tables."};
    const g=grid(XLSX,wb.Sheets[sheet]),secs=findSections(g),res={sheet,cats:{income:[],bills:[],expenses:[],savings:[],investments:[],debt:[]},goals:{},balances:{}};
    const topRow=Math.min(...secs.map(s=>s.r));
    for(const s of secs){
      if(res.cats[s.k].length)continue;
      let blanks=0;
      for(let r=s.r+1;r<Math.min(g.length,s.r+60);r++){
        const name=norm(cell(g,r,s.c)),l=name.toLowerCase();
        if(l==='total')break;
        if(!name){if(++blanks>3&&res.cats[s.k].length)break;continue}
        blanks=0;
        if(SECTIONS.includes(l)&&low(cell(g,r,s.c+1))==='planned')break;
        if(name==='-'||/^-+$/.test(name)||PLACEHOLDER.test(name))continue;
        const p=num(cell(g,r,s.c+1));
        res.cats[s.k].push({name,planned:p&&p>0?p:0});
      }
    }
    /* savings goals and loan balances sit in the header block above the tables */
    const find=name=>{const key=low(name);for(let r=0;r<topRow+1;r++)for(let c=0;c<(g[r]||[]).length;c++)if(low(g[r][c])===key)return {r,c};return null};
    for(const it of res.cats.savings){const at=find(it.name);if(at&&low(cell(g,at.r+1,at.c))==='goal'){const v=num(cell(g,at.r+1,at.c+1));if(v&&v>0)res.goals[it.name]=v}}
    for(const it of res.cats.debt){const at=find(it.name);if(!at)continue;
      let bal=null,paid=0,rem=null;
      for(let r=at.r+1;r<at.r+8;r++){const lab=low(cell(g,r,at.c)),v=num(cell(g,r,at.c+1));
        if(lab==='balance')bal=v;else if(lab==='paid')paid=v||0;else if(lab==='remainder')rem=v}
      const cur=rem!==null?rem:(bal!==null?bal-paid:null);
      if(cur!==null&&cur>0)res.balances[it.name]=Math.round(cur*100)/100;
    }
    res.counts=Object.fromEntries(Object.entries(res.cats).map(([k,v])=>[k,v.length]));
    return res;
  }
  root.BTImport={parse,monthOf,norm};
  if(typeof module!=='undefined')module.exports=root.BTImport;
})(typeof window!=='undefined'?window:globalThis);
