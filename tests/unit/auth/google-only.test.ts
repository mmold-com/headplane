import { RouterContextProvider } from "react-router";
import { expect, it } from "vitest";

import { loginAction } from "../../../app/routes/auth/login/action";
import { appConfigContext } from "../../../app/server/context";

it("rejects a direct API-key login POST when Google-only mode is configured", async () => {
  const context = new RouterContextProvider();
  // Only config is set: rejection must happen before API or auth access.
  context.set(appConfigContext, { oidc: { disable_api_key_login: true } } as never);
  const request = new Request("https://vpn.mmold.com/admin/login", {
    method: "POST",
    body: new URLSearchParams({ api_key: "bypass-attempt" }),
  });
  await expect(loginAction({ request, context } as never)).rejects.toMatchObject({
    init: { status: 403 },
  });
});
