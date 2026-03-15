import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBusiness } from '../../contexts/BusinessContext'
import api from '../../utils/api'
import AppLoader from '../../components/shared/AppLoader'
import {
  Search, Plus, ChevronDown, GripVertical, Trash2, Archive, X,
  Shield, Sparkles, Clock, Users, Globe, Package, Settings, FileText,
  Image as ImageIcon, MoreVertical
} from 'lucide-react'

const COLORS = ['#D4A574','#6BA3C7','#A87BBF','#6BC7A3','#E8845E','#E8B84E','#E87B9E','#6366F1','#14B8A6','#F97316','#8B5CF6','#64748B']
const DURATIONS = [15,30,45,60,75,90,120,150,180,240,300,360,480]
const TIME_OPTIONS = [0,5,10,15,20,30,45,60]
const NOTICE_OPTIONS = [0,1,2,4,6,12,24,48,72]
const SECTION_LABELS = ['Basic details','Pricing and duration','Team members','Resources','Add-ons','Booking','Forms','Settings']

function fmtDur(m) {
  if (!m) return '\u2014'
  if (m >= 60) { const h = Math.floor(m/60), r = m%60; return h + 'hr' + (r ? ' ' + r + 'm' : '') }
  return m + 'm'
}
function fmtPrice(pence) { return '\u00A3' + (Number(pence || 0) / 100).toFixed(2) }
function penceToPounds(p) { return Number(p || 0) / 100 }

function CustomSelect({ value, options, onChange, placeholder }) {
  const [open, setOpen] = useState(false)
  const found = options.find(o => (typeof o === 'object' ? o.value : o) === value)
  const display = found ? (typeof found === 'object' ? found.label : found) : (placeholder || 'Select...')
  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2.5 border border-[#E8E4DD] rounded-lg text-sm font-medium text-[#111] bg-white hover:border-[#C9A84C] transition-colors outline-none focus:border-[#C9A84C]"
        style={{fontFamily:"'Figtree',sans-serif"}}>
        <span className={value !== undefined && value !== null && value !== '' ? 'text-[#111]' : 'text-[#bbb]'}>{display}</span>
        <ChevronDown size={14} className="text-[#999] shrink-0" />
      </button>
      {open && (<>
        <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#E8E4DD] rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto py-1">
          {options.map((opt, i) => {
            const v = typeof opt === 'object' ? opt.value : opt
            const l = typeof opt === 'object' ? opt.label : opt
            return (
              <button key={i} type="button" onClick={() => { onChange(v); setOpen(false) }}
                className={'w-full text-left px-3 py-2 text-sm transition-colors ' + (v === value ? 'bg-[#FAFAF8] font-bold text-[#111]' : 'text-[#555] hover:bg-[#FAFAF8]')}
                style={{fontFamily:"'Figtree',sans-serif"}}>{l}</button>
            )
          })}
        </div>
      </>)}
    </div>
  )
}

function Toggle({ checked, onChange }) {
  return (
    <button type="button" onClick={() => onChange(!checked)}
      className={'relative inline-flex h-[22px] w-[40px] shrink-0 rounded-full transition-colors cursor-pointer ' + (checked ? 'bg-[#111]' : 'bg-[#D4D2CD]')}>
      <span className={'inline-block h-[18px] w-[18px] rounded-full bg-white shadow transition-transform mt-[2px] ' + (checked ? 'translate-x-[20px]' : 'translate-x-[2px]')} />
    </button>
  )
}

