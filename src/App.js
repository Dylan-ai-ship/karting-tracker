import { useState, useEffect, useRef } from "react";

const SUPA_URL = "https://udrxggmexvjetordecuy.supabase.co";
const SUPA_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVkcnhnZ21leHZqZXRvcmRlY3V5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyMzg5OTksImV4cCI6MjA5NTgxNDk5OX0.xCZX77v3tbL3wqEEh9Lq9PbN0iKwcxgLT2p4TXfdUgY";

const H = {
  "Content-Type": "application/json",
  "apikey": SUPA_KEY,
  "Authorization": `Bearer ${SUPA_KEY}`,
  "Prefer": "return=representation"
};
const api = {
  get: (table) => fetch(`${SUPA_URL}/rest/v1/${table}?select=*`, {method:"GET", headers:H}).then(r=>r.json()),
  post: (table, body) => fetch(`${SUPA_URL}/rest/v1/${table}`, {method:"POST", headers:H, body:JSON.stringify(body)}).then(r=>({ok:r.ok})),
  patch: (table, body, col, val) => fetch(`${SUPA_URL}/rest/v1/${table}?${col}=eq.${encodeURIComponent(val)}`, {method:"PATCH", headers:H, body:JSON.stringify(body)}).then(r=>({ok:r.ok})),
  del: (table, col, val) => fetch(`${SUPA_URL}/rest/v1/${table}?${col}=eq.${encodeURIComponent(val)}`, {method:"DELETE", headers:H}).then(r=>({ok:r.ok})),
};

const fmtTime = (ms) => {
  if (!ms && ms !== 0) return "--:--.---";
  const m=Math.floor(ms/60000), s=Math.floor((ms%60000)/1000), mm=ms%1000;
  return `${m}:${String(s).padStart(2,"0")}.${String(mm).padStart(3,"0")}`;
};
const parseTime = (str) => {
  const m1=str.match(/^(\d+):(\d{2})\.(\d{3})$/);
  if(m1) return parseInt(m1[1])*60000+parseInt(m1[2])*1000+parseInt(m1[3]);
  const m2=str.match(/^(\d{1,2})\.(\d{3})$/);
  if(m2) return parseInt(m2[1])*1000+parseInt(m2[2]);
  return null;
};
const today = () => new Date().toISOString().split("T")[0];
const ROLE_COLOR = {admin:"#f59e0b",normal:"#3b82f6",superieur:"#8b5cf6",restreint:"#6b7280"};
const ROLE_LABEL = {admin:"Admin",normal:"Normal",superieur:"Supérieur",restreint:"Restreint"};

function computePoints(times, sessions, accounts) {
  const pts={};
  accounts.forEach(a=>{pts[a.id]=0;});
  sessions.filter(s=>s.closed).forEach(sess=>{
    const st=times.filter(t=>t.session_id===sess.id);
    if(!st.length) return;
    const byUser={};
    st.forEach(t=>{if(byUser[t.user_id]===undefined||t.ms<byUser[t.user_id])byUser[t.user_id]=t.ms;});
    let poleMs=Infinity,poleUser=null;
    Object.entries(byUser).forEach(([uid,ms])=>{if(ms<poleMs){poleMs=ms;poleUser=uid;}});
    Object.entries(byUser).forEach(([uid,ms])=>{
      if(pts[uid]===undefined)pts[uid]=0;
      pts[uid]+=1; if(ms<35000)pts[uid]+=1; if(uid===poleUser)pts[uid]+=2;
    });
  });
  return pts;
}

