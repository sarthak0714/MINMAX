import { connectMongo } from "./_db.js";
import { Exercise } from "./models/Exercise.js";

export default async function handler(request: Request) {
  try {
    if (request.method !== "GET") {
      return new Response(JSON.stringify({ error: "Method Not Allowed" }), {
        status: 405,
        headers: {
          "Content-Type": "application/json",
          "Allow": "GET"
        }
      });
    }
    
    await connectMongo();
    const docs = await Exercise.find({}, null, { lean: true })
      .sort({ name: 1 })
      .limit(500)
      .exec();
    
    return new Response(JSON.stringify({ documents: docs }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: "Server Error", message: err?.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}
