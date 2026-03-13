/**
 * Renders consultation form directly on booking domain.
 * No redirect. Form stays right here.
 */
import { useParams, useSearchParams } from 'react-router-dom'
import ClientPortal from '../ClientPortal'

const BookingFormRedirect = () => {
  return <ClientPortal />
}

export default BookingFormRedirect
