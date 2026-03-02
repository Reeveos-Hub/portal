import { useState, useEffect, useCallback } from 'react'
import { useBusiness } from '../../contexts/BusinessContext'
import api from '../../utils/api'
import { Star, MessageSquare, Send, Inbox, RefreshCw } from 'lucide-react'

const Reviews = () => {
  const { business } = useBusiness()
  const bid = business?.id ?? business?._id
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [replyingTo, setReplyingTo] = useState(null)
  const [replyText, setReplyText] = useState('')
  const [sendingReply, setSendingReply] = useState(false)

  const loadReviews = useCallback(async () => {
    if (!bid) return
    try {
      setLoading(true)
      const res = await api.get(`/reviews/business/${bid}?limit=100`)
      setReviews(res.results || [])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [bid])

  useEffect(() => { loadReviews() }, [loadReviews])

  const submitReply = async (reviewId) => {
    if (!replyText.trim()) return
    setSendingReply(true)
    try {
      await api.patch(`/reviews/${reviewId}/reply?owner_reply=${encodeURIComponent(replyText.trim())}`)
      setReviews(prev => prev.map(r => (r._id === reviewId) ? { ...r, owner_reply: replyText.trim(), replied_at: new Date().toISOString() } : r))
      setReplyingTo(null); setReplyText('')
    } catch (e) { console.error(e) }
    finally { setSendingReply(false) }
  }

  const total = reviews.length
  const avgRating = total > 0 ? (reviews.reduce((a,r) => a + (r.rating||0), 0) / total).toFixed(1) : '0.0'
  const replyRate = total > 0 ? Math.round((reviews.filter(r => r.owner_reply).length / total) * 100) : 0
  const fiveStarPct = total > 0 ? Math.round((reviews.filter(r => r.rating === 5).length / total) * 100) : 0

  const filtered = reviews.filter(r => {
    if (filter === 'all') return true
    if (filter === 'unreplied') return !r.owner_reply
    return r.rating === parseInt(filter)
  })

  const fmtDate = (iso) => {
    if (!iso) return ''
    const d = new Date(iso), now = new Date(), diff = Math.floor((now-d)/(1000*60*60*24))
    if (diff === 0) return 'Today'; if (diff === 1) return 'Yesterday'
    if (diff < 7) return diff+' days ago'; if (diff < 30) return Math.floor(diff/7)+' weeks ago'
    return d.toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})
  }
  const initials = (n) => n ? n.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2) : '??'

  const StarDisplay = ({rating}) => (<div className="flex text-amber-400 text-xs gap-0.5">{[1,2,3,4,5].map(s => <Star key={s} size={12} fill={s<=rating?'currentColor':'none'} className={s<=rating?'':'opacity-30'} />)}</div>)

  if (loading && !reviews.length) return (<div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-2 border-gray-200 border-t-[#111111] rounded-full" /></div>)

  return (
    <div className="space-y-6" style={{fontFamily:"'Figtree',sans-serif"}}>
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-[0_2px_10px_rgba(0,0,0,0.03)] text-center">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Average Rating</p>
          <div className="flex items-center justify-center gap-2 mt-2"><span className="text-3xl font-extrabold text-gray-900">{avgRating}</span><StarDisplay rating={Math.round(parseFloat(avgRating))} /></div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-[0_2px_10px_rgba(0,0,0,0.03)] text-center">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Reviews</p>
          <h3 className="text-3xl font-extrabold text-gray-900 mt-2">{total}</h3>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-[0_2px_10px_rgba(0,0,0,0.03)] text-center">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Reply Rate</p>
          <h3 className="text-3xl font-extrabold text-emerald-600 mt-2">{replyRate}%</h3>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-[0_2px_10px_rgba(0,0,0,0.03)] text-center">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">5-Star %</p>
          <h3 className="text-3xl font-extrabold text-gray-900 mt-2">{fiveStarPct}%</h3>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {[{key:'all',label:'All Reviews'},{key:'unreplied',label:'Needs Reply'},{key:'5',label:'5 Stars'},{key:'4',label:'4 Stars'},{key:'3',label:'3 Stars'},{key:'2',label:'2 Stars'},{key:'1',label:'1 Star'}].map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)} className={`px-4 py-1.5 text-xs font-bold rounded-full whitespace-nowrap transition-all ${filter === f.key ? 'bg-[#111111] text-white shadow-lg shadow-[#111111]/20' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}>{f.label}</button>
          ))}
        </div>
        <button onClick={loadReviews} className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"><RefreshCw size={16} className={loading ? 'animate-spin' : ''} /></button>
      </div>
      {filtered.length === 0 && !loading && (<div className="flex flex-col items-center justify-center py-20 text-center"><Inbox size={48} className="text-gray-200 mb-4" /><p className="text-sm font-bold text-gray-400">No reviews yet</p></div>)}
      <div className="space-y-4">
        {filtered.map(r => (
          <div key={r._id} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-[0_2px_10px_rgba(0,0,0,0.03)] hover:shadow-[0_10px_30px_-5px_rgba(17,17,17,0.08)] transition-all">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#111111]/5 flex items-center justify-center text-[#111111] font-bold text-sm border border-[#111111]/10">{initials(r.user_name||r.customer_name||'Guest')}</div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm text-gray-900">{r.user_name||r.customer_name||'Guest'}</h4>
                    <span className="text-xs text-gray-400">{fmtDate(r.created_at)}</span>
                    {r.source && <span className="text-[9px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{r.source}</span>}
                  </div>
                  <StarDisplay rating={r.rating} />
                </div>
              </div>
              {r.owner_reply ? <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">Replied</span> : <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">Awaiting Reply</span>}
            </div>
            {r.body && <p className="text-sm text-gray-700 leading-relaxed mb-3">{r.body}</p>}
            {r.owner_reply && (<div className="bg-gray-50 rounded-xl p-4 mb-3 border border-gray-100"><p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Your Reply</p><p className="text-sm text-gray-600">{r.owner_reply}</p></div>)}
            {!r.owner_reply && replyingTo === r._id && (
              <div className="flex gap-2 mb-3">
                <input value={replyText} onChange={e => setReplyText(e.target.value)} onKeyDown={e => e.key === 'Enter' && submitReply(r._id)} placeholder="Write your reply..." className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#111111]" autoFocus />
                <button onClick={() => submitReply(r._id)} disabled={sendingReply||!replyText.trim()} className="px-4 py-2.5 rounded-xl bg-[#111111] text-white text-xs font-bold hover:bg-[#1a1a1a] disabled:opacity-50 flex items-center gap-1.5"><Send size={12} /> {sendingReply ? '...' : 'Send'}</button>
                <button onClick={() => {setReplyingTo(null);setReplyText('')}} className="px-3 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-400 hover:bg-gray-50">Cancel</button>
              </div>
            )}
            {!r.owner_reply && replyingTo !== r._id && (
              <button onClick={() => {setReplyingTo(r._id);setReplyText('')}} className="text-xs font-bold text-[#111111] border border-gray-200 px-4 py-2 rounded-xl hover:bg-gray-50 flex items-center gap-1.5 shadow-sm"><MessageSquare size={12} /> Reply</button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default Reviews
