import Button from "~/components/button";
import Dialog, { DialogPanel } from "~/components/dialog";
import Input from "~/components/input";
import Text from "~/components/text";
import Title from "~/components/title";
import { USERNAME_PATTERN, USERNAME_RULE } from "~/utils/user";

interface CreateUserProps {
  isOidc?: boolean;
  isDisabled?: boolean;
}

export default function CreateUser({ isOidc, isDisabled }: CreateUserProps) {
  return (
    <Dialog>
      <Button disabled={isDisabled}>建立使用者</Button>
      <DialogPanel>
        <Title>建立 Headscale 使用者</Title>
        <Text className="mb-6">
          此操作會在 Headscale 建立新使用者。使用者會先顯示於「尚未連結的 Headscale
          使用者」區段，待登入後
          {isOidc ? "透過 OIDC 身分提供者驗證" : ""} 自動連結至 Headplane 帳號。
        </Text>
        <input name="action_id" type="hidden" value="create_user" />
        <div className="flex flex-col gap-4">
          <Input
            description={USERNAME_RULE}
            minLength={2}
            pattern={USERNAME_PATTERN}
            required
            title={USERNAME_RULE}
            label="使用者名稱"
            name="username"
            placeholder="my-new-user"
            type="text"
          />
          <Input label="顯示名稱" name="display_name" placeholder="John Doe" type="text" />
          <Input label="電子郵件" name="email" placeholder="name@example.com" type="email" />
        </div>
      </DialogPanel>
    </Dialog>
  );
}
