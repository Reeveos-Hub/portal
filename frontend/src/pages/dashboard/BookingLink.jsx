/**
 * Booking Link — styled to match 6-Brand Design - Booking Link.html
 * Link management, booking channels, widget embed, conversion tracking, mobile preview
 */

import { useState } from 'react'
import { Link2, Copy, Check, QrCode, Eye, MousePointer, CalendarCheck, TrendingUp, TrendingDown, Globe, Code, Palette, ExternalLink } from 'lucide-react'
import { useBusiness } from '../../contexts/BusinessContext'

const BookingLink = () => {
  const { business } = useBusiness()
  const [copied, setCopied] = useState(false)
  const [activeChannelTab, setActiveChannelTab] = useState('channels')
  const slug = business?.slug || 'your-business'
  const bookingUrl = `https://rezvo.app/book/${slug}`

  const handleCopy = () => {
    navigator.clipboard.writeText(bookingUrl).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })
  }

  const channels = [
    { name: 'Reserve with Google', icon: 'google', desc: 'Allow clients to book directly from Google Search and Maps. Increase visibility by up to 30%.', connected: false, color: 'bg-red-50' },
    { name: 'Instagram Book Button', icon: 'instagram', desc: 'Add a "Book Now" button to your Instagram profile. Syncs directly with your calendar.', connected: true, color: 'bg-pink-50' },
    { name: 'Facebook Page', icon: 'facebook', desc: 'Turn your Facebook page followers into bookings with an integrated action button.', connected: false, color: 'bg-blue-50' },
    { name: 'WhatsApp Business', icon: 'whatsapp', desc: 'Enable customers to book via WhatsApp with a quick-reply booking link.', connected: false, color: 'bg-green-50' },
  ]

  const BrandIcon = ({ type }) => {
    const icons = {
      google: <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>,
      instagram: <svg className="w-5 h-5" fill="#E4405F" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>,
      facebook: <svg className="w-5 h-5" fill="#1877F2" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>,
      whatsapp: <svg className="w-5 h-5" fill="#25D366" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>,
    }
    return icons[type] || null
  }

  const stats = [
    { label: 'Page Views', value: '1,248', trend: '12%', trendUp: true, sub: 'Last 30 days', icon: 'eye' },
    { label: 'Click Through', value: '42.5%', trend: '3.2%', trendUp: true, sub: 'Avg. session 2m 15s', icon: 'mouse' },
    { label: 'Bookings', value: '156', trend: '8%', trendUp: true, sub: 'Conversion rate 12.5%', icon: 'cal' },
  ]

  const embedCode = `<iframe src="${bookingUrl}" width="100%" height="600" frameborder="0"></iframe>`

  return (
    <div className="space-y-6">
      {/* Booking Link Card */}
      <div className="bg-white rounded-xl border border-border p-6 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-bl-full -mr-12 -mt-12" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-heading font-bold text-lg text-primary">Your Booking Link</h3>
            <span className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-xs font-bold text-green-600">Live</span>
          </div>
          <p className="text-sm text-gray-500 mb-4">Share this link with clients to let them book online. It works on all devices.</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 flex items-center bg-gray-50 border border-gray-200 rounded-full px-4 py-2.5 group hover:border-[#1B4332]/30 transition-colors">
              <Link2 className="w-4 h-4 text-gray-400 mr-3 shrink-0" />
              <a href={bookingUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-[#1B4332] truncate flex-1 hover:underline">{bookingUrl}</a>
            </div>
            <div className="flex gap-2">
              <button onClick={handleCopy} className="bg-[#1B4332] text-white font-bold text-xs px-5 py-2.5 rounded-full shadow-lg shadow-[#1B4332]/20 hover:bg-[#2D6A4F] transition-all flex items-center gap-2" style={{ fontFamily: "'Figtree', sans-serif" }}>
                {copied ? <><Check className="w-4 h-4" /> Copied!</> : <><Copy className="w-4 h-4" /> Copy Link</>}
              </button>
              <button className="bg-white text-[#1B4332] border border-gray-200 font-bold text-sm w-10 h-10 rounded-full hover:bg-gray-50 transition-all shadow-sm flex items-center justify-center">
                <QrCode className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((s, i) => (
          <div key={i} className="bg-white rounded-xl border border-border p-5 shadow-sm">
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{s.label}</p>
                <h3 className="text-2xl font-heading font-bold text-primary mt-1">{s.value}</h3>
              </div>
              <div className="p-2 bg-primary/5 rounded-lg text-primary">{s.icon === 'eye' ? <Eye className="w-4 h-4" /> : s.icon === 'mouse' ? <MousePointer className="w-4 h-4" /> : <CalendarCheck className="w-4 h-4" />}</div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-bold flex items-center gap-1 ${s.trendUp ? 'text-green-600' : 'text-red-500'}`}>
                {s.trendUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />} {s.trend}
              </span>
              <span className="text-xs text-gray-500">{s.sub}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Channels & Widget Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Booking Channels */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.03)] overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center gap-1.5">
              <button onClick={() => setActiveChannelTab('channels')}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                  activeChannelTab === 'channels'
                    ? 'bg-[#1B4332] text-white shadow-lg shadow-[#1B4332]/20'
                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                }`} style={{ fontFamily: "'Figtree', sans-serif" }}>
                <Globe className="w-3.5 h-3.5" />Booking Channels
              </button>
              <button onClick={() => setActiveChannelTab('widget')}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                  activeChannelTab === 'widget'
                    ? 'bg-[#1B4332] text-white shadow-lg shadow-[#1B4332]/20'
                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                }`} style={{ fontFamily: "'Figtree', sans-serif" }}>
                <Code className="w-3.5 h-3.5" />Widget Embed
              </button>
            </div>
          </div>

          {activeChannelTab === 'channels' ? (
            <div className="p-6 space-y-4">
              {channels.map((ch, i) => (
                <div key={i} className="flex items-start gap-4 p-4 rounded-lg border border-border hover:border-primary/30 hover:shadow-sm transition-all">
                  <div className={`w-10 h-10 rounded-lg ${ch.color} flex items-center justify-center shrink-0`}>
                    <BrandIcon type={ch.icon} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-primary">{ch.name}</h4>
                      {ch.connected && <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded border border-green-200">Connected</span>}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{ch.desc}</p>
                  </div>
                  <button className={`text-xs font-bold px-4 py-1.5 rounded-full shrink-0 transition-all ${ch.connected ? 'text-gray-500 bg-gray-100 hover:bg-gray-200' : 'text-white bg-[#1B4332] hover:bg-[#2D6A4F] shadow-lg shadow-[#1B4332]/20'}`}
                    style={{ fontFamily: "'Figtree', sans-serif" }}>
                    {ch.connected ? 'Manage' : 'Connect'}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-500">Add this code to your website to embed a booking widget. It automatically adapts to your site's design.</p>
              <div className="bg-gray-50 border border-border rounded-lg p-4 font-mono text-xs text-primary overflow-x-auto">
                {embedCode}
              </div>
              <div className="flex gap-3">
                <button onClick={() => navigator.clipboard.writeText(embedCode)} className="text-sm font-bold text-primary border border-border px-4 py-2 rounded-lg hover:bg-gray-50 flex items-center gap-2 shadow-sm">
                  <Copy className="w-3.5 h-3.5" /> Copy Code
                </button>
                <button className="text-sm font-bold text-gray-500 border border-border px-4 py-2 rounded-lg hover:bg-gray-50 flex items-center gap-2">
                  <Palette className="w-3.5 h-3.5" /> Customise
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Mobile Preview */}
        <div className="bg-white rounded-xl border border-border p-6 shadow-sm flex flex-col items-center">
          <h3 className="font-heading font-bold text-lg text-primary mb-4 self-start">Mobile Preview</h3>
          <div className="w-[220px] h-[420px] bg-gray-900 rounded-[2rem] p-2 shadow-xl">
            <div className="w-full h-full bg-white rounded-[1.5rem] overflow-hidden flex flex-col">
              <div className="bg-primary p-4 text-center">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2">
                  <CalendarCheck className="w-4 h-4 text-white" />
                </div>
                <h4 className="text-white font-bold text-sm">{business?.name || 'Your Business'}</h4>
                <p className="text-white/70 text-[10px] mt-0.5">Book a table</p>
              </div>
              <div className="flex-1 p-3 space-y-2">
                <div className="bg-gray-50 rounded-lg p-2 text-center">
                  <p className="text-[10px] font-bold text-primary">Party Size</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-2 text-center">
                  <p className="text-[10px] font-bold text-primary">Pick a Date</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-2 text-center">
                  <p className="text-[10px] font-bold text-primary">Select Time Slot</p>
                </div>
                <div className="mt-auto">
                  <div className="bg-primary rounded-lg py-2 text-center">
                    <span className="text-white font-bold text-[10px]">Confirm Booking</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <button className="mt-4 text-sm font-bold text-primary hover:underline flex items-center gap-2">
            <ExternalLink className="w-3.5 h-3.5" /> Open Full Preview
          </button>
        </div>
      </div>
    </div>
  )
}

export default BookingLink
