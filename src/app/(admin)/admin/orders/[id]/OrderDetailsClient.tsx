// src/app/(admin)/admin/orders/[id]/OrderDetailsClient.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import {
  Dropdown,
  Card,
  Row,
  Col,
  Steps,
  Tag,
  Button,
  Input,
  Typography,
  Flex,
  Space,
  Descriptions,
  Timeline,
  Alert,
  Divider,
} from "antd";
import {
  ArrowLeftOutlined,
  PrinterOutlined,
  PhoneOutlined,
  MessageOutlined,
  EnvironmentOutlined,
  ShoppingOutlined,
  CreditCardOutlined,
  UserOutlined,
  GiftOutlined,
  CalendarOutlined,
  CopyOutlined,
  CheckOutlined,
  ExportOutlined,
  TruckOutlined,
  ClockCircleOutlined,
  SyncOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import { formatPrice } from "@/lib/priceUtils";
import { StatusUpdater } from "@/components/admin/StatusUpdater";
import type { IOrderSerializable } from "@/types/order";
import { CHANNEL_LABELS } from "@/types/order";
import { format } from "date-fns";
import { updateOrderTrackingId } from "@/actions/pathaoTracking";
import { PathaoTrackingModal } from "@/components/admin/PathaoTrackingModal";

import { EditOrderModal, ProductOption } from "@/components/admin/EditOrderModal";
import { ShareAltOutlined, CarOutlined, SaveOutlined, EyeOutlined } from "@ant-design/icons";
import FollowUpPanel from "@/components/admin/FollowUpPanel";

const { Title, Text } = Typography;

interface Props {
  order: IOrderSerializable;
  products?: ProductOption[];
}

const STAGE_STEPS = [
  { title: "Pending", key: "pending", icon: <ClockCircleOutlined /> },
  { title: "Confirmed", key: "confirmed", icon: <CheckCircleOutlined /> },
  { title: "Processing", key: "processing", icon: <SyncOutlined spin /> },
  { title: "Shipped", key: "shipped", icon: <TruckOutlined /> },
  { title: "Delivered", key: "delivered", icon: <CheckCircleOutlined /> },
];

export function OrderDetailsClient({ order, products = [] }: Props) {
  const router = useRouter();
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Pathao Tracking State
  const [consignmentInput, setConsignmentInput] = useState(order.courierTrackingId || "");
  const [activeTrackingId, setActiveTrackingId] = useState(order.courierTrackingId || "");
  const [courierStatusState, setCourierStatusState] = useState(order.courierStatus || "");
  const [courierReasonState, setCourierReasonState] = useState(order.courierReason || "");
  const [courierAttemptState, setCourierAttemptState] = useState(order.courierAttemptCount || 0);
  const [savingTracking, setSavingTracking] = useState(false);
  const [trackingModalOpen, setTrackingModalOpen] = useState(false);

  const handleSaveTracking = async () => {
    const isClearing = !consignmentInput.trim();
    setSavingTracking(true);
    try {
      const res = await updateOrderTrackingId(order._id, consignmentInput);
      if (res.success && res.order) {
        setActiveTrackingId(res.order.courierTrackingId || "");
        setCourierStatusState(res.order.courierStatus || "");
        setCourierReasonState(res.order.courierReason || "");
        setCourierAttemptState(res.order.courierAttemptCount || 0);
        if (isClearing) {
          toast.success("Pathao Consignment ID removed successfully!");
        } else {
          toast.success("Pathao Consignment ID saved and live status synced!");
        }
        router.refresh();
      } else {
        toast.error(res.error || "Failed to save Consignment ID");
      }
    } catch {
      toast.error("Error saving Consignment ID");
    } finally {
      setSavingTracking(false);
    }
  };

  const isGiftOrder = Boolean(
    order.customerPhone && order.customerPhone !== order.shipping.phone,
  );

  const dateStr = format(new Date(order.createdAt), "dd MMM, yyyy - hh:mm a");

  const totalItems = order.items.reduce(
    (sum, item) => sum + item.itemQuantity,
    0,
  );

  const channelKey = order.channelSource || "web";
  const channelLabel = CHANNEL_LABELS[channelKey] || "Website";

  // Calculate step index
  let currentStep = STAGE_STEPS.findIndex((s) => s.key === order.orderStatus);
  if (currentStep === -1) currentStep = 0;

  const isCancelled = order.orderStatus === "cancelled";
  const isReturned = order.orderStatus === "returned";

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Structured address string
  const addressParts = [
    order.shipping.addressLine1,
    order.shipping.addressLine2,
    order.shipping.city,
    order.shipping.district,
  ].filter((p): p is string => Boolean(p) && !/suburbs|suburb|outside dhaka|inside dhaka|^dhaka$/i.test(p!.trim()));

  const fullAddressStr = addressParts.join(", ") || order.shipping.addressLine1;

  const itemsText = order.items
    .map(
      (it) =>
        `${it.productTitle}${it.color ? ` (${it.color})` : ""}${it.size ? ` (${it.size})` : ""} x ${it.itemQuantity}`
    )
    .join("\n");

  const effectiveVipPrivilege = (order.vipPrivilege && order.vipPrivilege > 0) ? order.vipPrivilege : (order.discount || 0);
  const codTotal = Math.max(0, order.total - (order.advancePaid || 0));

  const courierText =
    `Name: ${order.shipping.name}\n` +
    `Mobile: ${order.shipping.phone}\n` +
    `Address: ${fullAddressStr}\n` +
    `Zone: ${order.shipping.deliveryZone || "ISD (Inside Dhaka)"}\n` +
    `SubTotal: ${order.subtotal}\n` +
    (effectiveVipPrivilege > 0 ? `VIP Privilege: -${effectiveVipPrivilege}\n` : "") +
    `Delevary Charge: ${order.shippingCost}\n` +
    (order.advancePaid && order.advancePaid > 0 ? `Advance Paid: ${order.advancePaid}\n` : "") +
    `------------------------------------\n` +
    `Total: ${codTotal}` +
    (order.customerNotes ? `\nNote: ${order.customerNotes}` : "");

  return (
    <div style={{ padding: 0 }} className="space-y-5">
      {/* Unified Top Header & Order Status Card */}
      <Card style={{ borderRadius: 16 }} styles={{ body: { padding: 16 } }}>
        <div className="space-y-4">
          {/* Top Bar: Order Info & Actions */}
          {/* Top Bar: Order Info & Actions (Responsive for Mobile, Medium Tablet, and Large Desktop) */}
          <div className="flex flex-col xl:flex-row items-start justify-between gap-4 text-left">
            <div className="flex flex-row items-start gap-3 w-full sm:w-auto">
              <Button
                shape="circle"
                icon={<ArrowLeftOutlined />}
                onClick={() => router.back()}
                className="shrink-0 mt-0.5"
              />
              <div className="flex flex-col items-start gap-1 text-left">
                {/* Row 1: Order ID */}
                <Title level={4} style={{ margin: 0, fontWeight: 900 }}>
                  Order ID: {order.orderNumber}
                </Title>
                
                {/* Row 2: Channel Tag */}
                <div>
                  <Tag color="blue" style={{ fontWeight: 700, borderRadius: 6, margin: 0 }}>
                    {channelLabel}
                  </Tag>
                </div>

                {/* Row 3: Date */}
                <Text type="secondary" style={{ fontSize: "12px" }}>
                  <CalendarOutlined style={{ marginRight: 4 }} />
                  Placed on {dateStr}
                </Text>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 xl:flex xl:flex-row items-center gap-2 w-full xl:w-auto pt-2 xl:pt-0">
              {/* Edit Order Modal */}
              <div className="col-span-1">
                <EditOrderModal order={order} products={products} />
              </div>

              {/* Share to Hub WhatsApp (Fixed number 01648107659) */}
              <a
                href={`https://api.whatsapp.com/send?phone=8801648107659&text=${encodeURIComponent(courierText)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="col-span-1"
              >
                <Button
                  block
                  style={{ fontWeight: 700, borderColor: "#25D366", color: "#25D366", borderRadius: 8 }}
                  icon={<MessageOutlined style={{ color: "#25D366" }} />}
                >
                  Share to Hub
                </Button>
              </a>

              {/* Copy Courier Info */}
              <Button
                block
                icon={copiedField === "courier" ? <CheckOutlined style={{ color: "#52c41a" }} /> : <CopyOutlined />}
                onClick={() => handleCopy(courierText, "courier")}
                style={{ fontWeight: 700, borderRadius: 8 }}
                className="col-span-1"
              >
                Copy Info
              </Button>

              {(() => {
                const cleanPhone = order.shipping.phone.replace(/[^0-9]/g, "");
                const waNumber = cleanPhone.startsWith("88") ? cleanPhone : `88${cleanPhone}`;
                return (
                  <Space.Compact className="col-span-1 sm:col-span-1 w-full">
                    <Button
                      style={{ fontWeight: 700, width: "100%" }}
                      icon={<PhoneOutlined />}
                      onClick={() => {
                        window.location.href = `tel:${order.shipping.phone}`;
                      }}
                    >
                      Call
                    </Button>
                    <Dropdown
                      menu={{
                        items: [
                          {
                            key: "call",
                            label: (
                              <a href={`tel:${order.shipping.phone}`} style={{ fontWeight: 700 }}>
                                📞 Call {order.shipping.phone}
                              </a>
                            ),
                          },
                          {
                            key: "whatsapp",
                            label: (
                              <a
                                href={`https://wa.me/${waNumber}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ fontWeight: 700 }}
                              >
                                💬 WhatsApp Customer
                              </a>
                            ),
                            icon: <MessageOutlined style={{ color: "#25D366" }} />,
                          },
                          {
                            key: "copy",
                            label: "📋 Copy Phone",
                            icon: <CopyOutlined />,
                            onClick: () => handleCopy(order.shipping.phone, "phone_top"),
                          },
                        ],
                      }}
                      placement="bottomRight"
                    >
                      <Button icon={<PhoneOutlined />} />
                    </Dropdown>
                  </Space.Compact>
                );
              })()}

              <Link
                href={`/admin/orders/${order._id}/invoice`}
                target="_blank"
                rel="noopener"
                className="col-span-2 sm:col-span-2 xl:col-span-1"
              >
                <Button block type="primary" icon={<PrinterOutlined />} style={{ fontWeight: 700, borderRadius: 8 }}>
                  Print Invoice
                </Button>
              </Link>
            </div>
          </div>

          <Divider style={{ margin: "8px 0" }} />

          {/* Status Control Bar */}
          <div className="flex items-center justify-center gap-3 py-1">
            {isGiftOrder && (
              <Tag color="magenta" icon={<GiftOutlined />} style={{ fontWeight: 700, margin: 0 }}>
                GIFT ORDER
              </Tag>
            )}
            <Flex align="center" gap={8} justify="center">
              <Text strong style={{ fontSize: "13px" }}>
                Order Status:
              </Text>
              <StatusUpdater
                orderId={order._id}
                currentStatus={order.orderStatus}
              />
            </Flex>
          </div>

          {/* Steps Timeline */}
          {!isCancelled && !isReturned ? (
            <div className="admin-steps-horizontal-wrapper overflow-x-auto pt-2">
              <Steps
                orientation="horizontal"
                responsive={false}
                titlePlacement="vertical"
                current={currentStep}
                size="small"
                items={STAGE_STEPS.map((step) => ({
                  title: step.title,
                  icon: step.icon,
                }))}
              />
              <style jsx global>{`
                .admin-steps-horizontal-wrapper {
                  scrollbar-width: none !important;
                  -ms-overflow-style: none !important;
                }
                .admin-steps-horizontal-wrapper::-webkit-scrollbar {
                  display: none !important;
                  width: 0 !important;
                  height: 0 !important;
                }
                .admin-steps-horizontal-wrapper .ant-steps-item-title {
                  font-size: 10px !important;
                  font-weight: 700 !important;
                  line-height: 1.2 !important;
                  padding-inline-end: 0 !important;
                }
                .admin-steps-horizontal-wrapper .ant-steps-item-container {
                  display: flex !important;
                  flex-direction: column !important;
                  align-items: center !important;
                  text-align: center !important;
                }
                .admin-steps-horizontal-wrapper .ant-steps-item-icon {
                  margin-inline-end: 0 !important;
                  margin-bottom: 4px !important;
                }
                .admin-steps-horizontal-wrapper .ant-steps-item-content {
                  width: 100% !important;
                  text-align: center !important;
                }
              `}</style>
            </div>
          ) : (
            <Alert
              type="error"
              showIcon
              icon={<CloseCircleOutlined />}
              title={isCancelled ? "Order Cancelled" : "Order Returned"}
              style={{ borderRadius: 10 }}
            />
          )}
        </div>
      </Card>

      {/* Pathao Courier Tracking Card */}
      <Card style={{ borderRadius: 16 }} styles={{ body: { padding: 16 } }} className="border border-red-100 bg-gradient-to-r from-slate-50 to-red-50/20 shadow-sm">
        <Flex align="center" justify="space-between" wrap="wrap" gap={12}>
          <div>
            <Flex align="center" gap={8}>
              <CarOutlined style={{ color: "#e11d48", fontSize: 18 }} />
              <Text strong style={{ fontSize: "14px", color: "#0f172a" }}>
                Pathao Courier Tracking
              </Text>
              {courierStatusState && (
                (() => {
                  const attempts = courierAttemptState || (
                    (courierReasonState && courierStatusState.toLowerCase().includes("ready")) ? 2 : 0
                  );

                  return (
                    <Tag
                      color={
                        courierStatusState.toLowerCase().includes("hold")
                          ? "warning"
                          : courierStatusState.toLowerCase().includes("return")
                          ? "error"
                          : courierStatusState.toLowerCase().includes("delivered")
                          ? "success"
                          : "processing"
                      }
                      style={{
                        fontWeight: 900,
                        fontSize: "12px",
                        borderRadius: 6,
                        margin: 0,
                        padding: "2px 8px",
                        display: "inline-flex",
                        alignItems: "center",
                      }}
                    >
                      <span>{courierStatusState}</span>
                      {attempts > 1 && (
                        <span
                          style={{
                            backgroundColor: "#ef4444",
                            color: "#ffffff",
                            fontSize: "10px",
                            fontWeight: 900,
                            borderRadius: "10px",
                            padding: "1px 6px",
                            marginLeft: "6px",
                            display: "inline-block",
                            lineHeight: "14px",
                            boxShadow: "0 1px 3px rgba(239, 68, 68, 0.3)",
                          }}
                        >
                          {attempts}
                        </span>
                      )}
                    </Tag>
                  );
                })()
              )}
            </Flex>
            {courierReasonState && (
              <Text type="secondary" style={{ fontSize: "12px", display: "block", marginTop: 4, color: "#b45309" }}>
                Reason: {courierReasonState}
              </Text>
            )}
          </div>

          <Flex align="center" gap={8} wrap="wrap">
            <div className="flex items-center gap-1.5">
              <Input
                placeholder="Enter Consignment ID (e.g. SG030...)"
                value={consignmentInput}
                onChange={(e) => setConsignmentInput(e.target.value)}
                style={{ borderRadius: 8, width: 220 }}
                allowClear
              />
              <Button
                type="primary"
                icon={<SaveOutlined />}
                loading={savingTracking}
                onClick={handleSaveTracking}
                style={{ borderRadius: 8, fontWeight: 700 }}
              >
                Save
              </Button>
            </div>

            {activeTrackingId && (
              <Button
                type="default"
                icon={<EyeOutlined />}
                onClick={() => setTrackingModalOpen(true)}
                style={{ borderRadius: 8, fontWeight: 700 }}
              >
                Live Track ➜
              </Button>
            )}
          </Flex>
        </Flex>
      </Card>

      {/* Customer Follow-up Notes */}
      <Card
        title={
          <Flex align="center" gap={8}>
            <PhoneOutlined style={{ color: "#6366f1" }} />
            <Text strong style={{ fontSize: "14px" }}>Customer Follow-up</Text>
          </Flex>
        }
        style={{ borderRadius: 16 }}
        styles={{ body: { padding: "16px" } }}
      >
        <FollowUpPanel
          orderId={order._id}
          initialFollowUps={order.followUps ?? []}
        />
      </Card>

      {/* Main Grid: Left Items List, Right Customer & Payment Details */}
      <Row gutter={[16, 16]}>
        {/* LEFT COLUMN: Products Table & Payable Summary */}
        <Col xs={24} lg={15}>
          <div className="flex flex-col gap-4">
          <Card
            title={
              <Flex align="center" justify="space-between">
                <Text strong style={{ fontSize: "14px" }}>
                  <ShoppingOutlined style={{ color: "#1677ff", marginRight: 6 }} />
                  Ordered Items ({order.items.length})
                </Text>
                <Text type="secondary" style={{ fontSize: "12px" }}>
                  Total Qty: {totalItems}
                </Text>
              </Flex>
            }
            style={{ borderRadius: 16 }}
            styles={{ body: { padding: 0 } }}
          >
            <div className="divide-y divide-slate-100">
              {order.items.map((item, idx) => (
                <div key={idx} className="p-4 flex gap-3 sm:gap-4 items-center">
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
                    <Image
                      src={item.productImage}
                      alt={item.productTitle}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Link
                      href={`/products/${item.productSlug}`}
                      target="_blank"
                      style={{ fontWeight: 800, color: "#0f172a" }}
                      className="hover:text-blue-600 transition-colors line-clamp-1 flex items-center gap-1"
                    >
                      {item.productTitle}
                      <ExportOutlined style={{ fontSize: 11, color: "#94a3b8" }} />
                    </Link>

                    <Text type="secondary" style={{ fontSize: "11px", display: "block" }}>
                      SKU: {item.productSku}
                    </Text>

                    <Flex gap={4} wrap="wrap" style={{ marginTop: 4 }}>
                      {item.color && (
                        <Tag color="blue" style={{ fontSize: "10px", margin: 0, fontWeight: 700 }}>
                          Color: {item.color}
                        </Tag>
                      )}
                      {item.size && (
                        <Tag style={{ fontSize: "10px", margin: 0, fontWeight: 700 }}>
                          Size: {item.size}
                        </Tag>
                      )}
                    </Flex>
                  </div>

                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <Text type="secondary" style={{ fontSize: "11px", display: "block" }}>
                      {formatPrice(item.unitPrice)} × {item.itemQuantity}
                    </Text>
                    <Text strong style={{ fontSize: "15px", color: "#1677ff" }}>
                      {formatPrice(item.unitPrice * item.itemQuantity)}
                    </Text>
                  </div>
                </div>
              ))}
            </div>

            {/* Financial Summary Card Box */}
            <div style={{ background: "#f8fafc", padding: 16, borderTop: "1px solid #f1f5f9" }}>
              <div className="space-y-2 max-w-sm ml-auto">
                <Flex justify="space-between">
                  <Text type="secondary">Subtotal:</Text>
                  <Text strong>{formatPrice(order.subtotal)}</Text>
                </Flex>

                {effectiveVipPrivilege > 0 && (
                  <Flex justify="space-between">
                    <Text type="secondary" style={{ color: "#d97706", fontWeight: 700 }}>
                      🌟 VIP Privilege:
                    </Text>
                    <Text strong style={{ color: "#d97706" }}>
                      -{formatPrice(effectiveVipPrivilege)}
                    </Text>
                  </Flex>
                )}

                {Boolean(order.advancePaid && order.advancePaid > 0) && (
                  <Flex justify="space-between">
                    <Text type="secondary" style={{ color: "#2563eb", fontWeight: 700 }}>
                      💳 Advance Paid:
                    </Text>
                    <Text strong style={{ color: "#2563eb" }}>
                      -{formatPrice(order.advancePaid || 0)}
                    </Text>
                  </Flex>
                )}

                <Flex justify="space-between">
                  <Text type="secondary">Delevary Charge:</Text>
                  <Text strong>{formatPrice(order.shippingCost)}</Text>
                </Flex>

                <Divider style={{ margin: "8px 0" }} />

                <Card style={{ background: "#0f172a", borderRadius: 12 }} styles={{ body: { padding: 12 } }}>
                  <Flex justify="space-between" align="center">
                    <Text style={{ color: "#94a3b8", fontSize: "11px", fontWeight: 700 }}>
                      {order.advancePaid && order.advancePaid > 0 ? "Net COD Collection Total:" : "Customer Payable Total:"}
                    </Text>
                    <Title level={4} style={{ color: "#ffffff", margin: 0, fontWeight: 900 }}>
                      {formatPrice(Math.max(0, order.total - (order.advancePaid || 0)))}
                    </Title>
                  </Flex>
                </Card>
              </div>
            </div>
          </Card>

          {/* Customer Note Alert */}
          {order.customerNotes && (
            <Alert
              type="warning"
              showIcon
              title={<Text strong style={{ color: "#78350f" }}>Customer Special Note</Text>}
              description={<Text style={{ color: "#92400e" }}>{order.customerNotes}</Text>}
              style={{ borderRadius: 14, background: "#fffbeb", borderColor: "#fef3c7" }}
            />
          )}
          </div>
        </Col>

        {/* RIGHT COLUMN: Customer Details, Payment & Activity Timeline */}
        <Col xs={24} lg={9}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4">
          {/* Customer & Shipping Card */}
          <Card
            title={
              <Text strong style={{ fontSize: "14px" }}>
                <UserOutlined style={{ color: "#1677ff", marginRight: 6 }} />
                {isGiftOrder ? "Delivery Recipient Details" : "Customer & Shipping Info"}
              </Text>
            }
            style={{ borderRadius: 16 }}
            styles={{ body: { padding: 16 } }}
          >
            <Descriptions column={1} size="small" layout="horizontal">
              <Descriptions.Item label={<Text type="secondary"><UserOutlined /> Name</Text>}>
                <Text strong>{order.shipping.name}</Text>
              </Descriptions.Item>

              <Descriptions.Item label={<Text type="secondary"><PhoneOutlined /> Phone</Text>}>
                <Flex align="center" gap={6}>
                  <a href={`tel:${order.shipping.phone}`} style={{ fontWeight: 800, color: "#1677ff" }}>
                    {order.shipping.phone}
                  </a>
                  <Button
                    size="small"
                    type="text"
                    icon={copiedField === "ship-phone" ? <CheckOutlined style={{ color: "#52c41a" }} /> : <CopyOutlined />}
                    onClick={() => handleCopy(order.shipping.phone, "ship-phone")}
                  />
                </Flex>
              </Descriptions.Item>

              <Descriptions.Item label={<Text type="secondary"><EnvironmentOutlined /> Address</Text>}>
                <Text strong style={{ display: "block", fontSize: "12px" }}>
                  {fullAddressStr}
                </Text>
              </Descriptions.Item>

              <Descriptions.Item label={<Text type="secondary"><TruckOutlined /> Delivery Zone</Text>}>
                <Tag color="purple" style={{ fontWeight: 700, borderRadius: 6 }}>
                  {order.shipping.deliveryZone || (order.shippingCost > 80 ? "OSD (Outside Dhaka)" : "ISD (Inside Dhaka)")}
                </Tag>
              </Descriptions.Item>
            </Descriptions>

            {isGiftOrder && (
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #f1f5f9" }}>
                <Text type="secondary" style={{ fontSize: "11px", fontWeight: 700, display: "block", marginBottom: 6 }}>
                  <GiftOutlined style={{ color: "#eb2f96" }} /> Gift Sender Phone:
                </Text>
                <Flex align="center" gap={6}>
                  <Text strong>{order.customerPhone}</Text>
                  <Button
                    size="small"
                    type="text"
                    icon={copiedField === "cust-phone" ? <CheckOutlined style={{ color: "#52c41a" }} /> : <CopyOutlined />}
                    onClick={() => handleCopy(order.customerPhone, "cust-phone")}
                  />
                </Flex>
              </div>
            )}
          </Card>

          {/* Payment Details Card */}
          <Card
            title={
              <Text strong style={{ fontSize: "14px" }}>
                <CreditCardOutlined style={{ color: "#1677ff", marginRight: 6 }} />
                Payment Details
              </Text>
            }
            style={{ borderRadius: 16 }}
            styles={{ body: { padding: 16 } }}
          >
            <Descriptions column={1} size="small" layout="horizontal">
              <Descriptions.Item label={<Text type="secondary">Payment Method</Text>}>
                <Tag color={order.paymentMethod === "cod" ? "default" : "magenta"} style={{ fontWeight: 800 }}>
                  {order.paymentMethod === "cod"
                    ? "CASH ON DELIVERY (COD)"
                    : order.paymentProvider?.toUpperCase() || "MOBILE BANKING"}
                </Tag>
              </Descriptions.Item>

              <Descriptions.Item label={<Text type="secondary">Payment Status</Text>}>
                <Tag color={order.paymentStatus === "paid" ? "green" : "gold"} style={{ fontWeight: 800 }}>
                  {order.paymentStatus?.toUpperCase()}
                </Tag>
              </Descriptions.Item>

              {order.paymentMethod === "mobile" && (
                <>
                  {order.senderNumber && (
                    <Descriptions.Item label={<Text type="secondary">Sender Phone</Text>}>
                      <Text strong>{order.senderNumber}</Text>
                    </Descriptions.Item>
                  )}
                  {order.transactionId && (
                    <Descriptions.Item label={<Text type="secondary">TrxID</Text>}>
                      <Flex align="center" gap={6}>
                        <Text code style={{ fontWeight: 800 }}>
                          {order.transactionId}
                        </Text>
                        <Button
                          size="small"
                          type="text"
                          icon={copiedField === "trx" ? <CheckOutlined style={{ color: "#52c41a" }} /> : <CopyOutlined />}
                          onClick={() => handleCopy(order.transactionId!, "trx")}
                        />
                      </Flex>
                    </Descriptions.Item>
                  )}
                </>
              )}
            </Descriptions>
          </Card>

          {/* Activity Timeline Card */}
          <Card
            className="md:col-span-2 lg:col-span-1"
            title={
              <Text strong style={{ fontSize: "14px" }}>
                <CalendarOutlined style={{ color: "#1677ff", marginRight: 6 }} />
                Activity Timeline
              </Text>
            }
            style={{ borderRadius: 16 }}
            styles={{ body: { padding: 16 } }}
          >
            <Timeline
              items={[
                {
                  color: "green",
                  content: (
                    <div>
                      <Text strong style={{ fontSize: "12px", display: "block" }}>
                        Order Placed
                      </Text>
                      <Text type="secondary" style={{ fontSize: "11px" }}>
                        {dateStr}
                      </Text>
                    </div>
                  ),
                },
                order.paidAt
                  ? {
                      color: "blue",
                      content: (
                        <div>
                          <Text strong style={{ fontSize: "12px", display: "block" }}>
                            Payment Received
                          </Text>
                          <Text type="secondary" style={{ fontSize: "11px" }}>
                            {format(new Date(order.paidAt), "dd MMM, yyyy - hh:mm a")}
                          </Text>
                        </div>
                      ),
                    }
                  : null,
                order.shippedAt
                  ? {
                      color: "purple",
                      content: (
                        <div>
                          <Text strong style={{ fontSize: "12px", display: "block" }}>
                            Order Shipped
                          </Text>
                          <Text type="secondary" style={{ fontSize: "11px" }}>
                            {format(new Date(order.shippedAt), "dd MMM, yyyy - hh:mm a")}
                          </Text>
                        </div>
                      ),
                    }
                  : null,
                order.deliveredAt
                  ? {
                      color: "green",
                      content: (
                        <div>
                          <Text strong style={{ fontSize: "12px", display: "block" }}>
                            Order Delivered
                          </Text>
                          <Text type="secondary" style={{ fontSize: "11px" }}>
                            {format(new Date(order.deliveredAt), "dd MMM, yyyy - hh:mm a")}
                          </Text>
                        </div>
                      ),
                    }
                  : null,
                order.cancelledAt
                  ? {
                      color: "red",
                      content: (
                        <div>
                          <Text strong style={{ fontSize: "12px", display: "block" }}>
                            Order Cancelled
                          </Text>
                          <Text type="secondary" style={{ fontSize: "11px" }}>
                            {format(new Date(order.cancelledAt), "dd MMM, yyyy - hh:mm a")}
                          </Text>
                        </div>
                      ),
                    }
                  : null,
              ].filter(Boolean) as any}
            />
          </Card>
          </div>
        </Col>
      </Row>

      <PathaoTrackingModal
        open={trackingModalOpen}
        onClose={() => setTrackingModalOpen(false)}
        consignmentId={order.courierTrackingId}
        orderNumber={order.orderNumber}
      />
    </div>
  );
}