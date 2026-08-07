// src/actions/pathaoTracking.ts
"use server";

import { dbConnect } from "@/lib/db";
import Order from "@/models/Order";
import type { IOrderSerializable } from "@/types/order";
import { revalidatePath } from "next/cache";

export interface PathaoLogItem {
  desc: string;
  created_at: string;
  notes?: string;
  grouped_status?: any[];
}

export interface PathaoTrackingResult {
  success: boolean;
  data?: {
    consignmentId: string;
    currentStatus: string;
    statusUpdatedTime?: string;
    collectableAmount?: number;
    collectedAmount?: number;
    riderName?: string;
    riderPhone?: string;
    reason?: string;
    attemptCount?: number;
    lastLogDesc?: string;
    timeline: PathaoLogItem[];
  };
  error?: string;
}

/**
 * Fetch live tracking info directly from Pathao's public API.
 * Uses Origin + Referer headers so Pathao doesn't block the server-side request.
 */
export async function getPublicPathaoTracking(
  consignmentId: string
): Promise<PathaoTrackingResult> {
  const cleanId = consignmentId.trim();
  if (!cleanId) {
    return { success: false, error: "Consignment ID is required" };
  }

  try {
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
      body: JSON.stringify({ consignment_id: cleanId }),
      cache: "no-store",
    });

    const text = await pathaoRes.text();
    console.log("[Pathao] status:", pathaoRes.status, "| preview:", text.slice(0, 300));

    if (!pathaoRes.ok) {
      return { success: false, error: `Pathao HTTP ${pathaoRes.status}` };
    }

    let json: any;
    try {
      json = JSON.parse(text);
    } catch {
      return { success: false, error: "Pathao returned non-JSON: " + text.slice(0, 100) };
    }

    if (json.code !== 200 || !json.data || !json.data.order) {
      return {
        success: false,
        error: json.message || "Invalid Consignment ID or no data returned",
      };
    }

    const orderData = json.data.order;
    const logs: PathaoLogItem[] = json.data.log || [];
    const stateName = json.data.state?.name || orderData.transfer_status || "Unknown";
    const lastLogDesc = logs.length > 0 ? (logs[logs.length - 1].desc || "") : "";

    let riderName = orderData.agent?.name || "";
    let riderPhone = "";
    let holdReason = "";
    let attemptCount = 0;

    for (const logItem of logs) {
      if (logItem.notes && logItem.notes.toLowerCase().includes("reason:")) {
        holdReason = logItem.notes.replace(/reason:\s*/i, "").trim();
      }
      if (logItem.desc && logItem.desc.toLowerCase().includes("assigned to")) {
        const phoneMatch = logItem.desc.match(/\((01[3-9]\d{8})\)/);
        if (phoneMatch) riderPhone = phoneMatch[1];
      }

      // Calculate attempt count from log items
      const gStatus = logItem.grouped_status?.[0] || "";
      if (gStatus === "Ready For Delivery" || logItem.desc?.toLowerCase().includes("assigned to")) {
        attemptCount++;
      }
    }

    // If the latest log is an assignment, clear any previous hold reasons!
    const isLastLogAssigned = lastLogDesc.toLowerCase().includes("assigned to");
    if (isLastLogAssigned) {
      holdReason = "";
    }

    return {
      success: true,
      data: {
        consignmentId: cleanId,
        currentStatus: stateName,
        statusUpdatedTime: orderData.transfer_status_updated_at || "",
        collectableAmount: orderData.collectable_amount || 0,
        collectedAmount: orderData.collected_amount || 0,
        riderName,
        riderPhone,
        reason: holdReason,
        attemptCount,
        lastLogDesc,
        timeline: logs,
      },
    };
  } catch (err: any) {
    console.error("[Pathao error]:", err);
    return {
      success: false,
      error: err.message || "Failed to communicate with Pathao",
    };
  }
}

/**
 * Save / Update Pathao Consignment ID for an order and sync live status from Pathao.
 */
export async function updateOrderTrackingId(
  orderId: string,
  consignmentId: string
): Promise<{ success: boolean; error?: string; order?: IOrderSerializable }> {
  try {
    await dbConnect();
    const cleanId = consignmentId.trim();

    const order = await Order.findById(orderId);
    if (!order) {
      return { success: false, error: "Order not found" };
    }

    order.courierTrackingId = cleanId;

    if (cleanId) {
      const tracking = await getPublicPathaoTracking(cleanId);
      if (tracking.success && tracking.data) {
        order.courierStatus = tracking.data.currentStatus;
        order.courierReason = tracking.data.reason || "";
        order.courierRiderName = tracking.data.riderName || "";
        order.courierRiderPhone = tracking.data.riderPhone || "";
        order.courierLastLogDesc = tracking.data.lastLogDesc || "";
        order.courierAttemptCount = tracking.data.attemptCount || 0;
        order.courierLastUpdated = new Date();

        const statusLower = tracking.data.currentStatus.toLowerCase();
        if (statusLower.includes("delivered") && order.orderStatus !== "delivered") {
          order.orderStatus = "delivered";
          order.deliveredAt = new Date();
        } else if (statusLower.includes("return") && order.orderStatus !== "returned") {
          order.orderStatus = "returned";
        }
      } else {
        // Pathao didn't return data yet — mark as booked
        order.courierStatus = "Booked";
        order.courierLastUpdated = new Date();
        console.warn("[Pathao] tracking fetch failed during save:", tracking.error);
      }
    } else {
      order.courierStatus = "";
      order.courierReason = "";
      order.courierRiderName = "";
      order.courierRiderPhone = "";
      order.courierLastLogDesc = "";
      order.courierAttemptCount = 0;
    }

    await order.save();
    revalidatePath("/admin/orders");
    revalidatePath("/admin/courier");
    revalidatePath(`/admin/orders/${orderId}`);

    return {
      success: true,
      order: JSON.parse(JSON.stringify(order)),
    };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to update order tracking ID" };
  }
}

/**
 * Batch refresh live tracking for all active shipments.
 */
export async function refreshActiveShipments(): Promise<{
  success: boolean;
  updatedCount: number;
  error?: string;
}> {
  try {
    await dbConnect();
    const activeOrders = await Order.find({
      courierTrackingId: { $exists: true, $ne: "" },
      orderStatus: { $nin: ["cancelled"] },
    });

    let updatedCount = 0;
    for (const ord of activeOrders) {
      if (!ord.courierTrackingId) continue;
      const tracking = await getPublicPathaoTracking(ord.courierTrackingId);
      if (tracking.success && tracking.data) {
        ord.courierStatus = tracking.data.currentStatus;
        ord.courierReason = tracking.data.reason || "";
        ord.courierRiderName = tracking.data.riderName || "";
        ord.courierRiderPhone = tracking.data.riderPhone || "";
        ord.courierLastLogDesc = tracking.data.lastLogDesc || "";
        ord.courierAttemptCount = tracking.data.attemptCount || 0;
        ord.courierLastUpdated = new Date();

        const statusLower = tracking.data.currentStatus.toLowerCase();
        if (statusLower.includes("delivered") && ord.orderStatus !== "delivered") {
          ord.orderStatus = "delivered";
          ord.deliveredAt = new Date();
        } else if (statusLower.includes("return") && ord.orderStatus !== "returned") {
          ord.orderStatus = "returned";
        }
        await ord.save();
        updatedCount++;
      }
    }

    revalidatePath("/admin/orders");
    revalidatePath("/admin/courier");
    return { success: true, updatedCount };
  } catch (err: any) {
    return { success: false, updatedCount: 0, error: err.message };
  }
}
