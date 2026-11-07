import { type } from "arktype";

import Button from "~/components/button";
import Dialog, { DialogPanel } from "~/components/dialog";
import Input from "~/components/input";
import Text from "~/components/text";
import Title from "~/components/title";
import { useForm } from "~/hooks/use-form";

const userSchema = type({
  user: "string > 0",
});

interface AddUserProps {
  users: string[];
  isDisabled?: boolean;
}

export default function AddUser({ users, isDisabled }: AddUserProps) {
  const form = useForm({
    schema: userSchema,
    validate: (values) => {
      const user = (values.user as string).trim();
      if (user.length === 0) return undefined;

      if (users.includes(user)) {
        return { user: "此帳號已在白名單中。" };
      }

      return undefined;
    },
  });

  return (
    <Dialog>
      <Button disabled={isDisabled}>新增核准帳號</Button>
      <DialogPanel>
        <Title>新增核准帳號</Title>
        <Text className="mb-4">
          新增經管理者核准的 Google 電子郵件帳號，允許該帳號登入並註冊 VPN 裝置。
        </Text>
        <input name="action_id" type="hidden" value="add_user" />
        <Input
          {...form.field("user")}
          description="輸入核准使用的完整 Google 電子郵件地址。"
          required
          label="核准的 Google 電子郵件"
          placeholder="name@gmail.com"
        />
      </DialogPanel>
    </Dialog>
  );
}
