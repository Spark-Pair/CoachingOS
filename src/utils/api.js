const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api'
const BASE_URL = API_URL.replace(/\/api\/?$/, '')

async function apiRequest(path, options = {}) {
  const { token, headers, ...requestOptions } = options
  const isFormData = typeof FormData !== 'undefined' && requestOptions.body instanceof FormData

  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      ...(!isFormData ? { 'Content-Type': 'application/json' } : {}),
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

function resolveUploadUrl(uploadPath) {
  if (!uploadPath) return ''
  if (/^https?:\/\//i.test(uploadPath)) return uploadPath
  return `${BASE_URL}${uploadPath.startsWith('/') ? '' : '/'}${uploadPath}`
}

export { API_URL, BASE_URL, apiRequest, resolveUploadUrl }
