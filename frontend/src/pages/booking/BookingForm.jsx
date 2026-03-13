/**
 * BookingForm — Standalone consultation form for the booking domain.
 * Renders at /:businessSlug/form
 * No client portal, no sidebar, no login. Just the form.
 * After submission, "Return to Booking" sends them back.
 */
import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'

const API = '/api'
const apiFetch = async (path, opts = {}) => {
  const headers = { 'Content-Type': 'application/json' }
  const res = await fetch(`${API}${path}`, { ...opts, headers })
  if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.detail || `HTTP ${res.status}`) }
  return res.json()
}

// Contraindication matrix
const DC={pregnant:{microneedling:'BLOCK',peel:'BLOCK',rf:'BLOCK',polynucleotides:'BLOCK',lymphatic:'FLAG'},pacemaker:{rf:'BLOCK',microneedling:'FLAG'},metalImplants:{rf:'BLOCK'},bloodClotting:{microneedling:'BLOCK',peel:'FLAG',rf:'FLAG',polynucleotides:'FLAG'},activeCancer:{microneedling:'BLOCK',peel:'BLOCK',rf:'BLOCK',polynucleotides:'BLOCK',lymphatic:'BLOCK'},keloid:{microneedling:'BLOCK',rf:'FLAG',peel:'FLAG',polynucleotides:'FLAG'},skinInfection:{microneedling:'BLOCK',peel:'BLOCK',rf:'BLOCK',polynucleotides:'BLOCK',lymphatic:'BLOCK'},autoimmune:{microneedling:'BLOCK',peel:'FLAG',rf:'FLAG',polynucleotides:'FLAG'},epilepsy:{microneedling:'FLAG',peel:'FLAG',rf:'FLAG',polynucleotides:'FLAG',lymphatic:'FLAG'},herpes:{microneedling:'FLAG',peel:'FLAG'},roaccutane:{microneedling:'BLOCK',peel:'BLOCK',rf:'BLOCK',polynucleotides:'FLAG'},bloodThinners:{microneedling:'BLOCK',rf:'FLAG',polynucleotides:'FLAG'},retinoids:{peel:'BLOCK',microneedling:'FLAG'},photosensitising:{peel:'BLOCK',microneedling:'FLAG'},immunosuppressants:{microneedling:'BLOCK',peel:'FLAG',rf:'FLAG',polynucleotides:'FLAG'},sunburn:{microneedling:'BLOCK',peel:'BLOCK',rf:'BLOCK',polynucleotides:'FLAG'},sunbed:{peel:'BLOCK',microneedling:'FLAG',rf:'FLAG'},fishAllergy:{polynucleotides:'BLOCK'},fillersRecent:{rf:'BLOCK',polynucleotides:'FLAG'}}
const TL={microneedling:'Microneedling',peel:'Chemical Peels',rf:'RF Needling',polynucleotides:'Polynucleotides',lymphatic:'Lymphatic Lift'}
function getAlerts(d){const blocks=[],flags=[];Object.entries(DC).forEach(([k,txs])=>{if(d[k]==='yes')Object.entries(txs).forEach(([tx,lv])=>{const e={condition:k,treatment:TL[tx]||tx};lv==='BLOCK'?blocks.push(e):flags.push(e)})});return{blocks,flags}}

// Brand
const $={bg:'#FAF8F5',card:'#FFFFFF',bdr:'#E5E7EB',h:'#111111',txt:'#374151',txtM:'#6B7280',txtL:'#9CA3AF',acc:'#C9A84C',ok:'#22C55E',err:'#EF4444',wrn:'#F59E0B',f:"'Figtree',-apple-system,sans-serif"}
const STEPS=['Personal','Medical','Medications','Skin','Lifestyle','Consent']

// Icons (monochrome SVG only)
const I={
  user:(c='currentColor',s=18)=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  back:(c='currentColor',s=16)=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>,
  arr:(c='currentColor',s=16)=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>,
  chk:(c='currentColor',s=14)=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={3} strokeLinecap="round"><path d="M5 13l4 4L19 7"/></svg>,
  shield:(c='currentColor',s=18)=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  warn:(c='currentColor',s=18)=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  block:(c='currentColor',s=18)=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={2} strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>,
  mail:(c='currentColor',s=14)=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
  phone:(c='currentColor',s=14)=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>,
}

