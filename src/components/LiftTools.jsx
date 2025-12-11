import React, { useState, useMemo } from "react";

/* Small, self-contained LiftTools view without external chart libs */
export default function LiftTools({ logs = [], bodyStats = {}, onAddManual }) {
  const [tab, setTab] = useState("volume");
  const [manual, setManual] = useState({ date: new Date().toISOString().slice(0,10), exerciseId: "", weight:"", reps:"" });
  const exercises = [...new Set(logs.map(l=>l.exerciseId))].slice(0,30);

  function handleAdd() {
    if (!manual.exerciseId || !manual.weight || !manual.reps) return;
    const entry = { id: crypto?.randomUUID?.()||Math.random().toString(36).slice(2), date: manual.date, exerciseId: manual.exerciseId, weight: Number(manual.weight), reps: Number(manual.reps) };
    onAddManual(entry);
    setManual({ ...manual, weight:"", reps:"" });
  }

  /* Volume tracker: sets/week per exercise (simple) */
  const weekly = useMemo(()=>{
    const map = {};
    const now = new Date();
    const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()-6);
    logs.forEach(l=>{
      const d = new Date(l.date);
      if (d < weekStart) return;
      map[l.exerciseId] = (map[l.exerciseId] || 0) + 1;
    });
    return map;
  }, [logs]);

  /* small line graph for body progress: combine metrics */
  function BodyProgressGraph({data}) {
    // data: {waist:[{date,value}], hips:[], ...}
    const seriesKeys = Object.keys(data);
    const allPoints = [].concat(...seriesKeys.map(k=>data[k]||[])).map(p=> ({d:p.date,v:p.value}) );
    if (!allPoints.length) return <div className="empty-text">Inga kroppsmått att visa</div>;
    const sortedDates = Array.from(new Set(allPoints.map(p=>p.d))).sort();
    const values = allPoints.map(p=>p.v);
    const min = Math.min(...values), max = Math.max(...values);
    const W = 700, H = 160;
    const scaleX = (i) => (i/(sortedDates.length-1))*W || 0;
    const scaleY = (v) => H - ((v-min)/(max-min||1))*H;
    return (
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{maxWidth:"100%"}}>
        <rect x="0" y="0" width={W} height={H} fill="none" />
        {seriesKeys.map((k,si)=>{
          const points = (data[k]||[]).slice().sort((a,b)=>a.date.localeCompare(b.date)).map(p=>{
            const x = scaleX(sortedDates.indexOf(p.date)), y = scaleY(p.value);
            return `${x},${y}`;
          }).join(" ");
          const colors = ["#FFB4D6","#FFD6A5","#C7F9D6","#D5C1FF","#9EE6FF","#FFC6F9"];
          return <polyline key={k} points={points} fill="none" stroke={colors[si%colors.length]} strokeWidth="2" />;
        })}
      </svg>
    );
  }

  return (
    <div>
      <div className="tabs" style={{marginBottom:12}}>
        <button className={`tab ${tab==='volume'?'active':''}`} onClick={()=>setTab('volume')}>Volume</button>
        <button className={`tab ${tab==='1rm'?'active':''}`} onClick={()=>setTab('1rm')}>1RM</button>
        <button className={`tab ${tab==='graphs'?'active':''}`} onClick={()=>setTab('graphs')}>Graphs</button>
      </div>

      {tab==='volume' && (
        <div className="card">
          <h3 style={{marginTop:0}}>Volume Tracker (sets - senaste 7 dagarna)</h3>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))",gap:8}}>
            {Object.entries(weekly).length===0 && <div className="empty-text">Inga set nyligen</div>}
            {Object.entries(weekly).map(([ex,c])=>(
              <div key={ex} className="card small" style={{padding:10}}>
                <div style={{fontWeight:700}}>{ex}</div>
                <div className="small">{c} set</div>
              </div>
            ))}
          </div>

          <div style={{marginTop:12}}>
            <h4 style={{margin:0}}>Lägg till tidigare lyft</h4>
            <div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:8}}>
              <input placeholder="Övning id (ex: bench)" value={manual.exerciseId} onChange={e=>setManual({...manual,exerciseId:e.target.value})} />
              <input type="number" placeholder="Vikt kg" value={manual.weight} onChange={e=>setManual({...manual,weight:e.target.value})} />
              <input type="number" placeholder="Reps" value={manual.reps} onChange={e=>setManual({...manual,reps:e.target.value})} />
              <input type="date" value={manual.date} onChange={e=>setManual({...manual,date:e.target.value})} />
              <button className="btn" onClick={handleAdd}>Spara</button>
            </div>
          </div>
        </div>
      )}

      {tab==='1rm' && (
        <div className="card">
          <h3 style={{marginTop:0}}>1RM-kalkylator (Epley)</h3>
          <OneRMCalculator />
        </div>
      )}

      {tab==='graphs' && (
        <div className="card">
          <h3 style={{marginTop:0}}>Body Progress — alla mått</h3>
          <BodyProgressGraph data={bodyStats} />
        </div>
      )}
    </div>
  );
}

/* simple 1RM calculator UI */
function OneRMCalculator(){
  const [w,setW] = useState("80");
  const [r,setR] = useState("5");
  const formulaEpley = (w,r)=> Math.round(w*(1 + r/30));
  const oneRm = formulaEpley(Number(w), Number(r));
  return (
    <div style={{display:"grid",gap:8}}>
      <div style={{display:"flex",gap:8,alignItems:"center"}}>
        <input value={w} onChange={e=>setW(e.target.value)} style={{width:120}} />
        <input value={r} onChange={e=>setR(e.target.value)} style={{width:80}} />
        <div className="small">kg × reps</div>
      </div>
      <div style={{fontWeight:700,fontSize:18}}>Est. 1RM: {oneRm} kg</div>
      <div className="small">Formel: Epley (1RM = w × (1 + r/30)) — välj andra formler om du vill</div>
    </div>
  );
}
