import Button from "~/components/button";
import Dialog, { DialogPanel } from "~/components/dialog";
import Text from "~/components/text";
import Title from "~/components/title";
import type { PreAuthKey, User } from "~/types";

interface ExpireAuthKeyProps {
  authKey: PreAuthKey;
  user: User;
}

export default function ExpireAuthKey({ authKey, user }: ExpireAuthKeyProps) {
  return (
    <Dialog>
      <Button variant="heavy">使金鑰到期</Button>
      <DialogPanel variant="destructive">
        <Title>確定使授權金鑰到期？</Title>
        <input name="action_id" type="hidden" value="expire_preauthkey" />
        <input name="user_id" type="hidden" value={user.id} />
        <input name="key_id" type="hidden" value={authKey.id} />
        <input name="key" type="hidden" value={authKey.key} />
        <Text>
          Expiring this authentication key will immediately prevent it from being used to
          authenticate new devices. This action cannot be undone.
        </Text>
      </DialogPanel>
    </Dialog>
  );
}
