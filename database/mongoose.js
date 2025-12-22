import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

global.mongooseCache = global.mongooseCache || {
    conn: null,
    promise: null
}

let cached = global.mongooseCache;

export const connectToDatabase = async () => {

    if (!MONGODB_URI) throw new Error("MONGO_DB URI not set.");

    if (cached.conn) return cached.conn;

    if (!cached.promise) {
        cached.promise = mongoose.connect(MONGODB_URI, { bufferCommands: false });
    }

    try {
        cached.conn = await cached.promise;
        return cached.conn;
    }
    catch (err) {
        cached.promise = null; 
        throw err;
    }
    

}