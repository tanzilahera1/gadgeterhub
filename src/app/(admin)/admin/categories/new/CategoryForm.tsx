// src/app/(admin)/admin/categories/new/CategoryForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createCategory, updateCategory } from "@/actions/adminCategories";
import { toast } from "sonner";
import {
  Card,
  Form,
  Input,
  Button,
  Row,
  Col,
  Breadcrumb,
  Typography,
  Flex,
} from "antd";
import {
  InfoCircleOutlined,
  PictureOutlined,
  AimOutlined,
  SaveOutlined,
  ArrowLeftOutlined,
  LoadingOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;
const { TextArea } = Input;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function CategoryForm({ initialData }: { initialData?: any }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [form] = Form.useForm();

  const isEditing = Boolean(initialData);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onFinish = async (values: any) => {
    setIsLoading(true);

    const data = {
      name: values.name,
      slug: values.slug || "",
      description: values.description || "",
      image: values.image || "",
      seoTitle: values.seoTitle || "",
      seoDesc: values.seoDesc || "",
    };

    try {
      const res = isEditing
        ? await updateCategory(initialData._id, data)
        : await createCategory(data);

      if (res.success) {
        toast.success(isEditing ? "Category updated successfully!" : "Category created successfully!");
        router.push("/admin/categories");
      } else {
        toast.error(res.error || "Failed to save category");
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
            { title: <Link href="/admin/categories">Categories</Link> },
            { title: isEditing ? "Edit Category" : "Create Category" },
          ]}
          style={{ marginBottom: 8 }}
        />
        <Title level={3} style={{ margin: 0, fontWeight: 900 }}>
          {isEditing ? "Edit Category Listing" : "Create New Category"}
        </Title>
        <Text type="secondary" style={{ fontSize: "13px" }}>
          {isEditing
            ? `Updating details for: ${initialData?.name || ""}`
            : "Add a new product category to organize your catalog."}
        </Text>
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{
          name: initialData?.name || "",
          slug: initialData?.slug || "",
          description: initialData?.description || "",
          image: initialData?.image || "",
          seoTitle: initialData?.seoTitle || "",
          seoDesc: initialData?.seoDesc || "",
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
                name="name"
                label={<Text strong>Category Name</Text>}
                rules={[{ required: true, message: "Please enter category name" }]}
              >
                <Input size="large" placeholder="e.g. Smartphones, Audio, Accessories" style={{ borderRadius: 10 }} />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                name="slug"
                label={<Text strong>Custom Slug URL (Optional)</Text>}
                extra="Auto-generated from name if left empty."
              >
                <Input size="large" placeholder="e.g. smart-phones" style={{ borderRadius: 10 }} />
              </Form.Item>
            </Col>

            <Col xs={24}>
              <Form.Item name="description" label={<Text strong>Category Description</Text>}>
                <TextArea
                  rows={4}
                  placeholder="Brief description of products featured in this category..."
                  style={{ borderRadius: 10 }}
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Section 2: Media */}
        <Card
          title={
            <Text strong style={{ fontSize: "15px" }}>
              <PictureOutlined style={{ color: "#1677ff", marginRight: 8 }} />
              Cover Media
            </Text>
          }
          style={{ borderRadius: 16 }}
          styles={{ body: { padding: 20 } }}
        >
          <Form.Item
            name="image"
            label={<Text strong>Cover Image URL (Optional)</Text>}
            extra="High-resolution banner or square thumbnail image URL."
          >
            <Input size="large" placeholder="https://example.com/category-cover.jpg" style={{ borderRadius: 10 }} />
          </Form.Item>
        </Card>

        {/* Section 3: Search Engine Optimization */}
        <Card
          title={
            <Text strong style={{ fontSize: "15px" }}>
              <AimOutlined style={{ color: "#1677ff", marginRight: 8 }} />
              Search Engine Optimization (SEO)
            </Text>
          }
          style={{ borderRadius: 16 }}
          styles={{ body: { padding: 20 } }}
        >
          <Row gutter={[16, 16]}>
            <Col xs={24}>
              <Form.Item name="seoTitle" label={<Text strong>Meta Title</Text>}>
                <Input size="large" placeholder="SEO title for search engines" style={{ borderRadius: 10 }} />
              </Form.Item>
            </Col>

            <Col xs={24}>
              <Form.Item name="seoDesc" label={<Text strong>Meta Description</Text>}>
                <TextArea
                  rows={3}
                  placeholder="Brief meta description summary for search engine results..."
                  style={{ borderRadius: 10 }}
                />
              </Form.Item>
            </Col>
          </Row>
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
              {isEditing ? "Save Category Changes" : "Create Category"}
            </Button>
          </Flex>
        </Card>
      </Form>
    </div>
  );
}
