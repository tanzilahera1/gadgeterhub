// src/components/admin/AdminCategoriesAntdClient.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
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
  Space,
  Popconfirm,
  Tooltip,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  PlusOutlined,
  SearchOutlined,
  AppstoreOutlined,
  EditOutlined,
  DeleteOutlined,
  InboxOutlined,
} from "@ant-design/icons";
import { deleteCategory } from "@/actions/adminCategories";
import type { ICategory } from "@/types/category";

const { Title, Text } = Typography;

interface Props {
  categories: ICategory[];
}

export function AdminCategoriesAntdClient({ categories: initialCategories }: Props) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const totalCount = initialCategories.length;

  // Filter categories
  const filteredCategories = initialCategories.filter((cat) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const nameMatch = cat.name.toLowerCase().includes(q);
    const slugMatch = cat.slug?.toLowerCase().includes(q);
    const descMatch = cat.description?.toLowerCase().includes(q);
    return nameMatch || slugMatch || descMatch;
  });

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await deleteCategory(id);
      if (res.success) {
        toast.success("Category deleted successfully!");
        router.refresh();
      } else {
        toast.error(res.error || "Failed to delete category");
      }
    } catch {
      toast.error("An error occurred while deleting category");
    } finally {
      setDeletingId(null);
    }
  };

  // Antd Table Columns
  const columns: ColumnsType<ICategory> = [
    {
      title: "Image",
      dataIndex: "image",
      key: "image",
      width: 80,
      render: (img, record) => (
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
          {img ? (
            <Image
              src={img}
              alt={record.name}
              fill
              sizes="52px"
              className="object-contain p-1"
            />
          ) : (
            <AppstoreOutlined style={{ fontSize: 22, color: "#cbd5e1" }} />
          )}
        </div>
      ),
    },
    {
      title: "Category Details",
      key: "details",
      render: (_, record) => (
        <div style={{ maxWidth: 320 }}>
          <Link
            href={`/admin/categories/${String(record._id)}`}
            style={{ fontWeight: 800, color: "#0f172a", fontSize: "14px" }}
            className="hover:text-blue-600 transition-colors line-clamp-1"
          >
            {record.name}
          </Link>
          <Text code style={{ fontSize: "11px", marginTop: 2, display: "inline-block" }}>
            /{record.slug}
          </Text>
          {record.description && (
            <Text type="secondary" style={{ fontSize: "12px", display: "block", marginTop: 2 }} className="line-clamp-1">
              {record.description}
            </Text>
          )}
        </div>
      ),
    },
    {
      title: "SEO Meta Snapshot",
      key: "seo",
      render: (_, record) => (
        <div style={{ maxWidth: 260 }}>
          <Text strong style={{ fontSize: "12px", display: "block" }} className="line-clamp-1">
            {record.seoTitle || "No SEO Title"}
          </Text>
          <Text type="secondary" style={{ fontSize: "11px", display: "block" }} className="line-clamp-1">
            {record.seoDesc || "No SEO description provided."}
          </Text>
        </div>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      align: "center",
      render: (_, record) => (
        <Space>
          <Tooltip title="Edit Category">
            <Link href={`/admin/categories/${String(record._id)}`}>
              <Button size="small" type="primary" ghost icon={<EditOutlined />} />
            </Link>
          </Tooltip>

          <Popconfirm
            title="Delete Category"
            description="Are you sure you want to delete this category?"
            onConfirm={() => handleDelete(String(record._id))}
            okText="Yes, Delete"
            cancelText="Cancel"
            okButtonProps={{ danger: true, loading: deletingId === String(record._id) }}
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
      <Flex align="center" justify="space-between" wrap="wrap" gap={12}>
        <div>
          <Title level={3} style={{ margin: 0, fontWeight: 900 }}>
            Categories Directory
          </Title>
          <Text type="secondary" style={{ fontSize: "13px" }}>
            Manage store product taxonomy, slugs, and SEO metadata
          </Text>
        </div>

        <Link href="/admin/categories/new">
          <Button type="primary" size="large" icon={<PlusOutlined />} style={{ fontWeight: 700 }}>
            Add Category
          </Button>
        </Link>
      </Flex>

      {/* Top Stat & Filter Box */}
      <Row gutter={[12, 12]}>
        <Col xs={24} sm={8}>
          <Card style={{ borderRadius: 16 }} styles={{ body: { padding: 14 } }}>
            <Statistic
              title={<Text type="secondary" style={{ fontSize: "11px", fontWeight: 700 }}>TOTAL CATEGORIES</Text>}
              value={totalCount}
              prefix={<AppstoreOutlined style={{ color: "#1677ff" }} />}
              styles={{ content: { fontWeight: 900, fontSize: "20px" } }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={16}>
          <Card style={{ borderRadius: 16, height: "100%" }} styles={{ body: { padding: 14 } }}>
            <Flex align="center" style={{ height: "100%" }}>
              <Input
                placeholder="Search categories by name, slug, or description..."
                prefix={<SearchOutlined style={{ color: "#94a3b8" }} />}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: "100%", borderRadius: 10 }}
                allowClear
              />
            </Flex>
          </Card>
        </Col>
      </Row>

      {/* Desktop Table View */}
      <div className="hidden md:block">
        <Card style={{ borderRadius: 16 }} styles={{ body: { padding: 0 } }}>
          <Table
            columns={columns}
            dataSource={filteredCategories}
            rowKey={(r) => String(r._id)}
            pagination={{ pageSize: 10, showSizeChanger: true }}
          />
        </Card>
      </div>

      {/* Mobile Card List View */}
      <div className="block md:hidden space-y-3">
        {filteredCategories.length > 0 ? (
          filteredCategories.map((cat) => (
            <Card
              key={String(cat._id)}
              style={{ borderRadius: 16, border: "1px solid #e2e8f0" }}
              styles={{ body: { padding: 14 } }}
            >
              <div className="space-y-3">
                {/* Top Bar: Image + Name & Slug */}
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
                    {cat.image ? (
                      <Image
                        src={cat.image}
                        alt={cat.name}
                        fill
                        sizes="52px"
                        className="object-contain p-1"
                      />
                    ) : (
                      <AppstoreOutlined style={{ fontSize: 22, color: "#cbd5e1" }} />
                    )}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Link
                      href={`/admin/categories/${String(cat._id)}`}
                      style={{ fontWeight: 800, color: "#0f172a", fontSize: "14px" }}
                      className="line-clamp-1"
                    >
                      {cat.name}
                    </Link>
                    <Text code style={{ fontSize: "11px", marginTop: 2, display: "inline-block" }}>
                      /{cat.slug}
                    </Text>
                  </div>
                </Flex>

                {/* Middle Description */}
                {cat.description && (
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <Text type="secondary" style={{ fontSize: "11px" }} className="line-clamp-2">
                      {cat.description}
                    </Text>
                  </div>
                )}

                {/* Bottom Footer: Actions */}
                <Flex align="center" justify="end" gap={8} style={{ paddingTop: 4 }}>
                  <Link href={`/admin/categories/${String(cat._id)}`}>
                    <Button size="small" type="primary" ghost icon={<EditOutlined />}>
                      Edit
                    </Button>
                  </Link>

                  <Popconfirm
                    title="Delete Category"
                    description="Are you sure you want to delete this category?"
                    onConfirm={() => handleDelete(String(cat._id))}
                    okText="Yes, Delete"
                    cancelText="Cancel"
                    okButtonProps={{ danger: true, loading: deletingId === String(cat._id) }}
                  >
                    <Button size="small" danger icon={<DeleteOutlined />}>
                      Delete
                    </Button>
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
                No categories match your search
              </Text>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
