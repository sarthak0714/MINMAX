import mongoose from 'mongoose';

declare global {
  // eslint-disable-next-line no-var
  var _mongoose: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null } | undefined;
}

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Missing MONGODB_URI env var');
}

mongoose.set('strictQuery', true);

export async function connectMongo(): Promise<typeof mongoose> {
  if (!global._mongoose) {
    global._mongoose = { conn: null, promise: null };
  }
  if (global._mongoose.conn) {
    return global._mongoose.conn;
  }
  if (!global._mongoose.promise) {
    global._mongoose.promise = mongoose.connect(MONGODB_URI, {
      dbName: process.env.MONGODB_DB || 'minmax',
      serverSelectionTimeoutMS: 8000,
      maxPoolSize: 10,
    });
  }
  global._mongoose.conn = await global._mongoose.promise;
  return global._mongoose.conn;
}


