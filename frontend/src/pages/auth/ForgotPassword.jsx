/**
 * ForgotPassword — Request a password reset link
 * Split layout matching Login: brand hero (left) + form (right)
 * States: email input → sending → success confirmation → error
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, ArrowLeft, AlertCircle, CheckCircle2, Shield } from 'lucide-react'

const API = import.meta.env.VITE_API_URL || ''

const ForgotPassword = () => {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('idle') // idle | sending | sent | error
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setStatus('sending')

    try {
      const res = await fetch(`${API}/api/auth/password-reset-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      if (res.ok) {
        setStatus('sent')
      } else {
        // Always show success to prevent email enumeration (matches backend behaviour)
        setStatus('sent')
      }
    } catch {
      setStatus('sent') // Same reason — never reveal if email exists
    }
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row overflow-hidden" style={{ fontFamily: "'Figtree', sans-serif" }}>
      {/* Left: Brand Hero */}
      <section className="hidden lg:flex lg:w-1/2 xl:w-7/12 bg-[#111111] relative overflow-hidden flex-col justify-between p-12 text-white h-screen">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-t from-[#111111] via-[#111111]/80 to-[#111111]/40" />
          <div className="absolute top-20 right-20 w-64 h-64 rounded-full border border-white/5" />
          <div className="absolute bottom-40 left-10 w-48 h-48 rounded-full border border-white/5" />
        </div>

        <a href="https://reeveos.app" className="relative z-10 flex items-center gap-3 no-underline">
          <div className="w-11 h-11 bg-[#C9A84C] rounded-xl flex items-center justify-center shadow-md">
            <span className="text-[#111111] font-bold text-xl">R.</span>
          </div>
          <span className="font-extrabold text-2xl tracking-tight text-white">ReeveOS</span>
        </a>

        <div className="relative z-10 max-w-xl mb-12">
          <div className="w-16 h-16 rounded-2xl bg-[#C9A84C]/20 flex items-center justify-center mb-6">
            <Shield className="w-8 h-8 text-[#C9A84C]" />
          </div>
          <h2 className="text-4xl xl:text-5xl font-extrabold leading-tight mb-4">
            Don't worry, it happens.
          </h2>
          <p className="text-white/60 text-lg">
            We'll send you a secure link to reset your password. Quick and easy.
          </p>
        </div>

        <button onClick={() => navigate('/login')} className="relative z-10 w-10 h-10 rounded-full border border-white/30 flex items-center justify-center text-white/70 hover:text-white hover:border-white/60 transition-all">
          <ArrowLeft className="w-4 h-4" />
        </button>
      </section>

      {/* Right: Form */}
      <section className="w-full lg:w-1/2 xl:w-5/12 flex flex-col justify-center items-center p-6 sm:p-12 lg:p-16 xl:p-24 bg-[#FEFBF4] h-screen overflow-y-auto">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile Logo */}
          <div className="lg:hidden flex justify-center mb-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-[#C9A84C] rounded-xl flex items-center justify-center shadow-md">
                <span className="text-[#111111] font-bold text-lg">R.</span>
              </div>
              <span className="font-extrabold text-2xl tracking-tight text-[#111111]">ReeveOS</span>
            </div>
          </div>

          {/* STATE: Email input form */}
          {(status === 'idle' || status === 'sending') && (
            <>
              <div className="text-center lg:text-left space-y-2">
                <button onClick={() => navigate('/login')} className="text-sm text-gray-400 hover:text-[#111111] flex items-center gap-1 mb-2 transition-colors">
                  <ArrowLeft className="w-3 h-3" /> Back to sign in
                </button>
                <h1 className="text-3xl font-extrabold text-[#111111]">Forgot your password?</h1>
                <p className="text-gray-500">Enter the email address you used to sign up and we'll send you a reset link.</p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" /> {error}
                </div>
              )}

              <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-[#111111]">Email address</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="w-4 h-4 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-lg bg-white text-[#111111] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#111111]/20 focus:border-[#111111] transition-all text-base"
                      placeholder="name@yourbusiness.com"
                      autoFocus
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={status === 'sending'}
                  className="w-full flex justify-center items-center py-3 px-4 rounded-lg shadow-lg text-sm font-bold text-white bg-[#111111] hover:bg-[#1a1a1a] transition-all disabled:opacity-50"
                >
                  {status === 'sending' ? (
                    <><span className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white mr-2" /> Sending...</>
                  ) : 'Send reset link'}
                </button>
              </form>

              <p className="text-center text-sm text-gray-500">
                Remember your password?{' '}
                <a href="/login" className="font-bold text-[#111111] hover:underline">Sign in</a>
              </p>
            </>
          )}

          {/* STATE: Success — email sent */}
          {status === 'sent' && (
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
              </div>
              <div className="space-y-2">
                <h1 className="text-3xl font-extrabold text-[#111111]">Check your inbox</h1>
                <p className="text-gray-500">
                  If <strong className="text-[#111111]">{email}</strong> is registered with us, you'll receive a reset link shortly.
                </p>
              </div>

              <div className="bg-[#FFF8E7] border border-[#C9A84C]/30 rounded-lg p-4 text-sm text-[#111111]">
                <p className="font-semibold mb-1">Didn't get the email?</p>
                <ul className="text-gray-600 space-y-1 text-left">
                  <li>Check your spam or junk folder</li>
                  <li>Make sure you entered the right email</li>
                  <li>The link expires in 1 hour</li>
                </ul>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => { setStatus('idle'); setEmail('') }}
                  className="w-full py-3 px-4 rounded-lg text-sm font-bold text-[#111111] bg-white border-2 border-gray-200 hover:border-[#111111] transition-all"
                >
                  Try a different email
                </button>
                <button
                  onClick={() => navigate('/login')}
                  className="w-full py-3 px-4 rounded-lg text-sm font-bold text-white bg-[#111111] hover:bg-[#1a1a1a] transition-all"
                >
                  Back to sign in
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

export default ForgotPassword
