import { NextRequest, NextResponse } from 'next/server'
import { dbConnect } from '@/lib/db'
import Order from '@/models/Order'
import { sendTelegramMessage } from '@/lib/telegram'
import { sendDiscordError } from '@/lib/discord'

// Vercel Cron: রাত ১২টায় দৈনিক রিপোর্ট পাঠাবে
// vercel.json: { "crons": [{ "path": "/api/cron/daily-report", "schedule": "0 18 * * *" }] }
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    await dbConnect()

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const [orders, revenue] = await Promise.all([
      Order.find({ createdAt: { $gte: today, $lt: tomorrow } })
        .select('orderNumber total paymentMethod orderStatus')
        .lean(),
      Order.aggregate([
        { $match: { createdAt: { $gte: today, $lt: tomorrow }, paymentStatus: 'paid' } },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),
    ])

    const totalOrders = orders.length
    const totalRevenue = revenue[0]?.total || 0
    const pendingOrders = orders.filter((o) => o.orderStatus === 'pending').length
    const codOrders = orders.filter((o) => o.paymentMethod === 'cod').length
    const mobileOrders = orders.filter((o) => o.paymentMethod === 'mobile').length

    const date = today.toLocaleDateString('en-BD', { day: '2-digit', month: 'short', year: 'numeric' })

    const message =
      `📊 <b>Daily Report — ${date}</b>\n\n` +
      `📦 Total Orders: ${totalOrders}\n` +
      `💰 Revenue (Paid): ৳${totalRevenue.toLocaleString()}\n` +
      `⏳ Pending: ${pendingOrders}\n\n` +
      `💳 COD: ${codOrders} | Mobile: ${mobileOrders}`

    await sendTelegramMessage(message)

    return NextResponse.json({ date, totalOrders, totalRevenue, pendingOrders })
  } catch (error) {
    console.error('[CRON] daily-report error:', error)
    await sendDiscordError('Cron: daily-report failed', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
