// src/components/layout/Header.tsx
import PromoBar from "./PromoBar";
import NavbarClient from "./NavbarClient";
import CategoryNav from "./CategoryNav";

export default function Header() {
  return (
    <header className="w-full">
      {/*
        <PromoBar />
        Note: PromoBar is currently disabled. Enable this later if needed.
      */}
      <NavbarClient />
      <CategoryNav />
    </header>
  );
}
