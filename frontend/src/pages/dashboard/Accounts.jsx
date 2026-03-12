/**
 * Accounts — Revenue, transactions, tax & accountant tools
 * All data pulled live from bookings. QuickBooks is a genuine Coming Soon.
 */
import { useState, useEffect, useMemo } from 'react'
import {
  PoundSterling, TrendingUp, TrendingDown, Receipt, CreditCard,
  Download, Clock, Building2, Loader2
} from 'lucide-react'
import { useBusiness } from '../../contexts/BusinessContext'
import api, { API_BASE_URL } from '../../utils/api'
import AppLoader from '../../components/shared/AppLoader'
import { theme as T } from '../../config/theme'

const PERIODS = ['week', 'month', 'quarter', 'year']

const Accounts = () => {
  const { business, loading: bizLoading } = useBusiness()
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('month')
  const [data, setData] = useState(null)
  const [accountantEmail, setAccountantEmail] = useState('')
  const [savingEmail, setSavingEmail] = useState(false)
  const [exporting, setExporting] = useState(null)
  const [toast, setToast] = useState(null)

  const bid = business?.id ?? business?._id

  useEffect(() => {
    if (!bid) { setLoading(false); return }
    const load = async () => {
      setLoading(true)
      try {
        const result = await api.get(`/accounts/business/${bid}?period=${period}`)
        setData(result)
        setAccountantEmail(result.accountant_email || '')
      } catch (e) {
        console.error('Failed to load accounts:', e)
      }
      setLoading(false)
    }
    load()
  }, [bid, period])

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const handleSaveEmail = async () => {
    if (!accountantEmail.includes('@')) { showToast('Enter a valid email', 'error'); return }
    setSavingEmail(true)
    try {
      await api.put(`/accounts/business/${bid}/accountant`, { email: accountantEmail })
      showToast('Accountant email saved')
    } catch (e) {
      showToast('Failed to save', 'error')
    }
    setSavingEmail(false)
  }

  const handleExportCSV = async () => {
    setExporting('csv')
    try {
      const result = await api.post(`/accounts/business/${bid}/export-transactions`, { period })
      if (result.success) {
        showToast(`Exported ${result.rows} transactions to Documents`)
      }
    } catch (e) {
      showToast('Export failed', 'error')
    }
    setExporting(null)
  }

  const handleExportTax = async () => {
    setExporting('tax')
    try {
      const result = await api.post(`/accounts/business/${bid}/export-tax`)
      if (result.success) {
        showToast('Tax summary saved to Documents')
      }
    } catch (e) {
      showToast(e.message || 'Export failed', 'error')
    }
    setExporting(null)
  }

  const fmt = (n) => `£${Number(n || 0).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  const pctLabel = (pct) => {
    if (!pct && pct !== 0) return ''
    const prefix = pct > 0 ? '+' : ''
    return `${prefix}${pct}%`
  }

  if (bizLoading || loading) return <AppLoader message="Loading accounts..." />
  if (!data) return <div className="text-center py-12 text-sm text-gray-400">No data available</div>

  const { kpis, trend, services, transactions, tax_quarters } = data

  // Chart height calculation
  const maxRevenue = Math.max(...(trend || []).map(d => d.revenue), 1)

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
          <h1 className="text-xl font-extrabold" style={{ color: T.text.primary }}>Accounts</h1>
          <p className="text-xs mt-0.5" style={{ color: T.text.muted }}>Revenue, transactions & tax overview</p>
        </div>
        <div className="flex gap-1.5">
          {PERIODS.map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all"
              style={{
                background: period === p ? T.brand.primary : T.bg.subtle,
                color: period === p ? '#fff' : T.text.muted,
                border: `1px solid ${period === p ? T.brand.primary : T.border.light}`,
              }}>
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Gross Revenue', value: fmt(kpis.gross_revenue), change: pctLabel(kpis.gross_change), up: kpis.gross_change > 0, Icon: PoundSterling },
          { label: 'Net Revenue', value: fmt(kpis.net_revenue), change: pctLabel(kpis.net_change), up: kpis.net_change > 0, Icon: TrendingUp },
          { label: 'VAT Collected', value: fmt(kpis.vat_collected), change: '', Icon: Receipt },
          { label: 'Transactions', value: String(kpis.transaction_count || 0), change: pctLabel(kpis.transaction_change), up: kpis.transaction_change > 0, Icon: CreditCard },
        ].map((c, i) => (
          <div key={i} className="bg-white rounded-2xl p-4 border" style={{ borderColor: T.border.light }}>
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-medium" style={{ color: T.text.muted }}>{c.label}</span>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: T.bg.subtle }}>
                <c.Icon size={16} style={{ color: T.text.muted }} />
              </div>
            </div>
            <div className="text-2xl font-extrabold" style={{ color: T.text.primary }}>{c.value}</div>
            {c.change && (
              <div className="text-xs font-semibold mt-1 flex items-center gap-1"
                style={{ color: c.up ? T.status.success : T.status.error }}>
                {c.up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {c.change} vs last {period}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Revenue Trend + Service Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 border" style={{ borderColor: T.border.light }}>
          <div className="mb-4">
            <div className="text-sm font-bold" style={{ color: T.text.primary }}>Revenue Trend</div>
            <div className="text-xs" style={{ color: T.text.muted }}>Daily revenue over the period</div>
          </div>
          <div className="flex items-end gap-0.5" style={{ height: 120 }}>
            {(trend || []).map((d, i) => {
              const pct = maxRevenue > 0 ? (d.revenue / maxRevenue) * 100 : 0
              return (
                <div key={i} className="flex-1 group relative" style={{ height: '100%', display: 'flex', alignItems: 'flex-end' }}>
                  <div className="w-full rounded-sm transition-all group-hover:opacity-80"
                    style={{
                      height: `${Math.max(pct, 3)}%`,
                      background: pct > 70 ? T.brand.primary : T.border.light,
                      minHeight: 3,
                    }} />
                  {/* Tooltip */}
                  <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover:block z-10">
                    <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded-md whitespace-nowrap">
                      {d.label}: {fmt(d.revenue)}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Service breakdown */}
        <div className="bg-white rounded-2xl p-5 border" style={{ borderColor: T.border.light }}>
          <div className="text-sm font-bold mb-1" style={{ color: T.text.primary }}>Revenue by Service</div>
          <div className="text-xs mb-4" style={{ color: T.text.muted }}>Top earners this {period}</div>
          {(services || []).length === 0 ? (
            <p className="text-xs py-4 text-center" style={{ color: T.text.light }}>No revenue data</p>
          ) : (
            (services || []).map((s, i) => (
              <div key={i} className="mb-2.5">
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-semibold truncate mr-2" style={{ color: T.text.primary }}>{s.name}</span>
                  <span style={{ color: T.text.muted }}>{fmt(s.revenue)}</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: T.bg.muted }}>
                  <div className="h-full rounded-full transition-all" style={{ width: `${s.percentage}%`, background: T.brand.primary }} />
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-2xl p-5 border" style={{ borderColor: T.border.light }}>
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="text-sm font-bold" style={{ color: T.text.primary }}>Recent Transactions</div>
            <div className="text-xs" style={{ color: T.text.muted }}>{kpis.transaction_count} transactions this {period}</div>
          </div>
          <button onClick={handleExportCSV} disabled={exporting === 'csv'}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors hover:bg-gray-50 disabled:opacity-50"
            style={{ borderColor: T.border.light, color: T.text.muted }}>
            {exporting === 'csv' ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
            Export CSV
          </button>
        </div>

        {(transactions || []).length === 0 ? (
          <p className="text-xs py-6 text-center" style={{ color: T.text.light }}>No transactions for this period</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs" style={{ borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${T.border.light}` }}>
                  {['Date', 'Client', 'Service', 'Amount', 'Method', 'Status'].map(h => (
                    <th key={h} className="text-left px-3 py-2 font-semibold uppercase tracking-wider"
                      style={{ fontSize: 10, color: T.text.light }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(transactions || []).slice(0, 20).map((t, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${T.bg.muted}` }}>
                    <td className="px-3 py-2.5" style={{ color: T.text.muted }}>{t.date}</td>
                    <td className="px-3 py-2.5 font-semibold" style={{ color: T.text.primary }}>{t.client}</td>
                    <td className="px-3 py-2.5" style={{ color: T.text.muted }}>{t.service}</td>
                    <td className="px-3 py-2.5 font-bold" style={{ color: T.text.primary }}>{fmt(t.amount)}</td>
                    <td className="px-3 py-2.5" style={{ color: T.text.muted }}>{t.method}</td>
                    <td className="px-3 py-2.5">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{
                        fontSize: 10,
                        background: t.status === 'Completed' || t.status === 'Confirmed' ? '#F0FDF4' : t.status === 'Checked In' ? '#EFF6FF' : '#FFFBEB',
                        color: t.status === 'Completed' || t.status === 'Confirmed' ? '#059669' : t.status === 'Checked In' ? '#2563EB' : '#D97706',
                      }}>
                        {t.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Tax Summary + QuickBooks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Tax Summary */}
        <div className="bg-white rounded-2xl p-5 border" style={{ borderColor: T.border.light }}>
          <div className="text-sm font-bold mb-1" style={{ color: T.text.primary }}>Tax Summary</div>
          <div className="text-xs mb-4" style={{ color: T.text.muted }}>Quarterly VAT breakdown</div>
          {(tax_quarters || []).length === 0 ? (
            <p className="text-xs py-4 text-center" style={{ color: T.text.light }}>No tax data available</p>
          ) : (
            <>
              {/* Column headers */}
              <div className="flex text-xs font-semibold uppercase tracking-wider mb-2" style={{ fontSize: 10, color: T.text.light }}>
                <span className="flex-1">Quarter</span>
                <span className="w-20 text-right">Gross</span>
                <span className="w-20 text-right">VAT</span>
                <span className="w-20 text-right">Net</span>
              </div>
              {(tax_quarters || []).map((q, i) => (
                <div key={i} className="flex items-center py-2.5 text-xs"
                  style={{ borderBottom: i < tax_quarters.length - 1 ? `1px solid ${T.bg.muted}` : 'none' }}>
                  <span className="flex-1 font-semibold" style={{ color: T.text.primary }}>{q.label}</span>
                  <span className="w-20 text-right" style={{ color: T.text.muted }}>{fmt(q.gross)}</span>
                  <span className="w-20 text-right" style={{ color: T.status.error }}>{fmt(q.vat)}</span>
                  <span className="w-20 text-right font-bold" style={{ color: T.text.primary }}>{fmt(q.net)}</span>
                </div>
              ))}
              <button onClick={handleExportTax} disabled={exporting === 'tax'}
                className="mt-3 flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold border transition-colors hover:bg-gray-50 disabled:opacity-50"
                style={{ borderColor: T.border.light, color: T.text.muted }}>
                {exporting === 'tax' ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
                Export Tax Summary (PDF)
              </button>
            </>
          )}
        </div>

        {/* QuickBooks Card */}
        <div className="bg-white rounded-2xl p-5 border flex flex-col" style={{ borderColor: T.border.light }}>
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#2CA01C' }}>
              <Building2 size={20} color="#fff" />
            </div>
            <div>
              <div className="text-sm font-bold" style={{ color: T.text.primary }}>QuickBooks</div>
              <div className="text-xs" style={{ color: T.text.muted }}>Accounting integration</div>
            </div>
          </div>

          <p className="text-xs leading-relaxed mb-4 flex-1" style={{ color: T.text.muted }}>
            Connect QuickBooks to automatically sync transactions, generate invoices, and reconcile payments. Two-way sync keeps your books up to date.
          </p>

          <div className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-semibold mb-3"
            style={{ background: `${T.brand.gold}10`, border: `1px solid ${T.brand.gold}30`, color: T.brand.gold }}>
            <Clock size={14} /> Coming Soon — Q2 2026
          </div>

          <div className="text-xs mb-3" style={{ color: T.text.muted }}>
            <div className="font-semibold mb-1">What it will do:</div>
            <div className="space-y-0.5 ml-2">
              <div>Sync transactions to QuickBooks automatically</div>
              <div>Generate invoices from completed bookings</div>
              <div>Match Stripe/Dojo payments to QB entries</div>
              <div>One-click send reports to your accountant</div>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider block mb-1.5" style={{ fontSize: 10, color: T.text.light }}>
              Accountant Email
            </label>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="accountant@email.com"
                value={accountantEmail}
                onChange={(e) => setAccountantEmail(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg text-xs border outline-none focus:ring-1"
                style={{ fontFamily: "'Figtree', sans-serif", borderColor: T.border.light }}
              />
              <button onClick={handleSaveEmail} disabled={savingEmail}
                className="px-3.5 py-2 rounded-lg text-xs font-semibold text-white transition-all hover:opacity-90 disabled:opacity-60"
                style={{ background: T.brand.primary }}>
                {savingEmail ? '...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Accounts
