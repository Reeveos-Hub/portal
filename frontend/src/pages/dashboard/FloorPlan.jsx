import { useState, useEffect } from 'react'
import { useBusiness } from '../../contexts/BusinessContext'
import api from '../../utils/api'
import Card from '../../components/shared/Card'
import Button from '../../components/shared/Button'

const FloorPlan = () => {
  const { business, businessType, tier } = useBusiness()
  const [floorPlan, setFloorPlan] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if ((business?.id ?? business?._id) && hasFeature('floor_plan')) {
      fetchFloorPlan()
    } else {
      setLoading(false)
    }
  }, [business])

  const fetchFloorPlan = async () => {
    setLoading(true)
    try {
      const response = await api.get(`/tables/business/${(business?.id ?? business?._id)}/floor-plan`)
      setFloorPlan(response)
    } catch (error) {
      console.error('Failed to fetch floor plan:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!hasFeature('floor_plan')) {
    return (
      <div>
        <h1 className="text-3xl font-heading font-bold mb-8">Floor Plan</h1>
        <Card>
          <div className="text-center py-12">
            <p className="text-lg text-text-secondary mb-4">
              Floor plan management is only available for venue tier businesses
            </p>
            <Button variant="primary">
              Upgrade to Venue Tier
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-forest mx-auto"></div>
        <p className="mt-4 text-text-secondary">Loading floor plan...</p>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold mb-2">Floor Plan</h1>
          <p className="text-text-secondary">
            Drag and drop to arrange tables
          </p>
        </div>

        <Button variant="primary">
          Add Table
        </Button>
      </div>

      <Card>
        <div className="aspect-video bg-off rounded-lg flex items-center justify-center">
          <p className="text-text-secondary">
            Floor plan editor - Drag and drop tables here
          </p>
        </div>

        {floorPlan?.tables && floorPlan.tables.length > 0 && (
          <div className="mt-6">
            <h3 className="font-semibold mb-4">Tables ({floorPlan.tables.length})</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {floorPlan.tables.map((table) => (
                <div key={table.id} className="bg-off p-4 rounded-lg">
                  <p className="font-medium">{table.name}</p>
                  <p className="text-sm text-text-secondary">
                    Capacity: {table.capacity}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}

export default FloorPlan
