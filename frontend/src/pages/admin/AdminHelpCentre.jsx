import adminFetch from '../../utils/adminFetch'
import { useState, useEffect, useCallback } from 'react'
import {
  HelpCircle, Plus, Search, Edit3, Trash2, RefreshCw,
  ChevronRight, ChevronDown, X, Save, Image, Eye, EyeOff,
  ArrowLeft, Upload, CheckCircle2, AlertCircle, BookOpen,
  GripVertical, Layers
} from 'lucide-react'

const API = import.meta.env.VITE_API_URL || ''

// ── Helpers ──────────────────────────────────────────────

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

function StatusBadge({ status }) {
  const c = status === 'published'
    ? { bg: 'rgba(16,185,129,0.12)', color: '#10B981' }
    : { bg: 'rgba(107,114,128,0.15)', color: '#9CA3AF' }
  return (
    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 4, ...c }}>
      {status}
    </span>
  )
}

// ── Screenshot upload slot ───────────────────────────────

function ScreenshotSlot({ articleId, sectionIdx, stepIdx, currentUrl, onUploaded }) {
  const [uploading, setUploading] = useState(false)

  async function handleFile(e) {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    const form = new FormData()
    form.append('file', file)
    try {
      const r = await adminFetch(
        `${API}/admin/help-centre/articles/${articleId}/screenshot?section_index=${sectionIdx}&step_index=${stepIdx}`,
        { method: 'POST', body: form }
      )
      if (r.ok) { onUploaded() }
    } catch (e) { console.error(e) }
    setUploading(false)
  }

  if (currentUrl) {
    return (
      <div style={{ marginTop: 8, borderRadius: 8, overflow: 'hidden', border: '1px solid rgba(201,168,76,0.3)', position: 'relative' }}>
        <img src={currentUrl} alt="Screenshot" style={{ width: '100%', display: 'block', maxHeight: 200, objectFit: 'cover' }} />
        <label style={{ position: 'absolute', bottom: 6, right: 6, background: 'rgba(0,0,0,0.7)', color: '#C9A84C', fontSize: 10, fontWeight: 600, padding: '4px 8px', borderRadius: 6, cursor: 'pointer' }}>
          {uploading ? 'Uploading…' : 'Replace'}
          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFile} style={{ display: 'none' }} />
        </label>
      </div>
    )
  }

  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, padding: '10px 12px', borderRadius: 8, border: '1.5px dashed rgba(201,168,76,0.35)', background: 'rgba(201,168,76,0.04)', cursor: 'pointer' }}>
      <Upload size={13} style={{ color: '#C9A84C', flexShrink: 0 }} />
      <span style={{ fontSize: 11, color: '#C9A84C', fontWeight: 500 }}>
        {uploading ? 'Uploading…' : 'Upload screenshot (PNG / JPG / WebP, max 2MB)'}
      </span>
      <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFile} style={{ display: 'none' }} />
    </label>
  )
}

// ── Article Editor ───────────────────────────────────────

