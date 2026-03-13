/**
 * Step 3 — Your details + AI assistant + booking summary + confirm
 * Mobile-first, form with validation, AI chat panel, contained CTA
 */

import { useState, useRef, useEffect } from 'react'
import { ArrowLeft, Calendar, Clock, User, Loader2, Send } from 'lucide-react'
import BookingHeader from '../../components/BookingHeader'
import StepIndicator from '../../components/StepIndicator'
import StickyFooter from '../../components/StickyFooter'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const YourDetails = ({ data, onCreate, onBack }) => {
  const { business, service, staff, date, time, slug, services } = data
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formRequired, setFormRequired] = useState(null)

  // AI chat state
  const bizName = business?.name || 'your appointment'
  const [msgs, setMsgs] = useState([
    { role: 'assistant', text: 'Welcome to ' + bizName + '! Just a couple of quick questions to personalise your visit:\n\n- Is this treatment for yourself, or are you buying it as a gift?\n- Is there a special occasion \u2014 birthday, holiday, wedding?\n- Any concerns or questions before your appointment?\n\nAlso, just tell me your name, phone number and email and I\'ll fill in the form for you.' }
  ])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const chatRef = useRef(null)

  const svc = service || services?.find((s) => s.id === data.serviceId)

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight
  }, [msgs])

  const formatDate = (d) => {
    if (!d) return ''
    const dt = new Date(d + 'T12:00:00')
    return dt.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
  }

  // AI chat send — hits backend proxy so API key stays server-side
  const sendChat = async () => {
    if (!chatInput.trim() || chatLoading) return
    const userMsg = chatInput.trim()
    setChatInput('')
    setMsgs(prev => [...prev, { role: 'user', text: userMsg }])
    setChatLoading(true)
    try {
      const res = await fetch(`${API_BASE}/book/${slug}/ai-assist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg,
          serviceName: svc?.name || 'a treatment',
          serviceDuration: svc?.duration || 60,
          servicePrice: svc?.price ? (svc.price / 100).toFixed(2) : '0',
          time: time || 'TBD',
          room: data.roomName || 'TBD',
          currentName: name,
          currentPhone: phone,
          currentEmail: email,
        }),
      })
      if (!res.ok) throw new Error('AI unavailable')
      const result = await res.json()
      const reply = result.reply || 'Sorry, I couldn\'t process that.'

      // Extract JSON if the AI included contact details
      const jsonMatch = reply.match(/\{[^}]*"(?:name|phone|email)"[^}]*\}/)
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0])
          if (parsed.name && !name) setName(parsed.name)
          if (parsed.phone && !phone) setPhone(parsed.phone)
          if (parsed.email && !email) setEmail(parsed.email)
        } catch (e) { /* ignore parse errors */ }
      }
      const cleanReply = reply.replace(/\{[^}]*"(?:name|phone|email)"[^}]*\}\n?/, '').trim()
      setMsgs(prev => [...prev, { role: 'assistant', text: cleanReply || 'Got your details!' }])
    } catch (e) {
      setMsgs(prev => [...prev, { role: 'assistant', text: 'I\'m having trouble connecting right now. You can type your details into the form fields instead.' }])
    }
    setChatLoading(false)
  }

  const handleSubmit = async (e) => {
    if (e) e.preventDefault()
    if (!name.trim() || !phone.trim() || !email.trim()) {
      setError('Please fill in all required fields')
      return
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address')
      return
    }
    setError('')
    setLoading(true)
    try {
      const res = await onCreate({
        serviceId: data.serviceId,
        staffId: data.staffId,
        date: data.date,
        time: data.time,
        customer: { name: name.trim(), phone: phone.trim(), email: email.trim() },
        notes: notes.trim() || undefined,
      })
      if (res?.booking?.id) {
        window.location.href = `/${slug}/confirm/${res.booking.id}`
      }
    } catch (err) {
      if (err.formRequired) {
        setFormRequired({ message: err.message, url: err.formUrl, reason: err.reason, slug: err.slug })
        setError('')
      } else {
        setError(err.message || 'Something went wrong. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="px-4 pt-3 overflow-hidden" style={{ fontFamily: "'Figtree', sans-serif" }}>
      {/* Back */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#111111] mb-4 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <BookingHeader business={business} />
      <StepIndicator step={3} total={3} />

      {/* Booking summary card */}
      <div className="bg-white rounded-xl border border-gray-200 p-3 mb-4">
        <h3 className="text-sm font-semibold text-[#111111] mb-2">Booking Summary</h3>
        <div className="space-y-1.5 text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <User className="w-3.5 h-3.5 text-gray-400" />
            <span className="font-medium text-gray-800">{svc?.name || 'Service'}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Calendar className="w-3.5 h-3.5 text-gray-400" />
            <span>{formatDate(date)}</span>
            <span className="text-gray-300">&middot;</span>
            <span>{time}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Clock className="w-3.5 h-3.5 text-gray-400" />
            <span>{svc?.duration || 60} minutes</span>
          </div>
        </div>
        {svc?.price > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between">
            <span className="text-sm text-gray-500">Total</span>
            <span className="font-semibold text-[#111111]">&pound;{((svc.price || 0) / 100).toFixed(2)}</span>
          </div>
        )}
      </div>

      {/* Form + AI — stacked (booking page uses 400px phone frame) */}
      <div className="flex flex-col gap-4 pb-6">
        {/* Left: Form */}
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-semibold text-[#111111] mb-3">Your details</h2>
          <div className="space-y-3.5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-900 text-[13px] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/20 focus:border-[#C9A84C] transition-all"
                placeholder="Your full name"
                autoComplete="name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-900 text-[13px] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/20 focus:border-[#C9A84C] transition-all"
                placeholder="07xxx xxxxxx"
                autoComplete="tel"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-900 text-[13px] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/20 focus:border-[#C9A84C] transition-all"
                placeholder="you@email.com"
                autoComplete="email"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes <span className="text-gray-400 font-normal">(optional)</span></label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-900 text-[13px] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/20 focus:border-[#C9A84C] transition-all min-h-[60px] resize-none"
                placeholder="Anything we should know?"
                rows={2}
              />
            </div>
          </div>
          {error && (
            <p className="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2 mt-3">{error}</p>
          )}
        </div>

        {/* Right: AI Chat */}
        <div className="flex-1 min-w-0 flex flex-col rounded-xl border border-gray-200 bg-white overflow-hidden" style={{ minHeight: 320 }}>
          <div className="flex items-center gap-2 px-3 py-2.5 border-b border-gray-100">
            <div className="w-6 h-6 rounded-md flex items-center justify-center text-[9px] font-black" style={{ background: '#111111', color: '#C9A84C' }}>R.</div>
            <span className="text-xs font-bold text-[#111111]">ReeveOS Assistant</span>
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 ml-auto" />
          </div>
          <div ref={chatRef} className="flex-1 overflow-y-auto px-3 py-2 flex flex-col gap-2" style={{ maxHeight: 260 }}>
            {msgs.map((m, i) => (
              <div
                key={i}
                className={`max-w-[85%] px-3 py-2 rounded-xl text-xs leading-relaxed whitespace-pre-line ${
                  m.role === 'user'
                    ? 'self-end bg-[#111111] text-white'
                    : 'self-start bg-gray-50 text-gray-800'
                }`}
              >
                {m.text}
              </div>
            ))}
            {chatLoading && (
              <div className="self-start bg-gray-50 px-3 py-2 rounded-xl text-xs text-gray-400">Thinking...</div>
            )}
          </div>
          <div className="flex items-center gap-2 px-3 py-2 border-t border-gray-100">
            <input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendChat()}
              placeholder="Ask me anything or share your details..."
              className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-xs focus:outline-none focus:ring-1 focus:ring-[#C9A84C]/30 focus:border-[#C9A84C] transition-all"
              style={{ fontFamily: "'Figtree', sans-serif" }}
            />
            <button
              onClick={sendChat}
              disabled={chatLoading || !chatInput.trim()}
              className="flex items-center justify-center w-8 h-8 rounded-lg transition-all"
              style={{ background: chatInput.trim() ? '#111111' : '#E5E5E5' }}
            >
              <Send className="w-3.5 h-3.5" style={{ color: chatInput.trim() ? '#C9A84C' : '#aaa' }} />
            </button>
          </div>
        </div>
      </div>

      {/* G4: Consultation form required prompt */}
      {formRequired && (
        <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4 mb-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/></svg>
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-amber-900 text-sm mb-1">Health Questionnaire Required</h3>
              <p className="text-amber-800 text-xs leading-relaxed mb-3">{formRequired.message}</p>
              <a
                href={formRequired.url}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold text-white no-underline"
                style={{ background: '#C9A84C' }}
              >
                Complete Form
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </a>
              <p className="text-amber-700 text-xs mt-2">Takes 2-3 minutes. Your booking details will be saved.</p>
            </div>
          </div>
        </div>
      )}

      {/* Contained CTA */}
      <StickyFooter>
        <button
          onClick={handleSubmit}
          disabled={loading}
          className={`w-full py-3 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 ${
            loading
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-[#111111] text-white hover:bg-[#0a0a0a] shadow-sm'
          }`}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Booking...
            </>
          ) : (
            'Confirm Booking'
          )}
        </button>
      </StickyFooter>
    </div>
  )
}

export default YourDetails
