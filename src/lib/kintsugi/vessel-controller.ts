/**
 * Client controller for the kintsugi vessel (home page).
 *
 * Progressive enhancement over KintsugiVessel.astro's server markup:
 *   - No JS: the vessel renders mended (gold seams, aligned text).
 *   - With JS: it starts broken. Tracing (mouse/pen), tapping (touch), or the
 *     Mend button lays fire-opal lacquer that cures to gold; shards close as
 *     their seams fill. The button then toggles back to the break.
 *
 * Side effects (all scoped to the vessel element): clones the statement
 * surface into aria-hidden shard layers, sets CSSOM styles (clip-path,
 * transform vars — CSP-safe, no style attributes), adds pointer/click
 * listeners, and schedules timers it always clears on reset.
 * Nothing is persisted; a reload shows the break again.
 */
import {
  SHARDS,
  allSegments,
  flowOrder,
  pixelDistance,
  shardClipPath,
  type Segment,
  type SeamId,
  type Shard,
} from './fracture';

const TRACE_RADIUS_PX = 26;
const TAP_RADIUS_PX = 72;
/** A touch that travels further than this is a scroll, not a tap. */
const TAP_SLOP_PX = 10;
const FLOW_STEP_MS = 14;
const CURE_DELAY_MS = 650;

interface VesselState {
  readonly root: HTMLElement;
  readonly slab: HTMLElement;
  readonly segments: Segment[];
  readonly lines: Map<string, SVGLineElement>;
  readonly mended: Set<string>;
  readonly shards: Map<Shard['id'], HTMLElement>;
  readonly timers: Set<number>;
  readonly reduced: boolean;
  readonly toggle: HTMLButtonElement;
  readonly caption: HTMLElement;
  readonly live: HTMLElement;
}

const key = (seam: SeamId, index: number) => `${seam}:${index}`;

export function initVessels(doc: Document = document): void {
  doc.querySelectorAll<HTMLElement>('[data-vessel]').forEach((root) => {
    if (root.dataset.vesselReady === 'true') return;
    const state = createState(root);
    if (!state) return;
    root.dataset.vesselReady = 'true';
    buildShards(state);
    bindEvents(state);
    breakVessel(state);
  });
}

function createState(root: HTMLElement): VesselState | null {
  const slab = root.querySelector<HTMLElement>('[data-vessel-slab]');
  const toggle = root.querySelector<HTMLButtonElement>('[data-vessel-toggle]');
  const caption = root.querySelector<HTMLElement>('[data-vessel-caption]');
  const live = root.querySelector<HTMLElement>('[data-vessel-live]');
  if (!slab || !toggle || !caption || !live) return null;

  const lines = new Map<string, SVGLineElement>();
  root.querySelectorAll<SVGLineElement>('line[data-seam]').forEach((line) => {
    lines.set(key(line.dataset.seam as SeamId, Number(line.dataset.i)), line);
  });

  return {
    root, slab, toggle, caption, live, lines,
    segments: allSegments(),
    mended: new Set(),
    shards: new Map(),
    timers: new Set(),
    reduced: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  };
}

/** Clone the statement surface once per shard; the original stays for AT. */
function buildShards(state: VesselState): void {
  const source = state.slab.querySelector<HTMLElement>('[data-vessel-surface]');
  if (!source) return;
  const layer = document.createElement('div');
  layer.className = 'vessel__shards';
  layer.setAttribute('aria-hidden', 'true');

  for (const shard of SHARDS) {
    const clone = source.cloneNode(true) as HTMLElement;
    clone.removeAttribute('data-vessel-surface');
    clone.classList.add('vessel__shard');
    clone.querySelectorAll('[id]').forEach((el) => el.removeAttribute('id'));
    demoteHeading(clone);
    clone.style.clipPath = shardClipPath(shard);
    layer.append(clone);
    state.shards.set(shard.id, clone);
  }
  source.classList.add('vessel__surface--source');
  state.slab.prepend(layer);
  state.root.classList.add('is-enhanced');
}

/** Shard copies must not add headings to the document outline. */
function demoteHeading(clone: HTMLElement): void {
  clone.querySelectorAll('h1, h2').forEach((heading) => {
    const div = document.createElement('div');
    div.className = heading.className;
    heading.childNodes.forEach((node) => div.append(node.cloneNode(true)));
    heading.replaceWith(div);
  });
}

