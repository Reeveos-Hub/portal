/**
 * EPOS Inventory — Stock levels, low-stock alerts, ingredient management
 */
import { useState, useEffect, useCallback } from 'react'
import { useBusiness } from '../../contexts/BusinessContext'
import api from '../../utils/api'
import { Package, AlertTriangle, TrendingDown, Search, Plus, ChevronDown } from 'lucide-react'

const API = import.meta.env.VITE_API_URL || ''

const CATEGORY_LABELS = {
  meat: '🥩 Meat', poultry: '🍗 Poultry', seafood: '🐟 Seafood', dairy: '🧀 Dairy',
  vegetables: '🥬 Vegetables', salad: '🥗 Salad', bread: '🍞 Bread',
  rice_grains: '🌾 Rice & Grains', spices: '🌶️ Spices', oils_sauces: '🫒 Oils & Sauces',
  drinks: '🥤 Drinks', alcohol: '🍷 Alcohol', dessert_ingredients: '🍰 Dessert',
  dry_goods: '📦 Dry Goods', packaging: '📋 Packaging', cleaning: '🧹 Cleaning',
}

const Inventory = () => {
  const { business } = useBusiness()
  const [items, setItems] = useState([])
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('all')

  const fetchData = useCallback(async () => {
    if (!business?.id) return
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const headers = token ? { Authorization: `Bearer ${token}` } : {}

      const [invRes, alertRes] = await Promise.all([
        fetch(`${API}/inventory/business/${business.id}/ingredients`, { headers }).then(r => r.json()).catch(() => ({ ingredients: [] })),
        fetch(`${API}/inventory/business/${business.id}/low-stock`, { headers }).then(r => r.json()).catch(() => ({ alerts: [] })),
      ])
      setItems(invRes.ingredients || invRes || [])
      setAlerts(alertRes.alerts || alertRes || [])
      setError(null)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [business?.id])

  useEffect(() => { fetchData() }, [fetchData])

  const categories = [...new Set(items.map(i => i.category))].sort()
  const filtered = items.filter(i => {
    if (catFilter !== 'all' && i.category !== catFilter) return false
    if (search && !i.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const totalValue = items.reduce((sum, i) => sum + (i.current_stock || 0) * (i.cost_per_unit || 0), 0)
  const lowCount = items.filter(i => (i.current_stock || 0) <= (i.min_stock || 0)).length

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-3 border-gray-200 border-t-[#111] rounded-full animate-spin" /></div>

  return (
    <div className="p-6 max-w-[1200px] mx-auto" style={{ fontFamily: "'Figtree', sans-serif" }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#111]">Inventory</h1>
          <p className="text-sm text-gray-500 mt-0.5">{items.length} ingredients tracked</p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Items</p>
          <p className="text-2xl font-bold text-[#111] mt-1">{items.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Stock Value</p>
          <p className="text-2xl font-bold text-[#111] mt-1">£{totalValue.toFixed(2)}</p>
        </div>
        <div className={`rounded-xl border p-4 ${lowCount > 0 ? 'bg-red-50 border-red-100' : 'bg-white border-gray-100'}`}>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Low Stock</p>
          <p className={`text-2xl font-bold mt-1 ${lowCount > 0 ? 'text-red-600' : 'text-[#111]'}`}>{lowCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Categories</p>
          <p className="text-2xl font-bold text-[#111] mt-1">{categories.length}</p>
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={16} className="text-amber-500" />
            <span className="text-sm font-bold text-amber-700">{alerts.length} Low Stock Alert{alerts.length > 1 ? 's' : ''}</span>
          </div>
          <div className="space-y-1">
            {alerts.slice(0, 5).map((a, i) => (
              <p key={i} className="text-xs text-amber-600">
                <span className="font-semibold">{a.name}</span> — {a.current_stock} {a.unit} remaining (min: {a.min_stock})
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text" placeholder="Search ingredients..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#111] focus:ring-1 focus:ring-[#111]/10"
          />
        </div>
        <select
          value={catFilter} onChange={e => setCatFilter(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-white"
        >
          <option value="all">All Categories</option>
          {categories.map(c => (
            <option key={c} value={c}>{CATEGORY_LABELS[c] || c}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      {error ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
          <Package size={32} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 text-sm">No ingredients found</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Ingredient</th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Category</th>
                  <th className="text-right px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Stock</th>
                  <th className="text-right px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Min</th>
                  <th className="text-right px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Cost/Unit</th>
                  <th className="text-right px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Value</th>
                  <th className="text-center px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item, idx) => {
                  const isLow = (item.current_stock || 0) <= (item.min_stock || 0)
                  const isCritical = (item.current_stock || 0) <= (item.min_stock || 0) * 0.5
                  const value = (item.current_stock || 0) * (item.cost_per_unit || 0)
                  return (
                    <tr key={item._id || idx} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-semibold text-[#111]">{item.name}</span>
                        {item.allergens?.length > 0 && (
                          <span className="ml-2 text-[10px] font-bold text-red-500 uppercase">{item.allergens.join(', ')}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-500">{CATEGORY_LABELS[item.category] || item.category}</td>
                      <td className={`px-4 py-3 text-right font-semibold ${isLow ? 'text-red-600' : 'text-[#111]'}`}>
                        {item.current_stock} {item.unit}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-400">{item.min_stock} {item.unit}</td>
                      <td className="px-4 py-3 text-right text-gray-600">£{(item.cost_per_unit || 0).toFixed(2)}</td>
                      <td className="px-4 py-3 text-right font-medium text-[#111]">£{value.toFixed(2)}</td>
                      <td className="px-4 py-3 text-center">
                        {isCritical ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-bold uppercase">Critical</span>
                        ) : isLow ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold uppercase">Low</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase">OK</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default Inventory
