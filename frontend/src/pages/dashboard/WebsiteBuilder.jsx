import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Puck, Render, DropZone, usePuck } from '@measured/puck'
import '@measured/puck/puck.css'
import api from '../../utils/api'
import { useBusiness } from '../../contexts/BusinessContext'

/* ───────────────────────────── SVG ICONS ───────────────────────────── */

const icons = {
  back: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 4l-6 6 6 6" />
    </svg>
  ),
  desktop: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="16" height="11" rx="1" />
      <path d="M7 17h6M10 14v3" />
    </svg>
  ),
  tablet: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="2" width="12" height="16" rx="1.5" />
      <path d="M9 16h2" />
    </svg>
  ),
  mobile: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5.5" y="2" width="9" height="16" rx="1.5" />
      <path d="M9 16h2" />
    </svg>
  ),
  undo: (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7h8a4 4 0 110 8H7" /><path d="M6 4L3 7l3 3" />
    </svg>
  ),
  redo: (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 7H7a4 4 0 100 8h4" /><path d="M12 4l3 3-3 3" />
    </svg>
  ),
  settings: (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="9" r="2.5" /><path d="M14.7 11a1.2 1.2 0 00.2 1.3l.04.04a1.44 1.44 0 11-2.04 2.04l-.04-.04a1.2 1.2 0 00-1.3-.2 1.2 1.2 0 00-.72 1.1v.12a1.44 1.44 0 11-2.88 0v-.06a1.2 1.2 0 00-.78-1.1 1.2 1.2 0 00-1.3.2l-.04.04a1.44 1.44 0 11-2.04-2.04l.04-.04a1.2 1.2 0 00.2-1.3 1.2 1.2 0 00-1.1-.72H3.44a1.44 1.44 0 110-2.88h.06a1.2 1.2 0 001.1-.78 1.2 1.2 0 00-.2-1.3l-.04-.04A1.44 1.44 0 116.4 3.34l.04.04a1.2 1.2 0 001.3.2h.06a1.2 1.2 0 00.72-1.1V2.44a1.44 1.44 0 112.88 0v.06a1.2 1.2 0 00.72 1.1 1.2 1.2 0 001.3-.2l.04-.04a1.44 1.44 0 112.04 2.04l-.04.04a1.2 1.2 0 00-.2 1.3v.06a1.2 1.2 0 001.1.72h.12a1.44 1.44 0 110 2.88h-.06a1.2 1.2 0 00-1.1.72z" />
    </svg>
  ),
  search: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="7" cy="7" r="4.5" /><path d="M10.5 10.5L14 14" />
    </svg>
  ),
  chevDown: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 5l4 4 4-4" />
    </svg>
  ),
  chevRight: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 3l4 4-4 4" />
    </svg>
  ),
  plus: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M8 3v10M3 8h10" />
    </svg>
  ),
  eye: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
      <path d="M1 7s2.5-4 6-4 6 4 6 4-2.5 4-6 4-6-4-6-4z" /><circle cx="7" cy="7" r="1.8" />
    </svg>
  ),
  lock: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
      <rect x="3" y="6" width="8" height="6" rx="1" /><path d="M5 6V4.5a2 2 0 014 0V6" />
    </svg>
  ),
  trash: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
      <path d="M2 4h10M5 4V3a1 1 0 011-1h2a1 1 0 011 1v1M11 4v7a1 1 0 01-1 1H4a1 1 0 01-1-1V4" />
    </svg>
  ),
  close: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M4 4l8 8M12 4l-8 8" />
    </svg>
  ),
  layout: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3"><rect x="1" y="1" width="14" height="14" rx="2" /><path d="M1 5h14M6 5v10" /></svg>
  ),
  content: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3"><path d="M3 3h10M3 6.5h7M3 10h10M3 13.5h5" /></svg>
  ),
  business: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3"><rect x="2" y="4" width="12" height="10" rx="1" /><path d="M5 4V2.5a.5.5 0 01.5-.5h5a.5.5 0 01.5.5V4M2 7h12" /></svg>
  ),
  booking: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3"><rect x="2" y="3" width="12" height="11" rx="1" /><path d="M2 6h12M5 1v3M11 1v3" /></svg>
  ),
  shop: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3"><path d="M4 1L2 5v1a2 2 0 004 0 2 2 0 004 0 2 2 0 004 0V5l-2-4H4zM2 6v8a1 1 0 001 1h10a1 1 0 001-1V6" /></svg>
  ),
  blog: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3"><path d="M13 2H3a1 1 0 00-1 1v10a1 1 0 001 1h10a1 1 0 001-1V3a1 1 0 00-1-1zM2 6h12M6 6v8" /></svg>
  ),
  social: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3"><circle cx="4" cy="8" r="2" /><circle cx="12" cy="4" r="2" /><circle cx="12" cy="12" r="2" /><path d="M5.8 7l4.4-2M5.8 9l4.4 2" /></svg>
  ),
  drag: (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" opacity="0.4"><circle cx="4" cy="2" r="1" /><circle cx="8" cy="2" r="1" /><circle cx="4" cy="6" r="1" /><circle cx="8" cy="6" r="1" /><circle cx="4" cy="10" r="1" /><circle cx="8" cy="10" r="1" /></svg>
  ),
  alignLeft: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 3h12M2 6.5h8M2 10h12M2 13.5h6" /></svg>
  ),
  alignCenter: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 3h12M4 6.5h8M2 10h12M5 13.5h6" /></svg>
  ),
  alignRight: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 3h12M6 6.5h8M2 10h12M8 13.5h6" /></svg>
  ),
  preview: (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M1 9s3.2-6 8-6 8 6 8 6-3.2 6-8 6-8-6-8-6z" /><circle cx="9" cy="9" r="2.5" /></svg>
  ),
  code: (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5.5 4.5l-4 4.5 4 4.5M12.5 4.5l4 4.5-4 4.5" /></svg>
  ),
  fullscreen: (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 6V3a1 1 0 011-1h3M12 2h3a1 1 0 011 1v3M16 12v3a1 1 0 01-1 1h-3M6 16H3a1 1 0 01-1-1v-3" /></svg>
  ),
  mobileLandscape: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5.5" width="16" height="9" rx="1.5" /><path d="M16 9v2" /></svg>
  ),
  dots: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor"><circle cx="7" cy="3" r="1.2" /><circle cx="7" cy="7" r="1.2" /><circle cx="7" cy="11" r="1.2" /></svg>
  ),
  duplicate: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"><rect x="4" y="4" width="8" height="8" rx="1" /><path d="M10 4V3a1 1 0 00-1-1H3a1 1 0 00-1 1v6a1 1 0 001 1h1" /></svg>
  ),
  moveUp: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M7 11V3M4 6l3-3 3 3" /></svg>
  ),
  moveDown: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M7 3v8M4 8l3 3 3-3" /></svg>
  ),
  copy: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"><rect x="4.5" y="4.5" width="7" height="7" rx="1" /><path d="M9.5 4.5V3a1 1 0 00-1-1H3a1 1 0 00-1 1v5.5a1 1 0 001 1h1.5" /></svg>
  ),
  paste: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"><rect x="3" y="3" width="8" height="9" rx="1" /><path d="M5.5 1.5h3a.5.5 0 01.5.5v1H5V2a.5.5 0 01.5-.5z" /></svg>
  ),
  page: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"><path d="M8 1H3.5A1.5 1.5 0 002 2.5v9A1.5 1.5 0 003.5 13h7a1.5 1.5 0 001.5-1.5V5L8 1z" /><path d="M8 1v4h4" /></svg>
  ),
  layers: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><path d="M7 1L1 4l6 3 6-3-6-3zM1 7l6 3 6-3M1 10l6 3 6-3" /></svg>
  ),
  rename: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"><path d="M8.5 2.5l3 3L5 12H2v-3l6.5-6.5z" /></svg>
  ),
}

const catIcons = {
  Layout: icons.layout,
  Content: icons.content,
  Business: icons.business,
  Booking: icons.booking,
  Shop: icons.shop,
  Blog: icons.blog,
  Social: icons.social,
}

/* ───────────────────────────── COMPONENT CATEGORIES ───────────────────────────── */

const CATEGORIES = {
  Layout: ['Section', 'Columns', 'Spacer', 'Divider'],
  Content: ['Heading', 'TextBlock', 'Image', 'VideoEmbed', 'Button', 'IconText'],
  Business: ['HeroBanner', 'ServiceCard', 'TeamMember', 'Testimonial', 'BeforeAfterGallery', 'OpeningHours', 'ContactForm', 'Map', 'FAQAccordion', 'AnnouncementBar'],
  Booking: ['BookNowButton', 'NextAvailableSlot', 'ServiceList', 'PackageCard', 'GiftVoucher'],
  Shop: ['ProductCard', 'ProductGrid', 'FeaturedProducts', 'CartWidget'],
  Blog: ['BlogPostCard', 'BlogGrid', 'NewsletterSignup'],
  Social: ['InstagramFeed', 'SocialLinks', 'WhatsAppButton', 'ReviewsWidget'],
}

const COMPONENT_LABELS = {
  Section: 'Section', Columns: 'Columns', Spacer: 'Spacer', Divider: 'Divider',
  Heading: 'Heading', TextBlock: 'Text Block', Image: 'Image', VideoEmbed: 'Video Embed',
  Button: 'Button', IconText: 'Icon + Text',
  HeroBanner: 'Hero Banner', ServiceCard: 'Service Card', TeamMember: 'Team Member',
  Testimonial: 'Testimonial', BeforeAfterGallery: 'Before/After Gallery',
  OpeningHours: 'Opening Hours', ContactForm: 'Contact Form', Map: 'Map',
  FAQAccordion: 'FAQ Accordion', AnnouncementBar: 'Announcement Bar',
  BookNowButton: 'Book Now Button', NextAvailableSlot: 'Next Available Slot',
  ServiceList: 'Service List', PackageCard: 'Package Card', GiftVoucher: 'Gift Voucher',
  ProductCard: 'Product Card', ProductGrid: 'Product Grid',
  FeaturedProducts: 'Featured Products', CartWidget: 'Cart Widget',
  BlogPostCard: 'Blog Post Card', BlogGrid: 'Blog Grid', NewsletterSignup: 'Newsletter Signup',
  InstagramFeed: 'Instagram Feed', SocialLinks: 'Social Links',
  WhatsAppButton: 'WhatsApp Button', ReviewsWidget: 'Reviews Widget',
}

/* ───────────────────────────── SHARED STYLE HELPERS ───────────────────────────── */

