// src/types/next-auth.d.ts
import { DefaultSession, DefaultUser } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "user" | "admin";
      name: string;
    } & DefaultSession["user"];
  }

  // ✅ DefaultUser extend করো — এটাই "role does not exist" ফিক্স করে
  interface User extends DefaultUser {
    role: "user" | "admin";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "user" | "admin";
    name: string;
  }
}