/**
 * Reviews — Customer reviews & reputation management
 */

import { useState } from 'react'
import { useBusiness } from '../../contexts/BusinessContext'

const DEMO_REVIEWS = [
  { id: 1, name: 'Emma S.', rating: 5, date: '2 days ago', text: 'Absolutely brilliant experience! Sarah did an amazing job with my colour. The salon is gorgeous and the team are so welcoming.', service: 'Full Head Colour', replied: true, source: 'Rezvo' },
  { id: 2, name: 'James R.', rating: 4, date: '1 week ago', text: 'Great cut as always. Only took off a star because the wait was a bit longer than expected.', service: "Men's Cut", replied: false, source: 'Google' },
  { id: 3, name: 'Anna L.', rating: 5, date: '2 weeks ago', text: 'First time here and I am SO impressed. Will definitely be coming back!', service: 'Ladies Cut & Blow Dry', replied: true, source: 'Rezvo' },
  { id: 4, name: 'Mike T.', rating: 3, date: '3 weeks ago', text: 'Decent haircut but the booking system was a bit confusing at first.', service: "Men's Cut", replied: false, source: 'Google' },
]

const Reviews = () => {
  const { isDemo } = useBusiness()
  const [filter, setFilter] = useState('all')

  const avgRating = (DEMO_REVIEWS.reduce((a, r) => a + r.rating, 0) / DEMO_REVIEWS.length).toFixed(1)
  const filtered = filter === 'all' ? DEMO_REVIEWS : DEMO_REVIEWS.filter(r => filter === 'unreplied' ? !r.replied : r.rating === parseInt(filter))

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-border p-5 shadow-sm text-center">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Average Rating</p>
          <div className="flex items-center justify-center gap-2 mt-2">
            <span className="text-3xl font-heading font-bold text-primary">{avgRating}</span>
            <div className="flex text-amber-400 text-sm">
              {[1,2,3,4,5].map(s => <i key={s} className={`fa-solid fa-star ${s <= Math.round(avgRating) ? '' : 'opacity-30'}`} />)}
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-border p-5 shadow-sm text-center">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Reviews</p>
          <h3 className="text-3xl font-heading font-bold text-primary mt-2">{DEMO_REVIEWS.length}</h3>
        </div>
        <div className="bg-white rounded-xl border border-border p-5 shadow-sm text-center">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Reply Rate</p>
          <h3 className="text-3xl font-heading font-bold text-green-600 mt-2">{Math.round((DEMO_REVIEWS.filter(r => r.replied).length / DEMO_REVIEWS.length) * 100)}%</h3>
        </div>
        <div className="bg-white rounded-xl border border-border p-5 shadow-sm text-center">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">5-Star %</p>
          <h3 className="text-3xl font-heading font-bold text-primary mt-2">{Math.round((DEMO_REVIEWS.filter(r => r.rating === 5).length / DEMO_REVIEWS.length) * 100)}%</h3>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {['all', 'unreplied', '5', '4', '3', '2', '1'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 text-xs font-bold rounded-full whitespace-nowrap border transition-colors ${filter === f ? 'bg-primary text-white border-primary' : 'bg-white text-gray-500 border-border hover:border-primary hover:text-primary'}`}>
            {f === 'all' ? 'All Reviews' : f === 'unreplied' ? 'Needs Reply' : `${f} Stars`}
          </button>
        ))}
      </div>

      {/* Review Cards */}
      <div className="space-y-4">
        {filtered.map(r => (
          <div key={r.id} className="bg-white rounded-xl border border-border p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm border border-primary/20">
                  {r.name.split(' ').map(w => w[0]).join('')}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm text-primary">{r.name}</h4>
                    <span className="text-xs text-gray-500">• {r.date}</span>
                    <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{r.source}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <div className="flex text-amber-400 text-xs">{[1,2,3,4,5].map(s => <i key={s} className={`fa-solid fa-star ${s <= r.rating ? '' : 'opacity-30'}`} />)}</div>
                    <span className="text-xs text-gray-500">• {r.service}</span>
                  </div>
                </div>
              </div>
              {r.replied ? (
                <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded border border-green-200"><i className="fa-solid fa-check mr-1" />Replied</span>
              ) : (
                <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-200">Awaiting Reply</span>
              )}
            </div>
            <p className="text-sm text-gray-700 leading-relaxed mb-3">{r.text}</p>
            {!r.replied && (
              <button className="text-sm font-bold text-primary border border-border px-4 py-2 rounded-lg hover:bg-gray-50 flex items-center gap-2 shadow-sm">
                <i className="fa-solid fa-reply" /> Reply
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default Reviews
