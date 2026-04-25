import mongoose, { Mongoose } from "mongoose";
import { MongoClient } from "mongodb"; // ✅ সরাসরি mongodb থেকে ইম্পোর্ট করুন

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  throw new Error(
    "Please define the MONGODB_URI environment variable inside .env.local",
  );
}

// Global টাইপ ডিফাইন করা (Next.js HMR এর জন্য)
interface GlobalMongoose {
  conn: Mongoose | null;
  promise: Promise<Mongoose> | null;
}

declare global {
  var mongoose: GlobalMongoose | undefined;
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

// ১. Named Export - Mongoose কানেকশন ফাংশন
export async function dbConnect(): Promise<Mongoose> {
  if (cached!.conn) {
    return cached!.conn;
  }

  if (!cached!.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached!.promise = mongoose.connect(MONGODB_URI, opts).then((m) => m);
  }

  try {
    cached!.conn = await cached!.promise;
  } catch (e) {
    cached!.promise = null;
    throw e;
  }

  return cached!.conn;
}

// ২. Named Export - Auth.js (NextAuth) এর জন্য MongoClient Promise
// এটি Mongoose এর কানেকশন পুল থেকেই ড্রাইভারে অ্যাক্সেস দেয়
export const clientPromise: Promise<MongoClient> = dbConnect().then(
  (mongooseInstance) => {
    return mongooseInstance.connection.getClient() as unknown as MongoClient;
  },
);