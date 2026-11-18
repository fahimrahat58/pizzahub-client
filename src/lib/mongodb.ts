import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
const dbName = process.env.DB_NAME;

if (!uri) {
  throw new Error("MONGODB_URI is missing");
}

if (!dbName) {
  throw new Error("DB_NAME is missing");
}

const globalForMongo = globalThis as typeof globalThis & {
  mongoClientPromise?: Promise<MongoClient>;
};

const createClientPromise = () => {
  const client = new MongoClient(uri);
  const promise = client.connect();

  // A failed initial connect leaves the driver topology closed. Drop the
  // cached promise so the next attempt creates a fresh client instead of
  // reusing a poisoned topology.
  void promise.catch(() => {
    if (globalForMongo.mongoClientPromise === promise) {
      globalForMongo.mongoClientPromise = undefined;
    }
  });

  return promise;
};

const getClientPromise = () => {
  if (!globalForMongo.mongoClientPromise) {
    globalForMongo.mongoClientPromise = createClientPromise();
  }

  return globalForMongo.mongoClientPromise;
};

const clientPromise = getClientPromise();

export const getDb = async () => {
  const client = await getClientPromise();
  return client.db(dbName);
};

export { clientPromise };
