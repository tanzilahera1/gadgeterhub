import { NextRequest, NextResponse } from 'next/server'
import { dbConnect } from '@/lib/db'
import Product from '@/models/Product'
import { sendDiscordError } from '@/lib/discord'
import { sendTelegramMessage } from '@/lib/telegram'

const LOW_STOCK_THRESHOLD = 5

// Vercel Cron: রোজ সকাল ৯টায় চলবে
// vercel.json: { "crons": [{ "path": "/api/cron/low-stock", "schedule": "0 3 * * *" }] }
export async function GET(req: NextRequest) {
  // Cron secret দিয়ে unauthorized access ঠেকাও
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    await dbConnect()

    const lowStockProducts = await Product.find({
      status: 'published',
      stockQuantity: { $lte: LOW_STOCK_THRESHOLD, $gt: 0 },
    })
      .select('title sku stockQuantity')
      .lean()

    const outOfStockProducts = await Product.find({
      status: 'published',
      stockQuantity: 0,
    })
      .select('title sku')
      .lean()

    if (lowStockProducts.length === 0 && outOfStockProducts.length === 0) {
      return NextResponse.json({ message: 'All stock levels OK' })
    }

    // Telegram message
    let message = '⚠️ <b>Stock Alert Report</b>\n\n'

    if (outOfStockProducts.length > 0) {
      message += `🔴 <b>Out of Stock (${outOfStockProducts.length})</b>\n`
      outOfStockProducts.slice(0, 10).forEach((p) => {
        message += `• ${p.title} [${p.sku}]\n`
      })
      if (outOfStockProducts.length > 10) message += `...and ${outOfStockProducts.length - 10} more\n`
      message += '\n'
    }

    if (lowStockProducts.length > 0) {
      message += `🟡 <b>Low Stock (${lowStockProducts.length})</b>\n`
      lowStockProducts.slice(0, 10).forEach((p) => {
        message += `• ${p.title} [${p.sku}] — ${p.stockQuantity} left\n`
      })
      if (lowStockProducts.length > 10) message += `...and ${lowStockProducts.length - 10} more\n`
    }

    await sendTelegramMessage(message)

    return NextResponse.json({
      lowStock: lowStockProducts.length,
      outOfStock: outOfStockProducts.length,
    })
  } catch (error) {
    console.error('[CRON] low-stock error:', error)
    await sendDiscordError('Cron: low-stock failed', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
