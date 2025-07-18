// @ts-nocheck
import { serve } from "https://deno.land/x/sift@0.6.0/mod.ts";

const CORS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
};

serve((req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS });
  }
  return new Response("Edge function is alive", {
    headers: { ...CORS, "Content-Type": "text/plain" },
  });
});
