/**
 * Reports — Browse and generate business reports
 * 16 report types across 7 categories. Click to configure, generate,
 * and auto-save to Documents.
 */
import { useState, useEffect } from 'react'
import {
  Calendar, BarChart3, TrendingUp, Users, Download, Search,
  ChevronRight, Sparkles, Clock, ClipboardList, AlertTriangle,
  Star, Receipt, PoundSterling, FileText, X, Loader2
} from 'lucide-react'
import { useBusiness } from '../../contexts/BusinessContext'
import api from '../../utils/api'
import AppLoader from '../../components/shared/AppLoader'
import { theme as T } from '../../config/theme'

const ICON_MAP = {
  Calendar, BarChart3, TrendingUp, Users, Download, Clock,
  ClipboardList, AlertTriangle, Star, Receipt, PoundSterling, FileText,
}

const REPORT_ICONS = {
  bookings_full: Calendar, bookings_export: Download, daily_summary: BarChart3,
  bookings_no_shows: AlertTriangle, bookings_cancellations: X, bookings_by_source: TrendingUp,
  revenue_summary: PoundSterling, revenue_by_service: TrendingUp,
  revenue_by_staff: Users, tax_summary: Receipt,
  clients_full: Users, clients_export: Download, clients_inactive: AlertTriangle,
  clients_top_spenders: Star, staff_list: Users, staff_performance: Users,
  services_list: ClipboardList, services_popularity: TrendingUp,
  consultation_submissions: ClipboardList, consultation_flagged: AlertTriangle,
  activity_log: Clock,
  reviews_full: Star, orders_full: FileText, orders_export: Download,
  campaigns_full: FileText, packages_list: FileText, packages_sold: FileText,
  consumables_list: FileText, consumables_usage: Clock,
  shop_products: FileText, shop_orders: FileText,
  loyalty_members: Star, rota_shifts: Clock,
  crm_leads: Users, blog_posts: FileText, notifications_log: FileText,
  delivery_orders: FileText, abandoned_carts: AlertTriangle,
  waitlist: Clock, video_meetings: FileText,
}

const CAT_ORDER = ['all', 'reports', 'financial', 'exports', 'forms']

const FORMAT_STYLES = {
  pdf:  { bg: '#FEF2F2', color: '#DC2626' },
  docx: { bg: '#EFF6FF', color: '#2563EB' },
  csv:  { bg: '#F0FDF4', color: '#059669' },
}

