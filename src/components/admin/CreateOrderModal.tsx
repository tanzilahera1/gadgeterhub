// src/components/admin/CreateOrderModal.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import {
  Modal,
  Button,
  Input,
  Select,
  Radio,
  Checkbox,
  Card,
  Tag,
  Tabs,
  Space,
  Typography,
  Flex,
  Tooltip,
  InputNumber,
} from "antd";
import {
  ThunderboltOutlined,
  PlusOutlined,
  ShoppingCartOutlined,
  UserOutlined,
  EnvironmentOutlined,
  CreditCardOutlined,
  GiftOutlined,
  DeleteOutlined,
  PrinterOutlined,
  CheckOutlined,
  EditOutlined,
  UndoOutlined,
} from "@ant-design/icons";
import { ChannelSource, CHANNEL_LABELS } from "@/types/order";
import {
  createAdminManualOrder,
  lookupCustomerHistory,
} from "@/actions/order";
import { formatPrice } from "@/lib/priceUtils";
import {
  calculateShippingCost,
  getWeightTierLabel,
  DeliveryZone,
} from "@/lib/shipping";

const { Text, Title } = Typography;

interface ProductOption {
  _id: string;
  title: string;
  thumbnail?: string;
  colors?: string[];
  sizes?: string[];
  salePrice?: number;
  regularPrice: number;
  weight?: number;
}

export interface AdminOrderItem {
  productId: string;
  productTitle?: string;
  color?: string;
  size?: string;
  quantity: number;
  unitPrice?: number;
}

