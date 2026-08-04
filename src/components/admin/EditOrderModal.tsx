// src/components/admin/EditOrderModal.tsx
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
  Typography,
  Flex,
  Space,
  InputNumber,
  Tooltip,
} from "antd";
import {
  EditOutlined,
  ShoppingCartOutlined,
  UserOutlined,
  EnvironmentOutlined,
  PlusOutlined,
  DeleteOutlined,
  SaveOutlined,
  CheckOutlined,
  GiftOutlined,
  UndoOutlined,
} from "@ant-design/icons";
import type { IOrderSerializable } from "@/types/order";
import { ChannelSource, CHANNEL_LABELS } from "@/types/order";
import { updateAdminOrder } from "@/actions/order";
import { formatPrice } from "@/lib/priceUtils";
import {
  calculateShippingCost,
  getWeightTierLabel,
  DeliveryZone,
} from "@/lib/shipping";

const { Text, Title } = Typography;

export interface ProductOption {
  _id: string;
  title: string;
  thumbnail?: string;
  colors?: string[];
  sizes?: string[];
  salePrice?: number;
  regularPrice: number;
  weight?: number;
}

interface EditOrderItem {
  productId: string;
  productTitle?: string;
  color?: string;
  size?: string;
  quantity: number;
  unitPrice: number;
}

interface Props {
  order: IOrderSerializable;
  products: ProductOption[];
}

