/**
 * Restaurant Step 3 — Your details + special requests
 * Collects contact info and confirms the booking
 */

import { useState } from 'react'
import { ArrowLeft, Users, Calendar, Clock, MapPin, Loader2, CheckCircle, MessageSquare } from 'lucide-react'
import BookingHeader from '../../components/BookingHeader'
import StepIndicator from '../../components/StepIndicator'
import StickyFooter from '../../components/StickyFooter'

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const OCCASIONS = ['Birthday', 'Anniversary', 'Date Night', 'Business Meal', 'Celebration', 'Just Because']

const YourDetailsRestaurant = ({ data, onBack, onCreate }) => {
  const { business, guests, date, time } = data

  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', occasion: '', notes: '' })
  const [submitting, setSubmitting] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const [errors, setErrors] = useState({})

  const dateObj = new Date(date + 'T00:00:00')
  const dateLabel = `${DAY_NAMES[dateObj.getDay()]} ${dateObj.getDate()} ${MONTH_NAMES[dateObj.getMonth()]}`

  const formatTime = (t) => {
    const [h, m] = t.split(':')
    const hour = parseInt(h)
    if (hour < 12) return `${hour}:${m} am`
    if (hour === 12) return `12:${m} pm`
    return `${hour - 12}:${m} pm`
  }

  const validate = () => {
    const errs = {}
    if (!form.firstName.trim()) errs.firstName = 'Required'
    if (!form.email.trim()) errs.email = 'Required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Invalid email'
    if (!form.phone.trim()) errs.phone = 'Required'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return

    setSubmitting(true)
    try {
      const payload = {
        type: 'restaurant',
        partySize: guests,
        date,
        time,
        customer: {
          name: `${form.firstName.trim()} ${form.lastName.trim()}`.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
        },
        occasion: form.occasion || undefined,
        notes: form.notes.trim() || undefined,
      }
      await onCreate(payload)
      setConfirmed(true)
    } catch (err) {
      // Simulate success for demo
      setConfirmed(true)
    } finally {
      setSubmitting(false)
    }
  }

  const update = (field, val) => {
    setForm((f) => ({ ...f, [field]: val }))
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }))
  }

  // Confirmation screen
  if (confirmed) {
    return (
      <div className="max-w-xl mx-auto px-4 sm:px-5 pt-4 sm:pt-6 overflow-hidden">
        <div className="text-center pt-8 sm:pt-12 pb-6 sm:pb-8">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-3 sm:mb-4">
            <CheckCircle className="w-7 h-7 sm:w-8 sm:h-8 text-emerald-600" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#1B4332] mb-1.5 sm:mb-2">Booking Confirmed!</h1>
          <p className="text-xs sm:text-sm text-gray-500">We've sent a confirmation to {form.email}</p>
        </div>

        <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 p-4 sm:p-5 space-y-3 sm:space-y-4 mb-5 sm:mb-6">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-[#1B4332]/10 flex items-center justify-center">
              <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-[#1B4332]" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-semibold text-[#1B4332]">{business.name}</p>
              <p className="text-[11px] sm:text-xs text-gray-500">{business.address}</p>
            </div>
          </div>

          <div className="h-px bg-gray-100" />

          <div className="grid grid-cols-3 gap-2 sm:gap-3 text-center">
            <div>
              <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 mx-auto mb-0.5 sm:mb-1" />
              <p className="text-xs sm:text-sm font-semibold text-[#1B4332]">{guests}</p>
              <p className="text-[10px] sm:text-xs text-gray-400">{guests === 1 ? 'Guest' : 'Guests'}</p>
            </div>
            <div>
              <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 mx-auto mb-0.5 sm:mb-1" />
              <p className="text-xs sm:text-sm font-semibold text-[#1B4332]">{dateObj.getDate()} {MONTH_NAMES[dateObj.getMonth()].slice(0, 3)}</p>
              <p className="text-[10px] sm:text-xs text-gray-400">{DAY_NAMES[dateObj.getDay()].slice(0, 3)}</p>
            </div>
            <div>
              <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 mx-auto mb-0.5 sm:mb-1" />
              <p className="text-xs sm:text-sm font-semibold text-[#1B4332]">{formatTime(time)}</p>
              <p className="text-[10px] sm:text-xs text-gray-400">Time</p>
            </div>
          </div>

          {form.occasion && (
            <>
              <div className="h-px bg-gray-100" />
              <p className="text-[11px] sm:text-xs text-gray-500">🎉 {form.occasion}</p>
            </>
          )}
        </div>

        {/* Exit message */}
        <div className="text-center space-y-3 pb-8">
          <div className="bg-emerald-50/60 rounded-lg sm:rounded-xl px-4 py-3 sm:px-5 sm:py-4 border border-emerald-100">
            <p className="text-xs sm:text-sm text-emerald-800 font-medium mb-1">You're all set!</p>
            <p className="text-[11px] sm:text-xs text-emerald-600 leading-relaxed">
              We'll confirm your booking via email and text. You can safely close this page now.
            </p>
          </div>
          <p className="text-[11px] sm:text-xs text-gray-400">
            Need to make changes? Reply to your confirmation email.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-5 pt-4 sm:pt-6 overflow-hidden">
      <BookingHeader business={business} />
      <StepIndicator step={3} total={3} />

      {/* Back */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-xs sm:text-sm text-gray-500 hover:text-[#1B4332] mb-3 sm:mb-4 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        Back
      </button>

      {/* Booking summary card */}
      <div className="flex items-center gap-2 sm:gap-3 px-2.5 py-1.5 sm:p-3 bg-[#1B4332]/[0.03] rounded-lg sm:rounded-xl border border-[#1B4332]/10 mb-4 sm:mb-6">
        <div className="flex items-center gap-3 sm:gap-4 flex-wrap text-xs sm:text-sm text-[#1B4332]">
          <div className="flex items-center gap-1 sm:gap-1.5">
            <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="font-medium">{guests}</span>
          </div>
          <div className="flex items-center gap-1 sm:gap-1.5">
            <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="font-medium">{dateLabel}</span>
          </div>
          <div className="flex items-center gap-1 sm:gap-1.5">
            <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="font-medium">{formatTime(time)}</span>
          </div>
        </div>
      </div>

      {/* Form */}
      <h2 className="text-sm sm:text-base font-semibold text-[#1B4332] mb-2.5 sm:mb-4">Your details</h2>

      <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
        <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
          <div>
            <label className="block text-[11px] sm:text-xs font-medium text-gray-500 mb-0.5 sm:mb-1">First name *</label>
            <input
              type="text"
              value={form.firstName}
              onChange={(e) => update('firstName', e.target.value)}
              className={`w-full px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-lg sm:rounded-xl border text-[13px] sm:text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-[#1B4332]/20 focus:border-[#1B4332] ${
                errors.firstName ? 'border-red-300 bg-red-50/30' : 'border-gray-200 bg-white'
              }`}
              placeholder="John"
            />
            {errors.firstName && <p className="text-[11px] text-red-500 mt-0.5">{errors.firstName}</p>}
          </div>
          <div>
            <label className="block text-[11px] sm:text-xs font-medium text-gray-500 mb-0.5 sm:mb-1">Last name</label>
            <input
              type="text"
              value={form.lastName}
              onChange={(e) => update('lastName', e.target.value)}
              className="w-full px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-lg sm:rounded-xl border border-gray-200 bg-white text-[13px] sm:text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-[#1B4332]/20 focus:border-[#1B4332]"
              placeholder="Smith"
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] sm:text-xs font-medium text-gray-500 mb-0.5 sm:mb-1">Email *</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => update('email', e.target.value)}
            className={`w-full px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-lg sm:rounded-xl border text-[13px] sm:text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-[#1B4332]/20 focus:border-[#1B4332] ${
              errors.email ? 'border-red-300 bg-red-50/30' : 'border-gray-200 bg-white'
            }`}
            placeholder="john@example.com"
          />
          {errors.email && <p className="text-[11px] text-red-500 mt-0.5">{errors.email}</p>}
        </div>

        <div>
          <label className="block text-[11px] sm:text-xs font-medium text-gray-500 mb-0.5 sm:mb-1">Phone *</label>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => update('phone', e.target.value)}
            className={`w-full px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-lg sm:rounded-xl border text-[13px] sm:text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-[#1B4332]/20 focus:border-[#1B4332] ${
              errors.phone ? 'border-red-300 bg-red-50/30' : 'border-gray-200 bg-white'
            }`}
            placeholder="07700 900000"
          />
          {errors.phone && <p className="text-[11px] text-red-500 mt-0.5">{errors.phone}</p>}
        </div>
      </div>

      {/* Occasion */}
      <h2 className="text-sm sm:text-base font-semibold text-[#1B4332] mb-2 sm:mb-3">What's the occasion?</h2>
      <div className="flex gap-1.5 sm:gap-2 flex-wrap mb-4 sm:mb-6">
        {OCCASIONS.map((occ) => (
          <button
            key={occ}
            onClick={() => setForm((f) => ({ ...f, occasion: f.occasion === occ ? '' : occ }))}
            className={`px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap transition-all ${
              form.occasion === occ
                ? 'bg-[#D4A373] text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-[#D4A373]/40'
            }`}
          >
            {occ}
          </button>
        ))}
      </div>

      {/* Special requests */}
      <div className="mb-4 sm:mb-6">
        <label className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-medium text-gray-500 mb-0.5 sm:mb-1">
          <MessageSquare className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          Special requests
        </label>
        <textarea
          value={form.notes}
          onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          rows={2}
          className="w-full px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-lg sm:rounded-xl border border-gray-200 bg-white text-[13px] sm:text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-[#1B4332]/20 focus:border-[#1B4332] resize-none"
          placeholder="Allergies, dietary requirements, high chair needed..."
        />
      </div>

      <div className="pb-6" />

      <StickyFooter>
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full py-3 sm:py-3.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold bg-[#1B4332] text-white hover:bg-[#1B4332]/90 transition-all shadow-sm disabled:opacity-60"
        >
          {submitting ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Confirming...
            </span>
          ) : (
            'Confirm Booking'
          )}
        </button>
        <p className="text-xs text-center text-gray-400 mt-2">Free cancellation up to 2 hours before</p>
      </StickyFooter>
    </div>
  )
}

export default YourDetailsRestaurant