const FONT = 'Figtree, sans-serif'
const GOLD = '#C9A84C'
const DARK = '#111111'
const T = { bg: '#111111', panel: '#1A1A1A', input: '#222222', border: '#333333', hover: '#2A2A2A', canvas: '#0A0A0A', text: '#FFFFFF', muted: '#999999', gold: '#C9A84C' }
const placeholderBg = (w, h, label) =>
  `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect fill="#e5e5e5" width="${w}" height="${h}"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#999" font-family="sans-serif" font-size="14">${label}</text></svg>`)}`

const paddingMap = { none: '0', s: '8px', m: '16px', l: '32px', xl: '64px' }

/* ───────────────────────────── PUCK CONFIG ───────────────────────────── */

const buildPuckConfig = () => ({
  categories: {
    Layout: { components: CATEGORIES.Layout },
    Content: { components: CATEGORIES.Content },
    Business: { components: CATEGORIES.Business },
    Booking: { components: CATEGORIES.Booking },
    Shop: { components: CATEGORIES.Shop },
    Blog: { components: CATEGORIES.Blog },
    Social: { components: CATEGORIES.Social },
  },
  components: {
    /* ── LAYOUT ── */
    Section: {
      fields: {
        bgColor: { type: 'text', label: 'Background Colour' },
        padding: { type: 'select', label: 'Padding', options: [
          { label: 'None', value: 'none' }, { label: 'Small', value: 's' },
          { label: 'Medium', value: 'm' }, { label: 'Large', value: 'l' }, { label: 'XL', value: 'xl' },
        ]},
        maxWidth: { type: 'text', label: 'Max Width (e.g. 1200px)' },
      },
      defaultProps: { bgColor: '#ffffff', padding: 'l', maxWidth: '1200px' },
      render: ({ bgColor, padding, maxWidth, puck }) => (
        <div style={{ background: bgColor, padding: paddingMap[padding] || '32px' }}>
          <div style={{ maxWidth, margin: '0 auto' }}>
            <DropZone zone="section-content" />
          </div>
        </div>
      ),
    },
    Columns: {
      fields: {
        columns: { type: 'select', label: 'Columns', options: [
          { label: '2 Columns', value: '2' }, { label: '3 Columns', value: '3' }, { label: '4 Columns', value: '4' },
        ]},
        gap: { type: 'text', label: 'Gap (px)' },
      },
      defaultProps: { columns: '2', gap: '24' },
      render: ({ columns, gap }) => (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: `${gap}px` }}>
          {Array.from({ length: Number(columns) }, (_, i) => (
            <DropZone key={i} zone={`column-${i}`} />
          ))}
        </div>
      ),
    },
    Spacer: {
      fields: {
        height: { type: 'select', label: 'Height', options: [
          { label: 'Small (16px)', value: '16' }, { label: 'Medium (32px)', value: '32' },
          { label: 'Large (64px)', value: '64' }, { label: 'XL (96px)', value: '96' },
        ]},
      },
      defaultProps: { height: '32' },
      render: ({ height }) => <div style={{ height: `${height}px` }} />,
    },
    Divider: {
      fields: {
        color: { type: 'text', label: 'Colour' },
        thickness: { type: 'text', label: 'Thickness (px)' },
        style: { type: 'select', label: 'Style', options: [
          { label: 'Solid', value: 'solid' }, { label: 'Dashed', value: 'dashed' }, { label: 'Dotted', value: 'dotted' },
        ]},
      },
      defaultProps: { color: '#e0e0e0', thickness: '1', style: 'solid' },
      render: ({ color, thickness, style }) => (
        <hr style={{ border: 'none', borderTop: `${thickness}px ${style} ${color}`, margin: '16px 0' }} />
      ),
    },

    /* ── CONTENT ── */
    Heading: {
      fields: {
        text: { type: 'text', label: 'Heading Text' },
        level: { type: 'select', label: 'Level', options: [
          { label: 'H1', value: 'h1' }, { label: 'H2', value: 'h2' }, { label: 'H3', value: 'h3' }, { label: 'H4', value: 'h4' },
        ]},
        align: { type: 'select', label: 'Alignment', options: [
          { label: 'Left', value: 'left' }, { label: 'Centre', value: 'center' }, { label: 'Right', value: 'right' },
        ]},
        color: { type: 'text', label: 'Colour' },
      },
      defaultProps: { text: 'Your Heading', level: 'h2', align: 'left', color: '#111111' },
      render: ({ text, level, align, color }) => {
        const Tag = level
        const sizes = { h1: '2.5rem', h2: '2rem', h3: '1.5rem', h4: '1.25rem' }
        return <Tag style={{ fontFamily: FONT, textAlign: align, color, fontSize: sizes[level], margin: '0.5em 0', fontWeight: 700 }}>{text}</Tag>
      },
    },
    TextBlock: {
      fields: {
        text: { type: 'textarea', label: 'Text' },
        align: { type: 'select', label: 'Alignment', options: [
          { label: 'Left', value: 'left' }, { label: 'Centre', value: 'center' }, { label: 'Right', value: 'right' },
        ]},
        color: { type: 'text', label: 'Colour' },
        fontSize: { type: 'text', label: 'Font Size' },
      },
      defaultProps: { text: 'Add your text here. You can write paragraphs of content to describe your business, services, or anything else.', align: 'left', color: '#333333', fontSize: '1rem' },
      render: ({ text, align, color, fontSize }) => (
        <p style={{ fontFamily: FONT, textAlign: align, color, fontSize, lineHeight: 1.7, margin: '0.5em 0' }}>{text}</p>
      ),
    },
    Image: {
      fields: {
        src: { type: 'text', label: 'Image URL' },
        alt: { type: 'text', label: 'Alt Text' },
        width: { type: 'text', label: 'Width (e.g. 100%)' },
        borderRadius: { type: 'text', label: 'Border Radius' },
      },
      defaultProps: { src: '', alt: 'Image', width: '100%', borderRadius: '8px' },
      render: ({ src, alt, width, borderRadius }) => (
        <img
          src={src || placeholderBg(600, 400, 'Image')}
          alt={alt}
          style={{ width, borderRadius, display: 'block', maxWidth: '100%', height: 'auto' }}
        />
      ),
    },
    VideoEmbed: {
      fields: {
        url: { type: 'text', label: 'Video URL (YouTube/Vimeo)' },
        aspectRatio: { type: 'select', label: 'Aspect Ratio', options: [
          { label: '16:9', value: '56.25' }, { label: '4:3', value: '75' }, { label: '1:1', value: '100' },
        ]},
      },
      defaultProps: { url: '', aspectRatio: '56.25' },
      render: ({ url, aspectRatio }) => {
        let embedUrl = url
        if (url.includes('youtube.com/watch')) embedUrl = url.replace('watch?v=', 'embed/')
        if (url.includes('youtu.be/')) embedUrl = url.replace('youtu.be/', 'youtube.com/embed/')
        if (url.includes('vimeo.com/') && !url.includes('player')) embedUrl = url.replace('vimeo.com/', 'player.vimeo.com/video/')
        return (
          <div style={{ position: 'relative', paddingBottom: `${aspectRatio}%`, height: 0, overflow: 'hidden', borderRadius: '8px', background: '#e5e5e5' }}>
            {embedUrl ? (
              <iframe src={embedUrl} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0 }} allowFullScreen />
            ) : (
              <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999', fontFamily: FONT }}>Paste a video URL</div>
            )}
          </div>
        )
      },
    },
    Button: {
      fields: {
        text: { type: 'text', label: 'Button Text' },
        url: { type: 'text', label: 'Link URL' },
        variant: { type: 'select', label: 'Style', options: [
          { label: 'Primary', value: 'primary' }, { label: 'Secondary', value: 'secondary' }, { label: 'Outline', value: 'outline' },
        ]},
        align: { type: 'select', label: 'Alignment', options: [
          { label: 'Left', value: 'flex-start' }, { label: 'Centre', value: 'center' }, { label: 'Right', value: 'flex-end' },
        ]},
        size: { type: 'select', label: 'Size', options: [
          { label: 'Small', value: 'sm' }, { label: 'Medium', value: 'md' }, { label: 'Large', value: 'lg' },
        ]},
      },
      defaultProps: { text: 'Click Here', url: '#', variant: 'primary', align: 'flex-start', size: 'md' },
      render: ({ text, url, variant, align, size }) => {
        const pad = { sm: '8px 16px', md: '12px 24px', lg: '16px 32px' }
        const fs = { sm: '0.85rem', md: '1rem', lg: '1.1rem' }
        const base = { fontFamily: FONT, fontWeight: 600, fontSize: fs[size], padding: pad[size], borderRadius: '6px', cursor: 'pointer', textDecoration: 'none', display: 'inline-block', border: '2px solid', transition: 'opacity 0.2s' }
        const styles = {
          primary: { ...base, background: DARK, color: '#fff', borderColor: DARK },
          secondary: { ...base, background: GOLD, color: DARK, borderColor: GOLD },
          outline: { ...base, background: 'transparent', color: DARK, borderColor: DARK },
        }
        return (
          <div style={{ display: 'flex', justifyContent: align }}>
            <a href={url} style={styles[variant]}>{text}</a>
          </div>
        )
      },
    },
    IconText: {
      fields: {
        icon: { type: 'select', label: 'Icon', options: [
          { label: 'Star', value: 'star' }, { label: 'Heart', value: 'heart' }, { label: 'Check', value: 'check' },
          { label: 'Clock', value: 'clock' }, { label: 'Location', value: 'location' }, { label: 'Phone', value: 'phone' },
        ]},
        text: { type: 'text', label: 'Text' },
        iconSize: { type: 'text', label: 'Icon Size (px)' },
      },
      defaultProps: { icon: 'check', text: 'Feature item', iconSize: '24' },
      render: ({ icon, text, iconSize }) => {
        const svgs = {
          star: '<circle cx="12" cy="12" r="0"/><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.86L12 17.77 5.82 21l1.18-6.86-5-4.87 6.91-1.01z" fill="currentColor"/>',
          heart: '<path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 000-7.78z" fill="currentColor"/>',
          check: '<polyline points="20 6 9 17 4 12" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/>',
          clock: '<circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none"/><path d="M12 6v6l4 2" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/>',
          location: '<path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="currentColor"/><circle cx="12" cy="9" r="2.5" fill="#fff"/>',
          phone: '<path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6A19.79 19.79 0 012.12 4.18 2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" fill="none" stroke="currentColor" stroke-width="2"/>',
        }
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontFamily: FONT }}>
            <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" dangerouslySetInnerHTML={{ __html: svgs[icon] || svgs.check }} style={{ flexShrink: 0, color: GOLD }} />
            <span style={{ fontSize: '1rem', color: '#333' }}>{text}</span>
          </div>
        )
      },
    },

    /* ── BUSINESS ── */
    HeroBanner: {
      fields: {
        heading: { type: 'text', label: 'Heading' },
        subheading: { type: 'textarea', label: 'Subheading' },
        buttonText: { type: 'text', label: 'Button Text' },
        buttonUrl: { type: 'text', label: 'Button URL' },
        bgImage: { type: 'text', label: 'Background Image URL' },
        bgColor: { type: 'text', label: 'Background Colour' },
        overlayOpacity: { type: 'select', label: 'Overlay', options: [
          { label: 'None', value: '0' }, { label: 'Light', value: '0.3' }, { label: 'Medium', value: '0.5' }, { label: 'Heavy', value: '0.7' },
        ]},
        minHeight: { type: 'text', label: 'Min Height (e.g. 500px)' },
        textColor: { type: 'text', label: 'Text Colour' },
      },
      defaultProps: { heading: 'Welcome to Our Business', subheading: 'Professional services tailored to you', buttonText: 'Book Now', buttonUrl: '#', bgImage: '', bgColor: DARK, overlayOpacity: '0.5', minHeight: '500px', textColor: '#ffffff' },
      render: ({ heading, subheading, buttonText, buttonUrl, bgImage, bgColor, overlayOpacity, minHeight, textColor }) => (
        <div style={{ position: 'relative', minHeight, background: bgImage ? `url(${bgImage}) center/cover` : bgColor, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
          {bgImage && <div style={{ position: 'absolute', inset: 0, background: `rgba(0,0,0,${overlayOpacity})` }} />}
          <div style={{ position: 'relative', zIndex: 1, padding: '48px 24px', maxWidth: '800px' }}>
            <h1 style={{ fontFamily: FONT, fontSize: '3rem', fontWeight: 800, color: textColor, margin: '0 0 16px' }}>{heading}</h1>
            <p style={{ fontFamily: FONT, fontSize: '1.25rem', color: textColor, opacity: 0.9, margin: '0 0 32px', lineHeight: 1.6 }}>{subheading}</p>
            {buttonText && (
              <a href={buttonUrl} style={{ fontFamily: FONT, fontWeight: 600, fontSize: '1.1rem', background: GOLD, color: DARK, padding: '14px 32px', borderRadius: '6px', textDecoration: 'none', display: 'inline-block' }}>{buttonText}</a>
            )}
          </div>
        </div>
      ),
    },
    ServiceCard: {
      fields: {
        title: { type: 'text', label: 'Service Name' },
        description: { type: 'textarea', label: 'Description' },
        price: { type: 'text', label: 'Price' },
        duration: { type: 'text', label: 'Duration' },
        image: { type: 'text', label: 'Image URL' },
      },
      defaultProps: { title: 'Service Name', description: 'A brief description of this service.', price: '£45', duration: '60 min', image: '' },
      render: ({ title, description, price, duration, image }) => (
        <div style={{ fontFamily: FONT, border: '1px solid #e5e5e5', borderRadius: '12px', overflow: 'hidden', background: '#fff' }}>
          <img src={image || placeholderBg(400, 200, 'Service')} alt={title} style={{ width: '100%', height: '200px', objectFit: 'cover' }} />
          <div style={{ padding: '20px' }}>
            <h3 style={{ margin: '0 0 8px', fontSize: '1.25rem', fontWeight: 700 }}>{title}</h3>
            <p style={{ color: '#666', margin: '0 0 12px', fontSize: '0.95rem', lineHeight: 1.5 }}>{description}</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 700, fontSize: '1.1rem', color: GOLD }}>{price}</span>
              <span style={{ color: '#999', fontSize: '0.85rem' }}>{duration}</span>
            </div>
          </div>
        </div>
      ),
    },
    TeamMember: {
      fields: {
        name: { type: 'text', label: 'Name' },
        role: { type: 'text', label: 'Role' },
        bio: { type: 'textarea', label: 'Bio' },
        image: { type: 'text', label: 'Photo URL' },
      },
      defaultProps: { name: 'Team Member', role: 'Specialist', bio: 'A brief bio about this team member.', image: '' },
      render: ({ name, role, bio, image }) => (
        <div style={{ fontFamily: FONT, textAlign: 'center', padding: '24px' }}>
          <img src={image || placeholderBg(120, 120, 'Photo')} alt={name} style={{ width: '120px', height: '120px', borderRadius: '50%', objectFit: 'cover', margin: '0 auto 16px' }} />
          <h3 style={{ margin: '0 0 4px', fontSize: '1.2rem', fontWeight: 700 }}>{name}</h3>
          <p style={{ color: GOLD, margin: '0 0 12px', fontSize: '0.9rem', fontWeight: 600 }}>{role}</p>
          <p style={{ color: '#666', fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>{bio}</p>
        </div>
      ),
    },
    Testimonial: {
      fields: {
        quote: { type: 'textarea', label: 'Quote' },
        author: { type: 'text', label: 'Author' },
        role: { type: 'text', label: 'Role / Location' },
        rating: { type: 'select', label: 'Rating', options: [
          { label: '5 Stars', value: '5' }, { label: '4 Stars', value: '4' }, { label: '3 Stars', value: '3' },
        ]},
      },
      defaultProps: { quote: 'Absolutely fantastic experience. Could not recommend more highly!', author: 'Jane D.', role: 'Verified Client', rating: '5' },
      render: ({ quote, author, role, rating }) => (
        <div style={{ fontFamily: FONT, background: '#f9f9f9', borderRadius: '12px', padding: '32px', borderLeft: `4px solid ${GOLD}` }}>
          <div style={{ marginBottom: '12px', color: GOLD, fontSize: '1.2rem', letterSpacing: '2px' }}>{'★'.repeat(Number(rating))}<span style={{ color: '#ddd' }}>{'★'.repeat(5 - Number(rating))}</span></div>
          <p style={{ fontSize: '1.1rem', fontStyle: 'italic', color: '#333', lineHeight: 1.7, margin: '0 0 16px' }}>"{quote}"</p>
          <p style={{ margin: 0, fontWeight: 700, fontSize: '0.95rem' }}>{author}</p>
          <p style={{ margin: '2px 0 0', color: '#999', fontSize: '0.85rem' }}>{role}</p>
        </div>
      ),
    },
    BeforeAfterGallery: {
      fields: {
        beforeImage: { type: 'text', label: 'Before Image URL' },
        afterImage: { type: 'text', label: 'After Image URL' },
        caption: { type: 'text', label: 'Caption' },
      },
      defaultProps: { beforeImage: '', afterImage: '', caption: 'Before & After' },
      render: ({ beforeImage, afterImage, caption }) => (
        <div style={{ fontFamily: FONT }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ position: 'relative' }}>
              <img src={beforeImage || placeholderBg(300, 300, 'Before')} alt="Before" style={{ width: '100%', height: '300px', objectFit: 'cover' }} />
              <span style={{ position: 'absolute', bottom: '8px', left: '8px', background: 'rgba(0,0,0,0.6)', color: '#fff', padding: '4px 10px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>BEFORE</span>
            </div>
            <div style={{ position: 'relative' }}>
              <img src={afterImage || placeholderBg(300, 300, 'After')} alt="After" style={{ width: '100%', height: '300px', objectFit: 'cover' }} />
              <span style={{ position: 'absolute', bottom: '8px', left: '8px', background: GOLD, color: DARK, padding: '4px 10px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>AFTER</span>
            </div>
          </div>
          {caption && <p style={{ textAlign: 'center', color: '#666', marginTop: '12px', fontSize: '0.9rem' }}>{caption}</p>}
        </div>
      ),
    },
    OpeningHours: {
      fields: {
        title: { type: 'text', label: 'Title' },
        hours: { type: 'textarea', label: 'Hours (one per line: Day: Time)' },
      },
      defaultProps: { title: 'Opening Hours', hours: 'Monday: 9:00 - 18:00\nTuesday: 9:00 - 18:00\nWednesday: 9:00 - 18:00\nThursday: 9:00 - 20:00\nFriday: 9:00 - 18:00\nSaturday: 10:00 - 16:00\nSunday: Closed' },
      render: ({ title, hours }) => (
        <div style={{ fontFamily: FONT, background: '#f9f9f9', borderRadius: '12px', padding: '24px' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '1.2rem', fontWeight: 700 }}>{title}</h3>
          {hours.split('\n').map((line, i) => {
            const [day, ...time] = line.split(':')
            return (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #eee', fontSize: '0.95rem' }}>
                <span style={{ fontWeight: 600 }}>{day?.trim()}</span>
                <span style={{ color: '#666' }}>{time?.join(':')?.trim()}</span>
              </div>
            )
          })}
        </div>
      ),
    },
    ContactForm: {
      fields: {
        title: { type: 'text', label: 'Title' },
        submitText: { type: 'text', label: 'Submit Button Text' },
        fields: { type: 'text', label: 'Fields (comma-separated)' },
      },
      defaultProps: { title: 'Get in Touch', submitText: 'Send Message', fields: 'Name,Email,Phone,Message' },
      render: ({ title, submitText, fields: fieldStr }) => {
        const fieldNames = fieldStr.split(',').map(f => f.trim())
        return (
          <div style={{ fontFamily: FONT, maxWidth: '600px' }}>
            <h3 style={{ margin: '0 0 20px', fontSize: '1.3rem', fontWeight: 700 }}>{title}</h3>
            {fieldNames.map((f, i) => (
              <div key={i} style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: 600, fontSize: '0.85rem', color: '#555' }}>{f}</label>
                {f.toLowerCase() === 'message' ? (
                  <textarea rows={4} placeholder={f} style={{ width: '100%', border: '1px solid #ddd', borderRadius: '6px', padding: '10px 12px', fontFamily: FONT, fontSize: '0.95rem', resize: 'vertical' }} />
                ) : (
                  <input type="text" placeholder={f} style={{ width: '100%', border: '1px solid #ddd', borderRadius: '6px', padding: '10px 12px', fontFamily: FONT, fontSize: '0.95rem', boxSizing: 'border-box' }} />
                )}
              </div>
            ))}
            <button style={{ fontFamily: FONT, fontWeight: 600, background: DARK, color: '#fff', padding: '12px 24px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '1rem' }}>{submitText}</button>
          </div>
        )
      },
    },
    Map: {
      fields: {
        embedUrl: { type: 'text', label: 'Google Maps Embed URL' },
        height: { type: 'text', label: 'Height (px)' },
      },
      defaultProps: { embedUrl: '', height: '400' },
      render: ({ embedUrl, height }) => (
        <div style={{ borderRadius: '12px', overflow: 'hidden', background: '#e5e5e5', height: `${height}px` }}>
          {embedUrl ? (
            <iframe src={embedUrl} style={{ width: '100%', height: '100%', border: 0 }} allowFullScreen loading="lazy" />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999', fontFamily: FONT }}>Paste a Google Maps embed URL</div>
          )}
        </div>
      ),
    },
    FAQAccordion: {
      fields: {
        title: { type: 'text', label: 'Section Title' },
        items: { type: 'textarea', label: 'FAQ Items (Q?A format, one per line)' },
      },
      defaultProps: { title: 'Frequently Asked Questions', items: 'What services do you offer?We offer a wide range of professional services. Check our services page for full details.\nHow do I book?You can book online through our booking page or call us directly.\nWhat is your cancellation policy?We require 24 hours notice for cancellations.' },
      render: ({ title, items }) => {
        const faqs = items.split('\n').map(line => { const [q, ...a] = line.split('?'); return { q: q?.trim() + '?', a: a.join('?')?.trim() } })
        return (
          <div style={{ fontFamily: FONT }}>
            <h3 style={{ margin: '0 0 20px', fontSize: '1.3rem', fontWeight: 700 }}>{title}</h3>
            {faqs.map((faq, i) => (
              <details key={i} style={{ borderBottom: '1px solid #eee', padding: '16px 0' }}>
                <summary style={{ cursor: 'pointer', fontWeight: 600, fontSize: '1rem', color: '#222' }}>{faq.q}</summary>
                <p style={{ color: '#666', lineHeight: 1.7, margin: '12px 0 0', fontSize: '0.95rem' }}>{faq.a}</p>
              </details>
            ))}
          </div>
        )
      },
    },
    AnnouncementBar: {
      fields: {
        text: { type: 'text', label: 'Announcement Text' },
        bgColor: { type: 'text', label: 'Background Colour' },
        textColor: { type: 'text', label: 'Text Colour' },
        url: { type: 'text', label: 'Link URL (optional)' },
      },
      defaultProps: { text: 'Free consultation for new clients this month!', bgColor: GOLD, textColor: DARK, url: '' },
      render: ({ text, bgColor, textColor, url }) => {
        const inner = <span style={{ fontFamily: FONT, fontWeight: 600, fontSize: '0.9rem' }}>{text}</span>
        return (
          <div style={{ background: bgColor, color: textColor, textAlign: 'center', padding: '10px 16px' }}>
            {url ? <a href={url} style={{ color: textColor, textDecoration: 'underline' }}>{inner}</a> : inner}
          </div>
        )
      },
    },

    /* ── BOOKING ── */
    BookNowButton: {
      fields: {
        text: { type: 'text', label: 'Button Text' },
        url: { type: 'text', label: 'Booking URL' },
        size: { type: 'select', label: 'Size', options: [
          { label: 'Medium', value: 'md' }, { label: 'Large', value: 'lg' },
        ]},
        fullWidth: { type: 'select', label: 'Full Width', options: [
          { label: 'No', value: 'no' }, { label: 'Yes', value: 'yes' },
        ]},
      },
      defaultProps: { text: 'Book Now', url: '#', size: 'lg', fullWidth: 'no' },
      render: ({ text, url, size, fullWidth }) => (
        <div style={{ textAlign: 'center' }}>
          <a href={url} style={{ fontFamily: FONT, fontWeight: 700, display: fullWidth === 'yes' ? 'block' : 'inline-block', textAlign: 'center', background: GOLD, color: DARK, padding: size === 'lg' ? '16px 40px' : '12px 28px', borderRadius: '8px', fontSize: size === 'lg' ? '1.15rem' : '1rem', textDecoration: 'none', letterSpacing: '0.5px' }}>{text}</a>
        </div>
      ),
    },
    NextAvailableSlot: {
      fields: {
        heading: { type: 'text', label: 'Heading' },
        slotText: { type: 'text', label: 'Slot Text (placeholder)' },
        buttonText: { type: 'text', label: 'Button Text' },
      },
      defaultProps: { heading: 'Next Available', slotText: 'Today at 2:30 PM', buttonText: 'Book This Slot' },
      render: ({ heading, slotText, buttonText }) => (
        <div style={{ fontFamily: FONT, background: '#f9f9f9', borderRadius: '12px', padding: '24px', textAlign: 'center', border: `2px solid ${GOLD}` }}>
          <p style={{ margin: '0 0 4px', fontSize: '0.85rem', color: '#999', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>{heading}</p>
          <p style={{ margin: '0 0 16px', fontSize: '1.5rem', fontWeight: 700, color: DARK }}>{slotText}</p>
          <a href="#" style={{ fontFamily: FONT, fontWeight: 600, background: GOLD, color: DARK, padding: '10px 24px', borderRadius: '6px', textDecoration: 'none', fontSize: '0.95rem' }}>{buttonText}</a>
        </div>
      ),
    },
    ServiceList: {
      fields: {
        title: { type: 'text', label: 'Title' },
        services: { type: 'textarea', label: 'Services (Name|Price|Duration per line)' },
      },
      defaultProps: { title: 'Our Services', services: 'Haircut|£30|30 min\nColour|£65|90 min\nBlowdry|£25|30 min\nStyling|£40|45 min' },
      render: ({ title, services }) => (
        <div style={{ fontFamily: FONT }}>
          <h3 style={{ margin: '0 0 20px', fontSize: '1.3rem', fontWeight: 700 }}>{title}</h3>
          {services.split('\n').map((line, i) => {
            const [name, price, dur] = line.split('|').map(s => s.trim())
            return (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: '1px solid #eee' }}>
                <div>
                  <p style={{ margin: 0, fontWeight: 600, fontSize: '1rem' }}>{name}</p>
                  {dur && <p style={{ margin: '2px 0 0', color: '#999', fontSize: '0.8rem' }}>{dur}</p>}
                </div>
                <span style={{ fontWeight: 700, color: GOLD, fontSize: '1.05rem' }}>{price}</span>
              </div>
            )
          })}
        </div>
      ),
    },
    PackageCard: {
      fields: {
        name: { type: 'text', label: 'Package Name' },
        price: { type: 'text', label: 'Price' },
        description: { type: 'textarea', label: 'Description' },
        includes: { type: 'textarea', label: 'Includes (one per line)' },
        popular: { type: 'select', label: 'Popular Badge', options: [{ label: 'No', value: 'no' }, { label: 'Yes', value: 'yes' }] },
      },
      defaultProps: { name: 'Premium Package', price: '£120', description: 'Our most popular treatment package.', includes: 'Full consultation\nTreatment A\nTreatment B\nAftercare', popular: 'yes' },
      render: ({ name, price, description, includes, popular }) => (
        <div style={{ fontFamily: FONT, border: popular === 'yes' ? `2px solid ${GOLD}` : '1px solid #e5e5e5', borderRadius: '12px', padding: '28px', position: 'relative', background: '#fff' }}>
          {popular === 'yes' && <span style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', background: GOLD, color: DARK, fontSize: '0.7rem', fontWeight: 700, padding: '4px 14px', borderRadius: '20px', textTransform: 'uppercase', letterSpacing: '1px' }}>Most Popular</span>}
          <h3 style={{ margin: '0 0 4px', fontSize: '1.3rem', fontWeight: 700, textAlign: 'center' }}>{name}</h3>
          <p style={{ textAlign: 'center', fontSize: '2rem', fontWeight: 800, color: GOLD, margin: '8px 0 12px' }}>{price}</p>
          <p style={{ textAlign: 'center', color: '#666', fontSize: '0.9rem', margin: '0 0 20px' }}>{description}</p>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {includes.split('\n').map((item, i) => (
              <li key={i} style={{ padding: '8px 0', borderTop: '1px solid #f0f0f0', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill={GOLD}><path d="M6.5 11.5l-3-3 1-1 2 2 5-5 1 1z" /></svg>
                {item.trim()}
              </li>
            ))}
          </ul>
        </div>
      ),
    },
    GiftVoucher: {
      fields: {
        title: { type: 'text', label: 'Title' },
        description: { type: 'text', label: 'Description' },
        buttonText: { type: 'text', label: 'Button Text' },
        bgColor: { type: 'text', label: 'Background Colour' },
      },
      defaultProps: { title: 'Gift Vouchers', description: 'The perfect gift for someone special.', buttonText: 'Buy a Gift Voucher', bgColor: DARK },
      render: ({ title, description, buttonText, bgColor }) => (
        <div style={{ fontFamily: FONT, background: bgColor, borderRadius: '12px', padding: '40px', textAlign: 'center' }}>
          <h3 style={{ color: '#fff', margin: '0 0 8px', fontSize: '1.5rem', fontWeight: 700 }}>{title}</h3>
          <p style={{ color: 'rgba(255,255,255,0.7)', margin: '0 0 24px', fontSize: '1rem' }}>{description}</p>
          <a href="#" style={{ fontFamily: FONT, fontWeight: 600, background: GOLD, color: DARK, padding: '12px 28px', borderRadius: '6px', textDecoration: 'none', fontSize: '1rem' }}>{buttonText}</a>
        </div>
      ),
    },

    /* ── SHOP ── */
    ProductCard: {
      fields: {
        name: { type: 'text', label: 'Product Name' },
        price: { type: 'text', label: 'Price' },
        image: { type: 'text', label: 'Image URL' },
        description: { type: 'textarea', label: 'Description' },
        badge: { type: 'text', label: 'Badge (optional)' },
      },
      defaultProps: { name: 'Product Name', price: '£24.99', image: '', description: 'High-quality product for your daily routine.', badge: '' },
      render: ({ name, price, image, description, badge }) => (
        <div style={{ fontFamily: FONT, border: '1px solid #e5e5e5', borderRadius: '12px', overflow: 'hidden', background: '#fff' }}>
          <div style={{ position: 'relative' }}>
            <img src={image || placeholderBg(400, 300, 'Product')} alt={name} style={{ width: '100%', height: '240px', objectFit: 'cover' }} />
            {badge && <span style={{ position: 'absolute', top: '12px', left: '12px', background: GOLD, color: DARK, fontSize: '0.7rem', fontWeight: 700, padding: '4px 10px', borderRadius: '4px', textTransform: 'uppercase' }}>{badge}</span>}
          </div>
          <div style={{ padding: '16px' }}>
            <h4 style={{ margin: '0 0 4px', fontWeight: 700 }}>{name}</h4>
            <p style={{ color: '#666', fontSize: '0.85rem', margin: '0 0 12px', lineHeight: 1.5 }}>{description}</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>{price}</span>
              <button style={{ fontFamily: FONT, fontWeight: 600, background: DARK, color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }}>Add to Cart</button>
            </div>
          </div>
        </div>
      ),
    },
    ProductGrid: {
      fields: {
        columns: { type: 'select', label: 'Columns', options: [
          { label: '2', value: '2' }, { label: '3', value: '3' }, { label: '4', value: '4' },
        ]},
        gap: { type: 'text', label: 'Gap (px)' },
      },
      defaultProps: { columns: '3', gap: '24' },
      render: ({ columns, gap }) => (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: `${gap}px` }}>
          <DropZone zone="product-grid-items" />
        </div>
      ),
    },
    FeaturedProducts: {
      fields: {
        title: { type: 'text', label: 'Title' },
        subtitle: { type: 'text', label: 'Subtitle' },
      },
      defaultProps: { title: 'Featured Products', subtitle: 'Our top picks for you' },
      render: ({ title, subtitle }) => (
        <div style={{ fontFamily: FONT }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <h3 style={{ margin: '0 0 8px', fontSize: '1.5rem', fontWeight: 700 }}>{title}</h3>
            <p style={{ color: '#666', margin: 0 }}>{subtitle}</p>
          </div>
          <DropZone zone="featured-products-items" />
        </div>
      ),
    },
    CartWidget: {
      fields: {
        buttonText: { type: 'text', label: 'Button Text' },
        position: { type: 'select', label: 'Position', options: [
          { label: 'Left', value: 'flex-start' }, { label: 'Centre', value: 'center' }, { label: 'Right', value: 'flex-end' },
        ]},
      },
      defaultProps: { buttonText: 'View Cart (0)', position: 'flex-end' },
      render: ({ buttonText, position }) => (
        <div style={{ display: 'flex', justifyContent: position }}>
          <button style={{ fontFamily: FONT, fontWeight: 600, background: DARK, color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" /></svg>
            {buttonText}
          </button>
        </div>
      ),
    },

    /* ── BLOG ── */
    BlogPostCard: {
      fields: {
        title: { type: 'text', label: 'Title' },
        excerpt: { type: 'textarea', label: 'Excerpt' },
        date: { type: 'text', label: 'Date' },
        image: { type: 'text', label: 'Image URL' },
        url: { type: 'text', label: 'Read More URL' },
      },
      defaultProps: { title: 'Blog Post Title', excerpt: 'A brief excerpt from the blog post that gives readers a preview of the content.', date: '11 March 2026', image: '', url: '#' },
      render: ({ title, excerpt, date, image, url }) => (
        <div style={{ fontFamily: FONT, border: '1px solid #e5e5e5', borderRadius: '12px', overflow: 'hidden', background: '#fff' }}>
          <img src={image || placeholderBg(400, 200, 'Blog')} alt={title} style={{ width: '100%', height: '200px', objectFit: 'cover' }} />
          <div style={{ padding: '20px' }}>
            <p style={{ color: '#999', fontSize: '0.8rem', margin: '0 0 8px' }}>{date}</p>
            <h4 style={{ margin: '0 0 8px', fontWeight: 700, fontSize: '1.1rem' }}>{title}</h4>
            <p style={{ color: '#666', fontSize: '0.9rem', lineHeight: 1.6, margin: '0 0 12px' }}>{excerpt}</p>
            <a href={url} style={{ color: GOLD, fontWeight: 600, fontSize: '0.9rem', textDecoration: 'none' }}>Read more</a>
          </div>
        </div>
      ),
    },
    BlogGrid: {
      fields: {
        columns: { type: 'select', label: 'Columns', options: [
          { label: '2', value: '2' }, { label: '3', value: '3' },
        ]},
      },
      defaultProps: { columns: '3' },
      render: ({ columns }) => (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: '24px' }}>
          <DropZone zone="blog-grid-items" />
        </div>
      ),
    },
    NewsletterSignup: {
      fields: {
        title: { type: 'text', label: 'Title' },
        description: { type: 'text', label: 'Description' },
        buttonText: { type: 'text', label: 'Button Text' },
        bgColor: { type: 'text', label: 'Background Colour' },
      },
      defaultProps: { title: 'Stay Updated', description: 'Subscribe to our newsletter for the latest news and offers.', buttonText: 'Subscribe', bgColor: '#f9f9f9' },
      render: ({ title, description, buttonText, bgColor }) => (
        <div style={{ fontFamily: FONT, background: bgColor, borderRadius: '12px', padding: '40px', textAlign: 'center' }}>
          <h3 style={{ margin: '0 0 8px', fontSize: '1.3rem', fontWeight: 700 }}>{title}</h3>
          <p style={{ color: '#666', margin: '0 0 24px', fontSize: '0.95rem' }}>{description}</p>
          <div style={{ display: 'flex', gap: '8px', maxWidth: '440px', margin: '0 auto' }}>
            <input type="email" placeholder="your@email.com" style={{ flex: 1, border: '1px solid #ddd', borderRadius: '6px', padding: '12px 16px', fontFamily: FONT, fontSize: '0.95rem' }} />
            <button style={{ fontFamily: FONT, fontWeight: 600, background: DARK, color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '6px', cursor: 'pointer', whiteSpace: 'nowrap' }}>{buttonText}</button>
          </div>
        </div>
      ),
    },

    /* ── SOCIAL ── */
    InstagramFeed: {
      fields: {
        handle: { type: 'text', label: 'Instagram Handle' },
        columns: { type: 'select', label: 'Columns', options: [
          { label: '3', value: '3' }, { label: '4', value: '4' }, { label: '6', value: '6' },
        ]},
        count: { type: 'select', label: 'Number of Posts', options: [
          { label: '3', value: '3' }, { label: '6', value: '6' }, { label: '9', value: '9' },
        ]},
      },
      defaultProps: { handle: '@yourbusiness', columns: '3', count: '6' },
      render: ({ handle, columns, count }) => (
        <div style={{ fontFamily: FONT }}>
          <p style={{ textAlign: 'center', fontWeight: 600, marginBottom: '16px' }}>{handle}</p>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: '4px' }}>
            {Array.from({ length: Number(count) }, (_, i) => (
              <div key={i} style={{ paddingBottom: '100%', background: '#e5e5e5', borderRadius: '4px', position: 'relative' }}>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#bbb', fontSize: '0.75rem' }}>Post {i + 1}</div>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    SocialLinks: {
      fields: {
        facebook: { type: 'text', label: 'Facebook URL' },
        instagram: { type: 'text', label: 'Instagram URL' },
        twitter: { type: 'text', label: 'X (Twitter) URL' },
        tiktok: { type: 'text', label: 'TikTok URL' },
        linkedin: { type: 'text', label: 'LinkedIn URL' },
        align: { type: 'select', label: 'Alignment', options: [
          { label: 'Left', value: 'flex-start' }, { label: 'Centre', value: 'center' }, { label: 'Right', value: 'flex-end' },
        ]},
      },
      defaultProps: { facebook: '#', instagram: '#', twitter: '', tiktok: '', linkedin: '', align: 'center' },
      render: ({ facebook, instagram, twitter, tiktok, linkedin, align }) => {
        const links = [
          { url: facebook, label: 'F', name: 'Facebook' },
          { url: instagram, label: 'IG', name: 'Instagram' },
          { url: twitter, label: 'X', name: 'Twitter' },
          { url: tiktok, label: 'TT', name: 'TikTok' },
          { url: linkedin, label: 'in', name: 'LinkedIn' },
        ].filter(l => l.url)
        return (
          <div style={{ display: 'flex', justifyContent: align, gap: '12px' }}>
            {links.map((l, i) => (
              <a key={i} href={l.url} title={l.name} style={{ width: '40px', height: '40px', borderRadius: '50%', background: DARK, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', fontFamily: FONT, fontWeight: 700, fontSize: '0.75rem' }}>{l.label}</a>
            ))}
          </div>
        )
      },
    },
    WhatsAppButton: {
      fields: {
        phone: { type: 'text', label: 'Phone Number (with country code)' },
        text: { type: 'text', label: 'Button Text' },
        message: { type: 'text', label: 'Pre-filled Message' },
      },
      defaultProps: { phone: '+447000000000', text: 'Chat on WhatsApp', message: 'Hi! I\'d like to enquire about your services.' },
      render: ({ phone, text, message }) => (
        <div style={{ textAlign: 'center' }}>
          <a href={`https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`} target="_blank" rel="noopener noreferrer" style={{ fontFamily: FONT, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '10px', background: '#25D366', color: '#fff', padding: '14px 28px', borderRadius: '8px', textDecoration: 'none', fontSize: '1rem' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" /><path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.5.5 0 00.612.638l4.682-1.228A11.953 11.953 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22a9.94 9.94 0 01-5.39-1.586l-.376-.243-3.128.82.835-3.047-.266-.398A9.96 9.96 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" /></svg>
            {text}
          </a>
        </div>
      ),
    },
    ReviewsWidget: {
      fields: {
        title: { type: 'text', label: 'Title' },
        rating: { type: 'text', label: 'Average Rating' },
        count: { type: 'text', label: 'Review Count' },
        source: { type: 'text', label: 'Source (e.g. Google)' },
      },
      defaultProps: { title: 'What Our Clients Say', rating: '4.9', count: '127', source: 'Google' },
      render: ({ title, rating, count, source }) => (
        <div style={{ fontFamily: FONT, textAlign: 'center', padding: '24px' }}>
          <h3 style={{ margin: '0 0 12px', fontSize: '1.3rem', fontWeight: 700 }}>{title}</h3>
          <div style={{ fontSize: '3rem', fontWeight: 800, color: GOLD, margin: '0 0 4px' }}>{rating}</div>
          <div style={{ color: GOLD, fontSize: '1.5rem', letterSpacing: '2px', marginBottom: '8px' }}>{'★'.repeat(Math.round(Number(rating)))}</div>
          <p style={{ color: '#999', margin: 0, fontSize: '0.9rem' }}>Based on {count} reviews on {source}</p>
        </div>
      ),
    },
  },
})

/* ───────────────────────────── TOOLTIP ───────────────────────────── */

function Tip({ text, children }) {
  const [show, setShow] = useState(false)
  return (
    <span style={{ position: 'relative', display: 'inline-flex' }} onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      {show && (
        <span style={{ position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: '6px', padding: '4px 10px', background: T.panel, color: T.text, border: `1px solid ${T.gold}`, borderRadius: '4px', fontSize: '0.7rem', fontFamily: FONT, whiteSpace: 'nowrap', zIndex: 999, pointerEvents: 'none' }}>{text}</span>
      )}
    </span>
  )
}

/* ───────────────────────────── CONTEXT MENU ───────────────────────────── */

function CtxMenu({ x, y, onClose, onAction }) {
  const items = [
    { key: 'duplicate', label: 'Duplicate', icon: icons.duplicate },
    { key: 'delete', label: 'Delete', icon: icons.trash },
    { key: 'moveUp', label: 'Move Up', icon: icons.moveUp },
    { key: 'moveDown', label: 'Move Down', icon: icons.moveDown },
    { key: 'copyStyle', label: 'Copy Style', icon: icons.copy },
    { key: 'pasteStyle', label: 'Paste Style', icon: icons.paste },
  ]
  useEffect(() => {
    const h = () => onClose()
    window.addEventListener('click', h)
    return () => window.removeEventListener('click', h)
  }, [onClose])
  return (
    <div style={{ position: 'fixed', top: y, left: x, zIndex: 9999, background: T.panel, border: `1px solid ${T.border}`, borderRadius: '8px', padding: '4px 0', minWidth: '180px', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }} onClick={e => e.stopPropagation()}>
      {items.map(it => (
        <button key={it.key} onClick={() => { onAction(it.key); onClose() }} style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '8px 14px', border: 'none', background: 'transparent', color: T.text, fontFamily: FONT, fontSize: '0.82rem', cursor: 'pointer', transition: 'background 0.15s' }} onMouseEnter={e => e.currentTarget.style.background = T.hover} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
          <span style={{ display: 'flex', color: T.muted }}>{it.icon}</span>{it.label}
        </button>
      ))}
    </div>
  )
}

/* ───────────────────────────── INNER EDITOR (uses usePuck) ───────────────────────────── */

function EditorInner({ pages, currentSlug, onChangePage, onAddPage, onRenamePage, onDeletePage, onDuplicatePage, onSaveDraft, onPublish, saving, previewWidth, setPreviewWidth }) {
  const { appState, dispatch, history } = usePuck()
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedCats, setExpandedCats] = useState(() => Object.keys(CATEGORIES).reduce((a, k) => ({ ...a, [k]: true }), {}))
  const [rightTab, setRightTab] = useState('styles')
  const [seoTitle, setSeoTitle] = useState('')
  const [seoDesc, setSeoDesc] = useState('')
  const [ogImage, setOgImage] = useState('')
  const [leftSection, setLeftSection] = useState('pages')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [pageMenuSlug, setPageMenuSlug] = useState(null)
  const [ctxMenu, setCtxMenu] = useState(null)

  // Style tab state
  const [styleBg, setStyleBg] = useState('')
  const [stylePadding, setStylePadding] = useState('m')
  const [styleTextColor, setStyleTextColor] = useState('')
  const [styleTextAlign, setStyleTextAlign] = useState('left')
  const [styleBorderRadius, setStyleBorderRadius] = useState('none')
  const [styleWidth, setStyleWidth] = useState('')
  const [styleHeight, setStyleHeight] = useState('')
  const [styleMaxWidth, setStyleMaxWidth] = useState('')
  const [styleOpacity, setStyleOpacity] = useState(100)
  const [styleFontSize, setStyleFontSize] = useState('')
  const [styleFontWeight, setStyleFontWeight] = useState('400')
  const [styleLineHeight, setStyleLineHeight] = useState('')
  const [styleBorderWidth, setStyleBorderWidth] = useState('')
  const [styleBorderColor, setStyleBorderColor] = useState('')
  const [styleBorderStyle, setStyleBorderStyle] = useState('solid')

  const toggleCat = (cat) => setExpandedCats(prev => ({ ...prev, [cat]: !prev[cat] }))

  const filteredCategories = useMemo(() => {
    if (!searchTerm) return CATEGORIES
    const lower = searchTerm.toLowerCase()
    const result = {}
    Object.entries(CATEGORIES).forEach(([cat, comps]) => {
      const filtered = comps.filter(c => (COMPONENT_LABELS[c] || c).toLowerCase().includes(lower))
      if (filtered.length) result[cat] = filtered
    })
    return result
  }, [searchTerm])

  const selectedIndex = appState?.ui?.itemSelector?.index
  const selectedItem = selectedIndex !== undefined ? (appState?.data?.content || [])[selectedIndex] : null

  const breadcrumbParts = useMemo(() => {
    const parts = [{ label: 'Body', index: null }]
    if (selectedItem) {
      parts.push({ label: COMPONENT_LABELS[selectedItem.type] || selectedItem.type, index: selectedIndex })
    }
    return parts
  }, [selectedItem, selectedIndex])

  const layers = appState?.data?.content || []
  const brandPalette = [T.bg, T.gold, '#ffffff', '#f9f9f9', T.border, '#666666', '#e5e5e5', '#25D366']

  // Keyboard shortcuts
  useEffect(() => {
    const h = (e) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z') { e.preventDefault(); history.back?.() }
        if (e.key === 'y') { e.preventDefault(); history.forward?.() }
        if (e.key === 'd' && selectedIndex !== undefined) {
          e.preventDefault()
          const content = [...(appState?.data?.content || [])]
          const item = content[selectedIndex]
          if (item) { content.splice(selectedIndex + 1, 0, { ...item, props: { ...item.props, id: `${item.type}-${Date.now()}` } }); dispatch({ type: 'setData', data: { ...appState.data, content } }) }
        }
        if (e.key === 's') { e.preventDefault(); onSaveDraft() }
      }
      if (e.key === 'Delete' && selectedIndex !== undefined) {
        const content = [...(appState?.data?.content || [])]
        content.splice(selectedIndex, 1)
        dispatch({ type: 'setData', data: { ...appState.data, content } })
        dispatch({ type: 'setUi', ui: { itemSelector: null } })
      }
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [selectedIndex, appState, dispatch, history, onSaveDraft])

  // Fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => {})
    else document.exitFullscreen().catch(() => {})
    setIsFullscreen(!isFullscreen)
  }

  // Context menu handler
  const handleCtxAction = useCallback((action) => {
    if (selectedIndex === undefined) return
    const content = [...(appState?.data?.content || [])]
    if (action === 'delete') { content.splice(selectedIndex, 1); dispatch({ type: 'setData', data: { ...appState.data, content } }); dispatch({ type: 'setUi', ui: { itemSelector: null } }) }
    if (action === 'duplicate') { const item = content[selectedIndex]; if (item) { content.splice(selectedIndex + 1, 0, { ...item, props: { ...item.props, id: `${item.type}-${Date.now()}` } }); dispatch({ type: 'setData', data: { ...appState.data, content } }) } }
    if (action === 'moveUp' && selectedIndex > 0) { [content[selectedIndex - 1], content[selectedIndex]] = [content[selectedIndex], content[selectedIndex - 1]]; dispatch({ type: 'setData', data: { ...appState.data, content } }); dispatch({ type: 'setUi', ui: { itemSelector: { index: selectedIndex - 1 } } }) }
    if (action === 'moveDown' && selectedIndex < content.length - 1) { [content[selectedIndex], content[selectedIndex + 1]] = [content[selectedIndex + 1], content[selectedIndex]]; dispatch({ type: 'setData', data: { ...appState.data, content } }); dispatch({ type: 'setUi', ui: { itemSelector: { index: selectedIndex + 1 } } }) }
  }, [selectedIndex, appState, dispatch])

  // Dark input style helper
  const dkInput = { background: T.input, color: T.text, border: `1px solid ${T.border}`, borderRadius: '6px', padding: '8px 12px', fontFamily: FONT, fontSize: '0.85rem', boxSizing: 'border-box', width: '100%', outline: 'none' }
  const dkLabel = { fontWeight: 600, fontSize: '0.75rem', color: T.muted, display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }
  const sectionTitle = (text) => <div style={{ ...dkLabel, fontSize: '0.7rem', padding: '10px 0 6px', borderBottom: `1px solid ${T.border}`, marginBottom: '12px' }}>{text}</div>

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 9999, display: 'flex', flexDirection: 'column', fontFamily: FONT, overflow: 'hidden', background: T.bg }} onContextMenu={e => { if (selectedIndex !== undefined) { e.preventDefault(); setCtxMenu({ x: e.clientX, y: e.clientY }) } }}>

      {/* ── TOP BAR (48px) ── */}
      <div style={{ height: '48px', background: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 12px', flexShrink: 0, zIndex: 50, borderBottom: `1px solid ${T.border}` }}>
        {/* Left: Logo + Page selector + Add */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <a href="/dashboard/website" style={{ color: T.gold, fontFamily: FONT, fontWeight: 800, fontSize: '1.2rem', textDecoration: 'none', letterSpacing: '-0.5px', marginRight: '4px' }}>R.</a>
          <select value={currentSlug} onChange={e => onChangePage(e.target.value)} style={{ background: T.input, color: T.text, border: `1px solid ${T.border}`, borderRadius: '6px', padding: '5px 28px 5px 10px', fontFamily: FONT, fontSize: '0.82rem', cursor: 'pointer', minWidth: '130px', appearance: 'none', backgroundImage: `url("data:image/svg+xml,${encodeURIComponent('<svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 1l4 4 4-4" stroke="%23999" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>')}")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center' }}>
            {pages.map(p => <option key={p.slug} value={p.slug}>{p.title || p.slug}</option>)}
          </select>
          <Tip text="Add Page"><button onClick={onAddPage} style={{ background: 'transparent', border: `1px solid ${T.border}`, color: T.muted, borderRadius: '6px', padding: '5px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.borderColor = T.gold; e.currentTarget.style.color = T.gold }} onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.muted }}>{icons.plus}</button></Tip>
        </div>

        {/* Centre: Responsive preview */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
          {[
            { w: 1200, icon: icons.desktop, label: 'Desktop' },
            { w: 768, icon: icons.tablet, label: 'Tablet' },
            { w: 568, icon: icons.mobileLandscape, label: 'Mobile Landscape' },
            { w: 375, icon: icons.mobile, label: 'Mobile Portrait' },
          ].map(({ w, icon, label }) => (
            <Tip key={w} text={label}>
              <button onClick={() => setPreviewWidth(w)} style={{ background: 'transparent', color: previewWidth === w ? T.gold : '#666', border: 'none', padding: '6px 12px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', transition: 'color 0.2s', position: 'relative' }}>
                {icon}
                {previewWidth === w && <div style={{ position: 'absolute', bottom: '-1px', left: '50%', transform: 'translateX(-50%)', width: '24px', height: '2px', background: T.gold, borderRadius: '1px' }} />}
              </button>
            </Tip>
          ))}
        </div>

        {/* Right: Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Tip text="Undo (Ctrl+Z)"><button onClick={() => history.back?.()} disabled={!history.hasPast} style={{ background: 'transparent', border: 'none', color: history.hasPast ? T.text : '#444', cursor: history.hasPast ? 'pointer' : 'default', padding: '6px', display: 'flex', transition: 'color 0.2s' }}>{icons.undo}</button></Tip>
          <Tip text="Redo (Ctrl+Y)"><button onClick={() => history.forward?.()} disabled={!history.hasFuture} style={{ background: 'transparent', border: 'none', color: history.hasFuture ? T.text : '#444', cursor: history.hasFuture ? 'pointer' : 'default', padding: '6px', display: 'flex', transition: 'color 0.2s' }}>{icons.redo}</button></Tip>
          <div style={{ width: '1px', height: '20px', background: T.border, margin: '0 4px' }} />
          <Tip text="Preview"><button onClick={() => setShowPreview(!showPreview)} style={{ background: 'transparent', border: 'none', color: showPreview ? T.gold : '#666', cursor: 'pointer', padding: '6px', display: 'flex', transition: 'color 0.2s' }}>{icons.preview}</button></Tip>
          <Tip text="Fullscreen"><button onClick={toggleFullscreen} style={{ background: 'transparent', border: 'none', color: isFullscreen ? T.gold : '#666', cursor: 'pointer', padding: '6px', display: 'flex', transition: 'color 0.2s' }}>{icons.fullscreen}</button></Tip>
          <div style={{ width: '1px', height: '20px', background: T.border, margin: '0 4px' }} />
          {saving && <span style={{ color: T.muted, fontSize: '0.75rem', marginRight: '4px' }}>Saving...</span>}
          <button onClick={onSaveDraft} style={{ background: 'transparent', color: T.text, border: 'none', padding: '6px 12px', fontFamily: FONT, fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = T.gold} onMouseLeave={e => e.currentTarget.style.color = T.text}>Save Draft</button>
          <button onClick={onPublish} style={{ background: T.gold, color: T.bg, border: 'none', borderRadius: '6px', padding: '6px 16px', fontFamily: FONT, fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', transition: 'opacity 0.2s' }} onMouseEnter={e => e.currentTarget.style.opacity = '0.85'} onMouseLeave={e => e.currentTarget.style.opacity = '1'}>Publish</button>
        </div>
      </div>

      {/* ── MAIN AREA ── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* LEFT PANEL (280px) */}
        <div style={{ width: '280px', background: T.panel, borderRight: `1px solid ${T.border}`, display: 'flex', flexDirection: 'column', flexShrink: 0, overflow: 'hidden' }}>
          {/* Section tabs */}
          <div style={{ display: 'flex', borderBottom: `1px solid ${T.border}`, flexShrink: 0 }}>
            {[{ key: 'pages', label: 'Pages', icon: icons.page }, { key: 'layers', label: 'Layers', icon: icons.layers }].map(s => (
              <button key={s.key} onClick={() => setLeftSection(s.key)} style={{ flex: 1, padding: '10px 0', border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: FONT, fontWeight: 600, fontSize: '0.72rem', color: leftSection === s.key ? T.gold : T.muted, borderBottom: leftSection === s.key ? `2px solid ${T.gold}` : '2px solid transparent', transition: 'all 0.2s', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <span style={{ display: 'flex' }}>{s.icon}</span>{s.label}
              </button>
            ))}
          </div>

          <div style={{ flex: 1, overflow: 'auto' }}>
            {/* PAGES section */}
            {leftSection === 'pages' && (
              <div style={{ padding: '4px 0' }}>
                {pages.map(p => (
                  <div key={p.slug} style={{ display: 'flex', alignItems: 'center', padding: '0', borderLeft: currentSlug === p.slug ? `3px solid ${T.gold}` : '3px solid transparent', transition: 'all 0.2s' }}>
                    <button onClick={() => onChangePage(p.slug)} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', border: 'none', background: currentSlug === p.slug ? `${T.gold}15` : 'transparent', cursor: 'pointer', fontFamily: FONT, fontSize: '0.85rem', color: currentSlug === p.slug ? T.text : T.muted, textAlign: 'left', transition: 'all 0.2s' }} onMouseEnter={e => { if (currentSlug !== p.slug) e.currentTarget.style.background = T.hover }} onMouseLeave={e => { if (currentSlug !== p.slug) e.currentTarget.style.background = 'transparent' }}>
                      <span style={{ display: 'flex', color: currentSlug === p.slug ? T.gold : '#555' }}>{icons.page}</span>
                      {p.title || p.slug}
                      {p.status === 'published' && <span style={{ marginLeft: 'auto', fontSize: '0.6rem', background: '#1a3a1a', color: '#4ade80', padding: '2px 6px', borderRadius: '3px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Live</span>}
                    </button>
                    <div style={{ position: 'relative' }}>
                      <button onClick={(e) => { e.stopPropagation(); setPageMenuSlug(pageMenuSlug === p.slug ? null : p.slug) }} style={{ background: 'transparent', border: 'none', color: T.muted, cursor: 'pointer', padding: '8px', display: 'flex', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = T.text} onMouseLeave={e => e.currentTarget.style.color = T.muted}>{icons.dots}</button>
                      {pageMenuSlug === p.slug && (
                        <div style={{ position: 'absolute', right: 0, top: '100%', zIndex: 100, background: T.input, border: `1px solid ${T.border}`, borderRadius: '8px', padding: '4px 0', minWidth: '140px', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
                          <button onClick={() => { onRenamePage?.(p.slug); setPageMenuSlug(null) }} style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '8px 12px', border: 'none', background: 'transparent', color: T.text, fontFamily: FONT, fontSize: '0.82rem', cursor: 'pointer', transition: 'background 0.15s' }} onMouseEnter={e => e.currentTarget.style.background = T.hover} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}><span style={{ display: 'flex', color: T.muted }}>{icons.rename}</span>Rename</button>
                          <button onClick={() => { onDuplicatePage?.(p.slug); setPageMenuSlug(null) }} style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '8px 12px', border: 'none', background: 'transparent', color: T.text, fontFamily: FONT, fontSize: '0.82rem', cursor: 'pointer', transition: 'background 0.15s' }} onMouseEnter={e => e.currentTarget.style.background = T.hover} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}><span style={{ display: 'flex', color: T.muted }}>{icons.duplicate}</span>Duplicate</button>
                          <button onClick={() => { onDeletePage?.(p.slug); setPageMenuSlug(null) }} style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '8px 12px', border: 'none', background: 'transparent', color: '#e55', fontFamily: FONT, fontSize: '0.82rem', cursor: 'pointer', transition: 'background 0.15s' }} onMouseEnter={e => e.currentTarget.style.background = T.hover} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}><span style={{ display: 'flex' }}>{icons.trash}</span>Delete</button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* LAYERS section */}
            {leftSection === 'layers' && (
              <div style={{ padding: '4px 0' }}>
                {layers.length === 0 && <p style={{ color: T.muted, fontSize: '0.82rem', textAlign: 'center', marginTop: '40px' }}>No components yet</p>}
                {layers.map((item, i) => {
                  const isSelected = selectedIndex === i
                  return (
                    <div key={item.props?.id || i} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 10px', borderLeft: isSelected ? `3px solid ${T.gold}` : '3px solid transparent', background: isSelected ? `${T.gold}18` : 'transparent', cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = T.hover }} onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent' }} onClick={() => dispatch({ type: 'setUi', ui: { itemSelector: { index: i } } })}>
                      <span style={{ color: '#555', display: 'flex', cursor: 'grab' }}>{icons.drag}</span>
                      <span style={{ display: 'flex', color: isSelected ? T.gold : '#555' }}>{catIcons[Object.keys(CATEGORIES).find(c => CATEGORIES[c].includes(item.type))] || icons.layout}</span>
                      <span style={{ flex: 1, fontSize: '0.82rem', fontWeight: isSelected ? 600 : 400, color: isSelected ? T.text : T.muted }}>{COMPONENT_LABELS[item.type] || item.type}</span>
                      <button style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#555', display: 'flex', padding: '2px', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = T.text} onMouseLeave={e => e.currentTarget.style.color = '#555'} title="Toggle visibility">{icons.eye}</button>
                      <button style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#555', display: 'flex', padding: '2px', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = T.text} onMouseLeave={e => e.currentTarget.style.color = '#555'} title="Lock">{icons.lock}</button>
                      <button onClick={(e) => { e.stopPropagation(); const content = [...layers]; content.splice(i, 1); dispatch({ type: 'setData', data: { ...appState.data, content } }) }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#555', display: 'flex', padding: '2px', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#e55'} onMouseLeave={e => e.currentTarget.style.color = '#555'} title="Delete">{icons.trash}</button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* CENTRE CANVAS */}
        <div style={{ flex: 1, background: T.canvas, overflow: 'auto', display: 'flex', justifyContent: 'center', padding: '24px' }}>
          <div style={{
            width: previewWidth === 1200 ? '100%' : `${previewWidth}px`,
            maxWidth: '100%',
            transition: 'width 0.3s ease',
            boxShadow: '0 4px 40px rgba(0,0,0,0.4)',
            ...(previewWidth === 768 ? {
              border: `8px solid ${T.border}`,
              borderRadius: '20px',
              background: '#fff',
              overflow: 'hidden',
              alignSelf: 'flex-start',
            } : previewWidth === 568 ? {
              border: `6px solid ${T.border}`,
              borderRadius: '16px',
              background: '#fff',
              overflow: 'hidden',
              alignSelf: 'flex-start',
            } : previewWidth === 375 ? {
              border: `6px solid ${T.border}`,
              borderRadius: '32px',
              background: '#fff',
              overflow: 'hidden',
              alignSelf: 'flex-start',
              position: 'relative',
            } : {
              background: '#fff',
              alignSelf: 'flex-start',
            }),
          }}>
            {previewWidth === 375 && (
              <div style={{ height: '28px', background: T.border, display: 'flex', justifyContent: 'center', alignItems: 'flex-end', paddingBottom: '4px' }}>
                <div style={{ width: '80px', height: '6px', background: '#555', borderRadius: '3px' }} />
              </div>
            )}
            <div style={{ minHeight: '400px' }}>
              <Puck.Preview />
            </div>
          </div>
        </div>

        {/* RIGHT PANEL (320px) */}
        <div style={{ width: '320px', background: T.panel, borderLeft: `1px solid ${T.border}`, display: 'flex', flexDirection: 'column', flexShrink: 0, overflow: 'hidden' }}>
          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: `1px solid ${T.border}`, flexShrink: 0 }}>
            {[
              { key: 'styles', label: 'Styles' },
              { key: 'properties', label: 'Properties' },
              { key: 'components', label: 'Components' },
            ].map(tab => (
              <button key={tab.key} onClick={() => setRightTab(tab.key)} style={{ flex: 1, padding: '11px 0', border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: FONT, fontWeight: 600, fontSize: '0.72rem', color: rightTab === tab.key ? T.text : T.muted, borderBottom: rightTab === tab.key ? `2px solid ${T.gold}` : '2px solid transparent', transition: 'all 0.2s', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{tab.label}</button>
            ))}
          </div>

          <div style={{ flex: 1, overflow: 'auto', padding: '12px' }}>

            {/* STYLES TAB */}
            {rightTab === 'styles' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {/* Selection info */}
                {selectedItem && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', background: `${T.gold}12`, borderRadius: '6px', marginBottom: '8px', border: `1px solid ${T.gold}30` }}>
                    <span style={{ display: 'flex', color: T.gold }}>{catIcons[Object.keys(CATEGORIES).find(c => CATEGORIES[c].includes(selectedItem.type))] || icons.layout}</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: T.gold }}>{COMPONENT_LABELS[selectedItem.type] || selectedItem.type}</span>
                  </div>
                )}

                {/* Size */}
                {sectionTitle('Size')}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                  <div><label style={dkLabel}>Width</label><input style={dkInput} value={styleWidth} onChange={e => setStyleWidth(e.target.value)} placeholder="auto" onFocus={e => e.target.style.borderColor = T.gold} onBlur={e => e.target.style.borderColor = T.border} /></div>
                  <div><label style={dkLabel}>Height</label><input style={dkInput} value={styleHeight} onChange={e => setStyleHeight(e.target.value)} placeholder="auto" onFocus={e => e.target.style.borderColor = T.gold} onBlur={e => e.target.style.borderColor = T.border} /></div>
                  <div style={{ gridColumn: 'span 2' }}><label style={dkLabel}>Max Width</label><input style={dkInput} value={styleMaxWidth} onChange={e => setStyleMaxWidth(e.target.value)} placeholder="none" onFocus={e => e.target.style.borderColor = T.gold} onBlur={e => e.target.style.borderColor = T.border} /></div>
                </div>

                {/* Space */}
                {sectionTitle('Space')}
                <div style={{ display: 'flex', gap: '4px', marginBottom: '12px' }}>
                  {['none', 's', 'm', 'l', 'xl'].map(p => (
                    <button key={p} onClick={() => setStylePadding(p)} style={{ flex: 1, padding: '6px 0', border: `1px solid ${stylePadding === p ? T.gold : T.border}`, borderRadius: '6px', background: stylePadding === p ? `${T.gold}20` : T.input, cursor: 'pointer', fontFamily: FONT, fontWeight: 600, fontSize: '0.7rem', color: stylePadding === p ? T.gold : T.muted, textTransform: 'uppercase', transition: 'all 0.2s' }}>{p}</button>
                  ))}
                </div>

                {/* Typography */}
                {sectionTitle('Typography')}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '4px' }}>
                  <div><label style={dkLabel}>Size</label><input style={dkInput} value={styleFontSize} onChange={e => setStyleFontSize(e.target.value)} placeholder="1rem" onFocus={e => e.target.style.borderColor = T.gold} onBlur={e => e.target.style.borderColor = T.border} /></div>
                  <div><label style={dkLabel}>Weight</label>
                    <select value={styleFontWeight} onChange={e => setStyleFontWeight(e.target.value)} style={{ ...dkInput, cursor: 'pointer' }}>
                      <option value="300">Light</option><option value="400">Regular</option><option value="600">Semi Bold</option><option value="700">Bold</option><option value="800">Extra Bold</option>
                    </select>
                  </div>
                  <div><label style={dkLabel}>Line Height</label><input style={dkInput} value={styleLineHeight} onChange={e => setStyleLineHeight(e.target.value)} placeholder="1.5" onFocus={e => e.target.style.borderColor = T.gold} onBlur={e => e.target.style.borderColor = T.border} /></div>
                  <div><label style={dkLabel}>Align</label>
                    <div style={{ display: 'flex', gap: '2px' }}>
                      {[{ key: 'left', icon: icons.alignLeft }, { key: 'center', icon: icons.alignCenter }, { key: 'right', icon: icons.alignRight }].map(a => (
                        <button key={a.key} onClick={() => setStyleTextAlign(a.key)} style={{ flex: 1, padding: '7px 0', border: `1px solid ${styleTextAlign === a.key ? T.gold : T.border}`, borderRadius: '4px', background: styleTextAlign === a.key ? `${T.gold}20` : T.input, cursor: 'pointer', display: 'flex', justifyContent: 'center', color: styleTextAlign === a.key ? T.gold : T.muted, transition: 'all 0.2s' }}>{a.icon}</button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Text Colour */}
                <div style={{ marginBottom: '12px', marginTop: '8px' }}>
                  <label style={dkLabel}>Text Colour</label>
                  <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                    {brandPalette.map(c => (
                      <button key={`tc-${c}`} onClick={() => setStyleTextColor(c)} style={{ width: '26px', height: '26px', borderRadius: '6px', background: c, border: styleTextColor === c ? `2px solid ${T.gold}` : `1px solid ${T.border}`, cursor: 'pointer', transition: 'transform 0.15s' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.15)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'} />
                    ))}
                  </div>
                </div>

                {/* Background */}
                {sectionTitle('Background')}
                <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginBottom: '12px' }}>
                  {brandPalette.map(c => (
                    <button key={`bg-${c}`} onClick={() => setStyleBg(c)} style={{ width: '26px', height: '26px', borderRadius: '6px', background: c, border: styleBg === c ? `2px solid ${T.gold}` : `1px solid ${T.border}`, cursor: 'pointer', transition: 'transform 0.15s' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.15)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'} />
                  ))}
                </div>

                {/* Borders */}
                {sectionTitle('Borders')}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '4px' }}>
                  <div><label style={dkLabel}>Width</label><input style={dkInput} value={styleBorderWidth} onChange={e => setStyleBorderWidth(e.target.value)} placeholder="0" onFocus={e => e.target.style.borderColor = T.gold} onBlur={e => e.target.style.borderColor = T.border} /></div>
                  <div><label style={dkLabel}>Style</label>
                    <select value={styleBorderStyle} onChange={e => setStyleBorderStyle(e.target.value)} style={{ ...dkInput, cursor: 'pointer' }}>
                      <option value="solid">Solid</option><option value="dashed">Dashed</option><option value="dotted">Dotted</option>
                    </select>
                  </div>
                </div>
                <div style={{ marginBottom: '4px' }}>
                  <label style={dkLabel}>Border Colour</label>
                  <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                    {brandPalette.slice(0, 6).map(c => (
                      <button key={`bc-${c}`} onClick={() => setStyleBorderColor(c)} style={{ width: '26px', height: '26px', borderRadius: '6px', background: c, border: styleBorderColor === c ? `2px solid ${T.gold}` : `1px solid ${T.border}`, cursor: 'pointer' }} />
                    ))}
                  </div>
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <label style={dkLabel}>Radius</label>
                  <div style={{ display: 'flex', gap: '3px' }}>
                    {['none', 'sm', 'md', 'lg', 'pill'].map(r => (
                      <button key={r} onClick={() => setStyleBorderRadius(r)} style={{ flex: 1, padding: '6px 0', border: `1px solid ${styleBorderRadius === r ? T.gold : T.border}`, borderRadius: '4px', background: styleBorderRadius === r ? `${T.gold}20` : T.input, cursor: 'pointer', fontFamily: FONT, fontWeight: 600, fontSize: '0.65rem', color: styleBorderRadius === r ? T.gold : T.muted, transition: 'all 0.2s' }}>{r}</button>
                    ))}
                  </div>
                </div>

                {/* Effects */}
                {sectionTitle('Effects')}
                <div>
                  <label style={dkLabel}>Opacity</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <input type="range" min="0" max="100" value={styleOpacity} onChange={e => setStyleOpacity(Number(e.target.value))} style={{ flex: 1, accentColor: T.gold, height: '4px' }} />
                    <span style={{ color: T.text, fontSize: '0.8rem', fontFamily: FONT, minWidth: '32px', textAlign: 'right' }}>{styleOpacity}%</span>
                  </div>
                </div>
              </div>
            )}

            {/* PROPERTIES TAB */}
            {rightTab === 'properties' && (
              <div>
                {selectedItem && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', background: `${T.gold}12`, borderRadius: '6px', marginBottom: '12px', border: `1px solid ${T.gold}30` }}>
                    <span style={{ display: 'flex', color: T.gold }}>{catIcons[Object.keys(CATEGORIES).find(c => CATEGORIES[c].includes(selectedItem.type))] || icons.layout}</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: T.gold }}>{COMPONENT_LABELS[selectedItem.type] || selectedItem.type}</span>
                  </div>
                )}
                <div className="puck-fields-wrapper">
                  <Puck.Fields />
                </div>
              </div>
            )}

            {/* COMPONENTS TAB */}
            {rightTab === 'components' && (
              <div>
                <div style={{ marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: T.input, borderRadius: '8px', padding: '8px 12px', border: `1px solid ${T.border}`, transition: 'border-color 0.2s' }} onFocus={e => e.currentTarget.style.borderColor = T.gold} onBlur={e => e.currentTarget.style.borderColor = T.border}>
                    <span style={{ color: T.muted, display: 'flex' }}>{icons.search}</span>
                    <input type="text" placeholder="Search components..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ border: 'none', outline: 'none', background: 'transparent', fontFamily: FONT, fontSize: '0.82rem', flex: 1, color: T.text }} />
                  </div>
                </div>
                {Object.entries(filteredCategories).map(([cat, comps]) => (
                  <div key={cat} style={{ marginBottom: '2px' }}>
                    <button onClick={() => toggleCat(cat)} style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '9px 8px', border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: FONT, fontWeight: 600, fontSize: '0.72rem', color: T.muted, textTransform: 'uppercase', letterSpacing: '0.5px', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = T.text} onMouseLeave={e => e.currentTarget.style.color = T.muted}>
                      <span style={{ display: 'flex', transition: 'transform 0.2s', transform: expandedCats[cat] ? 'rotate(90deg)' : 'rotate(0deg)' }}>{icons.chevRight}</span>
                      <span style={{ display: 'flex', color: T.gold }}>{catIcons[cat]}</span>
                      {cat}
                      <span style={{ marginLeft: 'auto', fontSize: '0.65rem', color: '#555' }}>{comps.length}</span>
                    </button>
                    {expandedCats[cat] && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', padding: '4px 4px 8px 4px' }}>
                        {comps.map(comp => (
                          <div key={comp} data-puck-component={comp} draggable style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', padding: '12px 6px', cursor: 'grab', fontSize: '0.75rem', color: T.muted, borderRadius: '8px', border: `1px solid ${T.border}`, background: T.input, transition: 'all 0.2s', textAlign: 'center' }} onMouseEnter={e => { e.currentTarget.style.borderColor = T.gold; e.currentTarget.style.background = T.hover; e.currentTarget.style.color = T.text }} onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.background = T.input; e.currentTarget.style.color = T.muted }}>
                            <span style={{ display: 'flex', color: 'inherit' }}>{catIcons[cat] || icons.layout}</span>
                            <span style={{ lineHeight: '1.2' }}>{COMPONENT_LABELS[comp] || comp}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── BOTTOM BAR (32px) ── */}
      <div style={{ height: '32px', background: T.bg, display: 'flex', alignItems: 'center', padding: '0 16px', flexShrink: 0, borderTop: `1px solid ${T.border}`, gap: '4px' }}>
        {breadcrumbParts.map((part, i) => (
          <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {i > 0 && <span style={{ color: '#444', fontSize: '0.65rem' }}>&rsaquo;</span>}
            <button onClick={() => { if (part.index === null) dispatch({ type: 'setUi', ui: { itemSelector: null } }); else dispatch({ type: 'setUi', ui: { itemSelector: { index: part.index } } }) }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: i === breadcrumbParts.length - 1 ? T.text : T.muted, fontFamily: FONT, fontSize: '0.72rem', padding: '2px 4px', borderRadius: '3px', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = T.gold} onMouseLeave={e => e.currentTarget.style.color = i === breadcrumbParts.length - 1 ? T.text : T.muted}>{part.label}</button>
          </span>
        ))}
        <span style={{ marginLeft: 'auto', color: '#444', fontSize: '0.65rem', fontFamily: FONT }}>{layers.length} component{layers.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Context menu */}
      {ctxMenu && <CtxMenu x={ctxMenu.x} y={ctxMenu.y} onClose={() => setCtxMenu(null)} onAction={handleCtxAction} />}
    </div>
  )
}

/* ───────────────────────────── ADD PAGE MODAL ───────────────────────────── */

function AddPageModal({ open, onClose, onSubmit }) {
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')

  useEffect(() => {
    setSlug(title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''))
  }, [title])

  if (!open) return null

  const modalInput = { background: T.input, color: T.text, border: `1px solid ${T.border}`, borderRadius: '6px', padding: '10px 12px', fontFamily: FONT, fontSize: '0.9rem', boxSizing: 'border-box', width: '100%', outline: 'none' }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }} onClick={onClose}>
      <div style={{ background: T.panel, borderRadius: '12px', padding: '32px', width: '420px', maxWidth: '90vw', fontFamily: FONT, border: `1px solid ${T.border}`, boxShadow: '0 16px 48px rgba(0,0,0,0.5)' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: T.text }}>Add New Page</h3>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: T.muted, display: 'flex', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = T.text} onMouseLeave={e => e.currentTarget.style.color = T.muted}>{icons.close}</button>
        </div>
        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontWeight: 600, fontSize: '0.8rem', color: T.muted, display: 'block', marginBottom: '6px' }}>Page Title</label>
          <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. About Us" style={modalInput} onFocus={e => e.target.style.borderColor = T.gold} onBlur={e => e.target.style.borderColor = T.border} autoFocus />
        </div>
        <div style={{ marginBottom: '24px' }}>
          <label style={{ fontWeight: 600, fontSize: '0.8rem', color: T.muted, display: 'block', marginBottom: '6px' }}>URL Slug</label>
          <input type="text" value={slug} onChange={e => setSlug(e.target.value)} placeholder="about-us" style={modalInput} onFocus={e => e.target.style.borderColor = T.gold} onBlur={e => e.target.style.borderColor = T.border} />
        </div>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ fontFamily: FONT, fontWeight: 600, padding: '10px 20px', border: `1px solid ${T.border}`, borderRadius: '6px', background: 'transparent', cursor: 'pointer', fontSize: '0.9rem', color: T.muted, transition: 'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.borderColor = T.text; e.currentTarget.style.color = T.text }} onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.muted }}>Cancel</button>
          <button onClick={() => { if (title && slug) onSubmit(title, slug) }} disabled={!title || !slug} style={{ fontFamily: FONT, fontWeight: 700, padding: '10px 20px', border: 'none', borderRadius: '6px', background: (!title || !slug) ? '#333' : T.gold, color: (!title || !slug) ? '#666' : T.bg, cursor: (!title || !slug) ? 'default' : 'pointer', fontSize: '0.9rem', transition: 'opacity 0.2s' }}>Create Page</button>
        </div>
      </div>
    </div>
  )
}

/* ───────────────────────────── MAIN EXPORT ───────────────────────────── */

export default function WebsiteBuilder() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { business } = useBusiness()
  const bid = business?._id || business?.id

  const [puckData, setPuckData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [pages, setPages] = useState([])
  const [showAddPage, setShowAddPage] = useState(false)
  const [previewWidth, setPreviewWidth] = useState(1200)

  const puckConfig = useMemo(() => buildPuckConfig(), [])
  const autoSaveRef = useRef(null)
  const latestDataRef = useRef(null)

  const fetchPages = useCallback(async () => {
    if (!bid) return
    try {
      const res = await api.get(`/website/business/${bid}/pages`)
      setPages(res || [])
    } catch { /* ignore */ }
  }, [bid])

  const fetchPage = useCallback(async () => {
    if (!bid || !slug) return
    setLoading(true)
    setError(null)
    try {
      const res = await api.get(`/website/business/${bid}/pages/${slug}`)
      setPuckData(res?.puck_data || { content: [], root: {} })
    } catch (err) {
      setError(err?.message || 'Page not found')
    } finally {
      setLoading(false)
    }
  }, [bid, slug])

  useEffect(() => { fetchPages() }, [fetchPages])
  useEffect(() => { fetchPage() }, [fetchPage])

  // Auto-save every 30s
  useEffect(() => {
    autoSaveRef.current = setInterval(() => {
      if (latestDataRef.current && bid && slug) {
        setSaving(true)
        api.put(`/website/business/${bid}/pages/${slug}`, { puck_data: latestDataRef.current })
          .catch(() => {})
          .finally(() => setSaving(false))
      }
    }, 30000)
    return () => clearInterval(autoSaveRef.current)
  }, [bid, slug])

  const handleSaveDraft = useCallback(async () => {
    if (!latestDataRef.current || !bid || !slug) return
    setSaving(true)
    try {
      await api.put(`/website/business/${bid}/pages/${slug}`, { puck_data: latestDataRef.current })
    } catch { /* ignore */ } finally {
      setSaving(false)
    }
  }, [bid, slug])

  const handlePublish = useCallback(async (data) => {
    if (!bid || !slug) return
    if (data) latestDataRef.current = data
    setSaving(true)
    try {
      await api.put(`/website/business/${bid}/pages/${slug}`, { puck_data: latestDataRef.current })
      await api.post(`/website/business/${bid}/pages/${slug}/publish`)
    } catch { /* ignore */ } finally {
      setSaving(false)
    }
  }, [bid, slug])

  const handleChangePage = useCallback((newSlug) => {
    navigate(`/dashboard/website/edit/${newSlug}`)
  }, [navigate])

  const handleAddPage = useCallback(async (title, newSlug) => {
    if (!bid) return
    try {
      await api.post(`/website/business/${bid}/pages`, { title, slug: newSlug, puck_data: { content: [], root: {} } })
      setShowAddPage(false)
      await fetchPages()
      navigate(`/dashboard/website/edit/${newSlug}`)
    } catch { /* ignore */ }
  }, [bid, fetchPages, navigate])

  const handleDuplicatePage = useCallback(async (pageSlug) => {
    if (!bid) return
    try {
      await api.post(`/website/business/${bid}/pages/${pageSlug}/duplicate`)
      await fetchPages()
    } catch { /* ignore */ }
  }, [bid, fetchPages])

  const handleDeletePage = useCallback(async (pageSlug) => {
    if (!bid || pageSlug === slug) return
    try {
      await api.delete(`/website/business/${bid}/pages/${pageSlug}`)
      await fetchPages()
    } catch { /* ignore */ }
  }, [bid, slug, fetchPages])

  // Loading state
  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: FONT, background: T.canvas }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '40px', height: '40px', border: `3px solid ${T.border}`, borderTopColor: T.gold, borderRadius: '50%', animation: 'wbSpin 0.8s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ color: T.muted, fontSize: '0.9rem' }}>Loading editor...</p>
          <style>{`@keyframes wbSpin { to { transform: rotate(360deg) } }`}</style>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: FONT, background: T.canvas }}>
        <div style={{ textAlign: 'center', maxWidth: '400px' }}>
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke={T.muted} strokeWidth="2"><circle cx="24" cy="24" r="20" /><path d="M24 16v8M24 30v1" strokeLinecap="round" /></svg>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: T.text, margin: '16px 0 8px' }}>Page Not Found</h2>
          <p style={{ color: T.muted, fontSize: '0.9rem', margin: '0 0 24px' }}>{error}</p>
          <a href="/dashboard/website" style={{ fontFamily: FONT, fontWeight: 600, color: T.gold, textDecoration: 'none' }}>Back to Website</a>
        </div>
      </div>
    )
  }

  return (
    <>
      <style>{`
        /* Hide default Puck chrome — we render our own shell */
        .puck-fields-wrapper .Puck-header,
        .puck-fields-wrapper [class*="PuckHeader"],
        [class*="Puck-root"] > header,
        [class*="Puck-root"] > [class*="header"] {
          display: none !important;
        }
        .Puck [class*="leftSideBar"],
        .Puck [class*="rightSideBar"],
        .Puck > header,
        .Puck [class*="Header"],
        .Puck-header {
          display: none !important;
        }
        /* Dark theme Puck field overrides */
        .puck-fields-wrapper input,
        .puck-fields-wrapper textarea,
        .puck-fields-wrapper select {
          background: ${T.input} !important;
          color: ${T.text} !important;
          border: 1px solid ${T.border} !important;
          border-radius: 6px !important;
          font-family: ${FONT} !important;
          padding: 8px 12px !important;
        }
        .puck-fields-wrapper input:focus,
        .puck-fields-wrapper textarea:focus,
        .puck-fields-wrapper select:focus {
          border-color: ${T.gold} !important;
          outline: none !important;
        }
        .puck-fields-wrapper label {
          color: ${T.muted} !important;
          font-family: ${FONT} !important;
          font-weight: 600 !important;
          font-size: 0.75rem !important;
          text-transform: uppercase !important;
          letter-spacing: 0.5px !important;
        }
        .puck-fields-wrapper [class*="Field"] {
          margin-bottom: 12px !important;
        }
        /* Scrollbar styling */
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: ${T.panel}; }
        ::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: #555; }
      `}</style>
      <Puck
        config={puckConfig}
        data={puckData}
        onPublish={handlePublish}
        onChange={(data) => { latestDataRef.current = data }}
        overrides={{
          header: () => null,
          headerActions: () => null,
        }}
      >
        <EditorInner
          pages={pages}
          currentSlug={slug}
          onChangePage={handleChangePage}
          onAddPage={() => setShowAddPage(true)}
          onRenamePage={() => {}}
          onDeletePage={handleDeletePage}
          onDuplicatePage={handleDuplicatePage}
          onSaveDraft={handleSaveDraft}
          onPublish={() => handlePublish(latestDataRef.current)}
          saving={saving}
          previewWidth={previewWidth}
          setPreviewWidth={setPreviewWidth}
        />
      </Puck>
      <AddPageModal open={showAddPage} onClose={() => setShowAddPage(false)} onSubmit={handleAddPage} />
    </>
  )
}
