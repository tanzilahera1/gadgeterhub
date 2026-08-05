// src/actions/followUp.ts
"use server";

import { dbConnect } from "@/lib/db";
import Order from "@/models/Order";
import type { FollowUpOutcome, IFollowUpEntry } from "@/types/order";
import { revalidatePath } from "next/cache";

export async function addFollowUp(
  orderId: string,
  outcome: FollowUpOutcome,
  note?: string
): Promise<{ success: boolean; entry?: IFollowUpEntry; error?: string }> {
  try {
    await dbConnect();

    const entry = {
      outcome,
      note: note?.trim() || undefined,
      createdAt: new Date(),
    };

    await Order.findByIdAndUpdate(orderId, {
      $push: { followUps: { $each: [entry], $position: 0 } }, // newest first
    });

    revalidatePath(`/admin/orders/${orderId}`);
    revalidatePath("/admin/courier");

    return { success: true, entry: { ...entry, createdAt: entry.createdAt.toISOString() } as IFollowUpEntry };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

export async function getFollowUps(
  orderId: string
): Promise<{ success: boolean; followUps?: IFollowUpEntry[]; error?: string }> {
  try {
    await dbConnect();
    const order = await Order.findById(orderId).select("followUps").lean();
    if (!order) return { success: false, error: "Order not found" };

    const followUps = ((order as any).followUps || []).map((f: any) => ({
      _id: f._id?.toString(),
      outcome: f.outcome,
      note: f.note,
      createdAt: f.createdAt instanceof Date ? f.createdAt.toISOString() : f.createdAt,
    }));

    return { success: true, followUps };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}