// Form components
const Toggle=({value,onChange,d})=>{const on=value==='yes';const w=d?48:56,h=d?26:32,k=d?20:26;return <button type="button" onClick={()=>onChange(on?'no':'yes')} style={{width:w,height:h,borderRadius:h/2,background:on?$.acc:$.bdr,border:'none',cursor:'pointer',position:'relative',transition:'background 0.2s',flexShrink:0}}><div style={{width:k,height:k,borderRadius:k/2,background:'#fff',position:'absolute',top:(h-k)/2,left:on?w-k-(h-k)/2:(h-k)/2,transition:'left 0.2s',boxShadow:'0 1px 3px rgba(0,0,0,0.2)'}}/></button>}

const Q=({label,sub,name,value,onChange,detail,dLabel,dVal,dChange,d})=>(
  <div style={{marginBottom:d?14:18}}>
    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,marginBottom:4}}>
      <div style={{flex:1}}><p style={{fontSize:d?13:17,fontWeight:600,color:$.h,margin:0,lineHeight:d?'18px':'24px'}}>{label}</p>{sub&&<p style={{fontSize:d?11:14,color:$.txtM,margin:'2px 0 0'}}>{sub}</p>}</div>
      <Toggle value={value} onChange={v=>onChange(name,v)} d={d}/>
    </div>
    {detail&&value==='yes'&&<input value={dVal||''} onChange={e=>dChange(name+'Detail',e.target.value)} placeholder={dLabel} style={{width:'100%',padding:d?'7px 10px':'12px 14px',borderRadius:d?8:10,border:`1px solid ${$.bdr}`,fontSize:d?12:16,marginTop:6,boxSizing:'border-box',fontFamily:$.f,background:$.card,color:$.h}}/>}
  </div>
)

const F=({label,icon,type='text',value,onChange,placeholder,name,d=true})=>(
  <div style={{marginBottom:d?14:18}}>
    <label style={{display:'block',fontSize:d?12:15,fontWeight:600,color:$.txt,marginBottom:4}}>{label}</label>
    <div style={{position:'relative'}}>{icon&&<div style={{position:'absolute',left:10,top:'50%',transform:'translateY(-50%)'}}>{icon}</div>}<input type={type} value={value||''} onChange={e=>onChange(name,e.target.value)} placeholder={placeholder} style={{width:'100%',padding:d?'9px 12px':'14px 16px',paddingLeft:icon?(d?30:34):undefined,borderRadius:d?8:12,border:`1px solid ${$.bdr}`,fontSize:d?12:16,boxSizing:'border-box',fontFamily:$.f,background:$.card,color:$.h}}/></div>
  </div>
)

const CK=({label,sub,checked,onChange,d=true})=>(
  <div onClick={onChange} style={{display:'flex',alignItems:'flex-start',gap:d?10:14,padding:d?'8px 0':'12px 0',cursor:'pointer'}}>
    <div style={{width:d?20:26,height:d?20:26,borderRadius:6,border:checked?'none':`2px solid ${$.bdr}`,background:checked?$.acc:'transparent',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,marginTop:1}}>{checked&&I.chk('#fff',d?10:14)}</div>
    <div><p style={{fontSize:d?13:17,fontWeight:600,color:$.h,margin:0}}>{label}</p>{sub&&<p style={{fontSize:d?11:14,color:$.txtM,margin:'2px 0 0',lineHeight:d?'16px':'20px'}}>{sub}</p>}</div>
  </div>
)

const Alerts=({blocks,flags})=>{if(!blocks.length&&!flags.length)return null;return(
  <div style={{marginTop:16}}>
    {blocks.map((b,i)=><div key={'b'+i} style={{display:'flex',alignItems:'flex-start',gap:10,padding:'12px 14px',background:'#FEF2F2',border:'1px solid #FECACA',borderRadius:10,marginBottom:8}}>{I.block('#EF4444',16)}<div><p style={{fontSize:13,fontWeight:700,color:'#DC2626',margin:0}}>BLOCKED: {b.treatment}</p><p style={{fontSize:11,color:'#991B1B',margin:'2px 0 0'}}>Due to: {b.condition}</p></div></div>)}
    {flags.map((f,i)=><div key={'f'+i} style={{display:'flex',alignItems:'flex-start',gap:10,padding:'12px 14px',background:'#FFFBEB',border:'1px solid #FDE68A',borderRadius:10,marginBottom:8}}>{I.warn('#F59E0B',16)}<div><p style={{fontSize:13,fontWeight:700,color:'#92400E',margin:0}}>CAUTION: {f.treatment}</p><p style={{fontSize:11,color:'#78350F',margin:'2px 0 0'}}>Due to: {f.condition}</p></div></div>)}
  </div>
)}

