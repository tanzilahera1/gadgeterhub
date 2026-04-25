"use server";

import { z } from "zod";
import { dbConnect } from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { signIn, signOut } from "@/auth";
import { AuthError } from "next-auth";

const RegisterSchema = z.object({
  fullName: z.string().min(3, "Name must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function signUp(formData: z.infer<typeof RegisterSchema>) {
  try {
    const validated = RegisterSchema.safeParse(formData);
    if (!validated.success) {
      return { error: "Validation failed", details: validated.error.flatten() };
    }

    const { fullName, email, password } = validated.data;

    await dbConnect();

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return { error: "User already exists with this email" };
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const newUser = new User({
      fullName,
      email,
      password: hashedPassword,
      role: "user", // Default role
    });

    await newUser.save();

    return { success: true, message: "Registration successful! You can now login." };
  } catch (error) {
    console.error("Registration error:", error);
    return { error: "Internal server error. Please try again." };
  }
}

export async function login(formData: any) {
  try {
    await signIn("credentials", {
      email: formData.email,
      password: formData.password,
      redirectTo: formData.callbackUrl || "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Invalid credentials." };
        default:
          return { error: "Something went wrong." };
      }
    }
    throw error;
  }
}

export async function logout() {
  await signOut({ redirectTo: "/" });
}
