const F = 'Figtree, system-ui, sans-serif'

export const CATEGORIES = [
  { id: 'getting-started',         title: 'Getting Started',             icon: '🚀', desc: 'Set up your account and get ready to take your first booking.' },
  { id: 'dashboard',               title: 'Home Dashboard',              icon: '🏠', desc: 'Understand your home screen and what everything means.' },
  { id: 'calendar',                title: 'Calendar & Scheduling',       icon: '📅', desc: 'Create, move, and manage appointments from your calendar.' },
  { id: 'bookings',                title: 'Bookings Management',         icon: '📋', desc: 'View, edit, and keep track of all your bookings in one place.' },
  { id: 'booking-link',            title: 'Booking Link & Channels',     icon: '🔗', desc: 'Share your booking page and connect it to Google, Instagram, and more.' },
  { id: 'services',                title: 'Services & Menu',             icon: '✂️', desc: 'Add the treatments, services, or dishes your clients can book or order.' },
  { id: 'staff',                   title: 'Staff Management',            icon: '👥', desc: 'Add your team, set their hours, and control what they can access.' },
  { id: 'clients',                 title: 'Clients & Client Book',       icon: '📒', desc: 'Everything about your clients — their history, notes, and details.' },
  { id: 'consultation-forms',      title: 'Consultation Forms',          icon: '📝', desc: 'Collect health information and keep your clients safe before treatment.' },
  { id: 'shop',                    title: 'Shop & Products',             icon: '🛍️', desc: 'Sell products and gift vouchers directly through your platform.' },
  { id: 'payments',                title: 'Payments & Billing',          icon: '💳', desc: 'Set up booking fees, cancellation policies, and view transactions.' },
  { id: 'reviews',                 title: 'Reviews & Reputation',        icon: '⭐', desc: 'Collect and respond to client reviews to grow your reputation.' },
  { id: 'analytics',               title: 'Analytics & Reports',         icon: '📊', desc: 'Understand how your business is performing with real data.' },
  { id: 'marketing',               title: 'Marketing & Campaigns',       icon: '📣', desc: 'Send emails and messages to win back clients and fill your diary.' },
  { id: 'notifications',           title: 'Notifications & Reminders',   icon: '🔔', desc: 'Set up automatic reminders so clients never forget their appointments.' },
  { id: 'online-booking',          title: 'Online Booking Settings',     icon: '⚙️', desc: 'Control how and when clients can book online.' },
  { id: 'settings',                title: 'Settings & Configuration',    icon: '🔧', desc: 'Update your business details, branding, and preferences.' },
  { id: 'deleted',                 title: 'Deleted Items & Recovery',    icon: '🗑️', desc: 'Find and restore anything you\'ve removed by accident.' },
  { id: 'floor-plan',              title: 'Floor Plan (Restaurants)',     icon: '🍽️', desc: 'Set up your tables and manage your dining room in real time.' },
  { id: 'client-portal',           title: 'Client Portal',               icon: '👤', desc: 'How your clients log in and manage their own bookings and details.' },
]

