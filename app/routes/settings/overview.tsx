import { ArrowRight } from "lucide-react";

import Link from "~/components/link";
import PageError from "~/components/page-error";
import { headscaleConfigContext } from "~/server/context";

import type { Route } from "./+types/overview";

export async function loader({ context }: Route.LoaderArgs) {
  const headscaleConfig = context.get(headscaleConfigContext);

  return {
    config: headscaleConfig.writable(),
    hasOidcConfig: headscaleConfig.hasOIDCConfig(),
  };
}

export default function Page({ loaderData: { config, hasOidcConfig } }: Route.ComponentProps) {
  return (
    <div className="flex max-w-(--breakpoint-lg) flex-col gap-8">
      <div className="flex w-full flex-col sm:w-2/3">
        <h1 className="mb-4 text-2xl font-medium">設定</h1>
        <p>管理 VPN 的帳號核准、裝置授權與連線設定。</p>
      </div>
      <div className="flex w-full flex-col sm:w-2/3">
        <h1 className="mb-4 text-2xl font-medium">預先授權金鑰</h1>
        <p>
          管理裝置註冊使用的預先授權金鑰。一般使用者應使用 Google
          登入並經管理者核准；金鑰整合方式請參閱{" "}
          <Link external styled to="https://tailscale.com/kb/1085/auth-keys/">
            Tailscale 使用說明
          </Link>
        </p>
      </div>
      <Link to="/settings/auth-keys">
        <div className="flex items-center text-lg font-medium">
          管理預先授權金鑰
          <ArrowRight className="ml-2 h-5 w-5" />
        </div>
      </Link>
      <div className="flex w-full flex-col sm:w-2/3">
        <h1 className="mb-4 text-2xl font-medium">Headplane Agent</h1>
        <p>Headplane Agent 可同步裝置的作業系統版本與連線詳細資料。</p>
      </div>
      <Link to="/settings/agent">
        <div className="flex items-center text-lg font-medium">
          Agent 設定
          <ArrowRight className="ml-2 h-5 w-5" />
        </div>
      </Link>
      {config && hasOidcConfig ? (
        <>
          <div className="flex w-full flex-col sm:w-2/3">
            <h1 className="mb-4 text-2xl font-medium">登入核准白名單</h1>
            <p>
              依核准的電子郵件帳號限制 VPN 註冊。此部署由管理者逐一核准帳號；管理介面僅限指定的
              Google 管理者登入。{" "}
              <Link external styled to="https://headscale.net/stable/ref/oidc/#basic-configuration">
                了解更多
              </Link>
            </p>
          </div>
          <Link to="/settings/restrictions">
            <div className="flex items-center text-lg font-medium">
              管理核准白名單
              <ArrowRight className="ml-2 h-5 w-5" />
            </div>
          </Link>
        </>
      ) : undefined}
    </div>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  return <PageError error={error} page="Settings" />;
}
