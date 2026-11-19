export const getErrorMessage = (err: any, fallbackMessage = 'An unexpected error occurred.'): string => {
  if (!err) return fallbackMessage

  // If HTTP 405, it means Vercel or static server was hit instead of the FastAPI backend
  if (err.response?.status === 405) {
    return 'Backend API not connected! The frontend cannot reach the FastAPI backend on this domain. Please ensure VITE_API_URL is configured in Vercel to point to your live Render backend URL.'
  }

  // Network / Connection Error
  if (err.code === 'ERR_NETWORK' || (!err.response && err.message === 'Network Error')) {
    return 'Cannot connect to backend server. Please verify the backend service is running and CORS is enabled.'
  }

  // Backend returned JSON detail
  const detail = err.response?.data?.detail
  if (typeof detail === 'string') {
    return detail
  }

  // FastAPI validation error array: [{ loc: [...], msg: "..." }]
  if (Array.isArray(detail) && detail.length > 0) {
    const first = detail[0]
    if (typeof first === 'string') return first
    if (first && typeof first.msg === 'string') {
      const field = Array.isArray(first.loc) ? first.loc[first.loc.length - 1] : ''
      return field ? `${field}: ${first.msg}` : first.msg
    }
    return JSON.stringify(first)
  }

  if (err.response?.data?.message) {
    return err.response.data.message
  }

  return err.message || fallbackMessage
}
