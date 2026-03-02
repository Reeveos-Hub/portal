/**
 * EPOS Cash & Finance — cash drawer, HMRC VAT, auto P&L, digital receipts
 */
import { useState, useEffect, useCallback } from 'react'
import { useBusiness } from '../../contexts/BusinessContext'
import { Wallet, FileText, Receipt, TrendingUp, PoundSterling } from 'lucide-react'

const API = import.meta.env.VITE_API_URL || ''

const Cash = () => {
  const { business } = useBusiness()
  const [drawer, setDrawer] = useState(null)
  const [pnl, setPnl] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    if (!business?.id) return
    try {
      const token = localStorage.getItem('token')
      const headers = token ? { Authorization: `Bearer ${token}` } : {}

      const [drawerRes, pnlRes] = await Promise.all([
        fetch(`${API}/cash/business/${business.id}/drawer/status`, { headers }).then(r => r.ok ? r.json() : null).catch(() => null),
        fetch(`${API}/cash/business/${business.id}/pnl?period=today`, { headers }).then(r => r.ok ? r.json() : null).catch(() => null),
      ])
      setDrawer(drawerRes)
      setPnl(pnlRes)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [business?.id])

  useEffect(() => { fetchData() }, [fetchData])

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-3 border-gray-200 border-t-[#111] rounded-full animate-spin" /></div>

  return (
    <div className="p-6 max-w-[1200px] mx-auto" style={{ fontFamily: "'Figtree', sans-serif" }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#111]">Cash & Finance</h1>
          <p className="text-sm text-gray-500 mt-0.5">Cash drawer, HMRC VAT reporting, auto P&L</p>
        </div>
      </div>

      {/* P&L Summary */}
      {pnl && (
        <>
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3">Today's P&L</h2>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Revenue</p>
              <p className="text-xl font-bold text-[#111] mt-1">£{(pnl.revenue || 0).toFixed(2)}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">COGS</p>
              <p className="text-xl font-bold text-red-600 mt-1">-£{(pnl.cogs || 0).toFixed(2)}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Labour</p>
              <p className="text-xl font-bold text-red-600 mt-1">-£{(pnl.labour || 0).toFixed(2)}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Waste</p>
              <p className="text-xl font-bold text-red-600 mt-1">-£{(pnl.waste || 0).toFixed(2)}</p>
            </div>
            <div className={`rounded-xl border p-4 ${(pnl.net_profit || 0) >= 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Net Profit</p>
              <p className={`text-xl font-bold mt-1 ${(pnl.net_profit || 0) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                £{(pnl.net_profit || 0).toFixed(2)}
              </p>
              <p className="text-[10px] text-gray-400 mt-0.5">{(pnl.net_margin || 0).toFixed(1)}% margin</p>
            </div>
          </div>
        </>
      )}

      {/* Cash Drawer */}
      <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3">Cash Drawer</h2>
      <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
        {drawer ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</p>
              <p className={`text-sm font-bold mt-1 ${drawer.is_open ? 'text-emerald-600' : 'text-gray-400'}`}>
                {drawer.is_open ? '● Open' : '● Closed'}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Opening Float</p>
              <p className="text-lg font-bold text-[#111] mt-1">£{(drawer.opening_float || 0).toFixed(2)}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Current Balance</p>
              <p className="text-lg font-bold text-[#111] mt-1">£{(drawer.current_balance || 0).toFixed(2)}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Expected</p>
              <p className="text-lg font-bold text-[#111] mt-1">£{(drawer.expected_balance || 0).toFixed(2)}</p>
              {drawer.variance != null && drawer.variance !== 0 && (
                <p className={`text-[10px] font-bold mt-0.5 ${drawer.variance > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {drawer.variance > 0 ? '+' : ''}£{drawer.variance.toFixed(2)} variance
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <Wallet size={32} className="mx-auto text-gray-300 mb-3" />
            <p className="text-sm text-gray-400">No drawer session active</p>
            <p className="text-xs text-gray-400 mt-1">Open a drawer from the EPOS till to start tracking</p>
          </div>
        )}
      </div>

      {/* HMRC VAT */}
      <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3">HMRC VAT Reporting</h2>
      <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
            <FileText size={20} className="text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-[#111]">Auto-generated from EPOS data</p>
            <p className="text-xs text-gray-500 mt-1">
              VAT Boxes 1–7 are calculated automatically from your POS transactions. 
              20% standard rate applied to all eligible sales. Export ready for Making Tax Digital.
            </p>
            <div className="flex gap-2 mt-3">
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">Box 1: Output VAT</span>
              <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">Box 4: Input VAT</span>
              <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded">Box 6: Total Sales</span>
            </div>
          </div>
        </div>
      </div>

      {/* Digital Receipts */}
      <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3">Digital Receipts</h2>
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
            <Receipt size={20} className="text-amber-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-[#111]">Email & SMS receipts</p>
            <p className="text-xs text-gray-500 mt-1">
              Customers receive digital receipts automatically after payment. 
              Branded with your restaurant logo and details. Reduces paper waste and builds your CRM.
            </p>
            <p className="text-xs text-gray-400 mt-2">
              Footer: <span className="italic">{business?.epos_settings?.receipt_footer || 'Thank you for dining with us!'}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Cash
