// src/app/(admin)/admin/products/new/ProductForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createProduct, updateProduct } from "@/actions/adminProducts";
import { toast } from "sonner";
import Link from "next/link";
import {
  Card,
  Form,
  Input,
  InputNumber,
  Select,
  Switch,
  Button,
  Row,
  Col,
  Space,
  Typography,
  Divider,
  Flex,
  Breadcrumb,
} from "antd";
import {
  InfoCircleOutlined,
  DollarOutlined,
  PictureOutlined,
  FileTextOutlined,
  SaveOutlined,
  PlusOutlined,
  DeleteOutlined,
  ArrowLeftOutlined,
  LoadingOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;
const { TextArea } = Input;

interface Category {
  _id: string;
  name: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function ProductForm({ categories, initialData }: { categories: Category[]; initialData?: any }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [form] = Form.useForm();
  
  const isEditing = Boolean(initialData);

  // Gallery image URLs state
  const [galleryImages, setGalleryImages] = useState<string[]>(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    initialData?.images?.length ? initialData.images.map((img: any) => img.url) : [""]
  );

  const handleAddGalleryField = () => {
    setGalleryImages([...galleryImages, ""]);
  };

  const handleRemoveGalleryField = (index: number) => {
    if (galleryImages.length > 1) {
      const updated = [...galleryImages];
      updated.splice(index, 1);
      setGalleryImages(updated);
    } else {
      setGalleryImages([""]);
    }
  };

  const handleGalleryChange = (index: number, val: string) => {
    const updated = [...galleryImages];
    updated[index] = val;
    setGalleryImages(updated);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onFinish = async (values: any) => {
    setIsLoading(true);

    const validGallery = galleryImages.filter((img) => img.trim() !== "");

    const data = {
      title: values.title,
      sku: values.sku,
      category: values.category,
      brand: values.brand || "",
      stockQuantity: values.stockQuantity,
      regularPrice: values.regularPrice,
      salePrice: values.salePrice || 0,
      status: values.status,
      isDraft: values.status === "draft",
      featured: values.featured || false,
      bestseller: values.bestseller || false,
      thumbnail: values.thumbnail,
      images: validGallery,
      shortDesc: values.shortDesc,
      description: values.description,
    };

    try {
      const res = isEditing
        ? await updateProduct(initialData._id, data)
        : await createProduct(data);

      if (res.success) {
        toast.success(isEditing ? "Product updated successfully!" : "Product created successfully!");
        router.push("/admin/products");
      } else {
        toast.error(res.error || "Failed to save product");
      }
    } catch (err: any) {
      toast.error(err.message || "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <Breadcrumb
          items={[
            { title: <Link href="/admin">Dashboard</Link> },
            { title: <Link href="/admin/products">Products</Link> },
            { title: isEditing ? "Edit Product" : "Create Product" },
          ]}
          style={{ marginBottom: 8 }}
        />
        <Title level={3} style={{ margin: 0, fontWeight: 900 }}>
          {isEditing ? "Edit Product Listing" : "Create New Product"}
        </Title>
        <Text type="secondary" style={{ fontSize: "13px" }}>
          {isEditing
            ? `Updating information for: ${initialData?.title || ""}`
            : "Add a new item to your store catalog. Fill in all required details."}
        </Text>
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{
          title: initialData?.title || "",
          sku: initialData?.sku || "",
          category: initialData?.category || undefined,
          brand: initialData?.brand || "",
        stockQuantity: initialData?.stockQuantity ?? 0,
        regularPrice: initialData?.regularPrice ?? undefined,
        salePrice: initialData?.salePrice ?? undefined,
        status: initialData?.status || "published",
        featured: initialData?.featured || false,
        bestseller: initialData?.bestseller || false,
        thumbnail: initialData?.thumbnail || "",
        shortDesc: initialData?.shortDesc || "",
        description: initialData?.description || "",
      }}
      className="space-y-6"
    >
      {/* Section 1: Basic Information */}
      <Card
        title={
          <Text strong style={{ fontSize: "15px" }}>
            <InfoCircleOutlined style={{ color: "#1677ff", marginRight: 8 }} />
            Basic Details
          </Text>
        }
        style={{ borderRadius: 16 }}
        styles={{ body: { padding: 20 } }}
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12}>
            <Form.Item
              name="title"
              label={<Text strong>Product Title</Text>}
              rules={[{ required: true, message: "Please enter product title" }]}
            >
              <Input size="large" placeholder="e.g. Apple AirPods Pro 2" style={{ borderRadius: 10 }} />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12}>
            <Form.Item
              name="sku"
              label={<Text strong>SKU (Stock Keeping Unit)</Text>}
              rules={[{ required: true, message: "Please enter SKU" }]}
            >
              <Input size="large" placeholder="e.g. APP-AIRPODS-PRO2" style={{ borderRadius: 10 }} />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12}>
            <Form.Item
              name="category"
              label={<Text strong>Category</Text>}
              rules={[{ required: true, message: "Please select a category" }]}
            >
              <Select
                size="large"
                placeholder="Select a category"
                style={{ borderRadius: 10 }}
                options={categories.map((c) => ({ value: c._id, label: c.name }))}
              />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12}>
            <Form.Item name="brand" label={<Text strong>Brand (Optional)</Text>}>
              <Input size="large" placeholder="e.g. Apple, Samsung, Anker" style={{ borderRadius: 10 }} />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12}>
            <Form.Item
              name="stockQuantity"
              label={<Text strong>Stock Quantity</Text>}
              rules={[{ required: true, message: "Please enter stock quantity" }]}
            >
              <InputNumber
                size="large"
                min={0}
                style={{ width: "100%", borderRadius: 10 }}
                placeholder="0"
              />
            </Form.Item>
          </Col>
        </Row>
      </Card>

      {/* Section 2: Pricing & Status */}
      <Card
        title={
          <Text strong style={{ fontSize: "15px" }}>
            <DollarOutlined style={{ color: "#1677ff", marginRight: 8 }} />
            Pricing & Status
          </Text>
        }
        style={{ borderRadius: 16 }}
        styles={{ body: { padding: 20 } }}
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={8}>
            <Form.Item
              name="regularPrice"
              label={<Text strong>Regular Price (৳)</Text>}
              rules={[{ required: true, message: "Please enter regular price" }]}
            >
              <InputNumber
                size="large"
                min={0}
                style={{ width: "100%", borderRadius: 10 }}
                placeholder="e.g. 12000"
              />
            </Form.Item>
          </Col>

          <Col xs={24} sm={8}>
            <Form.Item name="salePrice" label={<Text strong>Sale Price (৳)</Text>}>
              <InputNumber
                size="large"
                min={0}
                style={{ width: "100%", borderRadius: 10 }}
                placeholder="Optional discount price"
              />
            </Form.Item>
          </Col>

          <Col xs={24} sm={8}>
            <Form.Item
              name="status"
              label={<Text strong>Status</Text>}
              rules={[{ required: true, message: "Please select status" }]}
            >
              <Select
                size="large"
                style={{ borderRadius: 10 }}
                options={[
                  { value: "published", label: "Published (Active)" },
                  { value: "draft", label: "Draft (Hidden)" },
                  { value: "archived", label: "Archived" },
                ]}
              />
            </Form.Item>
          </Col>
        </Row>

        <Divider style={{ margin: "16px 0" }} />

        <Flex gap={24} wrap="wrap">
          <Form.Item name="featured" valuePropName="checked" noStyle>
            <Flex align="center" gap={8}>
              <Switch />
              <Text strong>Featured Product</Text>
            </Flex>
          </Form.Item>

          <Form.Item name="bestseller" valuePropName="checked" noStyle>
            <Flex align="center" gap={8}>
              <Switch />
              <Text strong>Bestseller Product</Text>
            </Flex>
          </Form.Item>
        </Flex>
      </Card>

      {/* Section 3: Media */}
      <Card
        title={
          <Text strong style={{ fontSize: "15px" }}>
            <PictureOutlined style={{ color: "#1677ff", marginRight: 8 }} />
            Media & Images
          </Text>
        }
        style={{ borderRadius: 16 }}
        styles={{ body: { padding: 20 } }}
      >
        <Form.Item
          name="thumbnail"
          label={<Text strong>Main Thumbnail Image URL</Text>}
          rules={[{ required: true, message: "Please enter thumbnail image URL" }]}
          extra="This is the primary image displayed on catalog cards."
        >
          <Input size="large" placeholder="https://example.com/thumbnail.jpg" style={{ borderRadius: 10 }} />
        </Form.Item>

        <Divider style={{ margin: "16px 0" }} />

        <div>
          <Text strong style={{ display: "block", marginBottom: 4 }}>
            Gallery Image URLs
          </Text>
          <Text type="secondary" style={{ fontSize: "12px", display: "block", marginBottom: 12 }}>
            Add additional high-resolution product images for detail gallery.
          </Text>

          <Flex vertical gap={12} style={{ width: "100%" }}>
            {galleryImages.map((img, idx) => (
              <Flex key={idx} align="center" gap={8}>
                <Input
                  size="large"
                  placeholder="https://example.com/gallery-image.jpg"
                  value={img}
                  onChange={(e) => handleGalleryChange(idx, e.target.value)}
                  style={{ borderRadius: 10 }}
                />
                <Button
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => handleRemoveGalleryField(idx)}
                />
              </Flex>
            ))}

            <Button
              type="dashed"
              icon={<PlusOutlined />}
              onClick={handleAddGalleryField}
              style={{ fontWeight: 600, borderRadius: 10 }}
            >
              Add Another Gallery Image
            </Button>
          </Flex>
        </div>
      </Card>

      {/* Section 4: Descriptions */}
      <Card
        title={
          <Text strong style={{ fontSize: "15px" }}>
            <FileTextOutlined style={{ color: "#1677ff", marginRight: 8 }} />
            Product Description
          </Text>
        }
        style={{ borderRadius: 16 }}
        styles={{ body: { padding: 20 } }}
      >
        <Form.Item
          name="shortDesc"
          label={<Text strong>Short Summary (Max 160 characters)</Text>}
          rules={[{ required: true, message: "Please enter short description" }]}
        >
          <Input maxLength={160} size="large" placeholder="Brief summary of key features" style={{ borderRadius: 10 }} />
        </Form.Item>

        <Form.Item
          name="description"
          label={<Text strong>Full Specification & Description</Text>}
          rules={[{ required: true, message: "Please enter full description" }]}
        >
          <TextArea
            rows={6}
            placeholder="Detailed features, specifications, package contents, and warranty details..."
            style={{ borderRadius: 10 }}
          />
        </Form.Item>
      </Card>

      {/* Bottom Action Footer */}
      <Card style={{ borderRadius: 16 }} styles={{ body: { padding: 16 } }}>
        <Flex justify="space-between" align="center" wrap="wrap" gap={12}>
          <Button icon={<ArrowLeftOutlined />} onClick={() => router.back()} style={{ fontWeight: 600 }}>
            Cancel
          </Button>

          <Button
            type="primary"
            htmlType="submit"
            size="large"
            loading={isLoading}
            icon={isLoading ? <LoadingOutlined /> : <SaveOutlined />}
            style={{ fontWeight: 800, paddingLeft: 24, paddingRight: 24 }}
          >
            {isEditing ? "Save Product Changes" : "Create Product"}
          </Button>
        </Flex>
      </Card>
      </Form>
    </div>
  );
}
