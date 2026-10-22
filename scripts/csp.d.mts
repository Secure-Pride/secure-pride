export function cspHash(text: string): string;
export function scanHtml(html: string): { scripts: string[]; styles: string[]; blocked: string[] };
export function renderHeaders(template: string, inline: { scripts: string[]; styles: string[] }): string;
