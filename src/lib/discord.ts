// src/lib/discord.ts
import type { Types } from "mongoose";
import type { IOrder } from "@/types/order";
import { buildInvoiceText } from "@/lib/invoice-formatter";

type OrderForDiscord = Omit<IOrder, "_id"> & { _id: Types.ObjectId };

export async function sendDiscordOrder(
  orderData: OrderForDiscord,
  customerName?: string, // ✅ optional
) {
  const webhookUrl = process.env.DISCORD_ORDER_WEBHOOK;
  if (!webhookUrl) return;

  try {
    const invoiceText = buildInvoiceText(orderData, { customerName });

    const content =
      `🛍️ **নতুন অর্ডার এসেছে!**\n` +
      `\`\`\`\n${invoiceText}\n\`\`\``;

    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
  } catch (error) {
    console.error("Discord Order Webhook Error:", error);
  }
}

export async function sendDiscordError(context: string, errorObj?: unknown) {
  const webhookUrl = process.env.DISCORD_ERROR_WEBHOOK;
  if (!webhookUrl || process.env.NODE_ENV !== "production") return;

  try {
    let errorDetails = "";
    if (errorObj instanceof Error) {
      errorDetails = `\n\`\`\`\n${errorObj.name}: ${errorObj.message}\n${errorObj.stack?.split("\n").slice(0, 5).join("\n")}\n\`\`\``;
    } else if (typeof errorObj === "string") {
      errorDetails = `\n\`\`\`${errorObj.slice(0, 1500)}\`\`\``;
    } else if (errorObj) {
      errorDetails = `\n\`\`\`${JSON.stringify(errorObj, null, 2).slice(0, 1500)}\`\`\``;
    }

    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: `🔥 **Error in Production**`,
        embeds: [
          {
            title: context,
            description: errorDetails || "No error details",
            color: 15158332,
            timestamp: new Date().toISOString(),
          },
        ],
      }),
    });
  } catch (error) {
    console.error("Discord Error Webhook Failed:", error);
  }
}

export async function sendDiscordContactMessage(data: {
  name: string;
  email?: string;
  phone: string;
  subject: string;
  message: string;
}) {
  const webhookUrl = process.env.DISCORD_CONTACT_WEBHOOK;
  if (!webhookUrl) return;

  try {
    const embeds = [
      {
        title: `📩 New Contact Message: ${data.subject}`,
        color: 3447003,
        fields: [
          { name: "Name", value: data.name, inline: true },
          { name: "Phone", value: data.phone, inline: true },
          { name: "Email", value: data.email || "N/A", inline: true },
          { name: "Message", value: data.message, inline: false },
        ],
        timestamp: new Date().toISOString(),
      },
    ];

    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ embeds }),
    });
  } catch (error) {
    console.error("Discord Contact Webhook Error:", error);
  }
}