function bindEvents(state: VesselState): void {
  state.slab.addEventListener('pointermove', (event) => {
    if (event.pointerType === 'touch') return;
    traceAt(state, event);
  });
  // Touch mends on a completed tap only: a scroll that starts near a crack
  // moves past TAP_SLOP_PX or is cancelled by the browser, and mends nothing.
  let tapStart: { id: number; x: number; y: number } | null = null;
  state.slab.addEventListener('pointerdown', (event) => {
    if (event.pointerType !== 'touch') return;
    tapStart = { id: event.pointerId, x: event.clientX, y: event.clientY };
  });
  state.slab.addEventListener('pointercancel', () => { tapStart = null; });
  state.slab.addEventListener('pointerup', (event) => {
    if (event.pointerType !== 'touch' || !tapStart || tapStart.id !== event.pointerId) return;
    const moved = Math.hypot(event.clientX - tapStart.x, event.clientY - tapStart.y);
    tapStart = null;
    if (moved <= TAP_SLOP_PX) flowFromTap(state, event);
  });
  state.toggle.addEventListener('click', () => {
    if (isComplete(state)) breakVessel(state);
    else mendAll(state);
  });
}

function localPoint(state: VesselState, event: PointerEvent) {
  const rect = state.slab.getBoundingClientRect();
  return {
    pointer: { x: event.clientX - rect.left, y: event.clientY - rect.top },
    box: { width: rect.width, height: rect.height },
  };
}

function traceAt(state: VesselState, event: PointerEvent): void {
  const { pointer, box } = localPoint(state, event);
  for (const segment of state.segments) {
    if (pixelDistance(segment, pointer, box) <= TRACE_RADIUS_PX) lacquer(state, segment);
  }
}

function flowFromTap(state: VesselState, event: PointerEvent): void {
  const { pointer, box } = localPoint(state, event);
  let nearest: Segment | null = null;
  let best = TAP_RADIUS_PX;
  for (const segment of state.segments) {
    const d = pixelDistance(segment, pointer, box);
    if (d <= best) { best = d; nearest = segment; }
  }
  if (nearest) flowSeam(state, nearest.seam, nearest.index);
}

function flowSeam(state: VesselState, seam: SeamId, start: number): void {
  const seamSegments = state.segments.filter((s) => s.seam === seam);
  flowOrder(seamSegments.length, start).forEach((index, step) => {
    schedule(state, () => lacquer(state, seamSegments[index]), step * FLOW_STEP_MS);
  });
}

function mendAll(state: VesselState): void {
  const seams: SeamId[] = ['a', 'c', 'b'];
  seams.forEach((seam, order) => {
    schedule(state, () => flowSeam(state, seam, 0), order * 420);
  });
}

/** Lay wet lacquer on one segment; it cures to gold after a moment. */
function lacquer(state: VesselState, segment: Segment): void {
  const id = key(segment.seam, segment.index);
  const line = state.lines.get(id);
  if (!line || state.mended.has(id)) return;
  state.mended.add(id);
  line.classList.add('is-lacquer');
  schedule(state, () => line.classList.add('is-gold'), CURE_DELAY_MS);
  settleShards(state);
  if (isComplete(state)) complete(state);
}

function seamProgress(state: VesselState, seam: SeamId): number {
  const total = state.segments.filter((s) => s.seam === seam).length;
  let done = 0;
  state.mended.forEach((id) => { if (id.startsWith(`${seam}:`)) done += 1; });
  return total === 0 ? 1 : done / total;
}

/** Each shard closes in proportion to how much of its edge is mended. */
function settleShards(state: VesselState): void {
  for (const shard of SHARDS) {
    const el = state.shards.get(shard.id);
    if (!el) continue;
    const progress = shard.seams.reduce((sum, seam) => sum + seamProgress(state, seam), 0) / shard.seams.length;
    const open = 1 - progress;
    const [dx, dy, rot] = shard.drift;
    el.style.setProperty('--dx', `${(dx * open).toFixed(2)}px`);
    el.style.setProperty('--dy', `${(dy * open).toFixed(2)}px`);
    el.style.setProperty('--rot', `${(rot * open).toFixed(3)}deg`);
  }
}

function isComplete(state: VesselState): boolean {
  return state.mended.size === state.segments.length;
}

function complete(state: VesselState): void {
  state.root.classList.add('is-mended');
  state.toggle.textContent = 'Show the break';
  state.toggle.setAttribute('aria-pressed', 'true');
  state.live.textContent = 'Mended. The seam stays visible.';
}

/** Reset to the broken state. Also the initial state once JS runs. */
function breakVessel(state: VesselState): void {
  state.timers.forEach((t) => window.clearTimeout(t));
  state.timers.clear();
  state.mended.clear();
  state.lines.forEach((line) => line.classList.remove('is-lacquer', 'is-gold'));
  settleShards(state);
  const wasMended = state.root.classList.contains('is-mended');
  state.root.classList.remove('is-mended');
  state.toggle.textContent = 'Mend the break';
  state.toggle.setAttribute('aria-pressed', 'false');
  state.toggle.hidden = false;
  state.live.textContent = wasMended ? 'Broken again. Trace a crack or press Mend to repair it.' : '';
}

function schedule(state: VesselState, fn: () => void, delay: number): void {
  if (state.reduced || delay <= 0) { fn(); return; }
  const timer = window.setTimeout(() => { state.timers.delete(timer); fn(); }, delay);
  state.timers.add(timer);
}
