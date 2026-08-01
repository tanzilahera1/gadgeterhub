// src/app/(admin)/admin/loading.tsx
export default function AdminLoading() {
  return (
    <div style={{ padding: "16px", maxWidth: "100%", overflow: "hidden" }}>
      {/* Header: Title + Subtitle */}
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <Bone width="42%" height={28} radius={10} delay={0} />
        <div style={{ marginTop: 8 }}>
          <Bone width="28%" height={14} radius={6} delay={0.05} />
        </div>
      </div>

      {/* Stat Cards Row — 2 cols on mobile, 4 on desktop */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: 10,
          marginBottom: 12,
        }}
      >
        {[0, 0.06, 0.12, 0.18].map((delay, i) => (
          <Bone key={i} width="100%" height={72} radius={14} delay={delay} />
        ))}
      </div>

      {/* Main content area — 2 cols on desktop */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: 12,
        }}
      >
        {/* Large card — Recent Orders */}
        <div
          style={{
            borderRadius: 16,
            overflow: "hidden",
            border: "1px solid #f0f0f0",
            background: "#fff",
          }}
        >
          {/* Card header */}
          <div
            style={{
              padding: "14px 16px",
              borderBottom: "1px solid #f5f5f5",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Bone width={140} height={16} radius={6} delay={0.1} />
            <Bone width={80} height={14} radius={6} delay={0.12} />
          </div>

          {/* Order row skeletons */}
          {[0.08, 0.13, 0.18, 0.23, 0.28].map((delay, i) => (
            <div
              key={i}
              style={{
                padding: "12px 16px",
                borderBottom: i < 4 ? "1px solid #fafafa" : "none",
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              {/* Top: Order ID + Status */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  <Bone width={140} height={16} radius={6} delay={delay} />
                  <Bone width={80} height={14} radius={6} delay={delay + 0.03} />
                </div>
                <Bone width={90} height={28} radius={8} delay={delay + 0.02} />
              </div>

              {/* Middle: Customer */}
              <div
                style={{
                  background: "#f8fafc",
                  borderRadius: 12,
                  padding: "10px 12px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  <Bone width={100} height={13} radius={5} delay={delay + 0.04} />
                  <Bone width={76} height={11} radius={4} delay={delay + 0.05} />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Bone width={56} height={18} radius={5} delay={delay + 0.04} />
                  <Bone width={28} height={28} radius={8} delay={delay + 0.05} />
                </div>
              </div>

              {/* Footer: Date | Zone | Payment */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 4 }}>
                <Bone width={90} height={12} radius={4} delay={delay + 0.06} />
                <Bone width={110} height={18} radius={6} delay={delay + 0.07} />
                <Bone width={44} height={18} radius={6} delay={delay + 0.08} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes _sk_shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}

// ─── Reusable Bone primitive ─────────────────────────────────────────────────
function Bone({
  width,
  height,
  radius,
  delay,
}: {
  width: number | string;
  height: number;
  radius: number;
  delay: number;
}) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius: radius,
        background:
          "linear-gradient(90deg, #f0f2f5 25%, #e6e8ec 50%, #f0f2f5 75%)",
        backgroundSize: "200% 100%",
        animation: `_sk_shimmer 1.6s ease-in-out infinite ${delay}s`,
        flexShrink: 0,
      }}
    />
  );
}
