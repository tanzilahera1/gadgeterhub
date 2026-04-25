// src/lib/logger.ts
import { sendDiscordError } from './discord'

function serializeError(error: unknown): string {
  if (error instanceof Error) {
    return `${error.name}: ${error.message}\n${error.stack || ''}`
  }
  if (typeof error === 'string') return error
  try {
    return JSON.stringify(error, null, 2)
  } catch {
    return String(error)
  }
}

export async function logError(error: unknown, context: string) {
  const errorMessage = serializeError(error)
  
  // 1. Console এ সবসময় লগ করো - Vercel logs এর জন্য
  console.error(`[ERROR] ${context}:`, errorMessage)
  
  // 2. Discord এ শুধু প্রোডাকশনে পাঠাও
  if (process.env.NODE_ENV === 'production') {
    await sendDiscordError(context, errorMessage).catch(err => {
      // Discord ফেইল করলে সাইলেন্টলি ফেইল - ইনফিনিট লুপ ঠেকানো
      console.error('[LOGGER] Failed to send Discord error:', err)
    })
  }
} 