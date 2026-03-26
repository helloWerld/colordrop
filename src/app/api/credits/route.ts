import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getOrCreateUserProfile } from "@/lib/db";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const profile = await getOrCreateUserProfile(userId);
    return NextResponse.json({
      free_remaining: profile.free_conversions_remaining ?? 0,
      paid_credits: profile.paid_credits ?? 0,
    });
  } catch (e) {
    console.error("credits GET", e);
    return NextResponse.json(
      { error: "Failed to load credits" },
      { status: 500 }
    );
  }
}
