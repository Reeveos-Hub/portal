/**
 * Standalone consultation form route for booking domain.
 * Redirects to portal domain where form is built, with returnUrl to come back.
 */
import { useEffect } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'

const BookingFormRedirect = () => {
  const { businessSlug } = useParams()
  const [searchParams] = useSearchParams()
  const returnUrl = searchParams.get('returnUrl') || `${window.location.origin}/${businessSlug}`

  useEffect(() => {
    window.location.href = `/client/${businessSlug}?view=form&returnUrl=${encodeURIComponent(returnUrl)}`
  }, [businessSlug, returnUrl])

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Figtree', sans-serif" }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 28, height: 28, border: '3px solid #E5E5E5', borderTopColor: '#111', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
        <p style={{ fontSize: 13, color: '#888' }}>Loading consultation form...</p>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

export default BookingFormRedirect