function DatePicker({value,onChange,label}){
  const [open,setOpen]=useState(false);
  const [view,setView]=useState(()=>value?new Date(value):new Date());
  const ref=useRef();
  useEffect(()=>{
    const h=e=>{if(ref.current&&!ref.current.contains(e.target))setOpen(false);};
    document.addEventListener("mousedown",h);return()=>document.removeEventListener("mousedown",h);
  },[]);
  const y=view.getFullYear(),m=view.getMonth();
  const days=new Date(y,m+1,0).getDate(),offset=(new Date(y,m,1).getDay()+6)%7;
  const months=["Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"];
  const select=d=>{onChange(`${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`);setOpen(false);};
  const isSat=d=>new Date(y,m,d).getDay()===6;
  const isSel=d=>{if(!value)return false;const v=new Date(value);return v.getFullYear()===y&&v.getMonth()===m&&v.getDate()===d;};
  const fmt=v=>{if(!v)return"";const[yy,mm,dd]=v.split("-");return`${dd}/${mm}/${yy}`;};
  return(
    <div ref={ref} style={{position:"relative",marginBottom:12}}>
      {label&&<label style={lbl}>{label}</label>}
      <div onClick={()=>setOpen(o=>!o)} style={{...inp,marginBottom:0,cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center",userSelect:"none"}}>
        <span style={{color:value?"#f1f5f9":"#475569"}}>{value?fmt(value):"JJ/MM/AAAA"}</span>
        <span>📅</span>
      </div>
      {open&&(
        <div style={{position:"absolute",zIndex:999,background:"#1e293b",border:"1px solid #334155",borderRadius:12,padding:14,top:"110%",left:0,minWidth:260,boxShadow:"0 8px 32px #0008"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <button onClick={()=>setView(new Date(y,m-1,1))} style={{background:"none",border:"none",color:"#f59e0b",cursor:"pointer",fontSize:18}}>‹</button>
            <span style={{fontWeight:700,color:"#f1f5f9"}}>{months[m]} {y}</span>
            <button onClick={()=>setView(new Date(y,m+1,1))} style={{background:"none",border:"none",color:"#f59e0b",cursor:"pointer",fontSize:18}}>›</button>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2,marginBottom:4}}>
            {["Lu","Ma","Me","Je","Ve","Sa","Di"].map(d=><div key={d} style={{textAlign:"center",fontSize:11,color:"#64748b"}}>{d}</div>)}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2}}>
            {Array(offset).fill(null).map((_,i)=><div key={"e"+i}/>)}
            {Array(days).fill(null).map((_,i)=>{
              const d=i+1,sat=isSat(d),sel=isSel(d);
              return <div key={d} onClick={()=>select(d)} style={{textAlign:"center",padding:"5px 2px",borderRadius:6,cursor:"pointer",fontWeight:sat?700:400,color:sel?"#0f172a":sat?"#f59e0b":"#f1f5f9",background:sel?"#f59e0b":"transparent",fontSize:13}}
                onMouseEnter={e=>{if(!sel)e.currentTarget.style.background="#334155";}}
                onMouseLeave={e=>{if(!sel)e.currentTarget.style.background="transparent";}}
              >{d}</div>;
            })}
          </div>
          <div onClick={()=>select(new Date().getDate())} style={{textAlign:"center",marginTop:10,color:"#f59e0b",fontSize:12,cursor:"pointer"}}>Aujourd'hui</div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
export default function App() {
  const [accounts,setAccounts]=useState([]);
  const [sessions,setSessions]=useState([]);
  const [times,setTimes]=useState([]);
  const [journals,setJournals]=useState([]);
  const [preps,setPreps]=useState([]);
  const [sports,setSports]=useState([]);
  const [currentUser,setCurrentUser]=useState(null);
  const [tab,setTab]=useState("dashboard");
  const [loading,setLoading]=useState(true);

  const fetchAll=async()=>{
    setLoading(true);
    const [a,s,t,j,p,sp]=await Promise.all([
      api.get("accounts"),api.get("sessions"),api.get("times"),
      api.get("journals"),api.get("preps"),api.get("sports"),
    ]);
    setAccounts(Array.isArray(a)?a:[]);
    setSessions(Array.isArray(s)?s:[]);
    setTimes(Array.isArray(t)?t:[]);
    setJournals(Array.isArray(j)?j:[]);
    setPreps(Array.isArray(p)?p:[]);
    setSports(Array.isArray(sp)?sp:[]);
    setLoading(false);
  };

  useEffect(()=>{fetchAll();},[]);

  // Poll every 15s for realtime-like updates
  useEffect(()=>{
    const id=setInterval(()=>{
      Promise.all([api.get("accounts"),api.get("sessions"),api.get("times")]).then(([a,s,t])=>{
        if(Array.isArray(a))setAccounts(a);
        if(Array.isArray(s))setSessions(s);
        if(Array.isArray(t))setTimes(t);
      });
    },15000);
    return()=>clearInterval(id);
  },[]);

  if(loading) return(
    <div style={{minHeight:"100vh",background:"#0f172a",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:16}}>
      <div style={{fontSize:48}}>🏁</div>
      <div style={{color:"#f59e0b",fontWeight:700,fontSize:18}}>Chargement...</div>
    </div>
  );

  if(!currentUser) return <Login accounts={accounts} onLogin={setCurrentUser} onRegister={async a=>{await api.post("accounts",a);setAccounts(p=>[...p,a]);}}/>;

  const role=currentUser.role;
  const tabs=[
    {id:"dashboard",label:"Dashboard",icon:"📊"},
    {id:"saisie",label:"Saisie",icon:"⏱️"},
    {id:"historique",label:"Historique",icon:"📅"},
    {id:"journal",label:"Journal",icon:"📓"},
    {id:"preparation",label:"Préparation",icon:"💪"},
    ...(role==="admin"?[{id:"admin",label:"Admin",icon:"🛡️"}]:[]),
    {id:"parametres",label:"Paramètres",icon:"⚙️"},
  ];

  return(
    <div style={{minHeight:"100vh",background:"#0f172a",color:"#f1f5f9",fontFamily:"system-ui,sans-serif",display:"flex",flexDirection:"column"}}>
      <div style={{background:"#1e293b",borderBottom:"2px solid #f59e0b",padding:"12px 20px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:24}}>🏁</span>
          <span style={{fontWeight:700,fontSize:18,color:"#f59e0b"}}>Karting Tracker</span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:18}}>{currentUser.avatar}</span>
          <span style={{fontSize:14,color:"#94a3b8"}}>{currentUser.name}</span>
          <span style={{fontSize:11,background:ROLE_COLOR[role],color:"#fff",borderRadius:99,padding:"2px 8px"}}>{ROLE_LABEL[role]}</span>
          <button onClick={()=>setCurrentUser(null)} style={{background:"#ef4444",border:"none",color:"#fff",borderRadius:6,padding:"4px 10px",cursor:"pointer",fontSize:12}}>Déco</button>
        </div>
      </div>
      <div style={{background:"#1e293b",display:"flex",overflowX:"auto",borderBottom:"1px solid #334155"}}>
        {tabs.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{background:tab===t.id?"#f59e0b":"transparent",color:tab===t.id?"#0f172a":"#94a3b8",border:"none",padding:"12px 14px",cursor:"pointer",fontWeight:tab===t.id?700:400,fontSize:13,whiteSpace:"nowrap",display:"flex",alignItems:"center",gap:5}}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>
      <div style={{flex:1,overflowY:"auto",padding:20}}>
        {tab==="dashboard"   &&<Dashboard currentUser={currentUser} accounts={accounts} times={times} sessions={sessions}/>}
        {tab==="saisie"      &&<Saisie currentUser={currentUser} sessions={sessions} times={times} setTimes={setTimes} accounts={accounts} setSessions={setSessions}/>}
        {tab==="historique"  &&<Historique currentUser={currentUser} times={times} sessions={sessions}/>}
        {tab==="journal"     &&<Journal currentUser={currentUser} journals={journals} setJournals={setJournals} times={times}/>}
        {tab==="preparation" &&<Preparation currentUser={currentUser} sports={sports} setSports={setSports} sessions={sessions}/>}
        {tab==="admin"       &&role==="admin"&&<AdminPanel accounts={accounts} setAccounts={setAccounts} sessions={sessions} setSessions={setSessions} times={times} setTimes={setTimes}/>}
        {tab==="parametres"  &&<Parametres currentUser={currentUser} setCurrentUser={setCurrentUser} accounts={accounts} setAccounts={setAccounts}/>}
      </div>
    </div>
  );
}

// ── LOGIN ─────────────────────────────────────────────────────────────────────
function Login({accounts,onLogin,onRegister}){
  const [mode,setMode]=useState("login");
  const [name,setName]=useState(""); const [code,setCode]=useState("");
  const [role,setRole]=useState("normal"); const [avatar,setAvatar]=useState("🏎️");
  const [err,setErr]=useState(""); const [saving,setSaving]=useState(false);
  const avatars=["🏎️","🏁","⭐","🔥","⚡","🎯","🦊","🐺","🐆","🎪"];
  const doLogin=()=>{
    console.log("Comptes chargés:", accounts);
    console.log("Recherche:", name, code);
    const acc=accounts.find(a=>a.name.toLowerCase()===name.toLowerCase()&&String(a.code)===String(code));
    console.log("Trouvé:", acc);
    if(!acc){setErr("Nom ou code incorrect.");return;} onLogin(acc);
  };
  const doRegister=async()=>{
    if(!name.trim()||!/^\d{4}$/.test(code)){setErr("Nom requis et code 4 chiffres.");return;}
    if(accounts.find(a=>a.name.toLowerCase()===name.toLowerCase())){setErr("Pseudo déjà pris.");return;}
    setSaving(true);
    const a={id:"u"+Date.now(),name:name.trim(),code,role,avatar};
    await onRegister(a); onLogin(a);
  };
  return(
    <div style={{minHeight:"100vh",background:"#0f172a",display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{background:"#1e293b",borderRadius:16,padding:32,width:"100%",maxWidth:380,border:"2px solid #f59e0b"}}>
        <div style={{textAlign:"center",marginBottom:24}}>
          <div style={{fontSize:48}}>🏁</div>
          <h1 style={{color:"#f59e0b",margin:"8px 0 4px",fontSize:24}}>Karting Tracker</h1>
          <p style={{color:"#64748b",fontSize:13,margin:0}}>Suis tes performances sur la piste</p>
        </div>
        <div style={{display:"flex",gap:8,marginBottom:20}}>
          {[["login","Connexion"],["register","Créer un compte"]].map(([m,l])=>(
            <button key={m} onClick={()=>{setMode(m);setErr("");}} style={{flex:1,padding:"8px 0",borderRadius:8,border:"none",cursor:"pointer",background:mode===m?"#f59e0b":"#334155",color:mode===m?"#0f172a":"#94a3b8",fontWeight:600}}>{l}</button>
          ))}
        </div>
        {mode==="register"&&<>
          <label style={lbl}>Avatar</label>
          <div style={{display:"flex",gap:6,marginBottom:14,flexWrap:"wrap"}}>
            {avatars.map(a=><button key={a} onClick={()=>setAvatar(a)} style={{fontSize:22,background:avatar===a?"#f59e0b22":"transparent",border:avatar===a?"2px solid #f59e0b":"2px solid #334155",borderRadius:8,padding:4,cursor:"pointer"}}>{a}</button>)}
          </div>
        </>}
        <label style={lbl}>Pseudo</label>
        <input value={name} onChange={e=>setName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&doLogin()} placeholder="Ton pseudo" style={inp}/>
        <label style={lbl}>Code à 4 chiffres</label>
        <input value={code} onChange={e=>setCode(e.target.value.slice(0,4))} onKeyDown={e=>e.key==="Enter"&&doLogin()} placeholder="••••" type="password" maxLength={4} style={inp}/>
        {mode==="register"&&<>
          <label style={lbl}>Statut</label>
          <select value={role} onChange={e=>setRole(e.target.value)} style={inp}>
            <option value="normal">Normal</option>
            <option value="restreint">Restreint</option>
          </select>
          <p style={{fontSize:11,color:"#f59e0b",marginBottom:12}}>💡 Supérieur et Admin attribués par l'administrateur.</p>
        </>}
        {err&&<p style={{color:"#ef4444",fontSize:13,marginBottom:10}}>{err}</p>}
        <button onClick={mode==="login"?doLogin:doRegister} disabled={saving} style={{width:"100%",padding:"12px 0",background:"#f59e0b",color:"#0f172a",border:"none",borderRadius:10,fontWeight:700,fontSize:16,cursor:"pointer"}}>
          {saving?"...":mode==="login"?"Se connecter":"Créer mon compte"}
        </button>
      </div>
    </div>
  );
}

// ── DASHBOARD ─────────────────────────────────────────────────────────────────
function Dashboard({currentUser,accounts,times,sessions}){
  const [filter,setFilter]=useState("all");
  const [search,setSearch]=useState("");
  const [viewUser,setViewUser]=useState(null);
  const canSeeRestreint=currentUser.role==="admin"||currentUser.role==="superieur";
  const filterT=ts=>{
    if(filter==="last"){const dates=[...new Set(ts.map(t=>t.date))].sort().reverse();return ts.filter(t=>t.date===dates[0]);}
    if(filter==="month"){const c=new Date();c.setMonth(c.getMonth()-1);return ts.filter(t=>new Date(t.date)>=c);}
    return ts;
  };
  const myT=filterT(times.filter(t=>t.user_id===currentUser.id));
  const myBest=myT.length?Math.min(...myT.map(t=>t.ms)):null;
  const myAvg=myT.length?Math.round(myT.reduce((a,t)=>a+t.ms,0)/myT.length):null;
  const myDays=[...new Set(myT.map(t=>t.date))].length;
  const pts=computePoints(times,sessions,accounts);
  const groupAccs=accounts.filter(a=>a.role!=="admin");
  const ranked=groupAccs.map(a=>{const ut=filterT(times.filter(t=>t.user_id===a.id));return{...a,pts:pts[a.id]||0,best:ut.length?Math.min(...ut.map(t=>t.ms)):null};}).sort((a,b)=>b.pts-a.pts||(a.best&&b.best?a.best-b.best:0));
  const searched=accounts.filter(a=>a.role!=="admin"&&(canSeeRestreint||a.role!=="restreint")&&a.name.toLowerCase().includes(search.toLowerCase()));
  return(
    <div>
      <h2 style={h2}>📊 Dashboard</h2>
      <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}>
        {[["all","Tout"],["month","Ce mois"],["last","Dernière journée"]].map(([v,l])=>(
          <button key={v} onClick={()=>setFilter(v)} style={{...btnSm,background:filter===v?"#f59e0b":"#334155",color:filter===v?"#0f172a":"#94a3b8"}}>{l}</button>
        ))}
      </div>
      <div style={card}>
        <div style={cardTitle}>🏎️ Mes statistiques</div>
        <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
          <StatBox label="Meilleur temps" value={fmtTime(myBest)} color="#f59e0b"/>
          <StatBox label="Temps moyen" value={fmtTime(myAvg)} color="#3b82f6"/>
          <StatBox label="Tours" value={myT.length} color="#10b981"/>
          <StatBox label="Journées" value={myDays} color="#8b5cf6"/>
          <StatBox label="Points saison" value={pts[currentUser.id]||0} color="#f59e0b"/>
        </div>
        {myT.length>1&&<MiniChart times={myT}/>}
      </div>
      <div style={card}>
        <div style={cardTitle}>🏆 Classement — Points saison</div>
        <div style={{fontSize:11,color:"#64748b",marginBottom:10}}>🟡 1pt chrono · 🟢 +1pt &lt;35s · ⭐ +2pts Pole (séances clôturées)</div>
        {ranked.map((a,i)=>(
          <div key={a.id} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 0",borderBottom:"1px solid #1e293b"}}>
            <span style={{fontSize:18,minWidth:28,textAlign:"center"}}>{i===0?"🥇":i===1?"🥈":i===2?"🥉":`${i+1}.`}</span>
            <span style={{fontSize:20}}>{a.role==="restreint"&&!canSeeRestreint?"🕵️":a.avatar}</span>
            <span style={{flex:1,fontWeight:600}}>{a.role==="restreint"&&!canSeeRestreint?"Anonyme":a.name}</span>
            <span style={{fontFamily:"monospace",color:"#f59e0b",fontSize:13}}>{fmtTime(a.best)}</span>
            <span style={{background:"#f59e0b22",color:"#f59e0b",borderRadius:99,padding:"3px 10px",fontWeight:700}}>{a.pts} pts</span>
          </div>
        ))}
      </div>
      <div style={card}>
        <div style={cardTitle}>🔍 Rechercher un pilote</div>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Chercher..." style={{...inp,marginBottom:12}}/>
        <div style={{display:"flex",flexWrap:"wrap",gap:10}}>
          {searched.map(a=>{
            const ut=filterT(times.filter(t=>t.user_id===a.id));
            const best=ut.length?Math.min(...ut.map(t=>t.ms)):null;
            return <div key={a.id} onClick={()=>setViewUser(viewUser?.id===a.id?null:a)} style={{background:"#0f172a",borderRadius:10,padding:"10px 14px",cursor:"pointer",border:viewUser?.id===a.id?"2px solid #f59e0b":"2px solid #1e293b",minWidth:130}}>
              <div style={{fontSize:26,textAlign:"center"}}>{a.avatar}</div>
              <div style={{fontWeight:600,textAlign:"center",fontSize:14}}>{a.name}</div>
              <div style={{fontSize:11,color:ROLE_COLOR[a.role],textAlign:"center"}}>{ROLE_LABEL[a.role]}</div>
              <div style={{fontSize:13,color:"#f59e0b",textAlign:"center",marginTop:4,fontFamily:"monospace"}}>{fmtTime(best)}</div>
              <div style={{fontSize:12,color:"#f59e0b",textAlign:"center"}}>{pts[a.id]||0} pts</div>
            </div>;
          })}
        </div>
        {viewUser&&<UserProfile user={viewUser} times={filterT(times.filter(t=>t.user_id===viewUser.id))} pts={pts[viewUser.id]||0}/>}
      </div>
    </div>
  );
}
function StatBox({label,value,color}){return <div style={{background:"#0f172a",borderRadius:10,padding:"10px 14px",flex:1,minWidth:110,borderLeft:`3px solid ${color}`}}><div style={{fontSize:11,color:"#64748b",marginBottom:3}}>{label}</div><div style={{fontSize:18,fontWeight:700,color,fontFamily:"monospace"}}>{value}</div></div>;}
function MiniChart({times}){
  const byDate={};[...times].sort((a,b)=>new Date(a.date)-new Date(b.date)).forEach(t=>{if(!byDate[t.date]||t.ms<byDate[t.date])byDate[t.date]=t.ms;});
  const pts=Object.entries(byDate).slice(-10);if(pts.length<2)return null;
  const vals=pts.map(p=>p[1]),mn=Math.min(...vals),mx=Math.max(...vals);
  const W=300,H=60,x=i=>(i/(pts.length-1))*W,y=v=>H-((v-mn)/(mx-mn||1))*H;
  return <div style={{marginTop:12}}><div style={{fontSize:12,color:"#64748b",marginBottom:4}}>Progression</div><svg viewBox={`0 0 ${W} ${H}`} style={{width:"100%",height:60}}><path d={pts.map((p,i)=>`${i===0?"M":"L"}${x(i)},${y(p[1])}`).join(" ")} fill="none" stroke="#f59e0b" strokeWidth={2}/>{pts.map((p,i)=><circle key={i} cx={x(i)} cy={y(p[1])} r={3} fill="#f59e0b"/>)}</svg></div>;
}
function UserProfile({user,times,pts}){
  const best=times.length?Math.min(...times.map(t=>t.ms)):null;
  const avg=times.length?Math.round(times.reduce((a,t)=>a+t.ms,0)/times.length):null;
  return <div style={{marginTop:16,background:"#0f172a",borderRadius:10,padding:16}}><div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}><span style={{fontSize:36}}>{user.avatar}</span><div><div style={{fontWeight:700,fontSize:16}}>{user.name}</div><div style={{fontSize:12,color:ROLE_COLOR[user.role]}}>{ROLE_LABEL[user.role]}</div></div></div><div style={{display:"flex",gap:10,flexWrap:"wrap"}}><StatBox label="Meilleur" value={fmtTime(best)} color="#f59e0b"/><StatBox label="Moyenne" value={fmtTime(avg)} color="#3b82f6"/><StatBox label="Tours" value={times.length} color="#10b981"/><StatBox label="Points" value={pts} color="#f59e0b"/></div></div>;
}

// ── SAISIE ────────────────────────────────────────────────────────────────────
function Saisie({currentUser,sessions,times,setTimes,accounts,setSessions}){
  const [mode,setMode]=useState("manual");
  const [kart,setKart]=useState(""); const [date,setDate]=useState(today());
  const [sessionId,setSessionId]=useState("libre"); const [customSession,setCustomSession]=useState("");
  const [theme,setTheme]=useState(""); const [temp,setTemp]=useState("chaud");
  const [timeStr,setTimeStr]=useState(""); const [note,setNote]=useState("");
  const [msg,setMsg]=useState(""); const [aiLoading,setAiLoading]=useState(false);
  const [photoResult,setPhotoResult]=useState(""); const [validated,setValidated]=useState(false);
  const fileRef=useRef();
  const canAddForOthers=currentUser.role==="superieur"||currentUser.role==="admin";
  const [targetUser,setTargetUser]=useState(currentUser.id);
  const sessIsClosed=sessionId!=="libre"&&!!sessions.find(s=>s.id===sessionId)?.closed;
  const alreadyValidated=sessionId!=="libre"&&currentUser.role!=="admin"&&times.some(t=>t.session_id===sessionId&&t.user_id===currentUser.id&&t.validated);

  const handlePhoto=async e=>{
    const file=e.target.files[0];if(!file)return;
    setAiLoading(true);setMsg("");
    try{
      const base64=await new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result.split(",")[1]);r.onerror=rej;r.readAsDataURL(file);});
      const resp=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:200,messages:[{role:"user",content:[{type:"image",source:{type:"base64",media_type:file.type,data:base64}},{type:"text",text:"Lis le ou les temps de karting visibles sur cette image (mm:ss.mmm ou ss.mmm). Réponds uniquement avec les temps séparés par des virgules. Si aucun, réponds 'aucun'."}]}]})});
      const data=await resp.json();
      const txt=data.content?.[0]?.text||"aucun";
      setPhotoResult(txt);if(txt!=="aucun")setTimeStr(txt.split(",")[0].trim());
    }catch{setMsg("Erreur analyse photo.");}
    setAiLoading(false);
  };

  const handleSubmit=async()=>{
    const ms=parseTime(timeStr);
    if(!ms){setMsg("Format invalide. Ex: 1:23.456 ou 45.123");return;}
    if(!kart.trim()){setMsg("Numéro de kart requis.");return;}
    const sess=sessions.find(s=>s.id===sessionId);
    const entry={id:"t"+Date.now(),user_id:targetUser,kart:kart.trim(),date,session_id:sessionId==="libre"?null:sessionId,session_name:sess?sess.name:(customSession||"Séance libre"),theme:theme||sess?.theme||"",temp,ms,time_str:timeStr,note,added_by:currentUser.id,validated:false};
    const {ok}=await api.post("times",entry);
    if(!ok){setMsg("Erreur lors de l'enregistrement.");return;}
    setTimes(p=>[...p,entry]);
    setMsg("✅ Temps enregistré !"); setTimeStr(""); setNote(""); setPhotoResult("");
  };

  const handleValidate=async()=>{
    if(sessionId==="libre"){setMsg("Valide uniquement pour une séance nommée.");return;}
    await api.patch("times",{validated:true},"session_id",sessionId);
    const updated=times.map(t=>t.session_id===sessionId&&t.user_id===currentUser.id?{...t,validated:true}:t);
    setTimes(updated); setValidated(true);
    const concerned=accounts.filter(a=>a.role!=="admin"&&updated.some(t=>t.session_id===sessionId&&t.user_id===a.id));
    const allDone=concerned.length>0&&concerned.every(a=>updated.some(t=>t.session_id===sessionId&&t.user_id===a.id&&t.validated));
    if(allDone){
      await api.patch("sessions",{closed:true},"id",sessionId);
      setSessions(p=>p.map(s=>s.id===sessionId?{...s,closed:true}:s));
      setMsg("✅ Validé ! 🏆 Séance clôturée — points calculés !");
    } else {
      const rem=concerned.filter(a=>!updated.some(t=>t.session_id===sessionId&&t.user_id===a.id&&t.validated)).length;
      setMsg(`✅ Validé ! En attente de ${rem} pilote(s).`);
    }
  };

  const myTimesForSess=times.filter(t=>t.session_id===sessionId&&t.user_id===currentUser.id);
  return(
    <div>
      <h2 style={h2}>⏱️ Saisie des temps</h2>
      <div style={{display:"flex",gap:8,marginBottom:16}}>
        {[["manual","✏️ Manuel"],["photo","📷 Photo"]].map(([v,l])=>(
          <button key={v} onClick={()=>setMode(v)} style={{...btnSm,background:mode===v?"#f59e0b":"#334155",color:mode===v?"#0f172a":"#94a3b8"}}>{l}</button>
        ))}
      </div>
      <div style={card}>
        {canAddForOthers&&<><label style={lbl}>Pilote</label><select value={targetUser} onChange={e=>setTargetUser(e.target.value)} style={inp}>{accounts.filter(a=>a.role!=="admin").map(u=><option key={u.id} value={u.id}>{u.avatar} {u.name}</option>)}</select></>}
        <label style={lbl}>Séance</label>
        <select value={sessionId} onChange={e=>setSessionId(e.target.value)} style={inp}>
          <option value="libre">— Séance libre —</option>
          {sessions.map(s=><option key={s.id} value={s.id}>{s.closed?"🔒 ":""}{s.name} ({s.date})</option>)}
        </select>
        {sessionId==="libre"&&<><label style={lbl}>Nom libre (optionnel)</label><input value={customSession} onChange={e=>setCustomSession(e.target.value)} placeholder="Ex: Essai perso" style={inp}/></>}
        <DatePicker label="Date" value={date} onChange={setDate}/>
        {sessIsClosed&&currentUser.role!=="admin"?(
          <div style={{background:"#0f172a",borderRadius:10,padding:14,color:"#64748b",fontSize:13}}>🔒 Cette séance est clôturée.</div>
        ):(<>
          <label style={lbl}>Numéro de kart</label>
          <input value={kart} onChange={e=>setKart(e.target.value)} placeholder="Ex: 7" style={inp}/>
          <label style={lbl}>Thème</label>
          <input value={theme} onChange={e=>setTheme(e.target.value)} placeholder={sessions.find(s=>s.id===sessionId)?.theme||"Ex: Régularité..."} style={inp}/>
          <label style={lbl}>Température</label>
          <select value={temp} onChange={e=>setTemp(e.target.value)} style={inp}><option value="chaud">🔥 Chaud</option><option value="froid">❄️ Froid</option></select>
          {mode==="photo"&&<>
            <label style={lbl}>📷 Photo du chrono</label>
            <div style={{border:"2px dashed #334155",borderRadius:10,padding:20,textAlign:"center",marginBottom:12,cursor:"pointer"}} onClick={()=>fileRef.current.click()}>
              <div style={{fontSize:32,marginBottom:6}}>📷</div>
              <div style={{color:"#64748b",fontSize:13}}>Clique pour choisir une photo</div>
              <input ref={fileRef} type="file" accept="image/*" style={{display:"none"}} onChange={handlePhoto}/>
            </div>
            {aiLoading&&<div style={{color:"#f59e0b",marginBottom:8}}>⏳ Analyse en cours...</div>}
            {photoResult&&<div style={{background:"#0f172a",borderRadius:8,padding:10,marginBottom:8,fontSize:13}}>Détecté : <span style={{color:"#f59e0b",fontFamily:"monospace"}}>{photoResult}</span></div>}
          </>}
          <label style={lbl}>Temps (mm:ss.mmm ou ss.mmm)</label>
          <input value={timeStr} onChange={e=>setTimeStr(e.target.value)} placeholder="1:23.456 ou 45.123" style={inp}/>
          <label style={lbl}>Note (optionnel)</label>
          <textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="Remarque..." style={{...inp,height:60,resize:"vertical"}}/>
          {msg&&<div style={{color:msg.startsWith("✅")?"#10b981":"#ef4444",marginBottom:8}}>{msg}</div>}
          <button onClick={handleSubmit} style={btnPrimary}>Enregistrer le temps</button>
          {sessionId!=="libre"&&myTimesForSess.length>0&&!alreadyValidated&&!validated&&(
            <div style={{marginTop:16,background:"#0f172a",borderRadius:10,padding:14,border:"1px solid #f59e0b"}}>
              <div style={{fontWeight:600,marginBottom:6}}>✅ Valider ma saisie</div>
              <div style={{fontSize:13,color:"#94a3b8",marginBottom:10}}>{myTimesForSess.length} chrono(s) enregistré(s).</div>
              <button onClick={handleValidate} style={{...btnSm,background:"#10b981",color:"#fff"}}>Valider</button>
            </div>
          )}
          {(alreadyValidated||validated)&&sessionId!=="libre"&&<div style={{marginTop:12,color:"#10b981",fontSize:13}}>✅ Saisie déjà validée pour cette séance.</div>}
        </>)}
      </div>
    </div>
  );
}

