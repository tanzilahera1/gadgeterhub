// src/types/user.ts
import type { UserRole } from "./index";
import { Types } from "mongoose";

export interface IAddress {
  label: string; // 'Home', 'Office'
  name: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  district: string;
  postalCode: string;
  isDefault: boolean;
}

// ✅ অ্যাড: Mongoose সাবডকুমেন্টের জন্য
export interface IAddressDoc extends IAddress {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAddressSerializable extends IAddress {
  _id: string;
  createdAt: string;
  updatedAt: string;
}

export interface IUser {
  name: string;
  email: string;
  password?: string;
  image?: string;
  role: UserRole;
  phone?: string;
  emailVerified?: Date;
  addresses: IAddressDoc[]; // ✅ ফিক্স: IAddressDoc[]
  wishlist?: string[];
  emergencyContact?: string;
  resetToken?: string;
  resetTokenExpiry?: Date;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}
