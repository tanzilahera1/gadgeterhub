// src/actions/expense.ts
"use server";

import { auth } from "@/auth";
import { dbConnect } from "@/lib/db";
import Expense from "@/models/Expense";
import Product from "@/models/Product";
import { revalidatePath } from "next/cache";

export async function createExpenseAction(data: {
  title: string;
  amount: number;
  category: "ad_spend" | "packaging" | "courier_loss" | "salary" | "utility" | "other";
  productId?: string;
  date?: string;
  note?: string;
}) {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return { error: "অনুমতি নেই। শুধুমাত্র এডমিন এক্সেস করতে পারবেন।" };
  }

  if (!data.title || !data.amount || data.amount <= 0) {
    return { error: "সঠিক শিরোনাম এবং খরচের পরিমাণ দিন।" };
  }

  await dbConnect();

  try {
    const expense = await Expense.create({
      title: data.title.trim(),
      amount: Number(data.amount),
      category: data.category || "other",
      productId: data.productId || undefined,
      date: data.date ? new Date(data.date) : new Date(),
      note: data.note?.trim(),
    });

    revalidatePath("/admin/finance");
    return { success: true, expenseId: String(expense._id) };
  } catch (err: any) {
    console.error("Expense creation error:", err);
    return { error: err.message || "খরচ সেভ করতে সমস্যা হয়েছে।" };
  }
}

export async function deleteExpenseAction(id: string) {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return { error: "অনুমতি নেই।" };
  }

  await dbConnect();
  try {
    await Expense.findByIdAndDelete(id);
    revalidatePath("/admin/finance");
    return { success: true };
  } catch (err: any) {
    return { error: "মুছে ফেলতে ব্যর্থ হয়েছে।" };
  }
}

export async function getExpensesAction(filters?: {
  startDate?: string;
  endDate?: string;
  category?: string;
}) {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return { error: "Unauthorized" };
  }

  await dbConnect();

  const query: any = {};
  if (filters?.startDate || filters?.endDate) {
    query.date = {};
    if (filters.startDate) query.date.$gte = new Date(filters.startDate);
    if (filters.endDate) {
      const end = new Date(filters.endDate);
      end.setHours(23, 59, 59, 999);
      query.date.$lte = end;
    }
  }

  if (filters?.category && filters.category !== "all") {
    query.category = filters.category;
  }

  const rawExpenses = await Expense.find(query)
    .populate({ path: "productId", select: "title thumbnail sku costPrice targetAdCost", model: Product })
    .sort({ date: -1 })
    .lean();

  const expenses = rawExpenses.map((exp: any) => ({
    _id: String(exp._id),
    title: exp.title,
    amount: exp.amount,
    category: exp.category,
    date: exp.date.toISOString(),
    note: exp.note || "",
    product: exp.productId
      ? {
          _id: String(exp.productId._id),
          title: exp.productId.title,
          sku: exp.productId.sku,
          thumbnail: exp.productId.thumbnail,
          costPrice: exp.productId.costPrice || 0,
          targetAdCost: exp.productId.targetAdCost || 0,
        }
      : null,
  }));

  return { expenses };
}
