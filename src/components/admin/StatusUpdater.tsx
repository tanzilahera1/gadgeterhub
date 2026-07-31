// src/components/admin/StatusUpdater.tsx
"use client";

import { useState } from "react";
import { updateOrderStatus } from "@/actions/order";
import { toast } from "sonner";
import { Select, Tag } from "antd";
import {
  ClockCircleOutlined,
  CheckCircleOutlined,
  SyncOutlined,
  CarOutlined,
  CloseCircleOutlined,
  WarningOutlined,
} from "@ant-design/icons";

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; icon: React.ReactNode }
> = {
  pending: {
    label: "Pending",
    color: "gold",
    icon: <ClockCircleOutlined />,
  },
  confirmed: {
    label: "Confirmed",
    color: "cyan",
    icon: <CheckCircleOutlined />,
  },
  processing: {
    label: "Processing",
    color: "blue",
    icon: <SyncOutlined spin />,
  },
  shipped: {
    label: "Shipped",
    color: "purple",
    icon: <CarOutlined />,
  },
  delivered: {
    label: "Delivered",
    color: "green",
    icon: <CheckCircleOutlined />,
  },
  cancelled: {
    label: "Cancelled",
    color: "red",
    icon: <CloseCircleOutlined />,
  },
  returned: {
    label: "Returned",
    color: "default",
    icon: <WarningOutlined />,
  },
};

export function StatusUpdater({
  orderId,
  currentStatus,
}: {
  orderId: string;
  currentStatus: string;
}) {
  const [status, setStatus] = useState<string>(currentStatus || "pending");
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdate = async (newStatus: string) => {
    if (newStatus === status) return;
    setIsUpdating(true);
    try {
      const res = await updateOrderStatus(orderId, newStatus);
      if (res.success) {
        setStatus(newStatus);
        toast.success(`Order status updated to ${newStatus}`);
      } else {
        toast.error(res.error || "Failed to update status");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Select
      value={status}
      onChange={handleUpdate}
      loading={isUpdating}
      disabled={isUpdating}
      style={{ width: 140 }}
      options={Object.entries(STATUS_CONFIG).map(([key, cfg]) => ({
        value: key,
        label: (
          <Tag color={cfg.color} icon={cfg.icon} style={{ margin: 0, fontWeight: 700 }}>
            {cfg.label}
          </Tag>
        ),
      }))}
    />
  );
}
