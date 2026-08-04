// src/components/admin/AdminDashboardAntdClient.tsx
"use client";

import Link from "next/link";
import { Card, Row, Col, Statistic, Table, Tag, Typography, Button, Flex } from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  DollarOutlined,
  ShoppingCartOutlined,
  ClockCircleOutlined,
  AppstoreOutlined,
  EyeOutlined,
  PlusOutlined,
  RiseOutlined,
  LineChartOutlined,
  FireOutlined,
} from "@ant-design/icons";
import { formatPrice } from "@/lib/priceUtils";
import { IOrder, CHANNEL_LABELS } from "@/types/order";
import { StatusUpdater } from "@/components/admin/StatusUpdater";
import { format } from "date-fns";
import { getZoneBadgeInfo } from "@/lib/shipping";
import { AdminOrderMobileCard } from "@/components/admin/AdminOrderMobileCard";

const { Title, Text } = Typography;

interface StatsData {
  totalOrders: number;
  totalProducts: number;
  pendingOrders: number;
  totalSales: number;
  netProfit: number;
  totalAdSpend: number;
  todayRevenue: number;
  todayOrders: number;
  recentOrders: IOrder[];
}

export function AdminDashboardAntdClient({ stats }: { stats: StatsData }) {
  const columns: ColumnsType<IOrder> = [
    {
      title: "Order ID",
      dataIndex: "orderNumber",
      key: "orderNumber",
      render: (num, record) => {
        const channelKey = record.channelSource || "web";
        const channelLabel = CHANNEL_LABELS[channelKey] || "Website";
        return (
          <Flex vertical gap={2}>
            <Link href={`/admin/orders/${record._id?.toString()}`}>
              <Text code style={{ fontWeight: 800, fontSize: "13px" }}>
                {num}
              </Text>
            </Link>
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
        const districtName = record.shipping?.district;
        return (
          <div>
            <Flex align="center" gap={6} wrap="wrap">
              <Text strong style={{ display: "block", fontSize: "13px" }}>
                {record.shipping.name}
              </Text>
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
      title: "Total",
      key: "total",
      render: (_, record) => (
        <Text strong style={{ fontSize: "13px" }}>
          {formatPrice(record.total)}
        </Text>
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
          <Button icon={<EyeOutlined />} size="small" type="default" />
        </Link>
      ),
    },
  ];

  return (
    <div style={{ padding: 0 }} className="space-y-6">
      {/* Title */}
      <div style={{ textAlign: "center" }}>
        <Title level={3} style={{ margin: 0, fontWeight: 900 }}>
          Dashboard Overview
        </Title>
        <Text type="secondary">Welcome back, Admin. Here&apos;s your store status today.</Text>
      </div>

      {/* Stats Cards Row — 2 Columns on Mobile (xs={12}) */}
      <Row gutter={[10, 10]}>
        <Col xs={12} sm={12} lg={6}>
          <Card style={{ borderRadius: 14, textAlign: "center" }} styles={{ body: { padding: 12 } }}>
            <Statistic
              title="Total Sales"
              value={formatPrice(stats.totalSales)}
              prefix={<DollarOutlined style={{ color: "#52c41a" }} />}
              styles={{ content: { fontWeight: 900, fontSize: "16px", color: "#111827" } }}
              style={{ textAlign: "center" }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} lg={6}>
          <Card style={{ borderRadius: 14, textAlign: "center" }} styles={{ body: { padding: 12 } }}>
            <Statistic
              title="Total Orders"
              value={stats.totalOrders}
              prefix={<ShoppingCartOutlined style={{ color: "#1890ff" }} />}
              styles={{ content: { fontWeight: 900, fontSize: "16px", color: "#111827" } }}
              style={{ textAlign: "center" }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} lg={6}>
          <Card style={{ borderRadius: 14, textAlign: "center" }} styles={{ body: { padding: 12 } }}>
            <Statistic
              title="Pending Orders"
              value={stats.pendingOrders}
              prefix={<ClockCircleOutlined style={{ color: "#fa8c16" }} />}
              styles={{
                content: {
                  fontWeight: 900,
                  fontSize: "16px",
                  color: stats.pendingOrders > 0 ? "#fa8c16" : "#52c41a",
                },
              }}
              style={{ textAlign: "center" }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} lg={6}>
          <Card style={{ borderRadius: 14, textAlign: "center" }} styles={{ body: { padding: 12 } }}>
            <Statistic
              title="Products"
              value={stats.totalProducts}
              prefix={<AppstoreOutlined style={{ color: "#722ed1" }} />}
              styles={{ content: { fontWeight: 900, fontSize: "16px", color: "#111827" } }}
              style={{ textAlign: "center" }}
            />
          </Card>
        </Col>
      </Row>

      {/* Finance Quick Summary Banner */}
      <Link href="/admin/finance" className="block">
        <div
          style={{
            background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f172a 100%)",
            borderRadius: 16,
            padding: "18px 20px",
            cursor: "pointer",
            border: "1px solid rgba(99,179,237,0.25)",
            boxShadow: "0 10px 25px -5px rgba(15,23,42,0.5)",
          }}
          className="hover:opacity-95 transition-all"
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-5 w-full">
            {/* Banner Header: Center aligned on mobile */}
            <div className="flex flex-col sm:flex-row items-center justify-center text-center md:text-left gap-2 sm:gap-3 w-full md:w-auto">
              <LineChartOutlined style={{ fontSize: 24, color: "#63b3ed" }} />
              <div className="text-center md:text-left">
                <Text style={{ color: "#a0aec0", fontSize: "11px", display: "block", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  FINANCE & PROFIT SUMMARY
                </Text>
                <Text style={{ color: "#93c5fd", fontSize: "12px", fontWeight: 500 }}>
                  Click to view detailed analytics →
                </Text>
              </div>
            </div>

            {/* 4 Metrics Grid: 2 columns on mobile (2x2 grid), row on desktop */}
            <div className="grid grid-cols-2 md:flex md:items-center gap-2.5 sm:gap-3 md:gap-6 w-full md:w-auto">
              {/* Metric 1: Today's Revenue */}
              <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-white/5 border border-white/10 text-center">
                <Text style={{ color: "#4ade80", fontSize: "17px", fontWeight: 900, lineHeight: 1.2 }}>
                  {formatPrice(stats.todayRevenue)}
                </Text>
                <Flex align="center" justify="center" gap={4} style={{ marginTop: 2 }}>
                  <FireOutlined style={{ color: "#f87171", fontSize: "11px" }} />
                  <Text style={{ color: "#94a3b8", fontSize: "11px", fontWeight: 600 }}>
                    Today&apos;s Revenue ({stats.todayOrders})
                  </Text>
                </Flex>
              </div>

              {/* Metric 2: Total Revenue */}
              <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-white/5 border border-white/10 text-center">
                <Text style={{ color: "#60a5fa", fontSize: "17px", fontWeight: 900, lineHeight: 1.2 }}>
                  {formatPrice(stats.totalSales)}
                </Text>
                <Flex align="center" justify="center" gap={4} style={{ marginTop: 2 }}>
                  <ShoppingCartOutlined style={{ color: "#60a5fa", fontSize: "11px" }} />
                  <Text style={{ color: "#94a3b8", fontSize: "11px", fontWeight: 600 }}>
                    Total Revenue
                  </Text>
                </Flex>
              </div>

              {/* Metric 3: Total Ad Spend */}
              <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-white/5 border border-white/10 text-center">
                <Text style={{ color: "#f87171", fontSize: "17px", fontWeight: 900, lineHeight: 1.2 }}>
                  {formatPrice(stats.totalAdSpend)}
                </Text>
                <Flex align="center" justify="center" gap={4} style={{ marginTop: 2 }}>
                  <DollarOutlined style={{ color: "#f87171", fontSize: "11px" }} />
                  <Text style={{ color: "#94a3b8", fontSize: "11px", fontWeight: 600 }}>
                    Total Ad Spend
                  </Text>
                </Flex>
              </div>

              {/* Metric 4: Est. Net Profit */}
              <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-white/5 border border-white/10 text-center">
                <Text style={{ color: "#facc15", fontSize: "17px", fontWeight: 900, lineHeight: 1.2 }}>
                  {formatPrice(stats.netProfit)}
                </Text>
                <Flex align="center" justify="center" gap={4} style={{ marginTop: 2 }}>
                  <RiseOutlined style={{ color: "#4ade80", fontSize: "11px" }} />
                  <Text style={{ color: "#94a3b8", fontSize: "11px", fontWeight: 600 }}>
                    Est. Net Profit
                  </Text>
                </Flex>
              </div>
            </div>
          </div>
        </div>
      </Link>

      {/* Main Grid: Recent Orders (10 Items) & Quick Actions */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          {/* DESKTOP: Bordered Card with Table */}
          <div className="hidden md:block">
            <Card
              title={<Text strong>Recent Orders (Top 10)</Text>}
              extra={<Link href="/admin/orders">View All Orders</Link>}
              style={{ borderRadius: 16, overflow: "hidden" }}
              styles={{ body: { padding: 0 } }}
            >
              <Table
                columns={columns}
                dataSource={stats.recentOrders}
                rowKey={(r) => r._id?.toString() || r.orderNumber}
                pagination={false}
              />
            </Card>
          </div>

          {/* MOBILE: Borderless floating cards */}
          <div className="block md:hidden">
            <div className="flex items-center justify-between mb-3">
              <Text strong style={{ fontSize: "15px" }}>Recent Orders (Top 10)</Text>
              <Link href="/admin/orders" style={{ fontSize: "13px", fontWeight: 700 }}>
                View All →
              </Link>
            </div>
            {stats.recentOrders.map((order) => (
              <AdminOrderMobileCard
                key={order._id?.toString() || order.orderNumber}
                order={order}
                marginBottom={8}
              />
            ))}
          </div>
        </Col>

        <Col xs={24} lg={8}>
          <Card title={<Text strong>Quick Actions</Text>} style={{ borderRadius: 16 }}>
            <Flex vertical gap="middle" style={{ width: "100%" }}>
              <Link href="/admin/products/new">
                <Button type="primary" block icon={<PlusOutlined />} size="large">
                  Add New Product
                </Button>
              </Link>
              <Link href="/admin/finance">
                <Button
                  block
                  size="large"
                  icon={<LineChartOutlined />}
                  style={{ background: "#0f172a", color: "#63b3ed", borderColor: "#1e3a5f", fontWeight: 700 }}
                >
                  Finance & Profit
                </Button>
              </Link>
              <Link href="/admin/categories/new">
                <Button block size="large">
                  Create Category
                </Button>
              </Link>
              <Link href="/admin/brands/new">
                <Button block size="large">
                  Create Brand
                </Button>
              </Link>
            </Flex>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
