import { cookies } from 'next/headers'
import { v4 as uuidv4 } from 'uuid'

const SESSION_COOKIE_NAME = 'cart_session_id'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30 // 30 days

/**
 * Retrieves the guest session ID from cookies.
 * If it doesn't exist, it generates a new one and sets the cookie.
 */
export async function getOrCreateSessionId() {
  const cookieStore = await cookies()
  let sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value

  if (!sessionId) {
    sessionId = uuidv4()
    cookieStore.set(SESSION_COOKIE_NAME, sessionId, {
      maxAge: COOKIE_MAX_AGE,
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    })
  }

  return sessionId
}

/**
 * Returns the session ID if it exists, otherwise undefined.
 */
export async function getSessionId() {
  const cookieStore = await cookies()
  return cookieStore.get(SESSION_COOKIE_NAME)?.value
}

/**
 * Deletes the session ID cookie.
 */
export async function deleteSessionId() {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE_NAME)
}
