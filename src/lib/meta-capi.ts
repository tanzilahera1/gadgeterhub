import { createHash } from 'crypto'

interface MetaUserData {
  em?: string[] // Hashed email - array
  ph?: string[] // Hashed phone - array  
  fbp?: string  // _fbp cookie
  fbc?: string  // _fbc cookie
  client_ip_address?: string
  client_user_agent?: string
}

interface MetaEventData {
  eventName: string
  eventID?: string
  sourceUrl?: string
  userData: MetaUserData
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  customData?: Record<string, any>
}

// SHA256 hash utility - Meta এটা চায়
function hashData(data: string): string {
  return createHash('sha256').update(data.trim().toLowerCase()).digest('hex')
}

// See Meta CAPI documentation: https://developers.facebook.com/docs/marketing-api/conversions-api
export async function sendMetaEvent(eventData: MetaEventData) {
  const PIXEL_ID = process.env.META_PIXEL_ID
  const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN
  const TEST_EVENT_CODE = process.env.META_TEST_EVENT_CODE // Dev এ টেস্ট করার জন্য

  if (!PIXEL_ID || !ACCESS_TOKEN) {
    console.warn('Meta CAPI: PIXEL_ID or ACCESS_TOKEN missing')
    return
  }

  try {
    // user_data বিল্ড করো - fbp, fbc, ip, ua সব অ্যাড করো
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userData: Record<string, any> = {
      client_ip_address: eventData.userData.client_ip_address,
      client_user_agent: eventData.userData.client_user_agent,
    }

    if (eventData.userData.em) {
      userData.em = eventData.userData.em // Already hashed ধরে নিলাম
    }
    if (eventData.userData.ph) {
      userData.ph = eventData.userData.ph // Already hashed
    }
    if (eventData.userData.fbp) userData.fbp = eventData.userData.fbp
    if (eventData.userData.fbc) userData.fbc = eventData.userData.fbc

    const payload = {
      data: [
        {
          event_name: eventData.eventName,
          event_time: Math.floor(Date.now() / 1000),
          action_source: 'website',
          event_source_url: eventData.sourceUrl || process.env.NEXT_PUBLIC_APP_URL,
          event_id: eventData.eventID, // Pixel deduplication এর জন্য
          user_data: userData,
          custom_data: eventData.customData,
        },
      ],
      ...(TEST_EVENT_CODE && { test_event_code: TEST_EVENT_CODE }),
    }

    const res = await fetch(
      `https://graph.facebook.com/v20.0/${PIXEL_ID}/events?access_token=${ACCESS_TOKEN}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    )

    if (!res.ok) {
      const errorResponse = await res.json()
      console.error('Meta CAPI Error:', errorResponse)
    }
  } catch (error) {
    console.error('Meta CAPI Request Failed:', error)
  }
}

export function hashEmail(email: string): string {
  return hashData(email)
}

export function hashPhone(phone: string): string {
  // +8801... ফরম্যাটে রাখো, স্পেস/ড্যাশ বাদ
  return hashData(phone.replace(/[^0-9+]/g, ''))
}