import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { RouterContextProvider } from "react-router";
import { describe, expect, it } from "vitest";

import { loader, action } from "~/routes/service-access";
import { appConfigContext, authContext } from "~/server/context";
import {
  canOperateServices,
  deviceIdentity,
  validateDeviceName,
} from "~/server/oidc/mmold-approval";
import {
  createServiceToken,
  readTokens,
  revokeServiceToken,
  tokenPath,
} from "~/server/oidc/service-tokens";
import type { Principal } from "~/server/web/auth";
import type { Machine } from "~/types";
function actor(email: string, kind = "oidc") {
  return { kind, profile: { email } } as Principal;
}
describe("owner-only MCP/API credentials", () => {
  it("only permits the Google owner, regardless of a delegate role", () => {
    expect(canOperateServices(actor("seuchong@gmail.com"))).toBe(true);
    for (const email of [
      "ffttyus@gmail.com",
      "mmold2005@gmail.com",
      "hubert2047@gmail.com",
      "yikaitang6@gmail.com",
    ])
      expect(canOperateServices(actor(email))).toBe(false);
    for (const kind of ["proxy", "api_key"])
      expect(canOperateServices(actor("seuchong@gmail.com", kind))).toBe(false);
  });
  it("stores only hashes, expires credentials and can revoke immediately", () => {
    const dir = mkdtempSync(join(tmpdir(), "mmold-keys-"));
    try {
      const { token, record } = createServiceToken(dir, "MCP test", 7);
      expect(readFileSync(tokenPath(dir), "utf8")).not.toContain(token);
      expect(record.hash).toBe(createHash("sha256").update(token).digest("hex"));
      expect(record.owner).toBe("seuchong@gmail.com");
      expect(record.expiresAt - record.createdAt).toBe(7 * 86400000);
      expect(() => createServiceToken(dir, "", 30)).toThrow();
      expect(() => createServiceToken(dir, "bad", 365)).toThrow();
      revokeServiceToken(dir, record.id);
      expect(readTokens(dir)).toEqual([]);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
  it("enforces the owner and origin on credential routes", async () => {
    for (const email of ["ffttyus@gmail.com", "mmold2005@gmail.com", "hubert2047@gmail.com"]) {
      const context = new RouterContextProvider();
      context.set(authContext, { require: async () => actor(email) } as never);
      const args = {
        context,
        request: new Request("https://mesh.mmold.com/admin/service-access"),
        params: {},
      } as never;
      await expect(loader(args)).rejects.toBeDefined();
      await expect(action(args)).rejects.toBeDefined();
    }
    const context = new RouterContextProvider();
    context.set(authContext, { require: async () => actor("seuchong@gmail.com") } as never);
    context.set(appConfigContext, { server: { base_url: "https://mesh.mmold.com" } } as never);
    await expect(
      action({
        context,
        params: {},
        request: new Request("https://mesh.mmold.com/admin/service-access", {
          method: "POST",
          headers: { Origin: "https://evil.example" },
        }),
      } as never),
    ).rejects.toBeDefined();
  });
  it("preserves disabled factory identity and validates safe Magic DNS names", () => {
    expect(deviceIdentity({ tags: ["tag:disabled-factory-ffttyus"] } as Machine)).toEqual({
      email: "ffttyus@gmail.com",
      role: "disabled-factory",
    });
    expect(validateDeviceName("plant-a-edge-01")).toBe("plant-a-edge-01");
    for (const name of ["A", "../admin", "x.local", "x y", "-edge", "edge-", "x".repeat(64)])
      expect(() => validateDeviceName(name)).toThrow();
  });
});