// ── HISTORIQUE ────────────────────────────────────────────────────────────────
function Historique({currentUser,times,sessions}){
  const [selDate,setSelDate]=useState("");
  const [selSession,setSelSession]=useState("");
  const myTimes=times.filter(t=>t.user_id===currentUser.id);
  const allDates=[...new Set(myTimes.map(t=>t.date))].sort().reverse();
  const isSat=d=>new Date(d).getDay()===6;
  const displayed=myTimes.filter(t=>selSession?t.session_id===selSession:selDate?t.date===selDate:false).sort((a,b)=>a.ms-b.ms);
  const best=displayed.length?Math.min(...displayed.map(t=>t.ms)):null;
  const avg=displayed.length?Math.round(displayed.reduce((a,t)=>a+t.ms,0)/displayed.length):null;
  const nextSession=sessions.find(s=>s.date>=today()&&!s.closed);
  return(
    <div>
      <h2 style={h2}>📅 Historique</h2>
      {nextSession&&<div style={{...card,borderLeft:"3px solid #f59e0b"}}><div style={{fontSize:12,color:"#64748b"}}>Prochaine séance</div><div style={{fontWeight:700,color:"#f59e0b"}}>{nextSession.name}</div><div style={{fontSize:12,color:"#94a3b8"}}>{nextSession.date}{nextSession.theme&&` — ${nextSession.theme}`}</div></div>}
      <div style={card}>
        <label style={lbl}>Séance nommée</label>
        <select value={selSession} onChange={e=>{setSelSession(e.target.value);setSelDate("");}} style={inp}>
          <option value="">— Par date —</option>
          {sessions.map(s=><option key={s.id} value={s.id}>{s.closed?"🔒 ":""}{s.name} ({s.date})</option>)}
        </select>
        {!selSession&&<><label style={lbl}>Date</label><select value={selDate} onChange={e=>setSelDate(e.target.value)} style={inp}><option value="">— Choisir —</option>{allDates.map(d=><option key={d} value={d}>{isSat(d)?"⭐ ":""}{d}</option>)}</select></>}
      </div>
      {displayed.length>0&&<div style={card}>
        <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:14}}><StatBox label="Meilleur" value={fmtTime(best)} color="#f59e0b"/><StatBox label="Moyenne" value={fmtTime(avg)} color="#3b82f6"/><StatBox label="Tours" value={displayed.length} color="#10b981"/></div>
        {displayed[0]?.temp&&<div style={{fontSize:13,color:"#94a3b8",marginBottom:8}}>{displayed[0].temp==="chaud"?"🔥 Chaud":"❄️ Froid"}{displayed[0].theme&&` — ${displayed[0].theme}`}</div>}
        {displayed.map((t,i)=>(
          <div key={t.id} style={{background:"#0f172a",borderRadius:8,padding:"10px 14px",display:"flex",alignItems:"center",gap:10,marginBottom:6,border:i===0?"1px solid #f59e0b":"1px solid #1e293b"}}>
            <span style={{color:"#64748b",minWidth:22}}>#{i+1}</span>
            <span style={{fontFamily:"monospace",fontSize:17,color:i===0?"#f59e0b":"#f1f5f9",fontWeight:700}}>{t.time_str}</span>
            <span style={{fontSize:12,color:"#64748b"}}>Kart #{t.kart}</span>
            {t.note&&<span style={{fontSize:12,color:"#94a3b8",flex:1}}>— {t.note}</span>}
            {i===0&&<span style={{fontSize:11,background:"#f59e0b22",color:"#f59e0b",borderRadius:99,padding:"2px 8px"}}>Meilleur</span>}
            {t.validated&&<span style={{fontSize:11,background:"#10b98122",color:"#10b981",borderRadius:99,padding:"2px 8px"}}>✅</span>}
          </div>
        ))}
      </div>}
    </div>
  );
}

