import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import Order from "@/models/Order";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get("orderId");
    const phone = searchParams.get("phone");

    if (!orderId || !phone) {
      return NextResponse.json({ success: false, error: "Missing parameters" }, { status: 400 });
    }

    await dbConnect();

    // Find order by orderNumber (string from client, but we might store as number or string)
    // We also verify the phone number for basic security
    const order = await Order.findOne({ 
      orderNumber: orderId,
      "shipping.phone": phone
    }).lean();

    if (!order) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, order });
  } catch (error) {
    console.error("Order tracking error:", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
