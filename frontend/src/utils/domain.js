/**
 * Domain config for Rezvo.app portal.
 * Booking URLs point to portal.rezvo.app/book/.
 */

export const isRezvoApp = () => true
export const isRezvoCoUk = () => false

export const getDomainConfig = () => ({
  domain: 'rezvo.app',
  baseUrl: 'https://portal.rezvo.app',
  supportEmail: 'support@rezvo.app',
  bookingPathPrefix: '/book/',
})
