/**
 * Orders — Delivery/takeaway orders wired to real backend
 * GET /orders/business/{bid} with status + order_type filters
 * POST /{id}/fire, /{id}/close, /{id}/void for status changes
 */
import { useState, useEffect, useCallback } from 'react'
import { useBusiness } from '../../contexts/BusinessContext'
import api from '../../utils/api'
import { Package, Truck, ShoppingBag, MapPin, CircleDot, Flame, CheckCircle2, XCircle, RefreshCw, Loader2 } from 'lucide-react'

const STATUS_MAP = {
  open:    { label: 'New',       Icon: CircleDot,    pillBg: 'bg-blue-50 text-blue-700' },
  fired:   { label: 'Preparing', Icon: Flame,        pillBg: 'bg-amber-50 text-amber-700' },
  ready:   { label: 'Ready',     Icon: CheckCircle2, pillBg: 'bg-emerald-50 text-emerald-700' },
  paid:    { label: 'Completed', Icon: Package,      pillBg: 'bg-gray-100 text-gray-500' },
  closed:  { label: 'Closed',    Icon: Package,      pillBg: 'bg-gray-100 text-gray-500' },
  voided:  { label: 'Voided',    Icon: XCircle,      pillBg: 'bg-red-50 text-red-600' },
}

const Orders = () => {
  const { business, loading: bizLoading } = useBusiness()
  const bid = business?.id ?? business?._id
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [actionLoading, setActionLoading] = useState(null)

  const fetchOrders = useCallback(async (showLoader = true) => {
    if (!bid) return
    if (showLoader) setLoading(true)
    try {
      const data = await api.get(`/orders/business/${bid}?hours_back=48&limit=100`)
      const all = (data.orders || []).filter(o =>
        o.order_type === 'delivery' || o.order_type === 'takeaway' || o.order_type === 'collection'
      )
      setOrders(all)
    } catch (err) {
      console.error('Failed to load orders:', err)
    }
    setLoading(false)
  }, [bid])

  useEffect(() => { fetchOrders() }, [fetchOrders])
  // Poll every 15s for new orders
  useEffect(() => {
    if (!bid) return
    const interval = setInterval(() => fetchOrders(false), 15000)
    return () => clearInterval(interval)
  }, [bid, fetchOrders])

  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter)

  const updateStatus = async (orderId, action) => {
    setActionLoading(orderId)
    try {
      if (action === 'fire') await api.post(`/orders/${orderId}/fire`)
      else if (action === 'close') await api.post(`/orders/${orderId}/close`)
      else if (action === 'void') await api.post(`/orders/${orderId}/void`, { reason: 'Cancelled by staff' })
      await fetchOrders(false)
    } catch (err) {
      console.error(`Failed to ${action} order:`, err)
    }
    setActionLoading(null)
  }

  if (bizLoading || !business) {
    return (
      <div className="flex items-center justify-center h-64" style={{ fontFamily: "'Figtree', sans-serif" }}>
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6" style={{ fontFamily: "'Figtree', sans-serif" }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 flex-wrap">
          {['all', 'open', 'fired', 'ready', 'paid', 'closed'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-1.5 text-xs font-bold rounded-full whitespace-nowrap transition-all ${
                filter === f
                  ? 'bg-[#111111] text-white shadow-lg shadow-[#111111]/20'
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
              }`}>
              {f === 'all' ? `All Orders (${orders.length})` : `${STATUS_MAP[f]?.label || f} (${orders.filter(o => o.status === f).length})`}
            </button>
          ))}
        </div>
        <button onClick={() => fetchOrders(false)} className="p-2 rounded-full hover:bg-gray-100 transition-all">
          <RefreshCw className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      )}

      {/* Empty state */}
      {!loading && filtered.length === 0 && (
        <div className="text-center py-20">
          <Package className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-400 font-semibold text-sm">
            {filter === 'all' ? 'No delivery or takeaway orders yet' : `No ${STATUS_MAP[filter]?.label || filter} orders`}
          </p>
          <p className="text-gray-300 text-xs mt-1">Orders will appear here in real-time when customers order</p>
        </div>
      )}

      {/* Order Cards */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(o => {
            const s = STATUS_MAP[o.status] || STATUS_MAP.open
            const StatusIcon = s.Icon
            const items = o.items || []
            const total = o.total ?? o.grand_total ?? o.subtotal ?? 0
            const orderNum = o.order_number || o._id?.slice(-6) || '—'
            const custName = o.customer_name || 'Walk-in'
            const orderType = o.order_type || 'takeaway'
            const createdAt = o.created_at ? new Date(o.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : ''
            const addr = o.delivery_address

            return (
              <div key={o._id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-[0_2px_10px_rgba(0,0,0,0.03)] hover:shadow-[0_10px_30px_-5px_rgba(17,17,17,0.08)] transition-all">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-gray-900">#{orderNum}</span>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${s.pillBg}`}>
                        <StatusIcon className="w-3 h-3" /> {s.label}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 font-medium mt-1">{custName} · {createdAt}</p>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                    orderType === 'delivery' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'
                  }`}>
                    {orderType === 'delivery' ? <Truck className="w-3 h-3" /> : <ShoppingBag className="w-3 h-3" />}
                    {orderType === 'delivery' ? 'Delivery' : 'Collection'}
                  </span>
                </div>
                <div className="border-t border-gray-100 pt-3 mb-3">
                  {items.map((item, i) => (
                    <p key={i} className="text-sm font-medium text-gray-700">
                      {item.name}{item.quantity > 1 ? ` x${item.quantity}` : ''}
                      {item.modifiers?.length > 0 && (
                        <span className="text-xs text-gray-400 ml-1">({item.modifiers.map(m => m.name).join(', ')})</span>
                      )}
                    </p>
                  ))}
                  {addr && (
                    <p className="text-[11px] text-gray-400 mt-2 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {typeof addr === 'string' ? addr : [addr.line1, addr.city, addr.postcode].filter(Boolean).join(', ')}
                    </p>
                  )}
                  {o.notes && <p className="text-[11px] text-amber-600 mt-1 italic">Note: {o.notes}</p>}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-extrabold text-gray-900">£{Number(total).toFixed(2)}</span>
                  <div className="flex gap-2">
                    {o.status === 'open' && (
                      <>
                        <button onClick={() => updateStatus(o._id, 'fire')} disabled={actionLoading === o._id}
                          className="px-4 py-1.5 text-xs font-bold text-white bg-[#111111] rounded-full hover:bg-[#1a1a1a] shadow-lg shadow-[#111111]/20 transition-all disabled:opacity-50">
                          {actionLoading === o._id ? 'Accepting...' : 'Accept'}
                        </button>
                        <button onClick={() => updateStatus(o._id, 'void')} disabled={actionLoading === o._id}
                          className="px-3 py-1.5 text-xs font-bold text-red-500 bg-red-50 rounded-full hover:bg-red-100 transition-all disabled:opacity-50">
                          Reject
                        </button>
                      </>
                    )}
                    {o.status === 'fired' && (
                      <button onClick={() => updateStatus(o._id, 'close')} disabled={actionLoading === o._id}
                        className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-500 rounded-full hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50">
                        {actionLoading === o._id ? 'Updating...' : 'Mark Ready'}
                      </button>
                    )}
                    {(o.status === 'ready' || o.status === 'paid') && (
                      <button onClick={() => updateStatus(o._id, 'close')} disabled={actionLoading === o._id}
                        className="px-4 py-1.5 text-xs font-bold text-gray-700 bg-white border border-gray-200 rounded-full hover:bg-gray-50 shadow-sm transition-all disabled:opacity-50">
                        {actionLoading === o._id ? 'Closing...' : 'Complete'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default Orders
