import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const source = join(process.cwd(), "public/.well-known/security.txt");

describe("security.txt", () => {
  it("is present in public/.well-known with the required RFC 9116 fields", () => {
    expect(existsSync(source)).toBe(true);
    const body = readFileSync(source, "utf8");
    expect(body).toContain("Contact: mailto:security@securepride.org");
    expect(body).toContain(
      "Contact: https://github.com/Secure-Pride/secure-pride/security/advisories/new",
    );
    expect(body).toContain("Policy: https://securepride.org/security/");
    expect(body).toContain("Canonical: https://securepride.org/.well-known/security.txt");
    expect(body).toContain("Preferred-Languages: en");
    expect(body).toMatch(/Expires: \d{4}-\d{2}-\d{2}T/);
  });
});
