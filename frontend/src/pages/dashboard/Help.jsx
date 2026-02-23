/**
 * Help Center — styled to match 10-Brand Design - Settings & Help.html
 * FAQ accordion, setup guides, contact form, knowledge base search
 */

import { useState } from 'react'

const FAQS = [
  { q: 'How do I set up online bookings?', a: 'Navigate to Settings > Online Booking to configure your booking page. You can customise your services, staff availability, and booking rules. Once enabled, share your booking link with clients or embed it on your website.' },
  { q: 'How do deposits work?', a: 'When enabled, clients are required to pay a deposit when booking. The deposit is automatically deducted from the final bill. You can configure the deposit percentage and minimum threshold in Settings > Payments.' },
  { q: 'Can I connect my Google Business profile?', a: 'Yes! Go to Booking Link > Booking Channels and click "Connect" next to Reserve with Google. This allows clients to book directly from Google Search and Maps.' },
  { q: 'How do I manage staff availability?', a: 'Go to Settings > Team Permissions to add staff members. Each staff member can set their own working hours and services they offer. You can also manage this from the Calendar view.' },
  { q: 'What payment methods are supported?', a: 'Rezvo uses Stripe Connect to process payments. This supports all major credit/debit cards (Visa, Mastercard, Amex), Apple Pay, and Google Pay. Payouts are sent directly to your bank account.' },
  { q: 'How do I handle no-shows?', a: 'Enable No-Show Protection in Payments > Settings. This captures card details at booking time and allows you to charge a cancellation fee for late cancellations or no-shows.' },
  { q: 'Can I import my existing client list?', a: 'Yes, you can import clients via CSV from the Clients page. Click the "Import" button and follow the steps to map your columns. We support bulk imports of up to 10,000 clients.' },
  { q: 'How do I customise my booking page?', a: 'Go to Online Booking settings to upload your logo, cover image, and set your accent colour. You can also write a short business description that appears on your booking page.' },
]

const GUIDES = [
  { icon: 'fa-rocket', title: 'Getting Started', desc: 'Set up your business in 5 minutes', color: 'bg-primary/10 text-primary' },
  { icon: 'fa-credit-card', title: 'Payment Setup', desc: 'Connect Stripe and configure deposits', color: 'bg-purple-100 text-purple-600' },
  { icon: 'fa-calendar-check', title: 'Booking Rules', desc: 'Configure availability and policies', color: 'bg-blue-100 text-blue-600' },
  { icon: 'fa-users', title: 'Team Management', desc: 'Add staff and set permissions', color: 'bg-amber-100 text-amber-600' },
  { icon: 'fa-chart-line', title: 'Analytics Guide', desc: 'Understand your business metrics', color: 'bg-green-100 text-green-600' },
  { icon: 'fa-globe', title: 'Online Presence', desc: 'Connect Google, Instagram & more', color: 'bg-pink-100 text-pink-600' },
]

