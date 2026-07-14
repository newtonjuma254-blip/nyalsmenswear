import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const InputSchema = z.object({
  event_type: z.enum(["page_view", "product_view", "order_click"]),
  product_id: z.string().uuid().nullable().optional(),
  session_id: z.string().min(1).max(128),
  page_path: z.string().max(512).nullable().optional(),
});

export const recordAnalyticsEvent = createServerFn({ method: "POST" })
  .inputValidator((data) => InputSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("analytics_events").insert({
      event_type: data.event_type,
      product_id: data.product_id ?? null,
      session_id: data.session_id,
      page_path: data.page_path ?? null,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
