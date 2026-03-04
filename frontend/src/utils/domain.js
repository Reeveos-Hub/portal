/**
 * Domain config for Rezvo.app portal.
 * 
 * portaladmin.rezvo.app = admin domain (Dojo-style, no /admin prefix)
 * portal.rezvo.app      = business portal (/admin prefix for admin pages)
 * book.rezvo.app        = booking subdomain (clean booking URLs)
 */

export const isRezvoApp = () => true
export const isRezvoCoUk = () => false

/** Are we running on the dedicated booking subdomain? */
export const isBookingDomain = () =>
  typeof window !== 'undefined' && window.location.hostname === 'book.rezvo.app'

/** Are we running on the dedicated admin subdomain? */
export const isAdminDomain = () => {
  if (typeof window === 'undefined') return false
  const host = window.location.hostname
  return host === 'portaladmin.rezvo.app' || host === 'admin.rezvo.app'
}

/** Admin route prefix: empty on admin domain, '/admin' on portal domain */
export const ADMIN_BASE = isAdminDomain() ? '' : '/admin'

/**
 * Build an admin path.
 * On admin domain:  adminPath('/crm') → '/crm'
 * On portal domain: adminPath('/crm') → '/admin/crm'
 */
export const adminPath = (path) => {
  if (!path || path === '/') return ADMIN_BASE || '/'
  const clean = path.startsWith('/') ? path : `/${path}`
  return `${ADMIN_BASE}${clean}`
}

export const getDomainConfig = () => ({
  domain: 'rezvo.app',
  baseUrl: 'https://portal.rezvo.app',
  bookingBaseUrl: 'https://book.rezvo.app',
  adminBaseUrl: 'https://portaladmin.rezvo.app',
  supportEmail: 'support@rezvo.app',
  bookingPathPrefix: isBookingDomain() ? '/' : '/book/',
})

/** Build the public booking URL for a business slug */
export const getBookingUrl = (slug) => `https://book.rezvo.app/${slug}`
