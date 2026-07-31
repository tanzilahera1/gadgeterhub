// src/app/(admin)/admin/brands/new/BrandForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createBrand, updateBrand } from "@/actions/adminBrands";
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
  SaveOutlined,
  ArrowLeftOutlined,
  LoadingOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;
const { TextArea } = Input;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function BrandForm({ initialData }: { initialData?: any }) {
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
      logo: values.logo || "",
    };

    try {
      const res = isEditing
        ? await updateBrand(initialData._id, data)
        : await createBrand(data);

      if (res.success) {
        toast.success(isEditing ? "Brand updated successfully!" : "Brand created successfully!");
        router.push("/admin/brands");
      } else {
        toast.error(res.error || "Failed to save brand");
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
            { title: <Link href="/admin/brands">Brands</Link> },
            { title: isEditing ? "Edit Brand" : "Create Brand" },
          ]}
          style={{ marginBottom: 8 }}
        />
        <Title level={3} style={{ margin: 0, fontWeight: 900 }}>
          {isEditing ? "Edit Brand" : "Create New Brand"}
        </Title>
        <Text type="secondary" style={{ fontSize: "13px" }}>
          {isEditing
            ? `Updating details for: ${initialData?.name || ""}`
            : "Add a new brand to organize your product catalog."}
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
          logo: initialData?.logo || "",
        }}
        className="space-y-6"
      >
        {/* Section 1: Brand Identity */}
        <Card
          title={
            <Text strong style={{ fontSize: "15px" }}>
              <InfoCircleOutlined style={{ color: "#1677ff", marginRight: 8 }} />
              Brand Identity
            </Text>
          }
          style={{ borderRadius: 16 }}
          styles={{ body: { padding: 20 } }}
        >
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="name"
                label={<Text strong>Brand Name</Text>}
                rules={[{ required: true, message: "Please enter brand name" }]}
              >
                <Input size="large" placeholder="e.g. Apple, Samsung, Anker" style={{ borderRadius: 10 }} />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                name="slug"
                label={<Text strong>Custom Slug URL (Optional)</Text>}
                extra="Auto-generated from name if left empty."
              >
                <Input size="large" placeholder="e.g. apple" style={{ borderRadius: 10 }} />
              </Form.Item>
            </Col>

            <Col xs={24}>
              <Form.Item name="description" label={<Text strong>Brand Description</Text>}>
                <TextArea
                  rows={4}
                  placeholder="Brief history or description of the brand and its product line..."
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
              Media Assets
            </Text>
          }
          style={{ borderRadius: 16 }}
          styles={{ body: { padding: 20 } }}
        >
          <Form.Item
            name="logo"
            label={<Text strong>Brand Logo URL (Optional)</Text>}
            extra="Use a transparent PNG or SVG for best results."
          >
            <Input size="large" placeholder="https://example.com/brand-logo.png" style={{ borderRadius: 10 }} />
          </Form.Item>
        </Card>

        {/* Action Footer */}
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
              {isEditing ? "Save Brand Changes" : "Create Brand"}
            </Button>
          </Flex>
        </Card>
      </Form>
    </div>
  );
}
