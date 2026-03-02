import { useState, useEffect, useCallback } from 'react'
import { useBusiness } from '../../contexts/BusinessContext'
import api from '../../utils/api'
import { Package, Truck, ShoppingBag, MapPin, CircleDot, Flame, CheckCircle2, XCircle, RefreshCw, Inbox } from 'lucide-react'

const STATUS_MAP = {
  pending_payment: { label: 'Pending', Icon: CircleDot, pillBg: 'bg-gray-100 text-gray-500' },
  confirmed: { label: 'New', Icon: CircleDot, pillBg: 'bg-blue-50 text-blue-700' },
  preparing: { label: 'Preparing', Icon: Flame, pillBg: 'bg-amber-50 text-amber-700' },
  ready: { label: 'Ready', Icon: CheckCircle2, pillBg: 'bg-emerald-50 text-emerald-700' },
  collected: { label: 'Collected', Icon: Package, pillBg: 'bg-gray-100 text-gray-500' },
  delivered: { label: 'Delivered', Icon: Package, pillBg: 'bg-gray-100 text-gray-500' },
  cancelled: { label: 'Cancelled', Icon: XCircle, pillBg: 'bg-red-50 text-red-600' },
  open: { label: 'Open', Icon: CircleDot, pillBg: 'bg-blue-50 text-blue-700' },
  fired: { label: 'Preparing', Icon: Flame, pillBg: 'bg-amber-50 text-amber-700' },
  paid: { label: 'Paid', Icon: CheckCircle2, pillBg: 'bg-emerald-50 text-emerald-700' },
  closed: { label: 'Closed', Icon: Package, pillBg: 'bg-gray-100 text-gray-500' },
}

const TABS = [
  { key: 'all', label: 'All Orders' },
  { key: 'active', label: 'Active' },
  { key: 'confirmed', label: 'New' },
  { key: 'preparing', label: 'Preparing' },
  { key: 'ready', label: 'Ready' },
  { key: 'completed', label: 'Completed' },
]

