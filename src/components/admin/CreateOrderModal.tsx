// src/components/admin/CreateOrderModal.tsx
"use client";

import { useState, useEffect } from "react";
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
  slug?: string;
  sku?: string;
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

export function CreateOrderModal({
  products: initialProducts,
  triggerText = "+ Create / 🤖 AI Order",
  triggerType = "primary",
  triggerClassName,
  triggerBlock = false,
  triggerSize = "middle",
  triggerStyle,
}: {
  products?: ProductOption[];
  triggerText?: string;
  triggerType?: "primary" | "default" | "dashed" | "link" | "text";
  triggerClassName?: string;
  triggerBlock?: boolean;
  triggerSize?: "large" | "middle" | "small";
  triggerStyle?: React.CSSProperties;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [productList, setProductList] = useState<ProductOption[]>(initialProducts || []);
  const [activeTab, setActiveTab] = useState<"ai" | "manual">("ai");
  const [aiText, setAiText] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Helper to get default product (strictly the 1st product in database order)
  const getDefaultProduct = (list: ProductOption[]) => {
    if (!list || list.length === 0) return null;
    return list[0];
  };

  // Auto fetch products if not provided
  useEffect(() => {
    if (open && (!productList || productList.length === 0)) {
      fetch("/api/products")
        .then((res) => res.json())
        .then((data) => {
          const fetched = Array.isArray(data) ? data : data.products || [];
          if (fetched.length > 0) {
            setProductList(fetched);
          }
        })
        .catch((err) => console.error("Error fetching products:", err));
    }
  }, [open, productList]);

  // Keep productList updated if initialProducts changes
  useEffect(() => {
    if (initialProducts && initialProducts.length > 0) {
      setProductList(initialProducts);
    }
  }, [initialProducts]);

  const [channelSource, setChannelSource] = useState<ChannelSource>("facebook_page");
  const [orderItems, setOrderItems] = useState<AdminOrderItem[]>([]);

  // Auto-populate default product when productList is loaded
  useEffect(() => {
    if (productList.length > 0) {
      setOrderItems((prev) => {
        if (prev.length === 0 || (prev.length === 1 && !prev[0].productId)) {
          const def = getDefaultProduct(productList);
          if (def) {
            return [
              {
                productId: def._id,
                productTitle: def.title,
                color: def.colors?.[0] || "",
                size: def.sizes?.[0] || "",
                quantity: 1,
              },
            ];
          }
        }
        return prev;
      });
    }
  }, [productList]);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [isGift, setIsGift] = useState(false);
  const [receiverName, setReceiverName] = useState("");
  const [receiverPhone, setReceiverPhone] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [deliveryArea, setDeliveryArea] = useState<DeliveryZone | "custom">("outside");
  const [customShippingCost, setCustomShippingCost] = useState<number>(0);
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

  const convertBengaliToEnglishDigits = (str: string) => {
    if (!str) return "";
    const bnDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
    return str.replace(/[০-৯]/g, (w) => bnDigits.indexOf(w).toString());
  };

  const handlePhoneLookup = async (val: string) => {
    const cleanVal = convertBengaliToEnglishDigits(val);
    setPhone(cleanVal);
    if (cleanVal.trim().length >= 6) {
      const res = await lookupCustomerHistory(cleanVal);
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
    const prod = productList.find((p) => p._id === item.productId);
    const w = prod?.weight || 500;
    return sum + w * item.quantity;
  }, 0);

  const subtotal = orderItems.reduce((sum, item) => {
    const prod = productList.find((p) => p._id === item.productId);
    const price = prod ? prod.salePrice || prod.regularPrice : 0;
    return sum + price * item.quantity;
  }, 0);

  const shippingCost =
    deliveryArea === "custom"
      ? Math.max(0, customShippingCost)
      : calculateShippingCost(deliveryArea as DeliveryZone, totalWeightGrams);
  const total = Math.max(0, subtotal + shippingCost - discount - vipPrivilege);
  const codAmount = Math.max(0, total - advancePaid);

  const handleAddItem = () => {
    const defaultProduct = getDefaultProduct(productList) || productList[0];
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

  const handleUpdateItem = (index: number, field: keyof AdminOrderItem, value: any) => {
    setOrderItems((prev) => {
      const updated = [...prev];
      const target = { ...updated[index], [field]: value };
      if (field === "productId") {
        const prod = productList.find((p) => p._id === value);
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

      if (Array.isArray(data.items) && data.items.length > 0) {
        const parsedOrderItems: AdminOrderItem[] = data.items.map((it: any) => {
          const prod = productList.find((p) => p._id === it.productId) || getDefaultProduct(productList) || productList[0];
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
      toast.success("AI পার্সিং সফল হয়েছে! তথ্যাদি ম্যানুয়াল ফর্মে লোড হয়েছে।");
      setActiveTab("manual");
    } catch (err: any) {
      toast.error(err.message || "AI পার্স করতে ব্যর্থ হয়েছে");
    } finally {
      setIsParsing(false);
    }
  };

  const handleSubmit = async () => {
    if (!name.trim()) return toast.error("কাস্টমারের নাম লিখুন");
    if (!phone.trim()) return toast.error("কাস্টমারের মোবাইল নম্বর লিখুন");
    if (!addressLine1.trim()) return toast.error("কাস্টমারের ঠিকানা লিখুন");
    if (orderItems.length === 0) return toast.error("কমপক্ষে ১টি প্রোডাক্ট যোগ করুন");

    setIsSubmitting(true);
    try {
      const res = await createAdminManualOrder({
        channelSource,
        name,
        phone,
        isGift,
        receiverName: isGift ? receiverName : undefined,
        receiverPhone: isGift ? receiverPhone : undefined,
        addressLine1,
        city: city || undefined,
        district: district || (deliveryArea === "dhaka" ? "Dhaka" : "Outside Dhaka"),
        deliveryArea,
        customShippingCost: deliveryArea === "custom" ? customShippingCost : undefined,
        paymentMethod,
        paymentProvider: paymentMethod === "mobile" ? paymentProvider : undefined,
        senderNumber: paymentMethod === "mobile" ? senderNumber : undefined,
        transactionId: paymentMethod === "mobile" ? transactionId : undefined,
        customerNotes,
        items: orderItems,
        discount,
        vipPrivilege,
        advancePaid,
      });

      if (res.error) { toast.error(res.error); }
      else if (res.orderNumber) { toast.success(`অর্ডার #${res.orderNumber} সফলভাবে তৈরি হয়েছে!`); setOpen(false); router.refresh(); }
    } catch (err: any) {
      toast.error("অর্ডার সেভ করতে সমস্যা হয়েছে");
    } finally {
      setIsSubmitting(false);
    }
  };

  const manualFormContent = (
    <div className="space-y-4 pt-1 max-h-[70vh] overflow-y-auto pr-2">
      <div>
        <Text strong style={{ fontSize: "12px", display: "block", marginBottom: 6 }}>
          ১. সেলস চ্যানেল / অর্ডার সোর্স
        </Text>
        <Select
          value={channelSource}
          onChange={(val) => setChannelSource(val as ChannelSource)}
          style={{ width: "100%", height: 42 }}
          options={Object.entries(CHANNEL_LABELS).map(([k, v]) => ({ value: k, label: v }))}
        />
      </div>

      <div className="space-y-2">
        <Text strong style={{ fontSize: "12px", display: "block" }}>
          <UserOutlined style={{ color: "#1677ff" }} /> ২. কাস্টমারের ফোন ও নাম
        </Text>
        <div className="grid sm:grid-cols-2 gap-2">
          <div>
            <Input
              placeholder="মোবাইল নম্বর *"
              value={phone}
              onChange={(e) => handlePhoneLookup(e.target.value)}
              style={{ height: 40, borderRadius: 10 }}
            />
            {customerHistory && (
              <div style={{ marginTop: 4 }}>
                <Tag color="cyan" style={{ fontSize: "10px", fontWeight: 700 }}>
                  আগের অর্ডার: {customerHistory.totalOrders} টি
                </Tag>
                {customerHistory.lastShipping && (
                  <Button
                    type="link"
                    size="small"
                    style={{ fontSize: "11px", padding: 0, height: "auto" }}
                    onClick={handleAutoFillCustomerHistory}
                  >
                    ⚡ কাস্টমার তথ্য অটো-ফিল করুন
                  </Button>
                )}
              </div>
            )}
          </div>
          <Input
            placeholder="কাস্টমারের নাম *"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ height: 40, borderRadius: 10 }}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Flex align="center" justify="space-between">
          <Text strong style={{ fontSize: "12px" }}>
            <ShoppingCartOutlined style={{ color: "#1677ff" }} /> ৩. অর্ডারকৃত প্রোডাক্টসমূহ ({orderItems.length})
          </Text>
          <Button size="small" type="dashed" icon={<PlusOutlined />} onClick={handleAddItem} style={{ borderRadius: 8, fontWeight: 700 }}>
            + প্রোডাক্ট যোগ করুন
          </Button>
        </Flex>

        <div className="space-y-3">
          {orderItems.map((item, idx) => {
            const prod = productList.find((p) => p._id === item.productId);
            const hasColors = Boolean(prod?.colors && prod.colors.length > 0);
            return (
              <Card key={idx} style={{ borderRadius: 14 }} styles={{ body: { padding: 12 } }} className="border border-slate-200 bg-slate-50/50">
                <Flex align="start" gap={12} wrap="wrap">
                  <div style={{ width: 44, height: 44, borderRadius: 8, overflow: "hidden", background: "#e2e8f0", flexShrink: 0, position: "relative" }}>
                    {prod?.thumbnail ? (
                      <Image src={prod.thumbnail} alt={prod.title} fill style={{ objectFit: "cover" }} />
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
                        options={productList.map((p) => ({ value: p._id, label: `${p.title} — ${formatPrice(p.salePrice || p.regularPrice)}` }))}
                      />
                    </div>
                    <div>
                      <Flex align="center" justify="space-between" style={{ marginBottom: 2 }}>
                        <Text type="secondary" style={{ fontSize: "10px", fontWeight: 700 }}>
                          ✏️ ইনভয়েস টাইটেল (এডিটযোগ্য):
                        </Text>
                      </Flex>
                      <Input
                        value={item.productTitle}
                        onChange={(e) => handleUpdateItem(idx, "productTitle", e.target.value)}
                        style={{ borderRadius: 8, fontSize: "12px", fontWeight: 600 }}
                      />
                    </div>
                    <Flex align="center" gap={6} wrap="wrap">
                      <Text type="secondary" style={{ fontSize: "11px", fontWeight: 700 }}>কালার:</Text>
                      {hasColors && prod!.colors!.map((c) => {
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
                  <Flex align="center" gap={8} className="shrink-0 pt-2 sm:pt-0">
                    <Text type="secondary" style={{ fontSize: "11px", fontWeight: 700 }}>পরিমাণ:</Text>
                    <Space.Compact>
                      <Button size="small" onClick={() => handleUpdateItem(idx, "quantity", Math.max(1, item.quantity - 1))}>-</Button>
                      <Text strong>{item.quantity}</Text>
                      <Button size="small" onClick={() => handleUpdateItem(idx, "quantity", item.quantity + 1)}>+</Button>
                    </Space.Compact>
                    {orderItems.length > 1 && (
                      <Button danger type="text" size="small" icon={<DeleteOutlined />} onClick={() => handleRemoveItem(idx)} />
                    )}
                  </Flex>
                </Flex>
              </Card>
            );
          })}
        </div>
      </div>

      <div className="space-y-2 pt-1">
        <Text strong style={{ fontSize: "12px" }}>💰 বিশেষ সম্মাননা ও অগ্রিম জমা</Text>
        <div className="grid grid-cols-2 gap-3">
          <InputNumber min={0} placeholder="VIP ছাড় ৳" value={vipPrivilege} onChange={(val) => setVipPrivilege(val || 0)} style={{ width: "100%", borderRadius: 8 }} />
          <InputNumber min={0} placeholder="অগ্রিম জমা ৳" value={advancePaid} onChange={(val) => setAdvancePaid(val || 0)} style={{ width: "100%", borderRadius: 8 }} />
        </div>
      </div>

      <div className="space-y-2">
        <Flex align="center" justify="space-between">
          <Text strong style={{ fontSize: "12px" }}><EnvironmentOutlined style={{ color: "#1677ff" }} /> ডেলিভারি ঠিকানা</Text>
          <Text type="secondary" style={{ fontSize: "11px", fontWeight: 700 }}>ওজন: {totalWeightGrams}g</Text>
        </Flex>
        <div className="grid sm:grid-cols-3 gap-2">
          <Input placeholder="এরিয়া / গ্রাম *" value={addressLine1} onChange={(e) => setAddressLine1(e.target.value)} style={{ height: 40, borderRadius: 10 }} />
          <Input placeholder="উপজেলা / থানা" value={city} onChange={(e) => setCity(e.target.value)} style={{ height: 40, borderRadius: 10 }} />
          <Input placeholder="জেলা" value={district} onChange={(e) => setDistrict(e.target.value)} style={{ height: 40, borderRadius: 10 }} />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 items-center">
          <Radio.Group
            value={deliveryArea}
            onChange={(e) => setDeliveryArea(e.target.value)}
            style={{ display: "contents" }}
          >
            <Radio.Button
              value="dhaka"
              style={{ textAlign: "center", borderRadius: 8, fontSize: "11px", height: 38, lineHeight: "36px", width: "100%" }}
            >
              ISD (Inside)
            </Radio.Button>
            <Radio.Button
              value="suburbs"
              style={{ textAlign: "center", borderRadius: 8, fontSize: "11px", height: 38, lineHeight: "36px", width: "100%" }}
            >
              SUB (Suburbs)
            </Radio.Button>
            <Radio.Button
              value="outside"
              style={{ textAlign: "center", borderRadius: 8, fontSize: "11px", height: 38, lineHeight: "36px", width: "100%" }}
            >
              OSD (Outside)
            </Radio.Button>
          </Radio.Group>

          <InputNumber
            min={0}
            placeholder="Custom / ৳0"
            value={deliveryArea === "custom" ? customShippingCost : undefined}
            onFocus={() => setDeliveryArea("custom")}
            onChange={(val) => {
              setDeliveryArea("custom");
              setCustomShippingCost(val !== null && val !== undefined ? val : 0);
            }}
            style={{
              width: "100%",
              borderRadius: 8,
              height: 38,
              borderColor: deliveryArea === "custom" ? "#1677ff" : "#d9d9d9",
              borderWidth: deliveryArea === "custom" ? 2 : 1,
            }}
          />
        </div>
      </div>

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
        type={triggerType}
        size={triggerSize}
        block={triggerBlock}
        icon={<ThunderboltOutlined />}
        onClick={() => setOpen(true)}
        style={{ fontWeight: 700, borderRadius: 10, ...triggerStyle }}
        className={triggerClassName}
      >
        {triggerText}
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
