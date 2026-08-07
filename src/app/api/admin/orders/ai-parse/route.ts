// src/app/api/admin/orders/ai-parse/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { dbConnect } from "@/lib/db";
import Product from "@/models/Product";

export const dynamic = "force-dynamic";

function convertBengaliToEnglishDigits(str: string): string {
  if (!str) return "";
  const bnDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
  return str.replace(/[০-৯]/g, (w) => bnDigits.indexOf(w).toString());
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { rawText: inputRawText } = await req.json();
    if (!inputRawText || typeof inputRawText !== "string" || inputRawText.trim().length === 0) {
      return NextResponse.json(
        { error: "টেক্সট প্রদান করুন" },
        { status: 400 },
      );
    }

    // Convert any Bengali numerals (০-৯) in input text to English numerals (0-9)
    const rawText = convertBengaliToEnglishDigits(inputRawText);

    await dbConnect();
    const storeProducts = await Product.find(
      {},
      "title slug colors sizes salePrice regularPrice thumbnail",
    ).lean();

    const apiKey = process.env.GEMINI_API_KEY;
    let parsedData: any = null;

    if (apiKey) {
      try {
        const systemInstruction = `You are an expert E-Commerce Order Parser AI for a Bangladeshi online gadget store (GadgeterHub).
Extract structured order information from customer raw chat/text.
Return ONLY valid JSON matching this exact TypeScript schema:
{
  "name": string,
  "phone": string,
  "isGift": boolean,
  "receiverName": string | null,
  "receiverPhone": string | null,
  "addressLine1": string, // Area / Road / Village (e.g. "উত্তর বালাশুর", "পানিশাইল বাজার")
  "city": string | null, // Thana / Upazila (e.g. "শ্রীনগর", "সিংগার")
  "district": string | null, // District (e.g. "মুন্সীগঞ্জ", "মানিকগঞ্জ")
  "deliveryArea": "dhaka" | "outside",
  "items": [
    {
      "productQuery": string,
      "color": string | null,
      "size": string | null,
      "quantity": number
    }
  ],
  "paymentMethod": "cod" | "mobile",
  "paymentProvider": "bkash" | "nagad" | "rocket" | null,
  "senderNumber": string | null,
  "transactionId": string | null,
  "customerNotes": string | null
}

CRITICAL RULES FOR BANGLADESH GEOGRAPHY & ADDRESS:
- Handle both English colons ":" and Bengali Visarga "ঃ" (e.g. "মোবাইলঃ", "নামঃ", "গ্রামঃ", "উপজেলাঃ", "জেলাঃ", "জেলঃ").
- "name": Extract customer name after "নামঃ", "নাম:", "Name:", or from text.
- "phone": 11-digit Bangladesh phone number starting with 01. Strip labels like "মোবাইলঃ".
- "addressLine1": Village / Area / Road name ONLY (e.g. "উত্তর বালাশুর"). Do NOT include name or phone!
- "city": Upazila or Thana name (e.g. "শ্রীনগর", "সিংগার", "মিরপুর").
- "district": District / Zila name (e.g. "মুন্সীগঞ্জ", "মানিকগঞ্জ", "ঢাকা", "গাজীপুর").
- "deliveryArea": Set to "dhaka" ONLY IF district/location is strictly inside Dhaka Metropolitan area (e.g. Mirpur, Dhanmondi, Uttara, Gulshan, Banani, Motijheel, Mohammadpur, Badda, Rampura, Jatrabari, Old Dhaka, etc.).
- "deliveryArea": Set to "outside" IF district/location is outside Dhaka Metropolitan OR in any other district (e.g. Munshiganj, Srinagar, Manikganj, Singair, Gazipur, Savar, Narayanganj, Keraniganj, Chittagong, Sylhet, Rajshahi, Khulna, Barisal, Rangpur, Mymensingh, Comilla, etc.).
- Multiple items: If the customer orders more than 1 product, include each product in the "items" array!
- Do NOT output markdown codeblocks, output raw JSON only.`;

        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                {
                  role: "user",
                  parts: [
                    { text: systemInstruction },
                    { text: `Raw Text:\n${rawText}` },
                  ],
                },
              ],
              generationConfig: {
                responseMimeType: "application/json",
                temperature: 0.1,
              },
            }),
          },
        );

        if (geminiRes.ok) {
          const geminiJson = await geminiRes.json();
          const candidateText =
            geminiJson?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (candidateText) {
            parsedData = JSON.parse(candidateText.replace(/```json|```/g, "").trim());
          }
        }
      } catch (geminiError) {
        console.error("Gemini API error, falling back to regex parser:", geminiError);
      }
    }

    // Fallback Smart Regex Parser if Gemini API Key not configured or failed
    if (!parsedData) {
      parsedData = fallbackRegexParse(rawText);
    }

    // Match extracted item productQueries with actual store products
    const parsedItems: any[] = [];
    const rawItemsList = Array.isArray(parsedData.items) && parsedData.items.length > 0
      ? parsedData.items
      : [{ productQuery: parsedData.productQuery || rawText, color: parsedData.color, size: parsedData.size, quantity: parsedData.quantity || 1 }];

    for (const rawItem of rawItemsList) {
      let matchedProductId = "";
      let matchedProductTitle = "";
      let matchedProductColors: string[] = [];

      const q = (rawItem.productQuery || rawText).toLowerCase();
      const matched = storeProducts.find((p: any) => {
        const titleLower = p.title.toLowerCase();
        return (
          titleLower.includes(q) ||
          q.split(/\s+/).some((word: string) => word.length > 3 && titleLower.includes(word))
        );
      });

      if (matched) {
        matchedProductId = (matched._id as any).toString();
        matchedProductTitle = matched.title;
        matchedProductColors = matched.colors || [];
      } else if (storeProducts.length > 0) {
        matchedProductId = (storeProducts[0]._id as any).toString();
        matchedProductTitle = storeProducts[0].title;
        matchedProductColors = storeProducts[0].colors || [];
      }

      parsedItems.push({
        productId: matchedProductId,
        productTitle: matchedProductTitle,
        color: rawItem.color || (matchedProductColors.length > 0 ? matchedProductColors[0] : ""),
        size: rawItem.size || "",
        quantity: Math.max(1, Number(rawItem.quantity) || 1),
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        ...parsedData,
        items: parsedItems,
      },
    });
  } catch (error: any) {
    console.error("AI Parse Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to parse text" },
      { status: 500 },
    );
  }
}

