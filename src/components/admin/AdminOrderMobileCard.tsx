// src/components/admin/AdminOrderMobileCard.tsx
"use client";

import Link from "next/link";
import { Card, Tag, Typography, Button, Flex } from "antd";
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

        {/* Middle Body: Customer Info (with District) & Price */}
        {(() => {
          const vipDeduction = (order.vipPrivilege && order.vipPrivilege > 0) ? order.vipPrivilege : (order.discount || 0);
          const districtName = order.shipping?.district;
          const zoneBadge = getZoneBadgeInfo(order.shipping, order.shippingCost);
          const displayLabel = districtName ? `📍 ${districtName}` : zoneBadge.label;

          return (
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <Flex align="center" gap={6} wrap="wrap">
                  <Text strong style={{ display: "block", fontSize: "13px" }}>
                    {order.shipping?.name}
                  </Text>
                  {vipDeduction > 0 && (
                    <Tag color="gold" style={{ margin: 0, fontSize: "10px", fontWeight: 900, padding: "0 4px" }}>
                      🌟 VIP
                    </Tag>
                  )}
                  <Tag
                    variant="filled"
                    color={districtName ? undefined : zoneBadge.color}
                    style={{
                      margin: 0,
                      fontSize: "10px",
                      padding: "0 6px",
                      lineHeight: "18px",
                      borderRadius: 4,
                      fontWeight: 700,
                      background: districtName ? "#f1f5f9" : undefined,
                      color: districtName ? "#475569" : undefined,
                    }}
                  >
                    {displayLabel}
                  </Tag>
                </Flex>
                <Text type="secondary" style={{ fontSize: "11px", display: "block", marginTop: 2 }}>
                  {order.shipping?.phone}
                </Text>
              </div>

              <div style={{ textAlign: "right" }} className="shrink-0">
                <Text strong style={{ fontSize: "15px", color: "#1677ff", display: "block" }}>
                  {formatPrice(Math.max(0, order.total - (order.advancePaid || 0)))}
                </Text>
                {Boolean(order.advancePaid && order.advancePaid > 0) && (
                  <Text type="secondary" style={{ fontSize: "9px", display: "block", color: "#2563eb", fontWeight: 700 }}>
                    Adv: {formatPrice(order.advancePaid || 0)}
                  </Text>
                )}
              </div>
            </div>
          );
        })()}

        {/* Bottom Footer: Date (Left) | Details Action (Right) */}
        <div className="flex items-center justify-between pt-0.5 gap-2">
          <Text type="secondary" style={{ fontSize: "11px", whiteSpace: "nowrap" }}>
            {order.createdAt
              ? format(new Date(order.createdAt), "dd MMM, hh:mm a")
              : ""}
          </Text>

          {/* Details Action */}
          {orderIdStr && (
            <Link href={`/admin/orders/${orderIdStr}`} className="shrink-0">
              <Button size="small" type="primary" style={{ fontSize: "11px", fontWeight: 700, borderRadius: 6 }}>
                Details →
              </Button>
            </Link>
          )}
        </div>
      </div>
    </Card>
  );
}
