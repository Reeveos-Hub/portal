import adminFetch from '../../utils/adminFetch'
import { useState, useEffect, useCallback } from 'react'
import {
  HelpCircle, Plus, Search, Trash2, RefreshCw,
  ChevronRight, X, Save, Image, Eye, EyeOff,
  ArrowLeft, Upload, CheckCircle2, AlertCircle, BookOpen, Layers
} from 'lucide-react'

const API = import.meta.env.VITE_API_URL || ''

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

function StatusBadge({ status }) {
  const c = status === 'published'
    ? { background: 'rgba(16,185,129,0.12)', color: '#10B981' }
    : { background: 'rgba(107,114,128,0.15)', color: '#9CA3AF' }
  return <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 4, ...c }}>{status}</span>
}

function ScreenshotSlot({ articleId, sectionIdx, stepIdx, currentUrl, onUploaded }) {
  const [uploading, setUploading] = useState(false)
  async function handleFile(e) {
    const file = e.target.files[0]; if (!file) return
    setUploading(true)
    const form = new FormData(); form.append('file', file)
    try {
      const r = await adminFetch(`${API}/admin/help-centre/articles/${articleId}/screenshot?section_index=${sectionIdx}&step_index=${stepIdx}`, { method: 'POST', body: form })
      if (r.ok) onUploaded()
    } catch(err) { console.error(err) }
    setUploading(false)
  }
  if (currentUrl) return (
    <div className="mt-2 rounded-lg overflow-hidden border border-gray-700 relative">
      <img src={currentUrl} alt="" className="w-full block max-h-48 object-cover" />
      <label className="absolute bottom-2 right-2 bg-black/70 text-amber-400 text-[10px] font-semibold px-2 py-1 rounded cursor-pointer">
        {uploading ? 'Uploading…' : 'Replace'}<input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFile} className="hidden" />
      </label>
    </div>
  )
  return (
    <label className="flex items-center gap-2 mt-2 px-3 py-2.5 rounded-lg border border-dashed border-amber-600/30 bg-amber-500/5 cursor-pointer">
      <Upload size={13} className="text-amber-400 shrink-0" />
      <span className="text-[11px] text-amber-400 font-medium">{uploading ? 'Uploading…' : 'Upload screenshot — PNG / JPG / WebP, max 2MB'}</span>
      <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFile} className="hidden" />
    </label>
  )
}

