/**
 * Marketing — Email campaigns, SMS, promotions (Growth+ tier)
 */

import { useState } from 'react'

const CAMPAIGNS = [
  { id: 1, name: 'Welcome Series', type: 'Email', status: 'active', sent: 245, opened: '68%', clicked: '24%', date: 'Running since Oct 1' },
  { id: 2, name: 'Monthly Newsletter', type: 'Email', status: 'draft', sent: 0, opened: '—', clicked: '—', date: 'Draft' },
  { id: 3, name: 'No-Show Reminder', type: 'SMS', status: 'active', sent: 34, opened: '92%', clicked: '—', date: 'Running since Sep 15' },
  { id: 4, name: 'Birthday Offer', type: 'Email', status: 'paused', sent: 120, opened: '72%', clicked: '31%', date: 'Paused Oct 10' },
]

const TEMPLATES = [
  { icon: 'fa-gift', title: 'Birthday Offer', desc: 'Send personalised birthday discounts' },
  { icon: 'fa-clock-rotate-left', title: 'Win-Back', desc: 'Re-engage inactive clients' },
  { icon: 'fa-star', title: 'Review Request', desc: 'Ask for reviews after visits' },
  { icon: 'fa-calendar-plus', title: 'Rebooking Nudge', desc: 'Remind clients to rebook' },
]

const Marketing = () => {
  const [tab, setTab] = useState('campaigns')

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Emails Sent', value: '1,245', icon: 'fa-envelope', bg: 'bg-primary/5 text-primary' },
          { label: 'Open Rate', value: '68.3%', icon: 'fa-envelope-open', bg: 'bg-green-100 text-green-600' },
          { label: 'Revenue Generated', value: '£840', icon: 'fa-sterling-sign', bg: 'bg-amber-100 text-amber-600' },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-xl border border-border p-5 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{s.label}</p>
                <h3 className="text-2xl font-heading font-bold text-primary mt-1">{s.value}</h3>
              </div>
              <div className={`p-2 rounded-lg ${s.bg}`}><i className={`fa-solid ${s.icon}`} /></div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <nav className="-mb-px flex space-x-8">
          {['campaigns', 'templates', 'automations'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-bold text-sm capitalize transition-colors ${tab === t ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-primary'}`}>
              {t}
            </button>
          ))}
        </nav>
      </div>

      {tab === 'campaigns' && (
        <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-gray-50 border-b border-border text-xs uppercase tracking-wider text-gray-500 font-bold">
                  <th className="px-6 py-3">Campaign</th>
                  <th className="px-6 py-3">Type</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Sent</th>
                  <th className="px-6 py-3">Opened</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-sm">
                {CAMPAIGNS.map(c => (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4"><div className="font-bold text-primary">{c.name}</div><div className="text-xs text-gray-500">{c.date}</div></td>
                    <td className="px-6 py-4 text-gray-500">{c.type}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-bold border ${
                        c.status === 'active' ? 'bg-green-50 text-green-700 border-green-200' :
                        c.status === 'paused' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        'bg-gray-100 text-gray-500 border-gray-200'}`}>{c.status.charAt(0).toUpperCase() + c.status.slice(1)}</span>
                    </td>
                    <td className="px-6 py-4 font-bold text-primary">{c.sent}</td>
                    <td className="px-6 py-4 text-gray-500">{c.opened}</td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-gray-400 hover:text-primary p-1"><i className="fa-solid fa-pen text-xs" /></button>
                      <button className="text-gray-400 hover:text-red-500 p-1 ml-2"><i className="fa-solid fa-trash text-xs" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'templates' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {TEMPLATES.map((t, i) => (
            <button key={i} className="bg-white rounded-xl border border-border p-5 shadow-sm hover:shadow-md hover:border-primary/30 transition-all text-left group">
              <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <i className={`fa-solid ${t.icon}`} />
              </div>
              <h4 className="font-bold text-sm text-primary mb-1">{t.title}</h4>
              <p className="text-xs text-gray-500">{t.desc}</p>
            </button>
          ))}
        </div>
      )}

      {tab === 'automations' && (
        <div className="bg-white rounded-xl border border-border p-12 shadow-sm text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fa-solid fa-wand-magic-sparkles text-gray-400 text-xl" />
          </div>
          <h3 className="font-heading font-bold text-lg text-primary mb-2">AI Automations Coming Soon</h3>
          <p className="text-sm text-gray-500 max-w-md mx-auto">Automated follow-ups, smart rebooking suggestions, and AI-written campaigns — all powered by Rezvo AI.</p>
        </div>
      )}
    </div>
  )
}

export default Marketing
