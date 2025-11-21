import { connectMongo } from "../_db.js";
import { Workout } from "../models/Workout.js";

function computeMetrics(exercises: any[]) {
  let totalVolume = 0;
  let numSets = 0;
  for (const ex of exercises || []) {
    for (const s of ex.sets || []) {
      numSets += 1;
      if (s && typeof s.weight === "number" && typeof s.reps === "number") {
        totalVolume += s.weight * s.reps;
      }
    }
  }
  return { totalVolume, numSets };
}

export default async function handler(request: Request) {
  try {
    await connectMongo();

    if (request.method === "POST") {
      const body = await request.json();
      const now = new Date();
      const metrics = computeMetrics(body.exercises);
      const doc = await Workout.create({
        userId: body.userId,
        date: body.date
          ? new Date(body.date)
          : new Date(now.toISOString().slice(0, 10)),
        title: body.title || undefined,
        notes: body.notes || undefined,
        exercises: body.exercises || [],
        createdAt: now,
        updatedAt: now,
        metrics,
      });
      return new Response(JSON.stringify({ insertedId: (doc as any)._id }), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (request.method === "GET") {
      const url = new URL(request.url);
      const userId = url.searchParams.get("userId");
      const date = url.searchParams.get("date");

      const filter: any = {};
      if (userId) filter.userId = userId;
      if (date) {
        const d = new Date(date);
        const start = new Date(
          Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0)
        );
        const end = new Date(
          Date.UTC(
            d.getUTCFullYear(),
            d.getUTCMonth(),
            d.getUTCDate(),
            23,
            59,
            59,
            999
          )
        );
        filter.date = { $gte: start, $lte: end };
      }
      const docs = await Workout.find(filter, null, { lean: true })
        .sort({ date: -1 })
        .limit(50)
        .exec();
      return new Response(JSON.stringify({ documents: docs }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=60",
        },
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
    return new Response(
      JSON.stringify({ error: "Server Error", message: err?.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
