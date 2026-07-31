// src/app/api/order/track/route.ts
import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import Order from "@/models/Order";

const DEFAULT_BRAND_CODE = "GH";
const DEFAULT_CHANNEL_CODE = "WEB"; // Website channel default for web tracking portal

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get("orderId");

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: "অর্ডার আইডি বা ফোন নম্বর প্রবেশ করান" },
        { status: 400 },
      );
    }

    await dbConnect();

    const rawInput = orderId.trim();

    // -------------------------------------------------------------
    // STEP 1: Phone Number Lookup (+88017... / 88017... / 017...)
    // 100% Unique per customer, avoids all channel collisions!
    // -------------------------------------------------------------
    const inputDigits = rawInput.replace(/\D/g, "");
    let phone11Digits = "";

    if (inputDigits.length === 11 && inputDigits.startsWith("01")) {
      phone11Digits = inputDigits;
    } else if (inputDigits.length === 13 && inputDigits.startsWith("8801")) {
      phone11Digits = inputDigits.slice(2);
    }

    if (phone11Digits) {
      const phoneOrder = await Order.findOne({
        $or: [
          { customerPhone: phone11Digits },
          { "shipping.phone": phone11Digits },
          { phone: phone11Digits },
          { senderNumber: phone11Digits },
        ],
      })
        .sort({ createdAt: -1 })
        .lean();

      if (phoneOrder) {
        return NextResponse.json({ success: true, order: phoneOrder });
      }
    }

    // -------------------------------------------------------------
    // STEP 2: Clean and Normalize Input String
    // Strip leading hashes (#), trim spaces, replace underscores/spaces with dashes
    // e.g., "# GH_FBP_260731_0005 " -> "GH-FBP-260731-0005"
    // -------------------------------------------------------------
    let cleanInput = rawInput
      .replace(/^#+\s*/, "") // Strip leading #
      .replace(/[\s_]+/g, "-") // Replace spaces/underscores with dash
      .toUpperCase();

    // Fix short sequence numbers (e.g., "GH-FBP-260731-5" -> "GH-FBP-260731-0005")
    const parts = cleanInput.split("-");
    if (parts.length >= 3) {
      const lastPart = parts[parts.length - 1];
      if (/^\d{1,3}$/.test(lastPart)) {
        parts[parts.length - 1] = lastPart.padStart(4, "0");
        cleanInput = parts.join("-");
      }
    }

    // -------------------------------------------------------------
    // STEP 3: Full Exact Match (Includes Brand & Channel Code)
    // e.g., "GH-FBP-260731-0005" or "GH-WEB-260731-0001"
    // 100% Unique & Collision Free across all brands and channels!
    // -------------------------------------------------------------
    let matchedOrder = await Order.findOne({
      orderNumber: { $regex: new RegExp(`^${cleanInput.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&")}$`, "i") },
    }).lean();

    if (matchedOrder) {
      return NextResponse.json({ success: true, order: matchedOrder });
    }

    // -------------------------------------------------------------
    // STEP 4: Channel-Scoped Shorthand Match (e.g., "FBP-260731-0005")
    // If user provided channel code without brand, prepend default brand ("GH-FBP-260731-0005")
    // -------------------------------------------------------------
    if (!cleanInput.startsWith(`${DEFAULT_BRAND_CODE}-`) && /^[A-Z]{2,4}-\d{6}-\d{4}$/.test(cleanInput)) {
      const prefixedId = `${DEFAULT_BRAND_CODE}-${cleanInput}`;
      matchedOrder = await Order.findOne({
        orderNumber: { $regex: new RegExp(`^${prefixedId.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&")}$`, "i") },
      }).lean();

      if (matchedOrder) {
        return NextResponse.json({ success: true, order: matchedOrder });
      }
    }

    // -------------------------------------------------------------
    // STEP 5: Bare Shorthand (e.g., "260731-0005" or "2607310005")
    // Since multiple channels (WEB, FBP, WA) can have sequence 0005 on the same day:
    // 1st Priority: Default to WEB channel ("GH-WEB-260731-0005")
    // 2nd Priority: Check if only 1 matching order exists across all channels
    // -------------------------------------------------------------
    if (inputDigits.length >= 8) {
      const seqPart = inputDigits.slice(-4).padStart(4, "0"); // "0005"
      const datePart = inputDigits.slice(-10, -4); // "260731"

      if (datePart.length === 6 && seqPart.length === 4) {
        // Priority 1: Match Website channel order for web portal
        const webId = `${DEFAULT_BRAND_CODE}-${DEFAULT_CHANNEL_CODE}-${datePart}-${seqPart}`;
        matchedOrder = await Order.findOne({ orderNumber: webId }).lean();
        if (matchedOrder) {
          return NextResponse.json({ success: true, order: matchedOrder });
        }

        // Priority 2: Find orders across all channels for this brand
        const allMatches = await Order.find({
          orderNumber: { $regex: new RegExp(`^${DEFAULT_BRAND_CODE}-.*-${datePart}-${seqPart}$`, "i") },
        }).lean();

        if (allMatches.length === 1) {
          return NextResponse.json({ success: true, order: allMatches[0] });
        } else if (allMatches.length > 1) {
          return NextResponse.json(
            {
              success: false,
              error:
                "একাধিক চ্যানেলে একই সিকুয়েন্স পাওয়া গেছে। অনুগ্রহ করে চ্যানেলসহ পুরো আইডি (যেমন: FBP-260731-0005) বা আপনার ফোন নম্বর দিন।",
            },
            { status: 400 },
          );
        }
      }
    }

    // Not Found Response
    return NextResponse.json(
      {
        success: false,
        error:
          "অর্ডারটি পাওয়া যায়নি। অনুগ্রহ করে ক্যাশ মেমোর সম্পূর্ণ আইডি (যেমন: GH-FBP-260731-0005) বা ফোন নম্বর দিন।",
      },
      { status: 404 },
    );
  } catch (error) {
    console.error("Smart Order Tracking Error:", error);
    return NextResponse.json(
      { success: false, error: "সার্ভারে সমস্যা হয়েছে, পুনরায় চেষ্টা করুন" },
      { status: 500 },
    );
  }
}