export const ARTICLES = [

  // ─────────────────────────────────────────────────────────────
  // GETTING STARTED
  // ─────────────────────────────────────────────────────────────
  {
    id: 'set-up-business-profile',
    categoryId: 'getting-started',
    title: 'How to set up your business profile',
    intro: 'Your business profile is the heart of everything. It\'s what your clients see when they visit your booking page, and it fills in your emails and confirmations automatically. It only takes a few minutes to do properly — and it\'s worth doing right from the start.',
    toc: ['Open your Settings', 'Fill in your business details', 'Add your logo and cover image', 'Save and check it looks right'],
    sections: [
      {
        title: 'Open your Settings',
        steps: [
          { text: 'Log in to your ReeveOS dashboard at portal.rezvo.app.' },
          { text: 'Look at the left-hand sidebar. Right at the bottom, you\'ll see a cog icon — that\'s Settings. Click it.', screenshot: true },
          { text: 'Click on Business Profile at the top of the settings menu.' },
        ]
      },
      {
        title: 'Fill in your business details',
        steps: [
          { text: 'Type your business name exactly as you want it to appear to clients.', screenshot: true },
          { text: 'Add your full address, including your postcode. This is shown on your booking page so clients know where to find you.' },
          { text: 'Add your business phone number. This is for client contact — it goes on their confirmation emails.' },
          { text: 'Write a short description of your business in the text box. Keep it warm and welcoming — tell people what you do and why they\'d love coming to you. Two or three sentences is plenty.' },
          { text: 'Select your business category from the dropdown. If yours isn\'t listed exactly, pick the closest one.' },
        ]
      },
      {
        title: 'Add your logo and cover image',
        steps: [
          { text: 'Scroll down to the Logo section. Click Upload Logo and choose your logo file from your computer. PNG or JPG works. It should be square — something like 400×400 pixels is ideal.', screenshot: true },
          { text: 'Below that is your Cover Image. This is the big banner that appears at the top of your booking page. A good cover image makes a huge first impression — a photo of your salon, restaurant, or workspace works brilliantly. Click Upload Cover Image to add one.' },
          { text: 'Once uploaded, you\'ll see a preview of how it looks. If it\'s not quite right, click Remove and try a different image.' },
        ]
      },
      {
        title: 'Save and check it looks right',
        steps: [
          { text: 'When you\'re happy, click Save Changes at the bottom of the page.', screenshot: true },
          { text: 'To see how your booking page looks to clients, go to Booking Link in the sidebar and click the Visit Booking Page button. This opens your public page in a new tab.' },
          { text: 'If anything doesn\'t look right, just go back to Settings > Business Profile and update it.' },
        ]
      },
    ],
    faqs: [
      { q: 'Can I change my business name later?', a: 'Yes, you can update your business name at any time from Settings > Business Profile. Changes take effect immediately.' },
      { q: 'What size should my logo be?', a: 'We recommend a square image, at least 400×400 pixels. PNG files with a transparent background look cleanest.' },
      { q: 'My address isn\'t showing on my booking page — why?', a: 'Make sure you\'ve clicked Save Changes after filling in your address. If it\'s still not appearing, try refreshing the page.' },
    ],
    related: ['first-steps-after-signing-up', 'add-a-service', 'set-up-booking-link'],
  },

  {
    id: 'first-steps-after-signing-up',
    categoryId: 'getting-started',
    title: 'The first things to do after signing up',
    intro: 'Welcome to ReeveOS! Once you\'ve created your account, there are five things we\'d suggest doing in order. It takes about 20 minutes — and once they\'re done, you\'ll be ready to take your first real booking.',
    toc: ['Step 1 — Complete your business profile', 'Step 2 — Add your services', 'Step 3 — Add your staff', 'Step 4 — Set your opening hours', 'Step 5 — Share your booking link'],
    sections: [
      {
        title: 'Step 1 — Complete your business profile',
        steps: [
          { text: 'Go to Settings > Business Profile and fill in your business name, address, phone number, and a short description.', screenshot: true },
          { text: 'Upload your logo and a cover photo. This is what clients see first — a good photo makes a brilliant impression.' },
          { text: 'Click Save Changes when you\'re done.' },
        ]
      },
      {
        title: 'Step 2 — Add your services',
        steps: [
          { text: 'Click Services in the left sidebar.', screenshot: true },
          { text: 'Click Add Service and fill in the name, price, and how long it takes.' },
          { text: 'Do this for every treatment or service you offer. You can always add more later — but the more you add now, the better your booking page looks.' },
        ]
      },
      {
        title: 'Step 3 — Add your staff',
        steps: [
          { text: 'Click Staff in the left sidebar, then Add Staff Member.', screenshot: true },
          { text: 'Enter their name, email address, and which services they perform.' },
          { text: 'Set their working days and hours. This controls when they show up as available on the calendar.' },
        ]
      },
      {
        title: 'Step 4 — Set your opening hours',
        steps: [
          { text: 'Go to Settings > Opening Hours.', screenshot: true },
          { text: 'Tick the days you\'re open and set your opening and closing times for each one.' },
          { text: 'Click Save. Clients won\'t be able to book outside these hours.' },
        ]
      },
      {
        title: 'Step 5 — Share your booking link',
        steps: [
          { text: 'Click Booking Link in the left sidebar.', screenshot: true },
          { text: 'You\'ll see your unique booking URL. Copy it and share it — put it in your Instagram bio, your Google Business Profile, your Facebook page, anywhere.' },
          { text: 'That\'s it. You\'re live and ready to take bookings.' },
        ]
      },
    ],
    faqs: [
      { q: 'Do I have to add everything before I can take bookings?', a: 'You need at least one service added before your booking page will show anything to clients. Everything else can be filled in gradually.' },
      { q: 'Can I come back and change things later?', a: 'Absolutely. Nothing is permanent. You can update your profile, services, staff, and hours at any time.' },
    ],
    related: ['set-up-business-profile', 'add-a-service', 'invite-staff-member'],
  },

  {
    id: 'onboarding-wizard',
    categoryId: 'getting-started',
    title: 'How the onboarding wizard works',
    intro: 'When you first log in, ReeveOS walks you through a short setup wizard. It\'s designed to get you ready to take bookings as quickly as possible. Here\'s what it does and how to use it.',
    toc: ['What the wizard covers', 'How to complete each step', 'What to do if you skip something'],
    sections: [
      {
        title: 'What the wizard covers',
        steps: [
          { text: 'The wizard has six steps: choosing your business type, adding your first service, setting your hours, adding a staff member, uploading your logo, and getting your booking link.', screenshot: true },
          { text: 'Each step is optional — you can skip any step and come back to it later. But the more you complete now, the better your booking page looks from day one.' },
        ]
      },
      {
        title: 'How to complete each step',
        steps: [
          { text: 'Follow the instructions on each screen. They\'re written in plain English — if anything isn\'t clear, there\'s a small question mark icon next to each field that explains what it\'s for.', screenshot: true },
          { text: 'Use the Next button to move forward, or Back to go to the previous step.' },
          { text: 'On the final step, click Finish Setup. Your dashboard opens and you\'re ready to go.' },
        ]
      },
      {
        title: 'What to do if you skip something',
        steps: [
          { text: 'If you skipped a step and want to come back to it, everything is available in your Settings and the relevant sections of your sidebar.', screenshot: true },
          { text: 'For example, if you skipped adding services, just go to Services > Add Service. If you skipped your logo, go to Settings > Business Profile.' },
          { text: 'The wizard won\'t appear again once you\'ve finished — but you\'re not missing anything. Everything in the wizard is accessible from your normal dashboard.' },
        ]
      },
    ],
    faqs: [
      { q: 'Can I restart the wizard?', a: 'The wizard only appears once on your first login. After that, everything is available through Settings and the sidebar.' },
      { q: 'I accidentally closed the wizard — what do I do?', a: 'No problem. It was just a guide. Everything you need is in your sidebar and Settings. Start with Services, then Staff, then Booking Link.' },
    ],
    related: ['first-steps-after-signing-up', 'set-up-business-profile'],
  },

  {
    id: 'business-types',
    categoryId: 'getting-started',
    title: 'What business types are supported',
    intro: 'ReeveOS is built for a wide range of independent businesses. When you sign up, you choose your business type — and your whole dashboard adjusts to match how you work. Here\'s what that means in practice.',
    toc: ['The two main categories', 'Service businesses', 'Hospitality businesses', 'How to change your business type'],
    sections: [
      {
        title: 'The two main categories',
        steps: [
          { text: 'When you first log in, you choose between Local Services or Hospitality. This is the top-level setting that shapes your whole dashboard.', screenshot: true },
          { text: 'Local Services is for appointment-based businesses — salons, clinics, barbers, personal trainers, tutors, and similar.' },
          { text: 'Hospitality is for food and drink businesses — restaurants, bars, pubs, cafés, and takeaways.' },
        ]
      },
      {
        title: 'Service businesses (Local Services)',
        steps: [
          { text: 'If you choose Local Services, your dashboard includes: Calendar, Bookings, Clients, Services, Consultation Forms, and Client Portal.', screenshot: true },
          { text: 'The language throughout adjusts to match — you\'ll see "Appointments" not "Reservations", "Therapist" not "Waiter", and so on.' },
          { text: 'Specific business types include: hair salons, beauty clinics, aesthetics, nail studios, barbershops, spas, tattoo parlours, physiotherapy, personal training, tutoring, and more.' },
        ]
      },
      {
        title: 'Hospitality businesses',
        steps: [
          { text: 'If you choose Hospitality, your dashboard includes: Calendar, Floor Plan, Orders, Menu, Reservations, and Kitchen Display.', screenshot: true },
          { text: 'The language adjusts to match — "Covers" not "Clients", "Table" not "Appointment slot", and so on.' },
          { text: 'Specific business types include: restaurants, bars, pubs, cafés, takeaways, food trucks, and catering businesses.' },
        ]
      },
      {
        title: 'How to change your business type',
        steps: [
          { text: 'Your business type is set during onboarding. If you need to change it, contact our support team and we\'ll update it for you.', screenshot: false },
          { text: 'Note: Changing business type will adjust which features are visible in your dashboard. Your data isn\'t deleted — it stays safe.' },
        ]
      },
    ],
    faqs: [
      { q: 'I run a spa that also has a café — which do I choose?', a: 'Choose the one that\'s your main business. Most spa/café combos do better on Local Services because the appointment side is the core of the business.' },
      { q: 'Can I have both types on one account?', a: 'Not on one account, but if you have a second location that\'s a different type, you can set up a separate business account for it.' },
    ],
    related: ['first-steps-after-signing-up', 'set-up-business-profile'],
  },

  {
    id: 'switch-business-type',
    categoryId: 'getting-started',
    title: 'Switching between Hospitality and Local Services',
    intro: 'If your business type was set incorrectly during setup, or your business has changed, here\'s how to get it updated.',
    toc: ['When you\'d need to switch', 'What changes when you switch', 'How to request a switch'],
    sections: [
      {
        title: 'When you\'d need to switch',
        steps: [
          { text: 'You\'d need to switch if you chose the wrong type during sign-up, or if your business has genuinely changed — for example, a café that has started doing beauty treatments.' },
        ]
      },
      {
        title: 'What changes when you switch',
        steps: [
          { text: 'The sidebar changes — different pages become available. For example, Floor Plan only appears for Hospitality businesses, and Consultation Forms only appear for Local Services.', screenshot: true },
          { text: 'The language throughout the platform adjusts. Your existing data — clients, bookings, services — stays exactly where it is.' },
        ]
      },
      {
        title: 'How to request a switch',
        steps: [
          { text: 'Go to Settings > Business Profile and scroll to the bottom.', screenshot: true },
          { text: 'Click Request Business Type Change. Fill in the short form explaining what you need.' },
          { text: 'Our team will review it and update your account, usually within one working day.' },
        ]
      },
    ],
    faqs: [
      { q: 'Will my data be lost if I switch?', a: 'No. Your clients, bookings, and services are all preserved. Only the dashboard layout changes.' },
    ],
    related: ['business-types', 'first-steps-after-signing-up'],
  },

  // ─────────────────────────────────────────────────────────────
  // HOME DASHBOARD
  // ─────────────────────────────────────────────────────────────
  {
    id: 'what-dashboard-shows',
    categoryId: 'dashboard',
    title: 'What your home dashboard shows you',
    intro: 'Your dashboard is the first thing you see when you log in. It\'s designed to give you a quick picture of how your business is doing today — without you having to go looking for anything.',
    toc: ['The stats at the top', 'Today\'s appointments', 'The activity feed', 'The trends chart'],
    sections: [
      {
        title: 'The stats at the top',
        steps: [
          { text: 'At the very top of your dashboard, you\'ll see a row of numbers — things like total bookings today, revenue, and upcoming appointments.', screenshot: true },
          { text: 'These update in real time. So if a new booking comes in while you\'re looking at the screen, the number goes up straight away.' },
          { text: 'Each stat has a small arrow showing whether it\'s up or down compared to yesterday. Green means up, red means down.' },
        ]
      },
      {
        title: 'Today\'s appointments',
        steps: [
          { text: 'Below the stats, you\'ll see a list of today\'s upcoming appointments — who\'s coming in, what for, and when.', screenshot: true },
          { text: 'Click any appointment to open its details — you can see the client\'s name, their notes, and what was booked.' },
          { text: 'Appointments that have already happened are marked as Completed in green. Upcoming ones show the time.' },
        ]
      },
      {
        title: 'The activity feed',
        steps: [
          { text: 'On the right side of the dashboard, there\'s a live feed of recent activity — new bookings, cancellations, reviews, and payments.', screenshot: true },
          { text: 'This shows you what\'s happening in your business at a glance. It shows the 10 most recent events and refreshes automatically.' },
        ]
      },
      {
        title: 'The trends chart',
        steps: [
          { text: 'Further down, there\'s a chart showing your booking patterns over time.', screenshot: true },
          { text: 'Use the Today / Week / Month toggle at the top right of the chart to change the time period.' },
          { text: 'The chart helps you spot your busy and quiet periods so you can plan accordingly.' },
        ]
      },
    ],
    faqs: [
      { q: 'Why is my dashboard empty?', a: 'If you\'ve just signed up, there\'s no data yet — the dashboard only shows real information. Once bookings start coming in, everything fills up automatically.' },
      { q: 'How often does the dashboard refresh?', a: 'The stats update every 20 seconds automatically. You don\'t need to refresh the page.' },
    ],
    related: ['analytics-overview', 'todays-calendar'],
  },

  {
    id: 'dashboard-empty',
    categoryId: 'dashboard',
    title: 'Why does my dashboard look empty?',
    intro: 'If you\'ve just signed up, it\'s completely normal for your dashboard to show zeros and empty lists. Here\'s why — and how to get data appearing.',
    toc: ['Why it\'s empty', 'How to get data appearing', 'What you\'ll see once you\'re live'],
    sections: [
      {
        title: 'Why it\'s empty',
        steps: [
          { text: 'ReeveOS only ever shows you real information. There\'s no demo data or sample numbers — what you see is always what\'s actually happening in your business.', screenshot: false },
          { text: 'When you first sign up, no bookings have come in yet, so the dashboard shows empty states instead of made-up numbers.' },
        ]
      },
      {
        title: 'How to get data appearing',
        steps: [
          { text: 'Make sure you\'ve added at least one service — clients can\'t book anything if there\'s nothing on your booking page.', screenshot: true },
          { text: 'Share your booking link. Put it in your Instagram bio, your Google profile, your website — wherever your clients will see it.' },
          { text: 'Once your first booking comes in, the dashboard starts filling up.' },
          { text: 'You can also create a booking manually yourself — just click the + button on your calendar. That counts as a booking and will show on your dashboard.' },
        ]
      },
      {
        title: 'What you\'ll see once you\'re live',
        steps: [
          { text: 'Once bookings are coming in, your dashboard will show: total bookings today, revenue today, upcoming appointments, recent activity, and booking trends over time.', screenshot: true },
        ]
      },
    ],
    faqs: [
      { q: 'Is something broken if it\'s all empty?', a: 'Almost certainly not. An empty dashboard just means no bookings have come in yet. Check that you\'ve added a service and shared your booking link.' },
    ],
    related: ['what-dashboard-shows', 'set-up-booking-link'],
  },

  {
    id: 'appointment-trends',
    categoryId: 'dashboard',
    title: 'Understanding the Appointment Trends chart',
    intro: 'The Appointment Trends chart is your quick view of how busy your business has been and where bookings are heading. Here\'s how to read it.',
    toc: ['Where to find the chart', 'How to read it', 'Changing the time period'],
    sections: [
      {
        title: 'Where to find the chart',
        steps: [
          { text: 'The chart is on your home dashboard, about halfway down the page.', screenshot: true },
        ]
      },
      {
        title: 'How to read it',
        steps: [
          { text: 'The bars or line on the chart show you how many bookings happened on each day, week, or month.', screenshot: true },
          { text: 'Hover over any bar to see the exact number for that period.' },
          { text: 'For restaurants, the chart shows covers (number of guests) instead of appointments.' },
        ]
      },
      {
        title: 'Changing the time period',
        steps: [
          { text: 'In the top right corner of the chart, there are three buttons: Today, Week, Month.', screenshot: true },
          { text: 'Click any of them to change what the chart shows. Month view is most useful for spotting patterns — like which weeks are always quiet.' },
        ]
      },
    ],
    faqs: [
      { q: 'Can I see data from further back than a month?', a: 'For more detailed historical data, head to Analytics in the sidebar. The dashboard chart is just a quick snapshot.' },
    ],
    related: ['what-dashboard-shows', 'analytics-overview'],
  },

  {
    id: 'activity-feed',
    categoryId: 'dashboard',
    title: 'How the activity feed works',
    intro: 'The activity feed shows you everything that\'s happening in your business in real time. New bookings, cancellations, payments, reviews — it all appears here.',
    toc: ['Where to find it', 'What it shows', 'How to act on activity'],
    sections: [
      {
        title: 'Where to find it',
        steps: [
          { text: 'The activity feed is on the right side of your home dashboard. It\'s a scrolling list of recent events.', screenshot: true },
        ]
      },
      {
        title: 'What it shows',
        steps: [
          { text: 'New bookings — who booked, what they booked, and when.', screenshot: true },
          { text: 'Cancellations — if a client cancels, it appears here with their name and the booking they cancelled.' },
          { text: 'Payments — when a booking fee or purchase goes through.' },
          { text: 'Reviews — when a client leaves a review.' },
          { text: 'Staff changes — if a team member updates their availability or details.' },
          { text: 'The feed shows the 10 most recent events and updates automatically as new ones come in.' },
        ]
      },
      {
        title: 'How to act on activity',
        steps: [
          { text: 'Click any item in the activity feed to go straight to the relevant booking, client, or review.', screenshot: true },
        ]
      },
    ],
    faqs: [
      { q: 'Can I see older activity?', a: 'The feed on the dashboard shows the 10 most recent events. For a full history, go to Analytics > Activity Log.' },
    ],
    related: ['what-dashboard-shows'],
  },

  {
    id: 'quick-actions',
    categoryId: 'dashboard',
    title: 'Using the quick action buttons',
    intro: 'Quick action buttons let you jump straight to common tasks without hunting through the sidebar. Here\'s what each one does.',
    toc: ['Where to find quick actions', 'What each button does'],
    sections: [
      {
        title: 'Where to find quick actions',
        steps: [
          { text: 'Quick action buttons are in the top section of your home dashboard, just below the stats row.', screenshot: true },
        ]
      },
      {
        title: 'What each button does',
        steps: [
          { text: 'New Booking — opens the booking form so you can manually create an appointment.', screenshot: true },
          { text: 'Add Walk-in — creates an instant unscheduled appointment for a client who has just walked in.' },
          { text: 'View Today — jumps to today\'s calendar view showing all appointments.' },
          { text: 'View Clients — takes you straight to your client list.' },
        ]
      },
    ],
    faqs: [
      { q: 'Can I customise which quick actions appear?', a: 'Not yet — but this is something we\'re planning to add in a future update.' },
    ],
    related: ['what-dashboard-shows', 'create-booking-calendar'],
  },

  // ─────────────────────────────────────────────────────────────
  // CALENDAR & SCHEDULING
  // ─────────────────────────────────────────────────────────────
  {
    id: 'create-booking-calendar',
    categoryId: 'calendar',
    title: 'How to create a new booking from the calendar',
    intro: 'You can add a new appointment directly from your calendar in just a few clicks. Here\'s how.',
    toc: ['Open your calendar', 'Click an empty time slot', 'Fill in the booking details', 'Confirm the booking'],
    sections: [
      {
        title: 'Open your calendar',
        steps: [
          { text: 'Click Calendar in the left sidebar.', screenshot: true },
          { text: 'You\'ll see your calendar in day view by default. Each column represents a staff member. Each row is a time slot.' },
        ]
      },
      {
        title: 'Click an empty time slot',
        steps: [
          { text: 'Find the time and staff member you want to book. Click the empty slot at that time.', screenshot: true },
          { text: 'A booking panel will slide in from the right side of the screen.' },
        ]
      },
      {
        title: 'Fill in the booking details',
        steps: [
          { text: 'Search for the client by typing their name or phone number. If they\'re new, click Add New Client and enter their details.', screenshot: true },
          { text: 'Select the service from the dropdown. The duration fills in automatically based on how long that service takes.' },
          { text: 'Check the date and time — they\'ll be pre-filled from the slot you clicked, but you can change them here.' },
          { text: 'Add any notes you want to remember about this appointment — for example, "Client prefers no small talk" or "Uses size 3 foils."' },
        ]
      },
      {
        title: 'Confirm the booking',
        steps: [
          { text: 'Click Confirm Booking. The appointment appears on the calendar straight away.', screenshot: true },
          { text: 'If your notification settings are turned on, the client will automatically receive a confirmation email or text.' },
        ]
      },
    ],
    faqs: [
      { q: 'Can I create a booking without a client name?', a: 'Yes — if you\'re adding a quick walk-in, you can leave the client field blank. Just note that you won\'t be able to send them a confirmation or add them to your client book.' },
      { q: 'What if the time slot is already taken?', a: 'The calendar won\'t let you double-book. Taken slots are shown in colour. Choose a different time or a different staff member.' },
    ],
    related: ['drag-drop-appointments', 'reschedule-booking'],
  },

  {
    id: 'drag-drop-appointments',
    categoryId: 'calendar',
    title: 'Dragging and dropping appointments',
    intro: 'You can move appointments around your calendar by dragging them — no need to cancel and rebook. Here\'s how it works.',
    toc: ['How to drag an appointment', 'Moving to a different staff member', 'Changing the duration', 'Undoing a move'],
    sections: [
      {
        title: 'How to drag an appointment',
        steps: [
          { text: 'On your calendar, find the appointment you want to move.', screenshot: true },
          { text: 'Click and hold on it. After a second, it lifts off the calendar.' },
          { text: 'Drag it to the new time you want and let go. It drops into the new slot.', screenshot: true },
          { text: 'The system checks for conflicts — if the new time is already taken, it snaps back to where it was.' },
        ]
      },
      {
        title: 'Moving to a different staff member',
        steps: [
          { text: 'To move an appointment to a different staff member, drag it sideways into their column.', screenshot: true },
          { text: 'The booking will update to reflect the new staff member. If your notification settings are on, the client will be notified of the change.' },
        ]
      },
      {
        title: 'Changing the duration',
        steps: [
          { text: 'To make an appointment longer or shorter, hover over the bottom edge of it on the calendar. A small resize handle appears.', screenshot: true },
          { text: 'Drag the bottom edge down to make it longer, or up to make it shorter.' },
        ]
      },
      {
        title: 'Undoing a move',
        steps: [
          { text: 'Straight after moving an appointment, a small notification appears at the bottom of the screen with an Undo button.', screenshot: true },
          { text: 'Click Undo within a few seconds to move it back to where it was.' },
          { text: 'After the notification disappears, the move is permanent — but you can always drag it back manually.' },
        ]
      },
    ],
    faqs: [
      { q: 'Does the client get notified when I move their appointment?', a: 'Yes, if you have appointment change notifications turned on in Settings. They\'ll receive an email or text with the updated time.' },
    ],
    related: ['create-booking-calendar', 'reschedule-booking'],
  },

  {
    id: 'reschedule-booking',
    categoryId: 'calendar',
    title: 'How to reschedule a booking',
    intro: 'Need to move a client\'s appointment? You can reschedule it in two ways — by dragging it on the calendar, or by opening the booking and changing the time. Both take about 30 seconds.',
    toc: ['Option 1 — Drag it on the calendar', 'Option 2 — Change it in the booking details', 'Notifying the client'],
    sections: [
      {
        title: 'Option 1 — Drag it on the calendar',
        steps: [
          { text: 'Find the appointment on your calendar, click and hold it, and drag it to the new time.', screenshot: true },
          { text: 'This is the quickest way if you can see both the old time and new time on screen at the same time.' },
        ]
      },
      {
        title: 'Option 2 — Change it in the booking details',
        steps: [
          { text: 'Click the appointment on the calendar to open its details in the right panel.', screenshot: true },
          { text: 'Click the date or time to edit it. A date picker opens.' },
          { text: 'Select the new date and time, then click Save.', screenshot: true },
        ]
      },
      {
        title: 'Notifying the client',
        steps: [
          { text: 'After you save the change, a popup asks whether you\'d like to notify the client.', screenshot: true },
          { text: 'Click Send Notification to email or text them the new details. Click Skip if you\'ve already spoken to them.' },
        ]
      },
    ],
    faqs: [
      { q: 'Can clients reschedule themselves?', a: 'Yes — if you have the client portal enabled, clients can reschedule their own bookings up to your cancellation policy window. After that, they\'ll need to contact you.' },
    ],
    related: ['drag-drop-appointments', 'cancel-appointment'],
  },

  {
    id: 'calendar-colours',
    categoryId: 'calendar',
    title: 'What the different colours on the calendar mean',
    intro: 'Your calendar uses colours to help you see who\'s doing what and the status of each appointment at a glance. Here\'s the key.',
    toc: ['Staff colours', 'Appointment status colours', 'Other visual markers'],
    sections: [
      {
        title: 'Staff colours',
        steps: [
          { text: 'Each staff member has their own colour. This makes it easy to see at a glance who is doing what throughout the day.', screenshot: true },
          { text: 'You can change a staff member\'s colour from their profile in Staff > [Name] > Edit.' },
        ]
      },
      {
        title: 'Appointment status colours',
        steps: [
          { text: 'Confirmed appointments have a solid colour and a small tick icon.', screenshot: true },
          { text: 'Pending appointments (waiting for confirmation) have a lighter, more faded look.' },
          { text: 'Completed appointments have a green border.' },
          { text: 'Cancelled appointments are crossed out and appear in grey.' },
          { text: 'No-show appointments have a red indicator.' },
        ]
      },
      {
        title: 'Other visual markers',
        steps: [
          { text: 'A "New Client" badge appears on the appointment card for clients who are visiting for the first time.', screenshot: true },
          { text: 'A small flag icon appears if the client has a flagged consultation form — something the therapist should review before the appointment.' },
          { text: 'Blocked time (breaks, meetings) appears as a hatched grey pattern.' },
        ]
      },
    ],
    faqs: [
      { q: 'Can I change what colours mean?', a: 'Staff colours can be changed. Status colours (confirmed, cancelled, etc.) are fixed — they\'re the same for everyone so nothing gets confusing.' },
    ],
    related: ['create-booking-calendar', 'block-out-time'],
  },

  {
    id: 'cancel-appointment',
    categoryId: 'calendar',
    title: 'How to cancel an appointment',
    intro: 'Cancelling an appointment takes just a few seconds. Here\'s how to do it and what happens afterwards.',
    toc: ['How to cancel', 'What happens when you cancel', 'Handling no-shows'],
    sections: [
      {
        title: 'How to cancel',
        steps: [
          { text: 'Click the appointment on your calendar.', screenshot: true },
          { text: 'In the details panel on the right, scroll down and click Cancel Appointment.' },
          { text: 'A confirmation box appears — click Confirm Cancellation.', screenshot: true },
          { text: 'You\'ll be asked if you want to notify the client. Click Yes to send them a message, or No if you\'ve already spoken to them.' },
        ]
      },
      {
        title: 'What happens when you cancel',
        steps: [
          { text: 'The appointment is removed from the calendar. The time slot becomes available again.', screenshot: true },
          { text: 'The cancellation is logged in your Bookings history, so you have a record of it.' },
          { text: 'If the client paid a booking fee, you\'ll be asked whether to refund it or retain it based on your cancellation policy.' },
        ]
      },
      {
        title: 'Handling no-shows',
        steps: [
          { text: 'If a client doesn\'t turn up, click the appointment and select Mark as No-Show.', screenshot: true },
          { text: 'This is logged separately from cancellations. If you have No-Show Protection enabled (in Payments settings), you can charge the card on file.' },
        ]
      },
    ],
    faqs: [
      { q: 'Can I undo a cancellation?', a: 'Not automatically — but you can always create a new booking for the same client, same service, same time. The old cancellation stays in your records.' },
      { q: 'Will cancelled bookings show in my analytics?', a: 'Yes. Cancellations and no-shows are tracked separately in your Analytics so you can spot patterns.' },
    ],
    related: ['reschedule-booking', 'no-show-protection'],
  },

  {
    id: 'block-out-time',
    categoryId: 'calendar',
    title: 'How to block out time on the calendar',
    intro: 'Need to block time for a staff break, a training session, or any reason you can\'t take bookings? Here\'s how.',
    toc: ['How to add a block', 'Setting the reason', 'Removing a block'],
    sections: [
      {
        title: 'How to add a block',
        steps: [
          { text: 'On your calendar, click an empty time slot at the start of the period you want to block.', screenshot: true },
          { text: 'In the panel that opens, instead of filling in a client name, click Block Time.' },
          { text: 'Set the start time, end time, and which staff member the block applies to.', screenshot: true },
          { text: 'Click Save Block. The time appears on the calendar as a hatched grey area — clients can\'t book into it.' },
        ]
      },
      {
        title: 'Setting the reason',
        steps: [
          { text: 'When blocking time, you can add a reason — for example: Break, Lunch, Training, Meeting, or a custom note.', screenshot: true },
          { text: 'This is just for your own records — clients don\'t see the reason.' },
        ]
      },
      {
        title: 'Removing a block',
        steps: [
          { text: 'Click the blocked area on the calendar.', screenshot: true },
          { text: 'Click Remove Block in the panel. The time slot becomes available for bookings again.' },
        ]
      },
    ],
    faqs: [
      { q: 'Can I block time for just one staff member?', a: 'Yes. When you create the block, select which staff member it applies to. Other staff members stay available.' },
      { q: 'Can I set recurring blocks — like a lunch break every day?', a: 'You can set regular staff hours and breaks in Staff > Availability, which is easier for recurring patterns. The calendar block is better for one-off closures.' },
    ],
    related: ['cancel-appointment', 'set-staff-availability'],
  },

  {
    id: 'undo-calendar-changes',
    categoryId: 'calendar',
    title: 'Undoing changes on the calendar',
    intro: 'Moved something by accident? Here\'s how to undo it before it becomes permanent.',
    toc: ['Using the undo notification', 'What can and can\'t be undone'],
    sections: [
      {
        title: 'Using the undo notification',
        steps: [
          { text: 'Whenever you move or reschedule an appointment, a small notification bar appears at the bottom of your screen.', screenshot: true },
          { text: 'It says something like "Appointment moved to 3:00 PM — Undo". Click the Undo button within about 5 seconds to reverse the change.' },
          { text: 'After the notification disappears, the change is permanent — but you can always move the appointment manually again.' },
        ]
      },
      {
        title: 'What can and can\'t be undone',
        steps: [
          { text: 'Can be undone: dragging an appointment to a new time, resizing its duration.', screenshot: false },
          { text: 'Cannot be undone with the undo button: cancellations, deletions. For those, you\'d need to create a new booking.' },
        ]
      },
    ],
    faqs: [
      { q: 'I missed the undo window — is it gone forever?', a: 'If you moved it, just drag it back. If you cancelled it, create a new booking for the same client — it only takes 30 seconds.' },
    ],
    related: ['drag-drop-appointments', 'reschedule-booking'],
  },

  {
    id: 'first-time-client-extra-time',
    categoryId: 'calendar',
    title: 'Adding extra time for first-time client appointments',
    intro: 'Some businesses add extra time for new clients — for a quick consultation before getting started. Here\'s how to set that up.',
    toc: ['What extra time does', 'How to set it up', 'How it looks on the calendar'],
    sections: [
      {
        title: 'What extra time does',
        steps: [
          { text: 'When extra time is enabled for a service, the system automatically adds a set amount of time to the start of any appointment where the client is new.', screenshot: false },
          { text: 'For example, if a facial normally takes 60 minutes, a new client appointment might be booked as 75 minutes — 15 for a quick chat, 60 for the treatment.' },
          { text: 'The client only sees "60 minutes" on their confirmation. The extra time is just for your calendar.' },
        ]
      },
      {
        title: 'How to set it up',
        steps: [
          { text: 'Go to Services in the sidebar and click on the service you want to adjust.', screenshot: true },
          { text: 'Scroll down to the section called New Client Buffer Time.' },
          { text: 'Enter how many extra minutes you want to add for first-time clients.', screenshot: true },
          { text: 'Click Save Service.' },
        ]
      },
      {
        title: 'How it looks on the calendar',
        steps: [
          { text: 'New client appointments appear slightly longer on your calendar, with a small "New Client" badge on the card.', screenshot: true },
        ]
      },
    ],
    faqs: [
      { q: 'Does the client see the extra time?', a: 'No. On their confirmation, they see the standard service duration. The extra time is only visible on your calendar.' },
    ],
    related: ['create-booking-calendar', 'add-a-service'],
  },

  // ─────────────────────────────────────────────────────────────
  // BOOKINGS MANAGEMENT
  // ─────────────────────────────────────────────────────────────
  {
    id: 'view-all-bookings',
    categoryId: 'bookings',
    title: 'How to view and search your bookings',
    intro: 'Your Bookings page gives you a full list of every appointment — past, present, and future. Here\'s how to find what you\'re looking for.',
    toc: ['Open your Bookings list', 'Filter by status', 'Search for a specific client', 'Export your bookings'],
    sections: [
      {
        title: 'Open your Bookings list',
        steps: [
          { text: 'Click Bookings in the left sidebar.', screenshot: true },
          { text: 'You\'ll see a list of all your bookings, most recent first.' },
        ]
      },
      {
        title: 'Filter by status',
        steps: [
          { text: 'At the top of the list, there\'s a row of filter buttons: All, Confirmed, Pending, Completed, Cancelled, No-Show.', screenshot: true },
          { text: 'Click any of them to filter the list. For example, clicking No-Show shows only clients who didn\'t turn up.' },
          { text: 'You can also filter by date range using the date picker at the top right.' },
        ]
      },
      {
        title: 'Search for a specific client',
        steps: [
          { text: 'Use the search bar at the top of the Bookings page.', screenshot: true },
          { text: 'Type the client\'s name, phone number, or email address. The list filters in real time as you type.' },
        ]
      },
      {
        title: 'Export your bookings',
        steps: [
          { text: 'To export your bookings as a spreadsheet, click the Export button in the top right corner of the Bookings page.', screenshot: true },
          { text: 'Choose your date range and click Download. A CSV file is downloaded to your computer, which you can open in Excel or Google Sheets.' },
        ]
      },
    ],
    faqs: [
      { q: 'How far back do my bookings go?', a: 'All the way back to your first booking on ReeveOS. There\'s no limit.' },
    ],
    related: ['booking-statuses', 'analytics-overview'],
  },

  {
    id: 'booking-statuses',
    categoryId: 'bookings',
    title: 'What the booking statuses mean',
    intro: 'Every booking in your system has a status. Here\'s what each one means and when to use them.',
    toc: ['Pending', 'Confirmed', 'Completed', 'Cancelled', 'No-Show'],
    sections: [
      {
        title: 'Pending',
        steps: [
          { text: 'A booking is Pending when it\'s been made but not yet confirmed — usually because you have manual approval turned on.', screenshot: true },
          { text: 'Pending bookings appear on your calendar in a lighter colour. You need to either confirm or decline them.' },
        ]
      },
      {
        title: 'Confirmed',
        steps: [
          { text: 'Confirmed means the booking is accepted and locked in. The client has a confirmed appointment.', screenshot: true },
          { text: 'Most bookings go straight to Confirmed unless you have manual approval enabled.' },
        ]
      },
      {
        title: 'Completed',
        steps: [
          { text: 'After the appointment time has passed, you can mark it as Completed. This triggers the post-appointment follow-up (review request, aftercare email).', screenshot: true },
          { text: 'Completed bookings are included in your revenue figures and analytics.' },
        ]
      },
      {
        title: 'Cancelled',
        steps: [
          { text: 'Cancelled means the booking won\'t happen — either you or the client cancelled it.', screenshot: true },
          { text: 'The cancellation is logged with a timestamp and, if applicable, whether the booking fee was refunded or retained.' },
        ]
      },
      {
        title: 'No-Show',
        steps: [
          { text: 'A No-Show is when the client didn\'t turn up and didn\'t cancel.', screenshot: true },
          { text: 'Marking a booking as No-Show logs it separately from cancellations, which helps you track repeat offenders. If you have No-Show Protection on, you can charge the card on file.' },
        ]
      },
    ],
    faqs: [
      { q: 'Can I change a booking\'s status manually?', a: 'Yes. Open any booking and use the Status dropdown to change it to whatever is appropriate.' },
    ],
    related: ['view-all-bookings', 'no-show-protection'],
  },

  {
    id: 'no-show-protection',
    categoryId: 'bookings',
    title: 'How to handle no-shows',
    intro: 'A no-show costs you time and money. Here\'s how to mark them, log them, and optionally charge clients who don\'t turn up.',
    toc: ['Marking a no-show', 'Charging for a no-show', 'Tracking no-show patterns'],
    sections: [
      {
        title: 'Marking a no-show',
        steps: [
          { text: 'Open the appointment from your calendar or Bookings list.', screenshot: true },
          { text: 'Click Mark as No-Show from the status options.' },
          { text: 'Confirm. The booking is logged as a no-show, separate from cancellations.', screenshot: true },
        ]
      },
      {
        title: 'Charging for a no-show',
        steps: [
          { text: 'To be able to charge for no-shows, you need No-Show Protection turned on. Go to Settings > Payments and enable it.', screenshot: true },
          { text: 'Once enabled, when a client books online they\'re asked to save a card. If they don\'t show up, you can charge that card.' },
          { text: 'After marking a no-show, a button appears: Charge No-Show Fee. Click it to charge the set amount to their saved card.' },
          { text: 'The client receives a notification that they\'ve been charged, along with a receipt.' },
        ]
      },
      {
        title: 'Tracking no-show patterns',
        steps: [
          { text: 'Go to Analytics in the sidebar. You\'ll see a No-Show Rate metric showing what percentage of your bookings result in no-shows.', screenshot: true },
          { text: 'You can also see which individual clients have a no-show history — this appears on their client profile as a flag.' },
        ]
      },
    ],
    faqs: [
      { q: 'Can I block clients from booking if they\'ve no-showed before?', a: 'You can add a manual note to their profile warning your team. An automatic block feature is on our roadmap.' },
    ],
    related: ['booking-statuses', 'cancellation-policy'],
  },

  {
    id: 'online-client-booking',
    categoryId: 'bookings',
    title: 'How clients book themselves online',
    intro: 'When online booking is enabled, your clients can book their own appointments 24 hours a day without calling you. Here\'s exactly what they see and do.',
    toc: ['What your clients see', 'How they choose a service and time', 'What happens after they book'],
    sections: [
      {
        title: 'What your clients see',
        steps: [
          { text: 'When a client clicks your booking link, they land on your public booking page — showing your logo, business name, cover photo, and the list of services they can book.', screenshot: true },
          { text: 'If you\'ve set up multiple staff members, they can choose who they\'d like to see. Or they can choose "Anyone available."' },
        ]
      },
      {
        title: 'How they choose a service and time',
        steps: [
          { text: 'They click the service they want.', screenshot: true },
          { text: 'A calendar appears showing available dates and times. Anything that\'s already booked or outside your hours is greyed out — they can\'t accidentally book those.' },
          { text: 'They pick a time, enter their name, phone number, and email, and click Confirm Booking.' },
          { text: 'If you have booking fees enabled, they\'ll be asked for their card details at this step.' },
        ]
      },
      {
        title: 'What happens after they book',
        steps: [
          { text: 'The booking appears on your calendar immediately.', screenshot: true },
          { text: 'The client receives a confirmation email with all the details — date, time, service, address, and a link to manage or cancel their booking.' },
          { text: 'You receive a notification too, so you always know when a new booking comes in.' },
        ]
      },
    ],
    faqs: [
      { q: 'Do I have to approve every online booking?', a: 'By default, online bookings are confirmed automatically. If you prefer to manually approve each one, go to Online Booking Settings and turn on Require Approval.' },
    ],
    related: ['set-up-booking-link', 'booking-fees'],
  },

  {
    id: 'booking-fees',
    categoryId: 'bookings',
    title: 'How booking fees work',
    intro: 'A booking fee (sometimes called a deposit) is a small amount clients pay upfront when they book. It dramatically reduces no-shows. Here\'s how to set it up.',
    toc: ['What a booking fee does', 'How to enable booking fees', 'What clients experience', 'What happens if they cancel'],
    sections: [
      {
        title: 'What a booking fee does',
        steps: [
          { text: 'A booking fee is charged to the client\'s card when they book online. It\'s deducted from their final bill on the day.', screenshot: false },
          { text: 'Because they\'ve paid something upfront, they\'re much less likely to not show up or cancel last minute.' },
        ]
      },
      {
        title: 'How to enable booking fees',
        steps: [
          { text: 'Go to Settings > Payments in the left sidebar.', screenshot: true },
          { text: 'Toggle on Booking Fees.' },
          { text: 'Set the amount — either a fixed amount (e.g., £10) or a percentage of the service price (e.g., 20%).', screenshot: true },
          { text: 'Click Save. Booking fees will now be required for all online bookings.' },
        ]
      },
      {
        title: 'What clients experience',
        steps: [
          { text: 'When a client books online, after choosing their service and time, they\'ll see a payment step.', screenshot: true },
          { text: 'They enter their card details. The booking fee is charged immediately. They receive a receipt by email.' },
          { text: 'On the day of their appointment, the fee is deducted from the total — so they pay the remainder.' },
        ]
      },
      {
        title: 'What happens if they cancel',
        steps: [
          { text: 'This depends on your cancellation policy (set in Settings > Payments).', screenshot: true },
          { text: 'If they cancel with enough notice (outside your policy window), they get a full refund.' },
          { text: 'If they cancel inside the cancellation window — or don\'t show up — the fee is retained by you.' },
        ]
      },
    ],
    faqs: [
      { q: 'Can I set different booking fees for different services?', a: 'At the moment, the booking fee applies to all services. Per-service fees are something we\'re working on.' },
    ],
    related: ['cancellation-policy', 'no-show-protection'],
  },

  {
    id: 'swap-service-on-booking',
    categoryId: 'bookings',
    title: 'How to change the service on an existing booking',
    intro: 'If a client wants to change what they\'re having done, you don\'t need to cancel and rebook. Here\'s how to swap the service on an existing booking.',
    toc: ['Open the booking', 'Change the service', 'Save the change'],
    sections: [
      {
        title: 'Open the booking',
        steps: [
          { text: 'Click the appointment on your calendar, or find it in the Bookings list.', screenshot: true },
        ]
      },
      {
        title: 'Change the service',
        steps: [
          { text: 'In the booking details panel, click on the service name. A dropdown appears.', screenshot: true },
          { text: 'Select the new service from the list.' },
          { text: 'The duration adjusts automatically to match the new service\'s length.' },
        ]
      },
      {
        title: 'Save the change',
        steps: [
          { text: 'Click Save Changes.', screenshot: true },
          { text: 'You\'ll be asked if you want to notify the client of the change. Click Send Notification to let them know, or Skip if you\'ve already told them.' },
        ]
      },
    ],
    faqs: [
      { q: 'What if the new service costs more or less?', a: 'The price is updated on the booking automatically. If there\'s a price difference and they paid a booking fee, you may want to discuss the balance with them at the appointment.' },
    ],
    related: ['reschedule-booking', 'create-booking-calendar'],
  },

  // ─────────────────────────────────────────────────────────────
  // BOOKING LINK & CHANNELS
  // ─────────────────────────────────────────────────────────────
  {
    id: 'set-up-booking-link',
    categoryId: 'booking-link',
    title: 'How to find and share your booking link',
    intro: 'Your booking link is your online shopfront — it\'s where clients go to book with you. It\'s live as soon as you sign up. Here\'s where to find it and how to share it.',
    toc: ['Finding your booking link', 'Sharing it on social media', 'Sharing it on your website', 'Tracking where bookings come from'],
    sections: [
      {
        title: 'Finding your booking link',
        steps: [
          { text: 'Click Booking Link in the left sidebar.', screenshot: true },
          { text: 'Your unique URL is shown at the top of the page. It looks something like: book.reeveos.app/your-business-name' },
          { text: 'Click the Copy button next to it to copy it to your clipboard.', screenshot: true },
        ]
      },
      {
        title: 'Sharing it on social media',
        steps: [
          { text: 'Instagram: Go to your Instagram profile, click Edit Profile, and paste the link into your Website or Bio field.', screenshot: false },
          { text: 'Facebook: Go to your business page, click Edit Page Info, and paste it into your website field.' },
          { text: 'WhatsApp Business: Add it to your Business Profile under Website.' },
          { text: 'In posts and stories: just share the link and tell your followers they can now book online.' },
        ]
      },
      {
        title: 'Sharing it on your website',
        steps: [
          { text: 'Copy your booking link and add it as a button on your website — something like "Book Now" or "Book an Appointment."', screenshot: false },
          { text: 'If you want an embedded widget instead, click Get Embed Code on the Booking Link page. Copy the code and paste it into your website\'s HTML where you want the booking form to appear.', screenshot: true },
        ]
      },
      {
        title: 'Tracking where bookings come from',
        steps: [
          { text: 'On the Booking Link page, you\'ll see performance stats: total visits, bookings, and the conversion rate (what percentage of visitors actually book).', screenshot: true },
          { text: 'Each booking also records which channel it came from — direct link, Google, Instagram, and so on.' },
        ]
      },
    ],
    faqs: [
      { q: 'Can I change my booking link URL?', a: 'You can update your business name in Settings, which changes the URL. Contact support if you need a specific URL.' },
    ],
    related: ['reserve-with-google', 'booking-channels'],
  },

  {
    id: 'reserve-with-google',
    categoryId: 'booking-link',
    title: 'How to set up Reserve with Google',
    intro: 'Reserve with Google puts a Book button directly on your Google Business Profile — so clients can book with you straight from Google Search and Maps without even visiting your website.',
    toc: ['What Reserve with Google does', 'How to connect it', 'What clients see'],
    sections: [
      {
        title: 'What Reserve with Google does',
        steps: [
          { text: 'When someone searches for your business on Google, they see your Business Profile — your address, hours, photos, and reviews.', screenshot: false },
          { text: 'With Reserve with Google enabled, a Book button appears right there. The client clicks it and books directly — all without leaving Google.' },
        ]
      },
      {
        title: 'How to connect it',
        steps: [
          { text: 'Go to Booking Link in the sidebar, then click the Channels tab.', screenshot: true },
          { text: 'Find Reserve with Google and click Connect.' },
          { text: 'You\'ll be asked to sign in with your Google account and confirm your Google Business Profile.', screenshot: true },
          { text: 'Once connected, it takes up to 48 hours for the Book button to appear on Google.' },
        ]
      },
      {
        title: 'What clients see',
        steps: [
          { text: 'On Google Search or Maps, your business listing will show a Book button alongside the usual Call and Directions buttons.', screenshot: false },
          { text: 'Clicking it opens your booking flow. The booking lands in your ReeveOS calendar just like any other.' },
        ]
      },
    ],
    faqs: [
      { q: 'Do I need a Google Business Profile?', a: 'Yes. If you haven\'t set one up yet, go to business.google.com and create a free profile for your business. It\'s worth doing regardless — it helps you show up on Google.' },
      { q: 'How long until the button appears?', a: 'Google says up to 48 hours, though it\'s often faster. If it hasn\'t appeared after 3 days, disconnect and reconnect from the Channels page.' },
    ],
    related: ['set-up-booking-link', 'booking-channels'],
  },

  {
    id: 'booking-channels',
    categoryId: 'booking-link',
    title: 'Connecting your booking link to different channels',
    intro: 'Your booking link can be connected to multiple platforms — Google, Instagram, Facebook, and more. Here\'s how each one works.',
    toc: ['Available channels', 'How to connect each one', 'Tracking which channel works best'],
    sections: [
      {
        title: 'Available channels',
        steps: [
          { text: 'Go to Booking Link > Channels to see all available integrations.', screenshot: true },
          { text: 'Available channels include: Reserve with Google, Instagram Book Button, Facebook Book Now, WhatsApp Click-to-Book, and direct link.' },
        ]
      },
      {
        title: 'How to connect each one',
        steps: [
          { text: 'Click Connect next to any channel. Each one has a short setup flow — usually just logging in with that platform\'s account.', screenshot: true },
          { text: 'Once connected, a green tick appears next to that channel.' },
        ]
      },
      {
        title: 'Tracking which channel works best',
        steps: [
          { text: 'On the Booking Link page, the stats section shows how many bookings came from each channel.', screenshot: true },
          { text: 'This helps you see where to focus your efforts — for example, if most bookings come from Instagram, it\'s worth posting more there.' },
        ]
      },
    ],
    faqs: [
      { q: 'Do I need to connect all channels?', a: 'No — add the ones that are relevant to your business. Most salons and clinics get great results from just Google and Instagram.' },
    ],
    related: ['set-up-booking-link', 'reserve-with-google'],
  },

  {
    id: 'embed-booking-widget',
    categoryId: 'booking-link',
    title: 'How to embed the booking widget on your website',
    intro: 'You can add your booking form directly to your own website — so clients don\'t have to leave your site to book. Here\'s how.',
    toc: ['Get the embed code', 'Add it to your website', 'How it looks'],
    sections: [
      {
        title: 'Get the embed code',
        steps: [
          { text: 'Go to Booking Link in the sidebar.', screenshot: true },
          { text: 'Click Get Embed Code.' },
          { text: 'Copy the code snippet that appears.', screenshot: true },
        ]
      },
      {
        title: 'Add it to your website',
        steps: [
          { text: 'On your website, go to the page where you want the booking form to appear.', screenshot: false },
          { text: 'Open the HTML editor for that page. This depends on your website platform — in Squarespace or Wix, look for a Code Block or Embed element.' },
          { text: 'Paste the code into the editor. The booking form will appear in that spot on your page.' },
        ]
      },
      {
        title: 'How it looks',
        steps: [
          { text: 'The embedded booking form shows your services, staff, and available times — all within your website. It updates automatically when you make changes in ReeveOS.', screenshot: false },
          { text: 'It\'s mobile-friendly, so it works on phones and tablets too.' },
        ]
      },
    ],
    faqs: [
      { q: 'Do I need coding skills to add this?', a: 'Not really. If you can copy and paste, you can do it. Your website platform might call it a "custom code" or "HTML embed" area.' },
    ],
    related: ['set-up-booking-link', 'booking-channels'],
  },

  // ─────────────────────────────────────────────────────────────
  // SERVICES & MENU
  // ─────────────────────────────────────────────────────────────
  {
    id: 'add-a-service',
    categoryId: 'services',
    title: 'How to add a new service',
    intro: 'Services are what your clients book. Here\'s how to add them to your platform so they appear on your booking page.',
    toc: ['Open your Services page', 'Fill in the service details', 'Assign it to staff', 'Save and check it\'s live'],
    sections: [
      {
        title: 'Open your Services page',
        steps: [
          { text: 'Click Services in the left sidebar.', screenshot: true },
          { text: 'Click the + Add Service button in the top right corner.' },
        ]
      },
      {
        title: 'Fill in the service details',
        steps: [
          { text: 'Service Name — enter the name exactly as you want clients to see it. For example: "Classic Facial" or "Men\'s Haircut."', screenshot: true },
          { text: 'Description — a short explanation of what the service involves. Keep it friendly and clear.' },
          { text: 'Duration — how long the service takes in minutes. Be realistic — include setup and cleanup time.' },
          { text: 'Price — the full price the client pays.' },
          { text: 'Category — choose which group this service belongs to (e.g., Facials, Body, Hair). If you haven\'t created categories yet, you can type a new one.' },
        ]
      },
      {
        title: 'Assign it to staff',
        steps: [
          { text: 'In the Staff section of the service form, tick the team members who can perform this service.', screenshot: true },
          { text: 'Only those staff members will appear as options when a client books this service online.' },
        ]
      },
      {
        title: 'Save and check it\'s live',
        steps: [
          { text: 'Click Save Service.', screenshot: true },
          { text: 'To check it\'s showing on your booking page, go to Booking Link > Visit Booking Page. Your new service should appear in the relevant category.' },
        ]
      },
    ],
    faqs: [
      { q: 'Can I have different prices for different staff members?', a: 'Yes. When editing a service, click on a staff member\'s name in the Staff section and you can set a specific price for them.' },
      { q: 'Can I hide a service without deleting it?', a: 'Yes. On the service, toggle Visible to Off. It\'ll stay in your list but won\'t appear on your public booking page.' },
    ],
    related: ['service-categories', 'set-staff-availability'],
  },

  {
    id: 'service-categories',
    categoryId: 'services',
    title: 'How to organise services into categories',
    intro: 'Categories group your services together on your booking page — so clients can quickly find what they\'re looking for. Here\'s how to set them up.',
    toc: ['Creating a category', 'Adding services to a category', 'Reordering categories'],
    sections: [
      {
        title: 'Creating a category',
        steps: [
          { text: 'Go to Services in the sidebar.', screenshot: true },
          { text: 'Click Add Category. Give it a name — for example: Facials, Body Treatments, Nails, or Hair.' },
          { text: 'Click Save.', screenshot: true },
        ]
      },
      {
        title: 'Adding services to a category',
        steps: [
          { text: 'When adding or editing a service, select the category from the Category dropdown.', screenshot: true },
          { text: 'The service will then appear under that category heading on your booking page.' },
        ]
      },
      {
        title: 'Reordering categories',
        steps: [
          { text: 'On the Services page, you can drag categories up and down to change their order.', screenshot: true },
          { text: 'The order here is the order they appear on your booking page.' },
        ]
      },
    ],
    faqs: [
      { q: 'What if I don\'t add categories?', a: 'All your services will appear in one long list. Categories are optional but they make your booking page much easier to browse, especially if you have more than 5 or 6 services.' },
    ],
    related: ['add-a-service', 'hide-a-service'],
  },

  {
    id: 'staff-specific-pricing',
    categoryId: 'services',
    title: 'Setting different prices for different staff members',
    intro: 'A senior therapist or stylist might charge more than a junior. Here\'s how to set staff-specific pricing for any service.',
    toc: ['How to set it up', 'How it works for clients'],
    sections: [
      {
        title: 'How to set it up',
        steps: [
          { text: 'Go to Services and click on the service you want to adjust.', screenshot: true },
          { text: 'In the Staff section, you\'ll see a list of team members assigned to this service. Next to each name is a price field.', screenshot: true },
          { text: 'Clear the default price next to a staff member and enter their specific price.' },
          { text: 'Click Save Service.' },
        ]
      },
      {
        title: 'How it works for clients',
        steps: [
          { text: 'When a client books online and selects a specific staff member, the price shown reflects that person\'s rate.', screenshot: false },
          { text: 'If they choose "Anyone available," the lowest price is shown by default.' },
        ]
      },
    ],
    faqs: [
      { q: 'Can I set prices by service category instead of per service?', a: 'Not currently. Pricing is set per service and per staff member.' },
    ],
    related: ['add-a-service', 'invite-staff-member'],
  },

  {
    id: 'hide-a-service',
    categoryId: 'services',
    title: 'Hiding a service from online booking',
    intro: 'Sometimes you want a service in your system but not on your public booking page — for example, a package you only offer to specific clients. Here\'s how to hide it.',
    toc: ['How to hide a service', 'Still booking hidden services', 'Restoring a hidden service'],
    sections: [
      {
        title: 'How to hide a service',
        steps: [
          { text: 'Go to Services and click on the service you want to hide.', screenshot: true },
          { text: 'Find the Visibility toggle near the top of the form. Toggle it to Hidden.', screenshot: true },
          { text: 'Click Save. The service disappears from your public booking page immediately.' },
        ]
      },
      {
        title: 'Still booking hidden services',
        steps: [
          { text: 'Even when a service is hidden, you can still book it manually from your calendar.', screenshot: true },
          { text: 'When creating a booking, hidden services appear in the service dropdown with a small "Hidden" badge. Just select it as normal.' },
        ]
      },
      {
        title: 'Restoring a hidden service',
        steps: [
          { text: 'Go back to the service and toggle Visibility back to Visible. Click Save.', screenshot: true },
        ]
      },
    ],
    faqs: [
      { q: 'Is there a difference between hiding and deleting a service?', a: 'Yes. Hiding keeps the service in your system — all history is preserved. Deleting removes it. We recommend hiding rather than deleting.' },
    ],
    related: ['add-a-service', 'service-categories'],
  },

  {
    id: 'packages-and-courses',
    categoryId: 'services',
    title: 'How to set up packages and courses',
    intro: 'A package is a bundle of sessions that clients buy upfront — often at a discount. It\'s great for treatment courses, memberships, and loyalty rewards. Here\'s how to set one up.',
    toc: ['What a package is', 'Creating a package', 'How clients use a package', 'Tracking package balances'],
    sections: [
      {
        title: 'What a package is',
        steps: [
          { text: 'A package might be something like: "6 sessions of microneedling for £480" (instead of paying £100 each time). The client buys the package once, and sessions are deducted each time they visit.', screenshot: false },
        ]
      },
      {
        title: 'Creating a package',
        steps: [
          { text: 'Go to Services and click Add Package.', screenshot: true },
          { text: 'Give it a name, select which services it includes, and set the total number of sessions.' },
          { text: 'Set the package price (usually discounted vs paying separately) and the validity period — for example, all sessions must be used within 12 months.', screenshot: true },
          { text: 'Click Save Package.' },
        ]
      },
      {
        title: 'How clients use a package',
        steps: [
          { text: 'A client purchases the package — either in person or through your shop online.', screenshot: false },
          { text: 'Every time they come in for a session, the staff member marks a session as redeemed from their profile. The remaining balance updates automatically.' },
        ]
      },
      {
        title: 'Tracking package balances',
        steps: [
          { text: 'Go to Clients and click on a client\'s name.', screenshot: true },
          { text: 'On their profile, you\'ll see a Packages section showing which packages they have, how many sessions remain, and the expiry date.' },
        ]
      },
    ],
    faqs: [
      { q: 'What happens when a package expires?', a: 'Unused sessions are forfeited. The client is automatically emailed a reminder one month before their package expires.' },
    ],
    related: ['add-a-service', 'view-client-profile'],
  },

  {
    id: 'patch-tests',
    categoryId: 'services',
    title: 'Setting up patch tests for services',
    intro: 'Some treatments — like tinting or chemical services — require a patch test 48 hours beforehand. Here\'s how to set this up so ReeveOS enforces it automatically.',
    toc: ['What the patch test setting does', 'Enabling it on a service', 'How it appears at booking'],
    sections: [
      {
        title: 'What the patch test setting does',
        steps: [
          { text: 'When you mark a service as requiring a patch test, the system checks whether that client\'s patch test is on record before allowing the booking.', screenshot: false },
          { text: 'If no patch test is recorded, the booking is flagged — either blocked automatically or shown as a warning, depending on your settings.' },
        ]
      },
      {
        title: 'Enabling it on a service',
        steps: [
          { text: 'Go to Services and click on the relevant service.', screenshot: true },
          { text: 'Find the Patch Test Required toggle and switch it on.', screenshot: true },
          { text: 'Set the minimum gap between the patch test and the actual treatment (usually 48 hours). Click Save.' },
        ]
      },
      {
        title: 'How it appears at booking',
        steps: [
          { text: 'When you book this service for a client, the system checks their record for a patch test.', screenshot: true },
          { text: 'If no patch test is found, a warning banner appears: "Patch test required — none on record for this client."' },
          { text: 'To record a completed patch test, go to the client\'s profile and add a note under Patch Tests.' },
        ]
      },
    ],
    faqs: [
      { q: 'Can clients book patch-test services online?', a: 'Only if they have a patch test on record. If they don\'t, they\'re prompted to contact you first.' },
    ],
    related: ['add-a-service', 'consultation-forms-overview'],
  },

  {
    id: 'contraindication-services',
    categoryId: 'services',
    title: 'Linking services to contraindication checks',
    intro: 'For safety-critical treatments, you can link services to the consultation form system — so the platform automatically checks for health conditions before a booking is confirmed.',
    toc: ['How contraindication checking works', 'Linking a service', 'What happens if a flag is detected'],
    sections: [
      {
        title: 'How contraindication checking works',
        steps: [
          { text: 'When a client completes their consultation form, they answer questions about their health and medical history.', screenshot: false },
          { text: 'The platform has a built-in matrix that checks those answers against each treatment. Conditions are rated as BLOCK (booking prevented), FLAG (warning shown to therapist), or OK (safe to proceed).' },
        ]
      },
      {
        title: 'Linking a service',
        steps: [
          { text: 'Go to Services and click on the relevant service.', screenshot: true },
          { text: 'Find the Health Screening section and tick Enable Contraindication Check.', screenshot: true },
          { text: 'Click Save.' },
        ]
      },
      {
        title: 'What happens if a flag is detected',
        steps: [
          { text: 'When you try to book a service for a client who has a flagged condition, a warning banner appears showing what was flagged and why.', screenshot: true },
          { text: 'For BLOCK conditions, the booking cannot be confirmed until a manual override is added — and the reason is logged in the audit trail.' },
          { text: 'For FLAG conditions, a warning appears but the booking can proceed at your discretion.' },
        ]
      },
    ],
    faqs: [
      { q: 'What health conditions are checked?', a: 'The system covers over 20 common contraindications including pregnancy, active skin infections, blood thinners, autoimmune conditions, and more. See the Consultation Forms section for the full list.' },
    ],
    related: ['consultation-forms-overview', 'add-a-service'],
  },

  // ─────────────────────────────────────────────────────────────
  // STAFF MANAGEMENT
  // ─────────────────────────────────────────────────────────────
  {
    id: 'invite-staff-member',
    categoryId: 'staff',
    title: 'How to add a staff member',
    intro: 'Each member of your team gets their own profile in ReeveOS. Here\'s how to add them so they appear on your calendar and booking page.',
    toc: ['Open the Staff page', 'Fill in their details', 'Set their working hours', 'Assign their services'],
    sections: [
      {
        title: 'Open the Staff page',
        steps: [
          { text: 'Click Staff (or People) in the left sidebar.', screenshot: true },
          { text: 'Click Add Staff Member in the top right corner.' },
        ]
      },
      {
        title: 'Fill in their details',
        steps: [
          { text: 'Enter their full name, email address, and phone number.', screenshot: true },
          { text: 'Choose their role: Staff (standard access), or Business Owner (full access). Most team members should be set to Staff.' },
          { text: 'Upload a profile photo — this appears on the booking page when clients choose a specific therapist or stylist.' },
        ]
      },
      {
        title: 'Set their working hours',
        steps: [
          { text: 'Click on the Availability tab in their profile.', screenshot: true },
          { text: 'Tick the days they work and set their start and end times for each day.' },
          { text: 'Click Save. They\'ll now appear as available on those days on your calendar.' },
        ]
      },
      {
        title: 'Assign their services',
        steps: [
          { text: 'Click on the Services tab in their profile.', screenshot: true },
          { text: 'Tick each service they\'re able to perform.' },
          { text: 'Click Save. Only these services will show when clients book with this person specifically.' },
        ]
      },
    ],
    faqs: [
      { q: 'Does adding a staff member send them an invite email?', a: 'Yes. When you add their email address, they receive a welcome email with instructions to set their own password and log in.' },
      { q: 'Can a staff member see other people\'s bookings?', a: 'By default, staff can only see their own bookings. If you want them to see everyone\'s, change their role to Business Owner.' },
    ],
    related: ['set-staff-availability', 'staff-roles-permissions'],
  },

  {
    id: 'set-staff-availability',
    categoryId: 'staff',
    title: 'Setting staff working hours and availability',
    intro: 'Your staff\'s working hours control when clients can book them online. Here\'s how to set regular hours and add exceptions for days off.',
    toc: ['Setting regular working hours', 'Adding time off', 'Holiday and closure blocks'],
    sections: [
      {
        title: 'Setting regular working hours',
        steps: [
          { text: 'Go to Staff and click on the team member\'s name.', screenshot: true },
          { text: 'Click the Availability tab.' },
          { text: 'For each day of the week, tick the days they work and set their start and end times.', screenshot: true },
          { text: 'Click Save Hours.' },
        ]
      },
      {
        title: 'Adding time off',
        steps: [
          { text: 'In the Availability tab, scroll down to Time Off.', screenshot: true },
          { text: 'Click Add Time Off and choose the dates.' },
          { text: 'Click Save. Those days are blocked on the calendar — no bookings can be made for those dates.' },
        ]
      },
      {
        title: 'Holiday and closure blocks',
        steps: [
          { text: 'For business-wide closures (like bank holidays), go to Settings > Opening Hours and add closure dates there.', screenshot: true },
          { text: 'This applies to all staff and blocks the whole day across the board.' },
        ]
      },
    ],
    faqs: [
      { q: 'Can staff set their own hours?', a: 'Staff members can log in and update their availability from their own account — they don\'t need to ask you to do it for them.' },
    ],
    related: ['invite-staff-member', 'block-out-time'],
  },

  {
    id: 'staff-roles-permissions',
    categoryId: 'staff',
    title: 'Staff roles and what they can access',
    intro: 'Different staff members need different levels of access. Here\'s what each role can see and do — and how to change someone\'s role.',
    toc: ['The available roles', 'Changing someone\'s role', 'What each role can and cannot do'],
    sections: [
      {
        title: 'The available roles',
        steps: [
          { text: 'Staff — the standard role for most team members. They can see their own calendar, bookings, and client notes.', screenshot: false },
          { text: 'Business Owner — full access to everything. Can see all staff, all bookings, financials, and settings.' },
          { text: 'Platform Admin — used by ReeveOS support and multi-business managers. Gives access across multiple business accounts.' },
        ]
      },
      {
        title: 'Changing someone\'s role',
        steps: [
          { text: 'Go to Staff and click on the team member\'s name.', screenshot: true },
          { text: 'In their profile, click the Role dropdown and select the appropriate role.', screenshot: true },
          { text: 'Click Save.' },
        ]
      },
      {
        title: 'What each role can and cannot do',
        steps: [
          { text: 'Staff: can view their own calendar and bookings, add notes to clients after appointments, see their own pay/hours. Cannot access: financials, other staff\'s bookings, settings, reports.', screenshot: false },
          { text: 'Business Owner: can access everything. Set this role carefully — only give it to people who genuinely need full control.' },
        ]
      },
    ],
    faqs: [
      { q: 'Can a staff member see what other team members earn?', a: 'No. Each staff member can only see their own financial information unless they have Business Owner role.' },
    ],
    related: ['invite-staff-member', 'set-staff-availability'],
  },

  {
    id: 'staff-login',
    categoryId: 'staff',
    title: 'How staff members log in',
    intro: 'Each staff member gets their own login. Here\'s how they access the platform and what they see when they do.',
    toc: ['How to log in as a staff member', 'What staff members see', 'Password issues'],
    sections: [
      {
        title: 'How to log in as a staff member',
        steps: [
          { text: 'Staff members go to portal.rezvo.app and enter the email address you added for them, plus their password.', screenshot: true },
          { text: 'On their first login, they\'ll be prompted to set their own password via the link in their welcome email.' },
        ]
      },
      {
        title: 'What staff members see',
        steps: [
          { text: 'Staff members see your dashboard, but only their own calendar, their own bookings, and the clients they\'ve personally seen.', screenshot: true },
          { text: 'They can view and add notes to their clients\' profiles, check their own availability, and mark appointments as completed.' },
          { text: 'Settings, reports, financials, and other staff profiles are hidden.' },
        ]
      },
      {
        title: 'Password issues',
        steps: [
          { text: 'If a staff member has forgotten their password, they click Forgot Password on the login page and follow the email link.', screenshot: false },
          { text: 'If they\'ve been locked out, go to Staff > [Their name] and click Reset Password. A new link is sent to their email.' },
        ]
      },
    ],
    faqs: [
      { q: 'What if a staff member leaves? How do I remove their access?', a: 'Go to Staff, click on their name, and click Deactivate Account. They\'ll be immediately logged out and won\'t be able to log in again. Their booking history stays intact.' },
    ],
    related: ['invite-staff-member', 'staff-roles-permissions'],
  },

  {
    id: 'manage-time-off',
    categoryId: 'staff',
    title: 'How to manage time off and holiday',
    intro: 'When a staff member has a day off, their calendar should block out automatically so clients can\'t book them. Here\'s how to add time off.',
    toc: ['Adding time off for a staff member', 'Adding a business-wide closure', 'What it looks like on the calendar'],
    sections: [
      {
        title: 'Adding time off for a staff member',
        steps: [
          { text: 'Go to Staff and click on the team member\'s name.', screenshot: true },
          { text: 'Click the Availability tab, then scroll to Time Off.' },
          { text: 'Click Add Time Off. Choose the start and end date.', screenshot: true },
          { text: 'Click Save. Those dates are now blocked on their calendar.' },
        ]
      },
      {
        title: 'Adding a business-wide closure',
        steps: [
          { text: 'For days when the whole business is closed — bank holidays, Christmas, refurbishment — go to Settings > Opening Hours.', screenshot: true },
          { text: 'Click Add Closure Date. Select the date and click Save.' },
          { text: 'Nobody can be booked on that date — across all staff members.' },
        ]
      },
      {
        title: 'What it looks like on the calendar',
        steps: [
          { text: 'Time off and closure dates show as hatched grey blocks on the calendar.', screenshot: true },
          { text: 'If any bookings were already in that period, they\'ll show with a red warning — you\'ll need to reschedule or contact those clients.' },
        ]
      },
    ],
    faqs: [
      { q: 'Can staff add their own time off?', a: 'Yes. Staff can log in and add their own time off from their account. It shows on your calendar for you to see too.' },
    ],
    related: ['set-staff-availability', 'block-out-time'],
  },

  // ─────────────────────────────────────────────────────────────
  // CLIENTS & CRM
  // ─────────────────────────────────────────────────────────────
  {
    id: 'view-all-clients',
    categoryId: 'clients',
    title: 'How to find and view your clients',
    intro: 'Every client who has ever booked with you is in your Client Book. Here\'s how to find the one you\'re looking for.',
    toc: ['Opening your Client Book', 'Searching for a client', 'What you see on a client\'s profile'],
    sections: [
      {
        title: 'Opening your Client Book',
        steps: [
          { text: 'Click Clients in the left sidebar.', screenshot: true },
          { text: 'You\'ll see a list of all your clients, sorted by most recently active.' },
        ]
      },
      {
        title: 'Searching for a client',
        steps: [
          { text: 'Use the search bar at the top. You can search by name, phone number, or email address.', screenshot: true },
          { text: 'The list filters in real time as you type.' },
          { text: 'You can also filter by: last visit date, total spend, client type (active, lapsed, VIP), or tag.' },
        ]
      },
      {
        title: 'What you see on a client\'s profile',
        steps: [
          { text: 'Click any client to open their full profile.', screenshot: true },
          { text: 'You\'ll see: their contact details, full booking history, therapist notes, consultation form status, package balances, and what they\'ve purchased from your shop.' },
        ]
      },
    ],
    faqs: [
      { q: 'Can I see all clients who haven\'t been in for a while?', a: 'Yes. Use the Lapsed Clients filter in the Client Book — it shows everyone who hasn\'t had an appointment in the last 90 days (or whatever window you set).' },
    ],
    related: ['view-client-profile', 'client-notes', 'import-clients'],
  },

  {
    id: 'view-client-profile',
    categoryId: 'clients',
    title: 'Understanding a client\'s profile',
    intro: 'A client\'s profile contains everything you\'ll ever need to know about them — their history, their health information, their spending. Here\'s what each section means.',
    toc: ['Contact details', 'Booking history', 'Therapist notes', 'Consultation form status', 'Package balances'],
    sections: [
      {
        title: 'Contact details',
        steps: [
          { text: 'The top of the profile shows the client\'s name, email, phone number, and date of birth.', screenshot: true },
          { text: 'Click Edit to update any of these details.' },
        ]
      },
      {
        title: 'Booking history',
        steps: [
          { text: 'The Bookings tab shows every appointment this client has ever had with you — date, service, staff member, price, and status.', screenshot: true },
        ]
      },
      {
        title: 'Therapist notes',
        steps: [
          { text: 'The Notes tab shows private notes added by your team after previous visits — things like preferred pressure, allergies they mentioned, or anything useful to know.', screenshot: true },
          { text: 'Click Add Note to add a new one. Only your team can see these — clients cannot.' },
        ]
      },
      {
        title: 'Consultation form status',
        steps: [
          { text: 'The Forms tab shows whether this client\'s consultation form is up to date.', screenshot: true },
          { text: 'Green means it\'s current. Amber means it expires within the next month. Red means it\'s expired and needs renewing before their next appointment.' },
        ]
      },
      {
        title: 'Package balances',
        steps: [
          { text: 'If this client has purchased any packages or courses, the Packages tab shows how many sessions remain and when the package expires.', screenshot: true },
        ]
      },
    ],
    faqs: [
      { q: 'Can clients update their own details?', a: 'Yes — if you have the Client Portal enabled, they can log in and update their contact details, medical information, and preferences themselves.' },
    ],
    related: ['view-all-clients', 'client-notes', 'consultation-forms-overview'],
  },

  {
    id: 'client-notes',
    categoryId: 'clients',
    title: 'How to add and read therapist notes',
    intro: 'After an appointment, it\'s worth noting down anything useful about the client — what they liked, what to avoid next time, personal details that help you give a brilliant service. Here\'s how.',
    toc: ['Adding a note', 'Reading previous notes', 'Notes from the calendar'],
    sections: [
      {
        title: 'Adding a note',
        steps: [
          { text: 'Open the client\'s profile from the Clients page or by clicking their name from any booking.', screenshot: true },
          { text: 'Click the Notes tab.' },
          { text: 'Click Add Note. Type your note — be as detailed as useful. Examples: "Prefers lighter pressure on shoulders," "Used size 3 foils," "Has a wedding in June."', screenshot: true },
          { text: 'Click Save Note.' },
        ]
      },
      {
        title: 'Reading previous notes',
        steps: [
          { text: 'All previous notes appear in the Notes tab in reverse chronological order — most recent first.', screenshot: true },
          { text: 'Each note shows who wrote it and when. This is helpful if multiple staff members see the same client.' },
        ]
      },
      {
        title: 'Notes from the calendar',
        steps: [
          { text: 'You can also add a note directly from an appointment. Click the appointment on your calendar and scroll to the Notes section in the details panel.', screenshot: true },
          { text: 'Notes added here appear in the client\'s full profile.' },
        ]
      },
    ],
    faqs: [
      { q: 'Can clients see therapist notes?', a: 'No. Therapist notes are private — visible only to your team. Clients cannot see them, even if they have access to the Client Portal.' },
    ],
    related: ['view-client-profile', 'view-all-clients'],
  },

  {
    id: 'import-clients',
    categoryId: 'clients',
    title: 'How to import your client list',
    intro: 'Moving from another system? You can import your existing client list into ReeveOS in one go. Here\'s how.',
    toc: ['Prepare your file', 'Upload the file', 'Review and confirm', 'After the import'],
    sections: [
      {
        title: 'Prepare your file',
        steps: [
          { text: 'Your file needs to be a CSV (spreadsheet saved as .csv). You\'ll need at least these columns: First Name, Last Name, Email, Phone.', screenshot: false },
          { text: 'You can also include: Date of Birth, Address, Notes.' },
          { text: 'Export your client list from your existing system and make sure it\'s saved as a .csv file.' },
        ]
      },
      {
        title: 'Upload the file',
        steps: [
          { text: 'Go to Clients in the sidebar, then click Import Clients.', screenshot: true },
          { text: 'Click Upload File and select your .csv from your computer.', screenshot: true },
          { text: 'The system shows you a column mapping — match each column in your file to the right field in ReeveOS.' },
        ]
      },
      {
        title: 'Review and confirm',
        steps: [
          { text: 'Before importing, you\'ll see a preview of the first few rows. Check they look right.', screenshot: true },
          { text: 'The system automatically detects and skips duplicates (matched by email address).' },
          { text: 'Click Import. Depending on the size of your list, it may take a minute or two.' },
        ]
      },
      {
        title: 'After the import',
        steps: [
          { text: 'You\'ll receive a confirmation showing how many clients were imported and how many were skipped as duplicates.', screenshot: true },
          { text: 'Your imported clients appear in your Client Book straight away.' },
        ]
      },
    ],
    faqs: [
      { q: 'How many clients can I import at once?', a: 'Up to 10,000 clients per import. If you have more, split them into multiple files.' },
      { q: 'Will importing trigger any emails to my clients?', a: 'No. The import is silent — no notifications are sent to imported clients.' },
    ],
    related: ['view-all-clients', 'view-client-profile'],
  },

  {
    id: 'track-package-balances',
    categoryId: 'clients',
    title: 'How to track a client\'s package balance',
    intro: 'When a client buys a package or course, you need to be able to quickly see how many sessions they have left. Here\'s where to find it and how to redeem sessions.',
    toc: ['Viewing a package balance', 'Redeeming a session', 'What happens when a package runs out'],
    sections: [
      {
        title: 'Viewing a package balance',
        steps: [
          { text: 'Open the client\'s profile from the Clients page.', screenshot: true },
          { text: 'Click the Packages tab. You\'ll see a list of all their packages, with a progress bar showing sessions used vs remaining.', screenshot: true },
        ]
      },
      {
        title: 'Redeeming a session',
        steps: [
          { text: 'You can also see package info from the calendar — click any appointment and the client\'s package balance appears in the quick-view panel.', screenshot: true },
          { text: 'When you mark an appointment as Completed, you\'ll be prompted: "Redeem from package?" Click Yes to deduct one session.' },
        ]
      },
      {
        title: 'What happens when a package runs out',
        steps: [
          { text: 'When the last session is redeemed, the package is marked as Complete on the client\'s profile.', screenshot: true },
          { text: 'If you have marketing automation set up, an automated message can be sent offering them to renew the package.' },
        ]
      },
    ],
    faqs: [
      { q: 'Can a client see their own package balance?', a: 'Yes — if the Client Portal is enabled, clients can log in and see their remaining sessions.' },
    ],
    related: ['packages-and-courses', 'view-client-profile'],
  },

  {
    id: 'client-pipeline',
    categoryId: 'clients',
    title: 'Using the client pipeline',
    intro: 'The pipeline tracks where each client is in their relationship with your business — from first enquiry through to loyal regular. Here\'s how to use it.',
    toc: ['What the pipeline is', 'The pipeline stages', 'Moving clients through the pipeline'],
    sections: [
      {
        title: 'What the pipeline is',
        steps: [
          { text: 'The pipeline is a Kanban-style board — think of it like a set of columns, with client cards you can move between them.', screenshot: true },
          { text: 'It\'s most useful for tracking higher-value clients or leads — for example, someone who enquired about a treatment course but hasn\'t booked yet.' },
        ]
      },
      {
        title: 'The pipeline stages',
        steps: [
          { text: 'Lead — someone who\'s expressed interest but hasn\'t booked yet.', screenshot: true },
          { text: 'Contacted — you\'ve reached out to them.' },
          { text: 'Consultation Booked — they have a consultation appointment in the diary.' },
          { text: 'Active Client — a paying, returning client.' },
          { text: 'VIP — your very best clients, deserving of extra care.' },
        ]
      },
      {
        title: 'Moving clients through the pipeline',
        steps: [
          { text: 'On the Pipeline page (under CRM in the sidebar), each client appears as a card in their current stage.', screenshot: true },
          { text: 'Drag a card from one column to another as their situation changes.' },
          { text: 'Click a card to see their details, add a note, or go straight to booking for them.' },
        ]
      },
    ],
    faqs: [
      { q: 'Do all my clients need to be in the pipeline?', a: 'No — only the ones you want to actively track. Regular bookings handle themselves. The pipeline is for clients where you want to manage the relationship more deliberately.' },
    ],
    related: ['view-all-clients', 'view-client-profile'],
  },

  {
    id: 'client-quick-view-calendar',
    categoryId: 'clients',
    title: 'Seeing client details from the calendar',
    intro: 'You can see key client information without leaving your calendar. Here\'s how.',
    toc: ['Opening the quick view', 'What it shows'],
    sections: [
      {
        title: 'Opening the quick view',
        steps: [
          { text: 'Click any appointment on your calendar.', screenshot: true },
          { text: 'The details panel opens on the right side. The client\'s name is at the top — click it to see their quick-view.' },
        ]
      },
      {
        title: 'What it shows',
        steps: [
          { text: 'The client quick-view shows: their name and contact details, their last visit and next appointment, their current package balance, and any notes or flags from their consultation form.', screenshot: true },
          { text: 'If their consultation form is expired, a red badge appears here — so you know to ask them to update it before their appointment.' },
          { text: 'Click View Full Profile to open their complete client page.' },
        ]
      },
    ],
    faqs: [
      { q: 'Can I add a note from the quick view?', a: 'Yes — there\'s a quick note field at the bottom of the panel. Notes added here go straight to the client\'s profile.' },
    ],
    related: ['view-client-profile', 'client-notes'],
  },

  // ─────────────────────────────────────────────────────────────
  // CONSULTATION FORMS
  // ─────────────────────────────────────────────────────────────
  {
    id: 'consultation-forms-overview',
    categoryId: 'consultation-forms',
    title: 'What consultation forms are and why they matter',
    intro: 'Consultation forms collect important health and medical information from your clients before their first treatment. They protect your clients, protect you legally, and are required by most insurance policies.',
    toc: ['What the form covers', 'Why it matters', 'How long forms are valid for'],
    sections: [
      {
        title: 'What the form covers',
        steps: [
          { text: 'The consultation form is split into six sections: Personal Details, Medical History, Medications, Skin History, Lifestyle, and Consent.', screenshot: false },
          { text: 'Together, these help you understand whether a treatment is safe for a specific client, and ensure they\'ve given their informed consent.' },
        ]
      },
      {
        title: 'Why it matters',
        steps: [
          { text: 'If a client has a condition that contraindications a treatment — for example, pregnancy and certain skin treatments — and you weren\'t aware, you could cause harm. The form prevents this.', screenshot: false },
          { text: 'From a legal perspective, having a signed consent form on record is essential if anything is ever questioned.' },
          { text: 'All form data is stored securely, encrypted, and accessible only to authorised staff. It\'s GDPR compliant.' },
        ]
      },
      {
        title: 'How long forms are valid for',
        steps: [
          { text: 'Consultation forms are valid for 6 months (or up to 12 months, depending on your settings).', screenshot: true },
          { text: 'Clients are automatically reminded to renew their form when it\'s about to expire.' },
          { text: 'On each visit, clients are asked "Has anything changed with your health since your last visit?" If they say yes, the relevant sections are updated.' },
        ]
      },
    ],
    faqs: [
      { q: 'Do all my clients need to complete a form?', a: 'We strongly recommend it for any service that involves touching the body or skin. For treatments like microneedling, chemical peels, or injectables, it\'s essential.' },
    ],
    related: ['send-consultation-form', 'contraindication-matrix', 'consultation-form-renewal'],
  },

  {
    id: 'send-consultation-form',
    categoryId: 'consultation-forms',
    title: 'How to send a consultation form to a client',
    intro: 'There are several ways to share the consultation form with clients — by email, by text, by QR code, or through their client portal. Here\'s how each one works.',
    toc: ['Send by email or text', 'Share a QR code', 'Via the client portal', 'Check if they\'ve completed it'],
    sections: [
      {
        title: 'Send by email or text',
        steps: [
          { text: 'Go to Consultation Forms in the sidebar, then click the Distribution tab.', screenshot: true },
          { text: 'Click Send Form. Search for the client by name or email.' },
          { text: 'Choose Email or SMS. Click Send.', screenshot: true },
          { text: 'The client receives a message with a link to complete the form online. It works on their phone, tablet, or laptop.' },
        ]
      },
      {
        title: 'Share a QR code',
        steps: [
          { text: 'On the Distribution tab, click Get QR Code.', screenshot: true },
          { text: 'Download or print the QR code. Put it on your reception desk or in your waiting area.' },
          { text: 'Clients scan it with their phone and complete the form on the spot.' },
        ]
      },
      {
        title: 'Via the client portal',
        steps: [
          { text: 'If clients have access to the Client Portal, they\'ll see a notification on their account when a consultation form is due.', screenshot: false },
          { text: 'They can complete it directly from their portal — no separate link needed.' },
        ]
      },
      {
        title: 'Check if they\'ve completed it',
        steps: [
          { text: 'Go to Consultation Forms > Submissions to see which clients have completed their form and which haven\'t.', screenshot: true },
          { text: 'You can also check from an individual client\'s profile — the Forms tab shows their status.' },
        ]
      },
    ],
    faqs: [
      { q: 'Can forms be sent automatically when someone books?', a: 'Yes. If Auto-Send is enabled in your Consultation Forms settings, new clients receive the form link automatically when they book for the first time.' },
    ],
    related: ['consultation-forms-overview', 'contraindication-matrix'],
  },

  {
    id: 'contraindication-matrix',
    categoryId: 'consultation-forms',
    title: 'How the health screening and contraindication checks work',
    intro: 'When a client completes their consultation form, the platform automatically checks their answers against a list of treatments. It tells you straight away whether it\'s safe to proceed, whether to review, or whether the treatment must be avoided. Here\'s how it works.',
    toc: ['The three outcomes', 'What conditions are checked', 'What happens at the booking step'],
    sections: [
      {
        title: 'The three outcomes',
        steps: [
          { text: 'BLOCK — The combination of this condition and this treatment is unsafe. The booking cannot be confirmed without a manual override and a documented reason.', screenshot: false },
          { text: 'FLAG — There\'s something worth discussing. The booking can proceed, but a warning is shown to the therapist so they can use their judgement.' },
          { text: 'OK — No issues detected for this treatment based on the client\'s form.' },
        ]
      },
      {
        title: 'What conditions are checked',
        steps: [
          { text: 'The platform checks for over 20 conditions including: pregnancy, breastfeeding, active cancer, blood-thinning medication, autoimmune conditions, active skin infections, keloid scarring, pacemakers, and more.', screenshot: false },
          { text: 'Each condition is rated against each treatment. Some conditions are BLOCK for one treatment and only FLAG for another — the matrix handles this automatically.' },
        ]
      },
      {
        title: 'What happens at the booking step',
        steps: [
          { text: 'When you create a booking for a client with a flagged condition, a banner appears at the top of the booking form.', screenshot: true },
          { text: 'It shows exactly which condition was flagged and the outcome (BLOCK or FLAG).' },
          { text: 'For a BLOCK, you can still proceed if you add a manual override note — this is logged in the audit trail for compliance.' },
          { text: 'For a FLAG, the booking proceeds normally but the flag is recorded on the appointment.' },
        ]
      },
    ],
    faqs: [
      { q: 'Can I customise which conditions apply to which treatments?', a: 'The core matrix is based on clinical guidelines and cannot be changed. You can however add your own custom flags in the form builder for business-specific considerations.' },
    ],
    related: ['consultation-forms-overview', 'send-consultation-form'],
  },

  {
    id: 'consultation-form-renewal',
    categoryId: 'consultation-forms',
    title: 'How consultation form renewal works',
    intro: 'Consultation forms expire after a set period — health information changes, so it\'s important that clients keep their details up to date. Here\'s how the renewal process works.',
    toc: ['When forms expire', 'How clients are reminded', 'What clients see when they log in', 'Viewing renewal status across all clients'],
    sections: [
      {
        title: 'When forms expire',
        steps: [
          { text: 'By default, forms are valid for 6 months. You can change this to 12 months in Consultation Forms > Settings.', screenshot: true },
          { text: 'After that period, the form shows as Expired in red. Bookings for treatments requiring a form will trigger a warning until it\'s renewed.' },
        ]
      },
      {
        title: 'How clients are reminded',
        steps: [
          { text: 'One month before their form expires, clients automatically receive a reminder email or text asking them to review and update their information.', screenshot: false },
          { text: 'A second reminder goes out one week before expiry.' },
          { text: 'When the form expires, they receive a notification saying their form needs updating before their next appointment.' },
        ]
      },
      {
        title: 'What clients see when they log in',
        steps: [
          { text: 'In the Client Portal, clients see the status of their form: green (current), amber (expiring soon), or red (expired).', screenshot: true },
          { text: 'If it\'s expired or expiring, a prompt appears asking them to review their information. They confirm or update any sections that have changed.' },
        ]
      },
      {
        title: 'Viewing renewal status across all clients',
        steps: [
          { text: 'Go to Consultation Forms > Submissions. Filter by status: Current, Expiring Soon, Expired.', screenshot: true },
          { text: 'This gives you a list of everyone whose form needs attention — so you can chase them before their next appointment.' },
        ]
      },
    ],
    faqs: [
      { q: 'Can clients renew the whole form from scratch, or just update what\'s changed?', a: 'They\'re shown their previous answers and can update only what\'s changed. They don\'t need to fill the whole thing in again.' },
    ],
    related: ['consultation-forms-overview', 'send-consultation-form'],
  },

  {
    id: 'consultation-gdpr',
    categoryId: 'consultation-forms',
    title: 'How consultation form data is kept safe and compliant',
    intro: 'Consultation forms contain sensitive medical information. Here\'s how ReeveOS protects that data and stays compliant with UK data protection law.',
    toc: ['How data is stored', 'Who can access it', 'Client data rights', 'Audit trail'],
    sections: [
      {
        title: 'How data is stored',
        steps: [
          { text: 'All consultation form data is encrypted at rest. This means even if someone gained access to the database, they couldn\'t read the medical information without the encryption key.', screenshot: false },
          { text: 'Data is stored in UK-based servers and never shared with third parties.' },
          { text: 'The encryption meets the GDPR requirement for "appropriate technical measures" for special category data (which health information is classified as).' },
        ]
      },
      {
        title: 'Who can access it',
        steps: [
          { text: 'Only staff members with the Staff or Business Owner role at your business can view consultation form data.', screenshot: false },
          { text: 'Every time a staff member views a client\'s medical information, it\'s logged in the audit trail — including who viewed it and when.' },
          { text: 'ReeveOS staff never have access to your clients\' health data.' },
        ]
      },
      {
        title: 'Client data rights',
        steps: [
          { text: 'Clients have the right to request a copy of their data at any time, or to request deletion. Both can be handled from Clients > [Client Name] > Data Rights.', screenshot: true },
          { text: 'Consent is captured with a timestamp each time a client signs the form — this is your legal record of their informed consent.' },
        ]
      },
      {
        title: 'Audit trail',
        steps: [
          { text: 'Every action on a consultation form — submission, view, update, override — is logged with a timestamp and the user who performed it.', screenshot: true },
          { text: 'This audit trail can be accessed from Consultation Forms > Submissions > [Client Name] > Activity Log.' },
        ]
      },
    ],
    faqs: [
      { q: 'How long should I keep consultation form data?', a: 'UK law requires medical records to be kept for at least 6 years from the date of the last treatment. ReeveOS retains data in line with this — data is not automatically deleted.' },
    ],
    related: ['consultation-forms-overview', 'send-consultation-form'],
  },

  {
    id: 'treatment-consent-forms',
    categoryId: 'consultation-forms',
    title: 'Treatment consent forms',
    intro: 'As well as the main consultation form, you can collect treatment-specific consent for individual procedures. Here\'s how.',
    toc: ['What treatment consent forms are', 'How to set one up', 'Getting consent before a treatment'],
    sections: [
      {
        title: 'What treatment consent forms are',
        steps: [
          { text: 'A treatment consent form is a short document a client signs before a specific procedure — for example, before microneedling or a chemical peel.', screenshot: false },
          { text: 'It explains what the treatment involves, the risks, the aftercare required, and confirms the client understands and agrees to proceed.' },
        ]
      },
      {
        title: 'How to set one up',
        steps: [
          { text: 'Go to Consultation Forms in the sidebar and click the Treatment Consents tab.', screenshot: true },
          { text: 'Click Add Consent Form. Give it a name (e.g., "Microneedling Consent") and select which service it applies to.' },
          { text: 'Write the consent text — what the treatment involves, the risks, aftercare instructions, and the consent statement.', screenshot: true },
          { text: 'Click Save.' },
        ]
      },
      {
        title: 'Getting consent before a treatment',
        steps: [
          { text: 'When you book a service that has a linked consent form, you\'ll be prompted to collect consent before the appointment.', screenshot: true },
          { text: 'The form can be sent to the client in advance by email, or completed on a tablet in your waiting room.' },
          { text: 'The signed consent is stored on the booking record and the client\'s profile.' },
        ]
      },
    ],
    faqs: [
      { q: 'Do I need treatment consent as well as the main consultation form?', a: 'For higher-risk treatments, yes. The consultation form covers general health — the treatment consent form covers the specific procedure and its risks. Both are best practice.' },
    ],
    related: ['consultation-forms-overview', 'send-consultation-form'],
  },

  // ─────────────────────────────────────────────────────────────
  // SHOP & PRODUCTS
  // ─────────────────────────────────────────────────────────────
  {
    id: 'add-products',
    categoryId: 'shop',
    title: 'How to add products to your shop',
    intro: 'If you sell retail products — skincare, hair products, accessories — you can list them in your ReeveOS shop so clients can buy online or in person. Here\'s how to add them.',
    toc: ['Open your Shop', 'Add a product', 'Set stock levels', 'Make it visible'],
    sections: [
      {
        title: 'Open your Shop',
        steps: [
          { text: 'Click Shop in the left sidebar.', screenshot: true },
          { text: 'Click the Products tab, then Add Product.' },
        ]
      },
      {
        title: 'Add a product',
        steps: [
          { text: 'Product Name — enter it clearly. For example: "Vitamin C Serum 30ml" rather than just "Serum."', screenshot: true },
          { text: 'Description — a short explanation of what it does and why clients will love it.' },
          { text: 'Price — the retail price.' },
          { text: 'Category — for example: Skincare, Haircare, Accessories. Categories help clients browse.' },
          { text: 'Photo — upload a product photo. Clear, well-lit product photos make a big difference to sales.', screenshot: true },
        ]
      },
      {
        title: 'Set stock levels',
        steps: [
          { text: 'Toggle Track Stock to On.', screenshot: true },
          { text: 'Enter the current quantity you have in stock.' },
          { text: 'Set a Low Stock Alert — for example, if it drops below 3, you\'ll get a notification to reorder.' },
        ]
      },
      {
        title: 'Make it visible',
        steps: [
          { text: 'Toggle Visible to On. The product will appear in your online shop immediately.', screenshot: true },
          { text: 'To check how it looks, go to Booking Link > Visit Shop.' },
        ]
      },
    ],
    faqs: [
      { q: 'Can I sell products to clients who haven\'t booked with me?', a: 'Yes. Your shop is accessible through your booking link — anyone can browse and buy, not just existing clients.' },
    ],
    related: ['gift-vouchers', 'discount-codes'],
  },

  {
    id: 'archive-product',
    categoryId: 'shop',
    title: 'How to archive or remove a product',
    intro: 'If a product is out of stock or discontinued, you can archive it so it doesn\'t appear in your shop — without losing the sales history attached to it.',
    toc: ['Archiving a product', 'Finding archived products', 'Restoring an archived product'],
    sections: [
      {
        title: 'Archiving a product',
        steps: [
          { text: 'Go to Shop > Products and find the product you want to remove.', screenshot: true },
          { text: 'Click the three-dot menu icon next to it and select Archive.' },
          { text: 'Confirm. The product disappears from your shop immediately.', screenshot: true },
        ]
      },
      {
        title: 'Finding archived products',
        steps: [
          { text: 'On the Products page, click the Archived tab at the top.', screenshot: true },
          { text: 'All archived products appear here.' },
        ]
      },
      {
        title: 'Restoring an archived product',
        steps: [
          { text: 'On the Archived tab, find the product and click Restore.', screenshot: true },
          { text: 'The product is set back to Active and reappears in your shop.' },
        ]
      },
    ],
    faqs: [
      { q: 'Is archiving the same as deleting?', a: 'No. Archived products are hidden but preserved — all their sales history stays intact. Deleting would remove the record entirely, which we don\'t recommend.' },
    ],
    related: ['add-products', 'deleted-items'],
  },

  {
    id: 'discount-codes',
    categoryId: 'shop',
    title: 'How to create and manage discount codes',
    intro: 'Discount codes give your clients a reduction on bookings or purchases. Here\'s how to create them and share them.',
    toc: ['Creating a discount code', 'Setting usage limits', 'Sharing the code'],
    sections: [
      {
        title: 'Creating a discount code',
        steps: [
          { text: 'Go to Shop > Discounts and click Add Discount Code.', screenshot: true },
          { text: 'Enter a code — for example: WELCOME10 or CHRISTMAS20. Keep it short and memorable.' },
          { text: 'Choose the discount type: Percentage (e.g., 10% off) or Fixed Amount (e.g., £10 off).', screenshot: true },
          { text: 'Set a minimum spend if you want one — for example, only valid on orders over £50.' },
          { text: 'Set an expiry date if the offer has a time limit.' },
          { text: 'Click Save.' },
        ]
      },
      {
        title: 'Setting usage limits',
        steps: [
          { text: 'You can limit how many times a code can be used in total — for example, the first 50 clients only.', screenshot: true },
          { text: 'You can also limit it to one use per client, so they can\'t apply the same code twice.' },
        ]
      },
      {
        title: 'Sharing the code',
        steps: [
          { text: 'Share the code with clients however you like — in an email campaign, on Instagram, in your email signature.', screenshot: false },
          { text: 'Clients enter it at checkout when they book or buy online. The discount is applied automatically.' },
        ]
      },
    ],
    faqs: [
      { q: 'Can I see how many times a code has been used?', a: 'Yes — on the Discounts page, each code shows a usage count and which clients used it.' },
    ],
    related: ['gift-vouchers', 'marketing-campaigns'],
  },

  {
    id: 'gift-vouchers',
    categoryId: 'shop',
    title: 'How to create and sell gift vouchers',
    intro: 'Gift vouchers are a brilliant way to grow revenue — especially around birthdays, Christmas, and Valentine\'s Day. Here\'s how to set them up.',
    toc: ['Creating a gift voucher', 'How clients buy them', 'How clients redeem them'],
    sections: [
      {
        title: 'Creating a gift voucher',
        steps: [
          { text: 'Go to Shop > Vouchers and click Add Gift Voucher.', screenshot: true },
          { text: 'Set the voucher amount — for example £50, £100, or a custom amount the buyer can choose.' },
          { text: 'Set an expiry period — for example, valid for 12 months from purchase.', screenshot: true },
          { text: 'Click Save and make it Visible.' },
        ]
      },
      {
        title: 'How clients buy them',
        steps: [
          { text: 'Gift vouchers appear in your online shop.', screenshot: true },
          { text: 'The buyer pays online and the recipient receives a unique voucher code by email — or it can be sent to the buyer to give in person.' },
        ]
      },
      {
        title: 'How clients redeem them',
        steps: [
          { text: 'When a voucher holder books online, they enter the code at checkout. The voucher value is deducted from their total.', screenshot: true },
          { text: 'If they book in person, you can look up the voucher code in Shop > Vouchers and mark it as redeemed manually.' },
        ]
      },
    ],
    faqs: [
      { q: 'What happens if a voucher is worth more than the service?', a: 'The remaining balance stays on the voucher and can be used next time, up to the expiry date.' },
    ],
    related: ['add-products', 'discount-codes'],
  },

  {
    id: 'stock-tracking',
    categoryId: 'shop',
    title: 'How stock tracking works',
    intro: 'If you sell physical products, ReeveOS can track your stock levels and alert you when something is running low. Here\'s how to use it.',
    toc: ['Enabling stock tracking', 'Low stock alerts', 'Adjusting stock manually'],
    sections: [
      {
        title: 'Enabling stock tracking',
        steps: [
          { text: 'When adding or editing a product, toggle Track Stock to On.', screenshot: true },
          { text: 'Enter the current quantity in stock.' },
          { text: 'Save the product.' },
        ]
      },
      {
        title: 'Low stock alerts',
        steps: [
          { text: 'Set a Low Stock Threshold — the number at which you want to be alerted. For example, if you want a warning when you have fewer than 3 left, enter 3.', screenshot: true },
          { text: 'When stock drops below that number, you\'ll receive a notification in your dashboard and by email.' },
        ]
      },
      {
        title: 'Adjusting stock manually',
        steps: [
          { text: 'If your stock changes (new delivery, damaged items), go to the product and click Adjust Stock.', screenshot: true },
          { text: 'Enter the new quantity and a note (e.g., "New delivery — 12 added"). Click Save.' },
        ]
      },
    ],
    faqs: [
      { q: 'Does stock go down automatically when a sale is made?', a: 'Yes. When a product is purchased online or marked as sold through the checkout, the stock count decreases automatically.' },
    ],
    related: ['add-products', 'archive-product'],
  },

  // ─────────────────────────────────────────────────────────────
  // PAYMENTS & BILLING
  // ─────────────────────────────────────────────────────────────
  {
    id: 'payment-setup',
    categoryId: 'payments',
    title: 'How payments work on ReeveOS',
    intro: 'ReeveOS handles two types of payments: online payments (when clients book or buy through the platform) and in-person card payments. Here\'s how each one works.',
    toc: ['Online payments', 'In-person payments', 'Where your money goes'],
    sections: [
      {
        title: 'Online payments',
        steps: [
          { text: 'For online payments — booking fees, shop purchases, gift vouchers — we use Stripe Connect.', screenshot: false },
          { text: 'You connect your own Stripe account (or create one) in Settings > Payments. Money paid online goes directly to your bank account via Stripe.' },
          { text: 'We don\'t hold your money. It goes straight to you.', screenshot: false },
        ]
      },
      {
        title: 'In-person payments',
        steps: [
          { text: 'For in-person card payments, we partner with Dojo — one of the UK\'s leading payment processors.', screenshot: false },
          { text: 'Dojo rates: 0.3% on debit cards, 0.7% on credit cards, plus 2.5p per transaction. These are among the most competitive rates available for independent businesses.' },
          { text: 'A Dojo card terminal can be connected to your ReeveOS account. Ask us about getting set up.' },
        ]
      },
      {
        title: 'Where your money goes',
        steps: [
          { text: 'Online payments land in your Stripe account and are paid out to your bank on a rolling schedule (usually next working day for UK accounts).', screenshot: false },
          { text: 'In-person card payments via Dojo are settled according to Dojo\'s standard payout schedule.' },
        ]
      },
    ],
    faqs: [
      { q: 'Does ReeveOS take a commission on my bookings?', a: 'No. Unlike platforms like Fresha or Treatwell, ReeveOS charges a flat monthly subscription — not a commission on every booking. What you earn is yours.' },
    ],
    related: ['booking-fees', 'cancellation-policy'],
  },

  {
    id: 'cancellation-policy',
    categoryId: 'payments',
    title: 'Setting your cancellation policy',
    intro: 'A cancellation policy protects your income when clients cancel at the last minute. Here\'s how to set one up and how it works in practice.',
    toc: ['Choosing your policy', 'How it works for clients', 'Handling disputes'],
    sections: [
      {
        title: 'Choosing your policy',
        steps: [
          { text: 'Go to Settings > Payments and scroll to Cancellation Policy.', screenshot: true },
          { text: 'Choose your policy window: 24-hour (basic), 48-hour (standard), or 72-hour (advanced).', screenshot: true },
          { text: 'This means: if a client cancels within that window before their appointment, their booking fee is retained by you.' },
          { text: 'Click Save.' },
        ]
      },
      {
        title: 'How it works for clients',
        steps: [
          { text: 'When clients book online, your cancellation policy is shown to them clearly before they confirm.', screenshot: false },
          { text: 'If they cancel with enough notice, their booking fee is automatically refunded.' },
          { text: 'If they cancel inside the policy window, the fee is retained. They receive an email explaining this.' },
        ]
      },
      {
        title: 'Handling disputes',
        steps: [
          { text: 'Occasionally a client may dispute a retained fee — for example, if they cancelled due to an emergency.', screenshot: false },
          { text: 'You can manually issue a refund from the Payments page. Find the transaction and click Refund. This is entirely at your discretion.' },
        ]
      },
    ],
    faqs: [
      { q: 'Can I waive the cancellation fee for a specific client?', a: 'Yes. Find the transaction in Payments and click Refund. You can refund all or part of the fee.' },
      { q: 'Do I need to have booking fees enabled to have a cancellation policy?', a: 'Yes — the cancellation policy only applies when a booking fee has been charged. Without a booking fee, there\'s nothing to retain.' },
    ],
    related: ['booking-fees', 'payment-setup'],
  },

  {
    id: 'view-transactions',
    categoryId: 'payments',
    title: 'How to view your transactions and payments',
    intro: 'The Payments page gives you a full record of every payment that\'s gone through ReeveOS. Here\'s how to use it.',
    toc: ['Opening the Payments page', 'Filtering transactions', 'Exporting for your accountant'],
    sections: [
      {
        title: 'Opening the Payments page',
        steps: [
          { text: 'Click Payments in the left sidebar.', screenshot: true },
          { text: 'You\'ll see a list of all transactions — booking fees, shop purchases, refunds — in date order.' },
        ]
      },
      {
        title: 'Filtering transactions',
        steps: [
          { text: 'Use the date picker at the top to filter by date range.', screenshot: true },
          { text: 'Use the Type filter to show only: Booking Fees, Shop Sales, Refunds, or Gift Voucher sales.' },
          { text: 'Click on any transaction to see the full details — which client, which service, what was charged.' },
        ]
      },
      {
        title: 'Exporting for your accountant',
        steps: [
          { text: 'Click Export in the top right corner.', screenshot: true },
          { text: 'Choose your date range and click Download CSV. The file includes all transactions in a format your accountant can easily work with.' },
        ]
      },
    ],
    faqs: [
      { q: 'How far back do payment records go?', a: 'All the way back to your first transaction on ReeveOS. There\'s no limit.' },
    ],
    related: ['payment-setup', 'analytics-overview'],
  },

  {
    id: 'instalment-payments',
    categoryId: 'payments',
    title: 'Offering pay later or instalment options',
    intro: 'Some clients prefer to spread the cost of treatments or packages. Here\'s how to offer instalment options.',
    toc: ['What pay later options are available', 'How to enable them', 'What clients see'],
    sections: [
      {
        title: 'What pay later options are available',
        steps: [
          { text: 'Through Stripe, we support Klarna and Clearpay. Both let clients split their payment into instalments — interest-free for them.', screenshot: false },
        ]
      },
      {
        title: 'How to enable them',
        steps: [
          { text: 'Go to Settings > Payments and scroll to Pay Later Options.', screenshot: true },
          { text: 'Toggle on Klarna and/or Clearpay. These are enabled through your connected Stripe account.' },
          { text: 'Click Save.' },
        ]
      },
      {
        title: 'What clients see',
        steps: [
          { text: 'At checkout when booking or buying from your shop, clients see the option to "Pay in instalments" with Klarna or Clearpay.', screenshot: true },
          { text: 'They complete the approval process with that provider. You receive the full amount immediately — the instalment arrangement is between the client and the pay-later provider.' },
        ]
      },
    ],
    faqs: [
      { q: 'Do I get paid the full amount straight away even if the client pays in instalments?', a: 'Yes. You receive the full amount from Klarna or Clearpay immediately. They handle collecting the instalments from the client.' },
    ],
    related: ['payment-setup', 'booking-fees'],
  },

  {
    id: 'no-show-payment-charge',
    categoryId: 'payments',
    title: 'Charging for no-shows',
    intro: 'If a client doesn\'t turn up, you can charge their saved card using No-Show Protection. Here\'s how to set it up and use it.',
    toc: ['Enable No-Show Protection', 'Charging a no-show', 'Issuing a refund for a no-show charge'],
    sections: [
      {
        title: 'Enable No-Show Protection',
        steps: [
          { text: 'Go to Settings > Payments and toggle on No-Show Protection.', screenshot: true },
          { text: 'Set the no-show fee — a fixed amount you\'ll charge if a client doesn\'t turn up.' },
          { text: 'Click Save. From this point, clients who book online will be required to save a card when booking.' },
        ]
      },
      {
        title: 'Charging a no-show',
        steps: [
          { text: 'When a client doesn\'t show up, open their appointment and click Mark as No-Show.', screenshot: true },
          { text: 'A button appears: Charge No-Show Fee. Click it.' },
          { text: 'Confirm the amount. The charge is applied to the card they saved at booking.', screenshot: true },
          { text: 'The client receives a notification and a receipt.' },
        ]
      },
      {
        title: 'Issuing a refund for a no-show charge',
        steps: [
          { text: 'If you decide to waive the charge — for example, the client had a genuine emergency — go to Payments, find the transaction, and click Refund.', screenshot: true },
        ]
      },
    ],
    faqs: [
      { q: 'What if a client\'s card declines?', a: 'You\'ll see a notification that the charge failed. You can try again later or contact the client directly.' },
    ],
    related: ['no-show-protection', 'cancellation-policy'],
  },

  // ─────────────────────────────────────────────────────────────
  // REVIEWS
  // ─────────────────────────────────────────────────────────────
  {
    id: 'review-sources',
    categoryId: 'reviews',
    title: 'Where reviews come from',
    intro: 'Reviews on ReeveOS come from multiple sources — your booking platform, Google, and any connected channels. Here\'s how they\'re collected and where you\'ll find them.',
    toc: ['Sources of reviews', 'Where to find all your reviews', 'How ratings are calculated'],
    sections: [
      {
        title: 'Sources of reviews',
        steps: [
          { text: 'Platform reviews — after a completed appointment, clients can be automatically invited to leave a review directly on ReeveOS.', screenshot: false },
          { text: 'Google reviews — if your Google Business Profile is connected, Google reviews appear here too.' },
        ]
      },
      {
        title: 'Where to find all your reviews',
        steps: [
          { text: 'Click Reviews in the left sidebar.', screenshot: true },
          { text: 'All reviews from all sources appear in one list, sorted by date. You can filter by source, rating, or date range.' },
        ]
      },
      {
        title: 'How ratings are calculated',
        steps: [
          { text: 'Your overall star rating is an average of all reviews across all connected sources.', screenshot: true },
          { text: 'It appears on your booking page and in search results.' },
        ]
      },
    ],
    faqs: [
      { q: 'Can I remove a negative review?', a: 'You can\'t delete reviews — they\'re a permanent public record. But you can respond to them, which shows future clients how you handle feedback.' },
    ],
    related: ['respond-to-reviews', 'request-more-reviews'],
  },

  {
    id: 'respond-to-reviews',
    categoryId: 'reviews',
    title: 'How to respond to reviews',
    intro: 'Responding to reviews — both positive and negative — shows clients that you care. Here\'s how to do it.',
    toc: ['Responding to a review', 'Tips for responding well', 'Responding to negative reviews'],
    sections: [
      {
        title: 'Responding to a review',
        steps: [
          { text: 'Go to Reviews in the sidebar.', screenshot: true },
          { text: 'Find the review you want to respond to and click Respond.' },
          { text: 'Type your response. It\'ll appear publicly underneath the client\'s review.', screenshot: true },
          { text: 'Click Post Response.' },
        ]
      },
      {
        title: 'Tips for responding well',
        steps: [
          { text: 'For positive reviews: thank them by name, mention the specific service they had, and invite them back.', screenshot: false },
          { text: 'Keep responses short — two or three sentences is plenty. Potential clients will read them.' },
        ]
      },
      {
        title: 'Responding to negative reviews',
        steps: [
          { text: 'Stay calm and professional. Don\'t be defensive — future clients will judge you on how you respond more than on the review itself.', screenshot: false },
          { text: 'Acknowledge the concern, apologise where appropriate, and invite them to contact you directly to resolve it.' },
        ]
      },
    ],
    faqs: [
      { q: 'Can I edit my response after posting it?', a: 'Yes — click Edit Response on any response you\'ve already posted.' },
    ],
    related: ['review-sources', 'request-more-reviews'],
  },

  {
    id: 'request-more-reviews',
    categoryId: 'reviews',
    title: 'How to automatically get more reviews',
    intro: 'The best time to ask for a review is the day after an appointment — results are visible and the experience is fresh. Here\'s how to set this up automatically.',
    toc: ['Enable automatic review requests', 'What clients receive', 'Tracking your review rate'],
    sections: [
      {
        title: 'Enable automatic review requests',
        steps: [
          { text: 'Go to Settings > Notifications.', screenshot: true },
          { text: 'Find the Post-Appointment Follow-up section and toggle on Review Request.' },
          { text: 'Set the delay — we recommend sending the day after the appointment. Click Save.', screenshot: true },
        ]
      },
      {
        title: 'What clients receive',
        steps: [
          { text: 'The morning after their appointment, clients receive a friendly email or text: "We hope you enjoyed your [service]. We\'d love to hear how it went..."', screenshot: false },
          { text: 'It includes a direct link to leave a review — making it as easy as possible for them.' },
        ]
      },
      {
        title: 'Tracking your review rate',
        steps: [
          { text: 'In your Analytics, you can see how many review requests have been sent and how many resulted in a review.', screenshot: true },
        ]
      },
    ],
    faqs: [
      { q: 'Can I choose which clients get a review request?', a: 'Currently it applies to all completed appointments. Per-client control is on our roadmap.' },
    ],
    related: ['review-sources', 'respond-to-reviews'],
  },

  // ─────────────────────────────────────────────────────────────
  // ANALYTICS & REPORTS
  // ─────────────────────────────────────────────────────────────
  {
    id: 'analytics-overview',
    categoryId: 'analytics',
    title: 'What analytics are available',
    intro: 'Your Analytics section gives you a detailed picture of how your business is performing. Here\'s what\'s available and how to read it.',
    toc: ['Opening Analytics', 'Key metrics explained', 'Filtering by date range'],
    sections: [
      {
        title: 'Opening Analytics',
        steps: [
          { text: 'Click Analytics (or Reports) in the left sidebar.', screenshot: true },
        ]
      },
      {
        title: 'Key metrics explained',
        steps: [
          { text: 'Total Bookings — how many appointments were made in your chosen period.', screenshot: true },
          { text: 'Revenue — total money taken (not including refunds).' },
          { text: 'Average Booking Value — total revenue divided by number of bookings.' },
          { text: 'Retention Rate — the percentage of clients who came back for a second appointment within 90 days.' },
          { text: 'No-Show Rate — the percentage of bookings where the client didn\'t turn up.' },
          { text: 'Busiest Times — a heatmap showing which days and hours are most popular.' },
          { text: 'Top Services — which services generate the most revenue and bookings.' },
          { text: 'Staff Utilisation — how fully booked each staff member is.' },
        ]
      },
      {
        title: 'Filtering by date range',
        steps: [
          { text: 'Use the date picker at the top of the Analytics page to choose your period — today, this week, this month, this quarter, or a custom range.', screenshot: true },
        ]
      },
    ],
    faqs: [
      { q: 'Can I compare this month to last month?', a: 'Yes. Use the Compare toggle next to the date picker. It adds a second line to your charts showing the previous period.' },
    ],
    related: ['export-reports', 'what-dashboard-shows'],
  },

  {
    id: 'export-reports',
    categoryId: 'analytics',
    title: 'How to export reports',
    intro: 'You can download your analytics data as a spreadsheet — useful for your accountant, end-of-year reviews, or business planning. Here\'s how.',
    toc: ['Exporting from Analytics', 'Exporting your bookings', 'Exporting transactions'],
    sections: [
      {
        title: 'Exporting from Analytics',
        steps: [
          { text: 'Go to Analytics in the sidebar.', screenshot: true },
          { text: 'Set your date range, then click the Export button in the top right.' },
          { text: 'Choose the data you want to include. Click Download. A CSV file is saved to your computer.', screenshot: true },
        ]
      },
      {
        title: 'Exporting your bookings',
        steps: [
          { text: 'Go to Bookings and click Export in the top right. Set your date range and click Download.', screenshot: true },
        ]
      },
      {
        title: 'Exporting transactions',
        steps: [
          { text: 'Go to Payments and click Export. Set your date range and click Download.', screenshot: true },
        ]
      },
    ],
    faqs: [
      { q: 'Can I open the CSV in Excel?', a: 'Yes — CSV files open in Excel, Google Sheets, and any other spreadsheet tool. If the columns look odd when you first open it, use File > Import and select "Comma separated" as the delimiter.' },
    ],
    related: ['analytics-overview', 'view-transactions'],
  },

  {
    id: 'analytics-historical',
    categoryId: 'analytics',
    title: 'How far back does your data go',
    intro: 'Your analytics cover your entire time on ReeveOS. Here\'s how to access historical data.',
    toc: ['Accessing historical data', 'Custom date ranges'],
    sections: [
      {
        title: 'Accessing historical data',
        steps: [
          { text: 'All your data is stored indefinitely. There is no limit on how far back you can look.', screenshot: false },
          { text: 'Go to Analytics and use the date picker to select any past period.', screenshot: true },
        ]
      },
      {
        title: 'Custom date ranges',
        steps: [
          { text: 'Click the date picker and select Custom Range.', screenshot: true },
          { text: 'Choose any start and end date. The analytics update immediately.' },
        ]
      },
    ],
    faqs: [
      { q: 'What if I need data from before I joined ReeveOS?', a: 'ReeveOS only has data from your sign-up date onwards. Historical data from other systems would need to be imported separately.' },
    ],
    related: ['analytics-overview', 'export-reports'],
  },

  // ─────────────────────────────────────────────────────────────
  // MARKETING
  // ─────────────────────────────────────────────────────────────
  {
    id: 'marketing-campaigns',
    categoryId: 'marketing',
    title: 'How to send an email campaign',
    intro: 'Email campaigns let you stay in touch with your clients — promoting new services, filling quiet periods, or simply saying hello. Here\'s how to create and send one.',
    toc: ['Open Marketing', 'Create your campaign', 'Choose your audience', 'Schedule or send now'],
    sections: [
      {
        title: 'Open Marketing',
        steps: [
          { text: 'Click Marketing in the left sidebar.', screenshot: true },
          { text: 'Click New Campaign.' },
        ]
      },
      {
        title: 'Create your campaign',
        steps: [
          { text: 'Give your campaign a name (this is just for your records — clients won\'t see it).', screenshot: true },
          { text: 'Write the email subject line. This is what clients see in their inbox — make it interesting.' },
          { text: 'Write the body of the email using the editor. You can add text, images, buttons, and links.', screenshot: true },
          { text: 'Add a call-to-action button — for example, "Book Now" linking to your booking page.' },
        ]
      },
      {
        title: 'Choose your audience',
        steps: [
          { text: 'Select who to send to: All Clients, Active Clients Only, Lapsed Clients, or a custom segment.', screenshot: true },
          { text: 'Custom segments let you filter by: last visit date, total spend, services booked, location, or custom tags.' },
        ]
      },
      {
        title: 'Schedule or send now',
        steps: [
          { text: 'To send straight away, click Send Now.', screenshot: true },
          { text: 'To schedule it for later, click Schedule and pick a date and time.' },
          { text: 'After sending, you\'ll be able to see open rates and click rates in the campaign results.' },
        ]
      },
    ],
    faqs: [
      { q: 'How many emails can I send per month?', a: 'This depends on your plan. Check Settings > Billing for your current limits.' },
    ],
    related: ['client-segmentation', 'notifications-reminders'],
  },

  {
    id: 'client-segmentation',
    categoryId: 'marketing',
    title: 'How to target specific groups of clients',
    intro: 'Sending the right message to the right people is far more effective than blasting everyone. Here\'s how to create targeted segments.',
    toc: ['What segmentation is', 'Common useful segments', 'Creating a custom segment'],
    sections: [
      {
        title: 'What segmentation is',
        steps: [
          { text: 'Segmentation means filtering your client list so you only message a relevant group — for example, clients who haven\'t been in for 3 months, or clients who\'ve had a specific treatment.', screenshot: false },
        ]
      },
      {
        title: 'Common useful segments',
        steps: [
          { text: 'Lapsed Clients — haven\'t had an appointment in 60, 90, or 180 days. Perfect for a win-back campaign.', screenshot: true },
          { text: 'High Spenders — clients who\'ve spent over a certain amount. Great for VIP offers.' },
          { text: 'Service-Specific — clients who\'ve had a particular treatment. Useful for promoting related services.' },
          { text: 'Package Holders — clients with an active package. Perfect for renewal offers.' },
        ]
      },
      {
        title: 'Creating a custom segment',
        steps: [
          { text: 'In Marketing > New Campaign, click the Audience section.', screenshot: true },
          { text: 'Click Create Segment. Use the filters to define your group.', screenshot: true },
          { text: 'Click Preview to see how many clients match before sending.' },
        ]
      },
    ],
    faqs: [
      { q: 'Can I save a segment to use again?', a: 'Yes. When creating a segment, click Save Segment and give it a name. It\'ll be available to select in future campaigns.' },
    ],
    related: ['marketing-campaigns', 'view-all-clients'],
  },

  {
    id: 'push-notifications',
    categoryId: 'marketing',
    title: 'Sending push notifications to clients',
    intro: 'If your clients use the Client Portal, you can send them push notifications — short messages that appear on their phone or browser.',
    toc: ['What push notifications are', 'Sending a push notification', 'What clients see'],
    sections: [
      {
        title: 'What push notifications are',
        steps: [
          { text: 'Push notifications are short messages sent directly to a client\'s phone or browser — they appear even when the client doesn\'t have your booking page open.', screenshot: false },
          { text: 'They\'re great for time-sensitive things: last-minute availability, flash sales, or appointment reminders.' },
        ]
      },
      {
        title: 'Sending a push notification',
        steps: [
          { text: 'Go to Marketing > Notifications.', screenshot: true },
          { text: 'Click New Notification. Write your message — keep it short (under 100 characters).', screenshot: true },
          { text: 'Select your audience. Click Send.' },
        ]
      },
      {
        title: 'What clients see',
        steps: [
          { text: 'Clients who have allowed notifications from your portal will see a small notification pop up on their device.', screenshot: false },
          { text: 'Tapping it opens your booking page or whatever link you included.' },
        ]
      },
    ],
    faqs: [
      { q: 'Can clients opt out of push notifications?', a: 'Yes — they can turn off notifications in their browser or device settings at any time.' },
    ],
    related: ['marketing-campaigns', 'notifications-reminders'],
  },

  // ─────────────────────────────────────────────────────────────
  // NOTIFICATIONS & REMINDERS
  // ─────────────────────────────────────────────────────────────
  {
    id: 'notifications-reminders',
    categoryId: 'notifications',
    title: 'What notifications clients receive',
    intro: 'ReeveOS automatically sends clients the right message at the right time — confirmations, reminders, and follow-ups. Here\'s what they get and when.',
    toc: ['Booking confirmation', 'Appointment reminder', 'Post-appointment follow-up', 'Consultation form reminders'],
    sections: [
      {
        title: 'Booking confirmation',
        steps: [
          { text: 'Immediately after a booking is made, the client receives a confirmation — with the date, time, service, staff member, address, and a link to manage their booking.', screenshot: false },
        ]
      },
      {
        title: 'Appointment reminder',
        steps: [
          { text: 'A reminder is sent before the appointment — the timing is up to you. Most businesses set it to 24 or 48 hours before.', screenshot: true },
          { text: 'The reminder includes the appointment details and a link to confirm, reschedule, or cancel.' },
        ]
      },
      {
        title: 'Post-appointment follow-up',
        steps: [
          { text: 'After the appointment, an optional follow-up can be sent — typically the next morning.', screenshot: false },
          { text: 'It can include: a review request, aftercare instructions, or a prompt to rebook.' },
        ]
      },
      {
        title: 'Consultation form reminders',
        steps: [
          { text: 'New clients receive a consultation form link before their first appointment.', screenshot: false },
          { text: 'Existing clients receive a renewal reminder one month before their form expires.' },
        ]
      },
    ],
    faqs: [
      { q: 'Can I turn off specific notifications?', a: 'Yes. Go to Settings > Notifications. Each notification type has its own toggle — turn off the ones you don\'t want to send.' },
    ],
    related: ['sms-reminders', 'customise-notifications'],
  },

  {
    id: 'sms-reminders',
    categoryId: 'notifications',
    title: 'How SMS reminders work',
    intro: 'As well as email, you can send reminders and confirmations by text message. Here\'s how to set them up.',
    toc: ['Enabling SMS reminders', 'What the texts say', 'SMS credits'],
    sections: [
      {
        title: 'Enabling SMS reminders',
        steps: [
          { text: 'Go to Settings > Notifications.', screenshot: true },
          { text: 'Find the SMS Reminders section and toggle it on.' },
          { text: 'Set when the reminder should be sent — for example, 24 hours before the appointment.', screenshot: true },
          { text: 'Click Save.' },
        ]
      },
      {
        title: 'What the texts say',
        steps: [
          { text: 'The default message includes the client\'s name, the appointment time, the service, and your business name.', screenshot: false },
          { text: 'You can customise the message template in Settings > Notifications > SMS Template.' },
        ]
      },
      {
        title: 'SMS credits',
        steps: [
          { text: 'SMS messages use credits from your account. Your plan includes a monthly allowance.', screenshot: false },
          { text: 'You can see your current credit balance in Settings > Billing.' },
        ]
      },
    ],
    faqs: [
      { q: 'Can clients reply to the text messages?', a: 'Not directly through the platform — the messages come from a shared number. If a client needs to change their appointment, the text message includes a link to manage it online.' },
    ],
    related: ['notifications-reminders', 'customise-notifications'],
  },

  {
    id: 'customise-notifications',
    categoryId: 'notifications',
    title: 'How to customise notification messages',
    intro: 'You can edit the content of the emails and texts your clients receive. Here\'s how to make them feel like they come from your business.',
    toc: ['Editing email templates', 'Editing SMS templates', 'Testing your notifications'],
    sections: [
      {
        title: 'Editing email templates',
        steps: [
          { text: 'Go to Settings > Notifications and click Email Templates.', screenshot: true },
          { text: 'Select the template you want to edit — for example, Booking Confirmation.' },
          { text: 'Edit the subject line and email body. You can use placeholders like {{client_name}} and {{appointment_time}} — these are replaced with the real details when the email is sent.', screenshot: true },
          { text: 'Click Save Template.' },
        ]
      },
      {
        title: 'Editing SMS templates',
        steps: [
          { text: 'Go to Settings > Notifications and click SMS Templates.', screenshot: true },
          { text: 'Edit the message. Keep it short — SMS messages work best under 160 characters.' },
          { text: 'Click Save Template.' },
        ]
      },
      {
        title: 'Testing your notifications',
        steps: [
          { text: 'After editing a template, click Send Test to send a preview to your own email or phone.', screenshot: true },
          { text: 'This lets you see exactly what clients receive before it goes live.' },
        ]
      },
    ],
    faqs: [
      { q: 'Can I add my logo to emails?', a: 'Yes — your business logo is automatically included in all email templates. Make sure it\'s uploaded in Settings > Business Profile.' },
    ],
    related: ['notifications-reminders', 'sms-reminders'],
  },

  // ─────────────────────────────────────────────────────────────
  // ONLINE BOOKING SETTINGS
  // ─────────────────────────────────────────────────────────────
  {
    id: 'enable-online-booking',
    categoryId: 'online-booking',
    title: 'How to enable online booking',
    intro: 'Online booking lets clients book themselves — 24 hours a day — without needing to call or message you. Here\'s how to switch it on.',
    toc: ['Turn on online booking', 'Set your booking rules', 'Check it\'s working'],
    sections: [
      {
        title: 'Turn on online booking',
        steps: [
          { text: 'Click Online Booking in the left sidebar.', screenshot: true },
          { text: 'Toggle Enable Online Booking to On.', screenshot: true },
          { text: 'Click Save.' },
        ]
      },
      {
        title: 'Set your booking rules',
        steps: [
          { text: 'Minimum advance notice — how far in advance must clients book? For example, you might need at least 2 hours notice to prepare.', screenshot: true },
          { text: 'Maximum future booking — how far ahead can clients book? For example, no more than 3 months ahead.' },
          { text: 'Buffer time — how long between appointments? This gives you time to clean up and prepare before the next client.' },
          { text: 'Same-day booking — toggle this on or off depending on whether you want to allow same-day appointments.' },
        ]
      },
      {
        title: 'Check it\'s working',
        steps: [
          { text: 'Go to Booking Link > Visit Booking Page. You should be able to select a service, choose a time, and see the booking form.', screenshot: true },
        ]
      },
    ],
    faqs: [
      { q: 'Can I turn off online booking for specific services?', a: 'Yes. In Services, toggle Visible to Off for any service you don\'t want clients to book online.' },
    ],
    related: ['set-up-booking-link', 'booking-approval'],
  },

  {
    id: 'booking-approval',
    categoryId: 'online-booking',
    title: 'How to require manual approval for bookings',
    intro: 'If you prefer to check each booking before confirming it — for example, for new clients or specialist treatments — you can turn on manual approval. Here\'s how.',
    toc: ['Enable manual approval', 'How to approve or decline bookings', 'What clients see while waiting'],
    sections: [
      {
        title: 'Enable manual approval',
        steps: [
          { text: 'Go to Online Booking settings.', screenshot: true },
          { text: 'Toggle Require Manual Approval to On.', screenshot: true },
          { text: 'Click Save.' },
        ]
      },
      {
        title: 'How to approve or decline bookings',
        steps: [
          { text: 'When a booking request comes in, it appears in your calendar as Pending (lighter colour, clock icon).', screenshot: true },
          { text: 'You also receive a notification — by email or in-app.' },
          { text: 'Click the pending booking. You\'ll see two buttons: Confirm and Decline.', screenshot: true },
          { text: 'If you Confirm, the client receives a confirmation immediately.' },
          { text: 'If you Decline, the client receives a polite decline message and the slot opens back up.' },
        ]
      },
      {
        title: 'What clients see while waiting',
        steps: [
          { text: 'When clients submit a booking request with manual approval on, they see: "Your request has been received — we\'ll confirm your appointment shortly."', screenshot: false },
          { text: 'Once you approve or decline, they receive an email straight away.' },
        ]
      },
    ],
    faqs: [
      { q: 'Is there a time limit for approving bookings?', a: 'No — but we\'d recommend setting a target to respond within a few hours so clients aren\'t left waiting too long.' },
    ],
    related: ['enable-online-booking', 'booking-statuses'],
  },

  {
    id: 'booking-rules',
    categoryId: 'online-booking',
    title: 'Setting your online booking rules',
    intro: 'Booking rules control the finer details of when and how clients can book online. Here\'s what each setting does.',
    toc: ['Minimum advance notice', 'Maximum future booking window', 'Buffer time between appointments', 'Same-day booking'],
    sections: [
      {
        title: 'Minimum advance notice',
        steps: [
          { text: 'Go to Online Booking settings.', screenshot: true },
          { text: 'Set the minimum advance notice — for example, 2 hours. Clients won\'t be able to book anything sooner than 2 hours from now.' },
          { text: 'Useful if you need time to prepare, or if you want to avoid unexpected same-day rushes.' },
        ]
      },
      {
        title: 'Maximum future booking window',
        steps: [
          { text: 'Set how far ahead clients can book. For example, 3 months.', screenshot: true },
          { text: 'Stops clients booking too far in advance when your schedule isn\'t set yet.' },
        ]
      },
      {
        title: 'Buffer time between appointments',
        steps: [
          { text: 'Set a buffer — for example, 15 minutes between appointments.', screenshot: true },
          { text: 'This time is added automatically between bookings on your calendar. Clients can\'t fill that gap online.' },
          { text: 'Useful for cleaning, preparation, or a quick break.' },
        ]
      },
      {
        title: 'Same-day booking',
        steps: [
          { text: 'Toggle same-day booking on or off depending on your preference.', screenshot: true },
          { text: 'If off, clients can only book from tomorrow onwards.' },
        ]
      },
    ],
    faqs: [
      { q: 'Can I set different rules for different services?', a: 'The global rules apply to all online bookings. Per-service rules are on our roadmap.' },
    ],
    related: ['enable-online-booking', 'booking-approval'],
  },

  // ─────────────────────────────────────────────────────────────
  // SETTINGS & CONFIGURATION
  // ─────────────────────────────────────────────────────────────
  {
    id: 'settings-overview',
    categoryId: 'settings',
    title: 'What you can configure in Settings',
    intro: 'Settings is where you control everything about how your business runs on ReeveOS. Here\'s a quick guide to what\'s where.',
    toc: ['Business Profile', 'Opening Hours', 'Payments', 'Notifications', 'Branding'],
    sections: [
      {
        title: 'Business Profile',
        steps: [
          { text: 'Business name, address, phone number, description, logo, and cover image. Go to Settings > Business Profile.', screenshot: true },
        ]
      },
      {
        title: 'Opening Hours',
        steps: [
          { text: 'The days and hours you\'re open. Go to Settings > Opening Hours. You can also add one-off closure dates here.', screenshot: true },
        ]
      },
      {
        title: 'Payments',
        steps: [
          { text: 'Booking fees, cancellation policy, no-show protection, and pay later options. Go to Settings > Payments.', screenshot: true },
        ]
      },
      {
        title: 'Notifications',
        steps: [
          { text: 'What emails and texts are sent to clients — and when. Go to Settings > Notifications.', screenshot: true },
        ]
      },
      {
        title: 'Branding',
        steps: [
          { text: 'Your logo and brand colour. These appear on your booking page and in emails. Go to Settings > Business Profile.', screenshot: true },
        ]
      },
    ],
    faqs: [
      { q: 'Can staff members change Settings?', a: 'No. Settings are only accessible to Business Owners and above.' },
    ],
    related: ['set-up-business-profile', 'update-opening-hours'],
  },

  {
    id: 'update-opening-hours',
    categoryId: 'settings',
    title: 'How to change your opening hours',
    intro: 'If your hours change — seasonally, permanently, or for a one-off closure — here\'s how to update them.',
    toc: ['Updating regular hours', 'Adding a one-off closure', 'Setting special hours'],
    sections: [
      {
        title: 'Updating regular hours',
        steps: [
          { text: 'Go to Settings > Opening Hours.', screenshot: true },
          { text: 'For each day, toggle it on or off and set the opening and closing time.', screenshot: true },
          { text: 'Click Save Hours.' },
        ]
      },
      {
        title: 'Adding a one-off closure',
        steps: [
          { text: 'In Settings > Opening Hours, scroll to Closure Dates.', screenshot: true },
          { text: 'Click Add Closure Date and select the date.' },
          { text: 'Click Save. No bookings can be made on that date.' },
        ]
      },
      {
        title: 'Setting special hours',
        steps: [
          { text: 'If you have different hours on a specific date (for example, Christmas Eve you close at 3pm), click Add Special Hours.', screenshot: true },
          { text: 'Select the date and set the hours for that day.' },
          { text: 'Click Save. These override your normal hours on that date.' },
        ]
      },
    ],
    faqs: [
      { q: 'Do existing bookings get cancelled if I close a day?', a: 'No — existing bookings stay in place. You\'ll see a warning if there are any bookings in the period you\'re closing. It\'s up to you to contact those clients.' },
    ],
    related: ['settings-overview', 'manage-time-off'],
  },

  {
    id: 'update-branding',
    categoryId: 'settings',
    title: 'How to update your branding and logo',
    intro: 'Your logo and brand colour appear on your booking page, in client emails, and throughout the client experience. Here\'s how to keep them up to date.',
    toc: ['Updating your logo', 'Setting your brand colour', 'How it looks to clients'],
    sections: [
      {
        title: 'Updating your logo',
        steps: [
          { text: 'Go to Settings > Business Profile.', screenshot: true },
          { text: 'Scroll to the Logo section. Click Upload Logo or Replace Logo.', screenshot: true },
          { text: 'Choose your logo file. PNG with a transparent background looks best. At least 400×400 pixels.' },
          { text: 'Click Save.' },
        ]
      },
      {
        title: 'Setting your brand colour',
        steps: [
          { text: 'In Settings > Business Profile, find the Brand Colour field.', screenshot: true },
          { text: 'Click the colour swatch and choose your colour from the picker — or enter a hex code if you know it (for example, #C9A84C).' },
          { text: 'Click Save.' },
        ]
      },
      {
        title: 'How it looks to clients',
        steps: [
          { text: 'Your logo appears in the header of your booking page, in confirmation emails, and in the Client Portal.', screenshot: true },
          { text: 'Your brand colour is used for buttons and highlights on your booking page.' },
          { text: 'To preview, go to Booking Link > Visit Booking Page.' },
        ]
      },
    ],
    faqs: [
      { q: 'What logo format works best?', a: 'PNG is best — especially with a transparent background. JPEG works fine too. Avoid very small images as they\'ll look blurry.' },
    ],
    related: ['settings-overview', 'set-up-business-profile'],
  },

  // ─────────────────────────────────────────────────────────────
  // DELETED ITEMS
  // ─────────────────────────────────────────────────────────────
  {
    id: 'deleted-items',
    categoryId: 'deleted',
    title: 'Where deleted items go and how to find them',
    intro: 'When you archive or cancel something in ReeveOS, it doesn\'t disappear permanently. Everything goes to Deleted Items first, where you can review or restore it. Here\'s how it works.',
    toc: ['Finding Deleted Items', 'What you\'ll find there', 'Restoring an item'],
    sections: [
      {
        title: 'Finding Deleted Items',
        steps: [
          { text: 'In the left sidebar, scroll to the bottom. Under the Manage section, click Deleted Items.', screenshot: true },
        ]
      },
      {
        title: 'What you\'ll find there',
        steps: [
          { text: 'Archived Products — products you\'ve removed from your shop.', screenshot: true },
          { text: 'Cancelled Bookings — all appointments that were cancelled, with the reason if one was given.' },
          { text: 'The list is organised by type using tabs at the top.' },
        ]
      },
      {
        title: 'Restoring an item',
        steps: [
          { text: 'Find the item you want to restore and click Restore.', screenshot: true },
          { text: 'It returns to its original place — a product goes back to your shop, for example.' },
        ]
      },
    ],
    faqs: [
      { q: 'Is anything ever permanently deleted?', a: 'Permanently deleting records is possible for Business Owners — but we\'d recommend using Archive instead. Once permanently deleted, records cannot be recovered.' },
    ],
    related: ['archive-product', 'view-all-bookings'],
  },

  {
    id: 'restore-product',
    categoryId: 'deleted',
    title: 'How to restore an archived product',
    intro: 'Archived a product by accident, or want to bring back something seasonal? Here\'s how.',
    toc: ['Find the product', 'Restore it'],
    sections: [
      {
        title: 'Find the product',
        steps: [
          { text: 'Go to Shop > Products.', screenshot: true },
          { text: 'Click the Archived tab at the top.' },
          { text: 'Find the product in the list.', screenshot: true },
        ]
      },
      {
        title: 'Restore it',
        steps: [
          { text: 'Click Restore Product next to it.', screenshot: true },
          { text: 'The product immediately returns to your active shop. It\'s visible to clients straight away.' },
        ]
      },
    ],
    faqs: [
      { q: 'Does restoring a product reset its stock level?', a: 'No — it restores to whatever stock level it had when it was archived.' },
    ],
    related: ['deleted-items', 'archive-product'],
  },

  {
    id: 'cancelled-bookings-log',
    categoryId: 'deleted',
    title: 'Viewing your cancelled bookings history',
    intro: 'All cancelled bookings are logged permanently — useful for records, insurance, and spotting patterns. Here\'s how to access them.',
    toc: ['Viewing the log', 'What information is recorded', 'Filtering by reason'],
    sections: [
      {
        title: 'Viewing the log',
        steps: [
          { text: 'Go to Deleted Items in the sidebar.', screenshot: true },
          { text: 'Click the Cancelled Bookings tab.' },
        ]
      },
      {
        title: 'What information is recorded',
        steps: [
          { text: 'Each cancelled booking shows: client name, service, original date and time, when it was cancelled, and who cancelled it (client or staff).', screenshot: true },
          { text: 'If a cancellation reason was given, it appears here too.' },
        ]
      },
      {
        title: 'Filtering by reason',
        steps: [
          { text: 'Use the filter at the top to show only: client-cancelled, staff-cancelled, or no-shows.', screenshot: true },
        ]
      },
    ],
    faqs: [
      { q: 'How long is the cancellation log kept?', a: 'Indefinitely. We never automatically delete cancellation records.' },
    ],
    related: ['deleted-items', 'cancel-appointment'],
  },

  // ─────────────────────────────────────────────────────────────
  // FLOOR PLAN (RESTAURANTS)
  // ─────────────────────────────────────────────────────────────
  {
    id: 'set-up-floor-plan',
    categoryId: 'floor-plan',
    title: 'How to set up your floor plan',
    intro: 'If you\'re a restaurant or café, the floor plan lets you lay out your tables digitally and manage them in real time during service. Here\'s how to set it up.',
    toc: ['Open the Floor Plan editor', 'Add your tables', 'Set table details', 'Save your layout'],
    sections: [
      {
        title: 'Open the Floor Plan editor',
        steps: [
          { text: 'Click Floor Plan in the left sidebar.', screenshot: true },
          { text: 'Click Edit Layout to open the drag-and-drop editor.' },
        ]
      },
      {
        title: 'Add your tables',
        steps: [
          { text: 'In the editor, click Add Table.', screenshot: true },
          { text: 'Choose the table shape: round, rectangular, or square.' },
          { text: 'Drag the table onto the canvas to position it where it sits in your restaurant.' },
        ]
      },
      {
        title: 'Set table details',
        steps: [
          { text: 'Click any table to set its details: table number, capacity (how many guests it seats), and zone (e.g., Main Dining, Terrace, Bar).', screenshot: true },
        ]
      },
      {
        title: 'Save your layout',
        steps: [
          { text: 'Click Save Layout. Your floor plan is now live.', screenshot: true },
          { text: 'During service, you\'ll see the floor plan in real time — showing which tables are available, reserved, occupied, and paying.' },
        ]
      },
    ],
    faqs: [
      { q: 'Can I have multiple dining areas?', a: 'Yes — create zones for each area. For example: Main Dining, Terrace, Bar, Private Room. Switch between them using the tabs at the top of the floor plan.' },
    ],
    related: ['table-statuses', 'floor-plan-zones'],
  },

  {
    id: 'table-statuses',
    categoryId: 'floor-plan',
    title: 'What the table colours and statuses mean',
    intro: 'During service, each table on your floor plan shows its current status in colour. Here\'s the key.',
    toc: ['Status colours', 'Changing a table\'s status'],
    sections: [
      {
        title: 'Status colours',
        steps: [
          { text: 'Available (green) — the table is free and ready for guests.', screenshot: true },
          { text: 'Reserved (gold) — a reservation is confirmed for this table.' },
          { text: 'Confirmed (dark) — guests have been confirmed but not yet arrived.' },
          { text: 'Seated (bright green) — guests are at the table.' },
          { text: 'Mains Served (orange) — main courses have gone out.' },
          { text: 'Dessert (purple) — desserts have been served.' },
          { text: 'Paying (grey) — guests have asked for the bill.' },
          { text: 'Dirty (red) — guests have left, table needs clearing.' },
        ]
      },
      {
        title: 'Changing a table\'s status',
        steps: [
          { text: 'Click any table on the live floor plan.', screenshot: true },
          { text: 'Select the new status from the panel that appears. The colour updates immediately for all staff to see.' },
        ]
      },
    ],
    faqs: [
      { q: 'Can all staff see the floor plan at the same time?', a: 'Yes. Any staff member logged in on their device sees the same live floor plan. Changes by one person are visible to everyone instantly.' },
    ],
    related: ['set-up-floor-plan', 'floor-plan-zones'],
  },

  {
    id: 'floor-plan-zones',
    categoryId: 'floor-plan',
    title: 'Setting up multiple zones on your floor plan',
    intro: 'If your restaurant has different areas — a main dining room, a terrace, a bar area — you can create separate zones for each one.',
    toc: ['Creating zones', 'Adding tables to a zone', 'Switching between zones during service'],
    sections: [
      {
        title: 'Creating zones',
        steps: [
          { text: 'In the Floor Plan editor, click Add Zone.', screenshot: true },
          { text: 'Give it a name — for example: Main Dining, Terrace, Bar Area, Private Room.' },
          { text: 'Click Save Zone.' },
        ]
      },
      {
        title: 'Adding tables to a zone',
        steps: [
          { text: 'Click any table on the floor plan and assign it to a zone from the details panel.', screenshot: true },
        ]
      },
      {
        title: 'Switching between zones during service',
        steps: [
          { text: 'On the live floor plan, tabs at the top show each zone.', screenshot: true },
          { text: 'Click a tab to see that zone\'s tables. Staff can keep different zones open on different devices — for example, a tablet at the bar showing only bar tables.' },
        ]
      },
    ],
    faqs: [
      { q: 'Can I see all zones at once?', a: 'Click the "All Zones" tab to see a combined view of every table across all areas.' },
    ],
    related: ['set-up-floor-plan', 'table-statuses'],
  },

  // ─────────────────────────────────────────────────────────────
  // CLIENT PORTAL
  // ─────────────────────────────────────────────────────────────
  {
    id: 'client-portal-overview',
    categoryId: 'client-portal',
    title: 'What the Client Portal is',
    intro: 'The Client Portal is a private area where your clients can manage their own relationship with your business — viewing appointments, updating details, completing forms, and more. Here\'s what it includes.',
    toc: ['What clients can do in the portal', 'Who has access', 'How to enable it'],
    sections: [
      {
        title: 'What clients can do in the portal',
        steps: [
          { text: 'View their upcoming appointments and booking history.', screenshot: true },
          { text: 'Rebook a previous service with one click.' },
          { text: 'Cancel or reschedule (within your cancellation policy).' },
          { text: 'Update their contact details and personal information.' },
          { text: 'Complete or renew their consultation form.' },
          { text: 'Browse and buy from your shop.' },
          { text: 'Check their package or course balances.' },
        ]
      },
      {
        title: 'Who has access',
        steps: [
          { text: 'Clients are given access automatically when they book online for the first time — a welcome email with login details is sent automatically.', screenshot: false },
          { text: 'You can also manually invite a client from their profile in the Client Book.' },
        ]
      },
      {
        title: 'How to enable it',
        steps: [
          { text: 'Go to Settings > Client Portal and toggle Enable Client Portal to On.', screenshot: true },
          { text: 'Click Save.' },
        ]
      },
    ],
    faqs: [
      { q: 'Can I customise how the Client Portal looks?', a: 'On Scale and Enterprise plans, you can apply your own branding — logo, colours, and domain — to the Client Portal. Contact us to set this up.' },
    ],
    related: ['client-portal-access', 'client-portal-cancellation'],
  },

  {
    id: 'client-portal-access',
    categoryId: 'client-portal',
    title: 'How clients access the Client Portal',
    intro: 'Your clients don\'t need to download an app. They access the portal through any web browser on their phone or computer. Here\'s how they get in.',
    toc: ['First-time access', 'Returning clients', 'Forgotten password'],
    sections: [
      {
        title: 'First-time access',
        steps: [
          { text: 'After their first online booking, clients receive a welcome email with a link to set their password and log in.', screenshot: false },
          { text: 'They click the link, set a password, and they\'re in.' },
        ]
      },
      {
        title: 'Returning clients',
        steps: [
          { text: 'Returning clients go to your booking link and click My Account or Login.', screenshot: true },
          { text: 'They enter their email and password and they\'re straight into their portal.' },
        ]
      },
      {
        title: 'Forgotten password',
        steps: [
          { text: 'They click Forgot Password on the login page.', screenshot: true },
          { text: 'They enter their email address. A reset link is sent immediately.' },
          { text: 'They follow the link and set a new password.' },
        ]
      },
    ],
    faqs: [
      { q: 'What if a client says they never received the welcome email?', a: 'Check that their email address is correct in their client profile. You can resend the invite from their profile — click Resend Portal Invite.' },
    ],
    related: ['client-portal-overview', 'view-client-profile'],
  },

  {
    id: 'client-portal-cancellation',
    categoryId: 'client-portal',
    title: 'How clients cancel or reschedule from the portal',
    intro: 'Clients can manage their own bookings through the portal — as long as it\'s within your cancellation policy. Here\'s how it works.',
    toc: ['How clients cancel', 'How clients reschedule', 'What happens to the booking fee'],
    sections: [
      {
        title: 'How clients cancel',
        steps: [
          { text: 'The client logs into the Client Portal and goes to their Upcoming Appointments.', screenshot: true },
          { text: 'They click Cancel on the appointment they want to remove.' },
          { text: 'A confirmation screen shows them your cancellation policy — including whether they\'ll be refunded.', screenshot: true },
          { text: 'They confirm the cancellation. It\'s removed from your calendar immediately.' },
        ]
      },
      {
        title: 'How clients reschedule',
        steps: [
          { text: 'In the Client Portal, the client clicks Reschedule on the appointment.', screenshot: true },
          { text: 'A calendar shows available times. They pick a new slot and confirm.' },
          { text: 'The booking moves to the new time on your calendar.' },
        ]
      },
      {
        title: 'What happens to the booking fee',
        steps: [
          { text: 'If they cancel inside your policy window, the booking fee is retained by you — they\'re informed of this on the cancellation screen.', screenshot: false },
          { text: 'If they cancel with enough notice, the fee is automatically refunded to their card.' },
        ]
      },
    ],
    faqs: [
      { q: 'What if a client tries to cancel inside the policy window?', a: 'They can still cancel — but they\'re told clearly that the booking fee won\'t be refunded. They have to confirm they understand before it goes through.' },
    ],
    related: ['client-portal-overview', 'cancellation-policy'],
  },

  {
    id: 'waitlist',
    categoryId: 'client-portal',
    title: 'How the cancellation waitlist works',
    intro: 'When a popular slot gets cancelled, ReeveOS can automatically notify waiting clients so the spot doesn\'t go to waste. Here\'s how to set it up.',
    toc: ['How the waitlist works', 'Enabling the waitlist', 'How clients join'],
    sections: [
      {
        title: 'How the waitlist works',
        steps: [
          { text: 'When a booking is cancelled, clients on the waitlist for that time slot receive an instant notification.', screenshot: false },
          { text: 'The first client to respond and book takes the slot. It\'s first come, first served.' },
        ]
      },
      {
        title: 'Enabling the waitlist',
        steps: [
          { text: 'Go to Online Booking settings.', screenshot: true },
          { text: 'Toggle Enable Waitlist to On. Click Save.' },
        ]
      },
      {
        title: 'How clients join',
        steps: [
          { text: 'When a client tries to book a slot that\'s fully booked, they see: "This time is unavailable — join the waitlist?"', screenshot: true },
          { text: 'They click Join Waitlist. If a cancellation opens up, they\'re notified immediately.' },
        ]
      },
    ],
    faqs: [
      { q: 'Can clients be on multiple waitlists at once?', a: 'Yes — they can join the waitlist for different times or services. They\'ll be notified for each one separately.' },
    ],
    related: ['client-portal-overview', 'cancel-appointment'],
  },

]

export const ARTICLE_MAP = Object.fromEntries(ARTICLES.map(a => [a.id, a]))
export const CATEGORY_MAP = Object.fromEntries(CATEGORIES.map(c => [c.id, c]))