function ArticleEditor({ article, categories, onSave, onBack }) {
  const isNew = !article?.id
  const [form, setForm] = useState(article || { title:'', slug:'', category_id: categories[0]?.id||'', intro:'', toc:[], sections:[], faqs:[], related:[], status:'published' })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState(null)

  const set = (k,v) => setForm(f => ({...f,[k]:v}))
  const autoSlug = t => { if (isNew) set('slug', slugify(t)) }
  const addSection = () => set('sections', [...(form.sections||[]), {title:'',steps:[]}])
  const updateSection = (si,k,v) => { const s=[...(form.sections||[])]; s[si]={...s[si],[k]:v}; set('sections',s) }
  const removeSection = si => set('sections', (form.sections||[]).filter((_,i)=>i!==si))
  const addStep = si => { const s=[...(form.sections||[])]; s[si]={...s[si],steps:[...(s[si].steps||[]),{text:'',screenshot:false,screenshot_url:null}]}; set('sections',s) }
  const updateStep = (si,idx,k,v) => { const s=[...(form.sections||[])]; const st=[...(s[si].steps||[])]; st[idx]={...st[idx],[k]:v}; s[si]={...s[si],steps:st}; set('sections',s) }
  const removeStep = (si,idx) => { const s=[...(form.sections||[])]; s[si].steps=s[si].steps.filter((_,i)=>i!==idx); set('sections',s) }
  const addFaq = () => set('faqs', [...(form.faqs||[]),{q:'',a:''}])
  const updateFaq = (i,k,v) => { const f=[...(form.faqs||[])]; f[i]={...f[i],[k]:v}; set('faqs',f) }
  const removeFaq = i => set('faqs', (form.faqs||[]).filter((_,idx)=>idx!==i))
  const addToc = () => set('toc', [...(form.toc||[]),''])
  const updateToc = (i,v) => { const t=[...(form.toc||[])]; t[i]=v; set('toc',t) }
  const removeToc = i => set('toc', (form.toc||[]).filter((_,idx)=>idx!==i))

  async function save() {
    if (!form.title||!form.slug||!form.category_id) { setMsg({type:'error',text:'Title, slug and category are required'}); return }
    setSaving(true)
    try {
      const url = isNew ? `${API}/admin/help-centre/articles` : `${API}/admin/help-centre/articles/${article.id}`
      const r = await adminFetch(url, { method: isNew?'POST':'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify(form) })
      if (r.ok) { const d=await r.json(); setMsg({type:'ok',text:'Saved'}); onSave(d.article) }
      else { const e=await r.json(); setMsg({type:'error',text:e.detail||'Save failed'}) }
    } catch { setMsg({type:'error',text:'Network error'}) }
    setSaving(false)
  }

  const inp = "w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white text-xs focus:outline-none focus:border-amber-600/40 placeholder-gray-600"

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="shrink-0 px-5 py-3.5 border-b border-gray-800 flex items-center gap-3">
        <button onClick={onBack} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 bg-transparent border-none cursor-pointer"><ArrowLeft size={14}/> Back</button>
        <span className="text-gray-700">|</span>
        <span className="text-sm font-semibold text-white flex-1">{isNew ? 'New Article' : `Editing: ${form.title||'Untitled'}`}</span>
        {msg && <span className={`text-xs flex items-center gap-1 ${msg.type==='ok'?'text-emerald-400':'text-red-400'}`}>{msg.type==='ok'?<CheckCircle2 size={12}/>:<AlertCircle size={12}/>} {msg.text}</span>}
        <button onClick={save} disabled={saving} className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold border-none cursor-pointer" style={{background:'#C9A84C',color:'#111'}}>
          <Save size={12}/> {saving?'Saving…':'Save'}
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div><label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Title *</label><input className={inp} value={form.title||''} placeholder="How to create a booking" onChange={e=>{set('title',e.target.value);autoSlug(e.target.value)}}/></div>
          <div><label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Slug * (URL)</label><input className={inp} value={form.slug||''} placeholder="create-booking" onChange={e=>set('slug',slugify(e.target.value))}/></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Category *</label>
            <select className={inp} value={form.category_id||''} onChange={e=>set('category_id',e.target.value)}>
              <option value="">Select category…</option>
              {categories.map(c=><option key={c.id} value={c.id}>{c.icon} {c.title}</option>)}
            </select></div>
          <div><label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Status</label>
            <select className={inp} value={form.status||'published'} onChange={e=>set('status',e.target.value)}>
              <option value="published">Published</option><option value="draft">Draft</option>
            </select></div>
        </div>
        <div><label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Intro paragraph</label>
          <textarea className={`${inp} resize-y min-h-[64px]`} value={form.intro||''} placeholder="One sentence explaining what this article covers and why it matters." onChange={e=>set('intro',e.target.value)}/></div>

        {/* TOC */}
        <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Table of Contents</span>
            <button onClick={addToc} className="flex items-center gap-1 text-xs text-amber-400 bg-transparent border-none cursor-pointer"><Plus size={11}/> Add item</button>
          </div>
          {!(form.toc?.length) && <p className="text-xs text-gray-600 italic">No TOC items yet</p>}
          {(form.toc||[]).map((item,i)=>(
            <div key={i} className="flex gap-2 mb-2">
              <input className={`${inp} flex-1`} value={item} placeholder={`Step ${i+1}`} onChange={e=>updateToc(i,e.target.value)}/>
              <button onClick={()=>removeToc(i)} className="text-gray-600 hover:text-gray-400 bg-transparent border-none cursor-pointer"><X size={13}/></button>
            </div>
          ))}
        </div>

        {/* Sections */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Sections &amp; Steps</span>
            <button onClick={addSection} className="flex items-center gap-1 text-xs text-amber-400 bg-transparent border-none cursor-pointer"><Plus size={11}/> Add section</button>
          </div>
          {!(form.sections?.length) && <div className="text-center py-6 rounded-xl border border-dashed border-gray-800 text-gray-600 text-xs">No sections yet — click Add section</div>}
          {(form.sections||[]).map((sec,si)=>(
            <div key={si} className="mb-3 rounded-xl border border-gray-800 bg-gray-900/60 p-4">
              <div className="flex gap-2 mb-3"><input className={`${inp} flex-1`} value={sec.title||''} placeholder="Section title" onChange={e=>updateSection(si,'title',e.target.value)}/><button onClick={()=>removeSection(si)} className="text-gray-600 hover:text-red-400 bg-transparent border-none cursor-pointer"><Trash2 size={13}/></button></div>
              {(sec.steps||[]).map((step,idx)=>(
                <div key={idx} className="mb-3 pl-3 border-l-2 border-amber-600/20">
                  <div className="flex gap-2 items-start">
                    <span className="shrink-0 mt-2 w-5 h-5 rounded-full bg-gray-800 flex items-center justify-center text-[10px] font-bold text-amber-400">{idx+1}</span>
                    <textarea className={`${inp} resize-y min-h-[48px] flex-1`} value={step.text||''} placeholder="Step instruction…" onChange={e=>updateStep(si,idx,'text',e.target.value)}/>
                    <div className="shrink-0 flex flex-col gap-1">
                      <button onClick={()=>updateStep(si,idx,'screenshot',!step.screenshot)} className={`p-1.5 rounded border cursor-pointer bg-transparent ${step.screenshot?'border-amber-600/50 text-amber-400':'border-gray-700 text-gray-600'}`}><Image size={12}/></button>
                      <button onClick={()=>removeStep(si,idx)} className="p-1.5 rounded border border-gray-700 bg-transparent text-gray-600 hover:text-red-400 cursor-pointer"><X size={12}/></button>
                    </div>
                  </div>
                  {step.screenshot && !article?.id && <p className="text-[10px] text-gray-600 italic mt-1 pl-7">Save first, then upload screenshot.</p>}
                  {step.screenshot && article?.id && <div className="pl-7"><ScreenshotSlot articleId={article.id} sectionIdx={si} stepIdx={idx} currentUrl={step.screenshot_url} onUploaded={()=>window.location.reload()}/></div>}
                </div>
              ))}
              <button onClick={()=>addStep(si)} className="flex items-center gap-1.5 text-xs text-gray-500 border border-dashed border-gray-700 rounded-lg px-3 py-1.5 mt-1 cursor-pointer bg-transparent hover:text-gray-300"><Plus size={11}/> Add step</button>
            </div>
          ))}
        </div>

        {/* FAQs */}
        <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">FAQs</span>
            <button onClick={addFaq} className="flex items-center gap-1 text-xs text-amber-400 bg-transparent border-none cursor-pointer"><Plus size={11}/> Add FAQ</button>
          </div>
          {!(form.faqs?.length) && <p className="text-xs text-gray-600 italic">No FAQs yet</p>}
          {(form.faqs||[]).map((faq,i)=>(
            <div key={i} className="mb-3 p-3 rounded-lg border border-gray-800">
              <div className="flex gap-2 mb-2"><input className={`${inp} flex-1`} value={faq.q||''} placeholder="Question" onChange={e=>updateFaq(i,'q',e.target.value)}/><button onClick={()=>removeFaq(i)} className="text-gray-600 hover:text-red-400 bg-transparent border-none cursor-pointer"><X size={13}/></button></div>
              <textarea className={`${inp} resize-y min-h-[48px]`} value={faq.a||''} placeholder="Answer" onChange={e=>updateFaq(i,'a',e.target.value)}/>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function AdminHelpCentre() {
  const [categories, setCategories] = useState([])
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [seeding, setSeeding] = useState(false)
  const [selectedCat, setSelectedCat] = useState(null)
  const [editingArticle, setEditingArticle] = useState(null)
  const [searchQ, setSearchQ] = useState('')

  const doSeed = useCallback(async () => {
    setSeeding(true)
    try {
      const { CATEGORIES, ARTICLES } = await import('../../data/helpData.js')
      const r = await adminFetch(`${API}/admin/help-centre/seed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categories: CATEGORIES, articles: ARTICLES }),
      })
      const d = await r.json()
      if (d.ok || d.categories) return true
    } catch(e) { console.error('Seed error:', e) }
    setSeeding(false)
    return false
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [cr, ar] = await Promise.all([
        adminFetch(`${API}/admin/help-centre/categories`),
        adminFetch(`${API}/admin/help-centre/articles`),
      ])
      const cats = cr.ok ? (await cr.json()).categories || [] : []
      const arts = ar.ok ? (await ar.json()).articles || [] : []

      // Auto-seed if empty
      if (cats.length === 0) {
        setSeeding(true)
        const { CATEGORIES, ARTICLES } = await import('../../data/helpData.js')
        const sr = await adminFetch(`${API}/admin/help-centre/seed`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ categories: CATEGORIES, articles: ARTICLES }),
        })
        const sd = await sr.json()
        if (sd.ok) {
          // Reload after seed
          const [cr2, ar2] = await Promise.all([
            adminFetch(`${API}/admin/help-centre/categories`),
            adminFetch(`${API}/admin/help-centre/articles`),
          ])
          setCategories(cr2.ok ? (await cr2.json()).categories || [] : [])
          setArticles(ar2.ok ? (await ar2.json()).articles || [] : [])
          setSeeding(false)
          setLoading(false)
          return
        }
        setSeeding(false)
      }

      setCategories(cats)
      setArticles(arts)
    } catch(e) { console.error(e) }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function deleteArticle(id, e) {
    e.stopPropagation()
    if (!confirm('Delete this article?')) return
    await adminFetch(`${API}/admin/help-centre/articles/${id}`, { method: 'DELETE' })
    load()
  }

  async function toggleStatus(art, e) {
    e.stopPropagation()
    await adminFetch(`${API}/admin/help-centre/articles/${art.id}`, {
      method: 'PUT', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ status: art.status==='published'?'draft':'published' }),
    })
    load()
  }

  if (editingArticle !== null) {
    const art = editingArticle === 'new' ? undefined : articles.find(a => a.id === editingArticle)
    return (
      <div className="h-full flex flex-col overflow-hidden">
        <ArticleEditor article={art} categories={categories} onSave={() => { load(); setEditingArticle(null) }} onBack={() => setEditingArticle(null)} />
      </div>
    )
  }

  const filtered = articles.filter(a => {
    const matchCat = !selectedCat || a.category_id === selectedCat
    const matchQ = !searchQ || a.title.toLowerCase().includes(searchQ.toLowerCase())
    return matchCat && matchQ
  })

  const stats = { published: articles.filter(a=>a.status==='published').length, draft: articles.filter(a=>a.status==='draft').length, cats: categories.length }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="shrink-0 px-5 pt-5 pb-3 border-b border-gray-800">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{background:'rgba(201,168,76,0.1)'}}>
              <HelpCircle size={18} style={{color:'#C9A84C'}}/>
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Help Centre</h1>
              <p className="text-[11px] text-gray-500">{stats.cats} categories · {stats.published} published · {stats.draft} drafts</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setEditingArticle('new')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border-none cursor-pointer" style={{background:'rgba(201,168,76,0.12)',color:'#C9A84C'}}>
              <Plus size={13}/> New Article
            </button>
            <button onClick={load} className="p-1.5 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-gray-800 cursor-pointer border-none bg-transparent"><RefreshCw size={14}/></button>
          </div>
        </div>
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600"/>
          <input value={searchQ} onChange={e=>setSearchQ(e.target.value)} placeholder="Search articles…"
            className="w-full pl-8 pr-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-xs text-gray-300 placeholder-gray-600 focus:outline-none"/>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-48 shrink-0 border-r border-gray-800 overflow-y-auto py-2">
          <button onClick={() => setSelectedCat(null)} className="flex items-center justify-between w-full px-3.5 py-2 text-left border-none cursor-pointer bg-transparent"
            style={{borderLeft: !selectedCat?'3px solid #C9A84C':'3px solid transparent', background: !selectedCat?'rgba(201,168,76,0.08)':'transparent'}}>
            <span className="text-xs font-semibold" style={{color: !selectedCat?'#C9A84C':''}}>All articles</span>
            <span className="text-[10px] text-gray-600">{articles.length}</span>
          </button>
          {categories.map(cat => {
            const count = articles.filter(a=>a.category_id===cat.id).length
            const active = selectedCat===cat.id
            return (
              <button key={cat.id} onClick={()=>setSelectedCat(cat.id)} className="flex items-center justify-between w-full px-3.5 py-2 text-left border-none cursor-pointer bg-transparent"
                style={{borderLeft:active?'3px solid #C9A84C':'3px solid transparent',background:active?'rgba(201,168,76,0.08)':'transparent'}}>
                <span className="text-[11px] flex items-center gap-1.5" style={{color:active?'#C9A84C':'#9CA3AF'}}><span>{cat.icon}</span><span>{cat.title}</span></span>
                <span className="text-[10px] text-gray-600">{count}</span>
              </button>
            )
          })}
        </div>

        {/* Article list */}
        <div className="flex-1 overflow-y-auto p-4">
          {(loading || seeding) ? (
            <div className="text-center py-16">
              <div className="w-8 h-8 border-2 border-amber-600/30 border-t-amber-400 rounded-full animate-spin mx-auto mb-3"/>
              <p className="text-sm text-gray-500">{seeding ? 'Setting up your Help Centre…' : 'Loading…'}</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen size={28} className="mx-auto mb-3 text-gray-700"/>
              <p className="text-sm text-gray-400 font-medium mb-1">No articles match</p>
              <p className="text-xs text-gray-600">Try a different search or category.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              {filtered.map(a => {
                const cat = categories.find(c=>c.id===a.category_id)
                const stepCount = (a.sections||[]).reduce((n,s)=>n+(s.steps?.length||0),0)
                const screenshotsDone = (a.sections||[]).reduce((n,s)=>n+(s.steps||[]).filter(st=>st.screenshot_url).length,0)
                const screenshotsPending = (a.sections||[]).reduce((n,s)=>n+(s.steps||[]).filter(st=>st.screenshot&&!st.screenshot_url).length,0)
                return (
                  <div key={a.id} onClick={()=>setEditingArticle(a.id)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-800 bg-gray-900/60 cursor-pointer hover:border-amber-600/30 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold text-white truncate">{a.title}</span>
                        <StatusBadge status={a.status}/>
                        {screenshotsPending>0 && <span className="text-[10px] text-amber-500 flex items-center gap-1"><Image size={10}/> {screenshotsPending} needed</span>}
                      </div>
                      <div className="flex gap-3 text-[11px] text-gray-600">
                        <span>{cat?.icon} {cat?.title}</span>
                        <span>{stepCount} steps</span>
                        <span>{(a.faqs||[]).length} FAQs</span>
                        {screenshotsDone>0 && <span className="text-emerald-500">{screenshotsDone} screenshots</span>}
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={e=>toggleStatus(a,e)} className="p-1.5 rounded-lg border border-gray-800 bg-transparent text-gray-600 hover:text-gray-300 cursor-pointer">
                        {a.status==='published'?<EyeOff size={12}/>:<Eye size={12}/>}
                      </button>
                      <button onClick={e=>deleteArticle(a.id,e)} className="p-1.5 rounded-lg border border-gray-800 bg-transparent text-gray-600 hover:text-red-400 cursor-pointer"><Trash2 size={12}/></button>
                      <ChevronRight size={14} className="text-gray-700 mt-0.5"/>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
