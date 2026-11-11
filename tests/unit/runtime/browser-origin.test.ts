import type { IncomingMessage } from "node:http";

import { describe, expect, it } from "vitest";

import { BROWSER_ORIGIN_HEADER, isSameOriginPost } from "~/server/web/csrf";

import { alignOriginScheme } from "../../../runtime/http";
function throughProxy(origin?: string, forged?: string) {
  const headers: Record<string, string> = { host: "mesh.mmold.com" };
  if (origin !== undefined) headers.origin = origin;
  if (forged !== undefined) headers[BROWSER_ORIGIN_HEADER] = forged;
  const raw = { headers, socket: {} } as unknown as IncomingMessage;
  alignOriginScheme(raw);
  return new Request("http://mesh.mmold.com/admin/settings/agent", {
    method: "POST",
    headers: raw.headers as Record<string, string>,
  });
}
describe("browser origin at the HTTP adapter boundary", () => {
  it("keeps the actual HTTPS browser origin while satisfying internal HTTP Router checks", () => {
    const request = throughProxy("https://mesh.mmold.com");
    expect(request.headers.get("Origin")).toBe("http://mesh.mmold.com");
    expect(request.headers.get(BROWSER_ORIGIN_HEADER)).toBe("https://mesh.mmold.com");
    expect(isSameOriginPost(request, "https://mesh.mmold.com")).toBe(true);
  });
  it.each([
    undefined,
    "null",
    "https://evil.example",
    "http://mesh.mmold.com",
    "https://mesh.mmold.com:444",
  ])("rejects %s even with a forged preserved-origin header", (origin) => {
    expect(
      isSameOriginPost(throughProxy(origin, "https://mesh.mmold.com"), "https://mesh.mmold.com"),
    ).toBe(false);
  });
  it("overwrites a caller-provided preserved origin with the real header", () => {
    const request = throughProxy("https://mesh.mmold.com", "https://evil.example");
    expect(isSameOriginPost(request, "https://mesh.mmold.com")).toBe(true);
  });
});
