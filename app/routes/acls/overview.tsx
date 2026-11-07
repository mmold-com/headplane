import {
  AlertCircle,
  Construction,
  Eye,
  FlaskConical,
  Pencil,
  Shield,
  TagsIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import { Suspense, lazy, useEffect, useMemo, useState } from "react";
import { isRouteErrorResponse, useFetcher, useRevalidator } from "react-router";

import Button from "~/components/button";
import Card from "~/components/card";
import Code from "~/components/code";
import Link from "~/components/link";
import Notice from "~/components/notice";
import PageError from "~/components/page-error";
import { Tabs, TabsList, TabsPanel, TabsTab } from "~/components/tabs";
import { isApiError } from "~/server/headscale/api/error-client";
import {
  parsePolicy,
  policyDestinations,
  policySources,
  serializePolicy,
  type Policy,
} from "~/utils/acl-policy";
import toast from "~/utils/toast";

import type { Route } from "./+types/overview";
import { aclAction } from "./acl-action";
import { aclLoader } from "./acl-loader";
import Fallback from "./components/fallback";
import RulesEditor from "./components/rules-editor";
import TagsGroupsEditor from "./components/tags-groups-editor";

const LazyEditor = lazy(() =>
  import("./components/cm.client").then((m) => ({ default: m.Editor })),
);
const LazyDiffer = lazy(() =>
  import("./components/cm.client").then((m) => ({ default: m.Differ })),
);

export const loader = aclLoader;
export const action = aclAction;

export default function Page({
  loaderData: { access, writable, policy, users, tagUsage },
}: Route.ComponentProps) {
  const [codePolicy, setCodePolicy] = useState(policy);
  const fetcher = useFetcher<typeof action>();
  const { revalidate } = useRevalidator();
  const disabled = !access || !writable; // Disable if no permission or not writable

  const parsed = useMemo(() => parsePolicy(codePolicy), [codePolicy]);
  const sources = useMemo(
    () => (parsed.ok ? policySources(parsed.policy, users) : []),
    [parsed, users],
  );
  const destinations = useMemo(
    () => (parsed.ok ? policyDestinations(parsed.policy, users) : []),
    [parsed, users],
  );

  useEffect(() => {
    // Update the codePolicy when the loader data changes
    if (policy !== codePolicy) {
      setCodePolicy(policy);
    }
  }, [policy]);

  useEffect(() => {
    if (!fetcher.data) {
      // No data yet, return
      return;
    }

    if (fetcher.data.success === true) {
      toast("原則已更新");
      revalidate();
    }
  }, [fetcher.data]);

  // The structured editors round-trip through the policy text, so the file
  // editor, the diff view and Save all work off one source of truth.
  function applyPolicy(next: Policy) {
    setCodePolicy(serializePolicy(next));
  }

  function structuredPanel(render: (value: Policy) => ReactNode) {
    if (!parsed.ok) {
      return (
        <div className="p-4">
          <Notice title="無法以視覺化方式編輯此原則" variant="error">
            無法解析原則 ({parsed.error}). 請在 <Code>編輯檔案</Code>{" "}
            分頁修正後，即可重新使用視覺化編輯器。
          </Notice>
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-4 p-4">
        {parsed.hasComments ? (
          <Notice title="註解將被移除" variant="warning">
            此原則含有註解。儲存視覺化編輯器中的變更會重寫原則並移除註解。
          </Notice>
        ) : null}
        {render(parsed.policy)}
      </div>
    );
  }

  return (
    <div>
      {!access ? (
        <Notice title="ACL 原則權限受限" variant="warning">
          你沒有編輯存取控制清單的權限，請聯絡管理者申請權限或協助修改 ACL 原則。
        </Notice>
      ) : !writable ? (
        <Notice title="唯讀 ACL 原則" variant="error">
          Headscale 設定中的 ACL 原則模式可能設為 <Code>file</Code> ，因此無法透過網頁介面編輯 ACL
          檔案。若要啟用網頁管理，請將 Headscale 設定中的 <Code>policy.mode</Code> 設為{" "}
          <Code>database</Code>。
        </Notice>
      ) : undefined}
      <h1 className="mb-4 text-2xl font-medium">存取控制清單（ACL）</h1>
      <p className="mb-4 max-w-prose">
        ACL 檔案用於定義網路的存取控制規則。詳細資訊請參閱{" "}
        <Link external styled to="https://tailscale.com/kb/1018/acls">
          Tailscale ACL 指南
        </Link>{" "}
        與{" "}
        <Link external styled to="https://headscale.net/stable/ref/acls/">
          Headscale 文件
        </Link>
        .
      </p>
      {fetcher.data?.error !== undefined ? (
        <Notice title={fetcher.data.error.split(":")[0] ?? "錯誤"} variant="error">
          {fetcher.data.error.split(":").slice(1).join(": ") ?? "更新 ACL 原則時發生未知錯誤。"}
        </Notice>
      ) : undefined}
      <Tabs className="mb-4" label="ACL 編輯器" defaultValue="rules">
        <TabsList>
          <TabsTab value="rules">
            <div className="flex items-center gap-2">
              <Shield className="p-1" />
              <span>規則</span>
            </div>
          </TabsTab>
          <TabsTab value="tags">
            <div className="flex items-center gap-2">
              <TagsIcon className="p-1" />
              <span>標籤與群組</span>
            </div>
          </TabsTab>
          <TabsTab value="edit">
            <div className="flex items-center gap-2">
              <Pencil className="p-1" />
              <span>編輯檔案</span>
            </div>
          </TabsTab>
          <TabsTab value="diff">
            <div className="flex items-center gap-2">
              <Eye className="p-1" />
              <span>預覽變更</span>
            </div>
          </TabsTab>
          <TabsTab value="preview">
            <div className="flex items-center gap-2">
              <FlaskConical className="p-1" />
              <span>預覽規則</span>
            </div>
          </TabsTab>
        </TabsList>
        <TabsPanel value="rules">
          {structuredPanel((value) => (
            <RulesEditor
              destinations={destinations}
              isDisabled={disabled}
              onChange={applyPolicy}
              policy={value}
              sources={sources}
            />
          ))}
        </TabsPanel>
        <TabsPanel value="tags">
          {structuredPanel((value) => (
            <TagsGroupsEditor
              isDisabled={disabled}
              onChange={applyPolicy}
              policy={value}
              tagUsage={tagUsage}
              users={users}
            />
          ))}
        </TabsPanel>
        <TabsPanel value="edit">
          <Suspense fallback={<Fallback />}>
            <LazyEditor isDisabled={disabled} onChange={setCodePolicy} value={codePolicy} />
          </Suspense>
        </TabsPanel>
        <TabsPanel value="diff">
          <Suspense fallback={<Fallback />}>
            <LazyDiffer left={policy} right={codePolicy} />
          </Suspense>
        </TabsPanel>
        <TabsPanel value="preview">
          <div className="flex flex-col items-center py-8">
            <Construction />
            <p className="mt-4 w-1/2 text-center">規則預覽功能仍在開發中，目前尚無法使用。</p>
          </div>
        </TabsPanel>
      </Tabs>
      <Button
        className="mr-2"
        disabled={
          disabled || fetcher.state !== "idle" || codePolicy.length === 0 || codePolicy === policy
        }
        onClick={() => {
          const formData = new FormData();
          formData.append("policy", codePolicy);
          fetcher.submit(formData, { method: "PATCH" });
        }}
        variant="heavy"
      >
        儲存
      </Button>
      <Button
        disabled={disabled || fetcher.state !== "idle" || codePolicy === policy}
        onClick={() => {
          // Reset the editor to the original policy
          setCodePolicy(policy);
        }}
      >
        捨棄變更
      </Button>
    </div>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  if (
    isRouteErrorResponse(error) &&
    isApiError(error.data) &&
    error.data.rawData.includes("reading policy from path") &&
    error.data.rawData.includes("no such file or directory")
  ) {
    return (
      <div className="flex flex-col gap-4">
        <Card className="max-w-2xl" variant="flat">
          <div className="flex items-center justify-between gap-4">
            <Card.Title>無法取得 ACL 原則</Card.Title>
            <AlertCircle className="mb-2 h-6 w-6 text-red-500" />
          </div>
          <Card.Text>
            伺服器上找不到原則檔案，因此目前無法讀取 ACL 原則。這通常表示 Headscale 使用{" "}
            <Code>file</Code> 模式管理 ACL，但指定的原則檔案不存在。
          </Card.Text>
        </Card>
        <Card className="max-w-2xl" variant="flat">
          <Card.Text>可採取下列其中一種方式處理：</Card.Text>
          <ul className="mt-2 ml-4 list-outside list-disc space-y-1 text-sm">
            <li>在 Headscale 設定所指定的路徑建立 ACL 原則檔案。</li>
            <li>
              或將 Headscale 的 ACL 原則模式切換為 <Code>database</Code> ，讓 Headplane
              可直接透過網頁介面管理 ACL 原則。
            </li>
          </ul>
        </Card>
      </div>
    );
  }

  return <PageError error={error} page="存取控制" />;
}
