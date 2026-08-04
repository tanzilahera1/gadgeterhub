// src/app/(admin)/admin/customers/page.tsx
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getAdminCustomersAction } from "@/actions/customer";
import { CustomersClient } from "./CustomersClient";

export default async function AdminCustomersPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    redirect("/login");
  }

  const res = await getAdminCustomersAction();
  const customers = res.customers || [];

  return <CustomersClient customers={customers} />;
}
