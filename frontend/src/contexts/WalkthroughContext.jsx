/**
 * WalkthroughContext v3 — Comprehensive tour covering EVERY portal section
 */
import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useBusiness } from './BusinessContext'
import { useAuth } from './AuthContext'
import api from '../utils/api'

const WalkthroughContext = createContext(null)
const STORAGE_KEY = 'reeveos_walkthrough'

function getSteps(businessType) {
  const isFood = ['restaurant', 'cafe', 'bar', 'pub', 'takeaway'].includes(businessType)
  const isBeauty = ['beauty', 'aesthetics', 'salon', 'nails', 'spa', 'massage', 'physiotherapy'].includes(businessType)
  const svc = isFood ? 'dish' : isBeauty ? 'treatment' : 'service'
  const svcs = isFood ? 'menu' : 'services'
  const staff = isBeauty ? 'therapist' : isFood ? 'server' : 'team member'
  const staffPlural = isBeauty ? 'therapists' : isFood ? 'servers' : 'team members'

  const steps = [
    // ════════ WELCOME ════════
    {
      id: 'welcome', path: null, target: null, type: 'modal',
      title: 'Welcome to ReeveOS, {firstName}!',
      body: 'I\'m your portal guide. Over the next few minutes, I\'ll walk you through every feature of your business dashboard — from managing bookings and clients to running your shop and sending marketing campaigns. At each step, you\'ll get to try the feature yourself. Let\'s get started!',
    },

    // ════════ MAIN ════════
    {
      id: 'sidebar', path: '/dashboard', target: '[data-tour="sidebar"]',
      title: 'The Sidebar — Your Navigation Hub',
      body: 'This is your command centre. It\'s split into sections: Main (your daily tools), CRM (client relationships), Shop (products and vouchers), Client Portal (forms, messages, emails), and Manage (staff, business settings). Everything adapts to your business type — you\'ll only see what\'s relevant.',
      task: 'Click any item in the sidebar to see how it opens that section.',
      interactive: true, position: 'right',
    },
    {
      id: 'dashboard', path: '/dashboard', target: '[data-tour="dashboard-stats"]',
      title: 'Your Dashboard — The Daily Snapshot',
      body: 'This is your home screen. The stat cards show today\'s bookings, revenue, new clients, and pending actions. Below that is your activity feed — recent bookings, cancellations, form submissions, and reviews. The dashboard updates in real-time, so it always reflects what\'s happening right now.',
      task: 'Click on any of the stat cards to drill down into that metric.',
      interactive: true, position: 'bottom',
    },
    {
      id: 'calendar', path: '/dashboard/calendar', target: '[data-tour="calendar"]',
      title: isFood ? 'Reservations Calendar' : 'Your Appointment Calendar',
      body: isFood
        ? 'Every reservation is shown here — colour-coded by status (green = confirmed, yellow = pending, red = cancelled). You can switch between day, week, and month views. Drag and drop to reschedule. Click any booking to see full details, contact the customer, or update the status.'
        : `Your full appointment diary. Each ${staff}'s column shows their bookings for the day. Colour-coded by status — green confirmed, yellow pending. Drag to reschedule, click to view details. The calendar syncs with Google Calendar too.`,
      task: 'Click on any appointment card to open the booking detail panel.',
      interactive: true, position: 'bottom',
    },
    {
      id: 'booking-link', path: '/dashboard/online-booking', target: '[data-tour="booking-link"]',
      title: 'Your Online Booking Page',
      body: `This is your public booking page — the link you share with clients so they can book 24/7 without calling. It shows your available ${svcs}, ${staffPlural}, and time slots in real-time. You can customise the colours, add your logo, set a welcome message, and control which ${svcs} are bookable online. Share it on Instagram, your website, WhatsApp, or print the QR code for your shop window.`,
      task: 'Click "Copy Link" to grab your booking URL — try opening it in a new tab to see what your clients see.',
      interactive: true, position: 'bottom',
    },
    {
      id: 'services', path: '/dashboard/services', target: '[data-tour="services"]',
      title: isFood ? 'Your Menu' : 'Your Services',
      body: isFood
        ? 'Your full menu lives here. Each item has a name, description, price, category (Starters, Mains, Desserts etc.), and allergen tags. You can reorder items, toggle availability on/off for sold-out items, and add photos. Categories are shown to customers on your booking page.'
        : `All your ${svcs} are managed here. Each one has a name, duration, price, category, and which ${staffPlural} can perform it. You can create packages and courses (e.g. "3 Sessions of Microneedling"), set deposit requirements per service, and add detailed descriptions that clients see when booking.`,
      task: `Click on any ${svc} to edit it, or try the "Add" button to create a new one.`,
      interactive: true, position: 'bottom',
    },

    // ════════ CRM ════════
    {
      id: 'crm-overview', path: '/dashboard/crm?view=dashboard', target: '[data-tour="crm"]',
      title: 'CRM Dashboard — Know Your Clients',
      body: 'Your CRM (Client Relationship Manager) gives you a bird\'s-eye view of your client base. See total clients, average spend, retention rate, top spenders, and clients you haven\'t seen in a while. Use this to spot trends — like which treatments are most popular, or which clients are at risk of churning.',
      task: 'Explore the CRM dashboard — click on any metric card to drill deeper.',
      interactive: true, position: 'bottom',
    },
    {
      id: 'crm-pipeline', path: '/dashboard/crm?view=pipeline', target: '[data-tour="crm"]',
      title: 'Sales Pipeline — Track Leads to Bookings',
      body: 'The pipeline shows potential clients moving through stages — from Enquiry to Consultation to Booked to Completed. Drag cards between columns to update their status. Perfect for tracking consultations, follow-up calls, and upselling opportunities. Each card shows the client\'s name, potential value, and how long they\'ve been at that stage.',
      task: 'Try dragging a pipeline card from one column to another.',
      interactive: true, position: 'bottom',
    },
    {
      id: 'crm-clients', path: '/dashboard/crm?view=clients', target: '[data-tour="crm"]',
      title: 'Client Database — Full History at a Glance',
      body: `Your complete client list. Click any client to see their full profile: booking history, total spend, favourite ${svcs}, medical forms (if applicable), notes, communication history, and upcoming appointments. You can filter by last visit date, spend amount, or tag clients with custom labels like "VIP" or "Requires follow-up".`,
      task: 'Click on any client row to open their full profile.',
      interactive: true, position: 'bottom',
    },

    // ════════ SHOP ════════
    {
      id: 'shop-products', path: '/dashboard/shop?tab=products', target: '[data-tour="shop"]',
      title: 'Shop — Sell Products Online',
      body: `Your product catalogue. Add retail products (skincare, haircare, accessories — whatever you sell), set prices, manage stock levels, and add photos. Products appear in your client portal so customers can browse and buy after their appointment. Great for upselling — "${isBeauty ? 'The serum we used today is available in the shop' : 'Take home our house hot sauce'}" .`,
      task: 'Browse the products tab — click on any product to see its detail page.',
      interactive: true, position: 'bottom',
    },
    {
      id: 'shop-orders', path: '/dashboard/shop?tab=orders', target: '[data-tour="shop"]',
      title: 'Shop — Order Management',
      body: 'When a client buys something, the order appears here. See order status (paid, dispatched, collected), payment details, and customer info. Mark orders as fulfilled when the client picks up or you ship. Full order history for accounting and stock management.',
      position: 'bottom',
    },
    {
      id: 'shop-discounts', path: '/dashboard/shop?tab=discounts', target: '[data-tour="shop"]',
      title: 'Shop — Discounts & Promotions',
      body: 'Create discount codes for marketing campaigns — percentage off, fixed amount off, or buy-one-get-one. Set expiry dates, usage limits, and minimum spend requirements. Share codes on social media or send them via email campaigns to drive bookings.',
      position: 'bottom',
    },
    {
      id: 'shop-vouchers', path: '/dashboard/shop?tab=vouchers', target: '[data-tour="shop"]',
      title: 'Shop — Gift Vouchers',
      body: `Sell digital gift vouchers that clients can buy for friends and family. Set custom amounts or pre-set values (£25, £50, £100). Vouchers are emailed as branded PDFs with a unique code. Recipients redeem them when booking — the system deducts from the voucher balance automatically. ${isBeauty ? 'These sell especially well around Christmas, Mother\'s Day, and Valentine\'s.' : 'Great for birthdays, office parties, and special occasions.'}`,
      position: 'bottom',
    },

    // ════════ CLIENT PORTAL ════════
    {
      id: 'consultation-forms', path: '/dashboard/consultation-forms', target: '[data-tour="consultation-forms"]',
      title: isBeauty ? 'Consultation & Consent Forms' : 'Client Intake Forms',
      body: isBeauty
        ? 'This is your forms control centre. When a client fills in their health questionnaire, it lands here with a clear status: Green (clear), Amber (flagged — needs your review), or Red (blocked — unsafe for that treatment). Click any submission to see their answers, contraindication alerts, and your override options. Forms auto-expire after 6 months and clients are prompted to re-submit.'
        : 'Manage all client intake forms here. When someone submits a form, review the details, add notes, and approve. You can create custom forms with different fields for different service types.',
      task: 'Click on any form submission to see the full details and status.',
      interactive: true, position: 'bottom',
    },
    {
      id: 'messages', path: '/dashboard/client-messages', target: '[data-tour="messages"]',
      title: 'Client Messages — Two-Way Chat',
      body: 'Your unified inbox. Chat back and forth with clients in real-time — they see your messages in their client portal. Use it for appointment reminders, aftercare follow-ups, sending before/after photos, or answering quick questions. The system also auto-sends booking confirmations, reminders (email + SMS), and aftercare instructions through this channel.',
      task: 'Click on any conversation thread to read the messages.',
      interactive: true, position: 'bottom',
    },
    {
      id: 'emails', path: '/dashboard/client-emails', target: '[data-tour="consultation-forms"]',
      title: 'Email Marketing — Campaigns & Automations',
      body: 'Send targeted email campaigns to your client list. Birthday offers, re-engagement emails for clients you haven\'t seen in 60 days, seasonal promotions, new service announcements. Templates are pre-built — customise the text, pick your audience, schedule or send immediately. Track open rates, click rates, and bookings generated from each campaign.',
      position: 'bottom',
    },
    {
      id: 'push', path: '/dashboard/client-push', target: '[data-tour="consultation-forms"]',
      title: 'Push Notifications',
      body: 'Send instant notifications to clients who have your portal saved to their home screen. Flash sales, last-minute availability, event announcements. Notifications appear on their phone like a native app — without needing to build one.',
      position: 'bottom',
    },

    // ════════ MANAGE ════════
    {
      id: 'staff', path: '/dashboard/staff', target: '[data-tour="staff"]',
      title: `Your Team — ${isBeauty ? 'Therapists' : isFood ? 'Staff' : 'Team Members'}`,
      body: `Manage everyone who works at your business. Each ${staff} has their own profile with: working hours, days off, ${svcs} they can perform, and their own calendar view. When clients book online, they can choose their preferred ${staff}. You control permissions — decide who can view bookings, edit settings, or access financial data. Invite new ${staffPlural} by email — they get their own login.`,
      task: `Click on any ${staff} to see their profile, schedule, and assigned ${svcs}.`,
      interactive: true, position: 'bottom',
    },
    {
      id: 'settings', path: '/dashboard/settings', target: '[data-tour="settings"]',
      title: 'Settings — Configure Everything',
      body: 'Your business configuration hub. Six tabs: Business Details (name, address, logo), Opening Hours (per-day, with breaks), Notifications (which emails/SMS to send automatically), Integrations (Google Calendar sync, Stripe payments), Preferences (including this Guided Tour toggle), and Subscription (your current plan and billing).',
      task: 'Click on the "Preferences" tab — that\'s where you\'ll find the Guided Tour on/off switch.',
      interactive: true, position: 'bottom',
    },
  ]

  // ════════ MEDICAL SAFETY (beauty only) ════════
  if (isBeauty) {
    // Insert after consultation forms
    const formIdx = steps.findIndex(s => s.id === 'consultation-forms')
    if (formIdx !== -1) {
      steps.splice(formIdx + 1, 0, {
        id: 'medical-safety', path: '/dashboard/consultation-forms', target: '[data-tour="consultation-forms"]',
        title: 'Medical Safety — Contraindication Engine',
        body: 'This is unique to ReeveOS. When a client submits their health form, the system cross-references their answers against a matrix of 20 medical conditions across 5 treatment types (Microneedling, Chemical Peels, RF Needling, Polynucleotides, Lymphatic Lift). BLOCK means the treatment is medically unsafe — the booking is automatically prevented. FLAG means you should review before proceeding — you can override with a reason, and everything is logged to an immutable audit trail for your insurance records. No other booking platform does this.',
        task: 'Look for any flagged or blocked forms — click one to see the contraindication details.',
        interactive: true, position: 'top',
      })
    }
  }

  // ════════ COMPLETION ════════
  steps.push({
    id: 'complete', path: null, target: null, type: 'modal',
    title: 'You\'re All Set, {firstName}!',
    body: 'You\'ve explored every section of your ReeveOS portal — from booking management and client CRM to your online shop, marketing tools, and team management. Your business is live and ready for clients. You can restart this tour anytime from the compass icon in the top navigation bar, or from Settings > Preferences. Now go take some bookings!',
  })

  return steps
}

