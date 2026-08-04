// src/components/admin/AdminBrandsAntdClient.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Card,
  Table,
  Button,
  Input,
  Row,
  Col,
  Statistic,
  Typography,
  Flex,
  Space,
  Popconfirm,
  Tooltip,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  PlusOutlined,
  SearchOutlined,
  SafetyCertificateOutlined,
  EditOutlined,
  DeleteOutlined,
  InboxOutlined,
} from "@ant-design/icons";
import { deleteBrand } from "@/actions/adminBrands";

const { Title, Text } = Typography;

interface Brand {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  logo?: string;
}

interface Props {
  brands: Brand[];
}

export function AdminBrandsAntdClient({ brands: initialBrands }: Props) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const totalCount = initialBrands.length;

  const filteredBrands = initialBrands.filter((brand) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      brand.name.toLowerCase().includes(q) ||
      (brand.slug || "").toLowerCase().includes(q) ||
      (brand.description || "").toLowerCase().includes(q)
    );
  });

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await deleteBrand(id);
      if (res.success) {
        toast.success("Brand deleted successfully!");
        router.refresh();
      } else {
        toast.error(res.error || "Failed to delete brand");
      }
    } catch {
      toast.error("An error occurred while deleting brand");
    } finally {
      setDeletingId(null);
    }
  };

  const columns: ColumnsType<Brand> = [
    {
      title: "Logo",
      dataIndex: "logo",
      key: "logo",
      width: 80,
      render: (logo, record) => (
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: 10,
            overflow: "hidden",
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {logo ? (
            <Image src={logo} alt={record.name} fill sizes="52px" className="object-contain p-1" />
          ) : (
            <SafetyCertificateOutlined style={{ fontSize: 22, color: "#cbd5e1" }} />
          )}
        </div>
      ),
    },
    {
      title: "Brand Details",
      key: "details",
      render: (_, record) => (
        <div style={{ maxWidth: 340 }}>
          <Link
            href={`/admin/brands/${record._id}`}
            style={{ fontWeight: 800, color: "#0f172a", fontSize: "14px" }}
            className="hover:text-blue-600 transition-colors"
          >
            {record.name}
          </Link>
          <Text code style={{ fontSize: "11px", marginTop: 2, display: "inline-block", marginLeft: 6 }}>
            /{record.slug}
          </Text>
          {record.description && (
            <Text type="secondary" style={{ fontSize: "12px", display: "block", marginTop: 4 }} className="line-clamp-1">
              {record.description}
            </Text>
          )}
        </div>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      align: "center",
      render: (_, record) => (
        <Space>
          <Tooltip title="Edit Brand">
            <Link href={`/admin/brands/${record._id}`}>
              <Button size="small" type="primary" ghost icon={<EditOutlined />} />
            </Link>
          </Tooltip>
          <Popconfirm
            title="Delete Brand"
            description="Are you sure you want to delete this brand?"
            onConfirm={() => handleDelete(record._id)}
            okText="Yes, Delete"
            cancelText="Cancel"
            okButtonProps={{ danger: true, loading: deletingId === record._id }}
          >
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
        <div>
          <Title level={3} style={{ margin: 0, fontWeight: 900 }}>
            Brands Directory
          </Title>
          <Text type="secondary" style={{ fontSize: "13px" }}>
            Manage product manufacturers and brand collections
          </Text>
        </div>
        <Link href="/admin/brands/new">
          <Button type="primary" size="large" icon={<PlusOutlined />} style={{ fontWeight: 700, borderRadius: 10 }}>
            Add Brand
          </Button>
        </Link>
      </div>

      {/* Stat + Search */}
      <Row gutter={[12, 12]}>
        <Col xs={24} sm={8}>
          <Card style={{ borderRadius: 16 }} styles={{ body: { padding: 14 } }} className="text-center">
            <Statistic
              title={<Text type="secondary" style={{ fontSize: "11px", fontWeight: 700 }}>TOTAL BRANDS</Text>}
              value={totalCount}
              prefix={<SafetyCertificateOutlined style={{ color: "#1677ff" }} />}
              styles={{ content: { fontWeight: 900, fontSize: "20px" } }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={16}>
          <Card style={{ borderRadius: 16, height: "100%" }} styles={{ body: { padding: 14 } }}>
            <Flex align="center" style={{ height: "100%" }}>
              <Input
                placeholder="Search brands by name, slug, or description..."
                prefix={<SearchOutlined style={{ color: "#94a3b8", marginRight: 4 }} />}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: "100%", borderRadius: 10 }}
                allowClear
              />
            </Flex>
          </Card>
        </Col>
      </Row>

      {/* Desktop Table */}
      <div className="hidden md:block">
        <Card style={{ borderRadius: 16 }} styles={{ body: { padding: 0 } }}>
          <Table
            columns={columns}
            dataSource={filteredBrands}
            rowKey={(r) => r._id}
            pagination={{ pageSize: 10, showSizeChanger: true }}
          />
        </Card>
      </div>

      {/* Mobile Cards */}
      <div className="flex flex-col gap-3.5 md:hidden">
        {filteredBrands.length > 0 ? (
          filteredBrands.map((brand) => (
            <Card
              key={brand._id}
              style={{ borderRadius: 16, marginBottom: 0 }}
              styles={{ body: { padding: 14 } }}
              className="shadow-sm border border-slate-200/80"
            >
              <div className="space-y-3">
                <Flex align="start" gap={10}>
                  <div
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: 10,
                      overflow: "hidden",
                      background: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      position: "relative",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    {brand.logo ? (
                      <Image src={brand.logo} alt={brand.name} fill sizes="52px" className="object-contain p-1" />
                    ) : (
                      <SafetyCertificateOutlined style={{ fontSize: 22, color: "#cbd5e1" }} />
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Link
                      href={`/admin/brands/${brand._id}`}
                      style={{ fontWeight: 800, color: "#0f172a", fontSize: "14px" }}
                      className="line-clamp-1 hover:text-blue-600 transition-colors"
                    >
                      {brand.name}
                    </Link>
                    <Text code style={{ fontSize: "11px", marginTop: 2, display: "inline-block" }}>
                      /{brand.slug}
                    </Text>
                  </div>
                </Flex>

                {brand.description && (
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <Text type="secondary" style={{ fontSize: "11px" }} className="line-clamp-2">
                      {brand.description}
                    </Text>
                  </div>
                )}

                <Flex align="center" justify="end" gap={8} style={{ paddingTop: 4 }}>
                  <Link href={`/admin/brands/${brand._id}`}>
                    <Button size="small" type="primary" ghost icon={<EditOutlined />}>Edit</Button>
                  </Link>
                  <Popconfirm
                    title="Delete Brand"
                    description="Are you sure you want to delete this brand?"
                    onConfirm={() => handleDelete(brand._id)}
                    okText="Yes, Delete"
                    cancelText="Cancel"
                    okButtonProps={{ danger: true, loading: deletingId === brand._id }}
                  >
                    <Button size="small" danger icon={<DeleteOutlined />}>Delete</Button>
                  </Popconfirm>
                </Flex>
              </div>
            </Card>
          ))
        ) : (
          <Card style={{ borderRadius: 16 }} styles={{ body: { padding: 30 } }}>
            <div style={{ textAlign: "center" }}>
              <InboxOutlined style={{ fontSize: 36, color: "#ccc" }} />
              <Text type="secondary" style={{ display: "block", marginTop: 8 }}>
                No brands match your search
              </Text>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
