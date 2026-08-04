"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  Row,
  Col,
  Typography,
  Flex,
  Button,
  Tag,
  Table,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  DatePicker,
  Popconfirm,
  Tooltip,
  Divider,
} from "antd";
import {
  DollarOutlined,
  PlusOutlined,
  TrophyOutlined,
  ShoppingOutlined,
  FilterOutlined,
  DeleteOutlined,
  RiseOutlined,
  PercentageOutlined,
  CarOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
import { formatPrice } from "@/lib/priceUtils";
import { toast } from "sonner";
import { createExpenseAction, deleteExpenseAction, getExpensesAction } from "@/actions/expense";
import { getFinancialAnalyticsAction, FinancialSummary, WinningProductStat } from "@/actions/finance";
import dayjs from "dayjs";
import Image from "next/image";

const { Title, Text } = Typography;

interface ProductOption {
  _id: string;
  title: string;
  sku: string;
}

const CATEGORY_LABELS: Record<string, { label: string; color: string }> = {
  ad_spend: { label: "📢 ফেসবুক এড খরচ", color: "purple" },
  packaging: { label: "📦 প্যাকিং মালামাল", color: "cyan" },
  courier_loss: { label: "🚚 কুরিয়ার লস / ড্যামেজ", color: "orange" },
  salary: { label: "👤 স্টাফ বেতন", color: "blue" },
  utility: { label: "💡 বিল / ইন্টারনেট", color: "geekblue" },
  other: { label: "⚙️ অন্যান্য খরচ", color: "default" },
};

export function FinanceClient({
  initialProducts,
}: {
  initialProducts: ProductOption[];
}) {
  const [dateRangePreset, setDateRangePreset] = useState<string>("this_month");
  const [customRange, setCustomRange] = useState<[string, string] | null>(null);
  const [statusFilter, setStatusFilter] = useState<"delivered_only" | "all_orders">("all_orders");
  const [sortBy, setSortBy] = useState<"universal" | "profit" | "roi" | "sales">("universal");

  const [loading, setLoading] = useState<boolean>(true);
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [winningProducts, setWinningProducts] = useState<WinningProductStat[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);

  // Modal State
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState<boolean>(false);
  const [isSubmittingExpense, setIsSubmittingExpense] = useState<boolean>(false);
  const [form] = Form.useForm();

  // Compute dates based on preset
  const getFilterDates = () => {
    if (dateRangePreset === "custom" && customRange) {
      return { startDate: customRange[0], endDate: customRange[1] };
    }
    const today = dayjs();
    if (dateRangePreset === "today") {
      return { startDate: today.format("YYYY-MM-DD"), endDate: today.format("YYYY-MM-DD") };
    }
    if (dateRangePreset === "yesterday") {
      const yest = today.subtract(1, "day");
      return { startDate: yest.format("YYYY-MM-DD"), endDate: yest.format("YYYY-MM-DD") };
    }
    if (dateRangePreset === "last_7_days") {
      return { startDate: today.subtract(6, "day").format("YYYY-MM-DD"), endDate: today.format("YYYY-MM-DD") };
    }
    if (dateRangePreset === "this_month") {
      return { startDate: today.startOf("month").format("YYYY-MM-DD"), endDate: today.format("YYYY-MM-DD") };
    }
    return {};
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const dates = getFilterDates();
      const [finRes, expRes] = await Promise.all([
        getFinancialAnalyticsAction({ ...dates, statusFilter, sortBy }),
        getExpensesAction(dates),
      ]);

      if (finRes.summary) {
        setSummary(finRes.summary);
        setWinningProducts(finRes.winningProducts || []);
      }
      if (expRes.expenses) {
        setExpenses(expRes.expenses);
      }
    } catch (err) {
      toast.error("ফাইনান্সিয়াল ডাটা লোড করতে সমস্যা হয়েছে");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [dateRangePreset, customRange, statusFilter, sortBy]);

  const handleCreateExpense = async (values: any) => {
    setIsSubmittingExpense(true);
    try {
      const res = await createExpenseAction({
        title: values.title,
        amount: values.amount,
        category: values.category,
        productId: values.productId || undefined,
        date: values.date ? values.date.format("YYYY-MM-DD") : undefined,
        note: values.note,
      });

      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("নতুন খরচ সফলভাবে যোগ হয়েছে!");
        setIsExpenseModalOpen(false);
        form.resetFields();
        loadData();
      }
    } catch (err) {
      toast.error("খরচ সেভ করা সম্ভব হয়নি");
    } finally {
      setIsSubmittingExpense(false);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    try {
      const res = await deleteExpenseAction(id);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("খরচ মুছে ফেলা হয়েছে");
        loadData();
      }
    } catch (err) {
      toast.error("মুছতে সমস্যা হয়েছে");
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Date Filter Bar */}
      <Flex align="center" justify="space-between" wrap="wrap" gap={12}>
        <div>
          <Title level={3} style={{ margin: 0, fontWeight: 900 }}>
            💰 Finance & Profit Analytics
          </Title>
          <Text type="secondary" style={{ fontSize: "12px" }}>
            Real-time revenue, 1% courier collection fee, ad spend, ROI % and Net Profit.
          </Text>
        </div>

        <Flex align="center" gap={8} wrap="wrap">
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            style={{ width: 160 }}
            options={[
              { value: "all_orders", label: "📦 All Active Orders" },
              { value: "delivered_only", label: "✅ Delivered Only" },
            ]}
          />

          <Select
            value={dateRangePreset}
            onChange={(val) => {
              setDateRangePreset(val);
              if (val !== "custom") setCustomRange(null);
            }}
            style={{ width: 150 }}
            options={[
              { value: "today", label: "Today" },
              { value: "yesterday", label: "Yesterday" },
              { value: "last_7_days", label: "Last 7 Days" },
              { value: "this_month", label: "This Month (MTD)" },
              { value: "all_time", label: "All Time" },
              { value: "custom", label: "Custom Date Range" },
            ]}
          />

          {dateRangePreset === "custom" && (
            <DatePicker.RangePicker
              onChange={(dates) => {
                if (dates && dates[0] && dates[1]) {
                  setCustomRange([dates[0].format("YYYY-MM-DD"), dates[1].format("YYYY-MM-DD")]);
                }
              }}
            />
          )}

          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsExpenseModalOpen(true)}
            style={{ borderRadius: 10, fontWeight: 700, background: "#1677ff" }}
          >
            + Add Expense
          </Button>
        </Flex>
      </Flex>

      {/* KPI Cards Grid */}
      <Row gutter={[16, 16]}>
        {/* Card 1: Total Revenue */}
        <Col xs={24} sm={12} md={8} lg={4.8}>
          <Card style={{ borderRadius: 16, background: "#f8fafc", border: "1px solid #e2e8f0" }}>
            <Text type="secondary" style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase" }}>
              💵 Total Revenue
            </Text>
            <Title level={3} style={{ margin: "4px 0 0", color: "#0f172a", fontWeight: 900 }}>
              {summary ? formatPrice(summary.totalRevenue) : "৳0"}
            </Title>
            <Text type="secondary" style={{ fontSize: "10px" }}>
              {summary?.deliveredOrdersCount || 0} Orders
            </Text>
          </Card>
        </Col>

        {/* Card 2: COGS / Buying Cost */}
        <Col xs={24} sm={12} md={8} lg={4.8}>
          <Card style={{ borderRadius: 16, background: "#f8fafc", border: "1px solid #e2e8f0" }}>
            <Text type="secondary" style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase" }}>
              📦 COGS (Purchase Cost)
            </Text>
            <Title level={3} style={{ margin: "4px 0 0", color: "#64748b", fontWeight: 900 }}>
              {summary ? formatPrice(summary.totalCogs) : "৳0"}
            </Title>
            <Text type="secondary" style={{ fontSize: "10px" }}>
              Product Buying Cost
            </Text>
          </Card>
        </Col>

        {/* Card 3: Courier & 1% Fee */}
        <Col xs={24} sm={12} md={8} lg={4.8}>
          <Card style={{ borderRadius: 16, background: "#f8fafc", border: "1px solid #e2e8f0" }}>
            <Flex align="center" justify="space-between">
              <Text type="secondary" style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase" }}>
                🚚 Courier & 1% Fee
              </Text>
              <Tooltip title="Base Delivery Charge + 1% COD Fee">
                <CarOutlined style={{ color: "#fa8c16" }} />
              </Tooltip>
            </Flex>
            <Title level={3} style={{ margin: "4px 0 0", color: "#d97706", fontWeight: 900 }}>
              {summary ? formatPrice(summary.totalCourierExpenses) : "৳0"}
            </Title>
            <Text type="secondary" style={{ fontSize: "10px" }}>
              1% COD Fee: {summary ? formatPrice(summary.courierCodFees) : "৳0"}
            </Text>
          </Card>
        </Col>

        {/* Card 4: Operating Expenses (Ads & Ops) */}
        <Col xs={24} sm={12} md={8} lg={4.8}>
          <Card style={{ borderRadius: 16, background: "#f8fafc", border: "1px solid #e2e8f0" }}>
            <Text type="secondary" style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase" }}>
              📢 Ad & OpEx
            </Text>
            <Title level={3} style={{ margin: "4px 0 0", color: "#7c3aed", fontWeight: 900 }}>
              {summary ? formatPrice(summary.totalLoggedExpenses) : "৳0"}
            </Title>
            <Text type="secondary" style={{ fontSize: "10px" }}>
              Ad Spend: {summary ? formatPrice(summary.totalAdExpenses) : "৳0"}
            </Text>
          </Card>
        </Col>

        {/* Card 5: TRUE NET PROFIT (Glow highlight card!) */}
        <Col xs={24} sm={24} md={16} lg={4.8}>
          <Card
            style={{
              borderRadius: 16,
              background: "linear-gradient(135deg, #059669 0%, #10b981 100%)",
              color: "#fff",
              boxShadow: "0 10px 25px -5px rgba(16, 185, 129, 0.4)",
            }}
          >
            <Flex align="center" justify="space-between">
              <Text style={{ fontSize: "11px", fontWeight: 900, textTransform: "uppercase", color: "#ecfdf5" }}>
                💰 NET PROFIT
              </Text>
              <ThunderboltOutlined style={{ color: "#fef08a", fontSize: "16px" }} />
            </Flex>
            <Title level={2} style={{ margin: "4px 0 0", color: "#ffffff", fontWeight: 900 }}>
              {summary ? formatPrice(summary.netProfit) : "৳0"}
            </Title>
            <Flex align="center" gap={12} style={{ marginTop: 4 }}>
              <Tag color="gold" style={{ margin: 0, fontWeight: 900, fontSize: "10px" }}>
                ROI: {summary ? `${summary.roiPercent.toFixed(1)}%` : "0%"}
              </Tag>
              <Text style={{ fontSize: "10px", color: "#d1fae5", fontWeight: 700 }}>
                Margin: {summary ? `${summary.profitMarginPercent.toFixed(1)}%` : "0%"}
              </Text>
            </Flex>
          </Card>
        </Col>
      </Row>

      {/* Winning Products Scorecard Section */}
      <Card
        title={
          <Flex align="center" justify="space-between" wrap="wrap" gap={12}>
            <Flex align="center" gap={8}>
              <TrophyOutlined style={{ color: "#eab308", fontSize: "20px" }} />
              <div>
                <Text strong style={{ fontSize: "16px" }}>
                  Winning Products Leaderboard
                </Text>
                <Text type="secondary" style={{ display: "block", fontSize: "11px", fontWeight: 400 }}>
                  Rank products by Universal Score, Net Profit, ROI %, or Sales Volume
                </Text>
              </div>
            </Flex>

            <Select
              value={sortBy}
              onChange={setSortBy}
              style={{ width: 230 }}
              options={[
                { value: "universal", label: "🏆 Smart Winner (Universal)" },
                { value: "profit", label: "💰 Highest Net Profit" },
                { value: "roi", label: "📈 Highest ROI %" },
                { value: "sales", label: "📦 Most Units Sold" },
              ]}
            />
          </Flex>
        }
        style={{ borderRadius: 16 }}
        styles={{ body: { padding: 16 } }}
      >
        <Table
          dataSource={winningProducts}
          rowKey="productId"
          pagination={{ pageSize: 10 }}
          loading={loading}
          columns={[
            {
              title: "Product",
              key: "product",
              render: (_, record) => (
                <Flex align="center" gap={10}>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 8,
                      overflow: "hidden",
                      background: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      position: "relative",
                      flexShrink: 0,
                    }}
                  >
                    <Image
                      src={record.thumbnail || "/logo.png"}
                      alt={record.title}
                      fill
                      sizes="44px"
                      className="object-contain p-1"
                    />
                  </div>
                  <div>
                    <Flex align="center" gap={6}>
                      <Text strong style={{ fontSize: "13px" }}>
                        {record.title}
                      </Text>
                      {record.isWinner && (
                        <Tag color="gold" style={{ margin: 0, fontSize: "10px", fontWeight: 900 }}>
                          🏆 WINNING PRODUCT
                        </Tag>
                      )}
                    </Flex>
                    <Text type="secondary" style={{ fontSize: "11px" }}>
                      SKU: {record.sku}
                    </Text>
                  </div>
                </Flex>
              ),
            },
            {
              title: "Sales Vol",
              dataIndex: "unitsSold",
              key: "unitsSold",
              align: "center",
              render: (val) => <Text strong>{val} pcs</Text>,
            },
            {
              title: "Ad Spend",
              dataIndex: "attributedAdSpend",
              key: "attributedAdSpend",
              align: "right",
              render: (val) => <Text style={{ color: "#7c3aed" }}>{formatPrice(val)}</Text>,
            },
            {
              title: "Profit",
              dataIndex: "netProfit",
              key: "netProfit",
              align: "right",
              render: (val) => (
                <Text strong style={{ color: val >= 0 ? "#16a34a" : "#dc2626", fontSize: "14px" }}>
                  {formatPrice(val)}
                </Text>
              ),
            },
            {
              title: "ROI %",
              dataIndex: "roiPercent",
              key: "roiPercent",
              align: "center",
              render: (val) => (
                <Tag color={val >= 100 ? "green" : val > 0 ? "blue" : "red"} style={{ fontWeight: 900 }}>
                  {val}%
                </Tag>
              ),
            },
          ]}
        />
      </Card>

      {/* Expenses Management Table */}
      <Card
        title={
          <Flex align="center" justify="space-between">
            <Text strong style={{ fontSize: "16px" }}>
              📝 Logged Expenses
            </Text>
            <Button size="small" type="primary" icon={<PlusOutlined />} onClick={() => setIsExpenseModalOpen(true)}>
              + Add Expense
            </Button>
          </Flex>
        }
        style={{ borderRadius: 16 }}
        styles={{ body: { padding: 16 } }}
      >
        <Table
          dataSource={expenses}
          rowKey="_id"
          loading={loading}
          pagination={{ pageSize: 8 }}
          columns={[
            {
              title: "Date",
              dataIndex: "date",
              key: "date",
              render: (val) => dayjs(val).format("DD MMM YYYY"),
            },
            {
              title: "Category",
              dataIndex: "category",
              key: "category",
              render: (val) => {
                const cat = CATEGORY_LABELS[val] || CATEGORY_LABELS.other;
                return <Tag color={cat.color}>{cat.label}</Tag>;
              },
            },
            {
              title: "Title & Details",
              key: "details",
              render: (_, record) => (
                <div>
                  <Text strong style={{ fontSize: "13px", display: "block" }}>
                    {record.title}
                  </Text>
                  {record.product && (
                    <Text type="secondary" style={{ fontSize: "11px" }}>
                      প্রোডাক্ট: {record.product.title}
                    </Text>
                  )}
                  {record.note && (
                    <Text type="secondary" style={{ fontSize: "11px", display: "block", fontStyle: "italic" }}>
                      নোট: {record.note}
                    </Text>
                  )}
                </div>
              ),
            },
            {
              title: "Amount",
              dataIndex: "amount",
              key: "amount",
              align: "right",
              render: (val) => (
                <Text strong style={{ color: "#dc2626", fontSize: "14px" }}>
                  -{formatPrice(val)}
                </Text>
              ),
            },
            {
              title: "Action",
              key: "action",
              align: "center",
              render: (_, record) => (
                <Popconfirm
                  title="খরচটি মুছে ফেলতে চান?"
                  onConfirm={() => handleDeleteExpense(record._id)}
                  okText="হ্যাঁ, মুছুন"
                  cancelText="বাতিল"
                >
                  <Button size="small" danger icon={<DeleteOutlined />} />
                </Popconfirm>
              ),
            },
          ]}
        />
      </Card>

      {/* Expense Modal */}
      <Modal
        title="📝 নতুন ব্যবসায়িক খরচ এন্ট্রি দিন"
        open={isExpenseModalOpen}
        onCancel={() => setIsExpenseModalOpen(false)}
        footer={null}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" onFinish={handleCreateExpense} style={{ marginTop: 12 }}>
          <Form.Item
            name="title"
            label={<Text strong>খরচের শিরোনাম *</Text>}
            rules={[{ required: true, message: "শিরোনাম দিন" }]}
          >
            <Input placeholder="যেমন: ফেসবুক এড চার্জ আগস্ট ৪ / বাবল র‍্যাপ ক্রয়" style={{ borderRadius: 8 }} />
          </Form.Item>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item
                name="amount"
                label={<Text strong>খরচের পরিমাণ (৳) *</Text>}
                rules={[{ required: true, message: "পরিমাণ দিন" }]}
              >
                <InputNumber min={1} style={{ width: "100%", borderRadius: 8 }} placeholder="500" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="category"
                label={<Text strong>খরচের ক্যাটাগরি *</Text>}
                initialValue="ad_spend"
                rules={[{ required: true }]}
              >
                <Select
                  style={{ borderRadius: 8 }}
                  options={Object.entries(CATEGORY_LABELS).map(([k, v]) => ({ value: k, label: v.label }))}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="productId"
            label={<Text strong>নির্দিষ্ট প্রোডাক্টের সাথে লিঙ্ক করুন (Optional)</Text>}
            extra="নির্দিষ্ট উইনিং প্রোডাক্টের ROI হিসাব করতে সাহায্য করবে।"
          >
            <Select
              placeholder="প্রোডাক্ট নির্বাচন করুন (ঐচ্ছিক)"
              allowClear
              showSearch
              filterOption={(input, option) =>
                (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
              }
              options={initialProducts.map((p) => ({ value: p._id, label: `${p.title} (${p.sku})` }))}
            />
          </Form.Item>

          <Form.Item name="date" label={<Text strong>তারিখ</Text>} initialValue={dayjs()}>
            <DatePicker style={{ width: "100%", borderRadius: 8 }} />
          </Form.Item>

          <Form.Item name="note" label={<Text strong>নোট / মন্তব্য (Optional)</Text>}>
            <Input.TextArea rows={2} placeholder="অতিরিক্ত বিবরণ..." style={{ borderRadius: 8 }} />
          </Form.Item>

          <Flex justify="end" gap={8} style={{ marginTop: 16 }}>
            <Button onClick={() => setIsExpenseModalOpen(false)}>বাতিল</Button>
            <Button type="primary" htmlType="submit" loading={isSubmittingExpense} style={{ borderRadius: 8 }}>
              সেভ করুন
            </Button>
          </Flex>
        </Form>
      </Modal>
    </div>
  );
}
