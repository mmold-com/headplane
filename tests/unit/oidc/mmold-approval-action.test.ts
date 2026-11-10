import { RouterContextProvider } from "react-router";
import { describe, expect, it, vi } from "vitest";

import { action } from "~/routes/approvals";
import {
  appConfigContext,
  authContext,
  headscaleConfigContext,
  headscaleLiveStoreContext,
  requestApiContext,
} from "~/server/context";
import type { Principal } from "~/server/web/auth";
import type { Machine } from "~/types";

const node = {
  id: "7",
  givenName: "edge-01",
  tags: [],
  user: { email: "ffttyus@gmail.com", provider: "oidc" },
} as unknown as Machine;
function scenario(
  email = "ffttyus@gmail.com",
  origin = "https://mesh.mmold.com",
  name = "edge-01",
  tags: string[] = [],
) {
  const context = new RouterContextProvider();
  const actor = { kind: "oidc", profile: { email }, user: { role: "approver" } } as Principal;
  const setTags = vi.fn();
  const expire = vi.fn();
  const api = { nodes: { get: vi.fn().mockResolvedValue({ ...node, tags }), setTags, expire } };
  context.set(authContext, { require: async () => actor } as never);
  context.set(appConfigContext, { server: { base_url: "https://mesh.mmold.com" } } as never);
  context.set(headscaleConfigContext, {
    getOIDCConfig: () => ({ allowedUsers: ["ffttyus@gmail.com"] }),
  } as never);
  context.set(headscaleLiveStoreContext, { refresh: vi.fn() } as never);
  context.set(requestApiContext, (async () => ({ principal: actor, api })) as never);
  function args(decision = "approve") {
    return {
      context,
      params: {},
      request: new Request("https://mesh.mmold.com/admin/approvals", {
        method: "POST",
        headers: { Origin: origin },
        body: new URLSearchParams({ node_id: "7", confirm_name: name, role: "factory", decision }),
      }),
    } as never;
  }
  return { args, setTags, expire };
}
describe("approval action boundary", () => {
  it("lets an approver grant exactly one account-bound role", async () => {
    const s = scenario();
    await action(s.args());
    expect(s.setTags).toHaveBeenCalledWith("7", ["tag:factory-ffttyus"]);
  });
  it.each([
    ["hubert2047@gmail.com", "https://mesh.mmold.com", "edge-01"],
    ["ffttyus@gmail.com", "https://evil.example", "edge-01"],
    ["ffttyus@gmail.com", "https://mesh.mmold.com", "wrong-node"],
  ])("rejects an unauthorized actor, CSRF or stale name", async (email, origin, name) => {
    const s = scenario(email, origin, name);
    await expect(action(s.args())).rejects.toBeDefined();
    expect(s.setTags).not.toHaveBeenCalled();
  });
  it("rejects only a pending request without deleting its audit identity", async () => {
    const s = scenario();
    await action(s.args("reject"));
    expect(s.expire).toHaveBeenCalledWith("7");
    expect(s.setTags).not.toHaveBeenCalled();
    const approved = scenario(undefined, undefined, undefined, ["tag:factory-ffttyus"]);
    await expect(action(approved.args("reject"))).rejects.toBeDefined();
    expect(approved.expire).not.toHaveBeenCalled();
  });
});
