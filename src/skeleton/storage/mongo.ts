import { MongoClient, type Db, type Collection } from 'mongodb';
import type { SessionRecord } from '@/skeleton/schema/session';

declare global {
  var __marrowMongoPromise: Promise<MongoClient> | undefined;
  var __marrowIndexesReady: boolean | undefined;
}

function getMongoUri(): string {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URL;
  if (!uri) {
    throw new Error('Missing MongoDB connection string. Configure MONGODB_URI or MONGO_URL.');
  }
  return uri;
}

function getMongoDbName(): string {
  return process.env.MONGODB_DB || 'marrow';
}

export async function getMongoClient(): Promise<MongoClient> {
  if (!globalThis.__marrowMongoPromise) {
    const client = new MongoClient(getMongoUri(), {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
    });
    globalThis.__marrowMongoPromise = client.connect().catch((err) => {
      globalThis.__marrowMongoPromise = undefined;
      throw err;
    });
  }
  return globalThis.__marrowMongoPromise;
}

export async function getDatabase(): Promise<Db> {
  const client = await getMongoClient();
  return client.db(getMongoDbName());
}

export async function getSessionsCollection(): Promise<Collection<SessionRecord>> {
  const db = await getDatabase();
  const collection = db.collection<SessionRecord>('sessions');

  if (!globalThis.__marrowIndexesReady) {
    await Promise.all([
      collection.createIndex({ appId: 1, isPublic: 1, createdAt: -1 }),
      collection.createIndex({ isPublic: 1, createdAt: -1 }),
    ]);
    globalThis.__marrowIndexesReady = true;
  }

  return collection;
}

export async function pingMongo(): Promise<{ ok: true; latencyMs: number }> {
  const started = Date.now();
  const db = await getDatabase();
  await db.command({ ping: 1 });
  return { ok: true, latencyMs: Date.now() - started };
}
