/**
 * ResetPassword — Set a new password using the token from the email link
 * URL: /reset-password?token=xxx
 * States: form → submitting → success → error (invalid/expired token)
 */
import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Lock, Eye, EyeOff, ArrowLeft, CheckCircle2, Shield, XCircle } from 'lucide-react'
import Alert from '../../components/ui/Alert'

const API = import.meta.env.VITE_API_URL || ''

const ResetPassword = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [status, setStatus] = useState('idle') // idle | submitting | success | error | no_token
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) setStatus('no_token')
  }, [token])

  // Password strength check
  const hasMinLength = password.length >= 8
  const hasUpper = /[A-Z]/.test(password)
  const hasNumber = /\d/.test(password)
  const passwordsMatch = password && confirm && password === confirm
  const isValid = hasMinLength && hasUpper && hasNumber && passwordsMatch

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!isValid) return
    setError('')
    setStatus('submitting')

    try {
      const res = await fetch(`${API}/api/auth/password-reset-confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, new_password: password }),
      })

      if (res.ok) {
        setStatus('success')
      } else {
        const data = await res.json().catch(() => ({}))
        setError(data.detail || 'This reset link has expired or is invalid. Please request a new one.')
        setStatus('error')
      }
    } catch {
      setError('Something went wrong. Please try again.')
      setStatus('error')
    }
  }

  const StrengthDot = ({ met, label }) => (
    <div className="flex items-center gap-2 text-sm">
      <div className={`w-2 h-2 rounded-full transition-colors ${met ? 'bg-green-500' : 'bg-gray-300'}`} />
      <span className={met ? 'text-green-700' : 'text-gray-400'}>{label}</span>
    </div>
  )

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
            {status === 'success' ? "You're all set." : "Create a new password."}
          </h2>
          <p className="text-white/60 text-lg">
            {status === 'success'
              ? "Your password has been updated. You can now sign in with your new password."
              : "Choose something strong that you haven't used before."}
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

          {/* STATE: No token in URL */}
          {status === 'no_token' && (
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
                  <XCircle className="w-8 h-8 text-red-500" />
                </div>
              </div>
              <div className="space-y-2">
                <h1 className="text-3xl font-extrabold text-[#111111]">Invalid reset link</h1>
                <p className="text-gray-500">This link is missing or incomplete. Please request a new password reset.</p>
              </div>
              <button
                onClick={() => navigate('/forgot-password')}
                className="w-full py-3 px-4 rounded-lg text-sm font-bold text-white bg-[#111111] hover:bg-[#1a1a1a] transition-all"
              >
                Request new reset link
              </button>
            </div>
          )}

          {/* STATE: Error — expired/invalid token */}
          {status === 'error' && (
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
                  <XCircle className="w-8 h-8 text-red-500" />
                </div>
              </div>
              <div className="space-y-2">
                <h1 className="text-3xl font-extrabold text-[#111111]">Link expired</h1>
                <p className="text-gray-500">{error}</p>
              </div>
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/forgot-password')}
                  className="w-full py-3 px-4 rounded-lg text-sm font-bold text-white bg-[#111111] hover:bg-[#1a1a1a] transition-all"
                >
                  Request new reset link
                </button>
                <button
                  onClick={() => navigate('/login')}
                  className="w-full py-3 px-4 rounded-lg text-sm font-bold text-[#111111] bg-white border-2 border-gray-200 hover:border-[#111111] transition-all"
                >
                  Back to sign in
                </button>
              </div>
            </div>
          )}

          {/* STATE: New password form */}
          {(status === 'idle' || status === 'submitting') && (
            <>
              <div className="text-center lg:text-left space-y-2">
                <h1 className="text-3xl font-extrabold text-[#111111]">Set your new password</h1>
                <p className="text-gray-500">Choose a strong password for your account.</p>
              </div>

              <form className="space-y-5" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-[#111111]">New password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="w-4 h-4 text-gray-400" />
                    </div>
                    <input
                      type={showPw ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="block w-full pl-10 pr-10 py-3 border border-gray-200 rounded-lg bg-white text-[#111111] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#111111]/20 focus:border-[#111111] transition-all text-base"
                      placeholder="••••••••"
                      autoFocus
                    />
                    <button type="button" onClick={() => setShowPw(!showPw)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-[#111111] transition-colors">
                      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-[#111111]">Confirm new password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="w-4 h-4 text-gray-400" />
                    </div>
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      required
                      value={confirm}
                      onChange={e => setConfirm(e.target.value)}
                      className="block w-full pl-10 pr-10 py-3 border border-gray-200 rounded-lg bg-white text-[#111111] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#111111]/20 focus:border-[#111111] transition-all text-base"
                      placeholder="••••••••"
                    />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-[#111111] transition-colors">
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Password strength indicators */}
                {password.length > 0 && (
                  <div className="bg-white rounded-lg border border-gray-100 p-3 space-y-2">
                    <StrengthDot met={hasMinLength} label="At least 8 characters" />
                    <StrengthDot met={hasUpper} label="One uppercase letter" />
                    <StrengthDot met={hasNumber} label="One number" />
                    <StrengthDot met={passwordsMatch} label="Passwords match" />
                  </div>
                )}

                {confirm && !passwordsMatch && (
                  <Alert variant="warning" message="Passwords don't match" />
                )}

                <button
                  type="submit"
                  disabled={!isValid || status === 'submitting'}
                  className="w-full flex justify-center items-center py-3 px-4 rounded-lg shadow-lg text-sm font-bold text-white bg-[#111111] hover:bg-[#1a1a1a] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {status === 'submitting' ? (
                    <><span className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white mr-2" /> Updating...</>
                  ) : 'Set new password'}
                </button>
              </form>
            </>
          )}

          {/* STATE: Success */}
          {status === 'success' && (
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
              </div>
              <div className="space-y-2">
                <h1 className="text-3xl font-extrabold text-[#111111]">Password updated</h1>
                <p className="text-gray-500">Your password has been changed successfully. You can now sign in with your new password.</p>
              </div>
              <button
                onClick={() => navigate('/login')}
                className="w-full py-3 px-4 rounded-lg shadow-lg text-sm font-bold text-white bg-[#111111] hover:bg-[#1a1a1a] transition-all"
              >
                Sign in with new password
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

export default ResetPassword
