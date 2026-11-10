import { describe, expect, it } from "vitest";

import {
  approvalTag,
  canApprove,
  deviceIdentity,
  MMOLD_APPROVERS,
} from "~/server/oidc/mmold-approval";
import { isMmoldApprover } from "~/server/oidc/mmold-owner";
import type { Principal } from "~/server/web/auth";
import { Capabilities } from "~/server/web/roles";
import type { Machine } from "~/types";

import { createTestAuth } from "../auth/create-auth";
const allowed = [
  "seuchong@gmail.com",
  "ffttyus@gmail.com",
  "mmold2005@gmail.com",
  "hubert2047@gmail.com",
  "yikaitang6@gmail.com",
];
const node = {
  id: "7",
  givenName: "factory-test",
  tags: [],
  user: { email: "ffttyus@gmail.com", provider: "oidc" },
} as unknown as Machine;
const identity = {
  issuer: "https://accounts.google.com",
  subject: "test",
  name: "test",
  username: "test",
  emailVerified: true,
};
function principal(email: string, kind = "oidc"): Principal {
  return { kind, profile: { email, name: email }, user: { role: "approver" } } as Principal;
}

describe("MMold three-person approval", () => {
  it.each(MMOLD_APPROVERS)("allows verified Google approver %s", (email) => {
    expect(isMmoldApprover({ ...identity, email }, "seuchong@gmail.com")).toBe(true);
    expect(canApprove(principal(email))).toBe(true);
  });
  it.each(["hubert2047@gmail.com", "yikaitang6@gmail.com", "other@gmail.com"])(
    "rejects non-approver %s",
    (email) => {
      expect(isMmoldApprover({ ...identity, email }, "seuchong@gmail.com")).toBe(false);
      expect(canApprove(principal(email))).toBe(false);
    },
  );
  it("rejects unverified identities, foreign issuers, proxies and API keys", () => {
    expect(
      isMmoldApprover({ ...identity, email: allowed[0], emailVerified: false }, allowed[0]),
    ).toBe(false);
    expect(
      isMmoldApprover(
        { ...identity, email: allowed[0], issuer: "https://example.com" },
        allowed[0],
      ),
    ).toBe(false);
    expect(canApprove(principal(allowed[0], "proxy"))).toBe(false);
    expect(canApprove({ kind: "api_key" } as Principal)).toBe(false);
  });
  it("uses the original Google account for a single purpose tag", () => {
    expect(deviceIdentity(node)?.role).toBe("pending");
    expect(approvalTag(node, "factory", allowed)).toBe("tag:factory-ffttyus");
    expect(approvalTag(node, "maintenance", allowed)).toBe("tag:maint-ffttyus");
  });
  it("rejects mixed roles, unknown identities, disabled accounts and tag injection", () => {
    expect(() =>
      approvalTag(
        { ...node, tags: ["tag:factory-ffttyus", "tag:maint-ffttyus"] },
        "maintenance",
        allowed,
      ),
    ).toThrow();
    expect(() => approvalTag({ ...node, tags: ["tag:unknown"] }, "maintenance", allowed)).toThrow();
    expect(() => approvalTag(node, "maintenance", [allowed[0]])).toThrow();
    expect(() => approvalTag(node, "tag:maint-seuchong", allowed)).toThrow();
  });
  it("does not grant general mutation or key generation to approvers", async () => {
    const { auth } = createTestAuth({ headscaleApiKey: "test-only" });
    await auth.findOrCreateUser("owner", { email: allowed[0] });
    const id = await auth.findOrCreateUser(
      "delegate",
      { email: allowed[1] },
      { initialRole: "approver" },
    );
    const cookie = await auth.createOidcSession(id, { name: "delegate", email: allowed[1] });
    const actor = await auth.require(
      new Request("http://localhost/", { headers: { Cookie: cookie.split(";")[0] } }),
    );
    expect(canApprove(actor)).toBe(true);
    for (const cap of [
      Capabilities.write_machines,
      Capabilities.write_policy,
      Capabilities.generate_authkeys,
      Capabilities.generate_own_authkeys,
      Capabilities.configure_iam,
    ])
      expect(auth.can(actor, cap)).toBe(false);
  });
});