function fallbackRegexParse(text: string) {
  const phoneMatch = text.match(/01[3-9]\d{8}/);
  const phone = phoneMatch ? phoneMatch[0] : "";

  const nameMatch = text.match(/(?:নাম|name)\s*[:=\-ঃ]\s*([^\n\r,]+)/i);
  let name = nameMatch ? nameMatch[1].trim() : "";

  const areaMatch = text.match(/(?:ঠিকানা|এরিয়া|গ্রাম|বাসা|রোড)\s*[:=\-ঃ]\s*([^\n\r,]+)/i);
  const upazilaMatch = text.match(/(?:উপজেলা|থানা|upazila|thana)\s*[:=\-ঃ]\s*([^\n\r,]+)/i);
  const districtMatch = text.match(/(?:জেলা|জেল|zila|district)\s*[:=\-ঃ]\s*([^\n\r,]+)/i);

  const isOutside = /(?:মুন্সীগঞ্জ|মানিকগঞ্জ|গাজীপুর|সাভার|নারায়ণগঞ্জ|সিংগার|চট্টগ্রাম|সিলেট|রাজশাহী|খুলনা|বরিশাল|রংপুর|কুমিল্লা|outside|osd)/i.test(
    text,
  ) || (districtMatch && !/ঢাকা|dhaka/i.test(districtMatch[1]));

  const addressLine1 = areaMatch ? areaMatch[1].trim() : (name || phone ? "" : text.slice(0, 50));
  const city = upazilaMatch ? upazilaMatch[1].trim() : "";
  const district = districtMatch ? districtMatch[1].trim() : (isOutside ? "Outside Dhaka" : "Dhaka");

  if (!name) {
    const lines = text.split(/[\n\r]+/).map((l) => l.trim()).filter(Boolean);
    for (const l of lines) {
      if (!l.match(/01[3-9]\d{8}/) && !l.match(/(?:গ্রাম|উপজেলা|জেলা|জেল|ঠিকানা|মোবাইল)/i)) {
        name = l.replace(/^(?:নাম|name)\s*[:=\-ঃ]\s*/i, "").trim();
        if (name) break;
      }
    }
  }

  const trxMatch = text.match(/trxid\s*[:=\-ঃ]?\s*([a-z0-9]+)/i);
  const trxId = trxMatch ? trxMatch[1] : null;

  return {
    name: name || "Customer",
    phone,
    isGift: false,
    receiverName: null,
    receiverPhone: null,
    addressLine1,
    city,
    district,
    deliveryArea: isOutside ? "outside" : "dhaka",
    items: [
      {
        productQuery: text,
        color: null,
        size: null,
        quantity: 1,
      },
    ],
    paymentMethod: trxId ? "mobile" : "cod",
    paymentProvider: trxId ? "bkash" : null,
    senderNumber: null,
    transactionId: trxId,
    customerNotes: null,
  };
}
