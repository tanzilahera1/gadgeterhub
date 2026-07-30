// src/lib/invoice-number.ts
import mongoose from "mongoose";

// Counter Schema — global sequence track
const CounterSchema = new mongoose.Schema({
  _id: { type: String, required: true }, // Format: "global_invoice_seq"
  sequence: { type: Number, default: 0 },
});

const Counter =
  mongoose.models.Counter || mongoose.model("Counter", CounterSchema);

/**
 * Generates: GH-YYMMDD-4digitSequence
 * Example: GH-260730-0001
 */
export async function generateInvoiceNumber(): Promise<string> {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, "0");
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const yy = String(now.getFullYear()).slice(-2);

  const counterKey = "global_invoice_seq";

  // Check if global counter exists
  let counter = await Counter.findById(counterKey);

  if (!counter) {
    // Initialize the global counter from the latest order if it exists
    const Order = mongoose.models.Order;
    let lastSeq = 0;
    
    if (Order) {
      const latestOrder = await Order.findOne().sort({ createdAt: -1 });
      if (latestOrder && latestOrder.orderNumber) {
        // Extract numbers from the end of orderNumber
        const matches = latestOrder.orderNumber.match(/\d+$/);
        if (matches && matches[0]) {
          lastSeq = parseInt(matches[0], 10);
        }
      }
    }
    
    // Create the counter with the last known sequence
    await Counter.create({ _id: counterKey, sequence: lastSeq });
  }

  // Atomic increment — race condition free
  counter = await Counter.findByIdAndUpdate(
    counterKey,
    { $inc: { sequence: 1 } },
    { new: true, upsert: true },
  );

  const seq = String(counter!.sequence).padStart(4, "0");

  return `GH-${yy}${mm}${dd}-${seq}`;
}