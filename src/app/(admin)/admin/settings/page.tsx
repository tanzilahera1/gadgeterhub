// src/app/(admin)/admin/settings/page.tsx
import { auth } from "@/auth";
import { dbConnect } from "@/lib/db";
import Setting from "@/models/Setting";
import { redirect } from "next/navigation";
import SettingsForm from "./SettingsForm";

export const metadata = {
  title: "Store Settings | Admin",
};

async function getStoreSettings() {
  await dbConnect();
  const settings = await Setting.findOne().lean();
  return JSON.parse(JSON.stringify(settings || {}));
}

export default async function AdminSettingsPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== "admin") {
    redirect("/");
  }

  const initialSettings = await getStoreSettings();

  return <SettingsForm initialData={initialSettings} />;
}
