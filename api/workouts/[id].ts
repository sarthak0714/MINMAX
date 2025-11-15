import mongoose from "mongoose";
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
    if (request.method !== "PATCH") {
      return new Response(JSON.stringify({ error: "Method Not Allowed" }), {
        status: 405,
        headers: {
          "Content-Type": "application/json",
          Allow: "PATCH",
        },
      });
    }

    await connectMongo();

    // Extract id from URL path
    const url = new URL(request.url);
    const pathParts = url.pathname.split("/");
    const id = pathParts[pathParts.length - 1];

    if (!id || !mongoose.isValidObjectId(id)) {
      return new Response(JSON.stringify({ error: "Invalid id" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await request.json();
    const toSet: any = { updatedAt: new Date() };
    if (body.title !== undefined) toSet.title = body.title;
    if (body.notes !== undefined) toSet.notes = body.notes;
    if (body.exercises !== undefined) {
      toSet.exercises = body.exercises;
      toSet.metrics = computeMetrics(body.exercises);
    }

    const result = await Workout.updateOne({ _id: id }, { $set: toSet }).exec();

    return new Response(
      JSON.stringify({
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: "Server Error", message: err?.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
