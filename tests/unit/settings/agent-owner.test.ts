import { RouterContextProvider } from "react-router";
import { describe, expect, it, vi } from "vitest";

import { loader, action } from "~/routes/settings/agent";
import { agentsContext, appConfigContext, authContext } from "~/server/context";
function fixture(email: string, origin = "https://mesh.mmold.com") {
  const context = new RouterContextProvider();
  const sync = vi.fn();
  context.set(authContext, {
    require: async () => ({ kind: "oidc", profile: { email } }),
  } as never);
  context.set(appConfigContext, { server: { base_url: "https://mesh.mmold.com" } } as never);
  context.set(agentsContext, {
    state: "enabled",
    value: { triggerSync: sync, lastSync: () => ({ syncedAt: new Date(), nodeCount: 2 }) },
  } as never);
  return {
    sync,
    args: {
      context,
      params: {},
      request: new Request("https://mesh.mmold.com/admin/settings/agent", {
        method: "POST",
        headers: { Origin: origin },
      }),
    } as never,
  };
}
describe("Agent owner control", () => {
  it.each(["ffttyus@gmail.com", "mmold2005@gmail.com", "hubert2047@gmail.com"])(
    "denies %s",
    async (email) => {
      const f = fixture(email);
      await expect(loader(f.args)).rejects.toBeDefined();
      await expect(action(f.args)).rejects.toBeDefined();
      expect(f.sync).not.toHaveBeenCalled();
    },
  );
  it("permits owner sync and rejects cross-origin requests", async () => {
    const f = fixture("seuchong@gmail.com");
    await action(f.args);
    expect(f.sync).toHaveBeenCalledOnce();
    const bad = fixture("seuchong@gmail.com", "https://evil.example");
    await expect(action(bad.args)).rejects.toBeDefined();
    expect(bad.sync).not.toHaveBeenCalled();
  });
});
