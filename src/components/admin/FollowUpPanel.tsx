"use client";

import { useState, useTransition } from "react";
import { Button, Input, Tag, Timeline, Typography, Spin, Tooltip } from "antd";
import {
  PhoneOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  MessageOutlined,
  EditOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { addFollowUp } from "@/actions/followUp";
import type { FollowUpOutcome, IFollowUpEntry } from "@/types/order";
import { format } from "date-fns";

const { Text } = Typography;
const { TextArea } = Input;

// ── Outcome config ─────────────────────────────────────────────────────────────
export const OUTCOME_CONFIG: Record<
  FollowUpOutcome,
  { label: string; color: string; antColor: string; icon: React.ReactNode }
> = {
  phone_off:    { label: "ফোন বন্ধ",     color: "#ef4444", antColor: "error",     icon: <PhoneOutlined /> },
  no_answer:    { label: "ধরেনি",         color: "#f97316", antColor: "warning",   icon: <PhoneOutlined /> },
  will_receive: { label: "নেবে ✓",        color: "#22c55e", antColor: "success",   icon: <CheckCircleOutlined /> },
  rescheduled:  { label: "পরে নেবে",     color: "#3b82f6", antColor: "processing",icon: <ClockCircleOutlined /> },
  refused:      { label: "নিতে চায় না", color: "#6b7280", antColor: "default",   icon: <CloseCircleOutlined /> },
  contacted:    { label: "কথা হয়েছে",   color: "#06b6d4", antColor: "cyan",      icon: <MessageOutlined /> },
  other:        { label: "অন্যান্য",     color: "#8b5cf6", antColor: "purple",    icon: <EditOutlined /> },
};

const OUTCOME_KEYS = Object.keys(OUTCOME_CONFIG) as FollowUpOutcome[];

// ── Props ──────────────────────────────────────────────────────────────────────
interface FollowUpPanelProps {
  orderId: string;
  initialFollowUps?: IFollowUpEntry[];
  compact?: boolean; // courier monitor popover mode
  onAdded?: (entry: IFollowUpEntry) => void;
}

// ── Component ──────────────────────────────────────────────────────────────────
export default function FollowUpPanel({
  orderId,
  initialFollowUps = [],
  compact = false,
  onAdded,
}: FollowUpPanelProps) {
  const [followUps, setFollowUps] = useState<IFollowUpEntry[]>(initialFollowUps);
  const [selectedOutcome, setSelectedOutcome] = useState<FollowUpOutcome | null>(null);
  const [note, setNote] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleAdd() {
    if (!selectedOutcome) return;
    startTransition(async () => {
      const res = await addFollowUp(orderId, selectedOutcome, note || undefined);
      if (res.success && res.entry) {
        const newEntry = res.entry;
        setFollowUps((prev) => [newEntry, ...prev]);
        setSelectedOutcome(null);
        setNote("");
        onAdded?.(newEntry);
      }
    });
  }

  const timelineItems = followUps.map((f) => {
    const cfg = OUTCOME_CONFIG[f.outcome] ?? OUTCOME_CONFIG.other;
    const dateStr = f.createdAt
      ? format(new Date(f.createdAt as string), "dd MMM, hh:mm a")
      : "";
    return {
      color: cfg.color,
      icon: <span style={{ fontSize: 13 }}>{cfg.icon}</span>,
      content: (
        <div style={{ paddingBottom: compact ? 4 : 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <Tag
              style={{
                backgroundColor: cfg.color + "1a",
                borderColor: cfg.color + "55",
                color: cfg.color,
                fontWeight: 700,
                fontSize: 11,
                borderRadius: 6,
                margin: 0,
              }}
            >
              {cfg.label}
            </Tag>
            <Text type="secondary" style={{ fontSize: 10 }}>
              {dateStr}
            </Text>
          </div>
          {f.note && (
            <Text
              style={{
                fontSize: 12,
                color: "#475569",
                display: "block",
                marginTop: 3,
                fontStyle: "italic",
              }}
            >
              "{f.note}"
            </Text>
          )}
        </div>
      ),
    };
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: compact ? 10 : 16 }}>
      {/* ── Quick Add Form ── */}
      <div
        style={{
          background: "#f8fafc",
          border: "1px solid #e2e8f0",
          borderRadius: 12,
          padding: compact ? "10px 12px" : "14px 16px",
        }}
      >
        {/* Outcome Buttons */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
          {OUTCOME_KEYS.map((key) => {
            const cfg = OUTCOME_CONFIG[key];
            const isSelected = selectedOutcome === key;
            return (
              <button
                key={key}
                onClick={() => setSelectedOutcome(isSelected ? null : key)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  padding: "4px 10px",
                  borderRadius: 20,
                  border: `1.5px solid ${isSelected ? cfg.color : "#e2e8f0"}`,
                  background: isSelected ? cfg.color + "18" : "#fff",
                  color: isSelected ? cfg.color : "#64748b",
                  fontWeight: isSelected ? 700 : 500,
                  fontSize: 12,
                  cursor: "pointer",
                  transition: "all 0.15s",
                  outline: "none",
                }}
              >
                {cfg.icon}
                {cfg.label}
              </button>
            );
          })}
        </div>

        {/* Note Input + Submit */}
        <div style={{ display: "flex", gap: 8 }}>
          <TextArea
            placeholder="নোট লিখুন (optional)…"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            autoSize={{ minRows: 1, maxRows: 3 }}
            style={{ borderRadius: 8, fontSize: 13, flex: 1 }}
            onPressEnter={(e) => {
              if (!e.shiftKey) {
                e.preventDefault();
                handleAdd();
              }
            }}
          />
          <Tooltip title={!selectedOutcome ? "একটি outcome বেছে নিন" : "Add"}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAdd}
              loading={isPending}
              disabled={!selectedOutcome}
              style={{ borderRadius: 8, alignSelf: "flex-end" }}
            >
              {compact ? "" : "Add"}
            </Button>
          </Tooltip>
        </div>
      </div>

      {/* ── Timeline ── */}
      {followUps.length === 0 ? (
        <Text type="secondary" style={{ fontSize: 12, textAlign: "center", padding: "8px 0" }}>
          এখনো কোনো follow-up নোট নেই।
        </Text>
      ) : (
        <Timeline
          style={{ paddingLeft: compact ? 0 : 4 }}
          items={timelineItems}
        />
      )}
    </div>
  );
}
