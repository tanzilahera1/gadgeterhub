import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { dbConnect } from '@/lib/db'
import Order from '@/models/Order'
import { auth } from '@/auth'
import { logError } from '@/lib/logger'

const CodSchema = z.object({
  orderNumber: z.string().regex(/^ORD-\d{8}-\d{4}$/),
})

// Cash on Delivery confirmation — admin manually confirms  
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (session?.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin only' }, { status: 403 })
    }

    const body = await req.json()
    const validated = CodSchema.safeParse(body)
    if (!validated.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }

    await dbConnect()

    const order = await Order.findOneAndUpdate(
      { orderNumber: validated.data.orderNumber, paymentMethod: 'cod' },
      { paymentStatus: 'paid', paidAt: new Date() },
      { new: true }
    ).select('orderNumber paymentStatus')

    if (!order) {
      return NextResponse.json({ error: 'COD order not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, orderNumber: order.orderNumber })
  } catch (error) {
    await logError(error, 'API: /api/payment/cod')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
