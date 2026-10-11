/* ─── Guide content: every stage in reading order ───────────────────────
   Routing never edits this list; each stage and step declares the traits
   it needs (see paths.ts → visibleStages). */

import type { Stage } from "../types";
import { HARDEN_STAGE } from "./stages-harden";
import { ENROLL_STAGE } from "./stages-enroll";
import { CA_STAGE, PLAN_STAGE } from "./stages-foundation";
import { ACCESS_POINT_STAGE, RADIUS_STAGE, TUNNEL_STAGE } from "./stages-network";
import { CUTOVER_STAGE, MAINTAIN_STAGE, VERIFY_STAGE } from "./stages-operate";

export { GUIDE_UPDATED, GUIDE_VERSION, PLACEHOLDERS } from "./meta";

export const STAGES: readonly Stage[] = [
  HARDEN_STAGE,
  PLAN_STAGE,
  CA_STAGE,
  RADIUS_STAGE,
  TUNNEL_STAGE,
  ACCESS_POINT_STAGE,
  ENROLL_STAGE,
  VERIFY_STAGE,
  CUTOVER_STAGE,
  MAINTAIN_STAGE,
];
