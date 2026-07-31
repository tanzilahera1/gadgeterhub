// src/components/layout/AdminSidebar.tsx
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Layout, Menu, Button, Drawer, Typography, Flex, Tooltip } from "antd";
import {
  DashboardOutlined,
  ShoppingCartOutlined,
  AppstoreOutlined,
  TagsOutlined,
  SettingOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  ArrowLeftOutlined,
  CloseOutlined,
  ShoppingOutlined,
} from "@ant-design/icons";
import { useSidebar } from "@/hooks/use-sidebar";

const { Sider } = Layout;
const { Text, Title } = Typography;

const NAV_ITEMS = [
  { key: "/admin", label: "Dashboard", icon: <DashboardOutlined /> },
  { key: "/admin/orders", label: "Orders", icon: <ShoppingCartOutlined /> },
  { key: "/admin/products", label: "Products", icon: <ShoppingOutlined /> },
  { key: "/admin/categories", label: "Categories", icon: <AppstoreOutlined /> },
  { key: "/admin/brands", label: "Brands", icon: <TagsOutlined /> },
  { key: "/admin/settings", label: "Settings", icon: <SettingOutlined /> },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isCollapsed, toggleCollapsed, isMobileOpen, setMobileOpen } =
    useSidebar();

  // Find selected key
  const selectedKey =
    NAV_ITEMS.find(
      (item) =>
        pathname === item.key ||
        (item.key !== "/admin" && pathname.startsWith(item.key)),
    )?.key || "/admin";

  const handleMenuClick = ({ key }: { key: string }) => {
    router.push(key);
    setMobileOpen(false);
  };

  const sidebarContent = (
    <Flex vertical style={{ height: "100%" }}>
      {/* Sidebar Header */}
      <div
        style={{
          padding: isCollapsed ? "16px 8px" : "16px",
          borderBottom: "1px solid #f1f5f9",
          textAlign: isCollapsed ? "center" : "left",
        }}
      >
        {!isCollapsed ? (
          <Flex align="center" justify="space-between">
            <div>
              <Title level={5} style={{ margin: 0, fontWeight: 900 }}>
                Admin Panel
              </Title>
              <Link href="/" style={{ fontSize: "11px", color: "#64748b", fontWeight: 600 }}>
                ← Back to Store
              </Link>
            </div>

            <Button
              type="text"
              icon={isCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={toggleCollapsed}
              className="hidden lg:flex"
            />
          </Flex>
        ) : (
          <Tooltip title="Expand Sidebar" placement="right">
            <Button
              type="text"
              icon={<MenuUnfoldOutlined />}
              onClick={toggleCollapsed}
              className="hidden lg:flex mx-auto"
            />
          </Tooltip>
        )}
      </div>

      {/* Navigation Menu */}
      <div style={{ flex: 1, padding: "8px 0", overflowY: "auto" }}>
        <Menu
          mode="inline"
          selectedKeys={[selectedKey]}
          items={NAV_ITEMS}
          onClick={handleMenuClick}
          style={{ borderRight: 0, fontWeight: 600 }}
        />
      </div>

      {/* Sidebar Footer Logout */}
      <div style={{ padding: "12px", borderTop: "1px solid #f1f5f9" }}>
        <Button
          type="text"
          danger
          block={!isCollapsed}
          icon={<LogoutOutlined />}
          style={{
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            justifyContent: isCollapsed ? "center" : "flex-start",
          }}
        >
          {!isCollapsed && "Logout"}
        </Button>
      </div>
    </Flex>
  );

  return (
    <>
      {/* Desktop Antd Sider */}
      <Sider
        collapsible
        collapsed={isCollapsed}
        onCollapse={toggleCollapsed}
        trigger={null}
        width={260}
        collapsedWidth={80}
        style={{
          background: "#ffffff",
          borderRight: "1px solid #e2e8f0",
          height: "100vh",
          position: "fixed",
          left: 0,
          top: 0,
          zIndex: 40,
        }}
        className="hidden lg:block"
      >
        {sidebarContent}
      </Sider>

      {/* Mobile Antd Drawer */}
      <Drawer
        placement="left"
        onClose={() => setMobileOpen(false)}
        open={isMobileOpen}
        size={260 as any}
        styles={{ body: { padding: 0 } }}
        closeIcon={<CloseOutlined />}
        className="lg:hidden"
      >
        {sidebarContent}
      </Drawer>
    </>
  );
}
