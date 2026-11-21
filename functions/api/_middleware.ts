import type { PagesFunction } from "@cloudflare/workers-types";
import { jsonError, withApiHeaders } from "../_lib/http/api-headers.js";

/**
 * Apply API security headers to every /api/* response, including errors
 * and the 404/405 responses produced when no method handler matches.
 * A thrown handler becomes a generic 500 so the headers still apply and
 * the exception text stays out of the response.
 */
export const onRequest: PagesFunction = async (context) => {
  try {
    const response = await context.next();
    return withApiHeaders(response);
  } catch {
    return jsonError("Request failed", 500);
  }
};
