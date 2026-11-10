import { data, Form } from "react-router";

import { appConfigContext, authContext } from "~/server/context";
import { canOperateServices } from "~/server/oidc/mmold-approval";
import { createServiceToken, readTokens, revokeServiceToken } from "~/server/oidc/service-tokens";
import log from "~/utils/log";

import type { Route } from "./+types/service-access";

const secureHeaders = { "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" };
export function headers() {
  return secureHeaders;
}

export async function loader({ request, context }: Route.LoaderArgs) {
  const principal = await context.get(authContext).require(request);
  if (!canOperateServices(principal))
    throw data("僅 seuchong@gmail.com 可操作 MCP／API", { status: 403 });
  return data(
    {
      tokens: readTokens(context.get(appConfigContext).server.data_path).map(
        ({ hash: _hash, ...r }) => r,
      ),
    },
    { headers: secureHeaders },
  );
}
export async function action({ request, context }: Route.ActionArgs) {
  const principal = await context.get(authContext).require(request);
  if (!canOperateServices(principal)) throw data("無 MCP／API 權限", { status: 403 });
  const config = context.get(appConfigContext);
  if (
    request.method !== "POST" ||
    request.headers.get("Origin") !== new URL(config.server.base_url!).origin
  )
    throw data("要求來源不符", { status: 403 });
  const form = await request.formData();
  const decision = String(form.get("decision"));
  if (decision === "revoke") {
    const id = String(form.get("id"));
    revokeServiceToken(config.server.data_path, id);
    log.info("auth", "service_token_revoke actor=seuchong@gmail.com id=%s", id);
    return data({ token: undefined, message: "金鑰已撤銷" }, { headers: secureHeaders });
  }
  if (decision !== "create") throw data("操作不正確", { status: 400 });
  let result;
  try {
    result = createServiceToken(
      config.server.data_path,
      String(form.get("label") ?? ""),
      Number(form.get("days")),
    );
  } catch (error) {
    throw data(String(error), { status: 400 });
  }
  log.info("auth", "service_token_create actor=seuchong@gmail.com id=%s", result.record.id);
  return data(
    { token: result.token, message: "金鑰只顯示這一次，請存入你使用的密碼管理工具。" },
    { headers: secureHeaders },
  );
}
export default function ServiceAccess({ loaderData, actionData }: Route.ComponentProps) {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-medium">MCP／API 專用金鑰</h1>
      <p>
        僅 seuchong@gmail.com 經 Google
        驗證後可建立或撤銷。其餘帳號無權操作；請勿將金鑰分享給其他人。
      </p>
      <p>MCP： https://mesh.mmold.com/mcp　API： https://mesh.mmold.com/api/v1/node</p>
      <p>連線時使用 Authorization: Bearer 專用金鑰。舊 Headscale 金鑰不能用於公開 MCP／API。</p>
      {actionData && (
        <div role="status" className="rounded border p-3">
          <p>{actionData.message}</p>
          {actionData.token && <code className="break-all select-all">{actionData.token}</code>}
        </div>
      )}
      <Form method="post" className="flex flex-wrap items-center gap-3">
        <label>
          用途名稱：
          <input
            name="label"
            required
            maxLength={80}
            className="rounded border bg-transparent p-2"
          />
        </label>
        <label>
          有效期間：
          <select name="days" defaultValue="7" className="rounded border bg-transparent p-2">
            <option value="1">1 天</option>
            <option value="7">7 天</option>
            <option value="30">30 天</option>
          </select>
        </label>
        <button name="decision" value="create" className="rounded border px-3 py-2">
          建立專用金鑰
        </button>
      </Form>
      {loaderData.tokens.map((t) => (
        <Form key={t.id} method="post" className="flex flex-wrap gap-3 rounded border p-3">
          <input type="hidden" name="id" value={t.id} />
          <span>
            {t.label} · 到期：{new Date(t.expiresAt).toISOString()} ·{" "}
            {t.expiresAt > Date.now() ? "有效" : "已到期"}
          </span>
          <button name="decision" value="revoke" className="underline">
            撤銷
          </button>
        </Form>
      ))}
    </div>
  );
}
