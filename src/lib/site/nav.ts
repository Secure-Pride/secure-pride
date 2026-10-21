/**
 * Site map for the public pages. One entry per route; the header, footer,
 * home doorways, and each page's vertical index all read from here so the
 * hierarchy cannot drift between them.
 *
 * Gem assignments and their reasons: docs/brand/kintsugi-direction.md.
 */

export type Gem =
  | 'gold'
  | 'sapphire'
  | 'garnet'
  | 'tourmaline'
  | 'emerald'
  | 'amethyst'
  | 'lapis'
  | 'amber';

export interface Route {
  readonly href: string;
  readonly label: string;
  readonly gem: Gem;
  /** Two-digit position shown in the vertical index. */
  readonly index: string;
  /** One line used on the home doorways. Copy from the 2026-10-02 site. */
  readonly blurb: string;
  /** Short word for the giant outlined page word, when the label is long. */
  readonly word?: string;
}

export const HOME: Route = {
  href: '/',
  label: 'Secure Pride',
  gem: 'gold',
  index: '00',
  blurb: 'Security infrastructure for people who cannot fail safely.',
};

export const PRIMARY: readonly Route[] = [
  {
    href: '/tools/',
    label: 'Tools',
    gem: 'sapphire',
    index: '01',
    blurb: 'A bounded text check before you share, and what it cannot do.',
  },
  {
    href: '/stakes/',
    label: 'The stakes',
    gem: 'garnet',
    index: '02',
    blurb: 'Who pays when a control fails.',
  },
  {
    href: '/founder/',
    label: 'Founder',
    gem: 'tourmaline',
    index: '03',
    blurb: 'A person you can hold accountable.',
  },
  {
    href: '/contact/',
    label: 'Contact',
    gem: 'emerald',
    index: '04',
    blurb: 'Tell me where the work gets harder.',
  },
];

export const SECONDARY: readonly Route[] = [
  {
    href: '/privacy/',
    label: 'Privacy and processing',
    word: 'Privacy',
    gem: 'amethyst',
    index: '05',
    blurb: 'Where scanner text goes and what is logged.',
  },
  {
    href: '/security/',
    label: 'Report a vulnerability',
    word: 'Security',
    gem: 'lapis',
    index: '06',
    blurb: 'How to disclose a security issue.',
  },
];

/** The tools themselves (under /tools/). Listed in the footer. */
export const TOOL_LINKS = [
  { href: '/tools/scanner/', label: 'Text scanner' },
  { href: '/tools/wifi-enterprise/', label: 'Wi-Fi Enterprise guide' },
] as const;

export const EXTERNAL = [
  { href: 'https://github.com/Secure-Pride/secure-pride', label: 'Source and documentation' },
  { href: 'https://github.com/Secure-Pride/secure-pride/blob/main/CONTRIBUTING.md', label: 'Contribute' },
  { href: 'https://design.securepride.org', label: 'Design system' },
] as const;

/** Old single-page anchors → new routes. Read by the home page redirect. */
export const LEGACY_ANCHORS: Readonly<Record<string, string>> = {
  '#tools': '/tools/',
  '#stakes': '/stakes/',
  '#about': '/founder/',
  '#get-involved': '/contact/',
};

/** True when `pathname` is this route or nested under it. */
export function isCurrent(route: Route, pathname: string): boolean {
  const path = pathname.endsWith('/') ? pathname : `${pathname}/`;
  if (route.href === '/') return path === '/';
  return path === route.href || path.startsWith(route.href);
}
