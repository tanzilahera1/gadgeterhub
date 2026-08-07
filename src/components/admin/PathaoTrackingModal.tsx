// src/components/admin/PathaoTrackingModal.tsx
"use client";

import { useState, useEffect } from "react";
import { Modal, Tag, Button, Typography, Spin, Steps, Alert, Flex, Tooltip, Timeline } from "antd";
import {
  CopyOutlined,
  ReloadOutlined,
  ExportOutlined,
  PhoneOutlined,
  MessageOutlined,
  AlertOutlined,
  CheckCircleOutlined,
  CarOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  EditOutlined,
  SyncOutlined,
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
  const hasRider = Boolean(trackingData?.riderName || trackingData?.riderPhone);
  const isAssignedLog = logs.some((l) =>
    (l.desc || "").toLowerCase().includes("assigned") ||
    (l.notes || "").toLowerCase().includes("assigned")
  );
  const isAssigned = hasRider || isAssignedLog;

  const isHold = statusLower.includes("hold");
  const isReturned = statusLower.includes("return");

  let stepCurrent = 0;
  if (statusLower.includes("delivered") || isReturned) {
    stepCurrent = 5;
  } else if (isAssigned || statusLower.includes("out for delivery") || statusLower.includes("assigned")) {
    stepCurrent = 4;
  } else if (isHold || statusLower.includes("ready")) {
    stepCurrent = 3;
  } else if (statusLower.includes("transit")) {
    stepCurrent = 2;
  } else if (statusLower.includes("picked")) {
    stepCurrent = 1;
  }

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={620}
      style={{ borderRadius: 20 }}
      styles={{ body: { padding: "20px 24px" } }}
      title={
        <Flex align="center" justify="space-between" style={{ paddingRight: 24, paddingBottom: 8, borderBottom: "1px solid #f1f5f9" }}>
          <Flex align="center" gap={10}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                background: "linear-gradient(135deg, #e11d48 0%, #be123c 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 12px rgba(225, 29, 72, 0.25)",
              }}
            >
              <CarOutlined style={{ color: "#ffffff", fontSize: 20 }} />
            </div>
            <div>
              <Title level={5} style={{ margin: 0, fontWeight: 900, color: "#0f172a" }}>
                Pathao Live Tracking
              </Title>
              <Text type="secondary" style={{ fontSize: "11px", display: "block", marginTop: -2 }}>
                Real-time parcel status update
              </Text>
            </div>
          </Flex>
          {consignmentId && (
            <Button
              size="small"
              icon={<ReloadOutlined spin={loading} style={{ color: "#e11d48" }} />}
              onClick={() => fetchTracking(consignmentId)}
              style={{ borderRadius: 8, fontWeight: 700, borderColor: "#fecdd3", color: "#be123c" }}
            >
              Sync
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
          style={{ marginTop: 16, borderRadius: 12 }}
        />
      ) : loading ? (
        <div className="py-14 text-center">
          <Spin size="large" />
          <Text type="secondary" style={{ display: "block", marginTop: 14, fontSize: "13px", fontWeight: 600 }}>
            Fetching live tracking timeline from Pathao...
          </Text>
        </div>
      ) : !result?.success || !trackingData ? (
        <div className="space-y-4 py-6">
          <Alert
            message="Tracking Data Unavailable"
            description={result?.error || "Could not retrieve parcel status."}
            type="error"
            showIcon
            style={{ borderRadius: 12 }}
          />
          <div className="text-center pt-2">
            <a
              href={`https://merchant.pathao.com/public-tracking?consignment_id=${consignmentId}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button type="primary" danger icon={<ExportOutlined />} style={{ borderRadius: 10, fontWeight: 700 }}>
                Open on Pathao Website 🔗
              </Button>
            </a>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4 pt-3">
          {/* Top Banner: Consignment ID & Status Tag */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/90 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
            <div>
              <Text type="secondary" style={{ fontSize: "10px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px" }}>
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
                        : isAssigned
                        ? "cyan"
                        : "processing"
                    }
                    style={{
                      fontWeight: 900,
                      fontSize: "12px",
                      padding: "4px 12px",
                      borderRadius: 8,
                      margin: 0,
                      display: "inline-flex",
                      alignItems: "center",
                    }}
                  >
                    <span>{isAssigned ? `🚴 ${trackingData.currentStatus}` : trackingData.currentStatus}</span>
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
                    <Button size="small" icon={<ExportOutlined />} style={{ borderRadius: 8, fontWeight: 700 }}>
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
              className="border-amber-300 bg-amber-50/90 rounded-2xl"
            />
          )}

          {/* RIDER ASSIGNED ACTION CARD */}
          {isAssigned && (
            <div className="bg-emerald-50/90 border border-emerald-300/80 p-3.5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
              <div>
                <Flex align="center" gap={6}>
                  <Tag color="success" style={{ margin: 0, fontWeight: 900, fontSize: "10px", borderRadius: 6 }}>
                    🔥 ACTION REQUIRED
                  </Tag>
                  <Text strong style={{ fontSize: "12px", color: "#065f46" }}>
                    Rider Dispatched for Delivery
                  </Text>
                </Flex>
                <Text type="secondary" style={{ fontSize: "11px", display: "block", marginTop: 2, color: "#047857" }}>
                  {trackingData.riderName ? `Assigned Hero: ${trackingData.riderName}` : "A rider has been assigned to deliver this parcel."} (Call customer to ensure availability)
                </Text>
              </div>

              {trackingData.riderPhone && (
                <Flex gap={6} className="shrink-0">
                  <a href={`tel:${trackingData.riderPhone}`}>
                    <Button
                      size="small"
                      type="primary"
                      icon={<PhoneOutlined />}
                      style={{ borderRadius: 8, fontWeight: 700, background: "#059669", borderColor: "#059669" }}
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

          {/* RIDER INFO BOX (if available and not already in banner) */}
          {!isAssigned && (trackingData.riderName || trackingData.riderPhone) && (
            <div className="bg-blue-50/80 border border-blue-200/90 p-3.5 rounded-2xl flex items-center justify-between gap-3 shadow-xs">
              <div>
                <Text type="secondary" style={{ fontSize: "10px", fontWeight: 800, textTransform: "uppercase" }}>
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
          <div className="pt-2 px-2 bg-slate-50/60 p-3.5 rounded-2xl border border-slate-100">
            <Steps
              current={stepCurrent}
              status={isHold ? "error" : isReturned ? "error" : "finish"}
              size="small"
              items={[
                { title: "Accepted" },
                { title: "Picked" },
                { title: "In Transit" },
                { title: isHold ? "On Hold" : "Ready" },
                { title: "Assigned" },
                { title: isReturned ? "Returned" : "Delivered" },
              ]}
            />
          </div>

          {/* Detailed Timeline Events with Ant Design Timeline */}
          <div className="border-t border-slate-100 pt-4">
            <Text strong style={{ fontSize: "13px", display: "block", marginBottom: 16, color: "#0f172a" }}>
              📜 Tracking History & Events ({logs.length})
            </Text>

            <div className="max-h-72 overflow-y-auto pr-2 pt-1">
              <Timeline
                mode="start"
                items={logs.map((item, index) => {
                  const descLower = (item.desc || "").toLowerCase();
                  const notesLower = (item.notes || "").toLowerCase();

                  let color = "blue";
                  let dotIcon = <ClockCircleOutlined style={{ fontSize: 13 }} />;

                  if (descLower.includes("delivered") || notesLower.includes("delivered")) {
                    color = "green";
                    dotIcon = <CheckCircleOutlined style={{ fontSize: 14, color: "#16a34a" }} />;
                  } else if (descLower.includes("return") || notesLower.includes("return")) {
                    color = "red";
                    dotIcon = <ExclamationCircleOutlined style={{ fontSize: 14, color: "#dc2626" }} />;
                  } else if (descLower.includes("hold") || notesLower.includes("hold") || notesLower.includes("reason:")) {
                    color = "orange";
                    dotIcon = <AlertOutlined style={{ fontSize: 14, color: "#d97706" }} />;
                  } else if (descLower.includes("picked") || descLower.includes("assigned")) {
                    color = "blue";
                    dotIcon = <CarOutlined style={{ fontSize: 14, color: "#2563eb" }} />;
                  }

                  return {
                    color,
                    icon: dotIcon,
                    content: (
                      <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100 hover:border-slate-200 transition-all mb-1">
                        <Flex align="start" justify="space-between" gap={8}>
                          <Text strong style={{ color: "#0f172a", fontSize: "12px", display: "block", lineHeight: 1.3 }}>
                            {item.desc}
                          </Text>
                          <Tag
                            variant="filled"
                            style={{
                              margin: 0,
                              fontSize: "10px",
                              color: "#64748b",
                              background: "#f1f5f9",
                              borderRadius: 6,
                              fontWeight: 600,
                              whiteSpace: "nowrap",
                            }}
                          >
                            {item.created_at}
                          </Tag>
                        </Flex>
                        {item.notes && (
                          <Text
                            type="secondary"
                            style={{
                              fontSize: "11px",
                              color: notesLower.includes("reason:") ? "#b45309" : "#475569",
                              fontWeight: notesLower.includes("reason:") ? 700 : 400,
                              display: "block",
                              marginTop: 4,
                            }}
                          >
                            {item.notes}
                          </Text>
                        )}
                      </div>
                    ),
                  };
                })}
              />
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
