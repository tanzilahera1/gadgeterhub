// src/app/(admin)/admin/courier/CourierMonitorClient.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Card,
  Table,
  Tag,
  Button,
  Input,
  Row,
  Col,
  Statistic,
  Typography,
  Flex,
  Tabs,
  Alert,
  Tooltip,
  Popover,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  CarOutlined,
  SearchOutlined,
  ReloadOutlined,
  PhoneOutlined,
  MessageOutlined,
  AlertOutlined,
  CopyOutlined,
  ExportOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import type { IOrderSerializable, IFollowUpEntry } from "@/types/order";
import { refreshActiveShipments } from "@/actions/pathaoTracking";
import { PathaoTrackingModal } from "@/components/admin/PathaoTrackingModal";
import FollowUpPanel, { OUTCOME_CONFIG } from "@/components/admin/FollowUpPanel";
import { formatPrice } from "@/lib/priceUtils";
import { toast } from "sonner";
import { format } from "date-fns";

const { Title, Text } = Typography;

// ── Last follow-up preview ─────────────────────────────────────────────────────
function LastFollowUp({ followUps }: { followUps?: IFollowUpEntry[] }) {
  if (!followUps || followUps.length === 0) return null;
  const last = followUps[0];
  const cfg = OUTCOME_CONFIG[last.outcome] ?? OUTCOME_CONFIG.other;
  return (
    <div style={{ marginTop: 4, display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap" }}>
      <span style={{ fontSize: 10, color: "#94a3b8" }}>Last:</span>
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 3,
          background: cfg.color + "18",
          border: `1px solid ${cfg.color}44`,
          color: cfg.color,
          borderRadius: 6,
          padding: "1px 7px",
          fontSize: 10,
          fontWeight: 700,
        }}
      >
        {cfg.icon} {cfg.label}
      </span>
      {last.note && (
        <Text type="secondary" style={{ fontSize: 10, fontStyle: "italic" }}>
          &ldquo;{last.note.slice(0, 22)}{last.note.length > 22 ? "…" : ""}&rdquo;
        </Text>
      )}
    </div>
  );
}

interface Props {
  initialOrders: IOrderSerializable[];
}

