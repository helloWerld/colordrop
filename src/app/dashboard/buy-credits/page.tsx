import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getOrCreateUserProfile } from "@/lib/db";
import { BuyCreditsContent } from "./buy-credits-content";

export default async function BuyCreditsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const profile = await getOrCreateUserProfile(userId);
  const freeRemaining = profile.free_conversions_remaining ?? 0;
  const paidCredits = profile.paid_credits ?? 0;

  return (
    <BuyCreditsContent
      freeRemaining={freeRemaining}
      paidCredits={paidCredits}
    />
  );
}
