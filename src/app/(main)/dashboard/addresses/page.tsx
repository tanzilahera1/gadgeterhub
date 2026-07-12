// src/app/(main)/dashboard/addresses/page.tsx
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { dbConnect } from "@/lib/db";
import User from "@/models/User";
import { IUser } from "@/types/user"; // ✅ টাইপ ইম্পোর্ট করো
import { AddressManager } from "@/components/dashboard/AddressManager";
import { MapPin } from "lucide-react";

export const metadata = {
  title: "My Addresses | GadgeterHub",
  description: "Manage your shipping and billing addresses.",
};

async function getAddresses(userId: string) {
  await dbConnect();
  // ✅ ফিক্স: Pick<IUser, 'addresses'> দিয়ে শুধু addresses টাইপ নিচ্ছি
  const user = await User.findById(userId)
    .select("addresses")
    .lean<Pick<IUser, "addresses">>();

  return user?.addresses || [];
}

export default async function AddressesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const addresses = await getAddresses(session.user.id);
  const serializableAddresses = addresses.map((addr) => ({
    ...addr,
    _id: addr._id.toString(),
    createdAt: addr.createdAt.toISOString(),
    updatedAt: addr.updatedAt.toISOString(),
  }));

  return (
    <div className="space-y-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-tight text-slate-900 flex items-center gap-3">
            <MapPin className="size-8 text-primary" />
            My Addresses
          </h1>
          <p className="text-slate-500 font-medium tracking-tight">
            Save multiple addresses for faster checkout.
          </p>
        </div>
      </div>

      <AddressManager initialAddresses={serializableAddresses} />
    </div>
  );
}
