import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams } from 'react-router-dom'

const API = '/api'

// ═══════════════════════════════════════════════════════════════
// API HELPERS
// ═══════════════════════════════════════════════════════════════
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

// ═══════════════════════════════════════════════════════════════
// CONTRAINDICATION ENGINE
// ═══════════════════════════════════════════════════════════════
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

// ═══════════════════════════════════════════════════════════════
// SVG ICONS — monochrome, no emojis
// ═══════════════════════════════════════════════════════════════
const Ico = ({ d, size = 18, color = '#6B7280', sw = 1.8 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>
)
const P = {
  calendar: 'M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z',
  clipboard: 'M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2M9 2h6a1 1 0 011 1v1a1 1 0 01-1 1H9a1 1 0 01-1-1V3a1 1 0 011-1z',
  user: 'M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 3a4 4 0 110 8 4 4 0 010-8z',
  chat: 'M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z',
  check: 'M5 13l4 4L19 7',
  back: 'M19 12H5M12 19l-7-7 7-7',
  filePlus: 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6M12 18v-6M9 15h6',
  shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
  clock: 'M12 2a10 10 0 110 20 10 10 0 010-20zM12 6v6l4 2',
  ban: 'M12 2a10 10 0 110 20 10 10 0 010-20zM4.93 4.93l14.14 14.14',
  warn: 'M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01',
  eye: 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 110 6 3 3 0 010-6z',
  out: 'M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9',
}

// ═══════════════════════════════════════════════════════════════
// SHARED UI COMPONENTS
// ═══════════════════════════════════════════════════════════════
const STEPS = ['Personal', 'Medical', 'Medications', 'Skin', 'Lifestyle', 'Consent']

const YesNo = ({ label, name, value, onChange, detail, detailLabel, detailValue, onDetailChange, sublabel, accent }) => (
  <div style={{ marginBottom: 14 }}>
    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#111', marginBottom: 4 }}>{label}</label>
    {sublabel && <p style={{ fontSize: 10, color: '#9CA3AF', margin: '-2px 0 6px', lineHeight: 1.3 }}>{sublabel}</p>}
    <div style={{ display: 'flex', gap: 8 }}>
      <button type="button" onClick={() => onChange(name, 'yes')}
        style={{ flex: 1, padding: '10px 0', borderRadius: 10, fontSize: 12, fontWeight: 700, border: value === 'yes' ? `2px solid ${accent}` : '2px solid #E5E7EB', background: value === 'yes' ? accent + '10' : '#fff', color: value === 'yes' ? accent : '#9CA3AF', cursor: 'pointer', transition: 'all .15s' }}>Yes</button>
      <button type="button" onClick={() => onChange(name, 'no')}
        style={{ flex: 1, padding: '10px 0', borderRadius: 10, fontSize: 12, fontWeight: 700, border: value === 'no' ? '2px solid #34D399' : '2px solid #E5E7EB', background: value === 'no' ? '#ECFDF5' : '#fff', color: value === 'no' ? '#059669' : '#9CA3AF', cursor: 'pointer', transition: 'all .15s' }}>No</button>
    </div>
    {value === 'yes' && detail && (
      <input type="text" placeholder={detailLabel || 'Please provide details...'} value={detailValue || ''}
        onChange={e => onDetailChange(name + 'Detail', e.target.value)}
        style={{ marginTop: 8, width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #E5E7EB', fontSize: 12, outline: 'none', boxSizing: 'border-box', background: '#fff', color: '#111', transition: 'border .15s' }}
        onFocus={e => e.target.style.borderColor = accent} onBlur={e => e.target.style.borderColor = '#E5E7EB'} />
    )}
  </div>
)

const Inp = ({ label, type = 'text', name, value, onChange, placeholder, accent = '#C9A84C' }) => (
  <div style={{ marginBottom: 14 }}>
    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>{label}</label>
    <input type={type} value={value || ''} placeholder={placeholder} onChange={e => onChange(name, e.target.value)}
      style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #E5E7EB', fontSize: 12, outline: 'none', background: '#fff', color: '#111', boxSizing: 'border-box', transition: 'border .15s' }}
      onFocus={e => e.target.style.borderColor = accent} onBlur={e => e.target.style.borderColor = '#E5E7EB'} />
  </div>
)

const Tick = ({ label, checked, onChange, accent }) => (
  <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px', borderRadius: 10, cursor: 'pointer', transition: 'background .15s' }}
    onMouseEnter={e => e.currentTarget.style.background = '#F9FAFB'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
    <div style={{ width: 18, height: 18, marginTop: 1, borderRadius: 5, border: checked ? 'none' : '2px solid #D1D5DB', background: checked ? accent : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all .15s' }}>
      {checked && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3} strokeLinecap="round"><path d="M5 13l4 4L19 7" /></svg>}
    </div>
    <span style={{ fontSize: 12, color: '#4B5563', lineHeight: 1.4 }}>{label}</span>
  </label>
)

const AlertBanner = ({ blocks, flags, accent }) => {
  if (!blocks.length && !flags.length) return null
  return (
    <div style={{ marginTop: 16 }}>
      {blocks.length > 0 && (
        <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 12, padding: 14, marginBottom: flags.length ? 10 : 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <Ico d={P.ban} size={16} color="#DC2626" sw={2} />
            <span style={{ fontSize: 12, fontWeight: 700, color: '#B91C1C' }}>Treatments Blocked</span>
          </div>
          {blocks.map((b, i) => <p key={i} style={{ fontSize: 11, color: '#DC2626', margin: '3px 0', paddingLeft: 24 }}>{b.treatment} — {b.condition}</p>)}
        </div>
      )}
      {flags.length > 0 && (
        <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 12, padding: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <Ico d={P.warn} size={16} color="#D97706" sw={2} />
            <span style={{ fontSize: 12, fontWeight: 700, color: '#92400E' }}>Therapist Review Required</span>
          </div>
          {flags.map((f, i) => <p key={i} style={{ fontSize: 11, color: '#B45309', margin: '3px 0', paddingLeft: 24 }}>{f.treatment} — {f.condition}</p>)}
        </div>
      )}
    </div>
  )
}

const SignaturePad = ({ onSign, accent = '#C9A84C' }) => {
  const ref = useRef(null)
  const [drawing, setDrawing] = useState(false)
  const [signed, setSigned] = useState(false)
  const pos = (e) => { const r = ref.current.getBoundingClientRect(); const t = e.touches ? e.touches[0] : e; return { x: t.clientX - r.left, y: t.clientY - r.top } }
  const start = (e) => { e.preventDefault(); setDrawing(true); const ctx = ref.current.getContext('2d'); ctx.beginPath(); const p = pos(e); ctx.moveTo(p.x, p.y) }
  const move = (e) => { if (!drawing) return; e.preventDefault(); const ctx = ref.current.getContext('2d'); ctx.strokeStyle = '#111'; ctx.lineWidth = 2; ctx.lineCap = 'round'; const p = pos(e); ctx.lineTo(p.x, p.y); ctx.stroke() }
  const end = () => { setDrawing(false); setSigned(true); onSign(ref.current.toDataURL()) }
  const clear = () => { ref.current.getContext('2d').clearRect(0, 0, 400, 120); setSigned(false); onSign(null) }
  return (
    <div>
      <div style={{ position: 'relative', borderRadius: 12, border: `2px dashed ${signed ? accent : '#D1D5DB'}`, background: '#FAFAFA', overflow: 'hidden' }}>
        <canvas ref={ref} width={400} height={120} style={{ display: 'block', width: '100%', height: 120, cursor: 'crosshair', touchAction: 'none' }}
          onMouseDown={start} onMouseMove={move} onMouseUp={end} onMouseLeave={() => drawing && end()}
          onTouchStart={start} onTouchMove={move} onTouchEnd={end} />
        {!signed && <p style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', fontSize: 12, color: '#D1D5DB', pointerEvents: 'none', margin: 0 }}>Sign here</p>}
      </div>
      {signed && <button type="button" onClick={clear} style={{ marginTop: 6, background: 'none', border: 'none', fontSize: 11, color: '#9CA3AF', cursor: 'pointer', textDecoration: 'underline' }}>Clear</button>}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function ClientPortal() {
  const { slug } = useParams()
  const [view, setView] = useState('loading')
  const [authMode, setAuthMode] = useState('login')
  const [biz, setBiz] = useState(null)
  const [user, setUser] = useState(null)
  const [myData, setMyData] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [winW, setWinW] = useState(typeof window !== 'undefined' ? window.innerWidth : 390)
  const [step, setStep] = useState(0)
  const [fd, setFd] = useState({})
  const topRef = useRef(null)

  const dk = winW >= 768
  const accent = biz?.accent_color || '#C9A84C'
  const bg = biz?.bg_color || '#111111'

  useEffect(() => { const fn = () => setWinW(window.innerWidth); window.addEventListener('resize', fn); return () => window.removeEventListener('resize', fn) }, [])

  const set = (k, v) => setFd(p => ({ ...p, [k]: v }))
  const alerts = getAlerts(fd)

  useEffect(() => {
    if (!slug) return
    apiFetch(`/client/${slug}/info`)
      .then(data => {
        setBiz(data)
        const token = sessionStorage.getItem('client_token')
        if (token) { apiFetch('/client/auth/me').then(u => { setUser(u); setView('home') }).catch(() => { sessionStorage.removeItem('client_token'); setView('auth') }) }
        else { setView('auth') }
      })
      .catch(() => setView('not_found'))
  }, [slug])

  useEffect(() => { if (user && slug && view === 'home') { apiFetch(`/client/${slug}/my-data`).then(setMyData).catch(() => {}) } }, [user, slug, view])
  useEffect(() => { topRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [step])

  const handleAuth = async (e) => {
    if (e?.preventDefault) e.preventDefault()
    setError(''); setLoading(true)
    try {
      const ep = authMode === 'signup' ? '/client/auth/signup' : '/client/auth/login'
      const body = authMode === 'signup'
        ? { name: fd.authName, email: fd.authEmail, phone: fd.authPhone, password: fd.authPassword, business_id: biz.business_id }
        : { email: fd.authEmail, password: fd.authPassword }
      const data = await apiFetch(ep, { method: 'POST', body: JSON.stringify(body) })
      sessionStorage.setItem('client_token', data.token); setUser(data.user); setView('home')
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  const logout = () => { sessionStorage.removeItem('client_token'); setUser(null); setMyData(null); setView('auth'); setFd({}); setStep(0) }

  const submitForm = async () => {
    setLoading(true)
    try {
      await apiFetch(`/consultation/public/${slug}/submit`, { method: 'POST', body: JSON.stringify({ form_data: fd }) })
      setView('submitted')
      if (user) apiFetch(`/client/${slug}/my-data`).then(setMyData).catch(() => {})
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  const canProceed = () => {
    if (step === 0) return fd.fullName && fd.dob && fd.mobile && fd.email && fd.emergencyName && fd.emergencyPhone && fd.gpName
    if (step === 5) return fd.consent1 && fd.consent2 && fd.consent3 && fd.consent4 && fd.consent5 && fd.consent6 && fd.consent7 && fd.consent8 && fd.signed
    return true
  }

  // ─── tokens ───
  const S = { minHeight: '100vh', background: '#FAFAF8', fontFamily: "'Figtree', sans-serif" }
  const C = { background: '#fff', borderRadius: 14, border: '1px solid #F0F0F0', padding: 18, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }
  const B1 = { width: '100%', padding: '12px 0', borderRadius: 12, border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer', background: accent, color: '#fff', transition: 'opacity .15s' }
  const B2 = { width: '100%', padding: '12px 0', borderRadius: 12, border: '1px solid #E5E7EB', fontSize: 13, fontWeight: 600, cursor: 'pointer', background: '#fff', color: '#6B7280', transition: 'all .15s' }
  const pw = <p style={{ textAlign: 'center', fontSize: 10, color: '#D1D5DB', marginTop: 32 }}>Powered by <span style={{ fontWeight: 700, color: accent }}>ReeveOS</span></p>

  const BrandHead = ({ title, showBack, onBack, compact }) => (
    <div style={{ background: bg, position: 'relative', overflow: 'hidden' }}>
      {biz?.banner_url && (<div style={{ position: 'absolute', inset: 0 }}><img src={biz.banner_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /><div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to bottom, ${bg}88 0%, ${bg}CC 50%, ${bg} 100%)` }} /></div>)}
      <div style={{ position: 'relative', padding: compact ? '20px 16px 16px' : '32px 16px 24px', textAlign: 'center' }}>
        {showBack && (<button onClick={onBack} style={{ position: 'absolute', top: 12, left: 12, background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: 8, padding: '6px 14px', color: '#ccc', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}><Ico d={P.back} size={14} color="#ccc" /> Back</button>)}
        <div style={{ width: compact ? 40 : 52, height: compact ? 40 : 52, borderRadius: compact ? 12 : 16, background: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', fontSize: compact ? 16 : 20, fontWeight: 800, color: bg, boxShadow: `0 4px 16px ${accent}50` }}>{biz?.name?.charAt(0) || 'R'}</div>
        <h1 style={{ fontSize: compact ? 18 : 22, fontWeight: 800, color: accent, letterSpacing: '-0.02em', margin: 0 }}>{biz?.name || ''}</h1>
        {biz?.subtitle && <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.15em', textTransform: 'uppercase', margin: '3px 0 0' }}>{biz.subtitle}</p>}
        {title && (<div style={{ display: 'inline-block', marginTop: 10, padding: '5px 16px', borderRadius: 20, background: accent + '22' }}><span style={{ fontSize: 11, fontWeight: 600, color: accent }}>{title}</span></div>)}
      </div>
    </div>
  )

  // ════════ LOADING ════════
  if (view === 'loading') return (
    <div style={{ ...S, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <link href="https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 48, height: 48, borderRadius: 14, background: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 20, fontWeight: 800, color: '#fff', boxShadow: `0 4px 16px ${accent}40`, animation: 'cpPulse 1.5s ease-in-out infinite' }}>R</div>
        <p style={{ fontSize: 13, color: '#9CA3AF', fontWeight: 500 }}>Loading...</p>
        <style>{`@keyframes cpPulse{0%,100%{opacity:1}50%{opacity:.6}}`}</style>
      </div>
    </div>
  )

  // ════════ NOT FOUND ════════
  if (view === 'not_found') return (
    <div style={{ ...S, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <link href="https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      <div style={{ textAlign: 'center', padding: 32 }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}><Ico d={P.warn} size={24} color="#DC2626" /></div>
        <p style={{ fontSize: 16, fontWeight: 700, color: '#111' }}>Business not found</p>
        <p style={{ fontSize: 13, color: '#9CA3AF', marginTop: 6 }}>Check the link and try again</p>
      </div>
    </div>
  )

  // ════════ AUTH ════════
  if (view === 'auth') {
    const form = (
      <div style={{ maxWidth: 380, width: '100%' }}>
        <h2 style={{ fontSize: 24, fontWeight: 800, color: '#111', marginBottom: 4, letterSpacing: '-0.02em' }}>{authMode === 'signup' ? 'Create Your Account' : 'Welcome Back'}</h2>
        <p style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 28 }}>{authMode === 'signup' ? `Join ${biz?.name || ''} to manage your bookings` : `Sign in to your ${biz?.name || ''} account`}</p>
        {authMode === 'signup' && <Inp label="Full Name" name="authName" value={fd.authName} onChange={set} placeholder="Your name" accent={accent} />}
        <Inp label="Email" type="email" name="authEmail" value={fd.authEmail} onChange={set} placeholder="you@email.com" accent={accent} />
        {authMode === 'signup' && <Inp label="Phone" type="tel" name="authPhone" value={fd.authPhone} onChange={set} placeholder="07..." accent={accent} />}
        <Inp label="Password" type="password" name="authPassword" value={fd.authPassword} onChange={set} placeholder={authMode === 'signup' ? 'Min 8 characters' : 'Your password'} accent={accent} />
        {error && <div style={{ fontSize: 12, color: '#DC2626', marginBottom: 14, padding: '10px 14px', background: '#FEF2F2', borderRadius: 10, border: '1px solid #FECACA' }}>{error}</div>}
        <button onClick={handleAuth} disabled={loading} style={{ ...B1, opacity: loading ? 0.6 : 1, marginBottom: 16 }}>{loading ? 'Please wait...' : authMode === 'signup' ? 'Create Account' : 'Log In'}</button>
        <p style={{ fontSize: 12, color: '#9CA3AF', textAlign: 'center' }}>
          {authMode === 'signup' ? 'Already have an account? ' : "Don't have an account? "}
          <button onClick={() => { setAuthMode(authMode === 'signup' ? 'login' : 'signup'); setError('') }} style={{ background: 'none', border: 'none', color: accent, fontWeight: 700, cursor: 'pointer', fontSize: 12 }}>{authMode === 'signup' ? 'Log in' : 'Sign up'}</button>
        </p>
      </div>
    )
    return (
      <div style={S}>
        <link href="https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
        {dk ? (
          <div style={{ display: 'flex', minHeight: '100vh' }}>
            <div style={{ width: '52%', position: 'relative', overflow: 'hidden', background: bg }}>
              {biz?.banner_url && <img src={biz.banner_url} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />}
              <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg, ${bg}CC 0%, ${bg}EE 50%, ${bg}DD 100%)` }} />
              <div style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 48 }}>
                <div style={{ width: 72, height: 72, borderRadius: 20, background: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, fontWeight: 800, color: bg, boxShadow: `0 8px 32px ${accent}50`, marginBottom: 20 }}>{biz?.name?.charAt(0) || 'R'}</div>
                <h1 style={{ fontSize: 38, fontWeight: 800, color: accent, letterSpacing: '-0.03em', margin: 0 }}>{biz?.name || ''}</h1>
                {biz?.subtitle && <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.2em', textTransform: 'uppercase', marginTop: 6 }}>{biz.subtitle}</p>}
                {biz?.address && typeof biz.address === 'string' && <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 16 }}>{biz.address}</p>}
              </div>
            </div>
            <div style={{ width: '48%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 48, background: '#fff' }}>
              {form}
              <p style={{ fontSize: 10, color: '#D1D5DB', marginTop: 40 }}>Powered by <span style={{ fontWeight: 700, color: accent }}>ReeveOS</span></p>
            </div>
          </div>
        ) : (
          <><BrandHead title={authMode === 'signup' ? 'Create Account' : 'Welcome Back'} /><div style={{ maxWidth: 420, margin: '0 auto', padding: '20px 16px 40px' }}><div style={C}>{form}</div>{pw}</div></>
        )}
      </div>
    )
  }

  // ════════ HOME ════════
  if (view === 'home') {
    const cs = myData?.consultation
    const hasForm = cs && cs.status !== 'expired'
    const upcoming = myData?.upcoming_bookings || []
    const past = myData?.past_bookings || []
    const isSalon = biz?.type === 'salon' || biz?.type === 'local_service' || biz?.category === 'salon'

    const QA = ({ icon, label, onClick }) => (
      <button onClick={onClick} style={{ ...C, cursor: 'pointer', textAlign: 'center', padding: '20px 12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, transition: 'all .15s', width: '100%' }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = accent + '40'; e.currentTarget.style.boxShadow = `0 4px 12px ${accent}12` }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = '#F0F0F0'; e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)' }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: '#F9FAFB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Ico d={icon} size={20} color={accent} /></div>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{label}</span>
      </button>
    )

    return (
      <div style={S}>
        <link href="https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
        {/* Top bar */}
        <div style={{ background: '#fff', borderBottom: '1px solid #F0F0F0', padding: '14px 20px' }}>
          <div style={{ maxWidth: dk ? 960 : 480, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 38, height: 38, borderRadius: '50%', background: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#fff' }}>{(user?.name || '?').charAt(0)}</div>
              <div><p style={{ fontSize: 14, fontWeight: 700, color: '#111', margin: 0 }}>Hi {(user?.name || '').split(' ')[0]}</p><p style={{ fontSize: 11, color: '#9CA3AF', margin: 0 }}>{biz?.name}</p></div>
            </div>
            <button onClick={logout} style={{ background: 'none', border: '1px solid #E5E7EB', borderRadius: 8, padding: '6px 14px', color: '#9CA3AF', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}><Ico d={P.out} size={14} color="#9CA3AF" /> Log out</button>
          </div>
        </div>

        <div style={{ maxWidth: dk ? 960 : 480, margin: '0 auto', padding: dk ? '28px 24px 40px' : '20px 16px 40px' }}>
          <div style={dk ? { display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 24, alignItems: 'start' } : {}}>
            {/* LEFT */}
            <div>
              {isSalon && (
                <div style={{ ...C, marginBottom: 16, borderLeft: `4px solid ${hasForm ? '#22C55E' : accent}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: hasForm ? '#F0FDF4' : accent + '12', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {hasForm ? <Ico d={P.check} size={20} color="#22C55E" sw={2.5} /> : <Ico d={P.clipboard} size={20} color={accent} />}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 14, fontWeight: 700, color: hasForm ? '#15803D' : '#111', margin: 0 }}>{hasForm ? 'Consultation Form Complete' : 'Consultation Form Required'}</p>
                      <p style={{ fontSize: 12, color: hasForm ? '#16A34A' : '#6B7280', margin: '2px 0 0' }}>{hasForm ? `Valid until ${new Date(cs.expires_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}` : 'Please complete before your appointment'}</p>
                    </div>
                  </div>
                  {!hasForm && <button onClick={() => { setStep(0); setView('form') }} style={{ ...B1, marginTop: 14 }}>Complete Consultation Form</button>}
                </div>
              )}
              {isSalon && cs?.alerts?.blocks?.length > 0 && (
                <div style={{ ...C, marginBottom: 16, background: '#FEF2F2', border: '1px solid #FECACA' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}><Ico d={P.ban} size={16} color="#DC2626" sw={2} /><span style={{ fontSize: 12, fontWeight: 700, color: '#B91C1C' }}>Blocked Treatments</span></div>
                  {cs.alerts.blocks.map((b, i) => <p key={i} style={{ fontSize: 11, color: '#DC2626', margin: '3px 0', paddingLeft: 24 }}>{b.label || b.treatment} — {b.condition}</p>)}
                </div>
              )}
              <div style={{ marginBottom: 16 }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: '#111', marginBottom: 10 }}>Upcoming</p>
                {upcoming.length > 0 ? upcoming.map((b, i) => (
                  <div key={i} style={{ ...C, marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 700, color: '#111', margin: 0 }}>{b.service || 'Treatment'}</p>
                      <p style={{ fontSize: 12, color: '#6B7280', margin: '3px 0 0', display: 'flex', alignItems: 'center', gap: 6 }}><Ico d={P.clock} size={13} color="#9CA3AF" /> {b.date} · {b.time}{b.staff ? ` · ${b.staff}` : ''}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 20, background: hasForm ? '#F0FDF4' : '#FFFBEB' }}>
                      <div style={{ width: 7, height: 7, borderRadius: '50%', background: hasForm ? '#22C55E' : '#EAB308' }} />
                      <span style={{ fontSize: 10, fontWeight: 600, color: hasForm ? '#16A34A' : '#CA8A04' }}>{hasForm ? 'Ready' : 'Form needed'}</span>
                    </div>
                  </div>
                )) : (
                  <div style={{ ...C, textAlign: 'center', padding: 28 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: '#F9FAFB', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}><Ico d={P.calendar} size={22} color="#D1D5DB" /></div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#9CA3AF', margin: 0 }}>No upcoming appointments</p>
                    <p style={{ fontSize: 11, color: '#D1D5DB', margin: '4px 0 0' }}>Book your next treatment to get started</p>
                  </div>
                )}
              </div>
            </div>
            {/* RIGHT */}
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
                <QA icon={P.calendar} label="Book Appointment" onClick={() => window.open(`/${slug}`, '_blank')} />
                {isSalon && <QA icon={P.clipboard} label={hasForm ? 'View Form' : 'Fill Form'} onClick={() => { setStep(0); setView('form') }} />}
                <QA icon={P.user} label="My Profile" onClick={() => {}} />
                <QA icon={P.chat} label="Message Us" onClick={() => {}} />
              </div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 700, color: '#111', marginBottom: 10 }}>Treatment History</p>
                {past.length > 0 ? past.slice(0, 5).map((b, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #F5F5F5' }}>
                    <div><p style={{ fontSize: 13, fontWeight: 600, color: '#374151', margin: 0 }}>{b.service || 'Treatment'}</p><p style={{ fontSize: 11, color: '#9CA3AF', margin: '2px 0 0' }}>{b.date}{b.staff ? ` · ${b.staff}` : ''}</p></div>
                    <Ico d={P.eye} size={16} color="#D1D5DB" />
                  </div>
                )) : (
                  <div style={{ textAlign: 'center', padding: '24px 0' }}><p style={{ fontSize: 12, color: '#D1D5DB' }}>No past treatments yet</p></div>
                )}
              </div>
            </div>
          </div>
          {pw}
        </div>
      </div>
    )
  }

  // ════════ SUBMITTED ════════
  if (view === 'submitted') return (
    <div style={{ ...S, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <link href="https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      <div style={{ ...C, maxWidth: 400, width: '100%', textAlign: 'center', padding: 32 }}>
        <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}><Ico d={P.check} size={28} color="#22C55E" sw={2.5} /></div>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: '#111', marginBottom: 6 }}>Form Submitted</h2>
        <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 20 }}>Thank you, {fd.fullName}. Your consultation form has been received by {biz?.name}.</p>
        {(alerts.blocks.length > 0 || alerts.flags.length > 0) && <div style={{ textAlign: 'left', marginBottom: 20 }}><AlertBanner blocks={alerts.blocks} flags={alerts.flags} accent={accent} /></div>}
        <p style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 20 }}>Your therapist will review before your appointment.</p>
        <button onClick={() => setView('home')} style={B1}>Back to Home</button>
      </div>
    </div>
  )

  // ════════ FORM ════════
  if (view === 'form') {
    const prog = (
      <div style={{ background: '#fff', borderBottom: '1px solid #F0F0F0', padding: '12px 16px', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', maxWidth: dk ? 640 : 400, margin: '0 auto' }}>
          {STEPS.map((s, i) => (
            <div key={s} style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: dk ? 30 : 26, height: dk ? 30 : 26, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: dk ? 12 : 10, fontWeight: 700, transition: 'all .2s', background: i < step ? '#22C55E' : i === step ? accent : '#F3F4F6', color: i <= step ? '#fff' : '#9CA3AF' }}>{i < step ? '✓' : i + 1}</div>
                {dk && <span style={{ fontSize: 10, color: i === step ? accent : '#9CA3AF', fontWeight: i === step ? 700 : 400, marginTop: 4 }}>{s}</span>}
              </div>
              {i < STEPS.length - 1 && <div style={{ width: dk ? 36 : 14, height: 2, margin: `0 ${dk ? 4 : 2}px`, borderRadius: 1, background: i < step ? '#86EFAC' : '#E5E7EB', transition: 'background .2s' }} />}
            </div>
          ))}
        </div>
        {!dk && <p style={{ textAlign: 'center', fontSize: 11, color: '#9CA3AF', marginTop: 6, fontWeight: 600 }}>Step {step + 1}: {STEPS[step]}</p>}
      </div>
    )

    const nav = (
      <div style={{ display: 'flex', gap: 10, marginTop: 20, paddingBottom: 28, maxWidth: dk ? 320 : '100%', marginLeft: dk ? 'auto' : 0 }}>
        {step > 0 && <button onClick={() => setStep(step - 1)} style={{ ...B2, flex: 1 }}>Back</button>}
        {step < STEPS.length - 1 ? (
          <button onClick={() => canProceed() && setStep(step + 1)} disabled={!canProceed()} style={{ ...B1, flex: 1, opacity: canProceed() ? 1 : .35, cursor: canProceed() ? 'pointer' : 'not-allowed' }}>Continue</button>
        ) : (
          <button onClick={() => canProceed() && submitForm()} disabled={!canProceed() || loading} style={{ ...B1, flex: 1, opacity: canProceed() && !loading ? 1 : .35, cursor: canProceed() ? 'pointer' : 'not-allowed' }}>{loading ? 'Submitting...' : 'Submit Form'}</button>
        )}
      </div>
    )

    return (
      <div style={S}>
        <link href="https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
        <div ref={topRef} />
        {!dk && <BrandHead title="Client Consultation Form" showBack onBack={() => setView('home')} compact />}
        {dk && (
          <div style={{ background: '#fff', borderBottom: '1px solid #F0F0F0', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 800, color: '#fff' }}>{biz?.name?.charAt(0) || 'R'}</div>
              <div><p style={{ fontSize: 15, fontWeight: 700, color: '#111', margin: 0 }}>{biz?.name}</p>{biz?.subtitle && <p style={{ fontSize: 10, color: '#9CA3AF', margin: 0, letterSpacing: '.1em', textTransform: 'uppercase' }}>{biz.subtitle}</p>}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ padding: '5px 16px', borderRadius: 20, background: accent + '12' }}><span style={{ fontSize: 12, fontWeight: 600, color: accent }}>Client Consultation Form</span></div>
              <button onClick={() => setView('home')} style={{ ...B2, width: 'auto', padding: '6px 16px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 5 }}><Ico d={P.back} size={14} color="#6B7280" /> Back</button>
            </div>
          </div>
        )}
        {prog}
        <div style={{ maxWidth: dk ? 640 : 420, margin: '0 auto', padding: dk ? '24px 16px 0' : '16px 16px 0' }}>
          <div style={{ ...C, padding: dk ? 28 : 20 }}>
            {step === 0 && (<div>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#111', marginBottom: 2 }}>Personal Details</h2>
              <p style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 20 }}>Used for your treatment records</p>
              <Inp label="Full Name *" name="fullName" value={fd.fullName} onChange={set} placeholder="Your full name" accent={accent} />
              <div style={{ display: 'grid', gridTemplateColumns: dk ? '1fr 1fr' : '1fr', gap: 10 }}>
                <Inp label="Date of Birth *" type="date" name="dob" value={fd.dob} onChange={set} accent={accent} />
                <Inp label="Address" name="address" value={fd.address} onChange={set} placeholder="Full address" accent={accent} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <Inp label="Mobile *" type="tel" name="mobile" value={fd.mobile} onChange={set} placeholder="07..." accent={accent} />
                <Inp label="Email *" type="email" name="email" value={fd.email} onChange={set} placeholder="you@email.com" accent={accent} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <Inp label="Emergency Contact *" name="emergencyName" value={fd.emergencyName} onChange={set} placeholder="Name" accent={accent} />
                <Inp label="Their Number *" type="tel" name="emergencyPhone" value={fd.emergencyPhone} onChange={set} placeholder="07..." accent={accent} />
              </div>
              <Inp label="GP Name *" name="gpName" value={fd.gpName} onChange={set} placeholder="Dr..." accent={accent} />
              <Inp label="GP Surgery" name="gpAddress" value={fd.gpAddress} onChange={set} placeholder="Optional" accent={accent} />
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>How did you hear about us?</label>
                <select value={fd.referral || ''} onChange={e => set('referral', e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #E5E7EB', fontSize: 12, background: '#fff', color: '#4B5563', boxSizing: 'border-box', appearance: 'none', backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239CA3AF' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")", backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center' }}>
                  <option value="">Select...</option>
                  {['Instagram', 'TikTok', 'Google', 'Friend / Referral', 'Returning Client', 'Other'].map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div style={{ background: '#F9FAFB', borderRadius: 12, padding: 14, marginTop: 16 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: accent, marginBottom: 8 }}>Photo Consent</p>
                <Tick label="Treatment records (clinical use only)" checked={fd.photoRecords} onChange={() => set('photoRecords', !fd.photoRecords)} accent={accent} />
                <Tick label="Training purposes" checked={fd.photoTraining} onChange={() => set('photoTraining', !fd.photoTraining)} accent={accent} />
                <Tick label="Marketing & social media" checked={fd.photoMarketing} onChange={() => set('photoMarketing', !fd.photoMarketing)} accent={accent} />
              </div>
            </div>)}
            {step === 1 && (<div>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#111', marginBottom: 2 }}>Medical History</h2>
              <p style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 20 }}>Determines which treatments are safe for you</p>
              <YesNo label="Pregnant, breastfeeding, or trying to conceive?" name="pregnant" value={fd.pregnant} onChange={set} accent={accent} />
              <YesNo label="Heart condition or high blood pressure?" name="heartCondition" value={fd.heartCondition} onChange={set} accent={accent} detail detailLabel="Controlled or uncontrolled?" detailValue={fd.heartConditionDetail} onDetailChange={set} />
              <YesNo label="Pacemaker or electronic implant?" name="pacemaker" value={fd.pacemaker} onChange={set} accent={accent} />
              <YesNo label="Metal implants, plates, or screws?" name="metalImplants" value={fd.metalImplants} onChange={set} accent={accent} detail detailLabel="Where?" detailValue={fd.metalImplantsDetail} onDetailChange={set} />
              <YesNo label="Diabetes?" name="diabetes" value={fd.diabetes} onChange={set} accent={accent} detail detailLabel="Type 1/2? Controlled?" detailValue={fd.diabetesDetail} onDetailChange={set} />
              <YesNo label="Epilepsy?" name="epilepsy" value={fd.epilepsy} onChange={set} accent={accent} />
              <YesNo label="Autoimmune disorder?" name="autoimmune" value={fd.autoimmune} onChange={set} accent={accent} detail detailLabel="e.g. Lupus, scleroderma..." detailValue={fd.autoimmuneDetail} onDetailChange={set} />
              <YesNo label="Blood clotting disorder?" name="bloodClotting" value={fd.bloodClotting} onChange={set} accent={accent} />
              <YesNo label="Cancer history?" name="activeCancer" value={fd.activeCancer} onChange={set} accent={accent} detail detailLabel="Type, when, status..." detailValue={fd.activeCancerDetail} onDetailChange={set} />
              <YesNo label="HIV/AIDS or hepatitis?" name="hivHepatitis" value={fd.hivHepatitis} onChange={set} accent={accent} />
              <YesNo label="Liver or kidney disease?" name="liverKidney" value={fd.liverKidney} onChange={set} accent={accent} />
              <YesNo label="History of cold sores (herpes simplex)?" name="herpes" value={fd.herpes} onChange={set} accent={accent} />
              <YesNo label="History of keloid or raised scarring?" name="keloid" value={fd.keloid} onChange={set} accent={accent} />
              <AlertBanner blocks={alerts.blocks} flags={alerts.flags} accent={accent} />
            </div>)}
            {step === 2 && (<div>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#111', marginBottom: 2 }}>Current Medications</h2>
              <p style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 20 }}>Medication interactions are the #1 cause of adverse events</p>
              <YesNo label="Roaccutane / Isotretinoin?" name="roaccutane" value={fd.roaccutane} onChange={set} accent={accent} sublabel="Must be 6+ months clear before treatment" detail detailLabel="Still taking? Or stop date..." detailValue={fd.roaccutaneDetail} onDetailChange={set} />
              <YesNo label="Blood thinners?" name="bloodThinners" value={fd.bloodThinners} onChange={set} accent={accent} sublabel="Warfarin, heparin, clopidogrel, daily aspirin" detail detailLabel="Which?" detailValue={fd.bloodThinnersDetail} onDetailChange={set} />
              <YesNo label="Photosensitising medications?" name="photosensitising" value={fd.photosensitising} onChange={set} accent={accent} sublabel="Tetracyclines, doxycycline, St John's Wort" detail detailLabel="Which?" detailValue={fd.photosensitivesDetail} onDetailChange={set} />
              <YesNo label="Topical retinoids?" name="retinoids" value={fd.retinoids} onChange={set} accent={accent} sublabel="Retin-A, Tretinoin, Differin, Epiduo" detail detailLabel="Product and last used?" detailValue={fd.retinoidsDetail} onDetailChange={set} />
              <YesNo label="Steroids (oral or topical)?" name="steroids" value={fd.steroids} onChange={set} accent={accent} detail detailLabel="Which?" detailValue={fd.steroidsDetail} onDetailChange={set} />
              <YesNo label="Immunosuppressants?" name="immunosuppressants" value={fd.immunosuppressants} onChange={set} accent={accent} />
              <YesNo label="Herbal supplements?" name="herbalSupps" value={fd.herbalSupps} onChange={set} accent={accent} sublabel="Garlic, ginkgo, fish oils affect bleeding" detail detailLabel="Which?" detailValue={fd.herbalSuppsDetail} onDetailChange={set} />
              <YesNo label="Fish or salmon allergy?" name="fishAllergy" value={fd.fishAllergy} onChange={set} accent={accent} sublabel="Important for polynucleotide treatments" />
              <Inp label="Any other medications?" name="otherMeds" value={fd.otherMeds} onChange={set} placeholder="List any others..." accent={accent} />
              <AlertBanner blocks={alerts.blocks} flags={alerts.flags} accent={accent} />
            </div>)}
            {step === 3 && (<div>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#111', marginBottom: 2 }}>Skin History</h2>
              <p style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 20 }}>Helps tailor your treatment plan</p>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: accent, marginBottom: 8 }}>Fitzpatrick Skin Type</label>
                <p style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 10 }}>How does your skin respond to sun?</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8 }}>
                  {[{ v:'I',bg:'#FDEBD0',x:'Always burns' },{v:'II',bg:'#F5CBA7',x:'Usually burns'},{v:'III',bg:'#E0B88A',x:'Sometimes'},{v:'IV',bg:'#C4956A',x:'Rarely burns'},{v:'V',bg:'#8B6914',x:'Very rarely'},{v:'VI',bg:'#5C4033',x:'Never burns'}].map(t => (
                    <button key={t.v} type="button" onClick={() => set('fitzpatrick', t.v)} style={{ padding: 8, borderRadius: 10, border: fd.fitzpatrick === t.v ? `2px solid ${accent}` : '2px solid #E5E7EB', background: fd.fitzpatrick === t.v ? accent + '08' : '#fff', cursor: 'pointer', textAlign: 'center', transition: 'all .15s' }}>
                      <div style={{ width: dk ? 36 : 28, height: dk ? 36 : 28, borderRadius: '50%', margin: '0 auto 6px', background: t.bg, border: '2px solid rgba(0,0,0,0.06)' }} />
                      <p style={{ fontSize: dk ? 12 : 11, fontWeight: 700, color: '#374151', margin: 0 }}>{t.v}</p>
                      {dk && <p style={{ fontSize: 9, color: '#9CA3AF', margin: '2px 0 0' }}>{t.x}</p>}
                    </button>
                  ))}
                </div>
              </div>
              <YesNo label="Active acne, eczema, psoriasis, or dermatitis?" name="skinCondition" value={fd.skinCondition} onChange={set} accent={accent} detail detailLabel="Which and where?" detailValue={fd.skinConditionDetail} onDetailChange={set} />
              <YesNo label="Active skin infection?" name="skinInfection" value={fd.skinInfection} onChange={set} accent={accent} />
              <YesNo label="Raised moles or warts in treatment area?" name="molesWarts" value={fd.molesWarts} onChange={set} accent={accent} />
              <YesNo label="Tattoos or permanent makeup in treatment area?" name="tattoos" value={fd.tattoos} onChange={set} accent={accent} />
              <YesNo label="Previous adverse reactions to skin treatments?" name="adverseReactions" value={fd.adverseReactions} onChange={set} accent={accent} detail detailLabel="What happened?" detailValue={fd.adverseReactionsDetail} onDetailChange={set} />
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: accent, marginBottom: 10 }}>Skin concerns</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {['Acne','Scarring','Pigmentation','Rosacea','Fine lines','Texture','Pores','Dullness','Sagging'].map(c => (
                    <button key={c} type="button" onClick={() => { const cs = fd.concerns || []; set('concerns', cs.includes(c) ? cs.filter(x => x !== c) : [...cs, c]) }}
                      style={{ padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, border: (fd.concerns||[]).includes(c) ? `2px solid ${accent}` : '2px solid #E5E7EB', background: (fd.concerns||[]).includes(c) ? accent+'10' : '#fff', color: (fd.concerns||[]).includes(c) ? accent : '#9CA3AF', cursor: 'pointer', transition: 'all .15s' }}>{c}</button>
                  ))}
                </div>
              </div>
              <AlertBanner blocks={alerts.blocks} flags={alerts.flags} accent={accent} />
            </div>)}
            {step === 4 && (<div>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#111', marginBottom: 2 }}>Lifestyle</h2>
              <p style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 20 }}>Sun exposure affects treatment safety</p>
              <YesNo label="Significant sun exposure in the last 2 weeks?" name="sunburn" value={fd.sunburn} onChange={set} accent={accent} />
              <YesNo label="Sunbed use in the last 4 weeks?" name="sunbed" value={fd.sunbed} onChange={set} accent={accent} />
              <YesNo label="Currently have a tan (natural or self-tan)?" name="tan" value={fd.tan} onChange={set} accent={accent} />
              <YesNo label="Planned sun exposure in the next 4 weeks?" name="plannedSun" value={fd.plannedSun} onChange={set} accent={accent} sublabel="Holiday, outdoor event etc." />
              <YesNo label="Do you smoke?" name="smoker" value={fd.smoker} onChange={set} accent={accent} />
              <AlertBanner blocks={alerts.blocks} flags={alerts.flags} accent={accent} />
            </div>)}
            {step === 5 && (<div>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#111', marginBottom: 2 }}>Consent & Signature</h2>
              <p style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 14 }}>Read each statement and tick to confirm</p>
              {alerts.blocks.length > 0 && <AlertBanner blocks={alerts.blocks} flags={alerts.flags} accent={accent} />}
              <div style={{ background: '#F9FAFB', borderRadius: 12, padding: 8, marginTop: 14, ...(dk ? { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 } : {}) }}>
                <Tick label="The information I've provided is accurate and complete." checked={fd.consent1} onChange={() => set('consent1', !fd.consent1)} accent={accent} />
                <Tick label="Withholding information may cause adverse reactions I accept liability for." checked={fd.consent2} onChange={() => set('consent2', !fd.consent2)} accent={accent} />
                <Tick label="I will inform my therapist if my medical circumstances change." checked={fd.consent3} onChange={() => set('consent3', !fd.consent3)} accent={accent} />
                <Tick label="I understand the risks and nature of the treatments discussed." checked={fd.consent4} onChange={() => set('consent4', !fd.consent4)} accent={accent} />
                <Tick label="I agree to follow pre- and post-treatment care instructions." checked={fd.consent5} onChange={() => set('consent5', !fd.consent5)} accent={accent} />
                <Tick label="I understand the 72-hour cancellation policy for advanced treatments." checked={fd.consent6} onChange={() => set('consent6', !fd.consent6)} accent={accent} />
                <Tick label="I consent to my data being stored securely under UK GDPR." checked={fd.consent7} onChange={() => set('consent7', !fd.consent7)} accent={accent} />
                <Tick label="Results vary and no specific outcome is guaranteed." checked={fd.consent8} onChange={() => set('consent8', !fd.consent8)} accent={accent} />
              </div>
              <div style={{ marginTop: 20, maxWidth: dk ? 480 : '100%' }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: accent, marginBottom: 8 }}>Your Signature *</label>
                <SignaturePad onSign={s => set('signed', s)} accent={accent} />
              </div>
              <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 14, textAlign: 'center' }}>Valid for 6 months. You'll be prompted to re-sign before expiry.</p>
            </div>)}
          </div>
          {nav}
          <p style={{ textAlign: 'center', fontSize: 10, color: '#D1D5DB', paddingBottom: 20 }}>Powered by <span style={{ fontWeight: 700, color: accent }}>ReeveOS</span></p>
        </div>
      </div>
    )
  }

  return null
}
