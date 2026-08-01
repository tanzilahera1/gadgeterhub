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
} from "@ant-design/icons";
import { formatPrice } from "@/lib/priceUtils";
import { IOrder, CHANNEL_LABELS } from "@/types/order";
import { StatusUpdater } from "@/components/admin/StatusUpdater";
import { format } from "date-fns";
import { getZoneBadgeInfo } from "@/lib/shipping";

const { Title, Text } = Typography;

interface StatsData {
  totalOrders: number;
  totalProducts: number;
  pendingOrders: number;
  totalSales: number;
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
          <Card style={{ borderRadius: 14 }} styles={{ body: { padding: 12 } }}>
            <Statistic
              title="Total Sales"
              value={formatPrice(stats.totalSales)}
              prefix={<DollarOutlined style={{ color: "#52c41a" }} />}
              styles={{ content: { fontWeight: 900, fontSize: "16px", color: "#111827" } }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} lg={6}>
          <Card style={{ borderRadius: 14 }} styles={{ body: { padding: 12 } }}>
            <Statistic
              title="Total Orders"
              value={stats.totalOrders}
              prefix={<ShoppingCartOutlined style={{ color: "#1890ff" }} />}
              styles={{ content: { fontWeight: 900, fontSize: "16px", color: "#111827" } }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} lg={6}>
          <Card style={{ borderRadius: 14 }} styles={{ body: { padding: 12 } }}>
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
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} lg={6}>
          <Card style={{ borderRadius: 14 }} styles={{ body: { padding: 12 } }}>
            <Statistic
              title="Products"
              value={stats.totalProducts}
              prefix={<AppstoreOutlined style={{ color: "#722ed1" }} />}
              styles={{ content: { fontWeight: 900, fontSize: "16px", color: "#111827" } }}
            />
          </Card>
        </Col>
      </Row>

      {/* Main Grid: Recent Orders (10 Items) & Quick Actions */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card
            title={<Text strong>Recent Orders (Top 10)</Text>}
            extra={<Link href="/admin/orders">View All Orders</Link>}
            style={{ borderRadius: 16, overflow: "hidden" }}
            styles={{ body: { padding: 0 } }}
          >
            {/* DESKTOP VIEW: Antd Table with Interactive StatusUpdater */}
            <div className="hidden md:block">
              <Table
                columns={columns}
                dataSource={stats.recentOrders}
                rowKey={(r) => r._id?.toString() || r.orderNumber}
                pagination={false}
              />
            </div>

            {/* MOBILE VIEW: Antd Card Rows — 100% Unified with Admin Orders Mobile Cards */}
            <div className="block md:hidden divide-y divide-slate-100">
              {stats.recentOrders.map((order) => {
                const channelKey = order.channelSource || "web";
                const channelLabel = CHANNEL_LABELS[channelKey] || "Website";

                return (
                  <div key={order._id?.toString()} className="p-3.5 space-y-3">
                    {/* Top Bar: Order ID & Channel + Status */}
                    <Flex align="start" justify="space-between" gap={8}>
                      <div>
                        <Text code style={{ fontWeight: 900, fontSize: "14px", display: "inline-block", margin: 0, letterSpacing: "0.5px" }}>
                          {order.orderNumber}
                        </Text>
                        <div style={{ marginTop: 4 }}>
                          <Tag
                            color="blue"
                            style={{ fontSize: "10px", margin: 0, borderRadius: 6, padding: "0 5px", lineHeight: "18px" }}
                          >
                            {channelLabel}
                          </Tag>
                        </div>
                      </div>

                      <StatusUpdater
                        orderId={order._id.toString()}
                        currentStatus={order.orderStatus || "pending"}
                      />
                    </Flex>

                    {/* Middle Body: Customer Info & Price + Eye Button */}
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex items-center justify-between gap-2">
                      <div>
                        <Text strong style={{ display: "block", fontSize: "13px" }}>
                          {order.shipping.name}
                        </Text>
                        <Text type="secondary" style={{ fontSize: "11px" }}>
                          {order.shipping.phone}
                        </Text>
                      </div>

                      <Flex align="center" gap={8}>
                        <Text strong style={{ fontSize: "15px", color: "#1677ff" }}>
                          {formatPrice(order.total)}
                        </Text>
                        <Link href={`/admin/orders/${order._id?.toString()}`}>
                          <Button icon={<EyeOutlined />} size="small" type="default" />
                        </Link>
                      </Flex>
                    </div>

                    {/* Bottom Footer: Date | Delivery Zone | Payment */}
                    <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                      <Text type="secondary" style={{ fontSize: "11px" }}>
                        {format(new Date(order.createdAt!), "dd MMM, hh:mm a")}
                      </Text>

                      {(() => {
                        const zoneBadge = getZoneBadgeInfo(order.shipping, order.shippingCost);
                        return (
                          <Tag
                            color={zoneBadge.color}
                            style={{ margin: 0, fontSize: "10px", padding: "0 5px", lineHeight: "18px", borderRadius: 6, fontWeight: 700 }}
                          >
                            {zoneBadge.label}
                          </Tag>
                        );
                      })()}

                      <Tag
                        color={order.paymentMethod === "cod" ? "default" : "magenta"}
                        style={{ margin: 0, fontWeight: 700, borderRadius: 6, fontSize: "10px", padding: "0 5px", lineHeight: "18px" }}
                      >
                        {order.paymentMethod ? order.paymentMethod.toUpperCase() : "COD"}
                      </Tag>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title={<Text strong>Quick Actions</Text>} style={{ borderRadius: 16 }}>
            <Flex vertical gap="middle" style={{ width: "100%" }}>
              <Link href="/admin/products/new">
                <Button type="primary" block icon={<PlusOutlined />} size="large">
                  Add New Product
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
