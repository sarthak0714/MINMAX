/*
  One-time seed script to upsert exercises into MongoDB Atlas via the Data API.

  Requirements (set as environment variables when running):
  - MONGO_DATA_API_KEY: App Services Data API key (server-side)
  - MONGO_APP_ID: App Services App ID
  - MONGO_DATA_SOURCE: Atlas Data Source name (e.g., Cluster0)
  - MONGO_DATABASE: Database name (e.g., minmax)

  Run (Node 18+):
    npx ts-node scripts/seed-exercises.ts

  NOTE: Do NOT include this API key in client builds.
*/

import fs from "node:fs";
import path from "node:path";

type RawExercise = {
  name: string;
  targetMuscle: string[];
  meta: string[];
};

type SeedExerciseDoc = RawExercise & {
  slug: string;
  createdAt: string;
};

const DATA_API_BASE =
  process.env.MONGO_BASE_URL || "https://data.mongodb-api.com/app";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

async function bulkUpsertExercises(docs: SeedExerciseDoc[]) {
  const apiKey = requireEnv("MONGO_DATA_API_KEY");
  const appId = requireEnv("MONGO_APP_ID");
  const dataSource = requireEnv("MONGO_DATA_SOURCE");
  const database = requireEnv("MONGO_DATABASE");

  const url = `${DATA_API_BASE}/${appId}/endpoint/data/v1/action/bulkWrite`;

  const operations = docs.map((doc) => ({
    updateOne: {
      filter: { slug: doc.slug },
      update: { $setOnInsert: doc },
      upsert: true,
    },
  }));

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apiKey: apiKey,
    },
    body: JSON.stringify({
      dataSource,
      database,
      collection: "exercises",
      operations,
      ordered: false,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `bulkWrite failed: ${res.status} ${res.statusText} - ${text}`
    );
  }

  const json = await res.json();
  return json;
}

async function ensureIndexes() {
  const apiKey = requireEnv("MONGO_DATA_API_KEY");
  const appId = requireEnv("MONGO_APP_ID");
  const dataSource = requireEnv("MONGO_DATA_SOURCE");
  const database = requireEnv("MONGO_DATABASE");

  const url = `${DATA_API_BASE}/${appId}/endpoint/data/v1/action/createIndexes`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apiKey: apiKey,
    },
    body: JSON.stringify({
      dataSource,
      database,
      collection: "exercises",
      indexes: [
        { name: "slug_unique", key: { slug: 1 }, unique: true },
        { name: "name", key: { name: 1 } },
      ],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `createIndexes failed: ${res.status} ${res.statusText} - ${text}`
    );
  }

  // workouts indexes
  const res2 = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apiKey: apiKey,
    },
    body: JSON.stringify({
      dataSource,
      database,
      collection: "workouts",
      indexes: [
        { name: "user_date", key: { userId: 1, date: -1 } },
        { name: "exercise_ids", key: { "exercises.exerciseId": 1 } },
      ],
    }),
  });
  if (!res2.ok) {
    const text = await res2.text();
    throw new Error(
      `createIndexes(workouts) failed: ${res2.status} ${res2.statusText} - ${text}`
    );
  }
}

async function main() {
  const filePath = path.resolve("src/items/exersise.json");
  const raw = fs.readFileSync(filePath, "utf-8");
  const list: RawExercise[] = JSON.parse(raw);

  const nowIso = new Date().toISOString();
  const docs: SeedExerciseDoc[] = list.map((e) => ({
    name: e.name,
    targetMuscle: e.targetMuscle,
    meta: e.meta,
    slug: slugify(e.name),
    createdAt: nowIso,
  }));

  console.log(`Upserting ${docs.length} exercises...`);
  const result = await bulkUpsertExercises(docs);
  console.log("bulkWrite result:", JSON.stringify(result));

  console.log("Ensuring indexes...");
  await ensureIndexes();
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
