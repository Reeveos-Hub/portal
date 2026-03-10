/**
 * BusinessTypeSelector — /signup and /get-started
 * User chooses: Hospitality or Local Services
 * Then redirected to Register with type pre-selected
 */
import { useNavigate } from 'react-router-dom'
import { UtensilsCrossed, Scissors, ArrowLeft } from 'lucide-react'

const BusinessTypeSelector = () => {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-[#FEFBF4] flex flex-col" style={{ fontFamily: "'Figtree', sans-serif" }}>
      {/* Top bar */}
      <div className="p-6 flex items-center justify-between">
        <a href="https://reeveos.app" className="flex items-center gap-3 no-underline">
          <div className="w-10 h-10 bg-[#111] rounded-xl flex items-center justify-center shadow-md">
            <span className="text-white font-bold text-lg">R.</span>
          </div>
          <span className="font-extrabold text-xl tracking-tight text-[#111]">ReeveOS</span>
        </a>
        <a href="https://reeveos.app" className="text-sm text-gray-500 hover:text-[#111] flex items-center gap-2 transition-colors no-underline">
          <ArrowLeft className="w-4 h-4" /> Back to website
        </a>
      </div>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center px-6 pb-12">
        <div className="w-full max-w-2xl text-center space-y-10">
          <div className="space-y-3">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#111]">
              What type of business are you?
            </h1>
            <p className="text-gray-500 text-lg">
              Choose your industry to get started with ReeveOS
            </p>
          </div>

          {/* Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Hospitality */}
            <button
              onClick={() => navigate('/register?type=hospitality')}
              className="group bg-white rounded-2xl border-2 border-gray-100 hover:border-[#111] p-8 flex flex-col items-start gap-5 transition-all duration-300 shadow-sm hover:shadow-[0_10px_30px_-5px_rgba(17,17,17,0.15)] text-left"
            >
              <div className="w-14 h-14 rounded-2xl bg-[#111]/10 text-[#111] flex items-center justify-center group-hover:bg-[#111] group-hover:text-white transition-all duration-300">
                <UtensilsCrossed className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-[#111] mb-2">Hospitality</h3>
                <p className="text-sm text-gray-500 leading-relaxed mb-4">
                  Table bookings, floor plans, reservations & delivery
                </p>
                <div className="flex flex-wrap gap-2">
                  {['Restaurants', 'Bars & Pubs', 'Bistros', 'Fine Dining', 'Brasseries'].map(t => (
                    <span key={t} style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: '#F5F5F5', color: '#666' }}>{t}</span>
                  ))}
                </div>
              </div>
              <div className="mt-auto px-5 py-2.5 rounded-xl bg-[#111] text-white text-sm font-bold group-hover:bg-[#C9A84C] group-hover:text-[#111] transition-all">
                Get Started →
              </div>
            </button>

            {/* Local Services */}
            <button
              onClick={() => navigate('/register?type=services')}
              className="group bg-white rounded-2xl border-2 border-gray-100 hover:border-[#111] p-8 flex flex-col items-start gap-5 transition-all duration-300 shadow-sm hover:shadow-[0_10px_30px_-5px_rgba(17,17,17,0.15)] text-left"
            >
              <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:bg-[#111] group-hover:text-white transition-all duration-300">
                <Scissors className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-[#111] mb-2">Local Services</h3>
                <p className="text-sm text-gray-500 leading-relaxed mb-4">
                  Appointment bookings, client management & CRM
                </p>
                <div className="flex flex-wrap gap-2">
                  {['Salons', 'Barbers', 'Spas', 'Clinics', 'Tattoo', 'Physio', 'PT', 'Cafés', 'Takeaways', 'Nails'].map(t => (
                    <span key={t} style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: '#F5F0FF', color: '#7C3AED' }}>{t}</span>
                  ))}
                </div>
              </div>
              <div className="mt-auto px-5 py-2.5 rounded-xl bg-[#111] text-white text-sm font-bold group-hover:bg-[#C9A84C] group-hover:text-[#111] transition-all">
                Get Started →
              </div>
            </button>
          </div>

          <p className="text-sm text-gray-500">
            Already have an account?{' '}
            <button onClick={() => navigate('/login')} className="font-bold text-[#111] hover:underline bg-transparent border-none cursor-pointer" style={{ fontFamily: "'Figtree', sans-serif" }}>
              Sign in directly
            </button>
          </p>
        </div>
      </div>

      <div className="p-6 text-center text-xs text-gray-400">
        © {new Date().getFullYear()} ReeveOS · Save the High Street
      </div>
    </div>
  )
}

export default BusinessTypeSelector
