// src/app/(admin)/admin/customers/CustomersClient.tsx
"use client";

import { useState } from "react";
import { Table, Tag, Input, Card, Typography, Flex, Space, Button } from "antd";
import { SearchOutlined, UserOutlined, PhoneOutlined, CrownOutlined, MessageOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { CustomerDirectoryItem } from "@/actions/customer";
import { formatPrice } from "@/lib/priceUtils";
import { format } from "date-fns";

const { Title, Text } = Typography;

export function CustomersClient({ customers }: { customers: CustomerDirectoryItem[] }) {
  const [search, setSearch] = useState("");

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      c.lastAddress.toLowerCase().includes(search.toLowerCase())
  );

  const vipCount = customers.filter((c) => c.tier === "VIP").length;
  const repeatCount = customers.filter((c) => c.tier === "Repeat").length;

  const columns: ColumnsType<CustomerDirectoryItem> = [
    {
      title: "কাস্টমার নাম & ফোন",
      key: "name",
      render: (_, record) => {
        const cleanPhone = record.phone.replace(/[^0-9]/g, "");
        const waNumber = cleanPhone.startsWith("88") ? cleanPhone : `88${cleanPhone}`;
        return (
          <div className="space-y-1">
            <Flex align="center" gap={6}>
              <Text strong style={{ fontSize: "14px" }}>
                {record.name}
              </Text>
              <Tag
                color={record.tier === "VIP" ? "gold" : record.tier === "Repeat" ? "blue" : "default"}
                style={{ fontWeight: 900, borderRadius: 6, margin: 0, fontSize: "10px" }}
              >
                {record.tier === "VIP" ? "🌟 VIP" : record.tier === "Repeat" ? "🔁 Repeat" : "🆕 New"}
              </Tag>
            </Flex>
            <Flex align="center" gap={8}>
              <Text type="secondary" style={{ fontSize: "12px" }}>
                📞 {record.phone}
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
      title: "মোট অর্ডার",
      dataIndex: "totalOrders",
      key: "totalOrders",
      sorter: (a, b) => a.totalOrders - b.totalOrders,
      render: (val, record) => (
        <div>
          <Tag color="cyan" style={{ fontWeight: 900, fontSize: "12px", borderRadius: 6 }}>
            {val}টি অর্ডার
          </Tag>
          <Text type="secondary" style={{ display: "block", fontSize: "10px", marginTop: 2 }}>
            {record.deliveredCount} সাকসেস {record.returnedCount > 0 && `· ${record.returnedCount} রিটার্ন`}
          </Text>
        </div>
      ),
    },
    {
      title: "মোট কেনাকাটা (Lifetime Spent)",
      dataIndex: "totalSpent",
      key: "totalSpent",
      sorter: (a, b) => a.totalSpent - b.totalSpent,
      render: (val) => (
        <Text strong style={{ fontSize: "15px", color: "#1677ff" }}>
          {formatPrice(val)}
        </Text>
      ),
    },
    {
      title: "সর্বশেষ ঠিকানা",
      dataIndex: "lastAddress",
      key: "lastAddress",
      render: (val) => (
        <Text type="secondary" style={{ fontSize: "12px", maxWidth: 220, display: "block" }}>
          {val || "N/A"}
        </Text>
      ),
    },
    {
      title: "সর্বশেষ কেনাকাটা",
      dataIndex: "lastOrderDate",
      key: "lastOrderDate",
      render: (val) => (
        <Text type="secondary" style={{ fontSize: "11px" }}>
          {val ? format(new Date(val), "dd MMM, yyyy") : "N/A"}
        </Text>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <Flex align="center" justify="space-between" wrap="wrap" gap={12}>
        <div>
          <Title level={3} style={{ margin: 0, fontWeight: 900 }}>
            👑 Customer Directory & Lifetime Analytics
          </Title>
          <Text type="secondary" style={{ fontSize: "12px" }}>
            আপনার সমস্ত কাস্টমারদের ইতিহাস, লয়ালটি রিপিট কাউন্ট ও লাইফটাইম সেলস সামারি
          </Text>
        </div>

        <Input
          prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
          placeholder="নাম, ফোন বা ঠিকানা দিয়ে খুজুন..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: 280, borderRadius: 10, height: 40 }}
        />
      </Flex>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card style={{ borderRadius: 16 }} styles={{ body: { padding: 16 } }}>
          <Text type="secondary" style={{ fontSize: "11px", fontWeight: 700, display: "block" }}>
            মোট কাস্টমার
          </Text>
          <Title level={2} style={{ margin: "4px 0 0", fontWeight: 900, color: "#0f172a" }}>
            {customers.length} জন
          </Title>
        </Card>

        <Card style={{ borderRadius: 16 }} styles={{ body: { padding: 16 } }}>
          <Text type="secondary" style={{ fontSize: "11px", fontWeight: 700, display: "block" }}>
            🌟 VIP লয়াল কাস্টমার (3+ Orders)
          </Text>
          <Title level={2} style={{ margin: "4px 0 0", fontWeight: 900, color: "#d97706" }}>
            {vipCount} জন
          </Title>
        </Card>

        <Card style={{ borderRadius: 16 }} styles={{ body: { padding: 16 } }}>
          <Text type="secondary" style={{ fontSize: "11px", fontWeight: 700, display: "block" }}>
            🔁 রিপিট কাস্টমার (2 Orders)
          </Text>
          <Title level={2} style={{ margin: "4px 0 0", fontWeight: 900, color: "#2563eb" }}>
            {repeatCount} জন
          </Title>
        </Card>
      </div>

      {/* Customers Table */}
      <Card style={{ borderRadius: 16 }} styles={{ body: { padding: 0 } }}>
        <Table
          columns={columns}
          dataSource={filtered.map((c) => ({ ...c, key: c.phone }))}
          pagination={{ pageSize: 15 }}
          scroll={{ x: 700 }}
        />
      </Card>
    </div>
  );
}
