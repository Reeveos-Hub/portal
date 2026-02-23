/**
 * Run 3: Bookings list — search, filters, detail panel, status actions
 */

import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useBusiness } from '../../contexts/BusinessContext'
import api from '../../utils/api'
import Card from '../../components/shared/Card'

const STATUS_LABELS = {
  confirmed: { label: 'Confirmed', class: 'bg-success/20 text-success' },
  pending: { label: 'Pending', class: 'bg-warning/20 text-warning' },
  checked_in: { label: 'Checked In', class: 'bg-info/20 text-info' },
  completed: { label: 'Completed', class: 'bg-muted/30 text-muted' },
  cancelled: { label: 'Cancelled', class: 'bg-error/20 text-error' },
  no_show: { label: 'No-show', class: 'bg-error/30 text-error' },
}

const Bookings = () => {
  const { business, businessType } = useBusiness()
  const [searchParams, setSearchParams] = useSearchParams()
  const [bookings, setBookings] = useState([])
  const [pagination, setPagination] = useState({})
  const [counts, setCounts] = useState({})
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState(searchParams.get('status') || 'all')
  const [search, setSearch] = useState('')
  const [searchDebounce, setSearchDebounce] = useState('')
  const [detail, setDetail] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [updating, setUpdating] = useState(false)

  const bookingId = searchParams.get('booking')

  const fetchBookings = async () => {
    if (!(business?.id ?? business?._id)) return
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', '1')
      params.set('limit', '20')
      params.set('status', status)
      if (searchDebounce) params.set('search', searchDebounce)
      const res = await api.get(`/bookings/business/${(business?.id ?? business?._id)}?${params}`)
      setBookings(res.bookings || [])
      setPagination(res.pagination || {})
      setCounts(res.counts || {})
    } catch (err) {
      console.error('Failed to fetch bookings:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchDetail = async (id) => {
    if (!(business?.id ?? business?._id) || !id) return
    setDetailLoading(true)
    try {
      const res = await api.get(`/bookings/business/${(business?.id ?? business?._id)}/detail/${id}`)
      setDetail(res.booking)
    } catch {
      setDetail(null)
    } finally {
      setDetailLoading(false)
    }
  }

  const updateStatus = async (newStatus) => {
    if (!(business?.id ?? business?._id) || !detail?.id) return
    setUpdating(true)
    try {
      await api.patch(`/bookings/business/${(business?.id ?? business?._id)}/detail/${detail.id}/status`, { status: newStatus })
      setDetail((d) => (d ? { ...d, status: newStatus } : null))
      fetchBookings()
    } catch (err) {
      alert(err.message || 'Failed to update')
    } finally {
      setUpdating(false)
    }
  }

  useEffect(() => {
    const t = setTimeout(() => setSearchDebounce(search), 300)
    return () => clearTimeout(t)
  }, [search])

  useEffect(() => {
    fetchBookings()
  }, [business?.id ?? business?._id, status, searchDebounce])

  useEffect(() => {
    if (bookingId) {
      fetchDetail(bookingId)
      setSearchParams({ booking: bookingId }, { replace: true })
    } else {
      setDetail(null)
    }
  }, [bookingId, business?.id ?? business?._id])

  const statusActions = () => {
    if (!detail || updating) return null
    const s = detail.status
    if (s === 'confirmed') {
      return (
        <>
          <button onClick={() => updateStatus('checked_in')} className="btn-primary text-sm">Check In</button>
          <button onClick={() => updateStatus('cancelled')} className="btn-outline border-error text-error text-sm">Cancel</button>
          <button onClick={() => updateStatus('no_show')} className="text-sm text-muted hover:text-error">No-show</button>
        </>
      )
    }
    if (s === 'checked_in') {
      return (
        <>
          <button onClick={() => updateStatus('completed')} className="btn-primary text-sm">Complete</button>
          <button onClick={() => updateStatus('no_show')} className="text-sm text-muted hover:text-error">No-show</button>
        </>
      )
    }
    if (s === 'pending') {
      return (
        <>
          <button onClick={() => updateStatus('confirmed')} className="btn-primary text-sm">Confirm</button>
          <button onClick={() => updateStatus('cancelled')} className="btn-outline border-error text-error text-sm">Cancel</button>
        </>
      )
    }
    return null
  }

  return (
    <div className="flex gap-6">
      <div className={`${detail ? 'flex-1 min-w-0' : 'w-full'}`}>
        <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between">
          <div>
            <h1 className="text-3xl font-heading font-bold mb-2">Bookings</h1>
            <p className="text-muted">{pagination.total ?? 0} bookings</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <input
              type="search"
              placeholder="Search name, reference, phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input flex-1 min-w-[200px] max-w-xs"
            />
          </div>
        </div>

        {/* Status tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
          {['all', 'confirmed', 'pending', 'checked_in', 'completed', 'cancelled', 'no_show'].map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${status === s ? 'bg-primary text-white' : 'bg-border text-muted hover:bg-border/80'}`}
            >
              {s === 'all' ? 'All' : STATUS_LABELS[s]?.label || s} {counts[s] != null && `(${counts[s]})`}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          </div>
        ) : bookings.length === 0 ? (
          <Card>
            <p className="text-center text-muted py-8">No bookings found</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {bookings.map((b) => (
              <Card
                key={b.id}
                className={`cursor-pointer hover:shadow-md transition-shadow ${detail?.id === b.id ? 'ring-2 ring-primary' : ''}`}
                onClick={() => setSearchParams({ booking: b.id })}
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-mono font-medium">{b.reference}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_LABELS[b.status]?.class || 'bg-muted/30'}`}>
                        {STATUS_LABELS[b.status]?.label || b.status}
                      </span>
                    </div>
                    <p className="font-medium">{b.customerName}</p>
                    <p className="text-sm text-muted">{b.service} · {b.date} at {b.time} {b.staff && `· ${b.staff}`}</p>
                  </div>
                  <i className="fa-solid fa-chevron-right text-muted" />
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Detail panel */}
      {detail && (
        <Card className="w-96 shrink-0 sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto">
          <div className="flex justify-between items-start mb-4">
            <h2 className="font-heading font-semibold text-lg">Booking Details</h2>
            <button onClick={() => setSearchParams({})} className="text-muted hover:text-primary p-1">
              <i className="fa-solid fa-xmark" />
            </button>
          </div>
          {detailLoading ? (
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          ) : (
            <>
              <div className="space-y-2 mb-4">
                <p><span className="text-muted">Reference:</span> {detail.reference}</p>
                <p><span className="text-muted">Customer:</span> {detail.customer?.name}</p>
                <p><span className="text-muted">Phone:</span> {detail.customer?.phone}</p>
                <p><span className="text-muted">Email:</span> {detail.customer?.email}</p>
                <p><span className="text-muted">Service:</span> {detail.service?.name}</p>
                <p><span className="text-muted">Date & time:</span> {detail.date} at {detail.time}</p>
                {detail.notes && <p><span className="text-muted">Notes:</span> {detail.notes}</p>}
              </div>
              <div className="flex flex-wrap gap-2 pt-4 border-t border-border">
                {statusActions()}
              </div>
            </>
          )}
        </Card>
      )}
    </div>
  )
}

export default Bookings