function ArticleEditor({ article, categories, onSave, onBack }) {
  const isNew = !article?.id
  const [form, setForm] = useState(article || {
    title: '', slug: '', category_id: categories[0]?.id || '',
    intro: '', toc: [], sections: [], faqs: [], related: [], status: 'published'
  })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState(null)

  function setField(key, val) {
    setForm(f => ({ ...f, [key]: val }))
  }

  function autoSlug(title) {
    if (isNew) setField('slug', slugify(title))
  }

  // Sections
  function addSection() {
    setForm(f => ({ ...f, sections: [...(f.sections || []), { title: '', steps: [] }] }))
  }
  function updateSection(si, key, val) {
    const secs = [...(form.sections || [])]
    secs[si] = { ...secs[si], [key]: val }
    setField('sections', secs)
  }
  function removeSection(si) {
    const secs = (form.sections || []).filter((_, i) => i !== si)
    setField('sections', secs)
  }

  // Steps
  function addStep(si) {
    const secs = [...(form.sections || [])]
    secs[si] = { ...secs[si], steps: [...(secs[si].steps || []), { text: '', screenshot: false, screenshot_url: null }] }
    setField('sections', secs)
  }
  function updateStep(si, stepIdx, key, val) {
    const secs = [...(form.sections || [])]
    const steps = [...(secs[si].steps || [])]
    steps[stepIdx] = { ...steps[stepIdx], [key]: val }
    secs[si] = { ...secs[si], steps }
    setField('sections', secs)
  }
  function removeStep(si, stepIdx) {
    const secs = [...(form.sections || [])]
    secs[si].steps = secs[si].steps.filter((_, i) => i !== stepIdx)
    setField('sections', secs)
  }

  // FAQs
  function addFaq() {
    setField('faqs', [...(form.faqs || []), { q: '', a: '' }])
  }
  function updateFaq(i, key, val) {
    const faqs = [...(form.faqs || [])]
    faqs[i] = { ...faqs[i], [key]: val }
    setField('faqs', faqs)
  }
  function removeFaq(i) {
    setField('faqs', (form.faqs || []).filter((_, idx) => idx !== i))
  }

  // TOC
  function addTocItem() {
    setField('toc', [...(form.toc || []), ''])
  }
  function updateToc(i, val) {
    const toc = [...(form.toc || [])]
    toc[i] = val
    setField('toc', toc)
  }
  function removeToc(i) {
    setField('toc', (form.toc || []).filter((_, idx) => idx !== i))
  }

  async function save() {
    if (!form.title || !form.slug || !form.category_id) {
      setMsg({ type: 'error', text: 'Title, slug and category are required' })
      return
    }
    setSaving(true)
    try {
      const url = isNew
        ? `${API}/admin/help-centre/articles`
        : `${API}/admin/help-centre/articles/${article.id}`
      const method = isNew ? 'POST' : 'PUT'
      const r = await adminFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (r.ok) {
        const d = await r.json()
        setMsg({ type: 'ok', text: 'Saved' })
        onSave(d.article)
      } else {
        const e = await r.json()
        setMsg({ type: 'error', text: e.detail || 'Save failed' })
      }
    } catch (e) { setMsg({ type: 'error', text: 'Network error' }) }
    setSaving(false)
  }

  const inputCls = {
    width: '100%', padding: '8px 10px', borderRadius: 8,
    background: 'var(--bg3,#1a1a1a)', border: '1px solid var(--border,#333)',
    color: 'var(--text,#e5e5e5)', fontSize: 13, outline: 'none', boxSizing: 'border-box',
    fontFamily: 'Figtree, system-ui, sans-serif',
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border,#333)', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted,#888)', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}>
          <ArrowLeft size={14} /> Back
        </button>
        <span style={{ color: 'var(--border,#444)' }}>|</span>
        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text,#e5e5e5)', flex: 1 }}>
          {isNew ? 'New Article' : `Editing: ${form.title || 'Untitled'}`}
        </span>
        {msg && (
          <span style={{ fontSize: 12, color: msg.type === 'ok' ? '#10B981' : '#ef4444', display: 'flex', alignItems: 'center', gap: 4 }}>
            {msg.type === 'ok' ? <CheckCircle2 size={13}/> : <AlertCircle size={13}/>} {msg.text}
          </span>
        )}
        <button onClick={save} disabled={saving}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, background: '#C9A84C', color: '#111', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
          <Save size={13}/> {saving ? 'Saving…' : 'Save'}
        </button>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '18px 20px' }}>

        {/* Core fields */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          <div>
            <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted,#888)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 4 }}>Title *</label>
            <input style={inputCls} value={form.title || ''} onChange={e => { setField('title', e.target.value); autoSlug(e.target.value) }} placeholder="How to create a booking" />
          </div>
          <div>
            <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted,#888)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 4 }}>Slug * (URL)</label>
            <input style={inputCls} value={form.slug || ''} onChange={e => setField('slug', slugify(e.target.value))} placeholder="create-booking" />
          </div>
          <div>
            <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted,#888)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 4 }}>Category *</label>
            <select style={{ ...inputCls }} value={form.category_id || ''} onChange={e => setField('category_id', e.target.value)}>
              <option value="">Select category…</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.title}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted,#888)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 4 }}>Status</label>
            <select style={{ ...inputCls }} value={form.status || 'published'} onChange={e => setField('status', e.target.value)}>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
          </div>
        </div>

        {/* Intro */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted,#888)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 4 }}>Intro paragraph</label>
          <textarea style={{ ...inputCls, resize: 'vertical', minHeight: 72 }} value={form.intro || ''} onChange={e => setField('intro', e.target.value)} placeholder="One sentence explaining what this article covers and why it matters." />
        </div>

        {/* TOC */}
        <div style={{ marginBottom: 16, padding: 14, borderRadius: 10, border: '1px solid var(--border,#333)', background: 'rgba(255,255,255,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted,#888)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Table of Contents</span>
            <button onClick={addTocItem} style={{ fontSize: 11, color: '#C9A84C', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Plus size={12}/> Add item
            </button>
          </div>
          {(form.toc || []).map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
              <input style={{ ...inputCls }} value={item} onChange={e => updateToc(i, e.target.value)} placeholder={`Step ${i+1} — e.g. "Open your calendar"`} />
              <button onClick={() => removeToc(i)} style={{ flexShrink: 0, background: 'none', border: 'none', cursor: 'pointer', color: '#666' }}><X size={13}/></button>
            </div>
          ))}
          {!(form.toc?.length) && <p style={{ fontSize: 11, color: '#555', fontStyle: 'italic' }}>No TOC items yet — click Add item</p>}
        </div>

        {/* Sections */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted,#888)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Sections & Steps</span>
            <button onClick={addSection} style={{ fontSize: 11, color: '#C9A84C', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Plus size={12}/> Add section
            </button>
          </div>

          {(form.sections || []).map((sec, si) => (
            <div key={si} style={{ marginBottom: 12, padding: 14, borderRadius: 10, border: '1px solid var(--border,#333)', background: 'rgba(255,255,255,0.02)' }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 10, alignItems: 'center' }}>
                <input style={{ ...inputCls, flex: 1 }} value={sec.title || ''} onChange={e => updateSection(si, 'title', e.target.value)} placeholder="Section title — e.g. Open your calendar" />
                <button onClick={() => removeSection(si)} style={{ flexShrink: 0, background: 'none', border: 'none', cursor: 'pointer', color: '#666' }}><Trash2 size={13}/></button>
              </div>

              {(sec.steps || []).map((step, stepIdx) => (
                <div key={stepIdx} style={{ marginBottom: 10, paddingLeft: 12, borderLeft: '2px solid rgba(201,168,76,0.25)' }}>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                    <span style={{ flexShrink: 0, marginTop: 8, width: 20, height: 20, borderRadius: '50%', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#C9A84C' }}>{stepIdx+1}</span>
                    <textarea
                      style={{ ...inputCls, resize: 'vertical', minHeight: 52, flex: 1 }}
                      value={step.text || ''} placeholder="Step instruction text…"
                      onChange={e => updateStep(si, stepIdx, 'text', e.target.value)}
                    />
                    <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <button
                        onClick={() => updateStep(si, stepIdx, 'screenshot', !step.screenshot)}
                        title="Toggle screenshot slot"
                        style={{ padding: '4px 6px', borderRadius: 6, border: `1px solid ${step.screenshot ? 'rgba(201,168,76,0.5)' : '#333'}`, background: step.screenshot ? 'rgba(201,168,76,0.1)' : 'none', cursor: 'pointer', color: step.screenshot ? '#C9A84C' : '#666' }}
                      >
                        <Image size={12}/>
                      </button>
                      <button onClick={() => removeStep(si, stepIdx)} style={{ padding: '4px 6px', borderRadius: 6, border: '1px solid #333', background: 'none', cursor: 'pointer', color: '#666' }}><X size={12}/></button>
                    </div>
                  </div>

                  {step.screenshot && !article?.id && (
                    <p style={{ fontSize: 10, color: '#666', fontStyle: 'italic', marginTop: 4, paddingLeft: 26 }}>Save the article first, then upload the screenshot.</p>
                  )}
                  {step.screenshot && article?.id && (
                    <div style={{ paddingLeft: 26 }}>
                      <ScreenshotSlot
                        articleId={article.id}
                        sectionIdx={si}
                        stepIdx={stepIdx}
                        currentUrl={step.screenshot_url}
                        onUploaded={() => window.location.reload()}
                      />
                    </div>
                  )}
                </div>
              ))}

              <button onClick={() => addStep(si)} style={{ fontSize: 11, color: 'var(--text-muted,#888)', background: 'none', border: '1px dashed #333', borderRadius: 6, padding: '5px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                <Plus size={11}/> Add step
              </button>
            </div>
          ))}

          {!(form.sections?.length) && (
            <div style={{ textAlign: 'center', padding: '20px', border: '1px dashed #333', borderRadius: 10, color: '#555', fontSize: 12 }}>
              No sections yet — click Add section to start building the article
            </div>
          )}
        </div>

        {/* FAQs */}
        <div style={{ marginBottom: 16, padding: 14, borderRadius: 10, border: '1px solid var(--border,#333)', background: 'rgba(255,255,255,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted,#888)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>FAQs</span>
            <button onClick={addFaq} style={{ fontSize: 11, color: '#C9A84C', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Plus size={12}/> Add FAQ
            </button>
          </div>
          {(form.faqs || []).map((faq, i) => (
            <div key={i} style={{ marginBottom: 10, padding: 10, borderRadius: 8, border: '1px solid var(--border,#2a2a2a)' }}>
              <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                <input style={{ ...inputCls, flex: 1 }} value={faq.q || ''} placeholder="Question" onChange={e => updateFaq(i, 'q', e.target.value)} />
                <button onClick={() => removeFaq(i)} style={{ flexShrink: 0, background: 'none', border: 'none', cursor: 'pointer', color: '#666' }}><X size={13}/></button>
              </div>
              <textarea style={{ ...inputCls, resize: 'vertical', minHeight: 52 }} value={faq.a || ''} placeholder="Answer" onChange={e => updateFaq(i, 'a', e.target.value)} />
            </div>
          ))}
          {!(form.faqs?.length) && <p style={{ fontSize: 11, color: '#555', fontStyle: 'italic' }}>No FAQs yet</p>}
        </div>

      </div>
    </div>
  )
}

// ── Main component ───────────────────────────────────────

export default function AdminHelpCentre() {
  const [categories, setCategories] = useState([])
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCat, setSelectedCat] = useState(null)
  const [editingArticle, setEditingArticle] = useState(null)
  const [searchQ, setSearchQ] = useState('')
  const [seeding, setSeeding] = useState(false)
  const [seedMsg, setSeedMsg] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [cr, ar] = await Promise.all([
        adminFetch(`${API}/admin/help-centre/categories`),
        adminFetch(`${API}/admin/help-centre/articles`),
      ])
      if (cr.ok) { const d = await cr.json(); setCategories(d.categories || []) }
      if (ar.ok) { const d = await ar.json(); setArticles(d.articles || []) }
    } catch (e) { console.error(e) }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function deleteArticle(id, e) {
    e.stopPropagation()
    if (!confirm('Delete this article? This cannot be undone.')) return
    await adminFetch(`${API}/admin/help-centre/articles/${id}`, { method: 'DELETE' })
    load()
  }

  async function toggleStatus(article, e) {
    e.stopPropagation()
    const newStatus = article.status === 'published' ? 'draft' : 'published'
    await adminFetch(`${API}/admin/help-centre/articles/${article.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    load()
  }

  async function seedFromJS() {
    setSeeding(true)
    setSeedMsg(null)
    try {
      // Dynamically import the JS data to seed
      const { CATEGORIES, ARTICLES } = await import('../../data/helpData.js')
      const r = await adminFetch(`${API}/admin/help-centre/seed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categories: CATEGORIES, articles: ARTICLES }),
      })
      const d = await r.json()
      setSeedMsg(d.ok
        ? `Seeded ${d.categories_inserted} categories and ${d.articles_inserted} articles into MongoDB.`
        : d.message)
      if (d.ok) load()
    } catch (e) { setSeedMsg('Seed failed: ' + e.message) }
    setSeeding(false)
  }

  // Editing
  if (editingArticle !== null) {
    const article = editingArticle === 'new' ? null : articles.find(a => a.id === editingArticle)
    return (
      <div className="h-full flex flex-col overflow-hidden">
        <ArticleEditor
          article={article || undefined}
          categories={categories}
          onSave={() => { load(); setEditingArticle(null) }}
          onBack={() => setEditingArticle(null)}
        />
      </div>
    )
  }

  // Filter
  const filteredArticles = articles.filter(a => {
    const matchCat = !selectedCat || a.category_id === selectedCat
    const matchQ = !searchQ || a.title.toLowerCase().includes(searchQ.toLowerCase())
    return matchCat && matchQ
  })

  const stats = {
    total: articles.length,
    published: articles.filter(a => a.status === 'published').length,
    draft: articles.filter(a => a.status === 'draft').length,
    cats: categories.length,
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">

      {/* Header */}
      <div className="shrink-0 px-5 pt-5 pb-3 border-b border-gray-800">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(201,168,76,0.1)' }}>
              <HelpCircle size={18} style={{ color: '#C9A84C' }}/>
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Help Centre</h1>
              <p className="text-[11px] text-gray-500">
                {stats.cats} categories · {stats.published} published · {stats.draft} drafts
              </p>
            </div>
          </div>
          <div className="flex gap-2 items-center">
            {seedMsg && <span className="text-[11px] text-gray-400 max-w-xs truncate">{seedMsg}</span>}
            <button
              onClick={seedFromJS}
              disabled={seeding}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-400 hover:text-gray-200 border border-gray-700 hover:border-gray-600"
            >
              <Layers size={12}/> {seeding ? 'Seeding…' : 'Seed from JS'}
            </button>
            <button
              onClick={() => setEditingArticle('new')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
              style={{ background: 'rgba(201,168,76,0.12)', color: '#C9A84C' }}
            >
              <Plus size={13}/> New Article
            </button>
            <button onClick={load} className="p-1.5 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-gray-800">
              <RefreshCw size={14}/>
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
          <input
            value={searchQ}
            onChange={e => setSearchQ(e.target.value)}
            placeholder="Search articles…"
            className="w-full pl-8 pr-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-xs text-gray-300 placeholder-gray-600 focus:outline-none"
          />
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden">

        {/* Category sidebar */}
        <div style={{ width: 200, flexShrink: 0, borderRight: '1px solid var(--border,#222)', overflowY: 'auto', padding: '8px 0' }}>
          <button
            onClick={() => setSelectedCat(null)}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '8px 14px', background: !selectedCat ? 'rgba(201,168,76,0.08)' : 'none', border: 'none', cursor: 'pointer', borderLeft: !selectedCat ? '3px solid #C9A84C' : '3px solid transparent' }}
          >
            <span style={{ fontSize: 12, fontWeight: 600, color: !selectedCat ? '#C9A84C' : 'var(--text,#e5e5e5)' }}>All articles</span>
            <span style={{ fontSize: 10, color: '#666' }}>{articles.length}</span>
          </button>
          {categories.map(cat => {
            const count = articles.filter(a => a.category_id === cat.id).length
            const active = selectedCat === cat.id
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCat(cat.id)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '8px 14px', background: active ? 'rgba(201,168,76,0.08)' : 'none', border: 'none', cursor: 'pointer', borderLeft: active ? '3px solid #C9A84C' : '3px solid transparent', textAlign: 'left' }}
              >
                <span style={{ fontSize: 12, color: active ? '#C9A84C' : 'var(--text-muted,#999)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>{cat.icon}</span> <span style={{ fontSize: 11 }}>{cat.title}</span>
                </span>
                <span style={{ fontSize: 10, color: '#555' }}>{count}</span>
              </button>
            )
          })}
        </div>

        {/* Article list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
          {loading ? (
            <div className="text-center py-12 text-gray-600 text-sm">Loading…</div>
          ) : filteredArticles.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen size={28} className="mx-auto mb-3 text-gray-700" />
              <p className="text-sm text-gray-500 font-medium mb-1">
                {articles.length === 0 ? 'No articles yet' : 'No matches'}
              </p>
              <p className="text-xs text-gray-600 mb-4">
                {articles.length === 0
                  ? 'Click "Seed from JS" to import all 91 articles, or create one manually.'
                  : 'Try a different search or category filter.'}
              </p>
              {articles.length === 0 && (
                <button onClick={seedFromJS} disabled={seeding}
                  className="text-xs px-4 py-2 rounded-lg font-semibold"
                  style={{ background: 'rgba(201,168,76,0.12)', color: '#C9A84C' }}>
                  {seeding ? 'Seeding…' : 'Seed 91 articles now'}
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {filteredArticles.map(a => {
                const cat = categories.find(c => c.id === a.category_id)
                const stepCount = (a.sections || []).reduce((n, s) => n + (s.steps?.length || 0), 0)
                const screenshotCount = (a.sections || []).reduce((n, s) =>
                  n + (s.steps || []).filter(st => st.screenshot_url).length, 0)
                const pendingScreenshots = (a.sections || []).reduce((n, s) =>
                  n + (s.steps || []).filter(st => st.screenshot && !st.screenshot_url).length, 0)

                return (
                  <div
                    key={a.id}
                    onClick={() => setEditingArticle(a.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 10, border: '1px solid var(--border,#2a2a2a)', background: 'rgba(255,255,255,0.02)', cursor: 'pointer', transition: 'border-color 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(201,168,76,0.3)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border,#2a2a2a)'}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text,#e5e5e5)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.title}</span>
                        <StatusBadge status={a.status} />
                        {pendingScreenshots > 0 && (
                          <span style={{ fontSize: 10, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: 3 }}>
                            <Image size={10}/> {pendingScreenshots} screenshot{pendingScreenshots > 1 ? 's' : ''} needed
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 11, color: '#555', display: 'flex', gap: 10 }}>
                        <span>{cat?.icon} {cat?.title}</span>
                        <span>{stepCount} step{stepCount !== 1 ? 's' : ''}</span>
                        <span>{(a.faqs || []).length} FAQs</span>
                        {screenshotCount > 0 && <span style={{ color: '#10B981' }}>{screenshotCount} screenshot{screenshotCount !== 1 ? 's' : ''}</span>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                      <button
                        onClick={e => toggleStatus(a, e)}
                        title={a.status === 'published' ? 'Set to draft' : 'Publish'}
                        style={{ padding: '5px 6px', borderRadius: 6, border: '1px solid #2a2a2a', background: 'none', cursor: 'pointer', color: '#666' }}
                      >
                        {a.status === 'published' ? <EyeOff size={12}/> : <Eye size={12}/>}
                      </button>
                      <button
                        onClick={e => deleteArticle(a.id, e)}
                        style={{ padding: '5px 6px', borderRadius: 6, border: '1px solid #2a2a2a', background: 'none', cursor: 'pointer', color: '#666' }}
                      >
                        <Trash2 size={12}/>
                      </button>
                      <ChevronRight size={14} style={{ color: '#444', marginTop: 2 }} />
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
