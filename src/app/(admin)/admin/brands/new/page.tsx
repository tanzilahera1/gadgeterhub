// src/app/(admin)/admin/brands/new/page.tsx
import BrandForm from "./BrandForm";

export const metadata = {
  title: "Add New Brand | Admin",
  description: "Create a new brand in your store.",
};

export default function NewBrandPage() {
  return <BrandForm />;
}
