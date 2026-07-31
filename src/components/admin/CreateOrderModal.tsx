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
  Segmented,
  Space,
  Typography,
  Flex,
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
} from "@ant-design/icons";
import { ChannelSource, CHANNEL_LABELS } from "@/types/order";
import { createAdminManualOrder } from "@/actions/order";
import { formatPrice } from "@/lib/priceUtils";

const { Text, Title } = Typography;

interface ProductOption {
  _id: string;
  title: string;
  thumbnail?: string;
  colors?: string[];
  sizes?: string[];
  salePrice?: number;
  regularPrice: number;
}

export interface AdminOrderItem {
  productId: string;
  color?: string;
  size?: string;
  quantity: number;
}

export function CreateOrderModal({
  products,
}: {
  products: ProductOption[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"ai" | "manual">("ai");
  const [aiText, setAiText] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [channelSource, setChannelSource] = useState<ChannelSource>("facebook_page");

  // Multi-Item Cart State
  const [orderItems, setOrderItems] = useState<AdminOrderItem[]>([
    {
      productId: products[0]?._id || "",
      color: products[0]?.colors?.[0] || "",
      size: products[0]?.sizes?.[0] || "",
      quantity: 1,
    },
  ]);

  // Customer State
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [isGift, setIsGift] = useState(false);
  const [receiverName, setReceiverName] = useState("");
  const [receiverPhone, setReceiverPhone] = useState("");

  // Structured Address State: এরিয়া, উপজেলা, জেলা
  const [addressLine1, setAddressLine1] = useState("");
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [deliveryArea, setDeliveryArea] = useState<"dhaka" | "outside">("dhaka");

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "mobile">("cod");
  const [paymentProvider, setPaymentProvider] = useState<"bkash" | "nagad" | "rocket">("bkash");
  const [senderNumber, setSenderNumber] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [customerNotes, setCustomerNotes] = useState("");

  // Subtotal & Total Calculations
  const subtotal = orderItems.reduce((sum, item) => {
    const prod = products.find((p) => p._id === item.productId);
    const price = prod ? prod.salePrice || prod.regularPrice : 0;
    return sum + price * item.quantity;
  }, 0);

  const shippingCost = deliveryArea === "dhaka" ? 70 : 130;
  const total = subtotal + shippingCost;

  // Add Item to Order Cart (Prepends to Top)
  const handleAddItem = () => {
    const defaultProduct = products[0];
    setOrderItems((prev) => [
      {
        productId: defaultProduct?._id || "",
        color: defaultProduct?.colors?.[0] || "",
        size: defaultProduct?.sizes?.[0] || "",
        quantity: 1,
      },
      ...prev,
    ]);
  };

  // Remove Item from Order Cart
  const handleRemoveItem = (index: number) => {
    if (orderItems.length === 1) {
      toast.error("কমপক্ষে একটি প্রোডাক্ট অর্ডারে থাকতে হবে");
      return;
    }
    setOrderItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Update Item Property
  const handleUpdateItem = (
    index: number,
    field: keyof AdminOrderItem,
    value: any,
  ) => {
    setOrderItems((prev) => {
      const updated = [...prev];
      const target = { ...updated[index], [field]: value };

      if (field === "productId") {
        const prod = products.find((p) => p._id === value);
        target.color = prod?.colors?.[0] || "";
        target.size = prod?.sizes?.[0] || "";
      }

      updated[index] = target;
      return updated;
    });
  };

  const handleAiParse = async () => {
    if (!aiText.trim()) {
      toast.error("অনুগ্রহ করে চ্যাট টেক্সট পেস্ট করুন");
      return;
    }

    setIsParsing(true);
    try {
      const res = await fetch("/api/admin/orders/ai-parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawText: aiText }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "পার্স করতে ব্যর্থ হয়েছে");
      }

      const data = json.data;
      if (data.name) setName(data.name);
      if (data.phone) setPhone(data.phone);
      if (data.isGift !== undefined) setIsGift(Boolean(data.isGift));
      if (data.receiverName) setReceiverName(data.receiverName);
      if (data.receiverPhone) setReceiverPhone(data.receiverPhone);

      // Structured Address
      if (data.addressLine1) setAddressLine1(data.addressLine1);
      if (data.city) setCity(data.city);
      if (data.district) setDistrict(data.district);
      if (data.deliveryArea) setDeliveryArea(data.deliveryArea);

      // Payment
      if (data.paymentMethod) setPaymentMethod(data.paymentMethod);
      if (data.transactionId) setTransactionId(data.transactionId);
      if (data.customerNotes) setCustomerNotes(data.customerNotes);

      // Multi-Item Population
      if (Array.isArray(data.items) && data.items.length > 0) {
        const parsedOrderItems: AdminOrderItem[] = data.items.map((it: any) => {
          const prod = products.find((p) => p._id === it.productId) || products[0];
          return {
            productId: prod?._id || "",
            color: it.color || prod?.colors?.[0] || "",
            size: it.size || prod?.sizes?.[0] || "",
            quantity: Math.max(1, Number(it.quantity) || 1),
          };
        });
        setOrderItems(parsedOrderItems);
      }

      toast.success("✨ Gemini AI পার্স সম্পন্ন হয়েছে! তথ্যগুলো চেক করে সাবমিট করুন।");
      setActiveTab("manual");
    } catch (err: any) {
      toast.error(err.message || "AI Parse ব্যর্থ হয়েছে");
    } finally {
      setIsParsing(false);
    }
  };

  const handleSubmit = async () => {
    if (!name.trim()) return toast.error("কাস্টমার নাম দিন");
    if (!phone.trim()) return toast.error("ফোন নাম্বার দিন");
    if (!addressLine1.trim()) return toast.error("এরিয়া / ঠিকানা দিন");
    if (orderItems.length === 0) return toast.error("কমপক্ষে একটি প্রোডাক্ট যোগ করুন");

    setIsSubmitting(true);
    try {
      const res = await createAdminManualOrder({
        name,
        phone,
        isGift,
        receiverName: isGift ? receiverName : undefined,
        receiverPhone: isGift ? receiverPhone : undefined,
        addressLine1,
        city: city || undefined,
        district: district || (deliveryArea === "dhaka" ? "Dhaka" : "Outside Dhaka"),
        deliveryArea,
        paymentMethod,
        paymentProvider: paymentMethod === "mobile" ? paymentProvider : undefined,
        senderNumber: paymentMethod === "mobile" ? senderNumber : undefined,
        transactionId: paymentMethod === "mobile" ? transactionId : undefined,
        customerNotes,
        channelSource,
        items: orderItems,
      });

      if (res.error) {
        toast.error(res.error);
      } else if (res.orderNumber) {
        toast.success(`অর্ডার #${res.orderNumber} সফলভাবে তৈরি হয়েছে!`);
        setOpen(false);
        router.refresh();
      }
    } catch (err: any) {
      toast.error("অর্ডার তৈরি করতে সমস্যা হয়েছে");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Antd Trigger Button */}
      <Button
        type="primary"
        size="large"
        icon={<ThunderboltOutlined />}
        onClick={() => setOpen(true)}
        style={{ fontWeight: 700, borderRadius: 10 }}
      >
        + Create / 🤖 AI Order
      </Button>

      {/* ✅ Pure Ant Design Modal */}
      <Modal
        open={open}
        onCancel={() => setOpen(false)}
        footer={null}
        width={920}
        centered
        style={{ borderRadius: 20, maxWidth: "95vw" }}
        title={
          <Flex align="center" gap={8}>
            <ShoppingCartOutlined style={{ fontSize: 22, color: "#1677ff" }} />
            <Title level={4} style={{ margin: 0, fontWeight: 900 }}>
              Create New Order (Multi-Cart & AI)
            </Title>
          </Flex>
        }
      >
        <div className="space-y-5 pt-2">
          {/* Segmented Tab Switcher */}
          <Segmented
            block
            value={activeTab}
            onChange={(val) => setActiveTab(val as "ai" | "manual")}
            options={[
              {
                label: (
                  <div style={{ padding: "4px 8px", fontWeight: 700 }}>
                    🤖 AI Smart Order (Gemini Pro)
                  </div>
                ),
                value: "ai",
              },
              {
                label: (
                  <div style={{ padding: "4px 8px", fontWeight: 700 }}>
                    📝 Manual Cart Form ({orderItems.length})
                  </div>
                ),
                value: "manual",
              },
            ]}
          />

          {/* TAB 1: AI PARSE */}
          {activeTab === "ai" && (
            <div className="space-y-4 pt-2">
              <div>
                <Text strong style={{ fontSize: "12px", display: "block", marginBottom: 6 }}>
                  ১. সেলস চ্যানেল চয়ন করুন
                </Text>
                <Select
                  value={channelSource}
                  onChange={(val) => setChannelSource(val as ChannelSource)}
                  style={{ width: "100%", height: 42 }}
                  options={Object.entries(CHANNEL_LABELS).map(([k, v]) => ({
                    value: k,
                    label: v,
                  }))}
                />
              </div>

              <div>
                <Flex align="center" justify="space-between" style={{ marginBottom: 6 }}>
                  <Text strong style={{ fontSize: "12px" }}>
                    ২. কাস্টমারের চ্যাট বা মেসেজ পেস্ট করুন
                  </Text>
                  <Tag color="blue" style={{ margin: 0, fontWeight: 700 }}>
                    Powered by Gemini 1.5 Flash
                  </Tag>
                </Flex>
                <Input.TextArea
                  value={aiText}
                  onChange={(e) => setAiText(e.target.value)}
                  placeholder="উদাহরণ:&#10;নাম : শামীম&#10;মোবাইল : 01754154374&#10;ঠিকানা : পানিশাইল বাজার&#10;উপজেলা : সিংগার&#10;জেলা : মানিকগঞ্জ&#10;প্রোডাক্ট ১ : JBL M3 Speaker (Red) - ২ পিস&#10;প্রোডাক্ট ২ : T500 Smartwatch (Black) - ১ পিস"
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
          )}

          {/* TAB 2: MANUAL FORM */}
          {activeTab === "manual" && (
            <div className="space-y-5 pt-2">
              {/* Sales Channel */}
              <div>
                <Text strong style={{ fontSize: "12px", display: "block", marginBottom: 6 }}>
                  সেলস চ্যানেল (Sales Channel)
                </Text>
                <Select
                  value={channelSource}
                  onChange={(val) => setChannelSource(val as ChannelSource)}
                  style={{ width: "100%", height: 42 }}
                  options={Object.entries(CHANNEL_LABELS).map(([k, v]) => ({
                    value: k,
                    label: v,
                  }))}
                />
              </div>

              {/* Product Cart Section */}
              <div className="space-y-3">
                <Flex align="center" justify="space-between">
                  <Text strong style={{ fontSize: "13px" }}>
                    <ShoppingCartOutlined style={{ color: "#1677ff" }} /> কার্ট প্রোডাক্ট তালিকা ({orderItems.length})
                  </Text>
                  <Button
                    type="dashed"
                    size="small"
                    icon={<PlusOutlined />}
                    onClick={handleAddItem}
                    style={{ fontWeight: 700 }}
                  >
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
                      <Card
                        key={idx}
                        style={{ borderRadius: 14, border: "1px solid #e2e8f0" }}
                        styles={{ body: { padding: 12 } }}
                      >
                        <Flex gap={12} align="center" wrap="wrap">
                          {/* Thumbnail */}
                          <div
                            style={{
                              width: 64,
                              height: 64,
                              borderRadius: 10,
                              overflow: "hidden",
                              background: "#f1f5f9",
                              position: "relative",
                              flexShrink: 0,
                            }}
                          >
                            {prod?.thumbnail ? (
                              <Image
                                src={prod.thumbnail}
                                alt={prod.title}
                                fill
                                className="object-cover"
                                sizes="64px"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-400 font-bold">
                                No Image
                              </div>
                            )}
                          </div>

                          {/* Product Info & Select */}
                          <div style={{ flex: 1, minWidth: 220 }} className="space-y-2">
                            <Select
                              value={item.productId}
                              onChange={(val) => handleUpdateItem(idx, "productId", val)}
                              style={{ width: "100%" }}
                              options={products.map((p) => ({
                                value: p._id,
                                label: `${p.title} — ${formatPrice(p.salePrice || p.regularPrice)}`,
                              }))}
                            />

                            {/* Colors */}
                            {hasColors && (
                              <Flex align="center" gap={6} wrap="wrap">
                                <Text type="secondary" style={{ fontSize: "11px", fontWeight: 700 }}>
                                  কালার:
                                </Text>
                                {prod.colors!.map((c) => {
                                  const isSelected = item.color?.toLowerCase() === c.toLowerCase();
                                  return (
                                    <Tag
                                      key={c}
                                      color={isSelected ? "blue" : "default"}
                                      onClick={() => handleUpdateItem(idx, "color", c)}
                                      style={{ cursor: "pointer", fontWeight: 700, borderRadius: 6 }}
                                    >
                                      {isSelected && <CheckOutlined />} {c}
                                    </Tag>
                                  );
                                })}
                              </Flex>
                            )}
                          </div>

                          {/* Qty & Price */}
                          <Flex align="center" gap={12} style={{ marginLeft: "auto" }}>
                            <div>
                              <Text type="secondary" style={{ fontSize: "10px", display: "block" }}>
                                {formatPrice(price)} x {item.quantity}
                              </Text>
                              <Text strong style={{ fontSize: "14px" }}>
                                {formatPrice(itemTotal)}
                              </Text>
                            </div>

                            <Space>
                              <Button
                                size="small"
                                onClick={() =>
                                  handleUpdateItem(idx, "quantity", Math.max(1, item.quantity - 1))
                                }
                              >
                                -
                              </Button>
                              <Text strong>{item.quantity}</Text>
                              <Button
                                size="small"
                                onClick={() => handleUpdateItem(idx, "quantity", item.quantity + 1)}
                              >
                                +
                              </Button>
                            </Space>

                            {orderItems.length > 1 && (
                              <Button
                                danger
                                type="text"
                                icon={<DeleteOutlined />}
                                onClick={() => handleRemoveItem(idx)}
                              />
                            )}
                          </Flex>
                        </Flex>
                      </Card>
                    );
                  })}
                </div>
              </div>

              {/* Customer Info */}
              <div className="space-y-2">
                <Text strong style={{ fontSize: "12px" }}>
                  <UserOutlined style={{ color: "#1677ff" }} /> কাস্টমার তথ্য
                </Text>
                <div className="grid sm:grid-cols-2 gap-3">
                  <Input
                    placeholder="কাস্টমার নাম *"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={{ height: 40, borderRadius: 10 }}
                  />
                  <Input
                    placeholder="ফোন নাম্বার *"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    style={{ height: 40, borderRadius: 10 }}
                  />
                </div>

                <Checkbox checked={isGift} onChange={(e) => setIsGift(e.target.checked)}>
                  <span style={{ fontSize: "12px", fontWeight: 700 }}>
                    <GiftOutlined style={{ color: "#eb2f96" }} /> এটি একটি উপহার অর্ডার (Gift Order)
                  </span>
                </Checkbox>

                {isGift && (
                  <div className="grid sm:grid-cols-2 gap-3 bg-pink-50/50 p-3 rounded-xl border border-pink-100">
                    <Input
                      placeholder="উপহার প্রাপকের নাম"
                      value={receiverName}
                      onChange={(e) => setReceiverName(e.target.value)}
                    />
                    <Input
                      placeholder="উপহার প্রাপকের ফোন"
                      value={receiverPhone}
                      onChange={(e) => setReceiverPhone(e.target.value)}
                    />
                  </div>
                )}
              </div>

              {/* Delivery Address */}
              <div className="space-y-2">
                <Text strong style={{ fontSize: "12px" }}>
                  <EnvironmentOutlined style={{ color: "#1677ff" }} /> ডেলিভারি ঠিকানা (এরিয়া, উপজেলা, জেলা)
                </Text>
                <div className="grid sm:grid-cols-3 gap-2">
                  <Input
                    placeholder="এরিয়া / গ্রাম *"
                    value={addressLine1}
                    onChange={(e) => setAddressLine1(e.target.value)}
                    style={{ height: 40, borderRadius: 10 }}
                  />
                  <Input
                    placeholder="উপজেলা / থানা"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    style={{ height: 40, borderRadius: 10 }}
                  />
                  <Input
                    placeholder="জেলা"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    style={{ height: 40, borderRadius: 10 }}
                  />
                </div>

                <Radio.Group
                  value={deliveryArea}
                  onChange={(e) => setDeliveryArea(e.target.value)}
                  style={{ width: "100%" }}
                >
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <Radio.Button value="dhaka" style={{ textAlign: "center", borderRadius: 8 }}>
                      Inside Dhaka (ISD) — ৳70
                    </Radio.Button>
                    <Radio.Button value="outside" style={{ textAlign: "center", borderRadius: 8 }}>
                      Outside Dhaka (OSD) — ৳130
                    </Radio.Button>
                  </div>
                </Radio.Group>
              </div>

              {/* Payment Info */}
              <div className="space-y-2">
                <Text strong style={{ fontSize: "12px" }}>
                  <CreditCardOutlined style={{ color: "#1677ff" }} /> পেমেন্ট তথ্য
                </Text>
                <Radio.Group
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  style={{ width: "100%" }}
                >
                  <div className="grid grid-cols-2 gap-2">
                    <Radio.Button value="cod" style={{ textAlign: "center", borderRadius: 8 }}>
                      Cash on Delivery (COD)
                    </Radio.Button>
                    <Radio.Button value="mobile" style={{ textAlign: "center", borderRadius: 8 }}>
                      Mobile Banking (bKash/Nagad)
                    </Radio.Button>
                  </div>
                </Radio.Group>

                {paymentMethod === "mobile" && (
                  <div className="grid sm:grid-cols-3 gap-2 bg-slate-50 p-3 rounded-xl">
                    <Select
                      value={paymentProvider}
                      onChange={setPaymentProvider}
                      options={[
                        { value: "bkash", label: "bKash" },
                        { value: "nagad", label: "Nagad" },
                        { value: "rocket", label: "Rocket" },
                      ]}
                    />
                    <Input
                      placeholder="সেন্ডার ফোন"
                      value={senderNumber}
                      onChange={(e) => setSenderNumber(e.target.value)}
                    />
                    <Input
                      placeholder="TrxID"
                      value={transactionId}
                      onChange={(e) => setTransactionId(e.target.value)}
                    />
                  </div>
                )}
              </div>

              {/* Summary Footer Bar */}
              <Card style={{ background: "#0f172a", borderRadius: 16 }} styles={{ body: { padding: 16 } }}>
                <Flex align="center" justify="space-between" wrap="wrap" gap={12}>
                  <div>
                    <Text style={{ color: "#94a3b8", fontSize: "11px", display: "block" }}>
                      মোট প্রোডাক্ট: {orderItems.reduce((s, i) => s + i.quantity, 0)} টি (সাবটোটাল: {formatPrice(subtotal)} + শিপিং: {formatPrice(shippingCost)})
                    </Text>
                    <Title level={3} style={{ color: "#ffffff", margin: 0, fontWeight: 900 }}>
                      {formatPrice(total)}
                    </Title>
                  </div>

                  <Button
                    type="primary"
                    size="large"
                    loading={isSubmitting}
                    icon={<PrinterOutlined />}
                    onClick={handleSubmit}
                    style={{ fontWeight: 900, height: 46, borderRadius: 10, background: "#ffffff", color: "#0f172a" }}
                  >
                    Create Order & Invoice
                  </Button>
                </Flex>
              </Card>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}