const SigPad=({onSign,desk:dk})=>{const ref=useRef(null),dr=useRef(false);const s=useCallback(e=>{dr.current=true;const c=ref.current,r=c.getBoundingClientRect(),ctx=c.getContext('2d'),p=e.touches?e.touches[0]:e;ctx.beginPath();ctx.moveTo(p.clientX-r.left,p.clientY-r.top)},[]);const d=useCallback(e=>{if(!dr.current)return;e.preventDefault();const c=ref.current,r=c.getBoundingClientRect(),ctx=c.getContext('2d'),p=e.touches?e.touches[0]:e;ctx.strokeStyle=$.h;ctx.lineWidth=2;ctx.lineCap='round';ctx.lineTo(p.clientX-r.left,p.clientY-r.top);ctx.stroke()},[]);const u=useCallback(()=>{dr.current=false;if(ref.current)onSign(ref.current.toDataURL())},[onSign]);return(
  <div><div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}><p style={{fontSize:dk?14:18,fontWeight:700,color:$.h,margin:0}}>Digital Signature</p><button type="button" onClick={()=>{ref.current.getContext('2d').clearRect(0,0,600,180);onSign(null)}} style={{background:'none',border:'none',color:$.acc,fontSize:12,fontWeight:600,cursor:'pointer'}}>Clear</button></div><canvas ref={ref} width={600} height={180} style={{width:'100%',height:140,border:`2px dashed ${$.bdr}`,borderRadius:10,cursor:'crosshair',background:$.card,touchAction:'none',display:'block'}} onMouseDown={s} onMouseMove={d} onMouseUp={u} onMouseLeave={u} onTouchStart={s} onTouchMove={d} onTouchEnd={u}/><p style={{fontSize:11,color:$.txtL,marginTop:8}}>By signing above, you acknowledge this is a legally binding electronic signature.</p></div>
)}


