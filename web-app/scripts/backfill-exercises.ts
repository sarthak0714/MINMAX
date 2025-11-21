/**
 * Temporary script to backfill exercises from JSON file to MongoDB
 *
 * Run: npx tsx scripts/backfill-exercises.ts
 *
 * Requires MONGODB_URI in .env file
 */

import "dotenv/config";
import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import models
import { Exercise } from "../server/models/Exercise.js";

type RawExercise = {
  name: string;
  targetMuscle: string[];
  meta: string[];
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

async function main() {
  const MONGODB_URI = process.env.MONGODB_URI;

  if (!MONGODB_URI) {
    throw new Error("Missing MONGODB_URI env var");
  }

  console.log("Connecting to MongoDB...");
  await mongoose.connect(MONGODB_URI, {
    dbName: process.env.MONGODB_DB || "minmax",
  });
  console.log("Connected to MongoDB");

  // Read exercises from JSON file
  const filePath = path.resolve(__dirname, "../src/items/exersise.json");
  const raw = fs.readFileSync(filePath, "utf-8");
  const list: RawExercise[] = JSON.parse(raw);

  console.log(`Found ${list.length} exercises in JSON file`);

  // Upsert each exercise
  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const ex of list) {
    const slug = slugify(ex.name);

    try {
      const result = await Exercise.findOneAndUpdate(
        { slug },
        {
          name: ex.name,
          targetMuscle: ex.targetMuscle || [],
          meta: ex.meta || [],
          slug,
          createdAt: new Date(),
        },
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true,
        }
      );

      if (result.isNew) {
        created++;
        console.log(`✓ Created: ${ex.name}`);
      } else {
        updated++;
        console.log(`↻ Updated: ${ex.name}`);
      }
    } catch (err: any) {
      if (err.code === 11000) {
        skipped++;
        console.log(`⊘ Skipped (duplicate): ${ex.name}`);
      } else {
        console.error(`✗ Error with ${ex.name}:`, err.message);
      }
    }
  }

  console.log("\n=== Summary ===");
  console.log(`Created: ${created}`);
  console.log(`Updated: ${updated}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Total: ${list.length}`);

  await mongoose.disconnect();
  console.log("\nDisconnected from MongoDB");
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
