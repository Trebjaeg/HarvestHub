import mongoose, { Mongoose } from 'mongoose';

// Get MongoDB URI from environment variable
// For DigitalOcean Droplet: mongodb://username:password@your-droplet-ip:27017/harvesthub
// For MongoDB Atlas: mongodb+srv://username:password@cluster.mongodb.net/harvesthub
const MONGODB_URI: string | undefined = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(
    'Please define the MONGODB_URI environment variable inside .env.local\n' +
    'For DigitalOcean Droplet: mongodb://username:password@your-droplet-ip:27017/harvesthub\n' +
    'For MongoDB Atlas: mongodb+srv://username:password@cluster.mongodb.net/harvesthub'
  );
}

// Use a global variable to cache the connection across hot reloads in development
interface MongooseCache {
  conn: Mongoose | null;
  promise: Promise<Mongoose> | null;
}

// Extend the global interface to include mongoose
declare global {
  var mongoose: MongooseCache | undefined;
}

let cached: MongooseCache = global.mongoose || { conn: null, promise: null };
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

// Connection event handlers
mongoose.connection.on('connected', () => {
  console.log('MongoDB connected successfully');
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
});

/**
 * Connect to MongoDB using Mongoose, reusing connection if already established.
 * Throws if MONGODB_URI is not set.
 */
export default async function dbConnect(): Promise<Mongoose> {
  if (cached.conn) return cached.conn;
  
  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 50, // Increased for better performance under load
      minPoolSize: 5, // Maintain minimum connections
      maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
      serverSelectionTimeoutMS: 10000, // Increased timeout for server selection
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      family: 4, // Use IPv4, skip trying IPv6
      retryWrites: true,
      retryReads: true,
      connectTimeoutMS: 10000, // Give up initial connection after 10 seconds
      heartbeatFrequencyMS: 10000, // Check server health every 10 seconds
    };

    cached.promise = mongoose.connect(MONGODB_URI!, opts).catch(async (err) => {
      console.error('Initial MongoDB connection failed:', err);
      // Reset cached promise so next attempt can retry
      cached.promise = null;
      throw err;
    });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error) {
    cached.promise = null; // Reset on error
    throw error;
  }
}

/**
 * Alternative connection function that returns db and client objects
 * Used by some API routes that expect this format
 */
export async function connectToDatabase() {
  const connection = await dbConnect();
  
  return {
    db: connection.connection.db,
    client: connection.connection.getClient()
  };
}

// Graceful shutdown
process.on('SIGINT', async () => {
  if (cached.conn) {
    await cached.conn.disconnect();
    console.log('MongoDB connection closed through app termination');
    process.exit(0);
  }
});
