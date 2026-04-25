import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { dbConnect } from '@/lib/db'
import Order from '@/models/Order'
import { auth } from '@/auth'
import { sendTelegramMessage } from '@/lib/telegram'
import { logError } from '@/lib/logger'

// Customer submits their mobile payment TrxID for manual verification
const SubmitSchema = z.object({
  orderNumber: z.string().regex(/^ORD-\d{8}-\d{4}$/),
  transactionId: z.string().min(6).max(30),
  phone: z.string().regex(/^01[3-9]\d{8}$/), // Sender phone for verification
})

// Admin verifies and confirms the manual payment
const VerifySchema = z.object({
  orderNumber: z.string().regex(/^ORD-\d{8}-\d{4}$/),
  action: z.enum(['approve', 'reject']),
})

// Customer: Submit TrxID after mobile banking payment (bKash/Nagad personal)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const validated = SubmitSchema.safeParse(body)
    if (!validated.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }

    await dbConnect()

    const { orderNumber, transactionId, phone } = validated.data

    const order = await Order.findOneAndUpdate(
      { orderNumber, 'shipping.phone': phone, paymentMethod: 'mobile' },
      { transactionId, paymentStatus: 'pending' },
      { new: true }
    ).select('orderNumber total transactionId')

    if (!order) {
      return NextResponse.json({ error: 'Order not found or phone mismatch' }, { status: 404 })
    }

    // Notify admin on Telegram
    await sendTelegramMessage(
      `💳 <b>Manual Payment Submitted</b>\n\n` +
      `Order: ${orderNumber}\nTrxID: <code>${transactionId}</code>\nTotal: ৳${order.total}\n\n` +
      `Verify and approve from admin panel.`
    )

    return NextResponse.json({ success: true, message: 'Transaction submitted for review' })
  } catch (error) {
    await logError(error, 'API: /api/payment/manual POST')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Admin: Approve or reject the manual payment
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth()
    if (session?.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin only' }, { status: 403 })
    }

    const body = await req.json()
    const validated = VerifySchema.safeParse(body)
    if (!validated.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }

    await dbConnect()

    const { orderNumber, action } = validated.data
    const update =
      action === 'approve'
        ? { paymentStatus: 'paid', paidAt: new Date(), orderStatus: 'processing' }
        : { paymentStatus: 'failed' }

    const order = await Order.findOneAndUpdate({ orderNumber }, update, { new: true }).select(
      'orderNumber paymentStatus orderStatus'
    )

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, orderNumber: order.orderNumber, paymentStatus: order.paymentStatus })
  } catch (error) {
    await logError(error, 'API: /api/payment/manual PATCH')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
