import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import Order from "@/models/Order";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get("orderId");

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: "Order ID বা ফোন নম্বর প্রয়োজন" },
        { status: 400 },
      );
    }

    await dbConnect();

    const rawInput = orderId.trim();
    const inputDigits = rawInput.replace(/\D/g, "");

    // 1. Direct exact or case-insensitive match (Super Fast Index Search)
    let matchedOrder = await Order.findOne({
      $or: [
        { orderNumber: rawInput },
        { orderNumber: { $regex: new RegExp(`^${rawInput.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}$`, "i") } }
      ]
    }).lean();

    // 2. User's Smart Rule: Extract last 10 digits -> Reconstruct "GH-YYMMDD-XXXX" & Indexed Search
    if (!matchedOrder && inputDigits.length >= 10) {
      const last10 = inputDigits.slice(-10); // e.g. "2607300002"
      const datePart = last10.slice(0, 6);   // "260730"
      const seqPart = last10.slice(6);       // "0002"
      const reconstructedId = `GH-${datePart}-${seqPart}`;

      matchedOrder = await Order.findOne({ orderNumber: reconstructedId }).lean();
    }

    // 3. Extra Smart Feature: Phone Number Lookup (If user enters their 11-digit mobile number, gets latest order)
    if (!matchedOrder && inputDigits.length === 11 && inputDigits.startsWith("01")) {
      matchedOrder = await Order.findOne({
        $or: [
          { customerPhone: inputDigits },
          { "shipping.phone": inputDigits }
        ]
      })
      .sort({ createdAt: -1 })
      .lean();
    }

    if (!matchedOrder) {
      return NextResponse.json(
        {
          success: false,
          error:
            "অর্ডার খুঁজে পাওয়া যায়নি। আপনার Order ID বা ফোন নম্বর চেক করে আবার চেষ্টা করুন।",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, order: matchedOrder });
  } catch (error) {
    console.error("Order tracking error:", error);
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 },
    );
  }
}
