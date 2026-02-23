/**
 * Run 4: Services / Menu — CRUD, categories, reorder
 * Adapts based on business.type (services vs restaurant)
 */

import { useState, useEffect } from 'react'
import { useBusiness } from '../../contexts/BusinessContext'
import api from '../../utils/api'
import Card from '../../components/shared/Card'

const DURATION_OPTS = [15, 30, 45, 60, 90, 120, 150, 180, 240]
const DIETARY_LABELS = { v: 'V', ve: 'VE', gf: 'GF', df: 'DF', nf: 'NF', h: 'H' }
const PREP_OPTS = [5, 10, 15, 20, 25, 30]

const Services = () => {
  const { business, businessType, tier } = useBusiness()
  const isRestaurant = businessType === 'restaurant'
  const [categories, setCategories] = useState([])
  const [staff, setStaff] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [saving, setSaving] = useState(false)

  const base = isRestaurant ? '/menu' : '/services-v2'
  const fetchUrl = `${base}/business/${business?.id ?? business?._id}`

  const fetchData = async () => {
    if (!(business?.id ?? business?._id)) return
    setLoading(true)
    try {
      const res = await api.get(fetchUrl)
      setCategories(res.categories || [])
      if (!isRestaurant) {
        const staffRes = await api.get(`/staff/business/${(business?.id ?? business?._id)}/staff`).catch(() => [])
        setStaff(Array.isArray(staffRes) ? staffRes : [])
      }
    } catch (err) {
      console.error('Failed to fetch:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [business?.id ?? business?._id, isRestaurant, fetchUrl])

  const handleAdd = () => {
    setModal({
      mode: 'add',
      item: isRestaurant
        ? { name: '', categoryId: categories[0]?.id, description: '', price: '', dietary: [], prepTime: 15 }
        : { name: '', categoryId: categories[0]?.id, description: '', duration: 60, price: '', staffIds: [], online: true },
    })
  }

  const handleEdit = (item, catId) => {
    setModal({
      mode: 'edit',
      item: { ...item, categoryId: item.categoryId || catId },
      id: item.id,
    })
  }

  const handleSave = async () => {
    if (!(business?.id ?? business?._id) || !modal) return
    setSaving(true)
    try {
      if (modal.mode === 'add') {
        const payload = {
          name: modal.item.name,
          categoryId: modal.item.categoryId,
          description: modal.item.description,
          price: parseFloat(modal.item.price) || 0,
        }
        if (isRestaurant) {
          payload.dietary = modal.item.dietary || []
          payload.prepTime = modal.item.prepTime || 15
        } else {
          payload.duration = modal.item.duration || 60
          payload.staffIds = modal.item.staffIds || []
          payload.online = modal.item.online !== false
        }
        await api.post(fetchUrl, payload)
      } else {
        const payload = {
          name: modal.item.name,
          categoryId: modal.item.categoryId,
          description: modal.item.description,
          price: parseFloat(modal.item.price) || 0,
        }
        if (isRestaurant) {
          payload.dietary = modal.item.dietary || []
          payload.prepTime = modal.item.prepTime || 15
        } else {
          payload.duration = modal.item.duration || 60
          payload.staffIds = modal.item.staffIds || []
          payload.online = modal.item.online !== false
        }
        await api.put(`${fetchUrl}/${modal.id}`, payload)
      }
      setModal(null)
      fetchData()
    } catch (err) {
      alert(err.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (item) => {
    if (!confirm(`Delete "${item.name}"?`)) return
    try {
      await api.delete(`${fetchUrl}/${item.id}`)
      fetchData()
    } catch (err) {
      alert(err.message || 'Delete failed')
    }
  }

  const handleToggleOnline = async (item) => {
    if (isRestaurant) return
    try {
      await api.patch(`${fetchUrl}/${item.id}/toggle`, { online: !item.online })
      fetchData()
    } catch (err) {
      alert(err.message || 'Update failed')
    }
  }

  const handleToggle86 = async (item) => {
    if (!isRestaurant) return
    try {
      await api.patch(`${fetchUrl}/${item.id}/86`, { is86d: !item.is86d })
      fetchData()
    } catch (err) {
      alert(err.message || 'Update failed')
    }
  }

  const createCategory = async () => {
    const name = prompt('Category name:')
    if (!name?.trim()) return
    try {
      await api.post(`${base}/categories/business/${(business?.id ?? business?._id)}`, { name: name.trim() })
      fetchData()
    } catch (err) {
      alert(err.message || 'Failed to create category')
    }
  }

  if (!(business?.id ?? business?._id)) {
    return (
      <div className="text-center py-12">
        <p className="text-muted">No business selected</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
      </div>
    )
  }

  const items = categories.flatMap((c) =>
    (c.services || c.items || []).map((s) => ({ ...s, categoryId: c.id }))
  )

  return (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold mb-2">{isRestaurant ? 'Menu' : 'Services'}</h1>
          <p className="text-muted">{items.length} {isRestaurant ? 'items' : 'services'}</p>
        </div>
        <button onClick={handleAdd} className="btn-primary">
          Add {isRestaurant ? 'Menu Item' : 'Service'}
        </button>
      </div>

      {/* Category pills */}
      <div className="flex flex-wrap gap-2 mb-6">
        {categories.map((c) => (
          <span key={c.id} className="px-4 py-2 rounded-full bg-border text-primary font-medium">
            {c.name}
          </span>
        ))}
        <button onClick={createCategory} className="px-4 py-2 rounded-full border-2 border-dashed border-border text-muted hover:border-primary hover:text-primary">
          + Add category
        </button>
      </div>

      {categories.length === 0 ? (
        <Card>
          <p className="text-center text-muted py-8">
            No categories yet. Add a category, then add your first {isRestaurant ? 'menu item' : 'service'}.
          </p>
        </Card>
      ) : (
        <div className="space-y-6">
          {categories.map((cat) => (
            <div key={cat.id}>
              <h2 className="font-heading font-semibold text-lg mb-3">{cat.name}</h2>
              <div className="space-y-2">
                {(cat.services || cat.items || []).map((item) => (
                  <Card key={item.id} className={`flex items-center justify-between gap-4 ${item.is86d ? 'border-l-4 border-error opacity-75' : ''}`}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold">{item.name}</h3>
                        {item.is86d && (
                          <span className="text-xs px-2 py-0.5 rounded bg-error/20 text-error font-medium">SOLD OUT</span>
                        )}
                        {!isRestaurant && (
                          <span className={`text-xs px-2 py-0.5 rounded ${item.online ? 'bg-success/20 text-success' : 'bg-muted/30 text-muted'}`}>
                            {item.online ? 'Online' : 'Offline'}
                          </span>
                        )}
                      </div>
                      {item.description && <p className="text-sm text-muted mt-0.5 line-clamp-2">{item.description}</p>}
                      <div className="flex items-center gap-4 mt-2 text-sm">
                        <span className="font-medium text-primary">£{((item.price || 0) / 100).toFixed(2)}</span>
                        {!isRestaurant && <span>{item.duration} min</span>}
                        {isRestaurant && item.prepTime && <span>{item.prepTime} min prep</span>}
                        {isRestaurant && (item.dietary || []).map((d) => (
                          <span key={d} className="px-1.5 py-0.5 rounded bg-primary/10 text-primary text-xs">{DIETARY_LABELS[d] || d}</span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {isRestaurant && (
                        <button
                          onClick={() => handleToggle86(item)}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium ${item.is86d ? 'bg-error text-white' : 'bg-success/20 text-success'}`}
                        >
                          {item.is86d ? '86\'d' : 'Available'}
                        </button>
                      )}
                      {!isRestaurant && (
                        <button
                          onClick={() => handleToggleOnline(item)}
                          className={`px-3 py-1.5 rounded-lg text-sm ${item.online ? 'bg-success/20 text-success' : 'bg-muted/30 text-muted'}`}
                        >
                          {item.online ? 'Online' : 'Offline'}
                        </button>
                      )}
                      <button onClick={() => handleEdit(item, cat.id)} className="p-2 text-muted hover:text-primary">
                        <i className="fa-solid fa-pen" />
                      </button>
                      <button onClick={() => handleDelete(item)} className="p-2 text-muted hover:text-error">
                        <i className="fa-solid fa-trash" />
                      </button>
                    </div>
                  </Card>
                ))}
                {(cat.services || cat.items || []).length === 0 && (
                  <p className="text-muted text-sm py-4">No {isRestaurant ? 'items' : 'services'} in this category</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setModal(null)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-heading font-bold text-lg mb-4">{modal.mode === 'add' ? 'Add' : 'Edit'} {isRestaurant ? 'Menu Item' : 'Service'}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-primary mb-1">Name *</label>
                <input
                  type="text"
                  value={modal.item.name}
                  onChange={(e) => setModal({ ...modal, item: { ...modal.item, name: e.target.value } })}
                  className="input"
                  placeholder="e.g. Women's Haircut"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary mb-1">Category</label>
                <select
                  value={modal.item.categoryId || ''}
                  onChange={(e) => setModal({ ...modal, item: { ...modal.item, categoryId: e.target.value } })}
                  className="input"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-primary mb-1">Description</label>
                <textarea
                  value={modal.item.description || ''}
                  onChange={(e) => setModal({ ...modal, item: { ...modal.item, description: e.target.value } })}
                  className="input min-h-[80px]"
                  maxLength={200}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary mb-1">Price (£) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={modal.item.price ?? ''}
                  onChange={(e) => setModal({ ...modal, item: { ...modal.item, price: e.target.value } })}
                  className="input"
                  placeholder="0.00"
                />
              </div>
              {!isRestaurant && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-primary mb-1">Duration (min)</label>
                    <select
                      value={modal.item.duration}
                      onChange={(e) => setModal({ ...modal, item: { ...modal.item, duration: parseInt(e.target.value) } })}
                      className="input"
                    >
                      {DURATION_OPTS.map((d) => (
                        <option key={d} value={d}>{d} min</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={modal.item.online !== false}
                        onChange={(e) => setModal({ ...modal, item: { ...modal.item, online: e.target.checked } })}
                      />
                      <span>Show on booking page</span>
                    </label>
                  </div>
                  {staff.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-primary mb-1">Staff</label>
                      <div className="flex flex-wrap gap-2">
                        {staff.map((s) => (
                          <label key={s.id} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={(modal.item.staffIds || []).includes(s.id)}
                              onChange={(e) => {
                                const ids = modal.item.staffIds || []
                                const next = e.target.checked ? [...ids, s.id] : ids.filter((id) => id !== s.id)
                                setModal({ ...modal, item: { ...modal.item, staffIds: next } })
                              }}
                            />
                            <span>{s.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
              {isRestaurant && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-primary mb-1">Dietary</label>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(DIETARY_LABELS).map(([k, label]) => (
                        <label key={k} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={(modal.item.dietary || []).includes(k)}
                            onChange={(e) => {
                              const d = modal.item.dietary || []
                              const next = e.target.checked ? [...d, k] : d.filter((x) => x !== k)
                              setModal({ ...modal, item: { ...modal.item, dietary: next } })
                            }}
                          />
                          <span>{label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-primary mb-1">Prep time (min)</label>
                  <select
                    value={modal.item.prepTime}
                    onChange={(e) => setModal({ ...modal, item: { ...modal.item, prepTime: parseInt(e.target.value) } })}
                    className="input"
                  >
                    {PREP_OPTS.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
                </>
              )}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={handleSave} disabled={saving || !modal.item.name?.trim()} className="btn-primary flex-1">
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button onClick={() => setModal(null)} className="btn-secondary">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Services
