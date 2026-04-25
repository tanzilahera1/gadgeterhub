'use server'

import { z } from 'zod'
import { sendTelegramMessage } from '@/lib/telegram'

const ContactSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  message: z.string().min(10)
})

export async function sendContactMessage(formData: FormData) {
  const validated = ContactSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    message: formData.get('message')
  })

  if (!validated.success) return { error: 'Invalid data', details: validated.error.flatten() }

  const text = `✉️ <b>New Contact Message</b>\n\n<b>Name:</b> ${validated.data.name}\n<b>Email:</b> ${validated.data.email}\n<b>Message:</b>\n${validated.data.message}`

  await sendTelegramMessage(text)

  return { success: true }
}
