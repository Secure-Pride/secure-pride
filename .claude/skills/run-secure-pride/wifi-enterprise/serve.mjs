// Minimal static server for dist/. Optional CSP from the repo's _headers.
import http from "node:http"; import { readFile, stat } from "node:fs/promises"; import path from "node:path";
const [root, port, csp] = [process.argv[2], Number(process.argv[3]), process.argv[4] === "csp"];
const CSP = "default-src 'self'; style-src 'self'; font-src 'self'; img-src 'self' data:; script-src 'self'; base-uri 'self'; form-action 'none'; frame-ancestors 'none'";
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".woff2": "font/woff2", ".woff": "font/woff", ".png": "image/png", ".svg": "image/svg+xml" };
http.createServer(async (req, res) => {
  let p = path.join(root, decodeURIComponent(new URL(req.url, "http://x").pathname));
  try { if ((await stat(p)).isDirectory()) p = path.join(p, "index.html"); } catch { res.writeHead(404); return res.end(); }
  try {
    const body = await readFile(p);
    res.writeHead(200, { "content-type": types[path.extname(p)] ?? "application/octet-stream", ...(csp ? { "content-security-policy": CSP } : {}) });
    res.end(body);
  } catch { res.writeHead(404); res.end(); }
}).listen(port, () => console.log(`serving ${root} on ${port} csp=${csp}`));
