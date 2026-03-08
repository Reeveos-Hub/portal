/**
 * WalkthroughContext — manages the guided tour state across the dashboard.
 * Persists to localStorage + user API. Auto-triggers on first login.
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
  const svc = isFood ? 'menu item' : 'treatment'
  const svcs = isFood ? 'menu' : 'services'
  const staff = isBeauty ? 'therapist' : isFood ? 'server' : 'team member'

  const steps = [
    {
      id: 'welcome',
      path: null, // modal, no navigation
      target: null,
      title: 'Welcome to ReeveOS!',
      body: `I'm your setup guide. I'll walk you through every part of your portal in about 3 minutes. You can skip at any time, and restart this tour from Settings whenever you like.`,
      type: 'modal',
    },
    {
      id: 'sidebar',
      path: '/dashboard',
      target: '[data-tour="sidebar"]',
      title: 'Your Command Centre',
      body: `Everything in your business lives here — bookings, clients, shop, messages, settings. The sections adapt to your business type, so you'll only see what's relevant to you.`,
      position: 'right',
    },
    {
      id: 'dashboard',
      path: '/dashboard',
      target: '[data-tour="dashboard-stats"]',
      title: 'Dashboard Overview',
      body: `This is your home. At a glance you can see today's bookings, revenue, new clients, and any alerts that need attention. Everything here is live data.`,
      position: 'bottom',
    },
    {
      id: 'calendar',
      path: '/dashboard/calendar',
      target: '[data-tour="calendar"]',
      title: isFood ? 'Reservations' : 'Calendar',
      body: `Your calendar shows every booking across all your ${staff}s. We've loaded sample data so you can see how it'll look. Try clicking any appointment to see the detail panel.`,
      position: 'bottom',
    },
    {
      id: 'booking-link',
      path: '/dashboard/online-booking',
      target: '[data-tour="booking-link"]',
      title: 'Your Booking Link',
      body: `This is your online booking page — clients use this to book themselves in 24/7. Share the link on your website, Instagram bio, or WhatsApp. Customise the look and control which ${svcs} are bookable.`,
      position: 'bottom',
    },
    {
      id: 'services',
      path: '/dashboard/services',
      target: '[data-tour="services"]',
      title: isFood ? 'Your Menu' : 'Your Services',
      body: `Manage your ${svcs} here. Each one has a name, duration, price, and category. You added some during setup — edit, reorder, or add new ones at any time.`,
      position: 'bottom',
    },
    {
      id: 'crm',
      path: '/dashboard/crm?view=clients',
      target: '[data-tour="crm"]',
      title: 'Client Management',
      body: `Your CRM tracks every client interaction. See who's booked, who's overdue, their lifetime spend, and which ${svcs} they love most. Turn one-time visitors into regulars.`,
      position: 'bottom',
    },
    {
      id: 'shop',
      path: '/dashboard/shop?tab=products',
      target: '[data-tour="shop"]',
      title: 'Shop',
      body: `Sell products, gift vouchers, and ${svc} packages online. Clients can browse and buy from their portal — no third-party checkout needed.`,
      position: 'bottom',
    },
    {
      id: 'consultation-forms',
      path: '/dashboard/consultation-forms',
      target: '[data-tour="consultation-forms"]',
      title: 'Consultation Forms',
      body: isBeauty
        ? `When a client fills in their health questionnaire, it appears here. The system automatically checks their medical answers against your treatments — contraindications are flagged or blocked automatically.`
        : `Manage client intake forms here. When someone submits a form, review and approve it directly from this screen.`,
      position: 'bottom',
    },
    {
      id: 'messages',
      path: '/dashboard/client-messages',
      target: '[data-tour="messages"]',
      title: 'Messages',
      body: `Chat directly with your clients. Messages, appointment reminders, aftercare instructions — all in one inbox. Your clients see these in their portal too.`,
      position: 'bottom',
    },
    {
      id: 'staff',
      path: '/dashboard/staff',
      target: '[data-tour="staff"]',
      title: 'Your Team',
      body: `Manage your team here. Each ${staff} has their own schedule, ${svcs} they can perform, and availability. Clients choose their preferred ${staff} when booking.`,
      position: 'bottom',
    },
    {
      id: 'settings',
      path: '/dashboard/settings',
      target: '[data-tour="settings"]',
      title: 'Settings',
      body: `Fine-tune everything — business hours, cancellation policy, booking rules, notifications, and payment settings. This is also where you'll find the Guided Tour toggle to run through this again.`,
      position: 'bottom',
    },
  ]

  // Add medical safety step for beauty/aesthetics
  if (isBeauty) {
    steps.splice(9, 0, {
      id: 'medical-safety',
      path: '/dashboard/consultation-forms',
      target: '[data-tour="consultation-forms"]',
      title: 'Medical Safety System',
      body: `Because you're in aesthetics, ReeveOS checks every client's health form against a contraindication matrix — 20 conditions across 5 treatment types. BLOCK means unsafe, FLAG means review needed. Every override is logged for your insurance.`,
      position: 'top',
    })
  }

  // Final step
  steps.push({
    id: 'complete',
    path: null,
    target: null,
    title: "You're Ready!",
    body: `Your portal is fully set up and ready for clients. If you ever want to run through this again, head to Settings. We're always here if you need us.`,
    type: 'modal',
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

  // Build steps when business type is known
  useEffect(() => {
    setSteps(getSteps(businessType || 'other'))
  }, [businessType])

  // Auto-start on first login
  useEffect(() => {
    if (!user) return
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        const d = JSON.parse(stored)
        if (d.completed) return // Already done
        if (d.active) { setActive(true); setStepIndex(d.step || 0) }
      } catch { /* ignore */ }
    } else {
      // First ever login — auto start after a short delay
      const timer = setTimeout(() => {
        setActive(true)
        setStepIndex(0)
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ active: true, step: 0, completed: false }))
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [user])

  // Persist step changes
  useEffect(() => {
    if (active) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ active, step: stepIndex, completed: false }))
    }
  }, [active, stepIndex])

  // Navigate when step changes
  useEffect(() => {
    if (!active || steps.length === 0) return
    const step = steps[stepIndex]
    if (step?.path && location.pathname + location.search !== step.path) {
      navigate(step.path)
    }
  }, [active, stepIndex, steps, navigate, location.pathname, location.search])

  const next = useCallback(() => {
    if (stepIndex >= steps.length - 1) {
      // Complete
      setActive(false)
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ active: false, step: 0, completed: true }))
      try { api.patch('/users/me', { walkthrough_completed: true }).catch(() => {}) } catch {}
      return
    }
    setStepIndex(i => i + 1)
  }, [stepIndex, steps.length])

  const back = useCallback(() => {
    setStepIndex(i => Math.max(0, i - 1))
  }, [])

  const skip = useCallback(() => {
    setActive(false)
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ active: false, step: 0, completed: true }))
    try { api.patch('/users/me', { walkthrough_completed: true }).catch(() => {}) } catch {}
  }, [])

  const restart = useCallback(() => {
    setStepIndex(0)
    setActive(true)
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ active: true, step: 0, completed: false }))
  }, [])

  const currentStep = steps[stepIndex] || null

  return (
    <WalkthroughContext.Provider value={{ active, currentStep, stepIndex, totalSteps: steps.length, next, back, skip, restart }}>
      {children}
    </WalkthroughContext.Provider>
  )
}

export function useWalkthrough() {
  const ctx = useContext(WalkthroughContext)
  if (!ctx) return { active: false, currentStep: null, stepIndex: 0, totalSteps: 0, next: () => {}, back: () => {}, skip: () => {}, restart: () => {} }
  return ctx
}
