import { useState } from "react";

import Dialog, { DialogPanel } from "~/components/dialog";
import Select from "~/components/select";
import Text from "~/components/text";
import Title from "~/components/title";
import type { Machine, User } from "~/types";
import { getUserDisplayName, sortUsersByDisplayName } from "~/utils/user";

interface MoveProps {
  machine: Machine;
  users: User[];
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export default function Move({ machine, users, isOpen, setIsOpen }: MoveProps) {
  const [userId, setUserId] = useState<string | null>(machine.user?.id ?? null);

  return (
    <Dialog isOpen={isOpen} onOpenChange={setIsOpen}>
      <DialogPanel isDisabled={userId === machine.user?.id}>
        <Title>Change the owner of {machine.givenName}</Title>
        <Text>裝置擁有者為與該裝置關聯的使用者。</Text>
        <input name="action_id" type="hidden" value="reassign" />
        <input name="node_id" type="hidden" value={machine.id} />
        <input name="user_id" type="hidden" value={userId?.toString()} />
        <Select
          defaultValue={machine.user?.id}
          required
          label="擁有者"
          name="user"
          onValueChange={(key) => {
            setUserId(key);
          }}
          placeholder="選擇使用者"
          items={sortUsersByDisplayName(users).map((user) => ({
            value: user.id,
            label: getUserDisplayName(user),
          }))}
        />
      </DialogPanel>
    </Dialog>
  );
}
