import { adminPath } from '../../utils/domain'
// Admin placeholder page template
// Each section gets a proper shell with description and "coming soon" state

import { useNavigate } from 'react-router-dom'
import {
  TrendingUp, Building2, CalendarCheck, Users, CreditCard, Search,
  MessageSquare, Star, AlertTriangle, Megaphone, Globe, FileText,
  BarChart3, Activity, ScrollText, Bug, Settings, ArrowLeft, Construction
} from 'lucide-react'

const SECTIONS = {
  pipeline: { icon: TrendingUp, title: 'Sales Pipeline', desc: 'Track leads from discovery to conversion. AI-scored prospects, outreach history, deal stages, and conversion analytics.', color: 'blue' },
  businesses: { icon: Building2, title: 'Businesses', desc: 'Manage all registered businesses. View onboarding status, tier, activity, bookings, and revenue per business.', color: 'amber' },
  bookings: { icon: CalendarCheck, title: 'All Bookings', desc: 'Platform-wide booking view. Filter by business, date, status. Spot trends, no-shows, and peak times.', color: 'purple' },
  users: { icon: Users, title: 'Users & Accounts', desc: 'All user accounts across the platform. Owners, staff, and diners. Login history, permissions, and account health.', color: 'cyan' },
  subscriptions: { icon: CreditCard, title: 'Subscriptions', desc: 'Stripe Connect billing overview. MRR tracking, plan distribution, failed payments, dunning status, and churn.', color: 'emerald' },
  directory: { icon: Search, title: 'Directory Management', desc: 'Google Places pre-population. Unclaimed listings, claim requests, directory SEO, and the growth flywheel pipeline.', color: 'teal' },
  support: { icon: MessageSquare, title: 'Support Tickets', desc: 'AI-triaged support queue. Auto-classified by urgency and topic. Chatbot escalations and response time tracking.', color: 'orange' },
  reviews: { icon: Star, title: 'Reviews & Moderation', desc: 'Platform review moderation. AI sentiment analysis, flagged content, response suggestions, and reputation trends.', color: 'yellow' },
  churn: { icon: AlertTriangle, title: 'Churn Risk', desc: 'Churn prediction scores for every business. Six-signal scoring model, automated save campaigns, and win-back tracking.', color: 'red' },
  'email-marketing': { icon: Megaphone, title: 'Email Marketing', desc: 'Campaign Monitor-style email marketing. Templates, automations, A/B testing, audience segments, and analytics.', color: 'pink' },
  seo: { icon: Globe, title: 'SEO Pages', desc: 'Programmatic SEO page generator. City × cuisine pages, schema markup, indexing status, and search performance.', color: 'sky' },
  content: { icon: FileText, title: 'Content Engine', desc: 'AI content generation. Blog posts, social media, restaurant profiles, and marketing copy — all automated.', color: 'indigo' },
  analytics: { icon: BarChart3, title: 'Platform Analytics', desc: 'Top-level platform metrics. Growth rate, cohort analysis, feature adoption, revenue per segment, and benchmarks.', color: 'violet' },
  health: { icon: Activity, title: 'System Health', desc: 'Infrastructure monitoring. API latency, error rates, MongoDB health, background job status, and uptime tracking.', color: 'emerald' },
  audit: { icon: ScrollText, title: 'Activity Log', desc: 'Full audit trail. Every action on the platform logged with timestamps, actors, and details. AI agent actions highlighted.', color: 'gray' },
  errors: { icon: Bug, title: 'Error Logs', desc: 'Error monitoring and triage. Stack traces, frequency, AI-suggested fixes, and resolution tracking.', color: 'red' },
  settings: { icon: Settings, title: 'Admin Settings', desc: 'Platform configuration. Pricing tiers, feature flags, API keys, email templates, branding, and system preferences.', color: 'gray' },
}

export default function AdminPlaceholder({ section }) {
  const navigate = useNavigate()
  const s = SECTIONS[section] || { icon: Construction, title: section, desc: '', color: 'gray' }
  const Icon = s.icon

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <button onClick={() => navigate(adminPath('/'))} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors mb-6">
        <ArrowLeft size={12} /> Back to Overview
      </button>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
        <div className={`w-16 h-16 rounded-2xl bg-${s.color}-500/10 flex items-center justify-center mx-auto mb-4`}>
          <Icon size={28} className={`text-${s.color}-400`} />
        </div>
        <h1 className="text-xl font-bold text-white mb-2">{s.title}</h1>
        <p className="text-sm text-gray-400 max-w-md mx-auto leading-relaxed">{s.desc}</p>
        
        <div className="mt-8 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20">
          <Construction size={14} className="text-amber-400" />
          <span className="text-xs font-medium text-amber-400">Backend wiring in progress</span>
        </div>

        <div className="mt-6 text-xs text-gray-600">
          The backend endpoints and data models for this section exist.<br />
          Frontend integration is queued behind priority features.
        </div>
      </div>
    </div>
  )
}
