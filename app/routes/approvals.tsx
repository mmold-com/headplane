import { data, Form } from "react-router";

import {
  appConfigContext,
  authContext,
  headscaleConfigContext,
  headscaleLiveStoreContext,
  requestApiContext,
} from "~/server/context";
import { nodesResource } from "~/server/headscale/live-store";
import { approvalTag, canApprove, deviceIdentity } from "~/server/oidc/mmold-approval";
import log from "~/utils/log";

import type { Route } from "./+types/approvals";

export async function loader({ request, context }: Route.LoaderArgs) {
  const principal = await context.get(authContext).require(request);
  if (!canApprove(principal))
    throw data("只有指定三位 Google 核准人員可以使用此頁面", { status: 403 });
  const { api } = await context.get(requestApiContext)(request);
  const nodes = await api.nodes.list();
  return {
    nodes: nodes.map((node) => ({
      id: node.id,
      name: node.givenName,
      ip: node.ipAddresses.join("、"),
      online: node.online,
      identity: deviceIdentity(node),
      tags: node.tags,
    })),
  };
}

export async function action({ request, context }: Route.ActionArgs) {
  const principal = await context.get(authContext).require(request);
  if (!canApprove(principal)) throw data("無設備核准權限", { status: 403 });
  const config = context.get(appConfigContext);
  if (
    request.method !== "POST" ||
    request.headers.get("Origin") !== new URL(config.server.base_url!).origin
  )
    throw data("要求來源不符", { status: 403 });
  const form = await request.formData();
  const id = String(form.get("node_id") ?? "");
  if (!/^\d+$/.test(id)) throw data("設備 ID 不正確", { status: 400 });
  const { api } = await context.get(requestApiContext)(request);
  const node = await api.nodes.get(id);
  if (node.givenName !== String(form.get("confirm_name")))
    throw data("設備已變更，請重新整理後核對", { status: 409 });
  const identity = deviceIdentity(node);
  const kind = String(form.get("decision"));
  if (kind === "reject") {
    if (identity?.role !== "pending") throw data("僅可拒絕尚未核准的申請", { status: 400 });
    await api.nodes.expire(id);
  } else if (kind === "approve") {
    const role = String(form.get("role"));
    let tag: string;
    try {
      tag = approvalTag(
        node,
        role,
        context.get(headscaleConfigContext).getOIDCConfig()!.allowedUsers,
      );
    } catch (error) {
      throw data(String(error), { status: 400 });
    }
    await api.nodes.setTags(id, [tag]);
  } else throw data("操作不正確", { status: 400 });
  log.info(
    "auth",
    "device_approval actor=%s node=%s account=%s decision=%s role=%s",
    principal.kind === "oidc" ? principal.profile.email : "",
    id,
    identity?.email,
    kind,
    form.get("role"),
  );
  await context.get(headscaleLiveStoreContext).refresh(nodesResource, api);
  return { message: kind === "approve" ? "設備已核准，權限已套用" : "申請已拒絕，設備已設為到期" };
}

export default function Approvals({ loaderData, actionData }: Route.ComponentProps) {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-medium">設備核准</h1>
      <p>
        僅 seuchong@gmail.com、ffttyus@gmail.com、mmold2005@gmail.com 可核准。Google
        驗證後先列為待核准；核准維護用途後可連工廠 TCP 22 與 443，工廠之間隔離。
      </p>
      <p>
        請先向現場核對設備名稱、VPN IP、Google
        帳號與實際用途，再選擇角色。請勿將工廠伺服器核准為維護端。
      </p>
      {actionData?.message && (
        <p role="status" className="rounded border p-3">
          {actionData.message}
        </p>
      )}
      {!loaderData.nodes.length && (
        <p>目前尚無設備申請。請先由設備透過 Tailscale 完成 Google 驗證。</p>
      )}
      {loaderData.nodes.map((node) => (
        <div key={node.id} className="flex flex-col gap-2 rounded-lg border p-4">
          <h2 className="font-bold">{node.name}</h2>
          <p>
            {node.ip} · {node.online ? "已連線" : "離線"}
          </p>
          <p>
            {node.identity?.email ?? "無法辨識的設備身分"} ·{" "}
            {node.identity?.role === "pending"
              ? "待核准（無工廠存取權）"
              : node.identity?.role === "maint"
                ? "已核准：維護設備"
                : node.identity?.role === "factory"
                  ? "已核准：工廠設備"
                  : "需人工檢查"}
          </p>
          {node.identity && (
            <Form method="post" className="flex flex-wrap items-center gap-3">
              <input type="hidden" name="node_id" value={node.id} />
              <input type="hidden" name="confirm_name" value={node.name} />
              <label>
                核准用途：
                <select
                  name="role"
                  defaultValue={node.identity.role === "factory" ? "factory" : "maintenance"}
                  className="rounded border bg-transparent p-2"
                >
                  <option value="maintenance">維護設備（可連工廠 SSH／HTTPS）</option>
                  {node.identity.email !== "seuchong@gmail.com" && (
                    <option value="factory">工廠設備（僅接受維護連線）</option>
                  )}
                </select>
              </label>
              <button
                className="rounded border px-3 py-2"
                type="submit"
                name="decision"
                value="approve"
              >
                核對完成，核准此用途
              </button>
              {node.identity.role === "pending" && (
                <button
                  className="rounded border px-3 py-2"
                  type="submit"
                  name="decision"
                  value="reject"
                >
                  拒絕申請
                </button>
              )}
            </Form>
          )}
        </div>
      ))}
    </div>
  );
}