export function CourierMonitorClient({ initialOrders }: Props) {
  const router = useRouter();
  const [orders, setOrders] = useState<IOrderSerializable[]>(initialOrders);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [refreshing, setRefreshing] = useState(false);

  // Modal State
  const [trackingModalOpen, setTrackingModalOpen] = useState(false);
  const [activeConsignmentId, setActiveConsignmentId] = useState("");
  const [activeOrderNumber, setActiveOrderNumber] = useState("");

  const handleRefreshAll = async () => {
    setRefreshing(true);
    toast.info("Pathao থেকে লাইভ স্ট্যাটাস আপডেট করা হচ্ছে...");
    try {
      const res = await refreshActiveShipments();
      if (res.success) {
        toast.success(`${res.updatedCount}টি শিপমেন্ট আপডেট হয়েছে!`);
        // Hard navigate to reload server component data
        window.location.reload();
      } else {
        toast.error(res.error || "শিপমেন্ট রিফ্রেশ করা যায়নি");
      }
    } catch {
      toast.error("রিফ্রেশ করতে সমস্যা হয়েছে");
    } finally {
      setRefreshing(false);
    }
  };

  // Filter + Sort: Delivered always goes to bottom
  const filtered = orders
    .filter((o) => {
      const q = search.toLowerCase().trim();
      const nameMatch = o.shipping?.name.toLowerCase().includes(q);
      const phoneMatch = (o.customerPhone || "").includes(q) || (o.shipping?.phone || "").includes(q);
      const orderNumMatch = o.orderNumber.toLowerCase().includes(q);
      const trackingMatch = (o.courierTrackingId || "").toLowerCase().includes(q);
      const matchesSearch = !q || nameMatch || phoneMatch || orderNumMatch || trackingMatch;

      if (!matchesSearch) return false;

      const statusLower = (o.courierStatus || "").toLowerCase();
      if (activeTab === "on_hold") return statusLower.includes("hold");
      if (activeTab === "ready") return statusLower.includes("ready");
      if (activeTab === "in_transit") return statusLower.includes("transit") || statusLower.includes("picked");
      if (activeTab === "returned") return statusLower.includes("return");
      if (activeTab === "delivered") return statusLower.includes("delivered");

      return true;
    })
    .sort((a, b) => {
      const aDelivered = (a.courierStatus || "").toLowerCase().includes("delivered");
      const bDelivered = (b.courierStatus || "").toLowerCase().includes("delivered");
      if (aDelivered && !bDelivered) return 1;
      if (!aDelivered && bDelivered) return -1;
      return 0;
    });

  // KPI Stats
  const onHoldCount = orders.filter((o) => (o.courierStatus || "").toLowerCase().includes("hold")).length;
  const readyCount = orders.filter((o) => (o.courierStatus || "").toLowerCase().includes("ready")).length;
  const transitCount = orders.filter((o) => {
    const st = (o.courierStatus || "").toLowerCase();
    return st.includes("transit") || st.includes("picked");
  }).length;
  const returnedCount = orders.filter((o) => (o.courierStatus || "").toLowerCase().includes("return")).length;
  const deliveredCount = orders.filter((o) => (o.courierStatus || "").toLowerCase().includes("delivered")).length;

  const openTrackingModal = (cid: string, orderNum: string) => {
    setActiveConsignmentId(cid);
    setActiveOrderNumber(orderNum);
    setTrackingModalOpen(true);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Consignment ID copied!");
  };

  // Desktop Table Columns
  const columns: ColumnsType<IOrderSerializable> = [
    {
      title: "Order & Customer",
      key: "order",
      render: (_, record) => {
        const cleanPhone = (record.shipping?.phone || record.customerPhone).replace(/[^0-9]/g, "");
        const waNumber = cleanPhone.startsWith("88") ? cleanPhone : `88${cleanPhone}`;
        return (
          <div className="space-y-1">
            <Link
              href={`/admin/orders/${record._id}`}
              style={{ fontWeight: 800, color: "#1677ff", fontSize: "14px" }}
              className="hover:underline"
            >
              #{record.orderNumber}
            </Link>
            <Text strong style={{ display: "block", fontSize: "13px" }}>
              {record.shipping?.name}
            </Text>
            <Flex align="center" gap={6}>
              <Text type="secondary" style={{ fontSize: "11px" }}>
                📞 {record.shipping?.phone || record.customerPhone}
              </Text>
              <a href={`https://wa.me/${waNumber}`} target="_blank" rel="noopener noreferrer">
                <Button size="small" type="text" icon={<MessageOutlined style={{ color: "#25D366" }} />} />
              </a>
            </Flex>
          </div>
        );
      },
    },
    {
      title: "Pathao Consignment ID",
      key: "consignment",
      render: (_, record) => (
        <div className="space-y-1">
          <Flex align="center" gap={6}>
            <Text code style={{ fontWeight: 900, fontSize: "13px" }}>
              {record.courierTrackingId}
            </Text>
            <Tooltip title="Copy Consignment ID">
              <Button
                size="small"
                type="text"
                icon={<CopyOutlined style={{ color: "#3b82f6" }} />}
                onClick={() => copyToClipboard(record.courierTrackingId!)}
              />
            </Tooltip>
          </Flex>
          <a
            href={`https://merchant.pathao.com/public-tracking?consignment_id=${record.courierTrackingId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] text-blue-600 hover:underline flex items-center gap-1"
          >
            Pathao Public Link <ExportOutlined style={{ fontSize: 10 }} />
          </a>
        </div>
      ),
    },
    {
      title: "Live Status & Issues",
      key: "status",
      render: (_, record) => {
        const stLower = (record.courierStatus || "").toLowerCase();
        const isHold = stLower.includes("hold");
        const isReturned = stLower.includes("return");
        const isDelivered = stLower.includes("delivered");

        const lastUpdated = record.courierLastUpdated
          ? format(new Date(record.courierLastUpdated), "dd MMM, hh:mm a")
          : null;

        const attempts = record.courierAttemptCount || (
          (record.courierReason && stLower.includes("ready")) ? 2 : 0
        );

        return (
          <div className="space-y-1.5" style={{ maxWidth: 320 }}>
            <div className="flex items-center gap-2 flex-wrap">
              <Tag
                color={
                  isHold
                    ? "warning"
                    : isReturned
                    ? "error"
                    : isDelivered
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
                <span>
                  {isHold ? "⚠️ ON HOLD" : isReturned ? "🚨 RETURNED" : record.courierStatus || "In Transit"}
                </span>
                {!isDelivered && attempts > 1 && (
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
              {lastUpdated && (
                <Text type="secondary" style={{ fontSize: "10px", whiteSpace: "nowrap" }}>
                  🕐 {lastUpdated}
                </Text>
              )}
            </div>

            {!isDelivered && record.courierReason && (
              <Text type="secondary" style={{ fontSize: "11px", color: "#b45309", display: "block", marginTop: 2 }}>
                Reason: {record.courierReason}
              </Text>
            )}
            <LastFollowUp followUps={record.followUps} />
          </div>
        );
      },
    },
    {
      title: "Rider Contact",
      key: "rider",
      render: (_, record) => {
        if (!record.courierRiderPhone && !record.courierRiderName) {
          return <Text type="secondary" style={{ fontSize: "11px" }}>Not Assigned Yet</Text>;
        }
        const cleanRider = (record.courierRiderPhone || "").replace(/[^0-9]/g, "");
        const waRider = cleanRider.startsWith("88") ? cleanRider : `88${cleanRider}`;
        return (
          <div className="space-y-1">
            <Text strong style={{ fontSize: "12px", display: "block" }}>
              👤 {record.courierRiderName || "Rider"}
            </Text>
            {record.courierRiderPhone && (
              <Flex align="center" gap={6}>
                <a href={`tel:${record.courierRiderPhone}`}>
                  <Button size="small" icon={<PhoneOutlined />} style={{ borderRadius: 6, fontSize: "11px" }}>
                    Call
                  </Button>
                </a>
                <a href={`https://wa.me/${waRider}`} target="_blank" rel="noopener noreferrer">
                  <Button size="small" icon={<MessageOutlined style={{ color: "#25D366" }} />} style={{ borderRadius: 6 }} />
                </a>
              </Flex>
            )}
          </div>
        );
      },
    },
    {
      title: "Actions",
      key: "actions",
      align: "center" as const,
      render: (_, record) => {
        const followUps = record.followUps ?? [];
        return (
          <Flex vertical gap={6} align="center">
            <Button
              type="primary"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => openTrackingModal(record.courierTrackingId!, record.orderNumber)}
              style={{ fontWeight: 700, borderRadius: 8, border: "none", boxShadow: "none" }}
            >
              Track Live
            </Button>
            <Popover
              trigger="click"
              placement="leftTop"
              overlayStyle={{ width: 340 }}
              title={
                <Flex align="center" gap={6}>
                  <PlusOutlined style={{ color: "#6366f1" }} />
                  <span style={{ fontWeight: 700, fontSize: 13 }}>#{record.orderNumber}</span>
                </Flex>
              }
              content={
                <FollowUpPanel
                  orderId={record._id}
                  initialFollowUps={followUps}
                  compact
                />
              }
            >
              <Button
                size="small"
                icon={<PlusOutlined />}
                style={{ borderRadius: 8, fontWeight: 700, fontSize: 11 }}
              >
                Follow-up{followUps.length > 0 && (
                  <span style={{ marginLeft: 4, background: "#6366f1", color: "#fff", borderRadius: 8, padding: "0 5px", fontSize: 10, fontWeight: 900 }}>
                    {followUps.length}
                  </span>
                )}
              </Button>
            </Popover>
          </Flex>
        );
      },
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
        <div>
          <Title level={3} style={{ margin: 0, fontWeight: 900 }}>
            🚚 Pathao Courier Monitor
          </Title>
          <Text type="secondary" style={{ fontSize: "13px" }}>
            সরাসরি পাঠাও কোরিয়ারের পার্সেল ট্র্যাকিং, অন-হোল্ড নোটিশ ও রাইডার কনট্যাক্ট ম্যানেজমেন্ট
          </Text>
        </div>

        <Button
          type="primary"
          size="large"
          icon={<ReloadOutlined spin={refreshing} />}
          onClick={handleRefreshAll}
          style={{ fontWeight: 700, borderRadius: 10, background: "#059669", borderColor: "#059669" }}
        >
          Refresh Live Statuses
        </Button>
      </div>

      {/* KPI Stats Grid */}
      <Row gutter={[12, 12]}>
        <Col xs={12} sm={6} md={4.8}>
          <Card style={{ borderRadius: 16 }} styles={{ body: { padding: 14 } }} className="text-center bg-amber-50/50 border-amber-200">
            <Statistic
              title={<Text style={{ fontSize: "11px", fontWeight: 700, color: "#b45309" }}>⚠️ ON HOLD (ALERT)</Text>}
              value={onHoldCount}
              styles={{ content: { fontWeight: 900, fontSize: "22px", color: "#d97706" } }}
            />
          </Card>
        </Col>

        <Col xs={12} sm={6} md={4.8}>
          <Card style={{ borderRadius: 16 }} styles={{ body: { padding: 14 } }} className="text-center bg-blue-50/50 border-blue-200">
            <Statistic
              title={<Text style={{ fontSize: "11px", fontWeight: 700, color: "#1d4ed8" }}>🚴 READY / OUT</Text>}
              value={readyCount}
              styles={{ content: { fontWeight: 900, fontSize: "22px", color: "#2563eb" } }}
            />
          </Card>
        </Col>

        <Col xs={12} sm={6} md={4.8}>
          <Card style={{ borderRadius: 16 }} styles={{ body: { padding: 14 } }} className="text-center">
            <Statistic
              title={<Text type="secondary" style={{ fontSize: "11px", fontWeight: 700 }}>📦 IN TRANSIT</Text>}
              value={transitCount}
              styles={{ content: { fontWeight: 900, fontSize: "22px", color: "#0284c7" } }}
            />
          </Card>
        </Col>

        <Col xs={12} sm={6} md={4.8}>
          <Card style={{ borderRadius: 16 }} styles={{ body: { padding: 14 } }} className="text-center bg-red-50/50 border-red-200">
            <Statistic
              title={<Text style={{ fontSize: "11px", fontWeight: 700, color: "#b91c1c" }}>🚨 RETURNED</Text>}
              value={returnedCount}
              styles={{ content: { fontWeight: 900, fontSize: "22px", color: "#dc2626" } }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} md={4.8}>
          <Card style={{ borderRadius: 16 }} styles={{ body: { padding: 14 } }} className="text-center bg-emerald-50/50 border-emerald-200">
            <Statistic
              title={<Text style={{ fontSize: "11px", fontWeight: 700, color: "#047857" }}>✅ DELIVERED</Text>}
              value={deliveredCount}
              styles={{ content: { fontWeight: 900, fontSize: "22px", color: "#059669" } }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filter Tabs & Search Card */}
      <Card style={{ borderRadius: 16 }} styles={{ body: { padding: "0 16px 12px 16px" } }} className="shadow-sm">
        {/* Tabs — full width so Antd's native overflow/more-menu kicks in */}
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          style={{ marginBottom: 0 }}
          tabBarStyle={{ marginBottom: 0 }}
          tabBarGutter={8}
          items={[
            { key: "all", label: `All Shipments (${orders.length})` },
            { key: "on_hold", label: `⚠️ On Hold (${onHoldCount})` },
            { key: "ready", label: `🚴 Ready (${readyCount})` },
            { key: "in_transit", label: `📦 In Transit (${transitCount})` },
            { key: "returned", label: `🚨 Returned (${returnedCount})` },
            { key: "delivered", label: `✅ Delivered (${deliveredCount})` },
          ]}
        />

        {/* Search — below tabs */}
        <Input
          prefix={<SearchOutlined style={{ color: "#94a3b8", marginRight: 4 }} />}
          placeholder="Search by order #, phone, customer, or consignment ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ borderRadius: 10, marginTop: 10 }}
          allowClear
        />
      </Card>

      {/* Desktop Table View */}
      <div className="hidden md:block">
        <Card style={{ borderRadius: 16 }} styles={{ body: { padding: 0 } }}>
          <Table
            columns={columns}
            dataSource={filtered}
            rowKey={(r) => r._id}
            pagination={{ pageSize: 15 }}
          />
        </Card>
      </div>

      {/* Mobile Cards View */}
      <div className="flex flex-col gap-3.5 md:hidden mt-3.5">
        {filtered.length === 0 ? (
          <Card style={{ borderRadius: 16 }} styles={{ body: { padding: 30 } }}>
            <div className="text-center text-slate-400 text-xs font-medium">
              No shipment records match your filter
            </div>
          </Card>
        ) : (
          filtered.map((item) => {
            const stLower = (item.courierStatus || "").toLowerCase();
            const isHold = stLower.includes("hold");
            const isReturned = stLower.includes("return");
            const isDelivered = stLower.includes("delivered");

            const cleanPhone = (item.shipping?.phone || item.customerPhone).replace(/[^0-9]/g, "");
            const waNumber = cleanPhone.startsWith("88") ? cleanPhone : `88${cleanPhone}`;

            const lastUpdated = item.courierLastUpdated
              ? format(new Date(item.courierLastUpdated), "dd MMM, hh:mm a")
              : null;

            return (
              <Card
                key={item._id}
                style={{ borderRadius: 16, marginBottom: 0, border: "1px solid #e2e8f0" }}
                styles={{ body: { padding: 14 } }}
                className="shadow-sm"
              >
                <div className="space-y-3">
                  {/* Top Row: Order # & Status Tag + Date */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <Link
                      href={`/admin/orders/${item._id}`}
                      style={{ fontWeight: 800, color: "#1677ff", fontSize: "14px" }}
                    >
                      #{item.orderNumber}
                    </Link>

                    {(() => {
                      const attempts = item.courierAttemptCount || (
                        (item.courierReason && stLower.includes("ready")) ? 2 : 0
                      );

                      return (
                        <div className="flex items-center gap-2 flex-wrap">
                          <Tag
                            color={
                              isHold
                                ? "warning"
                                : isReturned
                                ? "error"
                                : isDelivered
                                ? "success"
                                : "processing"
                            }
                            style={{
                              fontWeight: 900,
                              fontSize: "11px",
                              borderRadius: 6,
                              margin: 0,
                              padding: "2px 8px",
                              display: "inline-flex",
                              alignItems: "center",
                            }}
                          >
                            <span>
                              {isHold ? "⚠️ ON HOLD" : isReturned ? "🚨 RETURNED" : item.courierStatus || "In Transit"}
                            </span>
                            {!isDelivered && attempts > 1 && (
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
                          {lastUpdated && (
                            <Text type="secondary" style={{ fontSize: "10px", whiteSpace: "nowrap" }}>
                              🕐 {lastUpdated}
                            </Text>
                          )}
                        </div>
                      );
                    })()}
                  </div>

                  {/* Clean Reason without border box or extra icon */}
                  {!isDelivered && item.courierReason && (
                    <Text type="secondary" style={{ fontSize: "11px", color: "#b45309", display: "block", marginTop: -2 }}>
                      Reason: {item.courierReason}
                    </Text>
                  )}

                  {/* Customer Info */}
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 space-y-1">
                    <Text strong style={{ fontSize: "13px", display: "block" }}>
                      👤 {item.shipping?.name}
                    </Text>
                    <Flex align="center" justify="space-between">
                      <Text type="secondary" style={{ fontSize: "12px" }}>
                        📞 {item.shipping?.phone || item.customerPhone}
                      </Text>
                      <a href={`https://wa.me/${waNumber}`} target="_blank" rel="noopener noreferrer">
                        <Button
                          size="small"
                          icon={<MessageOutlined style={{ fontSize: "11px" }} />}
                          style={{ background: "#25D366", borderColor: "#25D366", color: "#fff", borderRadius: 6, fontSize: "11px", fontWeight: 700 }}
                        >
                          WhatsApp
                        </Button>
                      </a>
                    </Flex>
                  </div>

                  {/* Consignment ID */}
                  <div className="flex items-center justify-between text-xs bg-slate-100/70 p-2 rounded-xl">
                    <Text code style={{ fontWeight: 900 }}>
                      {item.courierTrackingId}
                    </Text>
                    <Button
                      size="small"
                      type="text"
                      icon={<CopyOutlined style={{ color: "#3b82f6" }} />}
                      onClick={() => copyToClipboard(item.courierTrackingId!)}
                    >
                      Copy
                    </Button>
                  </div>

                  {/* Rider Info if available */}
                  {item.courierRiderPhone && (
                    <div className="bg-blue-50 border border-blue-200 p-2.5 rounded-xl flex items-center justify-between text-xs">
                      <Text strong style={{ color: "#1e3a8a" }}>
                        🚴 {item.courierRiderName || "Rider"}: {item.courierRiderPhone}
                      </Text>
                      <a href={`tel:${item.courierRiderPhone}`}>
                        <Button size="small" type="primary" icon={<PhoneOutlined />} style={{ borderRadius: 6 }}>
                          Call
                        </Button>
                      </a>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="pt-2 border-t border-slate-100 space-y-2">
                    {/* Last follow-up preview — shows even without clicking */}
                    {(item.followUps?.length ?? 0) > 0 && (
                      <div
                        style={{
                          background: "#f5f3ff",
                          border: "1px solid #e0e7ff",
                          borderRadius: 10,
                          padding: "6px 10px",
                        }}
                      >
                        <div style={{ fontSize: 10, color: "#94a3b8", marginBottom: 3, fontWeight: 600 }}>
                          📋 Last Follow-up
                        </div>
                        <LastFollowUp followUps={item.followUps} />
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between gap-2">
                      <Popover
                        trigger="click"
                        placement="topLeft"
                        overlayStyle={{ width: 320 }}
                        title={
                          <Flex align="center" gap={6}>
                            <PlusOutlined style={{ color: "#6366f1" }} />
                            <span style={{ fontWeight: 700, fontSize: 13 }}>#{item.orderNumber}</span>
                          </Flex>
                        }
                        content={
                          <FollowUpPanel
                            orderId={item._id}
                            initialFollowUps={item.followUps ?? []}
                            compact
                          />
                        }
                      >
                        <Button
                          size="small"
                          icon={<PlusOutlined />}
                          style={{
                            borderRadius: 8,
                            fontWeight: 700,
                            fontSize: 11,
                            borderColor: "#6366f1",
                            color: "#6366f1",
                          }}
                        >
                          {(item.followUps?.length ?? 0) === 0 ? "Add Follow-up" : "Follow-up"}
                          {(item.followUps?.length ?? 0) > 0 && (
                            <span style={{ marginLeft: 4, background: "#6366f1", color: "#fff", borderRadius: 8, padding: "0 5px", fontSize: 10, fontWeight: 900 }}>
                              {item.followUps!.length}
                            </span>
                          )}
                        </Button>
                      </Popover>
                      <Button
                        type="primary"
                        size="small"
                        icon={<EyeOutlined />}
                        onClick={() => openTrackingModal(item.courierTrackingId!, item.orderNumber)}
                        style={{ borderRadius: 8, fontWeight: 700, border: "none", boxShadow: "none" }}
                      >
                        Track Live ➜
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Pathao Live Tracking Modal */}
      <PathaoTrackingModal
        open={trackingModalOpen}
        onClose={() => setTrackingModalOpen(false)}
        consignmentId={activeConsignmentId}
        orderNumber={activeOrderNumber}
      />
    </div>
  );
}
