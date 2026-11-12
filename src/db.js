import mongoose from 'mongoose';

// Defense in depth: wrap query values in $eq so user input can never be
// interpreted as a MongoDB operator (NoSQL injection).
mongoose.set('sanitizeFilter', true);

export async function connectDb(uri) {
  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 5000,
  });

  return mongoose.connection;
}

export async function disconnectDb() {
  await mongoose.disconnect();
}
