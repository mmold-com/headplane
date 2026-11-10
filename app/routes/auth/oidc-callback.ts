import { data, redirect } from "react-router";

import {
  appConfigContext,
  authContext,
  headscaleApiKeyContext,
  headscaleContext,
  oidcContext,
} from "~/server/context";
import { headscaleErrorMessage } from "~/server/headscale/api/error-client";
import { isMmoldOwner, isMmoldApprover } from "~/server/oidc/mmold-owner";
import { logOidcError } from "~/server/oidc/provider";
import { findHeadscaleUserBySubject } from "~/server/web/headscale-identity";
import { Roles } from "~/server/web/roles";
import log from "~/utils/log";
import { createOidcStateCookie } from "~/utils/oidc-state";

import type { Route } from "./+types/oidc-callback";

export async function loader({ request, context, url }: Route.LoaderArgs) {
  const auth = context.get(authContext);
  const config = context.get(appConfigContext);
  const headscale = context.get(headscaleContext);
  const headscaleApiKey = context.get(headscaleApiKeyContext);
  const oidc = context.get(oidcContext);

  if (oidc.state !== "enabled") {
    throw data(`OIDC is unavailable: ${oidc.reason}`, { status: 501 });
  }
  const service = oidc.value;

  if (url.searchParams.toString().length === 0) {
    log.warn("auth", "Called OIDC callback without query parameters");
    return redirect("/login?s=error_no_query");
  }

  const cookie = createOidcStateCookie(config);
  const oidcCookieState = await cookie.parse(request.headers.get("Cookie"));

  if (oidcCookieState == null) {
    log.warn("auth", "Called OIDC callback without session cookie");
    return redirect("/login?s=error_no_session");
  }

  const { state, nonce, redirect_uri, verifier } = oidcCookieState;
  if (!state || !nonce || !redirect_uri || !verifier) {
    log.warn("auth", "OIDC session cookie is missing required fields");
    return redirect("/login?s=error_invalid_session");
  }

  const flowState = {
    state,
    nonce,
    codeVerifier: verifier,
    redirectUri: redirect_uri,
  };

  const result = await service.handleCallback(url.searchParams, flowState);
  if (!result.ok) {
    logOidcError("OIDC callback failed", result.error);
    return redirect("/login?s=error_auth_failed");
  }

  const identity = result.value;
  if (!isMmoldApprover(identity, process.env.MMOLD_OWNER_EMAIL)) {
    log.warn("auth", "MMold management login denied: verified Google owner required");
    throw data(
      "此管理介面僅限三位 Google 設備核准人員使用。一般使用者請從 Tailscale 提出設備申請。",
      {
        status: 403,
      },
    );
  }
  const mmoldDelegate =
    !!process.env.MMOLD_OWNER_EMAIL && !isMmoldOwner(identity, process.env.MMOLD_OWNER_EMAIL);
  if (mmoldDelegate && !(await auth.listUsers()).some((user) => user.role === "owner")) {
    throw data("請先由 seuchong@gmail.com 初始化管理者帳號", { status: 403 });
  }
  const claimedRole = mmoldDelegate
    ? "approver"
    : identity.role && identity.role !== "owner" && identity.role in Roles
      ? identity.role
      : undefined;

  const userId = await auth.findOrCreateUser(
    identity.subject,
    {
      name: identity.name,
      email: identity.email,
      picture: identity.picture,
    },
    {
      initialRole: claimedRole ?? config.oidc?.default_role,
      syncRole: claimedRole,
    },
  );

  try {
    // Looks up the Headscale user that matches this OIDC identity. We use
    // the configured admin API key here — not a per-request one — because
    // there is no per-request key yet (the session is being created).
    const hsApi = headscale.client(headscaleApiKey!);
    const hsUsers = await hsApi.users.list();
    const hsUser = findHeadscaleUserBySubject(hsUsers, identity.subject, identity.email);
    if (hsUser) {
      await auth.linkHeadscaleUser(userId, hsUser.id);
    }
  } catch (error) {
    log.warn(
      "auth",
      "Failed to link Headscale user: %s",
      headscaleErrorMessage(error) ?? String(error),
    );
  }

  // Only persist the id_token when RP-initiated logout is enabled — otherwise
  // we'd be storing a credential we never use.
  const idToken = config.oidc?.use_end_session ? identity.idToken : undefined;

  return redirect("/", {
    headers: {
      "Set-Cookie": await auth.createOidcSession(
        userId,
        {
          name: identity.name,
          email: identity.email,
          username: identity.username,
        },
        { idToken },
      ),
    },
  });
}
