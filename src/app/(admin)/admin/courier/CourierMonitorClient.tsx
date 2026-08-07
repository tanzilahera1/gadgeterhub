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
  Select,
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
  ClockCircleOutlined,
  EllipsisOutlined,
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

  const isOrderAssigned = (o: IOrderSerializable) => {
    const lastDesc = (o.courierLastLogDesc || "").toLowerCase();
    if (lastDesc && lastDesc.includes("assigned to")) {
      return true;
    }
    const statusLower = (o.courierStatus || "").toLowerCase();
    return (
      statusLower.includes("assign") ||
      (statusLower.includes("ready") && Boolean(o.courierRiderPhone || o.courierRiderName))
    );
  };

  // Update parent state when a follow-up is added so it persists across popover open/close
  const handleFollowUpAdded = (orderId: string, newEntry: import("@/types/order").IFollowUpEntry) => {
    setOrders((prev) =>
      prev.map((o) =>
        o._id === orderId
          ? { ...o, followUps: [newEntry, ...(o.followUps ?? [])] }
          : o
      )
    );
  };

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
      if (activeTab === "assigned") return isOrderAssigned(o);
      if (activeTab === "on_hold") return statusLower.includes("hold") && !isOrderAssigned(o);
      if (activeTab === "ready") return statusLower.includes("ready") && !isOrderAssigned(o);
      if (activeTab === "in_transit") return (statusLower.includes("transit") || statusLower.includes("picked")) && !isOrderAssigned(o);
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
  const assignedCount = orders.filter(isOrderAssigned).length;
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
      className: "align-top",
      render: (_, record) => {
        const cleanPhone = (record.shipping?.phone || record.customerPhone).replace(/[^0-9]/g, "");
        const waNumber = cleanPhone.startsWith("88") ? cleanPhone : `88${cleanPhone}`;
        return (
          <div className="space-y-1">
            <Link
              href={`/admin/orders/${record._id}`}
            >
              <Text code style={{ fontWeight: 800, fontSize: "13px", color: "#1677ff" }} className="hover:underline">
                {record.orderNumber}
              </Text>
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
      className: "align-top",
      render: (_, record) => (
        <div className="space-y-1">
          <Flex align="center" gap={4}>
            <Text code style={{ fontWeight: 900, fontSize: "11px" }}>
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
      className: "align-top",
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
                  fontSize: "10px",
                  borderRadius: 4,
                  margin: 0,
                  padding: "1px 6px",
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
                      fontSize: "9px",
                      fontWeight: 900,
                      borderRadius: "8px",
                      padding: "0 5px",
                      marginLeft: "4px",
                      display: "inline-block",
                      lineHeight: "12px",
                      boxShadow: "0 1px 2px rgba(239, 68, 68, 0.3)",
                    }}
                  >
                    {attempts}
                  </span>
                )}
              </Tag>
              {lastUpdated && (
                <Text type="secondary" style={{ fontSize: "10px", whiteSpace: "nowrap" }}>
                  <ClockCircleOutlined style={{ fontSize: "9px", marginRight: 2 }} />
                  {lastUpdated}
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
      className: "align-top",
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
      onCell: () => ({ style: { verticalAlign: 'top' } }),
      align: "center" as const,
      className: "align-top",
      render: (_, record) => {
        const followUps = record.followUps ?? [];
        return (
          <Flex vertical gap={6} align="center">
            <Button
              type="primary"
              size="small"
              shape="round"
              icon={<EyeOutlined />}
              style={{ fontSize: "11px", fontWeight: 700 }}
              onClick={() => openTrackingModal(record.courierTrackingId!, record.orderNumber)}
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
                  onAdded={(entry) => handleFollowUpAdded(record._id, entry)}
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
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card style={{ borderRadius: 16 }} styles={{ body: { padding: 14 } }} className="text-center bg-indigo-50/60 border-indigo-200">
          <Statistic
            title={<Text style={{ fontSize: "11px", fontWeight: 700, color: "#4338ca" }}>🎯 ASSIGNED</Text>}
            value={assignedCount}
            styles={{ content: { fontWeight: 900, fontSize: "22px", color: "#4f46e5" } }}
          />
        </Card>

        <Card style={{ borderRadius: 16 }} styles={{ body: { padding: 14 } }} className="text-center bg-amber-50/50 border-amber-200">
          <Statistic
            title={<Text style={{ fontSize: "11px", fontWeight: 700, color: "#b45309" }}>⚠️ ON HOLD (ALERT)</Text>}
            value={onHoldCount}
            styles={{ content: { fontWeight: 900, fontSize: "22px", color: "#d97706" } }}
          />
        </Card>

        <Card style={{ borderRadius: 16 }} styles={{ body: { padding: 14 } }} className="text-center bg-blue-50/50 border-blue-200">
          <Statistic
            title={<Text style={{ fontSize: "11px", fontWeight: 700, color: "#1d4ed8" }}>🚴 READY / OUT</Text>}
            value={readyCount}
            styles={{ content: { fontWeight: 900, fontSize: "22px", color: "#2563eb" } }}
          />
        </Card>

        <Card style={{ borderRadius: 16 }} styles={{ body: { padding: 14 } }} className="text-center">
          <Statistic
            title={<Text type="secondary" style={{ fontSize: "11px", fontWeight: 700 }}>📦 IN TRANSIT</Text>}
            value={transitCount}
            styles={{ content: { fontWeight: 900, fontSize: "22px", color: "#0284c7" } }}
          />
        </Card>

        <Card style={{ borderRadius: 16 }} styles={{ body: { padding: 14 } }} className="text-center bg-red-50/50 border-red-200">
          <Statistic
            title={<Text style={{ fontSize: "11px", fontWeight: 700, color: "#b91c1c" }}>🚨 RETURNED</Text>}
            value={returnedCount}
            styles={{ content: { fontWeight: 900, fontSize: "22px", color: "#dc2626" } }}
          />
        </Card>

        <Card style={{ borderRadius: 16 }} styles={{ body: { padding: 14 } }} className="text-center bg-emerald-50/50 border-emerald-200">
          <Statistic
            title={<Text style={{ fontSize: "11px", fontWeight: 700, color: "#047857" }}>✅ DELIVERED</Text>}
            value={deliveredCount}
            styles={{ content: { fontWeight: 900, fontSize: "22px", color: "#059669" } }}
          />
        </Card>
      </div>

      {/* Filter Tabs & Search Card */}
      <Card style={{ borderRadius: 16 }} styles={{ body: { padding: "12px 16px 12px 16px" } }} className="shadow-sm">
        {/* Mobile View: Clean Antd Select Dropdown */}
        <div className="block sm:hidden mb-2.5">
          <Text type="secondary" style={{ fontSize: "11px", fontWeight: 700, display: "block", marginBottom: 4 }}>
            FILTER BY STATUS:
          </Text>
          <Select
            value={activeTab}
            onChange={setActiveTab}
            style={{ width: "100%" }}
            size="large"
            options={[
              { value: "all", label: `All Shipments (${orders.length})` },
              { value: "assigned", label: `🎯 Assigned (${assignedCount})` },
              { value: "on_hold", label: `⚠️ On Hold (${onHoldCount})` },
              { value: "ready", label: `🚴 Ready (${readyCount})` },
              { value: "in_transit", label: `📦 In Transit (${transitCount})` },
              { value: "returned", label: `🚨 Returned (${returnedCount})` },
              { value: "delivered", label: `✅ Delivered (${deliveredCount})` },
            ]}
          />
        </div>

        {/* Desktop / Tablet View: Standard Antd Tabs */}
        <div className="hidden sm:block">
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            style={{ marginBottom: 0 }}
            tabBarStyle={{ marginBottom: 0 }}
            items={[
              { key: "all", label: `All Shipments (${orders.length})` },
              { key: "assigned", label: `🎯 Assigned (${assignedCount})` },
              { key: "on_hold", label: `⚠️ On Hold (${onHoldCount})` },
              { key: "ready", label: `🚴 Ready (${readyCount})` },
              { key: "in_transit", label: `📦 In Transit (${transitCount})` },
              { key: "returned", label: `🚨 Returned (${returnedCount})` },
              { key: "delivered", label: `✅ Delivered (${deliveredCount})` },
            ]}
          />
        </div>

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
      <div className="hidden lg:block">
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
      <div className="flex flex-col gap-3.5 lg:hidden mt-3.5">
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
                styles={{ body: { padding: 16 } }}
                className="shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="space-y-3">
                  {/* 3:2 Grid Ratio Layout — 3/5 Left Column, 2/5 Right Column */}
                  <div className="grid grid-cols-5 gap-2 pt-1 items-start">
                    {/* Column 1 (Left): 3/5 Width (60%) */}
                    <div className="col-span-3 space-y-3.5 text-left min-w-0">
                      {/* Order ID Badge with bottom margin */}
                      <div className="mb-2">
                        <Link href={`/admin/orders/${item._id}`}>
                          <Text code style={{ fontWeight: 900, fontSize: "14px", color: "#1677ff", margin: 0 }} className="hover:underline">
                            {item.orderNumber}
                          </Text>
                        </Link>
                      </div>

                      {/* Customer Info */}
                      <div>
                        <Text strong style={{ fontSize: "14px", display: "block", color: "#0f172a" }}>
                          👤 {item.shipping?.name}
                        </Text>
                        <Text type="secondary" style={{ fontSize: "12px", display: "block", marginTop: 1 }}>
                          📞 {item.shipping?.phone || item.customerPhone}
                        </Text>
                      </div>

                      {/* Rider Info if available */}
                      {item.courierRiderPhone && (
                        <div className="text-xs pt-0.5">
                          <span className="text-slate-700 font-medium">
                            🚴 Rider: <Text strong style={{ color: "#1e3a8a" }}>{item.courierRiderName || "Rider"}</Text> ({item.courierRiderPhone})
                          </span>
                        </div>
                      )}

                      {/* Last Follow-up preview if available */}
                      {(item.followUps?.length ?? 0) > 0 && (
                        <div className="pt-0.5">
                          <Text type="secondary" style={{ fontSize: 10, fontWeight: 700, display: "block", marginBottom: 2 }}>
                            📋 LAST FOLLOW-UP:
                          </Text>
                          <LastFollowUp followUps={item.followUps} />
                        </div>
                      )}

                      {/* Add Follow-up button */}
                      <div className="pt-1">
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
                              onAdded={(entry) => handleFollowUpAdded(item._id, entry)}
                            />
                          }
                        >
                          <Button
                            type="text"
                            size="small"
                            icon={<PlusOutlined style={{ color: "#6366f1" }} />}
                            style={{
                              fontWeight: 700,
                              color: "#6366f1",
                              fontSize: "12px",
                              padding: "0 4px",
                            }}
                          >
                            Add Follow-up
                          </Button>
                        </Popover>
                      </div>
                    </div>

                    {/* Column 2 (Right): 2/5 Width (40%) with Left Padding */}
                    <div className="col-span-2 space-y-3.5 text-left min-w-0 flex flex-col items-start pl-3">
                      {/* Status Tag with bottom margin */}
                      <div className="mb-2">
                        {(() => {
                          const attempts = item.courierAttemptCount || (
                            (item.courierReason && stLower.includes("ready")) ? 2 : 0
                          );

                          return (
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
                                cursor: "pointer",
                              }}
                              onClick={() => openTrackingModal(item.courierTrackingId!, item.orderNumber)}
                            >
                              <span>
                                {isHold ? "⚠️ ON HOLD" : isReturned ? "🚨 RETURNED" : item.courierStatus || "In Transit"}
                              </span>
                              {!isDelivered && attempts > 1 && (
                                <span
                                  style={{
                                    backgroundColor: "#ef4444",
                                    color: "#ffffff",
                                    fontSize: "9px",
                                    fontWeight: 900,
                                    borderRadius: "8px",
                                    padding: "0 5px",
                                    marginLeft: "4px",
                                    display: "inline-block",
                                    lineHeight: "12px",
                                  }}
                                >
                                  {attempts}
                                </span>
                              )}
                            </Tag>
                          );
                        })()}
                      </div>

                      {/* Clean Reason text */}
                      {!isDelivered && item.courierReason && (
                        <Text type="secondary" style={{ fontSize: "12px", color: "#b45309", display: "block" }}>
                          ⚠️ Reason: {item.courierReason}
                        </Text>
                      )}

                      {/* Consignment ID Block */}
                      <div>
                        <Text type="secondary" style={{ fontSize: "11px", fontWeight: 600, display: "block", color: "#64748b" }}>
                          Consignment ID:
                        </Text>
                        <div className="flex items-center justify-start gap-1.5 mt-0.5">
                          <Text
                            code
                            style={{ fontWeight: 800, fontSize: "12px", color: "#1677ff", cursor: "pointer", margin: 0 }}
                            onClick={() => openTrackingModal(item.courierTrackingId!, item.orderNumber)}
                          >
                            {item.courierTrackingId}
                          </Text>
                          <Tooltip title="Copy Consignment ID">
                            <Button
                              size="small"
                              type="text"
                              icon={<CopyOutlined style={{ color: "#3b82f6", fontSize: 13 }} />}
                              onClick={() => copyToClipboard(item.courierTrackingId!)}
                              style={{ height: 22, width: 22, padding: 0 }}
                            />
                          </Tooltip>
                        </div>
                      </div>

                      {/* WhatsApp Button */}
                      <div className="pt-1">
                        <a href={`https://wa.me/${waNumber}`} target="_blank" rel="noopener noreferrer">
                          <Button
                            size="small"
                            icon={<MessageOutlined style={{ fontSize: "11px" }} />}
                            style={{
                              background: "#25D366",
                              borderColor: "#25D366",
                              color: "#fff",
                              borderRadius: 6,
                              fontSize: "12px",
                              fontWeight: 700,
                            }}
                          >
                            WhatsApp
                          </Button>
                        </a>
                      </div>
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
