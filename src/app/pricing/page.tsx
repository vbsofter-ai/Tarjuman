import { getOpenSourceState } from "@/src/lib/server-db";
import PricingClient from "./PricingClient";

// Force dynamic rendering so the open-source / free-mode flag is always
// read fresh from the DB on every request. This guarantees the banner
// appears the moment the admin toggles it on, without waiting for any
// client-side fetch or cache to expire.
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function PricingPage() {
  let openSourceState: { enabled: boolean; message: string } | null = null;
  try {
    const state = await getOpenSourceState();
    openSourceState = {
      enabled: Boolean(state?.enabled),
      message: String(state?.message || ""),
    };
  } catch {
    // Never break the page on a config read failure — fall back to client fetch
    openSourceState = null;
  }
  return <PricingClient initialOpenSource={openSourceState} />;
}
