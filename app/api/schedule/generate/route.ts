import { NextRequest, NextResponse } from "next/server";
import { generateWeeklySchedule } from "@/src/lib/schedule/weekly-generator";

// CORS and options request support
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

/**
 * Generates the weekly static schedule from current Friday to next Thursday.
 * Returns the generated data.
 */
export async function POST(req: NextRequest) {
  try {
    const result = await generateWeeklySchedule();
    return NextResponse.json(result);
  } catch (err: any) {
    console.error("Error in schedule generation route:", err);
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 });
  }
}
