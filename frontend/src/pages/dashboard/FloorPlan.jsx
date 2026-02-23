/**
 * Floor Plan — Table management for restaurants (Scale+ tier)
 */

import { useBusiness } from '../../contexts/BusinessContext'

const FloorPlan = () => {
  const { businessType } = useBusiness()
  const isFood = businessType === 'food' || businessType === 'restaurant'

  return (
    <div className="space-y-6">
      {/* Coming Soon Banner */}
      <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="bg-primary p-8 text-center relative">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-bl-full -mr-12 -mt-12" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-tr-full -ml-8 -mb-8" />
          <div className="relative z-10">
            <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fa-solid fa-map text-white text-2xl" />
            </div>
            <h2 className="font-heading font-bold text-2xl text-white mb-2">Interactive Floor Plan</h2>
            <p className="text-white/70 text-sm max-w-md mx-auto">
              {isFood
                ? 'Drag-and-drop table management with real-time status updates. See which tables are occupied, reserved, or available at a glance.'
                : 'Visual room and station management. See availability across your space in real-time.'}
            </p>
          </div>
        </div>
        <div className="p-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
            {[
              { icon: 'fa-arrows-up-down-left-right', title: 'Drag & Drop', desc: 'Arrange tables and zones with an intuitive drag-and-drop editor' },
              { icon: 'fa-circle-half-stroke', title: 'Real-Time Status', desc: 'See occupied, reserved, and available tables at a glance' },
              { icon: 'fa-object-group', title: 'Table Merging', desc: 'Merge tables for larger parties and split them back instantly' },
            ].map((f, i) => (
              <div key={i} className="text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-3 text-primary">
                  <i className={`fa-solid ${f.icon} text-xl`} />
                </div>
                <h4 className="font-bold text-sm text-primary mb-1">{f.title}</h4>
                <p className="text-xs text-gray-500">{f.desc}</p>
              </div>
            ))}
          </div>
          {/* Placeholder Grid */}
          <div className="bg-gray-50 rounded-xl border-2 border-dashed border-border p-8 relative">
            <div className="grid grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className={`aspect-square rounded-lg border-2 border-dashed flex items-center justify-center ${i < 3 ? 'border-green-300 bg-green-50' : i < 5 ? 'border-primary/30 bg-primary/5' : 'border-gray-300 bg-white'}`}>
                  <div className="text-center">
                    <i className={`fa-solid ${isFood ? 'fa-chair' : 'fa-couch'} text-lg ${i < 3 ? 'text-green-400' : i < 5 ? 'text-primary/40' : 'text-gray-300'}`} />
                    <p className={`text-[10px] font-bold mt-1 ${i < 3 ? 'text-green-600' : i < 5 ? 'text-primary/60' : 'text-gray-400'}`}>
                      {i < 3 ? 'Available' : i < 5 ? 'Reserved' : 'Empty'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center rounded-xl">
              <div className="text-center">
                <p className="text-sm font-bold text-primary mb-3">Available on Scale plan</p>
                <button className="bg-primary text-white font-bold text-sm px-6 py-2.5 rounded-lg shadow-lg hover:bg-primary-hover transition-colors">
                  Upgrade to Unlock
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FloorPlan
