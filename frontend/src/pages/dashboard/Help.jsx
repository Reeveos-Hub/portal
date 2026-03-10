/**
 * Help.jsx — Complete Knowledge Base & Support Centre
 * Covers every feature, workflow, and setting in the platform
 */
import { useState, useRef } from 'react'
import {
  Search, ChevronDown, LayoutDashboard, Calendar, ClipboardList, Link2,
  Scissors, Users, Globe, ShoppingBag, BookUser, Star, BarChart3, CreditCard,
  Settings, Send, Bell, Trash2, FileText, MessageSquare, Megaphone,
  LayoutGrid, HelpCircle, Mail
} from 'lucide-react'

const SECTIONS = [
  {
    id: 'getting-started', title: 'Getting Started', Icon: LayoutDashboard,
    description: 'Set up your business, complete onboarding, and understand the basics.',
    articles: [
      { q: 'How do I set up my business profile?', a: 'Go to Settings and fill in your business name, address, phone number, and description. Upload your logo and cover image. This information appears on your public booking page and client communications.' },
      { q: 'What are the first things I should do after signing up?', a: 'Complete these steps in order: 1) Fill in your business profile in Settings. 2) Add your services with prices and durations. 3) Add your staff members and set their availability. 4) Enable online booking and share your booking link. 5) Set up payment preferences if you want to take deposits.' },
      { q: 'How does the onboarding wizard work?', a: 'When you first log in, the onboarding wizard walks you through setting up your business type, adding your first services, and inviting staff. You can skip steps and come back to them later from Settings.' },
      { q: 'What business types are supported?', a: 'The platform supports over 20 business types including hair salons, beauty clinics, barbershops, spas, nail studios, aesthetics clinics, tattoo parlours, physiotherapy, personal training, restaurants, cafes, and more. Each type gets tailored labels and features.' },
      { q: 'How do I switch between restaurant and service mode?', a: 'Your business type is set during onboarding. Restaurant mode adds Floor Plan, Kitchen Display, Menu management, and table reservations. Service mode adds Consultation Forms, Client Messages, and treatment-focused flows. Contact support to change your business type.' },
    ]
  },
  {
    id: 'dashboard', title: 'Home Dashboard', Icon: LayoutDashboard,
    description: 'Understand your dashboard stats, widgets, and daily overview.',
    articles: [
      { q: 'What does the dashboard show me?', a: 'Your dashboard shows today at a glance: total bookings, revenue, upcoming appointments, recent activity feed, and appointment trends. All data is live and refreshes every 20 seconds.' },
      { q: 'Why does my dashboard look empty?', a: 'If you just signed up, your dashboard shows empty states until you receive your first bookings. All widgets are wired to real data. Once bookings start coming in, stats populate automatically.' },
      { q: 'What is the Appointment Trends chart?', a: 'The trends chart shows your booking patterns over time. Use the Today/Week/Month toggle to change the range. For restaurants this shows occupancy. For services it shows appointment volume and availability.' },
      { q: 'How does the activity feed work?', a: 'The activity feed shows real-time events: new bookings, cancellations, check-ins, payments, and staff updates. It loads the 10 most recent and refreshes automatically.' },
      { q: 'What are the quick action buttons?', a: 'Quick actions let you jump to common tasks: create a booking, add a walk-in, view today schedule, or access settings. They save navigating through the menu.' },
    ]
  },
  {
    id: 'calendar', title: 'Calendar & Scheduling', Icon: Calendar,
    description: 'Manage your calendar, drag appointments, handle scheduling.',
    articles: [
      { q: 'How do I create a new booking from the calendar?', a: 'Click any empty time slot. A booking form appears where you select the client, service, staff member, date and time. The calendar automatically shows available slots based on staff hours and existing bookings.' },
      { q: 'Can I drag and drop appointments?', a: 'Yes. Click and hold any appointment card, then drag it to a new time or different staff column. The system checks for conflicts. You can also resize appointments by dragging the bottom edge to change duration.' },
      { q: 'How do I reschedule a booking?', a: 'Either drag and drop it on the calendar, or click the appointment to open details and change the time/date. The client is automatically notified if notifications are enabled.' },
      { q: 'What do the different colours mean?', a: 'Each staff member has a unique colour for quick identification. Status indicators: confirmed (tick), pending (clock), completed (green badge), and new clients get a "New Client" badge.' },
      { q: 'How do I cancel an appointment?', a: 'Click the appointment card, then click cancel in the details panel. Confirm the cancellation. It is logged in the audit trail and the client is notified. Cancelled bookings appear in Deleted Items.' },
      { q: 'Can I block out time for breaks or meetings?', a: 'Yes. Click an empty slot and select "Block Time". Label it as break, meeting, or custom. Blocked time shows as a hatched pattern and prevents bookings during that period.' },
      { q: 'How does the undo feature work?', a: 'After moving or rescheduling, a toast appears at the bottom with an Undo button. Click within a few seconds to revert. This prevents accidental moves.' },
      { q: 'What about first-time client appointments?', a: 'First appointments can be configured to have extra time automatically added (e.g. 15 minutes) for consultation. This is set per service or globally in Settings. The extra time does not show to the client.' },
    ]
  },
  {
    id: 'bookings', title: 'Bookings Management', Icon: ClipboardList,
    description: 'View, filter, and manage all your bookings.',
    articles: [
      { q: 'Where can I see all my bookings?', a: 'Go to Bookings from the sidebar. Filter by date range, status (confirmed, pending, cancelled, completed, no-show), staff member, and service. Use search to find specific clients.' },
      { q: 'What booking statuses are available?', a: 'Pending (awaiting confirmation), Confirmed (accepted), Completed (delivered), Cancelled (cancelled by client or staff), No-Show (did not attend). Change status from booking details.' },
      { q: 'How do I handle no-shows?', a: 'Mark as No-Show from booking details. If No-Show Protection is enabled in Payments, you can charge the card on file. No-show data is tracked in analytics to identify repeat offenders.' },
      { q: 'Can clients book themselves?', a: 'Yes. When Online Booking is enabled, clients visit your booking link, choose a service and time, fill in details, and confirm. The booking appears in your calendar immediately.' },
      { q: 'How do booking fees work?', a: 'Enable in Settings > Payments. Set an amount or percentage. Clients pay upfront when booking online. The fee is deducted from the final bill. This dramatically reduces no-shows.' },
      { q: 'How do I swap a service on an existing booking?', a: 'Click the booking on the calendar or in the Bookings list. In the detail panel, change the service. The duration adjusts automatically. The client is notified of the change.' },
    ]
  },
  {
    id: 'booking-link', title: 'Booking Link & Channels', Icon: Link2,
    description: 'Share your booking page and connect to booking channels.',
    articles: [
      { q: 'Where is my booking link?', a: 'Go to Booking Link from the sidebar. Your unique URL is at the top. Copy and share on social media, website, business cards, or anywhere you want clients to book from.' },
      { q: 'Can I embed the booking page on my website?', a: 'Yes. The Booking Link page provides an embed code. Paste it into your website HTML. The booking widget appears inline with your branding.' },
      { q: 'What is Reserve with Google?', a: 'Lets clients book directly from Google Search and Maps. A "Book" button appears on your Google Business Profile. Go to Booking Link > Channels to connect.' },
      { q: 'How do I track which channel bookings come from?', a: 'Each booking records its source: direct link, website embed, Google, Instagram, or walk-in. View in booking details or Analytics to understand which channels work best.' },
    ]
  },
  {
    id: 'services', title: 'Services & Menu', Icon: Scissors,
    description: 'Add, edit, price, and organise your services or menu items.',
    articles: [
      { q: 'How do I add a new service?', a: 'Go to Services, click Add Service. Fill in name, description, duration, price, and assign staff who can perform it. Group services into categories like Facials, Body Treatments, etc.' },
      { q: 'Can I set different prices for different staff?', a: 'Yes. When editing a service, set staff-specific pricing. A senior therapist can charge more for the same treatment than a junior.' },
      { q: 'How do service categories work?', a: 'Categories group related services. They appear as sections on your booking page. Clients browse by category. Drag categories to reorder them.' },
      { q: 'Can I hide a service from online booking?', a: 'Yes. Each service has a visibility toggle. Set to Hidden and it will not appear publicly but you can still book it manually for walk-ins.' },
      { q: 'How do I set up packages?', a: 'Create a package combining multiple services. Set price (usually discounted), number of sessions, and validity period. Clients purchase and redeem over time. Remaining sessions show on their profile with a progress bar.' },
      { q: 'What about patch tests?', a: 'For services requiring a patch test, set the flag. The system enforces a minimum gap between patch test and actual treatment. Booking is blocked if the test is not recorded.' },
      { q: 'How do contra-indication checks work with services?', a: 'Services can be linked to the consultation form system. If a client has flagged contraindications, the system shows a warning or blocks the booking depending on severity (BLOCK/FLAG/OK).' },
    ]
  },
  {
    id: 'staff', title: 'Staff Management', Icon: Users,
    description: 'Add team members, set availability, manage permissions.',
    articles: [
      { q: 'How do I add a staff member?', a: 'Go to Staff, click Add Staff. Enter name, email, phone, role, and services they perform. Set working hours and they appear as a column on the calendar.' },
      { q: 'How do I set staff working hours?', a: 'In Staff, click a team member > Availability tab. Set regular working days and hours. Add exceptions for holidays, training, or custom schedules.' },
      { q: 'What staff roles are available?', a: 'Staff (own bookings only), Business Owner (full access), Platform Admin (multi-business access). Roles control what each person can see and do.' },
      { q: 'Can staff log in?', a: 'Yes. Each staff member gets their own login. They see their calendar, bookings, and client notes. Access is restricted by role.' },
      { q: 'How do I manage time off?', a: 'Staff profile > Availability. Add time-off blocks for specific dates. Those times are blocked on the calendar and unavailable for booking.' },
    ]
  },
  {
    id: 'clients', title: 'Clients & CRM', Icon: BookUser,
    description: 'Client profiles, history, notes, packages, and relationships.',
    articles: [
      { q: 'Where can I see all my clients?', a: 'Go to Clients. Every client who has booked is listed, sorted by most recent. Search by name, email, or phone. Click any client for their full profile.' },
      { q: 'What is stored per client?', a: 'Name, email, phone, full booking history, therapist notes, consultation form responses, package balances, product purchases, preferences, and samples given.' },
      { q: 'How do therapist notes work?', a: 'After each appointment, staff add private notes to the client profile. All staff can see them. Notes include treatment preferences, reactions, samples given, personal details like upcoming events.' },
      { q: 'Can I import my client list?', a: 'Yes. Clients > Import. Upload a CSV with name, email, phone. The system maps columns and imports up to 10,000 clients. Duplicates detected by email.' },
      { q: 'How do I track package balances?', a: 'When a client buys a package, it shows on their profile with a progress bar (sessions used vs remaining). Staff can see this from the calendar booking card with one click.' },
      { q: 'What is the client pipeline?', a: 'The CRM pipeline tracks relationships through stages: Lead, Contacted, Consultation Booked, Active Client, VIP. Drag clients between stages. Useful for high-value treatment sales.' },
      { q: 'Can I see a client history from the calendar?', a: 'Yes. Click any booking on the calendar to see the client quick-view: their name, package balance, last visit, therapist notes, and any flags from their consultation form.' },
    ]
  },
  {
    id: 'consultation-forms', title: 'Consultation Forms', Icon: FileText,
    description: 'Medical forms, contraindication checks, consent, and compliance.',
    articles: [
      { q: 'What are consultation forms?', a: 'They collect medical and health information before treatment. Covers medical history, allergies, medications, skin conditions, lifestyle, and consent. Required by insurance.' },
      { q: 'When are clients asked to fill them in?', a: 'New clients receive the form automatically when they first book. It is sent via email/SMS before their appointment. Existing clients are reminded annually to update.' },
      { q: 'How do contraindications work?', a: 'Built-in matrix: conditions like pregnancy, steroids, autoimmune issues are flagged. BLOCK = cannot proceed. FLAG = therapist reviews. OK = safe. This protects you legally and clinically.' },
      { q: 'How does annual renewal work?', a: 'Forms valid for 6-12 months. One month before expiry, client gets a reminder. Status: green (current), amber (expiring), red (expired). Therapists see this on the booking card.' },
      { q: 'What if something changes between appointments?', a: 'Clients are asked "Any medical changes?" when they log in. If yes, they update the relevant section and it flags on the next booking for the therapist to review.' },
      { q: 'Is it GDPR compliant?', a: 'Yes. Medical data is encrypted at rest, stored securely, accessible only to authorised staff. Clients can request data or deletion. Consent is timestamped. Complies with GDPR, ICO, and insurance requirements.' },
    ]
  },
  {
    id: 'shop', title: 'Shop & Products', Icon: ShoppingBag,
    description: 'Products, inventory, discounts, and gift vouchers.',
    articles: [
      { q: 'How do I add products?', a: 'Shop > Add Product. Enter name, description, price, category, upload image. Track stock levels, set low-stock alerts, manage variants.' },
      { q: 'How do I archive a product?', a: 'Click the archive button on any product. A confirmation modal shows the product name. Archived products are hidden from the shop. Restore them from Deleted Items.' },
      { q: 'How do discount codes work?', a: 'Shop > Discounts tab. Create a code with percentage or fixed discount, minimum spend, usage limits. Share with clients. Applied at checkout.' },
      { q: 'Can I create gift vouchers?', a: 'Shop > Vouchers tab. Create with custom amounts. Clients purchase as gifts. Recipients redeem against any service or product.' },
      { q: 'How does stock tracking work?', a: 'Enable Track Stock per product. Set initial quantity and low-stock threshold. Alerts when stock drops below threshold. Auto-decrements on order fulfilment.' },
    ]
  },
  {
    id: 'payments', title: 'Payments & Billing', Icon: CreditCard,
    description: 'Deposits, processing, cancellation policies, and financials.',
    articles: [
      { q: 'How do payments work?', a: 'Stripe Connect for online payments (Visa, Mastercard, Amex, Apple Pay, Google Pay). Payments go directly to your bank via Stripe. Dojo for in-person card processing.' },
      { q: 'How do I set up booking fees?', a: 'Settings > Payments. Enable and set fixed amount or percentage. Charged when client books online. Deducted from final bill at checkout.' },
      { q: 'What cancellation policies are available?', a: 'Tiered: 24-hour (basic), 48-hour (standard), 72-hour (advanced). Cancel inside the window = booking fee retained. Configured in Settings > Payments.' },
      { q: 'Can clients pay in instalments?', a: 'Yes. Enable Klarna or Clearpay via Stripe. Clients spread cost of treatments and packages interest-free.' },
      { q: 'How do I view transactions?', a: 'Payments page shows all transactions. Filter by date, status, type. Export as CSV for your accountant.' },
    ]
  },
  {
    id: 'reviews', title: 'Reviews & Reputation', Icon: Star,
    description: 'Monitor, respond to, and manage reviews.',
    articles: [
      { q: 'Where do reviews come from?', a: 'From your booking platform, Google, and connected channels. Reviews page aggregates them in one place.' },
      { q: 'Can I respond to reviews?', a: 'Yes. Click any review, type response. Shows publicly alongside the review.' },
      { q: 'How do I get more reviews?', a: 'Enable automated requests in Settings. After each completed appointment, clients receive a follow-up asking for a review. Sent the day after when results are visible.' },
    ]
  },
  {
    id: 'analytics', title: 'Analytics & Reports', Icon: BarChart3,
    description: 'Performance metrics and business insights.',
    articles: [
      { q: 'What metrics can I track?', a: 'Bookings, revenue, average value, retention rate, no-show rate, busiest times, top services, staff utilisation, growth trends. All real-time.' },
      { q: 'Can I export reports?', a: 'Yes. Each view has an export button generating CSV for Excel or Google Sheets.' },
      { q: 'How far back does data go?', a: 'From the day you start. Filter by any range: today, week, month, quarter, or custom.' },
    ]
  },
  {
    id: 'marketing', title: 'Marketing & Campaigns', Icon: Megaphone,
    description: 'Email campaigns, client outreach, and promotions.',
    articles: [
      { q: 'How do I send email campaigns?', a: 'Marketing page. Create campaign with header, body, images, CTA button. Select audience: all, active, lapsed, or custom segment. Schedule or send now.' },
      { q: 'Can I target specific groups?', a: 'Segment by: last visit, total spend, service history, package holders, or custom tags. Send relevant messages like re-engagement offers to lapsed clients.' },
      { q: 'How do push notifications work?', a: 'Portal clients receive notifications for bookings, reminders, offers, and cancellation alerts. Send custom announcements to all or specific segments.' },
    ]
  },
  {
    id: 'notifications', title: 'Notifications & Reminders', Icon: Bell,
    description: 'Booking reminders, alerts, and communication.',
    articles: [
      { q: 'What do clients receive?', a: 'Booking confirmation, reminder (24-48hrs before), post-treatment follow-up, review request, and consultation form reminders. All customisable in Settings.' },
      { q: 'How do SMS reminders work?', a: 'Sent via our messaging provider at competitive UK rates. Enable in Settings > Notifications. Customise message, timing, and triggers.' },
      { q: 'What notifications do I get?', a: 'New bookings, cancellations, no-shows, reviews, low stock, form updates, staff changes. Manage preferences in Notifications page.' },
    ]
  },
  {
    id: 'online-booking', title: 'Online Booking Settings', Icon: Globe,
    description: 'Configure your public booking page and availability.',
    articles: [
      { q: 'How do I enable online booking?', a: 'Online Booking in sidebar. Toggle on, configure services, booking rules (advance notice, future limit), share link. Clients book 24/7.' },
      { q: 'Can I require approval?', a: 'Yes. Enable Require Approval. New bookings show as Pending until you confirm. Useful if you need to check suitability first.' },
      { q: 'How do I set booking rules?', a: 'Minimum advance notice, maximum future booking, buffer time between appointments, same-day booking toggle.' },
    ]
  },
  {
    id: 'settings', title: 'Settings & Configuration', Icon: Settings,
    description: 'Business profile, hours, branding, and preferences.',
    articles: [
      { q: 'What can I configure?', a: 'Business Profile, Opening Hours, Branding (logo, colours), Payment Settings, Notifications, Team Permissions, Booking Rules, and Integrations.' },
      { q: 'How do I change opening hours?', a: 'Settings > Opening Hours. Set regular hours per day. Add special hours for holidays. Changes apply to booking page immediately.' },
      { q: 'How do I update branding?', a: 'Settings > Business Profile. Upload logo (sidebar, booking page, emails). Set brand colour. Upload cover image for booking page.' },
    ]
  },
  {
    id: 'deleted', title: 'Deleted Items & Recovery', Icon: Trash2,
    description: 'Recover archived products and view cancelled bookings.',
    articles: [
      { q: 'Where do deleted items go?', a: 'Archived products and cancelled bookings go to Deleted Items in the sidebar under Manage. Nothing is permanently deleted.' },
      { q: 'How do I restore a product?', a: 'Deleted Items > Archived Products tab > Restore Product. It is set back to Active and reappears in your shop.' },
      { q: 'Can I see cancellation reasons?', a: 'Cancelled Bookings tab shows client name, service, original date, and cancellation time. Serves as an audit trail for records and insurance.' },
    ]
  },
  {
    id: 'floor-plan', title: 'Floor Plan (Restaurants)', Icon: LayoutGrid,
    description: 'Design floor layout, manage tables, track live status.',
    articles: [
      { q: 'How do I set up the floor plan?', a: 'Floor Plan in sidebar. Drag tables, booths, bar seats onto canvas. Set capacity, shape, zone. Used for reservations and live tracking.' },
      { q: 'What do table statuses mean?', a: 'Available (green), Reserved (gold), Confirmed (black), Seated (green), Mains (orange), Dessert (purple), Paying (grey), Dirty (red). Updates in real-time.' },
      { q: 'Can I have multiple zones?', a: 'Yes. Main Dining, Terrace, Bar, Private Room. Each zone has its own tables and capacity.' },
    ]
  },
  {
    id: 'client-portal', title: 'Client Portal', Icon: Globe,
    description: 'Client self-service for bookings, forms, and history.',
    articles: [
      { q: 'What is the client portal?', a: 'Self-service area where clients view history, manage bookings, complete forms, check packages, update medical info, and receive notifications.' },
      { q: 'How do clients access it?', a: 'Account created when they first book online, or invited via email. Login with email and password. Works on mobile and desktop.' },
      { q: 'Can clients cancel or reschedule?', a: 'Yes, within your cancellation policy. Outside the window, they are informed of the booking fee. Rescheduling shows only available slots.' },
      { q: 'How does the cancellation waitlist work?', a: 'Clients opt in. When a slot opens from a cancellation, waitlisted clients are notified automatically. First come, first served.' },
    ]
  },
]

