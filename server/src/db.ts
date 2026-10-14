import mongoose from 'mongoose';

export async function connectDB(uri: string) {
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
  console.log(`[db] Connected to MongoDB: ${uri.replace(/\/\/.*@/, '//***@')}`);
}
