/**
 * GhostPost Dashboard — Admin/CC page
 * Polls GhostPost server results API for analytics.
 * Shows: overview stats, conversion funnel, campaigns, hot leads, activity feed.
 */
import { useState, useEffect, useCallback } from 'react'
import {
  Radio, Send, MessageSquare, Users, Target, TrendingUp,
  RefreshCw, ArrowRight, Clock, CheckCircle2, XCircle,
  Zap, Eye, BarChart3, Activity, Filter, AlertTriangle
} from 'lucide-react'

// GhostPost server — direct connection
const GP_URL = import.meta.env.VITE_GHOSTPOST_URL || 'http://78.111.89.140'

const gpApi = async (path) => {
  try {
    const res = await fetch(`${GP_URL}/api${path}`)
    if (!res.ok) return null
    return await res.json()
  } catch (e) {
    console.warn('[GhostPost] API error:', e.message)
    return null
  }
}

// ── Stat card ──
const Stat = ({ label, value, icon: Icon, sub, color = '#C9A84C' }) => (
  <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
    <div className="flex items-center justify-between mb-3">
      <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${color}18` }}>
        <Icon size={16} style={{ color }} />
      </div>
    </div>
    <p className="text-2xl font-bold text-white">{value ?? '—'}</p>
    <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    {sub && <p className="text-[10px] text-gray-600 mt-1">{sub}</p>}
  </div>
)

// ── Funnel bar ──
const FunnelBar = ({ label, value, total, color }) => {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-500 w-20 text-right">{label}</span>
      <div className="flex-1 h-6 bg-gray-800 rounded-md overflow-hidden relative">
        <div className="h-full rounded-md transition-all duration-700" style={{ width: `${Math.max(pct, 2)}%`, background: color }} />
        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold text-white/80">
          {value} ({pct}%)
        </span>
      </div>
    </div>
  )
}

// ── Activity row ──
const ActivityRow = ({ item }) => {
  const icons = {
    dm_sent: { icon: Send, color: '#3b82f6', label: 'DM Sent' },
    reply_posted: { icon: MessageSquare, color: '#22c55e', label: 'Reply Posted' },
    draft_generated: { icon: Zap, color: '#C9A84C', label: 'Draft Generated' },
  }
  const cfg = icons[item.type] || { icon: Activity, color: '#666', label: item.type }
  const Icon = cfg.icon
  const time = item.timestamp ? new Date(item.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : ''
  const date = item.timestamp ? new Date(item.timestamp).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : ''

  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-gray-800/50 last:border-0">
      <div className="w-7 h-7 rounded-md flex items-center justify-center shrink-0 mt-0.5" style={{ background: `${cfg.color}15` }}>
        <Icon size={13} style={{ color: cfg.color }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-300 truncate">
          <span className="text-gray-500">{cfg.label}</span>
          {item.target && <> → <span className="text-white font-medium">@{item.target}</span></>}
        </p>
        {item.detail && <p className="text-xs text-gray-600 truncate mt-0.5">{item.detail}</p>}
      </div>
      <div className="text-right shrink-0">
        <p className="text-[10px] text-gray-600">{date}</p>
        <p className="text-[10px] text-gray-600">{time}</p>
      </div>
    </div>
  )
}

// ── Campaign card ──
const CampaignCard = ({ c }) => {
  const replyRate = c.reply_rate ? `${c.reply_rate}%` : '0%'
  const statusColors = { active: '#22c55e', draft: '#C9A84C', paused: '#f59e0b', completed: '#6b7280' }
  const color = statusColors[c.status] || '#666'

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-all">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-white truncate flex-1">{c.name}</h3>
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full ml-2" style={{ background: `${color}20`, color }}>
          {c.status}
        </span>
      </div>
      <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
        <span className="capitalize">{c.platform}</span>
        <span>·</span>
        <span>@{c.account_username || 'unknown'}</span>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {[
          { l: 'Leads', v: c.total_leads },
          { l: 'Sent', v: c.sent },
          { l: 'Replied', v: c.replied },
          { l: 'Rate', v: replyRate },
        ].map(s => (
          <div key={s.l} className="text-center">
            <p className="text-sm font-bold text-white">{s.v ?? 0}</p>
            <p className="text-[9px] text-gray-600">{s.l}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Lead row ──
const LeadRow = ({ lead }) => {
  const statusColors = {
    replied: '#22c55e', dm_sent: '#3b82f6', queued: '#666',
    converted: '#C9A84C', skipped: '#999', failed: '#ef4444'
  }
  const color = statusColors[lead.status] || '#666'
  const time = lead.replied_at || lead.dm_sent_at
  const timeStr = time ? new Date(time).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : ''

  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-gray-800/50 last:border-0">
      <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-xs font-semibold text-gray-400">
        {(lead.username || '??')[0].toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">@{lead.username}</p>
        <p className="text-xs text-gray-600 truncate">{lead.campaign_name || lead.dojo_vertical || lead.platform}</p>
      </div>
      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: `${color}20`, color }}>
        {lead.status}
      </span>
      <span className="text-[10px] text-gray-600 w-16 text-right">{timeStr}</span>
    </div>
  )
}

// ═══════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════

export default function AdminGhostPost() {
  const [overview, setOverview] = useState(null)
  const [funnel, setFunnel] = useState(null)
  const [campaigns, setCampaigns] = useState([])
  const [hotLeads, setHotLeads] = useState([])
  const [activity, setActivity] = useState([])
  const [loading, setLoading] = useState(true)
  const [connected, setConnected] = useState(false)
  const [lastRefresh, setLastRefresh] = useState(null)

  const loadAll = useCallback(async () => {
    setLoading(true)
    const [ov, fn, cp, hl, ac] = await Promise.all([
      gpApi('/results/overview'),
      gpApi('/results/conversion-funnel'),
      gpApi('/results/campaigns'),
      gpApi('/results/leads/hot'),
      gpApi('/results/activity'),
    ])

    setConnected(!!(ov && ov.timestamp))
    if (ov) setOverview(ov)
    if (fn) setFunnel(fn.funnel)
    if (cp) setCampaigns(cp.campaigns || [])
    if (hl) setHotLeads(hl.leads || [])
    if (ac) setActivity(ac.activity || [])
    setLoading(false)
    setLastRefresh(new Date())
  }, [])

  useEffect(() => {
    loadAll()
    const iv = setInterval(loadAll, 60000) // refresh every minute
    return () => clearInterval(iv)
  }, [loadAll])

  const o = overview?.outreach || {}
  const t = overview?.twitter || {}
  const l = overview?.learning || {}

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #C9A84C, #8B6914)' }}>
            <span className="text-white font-extrabold text-sm">G</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">GhostPost</h1>
            <p className="text-xs text-gray-500">Autonomous social outreach engine</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-500' : 'bg-red-500'}`} style={connected ? { animation: 'pulse 2s infinite' } : {}} />
            <span className="text-xs font-medium" style={{ color: connected ? '#22c55e' : '#ef4444' }}>
              {connected ? 'Connected' : 'Offline'}
            </span>
          </div>
          <button onClick={loadAll} disabled={loading} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-white transition-colors bg-gray-900 border border-gray-800 rounded-lg px-3 py-1.5">
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          {lastRefresh && <span className="text-[10px] text-gray-600">{lastRefresh.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span>}
        </div>
      </div>

      {!connected && !loading && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle size={16} className="text-red-400 shrink-0" />
          <p className="text-sm text-red-300">Cannot reach GhostPost server at {GP_URL}. Check the server is running.</p>
        </div>
      )}

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <Stat label="DMs Sent" value={o.total_dms_sent} icon={Send} sub={`${o.dms_today || 0} today`} color="#3b82f6" />
        <Stat label="Replies Received" value={o.total_replies} icon={MessageSquare} sub={`${o.replies_this_week || 0} this week`} color="#22c55e" />
        <Stat label="Conversions" value={o.total_conversions} icon={Target} color="#C9A84C" />
        <Stat label="Active Campaigns" value={o.active_campaigns} icon={Radio} color="#8b5cf6" />
        <Stat label="Tweets Scanned" value={t.tweets_scanned} icon={Eye} sub={`${t.opportunities_found || 0} opportunities`} color="#f59e0b" />
        <Stat label="Patterns Learned" value={l.active_patterns} icon={Zap} sub={`${l.conversations_watched || 0} conversations`} color="#C9A84C" />
      </div>

      {/* Two columns */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Left: Funnel + Campaigns */}
        <div className="lg:col-span-2 space-y-4">
          {/* Conversion Funnel */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <BarChart3 size={14} style={{ color: '#C9A84C' }} />
              Conversion Funnel
            </h2>
            {funnel ? (
              <div className="space-y-2.5">
                <FunnelBar label="Leads" value={funnel.leads} total={funnel.leads} color="#6b7280" />
                <FunnelBar label="Contacted" value={funnel.contacted} total={funnel.leads} color="#3b82f6" />
                <FunnelBar label="Replied" value={funnel.replied} total={funnel.leads} color="#22c55e" />
                <FunnelBar label="Converted" value={funnel.converted} total={funnel.leads} color="#C9A84C" />
                <div className="flex gap-4 mt-3 pt-3 border-t border-gray-800">
                  <span className="text-xs text-gray-500">Contact rate: <span className="text-white font-medium">{funnel.contactRate}%</span></span>
                  <span className="text-xs text-gray-500">Reply rate: <span className="text-white font-medium">{funnel.replyRate}%</span></span>
                  <span className="text-xs text-gray-500">Conversion: <span className="text-white font-medium">{funnel.conversionRate}%</span></span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-600">No funnel data yet</p>
            )}
          </div>

          {/* Campaigns */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <Radio size={14} style={{ color: '#C9A84C' }} />
              Campaigns
              <span className="text-[10px] text-gray-600 ml-auto">{campaigns.length} total</span>
            </h2>
            {campaigns.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-3">
                {campaigns.map(c => <CampaignCard key={c.id} c={c} />)}
              </div>
            ) : (
              <p className="text-xs text-gray-600">No campaigns yet</p>
            )}
          </div>
        </div>

        {/* Right: Hot Leads + Activity */}
        <div className="space-y-4">
          {/* Hot Leads */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <AlertTriangle size={14} style={{ color: '#f59e0b' }} />
              Needs Attention
              {hotLeads.length > 0 && <span className="ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400">{hotLeads.length}</span>}
            </h2>
            {hotLeads.length > 0 ? (
              <div className="max-h-[280px] overflow-y-auto">
                {hotLeads.map(l => <LeadRow key={l.id} lead={l} />)}
              </div>
            ) : (
              <p className="text-xs text-gray-600">No leads need attention right now</p>
            )}
          </div>

          {/* Activity Feed */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <Activity size={14} style={{ color: '#C9A84C' }} />
              Recent Activity
            </h2>
            {activity.length > 0 ? (
              <div className="max-h-[400px] overflow-y-auto">
                {activity.map((a, i) => <ActivityRow key={i} item={a} />)}
              </div>
            ) : (
              <p className="text-xs text-gray-600">No activity yet — start a campaign or trigger a harvest</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