const Article = ({ q, a }) => {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ borderBottom: '1px solid #EBEBEB' }}>
      <button onClick={() => setOpen(!open)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0', background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Figtree', sans-serif", textAlign: 'left' }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: '#111', flex: 1, paddingRight: 16 }}>{q}</span>
        <ChevronDown size={16} color="#999" style={{ transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'none', flexShrink: 0 }} />
      </button>
      {open && <div style={{ fontSize: 13, color: '#666', lineHeight: '22px', paddingBottom: 16, paddingRight: 20 }}>{a}</div>}
    </div>
  )
}

const searchArticles = (query) => {
  if (!query || query.length < 2) return null
  const q = query.toLowerCase()
  const results = []
  SECTIONS.forEach(s => {
    s.articles.forEach(a => {
      if (a.q.toLowerCase().includes(q) || a.a.toLowerCase().includes(q)) results.push({ section: s.title, SIcon: s.Icon, ...a })
    })
  })
  return results
}

export default function Help() {
  const [search, setSearch] = useState('')
  const searchResults = searchArticles(search)
  const totalArticles = SECTIONS.reduce((sum, s) => sum + s.articles.length, 0)

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', fontFamily: "'Figtree', sans-serif", background: '#FAFAFA' }}>
      <div style={{ padding: '28px 24px 20px', background: '#111', color: '#fff', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -40, right: -40, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.03)' }} />
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <HelpCircle size={20} color="#C9A84C" />
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: '#C9A84C' }}>Knowledge Base</span>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Help & Support</h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 16 }}>{SECTIONS.length} topics · {totalArticles} articles · Everything you need to manage your business</p>
          <div style={{ position: 'relative', maxWidth: 480 }}>
            <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#888' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search... e.g. deposits, calendar, cancellation"
              style={{ width: '100%', padding: '12px 16px 12px 40px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.08)', color: '#fff', fontSize: 13, outline: 'none', fontFamily: "'Figtree', sans-serif" }} />
          </div>
        </div>
      </div>

      {searchResults && (
        <div style={{ padding: '16px 24px', background: '#fff', borderBottom: '1px solid #EBEBEB', maxHeight: 400, overflowY: 'auto' }}>
          {searchResults.length === 0 ? (
            <div style={{ padding: 20, textAlign: 'center', color: '#999', fontSize: 13 }}>No results for &ldquo;{search}&rdquo;. Try different keywords.</div>
          ) : (
            <>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>{searchResults.length} result{searchResults.length !== 1 ? 's' : ''}</div>
              {searchResults.map((r, i) => (
                <div key={i} style={{ padding: '12px 0', borderBottom: i < searchResults.length - 1 ? '1px solid #F5F5F5' : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <r.SIcon size={12} color="#C9A84C" />
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#C9A84C', textTransform: 'uppercase', letterSpacing: 1 }}>{r.section}</span>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#111', marginBottom: 4 }}>{r.q}</div>
                  <div style={{ fontSize: 12, color: '#888', lineHeight: '18px' }}>{r.a.slice(0, 150)}...</div>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
        {!searchResults && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12, marginBottom: 32 }}>
            {SECTIONS.map(s => (
              <a key={s.id} href={`#help-${s.id}`} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: 18, background: '#fff', borderRadius: 14, border: '1px solid #EBEBEB', textDecoration: 'none', transition: 'all 0.2s' }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: '#F5F5F5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><s.Icon size={18} color="#111" /></div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#111', marginBottom: 3 }}>{s.title}</div>
                  <div style={{ fontSize: 11, color: '#888', lineHeight: '16px' }}>{s.description}</div>
                  <div style={{ fontSize: 10, color: '#BBB', marginTop: 6 }}>{s.articles.length} articles</div>
                </div>
              </a>
            ))}
          </div>
        )}

        {SECTIONS.map(s => (
          <div key={s.id} id={`help-${s.id}`} style={{ marginBottom: 32, background: '#fff', borderRadius: 16, border: '1px solid #EBEBEB', overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #EBEBEB', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: '#F5F5F5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><s.Icon size={16} color="#111" /></div>
              <div><div style={{ fontSize: 16, fontWeight: 700, color: '#111' }}>{s.title}</div><div style={{ fontSize: 11, color: '#888' }}>{s.description}</div></div>
            </div>
            <div style={{ padding: '0 24px' }}>{s.articles.map((a, i) => <Article key={i} q={a.q} a={a.a} />)}</div>
          </div>
        ))}

        <div style={{ background: '#111', borderRadius: 16, padding: 32, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20, marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 4 }}>Still need help?</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>Our support team typically responds within a few hours.</div>
          </div>
          <a href="mailto:support@reeveos.app" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', borderRadius: 10, background: 'rgba(255,255,255,0.1)', color: '#fff', fontSize: 13, fontWeight: 600, textDecoration: 'none', border: '1px solid rgba(255,255,255,0.1)' }}>
            <Mail size={14} /> Email Support
          </a>
        </div>
      </div>
    </div>
  )
}
