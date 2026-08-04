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
      render: (_, record) => (
        <div>
          <Text strong style={{ display: "block", fontSize: "13px" }}>
            {record.shipping.name}
          </Text>
          <Text type="secondary" style={{ fontSize: "11px" }}>
            {record.shipping.phone}
          </Text>
        </div>
      ),
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
      <Link href="/admin/finance">
        <div
          style={{
            background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f172a 100%)",
            borderRadius: 16,
            padding: "16px 20px",
            cursor: "pointer",
            transition: "opacity 0.2s",
            border: "1px solid rgba(99,179,237,0.2)",
          }}
          className="hover:opacity-90"
        >
          <Flex align="center" justify="space-between" wrap="wrap" gap={12}>
            <Flex align="center" gap={10}>
              <LineChartOutlined style={{ fontSize: 22, color: "#63b3ed" }} />
              <div>
                <Text style={{ color: "#a0aec0", fontSize: "11px", display: "block", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Finance & Profit Summary
                </Text>
                <Text style={{ color: "#e2e8f0", fontSize: "12px" }}>Click to view detailed analytics →</Text>
              </div>
            </Flex>
            <Row gutter={[24, 8]}>
              <Col>
                <Flex vertical align="center">
                  <Text style={{ color: "#68d391", fontSize: "18px", fontWeight: 900 }}>
                    {formatPrice(stats.todayRevenue)}
                  </Text>
                  <Flex align="center" gap={4}>
                    <FireOutlined style={{ color: "#fc8181", fontSize: "10px" }} />
                    <Text style={{ color: "#a0aec0", fontSize: "11px" }}>Today&apos;s Revenue ({stats.todayOrders} orders)</Text>
                  </Flex>
                </Flex>
              </Col>
              <Col>
                <Flex vertical align="center">
                  <Text style={{ color: "#f6e05e", fontSize: "18px", fontWeight: 900 }}>
                    {formatPrice(stats.netProfit)}
                  </Text>
                  <Flex align="center" gap={4}>
                    <RiseOutlined style={{ color: "#68d391", fontSize: "10px" }} />
                    <Text style={{ color: "#a0aec0", fontSize: "11px" }}>Est. Net Profit</Text>
                  </Flex>
                </Flex>
              </Col>
              <Col>
                <Flex vertical align="center">
                  <Text style={{ color: "#fc8181", fontSize: "18px", fontWeight: 900 }}>
                    {formatPrice(stats.totalAdSpend)}
                  </Text>
                  <Flex align="center" gap={4}>
                    <DollarOutlined style={{ color: "#fc8181", fontSize: "10px" }} />
                    <Text style={{ color: "#a0aec0", fontSize: "11px" }}>Total Ad Spend</Text>
                  </Flex>
                </Flex>
              </Col>
            </Row>
          </Flex>
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
