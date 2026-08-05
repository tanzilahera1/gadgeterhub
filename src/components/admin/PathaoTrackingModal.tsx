// src/components/admin/PathaoTrackingModal.tsx
"use client";

import { useState, useEffect } from "react";
import { Modal, Tag, Button, Typography, Spin, Steps, Alert, Flex, Tooltip } from "antd";
import {
  CopyOutlined,
  ReloadOutlined,
  ExportOutlined,
  PhoneOutlined,
  MessageOutlined,
  AlertOutlined,
  CheckCircleOutlined,
  CarOutlined,
} from "@ant-design/icons";
import type { PathaoTrackingResult } from "@/actions/pathaoTracking";
import { toast } from "sonner";

const { Text, Title } = Typography;

interface Props {
  open: boolean;
  onClose: () => void;
  consignmentId?: string;
  orderNumber?: string;
}

export function PathaoTrackingModal({ open, onClose, consignmentId, orderNumber }: Props) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PathaoTrackingResult | null>(null);

  const fetchTracking = async (cid: string) => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/pathao-tracking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ consignment_id: cid }),
      });
      const proxyData = await res.json();

      if (!proxyData.success) {
        setResult({ success: false, error: proxyData.error || "Failed to fetch tracking" });
        return;
      }

      const json = proxyData.data;
      if (json.code !== 200 || !json.data || !json.data.order) {
        setResult({ success: false, error: json.message || "Invalid Consignment ID or no data found" });
        return;
      }

      const orderData = json.data.order;
      const logs = json.data.log || [];
      const stateName = json.data.state?.name || orderData.transfer_status || "Unknown";

      let riderName = orderData.agent?.name || "";
      let riderPhone = "";
      let holdReason = "";

      for (const logItem of logs) {
        if (logItem.notes && logItem.notes.toLowerCase().includes("reason:")) {
          holdReason = logItem.notes.replace(/reason:\s*/i, "").trim();
        }
        if (logItem.desc && logItem.desc.toLowerCase().includes("assigned to")) {
          const phoneMatch = logItem.desc.match(/\((01[3-9]\d{8})\)/);
          if (phoneMatch) riderPhone = phoneMatch[1];
        }
      }

      setResult({
        success: true,
        data: {
          consignmentId: cid,
          currentStatus: stateName,
          statusUpdatedTime: orderData.transfer_status_updated_at || "",
          collectableAmount: orderData.collectable_amount || 0,
          collectedAmount: orderData.collected_amount || 0,
          riderName,
          riderPhone,
          reason: holdReason,
          timeline: logs,
        },
      });
    } catch (err: any) {
      toast.error("Failed to load tracking information: " + (err.message || "Unknown error"));
      setResult({ success: false, error: err.message || "Network error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && consignmentId) {
      fetchTracking(consignmentId);
    } else {
      setResult(null);
    }
  }, [open, consignmentId]);

  if (!open) return null;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Consignment ID copied!");
  };

  const trackingData = result?.data;
  const logs = trackingData?.timeline || [];

  // Determine active step index
  const statusLower = (trackingData?.currentStatus || "").toLowerCase();
  let stepCurrent = 0;
  if (statusLower.includes("delivered")) stepCurrent = 4;
  else if (statusLower.includes("hold") || statusLower.includes("ready")) stepCurrent = 3;
  else if (statusLower.includes("transit")) stepCurrent = 2;
  else if (statusLower.includes("picked")) stepCurrent = 1;

  const isHold = statusLower.includes("hold");
  const isReturned = statusLower.includes("return");

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={600}
      style={{ borderRadius: 16 }}
      styles={{ body: { padding: 20 } }}
      title={
        <Flex align="center" justify="space-between" style={{ paddingRight: 24 }}>
          <Flex align="center" gap={8}>
            <CarOutlined style={{ color: "#e11d48", fontSize: 20 }} />
            <Title level={4} style={{ margin: 0, fontWeight: 900 }}>
              Pathao Live Courier Tracking
            </Title>
          </Flex>
          {consignmentId && (
            <Button
              size="small"
              icon={<ReloadOutlined spin={loading} />}
              onClick={() => fetchTracking(consignmentId)}
            >
              Refresh
            </Button>
          )}
        </Flex>
      }
    >
      {!consignmentId ? (
        <Alert
          message="No Consignment ID"
          description="Please add a valid Pathao Consignment ID to track this order."
          type="warning"
          showIcon
          style={{ marginTop: 12 }}
        />
      ) : loading ? (
        <div className="py-12 text-center">
          <Spin size="large" />
          <Text type="secondary" style={{ display: "block", marginTop: 12, fontSize: "13px" }}>
            Fetching live parcel status from Pathao...
          </Text>
        </div>
      ) : !result?.success || !trackingData ? (
        <div className="space-y-4 py-4">
          <Alert
            message="Tracking Data Unavailable"
            description={result?.error || "Could not retrieve parcel status."}
            type="error"
            showIcon
          />
          <div className="text-center">
            <a
              href={`https://merchant.pathao.com/public-tracking?consignment_id=${consignmentId}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button type="primary" icon={<ExportOutlined />}>
                Open on Pathao Website 🔗
              </Button>
            </a>
          </div>
        </div>
      ) : (
        <div className="space-y-5 pt-2">
          {/* Top Banner: Consignment ID & Status Tag */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <Text type="secondary" style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase" }}>
                Consignment ID {orderNumber && `(Order #${orderNumber})`}
              </Text>
              <Flex align="center" gap={6} style={{ marginTop: 2 }}>
                <Text code style={{ fontSize: "15px", fontWeight: 900, color: "#0f172a" }}>
                  {trackingData.consignmentId}
                </Text>
                <Tooltip title="Copy Consignment ID">
                  <Button
                    size="small"
                    type="text"
                    icon={<CopyOutlined style={{ color: "#3b82f6" }} />}
                    onClick={() => copyToClipboard(trackingData.consignmentId)}
                  />
                </Tooltip>
              </Flex>
            </div>

            {(() => {
              let attempts = 0;
              for (const l of logs) {
                const gStatus = (l as any).grouped_status?.[0] || "";
                if (gStatus === "Ready For Delivery" || l.desc?.toLowerCase().includes("assigned to")) {
                  attempts++;
                }
              }

              return (
                <Flex align="center" gap={8}>
                  <Tag
                    color={
                      isHold
                        ? "warning"
                        : isReturned
                        ? "error"
                        : statusLower.includes("delivered")
                        ? "success"
                        : "processing"
                    }
                    style={{
                      fontWeight: 900,
                      fontSize: "12px",
                      padding: "4px 10px",
                      borderRadius: 8,
                      margin: 0,
                      display: "inline-flex",
                      alignItems: "center",
                    }}
                  >
                    <span>{trackingData.currentStatus}</span>
                    {attempts > 1 && (
                      <span
                        style={{
                          backgroundColor: "#ef4444",
                          color: "#ffffff",
                          fontSize: "10px",
                          fontWeight: 900,
                          borderRadius: "10px",
                          padding: "1px 6px",
                          marginLeft: "6px",
                          display: "inline-block",
                          lineHeight: "14px",
                          boxShadow: "0 1px 3px rgba(239, 68, 68, 0.3)",
                        }}
                      >
                        {attempts}
                      </span>
                    )}
                  </Tag>
                  <a
                    href={`https://merchant.pathao.com/public-tracking?consignment_id=${trackingData.consignmentId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button size="small" icon={<ExportOutlined />}>
                      Pathao Link
                    </Button>
                  </a>
                </Flex>
              );
            })()}
          </div>

          {/* CRITICAL ALERT: Hold Reason */}
          {trackingData.reason && (
            <Alert
              title={<span className="font-bold text-amber-900">⚠️ Delivery On Hold Alert</span>}
              description={
                <span className="font-medium text-amber-800 text-xs">
                  Reason: {trackingData.reason}
                </span>
              }
              type="warning"
              showIcon
              icon={<AlertOutlined className="text-amber-600" />}
              className="border-amber-300 bg-amber-50 rounded-xl"
            />
          )}

          {/* RIDER INFO BOX (if available) */}
          {(trackingData.riderName || trackingData.riderPhone) && (
            <div className="bg-blue-50/70 border border-blue-200/80 p-3 rounded-2xl flex items-center justify-between gap-3">
              <div>
                <Text type="secondary" style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase" }}>
                  🚴 Delivery Rider Information
                </Text>
                <Text strong style={{ fontSize: "13px", display: "block", color: "#1e3a8a" }}>
                  {trackingData.riderName || "Delivery Agent"}
                  {trackingData.riderPhone && ` (${trackingData.riderPhone})`}
                </Text>
              </div>

              {trackingData.riderPhone && (
                <Flex gap={6}>
                  <a href={`tel:${trackingData.riderPhone}`}>
                    <Button
                      size="small"
                      type="primary"
                      icon={<PhoneOutlined />}
                      style={{ borderRadius: 8, fontWeight: 700 }}
                    >
                      Call Rider
                    </Button>
                  </a>
                  <a
                    href={`https://wa.me/88${trackingData.riderPhone.replace(/[^0-9]/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button
                      size="small"
                      icon={<MessageOutlined style={{ color: "#25D366" }} />}
                      style={{ borderRadius: 8 }}
                    />
                  </a>
                </Flex>
              )}
            </div>
          )}

          {/* Steps Progress */}
          <div className="pt-2 px-1">
            <Steps
              current={stepCurrent}
              status={isHold ? "error" : isReturned ? "error" : "finish"}
              size="small"
              items={[
                { title: "Accepted" },
                { title: "Picked" },
                { title: "In Transit" },
                { title: isHold ? "On Hold" : "Ready" },
                { title: isReturned ? "Returned" : "Delivered" },
              ]}
            />
          </div>

          {/* Detailed Timeline Events */}
          <div className="border-t border-slate-100 pt-3">
            <Text strong style={{ fontSize: "13px", display: "block", marginBottom: 12 }}>
              📜 Tracking History & Events
            </Text>

            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
              {logs.map((item, i) => (
                <div
                  key={i}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-start justify-between gap-3 text-xs"
                >
                  <div className="space-y-0.5">
                    <Text strong style={{ color: "#0f172a", fontSize: "12px", display: "block" }}>
                      {item.desc}
                    </Text>
                    {item.notes && (
                      <Text type="secondary" style={{ fontSize: "11px", color: "#64748b", display: "block" }}>
                        {item.notes}
                      </Text>
                    )}
                  </div>
                  <Text type="secondary" style={{ fontSize: "10px", flexShrink: 0, whiteSpace: "nowrap" }}>
                    {item.created_at}
                  </Text>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
