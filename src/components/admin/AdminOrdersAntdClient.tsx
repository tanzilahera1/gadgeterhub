// src/components/admin/AdminOrdersAntdClient.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Table, Tag, Input, Select, Button, Card, Space, Typography, Badge, Flex, Tooltip, Modal } from "antd";
import type { ColumnsType } from "antd/es/table";
import { SearchOutlined, EyeOutlined, ShoppingCartOutlined, AlertOutlined, PrinterOutlined, EditOutlined, SaveOutlined, CarOutlined, ReloadOutlined } from "@ant-design/icons";
import { toast } from "sonner";
import { IOrder, CHANNEL_LABELS } from "@/types/order";
import { formatPrice } from "@/lib/priceUtils";
import { format } from "date-fns";
import { getZoneBadgeInfo } from "@/lib/shipping";
import { StatusUpdater } from "@/components/admin/StatusUpdater";
import { CreateOrderModal } from "@/components/admin/CreateOrderModal";
import { PathaoTrackingModal } from "@/components/admin/PathaoTrackingModal";
import { updateOrderTrackingId } from "@/actions/pathaoTracking";

import { AdminOrderMobileCard } from "@/components/admin/AdminOrderMobileCard";

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

export function AdminOrdersAntdClient({
  orders,
  products,
  isDashboard = false,
}: {
  orders: IOrder[];
  products: ProductOption[];
  isDashboard?: boolean;
}) {
  const router = useRouter();
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [channelFilter, setChannelFilter] = useState<string>("all");

  // Pathao Tracking Modal State
  const [trackingModalOpen, setTrackingModalOpen] = useState(false);
  const [activeConsignmentId, setActiveConsignmentId] = useState("");
  const [activeOrderNumber, setActiveOrderNumber] = useState("");

  // Edit Consignment ID Modal State
  const [editConsignmentModalOpen, setEditConsignmentModalOpen] = useState(false);
  const [editingOrderId, setEditingOrderId] = useState("");
  const [editingOrderNumber, setEditingOrderNumber] = useState("");
  const [inputConsignmentId, setInputConsignmentId] = useState("");
  const [savingConsignment, setSavingConsignment] = useState(false);

  // Per-row sync state
  const [syncingOrderId, setSyncingOrderId] = useState("");

  const openTrackingModal = (cid: string, orderNum: string) => {
    setActiveConsignmentId(cid);
    setActiveOrderNumber(orderNum);
    setTrackingModalOpen(true);
  };

  const openEditConsignmentModal = (orderId: string, orderNum: string, currentId?: string) => {
    setEditingOrderId(orderId);
    setEditingOrderNumber(orderNum);
    setInputConsignmentId(currentId || "");
    setEditConsignmentModalOpen(true);
  };

  const syncSingleOrderStatus = async (orderId: string, consignmentId: string) => {
    setSyncingOrderId(orderId);
    try {
      const res = await updateOrderTrackingId(orderId, consignmentId);
      if (res.success) {
        toast.success("লাইভ স্ট্যাটাস আপডেট হয়েছে!");
        router.refresh();
      } else {
        toast.error(res.error || "স্ট্যাটাস আপডেট করা যায়নি");
      }
    } catch {
      toast.error("স্ট্যাটাস আপডেট করতে সমস্যা হয়েছে");
    } finally {
      setSyncingOrderId("");
    }
  };

  const handleSaveConsignmentModal = async () => {
    if (!inputConsignmentId.trim()) {
      return toast.warning("Please enter a Consignment ID");
    }
    setSavingConsignment(true);
    try {
      const res = await updateOrderTrackingId(editingOrderId, inputConsignmentId);
      if (res.success) {
        toast.success("Pathao Consignment ID saved and live status synced!");
        setEditConsignmentModalOpen(false);
        router.refresh();
      } else {
        toast.error(res.error || "Failed to save Consignment ID");
      }
    } catch {
      toast.error("Error saving Consignment ID");
    } finally {
      setSavingConsignment(false);
    }
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      !searchText ||
      order.orderNumber.toLowerCase().includes(searchText.toLowerCase()) ||
      order.shipping.name.toLowerCase().includes(searchText.toLowerCase()) ||
      order.shipping.phone.includes(searchText);

    const matchesStatus =
      statusFilter === "all" || order.orderStatus === statusFilter;

    const matchesChannel =
      channelFilter === "all" || (order.channelSource || "web") === channelFilter;

    return matchesSearch && matchesStatus && matchesChannel;
  });

  const pendingCount = orders.filter((o) => o.orderStatus === "pending").length;

  const columns: ColumnsType<IOrder> = [
    {
      title: "Order ID & Channel",
      dataIndex: "orderNumber",
      key: "orderNumber",
      render: (_, record) => {
        const channelKey = record.channelSource || "web";
        const channelLabel = CHANNEL_LABELS[channelKey] || "Website";
        return (
          <Flex vertical gap={2}>
            <Text code style={{ fontWeight: 800, fontSize: "13px" }}>
            {record.orderNumber}
            </Text>
            <Tag color="blue" style={{ fontSize: "10px", borderRadius: "6px", width: "fit-content" }}>
              {channelLabel}
            </Tag>
          </Flex>
        );
      },
    },
    {
      title: "Customer",
      key: "customer",
      render: (_, record) => {
        const vipDeduction = (record.vipPrivilege && record.vipPrivilege > 0) ? record.vipPrivilege : (record.discount || 0);
        const districtName = record.shipping?.district;
        return (
          <div>
            <Flex align="center" gap={6} wrap="wrap">
              <Text strong style={{ display: "block", fontSize: "13px" }}>
                {record.shipping.name}
              </Text>
              {vipDeduction > 0 && (
                <Tag color="gold" style={{ margin: 0, fontSize: "10px", fontWeight: 900, padding: "0 4px" }}>
                  🌟 VIP
                </Tag>
              )}
              {districtName && (
                <Tag
                  variant="filled"
                  style={{
                    margin: 0,
                    fontSize: "10px",
                    fontWeight: 700,
                    padding: "0 6px",
                    borderRadius: 4,
                    background: "#f1f5f9",
                    color: "#475569",
                  }}
                >
                  📍 {districtName}
                </Tag>
              )}
            </Flex>
            <Text type="secondary" style={{ fontSize: "11px" }}>
              {record.shipping.phone}
            </Text>
          </div>
        );
      },
    },
    {
      title: "Date",
      key: "date",
      render: (_, record) => (
        <div>
          <Text style={{ display: "block", fontSize: "12px", fontWeight: 600 }}>
            {format(new Date(record.createdAt!), "dd MMM, yyyy")}
          </Text>
          <Text type="secondary" style={{ fontSize: "10px" }}>
            {format(new Date(record.createdAt!), "hh:mm a")}
          </Text>
        </div>
      ),
    },
    {
      title: "Amount (COD)",
      key: "amount",
      render: (_, record) => (
        <div>
          <Text strong style={{ fontSize: "14px", color: "#0f172a", display: "block" }}>
            {formatPrice(Math.max(0, record.total - (record.advancePaid || 0)))}
          </Text>
          {Boolean(record.advancePaid && record.advancePaid > 0) && (
            <Text type="secondary" style={{ fontSize: "10px", color: "#2563eb", fontWeight: 700 }}>
              Adv Paid: {formatPrice(record.advancePaid || 0)}
            </Text>
          )}
        </div>
      ),
    },
    {
      title: "Payment",
      key: "payment",
      render: (_, record) => (
        <Tag color={record.paymentMethod === "mobile" ? "cyan" : "default"}>
          {record.paymentMethod?.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: "Courier Status",
      key: "courier",
      render: (_, record) => {
        if (!record.courierTrackingId) {
          return (
            <Button
              size="small"
              type="dashed"
              style={{ fontSize: "11px", borderRadius: 6, fontWeight: 700 }}
              onClick={() => openEditConsignmentModal(record._id.toString(), record.orderNumber)}
            >
              + Add Pathao ID
            </Button>
          );
        }

        const stLower = (record.courierStatus || "").toLowerCase();
        const isHold = stLower.includes("hold");
        const isReturned = stLower.includes("return");
        const isDelivered = stLower.includes("delivered");

        // Local per-row syncing state
        const isSyncing = syncingOrderId === record._id.toString();

        return (
          <div className="space-y-1">
            <Flex align="center" gap={4}>
              <Text code style={{ fontSize: "11px", fontWeight: 900 }}>
                {record.courierTrackingId}
              </Text>
              <Tooltip title="Edit Consignment ID">
                <Button
                  size="small"
                  type="text"
                  icon={<EditOutlined style={{ fontSize: "11px", color: "#64748b" }} />}
                  onClick={() =>
                    openEditConsignmentModal(
                      record._id.toString(),
                      record.orderNumber,
                      record.courierTrackingId
                    )
                  }
                />
              </Tooltip>
              <Tooltip title="Sync live Pathao status now">
                <Button
                  size="small"
                  type="text"
                  loading={isSyncing}
                  icon={<ReloadOutlined style={{ fontSize: "11px", color: "#3b82f6" }} />}
                  onClick={() => syncSingleOrderStatus(record._id.toString(), record.courierTrackingId!)}
                />
              </Tooltip>
            </Flex>
            {(() => {
              const attempts = record.courierAttemptCount || (
                (record.courierReason && stLower.includes("ready")) ? 2 : 0
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
                    fontSize: "10px",
                    margin: 0,
                    borderRadius: 4,
                    cursor: "pointer",
                    padding: "1px 6px",
                    display: "inline-flex",
                    alignItems: "center",
                  }}
                  onClick={() => openTrackingModal(record.courierTrackingId!, record.orderNumber)}
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
              );
            })()}
          </div>
        );
      },
    },
    {
      title: "Status",
      key: "status",
      render: (_, record) => (
        <StatusUpdater
          orderId={record._id.toString()}
          currentStatus={record.orderStatus || "pending"}
        />
      ),
    },
    {
      title: "Action",
      key: "action",
      align: "right",
      render: (_, record) => (
        <Link href={`/admin/orders/${record._id?.toString()}`}>
          <Button icon={<EyeOutlined />} type="default" shape="circle" />
        </Link>
      ),
    },
  ];

  return (
    <div style={{ padding: 0 }} className="space-y-4">
      {/* Header Bar - Hidden in Dashboard */}
      {!isDashboard && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div style={{ textAlign: "center" }}>
          <Title level={3} style={{ margin: 0, fontWeight: 900 }}>
            Orders Management
          </Title>
          <Text type="secondary" style={{ fontSize: "12px" }}>
            Track and manage all customer purchases across all sales channels.
          </Text>
        </div>

        <div className="flex flex-wrap items-center justify-center sm:justify-end gap-3 w-full sm:w-auto">
          <Badge count={pendingCount} overflowCount={99}>
            <Button
              icon={<AlertOutlined />}
              type={statusFilter === "pending" ? "primary" : "dashed"}
              danger
              onClick={() =>
                setStatusFilter((prev) => (prev === "pending" ? "all" : "pending"))
              }
              style={{ fontWeight: 700 }}
            >
              Pending Orders
            </Button>
          </Badge>

          {pendingCount > 0 && (
            <Button
              icon={<PrinterOutlined />}
              onClick={() => {
                const pendingIds = orders
                  .filter((o) => o.orderStatus === "pending")
                  .map((o) => o._id.toString());

                if (pendingIds.length === 0) return toast.error("কোনো পেন্ডিং অর্ডার নেই");

                // Open first pending invoice or batch window
                window.open(`/admin/orders/${pendingIds[0]}/invoice`, "_blank");
              }}
              style={{ fontWeight: 700 }}
            >
              Batch Print A5 ({pendingCount})
            </Button>
          )}

          <CreateOrderModal products={products} />
        </div>
      </div>
      )}

      {/* Filters Toolbar - Hidden in Dashboard */}
      {!isDashboard && (
        <Card
          style={{ borderRadius: 16 }}
          styles={{ body: { padding: "12px 16px" } }}
          className="border border-slate-200 bg-white shadow-sm"
        >
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 w-full">
          <Input
            placeholder="Search by Order ID or Name..."
            prefix={<SearchOutlined style={{ color: "#94a3b8", marginRight: 4 }} />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ borderRadius: 10 }}
            className="w-full sm:w-80"
            allowClear
          />

          <Space wrap className="w-full sm:w-auto justify-between sm:justify-start">
            <Select
              defaultValue="all"
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: 130 }}
              options={[
                { value: "all", label: "All Statuses" },
                { value: "pending", label: "Pending" },
                { value: "processing", label: "Processing" },
                { value: "shipped", label: "Shipped" },
                { value: "delivered", label: "Delivered" },
                { value: "cancelled", label: "Cancelled" },
              ]}
            />

            <Select
              defaultValue="all"
              value={channelFilter}
              onChange={setChannelFilter}
              style={{ width: 150 }}
              options={[
                { value: "all", label: "All Channels" },
                ...Object.entries(CHANNEL_LABELS).map(([k, label]) => ({
                  value: k,
                  label,
                })),
              ]}
            />
          </Space>
        </div>
      </Card>
      )}

      {/* DESKTOP VIEW: Antd Data Table */}
      <div className="hidden md:block">
        <Card style={{ borderRadius: isDashboard ? 0 : 16, overflow: "hidden", border: isDashboard ? 'none' : undefined }} styles={{ body: { padding: 0 } }}>
          <Table
            columns={columns}
            dataSource={filteredOrders}
            rowKey={(record) => record._id.toString()}
            scroll={{ x: 800 }}
            pagination={isDashboard ? false : { pageSize: 10, showSizeChanger: true }}
            locale={{
              emptyText: (
                <div style={{ padding: "40px 0", textAlign: "center" }}>
                  <ShoppingCartOutlined style={{ fontSize: 40, color: "#ccc" }} />
                  <p style={{ marginTop: 8, fontWeight: 700, color: "#999" }}>
                    No Orders Found
                  </p>
                </div>
              ),
            }}
          />
        </Card>
      </div>

      {/* MOBILE VIEW: Ultra Responsive Fluid Antd Cards */}
      <div className="block md:hidden mt-3">
        {filteredOrders.length > 0 ? (
          filteredOrders.map((order) => (
            <AdminOrderMobileCard
              key={order._id.toString()}
              order={order}
              marginBottom={8}
              onAddPathaoId={openEditConsignmentModal}
            />
          ))
        ) : (
          <Card style={{ borderRadius: 16 }} styles={{ body: { padding: 30 } }}>
            <div style={{ textAlign: "center" }}>
              <ShoppingCartOutlined style={{ fontSize: 36, color: "#ccc" }} />
              <p style={{ marginTop: 8, fontWeight: 700, color: "#999" }}>
                No Orders Found
              </p>
            </div>
          </Card>
        )}
      </div>

      <PathaoTrackingModal
        open={trackingModalOpen}
        onClose={() => setTrackingModalOpen(false)}
        consignmentId={activeConsignmentId}
        orderNumber={activeOrderNumber}
      />

      {/* Quick Edit Consignment ID Modal */}
      <Modal
        title={
          <Flex align="center" gap={8}>
            <CarOutlined style={{ color: "#e11d48", fontSize: 18 }} />
            <span>Pathao Consignment ID (Order #{editingOrderNumber})</span>
          </Flex>
        }
        open={editConsignmentModalOpen}
        onCancel={() => setEditConsignmentModalOpen(false)}
        onOk={handleSaveConsignmentModal}
        confirmLoading={savingConsignment}
        okText="Save & Sync Live Status"
        cancelText="Cancel"
        style={{ borderRadius: 16 }}
        styles={{ body: { padding: "16px 0 8px 0" } }}
      >
        <div className="space-y-3">
          <Text type="secondary" style={{ fontSize: "12px", display: "block" }}>
            পাঠাও হাব থেকে বুকিং করার পর পাওয়া Consignment ID (যেমন: <Text code>SG030826FV2JHW</Text>) নিচে লিখুন।
          </Text>
          <Input
            placeholder="e.g. SG030826FV2JHW"
            value={inputConsignmentId}
            onChange={(e) => setInputConsignmentId(e.target.value)}
            style={{ borderRadius: 10, height: 40 }}
            allowClear
          />
        </div>
      </Modal>
    </div>
  );
}
