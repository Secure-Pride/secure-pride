import type { PagesFunction } from "@cloudflare/workers-types";
import { withApiHeaders } from "../_lib/http/api-headers.js";

export const onRequestGet: PagesFunction = async () => {
  return withApiHeaders(Response.json({ status: "ok", service: "secure-pride-dlp" }));
};
