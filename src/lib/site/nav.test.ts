import { describe, expect, it } from 'vitest';
import { HOME, LEGACY_ANCHORS, PRIMARY, SECONDARY, isCurrent, routeFor } from './nav';

describe('site map', () => {
  const routes = [HOME, ...PRIMARY, ...SECONDARY];

  it('gives every route a unique href, index, and gem', () => {
    for (const key of ['href', 'index', 'gem'] as const) {
      expect(new Set(routes.map((r) => r[key])).size).toBe(routes.length);
    }
  });

  it('forwards every legacy anchor to a real primary route', () => {
    const hrefs = PRIMARY.map((r) => r.href);
    for (const target of Object.values(LEGACY_ANCHORS)) expect(hrefs).toContain(target);
  });

  it('leads with the threat model and numbers routes in order', () => {
    expect(PRIMARY[0].href).toBe('/threat-model/');
    expect(routes.map((r) => r.index)).toEqual(routes.map((_, i) => String(i).padStart(2, '0')));
  });

  it('nests scenario pages under the threat model', () => {
    expect(isCurrent(routeFor('/threat-model/'), '/threat-model/scenarios/sp-01/')).toBe(true);
    expect(() => routeFor('/nowhere/')).toThrow();
  });

  it('marks the current route with or without a trailing slash', () => {
    const tools = routeFor('/tools/');
    expect(isCurrent(tools, '/tools')).toBe(true);
    expect(isCurrent(tools, '/tools/')).toBe(true);
    expect(isCurrent(tools, '/tools/scanner/')).toBe(true);
    expect(isCurrent(tools, '/stakes/')).toBe(false);
    expect(isCurrent(HOME, '/')).toBe(true);
    expect(isCurrent(HOME, '/tools/')).toBe(false);
  });
});
