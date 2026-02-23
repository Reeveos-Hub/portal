/**
 * Orders — Delivery/takeaway orders (Restaurant mode)
 */

import { useState } from 'react'
import { useBusiness } from '../../contexts/BusinessContext'

const DEMO_ORDERS = [
  { id: 'ORD-001', customer: 'Alex M.', items: ['Smashed Burger x2', 'Loaded Fries'], total: 32.97, status: 'preparing', type: 'delivery', time: '12:30 PM', address: '14 High St, NG1 2EN' },
  { id: 'ORD-002', customer: 'Lisa K.', items: ['Double Stack', 'Milkshake'], total: 21.98, status: 'ready', type: 'collection', time: '12:45 PM' },
  { id: 'ORD-003', customer: 'Tom B.', items: ['Chicken Wings x2', 'Brownie Sundae'], total: 25.48, status: 'delivered', type: 'delivery', time: '11:15 AM', address: '8 Park Row, NG1 6GR' },
  { id: 'ORD-004', customer: 'Sarah P.', items: ['Smashed Burger', 'Loaded Fries', 'Milkshake'], total: 25.97, status: 'new', type: 'delivery', time: '12:55 PM', address: '22 Castle Blvd, NG7 1FB' },
]

const STATUS_MAP = {
  new: { label: 'New', bg: 'bg-blue-50 text-blue-700 border-blue-200', icon: 'fa-circle' },
  preparing: { label: 'Preparing', bg: 'bg-amber-50 text-amber-700 border-amber-200', icon: 'fa-fire-burner' },
  ready: { label: 'Ready', bg: 'bg-green-50 text-green-700 border-green-200', icon: 'fa-check' },
  delivered: { label: 'Delivered', bg: 'bg-gray-100 text-gray-500 border-gray-200', icon: 'fa-truck' },
  cancelled: { label: 'Cancelled', bg: 'bg-red-50 text-red-700 border-red-200', icon: 'fa-xmark' },
}

const Orders = () => {
  const { businessType } = useBusiness()
  const [filter, setFilter] = useState('all')

  const filtered = filter === 'all' ? DEMO_ORDERS : DEMO_ORDERS.filter(o => o.status === filter)

  return (
    <div className="space-y-6">
      {/* Filter Pills */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {['all', 'new', 'preparing', 'ready', 'delivered'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 text-sm font-bold rounded-lg whitespace-nowrap transition-colors ${filter === f ? 'bg-primary text-white' : 'bg-white text-gray-500 border border-border hover:border-primary hover:text-primary'}`}>
            {f === 'all' ? 'All Orders' : STATUS_MAP[f]?.label}
          </button>
        ))}
      </div>

      {/* Order Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map(o => {
          const s = STATUS_MAP[o.status] || STATUS_MAP.new
          return (
            <div key={o.id} className="bg-white rounded-xl border border-border p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-heading font-bold text-primary">{o.id}</span>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold border ${s.bg}`}>
                      <i className={`fa-solid ${s.icon} text-[10px]`} /> {s.label}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">{o.customer} • {o.time}</p>
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded ${o.type === 'delivery' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-purple-50 text-purple-700 border border-purple-200'}`}>
                  <i className={`fa-solid ${o.type === 'delivery' ? 'fa-motorcycle' : 'fa-bag-shopping'} mr-1`} />
                  {o.type === 'delivery' ? 'Delivery' : 'Collection'}
                </span>
              </div>
              <div className="border-t border-border pt-3 mb-3">
                {o.items.map((item, i) => <p key={i} className="text-sm text-primary">{item}</p>)}
                {o.address && <p className="text-xs text-gray-500 mt-2"><i className="fa-solid fa-location-dot mr-1" />{o.address}</p>}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-lg font-heading font-bold text-primary">£{o.total.toFixed(2)}</span>
                <div className="flex gap-2">
                  {o.status === 'new' && <button className="text-sm font-bold text-white bg-primary px-4 py-2 rounded-lg hover:bg-primary-hover shadow-md">Accept</button>}
                  {o.status === 'preparing' && <button className="text-sm font-bold text-white bg-green-600 px-4 py-2 rounded-lg hover:bg-green-700 shadow-md">Mark Ready</button>}
                  {o.status === 'ready' && <button className="text-sm font-bold text-primary border border-border px-4 py-2 rounded-lg hover:bg-gray-50 shadow-sm">Complete</button>}
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
