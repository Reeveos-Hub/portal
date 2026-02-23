/**
 * Run 1: Booking Link page (from UXPilot page 6)
 * Run 2: Wired to /book/:slug
 */

import { useBusiness } from '../../contexts/BusinessContext'
import { getDomainConfig } from '../../utils/domain'
import Card from '../../components/shared/Card'

const BookingLink = () => {
  const { business, businessType, tier } = useBusiness()
  const slug = business?.slug || 'your-business'
  const { baseUrl } = getDomainConfig()
  const bookingUrl = `${baseUrl}/book/${slug}`

  const handleCopy = () => {
    navigator.clipboard.writeText(bookingUrl)
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold mb-2">Booking Link</h1>
        <p className="text-muted">
          Share your booking page with customers
        </p>
      </div>

      <Card>
        <h2 className="text-xl font-heading font-semibold mb-4">Your booking URL</h2>
        <div className="flex items-center gap-4 p-4 bg-background rounded-lg">
          <code className="flex-1 text-sm text-primary break-all">
            {bookingUrl}
          </code>
          <button onClick={handleCopy} className="btn-primary shrink-0">Copy link</button>
        </div>
        <p className="mt-4 text-sm text-muted">
          Share this link on social media, your website, or in emails to let customers book directly.
        </p>
      </Card>
    </div>
  )
}

export default BookingLink
