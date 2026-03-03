const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

/**
 * Get the current user's active business ID.
 * Used by the tenant safety check below.
 */
function getCurrentBusinessId() {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    return user?.business_ids?.[0] || null
  } catch { return null }
}

/**
 * TENANT SAFETY CHECK
 * If the server accidentally returns data for a different business,
 * this catches it before it reaches the UI. Defense-in-depth.
 */
function checkTenantMismatch(data, endpoint) {
  if (!data || typeof data !== 'object') return
  const myBid = getCurrentBusinessId()
  if (!myBid) return

  // Check if response contains a businessId that doesn't match ours
  const responseBid = data.businessId || data.business_id
  if (responseBid && String(responseBid) !== String(myBid)) {
    console.error(
      `[TENANT MISMATCH] Expected business ${myBid}, got ${responseBid} from ${endpoint}`
    )
    // Throw — this will trigger the error boundary
    throw new Error('Data integrity error. Please refresh and try again.')
  }

  // Check arrays of items too
  if (Array.isArray(data)) {
    for (const item of data) {
      const itemBid = item?.businessId || item?.business_id
      if (itemBid && String(itemBid) !== String(myBid)) {
        console.error(
          `[TENANT MISMATCH] Array item has business ${itemBid}, expected ${myBid} from ${endpoint}`
        )
        throw new Error('Data integrity error. Please refresh and try again.')
      }
    }
  }
}

async function tryRefreshToken() {
  const refreshToken = localStorage.getItem('refresh_token')
  if (!refreshToken) return false
  try {
    const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken })
    })
    if (res.ok) {
      const data = await res.json()
      localStorage.setItem('token', data.access_token)
      return true
    }
  } catch (e) { /* refresh failed */ }
  return false
}

const api = {
  async request(endpoint, options = {}) {
    const token = localStorage.getItem('token')
    
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    }

    if (token) {
      headers.Authorization = `Bearer ${token}`
    }

    let response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers
    })

    // If 401, try refreshing the token once
    if (response.status === 401 && token) {
      const refreshed = await tryRefreshToken()
      if (refreshed) {
        headers.Authorization = `Bearer ${localStorage.getItem('token')}`
        response = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers })
      }
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Request failed' }))
      const msg = error.detail || 'Request failed'
      throw new Error(`${response.status}: ${msg}`)
    }

    const data = await response.json()
    
    // TENANT SAFETY: verify response data belongs to current user's business
    if (endpoint.includes('/business/')) {
      try { checkTenantMismatch(data, endpoint) } catch (e) { throw e }
    }
    
    return data
  },

  get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' })
  },

  post(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data)
    })
  },

  patch(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(data)
    })
  },

  put(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data)
    })
  },

  delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' })
  },

  async upload(endpoint, file) {
    const token = localStorage.getItem('token')
    const formData = new FormData()
    formData.append('file', file)
    const headers = token ? { Authorization: `Bearer ${token}` } : {}
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: formData
    })
    if (!response.ok) {
      const err = await response.json().catch(() => ({ detail: 'Upload failed' }))
      throw new Error(err.detail || 'Upload failed')
    }
    return response.json()
  }
}

export default api
export { API_BASE_URL }
