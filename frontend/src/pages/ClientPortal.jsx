import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams } from 'react-router-dom'

const API = '/api'

const apiFetch = async (path, opts = {}) => {
  const token = sessionStorage.getItem('client_token')
  const headers = { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }
  const res = await fetch(`${API}${path}`, { ...opts, headers })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || `HTTP ${res.status}`)
  }
  return res.json()
}

const DEFAULT_CONTRA = {
  pregnant: { microneedling: 'BLOCK', peel: 'BLOCK', rf: 'BLOCK', polynucleotides: 'BLOCK', lymphatic: 'FLAG' },
  pacemaker: { rf: 'BLOCK', microneedling: 'FLAG' },
  metalImplants: { rf: 'BLOCK' },
  bloodClotting: { microneedling: 'BLOCK', peel: 'FLAG', rf: 'FLAG', polynucleotides: 'FLAG' },
  activeCancer: { microneedling: 'BLOCK', peel: 'BLOCK', rf: 'BLOCK', polynucleotides: 'BLOCK', lymphatic: 'BLOCK' },
  keloid: { microneedling: 'BLOCK', rf: 'FLAG', peel: 'FLAG', polynucleotides: 'FLAG' },
  skinInfection: { microneedling: 'BLOCK', peel: 'BLOCK', rf: 'BLOCK', polynucleotides: 'BLOCK', lymphatic: 'BLOCK' },
  autoimmune: { microneedling: 'BLOCK', peel: 'FLAG', rf: 'FLAG', polynucleotides: 'FLAG' },
  epilepsy: { microneedling: 'FLAG', peel: 'FLAG', rf: 'FLAG', polynucleotides: 'FLAG', lymphatic: 'FLAG' },
  herpes: { microneedling: 'FLAG', peel: 'FLAG' },
  roaccutane: { microneedling: 'BLOCK', peel: 'BLOCK', rf: 'BLOCK', polynucleotides: 'FLAG' },
  bloodThinners: { microneedling: 'BLOCK', rf: 'FLAG', polynucleotides: 'FLAG' },
  retinoids: { peel: 'BLOCK', microneedling: 'FLAG' },
  photosensitising: { peel: 'BLOCK', microneedling: 'FLAG' },
  immunosuppressants: { microneedling: 'BLOCK', peel: 'FLAG', rf: 'FLAG', polynucleotides: 'FLAG' },
  sunburn: { microneedling: 'BLOCK', peel: 'BLOCK', rf: 'BLOCK', polynucleotides: 'FLAG' },
  sunbed: { peel: 'BLOCK', microneedling: 'FLAG', rf: 'FLAG' },
  fishAllergy: { polynucleotides: 'BLOCK' },
  fillersRecent: { rf: 'BLOCK', polynucleotides: 'FLAG' },
}
const TX_LABELS = { microneedling: 'Microneedling', peel: 'Chemical Peels', rf: 'RF Needling', polynucleotides: 'Polynucleotides', lymphatic: 'Lymphatic Lift' }

function getAlerts(d, matrix) {
  const m = matrix || DEFAULT_CONTRA
  const blocks = [], flags = []
  Object.entries(m).forEach(([k, txs]) => {
    if (d[k] === 'yes') Object.entries(txs).forEach(([tx, lv]) => {
      const entry = { condition: k, treatment: TX_LABELS[tx] || tx }
      lv === 'BLOCK' ? blocks.push(entry) : flags.push(entry)
    })
  })
  return { blocks, flags }
}

// SVG Icons
const I = {
  cal: (c='currentColor',s=18) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>,
  form: (c='currentColor',s=18) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8M16 17H8M10 9H8"/></svg>,
  user: (c='currentColor',s=18) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  msg: (c='currentColor',s=18) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>,
  home: (c='currentColor',s=18) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  bell: (c='currentColor',s=18) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>,
  back: (c='currentColor',s=16) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>,
  arr: (c='currentColor',s=16) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>,
  chk: (c='currentColor',s=14) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={3} strokeLinecap="round"><path d="M5 13l4 4L19 7"/></svg>,
  shield: (c='currentColor',s=18) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  clock: (c='currentColor',s=14) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={2} strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>,
  warn: (c='currentColor',s=18) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  block: (c='currentColor',s=18) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={2} strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>,
  eye: (c='currentColor',s=16) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={1.8} strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  out: (c='currentColor',s=16) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
}

// Design tokens — LIGHT MODE
const T = {
  bg: '#F3F4F6', card: '#FFFFFF', bdr: '#E5E7EB', bdrL: '#F3F4F6',
  acc: '#C9A84C', accL: '#C9A84C18', accM: '#C9A84C30',
  txt: '#111111', txt2: '#374151', txtM: '#6B7280', txtL: '#9CA3AF',
  ok: '#22C55E', okBg: '#F0FDF4', okBdr: '#BBF7D0',
  err: '#EF4444', errBg: '#FEF2F2', errBdr: '#FECACA',
  wrn: '#F59E0B', wrnBg: '#FFFBEB', wrnBdr: '#FDE68A',
  sh: '0 1px 3px rgba(0,0,0,0.06)', shM: '0 4px 12px rgba(0,0,0,0.06)',
  r: 12, rs: 8, rl: 16, f: "'Figtree',-apple-system,sans-serif",
}

const STEPS = ['Personal','Medical','Medications','Skin','Lifestyle','Consent']

const YesNo = ({label,name,value,onChange,detail,detailLabel,detailValue,onDetailChange,sublabel}) => {
  const y = value==='yes', n = value==='no'
  return (
    <div style={{marginBottom:16,background:T.card,borderRadius:T.r,border:`1px solid ${y?T.acc+'50':T.bdr}`,padding:'16px 18px',boxShadow:y?`0 0 0 1px ${T.acc}30`:'none',transition:'all 0.2s'}}>
      <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:12}}>
        <div style={{flex:1}}>
          <p style={{fontSize:14,fontWeight:600,color:T.txt,margin:0,lineHeight:1.4}}>{label}</p>
          {sublabel&&<p style={{fontSize:12,color:T.txtM,margin:'4px 0 0',lineHeight:1.3}}>{sublabel}</p>}
        </div>
        <div style={{display:'flex',background:T.bdrL,borderRadius:20,padding:2,flexShrink:0}}>
          <button type="button" onClick={()=>onChange(name,'yes')} style={{padding:'6px 16px',borderRadius:18,fontSize:12,fontWeight:700,border:'none',cursor:'pointer',transition:'all 0.2s',background:y?T.acc:'transparent',color:y?'#fff':T.txtL}}>Yes</button>
          <button type="button" onClick={()=>onChange(name,'no')} style={{padding:'6px 16px',borderRadius:18,fontSize:12,fontWeight:700,border:'none',cursor:'pointer',transition:'all 0.2s',background:n?T.ok:'transparent',color:n?'#fff':T.txtL}}>No</button>
        </div>
      </div>
      {y&&detail&&<input type="text" placeholder={detailLabel||'Please provide details...'} value={detailValue||''} onChange={e=>onDetailChange(name+'Detail',e.target.value)}
        style={{marginTop:12,width:'100%',padding:'10px 14px',borderRadius:T.rs,border:`1px solid ${T.bdr}`,fontSize:13,outline:'none',background:T.bg,color:T.txt,boxSizing:'border-box',fontFamily:T.f}}/>}
    </div>
  )
}

const Inp = ({label,type='text',name,value,onChange,placeholder}) => (
  <div style={{marginBottom:14}}>
    <label style={{display:'block',fontSize:12,fontWeight:600,color:T.txt2,marginBottom:5}}>{label}</label>
    <input type={type} value={value||''} placeholder={placeholder} onChange={e=>onChange(name,e.target.value)}
      style={{width:'100%',padding:'10px 14px',borderRadius:T.rs,border:`1px solid ${T.bdr}`,fontSize:13,outline:'none',background:T.card,color:T.txt,boxSizing:'border-box',fontFamily:T.f}}
      onFocus={e=>e.target.style.borderColor=T.acc} onBlur={e=>e.target.style.borderColor=T.bdr}/>
  </div>
)

