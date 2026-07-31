// src/components/admin/AdminProductsAntdClient.tsx
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
  Select,
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
  ShoppingOutlined,
  EditOutlined,
  DeleteOutlined,
  ExportOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  InboxOutlined,
} from "@ant-design/icons";
import { formatPrice } from "@/lib/priceUtils";
import { deleteProduct } from "@/actions/adminProducts";
import type { IProduct } from "@/types/product";

const { Title, Text } = Typography;

interface CategoryOption {
  _id: string;
  name: string;
  slug: string;
}

interface Props {
  products: IProduct[];
  categories: CategoryOption[];
}

export function AdminProductsAntdClient({ products: initialProducts, categories }: Props) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Compute stats
  const totalCount = initialProducts.length;
  const activeCount = initialProducts.filter((p) => p.status !== "draft").length;
  const outOfStockCount = initialProducts.filter((p) => p.stockQuantity <= 0).length;

  // Filter products
  const filteredProducts = initialProducts.filter((product) => {
    // Status filter
    if (statusFilter === "published" && product.status === "draft") return false;
    if (statusFilter === "draft" && product.status !== "draft") return false;

    // Category filter
    if (categoryFilter !== "all") {
      const catId = typeof product.category === "object" && product.category ? product.category._id : String(product.category);
      if (catId !== categoryFilter) return false;
    }

    // Search query (title, sku, brand)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const titleMatch = product.title.toLowerCase().includes(q);
      const skuMatch = product.sku?.toLowerCase().includes(q);
      const brandMatch = String(product.brand || "").toLowerCase().includes(q);
      return titleMatch || skuMatch || brandMatch;
    }

    return true;
  });

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await deleteProduct(id);
      if (res.success) {
        toast.success("Product deleted successfully!");
        router.refresh();
      } else {
        toast.error(res.error || "Failed to delete product");
      }
    } catch {
      toast.error("An error occurred while deleting product");
    } finally {
      setDeletingId(null);
    }
  };

  // Antd Table Columns
  const columns: ColumnsType<IProduct> = [
    {
      title: "Image",
      dataIndex: "thumbnail",
      key: "thumbnail",
      width: 80,
      render: (thumb, record) => (
        <div
          style={{
            width: 54,
            height: 54,
            borderRadius: 10,
            overflow: "hidden",
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
            position: "relative",
          }}
        >
          <Image
            src={thumb || "/placeholder-image.png"}
            alt={record.title}
            fill
            sizes="54px"
            className="object-contain p-1"
          />
        </div>
      ),
    },
    {
      title: "Product Details",
      key: "title",
      render: (_, record) => {
        const categoryData = record.category as unknown as CategoryOption | null;
        return (
          <div style={{ maxWidth: 300 }}>
            <Link
              href={`/admin/products/${String(record._id)}`}
              style={{ fontWeight: 800, color: "#0f172a", fontSize: "14px" }}
              className="hover:text-blue-600 transition-colors line-clamp-1"
            >
              {record.title}
            </Link>
            <Flex align="center" gap={6} style={{ marginTop: 4 }}>
              <Text code style={{ fontSize: "11px" }}>
                {record.sku}
              </Text>
              <Tag color="blue" style={{ fontSize: "10px", margin: 0, borderRadius: 6 }}>
                {categoryData?.name || "Uncategorized"}
              </Tag>
              {record.brand && (
                <Tag style={{ fontSize: "10px", margin: 0, borderRadius: 6 }}>
                  {String(record.brand)}
                </Tag>
              )}
            </Flex>
          </div>
        );
      },
    },
    {
      title: "Pricing",
      key: "price",
      render: (_, record) => {
        const displayPrice = record.salePrice || record.regularPrice;
        const hasDiscount = (record.salePrice || 0) > 0 && (record.salePrice || 0) < record.regularPrice;
        return (
          <div>
            <Text strong style={{ fontSize: "14px", color: "#0f172a" }}>
              {formatPrice(displayPrice)}
            </Text>
            {hasDiscount && (
              <Text delete type="secondary" style={{ fontSize: "11px", display: "block" }}>
                {formatPrice(record.regularPrice)}
              </Text>
            )}
          </div>
        );
      },
    },
    {
      title: "Stock",
      key: "stock",
      render: (_, record) => {
        const inStock = record.stockQuantity > 0;
        const isLow = record.stockQuantity > 0 && record.stockQuantity <= 10;
        return (
          <Tag
            color={!inStock ? "red" : isLow ? "gold" : "green"}
            style={{ fontWeight: 700, borderRadius: 6 }}
          >
            {inStock ? `${record.stockQuantity} in stock` : "Out of Stock"}
          </Tag>
        );
      },
    },
    {
      title: "Status",
      key: "status",
      render: (_, record) => (
        <Tag
          color={record.status === "draft" ? "default" : "blue"}
          style={{ fontWeight: 800, borderRadius: 6 }}
        >
          {record.status === "draft" ? "DRAFT" : "PUBLISHED"}
        </Tag>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      align: "center",
      render: (_, record) => {
        const categoryData = record.category as unknown as CategoryOption | null;
        return (
          <Space>
            <Tooltip title="View in Store">
              <Link
                href={`/products/${categoryData?.slug || "uncategorized"}/${record.slug}`}
                target="_blank"
              >
                <Button size="small" icon={<ExportOutlined />} />
              </Link>
            </Tooltip>

            <Tooltip title="Edit Product">
              <Link href={`/admin/products/${String(record._id)}`}>
                <Button size="small" type="primary" ghost icon={<EditOutlined />} />
              </Link>
            </Tooltip>

            <Popconfirm
              title="Delete Product"
              description="Are you sure you want to delete this product?"
              onConfirm={() => handleDelete(String(record._id))}
              okText="Yes, Delete"
              cancelText="Cancel"
              okButtonProps={{ danger: true, loading: deletingId === String(record._id) }}
            >
              <Button size="small" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header Bar */}
      <Flex align="center" justify="space-between" wrap="wrap" gap={12}>
        <div>
          <Title level={3} style={{ margin: 0, fontWeight: 900 }}>
            Products Directory
          </Title>
          <Text type="secondary" style={{ fontSize: "13px" }}>
            Manage store catalog, pricing, inventory, and status
          </Text>
        </div>

        <Link href="/admin/products/new">
          <Button type="primary" size="large" icon={<PlusOutlined />} style={{ fontWeight: 700 }}>
            Add Product
          </Button>
        </Link>
      </Flex>

      {/* Top 3 Stat Cards Grid */}
      <Row gutter={[12, 12]}>
        <Col xs={8} sm={8}>
          <Card style={{ borderRadius: 16 }} styles={{ body: { padding: 14 } }}>
            <Statistic
              title={<Text type="secondary" style={{ fontSize: "11px", fontWeight: 700 }}>TOTAL PRODUCTS</Text>}
              value={totalCount}
              prefix={<ShoppingOutlined style={{ color: "#1677ff" }} />}
              styles={{ content: { fontWeight: 900, fontSize: "20px" } }}
            />
          </Card>
        </Col>

        <Col xs={8} sm={8}>
          <Card style={{ borderRadius: 16 }} styles={{ body: { padding: 14 } }}>
            <Statistic
              title={<Text type="secondary" style={{ fontSize: "11px", fontWeight: 700 }}>ACTIVE LISTINGS</Text>}
              value={activeCount}
              prefix={<CheckCircleOutlined style={{ color: "#52c41a" }} />}
              styles={{ content: { fontWeight: 900, fontSize: "20px" } }}
            />
          </Card>
        </Col>

        <Col xs={8} sm={8}>
          <Card style={{ borderRadius: 16 }} styles={{ body: { padding: 14 } }}>
            <Statistic
              title={<Text type="secondary" style={{ fontSize: "11px", fontWeight: 700 }}>OUT OF STOCK</Text>}
              value={outOfStockCount}
              prefix={<WarningOutlined style={{ color: "#ff4d4f" }} />}
              styles={{ content: { fontWeight: 900, fontSize: "20px" } }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filter & Search Header Box */}
      <Card style={{ borderRadius: 16 }} styles={{ body: { padding: 14 } }}>
        <Flex align="center" justify="space-between" wrap="wrap" gap={12}>
          <Input
            placeholder="Search by title, SKU, or brand..."
            prefix={<SearchOutlined style={{ color: "#94a3b8" }} />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: 280, borderRadius: 10 }}
            allowClear
          />

          <Flex align="center" gap={8} wrap="wrap">
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: 140 }}
              options={[
                { value: "all", label: "All Status" },
                { value: "published", label: "Published" },
                { value: "draft", label: "Draft" },
              ]}
            />

            <Select
              value={categoryFilter}
              onChange={setCategoryFilter}
              style={{ width: 160 }}
              options={[
                { value: "all", label: "All Categories" },
                ...categories.map((c) => ({ value: c._id, label: c.name })),
              ]}
            />
          </Flex>
        </Flex>
      </Card>

      {/* Desktop Table View */}
      <div className="hidden md:block">
        <Card style={{ borderRadius: 16 }} styles={{ body: { padding: 0 } }}>
          <Table
            columns={columns}
            dataSource={filteredProducts}
            rowKey={(r) => String(r._id)}
            pagination={{ pageSize: 10, showSizeChanger: true }}
          />
        </Card>
      </div>

      {/* Mobile Card List View */}
      <div className="block md:hidden space-y-3">
        {filteredProducts.length > 0 ? (
          filteredProducts.map((product) => {
            const categoryData = product.category as unknown as CategoryOption | null;
            const displayPrice = product.salePrice || product.regularPrice;
            const inStock = product.stockQuantity > 0;

            return (
              <Card
                key={String(product._id)}
                style={{ borderRadius: 16, border: "1px solid #e2e8f0" }}
                styles={{ body: { padding: 14 } }}
              >
                <div className="space-y-3">
                  {/* Top Bar: Thumbnail + Title & Tags */}
                  <Flex align="start" gap={10}>
                    <div
                      style={{
                        width: 56,
                        height: 56,
                        borderRadius: 10,
                        overflow: "hidden",
                        background: "#f8fafc",
                        border: "1px solid #e2e8f0",
                        position: "relative",
                        flexShrink: 0,
                      }}
                    >
                      <Image
                        src={product.thumbnail || "/placeholder-image.png"}
                        alt={product.title}
                        fill
                        sizes="56px"
                        className="object-contain p-1"
                      />
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <Link
                        href={`/admin/products/${String(product._id)}`}
                        style={{ fontWeight: 800, color: "#0f172a", fontSize: "13px" }}
                        className="line-clamp-2"
                      >
                        {product.title}
                      </Link>
                      <Flex align="center" gap={4} wrap="wrap" style={{ marginTop: 4 }}>
                        <Text code style={{ fontSize: "10px" }}>
                          {product.sku}
                        </Text>
                        <Tag color="blue" style={{ fontSize: "10px", margin: 0, borderRadius: 6 }}>
                          {categoryData?.name || "Uncategorized"}
                        </Tag>
                      </Flex>
                    </div>
                  </Flex>

                  {/* Middle Body: Price & Stock Tag */}
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex items-center justify-between">
                    <div>
                      <Text type="secondary" style={{ fontSize: "10px", display: "block" }}>
                        PRICING
                      </Text>
                      <Text strong style={{ fontSize: "15px", color: "#1677ff" }}>
                        {formatPrice(displayPrice)}
                      </Text>
                    </div>

                    <Tag
                      color={!inStock ? "red" : "green"}
                      style={{ fontWeight: 700, borderRadius: 6, margin: 0 }}
                    >
                      {inStock ? `${product.stockQuantity} Stock` : "Out of Stock"}
                    </Tag>
                  </div>

                  {/* Bottom Footer: Status + Actions */}
                  <Flex align="center" justify="space-between" style={{ paddingTop: 4 }}>
                    <Tag
                      color={product.status === "draft" ? "default" : "blue"}
                      style={{ fontWeight: 800, borderRadius: 6, margin: 0 }}
                    >
                      {product.status === "draft" ? "DRAFT" : "PUBLISHED"}
                    </Tag>

                    <Space size="small">
                      <Link
                        href={`/products/${categoryData?.slug || "uncategorized"}/${product.slug}`}
                        target="_blank"
                      >
                        <Button size="small" icon={<ExportOutlined />} />
                      </Link>
                      <Link href={`/admin/products/${String(product._id)}`}>
                        <Button size="small" type="primary" ghost icon={<EditOutlined />} />
                      </Link>

                      <Popconfirm
                        title="Delete Product"
                        description="Are you sure you want to delete this product?"
                        onConfirm={() => handleDelete(String(product._id))}
                        okText="Yes, Delete"
                        cancelText="Cancel"
                        okButtonProps={{ danger: true, loading: deletingId === String(product._id) }}
                      >
                        <Button size="small" danger icon={<DeleteOutlined />} />
                      </Popconfirm>
                    </Space>
                  </Flex>
                </div>
              </Card>
            );
          })
        ) : (
          <Card style={{ borderRadius: 16 }} styles={{ body: { padding: 30 } }}>
            <div style={{ textAlign: "center" }}>
              <InboxOutlined style={{ fontSize: 36, color: "#ccc" }} />
              <Text type="secondary" style={{ display: "block", marginTop: 8 }}>
                No products match your search or filter
              </Text>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
