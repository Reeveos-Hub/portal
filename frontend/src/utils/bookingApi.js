/**
 * Run 2: Public booking API — no auth required
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export async function getBookingPage(slug) {
  const r = await fetch(`${API_BASE}/book/${slug}`)
  if (!r.ok) throw new Error('Business not found')
  return r.json()
}

export async function getAvailableDates(slug, { serviceId, partySize = 2, days = 60 } = {}) {
  const params = new URLSearchParams()
  if (serviceId) params.set('serviceId', serviceId)
  params.set('partySize', partySize)
  params.set('days', days)
  const r = await fetch(`${API_BASE}/book/${slug}/dates?${params}`)
  if (!r.ok) throw new Error('Failed to load dates')
  return r.json()
}

export async function getAvailability(slug, { date, serviceId, staffId, partySize = 2 } = {}) {
  const params = new URLSearchParams({ date })
  if (serviceId) params.set('serviceId', serviceId)
  if (staffId) params.set('staffId', staffId)
  params.set('partySize', partySize)
  const r = await fetch(`${API_BASE}/book/${slug}/availability?${params}`)
  if (!r.ok) throw new Error('Failed to load availability')
  return r.json()
}

export async function createBooking(slug, payload) {
  const r = await fetch(`${API_BASE}/book/${slug}/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!r.ok) {
    const err = await r.json().catch(() => ({}))
    throw new Error(err.detail || 'Booking failed')
  }
  return r.json()
}

export async function getBooking(slug, bookingId) {
  const r = await fetch(`${API_BASE}/book/${slug}/booking/${bookingId}`)
  if (!r.ok) throw new Error('Booking not found')
  return r.json()
}

export async function updateBooking(slug, bookingId, payload) {
  const r = await fetch(`${API_BASE}/book/${slug}/booking/${bookingId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!r.ok) throw new Error('Update failed')
  return r.json()
}

export async function cancelBooking(slug, bookingId) {
  const r = await fetch(`${API_BASE}/book/${slug}/booking/${bookingId}`, { method: 'DELETE' })
  if (!r.ok) throw new Error('Cancellation failed')
  return r.json()
}
