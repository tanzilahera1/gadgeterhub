import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { sendTelegramMessage } from '@/lib/telegram'

const ContactSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  message: z.string().min(10),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const validated = ContactSchema.safeParse(body)

    if (!validated.success) {
      return NextResponse.json({ error: 'Invalid input', details: validated.error.flatten() }, { status: 400 })
    }

    const { name, email, message } = validated.data
    const text = `✉️ <b>New Contact</b>\n\n<b>Name:</b> ${name}\n<b>Email:</b> ${email}\n<b>Message:</b>\n${message}`

    await sendTelegramMessage(text)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[API] /api/contact error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
