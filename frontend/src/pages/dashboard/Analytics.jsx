import { useState, useEffect } from 'react'
import { useBusiness } from '../../contexts/BusinessContext'
import api from '../../utils/api'
import Card from '../../components/shared/Card'

const Analytics = () => {
  const { business, businessType } = useBusiness()
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (business?.id ?? business?._id) {
      fetchAnalytics()
    } else {
      setLoading(false)
    }
  }, [business])

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      const response = await api.get(`/analytics/business/${(business?.id ?? business?._id)}/overview`)
      setAnalytics(response)
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-forest mx-auto"></div>
        <p className="mt-4 text-text-secondary">Loading analytics...</p>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold mb-2">Analytics</h1>
        <p className="text-text-secondary">
          Last 30 days
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <p className="text-text-secondary text-sm mb-2">Total Bookings</p>
          <p className="text-3xl font-heading font-bold text-forest">
            {analytics?.bookings?.total || 0}
          </p>
        </Card>

        <Card>
          <p className="text-text-secondary text-sm mb-2">Confirmed</p>
          <p className="text-3xl font-heading font-bold text-forest-50">
            {analytics?.bookings?.confirmed || 0}
          </p>
        </Card>

        <Card>
          <p className="text-text-secondary text-sm mb-2">Cancellation Rate</p>
          <p className="text-3xl font-heading font-bold text-red">
            {analytics?.bookings?.cancellation_rate || 0}%
          </p>
        </Card>

        <Card>
          <p className="text-text-secondary text-sm mb-2">No-Show Rate</p>
          <p className="text-3xl font-heading font-bold text-red">
            {analytics?.bookings?.no_show_rate || 0}%
          </p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h2 className="text-xl font-heading font-semibold mb-4">
            Booking Trends
          </h2>
          <div className="h-64 flex items-center justify-center bg-off rounded-lg">
            <p className="text-text-secondary">Chart coming soon</p>
          </div>
        </Card>

        <Card>
          <h2 className="text-xl font-heading font-semibold mb-4">
            Popular Times
          </h2>
          <div className="h-64 flex items-center justify-center bg-off rounded-lg">
            <p className="text-text-secondary">Chart coming soon</p>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default Analytics
