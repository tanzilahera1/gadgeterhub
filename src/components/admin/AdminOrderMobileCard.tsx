// src/components/admin/AdminOrderMobileCard.tsx
"use client";

import Link from "next/link";
import { Card, Tag, Typography, Button, Flex } from "antd";
import { EyeOutlined } from "@ant-design/icons";
import { format } from "date-fns";
import { formatPrice } from "@/lib/priceUtils";
import { IOrder, CHANNEL_LABELS } from "@/types/order";
import { StatusUpdater } from "@/components/admin/StatusUpdater";
import { getZoneBadgeInfo } from "@/lib/shipping";

const { Text } = Typography;

interface AdminOrderMobileCardProps {
  order: IOrder;
  marginBottom?: number;
}

export function AdminOrderMobileCard({
  order,
  marginBottom = 8,
}: AdminOrderMobileCardProps) {
  const channelKey = order.channelSource || "web";
  const channelLabel = CHANNEL_LABELS[channelKey] || "Website";
  const orderIdStr = order._id ? order._id.toString() : "";

  return (
    <Card
      style={{
        borderRadius: 16,
        border: "1px solid #e2e8f0",
        marginBottom,
      }}
      styles={{ body: { padding: 14 } }}
    >
      <div className="space-y-3">
        {/* Top Bar: Order ID & Channel + Status */}
        <Flex align="start" justify="space-between" gap={8}>
          <div>
            <Text
              code
              style={{
                fontWeight: 900,
                fontSize: "14px",
                display: "inline-block",
                margin: 0,
                letterSpacing: "0.5px",
              }}
            >
              {order.orderNumber}
            </Text>
            <div style={{ marginTop: 4, marginBottom: 8 }}>
              <Tag
                color="blue"
                style={{
                  fontSize: "10px",
                  margin: 0,
                  borderRadius: 6,
                  padding: "0 5px",
                  lineHeight: "18px",
                }}
              >
                {channelLabel}
              </Tag>
            </div>
          </div>

          {orderIdStr && (
            <StatusUpdater
              orderId={orderIdStr}
              currentStatus={order.orderStatus || "pending"}
            />
          )}
        </Flex>

        {/* Middle Body: Customer Info & Price + Eye Button */}
        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex items-center justify-between gap-2">
          <div>
            <Text strong style={{ display: "block", fontSize: "13px" }}>
              {order.shipping?.name}
            </Text>
            <Text type="secondary" style={{ fontSize: "11px" }}>
              {order.shipping?.phone}
            </Text>
          </div>

          <Flex align="center" gap={8}>
            <Text strong style={{ fontSize: "15px", color: "#1677ff" }}>
              {formatPrice(order.total)}
            </Text>
            {orderIdStr && (
              <Link href={`/admin/orders/${orderIdStr}`}>
                <Button icon={<EyeOutlined />} size="small" type="default" />
              </Link>
            )}
          </Flex>
        </div>

        {/* Bottom Footer: Date | Delivery Zone | Payment */}
        <div className="flex items-center justify-between pt-0.5">
          <Text type="secondary" style={{ fontSize: "11px" }}>
            {order.createdAt
              ? format(new Date(order.createdAt), "dd MMM, hh:mm a")
              : ""}
          </Text>

          {(() => {
            const zoneBadge = getZoneBadgeInfo(
              order.shipping,
              order.shippingCost,
            );
            return (
              <Tag
                color={zoneBadge.color}
                style={{
                  margin: 0,
                  fontSize: "10px",
                  padding: "0 5px",
                  lineHeight: "18px",
                  borderRadius: 6,
                  fontWeight: 700,
                }}
              >
                {zoneBadge.label}
              </Tag>
            );
          })()}

          <Tag
            color={order.paymentMethod === "cod" ? "default" : "magenta"}
            style={{
              margin: 0,
              fontWeight: 700,
              borderRadius: 6,
              fontSize: "10px",
              padding: "0 5px",
              lineHeight: "18px",
            }}
          >
            {order.paymentMethod ? order.paymentMethod.toUpperCase() : "COD"}
          </Tag>
        </div>
      </div>
    </Card>
  );
}