const Orders = () => {
  const { business } = useBusiness()
  const bid = business?.id ?? business?._id
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [updating, setUpdating] = useState(null)

  const loadOrders = useCallback(async () => {
    if (!bid) return
    try {
      setLoading(true)
      const res = await api.get(`/orders/business/${bid}?hours_back=72&limit=100`)
      setOrders(res.orders || [])
    } catch (e) { console.error('Failed to load orders:', e) }
    finally { setLoading(false) }
  }, [bid])

  useEffect(() => { loadOrders() }, [loadOrders])
  useEffect(() => { if (!bid) return; const i = setInterval(loadOrders, 30000); return () => clearInterval(i) }, [bid, loadOrders])

  const updateStatus = async (orderId, newStatus) => {
    setUpdating(orderId)
    try {
      await api.patch(`/orders/${orderId}/status`, { status: newStatus })
      setOrders(prev => prev.map(o => (o._id === orderId) ? { ...o, status: newStatus } : o))
    } catch (e) { console.error('Status update failed:', e) }
    finally { setUpdating(null) }
  }

  const filtered = orders.filter(o => {
    if (filter === 'all') return true
    if (filter === 'active') return ['confirmed','preparing','ready','open','fired'].includes(o.status)
    if (filter === 'completed') return ['collected','delivered','paid','closed'].includes(o.status)
    return o.status === filter
  })

  const fmtTime = (iso) => { if (!iso) return ''; try { return new Date(iso).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'}) } catch { return '' } }
  const getItems = (o) => (o.items||[]).map(i => { const q = i.quantity||1; return q > 1 ? i.name+' x'+q : i.name })
  const getTotal = (o) => { const t = o.grand_total_with_delivery||o.total||o.subtotal||0; return typeof t === 'number' ? t.toFixed(2) : '0.00' }

  if (loading && !orders.length) return (<div className="flex items-center justify-center h-64" style={{fontFamily:"'Figtree',sans-serif"}}><div className="animate-spin w-8 h-8 border-2 border-gray-200 border-t-[#111111] rounded-full" /></div>)

  return (
    <div className="space-y-6" style={{fontFamily:"'Figtree',sans-serif"}}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 flex-wrap">
          {TABS.map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)} className={`px-4 py-1.5 text-xs font-bold rounded-full whitespace-nowrap transition-all ${filter === f.key ? 'bg-[#111111] text-white shadow-lg shadow-[#111111]/20' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}>{f.label}</button>
          ))}
        </div>
        <button onClick={loadOrders} className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"><RefreshCw size={16} className={loading ? 'animate-spin' : ''} /></button>
      </div>
      {filtered.length === 0 && (<div className="flex flex-col items-center justify-center py-20 text-center"><Inbox size={48} className="text-gray-200 mb-4" /><p className="text-sm font-bold text-gray-400">No orders yet</p></div>)}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map(o => {
          const s = STATUS_MAP[o.status] || STATUS_MAP.confirmed
          const StatusIcon = s.Icon
          const type = o.order_type || 'dine_in'
          const isDel = type === 'delivery'
          const isCol = type === 'takeaway' || type === 'collection'
          return (
            <div key={o._id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-[0_2px_10px_rgba(0,0,0,0.03)] hover:shadow-[0_10px_30px_-5px_rgba(17,17,17,0.08)] transition-all">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-gray-900">ORD-{String(o.order_number||'').padStart(3,'0')}</span>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${s.pillBg}`}><StatusIcon className="w-3 h-3" /> {s.label}</span>
                    {o.source === 'online' && <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-indigo-50 text-indigo-600">Online</span>}
                  </div>
                  <p className="text-xs text-gray-400 font-medium mt-1">{o.customer_name||'Walk-in'} · {fmtTime(o.created_at)}</p>
                </div>
                {(isDel||isCol) && <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${isDel ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'}`}>{isDel ? <Truck className="w-3 h-3" /> : <ShoppingBag className="w-3 h-3" />}{isDel ? 'Delivery' : 'Collection'}</span>}
              </div>
              <div className="border-t border-gray-100 pt-3 mb-3">
                {getItems(o).slice(0,5).map((item,i) => <p key={i} className="text-sm font-medium text-gray-700">{item}</p>)}
                {getItems(o).length > 5 && <p className="text-xs text-gray-400 mt-1">+{getItems(o).length-5} more</p>}
                {o.delivery_address && <p className="text-[11px] text-gray-400 mt-2 flex items-center gap-1"><MapPin className="w-3 h-3" />{typeof o.delivery_address === 'string' ? o.delivery_address : (o.delivery_address.line1||o.delivery_address.address||'')}</p>}
                {o.notes && <p className="text-[11px] text-amber-600 mt-1 italic">Note: {o.notes}</p>}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-lg font-extrabold text-gray-900">£{getTotal(o)}</span>
                <div className="flex gap-2">
                  {o.status === 'confirmed' && <button onClick={() => updateStatus(o._id,'preparing')} disabled={updating===o._id} className="px-4 py-1.5 text-xs font-bold text-white bg-[#111111] rounded-full hover:bg-[#1a1a1a] shadow-lg shadow-[#111111]/20 disabled:opacity-50">{updating===o._id ? '...' : 'Accept'}</button>}
                  {o.status === 'preparing' && <button onClick={() => updateStatus(o._id,'ready')} disabled={updating===o._id} className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-500 rounded-full hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 disabled:opacity-50">{updating===o._id ? '...' : 'Mark Ready'}</button>}
                  {o.status === 'ready' && isCol && <button onClick={() => updateStatus(o._id,'collected')} disabled={updating===o._id} className="px-4 py-1.5 text-xs font-bold text-gray-700 bg-white border border-gray-200 rounded-full hover:bg-gray-50 shadow-sm disabled:opacity-50">{updating===o._id ? '...' : 'Collected'}</button>}
                  {o.status === 'ready' && isDel && <button onClick={() => updateStatus(o._id,'delivered')} disabled={updating===o._id} className="px-4 py-1.5 text-xs font-bold text-gray-700 bg-white border border-gray-200 rounded-full hover:bg-gray-50 shadow-sm disabled:opacity-50">{updating===o._id ? '...' : 'Dispatched'}</button>}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default Orders
