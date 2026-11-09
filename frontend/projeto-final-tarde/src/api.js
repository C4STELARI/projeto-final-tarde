const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'
const TOKEN_KEY = 'instagram-demo-token'

export function setAuthToken(token) {
  sessionStorage.setItem(TOKEN_KEY, token)
}

export function clearAuthToken() {
  sessionStorage.removeItem(TOKEN_KEY)
}

export function hasAuthToken() {
  return Boolean(sessionStorage.getItem(TOKEN_KEY))
}

export function mediaUrl(path) {
  if (!path || /^(https?:|data:|blob:)/.test(path)) {
    return path
  }

  return new URL(path, API_URL).toString()
}

export async function apiRequest(path, { body, headers = {}, ...options } = {}) {
  const token = sessionStorage.getItem(TOKEN_KEY)
  const requestHeaders = new Headers(headers)

  if (body !== undefined) {
    requestHeaders.set('Content-Type', 'application/json')
  }

  if (token) {
    requestHeaders.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(new URL(path, API_URL), {
    ...options,
    headers: requestHeaders,
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const responseText = await response.text()
  let result

  try {
    result = responseText ? JSON.parse(responseText) : {}
  } catch {
    throw new Error('O servidor retornou uma resposta inválida.')
  }

  if (!response.ok) {
    if (response.status === 401) {
      clearAuthToken()
    }
    throw new Error(result.error || `A solicitação falhou (${response.status}).`)
  }

  return result
}
