// src/app/(admin)/admin/categories/new/page.tsx
import CategoryForm from "./CategoryForm";

export const metadata = {
  title: "Add New Category | Admin",
  description: "Create a new product category in your store.",
};

export default function NewCategoryPage() {
  return <CategoryForm />;
}
