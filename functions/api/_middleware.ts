import type { PagesFunction } from "@cloudflare/workers-types";
import { withApiHeaders } from "../_lib/http/api-headers.js";

/**
 * Apply API security headers to every /api/* response, including errors
 * and the 404/405 responses produced when no method handler matches.
 */
export const onRequest: PagesFunction = async (context) => {
  const response = await context.next();
  return withApiHeaders(response);
};