const Help = () => {
  const [openFaq, setOpenFaq] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [contactForm, setContactForm] = useState({ subject: '', message: '' })

  const filteredFaqs = searchQuery
    ? FAQS.filter(f => f.q.toLowerCase().includes(searchQuery.toLowerCase()) || f.a.toLowerCase().includes(searchQuery.toLowerCase()))
    : FAQS

  return (
    <div className="space-y-8">
      {/* Hero Search */}
      <div className="bg-primary rounded-xl p-8 text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-bl-full -mr-12 -mt-12" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-tr-full -ml-8 -mb-8" />
        <div className="relative z-10">
          <h2 className="font-heading font-bold text-2xl text-white mb-2">How can we help?</h2>
          <p className="text-white/70 text-sm mb-6">Search our knowledge base or browse the guides below.</p>
          <div className="max-w-md mx-auto relative">
            <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text" placeholder="Search for help..."
              value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-lg text-sm font-medium text-primary focus:ring-2 focus:ring-white/30 outline-none shadow-lg"
            />
          </div>
        </div>
      </div>

      {/* Quick Setup Guides */}
      <div>
        <h3 className="font-heading font-bold text-lg text-primary mb-4">Setup Guides</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {GUIDES.map((g, i) => (
            <button key={i} className="bg-white rounded-xl border border-border p-5 shadow-sm hover:shadow-md hover:border-primary/30 transition-all text-left group">
              <div className={`w-10 h-10 rounded-lg ${g.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                <i className={`fa-solid ${g.icon}`} />
              </div>
              <h4 className="font-bold text-sm text-primary mb-1">{g.title}</h4>
              <p className="text-xs text-gray-500">{g.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* FAQ Section */}
      <div>
        <h3 className="font-heading font-bold text-lg text-primary mb-4">Frequently Asked Questions</h3>
        <div className="bg-white rounded-xl border border-border shadow-sm divide-y divide-border overflow-hidden">
          {filteredFaqs.map((faq, i) => (
            <div key={i}>
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition-colors"
              >
                <span className="text-sm font-bold text-primary pr-4">{faq.q}</span>
                <i className={`fa-solid ${openFaq === i ? 'fa-chevron-up' : 'fa-chevron-down'} text-xs text-gray-400 shrink-0 transition-transform`} />
              </button>
              {openFaq === i && (
                <div className="px-6 pb-4">
                  <p className="text-sm text-gray-600 leading-relaxed">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
          {filteredFaqs.length === 0 && (
            <div className="px-6 py-8 text-center">
              <i className="fa-solid fa-magnifying-glass text-gray-400 text-2xl mb-3" />
              <p className="text-sm text-gray-500">No results found for "{searchQuery}"</p>
            </div>
          )}
        </div>
      </div>

      {/* Contact Support */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-border p-6 shadow-sm">
          <h3 className="font-heading font-bold text-lg text-primary mb-4">Contact Support</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-primary mb-1.5">Subject</label>
              <input
                type="text" value={contactForm.subject} onChange={e => setContactForm(f => ({ ...f, subject: e.target.value }))}
                placeholder="What do you need help with?"
                className="w-full px-3 py-2.5 border border-border rounded-lg text-sm font-medium text-primary focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-primary mb-1.5">Message</label>
              <textarea
                rows="4" value={contactForm.message} onChange={e => setContactForm(f => ({ ...f, message: e.target.value }))}
                placeholder="Describe your issue in detail..."
                className="w-full px-3 py-2.5 border border-border rounded-lg text-sm font-medium text-primary focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none"
              />
            </div>
            <button className="bg-primary text-white font-bold text-sm px-6 py-2.5 rounded-lg shadow-lg hover:bg-primary-hover transition-colors flex items-center gap-2">
              <i className="fa-solid fa-paper-plane" /> Send Message
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-border p-6 shadow-sm">
            <div className="flex items-center gap-4 mb-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center"><i className="fa-solid fa-comments" /></div>
              <div>
                <h4 className="font-bold text-sm text-primary">Live Chat</h4>
                <p className="text-xs text-gray-500">Chat with our support team</p>
              </div>
            </div>
            <p className="text-sm text-gray-500 mb-3">Available Mon-Fri, 9am-6pm GMT. Average response time: 2 minutes.</p>
            <button className="text-sm font-bold text-primary border border-border px-4 py-2 rounded-lg hover:bg-gray-50 flex items-center gap-2 shadow-sm">
              <i className="fa-solid fa-message" /> Start Chat
            </button>
          </div>
          <div className="bg-white rounded-xl border border-border p-6 shadow-sm">
            <div className="flex items-center gap-4 mb-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center"><i className="fa-solid fa-video" /></div>
              <div>
                <h4 className="font-bold text-sm text-primary">Video Tutorials</h4>
                <p className="text-xs text-gray-500">Watch step-by-step guides</p>
              </div>
            </div>
            <p className="text-sm text-gray-500 mb-3">Over 20 video tutorials covering every feature of Rezvo.</p>
            <button className="text-sm font-bold text-primary border border-border px-4 py-2 rounded-lg hover:bg-gray-50 flex items-center gap-2 shadow-sm">
              <i className="fa-solid fa-play" /> Watch Tutorials
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Help
