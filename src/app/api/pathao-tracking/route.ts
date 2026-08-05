// src/app/api/pathao-tracking/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { consignment_id } = await req.json();

    if (!consignment_id) {
      return NextResponse.json({ success: false, error: "Consignment ID required" }, { status: 400 });
    }

    const pathaoRes = await fetch("https://merchant.pathao.com/api/v1/user/tracking", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
        "Origin": "https://merchant.pathao.com",
        "Referer": "https://merchant.pathao.com/public-tracking",
      },
      body: JSON.stringify({ consignment_id }),
      cache: "no-store",
    });

    const text = await pathaoRes.text();
    console.log("[Pathao API] status:", pathaoRes.status, "body:", text.slice(0, 500));

    if (!pathaoRes.ok) {
      return NextResponse.json(
        { success: false, error: `Pathao HTTP ${pathaoRes.status}`, raw: text },
        { status: 200 }
      );
    }

    let json: any;
    try {
      json = JSON.parse(text);
    } catch {
      return NextResponse.json({ success: false, error: "Pathao returned non-JSON", raw: text }, { status: 200 });
    }

    return NextResponse.json({ success: true, data: json });
  } catch (err: any) {
    console.error("[Pathao proxy error]", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 200 });
  }
}
