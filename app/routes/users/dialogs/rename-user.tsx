import Dialog, { DialogPanel } from "~/components/dialog";
import Input from "~/components/input";
import Text from "~/components/text";
import Title from "~/components/title";
import { User } from "~/types";
import { USERNAME_PATTERN, USERNAME_RULE } from "~/utils/user";

interface RenameProps {
  user: User;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export default function RenameUser({ user, isOpen, setIsOpen }: RenameProps) {
  return (
    <Dialog isOpen={isOpen} onOpenChange={setIsOpen}>
      <DialogPanel>
        <Title>重新命名 {user.name || user.displayName}？</Title>
        <Text className="mb-6">
          輸入新的使用者名稱： {user.name || user.displayName}。變更使用者名稱後，引用舊名稱的 ACL
          原則不會自動更新。
        </Text>
        <input name="action_id" type="hidden" value="rename_user" />
        <input name="headscale_user_id" type="hidden" value={user.id} />
        <Input
          defaultValue={user.name}
          description={USERNAME_RULE}
          minLength={2}
          pattern={USERNAME_PATTERN}
          required
          title={USERNAME_RULE}
          label="使用者名稱"
          name="new_name"
          placeholder="my-new-name"
        />
      </DialogPanel>
    </Dialog>
  );
}
