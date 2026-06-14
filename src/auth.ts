// src/auth.ts
import NextAuth, { CredentialsSignin } from "next-auth";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { clientPromise, dbConnect } from "@/lib/db";
import User from "@/models/User";
import { IUser } from "@/types/user";
import bcrypt from "bcryptjs";
import { z } from "zod";
import mongoose from "mongoose";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: MongoDBAdapter(clientPromise),
  session: { strategy: "jwt" },

  // @ts-expect-error - Auth.js v5 এ টাইপ নাই কিন্তু রানটাইমে কাজ করে
  allowDangerousEmailAccountLinking: true,
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
      // এখান থেকে সরাই দিছ
    }),
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = z
          .object({
            email: z.string().email(),
            password: z.string(),
          })
          .safeParse(credentials);

        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        await dbConnect();
        const user = await User.findOne({ email }).lean<
          IUser & { _id: mongoose.Types.ObjectId }
        >();

        // জেনেরিক এরর মেসেজ ব্যবহার করো সিকিউরিটির জন্য
        if (!user || !user.password) {
          throw new CredentialsSignin("InvalidCredentials");
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
          throw new CredentialsSignin("InvalidCredentials");
        }

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, account }) {
      await dbConnect();

      // প্রথম লগিনে বা সাইন-ইনে
      if (user) {
        // DB-তে শেষ লগিন টাইম আপডেট করো
        const dbUser = await User.findByIdAndUpdate(
          user.id,
          { lastLogin: new Date() },
          { new: true },
        ).lean<IUser & { _id: mongoose.Types.ObjectId }>();

        if (dbUser) {
          token.id = dbUser._id.toString();
          token.role = dbUser.role || "user";
          token.name = dbUser.name || user.name;
        } else {
          // যদি কোনো কারণে DB-তে ইউজার না থাকে (যেমন একদম নতুন ওউথ ইউজার)
          token.id = user.id;
          token.role = (user as { role?: string }).role || "user";
          token.name = user.name;
        }
      }

      // OAuth হলে ইমেইল ভেরিফাইড ধরে নাও
      if (account?.provider === "google") {
        token.emailVerified = new Date();
      }

      // প্রোফাইল আপডেটে সেশন রিফ্রেশ
      if (trigger === "update") {
        await dbConnect();
        const dbUser = await User.findOne({ email: token.email }).lean<IUser>();
        if (dbUser) {
          token.role = dbUser.role;
          token.name = dbUser.name;
          token.image = dbUser.image;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as "user" | "admin";
        session.user.name = token.name as string;
      }
      return session;
    },
  },
  events: {
    // ✅ ফিক্স 2: isNewUser চেক বাদ। সবসময় মার্জ করো
    async signIn({ user }) {
      if (user?.id) {
        const { mergeGuestCartToUser } = await import("@/actions/cart");
        await mergeGuestCartToUser(user.id);

        try {
          const User = (await import("@/models/User")).default;
          const Order = (await import("@/models/Order")).default;
          const dbUser = await User.findById(user.id).select("phone").lean<{ phone?: string }>();
          if (dbUser?.phone) {
            await Order.updateMany(
              { user: { $exists: false }, customerPhone: dbUser.phone },
              { user: user.id }
            );
          }
        } catch (err) {
          console.error("Failed to link guest orders on signIn:", err);
        }
      }
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  trustHost: true,
});
