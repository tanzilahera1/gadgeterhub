import mongoose, { Mongoose } from "mongoose";
import { MongoClient } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  throw new Error("Please define MONGODB_URI in .env.local");
}

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

export async function dbConnect(): Promise<Mongoose> {
  if (cached!.conn) return cached!.conn;

  if (!cached!.promise) {
    // bufferCommands: false বাদ দাও। ডিফল্ট true থাকবে
    cached!.promise = mongoose.connect(MONGODB_URI).then((m) => m);
  }

  try {
    cached!.conn = await cached!.promise;
  } catch (e) {
    cached!.promise = null;
    throw e;
  }

  return cached!.conn;
}

export const clientPromise: Promise<MongoClient> = dbConnect().then(
  (mongooseInstance) => {
    return mongooseInstance.connection.getClient() as unknown as MongoClient;
  },
);
