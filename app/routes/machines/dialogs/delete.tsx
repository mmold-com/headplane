import { useNavigate } from "react-router";

import Dialog, { DialogPanel } from "~/components/dialog";
import Text from "~/components/text";
import Title from "~/components/title";
import type { Machine } from "~/types";

interface DeleteProps {
  machine: Machine;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export default function Delete({ machine, isOpen, setIsOpen }: DeleteProps) {
  const navigate = useNavigate();

  return (
    <Dialog isOpen={isOpen} onOpenChange={setIsOpen}>
      <DialogPanel onSubmit={() => navigate("/machines")} variant="destructive">
        <Title>移除 {machine.givenName}</Title>
        <Text>此裝置將從網路中永久移除。若要重新加入，必須在裝置上重新驗證並登入 Tailnet。</Text>
        <input name="action_id" type="hidden" value="delete" />
        <input name="node_id" type="hidden" value={machine.id} />
      </DialogPanel>
    </Dialog>
  );
}