// ── JOURNAL ───────────────────────────────────────────────────────────────────
function Journal({currentUser,journals,setJournals,times}){
  const [selDate,setSelDate]=useState(today());
  const [form,setForm]=useState({global:"",positif:"",ameliorer:"",objectifs:""});
  const [saved,setSaved]=useState(false);
  const myTimes=times.filter(t=>t.user_id===currentUser.id&&t.date===selDate);
  const existing=journals.find(j=>j.user_id===currentUser.id&&j.date===selDate);
  useEffect(()=>{
    if(existing)setForm({global:existing.global||"",positif:existing.positif||"",ameliorer:existing.ameliorer||"",objectifs:existing.objectifs||""});
    else setForm({global:"",positif:"",ameliorer:"",objectifs:""});
    setSaved(false);
  },[selDate,existing?.id]);
  const handleSave=async()=>{
    const e={id:existing?.id||"j"+Date.now(),user_id:currentUser.id,date:selDate,...form};
    if(existing)await api.patch("journals",form,"id",existing.id);
    else await api.post("journals",e);
    setJournals(p=>existing?p.map(j=>j.id===existing.id?e:j):[...p,e]);
    setSaved(true);
  };
  const myDates=[...new Set(times.filter(t=>t.user_id===currentUser.id).map(t=>t.date))].sort().reverse();
  return(
    <div>
      <h2 style={h2}>📓 Journal du pilote</h2>
      <div style={{...card,borderLeft:"3px solid #8b5cf6",padding:"10px 16px"}}><div style={{fontSize:12,color:"#64748b"}}>🔒 Privé — visible uniquement par toi.</div></div>
      <div style={card}>
        <label style={lbl}>Date</label>
        <select value={selDate} onChange={e=>setSelDate(e.target.value)} style={inp}>
          {myDates.length?myDates.map(d=><option key={d} value={d}>{d}</option>):<option value={today()}>{today()}</option>}
        </select>
        {myTimes.length>0&&<div style={{fontSize:13,color:"#94a3b8",marginBottom:12}}>Meilleur : <span style={{color:"#f59e0b",fontFamily:"monospace"}}>{fmtTime(Math.min(...myTimes.map(t=>t.ms)))}</span> — {myTimes.length} tours</div>}
        {[["global","🌟 Comment s'est passée la séance ?","Décris ta séance..."],["positif","✅ Points positifs","Ce qui a bien marché..."],["ameliorer","🔧 À améliorer","Ce que je dois retravailler..."],["objectifs","🎯 Objectifs prochaine fois","Mes objectifs..."]].map(([k,l,p])=>(
          <div key={k}><label style={lbl}>{l}</label><textarea value={form[k]} onChange={e=>setForm(x=>({...x,[k]:e.target.value}))} placeholder={p} style={{...inp,height:70,resize:"vertical"}}/></div>
        ))}
        <button onClick={handleSave} style={btnPrimary}>{existing?"Mettre à jour":"Enregistrer"}</button>
        {saved&&<span style={{color:"#10b981",marginLeft:12}}>✅ Sauvegardé !</span>}
      </div>
      <div style={card}>
        <div style={cardTitle}>Entrées précédentes</div>
        {journals.filter(j=>j.user_id===currentUser.id).sort((a,b)=>b.date.localeCompare(a.date)).slice(0,5).map(j=>(
          <div key={j.id} onClick={()=>setSelDate(j.date)} style={{background:"#0f172a",borderRadius:8,padding:12,marginBottom:8,cursor:"pointer"}}>
            <div style={{fontWeight:600,color:"#f59e0b"}}>{j.date}</div>
            <div style={{fontSize:13,color:"#94a3b8",marginTop:3}}>{j.global?.slice(0,80)}{j.global?.length>80?"...":""}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── PREPARATION ───────────────────────────────────────────────────────────────
function Preparation({currentUser,sports,setSports,sessions}){
  const [tab,setTab]=useState("mentale");
  const [selSession,setSelSession]=useState(sessions[0]?.id||"");
  const [step,setStep]=useState(0); const [answers,setAnswers]=useState({}); const [saved,setSaved]=useState(false);
  const [sportForm,setSportForm]=useState({type:"",duree:"",date:today(),note:""}); const [sportMsg,setSportMsg]=useState("");
  const steps=[
    {id:"objectif",label:"🎯 Objectif",q:"Quel est ton objectif principal ?",ph:"Améliorer ma régularité..."},
    {id:"visualisation",label:"🧠 Visualisation",q:"Visualise un tour parfait. Décris ce que tu as ressenti.",ph:"J'ai imaginé une entrée précise..."},
    {id:"confiance",label:"💪 Confiance",q:"Sur 10, ton niveau de confiance ? Pourquoi ?",ph:"8/10 car..."},
    {id:"focus",label:"🔍 Focus",q:"Sur quoi te concentrer en priorité ?",ph:"Ma trajectoire en chicane..."},
    {id:"mot_cle",label:"⚡ Mot-clé",q:"Un mot-clé qui résume ton état d'esprit.",ph:"Régularité / Attaque..."},
  ];
  const handleSaveMental=async()=>{
    const e={id:"p"+Date.now(),user_id:currentUser.id,session_id:selSession,date:today(),answers:JSON.stringify(answers),type:"mentale"};
    await api.post("preps",e); setSaved(true);
  };
  const handleSaveSport=async()=>{
    if(!sportForm.type){setSportMsg("Type requis.");return;}
    const e={id:"sp"+Date.now(),user_id:currentUser.id,...sportForm};
    await api.post("sports",e); setSports(p=>[...p,e]); setSportMsg("✅ Activité enregistrée !"); setSportForm({type:"",duree:"",date:today(),note:""});
  };
  return(
    <div>
      <h2 style={h2}>💪 Préparation</h2>
      <div style={{display:"flex",gap:8,marginBottom:16}}>
        {[["mentale","🧠 Mentale"],["sport","🏃 Sport"]].map(([v,l])=>(
          <button key={v} onClick={()=>setTab(v)} style={{...btnSm,background:tab===v?"#f59e0b":"#334155",color:tab===v?"#0f172a":"#94a3b8"}}>{l}</button>
        ))}
      </div>
      {tab==="mentale"&&<div style={card}>
        <label style={lbl}>Séance ciblée</label>
        <select value={selSession} onChange={e=>setSelSession(e.target.value)} style={inp}>{sessions.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}<option value="libre">Séance libre</option></select>
        <div style={{display:"flex",gap:6,marginBottom:16,flexWrap:"wrap"}}>
          {steps.map((s,i)=><div key={s.id} onClick={()=>setStep(i)} style={{flex:1,minWidth:50,padding:"6px 8px",borderRadius:8,cursor:"pointer",textAlign:"center",fontSize:12,background:i===step?"#f59e0b":answers[s.id]?"#10b98133":"#0f172a",color:i===step?"#0f172a":answers[s.id]?"#10b981":"#64748b",border:i===step?"none":answers[s.id]?"1px solid #10b981":"1px solid #1e293b"}}>{s.label}</div>)}
        </div>
        <div style={{background:"#0f172a",borderRadius:10,padding:18,marginBottom:14}}>
          <div style={{fontWeight:600,marginBottom:10,fontSize:15}}>{steps[step].q}</div>
          <textarea value={answers[steps[step].id]||""} onChange={e=>setAnswers(p=>({...p,[steps[step].id]:e.target.value}))} placeholder={steps[step].ph} style={{...inp,height:90,resize:"vertical"}}/>
        </div>
        <div style={{display:"flex",gap:8}}>
          {step>0&&<button onClick={()=>setStep(p=>p-1)} style={{...btnSm,background:"#334155",color:"#94a3b8"}}>← Précédent</button>}
          {step<steps.length-1&&<button onClick={()=>setStep(p=>p+1)} style={{...btnSm,background:"#3b82f6",color:"#fff"}}>Suivant →</button>}
          {step===steps.length-1&&<button onClick={handleSaveMental} style={{...btnSm,background:"#10b981",color:"#fff"}}>✅ Sauvegarder</button>}
        </div>
        {saved&&<div style={{color:"#10b981",marginTop:10}}>✅ Préparation enregistrée !</div>}
      </div>}
      {tab==="sport"&&<>
        <div style={card}>
          <div style={cardTitle}>Ajouter une activité</div>
          <label style={lbl}>Type</label>
          <select value={sportForm.type} onChange={e=>setSportForm(p=>({...p,type:e.target.value}))} style={inp}><option value="">— Choisir —</option>{["Course à pied","Vélo","Natation","Musculation","Football","Basketball","Tennis","Autre"].map(t=><option key={t}>{t}</option>)}</select>
          <label style={lbl}>Durée (min)</label>
          <input value={sportForm.duree} onChange={e=>setSportForm(p=>({...p,duree:e.target.value}))} type="number" placeholder="45" style={inp}/>
          <DatePicker label="Date" value={sportForm.date} onChange={v=>setSportForm(p=>({...p,date:v}))}/>
          <label style={lbl}>Note</label>
          <textarea value={sportForm.note} onChange={e=>setSportForm(p=>({...p,note:e.target.value}))} placeholder="Comment tu t'es senti..." style={{...inp,height:60,resize:"vertical"}}/>
          {sportMsg&&<div style={{color:sportMsg.startsWith("✅")?"#10b981":"#ef4444",marginBottom:8}}>{sportMsg}</div>}
          <button onClick={handleSaveSport} style={btnPrimary}>Ajouter</button>
        </div>
        <div style={card}>
          <div style={cardTitle}>Historique sport</div>
          {sports.filter(s=>s.user_id===currentUser.id).sort((a,b)=>b.date.localeCompare(a.date)).map(s=>(
            <div key={s.id} style={{background:"#0f172a",borderRadius:8,padding:12,marginBottom:8}}>
              <div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontWeight:600}}>{s.type}</span><span style={{color:"#64748b",fontSize:12}}>{s.date}</span></div>
              {s.duree&&<div style={{fontSize:13,color:"#94a3b8"}}>{s.duree} min</div>}
              {s.note&&<div style={{fontSize:12,color:"#64748b",marginTop:3}}>{s.note}</div>}
            </div>
          ))}
        </div>
      </>}
    </div>
  );
}

// ── ADMIN ─────────────────────────────────────────────────────────────────────
function AdminPanel({accounts,setAccounts,sessions,setSessions,times,setTimes}){
  const [tab,setTab]=useState("comptes");
  const [editAcc,setEditAcc]=useState(null);
  const [newAcc,setNewAcc]=useState({name:"",code:"",role:"normal",avatar:"🏎️"});
  const [newSess,setNewSess]=useState({name:"",date:"",theme:""});
  const [msg,setMsg]=useState("");
  const doUpdate=async()=>{await api.patch("accounts",{name:editAcc.name,code:editAcc.code,role:editAcc.role,avatar:editAcc.avatar},"id",editAcc.id);setAccounts(p=>p.map(a=>a.id===editAcc.id?editAcc:a));setEditAcc(null);setMsg("✅ Modifié !");};
  const doDelete=async id=>{await api.del("accounts","id",id);setAccounts(p=>p.filter(a=>a.id!==id));setTimes(p=>p.filter(t=>t.user_id!==id));};
  const doAddAcc=async()=>{
    if(!newAcc.name||!/^\d{4}$/.test(newAcc.code)){setMsg("Nom et code 4 chiffres requis.");return;}
    const a={...newAcc,id:"u"+Date.now()};
    await api.post("accounts",a);setAccounts(p=>[...p,a]);setNewAcc({name:"",code:"",role:"normal",avatar:"🏎️"});setMsg("✅ Compte ajouté !");
  };
  const doAddSess=async()=>{
    if(!newSess.name||!newSess.date){setMsg("Nom et date requis.");return;}
    const s={...newSess,id:"s"+Date.now(),closed:false};
    await api.post("sessions",s);setSessions(p=>[...p,s]);setNewSess({name:"",date:"",theme:""});setMsg("✅ Séance ajoutée !");
  };
  const toggleClose=async(id,closed)=>{await api.patch("sessions",{closed:!closed},"id",id);setSessions(p=>p.map(s=>s.id===id?{...s,closed:!closed}:s));};
  return(
    <div>
      <h2 style={h2}>🛡️ Panneau Admin</h2>
      <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}>
        {[["comptes","👥 Comptes"],["sessions","📅 Séances"],["temps","⏱️ Temps"]].map(([v,l])=>(
          <button key={v} onClick={()=>setTab(v)} style={{...btnSm,background:tab===v?"#f59e0b":"#334155",color:tab===v?"#0f172a":"#94a3b8"}}>{l}</button>
        ))}
      </div>
      {msg&&<div style={{color:msg.startsWith("✅")?"#10b981":"#ef4444",marginBottom:10}}>{msg}</div>}
      {tab==="comptes"&&<>
        <div style={card}>
          <div style={cardTitle}>Ajouter un compte</div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            <input value={newAcc.name} onChange={e=>setNewAcc(p=>({...p,name:e.target.value}))} placeholder="Pseudo" style={{...inp,flex:1}}/>
            <input value={newAcc.code} onChange={e=>setNewAcc(p=>({...p,code:e.target.value.slice(0,4)}))} placeholder="Code" type="password" maxLength={4} style={{...inp,width:80}}/>
            <select value={newAcc.role} onChange={e=>setNewAcc(p=>({...p,role:e.target.value}))} style={{...inp,flex:1}}><option value="normal">Normal</option><option value="superieur">Supérieur</option><option value="restreint">Restreint</option><option value="admin">Admin</option></select>
          </div>
          <button onClick={doAddAcc} style={{...btnSm,background:"#10b981",color:"#fff",marginTop:4}}>+ Ajouter</button>
        </div>
        {accounts.map(a=>(
          <div key={a.id} style={{background:"#1e293b",borderRadius:10,padding:12,marginBottom:8,display:"flex",alignItems:"center",gap:10}}>
            {editAcc?.id===a.id?(
              <div style={{flex:1,display:"flex",flexWrap:"wrap",gap:8}}>
                <input value={editAcc.name} onChange={e=>setEditAcc(p=>({...p,name:e.target.value}))} style={{...inp,flex:1}}/>
                <input value={editAcc.code} onChange={e=>setEditAcc(p=>({...p,code:e.target.value.slice(0,4)}))} type="password" maxLength={4} style={{...inp,width:90}}/>
                <select value={editAcc.role} onChange={e=>setEditAcc(p=>({...p,role:e.target.value}))} style={{...inp,flex:1}}><option value="normal">Normal</option><option value="superieur">Supérieur</option><option value="restreint">Restreint</option><option value="admin">Admin</option></select>
                <button onClick={doUpdate} style={{...btnSm,background:"#10b981",color:"#fff"}}>✅</button>
                <button onClick={()=>setEditAcc(null)} style={{...btnSm,background:"#334155",color:"#94a3b8"}}>✗</button>
              </div>
            ):(
              <><span style={{fontSize:22}}>{a.avatar}</span><span style={{flex:1,fontWeight:600}}>{a.name}</span><span style={{fontSize:11,background:ROLE_COLOR[a.role],color:"#fff",borderRadius:99,padding:"2px 8px"}}>{ROLE_LABEL[a.role]}</span><button onClick={()=>setEditAcc({...a})} style={{...btnSm,background:"#3b82f6",color:"#fff"}}>✏️</button>{a.role!=="admin"&&<button onClick={()=>doDelete(a.id)} style={{...btnSm,background:"#ef4444",color:"#fff"}}>🗑️</button>}</>
            )}
          </div>
        ))}
      </>}
      {tab==="sessions"&&<>
        <div style={card}>
          <div style={cardTitle}>Ajouter une séance</div>
          <input value={newSess.name} onChange={e=>setNewSess(p=>({...p,name:e.target.value}))} placeholder="Nom" style={inp}/>
          <DatePicker label="Date" value={newSess.date} onChange={v=>setNewSess(p=>({...p,date:v}))}/>
          <input value={newSess.theme} onChange={e=>setNewSess(p=>({...p,theme:e.target.value}))} placeholder="Thème" style={inp}/>
          <button onClick={doAddSess} style={{...btnSm,background:"#10b981",color:"#fff"}}>+ Ajouter</button>
        </div>
        {[...sessions].sort((a,b)=>b.date.localeCompare(a.date)).map(s=>(
          <div key={s.id} style={{background:"#1e293b",borderRadius:10,padding:12,marginBottom:8,display:"flex",alignItems:"center",gap:10}}>
            <div style={{flex:1}}><div style={{fontWeight:600}}>{s.name}</div><div style={{fontSize:12,color:"#64748b"}}>{s.date}{s.theme&&` — ${s.theme}`}</div></div>
            <span style={{fontSize:11,background:s.closed?"#10b98133":"#f59e0b22",color:s.closed?"#10b981":"#f59e0b",borderRadius:99,padding:"2px 8px"}}>{s.closed?"🔒":"🟡"}</span>
            <button onClick={()=>toggleClose(s.id,s.closed)} style={{...btnSm,background:s.closed?"#f59e0b":"#10b981",color:s.closed?"#0f172a":"#fff",fontSize:11}}>{s.closed?"Rouvrir":"Clôturer"}</button>
            <button onClick={async()=>{await api.del("sessions","id",s.id);setSessions(p=>p.filter(x=>x.id!==s.id));}} style={{...btnSm,background:"#ef4444",color:"#fff"}}>🗑️</button>
          </div>
        ))}
      </>}
      {tab==="temps"&&<div style={card}>
        <div style={cardTitle}>Tous les temps</div>
        {times.length===0&&<p style={{color:"#64748b"}}>Aucun temps.</p>}
        {[...times].sort((a,b)=>(b.date||"").localeCompare(a.date||"")).map(t=>{
          const u=accounts.find(a=>a.id===t.user_id);
          return <div key={t.id} style={{background:"#0f172a",borderRadius:8,padding:"9px 12px",marginBottom:6,display:"flex",alignItems:"center",gap:10}}>
            <span>{u?.avatar||"?"}</span><span style={{flex:1,fontSize:13}}>{u?.name||"?"} — {t.date}</span>
            <span style={{fontFamily:"monospace",color:"#f59e0b"}}>{t.time_str}</span>
            <span style={{fontSize:12,color:"#64748b"}}>#{t.kart}</span>
            {t.validated&&<span style={{fontSize:10,background:"#10b98122",color:"#10b981",borderRadius:99,padding:"1px 6px"}}>✅</span>}
            <button onClick={async()=>{await api.del("times","id",t.id);setTimes(p=>p.filter(x=>x.id!==t.id));}} style={{...btnSm,background:"#ef4444",color:"#fff",padding:"3px 8px"}}>🗑️</button>
          </div>;
        })}
      </div>}
    </div>
  );
}

// ── PARAMETRES ────────────────────────────────────────────────────────────────
function Parametres({currentUser,setCurrentUser,accounts,setAccounts}){
  const [code,setCode]=useState(""); const [code2,setCode2]=useState("");
  const [name,setName]=useState(currentUser.name); const [avatar,setAvatar]=useState(currentUser.avatar);
  const [msg,setMsg]=useState("");
  const avatars=["🏎️","🏁","⭐","🔥","⚡","🎯","🦊","🐺","🐆","🎪"];
  const handleSave=async()=>{
    if(code&&(!/^\d{4}$/.test(code)||code!==code2)){setMsg("Codes ne correspondent pas.");return;}
    const updates={name:name.trim()||currentUser.name,avatar,...(code?{code}:{})};
    await api.patch("accounts",updates,"id",currentUser.id);
    const updated={...currentUser,...updates};
    setAccounts(p=>p.map(a=>a.id===currentUser.id?updated:a)); setCurrentUser(updated);
    setMsg("✅ Profil mis à jour !"); setCode(""); setCode2("");
  };
  return(
    <div>
      <h2 style={h2}>⚙️ Paramètres</h2>
      <div style={card}>
        <div style={{textAlign:"center",marginBottom:20}}><div style={{fontSize:60}}>{avatar}</div><div style={{fontWeight:700,fontSize:20}}>{currentUser.name}</div><div style={{fontSize:13,color:ROLE_COLOR[currentUser.role]}}>{ROLE_LABEL[currentUser.role]}</div></div>
        <label style={lbl}>Avatar</label>
        <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap"}}>{avatars.map(a=><button key={a} onClick={()=>setAvatar(a)} style={{fontSize:26,background:avatar===a?"#f59e0b22":"transparent",border:avatar===a?"2px solid #f59e0b":"2px solid #334155",borderRadius:8,padding:5,cursor:"pointer"}}>{a}</button>)}</div>
        <label style={lbl}>Pseudo</label><input value={name} onChange={e=>setName(e.target.value)} style={inp}/>
        <label style={lbl}>Nouveau code</label><input value={code} onChange={e=>setCode(e.target.value.slice(0,4))} placeholder="Nouveau code" type="password" maxLength={4} style={inp}/>
        <label style={lbl}>Confirmer</label><input value={code2} onChange={e=>setCode2(e.target.value.slice(0,4))} placeholder="Confirmer" type="password" maxLength={4} style={inp}/>
        {msg&&<div style={{color:msg.startsWith("✅")?"#10b981":"#ef4444",marginBottom:8}}>{msg}</div>}
        <button onClick={handleSave} style={btnPrimary}>Enregistrer</button>
      </div>
      <div style={{...card,borderLeft:"3px solid #334155"}}>
        <div style={{fontWeight:600,marginBottom:8}}>ℹ️ Statuts</div>
        {Object.entries(ROLE_LABEL).map(([r,l])=>(
          <div key={r} style={{display:"flex",gap:8,marginBottom:6,alignItems:"flex-start"}}>
            <span style={{background:ROLE_COLOR[r],color:"#fff",borderRadius:99,padding:"2px 8px",fontSize:11,whiteSpace:"nowrap"}}>{l}</span>
            <span style={{fontSize:12,color:"#64748b"}}>
              {r==="admin"&&"Accès complet + gestion des comptes et séances."}
              {r==="normal"&&"Profil visible, accès à tout son compte."}
              {r==="superieur"&&"Peut voir et modifier les saisies des autres."}
              {r==="restreint"&&"Profil privé, anonyme dans les stats groupe."}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

const h2={color:"#f59e0b",marginBottom:16,marginTop:0,fontSize:20};
const card={background:"#1e293b",borderRadius:12,padding:16,marginBottom:16};
const cardTitle={fontWeight:700,marginBottom:12,color:"#f1f5f9"};
const lbl={display:"block",fontSize:12,color:"#64748b",marginBottom:4,marginTop:8};
const inp={width:"100%",boxSizing:"border-box",background:"#0f172a",border:"1px solid #334155",borderRadius:8,padding:"10px 12px",color:"#f1f5f9",fontSize:14,marginBottom:12,outline:"none"};
const btnPrimary={background:"#f59e0b",color:"#0f172a",border:"none",borderRadius:10,padding:"12px 20px",fontWeight:700,fontSize:15,cursor:"pointer",width:"100%"};
const btnSm={border:"none",borderRadius:8,padding:"7px 14px",fontWeight:600,fontSize:13,cursor:"pointer"};