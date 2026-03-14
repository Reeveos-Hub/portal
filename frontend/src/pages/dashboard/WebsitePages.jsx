/**
 * WebsitePages — Complete website builder hub.
 * Flow: Upgrade Gate → Payment → Welcome → Templates/AI → Domain → Dashboard
 * Dashboard tabs: Home | Pages | SEO | Traffic | Settings
 * Renders inside DashboardLayout (sidebar already present).
 */
import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBusiness } from '../../contexts/BusinessContext'
import api from '../../utils/api'

const T = {
  forest: '#111111', gold: '#C9A84C', goldLight: '#D4B76A', goldFaint: '#F8F3E8',
  cream: '#FAF7F2', text: '#2C2C2A', muted: '#7A776F',
  border: '#E8E4DD', borderLight: '#F0EDE7', white: '#FFFFFF',
  green: '#16A34A', red: '#DC2626', amber: '#D97706', bg: '#FAFAF9',
}
const F = 'Figtree, system-ui, sans-serif'
const Ic = ({ d, size = 16, color = T.muted }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
    strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>
)
const ic = {
  globe: 'M12 2a10 10 0 100 20 10 10 0 000-20z M2 12h20',
  check: 'M20 6L9 17l-5-5', plus: 'M12 5v14 M5 12h14',
  search: 'M11 3a8 8 0 100 16 8 8 0 000-16z M21 21l-4.35-4.35',
  eye: 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 9a3 3 0 100 6 3 3 0 000-6z',
  pen: 'M17 3a2.83 2.83 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z',
  star: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
  settings: 'M12 8a4 4 0 100 8 4 4 0 000-8z', chart: 'M18 20V10 M12 20V4 M6 20v-6',
  file: 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14 2v6h6',
  lock: 'M19 11H5a2 2 0 00-2 2v7a2 2 0 002 2h14a2 2 0 002-2v-7a2 2 0 00-2-2z M7 11V7a5 5 0 0110 0v4',
  image: 'M21 3H3v18h18V3z', sparkle: 'M12 2v4 M12 18v4 M4.93 4.93l2.83 2.83',
  arrow: 'M5 12h14 M12 5l7 7-7 7', tag: 'M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z M7 7h.01',
  share: 'M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8', trash: 'M3 6h18 M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2',
}

