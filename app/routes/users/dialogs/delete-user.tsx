import Dialog, { DialogPanel } from "~/components/dialog";
import Text from "~/components/text";
import Title from "~/components/title";
import type { Machine, User } from "~/types";

interface DeleteProps {
  user: User;
  machines: Machine[];
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export default function DeleteUser({ user, machines, isOpen, setIsOpen }: DeleteProps) {
  const name = user.name || user.displayName;

  return (
    <Dialog isOpen={isOpen} onOpenChange={setIsOpen}>
      <DialogPanel variant={machines.length > 0 ? "unactionable" : "normal"}>
        <Title>刪除 {name}？</Title>
        {machines.length > 0 ? (
          <Text className="mb-6">
            使用者名下仍有裝置時無法刪除。請先移除裝置，或將裝置重新指派給其他使用者。
          </Text>
        ) : (
          <Text className="mb-6">
            使用者刪除後無法復原。
            {user.provider === "oidc" && (
              <p className="mt-4 text-sm text-mist-600 dark:text-mist-300">
                此使用者透過外部身分提供者驗證，再次登入時將重新建立帳號。
              </p>
            )}
          </Text>
        )}
        <input name="action_id" type="hidden" value="delete_user" />
        <input name="headscale_user_id" type="hidden" value={user.id} />
      </DialogPanel>
    </Dialog>
  );
}
