import { useState, useEffect } from 'react'
import { useBusiness } from '../../contexts/BusinessContext'
import api from '../../utils/api'
import Card from '../../components/shared/Card'

const Reviews = () => {
  const { business, businessType } = useBusiness()
  const [reviews, setReviews] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (business?.id ?? business?._id) {
      fetchReviews()
      fetchStats()
    } else {
      setLoading(false)
    }
  }, [business])

  const fetchReviews = async () => {
    setLoading(true)
    try {
      const response = await api.get(`/reviews/business/${(business?.id ?? business?._id)}`)
      setReviews(response.results || [])
    } catch (error) {
      console.error('Failed to fetch reviews:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await api.get(`/reputation/business/${(business?.id ?? business?._id)}/review-stats`)
      setStats(response)
    } catch (error) {
      console.error('Failed to fetch review stats:', error)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-forest mx-auto"></div>
        <p className="mt-4 text-text-secondary">Loading reviews...</p>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold mb-2">Reviews</h1>
        <p className="text-text-secondary">
          {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
        </p>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <p className="text-text-secondary text-sm mb-2">Average Rating</p>
            <div className="flex items-center">
              <span className="text-gold text-3xl mr-2">★</span>
              <p className="text-3xl font-heading font-bold">
                {stats.average_rating || 'N/A'}
              </p>
            </div>
          </Card>

          <Card>
            <p className="text-text-secondary text-sm mb-2">Total Reviews</p>
            <p className="text-3xl font-heading font-bold text-forest">
              {stats.total_reviews}
            </p>
          </Card>

          <Card>
            <p className="text-text-secondary text-sm mb-2">Rating Distribution</p>
            <div className="space-y-1">
              {[5, 4, 3, 2, 1].map((rating) => (
                <div key={rating} className="flex items-center space-x-2">
                  <span className="text-sm w-4">{rating}</span>
                  <div className="flex-1 h-2 bg-off rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gold"
                      style={{
                        width: `${(stats.rating_distribution?.[rating] / stats.total_reviews * 100) || 0}%`
                      }}
                    ></div>
                  </div>
                  <span className="text-sm text-text-secondary w-8">
                    {stats.rating_distribution?.[rating] || 0}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {reviews.length === 0 ? (
        <Card>
          <p className="text-center text-text-secondary py-8">
            No reviews yet
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <Card key={review._id}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="font-semibold">{review.user_name || 'Anonymous'}</h3>
                    <div className="flex items-center">
                      <span className="text-gold">
                        {'★'.repeat(review.rating)}
                      </span>
                      <span className="text-text-placeholder">
                        {'★'.repeat(5 - review.rating)}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-text-secondary">
                    {new Date(review.created_at).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              </div>

              {review.body && (
                <p className="text-text-secondary">{review.body}</p>
              )}

              {review.helpful_count > 0 && (
                <p className="text-sm text-text-tertiary mt-3">
                  {review.helpful_count} {review.helpful_count === 1 ? 'person found' : 'people found'} this helpful
                </p>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default Reviews