const Services = () => {
  const { business, businessType, loading: bizLoading } = useBusiness()
  const navigate = useNavigate()
  const bid = business?.id ?? business?._id
  const isFood = businessType === 'food' || businessType === 'restaurant'

  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState([])
  const [services, setServices] = useState([])
  const [staff, setStaff] = useState([])
  const [activeCat, setActiveCat] = useState('all')
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState(null)
  const [activeSection, setActiveSection] = useState(0)
  const [editing, setEditing] = useState({})
  const [saving, setSaving] = useState(false)
  const [addOns, setAddOns] = useState([])
  const [addOnTiers, setAddOnTiers] = useState([{count:1,price:''},{count:2,price:''},{count:3,price:''}])
  const [newAddOn, setNewAddOn] = useState({name:'',price:'',duration:''})
  const [variants, setVariants] = useState([])
  const [newVar, setNewVar] = useState({name:'',duration_minutes:60,price:0})
  const [addOnsLoading, setAddOnsLoading] = useState(false)
  const [consumables, setConsumables] = useState([])
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [toast, setToast] = useState(null)
  const [catModal, setCatModal] = useState(false)
  const [newCatName, setNewCatName] = useState('')

  useEffect(() => {
    if (!bid) { setLoading(false); return }
    const load = async () => {
      try {
        const [svcRes, staffRes] = await Promise.all([
          api.get('/services-v2/business/' + bid),
          api.get('/staff-v2/business/' + bid).catch(() => ({staff:[]})),
        ])
        const cats = svcRes.categories || []
        const allSvcs = cats.flatMap(c => (c.services || []).map(s => ({...s, categoryId: c.id, categoryName: c.name})))
        setCategories(cats)
        setServices(allSvcs)
        setStaff((staffRes.staff || []).filter(s => s.active !== false))
      } catch (e) { console.error('Services load failed', e) }
      setLoading(false)
    }
    load()
  }, [bid])

  const fetchAddOns = useCallback(async (serviceId) => {
    if (!bid || !serviceId) return
    setAddOnsLoading(true)
    try {
      const res = await api.get('/addons/business/' + bid + '/service/' + serviceId)
      setAddOns(res.add_ons || [])
      setAddOnTiers(res.add_on_tiers?.length ? res.add_on_tiers : [{count:1,price:''},{count:2,price:''},{count:3,price:''}])
    } catch { setAddOns([]); setAddOnTiers([{count:1,price:''},{count:2,price:''},{count:3,price:''}]) }
    setAddOnsLoading(false)
  }, [bid])

  useEffect(() => {
    if (!bid) return
    api.get('/consumables/business/' + bid).then(r => setConsumables(r.items || [])).catch(() => {})
  }, [bid])

  const selectService = (svc) => {
    setSelectedId(svc.id)
    setActiveSection(0)
    setEditing({
      name: svc.name || '', categoryId: svc.categoryId || '', description: svc.description || '',
      price: penceToPounds(svc.price), duration: svc.duration || 60, color: svc.color || COLORS[0],
      online: svc.online !== false, staffIds: svc.staffIds || [],
      buffer_after: svc.buffer_after || 0, processing_time: svc.processing_time || 0,
      prep_before: svc.prep_before || 0, require_deposit: svc.require_deposit || false,
      deposit_amount: svc.deposit_amount || 0, require_full_payment: svc.require_full_payment || false,
      require_consultation: svc.require_consultation || false, require_consent: svc.require_consent || false,
      require_patch_test: svc.require_patch_test || false, min_booking_notice: svc.min_booking_notice || 0,
      is_group: svc.is_group || false, max_capacity: svc.max_capacity || 1,
    })
    setVariants(svc.variants || [])
    setNewVar({name:'',duration_minutes:60,price:0})
    fetchAddOns(svc.id)
  }

  const closeEditor = () => { setSelectedId(null); setEditing({}) }

  const handleSave = async () => {
    if (!bid || !selectedId) return
    setSaving(true)
    try {
      await api.put('/services-v2/business/' + bid + '/' + selectedId, {...editing, variants})
      const svcRes = await api.get('/services-v2/business/' + bid)
      const cats = svcRes.categories || []
      setCategories(cats)
      setServices(cats.flatMap(c => (c.services || []).map(s => ({...s, categoryId: c.id, categoryName: c.name}))))
      showToast('Changes saved', 'success')
    } catch (e) { console.error(e); showToast('Failed to save', 'error') }
    setSaving(false)
  }

  const handleSaveAddOns = async () => {
    if (!bid || !selectedId) return
    setSaving(true)
    try {
      await api.post('/addons/business/' + bid + '/service/' + selectedId + '/configure', {
        add_ons: addOns.map(a => ({name:a.name, price:parseFloat(a.price)||0, duration:parseInt(a.duration)||0})),
        add_on_tiers: addOnTiers.map(t => ({count:t.count, price:parseFloat(t.price)||0})),
      })
      showToast('Add-ons saved', 'success')
    } catch { showToast('Failed to save add-ons', 'error') }
    setSaving(false)
  }

  const handleDelete = async () => {
    if (!bid || !deleteConfirm) return
    const sid = deleteConfirm.id, name = deleteConfirm.name
    setDeleteConfirm(null); setDeletingId(sid)
    await new Promise(r => setTimeout(r, 400))
    try {
      await api.delete('/services-v2/business/' + bid + '/' + sid + '?confirm=true')
      setServices(prev => prev.filter(s => s.id !== sid))
      if (selectedId === sid) closeEditor()
      showToast(name + ' deleted', 'delete')
    } catch { showToast('Failed to delete', 'error') }
    setDeletingId(null)
  }

  const handleArchive = async () => {
    if (!bid || !deleteConfirm) return
    const sid = deleteConfirm.id, name = deleteConfirm.name
    setDeleteConfirm(null); setDeletingId(sid)
    await new Promise(r => setTimeout(r, 400))
    try {
      await api.patch('/services/business/' + bid + '/' + sid, {active:false, status:'archived'}).catch(() => null)
      setServices(prev => prev.filter(s => s.id !== sid))
      if (selectedId === sid) closeEditor()
      showToast(name + ' archived', 'delete')
    } catch { showToast('Failed to archive', 'error') }
    setDeletingId(null)
  }

  const handleCreateCategory = async () => {
    if (!bid || !newCatName.trim()) return
    try {
      const cat = await api.post('/services-v2/categories/business/' + bid, {name: newCatName.trim()})
      setCategories(prev => [...prev, {id: cat.id, name: cat.name, services: []}])
      setNewCatName(''); setCatModal(false)
      showToast('Category created', 'success')
    } catch (e) { showToast((e?.response?.data?.detail) || 'Failed', 'error') }
  }

  const showToast = (msg, type) => { setToast({msg, type}); setTimeout(() => setToast(null), 3000) }

  const filtered = services.filter(s => {
    if (search && !s.name.toLowerCase().includes(search.toLowerCase())) return false
    if (activeCat !== 'all' && s.categoryId !== activeCat) return false
    return true
  })
  const grouped = {}
  categories.forEach(c => {
    const items = filtered.filter(s => s.categoryId === c.id)
    if (items.length > 0) grouped[c.id] = {name: c.name, items}
  })
  const ungrouped = filtered.filter(s => !categories.some(c => c.id === s.categoryId))
  if (ungrouped.length > 0) grouped['_other'] = {name: 'Other', items: ungrouped}

  const selected = selectedId ? services.find(s => s.id === selectedId) : null
  const health = (() => {
    if (!selected) return Array(8).fill('empty')
    return [
      selected.name ? 'done' : 'empty',
      selected.price > 0 ? 'done' : 'warn',
      (selected.staffIds?.length > 0) ? 'done' : 'warn',
      'warn',
      'empty',
      selected.online !== false ? 'done' : 'warn',
      (selected.require_consultation || selected.require_consent) ? 'done' : 'empty',
      selected.color ? 'done' : 'empty',
    ]
  })()

  if (loading) return <AppLoader message={isFood ? 'Loading menu...' : 'Loading services...'} />

  return (
    <div className="-m-6 lg:-m-8 flex h-[calc(100vh-4rem)] overflow-hidden" style={{fontFamily:"'Figtree',sans-serif"}}>

      {/* CATEGORY SIDEBAR */}
      <div className="w-[220px] bg-white border-r border-[#E8E4DD] flex flex-col shrink-0 overflow-y-auto">
        <div className="p-4 pb-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#bbb]" />
            <input type="text" placeholder={isFood ? 'Search menu...' : 'Search services...'} value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-[#E8E4DD] rounded-lg text-xs text-[#111] font-medium outline-none bg-white focus:border-[#C9A84C] transition-colors" style={{fontFamily:"'Figtree',sans-serif"}} />
          </div>
        </div>
        <div className="px-4 pb-1.5 text-[9px] font-bold text-[#8A8780] uppercase tracking-wider">Categories</div>
        <button onClick={() => setActiveCat('all')}
          className={'flex items-center justify-between px-4 py-2.5 text-[13px] font-medium transition-all border-l-[3px] ' + (activeCat === 'all' ? 'border-l-[#C9A84C] bg-[#FAFAF8] font-bold text-[#111]' : 'border-l-transparent text-[#111] hover:bg-[#FAFAF8]')}>
          <span>All {isFood ? 'items' : 'categories'}</span>
          <span className="text-[11px] text-[#8A8780] font-semibold">{services.length}</span>
        </button>
        {categories.map(c => (
          <button key={c.id} onClick={() => setActiveCat(c.id)}
            className={'flex items-center justify-between px-4 py-2.5 text-[13px] font-medium transition-all border-l-[3px] ' + (activeCat === c.id ? 'border-l-[#C9A84C] bg-[#FAFAF8] font-bold text-[#111]' : 'border-l-transparent text-[#111] hover:bg-[#FAFAF8]')}>
            <span>{c.name}</span>
            <span className="text-[11px] text-[#8A8780] font-semibold">{services.filter(s => s.categoryId === c.id).length}</span>
          </button>
        ))}
        <div className="px-4 pt-3 mt-auto pb-4">
          <button onClick={() => setCatModal(true)} className="text-[11px] font-semibold text-[#C9A84C] hover:underline" style={{fontFamily:"'Figtree',sans-serif"}}>+ Add category</button>
        </div>
      </div>

      {/* SERVICE LIST */}
      <div className="flex-1 overflow-y-auto p-5 bg-[#FAFAF8]">
        {Object.keys(grouped).length === 0 ? (
          <div className="text-center py-20">
            <div className="w-14 h-14 bg-[#F0EDE7] rounded-full flex items-center justify-center mx-auto mb-4"><Package size={22} className="text-[#bbb]" /></div>
            <h3 className="text-base font-bold text-[#111] mb-1">{isFood ? 'No menu items yet' : 'No services yet'}</h3>
            <p className="text-xs text-[#8A8780]">Add your first {isFood ? 'menu item' : 'service'} to get started.</p>
          </div>
        ) : Object.entries(grouped).map(([catId, {name, items}]) => (
          <div key={catId} className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-[15px] font-bold text-[#111]">{name}</span>
                <span className="text-[10px] font-bold text-[#8A8780] bg-[#F0EDE7] px-2 py-0.5 rounded">{items.length}</span>
              </div>
              <span className="text-[11px] text-[#8A8780] cursor-pointer hover:text-[#111] flex items-center gap-1">Actions <ChevronDown size={10} /></span>
            </div>
            <div className="space-y-1.5">
              {items.map(s => (
                <div key={s.id} onClick={() => selectService(s)}
                  style={{transition:'all 0.4s cubic-bezier(0.4,0,0.2,1)', ...(deletingId === s.id ? {opacity:0,transform:'scale(0.9) translateX(-20px)',maxHeight:0,overflow:'hidden',padding:0,margin:0} : {})}}
                  className={'flex items-center gap-3 p-3.5 bg-white border rounded-[10px] cursor-pointer transition-all group ' + (selectedId === s.id ? 'border-[#C9A84C] bg-[#C9A84C]/[0.02] shadow-sm' : 'border-[#E8E4DD] hover:border-[#C9A84C] hover:shadow-sm')}>
                  <GripVertical size={12} className="text-[#ccc] group-hover:text-[#999] shrink-0 cursor-grab" />
                  <div className="w-1 h-10 rounded-sm shrink-0" style={{backgroundColor: s.color || COLORS[0]}} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[13px] font-semibold text-[#111] truncate">{s.name}</span>
                      {s.require_consultation && <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#C9A84C]/10 text-[8px] font-bold text-[#C9A84C]"><Shield size={8} /> Protected</span>}
                    </div>
                    <div className="text-[11px] text-[#8A8780] mt-0.5 truncate">
                      {fmtDur(s.duration)}{s.processing_time ? ' + ' + s.processing_time + 'm processing' : ''} &middot; {s.staffNames?.join(', ') || 'No staff assigned'}
                    </div>
                  </div>
                  <div className="text-[15px] font-bold text-[#111] shrink-0">{fmtPrice(s.price)}</div>
                  <MoreVertical size={14} className="text-[#ccc] shrink-0" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* EDIT PANEL — only when selected */}
      {selected && (
        <div className="w-[380px] bg-white border-l border-[#E8E4DD] flex flex-col shrink-0" style={{animation:'slideIn 0.2s ease'}}>
          <div className="px-5 py-4 border-b border-[#E8E4DD] flex items-center justify-between shrink-0">
            <div>
              <div className="text-[14px] font-bold text-[#111]">Edit {isFood ? 'item' : 'treatment'}</div>
              <div className="text-[11px] text-[#8A8780] mt-0.5 truncate max-w-[180px]">{editing.name}</div>
            </div>
            <div className="flex items-center gap-1.5">
              <button onClick={() => setDeleteConfirm(selected)} className="w-8 h-8 rounded-md border border-[#E8E4DD] bg-white flex items-center justify-center text-[#dc2626] hover:border-[#dc2626] hover:bg-red-50 transition-colors"><Trash2 size={13} /></button>
              <button onClick={handleSave} disabled={saving} className="px-4 py-2 rounded-lg bg-[#111] text-white text-[12px] font-bold disabled:opacity-50 hover:bg-[#222] transition-colors" style={{fontFamily:"'Figtree',sans-serif"}}>{saving ? 'Saving...' : 'Save'}</button>
              <button onClick={closeEditor} className="w-8 h-8 rounded-md border border-[#E8E4DD] bg-white flex items-center justify-center text-[#8A8780] hover:text-[#111] transition-colors"><X size={13} /></button>
            </div>
          </div>

          {selected.require_consultation && (
            <div className="px-4 py-2 bg-[#C9A84C]/5 border-b border-[#C9A84C]/10 flex items-center gap-2 text-[10px] text-[#111] shrink-0">
              <Shield size={11} className="text-[#C9A84C] shrink-0" />
              <span><strong>Medical safety active</strong> &mdash; contraindication rules auto-check bookings.</span>
            </div>
          )}

          <div className="border-b border-[#E8E4DD] shrink-0">
            {SECTION_LABELS.map((label, i) => {
              const dotColor = health[i] === 'done' ? '#22c55e' : health[i] === 'warn' ? '#C9A84C' : '#E8E4DD'
              return (
                <button key={i} onClick={() => setActiveSection(i)}
                  className={'flex items-center gap-2 w-full px-5 py-2.5 text-[12px] font-medium transition-all border-l-[3px] ' + (activeSection === i ? 'border-l-[#C9A84C] bg-[#FAFAF8] text-[#111] font-bold' : 'border-l-transparent text-[#8A8780] hover:text-[#111] hover:bg-[#FAFAF8]')}>
                  <div className="w-[7px] h-[7px] rounded-full shrink-0" style={{backgroundColor: dotColor}} />
                  {label}
                  {i === 2 && editing.staffIds?.length > 0 && <span className="ml-auto text-[9px] font-bold bg-[#F0EDE7] text-[#8A8780] px-1.5 py-0.5 rounded">{editing.staffIds.length}</span>}
                  {i === 6 && (editing.require_consultation || editing.require_consent) && <span className="ml-auto text-[9px] font-bold bg-[#F0EDE7] text-[#8A8780] px-1.5 py-0.5 rounded">{[editing.require_consultation, editing.require_consent, editing.require_patch_test].filter(Boolean).length}</span>}
                </button>
              )
            })}
          </div>

          <div className="flex-1 overflow-y-auto p-5">
            {/* S0: BASIC DETAILS */}
            {activeSection === 0 && (<div className="space-y-4">
              <div><label className="block text-[11px] font-semibold text-[#111] mb-1">{isFood ? 'Item' : 'Treatment'} name</label>
              <input type="text" value={editing.name||''} onChange={e => setEditing(d=>({...d,name:e.target.value}))} className="w-full px-3 py-2.5 border border-[#E8E4DD] rounded-lg text-[13px] font-medium text-[#111] outline-none focus:border-[#C9A84C] bg-white" style={{fontFamily:"'Figtree',sans-serif"}} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-[11px] font-semibold text-[#111] mb-1">Category</label>
                <CustomSelect value={editing.categoryId} onChange={v=>setEditing(d=>({...d,categoryId:v}))} options={categories.map(c=>({value:c.id,label:c.name}))} placeholder="Select..." /></div>
                <div><label className="block text-[11px] font-semibold text-[#111] mb-1">Treatment type</label>
                <CustomSelect value="Skin Treatment" onChange={()=>{}} options={isFood ? ['Food item','Drink','Dessert'] : ['Skin Treatment','Facial','Injectable','Consultation','Package']} /></div>
              </div>
              <div><label className="block text-[11px] font-semibold text-[#111] mb-1">Description</label>
              <textarea value={editing.description||''} onChange={e=>setEditing(d=>({...d,description:e.target.value}))} rows={3} placeholder="Describe what this treatment includes..."
                className="w-full px-3 py-2.5 border border-[#E8E4DD] rounded-lg text-[12px] font-medium text-[#111] outline-none focus:border-[#C9A84C] bg-white resize-none" style={{fontFamily:"'Figtree',sans-serif"}} />
              <div className="flex items-center justify-between mt-1">
                <span className="text-[10px] text-[#8A8780]">{(editing.description||'').length}/200</span>
                <button className="flex items-center gap-1 px-2 py-1 rounded border border-[#C9A84C]/25 bg-[#C9A84C]/5 text-[9px] font-semibold text-[#C9A84C]" style={{fontFamily:"'Figtree',sans-serif"}}><Sparkles size={9} /> Enhance with AI</button>
              </div></div>
              <div><label className="block text-[11px] font-semibold text-[#111] mb-1">Service image</label>
              <div className="border border-dashed border-[#E8E4DD] rounded-[10px] p-6 text-center bg-[#FAFAF8] cursor-pointer hover:border-[#C9A84C] transition-colors">
                <ImageIcon size={18} className="mx-auto mb-1.5 text-[#bbb]" />
                <div className="text-[12px] font-semibold text-[#111]">Upload a photo</div>
                <div className="text-[10px] text-[#8A8780] mt-1">Clients see this when browsing. 800&times;600 recommended.</div>
              </div></div>
            </div>)}

            {/* S1: PRICING AND DURATION */}
            {activeSection === 1 && (<div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div><label className="block text-[11px] font-semibold text-[#111] mb-1">Price (&pound;)</label>
                <input type="number" step="0.01" value={editing.price||''} onChange={e=>setEditing(d=>({...d,price:parseFloat(e.target.value)||0}))} className="w-full px-3 py-2.5 border border-[#E8E4DD] rounded-lg text-[13px] font-medium text-[#111] outline-none focus:border-[#C9A84C] bg-white" style={{fontFamily:"'Figtree',sans-serif"}} /></div>
                <div className="col-span-2"><label className="block text-[11px] font-semibold text-[#111] mb-1">Duration</label>
                <CustomSelect value={editing.duration||60} onChange={v=>setEditing(d=>({...d,duration:v}))} options={DURATIONS.map(d=>({value:d,label:fmtDur(d)}))} /></div>
              </div>
              <div className="pt-4 border-t border-[#F0EDE7]">
                <label className="block text-[12px] font-bold text-[#111] mb-3">Time blocks</label>
                <div className="grid grid-cols-4 gap-2">
                  {[['Prep before','prep_before'],['Treatment','duration'],['Processing','processing_time'],['Buffer after','buffer_after']].map(([label,key])=>(
                    <div key={key}><div className="text-[9px] text-[#8A8780] font-semibold mb-1">{label}</div>
                    {key==='duration' ? <div className="px-2 py-2 border rounded-md text-center text-[11px] font-bold text-[#111]" style={{borderColor:editing.color||COLORS[0]}}>{fmtDur(editing.duration)}</div>
                    : <CustomSelect value={editing[key]||0} onChange={v=>setEditing(d=>({...d,[key]:v}))} options={TIME_OPTIONS.map(t=>({value:t,label:t===0?'None':t+'m'}))} />}
                    </div>
                  ))}
                </div>
                {((editing.prep_before||0)+(editing.processing_time||0)+(editing.buffer_after||0))>0 && (
                  <div className="mt-3 p-3 bg-[#FAFAF8] border border-[#E8E4DD] rounded-lg">
                    <div className="text-[9px] text-[#8A8780] font-semibold mb-1.5">Calendar block: {(editing.prep_before||0)+(editing.duration||60)+(editing.processing_time||0)+(editing.buffer_after||0)} min</div>
                    <div className="flex h-6 rounded-md overflow-hidden">
                      {editing.prep_before>0 && <div className="flex items-center justify-center text-[8px] font-bold text-[#8A8780] bg-[#E5E5E0]" style={{flex:editing.prep_before}}>{editing.prep_before}m</div>}
                      <div className="flex items-center justify-center text-[8px] font-bold text-white" style={{flex:editing.duration||60,backgroundColor:editing.color||COLORS[0]}}>{editing.duration||60}m</div>
                      {editing.processing_time>0 && <div className="flex items-center justify-center text-[8px] font-bold text-[#111]" style={{flex:editing.processing_time,backgroundColor:editing.color||COLORS[0],opacity:0.3}}>{editing.processing_time}m</div>}
                      {editing.buffer_after>0 && <div className="flex items-center justify-center text-[8px] font-bold text-[#8A8780] bg-[#E5E5E0]" style={{flex:editing.buffer_after}}>{editing.buffer_after}m</div>}
                    </div>
                  </div>
                )}
              </div>
              <div className="pt-4 border-t border-[#F0EDE7]">
                <label className="block text-[12px] font-bold text-[#111] mb-1">Pricing Variants</label>
                <p className="text-[10px] text-[#8A8780] mb-3">Different price/duration options (e.g. Express 30min vs Full 60min). Leave empty for single pricing.</p>
                {variants.length > 0 && <div className="space-y-1.5 mb-3">
                  {variants.map((v,i) => (
                    <div key={v.id||i} className="flex items-center gap-2 bg-[#FAFAF8] border border-[#E8E4DD] rounded-lg px-3 py-2">
                      <span className="text-[11px] font-semibold text-[#111] flex-1">{v.name}</span>
                      <span className="text-[10px] text-[#8A8780]">{v.duration_minutes}min</span>
                      <span className="text-[10px] text-[#8A8780]">&pound;{Number(v.price||0).toFixed(2)}</span>
                      <button onClick={()=>setVariants(p=>p.filter((_,j)=>j!==i))} className="text-red-400 hover:text-red-600 text-[10px] font-bold">✕</button>
                    </div>
                  ))}
                </div>}
                <div className="flex gap-2 items-end">
                  <div className="flex-1"><input type="text" placeholder="Name" value={newVar.name} onChange={e=>setNewVar(v=>({...v,name:e.target.value}))} className="w-full px-2 py-1.5 border border-[#E8E4DD] rounded-lg text-[11px]" style={{fontFamily:"'Figtree',sans-serif"}} /></div>
                  <div className="w-16"><input type="number" placeholder="Mins" value={newVar.duration_minutes} onChange={e=>setNewVar(v=>({...v,duration_minutes:parseInt(e.target.value)||0}))} className="w-full px-2 py-1.5 border border-[#E8E4DD] rounded-lg text-[11px]" style={{fontFamily:"'Figtree',sans-serif"}} /></div>
                  <div className="w-16"><input type="number" step="0.01" placeholder="£" value={newVar.price} onChange={e=>setNewVar(v=>({...v,price:parseFloat(e.target.value)||0}))} className="w-full px-2 py-1.5 border border-[#E8E4DD] rounded-lg text-[11px]" style={{fontFamily:"'Figtree',sans-serif"}} /></div>
                  <button onClick={()=>{if(!newVar.name.trim())return;setVariants(p=>[...p,{...newVar,id:'var_'+Date.now()+'_'+p.length}]);setNewVar({name:'',duration_minutes:60,price:0})}} className="px-3 py-1.5 bg-[#111] text-white rounded-lg text-[10px] font-bold">Add</button>
                </div>
              </div>
            </div>)}

            {/* S2: TEAM MEMBERS */}
            {activeSection === 2 && (<div className="space-y-3">
              <p className="text-[11px] text-[#8A8780] mb-2">Choose who can perform this {isFood?'item':'treatment'}.</p>
              {staff.length===0 ? (
                <div className="p-5 border border-dashed border-[#E8E4DD] rounded-[10px] text-center bg-[#FAFAF8]">
                  <Users size={18} className="mx-auto mb-2 text-[#bbb]" />
                  <div className="text-[12px] font-semibold text-[#111] mb-1">No staff members yet</div>
                  <div className="text-[10px] text-[#8A8780] mb-3">Add team members in Staff settings first.</div>
                  <button onClick={()=>navigate('/dashboard/staff')} className="px-3 py-1.5 rounded-md bg-[#111] text-white text-[11px] font-bold" style={{fontFamily:"'Figtree',sans-serif"}}>Go to Staff</button>
                </div>
              ) : staff.map(st=>{
                const on=(editing.staffIds||[]).includes(st.id)
                return (
                  <button key={st.id} type="button" onClick={()=>setEditing(d=>({...d,staffIds:on?d.staffIds.filter(id=>id!==st.id):[...(d.staffIds||[]),st.id]}))}
                    className={'flex items-center gap-3 w-full p-3 border rounded-[10px] transition-all text-left '+(on?'border-[#C9A84C] bg-[#C9A84C]/[0.03]':'border-[#E8E4DD] hover:border-[#C9A84C]')}>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0" style={{backgroundColor:on?'#C9A84C':'#F0EDE7',color:on?'#fff':'#8A8780'}}>{st.name?.[0]||'?'}</div>
                    <div className="flex-1"><div className="text-[12px] font-semibold text-[#111]">{st.name}</div><div className="text-[10px] text-[#8A8780]">{st.role||'Staff'}</div></div>
                    <div className={'w-[18px] h-[18px] rounded border-[1.5px] flex items-center justify-center transition-all '+(on?'border-[#C9A84C] bg-[#C9A84C]':'border-[#D4D2CD]')}>
                      {on && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
                    </div>
                  </button>
                )
              })}
            </div>)}

            {/* S3: RESOURCES */}
            {activeSection === 3 && (<div className="space-y-4">
              <div className="p-4 bg-[#C9A84C]/[0.04] border border-[#C9A84C]/[0.12] rounded-[10px]">
                <div className="flex items-start gap-2.5"><Shield size={15} className="text-[#C9A84C] shrink-0 mt-0.5" /><div>
                  <div className="text-[12px] font-bold text-[#111] mb-1">What are resources?</div>
                  <div className="text-[10px] text-[#555] leading-[1.6] mb-2">Resources are rooms, treatment beds, chairs, or equipment. When booked, the assigned resource is blocked so it can't be double-booked.</div>
                  <div className="text-[10px] text-[#555] leading-[1.6] mb-3">Manage resources in the <strong>Room Builder</strong>. Once set up, assign them here.</div>
                  <button onClick={()=>navigate('/dashboard/rooms')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#111] text-white text-[10px] font-bold" style={{fontFamily:"'Figtree',sans-serif"}}><Package size={12} /> Open Room Builder</button>
                </div></div>
              </div>
              <div>
                <div className="text-[12px] font-bold text-[#111] mb-2">How it works</div>
                {['Client books this treatment online','System checks if a resource is free','If free, automatically assigned and blocked','If all taken, timeslot hidden from booking'].map((step,i)=>(
                  <div key={i} className="flex items-start gap-2 mb-2">
                    <div className="w-5 h-5 rounded-full bg-[#F0EDE7] flex items-center justify-center text-[9px] font-bold text-[#8A8780] shrink-0">{i+1}</div>
                    <div className="text-[10px] text-[#555] leading-[1.5] pt-0.5">{step}</div>
                  </div>
                ))}
              </div>
            </div>)}

            {/* S4: ADD-ONS */}
            {activeSection === 4 && (<div className="space-y-4">
              <p className="text-[11px] text-[#8A8780]">Optional extras clients choose when booking.</p>
              {addOnsLoading ? <div className="text-center py-6"><div className="w-5 h-5 border-2 border-[#111] border-t-transparent rounded-full animate-spin mx-auto mb-2" /><p className="text-[10px] text-[#8A8780]">Loading...</p></div> : (<>
                {addOns.length>0 && <div className="space-y-1.5">{addOns.map((a,i)=>(
                  <div key={a.id||i} className="flex items-center gap-3 p-3 bg-white border border-[#E8E4DD] rounded-lg group hover:border-[#C9A84C]/30">
                    <div className="flex-1 min-w-0"><div className="text-[12px] font-bold text-[#111] truncate">{a.name}</div><div className="text-[10px] text-[#8A8780]">&pound;{Number(a.price||0).toFixed(2)}{a.duration>0?' \u00B7 '+a.duration+'m':''}</div></div>
                    <button onClick={()=>setAddOns(p=>p.filter((_,j)=>j!==i))} className="p-1 text-[#ccc] hover:text-[#dc2626] opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={12} /></button>
                  </div>
                ))}</div>}
                <div className="pt-3 border-t border-[#F0EDE7]">
                  <label className="text-[11px] font-bold text-[#111] mb-2 block">Add new</label>
                  <div className="grid grid-cols-[1fr_70px_60px_30px] gap-1.5 items-end">
                    <div><div className="text-[9px] text-[#8A8780] font-semibold mb-1">Name</div>
                    <input type="text" value={newAddOn.name} onChange={e=>setNewAddOn(d=>({...d,name:e.target.value}))} placeholder="e.g. LED therapy" className="w-full px-2 py-2 border border-[#E8E4DD] rounded-md text-[11px] text-[#111] outline-none focus:border-[#C9A84C] bg-white" style={{fontFamily:"'Figtree',sans-serif"}} /></div>
                    <div><div className="text-[9px] text-[#8A8780] font-semibold mb-1">Price &pound;</div>
                    <input type="number" step="0.01" value={newAddOn.price} onChange={e=>setNewAddOn(d=>({...d,price:e.target.value}))} placeholder="0" className="w-full px-2 py-2 border border-[#E8E4DD] rounded-md text-[11px] text-[#111] outline-none focus:border-[#C9A84C] bg-white" style={{fontFamily:"'Figtree',sans-serif"}} /></div>
                    <div><div className="text-[9px] text-[#8A8780] font-semibold mb-1">Mins</div>
                    <input type="number" value={newAddOn.duration} onChange={e=>setNewAddOn(d=>({...d,duration:e.target.value}))} placeholder="0" className="w-full px-2 py-2 border border-[#E8E4DD] rounded-md text-[11px] text-[#111] outline-none focus:border-[#C9A84C] bg-white" style={{fontFamily:"'Figtree',sans-serif"}} /></div>
                    <button disabled={!newAddOn.name.trim()} onClick={()=>{ if(!newAddOn.name.trim())return; setAddOns(p=>[...p,{id:'t_'+Date.now(),name:newAddOn.name.trim(),price:parseFloat(newAddOn.price)||0,duration:parseInt(newAddOn.duration)||0}]); setNewAddOn({name:'',price:'',duration:''}) }} className="p-2 rounded-md bg-[#111] text-white disabled:opacity-30 disabled:cursor-not-allowed"><Plus size={14} /></button>
                  </div>
                </div>
                <div className="pt-3 border-t border-[#F0EDE7]">
                  <div className="flex items-center gap-1.5 mb-2"><Sparkles size={11} className="text-[#C9A84C]" /><label className="text-[11px] font-bold text-[#111]">Tier pricing</label></div>
                  <p className="text-[10px] text-[#8A8780] mb-2">Discounted prices for multiple add-ons.</p>
                  <div className="space-y-1.5">{addOnTiers.map((tier,idx)=>(
                    <div key={tier.count} className="flex items-center gap-2 p-2.5 bg-[#FAFAF8] rounded-lg border border-[#E8E4DD]">
                      <span className="text-[11px] font-medium text-[#111] whitespace-nowrap min-w-[80px]">{tier.count} add-on{tier.count>1?'s':''} =</span>
                      <div className="relative flex-1 max-w-[100px]"><span className="absolute left-2 top-1/2 -translate-y-1/2 text-[#8A8780] text-[11px] font-semibold">&pound;</span>
                      <input type="number" step="0.01" value={tier.price} onChange={e=>{const v=[...addOnTiers];v[idx]={...v[idx],price:e.target.value};setAddOnTiers(v)}} className="w-full pl-5 pr-2 py-1.5 border border-[#E8E4DD] rounded-md text-[11px] text-[#111] outline-none focus:border-[#C9A84C] bg-white" style={{fontFamily:"'Figtree',sans-serif"}} /></div>
                    </div>
                  ))}</div>
                  <button onClick={handleSaveAddOns} disabled={saving} className="mt-3 w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#111] text-white text-[11px] font-bold disabled:opacity-50" style={{fontFamily:"'Figtree',sans-serif"}}><Sparkles size={12} /> {saving?'Saving...':'Save Add-Ons'}</button>
                </div>
              </>)}
            </div>)}

            {/* S5: BOOKING */}
            {activeSection === 5 && (<div>
              {[['Available for online booking','Clients can book from your booking page.','online'],['Require full payment at booking','Charge full price when client books.','require_full_payment'],['Deposit required','Booking fee to secure appointment.','require_deposit']].map(([label,desc,key])=>(
                <div key={key} className="flex items-center justify-between py-3.5 border-b border-[#F0EDE7] last:border-b-0">
                  <div><div className="text-[12px] font-semibold text-[#111]">{label}</div><div className="text-[10px] text-[#8A8780] mt-0.5">{desc}</div></div>
                  <Toggle checked={!!editing[key]} onChange={v=>setEditing(d=>({...d,[key]:v}))} />
                </div>
              ))}
              {editing.require_deposit && (
                <div className="flex items-center gap-2.5 p-3 bg-[#FAFAF8] border border-[#E8E4DD] rounded-lg mt-1 mb-3">
                  <label className="text-[11px] font-semibold text-[#111] whitespace-nowrap">Deposit amount</label>
                  <div className="relative max-w-[100px]"><span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8A8780] text-[12px] font-semibold">&pound;</span>
                  <input type="number" step="0.01" value={editing.deposit_amount||''} onChange={e=>setEditing(d=>({...d,deposit_amount:parseFloat(e.target.value)||0}))} className="w-full pl-6 pr-2 py-2 border border-[#E8E4DD] rounded-md text-[12px] text-[#111] outline-none focus:border-[#C9A84C] text-center bg-white" style={{fontFamily:"'Figtree',sans-serif"}} /></div>
                </div>
              )}
              <div className="flex items-center justify-between py-3.5 border-t border-[#F0EDE7]">
                <div><div className="text-[12px] font-semibold text-[#111]">Minimum booking notice</div><div className="text-[10px] text-[#8A8780] mt-0.5">How far in advance clients must book.</div></div>
                <div className="w-[100px]"><CustomSelect value={editing.min_booking_notice||0} onChange={v=>setEditing(d=>({...d,min_booking_notice:v}))} options={NOTICE_OPTIONS.map(h=>({value:h,label:h===0?'None':h+(h===1?' hour':' hours')}))} /></div>
              </div>
            </div>)}

            {/* S6: FORMS */}
            {activeSection === 6 && (<div>
              <p className="text-[11px] text-[#8A8780] mb-3">Require forms before or during appointment.</p>
              {[['Consultation form required','Health questionnaire before booking.','require_consultation'],['Consent form required','Treatment-specific consent at check-in.','require_consent'],['Patch test required (first visit)','Auto-schedule 48hr before first appointment.','require_patch_test']].map(([label,desc,key])=>(
                <div key={key} className="flex items-center justify-between py-3.5 border-b border-[#F0EDE7] last:border-b-0">
                  <div><div className="text-[12px] font-semibold text-[#111]">{label}</div><div className="text-[10px] text-[#8A8780] mt-0.5">{desc}</div></div>
                  <Toggle checked={!!editing[key]} onChange={v=>setEditing(d=>({...d,[key]:v}))} />
                </div>
              ))}
              {editing.require_consultation && (
                <div className="mt-3 p-3 bg-[#C9A84C]/[0.04] border border-[#C9A84C]/[0.12] rounded-lg flex items-start gap-2">
                  <Shield size={13} className="text-[#C9A84C] shrink-0 mt-0.5" />
                  <div><div className="text-[10px] font-semibold text-[#111]">Contraindication rules active</div>
                  <div className="text-[9px] text-[#8A8780] mt-0.5">Conditions auto-checked when clients book.</div>
                  <button onClick={()=>navigate('/dashboard/consultation-forms')} className="mt-1.5 text-[9px] font-semibold text-[#C9A84C] hover:underline" style={{fontFamily:"'Figtree',sans-serif"}}>Manage consultation forms &rarr;</button></div>
                </div>
              )}
            </div>)}

            {/* S7: SETTINGS */}
            {activeSection === 7 && (<div className="space-y-5">
              <div><label className="block text-[11px] font-semibold text-[#111] mb-2">Calendar colour</label>
              <div className="flex flex-wrap gap-2">{COLORS.map(c=>(
                <button key={c} type="button" onClick={()=>setEditing(d=>({...d,color:c}))} className="w-7 h-7 rounded-full transition-all" style={{backgroundColor:c,boxShadow:editing.color===c?'0 0 0 2px #fff, 0 0 0 3px #111':'none'}} />
              ))}</div></div>
              <div className="pt-4 border-t border-[#F0EDE7]">
                <label className="block text-[11px] font-semibold text-[#111] mb-2">Linked consumables</label>
                {consumables.length===0 ? (
                  <div className="p-5 border border-dashed border-[#E8E4DD] rounded-[10px] text-center bg-[#FAFAF8]">
                    <div className="text-[10px] text-[#8A8780] mb-2">Stock auto-deducts when appointment completes.</div>
                    <button onClick={()=>navigate('/dashboard/consumables')} className="flex items-center gap-1.5 mx-auto px-3 py-1.5 rounded-md border border-[#E8E4DD] bg-white text-[11px] font-semibold text-[#111] hover:border-[#C9A84C]" style={{fontFamily:"'Figtree',sans-serif"}}><Plus size={12} /> Manage Consumables</button>
                  </div>
                ) : (<div className="space-y-1.5">
                  {consumables.slice(0,5).map(c=>(
                    <div key={c._id} className="flex items-center justify-between p-2.5 bg-[#FAFAF8] border border-[#E8E4DD] rounded-lg">
                      <span className="text-[11px] font-medium text-[#111]">{c.name}</span>
                      <span className="text-[10px] text-[#8A8780]">{c.quantity_in_stock||0} in stock</span>
                    </div>
                  ))}
                  <button onClick={()=>navigate('/dashboard/consumables')} className="text-[10px] font-semibold text-[#C9A84C] hover:underline" style={{fontFamily:"'Figtree',sans-serif"}}>Manage all consumables &rarr;</button>
                </div>)}
              </div>
              <div className="pt-4 border-t border-[#F0EDE7]">
                <label className="block text-[11px] font-semibold text-[#111] mb-2">Group booking</label>
                <p className="text-[10px] text-[#8A8780] mb-3">Enable for classes, workshops, or group treatments. Multiple clients book the same slot.</p>
                <div className="flex items-center gap-3 mb-2">
                  <button onClick={()=>setEditing(d=>({...d,is_group:!d.is_group}))} className={`relative w-10 h-5 rounded-full transition-colors ${editing.is_group ? 'bg-[#C9A84C]' : 'bg-[#E8E4DD]'}`}>
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${editing.is_group ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </button>
                  <span className="text-[11px] font-medium text-[#111]">{editing.is_group ? 'Group service' : 'Individual service'}</span>
                </div>
                {editing.is_group && (
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] text-[#8A8780]">Max capacity</span>
                    <input type="number" min="2" max="100" value={editing.max_capacity || 8} onChange={e=>setEditing(d=>({...d,max_capacity:Math.max(2,Math.min(100,parseInt(e.target.value)||2))}))}
                      className="w-16 px-2 py-1.5 border border-[#E8E4DD] rounded-lg text-[12px] font-semibold text-center" style={{fontFamily:"'Figtree',sans-serif"}} />
                    <span className="text-[10px] text-[#8A8780]">clients per session</span>
                  </div>
                )}
              </div>
              <div className="pt-4 border-t border-[#F0EDE7]">
                <button onClick={()=>setDeleteConfirm(selected)} className="text-[11px] font-semibold text-[#dc2626] hover:underline" style={{fontFamily:"'Figtree',sans-serif"}}>Delete this {isFood?'item':'treatment'}</button>
              </div>
            </div>)}
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[100] backdrop-blur-sm" onClick={()=>setDeleteConfirm(null)}>
          <div onClick={e=>e.stopPropagation()} className="bg-white rounded-2xl p-7 w-[400px] max-w-[90vw] shadow-2xl" style={{fontFamily:"'Figtree',sans-serif"}}>
            <div className="flex items-center gap-2.5 mb-4"><div className="w-10 h-10 rounded-[10px] bg-red-50 flex items-center justify-center"><Trash2 size={18} className="text-red-500" /></div><div className="text-[17px] font-bold text-[#111]">Remove {isFood?'Item':'Service'}</div></div>
            <div className="text-[13px] text-[#666] leading-[20px] mb-2">What would you like to do with <strong className="text-[#111]">{deleteConfirm.name||'this service'}</strong>?</div>
            <div className="text-[12px] text-[#999] leading-[18px] mb-6 p-3 bg-[#FAFAF8] rounded-[10px] border border-[#F0EDE7]"><strong className="text-[#666]">Archive</strong> &mdash; hides from booking, restorable<br/><strong className="text-[#666]">Delete</strong> &mdash; permanently removes</div>
            <div className="flex gap-2">
              <button onClick={()=>setDeleteConfirm(null)} className="flex-1 py-3 rounded-[10px] border border-[#E5E5E5] bg-white text-[13px] font-semibold text-[#333]" style={{fontFamily:"'Figtree',sans-serif"}}>Cancel</button>
              <button onClick={handleArchive} className="flex-1 py-3 rounded-[10px] border border-[#111] bg-white text-[13px] font-semibold text-[#111]" style={{fontFamily:"'Figtree',sans-serif"}}>Archive</button>
              <button onClick={handleDelete} className="flex-1 py-3 rounded-[10px] bg-[#EF4444] text-[13px] font-semibold text-white border-none" style={{fontFamily:"'Figtree',sans-serif"}}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* CATEGORY MODAL */}
      {catModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[100] backdrop-blur-sm" onClick={()=>setCatModal(false)}>
          <div onClick={e=>e.stopPropagation()} className="bg-white rounded-2xl p-7 w-[380px] max-w-[90vw] shadow-2xl" style={{fontFamily:"'Figtree',sans-serif"}}>
            <div className="text-[17px] font-bold text-[#111] mb-4">New category</div>
            <div><label className="block text-[11px] font-semibold text-[#111] mb-1.5">Category name</label>
            <input type="text" value={newCatName} onChange={e=>setNewCatName(e.target.value)} placeholder="e.g. Skin Treatments" autoFocus className="w-full px-3 py-2.5 border border-[#E8E4DD] rounded-lg text-[13px] font-medium text-[#111] outline-none focus:border-[#C9A84C] bg-white" style={{fontFamily:"'Figtree',sans-serif"}} /></div>
            <div className="flex gap-2 mt-5">
              <button onClick={()=>{setCatModal(false);setNewCatName('')}} className="flex-1 py-2.5 rounded-[10px] border border-[#E8E4DD] bg-white text-[12px] font-semibold text-[#111]" style={{fontFamily:"'Figtree',sans-serif"}}>Cancel</button>
              <button onClick={handleCreateCategory} disabled={!newCatName.trim()} className="flex-1 py-2.5 rounded-[10px] bg-[#111] text-white text-[12px] font-bold disabled:opacity-50" style={{fontFamily:"'Figtree',sans-serif"}}>Create</button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 px-5 py-3 bg-[#111] text-white rounded-xl shadow-2xl z-[200]" style={{fontFamily:"'Figtree',sans-serif",animation:'toastUp 0.3s ease-out'}}>
          {toast.type==='delete' && <Trash2 size={14} className="text-red-400" />}
          {toast.type==='success' && <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg></div>}
          {toast.type==='error' && <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center"><X size={10} className="text-white" /></div>}
          <span className="text-[13px] font-semibold">{toast.msg}</span>
          {toast.type==='delete' && <button onClick={()=>navigate('/dashboard/deleted')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-white/20 bg-white/10 text-[#C9A84C] text-[11px] font-bold" style={{fontFamily:"'Figtree',sans-serif"}}><Archive size={11} /> View Deleted</button>}
        </div>
      )}

      <style>{`
        @keyframes slideIn{from{width:0;opacity:0}to{width:380px;opacity:1}}
        @keyframes toastUp{from{opacity:0;transform:translateX(-50%) translateY(16px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
      `}</style>
    </div>
  )
}

export default Services
