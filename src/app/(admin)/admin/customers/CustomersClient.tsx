// src/app/(admin)/admin/customers/CustomersClient.tsx
"use client";

import { useState } from "react";
import { Table, Tag, Input, Card, Typography, Flex, Button } from "antd";
import { SearchOutlined, MessageOutlined } from "@ant-design/icons";
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
      <div className="text-center">
        <Title level={3} style={{ margin: 0, fontWeight: 900 }}>
          👑 Customer Directory & Analytics
        </Title>
        <Text type="secondary" style={{ fontSize: "12px" }}>
          সমস্ত কাস্টমারদের ইতিহাস, লয়ালটি রিপিট কাউন্ট ও লাইফটাইম সেলস সামারি
        </Text>
      </div>

      {/* Overview KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Card style={{ borderRadius: 16 }} styles={{ body: { padding: 14 } }} className="text-center col-span-2 sm:col-span-1">
          <Text type="secondary" style={{ fontSize: "11px", fontWeight: 700, display: "block" }}>
            👥 মোট কাস্টমার
          </Text>
          <Title level={3} style={{ margin: "4px 0 0", fontWeight: 900, color: "#0f172a" }}>
            {customers.length} জন
          </Title>
        </Card>

        <Card style={{ borderRadius: 16 }} styles={{ body: { padding: 14 } }} className="text-center">
          <Text type="secondary" style={{ fontSize: "11px", fontWeight: 700, display: "block" }}>
            🌟 VIP লয়াল (3+ Orders)
          </Text>
          <Title level={3} style={{ margin: "4px 0 0", fontWeight: 900, color: "#d97706" }}>
            {vipCount} জন
          </Title>
        </Card>

        <Card style={{ borderRadius: 16 }} styles={{ body: { padding: 14 } }} className="text-center">
          <Text type="secondary" style={{ fontSize: "11px", fontWeight: 700, display: "block" }}>
            🔁 রিপিট কাস্টমার (2 Orders)
          </Text>
          <Title level={3} style={{ margin: "4px 0 0", fontWeight: 900, color: "#2563eb" }}>
            {repeatCount} জন
          </Title>
        </Card>
      </div>

      {/* Search Toolbar Card */}
      <Card
        style={{ borderRadius: 16 }}
        styles={{ body: { padding: "12px 16px" } }}
        className="border border-slate-200 bg-white shadow-sm"
      >
        <div className="flex items-center justify-between">
          <Input
            prefix={<SearchOutlined style={{ color: "#94a3b8", marginRight: 4 }} />}
            placeholder="নাম, ফোন বা ঠিকানা দিয়ে খুঁজুন..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ borderRadius: 10 }}
            className="w-full sm:w-80"
            allowClear
          />
        </div>
      </Card>

      {/* Mobile Cards View (block md:hidden) */}
      <div className="flex flex-col gap-3.5 md:hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs font-medium bg-white rounded-2xl border border-dashed border-slate-200">
            কোনো কাস্টমার পাওয়া যায়নি
          </div>
        ) : (
          filtered.map((item) => {
            const cleanPhone = item.phone.replace(/[^0-9]/g, "");
            const waNumber = cleanPhone.startsWith("88") ? cleanPhone : `88${cleanPhone}`;
            return (
              <Card
                key={item.phone}
                style={{ borderRadius: 16, marginBottom: 0 }}
                styles={{ body: { padding: 14 } }}
                className="shadow-sm border border-slate-200/80"
              >
                <div className="space-y-2.5">
                  {/* Top Row: Name + Tier Tag (Left) & WhatsApp Button (Right) */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Text strong style={{ fontSize: "14px" }}>
                        {item.name}
                      </Text>
                      <Tag
                        color={item.tier === "VIP" ? "gold" : item.tier === "Repeat" ? "blue" : "default"}
                        style={{ fontWeight: 900, borderRadius: 6, margin: 0, fontSize: "10px" }}
                      >
                        {item.tier === "VIP" ? "🌟 VIP" : item.tier === "Repeat" ? "🔁 Repeat" : "🆕 New"}
                      </Tag>
                    </div>

                    <a
                      href={`https://wa.me/${waNumber}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0"
                    >
                      <Button
                        size="small"
                        type="primary"
                        icon={<MessageOutlined style={{ fontSize: "12px" }} />}
                        style={{ background: "#25D366", borderColor: "#25D366", borderRadius: 8, fontSize: "11px", fontWeight: 700 }}
                      >
                        WhatsApp
                      </Button>
                    </a>
                  </div>

                  {/* Contact & Address */}
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 space-y-1">
                    <Text type="secondary" style={{ fontSize: "12px", display: "block" }}>
                      📞 <span className="font-semibold text-slate-800">{item.phone}</span>
                    </Text>
                    {item.lastAddress && (
                      <Text type="secondary" style={{ fontSize: "11px", display: "block", color: "#64748b" }}>
                        📍 {item.lastAddress}
                      </Text>
                    )}
                  </div>

                  {/* Stats Row: Total Orders & Lifetime Spent */}
                  <div className="flex items-center justify-between pt-1">
                    <div>
                      <Text type="secondary" style={{ fontSize: "10px", display: "block", textTransform: "uppercase", fontWeight: 700 }}>
                        মোট অর্ডার
                      </Text>
                      <Tag color="cyan" style={{ fontWeight: 900, fontSize: "11px", borderRadius: 6, margin: "2px 0 0" }}>
                        {item.totalOrders}টি ({item.deliveredCount} সাকসেস)
                      </Tag>
                    </div>

                    <div style={{ textAlign: "right" }}>
                      <Text type="secondary" style={{ fontSize: "10px", display: "block", textTransform: "uppercase", fontWeight: 700 }}>
                        Lifetime Spent
                      </Text>
                      <Text strong style={{ fontSize: "14px", color: "#1677ff", display: "block" }}>
                        {formatPrice(item.totalSpent)}
                      </Text>
                    </div>
                  </div>

                  {/* Footer Date */}
                  {item.lastOrderDate && (
                    <div className="pt-1.5 border-t border-slate-100 text-right">
                      <Text type="secondary" style={{ fontSize: "10px" }}>
                        সর্বশেষ কেনাকাটা: {format(new Date(item.lastOrderDate), "dd MMM, yyyy")}
                      </Text>
                    </div>
                  )}
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Desktop Table View (hidden md:block) */}
      <Card style={{ borderRadius: 16 }} styles={{ body: { padding: 0 } }} className="hidden md:block">
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
