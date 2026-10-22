/**
 * /threat-model/corpus.json — the reviewed corpus, republished unchanged
 * for reuse. Built at deploy time; nothing about a visitor is involved.
 */
import type { APIRoute } from 'astro';
import { CORPUS } from '../../lib/threat-model/corpus';

export const GET: APIRoute = () =>
  new Response(`${JSON.stringify(CORPUS, null, 2)}\n`, {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
