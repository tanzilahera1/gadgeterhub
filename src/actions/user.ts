"use server";

import { z } from "zod";
import { auth } from "@/auth";
import { dbConnect } from "@/lib/db";
import User from "@/models/User";
import { revalidatePath } from "next/cache";

const ProfileSchema = z.object({
  name: z.string().min(2),
  phone: z
    .string()
    .regex(/^01[3-9]\d{8}$/)
    .optional()
    .or(z.literal("")),
});

export async function updateProfile(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const validated = ProfileSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone"),
  });

  if (!validated.success)
    return {
      error: "Invalid profile data",
      details: validated.error.flatten(),
    };

  await dbConnect();
  await User.findByIdAndUpdate(session.user.id, {
    name: validated.data.name,
    phone: validated.data.phone || undefined,
  });

  revalidatePath("/dashboard");
  return { success: true };
}
