import { getOpenSourceState } from "@/src/lib/server-db";
import BillingCancelClient from "./BillingCancelClient";

// Force dynamic rendering so the open-source banner appears immediately
// on every visit, even before client-side hydration.
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function BillingCancelPage() {
  let openSourceState: { enabled: boolean; message: string } | null = null;
  try {
    const state = await getOpenSourceState();
    openSourceState = {
      enabled: Boolean(state?.enabled),
      message: String(state?.message || ""),
    };
  } catch {
    openSourceState = null;
  }
  return <BillingCancelClient initialOpenSource={openSourceState} />;
}
