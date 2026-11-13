import { RouterContextProvider } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";

import { loader } from "~/routes/auth/oidc-callback";
import { loader as serviceAccessLoader } from "~/routes/service-access";
import {
  appConfigContext,
  authContext,
  headscaleApiKeyContext,
  headscaleContext,
  oidcContext,
} from "~/server/context";
import { canOperateServices } from "~/server/oidc/mmold-approval";

import { createTestAuth } from "../auth/create-auth";
vi.mock("~/utils/oidc-state", () => ({
  createOidcStateCookie: () => ({
    parse: async () => ({
      state: "test",
      nonce: "test",
      redirect_uri: "https://mesh.mmold.com/admin/oidc/callback",
      verifier: "test",
    }),
  }),
}));
afterEach(() => vi.unstubAllEnvs());
async function scenario(email = "ffttyus@gmail.com") {
  vi.stubEnv("MMOLD_OWNER_EMAIL", "seuchong@gmail.com");
  const { auth } = createTestAuth({ headscaleApiKey: "ci-only" });
  await auth.findOrCreateUser("owner", { email: "seuchong@gmail.com" });
  const context = new RouterContextProvider();
  context.set(authContext, auth);
  context.set(appConfigContext, {
    server: { base_url: "https://mesh.mmold.com" },
    oidc: { default_role: "member" },
  } as never);
  context.set(headscaleApiKeyContext, "ci-only");
  context.set(headscaleContext, { client: () => ({ users: { list: async () => [] } }) } as never);
  context.set(oidcContext, {
    state: "enabled",
    value: {
      handleCallback: async () => ({
        ok: true,
        value: {
          issuer: "https://accounts.google.com",
          emailVerified: true,
          subject: "delegate-sub",
          email,
          name: "Juang Stanley",
          role: "admin",
        },
      }),
    },
  } as never);
  const url = new URL("https://mesh.mmold.com/admin/oidc/callback?state=test&code=test");
  const args = { context, params: {}, url, request: new Request(url) } as never;
  return { auth, context, args };
}
describe("MMold actual OIDC callback role persistence", () => {
  it("retains an owner's manually assigned admin over repeated Google callbacks and still denies MCP/API credential management", async () => {
    const s = await scenario();
    const id = await s.auth.findOrCreateUser(
      "delegate-sub",
      { email: "ffttyus@gmail.com" },
      { initialRole: "approver" },
    );
    await s.auth.reassignUser(id, "admin");
    let response: Response | undefined;
    for (let i = 0; i < 3; i++) response = await loader(s.args);
    expect(await s.auth.roleForSubject("delegate-sub")).toBe("admin");
    const request = new Request("https://mesh.mmold.com/admin/service-access", {
      headers: { Cookie: response!.headers.get("Set-Cookie")!.split(";")[0] },
    });
    const principal = await s.auth.require(request);
    expect(principal.kind !== "api_key" && principal.user.role).toBe("admin");
    expect(canOperateServices(principal)).toBe(false);
    await expect(
      serviceAccessLoader({ context: s.context, params: {}, request } as never),
    ).rejects.toBeDefined();
    await s.auth.reassignUser(id, "approver");
    await loader(s.args);
    expect(await s.auth.roleForSubject("delegate-sub")).toBe("approver");
  });
  it("defaults a new permitted delegate to approver even if a role claim says admin", async () => {
    const s = await scenario("mmold2005@gmail.com");
    await loader(s.args);
    expect(await s.auth.roleForSubject("delegate-sub")).toBe("approver");
  });
  it("still rejects a Google account outside the three management accounts", async () => {
    const s = await scenario("hubert2047@gmail.com");
    await expect(loader(s.args)).rejects.toBeDefined();
    expect(await s.auth.roleForSubject("delegate-sub")).toBeUndefined();
  });
});
