// src/actions/finance.ts
"use server";

import { auth } from "@/auth";
import { dbConnect } from "@/lib/db";
import Order from "@/models/Order";
import Product from "@/models/Product";
import Expense from "@/models/Expense";

export interface FinancialSummary {
  dateRangeLabel: string;
  totalOrdersCount: number;
  deliveredOrdersCount: number;
  totalRevenue: number;
  totalCogs: number;
  baseDeliveryCharges: number;
  courierCodFees: number;
  totalCourierExpenses: number;
  totalAdExpenses: number;
  totalOtherExpenses: number;
  totalLoggedExpenses: number;
  grossProfit: number;
  netProfit: number;
  profitMarginPercent: number;
  roiPercent: number;
}

export interface WinningProductStat {
  productId: string;
  title: string;
  sku: string;
  thumbnail: string;
  costPrice: number;
  sellingPrice: number;
  unitsSold: number;
  revenue: number;
  cogs: number;
  attributedAdSpend: number;
  estimatedDeliveryShare: number;
  netProfit: number;
  roiPercent: number;
  marginPercent: number;
  universalScore: number;
  isWinner: boolean;
}

export async function getFinancialAnalyticsAction(range: {
  startDate?: string;
  endDate?: string;
  statusFilter?: "delivered_only" | "all_orders";
  sortBy?: "universal" | "profit" | "roi" | "sales";
}) {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return { error: "Unauthorized" };
  }

  await dbConnect();

  // 1. Date Filter Query
  const orderQuery: any = {};
  const expenseQuery: any = {};

  if (range?.startDate || range?.endDate) {
    orderQuery.createdAt = {};
    expenseQuery.date = {};

    if (range.startDate) {
      const start = new Date(range.startDate);
      orderQuery.createdAt.$gte = start;
      expenseQuery.date.$gte = start;
    }
    if (range.endDate) {
      const end = new Date(range.endDate);
      end.setHours(23, 59, 59, 999);
      orderQuery.createdAt.$lte = end;
      expenseQuery.date.$lte = end;
    }
  }

  const isDeliveredOnly = range?.statusFilter !== "all_orders";
  if (isDeliveredOnly) {
    orderQuery.orderStatus = "delivered";
  } else {
    orderQuery.orderStatus = { $nin: ["cancelled", "returned"] };
  }

  // 2. Fetch Orders & Expenses
  const orders = await Order.find(orderQuery).lean();
  const expenses = await Expense.find(expenseQuery).lean();

  // Fetch all products for costPrice & sellingPrice lookup
  const products = await Product.find({}).select("_id title sku thumbnail costPrice salePrice regularPrice targetAdCost").lean();
  const productCostMap = new Map<string, { title: string; sku: string; thumbnail: string; costPrice: number; sellingPrice: number; targetAdCost: number }>();
  const productTitleMap = new Map<string, string>();

  products.forEach((p: any) => {
    const idStr = String(p._id);
    productCostMap.set(idStr, {
      title: p.title,
      sku: p.sku,
      thumbnail: p.thumbnail || "/logo.png",
      costPrice: Number(p.costPrice || 0),
      sellingPrice: Number(p.salePrice || p.regularPrice || 0),
      targetAdCost: Number(p.targetAdCost || 0),
    });
    if (p.title) productTitleMap.set(p.title.trim().toLowerCase(), idStr);
    if (p.sku) productTitleMap.set(p.sku.trim().toLowerCase(), idStr);
  });

  // 3. Compute Financial Totals
  let totalRevenue = 0;
  let totalCogs = 0;
  let baseDeliveryCharges = 0;
  let courierCodFees = 0;
  
  // Map to track per-product sales metrics
  const productSalesMap = new Map<string, { unitsSold: number; revenue: number; cogs: number; estDelivery: number }>();

  orders.forEach((order: any) => {
    const orderTotal = Number(order.total || 0);
    const advance = Number(order.advancePaid || 0);
    const codAmount = Math.max(0, orderTotal - advance);
    const shipping = Number(order.shippingCost || 0);

    // 1% COD Fee
    const codFee = order.courierCodFee !== undefined && order.courierCodFee >= 0 
      ? Number(order.courierCodFee) 
      : Math.round(codAmount * 0.01 * 100) / 100;

    totalRevenue += orderTotal;
    baseDeliveryCharges += shipping;
    courierCodFees += codFee;

    // Calculate COGS per item
    let orderCogs = 0;
    const items = order.items || [];
    items.forEach((item: any) => {
      let pId = "";
      const rawTitle = (item.productTitle || "").trim().toLowerCase();

      // Title/SKU Resolution Logic
      if (rawTitle) {
        if (productTitleMap.has(rawTitle)) {
          pId = productTitleMap.get(rawTitle)!;
        } else {
          for (const [t, id] of productTitleMap.entries()) {
            if (t.includes("m3-t") && rawTitle.includes("m3-t")) {
              pId = id;
              break;
            } else if (!rawTitle.includes("m3-t") && !t.includes("m3-t") && (t.includes(rawTitle) || rawTitle.includes(t))) {
              pId = id;
              break;
            }
          }
        }
      }

      if (!pId && item.productSku && productTitleMap.has(item.productSku.trim().toLowerCase())) {
        pId = productTitleMap.get(item.productSku.trim().toLowerCase())!;
      }

      if (!pId) {
        pId = String(item.product || item.productId || "");
      }

      const pInfo = productCostMap.get(pId);
      const unitCost = pInfo?.costPrice || 0;
      const qty = Number(item.itemQuantity || item.quantity || 1);
      const itemCogs = unitCost * qty;
      const itemRevenue = Number(item.unitPrice || 0) * qty;

      orderCogs += itemCogs;

      // Track product stats
      if (pId && pInfo) {
        const existing = productSalesMap.get(pId) || { unitsSold: 0, revenue: 0, cogs: 0, estDelivery: 0 };
        existing.unitsSold += qty;
        existing.revenue += itemRevenue;
        existing.cogs += itemCogs;
        // Estimate delivery share per item
        existing.estDelivery += (shipping + codFee) / Math.max(1, items.length);
        productSalesMap.set(pId, existing);
      }
    });

    totalCogs += orderCogs;
  });

  // Expenses totals
  let totalAdExpenses = 0;
  let totalOtherExpenses = 0;
  const productAdSpendMap = new Map<string, number>();

  expenses.forEach((exp: any) => {
    const amt = Number(exp.amount || 0);
    if (exp.category === "ad_spend") {
      totalAdExpenses += amt;
      if (exp.productId) {
        const pId = String(exp.productId);
        productAdSpendMap.set(pId, (productAdSpendMap.get(pId) || 0) + amt);
      }
    } else {
      totalOtherExpenses += amt;
    }
  });

  const totalCourierExpenses = baseDeliveryCharges + courierCodFees;
  const totalLoggedExpenses = totalAdExpenses + totalOtherExpenses;
  const grossProfit = totalRevenue - totalCogs;
  const netProfit = totalRevenue - totalCogs - totalCourierExpenses - totalLoggedExpenses;

  const profitMarginPercent = totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 100 * 10) / 10 : 0;
  const totalInvestment = totalCogs + totalCourierExpenses + totalLoggedExpenses;
  const roiPercent = totalInvestment > 0 ? Math.round((netProfit / totalInvestment) * 100 * 10) / 10 : 0;

  const summary: FinancialSummary = {
    dateRangeLabel: range?.startDate ? `${range.startDate} to ${range.endDate || "Today"}` : "All Time",
    totalOrdersCount: orders.length,
    deliveredOrdersCount: orders.length,
    totalRevenue,
    totalCogs,
    baseDeliveryCharges,
    courierCodFees,
    totalCourierExpenses,
    totalAdExpenses,
    totalOtherExpenses,
    totalLoggedExpenses,
    grossProfit,
    netProfit,
    profitMarginPercent,
    roiPercent,
  };

  // 4. Winning Products Scorecard (Include all catalog products)
  const winningProducts: WinningProductStat[] = [];

  products.forEach((p: any) => {
    const pId = String(p._id);
    const pInfo = productCostMap.get(pId);
    if (!pInfo) return;

    const sales = productSalesMap.get(pId) || { unitsSold: 0, revenue: 0, cogs: 0, estDelivery: 0 };

    // Attributed ad spend from expense table OR targetAdCost estimation
    const loggedAd = productAdSpendMap.get(pId) || 0;
    const estTargetAd = loggedAd > 0 ? loggedAd : (pInfo.targetAdCost * sales.unitsSold);
    const attributedAd = estTargetAd;

    const prodNetProfit = sales.revenue - sales.cogs - attributedAd;
    const prodMargin = sales.revenue > 0 ? (prodNetProfit / sales.revenue) * 100 : 0;
    const prodInv = sales.cogs + attributedAd;
    const prodRoi = prodInv > 0 ? (prodNetProfit / prodInv) * 100 : 0;

    // Universal Score balances Profit, Sales Volume & ROI %
    const universalScore = sales.unitsSold > 0 
      ? (prodNetProfit > 0 
          ? Math.round(prodNetProfit * Math.sqrt(sales.unitsSold) * (1 + Math.max(0, prodRoi) / 100))
          : prodNetProfit)
      : -999999;

    winningProducts.push({
      productId: pId,
      title: pInfo.title,
      sku: pInfo.sku,
      thumbnail: pInfo.thumbnail,
      costPrice: pInfo.costPrice,
      sellingPrice: pInfo.sellingPrice,
      unitsSold: sales.unitsSold,
      revenue: sales.revenue,
      cogs: sales.cogs,
      attributedAdSpend: attributedAd,
      estimatedDeliveryShare: Math.round(sales.estDelivery),
      netProfit: prodNetProfit,
      roiPercent: Math.round(prodRoi * 10) / 10,
      marginPercent: Math.round(prodMargin * 10) / 10,
      universalScore,
      isWinner: false,
    });
  });

  // Sort winning products dynamically based on user selected filter
  const sortMode = range?.sortBy || "universal";
  winningProducts.sort((a, b) => {
    if (sortMode === "profit") return b.netProfit - a.netProfit;
    if (sortMode === "roi") return b.roiPercent - a.roiPercent;
    if (sortMode === "sales") return b.unitsSold - a.unitsSold;
    // Default: Universal Score
    return b.universalScore - a.universalScore;
  });

  if (winningProducts.length > 0 && (winningProducts[0].netProfit > 0 || winningProducts[0].unitsSold > 0)) {
    winningProducts[0].isWinner = true;
  }

  return { summary, winningProducts };
}
