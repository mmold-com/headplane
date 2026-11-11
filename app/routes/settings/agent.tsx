import { data, useFetcher } from "react-router";

import Button from "~/components/button";
import Link from "~/components/link";
import Notice from "~/components/notice";
import StatusCircle from "~/components/status-circle";
import Text from "~/components/text";
import Title from "~/components/title";
import { agentsContext, appConfigContext, authContext } from "~/server/context";
import { canOperateServices } from "~/server/oidc/mmold-approval";
import { isSameOriginPost } from "~/server/web/csrf";
import { formatTimeDelta } from "~/utils/time";

import type { Route } from "./+types/agent";

export async function loader({ request, context }: Route.LoaderArgs) {
  const agents = context.get(agentsContext);
  const auth = context.get(authContext);

  const principal = await auth.require(request);
  if (!canOperateServices(principal)) throw data("僅主要管理者可操作 Agent", { status: 403 });

  if (agents.state !== "enabled") {
    return { enabled: false as const, reason: agents.reason };
  }

  const sync = agents.value.lastSync();
  return {
    enabled: true as const,
    syncedAt: sync.syncedAt?.toISOString() ?? null,
    nodeCount: sync.nodeCount,
    error: sync.error,
    authUrl: sync.authUrl,
  };
}

export async function action({ request, context }: Route.ActionArgs) {
  const agents = context.get(agentsContext);
  const auth = context.get(authContext);

  const principal = await auth.require(request);
  if (!canOperateServices(principal)) throw data("僅主要管理者可操作 Agent", { status: 403 });

  if (!isSameOriginPost(request, context.get(appConfigContext).server.base_url!))
    throw data("要求來源不符", { status: 403 });

  if (agents.state !== "enabled") {
    return { success: false, error: agents.reason };
  }

  await agents.value.triggerSync();
  const sync = agents.value.lastSync();
  return {
    success: !sync.error,
    error: sync.error,
    authUrl: sync.authUrl,
  };
}

export default function Page({ loaderData }: Route.ComponentProps) {
  const fetcher = useFetcher<typeof action>();
  const isSyncing = fetcher.state !== "idle";

  if (!loaderData.enabled) {
    return (
      <div className="flex max-w-(--breakpoint-lg) flex-col gap-8">
        <Title>Headplane Agent</Title>
        <Notice title="Agent 尚未啟用">
          {loaderData.reason}。設定方式請參閱
          <Link external styled to="https://headplane.net/features/agent">
            官方說明
          </Link>
        </Notice>
      </div>
    );
  }

  const isPending = !loaderData.syncedAt && loaderData.authUrl;
  const hasError = Boolean(loaderData.error);

  return (
    <div className="flex max-w-(--breakpoint-lg) flex-col gap-8">
      <div className="flex w-full flex-col sm:w-2/3">
        <Title>Headplane Agent</Title>
        <Text>Headplane Agent 可同步裝置的作業系統版本與連線詳細資料。</Text>
      </div>

      <div className="flex items-center gap-3">
        <StatusCircle isOnline={!hasError && !isPending} className="h-5 w-5" />
        <span className="text-lg font-medium">
          {hasError ? "同步異常" : isPending ? "等待核准" : "同步正常"}
        </span>
      </div>

      <div className="flex flex-col gap-2">
        <Text>
          <span className="font-medium">上次同步： </span>
          {loaderData.syncedAt ? (
            <span suppressHydrationWarning>{formatTimeDelta(new Date(loaderData.syncedAt))}</span>
          ) : (
            "尚未同步"
          )}
        </Text>
        <Text>
          <span className="font-medium">已同步節點： </span>
          {loaderData.nodeCount}
        </Text>
      </div>

      {isPending ? (
        <Notice variant="warning" title="Agent 等待核准">
          Agent 正等待系統節點註冊核准。Headplane 會嘗試自動核准；若未成功，可開啟
          <Link external styled to={loaderData.authUrl!}>
            註冊連結
          </Link>
          。
        </Notice>
      ) : undefined}

      {loaderData.error ? (
        <Notice variant="error" title="同步失敗">
          {loaderData.error}
        </Notice>
      ) : undefined}

      <fetcher.Form method="post">
        <Button type="submit" variant="heavy" disabled={isSyncing}>
          {isSyncing ? "同步中…" : "立即同步"}
        </Button>
      </fetcher.Form>
    </div>
  );
}
