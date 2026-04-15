const API_URL_KEY = 'to-business-api-base-url'
const TOKEN_KEY = 'to-business-api-token'

function isLocalHost(hostname: string) {
  return hostname === 'localhost' || hostname === '127.0.0.1'
}

function getDefaultApiBaseUrl() {
  const sameOriginApiBaseUrl = `${window.location.origin}/api/v1`
  const isLocalSession = isLocalHost(window.location.hostname)
  const isLikelyVitePort = ['5173', '5174', '5175', '4173'].includes(window.location.port)

  if (isLocalSession && isLikelyVitePort) {
    return 'http://localhost:4001/api/v1'
  }

  return sameOriginApiBaseUrl
}

export function getApiBaseUrl() {
  const storedValue = window.localStorage.getItem(API_URL_KEY)?.trim()
  if (!storedValue) return getDefaultApiBaseUrl()

  const isStoredLocalApi = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\/api\/v1$/i.test(storedValue)
  if (!isLocalHost(window.location.hostname) && isStoredLocalApi) {
    return `${window.location.origin}/api/v1`
  }

  return storedValue
}

export function setApiBaseUrl(value: string) {
  window.localStorage.setItem(API_URL_KEY, value)
}

export function getAuthToken() {
  return window.localStorage.getItem(TOKEN_KEY) || ''
}

export function hasAuthToken() {
  return Boolean(getAuthToken().trim())
}

export function setAuthToken(value: string) {
  window.localStorage.setItem(TOKEN_KEY, value)
}
