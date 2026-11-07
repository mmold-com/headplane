import Dialog, { DialogPanel } from "~/components/dialog";
import Notice from "~/components/notice";
import Text from "~/components/text";
import Title from "~/components/title";
import cn from "~/utils/cn";

interface LinkUserProps {
  headplaneUserId: string;
  displayName: string;
  headscaleUsers: { id: string; name: string }[];
  currentLink?: string;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export default function LinkUser({
  headplaneUserId,
  displayName,
  headscaleUsers,
  currentLink,
  isOpen,
  setIsOpen,
}: LinkUserProps) {
  return (
    <Dialog isOpen={isOpen} onOpenChange={setIsOpen}>
      <DialogPanel>
        <Title>為 {displayName} 連結 Headscale 使用者</Title>
        <Text className="mb-6">
          選擇此身分要連結的 Headscale 使用者。此設定決定可管理的裝置，並啟用自助操作功能。
        </Text>
        {headscaleUsers.length === 0 ? (
          <Notice>所有 Headscale 使用者均已連結至其他帳號。</Notice>
        ) : (
          <>
            <input name="action_id" type="hidden" value="link_user" />
            <input name="headplane_user_id" type="hidden" value={headplaneUserId} />
            <select
              className={cn(
                "w-full rounded-lg border p-2",
                "border-mist-200 dark:border-mist-700",
                "bg-mist-50 dark:bg-mist-900",
              )}
              defaultValue={currentLink ?? ""}
              name="headscale_user_id"
              required
            >
              <option value="">選擇 Headscale 使用者…</option>
              {headscaleUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                  {u.id === currentLink ? "（目前）" : ""}
                </option>
              ))}
            </select>
          </>
        )}
      </DialogPanel>
    </Dialog>
  );
}
