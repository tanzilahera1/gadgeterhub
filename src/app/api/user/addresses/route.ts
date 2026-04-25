// src/app/api/user/addresses/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { dbConnect } from "@/lib/db";
import User from "@/models/User";
import type { IUser, IAddressDoc } from "@/types/user";
import { Document } from "mongoose";

// ✅ Mongoose Document টাইপ
type UserDocument = Document<unknown, Record<string, never>, IUser> & IUser;

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const address: Partial<IAddressDoc> = await req.json();
    await dbConnect();

    // ✅ ফিক্স: Document টাইপ ইউজ করো
    const user = await User.findById<UserDocument>(session.user.id);
    if (!user)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    if (user.addresses.length === 0) {
      address.isDefault = true;
    } else if (address.isDefault) {
      user.addresses.forEach((a) => {
        a.isDefault = false;
      });
    }

    user.addresses.push(address as IAddressDoc);
    await user.save(); // ✅ এখন কাজ করবে

    return NextResponse.json({ success: true, addresses: user.addresses });
  } catch (error) {
    console.error("Address POST Error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await auth();
    if (!session?.user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id, ...updates }: { id: string } & Partial<IAddressDoc> =
      await req.json();
    await dbConnect();

    const user = await User.findById<UserDocument>(session.user.id);
    if (!user)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    const addressIndex = user.addresses.findIndex(
      (a) => a._id.toString() === id,
    );
    if (addressIndex === -1)
      return NextResponse.json({ error: "Address not found" }, { status: 404 });

    if (updates.isDefault) {
      user.addresses.forEach((a) => {
        a.isDefault = false;
      });
    }

    Object.assign(user.addresses[addressIndex], updates);
    await user.save(); // ✅ কাজ করবে

    return NextResponse.json({ success: true, addresses: user.addresses });
  } catch (error) {
    console.error("Address PATCH Error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await auth();
    if (!session?.user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id)
      return NextResponse.json(
        { error: "Address ID required" },
        { status: 400 },
      );

    await dbConnect();
    const user = await User.findById<UserDocument>(session.user.id);
    if (!user)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    user.addresses = user.addresses.filter((a) => a._id.toString() !== id);

    if (user.addresses.length > 0 && !user.addresses.some((a) => a.isDefault)) {
      user.addresses[0].isDefault = true;
    }

    await user.save(); // ✅ কাজ করবে
    return NextResponse.json({ success: true, addresses: user.addresses });
  } catch (error) {
    console.error("Address DELETE Error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