const Btn = ({ children, primary, gold, disabled, onClick, style = {} }) => (
  <button onClick={onClick} disabled={disabled} style={{
    padding: '10px 24px', border: primary || gold ? 'none' : `1px solid ${T.border}`,
    borderRadius: 999, fontFamily: F, fontSize: 13, fontWeight: primary || gold ? 600 : 400,
    cursor: disabled ? 'default' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6,
    background: disabled ? T.border : gold ? T.gold : primary ? T.forest : T.white,
    color: disabled ? T.muted : gold ? T.forest : primary ? T.white : T.text,
    transition: 'all 0.15s', ...style
  }}>{children}</button>
)
const Pill = ({ active, children, onClick }) => (
  <button onClick={onClick} style={{
    padding: '7px 16px', background: active ? T.forest : T.white,
    border: active ? 'none' : `1px solid ${T.border}`, borderRadius: 20,
    fontFamily: F, fontSize: 12, color: active ? T.white : T.muted,
    cursor: 'pointer', fontWeight: active ? 600 : 400,
  }}>{children}</button>
)
const Ring = ({ pct, size = 56 }) => {
  const r = (size - 8) / 2, c = 2 * Math.PI * r, off = c - (pct / 100) * c
  const col = pct >= 80 ? T.green : pct >= 50 ? T.amber : T.red
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size}><circle cx={size/2} cy={size/2} r={r} fill="none" stroke={T.border} strokeWidth="5" /><circle cx={size/2} cy={size/2} r={r} fill="none" stroke={col} strokeWidth="5" strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round" transform={`rotate(-90 ${size/2} ${size/2})`} style={{ transition: 'stroke-dashoffset 0.4s' }} /></svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ fontFamily: F, fontSize: 14, fontWeight: 700, color: col }}>{pct}</span></div>
    </div>
  )
}
const Stat = ({ label, value, sub }) => (
  <div style={{ padding: 14, background: T.white, border: `1px solid ${T.border}`, borderRadius: 12, flex: 1 }}>
    <p style={{ fontFamily: F, fontSize: 10, color: T.muted, margin: 0, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</p>
    <p style={{ fontFamily: F, fontSize: 22, fontWeight: 600, color: T.text, margin: '3px 0 0' }}>{value}</p>
    {sub && <p style={{ fontFamily: F, fontSize: 11, color: T.green, margin: '2px 0 0' }}>{sub}</p>}
  </div>
)
const SettingsRow = ({ icon, title, sub }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', borderBottom: `1px solid ${T.borderLight}`, cursor: 'pointer', transition: 'background 0.1s' }}
    onMouseOver={e => e.currentTarget.style.background = T.bg} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
    <div style={{ width: 34, height: 34, borderRadius: 8, background: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Ic d={icon} size={15} /></div>
    <div style={{ flex: 1 }}><p style={{ fontFamily: F, fontSize: 13, fontWeight: 500, color: T.text, margin: 0 }}>{title}</p><p style={{ fontFamily: F, fontSize: 11, color: T.muted, margin: '1px 0 0' }}>{sub}</p></div>
    <Ic d={ic.arrow} size={12} color={T.border} />
  </div>
)

const PLANS = [
  { name: 'Free', sub: 'Just getting started.', price: '£0', per: '/mo', features: ['1 Staff', '100 Bookings/month', 'Online Booking Page'], dark: false },
  { name: 'Starter', sub: 'Solo pros.', price: '£8.99', per: '/mo', features: ['3 Staff', '2K Bookings', 'Remove Branding', 'SMS'], dark: false },
  { name: 'Growth', sub: 'Teams & busy shops.', price: '£29', per: '/mo', features: ['5 Staff', 'Unlimited Bookings', 'Website Builder', 'CRM', 'Deposits'], dark: true, popular: true },
  { name: 'Scale', sub: 'Multiple sites.', price: '£59', per: '/mo', features: ['Unlimited Staff', 'Everything in Growth', 'Multi-Location', 'White-Label'], dark: false },
  { name: 'Enterprise', sub: 'Chains & groups.', price: 'Custom', per: '', features: ['Everything in Scale', 'API', 'Account Manager'], dark: true, enterprise: true },
]
const PLAN_ORDER = ['free', 'starter', 'growth', 'scale', 'enterprise']

const TEMPLATES = [
  { id: 'lumiere', name: 'Lumière', cat: 'Salon & Beauty', grad: 'linear-gradient(135deg, #FAF7F2, #E8DFD0, #C4A265)', desc: 'Elegant aesthetics', pages: 5 },
  { id: 'bloom', name: 'Bloom', cat: 'Salon & Beauty', grad: 'linear-gradient(135deg, #fce4ec, #f8bbd0, #c2185b)', desc: 'Fresh modern salon', pages: 5 },
  { id: 'glow', name: 'Glow', cat: 'Salon & Beauty', grad: 'linear-gradient(135deg, #2C3E2D, #4a6b4c, #C4A265)', desc: 'Natural wellness', pages: 5 },
  { id: 'hearth', name: 'Hearth', cat: 'Restaurant', grad: 'linear-gradient(135deg, #1a1a2e, #16213e, #e94560)', desc: 'Warm dining', pages: 6 },
  { id: 'sizzle', name: 'Sizzle', cat: 'Restaurant', grad: 'linear-gradient(135deg, #3e2723, #4e342e, #ff8f00)', desc: 'Street food', pages: 7 },
  { id: 'ember', name: 'Ember', cat: 'Restaurant', grad: 'linear-gradient(135deg, #212121, #424242, #ff5722)', desc: 'Smokehouse', pages: 6 },
  { id: 'folio', name: 'Folio', cat: 'Portfolio', grad: 'linear-gradient(135deg, #0f0f0f, #1a1a1a, #C9A84C)', desc: 'Showcase work', pages: 4 },
  { id: 'clarity', name: 'Clarity', cat: 'Services', grad: 'linear-gradient(135deg, #eceff1, #cfd8dc, #455a64)', desc: 'Professional', pages: 4 },
  { id: 'slate', name: 'Slate', cat: 'Retail', grad: 'linear-gradient(135deg, #263238, #37474f, #80cbc4)', desc: 'Modern retail', pages: 5 },
]
const CATS = ['All', 'Salon & Beauty', 'Restaurant', 'Services', 'Portfolio', 'Retail']
const TYPE_TO_CAT = { salon: 'Salon & Beauty', aesthetics: 'Salon & Beauty', beauty: 'Salon & Beauty', barber: 'Salon & Beauty', restaurant: 'Restaurant', cafe: 'Restaurant', services: 'Services', retail: 'Retail' }

const WebsitePages = () => {
  const { business, tier, loading } = useBusiness()
  const navigate = useNavigate()
  const bid = business?.id || business?._id
  const [screen, setScreen] = useState('loading')
  const [pages, setPages] = useState([])
  const [settings, setSettings] = useState(null)
  const [tab, setTab] = useState('home')
  const [selectedPlan, setSelectedPlan] = useState(PLANS[2])
  const [settingsTab, setSettingsTab] = useState('Website')
  const [templateCat, setTemplateCat] = useState('All')
  const [templateSearch, setTemplateSearch] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [previewDevice, setPreviewDevice] = useState('desktop')
  const [subdomain, setSubdomain] = useState('')

  const bizType = business?.type || business?.category || ''
  const bizCat = TYPE_TO_CAT[bizType.toLowerCase()] || 'Salon & Beauty'
  const bizName = business?.name || business?.business_name || 'Your Business'
  const ownerName = business?.owner_name || business?.contact_name || 'there'

  const fetchPages = useCallback(async () => {
    if (!bid) return []
    try { const r = await api.get(`/website/business/${bid}/pages`); return Array.isArray(r) ? r : r.pages || [] } catch { return [] }
  }, [bid])
  const fetchSettings = useCallback(async () => {
    if (!bid) return null
    try { return await api.get(`/website/business/${bid}/settings`) } catch { return null }
  }, [bid])

  useEffect(() => {
    if (!bid || loading) return
    ;(async () => {
      const [p, s] = await Promise.all([fetchPages(), fetchSettings()])
      setPages(p); setSettings(s)
      const currentLevel = PLAN_ORDER.indexOf(tier)
      if (currentLevel < 2) setScreen('upgrade')
      else if (p.length === 0) setScreen('welcome')
      else setScreen('dashboard')
    })()
  }, [bid, loading, tier, fetchPages, fetchSettings])

  useEffect(() => { if (bizName && !subdomain) setSubdomain(bizName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')) }, [bizName])
  useEffect(() => { if (screen === 'templates') setTemplateCat(bizCat) }, [screen, bizCat])

  const deletePage = async (slug) => { if (!confirm('Delete this page?')) return; await api.delete(`/website/business/${bid}/pages/${slug}`); setPages(await fetchPages()) }
  const createPage = async (title, slug) => { await api.post(`/website/business/${bid}/pages`, { title, slug }); setPages(await fetchPages()) }

  if (loading || screen === 'loading') return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}><p style={{ fontFamily: F, color: T.muted }}>Loading...</p></div>

  // ─── UPGRADE ───
  if (screen === 'upgrade') {
    const currentIdx = PLAN_ORDER.indexOf(tier)
    return (
      <div style={{ textAlign: 'center', paddingBottom: 40 }}>
        <Ic d={ic.globe} size={36} color={T.gold} />
        <h1 style={{ fontFamily: F, fontSize: 28, color: T.text, fontWeight: 300, margin: '16px 0 0' }}>Unlock Your Website</h1>
        <p style={{ fontFamily: F, fontSize: 14, color: T.muted, marginTop: 8, maxWidth: 440, marginLeft: 'auto', marginRight: 'auto' }}>Get a professional website for {bizName}.</p>
        <div style={{ display: 'flex', gap: 14, marginTop: 32, alignItems: 'stretch' }}>
          {PLANS.map(p => {
            const pIdx = PLAN_ORDER.indexOf(p.name.toLowerCase()); const isCurrent = p.name.toLowerCase() === tier; const canUpgrade = pIdx > currentIdx
            return (<div key={p.name} style={{ flex: 1, border: isCurrent ? `2px solid ${T.gold}` : p.dark ? 'none' : `1px solid ${T.border}`, borderRadius: 16, padding: '22px 16px', position: 'relative', background: p.dark ? T.forest : T.white, display: 'flex', flexDirection: 'column', opacity: pIdx < currentIdx ? 0.5 : 1 }}>
              {p.popular && <div style={{ position: 'absolute', top: 14, left: '50%', transform: 'translateX(-50%)', background: T.gold, color: T.forest, fontFamily: F, fontSize: 9, fontWeight: 700, padding: '3px 10px', borderRadius: 10, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Most Popular</div>}
              {isCurrent && <div style={{ position: 'absolute', top: -11, right: 14, background: T.green, color: T.white, fontFamily: F, fontSize: 9, fontWeight: 700, padding: '3px 10px', borderRadius: 10, textTransform: 'uppercase' }}>Current</div>}
              <h3 style={{ fontFamily: F, fontSize: 15, fontWeight: 600, color: p.dark ? T.white : T.text, margin: p.popular ? '24px 0 0' : 0 }}>{p.name}</h3>
              <p style={{ fontFamily: F, fontSize: 10, color: p.dark ? T.gold : T.muted, margin: '2px 0 0' }}>{p.sub}</p>
              <div style={{ marginTop: 10 }}><span style={{ fontFamily: F, fontSize: 28, fontWeight: 600, color: p.dark ? T.white : T.text }}>{p.price}</span>{p.per && <span style={{ fontFamily: F, fontSize: 12, color: p.dark ? '#888' : T.muted }}>{p.per}</span>}</div>
              <button onClick={() => { if (canUpgrade) { setSelectedPlan(p); setScreen('payment') } }} disabled={!canUpgrade} style={{ width: '100%', marginTop: 14, padding: 10, borderRadius: 999, fontFamily: F, fontSize: 12, fontWeight: 600, cursor: canUpgrade ? 'pointer' : 'default', background: isCurrent ? T.bg : p.popular ? T.gold : 'transparent', color: isCurrent ? T.muted : p.popular ? T.forest : p.dark ? T.white : T.text, border: p.popular ? 'none' : `1px solid ${isCurrent ? T.border : p.dark ? '#444' : T.border}` }}>{isCurrent ? 'Current' : canUpgrade ? 'Upgrade' : '—'}</button>
              <div style={{ marginTop: 14, flex: 1 }}>{p.features.map(f => <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 0' }}><Ic d={ic.check} size={12} color={p.dark ? T.gold : T.green} /><span style={{ fontFamily: F, fontSize: 11, color: p.dark ? '#ccc' : T.text }}>{f}</span></div>)}</div>
            </div>)
          })}
        </div>
      </div>
    )
  }

  // ─── PAYMENT ───
  if (screen === 'payment') return (
    <div style={{ display: 'flex', gap: 40, maxWidth: 800, margin: '0 auto' }}>
      <div style={{ flex: 1 }}>
        <button onClick={() => setScreen('upgrade')} style={{ width: 36, height: 36, borderRadius: '50%', border: `1px solid ${T.border}`, background: T.white, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}><Ic d="M15 18l-6-6 6-6" size={16} /></button>
        <h1 style={{ fontFamily: F, fontSize: 24, color: T.text, fontWeight: 400, margin: 0 }}>Complete your subscription</h1>
        <p style={{ fontFamily: F, fontSize: 13, color: T.muted, marginTop: 6 }}>{selectedPlan.name} plan · {selectedPlan.price}/month</p>
        <div style={{ marginTop: 28 }}>
          <label style={{ fontFamily: F, fontSize: 11, color: T.muted, display: 'block', marginBottom: 5 }}>Card number</label>
          <input placeholder="4242 4242 4242 4242" style={{ width: '100%', padding: '12px 14px', border: `1px solid ${T.border}`, borderRadius: 999, fontFamily: F, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
          <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
            <div style={{ flex: 1 }}><label style={{ fontFamily: F, fontSize: 11, color: T.muted, display: 'block', marginBottom: 5 }}>Expiry</label><input placeholder="MM/YY" style={{ width: '100%', padding: '12px 14px', border: `1px solid ${T.border}`, borderRadius: 999, fontFamily: F, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} /></div>
            <div style={{ flex: 1 }}><label style={{ fontFamily: F, fontSize: 11, color: T.muted, display: 'block', marginBottom: 5 }}>CVC</label><input placeholder="123" style={{ width: '100%', padding: '12px 14px', border: `1px solid ${T.border}`, borderRadius: 999, fontFamily: F, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} /></div>
          </div>
        </div>
        <button onClick={() => setScreen('welcome')} style={{ width: '100%', marginTop: 24, padding: 14, background: T.forest, color: T.white, border: 'none', borderRadius: 999, fontFamily: F, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Subscribe · {selectedPlan.price}/month</button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 12, justifyContent: 'center' }}><Ic d={ic.lock} size={12} /><span style={{ fontFamily: F, fontSize: 11, color: T.muted }}>Secured by Stripe. Cancel anytime.</span></div>
      </div>
      <div style={{ width: 280 }}>
        <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 12, padding: 22 }}>
          <p style={{ fontFamily: F, fontSize: 10, color: T.muted, margin: 0, textTransform: 'uppercase', letterSpacing: 1 }}>Order Summary</p>
          <h3 style={{ fontFamily: F, fontSize: 18, fontWeight: 600, color: T.text, marginTop: 10 }}>{selectedPlan.name} Plan</h3>
          <div style={{ borderTop: `1px solid ${T.border}`, marginTop: 14, paddingTop: 14 }}>{selectedPlan.features.map(f => <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '4px 0' }}><Ic d={ic.check} size={12} color={T.green} /><span style={{ fontFamily: F, fontSize: 12, color: T.text }}>{f}</span></div>)}</div>
          <div style={{ borderTop: `1px solid ${T.border}`, marginTop: 14, paddingTop: 14, display: 'flex', justifyContent: 'space-between' }}><span style={{ fontFamily: F, fontSize: 13 }}>Total</span><span style={{ fontFamily: F, fontSize: 16, fontWeight: 600 }}>{selectedPlan.price}/mo</span></div>
        </div>
      </div>
    </div>
  )

  // ─── WELCOME ───
  if (screen === 'welcome') return (
    <div style={{ textAlign: 'center', maxWidth: 600, margin: '0 auto', padding: '40px 0' }}>
      <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}><Ic d={ic.check} size={28} color={T.green} /></div>
      <h1 style={{ fontFamily: F, fontSize: 32, color: T.text, fontWeight: 300, marginTop: 20 }}>You're all set, {ownerName.split(' ')[0]}!</h1>
      <p style={{ fontFamily: F, fontSize: 14, color: T.muted, marginTop: 8 }}>Let's build the website for {bizName}.</p>
      <div style={{ display: 'flex', gap: 20, marginTop: 40 }}>
        <button onClick={() => setScreen('templates')} style={{ flex: 1, padding: 24, border: `1px solid ${T.border}`, borderRadius: 999, background: T.white, cursor: 'pointer', textAlign: 'left' }} onMouseOver={e => e.currentTarget.style.borderColor = T.gold} onMouseOut={e => e.currentTarget.style.borderColor = T.border}>
          <div style={{ width: '100%', height: 80, background: `linear-gradient(135deg, ${T.forest}, #333)`, borderRadius: 8, marginBottom: 14 }} />
          <h3 style={{ fontFamily: F, fontSize: 15, fontWeight: 600, color: T.text, margin: 0 }}>Choose a Template</h3>
          <p style={{ fontFamily: F, fontSize: 12, color: T.muted, marginTop: 6 }}>Curated {bizCat} designs.</p>
          <p style={{ fontFamily: F, fontSize: 13, fontWeight: 600, color: T.text, marginTop: 12 }}>Browse Templates →</p>
        </button>
        <button onClick={() => setScreen('domain')} style={{ flex: 1, padding: 24, border: `1px solid ${T.border}`, borderRadius: 999, background: T.white, cursor: 'pointer', textAlign: 'left' }} onMouseOver={e => e.currentTarget.style.borderColor = T.gold} onMouseOut={e => e.currentTarget.style.borderColor = T.border}>
          <div style={{ width: '100%', height: 80, background: `linear-gradient(135deg, ${T.gold}, ${T.goldLight})`, borderRadius: 8, marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Ic d={ic.sparkle} size={24} color={T.forest} /></div>
          <h3 style={{ fontFamily: F, fontSize: 15, fontWeight: 600, color: T.text, margin: 0 }}>AI Website Builder</h3>
          <p style={{ fontFamily: F, fontSize: 12, color: T.muted, marginTop: 6 }}>Auto-generate from your business data.</p>
          <p style={{ fontFamily: F, fontSize: 13, fontWeight: 600, color: T.text, marginTop: 12 }}>Build with AI →</p>
        </button>
      </div>
    </div>
  )

  // ─── TEMPLATES ───
  if (screen === 'templates') {
    const list = TEMPLATES.filter(t => (templateCat === 'All' || t.cat === templateCat) && (!templateSearch || t.name.toLowerCase().includes(templateSearch.toLowerCase())))
    return (
      <div>
        <button onClick={() => setScreen('welcome')} style={{ width: 36, height: 36, borderRadius: '50%', border: `1px solid ${T.border}`, background: T.white, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}><Ic d="M15 18l-6-6 6-6" size={16} /></button>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <h1 style={{ fontFamily: F, fontSize: 28, color: T.text, fontWeight: 300 }}>Templates for {bizType || 'your business'}</h1>
          <div style={{ maxWidth: 380, margin: '16px auto 0', position: 'relative' }}><input value={templateSearch} onChange={e => setTemplateSearch(e.target.value)} placeholder="Search..." style={{ width: '100%', padding: '11px 16px 11px 36px', border: `1px solid ${T.border}`, borderRadius: 24, fontFamily: F, fontSize: 13, outline: 'none', boxSizing: 'border-box', background: T.bg }} /><span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}><Ic d={ic.search} size={14} /></span></div>
        </div>
        {templateCat === bizCat && !templateSearch && <div style={{ background: T.goldFaint, border: `1px solid ${T.gold}`, borderRadius: 8, padding: '8px 14px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}><Ic d={ic.star} size={14} color={T.gold} /><span style={{ fontFamily: F, fontSize: 12 }}>Recommended for <strong>{bizCat}</strong></span></div>}
        <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>{CATS.map(c => <Pill key={c} active={templateCat === c} onClick={() => setTemplateCat(c)}>{c}</Pill>)}</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>{list.map(t => (
          <div key={t.id} onClick={() => { setSelectedTemplate(t); setScreen('preview') }} style={{ border: `1px solid ${T.border}`, borderRadius: 999, overflow: 'hidden', background: T.white, cursor: 'pointer', transition: 'all 0.15s' }} onMouseOver={e => { e.currentTarget.style.borderColor = T.gold; e.currentTarget.style.transform = 'translateY(-2px)' }} onMouseOut={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.transform = 'none' }}>
            <div style={{ height: 150, background: t.grad }} /><div style={{ padding: 12 }}><div style={{ display: 'flex', justifyContent: 'space-between' }}><h3 style={{ fontFamily: F, fontSize: 14, fontWeight: 600, color: T.text, margin: 0 }}>{t.name}</h3>{t.cat === bizCat && <span style={{ fontFamily: F, fontSize: 9, color: T.gold, fontWeight: 600, padding: '2px 6px', background: T.goldFaint, borderRadius: 4 }}>REC</span>}</div><p style={{ fontFamily: F, fontSize: 11, color: T.muted, margin: '3px 0 0' }}>{t.desc} · {t.pages} pages</p></div>
          </div>
        ))}</div>
      </div>
    )
  }

  // ─── PREVIEW ───
  if (screen === 'preview') {
    const tpl = selectedTemplate || TEMPLATES[0]
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <button onClick={() => setScreen('templates')} style={{ width: 36, height: 36, borderRadius: '50%', border: `1px solid ${T.border}`, background: T.white, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Ic d="M15 18l-6-6 6-6" size={16} /></button>
          <div style={{ display: 'flex', gap: 2, background: T.bg, padding: 3, borderRadius: 20 }}>{['desktop', 'mobile'].map(d => <button key={d} onClick={() => setPreviewDevice(d)} style={{ padding: '5px 14px', background: previewDevice === d ? T.forest : 'transparent', border: 'none', borderRadius: 16, fontFamily: F, fontSize: 12, cursor: 'pointer', color: previewDevice === d ? T.white : T.muted, textTransform: 'capitalize' }}>{d}</button>)}</div>
          <Btn primary onClick={() => setScreen('domain')}>Start with {tpl.name}</Btn>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: previewDevice === 'desktop' ? '100%' : 360, maxWidth: previewDevice === 'desktop' ? 780 : 360, height: previewDevice === 'desktop' ? 440 : 600, background: T.white, boxShadow: '0 2px 20px rgba(0,0,0,0.07)', borderRadius: 12, overflow: 'hidden', transition: 'all 0.25s' }}>
            <div style={{ height: 26, background: T.bg, display: 'flex', alignItems: 'center', padding: '0 10px', gap: 4 }}><div style={{ width: 7, height: 7, borderRadius: '50%', background: '#FF5F57' }} /><div style={{ width: 7, height: 7, borderRadius: '50%', background: '#FEBC2E' }} /><div style={{ width: 7, height: 7, borderRadius: '50%', background: '#28C840' }} /><span style={{ flex: 1, textAlign: 'center', fontFamily: F, fontSize: 10, color: T.muted }}>{subdomain}.reeveos.site</span></div>
            <div style={{ height: 'calc(100% - 26px)', background: tpl.grad, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}><h2 style={{ fontFamily: F, fontSize: previewDevice === 'desktop' ? 36 : 22, color: T.white, textShadow: '0 2px 8px rgba(0,0,0,0.3)', margin: 0, fontWeight: 300 }}>{bizName}</h2><p style={{ fontFamily: F, fontSize: 14, color: 'rgba(255,255,255,0.7)', marginTop: 8 }}>{tpl.desc}</p></div>
          </div>
        </div>
      </div>
    )
  }

  // ─── DOMAIN ───
  if (screen === 'domain') return (
    <div style={{ maxWidth: 460, margin: '40px auto' }}>
      <button onClick={() => setScreen(selectedTemplate ? 'preview' : 'welcome')} style={{ width: 36, height: 36, borderRadius: '50%', border: `1px solid ${T.border}`, background: T.white, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}><Ic d="M15 18l-6-6 6-6" size={16} /></button>
      <h1 style={{ fontFamily: F, fontSize: 24, color: T.text, fontWeight: 400 }}>Your site address</h1>
      <p style={{ fontFamily: F, fontSize: 13, color: T.muted, marginTop: 6 }}>Based on your business name.</p>
      <div style={{ marginTop: 24, display: 'flex', border: `1px solid ${T.border}`, borderRadius: 8, overflow: 'hidden' }}><input value={subdomain} onChange={e => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))} style={{ flex: 1, padding: '12px 14px', border: 'none', fontFamily: F, fontSize: 14, outline: 'none' }} /><span style={{ padding: '12px 14px', background: T.bg, fontFamily: F, fontSize: 12, color: T.muted, borderLeft: `1px solid ${T.border}` }}>.reeveos.site</span></div>
      {subdomain && <p style={{ fontFamily: F, fontSize: 12, color: T.green, marginTop: 6 }}>✓ {subdomain}.reeveos.site is available</p>}
      <div style={{ display: 'flex', gap: 12, marginTop: 28 }}><Btn onClick={() => setScreen(selectedTemplate ? 'preview' : 'welcome')}>Back</Btn><Btn primary disabled={!subdomain} onClick={async () => { try { await api.put(`/website/business/${bid}/settings`, { subdomain }) } catch {}; setPages(await fetchPages()); setSettings(await fetchSettings()); setScreen('dashboard') }} style={{ flex: 1 }}>Launch My Site</Btn></div>
    </div>
  )

  // ─── DASHBOARD ───
  const siteUrl = settings?.subdomain ? `${settings.subdomain}.reeveos.site` : `${subdomain}.reeveos.site`
  const setupSteps = [
    { l: 'Personalise header & logo', d: !!settings?.brand?.logo },
    { l: 'Customise brand colours', d: !!settings?.brand?.primary_color },
    { l: 'Set up navigation', d: (settings?.navigation || []).length > 0 },
    { l: 'Connect your domain', d: !!settings?.domain?.custom_domain },
    { l: 'Configure SEO', d: !!settings?.seo?.meta_title },
    { l: 'Add your services', d: pages.length >= 3 },
    { l: 'Publish your site', d: pages.some(p => p.status === 'published') },
  ]
  const setupDone = setupSteps.filter(s => s.d).length

  return (
    <div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 24 }}>{[['home','Home'],['pages','Pages'],['seo','SEO'],['traffic','Traffic'],['settings','Settings']].map(([k,l]) => <Pill key={k} active={tab===k} onClick={() => setTab(k)}>{l}</Pill>)}</div>

      {tab === 'home' && <>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div><h1 style={{ fontFamily: F, fontSize: 22, color: T.text, fontWeight: 400, margin: 0 }}>Welcome, {ownerName.split(' ')[0]}</h1><p style={{ fontFamily: F, fontSize: 12, color: T.muted, marginTop: 2 }}>{bizName}</p></div>
          <div style={{ display: 'flex', gap: 8 }}><Btn onClick={() => window.open(`https://${siteUrl}`, '_blank')}><Ic d={ic.eye} size={14} /> View Site</Btn><Btn primary onClick={() => pages[0] && navigate(`/dashboard/website/edit/${pages[0].slug || 'home'}`)}><Ic d={ic.pen} size={14} color={T.white} /> Edit Site</Btn></div>
        </div>
        <div style={{ display: 'flex', gap: 18, marginBottom: 24 }}>
          <div style={{ flex: 1, padding: 20, background: T.white, border: `1px solid ${T.border}`, borderRadius: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><p style={{ fontFamily: F, fontSize: 11, color: T.muted, margin: 0, fontWeight: 600, textTransform: 'uppercase' }}>Set up your website</p><p style={{ fontFamily: F, fontSize: 11, color: T.muted, margin: 0 }}>{setupDone}/7</p></div>
            <div style={{ height: 3, background: T.border, marginTop: 8, borderRadius: 2 }}><div style={{ height: 3, background: T.gold, borderRadius: 2, width: `${(setupDone/7)*100}%`, transition: 'width 0.3s' }} /></div>
            <div style={{ marginTop: 12 }}>{setupSteps.map((s, i) => <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 0', borderBottom: `1px solid ${T.borderLight}` }}><div style={{ width: 16, height: 16, borderRadius: '50%', border: s.d ? 'none' : `1.5px solid ${T.border}`, background: s.d ? T.green : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{s.d && <Ic d={ic.check} size={9} color={T.white} />}</div><span style={{ fontFamily: F, fontSize: 12, color: s.d ? T.muted : T.text, textDecoration: s.d ? 'line-through' : 'none' }}>{s.l}</span></div>)}</div>
          </div>
          <div style={{ width: 260, background: T.white, border: `1px solid ${T.border}`, borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ height: 140, background: selectedTemplate ? selectedTemplate.grad : `linear-gradient(135deg, #2C3E2D, ${T.gold})`, position: 'relative' }}><span style={{ position: 'absolute', bottom: 5, right: 7, background: 'rgba(0,0,0,0.5)', color: T.white, fontFamily: F, fontSize: 9, padding: '2px 6px', borderRadius: 4 }}>Live</span></div>
            <div style={{ padding: 12 }}><p style={{ fontFamily: F, fontSize: 12, fontWeight: 600, color: T.text, margin: 0 }}>Your Site</p><p style={{ fontFamily: F, fontSize: 10, color: T.muted, margin: '2px 0 0' }}>{siteUrl}</p>
              <div style={{ display: 'flex', gap: 6, marginTop: 10 }}><button onClick={() => { setTab('settings'); setSettingsTab('Domains & Email') }} style={{ flex: 1, padding: 6, background: T.bg, border: `1px solid ${T.border}`, borderRadius: 999, fontFamily: F, fontSize: 10, cursor: 'pointer' }}>Custom Domain</button><button style={{ flex: 1, padding: 6, background: T.gold, border: 'none', borderRadius: 999, fontFamily: F, fontSize: 10, fontWeight: 600, cursor: 'pointer', color: T.forest }}>Publish</button></div>
            </div>
          </div>
        </div>
        <h2 style={{ fontFamily: F, fontSize: 14, fontWeight: 600, color: T.text, margin: '0 0 12px' }}>Your Pages</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
          {pages.map(p => <div key={p.slug||p._id} onClick={() => navigate(`/dashboard/website/edit/${p.slug}`)} style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 999, overflow: 'hidden', cursor: 'pointer' }} onMouseOver={e => e.currentTarget.style.borderColor = T.gold} onMouseOut={e => e.currentTarget.style.borderColor = T.border}><div style={{ height: 80, background: T.bg }} /><div style={{ padding: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span style={{ fontFamily: F, fontSize: 11, fontWeight: 600, color: T.text }}>{p.title||p.slug}</span><span style={{ fontFamily: F, fontSize: 8, color: p.status==='published'?T.green:T.amber, fontWeight: 600, padding: '1px 4px', background: p.status==='published'?'#DCFCE7':'#FEF3C7', borderRadius: 4 }}>{p.status==='published'?'LIVE':'DRAFT'}</span></div></div>)}
          <div onClick={() => setTab('pages')} style={{ background: T.white, border: `2px dashed ${T.border}`, borderRadius: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', minHeight: 110 }} onMouseOver={e => e.currentTarget.style.borderColor = T.gold} onMouseOut={e => e.currentTarget.style.borderColor = T.border}><Ic d={ic.plus} size={20} /></div>
        </div>
      </>}

      {tab === 'pages' && <>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h1 style={{ fontFamily: F, fontSize: 22, color: T.text, fontWeight: 400, margin: 0 }}>Website Pages</h1>
          <div style={{ display: 'flex', gap: 8 }}><Btn onClick={() => window.open(`https://${siteUrl}`, '_blank')}><Ic d={ic.eye} size={14} /> View Site</Btn><Btn primary onClick={() => { const t = prompt('Page title:'); if(t) createPage(t, t.toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'')) }}><Ic d={ic.plus} size={14} color={T.white} /> New Page</Btn></div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
          {pages.map(p => <div key={p.slug||p._id} style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 12, overflow: 'hidden' }} onMouseOver={e => e.currentTarget.style.borderColor = T.gold} onMouseOut={e => e.currentTarget.style.borderColor = T.border}>
            <div style={{ height: 110, background: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Ic d={ic.file} size={24} color={T.border} /></div>
            <div style={{ padding: 12 }}><div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontFamily: F, fontSize: 13, fontWeight: 600, color: T.text }}>{p.title||p.slug}</span><span style={{ fontFamily: F, fontSize: 9, color: p.status==='published'?T.green:T.amber, fontWeight: 600, padding: '2px 5px', background: p.status==='published'?'#DCFCE7':'#FEF3C7', borderRadius: 4 }}>{p.status==='published'?'PUBLISHED':'DRAFT'}</span></div>
              <p style={{ fontFamily: F, fontSize: 11, color: T.muted, margin: '4px 0 0' }}>/{p.slug}</p>
              <div style={{ display: 'flex', gap: 6, marginTop: 8 }}><Btn onClick={() => navigate(`/dashboard/website/edit/${p.slug}`)} style={{ padding: '4px 12px', fontSize: 11, borderRadius: 999 }}><Ic d={ic.pen} size={11} /> Edit</Btn><button onClick={() => deletePage(p.slug)} style={{ padding: '4px 8px', border: `1px solid ${T.border}`, borderRadius: 999, background: T.white, cursor: 'pointer', display: 'flex', alignItems: 'center' }}><Ic d={ic.trash} size={11} color={T.red} /></button></div>
            </div>
          </div>)}
          <div onClick={() => { const t = prompt('Page title:'); if(t) createPage(t, t.toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'')) }} style={{ background: T.white, border: `2px dashed ${T.border}`, borderRadius: 999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', minHeight: 200 }} onMouseOver={e => e.currentTarget.style.borderColor = T.gold} onMouseOut={e => e.currentTarget.style.borderColor = T.border}><Ic d={ic.plus} size={22} /><p style={{ fontFamily: F, fontSize: 11, color: T.muted, marginTop: 6 }}>New Page</p></div>
        </div>
      </>}

      {tab === 'seo' && <>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}><h1 style={{ fontFamily: F, fontSize: 22, color: T.text, fontWeight: 400, margin: 0 }}>Search Engine / AI Optimisation</h1><Btn primary>Optimise</Btn></div>
        <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
          <div style={{ padding: 22, background: T.white, border: `1px solid ${T.border}`, borderRadius: 12, display: 'flex', flexDirection: 'column', alignItems: 'center' }}><p style={{ fontFamily: F, fontSize: 12, fontWeight: 600, color: T.text, margin: '0 0 10px' }}>SEO Score</p><Ring pct={64} size={100} /></div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ padding: 16, background: T.white, border: `1px solid ${T.border}`, borderRadius: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><div><p style={{ fontFamily: F, fontSize: 11, color: T.muted, margin: 0 }}>Pages with metadata</p><p style={{ fontFamily: F, fontSize: 20, fontWeight: 600, color: T.text, margin: '2px 0 0' }}>{pages.filter(p => p.meta_title).length} / {pages.length}</p></div><span style={{ padding: '3px 8px', background: '#FEF3C7', fontFamily: F, fontSize: 10, fontWeight: 600, color: '#92400E', borderRadius: 6 }}>{pages.filter(p => !p.meta_title).length} missing</span></div>
            <div style={{ padding: 16, background: T.white, border: `1px solid ${T.border}`, borderRadius: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><div><p style={{ fontFamily: F, fontSize: 11, color: T.muted, margin: 0 }}>Schema markup</p><p style={{ fontFamily: F, fontSize: 20, fontWeight: 600, color: T.text, margin: '2px 0 0' }}>Active</p></div><div style={{ width: 22, height: 22, borderRadius: '50%', background: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Ic d={ic.check} size={11} color={T.green} /></div></div>
          </div>
        </div>
      </>}

      {tab === 'traffic' && <>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}><h1 style={{ fontFamily: F, fontSize: 22, color: T.text, fontWeight: 400, margin: 0 }}>Traffic</h1><select style={{ padding: '7px 16px', border: `1px solid ${T.border}`, borderRadius: 20, fontFamily: F, fontSize: 12 }}><option>Last 30 Days</option><option>Last 7 Days</option></select></div>
        <div style={{ display: 'flex', gap: 6, marginBottom: 18 }}>{['Traffic','Sources','Keywords','Geography'].map((t,i) => <Pill key={t} active={i===0}>{t}</Pill>)}</div>
        <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}><Stat label="Visits" value="0" sub="+0% mo/mo" /><Stat label="Bounce Rate" value="0%" /><Stat label="Unique Visitors" value="0" /><Stat label="Pageviews" value="0" /></div>
        <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 12, padding: 44, textAlign: 'center' }}><p style={{ fontFamily: F, fontSize: 16, fontWeight: 600, color: T.text }}>No Data Available</p><p style={{ fontFamily: F, fontSize: 13, color: T.muted, marginTop: 6 }}>Publish your site to start collecting analytics.</p></div>
      </>}

      {tab === 'settings' && <>
        <h1 style={{ fontFamily: F, fontSize: 22, color: T.text, fontWeight: 400, margin: '0 0 20px' }}>Settings</h1>
        <div style={{ display: 'flex' }}>
          <div style={{ width: 170, paddingRight: 18, borderRight: `1px solid ${T.border}` }}>{['Website','Domains & Email','Brand','Marketing','Third Party Tools','Cookies & Privacy'].map(t => <button key={t} onClick={() => setSettingsTab(t)} style={{ display: 'block', width: '100%', padding: '7px 0', background: 'none', border: 'none', fontFamily: F, fontSize: 13, color: settingsTab===t ? T.text : T.muted, fontWeight: settingsTab===t ? 600 : 400, textAlign: 'left', cursor: 'pointer' }}>{t}</button>)}</div>
          <div style={{ flex: 1, paddingLeft: 24 }}>
            <h2 style={{ fontFamily: F, fontSize: 16, fontWeight: 600, color: T.text, margin: '0 0 14px' }}>{settingsTab}</h2>
            <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 12, overflow: 'hidden' }}>
              {settingsTab === 'Website' && <><SettingsRow icon={ic.lock} title="Site Availability" sub="Who can view your site" /><SettingsRow icon={ic.globe} title="Languages" sub="Default language" /><SettingsRow icon={ic.image} title="Favicon" sub="Site icon" /><SettingsRow icon={ic.share} title="Social Links" sub="Social media" /></>}
              {settingsTab === 'Domains & Email' && <><SettingsRow icon={ic.globe} title="Custom Domain" sub="Connect your domain" /><SettingsRow icon={ic.lock} title="SSL" sub="Automatic" /><SettingsRow icon={ic.file} title="DNS Records" sub="Verify config" /></>}
              {settingsTab === 'Brand' && <><SettingsRow icon={ic.image} title="Logo" sub="Upload logo" /><SettingsRow icon={ic.tag} title="Colours" sub="Brand palette" /><SettingsRow icon={ic.file} title="Typography" sub="Fonts" /><SettingsRow icon={ic.pen} title="Buttons" sub="Shape & style" /></>}
              {!['Website','Domains & Email','Brand'].includes(settingsTab) && <div style={{ padding: 28, textAlign: 'center' }}><p style={{ fontFamily: F, fontSize: 13, color: T.muted }}>{settingsTab} settings coming soon.</p></div>}
            </div>
          </div>
        </div>
      </>}
    </div>
  )
}

export default WebsitePages
