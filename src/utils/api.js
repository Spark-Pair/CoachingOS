const API_URL = import.meta.env.VITE_API_URL || '/api'

async function apiRequest(path, options = {}) {
  const { token, headers, ...requestOptions } = options

  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    ...requestOptions,
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.message || 'Request failed')
  }

  return data
}

export { API_URL, apiRequest }
