/**
 * Unsubscribe — confirms email removal from marketing lists
 * URL: /unsubscribe?email=x&business_id=y
 */
import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'

const API = import.meta.env.VITE_API_URL || ''

export default function Unsubscribe() {
  const [params] = useSearchParams()
  const email = params.get('email') || ''
  const businessId = params.get('business_id') || ''
  const [status, setStatus] = useState('loading') // loading | done | error

  useEffect(() => {
    if (!email || !businessId) { setStatus('error'); return }
    fetch(`${API}/api/marketing/unsubscribe?email=${encodeURIComponent(email)}&business_id=${encodeURIComponent(businessId)}`, { method: 'POST' })
      .then(r => { setStatus(r.ok ? 'done' : 'error') })
      .catch(() => setStatus('error'))
  }, [email, businessId])

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FAFAF8', fontFamily: "'Figtree', sans-serif" }}>
      <div style={{ maxWidth: 440, textAlign: 'center', padding: 32 }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: '#C9A84C', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
          <span style={{ color: '#111', fontWeight: 800, fontSize: 20 }}>R.</span>
        </div>
        {status === 'loading' && <p style={{ color: '#666', fontSize: 15 }}>Processing...</p>}
        {status === 'done' && <>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111', margin: '0 0 12px' }}>You've been unsubscribed</h1>
          <p style={{ fontSize: 15, color: '#666', lineHeight: 1.6, margin: '0 0 24px' }}>
            <strong>{email}</strong> has been removed from marketing emails. You'll still receive booking confirmations and essential account notifications.
          </p>
          <a href="https://reeveos.app" style={{ color: '#C9A84C', fontWeight: 600, textDecoration: 'none', fontSize: 14 }}>Back to ReeveOS</a>
        </>}
        {status === 'error' && <>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111', margin: '0 0 12px' }}>Something went wrong</h1>
          <p style={{ fontSize: 15, color: '#666', lineHeight: 1.6, margin: '0 0 24px' }}>
            We couldn't process your unsubscribe request. Please contact <a href="mailto:support@reeveos.app" style={{ color: '#C9A84C' }}>support@reeveos.app</a> and we'll sort it out.
          </p>
        </>}
      </div>
    </div>
  )
}