const Reports = () => {
  const { business, loading: bizLoading } = useBusiness()
  const [loading, setLoading] = useState(true)
  const [reports, setReports] = useState([])
  const [activeTab, setActiveTab] = useState('all')
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(null) // report being configured
  const [generating, setGenerating] = useState(false)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [selectedFormat, setSelectedFormat] = useState('pdf')
  const [toast, setToast] = useState(null)

  const bid = business?.id ?? business?._id

  useEffect(() => {
    if (!bid) { setLoading(false); return }
    const load = async () => {
      try {
        const data = await api.get(`/reports/business/${bid}`)
        setReports(data.reports || [])
      } catch (e) {
        console.error('Failed to load reports:', e)
      }
      setLoading(false)
    }
    load()
  }, [bid])

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 4000)
  }

  const openModal = (report) => {
    // Set sensible defaults
    const today = new Date().toISOString().split('T')[0]
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0]
    setDateFrom(thirtyDaysAgo)
    setDateTo(today)
    setSelectedFormat(report.formats.includes('pdf') ? 'pdf' : report.formats[0])
    setModal(report)
  }

  const handleGenerate = async () => {
    if (!modal) return
    setGenerating(true)
    try {
      const body = {
        report_id: modal.id,
        format: selectedFormat,
      }
      if (modal.requires_date_range) {
        body.date_from = dateFrom
        body.date_to = dateTo
      }

      const result = await api.post(`/reports/business/${bid}/generate`, body)

      if (result.success) {
        showToast(`${modal.name} generated — ${result.rows} records. Saved to Documents.`)
        setModal(null)
      } else {
        showToast(result.message || 'No data found for this period', 'error')
      }
    } catch (e) {
      showToast(e.message || 'Failed to generate report', 'error')
    }
    setGenerating(false)
  }

  // Filter reports
  const filtered = reports.filter(r => {
    if (activeTab !== 'all' && r.category !== activeTab) return false
    if (search.trim()) {
      const q = search.toLowerCase()
      return r.name.toLowerCase().includes(q) || r.description.toLowerCase().includes(q)
    }
    return true
  })

  // Get unique categories for tabs
  const cats = CAT_ORDER.filter(c =>
    c === 'all' || reports.some(r => r.category === c)
  )

  if (bizLoading || loading) return <AppLoader message="Loading reports..." />

  return (
    <div className="space-y-5" style={{ fontFamily: "'Figtree', sans-serif" }}>
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl text-sm font-semibold shadow-lg ${
          toast.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
        }`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-extrabold" style={{ color: T.text.primary }}>Reports</h1>
          <p className="text-xs mt-0.5" style={{ color: T.text.muted }}>
            {reports.length} reports available across your business
          </p>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" size={14} style={{ color: T.text.light }} />
          <input
            placeholder="Search reports..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 pr-3 py-2 text-xs rounded-lg border outline-none focus:ring-1"
            style={{
              width: 200, fontFamily: "'Figtree', sans-serif",
              borderColor: T.border.light, background: T.bg.subtle,
            }}
          />
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex gap-1.5 flex-wrap">
        {cats.map(c => (
          <button key={c} onClick={() => setActiveTab(c)}
            className="px-3.5 py-1.5 rounded-full text-xs font-semibold capitalize transition-all"
            style={{
              background: activeTab === c ? T.brand.primary : T.bg.subtle,
              color: activeTab === c ? '#fff' : T.text.muted,
              border: `1px solid ${activeTab === c ? T.brand.primary : T.border.light}`,
            }}>
            {c === 'all' ? `All (${reports.length})` : c}
          </button>
        ))}
      </div>

      {/* AI suggestion banner */}
      <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl"
        style={{ background: `${T.brand.gold}08`, border: `1px solid ${T.brand.gold}20` }}>
        <Sparkles size={16} style={{ color: T.brand.gold, flexShrink: 0 }} />
        <span className="text-xs" style={{ color: T.text.muted }}>
          <strong style={{ color: T.text.primary }}>Tip:</strong> Ask the ReeveOS Assistant to generate any report — just say{' '}
          <em>"Generate a revenue report for this month as PDF"</em>
        </span>
      </div>

      {/* Report cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filtered.map(r => {
          const Icon = REPORT_ICONS[r.id] || FileText
          return (
            <button key={r.id} onClick={() => openModal(r)}
              className="bg-white rounded-2xl p-4 border text-left flex gap-3.5 items-start group transition-all hover:shadow-md"
              style={{ borderColor: T.border.light }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: T.bg.subtle }}>
                <Icon size={18} style={{ color: T.text.muted }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold mb-0.5" style={{ color: T.text.primary }}>{r.name}</div>
                <div className="text-xs mb-2" style={{ color: T.text.muted }}>{r.description}</div>
                <div className="flex gap-1.5">
                  {r.formats.map(f => {
                    const s = FORMAT_STYLES[f] || FORMAT_STYLES.csv
                    return (
                      <span key={f} className="font-bold uppercase tracking-wider px-2 py-0.5 rounded"
                        style={{ fontSize: 9, background: s.bg, color: s.color }}>
                        {f}
                      </span>
                    )
                  })}
                </div>
              </div>
              <ChevronRight size={16} className="self-center flex-shrink-0 opacity-30 group-hover:opacity-100 transition-opacity"
                style={{ color: T.text.light }} />
            </button>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12">
          <FileText size={36} className="mx-auto mb-3" style={{ color: T.text.light }} />
          <p className="text-sm font-semibold" style={{ color: T.text.muted }}>No reports match your search</p>
        </div>
      )}

      {/* ═══ GENERATE MODAL ═══ */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: T.bg.overlay }}
          onClick={(e) => e.target === e.currentTarget && !generating && setModal(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
            {/* Modal header */}
            <div className="px-5 py-4 flex justify-between items-start" style={{ borderBottom: `1px solid ${T.border.light}` }}>
              <div>
                <h2 className="text-base font-extrabold" style={{ color: T.text.primary }}>{modal.name}</h2>
                <p className="text-xs mt-0.5" style={{ color: T.text.muted }}>{modal.description}</p>
              </div>
              <button onClick={() => !generating && setModal(null)} className="p-1 rounded-lg hover:bg-gray-100 transition-colors">
                <X size={16} style={{ color: T.text.light }} />
              </button>
            </div>

            <div className="px-5 py-4 space-y-4">
              {/* Date range */}
              {modal.requires_date_range && (
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider block mb-2" style={{ color: T.text.light, fontSize: 10 }}>
                    Date Range
                  </label>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="text-xs mb-1 block" style={{ color: T.text.muted }}>From</label>
                      <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-lg border outline-none focus:ring-1"
                        style={{ fontFamily: "'Figtree', sans-serif", borderColor: T.border.light }} />
                    </div>
                    <div className="flex-1">
                      <label className="text-xs mb-1 block" style={{ color: T.text.muted }}>To</label>
                      <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-lg border outline-none focus:ring-1"
                        style={{ fontFamily: "'Figtree', sans-serif", borderColor: T.border.light }} />
                    </div>
                  </div>
                </div>
              )}

              {/* Format selection */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider block mb-2" style={{ color: T.text.light, fontSize: 10 }}>
                  Output Format
                </label>
                <div className="flex gap-2">
                  {modal.formats.map(f => {
                    const s = FORMAT_STYLES[f] || FORMAT_STYLES.csv
                    const active = selectedFormat === f
                    return (
                      <button key={f} onClick={() => setSelectedFormat(f)}
                        className="flex-1 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all"
                        style={{
                          background: active ? s.bg : T.bg.subtle,
                          color: active ? s.color : T.text.muted,
                          border: `2px solid ${active ? s.color : T.border.light}`,
                        }}>
                        {f}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Modal footer */}
            <div className="px-5 py-4 flex gap-2 justify-end" style={{ borderTop: `1px solid ${T.border.light}`, background: T.bg.subtle }}>
              <button onClick={() => !generating && setModal(null)}
                className="px-4 py-2 text-xs font-semibold rounded-lg border transition-colors hover:bg-gray-100"
                style={{ borderColor: T.border.light, color: T.text.muted }}
                disabled={generating}>
                Cancel
              </button>
              <button onClick={handleGenerate} disabled={generating}
                className="px-5 py-2 text-xs font-bold rounded-lg text-white transition-all hover:opacity-90 disabled:opacity-60 flex items-center gap-2"
                style={{ background: T.brand.primary }}>
                {generating ? (
                  <>
                    <Loader2 size={14} className="animate-spin" /> Generating...
                  </>
                ) : (
                  <>
                    <Download size={14} /> Generate Report
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Reports
