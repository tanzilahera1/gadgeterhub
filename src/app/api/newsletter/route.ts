import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { sendTelegramMessage } from '@/lib/telegram'

const NewsletterSchema = z.object({
  email: z.string().email(),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const validated = NewsletterSchema.safeParse(body)

    if (!validated.success) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
    }

    // TODO: integrate with email service (MailChimp, ConvertKit etc.)
    // এখনো শুধু Telegram এ notify করছি
    await sendTelegramMessage(`📧 New Newsletter Signup: ${validated.data.email}`)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[API] /api/newsletter error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