export function WalkthroughProvider({ children }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const { businessType } = useBusiness()
  const [active, setActive] = useState(false)
  const [stepIndex, setStepIndex] = useState(0)
  const [steps, setSteps] = useState([])

  useEffect(() => { setSteps(getSteps(businessType || 'other')) }, [businessType])

  useEffect(() => {
    if (!user) return
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        const d = JSON.parse(stored)
        if (d.completed) return
        if (d.active) { setActive(true); setStepIndex(d.step || 0) }
      } catch {}
    } else {
      const timer = setTimeout(() => {
        setActive(true); setStepIndex(0)
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ active: true, step: 0, completed: false }))
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [user])

  useEffect(() => {
    if (active) localStorage.setItem(STORAGE_KEY, JSON.stringify({ active, step: stepIndex, completed: false }))
  }, [active, stepIndex])

  useEffect(() => {
    if (!active || steps.length === 0) return
    const step = steps[stepIndex]
    if (step?.path && location.pathname + location.search !== step.path) navigate(step.path)
  }, [active, stepIndex, steps, navigate, location.pathname, location.search])

  const next = useCallback(() => {
    if (stepIndex >= steps.length - 1) {
      setActive(false)
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ active: false, step: 0, completed: true }))
      try { api.patch('/users/me', { walkthrough_completed: true }).catch(() => {}) } catch {}
      return
    }
    setStepIndex(i => i + 1)
  }, [stepIndex, steps.length])

  const back = useCallback(() => { setStepIndex(i => Math.max(0, i - 1)) }, [])

  const skip = useCallback(() => {
    setActive(false)
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ active: false, step: 0, completed: true }))
    try { api.patch('/users/me', { walkthrough_completed: true }).catch(() => {}) } catch {}
  }, [])

  const restart = useCallback(() => {
    setStepIndex(0); setActive(true)
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ active: true, step: 0, completed: false }))
  }, [])

  return (
    <WalkthroughContext.Provider value={{ active, currentStep: steps[stepIndex] || null, stepIndex, totalSteps: steps.length, next, back, skip, restart }}>
      {children}
    </WalkthroughContext.Provider>
  )
}

export function useWalkthrough() {
  const ctx = useContext(WalkthroughContext)
  if (!ctx) return { active: false, currentStep: null, stepIndex: 0, totalSteps: 0, next: () => {}, back: () => {}, skip: () => {}, restart: () => {} }
  return ctx
}