const Tick = ({label,checked,onChange}) => (
  <label style={{display:'flex',alignItems:'flex-start',gap:12,padding:'10px 14px',borderRadius:T.rs,cursor:'pointer'}}
    onMouseEnter={e=>e.currentTarget.style.background=T.bg} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
    <div style={{width:20,height:20,marginTop:1,borderRadius:6,border:checked?'none':`2px solid ${T.bdr}`,background:checked?T.acc:'transparent',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
      {checked&&I.chk('#fff',12)}
    </div>
    <span style={{fontSize:13,color:T.txt2,lineHeight:1.5}}>{label}</span>
  </label>
)

const AlertBanner = ({blocks,flags}) => {
  if(!blocks.length&&!flags.length) return null
  return (
    <div style={{marginTop:12}}>
      {blocks.length>0&&(
        <div style={{background:T.errBg,border:`1px solid ${T.errBdr}`,borderRadius:T.r,padding:16,marginBottom:8,display:'flex',gap:12,alignItems:'flex-start'}}>
          <div style={{width:36,height:36,borderRadius:'50%',background:'#FEE2E2',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>{I.block(T.err,18)}</div>
          <div>
            <p style={{fontSize:12,fontWeight:700,color:T.err,margin:0,textTransform:'uppercase',letterSpacing:'0.05em'}}>Treatments Blocked</p>
            {blocks.map((b,i)=><p key={i} style={{fontSize:12,color:'#B91C1C',margin:'4px 0 0'}}>{b.treatment} — {b.condition}</p>)}
          </div>
        </div>
      )}
      {flags.length>0&&(
        <div style={{background:T.wrnBg,border:`1px solid ${T.wrnBdr}`,borderRadius:T.r,padding:16,display:'flex',gap:12,alignItems:'flex-start'}}>
          <div style={{width:36,height:36,borderRadius:'50%',background:'#FEF3C7',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>{I.warn(T.wrn,18)}</div>
          <div>
            <p style={{fontSize:12,fontWeight:700,color:'#B45309',margin:0,textTransform:'uppercase',letterSpacing:'0.05em'}}>Therapist Review Required</p>
            {flags.map((f,i)=><p key={i} style={{fontSize:12,color:'#92400E',margin:'4px 0 0'}}>{f.treatment} — {f.condition}</p>)}
          </div>
        </div>
      )}
    </div>
  )
}

const SigPad = ({onSign}) => {
  const ref=useRef(null),dr=useRef(false)
  const s=useCallback(e=>{dr.current=true;const c=ref.current,r=c.getBoundingClientRect(),ctx=c.getContext('2d'),p=e.touches?e.touches[0]:e;ctx.beginPath();ctx.moveTo(p.clientX-r.left,p.clientY-r.top)},[])
  const d=useCallback(e=>{if(!dr.current)return;e.preventDefault();const c=ref.current,r=c.getBoundingClientRect(),ctx=c.getContext('2d'),p=e.touches?e.touches[0]:e;ctx.strokeStyle=T.txt;ctx.lineWidth=2;ctx.lineCap='round';ctx.lineTo(p.clientX-r.left,p.clientY-r.top);ctx.stroke()},[])
  const u=useCallback(()=>{dr.current=false;if(ref.current)onSign(ref.current.toDataURL())},[onSign])
  const cl=()=>{const c=ref.current;c.getContext('2d').clearRect(0,0,c.width,c.height);onSign(null)}
  return (
    <div>
      <canvas ref={ref} width={600} height={180} style={{width:'100%',height:120,border:`2px dashed ${T.bdr}`,borderRadius:T.r,cursor:'crosshair',background:T.card,touchAction:'none'}}
        onMouseDown={s} onMouseMove={d} onMouseUp={u} onMouseLeave={u} onTouchStart={s} onTouchMove={d} onTouchEnd={u}/>
      <div style={{display:'flex',justifyContent:'space-between',marginTop:6}}>
        <button type="button" onClick={cl} style={{background:'none',border:'none',color:T.acc,fontSize:12,fontWeight:600,cursor:'pointer',padding:0}}>Clear signature</button>
        <span style={{fontSize:11,color:T.txtL}}>Draw with mouse or finger</span>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function ClientPortal() {
  const {slug} = useParams()
  const [view,setView] = useState('login')
  const [biz,setBiz] = useState(null)
  const [user,setUser] = useState(null)
  const [loading,setLoading] = useState(false)
  const [err,setErr] = useState('')
  const [authMode,setAuthMode] = useState('login')
  const [email,setEmail] = useState('')
  const [password,setPassword] = useState('')
  const [signupName,setSignupName] = useState('')
  const [signupPhone,setSignupPhone] = useState('')
  const [showPw,setShowPw] = useState(false)
  const [step,setStep] = useState(0)
  const [fd,setFd] = useState({})
  const [cs,setCs] = useState(null)
  const [myData,setMyData] = useState(null)
  const [activeTab,setActiveTab] = useState('home')
  const topRef = useRef(null)

  const isSalon = biz?.type==='salon'||biz?.type==='local_services'||biz?.category==='salon'
  const hasForm = cs?.status==='complete'||cs?.status==='submitted'
  const alerts = getAlerts(fd)
  const desk = typeof window!=='undefined'&&window.innerWidth>=768
  const set = useCallback((k,v)=>setFd(p=>({...p,[k]:v})),[])
  const upcoming = myData?.upcoming_bookings||[]

  useEffect(()=>{
    if(!slug) return
    apiFetch(`/client/${slug}/info`).then(d=>{
      setBiz(d.business||d)
      if(sessionStorage.getItem('client_token')) loadUser()
    }).catch(()=>{})
  },[slug])

  const loadUser = async()=>{
    try{
      const profile=await apiFetch(`/client/auth/me`)
      const data=await apiFetch(`/client/${slug}/my-data`)
      setUser(profile.user||profile); setCs(data.consultation||null); setMyData(data); setView('home')
    }catch(e){sessionStorage.removeItem('client_token')}
  }

  const doAuth = async()=>{
    setLoading(true);setErr('')
    try{
      const body=authMode==='login'
        ? {email,password}
        : {name:signupName,email,phone:signupPhone,password,business_id:biz?.business_id||''}
      const d=await apiFetch(`/client/auth/${authMode==='login'?'login':'signup'}`,{method:'POST',body:JSON.stringify(body)})
      sessionStorage.setItem('client_token',d.token); await loadUser()
    }catch(e){setErr(e.message)}
    setLoading(false)
  }

  const logout = ()=>{sessionStorage.removeItem('client_token');setUser(null);setView('login');setActiveTab('home')}

  const submitForm = async()=>{
    setLoading(true)
    try{
      await apiFetch(`/consultation/public/${slug}/submit`,{method:'POST',body:JSON.stringify({form_data:fd,alerts})})
      setCs({status:'submitted'}); setView('submitted')
    }catch(e){setErr(e.message)}
    setLoading(false)
  }

  const canProceed = ()=>{
    if(step===0) return fd.fullName&&fd.dob&&fd.mobile&&fd.email&&fd.emergencyName&&fd.emergencyPhone&&fd.gpName
    if(step===5) return fd.consent1&&fd.consent2&&fd.consent3&&fd.consent4&&fd.consent5&&fd.consent6&&fd.consent7&&fd.consent8&&fd.signed
    return true
  }

  if(!biz) return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:T.bg,fontFamily:T.f}}>
      <div style={{textAlign:'center'}}>
        <div style={{width:32,height:32,border:`3px solid ${T.bdr}`,borderTopColor:T.acc,borderRadius:'50%',animation:'spin 0.8s linear infinite',margin:'0 auto 12px'}}/>
        <p style={{fontSize:13,color:T.txtM}}>Loading...</p>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  // ═══════════════════════════════════════════════════════════════
  // LOGIN
  // ═══════════════════════════════════════════════════════════════
  if(view==='login') return (
    <div style={{minHeight:'100vh',background:T.bg,fontFamily:T.f}}>
      <link href="https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700;800&display=swap" rel="stylesheet"/>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {/* Header */}
      <div style={{background:'#111111',padding:'14px 24px'}}>
        <div style={{maxWidth:1200,margin:'0 auto',display:'flex',alignItems:'center',gap:12}}>
          <div style={{width:36,height:36,borderRadius:10,background:T.acc,display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,fontWeight:800,color:'#111'}}>{biz?.name?.charAt(0)||'R'}</div>
          <div>
            <p style={{fontSize:15,fontWeight:700,color:'#fff',margin:0}}>{biz?.name}</p>
            <p style={{fontSize:10,color:'#9CA3AF',margin:0,textTransform:'uppercase',letterSpacing:'0.1em'}}>{biz?.subtitle||'SKIN EXPERTS'}</p>
          </div>
        </div>
      </div>

      {/* Hero */}
      <div style={{background:`linear-gradient(135deg, ${T.acc}12, ${T.acc}06)`,padding:desk?'48px 0':'32px 0'}}>
        <div style={{maxWidth:1200,margin:'0 auto',padding:'0 24px'}}>
          <p style={{fontSize:desk?32:22,fontWeight:800,color:T.txt,margin:0}}>Welcome back.</p>
          <p style={{fontSize:desk?16:13,color:T.txtM,marginTop:8,maxWidth:440}}>Access your personalised treatment dashboard, manage appointments, and explore treatments designed for you.</p>
        </div>
      </div>

      {/* Card */}
      <div style={{maxWidth:desk?440:400,margin:desk?'-20px auto 40px':'0 auto',padding:desk?'0 24px':'24px 16px',animation:'fadeUp 0.4s ease-out'}}>
        <div style={{background:T.card,borderRadius:T.rl,border:`1px solid ${T.bdr}`,boxShadow:T.shM,padding:desk?32:24}}>
          <h2 style={{fontSize:20,fontWeight:800,color:T.txt,margin:'0 0 4px'}}>{authMode==='login'?'Member Login':'Create Account'}</h2>
          <p style={{fontSize:13,color:T.txtM,margin:'0 0 24px'}}>{authMode==='login'?'Please enter your credentials to continue.':'Join our community today.'}</p>

          {authMode==='signup'&&<><label style={{display:'block',fontSize:12,fontWeight:600,color:T.txt2,marginBottom:5}}>Full Name</label>
          <input value={signupName} onChange={e=>setSignupName(e.target.value)} placeholder="Your full name" style={{width:'100%',padding:'12px 14px',borderRadius:T.rs,border:`1px solid ${T.bdr}`,fontSize:14,outline:'none',background:T.bg,color:T.txt,boxSizing:'border-box',fontFamily:T.f,marginBottom:14}}/></>}

          <label style={{display:'block',fontSize:12,fontWeight:600,color:T.txt2,marginBottom:5}}>Email Address</label>
          <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="name@example.com" style={{width:'100%',padding:'12px 14px',borderRadius:T.rs,border:`1px solid ${T.bdr}`,fontSize:14,outline:'none',background:T.bg,color:T.txt,boxSizing:'border-box',fontFamily:T.f,marginBottom:14}}/>

          {authMode==='signup'&&<><label style={{display:'block',fontSize:12,fontWeight:600,color:T.txt2,marginBottom:5}}>Phone Number</label>
          <input type="tel" value={signupPhone} onChange={e=>setSignupPhone(e.target.value)} placeholder="07..." style={{width:'100%',padding:'12px 14px',borderRadius:T.rs,border:`1px solid ${T.bdr}`,fontSize:14,outline:'none',background:T.bg,color:T.txt,boxSizing:'border-box',fontFamily:T.f,marginBottom:14}}/></>}

          <label style={{display:'block',fontSize:12,fontWeight:600,color:T.txt2,marginBottom:5}}>Password</label>
          <div style={{position:'relative',marginBottom:20}}>
            <input type={showPw?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" style={{width:'100%',padding:'12px 14px',paddingRight:44,borderRadius:T.rs,border:`1px solid ${T.bdr}`,fontSize:14,outline:'none',background:T.bg,color:T.txt,boxSizing:'border-box',fontFamily:T.f}}/>
            <button type="button" onClick={()=>setShowPw(!showPw)} style={{position:'absolute',right:12,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',padding:0}}>{I.eye(T.txtL)}</button>
          </div>

          {err&&<p style={{fontSize:12,color:T.err,marginBottom:12}}>{err}</p>}

          <button onClick={doAuth} disabled={loading} style={{width:'100%',padding:'14px 0',borderRadius:T.rs,border:'none',background:T.acc,color:'#fff',fontSize:15,fontWeight:700,cursor:loading?'wait':'pointer',fontFamily:T.f,letterSpacing:'0.03em',opacity:loading?0.6:1}}>
            {loading?'Please wait...':authMode==='login'?'LOG IN':'CREATE ACCOUNT'}
          </button>

          <p style={{textAlign:'center',fontSize:13,color:T.txtM,marginTop:20}}>
            {authMode==='login'?"Don't have an account? ":"Already a member? "}
            <button onClick={()=>{setAuthMode(authMode==='login'?'signup':'login');setErr('')}} style={{background:'none',border:'none',color:T.acc,fontWeight:700,cursor:'pointer',fontSize:13,padding:0,fontFamily:T.f}}>
              {authMode==='login'?'Sign up':'Log in'}
            </button>
          </p>
        </div>
      </div>

      <div style={{textAlign:'center',padding:'16px 0 24px'}}>
        <p style={{fontSize:11,color:T.txtL,letterSpacing:'0.1em',textTransform:'uppercase'}}>Powered by <span style={{fontWeight:700,color:T.acc}}>ReeveOS</span></p>
      </div>
    </div>
  )

  // ═══════════════════════════════════════════════════════════════
  // HOME
  // ═══════════════════════════════════════════════════════════════
  if(view==='home') {
    const qa = [
      {icon:'cal',label:'Book Visit',sub:'Schedule appointment',action:()=>window.open(`/${slug}`,'_blank'),show:true},
      {icon:'form',label:hasForm?'View Form':'Fill Form',sub:hasForm?'Review details':'Complete paperwork',action:()=>{setStep(0);setView('form')},show:isSalon},
      {icon:'user',label:'My Profile',sub:'History & settings',action:()=>{},show:true},
      {icon:'msg',label:'Message Us',sub:'Talk to experts',action:()=>{},show:true},
    ].filter(a=>a.show)

    const tabs = [{icon:'home',label:'Home',id:'home'},{icon:'cal',label:'Bookings',id:'bookings'},{icon:'msg',label:'Messages',id:'messages'},{icon:'user',label:'Profile',id:'profile'}]

    // Colors for dark sections
    const D = {bg:'#0F172A',bdr:'#1E293B',bdr2:'#334155',txt:'#F1F5F9',txtM:'#94A3B8',txtD:'#64748B'}

    return (
      <div style={{minHeight:'100vh',background:T.bg,fontFamily:T.f,paddingBottom:desk?0:72}}>
        <link href="https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700;800&display=swap" rel="stylesheet"/>

        {/* ═══ HEADER — dark navy bar (from Figma) ═══ */}
        <div style={{background:'#020617',borderBottom:`1px solid ${D.bdr}`,padding:'12px 40px',position:'sticky',top:0,zIndex:20}}>
          <div style={{maxWidth:1200,margin:'0 auto',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            {/* Left: Logo + Name */}
            <div style={{display:'flex',alignItems:'center',gap:16}}>
              <div style={{width:32,height:32,borderRadius:8,background:T.acc,display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,fontWeight:800,color:'#020617'}}>R</div>
              <span style={{fontSize:18,fontWeight:700,color:'#fff',letterSpacing:'-0.27px'}}>{biz?.name||'Rejuvenate Skin Experts'}</span>
            </div>
            {/* Right: Nav + Bell + Hi Name + Avatar */}
            <div style={{display:'flex',alignItems:'center',gap:16}}>
              {desk&&<div style={{display:'flex',gap:36,marginRight:16}}>
                {['Home','Services','Products','About'].map(l=><button key={l} style={{background:'none',border:'none',fontSize:14,fontWeight:500,color:'#CBD5E1',cursor:'pointer',padding:0,fontFamily:T.f}}>{l}</button>)}
              </div>}
              {/* Bell with gold dot */}
              <button style={{width:40,height:40,borderRadius:24,background:D.bdr,border:'none',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',position:'relative'}}>
                {I.bell('#9CA3AF')}
                <div style={{position:'absolute',top:8,right:8,width:8,height:8,borderRadius:99,background:T.acc}}/>
              </button>
              {/* Gold pill "Hi Name" */}
              <button style={{background:T.acc,border:'none',borderRadius:24,padding:'8px 20px',cursor:'pointer',display:'flex',alignItems:'center'}}>
                <span style={{fontSize:14,fontWeight:700,color:'#020617'}}>{`Hi ${(user?.name||'').split(' ')[0]}`}</span>
              </button>
              {/* Avatar with gold ring */}
              <div style={{width:40,height:40,borderRadius:99,border:`2px solid ${T.acc}`,background:D.bdr,display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,fontWeight:700,color:'#fff'}}>
                {(user?.name||'?').charAt(0)}
              </div>
            </div>
          </div>
        </div>

        {/* ═══ MAIN CONTENT ═══ */}
        <div style={{maxWidth:1200,margin:'0 auto',padding:desk?'32px 24px 40px':'16px 16px 24px'}}>

          {/* ═══ ALERT CARD — with image (from Figma) ═══ */}
          {isSalon&&(
            <div style={{
              background:hasForm?'#F0FDF4':`rgba(200,163,76,0.1)`,
              border:hasForm?'2px solid #BBF7D0':'2px solid rgba(200,163,76,0.4)',
              borderRadius:24,padding:26,marginBottom:32,
              display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:32,
              boxShadow:'0 10px 15px -3px rgba(0,0,0,0.08)'
            }}>
              <div style={{flex:1}}>
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
                  {hasForm?I.shield(T.ok,16):I.warn(T.acc,16)}
                  <span style={{fontSize:14,fontWeight:700,color:hasForm?T.ok:T.acc,textTransform:'uppercase',letterSpacing:'0.7px'}}>
                    {hasForm?'Form Complete':'Action Required'}
                  </span>
                </div>
                <h3 style={{fontSize:24,fontWeight:700,color:T.txt,margin:'0 0 8px'}}>
                  {hasForm?'Consultation Form Complete':'Consultation Form Needed'}
                </h3>
                <p style={{fontSize:16,color:T.txtM,margin:0,lineHeight:'24px',maxWidth:600}}>
                  {hasForm
                    ?`Your therapist has reviewed your details. Valid until ${cs?.expires_at?new Date(cs.expires_at).toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'}):'—'}.`
                    :'Please complete your comprehensive skin assessment form before your next visit to ensure the best results.'}
                </p>
                <button onClick={()=>{setStep(0);setView('form')}}
                  style={{marginTop:16,padding:'14px 32px',borderRadius:16,border:'none',background:T.acc,color:'#020617',fontSize:14,fontWeight:700,cursor:'pointer',fontFamily:T.f,letterSpacing:'0.35px',minWidth:160}}>
                  {hasForm?'View Form':'Fill Form Now'}
                </button>
              </div>
              {/* Image placeholder (from Figma — rounded image on right) */}
              {desk&&<div style={{width:300,height:180,borderRadius:24,background:'linear-gradient(135deg,#E5E7EB,#D1D5DB)',border:'1px solid rgba(200,163,76,0.2)',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden'}}>
                <div style={{textAlign:'center',color:T.txtL}}>
                  {I.form(T.txtL,40)}
                  <p style={{fontSize:11,marginTop:8}}>Consultation Preview</p>
                </div>
              </div>}
            </div>
          )}

          {/* ═══ TWO-COLUMN LAYOUT ═══ */}
          <div style={desk?{display:'flex',gap:32,alignItems:'flex-start'}:{}}>

            {/* LEFT COLUMN — Quick Actions + Upcoming */}
            <div style={{flex:1,minWidth:0}}>

              {/* Quick Actions heading */}
              <h3 style={{fontSize:22,fontWeight:700,color:T.txt,margin:'0 0 16px'}}>Quick Actions</h3>

              {/* Quick Action Cards — 4 across (dark cards from Figma) */}
              <div style={{display:'grid',gridTemplateColumns:desk?`repeat(${qa.length},1fr)`:'1fr 1fr',gap:16,marginBottom:32}}>
                {qa.map((a,i)=>(
                  <button key={i} onClick={a.action}
                    style={{background:D.bg,border:`1px solid ${D.bdr}`,borderRadius:24,padding:17,cursor:'pointer',textAlign:'left',transition:'all 0.2s',boxShadow:'0 1px 2px rgba(0,0,0,0.05)'}}
                    onMouseEnter={e=>{e.currentTarget.style.borderColor=T.acc+'60'}}
                    onMouseLeave={e=>{e.currentTarget.style.borderColor=D.bdr}}>
                    <div style={{width:48,height:48,borderRadius:16,background:'rgba(200,163,76,0.1)',display:'flex',alignItems:'center',justifyContent:'center',marginBottom:12}}>
                      {I[a.icon](T.acc,20)}
                    </div>
                    <p style={{fontSize:14,fontWeight:700,color:'#fff',margin:0}}>{a.label}</p>
                    <p style={{fontSize:12,color:D.txtM,margin:'2px 0 0'}}>{a.sub}</p>
                  </button>
                ))}
              </div>

              {/* Upcoming Appointments heading */}
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
                <h3 style={{fontSize:22,fontWeight:700,color:T.txt,margin:0}}>Upcoming Appointments</h3>
                {upcoming.length>0&&<button style={{background:'none',border:'none',color:T.acc,fontSize:14,fontWeight:500,cursor:'pointer',padding:0,fontFamily:T.f}}>View All</button>}
              </div>

              {/* Booking Cards (dark, from Figma) */}
              {upcoming.length>0?upcoming.map((b,i)=>(
                <div key={i} style={{background:D.bg,border:`1px solid ${D.bdr}`,borderRadius:24,padding:21,marginBottom:12,boxShadow:'0 1px 2px rgba(0,0,0,0.05)',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                  <div style={{display:'flex',gap:20,alignItems:'center'}}>
                    {/* Date block */}
                    <div style={{width:64,height:64,borderRadius:24,background:D.bdr,border:`1px solid ${D.bdr2}`,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                      <span style={{fontSize:12,fontWeight:700,color:D.txtM,textTransform:'uppercase'}}>{b.month||'TBC'}</span>
                      <span style={{fontSize:20,fontWeight:700,color:'#fff',lineHeight:1}}>{b.day||'—'}</span>
                    </div>
                    <div>
                      <p style={{fontSize:18,fontWeight:700,color:'#fff',margin:0}}>{b.service}</p>
                      <div style={{display:'flex',gap:16,marginTop:4}}>
                        <span style={{display:'flex',alignItems:'center',gap:4,fontSize:14,color:D.txtM}}>{I.clock(D.txtM,13)} {b.time}</span>
                        {b.staff&&<span style={{display:'flex',alignItems:'center',gap:4,fontSize:14,color:D.txtM}}>{I.user(D.txtM,11)} {b.staff}</span>}
                      </div>
                    </div>
                  </div>
                  <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:8}}>
                    {/* Status badge */}
                    <span style={{padding:'5px 13px',borderRadius:99,fontSize:12,fontWeight:700,
                      background:hasForm?'rgba(16,185,129,0.1)':'rgba(245,158,11,0.1)',
                      color:hasForm?'#10B981':'#F59E0B',
                      border:`1px solid ${hasForm?'rgba(16,185,129,0.2)':'rgba(245,158,11,0.2)'}`}}>
                      {hasForm?'All set':'Form needed'}
                    </span>
                    {/* Three-dot menu */}
                    <button style={{background:'none',border:'none',cursor:'pointer',padding:4,display:'flex',flexDirection:'column',gap:2}}>
                      <div style={{width:4,height:4,borderRadius:2,background:D.txtM}}/><div style={{width:4,height:4,borderRadius:2,background:D.txtM}}/><div style={{width:4,height:4,borderRadius:2,background:D.txtM}}/>
                    </button>
                  </div>
                </div>
              )):(
                <div style={{background:D.bg,border:`1px solid ${D.bdr}`,borderRadius:24,padding:40,textAlign:'center',marginBottom:16}}>
                  <div style={{width:56,height:56,borderRadius:16,background:'rgba(200,163,76,0.1)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 12px'}}>
                    {I.cal(T.acc,24)}
                  </div>
                  <p style={{fontSize:14,fontWeight:600,color:'#fff',margin:'0 0 4px'}}>No upcoming appointments</p>
                  <p style={{fontSize:14,color:D.txtM,margin:'0 0 16px'}}>Book your first treatment to get started</p>
                  <button onClick={()=>window.open(`/${slug}`,'_blank')} style={{padding:'10px 24px',borderRadius:16,border:'none',background:T.acc,color:'#020617',fontSize:14,fontWeight:700,cursor:'pointer',fontFamily:T.f}}>Book Appointment</button>
                </div>
              )}

              {/* Treatment History (mobile only) */}
              {myData?.past_bookings?.length>0&&!desk&&(
                <div style={{marginTop:16}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
                    <h3 style={{fontSize:18,fontWeight:700,color:T.txt,margin:0}}>Treatment History</h3>
                    <button style={{background:'none',border:'none',color:T.acc,fontSize:13,fontWeight:600,cursor:'pointer',padding:0,fontFamily:T.f}}>View all</button>
                  </div>
                  {myData.past_bookings.slice(0,3).map((b,i)=>(
                    <div key={i} style={{background:D.bg,border:`1px solid ${D.bdr}`,borderRadius:16,padding:'14px 16px',marginBottom:8,display:'flex',alignItems:'center',gap:14}}>
                      <div style={{width:44,height:44,borderRadius:12,background:D.bdr,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>{I.shield(D.txtM,20)}</div>
                      <div style={{flex:1}}>
                        <p style={{fontSize:13,fontWeight:600,color:'#E5E7EB',margin:0}}>{b.service}</p>
                        <p style={{fontSize:11,color:D.txtM,margin:'2px 0 0'}}>{b.date}{b.staff?` · ${b.staff}`:''}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* RIGHT COLUMN — Membership + Skin Tip (desktop, from Figma) */}
            {desk&&(
              <div style={{width:363,flexShrink:0,display:'flex',flexDirection:'column',gap:32}}>

                {/* Membership Card */}
                <div style={{background:D.bg,border:`1px solid ${D.bdr}`,borderRadius:24,padding:25,position:'relative',overflow:'hidden'}}>
                  {/* Gold glow blur (from Figma) */}
                  <div style={{position:'absolute',top:-16,right:-16,width:96,height:96,borderRadius:99,background:'rgba(200,163,76,0.2)',filter:'blur(32px)',pointerEvents:'none'}}/>
                  <div style={{position:'relative'}}>
                    <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:16}}>
                      <div style={{width:48,height:48,borderRadius:99,border:`2px solid ${T.acc}`,background:D.bdr,display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,fontWeight:700,color:'#fff'}}>{(user?.name||'?').charAt(0)}</div>
                      <div>
                        <p style={{fontSize:16,fontWeight:700,color:'#fff',margin:0}}>{(user?.name||'').split(' ')[0]}</p>
                        <p style={{fontSize:14,fontWeight:500,color:T.acc,margin:0}}>Premium Member</p>
                      </div>
                    </div>
                    <div style={{height:1,background:D.bdr,marginBottom:16}}/>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                      <div>
                        <p style={{fontSize:12,fontWeight:700,color:D.txtM,textTransform:'uppercase',letterSpacing:'-0.3px',margin:0}}>Reward Points</p>
                        <p style={{fontSize:24,fontWeight:700,color:'#fff',margin:'2px 0 0'}}>2,450</p>
                      </div>
                      <button style={{background:'rgba(200,163,76,0.1)',border:'1px solid rgba(200,163,76,0.2)',borderRadius:16,padding:'7px 17px',cursor:'pointer'}}>
                        <span style={{fontSize:12,fontWeight:700,color:T.acc}}>Redeem</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Skin Tip of the Week */}
                <div style={{background:D.bg,border:`1px solid ${D.bdr}`,borderRadius:24,padding:25,boxShadow:'0 1px 2px rgba(0,0,0,0.05)'}}>
                  <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12}}>
                    <span style={{fontSize:16}}>💡</span>
                    <p style={{fontSize:16,fontWeight:700,color:'#fff',margin:0}}>Skin Tip of the Week</p>
                  </div>
                  <div style={{width:'100%',aspectRatio:'16/9',borderRadius:16,background:'linear-gradient(135deg,#1E293B,#334155)',marginBottom:12,display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden'}}>
                    <div style={{textAlign:'center',color:D.txtM}}>
                      {I.shield(D.txtM,32)}
                    </div>
                  </div>
                  <p style={{fontSize:14,color:D.txtM,lineHeight:'20px',margin:'0 0 12px'}}>"Consistency is key! Hydrate daily and never skip your SPF, even on cloudy days."</p>
                  <button style={{width:'100%',padding:'9px 0',borderRadius:16,border:`1px solid ${D.bdr}`,background:'transparent',cursor:'pointer'}}>
                    <span style={{fontSize:12,fontWeight:700,color:D.txtM}}>More Tips</span>
                  </button>
                </div>

                {/* Treatment History (desktop) */}
                {myData?.past_bookings?.length>0&&(
                  <div style={{background:D.bg,border:`1px solid ${D.bdr}`,borderRadius:24,padding:25}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
                      <h3 style={{fontSize:16,fontWeight:700,color:'#fff',margin:0}}>Treatment History</h3>
                      <button style={{background:'none',border:'none',color:T.acc,fontSize:12,fontWeight:600,cursor:'pointer',padding:0,fontFamily:T.f}}>View all</button>
                    </div>
                    {myData.past_bookings.slice(0,4).map((b,i)=>(
                      <div key={i} style={{display:'flex',alignItems:'center',gap:12,padding:'10px 0',borderBottom:i<3?`1px solid ${D.bdr}`:'none'}}>
                        <div style={{width:40,height:40,borderRadius:10,background:D.bdr,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>{I.shield(D.txtM,18)}</div>
                        <div style={{flex:1}}>
                          <p style={{fontSize:13,fontWeight:600,color:'#E5E7EB',margin:0}}>{b.service}</p>
                          <p style={{fontSize:11,color:D.txtM,margin:'1px 0 0'}}>{b.date}{b.staff?` · ${b.staff}`:''}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ═══ BOTTOM NAV — mobile (dark, from Figma) ═══ */}
        {!desk&&(
          <div style={{position:'fixed',bottom:0,left:0,right:0,background:'#020617',borderTop:`1px solid ${D.bdr}`,padding:'8px 0 12px',zIndex:30,display:'flex',justifyContent:'space-around'}}>
            {tabs.map(t=>(
              <button key={t.id} onClick={()=>setActiveTab(t.id)} style={{background:'none',border:'none',cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',gap:3,padding:'4px 8px'}}>
                {I[t.icon](activeTab===t.id?T.acc:'#6B7280',20)}
                <span style={{fontSize:10,fontWeight:activeTab===t.id?700:500,color:activeTab===t.id?T.acc:'#6B7280'}}>{t.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* ═══ FOOTER — desktop (dark, from Figma) ═══ */}
        {desk&&(
          <div style={{borderTop:`1px solid ${D.bdr}`,padding:'41px 40px 40px',marginTop:16}}>
            <div style={{maxWidth:1200,margin:'0 auto',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div style={{display:'flex',alignItems:'center',gap:12}}>
                <div style={{width:22,height:21,display:'flex',alignItems:'center',justifyContent:'center'}}>
                  <div style={{width:16,height:16,borderRadius:4,background:T.acc,display:'flex',alignItems:'center',justifyContent:'center',fontSize:8,fontWeight:800,color:'#020617'}}>R</div>
                </div>
                <p style={{fontSize:14,fontWeight:500,color:D.txtM,margin:0}}>&copy; {new Date().getFullYear()} {biz?.name}. All rights reserved.</p>
              </div>
              <div style={{display:'flex',gap:24}}>
                {['Privacy Policy','Terms of Service','Help Center'].map(l=><button key={l} style={{background:'none',border:'none',fontSize:14,color:D.txtD,cursor:'pointer',fontFamily:T.f,padding:0}}>{l}</button>)}
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }
  // SUBMITTED
  // ═══════════════════════════════════════════════════════════════
  if(view==='submitted') return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',padding:16,background:T.bg,fontFamily:T.f}}>
      <link href="https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700;800&display=swap" rel="stylesheet"/>
      <div style={{background:T.card,border:`1px solid ${T.bdr}`,borderRadius:T.rl,maxWidth:420,width:'100%',textAlign:'center',padding:32,boxShadow:T.shM}}>
        <div style={{width:56,height:56,borderRadius:'50%',background:T.okBg,border:`2px solid ${T.okBdr}`,display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 20px'}}>{I.chk(T.ok,24)}</div>
        <h2 style={{fontSize:20,fontWeight:800,color:T.txt,marginBottom:6}}>Form Submitted</h2>
        <p style={{fontSize:13,color:T.txtM,marginBottom:20}}>Thank you, {fd.fullName}. Your consultation form has been received by {biz?.name}.</p>
        {(alerts.blocks.length>0||alerts.flags.length>0)&&<div style={{textAlign:'left',marginBottom:20}}><AlertBanner blocks={alerts.blocks} flags={alerts.flags}/></div>}
        <p style={{fontSize:12,color:T.txtL,marginBottom:20}}>Your therapist will review before your appointment.</p>
        <button onClick={()=>setView('home')} style={{width:'100%',padding:'12px 0',borderRadius:T.rs,border:'none',background:T.acc,color:'#fff',fontSize:14,fontWeight:700,cursor:'pointer',fontFamily:T.f}}>Back to Home</button>
      </div>
    </div>
  )

  // ═══════════════════════════════════════════════════════════════
  // CONSULTATION FORM
  // ═══════════════════════════════════════════════════════════════
  if(view==='form') return (
    <div style={{minHeight:'100vh',background:T.bg,fontFamily:T.f}}>
      <link href="https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700;800&display=swap" rel="stylesheet"/>
      <div ref={topRef}/>

      {/* STICKY HEADER */}
      <div style={{background:T.card,borderBottom:`1px solid ${T.bdr}`,position:'sticky',top:0,zIndex:20}}>
        <div style={{padding:'12px 16px',display:'flex',alignItems:'center',maxWidth:desk?800:600,margin:'0 auto'}}>
          <button onClick={()=>setView('home')} style={{width:36,height:36,borderRadius:'50%',background:T.bg,border:`1px solid ${T.bdr}`,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',marginRight:12,flexShrink:0}}>{I.back(T.txtM)}</button>
          <h2 style={{fontSize:16,fontWeight:700,color:T.txt,margin:0,flex:1,textAlign:'center'}}>Consultation Form</h2>
          <div style={{width:36}}/>
        </div>
        <div style={{padding:'8px 16px 14px',maxWidth:desk?800:600,margin:'0 auto'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'center'}}>
            {STEPS.map((s,i)=>(
              <div key={s} style={{display:'flex',alignItems:'center'}}>
                <div style={{display:'flex',flexDirection:'column',alignItems:'center'}}>
                  <div style={{width:desk?32:26,height:desk?32:26,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:desk?12:10,fontWeight:700,transition:'all 0.3s',
                    background:i<step?T.ok:i===step?T.acc:T.bdrL,color:i<=step?'#fff':T.txtL,border:i===step?`2px solid ${T.acc}`:'none'}}>
                    {i<step?I.chk('#fff',12):i+1}
                  </div>
                  {desk&&<span style={{fontSize:10,color:i===step?T.acc:T.txtL,fontWeight:i===step?700:500,marginTop:4}}>{s}</span>}
                </div>
                {i<STEPS.length-1&&<div style={{width:desk?40:16,height:2,margin:`0 ${desk?4:2}px`,marginBottom:desk?18:0,background:i<step?T.ok:T.bdrL,borderRadius:1}}/>}
              </div>
            ))}
          </div>
          {!desk&&<p style={{textAlign:'center',fontSize:11,color:T.acc,fontWeight:700,marginTop:6,letterSpacing:'0.05em',textTransform:'uppercase'}}>Step {step+1}: {STEPS[step]}</p>}
        </div>
      </div>

      {/* FORM BODY */}
      <div style={{maxWidth:desk?700:500,margin:'0 auto',padding:desk?'28px 24px 0':'20px 16px 0'}}>

        {step===0&&(<div>
          <h2 style={{fontSize:desk?28:20,fontWeight:800,color:T.txt,marginBottom:4}}>Personal Details</h2>
          <p style={{fontSize:13,color:T.txtM,marginBottom:24,lineHeight:1.5}}>Used for your treatment records and emergency contact.</p>
          <Inp label="Full Name *" name="fullName" value={fd.fullName} onChange={set} placeholder="Your full name"/>
          <div style={{display:'grid',gridTemplateColumns:desk?'1fr 1fr':'1fr',gap:10}}>
            <Inp label="Date of Birth *" type="date" name="dob" value={fd.dob} onChange={set}/>
            <Inp label="Address" name="address" value={fd.address} onChange={set} placeholder="Full address"/>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
            <Inp label="Mobile *" type="tel" name="mobile" value={fd.mobile} onChange={set} placeholder="07..."/>
            <Inp label="Email *" type="email" name="email" value={fd.email} onChange={set} placeholder="you@email.com"/>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
            <Inp label="Emergency Contact *" name="emergencyName" value={fd.emergencyName} onChange={set} placeholder="Name"/>
            <Inp label="Their Number *" type="tel" name="emergencyPhone" value={fd.emergencyPhone} onChange={set} placeholder="07..."/>
          </div>
          <Inp label="GP Name *" name="gpName" value={fd.gpName} onChange={set} placeholder="Dr..."/>
          <Inp label="GP Surgery" name="gpAddress" value={fd.gpAddress} onChange={set} placeholder="Optional"/>
          <div style={{marginBottom:14}}>
            <label style={{display:'block',fontSize:12,fontWeight:600,color:T.txt2,marginBottom:5}}>How did you hear about us?</label>
            <select value={fd.referral||''} onChange={e=>set('referral',e.target.value)} style={{width:'100%',padding:'10px 14px',borderRadius:T.rs,border:`1px solid ${T.bdr}`,fontSize:13,background:T.card,color:T.txt2,boxSizing:'border-box',fontFamily:T.f}}>
              <option value="">Select...</option>
              {['Instagram','TikTok','Google','Friend / Referral','Returning Client','Other'].map(o=><option key={o}>{o}</option>)}
            </select>
          </div>
          <div style={{background:T.bg,borderRadius:T.r,padding:16,border:`1px solid ${T.bdrL}`}}>
            <p style={{fontSize:13,fontWeight:700,color:T.acc,marginBottom:8}}>Photo Consent</p>
            <Tick label="Treatment records (clinical use only)" checked={fd.photoRecords} onChange={()=>set('photoRecords',!fd.photoRecords)}/>
            <Tick label="Training purposes" checked={fd.photoTraining} onChange={()=>set('photoTraining',!fd.photoTraining)}/>
            <Tick label="Marketing & social media" checked={fd.photoMarketing} onChange={()=>set('photoMarketing',!fd.photoMarketing)}/>
          </div>
        </div>)}

        {step===1&&(<div>
          <h2 style={{fontSize:desk?28:20,fontWeight:800,color:T.txt,marginBottom:4}}>Medical History</h2>
          <p style={{fontSize:13,color:T.txtM,marginBottom:24,lineHeight:1.5}}>Please provide accurate information for your safety during treatments.</p>
          <YesNo label="Pregnant, breastfeeding, or trying to conceive?" name="pregnant" value={fd.pregnant} onChange={set}/>
          <YesNo label="Heart condition or high blood pressure?" name="heartCondition" value={fd.heartCondition} onChange={set} detail detailLabel="Controlled or uncontrolled?" detailValue={fd.heartConditionDetail} onDetailChange={set}/>
          <YesNo label="Pacemaker or electronic implant?" name="pacemaker" value={fd.pacemaker} onChange={set}/>
          <YesNo label="Metal implants, plates, or screws?" name="metalImplants" value={fd.metalImplants} onChange={set} detail detailLabel="Where?" detailValue={fd.metalImplantsDetail} onDetailChange={set}/>
          <YesNo label="Diabetes?" name="diabetes" value={fd.diabetes} onChange={set} detail detailLabel="Type 1/2? Controlled?" detailValue={fd.diabetesDetail} onDetailChange={set}/>
          <YesNo label="Epilepsy?" name="epilepsy" value={fd.epilepsy} onChange={set}/>
          <YesNo label="Autoimmune disorder?" name="autoimmune" value={fd.autoimmune} onChange={set} detail detailLabel="e.g. Lupus, scleroderma..." detailValue={fd.autoimmuneDetail} onDetailChange={set}/>
          <YesNo label="Blood clotting disorder?" name="bloodClotting" value={fd.bloodClotting} onChange={set}/>
          <YesNo label="Cancer history?" name="activeCancer" value={fd.activeCancer} onChange={set} detail detailLabel="Type, when, status..." detailValue={fd.activeCancerDetail} onDetailChange={set}/>
          <YesNo label="HIV/AIDS or hepatitis?" name="hivHepatitis" value={fd.hivHepatitis} onChange={set}/>
          <YesNo label="Liver or kidney disease?" name="liverKidney" value={fd.liverKidney} onChange={set}/>
          <YesNo label="History of cold sores (herpes simplex)?" name="herpes" value={fd.herpes} onChange={set}/>
          <YesNo label="History of keloid or raised scarring?" name="keloid" value={fd.keloid} onChange={set}/>
          <AlertBanner blocks={alerts.blocks} flags={alerts.flags}/>
        </div>)}

        {step===2&&(<div>
          <h2 style={{fontSize:desk?28:20,fontWeight:800,color:T.txt,marginBottom:4}}>Current Medications</h2>
          <p style={{fontSize:13,color:T.txtM,marginBottom:24,lineHeight:1.5}}>Medication interactions are the #1 cause of adverse events in skin treatments.</p>
          <YesNo label="Roaccutane / Isotretinoin?" name="roaccutane" value={fd.roaccutane} onChange={set} sublabel="Must be 6+ months clear before treatment" detail detailLabel="Still taking? Or stop date..." detailValue={fd.roaccutaneDetail} onDetailChange={set}/>
          <YesNo label="Blood thinners?" name="bloodThinners" value={fd.bloodThinners} onChange={set} sublabel="Warfarin, heparin, clopidogrel, daily aspirin" detail detailLabel="Which?" detailValue={fd.bloodThinnersDetail} onDetailChange={set}/>
          <YesNo label="Photosensitising medications?" name="photosensitising" value={fd.photosensitising} onChange={set} sublabel="Tetracyclines, doxycycline, St John's Wort" detail detailLabel="Which?" detailValue={fd.photosensitivesDetail} onDetailChange={set}/>
          <YesNo label="Topical retinoids?" name="retinoids" value={fd.retinoids} onChange={set} sublabel="Retin-A, Tretinoin, Differin, Epiduo" detail detailLabel="Product and last used?" detailValue={fd.retinoidsDetail} onDetailChange={set}/>
          <YesNo label="Steroids (oral or topical)?" name="steroids" value={fd.steroids} onChange={set} detail detailLabel="Which?" detailValue={fd.steroidsDetail} onDetailChange={set}/>
          <YesNo label="Immunosuppressants?" name="immunosuppressants" value={fd.immunosuppressants} onChange={set}/>
          <YesNo label="Herbal supplements?" name="herbalSupps" value={fd.herbalSupps} onChange={set} sublabel="Garlic, ginkgo, fish oils affect bleeding" detail detailLabel="Which?" detailValue={fd.herbalSuppsDetail} onDetailChange={set}/>
          <YesNo label="Fish or salmon allergy?" name="fishAllergy" value={fd.fishAllergy} onChange={set} sublabel="Important for polynucleotide treatments"/>
          <Inp label="Any other medications?" name="otherMeds" value={fd.otherMeds} onChange={set} placeholder="List any others..."/>
          <AlertBanner blocks={alerts.blocks} flags={alerts.flags}/>
        </div>)}

        {step===3&&(<div>
          <h2 style={{fontSize:desk?28:20,fontWeight:800,color:T.txt,marginBottom:4}}>Skin History</h2>
          <p style={{fontSize:13,color:T.txtM,marginBottom:24,lineHeight:1.5}}>Tell us about your skin's unique characteristics and past concerns.</p>
          <div style={{marginBottom:20}}>
            <label style={{display:'block',fontSize:13,fontWeight:700,color:T.txt,marginBottom:6}}>Fitzpatrick Skin Type</label>
            <p style={{fontSize:12,color:T.txtM,marginBottom:12}}>Based on your skin's response to UV radiation.</p>
            <div style={{display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:8}}>
              {[{v:'I',bg:'#FDEBD0',x:'Always burns'},{v:'II',bg:'#F5CBA7',x:'Usually burns'},{v:'III',bg:'#E0B88A',x:'Sometimes'},{v:'IV',bg:'#C4956A',x:'Rarely burns'},{v:'V',bg:'#8B6914',x:'Very rarely'},{v:'VI',bg:'#5C4033',x:'Never burns'}].map(t=>(
                <button key={t.v} type="button" onClick={()=>set('fitzpatrick',t.v)}
                  style={{padding:desk?12:8,borderRadius:T.r,border:fd.fitzpatrick===t.v?`2px solid ${T.acc}`:`2px solid ${T.bdr}`,background:T.card,cursor:'pointer',textAlign:'center',transition:'all 0.2s',boxShadow:fd.fitzpatrick===t.v?`0 0 0 2px ${T.acc}30`:'none'}}>
                  <div style={{width:desk?48:32,height:desk?48:32,borderRadius:'50%',margin:'0 auto 6px',background:t.bg,border:fd.fitzpatrick===t.v?`2px solid ${T.acc}`:'2px solid transparent'}}/>
                  <p style={{fontSize:desk?13:11,fontWeight:700,color:T.txt,margin:0}}>{t.v}</p>
                  {desk&&<p style={{fontSize:10,color:T.txtM,margin:'2px 0 0'}}>{t.x}</p>}
                </button>
              ))}
            </div>
          </div>
          <YesNo label="Active acne, eczema, psoriasis, or dermatitis?" name="skinCondition" value={fd.skinCondition} onChange={set} detail detailLabel="Which and where?" detailValue={fd.skinConditionDetail} onDetailChange={set}/>
          <YesNo label="Active skin infection?" name="skinInfection" value={fd.skinInfection} onChange={set}/>
          <YesNo label="Raised moles or warts in treatment area?" name="molesWarts" value={fd.molesWarts} onChange={set}/>
          <YesNo label="Tattoos or permanent makeup in treatment area?" name="tattoos" value={fd.tattoos} onChange={set}/>
          <YesNo label="Previous adverse reactions to skin treatments?" name="adverseReactions" value={fd.adverseReactions} onChange={set} detail detailLabel="What happened?" detailValue={fd.adverseReactionsDetail} onDetailChange={set}/>
          <div style={{marginBottom:16}}>
            <label style={{display:'block',fontSize:13,fontWeight:700,color:T.txt,marginBottom:8}}>Current Skin Concerns</label>
            <p style={{fontSize:12,color:T.txtM,marginBottom:10}}>Select all that apply to your current routine.</p>
            <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
              {['Acne','Scarring','Pigmentation','Rosacea','Fine lines','Texture','Pores','Dullness','Sagging'].map(c=>(
                <button key={c} type="button" onClick={()=>{const x=fd.concerns||[];set('concerns',x.includes(c)?x.filter(z=>z!==c):[...x,c])}}
                  style={{padding:'8px 16px',borderRadius:24,fontSize:13,fontWeight:600,border:(fd.concerns||[]).includes(c)?`2px solid ${T.acc}`:`2px solid ${T.bdr}`,background:(fd.concerns||[]).includes(c)?T.accL:T.card,color:(fd.concerns||[]).includes(c)?T.acc:T.txtM,cursor:'pointer',transition:'all 0.2s'}}>{c}</button>
              ))}
            </div>
          </div>
          <AlertBanner blocks={alerts.blocks} flags={alerts.flags}/>
        </div>)}

        {step===4&&(<div>
          <h2 style={{fontSize:desk?28:20,fontWeight:800,color:T.txt,marginBottom:4}}>Lifestyle</h2>
          <p style={{fontSize:13,color:T.txtM,marginBottom:24,lineHeight:1.5}}>Sun exposure affects treatment safety and results.</p>
          <YesNo label="Significant sun exposure in the last 2 weeks?" name="sunburn" value={fd.sunburn} onChange={set}/>
          <YesNo label="Sunbed use in the last 4 weeks?" name="sunbed" value={fd.sunbed} onChange={set}/>
          <YesNo label="Currently have a tan (natural or self-tan)?" name="tan" value={fd.tan} onChange={set}/>
          <YesNo label="Planned sun exposure in the next 4 weeks?" name="plannedSun" value={fd.plannedSun} onChange={set} sublabel="Holiday, outdoor event etc."/>
          <YesNo label="Do you smoke?" name="smoker" value={fd.smoker} onChange={set}/>
          <AlertBanner blocks={alerts.blocks} flags={alerts.flags}/>
        </div>)}

        {step===5&&(<div>
          <h2 style={{fontSize:desk?28:20,fontWeight:800,color:T.txt,marginBottom:4}}>Legal Consent & Signature</h2>
          <p style={{fontSize:13,color:T.txtM,marginBottom:20,lineHeight:1.5}}>Please carefully review each statement and provide your digital signature below.</p>
          {alerts.blocks.length>0&&<AlertBanner blocks={alerts.blocks} flags={alerts.flags}/>}
          <div style={{background:T.bg,borderRadius:T.r,padding:8,marginTop:12,border:`1px solid ${T.bdrL}`}}>
            <Tick label="The information I've provided is accurate and complete." checked={fd.consent1} onChange={()=>set('consent1',!fd.consent1)}/>
            <Tick label="Withholding information may cause adverse reactions I accept liability for." checked={fd.consent2} onChange={()=>set('consent2',!fd.consent2)}/>
            <Tick label="I will inform my therapist if my medical circumstances change." checked={fd.consent3} onChange={()=>set('consent3',!fd.consent3)}/>
            <Tick label="I understand the risks and nature of the treatments discussed." checked={fd.consent4} onChange={()=>set('consent4',!fd.consent4)}/>
            <Tick label="I agree to follow pre- and post-treatment care instructions." checked={fd.consent5} onChange={()=>set('consent5',!fd.consent5)}/>
            <Tick label="I understand the 72-hour cancellation policy for advanced treatments." checked={fd.consent6} onChange={()=>set('consent6',!fd.consent6)}/>
            <Tick label="I consent to my data being stored securely under UK GDPR." checked={fd.consent7} onChange={()=>set('consent7',!fd.consent7)}/>
            <Tick label="Results vary and no specific outcome is guaranteed." checked={fd.consent8} onChange={()=>set('consent8',!fd.consent8)}/>
          </div>
          <div style={{marginTop:24}}>
            <label style={{display:'block',fontSize:14,fontWeight:700,color:T.txt,marginBottom:8}}>Digital Signature *</label>
            <SigPad onSign={s=>set('signed',s)}/>
          </div>
          <p style={{fontSize:11,color:T.txtL,marginTop:16,textAlign:'center'}}>By signing above, you acknowledge this is a legally binding electronic signature. Valid for 6 months.</p>
        </div>)}
      </div>

      {/* STICKY FOOTER NAV */}
      <div style={{position:'sticky',bottom:0,background:T.card,borderTop:`1px solid ${T.bdr}`,padding:'16px 16px 20px',marginTop:24}}>
        <div style={{display:'flex',gap:10,maxWidth:desk?700:500,margin:'0 auto'}}>
          {step>0&&<button onClick={()=>{setStep(step-1);topRef.current?.scrollIntoView({behavior:'smooth'})}}
            style={{padding:'14px 28px',borderRadius:T.rs,border:`1px solid ${T.bdr}`,background:T.card,fontSize:14,fontWeight:600,color:T.txt2,cursor:'pointer',fontFamily:T.f,display:'flex',alignItems:'center',gap:6}}>{I.back(T.txt2,14)} Back</button>}
          <div style={{flex:1}}/>
          {step<STEPS.length-1?(
            <button onClick={()=>{if(canProceed()){setStep(step+1);topRef.current?.scrollIntoView({behavior:'smooth'})}}} disabled={!canProceed()}
              style={{padding:'14px 32px',borderRadius:T.rs,border:'none',background:canProceed()?T.acc:T.bdrL,color:canProceed()?'#fff':T.txtL,fontSize:14,fontWeight:700,cursor:canProceed()?'pointer':'not-allowed',fontFamily:T.f,display:'flex',alignItems:'center',gap:8,boxShadow:canProceed()?'0 2px 8px rgba(201,168,76,0.3)':'none'}}>
              Continue {I.arr('#fff',14)}
            </button>
          ):(
            <button onClick={()=>canProceed()&&submitForm()} disabled={!canProceed()||loading}
              style={{padding:'14px 32px',borderRadius:T.rs,border:'none',background:canProceed()&&!loading?T.acc:T.bdrL,color:canProceed()?'#fff':T.txtL,fontSize:14,fontWeight:700,cursor:canProceed()?'pointer':'not-allowed',fontFamily:T.f,boxShadow:canProceed()?'0 2px 8px rgba(201,168,76,0.3)':'none'}}>
              {loading?'Submitting...':'Submit Form'}
            </button>
          )}
        </div>
      </div>
    </div>
  )

  return null
}
