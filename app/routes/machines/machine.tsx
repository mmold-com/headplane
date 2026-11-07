import { CheckCircle, CircleSlash, Info, UserCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { data } from "react-router";

import Attribute from "~/components/attribute";
import Button from "~/components/button";
import Card from "~/components/card";
import Chip from "~/components/chip";
import Link from "~/components/link";
import StatusCircle from "~/components/status-circle";
import Tooltip from "~/components/tooltip";
import {
  agentsContext,
  authContext,
  headscaleConfigContext,
  headscaleContext,
  headscaleLiveStoreContext,
  requestApiContext,
} from "~/server/context";
import { nodesResource, usersResource } from "~/server/headscale/live-store";
import { Capabilities } from "~/server/web/roles";
import cn from "~/utils/cn";
import { getOSInfo, getTSVersion } from "~/utils/host-info";
import { extractTagOwnerTags, isNoExpiry, mapNodes, sortAssignableTags } from "~/utils/node-info";
import { getUserDisplayName } from "~/utils/user";

import type { Route } from "./+types/machine";
import { mapTagsToComponents, uiTagsForNode } from "./components/machine-row";
import MenuOptions from "./components/menu";
import Routes from "./dialogs/routes";
import { machineAction } from "./machine-actions";

export async function loader({ request, params, context }: Route.LoaderArgs) {
  const agentsFeature = context.get(agentsContext);
  const auth = context.get(authContext);
  const getRequestApi = context.get(requestApiContext);
  const headscale = context.get(headscaleContext);
  const headscaleConfig = context.get(headscaleConfigContext);
  const headscaleLiveStore = context.get(headscaleLiveStoreContext);

  if (!params.id) {
    throw new Error("未提供裝置 ID");
  }

  if (params.id.endsWith(".ico")) {
    throw data(null, { status: 204 });
  }

  const principal = await auth.require(request);

  if (!auth.can(principal, Capabilities.read_machines)) {
    throw new Error("你沒有檢視此頁面的權限，請聯絡管理者。");
  }

  const magic = headscaleConfig.getMagicDNSBaseDomain();

  const { api } = await getRequestApi(request);
  const [nodesSnap, usersSnap] = await Promise.all([
    headscaleLiveStore.get(nodesResource, api),
    headscaleLiveStore.get(usersResource, api),
  ]);
  const nodes = nodesSnap.data;
  const users = usersSnap.data;
  const node = nodes.find((node) => node.id === params.id);
  if (node == null) {
    throw data(null, { status: 404 });
  }

  const agents = agentsFeature.state === "enabled" ? agentsFeature.value : undefined;
  const [lookup, policyResult] = await Promise.allSettled([
    agents?.lookup([node.nodeKey]),
    api.policy.get(),
  ]);
  const stats = lookup.status === "fulfilled" ? lookup.value : undefined;
  const [enhancedNode] = mapNodes([node], stats);
  const tags = [...node.tags].toSorted();
  const supportsNodeOwnerChange = !headscale.capabilities.nodeOwnerIsImmutable;
  const supportsDisablingKeyExpiry = headscale.capabilities.keyExpiryCanBeDisabled;
  const agentSync = agents?.lastSync();
  const policy = policyResult.status === "fulfilled" ? policyResult.value.policy : undefined;

  return {
    agent: agentSync
      ? {
          syncedAt: agentSync.syncedAt?.toISOString() ?? null,
          nodeCount: agentSync.nodeCount,
          nodeKey: agents?.agentNodeKey(),
        }
      : undefined,
    existingTags: sortAssignableTags(nodes, policy),
    // `undefined` keeps the tag dialog from flagging every tag as undeclared.
    policyTags: extractTagOwnerTags(policy),
    magic,
    node: enhancedNode,
    stats: stats?.[enhancedNode.nodeKey],
    supportsNodeOwnerChange: supportsNodeOwnerChange,
    supportsDisablingKeyExpiry: supportsDisablingKeyExpiry,
    tags,
    users,
  };
}

export const action = machineAction;

export default function Page({
  loaderData: {
    node,
    tags,
    users,
    magic,
    agent,
    stats,
    existingTags,
    policyTags,
    supportsNodeOwnerChange,
    supportsDisablingKeyExpiry,
  },
}: Route.ComponentProps) {
  const [showRouting, setShowRouting] = useState(false);

  const uiTags = useMemo(() => {
    const tags = uiTagsForNode(node, agent?.nodeKey === node.nodeKey);
    return tags;
  }, [node, agent]);

  return (
    <div>
      <p className="text-md mb-8">
        <Link className="font-medium" to="/machines">
          所有裝置
        </Link>
        <span className="mx-2">/</span>
        {node.givenName}
      </p>
      <div
        className={cn(
          "flex justify-between items-center pb-2",
          "border-b border-mist-100 dark:border-mist-800",
        )}
      >
        <span className="flex items-baseline gap-x-4 text-sm">
          <h1 className="text-2xl font-medium">{node.givenName}</h1>
          <StatusCircle className="h-4 w-4" isOnline={node.online} />
        </span>
        <MenuOptions
          existingTags={existingTags}
          policyTags={policyTags}
          isFullButton
          magic={magic}
          node={node}
          users={users}
          supportsNodeOwnerChange={supportsNodeOwnerChange}
          supportsDisablingKeyExpiry={supportsDisablingKeyExpiry}
        />
      </div>
      <div className="mb-4 flex gap-1">
        <div className="border-r border-mist-100 p-2 pr-4 dark:border-mist-800">
          <span className="flex items-center gap-x-1 text-sm text-mist-600 dark:text-mist-300">
            管理者
            <Tooltip content="裝置預設沿用建立者的權限。">
              <Info className="p-1" />
            </Tooltip>
          </span>
          <div className="mt-1 flex items-center gap-x-2.5">
            <UserCircle />
            {node.user ? getUserDisplayName(node.user) : "由標籤管理"}
          </div>
        </div>
        <div className="p-2 pl-4">
          <p className="text-sm text-mist-600 dark:text-mist-300">狀態</p>
          <div className="mt-1 mb-8 flex gap-1">
            {mapTagsToComponents(node, uiTags)}
            {tags.map((tag) => (
              <Chip key={tag} text={tag} />
            ))}
          </div>
        </div>
      </div>
      <Routes isOpen={showRouting} node={node} setIsOpen={setShowRouting} />
      <h2 className="mt-8 text-xl font-medium">子網路與路由</h2>
      <div className="mb-4 flex items-center justify-between">
        <p>
          子網路可將實體網路路由提供給 Tailscale 使用。{" "}
          <Link external styled to="https://tailscale.com/kb/1019/subnets">
            了解更多
          </Link>
        </p>
        <Button onClick={() => setShowRouting(true)}>檢視</Button>
      </div>
      <Card
        className={cn(
          "w-full max-w-full grid sm:grid-cols-2",
          "md:grid-cols-4 gap-8 mr-2 text-sm mb-8",
        )}
        variant="flat"
      >
        <div>
          <span className="flex items-center gap-x-1 text-mist-600 dark:text-mist-300">
            已核准
            <Tooltip content="前往這些路由的流量會經由此裝置轉送。">
              <Info className="h-3.5 w-3.5" />
            </Tooltip>
          </span>
          <div className="mt-1">
            {node.customRouting.subnetApprovedRoutes.length === 0 ? (
              <span className="opacity-50">—</span>
            ) : (
              <ul className="leading-normal">
                {node.customRouting.subnetApprovedRoutes.map((route) => (
                  <li key={route}>{route}</li>
                ))}
              </ul>
            )}
          </div>
          <Button
            className="mt-1.5 px-1.5 py-0.5"
            onClick={() => setShowRouting(true)}
            variant="ghost"
          >
            編輯
          </Button>
        </div>
        <div>
          <span className="flex items-center gap-x-1 text-mist-600 dark:text-mist-300">
            待核准
            <Tooltip content="此裝置正在公告這些路由，必須先核准才能轉送流量。">
              <Info className="h-3.5 w-3.5" />
            </Tooltip>
          </span>
          <div className="mt-1">
            {node.customRouting.subnetWaitingRoutes.length === 0 ? (
              <span className="opacity-50">—</span>
            ) : (
              <ul className="leading-normal">
                {node.customRouting.subnetWaitingRoutes.map((route) => (
                  <li key={route}>{route}</li>
                ))}
              </ul>
            )}
          </div>
          <Button
            className="mt-1.5 px-1.5 py-0.5"
            onClick={() => setShowRouting(true)}
            variant="ghost"
          >
            編輯
          </Button>
        </div>
        <div>
          <span className="flex items-center gap-x-1 text-mist-600 dark:text-mist-300">
            出口節點
            <Tooltip content="此裝置是否可作為 Tailnet 的出口節點。">
              <Info className="h-3.5 w-3.5" />
            </Tooltip>
          </span>
          <div className="mt-1">
            {node.customRouting.exitRoutes.length === 0 ? (
              <span className="opacity-50">—</span>
            ) : node.customRouting.exitApproved ? (
              <span className="flex items-center gap-x-1">
                <CheckCircle className="h-3.5 w-3.5 text-green-700" />
                已允許
              </span>
            ) : (
              <span className="flex items-center gap-x-1">
                <CircleSlash className="h-3.5 w-3.5 text-red-700" />
                待核准
              </span>
            )}
          </div>
          <Button
            className="mt-1.5 px-1.5 py-0.5"
            onClick={() => setShowRouting(true)}
            variant="ghost"
          >
            編輯
          </Button>
        </div>
      </Card>
      <h2 className="text-xl font-medium">裝置詳細資料</h2>
      <p className="mb-4">此裝置的網路資訊，可用於排查連線問題。</p>
      <Card
        className="grid w-full max-w-full grid-cols-1 gap-y-2 sm:gap-x-12 lg:grid-cols-2"
        variant="flat"
      >
        <div className="flex flex-col gap-1">
          <Attribute
            name="建立者"
            value={node.user ? getUserDisplayName(node.user) : "由標籤管理"}
          />
          <Attribute name="裝置名稱" value={node.givenName} />
          <Attribute
            name="作業系統主機名稱"
            tooltip="OS hostname is published by the machine’s operating system and is used as the default name for the machine."
            value={node.name}
          />
          {stats ? (
            <>
              <Attribute name="OS" value={getOSInfo(stats)} />
              <Attribute name="Tailscale 版本" value={getTSVersion(stats)} />
            </>
          ) : undefined}
          <Attribute name="ID" tooltip="此裝置的識別碼，供 Headscale API 使用。" value={node.id} />
          <Attribute
            isCopyable
            name="節點金鑰"
            tooltip="用於唯一識別此裝置的公開金鑰。"
            value={node.nodeKey}
          />
          <Attribute name="建立時間" value={new Date(node.createdAt).toLocaleString()} />
          <Attribute
            name="上次連線"
            value={node.online ? "已連線" : new Date(node.lastSeen).toLocaleString()}
          />
          <Attribute
            name="金鑰到期時間"
            value={!isNoExpiry(node.expiry) ? new Date(node.expiry!).toLocaleString() : "永不到期"}
          />
          {magic ? (
            <Attribute isCopyable name="網域名稱" value={`${node.givenName}.${magic}`} />
          ) : undefined}
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-sm font-semibold text-mist-600 uppercase dark:text-mist-300">
            IP 位址
          </p>
          <Attribute
            isCopyable
            name="Tailscale IPv4"
            tooltip="此裝置在 Tailnet（私人 Tailscale 網路）中的 IPv4 位址。"
            value={getIpv4Address(node.ipAddresses)}
          />
          <Attribute
            isCopyable
            name="Tailscale IPv6"
            tooltip="此裝置在 Tailnet 中的 IPv6 位址。即使網際網路服務業者不支援 IPv6，Tailnet 內部連線仍可使用 IPv6。"
            value={getIpv6Address(node.ipAddresses)}
          />
          <Attribute
            isCopyable
            name="簡短網域名稱"
            tooltip="Tailnet 使用者可透過此 DNS 簡稱存取此裝置。"
            value={node.givenName}
          />
          {magic ? (
            <Attribute
              isCopyable
              name="完整網域名稱"
              tooltip="Tailnet 使用者可透過此完整 DNS 名稱存取此裝置。"
              value={`${node.givenName}.${magic}`}
            />
          ) : undefined}
          {stats?.Endpoints ? (
            <Attribute name="連線端點" value={stats?.Endpoints?.join("\n") ?? "—"} />
          ) : undefined}
          {stats ? (
            <>
              <p className="mt-4 text-sm font-semibold text-mist-600 uppercase dark:text-mist-300">
                用戶端連線狀態
              </p>
              <Attribute
                name="依目的地改變"
                tooltip="裝置是否位於會依目的地改變對外 IP 位址的 NAT 環境中。"
                value={stats.NetInfo?.MappingVariesByDestIP ? "是" : "否"}
              />
              <Attribute
                name="NAT 回送"
                tooltip="裝置是否需要透過 NAT 回送功能建立連線。"
                value={stats.NetInfo?.HairPinning ? "是" : "否"}
              />
              <Attribute name="IPv6" value={stats.NetInfo?.WorkingIPv6 ? "是" : "否"} />
              <Attribute name="UDP" value={stats.NetInfo?.WorkingUDP ? "是" : "否"} />
              <Attribute name="UPnP" value={stats.NetInfo?.UPnP ? "是" : "否"} />
              <Attribute name="PCP" value={stats.NetInfo?.PCP ? "是" : "否"} />
              <Attribute name="NAT-PMP" value={stats.NetInfo?.PMP ? "是" : "否"} />
            </>
          ) : undefined}
        </div>
      </Card>
    </div>
  );
}

function getIpv4Address(addresses: string[]) {
  for (const address of addresses) {
    if (address.startsWith("100.")) {
      // Return the first CGNAT address
      return address;
    }
  }

  return "—";
}

function getIpv6Address(addresses: string[]) {
  for (const address of addresses) {
    if (address.startsWith("fd")) {
      // Return the first IPv6 address
      return address;
    }
  }

  return "—";
}
