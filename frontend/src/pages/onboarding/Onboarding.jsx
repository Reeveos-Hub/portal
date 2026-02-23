import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import api from '../../utils/api'
import Card from '../../components/shared/Card'
import Button from '../../components/shared/Button'
import Input from '../../components/shared/Input'

const Onboarding = () => {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    name: '',
    category: 'restaurant',
    tier: 'solo',
    address: '',
    phone: '',
    lat: 51.5074,
    lng: -0.1278,
    location_id: ''
  })
  const [loading, setLoading] = useState(false)

  const { user } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      await api.post('/businesses', formData)
      navigate('/dashboard')
    } catch (error) {
      console.error('Failed to create business:', error)
      alert('Failed to create business')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-heading font-bold mb-2">Welcome to Rezvo</h1>
          <p className="text-text-secondary">Let's set up your business</p>
        </div>

        <Card className="p-8">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={`flex-1 h-2 rounded-full mx-1 ${
                    s <= step ? 'bg-forest' : 'bg-border'
                  }`}
                />
              ))}
            </div>
            <p className="text-sm text-text-secondary text-center">
              Step {step} of 3
            </p>
          </div>

          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-heading font-semibold">
                What type of business?
              </h2>

              <div className="grid grid-cols-2 gap-4">
                {[
                  { value: 'restaurant', label: 'Restaurant', icon: '🍽️' },
                  { value: 'barber', label: 'Barber', icon: '💈' },
                  { value: 'salon', label: 'Salon', icon: '💅' },
                  { value: 'spa', label: 'Spa', icon: '🧖' }
                ].map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, category: cat.value })}
                    className={`p-6 rounded-lg border-2 transition-colors ${
                      formData.category === cat.value
                        ? 'border-forest bg-forest-30/20'
                        : 'border-border hover:border-sage'
                    }`}
                  >
                    <div className="text-4xl mb-2">{cat.icon}</div>
                    <p className="font-medium">{cat.label}</p>
                  </button>
                ))}
              </div>

              <Button variant="primary" onClick={() => setStep(2)} className="w-full">
                Next
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-heading font-semibold">
                Tell us about your business
              </h2>

              <Input
                label="Business Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />

              <Input
                label="Address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                required
              />

              <Input
                label="Phone Number"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                required
              />

              <div className="flex space-x-4">
                <Button variant="secondary" onClick={() => setStep(1)} className="flex-1">
                  Back
                </Button>
                <Button variant="primary" onClick={() => setStep(3)} className="flex-1">
                  Next
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-heading font-semibold">
                Choose your tier
              </h2>

              <div className="space-y-4">
                {[
                  { value: 'solo', label: 'Solo', desc: 'Independent professional' },
                  { value: 'team', label: 'Team', desc: 'Multiple staff members' },
                  { value: 'venue', label: 'Venue', desc: 'Restaurant or large establishment' }
                ].map((tier) => (
                  <button
                    key={tier.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, tier: tier.value })}
                    className={`w-full p-4 rounded-lg border-2 text-left transition-colors ${
                      formData.tier === tier.value
                        ? 'border-forest bg-forest-30/20'
                        : 'border-border hover:border-sage'
                    }`}
                  >
                    <p className="font-semibold">{tier.label}</p>
                    <p className="text-sm text-text-secondary">{tier.desc}</p>
                  </button>
                ))}
              </div>

              <div className="flex space-x-4">
                <Button variant="secondary" onClick={() => setStep(2)} className="flex-1">
                  Back
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSubmit}
                  loading={loading}
                  className="flex-1"
                >
                  Complete Setup
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

export default Onboarding
