// src/app/(admin)/admin/settings/SettingsForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { updateSettings } from "@/actions/adminSettings";
import { toast } from "sonner";
import {
  Card,
  Form,
  Input,
  InputNumber,
  Switch,
  Button,
  Row,
  Col,
  Breadcrumb,
  Typography,
  Flex,
  Alert,
  Divider,
} from "antd";
import {
  ShopOutlined,
  CarOutlined,
  ShareAltOutlined,
  WarningOutlined,
  SaveOutlined,
  LoadingOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function SettingsForm({ initialData }: { initialData?: any }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [form] = Form.useForm();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onFinish = async (values: any) => {
    setIsLoading(true);
    const data = {
      storeName: values.storeName,
      storeEmail: values.storeEmail || "",
      storePhone: values.storePhone || "",
      currency: values.currency,
      deliveryChargeInside: Number(values.deliveryChargeInside) || 60,
      deliveryChargeSuburbs: Number(values.deliveryChargeSuburbs) || 80,
      deliveryChargeOutside: Number(values.deliveryChargeOutside) || 110,
      freeShippingThreshold: Number(values.freeShippingThreshold) || 0,
      facebookURL: values.facebookURL || "",
      instagramURL: values.instagramURL || "",
      maintenanceMode: values.maintenanceMode || false,
    };

    try {
      const res = await updateSettings(data);
      if (res.success) {
        toast.success("Settings updated successfully!");
        router.refresh();
      } else {
        toast.error(res.error || "Failed to update settings");
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
            { title: "Settings" },
          ]}
          style={{ marginBottom: 8 }}
        />
        <Title level={3} style={{ margin: 0, fontWeight: 900 }}>
          Store Settings
        </Title>
        <Text type="secondary" style={{ fontSize: "13px" }}>
          Configure global e-commerce variables, logistics, and system preferences.
        </Text>
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{
          storeName: initialData?.storeName || "GadgeterHub",
          currency: initialData?.currency || "BDT",
          storeEmail: initialData?.storeEmail || "",
          storePhone: initialData?.storePhone || "",
          deliveryChargeInside: initialData?.deliveryChargeInside ?? 60,
          deliveryChargeSuburbs: initialData?.deliveryChargeSuburbs ?? 80,
          deliveryChargeOutside: initialData?.deliveryChargeOutside ?? 110,
          freeShippingThreshold: initialData?.freeShippingThreshold ?? 0,
          facebookURL: initialData?.facebookURL || "",
          instagramURL: initialData?.instagramURL || "",
          maintenanceMode: initialData?.maintenanceMode || false,
        }}
        className="space-y-6"
      >
        {/* Section 1: General Store Info */}
        <Card
          title={
            <Text strong style={{ fontSize: "15px" }}>
              <ShopOutlined style={{ color: "#1677ff", marginRight: 8 }} />
              General Information
            </Text>
          }
          style={{ borderRadius: 16 }}
          styles={{ body: { padding: 20 } }}
        >
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="storeName"
                label={<Text strong>Store Name</Text>}
                rules={[{ required: true, message: "Please enter store name" }]}
              >
                <Input size="large" placeholder="GadgeterHub" style={{ borderRadius: 10 }} />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                name="currency"
                label={<Text strong>Currency Symbol</Text>}
                rules={[{ required: true, message: "Please enter currency" }]}
              >
                <Input size="large" placeholder="BDT" style={{ borderRadius: 10 }} />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item name="storeEmail" label={<Text strong>Contact Email</Text>}>
                <Input size="large" type="email" placeholder="support@store.com" style={{ borderRadius: 10 }} />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item name="storePhone" label={<Text strong>Customer Support Phone</Text>}>
                <Input size="large" placeholder="+880 1XXX XXXXXX" style={{ borderRadius: 10 }} />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Section 2: Logistics */}
        <Card
          title={
            <Text strong style={{ fontSize: "15px" }}>
              <CarOutlined style={{ color: "#1677ff", marginRight: 8 }} />
              Logistics & Delivery Constraints (Base 0-500g Tier)
            </Text>
          }
          style={{ borderRadius: 16 }}
          styles={{ body: { padding: 20 } }}
        >
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={8}>
              <Form.Item
                name="deliveryChargeInside"
                label={<Text strong>Inside Dhaka (ISD) (৳)</Text>}
              >
                <InputNumber
                  size="large"
                  min={0}
                  style={{ width: "100%", borderRadius: 10 }}
                  placeholder="60"
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={8}>
              <Form.Item
                name="deliveryChargeSuburbs"
                label={<Text strong>Suburbs (SUB) (৳)</Text>}
                extra="গাজীপুর, সাভার, নারায়নগঞ্জ, কেরানীগঞ্জ"
              >
                <InputNumber
                  size="large"
                  min={0}
                  style={{ width: "100%", borderRadius: 10 }}
                  placeholder="80"
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={8}>
              <Form.Item
                name="deliveryChargeOutside"
                label={<Text strong>Outside Dhaka (OSD) (৳)</Text>}
              >
                <InputNumber
                  size="large"
                  min={0}
                  style={{ width: "100%", borderRadius: 10 }}
                  placeholder="110"
                />
              </Form.Item>
            </Col>

            <Col xs={24}>
              <Form.Item
                name="freeShippingThreshold"
                label={<Text strong>Free Shipping Threshold (৳)</Text>}
                extra="Set to 0 to disable the free shipping feature."
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

        {/* Section 3: Social Connections */}
        <Card
          title={
            <Text strong style={{ fontSize: "15px" }}>
              <ShareAltOutlined style={{ color: "#1677ff", marginRight: 8 }} />
              Social Connections
            </Text>
          }
          style={{ borderRadius: 16 }}
          styles={{ body: { padding: 20 } }}
        >
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12}>
              <Form.Item name="facebookURL" label={<Text strong>Facebook Page URL</Text>}>
                <Input size="large" placeholder="https://facebook.com/..." style={{ borderRadius: 10 }} />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item name="instagramURL" label={<Text strong>Instagram Profile URL</Text>}>
                <Input size="large" placeholder="https://instagram.com/..." style={{ borderRadius: 10 }} />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Section 4: Danger Zone */}
        <Card
          title={
            <Text strong style={{ fontSize: "15px", color: "#cf1322" }}>
              <WarningOutlined style={{ color: "#cf1322", marginRight: 8 }} />
              Danger Zone
            </Text>
          }
          style={{ borderRadius: 16, borderColor: "#ffa39e" }}
          styles={{ body: { padding: 20 } }}
        >
          <Alert
            type="error"
            title="Maintenance Mode"
            description="Enabling maintenance mode instantly disables consumer access to the main storefront. Only administrators will be able to log in. This is a highly destructive state switch — use with caution."
            style={{ borderRadius: 12, marginBottom: 16 }}
          />

          <Divider style={{ margin: "12px 0" }} />

          <Form.Item name="maintenanceMode" valuePropName="checked" noStyle>
            <Flex align="center" gap={12}>
              <Switch />
              <div>
                <Text strong style={{ display: "block", color: "#cf1322" }}>
                  Enable Maintenance Mode
                </Text>
                <Text type="secondary" style={{ fontSize: "12px" }}>
                  Storefront will be inaccessible to all non-admin users.
                </Text>
              </div>
            </Flex>
          </Form.Item>
        </Card>

        {/* Action Footer */}
        <Card style={{ borderRadius: 16 }} styles={{ body: { padding: 16 } }}>
          <Flex justify="end" align="center">
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              loading={isLoading}
              icon={isLoading ? <LoadingOutlined /> : <SaveOutlined />}
              style={{ fontWeight: 800, paddingLeft: 28, paddingRight: 28 }}
            >
              Save Global Settings
            </Button>
          </Flex>
        </Card>
      </Form>
    </div>
  );
}