export function CreateOrderModal({ products }: { products: ProductOption[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"ai" | "manual">("ai");
  const [aiText, setAiText] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [channelSource, setChannelSource] = useState<ChannelSource>("facebook_page");
  const [orderItems, setOrderItems] = useState<AdminOrderItem[]>([
    {
      productId: products[0]?._id || "",
      productTitle: products[0]?.title || "",
      color: products[0]?.colors?.[0] || "",
      size: products[0]?.sizes?.[0] || "",
      quantity: 1,
    },
  ]);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [isGift, setIsGift] = useState(false);
  const [receiverName, setReceiverName] = useState("");
  const [receiverPhone, setReceiverPhone] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [deliveryArea, setDeliveryArea] = useState<DeliveryZone>("dhaka");
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "mobile">("cod");
  const [paymentProvider, setPaymentProvider] = useState<"bkash" | "nagad" | "rocket">("bkash");
  const [senderNumber, setSenderNumber] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [customerNotes, setCustomerNotes] = useState("");
  const [discount, setDiscount] = useState<number>(0);
  const [vipPrivilege, setVipPrivilege] = useState<number>(0);
  const [advancePaid, setAdvancePaid] = useState<number>(0);

  // Customer History Lookup State
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [customerHistory, setCustomerHistory] = useState<any>(null);

  const handlePhoneLookup = async (val: string) => {
    setPhone(val);
    if (val.trim().length >= 6) {
      const res = await lookupCustomerHistory(val);
      if (res.success && res.history) {
        setCustomerHistory(res.history);
      } else {
        setCustomerHistory(null);
      }
    } else {
      setCustomerHistory(null);
    }
  };

  const handleAutoFillCustomerHistory = () => {
    if (!customerHistory?.lastShipping) return;
    const s = customerHistory.lastShipping;
    if (s.name && !name) setName(s.name);
    if (s.addressLine1) setAddressLine1(s.addressLine1);
    if (s.city) setCity(s.city);
    if (s.district) setDistrict(s.district);
    if (s.deliveryArea) setDeliveryArea(s.deliveryArea as DeliveryZone);
    toast.success("আগের কাস্টমার তথ্য সফলভাবে পূরণ করা হয়েছে!");
  };

  const totalWeightGrams = orderItems.reduce((sum, item) => {
    const prod = products.find((p) => p._id === item.productId);
    const w = prod?.weight || 500;
    return sum + w * item.quantity;
  }, 0);

  const subtotal = orderItems.reduce((sum, item) => {
    const prod = products.find((p) => p._id === item.productId);
    const price = prod ? prod.salePrice || prod.regularPrice : 0;
    return sum + price * item.quantity;
  }, 0);

  const shippingCost = calculateShippingCost(deliveryArea, totalWeightGrams);
  const total = Math.max(0, subtotal + shippingCost - discount - vipPrivilege);
  const codAmount = Math.max(0, total - advancePaid);

  const handleAddItem = () => {
    const defaultProduct = products[0];
    setOrderItems((prev) => [
      {
        productId: defaultProduct?._id || "",
        productTitle: defaultProduct?.title || "",
        color: defaultProduct?.colors?.[0] || "",
        size: defaultProduct?.sizes?.[0] || "",
        quantity: 1,
      },
      ...prev,
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (orderItems.length === 1) { toast.error("কমপক্ষে একটি প্রোডাক্ট অর্ডারে থাকতে হবে"); return; }
    setOrderItems((prev) => prev.filter((_, i) => i !== index));
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleUpdateItem = (index: number, field: keyof AdminOrderItem, value: any) => {
    setOrderItems((prev) => {
      const updated = [...prev];
      const target = { ...updated[index], [field]: value };
      if (field === "productId") {
        const prod = products.find((p) => p._id === value);
        target.productTitle = prod?.title || "";
        target.color = prod?.colors?.[0] || "";
        target.size = prod?.sizes?.[0] || "";
      }
      updated[index] = target;
      return updated;
    });
  };

  const handleAiParse = async () => {
    if (!aiText.trim()) { toast.error("মেসেজ বা চ্যাট টেক্সট পেস্ট করুন"); return; }
    setIsParsing(true);
    try {
      const res = await fetch("/api/admin/orders/ai-parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawText: aiText }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "পার্স করতে ব্যর্থ হয়েছে");
      const data = json.data;
      if (data.name) setName(data.name);
      if (data.phone) {
        handlePhoneLookup(data.phone);
      }
      if (data.addressLine1) setAddressLine1(data.addressLine1);
      if (data.city) setCity(data.city);
      if (data.district) setDistrict(data.district);
      if (data.deliveryArea) setDeliveryArea(data.deliveryArea);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (Array.isArray(data.items) && data.items.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const parsedOrderItems: AdminOrderItem[] = data.items.map((it: any) => {
          const prod = products.find((p) => p._id === it.productId) || products[0];
          return {
            productId: prod?._id || "",
            productTitle: it.productTitle || prod?.title || "",
            color: it.color || prod?.colors?.[0] || "",
            size: it.size || prod?.sizes?.[0] || "",
            quantity: Math.max(1, Number(it.quantity) || 1),
          };
        });
        setOrderItems(parsedOrderItems);
      }
      toast.success("✨ Gemini AI পার্স সম্পন্ন হয়েছে! তথ্যগুলো চেক করে সাবমিট করুন।");
      setActiveTab("manual");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      toast.error(err.message || "AI Parse ব্যর্থ হয়েছে");
    } finally {
      setIsParsing(false);
    }
  };

  const handleSubmit = async () => {
    if (!name.trim()) return toast.error("কাস্টমার নাম দিন");
    if (!phone.trim()) return toast.error("ফোন নাম্বার দিন");
    if (!addressLine1.trim()) return toast.error("এরিয়া / ঠিকানা দিন");
    if (orderItems.length === 0) return toast.error("কমপক্ষে একটি প্রোডাক্ট যোগ করুন");
    setIsSubmitting(true);
    try {
      const res = await createAdminManualOrder({
        name, phone, isGift,
        receiverName: isGift ? receiverName : undefined,
        receiverPhone: isGift ? receiverPhone : undefined,
        addressLine1, city: city || undefined,
        district: district || (deliveryArea === "dhaka" ? "Dhaka" : "Outside Dhaka"),
        deliveryArea, paymentMethod,
        paymentProvider: paymentMethod === "mobile" ? paymentProvider : undefined,
        senderNumber: paymentMethod === "mobile" ? senderNumber : undefined,
        transactionId: paymentMethod === "mobile" ? transactionId : undefined,
        customerNotes, channelSource, items: orderItems,
        discount, vipPrivilege, advancePaid,
      });
      if (res.error) { toast.error(res.error); }
      else if (res.orderNumber) { toast.success(`অর্ডার #${res.orderNumber} সফলভাবে তৈরি হয়েছে!`); setOpen(false); router.refresh(); }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      toast.error("অর্ডার তৈরি করতে সমস্যা হয়েছে");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Reusable Manual Form Content ───────────────────────────────────────────
  const manualFormContent = (
    <div className="space-y-5 pt-2">
      <div>
        <Text strong style={{ fontSize: "12px", display: "block", marginBottom: 6 }}>
          সেলস চ্যানেল (Sales Channel)
        </Text>
        <Select
          value={channelSource}
          onChange={(val) => setChannelSource(val as ChannelSource)}
          style={{ width: "100%", height: 42 }}
          options={Object.entries(CHANNEL_LABELS).map(([k, v]) => ({ value: k, label: v }))}
        />
      </div>

      {customerHistory && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 p-3 rounded-xl space-y-2">
          <Flex align="center" justify="space-between" wrap="wrap" gap={6}>
            <Flex align="center" gap={6}>
              <Tag color="gold" style={{ margin: 0, fontWeight: 900, fontSize: "11px" }}>
                {customerHistory.totalOrders >= 3 ? "🌟 VIP Customer" : customerHistory.totalOrders >= 2 ? "🔁 Repeat Customer" : "✨ Returning Buyer"}
              </Tag>
              <Text strong style={{ fontSize: "12px", color: "#92400e" }}>
                {customerHistory.totalOrders}টি অর্ডার করেছেন (মোট {formatPrice(customerHistory.totalSpent)})
              </Text>
            </Flex>
            <Button
              size="small"
              type="primary"
              icon={<CheckOutlined />}
              onClick={handleAutoFillCustomerHistory}
              style={{ fontWeight: 700, borderRadius: 6, background: "#d97706", borderColor: "#d97706" }}
            >
              📋 Auto-Fill Past Address
            </Button>
          </Flex>
        </div>
      )}

      <div className="space-y-2">
        <Text strong style={{ fontSize: "12px" }}>
          <UserOutlined style={{ color: "#1677ff" }} /> কাস্টমার তথ্য
        </Text>
        <div className="grid sm:grid-cols-2 gap-3">
          <Input placeholder="মোবাইল নম্বর *" value={phone} onChange={(e) => handlePhoneLookup(e.target.value)} style={{ height: 40, borderRadius: 10 }} />
          <Input placeholder="কাস্টমার নাম *" value={name} onChange={(e) => setName(e.target.value)} style={{ height: 40, borderRadius: 10 }} />
        </div>
        <Checkbox checked={isGift} onChange={(e) => setIsGift(e.target.checked)}>
          <span style={{ fontSize: "12px", fontWeight: 700 }}>
            <GiftOutlined style={{ color: "#eb2f96" }} /> এটি একটি উপহার অর্ডার (Gift Order)
          </span>
        </Checkbox>
        {isGift && (
          <div className="grid sm:grid-cols-2 gap-3 bg-pink-50/50 p-3 rounded-xl border border-pink-100">
            <Input placeholder="উপহার প্রাপকের নাম" value={receiverName} onChange={(e) => setReceiverName(e.target.value)} />
            <Input placeholder="উপহার প্রাপকের ফোন" value={receiverPhone} onChange={(e) => setReceiverPhone(e.target.value)} />
          </div>
        )}
      </div>

      <div className="space-y-3">
        <Flex align="center" justify="space-between" wrap="wrap" gap={8}>
          <Text strong style={{ fontSize: "13px" }}>
            <ShoppingCartOutlined style={{ color: "#1677ff" }} /> কার্ট প্রোডাক্ট ({orderItems.length})
          </Text>
          <Button type="dashed" size="small" icon={<PlusOutlined />} onClick={handleAddItem} style={{ fontWeight: 700 }}>
            + Add Product
          </Button>
        </Flex>
        <div className="space-y-3">
          {orderItems.map((item, idx) => {
            const prod = products.find((p) => p._id === item.productId);
            const price = prod ? prod.salePrice || prod.regularPrice : 0;
            const itemTotal = price * item.quantity;
            const hasColors = prod?.colors && prod.colors.length > 0;
            return (
              <Card key={idx} style={{ borderRadius: 14, border: "1px solid #e2e8f0" }} styles={{ body: { padding: 12 } }}>
                <Flex gap={12} align="center" wrap="wrap">
                  <div style={{ width: 64, height: 64, borderRadius: 10, overflow: "hidden", background: "#f1f5f9", position: "relative", flexShrink: 0 }}>
                    {prod?.thumbnail ? (
                      <Image src={prod.thumbnail} alt={prod.title} fill className="object-cover" sizes="64px" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-400 font-bold">No Image</div>
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 220 }} className="space-y-2.5">
                    <div>
                      <Text type="secondary" style={{ fontSize: "10px", fontWeight: 700, display: "block", marginBottom: 2 }}>
                        📦 ক্যাটালগ প্রোডাক্ট:
                      </Text>
                      <Select
                        value={item.productId}
                        onChange={(val) => handleUpdateItem(idx, "productId", val)}
                        style={{ width: "100%" }}
                        options={products.map((p) => ({ value: p._id, label: `${p.title} — ${formatPrice(p.salePrice || p.regularPrice)}` }))}
                      />
                    </div>
                    <div>
                      <Flex align="center" justify="space-between" style={{ marginBottom: 2 }}>
                        <Text type="secondary" style={{ fontSize: "10px", fontWeight: 700 }}>
                          ✏️ ইনভয়েস/কুরিয়ার টাইটেল (এডিটযোগ্য):
                        </Text>
                        {prod && item.productTitle && item.productTitle !== prod.title && (
                          <Tag color="orange" style={{ margin: 0, fontSize: "10px", borderRadius: 4, padding: "0 4px", fontWeight: 700 }}>
                            কাস্টম টাইটেল
                          </Tag>
                        )}
                      </Flex>
                      <Input
                        value={item.productTitle}
                        onChange={(e) => handleUpdateItem(idx, "productTitle", e.target.value)}
                        suffix={
                          <div style={{ display: "inline-flex", alignItems: "center", visibility: prod && item.productTitle !== prod.title ? "visible" : "hidden" }}>
                            <Tooltip title="মূল ক্যাটালগ টাইটেলে রিসেট করুন">
                              <Button
                                type="text"
                                size="small"
                                icon={<UndoOutlined style={{ color: "#fa8c16", fontSize: "12px" }} />}
                                onClick={() => prod?.title && handleUpdateItem(idx, "productTitle", prod.title)}
                                style={{ padding: 0, height: "auto", minWidth: "auto" }}
                              />
                            </Tooltip>
                          </div>
                        }
                        style={{ borderRadius: 8, fontSize: "12px", fontWeight: 600 }}
                      />
                    </div>
                    <Flex align="center" gap={6} wrap="wrap">
                      <Text type="secondary" style={{ fontSize: "11px", fontWeight: 700 }}>কালার:</Text>
                      {hasColors && prod.colors!.map((c) => {
                        const isSelected = item.color?.toLowerCase() === c.toLowerCase();
                        return (
                          <Tag key={c} color={isSelected ? "blue" : "default"} onClick={() => handleUpdateItem(idx, "color", c)} style={{ cursor: "pointer", fontWeight: 700, borderRadius: 6 }}>
                            {isSelected && <CheckOutlined />} {c}
                          </Tag>
                        );
                      })}
                      <Input
                        placeholder="কাস্টম কালার..."
                        value={item.color || ""}
                        onChange={(e) => handleUpdateItem(idx, "color", e.target.value)}
                        style={{ width: 120, height: 28, fontSize: "11px", borderRadius: 6 }}
                      />
                    </Flex>
                  </div>
                  <Flex align="center" gap={12} style={{ marginLeft: "auto" }}>
                    <div>
                      <Text type="secondary" style={{ fontSize: "10px", display: "block" }}>{formatPrice(price)} x {item.quantity}</Text>
                      <Text strong style={{ fontSize: "14px" }}>{formatPrice(itemTotal)}</Text>
                    </div>
                    <Space>
                      <Button size="small" onClick={() => handleUpdateItem(idx, "quantity", Math.max(1, item.quantity - 1))}>-</Button>
                      <Text strong>{item.quantity}</Text>
                      <Button size="small" onClick={() => handleUpdateItem(idx, "quantity", item.quantity + 1)}>+</Button>
                    </Space>
                    {orderItems.length > 1 && (
                      <Button danger type="text" icon={<DeleteOutlined />} onClick={() => handleRemoveItem(idx)} />
                    )}
                  </Flex>
                </Flex>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Discounts & Advances */}
      <div className="space-y-2 pt-1">
        <Text strong style={{ fontSize: "12px" }}>
          💰 বিশেষ সম্মাননা ছাড় ও অগ্রিম জমা
        </Text>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Text type="secondary" style={{ fontSize: "11px", fontWeight: 700, display: "block", marginBottom: 2 }}>
              🌟 VIP Privilege (বিশেষ সম্মাননা ছাড় ৳):
            </Text>
            <InputNumber
              min={0}
              placeholder="0"
              value={vipPrivilege}
              onChange={(val) => setVipPrivilege(val || 0)}
              style={{ width: "100%", borderRadius: 8 }}
            />
          </div>
          <div>
            <Text type="secondary" style={{ fontSize: "11px", fontWeight: 700, display: "block", marginBottom: 2 }}>
              💳 অগ্রিম পরিশোধ (যদি বিকাশ/নগদে আগে দেয় ৳):
            </Text>
            <InputNumber
              min={0}
              placeholder="0"
              value={advancePaid}
              onChange={(val) => setAdvancePaid(val || 0)}
              style={{ width: "100%", borderRadius: 8 }}
            />
          </div>
        </div>
      </div>

      {/* Delivery Address & Zone */}
      <div className="space-y-2">
        <Flex align="center" justify="space-between">
          <Text strong style={{ fontSize: "12px" }}>
            <EnvironmentOutlined style={{ color: "#1677ff" }} /> ডেলিভারি ঠিকানা ও জোন
          </Text>
          <Text type="secondary" style={{ fontSize: "11px", fontWeight: 700 }}>
            ওজন: {totalWeightGrams}g ({getWeightTierLabel(totalWeightGrams)})
          </Text>
        </Flex>
        <div className="grid sm:grid-cols-3 gap-2">
          <Input placeholder="এরিয়া / গ্রাম *" value={addressLine1} onChange={(e) => setAddressLine1(e.target.value)} style={{ height: 40, borderRadius: 10 }} />
          <Input placeholder="উপজেলা / থানা" value={city} onChange={(e) => setCity(e.target.value)} style={{ height: 40, borderRadius: 10 }} />
          <Input placeholder="জেলা" value={district} onChange={(e) => setDistrict(e.target.value)} style={{ height: 40, borderRadius: 10 }} />
        </div>
        <Radio.Group value={deliveryArea} onChange={(e) => setDeliveryArea(e.target.value)} style={{ width: "100%" }}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
            <Radio.Button value="dhaka" style={{ textAlign: "center", borderRadius: 8, fontSize: "11px" }}>
              ISD (Inside Dhaka) — ৳{calculateShippingCost("dhaka", totalWeightGrams)}
            </Radio.Button>
            <Radio.Button value="suburbs" style={{ textAlign: "center", borderRadius: 8, fontSize: "11px" }}>
              SUB (Suburbs) — ৳{calculateShippingCost("suburbs", totalWeightGrams)}
            </Radio.Button>
            <Radio.Button value="outside" style={{ textAlign: "center", borderRadius: 8, fontSize: "11px" }}>
              OSD (Outside Dhaka) — ৳{calculateShippingCost("outside", totalWeightGrams)}
            </Radio.Button>
          </div>
        </Radio.Group>
      </div>

      {/* Payment Info */}
      <div className="space-y-2" style={{ marginTop: 12, paddingBottom: 8 }}>
        <Text strong style={{ fontSize: "12px" }}>
          <CreditCardOutlined style={{ color: "#1677ff" }} /> পেমেন্ট তথ্য
        </Text>
        <Radio.Group value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} style={{ width: "100%" }}>
          <div className="grid grid-cols-2 gap-2">
            <Radio.Button value="cod" style={{ textAlign: "center", borderRadius: 8 }}>Cash on Delivery (COD)</Radio.Button>
            <Radio.Button value="mobile" style={{ textAlign: "center", borderRadius: 8 }}>Mobile Banking (bKash/Nagad)</Radio.Button>
          </div>
        </Radio.Group>
        {paymentMethod === "mobile" && (
          <div className="grid sm:grid-cols-3 gap-2 bg-slate-50 p-3 rounded-xl">
            <Select value={paymentProvider} onChange={setPaymentProvider} options={[{ value: "bkash", label: "bKash" }, { value: "nagad", label: "Nagad" }, { value: "rocket", label: "Rocket" }]} />
            <Input placeholder="সেন্ডার ফোন" value={senderNumber} onChange={(e) => setSenderNumber(e.target.value)} />
            <Input placeholder="TrxID" value={transactionId} onChange={(e) => setTransactionId(e.target.value)} />
          </div>
        )}
      </div>

      {/* Summary Footer */}
      <Card style={{ background: "#0f172a", borderRadius: 16, marginTop: 24 }} styles={{ body: { padding: 16 } }}>
        <div style={{ textAlign: "center" }}>
          <Text style={{ color: "#94a3b8", fontSize: "11px", display: "block", marginBottom: 2 }}>
            Subtotal {formatPrice(subtotal)}
            {vipPrivilege > 0 && ` - VIP Honor ${formatPrice(vipPrivilege)}`}
            {` + Delivery ${formatPrice(shippingCost)}`}
            {advancePaid > 0 && ` - Advance ${formatPrice(advancePaid)}`}
          </Text>
          <Title level={3} style={{ color: "#ffffff", margin: "0 0 4px", fontWeight: 900 }}>
            {formatPrice(codAmount)}
          </Title>
          <Text style={{ color: "#38bdf8", fontSize: "11px", display: "block", marginBottom: 12, fontWeight: 700 }}>
            {advancePaid > 0 ? `(COD কালেকশন মোট: ${formatPrice(codAmount)})` : "(ক্যাশ অন ডেলিভারি মোট)"}
          </Text>
          <Button
            type="primary"
            size="large"
            loading={isSubmitting}
            icon={<PrinterOutlined />}
            onClick={handleSubmit}
            style={{ fontWeight: 900, height: 46, borderRadius: 10, background: "#ffffff", color: "#0f172a", display: "block", width: "100%", maxWidth: 320, margin: "0 auto" }}
          >
            Create Order & Invoice
          </Button>
        </div>
      </Card>
    </div>
  );

  return (
    <>
      <Button
        type="primary"
        size="large"
        icon={<ThunderboltOutlined />}
        onClick={() => setOpen(true)}
        style={{ fontWeight: 700, borderRadius: 10 }}
      >
        + New / 🤖 AI
      </Button>

      <Modal
        open={open}
        onCancel={() => setOpen(false)}
        footer={null}
        width={920}
        centered
        style={{ borderRadius: 20, maxWidth: "95vw" }}
        title={
          <Flex align="center" gap={8}>
            <ShoppingCartOutlined style={{ fontSize: 20, color: "#1677ff" }} />
            <Title level={5} style={{ margin: 0, fontWeight: 900 }}>
              New Order — Multi-Cart & AI
            </Title>
          </Flex>
        }
      >
        <div className="pt-2">
          <Tabs
            activeKey={activeTab}
            onChange={(key) => setActiveTab(key as "ai" | "manual")}
            centered
            size="small"
            items={[
              {
                key: "ai",
                label: <span style={{ fontWeight: 700, fontSize: "12px" }}>🤖 AI Parse</span>,
                children: (
                  <div className="space-y-4 pt-1">
                    <div>
                      <Text strong style={{ fontSize: "12px", display: "block", marginBottom: 6 }}>
                        ১. সেলস চ্যানেল চয়ন করুন
                      </Text>
                      <Select
                        value={channelSource}
                        onChange={(val) => setChannelSource(val as ChannelSource)}
                        style={{ width: "100%", height: 42 }}
                        options={Object.entries(CHANNEL_LABELS).map(([k, v]) => ({ value: k, label: v }))}
                      />
                    </div>
                    <div>
                      <Flex align="center" justify="space-between" style={{ marginBottom: 6 }}>
                        <Text strong style={{ fontSize: "12px" }}>২. কাস্টমারের চ্যাট বা মেসেজ পেস্ট করুন</Text>
                        <Tag color="blue" style={{ margin: 0, fontWeight: 700 }}>Powered by Gemini 1.5 Flash</Tag>
                      </Flex>
                      <Input.TextArea
                        value={aiText}
                        onChange={(e) => setAiText(e.target.value)}
                        placeholder={"উদাহরণ:\nনাম : শামীম\nমোবাইল : 01754154374\nঠিকানা : পানিশাইল বাজার\nউপজেলা : সিংগার\nজেলা : মানিকগঞ্জ\nপ্রোডাক্ট ১ : JBL M3 Speaker (Red) - ২ পিস\nপ্রোডাক্ট ২ : T500 Smartwatch (Black) - ১ পিস"}
                        rows={6}
                        style={{ borderRadius: 12 }}
                      />
                    </div>
                    <Button
                      type="primary"
                      size="large"
                      block
                      loading={isParsing}
                      icon={<ThunderboltOutlined />}
                      onClick={handleAiParse}
                      style={{ fontWeight: 800, height: 46, borderRadius: 12 }}
                    >
                      {isParsing ? "Gemini AI পার্স করছে..." : "✨ Parse with Gemini AI"}
                    </Button>
                  </div>
                ),
              },
              {
                key: "manual",
                label: <span style={{ fontWeight: 700, fontSize: "12px" }}>📝 Manual Form</span>,
                children: manualFormContent,
              },
            ]}
          />
        </div>
      </Modal>
    </>
  );
}
