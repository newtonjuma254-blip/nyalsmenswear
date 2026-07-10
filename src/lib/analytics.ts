import { supabase } from "@/integrations/supabase/client";

const SESSION_KEY = "nyals_session_id";

function uuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    try { return crypto.randomUUID(); } catch { /* fall through */ }
  }
  return "s-" + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function getSessionId(): string {
  if (typeof window === "undefined") return "ssr";
  try {
    let sid = localStorage.getItem(SESSION_KEY);
    if (!sid) {
      sid = uuid();
      localStorage.setItem(SESSION_KEY, sid);
    }
    return sid;
  } catch {
    return "no-storage";
  }
}

export type AnalyticsEventType = "page_view" | "product_view" | "order_click";

export function trackEvent(
  event_type: AnalyticsEventType,
  opts: { product_id?: string | null; page_path?: string | null } = {},
) {
  if (typeof window === "undefined") return;
  // Fire-and-forget; never block the caller.
  Promise.resolve().then(async () => {
    try {
      await supabase.from("analytics_events").insert({
        event_type,
        product_id: opts.product_id ?? null,
        session_id: getSessionId(),
        page_path: opts.page_path ?? window.location.pathname,
      });
    } catch {
      /* swallow — analytics must never break the app */
    }
  });
}
