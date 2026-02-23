import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { isRezvoApp } from '../../utils/domain'
import Input from '../../components/shared/Input'
import Button from '../../components/shared/Button'

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'diner'
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  
  const { register } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)

    const result = await register({
      name: formData.name,
      email: formData.email,
      password: formData.password,
      role: formData.role
    })
    
    if (result.success) {
      if (formData.role === 'owner') {
        navigate('/onboarding')
      } else {
        if (isRezvoApp()) window.location.href = '/' // Marketing site, not directory
        else navigate('/')
      }
    } else {
      setError(result.error)
    }
    
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Link to="/">
            <h1 className="text-4xl font-heading font-bold text-forest">Rezvo</h1>
          </Link>
          <p className="mt-2 text-text-secondary">Create your account</p>
        </div>

        <div className="bg-white rounded-card shadow-card p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red/10 border border-red rounded-lg p-4">
                <p className="text-sm text-red">{error}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-text mb-2">
                I am a
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'diner' })}
                  className={`p-4 rounded-lg border-2 transition-colors ${
                    formData.role === 'diner'
                      ? 'border-forest bg-forest-30/20'
                      : 'border-border hover:border-sage'
                  }`}
                >
                  <p className="font-medium text-text">Diner</p>
                  <p className="text-sm text-text-secondary">Book services</p>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'owner' })}
                  className={`p-4 rounded-lg border-2 transition-colors ${
                    formData.role === 'owner'
                      ? 'border-forest bg-forest-30/20'
                      : 'border-border hover:border-sage'
                  }`}
                >
                  <p className="font-medium text-text">Business Owner</p>
                  <p className="text-sm text-text-secondary">Manage business</p>
                </button>
              </div>
            </div>

            <Input
              label="Full Name"
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="John Smith"
            />

            <Input
              label="Email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="your@email.com"
            />

            <Input
              label="Password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="••••••••"
            />

            <Input
              label="Confirm Password"
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              placeholder="••••••••"
            />

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              loading={loading}
            >
              Create account
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-text-secondary">
              Already have an account?{' '}
              <Link to="/login" className="text-forest hover:text-forest-90 font-medium">
                Log in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Register
