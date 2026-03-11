/**
 * VerifyEmail — handles ?token=xxx from verification email
 * States: verifying → success → error (expired/invalid)
 */
import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { CheckCircle2, XCircle } from 'lucide-react'

const API = import.meta.env.VITE_API_URL || ''

export default function VerifyEmail() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const token = params.get('token')
  const [status, setStatus] = useState('verifying') // verifying | success | error
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) { setStatus('error'); setError('Missing verification token'); return }
    fetch(`${API}/api/auth/verify-email?token=${encodeURIComponent(token)}`)
      .then(async r => {
        if (r.ok) { setStatus('success') }
        else { const d = await r.json().catch(() => ({})); setError(d.detail || 'Verification failed'); setStatus('error') }
      })
      .catch(() => { setError('Something went wrong'); setStatus('error') })
  }, [token])

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FEFBF4', fontFamily: "'Figtree', sans-serif" }}>
      <div style={{ maxWidth: 440, textAlign: 'center', padding: 32 }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: '#C9A84C', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
          <span style={{ color: '#111', fontWeight: 800, fontSize: 20 }}>R.</span>
        </div>

        {status === 'verifying' && <>
          <div style={{ width: 24, height: 24, border: '3px solid #E0E0E0', borderTopColor: '#C9A84C', borderRadius: '50%', animation: 'spin 0.6s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ color: '#666', fontSize: 15 }}>Verifying your email...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </>}

        {status === 'success' && <>
          <CheckCircle2 size={48} color="#22C55E" style={{ marginBottom: 16 }} />
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111', margin: '0 0 8px' }}>Email verified</h1>
          <p style={{ fontSize: 15, color: '#666', margin: '0 0 24px' }}>Your email has been confirmed. You're all set.</p>
          <button onClick={() => navigate('/login')} style={{ padding: '12px 28px', borderRadius: 8, border: 'none', background: '#111', color: '#FFF', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
            Sign in
          </button>
        </>}

        {status === 'error' && <>
          <XCircle size={48} color="#EF4444" style={{ marginBottom: 16 }} />
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111', margin: '0 0 8px' }}>Verification failed</h1>
          <p style={{ fontSize: 15, color: '#666', margin: '0 0 24px' }}>{error || 'This link may have expired. Please sign in and request a new verification email.'}</p>
          <button onClick={() => navigate('/login')} style={{ padding: '12px 28px', borderRadius: 8, border: 'none', background: '#111', color: '#FFF', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
            Sign in
          </button>
        </>}
      </div>
    </div>
  )
}
