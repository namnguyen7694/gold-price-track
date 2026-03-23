import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const range = searchParams.get("range") || "day";

    let snapshot;
    console.log(range);
    if (range === "day") {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      snapshot = await adminDb
        .collection("gold_prices")
        .where("timestamp", ">=", startOfDay.toISOString())
        .orderBy("timestamp", "desc")
        .get();
    } else if (range === "week") {
      snapshot = await adminDb.collection("gold_prices_6h").orderBy("timestamp", "desc").limit(100).get();

      // Fallback for new projects/collections
      if (snapshot.empty) {
        snapshot = await adminDb.collection("gold_prices").orderBy("timestamp", "desc").limit(300).get();
      }
    } else if (range === "month") {
      snapshot = await adminDb.collection("gold_prices_24h").orderBy("timestamp", "desc").limit(100).get();

      // Fallback
      if (snapshot.empty) {
        snapshot = await adminDb.collection("gold_prices").orderBy("timestamp", "desc").limit(1000).get();
      }
    } else {
      snapshot = await adminDb.collection("gold_prices").orderBy("timestamp", "desc").limit(100).get();
    }

    const history = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json(history);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("History API error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
