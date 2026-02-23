/**
 * Domain config for Rezvo.app portal.
 * Booking URLs point to rezvo.co.uk (consumer directory).
 */

export const isRezvoApp = () => true
export const isRezvoCoUk = () => false

export const getDomainConfig = () => ({
  domain: 'rezvo.app',
  baseUrl: 'https://rezvo.co.uk',
  supportEmail: 'support@rezvo.app',
  bookingPathPrefix: '/book/',
})
