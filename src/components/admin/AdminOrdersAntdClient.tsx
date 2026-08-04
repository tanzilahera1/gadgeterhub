// src/components/admin/AdminOrdersAntdClient.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { Table, Tag, Input, Select, Button, Card, Space, Typography, Badge, Flex } from "antd";
import type { ColumnsType } from "antd/es/table";
import { SearchOutlined, EyeOutlined, ShoppingCartOutlined, AlertOutlined, PrinterOutlined } from "@ant-design/icons";
import { toast } from "sonner";
import { IOrder, CHANNEL_LABELS } from "@/types/order";
import { formatPrice } from "@/lib/priceUtils";
import { format } from "date-fns";
import { getZoneBadgeInfo } from "@/lib/shipping";
import { StatusUpdater } from "@/components/admin/StatusUpdater";
import { CreateOrderModal } from "@/components/admin/CreateOrderModal";

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
}: {
  orders: IOrder[];
  products: ProductOption[];
}) {
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [channelFilter, setChannelFilter] = useState<string>("all");

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
        return (
          <div>
            <Flex align="center" gap={6}>
              <Text strong style={{ display: "block", fontSize: "13px" }}>
                {record.shipping.name}
              </Text>
              {vipDeduction > 0 && (
                <Tag color="gold" style={{ margin: 0, fontSize: "10px", fontWeight: 900, padding: "0 4px" }}>
                  🌟 VIP
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
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div style={{ textAlign: "center" }}>
          <Title level={3} style={{ margin: 0, fontWeight: 900 }}>
            Orders Management
          </Title>
          <Text type="secondary" style={{ fontSize: "12px" }}>
            Track and manage all customer purchases across all sales channels.
          </Text>
        </div>

        <Flex align="center" gap={12} wrap="wrap">
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
        </Flex>
      </div>

      {/* Filters Toolbar */}
      <Card
        variant="borderless"
        style={{ borderRadius: 16, background: "transparent" }}
        styles={{ body: { padding: "0 0 8px 0" } }}
        className="md:!border md:!border-slate-200 md:!bg-white md:shadow-sm"
      >
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 w-full">
          <Input
            placeholder="Search by Order ID or Name..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ borderRadius: 10 }}
            className="w-full sm:w-72"
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

      {/* DESKTOP VIEW: Antd Data Table */}
      <div className="hidden md:block">
        <Card style={{ borderRadius: 16, overflow: "hidden" }} styles={{ body: { padding: 0 } }}>
          <Table
            columns={columns}
            dataSource={filteredOrders}
            rowKey={(record) => record._id.toString()}
            scroll={{ x: 800 }}
            pagination={{ pageSize: 10, showSizeChanger: true }}
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
    </div>
  );
}
