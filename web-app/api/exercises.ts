import { connectMongo } from "./_db.js";
import { Exercise } from "./models/Exercise.js";

// In-memory cache with TTL
let exerciseCache: { data: any[] | null; timestamp: number } = {
  data: null,
  timestamp: 0,
};

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function isCacheValid(): boolean {
  return (
    exerciseCache.data !== null &&
    Date.now() - exerciseCache.timestamp < CACHE_TTL
  );
}

function invalidateCache() {
  exerciseCache = { data: null, timestamp: 0 };
}

export default async function handler(request: Request) {
  try {
    await connectMongo();

    // GET - List exercises with cache
    if (request.method === "GET") {
      // Return cached data if valid
      if (isCacheValid() && exerciseCache.data) {
        return new Response(
          JSON.stringify({ documents: exerciseCache.data, cached: true }),
          {
            status: 200,
            headers: {
              "Content-Type": "application/json",
              "Cache-Control": "public, max-age=300",
            },
          }
        );
      }

      // Fetch from DB and cache
      const docs = await Exercise.find({}, null, { lean: true })
        .sort({ name: 1 })
        .limit(500)
        .exec();

      exerciseCache = { data: docs, timestamp: Date.now() };

      return new Response(JSON.stringify({ documents: docs }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=300",
        },
      });
    }

    // POST - Create new exercise and invalidate cache
    if (request.method === "POST") {
      const body = await request.json();
      const { name, targetMuscle, meta } = body;

      if (!name) {
        return new Response(
          JSON.stringify({ error: "Missing required field: name" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      // Generate slug from name
      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");

      // Check if exercise with same slug already exists
      const existing = await Exercise.findOne({ slug });
      if (existing) {
        return new Response(
          JSON.stringify({
            error: "Exercise with this name already exists",
            document: {
              _id: existing._id.toString(),
              name: existing.name,
              targetMuscle: existing.targetMuscle || [],
              meta: existing.meta || [],
              slug: existing.slug,
              createdAt: existing.createdAt.toISOString(),
            },
          }),
          {
            status: 409,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      const doc = await Exercise.create({
        name,
        targetMuscle: targetMuscle || [],
        meta: meta || [],
        slug,
        createdAt: new Date(),
      });

      const document = {
        _id: doc._id.toString(),
        name: doc.name,
        targetMuscle: doc.targetMuscle || [],
        meta: doc.meta || [],
        slug: doc.slug,
        createdAt: doc.createdAt.toISOString(),
      };

      // Invalidate cache on write (write-through)
      invalidateCache();

      return new Response(JSON.stringify({ document }), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Method Not Allowed" }), {
      status: 405,
      headers: {
        "Content-Type": "application/json",
        Allow: "GET, POST",
      },
    });
  } catch (err: any) {
    if (err.code === 11000) {
      return new Response(
        JSON.stringify({ error: "Exercise with this slug already exists" }),
        { status: 409, headers: { "Content-Type": "application/json" } }
      );
    }
    return new Response(
      JSON.stringify({ error: "Server Error", message: err?.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