export default function BookingForm() {
  const { businessSlug } = useParams()
  const [searchParams] = useSearchParams()
  const returnUrl = searchParams.get('returnUrl') || `/${businessSlug}`
  const slug = businessSlug

  const [biz, setBiz] = useState(null)
  const [step, setStep] = useState(0)
  const [fd, setFd] = useState({})
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const topRef = useRef(null)
  const desk = typeof window !== 'undefined' && window.innerWidth >= 768

  const alerts = getAlerts(fd)
  const set = (k, v) => setFd(p => ({ ...p, [k]: v }))
  const goStep = n => { setStep(n); topRef.current?.scrollIntoView({ behavior: 'smooth' }) }
  const canProceed = () => {
    if (step === 0) return fd.fullName && fd.dob && fd.mobile && fd.email && fd.emergencyName && fd.emergencyPhone && fd.gpName
    if (step === 5) return fd.consent1 && fd.consent2 && fd.consent3 && fd.consent4 && fd.signed
    return true
  }

  useEffect(() => {
    if (!slug) return
    apiFetch(`/client/${slug}/info`).then(d => setBiz(d.business || d)).catch(() => {})
  }, [slug])

  const submitForm = async () => {
    setLoading(true)
    setErr('')
    try {
      await apiFetch(`/consultation/public/${slug}/submit`, { method: 'POST', body: JSON.stringify({ form_data: fd, alerts }) })
      setSubmitted(true)
    } catch (e) { setErr(e.message) }
    setLoading(false)
  }

  // Loading
  if (!biz) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: $.bg, fontFamily: $.f }}>
      <link href="https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 28, height: 28, border: `3px solid ${$.bdr}`, borderTopColor: $.acc, borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 10px' }} />
        <p style={{ fontSize: 12, color: $.txtM }}>Loading...</p>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  // Submitted
  if (submitted) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: $.bg, fontFamily: $.f }}>
      <link href="https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      <div style={{ background: $.card, border: `1px solid ${$.bdr}`, borderRadius: 16, maxWidth: 440, width: '100%', textAlign: 'center', padding: 40, margin: 16 }}>
        <div style={{ width: 56, height: 56, borderRadius: 99, background: 'rgba(34,197,94,0.08)', border: '2px solid rgba(34,197,94,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>{I.chk($.ok, 28)}</div>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: $.h, marginBottom: 8 }}>Form Submitted</h2>
        <p style={{ fontSize: 14, color: $.txtM, marginBottom: 24, lineHeight: '22px' }}>Thank you, {fd.fullName}. Your consultation form has been received by {biz?.name}.</p>
        {(alerts.blocks.length > 0 || alerts.flags.length > 0) && <div style={{ textAlign: 'left', marginBottom: 24 }}><Alerts blocks={alerts.blocks} flags={alerts.flags} /></div>}
        <button onClick={() => { window.location.href = returnUrl }} style={{ width: '100%', padding: '14px 0', borderRadius: 99, border: 'none', background: '#111', color: '#C9A84C', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: $.f }}>Return to Booking</button>
      </div>
    </div>
  )

  // Form
  return (
    <div style={{ minHeight: '100vh', background: $.bg, fontFamily: $.f, display: 'flex', flexDirection: 'column' }}>
      <link href="https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div ref={topRef} />

      {/* Header */}
      <div style={{ background: $.card, borderBottom: `1px solid ${$.bdr}`, padding: desk ? '14px 20px' : '16px 16px' }}>
        <div style={{ maxWidth: 680, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#C9A84C', fontSize: 16, fontWeight: 800 }}>R.</span>
          </div>
          <div>
            <p style={{ fontSize: 15, fontWeight: 700, color: $.h, margin: 0 }}>{biz?.name || 'Consultation Form'}</p>
            <p style={{ fontSize: 11, color: $.txtM, margin: 0 }}>Health Questionnaire</p>
          </div>
        </div>
      </div>

      {/* Progress */}
      <div style={{ background: $.card, borderBottom: `1px solid ${$.bdr}`, padding: desk ? '12px 20px 16px' : '14px 16px 18px' }}>
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 6 }}>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: $.acc, margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Step {step + 1} of 6</p>
              <p style={{ fontSize: 16, fontWeight: 700, color: $.h, margin: '1px 0 0' }}>{STEPS[step]}</p>
            </div>
            <span style={{ fontSize: 12, color: $.txtM }}>{Math.round(((step + 1) / 6) * 100)}%</span>
          </div>
          <div style={{ height: 6, background: $.bdr, borderRadius: 3 }}>
            <div style={{ height: '100%', width: `${((step + 1) / 6) * 100}%`, background: $.acc, borderRadius: 3, transition: 'width 0.3s' }} />
          </div>
        </div>
      </div>

      {/* Steps */}
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 120 }}>
        <div style={{ maxWidth: 680, margin: '0 auto', padding: desk ? '24px 20px 0' : '16px 12px 0' }}>

          {step===0&&<div>
            <h2 style={{fontSize:desk?22:24,fontWeight:700,color:$.h,margin:desk?'0 0 4px':'0 0 8px'}}>Personal Details</h2>
            <p style={{fontSize:desk?13:16,color:$.txtM,margin:desk?'0 0 20px':'0 0 24px'}}>Used for your treatment records and emergency contact information.</p>
            <F label="Full Name" icon={I.user($.txtL,12)} name="fullName" value={fd.fullName} onChange={set} d={desk} placeholder="Your full name"/>
            <F label="Date of Birth" type="date" name="dob" value={fd.dob} onChange={set} d={desk}/>
            <F label="Address" name="address" value={fd.address} onChange={set} d={desk} placeholder="Full address"/>
            <div style={{display:'grid',gridTemplateColumns:desk?'1fr 1fr':'1fr',gap:desk?12:0}}><F label="Mobile" icon={I.phone($.txtL,12)} type="tel" name="mobile" value={fd.mobile} onChange={set} d={desk} placeholder="07..."/><F label="Email" icon={I.mail($.txtL,12)} type="email" name="email" value={fd.email} onChange={set} d={desk} placeholder="you@email.com"/></div>
            <div style={{display:'grid',gridTemplateColumns:desk?'1fr 1fr':'1fr',gap:desk?12:0}}><F label="Emergency Contact" name="emergencyName" value={fd.emergencyName} onChange={set} d={desk} placeholder="Contact name"/><F label="Their Number" type="tel" name="emergencyPhone" value={fd.emergencyPhone} onChange={set} d={desk} placeholder="07..."/></div>
            <F label="GP Name" name="gpName" value={fd.gpName} onChange={set} d={desk} placeholder="Dr..."/>
            <F label="GP Surgery (optional)" name="gpAddress" value={fd.gpAddress} onChange={set} d={desk} placeholder="Surgery name"/>
            <div style={{marginBottom:14}}><label style={{display:'block',fontSize:12,fontWeight:600,color:$.txt,marginBottom:4}}>How did you hear about us?</label><select value={fd.referral||''} onChange={e=>set('referral',e.target.value)} style={{width:'100%',padding:desk?'9px 12px':'14px 16px',borderRadius:desk?8:12,border:`1px solid ${$.bdr}`,fontSize:desk?12:16,background:$.card,color:$.h,boxSizing:'border-box',fontFamily:$.f}}><option value="">Select...</option>{['Instagram','TikTok','Google','Friend / Referral','Returning Client','Other'].map(o=><option key={o}>{o}</option>)}</select></div>
            <div style={{background:$.card,borderRadius:10,padding:14,border:`1px solid ${$.bdr}`}}>
              <p style={{fontSize:desk?13:16,fontWeight:700,color:$.acc,margin:desk?'0 0 8px':'0 0 12px'}}>Photo Consent</p>
              <CK label="Treatment records" sub="Clinical use only." checked={fd.photoRecords} onChange={()=>set('photoRecords',!fd.photoRecords)} d={desk}/>
              <CK label="Training purposes" sub="Educational use." checked={fd.photoTraining} onChange={()=>set('photoTraining',!fd.photoTraining)} d={desk}/>
              <CK label="Marketing & social media" sub="May be shared anonymised." checked={fd.photoMarketing} onChange={()=>set('photoMarketing',!fd.photoMarketing)} d={desk}/>
            </div>
          </div>}

          {step===1&&<div>
            <h2 style={{fontSize:desk?22:24,fontWeight:700,color:$.h,margin:desk?'0 0 4px':'0 0 8px'}}>General Health Questionnaire</h2>
            <p style={{fontSize:desk?13:16,color:$.txtM,margin:desk?'0 0 20px':'0 0 24px'}}>Your safety is our priority. Please provide accurate details.</p>
            <Q label="Pregnant, breastfeeding, or trying to conceive?" sub="Some treatments are not suitable during pregnancy." name="pregnant" value={fd.pregnant} onChange={set} d={desk}/>
            <Q label="Do you have a heart pacemaker?" sub="Electronic implants can interfere with certain technologies." name="pacemaker" value={fd.pacemaker} onChange={set} d={desk}/>
            <Q label="Heart condition or high blood pressure?" name="heartCondition" value={fd.heartCondition} onChange={set} detail dLabel="Controlled or uncontrolled?" dVal={fd.heartConditionDetail} dChange={set} d={desk}/>
            <Q label="Metal implants, plates, or screws?" name="metalImplants" value={fd.metalImplants} onChange={set} detail dLabel="Location" dVal={fd.metalImplantsDetail} dChange={set} d={desk}/>
            <Q label="Diabetes?" sub="May affect wound healing." name="diabetes" value={fd.diabetes} onChange={set} detail dLabel="Type 1/2? Controlled?" dVal={fd.diabetesDetail} dChange={set} d={desk}/>
            <Q label="History of epilepsy or seizures?" sub="Light therapies may require precautions." name="epilepsy" value={fd.epilepsy} onChange={set} d={desk}/>
            <Q label="Autoimmune disorders?" sub="Conditions like Lupus may affect healing." name="autoimmune" value={fd.autoimmune} onChange={set} detail dLabel="Condition" dVal={fd.autoimmuneDetail} dChange={set} d={desk}/>
            <Q label="Blood clotting disorder?" name="bloodClotting" value={fd.bloodClotting} onChange={set} d={desk}/>
            <Q label="Cancer history?" name="activeCancer" value={fd.activeCancer} onChange={set} detail dLabel="Type, when, status" dVal={fd.activeCancerDetail} dChange={set} d={desk}/>
            <Q label="HIV/AIDS or hepatitis?" name="hivHepatitis" value={fd.hivHepatitis} onChange={set} d={desk}/>
            <Q label="Liver or kidney disease?" name="liverKidney" value={fd.liverKidney} onChange={set} d={desk}/>
            <Q label="History of cold sores (herpes simplex)?" name="herpes" value={fd.herpes} onChange={set} d={desk}/>
            <Q label="History of keloid or raised scarring?" name="keloid" value={fd.keloid} onChange={set} d={desk}/>
            <Alerts blocks={alerts.blocks} flags={alerts.flags}/>
          </div>}

          {step===2&&<div>
            <h2 style={{fontSize:desk?22:24,fontWeight:700,color:$.h,margin:desk?'0 0 4px':'0 0 8px'}}>Medication History</h2>
            <p style={{fontSize:13,color:$.txtM,margin:'0 0 4px',fontStyle:'italic'}}>Your safety is our priority. Please be as detailed as possible.</p>
            <div style={{height:1,background:$.bdr,margin:'12px 0 20px'}}/>
            <Q label="Roaccutane / Accutane" sub="Have you taken Isotretinoin in the last 6 months?" name="roaccutane" value={fd.roaccutane} onChange={set} detail dLabel="Dosage and stop date" dVal={fd.roaccutaneDetail} dChange={set} d={desk}/>
            <Q label="Blood Thinning Medication" sub="Warfarin, Aspirin, Clopidogrel etc." name="bloodThinners" value={fd.bloodThinners} onChange={set} detail dLabel="Which medication?" dVal={fd.bloodThinnersDetail} dChange={set} d={desk}/>
            <Q label="Photosensitising medications?" sub="Tetracyclines, doxycycline, St John's Wort" name="photosensitising" value={fd.photosensitising} onChange={set} detail dLabel="Which?" dVal={fd.photosensitivesDetail} dChange={set} d={desk}/>
            <Q label="Topical retinoids?" sub="Retin-A, Tretinoin, Differin, Epiduo" name="retinoids" value={fd.retinoids} onChange={set} detail dLabel="Product and last used" dVal={fd.retinoidsDetail} dChange={set} d={desk}/>
            <Q label="Steroids (oral or topical)?" name="steroids" value={fd.steroids} onChange={set} detail dLabel="Which?" dVal={fd.steroidsDetail} dChange={set} d={desk}/>
            <Q label="Immunosuppressants?" name="immunosuppressants" value={fd.immunosuppressants} onChange={set} d={desk}/>
            <Q label="Herbal supplements?" sub="Garlic, ginkgo, fish oils affect bleeding." name="herbalSupps" value={fd.herbalSupps} onChange={set} detail dLabel="Which?" dVal={fd.herbalSuppsDetail} dChange={set} d={desk}/>
            <Q label="Fish or salmon allergy?" sub="Important for polynucleotide treatments." name="fishAllergy" value={fd.fishAllergy} onChange={set} d={desk}/>
            <Alerts blocks={alerts.blocks} flags={alerts.flags}/>
          </div>}

          {step===3&&<div>
            <h2 style={{fontSize:desk?22:24,fontWeight:700,color:$.h,margin:desk?'0 0 4px':'0 0 8px'}}>Skin History</h2>
            <p style={{fontSize:desk?13:16,color:$.txtM,margin:desk?'0 0 20px':'0 0 24px'}}>Tell us about your skin type and concerns to personalise your treatment plan.</p>
            <div style={{marginBottom:20}}>
              <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:6}}>{I.shield($.acc,14)}<p style={{fontSize:desk?14:18,fontWeight:700,color:$.h,margin:0}}>Fitzpatrick Skin Type</p></div>
              <p style={{fontSize:12,color:$.txtM,margin:'0 0 12px'}}>Select the tone matching your reaction to sun exposure.</p>
              <div style={{display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:desk?10:6}}>
                {[{v:'I',bg:'#FDEBD0',x:'Always Burns'},{v:'II',bg:'#F5CBA7',x:'Usually Burns'},{v:'III',bg:'#E0B88A',x:'Sometimes'},{v:'IV',bg:'#C4956A',x:'Rarely Burns'},{v:'V',bg:'#8B6914',x:'Very Rarely'},{v:'VI',bg:'#5C4033',x:'Never Burns'}].map(t=><button key={t.v} type="button" onClick={()=>set('fitzpatrick',t.v)} style={{padding:desk?10:6,borderRadius:8,border:fd.fitzpatrick===t.v?`2px solid ${$.acc}`:`2px solid ${$.bdr}`,background:$.card,cursor:'pointer',textAlign:'center'}}><div style={{width:desk?44:28,height:desk?44:28,borderRadius:99,margin:'0 auto 4px',background:t.bg}}/><p style={{fontSize:desk?12:10,fontWeight:700,color:$.h,margin:0}}>Type {t.v}</p>{desk&&<p style={{fontSize:9,color:$.txtM,margin:'1px 0 0',textTransform:'uppercase'}}>{t.x}</p>}</button>)}
              </div>
            </div>
            <div style={{marginBottom:20}}>
              <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:6}}>{I.warn($.acc,14)}<p style={{fontSize:desk?14:18,fontWeight:700,color:$.h,margin:0}}>Main Skin Concerns</p></div>
              <p style={{fontSize:12,color:$.txtM,margin:'0 0 10px'}}>Select all that apply.</p>
              <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
                {['Acne & Breakouts','Scarring','Hyperpigmentation','Fine Lines & Wrinkles','Rosacea & Redness','Dryness & Flaking','Oiliness','Large Pores','Sun Damage','Texture & Dullness'].map(c=><button key={c} type="button" onClick={()=>{const x=fd.concerns||[];set('concerns',x.includes(c)?x.filter(z=>z!==c):[...x,c])}} style={{padding:desk?'6px 14px':'10px 20px',borderRadius:99,fontSize:desk?12:15,fontWeight:600,border:(fd.concerns||[]).includes(c)?`2px solid ${$.acc}`:`2px solid ${$.bdr}`,background:(fd.concerns||[]).includes(c)?'rgba(200,163,76,0.08)':$.card,color:(fd.concerns||[]).includes(c)?$.acc:$.txtM,cursor:'pointer'}}>{c}</button>)}
              </div>
            </div>
            <Q label="Active skin infection?" name="skinInfection" value={fd.skinInfection} onChange={set} d={desk}/>
            <Q label="Tattoos or permanent makeup in treatment area?" name="tattoos" value={fd.tattoos} onChange={set} d={desk}/>
            <Q label="Previous adverse reactions to skin treatments?" name="adverseReactions" value={fd.adverseReactions} onChange={set} detail dLabel="What happened?" dVal={fd.adverseReactionsDetail} dChange={set} d={desk}/>
            <Alerts blocks={alerts.blocks} flags={alerts.flags}/>
          </div>}

          {step===4&&<div>
            <h2 style={{fontSize:desk?22:24,fontWeight:700,color:$.h,margin:desk?'0 0 4px':'0 0 8px'}}>Lifestyle</h2>
            <p style={{fontSize:desk?13:16,color:$.txtM,margin:desk?'0 0 20px':'0 0 24px'}}>Sun exposure and lifestyle factors affect treatment safety.</p>
            <Q label="Significant sun exposure in the last 2 weeks?" name="sunburn" value={fd.sunburn} onChange={set} d={desk}/>
            <Q label="Sunbed use in the last 4 weeks?" name="sunbed" value={fd.sunbed} onChange={set} d={desk}/>
            <Q label="Currently have a tan (natural or self-tan)?" name="tan" value={fd.tan} onChange={set} d={desk}/>
            <Q label="Planned sun exposure in next 4 weeks?" sub="Holiday, outdoor event etc." name="plannedSun" value={fd.plannedSun} onChange={set} d={desk}/>
            <Q label="Do you smoke?" sub="Affects wound healing." name="smoker" value={fd.smoker} onChange={set} d={desk}/>
            <Alerts blocks={alerts.blocks} flags={alerts.flags}/>
          </div>}

          {step===5&&<div>
            <h2 style={{fontSize:desk?22:24,fontWeight:700,color:$.h,margin:desk?'0 0 4px':'0 0 8px'}}>Legal Consent & Signature</h2>
            <p style={{fontSize:desk?13:16,color:$.txtM,margin:desk?'0 0 20px':'0 0 24px'}}>Please review each statement and provide your digital signature.</p>
            {alerts.blocks.length>0&&<Alerts blocks={alerts.blocks} flags={alerts.flags}/>}
            <div style={{background:$.card,border:`1px solid ${$.bdr}`,borderRadius:10,padding:20,marginBottom:20}}>
              <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:14}}>{I.shield($.acc,14)}<p style={{fontSize:desk?14:18,fontWeight:700,color:$.h,margin:0}}>Terms of Service</p></div>
              <CK label="Information Accuracy" sub="I confirm all information provided is accurate and complete." checked={fd.consent1} onChange={()=>set('consent1',!fd.consent1)} d={desk}/>
              <CK label="Medical Disclosure" sub="I have disclosed all allergies, conditions, and medications. Withholding info may lead to adverse reactions." checked={fd.consent2} onChange={()=>set('consent2',!fd.consent2)} d={desk}/>
              <CK label="Treatment Consent" sub="I authorize the recommended procedures. Results may vary and are not guaranteed." checked={fd.consent3} onChange={()=>set('consent3',!fd.consent3)} d={desk}/>
              <CK label="Privacy Policy" sub="I consent to storage of my personal and medical data for treatment purposes." checked={fd.consent4} onChange={()=>set('consent4',!fd.consent4)} d={desk}/>
            </div>
            <SigPad onSign={s=>set('signed',s)} desk={desk}/>
          </div>}

          {err && <p style={{ color: $.err, fontSize: 13, fontWeight: 600, marginTop: 12 }}>{err}</p>}
        </div>
      </div>

      {/* Nav buttons */}
      <div style={{ borderTop: `1px solid ${$.bdr}`, padding: desk ? '16px 20px' : '16px 16px', flexShrink: 0, background: $.card }}>
        <div style={{ maxWidth: 680, margin: '0 auto', display: 'flex', flexDirection: desk ? 'row' : 'column', gap: desk ? 0 : 10, justifyContent: 'space-between' }}>
          {step < 5
            ? <button onClick={() => canProceed() && goStep(step + 1)} disabled={!canProceed()} style={{ padding: desk ? '8px 24px' : '16px 0', borderRadius: 99, border: 'none', background: canProceed() ? $.acc : $.bdr, color: canProceed() ? '#111' : $.txtL, fontSize: desk ? 12 : 16, fontWeight: 700, cursor: canProceed() ? 'pointer' : 'not-allowed', fontFamily: $.f, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, order: desk ? 2 : 1, width: desk ? 'auto' : '100%' }}>Continue to Step {step + 2} {I.arr(canProceed() ? '#111' : '#999', 14)}</button>
            : <button onClick={() => canProceed() && submitForm()} disabled={!canProceed() || loading} style={{ padding: desk ? '8px 24px' : '16px 0', borderRadius: 99, border: 'none', background: canProceed() && !loading ? $.acc : $.bdr, color: canProceed() ? '#111' : $.txtL, fontSize: desk ? 12 : 16, fontWeight: 700, cursor: canProceed() ? 'pointer' : 'not-allowed', fontFamily: $.f, width: desk ? 'auto' : '100%', order: desk ? 2 : 1 }}>{loading ? 'Submitting...' : 'Submit Form'}</button>
          }
          {step > 0 && <button onClick={() => goStep(step - 1)} style={{ padding: desk ? '8px 20px' : '12px 0', borderRadius: 99, border: `1px solid ${$.bdr}`, background: $.card, fontSize: desk ? 12 : 15, fontWeight: 600, color: $.txtM, cursor: 'pointer', fontFamily: $.f, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, order: desk ? 1 : 2, width: desk ? 'auto' : '100%' }}>{I.back($.txtM, 12)} Back</button>}
        </div>
      </div>

      {/* Powered by */}
      <div style={{ textAlign: 'center', padding: '12px 0 20px', fontSize: 11, color: $.txtL }}>Powered by <strong style={{ color: $.h }}>ReeveOS</strong></div>
    </div>
  )
}
