import mongoose from "mongoose";

let connectionPromise: Promise<typeof mongoose> | null = null;

export function connectToDatabase(uri: string = process.env.MONGODB_URI ?? ""): Promise<typeof mongoose> {
  if (mongoose.connection.readyState === 1) {
    return Promise.resolve(mongoose);
  }

  if (!uri) {
    throw new Error("MONGODB_URI is not set");
  }

  if (!connectionPromise) {
    connectionPromise = mongoose.connect(uri);
  }

  return connectionPromise;
}

export async function disconnectFromDatabase(): Promise<void> {
  connectionPromise = null;
  await mongoose.disconnect();
}

export function isDatabaseConnected(): boolean {
  return mongoose.connection.readyState === 1;
}
