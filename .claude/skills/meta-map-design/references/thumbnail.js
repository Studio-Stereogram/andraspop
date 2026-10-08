// Generated sequencer-style thumbnail for videos without a real thumbnail.
// Deterministic: the same node id + title always gives the same pattern.
// Port to a React component or a server-side SVG/OG image as needed.

const CREAM = '#EDF0F4', BLACK = '#0C0E11';
const f2 = v => +v.toFixed(2);
export function h32(s){ let h=2166136261; for(const c of String(s)){ h^=c.charCodeAt(0); h=Math.imul(h,16777619); } return h>>>0; }
export function rng(a){ return ()=>{ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }

/** @param {{id:string,title:string,topics:string[]}} node  @param {(id:string)=>{color:string}|undefined} topic */
export function thumbSVG(n, topic){
  const C=14, R=7, r=rng(h32(n.id+'|'+n.title));
  const cols=n.topics.map(topic).filter(Boolean).map(t=>t.color); if(!cols.length) cols.push('#C9B99A');
  let s='<svg viewBox="0 0 '+C+' '+R+'" preserveAspectRatio="xMidYMid slice" aria-hidden="true">';
  let g=''; for(let x=1;x<C;x++) g+='M'+x+' 0V'+R; for(let y=1;y<R;y++) g+='M0 '+y+'H'+C;
  s+='<path d="'+g+'" stroke="#1A1E24" stroke-width=".03" fill="none"/>';
  const kinds=['solid','dot','ring','x','quad','bars','hatch','dots9','solid','dot'];
  for(let y=0;y<R;y++) for(let x=0;x<C;x++){
    if(r()>.3) continue;
    const c=r()<.14?CREAM:cols[Math.floor(r()*cols.length)], k=kinds[Math.floor(r()*kinds.length)];
    const X=x+.08, Y=y+.08, z=.84, m=(a,b)=>f2(X+z*a)+' '+f2(Y+z*b);
    const rect=(fill)=>'<rect x="'+f2(X)+'" y="'+f2(Y)+'" width="'+z+'" height="'+z+'" fill="'+fill+'"/>';
    if(k==='solid') s+=rect(c);
    else if(k==='dot') s+=rect(CREAM)+'<circle cx="'+f2(X+z/2)+'" cy="'+f2(Y+z/2)+'" r="'+f2(z*.27)+'" fill="'+BLACK+'"/>';
    else if(k==='ring') s+=rect(c)+'<circle cx="'+f2(X+z/2)+'" cy="'+f2(Y+z/2)+'" r="'+f2(z*.2)+'" fill="none" stroke="'+BLACK+'" stroke-width="'+f2(z*.12)+'"/>';
    else if(k==='x') s+=rect(c)+'<path d="M'+m(.24,.24)+'L'+m(.76,.76)+'M'+m(.76,.24)+'L'+m(.24,.76)+'" stroke="'+BLACK+'" stroke-width="'+f2(z*.15)+'" stroke-linecap="round"/>';
    else if(k==='quad') [[.08,.08],[.56,.08],[.08,.56],[.56,.56]].forEach(([a,b])=>{ s+='<rect x="'+f2(X+z*a)+'" y="'+f2(Y+z*b)+'" width="'+f2(z*.36)+'" height="'+f2(z*.36)+'" fill="'+CREAM+'"/>'; });
    else if(k==='bars') s+=rect(c)+'<rect x="'+f2(X+z*.28)+'" y="'+f2(Y+z*.2)+'" width="'+f2(z*.15)+'" height="'+f2(z*.6)+'" rx="'+f2(z*.06)+'" fill="'+BLACK+'" opacity=".55"/><rect x="'+f2(X+z*.57)+'" y="'+f2(Y+z*.2)+'" width="'+f2(z*.15)+'" height="'+f2(z*.6)+'" rx="'+f2(z*.06)+'" fill="'+BLACK+'" opacity=".55"/>';
    else if(k==='hatch') s+='<path d="M'+m(0,1)+'L'+m(1,0)+'M'+m(0,.5)+'L'+m(.5,0)+'M'+m(.5,1)+'L'+m(1,.5)+'M'+m(0,.25)+'L'+m(.25,0)+'M'+m(.75,1)+'L'+m(1,.75)+'" stroke="'+c+'" stroke-width=".07"/>';
    else if(k==='dots9'){ s+=rect(c); [.24,.5,.76].forEach(a=>[.24,.5,.76].forEach(b=>{ s+='<circle cx="'+f2(X+z*a)+'" cy="'+f2(Y+z*b)+'" r="'+f2(z*.07)+'" fill="'+BLACK+'" opacity=".7"/>'; })); }
  }
  s+='<path d="M.35 1.25V.35H1.25M'+(C-1.25)+' .35H'+(C-.35)+'V1.25M.35 '+(R-1.25)+'V'+(R-.35)+'H1.25M'+(C-1.25)+' '+(R-.35)+'H'+(C-.35)+'V'+(R-1.25)+'" stroke="'+CREAM+'" stroke-width=".07" fill="none"/>';
  return s+'</svg>';
}