export function EditOrderModal({ order, products }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [channelSource, setChannelSource] = useState<ChannelSource>(
    (order.channelSource as ChannelSource) || "web",
  );

  const initialItems: EditOrderItem[] = order.items.map((it) => {
    const pId = String(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      typeof it.product === "object" && it.product !== null ? (it.product as any)._id || it.product : (it.product || products[0]?._id || "")
    );
    const matchedProd = products.find((p) => p._id === pId);
    const titleVal = it.productTitle || (matchedProd ? matchedProd.title : "");

    return {
      productId: pId,
      productTitle: titleVal,
      color: it.color || "",
      size: it.size || "",
      quantity: it.itemQuantity,
      unitPrice: it.unitPrice,
    };
  });

  const [items, setItems] = useState<EditOrderItem[]>(
    initialItems.length > 0
      ? initialItems
      : [
          {
            productId: products[0]?._id || "",
            color: products[0]?.colors?.[0] || "",
            size: products[0]?.sizes?.[0] || "",
            quantity: 1,
            unitPrice: products[0]?.salePrice || products[0]?.regularPrice || 0,
          },
        ],
  );

  const isGiftOrder = Boolean(
    order.customerPhone && order.customerPhone !== order.shipping.phone,
  );

  const [name, setName] = useState(order.shipping.name || "");
  const [phone, setPhone] = useState(order.shipping.phone || "");
  const [isGift, setIsGift] = useState(isGiftOrder);
  const [receiverName, setReceiverName] = useState(
    isGiftOrder ? order.shipping.name : "",
  );
  const [receiverPhone, setReceiverPhone] = useState(
    isGiftOrder ? order.shipping.phone : "",
  );
  const [addressLine1, setAddressLine1] = useState(
    order.shipping.addressLine1 || "",
  );
  const [city, setCity] = useState(order.shipping.city || "");
  const [district, setDistrict] = useState(order.shipping.district || "");
  const [deliveryArea, setDeliveryArea] = useState<DeliveryZone>(
    (order.shipping.deliveryArea as DeliveryZone) || "dhaka",
  );

  const initialVipPrivilege = (order.vipPrivilege && order.vipPrivilege > 0) ? order.vipPrivilege : (order.discount || 0);
  const [vipPrivilege, setVipPrivilege] = useState<number>(initialVipPrivilege);
  const [advancePaid, setAdvancePaid] = useState<number>(order.advancePaid || 0);
  const [customerNotes, setCustomerNotes] = useState(order.customerNotes || "");

  const totalWeightGrams = items.reduce((sum, item) => {
    const prod = products.find((p) => p._id === item.productId);
    const w = prod?.weight || 500;
    return sum + w * item.quantity;
  }, 0);

  const subtotal = items.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0,
  );

  const shippingCost = calculateShippingCost(deliveryArea, totalWeightGrams);
  const total = Math.max(0, subtotal + shippingCost - (vipPrivilege || 0));
  const codAmount = Math.max(0, total - (advancePaid || 0));

  const handleAddItem = () => {
    const defaultProduct = products[0];
    setItems((prev) => [
      {
        productId: defaultProduct?._id || "",
        productTitle: defaultProduct?.title || "",
        color: defaultProduct?.colors?.[0] || "",
        size: defaultProduct?.sizes?.[0] || "",
        quantity: 1,
        unitPrice: defaultProduct?.salePrice || defaultProduct?.regularPrice || 0,
      },
      ...prev,
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length === 1) {
      toast.error("কমপক্ষে একটি প্রোডাক্ট অর্ডারে থাকতে হবে");
      return;
    }
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleUpdateItem = (index: number, field: keyof EditOrderItem, value: any) => {
    setItems((prev) => {
      const updated = [...prev];
      const target = { ...updated[index], [field]: value };
      if (field === "productId") {
        const prod = products.find((p) => p._id === value);
        target.productTitle = prod?.title || "";
        target.color = prod?.colors?.[0] || "";
        target.size = prod?.sizes?.[0] || "";
        target.unitPrice = prod?.salePrice || prod?.regularPrice || 0;
      }
      updated[index] = target;
      return updated;
    });
  };

  const handleSubmit = async () => {
    if (!name.trim()) return toast.error("কাস্টমার নাম দিন");
    if (!phone.trim()) return toast.error("ফোন নাম্বার দিন");
    if (!addressLine1.trim()) return toast.error("এরিয়া / ঠিকানা দিন");
    if (items.length === 0) return toast.error("কমপক্ষে একটি প্রোডাক্ট যোগ করুন");

    setIsSubmitting(true);
    try {
      const res = await updateAdminOrder({
        orderId: String(order._id),
        name,
        phone,
        isGift,
        receiverName: isGift ? receiverName : undefined,
        receiverPhone: isGift ? receiverPhone : undefined,
        addressLine1,
        city: city || undefined,
        district: district || (deliveryArea === "dhaka" ? "Dhaka" : "Outside Dhaka"),
        deliveryArea,
        channelSource,
        customerNotes,
        discount: 0,
        vipPrivilege,
        advancePaid,
        items,
      });

      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("অর্ডার সফলভাবে এডিট করা হয়েছে!");
        setOpen(false);
        router.refresh();
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      toast.error("অর্ডার এডিট করতে সমস্যা হয়েছে");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Button
        type="primary"
        icon={<EditOutlined />}
        onClick={() => setOpen(true)}
        style={{ fontWeight: 700, borderRadius: 8, width: "100%" }}
      >
        Edit Order
      </Button>

      <Modal
        open={open}
        onCancel={() => setOpen(false)}
        footer={null}
        width={900}
        centered
        style={{ borderRadius: 20, maxWidth: "95vw" }}
        title={
          <Flex align="center" gap={8}>
            <EditOutlined style={{ fontSize: 18, color: "#1677ff" }} />
            <Title level={5} style={{ margin: 0, fontWeight: 900 }}>
              Edit Order — #{order.orderNumber}
            </Title>
          </Flex>
        }
      >
        <div className="space-y-5 pt-3">
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

          {/* Product Items */}
          <div className="space-y-3">
            <Flex align="center" justify="space-between" wrap="wrap" gap={8}>
              <Flex align="center" gap={8}>
                <Text strong style={{ fontSize: "13px" }}>
                  <ShoppingCartOutlined style={{ color: "#1677ff" }} /> কার্ট প্রোডাক্ট ({items.length})
                </Text>
                <Tag color="cyan" style={{ margin: 0, fontWeight: 700, borderRadius: 6, fontSize: "11px" }}>
                  📦 {totalWeightGrams}g ({getWeightTierLabel(totalWeightGrams)})
                </Tag>
              </Flex>
              <Button type="dashed" size="small" icon={<PlusOutlined />} onClick={handleAddItem} style={{ fontWeight: 700 }}>
                + Add Product
              </Button>
            </Flex>

            <div className="space-y-3">
              {items.map((item, idx) => {
                const prod = products.find((p) => p._id === item.productId);
                const itemTotal = item.unitPrice * item.quantity;
                const hasColors = prod?.colors && prod.colors.length > 0;

                return (
                  <Card key={idx} style={{ borderRadius: 14, border: "1px solid #e2e8f0" }} styles={{ body: { padding: 12 } }}>
                    <Flex gap={12} align="center" wrap="wrap">
                      <div style={{ width: 60, height: 60, borderRadius: 10, overflow: "hidden", background: "#f1f5f9", position: "relative", flexShrink: 0 }}>
                        {prod?.thumbnail ? (
                          <Image src={prod.thumbnail} alt={prod.title} fill className="object-cover" sizes="60px" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-400 font-bold">No Image</div>
                        )}
                      </div>

                      <div style={{ flex: 1, minWidth: 220 }} className="space-y-2.5">
                        {/* 1. Catalog Product Select */}
                        <div>
                          <Text type="secondary" style={{ fontSize: "10px", fontWeight: 700, display: "block", marginBottom: 2 }}>
                            📦 ক্যাটালগ প্রোডাক্ট:
                          </Text>
                          <Select
                            value={item.productId}
                            onChange={(val) => handleUpdateItem(idx, "productId", val)}
                            style={{ width: "100%" }}
                            options={products.map((p) => ({
                              value: p._id,
                              label: `${p.title} — ${formatPrice(p.salePrice || p.regularPrice)}`,
                            }))}
                          />
                        </div>

                        {/* 2. Editable Title Box with Undo & Custom Tag */}
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
                          <Input
                            placeholder="কাস্টম কালার..."
                            value={item.color || ""}
                            onChange={(e) => handleUpdateItem(idx, "color", e.target.value)}
                            style={{ width: 120, height: 28, fontSize: "11px", borderRadius: 6 }}
                          />
                        </Flex>
                      </div>

                      <Flex align="center" gap={10} style={{ marginLeft: "auto" }} wrap="wrap">
                        <div>
                          <Text type="secondary" style={{ fontSize: "10px", display: "block" }}>একক দাম (৳):</Text>
                          <InputNumber
                            value={item.unitPrice}
                            min={0}
                            onChange={(val) => handleUpdateItem(idx, "unitPrice", val || 0)}
                            style={{ width: 90, height: 32, borderRadius: 8 }}
                          />
                        </div>

                        <Space orientation="vertical" size={2} align="center">
                          <Text type="secondary" style={{ fontSize: "10px" }}>পরিমাণ:</Text>
                          <Space>
                            <Button size="small" onClick={() => handleUpdateItem(idx, "quantity", Math.max(1, item.quantity - 1))}>-</Button>
                            <Text strong>{item.quantity}</Text>
                            <Button size="small" onClick={() => handleUpdateItem(idx, "quantity", item.quantity + 1)}>+</Button>
                          </Space>
                        </Space>

                        <div style={{ textAlign: "right", minWidth: 60 }}>
                          <Text type="secondary" style={{ fontSize: "10px", display: "block" }}>মোট:</Text>
                          <Text strong style={{ fontSize: "14px", color: "#1677ff" }}>{formatPrice(itemTotal)}</Text>
                        </div>

                        {items.length > 1 && (
                          <Button danger type="text" icon={<DeleteOutlined />} onClick={() => handleRemoveItem(idx)} />
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
              <Input placeholder="মোবাইল নম্বর *" value={phone} onChange={(e) => setPhone(e.target.value)} style={{ height: 40, borderRadius: 10 }} />
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

          {/* Delivery Address */}
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

          {/* Discount & VIP Privilege & Advance */}
          <div className="space-y-3">
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <Text strong style={{ fontSize: "12px", display: "block", marginBottom: 4 }}>
                  🌟 VIP Privilege (বিশেষ সম্মাননা ছাড় ৳):
                </Text>
                <InputNumber
                  value={vipPrivilege}
                  min={0}
                  onChange={(val) => setVipPrivilege(val || 0)}
                  style={{ width: "100%", height: 40, borderRadius: 10 }}
                />
              </div>

              <div>
                <Text strong style={{ fontSize: "12px", display: "block", marginBottom: 4 }}>
                  💳 অগ্রিম পরিশোধ (যদি আগেই বিকাশে দেয় ৳):
                </Text>
                <InputNumber
                  value={advancePaid}
                  min={0}
                  onChange={(val) => setAdvancePaid(val || 0)}
                  style={{ width: "100%", height: 40, borderRadius: 10 }}
                />
              </div>
            </div>

            <div>
              <Text strong style={{ fontSize: "12px", display: "block", marginBottom: 4 }}>
                কাস্টমার স্পেশাল নোট:
              </Text>
              <Input
                placeholder="নোট বা বিশেষ নির্দেশ..."
                value={customerNotes}
                onChange={(e) => setCustomerNotes(e.target.value)}
                style={{ height: 40, borderRadius: 10 }}
              />
            </div>
          </div>

          {/* Summary & Save */}
          <Card style={{ background: "#0f172a", borderRadius: 16, marginTop: 16 }} styles={{ body: { padding: 16 } }}>
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
                icon={<SaveOutlined />}
                onClick={handleSubmit}
                style={{ fontWeight: 900, height: 46, borderRadius: 10, background: "#ffffff", color: "#0f172a", display: "block", width: "100%", maxWidth: 320, margin: "0 auto" }}
              >
                Save Order Changes
              </Button>
            </div>
          </Card>
        </div>
      </Modal>
    </>
  );
}
